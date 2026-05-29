"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Dumbbell,
  Flame,
  HeartPulse,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { FatigueAlert } from "@/app/api/ai/coach-copilot/route";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { MODAL_BODY_SCROLL, MODAL_FIXED_OVERLAY_SCROLL, MODAL_OVERLAY_CENTER_WRAP, MODAL_PANEL_COLUMN } from "@/components/ui/modalScrollClasses";
import { MODAL_BADGE_ENTER, MODAL_HEADER_ENTER, PRESS_SCALE } from "@/components/ui/motionTokens";
import { useStudents } from "@/context/StudentsContext";
import { useLessons } from "@/context/LessonsContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "training" | "alerts" | "lineup" | "fadiga";

type TrainingExercise = {
  name: string;
  focus: string;
  description: string;
  sets: string;
  reps: string;
  tip?: string;
};

type TrainingPlan = {
  theme: string;
  duration: string;
  intensity: "baixa" | "média" | "alta";
  exercises: TrainingExercise[];
  notes?: string;
};

type AlertItem = {
  studentName: string;
  risk: "overtraining" | "plateau" | "dropout" | "queda_rendimento";
  severity: "warning" | "critical";
  reason: string;
  action: string;
};

type LineupGroup = {
  label: string;
  focus: string;
  studentNames: string[];
  rationale: string;
};

type LineupResult = { groups: LineupGroup[]; tip?: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const INTENSITY_STYLE = {
  baixa: { label: "Baixa", class: "bg-emerald-500/20 text-emerald-300" },
  média: { label: "Média", class: "bg-amber-500/20 text-amber-300" },
  alta: { label: "Alta", class: "bg-red-500/20 text-red-300" },
};

const RISK_META = {
  overtraining: { label: "Sobrecarga", icon: <Flame className="h-3.5 w-3.5" />, color: "text-orange-400" },
  plateau: { label: "Plateau", icon: <ChevronRight className="h-3.5 w-3.5" />, color: "text-blue-400" },
  dropout: { label: "Abandono", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-red-400" },
  queda_rendimento: { label: "Queda", icon: <ChevronDown className="h-3.5 w-3.5" />, color: "text-amber-400" },
};

const SEVERITY_BORDER = { warning: "border-amber-500/25", critical: "border-red-500/35" };
const SEVERITY_BG = { warning: "bg-amber-500/[0.06]", critical: "bg-red-500/[0.08]" };

const FOCUS_COLORS: Record<string, string> = {
  ataque: "bg-red-500/20 text-red-300",
  levantamento: "bg-purple-500/20 text-purple-300",
  bloqueio: "bg-blue-500/20 text-blue-300",
  saque: "bg-amber-500/20 text-amber-300",
  defesa: "bg-emerald-500/20 text-emerald-300",
  recepcao: "bg-cyan-500/20 text-cyan-300",
  posicionamento: "bg-zinc-500/20 text-zinc-300",
};

const FATIGUE_SIGNAL_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  overtraining:      { label: "Sobrecarga",        color: "text-red-400",    icon: <Flame className="h-3.5 w-3.5" /> },
  technical_decline: { label: "Queda técnica",     color: "text-amber-400",  icon: <ChevronDown className="h-3.5 w-3.5" /> },
  burnout_risk:      { label: "Risco de burnout",  color: "text-orange-400", icon: <Activity className="h-3.5 w-3.5" /> },
  recovery_needed:   { label: "Precisa descanso",  color: "text-blue-400",   icon: <HeartPulse className="h-3.5 w-3.5" /> },
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "training", label: "Treino",  icon: <Dumbbell className="h-3.5 w-3.5" /> },
  { id: "alerts",   label: "Alertas", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { id: "fadiga",   label: "Fadiga",  icon: <HeartPulse className="h-3.5 w-3.5" /> },
  { id: "lineup",   label: "Escalação", icon: <Users className="h-3.5 w-3.5" /> },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExerciseCard({ ex, idx }: { ex: TrainingExercise; idx: number }) {
  const focusClass = FOCUS_COLORS[ex.focus] ?? "bg-zinc-500/20 text-zinc-300";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-[12px] font-black text-white leading-tight">{ex.name}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${focusClass}`}>
          {ex.focus}
        </span>
      </div>
      <p className="text-[11px] text-zinc-400 leading-snug mb-2">{ex.description}</p>
      <div className="flex gap-3">
        <span className="text-[10px] font-bold text-zinc-300">{ex.sets}</span>
        <span className="text-[10px] text-zinc-500">·</span>
        <span className="text-[10px] font-bold text-zinc-300">{ex.reps}</span>
      </div>
      {ex.tip && (
        <p className="mt-1.5 text-[10px] text-[#EAB308]/80 italic">💡 {ex.tip}</p>
      )}
    </motion.div>
  );
}

function AlertCard({ item, idx }: { item: AlertItem; idx: number }) {
  const meta = RISK_META[item.risk];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      className={`rounded-xl border ${SEVERITY_BORDER[item.severity]} ${SEVERITY_BG[item.severity]} px-3.5 py-3`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`${meta.color}`}>{meta.icon}</span>
        <p className="text-[12px] font-black text-white">{item.studentName}</p>
        <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${
          item.severity === "critical" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
        }`}>
          {meta.label}
        </span>
      </div>
      <p className="text-[11px] text-zinc-400 leading-snug">{item.reason}</p>
      <p className="mt-1.5 text-[10px] font-bold text-[#EAB308]/80">{item.action} →</p>
    </motion.div>
  );
}

function GroupCard({ group, idx }: { group: LineupGroup; idx: number }) {
  const colors = ["border-[#EAB308]/25 bg-[#EAB308]/[0.05]", "border-purple-500/25 bg-purple-500/[0.05]", "border-emerald-500/25 bg-emerald-500/[0.05]"];
  const textColors = ["text-[#EAB308]", "text-purple-400", "text-emerald-400"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08 }}
      className={`rounded-xl border ${colors[idx % 3]} px-3.5 py-3`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className={`text-[11px] font-black uppercase tracking-widest ${textColors[idx % 3]}`}>{group.label}</p>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold text-zinc-400">
          {group.focus}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {group.studentNames.map((name) => (
          <span key={name} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
            {name}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-zinc-500 italic">{group.rationale}</p>
    </motion.div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function CoachCopilotPanel({ onClose }: { onClose: () => void }) {
  const { students } = useStudents();
  const { todayLessons } = useLessons();

  const activeStudents = students.filter((s) => s.status === "active" || s.status === "trial");
  const todayStudentIds = new Set(todayLessons.flatMap((l) => l.enrolledStudents ?? []));

  const [tab, setTab] = useState<Tab>("training");
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    activeStudents.filter((s) => todayStudentIds.has(s.id)).map((s) => s.id).slice(0, 8)
  );
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null);
  const [fatigueAlerts, setFatigueAlerts] = useState<FatigueAlert[] | null>(null);
  const [fatigueLoaded, setFatigueLoaded] = useState(false);
  const [lineup, setLineup] = useState<LineupResult | null>(null);
  const [alertsLoaded, setAlertsLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const getToken = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return "";
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  };

  const call = useCallback(async (mode: Tab, ids: string[], ctx: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    try {
      const token = await getToken();
      const res = await fetch("/api/ai/coach-copilot", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode, studentIds: ids, context: ctx }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("api_error");
      const data = await res.json();

      if (mode === "training") setTrainingPlan((data as { plan: TrainingPlan }).plan ?? null);
      if (mode === "alerts") { setAlerts((data as { alerts: AlertItem[] }).alerts ?? []); setAlertsLoaded(true); }
      if (mode === "fadiga") { setFatigueAlerts((data as { fatigueAlerts: FatigueAlert[] }).fatigueAlerts ?? []); setFatigueLoaded(true); }
      if (mode === "lineup") setLineup({ groups: (data as { groups: LineupGroup[] }).groups ?? [], tip: (data as { groups: LineupGroup[]; tip?: string }).tip });
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load alerts on first switch to that tab
  useEffect(() => {
    if (tab === "alerts" && !alertsLoaded && !loading) {
      void call("alerts", [], "");
    }
    if (tab === "fadiga" && !fatigueLoaded && !loading) {
      void call("fadiga", [], "");
    }
  }, [tab, alertsLoaded, fatigueLoaded, loading, call]);

  // Cleanup on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    if (tab === "training") void call("training", selectedIds, context);
    else if (tab === "lineup") void call("lineup", selectedIds, context);
    else void call("alerts", [], "");
  };

  const hasResult =
    (tab === "training" && trainingPlan !== null) ||
    (tab === "alerts" && alerts !== null) ||
    (tab === "lineup" && lineup !== null);

  return (
    <div className={MODAL_FIXED_OVERLAY_SCROLL} role="dialog" aria-modal="true" aria-label="Copiloto do Coach">
      <div className={MODAL_OVERLAY_CENTER_WRAP}>
        <motion.div
          className={`${MODAL_PANEL_COLUMN} max-w-xl border-white/[0.08] bg-[#050505]/95 backdrop-blur-3xl`}
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10"
              >
                <Cpu className="h-4.5 w-4.5 text-cyan-400" />
              </motion.div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-400">Copiloto do Coach</p>
                <p className="text-[10px] text-zinc-500">IA treinada para vôlei de alta performance</p>
              </div>
            </motion.div>
            <motion.button
              whileTap={PRESS_SCALE}
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="shrink-0 flex gap-1 px-5 pb-3">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                  tab === t.id
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className={`${MODAL_BODY_SCROLL} px-5 pb-5`}>
            <AnimatePresence mode="wait">
              {/* ── TRAINING TAB ─────────────────────────────────────── */}
              {tab === "training" && (
                <motion.div key="training" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Student selector */}
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Atletas ({selectedIds.length} selecionados)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeStudents.slice(0, 20).map((s) => {
                        const selected = selectedIds.includes(s.id);
                        const isToday = todayStudentIds.has(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleStudent(s.id)}
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all border ${
                              selected
                                ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-200"
                                : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            {isToday && <span className="mr-1 opacity-60">●</span>}
                            {s.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                    {todayStudentIds.size > 0 && (
                      <p className="mt-1.5 text-[9px] text-zinc-600">● = nas aulas de hoje</p>
                    )}
                  </div>

                  {/* Context input */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Contexto (opcional)</p>
                    <textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Ex: foco em transição rápida, preparação para torneio, treino leve pré-jogo…"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-300 placeholder-zinc-600 outline-none focus:border-cyan-500/40 focus:bg-cyan-500/[0.04] transition-all"
                    />
                  </div>

                  {/* Generate button */}
                  <motion.button
                    type="button"
                    whileTap={PRESS_SCALE}
                    onClick={handleGenerate}
                    disabled={loading || selectedIds.length === 0}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/35 bg-cyan-500/10 py-3 text-[12px] font-black text-cyan-200 transition-all hover:border-cyan-400/60 hover:bg-cyan-500/15 disabled:opacity-40"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {loading ? "Gerando plano…" : "Gerar Plano de Treino"}
                  </motion.button>

                  {/* Result */}
                  <AnimatePresence>
                    {trainingPlan && !loading && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                        {/* Plan header */}
                        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-[13px] font-black text-white">{trainingPlan.theme}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${INTENSITY_STYLE[trainingPlan.intensity]?.class ?? ""}`}>
                              {INTENSITY_STYLE[trainingPlan.intensity]?.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400">⏱ {trainingPlan.duration}</p>
                          {trainingPlan.notes && (
                            <p className="mt-2 text-[10px] text-zinc-500 italic">{trainingPlan.notes}</p>
                          )}
                        </div>

                        {/* Exercises */}
                        <div className="space-y-2">
                          {trainingPlan.exercises.map((ex, i) => (
                            <ExerciseCard key={i} ex={ex} idx={i} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── ALERTS TAB ───────────────────────────────────────── */}
              {tab === "alerts" && (
                <motion.div key="alerts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Análise de risco — todos os atletas ativos
                    </p>
                    <motion.button
                      type="button"
                      whileTap={PRESS_SCALE}
                      onClick={() => { setAlerts(null); setAlertsLoaded(false); void call("alerts", [], ""); }}
                      disabled={loading}
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-white disabled:opacity-40"
                      aria-label="Recarregar alertas"
                    >
                      <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                    </motion.button>
                  </div>

                  {loading && (
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-16 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]" style={{ animationDelay: `${i * 100}ms` }} />
                      ))}
                    </div>
                  )}

                  {!loading && alerts !== null && alerts.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-6 text-center">
                      <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                      <p className="text-[12px] font-black text-emerald-300">Todos os atletas em dia</p>
                      <p className="text-[11px] text-zinc-500 mt-1">Nenhum risco identificado nas últimas 2 semanas.</p>
                    </motion.div>
                  )}

                  {!loading && alerts !== null && alerts.length > 0 && (
                    <div className="space-y-2">
                      {alerts.map((item, i) => (
                        <AlertCard key={i} item={item} idx={i} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── FADIGA TAB ───────────────────────────────────────── */}
              {tab === "fadiga" && (
                <motion.div key="fadiga" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Análise de fadiga — baseada em avaliações reais
                    </p>
                    <motion.button
                      type="button"
                      whileTap={PRESS_SCALE}
                      onClick={() => { setFatigueAlerts(null); setFatigueLoaded(false); void call("fadiga", [], ""); }}
                      disabled={loading}
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-white disabled:opacity-40"
                      aria-label="Recarregar análise de fadiga"
                    >
                      <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                    </motion.button>
                  </div>

                  {loading && (
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-16 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]" style={{ animationDelay: `${i * 100}ms` }} />
                      ))}
                    </div>
                  )}

                  {!loading && fatigueAlerts !== null && fatigueAlerts.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-6 text-center">
                      <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                      <p className="text-[12px] font-black text-emerald-300">Nenhum sinal de fadiga detectado</p>
                      <p className="text-[11px] text-zinc-500 mt-1">Todos os atletas com avaliações em curva saudável.</p>
                    </motion.div>
                  )}

                  {!loading && fatigueAlerts === null && !fatigueLoaded && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-5 text-center">
                      <p className="text-[11px] text-zinc-500">Requer pelo menos 2 avaliações salvas por atleta.</p>
                    </motion.div>
                  )}

                  {!loading && fatigueAlerts !== null && fatigueAlerts.length > 0 && (
                    <div className="space-y-2">
                      {fatigueAlerts.map((alert, i) => {
                        const meta = FATIGUE_SIGNAL_META[alert.signal] ?? FATIGUE_SIGNAL_META.technical_decline;
                        const severityBorder = alert.severity === "critical" ? "border-red-500/35" : "border-amber-500/25";
                        const severityBg = alert.severity === "critical" ? "bg-red-500/[0.08]" : "bg-amber-500/[0.06]";
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className={`rounded-xl border ${severityBorder} ${severityBg} px-3.5 py-3`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={meta.color}>{meta.icon}</span>
                              <p className="text-[12px] font-black text-white">{alert.studentName}</p>
                              <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                                alert.severity === "critical" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
                              }`}>
                                {meta.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-snug">{alert.reason}</p>
                            {alert.affectedPillars.length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {alert.affectedPillars.map((p) => (
                                  <span key={p} className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-zinc-400">{p}</span>
                                ))}
                              </div>
                            )}
                            <p className="mt-2 text-[10px] font-bold text-[#EAB308]/80">{alert.recommendation} →</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── LINEUP TAB ───────────────────────────────────────── */}
              {tab === "lineup" && (
                <motion.div key="lineup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Atletas para escalar ({selectedIds.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeStudents.slice(0, 20).map((s) => {
                        const selected = selectedIds.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleStudent(s.id)}
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all border ${
                              selected
                                ? "border-[#EAB308]/40 bg-[#EAB308]/15 text-amber-200"
                                : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            {s.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Objetivo da aula</p>
                    <textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Ex: treino competitivo, mentoria de iniciantes, preparação para campeonato…"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-300 placeholder-zinc-600 outline-none focus:border-amber-500/40 focus:bg-amber-500/[0.04] transition-all"
                    />
                  </div>

                  <motion.button
                    type="button"
                    whileTap={PRESS_SCALE}
                    onClick={handleGenerate}
                    disabled={loading || selectedIds.length < 2}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10 py-3 text-[12px] font-black text-amber-200 transition-all hover:border-amber-400/60 hover:bg-amber-500/15 disabled:opacity-40"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                    {loading ? "Calculando escalação…" : "Sugerir Escalação"}
                  </motion.button>

                  <AnimatePresence>
                    {lineup && !loading && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                        {lineup.groups.length === 0 && (
                          <p className="text-center text-[11px] text-zinc-500">Selecione ao menos 2 atletas.</p>
                        )}
                        {lineup.groups.map((g, i) => <GroupCard key={i} group={g} idx={i} />)}
                        {lineup.tip && (
                          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <Zap className="h-3 w-3 text-[#EAB308]" />
                              <p className="text-[10px] font-black text-[#EAB308] uppercase tracking-wider">Dica do Copiloto</p>
                            </div>
                            <p className="text-[11px] text-zinc-400">{lineup.tip}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer brand */}
            <div className="mt-6 flex items-center justify-center gap-1.5 opacity-30">
              <Bot className="h-3 w-3 text-zinc-500" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                Copiloto · Powered by Claude AI
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
