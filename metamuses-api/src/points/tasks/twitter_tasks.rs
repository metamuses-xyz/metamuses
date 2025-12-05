// Twitter Social Tasks
// Implements follow and retweet tasks for social engagement

use async_trait::async_trait;
use anyhow::Result;
use sqlx::PgPool;

use super::{Task, TaskCompletion};
use crate::points::repository::PointsRepository;

/// Follow Twitter task - one-time reward
pub struct FollowTwitterTask {
    points_repo: PointsRepository,
    base_points: i32,
}

impl FollowTwitterTask {
    pub fn new(pool: PgPool, base_points: i32) -> Self {
        Self {
            points_repo: PointsRepository::new(pool),
            base_points,
        }
    }
}

#[async_trait]
impl Task for FollowTwitterTask {
    fn task_type(&self) -> &str {
        "follow_twitter"
    }

    async fn can_complete(&self, user_address: &str, _metadata: &serde_json::Value) -> Result<bool> {
        // Check if user has already completed this one-time task
        let already_completed = self.points_repo
            .has_completed_task(user_address, "follow_twitter")
            .await?;

        Ok(!already_completed)
    }

    async fn calculate_points(&self, _user_address: &str, _metadata: &serde_json::Value) -> Result<i32> {
        // Fixed points for following
        Ok(self.base_points)
    }

    async fn get_multiplier(&self, _user_address: &str) -> Result<f64> {
        // No multiplier for social tasks
        Ok(1.0)
    }

    async fn complete(&self, user_address: &str, metadata: serde_json::Value) -> Result<TaskCompletion> {
        let points = self.calculate_points(user_address, &metadata).await?;
        let multiplier = self.get_multiplier(user_address).await?;

        let completion = self.points_repo.record_task_completion(
            user_address,
            "follow_twitter",
            points,
            multiplier,
            metadata,
        ).await?;

        Ok(completion)
    }
}

/// Retweet Post task - one-time reward
pub struct RetweetPostTask {
    points_repo: PointsRepository,
    base_points: i32,
}

impl RetweetPostTask {
    pub fn new(pool: PgPool, base_points: i32) -> Self {
        Self {
            points_repo: PointsRepository::new(pool),
            base_points,
        }
    }
}

#[async_trait]
impl Task for RetweetPostTask {
    fn task_type(&self) -> &str {
        "retweet_post"
    }

    async fn can_complete(&self, user_address: &str, _metadata: &serde_json::Value) -> Result<bool> {
        // Check if user has already completed this one-time task
        let already_completed = self.points_repo
            .has_completed_task(user_address, "retweet_post")
            .await?;

        Ok(!already_completed)
    }

    async fn calculate_points(&self, _user_address: &str, _metadata: &serde_json::Value) -> Result<i32> {
        // Fixed points for retweeting
        Ok(self.base_points)
    }

    async fn get_multiplier(&self, _user_address: &str) -> Result<f64> {
        // No multiplier for social tasks
        Ok(1.0)
    }

    async fn complete(&self, user_address: &str, metadata: serde_json::Value) -> Result<TaskCompletion> {
        let points = self.calculate_points(user_address, &metadata).await?;
        let multiplier = self.get_multiplier(user_address).await?;

        let completion = self.points_repo.record_task_completion(
            user_address,
            "retweet_post",
            points,
            multiplier,
            metadata,
        ).await?;

        Ok(completion)
    }
}
