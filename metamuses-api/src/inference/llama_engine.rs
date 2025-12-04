// LlamaCpp-based Inference Engine
// Uses llama.cpp via Rust bindings for high-performance inference with Metal GPU support

use anyhow::Result;
use async_trait::async_trait;
use llama_cpp::{LlamaModel, LlamaParams, SessionParams};
use llama_cpp::standard_sampler::{StandardSampler, SamplerStage};
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};

use crate::types::ChatMessage;
use super::engine::{GenerationConfig, InferenceEngine};

/// Configuration for LlamaCpp engine
#[derive(Clone)]
pub struct LlamaCppConfig {
    pub threads: usize,       // Number of CPU threads for inference
    pub batch_size: usize,    // Batch size for prompt processing
    pub context_size: usize,  // Context window size (n_ctx)
}

impl Default for LlamaCppConfig {
    fn default() -> Self {
        Self {
            threads: 4,        // Default 4 threads per worker
            batch_size: 512,   // Default batch size
            context_size: 2048, // Default context window
        }
    }
}

/// High-performance inference engine using llama.cpp with Metal/CPU acceleration
pub struct LlamaCppEngine {
    model: Arc<Mutex<LlamaModel>>,
    model_name: String,
    tier: crate::types::ModelTier,
    generation_count: Arc<std::sync::Mutex<usize>>,
    default_config: GenerationConfig,
    llama_config: LlamaCppConfig,
}

impl LlamaCppEngine {
    pub async fn new(
        model_path: &str,
        model_name: String,
        tier: crate::types::ModelTier,
    ) -> Result<Self> {
        Self::new_with_full_config(
            model_path,
            model_name,
            tier,
            GenerationConfig::default(),
            LlamaCppConfig::default(),
        ).await
    }

    pub async fn new_with_config(
        model_path: &str,
        model_name: String,
        tier: crate::types::ModelTier,
        config: GenerationConfig,
    ) -> Result<Self> {
        Self::new_with_full_config(model_path, model_name, tier, config, LlamaCppConfig::default()).await
    }

    /// Create engine with full configuration (for multi-worker deployments)
    pub async fn new_with_full_config(
        model_path: &str,
        model_name: String,
        tier: crate::types::ModelTier,
        config: GenerationConfig,
        llama_config: LlamaCppConfig,
    ) -> Result<Self> {
        let model_path = model_path.to_string();
        let model_name_clone = model_name.clone();
        let llama_config_clone = llama_config.clone();

        // Load model in blocking task
        let model = tokio::task::spawn_blocking(move || {
            tracing::info!("📦 Initializing llama.cpp inference engine...");
            tracing::info!("   Model: {}", model_path);

            // Configure model parameters
            let mut params = LlamaParams::default();

            // Configure thread count for CPU inference
            // On Linux ARM64, this controls how many CPU cores are used
            let threads = llama_config_clone.threads;
            tracing::info!("🔧 Configured {} threads for inference", threads);

            // Detect platform
            #[cfg(target_os = "macos")]
            tracing::info!("🔧 Metal GPU acceleration enabled (macOS)");

            #[cfg(target_os = "linux")]
            tracing::info!("🔧 CPU inference mode (Linux ARM64)");

            // Load the model
            tracing::info!("📥 Loading GGUF model...");
            let model = LlamaModel::load_from_file(&model_path, params)
                .map_err(|e| anyhow::anyhow!("Failed to load model: {:?}", e))?;

            tracing::info!("✅ llama.cpp engine initialized: {}", model_name_clone);
            tracing::info!("   Config: max_tokens={}, temp={}, threads={}, batch={}, ctx={}",
                config.max_new_tokens,
                config.temperature,
                llama_config_clone.threads,
                llama_config_clone.batch_size,
                llama_config_clone.context_size,
            );

            Ok::<_, anyhow::Error>(model)
        })
        .await??;

        Ok(Self {
            model: Arc::new(Mutex::new(model)),
            model_name,
            tier,
            generation_count: Arc::new(std::sync::Mutex::new(0)),
            default_config: config,
            llama_config,
        })
    }

    /// Format chat messages into Qwen chat template
    fn format_chat_prompt(messages: &[ChatMessage]) -> String {
        let mut formatted = String::new();

        for message in messages {
            let role = match message.role.as_str() {
                "system" => "system",
                "user" => "user",
                "assistant" => "assistant",
                _ => "user",
            };

            formatted.push_str(&format!(
                "<|im_start|>{}\n{}<|im_end|>\n",
                role, message.content
            ));
        }

        // Add assistant prompt to start generation
        formatted.push_str("<|im_start|>assistant\n");
        formatted
    }

    /// Format simple prompt into chat format
    fn format_simple_prompt(prompt: &str) -> String {
        format!(
            "<|im_start|>system\nYou are a helpful, friendly assistant.<|im_end|>\n\
             <|im_start|>user\n{}<|im_end|>\n\
             <|im_start|>assistant\n",
            prompt
        )
    }

    /// Internal generation with llama.cpp
    async fn generate_internal(
        &self,
        prompt: String,
        config: &GenerationConfig,
        token_sender: Option<mpsc::Sender<String>>,
    ) -> Result<String> {
        let model = self.model.clone();
        let config = config.clone();
        let generation_count = self.generation_count.clone();
        let llama_config = self.llama_config.clone();

        tokio::task::spawn_blocking(move || {
            let start_time = std::time::Instant::now();

            // Increment generation counter
            let count = {
                let mut c = generation_count.lock().unwrap();
                *c += 1;
                *c
            };

            tracing::info!("🔄 Processing inference request #{}", count);
            tracing::info!("   Prompt length: {} chars", prompt.len());

            // Lock the model
            let model_guard = futures::executor::block_on(model.lock());

            // Create a new session with configurable parameters
            let mut session_params = SessionParams::default();
            session_params.n_ctx = llama_config.context_size as u32;
            session_params.n_batch = llama_config.batch_size as u32;
            // CRITICAL: Set thread count for inference - this was missing!
            session_params.n_threads = llama_config.threads as u32;
            session_params.n_threads_batch = llama_config.threads as u32;

            tracing::info!("   Context: {} tokens, Batch: {}, Threads: {} (gen) / {} (batch)",
                session_params.n_ctx,
                session_params.n_batch,
                session_params.n_threads,
                session_params.n_threads_batch
            );

            let mut session = model_guard
                .create_session(session_params)
                .map_err(|e| anyhow::anyhow!("Failed to create session: {:?}", e))?;

            // Advance context with the prompt (prefill phase)
            let prefill_start = std::time::Instant::now();
            session
                .advance_context(&prompt)
                .map_err(|e| anyhow::anyhow!("Failed to advance context: {:?}", e))?;
            let prefill_time = prefill_start.elapsed();
            tracing::info!("   Prefill: {}ms", prefill_time.as_millis());

            // Configure sampler based on generation config
            let sampler = if config.temperature <= 0.01 {
                // Greedy sampling - always picks highest probability token
                StandardSampler::new_greedy()
            } else {
                // Softmax sampling with temperature and top-p
                let stages = vec![
                    SamplerStage::Temperature(config.temperature),
                    SamplerStage::TopP(config.top_p),
                    SamplerStage::RepetitionPenalty {
                        repetition_penalty: config.repetition_penalty,
                        frequency_penalty: 0.0,
                        presence_penalty: 0.0,
                        last_n: 64, // Look back 64 tokens for repetition
                    },
                ];
                StandardSampler::new_softmax(stages, 1) // min_keep = 1
            };

            // Generate tokens
            let decode_start = std::time::Instant::now();
            let completions_result = session
                .start_completing_with(sampler, config.max_new_tokens);

            let completions = match completions_result {
                Ok(handle) => handle.into_strings(),
                Err(e) => return Err(anyhow::anyhow!("Failed to start completion: {:?}", e)),
            };

            let mut response = String::new();
            let mut token_count = 0;

            // Collect tokens, optionally streaming
            for token_text in completions {
                // Check for EOS markers
                if token_text.contains("<|im_end|>") || token_text.contains("<|endoftext|>") {
                    tracing::info!("   ⏹ EOS token at position {}", token_count);
                    break;
                }

                // Repetition detection - stop if we're generating repetitive text
                if response.len() > 100 {
                    let last_50 = &response[response.len().saturating_sub(50)..];
                    if response[..response.len().saturating_sub(50)].contains(last_50) {
                        tracing::warn!("   ⚠️ Detected repetition, stopping");
                        break;
                    }
                }

                response.push_str(&token_text);
                token_count += 1;

                // Stream token if sender provided
                if let Some(ref sender) = token_sender {
                    let _ = sender.blocking_send(token_text);
                }

                // Progress indicator
                if token_count % 50 == 0 {
                    let elapsed = decode_start.elapsed().as_millis();
                    let tokens_per_sec = token_count as f64 / (elapsed as f64 / 1000.0);
                    tracing::info!("   Generated {} tokens ({:.1} tok/s)...", token_count, tokens_per_sec);
                }
            }

            let decode_time = decode_start.elapsed();
            let total_time = start_time.elapsed();

            // Clean up response
            let response = response
                .trim()
                .trim_end_matches("<|im_end|>")
                .trim_end_matches("<|endoftext|>")
                .trim()
                .to_string();

            // Performance metrics
            let tokens_per_sec = if decode_time.as_millis() > 0 {
                token_count as f64 / (decode_time.as_millis() as f64 / 1000.0)
            } else {
                0.0
            };

            tracing::info!(
                "✅ Generated {} tokens in {}ms ({:.1} tok/s) | prefill: {}ms | total: {}ms",
                token_count,
                decode_time.as_millis(),
                tokens_per_sec,
                prefill_time.as_millis(),
                total_time.as_millis()
            );

            Ok(response)
        })
        .await?
    }
}

#[async_trait]
impl InferenceEngine for LlamaCppEngine {
    async fn generate(&self, prompt: &str) -> Result<String> {
        let formatted = Self::format_simple_prompt(prompt);
        self.generate_internal(formatted, &self.default_config, None).await
    }

    async fn generate_with_context(&self, context: &[ChatMessage]) -> Result<String> {
        tracing::info!("📝 Using full conversation context ({} messages)", context.len());
        let formatted = Self::format_chat_prompt(context);
        self.generate_internal(formatted, &self.default_config, None).await
    }

    async fn generate_with_config(&self, context: &[ChatMessage], config: &GenerationConfig) -> Result<String> {
        let formatted = Self::format_chat_prompt(context);
        self.generate_internal(formatted, config, None).await
    }

    async fn generate_streaming(
        &self,
        context: &[ChatMessage],
        config: &GenerationConfig,
        token_sender: mpsc::Sender<String>,
    ) -> Result<String> {
        let formatted = Self::format_chat_prompt(context);
        self.generate_internal(formatted, config, Some(token_sender)).await
    }

    fn model_name(&self) -> &str {
        &self.model_name
    }

    fn tier(&self) -> crate::types::ModelTier {
        self.tier
    }
}
