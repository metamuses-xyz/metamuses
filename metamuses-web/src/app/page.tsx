"use client";

import { useState, useEffect, useRef } from "react";

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
      data-oid="ie2pkjj"
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
    <span className="stat-number" data-oid="1fj316u">
      {count}
    </span>
  );
};

// Floating Particle Component
const FloatingParticles = () => {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      data-oid="pq24e6g"
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
          data-oid="rvo0gv5"
        />
      ))}
    </div>
  );
};

export default function Page() {
  const [isConnected, setIsConnected] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleConnectWallet = () => {
    setIsConnected(!isConnected);
  };

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
      data-oid="you6-0g"
    >
      {/* Matrix Rain Background */}
      <MatrixRain data-oid="ti-45:c" />

      {/* Floating Particles */}
      <FloatingParticles data-oid="3y-.49x" />

      {/* Geometric Background */}
      <div className="geometric-bg" data-oid="cu8:f3u">
        <div className="geometric-shape" data-oid="sidj-re"></div>
        <div className="geometric-shape" data-oid="z2wt-p0"></div>
        <div className="geometric-shape" data-oid=".5hgt24"></div>
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
        data-oid="g5ign.6"
      />

      {/* Navigation */}
      <nav
        className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto backdrop-blur-sm"
        data-oid="w-qqbb1"
      >
        <div className="flex items-center space-x-3" data-oid="otazn0l">
          <div className="relative" data-oid="xsj3q7q">
            <div
              className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
              data-oid="5:soysa"
            >
              M
            </div>
            <div
              className="pulse-ring w-12 h-12 top-0 left-0"
              data-oid="_7-wnim"
            ></div>
          </div>
          <div data-oid="4got08u">
            <span
              className="text-2xl font-bold hero-gradient-text"
              data-oid="s23g17f"
            >
              MetaMuses
            </span>
          </div>
        </div>

        <div
          className="hidden lg:flex items-center space-x-8 text-gray-300 font-medium"
          data-oid="b_:.f50"
        >
          {[
            { icon: "🏠", label: "Home", active: true },
            { icon: "🎨", label: "Mint Muse AI", href: "/mint" },
          ].map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all hover:bg-white/5 ${
                item.active ? "text-white bg-white/10" : "hover:text-white"
              }`}
              data-oid="z.huo3v"
            >
              <span data-oid="b340dqt">{item.icon}</span>
              <span data-oid="a57b7k1">{item.label}</span>
            </a>
          ))}
        </div>

        <button
          onClick={handleConnectWallet}
          className={`neural-button px-6 py-3 rounded-xl font-semibold transition-all ${
            isConnected
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "text-white"
          }`}
          data-oid="ij67ayj"
        >
          {isConnected ? "✅ Connected" : "Connect Wallet"}
        </button>
      </nav>

      {/* Hero Section */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 py-20"
        data-oid="x6ilhfc"
      >
        <div
          className="grid lg:grid-cols-2 gap-16 items-center"
          data-oid="lc:0rma"
        >
          <div data-oid="2.ta0y0">
            {/* <div
                                         className="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8"
                                         data-oid="5s90rue"
                                        >
                                         🚀 Next-Gen AI Companions
                                        </div> */}

            <h1
              className="text-6xl lg:text-8xl font-black mb-8 leading-tight"
              data-oid="t557tx8"
            >
              <div className="hero-gradient-text mb-4" data-oid="-0mwrjc">
                Meet Your
              </div>
              <div className="hero-gradient-text" data-oid="apqkxrc">
                AI Companion
              </div>
            </h1>

            <p
              className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl"
              data-oid="5b7tdj4"
            >
              Create unique AI companions with{" "}
              <span
                className="text-purple-400 font-semibold"
                data-oid="a6h-8--"
              >
                verifiable blockchain interactions
              </span>
              , persistent memory, and customizable personalities that evolve
              with you.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-6 mb-12"
              data-oid="fcjsg3-"
            >
              <button
                onClick={handleConnectWallet}
                className="neural-button px-8 py-4 text-white font-bold text-lg rounded-xl flex items-center space-x-2 group"
                data-oid="n-ezokz"
              >
                <span data-oid="lqt4kj6">🔗</span>
                <span data-oid="q3hxi_v">Mint Muse AI</span>
                <span
                  className="group-hover:translate-x-1 transition-transform"
                  data-oid="thn95kt"
                >
                  →
                </span>
              </button>
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
              data-oid="1.cp:77"
            >
              <div className="text-center" data-oid="-qhbg15">
                <div className="text-3xl font-bold" data-oid="kr189kc">
                  <AnimatedCounter end={100} data-oid="qvrto1f" />+
                </div>
                <div className="text-gray-400 text-sm" data-oid="ok-_ssd">
                  Active Users
                </div>
              </div>
              <div className="text-center" data-oid=":.cw288">
                <div className="text-3xl font-bold" data-oid="fk8mwmx">
                  <AnimatedCounter end={10} data-oid="iikc6l2" />
                </div>
                <div className="text-gray-400 text-sm" data-oid="wn_adw7">
                  AI Companions
                </div>
              </div>
              <div className="text-center" data-oid="gnywzqn">
                <div className="text-3xl font-bold" data-oid="dhkvfec">
                  <AnimatedCounter end={1000} data-oid="7_8k6i5" />+
                </div>
                <div className="text-gray-400 text-sm" data-oid="ry72nq.">
                  Conversations
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="relative" data-oid="cydfzca">
            <div
              className="neural-card rounded-3xl p-8 backdrop-blur-xl"
              data-oid="s2dc-nj"
            >
              <div
                className="code-block p-6 rounded-xl mb-6"
                data-oid="9_9xelh"
              >
                <div
                  className="flex items-center space-x-2 mb-4"
                  data-oid="dfui14a"
                >
                  <div
                    className="w-3 h-3 bg-red-500 rounded-full"
                    data-oid="qlmpis9"
                  ></div>
                  <div
                    className="w-3 h-3 bg-yellow-500 rounded-full"
                    data-oid="ecd7qza"
                  ></div>
                  <div
                    className="w-3 h-3 bg-green-500 rounded-full"
                    data-oid=":m8k8ne"
                  ></div>
                  <span
                    className="text-gray-400 text-sm ml-4"
                    data-oid="ro-:g6a"
                  >
                    MetaMuse Terminal
                  </span>
                </div>
                <div className="font-mono text-sm space-y-2" data-oid="_v3tz82">
                  <div className="text-purple-400" data-oid="qzedaz8">
                    $ metamuse create --personality curious
                  </div>
                  <div className="text-green-400" data-oid=".cf.2:6">
                    ✓ Initializing neural pathways...
                  </div>
                  <div className="text-cyan-400" data-oid="td2m._2">
                    ✓ Blockchain identity verified
                  </div>
                  <div className="text-yellow-400" data-oid="_1a4x1m">
                    ⚡ Your AI companion is ready!
                  </div>
                  <div
                    className="text-gray-300 cursor-blink"
                    data-oid="8cs0sgm"
                  >
                    $ _
                  </div>
                </div>
              </div>

              <div className="space-y-4" data-oid="35rzorc">
                <div className="flex items-start space-x-4" data-oid="adma1.b">
                  <div
                    className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    data-oid="vik0lh_"
                  >
                    AI
                  </div>
                  <div
                    className="flex-1 bg-gray-800/50 rounded-lg p-4"
                    data-oid="_49fc.i"
                  >
                    <p className="text-gray-300 text-sm" data-oid="j4grxln">
                      Hello! I'm your new AI companion. I can remember our
                      conversations, learn from your preferences, and help you
                      with creative tasks. What would you like to explore
                      together?
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4" data-oid="17f2aes">
                  <div
                    className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    data-oid="dpt052b"
                  >
                    You
                  </div>
                  <div
                    className="flex-1 bg-purple-500/20 rounded-lg p-4"
                    data-oid="w0aft94"
                  >
                    <p className="text-purple-200 text-sm" data-oid="zn50dby">
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
        data-oid="-px5utq"
      >
        <div className="text-center mb-20" data-oid="s2ypz1c">
          {/* <div
                            className="inline-block px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-mono mb-6"
                            data-oid="ts9pawn"
                           >
                            🔬 Advanced Technology Stack
                           </div> */}
          <h2
            className="text-5xl lg:text-6xl font-black mb-6 secondary-gradient-text"
            data-oid="7kclv9z"
          >
            Powered by AI & Blockchain
          </h2>
          <p
            className="text-xl text-gray-400 max-w-3xl mx-auto"
            data-oid="-9z5owj"
          >
            Our cutting-edge technology stack combines the latest advances in
            artificial intelligence with blockchain security to create truly
            revolutionary AI companions.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8" data-oid="i.wo6ta">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`neural-card rounded-3xl p-8 cursor-pointer transition-all duration-500 ${
                activeFeature === index ? "ring-2 ring-purple-500/50" : ""
              }`}
              onClick={() => setActiveFeature(index)}
              onMouseEnter={() => setActiveFeature(index)}
              data-oid="etd7sxp"
            >
              <div className="flex items-start space-x-6" data-oid="76x02do">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}
                  data-oid="_vtt4bg"
                >
                  {feature.icon}
                </div>
                <div className="flex-1" data-oid="9padb6m">
                  <div
                    className="flex items-center space-x-3 mb-3"
                    data-oid="6h6jxb9"
                  >
                    <h3
                      className="text-2xl font-bold text-white"
                      data-oid="i7geb1_"
                    >
                      {feature.title}
                    </h3>
                    <span
                      className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded font-mono"
                      data-oid="ov7ciyo"
                    >
                      {feature.tech}
                    </span>
                  </div>
                  <p
                    className="text-gray-300 leading-relaxed mb-4"
                    data-oid="l_0:s5u"
                  >
                    {feature.description}
                  </p>
                  <div
                    className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
                    data-oid="x0oybtd"
                  >
                    <span className="text-sm font-semibold" data-oid="ebgt:3n">
                      Learn more
                    </span>
                    <span className="ml-2" data-oid=":vhrted">
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
        data-oid="jp9crfw"
      >
        <div className="hex-pattern rounded-3xl p-12" data-oid="rin47zl">
          <div className="text-center mb-16" data-oid="1nklwk:">
            <h2
              className="text-4xl font-bold text-white mb-4"
              data-oid="63j3r-i"
            >
              Technical Architecture
            </h2>
            <p className="text-gray-300 text-lg" data-oid="5xg9s08">
              Built for scale, security, and seamless integration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8" data-oid="o6-v-d7">
            <div className="text-center space-y-4" data-oid="65m3906">
              <div
                className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto flex items-center justify-center text-3xl"
                data-oid="pj.k3fe"
              >
                ⚡
              </div>
              <h3
                className="text-xl font-semibold text-white"
                data-oid="nv1gsa-"
              >
                Lightning Fast
              </h3>
              <p className="text-gray-400" data-oid="_7t56n7">
                Sub-100ms response times with distributed computing
              </p>
            </div>

            <div className="text-center space-y-4" data-oid="ce9x..z">
              <div
                className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mx-auto flex items-center justify-center text-3xl"
                data-oid="ux9_ctx"
              >
                🛡️
              </div>
              <h3
                className="text-xl font-semibold text-white"
                data-oid="sdc859w"
              >
                Enterprise Security
              </h3>
              <p className="text-gray-400" data-oid="_m1wiul">
                End-to-end encryption with zero-knowledge proofs
              </p>
            </div>

            <div className="text-center space-y-4" data-oid="ya:apzi">
              <div
                className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mx-auto flex items-center justify-center text-3xl"
                data-oid="zw80qd0"
              >
                🌐
              </div>
              <h3
                className="text-xl font-semibold text-white"
                data-oid=":p0s_5n"
              >
                Global Scale
              </h3>
              <p className="text-gray-400" data-oid="ngz87jz">
                Distributed across 50+ data centers worldwide
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced CTA */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 py-20"
        data-oid="42-1xhw"
      >
        <div
          className="neural-card rounded-3xl p-16 text-center relative overflow-hidden"
          data-oid="-0n4mtc"
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10"
            data-oid="ov4snx:"
          ></div>
          <div className="relative z-10" data-oid="b8:nx73">
            <div
              className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8"
              data-oid="41u:_iw"
            >
              🚀 Join the Future of AI
            </div>

            <h2
              className="text-5xl lg:text-6xl font-black mb-6 hero-gradient-text"
              data-oid="zbcie2h"
            >
              Ready to Build Your
              <br data-oid=":5b4527" />
              AI Companion?
            </h2>

            <p
              className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
              data-oid="i9-k:nm"
            >
              Join{" "}
              <span className="font-bold text-purple-400" data-oid="puhwy8n">
                12,400+
              </span>{" "}
              creators already building lasting relationships with their AI
              Muses. Start your journey into the future of companionship.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
              data-oid="o-.t96s"
            >
              <button
                onClick={handleConnectWallet}
                className="neural-button px-12 py-5 text-white font-bold text-xl rounded-xl flex items-center space-x-3 group"
                data-oid="-b2_tqa"
              >
                <span data-oid="4p.q5.h">🚀</span>
                <span data-oid="znr0w.5">Mint Your Muse AI</span>
                <span
                  className="group-hover:translate-x-1 transition-transform"
                  data-oid="-atdfg."
                >
                  →
                </span>
              </button>
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
      <footer
        className="relative z-10 border-t border-gray-800/50 backdrop-blur-sm"
        data-oid="ksn2nob"
      >
        <div className="max-w-7xl mx-auto px-4 py-16" data-oid="pns1nww">
          <div className="grid md:grid-cols-4 gap-8 mb-12" data-oid="de0_sxa">
            <div data-oid="vvz1-61">
              <div
                className="flex items-center space-x-3 mb-6"
                data-oid="51cn8hv"
              >
                <div
                  className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white"
                  data-oid="e_pr7wf"
                >
                  M
                </div>
                <span
                  className="text-xl font-bold text-white"
                  data-oid="fvlvarq"
                >
                  MetaMuse
                </span>
              </div>
              <p className="text-gray-400 mb-6" data-oid="6dm8pyh">
                Building the future of AI companions on blockchain technology.
              </p>
              <div className="flex space-x-4" data-oid="hcyvimw">
                {["🐦", "📘", "💼", "📸"].map((emoji, index) => (
                  <div
                    key={index}
                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    data-oid="q:rx4b9"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "Documentation"],
              },
              {
                title: "Resources",
                links: ["Community"],
              },
            ].map((section, index) => (
              <div key={index} data-oid="yzi8o7l">
                <h4
                  className="text-white font-semibold mb-6"
                  data-oid="n3prisa"
                >
                  {section.title}
                </h4>
                <ul className="space-y-4" data-oid="bimm:ve">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex} data-oid="g_hv9o1">
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors"
                        data-oid="1_fkeqa"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="pt-8 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center"
            data-oid="9t1_f4y"
          >
            <p className="text-gray-400 mb-4 md:mb-0" data-oid="pzeyy46">
              © 2025 MetaMuses. All rights reserved. Built with ❤️ for the
              future.
            </p>
            <div
              className="flex space-x-6 text-gray-400 text-sm"
              data-oid="by.a85_"
            >
              <a
                href="#"
                className="hover:text-white transition-colors"
                data-oid="-x7t45t"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors"
                data-oid="7bjfjk3"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors"
                data-oid="s7h9tk7"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
