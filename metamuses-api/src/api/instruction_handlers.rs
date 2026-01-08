use crate::services::{
    CompanionService, InstructionService, UpdateInstructionsRequest, UserInstructions,
};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info};

// ============================================================================
// App State
// ============================================================================

#[derive(Clone)]
pub struct InstructionAppState {
    pub instruction_service: Arc<InstructionService>,
    pub companion_service: Arc<CompanionService>,
}

// ============================================================================
// Request/Response Types
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct GetInstructionsQuery {
    pub user_address: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateInstructionsBody {
    pub user_address: String,
    #[serde(flatten)]
    pub instructions: UpdateInstructionsRequest,
}

#[derive(Debug, Serialize)]
pub struct InstructionsResponse {
    pub success: bool,
    pub data: Option<UserInstructions>,
    pub message: Option<String>,
}

// ============================================================================
// Error Types
// ============================================================================

#[derive(Debug)]
pub enum InstructionError {
    BadRequest(String),
    NotFound(String),
    InternalError(String),
}

impl IntoResponse for InstructionError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            InstructionError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            InstructionError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            InstructionError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        (
            status,
            Json(InstructionsResponse {
                success: false,
                data: None,
                message: Some(message),
            }),
        )
            .into_response()
    }
}

// ============================================================================
// Handlers
// ============================================================================

/// Get user instructions for a companion by muse_id (NFT token ID)
pub async fn get_instructions_handler(
    State(state): State<InstructionAppState>,
    Path(muse_id): Path<i64>,
    Query(query): Query<GetInstructionsQuery>,
) -> Result<Json<InstructionsResponse>, InstructionError> {
    info!(
        "Getting instructions for muse_id {} and user {}",
        muse_id, query.user_address
    );

    if query.user_address.is_empty() {
        return Err(InstructionError::BadRequest(
            "user_address is required".to_string(),
        ));
    }

    // Look up companion by muse_id
    let companion = state
        .companion_service
        .get_companion_by_muse_id(muse_id)
        .await
        .map_err(|e| {
            error!("Failed to get companion: {}", e);
            InstructionError::InternalError(e.to_string())
        })?
        .ok_or_else(|| {
            InstructionError::NotFound(format!("Companion with muse_id {} not found", muse_id))
        })?;

    let instructions = state
        .instruction_service
        .get_instructions(companion.id, &query.user_address)
        .await
        .map_err(|e| {
            error!("Failed to get instructions: {}", e);
            InstructionError::InternalError(e.to_string())
        })?;

    Ok(Json(InstructionsResponse {
        success: true,
        data: instructions,
        message: None,
    }))
}

/// Update user instructions for a companion by muse_id (NFT token ID)
pub async fn update_instructions_handler(
    State(state): State<InstructionAppState>,
    Path(muse_id): Path<i64>,
    Json(body): Json<UpdateInstructionsBody>,
) -> Result<Json<InstructionsResponse>, InstructionError> {
    info!(
        "Updating instructions for muse_id {} and user {}",
        muse_id, body.user_address
    );

    if body.user_address.is_empty() {
        return Err(InstructionError::BadRequest(
            "user_address is required".to_string(),
        ));
    }

    // Look up companion by muse_id
    let companion = state
        .companion_service
        .get_companion_by_muse_id(muse_id)
        .await
        .map_err(|e| {
            error!("Failed to get companion: {}", e);
            InstructionError::InternalError(e.to_string())
        })?
        .ok_or_else(|| {
            InstructionError::NotFound(format!("Companion with muse_id {} not found", muse_id))
        })?;

    let instructions = state
        .instruction_service
        .upsert_instructions(companion.id, &body.user_address, &body.instructions)
        .await
        .map_err(|e| {
            error!("Failed to update instructions: {}", e);
            InstructionError::InternalError(e.to_string())
        })?;

    info!(
        "Instructions updated successfully for companion {}",
        companion.name
    );

    Ok(Json(InstructionsResponse {
        success: true,
        data: Some(instructions),
        message: Some("Instructions saved successfully".to_string()),
    }))
}

/// Delete user instructions for a companion by muse_id (NFT token ID)
pub async fn delete_instructions_handler(
    State(state): State<InstructionAppState>,
    Path(muse_id): Path<i64>,
    Query(query): Query<GetInstructionsQuery>,
) -> Result<Json<InstructionsResponse>, InstructionError> {
    info!(
        "Deleting instructions for muse_id {} and user {}",
        muse_id, query.user_address
    );

    if query.user_address.is_empty() {
        return Err(InstructionError::BadRequest(
            "user_address is required".to_string(),
        ));
    }

    // Look up companion by muse_id
    let companion = state
        .companion_service
        .get_companion_by_muse_id(muse_id)
        .await
        .map_err(|e| {
            error!("Failed to get companion: {}", e);
            InstructionError::InternalError(e.to_string())
        })?
        .ok_or_else(|| {
            InstructionError::NotFound(format!("Companion with muse_id {} not found", muse_id))
        })?;

    let deleted = state
        .instruction_service
        .delete_instructions(companion.id, &query.user_address)
        .await
        .map_err(|e| {
            error!("Failed to delete instructions: {}", e);
            InstructionError::InternalError(e.to_string())
        })?;

    if deleted {
        Ok(Json(InstructionsResponse {
            success: true,
            data: None,
            message: Some("Instructions deleted successfully".to_string()),
        }))
    } else {
        Err(InstructionError::NotFound(
            "No instructions found to delete".to_string(),
        ))
    }
}

// ============================================================================
// Router
// ============================================================================

use axum::routing::{delete, get, put};
use axum::Router;

pub fn instruction_routes(state: InstructionAppState) -> Router {
    Router::new()
        .route(
            "/api/companions/{muse_id}/instructions",
            get(get_instructions_handler)
                .put(update_instructions_handler)
                .delete(delete_instructions_handler),
        )
        .with_state(state)
}
