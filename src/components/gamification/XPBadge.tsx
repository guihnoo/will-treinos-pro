"use client";

import { motion } from "framer-motion";
import { TrendingUp, Zap } from "lucide-react";
import { useGamification } from "@/context/GamificationContext";
import SkeletonLoader from "@/components/ui/SkeletonLoader";

interface XPBadgeProps {
  compact?: boolean;
  showHistory?: boolean;
}

export function XPBadge({ compact = false, showHistory = false }: XPBadgeProps) {
  const { totalXP, currentTier, multipliers, loading } = useGamification();

  if (loading) return <SkeletonLoader className="h-20 rounded-2xl" />;

  // Calculate level (simplified for display)
  const level = Math.floor(totalXP / 1000) + 1;
  const levelProgress = totalXP % 1000;
  const nextLevelXP = 1000;

  const tierColors: Record<string, string> = {
    bronze: "#CD7F32",
    prata: "#C0C0C0",
    ouro: "#FFD700",
    diamante: "#00CED1",
    elite: "#FF1493",
  };

  const tierLabel: Record<string, string> = {
    bronze: "Bronze",
    prata: "Prata",
    ouro: "Ouro",
    diamante: "Diamante",
    elite: "Elite",
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EAB308]/10 border border-[#EAB308]/30"
      >
        <Zap className="w-4 h-4 text-[#EAB308]" />
        <span className="text-sm font-bold text-white">{totalXP} XP</span>
        {currentTier && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-md text-white"
            style={{ backgroundColor: tierColors[currentTier.tier] }}
          >
            {tierLabel[currentTier.tier]}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#EAB308]/20 bg-gradient-to-br from-[#0A0A0A] to-zinc-900/40 p-5 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#EAB308]" />
          <h3 className="font-bold text-white">Pontuação de XP</h3>
        </div>
        {currentTier && (
          <span
            className="text-xs font-bold px-3 py-1 rounded-full text-white"
            style={{ backgroundColor: tierColors[currentTier.tier] }}
          >
            {tierLabel[currentTier.tier].toUpperCase()}
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-black text-white">{totalXP}</span>
          <span className="text-sm text-zinc-500">XP</span>
        </div>
        <p className="text-xs text-zinc-400">Nível {level}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Progresso para próximo nível</span>
          <span className="text-zinc-400 font-mono">
            {levelProgress}/{nextLevelXP}
          </span>
        </div>
        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(100, (levelProgress / nextLevelXP) * 100)}%`,
            }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-[#EAB308] to-[#FACC15] rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
