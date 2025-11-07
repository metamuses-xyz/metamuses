use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Message role in a conversation
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MessageRole {
    User,
    Assistant,
    System,
}

impl std::fmt::Display for MessageRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MessageRole::User => write!(f, "user"),
            MessageRole::Assistant => write!(f, "assistant"),
            MessageRole::System => write!(f, "system"),
        }
    }
}

impl std::str::FromStr for MessageRole {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "user" => Ok(MessageRole::User),
            "assistant" => Ok(MessageRole::Assistant),
            "system" => Ok(MessageRole::System),
            _ => Err(format!("Invalid message role: {}", s)),
        }
    }
}

/// Message in a conversation
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Message {
    pub id: Uuid,
    pub companion_id: Uuid,
    pub user_address: String,
    #[sqlx(try_from = "String")]
    pub role: String,
    pub content: String,

    // Inference metadata
    pub model_name: Option<String>,
    pub tokens_used: Option<i32>,
    pub latency_ms: Option<i32>,

    pub created_at: DateTime<Utc>,
}

impl Message {
    /// Create a new user message
    pub fn user(companion_id: Uuid, user_address: String, content: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            companion_id,
            user_address,
            role: MessageRole::User.to_string(),
            content,
            model_name: None,
            tokens_used: None,
            latency_ms: None,
            created_at: Utc::now(),
        }
    }

    /// Create a new assistant message
    pub fn assistant(
        companion_id: Uuid,
        user_address: String,
        content: String,
        model_name: Option<String>,
        tokens_used: Option<i32>,
        latency_ms: Option<i32>,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            companion_id,
            user_address,
            role: MessageRole::Assistant.to_string(),
            content,
            model_name,
            tokens_used,
            latency_ms,
            created_at: Utc::now(),
        }
    }

    /// Create a new system message
    pub fn system(companion_id: Uuid, user_address: String, content: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            companion_id,
            user_address,
            role: MessageRole::System.to_string(),
            content,
            model_name: None,
            tokens_used: None,
            latency_ms: None,
            created_at: Utc::now(),
        }
    }

    /// Get message role as enum
    pub fn get_role(&self) -> Result<MessageRole, String> {
        self.role.parse()
    }
}

/// Request to create a message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMessageRequest {
    pub companion_id: Uuid,
    pub user_address: String,
    pub content: String,
}

/// Response containing message history
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageHistory {
    pub messages: Vec<Message>,
    pub total: i64,
    pub has_more: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_role_display() {
        assert_eq!(MessageRole::User.to_string(), "user");
        assert_eq!(MessageRole::Assistant.to_string(), "assistant");
        assert_eq!(MessageRole::System.to_string(), "system");
    }

    #[test]
    fn test_message_role_from_str() {
        assert_eq!("user".parse::<MessageRole>().unwrap(), MessageRole::User);
        assert_eq!(
            "assistant".parse::<MessageRole>().unwrap(),
            MessageRole::Assistant
        );
        assert_eq!(
            "system".parse::<MessageRole>().unwrap(),
            MessageRole::System
        );
        assert_eq!("USER".parse::<MessageRole>().unwrap(), MessageRole::User);
        assert!("invalid".parse::<MessageRole>().is_err());
    }

    #[test]
    fn test_message_creation() {
        let companion_id = Uuid::new_v4();
        let address = "0x1234".to_string();

        let user_msg = Message::user(companion_id, address.clone(), "Hello".to_string());
        assert_eq!(user_msg.role, "user");
        assert_eq!(user_msg.content, "Hello");

        let assistant_msg = Message::assistant(
            companion_id,
            address.clone(),
            "Hi there!".to_string(),
            Some("qwen2.5-3b".to_string()),
            Some(50),
            Some(1200),
        );
        assert_eq!(assistant_msg.role, "assistant");
        assert_eq!(assistant_msg.model_name, Some("qwen2.5-3b".to_string()));
    }
}
