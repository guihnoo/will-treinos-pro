"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, Flame, Target, TrendingUp, TrendingDown, X, Zap } from "lucide-react";
import type { Lesson } from "@/context/types";
import { localDateISO } from "@/lib/dateUtils";
import { wtLsGetString, wtLsSetString } from "@/lib/willLocalStorage";

interface Props {
  lessons: Lesson[];
  studentId: string;
  totalXP: number;
  streak: number;
  getCategoryName: (id: string) => string;
}

function getWeekRange(): { start: string; end: string; label: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now); mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  return {
    start: mon.toISOString().slice(0, 10),
    end:   sun.toISOString().slice(0, 10),
    label: `${fmt(mon)} – ${fmt(sun)}`,
  };
}

// Only show Friday (5) and Saturday (6) — the "fresh" days for weekly summary
function isWeeklySummaryDay(): boolean {
  const day = new Date().getDay();
  return day === 5 || day === 6;
}

const DISMISS_KEY = (week: string) => `wt_weekly_summary_dismissed_${week}`;

export default function WeeklySummaryBanner({ lessons, studentId, totalXP, streak, getCategoryName }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  const week = useMemo(() => getWeekRange(), []);

  useEffect(() => {
    if (!isWeeklySummaryDay()) return;
    if (wtLsGetString(DISMISS_KEY(week.start), "") === "1") {
      setDismissed(true);
      return;
    }
    // Small delay so banner doesn't flash on first render
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, [week.start]);

  const stats = useMemo(() => {
    const today = localDateISO();
    const myLessons = lessons.filter((l) => l.enrolledStudents.includes(studentId));
    const classesThisWeek = myLessons.filter(
      (l) =>
        l.status === "completed" &&
        l.date >= week.start &&
        l.date <= week.end &&
        l.presentStudents.includes(studentId)
    ).length;

    const scheduledThisWeek = myLessons.filter(
      (l) => l.status === "scheduled" && l.date >= today && l.date <= week.end
    ).length;

    // Most frequent category this week
    const catCounts = new Map<string, number>();
    myLessons
      .filter((l) => l.date >= week.start && l.date <= week.end)
      .forEach((l) => catCounts.set(l.categoryId, (catCounts.get(l.categoryId) ?? 0) + 1));
    const topCat = [...catCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const topCatName = topCat ? getCategoryName(topCat[0]) : null;

    return { classesThisWeek, scheduledThisWeek, topCatName };
  }, [lessons, studentId, week, getCategoryName]);

  function dismiss() {
    wtLsSetString(DISMISS_KEY(week.start), "1");
    setDismissed(true);
  }

  if (dismissed || !show) return null;

  const hasActivity = stats.classesThisWeek > 0 || totalXP > 0;

  const motivations = [
    "Cada treino é um tijolo na fundação do campeão.",
    "A consistência supera o talento quando o talento não é consistente.",
    "Não é o que você faz às vezes, mas o que faz sempre.",
    "Disciplina é a ponte entre metas e conquistas.",
    "O corpo alcança o que a mente acredita.",
  ];
  const motivation = motivations[Math.floor(((new Date()).getDate()) % motivations.length)];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative rounded-3xl border border-[#EAB308]/40 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(234,179,8,0.10) 0%, rgba(234,179,8,0.03) 50%, rgba(0,0,0,0) 100%)",
          boxShadow: "0 0 30px rgba(234,179,8,0.08), inset 0 1px 0 rgba(234,179,8,0.15)",
        }}
      >
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-[#EAB308]/10 to-transparent"
        />

        <button
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors z-10"
        >
          <X size={13} />
        </button>

        <div className="px-4 py-4 pr-10">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EAB308]/30 bg-[#EAB308]/10 flex-shrink-0">
              <BarChart2 size={16} className="text-[#EAB308]" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#EAB308]/60">Resumo da Semana</p>
              <p className="text-xs font-bold text-zinc-400">{week.label}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Zap size={10} className="text-[#EAB308]" />
              </div>
              <p className="text-sm font-black text-[#EAB308]">{totalXP.toLocaleString("pt-BR")}</p>
              <p className="text-[9px] text-zinc-600">XP total</p>
            </div>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Target size={10} className="text-emerald-400" />
              </div>
              <p className="text-sm font-black text-emerald-400">{stats.classesThisWeek}</p>
              <p className="text-[9px] text-zinc-600">Treinos</p>
            </div>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Flame size={10} className="text-orange-400" />
              </div>
              <p className="text-sm font-black text-orange-400">{streak}</p>
              <p className="text-[9px] text-zinc-600">Sequência</p>
            </div>
          </div>

          {/* Category + remaining classes */}
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            {stats.topCatName && (
              <span className="rounded-full border border-zinc-700/60 bg-zinc-900/60 px-2.5 py-1 text-[10px] font-bold text-zinc-300">
                📌 {stats.topCatName}
              </span>
            )}
            {stats.scheduledThisWeek > 0 && (
              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-300">
                {stats.scheduledThisWeek} aula{stats.scheduledThisWeek > 1 ? "s" : ""} ainda esta semana
              </span>
            )}
            {!hasActivity && (
              <span className="rounded-full border border-zinc-700/40 bg-zinc-900/40 px-2.5 py-1 text-[10px] text-zinc-500">
                Nenhum treino registrado
              </span>
            )}
          </div>

          {/* Motivation */}
          <p className="text-[11px] text-zinc-500 italic leading-relaxed">
            "{motivation}"
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
