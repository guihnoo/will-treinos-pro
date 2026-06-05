"use client";

import React from "react";
import { motion } from "framer-motion";

/** Points + paths for the evolution trend SVG (shared Home + modal). */
export type EvolutionLineChartData = {
  w: number;
  h: number;
  d: string;
  areaD: string;
  linePts: Array<{ id: string; x: number; y: number; date: string; rating: number }>;
  lo: number;
  hi: number;
};

export function EvolutionTrendPanel({
  idBase,
  chart,
  avgRating,
  compact,
}: {
  idBase: string;
  chart: EvolutionLineChartData | null;
  avgRating: number;
  compact?: boolean;
}) {
  const fillId = `${idBase}-evoFill`;
  const glowId = `${idBase}-evoGlow`;
  const avg = avgRating > 0 ? avgRating.toFixed(1) : "—";
  return (
    <div
      className={`rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent ${compact ? "p-3" : "p-4"} backdrop-blur-md`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Tendência</p>
          <p className="text-sm font-bold text-white mt-1">Nota média (feedbacks)</p>
          <p className="text-xs text-zinc-500 mt-0.5">Uma leitura única — sem grade de pilares.</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`${compact ? "text-xl" : "text-2xl"} font-black text-white`}>{avg}</p>
          <p className="text-[10px] font-bold text-zinc-500">média global</p>
        </div>
      </div>

      {chart ? (
        <div className="relative min-h-0">
          <svg
            viewBox={`0 0 ${chart.w} ${chart.h}`}
            className={compact ? "w-full h-28" : "w-full h-36"}
            role="img"
            aria-label="Gráfico de linha da evolução da nota"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(234,179,8,0.35)" />
                <stop offset="100%" stopColor="rgba(234,179,8,0.0)" />
              </linearGradient>
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path d={chart.areaD} fill={`url(#${fillId})`} opacity="0.9" />
            <motion.path
              d={chart.d}
              fill="none"
              stroke="rgba(234,179,8,0.95)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowId})`}
              initial={{ pathLength: 0.55, opacity: 0.6 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />

            {chart.linePts.map((p) => (
              <g key={p.id}>
                <circle cx={p.x} cy={p.y} r="3.2" fill="rgba(0,0,0,0.55)" stroke="rgba(234,179,8,0.85)" strokeWidth="1.4" />
                <circle cx={p.x} cy={p.y} r="1.2" fill="rgba(234,179,8,0.95)" />
              </g>
            ))}

            <text x="12" y="18" fill="rgba(161,161,170,0.95)" fontSize="10" fontWeight="700">
              {`min ${chart.lo.toFixed(1)}`}
            </text>
            <text x={chart.w - 12} y="18" fill="rgba(161,161,170,0.95)" fontSize="10" fontWeight="700" textAnchor="end">
              {`max ${chart.hi.toFixed(1)}`}
            </text>
          </svg>
          <div className="flex justify-between px-1 mt-1">
            {chart.linePts.map((p) => (
              <div key={`${p.id}-label`} className="flex flex-col items-center gap-0.5 min-w-0">
                <span className="text-[8px] text-zinc-600 tabular-nums truncate">{p.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-sm font-bold text-white">Ainda poucos dados</p>
          <p className="text-xs text-zinc-500 mt-1">
            Conclua mais feedbacks para liberar a tendência (precisamos de pelo menos 2 pontos).
          </p>
        </div>
      )}
    </div>
  );
}

export default EvolutionTrendPanel;
