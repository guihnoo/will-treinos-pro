"use client";

import React from "react";
import { motion } from "framer-motion";
import { GOLD_GLOW_PULSE, PRESS_SCALE, SPRING_PREMIUM } from "@/components/ui/motionTokens";

// 1. Ícone Animado Exclusivo: A Bola de Ouro (Medalha de Fogo)
export const GoldVolleyballBadge = () => (
  <motion.div
    initial={{ scale: 0.8, rotate: -10 }}
    animate={{ scale: 1, rotate: 0 }}
    whileHover={{ scale: 1.1, rotate: 15, filter: "drop-shadow(0px 0px 12px rgba(234,179,8,0.8))" }}
    transition={{ type: "spring", stiffness: 300, damping: 15 }}
    className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#EAB308] to-[#9A7300] border-2 border-black shadow-[0_0_20px_rgba(234,179,8,0.4)]"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" className="w-8 h-8 opacity-90">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 0 20M2 12a15.3 15.3 0 0 1 20 0" />
      <path d="M4.9 4.9a10 10 0 0 1 14.2 14.2M4.9 19.1a10 10 0 0 0 14.2-14.2" />
    </svg>
    <div className="absolute -bottom-2 bg-black text-[#EAB308] text-[9px] font-black px-2 py-0.5 rounded-full border border-[#EAB308]/50 uppercase tracking-widest">
      Elite
    </div>
  </motion.div>
);

// 2. Botão Interativo de Alta Performance (Neon Hover)
export const EvaluateButton = ({ onClick, label = "AVALIAR ALUNO" }: { onClick?: () => void, label?: string }) => (
  <motion.button
    onClick={onClick}
    animate={GOLD_GLOW_PULSE}
    whileHover={{ 
      scale: 1.02, 
      boxShadow: "0px 0px 28px rgba(234, 179, 8, 0.6)",
      borderColor: "rgba(234, 179, 8, 1)"
    }}
    whileTap={PRESS_SCALE}
    transition={SPRING_PREMIUM}
    className="relative overflow-hidden group px-8 py-3 rounded-xl bg-[#050505] border border-[#EAB308]/40 text-[#EAB308] font-black tracking-widest text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
  >
    <span className="relative z-10">{label}</span>
    <motion.div 
      className="absolute inset-0 bg-gradient-to-r from-[#EAB308]/0 via-[#EAB308]/20 to-[#EAB308]/0"
      initial={{ x: "-100%" }}
      whileHover={{ x: "100%" }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    />
  </motion.button>
);
