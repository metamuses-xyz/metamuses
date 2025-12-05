// Points Repository - Database Operations
// Handles all database interactions for the points system

use crate::points::tasks::{TaskCompletion, UserPoints};
use anyhow::{Context, Result};
use chrono::{NaiveDate, Utc};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Clone)]
pub struct PointsRepository {
    pool: PgPool,
}

impl PointsRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // ========================================================================
    // User Points Operations
    // ========================================================================

    /// Get user's total points and stats
    pub async fn get_user_points(&self, user_address: &str) -> Result<UserPoints> {
        let user_points = sqlx::query_as!(
            UserPoints,
            r#"
            SELECT
                user_address,
                total_points,
                lifetime_points,
                current_streak,
                longest_streak,
                last_checkin_date,
                rank,
                season_points
            FROM user_points
            WHERE user_address = $1
            "#,
            user_address
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to fetch user points")?;

        Ok(user_points)
    }

    /// Get or create user points record
    pub async fn get_or_create_user_points(&self, user_address: &str) -> Result<UserPoints> {
        // Try to get existing record
        match self.get_user_points(user_address).await {
            Ok(points) => Ok(points),
            Err(_) => {
                // Create new record
                let user_points = sqlx::query_as!(
                    UserPoints,
                    r#"
                    INSERT INTO user_points (user_address, total_points, lifetime_points, season_points)
                    VALUES ($1, 0, 0, 0)
                    RETURNING
                        user_address,
                        total_points,
                        lifetime_points,
                        current_streak,
                        longest_streak,
                        last_checkin_date,
                        rank,
                        season_points
                    "#,
                    user_address
                )
                .fetch_one(&self.pool)
                .await
                .context("Failed to create user points")?;

                Ok(user_points)
            }
        }
    }

    /// Award points to user
    /// Note: This is automatically triggered by the database trigger when a task_completion is inserted
    pub async fn award_points(
        &self,
        user_address: &str,
        points: i32,
        completion: &TaskCompletion,
    ) -> Result<()> {
        // Ensure user points record exists
        let user = self.get_or_create_user_points(user_address).await?;

        // Insert task completion (trigger will update user_points automatically)
        let task_id = self.get_task_id(&completion.task_type).await?;

        sqlx::query!(
            r#"
            INSERT INTO task_completions (id, user_address, task_id, task_type, points_awarded, multiplier, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
            completion.id,
            user_address,
            task_id,
            &completion.task_type,
            points,
            completion.multiplier as f64,
            &completion.metadata
        )
        .execute(&self.pool)
        .await
        .context("Failed to insert task completion")?;

        // Create audit trail entry
        sqlx::query!(
            r#"
            INSERT INTO point_transactions (
                user_address,
                transaction_type,
                points_change,
                balance_before,
                balance_after,
                task_completion_id,
                reason
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
            user_address,
            "task_completion",
            points,
            user.total_points,
            user.total_points + points as i64,
            completion.id,
            format!("Completed task: {}", completion.task_type)
        )
        .execute(&self.pool)
        .await
        .context("Failed to insert point transaction")?;

        Ok(())
    }

    // ========================================================================
    // Task Operations
    // ========================================================================

    /// Get task ID by task_type
    async fn get_task_id(&self, task_type: &str) -> Result<Uuid> {
        let task = sqlx::query!(
            "SELECT id FROM tasks WHERE task_type = $1",
            task_type
        )
        .fetch_one(&self.pool)
        .await
        .context("Task type not found")?;

        Ok(task.id)
    }

    /// Check if user completed task today
    pub async fn has_completed_task_today(&self, user_address: &str, task_type: &str) -> Result<bool> {
        let today = Utc::now().date_naive();

        let result = sqlx::query!(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM task_completions
                WHERE user_address = $1
                AND task_type = $2
                AND DATE(completed_at) = $3
            ) as "exists!"
            "#,
            user_address,
            task_type,
            today
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to check task completion")?;

        Ok(result.exists)
    }

    /// Get task completions for user
    pub async fn get_task_completions(
        &self,
        user_address: &str,
        limit: i32,
    ) -> Result<Vec<TaskCompletion>> {
        let completions = sqlx::query!(
            r#"
            SELECT
                tc.id,
                tc.user_address,
                tc.task_type,
                tc.points_awarded,
                tc.multiplier::DOUBLE PRECISION as "multiplier!",
                tc.metadata,
                tc.completed_at
            FROM task_completions tc
            WHERE tc.user_address = $1
            ORDER BY tc.completed_at DESC
            LIMIT $2
            "#,
            user_address,
            limit as i64
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to fetch task completions")?;

        let result = completions
            .into_iter()
            .map(|row| TaskCompletion {
                id: row.id,
                user_address: row.user_address,
                task_type: row.task_type,
                points_awarded: row.points_awarded,
                multiplier: row.multiplier, // Already non-null from query
                metadata: row.metadata.unwrap_or_else(|| serde_json::json!({})),
                completed_at: row.completed_at.unwrap_or_else(Utc::now),
            })
            .collect();

        Ok(result)
    }

    // ========================================================================
    // Streak Operations
    // ========================================================================

    /// Get user's current streak
    pub async fn get_current_streak(&self, user_address: &str) -> Result<i32> {
        let streak = sqlx::query!(
            "SELECT current_streak FROM user_streaks WHERE user_address = $1",
            user_address
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch streak")?;

        Ok(streak.map(|s| s.current_streak).unwrap_or(0))
    }

    /// Get last check-in date
    pub async fn get_last_checkin_date(&self, user_address: &str) -> Result<Option<NaiveDate>> {
        let result = sqlx::query!(
            "SELECT last_checkin_date FROM user_streaks WHERE user_address = $1",
            user_address
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch last check-in date")?;

        Ok(result.and_then(|r| r.last_checkin_date))
    }

    /// Update user's streak
    pub async fn update_streak(&self, user_address: &str) -> Result<i32> {
        let today = Utc::now().date_naive();
        let last_checkin = self.get_last_checkin_date(user_address).await?;

        match last_checkin {
            None => {
                // First check-in ever
                sqlx::query!(
                    r#"
                    INSERT INTO user_streaks (user_address, current_streak, longest_streak, last_checkin_date, streak_started_at, total_checkins)
                    VALUES ($1, 1, 1, $2, $2, 1)
                    ON CONFLICT (user_address) DO UPDATE SET
                        current_streak = 1,
                        longest_streak = GREATEST(user_streaks.longest_streak, 1),
                        last_checkin_date = $2,
                        streak_started_at = $2,
                        total_checkins = user_streaks.total_checkins + 1,
                        updated_at = NOW()
                    "#,
                    user_address,
                    today
                )
                .execute(&self.pool)
                .await
                .context("Failed to initialize streak")?;

                // Update user_points table
                sqlx::query!(
                    "UPDATE user_points SET current_streak = 1, longest_streak = GREATEST(longest_streak, 1), last_checkin_date = $1 WHERE user_address = $2",
                    today,
                    user_address
                )
                .execute(&self.pool)
                .await?;

                Ok(1)
            }
            Some(last_date) if last_date == today => {
                // Already checked in today
                self.get_current_streak(user_address).await
            }
            Some(last_date) if last_date == today - chrono::Duration::days(1) => {
                // Consecutive day - increment streak
                let new_streak = sqlx::query!(
                    r#"
                    UPDATE user_streaks SET
                        current_streak = current_streak + 1,
                        longest_streak = GREATEST(longest_streak, current_streak + 1),
                        last_checkin_date = $1,
                        total_checkins = total_checkins + 1,
                        updated_at = NOW()
                    WHERE user_address = $2
                    RETURNING current_streak as "streak!"
                    "#,
                    today,
                    user_address
                )
                .fetch_one(&self.pool)
                .await
                .context("Failed to update streak")?;

                // Sync to user_points
                sqlx::query!(
                    "UPDATE user_points SET current_streak = $1, longest_streak = GREATEST(longest_streak, $1), last_checkin_date = $2 WHERE user_address = $3",
                    new_streak.streak,
                    today,
                    user_address
                )
                .execute(&self.pool)
                .await?;

                Ok(new_streak.streak)
            }
            Some(_) => {
                // Streak broken - reset to 1
                sqlx::query!(
                    r#"
                    UPDATE user_streaks SET
                        current_streak = 1,
                        last_checkin_date = $1,
                        streak_started_at = $1,
                        total_checkins = total_checkins + 1,
                        updated_at = NOW()
                    WHERE user_address = $2
                    "#,
                    today,
                    user_address
                )
                .execute(&self.pool)
                .await
                .context("Failed to reset streak")?;

                // Sync to user_points
                sqlx::query!(
                    "UPDATE user_points SET current_streak = 1, last_checkin_date = $1 WHERE user_address = $2",
                    today,
                    user_address
                )
                .execute(&self.pool)
                .await?;

                Ok(1)
            }
        }
    }

    // ========================================================================
    // Leaderboard Operations
    // ========================================================================

    /// Calculate and return user's rank
    pub async fn calculate_rank(&self, user_address: &str) -> Result<i32> {
        let rank = sqlx::query!(
            r#"
            SELECT (COUNT(*) + 1) as "rank!"
            FROM user_points
            WHERE total_points > (
                SELECT total_points FROM user_points WHERE user_address = $1
            )
            "#,
            user_address
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to calculate rank")?;

        Ok(rank.rank as i32)
    }
}
