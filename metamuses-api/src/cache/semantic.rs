// Semantic cache temporarily stubbed out due to API compatibility issues
// TODO: Re-implement once Alith and Qdrant APIs stabilize
// See BUILD_STATUS.md for details

use anyhow::Result;
use std::time::Duration;
use tracing::info;

pub struct SemanticCache {
    #[allow(dead_code)]
    collection_name: String,
    #[allow(dead_code)]
    similarity_threshold: f32,
    #[allow(dead_code)]
    ttl: Duration,
}

impl SemanticCache {
    pub async fn new(
        _qdrant_url: &str,
        collection_name: String,
        similarity_threshold: f32,
        ttl_hours: u64,
    ) -> Result<Self> {
        info!("Semantic cache initialized (STUB MODE) - collection: {}", collection_name);
        info!("Note: Caching is currently disabled due to API compatibility issues");
        info!("See BUILD_STATUS.md for details and workarounds");

        Ok(Self {
            collection_name,
            similarity_threshold,
            ttl: Duration::from_secs(ttl_hours * 3600),
        })
    }

    pub async fn get_similar(&self, _query: &str, _threshold: f32) -> Result<Option<String>> {
        // Stub: Always return cache miss
        // TODO: Implement when Alith embeddings API stabilizes
        Ok(None)
    }

    pub async fn set(&self, _query: &str, _response: &str) -> Result<()> {
        // Stub: No-op
        // TODO: Implement when Qdrant builder API issues are resolved
        Ok(())
    }

    pub async fn cleanup_expired(&self) -> Result<()> {
        // Stub: No-op
        // TODO: Implement when Qdrant API stabilizes
        Ok(())
    }
}
