pub mod companion;
pub mod memory;
pub mod personality;
pub mod traits_gen;

pub use companion::CompanionService;
pub use memory::{ConversationContext, ConversationStats, MemoryService};
pub use personality::{PersonalityEngine, PersonalitySummary};
pub use traits_gen::{generate_companion_name, generate_traits_from_token_id};
