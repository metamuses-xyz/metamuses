//! Common HTTP client utilities and traits for external LLM APIs

use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Standard message format for API requests
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct APIMessage {
    pub role: String,
    pub content: String,
}

impl APIMessage {
    pub fn system(content: impl Into<String>) -> Self {
        Self {
            role: "system".to_string(),
            content: content.into(),
        }
    }

    pub fn user(content: impl Into<String>) -> Self {
        Self {
            role: "user".to_string(),
            content: content.into(),
        }
    }

    pub fn assistant(content: impl Into<String>) -> Self {
        Self {
            role: "assistant".to_string(),
            content: content.into(),
        }
    }
}

/// Token usage information from API response
#[derive(Debug, Clone, Default)]
pub struct TokenUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

/// Standard response format from API
#[derive(Debug, Clone)]
pub struct APIResponse {
    pub content: String,
    pub model: String,
    pub usage: Option<TokenUsage>,
    pub finish_reason: Option<String>,
}

/// Trait for external LLM API clients
#[async_trait]
pub trait ExternalLLMClient: Send + Sync {
    /// Send a chat completion request
    async fn chat_completion(
        &self,
        messages: Vec<APIMessage>,
        max_tokens: u32,
        temperature: f32,
    ) -> Result<APIResponse>;

    /// Get the model name
    fn model_name(&self) -> &str;

    /// Check if the client is healthy/reachable
    async fn health_check(&self) -> Result<bool>;
}

/// Error types for external API calls
#[derive(Debug, thiserror::Error)]
pub enum ExternalAPIError {
    #[error("Rate limited by API provider, retry after {retry_after:?}")]
    RateLimited { retry_after: Option<Duration> },

    #[error("API authentication failed: {0}")]
    AuthenticationError(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("API server error: {0}")]
    ServerError(String),

    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),

    #[error("Request timeout after {0} seconds")]
    Timeout(u64),

    #[error("Response parsing error: {0}")]
    ParseError(String),
}

/// Retry a request with exponential backoff
pub async fn with_retry<F, T, Fut>(
    max_retries: u32,
    initial_delay_ms: u64,
    operation: F,
) -> Result<T>
where
    F: Fn() -> Fut,
    Fut: std::future::Future<Output = Result<T>>,
{
    let mut last_error = None;
    let mut delay_ms = initial_delay_ms;

    for attempt in 0..=max_retries {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) => {
                let error_str = e.to_string();

                // Don't retry on auth errors or invalid requests
                if error_str.contains("401") || error_str.contains("403") {
                    return Err(e);
                }
                if error_str.contains("400") && !error_str.contains("rate") {
                    return Err(e);
                }

                last_error = Some(e);

                if attempt < max_retries {
                    tracing::warn!(
                        "API request failed (attempt {}/{}), retrying in {}ms: {}",
                        attempt + 1,
                        max_retries + 1,
                        delay_ms,
                        error_str
                    );
                    tokio::time::sleep(Duration::from_millis(delay_ms)).await;
                    // Exponential backoff with jitter
                    delay_ms = (delay_ms * 2).min(30000) + (rand::random::<u64>() % 1000);
                }
            }
        }
    }

    Err(last_error.unwrap_or_else(|| anyhow::anyhow!("Unknown error after retries")))
}
