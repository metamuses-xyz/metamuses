use serde::{Deserialize, Serialize};
use std::time::Duration;
use uuid::Uuid;

// ============================================================================
// Model Tiers
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ModelTier {
    Fast,
    Medium,
    Heavy,
    Specialized(Domain),
}

impl ModelTier {
    pub fn as_str(&self) -> &str {
        match self {
            Self::Fast => "fast",
            Self::Medium => "medium",
            Self::Heavy => "heavy",
            Self::Specialized(domain) => domain.as_str(),
        }
    }

    pub fn target_latency(&self) -> Duration {
        match self {
            Self::Fast => Duration::from_millis(500),
            Self::Medium => Duration::from_secs(2),
            Self::Heavy => Duration::from_secs(5),
            Self::Specialized(_) => Duration::from_secs(3),
        }
    }

    pub fn max_concurrent_requests(&self) -> usize {
        match self {
            Self::Fast => 10,
            Self::Medium => 5,
            Self::Heavy => 2,
            Self::Specialized(_) => 3,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Domain {
    Code,
    Math,
    Reasoning,
    General,
}

impl Domain {
    pub fn as_str(&self) -> &str {
        match self {
            Self::Code => "code",
            Self::Math => "math",
            Self::Reasoning => "reasoning",
            Self::General => "general",
        }
    }
}

// ============================================================================
// Priority System
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum Priority {
    Low = 0,
    Normal = 1,
    High = 2,
    Critical = 3,
}

// ============================================================================
// Query Complexity
// ============================================================================

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum QueryComplexity {
    Simple,
    Medium,
    Complex,
    Specialized(Domain),
}

// ============================================================================
// Inference Request/Response
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceRequest {
    pub id: Uuid,
    pub muse_id: u64,
    pub user_query: String,
    pub user_address: String,
    pub context: Vec<ChatMessage>,
    pub personality_traits: Option<PersonalityTraits>,
    pub priority: Priority,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceResult {
    pub request_id: Uuid,
    pub content: String,
    pub model_name: String,
    pub tier: ModelTier,
    pub latency_ms: u64,
    pub from_cache: bool,
    pub tokens_generated: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalityTraits {
    pub creativity: u8,
    pub wisdom: u8,
    pub humor: u8,
    pub empathy: u8,
}

// ============================================================================
// Inference Job (for queue)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceJob {
    pub id: Uuid,
    pub user_id: String,
    pub muse_id: u64,
    pub query: String,
    pub priority: Priority,
    pub tier: ModelTier,
    pub context: Vec<ChatMessage>,
    pub personality_traits: Option<PersonalityTraits>,
    pub created_at: i64,
    pub timeout_secs: u64,
}

// ============================================================================
// Worker Status
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WorkerStatus {
    Idle,
    Busy,
    Failed,
    Shutdown,
}

// ============================================================================
// Model Configuration
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    pub model_path: String,
    pub model_name: String,
    pub tier: ModelTier,
    pub context_length: usize,
    pub temperature: f32,
    pub top_p: f32,
    pub max_tokens: usize,
    pub num_threads: Option<usize>,
    pub gpu_layers: Option<u32>,
}

impl ModelConfig {
    pub fn fast_tier_default() -> Self {
        Self {
            model_path: "/models/qwen2.5-1.5b-instruct-q5_k_m.gguf".to_string(),
            model_name: "Qwen2.5-1.5B-Instruct".to_string(),
            tier: ModelTier::Fast,
            context_length: 32768,
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 512,
            num_threads: Some(8),
            gpu_layers: None,
        }
    }

    pub fn medium_tier_default() -> Self {
        Self {
            model_path: "/models/qwen2.5-7b-instruct-q5_k_m.gguf".to_string(),
            model_name: "Qwen2.5-7B-Instruct".to_string(),
            tier: ModelTier::Medium,
            context_length: 131072,
            temperature: 0.8,
            top_p: 0.95,
            max_tokens: 2048,
            num_threads: Some(4),
            gpu_layers: Some(35),
        }
    }
}

// ============================================================================
// API Request/Response
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ChatRequest {
    pub message: String,
    pub user_address: String,
    pub stream: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct ChatResponse {
    pub response: String,
    pub model_used: String,
    pub inference_time_ms: u64,
    pub cached: bool,
    pub session_id: String,
}

// ============================================================================
// Metrics
// ============================================================================

#[derive(Debug, Clone)]
pub struct TierMetrics {
    pub cpu_utilization: f32,
    pub queue_depth: usize,
    pub active_workers: usize,
    pub p95_latency: Duration,
    pub requests_per_minute: f32,
}
