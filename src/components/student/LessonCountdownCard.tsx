"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MapPin, Radio, ChevronRight, Users } from "lucide-react";
import type { Lesson } from "@/context/types";
import { lessonLocalDateTime, localDateISO } from "@/lib/dateUtils";

interface Props {
  lessons: Lesson[];
  studentId: string;
  getCategoryFn: (id: string) => { name: string; color: string; emoji: string } | undefined;
  onCheckIn?: () => void;
}

type LessonState = "live" | "imminent" | "soon" | "today" | "tomorrow";

function getState(startMs: number, endMs: number, nowMs: number): LessonState {
  if (nowMs >= startMs && nowMs <= endMs) return "live";
  const diffMin = (startMs - nowMs) / 60000;
  if (diffMin <= 30) return "imminent";
  if (diffMin <= 240) return "soon";
  return "today";
}

function formatCountdown(msLeft: number): string {
  if (msLeft <= 0) return "00:00:00";
  const totalSec = Math.floor(msLeft / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function LessonCountdownCard({ lessons, studentId, getCategoryFn, onCheckIn }: Props) {
  const [now, setNow] = useState(() => new Date());

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = useMemo(() => {
    const today = localDateISO(now);
    const tomorrow = localDateISO(new Date(now.getTime() + 86400000));
    const enrolled = lessons.filter(
      (l) => l.enrolledStudents.includes(studentId) && l.status === "scheduled"
    );
    // Prioritize today's lessons, then tomorrow
    const todayLessons = enrolled
      .filter((l) => l.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    if (todayLessons.length > 0) return { lesson: todayLessons[0], day: "today" as const };

    const tomorrowLesson = enrolled
      .filter((l) => l.date === tomorrow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
    if (tomorrowLesson) return { lesson: tomorrowLesson, day: "tomorrow" as const };

    return null;
  }, [lessons, studentId, now]);

  if (!target) return null;

  const { lesson, day } = target;
  const cat = getCategoryFn(lesson.categoryId);
  const accentColor = cat?.color ?? "#EAB308";

  const startDt = lessonLocalDateTime(lesson.date, lesson.startTime);
  const endDt = lesson.endTime
    ? lessonLocalDateTime(lesson.date, lesson.endTime)
    : new Date(startDt.getTime() + 60 * 60 * 1000);

  const startMs = startDt.getTime();
  const endMs = endDt.getTime();
  const nowMs = now.getTime();
  const msLeft = startMs - nowMs;

  const state: LessonState =
    day === "tomorrow" ? "tomorrow" : getState(startMs, endMs, nowMs);

  // Don't show card if lesson ended
  if (day === "today" && nowMs > endMs) return null;

  const stateConfig = {
    live:      { bg: "from-red-950/60 to-zinc-950", border: "border-red-500/50", label: "AO VIVO", labelColor: "text-red-400" },
    imminent:  { bg: "from-amber-950/50 to-zinc-950", border: "border-amber-500/50", label: "EM BREVE", labelColor: "text-amber-400" },
    soon:      { bg: "from-zinc-950 to-zinc-950", border: "border-zinc-700/50", label: "HOJE", labelColor: "text-zinc-400" },
    today:     { bg: "from-zinc-950 to-zinc-950", border: "border-zinc-800/60", label: "HOJE", labelColor: "text-zinc-500" },
    tomorrow:  { bg: "from-zinc-950 to-zinc-950", border: "border-zinc-800/40", label: "AMANHÃ", labelColor: "text-zinc-600" },
  };
  const cfg = stateConfig[state];

  return (
    <AnimatePresence>
      <motion.div
        key={lesson.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className={`relative rounded-3xl border ${cfg.border} bg-gradient-to-b ${cfg.bg} overflow-hidden`}
      >
        {/* Category color accent line */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-3xl" style={{ background: accentColor }} />

        {/* Live pulse glow */}
        {state === "live" && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{ background: `radial-gradient(ellipse at 20% 50%, ${accentColor}15 0%, transparent 60%)` }}
          />
        )}

        <div className="px-4 py-3.5 pl-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* Status badge */}
              {state === "live" ? (
                <span className="flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[9px] font-black text-red-400">
                  <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                    <Radio size={8} />
                  </motion.span>
                  AO VIVO
                </span>
              ) : (
                <span className={`text-[9px] font-black uppercase tracking-[0.18em] ${cfg.labelColor}`}>
                  {cfg.label}
                </span>
              )}
              {/* Vagas info */}
              <span className="text-[9px] text-zinc-600 flex items-center gap-0.5">
                <Users size={9} />
                {lesson.enrolledStudents.length}/{lesson.maxStudents}
              </span>
            </div>

            {/* Countdown or time */}
            <div className="text-right flex-shrink-0">
              {state === "live" ? (
                <p className="text-xs font-black text-red-300">Em andamento</p>
              ) : state === "tomorrow" ? (
                <p className="text-sm font-black text-zinc-400">{lesson.startTime}</p>
              ) : (
                <motion.p
                  key={formatCountdown(msLeft)}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  className={`font-black tabular-nums text-sm ${state === "imminent" ? "text-amber-300" : "text-zinc-300"}`}
                >
                  {formatCountdown(msLeft)}
                </motion.p>
              )}
              <p className="text-[9px] text-zinc-600">
                {state === "live" ? `até ${lesson.endTime ?? "—"}` :
                 state === "tomorrow" ? "amanhã" :
                 "faltando"}
              </p>
            </div>
          </div>

          {/* Lesson info */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
              <div className="min-w-0">
                <p className="text-sm font-black text-white truncate">
                  {lesson.title || cat?.name || "Treino"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={10} className="text-zinc-600 flex-shrink-0" />
                  <span className="text-[10px] text-zinc-500">
                    {lesson.startTime}{lesson.endTime ? ` – ${lesson.endTime}` : ""}
                  </span>
                  {lesson.locationUrl && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <MapPin size={10} className="text-zinc-600 flex-shrink-0" />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* CTA */}
            {(state === "live" || state === "imminent") && onCheckIn && (
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={onCheckIn}
                className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-black transition-colors ${
                  state === "live"
                    ? "border-red-500/40 bg-red-500/15 text-red-200 hover:bg-red-500/25"
                    : "border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
                }`}
              >
                Check-in
                <ChevronRight size={11} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
