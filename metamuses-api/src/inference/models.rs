use crate::types::{Domain, ModelConfig, ModelTier};
use std::collections::HashMap;
use std::path::PathBuf;

/// Get the base models directory path
/// Tries: env MODELS_DIR -> ./models (relative) -> /models (absolute)
pub fn get_models_dir() -> String {
    std::env::var("MODELS_DIR").unwrap_or_else(|_| {
        // Try relative path first (for development)
        let relative = PathBuf::from("models");
        if relative.exists() {
            "models".to_string()
        } else {
            // Fallback to absolute path
            "/models".to_string()
        }
    })
}

/// Build model path from base directory and filename
pub fn build_model_path(filename: &str) -> String {
    let base = get_models_dir();
    PathBuf::from(base)
        .join(filename)
        .to_string_lossy()
        .to_string()
}

/// Get model registry with dynamic paths
pub fn get_model_registry() -> HashMap<ModelTier, Vec<ModelConfig>> {
    let mut registry = HashMap::new();

    // Fast Tier Models (< 500ms target)
    // Note: Most models commented out - only Qwen3-4B is available locally
    registry.insert(
        ModelTier::Fast,
        vec![
            // Qwen2.5-3B-Instruct with Q4_K_M quantization (Candle 0.9 compatible)
            ModelConfig {
                model_path: build_model_path("qwen2.5-3b-instruct-q4_k_m.gguf"),
                model_name: "Qwen2.5-3B-Instruct".to_string(),
                tier: ModelTier::Fast,
                context_length: 32768,
                temperature: 0.7,
                top_p: 0.8,
                max_tokens: 256, // Optimized for faster responses with KV cache
                num_threads: Some(8),
                gpu_layers: None, // Full GPU acceleration with Metal
            },
            // Uncomment when available:
            // ModelConfig {
            //     model_path: build_model_path("qwen2.5-1.5b-instruct-q5_k_m.gguf"),
            //     model_name: "Qwen2.5-1.5B-Instruct".to_string(),
            //     tier: ModelTier::Fast,
            //     context_length: 32768,
            //     temperature: 0.7,
            //     top_p: 0.9,
            //     max_tokens: 512,
            //     num_threads: Some(8),
            //     gpu_layers: None,
            // },
        ],
    );

    // Medium Tier Models (< 2s target)
    registry.insert(
        ModelTier::Medium,
        vec![
            // Using Qwen3-4B Q4_K_M for medium tier too
            ModelConfig {
                model_path: build_model_path("Qwen3-4B-Instruct-2507-Q4_K_M.gguf"),
                model_name: "Qwen3-4B-Instruct".to_string(),
                tier: ModelTier::Medium,
                context_length: 32768,
                temperature: 0.7,
                top_p: 0.8, // HuggingFace recommended
                max_tokens: 2048,
                num_threads: Some(6),
                gpu_layers: None,
            },
            // Uncomment when available:
            // ModelConfig {
            //     model_path: build_model_path("qwen2.5-7b-instruct-q5_k_m.gguf"),
            //     model_name: "Qwen2.5-7B-Instruct".to_string(),
            //     tier: ModelTier::Medium,
            //     context_length: 131072,
            //     temperature: 0.8,
            //     top_p: 0.95,
            //     max_tokens: 2048,
            //     num_threads: Some(4),
            //     gpu_layers: Some(35),
            // },
        ],
    );

    // Heavy Tier Models (< 5s target)
    // Disabled by default - no heavy models available
    registry.insert(
        ModelTier::Heavy,
        vec![
            // Uncomment when 72B model is available:
            // ModelConfig {
            //     model_path: build_model_path("qwen2.5-72b-instruct-awq"),
            //     model_name: "Qwen2.5-72B-Instruct-AWQ".to_string(),
            //     tier: ModelTier::Heavy,
            //     context_length: 131072,
            //     temperature: 0.9,
            //     top_p: 0.95,
            //     max_tokens: 4096,
            //     num_threads: Some(8),
            //     gpu_layers: Some(80),
            // },
        ],
    );

    // Specialized Models
    registry.insert(
        ModelTier::Specialized(Domain::Code),
        vec![
            // Using Qwen3-4B Q4_K_M for code tasks too (it's a capable model)
            ModelConfig {
                model_path: build_model_path("Qwen3-4B-Instruct-2507-Q4_K_M.gguf"),
                model_name: "Qwen3-4B-Instruct".to_string(),
                tier: ModelTier::Specialized(Domain::Code),
                context_length: 32768,
                temperature: 0.7,
                top_p: 0.95,
                max_tokens: 4096,
                num_threads: Some(6),
                gpu_layers: None,
            },
        ],
    );

    registry
}

/// Get the first available model config for a tier
pub fn get_model_config(tier: ModelTier) -> Option<ModelConfig> {
    get_model_registry().get(&tier)?.first().cloned()
}

/// Get all available model configs for a tier
pub fn get_models_for_tier(tier: ModelTier) -> Vec<ModelConfig> {
    get_model_registry().get(&tier).cloned().unwrap_or_default()
}
