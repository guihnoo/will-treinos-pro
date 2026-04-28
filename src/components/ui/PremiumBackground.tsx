"use client";

import React from "react";
import { motion } from "framer-motion";

export function PremiumVolleyballBackground() {
  return (
    <div className="fixed inset-0 z-[-10] overflow-hidden bg-[#020202]">
      {/* Luz Radial de Fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#EAB308]/10 via-[#020202] to-[#020202] opacity-70" />

      {/* Bolas de Vôlei Flutuantes em 3D (SVG Animado) */}
      <FloatingVolleyball x="10%" y="20%" delay={0} size={120} opacity={0.03} duration={15} />
      <FloatingVolleyball x="80%" y="15%" delay={2} size={80} opacity={0.05} duration={18} />
      <FloatingVolleyball x="70%" y="70%" delay={5} size={150} opacity={0.02} duration={20} />
      <FloatingVolleyball x="20%" y="80%" delay={1} size={90} opacity={0.04} duration={12} />

      {/* Painéis de Vidro (Glassmorphism) Diagonais - Inspirado na sua Imagem */}
      <motion.div 
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-1/4 -left-20 w-[600px] h-[400px] bg-white/[0.02] backdrop-blur-3xl border border-white/[0.05] rounded-3xl transform -rotate-12 pointer-events-none"
      />
      <motion.div 
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-[#EAB308]/[0.015] backdrop-blur-3xl border border-[#EAB308]/[0.08] rounded-3xl transform rotate-12 pointer-events-none"
      />
    </div>
  );
}

function FloatingVolleyball({ x, y, delay, size, opacity, duration }: { x: string, y: string, delay: number, size: number, opacity: number, duration: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, opacity }}
      animate={{
        y: ["-20px", "20px", "-20px"],
        rotate: [0, 10, -10, 0],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="1" className="w-full h-full drop-shadow-[0_0_15px_rgba(234,179,8,1)]">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 0 20M2 12a15.3 15.3 0 0 1 20 0" />
        <path d="M4.9 4.9a10 10 0 0 1 14.2 14.2M4.9 19.1a10 10 0 0 0 14.2-14.2" />
      </svg>
    </motion.div>
  );
}
