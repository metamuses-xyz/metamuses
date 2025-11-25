use crate::api::types::ErrorResponse;
use crate::models::{Companion, CompanionStats, CreateCompanionRequest, UpdateCompanionRequest};
use crate::services::CompanionService;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

// ============================================================================
// API Response Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanionResponse {
    pub companion: Companion,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanionsListResponse {
    pub companions: Vec<Companion>,
    pub total: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanionStatsResponse {
    pub stats: CompanionStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitializeCompanionRequest {
    pub token_id: i64,
    pub user_address: String,
}

// ============================================================================
// API Handlers
// ============================================================================

/// Initialize a companion from an NFT
/// POST /api/companions/initialize
pub async fn initialize_companion(
    State(service): State<Arc<CompanionService>>,
    Json(req): Json<InitializeCompanionRequest>,
) -> Result<Response, ApiError> {
    let create_req = CreateCompanionRequest {
        nft_token_id: req.token_id,
        owner_address: req.user_address,
        name: None,
        traits: None,
    };

    let companion = service
        .initialize_companion(&create_req)
        .await
        .map_err(|e| ApiError::InternalError(e.to_string()))?;

    Ok((StatusCode::CREATED, Json(CompanionResponse { companion })).into_response())
}

/// Get companion by token ID
/// GET /api/companions/:token_id
pub async fn get_companion_by_token(
    State(service): State<Arc<CompanionService>>,
    Path(token_id): Path<i64>,
) -> Result<Response, ApiError> {
    let companion = service
        .get_companion_by_token_id(token_id)
        .await
        .map_err(|e| ApiError::InternalError(e.to_string()))?
        .ok_or(ApiError::NotFound(format!(
            "Companion with token ID {} not found",
            token_id
        )))?;

    Ok(Json(CompanionResponse { companion }).into_response())
}

/// Get all companions owned by an address
/// GET /api/companions/user/:address
pub async fn get_user_companions(
    State(service): State<Arc<CompanionService>>,
    Path(address): Path<String>,
) -> Result<Response, ApiError> {
    let companions = service
        .get_user_companions(&address)
        .await
        .map_err(|e| ApiError::InternalError(e.to_string()))?;

    let total = companions.len();

    Ok(Json(CompanionsListResponse { companions, total }).into_response())
}

/// Update companion
/// PATCH /api/companions/:token_id
pub async fn update_companion(
    State(service): State<Arc<CompanionService>>,
    Path(token_id): Path<i64>,
    Json(req): Json<UpdateCompanionRequest>,
) -> Result<Response, ApiError> {
    // Get companion by token ID first
    let companion = service
        .get_companion_by_token_id(token_id)
        .await
        .map_err(|e| ApiError::InternalError(e.to_string()))?
        .ok_or(ApiError::NotFound(format!(
            "Companion with token ID {} not found",
            token_id
        )))?;

    let updated = service
        .update_companion(companion.id, &req)
        .await
        .map_err(|e| ApiError::InternalError(e.to_string()))?;

    Ok(Json(CompanionResponse { companion: updated }).into_response())
}

/// Get companion statistics
/// GET /api/companions/:token_id/stats
pub async fn get_companion_stats(
    State(service): State<Arc<CompanionService>>,
    Path(token_id): Path<i64>,
) -> Result<Response, ApiError> {
    // Get companion by token ID first
    let companion = service
        .get_companion_by_token_id(token_id)
        .await
        .map_err(|e| ApiError::InternalError(e.to_string()))?
        .ok_or(ApiError::NotFound(format!(
            "Companion with token ID {} not found",
            token_id
        )))?;

    let stats = service
        .get_stats(companion.id)
        .await
        .map_err(|e| ApiError::InternalError(e.to_string()))?;

    Ok(Json(CompanionStatsResponse { stats }).into_response())
}

// ============================================================================
// Error Handling
// ============================================================================

#[derive(Debug)]
pub enum ApiError {
    NotFound(String),
    BadRequest(String),
    Unauthorized(String),
    InternalError(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error, message) = match self {
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", msg),
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "bad_request", msg),
            ApiError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "unauthorized", msg),
            ApiError::InternalError(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "internal_error", msg)
            }
        };

        (status, Json(ErrorResponse::new(error, &message))).into_response()
    }
}

// ============================================================================
// Router Setup
// ============================================================================

use axum::routing::{get, patch, post};
use axum::Router;

pub fn companion_routes(service: Arc<CompanionService>) -> Router {
    Router::new()
        .route("/companions/initialize", post(initialize_companion))
        .route("/companions/:token_id", get(get_companion_by_token))
        .route("/companions/:token_id", patch(update_companion))
        .route("/companions/:token_id/stats", get(get_companion_stats))
        .route("/companions/user/:address", get(get_user_companions))
        .with_state(service)
}
