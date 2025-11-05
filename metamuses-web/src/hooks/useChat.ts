// useChat Hook
// React hook for managing chat state and API communication

import { useState, useCallback, useRef, useEffect } from "react";
import { apiClient, ChatRequest, ChatResponse, ChatMessage, WsMessage } from "@/lib/api-client";

export interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  metadata?: {
    model_name?: string;
    tier?: string;
    latency_ms?: number;
    from_cache?: boolean;
  };
}

export interface UseChatOptions {
  museId: number;
  userAddress: string;
  stream?: boolean;
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { museId, userAddress, stream = false, onError } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);
  const streamingMessageRef = useRef<string>("");

  // Initialize WebSocket for streaming
  useEffect(() => {
    if (!stream) return;

    const ws = apiClient.createWebSocket(
      handleWebSocketMessage,
      handleWebSocketError,
      handleWebSocketClose
    );

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [stream]);

  const handleWebSocketMessage = useCallback((message: WsMessage) => {
    if (message.type === "chunk") {
      // Accumulate streaming content
      streamingMessageRef.current += message.content;

      if (message.is_final) {
        // Finalize the message
        const aiMessage: Message = {
          id: message.request_id,
          content: streamingMessageRef.current.trim(),
          sender: "ai",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        streamingMessageRef.current = "";
        currentRequestIdRef.current = null;
        setIsLoading(false);
      } else {
        // Update the streaming message in real-time
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.id === message.request_id) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                content: streamingMessageRef.current.trim(),
              },
            ];
          } else {
            // First chunk - create placeholder message
            return [
              ...prev,
              {
                id: message.request_id,
                content: streamingMessageRef.current.trim(),
                sender: "ai" as const,
                timestamp: new Date(),
              },
            ];
          }
        });
      }
    } else if (message.type === "metadata") {
      // Update metadata for the message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.request_id
            ? {
                ...msg,
                metadata: {
                  model_name: message.model_name,
                  tier: message.tier,
                  latency_ms: message.latency_ms,
                },
              }
            : msg
        )
      );
    } else if (message.type === "error") {
      const err = new Error(message.message);
      setError(err);
      setIsLoading(false);
      onError?.(err);
    }
  }, [onError]);

  const handleWebSocketError = useCallback((event: Event) => {
    const err = new Error("WebSocket connection error");
    setError(err);
    setIsLoading(false);
    onError?.(err);
  }, [onError]);

  const handleWebSocketClose = useCallback(() => {
    setIsLoading(false);
  }, []);

  const buildContext = useCallback((): ChatMessage[] => {
    // Build context from last 5 messages
    return messages.slice(-5).map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.content,
      timestamp: msg.timestamp.getTime(),
    }));
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);
      setLastUserMessage(content);

      // Add user message to UI
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      const request: ChatRequest = {
        user_address: userAddress,
        muse_id: museId,
        query: content,
        context: buildContext(),
        priority: "Normal",
        stream,
      };

      try {
        if (stream && wsRef.current) {
          // Use WebSocket for streaming
          currentRequestIdRef.current = `ws-${Date.now()}`;
          streamingMessageRef.current = "";
          apiClient.sendWebSocketMessage(wsRef.current, request);
        } else {
          // Use HTTP for non-streaming
          const response: ChatResponse = await apiClient.sendMessage(request);

          const aiMessage: Message = {
            id: response.request_id,
            content: response.response,
            sender: "ai",
            timestamp: new Date(),
            metadata: {
              model_name: response.model_name,
              tier: response.tier,
              latency_ms: response.latency_ms,
              from_cache: response.from_cache,
            },
          };

          setMessages((prev) => [...prev, aiMessage]);
          setIsLoading(false);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to send message");
        setError(error);
        setIsLoading(false);
        onError?.(error);

        // Remove the failed user message
        setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
      }
    },
    [isLoading, userAddress, museId, stream, buildContext, onError]
  );

  const retryLastMessage = useCallback(async () => {
    if (lastUserMessage) {
      await sendMessage(lastUserMessage);
    }
  }, [lastUserMessage, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastUserMessage("");
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
  };
}
