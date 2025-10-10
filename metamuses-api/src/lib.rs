// Core modules
pub mod types;
pub mod config;

// Inference modules
pub mod inference;

// Routing modules
pub mod routing;

// Queue modules
pub mod queue;

// Cache modules
pub mod cache;

// API modules
pub mod api;

// Re-exports for convenience
pub use config::Config;
pub use types::*;
pub use inference::{InferenceEngine, WorkerPool, MODEL_REGISTRY};
pub use routing::{IntelligentRouter, ComplexityAnalyzer};
pub use queue::{RedisQueueManager, QueueMetrics};
pub use cache::SemanticCache;
pub use api::{AppState, RequestMetrics};
