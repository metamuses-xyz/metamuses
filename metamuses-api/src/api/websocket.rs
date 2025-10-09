// WebSocket Handler for Streaming Responses

use super::handlers::AppState;
use super::types::*;
use crate::types::InferenceRequest;
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
};
use futures::{sink::SinkExt, stream::StreamExt};
use tracing::{error, info, warn};
use uuid::Uuid;

// ============================================================================
// WebSocket Handler
// ============================================================================

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();

    info!("WebSocket connection established");

    while let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                // Parse incoming chat request
                let chat_req: ChatRequest = match serde_json::from_str(&text) {
                    Ok(req) => req,
                    Err(e) => {
                        error!("Failed to parse WebSocket message: {}", e);
                        let error_msg = WsMessage::Error {
                            request_id: Uuid::new_v4(),
                            error: "parse_error".to_string(),
                            message: format!("Invalid JSON: {}", e),
                        };

                        if let Ok(json) = serde_json::to_string(&error_msg) {
                            let _ = sender.send(Message::Text(json.into())).await;
                        }
                        continue;
                    }
                };

                // Validate request
                if chat_req.query.trim().is_empty() {
                    let error_msg = WsMessage::Error {
                        request_id: Uuid::new_v4(),
                        error: "bad_request".to_string(),
                        message: "Query cannot be empty".to_string(),
                    };

                    if let Ok(json) = serde_json::to_string(&error_msg) {
                        let _ = sender.send(Message::Text(json.into())).await;
                    }
                    continue;
                }

                // Create inference request
                let request_id = Uuid::new_v4();
                let inference_req = InferenceRequest {
                    id: request_id,
                    user_address: chat_req.user_address.clone(),
                    muse_id: chat_req.muse_id,
                    user_query: chat_req.query.clone(),
                    context: chat_req.context.clone(),
                    priority: chat_req.priority,
                    personality_traits: None,
                    created_at: chrono::Utc::now().timestamp(),
                };

                info!("Processing WebSocket request: {}", request_id);

                // Route and execute (non-streaming for now)
                // TODO: Implement true streaming inference
                match state.router.route_and_execute(inference_req).await {
                    Ok(result) => {
                        // Send response in chunks (simulated streaming)
                        let words: Vec<&str> = result.content.split_whitespace().collect();
                        let chunk_size = 5; // words per chunk

                        for (i, chunk) in words.chunks(chunk_size).enumerate() {
                            let is_final = i == (words.len() / chunk_size);
                            let content = chunk.join(" ") + " ";

                            let chunk_msg = WsMessage::Chunk {
                                request_id,
                                content,
                                is_final,
                            };

                            if let Ok(json) = serde_json::to_string(&chunk_msg) {
                                if sender.send(Message::Text(json.into())).await.is_err() {
                                    warn!("Failed to send chunk, client disconnected");
                                    return;
                                }
                            }

                            // Small delay to simulate streaming
                            tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
                        }

                        // Send metadata
                        let metadata_msg = WsMessage::Metadata {
                            request_id,
                            model_name: result.model_name,
                            tier: result.tier.as_str().to_string(),
                            latency_ms: result.latency_ms,
                        };

                        if let Ok(json) = serde_json::to_string(&metadata_msg) {
                            let _ = sender.send(Message::Text(json.into())).await;
                        }

                        info!("WebSocket request {} completed", request_id);
                    }
                    Err(e) => {
                        error!("Inference failed for WebSocket request: {}", e);
                        let error_msg = WsMessage::Error {
                            request_id,
                            error: "inference_error".to_string(),
                            message: format!("Inference failed: {}", e),
                        };

                        if let Ok(json) = serde_json::to_string(&error_msg) {
                            let _ = sender.send(Message::Text(json.into())).await;
                        }
                    }
                }
            }

            Ok(Message::Close(_)) => {
                info!("WebSocket connection closed by client");
                break;
            }

            Ok(Message::Ping(data)) => {
                if sender.send(Message::Pong(data)).await.is_err() {
                    break;
                }
            }

            Ok(Message::Pong(_)) => {
                // Ignore pong messages
            }

            Ok(Message::Binary(_)) => {
                warn!("Received binary message, ignoring");
            }

            Err(e) => {
                error!("WebSocket error: {}", e);
                break;
            }
        }
    }

    info!("WebSocket connection closed");
}
