// Daily Check-In Task Implementation
// Awards points for daily check-ins with streak bonuses

use super::{Task, TaskCompletion};
use crate::points::PointsRepository;
use async_trait::async_trait;
use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

pub struct DailyCheckInTask {
    pool: PgPool,
    points_repo: PointsRepository,
    base_points: i32,
    streak_bonus_per_day: i32,
    max_streak_bonus: i32,
}

impl DailyCheckInTask {
    pub fn new(pool: PgPool, base_points: i32, streak_bonus_per_day: i32, max_streak_bonus: i32) -> Self {
        Self {
            points_repo: PointsRepository::new(pool.clone()),
            pool,
            base_points,
            streak_bonus_per_day,
            max_streak_bonus,
        }
    }
}

#[async_trait]
impl Task for DailyCheckInTask {
    fn task_type(&self) -> &str {
        "daily_checkin"
    }

    async fn can_complete(
        &self,
        user_address: &str,
        _metadata: &serde_json::Value,
    ) -> anyhow::Result<bool> {
        // Check if user already checked in today
        let has_completed = self
            .points_repo
            .has_completed_task_today(user_address, self.task_type())
            .await?;

        Ok(!has_completed)
    }

    async fn calculate_points(
        &self,
        user_address: &str,
        _metadata: &serde_json::Value,
    ) -> anyhow::Result<i32> {
        // Get current streak (before updating)
        let current_streak = self.points_repo.get_current_streak(user_address).await?;

        // Calculate streak bonus (capped at max)
        let streak_bonus = (current_streak * self.streak_bonus_per_day).min(self.max_streak_bonus);

        // Total points = base + streak bonus
        let total = self.base_points + streak_bonus;

        Ok(total)
    }

    async fn get_multiplier(&self, user_address: &str) -> anyhow::Result<f64> {
        // Get current streak
        let streak = self.points_repo.get_current_streak(user_address).await?;

        // Multiplier: 1.0x base, +0.1x per day up to 2.0x at 10-day streak
        let multiplier = 1.0 + (streak as f64 * 0.1).min(1.0);

        Ok(multiplier)
    }

    async fn complete(
        &self,
        user_address: &str,
        metadata: serde_json::Value,
    ) -> anyhow::Result<TaskCompletion> {
        // Validate can complete
        if !self.can_complete(user_address, &metadata).await? {
            return Err(anyhow::anyhow!(
                "Cannot complete check-in: already checked in today"
            ));
        }

        // Get streak BEFORE updating
        let old_streak = self.points_repo.get_current_streak(user_address).await?;

        // Update streak (this must happen before calculating points for new check-in)
        let new_streak = self.points_repo.update_streak(user_address).await?;

        // Calculate points (using old streak for consistency)
        let base_points = self.calculate_points(user_address, &metadata).await?;
        let multiplier = self.get_multiplier(user_address).await?;
        let final_points = (base_points as f64 * multiplier) as i32;

        // Create completion record
        let completion = TaskCompletion {
            id: Uuid::new_v4(),
            user_address: user_address.to_string(),
            task_type: self.task_type().to_string(),
            points_awarded: final_points,
            multiplier,
            metadata: serde_json::json!({
                "checkin_date": Utc::now().date_naive().to_string(),
                "old_streak": old_streak,
                "new_streak": new_streak,
                "streak_bonus": (old_streak * self.streak_bonus_per_day).min(self.max_streak_bonus),
                "base_points": self.base_points,
            }),
            completed_at: Utc::now(),
        };

        // Award points
        self.points_repo
            .award_points(user_address, final_points, &completion)
            .await?;

        Ok(completion)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Requires database connection
    async fn test_daily_checkin_streak_bonus() {
        // This would require a test database setup
        // Placeholder for integration test
    }
}
