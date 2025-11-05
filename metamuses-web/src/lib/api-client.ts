// MetaMuses API Client
// Type-safe client for interacting with the Rust backend API

export interface ChatMessage {
  role: string;
  content: string;
  timestamp: number;
}

export type Priority = "Low" | "Normal" | "High" | "Critical";

export interface ChatRequest {
  user_address: string;
  muse_id: number;
  query: string;
  context?: ChatMessage[];
  priority?: Priority;
  stream?: boolean;
}

export interface ChatResponse {
  request_id: string;
  response: string;
  model_name: string;
  tier: string;
  latency_ms: number;
  from_cache: boolean;
  tokens_generated?: number;
  cost_tmetis?: number;
}

export interface HealthResponse {
  status: string;
  version: string;
  uptime_secs: number;
  queue_depth: {
    fast: number;
    medium: number;
    heavy: number;
    total: number;
  };
}

export interface MetricsResponse {
  total_requests: number;
  requests_per_tier: {
    fast: number;
    medium: number;
    heavy: number;
    specialized: number;
  };
  cache_hit_rate: number;
  avg_latency_ms: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  request_id?: string;
  details?: string;
}

// WebSocket message types
export type WsMessage =
  | {
      type: "chunk";
      request_id: string;
      content: string;
      is_final: boolean;
    }
  | {
      type: "error";
      request_id: string;
      error: string;
      message: string;
    }
  | {
      type: "metadata";
      request_id: string;
      model_name: string;
      tier: string;
      latency_ms: number;
    };

class APIClient {
  private baseUrl: string;
  private wsUrl: string;

  constructor(baseUrl?: string) {
    // Default to localhost:8080 if not specified
    this.baseUrl =
      baseUrl ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8080";

    // Convert HTTP URL to WebSocket URL
    this.wsUrl = this.baseUrl.replace(/^http/, "ws");
  }

  /**
   * Send a chat message (HTTP POST)
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.message || "Failed to send message");
    }

    return response.json();
  }

  /**
   * Create a WebSocket connection for streaming responses
   */
  createWebSocket(
    onMessage: (message: WsMessage) => void,
    onError?: (error: Event) => void,
    onClose?: () => void
  ): WebSocket {
    const ws = new WebSocket(`${this.wsUrl}/ws`);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const message: WsMessage = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      onError?.(error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      onClose?.();
    };

    return ws;
  }

  /**
   * Send a message via WebSocket
   */
  sendWebSocketMessage(ws: WebSocket, request: ChatRequest): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(request));
    } else {
      throw new Error("WebSocket is not connected");
    }
  }

  /**
   * Health check endpoint
   */
  async getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);

    if (!response.ok) {
      throw new Error("Health check failed");
    }

    return response.json();
  }

  /**
   * Get system metrics
   */
  async getMetrics(): Promise<MetricsResponse> {
    const response = await fetch(`${this.baseUrl}/metrics`);

    if (!response.ok) {
      throw new Error("Failed to fetch metrics");
    }

    return response.json();
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export class for custom instances
export default APIClient;
