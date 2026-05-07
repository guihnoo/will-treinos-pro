"use client";

import { motion } from "framer-motion";
import { TrendingUp, Zap } from "lucide-react";
import type { CardTier } from "@/context/types";

interface XPMomentumIndicatorProps {
  xpVelocity7d: number;
  xpVelocity30d: number;
  currentTier: CardTier | null;
  xpToNextTier: number;
}

export default function XPMomentumIndicator({
  xpVelocity7d,
  xpVelocity30d,
  currentTier,
  xpToNextTier,
}: XPMomentumIndicatorProps) {
  const avgDaily7d = Math.round(xpVelocity7d / 7);
  const avgDaily30d = Math.round(xpVelocity30d / 30);
  const daysToNextTier = avgDaily7d > 0 ? Math.ceil(xpToNextTier / avgDaily7d) : Infinity;
  const trend = xpVelocity7d >= xpVelocity30d ? "up" : "down";
  const trendPercent = avgDaily30d > 0 ? Math.round(((xpVelocity7d - avgDaily30d * 7) / (avgDaily30d * 7)) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-4"
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Seu Momentum</h3>

      <div className="grid grid-cols-2 gap-3">
        {/* 7-Day Velocity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="rounded-lg bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border border-blue-700/30 p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-blue-300 font-semibold">Última Semana</p>
          </div>
          <p className="text-2xl font-black text-blue-300">{xpVelocity7d.toLocaleString()}</p>
          <p className="text-xs text-blue-400 mt-1">{avgDaily7d} XP/dia</p>
        </motion.div>

        {/* 30-Day Velocity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-700/30 p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-purple-300 font-semibold">Últimos 30 Dias</p>
          </div>
          <p className="text-2xl font-black text-purple-300">{xpVelocity30d.toLocaleString()}</p>
          <p className="text-xs text-purple-400 mt-1">{avgDaily30d} XP/dia</p>
        </motion.div>
      </div>

      {/* Trend Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className={`mt-4 p-3 rounded-lg border ${
          trend === "up"
            ? "bg-green-900/20 border-green-500/30"
            : "bg-orange-900/20 border-orange-500/30"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <p className={`text-xs font-semibold ${trend === "up" ? "text-green-300" : "text-orange-300"}`}>
            {trend === "up" ? "📈 Aceleração" : "📉 Desaceleração"}
          </p>
          <span className={`text-sm font-bold ${trend === "up" ? "text-green-300" : "text-orange-300"}`}>
            {Math.abs(trendPercent)}%
          </span>
        </div>
        <p className="text-xs text-white/70">
          {trend === "up"
            ? "Sua performance está acelerando!"
            : "Você estava mais ativo antes. Volta com tudo?"}
        </p>
      </motion.div>

      {/* Days to Next Tier */}
      {currentTier !== "elite" && xpToNextTier > 0 && daysToNextTier !== Infinity && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-3 rounded-lg bg-slate-700/20 border border-slate-600/30"
        >
          <p className="text-xs text-slate-300">
            <span className="font-bold text-yellow-300">{daysToNextTier}</span> dias para o próximo nível (ao ritmo atual)
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
