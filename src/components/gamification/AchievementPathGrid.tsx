"use client";

import { motion } from "framer-motion";
import { CardTier, CARD_TIER_THRESHOLDS } from "@/context/types";
import { Lock, CheckCircle } from "lucide-react";

const TIER_DISPLAY: Record<CardTier, { emoji: string; name: string; color: string }> = {
  bronze: { emoji: "🥉", name: "Bronze", color: "text-amber-400" },
  prata: { emoji: "🥈", name: "Prata", color: "text-gray-300" },
  ouro: { emoji: "🥇", name: "Ouro", color: "text-yellow-400" },
  diamante: { emoji: "💎", name: "Diamante", color: "text-cyan-400" },
  elite: { emoji: "👑", name: "Elite", color: "text-purple-400" },
};

interface AchievementPathGridProps {
  allTiers: CardTier[];
  achievedTiers: CardTier[];
  xpThresholds: Record<CardTier, number>;
}

export default function AchievementPathGrid({
  allTiers,
  achievedTiers,
  xpThresholds,
}: AchievementPathGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-4"
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Caminho de Evolução</h3>
      <div className="grid grid-cols-5 gap-2">
        {allTiers.map((tier, idx) => {
          const isAchieved = achievedTiers.includes(tier);
          const tierInfo = TIER_DISPLAY[tier];
          const threshold = xpThresholds[tier];

          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                isAchieved
                  ? "bg-slate-700/40 border-white/20 shadow-lg shadow-white/5"
                  : "bg-slate-900/20 border-slate-700/30"
              }`}
            >
              <div className="relative mb-1">
                <span className="text-3xl">{tierInfo.emoji}</span>
                {isAchieved && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5"
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                  </motion.div>
                )}
                {!isAchieved && (
                  <div className="absolute -bottom-1 -right-1 bg-slate-700 rounded-full p-0.5">
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                )}
              </div>

              <p className={`text-xs font-bold ${tierInfo.color}`}>{tierInfo.name}</p>
              <p className="text-[10px] text-slate-400 text-center mt-1">{threshold.toLocaleString()} XP</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
