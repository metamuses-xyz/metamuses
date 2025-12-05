// Leaderboard Service - Rankings and Competition
// Manages global and seasonal leaderboards

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LeaderboardEntry {
    pub rank: i32,
    pub user_address: String,
    pub username: Option<String>,
    pub points: i64,
    pub streak: i32,
    pub nft_count: i32,
}

pub struct LeaderboardService {
    pool: PgPool,
}

impl LeaderboardService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Get global leaderboard (top N users)
    pub async fn get_global_leaderboard(&self, limit: i32) -> Result<Vec<LeaderboardEntry>> {
        let entries = sqlx::query_as!(
            LeaderboardEntry,
            r#"
            SELECT
                ROW_NUMBER() OVER (ORDER BY total_points DESC)::INTEGER as "rank!",
                user_address as "user_address!",
                NULL as username,
                total_points as "points!",
                current_streak as "streak!",
                0 as "nft_count!"
            FROM user_points
            WHERE total_points > 0
            ORDER BY total_points DESC
            LIMIT $1
            "#,
            limit as i64
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to fetch global leaderboard")?;

        Ok(entries)
    }

    /// Get user's rank and position
    pub async fn get_user_rank(&self, user_address: &str) -> Result<LeaderboardEntry> {
        let entry = sqlx::query_as!(
            LeaderboardEntry,
            r#"
            WITH ranked_users AS (
                SELECT
                    user_address,
                    total_points,
                    current_streak,
                    ROW_NUMBER() OVER (ORDER BY total_points DESC)::INTEGER as rank
                FROM user_points
                WHERE total_points > 0
            )
            SELECT
                rank as "rank!",
                user_address as "user_address!",
                NULL as username,
                total_points as "points!",
                current_streak as "streak!",
                0 as "nft_count!"
            FROM ranked_users
            WHERE user_address = $1
            "#,
            user_address
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to fetch user rank")?;

        Ok(entry)
    }

    /// Get leaderboard around a specific user (10 above, user, 10 below)
    pub async fn get_leaderboard_around_user(
        &self,
        user_address: &str,
        range: i32,
    ) -> Result<Vec<LeaderboardEntry>> {
        let entries = sqlx::query_as!(
            LeaderboardEntry,
            r#"
            WITH ranked_users AS (
                SELECT
                    user_address,
                    total_points,
                    current_streak,
                    ROW_NUMBER() OVER (ORDER BY total_points DESC)::INTEGER as rank
                FROM user_points
                WHERE total_points > 0
            ),
            user_rank AS (
                SELECT rank FROM ranked_users WHERE user_address = $1
            )
            SELECT
                r.rank as "rank!",
                r.user_address as "user_address!",
                NULL as username,
                r.total_points as "points!",
                r.current_streak as "streak!",
                0 as "nft_count!"
            FROM ranked_users r
            CROSS JOIN user_rank u
            WHERE r.rank BETWEEN (u.rank - $2) AND (u.rank + $2)
            ORDER BY r.rank
            "#,
            user_address,
            range as i64
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to fetch leaderboard around user")?;

        Ok(entries)
    }

    /// Get total user count
    pub async fn get_total_users(&self) -> Result<i64> {
        let result = sqlx::query!(
            r#"
            SELECT COUNT(*) as "count!"
            FROM user_points
            WHERE total_points > 0
            "#
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to count users")?;

        Ok(result.count)
    }

    /// Refresh leaderboard cache (run periodically)
    pub async fn refresh_cache(&self, leaderboard_type: &str) -> Result<()> {
        // Delete old cache
        sqlx::query!(
            "DELETE FROM leaderboard_cache WHERE leaderboard_type = $1",
            leaderboard_type
        )
        .execute(&self.pool)
        .await
        .context("Failed to delete leaderboard cache")?;

        // Rebuild cache
        sqlx::query!(
            r#"
            INSERT INTO leaderboard_cache (leaderboard_type, user_address, rank, points, streak)
            SELECT
                $1 as leaderboard_type,
                user_address,
                ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank,
                total_points as points,
                current_streak as streak
            FROM user_points
            WHERE total_points > 0
            ORDER BY total_points DESC
            LIMIT 1000
            "#,
            leaderboard_type
        )
        .execute(&self.pool)
        .await
        .context("Failed to rebuild leaderboard cache")?;

        Ok(())
    }
}
