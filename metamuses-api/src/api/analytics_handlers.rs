use crate::api::handlers::AppError;
use crate::services::{InteractionStatsService, MemoryService};
use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

/// State for analytics endpoints
#[derive(Clone)]
pub struct AnalyticsState {
    pub memory_service: Arc<MemoryService>,
    pub interaction_stats_service: Arc<InteractionStatsService>,
}

/// Companion analytics response
#[derive(Debug, Serialize, Deserialize)]
pub struct CompanionAnalytics {
    pub total_conversations: usize,
    pub total_messages: usize,
    pub avg_messages_per_conversation: f32,
    pub facts_extracted: usize,
    pub top_categories: Vec<CategoryCount>,
    pub recent_activity: Vec<DailyActivity>,
    pub interaction_breakdown: InteractionBreakdown,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoryCount {
    pub category: String,
    pub count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DailyActivity {
    pub date: String,
    pub messages: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InteractionBreakdown {
    pub creative: usize,
    pub wisdom: usize,
    pub humor: usize,
    pub empathy: usize,
    pub logic: usize,
    pub total: usize,
}

/// Evolution history response
#[derive(Debug, Serialize, Deserialize)]
pub struct EvolutionHistory {
    pub current_level: i32,
    pub current_traits: TraitValues,
    pub evolution_history: Vec<LevelEvolution>,
    pub interaction_stats: Vec<LevelStats>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TraitValues {
    pub creativity: i16,
    pub wisdom: i16,
    pub humor: i16,
    pub empathy: i16,
    pub logic: i16,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LevelEvolution {
    pub level: i32,
    pub changes: Vec<TraitChange>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TraitChange {
    pub trait_name: String,
    pub old_value: i16,
    pub new_value: i16,
    pub change: i16,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LevelStats {
    pub level_range: String,
    pub total_messages: i32,
    pub dominant_interaction: String,
}

/// Facts list response (paginated)
#[derive(Debug, Serialize, Deserialize)]
pub struct FactsList {
    pub facts: Vec<FactItem>,
    pub pagination: PaginationInfo,
    pub categories: CategoryCounts,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct FactItem {
    pub id: Uuid,
    pub category: Option<String>,
    pub content: String,
    pub confidence: f32,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginationInfo {
    pub page: i32,
    pub limit: i32,
    pub total: i64,
    pub total_pages: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoryCounts {
    pub preference: usize,
    pub personal: usize,
    pub history: usize,
    pub goal: usize,
    pub knowledge: usize,
}

/// Query parameters for facts list
#[derive(Debug, Deserialize)]
pub struct FactsQuery {
    #[serde(default = "default_page")]
    pub page: i32,
    #[serde(default = "default_limit")]
    pub limit: i32,
    pub category: Option<String>,
}

fn default_page() -> i32 {
    1
}

fn default_limit() -> i32 {
    20
}

/// GET /api/companions/:id/analytics
pub async fn get_companion_analytics(
    State(state): State<AnalyticsState>,
    Path(companion_id): Path<Uuid>,
) -> Result<Json<CompanionAnalytics>, AppError> {
    // This is a placeholder - will be implemented with real queries
    // For now, return mock data

    // Get interaction summary
    let interaction_summary = state
        .interaction_stats_service
        .get_summary(companion_id, "mock_address")
        .await
        .unwrap_or_default();

    let interaction_breakdown = InteractionBreakdown {
        creative: interaction_summary.creative_interactions as usize,
        wisdom: interaction_summary.wisdom_interactions as usize,
        humor: interaction_summary.humor_interactions as usize,
        empathy: interaction_summary.empathy_interactions as usize,
        logic: interaction_summary.logic_interactions as usize,
        total: interaction_summary.total_messages as usize,
    };

    // Mock data for now - will be replaced with real queries
    let analytics = CompanionAnalytics {
        total_conversations: 0, // TODO: Track conversation sessions
        total_messages: interaction_summary.total_messages as usize,
        avg_messages_per_conversation: 0.0,
        facts_extracted: 0, // TODO: Count from facts table
        top_categories: vec![],
        recent_activity: vec![],
        interaction_breakdown,
    };

    Ok(Json(analytics))
}

/// GET /api/companions/:id/evolution
pub async fn get_evolution_history(
    State(state): State<AnalyticsState>,
    Path(companion_id): Path<Uuid>,
) -> Result<Json<EvolutionHistory>, AppError> {
    // Get all interaction stats for this companion
    let stats = state
        .interaction_stats_service
        .get_all_stats(companion_id, "mock_address")
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to get stats: {}", e)))?;

    let level_stats: Vec<LevelStats> = stats
        .iter()
        .map(|s| {
            let percentages = crate::services::InteractionSummary {
                total_messages: s.total_messages,
                creative_interactions: s.creative_interactions,
                wisdom_interactions: s.wisdom_interactions,
                humor_interactions: s.humor_interactions,
                empathy_interactions: s.empathy_interactions,
                logic_interactions: s.logic_interactions,
            }
            .percentages();

            // Find dominant interaction
            let mut max_pct = 0.0;
            let mut dominant = "balanced".to_string();

            if percentages.creativity > max_pct {
                max_pct = percentages.creativity;
                dominant = "creative".to_string();
            }
            if percentages.wisdom > max_pct {
                max_pct = percentages.wisdom;
                dominant = "wisdom".to_string();
            }
            if percentages.humor > max_pct {
                max_pct = percentages.humor;
                dominant = "humor".to_string();
            }
            if percentages.empathy > max_pct {
                max_pct = percentages.empathy;
                dominant = "empathy".to_string();
            }
            if percentages.logic > max_pct {
                dominant = "logic".to_string();
            }

            LevelStats {
                level_range: s.level_range.clone(),
                total_messages: s.total_messages,
                dominant_interaction: dominant,
            }
        })
        .collect();

    // Mock current traits - will be fetched from companion
    let evolution = EvolutionHistory {
        current_level: 1,
        current_traits: TraitValues {
            creativity: 50,
            wisdom: 50,
            humor: 50,
            empathy: 50,
            logic: 50,
        },
        evolution_history: vec![],
        interaction_stats: level_stats,
    };

    Ok(Json(evolution))
}

/// GET /api/companions/:id/facts
pub async fn get_companion_facts(
    State(state): State<AnalyticsState>,
    Path(companion_id): Path<Uuid>,
    Query(query): Query<FactsQuery>,
) -> Result<Json<FactsList>, AppError> {
    let offset = (query.page - 1) * query.limit;

    // Build query with optional category filter
    let facts_query = if let Some(category) = &query.category {
        sqlx::query_as::<_, FactItem>(
            r#"
            SELECT id, category, fact_text as content, confidence, created_at
            FROM facts
            WHERE companion_id = $1 AND category = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
            "#,
        )
        .bind(companion_id)
        .bind(category)
        .bind(query.limit as i64)
        .bind(offset as i64)
    } else {
        sqlx::query_as::<_, FactItem>(
            r#"
            SELECT id, category, fact_text as content, confidence, created_at
            FROM facts
            WHERE companion_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(companion_id)
        .bind(query.limit as i64)
        .bind(offset as i64)
    };

    let facts = facts_query
        .fetch_all(&state.memory_service.pool)
        .await
        .map_err(|e| AppError::InternalError(format!("Failed to fetch facts: {}", e)))?;

    // Get total count
    let total: i64 = if let Some(category) = &query.category {
        sqlx::query_scalar("SELECT COUNT(*) FROM facts WHERE companion_id = $1 AND category = $2")
            .bind(companion_id)
            .bind(category)
            .fetch_one(&state.memory_service.pool)
            .await
            .unwrap_or(0)
    } else {
        sqlx::query_scalar("SELECT COUNT(*) FROM facts WHERE companion_id = $1")
            .bind(companion_id)
            .fetch_one(&state.memory_service.pool)
            .await
            .unwrap_or(0)
    };

    // Get category counts
    let category_counts: Vec<(Option<String>, i64)> = sqlx::query_as(
        r#"
        SELECT category, COUNT(*) as count
        FROM facts
        WHERE companion_id = $1
        GROUP BY category
        "#,
    )
    .bind(companion_id)
    .fetch_all(&state.memory_service.pool)
    .await
    .unwrap_or_default();

    let mut categories = CategoryCounts {
        preference: 0,
        personal: 0,
        history: 0,
        goal: 0,
        knowledge: 0,
    };

    for (category, count) in category_counts {
        if let Some(cat) = category {
            match cat.as_str() {
                "preference" => categories.preference = count as usize,
                "personal" => categories.personal = count as usize,
                "history" => categories.history = count as usize,
                "goal" => categories.goal = count as usize,
                "knowledge" => categories.knowledge = count as usize,
                _ => {}
            }
        }
    }

    let total_pages = ((total as f64) / (query.limit as f64)).ceil() as i32;

    let response = FactsList {
        facts,
        pagination: PaginationInfo {
            page: query.page,
            limit: query.limit,
            total,
            total_pages,
        },
        categories,
    };

    Ok(Json(response))
}
