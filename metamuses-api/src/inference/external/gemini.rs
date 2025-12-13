//! Google Gemini API client implementation

use anyhow::{anyhow, Result};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

use super::client::{APIMessage, APIResponse, ExternalLLMClient, TokenUsage, with_retry};
use super::config::ExternalAPIConfig;

/// Gemini API client
pub struct GeminiClient {
    client: Client,
    api_key: String,
    model: String,
    base_url: String,
    timeout_secs: u64,
    max_retries: u32,
}

// Gemini API request types
#[derive(Debug, Serialize)]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
    #[serde(rename = "generationConfig")]
    generation_config: GeminiGenerationConfig,
    #[serde(rename = "systemInstruction", skip_serializing_if = "Option::is_none")]
    system_instruction: Option<GeminiContent>,
}

#[derive(Debug, Serialize)]
struct GeminiContent {
    #[serde(skip_serializing_if = "Option::is_none")]
    role: Option<String>,
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize)]
struct GeminiPart {
    text: String,
}

#[derive(Debug, Serialize)]
struct GeminiGenerationConfig {
    temperature: f32,
    #[serde(rename = "topP")]
    top_p: f32,
    #[serde(rename = "maxOutputTokens")]
    max_output_tokens: u32,
}

// Gemini API response types
#[derive(Debug, Deserialize)]
struct GeminiResponse {
    candidates: Option<Vec<GeminiCandidate>>,
    #[serde(rename = "usageMetadata")]
    usage_metadata: Option<GeminiUsageMetadata>,
    error: Option<GeminiError>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidate {
    content: GeminiContentResponse,
    #[serde(rename = "finishReason")]
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GeminiContentResponse {
    parts: Vec<GeminiPartResponse>,
}

#[derive(Debug, Deserialize)]
struct GeminiPartResponse {
    text: String,
}

#[derive(Debug, Deserialize)]
struct GeminiUsageMetadata {
    #[serde(rename = "promptTokenCount")]
    prompt_token_count: Option<u32>,
    #[serde(rename = "candidatesTokenCount")]
    candidates_token_count: Option<u32>,
    #[serde(rename = "totalTokenCount")]
    total_token_count: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct GeminiError {
    code: i32,
    message: String,
    status: String,
}

impl GeminiClient {
    pub fn new(config: &ExternalAPIConfig) -> Result<Self> {
        let api_key = config
            .gemini_api_key
            .clone()
            .ok_or_else(|| anyhow!("GEMINI_API_KEY is required"))?;

        let client = Client::builder()
            .timeout(Duration::from_secs(config.timeout_secs))
            .build()?;

        Ok(Self {
            client,
            api_key,
            model: config.gemini_model.clone(),
            base_url: config.gemini_base_url.clone(),
            timeout_secs: config.timeout_secs,
            max_retries: config.max_retries,
        })
    }

    /// Convert standard messages to Gemini format
    fn convert_messages(&self, messages: Vec<APIMessage>) -> (Option<GeminiContent>, Vec<GeminiContent>) {
        let mut system_instruction = None;
        let mut contents = Vec::new();

        for msg in messages {
            match msg.role.as_str() {
                "system" => {
                    // Gemini uses systemInstruction for system prompts
                    system_instruction = Some(GeminiContent {
                        role: None,
                        parts: vec![GeminiPart { text: msg.content }],
                    });
                }
                "user" => {
                    contents.push(GeminiContent {
                        role: Some("user".to_string()),
                        parts: vec![GeminiPart { text: msg.content }],
                    });
                }
                "assistant" => {
                    // Gemini uses "model" instead of "assistant"
                    contents.push(GeminiContent {
                        role: Some("model".to_string()),
                        parts: vec![GeminiPart { text: msg.content }],
                    });
                }
                _ => {
                    // Default to user
                    contents.push(GeminiContent {
                        role: Some("user".to_string()),
                        parts: vec![GeminiPart { text: msg.content }],
                    });
                }
            }
        }

        (system_instruction, contents)
    }

    async fn send_request(
        &self,
        messages: Vec<APIMessage>,
        max_tokens: u32,
        temperature: f32,
    ) -> Result<APIResponse> {
        let (system_instruction, contents) = self.convert_messages(messages);

        let request = GeminiRequest {
            contents,
            generation_config: GeminiGenerationConfig {
                temperature,
                top_p: 0.9,
                max_output_tokens: max_tokens,
            },
            system_instruction,
        };

        let url = format!(
            "{}/models/{}:generateContent",
            self.base_url, self.model
        );

        tracing::debug!("Sending request to Gemini API: {}", self.model);

        let response = self
            .client
            .post(&url)
            .header("x-goog-api-key", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        let status = response.status();
        let body = response.text().await?;

        if !status.is_success() {
            // Parse error response
            if let Ok(error_resp) = serde_json::from_str::<GeminiResponse>(&body) {
                if let Some(error) = error_resp.error {
                    return Err(anyhow!(
                        "Gemini API error {}: {} ({})",
                        error.code,
                        error.message,
                        error.status
                    ));
                }
            }
            return Err(anyhow!("Gemini API error {}: {}", status, body));
        }

        let gemini_response: GeminiResponse = serde_json::from_str(&body)
            .map_err(|e| anyhow!("Failed to parse Gemini response: {}", e))?;

        // Extract finish_reason first (before consuming candidates)
        let finish_reason = gemini_response
            .candidates
            .as_ref()
            .and_then(|c| c.first())
            .and_then(|c| c.finish_reason.clone());

        // Extract content from response (consumes candidates)
        let content = gemini_response
            .candidates
            .and_then(|c| c.into_iter().next())
            .map(|c| {
                c.content
                    .parts
                    .into_iter()
                    .map(|p| p.text)
                    .collect::<Vec<_>>()
                    .join("")
            })
            .unwrap_or_default();

        let usage = gemini_response.usage_metadata.map(|u| TokenUsage {
            prompt_tokens: u.prompt_token_count.unwrap_or(0),
            completion_tokens: u.candidates_token_count.unwrap_or(0),
            total_tokens: u.total_token_count.unwrap_or(0),
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
impl ExternalLLMClient for GeminiClient {
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
                tracing::warn!("Gemini health check failed: {}", e);
                Ok(false)
            }
        }
    }
}

impl Clone for GeminiClient {
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
