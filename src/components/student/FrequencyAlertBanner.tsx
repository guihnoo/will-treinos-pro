"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Zap } from "lucide-react";
import type { Lesson } from "@/context/types";

interface Props {
  lessons: Lesson[];
  studentId: string;
  targetFrequency: number; // lessons per week from profile
  onCheckIn?: () => void;
}

function getWeekStart(d: Date): string {
  const day = d.getDay() || 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - day + 1);
  return mon.toISOString().slice(0, 10);
}

export default function FrequencyAlertBanner({ lessons, studentId, targetFrequency, onCheckIn }: Props) {
  const analysis = useMemo(() => {
    if (!studentId || targetFrequency < 1) return null;

    const now   = new Date();
    const weeks: Record<string, { completed: number; scheduled: number }> = {};

    // Last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      weeks[getWeekStart(d)] = { completed: 0, scheduled: 0 };
    }

    const currentWeek = getWeekStart(now);

    for (const lesson of lessons) {
      if (!lesson.enrolledStudents.includes(studentId)) continue;
      const wk = getWeekStart(new Date(`${lesson.date}T00:00:00`));
      if (!(wk in weeks)) continue;

      if (lesson.status === "completed" && lesson.presentStudents.includes(studentId)) {
        weeks[wk].completed++;
      } else if (lesson.status === "scheduled" && wk === currentWeek) {
        weeks[wk].scheduled++;
      }
    }

    const weekEntries = Object.entries(weeks);
    const pastWeeks   = weekEntries.slice(0, 3); // exclude current
    const avgCompleted = pastWeeks.reduce((s, [, v]) => s + v.completed, 0) / Math.max(pastWeeks.length, 1);
    const currentCompleted = weeks[currentWeek]?.completed ?? 0;
    const currentScheduled = weeks[currentWeek]?.scheduled ?? 0;
    const projectedTotal   = currentCompleted + currentScheduled;

    const belowTarget  = avgCompleted < targetFrequency * 0.7; // < 70% of target
    const atRisk       = projectedTotal < targetFrequency && currentCompleted < targetFrequency;
    const onTrack      = projectedTotal >= targetFrequency;
    const exceeding    = avgCompleted > targetFrequency;

    return { avgCompleted, currentCompleted, currentScheduled, projectedTotal, belowTarget, atRisk, onTrack, exceeding, targetFrequency };
  }, [lessons, studentId, targetFrequency]);

  if (!analysis) return null;

  // Only show alert or praise — don't show if everything is fine and no special message
  const { belowTarget, exceeding, atRisk, onTrack, avgCompleted, currentCompleted, currentScheduled, targetFrequency: target } = analysis;

  if (!belowTarget && !exceeding) return null; // no banner when normal

  if (exceeding) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3"
      >
        <TrendingUp size={18} className="text-emerald-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white">Frequência acima da meta!</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Média de {avgCompleted.toFixed(1)} aulas/semana · meta é {target}x. Continue assim!
          </p>
        </div>
        <Zap size={14} className="text-emerald-400 flex-shrink-0" />
      </motion.div>
    );
  }

  // belowTarget
  return (
    <motion.button
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onCheckIn}
      className="w-full flex items-center gap-3 rounded-2xl border border-orange-500/25 bg-orange-500/8 px-4 py-3 text-left hover:bg-orange-500/12 transition-all"
    >
      <TrendingDown size={18} className="text-orange-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-white">Frequência abaixo da meta</p>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Você está fazendo {avgCompleted.toFixed(1)} aulas/semana · meta é {target}x.
          {currentScheduled > 0 ? ` Você tem ${currentScheduled} aula${currentScheduled !== 1 ? "s" : ""} esta semana.` : " Nenhuma aula esta semana."}
        </p>
      </div>
      <span className="text-[10px] font-black text-orange-400 flex-shrink-0">Ver aulas →</span>
    </motion.button>
  );
}
