use crate::api::types::*;
use crate::models::{Interaction, InteractionType, Message};
use crate::routing::IntelligentRouter;
use crate::services::{CompanionService, InstructionService, MemoryService, PersonalityEngine};
use crate::types::{InferenceRequest, ModelTier};
use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use std::sync::Arc;
use tracing::{error, info};
use uuid::Uuid;

// ============================================================================
// Enhanced Application State with Companion Services
// ============================================================================

#[derive(Clone)]
pub struct CompanionAppState {
    pub router: Arc<IntelligentRouter>,
    pub companion_service: Arc<CompanionService>,
    pub memory_service: Arc<MemoryService>,
    pub instruction_service: Arc<InstructionService>,
    pub interaction_stats_service: Arc<crate::services::InteractionStatsService>,
    pub redis_client: Arc<redis::Client>,
    pub rate_limiter: Arc<crate::api::middleware::RateLimiter>,
    pub start_time: std::time::Instant,
    pub metrics: Arc<tokio::sync::RwLock<CompanionChatMetrics>>,
}

#[derive(Debug, Default)]
pub struct CompanionChatMetrics {
    pub total_requests: u64,
    pub fast_tier: u64,
    pub medium_tier: u64,
    pub heavy_tier: u64,
    pub specialized_tier: u64,
    pub cache_hits: u64,
    pub total_latency_ms: u64,
    pub total_xp_awarded: i64,
    pub companions_interacted: std::collections::HashSet<uuid::Uuid>,
}

// ============================================================================
// Companion-Aware Chat Handler
// ============================================================================

/// Enhanced chat handler with companion context, memory, and personality
pub async fn companion_chat_handler(
    State(state): State<CompanionAppState>,
    Json(req): Json<ChatRequest>,
) -> Result<Json<CompanionChatResponse>, AppError> {
    info!(
        "Received companion chat request from user: {}, muse_id: {}, query length: {}",
        req.user_address,
        req.muse_id,
        req.query.len()
    );

    // Validate request
    if req.query.trim().is_empty() {
        return Err(AppError::BadRequest("Query cannot be empty".to_string()));
    }

    if req.user_address.is_empty() {
        return Err(AppError::BadRequest("User address is required".to_string()));
    }

    // STEP 0A: Rate limiting check (before expensive auth)
    if !state.rate_limiter.check(&req.user_address.to_lowercase()).await {
        return Err(AppError::TooManyRequests(
            "Rate limit exceeded. Please wait before sending another message.".to_string()
        ));
    }

    // STEP 0B: Authenticate request (EIP-712 signature verification)
    let _verified_address = crate::api::auth::authenticate_chat_request(
        &state.redis_client,
        &req.user_address,
        req.timestamp,
        req.nonce.as_deref(),
        req.signature.as_deref(),
    )
    .await
    .map_err(|e| {
        error!("Authentication failed: {}", e);
        AppError::Unauthorized(format!("Authentication failed: {}", e))
    })?;

    info!("✓ Request authenticated for {}", req.user_address);

    let request_id = Uuid::new_v4();
    let start = std::time::Instant::now();

    // STEP 1: Get companion by muse_id
    // Note: muse_id is the unique companion instance ID, not the NFT token_id
    let companion = state
        .companion_service
        .get_companion_by_muse_id(req.muse_id as i64)
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to get companion: {}", e)))?
        .ok_or_else(|| {
            AppError::NotFound(format!(
                "Companion with muse_id {} not found. Please create a companion first.",
                req.muse_id
            ))
        })?;

    info!(
        "Using companion: {} (level {}, public: {})",
        companion.name, companion.level, companion.is_public
    );

    // STEP 2: Access control - NFT-gated with privacy levels
    // Private companions: Only the specific NFT owner can chat
    // Public companions: Any NFT holder can chat (not just the owner)

    // First, check if user owns ANY MuseAI NFT
    let owned_tokens = state
        .companion_service
        .get_owned_tokens(&req.user_address)
        .await
        .map_err(|e| {
            error!("Failed to get owned tokens: {}", e);
            AppError::InternalError(format!("Failed to verify NFT ownership: {}", e))
        })?;

    if owned_tokens.is_empty() {
        return Err(AppError::Unauthorized(
            "You must own at least one MuseAI NFT to chat with companions. Please mint an NFT first.".to_string()
        ));
    }

    info!(
        "✓ User {} owns {} MuseAI NFT(s): {:?}",
        req.user_address,
        owned_tokens.len(),
        owned_tokens
    );

    // For private companions, verify user owns the SPECIFIC NFT
    if !companion.is_public {
        info!(
            "Private companion - checking if user owns specific NFT #{}",
            companion.nft_token_id
        );

        if !owned_tokens.contains(&companion.nft_token_id) {
            return Err(AppError::Unauthorized(format!(
                "This is a private companion. You must own MuseAI NFT #{} to chat with it. You own: {:?}",
                companion.nft_token_id,
                owned_tokens
            )));
        }

        info!(
            "✓ Private companion access granted - user owns NFT #{}",
            companion.nft_token_id
        );
    } else {
        info!(
            "✓ Public companion access granted - user owns NFT(s): {:?}",
            owned_tokens
        );
    }

    // STEP 3: Build conversation context with semantic search
    let context = state
        .memory_service
        .build_context_with_query(
            companion.id,
            &req.user_address,
            &req.query, // Use query for semantic search to find relevant memories
            20,         // Increased from 10 to get more context
        )
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to build context: {}", e)))?;

    let is_first_conversation = context.is_first_conversation();

    info!(
        "Context built: {} messages, {} facts",
        context.messages.len(),
        context.facts.len()
    );

    // STEP 4: Fetch user instructions
    let effective_instructions = state
        .instruction_service
        .get_effective_instructions(companion.id, &req.user_address)
        .await
        .unwrap_or_else(|e| {
            error!("Failed to get user instructions: {}", e);
            crate::services::EffectiveInstructions::default()
        });

    info!(
        "User instructions loaded: style={:?}, length={:?}, custom={}",
        effective_instructions.communication_style,
        effective_instructions.response_length,
        effective_instructions.custom_instructions.is_some()
    );

    // STEP 5: Generate personality-adapted system prompt with user instructions
    let base_system_prompt = PersonalityEngine::generate_system_prompt(&companion);
    let instruction_segment = effective_instructions.to_prompt_segment();

    let system_prompt = if instruction_segment.is_empty() {
        base_system_prompt
    } else {
        format!(
            "{}\n\n--- User Preferences ---\n{}",
            base_system_prompt, instruction_segment
        )
    };

    // STEP 6: Build conversation history for prompt
    let mut conversation_history = context.messages.clone();

    // Add greeting if first conversation
    let query = if is_first_conversation {
        let greeting = PersonalityEngine::generate_greeting(&companion, true);
        info!("First conversation, adding greeting: {}", greeting);
        format!("{}\n\nUser: {}", greeting, req.query)
    } else {
        req.query.clone()
    };

    // STEP 7: Store user message
    let user_message = Message::user(companion.id, req.user_address.clone(), req.query.clone());
    state
        .memory_service
        .store_message(&user_message)
        .await
        .map_err(|e| error!("Failed to store user message: {}", e))
        .ok();

    conversation_history.push(user_message.clone());

    // STEP 8: Create inference request with personality context
    let traits = crate::models::Traits::from(&companion);
    let personality_traits = crate::types::PersonalityTraits {
        creativity: traits.creativity,
        wisdom: traits.wisdom,
        humor: traits.humor,
        empathy: traits.empathy,
    };

    // Prepend system prompt to context
    let mut full_context = vec![crate::types::ChatMessage {
        role: "system".to_string(),
        content: system_prompt,
        timestamp: chrono::Utc::now().timestamp(),
    }];
    full_context.extend(
        conversation_history
            .iter()
            .map(|m| crate::types::ChatMessage {
                role: m.role.clone(),
                content: m.content.clone(),
                timestamp: m.created_at.timestamp(),
            }),
    );

    let inference_req = InferenceRequest {
        id: request_id,
        user_address: req.user_address.clone(),
        muse_id: req.muse_id,
        user_query: query,
        context: full_context,
        priority: req.priority,
        personality_traits: Some(personality_traits),
        created_at: chrono::Utc::now().timestamp(),
    };

    // STEP 9: Execute inference
    let result = state
        .router
        .route_and_execute(inference_req)
        .await
        .map_err(|e| {
            error!("Inference failed: {}", e);
            AppError::InternalError(format!("Inference failed: {}", e))
        })?;

    let latency_ms = start.elapsed().as_millis() as u64;

    // STEP 10: Store AI response
    let assistant_message = Message::assistant(
        companion.id,
        req.user_address.clone(),
        result.content.clone(),
        Some(result.model_name.clone()),
        result.tokens_generated.map(|t| t as i32),
        Some(latency_ms as i32),
    );

    state
        .memory_service
        .store_message(&assistant_message)
        .await
        .map_err(|e| error!("Failed to store assistant message: {}", e))
        .ok();

    // STEP 10.5: Track personality trait evolution
    use crate::services::PersonalityEngine;
    let current_traits = crate::models::Traits::from(&companion);
    let trait_adjustments =
        PersonalityEngine::calculate_trait_evolution(&req.query, &result.content, &current_traits);

    info!(
        "Trait evolution calculated - creativity:{}, wisdom:{}, humor:{}, empathy:{}, logic:{}",
        trait_adjustments.creativity,
        trait_adjustments.wisdom,
        trait_adjustments.humor,
        trait_adjustments.empathy,
        trait_adjustments.logic
    );

    // Update interaction stats for this level
    state
        .interaction_stats_service
        .update_stats(
            companion.id,
            &req.user_address,
            companion.level,
            &trait_adjustments,
        )
        .await
        .map_err(|e| error!("Failed to update interaction stats: {}", e))
        .ok();

    // STEP 11: Award XP
    const XP_PER_MESSAGE: i64 = 10;
    let updated_companion = state
        .companion_service
        .add_xp(companion.id, XP_PER_MESSAGE)
        .await
        .map_err(|e| error!("Failed to award XP: {}", e))
        .unwrap_or(companion.clone());

    let level_up = updated_companion.level > companion.level;
    let xp_gained = XP_PER_MESSAGE;

    // STEP 11.5: Apply personality evolution on level-up
    let mut final_companion = updated_companion.clone();
    if level_up {
        info!(
            "Companion {} leveled up from {} to {}! Applying personality evolution...",
            final_companion.name, companion.level, final_companion.level
        );

        // Get interaction stats from previous level
        if let Ok(Some(stats_row)) = state
            .interaction_stats_service
            .get_stats(companion.id, &req.user_address, companion.level)
            .await
        {
            let interaction_stats =
                crate::services::InteractionStatsService::to_interaction_stats(&stats_row);

            // Apply trait evolution
            PersonalityEngine::evolve_traits_on_levelup(&mut final_companion, &interaction_stats);

            // Save updated traits to database
            let evolved_traits = crate::models::Traits {
                creativity: final_companion.creativity as u8,
                wisdom: final_companion.wisdom as u8,
                humor: final_companion.humor as u8,
                empathy: final_companion.empathy as u8,
                logic: final_companion.logic as u8,
            };

            let _ = state
                .companion_service
                .update_traits(final_companion.id, &evolved_traits)
                .await
                .map_err(|e| error!("Failed to save evolved traits: {}", e));

            info!(
                "Personality evolved! New traits - creativity:{}, wisdom:{}, humor:{}, empathy:{}, logic:{}",
                final_companion.creativity,
                final_companion.wisdom,
                final_companion.humor,
                final_companion.empathy,
                final_companion.logic
            );
        }
    }

    // Store interaction
    let interaction = Interaction::new(
        companion.id,
        req.user_address.clone(),
        InteractionType::Chat,
        xp_gained as i32,
        Some(serde_json::json!({
            "message_id": user_message.id,
            "tokens": result.tokens_generated,
            "latency_ms": latency_ms,
        })),
    );

    // Store interaction in database (fire and forget)
    tokio::spawn({
        let pool = state.memory_service.pool.clone();
        async move {
            let _ = sqlx::query(
                "INSERT INTO interactions (id, companion_id, user_address, interaction_type, xp_gained, metadata, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)"
            )
            .bind(interaction.id)
            .bind(interaction.companion_id)
            .bind(&interaction.user_address)
            .bind(&interaction.interaction_type)
            .bind(interaction.xp_gained)
            .bind(&interaction.metadata)
            .bind(interaction.created_at)
            .execute(&pool)
            .await;
        }
    });

    // STEP 12: Update metrics
    {
        let mut metrics = state.metrics.write().await;
        metrics.total_requests += 1;
        metrics.total_latency_ms += latency_ms;
        metrics.total_xp_awarded += xp_gained;
        metrics.companions_interacted.insert(companion.id);

        match result.tier {
            ModelTier::Fast => metrics.fast_tier += 1,
            ModelTier::Medium => metrics.medium_tier += 1,
            ModelTier::Heavy => metrics.heavy_tier += 1,
            ModelTier::Specialized(_) => metrics.specialized_tier += 1,
        }

        if result.from_cache {
            metrics.cache_hits += 1;
        }
    }

    // STEP 13: Build response
    let personality_summary = PersonalityEngine::get_personality_summary(&updated_companion);

    let response = CompanionChatResponse {
        request_id: result.request_id,
        response: result.content,
        model_name: result.model_name,
        tier: result.tier.as_str().to_string(),
        latency_ms: result.latency_ms,
        from_cache: result.from_cache,
        tokens_generated: result.tokens_generated,
        cost_tmetis: Some(calculate_cost(&result.tier, result.tokens_generated)),
        companion: CompanionInfo {
            id: updated_companion.id,
            name: updated_companion.name.clone(),
            level: updated_companion.level,
            xp: updated_companion.experience_points,
            xp_gained,
            level_up,
            personality: personality_summary,
        },
    };

    info!(
        "Companion chat request {} completed in {}ms (companion: {}, level: {}, xp_gained: {}, level_up: {})",
        request_id, latency_ms, updated_companion.name, updated_companion.level, xp_gained, level_up
    );

    Ok(Json(response))
}

// ============================================================================
// Response Types
// ============================================================================

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CompanionChatResponse {
    pub request_id: Uuid,
    pub response: String,
    pub model_name: String,
    pub tier: String,
    pub latency_ms: u64,
    pub from_cache: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tokens_generated: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cost_tmetis: Option<f64>,
    pub companion: CompanionInfo,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CompanionInfo {
    pub id: Uuid,
    pub name: String,
    pub level: i32,
    pub xp: i64,
    pub xp_gained: i64,
    pub level_up: bool,
    pub personality: crate::services::PersonalitySummary,
}

// ============================================================================
// Error Handling
// ============================================================================

#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
    Unauthorized(String),
    NotFound(String),
    TooManyRequests(String),
    InternalError(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error, message) = match self {
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "bad_request", msg),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "unauthorized", msg),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", msg),
            AppError::TooManyRequests(msg) => (StatusCode::TOO_MANY_REQUESTS, "rate_limit_exceeded", msg),
            AppError::InternalError(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "internal_error", msg)
            }
        };

        (status, Json(ErrorResponse::new(error, &message))).into_response()
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

fn calculate_cost(tier: &ModelTier, tokens: Option<usize>) -> f64 {
    let base_cost = match tier {
        ModelTier::Fast => 0.001,
        ModelTier::Medium => 0.005,
        ModelTier::Heavy => 0.01,
        ModelTier::Specialized(_) => 0.015,
    };

    let token_multiplier = tokens.unwrap_or(50) as f64 / 100.0;
    base_cost * token_multiplier
}

// ============================================================================
// Router Setup
// ============================================================================

use axum::routing::post;
use axum::Router;

pub fn companion_chat_routes(state: CompanionAppState) -> Router {
    Router::new()
        .route("/chat/companion", post(companion_chat_handler))
        .with_state(state)
}
