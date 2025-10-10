use crate::types::{ModelConfig, ModelTier, Domain};
use lazy_static::lazy_static;
use std::collections::HashMap;

lazy_static! {
    pub static ref MODEL_REGISTRY: HashMap<ModelTier, Vec<ModelConfig>> = {
        let mut registry = HashMap::new();

        // Fast Tier Models
        registry.insert(
            ModelTier::Fast,
            vec![
                ModelConfig {
                    model_path: "/models/qwen2.5-1.5b-instruct-q5_k_m.gguf".to_string(),
                    model_name: "Qwen2.5-1.5B-Instruct".to_string(),
                    tier: ModelTier::Fast,
                    context_length: 32768,
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: 512,
                    num_threads: Some(8),
                    gpu_layers: None,
                },
                ModelConfig {
                    model_path: "/models/phi-3-mini-4k-instruct-q5_k_m.gguf".to_string(),
                    model_name: "Phi-3-Mini-4K-Instruct".to_string(),
                    tier: ModelTier::Fast,
                    context_length: 4096,
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: 512,
                    num_threads: Some(8),
                    gpu_layers: None,
                },
            ],
        );

        // Medium Tier Models
        registry.insert(
            ModelTier::Medium,
            vec![
                ModelConfig {
                    model_path: "/models/qwen2.5-7b-instruct-q5_k_m.gguf".to_string(),
                    model_name: "Qwen2.5-7B-Instruct".to_string(),
                    tier: ModelTier::Medium,
                    context_length: 131072,
                    temperature: 0.8,
                    top_p: 0.95,
                    max_tokens: 2048,
                    num_threads: Some(4),
                    gpu_layers: Some(35),
                },
                ModelConfig {
                    model_path: "/models/llama-3.1-8b-instruct-q5_k_m.gguf".to_string(),
                    model_name: "LLaMA-3.1-8B-Instruct".to_string(),
                    tier: ModelTier::Medium,
                    context_length: 131072,
                    temperature: 0.8,
                    top_p: 0.95,
                    max_tokens: 2048,
                    num_threads: Some(4),
                    gpu_layers: Some(35),
                },
            ],
        );

        // Heavy Tier Models
        registry.insert(
            ModelTier::Heavy,
            vec![
                ModelConfig {
                    model_path: "/models/qwen2.5-72b-instruct-awq".to_string(),
                    model_name: "Qwen2.5-72B-Instruct-AWQ".to_string(),
                    tier: ModelTier::Heavy,
                    context_length: 131072,
                    temperature: 0.9,
                    top_p: 0.95,
                    max_tokens: 4096,
                    num_threads: Some(8),
                    gpu_layers: Some(80),
                },
            ],
        );

        // Specialized Models
        registry.insert(
            ModelTier::Specialized(Domain::Code),
            vec![
                ModelConfig {
                    model_path: "/models/deepseek-coder-v2-lite-instruct".to_string(),
                    model_name: "DeepSeek-Coder-V2-Lite-Instruct".to_string(),
                    tier: ModelTier::Specialized(Domain::Code),
                    context_length: 16384,
                    temperature: 0.7,
                    top_p: 0.95,
                    max_tokens: 4096,
                    num_threads: Some(4),
                    gpu_layers: Some(40),
                },
            ],
        );

        registry
    };
}

pub fn get_model_config(tier: ModelTier) -> Option<&'static ModelConfig> {
    MODEL_REGISTRY.get(&tier)?.first()
}
