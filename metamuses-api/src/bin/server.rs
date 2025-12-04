// API Server Binary
// Implements HTTP/WebSocket server with Axum
// Uses companion chat handler with full memory system

use metamuses_api::{
    api::{
        companion_chat_handlers::{companion_chat_handler, CompanionAppState, CompanionChatMetrics},
        middleware::{add_request_id, cors_layer, request_logger},
    },
    cache::SemanticCache,
    config::Config,
    queue::RedisQueueManager,
    routing::IntelligentRouter,
    services::{CompanionService, InteractionStatsService, MemoryService},
};

use axum::{
    http::StatusCode,
    middleware,
    response::Json,
    routing::{get, post},
    Router,
};
use redis::Client as RedisClient;
use serde_json::json;
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info, warn};

/// Simple health check handler (stateless)
async fn health_handler_simple() -> (StatusCode, Json<serde_json::Value>) {
    (StatusCode::OK, Json(json!({
        "status": "healthy",
        "service": "metamuses-api",
        "version": env!("CARGO_PKG_VERSION")
    })))
}

/// Simple metrics handler (stateless)
async fn metrics_handler_simple() -> (StatusCode, Json<serde_json::Value>) {
    (StatusCode::OK, Json(json!({
        "status": "ok",
        "message": "Metrics endpoint - use Prometheus scraping"
    })))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(true)
        .with_level(true)
        .init();

    info!("╔════════════════════════════════════════╗");
    info!("║   MetaMuses AI Inference API Server   ║");
    info!("║              v{}                 ║", env!("CARGO_PKG_VERSION"));
    info!("╚════════════════════════════════════════╝");

    // Load configuration
    info!("Loading configuration...");
    let config = Config::from_env()?;
    info!("✓ Configuration loaded");

    // Initialize PostgreSQL connection pool
    info!("Connecting to PostgreSQL...");
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;
    info!("✓ PostgreSQL connection established");

    // Run database migrations
    info!("Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;
    info!("✓ Database migrations complete");

    // Initialize Redis client for memory service
    info!("Connecting to Redis at {}...", config.redis_url);
    let redis_client = Arc::new(RedisClient::open(config.redis_url.as_str())?);

    // Test Redis connection
    let mut redis_conn = redis_client.get_multiplexed_async_connection().await?;
    redis::cmd("PING").query_async::<String>(&mut redis_conn).await?;
    info!("✓ Redis connection established");

    // Initialize Redis queue manager (for job queue)
    let queue_manager = RedisQueueManager::new(
        &config.redis_url,
        config.redis_queue_prefix.clone(),
    )
    .await?;
    info!("✓ Redis queue manager initialized");

    // Initialize semantic cache (optional - continues without if Qdrant unavailable)
    info!("Initializing semantic cache...");
    let cache = if config.enable_semantic_cache {
        match SemanticCache::new(
            &config.qdrant_url,
            "metamuse_cache".to_string(),
            config.cache_similarity_threshold,
            config.cache_ttl_hours,
        )
        .await
        {
            Ok(c) => {
                info!("✓ Semantic cache initialized");
                Some(c)
            }
            Err(e) => {
                warn!("⚠ Semantic cache unavailable: {}", e);
                warn!("  Continuing without semantic cache (memory system still works)");
                None
            }
        }
    } else {
        info!("⏭ Semantic cache disabled (ENABLE_SEMANTIC_CACHE=false)");
        None
    };

    // Create intelligent router
    info!("Creating intelligent router...");
    let router = Arc::new(IntelligentRouter::new(
        cache.map(Arc::new),
        Arc::new(RwLock::new(queue_manager)),
    ));
    info!("✓ Intelligent router created");

    // Initialize services
    info!("Initializing companion services...");

    // Memory service (Redis + PostgreSQL)
    let memory_service = Arc::new(MemoryService::new(
        redis_client.clone(),
        pool.clone(),
    ));
    info!("✓ Memory service initialized (Redis short-term + PostgreSQL long-term)");

    // Companion service (NFT verification + DB)
    let companion_service = match CompanionService::new(
        pool.clone(),
        &config.rpc_url,
        &config.contract_address,
    ) {
        Ok(s) => {
            info!("✓ Companion service initialized");
            Arc::new(s)
        }
        Err(e) => {
            error!("Failed to initialize companion service: {}", e);
            return Err(e);
        }
    };

    // Interaction stats service
    let interaction_stats_service = Arc::new(InteractionStatsService::new(pool.clone()));
    info!("✓ Interaction stats service initialized");

    // Create companion app state (for all handlers)
    let app_state = CompanionAppState {
        router: router.clone(),
        companion_service,
        memory_service,
        interaction_stats_service,
        start_time: std::time::Instant::now(),
        metrics: Arc::new(RwLock::new(CompanionChatMetrics::default())),
    };

    info!("Building API routes...");

    // Build the router with companion chat handler
    let app = Router::new()
        // Health check endpoint
        .route("/health", get(health_handler_simple))
        // Metrics endpoint
        .route("/metrics", get(metrics_handler_simple))
        // Companion chat endpoint with memory system
        .route("/chat", post(companion_chat_handler))
        .with_state(app_state)
        // Add middleware
        .layer(middleware::from_fn(request_logger))
        .layer(middleware::from_fn(add_request_id))
        .layer(cors_layer());

    info!("✓ Routes configured");

    // Determine bind address
    let host = std::env::var("HOST").unwrap_or_else(|_| config.host.clone());
    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(config.port);

    let addr = format!("{}:{}", host, port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    info!("");
    info!("🚀 Server running on http://{}", addr);
    info!("");
    info!("Available endpoints:");
    info!("  • GET  /health      - Health check");
    info!("  • GET  /metrics     - System metrics");
    info!("  • POST /chat        - Chat with AI companion (with memory)");
    info!("  • GET  /ws          - WebSocket streaming");
    info!("");
    info!("Memory System:");
    info!("  • Short-term: Redis (last 20 messages, 24h TTL)");
    info!("  • Long-term:  PostgreSQL (permanent storage)");
    info!("");
    info!("⚡ Ready to accept connections!");

    // Start the server
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    info!("Server shutdown complete");

    Ok(())
}

// Graceful shutdown handler
async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("Failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
            info!("Received Ctrl+C signal");
        },
        _ = terminate => {
            info!("Received terminate signal");
        },
    }

    info!("Shutting down gracefully...");
}
