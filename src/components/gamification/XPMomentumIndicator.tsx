"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
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
  const trendPercent = avgDaily30d > 0
    ? Math.round(((xpVelocity7d - avgDaily30d * 7) / (avgDaily30d * 7)) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl bg-zinc-900/50 border border-zinc-800/60 p-4"
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-4 font-display">
        Seu Momentum
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* 7-Day */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl bg-zinc-800/40 border border-[#EAB308]/15 p-3"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-[#EAB308]" />
            <p className="text-[11px] text-zinc-400 font-semibold">Última Semana</p>
          </div>
          <p className="text-2xl font-black text-white font-display">{xpVelocity7d.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{avgDaily7d} XP/dia</p>
        </motion.div>

        {/* 30-Day */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-zinc-800/40 border border-zinc-700/30 p-3"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
            <p className="text-[11px] text-zinc-400 font-semibold">Últimos 30 Dias</p>
          </div>
          <p className="text-2xl font-black text-zinc-300 font-display">{xpVelocity30d.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{avgDaily30d} XP/dia</p>
        </motion.div>
      </div>

      {/* Trend */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className={`mt-3 p-3 rounded-xl border flex items-center justify-between ${
          trend === "up"
            ? "bg-[#EAB308]/8 border-[#EAB308]/20"
            : "bg-zinc-800/40 border-zinc-700/30"
        }`}
      >
        <div className="flex items-center gap-2">
          {trend === "up"
            ? <TrendingUp className="w-4 h-4 text-[#EAB308]" />
            : <TrendingDown className="w-4 h-4 text-zinc-500" />
          }
          <p className={`text-xs font-semibold ${trend === "up" ? "text-[#EAB308]" : "text-zinc-400"}`}>
            {trend === "up" ? "Acelerando" : "Desacelerando"}
          </p>
        </div>
        <span className={`text-sm font-bold font-display ${trend === "up" ? "text-[#EAB308]" : "text-zinc-500"}`}>
          {Math.abs(trendPercent)}%
        </span>
      </motion.div>

      {/* Days to next tier */}
      {currentTier !== "elite" && xpToNextTier > 0 && daysToNextTier !== Infinity && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-3 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/20"
        >
          <p className="text-xs text-zinc-400">
            <span className="font-bold text-white font-display">{daysToNextTier}</span>
            {" "}dias para o próximo tier (ao ritmo atual)
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
