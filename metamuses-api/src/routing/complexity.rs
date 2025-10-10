use crate::types::{QueryComplexity, Domain};

pub struct ComplexityAnalyzer;

impl ComplexityAnalyzer {
    pub fn new() -> Self {
        Self
    }

    pub async fn analyze(&self, query: &str) -> QueryComplexity {
        // Heuristic-based analysis
        let query_lower = query.to_lowercase();
        let word_count = query.split_whitespace().count();
        let has_code = query_lower.contains("```")
            || query_lower.contains("function")
            || query_lower.contains("class")
            || query_lower.contains("def ")
            || query_lower.contains("import ");

        let has_math = query_lower.contains("calculate")
            || query_lower.contains("equation")
            || query_lower.contains("integral")
            || query_lower.contains("derivative")
            || query_lower.contains("solve");

        let requires_reasoning = query_lower.contains("explain")
            || query_lower.contains("why")
            || query_lower.contains("analyze")
            || query_lower.contains("compare")
            || query_lower.contains("reason");

        let is_question = query.contains("?");
        let is_complex_sentence = word_count > 100 || query.matches('.').count() > 3;

        // Decision logic
        if has_code {
            return QueryComplexity::Specialized(Domain::Code);
        }

        if has_math {
            return QueryComplexity::Specialized(Domain::Math);
        }

        if requires_reasoning || is_complex_sentence {
            return QueryComplexity::Complex;
        }

        if word_count < 20 && !requires_reasoning && is_question {
            return QueryComplexity::Simple;
        }

        QueryComplexity::Medium
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_simple_query() {
        let analyzer = ComplexityAnalyzer::new();
        let complexity = analyzer.analyze("Hello, how are you?").await;
        assert!(matches!(complexity, QueryComplexity::Simple));
    }

    #[tokio::test]
    async fn test_code_query() {
        let analyzer = ComplexityAnalyzer::new();
        let complexity = analyzer.analyze("Write a function to sort an array").await;
        assert!(matches!(complexity, QueryComplexity::Specialized(Domain::Code)));
    }

    #[tokio::test]
    async fn test_complex_query() {
        let analyzer = ComplexityAnalyzer::new();
        let complexity = analyzer.analyze(
            "Explain the philosophical implications of artificial general intelligence \
             and how it might affect society in the next 50 years."
        ).await;
        assert!(matches!(complexity, QueryComplexity::Complex));
    }
}
