// Worker Pool Binary
// Processes inference jobs from Redis queue

use metamuses_api::inference::CandleEngine;
use metamuses_api::types::Domain;
use metamuses_api::*;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    info!("╔════════════════════════════════════════╗");
    info!("║   MetaMuses AI Inference Worker       ║");
    info!("║              v0.1.0                    ║");
    info!("╚════════════════════════════════════════╝");

    // Load configuration
    info!("Loading configuration...");
    let config = Config::from_env()?;
    info!("✓ Configuration loaded");

    // Connect to Redis
    info!("Connecting to Redis at {}...", config.redis_url);
    let queue_manager = Arc::new(RwLock::new(
        RedisQueueManager::new(&config.redis_url, config.redis_queue_prefix.clone()).await?,
    ));
    info!("✓ Redis connection established");

    // Initialize inference engine for fast tier
    info!("Initializing inference engine...");
    info!("Model directory: {}", config.models_dir);
    let model_path = format!("{}/qwen2.5-3b-instruct-q4_k_m.gguf", config.models_dir);
    info!("Loading model from: {}", model_path);

    // Check if model file exists
    if !std::path::Path::new(&model_path).exists() {
        error!("❌ Model file not found: {}", model_path);
        return Err(anyhow::anyhow!("Model file not found: {}", model_path));
    }

    info!("Model file found, beginning initialization...");
    info!("This may take 30-60 seconds for model loading...");

    let engine = match CandleEngine::new(
        &model_path,
        "Qwen2.5-3B-Instruct".to_string(),
        ModelTier::Fast,
    )
    .await
    {
        Ok(engine) => {
            info!("✓ Inference engine initialized successfully!");
            engine
        }
        Err(e) => {
            error!("❌ Failed to initialize inference engine: {}", e);
            return Err(e);
        }
    };

    info!("");
    info!("⚡ Worker ready! Listening for jobs...");
    info!("");

    // Main worker loop
    let mut error_count = 0;
    let max_errors = 10;

    loop {
        // Try to dequeue a job (check multiple tiers)
        let job_result = {
            let mut qm = queue_manager.write().await;
            match qm.dequeue(ModelTier::Fast, Priority::Normal).await {
                Ok(Some(job)) => Ok(Some(job)),
                Ok(None) | Err(_) => {
                    // Try Medium tier
                    match qm.dequeue(ModelTier::Medium, Priority::Normal).await {
                        Ok(Some(job)) => Ok(Some(job)),
                        Ok(None) | Err(_) => {
                            // Try specialized Code tier
                            match qm
                                .dequeue(ModelTier::Specialized(Domain::Code), Priority::Normal)
                                .await
                            {
                                Ok(Some(job)) => Ok(Some(job)),
                                Ok(None) | Err(_) => {
                                    // Try specialized Math tier
                                    qm.dequeue(
                                        ModelTier::Specialized(Domain::Math),
                                        Priority::Normal,
                                    )
                                    .await
                                }
                            }
                        }
                    }
                }
            }
        };

        match job_result {
            Ok(Some(job)) => {
                error_count = 0; // Reset error count on success
                info!("📥 Processing job {} from user {}", job.id, job.user_id);
                info!("   Query: {}", job.query);

                // Process the job
                let start = std::time::Instant::now();
                match engine.generate(&job.query).await {
                    Ok(response) => {
                        let latency_ms = start.elapsed().as_millis() as u64;

                        info!("✅ Generated response in {}ms", latency_ms);
                        info!(
                            "   Response preview: {}...",
                            response.chars().take(80).collect::<String>()
                        );

                        // Create result
                        let result = InferenceResult {
                            request_id: job.id,
                            content: response,
                            model_name: "Qwen3-4B-Instruct".to_string(),
                            tier: ModelTier::Fast,
                            latency_ms,
                            from_cache: false,
                            tokens_generated: None,
                        };

                        // Store result in Redis
                        if let Err(e) = queue_manager
                            .write()
                            .await
                            .store_result(job.id, &result)
                            .await
                        {
                            error!("❌ Failed to store result: {}", e);
                        } else {
                            info!("💾 Result stored successfully");
                        }
                    }
                    Err(e) => {
                        error!("❌ Inference failed: {}", e);

                        // Store error result
                        let result = InferenceResult {
                            request_id: job.id,
                            content: format!("Error: {}", e),
                            model_name: "Qwen3-4B-Instruct".to_string(),
                            tier: ModelTier::Fast,
                            latency_ms: start.elapsed().as_millis() as u64,
                            from_cache: false,
                            tokens_generated: None,
                        };

                        let _ = queue_manager
                            .write()
                            .await
                            .store_result(job.id, &result)
                            .await;
                    }
                }

                info!("");
            }
            Ok(None) => {
                // No jobs available, wait a bit
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            }
            Err(e) => {
                error_count += 1;
                error!("❌ Error dequeuing job ({}): {}", error_count, e);

                if error_count >= max_errors {
                    error!("Too many consecutive errors. Exiting...");
                    return Err(anyhow::anyhow!("Worker failed after {} errors", max_errors));
                }

                // Wait before retrying
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
            }
        }
    }
}
