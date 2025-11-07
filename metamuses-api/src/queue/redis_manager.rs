use crate::types::{InferenceJob, ModelTier, Priority};
use anyhow::Result;
use redis::aio::ConnectionManager;
use redis::{AsyncCommands, Client};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::info;

pub struct RedisQueueManager {
    #[allow(dead_code)]
    client: Arc<Client>,
    connection: ConnectionManager,
    queue_prefix: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueMetrics {
    pub total_queued: usize,
    pub by_priority: std::collections::HashMap<Priority, usize>,
    pub by_tier: std::collections::HashMap<String, usize>,
}

impl RedisQueueManager {
    pub async fn new(redis_url: &str, queue_prefix: String) -> Result<Self> {
        let client = Arc::new(Client::open(redis_url)?);
        let connection = ConnectionManager::new(client.as_ref().clone()).await?;

        info!(
            "Redis queue manager initialized with prefix: {}",
            queue_prefix
        );

        Ok(Self {
            client,
            connection,
            queue_prefix,
        })
    }

    pub async fn enqueue(&mut self, job: InferenceJob) -> Result<()> {
        let queue_key = self.get_queue_key(&job.tier, job.priority);
        let job_json = serde_json::to_string(&job)?;

        // Add to sorted set with score = timestamp (for FIFO within priority)
        let score = job.created_at as f64;
        self.connection
            .zadd::<_, _, _, ()>(&queue_key, job_json.clone(), score)
            .await?;

        // Store job metadata with TTL
        let job_key = format!("{}:job:{}", self.queue_prefix, job.id);
        self.connection
            .set_ex::<_, _, ()>(&job_key, &job_json, job.timeout_secs)
            .await?;

        // Publish notification
        let channel = format!("{}:notifications:{}", self.queue_prefix, job.tier.as_str());
        self.connection
            .publish::<_, _, ()>(channel, job.id.to_string())
            .await?;

        info!("Enqueued job {} to queue {}", job.id, queue_key);

        Ok(())
    }

    pub async fn dequeue(
        &mut self,
        tier: ModelTier,
        priority: Priority,
    ) -> Result<Option<InferenceJob>> {
        let queue_key = self.get_queue_key(&tier, priority);

        // Get and remove the job with lowest score (oldest)
        let result: Vec<(String, f64)> = self.connection.zpopmin(&queue_key, 1).await?;

        if let Some((job_json, _)) = result.first() {
            let job: InferenceJob = serde_json::from_str(job_json)?;
            info!("Dequeued job {} from queue {}", job.id, queue_key);
            Ok(Some(job))
        } else {
            Ok(None)
        }
    }

    pub async fn dequeue_any(&mut self, tier: ModelTier) -> Result<Option<InferenceJob>> {
        // Try to dequeue in priority order
        for priority in [
            Priority::Critical,
            Priority::High,
            Priority::Normal,
            Priority::Low,
        ] {
            if let Some(job) = self.dequeue(tier, priority).await? {
                return Ok(Some(job));
            }
        }

        Ok(None)
    }

    pub async fn get_queue_depth(&mut self, tier: ModelTier) -> Result<usize> {
        let mut total = 0;

        for priority in [
            Priority::Critical,
            Priority::High,
            Priority::Normal,
            Priority::Low,
        ] {
            let queue_key = self.get_queue_key(&tier, priority);
            let count: usize = self.connection.zcard(&queue_key).await?;
            total += count;
        }

        Ok(total)
    }

    pub async fn get_metrics(&mut self) -> Result<QueueMetrics> {
        let mut by_priority = std::collections::HashMap::new();
        let mut by_tier = std::collections::HashMap::new();
        let mut total_queued = 0;

        let tiers = vec![ModelTier::Fast, ModelTier::Medium, ModelTier::Heavy];

        for tier in tiers {
            let mut tier_total = 0;

            for priority in [
                Priority::Critical,
                Priority::High,
                Priority::Normal,
                Priority::Low,
            ] {
                let queue_key = self.get_queue_key(&tier, priority);
                let count: usize = self.connection.zcard(&queue_key).await.unwrap_or(0);

                tier_total += count;
                *by_priority.entry(priority).or_insert(0) += count;
            }

            by_tier.insert(tier.as_str().to_string(), tier_total);
            total_queued += tier_total;
        }

        Ok(QueueMetrics {
            total_queued,
            by_priority,
            by_tier,
        })
    }

    pub async fn store_result(
        &mut self,
        job_id: uuid::Uuid,
        result: &crate::types::InferenceResult,
    ) -> Result<()> {
        let result_key = format!("{}:result:{}", self.queue_prefix, job_id);
        let result_json = serde_json::to_string(result)?;

        // Store result with TTL (10 minutes)
        self.connection
            .set_ex::<_, _, ()>(&result_key, result_json, 600)
            .await?;

        info!("Stored result for job {}", job_id);

        Ok(())
    }

    pub async fn get_result(
        &mut self,
        job_id: uuid::Uuid,
    ) -> Result<Option<crate::types::InferenceResult>> {
        let result_key = format!("{}:result:{}", self.queue_prefix, job_id);

        let result: Option<String> = self.connection.get(&result_key).await?;

        match result {
            Some(json) => {
                let inference_result = serde_json::from_str(&json)?;
                // Delete after retrieval
                self.connection.del::<_, ()>(&result_key).await?;
                Ok(Some(inference_result))
            }
            None => Ok(None),
        }
    }

    fn get_queue_key(&self, tier: &ModelTier, priority: Priority) -> String {
        format!(
            "{}:queue:{}:{}",
            self.queue_prefix,
            tier.as_str(),
            priority as u8
        )
    }
}
