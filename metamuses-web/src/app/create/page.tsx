"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMuseAIContract } from "@/hooks/useMuseAI";
import { useCompanionFactory, useHasCompanion } from "@/hooks/useMuseAICompanionFactory";
import { COMPANION_FACTORY_ADDRESS } from "@/contracts/MuseAICompanionFactory";

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
    {
      key: "logic",
      name: "Logic",
      icon: "🧠",
      color: "indigo",
      description: "Analytical reasoning and problem-solving",
      examples: [
        "Systematic thinking",
        "Data analysis",
        "Strategic planning",
      ],
      gradient: "from-indigo-500 via-violet-500 to-indigo-600",
    },
  ];

  const handleTraitChange = (traitKey: string, value: number) => {
    setIsAnimating(true);
    setPersonality({ ...personality, [traitKey]: value });
    onTraitChange?.(traitKey, value);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const getPersonalityArchetype = () => {
    const { creativity, wisdom, humor, empathy, logic } = personality;
    const dominant = Math.max(creativity, wisdom, humor, empathy, logic);

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
    if (dominant === logic && logic > 70)
      return {
        name: "The Analyst",
        desc: "Precise reasoning illuminates every problem",
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
    <div className="space-y-8">
      {/* Personality Archetype Display */}
      <div className="neural-card rounded-3xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />

        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl shadow-2xl">
            🧠
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">
            {archetype.name}
          </h3>
          <p className="text-gray-300 text-lg mb-6">{archetype.desc}</p>

          {/* Personality Radar */}
          <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
            {traits.map((trait) => (
              <div key={trait.key} className="text-center">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${trait.gradient} rounded-xl mx-auto mb-2 flex items-center justify-center text-xl shadow-lg`}
                >
                  {trait.icon}
                </div>
                <div className="text-2xl font-bold text-white">
                  {personality[trait.key]}
                </div>
                <div className="text-xs text-gray-400">{trait.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Trait Designer */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Trait Selection */}
        <div className="space-y-4">
          {traits.map((trait, index) => (
            <div
              key={trait.key}
              className={`neural-card rounded-2xl p-6 cursor-pointer transition-all duration-500 ${
                activeTraitIndex === index
                  ? "ring-2 ring-purple-500/50 bg-purple-500/10 scale-105"
                  : "hover:scale-102"
              }`}
              onClick={() => setActiveTraitIndex(index)}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${trait.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}
                >
                  {trait.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xl font-bold text-white">
                      {trait.name}
                    </h4>
                    <div className="text-2xl font-mono font-bold text-purple-400">
                      {personality[trait.key]}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    {trait.description}
                  </p>

                  {/* Mini progress bar */}
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${trait.gradient} rounded-full transition-all duration-700`}
                      style={{ width: `${personality[trait.key]}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Trait Editor */}
        <div className="neural-card rounded-3xl p-8">
          <div className="text-center mb-8">
            <div
              className={`w-24 h-24 bg-gradient-to-br ${traits[activeTraitIndex].gradient} rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl shadow-2xl`}
            >
              {traits[activeTraitIndex].icon}
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">
              {traits[activeTraitIndex].name}
            </h3>
            <p className="text-gray-300">
              {traits[activeTraitIndex].description}
            </p>
          </div>

          {/* Advanced Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Intensity</span>
              <span className="text-3xl font-mono font-bold text-white">
                {personality[traits[activeTraitIndex].key]}
              </span>
            </div>

            <div className="relative">
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
              />

              {/* Slider markers */}
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Minimal</span>
                <span>Moderate</span>
                <span>Strong</span>
                <span>Dominant</span>
              </div>
            </div>
          </div>

          {/* Trait Examples */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              This trait enables:
            </h4>
            <div className="space-y-2">
              {traits[activeTraitIndex].examples.map((example, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 text-gray-300"
                >
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />

                  <span>{example}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Personality Presets */}
      <div className="neural-card rounded-2xl p-6">
        <h4 className="text-xl font-bold text-white mb-6 flex items-center">
          <span className="mr-3">⚡</span>
          Quick Personality Presets
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            >
              <div className="text-3xl mb-2">{preset.icon}</div>
              <div className="text-white font-semibold text-sm">
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
    <div className="fixed left-8 top-1/2 transform -translate-y-1/2 z-30 hidden lg:block">
      <div className="neural-card rounded-2xl p-4 backdrop-blur-xl">
        <div className="space-y-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={`group cursor-pointer transition-all duration-300 ${
                step <= currentStep ? "opacity-100" : "opacity-40"
              }`}
              onClick={() => step <= currentStep && onStepChange(step)}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    step === currentStep
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-110 shadow-lg"
                      : step < currentStep
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {step < currentStep ? "✓" : step}
                </div>
                <div
                  className={`text-xs transition-all duration-300 ${
                    step === currentStep
                      ? "text-white opacity-100"
                      : "text-gray-400 opacity-0 group-hover:opacity-100"
                  }`}
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
    <div className="space-y-8">
      {/* Template Categories */}
      <div className="text-center mb-12">
        <div className="inline-flex bg-gray-800/50 rounded-2xl p-2 backdrop-blur-sm">
          {["Popular", "Creative", "Professional", "Custom"].map(
            (category, idx) => (
              <button
                key={category}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  idx === 0
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {category}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid md:grid-cols-3 gap-8">
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
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Popular badge */}
            {template.popular && (
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-2 rounded-full transform rotate-12 shadow-lg">
                🔥 Popular
              </div>
            )}

            <div className="relative z-10 text-center">
              {/* Icon */}
              <div
                className={`w-24 h-24 bg-gradient-to-br ${template.gradient} rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-110`}
              >
                {template.icon}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-200 transition-colors">
                {template.title}
              </h3>

              {/* Description */}
              <p className="text-gray-400 mb-6 leading-relaxed">
                {template.description}
              </p>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {template.features.map((feature: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center space-x-2 text-sm"
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />

                    <span className="text-gray-300">{feature}</span>
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
    >
      {avatar.pattern && (
        <div className={`absolute inset-0 ${avatar.pattern} opacity-30`} />
      )}
      <div className="relative z-10 text-white font-bold text-2xl">
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
    <div className="space-y-8">
      {/* Current Avatar Preview */}
      <div className="neural-card rounded-3xl p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />

        <div className="relative z-10">
          <h3 className="text-3xl font-bold text-white mb-8">Your Avatar</h3>

          <div className="flex items-center justify-center space-x-12 mb-8">
            {/* Large avatar preview */}
            <div className="relative">
              <div
                className={`w-32 h-32 rounded-full bg-gradient-to-br ${generatedAvatar?.gradient} flex items-center justify-center shadow-2xl`}
              >
                <span className="text-5xl font-bold text-white">
                  {generatedAvatar?.initial}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full animate-pulse" />
            </div>

            {/* Avatar info */}
            <div className="text-left">
              <h4 className="text-2xl font-bold text-white mb-2">
                {generatedAvatar?.name}
              </h4>
              <p className="text-gray-400 mb-4">
                Generated from your personality traits
              </p>

              {/* Personality influence */}
              <div className="space-y-2">
                <div className="text-sm text-gray-300">Influenced by:</div>
                {Object.entries(personality).map(([trait, value]) => (
                  <div
                    key={trait}
                    className="flex items-center space-x-2 text-xs"
                  >
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />

                    <span className="text-gray-400 capitalize">
                      {String(trait)}: {String(value)}%
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
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />

                <span>Generating...</span>
              </div>
            ) : (
              "🎲 Generate New Avatar"
            )}
          </button>
        </div>
      </div>

      {/* Avatar Variations */}
      <div className="grid md:grid-cols-4 gap-6">
        {avatarVariations.map((avatar, index) => (
          <div
            key={index}
            className={`neural-card rounded-2xl p-6 cursor-pointer text-center transition-all duration-500 hover:scale-105 ${
              selectedAvatar?.name === avatar.name
                ? "ring-2 ring-purple-500/50 bg-purple-500/10"
                : ""
            }`}
            onClick={() => onAvatarSelect(avatar)}
          >
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatar.gradient} mx-auto mb-4 flex items-center justify-center shadow-lg`}
            >
              <span className="text-2xl font-bold text-white">
                {avatar.initial}
              </span>
            </div>
            <h4 className="text-white font-semibold mb-2">{avatar.name}</h4>
            <span className="text-xs text-gray-400 capitalize">
              {avatar.type}
            </span>
          </div>
        ))}
      </div>

      {/* Custom Upload Option */}
      <div className="neural-card rounded-2xl p-8 text-center border-2 border-dashed border-gray-600 hover:border-purple-500 transition-colors cursor-pointer">
        <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
          📁
        </div>
        <h4 className="text-white font-semibold mb-2">Upload Custom Avatar</h4>
        <p className="text-gray-400 text-sm">
          Drag & drop or click to upload your own image
        </p>
      </div>
    </div>
  );
};

// NFT Card Component for selection
const NFTCard = ({
  tokenId,
  isSelected,
  onSelect,
}: {
  tokenId: bigint;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const { data: hasCompanion } = useHasCompanion(tokenId);

  return (
    <div
      onClick={hasCompanion ? undefined : onSelect}
      className={`neural-card rounded-xl p-4 cursor-pointer transition-all duration-300 ${
        isSelected
          ? "ring-2 ring-purple-500 bg-purple-500/10 scale-105"
          : hasCompanion
            ? "opacity-50 cursor-not-allowed"
            : "hover:scale-105 hover:bg-white/5"
      }`}
    >
      <div className="w-full aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg mb-3 flex items-center justify-center">
        <span className="text-4xl font-bold text-purple-400">
          #{tokenId.toString()}
        </span>
      </div>
      <div className="text-center">
        <p className="text-white font-semibold">MuseAI #{tokenId.toString()}</p>
        {hasCompanion ? (
          <span className="text-xs text-yellow-400">Has Companion</span>
        ) : isSelected ? (
          <span className="text-xs text-purple-400">Selected</span>
        ) : (
          <span className="text-xs text-gray-400">Available</span>
        )}
      </div>
    </div>
  );
};

export default function CreateMusePage() {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [personality, setPersonality] = useState({
    creativity: 50,
    wisdom: 50,
    humor: 50,
    empathy: 50,
    logic: 50,
  });
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null);
  const [generatedAvatar, setGeneratedAvatar] = useState<any>(null);
  const [museName, setMuseName] = useState("");
  const [museDescription, setMuseDescription] = useState("");

  // NFT Selection state
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [deployedCompanionAddress, setDeployedCompanionAddress] = useState<string | null>(null);

  // Wallet and contract hooks
  const { address, isConnected } = useAccount();
  const { useTokensOfOwner } = useMuseAIContract();
  const { data: ownedTokens, isLoading: isLoadingTokens } = useTokensOfOwner(address);

  const {
    deployCompanion,
    isPending,
    isConfirming,
    isConfirmed,
    error: deployError,
    hash,
    reset: resetDeploy,
  } = useCompanionFactory();

  // Check if selected token already has a companion
  const { data: hasExistingCompanion } = useHasCompanion(selectedTokenId ?? undefined);

  // Derived state
  const isCreating = isPending || isConfirming;

  // Handle successful deployment
  useEffect(() => {
    if (isConfirmed && hash) {
      setShowSuccessModal(true);
    }
  }, [isConfirmed, hash]);

  // Handle deployment error
  useEffect(() => {
    if (deployError) {
      setShowErrorModal(true);
    }
  }, [deployError]);

  // Generate avatar based on personality
  useEffect(() => {
    const generateAvatar = () => {
      const { creativity, wisdom, humor, empathy, logic } = personality;
      const dominant = Math.max(creativity, wisdom, humor, empathy, logic);

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
      } else if (dominant === logic) {
        gradient = "from-indigo-500 to-violet-500";
        initial = "L";
        pattern = "bg-gradient-to-r";
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
    "Select NFT",
    "Template",
    "Personality",
    "Avatar",
    "Identity",
    "Deploy",
  ];

  const stepDescriptions = [
    "Connect wallet and select which NFT to create a companion for",
    "Choose a starting template or begin with a blank canvas",
    "Design your AI companion's core personality traits",
    "Create a unique visual identity for your muse",
    "Define name, backstory, and behavioral patterns",
    "Deploy your AI companion to the blockchain",
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
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateMuse = async () => {
    if (!selectedTokenId || !museName.trim()) return;

    // Deploy companion to blockchain
    deployCompanion(selectedTokenId, personality, museName.trim());
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    resetDeploy();
    // Reset form for creating another
    setCurrentStep(1);
    setSelectedTokenId(null);
    setMuseName("");
    setMuseDescription("");
    setPersonality({
      creativity: 50,
      wisdom: 50,
      humor: 50,
      empathy: 50,
      logic: 50,
    });
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    resetDeploy();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // NFT Selection Step
        return (
          <div className="max-w-4xl mx-auto">
            <div className="neural-card rounded-3xl p-8 mb-8">
              <h3 className="text-3xl font-bold text-white mb-4 text-center">
                Select Your MuseAI NFT
              </h3>
              <p className="text-gray-400 text-center mb-8">
                Connect your wallet and choose which NFT to create an AI companion for
              </p>

              {!isConnected ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <span className="text-4xl">🔗</span>
                  </div>
                  <h4 className="text-xl text-white font-semibold mb-4">
                    Connect Your Wallet
                  </h4>
                  <p className="text-gray-400 mb-6">
                    Please connect your wallet to view your MuseAI NFTs
                  </p>
                  <ConnectButton />
                </div>
              ) : isLoadingTokens ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading your NFTs...</p>
                </div>
              ) : !ownedTokens || ownedTokens.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <span className="text-4xl">🎭</span>
                  </div>
                  <h4 className="text-xl text-white font-semibold mb-4">
                    No MuseAI NFTs Found
                  </h4>
                  <p className="text-gray-400 mb-6">
                    You need to own a MuseAI NFT to create an AI companion
                  </p>
                  <Link
                    href="/mint"
                    className="neural-button px-8 py-3 text-white font-semibold rounded-xl inline-block"
                  >
                    Mint a MuseAI NFT
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {ownedTokens.map((tokenId: bigint) => {
                    const isSelected = selectedTokenId === tokenId;
                    return (
                      <NFTCard
                        key={tokenId.toString()}
                        tokenId={tokenId}
                        isSelected={isSelected}
                        onSelect={() => setSelectedTokenId(tokenId)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {selectedTokenId !== null && hasExistingCompanion && (
              <div className="neural-card rounded-xl p-4 mb-8 border border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-yellow-400 font-semibold">Companion Already Exists</p>
                    <p className="text-gray-400 text-sm">
                      This NFT already has an AI companion deployed. Select a different NFT.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleNext}
                disabled={!selectedTokenId || hasExistingCompanion}
                className={`neural-button px-16 py-5 text-white font-bold text-xl rounded-2xl transition-all duration-500 ${
                  selectedTokenId && !hasExistingCompanion
                    ? "hover:scale-105 shadow-2xl shadow-purple-500/30"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                {selectedTokenId
                  ? hasExistingCompanion
                    ? "Select a Different NFT"
                    : `Continue with NFT #${selectedTokenId.toString()}`
                  : "Select an NFT to Continue"}
              </button>
            </div>
          </div>
        );

      case 2:
        // Template Selection
        return (
          <div className="max-w-7xl mx-auto">
            <TemplateSelector
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelect={setSelectedTemplate}
            />

            <div className="flex justify-center space-x-6 mt-12">
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedTemplate}
                className={`neural-button px-16 py-5 text-white font-bold text-xl rounded-2xl transition-all duration-500 ${
                  selectedTemplate
                    ? "hover:scale-105 shadow-2xl shadow-purple-500/30"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                {selectedTemplate
                  ? "Continue with Selection"
                  : "Select a Template to Continue"}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="max-w-7xl mx-auto">
            <PersonalityDesigner
              personality={personality}
              setPersonality={setPersonality}
              onTraitChange={(trait, value) => {
                // Add any additional logic for trait changes
                console.log(`${trait} changed to ${value}`);
              }}
            />

            <div className="flex justify-center space-x-6 mt-12">
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-16 py-4 text-white font-bold text-xl rounded-xl hover:scale-105 transition-all"
              >
                Continue to Avatar →
              </button>
            </div>
          </div>
        );

      case 4:
        // Avatar Creation
        return (
          <div className="max-w-7xl mx-auto">
            <AvatarCreator
              generatedAvatar={generatedAvatar}
              selectedAvatar={selectedAvatar}
              onAvatarSelect={setSelectedAvatar}
              personality={personality}
            />

            <div className="flex justify-center space-x-6 mt-12">
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="neural-button px-16 py-4 text-white font-bold text-xl rounded-xl hover:scale-105 transition-all"
              >
                Continue to Identity →
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Muse Identity Form */}
            <div className="neural-card rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-white mb-8 text-center">
                Define Your Muse's Identity
              </h3>

              <div className="space-y-6">
                {/* Name Input */}
                <div>
                  <label className="block text-white font-semibold mb-3">
                    Muse Name
                  </label>
                  <input
                    type="text"
                    value={museName}
                    onChange={(e) => setMuseName(e.target.value)}
                    placeholder="Enter your muse's name..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-lg"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-white font-semibold mb-3">
                    Personality Description
                  </label>
                  <textarea
                    value={museDescription}
                    onChange={(e) => setMuseDescription(e.target.value)}
                    placeholder="Describe your muse's personality, interests, and unique traits..."
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Behavioral Settings */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-semibold mb-3">
                      Communication Style
                    </label>
                    <select className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white focus:border-purple-500 focus:outline-none transition-colors">
                      <option>Casual & Friendly</option>
                      <option>Professional & Formal</option>
                      <option>Playful & Energetic</option>
                      <option>Calm & Thoughtful</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">
                      Response Length
                    </label>
                    <select className="w-full bg-gray-800 border border-gray-600 rounded-xl px-6 py-4 text-white focus:border-purple-500 focus:outline-none transition-colors">
                      <option>Concise</option>
                      <option>Balanced</option>
                      <option>Detailed</option>
                      <option>Comprehensive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="neural-card rounded-3xl p-8">
              <h4 className="text-2xl font-bold text-white mb-6 text-center">
                Preview
              </h4>
              <div className="flex items-center space-x-6 p-6 bg-gray-800/30 rounded-2xl">
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${generatedAvatar?.gradient} flex items-center justify-center shadow-lg`}
                >
                  <span className="text-2xl font-bold text-white">
                    {generatedAvatar?.initial}
                  </span>
                </div>
                <div className="flex-1">
                  <h5 className="text-2xl font-bold text-white mb-2">
                    {museName || "Your Muse"}
                  </h5>
                  <p className="text-gray-400 mb-3">
                    {museDescription ||
                      "A unique AI companion with a carefully crafted personality."}
                  </p>
                  <div className="flex space-x-4 text-sm">
                    {Object.entries(personality).map(([trait, value]) => (
                      <div key={trait} className="flex items-center space-x-1">
                        <span className="text-gray-500 capitalize">
                          {trait}:
                        </span>
                        <span className="text-purple-400 font-bold">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-6">
              <button
                onClick={handleBack}
                className="px-10 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all hover:scale-105"
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
              >
                Deploy Muse →
              </button>
            </div>
          </div>
        );

      case 6:
        // Deploy Step - Blockchain Integration
        return (
          <div className="max-w-3xl mx-auto">
            {/* Summary Card */}
            <div className="neural-card rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-semibold text-white mb-6 text-center">
                Deploy Your AI Companion
              </h3>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Companion Preview */}
                <div className="text-center">
                  <div
                    className={`w-24 h-24 rounded-full bg-gradient-to-br ${generatedAvatar?.gradient} mx-auto mb-4 flex items-center justify-center shadow-lg`}
                  >
                    <span className="text-3xl font-bold text-white">
                      {generatedAvatar?.initial}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {museName || "Unnamed Companion"}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    NFT #{selectedTokenId?.toString()}
                  </p>
                </div>

                {/* Personality Summary */}
                <div className="space-y-2">
                  <h4 className="text-white font-semibold mb-3">Personality Traits</h4>
                  {Object.entries(personality).map(([trait, value]) => (
                    <div key={trait} className="flex items-center justify-between">
                      <span className="text-gray-400 capitalize text-sm">{trait}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full">
                          <div
                            className="h-full rounded-full bg-purple-500"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <span className="text-purple-400 font-mono text-sm w-6">
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Details */}
              <div className="border-t border-gray-700 pt-6 space-y-4">
                <h4 className="text-white font-semibold mb-4">Transaction Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-white font-mono">Metis Hyperion Testnet</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Contract:</span>
                    <span className="text-white font-mono text-xs">
                      {COMPANION_FACTORY_ADDRESS.slice(0, 6)}...{COMPANION_FACTORY_ADDRESS.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Your Wallet:</span>
                    <span className="text-white font-mono">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Estimated Gas:</span>
                    <span className="text-white font-mono">~0.03 METIS</span>
                  </div>
                </div>
              </div>

              {/* Transaction Status */}
              {hash && (
                <div className="mt-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
                  <div className="flex items-center space-x-3">
                    {isConfirming ? (
                      <>
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-purple-400">Confirming transaction...</span>
                      </>
                    ) : isConfirmed ? (
                      <>
                        <span className="text-2xl">✅</span>
                        <span className="text-green-400">Transaction confirmed!</span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-purple-400">Waiting for signature...</span>
                      </>
                    )}
                  </div>
                  <a
                    href={`https://hyperion-testnet-explorer.metisdevops.link/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block"
                  >
                    View on Explorer →
                  </a>
                </div>
              )}

              {/* Error Display */}
              {deployError && (
                <div className="mt-6 p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">❌</span>
                    <span className="text-red-400">
                      {deployError.message || "Transaction failed"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleBack}
                disabled={isCreating}
                className={`px-8 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all ${
                  isCreating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                ← Back to Identity
              </button>
              <button
                onClick={handleCreateMuse}
                disabled={isCreating || !selectedTokenId || !museName.trim()}
                className={`neural-button px-12 py-3 text-white font-bold text-lg rounded-xl transition-all ${
                  isCreating || !selectedTokenId || !museName.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105"
                }`}
              >
                {isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Confirm in Wallet...</span>
                  </div>
                ) : isConfirming ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deploying...</span>
                  </div>
                ) : (
                  "Deploy Companion"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <NeuralNetwork />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />

        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
      </div>

      {/* Geometric Background Pattern */}
      <div className="geometric-bg">
        <div className="geometric-shape" />
        <div className="geometric-shape" />
        <div className="geometric-shape" />
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
            <div className="text-xs text-gray-400 font-mono">Create Mode</div>
          </div>
        </Link>

        <Link
          href="/"
          className="px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
        >
          ← Back to Home
        </Link>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Step Navigation */}
        <StepNavigation
          currentStep={currentStep}
          totalSteps={6}
          onStepChange={setCurrentStep}
          stepTitles={stepTitles}
        />

        {/* Enhanced Step Info */}
        <div className="text-center mb-20">
          <div className="inline-block px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-mono mb-8">
            🚀 Step {currentStep} of 6
          </div>

          <h1 className="text-6xl lg:text-7xl font-black mb-8 leading-tight">
            <div className="hero-gradient-text mb-2">
              {stepTitles[currentStep - 1]}
            </div>
          </h1>

          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
            {stepDescriptions[currentStep - 1]}
          </p>

          {/* Progress indicator */}
          <div className="flex justify-center items-center space-x-2 text-sm text-gray-400">
            <span>Progress:</span>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              />
            </div>
            <span>{Math.round((currentStep / 6) * 100)}%</span>
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="neural-card rounded-3xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl">✨</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Companion Deployed!
            </h3>
            <p className="text-gray-400 mb-6">
              Your AI companion has been successfully deployed to the blockchain.
              You can now start chatting with your companion!
            </p>
            {hash && (
              <a
                href={`https://hyperion-testnet-explorer.metisdevops.link/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 text-sm mb-6 inline-block"
              >
                View Transaction →
              </a>
            )}
            <div className="flex flex-col space-y-3 mt-6">
              <Link
                href="/chat"
                className="neural-button px-8 py-3 text-white font-semibold rounded-xl"
              >
                Chat with Companion
              </Link>
              <button
                onClick={handleCloseSuccessModal}
                className="px-8 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-all"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="neural-card rounded-3xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl">❌</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Deployment Failed
            </h3>
            <p className="text-gray-400 mb-6">
              {deployError?.message || "Something went wrong. Please try again."}
            </p>
            <button
              onClick={handleCloseErrorModal}
              className="neural-button px-8 py-3 text-white font-semibold rounded-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
