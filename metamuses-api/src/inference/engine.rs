use alith::{Agent, Chat, inference::LlamaEngine};
use anyhow::Result;
use async_trait::async_trait;

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
// LlamaEngine Wrapper (All Tiers)
// ============================================================================
// Note: Currently using LlamaCpp for all tiers to avoid dependency conflicts
// TODO: Add MistralRS support once tokenizers version conflict is resolved

pub struct LlamaEngineWrapper {
    model_path: String,
    model_name: String,
    tier: crate::types::ModelTier,
}

impl LlamaEngineWrapper {
    pub async fn new(
        model_path: &str,
        model_name: String,
        tier: crate::types::ModelTier,
    ) -> Result<Self> {
        // Validate the model path exists by creating an engine
        let _engine = LlamaEngine::new(model_path).await?;

        Ok(Self {
            model_path: model_path.to_string(),
            model_name,
            tier,
        })
    }
}

#[async_trait]
impl InferenceEngine for LlamaEngineWrapper {
    async fn generate(&self, prompt: &str) -> Result<String> {
        // Create a new engine for this request
        // Note: This is inefficient but necessary since LlamaEngine doesn't implement Clone
        // TODO: Use a connection pool or shared engine in production
        let engine = LlamaEngine::new(&self.model_path).await?;

        let agent = Agent::new(&self.model_name, engine);
        let response = agent.prompt(prompt).await?;

        Ok(response)
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
        // Using LlamaEngine for all tiers for now
        // TODO: Add GPU-optimized engines (MistralRS, vLLM) when dependencies are fixed
        let engine = LlamaEngineWrapper::new(
            &config.model_path,
            config.model_name.clone(),
            config.tier,
        )
        .await?;

        Ok(Box::new(engine))
    }
}
