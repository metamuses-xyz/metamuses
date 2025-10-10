// HTTP Request Handlers

use super::types::*;
use crate::routing::IntelligentRouter;
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
// Application State
// ============================================================================

#[derive(Clone)]
pub struct AppState {
    pub router: Arc<IntelligentRouter>,
    pub start_time: std::time::Instant,
    pub metrics: Arc<tokio::sync::RwLock<RequestMetrics>>,
}

#[derive(Debug, Default)]
pub struct RequestMetrics {
    pub total_requests: u64,
    pub fast_tier: u64,
    pub medium_tier: u64,
    pub heavy_tier: u64,
    pub specialized_tier: u64,
    pub cache_hits: u64,
    pub total_latency_ms: u64,
}

// ============================================================================
// Chat Handler
// ============================================================================

pub async fn chat_handler(
    State(state): State<AppState>,
    Json(req): Json<ChatRequest>,
) -> Result<Json<ChatResponse>, AppError> {
    info!(
        "Received chat request from user: {}, query length: {}",
        req.user_address,
        req.query.len()
    );

    // Validate request
    if req.query.trim().is_empty() {
        return Err(AppError::BadRequest(
            "Query cannot be empty".to_string(),
        ));
    }

    if req.user_address.is_empty() {
        return Err(AppError::BadRequest(
            "User address is required".to_string(),
        ));
    }

    // Create inference request
    let request_id = Uuid::new_v4();
    let inference_req = InferenceRequest {
        id: request_id,
        user_address: req.user_address.clone(),
        muse_id: req.muse_id,
        user_query: req.query.clone(),
        context: req.context.clone(),
        priority: req.priority,
        personality_traits: None,
        created_at: chrono::Utc::now().timestamp(),
    };

    // Route and execute
    let start = std::time::Instant::now();
    let result = state
        .router
        .route_and_execute(inference_req)
        .await
        .map_err(|e| {
            error!("Inference failed: {}", e);
            AppError::InternalError(format!("Inference failed: {}", e))
        })?;

    let latency_ms = start.elapsed().as_millis() as u64;

    // Update metrics
    {
        let mut metrics = state.metrics.write().await;
        metrics.total_requests += 1;
        metrics.total_latency_ms += latency_ms;

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

    // Build response
    let response = ChatResponse {
        request_id: result.request_id,
        response: result.content,
        model_name: result.model_name,
        tier: result.tier.as_str().to_string(),
        latency_ms: result.latency_ms,
        from_cache: result.from_cache,
        tokens_generated: result.tokens_generated,
        cost_tmetis: Some(calculate_cost(&result.tier, result.tokens_generated)),
    };

    info!(
        "Request {} completed in {}ms (tier: {}, from_cache: {})",
        request_id, latency_ms, response.tier, result.from_cache
    );

    Ok(Json(response))
}

// ============================================================================
// Health Check Handler
// ============================================================================

pub async fn health_handler(
    State(state): State<AppState>,
) -> Result<Json<HealthResponse>, AppError> {
    let uptime = state.start_time.elapsed().as_secs();

    // Get queue depths
    let router = &state.router;
    let mut queue_manager = router.queue_manager.write().await;

    let fast_depth = queue_manager.get_queue_depth(ModelTier::Fast).await.unwrap_or(0);
    let medium_depth = queue_manager.get_queue_depth(ModelTier::Medium).await.unwrap_or(0);
    let heavy_depth = queue_manager.get_queue_depth(ModelTier::Heavy).await.unwrap_or(0);

    drop(queue_manager);

    let response = HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        uptime_secs: uptime,
        queue_depth: QueueDepthStatus {
            fast: fast_depth,
            medium: medium_depth,
            heavy: heavy_depth,
            total: fast_depth + medium_depth + heavy_depth,
        },
    };

    Ok(Json(response))
}

// ============================================================================
// Metrics Handler
// ============================================================================

pub async fn metrics_handler(
    State(state): State<AppState>,
) -> Result<Json<MetricsResponse>, AppError> {
    let metrics = state.metrics.read().await;
    let router = &state.router;

    // Get queue metrics
    let queue_metrics = router
        .queue_manager
        .write()
        .await
        .get_metrics()
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to get metrics: {}", e)))?;

    let cache_hit_rate = if metrics.total_requests > 0 {
        (metrics.cache_hits as f64 / metrics.total_requests as f64) * 100.0
    } else {
        0.0
    };

    let avg_latency = if metrics.total_requests > 0 {
        metrics.total_latency_ms as f64 / metrics.total_requests as f64
    } else {
        0.0
    };

    let response = MetricsResponse {
        total_requests: metrics.total_requests,
        requests_per_tier: TierMetrics {
            fast: metrics.fast_tier,
            medium: metrics.medium_tier,
            heavy: metrics.heavy_tier,
            specialized: metrics.specialized_tier,
        },
        cache_hit_rate,
        avg_latency_ms: avg_latency,
        queue_metrics,
    };

    Ok(Json(response))
}

// ============================================================================
// Helper Functions
// ============================================================================

fn calculate_cost(tier: &ModelTier, tokens: Option<usize>) -> f64 {
    let base_cost = match tier {
        ModelTier::Fast => 0.0001,
        ModelTier::Medium => 0.0005,
        ModelTier::Heavy => 0.002,
        ModelTier::Specialized(_) => 0.001,
    };

    // Add token-based cost
    if let Some(token_count) = tokens {
        base_cost + (token_count as f64 * 0.000001)
    } else {
        base_cost
    }
}

// ============================================================================
// Error Handling
// ============================================================================

#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
    InternalError(String),
    NotFound(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_type, message) = match self {
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "bad_request", msg),
            AppError::InternalError(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "internal_error", msg)
            }
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", msg),
        };

        let error_response = ErrorResponse::new(error_type, &message);

        (status, Json(error_response)).into_response()
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::InternalError(err.to_string())
    }
}
