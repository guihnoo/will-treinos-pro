"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, TrendingUp, Flame, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Lesson } from "@/context/types";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";
import { MODAL_OVERLAY_FADE, SPRING_PREMIUM } from "@/components/ui/motionTokens";

const DAY_HEADERS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type DayStatus = "present" | "absent" | "scheduled" | "idle";

interface DayData {
  date: string;        // YYYY-MM-DD
  status: DayStatus;
  lessons: { title: string; time: string; status: string }[];
}

interface Props {
  lessons: Lesson[];
  studentId: string;
  getCategoryName: (id: string) => string;
  streak: number;
  bestStreak: number;
  onClose: () => void;
}

function isoMonday(year: number, month: number): Date {
  const first = new Date(year, month, 1);
  const day = first.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(year, month, 1 + diff);
}

export default function AttendanceCalendarPanel({
  lessons, studentId, getCategoryName, streak, bestStreak, onClose,
}: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const myLessons = useMemo(
    () => lessons.filter((l) => l.enrolledStudents.includes(studentId)),
    [lessons, studentId]
  );

  // Build a map: YYYY-MM-DD → DayData
  const dayMap = useMemo(() => {
    const map = new Map<string, DayData>();
    for (const lesson of myLessons) {
      const existing = map.get(lesson.date);
      const catName = lesson.title || getCategoryName(lesson.categoryId) || "Aula";
      const entry = { title: catName, time: lesson.startTime, status: lesson.status };
      if (existing) {
        existing.lessons.push(entry);
      } else {
        const isPresent = lesson.status === "completed" && lesson.presentStudents.includes(studentId);
        const isAbsent  = lesson.status === "completed" && !lesson.presentStudents.includes(studentId);
        const isScheduled = lesson.status === "scheduled";
        const status: DayStatus = isPresent ? "present" : isAbsent ? "absent" : isScheduled ? "scheduled" : "idle";
        map.set(lesson.date, { date: lesson.date, status, lessons: [entry] });
      }
    }
    // Resolve conflicts: if any present → present; else any absent → absent
    for (const [, data] of map) {
      const hasPresent  = data.lessons.some((l) => l.status === "completed") &&
        myLessons.some((l) => l.date === data.date && l.presentStudents.includes(studentId));
      const hasAbsent   = data.lessons.some((l) => l.status === "completed") &&
        myLessons.some((l) => l.date === data.date && l.enrolledStudents.includes(studentId) && !l.presentStudents.includes(studentId));
      const hasScheduled = data.lessons.some((l) => l.status === "scheduled");
      data.status = hasPresent ? "present" : hasAbsent ? "absent" : hasScheduled ? "scheduled" : "idle";
    }
    return map;
  }, [myLessons, studentId, getCategoryName]);

  // Overall stats
  const stats = useMemo(() => {
    const completed = myLessons.filter((l) => l.status === "completed");
    const attended  = completed.filter((l) => l.presentStudents.includes(studentId)).length;
    const total     = completed.length;
    const rate      = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { attended, total, rate };
  }, [myLessons, studentId]);

  // Calendar grid for current month
  const grid = useMemo(() => {
    const firstMonday = isoMonday(viewYear, viewMonth);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayStr = today.toISOString().slice(0, 10);
    const cells: Array<{ iso: string | null; day: number | null; data: DayData | null; isToday: boolean; inMonth: boolean }> = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(firstMonday);
      d.setDate(firstMonday.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const inMonth = d.getMonth() === viewMonth && d.getFullYear() === viewYear;
      if (i >= 35 && !inMonth) break;
      cells.push({ iso, day: d.getDate(), data: dayMap.get(iso) ?? null, isToday: iso === todayStr, inMonth });
    }
    return cells;
  }, [viewYear, viewMonth, dayMap, today]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    const now = new Date();
    if (viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth >= now.getMonth())) return;
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelectedDay(null);
  }
  const isAtCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const statusDot: Record<DayStatus, string> = {
    present:   "bg-emerald-500",
    absent:    "bg-red-500",
    scheduled: "bg-blue-400",
    idle:      "bg-zinc-600",
  };

  const selectedData = selectedDay ? dayMap.get(selectedDay) : null;

  return (
    <AnimatePresence>
      <motion.div
        key="cal-overlay"
        {...MODAL_OVERLAY_FADE}
        className={MODAL_FIXED_OVERLAY_SCROLL}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className={MODAL_OVERLAY_CENTER_WRAP}>
          <motion.div
            key="cal-panel"
            {...SPRING_PREMIUM}
            className={`${MODAL_PANEL_COLUMN} max-w-md w-full rounded-3xl border border-zinc-700/50 bg-[#09090b] shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800/60 px-5 py-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10">
                  <Calendar size={20} className="text-[#EAB308]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Calendário de Presença</h2>
                  <p className="text-[11px] text-zinc-500">Seu histórico de treinos</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className={`${MODAL_BODY_SCROLL} px-5 py-4 space-y-4`}>
              {/* Stats strip */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Presença", value: `${stats.rate}%`, icon: TrendingUp, color: stats.rate >= 80 ? "#22c55e" : stats.rate >= 60 ? "#EAB308" : "#ef4444" },
                  { label: "Aulas",    value: `${stats.attended}`,  icon: CheckCircle2, color: "#EAB308" },
                  { label: "Sequência", value: `${streak}`,  icon: Flame, color: "#f97316" },
                  { label: "Recorde", value: `${bestStreak}`, icon: TrendingUp, color: "#8b5cf6" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 px-2 py-2.5 text-center">
                      <Icon size={13} className="mx-auto mb-1" style={{ color: s.color }} />
                      <p className="text-base font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[9px] text-zinc-600 mt-0.5">{s.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Month navigation */}
              <div className="flex items-center justify-between">
                <motion.button whileTap={{ scale: 0.9 }} onClick={prevMonth} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
                  <ChevronLeft size={16} />
                </motion.button>
                <p className="text-sm font-black text-white">{MONTH_NAMES[viewMonth]} {viewYear}</p>
                <motion.button whileTap={{ scale: 0.9 }} onClick={nextMonth} disabled={isAtCurrentMonth}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-30">
                  <ChevronRight size={16} />
                </motion.button>
              </div>

              {/* Calendar grid */}
              <div>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_HEADERS.map((d) => (
                    <div key={d} className="text-center text-[9px] font-bold text-zinc-600 py-1">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {grid.map((cell, i) => {
                    if (!cell.iso) return <div key={i} />;
                    const isSelected = selectedDay === cell.iso;
                    const dotColor = cell.data ? statusDot[cell.data.status] : "";
                    return (
                      <motion.button
                        key={cell.iso}
                        whileTap={cell.data ? { scale: 0.9 } : undefined}
                        onClick={() => cell.data ? setSelectedDay(isSelected ? null : cell.iso) : undefined}
                        className={`relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all ${
                          !cell.inMonth ? "opacity-20" : ""
                        } ${cell.isToday ? "ring-1 ring-[#EAB308]/50 bg-[#EAB308]/5" : ""} ${
                          isSelected ? "bg-zinc-800/80" : cell.data ? "hover:bg-zinc-900" : ""
                        }`}
                      >
                        <span className={`text-[11px] font-bold ${
                          cell.isToday ? "text-[#EAB308]" : cell.inMonth ? "text-zinc-300" : "text-zinc-700"
                        }`}>
                          {cell.day}
                        </span>
                        {cell.data && (
                          <div className={`mt-0.5 h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4">
                {[
                  { color: "bg-emerald-500", label: "Presente" },
                  { color: "bg-red-500",     label: "Ausente" },
                  { color: "bg-blue-400",    label: "Agendado" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${l.color}`} />
                    <span className="text-[10px] text-zinc-500">{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Selected day detail */}
              <AnimatePresence>
                {selectedDay && selectedData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl border border-zinc-800/60 bg-zinc-950/60 p-3 overflow-hidden"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600 mb-2">
                      {new Date(`${selectedDay}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    {selectedData.lessons.map((l, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1.5">
                        {l.status === "completed" && selectedData.status === "present" ? (
                          <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                        ) : l.status === "completed" ? (
                          <XCircle size={13} className="text-red-400 flex-shrink-0" />
                        ) : (
                          <Clock size={13} className="text-blue-400 flex-shrink-0" />
                        )}
                        <span className="text-xs text-zinc-300 font-bold">{l.title}</span>
                        <span className="text-[10px] text-zinc-600">{l.time}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
