use crate::models::{Message, MessageHistory};
use anyhow::{Context, Result};
use sqlx::PgPool;
use uuid::Uuid;

pub struct MessageRepository {
    pool: PgPool,
}

impl MessageRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Create a new message
    pub async fn create(&self, message: &Message) -> Result<Message> {
        let msg = sqlx::query_as::<_, Message>(
            r#"
            INSERT INTO messages (
                id, companion_id, user_address, role, content,
                model_name, tokens_used, latency_ms, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            "#,
        )
        .bind(message.id)
        .bind(message.companion_id)
        .bind(message.user_address.to_lowercase())
        .bind(&message.role)
        .bind(&message.content)
        .bind(&message.model_name)
        .bind(message.tokens_used)
        .bind(message.latency_ms)
        .bind(message.created_at)
        .fetch_one(&self.pool)
        .await
        .context("Failed to create message")?;

        Ok(msg)
    }

    /// Get message by ID
    pub async fn get_by_id(&self, id: Uuid) -> Result<Option<Message>> {
        let message = sqlx::query_as::<_, Message>("SELECT * FROM messages WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .context("Failed to get message by id")?;

        Ok(message)
    }

    /// Get recent messages for a companion
    pub async fn get_recent(&self, companion_id: Uuid, limit: i64) -> Result<Vec<Message>> {
        let messages = sqlx::query_as::<_, Message>(
            r#"
            SELECT * FROM messages
            WHERE companion_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            "#,
        )
        .bind(companion_id)
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .context("Failed to get recent messages")?;

        // Reverse to get chronological order (oldest first)
        Ok(messages.into_iter().rev().collect())
    }

    /// Get message history with pagination
    pub async fn get_history(
        &self,
        companion_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<MessageHistory> {
        let messages = sqlx::query_as::<_, Message>(
            r#"
            SELECT * FROM messages
            WHERE companion_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(companion_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .context("Failed to get message history")?;

        let total =
            sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM messages WHERE companion_id = $1")
                .bind(companion_id)
                .fetch_one(&self.pool)
                .await
                .context("Failed to count messages")?;

        let has_more = (offset + limit) < total;

        Ok(MessageHistory {
            messages,
            total,
            has_more,
        })
    }

    /// Get all messages between user and companion
    pub async fn get_conversation(
        &self,
        companion_id: Uuid,
        user_address: &str,
        limit: i64,
    ) -> Result<Vec<Message>> {
        let messages = sqlx::query_as::<_, Message>(
            r#"
            SELECT * FROM messages
            WHERE companion_id = $1 AND user_address = $2
            ORDER BY created_at DESC
            LIMIT $3
            "#,
        )
        .bind(companion_id)
        .bind(user_address.to_lowercase())
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .context("Failed to get conversation")?;

        Ok(messages.into_iter().rev().collect())
    }

    /// Count messages for a companion
    pub async fn count_by_companion(&self, companion_id: Uuid) -> Result<i64> {
        let count =
            sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM messages WHERE companion_id = $1")
                .bind(companion_id)
                .fetch_one(&self.pool)
                .await
                .context("Failed to count messages")?;

        Ok(count)
    }

    /// Delete all messages for a companion (for testing or cleanup)
    pub async fn delete_by_companion(&self, companion_id: Uuid) -> Result<u64> {
        let result = sqlx::query("DELETE FROM messages WHERE companion_id = $1")
            .bind(companion_id)
            .execute(&self.pool)
            .await
            .context("Failed to delete messages")?;

        Ok(result.rows_affected())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::create_pool;
    use crate::models::MessageRole;

    async fn setup_test_pool() -> PgPool {
        let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
            "postgresql://postgres:postgres@localhost:5432/metamuses_test".to_string()
        });

        create_pool(&database_url)
            .await
            .expect("Failed to create pool")
    }

    #[tokio::test]
    #[ignore] // Requires database
    async fn test_message_crud() {
        let pool = setup_test_pool().await;
        let repo = MessageRepository::new(pool);

        let companion_id = Uuid::new_v4();
        let message = Message::user(companion_id, "0xtest123".to_string(), "Hello!".to_string());

        let created = repo
            .create(&message)
            .await
            .expect("Failed to create message");
        assert_eq!(created.content, "Hello!");

        let fetched = repo
            .get_by_id(created.id)
            .await
            .expect("Failed to get message");
        assert!(fetched.is_some());

        let count = repo
            .count_by_companion(companion_id)
            .await
            .expect("Failed to count");
        assert_eq!(count, 1);
    }
}
