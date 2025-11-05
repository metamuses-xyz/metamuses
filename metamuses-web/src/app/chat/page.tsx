"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCompanion, setSelectedCompanion] =
    useState<AICompanion | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    // Auto-select first companion
    if (companions.length > 0 && !selectedCompanion) {
      setSelectedCompanion(companions[0]);
      // Add welcome message
      setMessages([
        {
          id: "welcome",
          content: `Hello! I'm ${companions[0].name}. ${companions[0].description}. How can I assist you today?`,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim();
    if (!content || !selectedCompanion) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(
      () => {
        const aiResponses = [
          "That's a fascinating perspective! Let me think about that...",
          "I appreciate you sharing that with me. Here's what I think...",
          "Interesting question! Based on my understanding...",
          "I love discussing topics like this! My take is...",
          "That reminds me of something I've been pondering...",
          "Great point! Let me elaborate on that idea...",
        ];

        const response =
          aiResponses[Math.floor(Math.random() * aiResponses.length)];

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content:
            response +
            " " +
            generateContextualResponse(content, selectedCompanion),
          sender: "ai",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
      },
      1500 + Math.random() * 2000,
    );
  };

  const generateContextualResponse = (
    userMessage: string,
    companion: AICompanion,
  ): string => {
    const responses = {
      creativity: [
        "Creativity flows through every interaction we have. What if we approached this from a completely different angle?",
        "I see endless possibilities in what you're saying. Let's explore the creative potential together!",
        "Your words spark new ideas in my neural networks. Creativity is about connecting unexpected dots.",
      ],

      wisdom: [
        "In my experience, the deepest truths often lie in the simplest observations.",
        "Wisdom comes not from having all the answers, but from asking the right questions.",
        "I've learned that understanding comes through patient reflection and open dialogue.",
      ],

      humor: [
        "You know what they say about AI humor - it's all about the timing... and the algorithms! 😄",
        "I may be artificial, but my appreciation for wit is quite genuine!",
        "Life's too short not to find joy in our conversations, don't you think?",
      ],

      empathy: [
        "I can sense the emotion behind your words, and I want you to know I'm here to listen.",
        "Your feelings are valid, and I appreciate you sharing them with me.",
        "Understanding each other is what makes these conversations meaningful.",
      ],
    };

    // Choose response based on companion's strongest trait
    const strongestTrait = Object.entries(companion.personality).reduce(
      (a, b) => (a[1] > b[1] ? a : b),
    )[0] as keyof typeof responses;

    const traitResponses = responses[strongestTrait];
    return traitResponses[Math.floor(Math.random() * traitResponses.length)];
  };

  const connectWallet = () => {
    setWalletConnected(true);
    alert("Wallet connected! You can now chat with your AI companions. 🔗");
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
      <nav className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white">
            M
          </div>
          <div>
            <span className="text-2xl font-bold hero-gradient-text">
              MetaMuse
            </span>
            <div className="text-xs text-gray-400 font-mono">AI Chat</div>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          {!walletConnected ? (
            <button
              onClick={connectWallet}
              className="neural-button px-6 py-3 text-white font-semibold rounded-xl hover:scale-105 transition-all"
            >
              🔗 Connect Wallet
            </button>
          ) : (
            <div className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-xl">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />

              <span className="text-green-300 text-sm font-mono">
                0x3BD9...7881
              </span>
            </div>
          )}

          <Link
            href="/mint"
            className="px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
          >
            🎯 Mint NFT
          </Link>

          <Link
            href="/"
            className="px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
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
                      setMessages([
                        {
                          id: "welcome-" + companion.id,
                          content: `Hello! I'm ${companion.name}. ${companion.description}. How can I assist you today?`,
                          sender: "ai",
                          timestamp: new Date(),
                        },
                      ]);
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
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="neural-card rounded-2xl h-full flex flex-col">
              {/* Chat Header */}
              {selectedCompanion && (
                <div className="p-6 border-b border-gray-700/50">
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
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                    <button
                      onClick={connectWallet}
                      className="neural-button px-8 py-4 text-white font-semibold rounded-xl hover:scale-105 transition-all"
                    >
                      🔗 Connect Wallet to Chat
                    </button>
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
    </div>
  );
}
