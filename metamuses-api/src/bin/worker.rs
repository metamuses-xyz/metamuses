// Worker Pool Binary
// Processes inference jobs from Redis queue
// Supports multi-process deployment for CPU utilization

use metamuses_api::inference::{GenerationConfig, InferenceEngine, LlamaCppConfig, LlamaCppEngine};
use metamuses_api::types::Domain;
use metamuses_api::*;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load configuration
    let config = Config::from_env()?;

    info!("╔════════════════════════════════════════╗");
    info!("║   MetaMuses AI Inference Worker       ║");
    info!("║              v0.1.0                    ║");
    info!("╠════════════════════════════════════════╣");
    info!(
        "║  Worker ID: {}/{}                       ║",
        config.worker_id, config.total_workers
    );
    info!(
        "║  Threads: {} | Batch: {} | Ctx: {}   ║",
        config.threads_per_worker, config.batch_size, config.context_size
    );
    info!("╚════════════════════════════════════════╝");

    info!("Loading configuration...");
    info!("✓ Configuration loaded");

    // Connect to Redis
    info!("Connecting to Redis at {}...", config.redis_url);
    let queue_manager = Arc::new(RwLock::new(
        RedisQueueManager::new(&config.redis_url, config.redis_queue_prefix.clone()).await?,
    ));
    info!("✓ Redis connection established");

    // Initialize inference engine with worker-specific configuration
    info!("Initializing inference engine...");
    info!("Model directory: {}", config.models_dir);

    // Get model filename from environment or use default (0.5B for high concurrency)
    let model_filename = std::env::var("MODEL_FILENAME")
        .unwrap_or_else(|_| "qwen2.5-0.5b-instruct-q4_k_m.gguf".to_string());
    let model_path = format!("{}/{}", config.models_dir, model_filename);
    info!("Loading model from: {}", model_path);

    // Check if model file exists
    if !std::path::Path::new(&model_path).exists() {
        error!("❌ Model file not found: {}", model_path);
        return Err(anyhow::anyhow!("Model file not found: {}", model_path));
    }

    info!("Model file found, beginning initialization...");
    info!("This may take 10-30 seconds for model loading (0.5B is fast!)...");

    // Configure llama.cpp for this worker instance
    let llama_config = LlamaCppConfig {
        threads: config.threads_per_worker,
        batch_size: config.batch_size,
        context_size: config.context_size,
    };

    // Get max tokens from environment or use default
    // Reduced to 32 for faster responses on CPU (~4s target)
    // 32 tokens @ 7 tok/s = ~4.5s generation + ~2s prefill = ~6.5s total
    let max_tokens = std::env::var("MAX_TOKENS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(128);

    let gen_config = GenerationConfig {
        max_new_tokens: max_tokens,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.1,
        stop_sequences: vec!["<|im_end|>".to_string(), "<|endoftext|>".to_string()],
    };

    info!(
        "   Max tokens: {} (set MAX_TOKENS env to override)",
        max_tokens
    );

    // Determine model name from filename for logging
    let model_name = if model_filename.contains("0.5b") {
        "Qwen2.5-0.5B-Instruct"
    } else if model_filename.contains("1.5b") {
        "Qwen2.5-1.5B-Instruct"
    } else if model_filename.contains("3b") {
        "Qwen2.5-3B-Instruct"
    } else {
        "Qwen2.5-Instruct"
    };

    let engine = match LlamaCppEngine::new_with_full_config(
        &model_path,
        model_name.to_string(),
        ModelTier::Fast,
        gen_config,
        llama_config,
    )
    .await
    {
        Ok(engine) => {
            info!("✓ Inference engine initialized successfully!");
            info!("   Model: {}", model_name);
            #[cfg(target_os = "macos")]
            info!("   Backend: llama.cpp with Metal GPU acceleration");
            #[cfg(target_os = "linux")]
            info!(
                "   Backend: llama.cpp CPU ({} threads)",
                config.threads_per_worker
            );
            engine
        }
        Err(e) => {
            error!("❌ Failed to initialize inference engine: {}", e);
            return Err(e);
        }
    };

    info!("");
    info!(
        "⚡ Worker {} ready! Listening for jobs...",
        config.worker_id
    );
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
                info!("   Context messages: {}", job.context.len());

                // Process the job - use context-aware generation if context is provided
                let start = std::time::Instant::now();

                let generation_result = if !job.context.is_empty() {
                    // Use full conversation context (includes system prompt + history)
                    info!("🎭 Using companion personality context");
                    engine.generate_with_context(&job.context).await
                } else {
                    // Fallback to simple generation
                    info!("📝 Using simple query generation");
                    engine.generate(&job.query).await
                };

                match generation_result {
                    Ok(response) => {
                        let latency_ms = start.elapsed().as_millis() as u64;

                        info!("✅ Generated response in {}ms", latency_ms);
                        info!(
                            "   Response preview: {}...",
                            response.chars().take(100).collect::<String>()
                        );

                        // Create result
                        let result = InferenceResult {
                            request_id: job.id,
                            content: response,
                            model_name: model_name.to_string(),
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
                            model_name: model_name.to_string(),
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
