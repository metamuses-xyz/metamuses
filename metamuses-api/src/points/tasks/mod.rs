// Points System - Task Module
// Defines the Task trait and core types for the modular task system

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ============================================================================
// Core Types
// ============================================================================

/// Task configuration loaded from database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskConfig {
    pub id: Uuid,
    pub task_type: String,
    pub name: String,
    pub description: Option<String>,
    pub base_points: i32,
    pub multiplier_type: Option<String>,
    pub config: serde_json::Value,
    pub is_active: bool,
    pub is_daily: bool,
    pub is_repeatable: bool,
}

/// Result of a task completion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskCompletion {
    pub id: Uuid,
    pub user_address: String,
    pub task_type: String,
    pub points_awarded: i32,
    pub multiplier: f64,
    pub metadata: serde_json::Value,
    pub completed_at: chrono::DateTime<chrono::Utc>,
}

/// User points summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPoints {
    pub user_address: String,
    pub total_points: i64,
    pub lifetime_points: i64,
    pub current_streak: i32,
    pub longest_streak: i32,
    pub last_checkin_date: Option<chrono::NaiveDate>,
    pub rank: Option<i32>,
    pub season_points: i64,
}

// ============================================================================
// Task Trait - Core Interface
// ============================================================================

/// Core trait that all task types must implement
///
/// This trait defines the contract for task implementations.
/// Each task type should:
/// 1. Validate if a user can complete the task
/// 2. Calculate points based on task-specific logic
/// 3. Apply multipliers (e.g., streak bonuses)
/// 4. Complete the task and award points
#[async_trait]
pub trait Task: Send + Sync {
    /// Unique identifier for this task type
    fn task_type(&self) -> &str;

    /// Validate if user can complete this task
    ///
    /// This checks prerequisites, cooldowns, limits, etc.
    /// Returns true if the task can be completed now.
    async fn can_complete(
        &self,
        user_address: &str,
        metadata: &serde_json::Value,
    ) -> anyhow::Result<bool>;

    /// Calculate base points for this task completion
    ///
    /// This is the raw point value before multipliers are applied.
    async fn calculate_points(
        &self,
        user_address: &str,
        metadata: &serde_json::Value,
    ) -> anyhow::Result<i32>;

    /// Get multiplier for this task (e.g., from streak bonus)
    ///
    /// Default multiplier is 1.0 (no bonus).
    /// Streak multipliers, tier bonuses, etc. are applied here.
    async fn get_multiplier(&self, user_address: &str) -> anyhow::Result<f64>;

    /// Complete the task and award points
    ///
    /// This is the main entry point for task completion.
    /// It validates, calculates, and records the completion.
    async fn complete(
        &self,
        user_address: &str,
        metadata: serde_json::Value,
    ) -> anyhow::Result<TaskCompletion>;
}

// ============================================================================
// Task Modules
// ============================================================================

pub mod daily_checkin;
pub mod twitter_tasks;

// Re-export task implementations
pub use daily_checkin::DailyCheckInTask;
pub use twitter_tasks::{FollowTwitterTask, RetweetPostTask};
