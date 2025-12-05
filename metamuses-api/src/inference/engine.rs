use anyhow::Result;
use async_trait::async_trait;
use tokio::sync::mpsc;

use crate::types::ChatMessage;

// Candle imports - only when candle feature is enabled
#[cfg(feature = "candle")]
use candle_core::{quantized::gguf_file, Device, Tensor};
#[cfg(feature = "candle")]
use candle_transformers::models::quantized_qwen2::ModelWeights;
#[cfg(feature = "candle")]
use std::sync::Arc;
#[cfg(feature = "candle")]
use std::sync::Mutex;
#[cfg(feature = "candle")]
use tokenizers::Tokenizer;

/// Generation configuration for performance tuning
#[derive(Debug, Clone)]
pub struct GenerationConfig {
    /// Maximum tokens to generate (reduced for faster responses)
    pub max_new_tokens: usize,
    /// Temperature for sampling (0.0 = greedy, higher = more random)
    pub temperature: f32,
    /// Top-p (nucleus) sampling threshold
    pub top_p: f32,
    /// Repetition penalty to avoid loops
    pub repetition_penalty: f32,
    /// Stop early on these strings
    pub stop_sequences: Vec<String>,
}

impl Default for GenerationConfig {
    fn default() -> Self {
        Self {
            max_new_tokens: 200,      // Reduced from 512 - most chat responses are shorter
            temperature: 0.7,          // Balanced creativity
            top_p: 0.9,                // Nucleus sampling for quality
            repetition_penalty: 1.1,   // Slight penalty for repetition
            stop_sequences: vec![
                "<|im_end|>".to_string(),
                "<|endoftext|>".to_string(),
            ],
        }
    }
}

#[async_trait]
pub trait InferenceEngine: Send + Sync {
    /// Generate text from prompt (legacy - simple string prompt)
    async fn generate(&self, prompt: &str) -> Result<String>;

    /// Generate text from full conversation context (system prompt + messages)
    async fn generate_with_context(&self, context: &[ChatMessage]) -> Result<String>;

    /// Generate with custom configuration
    async fn generate_with_config(&self, context: &[ChatMessage], config: &GenerationConfig) -> Result<String>;

    /// Generate with streaming - sends tokens as they are generated
    async fn generate_streaming(
        &self,
        context: &[ChatMessage],
        config: &GenerationConfig,
        token_sender: mpsc::Sender<String>,
    ) -> Result<String>;

    /// Get model name
    fn model_name(&self) -> &str;

    /// Get model tier
    fn tier(&self) -> crate::types::ModelTier;
}

// ============================================================================
// Candle-based Inference Engine (Optional - use llama.cpp for production)
// ============================================================================

#[cfg(feature = "candle")]
pub struct CandleEngine {
    #[allow(dead_code)]
    model_path: String,
    device: Device,
    model_name: String,
    tier: crate::types::ModelTier,
    tokenizer: Arc<Tokenizer>,
    model: Arc<Mutex<ModelWeights>>,
    generation_count: Arc<Mutex<usize>>,
    default_config: GenerationConfig,
    /// EOS token IDs for Qwen models
    eos_tokens: Vec<u32>,
}

#[cfg(feature = "candle")]
impl CandleEngine {
    pub async fn new(
        model_path: &str,
        model_name: String,
        tier: crate::types::ModelTier,
    ) -> Result<Self> {
        Self::new_with_config(model_path, model_name, tier, GenerationConfig::default()).await
    }

    pub async fn new_with_config(
        model_path: &str,
        model_name: String,
        tier: crate::types::ModelTier,
        config: GenerationConfig,
    ) -> Result<Self> {
        let model_path_clone = model_path.to_string();
        let model_name_clone = model_name.clone();

        // Configure thread pool for CPU operations
        let num_cpus = num_cpus::get();
        tracing::info!("🔧 Detected {} CPU cores, configuring thread pool...", num_cpus);

        // Set RAYON threads if not already set (for parallel matrix operations)
        if std::env::var("RAYON_NUM_THREADS").is_err() {
            std::env::set_var("RAYON_NUM_THREADS", num_cpus.to_string());
            tracing::info!("   Set RAYON_NUM_THREADS={}", num_cpus);
        }

        tokio::task::spawn_blocking(move || {
            tracing::info!("📦 Initializing Candle inference engine...");
            tracing::info!("   Model: {}", model_path_clone);

            // Initialize Metal device for M1/M2/M3/M4 Mac
            tracing::info!("🔧 Initializing compute device...");
            let device = match Device::new_metal(0) {
                Ok(d) => {
                    tracing::info!("✓ Metal GPU initialized successfully");
                    d
                }
                Err(e) => {
                    tracing::warn!("⚠ Metal GPU not available ({}), using CPU with Accelerate", e);
                    tracing::info!("   CPU threads: {}", num_cpus);
                    Device::Cpu
                }
            };

            // Verify model file exists
            if !std::path::Path::new(&model_path_clone).exists() {
                return Err(anyhow::anyhow!(
                    "Model file not found: {}",
                    model_path_clone
                ));
            }

            tracing::info!("✓ Model file verified");

            // Load tokenizer
            let tokenizer = Self::load_tokenizer(&model_path_clone)?;
            tracing::info!("✓ Tokenizer loaded");

            // Load GGUF model
            tracing::info!("📥 Loading GGUF model weights...");
            let mut file = std::fs::File::open(&model_path_clone)?;
            let model_content = gguf_file::Content::read(&mut file)
                .map_err(|e| anyhow::anyhow!("Failed to read GGUF file: {}", e))?;

            let model = ModelWeights::from_gguf(model_content, &mut file, &device)?;
            tracing::info!("✓ Model weights loaded successfully");

            tracing::info!("✅ Candle engine initialized: {}", model_name_clone);
            tracing::info!("   Config: max_tokens={}, temp={}, top_p={}",
                config.max_new_tokens, config.temperature, config.top_p);

            // Qwen EOS tokens
            let eos_tokens = vec![
                151643, // <|endoftext|>
                151644, // <|im_start|>
                151645, // <|im_end|>
            ];

            Ok::<_, anyhow::Error>(Self {
                model_path: model_path_clone,
                device,
                model_name,
                tier,
                tokenizer: Arc::new(tokenizer),
                model: Arc::new(Mutex::new(model)),
                generation_count: Arc::new(Mutex::new(0)),
                default_config: config,
                eos_tokens,
            })
        })
        .await?
    }

    fn load_tokenizer(model_path: &str) -> Result<Tokenizer> {
        let model_dir = std::path::Path::new(model_path)
            .parent()
            .ok_or_else(|| anyhow::anyhow!("Invalid model path"))?;

        let tokenizer_path = model_dir.join("tokenizer.json");

        if tokenizer_path.exists() {
            tracing::info!("   Loading tokenizer from: {}", tokenizer_path.display());
            let tokenizer = Tokenizer::from_file(&tokenizer_path)
                .map_err(|e| anyhow::anyhow!("Failed to load tokenizer: {}", e))?;
            Ok(tokenizer)
        } else {
            Err(anyhow::anyhow!(
                "Tokenizer not found at: {}. Please download tokenizer.json to the models directory.",
                tokenizer_path.display()
            ))
        }
    }

    fn format_chat_prompt(&self, user_message: &str) -> String {
        // Qwen2.5/Qwen3 chat format - fallback for simple prompts
        format!(
            "<|im_start|>system\nYou are a helpful, friendly assistant.<|im_end|>\n<|im_start|>user\n{}<|im_end|>\n<|im_start|>assistant\n",
            user_message
        )
    }

    /// Format full conversation context into Qwen chat format
    fn format_conversation(&self, context: &[ChatMessage]) -> String {
        let mut formatted = String::new();

        for message in context {
            let role = match message.role.as_str() {
                "system" => "system",
                "user" => "user",
                "assistant" => "assistant",
                _ => "user", // Default to user for unknown roles
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
}

#[cfg(feature = "candle")]
#[async_trait]
impl InferenceEngine for CandleEngine {
    async fn generate(&self, prompt: &str) -> Result<String> {
        let formatted_prompt = self.format_chat_prompt(prompt);
        self.generate_optimized(formatted_prompt, &self.default_config, None).await
    }

    async fn generate_with_context(&self, context: &[ChatMessage]) -> Result<String> {
        tracing::info!("📝 Using full conversation context ({} messages)", context.len());
        let formatted_prompt = self.format_conversation(context);
        self.generate_optimized(formatted_prompt, &self.default_config, None).await
    }

    async fn generate_with_config(&self, context: &[ChatMessage], config: &GenerationConfig) -> Result<String> {
        let formatted_prompt = self.format_conversation(context);
        self.generate_optimized(formatted_prompt, config, None).await
    }

    async fn generate_streaming(
        &self,
        context: &[ChatMessage],
        config: &GenerationConfig,
        token_sender: mpsc::Sender<String>,
    ) -> Result<String> {
        let formatted_prompt = self.format_conversation(context);
        self.generate_optimized(formatted_prompt, config, Some(token_sender)).await
    }

    fn model_name(&self) -> &str {
        &self.model_name
    }

    fn tier(&self) -> crate::types::ModelTier {
        self.tier
    }
}

#[cfg(feature = "candle")]
impl CandleEngine {
    /// Optimized generation with configurable parameters and optional streaming
    async fn generate_optimized(
        &self,
        formatted_prompt: String,
        config: &GenerationConfig,
        token_sender: Option<mpsc::Sender<String>>,
    ) -> Result<String> {
        let tokenizer = Arc::clone(&self.tokenizer);
        let model = Arc::clone(&self.model);
        let device = self.device.clone();
        let generation_count = Arc::clone(&self.generation_count);
        let eos_tokens = self.eos_tokens.clone();
        let config = config.clone();

        Self::generate_internal(tokenizer, model, device, formatted_prompt, generation_count).await
    }

    async fn generate_with_context(&self, context: &[ChatMessage]) -> Result<String> {
        let tokenizer = Arc::clone(&self.tokenizer);
        let model = Arc::clone(&self.model);
        let device = self.device.clone();
        let formatted_prompt = self.format_conversation(context);
        let generation_count = Arc::clone(&self.generation_count);

        tracing::info!("📝 Using full conversation context ({} messages)", context.len());

        Self::generate_internal(tokenizer, model, device, formatted_prompt, generation_count).await
    }

    fn model_name(&self) -> &str {
        &self.model_name
    }

    fn tier(&self) -> crate::types::ModelTier {
        self.tier
    }
}

#[cfg(feature = "candle")]
impl CandleEngine {
    /// Internal generation function shared by both generate methods
    async fn generate_internal(
        tokenizer: Arc<Tokenizer>,
        model: Arc<Mutex<ModelWeights>>,
        device: Device,
        formatted_prompt: String,
        generation_count: Arc<Mutex<usize>>,
    ) -> Result<String> {
        tokio::task::spawn_blocking(move || {
            let start_time = std::time::Instant::now();

            // Increment generation counter
            let count = {
                let mut c = generation_count.lock().unwrap();
                *c += 1;
                *c
            };

            tracing::info!("🔄 Processing inference request #{}", count);

            // Tokenize input
            let encoding = tokenizer
                .encode(formatted_prompt.clone(), false)
                .map_err(|e| anyhow::anyhow!("Tokenization failed: {}", e))?;

            let tokens = encoding.get_ids();
            let input_len = tokens.len();
            tracing::info!("   Input tokens: {}", input_len);

            // Truncate if context too long (keep first 2048 + last 1024 tokens)
            let tokens: Vec<u32> = if tokens.len() > 3072 {
                tracing::warn!("   ⚠️ Context too long ({}), truncating...", tokens.len());
                let mut truncated = tokens[..2048].to_vec();
                truncated.extend_from_slice(&tokens[tokens.len()-1024..]);
                truncated
            } else {
                tokens.to_vec()
            };

            let mut generated_tokens: Vec<u32> = Vec::with_capacity(config.max_new_tokens);

            tracing::info!("🎯 Generating (max {} tokens, temp={:.2})...",
                config.max_new_tokens, config.temperature);

            // Get model lock - this is where we spend most time
            let mut model_guard = model.lock().unwrap();

            // Prefill phase: process all input tokens to build KV cache
            // For large contexts, process in chunks to avoid memory spikes
            let prefill_start = std::time::Instant::now();

            let chunk_size = 256; // Process 256 tokens at a time for better memory efficiency
            if tokens.len() > chunk_size {
                // Chunked prefill for large contexts
                let mut pos = 0;
                for chunk in tokens.chunks(chunk_size) {
                    let chunk_tensor = Tensor::new(chunk, &device)?.unsqueeze(0)?;
                    let _ = model_guard.forward(&chunk_tensor, pos)?;
                    pos += chunk.len();
                }
                tracing::info!("   Prefill: {}ms ({} tokens, chunked)",
                    prefill_start.elapsed().as_millis(), tokens.len());
            } else {
                // Single pass for smaller contexts
                let input_tensor = Tensor::new(&tokens[..], &device)?.unsqueeze(0)?;
                let _ = model_guard.forward(&input_tensor, 0)?;
                tracing::info!("   Prefill: {}ms ({} tokens)",
                    prefill_start.elapsed().as_millis(), tokens.len());
            }
            let prefill_time = prefill_start.elapsed();

            // Decode phase: autoregressive generation with KV cache
            let decode_start = std::time::Instant::now();
            let mut last_token = tokens[tokens.len() - 1];
            let mut repetition_count = 0;
            let mut last_few_tokens: Vec<u32> = Vec::with_capacity(10);

            for index in 0..config.max_new_tokens {
                // Single token forward pass (KV cache reused)
                let input = Tensor::new(&[last_token], &device)?.unsqueeze(0)?;
                let logits = model_guard.forward(&input, tokens.len() + index)?;

                // Get logits for next token prediction
                let logits = logits.squeeze(0)?;

                // Sample next token based on temperature
                let next_token = if config.temperature <= 0.01 {
                    // Greedy decoding - fastest path
                    logits.argmax(0)?.to_scalar::<u32>()?
                } else {
                    // Temperature + top-p sampling
                    Self::sample_with_top_p(&logits, config.temperature, config.top_p, &device)?
                };

                // Check for EOS tokens
                if eos_tokens.contains(&next_token) {
                    tracing::info!("   ⏹ EOS token at position {} (generated {} tokens)", index, generated_tokens.len());
                    break;
                }

                // Repetition detection - stop if repeating same token 5+ times
                if !generated_tokens.is_empty() && next_token == generated_tokens[generated_tokens.len() - 1] {
                    repetition_count += 1;
                    if repetition_count >= 5 {
                        tracing::warn!("   ⚠️ Detected token repetition, stopping early");
                        break;
                    }
                } else {
                    repetition_count = 0;
                }

                // N-gram repetition check (stop if last 4 tokens repeat)
                last_few_tokens.push(next_token);
                if last_few_tokens.len() > 8 {
                    last_few_tokens.remove(0);
                    if last_few_tokens.len() >= 8 {
                        let first_half = &last_few_tokens[0..4];
                        let second_half = &last_few_tokens[4..8];
                        if first_half == second_half {
                            tracing::warn!("   ⚠️ Detected n-gram repetition, stopping early");
                            break;
                        }
                    }
                }

                generated_tokens.push(next_token);
                last_token = next_token;

                // Stream token if sender provided (non-blocking)
                if let Some(ref sender) = token_sender {
                    if let Ok(token_text) = tokenizer.decode(&[next_token], false) {
                        // Non-blocking send - drop if receiver is full
                        let _ = sender.try_send(token_text);
                    }
                }

                // Progress indicator every 50 tokens
                if (index + 1) % 50 == 0 {
                    let elapsed = decode_start.elapsed().as_millis();
                    let tokens_per_sec = (index + 1) as f64 / (elapsed as f64 / 1000.0);
                    tracing::info!("   Generated {} tokens ({:.1} tok/s)...", index + 1, tokens_per_sec);
                }
            }

            let decode_time = decode_start.elapsed();
            let total_time = start_time.elapsed();

            // Release model lock before decoding
            drop(model_guard);

            // Decode response
            let response = tokenizer
                .decode(&generated_tokens, true)
                .map_err(|e| anyhow::anyhow!("Decoding failed: {}", e))?;

            // Clean up response
            let response = response
                .trim()
                .trim_end_matches("<|im_end|>")
                .trim_end_matches("<|endoftext|>")
                .trim()
                .to_string();

            // Performance metrics
            let tokens_generated = generated_tokens.len();
            let tokens_per_sec = if decode_time.as_millis() > 0 {
                tokens_generated as f64 / (decode_time.as_millis() as f64 / 1000.0)
            } else {
                0.0
            };

            tracing::info!(
                "✅ Generated {} tokens in {}ms ({:.1} tok/s) | prefill: {}ms | total: {}ms",
                tokens_generated,
                decode_time.as_millis(),
                tokens_per_sec,
                prefill_time.as_millis(),
                total_time.as_millis()
            );

            Ok::<String, anyhow::Error>(response)
        })
        .await?
    }

    /// Top-p (nucleus) sampling for better quality generation
    fn sample_with_top_p(logits: &Tensor, temperature: f32, top_p: f32, _device: &Device) -> Result<u32> {
        // Apply temperature
        let logits = (logits / temperature as f64)?;

        // Compute softmax probabilities
        let probs = candle_nn::ops::softmax(&logits, 0)?;
        let probs_vec: Vec<f32> = probs.to_vec1()?;

        // Sort indices by probability (descending)
        let mut indexed_probs: Vec<(usize, f32)> = probs_vec.iter().enumerate().map(|(i, &p)| (i, p)).collect();
        indexed_probs.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        // Find cutoff index for top-p
        let mut cumsum = 0.0f32;
        let mut cutoff_idx = indexed_probs.len();
        for (i, (_, p)) in indexed_probs.iter().enumerate() {
            cumsum += p;
            if cumsum >= top_p {
                cutoff_idx = i + 1;
                break;
            }
        }

        // Truncate to top-p tokens
        let top_p_probs: Vec<(usize, f32)> = indexed_probs.into_iter().take(cutoff_idx).collect();

        // Renormalize probabilities
        let sum: f32 = top_p_probs.iter().map(|(_, p)| p).sum();
        let normalized: Vec<(usize, f32)> = top_p_probs.into_iter().map(|(i, p)| (i, p / sum)).collect();

        // Sample from the distribution
        let mut rng_value: f32 = rand::random();
        for (idx, prob) in normalized {
            rng_value -= prob;
            if rng_value <= 0.0 {
                return Ok(idx as u32);
            }
        }

        // Fallback to most likely token
        Ok(probs.argmax(0)?.to_scalar::<u32>()?)
    }
}

// Note: ModelFactory has been moved to mod.rs to support multiple backends
