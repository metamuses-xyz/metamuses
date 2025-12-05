// Points System Module
// Implements gamification with tasks, points, streaks, and leaderboards

pub mod tasks;
pub mod repository;
pub mod task_registry;
pub mod points_service;
pub mod leaderboard_service;

// Re-export main types
pub use tasks::{Task, TaskCompletion, TaskConfig, UserPoints};
pub use repository::PointsRepository;
pub use task_registry::TaskRegistry;
pub use points_service::PointsService;
pub use leaderboard_service::{LeaderboardService, LeaderboardEntry};
