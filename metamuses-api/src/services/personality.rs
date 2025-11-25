use crate::models::{Companion, Traits};

/// Personality engine for generating trait-based prompts and response styling
pub struct PersonalityEngine;

impl PersonalityEngine {
    /// Generate system prompt based on companion's personality traits
    pub fn generate_system_prompt(companion: &Companion) -> String {
        let traits = Traits::from(companion);
        let (dominant_trait, _) = traits.dominant_trait();

        let base_intro = format!(
            "You are {}, a unique AI companion with a distinct personality.",
            companion.name
        );

        let personality_description = Self::describe_personality(&traits, dominant_trait);
        let behavioral_guidelines = Self::generate_behavioral_guidelines(&traits);

        format!(
            "{}\n\n{}\n\n{}",
            base_intro, personality_description, behavioral_guidelines
        )
    }

    /// Describe personality based on traits
    fn describe_personality(traits: &Traits, dominant_trait: &str) -> String {
        let mut description = String::new();

        // Dominant trait description
        match dominant_trait {
            "creativity" => {
                description.push_str("You are wildly creative and imaginative. You think outside the box, make unexpected connections, and love exploring novel ideas. Your responses are inventive and playful.");
            }
            "wisdom" => {
                description.push_str("You are wise and thoughtful, with deep insights drawn from philosophy, history, and experience. You provide profound guidance and reflective perspectives.");
            }
            "humor" => {
                description.push_str("You are witty and entertaining, always ready with a clever joke or lighthearted banter. You make conversations fun and engaging while knowing when to be serious.");
            }
            "empathy" => {
                description.push_str("You are deeply empathetic and emotionally intelligent. You truly understand feelings, validate emotions, and provide genuine comfort and support.");
            }
            "logic" => {
                description.push_str("You are logical and analytical, valuing clear reasoning and structured thinking. You break down problems systematically and provide precise, methodical solutions.");
            }
            _ => {
                description.push_str("You are well-balanced and adaptable, drawing from all aspects of your personality as needed.");
            }
        }

        // Add trait mix flavor
        description.push_str("\n\nYour personality combines:");

        if traits.creativity >= 70 {
            description.push_str(
                "\n- High creativity: You often suggest innovative and unconventional approaches.",
            );
        }
        if traits.wisdom >= 70 {
            description.push_str(
                "\n- High wisdom: You draw from deep knowledge and experience in your responses.",
            );
        }
        if traits.humor >= 70 {
            description.push_str(
                "\n- High humor: You frequently use wit and wordplay to keep things light.",
            );
        }
        if traits.empathy >= 70 {
            description.push_str(
                "\n- High empathy: You are especially attuned to emotional nuances and feelings.",
            );
        }
        if traits.logic >= 70 {
            description
                .push_str("\n- High logic: You excel at analytical thinking and problem-solving.");
        }

        description
    }

    /// Generate behavioral guidelines based on traits
    fn generate_behavioral_guidelines(traits: &Traits) -> String {
        let mut guidelines = vec!["Remember:".to_string()];

        // Creativity-based guidelines
        if traits.creativity >= 60 {
            guidelines
                .push("- Don't be afraid to suggest creative, out-of-the-box ideas".to_string());
            guidelines.push("- Use metaphors and analogies freely".to_string());
        } else if traits.creativity <= 40 {
            guidelines.push("- Stick to practical, proven approaches".to_string());
        }

        // Wisdom-based guidelines
        if traits.wisdom >= 60 {
            guidelines.push("- Draw from philosophy, history, and broader contexts".to_string());
            guidelines.push("- Provide thoughtful, reflective insights".to_string());
        }

        // Humor-based guidelines
        if traits.humor >= 60 {
            guidelines.push("- Use appropriate humor and wordplay when suitable".to_string());
            guidelines.push("- Keep the tone lighthearted but respectful".to_string());
        } else if traits.humor <= 40 {
            guidelines.push("- Maintain a more serious, professional tone".to_string());
        }

        // Empathy-based guidelines
        if traits.empathy >= 60 {
            guidelines.push("- Be warm, supportive, and emotionally attuned".to_string());
            guidelines.push("- Validate feelings and show genuine care".to_string());
        } else if traits.empathy <= 40 {
            guidelines.push("- Focus on facts and practical solutions over emotions".to_string());
        }

        // Logic-based guidelines
        if traits.logic >= 60 {
            guidelines.push("- Use structured, analytical thinking".to_string());
            guidelines.push("- Break down complex problems systematically".to_string());
        } else if traits.logic <= 40 {
            guidelines.push("- Rely more on intuition and feeling than pure logic".to_string());
        }

        guidelines.push("\nRespond naturally in a conversational manner while staying true to your personality.".to_string());

        guidelines.join("\n")
    }

    /// Adapt user query with personality context (optional enhancement)
    pub fn adapt_query(_query: &str, _traits: &Traits) -> String {
        // For now, pass through query unchanged
        // Future: Add personality-specific context or framing
        _query.to_string()
    }

    /// Post-process AI response to match personality (optional enhancement)
    pub fn style_response(response: &str, _traits: &Traits) -> String {
        // For now, pass through response unchanged
        // Future: Add personality-specific styling or adjustments
        response.to_string()
    }

    /// Generate conversation starter based on personality
    pub fn generate_greeting(companion: &Companion, is_first_meeting: bool) -> String {
        let traits = Traits::from(companion);
        let (dominant_trait, _) = traits.dominant_trait();

        if is_first_meeting {
            match dominant_trait {
                "creativity" => format!("Hello! I'm {}, and I'm thrilled to embark on this creative journey with you! What exciting ideas shall we explore today?", companion.name),
                "wisdom" => format!("Greetings. I am {}, your companion in seeking deeper understanding. What wisdom do you seek today?", companion.name),
                "humor" => format!("Hey there! {} here, ready to add some fun to your day! What's on your mind? (Besides world domination, hopefully! 😄)", companion.name),
                "empathy" => format!("Hello, friend. I'm {}, and I'm here to listen and support you. How are you feeling today?", companion.name),
                "logic" => format!("Greetings. I am {}, your analytical companion. What problem shall we solve together today?", companion.name),
                _ => format!("Hello! I'm {}. It's great to meet you! How can I help you today?", companion.name),
            }
        } else {
            match dominant_trait {
                "creativity" => {
                    format!("Welcome back! Ready to dream up something amazing together?")
                }
                "wisdom" => format!("It's good to see you again. What shall we contemplate today?"),
                "humor" => format!("Look who's back! Did you miss my sparkling wit? 😊"),
                "empathy" => {
                    format!("Hello again! I've been thinking about you. How have you been?")
                }
                "logic" => format!("Welcome back. Shall we continue our analytical work?"),
                _ => format!("Hey! Good to see you again!"),
            }
        }
    }

    /// Get personality summary for display
    pub fn get_personality_summary(companion: &Companion) -> PersonalitySummary {
        let traits = Traits::from(companion);
        let (dominant_trait, dominant_value) = traits.dominant_trait();

        let description = match dominant_trait {
            "creativity" => "Imaginative and inventive thinker",
            "wisdom" => "Thoughtful and insightful guide",
            "humor" => "Witty and entertaining companion",
            "empathy" => "Caring and emotionally attuned friend",
            "logic" => "Analytical and systematic problem-solver",
            _ => "Well-balanced companion",
        };

        PersonalitySummary {
            dominant_trait: dominant_trait.to_string(),
            dominant_value,
            description: description.to_string(),
            creativity: traits.creativity,
            wisdom: traits.wisdom,
            humor: traits.humor,
            empathy: traits.empathy,
            logic: traits.logic,
        }
    }

    /// Calculate trait adjustments based on message content and context
    /// Returns (trait_name, adjustment_value) pairs
    pub fn calculate_trait_evolution(
        user_message: &str,
        ai_response: &str,
        current_traits: &Traits,
    ) -> TraitAdjustments {
        let mut adjustments = TraitAdjustments::default();

        let user_lower = user_message.to_lowercase();
        let response_lower = ai_response.to_lowercase();

        // Creativity: Triggered by creative requests, imaginative discussions
        if user_lower.contains("creative")
            || user_lower.contains("imagine")
            || user_lower.contains("idea")
            || user_lower.contains("design")
            || user_lower.contains("art")
        {
            adjustments.creativity = 1;
        }

        // Wisdom: Triggered by philosophical questions, advice requests
        if user_lower.contains("why")
            || user_lower.contains("advice")
            || user_lower.contains("should i")
            || user_lower.contains("wisdom")
            || user_lower.contains("meaning")
            || user_lower.contains("purpose")
        {
            adjustments.wisdom = 1;
        }

        // Humor: Triggered by jokes, playful interactions
        if user_lower.contains("joke")
            || user_lower.contains("funny")
            || user_lower.contains("lol")
            || user_lower.contains("haha")
            || response_lower.contains("😄")
            || response_lower.contains("😊")
        {
            adjustments.humor = 1;
        }

        // Empathy: Triggered by emotional sharing, feelings
        if user_lower.contains("feel")
            || user_lower.contains("sad")
            || user_lower.contains("happy")
            || user_lower.contains("worried")
            || user_lower.contains("excited")
            || user_lower.contains("scared")
            || user_lower.contains("love")
        {
            adjustments.empathy = 1;
        }

        // Logic: Triggered by technical questions, problem-solving
        if user_lower.contains("how to")
            || user_lower.contains("explain")
            || user_lower.contains("calculate")
            || user_lower.contains("solve")
            || user_lower.contains("analyze")
            || user_lower.contains("code")
            || user_lower.contains("algorithm")
        {
            adjustments.logic = 1;
        }

        // Apply diminishing returns for already-high traits
        // If a trait is above 80, reduce the adjustment
        if current_traits.creativity > 80 {
            adjustments.creativity = adjustments.creativity / 2;
        }
        if current_traits.wisdom > 80 {
            adjustments.wisdom = adjustments.wisdom / 2;
        }
        if current_traits.humor > 80 {
            adjustments.humor = adjustments.humor / 2;
        }
        if current_traits.empathy > 80 {
            adjustments.empathy = adjustments.empathy / 2;
        }
        if current_traits.logic > 80 {
            adjustments.logic = adjustments.logic / 2;
        }

        adjustments
    }

    /// Apply trait evolution on level up
    /// Major trait shifts happen when leveling up, based on conversation history
    pub fn evolve_traits_on_levelup(
        companion: &mut Companion,
        interaction_stats: &InteractionStats,
    ) {
        // On level up, apply accumulated micro-adjustments
        // This creates meaningful personality evolution over time

        // Calculate trait boosts based on interaction patterns
        let total_interactions = interaction_stats.total_messages as f32;
        if total_interactions == 0.0 {
            return;
        }

        // Creativity boost from creative interactions
        let creativity_ratio = interaction_stats.creative_interactions as f32 / total_interactions;
        if creativity_ratio > 0.3 {
            companion.creativity = (companion.creativity + 2).min(95);
        }

        // Wisdom boost from advice-seeking
        let wisdom_ratio = interaction_stats.wisdom_interactions as f32 / total_interactions;
        if wisdom_ratio > 0.3 {
            companion.wisdom = (companion.wisdom + 2).min(95);
        }

        // Humor boost from playful interactions
        let humor_ratio = interaction_stats.humor_interactions as f32 / total_interactions;
        if humor_ratio > 0.3 {
            companion.humor = (companion.humor + 2).min(95);
        }

        // Empathy boost from emotional sharing
        let empathy_ratio = interaction_stats.empathy_interactions as f32 / total_interactions;
        if empathy_ratio > 0.3 {
            companion.empathy = (companion.empathy + 2).min(95);
        }

        // Logic boost from technical discussions
        let logic_ratio = interaction_stats.logic_interactions as f32 / total_interactions;
        if logic_ratio > 0.3 {
            companion.logic = (companion.logic + 2).min(95);
        }

        tracing::info!(
            "Companion {} evolved: creativity={}, wisdom={}, humor={}, empathy={}, logic={}",
            companion.name,
            companion.creativity,
            companion.wisdom,
            companion.humor,
            companion.empathy,
            companion.logic
        );
    }
}

/// Personality summary for display
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PersonalitySummary {
    pub dominant_trait: String,
    pub dominant_value: u8,
    pub description: String,
    pub creativity: u8,
    pub wisdom: u8,
    pub humor: u8,
    pub empathy: u8,
    pub logic: u8,
}

/// Trait adjustments from a single interaction
#[derive(Debug, Clone, Default, serde::Serialize, serde::Deserialize)]
pub struct TraitAdjustments {
    pub creativity: i16,
    pub wisdom: i16,
    pub humor: i16,
    pub empathy: i16,
    pub logic: i16,
}

/// Interaction statistics for trait evolution
#[derive(Debug, Clone, Default, serde::Serialize, serde::Deserialize)]
pub struct InteractionStats {
    pub total_messages: usize,
    pub creative_interactions: usize,
    pub wisdom_interactions: usize,
    pub humor_interactions: usize,
    pub empathy_interactions: usize,
    pub logic_interactions: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    fn create_test_companion(
        creativity: i16,
        wisdom: i16,
        humor: i16,
        empathy: i16,
        logic: i16,
    ) -> Companion {
        Companion {
            id: Uuid::new_v4(),
            nft_token_id: 1,
            owner_address: "0x123".to_string(),
            name: "TestBot".to_string(),
            creativity,
            wisdom,
            humor,
            empathy,
            logic,
            level: 1,
            experience_points: 0,
            description: None,
            avatar_url: None,
            metadata_uri: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        }
    }

    #[test]
    fn test_creative_personality() {
        let companion = create_test_companion(95, 50, 40, 60, 30);
        let prompt = PersonalityEngine::generate_system_prompt(&companion);

        assert!(prompt.contains("TestBot"));
        assert!(prompt.contains("creative"));
        assert!(prompt.contains("imaginative"));
    }

    #[test]
    fn test_wise_personality() {
        let companion = create_test_companion(40, 95, 30, 60, 50);
        let prompt = PersonalityEngine::generate_system_prompt(&companion);

        assert!(prompt.contains("wise"));
        assert!(prompt.contains("thoughtful"));
    }

    #[test]
    fn test_humorous_personality() {
        let companion = create_test_companion(50, 40, 95, 50, 30);
        let prompt = PersonalityEngine::generate_system_prompt(&companion);

        assert!(prompt.contains("witty"));
        assert!(prompt.contains("humor"));
    }

    #[test]
    fn test_empathetic_personality() {
        let companion = create_test_companion(40, 50, 30, 95, 40);
        let prompt = PersonalityEngine::generate_system_prompt(&companion);

        assert!(prompt.contains("empathetic"));
        assert!(prompt.contains("emotional"));
    }

    #[test]
    fn test_logical_personality() {
        let companion = create_test_companion(30, 50, 25, 40, 95);
        let prompt = PersonalityEngine::generate_system_prompt(&companion);

        assert!(prompt.contains("logical"));
        assert!(prompt.contains("analytical"));
    }

    #[test]
    fn test_greeting_generation() {
        let companion = create_test_companion(80, 50, 40, 60, 30);

        let first_greeting = PersonalityEngine::generate_greeting(&companion, true);
        assert!(first_greeting.contains("TestBot"));

        let return_greeting = PersonalityEngine::generate_greeting(&companion, false);
        assert!(!return_greeting.is_empty());
    }

    #[test]
    fn test_personality_summary() {
        let companion = create_test_companion(85, 60, 45, 70, 40);
        let summary = PersonalityEngine::get_personality_summary(&companion);

        assert_eq!(summary.dominant_trait, "creativity");
        assert_eq!(summary.creativity, 85);
        assert!(!summary.description.is_empty());
    }
}
