// Middleware for CORS, logging, and error handling

use axum::{
    body::Body,
    http::{header, HeaderValue, Method, Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use std::time::Instant;
use tower_http::cors::{Any, CorsLayer};
use tracing::{error, info};

// ============================================================================
// CORS Configuration
// ============================================================================

pub fn cors_layer() -> CorsLayer {
    CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            header::CONTENT_TYPE,
            header::AUTHORIZATION,
            header::ACCEPT,
        ])
        .allow_credentials(false)
}

// ============================================================================
// Request Logging Middleware
// ============================================================================

pub async fn request_logger(
    req: Request<Body>,
    next: Next,
) -> Response {
    let method = req.method().clone();
    let uri = req.uri().clone();
    let start = Instant::now();

    info!("→ {} {}", method, uri);

    let response = next.run(req).await;

    let latency = start.elapsed();
    let status = response.status();

    if status.is_success() {
        info!(
            "← {} {} - {} ({:.2}ms)",
            method,
            uri,
            status,
            latency.as_secs_f64() * 1000.0
        );
    } else {
        error!(
            "← {} {} - {} ({:.2}ms)",
            method,
            uri,
            status,
            latency.as_secs_f64() * 1000.0
        );
    }

    response
}

// ============================================================================
// Request ID Middleware
// ============================================================================

pub async fn add_request_id(
    mut req: Request<Body>,
    next: Next,
) -> Response {
    let request_id = uuid::Uuid::new_v4().to_string();

    // Add request ID to extensions
    req.extensions_mut().insert(request_id.clone());

    let mut response = next.run(req).await;

    // Add request ID to response headers
    if let Ok(header_value) = HeaderValue::from_str(&request_id) {
        response.headers_mut().insert("x-request-id", header_value);
    }

    response
}

// ============================================================================
// Error Handler Middleware
// ============================================================================

pub async fn handle_errors(
    req: Request<Body>,
    next: Next,
) -> Result<Response, AppErrorResponse> {
    let response = next.run(req).await;

    // Check for errors in response
    if response.status().is_server_error() {
        error!("Server error occurred: {}", response.status());
    }

    Ok(response)
}

#[derive(Debug)]
pub struct AppErrorResponse {
    status: StatusCode,
    message: String,
}

impl IntoResponse for AppErrorResponse {
    fn into_response(self) -> Response {
        let body = serde_json::json!({
            "error": self.status.canonical_reason().unwrap_or("Unknown Error"),
            "message": self.message,
        });

        (self.status, axum::Json(body)).into_response()
    }
}

// ============================================================================
// Rate Limiting Middleware (Simple Token Bucket)
// ============================================================================

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct RateLimiter {
    buckets: Arc<Mutex<HashMap<String, TokenBucket>>>,
    requests_per_minute: u32,
}

struct TokenBucket {
    tokens: u32,
    last_refill: Instant,
}

impl RateLimiter {
    pub fn new(requests_per_minute: u32) -> Self {
        Self {
            buckets: Arc::new(Mutex::new(HashMap::new())),
            requests_per_minute,
        }
    }

    pub async fn check(&self, key: &str) -> bool {
        let mut buckets = self.buckets.lock().await;

        let bucket = buckets.entry(key.to_string()).or_insert(TokenBucket {
            tokens: self.requests_per_minute,
            last_refill: Instant::now(),
        });

        // Refill tokens based on time elapsed
        let elapsed = bucket.last_refill.elapsed().as_secs();
        if elapsed > 0 {
            let refill_amount = (elapsed as u32 * self.requests_per_minute / 60).min(self.requests_per_minute);
            bucket.tokens = (bucket.tokens + refill_amount).min(self.requests_per_minute);
            bucket.last_refill = Instant::now();
        }

        // Check if we have tokens available
        if bucket.tokens > 0 {
            bucket.tokens -= 1;
            true
        } else {
            false
        }
    }
}

pub async fn rate_limit_middleware(
    req: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    // TODO: Extract user address from request for per-user rate limiting
    // For now, use a global rate limiter

    // Rate limiter would need to be passed as state
    // This is a simplified version

    Ok(next.run(req).await)
}
