use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info};

use crate::points::{
    PointsService, TwitterVerificationService, VerifyTwitterRequest, CompleteTwitterTaskRequest,
    TwitterVerification,
};

#[derive(Clone)]
pub struct TwitterAppState {
    pub twitter_service: Arc<TwitterVerificationService>,
    pub points_service: Arc<PointsService>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerifyResponse {
    pub success: bool,
    pub message: String,
    pub verification: Option<TwitterVerification>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskCompletionResponse {
    pub success: bool,
    pub message: String,
    pub points_awarded: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserCompletionsResponse {
    pub completed_tasks: Vec<String>,
}

/// POST /api/twitter/verify
/// Verify user's Twitter handle with wallet signature
pub async fn verify_twitter_handler(
    State(state): State<TwitterAppState>,
    Json(payload): Json<VerifyTwitterRequest>,
) -> Result<Json<VerifyResponse>, (StatusCode, String)> {
    info!(
        "Verifying Twitter handle @{} for user {}",
        payload.twitter_handle, payload.user_address
    );

    // Verify the signature
    match state
        .twitter_service
        .verify_signature(&payload.user_address, &payload.twitter_handle, &payload.signature)
        .await
    {
        Ok(true) => {
            // Signature is valid, store the verification
            match state
                .twitter_service
                .store_verification(&payload.user_address, &payload.twitter_handle, &payload.signature)
                .await
            {
                Ok(verification) => {
                    info!("✓ Twitter verification stored for user {}", payload.user_address);
                    Ok(Json(VerifyResponse {
                        success: true,
                        message: format!("Successfully verified @{}", payload.twitter_handle),
                        verification: Some(verification),
                    }))
                }
                Err(e) => {
                    error!("Failed to store verification: {}", e);
                    Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        format!("Failed to store verification: {}", e),
                    ))
                }
            }
        }
        Ok(false) => {
            error!("Invalid signature for user {}", payload.user_address);
            Ok(Json(VerifyResponse {
                success: false,
                message: "Invalid signature - signature does not match wallet address".to_string(),
                verification: None,
            }))
        }
        Err(e) => {
            error!("Signature verification error: {}", e);
            Err((
                StatusCode::BAD_REQUEST,
                format!("Signature verification failed: {}", e),
            ))
        }
    }
}

/// GET /api/twitter/verification/{address}
/// Get user's Twitter verification status
pub async fn get_verification_handler(
    State(state): State<TwitterAppState>,
    Path(address): Path<String>,
) -> Result<Json<Option<TwitterVerification>>, (StatusCode, String)> {
    info!("Getting Twitter verification for user {}", address);

    match state.twitter_service.get_verification(&address).await {
        Ok(verification) => Ok(Json(verification)),
        Err(e) => {
            error!("Failed to get verification: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to get verification: {}", e),
            ))
        }
    }
}

/// POST /api/twitter/complete
/// Complete a Twitter task (follow or retweet) and award points
pub async fn complete_twitter_task_handler(
    State(state): State<TwitterAppState>,
    Json(payload): Json<CompleteTwitterTaskRequest>,
) -> Result<Json<TaskCompletionResponse>, (StatusCode, String)> {
    info!(
        "Completing Twitter task '{}' for user {}",
        payload.task_type, payload.user_address
    );

    // Check if user has verified their Twitter handle
    match state.twitter_service.get_verification(&payload.user_address).await {
        Ok(Some(verification)) => {
            // Check if task was already completed
            match state
                .twitter_service
                .has_completed_task(&payload.user_address, &payload.task_type)
                .await
            {
                Ok(true) => {
                    return Ok(Json(TaskCompletionResponse {
                        success: false,
                        message: format!("Task '{}' already completed", payload.task_type),
                        points_awarded: None,
                    }));
                }
                Ok(false) => {
                    // Award points through the points system FIRST
                    let metadata = serde_json::json!({
                        "twitter_handle": verification.twitter_handle,
                        "verified": true
                    });

                    match state
                        .points_service
                        .complete_task(&payload.user_address, &payload.task_type, metadata)
                        .await
                    {
                        Ok(completion) => {
                            // Points awarded successfully, now mark task as completed in Twitter table
                            if let Err(e) = state
                                .twitter_service
                                .complete_twitter_task(
                                    &payload.user_address,
                                    &payload.task_type,
                                    &verification.twitter_handle,
                                )
                                .await
                            {
                                error!("Failed to mark Twitter task as completed: {}", e);
                                // Points were awarded, so we still return success
                            }

                            info!(
                                "✓ Task '{}' completed, awarded {} points to user {}",
                                payload.task_type, completion.points_awarded, payload.user_address
                            );
                            Ok(Json(TaskCompletionResponse {
                                success: true,
                                message: format!(
                                    "Task completed! Earned {} points",
                                    completion.points_awarded
                                ),
                                points_awarded: Some(completion.points_awarded),
                            }))
                        }
                        Err(e) => {
                            error!("Failed to award points: {}", e);
                            Err((
                                StatusCode::INTERNAL_SERVER_ERROR,
                                format!("Failed to award points: {}", e),
                            ))
                        }
                    }
                }
                Err(e) => {
                    error!("Failed to check task completion: {}", e);
                    Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        format!("Failed to check task completion: {}", e),
                    ))
                }
            }
        }
        Ok(None) => Ok(Json(TaskCompletionResponse {
            success: false,
            message: "Please verify your Twitter handle first".to_string(),
            points_awarded: None,
        })),
        Err(e) => {
            error!("Failed to get verification: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to get verification: {}", e),
            ))
        }
    }
}

/// GET /api/twitter/completions/{address}
/// Get all Twitter task completions for a user
pub async fn get_user_completions_handler(
    State(state): State<TwitterAppState>,
    Path(address): Path<String>,
) -> Result<Json<UserCompletionsResponse>, (StatusCode, String)> {
    info!("Getting Twitter task completions for user {}", address);

    match state.twitter_service.get_user_completions(&address).await {
        Ok(completions) => Ok(Json(UserCompletionsResponse {
            completed_tasks: completions,
        })),
        Err(e) => {
            error!("Failed to get user completions: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to get user completions: {}", e),
            ))
        }
    }
}

/// Twitter API routes
pub fn twitter_routes(state: TwitterAppState) -> Router {
    Router::new()
        .route("/api/twitter/verify", post(verify_twitter_handler))
        .route("/api/twitter/verification/{address}", get(get_verification_handler))
        .route("/api/twitter/complete", post(complete_twitter_task_handler))
        .route("/api/twitter/completions/{address}", get(get_user_completions_handler))
        .with_state(state)
}
