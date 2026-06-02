"use client";

import { motion } from "framer-motion";
import { VolleyballFundamental } from "@/context/types";

// Cores por fundamento — âncora no DNA gold/amber do sistema
const FUNDAMENTAL_LABELS: Record<VolleyballFundamental, { label: string; emoji: string; barColor: string }> = {
  ataque:          { label: "Ataque",          emoji: "⚡", barColor: "#EAB308" },   // gold — fundamento mais valorizado
  levantamento:    { label: "Levantamento",    emoji: "🎯", barColor: "#F59E0B" },   // amber-500
  bloqueio:        { label: "Bloqueio",        emoji: "🛡️", barColor: "#D97706" },   // amber-600
  saque:           { label: "Saque",           emoji: "🌪️", barColor: "#B45309" },   // amber-700
  defesa:          { label: "Defesa",          emoji: "🤲", barColor: "#92400E" },   // amber-800
  recepcao:        { label: "Recepção",        emoji: "👐", barColor: "#78716C" },   // stone-500
  posicionamento:  { label: "Posicionamento",  emoji: "📍", barColor: "#57534E" },   // stone-600
};

interface FundamentalBreakdownProps {
  xpByFundamental: Record<VolleyballFundamental, number>;
}

export default function FundamentalBreakdown({ xpByFundamental }: FundamentalBreakdownProps) {
  const totalXP = Object.values(xpByFundamental).reduce((a, b) => a + b, 0);
  const maxXP = Math.max(...Object.values(xpByFundamental), 1);
  const sorted = (Object.entries(xpByFundamental) as [VolleyballFundamental, number][]).sort(([, a], [, b]) => b - a);
  const weakest = sorted[sorted.length - 1][0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-zinc-900/50 border border-zinc-800/60 p-4"
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-4 font-display">
        Distribuição por Fundamento
      </h3>

      <div className="space-y-3">
        {sorted.slice(0, 5).map(([fundamental, xp], idx) => {
          const percentage = totalXP > 0 ? (xp / maxXP) * 100 : 0;
          const info = FUNDAMENTAL_LABELS[fundamental];
          const isWeakest = fundamental === weakest && totalXP > 0;

          return (
            <motion.div
              key={fundamental}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + idx * 0.05 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{info.emoji}</span>
                  <span className={`text-sm font-semibold ${isWeakest ? "text-amber-400" : "text-white"}`}>
                    {info.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-zinc-400 font-display">{xp.toLocaleString()} XP</span>
              </div>

              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: 0.3 + idx * 0.05, duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: info.barColor }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {xpByFundamental[weakest] !== undefined && totalXP > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-xl bg-[#EAB308]/8 border border-[#EAB308]/20"
        >
          <p className="text-xs text-amber-300/80">
            💡 Fundamento a desenvolver:{" "}
            <span className="font-bold text-amber-300">{FUNDAMENTAL_LABELS[weakest].label}</span>
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
