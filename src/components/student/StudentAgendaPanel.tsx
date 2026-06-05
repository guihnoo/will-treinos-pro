"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, ChevronRight, X } from "lucide-react";
import type { Lesson } from "@/context/types";
import { DAY, getWeekStyle } from "./studentHomeShared";
import { FOCUS_RING_GOLD } from "@/components/ui/interactionTokens";

export interface StudentAgendaPanelProps {
  showAgendaPanel: boolean;
  setShowAgendaPanel: (v: boolean) => void;
  selectedDay: string | null;
  setSelectedDay: (v: string | null) => void;
  week7: string[];
  myLessons: Lesson[];
  weekScheduledCount: number;
  weekCompletedCount: number;
  executionRate: number;
  setLessonModal: (v: Lesson | null) => void;
  getLessonExecutionStage: (lesson: Lesson) => { stage: number; label: string; color: string };
  haptic: (pattern: number | number[]) => void;
  ctaClass: string;
}

export function StudentAgendaPanel({
  showAgendaPanel,
  setShowAgendaPanel,
  selectedDay,
  setSelectedDay,
  week7,
  myLessons,
  weekScheduledCount,
  weekCompletedCount,
  executionRate,
  setLessonModal,
  getLessonExecutionStage,
  haptic,
  ctaClass,
}: StudentAgendaPanelProps) {
  return (
    <AnimatePresence>
      {showAgendaPanel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          data-modal-overlay
          aria-label="Agenda da semana"
          className="fixed inset-0 z-[90] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-sm flex flex-col justify-end"
          onClick={() => setShowAgendaPanel(false)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl mx-auto bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl p-4 sm:p-6 max-h-[92dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-24px_80px_rgba(0,0,0,0.55)]"
          >
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />
            <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-sm flex items-center justify-between mb-3 pb-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#EAB308]" /> Agenda da semana
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDay(week7[0] ?? null)}
                  className={`text-[10px] font-bold text-[#EAB308] border border-[#EAB308]/25 bg-[#EAB308]/10 px-2.5 py-1 rounded-lg ${ctaClass}`}
                >
                  Ver hoje
                </button>
                <button
                  onClick={() => setShowAgendaPanel(false)}
                  className={`p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-500 ${FOCUS_RING_GOLD}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
              <div className="flex-shrink-0 rounded-xl border border-zinc-800 bg-zinc-950/55 px-2.5 py-1.5">
                <p className="text-[9px] text-zinc-500">Treinos na semana</p>
                <p className="text-[11px] font-bold text-white">{weekScheduledCount}</p>
              </div>
              <div className="flex-shrink-0 rounded-xl border border-zinc-800 bg-zinc-950/55 px-2.5 py-1.5">
                <p className="text-[9px] text-zinc-500">Concluídos</p>
                <p className="text-[11px] font-bold text-[#22C55E]">{weekCompletedCount}</p>
              </div>
              <div className="flex-shrink-0 rounded-xl border border-zinc-800 bg-zinc-950/55 px-2.5 py-1.5">
                <p className="text-[9px] text-zinc-500">Execução</p>
                <p className="text-[11px] font-bold text-[#EAB308]">{executionRate}%</p>
              </div>
            </div>
            <div className="-mx-1 px-1 flex gap-3 overflow-x-auto overflow-y-visible no-scrollbar pb-2 overscroll-x-contain touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none]">
              {week7.map((date, i) => {
                const d = new Date(date + "T12:00:00");
                const dayLessons = myLessons.filter(
                  (l) =>
                    l.date === date &&
                    (l.status === "scheduled" || l.status === "in-progress" || l.status === "completed"),
                );
                const isToday = i === 0;
                const isSelected = selectedDay === date;
                const sortedDay = [...dayLessons].sort((a, b) => a.startTime.localeCompare(b.startTime));
                const primary = sortedDay[0];
                const sty = primary ? getWeekStyle(primary.categoryId) : getWeekStyle("");
                return (
                  <motion.div
                    key={date}
                    whileTap={dayLessons.length > 0 ? { scale: 0.97 } : undefined}
                    onClick={() => {
                      if (dayLessons.length === 0) return;
                      haptic(18);
                      setSelectedDay(isSelected ? null : date);
                    }}
                    className={`group relative flex flex-col flex-shrink-0 snap-start min-h-[150px] min-w-[118px] w-[118px] sm:min-w-[128px] sm:w-[128px] rounded-2xl border p-3 backdrop-blur-xl ${
                      dayLessons.length > 0
                        ? `cursor-pointer ${sty.cardClass}`
                        : "border-white/[0.06] bg-zinc-950/55"
                    } ${isSelected && dayLessons.length > 0 ? "ring-2 ring-[#EAB308]/80 ring-offset-2 ring-offset-black" : ""} ${
                      isToday && !isSelected && dayLessons.length > 0 ? "ring-1 ring-white/15" : ""
                    }`}
                  >
                    <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col">
                      <div className="mb-1 flex min-h-[2.5rem] items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isSelected ? "text-[#EAB308]" : isToday ? "text-white/90" : "text-zinc-500"
                            }`}
                          >
                            {isToday ? "Hoje" : DAY[d.getDay()]}
                          </p>
                          <p
                            className={`text-lg font-bold tabular-nums leading-none ${
                              dayLessons.length > 0 ? "text-white" : isToday ? "text-zinc-200" : "text-zinc-600"
                            }`}
                          >
                            {d.getDate()}
                          </p>
                        </div>
                        {primary ? (
                          <span
                            className={`mt-0.5 inline-flex max-w-[4.5rem] flex-shrink-0 items-center justify-center rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide leading-none ${sty.badge}`}
                          >
                            {sty.label}
                          </span>
                        ) : null}
                      </div>
                      {dayLessons.length > 0 && primary ? (
                        <div className="mt-0 flex min-h-0 flex-1 flex-col">
                          <p
                            className={`shrink-0 text-[11px] font-mono font-bold leading-none tabular-nums ${sty.timeClass}`}
                          >
                            {primary.startTime} – {primary.endTime}
                          </p>
                          <p className="mt-1 line-clamp-2 min-h-[2.35rem] break-words text-[10px] font-bold leading-snug text-white/95 [overflow-wrap:anywhere]">
                            {primary.title}
                          </p>
                          <div className="mt-auto flex shrink-0 items-center justify-between border-t border-white/10 pt-2">
                            <span className="text-[9px] font-bold text-white/50">{dayLessons.length} no ciclo</span>
                            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-white/25" />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-auto flex flex-1 items-end justify-center pb-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <AnimatePresence>
              {selectedDay &&
                (() => {
                  const dayLessons = myLessons.filter(
                    (l) =>
                      l.date === selectedDay &&
                      (l.status === "scheduled" || l.status === "in-progress" || l.status === "completed"),
                  );
                  return (
                    dayLessons.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-2"
                      >
                        <div className="space-y-2 pt-2">
                          {dayLessons.map((l) => {
                            const ws = getWeekStyle(l.categoryId);
                            const flow = getLessonExecutionStage(l);
                            return (
                              <motion.div
                                key={l.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setLessonModal(l);
                                  setShowAgendaPanel(false);
                                }}
                                className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all"
                              >
                                <div
                                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                  style={{ background: ws.accent, boxShadow: `0 0 12px ${ws.accent}` }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-white truncate">{l.title}</p>
                                  <p className="text-xs text-zinc-500 tabular-nums">
                                    {l.startTime} – {l.endTime}
                                  </p>
                                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
                                      {ws.label}
                                    </p>
                                    <span
                                      className="rounded-full border px-1.5 py-0.5 text-[8px] font-bold"
                                      style={{
                                        color: flow.color,
                                        borderColor: `${flow.color}55`,
                                        background: `${flow.color}14`,
                                      }}
                                    >
                                      {flow.label}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )
                  );
                })()}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StudentAgendaPanel;
