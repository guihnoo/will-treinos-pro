"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Award } from "lucide-react";
import type { XPLog, CardTier } from "@/context/types";
import { CARD_TIER_THRESHOLDS } from "@/context/types";
import { useXPMutations } from "@/hooks/useXPMutations";

const TIER_COLORS: Record<CardTier, string> = {
  bronze: "from-orange-400 to-orange-600",
  prata: "from-gray-300 to-gray-500",
  ouro: "from-yellow-400 to-yellow-600",
  diamante: "from-cyan-300 to-cyan-600",
  elite: "from-purple-400 to-purple-600",
};

const TIER_LABELS: Record<CardTier, string> = {
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
  diamante: "Diamante",
  elite: "Elite",
};

interface XPHistoryPanelProps {
  studentId: string;
  onClose: () => void;
}

export function XPHistoryPanel({ studentId, onClose }: XPHistoryPanelProps) {
  const { getStudentTotalXP, getXPHistory, getStudentAchievements } =
    useXPMutations();

  const [totalXP, setTotalXP] = useState(0);
  const [history, setHistory] = useState<XPLog[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadXPData = async () => {
      setLoading(true);
      const [total, hist, achievs] = await Promise.all([
        getStudentTotalXP(studentId),
        getXPHistory(studentId, 50),
        getStudentAchievements(studentId),
      ]);

      if (total !== null) setTotalXP(total);
      if (hist) setHistory(hist);
      if (achievs) setAchievements(achievs.map((a: any) => a.tier_id));
    };

    loadXPData();
  }, [studentId, getStudentTotalXP, getXPHistory, getStudentAchievements]);

  // Calculate current tier
  const currentTier = (
    ["elite", "diamante", "ouro", "prata", "bronze"] as CardTier[]
  ).find((tier) => totalXP >= CARD_TIER_THRESHOLDS[tier]) || null;

  // Calculate progress to next tier
  const nextTierIndex = currentTier
    ? ["elite", "diamante", "ouro", "prata", "bronze"].indexOf(currentTier)
    : 4;
  const nextTier = (
    ["elite", "diamante", "ouro", "prata", "bronze"] as CardTier[]
  )[nextTierIndex + 1] || null;

  const nextThreshold = nextTier ? CARD_TIER_THRESHOLDS[nextTier] : null;
  const currentThreshold = currentTier
    ? CARD_TIER_THRESHOLDS[currentTier]
    : 0;
  const progressPercent = nextThreshold
    ? Math.min(100, ((totalXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 pointer-events-auto"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full sm:w-[500px] max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-700">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-amber-400" />
            Histórico de XP
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="close"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Total XP Card */}
          <motion.div
            className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-gray-300 mb-1">XP Total</p>
                <p className="text-3xl font-black text-amber-300">
                  {totalXP.toLocaleString()}
                </p>
              </div>
              <Award className="h-8 w-8 text-amber-400" />
            </div>

            {/* Card tier progress */}
            {currentTier && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span>
                    Card:{" "}
                    <span className="font-bold text-white">
                      {TIER_LABELS[currentTier]}
                    </span>
                  </span>
                  {nextTier && (
                    <span>
                      Próximo: {TIER_LABELS[nextTier]} ({nextThreshold?.toLocaleString()} XP)
                    </span>
                  )}
                </div>
                <div className="bg-black/40 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* All Tiers Unlocked */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">
              Conquistas
            </p>
            <div className="grid grid-cols-5 gap-2">
              {(["bronze", "prata", "ouro", "diamante", "elite"] as CardTier[]).map(
                (tier) => {
                  const unlocked = achievements.includes(tier);
                  const threshold = CARD_TIER_THRESHOLDS[tier];
                  const earned = totalXP >= threshold;

                  return (
                    <motion.div
                      key={tier}
                      className={`p-3 rounded-lg text-center transition-all ${
                        unlocked || earned
                          ? `bg-gradient-to-br ${TIER_COLORS[tier]} text-white`
                          : "bg-zinc-800 text-gray-500"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      title={`${TIER_LABELS[tier]}: ${threshold} XP`}
                    >
                      <p className="text-xs font-bold">{TIER_LABELS[tier]}</p>
                      <p className="text-2xs text-opacity-80">
                        {threshold.toLocaleString()}
                      </p>
                    </motion.div>
                  );
                }
              )}
            </div>
          </div>

          {/* XP History */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">
              Últimas Transações
            </p>
            {loading ? (
              <p className="text-gray-400 text-sm">Carregando...</p>
            ) : history.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Sem transações ainda.</p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {history.map((log, idx) => (
                    <motion.div
                      key={log.id}
                      className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="text-sm font-semibold text-gray-200">
                            +{log.points} XP
                          </p>
                          <p className="text-xs text-gray-400 capitalize">
                            {log.type.replace(/_/g, " ")}
                            {log.multiplierType !== "none" &&
                              ` (${log.multiplierType} ×${log.multiplierValue})`}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {log.description && (
                        <p className="text-xs text-gray-500">{log.description}</p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
