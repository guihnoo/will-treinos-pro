"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, Users, CheckCircle2, Flame, CalendarCheck, Trophy, Loader2, X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";
import { wtLsGetString, wtLsSetString } from "@/lib/willLocalStorage";
import type { Lesson } from "@/context/types";

type ChallengeType = "checkins" | "xp" | "classes" | "streak";

interface WeeklyChallenge {
  id: string;
  week_start: string;
  title: string;
  description: string | null;
  challenge_type: ChallengeType;
  target_value: number;
  xp_bonus: number;
}

interface Props {
  lessons: Lesson[];
  studentId: string;       // CRM student id (also used in xp_log.student_id via auth.uid())
  authUserId: string;      // auth.users.id for API calls
  totalXP: number;
  onConfetti?: () => void;
}

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  mon.setHours(0, 0, 0, 0);
  return mon.toISOString().slice(0, 10);
}

function getSunday(weekStart: string): string {
  const d = new Date(`${weekStart}T00:00:00`);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

const TYPE_ICON: Record<ChallengeType, React.ElementType> = {
  checkins: CalendarCheck,
  xp:       Zap,
  classes:  Trophy,
  streak:   Flame,
};

const DISMISS_KEY = (week: string) => `wt_weekly_challenge_dismissed_${week}`;
const BONUS_KEY   = (week: string, sid: string) => `wt_weekly_challenge_bonus_${week}_${sid}`;

export default function WeeklyChallengeCard({ lessons, studentId, authUserId, totalXP, onConfetti }: Props) {
  const { toast } = useToast();

  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
  const [classProgress, setClassProgress] = useState<{ totalStudents: number; completedStudents: number } | null>(null);
  const [myProgress, setMyProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);

  const weekStart = getMonday();

  const computeMyProgress = useCallback((ch: WeeklyChallenge) => {
    const weekEnd = getSunday(ch.week_start);

    if (ch.challenge_type === "xp") {
      // totalXP prop is cumulative — approximate weekly XP via xp_log fetched separately
      return totalXP; // fallback; will be overwritten by Supabase fetch below
    }

    if (ch.challenge_type === "checkins" || ch.challenge_type === "classes") {
      return lessons.filter((l) => {
        if (l.status !== "completed") return false;
        if (l.date < ch.week_start || l.date > weekEnd) return false;
        return (l.presentStudents ?? []).includes(studentId);
      }).length;
    }

    if (ch.challenge_type === "streak") {
      const days = new Set(
        lessons
          .filter((l) => l.status === "completed" && l.date >= ch.week_start && l.date <= weekEnd && (l.presentStudents ?? []).includes(studentId))
          .map((l) => l.date)
      );
      return days.size;
    }

    return 0;
  }, [lessons, studentId, totalXP]);

  useEffect(() => {
    if (wtLsGetString(DISMISS_KEY(weekStart), "") === "1") {
      setDismissed(true);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const sb = getSupabaseClient();
        if (!sb) { setLoading(false); return; }

        const { data: { session } } = await sb.auth.getSession();
        if (!session?.access_token) { setLoading(false); return; }

        const res = await fetch(`/api/coach/weekly-challenge?week=${weekStart}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) { setLoading(false); return; }

        const json: {
          challenge: WeeklyChallenge | null;
          progress: { totalStudents: number; completedStudents: number } | null;
        } = await res.json();

        if (!json.challenge) { setLoading(false); return; }

        setChallenge(json.challenge);
        setClassProgress(json.progress);

        // Compute my progress (non-XP types from lessons context)
        let progress = computeMyProgress(json.challenge);

        // For XP type, fetch actual weekly XP from xp_log
        if (json.challenge.challenge_type === "xp") {
          const weekEnd = getSunday(json.challenge.week_start);
          const { data: xpRows } = await sb
            .from("xp_log")
            .select("total_xp")
            .eq("student_id", studentId)
            .gte("created_at", `${json.challenge.week_start}T00:00:00`)
            .lte("created_at", `${weekEnd}T23:59:59`);

          progress = (xpRows ?? []).reduce((s: number, r: { total_xp: number }) => s + (r.total_xp ?? 0), 0);
        }

        setMyProgress(progress);

        // Check if bonus already claimed this session
        const bonusKey = BONUS_KEY(weekStart, authUserId);
        if (wtLsGetString(bonusKey, "") === "1") setBonusClaimed(true);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [weekStart, computeMyProgress, authUserId]);

  async function handleClaimBonus() {
    if (!challenge || claimingBonus || bonusClaimed) return;
    setClaimingBonus(true);
    try {
      const sb = getSupabaseClient();
      if (!sb) return;

      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) return;

      const bonusRes = await fetch("/api/xp/integration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: "achievement_unlock",
          studentId: authUserId,
          xpEarned: challenge.xp_bonus,
          description: `Desafio da semana: ${challenge.title}`,
        }),
      });
      if (!bonusRes.ok) throw new Error("xp_failed");
      wtLsSetString(BONUS_KEY(weekStart, authUserId), "1");
      setBonusClaimed(true);
      toast(`+${challenge.xp_bonus} XP bônus desbloqueado! 🏆`);
      onConfetti?.();
    } catch {
      toast("Erro ao registrar bônus.", "error");
    } finally {
      setClaimingBonus(false);
    }
  }

  if (loading) return null;
  if (dismissed || !challenge) return null;

  const progressPct = Math.min(100, (myProgress / challenge.target_value) * 100);
  const isComplete = myProgress >= challenge.target_value;
  const TypeIcon = TYPE_ICON[challenge.challenge_type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="relative rounded-3xl border border-violet-500/40 overflow-hidden mb-4"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 60%, transparent 100%)",
          boxShadow: "0 0 40px rgba(139,92,246,0.10), inset 0 1px 0 rgba(139,92,246,0.18)",
        }}
      >
        {/* Dismiss */}
        <button
          data-testid="weekly-challenge-dismiss"
          onClick={() => {
            wtLsSetString(DISMISS_KEY(weekStart), "1");
            setDismissed(true);
          }}
          className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors z-10"
          aria-label="Fechar desafio"
        >
          <X size={14} />
        </button>

        <div className="px-4 py-4 pr-10 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={{ rotate: [0, 6, -6, 6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-500/45 bg-violet-500/15 flex-shrink-0"
            >
              <TypeIcon size={18} className="text-violet-300" />
            </motion.div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.20em] text-violet-400/80">Desafio da Semana</p>
              <p className="text-sm font-black text-white leading-tight">{challenge.title}</p>
            </div>
          </div>

          {/* Description */}
          {challenge.description && (
            <p className="text-[11px] text-zinc-400 leading-relaxed">{challenge.description}</p>
          )}

          {/* My progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-zinc-500">Meu progresso</span>
              <span className="text-[10px] font-black text-violet-300">
                {myProgress}/{challenge.target_value} {challenge.challenge_type}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-zinc-800/70 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className={`h-full rounded-full ${isComplete ? "bg-emerald-500" : "bg-violet-500"}`}
              />
            </div>
            {isComplete && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[9px] font-black text-emerald-400 mt-1 flex items-center gap-1"
              >
                <CheckCircle2 size={10} />
                Meta atingida!
              </motion.p>
            )}
          </div>

          {/* Class progress chip */}
          {classProgress && (
            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500">
              <Users size={10} />
              <span>Turma: {classProgress.completedStudents}/{classProgress.totalStudents} completaram</span>
            </div>
          )}

          {/* XP Bonus row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/12 px-2.5 py-1">
              <Zap size={11} className="text-amber-400" />
              <span className="text-[10px] font-black text-amber-300">+{challenge.xp_bonus} XP bônus ao completar</span>
            </div>

            {isComplete && !bonusClaimed && (
              <motion.button
                data-testid="weekly-challenge-claim"
                whileTap={{ scale: 0.94 }}
                onClick={handleClaimBonus}
                disabled={claimingBonus}
                className="flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-3 py-1.5 text-[10px] font-black text-emerald-200 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
              >
                {claimingBonus ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Zap size={10} />
                )}
                Resgatar
              </motion.button>
            )}

            {bonusClaimed && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <CheckCircle2 size={11} />
                Bônus resgatado
              </span>
            )}
          </div>
        </div>

        {/* Shimmer line */}
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 h-0.5 w-1/3 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"
        />
      </motion.div>
    </AnimatePresence>
  );
}
