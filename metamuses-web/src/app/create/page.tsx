"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// Interactive Neural Network Background
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
    const nodeCount = 50;

    // Initialize nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
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
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 92, 246, 0.6)";
        ctx.fill();

        // Draw connections
        nodes.slice(i + 1).forEach((otherNode) => {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.3 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
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
      className="absolute inset-0 pointer-events-none opacity-30"
      data-oid="2nkv09g"
    />
  );
};

// Immersive Personality Trait Designer
const PersonalityDesigner = ({
  personality,
  setPersonality,
  onTraitChange,
}: {
  personality: any;
  setPersonality: (p: any) => void;
  onTraitChange?: (trait: string, value: number) => void;
}) => {
  const [activeTraitIndex, setActiveTraitIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const traits = [
    {
      key: "creativity",
      name: "Creativity",
      icon: "🎨",
      color: "purple",
      description: "Imagination and innovative thinking",
      examples: [
        "Artistic expression",
        "Novel solutions",
        "Creative storytelling",
      ],

      gradient: "from-purple-500 via-pink-500 to-purple-600",
    },
    {
      key: "wisdom",
      name: "Wisdom",
      icon: "🧙‍♂️",
      color: "blue",
      description: "Deep understanding and insight",
      examples: ["Philosophical depth", "Life guidance", "Thoughtful analysis"],
      gradient: "from-blue-500 via-cyan-500 to-blue-600",
    },
    {
      key: "humor",
      name: "Humor",
      icon: "😄",
      color: "orange",
      description: "Wit and playful communication",
      examples: ["Clever jokes", "Playful banter", "Light-hearted moments"],
      gradient: "from-orange-500 via-yellow-500 to-orange-600",
    },
    {
      key: "empathy",
      name: "Empathy",
      icon: "💝",
      color: "green",
      description: "Emotional understanding and support",
      examples: [
        "Active listening",
        "Emotional support",
        "Compassionate responses",
      ],

      gradient: "from-green-500 via-teal-500 to-green-600",
    },
  ];

  const handleTraitChange = (traitKey: string, value: number) => {
    setIsAnimating(true);
    setPersonality({ ...personality, [traitKey]: value });
    onTraitChange?.(traitKey, value);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const getPersonalityArchetype = () => {
    const { creativity, wisdom, humor, empathy } = personality;
    const dominant = Math.max(creativity, wisdom, humor, empathy);

    if (dominant === creativity && creativity > 70)
      return {
        name: "The Visionary",
        desc: "Boundless imagination meets practical innovation",
      };
    if (dominant === wisdom && wisdom > 70)
      return { name: "The Sage", desc: "Deep wisdom guides every interaction" };
    if (dominant === humor && humor > 70)
      return {
        name: "The Entertainer",
        desc: "Joy and laughter light up conversations",
      };
    if (dominant === empathy && empathy > 70)
      return {
        name: "The Healer",
        desc: "Compassion and understanding flow naturally",
      };

    const balanced =
      Math.abs(creativity - wisdom) < 20 && Math.abs(humor - empathy) < 20;
    if (balanced)
      return {
        name: "The Harmonist",
        desc: "Perfect balance across all dimensions",
      };

    return {
      name: "The Explorer",
      desc: "A unique blend waiting to be discovered",
    };
  };

  const archetype = getPersonalityArchetype();

  return (
    <div className="space-y-8" data-oid="i:mody3">
      {/* Personality Archetype Display */}
      <div
        className="neural-card rounded-3xl p-8 text-center relative overflow-hidden"
        data-oid="o.a1i81"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"
          data-oid="qepf101"
        />

        <div className="relative z-10" data-oid="bgt.p59">
          <div
            className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl shadow-2xl"
            data-oid="m-7wi8g"
          >
            🧠
          </div>
          <h3 className="text-3xl font-bold text-white mb-2" data-oid="bqth-dr">
            {archetype.name}
          </h3>
          <p className="text-gray-300 text-lg mb-6" data-oid="7jr9.k_">
            {archetype.desc}
          </p>

          {/* Personality Radar */}
          <div
            className="grid grid-cols-4 gap-4 max-w-md mx-auto"
            data-oid=".mj1cie"
          >
            {traits.map((trait) => (
              <div key={trait.key} className="text-center" data-oid="gu63pfz">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${trait.gradient} rounded-xl mx-auto mb-2 flex items-center justify-center text-xl shadow-lg`}
                  data-oid="oxei_-k"
                >
                  {trait.icon}
                </div>
                <div
                  className="text-2xl font-bold text-white"
                  data-oid="9husr7v"
                >
                  {personality[trait.key]}
                </div>
                <div className="text-xs text-gray-400" data-oid="yhkr2.a">
                  {trait.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Trait Designer */}
      <div className="grid lg:grid-cols-2 gap-8" data-oid="dz19i5c">
        {/* Trait Selection */}
        <div className="space-y-4" data-oid="urz928l">
          {traits.map((trait, index) => (
            <div
              key={trait.key}
              className={`neural-card rounded-2xl p-6 cursor-pointer transition-all duration-500 ${
                activeTraitIndex === index
                  ? "ring-2 ring-purple-500/50 bg-purple-500/10 scale-105"
                  : "hover:scale-102"
              }`}
              onClick={() => setActiveTraitIndex(index)}
              data-oid="iewg66_"
            >
              <div className="flex items-center space-x-4" data-oid="n36y6b0">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${trait.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}
                  data-oid="gap88wc"
                >
                  {trait.icon}
                </div>
                <div className="flex-1" data-oid="rsk1.t2">
                  <div
                    className="flex items-center justify-between mb-2"
                    data-oid="w8gqssn"
                  >
                    <h4
                      className="text-xl font-bold text-white"
                      data-oid="puff4sv"
                    >
                      {trait.name}
                    </h4>
                    <div
                      className="text-2xl font-mono font-bold text-purple-400"
                      data-oid="5.a.qa3"
                    >
                      {personality[trait.key]}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-3" data-oid="4h6c36y">
                    {trait.description}
                  </p>

                  {/* Mini progress bar */}
                  <div
                    className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"
                    data-oid="agqzqaa"
                  >
                    <div
                      className={`h-full bg-gradient-to-r ${trait.gradient} rounded-full transition-all duration-700`}
                      style={{ width: `${personality[trait.key]}%` }}
                      data-oid="sloeqb."
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Trait Editor */}
        <div className="neural-card rounded-3xl p-8" data-oid="dsdrsrz">
          <div className="text-center mb-8" data-oid="wqrlbu7">
            <div
              className={`w-24 h-24 bg-gradient-to-br ${traits[activeTraitIndex].gradient} rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl shadow-2xl`}
              data-oid="wpo8p:9"
            >
              {traits[activeTraitIndex].icon}
            </div>
            <h3
              className="text-3xl font-bold text-white mb-2"
              data-oid="7x2svjl"
            >
              {traits[activeTraitIndex].name}
            </h3>
            <p className="text-gray-300" data-oid="brclqip">
              {traits[activeTraitIndex].description}
            </p>
          </div>

          {/* Advanced Slider */}
          <div className="mb-8" data-oid="u45qiqm">
            <div
              className="flex justify-between items-center mb-4"
              data-oid="94tdl18"
            >
              <span className="text-gray-400" data-oid="4jkr1px">
                Intensity
              </span>
              <span
                className="text-3xl font-mono font-bold text-white"
                data-oid=":euhxzg"
              >
                {personality[traits[activeTraitIndex].key]}
              </span>
            </div>

            <div className="relative" data-oid="c-y0ns3">
              <input
                type="range"
                min="0"
                max="100"
                value={personality[traits[activeTraitIndex].key]}
                onChange={(e) =>
                  handleTraitChange(
                    traits[activeTraitIndex].key,
                    parseInt(e.target.value),
                  )
                }
                className="w-full h-4 bg-gray-700 rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, 
                    rgb(75, 85, 99) 0%, 
                    rgb(75, 85, 99) ${personality[traits[activeTraitIndex].key]}%, 
                    transparent ${personality[traits[activeTraitIndex].key]}%, 
                    transparent 100%),
                    linear-gradient(to right, ${traits[activeTraitIndex].gradient.replace("from-", "").replace("via-", ", ").replace("to-", ", ")})`,
                }}
                data-oid="zlg0e3u"
              />

              {/* Slider markers */}
              <div
                className="flex justify-between text-xs text-gray-500 mt-2"
                data-oid="q719.bp"
              >
                <span data-oid="jh8nwj_">Minimal</span>
                <span data-oid="h5pobf-">Moderate</span>
                <span data-oid="ddqhocx">Strong</span>
                <span data-oid="x4qego3">Dominant</span>
              </div>
            </div>
          </div>

          {/* Trait Examples */}
          <div data-oid=":n5mgwd">
            <h4
              className="text-lg font-semibold text-white mb-4"
              data-oid="fb1vt_l"
            >
              This trait enables:
            </h4>
            <div className="space-y-2" data-oid="s2grzc-">
              {traits[activeTraitIndex].examples.map((example, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 text-gray-300"
                  data-oid="h5_lbf0"
                >
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full"
                    data-oid="ucnykny"
                  />

                  <span data-oid="xm-zy8t">{example}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Personality Presets */}
      <div className="neural-card rounded-2xl p-6" data-oid="-35.zlh">
        <h4
          className="text-xl font-bold text-white mb-6 flex items-center"
          data-oid="w7bo.f6"
        >
          <span className="mr-3" data-oid="1s5adf2">
            ⚡
          </span>
          Quick Personality Presets
        </h4>
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          data-oid="5uvu5q7"
        >
          {[
            {
              name: "Balanced",
              values: { creativity: 50, wisdom: 50, humor: 50, empathy: 50 },
              icon: "⚖️",
            },
            {
              name: "Creative Genius",
              values: { creativity: 90, wisdom: 60, humor: 70, empathy: 50 },
              icon: "🎨",
            },
            {
              name: "Wise Mentor",
              values: { creativity: 40, wisdom: 95, humor: 30, empathy: 85 },
              icon: "🧙‍♂️",
            },
            {
              name: "Cheerful Companion",
              values: { creativity: 60, wisdom: 50, humor: 95, empathy: 80 },
              icon: "😄",
            },
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() => setPersonality(preset.values)}
              className="neural-card rounded-xl p-4 text-center hover:scale-105 transition-all duration-300 group"
              data-oid="81ma2di"
            >
              <div className="text-3xl mb-2" data-oid="s77_:bs">
                {preset.icon}
              </div>
              <div
                className="text-white font-semibold text-sm"
                data-oid="al016xu"
              >
                {preset.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Immersive Step Navigation
const StepNavigation = ({
  currentStep,
  totalSteps,
  onStepChange,
  stepTitles,
}: {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  stepTitles: string[];
}) => {
  return (
    <div
      className="fixed left-8 top-1/2 transform -translate-y-1/2 z-30 hidden lg:block"
      data-oid="d9gagkx"
    >
      <div
        className="neural-card rounded-2xl p-4 backdrop-blur-xl"
        data-oid="6dm9j7m"
      >
        <div className="space-y-4" data-oid="5kawjgb">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={`group cursor-pointer transition-all duration-300 ${
                step <= currentStep ? "opacity-100" : "opacity-40"
              }`}
              onClick={() => step <= currentStep && onStepChange(step)}
              data-oid="5ltxf5h"
            >
              <div className="flex items-center space-x-3" data-oid="dk5mus.">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    step === currentStep
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-110 shadow-lg"
                      : step < currentStep
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-400"
                  }`}
                  data-oid="6w5l86x"
                >
                  {step < currentStep ? "✓" : step}
                </div>
                <div
                  className={`text-xs transition-all duration-300 ${
                    step === currentStep
                      ? "text-white opacity-100"
                      : "text-gray-400 opacity-0 group-hover:opacity-100"
                  }`}
                  data-oid="hq5ny6w"
                >
                  {stepTitles[step - 1]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Immersive Template Selection
const TemplateSelector = ({
  templates,
  selectedTemplate,
  onSelect,
}: {
  templates: any[];
  selectedTemplate: string | null;
  onSelect: (id: string) => void;
}) => {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  return (
    <div className="space-y-8" data-oid="fo8jmqu">
      {/* Template Categories */}
      <div className="text-center mb-12" data-oid="qsht_za">
        <div
          className="inline-flex bg-gray-800/50 rounded-2xl p-2 backdrop-blur-sm"
          data-oid="r0f:dfu"
        >
          {["Popular", "Creative", "Professional", "Custom"].map(
            (category, idx) => (
              <button
                key={category}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  idx === 0
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
                data-oid="-u4ml_w"
              >
                {category}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid md:grid-cols-3 gap-8" data-oid="ieqhe62">
        {templates.map((template, index) => (
          <div
            key={template.id}
            className={`neural-card rounded-3xl p-8 cursor-pointer transition-all duration-700 relative overflow-hidden group ${
              selectedTemplate === template.id
                ? "ring-2 ring-purple-500/50 bg-purple-500/10 scale-105"
                : hoveredTemplate === template.id
                  ? "scale-105 shadow-2xl"
                  : "hover:scale-102"
            }`}
            style={{ animationDelay: `${index * 150}ms` }}
            onClick={() => onSelect(template.id)}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
            data-oid="rjp5s_i"
          >
            {/* Animated background */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              data-oid="fk80vjt"
            />

            {/* Popular badge */}
            {template.popular && (
              <div
                className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-2 rounded-full transform rotate-12 shadow-lg"
                data-oid="ebks7zg"
              >
                🔥 Popular
              </div>
            )}

            <div className="relative z-10 text-center" data-oid="ox1e2vx">
              {/* Icon */}
              <div
                className={`w-24 h-24 bg-gradient-to-br ${template.gradient} rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-110`}
                data-oid="_nbjpw_"
              >
                {template.icon}
              </div>

              {/* Title */}
              <h3
                className="text-2xl font-bold text-white mb-4 group-hover:text-purple-200 transition-colors"
                data-oid="7h48hlc"
              >
                {template.title}
              </h3>

              {/* Description */}
              <p
                className="text-gray-400 mb-6 leading-relaxed"
                data-oid="dpqpb:8"
              >
                {template.description}
              </p>

              {/* Features */}
              <div className="space-y-3 mb-6" data-oid="ab_vug0">
                {template.features.map((feature: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center space-x-2 text-sm"
                    data-oid="0exsm.w"
                  >
                    <div
                      className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                      data-oid="a8uol78"
                    />

                    <span className="text-gray-300" data-oid="i_u64:4">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Selection indicator */}
              <div
                className={`w-full h-1 bg-gradient-to-r ${template.gradient} rounded-full transition-all duration-500 ${
                  selectedTemplate === template.id
                    ? "opacity-100 scale-110"
                    : "opacity-50 group-hover:opacity-100"
                }`}
                data-oid="048vp1d"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Avatar Component
const AvatarPreview = ({
  avatar,
  size = "large",
}: {
  avatar: any;
  size?: "small" | "large";
}) => {
  const sizeClasses = size === "large" ? "w-32 h-32" : "w-12 h-12";

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center relative overflow-hidden`}
      data-oid="nquu07s"
    >
      {avatar.pattern && (
        <div
          className={`absolute inset-0 ${avatar.pattern} opacity-30`}
          data-oid="3316-y3"
        />
      )}
      <div
        className="relative z-10 text-white font-bold text-2xl"
        data-oid="_t4i-yl"
      >
        {avatar.initial}
      </div>
    </div>
  );
};

// Advanced Avatar Creator
const AvatarCreator = ({
  generatedAvatar,
  selectedAvatar,
  onAvatarSelect,
  personality,
}: {
  generatedAvatar: any;
  selectedAvatar: any;
  onAvatarSelect: (avatar: any) => void;
  personality: any;
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [avatarVariations, setAvatarVariations] = useState<any[]>([]);

  useEffect(() => {
    // Generate avatar variations based on personality
    const variations = [
      { ...generatedAvatar, name: "Personality Match", type: "generated" },
      {
        gradient: "from-indigo-500 to-purple-600",
        initial: "A",
        name: "Mystic",
        type: "preset",
      },
      {
        gradient: "from-emerald-500 to-teal-600",
        initial: "N",
        name: "Nature",
        type: "preset",
      },
      {
        gradient: "from-rose-500 to-pink-600",
        initial: "S",
        name: "Sunset",
        type: "preset",
      },
    ];

    setAvatarVariations(variations);
  }, [generatedAvatar]);

  const generateNewAvatar = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Simulate avatar generation
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-8" data-oid="7t7xzan">
      {/* Current Avatar Preview */}
      <div
        className="neural-card rounded-3xl p-12 text-center relative overflow-hidden"
        data-oid="k1a2ja9"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"
          data-oid="9f9ecqn"
        />

        <div className="relative z-10" data-oid="3wkz688">
          <h3 className="text-3xl font-bold text-white mb-8" data-oid="ncje6qh">
            Your Avatar
          </h3>

          <div
            className="flex items-center justify-center space-x-12 mb-8"
            data-oid="lvayzok"
          >
            {/* Large avatar preview */}
            <div className="relative" data-oid="ov1h6.f">
              <div
                className={`w-32 h-32 rounded-full bg-gradient-to-br ${generatedAvatar?.gradient} flex items-center justify-center shadow-2xl`}
                data-oid="q2c9-lh"
              >
                <span
                  className="text-5xl font-bold text-white"
                  data-oid="b55bxt0"
                >
                  {generatedAvatar?.initial}
                </span>
              </div>
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full animate-pulse"
                data-oid="-jwtg2."
              />
            </div>

            {/* Avatar info */}
            <div className="text-left" data-oid="q607c_s">
              <h4
                className="text-2xl font-bold text-white mb-2"
                data-oid="9smo_ys"
              >
                {generatedAvatar?.name}
              </h4>
              <p className="text-gray-400 mb-4" data-oid="3qu29rt">
                Generated from your personality traits
              </p>

              {/* Personality influence */}
              <div className="space-y-2" data-oid="npy_uf:">
                <div className="text-sm text-gray-300" data-oid="jplcdsq">
                  Influenced by:
                </div>
                {Object.entries(personality).map(([trait, value]) => (
                  <div
                    key={trait}
                    className="flex items-center space-x-2 text-xs"
                    data-oid="hhebbo6"
                  >
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full"
                      data-oid="8gl9kg2"
                    />

                    <span
                      className="text-gray-400 capitalize"
                      data-oid="2fqhij7"
                    >
                      {trait}: {value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={generateNewAvatar}
            disabled={isGenerating}
            className="neural-button px-8 py-3 text-white font-semibold rounded-xl hover:scale-105 transition-all"
            data-oid="15:wjqq"
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2" data-oid="nnfgqai">
                <div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  data-oid="qvslkjo"
                />

                <span data-oid="ad0fj0l">Generating...</span>
              </div>
            ) : (
              "🎲 Generate New Avatar"
            )}
          </button>
        </div>
      </div>

      {/* Avatar Variations */}
      <div className="grid md:grid-cols-4 gap-6" data-oid="5bx_vhk">
        {avatarVariations.map((avatar, index) => (
          <div
            key={index}
            className={`neural-card rounded-2xl p-6 cursor-pointer text-center transition-all duration-500 hover:scale-105 ${
              selectedAvatar?.name === avatar.name
                ? "ring-2 ring-purple-500/50 bg-purple-500/10"
                : ""
            }`}
            onClick={() => onAvatarSelect(avatar)}
            data-oid="rf8ln20"
          >
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatar.gradient} mx-auto mb-4 flex items-center justify-center shadow-lg`}
              data-oid="t.rqovd"
            >
              <span
                className="text-2xl font-bold text-white"
                data-oid="qe0hp4p"
              >
                {avatar.initial}
              </span>
            </div>
            <h4 className="text-white font-semibold mb-2" data-oid="_kj-mdq">
              {avatar.name}
            </h4>
            <span
              className="text-xs text-gray-400 capitalize"
              data-oid="--g6n4:"
            >
              {avatar.type}
            </span>
          </div>
        ))}
      </div>

      {/* Custom Upload Option */}
      <div
        className="neural-card rounded-2xl p-8 text-center border-2 border-dashed border-gray-600 hover:border-purple-500 transition-colors cursor-pointer"
        data-oid="m98v-lc"
      >
        <div
          className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
          data-oid="4m8lr-o"
        >
          📁
        </div>
        <h4 className="text-white font-semibold mb-2" data-oid=".yp2n-o">
          Upload Custom Avatar
        </h4>
        <p className="text-gray-400 text-sm" data-oid="60j.ysp">
          Drag & drop or click to upload your own image
        </p>
      </div>
    </div>
  );
};

export default function CreateMusePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [personality, setPersonality] = useState({
    creativity: 50,
    wisdom: 50,
    humor: 50,
    empathy: 50,
  });
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null);
  const [generatedAvatar, setGeneratedAvatar] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [museName, setMuseName] = useState("");
  const [museDescription, setMuseDescription] = useState("");

  // Generate avatar based on personality
  useEffect(() => {
    const generateAvatar = () => {
      const { creativity, wisdom, humor, empathy } = personality;
      const dominant = Math.max(creativity, wisdom, humor, empathy);

      let gradient = "from-purple-500 to-pink-500";
      let pattern = "";
      let initial = "#";

      if (dominant === creativity) {
        gradient = "from-purple-500 to-pink-500";
        initial = "C";
        pattern = "bg-gradient-to-br";
      } else if (dominant === wisdom) {
        gradient = "from-blue-500 to-cyan-500";
        initial = "W";
        pattern = "bg-gradient-to-tr";
      } else if (dominant === humor) {
        gradient = "from-orange-500 to-yellow-500";
        initial = "H";
        pattern = "bg-gradient-to-tl";
      } else {
        gradient = "from-green-500 to-teal-500";
        initial = "E";
        pattern = "bg-gradient-to-bl";
      }

      setGeneratedAvatar({
        gradient,
        pattern,
        initial,
        name: "Balanced Harmony",
      });
    };

    generateAvatar();
  }, [personality]);

  const templates = [
    {
      id: "browse",
      title: "Browse Templates",
      description: "Choose from community and official templates",
      icon: "🎭",
      gradient: "from-purple-500 to-purple-600",
      features: ["50+ Templates", "Community Rated", "Instant Setup"],
      popular: true,
    },
    {
      id: "custom",
      title: "Create Custom",
      description: "Build your own template from scratch",
      icon: "🎨",
      gradient: "from-blue-500 to-blue-600",
      features: ["Full Control", "Unique Personality", "Advanced Options"],
      popular: false,
    },
    {
      id: "skip",
      title: "Skip Templates",
      description: "Continue with personality design",
      icon: "⚡",
      gradient: "from-green-500 to-green-600",
      features: ["Quick Start", "Default Settings", "Easy Setup"],
      popular: false,
    },
  ];

  const stepTitles = [
    "Template",
    "Personality",
    "Avatar",
    "Identity",
    "Deploy",
  ];

  const stepDescriptions = [
    "Choose a starting template or begin with a blank canvas",
    "Design your AI companion's core personality traits",
    "Create a unique visual identity for your muse",
    "Define name, backstory, and behavioral patterns",
    "Deploy your muse to the blockchain as an NFT",
  ];

  const sampleResponses = [
    {
      user: "Tell me a joke",
      response:
        "Here's a light one: What do you call a fake noodle? An impasta! *chuckles softly* Not too bad, right?",
    },
    {
      user: "I'm feeling stressed",
      response:
        "That sounds challenging. What's causing the stress? I'd like to help you work through it step by step.",
    },
    {
      user: "What's the meaning of life?",
      response:
        "That's a profound philosophical question. Different perspectives throughout history have offered various interpretations. What aspects resonate most with you?",
    },
  ];

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateMuse = async () => {
    setIsCreating(true);
    // Simulate blockchain transaction
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsCreating(false);
    // Redirect or show success
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="max-w-7xl mx-auto" data-oid="gl_o2w9">
            <TemplateSelector
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelect={setSelectedTemplate}
              data-oid="_487rwl"
            />

            <div className="text-center mt-12" data-oid="3u-b::4">
              <button
                onClick={handleNext}
                disabled={!selectedTemplate}
                className={`neural-button px-16 py-5 text-white font-bold text-xl rounded-2xl transition-all duration-500 ${
                  selectedTemplate
                    ? "hover:scale-105 shadow-2xl shadow-purple-500/30"
                    : "opacity-50 cursor-not-allowed"
                }`}
                data-oid="87kkrez"
              >
                {selectedTemplate
                  ? "Continue with Selection"
                  : "Select a Template to Continue"}
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="max-w-7xl mx-auto" data-oid="ewdqvpy">
            <PersonalityDesigner
              personality={personality}
              setPersonality={setPersonality}
              onTraitChange={(trait, value) => {
                // Add any additional logic for trait changes
                console.log(`${trait} changed to ${value}`);
              }}
              data-oid="ist2aqr"
            />

            <div
              className="flex justify-center space-x-6 mt-12"
              data-oid="9vlas2-"
            >
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
                data-oid="jlzv1ma"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-16 py-4 text-white font-bold text-xl rounded-xl hover:scale-105 transition-all"
                data-oid="j6fyhfg"
              >
                Continue to Avatar →
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="max-w-7xl mx-auto" data-oid="dcwew-n">
            <AvatarCreator
              generatedAvatar={generatedAvatar}
              selectedAvatar={selectedAvatar}
              onAvatarSelect={setSelectedAvatar}
              personality={personality}
              data-oid="pmf5s20"
            />

            <div
              className="flex justify-center space-x-6 mt-12"
              data-oid="7f_ks0h"
            >
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
                data-oid="-9xas:v"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-16 py-4 text-white font-bold text-xl rounded-xl hover:scale-105 transition-all"
                data-oid="d0hi_g4"
              >
                Continue to Identity →
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="max-w-4xl mx-auto space-y-8" data-oid="33:dny7">
            {/* Muse Identity Form */}
            <div className="neural-card rounded-3xl p-8" data-oid="3r_4mj8">
              <h3
                className="text-3xl font-bold text-white mb-8 text-center"
                data-oid="1lu-juo"
              >
                Define Your Muse's Identity
              </h3>

              <div className="space-y-6" data-oid="v-salll">
                {/* Name Input */}
                <div data-oid="f:6_wg3">
                  <label
                    className="block text-white font-semibold mb-3"
                    data-oid="nug66os"
                  >
                    Muse Name
                  </label>
                  <input
                    type="text"
                    value={museName}
                    onChange={(e) => setMuseName(e.target.value)}
                    placeholder="Enter your muse's name..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-lg"
                    data-oid="nb3:h_-"
                  />
                </div>

                {/* Description Input */}
                <div data-oid="t.k40p4">
                  <label
                    className="block text-white font-semibold mb-3"
                    data-oid="vkz-rgo"
                  >
                    Personality Description
                  </label>
                  <textarea
                    value={museDescription}
                    onChange={(e) => setMuseDescription(e.target.value)}
                    placeholder="Describe your muse's personality, interests, and unique traits..."
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                    data-oid="3gpne06"
                  />
                </div>

                {/* Behavioral Settings */}
                <div className="grid md:grid-cols-2 gap-6" data-oid="yt8fr5p">
                  <div data-oid="t2ugb0.">
                    <label
                      className="block text-white font-semibold mb-3"
                      data-oid=".hjjao5"
                    >
                      Communication Style
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      data-oid="bo.6ae_"
                    >
                      <option data-oid="sxm5hjk">Casual & Friendly</option>
                      <option data-oid="zedpaqd">Professional & Formal</option>
                      <option data-oid="3j7pd6f">Playful & Energetic</option>
                      <option data-oid="tsfq790">Calm & Thoughtful</option>
                    </select>
                  </div>

                  <div data-oid=".jhhhfl">
                    <label
                      className="block text-white font-semibold mb-3"
                      data-oid="fvh-.ip"
                    >
                      Response Length
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      data-oid="2966i4t"
                    >
                      <option data-oid="dpguwpa">Concise</option>
                      <option data-oid="2k7udyc">Balanced</option>
                      <option data-oid="p02q8tq">Detailed</option>
                      <option data-oid="1n4um3v">Comprehensive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="neural-card rounded-3xl p-8" data-oid="i74mp5a">
              <h4
                className="text-2xl font-bold text-white mb-6 text-center"
                data-oid="l4o.sh0"
              >
                Preview
              </h4>
              <div
                className="flex items-center space-x-6 p-6 bg-gray-800/30 rounded-2xl"
                data-oid="n2-2me."
              >
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${generatedAvatar?.gradient} flex items-center justify-center shadow-lg`}
                  data-oid="ipk0b77"
                >
                  <span
                    className="text-2xl font-bold text-white"
                    data-oid="cjx.:i3"
                  >
                    {generatedAvatar?.initial}
                  </span>
                </div>
                <div className="flex-1" data-oid="so5sb6l">
                  <h5
                    className="text-2xl font-bold text-white mb-2"
                    data-oid="ga0cubv"
                  >
                    {museName || "Your Muse"}
                  </h5>
                  <p className="text-gray-400 mb-3" data-oid="3-xg77l">
                    {museDescription ||
                      "A unique AI companion with a carefully crafted personality."}
                  </p>
                  <div className="flex space-x-4 text-sm" data-oid="tq7seha">
                    {Object.entries(personality).map(([trait, value]) => (
                      <div
                        key={trait}
                        className="flex items-center space-x-1"
                        data-oid="8mw-mh3"
                      >
                        <span
                          className="text-gray-500 capitalize"
                          data-oid="1c2zix7"
                        >
                          {trait}:
                        </span>
                        <span
                          className="text-purple-400 font-bold"
                          data-oid="6m-w_-x"
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-6" data-oid="r:6zbvf">
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
                data-oid="-bj:5-v"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={!museName.trim()}
                className={`neural-button px-16 py-4 text-white font-bold text-xl rounded-xl transition-all ${
                  museName.trim()
                    ? "hover:scale-105"
                    : "opacity-50 cursor-not-allowed"
                }`}
                data-oid="ez58hr3"
              >
                Deploy Muse →
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="max-w-6xl mx-auto" data-oid="nnc40-q">
            <div className="grid lg:grid-cols-2 gap-8 mb-12" data-oid="-.o.vdk">
              {/* Avatar and Personality Summary */}
              <div className="neural-card rounded-2xl p-8" data-oid="3t3f4-u">
                <div
                  className="flex items-center justify-center space-x-8 mb-8"
                  data-oid="l3cmfo5"
                >
                  <AvatarPreview avatar={generatedAvatar} data-oid="v9dtimk" />
                  <div
                    className="flex flex-col items-center space-y-2"
                    data-oid="of0_k5z"
                  >
                    <div
                      className="text-4xl font-mono text-purple-400"
                      data-oid="6vp-yag"
                    >
                      #preview
                    </div>
                    <AvatarPreview
                      avatar={generatedAvatar}
                      size="small"
                      data-oid="n27etzw"
                    />
                  </div>
                </div>

                <h3
                  className="text-2xl font-semibold text-white text-center mb-2"
                  data-oid="9qyhlkg"
                >
                  {generatedAvatar?.name || "Balanced Harmony"}
                </h3>
                <p
                  className="text-gray-400 text-center mb-8"
                  data-oid="v9_jdo_"
                >
                  All aspects of being flow together in perfect equilibrium,
                  adaptable to any moment.
                </p>

                <div className="space-y-4" data-oid="cxrt1to">
                  {Object.entries(personality).map(([trait, value]) => (
                    <div
                      key={trait}
                      className="flex items-center justify-between"
                      data-oid="5-vdocv"
                    >
                      <span
                        className="text-white capitalize font-medium"
                        data-oid="jsw5n3j"
                      >
                        {trait}
                      </span>
                      <div
                        className="flex items-center space-x-3"
                        data-oid="98-2.:t"
                      >
                        <div
                          className="w-24 h-2 bg-gray-700 rounded-full"
                          data-oid="75r7aj-"
                        >
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${
                              trait === "creativity"
                                ? "from-purple-500 to-pink-500"
                                : trait === "wisdom"
                                  ? "from-blue-500 to-cyan-500"
                                  : trait === "humor"
                                    ? "from-orange-500 to-yellow-500"
                                    : "from-green-500 to-teal-500"
                            }`}
                            style={{ width: `${value}%` }}
                            data-oid="01__mgj"
                          />
                        </div>
                        <span
                          className="text-white font-mono font-bold text-lg w-8"
                          data-oid="mjn:ar5"
                        >
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Responses */}
              <div data-oid="tbejhjx">
                <h3
                  className="text-2xl font-semibold text-white mb-6 flex items-center"
                  data-oid="ons-lv7"
                >
                  <span className="text-2xl mr-2" data-oid="17oh_xf">
                    ✨
                  </span>
                  Sample Responses
                </h3>

                <div className="space-y-4" data-oid="9t:6id_">
                  {sampleResponses.map((sample, index) => (
                    <div
                      key={index}
                      className="neural-card rounded-xl p-4"
                      data-oid="99ckbyc"
                    >
                      <div
                        className="flex items-start space-x-3 mb-3"
                        data-oid="be6_d-i"
                      >
                        <div
                          className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs"
                          data-oid="efa3x56"
                        >
                          👤
                        </div>
                        <div className="text-gray-300" data-oid="rl3t79p">
                          User: "{sample.user}"
                        </div>
                      </div>
                      <div
                        className="pl-9 text-gray-200 leading-relaxed"
                        data-oid="zsub2i0"
                      >
                        {sample.response}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4" data-oid="5zvz5jq">
              <button
                onClick={handleBack}
                className="px-8 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
                data-oid="rzppeux"
              >
                Back to Avatar
              </button>
              <button
                onClick={() => {
                  /* Test interaction */
                }}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all"
                data-oid="h85umvv"
              >
                Test Interaction
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-8 py-3 text-white font-semibold rounded-xl"
                data-oid="j84.3:o"
              >
                Create Muse
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="max-w-2xl mx-auto text-center" data-oid="9lbj8r0">
            <div
              className="neural-card rounded-2xl p-12 mb-8"
              data-oid="na59blr"
            >
              <h3
                className="text-2xl font-semibold text-white mb-8"
                data-oid="z6a7885"
              >
                Transaction Details
              </h3>

              <div className="space-y-6 text-left" data-oid="7pwyr6_">
                <div
                  className="flex justify-between items-center"
                  data-oid="g3o72ul"
                >
                  <span className="text-gray-400" data-oid="wo6kp44">
                    Network:
                  </span>
                  <span className="text-white font-mono" data-oid="1ulz4kr">
                    Metis Hyperion Testnet
                  </span>
                </div>
                <div
                  className="flex justify-between items-center"
                  data-oid=".hym7iv"
                >
                  <span className="text-gray-400" data-oid="m5n-3i2">
                    Gas Fee:
                  </span>
                  <span className="text-white font-mono" data-oid="0zl.at-">
                    ~0.001 METIS
                  </span>
                </div>
                <div
                  className="flex justify-between items-center"
                  data-oid="ivbwt4v"
                >
                  <span className="text-gray-400" data-oid="7.3hktq">
                    Your Wallet:
                  </span>
                  <span className="text-white font-mono" data-oid="31_rxg3">
                    0x3BD9...7881
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4" data-oid="ziizenx">
              <button
                onClick={handleBack}
                className="px-8 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
                data-oid="t9n6_z6"
              >
                Back to Preview
              </button>
              <button
                onClick={handleCreateMuse}
                disabled={isCreating}
                className={`neural-button px-8 py-3 text-white font-semibold rounded-xl ${
                  isCreating ? "opacity-50 cursor-not-allowed" : ""
                }`}
                data-oid="k5l5orv"
              >
                {isCreating ? (
                  <div
                    className="flex items-center space-x-2"
                    data-oid="7-qi4sz"
                  >
                    <div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                      data-oid="ungku-y"
                    />

                    <span data-oid="u:pmlt9">Creating...</span>
                  </div>
                ) : (
                  "Create My Muse"
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
      data-oid="b_q3l1j"
    >
      {/* Enhanced Background Effects */}
      <NeuralNetwork data-oid="v9dx3di" />

      <div className="absolute inset-0 overflow-hidden" data-oid="y6j38bl">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          data-oid="zj.191c"
        />

        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          data-oid="o7_.g9y"
        />

        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"
          data-oid="5yjwiqi"
        />
      </div>

      {/* Geometric Background Pattern */}
      <div className="geometric-bg" data-oid=".mudwow">
        <div className="geometric-shape" data-oid="rrftmrg" />
        <div className="geometric-shape" data-oid="bv:tk.2" />
        <div className="geometric-shape" data-oid="sqn7b_u" />
      </div>

      {/* Navigation */}
      <nav
        className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto"
        data-oid="55-tm6:"
      >
        <Link
          href="/"
          className="flex items-center space-x-3"
          data-oid="i2ue1y3"
        >
          <div
            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white"
            data-oid="jl4:bua"
          >
            M
          </div>
          <div data-oid="asyuj0p">
            <span
              className="text-2xl font-bold hero-gradient-text"
              data-oid="j8zrw-c"
            >
              MetaMuse
            </span>
            <div className="text-xs text-gray-400 font-mono" data-oid="a6pwbsk">
              Create Mode
            </div>
          </div>
        </Link>

        <Link
          href="/"
          className="px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
          data-oid="1w9whxo"
        >
          ← Back to Home
        </Link>
      </nav>

      {/* Main Content */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 py-12"
        data-oid="67wbdl4"
      >
        {/* Step Navigation */}
        <StepNavigation
          currentStep={currentStep}
          totalSteps={5}
          onStepChange={setCurrentStep}
          stepTitles={stepTitles}
          data-oid="frtywjb"
        />

        {/* Enhanced Step Info */}
        <div className="text-center mb-20" data-oid="-54k5h2">
          <div
            className="inline-block px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8"
            data-oid="7y9wctc"
          >
            🚀 Step {currentStep} of 5
          </div>

          <h1
            className="text-6xl lg:text-7xl font-black mb-8 leading-tight"
            data-oid="-guqdpc"
          >
            <div className="hero-gradient-text mb-2" data-oid="xtt4i7b">
              {stepTitles[currentStep - 1]}
            </div>
          </h1>

          <p
            className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8"
            data-oid="fcmar9p"
          >
            {stepDescriptions[currentStep - 1]}
          </p>

          {/* Progress indicator */}
          <div
            className="flex justify-center items-center space-x-2 text-sm text-gray-400"
            data-oid="1m-8vcw"
          >
            <span data-oid="_zrccc1">Progress:</span>
            <div
              className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden"
              data-oid="2sr7sai"
            >
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${(currentStep / 5) * 100}%` }}
                data-oid=":d6o:lb"
              />
            </div>
            <span data-oid="3-s9bi1">
              {Math.round((currentStep / 5) * 100)}%
            </span>
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </div>
  );
}
