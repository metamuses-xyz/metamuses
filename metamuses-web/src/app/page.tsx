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
      data-oid=":24aw48"
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

  return (
    <span className="stat-number" data-oid="pqgzi4:">
      {count}
    </span>
  );
};

// Floating Particle Component
const FloatingParticles = () => {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      data-oid=".1lztk1"
    >
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
          data-oid="ah.xmy_"
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
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
      data-oid="4bc5jfj"
    >
      {/* Matrix Rain Background */}
      <MatrixRain data-oid="ku8yqx0" />

      {/* Floating Particles */}
      <FloatingParticles data-oid="85y6wrc" />

      {/* Geometric Background */}
      <div className="geometric-bg" data-oid="7oh8f:8">
        <div className="geometric-shape" data-oid="31zy1zu"></div>
        <div className="geometric-shape" data-oid="qna1r_r"></div>
        <div className="geometric-shape" data-oid="0q9l42t"></div>
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
        data-oid="o7nv5vl"
      />

      {/* Navigation */}
      <Header data-oid=".bw.ry1" />

      {/* Hero Section */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 py-20"
        data-oid="_ujf912"
      >
        <div
          className="grid lg:grid-cols-2 gap-16 items-center"
          data-oid="m5cnx.5"
        >
          <div data-oid="0lw6z32">
            {/* <div
                                                  className="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8"
                                                  data-oid="5s90rue"
                                                 >
                                                  🚀 Next-Gen AI Companions
                                                 </div> */}

            <h1
              className="text-6xl lg:text-8xl font-black mb-8 leading-tight"
              data-oid="u9cb:wo"
            >
              <div className="hero-gradient-text mb-4" data-oid="nj92c3f">
                Meet Your
              </div>
              <div className="hero-gradient-text" data-oid="trjpeh_">
                AI Companion
              </div>
            </h1>

            <p
              className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl"
              data-oid="r51pqt:"
            >
              Create unique AI companions with{" "}
              <span
                className="text-purple-400 font-semibold"
                data-oid="u7lbj-a"
              >
                verifiable blockchain interactions
              </span>
              , persistent memory, and customizable personalities that evolve
              with you.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-6 mb-12"
              data-oid="ciccyz7"
            >
              <a
                href="/mint"
                className="neural-button px-8 py-4 text-white font-bold text-lg rounded-xl flex items-center justify-center space-x-2 group"
                data-oid="ic_2_gt"
              >
                <span data-oid="9r2yxng">🔗</span>
                <span data-oid="681t:z4">Mint Muse AI</span>
                <span
                  className="group-hover:translate-x-1 transition-transform"
                  data-oid="72fddy1"
                >
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
            <div
              className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-800"
              data-oid="pvjk13n"
            >
              <div className="text-center" data-oid="mm2lf2k">
                <div className="text-3xl font-bold" data-oid="iasgd2v">
                  <AnimatedCounter end={100} data-oid="hi-ruko" />+
                </div>
                <div className="text-gray-400 text-sm" data-oid="fp77fgs">
                  Active Users
                </div>
              </div>
              <div className="text-center" data-oid="key_xzp">
                <div className="text-3xl font-bold" data-oid="793jx5a">
                  <AnimatedCounter end={10} data-oid="_s2c2_." />
                </div>
                <div className="text-gray-400 text-sm" data-oid="ff9ryh6">
                  AI Companions
                </div>
              </div>
              <div className="text-center" data-oid="9:cibzr">
                <div className="text-3xl font-bold" data-oid="tgk1yk4">
                  <AnimatedCounter end={1000} data-oid="5adogzs" />+
                </div>
                <div className="text-gray-400 text-sm" data-oid="vhcdz.n">
                  Conversations
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="relative" data-oid="my-l2wv">
            <div
              className="neural-card rounded-3xl p-8 backdrop-blur-xl"
              data-oid="1q-mpzj"
            >
              <div
                className="code-block p-6 rounded-xl mb-6"
                data-oid="l7bzroa"
              >
                <div
                  className="flex items-center space-x-2 mb-4"
                  data-oid="j1mt9gt"
                >
                  <div
                    className="w-3 h-3 bg-red-500 rounded-full"
                    data-oid="4uxsh:2"
                  ></div>
                  <div
                    className="w-3 h-3 bg-yellow-500 rounded-full"
                    data-oid="0nsb71d"
                  ></div>
                  <div
                    className="w-3 h-3 bg-green-500 rounded-full"
                    data-oid="hiw-f2f"
                  ></div>
                  <span
                    className="text-gray-400 text-sm ml-4"
                    data-oid="a3jurtj"
                  >
                    MetaMuse Terminal
                  </span>
                </div>
                <div className="font-mono text-sm space-y-2" data-oid="s7e:dss">
                  <div className="text-purple-400" data-oid="99bw5vi">
                    $ metamuse create --personality curious
                  </div>
                  <div className="text-green-400" data-oid="2ovauw_">
                    ✓ Initializing neural pathways...
                  </div>
                  <div className="text-cyan-400" data-oid="42jm8ij">
                    ✓ Blockchain identity verified
                  </div>
                  <div className="text-yellow-400" data-oid="th28::9">
                    ⚡ Your AI companion is ready!
                  </div>
                  <div
                    className="text-gray-300 cursor-blink"
                    data-oid="e:du:01"
                  >
                    $ _
                  </div>
                </div>
              </div>

              <div className="space-y-4" data-oid="29s.11k">
                <div className="flex items-start space-x-4" data-oid="lzip-_5">
                  <div
                    className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    data-oid="p3dfqw_"
                  >
                    AI
                  </div>
                  <div
                    className="flex-1 bg-gray-800/50 rounded-lg p-4"
                    data-oid="ctsq5ct"
                  >
                    <p className="text-gray-300 text-sm" data-oid="544x__w">
                      Hello! I'm your new AI companion. I can remember our
                      conversations, learn from your preferences, and help you
                      with creative tasks. What would you like to explore
                      together?
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4" data-oid="hlujb0r">
                  <div
                    className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    data-oid="y2gkcg2"
                  >
                    You
                  </div>
                  <div
                    className="flex-1 bg-purple-500/20 rounded-lg p-4"
                    data-oid="cfk5u7m"
                  >
                    <p className="text-purple-200 text-sm" data-oid=":d5ndfe">
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
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 py-32"
        data-oid="2-bu0yr"
      >
        <div className="text-center mb-20" data-oid="0b3qc12">
          {/* <div
                                     className="inline-block px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-mono mb-6"
                                     data-oid="ts9pawn"
                                    >
                                     🔬 Advanced Technology Stack
                                    </div> */}
          <h2
            className="text-5xl lg:text-6xl font-black mb-6 secondary-gradient-text"
            data-oid="_ezews:"
          >
            Powered by AI & Blockchain
          </h2>
          <p
            className="text-xl text-gray-400 max-w-3xl mx-auto"
            data-oid="_b87_d7"
          >
            Our cutting-edge technology stack combines the latest advances in
            artificial intelligence with blockchain security to create truly
            revolutionary AI companions.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8" data-oid="bh3g9s9">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`neural-card rounded-3xl p-8 cursor-pointer transition-all duration-500 ${
                activeFeature === index ? "ring-2 ring-purple-500/50" : ""
              }`}
              onClick={() => setActiveFeature(index)}
              onMouseEnter={() => setActiveFeature(index)}
              data-oid="gycyj05"
            >
              <div className="flex items-start space-x-6" data-oid="13wty0-">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}
                  data-oid="r:5--zf"
                >
                  {feature.icon}
                </div>
                <div className="flex-1" data-oid=".:qz.5m">
                  <div
                    className="flex items-center space-x-3 mb-3"
                    data-oid="9xtdybz"
                  >
                    <h3
                      className="text-2xl font-bold text-white"
                      data-oid="u3e9ol6"
                    >
                      {feature.title}
                    </h3>
                    <span
                      className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded font-mono"
                      data-oid="_i8io1b"
                    >
                      {feature.tech}
                    </span>
                  </div>
                  <p
                    className="text-gray-300 leading-relaxed mb-4"
                    data-oid="eswqi8j"
                  >
                    {feature.description}
                  </p>
                  <div
                    className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
                    data-oid="z_d_a2a"
                  >
                    <span className="text-sm font-semibold" data-oid="sa7l1fb">
                      Learn more
                    </span>
                    <span className="ml-2" data-oid="ewba-5h">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Architecture */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 py-20"
        data-oid="jnreoo_"
      >
        <div className="hex-pattern rounded-3xl p-12" data-oid="0gobht.">
          <div className="text-center mb-16" data-oid="7.m2a66">
            <h2
              className="text-4xl font-bold text-white mb-4"
              data-oid="zi:fp5n"
            >
              Technical Architecture
            </h2>
            <p className="text-gray-300 text-lg" data-oid="2yqsic.">
              Built for scale, security, and seamless integration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8" data-oid="bz6:er0">
            <div className="text-center space-y-4" data-oid="3t287gf">
              <div
                className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto flex items-center justify-center text-3xl"
                data-oid="glje7c0"
              >
                ⚡
              </div>
              <h3
                className="text-xl font-semibold text-white"
                data-oid="r-gn8ns"
              >
                Lightning Fast
              </h3>
              <p className="text-gray-400" data-oid="x34cqh2">
                Sub-100ms response times with distributed computing
              </p>
            </div>

            <div className="text-center space-y-4" data-oid="a-w03jz">
              <div
                className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mx-auto flex items-center justify-center text-3xl"
                data-oid="l3iz14a"
              >
                🛡️
              </div>
              <h3
                className="text-xl font-semibold text-white"
                data-oid="w1.:8vs"
              >
                Enterprise Security
              </h3>
              <p className="text-gray-400" data-oid="a9e5yv3">
                End-to-end encryption with zero-knowledge proofs
              </p>
            </div>

            <div className="text-center space-y-4" data-oid="lnn9id8">
              <div
                className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mx-auto flex items-center justify-center text-3xl"
                data-oid="14sj4mc"
              >
                🌐
              </div>
              <h3
                className="text-xl font-semibold text-white"
                data-oid="4lpclcq"
              >
                Global Scale
              </h3>
              <p className="text-gray-400" data-oid="u48t8o8">
                Distributed across 50+ data centers worldwide
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced CTA */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 py-20"
        data-oid="ireikie"
      >
        <div
          className="neural-card rounded-3xl p-16 text-center relative overflow-hidden"
          data-oid="kqz5b:6"
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10"
            data-oid="fmdil81"
          ></div>
          <div className="relative z-10" data-oid="g3489yb">
            <div
              className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8"
              data-oid="8yrffhr"
            >
              🚀 Join the Future of AI
            </div>

            <h2
              className="text-5xl lg:text-6xl font-black mb-6 hero-gradient-text"
              data-oid="pqpuj3t"
            >
              Ready to Build Your
              <br data-oid="0f8k659" />
              AI Companion?
            </h2>

            <p
              className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
              data-oid="3hst1q:"
            >
              Join{" "}
              <span className="font-bold text-purple-400" data-oid="-zjqdsa">
                12,400+
              </span>{" "}
              creators already building lasting relationships with their AI
              Muses. Start your journey into the future of companionship.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
              data-oid="45wztiw"
            >
              <a
                href="/mint"
                className="neural-button px-12 py-5 text-white font-bold text-xl rounded-xl flex items-center space-x-3 group"
                data-oid="uofa9nu"
              >
                <span data-oid="ecaxuaj">🚀</span>
                <span data-oid="ccyek92">Mint Your Muse AI</span>
                <span
                  className="group-hover:translate-x-1 transition-transform"
                  data-oid="c-utrfb"
                >
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
      <Footer data-oid="hiv6wzd" />
    </div>
  );
}
