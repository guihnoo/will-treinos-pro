"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClipboardList, CheckCircle2, Star } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { LessonCategory } from "@/context/types";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";
import { MODAL_OVERLAY_FADE, SPRING_PREMIUM } from "@/components/ui/motionTokens";

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatLessonDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  const dayName = DAYS_PT[date.getDay()];
  const monthName = MONTHS_PT[date.getMonth()];
  return `${dayName}, ${String(d).padStart(2, "0")} ${monthName} ${y}`;
}

function scoreColor(s: number): string {
  return s >= 8 ? "#22C55E" : s >= 6 ? "#EAB308" : "#EF4444";
}

interface LessonEntry {
  lessonId: string;
  date: string;
  title: string;
  categoryName: string;
  categoryColor: string;
  categoryEmoji: string;
  type: string;
  avgScore: number | null;
  xpEarned: number;
}

interface Props {
  studentId: string;
  onClose: () => void;
  getCategory: (id: string) => LessonCategory | undefined;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.04, type: "spring" as const, stiffness: 280, damping: 22 },
  }),
};

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-1 h-14 rounded-full bg-zinc-700" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-zinc-700" />
          <div className="h-4 w-40 rounded bg-zinc-700" />
          <div className="h-3 w-20 rounded bg-zinc-700" />
        </div>
      </div>
    </div>
  );
}

export default function LessonHistoryPanel({ studentId, onClose, getCategory }: Props) {
  const [entries, setEntries] = useState<LessonEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb || !studentId) {
      setLoading(false);
      return;
    }

    async function load() {
      if (!sb) return;

      // 1. Fetch completed lessons where studentId is in present_students
      const { data: lessonsData } = await sb
        .from("lessons")
        .select("id, title, date, category_id, type, present_students")
        .eq("status", "completed")
        .contains("present_students", [studentId])
        .order("date", { ascending: false })
        .limit(50);

      if (!lessonsData || lessonsData.length === 0) {
        setLoading(false);
        return;
      }

      const lessonIds = lessonsData.map((l: Record<string, unknown>) => l.id as string);
      const lessonDates = lessonsData.map((l: Record<string, unknown>) => l.date as string);

      // 2. Fetch evaluations for this student
      const { data: evalsData } = await sb
        .from("evaluations")
        .select("lesson_id, avg_score")
        .eq("student_id", studentId)
        .in("lesson_id", lessonIds);

      const evalMap = new Map<string, number>();
      if (evalsData) {
        for (const ev of evalsData as Array<{ lesson_id: string; avg_score: number }>) {
          evalMap.set(ev.lesson_id, ev.avg_score);
        }
      }

      // 3. Fetch xp_log entries for this student on lesson dates
      const minDate = lessonDates[lessonDates.length - 1];
      const maxDate = lessonDates[0];
      const { data: xpData } = await sb
        .from("xp_log")
        .select("points, created_at, type")
        .eq("student_id", studentId)
        .in("type", ["evaluation", "checkin"])
        .gte("created_at", `${minDate}T00:00:00Z`)
        .lte("created_at", `${maxDate}T23:59:59Z`);

      // Group XP by date
      const xpByDate = new Map<string, number>();
      if (xpData) {
        for (const xp of xpData as Array<{ points: number; created_at: string; type: string }>) {
          const dateKey = xp.created_at.slice(0, 10);
          xpByDate.set(dateKey, (xpByDate.get(dateKey) ?? 0) + (xp.points ?? 0));
        }
      }

      const mapped: LessonEntry[] = lessonsData.map((l: Record<string, unknown>) => {
        const lid = l.id as string;
        const date = l.date as string;
        const cat = getCategory(l.category_id as string);
        return {
          lessonId: lid,
          date,
          title: (l.title as string) || "Aula",
          categoryName: cat?.name ?? "Geral",
          categoryColor: cat?.color ?? "#EAB308",
          categoryEmoji: cat?.emoji ?? "🏐",
          type: (l.type as string) ?? "",
          avgScore: evalMap.get(lid) ?? null,
          xpEarned: xpByDate.get(date) ?? 0,
        };
      });

      const sumXP = mapped.reduce((acc, e) => acc + e.xpEarned, 0);
      setTotalXP(sumXP);
      setEntries(mapped);
      setLoading(false);
    }

    void load();
  }, [studentId, getCategory]);

  return (
    <motion.div
      {...MODAL_OVERLAY_FADE}
      className={MODAL_FIXED_OVERLAY_SCROLL}
      style={{ zIndex: 300 }}
      onClick={onClose}
      data-modal-overlay
    >
      <div className={MODAL_OVERLAY_CENTER_WRAP} onClick={(e) => e.stopPropagation()}>
        <motion.div
          initial={{ y: 48, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 48, opacity: 0, scale: 0.97 }}
          transition={SPRING_PREMIUM}
          className={MODAL_PANEL_COLUMN + " max-w-lg border border-zinc-800/60 bg-zinc-950 rounded-3xl"}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between gap-3 border-b border-zinc-800/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
                <ClipboardList className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Histórico</p>
                <h3 className="text-base font-black text-white">Treinos Completados</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid="lesson-history-close"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700/60 bg-zinc-900/60 text-zinc-400 transition hover:text-white"
              aria-label="Fechar painel de histórico"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stats strip */}
          {!loading && entries.length > 0 && (
            <div className="shrink-0 flex items-center gap-4 border-b border-zinc-800/50 px-5 py-3">
              <div className="flex-1 text-center">
                <p className="text-xl font-black text-white">{entries.length}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">aulas completadas</p>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="flex-1 text-center">
                <p className="text-xl font-black text-amber-400">+{totalXP.toLocaleString("pt-BR")}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">XP total</p>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="flex-1 text-center">
                <p className="text-xl font-black text-emerald-400">
                  {entries.filter((e) => e.avgScore !== null).length}
                </p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">avaliadas</p>
              </div>
            </div>
          )}

          {/* Body */}
          <div className={MODAL_BODY_SCROLL + " px-4 py-4 space-y-2"}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : entries.length === 0 ? (
              <div className="py-12 text-center">
                <ClipboardList className="mx-auto h-12 w-12 text-zinc-700 mb-3" />
                <p className="text-sm font-bold text-zinc-400">Nenhum treino completado ainda</p>
                <p className="text-xs text-zinc-600 mt-1">As aulas com presença confirmada aparecerão aqui.</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {entries.map((entry, i) => (
                  <motion.div
                    key={entry.lessonId}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative flex items-start gap-3 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-4 hover:border-zinc-700/60 transition-colors"
                  >
                    {/* Gold stripe */}
                    <div
                      className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                      style={{ background: entry.categoryColor }}
                    />

                    <div className="ml-1 flex-1 min-w-0">
                      {/* Date */}
                      <p className="text-[10px] font-bold text-zinc-500 mb-0.5">{formatLessonDate(entry.date)}</p>

                      {/* Title */}
                      <p className="text-sm font-black text-white truncate">{entry.title}</p>

                      {/* Badges row */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {/* Category badge */}
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border"
                          style={{
                            borderColor: `${entry.categoryColor}40`,
                            background: `${entry.categoryColor}15`,
                            color: entry.categoryColor,
                          }}
                        >
                          {entry.categoryEmoji} {entry.categoryName}
                        </span>

                        {/* Lesson type chip */}
                        {entry.type ? (
                          <span className="rounded-full border border-zinc-700/50 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                            {entry.type}
                          </span>
                        ) : null}

                        {/* Evaluated or not */}
                        {entry.avgScore !== null ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black border"
                            style={{
                              borderColor: `${scoreColor(entry.avgScore)}35`,
                              background: `${scoreColor(entry.avgScore)}12`,
                              color: scoreColor(entry.avgScore),
                            }}
                          >
                            <Star className="h-2.5 w-2.5" />
                            {entry.avgScore.toFixed(1)} Avaliado
                          </span>
                        ) : (
                          <span className="text-[10px] italic text-zinc-600">Sem avaliação</span>
                        )}
                      </div>
                    </div>

                    {/* XP badge */}
                    {entry.xpEarned > 0 && (
                      <div className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-center">
                        <p className="text-[11px] font-black text-amber-400">+{entry.xpEarned}</p>
                        <p className="text-[8px] text-amber-600 font-bold">XP</p>
                      </div>
                    )}

                    {/* Presence check */}
                    <CheckCircle2 className="shrink-0 h-4 w-4 text-emerald-500 mt-0.5" />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
