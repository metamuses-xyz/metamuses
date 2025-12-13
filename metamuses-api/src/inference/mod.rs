pub mod engine;
pub mod external;
pub mod llama_engine;
pub mod models;
pub mod worker_pool;

// Primary engine - llama.cpp with Metal/CPU acceleration
pub use llama_engine::{LlamaCppConfig, LlamaCppEngine};

// External API engines
pub use external::{ExternalAPIEngine, ExternalAPIConfig, LLMProvider};

// Engine traits and configuration
pub use engine::{GenerationConfig, InferenceEngine};

// Model configuration
pub use models::{
    build_model_path, get_model_config, get_model_registry, get_models_dir, get_models_for_tier,
};
pub use worker_pool::{Worker, WorkerPool};

// Model Factory - creates the appropriate engine
pub struct ModelFactory;

impl ModelFactory {
    /// Create inference engine based on LLM_PROVIDER configuration
    ///
    /// Supports:
    /// - "local" (default): Uses llama.cpp with Metal/CPU acceleration
    /// - "gemini": Uses Google Gemini API
    /// - "openrouter": Uses OpenRouter API (multi-provider)
    pub async fn create_engine_from_config(
        app_config: &crate::config::Config,
    ) -> anyhow::Result<Box<dyn InferenceEngine>> {
        let provider = LLMProvider::from(app_config.llm_provider.as_str());

        match provider {
            LLMProvider::Gemini => {
                tracing::info!("🌐 Creating Gemini API inference engine");
                let external_config = ExternalAPIConfig::from_config(app_config);
                let engine = ExternalAPIEngine::new_gemini(&external_config)?;
                Ok(Box::new(engine))
            }
            LLMProvider::OpenRouter => {
                tracing::info!("🌐 Creating OpenRouter API inference engine");
                let external_config = ExternalAPIConfig::from_config(app_config);
                let engine = ExternalAPIEngine::new_openrouter(&external_config)?;
                Ok(Box::new(engine))
            }
            LLMProvider::Local => {
                tracing::info!("🚀 Creating local llama.cpp inference engine (Metal GPU)");

                // Build model path for local inference
                let model_path = format!("{}/qwen2.5-3b-instruct-q4_k_m.gguf", app_config.models_dir);
                let model_name = "qwen2.5-3b-instruct".to_string();

                let engine = LlamaCppEngine::new(
                    &model_path,
                    model_name,
                    crate::types::ModelTier::Fast,
                ).await?;

                Ok(Box::new(engine))
            }
        }
    }

    /// Create inference engine - uses llama.cpp by default for best performance
    /// (Legacy method for backward compatibility)
    pub async fn create_engine(
        config: &crate::types::ModelConfig,
    ) -> anyhow::Result<Box<dyn InferenceEngine>> {
        tracing::info!("🚀 Creating llama.cpp inference engine (Metal GPU)");

        let engine = LlamaCppEngine::new(
            &config.model_path,
            config.model_name.clone(),
            config.tier,
        ).await?;

        Ok(Box::new(engine))
    }

    /// Create engine with custom generation config
    pub async fn create_engine_with_config(
        config: &crate::types::ModelConfig,
        gen_config: GenerationConfig,
    ) -> anyhow::Result<Box<dyn InferenceEngine>> {
        let engine = LlamaCppEngine::new_with_config(
            &config.model_path,
            config.model_name.clone(),
            config.tier,
            gen_config,
        ).await?;

        Ok(Box::new(engine))
    }
}

/// Pre-configured generation settings for common use cases
impl GenerationConfig {
    /// Fast config for short, quick responses (chat)
    pub fn fast() -> Self {
        Self {
            max_new_tokens: 128,       // Short responses
            temperature: 0.7,
            top_p: 0.9,
            repetition_penalty: 1.1,
            stop_sequences: vec![
                "<|im_end|>".to_string(),
                "<|endoftext|>".to_string(),
            ],
        }
    }

    /// Creative config for more varied, longer responses
    pub fn creative() -> Self {
        Self {
            max_new_tokens: 300,
            temperature: 0.9,          // Higher temperature for creativity
            top_p: 0.95,
            repetition_penalty: 1.15,
            stop_sequences: vec![
                "<|im_end|>".to_string(),
                "<|endoftext|>".to_string(),
            ],
        }
    }

    /// Precise config for factual, deterministic responses
    pub fn precise() -> Self {
        Self {
            max_new_tokens: 200,
            temperature: 0.3,          // Low temperature for precision
            top_p: 0.85,
            repetition_penalty: 1.05,
            stop_sequences: vec![
                "<|im_end|>".to_string(),
                "<|endoftext|>".to_string(),
            ],
        }
    }

    /// Greedy config for fastest possible generation
    pub fn greedy() -> Self {
        Self {
            max_new_tokens: 100,
            temperature: 0.0,          // Greedy decoding (argmax)
            top_p: 1.0,
            repetition_penalty: 1.0,
            stop_sequences: vec![
                "<|im_end|>".to_string(),
                "<|endoftext|>".to_string(),
            ],
        }
    }
}
