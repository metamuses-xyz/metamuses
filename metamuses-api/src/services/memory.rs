use crate::db::{CompanionRepository, MessageRepository};
use crate::models::{Companion, Fact, Message};
use anyhow::{Context, Result};
use redis::{AsyncCommands, Client as RedisClient};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

/// Memory service for managing conversation context
/// - Short-term: Redis (last 10-20 messages)
/// - Long-term: PostgreSQL (all messages)
/// - Semantic: Qdrant (relevant memories - Phase 2.2)
pub struct MemoryService {
    redis_client: Arc<RedisClient>,
    message_repo: MessageRepository,
    companion_repo: CompanionRepository,
    pub pool: PgPool,
}

impl MemoryService {
    /// Create a new MemoryService
    pub fn new(redis_client: Arc<RedisClient>, pool: PgPool) -> Self {
        Self {
            redis_client,
            message_repo: MessageRepository::new(pool.clone()),
            companion_repo: CompanionRepository::new(pool.clone()),
            pool,
        }
    }

    /// Store a message in both short-term (Redis) and long-term (PostgreSQL)
    pub async fn store_message(&self, message: &Message) -> Result<()> {
        // 1. Store in PostgreSQL (long-term)
        self.message_repo
            .create(message)
            .await
            .context("Failed to store message in database")?;

        // 2. Store in Redis (short-term cache)
        let redis_key = Self::redis_messages_key(message.companion_id);
        let mut conn = self
            .redis_client
            .get_multiplexed_async_connection()
            .await
            .context("Failed to get Redis connection")?;

        // Serialize message as JSON
        let message_json = serde_json::to_string(message).context("Failed to serialize message")?;

        // Add to Redis list (LPUSH for newest first)
        conn.lpush::<_, _, ()>(&redis_key, &message_json)
            .await
            .context("Failed to push message to Redis")?;

        // Keep only last 20 messages
        conn.ltrim::<_, ()>(&redis_key, 0, 19)
            .await
            .context("Failed to trim Redis list")?;

        // Set expiry (24 hours)
        conn.expire::<_, ()>(&redis_key, 86400)
            .await
            .context("Failed to set Redis expiry")?;

        Ok(())
    }

    /// Get recent messages from cache (Redis first, fallback to PostgreSQL)
    pub async fn get_recent_messages(
        &self,
        companion_id: Uuid,
        limit: usize,
    ) -> Result<Vec<Message>> {
        // Try Redis first
        match self.get_from_redis(companion_id, limit).await {
            Ok(messages) if !messages.is_empty() => {
                tracing::debug!("Retrieved {} messages from Redis cache", messages.len());
                return Ok(messages);
            }
            _ => {
                tracing::debug!("Redis cache miss, falling back to database");
            }
        }

        // Fallback to PostgreSQL
        let messages = self
            .message_repo
            .get_recent(companion_id, limit as i64)
            .await
            .context("Failed to get messages from database")?;

        // Warm up Redis cache
        if !messages.is_empty() {
            let _ = self.warm_redis_cache(companion_id, &messages).await;
        }

        Ok(messages)
    }

    /// Get messages from Redis
    async fn get_from_redis(&self, companion_id: Uuid, limit: usize) -> Result<Vec<Message>> {
        let redis_key = Self::redis_messages_key(companion_id);
        let mut conn = self.redis_client.get_multiplexed_async_connection().await?;

        let messages_json: Vec<String> = conn.lrange(&redis_key, 0, (limit - 1) as isize).await?;

        let mut messages = Vec::new();
        for json in messages_json {
            match serde_json::from_str::<Message>(&json) {
                Ok(msg) => messages.push(msg),
                Err(e) => {
                    tracing::warn!("Failed to deserialize message from Redis: {}", e);
                    continue;
                }
            }
        }

        // Reverse to get chronological order (oldest first)
        messages.reverse();

        Ok(messages)
    }

    /// Warm up Redis cache with messages
    async fn warm_redis_cache(&self, companion_id: Uuid, messages: &[Message]) -> Result<()> {
        let redis_key = Self::redis_messages_key(companion_id);
        let mut conn = self.redis_client.get_multiplexed_async_connection().await?;

        // Clear existing cache
        let _: () = conn.del(&redis_key).await?;

        // Add messages in reverse order (newest first in Redis)
        for message in messages.iter().rev() {
            let message_json = serde_json::to_string(message)?;
            let _: () = conn.lpush(&redis_key, &message_json).await?;
        }

        // Set expiry (24 hours)
        let _: () = conn.expire(&redis_key, 86400).await?;

        Ok(())
    }

    /// Build conversation context for prompt
    pub async fn build_context(
        &self,
        companion_id: Uuid,
        user_address: &str,
        max_messages: usize,
    ) -> Result<ConversationContext> {
        // Get companion
        let companion = self
            .companion_repo
            .get_by_id(companion_id)
            .await
            .context("Failed to get companion")?
            .ok_or_else(|| anyhow::anyhow!("Companion not found"))?;

        // Get recent messages
        let messages = self.get_recent_messages(companion_id, max_messages).await?;

        // Get relevant facts (Phase 2.2 - for now, return empty)
        let facts = Vec::new();

        Ok(ConversationContext {
            companion,
            messages,
            facts,
            user_address: user_address.to_string(),
        })
    }

    /// Clear conversation cache for a companion
    pub async fn clear_cache(&self, companion_id: Uuid) -> Result<()> {
        let redis_key = Self::redis_messages_key(companion_id);
        let mut conn = self.redis_client.get_multiplexed_async_connection().await?;

        let _: () = conn
            .del(&redis_key)
            .await
            .context("Failed to delete Redis cache")?;

        Ok(())
    }

    /// Get conversation statistics
    pub async fn get_conversation_stats(&self, companion_id: Uuid) -> Result<ConversationStats> {
        let total_messages = self
            .message_repo
            .count_by_companion(companion_id)
            .await
            .context("Failed to count messages")?;

        let cached_messages = self
            .get_from_redis(companion_id, 20)
            .await
            .map(|msgs| msgs.len())
            .unwrap_or(0);

        Ok(ConversationStats {
            total_messages: total_messages as usize,
            cached_messages,
            cache_hit_rate: if total_messages > 0 {
                (cached_messages as f64 / total_messages.min(20) as f64) * 100.0
            } else {
                0.0
            },
        })
    }

    /// Redis key for companion messages
    fn redis_messages_key(companion_id: Uuid) -> String {
        format!("companion:{}:messages", companion_id)
    }
}

/// Conversation context for building prompts
#[derive(Debug, Clone)]
pub struct ConversationContext {
    pub companion: Companion,
    pub messages: Vec<Message>,
    pub facts: Vec<Fact>,
    pub user_address: String,
}

impl ConversationContext {
    /// Format messages for prompt
    pub fn format_messages(&self) -> String {
        self.messages
            .iter()
            .map(|msg| format!("{}: {}", msg.role, msg.content))
            .collect::<Vec<_>>()
            .join("\n")
    }

    /// Get message count
    pub fn message_count(&self) -> usize {
        self.messages.len()
    }

    /// Check if this is the first conversation
    pub fn is_first_conversation(&self) -> bool {
        self.messages.is_empty()
    }
}

/// Conversation statistics
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ConversationStats {
    pub total_messages: usize,
    pub cached_messages: usize,
    pub cache_hit_rate: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_redis_key_format() {
        let companion_id = Uuid::new_v4();
        let key = MemoryService::redis_messages_key(companion_id);
        assert!(key.starts_with("companion:"));
        assert!(key.ends_with(":messages"));
    }

    #[test]
    fn test_conversation_context_format() {
        use crate::models::Traits;

        let companion = Companion {
            id: Uuid::new_v4(),
            nft_token_id: 1,
            owner_address: "0x123".to_string(),
            name: "Test".to_string(),
            creativity: 50,
            wisdom: 50,
            humor: 50,
            empathy: 50,
            logic: 50,
            level: 1,
            experience_points: 0,
            description: None,
            avatar_url: None,
            metadata_uri: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let messages = vec![
            Message::user(companion.id, "0x123".to_string(), "Hello".to_string()),
            Message::assistant(
                companion.id,
                "0x123".to_string(),
                "Hi!".to_string(),
                None,
                None,
                None,
            ),
        ];

        let context = ConversationContext {
            companion,
            messages,
            facts: Vec::new(),
            user_address: "0x123".to_string(),
        };

        assert_eq!(context.message_count(), 2);
        assert!(!context.is_first_conversation());

        let formatted = context.format_messages();
        assert!(formatted.contains("user: Hello"));
        assert!(formatted.contains("assistant: Hi!"));
    }
}
