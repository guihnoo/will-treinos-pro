"use client";

import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { PRESS_SCALE } from "@/components/ui/motionTokens";

interface DailyChallengeCTACardProps {
  onViewChallenges?: () => void;
}

export default function DailyChallengeCTACard({
  onViewChallenges,
}: DailyChallengeCTACardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 28 }}
      whileHover={{ y: -2, boxShadow: "0 0 32px rgba(234,179,8,0.12)" }}
      whileTap={PRESS_SCALE}
      onClick={onViewChallenges}
      className="relative rounded-2xl border border-[#EAB308]/20 bg-[#050505] overflow-hidden cursor-pointer p-4"
    >
      {/* Radial glow dourado no canto superior direito */}
      <div
        className="pointer-events-none absolute -top-6 -right-6 w-32 h-32 rounded-full blur-2xl opacity-25"
        style={{ background: "radial-gradient(circle, #EAB308 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-8 h-8 rounded-lg bg-[#EAB308]/10 flex items-center justify-center"
          >
            <Zap className="w-4 h-4 text-[#EAB308]" />
          </motion.div>
          <h3 className="text-sm font-bold text-white font-display">Desafios Diários</h3>
        </div>
        <motion.div
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowRight className="w-4 h-4 text-[#EAB308]/60" />
        </motion.div>
      </div>

      <p className="relative text-xs text-zinc-400 mb-4 leading-relaxed">
        Complete tarefas rápidas para ganhar bônus de XP e desbloqueios especiais!
      </p>

      <div className="relative space-y-2 mb-4">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <div className="w-1 h-1 rounded-full bg-[#EAB308]/60 flex-shrink-0" />
          <span>Faça check-in na quadra</span>
          <span className="ml-auto font-semibold text-[#EAB308]">+25 XP</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <div className="w-1 h-1 rounded-full bg-[#EAB308]/60 flex-shrink-0" />
          <span>Ganhe 100+ XP no dia</span>
          <span className="ml-auto font-semibold text-[#EAB308]">+50 XP</span>
        </div>
      </div>

      <motion.button
        whileHover={{ backgroundColor: "rgba(234,179,8,0.15)" }}
        whileTap={{ scale: 0.97 }}
        className="relative w-full py-2 px-3 rounded-xl border border-[#EAB308]/25 bg-[#EAB308]/8 text-[#EAB308] text-xs font-bold uppercase tracking-wider transition-colors"
      >
        Ver Desafios de Hoje
      </motion.button>
    </motion.div>
  );
}
