"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Users, CheckCircle2, Loader2 } from "lucide-react";
import type { Lesson } from "@/context/types";
import type { LessonCategory } from "@/context/types";
import { localDateISO } from "@/lib/dateUtils";
import { useToast } from "@/components/Toast";
import { MODAL_BODY_SCROLL, MODAL_FIXED_OVERLAY_SCROLL, MODAL_OVERLAY_CENTER_WRAP } from "@/components/ui/modalScrollClasses";
import { SPRING_PREMIUM } from "@/components/ui/motionTokens";

interface StudentSchedulePanelProps {
  studentId: string;
  lessons: Lesson[];
  onClose: () => void;
  getCategory: (id: string) => LessonCategory | undefined;
}

type EnrollmentState = "enrolled" | "available" | "full";
type OptimisticMap = Map<string, EnrollmentState>;

function formatDate(dateStr: string): { label: string; weekday: string } {
  const d = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "short" });
  const dayMonth = d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  if (diff === 0) return { label: "Hoje", weekday: dayMonth };
  if (diff === 1) return { label: "Amanhã", weekday: dayMonth };
  return { label: weekday.charAt(0).toUpperCase() + weekday.slice(1), weekday: dayMonth };
}

function getWeekLabel(weekOffset: 0 | 1 | 2): string {
  if (weekOffset === 0) return "Esta semana";
  if (weekOffset === 1) return "Próxima semana";
  return "Em 2 semanas";
}

export default function StudentSchedulePanel({
  studentId,
  lessons,
  onClose,
  getCategory,
}: StudentSchedulePanelProps) {
  const { toast } = useToast();
  const [optimistic, setOptimistic] = useState<OptimisticMap>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const today = localDateISO();
  const limit = new Date();
  limit.setDate(limit.getDate() + 21);
  const limitStr = localDateISO(limit);

  const scheduledUpcoming = useMemo(() => {
    return lessons
      .filter((l) => l.status === "scheduled" && l.date >= today && l.date <= limitStr)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [lessons, today, limitStr]);

  // Compute week offset (0=current, 1=next, 2=in2)
  const getWeekOffset = (dateStr: string): 0 | 1 | 2 => {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const d = new Date(`${dateStr}T00:00:00`);
    if (d <= weekEnd) return 0;
    const nextWeekEnd = new Date(weekStart);
    nextWeekEnd.setDate(weekStart.getDate() + 13);
    if (d <= nextWeekEnd) return 1;
    return 2;
  };

  const grouped = useMemo<Array<{ offset: 0 | 1 | 2; items: Lesson[] }>>(() => {
    const map = new Map<number, Lesson[]>();
    for (const l of scheduledUpcoming) {
      const offset = getWeekOffset(l.date);
      const arr = map.get(offset) ?? [];
      arr.push(l);
      map.set(offset, arr);
    }
    return ([0, 1, 2] as const)
      .filter((o) => map.has(o))
      .map((offset) => ({ offset, items: map.get(offset)! }));
  }, [scheduledUpcoming]);

  const getEnrollmentState = (lesson: Lesson): EnrollmentState => {
    const opt = optimistic.get(lesson.id);
    if (opt) return opt;
    if (lesson.enrolledStudents.includes(studentId)) return "enrolled";
    if (lesson.enrolledStudents.length >= lesson.maxStudents) return "full";
    return "available";
  };

  const handleToggle = async (lesson: Lesson) => {
    const state = getEnrollmentState(lesson);
    if (state === "full") return;
    const action: "enroll" | "unenroll" = state === "enrolled" ? "unenroll" : "enroll";
    const next: EnrollmentState =
      action === "enroll" ? "enrolled" : "available";

    // Optimistic update
    setOptimistic((prev) => new Map(prev).set(lesson.id, next));
    setLoading((prev) => new Set(prev).add(lesson.id));

    try {
      const res = await fetch("/api/student/enroll-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, action }),
      });
      const data = (await res.json()) as { success: boolean; spotsLeft?: number; error?: string };
      if (!data.success) {
        // Revert
        setOptimistic((prev) => {
          const next = new Map(prev);
          next.delete(lesson.id);
          return next;
        });
        toast(data.error ?? "Erro ao processar inscrição.", "error");
      } else {
        const msg =
          action === "enroll"
            ? `Inscrito em "${lesson.title}"!`
            : `Inscrição cancelada em "${lesson.title}"`;
        toast(msg, action === "enroll" ? "success" : "info");
      }
    } catch {
      setOptimistic((prev) => {
        const next = new Map(prev);
        next.delete(lesson.id);
        return next;
      });
      toast("Erro de conexão. Tente novamente.", "error");
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(lesson.id);
        return next;
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Agenda de aulas disponíveis"
      data-modal-overlay
      className={`fixed inset-0 z-[250] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/80 backdrop-blur-sm`}
      onClick={onClose}
    >
      <div className={MODAL_OVERLAY_CENTER_WRAP}>
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          transition={SPRING_PREMIUM}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-3xl border border-white/[0.1] bg-[#050505]/96 shadow-[0_40px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]">
                Agenda
              </p>
              <h2 className="text-base font-black text-white">Aulas Disponíveis</h2>
              <p className="text-[11px] text-zinc-500">Próximos 21 dias · inscreva-se ou cancele</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={onClose}
              data-testid="btn-student-schedule-close"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-zinc-400 hover:text-white transition-colors"
              aria-label="Fechar agenda"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Body */}
          <div className={`${MODAL_BODY_SCROLL} space-y-5 px-5 py-4`}>
            {grouped.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Calendar className="h-10 w-10 text-zinc-700" />
                <p className="text-sm font-bold text-zinc-400">Nenhuma aula agendada nos próximos 21 dias</p>
                <p className="text-xs text-zinc-600">O professor ainda não publicou aulas futuras</p>
              </div>
            )}

            {grouped.map(({ offset, items }) => (
              <motion.div
                key={offset}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: offset * 0.07 }}
              >
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  {getWeekLabel(offset)}
                </p>
                <div className="space-y-2">
                  {items.map((lesson) => {
                    const state = getEnrollmentState(lesson);
                    const cat = getCategory(lesson.categoryId);
                    const { label: dayLabel, weekday } = formatDate(lesson.date);
                    const spots = lesson.enrolledStudents.length;
                    const max = lesson.maxStudents;
                    const pct = Math.min(100, Math.round((spots / Math.max(1, max)) * 100));
                    const isLoading = loading.has(lesson.id);

                    const stateStyles: Record<EnrollmentState, string> = {
                      enrolled:
                        "border-emerald-500/35 bg-gradient-to-r from-emerald-500/10 to-transparent",
                      available:
                        "border-zinc-800/60 bg-zinc-900/30 hover:border-zinc-700",
                      full: "border-zinc-800/40 bg-zinc-950/30 opacity-60",
                    };

                    return (
                      <motion.div
                        key={lesson.id}
                        layout
                        className={`rounded-2xl border p-3 transition-all ${stateStyles[state]}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Date badge */}
                          <div className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-900/60 px-2.5 py-2 min-w-[44px]">
                            <p className="text-[9px] font-black uppercase text-[#EAB308]">{dayLabel.slice(0, 3)}</p>
                            <p className="text-[11px] font-bold text-white">{weekday.split(" ")[0]}</p>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-sm font-bold text-white truncate">{lesson.title}</p>
                              {cat && (
                                <span
                                  className="rounded-full border px-2 py-0.5 text-[9px] font-black"
                                  style={{ borderColor: `${cat.color}50`, color: cat.color, background: `${cat.color}18` }}
                                >
                                  {cat.emoji} {cat.name}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-2">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.startTime}{lesson.endTime ? `–${lesson.endTime}` : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {spots}/{max}
                              </span>
                            </div>

                            {/* Occupancy bar */}
                            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className={`h-full rounded-full ${
                                  pct >= 100
                                    ? "bg-red-500"
                                    : pct >= 75
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                              />
                            </div>

                            {/* Status + action */}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[10px] font-black ${
                                  state === "enrolled"
                                    ? "text-emerald-400"
                                    : state === "full"
                                    ? "text-zinc-500"
                                    : "text-zinc-400"
                                }`}
                              >
                                {state === "enrolled" && (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Inscrito
                                  </span>
                                )}
                                {state === "available" && "Disponível"}
                                {state === "full" && "Lotada"}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {state === "enrolled" && (
                                  <motion.button
                                    whileTap={{ scale: 0.93 }}
                                    disabled={isLoading}
                                    onClick={() => handleToggle(lesson)}
                                    data-testid={`btn-unenroll-${lesson.id}`}
                                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-black text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                                  >
                                    {isLoading ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      "Cancelar inscrição"
                                    )}
                                  </motion.button>
                                )}
                                {state === "available" && (
                                  <motion.button
                                    whileTap={{ scale: 0.93 }}
                                    disabled={isLoading}
                                    onClick={() => handleToggle(lesson)}
                                    data-testid={`btn-enroll-${lesson.id}`}
                                    className="rounded-lg border border-[#EAB308]/35 bg-[#EAB308]/10 px-2.5 py-1 text-[10px] font-black text-[#EAB308] hover:bg-[#EAB308]/20 transition-colors disabled:opacity-40"
                                  >
                                    {isLoading ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      "Inscrever-se"
                                    )}
                                  </motion.button>
                                )}
                                {state === "full" && (
                                  <span className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-2.5 py-1 text-[10px] font-black text-zinc-600 cursor-not-allowed">
                                    Lotada
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
