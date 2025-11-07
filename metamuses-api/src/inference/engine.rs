use anyhow::Result;
use async_trait::async_trait;
use candle_core::{quantized::gguf_file, Device, IndexOp, Tensor};
use candle_transformers::models::quantized_qwen2::ModelWeights;
use std::sync::Arc;
use std::sync::Mutex;
use tokenizers::Tokenizer;

#[async_trait]
pub trait InferenceEngine: Send + Sync {
    /// Generate text from prompt
    async fn generate(&self, prompt: &str) -> Result<String>;

    /// Get model name
    fn model_name(&self) -> &str;

    /// Get model tier
    fn tier(&self) -> crate::types::ModelTier;
}

// ============================================================================
// Candle-based Inference Engine (Simplified for GGUF Qwen3 models)
// ============================================================================

pub struct CandleEngine {
    model_path: String,
    device: Device,
    model_name: String,
    tier: crate::types::ModelTier,
    tokenizer: Arc<Tokenizer>,
    model: Arc<Mutex<ModelWeights>>,
    generation_count: Arc<Mutex<usize>>,
}

impl CandleEngine {
    pub async fn new(
        model_path: &str,
        model_name: String,
        tier: crate::types::ModelTier,
    ) -> Result<Self> {
        let model_path_clone = model_path.to_string();
        let model_name_clone = model_name.clone();

        tokio::task::spawn_blocking(move || {
            tracing::info!("📦 Initializing Candle inference engine...");
            tracing::info!("   Model: {}", model_path_clone);

            // Initialize Metal device for M1/M2/M3/M4 Mac
            tracing::info!("🔧 Initializing Metal GPU device...");
            let device = match Device::new_metal(0) {
                Ok(d) => {
                    tracing::info!("✓ Metal GPU initialized successfully");
                    d
                }
                Err(e) => {
                    tracing::warn!("⚠ Metal GPU not available ({}), falling back to CPU", e);
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
            tracing::info!("   Ready for full GGUF inference!");

            Ok::<_, anyhow::Error>(Self {
                model_path: model_path_clone,
                device,
                model_name,
                tier,
                tokenizer: Arc::new(tokenizer),
                model: Arc::new(Mutex::new(model)),
                generation_count: Arc::new(Mutex::new(0)),
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
        // Qwen2.5/Qwen3 chat format
        format!(
            "<|im_start|>system\nYou are Qwen, created by Alibaba Cloud. You are a helpful assistant.<|im_end|>\n<|im_start|>user\n{}<|im_end|>\n<|im_start|>assistant\n",
            user_message
        )
    }
}

#[async_trait]
impl InferenceEngine for CandleEngine {
    async fn generate(&self, prompt: &str) -> Result<String> {
        let tokenizer = Arc::clone(&self.tokenizer);
        let model = Arc::clone(&self.model);
        let device = self.device.clone();
        let prompt_owned = prompt.to_string();
        let formatted_prompt = self.format_chat_prompt(&prompt_owned);
        let generation_count = Arc::clone(&self.generation_count);

        tokio::task::spawn_blocking(move || {
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
            tracing::info!("   Input tokens: {}", tokens.len());

            // Prepare input tensor
            let input_tokens = Tensor::new(tokens, &device)?.unsqueeze(0)?;

            // Generation parameters
            let max_new_tokens = 512;
            let temperature = 0.7;
            let mut generated_tokens = tokens.to_vec();

            tracing::info!("🎯 Generating response (max {} tokens)...", max_new_tokens);

            // Get model lock
            let mut model_guard = model.lock().unwrap();

            // First pass: process all input tokens to build KV cache
            let input_tensor = Tensor::new(tokens, &device)?.unsqueeze(0)?;
            let _ = model_guard.forward(&input_tensor, 0)?;

            // Autoregressive generation with KV cache
            for index in 0..max_new_tokens {
                // Only pass the last generated token (KV cache will be reused)
                let last_token = if index == 0 {
                    tokens[tokens.len() - 1] // Last input token
                } else {
                    generated_tokens[generated_tokens.len() - 1] // Last generated token
                };

                let input = Tensor::new(&[last_token], &device)?.unsqueeze(0)?;
                let logits = model_guard.forward(&input, tokens.len() + index)?;

                // Since we're only passing 1 token, logits should be [1, vocab_size]
                // Just squeeze the batch dimension to get [vocab_size]
                let last_logits = logits.squeeze(0)?;

                // Apply temperature
                let logits_temp = if temperature > 0.0 {
                    (last_logits / temperature)?
                } else {
                    last_logits
                };

                // Sample next token - logits_temp should be 1D [vocab_size]
                let probs = candle_nn::ops::softmax(&logits_temp, 0)?;
                let next_token = probs.argmax(0)?.to_scalar::<u32>()?;

                // Check for EOS token (assuming 151643 is EOS for Qwen, adjust if needed)
                if next_token == 151643 || next_token == 151645 {
                    tracing::info!("   Stopped at EOS token (generated {} tokens)", index);
                    break;
                }

                generated_tokens.push(next_token);

                // Progress indicator every 50 tokens
                if (index + 1) % 50 == 0 {
                    tracing::info!("   Generated {} tokens...", index + 1);
                }
            }

            // Decode response (skip the input tokens)
            let response_tokens = &generated_tokens[tokens.len()..];
            let response = tokenizer
                .decode(response_tokens, true)
                .map_err(|e| anyhow::anyhow!("Decoding failed: {}", e))?;

            tracing::info!(
                "✅ Response generated ({} tokens, {} chars)",
                response_tokens.len(),
                response.len()
            );

            Ok::<String, anyhow::Error>(response)
        })
        .await?
    }

    fn model_name(&self) -> &str {
        &self.model_name
    }

    fn tier(&self) -> crate::types::ModelTier {
        self.tier
    }
}

// ============================================================================
// Model Factory
// ============================================================================

pub struct ModelFactory;

impl ModelFactory {
    pub async fn create_engine(
        config: &crate::types::ModelConfig,
    ) -> Result<Box<dyn InferenceEngine>> {
        let engine =
            CandleEngine::new(&config.model_path, config.model_name.clone(), config.tier).await?;

        Ok(Box::new(engine))
    }
}
