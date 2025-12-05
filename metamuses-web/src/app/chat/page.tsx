"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useChatAPI, checkAPIHealth } from "@/hooks/useChatAPI";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Neural Network Background (reused from mint page)
const NeuralNetwork = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes: Array<{ x: number; y: number; vx: number; vy: number }> = [];
    const nodeCount = 30;

    // Initialize nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
        ctx.fill();

        // Draw connections
        nodes.slice(i + 1).forEach((otherNode) => {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-20"
    />
  );
};

// Message Interface
interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  typing?: boolean;
}

// AI Companion Interface
interface AICompanion {
  id: string;
  name: string;
  avatar: {
    gradient: string;
    initial: string;
    emoji: string;
  };
  personality: {
    creativity: number;
    wisdom: number;
    humor: number;
    empathy: number;
  };
  status: "online" | "thinking" | "offline";
  description: string;
}

// Typing Indicator Component
const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-4">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />

      <div
        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
        style={{ animationDelay: "0.1s" }}
      />

      <div
        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      />
    </div>
    <span className="text-gray-400 text-sm">AI is thinking...</span>
  </div>
);

// Message Component
const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.sender === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 animate-scale-in`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white ml-12"
            : "neural-card text-gray-100 mr-12"
        }`}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        <div
          className={`text-xs mt-2 ${isUser ? "text-purple-200" : "text-gray-400"}`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};

// AI Companion Card
const CompanionCard = ({
  companion,
  isSelected,
  onClick,
}: {
  companion: AICompanion;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={`neural-card rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
      isSelected ? "ring-2 ring-purple-500 bg-purple-500/10" : ""
    }`}
  >
    <div className="flex items-center space-x-3">
      <div
        className={`w-12 h-12 rounded-full bg-gradient-to-br ${companion.avatar.gradient} flex items-center justify-center text-xl font-bold text-white relative`}
      >
        {companion.avatar.emoji}
        <div
          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${
            companion.status === "online"
              ? "bg-green-500"
              : companion.status === "thinking"
                ? "bg-yellow-500 animate-pulse"
                : "bg-gray-500"
          }`}
        />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-white">{companion.name}</h3>
        <p className="text-xs text-gray-400 truncate">
          {companion.description}
        </p>
      </div>
    </div>
  </div>
);

// Suggested Prompts
const SuggestedPrompts = ({
  onPromptClick,
}: {
  onPromptClick: (prompt: string) => void;
}) => {
  const prompts = [
    "Tell me about yourself",
    "What's your favorite topic to discuss?",
    "Can you help me brainstorm ideas?",
    "What's your perspective on creativity?",
    "Share a fun fact with me",
    "How can you assist me today?",
  ];

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">
        💡 Suggested prompts:
      </h3>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(prompt)}
            className="px-3 py-2 text-xs bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 hover:bg-purple-600/20 hover:border-purple-500/50 transition-all duration-200"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function ChatPage() {
  // Real wallet connection
  const { address, isConnected } = useAccount();

  // Real API integration
  const {
    sendMessage,
    isLoading: apiLoading,
    error: apiError,
    lastResponse,
  } = useChatAPI();

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCompanion, setSelectedCompanion] =
    useState<AICompanion | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derived state
  const walletConnected = isConnected;

  // LocalStorage helpers for chat history
  const CHAT_STORAGE_KEY = "metamuses_chat_history";

  const getChatHistory = (companionId: string): Message[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(`${CHAT_STORAGE_KEY}_${companionId}`);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return parsed.map((msg: Message & { timestamp: string }) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    } catch {
      return [];
    }
  };

  const saveChatHistory = (companionId: string, messages: Message[]) => {
    if (typeof window === "undefined") return;
    try {
      // Keep last 100 messages per companion to avoid storage limits
      const toSave = messages.slice(-100);
      localStorage.setItem(
        `${CHAT_STORAGE_KEY}_${companionId}`,
        JSON.stringify(toSave)
      );
    } catch (e) {
      console.warn("Failed to save chat history:", e);
    }
  };

  const clearChatHistory = (companionId: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(`${CHAT_STORAGE_KEY}_${companionId}`);
    } catch (e) {
      console.warn("Failed to clear chat history:", e);
    }
  };

  // Mock AI Companions
  const companions: AICompanion[] = [
    {
      id: "1",
      name: "Luna the Mystic",
      avatar: {
        gradient: "from-purple-500 to-pink-500",
        initial: "L",
        emoji: "🌙",
      },
      personality: { creativity: 95, wisdom: 80, humor: 60, empathy: 90 },
      status: "online",
      description: "Creative soul with mystical wisdom",
    },
    {
      id: "2",
      name: "Sage the Wise",
      avatar: {
        gradient: "from-blue-500 to-cyan-500",
        initial: "S",
        emoji: "🧙‍♂️",
      },
      personality: { creativity: 45, wisdom: 98, humor: 30, empathy: 85 },
      status: "online",
      description: "Ancient wisdom meets modern understanding",
    },
    {
      id: "3",
      name: "Spark the Jester",
      avatar: {
        gradient: "from-orange-500 to-yellow-500",
        initial: "S",
        emoji: "🎭",
      },
      personality: { creativity: 85, wisdom: 40, humor: 98, empathy: 70 },
      status: "thinking",
      description: "Bringing joy and laughter to conversations",
    },
  ];

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await checkAPIHealth();
      setApiHealthy(healthy);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Load chat history when companion changes
  const loadCompanionChat = (companion: AICompanion) => {
    const cachedMessages = getChatHistory(companion.id);
    if (cachedMessages.length > 0) {
      setMessages(cachedMessages);
    } else {
      // Add welcome message for new conversations
      setMessages([
        {
          id: "welcome-" + companion.id,
          content: `Hello! I'm ${companion.name}. ${companion.description}. How can I assist you today?`,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
  };

  useEffect(() => {
    // Auto-select first companion and load its history
    if (companions.length > 0 && !selectedCompanion) {
      const firstCompanion = companions[0];
      setSelectedCompanion(firstCompanion);
      loadCompanionChat(firstCompanion);
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (selectedCompanion && messages.length > 0) {
      saveChatHistory(selectedCompanion.id, messages);
    }
  }, [messages, selectedCompanion]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim();
    if (!content || !selectedCompanion || !address) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Call real API with companion personality
      const aiResponse = await sendMessage(
        content,
        parseInt(selectedCompanion.id), // muse_id
        address, // user's wallet address
        {
          name: selectedCompanion.name,
          description: selectedCompanion.description,
          creativity: selectedCompanion.personality.creativity,
          wisdom: selectedCompanion.personality.wisdom,
          humor: selectedCompanion.personality.humor,
          empathy: selectedCompanion.personality.empathy,
        },
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      // Handle error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again or check if the API server is running.`,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("API Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <NeuralNetwork />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />

        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      </div>

      {/* Navigation */}
      <Header />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 pb-0">
        <div className="grid lg:grid-cols-4 gap-8 h-[calc(100vh-200px)]">
          {/* Sidebar - AI Companions */}
          <div className="lg:col-span-1">
            <div className="neural-card rounded-2xl p-6 h-full">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                🤖 Your AI Companions
              </h2>

              <div className="space-y-4 mb-6">
                {companions.map((companion) => (
                  <CompanionCard
                    key={companion.id}
                    companion={companion}
                    isSelected={selectedCompanion?.id === companion.id}
                    onClick={() => {
                      setSelectedCompanion(companion);
                      loadCompanionChat(companion);
                    }}
                  />
                ))}
              </div>

              {!walletConnected && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                  <div className="text-yellow-400 text-sm mb-2">
                    ⚠️ Wallet Required
                  </div>
                  <p className="text-xs text-gray-400">
                    Connect your wallet to chat with AI companions
                  </p>
                </div>
              )}

              {/* API Health Status */}
              {apiHealthy === false && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
                  <div className="text-red-400 text-sm mb-2 font-semibold">
                    ⚠️ API Unavailable
                  </div>
                  <p className="text-xs text-gray-400">
                    The backend server is not responding. Please ensure the API
                    server and worker are running.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Check TESTING.md for setup instructions.
                  </p>
                </div>
              )}

              {apiHealthy === true && walletConnected && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mt-4">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs font-semibold">
                      ✓ Connected to API
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 overflow-hidden">
            <div className="neural-card rounded-2xl h-full flex flex-col overflow-hidden">
              {/* Chat Header */}
              {selectedCompanion && (
                <div className="p-6 border-b border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-16 h-16 rounded-full bg-gradient-to-br ${selectedCompanion.avatar.gradient} flex items-center justify-center text-2xl font-bold text-white relative`}
                      >
                        {selectedCompanion.avatar.emoji}
                        <div
                          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-800 ${
                            selectedCompanion.status === "online"
                              ? "bg-green-500"
                              : selectedCompanion.status === "thinking"
                                ? "bg-yellow-500 animate-pulse"
                                : "bg-gray-500"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {selectedCompanion.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {selectedCompanion.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          {Object.entries(selectedCompanion.personality).map(
                            ([trait, value]) => (
                              <div
                                key={trait}
                                className="flex items-center space-x-1"
                              >
                                <span className="text-xs text-gray-500 capitalize">
                                  {trait}
                                </span>
                                <div className="w-8 h-1 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                                    style={{ width: `${value}%` }}
                                  />
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Clear Chat Button */}
                    <button
                      onClick={() => {
                        clearChatHistory(selectedCompanion.id);
                        setMessages([
                          {
                            id: "welcome-" + selectedCompanion.id + "-" + Date.now(),
                            content: `Hello! I'm ${selectedCompanion.name}. ${selectedCompanion.description}. How can I assist you today?`,
                            sender: "ai",
                            timestamp: new Date(),
                          },
                        ]);
                      }}
                      className="px-4 py-2 text-sm bg-gray-800/50 border border-gray-600 rounded-lg text-gray-300 hover:bg-red-600/20 hover:border-red-500/50 hover:text-red-400 transition-all duration-200"
                      title="Clear chat history"
                    >
                      Clear Chat
                    </button>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-20 scroll-smooth">
                {/* API Error Display */}
                {apiError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="text-red-400 text-sm font-semibold mb-2">
                      ❌ API Error
                    </div>
                    <p className="text-xs text-gray-400">{apiError}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Make sure the API server and worker are running. See
                      TESTING.md for setup.
                    </p>
                  </div>
                )}

                {!walletConnected ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Connect Your Wallet
                    </h3>
                    <p className="text-gray-400 mb-8">
                      You need to connect your wallet to start chatting with AI
                      companions
                    </p>
                    <div className="flex justify-center">
                      <ConnectButton />
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Start a Conversation
                    </h3>
                    <p className="text-gray-400 mb-8">
                      Select an AI companion and begin your chat!
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              {walletConnected && selectedCompanion && (
                <div className="p-6 border-t border-gray-700/50">
                  {messages.length <= 1 && (
                    <SuggestedPrompts onPromptClick={handleSendMessage} />
                  )}

                  <div className="flex items-end space-x-4">
                    <div className="flex-1">
                      <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Message ${selectedCompanion.name}...`}
                        className="w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                        rows={1}
                        disabled={isTyping}
                      />
                    </div>
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputMessage.trim() || isTyping}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        inputMessage.trim() && !isTyping
                          ? "neural-button text-white hover:scale-105"
                          : "bg-gray-600 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isTyping ? "..." : "Send"}
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 mt-2 text-center">
                    Press Enter to send • Shift + Enter for new line
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
