"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useChatAPI, checkAPIHealth } from "@/hooks/useChatAPI";
import { useMuseAIContract } from "@/hooks/useMuseAI";
import { useEmotionQueue } from "@/hooks/use-emotion-queue";
import { stripEmotionMarkers } from "@/constants/emotions";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

// Dynamic import for Live2D (SSR disabled)
const Live2DCompanionDisplay = dynamic(
  () =>
    import("@/components/live2d/Live2DCompanionDisplay").then((m) => ({
      default: m.Live2DCompanionDisplay,
    })),
  { ssr: false },
);

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

  // NFT ownership check
  const { useBalance, useTokensOfOwner } = useMuseAIContract();
  const { data: nftBalance } = useBalance(address);
  const { data: ownedTokens } = useTokensOfOwner(address);

  // 🆕 Emotion detection hook
  const { detectAndEnqueue } = useEmotionQueue();

  // Check if user owns any NFTs
  const hasNFT = nftBalance ? Number(nftBalance) > 0 : false;
  const tokenIds = ownedTokens as bigint[] | undefined;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCompanion, setSelectedCompanion] =
    useState<AICompanion | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [showLive2D, setShowLive2D] = useState(true); // Toggle Live2D
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
        JSON.stringify(toSave),
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
    // {
    //   id: "2",
    //   name: "Sage the Wise",
    //   avatar: {
    //     gradient: "from-blue-500 to-cyan-500",
    //     initial: "S",
    //     emoji: "🧙‍♂️",
    //   },
    //   personality: { creativity: 45, wisdom: 98, humor: 30, empathy: 85 },
    //   status: "online",
    //   description: "Ancient wisdom meets modern understanding",
    // },
    // {
    //   id: "3",
    //   name: "Spark the Jester",
    //   avatar: {
    //     gradient: "from-orange-500 to-yellow-500",
    //     initial: "S",
    //     emoji: "🎭",
    //   },
    //   personality: { creativity: 85, wisdom: 40, humor: 98, empathy: 70 },
    //   status: "thinking",
    //   description: "Bringing joy and laughter to conversations",
    // },
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest"
      });
    }
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim();
    if (!content || !selectedCompanion || !address || !hasNFT) return;

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

      // Detect and queue emotions BEFORE stripping markers
      detectAndEnqueue(aiResponse);

      // Strip emotion markers from displayed content
      const cleanedContent = stripEmotionMarkers(aiResponse);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: cleanedContent,
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

      {/* Main Content - 🆕 SPLIT SCREEN LAYOUT */}
      <div className="relative z-10 flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden">
        {/* LEFT SIDE: Chat Interface (50% on desktop, full on mobile) */}
        <div
          className={`flex flex-col ${showLive2D ? "w-full lg:w-1/2" : "w-full"} transition-all duration-300`}
        >
          <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1 flex">
            <div className="grid mx-4 w-full">
              {/* Sidebar - AI Companions */}

              {/* Chat Area */}
              <div className="lg:col-span-3 flex flex-col">
                <div className="neural-card rounded-2xl flex flex-col h-full">
                  {/* Chat Header */}
                  {selectedCompanion && (
                    <div className="p-6 border-b border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedCompanion.avatar.gradient} flex items-center justify-center text-lg font-bold text-white`}
                          >
                            {selectedCompanion.avatar.emoji}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {selectedCompanion.name}
                            </h3>
                            <div className="flex items-center space-x-2">
                              {/*<span className="text-xs text-green-400">
                                ● Online
                              </span>*/}
                              {apiHealthy === true && walletConnected && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mt-4">
                                  <div className="flex items-center justify-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-green-400 text-xs font-semibold">
                                      Online
                                    </span>
                                  </div>
                                </div>
                              )}
                              {/*{showLive2D && (
                                <span className="text-xs text-purple-400">
                                  ✨ Live2D Active
                                </span>
                              )}*/}
                            </div>
                          </div>
                        </div>

                        {!walletConnected && <ConnectButton />}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[calc(100vh-400px)]">
                    {!walletConnected && (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔐</div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Connect Your Wallet
                        </h3>
                        <p className="text-gray-400 mb-6">
                          Connect your wallet to start chatting with AI
                          companions
                        </p>
                        <ConnectButton />
                      </div>
                    )}

                    {walletConnected && !hasNFT && (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎨</div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Mint Your First NFT
                        </h3>
                        <p className="text-gray-400 mb-6">
                          You need to own a MuseAI NFT to access AI companions
                        </p>
                        <Link
                          href="/mint"
                          className="inline-block px-6 py-3 neural-button text-white rounded-xl"
                        >
                          Mint Now →
                        </Link>
                      </div>
                    )}

                    {walletConnected && hasNFT && messages.length === 0 && (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">💬</div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Start a Conversation
                        </h3>
                        <p className="text-gray-400 mb-6">
                          Send a message to begin chatting with your AI
                          companion
                        </p>
                        <SuggestedPrompts onPromptClick={handleSendMessage} />
                      </div>
                    )}

                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}

                    {isTyping && <TypingIndicator />}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  {walletConnected && hasNFT && (
                    <div className="p-6 border-t border-gray-700/50">
                      <div className="flex space-x-3">
                        <textarea
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder={
                            !selectedCompanion
                              ? "Select a companion to start..."
                              : "Type your message..."
                          }
                          disabled={!selectedCompanion}
                          className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          rows={2}
                        />
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={
                            !inputMessage.trim() ||
                            apiLoading ||
                            !selectedCompanion
                          }
                          className="neural-button px-6 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {apiLoading ? "..." : "Send"}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Press Enter to send, Shift+Enter for new line
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Live2D Avatar (50% on desktop, hidden on mobile when toggled) */}
        {showLive2D && (
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm">
            {selectedCompanion ? (
              <div className="w-full h-full relative">
                <Live2DCompanionDisplay
                  modelSrc="/models/hiyori/hiyori_free_t08.model3.json"
                  companionName={selectedCompanion.name}
                />

                {/* Live2D Info Overlay */}
                {/*<div className="absolute top-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">
                    {selectedCompanion.name} - Live2D Avatar
                  </h3>
                  <p className="text-xs text-gray-300">
                    Avatar reacts to emotions in real-time
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-purple-600/30 rounded text-xs text-purple-200">
                      😊 Happy
                    </span>
                    <span className="px-2 py-1 bg-blue-600/30 rounded text-xs text-blue-200">
                      🤔 Thinking
                    </span>
                    <span className="px-2 py-1 bg-yellow-600/30 rounded text-xs text-yellow-200">
                      😮 Surprised
                    </span>
                    <span className="px-2 py-1 bg-green-600/30 rounded text-xs text-green-200">
                      😊 Curious
                    </span>
                  </div>
                </div>*/}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">🤖</div>
                  <p>Select a companion to see their Live2D avatar</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
