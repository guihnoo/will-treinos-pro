"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, CheckSquare, Square, Clock, ChevronDown, ChevronUp,
  X, Play, RotateCcw, Trophy, Target, Info, PhoneCall,
  CheckCircle2, TrendingUp, Timer
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import AppPageHeader from "@/components/ui/AppPageHeader";
import AppSectionCard from "@/components/ui/AppSectionCard";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";

// ─── Rest Timer Component ────────────────────────────────────────────────────
function parseSets(sets: string): number {
  const parsed = Number.parseInt(sets, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}

const planListVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const planItemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 380, damping: 30 },
  },
};

const exerciseListVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.045, delayChildren: 0.04 },
  },
};

const exerciseItemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

function RestTimerBanner({
  seconds,
  totalSeconds,
  onDismiss,
}: {
  seconds: number;
  totalSeconds: number;
  onDismiss: () => void;
}) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const pct = Math.max(0, Math.min(100, 100 - (seconds / Math.max(totalSeconds, 1)) * 100));
  return (
    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
      className="mb-4 p-4 bg-[#EAB308]/10 border border-[#EAB308]/30 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-[#EAB308]" />
          <p className="text-sm font-bold text-white">Descansando...</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-3xl font-bold text-[#EAB308] font-mono tabular-nums">
            {String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}
          </p>
          <button
            onClick={onDismiss}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center text-zinc-600 hover:text-zinc-400 ${FOCUS_RING_GOLD}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
        <motion.div animate={{ width: `${pct}%` }} className="h-full bg-[#EAB308] rounded-full" />
      </div>
    </motion.div>
  );
}

// ─── Exercise Detail Modal ───────────────────────────────────────────────────
interface Exercise { name: string; sets: string; reps: string; rest?: string; notes: string; }
function ExerciseModal({
  ex, planId, exIdx, done, onToggleSet, onClose
}: {
  ex: Exercise; planId: string; exIdx: number;
  done: Record<string, boolean>;
  onToggleSet: (key: string, restSec: number, planId: string) => void;
  onClose: () => void;
}) {
  const ctaClass = `${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD}`;
  const sets = parseSets(ex.sets);
  const restSec = ex.rest ? parseInt(ex.rest) * (ex.rest.includes("min") ? 60 : 1) : 60;
  const completedSets = Array.from({ length: sets }, (_, i) => done[`${planId}_${exIdx}_${i}`] ? 1 : 0).reduce((a,b) => a+b, 0);
  useBodyScrollLock(true);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      data-modal-overlay
      aria-label={`Exercício: ${ex.name}`}
      className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex flex-col justify-end"
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl mx-auto bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl p-4 sm:p-6 max-h-[90dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />

        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-black bg-[#EAB308] px-2 py-0.5 rounded-md uppercase">Exercício</span>
              {completedSets === sets && sets > 0 && (
                <span className="text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-md">✓ Concluído</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">{ex.name}</h2>
          </div>
          <button onClick={onClose} className={`p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 ${ctaClass}`}><X className="w-5 h-5"/></button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {[
            { label: "Séries", value: ex.sets, icon: Dumbbell, color: "#EAB308" },
            { label: "Reps/Tempo", value: ex.reps, icon: Target, color: "#22C55E" },
            { label: "Descanso", value: ex.rest || "60s", icon: Clock, color: "#8B5CF6" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 text-center ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
                <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: s.color }}/>
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{s.label}</p>
              </div>
            );
          })}
        </div>

        {ex.notes && (
          <div className="mb-5 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex gap-2">
            <Info className="w-4 h-4 text-[#EAB308] flex-shrink-0 mt-0.5"/>
            <p className="text-sm text-zinc-400">{ex.notes}</p>
          </div>
        )}

        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
          Marque cada série completada
        </p>
        <div className="space-y-2 mb-5">
          {Array.from({ length: sets }, (_, i) => {
            const key = `${planId}_${exIdx}_${i}`;
            const isDone = !!done[key];
            return (
              <motion.button key={i} whileTap={{ scale: 0.97 }}
                onClick={() => onToggleSet(key, restSec, planId)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                  isDone
                    ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
                    : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                } ${ctaClass}`}>
                {isDone
                  ? <CheckSquare className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
                  : <Square className="w-5 h-5 flex-shrink-0" />}
                <span className="font-bold text-sm flex-1 text-left">Série {i + 1}</span>
                <span className="text-xs">{isDone ? "✓ Feita" : `${ex.reps}`}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
            <motion.div animate={{ width: sets > 0 ? `${(completedSets/sets)*100}%` : "0%" }}
              className="h-full bg-[#22C55E] rounded-full" transition={{ duration: 0.4 }}/>
          </div>
          <span className="text-xs font-bold text-zinc-400">{completedSets}/{sets}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function TreinosPage() {
  const { user, trainingPlans, usingSupabaseSession, criticalDataLoading, criticalDataError, retryCriticalDataSync } = useApp();
  const { toast } = useToast();
  const storageHydrated = useRef(false);
  /** Stable while CRM user.id switches from JWT id to students.id after Supabase link */
  const treinosStorageUserKey = user?.authSubjectId ?? user?.id;

  const [done, setDone] = useState<Record<string, boolean>>({});
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [restTimer, setRestTimer] = useState<{
    seconds: number;
    totalSeconds: number;
    intervalId: ReturnType<typeof setInterval> | null;
  } | null>(null);
  const [exerciseModal, setExerciseModal] = useState<{ ex: Exercise; planId: string; exIdx: number } | null>(null);
  const ctaClass = `${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD}`;

  const myPlans = trainingPlans.filter(p => p.studentId === user?.id);
  const didAutoExpand = useRef(false);

  const totalSets = useMemo(
    () => myPlans.reduce((acc, plan) => acc + plan.exercises.reduce((sum, ex) => sum + parseSets(ex.sets), 0), 0),
    [myPlans]
  );
  const completedSets = useMemo(
    () => Object.values(done).filter(Boolean).length,
    [done]
  );
  const xp = completedSets * 12;
  const level = Math.floor(xp / 120) + 1;
  const levelStartXp = (level - 1) * 120;
  const nextLevelXp = level * 120;
  const levelProgressPct = Math.round(((xp - levelStartXp) / Math.max(nextLevelXp - levelStartXp, 1)) * 100);

  React.useEffect(() => {
    if (myPlans.length > 0 && !didAutoExpand.current) {
      setExpandedPlan(myPlans[0].id);
      didAutoExpand.current = true;
    }
  }, [myPlans]);

  useEffect(() => {
    if (!treinosStorageUserKey || typeof window === "undefined") return;
    const stored = window.localStorage.getItem(`wt_treinos_done_${treinosStorageUserKey}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        setDone(parsed);
      } catch {
        setDone({});
      }
    } else {
      setDone({});
    }
    storageHydrated.current = true;
  }, [treinosStorageUserKey]);

  useEffect(() => {
    if (!treinosStorageUserKey || typeof window === "undefined" || !storageHydrated.current) return;
    window.localStorage.setItem(`wt_treinos_done_${treinosStorageUserKey}`, JSON.stringify(done));
  }, [done, treinosStorageUserKey]);

  if (usingSupabaseSession && criticalDataLoading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto pb-28">
        <AppPageHeader title="Meus Treinos" subtitle="Sincronizando planos ao vivo..." icon={Dumbbell} />
        <div className="space-y-3">
          <SkeletonLoader className="h-24" lines={3} />
          <SkeletonLoader className="h-40" lines={5} />
          <SkeletonLoader className="h-40" lines={5} />
        </div>
      </div>
    );
  }

  if (usingSupabaseSession && criticalDataError) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto pb-28">
        <AppPageHeader
          title="Meus Treinos"
          subtitle="Falha de sincronização dos planos."
          icon={Dumbbell}
        />
        <AppSectionCard title="Erro de sincronização" subtitle="Não foi possível carregar seus treinos agora.">
          <p className="text-sm text-zinc-300">{criticalDataError}</p>
          <button
            type="button"
            onClick={() => void retryCriticalDataSync()}
            className={`mt-4 rounded-xl border border-red-300/35 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200 hover:bg-red-500/15 ${ctaClass}`}
          >
            Tentar sincronizar novamente
          </button>
        </AppSectionCard>
      </div>
    );
  }

  const planProgressFromState = (
    planId: string,
    exercises: Exercise[],
    doneState: Record<string, boolean>
  ) => {
    let total = 0, completed = 0;
    exercises.forEach((ex, ei) => {
      const sets = parseSets(ex.sets);
      total += sets;
      for (let s = 0; s < sets; s++) {
        if (doneState[`${planId}_${ei}_${s}`]) completed++;
      }
    });
    return { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const toggleSet = (key: string, restSec: number, planId: string) => {
    const next = !done[key];
    const nextDone = { ...done, [key]: next };
    setDone(nextDone);
    const activePlan = myPlans.find((p) => p.id === planId);
    if (activePlan) {
      const before = planProgressFromState(planId, activePlan.exercises, done);
      const after = planProgressFromState(planId, activePlan.exercises, nextDone);
      if (!next && before.completed > after.completed) {
        vibrate(16);
      }
      if (next) {
        vibrate([30, 20, 45]);
      }
      if (before.pct < 100 && after.pct === 100 && after.total > 0) {
        toast("🏆 Plano concluído! Você está em modo elite.");
        vibrate([70, 35, 110]);
      }
    }
    if (!next) {
      if (restTimer?.intervalId) clearInterval(restTimer.intervalId);
      setRestTimer(null);
      return;
    }
    if (next) {
      if (restTimer?.intervalId) clearInterval(restTimer.intervalId);
      let secs = restSec;
      const id = setInterval(() => {
        secs--;
        if (secs <= 0) {
          clearInterval(id);
          setRestTimer(null);
          toast("✅ Descanso concluído! Próxima série 💪");
        } else {
          setRestTimer({ seconds: secs, totalSeconds: restSec, intervalId: id });
        }
      }, 1000);
      setRestTimer({ seconds: secs, totalSeconds: restSec, intervalId: id });
      toast(`⏱ Descansando ${restSec}s`);
    }
  };

  const planProgress = (planId: string, exercises: Exercise[]) =>
    planProgressFromState(planId, exercises, done);

  const openWhatsApp = () =>
    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent("Oi Will! Ainda não tenho um plano de treino. Pode criar um pra mim?")}`, "_blank");

  return (
    <div className="w-full max-w-2xl mx-auto py-1 sm:py-2">
      <AppPageHeader
        title="Meus Treinos"
        subtitle="Planos personalizados pelo professor Will."
        icon={Dumbbell}
        className="mb-6"
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-5 rounded-2xl border border-[#EAB308]/20 bg-zinc-900/40 backdrop-blur-md p-4 shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <img
            src={
              user?.avatar?.startsWith("data:")
                ? user.avatar
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.avatar || user?.name || "Aluno"}`
            }
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-zinc-700 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-white truncate">Will Rank</p>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg text-black bg-[#EAB308] badge-pulse">
                Lv {level}
              </span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, levelProgressPct))}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#EAB308] to-[#FACC15]"
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] gap-2">
              <span className="text-zinc-500 font-bold">{xp} XP</span>
              <span className="text-zinc-600 truncate">
                {completedSets}/{totalSets || 0} séries
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {restTimer && (
          <RestTimerBanner
            seconds={restTimer.seconds}
            totalSeconds={restTimer.totalSeconds}
            onDismiss={() => { if (restTimer.intervalId) clearInterval(restTimer.intervalId); setRestTimer(null); }}
          />
        )}
      </AnimatePresence>

      {myPlans.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 border border-dashed border-zinc-800 rounded-3xl">
          <Dumbbell className="w-12 h-12 mx-auto text-zinc-700 mb-4" />
          <h3 className="text-lg font-bold text-zinc-400 mb-2">Nenhum plano ainda</h3>
          <p className="text-sm text-zinc-600 mb-6">Solicite seu plano de treino personalizado!</p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => { vibrate(20); openWhatsApp(); }}
            className={`inline-flex items-center gap-2 bg-[#22C55E] text-white px-6 py-3 rounded-2xl font-bold text-sm ${ctaClass}`}>
            <PhoneCall className="w-4 h-4" /> Solicitar via WhatsApp
          </motion.button>
        </motion.div>
      )}

      <motion.div variants={planListVariants} initial="hidden" animate="show">
      {myPlans.map((plan) => {
        const prog = planProgress(plan.id, plan.exercises);
        const isExpanded = expandedPlan === plan.id;
        const isComplete = prog.pct === 100 && prog.total > 0;

        return (
          <motion.div key={plan.id}
            variants={planItemVariants}
            className={`mb-4 bg-[#0A0A0A] border rounded-3xl overflow-hidden transition-all ${
              isComplete ? "border-[#22C55E]/40" : "border-zinc-800/60"
            }`}>

            <motion.button whileTap={{ scale: 0.99 }}
              onClick={() => {
                vibrate(isExpanded ? 12 : [10, 20, 10]);
                setExpandedPlan(isExpanded ? null : plan.id);
              }}
              className={`w-full min-h-11 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 text-left ${FOCUS_RING_GOLD}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                isComplete ? "bg-[#22C55E]/10" : "bg-[#EAB308]/10"
              }`}>
                {isComplete
                  ? <Trophy className="w-6 h-6 text-[#22C55E]"/>
                  : <Dumbbell className="w-6 h-6 text-[#EAB308]"/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                  <h3 className="font-bold text-white text-base truncate">{plan.title}</h3>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500 flex-shrink-0"/> : <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0"/>}
                </div>
                <p className="text-[10px] text-zinc-600 mb-2">
                  {plan.exercises.length} exercícios · Criado {new Date(plan.createdAt+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${prog.pct}%` }} transition={{ duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: isComplete ? "#22C55E" : prog.pct > 50 ? "#EAB308" : "#52525b" }}/>
                  </div>
                  <span className={`text-[10px] font-bold ${isComplete ? "text-[#22C55E]" : "text-zinc-500"}`}>
                    {prog.pct}%
                  </span>
                </div>
              </div>
            </motion.button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                  <motion.div
                    variants={exerciseListVariants}
                    initial="hidden"
                    animate="show"
                    className="px-4 pb-4 space-y-2 border-t border-zinc-800/60 pt-3"
                  >
                    {plan.exercises.map((ex, ei) => {
                      const sets = parseSets(ex.sets);
                      const completedSets = Array.from({ length: sets }, (_, i) => done[`${plan.id}_${ei}_${i}`] ? 1 : 0).reduce((a,b) => a+b, 0);
                      const exDone = completedSets === sets && sets > 0;

                      return (
                        <motion.button key={ei} variants={exerciseItemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                          onClick={() => setExerciseModal({ ex, planId: plan.id, exIdx: ei })}
                          className={`w-full relative overflow-hidden flex items-center gap-3 p-4 rounded-2xl border text-left transition-all backdrop-blur-md ${
                            exDone
                              ? "bg-[#22C55E]/8 border-[#22C55E]/30"
                              : "bg-zinc-900/40 border-zinc-700/60 hover:border-[#EAB308]/25"
                          } ${ctaClass}`}>
                          <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-[#EAB308]/60 to-transparent" />
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            exDone ? "bg-[#22C55E]/10" : "bg-[#EAB308]/10"
                          }`}>
                            {exDone
                              ? <CheckCircle2 className="w-5 h-5 text-[#22C55E]"/>
                              : <Play className="w-4 h-4 text-[#EAB308]"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${exDone ? "text-[#22C55E]" : "text-white"}`}>{ex.name}</p>
                            <div className="flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-zinc-500 truncate">{ex.sets} séries × {ex.reps}</span>
                              {ex.rest && <span className="text-[10px] text-zinc-600">⏱ {ex.rest} descanso</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {Array.from({ length: Math.min(sets, 5) }, (_, i) => (
                              <div key={i} className={`w-2 h-2 rounded-full ${
                                done[`${plan.id}_${ei}_${i}`] ? "bg-[#22C55E]" : "bg-zinc-800"
                              }`}/>
                            ))}
                          </div>
                        </motion.button>
                      );
                    })}

                    {isComplete && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-2xl text-center">
                        <p className="text-2xl mb-1">🏆</p>
                        <p className="text-sm font-bold text-[#22C55E]">Treino Concluído!</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Parabéns! Você completou todos os exercícios.</p>
                      </motion.div>
                    )}

                    {prog.completed > 0 && (
                      <motion.button whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          const keys = Object.keys(done).filter(k => k.startsWith(plan.id));
                          const next = { ...done };
                          keys.forEach(k => delete next[k]);
                          setDone(next);
                          toast("🔄 Treino resetado!");
                          vibrate([22, 22, 22]);
                        }}
                        className={`w-full min-h-11 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-800 text-zinc-500 text-sm hover:border-zinc-700 transition-colors ${ctaClass}`}>
                        <RotateCcw className="w-3.5 h-3.5"/> Reiniciar treino
                      </motion.button>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
      </motion.div>

      {myPlans.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Planos", value: myPlans.length, icon: Dumbbell, color: "#EAB308" },
            { label: "Exercícios", value: myPlans.reduce((a,p) => a + p.exercises.length, 0), icon: Target, color: "#8B5CF6" },
            { label: "Séries Feitas", value: Object.values(done).filter(Boolean).length, icon: TrendingUp, color: "#22C55E" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl p-3 text-center">
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }}/>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">{s.label}</p>
              </div>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {exerciseModal && (
          <ExerciseModal
            ex={exerciseModal.ex}
            planId={exerciseModal.planId}
            exIdx={exerciseModal.exIdx}
            done={done}
            onToggleSet={toggleSet}
            onClose={() => setExerciseModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
