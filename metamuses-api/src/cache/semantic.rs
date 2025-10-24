// Semantic Cache Implementation
// Uses Qdrant for vector similarity search and FastEmbed for embeddings

use anyhow::{Context, Result};
use chrono::Utc;
use fastembed::{EmbeddingModel, InitOptions, TextEmbedding};
use qdrant_client::qdrant::{
    CreateCollectionBuilder, DeletePointsBuilder, Distance, PointStruct, ScrollPointsBuilder,
    SearchPointsBuilder, UpsertPointsBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tracing::{debug, info};
use uuid::Uuid;

// ============================================================================
// Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CachePayload {
    query: String,
    response: String,
    created_at: i64, // Unix timestamp
    ttl_seconds: i64,
}

// ============================================================================
// Semantic Cache
// ============================================================================

pub struct SemanticCache {
    qdrant: Arc<Qdrant>,
    embedding_model: Arc<Mutex<TextEmbedding>>,
    collection_name: String,
    similarity_threshold: f32,
    ttl: Duration,
    embedding_dim: u64,
}

impl SemanticCache {
    /// Creates a new semantic cache instance
    ///
    /// # Arguments
    /// * `qdrant_url` - Qdrant server URL (e.g., "http://localhost:6334")
    /// * `collection_name` - Name of the Qdrant collection to use
    /// * `similarity_threshold` - Cosine similarity threshold (0.0-1.0, typically 0.90-0.95)
    /// * `ttl_hours` - Time-to-live for cache entries in hours
    pub async fn new(
        qdrant_url: &str,
        collection_name: String,
        similarity_threshold: f32,
        ttl_hours: u64,
    ) -> Result<Self> {
        info!(
            "Initializing semantic cache - collection: {}, threshold: {}, ttl: {}h",
            collection_name, similarity_threshold, ttl_hours
        );

        // Connect to Qdrant
        let qdrant = Qdrant::from_url(qdrant_url)
            .build()
            .context("Failed to connect to Qdrant")?;
        info!("✓ Connected to Qdrant at {}", qdrant_url);

        // Initialize FastEmbed model
        info!("Loading FastEmbed model (BGE-small-en-v1.5)...");
        let embedding_model = TextEmbedding::try_new(
            InitOptions::new(EmbeddingModel::BGESmallENV15).with_show_download_progress(true),
        )
        .context("Failed to initialize FastEmbed model")?;

        let embedding_dim = 384; // BGE-small-en-v1.5 produces 384-dimensional vectors
        info!("✓ FastEmbed model loaded (dimension: {})", embedding_dim);

        let cache = Self {
            qdrant: Arc::new(qdrant),
            embedding_model: Arc::new(Mutex::new(embedding_model)),
            collection_name: collection_name.clone(),
            similarity_threshold,
            ttl: Duration::from_secs(ttl_hours * 3600),
            embedding_dim,
        };

        // Initialize collection
        cache.init_collection().await?;

        info!("✓ Semantic cache fully initialized");
        Ok(cache)
    }

    /// Initializes or verifies the Qdrant collection exists
    async fn init_collection(&self) -> Result<()> {
        // Check if collection exists
        let collections = self
            .qdrant
            .list_collections()
            .await
            .context("Failed to list Qdrant collections")?;

        let collection_exists = collections
            .collections
            .iter()
            .any(|c| c.name == self.collection_name);

        if collection_exists {
            info!("Collection '{}' already exists", self.collection_name);
            return Ok(());
        }

        // Create collection
        info!("Creating collection '{}'...", self.collection_name);

        self.qdrant
            .create_collection(
                CreateCollectionBuilder::new(&self.collection_name)
                    .vectors_config(
                        VectorParamsBuilder::new(self.embedding_dim, Distance::Cosine).build(),
                    )
                    .build(),
            )
            .await
            .context("Failed to create Qdrant collection")?;

        info!("✓ Collection '{}' created successfully", self.collection_name);
        Ok(())
    }

    /// Generates embedding vector for a text query
    async fn generate_embedding(&self, text: &str) -> Result<Vec<f32>> {
        let model = self.embedding_model.lock().await;

        let embeddings = model
            .embed(vec![text], None)
            .context("Failed to generate embeddings")?;

        // FastEmbed returns a Vec<Vec<f32>>, we take the first one
        embeddings
            .into_iter()
            .next()
            .context("No embeddings returned from FastEmbed")
    }

    /// Searches for a similar cached query
    ///
    /// Returns the cached response if a similar query is found above the threshold
    pub async fn get_similar(&self, query: &str, threshold: f32) -> Result<Option<String>> {
        debug!("Searching cache for similar query: {}", query);

        // Generate embedding for the query
        let query_vector = self.generate_embedding(query).await?;

        // Search Qdrant for similar vectors
        let search_result = self
            .qdrant
            .search_points(
                SearchPointsBuilder::new(&self.collection_name, query_vector, 1)
                    .with_payload(true)
                    .score_threshold(threshold)
                    .build(),
            )
            .await
            .context("Failed to search Qdrant")?;

        // Check if we got any results
        if let Some(point) = search_result.result.first() {
            debug!("Cache hit! Score: {}", point.score);

            // Extract payload
            let payload = &point.payload;

            // Check if cache entry has expired
            if let Some(created_at_value) = payload.get("created_at") {
                if let Some(created_at) = created_at_value.as_integer() {
                    if let Some(ttl_seconds_value) = payload.get("ttl_seconds") {
                        if let Some(ttl_seconds) = ttl_seconds_value.as_integer() {
                            let now = Utc::now().timestamp();
                            let expiry = created_at + ttl_seconds;

                            if now > expiry {
                                debug!("Cache entry expired, ignoring");
                                return Ok(None);
                            }
                        }
                    }
                }
            }

            // Extract response
            if let Some(response_value) = payload.get("response") {
                if let Some(response) = response_value.as_str() {
                    info!("✓ Cache hit - returning cached response");
                    return Ok(Some(response.to_string()));
                }
            }
        }

        debug!("Cache miss - no similar query found");
        Ok(None)
    }

    /// Stores a query-response pair in the cache
    pub async fn set(&self, query: &str, response: &str) -> Result<()> {
        debug!("Caching query-response pair");

        // Generate embedding
        let vector = self.generate_embedding(query).await?;

        // Create payload
        let payload = CachePayload {
            query: query.to_string(),
            response: response.to_string(),
            created_at: Utc::now().timestamp(),
            ttl_seconds: self.ttl.as_secs() as i64,
        };

        // Convert payload to Qdrant payload format
        let payload_map = serde_json::to_value(&payload)
            .context("Failed to serialize cache payload")?;

        let payload_struct = if let serde_json::Value::Object(map) = payload_map {
            map.into_iter()
                .map(|(k, v)| (k, v.into()))
                .collect::<std::collections::HashMap<_, _>>()
        } else {
            return Err(anyhow::anyhow!("Payload is not a JSON object"));
        };

        // Create point
        let point_id = Uuid::new_v4().to_string();
        let point = PointStruct::new(point_id, vector, payload_struct);

        // Upsert to Qdrant
        self.qdrant
            .upsert_points(
                UpsertPointsBuilder::new(&self.collection_name, vec![point]).build(),
            )
            .await
            .context("Failed to upsert point to Qdrant")?;

        debug!("✓ Query-response pair cached successfully");
        Ok(())
    }

    /// Removes expired cache entries
    ///
    /// This should be called periodically (e.g., via a background task)
    pub async fn cleanup_expired(&self) -> Result<()> {
        info!("Running cache cleanup...");

        let now = Utc::now().timestamp();

        // Create filter for expired entries
        // We need to find points where: now > (created_at + ttl_seconds)
        // This is complex with Qdrant filters, so we'll use a scroll + delete approach

        let mut deleted_count = 0;
        let mut offset = None;

        loop {
            // Scroll through all points
            let scroll_result = self
                .qdrant
                .scroll(
                    ScrollPointsBuilder::new(&self.collection_name)
                        .with_payload(true)
                        .limit(100)
                        .offset(offset.unwrap_or_default())
                        .build(),
                )
                .await
                .context("Failed to scroll Qdrant points")?;

            if scroll_result.result.is_empty() {
                break;
            }

            // Check each point for expiry
            let mut expired_ids = Vec::new();

            for point in &scroll_result.result {
                let payload = &point.payload;
                if let (Some(created_at_value), Some(ttl_value)) =
                    (payload.get("created_at"), payload.get("ttl_seconds"))
                {
                    if let (Some(created_at), Some(ttl_seconds)) =
                        (created_at_value.as_integer(), ttl_value.as_integer())
                    {
                        let expiry = created_at + ttl_seconds;
                        if now > expiry {
                            if let Some(id) = &point.id {
                                expired_ids.push(id.clone());
                            }
                        }
                    }
                }
            }

            // Delete expired points
            if !expired_ids.is_empty() {
                deleted_count += expired_ids.len();

                self.qdrant
                    .delete_points(
                        DeletePointsBuilder::new(&self.collection_name)
                            .points(expired_ids)
                            .build(),
                    )
                    .await
                    .context("Failed to delete expired points")?;
            }

            // Update offset
            offset = scroll_result.next_page_offset;

            if offset.is_none() {
                break;
            }
        }

        if deleted_count > 0 {
            info!("✓ Cleanup complete - removed {} expired entries", deleted_count);
        } else {
            info!("✓ Cleanup complete - no expired entries found");
        }

        Ok(())
    }

    /// Gets cache statistics
    pub async fn get_stats(&self) -> Result<CacheStats> {
        let collection_info = self
            .qdrant
            .collection_info(&self.collection_name)
            .await
            .context("Failed to get collection info")?;

        let total_entries = collection_info
            .result
            .and_then(|info| info.points_count)
            .unwrap_or(0);

        Ok(CacheStats { total_entries })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    pub total_entries: u64,
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Requires Qdrant running
    async fn test_semantic_cache() {
        let cache = SemanticCache::new(
            "http://localhost:6334",
            "test_cache".to_string(),
            0.95,
            24,
        )
        .await
        .expect("Failed to create cache");

        // Test cache miss
        let result = cache
            .get_similar("What is Rust?", 0.95)
            .await
            .expect("Failed to query cache");
        assert!(result.is_none());

        // Test cache set
        cache
            .set(
                "What is Rust?",
                "Rust is a systems programming language.",
            )
            .await
            .expect("Failed to set cache");

        // Test cache hit with exact query
        let result = cache
            .get_similar("What is Rust?", 0.95)
            .await
            .expect("Failed to query cache");
        assert!(result.is_some());
        assert_eq!(
            result.unwrap(),
            "Rust is a systems programming language."
        );

        // Test cache hit with similar query
        let result = cache
            .get_similar("Tell me about Rust", 0.85)
            .await
            .expect("Failed to query cache");
        assert!(result.is_some());
    }
}
