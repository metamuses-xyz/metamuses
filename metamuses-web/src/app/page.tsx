"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Matrix Rain Component
const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01AI◆◇□■▲▼→←↑↓☰☱☲☳☴☵☶☷";
    const charArray = chars.split("");
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    const draw = () => {
      ctx.fillStyle = "rgba(10, 10, 15, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(139, 92, 246, 0.8)";
      ctx.font = `${fontSize}px JetBrains Mono`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 35);
    return () => clearInterval(interval);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-30"
    />
  );
};

// Animated Counter Component
const AnimatedCounter = ({
  end,
  duration = 2000,
}: {
  end: number;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span className="stat-number">{count}</span>;
};

// Floating Particle Component
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-purple-400 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
};

export default function Page() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    {
      icon: "🧠",
      title: "Unique Personalities",
      description:
        "Customize creativity, wisdom, humor, and empathy traits to create truly unique AI companions.",
      tech: "Neural Networks",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: "💾",
      title: "Persistent Memory",
      description:
        "Your conversations build lasting relationships with IPFS-backed memory storage.",
      tech: "IPFS Protocol",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: "🔐",
      title: "Blockchain Verified",
      description:
        "Every interaction is cryptographically signed and verifiable on the blockchain.",
      tech: "Smart Contracts",
      gradient: "from-green-500 to-teal-500",
    },
    {
      icon: "🔌",
      title: "Extensible Plugins",
      description:
        "Enhance your Muse with community-created plugins and capabilities.",
      tech: "Plugin Architecture",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Matrix Rain Background */}
      <MatrixRain />

      {/* Floating Particles */}
      <FloatingParticles />

      {/* Geometric Background */}
      <div className="geometric-bg">
        <div className="geometric-shape"></div>
        <div className="geometric-shape"></div>
        <div className="geometric-shape"></div>
      </div>

      {/* Mouse Follower */}
      <div
        className="fixed w-96 h-96 pointer-events-none z-0"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.03) 0%, transparent 70%)",
        }}
      />

      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            {/* <div
                                                   className="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8"
                                                   data-oid="5s90rue"
                                                  >
                                                   🚀 Next-Gen AI Companions
                                                  </div> */}

            <h1 className="text-6xl lg:text-8xl font-black mb-8 leading-tight">
              <div className="hero-gradient-text mb-4">Meet Your</div>
              <div className="hero-gradient-text">AI Companion</div>
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
              Create unique AI companions with{" "}
              <span className="text-purple-400 font-semibold">
                verifiable blockchain interactions
              </span>
              , persistent memory, and customizable personalities that evolve
              with you.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 mb-12">
              <a
                href="/mint"
                className="neural-button px-8 py-4 text-white font-bold text-lg rounded-xl flex items-center justify-center space-x-2 group"
              >
                <span>🔗</span>
                <span>Mint Muse AI</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </a>
              {/* <button
                                           className="px-8 py-4 border border-purple-500/30 text-purple-300 font-semibold rounded-xl hover:bg-purple-500/10 transition-all flex items-center space-x-2"
                                           data-oid="pgq7ogg"
                                          >
                                           <span data-oid="73il3l2">▶️</span>
                                           <span data-oid="q6sfal0">Watch Demo</span>
                                          </button> */}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-800">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  <AnimatedCounter end={100} />+
                </div>
                <div className="text-gray-400 text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  <AnimatedCounter end={10} />
                </div>
                <div className="text-gray-400 text-sm">AI Companions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  <AnimatedCounter end={1000} />+
                </div>
                <div className="text-gray-400 text-sm">Conversations</div>
              </div>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="relative">
            <div className="neural-card rounded-3xl p-8 backdrop-blur-xl">
              <div className="code-block p-6 rounded-xl mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-400 text-sm ml-4">
                    MetaMuse Terminal
                  </span>
                </div>
                <div className="font-mono text-sm space-y-2">
                  <div className="text-purple-400">
                    $ metamuse create --personality curious
                  </div>
                  <div className="text-green-400">
                    ✓ Initializing neural pathways...
                  </div>
                  <div className="text-cyan-400">
                    ✓ Blockchain identity verified
                  </div>
                  <div className="text-yellow-400">
                    ⚡ Your AI companion is ready!
                  </div>
                  <div className="text-gray-300 cursor-blink">$ _</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    AI
                  </div>
                  <div className="flex-1 bg-gray-800/50 rounded-lg p-4">
                    <p className="text-gray-300 text-sm">
                      Hello! I'm your new AI companion. I can remember our
                      conversations, learn from your preferences, and help you
                      with creative tasks. What would you like to explore
                      together?
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    You
                  </div>
                  <div className="flex-1 bg-purple-500/20 rounded-lg p-4">
                    <p className="text-purple-200 text-sm">
                      Let's brainstorm some creative writing ideas for my sci-fi
                      novel...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Features Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-32">
        <div className="text-center mb-20">
          {/* <div
                                      className="inline-block px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-mono mb-6"
                                      data-oid="ts9pawn"
                                     >
                                      🔬 Advanced Technology Stack
                                     </div> */}
          <h2 className="text-5xl lg:text-6xl font-black mb-6 secondary-gradient-text">
            Powered by AI & Blockchain
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our cutting-edge technology stack combines the latest advances in
            artificial intelligence with blockchain security to create truly
            revolutionary AI companions.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`neural-card rounded-3xl p-8 cursor-pointer transition-all duration-500 ${
                activeFeature === index ? "ring-2 ring-purple-500/50" : ""
              }`}
              onClick={() => setActiveFeature(index)}
              onMouseEnter={() => setActiveFeature(index)}
            >
              <div className="flex items-start space-x-6">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}
                >
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-2xl font-bold text-white">
                      {feature.title}
                    </h3>
                    <span className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded font-mono">
                      {feature.tech}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-purple-400 hover:text-purple-300 transition-colors">
                    <span className="text-sm font-semibold">Learn more</span>
                    <span className="ml-2">→</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Architecture */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <div className="hex-pattern rounded-3xl p-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Technical Architecture
            </h2>
            <p className="text-gray-300 text-lg">
              Built for scale, security, and seamless integration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto flex items-center justify-center text-3xl">
                ⚡
              </div>
              <h3 className="text-xl font-semibold text-white">
                Lightning Fast
              </h3>
              <p className="text-gray-400">
                Sub-100ms response times with distributed computing
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mx-auto flex items-center justify-center text-3xl">
                🛡️
              </div>
              <h3 className="text-xl font-semibold text-white">
                Enterprise Security
              </h3>
              <p className="text-gray-400">
                End-to-end encryption with zero-knowledge proofs
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mx-auto flex items-center justify-center text-3xl">
                🌐
              </div>
              <h3 className="text-xl font-semibold text-white">Global Scale</h3>
              <p className="text-gray-400">
                Distributed across 50+ data centers worldwide
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced CTA */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <div className="neural-card rounded-3xl p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10"></div>
          <div className="relative z-10">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8">
              🚀 Join the Future of AI
            </div>

            <h2 className="text-5xl lg:text-6xl font-black mb-6 hero-gradient-text">
              Ready to Build Your
              <br />
              AI Companion?
            </h2>

            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join <span className="font-bold text-purple-400">12,400+</span>{" "}
              creators already building lasting relationships with their AI
              Muses. Start your journey into the future of companionship.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <a
                href="/mint"
                className="neural-button px-12 py-5 text-white font-bold text-xl rounded-xl flex items-center space-x-3 group"
              >
                <span>🚀</span>
                <span>Mint Your Muse AI</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </a>
              {/* <button
                                    className="px-12 py-5 border-2 border-purple-500/50 text-purple-300 font-bold text-xl rounded-xl hover:bg-purple-500/10 transition-all"
                                    data-oid="2kdr654"
                                   >
                                    View Documentation
                                   </button> */}
            </div>

            {/* <div className="text-sm text-gray-400 space-x-6" data-oid="-iw76x6">
                                    <span data-oid="nm.hwo_">✓ No setup fees</span>
                                    <span data-oid="5tnbaey">✓ 30-day free trial</span>
                                    <span data-oid="xbk2d9_">✓ Cancel anytime</span>
                                   </div> */}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
