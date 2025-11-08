"use client";

import { useEffect, useRef } from "react";

interface TraitValues {
  creativity: number;
  wisdom: number;
  humor: number;
  empathy: number;
  logic: number;
}

interface TraitRadarChartProps {
  traits: TraitValues;
  width?: number;
  height?: number;
  className?: string;
}

export default function TraitRadarChart({
  traits,
  width = 400,
  height = 400,
  className = "",
}: TraitRadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate center and radius
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;

    // Trait names and colors
    const traitNames = ["Creativity", "Wisdom", "Humor", "Empathy", "Logic"];
    const traitKeys: (keyof TraitValues)[] = ["creativity", "wisdom", "humor", "empathy", "logic"];
    const traitValues = traitKeys.map((key) => traits[key]);

    // Number of axes
    const numAxes = traitNames.length;
    const angleStep = (Math.PI * 2) / numAxes;

    // Draw background circles (grid)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const gridRadius = (radius / 5) * i;
      ctx.beginPath();
      for (let j = 0; j <= numAxes; j++) {
        const angle = angleStep * j - Math.PI / 2;
        const x = centerX + Math.cos(angle) * gridRadius;
        const y = centerY + Math.sin(angle) * gridRadius;
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i < numAxes; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Draw labels
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < numAxes; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const labelRadius = radius + 30;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;

      ctx.fillText(traitNames[i], x, y);
    }

    // Draw trait values polygon
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(168, 85, 247, 0.5)"); // Purple
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.5)"); // Pink

    ctx.fillStyle = gradient;
    ctx.strokeStyle = "rgba(168, 85, 247, 0.8)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i <= numAxes; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const value = traitValues[i % numAxes];
      // Normalize value to 0-100 scale
      const normalizedValue = Math.min(Math.max(value, 0), 100) / 100;
      const pointRadius = radius * normalizedValue;
      const x = centerX + Math.cos(angle) * pointRadius;
      const y = centerY + Math.sin(angle) * pointRadius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw points on vertices
    ctx.fillStyle = "#a855f7";
    for (let i = 0; i < numAxes; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const value = traitValues[i];
      const normalizedValue = Math.min(Math.max(value, 0), 100) / 100;
      const pointRadius = radius * normalizedValue;
      const x = centerX + Math.cos(angle) * pointRadius;
      const y = centerY + Math.sin(angle) * pointRadius;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [traits, width, height]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="mx-auto" />
    </div>
  );
}
