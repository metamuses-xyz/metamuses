use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Fact extracted from conversations
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Fact {
    pub id: Uuid,
    pub companion_id: Uuid,
    pub user_address: String,
    pub category: Option<String>,
    pub fact_text: String,
    pub confidence: f32,
    pub source_message_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Fact categories
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FactCategory {
    Preference, // User preferences (likes/dislikes)
    Personal,   // Personal information about the user
    History,    // Past events or experiences
    Knowledge,  // General knowledge shared
    Goal,       // User goals or aspirations
    Other,      // Uncategorized
}

impl std::fmt::Display for FactCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FactCategory::Preference => write!(f, "preference"),
            FactCategory::Personal => write!(f, "personal"),
            FactCategory::History => write!(f, "history"),
            FactCategory::Knowledge => write!(f, "knowledge"),
            FactCategory::Goal => write!(f, "goal"),
            FactCategory::Other => write!(f, "other"),
        }
    }
}

impl std::str::FromStr for FactCategory {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "preference" => Ok(FactCategory::Preference),
            "personal" => Ok(FactCategory::Personal),
            "history" => Ok(FactCategory::History),
            "knowledge" => Ok(FactCategory::Knowledge),
            "goal" => Ok(FactCategory::Goal),
            "other" => Ok(FactCategory::Other),
            _ => Ok(FactCategory::Other),
        }
    }
}

impl Fact {
    /// Create a new fact
    pub fn new(
        companion_id: Uuid,
        user_address: String,
        category: Option<String>,
        fact_text: String,
        confidence: f32,
        source_message_id: Option<Uuid>,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            companion_id,
            user_address,
            category,
            fact_text,
            confidence: confidence.max(0.0).min(1.0),
            source_message_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

/// Request to create a fact
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFactRequest {
    pub companion_id: Uuid,
    pub user_address: String,
    pub category: Option<String>,
    pub fact_text: String,
    pub confidence: Option<f32>,
    pub source_message_id: Option<Uuid>,
}

/// Interaction with a companion (for XP tracking)
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Interaction {
    pub id: Uuid,
    pub companion_id: Uuid,
    pub user_address: String,
    pub interaction_type: String,
    pub xp_gained: i32,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

/// Interaction types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum InteractionType {
    Chat,
    Customize,
    DailyStreak,
    Achievement,
    Other,
}

impl std::fmt::Display for InteractionType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            InteractionType::Chat => write!(f, "chat"),
            InteractionType::Customize => write!(f, "customize"),
            InteractionType::DailyStreak => write!(f, "daily_streak"),
            InteractionType::Achievement => write!(f, "achievement"),
            InteractionType::Other => write!(f, "other"),
        }
    }
}

impl Interaction {
    /// Create a new interaction
    pub fn new(
        companion_id: Uuid,
        user_address: String,
        interaction_type: InteractionType,
        xp_gained: i32,
        metadata: Option<serde_json::Value>,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            companion_id,
            user_address,
            interaction_type: interaction_type.to_string(),
            xp_gained,
            metadata,
            created_at: Utc::now(),
        }
    }
}

/// User preference
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Preference {
    pub id: Uuid,
    pub companion_id: Uuid,
    pub user_address: String,
    pub key: String,
    pub value: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Preference {
    /// Create a new preference
    pub fn new(companion_id: Uuid, user_address: String, key: String, value: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            companion_id,
            user_address,
            key,
            value,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fact_category_display() {
        assert_eq!(FactCategory::Preference.to_string(), "preference");
        assert_eq!(FactCategory::Personal.to_string(), "personal");
    }

    #[test]
    fn test_fact_creation() {
        let companion_id = Uuid::new_v4();
        let fact = Fact::new(
            companion_id,
            "0x1234".to_string(),
            Some("preference".to_string()),
            "User likes coffee".to_string(),
            0.95,
            None,
        );

        assert_eq!(fact.companion_id, companion_id);
        assert_eq!(fact.confidence, 0.95);
        assert_eq!(fact.fact_text, "User likes coffee");
    }

    #[test]
    fn test_interaction_creation() {
        let companion_id = Uuid::new_v4();
        let interaction = Interaction::new(
            companion_id,
            "0x1234".to_string(),
            InteractionType::Chat,
            10,
            None,
        );

        assert_eq!(interaction.companion_id, companion_id);
        assert_eq!(interaction.xp_gained, 10);
        assert_eq!(interaction.interaction_type, "chat");
    }
}
