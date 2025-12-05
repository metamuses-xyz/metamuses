// Points Service - Main Business Logic
// High-level service for managing points, tasks, and user progress

use crate::points::tasks::{TaskCompletion, UserPoints};
use crate::points::{PointsRepository, TaskRegistry};
use anyhow::{Context, Result};
use sqlx::PgPool;

pub struct PointsService {
    pool: PgPool,
    task_registry: TaskRegistry,
    points_repo: PointsRepository,
}

impl PointsService {
    pub fn new(pool: PgPool) -> Self {
        Self {
            task_registry: TaskRegistry::new(pool.clone()),
            points_repo: PointsRepository::new(pool.clone()),
            pool,
        }
    }

    /// Complete a task and award points
    pub async fn complete_task(
        &self,
        user_address: &str,
        task_type: &str,
        metadata: serde_json::Value,
    ) -> Result<TaskCompletion> {
        let task = self
            .task_registry
            .get_task(task_type)
            .ok_or_else(|| anyhow::anyhow!("Task type not found: {}", task_type))?;

        task.complete(user_address, metadata).await
    }

    /// Get user's total points and stats
    pub async fn get_user_points(&self, user_address: &str) -> Result<UserPoints> {
        self.points_repo.get_or_create_user_points(user_address).await
    }

    /// Get user's task completion history
    pub async fn get_task_history(
        &self,
        user_address: &str,
        limit: i32,
    ) -> Result<Vec<TaskCompletion>> {
        self.points_repo
            .get_task_completions(user_address, limit)
            .await
    }

    /// Check if user can complete a task
    pub async fn can_complete_task(
        &self,
        user_address: &str,
        task_type: &str,
        metadata: &serde_json::Value,
    ) -> Result<bool> {
        let task = self
            .task_registry
            .get_task(task_type)
            .ok_or_else(|| anyhow::anyhow!("Task type not found: {}", task_type))?;

        task.can_complete(user_address, metadata).await
    }

    /// Get list of available tasks
    pub fn list_available_tasks(&self) -> Vec<String> {
        self.task_registry.list_tasks()
    }

    /// Get user's current streak
    pub async fn get_current_streak(&self, user_address: &str) -> Result<i32> {
        self.points_repo.get_current_streak(user_address).await
    }

    /// Calculate user's rank
    pub async fn calculate_rank(&self, user_address: &str) -> Result<i32> {
        self.points_repo.calculate_rank(user_address).await
    }
}
