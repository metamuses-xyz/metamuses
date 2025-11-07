use crate::models::Traits;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

/// Generate deterministic personality traits from NFT token ID
/// Uses hashing to create unique but reproducible traits (range: 30-90)
pub fn generate_traits_from_token_id(token_id: i64) -> Traits {
    let mut hasher = DefaultHasher::new();
    token_id.hash(&mut hasher);
    let hash = hasher.finish();

    // Use different parts of the hash for each trait (30-90 range for variety)
    Traits {
        creativity: ((hash % 61) + 30) as u8,
        wisdom: (((hash >> 8) % 61) + 30) as u8,
        humor: (((hash >> 16) % 61) + 30) as u8,
        empathy: (((hash >> 24) % 61) + 30) as u8,
        logic: (((hash >> 32) % 61) + 30) as u8,
    }
}

/// Generate a unique companion name from token ID
pub fn generate_companion_name(token_id: i64) -> String {
    let prefixes = vec![
        "Luna", "Sage", "Spark", "Nova", "Echo", "Zen", "Aurora", "Phoenix", "Orion", "Muse",
        "Atlas", "Lyra", "Vega", "Sirius", "Celeste", "Aria", "Kai", "Sol", "Ember", "Frost",
    ];

    let suffixes = vec![
        "the Wise",
        "the Creative",
        "the Bright",
        "the Kind",
        "the Logical",
        "the Mystic",
        "the Thoughtful",
        "the Bold",
        "the Gentle",
        "the Swift",
        "the Curious",
        "the Serene",
        "the Clever",
        "the Witty",
        "the Empathic",
        "the Brave",
    ];

    let prefix_idx = (token_id.abs() % prefixes.len() as i64) as usize;
    let suffix_idx = ((token_id.abs() / 100) % suffixes.len() as i64) as usize;

    format!("{} {}", prefixes[prefix_idx], suffixes[suffix_idx])
}

/// Generate traits with emphasis on a specific trait
pub fn generate_traits_with_emphasis(token_id: i64, emphasis: &str) -> Traits {
    let mut traits = generate_traits_from_token_id(token_id);

    // Boost the emphasized trait by 15 points (capped at 100)
    match emphasis.to_lowercase().as_str() {
        "creativity" => traits.creativity = (traits.creativity + 15).min(100),
        "wisdom" => traits.wisdom = (traits.wisdom + 15).min(100),
        "humor" => traits.humor = (traits.humor + 15).min(100),
        "empathy" => traits.empathy = (traits.empathy + 15).min(100),
        "logic" => traits.logic = (traits.logic + 15).min(100),
        _ => {}
    }

    traits
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_traits_deterministic() {
        let traits1 = generate_traits_from_token_id(42);
        let traits2 = generate_traits_from_token_id(42);

        assert_eq!(traits1, traits2);
        assert!(traits1.validate());
    }

    #[test]
    fn test_generate_traits_different_tokens() {
        let traits1 = generate_traits_from_token_id(1);
        let traits2 = generate_traits_from_token_id(2);

        assert_ne!(traits1, traits2);
    }

    #[test]
    fn test_generate_traits_range() {
        for i in 0..100 {
            let traits = generate_traits_from_token_id(i);

            assert!(traits.creativity >= 30 && traits.creativity <= 90);
            assert!(traits.wisdom >= 30 && traits.wisdom <= 90);
            assert!(traits.humor >= 30 && traits.humor <= 90);
            assert!(traits.empathy >= 30 && traits.empathy <= 90);
            assert!(traits.logic >= 30 && traits.logic <= 90);
        }
    }

    #[test]
    fn test_generate_companion_name() {
        let name1 = generate_companion_name(1);
        let name2 = generate_companion_name(2);

        assert!(!name1.is_empty());
        assert!(!name2.is_empty());

        // Same token ID should give same name
        let name1_again = generate_companion_name(1);
        assert_eq!(name1, name1_again);
    }

    #[test]
    fn test_generate_traits_with_emphasis() {
        let base_traits = generate_traits_from_token_id(42);
        let creativity_traits = generate_traits_with_emphasis(42, "creativity");

        assert!(creativity_traits.creativity >= base_traits.creativity);
        assert!(creativity_traits.creativity <= 100);
    }
}
