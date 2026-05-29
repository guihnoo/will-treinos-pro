"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useEvaluations } from "@/hooks/useEvaluations";
import type { EvaluationRecord, EvaluationScores } from "@/hooks/useEvaluations";
import { MODAL_BODY_SCROLL, MODAL_FIXED_OVERLAY_SCROLL, MODAL_OVERLAY_CENTER_WRAP, MODAL_PANEL_COLUMN } from "@/components/ui/modalScrollClasses";
import { MODAL_BADGE_ENTER, MODAL_HEADER_ENTER, PRESS_SCALE } from "@/components/ui/motionTokens";

// ─── Constants ─────────────────────────────────────────────────────────────────

const PILLARS: { key: keyof EvaluationScores; label: string; color: string }[] = [
  { key: "fisico",    label: "Físico",   color: "#ef4444" },
  { key: "tecnico",   label: "Técnico",  color: "#EAB308" },
  { key: "tatico",    label: "Tático",   color: "#8b5cf6" },
  { key: "atitude",   label: "Atitude",  color: "#06b6d4" },
  { key: "evolucao",  label: "Evolução", color: "#22c55e" },
];

function scoreColor(s: number) {
  return s >= 8 ? "#22c55e" : s >= 6 ? "#EAB308" : "#ef4444";
}

// ─── Sparkline (mini SVG line chart for a single pillar) ──────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const W = 80; const H = 28;
  const minV = 0; const maxV = 10;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - minV) / (maxV - minV)) * H;
    return `${x},${y}`;
  }).join(" ");

  const lastUp = values[values.length - 1] >= values[values.length - 2];

  return (
    <svg width={W} height={H} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
      {/* Dot at last value */}
      {(() => {
        const lx = W;
        const ly = H - ((values[values.length - 1] - minV) / (maxV - minV)) * H;
        return <circle cx={lx} cy={ly} r="2.5" fill={lastUp ? "#22c55e" : "#ef4444"} />;
      })()}
    </svg>
  );
}

// ─── Single evaluation card ───────────────────────────────────────────────────

function EvalCard({ record, idx, expanded, onToggle }: {
  record: EvaluationRecord;
  idx: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const date = new Date(record.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "2-digit"
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        {/* Avg score circle */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-black"
          style={{ borderColor: `${scoreColor(record.avgScore)}40`, color: scoreColor(record.avgScore), backgroundColor: `${scoreColor(record.avgScore)}12` }}
        >
          {record.avgScore}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-zinc-200 truncate">
            {record.lessonTitle || "Avaliação geral"}
          </p>
          <p className="text-[9px] text-zinc-600">{date}</p>
        </div>

        {expanded
          ? <ChevronUp className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
        }
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/[0.05]"
          >
            <div className="px-3.5 py-3 space-y-1.5">
              {PILLARS.map((p) => {
                const score = record.scores[p.key];
                return (
                  <div key={p.key} className="flex items-center gap-2">
                    <span className="w-14 text-[9px] font-bold text-zinc-500">{p.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${score * 10}%`, backgroundColor: p.color }}
                      />
                    </div>
                    <span className="w-6 text-right text-[10px] font-black" style={{ color: p.color }}>
                      {score}
                    </span>
                  </div>
                );
              })}
              {record.notes && (
                <p className="text-[10px] text-zinc-500 italic pt-1 border-t border-white/[0.04]">
                  "{record.notes}"
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function EvaluationHistoryPanel({
  studentId,
  studentName,
  onClose,
}: {
  studentId: string;
  studentName: string;
  onClose: () => void;
}) {
  const { getEvaluationHistory, getEvaluationTrend } = useEvaluations();
  const [records, setRecords] = useState<EvaluationRecord[]>([]);
  const [trend, setTrend] = useState<Awaited<ReturnType<typeof getEvaluationTrend>>>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [hist, tr] = await Promise.all([
        getEvaluationHistory(studentId, 12),
        getEvaluationTrend(studentId),
      ]);
      setRecords(hist);
      setTrend(tr);
      setLoading(false);
    })();
  }, [studentId, getEvaluationHistory, getEvaluationTrend]);

  const chronological = trend?.evaluations ?? [];

  return (
    <div className={MODAL_FIXED_OVERLAY_SCROLL} role="dialog" aria-modal="true" aria-label={`Histórico de avaliações — ${studentName}`}>
      <div className={MODAL_OVERLAY_CENTER_WRAP}>
        <motion.div
          className={`${MODAL_PANEL_COLUMN} max-w-lg border-white/[0.08] bg-[#050505]/96 backdrop-blur-3xl`}
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-4">
            <motion.div {...MODAL_HEADER_ENTER} className="flex items-center gap-3">
              <motion.div
                {...MODAL_BADGE_ENTER}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10"
              >
                <Zap className="h-4.5 w-4.5 text-amber-400" />
              </motion.div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-400">Histórico de Avaliações</p>
                <p className="text-[10px] text-zinc-500">{studentName}</p>
              </div>
            </motion.div>
            <motion.button whileTap={PRESS_SCALE} onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>

          <div className={`${MODAL_BODY_SCROLL} px-5 pb-5 space-y-4`}>
            {loading && (
              <div className="flex items-center gap-2 justify-center py-10">
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                <p className="text-[12px] text-zinc-500">Carregando histórico…</p>
              </div>
            )}

            {!loading && records.length === 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center">
                <p className="text-[12px] font-bold text-zinc-500">Nenhuma avaliação salva ainda.</p>
                <p className="text-[10px] text-zinc-700 mt-1">Avaliações futuras aparecerão aqui automaticamente.</p>
              </div>
            )}

            {!loading && records.length > 0 && (
              <>
                {/* Trend summary */}
                {trend && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border px-4 py-3 ${
                      trend.improving
                        ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                        : trend.declining
                        ? "border-red-500/25 bg-red-500/[0.06]"
                        : "border-white/[0.07] bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {trend.improving
                        ? <TrendingUp className="h-4 w-4 text-emerald-400" />
                        : trend.declining
                        ? <TrendingDown className="h-4 w-4 text-red-400" />
                        : <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                      }
                      <p className="text-[11px] font-black text-white">
                        {trend.improving ? "Evolução positiva" : trend.declining ? "Atenção: queda detectada" : "Estável"}
                      </p>
                      <span className={`ml-auto text-[11px] font-black ${trend.avgDelta > 0 ? "text-emerald-400" : trend.avgDelta < 0 ? "text-red-400" : "text-zinc-400"}`}>
                        {trend.avgDelta > 0 ? "+" : ""}{trend.avgDelta.toFixed(1)} pts
                      </span>
                    </div>

                    {/* Sparklines */}
                    <div className="grid grid-cols-5 gap-1">
                      {PILLARS.map((p) => {
                        const vals = chronological.map((r) => r.scores[p.key]);
                        const delta = trend.pillarDeltas[p.key] ?? 0;
                        return (
                          <div key={p.key} className="flex flex-col items-center gap-1">
                            <Sparkline values={vals} color={p.color} />
                            <p className="text-[8px] font-bold" style={{ color: p.color }}>{p.label}</p>
                            <p className={`text-[8px] font-black ${delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-zinc-600"}`}>
                              {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Records list */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">
                    {records.length} avaliação{records.length > 1 ? "ões" : ""} registrada{records.length > 1 ? "s" : ""}
                  </p>
                  <div className="space-y-2">
                    {records.map((r, i) => (
                      <EvalCard
                        key={r.id}
                        record={r}
                        idx={i}
                        expanded={expandedId === r.id}
                        onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
