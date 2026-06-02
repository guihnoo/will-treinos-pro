"use client";

import { motion } from "framer-motion";
import { CardTier } from "@/context/types";

// Tier colors no DNA do projeto: gold para topo, escala neutra para os demais
const TIER_INFO: Record<CardTier, { emoji: string; label: string; color: string; borderColor: string }> = {
  bronze:   { emoji: "🥉", label: "Bronze",   color: "#D97706", borderColor: "rgba(217,119,6,0.3)"   },
  prata:    { emoji: "🥈", label: "Prata",    color: "#A1A1AA", borderColor: "rgba(161,161,170,0.3)" },
  ouro:     { emoji: "🥇", label: "Ouro",     color: "#EAB308", borderColor: "rgba(234,179,8,0.35)"  },
  diamante: { emoji: "💎", label: "Diamante", color: "#E4E4E7", borderColor: "rgba(228,228,231,0.25)" },
  elite:    { emoji: "👑", label: "Elite",    color: "#EAB308", borderColor: "rgba(234,179,8,0.5)"   },
};

interface TierProgressCardProps {
  tier: CardTier | null;
  totalXP: number;
  nextTierXP: number | null;
  xpToNextTier: number;
  unlockedAt?: string;
}

export default function TierProgressCard({ tier, totalXP, nextTierXP, xpToNextTier, unlockedAt }: TierProgressCardProps) {
  const tierInfo = tier ? TIER_INFO[tier] : null;
  const progressPercent = nextTierXP ? Math.min(100, (totalXP / nextTierXP) * 100) : 100;

  const nextTier = tier
    ? (["bronze","prata","ouro","diamante","elite"] as CardTier[])[(["bronze","prata","ouro","diamante","elite"] as CardTier[]).indexOf(tier) + 1]
    : null;
  const nextTierInfo = nextTier ? TIER_INFO[nextTier] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="rounded-2xl border bg-zinc-900/70 p-5 relative overflow-hidden"
      style={{ borderColor: tierInfo?.borderColor ?? "rgba(63,63,70,0.6)" }}
    >
      {/* Glow radial no canto — usa cor do tier */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-20"
        style={{ background: tierInfo?.color ?? "transparent" }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Tier Atual</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{tierInfo?.emoji ?? "🏐"}</span>
              <div>
                <h3 className="text-xl font-bold text-white font-display">{tierInfo?.label ?? "Iniciante"}</h3>
                <p className="text-[11px] text-zinc-600">
                  {unlockedAt ? new Date(unlockedAt).toLocaleDateString("pt-BR") : "Desbloqueado"}
                </p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-black font-display" style={{ color: tierInfo?.color ?? "#EAB308" }}>
              {totalXP.toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-500">XP Total</p>
          </div>
        </div>

        {nextTierXP && nextTierInfo && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>Próximo: {nextTierInfo.emoji} {nextTierInfo.label}</span>
              <span className="font-display font-semibold text-zinc-400">{xpToNextTier.toLocaleString()} XP</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: tierInfo?.color ?? "#EAB308" }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
