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
      data-oid="w2hloja"
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
    <span className="stat-number" data-oid="znowpt3">
      {count}
    </span>
  );
};

// Floating Particle Component
const FloatingParticles = () => {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      data-oid="w37yp2g"
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
          data-oid="o:9vux8"
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
      data-oid="cumm2st"
    >
      {/* Matrix Rain Background */}
      <MatrixRain data-oid="mtb6t_9" />

      {/* Floating Particles */}
      <FloatingParticles data-oid="pe70evx" />

      {/* Geometric Background */}
      <div className="geometric-bg" data-oid="3p0qi95">
        <div className="geometric-shape" data-oid="a8oh025"></div>
        <div className="geometric-shape" data-oid="sv4vu9b"></div>
        <div className="geometric-shape" data-oid="l26j9d3"></div>
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
        data-oid="j9_59j1"
      />

      {/* Navigation */}
      <nav
        className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto backdrop-blur-sm"
        data-oid="r4y2.92"
      >
        <div className="flex items-center space-x-3" data-oid="0.hgn2t">
          <div className="relative" data-oid="9xkdxmq">
            <div
              className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
              data-oid="pn1wur1"
            >
              M
            </div>
            <div
              className="pulse-ring w-12 h-12 top-0 left-0"
              data-oid="fl2uxu-"
            ></div>
          </div>
          <div data-oid="8nmv4h5">
            <span
              className="text-2xl font-bold hero-gradient-text"
              data-oid="ym6cmwd"
            >
              MetaMuse
            </span>
            <div className="text-xs text-gray-400 font-mono" data-oid="mcc_hto">
              v2.0.1-beta
            </div>
          </div>
        </div>

        <div
          className="hidden lg:flex items-center space-x-8 text-gray-300 font-medium"
          data-oid="idjkf0i"
        >
          {[
            { icon: "🏠", label: "Home", active: true },
            { icon: "✨", label: "Create Muse", href: "/create" },
            { icon: "👥", label: "My Muses" },
            { icon: "🔍", label: "Explore" },
            { icon: "📊", label: "My DATs" },
          ].map((item, index) => (
            <a
              key={index}
              href="#"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all hover:bg-white/5 ${
                item.active ? "text-white bg-white/10" : "hover:text-white"
              }`}
              data-oid="69bn.tt"
            >
              <span data-oid="bsk_lbw">{item.icon}</span>
              <span data-oid="12nxtdw">{item.label}</span>
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
          data-oid="-6f:lg9"
        >
          {isConnected ? "✅ Connected" : "Connect Wallet"}
        </button>
      </nav>

      {/* Hero Section */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 py-20"
        data-oid="cy6nfrb"
      >
        <div
          className="grid lg:grid-cols-2 gap-16 items-center"
          data-oid="17_ti2v"
        >
          <div data-oid="ohqrdh1">
            <div
              className="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8"
              data-oid="5s90rue"
            >
              🚀 Next-Gen AI Companions
            </div>

            <h1
              className="text-6xl lg:text-8xl font-black mb-8 leading-tight"
              data-oid="5h9mqtv"
            >
              <div className="hero-gradient-text mb-4" data-oid="g0mq.e2">
                Meet Your
              </div>
              <div className="hero-gradient-text" data-oid="2nxy5ho">
                AI Companion
              </div>
            </h1>

            <p
              className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl"
              data-oid="gilmsrr"
            >
              Create unique AI companions with{" "}
              <span
                className="text-purple-400 font-semibold"
                data-oid="n7a78vz"
              >
                verifiable blockchain interactions
              </span>
              , persistent memory, and customizable personalities that evolve
              with you.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-6 mb-12"
              data-oid="a8nh3x."
            >
              <button
                onClick={handleConnectWallet}
                className="neural-button px-8 py-4 text-white font-bold text-lg rounded-xl flex items-center space-x-2 group"
                data-oid="63hdv_7"
              >
                <span data-oid="9hw2x17">🔗</span>
                <span data-oid="br1pg5v">Connect Wallet</span>
                <span
                  className="group-hover:translate-x-1 transition-transform"
                  data-oid="usx_b20"
                >
                  →
                </span>
              </button>
              <button
                className="px-8 py-4 border border-purple-500/30 text-purple-300 font-semibold rounded-xl hover:bg-purple-500/10 transition-all flex items-center space-x-2"
                data-oid="pgq7ogg"
              >
                <span data-oid="73il3l2">▶️</span>
                <span data-oid="q6sfal0">Watch Demo</span>
              </button>
            </div>

            {/* Stats */}
            <div
              className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-800"
              data-oid="rr--kpe"
            >
              <div className="text-center" data-oid="hd2hjdc">
                <div className="text-3xl font-bold" data-oid="0di3goh">
                  <AnimatedCounter end={12400} data-oid="kq0qvf9" />+
                </div>
                <div className="text-gray-400 text-sm" data-oid="o7648ag">
                  Active Users
                </div>
              </div>
              <div className="text-center" data-oid="r_jiuy3">
                <div className="text-3xl font-bold" data-oid="lpfbk2b">
                  <AnimatedCounter end={847} data-oid=".6c4:ee" />
                </div>
                <div className="text-gray-400 text-sm" data-oid="feo08d9">
                  AI Companions
                </div>
              </div>
              <div className="text-center" data-oid="ksit-gn">
                <div className="text-3xl font-bold" data-oid="yq9q3l5">
                  <AnimatedCounter end={2.4} data-oid="ffr4jl8" />M
                </div>
                <div className="text-gray-400 text-sm" data-oid="ba9am2h">
                  Conversations
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="relative" data-oid="fjf8fis">
            <div
              className="neural-card rounded-3xl p-8 backdrop-blur-xl"
              data-oid="a4rsr55"
            >
              <div
                className="code-block p-6 rounded-xl mb-6"
                data-oid="a_v5qvq"
              >
                <div
                  className="flex items-center space-x-2 mb-4"
                  data-oid="_b-iorf"
                >
                  <div
                    className="w-3 h-3 bg-red-500 rounded-full"
                    data-oid="tx30vsa"
                  ></div>
                  <div
                    className="w-3 h-3 bg-yellow-500 rounded-full"
                    data-oid="ap.vayh"
                  ></div>
                  <div
                    className="w-3 h-3 bg-green-500 rounded-full"
                    data-oid="zvunp76"
                  ></div>
                  <span
                    className="text-gray-400 text-sm ml-4"
                    data-oid="-qv6eyy"
                  >
                    MetaMuse Terminal
                  </span>
                </div>
                <div className="font-mono text-sm space-y-2" data-oid="k_hp-3h">
                  <div className="text-purple-400" data-oid="z-.ui.j">
                    $ metamuse create --personality curious
                  </div>
                  <div className="text-green-400" data-oid="sbq9key">
                    ✓ Initializing neural pathways...
                  </div>
                  <div className="text-cyan-400" data-oid="7qg1ce8">
                    ✓ Blockchain identity verified
                  </div>
                  <div className="text-yellow-400" data-oid="2t33tp2">
                    ⚡ Your AI companion is ready!
                  </div>
                  <div
                    className="text-gray-300 cursor-blink"
                    data-oid="l7dfj7v"
                  >
                    $ _
                  </div>
                </div>
              </div>

              <div className="space-y-4" data-oid="pcl7hhj">
                <div className="flex items-start space-x-4" data-oid="a0pw-vo">
                  <div
                    className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    data-oid="b6oym:x"
                  >
                    AI
                  </div>
                  <div
                    className="flex-1 bg-gray-800/50 rounded-lg p-4"
                    data-oid=":u29et_"
                  >
                    <p className="text-gray-300 text-sm" data-oid="4nbmct3">
                      Hello! I'm your new AI companion. I can remember our
                      conversations, learn from your preferences, and help you
                      with creative tasks. What would you like to explore
                      together?
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4" data-oid="qq8mf3k">
                  <div
                    className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    data-oid="hex_4kd"
                  >
                    You
                  </div>
                  <div
                    className="flex-1 bg-purple-500/20 rounded-lg p-4"
                    data-oid="4.uuz9a"
                  >
                    <p className="text-purple-200 text-sm" data-oid="mvubcp4">
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
        data-oid=".2aqx57"
      >
        <div className="text-center mb-20" data-oid="a22tt::">
          <div
            className="inline-block px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-mono mb-6"
            data-oid="ts9pawn"
          >
            🔬 Advanced Technology Stack
          </div>
          <h2
            className="text-5xl lg:text-6xl font-black mb-6 secondary-gradient-text"
            data-oid="tjqnqju"
          >
            Powered by AI & Blockchain
          </h2>
          <p
            className="text-xl text-gray-400 max-w-3xl mx-auto"
            data-oid="km-usa9"
          >
            Our cutting-edge technology stack combines the latest advances in
            artificial intelligence with blockchain security to create truly
            revolutionary AI companions.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8" data-oid="helra.:">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`neural-card rounded-3xl p-8 cursor-pointer transition-all duration-500 ${
                activeFeature === index ? "ring-2 ring-purple-500/50" : ""
              }`}
              onClick={() => setActiveFeature(index)}
              onMouseEnter={() => setActiveFeature(index)}
              data-oid="-o:13gy"
            >
              <div className="flex items-start space-x-6" data-oid="_3uv_bp">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}
                  data-oid="a2rqa5k"
                >
                  {feature.icon}
                </div>
                <div className="flex-1" data-oid="puz4x0e">
                  <div
                    className="flex items-center space-x-3 mb-3"
                    data-oid="cfdx7-s"
                  >
                    <h3
                      className="text-2xl font-bold text-white"
                      data-oid="i4grkw_"
                    >
                      {feature.title}
                    </h3>
                    <span
                      className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded font-mono"
                      data-oid="c9gc_qy"
                    >
                      {feature.tech}
                    </span>
                  </div>
                  <p
                    className="text-gray-300 leading-relaxed mb-4"
                    data-oid="evosvrj"
                  >
                    {feature.description}
                  </p>
                  <div
                    className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
                    data-oid="245l_gn"
                  >
                    <span className="text-sm font-semibold" data-oid="qap9w4a">
                      Learn more
                    </span>
                    <span className="ml-2" data-oid="5ow0dh7">
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
        data-oid="9t_6vz:"
      >
        <div className="hex-pattern rounded-3xl p-12" data-oid="o4eggpf">
          <div className="text-center mb-16" data-oid="deugzcv">
            <h2
              className="text-4xl font-bold text-white mb-4"
              data-oid="mlodncn"
            >
              Technical Architecture
            </h2>
            <p className="text-gray-300 text-lg" data-oid="ndu1-:z">
              Built for scale, security, and seamless integration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8" data-oid="wbq562p">
            <div className="text-center space-y-4" data-oid="34g0uer">
              <div
                className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto flex items-center justify-center text-3xl"
                data-oid="2q.4f21"
              >
                ⚡
              </div>
              <h3
                className="text-xl font-semibold text-white"
                data-oid="f.64i3c"
              >
                Lightning Fast
              </h3>
              <p className="text-gray-400" data-oid="s0o.j98">
                Sub-100ms response times with distributed computing
              </p>
            </div>

            <div className="text-center space-y-4" data-oid="mn2je7n">
              <div
                className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mx-auto flex items-center justify-center text-3xl"
                data-oid=":y8jimg"
              >
                🛡️
              </div>
              <h3
                className="text-xl font-semibold text-white"
                data-oid="n167585"
              >
                Enterprise Security
              </h3>
              <p className="text-gray-400" data-oid=":9_7o5y">
                End-to-end encryption with zero-knowledge proofs
              </p>
            </div>

            <div className="text-center space-y-4" data-oid="v9b8.sg">
              <div
                className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mx-auto flex items-center justify-center text-3xl"
                data-oid="vszd7fl"
              >
                🌐
              </div>
              <h3
                className="text-xl font-semibold text-white"
                data-oid="xy_:0e2"
              >
                Global Scale
              </h3>
              <p className="text-gray-400" data-oid="g393luf">
                Distributed across 50+ data centers worldwide
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced CTA */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 py-20"
        data-oid="c6ukyhr"
      >
        <div
          className="neural-card rounded-3xl p-16 text-center relative overflow-hidden"
          data-oid="5y6fpo1"
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10"
            data-oid="vvlq3j:"
          ></div>
          <div className="relative z-10" data-oid=".1y8._m">
            <div
              className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8"
              data-oid="z0kcv25"
            >
              🚀 Join the Future of AI
            </div>

            <h2
              className="text-5xl lg:text-6xl font-black mb-6 hero-gradient-text"
              data-oid="cf:p1zx"
            >
              Ready to Build Your
              <br data-oid="ohea1ap" />
              AI Companion?
            </h2>

            <p
              className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
              data-oid=":hg.zfj"
            >
              Join{" "}
              <span className="font-bold text-purple-400" data-oid="ubk1egf">
                12,400+
              </span>{" "}
              creators already building lasting relationships with their AI
              Muses. Start your journey into the future of companionship.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
              data-oid="0vev2sc"
            >
              <button
                onClick={handleConnectWallet}
                className="neural-button px-12 py-5 text-white font-bold text-xl rounded-xl flex items-center space-x-3 group"
                data-oid="0daom03"
              >
                <span data-oid="t6nylvy">🚀</span>
                <span data-oid="-a:w8uf">Launch Your Muse</span>
                <span
                  className="group-hover:translate-x-1 transition-transform"
                  data-oid="z_2smqk"
                >
                  →
                </span>
              </button>
              <button
                className="px-12 py-5 border-2 border-purple-500/50 text-purple-300 font-bold text-xl rounded-xl hover:bg-purple-500/10 transition-all"
                data-oid="2kdr654"
              >
                View Documentation
              </button>
            </div>

            <div className="text-sm text-gray-400 space-x-6" data-oid="-iw76x6">
              <span data-oid="nm.hwo_">✓ No setup fees</span>
              <span data-oid="5tnbaey">✓ 30-day free trial</span>
              <span data-oid="xbk2d9_">✓ Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="relative z-10 border-t border-gray-800/50 backdrop-blur-sm"
        data-oid="3z5qk-q"
      >
        <div className="max-w-7xl mx-auto px-4 py-16" data-oid="b1._i7r">
          <div className="grid md:grid-cols-4 gap-8 mb-12" data-oid="badmqlm">
            <div data-oid="09bq4cr">
              <div
                className="flex items-center space-x-3 mb-6"
                data-oid="is3.9rv"
              >
                <div
                  className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white"
                  data-oid=":f8vvii"
                >
                  M
                </div>
                <span
                  className="text-xl font-bold text-white"
                  data-oid="rir3j_t"
                >
                  MetaMuse
                </span>
              </div>
              <p className="text-gray-400 mb-6" data-oid="5a2erva">
                Building the future of AI companions on blockchain technology.
              </p>
              <div className="flex space-x-4" data-oid="llj4zoj">
                {["🐦", "📘", "💼", "📸"].map((emoji, index) => (
                  <div
                    key={index}
                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    data-oid="nb3arlr"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "API", "Documentation"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Contact"],
              },
              {
                title: "Resources",
                links: ["Help Center", "Community", "Guides", "Status"],
              },
            ].map((section, index) => (
              <div key={index} data-oid="dwf2.:-">
                <h4
                  className="text-white font-semibold mb-6"
                  data-oid="zqug34t"
                >
                  {section.title}
                </h4>
                <ul className="space-y-4" data-oid="ionkgqd">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex} data-oid="rz9eyvf">
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors"
                        data-oid="aog1otf"
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
            data-oid="6z775v8"
          >
            <p className="text-gray-400 mb-4 md:mb-0" data-oid="7wqgf4o">
              © 2024 MetaMuses. All rights reserved. Built with ❤️ for the
              future.
            </p>
            <div
              className="flex space-x-6 text-gray-400 text-sm"
              data-oid="swk_6ng"
            >
              <a
                href="#"
                className="hover:text-white transition-colors"
                data-oid="j7_x6h7"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors"
                data-oid="mduj6o4"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors"
                data-oid=":-bhp80"
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
