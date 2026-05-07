"use client";

import { motion } from "framer-motion";
import { VolleyballFundamental } from "@/context/types";

const FUNDAMENTAL_LABELS: Record<VolleyballFundamental, { label: string; emoji: string; color: string }> = {
  ataque: { label: "Ataque", emoji: "⚡", color: "from-red-600 to-orange-600" },
  levantamento: { label: "Levantamento", emoji: "🎯", color: "from-blue-600 to-cyan-600" },
  bloqueio: { label: "Bloqueio", emoji: "🛡️", color: "from-yellow-600 to-amber-600" },
  saque: { label: "Saque", emoji: "🌪️", color: "from-purple-600 to-pink-600" },
  defesa: { label: "Defesa", emoji: "🤲", color: "from-green-600 to-emerald-600" },
  recepcao: { label: "Recepção", emoji: "👐", color: "from-indigo-600 to-blue-600" },
  posicionamento: { label: "Posicionamento", emoji: "📍", color: "from-gray-600 to-slate-600" },
};

interface FundamentalBreakdownProps {
  xpByFundamental: Record<VolleyballFundamental, number>;
}

export default function FundamentalBreakdown({
  xpByFundamental,
}: FundamentalBreakdownProps) {
  const totalXP = Object.values(xpByFundamental).reduce((a, b) => a + b, 0);
  const maxXP = Math.max(...Object.values(xpByFundamental), 1);

  const fundamentals = Object.entries(xpByFundamental) as [VolleyballFundamental, number][];
  const sorted = [...fundamentals].sort(([, a], [, b]) => b - a);
  const weakest = sorted[sorted.length - 1][0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-4"
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Distribuição por Fundamento</h3>

      <div className="space-y-3">
        {sorted.slice(0, 5).map(([fundamental, xp], idx) => {
          const percentage = totalXP > 0 ? (xp / maxXP) * 100 : 0;
          const info = FUNDAMENTAL_LABELS[fundamental];
          const isWeakest = fundamental === weakest && totalXP > 0;

          return (
            <motion.div
              key={fundamental}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + idx * 0.05 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{info.emoji}</span>
                  <span className={`text-sm font-semibold ${isWeakest ? "text-orange-400" : "text-white"}`}>
                    {info.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-300">{xp.toLocaleString()} XP</span>
              </div>

              <div className="h-2 bg-slate-900/40 rounded-full overflow-hidden border border-slate-700/30">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: 0.3 + idx * 0.05, duration: 0.8 }}
                  className={`h-full bg-gradient-to-r ${info.color}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {xpByFundamental[weakest] !== undefined && totalXP > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-orange-900/20 border border-orange-500/30"
        >
          <p className="text-xs text-orange-300">
            💡 Seu fundamento mais fraco é <span className="font-bold">{FUNDAMENTAL_LABELS[weakest].label}</span>. Foque em melhorar isso!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
