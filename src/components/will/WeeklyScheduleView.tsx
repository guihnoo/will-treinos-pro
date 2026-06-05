"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Edit2, X, RefreshCw, Users } from "lucide-react";
import { localDateISO, getMonday } from "@/lib/dateUtils";
import type { Lesson, LessonCategory } from "@/context/types";

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatDayLabel(date: Date): string {
  return `${DAY_LABELS[date.getDay() === 0 ? 6 : date.getDay() - 1]} ${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function occupancyColor(lesson: Lesson): string {
  if (lesson.status === "cancelled") return "#EF4444";
  const enrolled = lesson.enrolledStudents.length;
  const present = lesson.presentStudents.length;
  if (enrolled === 0) return "#52525b";
  const pct = present / enrolled;
  if (pct > 0.7) return "#22C55E";
  if (pct >= 0.4) return "#EAB308";
  return "#EF4444";
}

function statusBadge(lesson: Lesson): { label: string; color: string } {
  const enrolled = lesson.enrolledStudents.length;
  const max = lesson.maxStudents;
  if (lesson.status === "cancelled") return { label: "Cancelada", color: "#EF4444" };
  if (lesson.status === "completed") return { label: "Encerrada", color: "#22C55E" };
  if (lesson.status === "in-progress") return { label: "Ao vivo", color: "#EAB308" };
  if (enrolled >= max) return { label: "Lotada", color: "#F97316" };
  return { label: "Em breve", color: "#60A5FA" };
}

interface Props {
  lessons: Lesson[];
  onCancelLesson: (id: string) => void;
  onReopenLesson: (id: string) => void;
  onSelectLesson: (id: string) => void;
  getCategory: (id: string) => LessonCategory | undefined;
}

export default function WeeklyScheduleView({
  lessons,
  onCancelLesson,
  onReopenLesson,
  onSelectLesson,
  getCategory,
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = useMemo(() => {
    const monday = getMonday(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const lessonsByDay = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const day of weekDays) {
      const iso = localDateISO(day);
      const dayLessons = lessons
        .filter((l) => l.date === iso)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      map.set(iso, dayLessons);
    }
    return map;
  }, [weekDays, lessons]);

  const weekLabel = useMemo(() => {
    const first = weekDays[0];
    const last = weekDays[6];
    return `${first.getDate()} ${MONTHS_PT[first.getMonth()]} – ${last.getDate()} ${MONTHS_PT[last.getMonth()]} ${last.getFullYear()}`;
  }, [weekDays]);

  return (
    <div className="space-y-3">
      {/* Week navigation */}
      <div className="flex items-center justify-between gap-3 px-1">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => setWeekOffset((o) => o - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/40 text-zinc-400 hover:text-white transition-colors"
          aria-label="Semana anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </motion.button>
        <p className="text-xs font-bold text-zinc-300">{weekLabel}</p>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => setWeekOffset((o) => o + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/40 text-zinc-400 hover:text-white transition-colors"
          aria-label="Próxima semana"
        >
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Day columns — responsive */}
      <div className="grid gap-2 sm:grid-cols-7">
        {weekDays.map((day) => {
          const iso = localDateISO(day);
          const dayLessons = lessonsByDay.get(iso) ?? [];
          const isToday = iso === localDateISO(new Date());

          return (
            <motion.div
              key={iso}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-2 ${
                isToday
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-zinc-800/50 bg-zinc-900/20"
              }`}
            >
              {/* Day header */}
              <p className={`mb-2 text-center text-[10px] font-black uppercase tracking-wide ${isToday ? "text-amber-400" : "text-zinc-500"}`}>
                {formatDayLabel(day)}
              </p>

              {dayLessons.length === 0 ? (
                <p className="py-3 text-center text-[9px] text-zinc-600 italic">Dia livre</p>
              ) : (
                <div className="space-y-1.5">
                  <AnimatePresence>
                    {dayLessons.map((lesson) => {
                      const cat = getCategory(lesson.categoryId);
                      const catColor = cat?.color ?? "#EAB308";
                      const occColor = occupancyColor(lesson);
                      const badge = statusBadge(lesson);
                      const enrolled = lesson.enrolledStudents.length;
                      const present = lesson.presentStudents.length;
                      const pct = enrolled > 0 ? (present / enrolled) * 100 : 0;

                      return (
                        <motion.div
                          key={lesson.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelectLesson(lesson.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onSelectLesson(lesson.id);
                            }
                          }}
                          className={`relative rounded-xl border p-2 cursor-pointer transition-colors hover:border-zinc-600/60 ${
                            lesson.status === "cancelled"
                              ? "border-red-500/20 bg-red-500/5 opacity-60"
                              : "border-zinc-700/40 bg-zinc-800/30"
                          }`}
                        >
                          {/* Colored top stripe */}
                          <div
                            className="absolute top-0 left-2 right-2 h-0.5 rounded-full opacity-70"
                            style={{ background: catColor }}
                          />

                          {/* Time */}
                          <p className="text-[9px] font-bold text-zinc-500 mt-1">{lesson.startTime}</p>

                          {/* Title */}
                          <p className="text-[10px] font-black text-white leading-tight truncate mt-0.5">
                            {lesson.title}
                          </p>

                          {/* Occupancy bar */}
                          {lesson.status === "completed" && enrolled > 0 && (
                            <div className="mt-1.5">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[8px] text-zinc-600 flex items-center gap-0.5">
                                  <Users className="h-2 w-2" />
                                  {present}/{enrolled}
                                </span>
                                <span className="text-[8px] font-bold" style={{ color: occColor }}>
                                  {Math.round(pct)}%
                                </span>
                              </div>
                              <div className="h-1 rounded-full bg-zinc-700">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, background: occColor }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Status badge */}
                          <div className="mt-1.5">
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[8px] font-black"
                              style={{
                                color: badge.color,
                                background: `${badge.color}18`,
                              }}
                            >
                              {badge.label}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="mt-2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectLesson(lesson.id);
                              }}
                              data-testid={`btn-lesson-detail-${lesson.id}`}
                              className="flex h-6 w-6 items-center justify-center rounded-lg border border-zinc-600/40 bg-zinc-700/40 text-zinc-400 hover:text-white transition-colors"
                              aria-label="Detalhes da aula"
                            >
                              <Edit2 className="h-2.5 w-2.5" />
                            </button>

                            {lesson.status === "scheduled" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCancelLesson(lesson.id);
                                }}
                                data-testid={`btn-cancel-lesson-${lesson.id}`}
                                className="flex h-6 w-6 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                                aria-label="Cancelar aula"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            )}

                            {lesson.status === "cancelled" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReopenLesson(lesson.id);
                                }}
                                data-testid={`btn-reopen-lesson-${lesson.id}`}
                                className="flex h-6 w-6 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 transition-colors"
                                aria-label="Reabrir aula"
                              >
                                <RefreshCw className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
