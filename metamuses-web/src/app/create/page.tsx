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
      data-oid="02dw8.y"
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
    <div className="space-y-8" data-oid="z:b-k6p">
      {/* Personality Archetype Display */}
      <div
        className="neural-card rounded-3xl p-8 text-center relative overflow-hidden"
        data-oid="mqv73js"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"
          data-oid="uw3wuuh"
        />

        <div className="relative z-10" data-oid="nzu9ir8">
          <div
            className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl shadow-2xl"
            data-oid="pq7ynxw"
          >
            🧠
          </div>
          <h3 className="text-3xl font-bold text-white mb-2" data-oid="db_5_ye">
            {archetype.name}
          </h3>
          <p className="text-gray-300 text-lg mb-6" data-oid="apt3.4h">
            {archetype.desc}
          </p>

          {/* Personality Radar */}
          <div
            className="grid grid-cols-4 gap-4 max-w-md mx-auto"
            data-oid="rlb-57:"
          >
            {traits.map((trait) => (
              <div key={trait.key} className="text-center" data-oid="5ons-5d">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${trait.gradient} rounded-xl mx-auto mb-2 flex items-center justify-center text-xl shadow-lg`}
                  data-oid="efwb5ep"
                >
                  {trait.icon}
                </div>
                <div
                  className="text-2xl font-bold text-white"
                  data-oid="w:etmh7"
                >
                  {personality[trait.key]}
                </div>
                <div className="text-xs text-gray-400" data-oid="77uyv:n">
                  {trait.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Trait Designer */}
      <div className="grid lg:grid-cols-2 gap-8" data-oid="_dcw9i9">
        {/* Trait Selection */}
        <div className="space-y-4" data-oid="hs1zojp">
          {traits.map((trait, index) => (
            <div
              key={trait.key}
              className={`neural-card rounded-2xl p-6 cursor-pointer transition-all duration-500 ${
                activeTraitIndex === index
                  ? "ring-2 ring-purple-500/50 bg-purple-500/10 scale-105"
                  : "hover:scale-102"
              }`}
              onClick={() => setActiveTraitIndex(index)}
              data-oid="40ffyb."
            >
              <div className="flex items-center space-x-4" data-oid="trvd1:8">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${trait.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}
                  data-oid="npama4e"
                >
                  {trait.icon}
                </div>
                <div className="flex-1" data-oid="wnhtj7r">
                  <div
                    className="flex items-center justify-between mb-2"
                    data-oid="fy4xxdy"
                  >
                    <h4
                      className="text-xl font-bold text-white"
                      data-oid="3:-01mv"
                    >
                      {trait.name}
                    </h4>
                    <div
                      className="text-2xl font-mono font-bold text-purple-400"
                      data-oid="yl1p1.s"
                    >
                      {personality[trait.key]}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-3" data-oid="75sqwx4">
                    {trait.description}
                  </p>

                  {/* Mini progress bar */}
                  <div
                    className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"
                    data-oid="egmf-mk"
                  >
                    <div
                      className={`h-full bg-gradient-to-r ${trait.gradient} rounded-full transition-all duration-700`}
                      style={{ width: `${personality[trait.key]}%` }}
                      data-oid="b829uez"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Trait Editor */}
        <div className="neural-card rounded-3xl p-8" data-oid="3a552-z">
          <div className="text-center mb-8" data-oid="g0dy1hy">
            <div
              className={`w-24 h-24 bg-gradient-to-br ${traits[activeTraitIndex].gradient} rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl shadow-2xl`}
              data-oid="e.we:bx"
            >
              {traits[activeTraitIndex].icon}
            </div>
            <h3
              className="text-3xl font-bold text-white mb-2"
              data-oid="scgmnfh"
            >
              {traits[activeTraitIndex].name}
            </h3>
            <p className="text-gray-300" data-oid="ijipk.3">
              {traits[activeTraitIndex].description}
            </p>
          </div>

          {/* Advanced Slider */}
          <div className="mb-8" data-oid="vbylif5">
            <div
              className="flex justify-between items-center mb-4"
              data-oid="7azn1ka"
            >
              <span className="text-gray-400" data-oid="21sfhn.">
                Intensity
              </span>
              <span
                className="text-3xl font-mono font-bold text-white"
                data-oid="00jl7-n"
              >
                {personality[traits[activeTraitIndex].key]}
              </span>
            </div>

            <div className="relative" data-oid="lplrtze">
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
                data-oid="zo2d7g."
              />

              {/* Slider markers */}
              <div
                className="flex justify-between text-xs text-gray-500 mt-2"
                data-oid="uxe32a4"
              >
                <span data-oid="om1mujc">Minimal</span>
                <span data-oid="7tx37qz">Moderate</span>
                <span data-oid="wpxdz76">Strong</span>
                <span data-oid="_bu-a4_">Dominant</span>
              </div>
            </div>
          </div>

          {/* Trait Examples */}
          <div data-oid="h28.3rs">
            <h4
              className="text-lg font-semibold text-white mb-4"
              data-oid="le2vyac"
            >
              This trait enables:
            </h4>
            <div className="space-y-2" data-oid="brkcpvm">
              {traits[activeTraitIndex].examples.map((example, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 text-gray-300"
                  data-oid="eu2s292"
                >
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full"
                    data-oid="5b1gu7d"
                  />

                  <span data-oid="g1f9:r3">{example}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Personality Presets */}
      <div className="neural-card rounded-2xl p-6" data-oid="36oczia">
        <h4
          className="text-xl font-bold text-white mb-6 flex items-center"
          data-oid="hguo5sd"
        >
          <span className="mr-3" data-oid="olsgm4p">
            ⚡
          </span>
          Quick Personality Presets
        </h4>
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          data-oid="tnfe8tk"
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
              data-oid="290548r"
            >
              <div className="text-3xl mb-2" data-oid="9u:7t0e">
                {preset.icon}
              </div>
              <div
                className="text-white font-semibold text-sm"
                data-oid="l6w8iut"
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
      data-oid="58b.9--"
    >
      <div
        className="neural-card rounded-2xl p-4 backdrop-blur-xl"
        data-oid="ocaw97l"
      >
        <div className="space-y-4" data-oid="abqcfxa">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={`group cursor-pointer transition-all duration-300 ${
                step <= currentStep ? "opacity-100" : "opacity-40"
              }`}
              onClick={() => step <= currentStep && onStepChange(step)}
              data-oid="26ocuqr"
            >
              <div className="flex items-center space-x-3" data-oid="f4zbn06">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    step === currentStep
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-110 shadow-lg"
                      : step < currentStep
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-400"
                  }`}
                  data-oid="lrk5xyo"
                >
                  {step < currentStep ? "✓" : step}
                </div>
                <div
                  className={`text-xs transition-all duration-300 ${
                    step === currentStep
                      ? "text-white opacity-100"
                      : "text-gray-400 opacity-0 group-hover:opacity-100"
                  }`}
                  data-oid="mpfa8tw"
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
    <div className="space-y-8" data-oid="x0vdfnb">
      {/* Template Categories */}
      <div className="text-center mb-12" data-oid="ejqad73">
        <div
          className="inline-flex bg-gray-800/50 rounded-2xl p-2 backdrop-blur-sm"
          data-oid="xplf7s4"
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
                data-oid="0c5.so1"
              >
                {category}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid md:grid-cols-3 gap-8" data-oid="eam44f-">
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
            data-oid="uyyag3y"
          >
            {/* Animated background */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              data-oid="ruk-4g0"
            />

            {/* Popular badge */}
            {template.popular && (
              <div
                className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-2 rounded-full transform rotate-12 shadow-lg"
                data-oid="drbte:4"
              >
                🔥 Popular
              </div>
            )}

            <div className="relative z-10 text-center" data-oid="htl7rnt">
              {/* Icon */}
              <div
                className={`w-24 h-24 bg-gradient-to-br ${template.gradient} rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-110`}
                data-oid="4k96icr"
              >
                {template.icon}
              </div>

              {/* Title */}
              <h3
                className="text-2xl font-bold text-white mb-4 group-hover:text-purple-200 transition-colors"
                data-oid="afiv14c"
              >
                {template.title}
              </h3>

              {/* Description */}
              <p
                className="text-gray-400 mb-6 leading-relaxed"
                data-oid="a0_6_g0"
              >
                {template.description}
              </p>

              {/* Features */}
              <div className="space-y-3 mb-6" data-oid="951yntq">
                {template.features.map((feature: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center space-x-2 text-sm"
                    data-oid=":5gubn:"
                  >
                    <div
                      className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                      data-oid="qdy1dlt"
                    />

                    <span className="text-gray-300" data-oid="zlivduq">
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
                data-oid="-qm3pw_"
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
      data-oid="9rb41hb"
    >
      {avatar.pattern && (
        <div
          className={`absolute inset-0 ${avatar.pattern} opacity-30`}
          data-oid="2wn_9tj"
        />
      )}
      <div
        className="relative z-10 text-white font-bold text-2xl"
        data-oid="9o6r9k:"
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
    <div className="space-y-8" data-oid="8wlkf7n">
      {/* Current Avatar Preview */}
      <div
        className="neural-card rounded-3xl p-12 text-center relative overflow-hidden"
        data-oid="basvtid"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"
          data-oid="m-8_8na"
        />

        <div className="relative z-10" data-oid="ky5qepd">
          <h3 className="text-3xl font-bold text-white mb-8" data-oid="v.1bk.a">
            Your Avatar
          </h3>

          <div
            className="flex items-center justify-center space-x-12 mb-8"
            data-oid="38z8v4a"
          >
            {/* Large avatar preview */}
            <div className="relative" data-oid="1m90b6s">
              <div
                className={`w-32 h-32 rounded-full bg-gradient-to-br ${generatedAvatar?.gradient} flex items-center justify-center shadow-2xl`}
                data-oid="tvekun9"
              >
                <span
                  className="text-5xl font-bold text-white"
                  data-oid="vh2lxbf"
                >
                  {generatedAvatar?.initial}
                </span>
              </div>
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full animate-pulse"
                data-oid="thhbozx"
              />
            </div>

            {/* Avatar info */}
            <div className="text-left" data-oid="jgpxj_0">
              <h4
                className="text-2xl font-bold text-white mb-2"
                data-oid="6v_u67s"
              >
                {generatedAvatar?.name}
              </h4>
              <p className="text-gray-400 mb-4" data-oid="a0l0ol6">
                Generated from your personality traits
              </p>

              {/* Personality influence */}
              <div className="space-y-2" data-oid=".q..swe">
                <div className="text-sm text-gray-300" data-oid="8xy03d2">
                  Influenced by:
                </div>
                {Object.entries(personality).map(([trait, value]) => (
                  <div
                    key={trait}
                    className="flex items-center space-x-2 text-xs"
                    data-oid="oggenz1"
                  >
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full"
                      data-oid=".z8f5xf"
                    />

                    <span
                      className="text-gray-400 capitalize"
                      data-oid="hzmmac_"
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
            data-oid="hwfoukp"
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2" data-oid="584:kwa">
                <div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  data-oid="vo09236"
                />

                <span data-oid="ods8j:r">Generating...</span>
              </div>
            ) : (
              "🎲 Generate New Avatar"
            )}
          </button>
        </div>
      </div>

      {/* Avatar Variations */}
      <div className="grid md:grid-cols-4 gap-6" data-oid="p9.eubo">
        {avatarVariations.map((avatar, index) => (
          <div
            key={index}
            className={`neural-card rounded-2xl p-6 cursor-pointer text-center transition-all duration-500 hover:scale-105 ${
              selectedAvatar?.name === avatar.name
                ? "ring-2 ring-purple-500/50 bg-purple-500/10"
                : ""
            }`}
            onClick={() => onAvatarSelect(avatar)}
            data-oid="6yl5ve9"
          >
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatar.gradient} mx-auto mb-4 flex items-center justify-center shadow-lg`}
              data-oid="q20a6re"
            >
              <span
                className="text-2xl font-bold text-white"
                data-oid="-mau0dq"
              >
                {avatar.initial}
              </span>
            </div>
            <h4 className="text-white font-semibold mb-2" data-oid="o--28yb">
              {avatar.name}
            </h4>
            <span
              className="text-xs text-gray-400 capitalize"
              data-oid=".o0_4xe"
            >
              {avatar.type}
            </span>
          </div>
        ))}
      </div>

      {/* Custom Upload Option */}
      <div
        className="neural-card rounded-2xl p-8 text-center border-2 border-dashed border-gray-600 hover:border-purple-500 transition-colors cursor-pointer"
        data-oid="aw::nkx"
      >
        <div
          className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
          data-oid="mhpt:.k"
        >
          📁
        </div>
        <h4 className="text-white font-semibold mb-2" data-oid="i3rwf.n">
          Upload Custom Avatar
        </h4>
        <p className="text-gray-400 text-sm" data-oid="o8.2.7q">
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
          <div className="max-w-7xl mx-auto" data-oid="oghqemi">
            <TemplateSelector
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelect={setSelectedTemplate}
              data-oid="t7lgq48"
            />

            <div className="text-center mt-12" data-oid="rhyu.zb">
              <button
                onClick={handleNext}
                disabled={!selectedTemplate}
                className={`neural-button px-16 py-5 text-white font-bold text-xl rounded-2xl transition-all duration-500 ${
                  selectedTemplate
                    ? "hover:scale-105 shadow-2xl shadow-purple-500/30"
                    : "opacity-50 cursor-not-allowed"
                }`}
                data-oid="d05pls5"
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
          <div className="max-w-7xl mx-auto" data-oid="5lcbdt:">
            <PersonalityDesigner
              personality={personality}
              setPersonality={setPersonality}
              onTraitChange={(trait, value) => {
                // Add any additional logic for trait changes
                console.log(`${trait} changed to ${value}`);
              }}
              data-oid="o77vfdw"
            />

            <div
              className="flex justify-center space-x-6 mt-12"
              data-oid="6rpogjg"
            >
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
                data-oid="8o2wd7b"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-16 py-4 text-white font-bold text-xl rounded-xl hover:scale-105 transition-all"
                data-oid="-z-zn5y"
              >
                Continue to Avatar →
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="max-w-7xl mx-auto" data-oid="g9gppgg">
            <AvatarCreator
              generatedAvatar={generatedAvatar}
              selectedAvatar={selectedAvatar}
              onAvatarSelect={setSelectedAvatar}
              personality={personality}
              data-oid="6:haj7e"
            />

            <div
              className="flex justify-center space-x-6 mt-12"
              data-oid="m6222g."
            >
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
                data-oid="8lueo-m"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-16 py-4 text-white font-bold text-xl rounded-xl hover:scale-105 transition-all"
                data-oid="sr35r86"
              >
                Continue to Identity →
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="max-w-4xl mx-auto space-y-8" data-oid="680un.o">
            {/* Muse Identity Form */}
            <div className="neural-card rounded-3xl p-8" data-oid="q:kxwq3">
              <h3
                className="text-3xl font-bold text-white mb-8 text-center"
                data-oid="howdggg"
              >
                Define Your Muse's Identity
              </h3>

              <div className="space-y-6" data-oid="puzrhnc">
                {/* Name Input */}
                <div data-oid="4rr2824">
                  <label
                    className="block text-white font-semibold mb-3"
                    data-oid="pk3_kq."
                  >
                    Muse Name
                  </label>
                  <input
                    type="text"
                    value={museName}
                    onChange={(e) => setMuseName(e.target.value)}
                    placeholder="Enter your muse's name..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-lg"
                    data-oid="4n_qe7g"
                  />
                </div>

                {/* Description Input */}
                <div data-oid="-meg6rh">
                  <label
                    className="block text-white font-semibold mb-3"
                    data-oid="-b:9s:x"
                  >
                    Personality Description
                  </label>
                  <textarea
                    value={museDescription}
                    onChange={(e) => setMuseDescription(e.target.value)}
                    placeholder="Describe your muse's personality, interests, and unique traits..."
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                    data-oid=":bo2d4y"
                  />
                </div>

                {/* Behavioral Settings */}
                <div className="grid md:grid-cols-2 gap-6" data-oid="p4208fx">
                  <div data-oid="3n7sn7o">
                    <label
                      className="block text-white font-semibold mb-3"
                      data-oid="518o1ef"
                    >
                      Communication Style
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      data-oid="k1v7wss"
                    >
                      <option data-oid="1gz0lag">Casual & Friendly</option>
                      <option data-oid="o-ci2j4">Professional & Formal</option>
                      <option data-oid="bu17_4o">Playful & Energetic</option>
                      <option data-oid="otab08n">Calm & Thoughtful</option>
                    </select>
                  </div>

                  <div data-oid="9cvwk..">
                    <label
                      className="block text-white font-semibold mb-3"
                      data-oid="tgbuy8v"
                    >
                      Response Length
                    </label>
                    <select
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      data-oid="8souwnn"
                    >
                      <option data-oid="81av2g.">Concise</option>
                      <option data-oid="z4hu90a">Balanced</option>
                      <option data-oid="th7ec89">Detailed</option>
                      <option data-oid="h3lt-z1">Comprehensive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="neural-card rounded-3xl p-8" data-oid="i2hhrs9">
              <h4
                className="text-2xl font-bold text-white mb-6 text-center"
                data-oid="_fgxnvq"
              >
                Preview
              </h4>
              <div
                className="flex items-center space-x-6 p-6 bg-gray-800/30 rounded-2xl"
                data-oid="tq8s_bx"
              >
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${generatedAvatar?.gradient} flex items-center justify-center shadow-lg`}
                  data-oid="mv:kh4:"
                >
                  <span
                    className="text-2xl font-bold text-white"
                    data-oid="i.:-42l"
                  >
                    {generatedAvatar?.initial}
                  </span>
                </div>
                <div className="flex-1" data-oid="ia:1n6s">
                  <h5
                    className="text-2xl font-bold text-white mb-2"
                    data-oid="gaha1x7"
                  >
                    {museName || "Your Muse"}
                  </h5>
                  <p className="text-gray-400 mb-3" data-oid="a_t2_vi">
                    {museDescription ||
                      "A unique AI companion with a carefully crafted personality."}
                  </p>
                  <div className="flex space-x-4 text-sm" data-oid="t1pmanx">
                    {Object.entries(personality).map(([trait, value]) => (
                      <div
                        key={trait}
                        className="flex items-center space-x-1"
                        data-oid="wishedc"
                      >
                        <span
                          className="text-gray-500 capitalize"
                          data-oid="298jfll"
                        >
                          {trait}:
                        </span>
                        <span
                          className="text-purple-400 font-bold"
                          data-oid="p1.ss1e"
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-6" data-oid="4lt:nl.">
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
                data-oid="oy8rdfi"
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
                data-oid="-olyqdu"
              >
                Deploy Muse →
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="max-w-6xl mx-auto" data-oid="0ju8mbt">
            <div className="grid lg:grid-cols-2 gap-8 mb-12" data-oid="baib-ge">
              {/* Avatar and Personality Summary */}
              <div className="neural-card rounded-2xl p-8" data-oid="8hdbnjj">
                <div
                  className="flex items-center justify-center space-x-8 mb-8"
                  data-oid="wik029-"
                >
                  <AvatarPreview avatar={generatedAvatar} data-oid="4x40.q_" />
                  <div
                    className="flex flex-col items-center space-y-2"
                    data-oid="zt6hzee"
                  >
                    <div
                      className="text-4xl font-mono text-purple-400"
                      data-oid=".wl.93o"
                    >
                      #preview
                    </div>
                    <AvatarPreview
                      avatar={generatedAvatar}
                      size="small"
                      data-oid="cb47i_8"
                    />
                  </div>
                </div>

                <h3
                  className="text-2xl font-semibold text-white text-center mb-2"
                  data-oid=":ebxmi-"
                >
                  {generatedAvatar?.name || "Balanced Harmony"}
                </h3>
                <p
                  className="text-gray-400 text-center mb-8"
                  data-oid="lg7oypf"
                >
                  All aspects of being flow together in perfect equilibrium,
                  adaptable to any moment.
                </p>

                <div className="space-y-4" data-oid="awc.6gs">
                  {Object.entries(personality).map(([trait, value]) => (
                    <div
                      key={trait}
                      className="flex items-center justify-between"
                      data-oid="fuc4cbw"
                    >
                      <span
                        className="text-white capitalize font-medium"
                        data-oid="7v6jtj6"
                      >
                        {trait}
                      </span>
                      <div
                        className="flex items-center space-x-3"
                        data-oid=":az3mcz"
                      >
                        <div
                          className="w-24 h-2 bg-gray-700 rounded-full"
                          data-oid="7y_f:o5"
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
                            data-oid="47eg0mi"
                          />
                        </div>
                        <span
                          className="text-white font-mono font-bold text-lg w-8"
                          data-oid="l0hvbq5"
                        >
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Responses */}
              <div data-oid="mpd4lbe">
                <h3
                  className="text-2xl font-semibold text-white mb-6 flex items-center"
                  data-oid="1qngsp_"
                >
                  <span className="text-2xl mr-2" data-oid="v:ica7d">
                    ✨
                  </span>
                  Sample Responses
                </h3>

                <div className="space-y-4" data-oid="u077wdg">
                  {sampleResponses.map((sample, index) => (
                    <div
                      key={index}
                      className="neural-card rounded-xl p-4"
                      data-oid="pil18_a"
                    >
                      <div
                        className="flex items-start space-x-3 mb-3"
                        data-oid="l8-4w5c"
                      >
                        <div
                          className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs"
                          data-oid="ep_uv8h"
                        >
                          👤
                        </div>
                        <div className="text-gray-300" data-oid="pr89e1d">
                          User: "{sample.user}"
                        </div>
                      </div>
                      <div
                        className="pl-9 text-gray-200 leading-relaxed"
                        data-oid="d:nr_h-"
                      >
                        {sample.response}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4" data-oid="k0bdnku">
              <button
                onClick={handleBack}
                className="px-8 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
                data-oid="ivlqc1i"
              >
                Back to Avatar
              </button>
              <button
                onClick={() => {
                  /* Test interaction */
                }}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all"
                data-oid="rx.ilix"
              >
                Test Interaction
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-8 py-3 text-white font-semibold rounded-xl"
                data-oid="5gxuzcj"
              >
                Create Muse
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="max-w-2xl mx-auto text-center" data-oid="gn-.pxh">
            <div
              className="neural-card rounded-2xl p-12 mb-8"
              data-oid="vyy7tbj"
            >
              <h3
                className="text-2xl font-semibold text-white mb-8"
                data-oid="fo9h6hn"
              >
                Transaction Details
              </h3>

              <div className="space-y-6 text-left" data-oid="pna662l">
                <div
                  className="flex justify-between items-center"
                  data-oid="7pne:zq"
                >
                  <span className="text-gray-400" data-oid="5_enqf.">
                    Network:
                  </span>
                  <span className="text-white font-mono" data-oid="iqq.8l7">
                    Metis Hyperion Testnet
                  </span>
                </div>
                <div
                  className="flex justify-between items-center"
                  data-oid="jv-owaj"
                >
                  <span className="text-gray-400" data-oid="6bxhdk4">
                    Gas Fee:
                  </span>
                  <span className="text-white font-mono" data-oid="e6kphkz">
                    ~0.001 METIS
                  </span>
                </div>
                <div
                  className="flex justify-between items-center"
                  data-oid="p9lfko."
                >
                  <span className="text-gray-400" data-oid="1l_zmjf">
                    Your Wallet:
                  </span>
                  <span className="text-white font-mono" data-oid="cuz7awa">
                    0x3BD9...7881
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4" data-oid="_lur-h.">
              <button
                onClick={handleBack}
                className="px-8 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
                data-oid="8u76itk"
              >
                Back to Preview
              </button>
              <button
                onClick={handleCreateMuse}
                disabled={isCreating}
                className={`neural-button px-8 py-3 text-white font-semibold rounded-xl ${
                  isCreating ? "opacity-50 cursor-not-allowed" : ""
                }`}
                data-oid="k86vu_n"
              >
                {isCreating ? (
                  <div
                    className="flex items-center space-x-2"
                    data-oid="yvu7ntj"
                  >
                    <div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                      data-oid="s-:vhlz"
                    />

                    <span data-oid="mc297g9">Creating...</span>
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
      data-oid="e8rnmtu"
    >
      {/* Enhanced Background Effects */}
      <NeuralNetwork data-oid="e.__69l" />

      <div className="absolute inset-0 overflow-hidden" data-oid="eqeoh1j">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          data-oid="v0qq:m6"
        />

        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          data-oid="syovolt"
        />

        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"
          data-oid="fdqpimr"
        />
      </div>

      {/* Geometric Background Pattern */}
      <div className="geometric-bg" data-oid="2voa2iz">
        <div className="geometric-shape" data-oid="akkxtzm" />
        <div className="geometric-shape" data-oid="pz4beau" />
        <div className="geometric-shape" data-oid="s_nffbo" />
      </div>

      {/* Navigation */}
      <nav
        className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto"
        data-oid="1ugj.5m"
      >
        <Link
          href="/"
          className="flex items-center space-x-3"
          data-oid="xl5tufc"
        >
          <div
            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white"
            data-oid="n5cu4ji"
          >
            M
          </div>
          <div data-oid="wlxkzx9">
            <span
              className="text-2xl font-bold hero-gradient-text"
              data-oid="-owy9ys"
            >
              MetaMuse
            </span>
            <div className="text-xs text-gray-400 font-mono" data-oid="55-i1h5">
              Create Mode
            </div>
          </div>
        </Link>

        <Link
          href="/"
          className="px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
          data-oid="nmub4ly"
        >
          ← Back to Home
        </Link>
      </nav>

      {/* Main Content */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 py-12"
        data-oid="aljpjr2"
      >
        {/* Step Navigation */}
        <StepNavigation
          currentStep={currentStep}
          totalSteps={5}
          onStepChange={setCurrentStep}
          stepTitles={stepTitles}
          data-oid="49fv37z"
        />

        {/* Enhanced Step Info */}
        <div className="text-center mb-20" data-oid="hhou-u2">
          <div
            className="inline-block px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8"
            data-oid="sgsz16d"
          >
            🚀 Step {currentStep} of 5
          </div>

          <h1
            className="text-6xl lg:text-7xl font-black mb-8 leading-tight"
            data-oid=":r7y:0i"
          >
            <div className="hero-gradient-text mb-2" data-oid="wataor:">
              {stepTitles[currentStep - 1]}
            </div>
          </h1>

          <p
            className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8"
            data-oid="hcntjwe"
          >
            {stepDescriptions[currentStep - 1]}
          </p>

          {/* Progress indicator */}
          <div
            className="flex justify-center items-center space-x-2 text-sm text-gray-400"
            data-oid="a06yciu"
          >
            <span data-oid="dcedjp:">Progress:</span>
            <div
              className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden"
              data-oid="w67mf:w"
            >
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${(currentStep / 5) * 100}%` }}
                data-oid="f.dg95n"
              />
            </div>
            <span data-oid="jc1u49x">
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
