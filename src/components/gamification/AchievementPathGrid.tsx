"use client";

import { motion } from "framer-motion";
import { CardTier } from "@/context/types";
import { Lock, CheckCircle } from "lucide-react";
import { PRESS_SCALE } from "@/components/ui/motionTokens";

const TIER_DISPLAY: Record<CardTier, { emoji: string; name: string; color: string; glow: string }> = {
  bronze:   { emoji: "🥉", name: "Bronze",   color: "text-amber-600",   glow: "rgba(217,119,6,0.2)" },
  prata:    { emoji: "🥈", name: "Prata",    color: "text-zinc-300",    glow: "rgba(161,161,170,0.15)" },
  ouro:     { emoji: "🥇", name: "Ouro",     color: "text-[#EAB308]",   glow: "rgba(234,179,8,0.25)" },
  diamante: { emoji: "💎", name: "Diamante", color: "text-zinc-200",    glow: "rgba(228,228,231,0.15)" },
  elite:    { emoji: "👑", name: "Elite",    color: "text-[#EAB308]",   glow: "rgba(234,179,8,0.35)" },
};

interface AchievementPathGridProps {
  allTiers: CardTier[];
  achievedTiers: CardTier[];
  xpThresholds: Record<CardTier, number>;
}

export default function AchievementPathGrid({ allTiers, achievedTiers, xpThresholds }: AchievementPathGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl bg-zinc-900/50 border border-zinc-800/60 p-4"
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-4 font-display">
        Caminho de Evolução
      </h3>

      <div className="grid grid-cols-5 gap-2">
        {allTiers.map((tier, idx) => {
          const isAchieved = achievedTiers.includes(tier);
          const tierInfo = TIER_DISPLAY[tier];
          const threshold = xpThresholds[tier];

          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={isAchieved ? { scale: 1.04 } : undefined}
              whileTap={isAchieved ? PRESS_SCALE : undefined}
              transition={{ delay: idx * 0.06 }}
              className={`flex flex-col items-center p-3 rounded-xl border transition-colors ${
                isAchieved
                  ? "bg-zinc-800/60 border-[#EAB308]/20"
                  : "bg-zinc-900/30 border-zinc-800/30 opacity-50"
              }`}
              style={isAchieved ? { boxShadow: `0 0 20px ${tierInfo.glow}` } : undefined}
            >
              <div className="relative mb-1">
                <span className="text-2xl">{tierInfo.emoji}</span>
                {isAchieved ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.06 + 0.2, type: "spring" }}
                    className="absolute -bottom-1 -right-1 bg-[#EAB308] rounded-full p-0.5"
                  >
                    <CheckCircle className="w-3 h-3 text-black" />
                  </motion.div>
                ) : (
                  <div className="absolute -bottom-1 -right-1 bg-zinc-800 rounded-full p-0.5">
                    <Lock className="w-3 h-3 text-zinc-600" />
                  </div>
                )}
              </div>

              <p className={`text-[11px] font-bold ${tierInfo.color}`}>{tierInfo.name}</p>
              <p className="text-[9px] text-zinc-600 text-center mt-0.5 font-display">
                {threshold.toLocaleString()}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
