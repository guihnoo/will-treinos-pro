"use client";

import React, { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ScanSearch, Circle, ChevronDown, Users } from "lucide-react";
import type { Student, VolleyballFundamental } from "@/context/types";
import { FUNDAMENTAL_MULTIPLIERS } from "@/context/types";
import { MODAL_OVERLAY_FADE, PRESS_SCALE, SPRING_PREMIUM } from "@/components/ui/motionTokens";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";

interface Props {
  students: Student[];
  onClose: () => void;
}

interface AthleteData {
  totalXP: number;
  fundamentals: Record<VolleyballFundamental, number>;
  checkinCount: number;
  tierUnlocks: { tier: string; unlockedAt: string }[];
}

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

const CARD_TIERS = ["bronze", "prata", "ouro", "diamante", "elite"] as const;
const TIER_THRESHOLDS: Record<string, number> = {
  bronze: 500, prata: 1500, ouro: 3000, diamante: 6000, elite: 10000,
};

function getTierLabel(totalXP: number): string {
  let tier = "—";
  for (const t of CARD_TIERS) {
    if (totalXP >= TIER_THRESHOLDS[t]) tier = t.charAt(0).toUpperCase() + t.slice(1);
  }
  return tier;
}

function getBestWorstFundamental(
  fundamentals: Record<VolleyballFundamental, number>,
): { best: string; worst: string } {
  const sorted = FUNDAMENTALS.slice().sort(
    (a, b) => (fundamentals[b] ?? 0) - (fundamentals[a] ?? 0),
  );
  const best = sorted[0] ? FUNDAMENTAL_LABELS[sorted[0]] : "—";
  const worst = sorted[sorted.length - 1]
    ? FUNDAMENTAL_LABELS[sorted[sorted.length - 1]!]
    : "—";
  return { best, worst };
}

// Radar SVG — two overlapping heptagons
function RadarChart({
  dataA,
  dataB,
  nameA,
  nameB,
}: {
  dataA: Record<VolleyballFundamental, number>;
  dataB: Record<VolleyballFundamental, number>;
  nameA: string;
  nameB: string;
}) {
  const SIZE = 180;
  const CENTER = SIZE / 2;
  const RADIUS = 70;
  const n = FUNDAMENTALS.length;

  // Max XP for normalisation (cap at 5000 per fundamental for display)
  const maxVal = Math.max(
    5000,
    ...FUNDAMENTALS.flatMap((f) => [dataA[f] ?? 0, dataB[f] ?? 0]),
  );

  function getPoint(idx: number, value: number): [number, number] {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const r = RADIUS * Math.min(value / maxVal, 1);
    return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
  }

  function labelPoint(idx: number): [number, number] {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const r = RADIUS + 18;
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
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        aria-label="Radar comparativo de fundamentos"
      >
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon
            key={f}
            points={gridRing(f)}
            fill="none"
            stroke="#3f3f46"
            strokeWidth={0.8}
          />
        ))}
        {/* Axis lines */}
        {FUNDAMENTALS.map((_, i) => {
          const [x, y] = getPoint(i, maxVal);
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke="#3f3f46"
              strokeWidth={0.8}
            />
          );
        })}
        {/* Athlete A — amber */}
        <polygon
          points={polyA}
          fill="rgba(234,179,8,0.18)"
          stroke="#EAB308"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        {/* Athlete B — cyan */}
        <polygon
          points={polyB}
          fill="rgba(6,182,212,0.18)"
          stroke="#06b6d4"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        {/* Labels */}
        {FUNDAMENTALS.map((f, i) => {
          const [lx, ly] = labelPoint(i);
          return (
            <text
              key={f}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={7}
              fill="#a1a1aa"
            >
              {FUNDAMENTAL_LABELS[f]}
            </text>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#EAB308]" />
          <span className="text-amber-300 font-bold truncate max-w-[80px]">{nameA}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
          <span className="text-cyan-300 font-bold truncate max-w-[80px]">{nameB}</span>
        </span>
      </div>
    </div>
  );
}

const EMPTY_DATA: AthleteData = {
  totalXP: 0,
  fundamentals: Object.fromEntries(FUNDAMENTALS.map((f) => [f, 0])) as Record<VolleyballFundamental, number>,
  checkinCount: 0,
  tierUnlocks: [],
};

export default function ScoutModePanel({ students, onClose }: Props) {
  const activeStudents = useMemo(() => students.filter((s) => s.status === "active"), [students]);

  const [studentAId, setStudentAId] = useState<string>(activeStudents[0]?.id ?? "");
  const [studentBId, setStudentBId] = useState<string>(activeStudents[1]?.id ?? "");
  const [dataA, setDataA] = useState<AthleteData | null>(null);
  const [dataB, setDataB] = useState<AthleteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [compared, setCompared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const studentA = useMemo(() => students.find((s) => s.id === studentAId) ?? null, [students, studentAId]);
  const studentB = useMemo(() => students.find((s) => s.id === studentBId) ?? null, [students, studentBId]);

  const fetchAthleteData = useCallback(
    async (studentId: string): Promise<AthleteData> => {
      const { getSupabaseClient } = await import("@/lib/supabaseClient");
      const sb = getSupabaseClient();
      if (!sb) return EMPTY_DATA;

      const [xpResult, checkinResult, tiersResult] = await Promise.all([
        sb
          .from("xp_log")
          .select("points, multiplier_type")
          .eq("student_id", studentId),
        sb
          .from("xp_log")
          .select("id")
          .eq("student_id", studentId)
          .in("type", ["checkin_presencial", "checkin_externo"]),
        sb
          .from("student_achievements")
          .select("tier_id, unlocked_at")
          .eq("student_id", studentId)
          .order("unlocked_at", { ascending: true }),
      ]);

      const xpRows = (xpResult.data ?? []) as Array<{ points: number; multiplier_type: string }>;
      const totalXP = xpRows.reduce((s, r) => s + (r.points ?? 0), 0);

      const fundamentals = Object.fromEntries(
        FUNDAMENTALS.map((f) => [f, 0]),
      ) as Record<VolleyballFundamental, number>;

      for (const r of xpRows) {
        const key = r.multiplier_type as VolleyballFundamental;
        if (key in fundamentals) {
          fundamentals[key] = (fundamentals[key] ?? 0) + (r.points ?? 0);
        }
      }

      const checkinCount = (checkinResult.data ?? []).length;

      const tierUnlocks = ((tiersResult.data ?? []) as Array<{ tier_id: string; unlocked_at: string }>).map(
        (t) => ({ tier: t.tier_id, unlockedAt: t.unlocked_at }),
      );

      return { totalXP, fundamentals, checkinCount, tierUnlocks };
    },
    [],
  );

  const handleCompare = async () => {
    if (!studentAId || !studentBId || studentAId === studentBId) {
      setError("Selecione dois atletas diferentes.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        fetchAthleteData(studentAId),
        fetchAthleteData(studentBId),
      ]);
      setDataA(a);
      setDataB(b);
      setCompared(true);
    } catch {
      setError("Erro ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Generate local insight string
  const insight = useMemo(() => {
    if (!dataA || !dataB || !studentA || !studentB) return null;
    const firstA = studentA.name.split(" ")[0];
    const firstB = studentB.name.split(" ")[0];

    const diffs = FUNDAMENTALS.map((f) => ({
      f,
      diff: (dataA.fundamentals[f] ?? 0) - (dataB.fundamentals[f] ?? 0),
    })).sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));

    const top = diffs[0];
    if (!top || Math.abs(top.diff) < 10) {
      return `${firstA} e ${firstB} estão bem equilibrados nos fundamentos.`;
    }

    const leader = top.diff > 0 ? firstA : firstB;
    const trailer = top.diff > 0 ? firstB : firstA;
    const label = FUNDAMENTAL_LABELS[top.f];
    const xpDiff = Math.abs(top.diff);

    return `${leader} lidera em ${label} (+${xpDiff.toLocaleString("pt-BR")} XP). ${trailer} pode focar neste fundamento para equalizar.`;
  }, [dataA, dataB, studentA, studentB]);

  const rowData = useMemo(() => {
    if (!dataA || !dataB || !studentA || !studentB) return null;
    const { best: bestA, worst: worstA } = getBestWorstFundamental(dataA.fundamentals);
    const { best: bestB, worst: worstB } = getBestWorstFundamental(dataB.fundamentals);
    return [
      { label: "XP Total", a: dataA.totalXP.toLocaleString("pt-BR"), b: dataB.totalXP.toLocaleString("pt-BR") },
      { label: "Check-ins", a: String(dataA.checkinCount), b: String(dataB.checkinCount) },
      {
        label: "Frequência/sem",
        a: `${studentA.frequency ?? "—"}x`,
        b: `${studentB.frequency ?? "—"}x`,
      },
      { label: "Fund. mais forte", a: bestA, b: bestB },
      { label: "Fund. mais fraco", a: worstA, b: worstB },
      { label: "Tier atual", a: getTierLabel(dataA.totalXP), b: getTierLabel(dataB.totalXP) },
    ];
  }, [dataA, dataB, studentA, studentB]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      data-modal-overlay
      aria-label="Scout Mode — comparação de atletas"
      className={`fixed inset-0 z-[230] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/85`}
      {...MODAL_OVERLAY_FADE}
      onClick={onClose}
    >
      <div className={`${MODAL_OVERLAY_CENTER_WRAP} px-3 text-left sm:px-6`}>
        <motion.section
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={SPRING_PREMIUM}
          onClick={(e) => e.stopPropagation()}
          className={`my-auto w-full max-w-xl rounded-3xl border border-white/[0.1] bg-zinc-950/95 shadow-[0_35px_120px_rgba(0,0,0,0.8)] backdrop-blur-3xl ${MODAL_PANEL_COLUMN}`}
        >
          {/* Header */}
          <div className="shrink-0 border-b border-zinc-800/70 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                  Scout Mode
                </p>
                <h3 className="mt-0.5 text-base font-black text-white flex items-center gap-2">
                  <ScanSearch className="h-4 w-4 text-cyan-400" />
                  Comparação de Atletas
                </h3>
              </div>
              <motion.button
                whileTap={PRESS_SCALE}
                type="button"
                onClick={onClose}
                data-testid="btn-close-scout-mode"
                className="min-h-10 min-w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-zinc-300" />
              </motion.button>
            </div>
          </div>

          {/* Body */}
          <div className={`${MODAL_BODY_SCROLL} px-5 py-4 space-y-4`}>
            {/* Selection */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: studentAId, setId: setStudentAId, label: "Atleta A", color: "amber" },
                { id: studentBId, setId: setStudentBId, label: "Atleta B", color: "cyan" },
              ].map(({ id, setId, label, color }) => (
                <div key={label}>
                  <p className={`mb-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-${color}-400`}>
                    {label}
                  </p>
                  <div className="relative">
                    <select
                      value={id}
                      onChange={(e) => {
                        setId(e.target.value);
                        setCompared(false);
                      }}
                      aria-label={`Selecionar ${label}`}
                      className={`w-full appearance-none rounded-xl border border-zinc-700/60 bg-zinc-900/80 py-2 pl-3 pr-8 text-xs font-bold text-white focus:outline-none focus:border-${color}-500/40 transition-colors`}
                    >
                      <option value="">Selecionar…</option>
                      {activeStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-400 font-semibold">{error}</p>
            )}

            {/* Compare button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              data-testid="btn-compare-athletes"
              disabled={loading || !studentAId || !studentBId || studentAId === studentBId}
              onClick={handleCompare}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-3 text-[12px] font-black text-cyan-200 transition-all hover:border-cyan-400/60 hover:bg-cyan-500/15 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Circle className="h-4 w-4 animate-spin text-cyan-400" />
                  Analisando…
                </>
              ) : (
                <>
                  <ScanSearch className="h-4 w-4 text-cyan-400" />
                  {compared ? "Atualizar comparação" : "Comparar atletas"}
                </>
              )}
            </motion.button>

            {/* Empty state — waiting for comparison */}
            {!compared && !loading && (
              <div className="flex flex-col items-center gap-3 py-8 text-center rounded-2xl border border-zinc-800/50 bg-zinc-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700/60 bg-zinc-900/60">
                  <Users className="h-6 w-6 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-400">Selecione dois atletas</p>
                  <p className="text-xs text-zinc-600 mt-0.5 max-w-xs">
                    Escolha Atleta A e Atleta B acima e clique em &quot;Comparar&quot; para ver o radar de fundamentos.
                  </p>
                </div>
              </div>
            )}

            {/* Results */}
            <AnimatePresence>
              {compared && dataA && dataB && studentA && studentB && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="space-y-4"
                >
                  {/* Radar */}
                  <div className="flex justify-center rounded-2xl border border-zinc-800/70 bg-black/30 py-4">
                    <RadarChart
                      dataA={dataA.fundamentals}
                      dataB={dataB.fundamentals}
                      nameA={studentA.name.split(" ")[0] ?? studentA.name}
                      nameB={studentB.name.split(" ")[0] ?? studentB.name}
                    />
                  </div>

                  {/* Comparison table */}
                  {rowData && (
                    <div className="rounded-2xl border border-zinc-800/70 bg-black/20 overflow-hidden">
                      {/* Table header */}
                      <div className="grid grid-cols-3 border-b border-zinc-800/60 px-3 py-2 text-[10px] font-black uppercase tracking-wider">
                        <span className="text-zinc-500">Métrica</span>
                        <span className="text-amber-400 text-center truncate">
                          {studentA.name.split(" ")[0]}
                        </span>
                        <span className="text-cyan-400 text-center truncate">
                          {studentB.name.split(" ")[0]}
                        </span>
                      </div>
                      {rowData.map((row, i) => (
                        <div
                          key={row.label}
                          className={`grid grid-cols-3 px-3 py-2.5 text-[11px] ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                        >
                          <span className="text-zinc-400 font-medium">{row.label}</span>
                          <span className="text-amber-200 font-bold text-center">{row.a}</span>
                          <span className="text-cyan-200 font-bold text-center">{row.b}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Insight */}
                  {insight && (
                    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-3.5 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-1.5">
                        Insight rápido
                      </p>
                      <p className="text-[12px] text-zinc-200 leading-relaxed">{insight}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
