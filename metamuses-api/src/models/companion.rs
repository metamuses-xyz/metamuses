use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Companion represents an AI companion linked to an NFT
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Companion {
    pub id: Uuid,
    pub nft_token_id: i64,
    pub owner_address: String,
    pub name: String,

    // Personality traits (0-100 scale)
    pub creativity: i16,
    pub wisdom: i16,
    pub humor: i16,
    pub empathy: i16,
    pub logic: i16,

    // Progression
    pub level: i32,
    pub experience_points: i64,

    // Metadata
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub metadata_uri: Option<String>,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Personality traits structure (0-100 scale)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Traits {
    pub creativity: u8,
    pub wisdom: u8,
    pub humor: u8,
    pub empathy: u8,
    pub logic: u8,
}

impl Traits {
    /// Create balanced traits (all 50)
    pub fn balanced() -> Self {
        Self {
            creativity: 50,
            wisdom: 50,
            humor: 50,
            empathy: 50,
            logic: 50,
        }
    }

    /// Create random traits in range 30-90
    pub fn random() -> Self {
        use rand::Rng;
        let mut rng = rand::thread_rng();

        Self {
            creativity: rng.gen_range(30..=90),
            wisdom: rng.gen_range(30..=90),
            humor: rng.gen_range(30..=90),
            empathy: rng.gen_range(30..=90),
            logic: rng.gen_range(30..=90),
        }
    }

    /// Get the dominant trait
    pub fn dominant_trait(&self) -> (&str, u8) {
        let traits = vec![
            ("creativity", self.creativity),
            ("wisdom", self.wisdom),
            ("humor", self.humor),
            ("empathy", self.empathy),
            ("logic", self.logic),
        ];

        traits
            .into_iter()
            .max_by_key(|(_, value)| *value)
            .unwrap_or(("balanced", 50))
    }

    /// Validate all traits are in range 0-100
    pub fn validate(&self) -> bool {
        self.creativity <= 100
            && self.wisdom <= 100
            && self.humor <= 100
            && self.empathy <= 100
            && self.logic <= 100
    }
}

impl From<&Companion> for Traits {
    fn from(companion: &Companion) -> Self {
        Self {
            creativity: companion.creativity.max(0).min(100) as u8,
            wisdom: companion.wisdom.max(0).min(100) as u8,
            humor: companion.humor.max(0).min(100) as u8,
            empathy: companion.empathy.max(0).min(100) as u8,
            logic: companion.logic.max(0).min(100) as u8,
        }
    }
}

/// Request to create a new companion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCompanionRequest {
    pub nft_token_id: i64,
    pub owner_address: String,
    pub name: Option<String>,
    pub traits: Option<Traits>,
}

/// Request to update a companion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCompanionRequest {
    pub name: Option<String>,
    pub description: Option<String>,
}

/// Companion statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanionStats {
    pub total_conversations: i64,
    pub total_messages: i64,
    pub total_xp: i64,
    pub level: i32,
    pub next_level_xp: i64,
    pub created_at: DateTime<Utc>,
}

impl Companion {
    /// Check if companion can level up
    pub fn can_level_up(&self) -> bool {
        let required_xp = Self::xp_for_level(self.level as u32);
        self.experience_points >= required_xp as i64
    }

    /// Calculate XP required for a given level
    pub fn xp_for_level(level: u32) -> u64 {
        // Exponential curve: 100 * 1.5^(level-1)
        (100.0 * 1.5_f64.powi((level - 1) as i32)) as u64
    }

    /// Calculate current level from total XP
    pub fn calculate_level(total_xp: u64) -> u32 {
        let mut level = 1;
        let mut required_xp = 0;

        while total_xp >= required_xp + Self::xp_for_level(level) {
            required_xp += Self::xp_for_level(level);
            level += 1;
        }

        level
    }

    /// Get XP needed for next level
    pub fn xp_to_next_level(&self) -> i64 {
        let next_level_xp = Self::xp_for_level((self.level + 1) as u32) as i64;
        let current_level_total = Self::xp_for_level(self.level as u32) as i64;
        next_level_xp - (self.experience_points - current_level_total)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_traits_balanced() {
        let traits = Traits::balanced();
        assert_eq!(traits.creativity, 50);
        assert_eq!(traits.wisdom, 50);
        assert_eq!(traits.humor, 50);
        assert_eq!(traits.empathy, 50);
        assert_eq!(traits.logic, 50);
    }

    #[test]
    fn test_traits_validate() {
        let valid_traits = Traits {
            creativity: 80,
            wisdom: 60,
            humor: 40,
            empathy: 90,
            logic: 50,
        };
        assert!(valid_traits.validate());

        let invalid_traits = Traits {
            creativity: 150,
            wisdom: 60,
            humor: 40,
            empathy: 90,
            logic: 50,
        };
        assert!(!invalid_traits.validate());
    }

    #[test]
    fn test_dominant_trait() {
        let traits = Traits {
            creativity: 95,
            wisdom: 60,
            humor: 40,
            empathy: 70,
            logic: 50,
        };
        let (name, value) = traits.dominant_trait();
        assert_eq!(name, "creativity");
        assert_eq!(value, 95);
    }

    #[test]
    fn test_xp_for_level() {
        assert_eq!(Companion::xp_for_level(1), 100);
        assert_eq!(Companion::xp_for_level(2), 150);
        assert_eq!(Companion::xp_for_level(3), 225);
        assert_eq!(Companion::xp_for_level(4), 337);
    }

    #[test]
    fn test_calculate_level() {
        assert_eq!(Companion::calculate_level(0), 1);
        assert_eq!(Companion::calculate_level(100), 2);
        assert_eq!(Companion::calculate_level(250), 3);
        assert_eq!(Companion::calculate_level(475), 4);
    }
}
