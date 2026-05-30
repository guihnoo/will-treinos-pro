"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Trophy,
  Target,
  ChevronDown,
  ChevronUp,
  Loader2,
  Star,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { MyEvaluationsResult, PillarStats } from "@/app/api/student/my-evaluations/route";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";
import { MODAL_OVERLAY_FADE, SPRING_PREMIUM } from "@/components/ui/motionTokens";

const PILLAR_COLORS: Record<string, string> = {
  fisico: "#ef4444",
  tecnico: "#EAB308",
  tatico: "#8b5cf6",
  atitude: "#06b6d4",
  evolucao: "#22c55e",
};

function scoreColor(s: number) {
  return s >= 8.5 ? "#22c55e" : s >= 7 ? "#EAB308" : s >= 5 ? "#f97316" : "#ef4444";
}

// Tiny sparkline SVG — chronological left to right
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 80;
  const h = 28;
  const pad = 3;
  const min = Math.max(0, Math.min(...values) - 1);
  const max = Math.min(10, Math.max(...values) + 0.5);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  const d = `M${pts.join(" L")}`;
  const lastPt = pts[pts.length - 1].split(",");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill={color} />
    </svg>
  );
}

interface Props {
  onClose: () => void;
}

let cacheResult: { data: MyEvaluationsResult; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export default function StudentPillarPanel({ onClose }: Props) {
  const [result, setResult] = useState<MyEvaluationsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (cacheResult && Date.now() - cacheResult.ts < CACHE_TTL) {
      setResult(cacheResult.data);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const sb = getSupabaseClient();
        const { data: { session } } = await sb.auth.getSession();
        if (!session?.access_token) throw new Error("Sem sessão ativa");

        const res = await fetch("/api/student/my-evaluations", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const data: MyEvaluationsResult = await res.json();
        cacheResult = { data, ts: Date.now() };
        setResult(data);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toneConfig = {
    conquista: { label: "Em ascensão 🚀", color: "#22c55e", bg: "bg-emerald-500/10 border-emerald-500/30" },
    progresso: { label: "Evoluindo 📈", color: "#EAB308", bg: "bg-amber-500/10 border-amber-500/30" },
    foco: { label: "Foco necessário 🎯", color: "#f97316", bg: "bg-orange-500/10 border-orange-500/30" },
    inicio: { label: "Início da jornada ✨", color: "#8b5cf6", bg: "bg-violet-500/10 border-violet-500/30" },
  };

  return (
    <AnimatePresence>
      <motion.div
        key="pillar-overlay"
        {...MODAL_OVERLAY_FADE}
        className={MODAL_FIXED_OVERLAY_SCROLL}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className={MODAL_OVERLAY_CENTER_WRAP}>
          <motion.div
            key="pillar-panel"
            {...SPRING_PREMIUM}
            className={`${MODAL_PANEL_COLUMN} max-w-md w-full rounded-3xl border border-violet-500/30 bg-[#08080f] shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/40 bg-violet-500/10">
                  <Target className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Evolução Técnica</h2>
                  <p className="text-[11px] text-zinc-500">Notas oficiais do coach por pilar</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className={`${MODAL_BODY_SCROLL} px-5 py-4 space-y-5`}>
              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center gap-3 py-14">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500/60" />
                  <p className="text-sm text-zinc-500">Carregando suas avaliações…</p>
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-4 text-center">
                  <p className="text-sm text-red-300 font-bold">Não foi possível carregar as avaliações.</p>
                  <p className="text-xs text-zinc-500 mt-1">{error}</p>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && result?.totalEvals === 0 && (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
                    <Target className="h-7 w-7 text-violet-400/60" />
                  </div>
                  <p className="text-sm font-bold text-zinc-400">Nenhuma avaliação registrada ainda.</p>
                  <p className="text-xs text-zinc-600 max-w-[220px]">
                    Quando o coach avaliar seu desempenho em aula, as notas por pilar aparecerão aqui.
                  </p>
                </div>
              )}

              {/* Main content */}
              {!loading && !error && result && result.totalEvals > 0 && (
                <>
                  {/* Overall score card */}
                  <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Nota Geral (coach)</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl font-black" style={{ color: scoreColor(result.overallLatest) }}>
                            {result.overallLatest.toFixed(1)}
                          </span>
                          <span className="text-sm text-zinc-500">/10</span>
                          {Math.abs(result.overallDelta) >= 0.1 && (
                            <span className={`flex items-center gap-0.5 text-xs font-black ${result.overallDelta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {result.overallDelta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {result.overallDelta > 0 ? "+" : ""}{result.overallDelta.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500">Melhor nota</p>
                        <p className="text-lg font-black text-amber-400">{result.overallBest.toFixed(1)}</p>
                        <p className="text-[10px] text-zinc-600">{result.totalEvals} aval.</p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black ${toneConfig[result.insightTone].bg}`} style={{ color: toneConfig[result.insightTone].color }}>
                      <Trophy size={10} />
                      {toneConfig[result.insightTone].label}
                    </div>
                  </div>

                  {/* Pillars */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-3">Por Pilar</p>
                    <div className="space-y-3">
                      {result.pillarStats.map((p: PillarStats) => (
                        <PillarRow key={p.key} stat={p} />
                      ))}
                    </div>
                  </div>

                  {/* AI Insight */}
                  {result.insight && (
                    <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/50 to-[#08080f] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/15">
                          <Sparkles size={14} className="text-violet-400" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-400">Análise do Coach IA</p>
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed">{result.insight}</p>
                    </div>
                  )}

                  {/* Evaluation timeline */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-3">Histórico</p>
                    <div className="space-y-2">
                      {result.evaluations.map((ev) => {
                        const expanded = expandedId === ev.id;
                        const dateStr = new Date(ev.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "short", year: "numeric",
                        });
                        return (
                          <div key={ev.id} className="rounded-xl border border-zinc-800/70 bg-zinc-950/60 overflow-hidden">
                            <button
                              onClick={() => setExpandedId(expanded ? null : ev.id)}
                              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg flex-shrink-0" style={{ background: `${scoreColor(ev.avg_score)}20` }}>
                                  <Star size={10} style={{ color: scoreColor(ev.avg_score) }} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">
                                    {ev.lesson_title ?? "Avaliação"}
                                  </p>
                                  <p className="text-[10px] text-zinc-500">{dateStr}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm font-black" style={{ color: scoreColor(ev.avg_score) }}>
                                  {ev.avg_score.toFixed(1)}
                                </span>
                                {expanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                              </div>
                            </button>

                            <AnimatePresence>
                              {expanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-zinc-800/60 overflow-hidden"
                                >
                                  <div className="px-3 py-3 space-y-2">
                                    {Object.entries(ev.scores).map(([key, val]) => (
                                      <div key={key} className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-500 w-16 flex-shrink-0">
                                          {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </span>
                                        <div className="flex-1 relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                          <div
                                            className="absolute left-0 top-0 h-full rounded-full transition-all"
                                            style={{
                                              width: `${(val / 10) * 100}%`,
                                              backgroundColor: PILLAR_COLORS[key] ?? "#EAB308",
                                            }}
                                          />
                                        </div>
                                        <span className="text-[10px] font-bold text-white w-6 text-right">{val}</span>
                                      </div>
                                    ))}
                                    {ev.notes && (
                                      <p className="text-[11px] text-zinc-400 italic border-t border-zinc-800/60 pt-2 mt-1">
                                        "{ev.notes}"
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function PillarRow({ stat }: { stat: PillarStats }) {
  const color = PILLAR_COLORS[stat.key] ?? "#EAB308";
  const TrendIcon = stat.trend === "up" ? TrendingUp : stat.trend === "down" ? TrendingDown : Minus;
  const trendColor = stat.trend === "up" ? "#22c55e" : stat.trend === "down" ? "#ef4444" : "#71717a";

  return (
    <div className="flex items-center gap-3">
      {/* Label + score */}
      <div className="w-20 flex-shrink-0">
        <p className="text-[10px] font-bold text-zinc-400">{stat.label}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-sm font-black" style={{ color }}>{stat.latest.toFixed(1)}</span>
          <TrendIcon size={10} style={{ color: trendColor }} />
        </div>
      </div>

      {/* Bar */}
      <div className="flex-1 relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(stat.latest / 10) * 100}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* Sparkline */}
      <div className="flex-shrink-0">
        <Sparkline values={stat.sparkline} color={color} />
      </div>
    </div>
  );
}
