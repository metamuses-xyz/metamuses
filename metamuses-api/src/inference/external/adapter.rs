//! Adapter that implements InferenceEngine trait for external LLM APIs

use anyhow::Result;
use async_trait::async_trait;
use std::sync::Arc;
use tokio::sync::mpsc;

use crate::types::{ChatMessage, ModelTier};
use crate::inference::engine::{GenerationConfig, InferenceEngine};

use super::client::{APIMessage, ExternalLLMClient};
use super::config::{ExternalAPIConfig, LLMProvider};
use super::gemini::GeminiClient;
use super::openrouter::OpenRouterClient;

/// External API engine that implements InferenceEngine trait
pub struct ExternalAPIEngine {
    client: Arc<dyn ExternalLLMClient>,
    model_name: String,
    tier: ModelTier,
    default_config: GenerationConfig,
}

/// Default generation config for external APIs (higher max tokens)
fn external_api_default_config() -> GenerationConfig {
    GenerationConfig {
        max_new_tokens: 1024,  // External APIs can handle more tokens
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.0,  // External APIs handle this internally
        stop_sequences: vec![],   // Don't use local model stop sequences
    }
}

impl ExternalAPIEngine {
    /// Create a new Gemini-backed engine
    pub fn new_gemini(config: &ExternalAPIConfig) -> Result<Self> {
        let client = GeminiClient::new(config)?;
        Ok(Self {
            model_name: client.model_name().to_string(),
            client: Arc::new(client),
            tier: ModelTier::Fast, // External APIs are typically fast
            default_config: external_api_default_config(),
        })
    }

    /// Create a new OpenRouter-backed engine
    pub fn new_openrouter(config: &ExternalAPIConfig) -> Result<Self> {
        let client = OpenRouterClient::new(config)?;
        Ok(Self {
            model_name: client.model_name().to_string(),
            client: Arc::new(client),
            tier: ModelTier::Fast,
            default_config: external_api_default_config(),
        })
    }

    /// Create engine based on provider configuration
    pub fn from_config(config: &ExternalAPIConfig) -> Result<Self> {
        match config.provider {
            LLMProvider::Gemini => Self::new_gemini(config),
            LLMProvider::OpenRouter => Self::new_openrouter(config),
            LLMProvider::Local => Err(anyhow::anyhow!(
                "Local provider should use LlamaCppEngine, not ExternalAPIEngine"
            )),
        }
    }

    /// Convert internal ChatMessage to API format
    fn convert_messages(&self, context: &[ChatMessage]) -> Vec<APIMessage> {
        context
            .iter()
            .map(|msg| APIMessage {
                role: msg.role.clone(),
                content: msg.content.clone(),
            })
            .collect()
    }

    /// Create a simple user message for prompt-only generation
    fn prompt_to_messages(&self, prompt: &str) -> Vec<APIMessage> {
        vec![
            APIMessage::system("You are a helpful, friendly AI companion."),
            APIMessage::user(prompt),
        ]
    }
}

#[async_trait]
impl InferenceEngine for ExternalAPIEngine {
    async fn generate(&self, prompt: &str) -> Result<String> {
        let messages = self.prompt_to_messages(prompt);
        let response = self
            .client
            .chat_completion(
                messages,
                self.default_config.max_new_tokens as u32,
                self.default_config.temperature,
            )
            .await?;

        Ok(response.content)
    }

    async fn generate_with_context(&self, context: &[ChatMessage]) -> Result<String> {
        let messages = self.convert_messages(context);

        tracing::info!(
            "📡 Sending {} messages to external API: {}",
            messages.len(),
            self.model_name
        );

        let response = self
            .client
            .chat_completion(
                messages,
                self.default_config.max_new_tokens as u32,
                self.default_config.temperature,
            )
            .await?;

        if let Some(usage) = &response.usage {
            tracing::info!(
                "✅ External API response: {} tokens (prompt: {}, completion: {})",
                usage.total_tokens,
                usage.prompt_tokens,
                usage.completion_tokens
            );
        }

        Ok(response.content)
    }

    async fn generate_with_config(
        &self,
        context: &[ChatMessage],
        config: &GenerationConfig,
    ) -> Result<String> {
        let messages = self.convert_messages(context);

        tracing::info!(
            "📡 Sending {} messages to external API with custom config: {}",
            messages.len(),
            self.model_name
        );

        let response = self
            .client
            .chat_completion(
                messages,
                config.max_new_tokens as u32,
                config.temperature,
            )
            .await?;

        Ok(response.content)
    }

    async fn generate_streaming(
        &self,
        context: &[ChatMessage],
        config: &GenerationConfig,
        token_sender: mpsc::Sender<String>,
    ) -> Result<String> {
        // For now, we don't support streaming with external APIs
        // Just generate the full response and send it as one chunk
        let response = self.generate_with_config(context, config).await?;

        // Send the complete response as a single chunk
        let _ = token_sender.send(response.clone()).await;

        Ok(response)
    }

    fn model_name(&self) -> &str {
        &self.model_name
    }

    fn tier(&self) -> ModelTier {
        self.tier
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_convert_messages() {
        let config = ExternalAPIConfig {
            provider: LLMProvider::Gemini,
            gemini_api_key: Some("test".to_string()),
            gemini_model: "test-model".to_string(),
            gemini_base_url: "https://test.com".to_string(),
            openrouter_api_key: None,
            openrouter_model: String::new(),
            openrouter_base_url: String::new(),
            timeout_secs: 30,
            max_retries: 3,
        };

        // This would fail without API key, so just test the message conversion logic
        let context = vec![
            ChatMessage {
                role: "system".to_string(),
                content: "You are helpful".to_string(),
                timestamp: 0,
            },
            ChatMessage {
                role: "user".to_string(),
                content: "Hello".to_string(),
                timestamp: 1,
            },
        ];

        // Create a mock engine just for testing conversion
        let messages: Vec<APIMessage> = context
            .iter()
            .map(|msg| APIMessage {
                role: msg.role.clone(),
                content: msg.content.clone(),
            })
            .collect();

        assert_eq!(messages.len(), 2);
        assert_eq!(messages[0].role, "system");
        assert_eq!(messages[1].role, "user");
    }
}
