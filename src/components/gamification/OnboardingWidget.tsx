"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Circle, Sparkles, Trophy, X, Zap } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mission = {
  id: string;
  icon: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
};

type CompletionSource = {
  hasCheckin: boolean;
  hasSocialLike: boolean;
  hasAvatar: boolean;
};

// ─── Persistence helpers ──────────────────────────────────────────────────────

const DISMISS_KEY = (sid: string) => `wt_onboarding_dismissed_${sid}`;
const TWIN_KEY = (sid: string) => `wt_twin_viewed_${sid}`;
const CHALLENGE_KEY_PREFIX = "wt_daily_result_";

function isDismissed(studentId: string): boolean {
  try { return !!localStorage.getItem(DISMISS_KEY(studentId)); } catch { return false; }
}

function dismiss(studentId: string) {
  try { localStorage.setItem(DISMISS_KEY(studentId), "1"); } catch { /* ignore */ }
}

function hasTwinViewed(studentId: string): boolean {
  try { return !!localStorage.getItem(TWIN_KEY(studentId)); } catch { return false; }
}

export function markTwinViewed(studentId: string) {
  try { localStorage.setItem(TWIN_KEY(studentId), "1"); } catch { /* ignore */ }
}

function hasDailyChallengeDone(studentId: string): boolean {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(`wt_daily_${studentId}_${today}`);
    if (!raw) return false;
    const completions: string[] = JSON.parse(raw);
    return completions.length > 0;
  } catch { return false; }
}

function hasCachedDailyResult(studentId: string): boolean {
  try {
    const today = new Date().toISOString().slice(0, 10);
    return !!localStorage.getItem(`${CHALLENGE_KEY_PREFIX}${studentId}_${today}`);
  } catch { return false; }
}

// ─── Sub-component: Mission row ───────────────────────────────────────────────

function MissionRow({
  mission,
  idx,
  onAction,
}: {
  mission: Mission;
  idx: number;
  onAction?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.06 }}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        mission.completed
          ? "bg-emerald-500/[0.06] border border-emerald-500/20"
          : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05]"
      }`}
    >
      <div className="text-lg shrink-0">{mission.icon}</div>
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-bold leading-tight ${mission.completed ? "text-zinc-500 line-through" : "text-white"}`}>
          {mission.title}
        </p>
        {!mission.completed && (
          <p className="text-[9px] text-zinc-600 mt-0.5">{mission.description}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        {mission.completed ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <>
            <div className="flex items-center gap-0.5">
              <Zap className="h-3 w-3 text-[#EAB308]" />
              <span className="text-[9px] font-black text-[#EAB308]">+{mission.xpReward}</span>
            </div>
            {onAction && (
              <button
                type="button"
                onClick={onAction}
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-white transition-colors"
                aria-label={`Ir para: ${mission.title}`}
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export default function OnboardingWidget({
  studentId,
  totalXP,
  hasAvatar,
  onOpenChallenges,
  onOpenTwin,
  onOpenFeed,
  onOpenProfile,
}: {
  studentId: string;
  totalXP: number;
  hasAvatar: boolean;
  onOpenChallenges?: () => void;
  onOpenTwin?: () => void;
  onOpenFeed?: () => void;
  onOpenProfile?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [source, setSource] = useState<CompletionSource>({ hasCheckin: false, hasSocialLike: false, hasAvatar });
  const [allDone, setAllDone] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const checkCompletion = useCallback(async () => {
    if (isDismissed(studentId)) return;

    // Only show onboarding to students who are genuinely new (< 400 XP)
    if (totalXP >= 400) {
      dismiss(studentId);
      return;
    }

    try {
      const sb = getSupabaseClient();
      if (!sb) {
        setVisible(true);
        return;
      }

      const { data: logs } = await sb
        .from("xp_log")
        .select("type")
        .eq("student_id", studentId)
        .in("type", ["checkin", "social_like"]);

      const types = new Set((logs ?? []).map((l: { type: string }) => l.type));
      setSource({
        hasCheckin: types.has("checkin"),
        hasSocialLike: types.has("social_like"),
        hasAvatar,
      });
    } catch { /* ignore — show widget anyway */ }

    setVisible(true);
  }, [studentId, totalXP, hasAvatar]);

  useEffect(() => { void checkCompletion(); }, [checkCompletion]);

  const missions: Mission[] = [
    {
      id: "avatar",
      icon: "📸",
      title: "Adicione uma foto de perfil",
      description: "Vá em Perfil e adicione sua foto real",
      xpReward: 25,
      completed: source.hasAvatar,
    },
    {
      id: "checkin",
      icon: "📍",
      title: "Faça seu primeiro check-in",
      description: "Confirme presença na sua próxima aula",
      xpReward: 50,
      completed: source.hasCheckin,
    },
    {
      id: "challenge",
      icon: "⚡",
      title: "Complete um desafio diário",
      description: "Abra os Desafios e conclua pelo menos 1",
      xpReward: 75,
      completed: hasDailyChallengeDone(studentId),
    },
    {
      id: "social",
      icon: "🤝",
      title: "Interaja no feed",
      description: "Curta ou comente em uma postagem",
      xpReward: 25,
      completed: source.hasSocialLike,
    },
    {
      id: "twin",
      icon: "🧬",
      title: "Explore seu Gêmeo Digital",
      description: "Veja seu perfil AI no bloco de conquistas",
      xpReward: 25,
      completed: hasTwinViewed(studentId),
    },
  ];

  const completedCount = missions.filter((m) => m.completed).length;
  const totalXPReward = missions.reduce((s, m) => s + m.xpReward, 0);
  const progress = (completedCount / missions.length) * 100;

  useEffect(() => {
    if (completedCount === missions.length && !allDone && visible) {
      setAllDone(true);
      setCelebrating(true);
      setTimeout(() => {
        dismiss(studentId);
        setVisible(false);
      }, 3500);
    }
  }, [completedCount, missions.length, allDone, visible, studentId]);

  const handleDismiss = () => {
    dismiss(studentId);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="rounded-2xl border border-[#EAB308]/20 bg-gradient-to-br from-[#EAB308]/[0.06] to-violet-500/[0.04] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
            <div className="flex items-center gap-2">
              <motion.div
                animate={celebrating ? { rotate: [0, -10, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="h-4 w-4 text-[#EAB308]" />
              </motion.div>
              <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#EAB308]">
                Boas-vindas ao Will Treinos
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors"
              aria-label="Fechar onboarding"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="px-4 pb-4 space-y-3">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {missions.map((m, i) => (
                    <motion.div
                      key={m.id}
                      animate={{ scale: m.completed ? [1, 1.3, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {m.completed
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        : <Circle className="h-3.5 w-3.5 text-zinc-700" />
                      }
                    </motion.div>
                  ))}
                  <span className="text-[9px] text-zinc-500 ml-1">{completedCount}/{missions.length} missões</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-[#EAB308]" />
                  <span className="text-[9px] font-black text-[#EAB308]">{totalXPReward} XP disponíveis</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#EAB308] to-violet-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Mission list */}
            <div className="space-y-1.5">
              {missions.map((m, i) => (
                <MissionRow
                  key={m.id}
                  mission={m}
                  idx={i}
                  onAction={
                    m.id === "challenge" ? onOpenChallenges
                    : m.id === "twin" ? onOpenTwin
                    : m.id === "social" ? onOpenFeed
                    : m.id === "avatar" ? onOpenProfile
                    : undefined
                  }
                />
              ))}
            </div>

            {/* Celebration */}
            <AnimatePresence>
              {celebrating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-[#EAB308]/30 bg-[#EAB308]/[0.08] px-4 py-3 text-center"
                >
                  <motion.div
                    animate={{ rotate: [0, -8, 8, -8, 0] }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-2xl mb-1.5"
                  >
                    🏆
                  </motion.div>
                  <p className="text-[12px] font-black text-[#EAB308]">Onboarding completo!</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Bem-vindo(a) ao Will Treinos PRO. Agora o jogo começa de verdade.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA hint */}
            {!celebrating && completedCount < missions.length && (
              <p className="text-[9px] text-zinc-700 text-center">
                Complete as missões para liberar todo o potencial do app · pode fechar a qualquer hora
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
