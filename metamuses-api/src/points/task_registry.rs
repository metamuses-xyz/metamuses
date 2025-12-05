// Task Registry - Modular Task Management System
// Central registry for all task types

use crate::points::tasks::{DailyCheckInTask, Task};
use std::collections::HashMap;
use std::sync::Arc;
use sqlx::PgPool;

pub struct TaskRegistry {
    tasks: HashMap<String, Arc<dyn Task>>,
}

impl TaskRegistry {
    /// Create a new task registry with all available tasks
    pub fn new(pool: PgPool) -> Self {
        let mut registry = Self {
            tasks: HashMap::new(),
        };

        // Register all task types
        // Daily Check-In: 50 base points, +10 per streak day, max 100 bonus
        registry.register_task(Arc::new(DailyCheckInTask::new(pool.clone(), 50, 10, 100)));

        // Easy to add more tasks here!
        // registry.register_task(Arc::new(ChatDurationTask::new(pool.clone(), 900, 100)));
        // registry.register_task(Arc::new(MessageCountTask::new(pool.clone(), 10, 75)));
        // registry.register_task(Arc::new(NFTMintTask::new(pool.clone(), 500)));

        registry
    }

    /// Register a new task type
    fn register_task(&mut self, task: Arc<dyn Task>) {
        self.tasks.insert(task.task_type().to_string(), task);
    }

    /// Get a task by type
    pub fn get_task(&self, task_type: &str) -> Option<Arc<dyn Task>> {
        self.tasks.get(task_type).cloned()
    }

    /// List all registered task types
    pub fn list_tasks(&self) -> Vec<String> {
        self.tasks.keys().cloned().collect()
    }

    /// Check if a task type exists
    pub fn has_task(&self, task_type: &str) -> bool {
        self.tasks.contains_key(task_type)
    }
}
