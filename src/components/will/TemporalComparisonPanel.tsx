"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarDays, Loader2, Share2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Student, VolleyballFundamental } from "@/context/types";
import { MODAL_OVERLAY_FADE, PRESS_SCALE, SPRING_PREMIUM } from "@/components/ui/motionTokens";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";
import { useToast } from "@/components/Toast";

const FUNDAMENTALS: VolleyballFundamental[] = [
  "ataque", "levantamento", "bloqueio", "saque", "defesa", "recepcao", "posicionamento",
];

const FUNDAMENTAL_LABELS: Record<VolleyballFundamental, string> = {
  ataque: "Ataque",
  levantamento: "Levant.",
  bloqueio: "Bloqueio",
  saque: "Saque",
  defesa: "Defesa",
  recepcao: "Recepção",
  posicionamento: "Posic.",
};

interface PeriodData {
  xp: number;
  presences: number;
  avgScore: number;
  checkins: number;
  fundamentals: Record<VolleyballFundamental, number>;
}

const EMPTY_PERIOD: PeriodData = {
  xp: 0,
  presences: 0,
  avgScore: 0,
  checkins: 0,
  fundamentals: {
    ataque: 0, levantamento: 0, bloqueio: 0, saque: 0,
    defesa: 0, recepcao: 0, posicionamento: 0,
  },
};

function toLocalISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultPeriodA(): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now); end.setDate(end.getDate() - 60);
  const start = new Date(now); start.setDate(start.getDate() - 90);
  return { start: toLocalISO(start), end: toLocalISO(end) };
}

function defaultPeriodB(): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now); end.setDate(end.getDate() - 1);
  const start = new Date(now); start.setDate(start.getDate() - 30);
  return { start: toLocalISO(start), end: toLocalISO(end) };
}

// ─── Radar SVG (single athlete, two datasets: A=grey, B=gold) ────────────────
function RadarChart({
  dataA,
  dataB,
  labelA,
  labelB,
}: {
  dataA: Record<VolleyballFundamental, number>;
  dataB: Record<VolleyballFundamental, number>;
  labelA: string;
  labelB: string;
}) {
  const SIZE = 200;
  const CENTER = SIZE / 2;
  const RADIUS = 72;
  const n = FUNDAMENTALS.length;

  const allVals = FUNDAMENTALS.flatMap((f) => [dataA[f] ?? 0, dataB[f] ?? 0]);
  const maxVal = Math.max(10, ...allVals);

  function getPoint(idx: number, value: number): [number, number] {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const r = RADIUS * Math.min(value / maxVal, 1);
    return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
  }

  function labelPoint(idx: number): [number, number] {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const r = RADIUS + 20;
    return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
  }

  function gridRing(fraction: number): string {
    return FUNDAMENTALS.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = RADIUS * fraction;
      return `${CENTER + r * Math.cos(angle)},${CENTER + r * Math.sin(angle)}`;
    }).join(" ");
  }

  const polyA = FUNDAMENTALS.map((f, i) => getPoint(i, dataA[f] ?? 0).join(",")).join(" ");
  const polyB = FUNDAMENTALS.map((f, i) => getPoint(i, dataB[f] ?? 0).join(",")).join(" ");

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} aria-label="Radar comparativo temporal">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={gridRing(f)} fill="none" stroke="#3f3f46" strokeWidth={0.8} />
        ))}
        {FUNDAMENTALS.map((_, i) => {
          const [x, y] = getPoint(i, maxVal);
          return (
            <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="#3f3f46" strokeWidth={0.8} />
          );
        })}
        {/* Period A — grey */}
        <polygon points={polyA} fill="rgba(161,161,170,0.12)" stroke="#a1a1aa" strokeWidth={1.8} strokeLinejoin="round" />
        {/* Period B — gold */}
        <polygon points={polyB} fill="rgba(234,179,8,0.18)" stroke="#EAB308" strokeWidth={1.8} strokeLinejoin="round" />
        {FUNDAMENTALS.map((f, i) => {
          const [lx, ly] = labelPoint(i);
          return (
            <text key={f} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={7} fill="#a1a1aa">
              {FUNDAMENTAL_LABELS[f]}
            </text>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 text-[10px] font-bold">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-sm bg-zinc-400/50 border border-zinc-400/60" />
          <span className="text-zinc-400">{labelA}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-sm bg-amber-500/40 border border-amber-400/70" />
          <span className="text-amber-300">{labelB}</span>
        </span>
      </div>
    </div>
  );
}

// ─── KPI Diff Card ────────────────────────────────────────────────────────────
function KpiDiff({ label, valA, valB, format }: { label: string; valA: number; valB: number; format?: (n: number) => string }) {
  const fmt = format ?? ((n: number) => String(Math.round(n)));
  const delta = valB - valA;
  const pct = valA > 0 ? Math.round((delta / valA) * 100) : null;
  const positive = delta >= 0;

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-3 text-center">
      <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <div className="flex items-end justify-center gap-1.5">
        <span className="text-[10px] text-zinc-500 line-through">{fmt(valA)}</span>
        <span className="text-[15px] font-black text-white">{fmt(valB)}</span>
      </div>
      {pct !== null && (
        <p className={`mt-0.5 text-[10px] font-black ${positive ? "text-emerald-400" : "text-red-400"}`}>
          {positive ? "+" : ""}{pct}%
        </p>
      )}
    </div>
  );
}

interface Props {
  student: Student;
  onClose: () => void;
}

export default function TemporalComparisonPanel({ student, onClose }: Props) {
  const { toast } = useToast();

  const [periodA, setPeriodA] = useState(defaultPeriodA());
  const [periodB, setPeriodB] = useState(defaultPeriodB());
  const [loading, setLoading] = useState(false);
  const [dataA, setDataA] = useState<PeriodData | null>(null);
  const [dataB, setDataB] = useState<PeriodData | null>(null);
  const [compared, setCompared] = useState(false);

  const fetchPeriod = useCallback(
    async (
      start: string,
      end: string,
      sb: SupabaseClient,
    ): Promise<PeriodData> => {
      const sid = student.id;

      // XP in period
      const { data: xpRows } = await sb
        .from("xp_logs")
        .select("points")
        .eq("student_id", sid)
        .gte("created_at", `${start}T00:00:00`)
        .lte("created_at", `${end}T23:59:59`);
      const xp = (xpRows ?? []).reduce((s: number, r: { points: number }) => s + (r.points ?? 0), 0);

      // Check-ins in period
      const { data: checkinRows } = await sb
        .from("xp_logs")
        .select("id")
        .eq("student_id", sid)
        .eq("type", "checkin")
        .gte("created_at", `${start}T00:00:00`)
        .lte("created_at", `${end}T23:59:59`);
      const checkins = (checkinRows ?? []).length;

      // Evaluations — pillar scores
      const { data: evalRows } = await sb
        .from("performance_feedback")
        .select("rating, pillar_scores")
        .eq("student_id", sid)
        .gte("date", start)
        .lte("date", end);
      const evals = evalRows ?? [];
      const presences = evals.length;

      let avgScore = 0;
      const fundamentalSums: Record<VolleyballFundamental, number> = {
        ataque: 0, levantamento: 0, bloqueio: 0, saque: 0,
        defesa: 0, recepcao: 0, posicionamento: 0,
      };
      const fundamentalCounts: Record<VolleyballFundamental, number> = {
        ataque: 0, levantamento: 0, bloqueio: 0, saque: 0,
        defesa: 0, recepcao: 0, posicionamento: 0,
      };

      if (evals.length > 0) {
        const ratingSum = evals.reduce((s: number, e: { rating: number }) => s + (e.rating ?? 0), 0);
        avgScore = ratingSum / evals.length;

        evals.forEach((e: { pillar_scores?: Record<string, number> | null }) => {
          if (!e.pillar_scores) return;
          (Object.keys(e.pillar_scores) as VolleyballFundamental[]).forEach((k) => {
            if (FUNDAMENTALS.includes(k)) {
              fundamentalSums[k] += e.pillar_scores![k] ?? 0;
              fundamentalCounts[k] += 1;
            }
          });
        });
      }

      const fundamentals: Record<VolleyballFundamental, number> = {
        ataque: fundamentalCounts.ataque > 0 ? fundamentalSums.ataque / fundamentalCounts.ataque : 0,
        levantamento: fundamentalCounts.levantamento > 0 ? fundamentalSums.levantamento / fundamentalCounts.levantamento : 0,
        bloqueio: fundamentalCounts.bloqueio > 0 ? fundamentalSums.bloqueio / fundamentalCounts.bloqueio : 0,
        saque: fundamentalCounts.saque > 0 ? fundamentalSums.saque / fundamentalCounts.saque : 0,
        defesa: fundamentalCounts.defesa > 0 ? fundamentalSums.defesa / fundamentalCounts.defesa : 0,
        recepcao: fundamentalCounts.recepcao > 0 ? fundamentalSums.recepcao / fundamentalCounts.recepcao : 0,
        posicionamento: fundamentalCounts.posicionamento > 0 ? fundamentalSums.posicionamento / fundamentalCounts.posicionamento : 0,
      };

      return { xp, presences, avgScore, checkins, fundamentals };
    },
    [student.id],
  );

  const handleCompare = async () => {
    if (!periodA.start || !periodA.end || !periodB.start || !periodB.end) {
      toast("Preencha todos os campos de período.", "error");
      return;
    }
    setLoading(true);
    try {
      const { getSupabaseClient } = await import("@/lib/supabaseClient");
      const sb = getSupabaseClient();
      const [a, b] = await Promise.all([
        fetchPeriod(periodA.start, periodA.end, sb),
        fetchPeriod(periodB.start, periodB.end, sb),
      ]);
      setDataA(a);
      setDataB(b);
      setCompared(true);
    } catch {
      toast("Erro ao buscar dados. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = (): string => {
    if (!dataA || !dataB) return "";
    const firstName = student.name.split(" ")[0];
    if (dataA.xp === 0 && dataB.xp === 0) return `📊 Sem dados de XP nos períodos selecionados.`;
    if (dataA.xp === 0) return `📈 ${firstName} acumulou ${dataB.xp} XP no período recente!`;
    const pct = Math.round(((dataB.xp - dataA.xp) / dataA.xp) * 100);
    if (pct >= 20) return `📈 Evolução expressiva! ${firstName} cresceu ${pct}% em XP.`;
    if (pct <= -20) return `⚠️ Queda de rendimento. XP reduziu ${Math.abs(pct)}% no período recente.`;
    return `📊 Desempenho estável entre os dois períodos.`;
  };

  const handleShare = () => {
    if (!dataA || !dataB) return;
    const firstName = student.name.split(" ")[0];
    const insight = generateInsight();
    const text =
      `📊 *Relatório de Evolução — ${firstName}*\n\n` +
      `*Período A (${periodA.start} a ${periodA.end})*\n` +
      `XP: ${dataA.xp} | Aulas: ${dataA.presences} | Média: ${dataA.avgScore.toFixed(1)}\n\n` +
      `*Período B (${periodB.start} a ${periodB.end})*\n` +
      `XP: ${dataB.xp} | Aulas: ${dataB.presences} | Média: ${dataB.avgScore.toFixed(1)}\n\n` +
      `${insight}\n\nGerado pelo Will Treinos PRO`;
    void navigator.clipboard.writeText(text);
    toast("Texto copiado! Cole no WhatsApp.");
  };

  const labelA = `${periodA.start} → ${periodA.end}`;
  const labelB = `${periodB.start} → ${periodB.end}`;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Comparação temporal — ${student.name}`}
      className={`fixed inset-0 z-[230] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/80`}
      {...MODAL_OVERLAY_FADE}
      onClick={onClose}
    >
      <div className={`${MODAL_OVERLAY_CENTER_WRAP} px-3 sm:px-6`}>
        <motion.section
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={SPRING_PREMIUM}
          onClick={(e) => e.stopPropagation()}
          className={`my-auto w-full max-w-xl rounded-3xl border border-white/[0.1] bg-[#050505]/95 p-5 shadow-[0_35px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl ${MODAL_PANEL_COLUMN}`}
        >
          {/* Header */}
          <div className="mb-4 shrink-0 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]">
                Comparar Períodos
              </p>
              <h3 className="text-lg font-black text-white">{student.name}</h3>
            </div>
            <motion.button
              whileTap={PRESS_SCALE}
              type="button"
              onClick={onClose}
              className="min-h-11 min-w-11 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center"
            >
              <X className="h-4 w-4 text-zinc-200" />
            </motion.button>
          </div>

          <div className={`${MODAL_BODY_SCROLL} space-y-4`}>
            {/* Period selectors */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Period A */}
              <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-3 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-sm bg-zinc-400/60 border border-zinc-400/70" />
                  Período A (referência)
                </p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] text-zinc-600 uppercase tracking-wider">Início</label>
                    <input
                      type="date"
                      value={periodA.start}
                      onChange={(e) => setPeriodA((p) => ({ ...p, start: e.target.value }))}
                      className="mt-0.5 w-full rounded-lg border border-zinc-700/60 bg-zinc-800/70 px-2 py-1.5 text-[11px] text-white focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] text-zinc-600 uppercase tracking-wider">Fim</label>
                    <input
                      type="date"
                      value={periodA.end}
                      onChange={(e) => setPeriodA((p) => ({ ...p, end: e.target.value }))}
                      className="mt-0.5 w-full rounded-lg border border-zinc-700/60 bg-zinc-800/70 px-2 py-1.5 text-[11px] text-white focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Period B */}
              <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-3 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-500/80 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-sm bg-amber-500/50 border border-amber-400/70" />
                  Período B (recente)
                </p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] text-zinc-600 uppercase tracking-wider">Início</label>
                    <input
                      type="date"
                      value={periodB.start}
                      onChange={(e) => setPeriodB((p) => ({ ...p, start: e.target.value }))}
                      className="mt-0.5 w-full rounded-lg border border-zinc-700/60 bg-zinc-800/70 px-2 py-1.5 text-[11px] text-white focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] text-zinc-600 uppercase tracking-wider">Fim</label>
                    <input
                      type="date"
                      value={periodB.end}
                      onChange={(e) => setPeriodB((p) => ({ ...p, end: e.target.value }))}
                      className="mt-0.5 w-full rounded-lg border border-zinc-700/60 bg-zinc-800/70 px-2 py-1.5 text-[11px] text-white focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Compare button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              data-testid="btn-temporal-compare"
              onClick={() => void handleCompare()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10 py-3 text-[12px] font-black text-amber-200 transition-all hover:bg-[#EAB308]/20 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarDays className="h-4 w-4 text-[#EAB308]" />
              )}
              {loading ? "Comparando…" : "Comparar"}
            </motion.button>

            {/* Results */}
            <AnimatePresence>
              {compared && dataA && dataB && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="space-y-4"
                >
                  {/* KPI strip */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <KpiDiff label="XP Ganho" valA={dataA.xp} valB={dataB.xp} />
                    <KpiDiff label="Aulas" valA={dataA.presences} valB={dataB.presences} />
                    <KpiDiff
                      label="Nota média"
                      valA={dataA.avgScore}
                      valB={dataB.avgScore}
                      format={(n) => n.toFixed(1)}
                    />
                    <KpiDiff label="Check-ins" valA={dataA.checkins} valB={dataB.checkins} />
                  </div>

                  {/* Radar */}
                  <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 flex justify-center">
                    <RadarChart
                      dataA={dataA.fundamentals}
                      dataB={dataB.fundamentals}
                      labelA={labelA}
                      labelB={labelB}
                    />
                  </div>

                  {/* Auto insight */}
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3">
                    <p className="text-[12px] font-bold text-zinc-200">{generateInsight()}</p>
                  </div>

                  {/* Share button */}
                  <motion.button
                    whileTap={PRESS_SCALE}
                    type="button"
                    data-testid="btn-temporal-share"
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-teal-500/35 bg-teal-500/10 py-3 text-[12px] font-black text-teal-200 transition-all hover:bg-teal-500/20"
                  >
                    <Share2 className="h-4 w-4 text-teal-400" />
                    Compartilhar com aluno
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
