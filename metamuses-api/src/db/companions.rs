use crate::models::{Companion, CompanionStats, Traits, UpdateCompanionRequest};
use anyhow::{Context, Result};
use sqlx::PgPool;
use uuid::Uuid;

pub struct CompanionRepository {
    pool: PgPool,
}

impl CompanionRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Create a new companion
    pub async fn create(
        &self,
        nft_token_id: i64,
        owner_address: &str,
        name: &str,
        traits: &Traits,
    ) -> Result<Companion> {
        let companion = sqlx::query_as::<_, Companion>(
            r#"
            INSERT INTO companions (
                nft_token_id, owner_address, name,
                creativity, wisdom, humor, empathy, logic
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            "#,
        )
        .bind(nft_token_id)
        .bind(owner_address.to_lowercase())
        .bind(name)
        .bind(traits.creativity as i16)
        .bind(traits.wisdom as i16)
        .bind(traits.humor as i16)
        .bind(traits.empathy as i16)
        .bind(traits.logic as i16)
        .fetch_one(&self.pool)
        .await
        .context("Failed to create companion")?;

        Ok(companion)
    }

    /// Get companion by ID
    pub async fn get_by_id(&self, id: Uuid) -> Result<Option<Companion>> {
        let companion = sqlx::query_as::<_, Companion>("SELECT * FROM companions WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .context("Failed to get companion by id")?;

        Ok(companion)
    }

    /// Get companion by NFT token ID
    pub async fn get_by_token_id(&self, token_id: i64) -> Result<Option<Companion>> {
        let companion =
            sqlx::query_as::<_, Companion>("SELECT * FROM companions WHERE nft_token_id = $1")
                .bind(token_id)
                .fetch_optional(&self.pool)
                .await
                .context("Failed to get companion by token id")?;

        Ok(companion)
    }

    /// Get all companions owned by an address
    pub async fn get_by_owner(&self, owner_address: &str) -> Result<Vec<Companion>> {
        let companions = sqlx::query_as::<_, Companion>(
            "SELECT * FROM companions WHERE owner_address = $1 ORDER BY created_at DESC",
        )
        .bind(owner_address.to_lowercase())
        .fetch_all(&self.pool)
        .await
        .context("Failed to get companions by owner")?;

        Ok(companions)
    }

    /// Update companion owner (when NFT is transferred)
    pub async fn update_owner(&self, token_id: i64, new_owner: &str) -> Result<Companion> {
        let companion = sqlx::query_as::<_, Companion>(
            "UPDATE companions SET owner_address = $1, updated_at = NOW() WHERE nft_token_id = $2 RETURNING *"
        )
        .bind(new_owner.to_lowercase())
        .bind(token_id)
        .fetch_one(&self.pool)
        .await
        .context("Failed to update companion owner")?;

        Ok(companion)
    }

    /// Update companion details
    pub async fn update(&self, id: Uuid, req: &UpdateCompanionRequest) -> Result<Companion> {
        let mut query = "UPDATE companions SET updated_at = NOW()".to_string();
        let mut params: Vec<String> = vec![];
        let mut param_index = 1;

        if let Some(name) = &req.name {
            params.push(format!(", name = ${}", param_index));
            param_index += 1;
        }

        if let Some(description) = &req.description {
            params.push(format!(", description = ${}", param_index));
            param_index += 1;
        }

        query.push_str(&params.join(""));
        query.push_str(&format!(" WHERE id = ${} RETURNING *", param_index));

        let mut q = sqlx::query_as::<_, Companion>(&query);

        if let Some(name) = &req.name {
            q = q.bind(name);
        }

        if let Some(description) = &req.description {
            q = q.bind(description);
        }

        q = q.bind(id);

        let companion = q
            .fetch_one(&self.pool)
            .await
            .context("Failed to update companion")?;

        Ok(companion)
    }

    /// Add XP to a companion
    pub async fn add_xp(&self, id: Uuid, xp: i64) -> Result<Companion> {
        let companion = sqlx::query_as::<_, Companion>(
            r#"
            UPDATE companions
            SET experience_points = experience_points + $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
            "#,
        )
        .bind(xp)
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .context("Failed to add XP to companion")?;

        Ok(companion)
    }

    /// Level up a companion
    pub async fn level_up(&self, id: Uuid) -> Result<Companion> {
        let companion = sqlx::query_as::<_, Companion>(
            r#"
            UPDATE companions
            SET level = level + 1,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .context("Failed to level up companion")?;

        Ok(companion)
    }

    /// Update companion traits
    pub async fn update_traits(&self, id: Uuid, traits: &Traits) -> Result<Companion> {
        let companion = sqlx::query_as::<_, Companion>(
            r#"
            UPDATE companions
            SET creativity = $1, wisdom = $2, humor = $3, empathy = $4, logic = $5,
                updated_at = NOW()
            WHERE id = $6
            RETURNING *
            "#,
        )
        .bind(traits.creativity as i16)
        .bind(traits.wisdom as i16)
        .bind(traits.humor as i16)
        .bind(traits.empathy as i16)
        .bind(traits.logic as i16)
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .context("Failed to update companion traits")?;

        Ok(companion)
    }

    /// Get companion statistics
    pub async fn get_stats(&self, id: Uuid) -> Result<CompanionStats> {
        #[derive(sqlx::FromRow)]
        struct StatsRow {
            total_messages: Option<i64>,
            created_at: chrono::DateTime<chrono::Utc>,
            level: i32,
            experience_points: i64,
        }

        let stats = sqlx::query_as::<_, StatsRow>(
            r#"
            SELECT
                COUNT(DISTINCT m.id) as total_messages,
                c.created_at,
                c.level,
                c.experience_points
            FROM companions c
            LEFT JOIN messages m ON m.companion_id = c.id
            WHERE c.id = $1
            GROUP BY c.id, c.created_at, c.level, c.experience_points
            "#,
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .context("Failed to get companion stats")?;

        let total_messages = stats.total_messages.unwrap_or(0);
        let total_conversations = (total_messages / 2).max(0); // Rough estimate

        let next_level_xp = Companion::xp_for_level((stats.level + 1) as u32) as i64;

        Ok(CompanionStats {
            total_conversations,
            total_messages,
            total_xp: stats.experience_points,
            level: stats.level,
            next_level_xp,
            created_at: stats.created_at,
        })
    }

    /// Check if companion exists for token ID
    pub async fn exists_by_token_id(&self, token_id: i64) -> Result<bool> {
        let exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM companions WHERE nft_token_id = $1)",
        )
        .bind(token_id)
        .fetch_one(&self.pool)
        .await
        .context("Failed to check companion existence")?;

        Ok(exists)
    }

    /// Delete companion (for testing)
    #[cfg(test)]
    pub async fn delete(&self, id: Uuid) -> Result<()> {
        sqlx::query("DELETE FROM companions WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .context("Failed to delete companion")?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::create_pool;

    async fn setup_test_pool() -> PgPool {
        let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
            "postgresql://postgres:postgres@localhost:5432/metamuses_test".to_string()
        });

        create_pool(&database_url)
            .await
            .expect("Failed to create pool")
    }

    #[tokio::test]
    #[ignore] // Requires database
    async fn test_companion_crud() {
        let pool = setup_test_pool().await;
        let repo = CompanionRepository::new(pool);

        let traits = Traits::balanced();
        let companion = repo
            .create(99999, "0xtest123", "Test Companion", &traits)
            .await
            .expect("Failed to create companion");

        assert_eq!(companion.name, "Test Companion");
        assert_eq!(companion.nft_token_id, 99999);

        let fetched = repo
            .get_by_id(companion.id)
            .await
            .expect("Failed to get companion");
        assert!(fetched.is_some());

        repo.delete(companion.id)
            .await
            .expect("Failed to delete companion");
    }
}
