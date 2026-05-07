"use client";

import { motion } from "framer-motion";
import { CardTier } from "@/context/types";

const TIER_INFO: Record<CardTier, { emoji: string; label: string; color: string; gradient: string }> = {
  bronze: {
    emoji: "🥉",
    label: "Bronze",
    color: "#CD7F32",
    gradient: "from-amber-700 to-orange-700",
  },
  prata: {
    emoji: "🥈",
    label: "Prata",
    color: "#C0C0C0",
    gradient: "from-gray-400 to-gray-500",
  },
  ouro: {
    emoji: "🥇",
    label: "Ouro",
    color: "#FFD700",
    gradient: "from-yellow-400 to-yellow-600",
  },
  diamante: {
    emoji: "💎",
    label: "Diamante",
    color: "#00CED1",
    gradient: "from-cyan-400 to-blue-500",
  },
  elite: {
    emoji: "👑",
    label: "Elite",
    color: "#A78BFA",
    gradient: "from-purple-500 to-pink-500",
  },
};

interface TierProgressCardProps {
  tier: CardTier | null;
  totalXP: number;
  nextTierXP: number | null;
  xpToNextTier: number;
  unlockedAt?: string;
}

export default function TierProgressCard({
  tier,
  totalXP,
  nextTierXP,
  xpToNextTier,
  unlockedAt,
}: TierProgressCardProps) {
  const tierInfo = tier ? TIER_INFO[tier] : null;
  const nextTierInfo = nextTierXP ? Object.entries(TIER_INFO).find(([_, info]) => info.emoji)[1] : null;
  const progressPercent = nextTierXP ? Math.min(100, (totalXP / nextTierXP) * 100) : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-6 bg-gradient-to-br ${tierInfo?.gradient || "from-slate-700 to-slate-800"} border-white/10 relative overflow-hidden`}
    >
      <motion.div
        aria-hidden
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 80% 0%, ${tierInfo?.color}20, transparent 60%)` }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-white/70 uppercase tracking-wider mb-1">Seu Nível Atual</p>
            <div className="flex items-center gap-3">
              <span className="text-5xl">{tierInfo?.emoji}</span>
              <div>
                <h3 className="text-2xl font-bold text-white">{tierInfo?.label}</h3>
                <p className="text-xs text-white/60">
                  {unlockedAt ? new Date(unlockedAt).toLocaleDateString("pt-BR") : "Desbloqueado"}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black" style={{ color: tierInfo?.color }}>
              {totalXP.toLocaleString()}
            </p>
            <p className="text-xs text-white/60">XP Total</p>
          </div>
        </div>

        {/* Progress Bar */}
        {nextTierXP && (
          <>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Progresso para {nextTierInfo?.label}</span>
                <span>{xpToNextTier.toLocaleString()} XP faltam</span>
              </div>
              <div className="h-3 bg-slate-900/40 rounded-full overflow-hidden border border-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
