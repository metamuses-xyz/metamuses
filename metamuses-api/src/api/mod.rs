// API Layer Module
// Handles HTTP/WebSocket endpoints, middleware, and request/response processing

pub mod companion_handlers;
pub mod handlers;
pub mod middleware;
pub mod types;
pub mod websocket;

pub use companion_handlers::*;
pub use handlers::*;
pub use middleware::*;
pub use types::*;
