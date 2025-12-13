//! External LLM API clients for Gemini and OpenRouter
//!
//! This module provides implementations for calling external LLM APIs
//! as an alternative to local model inference.

pub mod adapter;
pub mod client;
pub mod config;
pub mod gemini;
pub mod openrouter;

pub use adapter::ExternalAPIEngine;
pub use client::{ExternalLLMClient, APIMessage, APIResponse, TokenUsage};
pub use config::{LLMProvider, ExternalAPIConfig};
pub use gemini::GeminiClient;
pub use openrouter::OpenRouterClient;
