use crate::cache::SemanticCache;
use crate::queue::RedisQueueManager;
use crate::routing::ComplexityAnalyzer;
use crate::types::*;
use anyhow::Result;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tracing::{info, warn};
use uuid::Uuid;

pub struct IntelligentRouter {
    cache: Option<Arc<SemanticCache>>,
    pub queue_manager: Arc<RwLock<RedisQueueManager>>,
    complexity_analyzer: ComplexityAnalyzer,
}

impl IntelligentRouter {
    pub fn new(
        cache: Option<Arc<SemanticCache>>,
        queue_manager: Arc<RwLock<RedisQueueManager>>,
    ) -> Self {
        Self {
            cache,
            queue_manager,
            complexity_analyzer: ComplexityAnalyzer::new(),
        }
    }

    pub async fn route_and_execute(
        &self,
        request: InferenceRequest,
    ) -> Result<InferenceResult> {
        // 1. Check semantic cache (if available)
        if let Some(cache) = &self.cache {
            if let Ok(Some(cached)) = cache.get_similar(&request.user_query, 0.95).await {
                info!("Cache hit for query: {}", request.user_query);

                return Ok(InferenceResult {
                    request_id: request.id,
                    content: cached,
                    model_name: "cache".to_string(),
                    tier: ModelTier::Fast,
                    latency_ms: 5,
                    from_cache: true,
                    tokens_generated: None,
                });
            }
        }

        // 2. Analyze query complexity
        let complexity = self.complexity_analyzer.analyze(&request.user_query).await;

        // 3. Select tier based on complexity
        let tier = self.select_tier(&complexity);

        info!(
            "Routing request {} to tier {:?} (complexity: {:?})",
            request.id, tier, complexity
        );

        // 4. Create inference job
        let job = InferenceJob {
            id: request.id,
            user_id: request.user_address.clone(),
            muse_id: request.muse_id,
            query: request.user_query.clone(),
            priority: request.priority,
            tier,
            context: request.context,
            personality_traits: request.personality_traits,
            created_at: chrono::Utc::now().timestamp(),
            timeout_secs: 60,
        };

        // 5. Enqueue job
        self.queue_manager.write().await.enqueue(job.clone()).await?;

        // 6. Wait for result with timeout
        let _start = Instant::now();
        let result = self
            .wait_for_result(request.id, Duration::from_secs(job.timeout_secs))
            .await?;

        // 7. Cache result (if cache available)
        if let Some(cache) = &self.cache {
            if let Err(e) = cache.set(&request.user_query, &result.content).await {
                warn!("Failed to cache result: {}", e);
            }
        }

        Ok(result)
    }

    fn select_tier(&self, complexity: &QueryComplexity) -> ModelTier {
        match complexity {
            QueryComplexity::Simple => ModelTier::Fast,
            QueryComplexity::Medium => ModelTier::Medium,
            QueryComplexity::Complex => ModelTier::Heavy,
            QueryComplexity::Specialized(domain) => ModelTier::Specialized(*domain),
        }
    }

    async fn wait_for_result(
        &self,
        job_id: Uuid,
        timeout: Duration,
    ) -> Result<InferenceResult> {
        let start = Instant::now();

        loop {
            // Check if we've exceeded timeout
            if start.elapsed() > timeout {
                return Err(anyhow::anyhow!("Request timed out"));
            }

            // Try to get result from Redis
            if let Some(result) = self.queue_manager.write().await.get_result(job_id).await? {
                return Ok(result);
            }

            // Wait a bit before checking again
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    }
}
