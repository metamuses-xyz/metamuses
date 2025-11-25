use crate::models::{UpsertUserRequest, User};
use anyhow::{Context, Result};
use sqlx::PgPool;
use uuid::Uuid;

pub struct UserRepository {
    pool: PgPool,
}

impl UserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Create a new user or get existing
    pub async fn upsert(&self, req: &UpsertUserRequest) -> Result<User> {
        let user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (wallet_address, username)
            VALUES ($1, $2)
            ON CONFLICT (wallet_address)
            DO UPDATE SET
                username = COALESCE(EXCLUDED.username, users.username),
                last_active = NOW()
            RETURNING *
            "#,
        )
        .bind(req.wallet_address.to_lowercase())
        .bind(&req.username)
        .fetch_one(&self.pool)
        .await
        .context("Failed to upsert user")?;

        Ok(user)
    }

    /// Get user by wallet address
    pub async fn get_by_address(&self, wallet_address: &str) -> Result<Option<User>> {
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE wallet_address = $1")
            .bind(wallet_address.to_lowercase())
            .fetch_optional(&self.pool)
            .await
            .context("Failed to get user by address")?;

        Ok(user)
    }

    /// Get user by ID
    pub async fn get_by_id(&self, id: Uuid) -> Result<Option<User>> {
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .context("Failed to get user by id")?;

        Ok(user)
    }

    /// Update user's last active timestamp
    pub async fn update_last_active(&self, wallet_address: &str) -> Result<()> {
        sqlx::query("UPDATE users SET last_active = NOW() WHERE wallet_address = $1")
            .bind(wallet_address.to_lowercase())
            .execute(&self.pool)
            .await
            .context("Failed to update last active")?;

        Ok(())
    }

    /// Check if user exists
    pub async fn exists(&self, wallet_address: &str) -> Result<bool> {
        let exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM users WHERE wallet_address = $1)",
        )
        .bind(wallet_address.to_lowercase())
        .fetch_one(&self.pool)
        .await
        .context("Failed to check user existence")?;

        Ok(exists)
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
    async fn test_user_upsert() {
        let pool = setup_test_pool().await;
        let repo = UserRepository::new(pool);

        let req = UpsertUserRequest {
            wallet_address: "0xTEST999".to_string(),
            username: Some("TestUser".to_string()),
        };

        let user = repo.upsert(&req).await.expect("Failed to upsert user");
        assert_eq!(user.wallet_address, "0xtest999");
        assert_eq!(user.username, Some("TestUser".to_string()));

        let exists = repo
            .exists("0xtest999")
            .await
            .expect("Failed to check existence");
        assert!(exists);
    }
}
