// API Server Binary
// Implements HTTP/WebSocket server with Axum

use metamuses_api::{
    api::{
        handlers::{chat_handler, health_handler, metrics_handler, AppState, RequestMetrics},
        middleware::{add_request_id, cors_layer, request_logger},
        websocket::ws_handler,
    },
    cache::SemanticCache,
    config::Config,
    queue::RedisQueueManager,
    routing::IntelligentRouter,
};

use axum::{
    middleware,
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;

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
    info!("Configuration loaded successfully");

    // Initialize Redis queue manager
    info!("Connecting to Redis at {}...", config.redis_url);
    let queue_manager = RedisQueueManager::new(
        &config.redis_url,
        config.redis_queue_prefix.clone(),
    )
    .await?;
    info!("✓ Redis connection established");

    // Initialize semantic cache
    info!("Initializing semantic cache...");
    let cache = SemanticCache::new(
        &config.qdrant_url,
        "metamuse_cache".to_string(),
        config.cache_similarity_threshold,
        config.cache_ttl_hours,
    )
    .await?;
    info!("✓ Semantic cache initialized (STUB MODE)");

    // Create intelligent router
    info!("Creating intelligent router...");
    let router = Arc::new(IntelligentRouter::new(
        Arc::new(cache),
        Arc::new(RwLock::new(queue_manager)),
    ));
    info!("✓ Intelligent router created");

    // Create application state
    let app_state = AppState {
        router,
        start_time: std::time::Instant::now(),
        metrics: Arc::new(RwLock::new(RequestMetrics::default())),
    };

    info!("Building API routes...");
    // Build the router
    let app = Router::new()
        // Health check endpoint
        .route("/health", get(health_handler))
        // Metrics endpoint
        .route("/metrics", get(metrics_handler))
        // Chat endpoint (HTTP POST)
        .route("/chat", post(chat_handler))
        // WebSocket endpoint for streaming
        .route("/ws", get(ws_handler))
        // Add middleware
        .layer(middleware::from_fn(request_logger))
        .layer(middleware::from_fn(add_request_id))
        .layer(cors_layer())
        // Add application state
        .with_state(app_state);

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
    info!("  • POST /chat        - Submit chat request");
    info!("  • GET  /ws          - WebSocket streaming");
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
