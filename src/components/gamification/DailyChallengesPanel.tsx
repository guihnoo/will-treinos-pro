"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  Circle,
  Flame,
  Loader2,
  Lock,
  RefreshCw,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { DailyChallenge, DailyChallengesResult } from "@/app/api/ai/daily-challenges/route";

// ─── Persistence helpers (localStorage, keyed by date + studentId) ────────────

const STORAGE_KEY = (studentId: string, dateKey: string) =>
  `wt_daily_${studentId}_${dateKey}`;

function loadCompletions(studentId: string, dateKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(studentId, dateKey));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveCompletions(studentId: string, dateKey: string, ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY(studentId, dateKey), JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

function loadCachedResult(studentId: string, dateKey: string): DailyChallengesResult | null {
  try {
    const raw = localStorage.getItem(`wt_daily_result_${studentId}_${dateKey}`);
    if (!raw) return null;
    return JSON.parse(raw) as DailyChallengesResult;
  } catch {
    return null;
  }
}

function saveCachedResult(studentId: string, result: DailyChallengesResult) {
  try {
    localStorage.setItem(
      `wt_daily_result_${studentId}_${result.dateKey}`,
      JSON.stringify(result)
    );
  } catch { /* ignore */ }
}

// ─── XP award (fire-and-forget) ───────────────────────────────────────────────

async function awardChallengeXP(studentId: string, challenge: DailyChallenge, token: string) {
  try {
    await fetch("/api/xp/integration", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({
        studentId,
        points: challenge.xpReward,
        type: "achievement_unlock",
        multiplierType: challenge.fundamental || "posicionamento",
        description: `Desafio diário: ${challenge.title}`,
        relatedId: challenge.id,
      }),
    });
  } catch { /* fire-and-forget — don't block UI */ }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TYPE_STYLES = {
  training:    { bg: "bg-amber-500/12",   border: "border-amber-500/25",   badge: "bg-amber-500/20 text-amber-300",    label: "Treino" },
  social:      { bg: "bg-blue-500/12",    border: "border-blue-500/25",    badge: "bg-blue-500/20 text-blue-300",      label: "Social" },
  checkin:     { bg: "bg-emerald-500/12", border: "border-emerald-500/25", badge: "bg-emerald-500/20 text-emerald-300", label: "Check-in" },
  consistency: { bg: "bg-violet-500/12",  border: "border-violet-500/25",  badge: "bg-violet-500/20 text-violet-300",  label: "Consistência" },
};

function ChallengeCard({
  challenge,
  completed,
  locked,
  idx,
  onComplete,
}: {
  challenge: DailyChallenge;
  completed: boolean;
  locked: boolean;
  idx: number;
  onComplete: () => void;
}) {
  const style = TYPE_STYLES[challenge.type] ?? TYPE_STYLES.training;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.1, type: "spring", stiffness: 300, damping: 28 }}
      className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
        completed
          ? "border-emerald-500/30 bg-emerald-500/[0.07]"
          : locked
          ? "border-white/[0.05] bg-white/[0.02] opacity-50"
          : `${style.border} ${style.bg}`
      }`}
    >
      {/* Completed shimmer */}
      {completed && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xl">
          {completed ? "✅" : locked ? "🔒" : challenge.icon}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <p className={`text-[12px] font-black leading-tight ${completed ? "text-zinc-400 line-through" : "text-white"}`}>
              {challenge.title}
            </p>
            <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${style.badge}`}>
              {style.label}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-snug mb-2.5">{challenge.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-[#EAB308]" />
              <span className="text-[11px] font-black text-[#EAB308]">+{challenge.xpReward} XP</span>
            </div>

            {completed ? (
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-[10px] font-bold">Concluído!</span>
              </div>
            ) : locked ? (
              <div className="flex items-center gap-1 text-zinc-600">
                <Lock className="h-3.5 w-3.5" />
                <span className="text-[10px]">Complete o anterior</span>
              </div>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={onComplete}
                className="flex items-center gap-1.5 rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10 px-3 py-1.5 text-[10px] font-black text-amber-200 transition-all hover:border-[#EAB308]/60 hover:bg-[#EAB308]/15"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Concluir
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function DailyChallengesPanel({
  studentId,
  onClose,
}: {
  studentId: string;
  onClose: () => void;
}) {
  const [result, setResult] = useState<DailyChallengesResult | null>(null);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  const getToken = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) return "";
    const { data: { session } } = await sb.auth.getSession();
    return session?.access_token ?? "";
  }, []);

  const loadChallenges = useCallback(async (force = false) => {
    // Try cache first (same day)
    if (!force) {
      const cached = loadCachedResult(studentId, todayKey);
      if (cached) {
        setResult(cached);
        setCompletions(loadCompletions(studentId, todayKey));
        setLoading(false);
        return;
      }
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    try {
      const token = await getToken();
      const res = await fetch("/api/ai/daily-challenges", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("api_error");
      const data = await res.json() as DailyChallengesResult;
      setResult(data);
      saveCachedResult(studentId, data);
      setCompletions(loadCompletions(studentId, todayKey));
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      // Show fallback silently
    } finally {
      setLoading(false);
    }
  }, [studentId, todayKey, getToken]);

  useEffect(() => {
    void loadChallenges();
    return () => abortRef.current?.abort();
  }, [loadChallenges]);

  const handleComplete = useCallback(async (challenge: DailyChallenge) => {
    if (completions.has(challenge.id) || completing) return;

    setCompleting(challenge.id);

    // Optimistic UI
    const next = new Set(completions);
    next.add(challenge.id);
    setCompletions(next);
    saveCompletions(studentId, todayKey, next);

    // Award XP (fire-and-forget)
    const token = await getToken();
    void awardChallengeXP(studentId, challenge, token);

    setCompleting(null);
  }, [completions, completing, studentId, todayKey, getToken]);

  const totalXPEarned = result
    ? result.challenges
        .filter((c) => completions.has(c.id))
        .reduce((s, c) => s + c.xpReward, 0)
    : 0;
  const allDone = result ? result.challenges.every((c) => completions.has(c.id)) : false;
  const completedCount = result ? result.challenges.filter((c) => completions.has(c.id)).length : 0;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md overflow-hidden rounded-t-3xl border border-white/[0.08] bg-[#050505]/97 shadow-2xl sm:rounded-3xl"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "92dvh" }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-12 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
              <Sparkles className="h-4.5 w-4.5 text-violet-400" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-400">Desafios do Dia</p>
              <p className="text-[10px] capitalize text-zinc-500">{todayLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => loadChallenges(true)}
              disabled={loading}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-white disabled:opacity-40"
              aria-label="Regenerar desafios"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 pb-6" style={{ maxHeight: "calc(92dvh - 80px)" }}>
          {/* Progress bar */}
          {result && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => {
                    const done = i < completedCount;
                    return (
                      <motion.div
                        key={i}
                        animate={{ scale: done ? [1, 1.3, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {done
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          : <Circle className="h-4 w-4 text-zinc-700" />
                        }
                      </motion.div>
                    );
                  })}
                  <span className="text-[10px] text-zinc-500 ml-1">{completedCount}/3 concluídos</span>
                </div>
                {totalXPEarned > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1"
                  >
                    <Zap className="h-3.5 w-3.5 text-[#EAB308]" />
                    <span className="text-[12px] font-black text-[#EAB308]">+{totalXPEarned} XP</span>
                  </motion.div>
                )}
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-[#EAB308]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / 3) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 py-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                <p className="text-[12px] text-zinc-500">Personalizando seus desafios…</p>
              </div>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          )}

          {/* Coach message */}
          {!loading && result?.coachMessage && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Bot className="h-3 w-3 text-violet-400" />
                <p className="text-[9px] font-black uppercase tracking-widest text-violet-400">Coach IA</p>
              </div>
              <p className="text-[12px] text-zinc-300 italic leading-snug">"{result.coachMessage}"</p>
            </motion.div>
          )}

          {/* Challenges */}
          {!loading && result && (
            <div className="space-y-3">
              {result.challenges.map((challenge, idx) => {
                const completed = completions.has(challenge.id);
                // Lock: only allow completing in order
                const locked = !completed && idx > 0 && !completions.has(result.challenges[idx - 1]?.id ?? "");
                return (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    completed={completed}
                    locked={locked}
                    idx={idx}
                    onComplete={() => handleComplete(challenge)}
                  />
                );
              })}
            </div>
          )}

          {/* All done celebration */}
          <AnimatePresence>
            {allDone && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-2xl border border-[#EAB308]/30 bg-[#EAB308]/[0.08] px-4 py-5 text-center"
              >
                <motion.div
                  animate={{ rotate: [0, -8, 8, -8, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-3xl mb-2"
                >
                  🏆
                </motion.div>
                <p className="text-[13px] font-black text-[#EAB308]">Todos os desafios concluídos!</p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Você ganhou <span className="font-black text-[#EAB308]">{totalXPEarned} XP</span> hoje.
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  <p className="text-[10px] text-zinc-500">Novos desafios amanhã</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer note */}
          {!loading && (
            <p className="mt-5 text-center text-[9px] text-zinc-700">
              Desafios gerados com base nos seus fundamentos · renovam à meia-noite
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
