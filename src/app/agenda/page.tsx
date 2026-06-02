"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, CalendarPlus, Clock, MapPin, Lock, CheckCircle2, Users, Zap } from "lucide-react";
import { useCheckIn } from "@/context/CheckInContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCoaching } from "@/context/CoachingContext";
import { useAuth } from "@/context/AuthContext";
import { useLessons } from "@/context/LessonsContext";
import type { Lesson } from "@/context/types";
import { lessonLocalDateTime, localDateISO } from "@/lib/dateUtils";
import AppPageHeader from "@/components/ui/AppPageHeader";
import AppSectionCard from "@/components/ui/AppSectionCard";
import AppEmptyState from "@/components/ui/AppEmptyState";
import CreateLessonModal from "@/components/CreateLessonModal";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";

export default function AgendaPage() {
  const { user } = useAuth();
  const { lessons } = useLessons();
  const { getCategory, getVenue } = useCatalog();
  const { feedbacks } = useCoaching();
  const { requestCheckIn } = useCheckIn();
  const [selectedDate, setSelectedDate] = useState(localDateISO());
  const [localNow, setLocalNow] = useState<Date>(new Date());
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const CTA_BUTTON_CLASS = `${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD}`;

  React.useEffect(() => {
    const id = setInterval(() => setLocalNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const isStaffRole = user?.role === "admin" || user?.role === "coach";
    if (!isStaffRole) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("newLesson") !== "1") return;
    setShowCreateLesson(true);
    params.delete("newLesson");
    const next = params.toString();
    const cleanUrl = `${window.location.pathname}${next ? `?${next}` : ""}`;
    window.history.replaceState({}, "", cleanUrl);
  }, [user?.role]);

  const haptic = (pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
  };

  const isStaff = user?.role === "admin" || user?.role === "coach";

  const calendarLessons = useMemo(() => {
    if (!user) return [];
    if (isStaff) return lessons;
    return lessons.filter((l) => l.enrolledStudents.includes(user.id));
  }, [lessons, user, isStaff]);

  const dateStrip = useMemo(() => {
    const start = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - 3);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = localDateISO(d);
      return { iso, day: d.getDate(), weekDay: d.toLocaleDateString("pt-BR", { weekday: "short" }) };
    });
  }, [localNow]);

  const dayLessons = useMemo(
    () => calendarLessons.filter((l) => l.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [calendarLessons, selectedDate],
  );

  const nextLesson = useMemo(
    () =>
      calendarLessons
        .filter((l) => l.status === "scheduled" || l.status === "in-progress")
        .sort((a, b) => lDate(lDateKey(a)).localeCompare(lDate(lDateKey(b))) || a.startTime.localeCompare(b.startTime))[0] ?? null,
    [calendarLessons],
  );

  function lDateKey(lesson: Lesson) {
    return `${lesson.date}T${lesson.startTime}:00`;
  }
  function lDate(dateTime: string) {
    return new Date(dateTime).toISOString();
  }

  const checkInGate = (lesson: Lesson) => {
    const lessonStart = lessonLocalDateTime(lesson.date, lesson.startTime);
    const lessonEnd = lessonLocalDateTime(lesson.date, lesson.endTime);
    const unlockAt = new Date(lessonStart.getTime() - 60 * 60 * 1000);
    const sameDay = lesson.date === localDateISO(localNow);
    const pending = lesson.checkInRequests?.find((r) => r.studentId === user?.id);
    const approved = lesson.presentStudents.includes(user?.id || "") || pending?.status === "approved";

    if (approved) return { state: "approved" as const, label: "Check-in confirmado", reason: "" };
    if (pending?.status === "pending") return { state: "pending" as const, label: "Aguardando confirmação", reason: "" };
    if (lesson.status === "completed") return { state: "locked" as const, label: "Encerrada", reason: "Aula concluída" };
    if (!sameDay) return { state: "locked" as const, label: "Bloqueado", reason: "Check-in apenas no dia da aula" };
    if (localNow < unlockAt) return { state: "locked" as const, label: "Bloqueado", reason: `Libera às ${unlockAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` };
    if (localNow > lessonEnd) return { state: "locked" as const, label: "Encerrado", reason: "Janela de check-in encerrada" };
    return { state: "open" as const, label: "Check-in liberado", reason: "" };
  };

  const dayPerformance = useMemo(() => {
    const ids = new Set(dayLessons.map((l) => l.id));
    if (isStaff) {
      const matriculas = dayLessons.reduce((acc, l) => acc + l.enrolledStudents.length, 0);
      return { count: matriculas, avg: 0, staffMatriculas: true as const };
    }
    const evals = feedbacks.filter((f) => f.studentId === user?.id && ids.has(f.lessonId));
    const avg = evals.length ? evals.reduce((acc, item) => acc + item.rating, 0) / evals.length : 0;
    return { count: evals.length, avg, staffMatriculas: false as const };
  }, [dayLessons, feedbacks, user, isStaff]);

  if (!user) return null;

  return (
    <div className="p-3 sm:p-4 max-w-5xl mx-auto pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <AppPageHeader
        title="Agenda de Treinos"
        subtitle={
          isStaff
            ? "Grade da academia por dia: criar aula com categoria, horário, local e alunos matriculados."
            : "Visão única: calendário + execução + leitura técnica da sessão."
        }
        icon={CalendarIcon}
        rightSlot={
          isStaff ? (
            <button
              type="button"
              onClick={() => setShowCreateLesson(true)}
              className={`inline-flex items-center gap-2 rounded-xl border border-[#EAB308]/45 bg-[#EAB308]/15 px-3 py-2 text-xs font-black text-[#EAB308] shadow-[0_0_16px_rgba(234,179,8,0.15)] ${CTA_BUTTON_CLASS}`}
            >
              <CalendarPlus className="h-4 w-4" />
              Nova aula
            </button>
          ) : null
        }
      />

      {/* Hoje no treino */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="mb-4">
        <AppSectionCard
          title={isStaff ? "Próxima na grade" : "Hoje no treino"}
          subtitle={isStaff ? "Próxima aula agendada ou em andamento (todas as turmas)." : "Resumo da próxima sessão e status diário."}
          highlight
          contentClassName="pt-2"
        >
        {nextLesson ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-bold text-white truncate">{nextLesson.title}</p>
              <p className="text-xs text-zinc-500">{nextLesson.date.split("-").reverse().join("/")} · {nextLesson.startTime} - {nextLesson.endTime}</p>
            </div>
            <button onClick={() => setSelectedDate(nextLesson.date)} className={`px-4 rounded-xl bg-[#EAB308] text-black text-xs font-black flex-shrink-0 ${CTA_BUTTON_CLASS}`}>
              Ver dia
            </button>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/45 p-4">
            <svg viewBox="0 0 220 84" className="w-full h-20 mb-2" aria-hidden>
              <defs>
                <linearGradient id="restGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgba(234,179,8,0.35)" />
                  <stop offset="100%" stopColor="rgba(234,179,8,0.03)" />
                </linearGradient>
              </defs>
              <path d="M10 62 C40 34, 72 70, 110 45 C138 27, 173 55, 210 30" fill="none" stroke="url(#restGrad)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="34" cy="52" r="5" fill="rgba(234,179,8,0.35)" />
              <circle cx="110" cy="45" r="5" fill="rgba(234,179,8,0.5)" />
              <circle cx="188" cy="36" r="5" fill="rgba(234,179,8,0.35)" />
            </svg>
            <p className="text-sm font-bold text-white">Nenhum treino agendado no momento</p>
            <p className="text-xs text-zinc-500 mt-1">Dia de recuperação ativa. Foco em mobilidade e preparação para a próxima sessão.</p>
          </div>
        )}
        </AppSectionCard>
      </motion.div>

      {/* Seletor de datas premium */}
      <div className="mb-4 -mx-1 px-1 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {dateStrip.map((item) => {
          const total = calendarLessons.filter((l) => l.date === item.iso).length;
          const selected = item.iso === selectedDate;
          return (
            <motion.button key={item.iso} whileTap={{ scale: 0.95 }} onClick={() => setSelectedDate(item.iso)}
              className={`min-h-11 min-w-[64px] px-2.5 py-2 rounded-xl border flex-shrink-0 transition-all ${CTA_BUTTON_CLASS} ${
                selected
                  ? "bg-[#EAB308] text-black border-[#EAB308] shadow-[0_0_14px_rgba(234,179,8,0.35)]"
                  : "bg-zinc-950/55 border-zinc-800 text-zinc-300"
              }`}>
              <div className="text-center leading-tight">
                <p className="text-[10px] uppercase font-bold">{item.weekDay.replace(".", "")}</p>
                <p className="text-sm font-black">{item.day}</p>
                <p className="text-[9px] opacity-80">{total > 0 ? `${total} aula${total > 1 ? "s" : ""}` : "descanso"}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/55 p-2.5">
          <p className="text-[9px] text-zinc-500">Aulas no dia</p>
          <p className="text-sm font-black text-white mt-0.5">{dayLessons.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/55 p-2.5">
          <p className="text-[9px] text-zinc-500">{isStaff ? "Matrículas no dia" : "Avaliadas"}</p>
          <p className="text-sm font-black text-[#60A5FA] mt-0.5">{dayPerformance.count}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/55 p-2.5">
          <p className="text-[9px] text-zinc-500">{isStaff ? "Turmas ativas" : "Score oficial"}</p>
          <p className="text-sm font-black text-[#EAB308] mt-0.5">
            {isStaff ? dayLessons.filter((l) => l.status !== "cancelled").length : dayPerformance.avg ? dayPerformance.avg.toFixed(1) : "—"}
          </p>
        </div>
      </div>

      <div className="space-y-3 relative">
        {dayLessons.length === 0 && (
          <AppEmptyState
            title={isStaff ? "Nenhuma aula neste dia" : "Dia sem treino agendado"}
            description={
              isStaff
                ? "Crie uma sessão com categoria, horário, local e alunos na turma."
                : "Use este espaço para recuperação, mobilidade e revisão tática."
            }
          />
        )}
        {isStaff && dayLessons.length === 0 ? (
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            type="button"
            onClick={() => setShowCreateLesson(true)}
              className={`mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#EAB308]/40 bg-[#EAB308]/12 py-3 text-sm font-black text-[#EAB308] ${CTA_BUTTON_CLASS}`}
          >
            <CalendarPlus className="h-4 w-4" />
            Criar aula em {selectedDate.split("-").reverse().join("/")}
          </motion.button>
        ) : null}

        <div className="relative space-y-3 sm:space-y-4">
          {dayLessons.map((lesson, i) => {
            const cat = getCategory(lesson.categoryId);
            const venue = getVenue(lesson.venueId);
            const isOngoing = lesson.status === "in-progress";
            const isDone = lesson.status === "completed";
            const gate = checkInGate(lesson);
            const feedback = !isStaff ? feedbacks.find((f) => f.studentId === user.id && f.lessonId === lesson.id) : undefined;

            return (
              <motion.div key={lesson.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-start gap-2 sm:gap-3">
                <div className="w-[64px] sm:w-[72px] flex-shrink-0 text-right pt-2">
                  <span className="text-xs sm:text-sm font-bold text-zinc-400 tabular-nums">{lesson.startTime}</span>
                </div>
                <div className="pt-3 flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full border-2 border-[#0A0A0A] ${isOngoing ? "animate-pulse" : ""}`}
                    style={{ background: isDone ? "#52525B" : isOngoing ? "#EF4444" : cat?.color, boxShadow: isOngoing ? "0 0 10px #EF4444" : `0 0 8px ${cat?.color}50` }} />
                </div>

                <motion.div whileHover={{ scale: 1.01 }}
                  style={{ borderLeftColor: isDone ? "#52525B" : isOngoing ? "#EF4444" : cat?.color, borderLeftWidth: "4px" }}
                  className={`flex-1 min-w-0 p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isOngoing ? "border-[#EF4444]/50 bg-[#EF4444]/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]" :
                    isDone ? "border-zinc-800/40 bg-zinc-900/20" :
                    "bg-gradient-to-r from-zinc-900/60 to-black border-zinc-800/60 hover:border-zinc-700"
                  }`}>

                  {/* Glow */}
                  {isOngoing && <motion.div animate={{ opacity: [0.05, 0.15, 0.05] }} transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-[#EF4444]/10 pointer-events-none" />}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider text-black" style={{ background: cat?.color }}>
                          {cat?.emoji} {cat?.name}
                        </span>
                        {isOngoing && (
                          <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                            className="text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-md border border-[#EF4444]/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />AO VIVO
                          </motion.span>
                        )}
                        {isDone && <span className="text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-md">✓ Concluída</span>}
                      </div>
                      <h3 className={`font-bold text-base sm:text-lg truncate ${isDone ? "text-zinc-500" : "text-white"}`}>{lesson.title}</h3>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 whitespace-nowrap"><Clock className="w-3 h-3" />{lesson.startTime} - {lesson.endTime}</span>
                        <span className="flex items-center gap-1 truncate max-w-full"><MapPin className="w-3 h-3" />{venue?.name || "Local"}</span>
                      </div>
                      {!isStaff ? (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${gate.state === "open" ? "text-[#22C55E] border-[#22C55E]/35 bg-[#22C55E]/10" : gate.state === "pending" ? "text-[#EAB308] border-[#EAB308]/35 bg-[#EAB308]/10" : gate.state === "approved" ? "text-[#60A5FA] border-[#60A5FA]/35 bg-[#60A5FA]/10" : "text-zinc-500 border-zinc-700 bg-zinc-900/60"}`}>
                            {gate.state === "open" ? "Check-in liberado" : gate.label}
                          </span>
                          {gate.reason ? <span className="text-[10px] text-zinc-500">{gate.reason}</span> : null}
                          {feedback ? <span className="text-[10px] font-bold text-[#EAB308] bg-[#EAB308]/10 border border-[#EAB308]/25 rounded-full px-2 py-0.5">Score oficial: {feedback.rating.toFixed(1)}</span> : null}
                        </div>
                      ) : (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/60 px-2.5 py-1 text-[10px] font-bold text-zinc-300">
                          <Users className="h-3 w-3 text-[#EAB308]" />
                          {lesson.enrolledStudents.length}/{lesson.maxStudents} na turma
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                      {!isStaff ? (
                        gate.state === "open" ? (
                          <motion.button whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              requestCheckIn(lesson.id, user.id);
                              haptic([80, 40, 120]);
                            }}
                            className={`px-4 py-2 min-h-11 rounded-xl text-[11px] font-black bg-[#EAB308] text-black shadow-[0_0_14px_rgba(234,179,8,0.3)] flex items-center gap-1.5 ${CTA_BUTTON_CLASS}`}>
                            <Zap className="w-3.5 h-3.5" /> Registrar chegada
                          </motion.button>
                        ) : gate.state === "approved" ? (
                          <div className="px-3 py-2 min-h-11 rounded-xl text-[11px] font-bold bg-[#60A5FA]/10 border border-[#60A5FA]/30 text-[#60A5FA] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
                          </div>
                        ) : (
                          <div className="px-3 py-2 min-h-11 rounded-xl text-[11px] font-bold bg-zinc-900 border border-zinc-700 text-zinc-400 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" /> Bloqueado
                          </div>
                        )
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <CreateLessonModal
        isOpen={showCreateLesson}
        onClose={() => setShowCreateLesson(false)}
        defaultDate={selectedDate}
      />
    </div>
  );
}
