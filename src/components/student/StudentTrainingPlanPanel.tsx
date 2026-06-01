"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Dumbbell, ChevronDown, ChevronUp, CheckCircle2, Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type IntensityLevel = "leve" | "média" | "alta" | string;

type TrainingExercise = {
  id: string;
  name: string;
  sets?: number | null;
  reps_min?: number | null;
  reps_max?: number | null;
  duration_seconds?: number | null;
  intensity?: IntensityLevel | null;
  day_name?: string | null;
  week_number?: number | null;
  notes?: string | null;
};

type TrainingPlan = {
  id: string;
  title: string;
  description?: string | null;
  created_at: string;
  tier?: string | null;
  level?: string | null;
  exercises: TrainingExercise[];
};

interface Props {
  studentId: string;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LS_KEY_PREFIX = "wt_training_done_";

function getWeekKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const week = Math.ceil(
    ((now.getTime() - new Date(y, 0, 1).getTime()) / 86_400_000 + new Date(y, 0, 1).getDay() + 1) / 7,
  );
  return `${y}_w${week}`;
}

function loadDoneSet(planId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${LS_KEY_PREFIX}${planId}_${getWeekKey()}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveDoneSet(planId: string, set: Set<string>): void {
  try {
    localStorage.setItem(
      `${LS_KEY_PREFIX}${planId}_${getWeekKey()}`,
      JSON.stringify([...set]),
    );
  } catch { /* ignore */ }
}

const intensityConfig: Record<string, { label: string; cls: string }> = {
  leve:  { label: "Leve",  cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  média: { label: "Média", cls: "text-amber-400  border-amber-500/30  bg-amber-500/10"  },
  alta:  { label: "Alta",  cls: "text-red-400    border-red-500/30    bg-red-500/10"    },
};

function intensityBadge(level: IntensityLevel | null | undefined): React.ReactNode {
  const key = (level ?? "").toLowerCase();
  const cfg = intensityConfig[key] ?? { label: level ?? "—", cls: "text-zinc-400 border-zinc-700 bg-zinc-900" };
  return (
    <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentTrainingPlanPanel({ studentId, onClose }: Props) {
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [doneExercises, setDoneExercises] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState<string | null>(null);

  // Load plan + exercises
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const sb = getSupabaseClient();
      if (!sb) { if (!cancelled) setLoading(false); return; }

      try {
        const { data: plans } = await sb
          .from("training_plans")
          .select("id, title, description, created_at, tier, level")
          .eq("student_id", studentId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1);

        if (!plans || plans.length === 0) {
          if (!cancelled) { setPlan(null); setLoading(false); }
          return;
        }

        const p = plans[0]!;

        const { data: exercises } = await sb
          .from("training_exercises")
          .select("id, name, sets, reps_min, reps_max, duration_seconds, intensity, day_name, week_number, notes")
          .eq("plan_id", p.id)
          .order("week_number", { ascending: true })
          .order("day_name", { ascending: true });

        if (!cancelled) {
          const full: TrainingPlan = {
            id: p.id as string,
            title: String(p.title ?? "Plano de Treino"),
            description: p.description as string | null | undefined,
            created_at: p.created_at as string,
            tier: p.tier as string | null | undefined,
            level: p.level as string | null | undefined,
            exercises: (exercises ?? []) as TrainingExercise[],
          };
          setPlan(full);
          setDoneExercises(loadDoneSet(full.id));
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setPlan(null); setLoading(false); }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [studentId]);

  const toggleDay = useCallback((day: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }, []);

  const markDone = useCallback(async (exerciseId: string) => {
    if (!plan || completing) return;
    setCompleting(exerciseId);

    // Optimistic
    setDoneExercises(prev => {
      const next = new Set(prev);
      next.add(exerciseId);
      saveDoneSet(plan.id, next);
      return next;
    });

    // Fire XP integration (non-blocking)
    try {
      await fetch("/api/xp/integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "training_completed", studentId, exerciseId }),
      });
    } catch { /* silently ignore */ }

    setCompleting(null);
  }, [plan, studentId, completing]);

  // Group exercises by day
  const exercisesByDay = React.useMemo(() => {
    if (!plan) return new Map<string, TrainingExercise[]>();
    const map = new Map<string, TrainingExercise[]>();
    for (const ex of plan.exercises) {
      const day = ex.day_name ?? "Sem dia definido";
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(ex);
    }
    return map;
  }, [plan]);

  const totalExercises = plan?.exercises.length ?? 0;
  const completedCount = doneExercises.size;
  const progressPct = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] bg-black/85 backdrop-blur-sm flex flex-col justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl mx-auto bg-[#0a0a0a] border-t border-zinc-800 rounded-t-3xl max-h-[90dvh] flex flex-col shadow-[0_-24px_80px_rgba(0,0,0,0.55)]"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-0 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
              <Dumbbell size={17} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Meu Plano de Treino</h2>
              {plan && <p className="text-[10px] text-zinc-500">{plan.title}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="training-plan-close"
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-zinc-900/60 border border-zinc-800/50" />
              ))}
            </div>
          ) : !plan ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Dumbbell size={44} className="text-zinc-700 mb-3" />
              <p className="text-sm font-bold text-zinc-400">Seu coach ainda não criou um plano para você</p>
              <p className="text-xs text-zinc-600 mt-1 max-w-xs">Assim que o plano for liberado, ele aparecerá aqui com todos os exercícios.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {/* Plan header card */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-white">{plan.title}</h3>
                    {plan.description && (
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{plan.description}</p>
                    )}
                    <p className="text-[10px] text-zinc-600 mt-1.5">
                      Criado em {new Date(plan.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  {/* Progress ring */}
                  <div className="relative flex-shrink-0">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#27272a" strokeWidth="2.8" />
                      <motion.circle
                        cx="18" cy="18" r="14"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeDasharray="88"
                        strokeDashoffset={88 - (88 * progressPct) / 100}
                        initial={{ strokeDashoffset: 88 }}
                        animate={{ strokeDashoffset: 88 - (88 * progressPct) / 100 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-xs font-black text-emerald-400">{progressPct}%</p>
                    </div>
                  </div>
                </div>

                {/* Level/Tier badges */}
                {(plan.tier ?? plan.level) && (
                  <div className="flex gap-2 mt-2">
                    {plan.tier && (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black text-amber-400 uppercase tracking-wide">
                        {plan.tier}
                      </span>
                    )}
                    {plan.level && (
                      <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[9px] font-black text-sky-400 uppercase tracking-wide">
                        Nível {plan.level}
                      </span>
                    )}
                  </div>
                )}

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Progresso desta semana</span>
                    <span>{completedCount}/{totalExercises} exercícios</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Exercises by day */}
              {exercisesByDay.size === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">Nenhum exercício cadastrado neste plano ainda.</p>
              ) : (
                Array.from(exercisesByDay.entries()).map(([day, exs]) => {
                  const isOpen = expandedDays.has(day);
                  const dayDone = exs.filter(e => doneExercises.has(e.id)).length;
                  return (
                    <div key={day} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
                      {/* Day header (accordion toggle) */}
                      <button
                        onClick={() => toggleDay(day)}
                        data-testid={`training-day-${day}`}
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${dayDone === exs.length ? "bg-emerald-400" : "bg-zinc-600"}`} />
                          <span className="text-xs font-black text-white">{day}</span>
                          <span className="text-[10px] text-zinc-500">{exs.length} exercício{exs.length !== 1 ? "s" : ""}</span>
                          {dayDone > 0 && (
                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-1.5 py-0.5">
                              {dayDone}/{exs.length}
                            </span>
                          )}
                        </div>
                        {isOpen ? (
                          <ChevronUp size={15} className="text-zinc-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown size={15} className="text-zinc-500 flex-shrink-0" />
                        )}
                      </button>

                      {/* Exercise list */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 space-y-2.5 border-t border-zinc-800/50">
                              {exs.map(ex => {
                                const isDone = doneExercises.has(ex.id);
                                const isCompleting = completing === ex.id;
                                const repsStr =
                                  ex.sets && (ex.reps_min ?? ex.reps_max)
                                    ? `${ex.sets} × ${ex.reps_min ?? "?"}${ex.reps_max && ex.reps_max !== ex.reps_min ? `–${ex.reps_max}` : ""} reps`
                                    : ex.duration_seconds
                                    ? `${ex.duration_seconds}s`
                                    : null;

                                return (
                                  <div
                                    key={ex.id}
                                    className={`rounded-xl border p-3 transition-all ${
                                      isDone
                                        ? "border-emerald-500/25 bg-emerald-500/5"
                                        : "border-zinc-800/60 bg-zinc-950/40"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-[11px] font-bold ${isDone ? "text-emerald-300 line-through opacity-70" : "text-white"}`}>
                                          {ex.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                          {repsStr && (
                                            <span className="text-[10px] text-zinc-400 font-mono">{repsStr}</span>
                                          )}
                                          {ex.intensity && intensityBadge(ex.intensity)}
                                        </div>
                                        {ex.notes && (
                                          <p className="text-[10px] text-zinc-500 italic mt-1">{ex.notes}</p>
                                        )}
                                      </div>

                                      {/* Mark done button */}
                                      <motion.button
                                        whileTap={{ scale: 0.88 }}
                                        disabled={isDone || Boolean(isCompleting)}
                                        onClick={() => { void markDone(ex.id); }}
                                        data-testid={`mark-done-${ex.id}`}
                                        className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
                                          isDone
                                            ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-400"
                                            : "border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-emerald-500/40 hover:text-emerald-400"
                                        }`}
                                      >
                                        {isCompleting ? (
                                          <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                          <CheckCircle2 size={14} />
                                        )}
                                      </motion.button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
