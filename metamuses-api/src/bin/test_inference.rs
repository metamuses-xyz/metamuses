// Simple test binary to verify model loading and inference
// Usage: cd metamuses-api && cargo run --bin test-inference

use anyhow::Result;
use metamuses_api::{
    config::Config,
    inference::{models, ModelFactory},
    types::ModelTier,
};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_target(false)
        .with_level(true)
        .init();

    println!("╔════════════════════════════════════════╗");
    println!("║  MetaMuses Model Inference Test       ║");
    println!("╚════════════════════════════════════════╝\n");

    // Load configuration
    println!("📝 Loading configuration...");
    dotenv::dotenv().ok();
    let config = Config::from_env()?;
    println!("✅ Configuration loaded");
    println!("   Models directory: {}\n", config.models_dir);

    // Check models directory
    println!("📂 Checking models directory...");
    let models_dir = models::get_models_dir();
    println!("   Resolved path: {}", models_dir);

    let model_path =
        std::path::PathBuf::from(&models_dir).join("Qwen3-4B-Instruct-2507-IQ4_XS.gguf");
    if model_path.exists() {
        println!("✅ Model file found: {}", model_path.display());

        // Get file size
        if let Ok(metadata) = std::fs::metadata(&model_path) {
            let size_mb = metadata.len() as f64 / (1024.0 * 1024.0);
            println!("   Size: {:.2} MB", size_mb);
        }
    } else {
        println!("❌ Model file not found: {}", model_path.display());
        println!("   Please ensure the model file is in the correct location.");
        return Ok(());
    }
    println!();

    // Test model registry
    println!("🔍 Testing model registry...");
    let registry = models::get_model_registry();
    println!("   Available tiers: {}", registry.len());

    for (tier, configs) in &registry {
        println!("   - {:?}: {} models", tier, configs.len());
        for config in configs {
            println!("     • {} ({})", config.model_name, config.model_path);
        }
    }
    println!();

    // Test loading Fast tier model
    println!("🚀 Testing Fast tier model loading...");
    match models::get_model_config(ModelTier::Fast) {
        Some(model_config) => {
            println!("✅ Model config found:");
            println!("   Name: {}", model_config.model_name);
            println!("   Path: {}", model_config.model_path);
            println!("   Context: {} tokens", model_config.context_length);
            println!("   Threads: {:?}", model_config.num_threads);
            println!();

            // Try to create engine
            println!("🔧 Creating inference engine...");
            match ModelFactory::create_engine(&model_config).await {
                Ok(engine) => {
                    println!("✅ Engine created successfully");
                    println!("   Model: {}", engine.model_name());
                    println!("   Tier: {:?}", engine.tier());
                    println!();

                    // Test inference
                    println!("💬 Testing inference...");
                    let test_prompts = vec![
                        "Hello! How are you today?",
                        "What is 2+2?",
                        "Write a haiku about AI.",
                    ];

                    for (i, prompt) in test_prompts.iter().enumerate() {
                        println!("\n📨 Prompt {}: {}", i + 1, prompt);

                        let start = std::time::Instant::now();
                        match engine.generate(prompt).await {
                            Ok(response) => {
                                let duration = start.elapsed();
                                println!("✅ Response ({}ms):", duration.as_millis());
                                println!("   {}", response.trim());
                            }
                            Err(e) => {
                                println!("❌ Error: {}", e);
                            }
                        }
                    }
                    println!();
                }
                Err(e) => {
                    println!("❌ Failed to create engine: {}", e);
                    println!("   This could be due to:");
                    println!("   - Model file corrupted or incompatible");
                    println!("   - Insufficient memory");
                    println!("   - Missing dependencies (llama.cpp)");
                }
            }
        }
        None => {
            println!("❌ No model config found for Fast tier");
        }
    }

    println!("\n╔════════════════════════════════════════╗");
    println!("║  Test Complete                        ║");
    println!("╚════════════════════════════════════════╝");

    Ok(())
}
