// API Request/Response Types

use crate::types::{ChatMessage, Priority};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ============================================================================
// Chat API Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanionPersonality {
    pub name: String,
    pub description: String,
    pub creativity: u8,
    pub wisdom: u8,
    pub humor: u8,
    pub empathy: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
    /// User's wallet address (for authentication)
    pub user_address: String,

    /// MuseAI NFT ID (required for personalized responses)
    pub muse_id: u64,

    /// User's query/message
    pub query: String,

    /// EIP-712 signature for authentication (required)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub signature: Option<String>,

    /// Unix timestamp when signature was created (required)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<u64>,

    /// Unique nonce for replay protection (required)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nonce: Option<String>,

    /// Conversation context (previous messages)
    #[serde(default)]
    pub context: Vec<ChatMessage>,

    /// Request priority (defaults to Normal)
    #[serde(default)]
    pub priority: Priority,

    /// Companion personality for customized responses
    #[serde(skip_serializing_if = "Option::is_none")]
    pub companion_personality: Option<CompanionPersonality>,

    /// Optional personality traits for specialized domain
    #[serde(skip_serializing_if = "Option::is_none")]
    pub personality_traits: Option<Vec<String>>,

    /// Force specific tier (for testing/debugging)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub force_tier: Option<String>,

    /// Enable streaming response via WebSocket
    #[serde(default)]
    pub stream: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    /// Unique request ID
    pub request_id: Uuid,

    /// AI-generated response
    pub response: String,

    /// Model used for inference
    pub model_name: String,

    /// Tier used (fast/medium/heavy/specialized)
    pub tier: String,

    /// Latency in milliseconds
    pub latency_ms: u64,

    /// Whether response came from cache
    pub from_cache: bool,

    /// Number of tokens generated (if available)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tokens_generated: Option<usize>,

    /// Estimated cost in tMETIS (for future billing)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cost_tmetis: Option<f64>,
}

// ============================================================================
// Health Check Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    pub uptime_secs: u64,
    pub queue_depth: QueueDepthStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueDepthStatus {
    pub fast: usize,
    pub medium: usize,
    pub heavy: usize,
    pub total: usize,
}

// ============================================================================
// Metrics Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsResponse {
    pub total_requests: u64,
    pub requests_per_tier: TierMetrics,
    pub cache_hit_rate: f64,
    pub avg_latency_ms: f64,
    pub queue_metrics: crate::queue::QueueMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TierMetrics {
    pub fast: u64,
    pub medium: u64,
    pub heavy: u64,
    pub specialized: u64,
}

// ============================================================================
// Error Response
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
    pub request_id: Option<Uuid>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}

impl ErrorResponse {
    pub fn new(error: &str, message: &str) -> Self {
        Self {
            error: error.to_string(),
            message: message.to_string(),
            request_id: None,
            details: None,
        }
    }

    pub fn with_request_id(mut self, id: Uuid) -> Self {
        self.request_id = Some(id);
        self
    }

    pub fn with_details(mut self, details: String) -> Self {
        self.details = Some(details);
        self
    }
}

// ============================================================================
// WebSocket Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    #[serde(rename = "chunk")]
    Chunk {
        request_id: Uuid,
        content: String,
        is_final: bool,
    },

    #[serde(rename = "error")]
    Error {
        request_id: Uuid,
        error: String,
        message: String,
    },

    #[serde(rename = "metadata")]
    Metadata {
        request_id: Uuid,
        model_name: String,
        tier: String,
        latency_ms: u64,
    },
}
