//! Configuration types for external LLM API clients

use serde::{Deserialize, Serialize};

/// LLM Provider selection
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LLMProvider {
    /// Local inference using llama.cpp or Candle
    Local,
    /// Google Gemini API
    Gemini,
    /// OpenRouter API (multi-provider)
    OpenRouter,
}

impl Default for LLMProvider {
    fn default() -> Self {
        Self::Local
    }
}

impl From<&str> for LLMProvider {
    fn from(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "gemini" => Self::Gemini,
            "openrouter" => Self::OpenRouter,
            _ => Self::Local,
        }
    }
}

/// Configuration for external API clients
#[derive(Debug, Clone)]
pub struct ExternalAPIConfig {
    /// Selected provider
    pub provider: LLMProvider,

    // Gemini settings
    pub gemini_api_key: Option<String>,
    pub gemini_model: String,
    pub gemini_base_url: String,

    // OpenRouter settings
    pub openrouter_api_key: Option<String>,
    pub openrouter_model: String,
    pub openrouter_base_url: String,

    // Common settings
    pub timeout_secs: u64,
    pub max_retries: u32,
}

impl ExternalAPIConfig {
    /// Create config from the main Config struct
    pub fn from_config(config: &crate::config::Config) -> Self {
        Self {
            provider: LLMProvider::from(config.llm_provider.as_str()),
            gemini_api_key: config.gemini_api_key.clone(),
            gemini_model: config.gemini_model.clone(),
            gemini_base_url: config.gemini_base_url.clone(),
            openrouter_api_key: config.openrouter_api_key.clone(),
            openrouter_model: config.openrouter_model.clone(),
            openrouter_base_url: config.openrouter_base_url.clone(),
            timeout_secs: config.external_api_timeout_secs,
            max_retries: config.external_api_max_retries,
        }
    }
}
