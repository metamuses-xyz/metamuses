pub mod companion;
pub mod fact_extractor;
pub mod instructions;
pub mod interaction_stats;
pub mod memory;
pub mod personality;
pub mod personality_builder;
pub mod semantic_memory;
pub mod traits_gen;

pub use companion::CompanionService;
pub use fact_extractor::{ExtractedFact, FactExtractor};
pub use instructions::{
    CommunicationStyle, EffectiveInstructions, InstructionService, ResponseLength,
    UpdateInstructionsRequest, UserInstructions,
};
pub use interaction_stats::{
    InteractionPercentages, InteractionStatsRow, InteractionStatsService, InteractionSummary,
};
pub use memory::{ConsolidationResult, ConversationContext, ConversationStats, MemoryService};
pub use personality::{InteractionStats, PersonalityEngine, PersonalitySummary, TraitAdjustments};
pub use personality_builder::{build_context_with_personality, build_personality_prompt};
pub use semantic_memory::{ScoredMessage, SemanticMemoryService};
pub use traits_gen::{generate_companion_name, generate_traits_from_token_id};
