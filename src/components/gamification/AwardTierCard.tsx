"use client";

import { motion } from "framer-motion";
import { Lock, Star, Trophy, Zap } from "lucide-react";
import { useGamification } from "@/context/GamificationContext";

interface AwardTierCardProps {
  tier: "bronze" | "prata" | "ouro" | "diamante" | "elite";
  index: number;
}

export function AwardTierCard({ tier, index }: AwardTierCardProps) {
  const { awards, totalXP } = useGamification();

  const tierInfo = {
    bronze: {
      label: "Bronze",
      threshold: 500,
      color: "#CD7F32",
      bgGradient: "from-amber-900/20 to-amber-800/10",
      borderColor: "#CD7F32",
    },
    prata: {
      label: "Prata",
      threshold: 1500,
      color: "#C0C0C0",
      bgGradient: "from-slate-600/20 to-slate-500/10",
      borderColor: "#C0C0C0",
    },
    ouro: {
      label: "Ouro",
      threshold: 3000,
      color: "#FFD700",
      bgGradient: "from-yellow-600/20 to-yellow-500/10",
      borderColor: "#FFD700",
    },
    diamante: {
      label: "Diamante",
      threshold: 6000,
      color: "#00CED1",
      bgGradient: "from-cyan-600/20 to-cyan-500/10",
      borderColor: "#00CED1",
    },
    elite: {
      label: "Elite",
      threshold: 10000,
      color: "#FF1493",
      bgGradient: "from-pink-600/20 to-pink-500/10",
      borderColor: "#FF1493",
    },
  };

  const info = tierInfo[tier];
  const award = awards.find((a) => a.tier === tier);
  const isUnlocked = award?.unlocked_at !== null;
  const canUnlock = totalXP >= info.threshold;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`relative rounded-2xl border-2 p-4 transition-all backdrop-blur-sm ${
        isUnlocked
          ? `bg-gradient-to-br ${info.bgGradient} border-opacity-60`
          : `bg-zinc-900/30 border-zinc-800 border-opacity-30`
      }`}
      style={isUnlocked ? { borderColor: info.color } : {}}
    >
      {/* Glow effect for unlocked */}
      {isUnlocked && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl opacity-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${info.color}20 0%, transparent 70%)`,
          }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy
              className="w-5 h-5"
              style={{ color: isUnlocked ? info.color : "#52525b" }}
            />
            <h4 className={`font-bold ${isUnlocked ? "text-white" : "text-zinc-600"}`}>
              {info.label}
            </h4>
          </div>
          {!isUnlocked && <Lock className="w-4 h-4 text-zinc-600" />}
        </div>

        <div className="mb-3">
          <p className="text-xs text-zinc-500 mb-1">
            {info.threshold.toLocaleString()} XP
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, (totalXP / info.threshold) * 100)}%`,
                }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full"
                style={{
                  background: isUnlocked
                    ? `linear-gradient(90deg, ${info.color}, ${info.color}cc)`
                    : canUnlock
                      ? "#EAB308"
                      : "#52525b",
                }}
              />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 tabular-nums w-10 text-right">
              {Math.min(100, Math.round((totalXP / info.threshold) * 100))}%
            </span>
          </div>
        </div>

        {isUnlocked && award?.unlocked_at && (
          <p className="text-[11px] text-zinc-500">
            Desbloqueado em {new Date(award.unlocked_at).toLocaleDateString("pt-BR")}
          </p>
        )}

        {!isUnlocked && canUnlock && (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[11px] text-[#EAB308] font-bold"
          >
            ✨ Pronto para desbloquear!
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
