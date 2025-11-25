use crate::models::{Fact, FactCategory, Message};
use anyhow::Result;
use regex::Regex;
use std::collections::HashMap;
use uuid::Uuid;

/// Fact extractor for parsing conversations and extracting important information
pub struct FactExtractor {
    patterns: HashMap<String, Vec<Pattern>>,
}

#[derive(Clone)]
struct Pattern {
    regex: Regex,
    category: FactCategory,
    confidence: f32,
}

impl FactExtractor {
    /// Create a new FactExtractor with predefined patterns
    pub fn new() -> Self {
        let mut patterns = HashMap::new();

        // Preference patterns
        patterns.insert(
            "preference".to_string(),
            vec![
                Pattern {
                    regex: Regex::new(r"(?i)\b(?:i (?:like|love|enjoy|prefer)|my favorite)\b(.+)")
                        .unwrap(),
                    category: FactCategory::Preference,
                    confidence: 0.9,
                },
                Pattern {
                    regex: Regex::new(r"(?i)\b(?:i (?:hate|dislike|don't like))\b(.+)").unwrap(),
                    category: FactCategory::Preference,
                    confidence: 0.9,
                },
            ],
        );

        // Personal information patterns
        patterns.insert(
            "personal".to_string(),
            vec![
                Pattern {
                    regex: Regex::new(r"(?i)\b(?:my name is|i'm|i am|call me)\s+(\w+)").unwrap(),
                    category: FactCategory::Personal,
                    confidence: 0.95,
                },
                Pattern {
                    regex: Regex::new(r"(?i)\b(?:i (?:work|study|live)) (?:as|at|in)\b(.+)")
                        .unwrap(),
                    category: FactCategory::Personal,
                    confidence: 0.85,
                },
                Pattern {
                    regex: Regex::new(r"(?i)\bi am (\d+) years old").unwrap(),
                    category: FactCategory::Personal,
                    confidence: 0.95,
                },
            ],
        );

        // Goal patterns
        patterns.insert(
            "goal".to_string(),
            vec![
                Pattern {
                    regex: Regex::new(
                        r"(?i)\b(?:i want to|i'd like to|my goal is to|i hope to)\b(.+)",
                    )
                    .unwrap(),
                    category: FactCategory::Goal,
                    confidence: 0.85,
                },
                Pattern {
                    regex: Regex::new(r"(?i)\b(?:i'm (?:trying to|working on|planning to))\b(.+)")
                        .unwrap(),
                    category: FactCategory::Goal,
                    confidence: 0.8,
                },
            ],
        );

        // Historical patterns
        patterns.insert(
            "history".to_string(),
            vec![
                Pattern {
                    regex: Regex::new(r"(?i)\b(?:i used to|i previously|in the past|i once)\b(.+)")
                        .unwrap(),
                    category: FactCategory::History,
                    confidence: 0.8,
                },
                Pattern {
                    regex: Regex::new(r"(?i)\b(?:last|yesterday|ago)\b(.+)").unwrap(),
                    category: FactCategory::History,
                    confidence: 0.7,
                },
            ],
        );

        Self { patterns }
    }

    /// Extract facts from a message
    pub fn extract_from_message(&self, message: &Message) -> Vec<ExtractedFact> {
        // Only extract from user messages
        if message.role != "user" {
            return Vec::new();
        }

        let mut facts = Vec::new();

        // Try all pattern categories
        for (_, pattern_list) in &self.patterns {
            for pattern in pattern_list {
                if let Some(captures) = pattern.regex.captures(&message.content) {
                    if let Some(matched) = captures.get(1) {
                        let fact_text = matched.as_str().trim().to_string();

                        // Skip very short matches
                        if fact_text.len() < 3 {
                            continue;
                        }

                        facts.push(ExtractedFact {
                            category: pattern.category.clone(),
                            fact_text,
                            confidence: pattern.confidence,
                            source_message_id: Some(message.id),
                        });
                    }
                }
            }
        }

        facts
    }

    /// Extract facts from a conversation
    pub fn extract_from_conversation(&self, messages: &[Message]) -> Vec<ExtractedFact> {
        let mut all_facts = Vec::new();

        for message in messages {
            let facts = self.extract_from_message(message);
            all_facts.extend(facts);
        }

        // Deduplicate similar facts
        self.deduplicate_facts(all_facts)
    }

    /// Deduplicate similar facts
    fn deduplicate_facts(&self, facts: Vec<ExtractedFact>) -> Vec<ExtractedFact> {
        let mut unique_facts = Vec::new();

        for fact in facts {
            let is_duplicate = unique_facts.iter().any(|existing: &ExtractedFact| {
                existing.category == fact.category
                    && self.similarity(&existing.fact_text, &fact.fact_text) > 0.8
            });

            if !is_duplicate {
                unique_facts.push(fact);
            }
        }

        unique_facts
    }

    /// Calculate simple text similarity (Jaccard similarity on words)
    fn similarity(&self, text1: &str, text2: &str) -> f32 {
        let text1_lower = text1.to_lowercase();
        let text2_lower = text2.to_lowercase();

        let words1: std::collections::HashSet<_> = text1_lower.split_whitespace().collect();

        let words2: std::collections::HashSet<_> = text2_lower.split_whitespace().collect();

        let intersection = words1.intersection(&words2).count();
        let union = words1.union(&words2).count();

        if union == 0 {
            0.0
        } else {
            intersection as f32 / union as f32
        }
    }

    /// Convert extracted fact to database fact
    pub fn to_fact(
        &self,
        extracted: &ExtractedFact,
        companion_id: Uuid,
        user_address: &str,
    ) -> Fact {
        Fact::new(
            companion_id,
            user_address.to_string(),
            Some(extracted.category.to_string()),
            extracted.fact_text.clone(),
            extracted.confidence,
            extracted.source_message_id,
        )
    }
}

impl Default for FactExtractor {
    fn default() -> Self {
        Self::new()
    }
}

/// Extracted fact before database storage
#[derive(Debug, Clone)]
pub struct ExtractedFact {
    pub category: FactCategory,
    pub fact_text: String,
    pub confidence: f32,
    pub source_message_id: Option<Uuid>,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_message(content: &str) -> Message {
        Message::user(Uuid::new_v4(), "0xtest".to_string(), content.to_string())
    }

    #[test]
    fn test_extract_preference() {
        let extractor = FactExtractor::new();
        let message = create_test_message("I love pizza and pasta");

        let facts = extractor.extract_from_message(&message);
        assert!(!facts.is_empty());
        assert_eq!(facts[0].category, FactCategory::Preference);
        assert!(facts[0].fact_text.contains("pizza"));
    }

    #[test]
    fn test_extract_personal_info() {
        let extractor = FactExtractor::new();
        let message = create_test_message("My name is Alice");

        let facts = extractor.extract_from_message(&message);
        assert!(!facts.is_empty());
        assert_eq!(facts[0].category, FactCategory::Personal);
        assert!(facts[0].fact_text.contains("Alice"));
    }

    #[test]
    fn test_extract_goal() {
        let extractor = FactExtractor::new();
        let message = create_test_message("I want to learn Rust programming");

        let facts = extractor.extract_from_message(&message);
        assert!(!facts.is_empty());
        assert_eq!(facts[0].category, FactCategory::Goal);
        assert!(facts[0].fact_text.to_lowercase().contains("rust"));
    }

    #[test]
    fn test_extract_history() {
        let extractor = FactExtractor::new();
        let message = create_test_message("I used to work in San Francisco");

        let facts = extractor.extract_from_message(&message);
        assert!(!facts.is_empty());
        assert_eq!(facts[0].category, FactCategory::History);
    }

    #[test]
    fn test_no_facts_from_assistant() {
        let extractor = FactExtractor::new();
        let mut message = create_test_message("I love helping people");
        message.role = "assistant".to_string();

        let facts = extractor.extract_from_message(&message);
        assert!(facts.is_empty());
    }

    #[test]
    fn test_deduplication() {
        let extractor = FactExtractor::new();
        let messages = vec![
            create_test_message("I love pizza"),
            create_test_message("I really love pizza and Italian food"),
        ];

        let facts = extractor.extract_from_conversation(&messages);
        // Should deduplicate similar "love pizza" facts
        assert_eq!(facts.len(), 1);
    }

    #[test]
    fn test_similarity() {
        let extractor = FactExtractor::new();

        let sim1 = extractor.similarity("I love pizza", "I love pizza");
        assert!(sim1 > 0.99);

        let sim2 = extractor.similarity("I love pizza", "I love pasta");
        assert!(sim2 > 0.5 && sim2 < 0.9);

        let sim3 = extractor.similarity("I love pizza", "I hate broccoli");
        assert!(sim3 < 0.5);
    }

    #[test]
    fn test_multiple_facts_in_message() {
        let extractor = FactExtractor::new();
        let message = create_test_message(
            "My name is Bob and I love coding. I want to become a senior developer.",
        );

        let facts = extractor.extract_from_message(&message);
        // Should extract: name (personal), love coding (preference), goal (become developer)
        assert!(facts.len() >= 2);
    }
}
