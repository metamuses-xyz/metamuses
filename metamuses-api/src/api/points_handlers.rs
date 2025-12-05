// Points API Handlers
// REST endpoints for points system, tasks, and leaderboards

use crate::api::types::ErrorResponse;
use crate::points::{LeaderboardService, PointsService};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

// ============================================================================
// Application State
// ============================================================================

#[derive(Clone)]
pub struct PointsAppState {
    pub points_service: Arc<PointsService>,
    pub leaderboard_service: Arc<LeaderboardService>,
}

// ============================================================================
// Request/Response Types
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct CheckInRequest {}

#[derive(Debug, Serialize)]
pub struct CheckInResponse {
    pub success: bool,
    pub completion: TaskCompletionResponse,
    pub user_points: UserPointsResponse,
}

#[derive(Debug, Serialize)]
pub struct TaskCompletionResponse {
    pub task_type: String,
    pub points_awarded: i32,
    pub multiplier: f64,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct UserPointsResponse {
    pub total_points: i64,
    pub current_streak: i32,
    pub rank: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct UserStatsResponse {
    pub user_address: String,
    pub total_points: i64,
    pub lifetime_points: i64,
    pub season_points: i64,
    pub current_streak: i32,
    pub longest_streak: i32,
    pub rank: Option<i32>,
    pub last_checkin_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct HistoryQuery {
    #[serde(default = "default_limit")]
    pub limit: i32,
}

fn default_limit() -> i32 {
    20
}

#[derive(Debug, Serialize)]
pub struct TaskHistoryResponse {
    pub completions: Vec<TaskCompletionHistoryItem>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct TaskCompletionHistoryItem {
    pub id: String,
    pub task_type: String,
    pub points_awarded: i32,
    pub multiplier: f64,
    pub completed_at: String,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct LeaderboardQuery {
    #[serde(default = "default_leaderboard_limit")]
    pub limit: i32,
}

fn default_leaderboard_limit() -> i32 {
    100
}

#[derive(Debug, Serialize)]
pub struct LeaderboardResponse {
    pub leaderboard_type: String,
    pub entries: Vec<LeaderboardEntryResponse>,
    pub total_users: i64,
}

#[derive(Debug, Serialize)]
pub struct LeaderboardEntryResponse {
    pub rank: i32,
    pub user_address: String,
    pub username: Option<String>,
    pub points: i64,
    pub streak: i32,
    pub is_current_user: bool,
}

// ============================================================================
// API Handlers
// ============================================================================

/// POST /api/points/checkin
/// Complete daily check-in
pub async fn checkin_handler(
    State(state): State<PointsAppState>,
    // TODO: Extract user address from JWT or signature
    Path(user_address): Path<String>,
) -> Result<Json<CheckInResponse>, AppError> {
    // Complete check-in task
    let completion = state
        .points_service
        .complete_task(&user_address, "daily_checkin", serde_json::json!({}))
        .await
        .map_err(|e| {
            if e.to_string().contains("already checked in") {
                AppError::BadRequest("You have already checked in today. Come back tomorrow!".to_string())
            } else {
                AppError::InternalError(format!("Check-in failed: {}", e))
            }
        })?;

    // Get updated user points
    let user_points = state
        .points_service
        .get_user_points(&user_address)
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to fetch points: {}", e)))?;

    Ok(Json(CheckInResponse {
        success: true,
        completion: TaskCompletionResponse {
            task_type: completion.task_type,
            points_awarded: completion.points_awarded,
            multiplier: completion.multiplier,
            metadata: completion.metadata,
        },
        user_points: UserPointsResponse {
            total_points: user_points.total_points,
            current_streak: user_points.current_streak,
            rank: user_points.rank,
        },
    }))
}

/// GET /api/points/user/:address
/// Get user's points and stats
pub async fn get_user_points_handler(
    State(state): State<PointsAppState>,
    Path(user_address): Path<String>,
) -> Result<Json<UserStatsResponse>, AppError> {
    let user_points = state
        .points_service
        .get_user_points(&user_address)
        .await
        .map_err(|e| AppError::NotFound(format!("User not found: {}", e)))?;

    Ok(Json(UserStatsResponse {
        user_address: user_points.user_address,
        total_points: user_points.total_points,
        lifetime_points: user_points.lifetime_points,
        season_points: user_points.season_points,
        current_streak: user_points.current_streak,
        longest_streak: user_points.longest_streak,
        rank: user_points.rank,
        last_checkin_date: user_points.last_checkin_date.map(|d| d.to_string()),
    }))
}

/// GET /api/points/user/:address/history
/// Get user's task completion history
pub async fn get_task_history_handler(
    State(state): State<PointsAppState>,
    Path(user_address): Path<String>,
    Query(query): Query<HistoryQuery>,
) -> Result<Json<TaskHistoryResponse>, AppError> {
    let completions = state
        .points_service
        .get_task_history(&user_address, query.limit)
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to fetch history: {}", e)))?;

    let items: Vec<TaskCompletionHistoryItem> = completions
        .into_iter()
        .map(|c| TaskCompletionHistoryItem {
            id: c.id.to_string(),
            task_type: c.task_type,
            points_awarded: c.points_awarded,
            multiplier: c.multiplier,
            completed_at: c.completed_at.to_rfc3339(),
            metadata: c.metadata,
        })
        .collect();

    Ok(Json(TaskHistoryResponse {
        total: items.len(),
        completions: items,
    }))
}

/// GET /api/leaderboard/global
/// Get global leaderboard
pub async fn get_global_leaderboard_handler(
    State(state): State<PointsAppState>,
    Query(query): Query<LeaderboardQuery>,
) -> Result<Json<LeaderboardResponse>, AppError> {
    let entries = state
        .leaderboard_service
        .get_global_leaderboard(query.limit)
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to fetch leaderboard: {}", e)))?;

    let total_users = state
        .leaderboard_service
        .get_total_users()
        .await
        .unwrap_or(0);

    let entry_responses: Vec<LeaderboardEntryResponse> = entries
        .into_iter()
        .map(|e| LeaderboardEntryResponse {
            rank: e.rank,
            user_address: e.user_address,
            username: e.username,
            points: e.points,
            streak: e.streak,
            is_current_user: false,
        })
        .collect();

    Ok(Json(LeaderboardResponse {
        leaderboard_type: "global".to_string(),
        entries: entry_responses,
        total_users,
    }))
}

/// GET /api/leaderboard/user/:address
/// Get user's rank
pub async fn get_user_rank_handler(
    State(state): State<PointsAppState>,
    Path(user_address): Path<String>,
) -> Result<Json<LeaderboardEntryResponse>, AppError> {
    let entry = state
        .leaderboard_service
        .get_user_rank(&user_address)
        .await
        .map_err(|e| AppError::NotFound(format!("User not found on leaderboard: {}", e)))?;

    Ok(Json(LeaderboardEntryResponse {
        rank: entry.rank,
        user_address: entry.user_address,
        username: entry.username,
        points: entry.points,
        streak: entry.streak,
        is_current_user: true,
    }))
}

/// GET /api/leaderboard/around/:address
/// Get leaderboard around user
pub async fn get_leaderboard_around_user_handler(
    State(state): State<PointsAppState>,
    Path(user_address): Path<String>,
    Query(query): Query<LeaderboardQuery>,
) -> Result<Json<LeaderboardResponse>, AppError> {
    let range = query.limit / 2; // Show N above and N below

    let entries = state
        .leaderboard_service
        .get_leaderboard_around_user(&user_address, range)
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to fetch leaderboard: {}", e)))?;

    let total_users = state
        .leaderboard_service
        .get_total_users()
        .await
        .unwrap_or(0);

    let entry_responses: Vec<LeaderboardEntryResponse> = entries
        .into_iter()
        .map(|e| LeaderboardEntryResponse {
            rank: e.rank,
            user_address: e.user_address.clone(),
            username: e.username,
            points: e.points,
            streak: e.streak,
            is_current_user: e.user_address == user_address,
        })
        .collect();

    Ok(Json(LeaderboardResponse {
        leaderboard_type: "around_user".to_string(),
        entries: entry_responses,
        total_users,
    }))
}

// ============================================================================
// Error Handling
// ============================================================================

#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
    Unauthorized(String),
    NotFound(String),
    InternalError(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error, message) = match self {
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "bad_request", msg),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "unauthorized", msg),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", msg),
            AppError::InternalError(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "internal_error",
                msg,
            ),
        };

        (status, Json(ErrorResponse::new(error, &message))).into_response()
    }
}

// ============================================================================
// Router Setup
// ============================================================================

use axum::routing::{get, post};
use axum::Router;

pub fn points_routes(state: PointsAppState) -> Router {
    Router::new()
        // Points endpoints
        .route("/api/points/checkin/{address}", post(checkin_handler))
        .route("/api/points/user/{address}", get(get_user_points_handler))
        .route(
            "/api/points/user/{address}/history",
            get(get_task_history_handler),
        )
        // Leaderboard endpoints
        .route(
            "/api/leaderboard/global",
            get(get_global_leaderboard_handler),
        )
        .route("/api/leaderboard/user/{address}", get(get_user_rank_handler))
        .route(
            "/api/leaderboard/around/{address}",
            get(get_leaderboard_around_user_handler),
        )
        .with_state(state)
}
