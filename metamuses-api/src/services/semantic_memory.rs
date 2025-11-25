use crate::models::{Fact, Message};
use anyhow::{Context, Result};
use fastembed::{EmbeddingModel, InitOptions, TextEmbedding};
use qdrant_client::prelude::*;
use qdrant_client::qdrant::{
    CreateCollection, Distance, SearchPoints, VectorParams, VectorsConfig,
};
use std::sync::Arc;
use uuid::Uuid;

/// Semantic memory service for vector-based memory retrieval
pub struct SemanticMemoryService {
    qdrant: Arc<QdrantClient>,
    embedder: Arc<TextEmbedding>,
    collection_name: String,
}

impl SemanticMemoryService {
    /// Create a new SemanticMemoryService
    pub async fn new(qdrant_url: &str, collection_name: &str) -> Result<Self> {
        let qdrant = Arc::new(QdrantClient::from_url(qdrant_url).build()?);

        // Initialize FastEmbed model (BGE-small-en-v1.5, 384 dimensions)
        let embedder = Arc::new(TextEmbedding::try_new(
            InitOptions::new(EmbeddingModel::BGESmallENV15).with_show_download_progress(true),
        )?);

        let service = Self {
            qdrant,
            embedder,
            collection_name: collection_name.to_string(),
        };

        // Ensure collection exists
        service.ensure_collection().await?;

        Ok(service)
    }

    /// Ensure collection exists in Qdrant
    async fn ensure_collection(&self) -> Result<()> {
        // Check if collection exists
        let collections = self.qdrant.list_collections().await?;
        let exists = collections
            .collections
            .iter()
            .any(|c| c.name == self.collection_name);

        if !exists {
            // Create collection with 384 dimensions (BGE-small-en-v1.5)
            self.qdrant
                .create_collection(&CreateCollection {
                    collection_name: self.collection_name.clone(),
                    vectors_config: Some(VectorsConfig {
                        config: Some(qdrant_client::qdrant::vectors_config::Config::Params(
                            VectorParams {
                                size: 384,
                                distance: Distance::Cosine.into(),
                                ..Default::default()
                            },
                        )),
                    }),
                    ..Default::default()
                })
                .await?;
        }

        Ok(())
    }

    /// Store message embedding in Qdrant
    pub async fn store_message(&self, message: &Message) -> Result<()> {
        // Generate embedding
        let embeddings = self.embedder.embed(vec![message.content.clone()], None)?;

        if embeddings.is_empty() {
            return Ok(());
        }

        let vector = embeddings[0].clone();

        // Store in Qdrant
        use qdrant_client::qdrant::Value;
        use std::collections::HashMap;

        let mut payload = HashMap::new();
        payload.insert(
            "companion_id".to_string(),
            Value::from(message.companion_id.to_string()),
        );
        payload.insert(
            "user_address".to_string(),
            Value::from(message.user_address.clone()),
        );
        payload.insert("role".to_string(), Value::from(message.role.clone()));
        payload.insert("content".to_string(), Value::from(message.content.clone()));
        payload.insert(
            "created_at".to_string(),
            Value::from(message.created_at.timestamp()),
        );

        let point = PointStruct::new(message.id.to_string(), vector, payload);

        self.qdrant
            .upsert_points_blocking(self.collection_name.clone(), None, vec![point], None)
            .await?;

        Ok(())
    }

    /// Search for similar messages
    pub async fn search_similar_messages(
        &self,
        query: &str,
        companion_id: Uuid,
        limit: usize,
    ) -> Result<Vec<ScoredMessage>> {
        // Generate query embedding
        let embeddings = self.embedder.embed(vec![query.to_string()], None)?;

        if embeddings.is_empty() {
            return Ok(Vec::new());
        }

        let query_vector = embeddings[0].clone();

        // Search in Qdrant with filter
        let search_result = self
            .qdrant
            .search_points(&SearchPoints {
                collection_name: self.collection_name.clone(),
                vector: query_vector,
                limit: limit as u64,
                with_payload: Some(true.into()),
                filter: Some(qdrant_client::qdrant::Filter {
                    must: vec![qdrant_client::qdrant::Condition {
                        condition_one_of: Some(
                            qdrant_client::qdrant::condition::ConditionOneOf::Field(
                                qdrant_client::qdrant::FieldCondition {
                                    key: "companion_id".to_string(),
                                    r#match: Some(qdrant_client::qdrant::Match {
                                        match_value: Some(
                                            qdrant_client::qdrant::r#match::MatchValue::Keyword(
                                                companion_id.to_string(),
                                            ),
                                        ),
                                    }),
                                    ..Default::default()
                                },
                            ),
                        ),
                    }],
                    ..Default::default()
                }),
                ..Default::default()
            })
            .await?;

        let mut results = Vec::new();

        for scored_point in search_result.result {
            let payload = scored_point.payload;

            // Extract string value from Qdrant Value enum
            let content = payload
                .get("content")
                .and_then(|v| v.kind.as_ref())
                .and_then(|k| match k {
                    qdrant_client::qdrant::value::Kind::StringValue(s) => Some(s.clone()),
                    _ => None,
                })
                .unwrap_or_default();

            let role = payload
                .get("role")
                .and_then(|v| v.kind.as_ref())
                .and_then(|k| match k {
                    qdrant_client::qdrant::value::Kind::StringValue(s) => Some(s.clone()),
                    _ => None,
                })
                .unwrap_or_else(|| "user".to_string());

            let created_at = payload
                .get("created_at")
                .and_then(|v| v.kind.as_ref())
                .and_then(|k| match k {
                    qdrant_client::qdrant::value::Kind::IntegerValue(i) => Some(*i),
                    _ => None,
                })
                .unwrap_or(0);

            results.push(ScoredMessage {
                content,
                role,
                score: scored_point.score,
                created_at,
            });
        }

        Ok(results)
    }

    /// Get relevant facts for a query
    pub async fn get_relevant_context(
        &self,
        query: &str,
        companion_id: Uuid,
        limit: usize,
    ) -> Result<Vec<String>> {
        let messages = self
            .search_similar_messages(query, companion_id, limit)
            .await?;

        Ok(messages
            .into_iter()
            .filter(|m| m.score > 0.7) // Only include high-confidence matches
            .map(|m| format!("{}: {}", m.role, m.content))
            .collect())
    }

    /// Delete all embeddings for a companion
    pub async fn delete_companion_embeddings(&self, companion_id: Uuid) -> Result<()> {
        use qdrant_client::qdrant::points_selector::PointsSelectorOneOf;
        use qdrant_client::qdrant::PointsSelector;

        let filter = qdrant_client::qdrant::Filter {
            must: vec![qdrant_client::qdrant::Condition {
                condition_one_of: Some(qdrant_client::qdrant::condition::ConditionOneOf::Field(
                    qdrant_client::qdrant::FieldCondition {
                        key: "companion_id".to_string(),
                        r#match: Some(qdrant_client::qdrant::Match {
                            match_value: Some(qdrant_client::qdrant::r#match::MatchValue::Keyword(
                                companion_id.to_string(),
                            )),
                        }),
                        ..Default::default()
                    },
                )),
            }],
            ..Default::default()
        };

        let selector = PointsSelector {
            points_selector_one_of: Some(PointsSelectorOneOf::Filter(filter)),
        };

        self.qdrant
            .delete_points(self.collection_name.clone(), None, &selector, None)
            .await?;

        Ok(())
    }
}

/// Scored message from semantic search
#[derive(Debug, Clone)]
pub struct ScoredMessage {
    pub content: String,
    pub role: String,
    pub score: f32,
    pub created_at: i64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Requires Qdrant server
    async fn test_semantic_memory_creation() {
        let result = SemanticMemoryService::new("http://localhost:6334", "test_collection").await;
        assert!(result.is_ok());
    }

    #[test]
    fn test_scored_message_structure() {
        let scored = ScoredMessage {
            content: "Test content".to_string(),
            role: "user".to_string(),
            score: 0.95,
            created_at: 1234567890,
        };

        assert_eq!(scored.score, 0.95);
        assert!(scored.score > 0.7);
    }
}
