// Core modules
pub mod config;
pub mod types;

// Data layer modules
pub mod db;
pub mod models;

// Service layer modules
pub mod services;

// Points system modules
pub mod points;

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
pub use api::{AppState, RequestMetrics};
pub use cache::SemanticCache;
pub use config::Config;
pub use inference::{
    get_model_config, get_model_registry, GenerationConfig, InferenceEngine,
    LlamaCppConfig, LlamaCppEngine, ModelFactory, WorkerPool,
};
pub use queue::{QueueMetrics, RedisQueueManager};
pub use routing::{ComplexityAnalyzer, IntelligentRouter};
pub use types::*;
