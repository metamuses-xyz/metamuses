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
      data-oid="ntriwd:"
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
    <div className="space-y-8" data-oid="ykjmhq_">
      {/* Personality Archetype Display */}
      <div
        className="neural-card rounded-3xl p-8 text-center relative overflow-hidden"
        data-oid="r92l8jv"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"
          data-oid="3r3b2y_"
        />

        <div className="relative z-10" data-oid="h5ll7f1">
          <div
            className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl shadow-2xl"
            data-oid="fljevel"
          >
            🧠
          </div>
          <h3 className="text-3xl font-bold text-white mb-2" data-oid="3yv6nxp">
            {archetype.name}
          </h3>
          <p className="text-gray-300 text-lg mb-6" data-oid="b.i1x71">
            {archetype.desc}
          </p>

          {/* Personality Radar */}
          <div
            className="grid grid-cols-4 gap-4 max-w-md mx-auto"
            data-oid="67:3km6"
          >
            {traits.map((trait) => (
              <div key={trait.key} className="text-center" data-oid="wdiu14.">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${trait.gradient} rounded-xl mx-auto mb-2 flex items-center justify-center text-xl shadow-lg`}
                  data-oid="1cd3aod"
                >
                  {trait.icon}
                </div>
                <div
                  className="text-2xl font-bold text-white"
                  data-oid="nwtnk57"
                >
                  {personality[trait.key]}
                </div>
                <div className="text-xs text-gray-400" data-oid="po1af4a">
                  {trait.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Trait Designer */}
      <div className="grid lg:grid-cols-2 gap-8" data-oid="i9o4yje">
        {/* Trait Selection */}
        <div className="space-y-4" data-oid="3jk918h">
          {traits.map((trait, index) => (
            <div
              key={trait.key}
              className={`neural-card rounded-2xl p-6 cursor-pointer transition-all duration-500 ${
                activeTraitIndex === index
                  ? "ring-2 ring-purple-500/50 bg-purple-500/10 scale-105"
                  : "hover:scale-102"
              }`}
              onClick={() => setActiveTraitIndex(index)}
              data-oid="k9-sr6h"
            >
              <div className="flex items-center space-x-4" data-oid="a8dmtl_">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${trait.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}
                  data-oid="b3i6giq"
                >
                  {trait.icon}
                </div>
                <div className="flex-1" data-oid="ys60zcl">
                  <div
                    className="flex items-center justify-between mb-2"
                    data-oid="0.pvaso"
                  >
                    <h4
                      className="text-xl font-bold text-white"
                      data-oid="--japjf"
                    >
                      {trait.name}
                    </h4>
                    <div
                      className="text-2xl font-mono font-bold text-purple-400"
                      data-oid="s91pz2d"
                    >
                      {personality[trait.key]}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-3" data-oid="5h.:hbd">
                    {trait.description}
                  </p>

                  {/* Mini progress bar */}
                  <div
                    className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"
                    data-oid=":5vmgj2"
                  >
                    <div
                      className={`h-full bg-gradient-to-r ${trait.gradient} rounded-full transition-all duration-700`}
                      style={{ width: `${personality[trait.key]}%` }}
                      data-oid="594-c9k"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Trait Editor */}
        <div className="neural-card rounded-3xl p-8" data-oid="m_i9igs">
          <div className="text-center mb-8" data-oid="wed8uiw">
            <div
              className={`w-24 h-24 bg-gradient-to-br ${traits[activeTraitIndex].gradient} rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl shadow-2xl`}
              data-oid="j0t0:13"
            >
              {traits[activeTraitIndex].icon}
            </div>
            <h3
              className="text-3xl font-bold text-white mb-2"
              data-oid="xuf9cxe"
            >
              {traits[activeTraitIndex].name}
            </h3>
            <p className="text-gray-300" data-oid="ohuyqp4">
              {traits[activeTraitIndex].description}
            </p>
          </div>

          {/* Advanced Slider */}
          <div className="mb-8" data-oid=".7xjc7c">
            <div
              className="flex justify-between items-center mb-4"
              data-oid="8gg7gbi"
            >
              <span className="text-gray-400" data-oid="c1vj6n.">
                Intensity
              </span>
              <span
                className="text-3xl font-mono font-bold text-white"
                data-oid="65ik4m4"
              >
                {personality[traits[activeTraitIndex].key]}
              </span>
            </div>

            <div className="relative" data-oid="4e_l13h">
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
                data-oid="s6ue1xc"
              />

              {/* Slider markers */}
              <div
                className="flex justify-between text-xs text-gray-500 mt-2"
                data-oid="-akgfcv"
              >
                <span data-oid="6tw34c7">Minimal</span>
                <span data-oid="1xvkbrn">Moderate</span>
                <span data-oid="v1bkv_z">Strong</span>
                <span data-oid="yzno8sh">Dominant</span>
              </div>
            </div>
          </div>

          {/* Trait Examples */}
          <div data-oid=".j:c7x0">
            <h4
              className="text-lg font-semibold text-white mb-4"
              data-oid="7ze-3cv"
            >
              This trait enables:
            </h4>
            <div className="space-y-2" data-oid=".1yaleq">
              {traits[activeTraitIndex].examples.map((example, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 text-gray-300"
                  data-oid="9w4g6ks"
                >
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full"
                    data-oid="7h5p77w"
                  />

                  <span data-oid="-hchput">{example}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Personality Presets */}
      <div className="neural-card rounded-2xl p-6" data-oid="h0ptl9c">
        <h4
          className="text-xl font-bold text-white mb-6 flex items-center"
          data-oid=".dmb._0"
        >
          <span className="mr-3" data-oid="yh-95ij">
            ⚡
          </span>
          Quick Personality Presets
        </h4>
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          data-oid="dm26ahp"
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
              data-oid=":-:vv9-"
            >
              <div className="text-3xl mb-2" data-oid="n4rip1.">
                {preset.icon}
              </div>
              <div
                className="text-white font-semibold text-sm"
                data-oid="leq95j3"
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
      data-oid=".ymc_q3"
    >
      <div
        className="neural-card rounded-2xl p-4 backdrop-blur-xl"
        data-oid="gbon8_5"
      >
        <div className="space-y-4" data-oid="l9vltvz">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={`group cursor-pointer transition-all duration-300 ${
                step <= currentStep ? "opacity-100" : "opacity-40"
              }`}
              onClick={() => step <= currentStep && onStepChange(step)}
              data-oid="1-tyb.:"
            >
              <div className="flex items-center space-x-3" data-oid="tk-9r3o">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    step === currentStep
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-110 shadow-lg"
                      : step < currentStep
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-400"
                  }`}
                  data-oid="vmtmtvo"
                >
                  {step < currentStep ? "✓" : step}
                </div>
                <div
                  className={`text-xs transition-all duration-300 ${
                    step === currentStep
                      ? "text-white opacity-100"
                      : "text-gray-400 opacity-0 group-hover:opacity-100"
                  }`}
                  data-oid="ma4wf25"
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
    <div className="space-y-8" data-oid="rkw6j-v">
      {/* Template Categories */}
      <div className="text-center mb-12" data-oid=".clsnzb">
        <div
          className="inline-flex bg-gray-800/50 rounded-2xl p-2 backdrop-blur-sm"
          data-oid="i.o4q63"
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
                data-oid=".wbg76f"
              >
                {category}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid md:grid-cols-3 gap-8" data-oid="q30h97o">
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
            data-oid="eg6133h"
          >
            {/* Animated background */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              data-oid="7ns:w:b"
            />

            {/* Popular badge */}
            {template.popular && (
              <div
                className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-2 rounded-full transform rotate-12 shadow-lg"
                data-oid="vi-e1jt"
              >
                🔥 Popular
              </div>
            )}

            <div className="relative z-10 text-center" data-oid="_x2iwwq">
              {/* Icon */}
              <div
                className={`w-24 h-24 bg-gradient-to-br ${template.gradient} rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-110`}
                data-oid="8.3o35-"
              >
                {template.icon}
              </div>

              {/* Title */}
              <h3
                className="text-2xl font-bold text-white mb-4 group-hover:text-purple-200 transition-colors"
                data-oid="zkcdbw2"
              >
                {template.title}
              </h3>

              {/* Description */}
              <p
                className="text-gray-400 mb-6 leading-relaxed"
                data-oid="2j4cfny"
              >
                {template.description}
              </p>

              {/* Features */}
              <div className="space-y-3 mb-6" data-oid="jto3jet">
                {template.features.map((feature: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center space-x-2 text-sm"
                    data-oid="shndbo0"
                  >
                    <div
                      className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                      data-oid="ry7qcj1"
                    />

                    <span className="text-gray-300" data-oid="aj_156e">
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
                data-oid="0f59q0b"
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
      data-oid="mnfstwa"
    >
      {avatar.pattern && (
        <div
          className={`absolute inset-0 ${avatar.pattern} opacity-30`}
          data-oid="g:nz6kv"
        />
      )}
      <div
        className="relative z-10 text-white font-bold text-2xl"
        data-oid="_dyb-w1"
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
    <div className="space-y-8" data-oid="qwpzr8o">
      {/* Current Avatar Preview */}
      <div
        className="neural-card rounded-3xl p-12 text-center relative overflow-hidden"
        data-oid="2rh.szg"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"
          data-oid="qj:osmu"
        />

        <div className="relative z-10" data-oid="u45pp_c">
          <h3 className="text-3xl font-bold text-white mb-8" data-oid="yegat11">
            Your Avatar
          </h3>

          <div
            className="flex items-center justify-center space-x-12 mb-8"
            data-oid="_rfs3z4"
          >
            {/* Large avatar preview */}
            <div className="relative" data-oid="48bp8wt">
              <div
                className={`w-32 h-32 rounded-full bg-gradient-to-br ${generatedAvatar?.gradient} flex items-center justify-center shadow-2xl`}
                data-oid="91obquo"
              >
                <span
                  className="text-5xl font-bold text-white"
                  data-oid="jb:75nw"
                >
                  {generatedAvatar?.initial}
                </span>
              </div>
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full animate-pulse"
                data-oid="_fy2ndb"
              />
            </div>

            {/* Avatar info */}
            <div className="text-left" data-oid=":60e8-s">
              <h4
                className="text-2xl font-bold text-white mb-2"
                data-oid="ngl_sp8"
              >
                {generatedAvatar?.name}
              </h4>
              <p className="text-gray-400 mb-4" data-oid="zmopf.b">
                Generated from your personality traits
              </p>

              {/* Personality influence */}
              <div className="space-y-2" data-oid="knt6b86">
                <div className="text-sm text-gray-300" data-oid="eqddy84">
                  Influenced by:
                </div>
                {Object.entries(personality).map(([trait, value]) => (
                  <div
                    key={trait}
                    className="flex items-center space-x-2 text-xs"
                    data-oid="s:qhi74"
                  >
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full"
                      data-oid="oke5jfi"
                    />

                    <span
                      className="text-gray-400 capitalize"
                      data-oid="7y:qrz."
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
            data-oid="uhd5-ao"
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2" data-oid="f8-u8tv">
                <div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  data-oid=":tegen9"
                />

                <span data-oid="qk5z40m">Generating...</span>
              </div>
            ) : (
              "🎲 Generate New Avatar"
            )}
          </button>
        </div>
      </div>

      {/* Avatar Variations */}
      <div className="grid md:grid-cols-4 gap-6" data-oid="v7ho:r9">
        {avatarVariations.map((avatar, index) => (
          <div
            key={index}
            className={`neural-card rounded-2xl p-6 cursor-pointer text-center transition-all duration-500 hover:scale-105 ${
              selectedAvatar?.name === avatar.name
                ? "ring-2 ring-purple-500/50 bg-purple-500/10"
                : ""
            }`}
            onClick={() => onAvatarSelect(avatar)}
            data-oid="easxsnm"
          >
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatar.gradient} mx-auto mb-4 flex items-center justify-center shadow-lg`}
              data-oid="mydgbvf"
            >
              <span
                className="text-2xl font-bold text-white"
                data-oid="sxekqpg"
              >
                {avatar.initial}
              </span>
            </div>
            <h4 className="text-white font-semibold mb-2" data-oid="w8ifjbw">
              {avatar.name}
            </h4>
            <span
              className="text-xs text-gray-400 capitalize"
              data-oid="-ub0.u-"
            >
              {avatar.type}
            </span>
          </div>
        ))}
      </div>

      {/* Custom Upload Option */}
      <div
        className="neural-card rounded-2xl p-8 text-center border-2 border-dashed border-gray-600 hover:border-purple-500 transition-colors cursor-pointer"
        data-oid="dlgy8qk"
      >
        <div
          className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
          data-oid="3trzb51"
        >
          📁
        </div>
        <h4 className="text-white font-semibold mb-2" data-oid="ayh8lpy">
          Upload Custom Avatar
        </h4>
        <p className="text-gray-400 text-sm" data-oid="eil4h4o">
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
          <div className="max-w-7xl mx-auto" data-oid="bv8-p05">
            <TemplateSelector
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelect={setSelectedTemplate}
              data-oid=":eygoix"
            />

            <div className="text-center mt-12" data-oid="iefm6lx">
              <button
                onClick={handleNext}
                disabled={!selectedTemplate}
                className={`neural-button px-16 py-5 text-white font-bold text-xl rounded-2xl transition-all duration-500 ${
                  selectedTemplate
                    ? "hover:scale-105 shadow-2xl shadow-purple-500/30"
                    : "opacity-50 cursor-not-allowed"
                }`}
                data-oid="8:hvwhj"
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
          <div className="max-w-7xl mx-auto" data-oid="3vrb152">
            <PersonalityDesigner
              personality={personality}
              setPersonality={setPersonality}
              onTraitChange={(trait, value) => {
                // Add any additional logic for trait changes
                console.log(`${trait} changed to ${value}`);
              }}
              data-oid="d3:ebaa"
            />

            <div
              className="flex justify-center space-x-6 mt-12"
              data-oid="8skmf4f"
            >
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
                data-oid="jpwcc20"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-16 py-4 text-white font-bold text-xl rounded-xl hover:scale-105 transition-all"
                data-oid="pvrfx7c"
              >
                Continue to Avatar →
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="max-w-7xl mx-auto" data-oid="ezvsfjb">
            <AvatarCreator
              generatedAvatar={generatedAvatar}
              selectedAvatar={selectedAvatar}
              onAvatarSelect={setSelectedAvatar}
              personality={personality}
              data-oid="4r:tpix"
            />

            <div
              className="flex justify-center space-x-6 mt-12"
              data-oid="gb-jfek"
            >
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
                data-oid=".t6ibzx"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-16 py-4 text-white font-bold text-xl rounded-xl hover:scale-105 transition-all"
                data-oid="l2--8ab"
              >
                Continue to Identity →
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="max-w-4xl mx-auto space-y-8" data-oid="z3p5g1l">
            {/* Muse Identity Form */}
            <div className="neural-card rounded-3xl p-8" data-oid="zqcn:l-">
              <h3
                className="text-3xl font-bold text-white mb-8 text-center"
                data-oid="0:bdlf7"
              >
                Define Your Muse's Identity
              </h3>

              <div className="space-y-6" data-oid="n76q0xd">
                {/* Name Input */}
                <div data-oid="y:_nqk-">
                  <label
                    className="block text-white font-semibold mb-3"
                    data-oid="rk8i7xl"
                  >
                    Muse Name
                  </label>
                  <input
                    type="text"
                    value={museName}
                    onChange={(e) => setMuseName(e.target.value)}
                    placeholder="Enter your muse's name..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-lg"
                    data-oid="9ycv680"
                  />
                </div>

                {/* Description Input */}
                <div data-oid="t7:k-ei">
                  <label
                    className="block text-white font-semibold mb-3"
                    data-oid="37:q3kp"
                  >
                    Personality Description
                  </label>
                  <textarea
                    value={museDescription}
                    onChange={(e) => setMuseDescription(e.target.value)}
                    placeholder="Describe your muse's personality, interests, and unique traits..."
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                    data-oid="lgx6bar"
                  />
                </div>

                {/* Behavioral Settings */}
                <div className="grid md:grid-cols-2 gap-6" data-oid="u1d35ct">
                  <div data-oid=":t8oqz0">
                    <label
                      className="block text-white font-semibold mb-3"
                      data-oid="p:ahg7e"
                    >
                      Communication Style
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      data-oid="-dmnb3s"
                    >
                      <option data-oid="ckvw2_v">Casual & Friendly</option>
                      <option data-oid="4eqkkcx">Professional & Formal</option>
                      <option data-oid="_9ds.10">Playful & Energetic</option>
                      <option data-oid="9:-004j">Calm & Thoughtful</option>
                    </select>
                  </div>

                  <div data-oid="2kzn76u">
                    <label
                      className="block text-white font-semibold mb-3"
                      data-oid="x-6x6tc"
                    >
                      Response Length
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      data-oid="2rp:fb3"
                    >
                      <option data-oid="3wht5_u">Concise</option>
                      <option data-oid="ab6c7-f">Balanced</option>
                      <option data-oid="..siplc">Detailed</option>
                      <option data-oid="v3ld6sz">Comprehensive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="neural-card rounded-3xl p-8" data-oid="y6rh5j4">
              <h4
                className="text-2xl font-bold text-white mb-6 text-center"
                data-oid="ll0h0o6"
              >
                Preview
              </h4>
              <div
                className="flex items-center space-x-6 p-6 bg-gray-800/30 rounded-2xl"
                data-oid="lo-jwpi"
              >
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${generatedAvatar?.gradient} flex items-center justify-center shadow-lg`}
                  data-oid="frbhkr5"
                >
                  <span
                    className="text-2xl font-bold text-white"
                    data-oid="ow9w774"
                  >
                    {generatedAvatar?.initial}
                  </span>
                </div>
                <div className="flex-1" data-oid="s:sedtm">
                  <h5
                    className="text-2xl font-bold text-white mb-2"
                    data-oid="fj9bolb"
                  >
                    {museName || "Your Muse"}
                  </h5>
                  <p className="text-gray-400 mb-3" data-oid="gsa2szj">
                    {museDescription ||
                      "A unique AI companion with a carefully crafted personality."}
                  </p>
                  <div className="flex space-x-4 text-sm" data-oid="9-q4qwh">
                    {Object.entries(personality).map(([trait, value]) => (
                      <div
                        key={trait}
                        className="flex items-center space-x-1"
                        data-oid="csa6a.0"
                      >
                        <span
                          className="text-gray-500 capitalize"
                          data-oid="4tp4zw_"
                        >
                          {trait}:
                        </span>
                        <span
                          className="text-purple-400 font-bold"
                          data-oid="og3m1u5"
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-6" data-oid="m2.e5tk">
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
                data-oid="tgkk02g"
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
                data-oid="2c9b-7e"
              >
                Deploy Muse →
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="max-w-6xl mx-auto" data-oid="p-0ggbl">
            <div className="grid lg:grid-cols-2 gap-8 mb-12" data-oid="vo0j15w">
              {/* Avatar and Personality Summary */}
              <div className="neural-card rounded-2xl p-8" data-oid="mr5jj26">
                <div
                  className="flex items-center justify-center space-x-8 mb-8"
                  data-oid=":u8:his"
                >
                  <AvatarPreview avatar={generatedAvatar} data-oid="yodgk6e" />
                  <div
                    className="flex flex-col items-center space-y-2"
                    data-oid="ezt3ydt"
                  >
                    <div
                      className="text-4xl font-mono text-purple-400"
                      data-oid="8jcc1jj"
                    >
                      #preview
                    </div>
                    <AvatarPreview
                      avatar={generatedAvatar}
                      size="small"
                      data-oid="zfi5o90"
                    />
                  </div>
                </div>

                <h3
                  className="text-2xl font-semibold text-white text-center mb-2"
                  data-oid="m2go14t"
                >
                  {generatedAvatar?.name || "Balanced Harmony"}
                </h3>
                <p
                  className="text-gray-400 text-center mb-8"
                  data-oid="15szlwb"
                >
                  All aspects of being flow together in perfect equilibrium,
                  adaptable to any moment.
                </p>

                <div className="space-y-4" data-oid="v2uxbfq">
                  {Object.entries(personality).map(([trait, value]) => (
                    <div
                      key={trait}
                      className="flex items-center justify-between"
                      data-oid="kfsa9jj"
                    >
                      <span
                        className="text-white capitalize font-medium"
                        data-oid="r02l64o"
                      >
                        {trait}
                      </span>
                      <div
                        className="flex items-center space-x-3"
                        data-oid="up8zij1"
                      >
                        <div
                          className="w-24 h-2 bg-gray-700 rounded-full"
                          data-oid="2q6j90z"
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
                            data-oid="qkuie5i"
                          />
                        </div>
                        <span
                          className="text-white font-mono font-bold text-lg w-8"
                          data-oid="lpuz3-7"
                        >
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Responses */}
              <div data-oid="omz57ba">
                <h3
                  className="text-2xl font-semibold text-white mb-6 flex items-center"
                  data-oid="flzi0bz"
                >
                  <span className="text-2xl mr-2" data-oid="u5-d.-2">
                    ✨
                  </span>
                  Sample Responses
                </h3>

                <div className="space-y-4" data-oid="e7302as">
                  {sampleResponses.map((sample, index) => (
                    <div
                      key={index}
                      className="neural-card rounded-xl p-4"
                      data-oid="66m7h6j"
                    >
                      <div
                        className="flex items-start space-x-3 mb-3"
                        data-oid="cwn2oca"
                      >
                        <div
                          className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs"
                          data-oid="ndfa_ke"
                        >
                          👤
                        </div>
                        <div className="text-gray-300" data-oid="rukh-jx">
                          User: "{sample.user}"
                        </div>
                      </div>
                      <div
                        className="pl-9 text-gray-200 leading-relaxed"
                        data-oid="j9n65a4"
                      >
                        {sample.response}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4" data-oid=".fbu93h">
              <button
                onClick={handleBack}
                className="px-8 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
                data-oid="0642grb"
              >
                Back to Avatar
              </button>
              <button
                onClick={() => {
                  /* Test interaction */
                }}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all"
                data-oid="0.2qsqv"
              >
                Test Interaction
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-8 py-3 text-white font-semibold rounded-xl"
                data-oid="zg6.u._"
              >
                Create Muse
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="max-w-2xl mx-auto text-center" data-oid="2va7zsa">
            <div
              className="neural-card rounded-2xl p-12 mb-8"
              data-oid="iww_:de"
            >
              <h3
                className="text-2xl font-semibold text-white mb-8"
                data-oid="s:7v0kc"
              >
                Transaction Details
              </h3>

              <div className="space-y-6 text-left" data-oid="l54ikwe">
                <div
                  className="flex justify-between items-center"
                  data-oid="nrsq2vf"
                >
                  <span className="text-gray-400" data-oid="g15dip9">
                    Network:
                  </span>
                  <span className="text-white font-mono" data-oid="d_s3lop">
                    Metis Hyperion Testnet
                  </span>
                </div>
                <div
                  className="flex justify-between items-center"
                  data-oid="yf25:bi"
                >
                  <span className="text-gray-400" data-oid="57i5.lt">
                    Gas Fee:
                  </span>
                  <span className="text-white font-mono" data-oid=":lyvpe0">
                    ~0.001 METIS
                  </span>
                </div>
                <div
                  className="flex justify-between items-center"
                  data-oid="q3425w0"
                >
                  <span className="text-gray-400" data-oid="3nt-gi:">
                    Your Wallet:
                  </span>
                  <span className="text-white font-mono" data-oid="bpj_957">
                    0x3BD9...7881
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4" data-oid="6vtjsrx">
              <button
                onClick={handleBack}
                className="px-8 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
                data-oid="lh892vw"
              >
                Back to Preview
              </button>
              <button
                onClick={handleCreateMuse}
                disabled={isCreating}
                className={`neural-button px-8 py-3 text-white font-semibold rounded-xl ${
                  isCreating ? "opacity-50 cursor-not-allowed" : ""
                }`}
                data-oid="0h9l7ub"
              >
                {isCreating ? (
                  <div
                    className="flex items-center space-x-2"
                    data-oid="ge-u01y"
                  >
                    <div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                      data-oid="8klb.wq"
                    />

                    <span data-oid="3cm6ip7">Creating...</span>
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
      data-oid="czcpou0"
    >
      {/* Enhanced Background Effects */}
      <NeuralNetwork data-oid="2r9xip9" />

      <div className="absolute inset-0 overflow-hidden" data-oid="rsm7wfj">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          data-oid="92dphj9"
        />

        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          data-oid="agrdvid"
        />

        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"
          data-oid="cqnx29y"
        />
      </div>

      {/* Geometric Background Pattern */}
      <div className="geometric-bg" data-oid="7fys4va">
        <div className="geometric-shape" data-oid="fxa.-k7" />
        <div className="geometric-shape" data-oid="d9ohtvs" />
        <div className="geometric-shape" data-oid="t0ed6kh" />
      </div>

      {/* Navigation */}
      <nav
        className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto"
        data-oid="lnl7_dm"
      >
        <Link
          href="/"
          className="flex items-center space-x-3"
          data-oid="gxgdq.."
        >
          <div
            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white"
            data-oid="s1.:n7e"
          >
            M
          </div>
          <div data-oid="ha1muhw">
            <span
              className="text-2xl font-bold hero-gradient-text"
              data-oid="y5keiqg"
            >
              MetaMuse
            </span>
            <div className="text-xs text-gray-400 font-mono" data-oid=":pk.n28">
              Create Mode
            </div>
          </div>
        </Link>

        <Link
          href="/"
          className="px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
          data-oid="m01cduj"
        >
          ← Back to Home
        </Link>
      </nav>

      {/* Main Content */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 py-12"
        data-oid="ubwribl"
      >
        {/* Step Navigation */}
        <StepNavigation
          currentStep={currentStep}
          totalSteps={5}
          onStepChange={setCurrentStep}
          stepTitles={stepTitles}
          data-oid="g4uvb54"
        />

        {/* Enhanced Step Info */}
        <div className="text-center mb-20" data-oid="2fbjsfo">
          <div
            className="inline-block px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8"
            data-oid="jkuzels"
          >
            🚀 Step {currentStep} of 5
          </div>

          <h1
            className="text-6xl lg:text-7xl font-black mb-8 leading-tight"
            data-oid="u6a0qk."
          >
            <div className="hero-gradient-text mb-2" data-oid="a4bjl4d">
              {stepTitles[currentStep - 1]}
            </div>
          </h1>

          <p
            className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8"
            data-oid="wtu4b2g"
          >
            {stepDescriptions[currentStep - 1]}
          </p>

          {/* Progress indicator */}
          <div
            className="flex justify-center items-center space-x-2 text-sm text-gray-400"
            data-oid="21q823o"
          >
            <span data-oid="umfz:dp">Progress:</span>
            <div
              className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden"
              data-oid="e3799qs"
            >
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${(currentStep / 5) * 100}%` }}
                data-oid="n7f1k0i"
              />
            </div>
            <span data-oid="4j9:lsf">
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
