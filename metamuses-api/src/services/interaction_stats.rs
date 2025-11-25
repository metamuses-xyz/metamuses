use crate::services::TraitAdjustments;
use anyhow::{Context, Result};
use sqlx::PgPool;
use uuid::Uuid;

/// Service for tracking interaction statistics per level
/// Used to calculate personality trait evolution when companion levels up
pub struct InteractionStatsService {
    pool: PgPool,
}

/// Interaction statistics for a level range
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct InteractionStatsRow {
    pub id: Uuid,
    pub companion_id: Uuid,
    pub user_address: String,
    pub level_range: String,
    pub total_messages: i32,
    pub creative_interactions: i32,
    pub wisdom_interactions: i32,
    pub humor_interactions: i32,
    pub empathy_interactions: i32,
    pub logic_interactions: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl InteractionStatsService {
    /// Create a new InteractionStatsService
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Update interaction stats for current level
    /// Creates a new row if it doesn't exist for this level
    pub async fn update_stats(
        &self,
        companion_id: Uuid,
        user_address: &str,
        current_level: i32,
        adjustments: &TraitAdjustments,
    ) -> Result<()> {
        let level_range = format!("{}-{}", current_level, current_level + 1);

        // Upsert stats
        sqlx::query(
            r#"
            INSERT INTO interaction_stats (
                companion_id, user_address, level_range,
                total_messages,
                creative_interactions,
                wisdom_interactions,
                humor_interactions,
                empathy_interactions,
                logic_interactions
            )
            VALUES ($1, $2, $3, 1, $4, $5, $6, $7, $8)
            ON CONFLICT (companion_id, user_address, level_range)
            DO UPDATE SET
                total_messages = interaction_stats.total_messages + 1,
                creative_interactions = interaction_stats.creative_interactions + EXCLUDED.creative_interactions,
                wisdom_interactions = interaction_stats.wisdom_interactions + EXCLUDED.wisdom_interactions,
                humor_interactions = interaction_stats.humor_interactions + EXCLUDED.humor_interactions,
                empathy_interactions = interaction_stats.empathy_interactions + EXCLUDED.empathy_interactions,
                logic_interactions = interaction_stats.logic_interactions + EXCLUDED.logic_interactions,
                updated_at = NOW()
            "#
        )
        .bind(companion_id)
        .bind(user_address)
        .bind(&level_range)
        .bind(if adjustments.creativity > 0 { 1 } else { 0 })
        .bind(if adjustments.wisdom > 0 { 1 } else { 0 })
        .bind(if adjustments.humor > 0 { 1 } else { 0 })
        .bind(if adjustments.empathy > 0 { 1 } else { 0 })
        .bind(if adjustments.logic > 0 { 1 } else { 0 })
        .execute(&self.pool)
        .await
        .context("Failed to update interaction stats")?;

        Ok(())
    }

    /// Get stats for a specific level range
    pub async fn get_stats(
        &self,
        companion_id: Uuid,
        user_address: &str,
        from_level: i32,
    ) -> Result<Option<InteractionStatsRow>> {
        let level_range = format!("{}-{}", from_level, from_level + 1);

        let stats = sqlx::query_as::<_, InteractionStatsRow>(
            r#"
            SELECT id, companion_id, user_address, level_range,
                   total_messages, creative_interactions, wisdom_interactions,
                   humor_interactions, empathy_interactions, logic_interactions,
                   created_at, updated_at
            FROM interaction_stats
            WHERE companion_id = $1 AND user_address = $2 AND level_range = $3
            "#,
        )
        .bind(companion_id)
        .bind(user_address)
        .bind(&level_range)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to get interaction stats")?;

        Ok(stats)
    }

    /// Get all stats for a companion
    pub async fn get_all_stats(
        &self,
        companion_id: Uuid,
        user_address: &str,
    ) -> Result<Vec<InteractionStatsRow>> {
        let stats = sqlx::query_as::<_, InteractionStatsRow>(
            r#"
            SELECT id, companion_id, user_address, level_range,
                   total_messages, creative_interactions, wisdom_interactions,
                   humor_interactions, empathy_interactions, logic_interactions,
                   created_at, updated_at
            FROM interaction_stats
            WHERE companion_id = $1 AND user_address = $2
            ORDER BY level_range ASC
            "#,
        )
        .bind(companion_id)
        .bind(user_address)
        .fetch_all(&self.pool)
        .await
        .context("Failed to get all interaction stats")?;

        Ok(stats)
    }

    /// Convert stats row to InteractionStats for evolution calculation
    pub fn to_interaction_stats(row: &InteractionStatsRow) -> crate::services::InteractionStats {
        crate::services::InteractionStats {
            total_messages: row.total_messages as usize,
            creative_interactions: row.creative_interactions as usize,
            wisdom_interactions: row.wisdom_interactions as usize,
            humor_interactions: row.humor_interactions as usize,
            empathy_interactions: row.empathy_interactions as usize,
            logic_interactions: row.logic_interactions as usize,
        }
    }

    /// Clear stats for a level range (after evolution is applied)
    pub async fn clear_stats(
        &self,
        companion_id: Uuid,
        user_address: &str,
        from_level: i32,
    ) -> Result<()> {
        let level_range = format!("{}-{}", from_level, from_level + 1);

        sqlx::query(
            r#"
            DELETE FROM interaction_stats
            WHERE companion_id = $1 AND user_address = $2 AND level_range = $3
            "#,
        )
        .bind(companion_id)
        .bind(user_address)
        .bind(&level_range)
        .execute(&self.pool)
        .await
        .context("Failed to clear interaction stats")?;

        Ok(())
    }

    /// Get summary statistics across all levels
    pub async fn get_summary(
        &self,
        companion_id: Uuid,
        user_address: &str,
    ) -> Result<InteractionSummary> {
        let summary = sqlx::query_as::<_, InteractionSummary>(
            r#"
            SELECT
                COALESCE(SUM(total_messages), 0)::INTEGER as total_messages,
                COALESCE(SUM(creative_interactions), 0)::INTEGER as creative_interactions,
                COALESCE(SUM(wisdom_interactions), 0)::INTEGER as wisdom_interactions,
                COALESCE(SUM(humor_interactions), 0)::INTEGER as humor_interactions,
                COALESCE(SUM(empathy_interactions), 0)::INTEGER as empathy_interactions,
                COALESCE(SUM(logic_interactions), 0)::INTEGER as logic_interactions
            FROM interaction_stats
            WHERE companion_id = $1 AND user_address = $2
            "#,
        )
        .bind(companion_id)
        .bind(user_address)
        .fetch_one(&self.pool)
        .await
        .context("Failed to get interaction summary")?;

        Ok(summary)
    }
}

/// Summary of all interactions across levels
#[derive(Debug, Clone, Default, sqlx::FromRow, serde::Serialize, serde::Deserialize)]
pub struct InteractionSummary {
    pub total_messages: i32,
    pub creative_interactions: i32,
    pub wisdom_interactions: i32,
    pub humor_interactions: i32,
    pub empathy_interactions: i32,
    pub logic_interactions: i32,
}

impl InteractionSummary {
    /// Calculate percentage of each interaction type
    pub fn percentages(&self) -> InteractionPercentages {
        let total = self.total_messages.max(1) as f32;

        InteractionPercentages {
            creativity: (self.creative_interactions as f32 / total) * 100.0,
            wisdom: (self.wisdom_interactions as f32 / total) * 100.0,
            humor: (self.humor_interactions as f32 / total) * 100.0,
            empathy: (self.empathy_interactions as f32 / total) * 100.0,
            logic: (self.logic_interactions as f32 / total) * 100.0,
        }
    }
}

/// Percentage breakdown of interaction types
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct InteractionPercentages {
    pub creativity: f32,
    pub wisdom: f32,
    pub humor: f32,
    pub empathy: f32,
    pub logic: f32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_summary_percentages() {
        let summary = InteractionSummary {
            total_messages: 100,
            creative_interactions: 30,
            wisdom_interactions: 20,
            humor_interactions: 15,
            empathy_interactions: 25,
            logic_interactions: 10,
        };

        let percentages = summary.percentages();

        assert_eq!(percentages.creativity, 30.0);
        assert_eq!(percentages.wisdom, 20.0);
        assert_eq!(percentages.humor, 15.0);
        assert_eq!(percentages.empathy, 25.0);
        assert_eq!(percentages.logic, 10.0);
    }

    #[test]
    fn test_summary_percentages_zero_messages() {
        let summary = InteractionSummary {
            total_messages: 0,
            creative_interactions: 0,
            wisdom_interactions: 0,
            humor_interactions: 0,
            empathy_interactions: 0,
            logic_interactions: 0,
        };

        let percentages = summary.percentages();

        // Should not panic, uses max(1) to avoid division by zero
        assert_eq!(percentages.creativity, 0.0);
    }
}
