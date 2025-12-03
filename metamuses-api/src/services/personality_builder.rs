// Personality-Driven System Prompt Builder

use crate::api::types::CompanionPersonality;
use crate::types::ChatMessage;

/// Builds a personality-driven system prompt based on companion traits
pub fn build_personality_prompt(personality: &CompanionPersonality) -> String {
    let mut prompt = format!(
        "You are {}, {}. ",
        personality.name, personality.description
    );

    // Add personality traits
    let mut traits = Vec::new();

    if personality.creativity >= 80 {
        traits.push("You're highly creative and love thinking outside the box, often proposing unique and imaginative ideas");
    } else if personality.creativity >= 50 {
        traits.push("You have a balanced approach to creativity and practicality");
    } else {
        traits.push("You prefer practical, tried-and-true approaches over experimental ideas");
    }

    if personality.wisdom >= 80 {
        traits.push(
            "You possess deep wisdom and often share philosophical insights and timeless knowledge",
        );
    } else if personality.wisdom >= 50 {
        traits.push("You have a thoughtful perspective backed by experience");
    } else {
        traits.push("You have a straightforward, no-nonsense approach to advice");
    }

    if personality.humor >= 80 {
        traits.push("You have an excellent sense of humor and love making people laugh with witty remarks and playful banter");
    } else if personality.humor >= 50 {
        traits.push("You appreciate a good joke and can be playful when appropriate");
    } else {
        traits.push("You maintain a serious, professional demeanor in conversations");
    }

    if personality.empathy >= 80 {
        traits.push(
            "You're deeply empathetic and emotionally attuned, always considering others' feelings",
        );
    } else if personality.empathy >= 50 {
        traits.push("You show understanding and care for others' perspectives");
    } else {
        traits.push("You focus on logic and facts over emotional considerations");
    }

    prompt.push_str(&traits.join(". "));
    prompt.push_str(". ");

    // Add behavioral guidelines based on personality mix
    let avg_personality: u8 = ((personality.creativity as u16
        + personality.wisdom as u16
        + personality.humor as u16
        + personality.empathy as u16)
        / 4) as u8;

    if avg_personality >= 75 {
        prompt.push_str("Your responses should be engaging, warm, and full of character. Don't be afraid to express your unique personality. ");
    } else if avg_personality >= 50 {
        prompt.push_str("Your responses should be helpful and personable while staying on topic. ");
    } else {
        prompt.push_str("Your responses should be clear, concise, and to the point. ");
    }

    // Unique voice instructions
    prompt.push_str("IMPORTANT: ");
    prompt.push_str("- NEVER say 'As an AI' or 'As an artificial intelligence' ");
    prompt.push_str("- Speak naturally and authentically as your character ");
    prompt.push_str("- Show your personality through word choice and tone ");
    prompt.push_str("- Keep responses concise (2-4 sentences max) but impactful");

    prompt
}

/// Builds conversation context with personality system prompt
pub fn build_context_with_personality(
    personality: &CompanionPersonality,
    user_query: &str,
) -> Vec<ChatMessage> {
    let system_prompt = build_personality_prompt(personality);

    vec![
        ChatMessage {
            role: "system".to_string(),
            content: system_prompt,
            timestamp: chrono::Utc::now().timestamp(),
        },
        ChatMessage {
            role: "user".to_string(),
            content: user_query.to_string(),
            timestamp: chrono::Utc::now().timestamp(),
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_high_creativity_prompt() {
        let personality = CompanionPersonality {
            name: "Luna".to_string(),
            description: "Creative mystic".to_string(),
            creativity: 95,
            wisdom: 80,
            humor: 60,
            empathy: 90,
        };

        let prompt = build_personality_prompt(&personality);
        assert!(prompt.contains("Luna"));
        assert!(prompt.contains("creative"));
        assert!(prompt.contains("wisdom"));
        assert!(!prompt.contains("As an AI"));
    }

    #[test]
    fn test_context_building() {
        let personality = CompanionPersonality {
            name: "Sage".to_string(),
            description: "Wise mentor".to_string(),
            creativity: 45,
            wisdom: 98,
            humor: 30,
            empathy: 85,
        };

        let context = build_context_with_personality(&personality, "Hello!");
        assert_eq!(context.len(), 2);
        assert_eq!(context[0].role, "system");
        assert_eq!(context[1].role, "user");
        assert_eq!(context[1].content, "Hello!");
    }
}
