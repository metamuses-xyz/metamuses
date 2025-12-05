use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use ethers::types::{Address, Signature};
use ethers::utils::hash_message;
use std::str::FromStr;

#[derive(Debug, Serialize, Deserialize)]
pub struct TwitterVerification {
    pub id: String,
    pub user_address: String,
    pub twitter_handle: String,
    pub signature: String,
    pub message: String,
    pub verified_at: chrono::DateTime<chrono::Utc>,
    pub is_valid: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerifyTwitterRequest {
    pub user_address: String,
    pub twitter_handle: String,
    pub signature: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CompleteTwitterTaskRequest {
    pub user_address: String,
    pub task_type: String, // "follow_twitter" or "retweet_post"
    pub twitter_handle: String,
}

#[derive(Debug, Clone)]
pub struct TwitterVerificationService {
    pool: PgPool,
}

impl TwitterVerificationService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Verify wallet signature for Twitter handle ownership claim
    pub async fn verify_signature(
        &self,
        user_address: &str,
        twitter_handle: &str,
        signature: &str,
    ) -> Result<bool> {
        // Create the message that should have been signed
        let message = format!(
            "I verify that I own the Twitter handle @{} for MetaMuses points.\nWallet: {}\nTimestamp: {}",
            twitter_handle,
            user_address,
            chrono::Utc::now().format("%Y-%m-%d")
        );

        // Parse the signature
        let sig = Signature::from_str(signature)
            .context("Failed to parse signature")?;

        // Hash the message (EIP-191 format: "\x19Ethereum Signed Message:\n" + len(message) + message)
        let message_hash = hash_message(message.as_bytes());

        // Recover the address from the signature
        let recovered_address = sig.recover(message_hash)
            .context("Failed to recover address from signature")?;

        // Compare with claimed address
        let claimed_address = Address::from_str(user_address)
            .context("Invalid user address format")?;

        Ok(recovered_address == claimed_address)
    }

    /// Store verified Twitter handle for a user
    pub async fn store_verification(
        &self,
        user_address: &str,
        twitter_handle: &str,
        signature: &str,
    ) -> Result<TwitterVerification> {
        let message = format!(
            "I verify that I own the Twitter handle @{} for MetaMuses points.\nWallet: {}\nTimestamp: {}",
            twitter_handle,
            user_address,
            chrono::Utc::now().format("%Y-%m-%d")
        );

        let record = sqlx::query!(
            r#"
            INSERT INTO twitter_verifications (user_address, twitter_handle, signature, message, is_valid)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (user_address) DO UPDATE
            SET twitter_handle = $2, signature = $3, message = $4, verified_at = NOW(), is_valid = true
            RETURNING id, user_address, twitter_handle, signature, message, verified_at, is_valid
            "#,
            user_address,
            twitter_handle,
            signature,
            message
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to store Twitter verification")?;

        Ok(TwitterVerification {
            id: record.id.to_string(),
            user_address: record.user_address,
            twitter_handle: record.twitter_handle,
            signature: record.signature,
            message: record.message,
            verified_at: record.verified_at.unwrap(),
            is_valid: record.is_valid.unwrap_or(true),
        })
    }

    /// Get user's verified Twitter handle
    pub async fn get_verification(&self, user_address: &str) -> Result<Option<TwitterVerification>> {
        let record = sqlx::query!(
            r#"
            SELECT id, user_address, twitter_handle, signature, message, verified_at, is_valid
            FROM twitter_verifications
            WHERE user_address = $1 AND is_valid = true
            "#,
            user_address
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to get Twitter verification")?;

        Ok(record.map(|r| TwitterVerification {
            id: r.id.to_string(),
            user_address: r.user_address,
            twitter_handle: r.twitter_handle,
            signature: r.signature,
            message: r.message,
            verified_at: r.verified_at.unwrap(),
            is_valid: r.is_valid.unwrap_or(true),
        }))
    }

    /// Check if user has completed a specific Twitter task
    pub async fn has_completed_task(&self, user_address: &str, task_type: &str) -> Result<bool> {
        let record = sqlx::query!(
            r#"
            SELECT id
            FROM twitter_task_completions
            WHERE user_address = $1 AND task_type = $2
            "#,
            user_address,
            task_type
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to check Twitter task completion")?;

        Ok(record.is_some())
    }

    /// Mark a Twitter task as completed
    pub async fn complete_twitter_task(
        &self,
        user_address: &str,
        task_type: &str,
        twitter_handle: &str,
    ) -> Result<()> {
        // Get the verification ID
        let verification = self.get_verification(user_address).await?;
        let verification_id = verification
            .map(|v| uuid::Uuid::parse_str(&v.id).ok())
            .flatten();

        sqlx::query!(
            r#"
            INSERT INTO twitter_task_completions (user_address, task_type, twitter_handle, verification_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_address, task_type) DO NOTHING
            "#,
            user_address,
            task_type,
            twitter_handle,
            verification_id
        )
        .execute(&self.pool)
        .await
        .context("Failed to mark Twitter task as completed")?;

        Ok(())
    }

    /// Get all Twitter task completions for a user
    pub async fn get_user_completions(&self, user_address: &str) -> Result<Vec<String>> {
        let records = sqlx::query!(
            r#"
            SELECT task_type
            FROM twitter_task_completions
            WHERE user_address = $1
            ORDER BY completed_at DESC
            "#,
            user_address
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to get user Twitter task completions")?;

        Ok(records.into_iter().map(|r| r.task_type).collect())
    }
}
