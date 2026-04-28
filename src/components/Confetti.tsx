"use client";

import React, { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string; size: number;
  life: number; maxLife: number;
  rotation: number; rotationSpeed: number;
}

const COLORS = ["#EAB308", "#F97316", "#22C55E", "#8B5CF6", "#EC4899", "#FFFFFF"];

export default function Confetti({ active, onDone }: { active: boolean; onDone?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const particles = useRef<Particle[]>([]);

  const launch = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    // Burst from center-top
    particles.current = Array.from({ length: 120 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 200,
      y: H * 0.3,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 1.5) * 12,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      life: 0,
      maxLife: 80 + Math.random() * 60,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
    }));

    const tick = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      particles.current = particles.current.filter(p => p.life < p.maxLife);
      if (particles.current.length === 0) { onDone?.(); return; }

      particles.current.forEach(p => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.99; // drag
        p.rotation += p.rotationSpeed;

        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
  }, [onDone]);

  useEffect(() => {
    if (active) {
      launch();
      // Haptic burst — 3 pulses
      if (navigator.vibrate) navigator.vibrate([80, 50, 80, 50, 120]);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [active, launch]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[999]"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
