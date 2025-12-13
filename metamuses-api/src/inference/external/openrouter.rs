//! OpenRouter API client implementation (OpenAI-compatible)

use anyhow::{anyhow, Result};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

use super::client::{APIMessage, APIResponse, ExternalLLMClient, TokenUsage, with_retry};
use super::config::ExternalAPIConfig;

/// OpenRouter API client
pub struct OpenRouterClient {
    client: Client,
    api_key: String,
    model: String,
    base_url: String,
    timeout_secs: u64,
    max_retries: u32,
}

// OpenRouter uses OpenAI-compatible format
#[derive(Debug, Serialize)]
struct OpenRouterRequest {
    model: String,
    messages: Vec<OpenRouterMessage>,
    max_tokens: u32,
    temperature: f32,
    #[serde(skip_serializing_if = "Option::is_none")]
    top_p: Option<f32>,
}

#[derive(Debug, Serialize)]
struct OpenRouterMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenRouterResponse {
    id: Option<String>,
    choices: Option<Vec<OpenRouterChoice>>,
    usage: Option<OpenRouterUsage>,
    error: Option<OpenRouterError>,
}

#[derive(Debug, Deserialize)]
struct OpenRouterChoice {
    message: OpenRouterMessageResponse,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OpenRouterMessageResponse {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenRouterUsage {
    prompt_tokens: u32,
    completion_tokens: u32,
    total_tokens: u32,
}

#[derive(Debug, Deserialize)]
struct OpenRouterError {
    code: Option<String>,
    message: String,
    #[serde(rename = "type")]
    error_type: Option<String>,
}

impl OpenRouterClient {
    pub fn new(config: &ExternalAPIConfig) -> Result<Self> {
        let api_key = config
            .openrouter_api_key
            .clone()
            .ok_or_else(|| anyhow!("OPENROUTER_API_KEY is required"))?;

        let client = Client::builder()
            .timeout(Duration::from_secs(config.timeout_secs))
            .build()?;

        Ok(Self {
            client,
            api_key,
            model: config.openrouter_model.clone(),
            base_url: config.openrouter_base_url.clone(),
            timeout_secs: config.timeout_secs,
            max_retries: config.max_retries,
        })
    }

    /// Convert standard messages to OpenRouter format
    fn convert_messages(&self, messages: Vec<APIMessage>) -> Vec<OpenRouterMessage> {
        messages
            .into_iter()
            .map(|m| OpenRouterMessage {
                role: m.role,
                content: m.content,
            })
            .collect()
    }

    async fn send_request(
        &self,
        messages: Vec<APIMessage>,
        max_tokens: u32,
        temperature: f32,
    ) -> Result<APIResponse> {
        let openrouter_messages = self.convert_messages(messages);

        let request = OpenRouterRequest {
            model: self.model.clone(),
            messages: openrouter_messages,
            max_tokens,
            temperature,
            top_p: Some(0.9),
        };

        let url = format!("{}/chat/completions", self.base_url);

        tracing::debug!("Sending request to OpenRouter API: {}", self.model);

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("HTTP-Referer", "https://metamuses.ai")
            .header("X-Title", "MetaMuses AI Companion")
            .json(&request)
            .send()
            .await?;

        let status = response.status();
        let body = response.text().await?;

        if !status.is_success() {
            // Parse error response
            if let Ok(error_resp) = serde_json::from_str::<OpenRouterResponse>(&body) {
                if let Some(error) = error_resp.error {
                    return Err(anyhow!(
                        "OpenRouter API error: {} ({})",
                        error.message,
                        error.code.unwrap_or_default()
                    ));
                }
            }
            return Err(anyhow!("OpenRouter API error {}: {}", status, body));
        }

        let openrouter_response: OpenRouterResponse = serde_json::from_str(&body)
            .map_err(|e| anyhow!("Failed to parse OpenRouter response: {}", e))?;

        // Check for error in response body
        if let Some(error) = openrouter_response.error {
            return Err(anyhow!(
                "OpenRouter API error: {} ({})",
                error.message,
                error.code.unwrap_or_default()
            ));
        }

        // Extract content from response
        let (content, finish_reason) = openrouter_response
            .choices
            .and_then(|c| c.into_iter().next())
            .map(|c| (c.message.content, c.finish_reason))
            .unwrap_or_default();

        let usage = openrouter_response.usage.map(|u| TokenUsage {
            prompt_tokens: u.prompt_tokens,
            completion_tokens: u.completion_tokens,
            total_tokens: u.total_tokens,
        });

        Ok(APIResponse {
            content,
            model: self.model.clone(),
            usage,
            finish_reason,
        })
    }
}

#[async_trait]
impl ExternalLLMClient for OpenRouterClient {
    async fn chat_completion(
        &self,
        messages: Vec<APIMessage>,
        max_tokens: u32,
        temperature: f32,
    ) -> Result<APIResponse> {
        let client = self.clone();
        let messages_clone = messages.clone();

        with_retry(self.max_retries, 1000, move || {
            let client = client.clone();
            let msgs = messages_clone.clone();
            async move { client.send_request(msgs, max_tokens, temperature).await }
        })
        .await
    }

    fn model_name(&self) -> &str {
        &self.model
    }

    async fn health_check(&self) -> Result<bool> {
        // Simple health check by sending a minimal request
        let messages = vec![APIMessage::user("Hi")];
        match self.chat_completion(messages, 10, 0.0).await {
            Ok(_) => Ok(true),
            Err(e) => {
                tracing::warn!("OpenRouter health check failed: {}", e);
                Ok(false)
            }
        }
    }
}

impl Clone for OpenRouterClient {
    fn clone(&self) -> Self {
        Self {
            client: self.client.clone(),
            api_key: self.api_key.clone(),
            model: self.model.clone(),
            base_url: self.base_url.clone(),
            timeout_secs: self.timeout_secs,
            max_retries: self.max_retries,
        }
    }
}
