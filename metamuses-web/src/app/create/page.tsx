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
      data-oid="6gzh8il"
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
    <div className="space-y-8" data-oid="k3-0b9c">
      {/* Personality Archetype Display */}
      <div
        className="neural-card rounded-3xl p-8 text-center relative overflow-hidden"
        data-oid="c6lunrz"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"
          data-oid="rj1cd81"
        />

        <div className="relative z-10" data-oid="xds0rnj">
          <div
            className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl shadow-2xl"
            data-oid="o583t-2"
          >
            🧠
          </div>
          <h3 className="text-3xl font-bold text-white mb-2" data-oid="27ahozt">
            {archetype.name}
          </h3>
          <p className="text-gray-300 text-lg mb-6" data-oid="05h1ch8">
            {archetype.desc}
          </p>

          {/* Personality Radar */}
          <div
            className="grid grid-cols-4 gap-4 max-w-md mx-auto"
            data-oid="_jxr-hf"
          >
            {traits.map((trait) => (
              <div key={trait.key} className="text-center" data-oid="-:7pf36">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${trait.gradient} rounded-xl mx-auto mb-2 flex items-center justify-center text-xl shadow-lg`}
                  data-oid="2lsgoec"
                >
                  {trait.icon}
                </div>
                <div
                  className="text-2xl font-bold text-white"
                  data-oid="6hpoq9y"
                >
                  {personality[trait.key]}
                </div>
                <div className="text-xs text-gray-400" data-oid="zy5h484">
                  {trait.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Trait Designer */}
      <div className="grid lg:grid-cols-2 gap-8" data-oid="ji9.x0f">
        {/* Trait Selection */}
        <div className="space-y-4" data-oid=".g04fe:">
          {traits.map((trait, index) => (
            <div
              key={trait.key}
              className={`neural-card rounded-2xl p-6 cursor-pointer transition-all duration-500 ${
                activeTraitIndex === index
                  ? "ring-2 ring-purple-500/50 bg-purple-500/10 scale-105"
                  : "hover:scale-102"
              }`}
              onClick={() => setActiveTraitIndex(index)}
              data-oid="j0y35rb"
            >
              <div className="flex items-center space-x-4" data-oid="1:b_h9z">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${trait.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}
                  data-oid="5yrnx52"
                >
                  {trait.icon}
                </div>
                <div className="flex-1" data-oid="pjtcpg1">
                  <div
                    className="flex items-center justify-between mb-2"
                    data-oid="s:0diul"
                  >
                    <h4
                      className="text-xl font-bold text-white"
                      data-oid="_10ijp7"
                    >
                      {trait.name}
                    </h4>
                    <div
                      className="text-2xl font-mono font-bold text-purple-400"
                      data-oid="3srz9zv"
                    >
                      {personality[trait.key]}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-3" data-oid="8unvkz0">
                    {trait.description}
                  </p>

                  {/* Mini progress bar */}
                  <div
                    className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"
                    data-oid="xbv532x"
                  >
                    <div
                      className={`h-full bg-gradient-to-r ${trait.gradient} rounded-full transition-all duration-700`}
                      style={{ width: `${personality[trait.key]}%` }}
                      data-oid="dpqltxm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Trait Editor */}
        <div className="neural-card rounded-3xl p-8" data-oid="l6k.9c8">
          <div className="text-center mb-8" data-oid="p_1au7w">
            <div
              className={`w-24 h-24 bg-gradient-to-br ${traits[activeTraitIndex].gradient} rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl shadow-2xl`}
              data-oid="ncdy2yl"
            >
              {traits[activeTraitIndex].icon}
            </div>
            <h3
              className="text-3xl font-bold text-white mb-2"
              data-oid="ro6sanp"
            >
              {traits[activeTraitIndex].name}
            </h3>
            <p className="text-gray-300" data-oid="byt:.id">
              {traits[activeTraitIndex].description}
            </p>
          </div>

          {/* Advanced Slider */}
          <div className="mb-8" data-oid="mxr0eey">
            <div
              className="flex justify-between items-center mb-4"
              data-oid="hv3y2jt"
            >
              <span className="text-gray-400" data-oid="ou-3yj:">
                Intensity
              </span>
              <span
                className="text-3xl font-mono font-bold text-white"
                data-oid="mzwcjuv"
              >
                {personality[traits[activeTraitIndex].key]}
              </span>
            </div>

            <div className="relative" data-oid="6atum6w">
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
                data-oid="1fltro0"
              />

              {/* Slider markers */}
              <div
                className="flex justify-between text-xs text-gray-500 mt-2"
                data-oid="4-2yb1_"
              >
                <span data-oid="7s8xxrp">Minimal</span>
                <span data-oid="8ed:guj">Moderate</span>
                <span data-oid="a446te7">Strong</span>
                <span data-oid="rzdi8un">Dominant</span>
              </div>
            </div>
          </div>

          {/* Trait Examples */}
          <div data-oid="naj6si2">
            <h4
              className="text-lg font-semibold text-white mb-4"
              data-oid="by_wgev"
            >
              This trait enables:
            </h4>
            <div className="space-y-2" data-oid="xrwo1x3">
              {traits[activeTraitIndex].examples.map((example, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 text-gray-300"
                  data-oid="38hq6wy"
                >
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full"
                    data-oid="t_lq93i"
                  />

                  <span data-oid="029wfmi">{example}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Personality Presets */}
      <div className="neural-card rounded-2xl p-6" data-oid="osotb8z">
        <h4
          className="text-xl font-bold text-white mb-6 flex items-center"
          data-oid="pimfp-a"
        >
          <span className="mr-3" data-oid="t1dswlw">
            ⚡
          </span>
          Quick Personality Presets
        </h4>
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          data-oid="0idlipg"
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
              data-oid="ot-q-li"
            >
              <div className="text-3xl mb-2" data-oid="o4ndw-j">
                {preset.icon}
              </div>
              <div
                className="text-white font-semibold text-sm"
                data-oid="735g7w3"
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
      data-oid="1fg:0le"
    >
      <div
        className="neural-card rounded-2xl p-4 backdrop-blur-xl"
        data-oid=":4jvh.x"
      >
        <div className="space-y-4" data-oid="pccsln_">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={`group cursor-pointer transition-all duration-300 ${
                step <= currentStep ? "opacity-100" : "opacity-40"
              }`}
              onClick={() => step <= currentStep && onStepChange(step)}
              data-oid="u4zxa:r"
            >
              <div className="flex items-center space-x-3" data-oid="hv-:83x">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    step === currentStep
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-110 shadow-lg"
                      : step < currentStep
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-400"
                  }`}
                  data-oid="erjkf.f"
                >
                  {step < currentStep ? "✓" : step}
                </div>
                <div
                  className={`text-xs transition-all duration-300 ${
                    step === currentStep
                      ? "text-white opacity-100"
                      : "text-gray-400 opacity-0 group-hover:opacity-100"
                  }`}
                  data-oid="l_6c64a"
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
    <div className="space-y-8" data-oid="wls7cpw">
      {/* Template Categories */}
      <div className="text-center mb-12" data-oid="g1v1v1j">
        <div
          className="inline-flex bg-gray-800/50 rounded-2xl p-2 backdrop-blur-sm"
          data-oid="2fat48-"
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
                data-oid=".8y-ug:"
              >
                {category}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid md:grid-cols-3 gap-8" data-oid="3dbyl4j">
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
            data-oid="1oi120g"
          >
            {/* Animated background */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              data-oid="gh6gw8z"
            />

            {/* Popular badge */}
            {template.popular && (
              <div
                className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-2 rounded-full transform rotate-12 shadow-lg"
                data-oid="w0q4l28"
              >
                🔥 Popular
              </div>
            )}

            <div className="relative z-10 text-center" data-oid="tno9upv">
              {/* Icon */}
              <div
                className={`w-24 h-24 bg-gradient-to-br ${template.gradient} rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-110`}
                data-oid="h2nc3vg"
              >
                {template.icon}
              </div>

              {/* Title */}
              <h3
                className="text-2xl font-bold text-white mb-4 group-hover:text-purple-200 transition-colors"
                data-oid="6w83prq"
              >
                {template.title}
              </h3>

              {/* Description */}
              <p
                className="text-gray-400 mb-6 leading-relaxed"
                data-oid="9.-_-4-"
              >
                {template.description}
              </p>

              {/* Features */}
              <div className="space-y-3 mb-6" data-oid="8:t9qn.">
                {template.features.map((feature: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center space-x-2 text-sm"
                    data-oid="eitir_g"
                  >
                    <div
                      className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                      data-oid="32n-345"
                    />

                    <span className="text-gray-300" data-oid="dm.-nuf">
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
                data-oid="9cap58a"
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
      data-oid="yvl7fy4"
    >
      {avatar.pattern && (
        <div
          className={`absolute inset-0 ${avatar.pattern} opacity-30`}
          data-oid="0jklw20"
        />
      )}
      <div
        className="relative z-10 text-white font-bold text-2xl"
        data-oid="61x7fdg"
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
    <div className="space-y-8" data-oid="30b:zkr">
      {/* Current Avatar Preview */}
      <div
        className="neural-card rounded-3xl p-12 text-center relative overflow-hidden"
        data-oid="v3.w0wh"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"
          data-oid="_28bemc"
        />

        <div className="relative z-10" data-oid="9llf4qx">
          <h3 className="text-3xl font-bold text-white mb-8" data-oid="424broa">
            Your Avatar
          </h3>

          <div
            className="flex items-center justify-center space-x-12 mb-8"
            data-oid="kr_58k5"
          >
            {/* Large avatar preview */}
            <div className="relative" data-oid="va8ags2">
              <div
                className={`w-32 h-32 rounded-full bg-gradient-to-br ${generatedAvatar?.gradient} flex items-center justify-center shadow-2xl`}
                data-oid="q4fh:3n"
              >
                <span
                  className="text-5xl font-bold text-white"
                  data-oid="6fbliq."
                >
                  {generatedAvatar?.initial}
                </span>
              </div>
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full animate-pulse"
                data-oid="6-1e7vj"
              />
            </div>

            {/* Avatar info */}
            <div className="text-left" data-oid="m1.4jd8">
              <h4
                className="text-2xl font-bold text-white mb-2"
                data-oid="ef7u1if"
              >
                {generatedAvatar?.name}
              </h4>
              <p className="text-gray-400 mb-4" data-oid="9d8ugqc">
                Generated from your personality traits
              </p>

              {/* Personality influence */}
              <div className="space-y-2" data-oid="pmhlq5g">
                <div className="text-sm text-gray-300" data-oid="ldds8q:">
                  Influenced by:
                </div>
                {Object.entries(personality).map(([trait, value]) => (
                  <div
                    key={trait}
                    className="flex items-center space-x-2 text-xs"
                    data-oid="kloa0fi"
                  >
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full"
                      data-oid="z3y4-:u"
                    />

                    <span
                      className="text-gray-400 capitalize"
                      data-oid="7rjk6c9"
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
            data-oid="j3l::hy"
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2" data-oid="413f_ei">
                <div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  data-oid="r_sd5ya"
                />

                <span data-oid="k3n2:d9">Generating...</span>
              </div>
            ) : (
              "🎲 Generate New Avatar"
            )}
          </button>
        </div>
      </div>

      {/* Avatar Variations */}
      <div className="grid md:grid-cols-4 gap-6" data-oid="o1xayax">
        {avatarVariations.map((avatar, index) => (
          <div
            key={index}
            className={`neural-card rounded-2xl p-6 cursor-pointer text-center transition-all duration-500 hover:scale-105 ${
              selectedAvatar?.name === avatar.name
                ? "ring-2 ring-purple-500/50 bg-purple-500/10"
                : ""
            }`}
            onClick={() => onAvatarSelect(avatar)}
            data-oid="65jdl2a"
          >
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatar.gradient} mx-auto mb-4 flex items-center justify-center shadow-lg`}
              data-oid="wzkved7"
            >
              <span
                className="text-2xl font-bold text-white"
                data-oid="g2291go"
              >
                {avatar.initial}
              </span>
            </div>
            <h4 className="text-white font-semibold mb-2" data-oid="yklpu.r">
              {avatar.name}
            </h4>
            <span
              className="text-xs text-gray-400 capitalize"
              data-oid="f0xdzla"
            >
              {avatar.type}
            </span>
          </div>
        ))}
      </div>

      {/* Custom Upload Option */}
      <div
        className="neural-card rounded-2xl p-8 text-center border-2 border-dashed border-gray-600 hover:border-purple-500 transition-colors cursor-pointer"
        data-oid="r_trayb"
      >
        <div
          className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
          data-oid="_9kzx71"
        >
          📁
        </div>
        <h4 className="text-white font-semibold mb-2" data-oid="p2u23dy">
          Upload Custom Avatar
        </h4>
        <p className="text-gray-400 text-sm" data-oid="8i2f207">
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
          <div className="max-w-7xl mx-auto" data-oid="mj6rsvr">
            <TemplateSelector
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelect={setSelectedTemplate}
              data-oid="ykhiajy"
            />

            <div className="text-center mt-12" data-oid="wy4-ioy">
              <button
                onClick={handleNext}
                disabled={!selectedTemplate}
                className={`neural-button px-16 py-5 text-white font-bold text-xl rounded-2xl transition-all duration-500 ${
                  selectedTemplate
                    ? "hover:scale-105 shadow-2xl shadow-purple-500/30"
                    : "opacity-50 cursor-not-allowed"
                }`}
                data-oid="8o7qh_u"
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
          <div className="max-w-7xl mx-auto" data-oid="nefceye">
            <PersonalityDesigner
              personality={personality}
              setPersonality={setPersonality}
              onTraitChange={(trait, value) => {
                // Add any additional logic for trait changes
                console.log(`${trait} changed to ${value}`);
              }}
              data-oid="7dti8us"
            />

            <div
              className="flex justify-center space-x-6 mt-12"
              data-oid="0778cc8"
            >
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
                data-oid="xr36h.6"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-16 py-4 text-white font-bold text-xl rounded-xl hover:scale-105 transition-all"
                data-oid="04omow8"
              >
                Continue to Avatar →
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="max-w-7xl mx-auto" data-oid=":4:17xd">
            <AvatarCreator
              generatedAvatar={generatedAvatar}
              selectedAvatar={selectedAvatar}
              onAvatarSelect={setSelectedAvatar}
              personality={personality}
              data-oid="_bxbba0"
            />

            <div
              className="flex justify-center space-x-6 mt-12"
              data-oid="fnxdpu:"
            >
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
                data-oid="mfz3j5e"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-16 py-4 text-white font-bold text-xl rounded-xl hover:scale-105 transition-all"
                data-oid="::xc469"
              >
                Continue to Identity →
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="max-w-4xl mx-auto space-y-8" data-oid="gnsc9_2">
            {/* Muse Identity Form */}
            <div className="neural-card rounded-3xl p-8" data-oid="ggo52vu">
              <h3
                className="text-3xl font-bold text-white mb-8 text-center"
                data-oid="p._hlqc"
              >
                Define Your Muse's Identity
              </h3>

              <div className="space-y-6" data-oid="eic71ev">
                {/* Name Input */}
                <div data-oid="j-t9s7s">
                  <label
                    className="block text-white font-semibold mb-3"
                    data-oid="pr_gmae"
                  >
                    Muse Name
                  </label>
                  <input
                    type="text"
                    value={museName}
                    onChange={(e) => setMuseName(e.target.value)}
                    placeholder="Enter your muse's name..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-lg"
                    data-oid="yeqqpek"
                  />
                </div>

                {/* Description Input */}
                <div data-oid="u5ugr9-">
                  <label
                    className="block text-white font-semibold mb-3"
                    data-oid="3ouq759"
                  >
                    Personality Description
                  </label>
                  <textarea
                    value={museDescription}
                    onChange={(e) => setMuseDescription(e.target.value)}
                    placeholder="Describe your muse's personality, interests, and unique traits..."
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                    data-oid="_1kskpv"
                  />
                </div>

                {/* Behavioral Settings */}
                <div className="grid md:grid-cols-2 gap-6" data-oid="byi1p_j">
                  <div data-oid="_6p.j4a">
                    <label
                      className="block text-white font-semibold mb-3"
                      data-oid="u179ljg"
                    >
                      Communication Style
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      data-oid="nxlvc6."
                    >
                      <option data-oid="1-7xecg">Casual & Friendly</option>
                      <option data-oid="h-edt2x">Professional & Formal</option>
                      <option data-oid="0cggek6">Playful & Energetic</option>
                      <option data-oid="qat4sgh">Calm & Thoughtful</option>
                    </select>
                  </div>

                  <div data-oid="dfuru10">
                    <label
                      className="block text-white font-semibold mb-3"
                      data-oid="7h_008r"
                    >
                      Response Length
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      data-oid="gt4_j9t"
                    >
                      <option data-oid="5kc_cmy">Concise</option>
                      <option data-oid="nlw0fd9">Balanced</option>
                      <option data-oid="44fx04r">Detailed</option>
                      <option data-oid="9d73ttf">Comprehensive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="neural-card rounded-3xl p-8" data-oid="4ohsls2">
              <h4
                className="text-2xl font-bold text-white mb-6 text-center"
                data-oid="fwa7p_7"
              >
                Preview
              </h4>
              <div
                className="flex items-center space-x-6 p-6 bg-gray-800/30 rounded-2xl"
                data-oid="fcosdvq"
              >
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${generatedAvatar?.gradient} flex items-center justify-center shadow-lg`}
                  data-oid="uy75o4."
                >
                  <span
                    className="text-2xl font-bold text-white"
                    data-oid="kg3hzik"
                  >
                    {generatedAvatar?.initial}
                  </span>
                </div>
                <div className="flex-1" data-oid="pc-fjw-">
                  <h5
                    className="text-2xl font-bold text-white mb-2"
                    data-oid="36udu5-"
                  >
                    {museName || "Your Muse"}
                  </h5>
                  <p className="text-gray-400 mb-3" data-oid="641p1b_">
                    {museDescription ||
                      "A unique AI companion with a carefully crafted personality."}
                  </p>
                  <div className="flex space-x-4 text-sm" data-oid="8qgkgtg">
                    {Object.entries(personality).map(([trait, value]) => (
                      <div
                        key={trait}
                        className="flex items-center space-x-1"
                        data-oid="1i0hig-"
                      >
                        <span
                          className="text-gray-500 capitalize"
                          data-oid="aqdiols"
                        >
                          {trait}:
                        </span>
                        <span
                          className="text-purple-400 font-bold"
                          data-oid="_j0wao4"
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-6" data-oid="nthi08i">
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
                data-oid="aac998a"
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
                data-oid="x54qms_"
              >
                Deploy Muse →
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="max-w-6xl mx-auto" data-oid="wyc34dx">
            <div className="grid lg:grid-cols-2 gap-8 mb-12" data-oid="pq.za41">
              {/* Avatar and Personality Summary */}
              <div className="neural-card rounded-2xl p-8" data-oid="n6svtrp">
                <div
                  className="flex items-center justify-center space-x-8 mb-8"
                  data-oid="ap68pm2"
                >
                  <AvatarPreview avatar={generatedAvatar} data-oid="u61sg02" />
                  <div
                    className="flex flex-col items-center space-y-2"
                    data-oid="lrma3wr"
                  >
                    <div
                      className="text-4xl font-mono text-purple-400"
                      data-oid="cherxzr"
                    >
                      #preview
                    </div>
                    <AvatarPreview
                      avatar={generatedAvatar}
                      size="small"
                      data-oid="6w8d3wd"
                    />
                  </div>
                </div>

                <h3
                  className="text-2xl font-semibold text-white text-center mb-2"
                  data-oid="4:0-9cq"
                >
                  {generatedAvatar?.name || "Balanced Harmony"}
                </h3>
                <p
                  className="text-gray-400 text-center mb-8"
                  data-oid="sn-q7he"
                >
                  All aspects of being flow together in perfect equilibrium,
                  adaptable to any moment.
                </p>

                <div className="space-y-4" data-oid="2ajpdy2">
                  {Object.entries(personality).map(([trait, value]) => (
                    <div
                      key={trait}
                      className="flex items-center justify-between"
                      data-oid="m01tv1f"
                    >
                      <span
                        className="text-white capitalize font-medium"
                        data-oid="vs5ej7."
                      >
                        {trait}
                      </span>
                      <div
                        className="flex items-center space-x-3"
                        data-oid="n5mr0jr"
                      >
                        <div
                          className="w-24 h-2 bg-gray-700 rounded-full"
                          data-oid="ckew_-0"
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
                            data-oid="2p_kss5"
                          />
                        </div>
                        <span
                          className="text-white font-mono font-bold text-lg w-8"
                          data-oid="yodvxco"
                        >
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Responses */}
              <div data-oid="v-1qj1o">
                <h3
                  className="text-2xl font-semibold text-white mb-6 flex items-center"
                  data-oid="8rh9wba"
                >
                  <span className="text-2xl mr-2" data-oid="sz6-cps">
                    ✨
                  </span>
                  Sample Responses
                </h3>

                <div className="space-y-4" data-oid="w6aizsf">
                  {sampleResponses.map((sample, index) => (
                    <div
                      key={index}
                      className="neural-card rounded-xl p-4"
                      data-oid="d-yl1y7"
                    >
                      <div
                        className="flex items-start space-x-3 mb-3"
                        data-oid="psifbb6"
                      >
                        <div
                          className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs"
                          data-oid="i0rk17u"
                        >
                          👤
                        </div>
                        <div className="text-gray-300" data-oid="rur-zvf">
                          User: "{sample.user}"
                        </div>
                      </div>
                      <div
                        className="pl-9 text-gray-200 leading-relaxed"
                        data-oid="o2omytf"
                      >
                        {sample.response}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4" data-oid="gu4lzvn">
              <button
                onClick={handleBack}
                className="px-8 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
                data-oid=":p7qurp"
              >
                Back to Avatar
              </button>
              <button
                onClick={() => {
                  /* Test interaction */
                }}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all"
                data-oid="rhc7:4m"
              >
                Test Interaction
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-8 py-3 text-white font-semibold rounded-xl"
                data-oid="ctjzjud"
              >
                Create Muse
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="max-w-2xl mx-auto text-center" data-oid="5jupvn_">
            <div
              className="neural-card rounded-2xl p-12 mb-8"
              data-oid="lkc30z8"
            >
              <h3
                className="text-2xl font-semibold text-white mb-8"
                data-oid="nxq8yjx"
              >
                Transaction Details
              </h3>

              <div className="space-y-6 text-left" data-oid="rgtlnzm">
                <div
                  className="flex justify-between items-center"
                  data-oid="bm1lw6i"
                >
                  <span className="text-gray-400" data-oid="4qxl94r">
                    Network:
                  </span>
                  <span className="text-white font-mono" data-oid="eyz9scv">
                    Metis Hyperion Testnet
                  </span>
                </div>
                <div
                  className="flex justify-between items-center"
                  data-oid="8fc80:_"
                >
                  <span className="text-gray-400" data-oid="gma8beo">
                    Gas Fee:
                  </span>
                  <span className="text-white font-mono" data-oid="4rlntck">
                    ~0.001 METIS
                  </span>
                </div>
                <div
                  className="flex justify-between items-center"
                  data-oid="4n8ubrs"
                >
                  <span className="text-gray-400" data-oid="-5k3l4q">
                    Your Wallet:
                  </span>
                  <span className="text-white font-mono" data-oid="_ks.5lq">
                    0x3BD9...7881
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4" data-oid="w30opg1">
              <button
                onClick={handleBack}
                className="px-8 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
                data-oid="i02oz3n"
              >
                Back to Preview
              </button>
              <button
                onClick={handleCreateMuse}
                disabled={isCreating}
                className={`neural-button px-8 py-3 text-white font-semibold rounded-xl ${
                  isCreating ? "opacity-50 cursor-not-allowed" : ""
                }`}
                data-oid="r14b600"
              >
                {isCreating ? (
                  <div
                    className="flex items-center space-x-2"
                    data-oid="z062tv6"
                  >
                    <div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                      data-oid="9ao93pb"
                    />

                    <span data-oid="fjdq-.m">Creating...</span>
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
      data-oid="n95_jso"
    >
      {/* Enhanced Background Effects */}
      <NeuralNetwork data-oid="nh-o2tl" />

      <div className="absolute inset-0 overflow-hidden" data-oid="zpm-x6_">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          data-oid="d0qkb7p"
        />

        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          data-oid=":ndgoi_"
        />

        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"
          data-oid="4iwwrqh"
        />
      </div>

      {/* Geometric Background Pattern */}
      <div className="geometric-bg" data-oid="wibihch">
        <div className="geometric-shape" data-oid="10:f37u" />
        <div className="geometric-shape" data-oid="q.lvv91" />
        <div className="geometric-shape" data-oid="ziy0mvk" />
      </div>

      {/* Navigation */}
      <nav
        className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto"
        data-oid=":5lnip:"
      >
        <Link
          href="/"
          className="flex items-center space-x-3"
          data-oid="acb-ue0"
        >
          <div
            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white"
            data-oid="uhfvp.f"
          >
            M
          </div>
          <div data-oid=".zxps0j">
            <span
              className="text-2xl font-bold hero-gradient-text"
              data-oid="dad-wdp"
            >
              MetaMuse
            </span>
            <div className="text-xs text-gray-400 font-mono" data-oid="n9sgt26">
              Create Mode
            </div>
          </div>
        </Link>

        <Link
          href="/"
          className="px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
          data-oid="-yhmfsq"
        >
          ← Back to Home
        </Link>
      </nav>

      {/* Main Content */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 py-12"
        data-oid="9jk1f-f"
      >
        {/* Step Navigation */}
        <StepNavigation
          currentStep={currentStep}
          totalSteps={5}
          onStepChange={setCurrentStep}
          stepTitles={stepTitles}
          data-oid="osmf.6z"
        />

        {/* Enhanced Step Info */}
        <div className="text-center mb-20" data-oid="mwh2dd9">
          <div
            className="inline-block px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8"
            data-oid="nt8nec8"
          >
            🚀 Step {currentStep} of 5
          </div>

          <h1
            className="text-6xl lg:text-7xl font-black mb-8 leading-tight"
            data-oid="_941gre"
          >
            <div className="hero-gradient-text mb-2" data-oid="p_bbpe3">
              {stepTitles[currentStep - 1]}
            </div>
          </h1>

          <p
            className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8"
            data-oid="-3qzt.u"
          >
            {stepDescriptions[currentStep - 1]}
          </p>

          {/* Progress indicator */}
          <div
            className="flex justify-center items-center space-x-2 text-sm text-gray-400"
            data-oid="ruxlp5v"
          >
            <span data-oid="p-ey_gr">Progress:</span>
            <div
              className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden"
              data-oid="qzd2coh"
            >
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${(currentStep / 5) * 100}%` }}
                data-oid="e3s7ia0"
              />
            </div>
            <span data-oid="guivdzr">
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
