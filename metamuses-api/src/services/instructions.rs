use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

/// Communication style options
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum CommunicationStyle {
    Casual,
    Formal,
    Playful,
    Professional,
}

impl CommunicationStyle {
    pub fn as_str(&self) -> &'static str {
        match self {
            CommunicationStyle::Casual => "casual",
            CommunicationStyle::Formal => "formal",
            CommunicationStyle::Playful => "playful",
            CommunicationStyle::Professional => "professional",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "casual" => Some(CommunicationStyle::Casual),
            "formal" => Some(CommunicationStyle::Formal),
            "playful" => Some(CommunicationStyle::Playful),
            "professional" => Some(CommunicationStyle::Professional),
            _ => None,
        }
    }

    pub fn to_prompt_guidance(&self) -> &'static str {
        match self {
            CommunicationStyle::Casual => "Use a friendly, relaxed tone. Feel free to use contractions and informal language.",
            CommunicationStyle::Formal => "Maintain a polite, professional tone. Use complete sentences and proper grammar.",
            CommunicationStyle::Playful => "Be fun and energetic! Use playful language, jokes when appropriate, and keep things light.",
            CommunicationStyle::Professional => "Be clear, concise, and business-like. Focus on providing helpful, accurate information.",
        }
    }
}

/// Response length options
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ResponseLength {
    Concise,
    Balanced,
    Detailed,
    Comprehensive,
}

impl ResponseLength {
    pub fn as_str(&self) -> &'static str {
        match self {
            ResponseLength::Concise => "concise",
            ResponseLength::Balanced => "balanced",
            ResponseLength::Detailed => "detailed",
            ResponseLength::Comprehensive => "comprehensive",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "concise" => Some(ResponseLength::Concise),
            "balanced" => Some(ResponseLength::Balanced),
            "detailed" => Some(ResponseLength::Detailed),
            "comprehensive" => Some(ResponseLength::Comprehensive),
            _ => None,
        }
    }

    pub fn to_prompt_guidance(&self) -> &'static str {
        match self {
            ResponseLength::Concise => "Keep responses brief and to the point. 1-2 sentences when possible.",
            ResponseLength::Balanced => "Provide moderate-length responses. Include necessary detail but don't over-explain.",
            ResponseLength::Detailed => "Give thorough explanations with examples when helpful. Don't rush through complex topics.",
            ResponseLength::Comprehensive => "Provide in-depth, comprehensive responses. Cover all aspects of a topic thoroughly.",
        }
    }
}

/// Database row for user_instructions
#[derive(Debug, Clone, FromRow)]
struct UserInstructionsRow {
    pub id: Uuid,
    pub companion_id: Uuid,
    pub user_address: String,
    pub custom_instructions: Option<String>,
    pub communication_style: Option<String>,
    pub response_length: Option<String>,
    pub topics_to_avoid: Option<Vec<String>>,
    pub topics_to_focus: Option<Vec<String>>,
    pub language_preference: Option<String>,
    pub use_emojis: Option<bool>,
    pub be_proactive: Option<bool>,
    pub remember_context: Option<bool>,
}

/// User instructions for a companion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInstructions {
    pub id: Option<Uuid>,
    pub companion_id: Uuid,
    pub user_address: String,

    // Free-text custom instructions
    pub custom_instructions: Option<String>,

    // Structured behavior rules
    pub communication_style: Option<CommunicationStyle>,
    pub response_length: Option<ResponseLength>,
    pub topics_to_avoid: Vec<String>,
    pub topics_to_focus: Vec<String>,
    pub language_preference: String,

    // Behavior flags
    pub use_emojis: bool,
    pub be_proactive: bool,
    pub remember_context: bool,
}

impl Default for UserInstructions {
    fn default() -> Self {
        Self {
            id: None,
            companion_id: Uuid::nil(),
            user_address: String::new(),
            custom_instructions: None,
            communication_style: None,
            response_length: None,
            topics_to_avoid: Vec::new(),
            topics_to_focus: Vec::new(),
            language_preference: "en".to_string(),
            use_emojis: true,
            be_proactive: false,
            remember_context: true,
        }
    }
}

impl From<UserInstructionsRow> for UserInstructions {
    fn from(row: UserInstructionsRow) -> Self {
        Self {
            id: Some(row.id),
            companion_id: row.companion_id,
            user_address: row.user_address,
            custom_instructions: row.custom_instructions,
            communication_style: row
                .communication_style
                .as_ref()
                .and_then(|s| CommunicationStyle::from_str(s)),
            response_length: row
                .response_length
                .as_ref()
                .and_then(|s| ResponseLength::from_str(s)),
            topics_to_avoid: row.topics_to_avoid.unwrap_or_default(),
            topics_to_focus: row.topics_to_focus.unwrap_or_default(),
            language_preference: row.language_preference.unwrap_or_else(|| "en".to_string()),
            use_emojis: row.use_emojis.unwrap_or(true),
            be_proactive: row.be_proactive.unwrap_or(false),
            remember_context: row.remember_context.unwrap_or(true),
        }
    }
}

/// Effective instructions after merging defaults
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EffectiveInstructions {
    pub custom_instructions: Option<String>,
    pub communication_style: CommunicationStyle,
    pub response_length: ResponseLength,
    pub topics_to_avoid: Vec<String>,
    pub topics_to_focus: Vec<String>,
    pub language_preference: String,
    pub use_emojis: bool,
    pub be_proactive: bool,
    pub remember_context: bool,
}

impl Default for EffectiveInstructions {
    fn default() -> Self {
        Self {
            custom_instructions: None,
            communication_style: CommunicationStyle::Casual,
            response_length: ResponseLength::Balanced,
            topics_to_avoid: Vec::new(),
            topics_to_focus: Vec::new(),
            language_preference: "en".to_string(),
            use_emojis: true,
            be_proactive: false,
            remember_context: true,
        }
    }
}

impl EffectiveInstructions {
    /// Generate a prompt segment from these instructions
    pub fn to_prompt_segment(&self) -> String {
        let mut segments = Vec::new();

        // Add custom instructions
        if let Some(ref custom) = self.custom_instructions {
            if !custom.trim().is_empty() {
                segments.push(format!("User's custom instructions: {}", custom.trim()));
            }
        }

        // Add communication style
        segments.push(format!(
            "Communication style: {}",
            self.communication_style.to_prompt_guidance()
        ));

        // Add response length
        segments.push(format!(
            "Response length: {}",
            self.response_length.to_prompt_guidance()
        ));

        // Add topics to avoid
        if !self.topics_to_avoid.is_empty() {
            segments.push(format!(
                "Avoid discussing these topics: {}",
                self.topics_to_avoid.join(", ")
            ));
        }

        // Add topics to focus on
        if !self.topics_to_focus.is_empty() {
            segments.push(format!(
                "Focus on these topics when relevant: {}",
                self.topics_to_focus.join(", ")
            ));
        }

        // Add emoji preference
        if !self.use_emojis {
            segments.push("Do not use emojis in responses.".to_string());
        }

        // Add proactive behavior
        if self.be_proactive {
            segments.push("Be proactive - suggest next steps, ask follow-up questions, and anticipate user needs.".to_string());
        }

        segments.join("\n")
    }
}

/// Request to update user instructions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInstructionsRequest {
    pub custom_instructions: Option<String>,
    pub communication_style: Option<String>,
    pub response_length: Option<String>,
    pub topics_to_avoid: Option<Vec<String>>,
    pub topics_to_focus: Option<Vec<String>>,
    pub language_preference: Option<String>,
    pub use_emojis: Option<bool>,
    pub be_proactive: Option<bool>,
    pub remember_context: Option<bool>,
}

/// Service for managing user instructions
pub struct InstructionService {
    pool: PgPool,
}

impl InstructionService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Get user instructions for a companion
    pub async fn get_instructions(
        &self,
        companion_id: Uuid,
        user_address: &str,
    ) -> Result<Option<UserInstructions>> {
        let row: Option<UserInstructionsRow> = sqlx::query_as(
            r#"
            SELECT
                id, companion_id, user_address,
                custom_instructions,
                communication_style,
                response_length,
                topics_to_avoid,
                topics_to_focus,
                language_preference,
                use_emojis,
                be_proactive,
                remember_context
            FROM user_instructions
            WHERE companion_id = $1 AND user_address = $2
            "#,
        )
        .bind(companion_id)
        .bind(user_address.to_lowercase())
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch user instructions")?;

        Ok(row.map(UserInstructions::from))
    }

    /// Get effective instructions (with defaults applied)
    pub async fn get_effective_instructions(
        &self,
        companion_id: Uuid,
        user_address: &str,
    ) -> Result<EffectiveInstructions> {
        let user_instructions = self.get_instructions(companion_id, user_address).await?;

        Ok(match user_instructions {
            Some(ui) => EffectiveInstructions {
                custom_instructions: ui.custom_instructions,
                communication_style: ui.communication_style.unwrap_or(CommunicationStyle::Casual),
                response_length: ui.response_length.unwrap_or(ResponseLength::Balanced),
                topics_to_avoid: ui.topics_to_avoid,
                topics_to_focus: ui.topics_to_focus,
                language_preference: ui.language_preference,
                use_emojis: ui.use_emojis,
                be_proactive: ui.be_proactive,
                remember_context: ui.remember_context,
            },
            None => EffectiveInstructions::default(),
        })
    }

    /// Create or update user instructions (upsert)
    pub async fn upsert_instructions(
        &self,
        companion_id: Uuid,
        user_address: &str,
        req: &UpdateInstructionsRequest,
    ) -> Result<UserInstructions> {
        let communication_style = req
            .communication_style
            .as_ref()
            .and_then(|s| CommunicationStyle::from_str(s))
            .map(|c| c.as_str().to_string());

        let response_length = req
            .response_length
            .as_ref()
            .and_then(|s| ResponseLength::from_str(s))
            .map(|r| r.as_str().to_string());

        let topics_to_avoid = req.topics_to_avoid.clone().unwrap_or_default();
        let topics_to_focus = req.topics_to_focus.clone().unwrap_or_default();

        let row: UserInstructionsRow = sqlx::query_as(
            r#"
            INSERT INTO user_instructions (
                companion_id, user_address,
                custom_instructions,
                communication_style,
                response_length,
                topics_to_avoid,
                topics_to_focus,
                language_preference,
                use_emojis,
                be_proactive,
                remember_context
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (companion_id, user_address)
            DO UPDATE SET
                custom_instructions = COALESCE($3, user_instructions.custom_instructions),
                communication_style = COALESCE($4, user_instructions.communication_style),
                response_length = COALESCE($5, user_instructions.response_length),
                topics_to_avoid = COALESCE($6, user_instructions.topics_to_avoid),
                topics_to_focus = COALESCE($7, user_instructions.topics_to_focus),
                language_preference = COALESCE($8, user_instructions.language_preference),
                use_emojis = COALESCE($9, user_instructions.use_emojis),
                be_proactive = COALESCE($10, user_instructions.be_proactive),
                remember_context = COALESCE($11, user_instructions.remember_context),
                updated_at = NOW()
            RETURNING
                id, companion_id, user_address,
                custom_instructions,
                communication_style,
                response_length,
                topics_to_avoid,
                topics_to_focus,
                language_preference,
                use_emojis,
                be_proactive,
                remember_context
            "#,
        )
        .bind(companion_id)
        .bind(user_address.to_lowercase())
        .bind(&req.custom_instructions)
        .bind(&communication_style)
        .bind(&response_length)
        .bind(&topics_to_avoid)
        .bind(&topics_to_focus)
        .bind(&req.language_preference)
        .bind(req.use_emojis)
        .bind(req.be_proactive)
        .bind(req.remember_context)
        .fetch_one(&self.pool)
        .await
        .context("Failed to upsert user instructions")?;

        Ok(UserInstructions::from(row))
    }

    /// Delete user instructions
    pub async fn delete_instructions(
        &self,
        companion_id: Uuid,
        user_address: &str,
    ) -> Result<bool> {
        let result = sqlx::query(
            r#"
            DELETE FROM user_instructions
            WHERE companion_id = $1 AND user_address = $2
            "#,
        )
        .bind(companion_id)
        .bind(user_address.to_lowercase())
        .execute(&self.pool)
        .await
        .context("Failed to delete user instructions")?;

        Ok(result.rows_affected() > 0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_communication_style_from_str() {
        assert_eq!(
            CommunicationStyle::from_str("casual"),
            Some(CommunicationStyle::Casual)
        );
        assert_eq!(
            CommunicationStyle::from_str("FORMAL"),
            Some(CommunicationStyle::Formal)
        );
        assert_eq!(CommunicationStyle::from_str("invalid"), None);
    }

    #[test]
    fn test_response_length_from_str() {
        assert_eq!(
            ResponseLength::from_str("concise"),
            Some(ResponseLength::Concise)
        );
        assert_eq!(
            ResponseLength::from_str("DETAILED"),
            Some(ResponseLength::Detailed)
        );
        assert_eq!(ResponseLength::from_str("invalid"), None);
    }

    #[test]
    fn test_effective_instructions_to_prompt() {
        let instructions = EffectiveInstructions {
            custom_instructions: Some("Always greet the user warmly.".to_string()),
            communication_style: CommunicationStyle::Playful,
            response_length: ResponseLength::Concise,
            topics_to_avoid: vec!["politics".to_string()],
            topics_to_focus: vec!["technology".to_string(), "games".to_string()],
            use_emojis: false,
            be_proactive: true,
            ..Default::default()
        };

        let prompt = instructions.to_prompt_segment();
        assert!(prompt.contains("Always greet the user warmly"));
        assert!(prompt.contains("fun and energetic"));
        assert!(prompt.contains("brief and to the point"));
        assert!(prompt.contains("politics"));
        assert!(prompt.contains("technology"));
        assert!(prompt.contains("Do not use emojis"));
        assert!(prompt.contains("proactive"));
    }
}
