use anyhow::Result;
use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    // Server
    pub host: String,
    pub port: u16,

    // Redis
    pub redis_url: String,
    pub redis_queue_prefix: String,

    // Qdrant
    pub qdrant_url: String,
    pub qdrant_api_key: Option<String>,

    // Models
    pub models_dir: String,
    pub enable_fast_tier: bool,
    pub enable_medium_tier: bool,
    pub enable_heavy_tier: bool,

    // Worker Pools
    pub fast_tier_workers: usize,
    pub medium_tier_workers: usize,
    pub heavy_tier_workers: usize,

    // Cache
    pub enable_semantic_cache: bool,
    pub cache_similarity_threshold: f32,
    pub cache_ttl_hours: u64,

    // Existing MetaMuse config
    pub openai_api_key: Option<String>,
    pub rpc_url: String,
    pub private_key: String,
    pub ipfs_jwt_token: String,

    // Worker Process Configuration (for multi-process deployment)
    pub worker_id: usize,           // Worker instance ID (0, 1, 2, 3)
    pub total_workers: usize,       // Total number of worker processes
    pub threads_per_worker: usize,  // CPU threads per worker (for llama.cpp)
    pub batch_size: usize,          // Batch size for prompt processing
    pub context_size: usize,        // Context window size (n_ctx)
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenv::dotenv().ok();

        Ok(Config {
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()?,

            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            redis_queue_prefix: env::var("REDIS_QUEUE_PREFIX")
                .unwrap_or_else(|_| "metamuse".to_string()),

            qdrant_url: env::var("QDRANT_URL")
                .unwrap_or_else(|_| "http://localhost:6334".to_string()),
            qdrant_api_key: env::var("QDRANT_API_KEY").ok(),

            models_dir: env::var("MODELS_DIR")
                .unwrap_or_else(|_| "/models".to_string()),
            enable_fast_tier: env::var("ENABLE_FAST_TIER")
                .unwrap_or_else(|_| "true".to_string())
                .parse()?,
            enable_medium_tier: env::var("ENABLE_MEDIUM_TIER")
                .unwrap_or_else(|_| "true".to_string())
                .parse()?,
            enable_heavy_tier: env::var("ENABLE_HEAVY_TIER")
                .unwrap_or_else(|_| "false".to_string())
                .parse()?,

            fast_tier_workers: env::var("FAST_TIER_WORKERS")
                .unwrap_or_else(|_| "10".to_string())
                .parse()?,
            medium_tier_workers: env::var("MEDIUM_TIER_WORKERS")
                .unwrap_or_else(|_| "5".to_string())
                .parse()?,
            heavy_tier_workers: env::var("HEAVY_TIER_WORKERS")
                .unwrap_or_else(|_| "2".to_string())
                .parse()?,

            enable_semantic_cache: env::var("ENABLE_SEMANTIC_CACHE")
                .unwrap_or_else(|_| "true".to_string())
                .parse()?,
            cache_similarity_threshold: env::var("CACHE_SIMILARITY_THRESHOLD")
                .unwrap_or_else(|_| "0.95".to_string())
                .parse()?,
            cache_ttl_hours: env::var("CACHE_TTL_HOURS")
                .unwrap_or_else(|_| "24".to_string())
                .parse()?,

            openai_api_key: env::var("OPENAI_API_KEY").ok(),
            rpc_url: env::var("RPC_URL").unwrap_or_else(|_| "".to_string()),
            private_key: env::var("PRIVATE_KEY").unwrap_or_else(|_| "".to_string()),
            ipfs_jwt_token: env::var("IPFS_JWT_TOKEN").unwrap_or_else(|_| "".to_string()),

            // Worker process configuration
            // For 16 CPUs with 4 workers: each worker gets 4 threads
            // For 16 CPUs with 2 workers: each worker gets 8 threads
            worker_id: env::var("WORKER_ID")
                .unwrap_or_else(|_| "0".to_string())
                .parse()?,
            total_workers: env::var("TOTAL_WORKERS")
                .unwrap_or_else(|_| "4".to_string())
                .parse()?,
            threads_per_worker: env::var("THREADS_PER_WORKER")
                .unwrap_or_else(|_| "4".to_string())
                .parse()?,
            batch_size: env::var("BATCH_SIZE")
                .unwrap_or_else(|_| "512".to_string())
                .parse()?,
            context_size: env::var("CONTEXT_SIZE")
                .unwrap_or_else(|_| "2048".to_string())
                .parse()?,
        })
    }
}
