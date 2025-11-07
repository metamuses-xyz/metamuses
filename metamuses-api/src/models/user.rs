use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// User (wallet owner)
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub wallet_address: String,
    pub username: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_active: DateTime<Utc>,
}

impl User {
    /// Create a new user
    pub fn new(wallet_address: String, username: Option<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            wallet_address: wallet_address.to_lowercase(),
            username,
            created_at: Utc::now(),
            last_active: Utc::now(),
        }
    }

    /// Normalize wallet address to lowercase
    pub fn normalize_address(address: &str) -> String {
        address.to_lowercase()
    }
}

/// Request to create or update a user
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpsertUserRequest {
    pub wallet_address: String,
    pub username: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_creation() {
        let user = User::new("0x1234ABCD".to_string(), Some("Alice".to_string()));
        assert_eq!(user.wallet_address, "0x1234abcd");
        assert_eq!(user.username, Some("Alice".to_string()));
    }

    #[test]
    fn test_normalize_address() {
        assert_eq!(User::normalize_address("0x1234ABCD"), "0x1234abcd");
        assert_eq!(User::normalize_address("0xabcdef"), "0xabcdef");
    }
}
