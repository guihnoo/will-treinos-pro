"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Radio,
} from "lucide-react";
import type { CourtLocation, Lesson } from "@/context/types";
import { lessonLocalDateTime, localDateISO } from "@/lib/dateUtils";
import GeoCheckInButton from "@/components/student/GeoCheckInButton";

interface Props {
  lessons: Lesson[];
  studentId: string;
  userId: string;
  localNow: Date | null;
  courtLocation?: CourtLocation | null;
  getCategory: (id: string) => { name: string; color?: string } | undefined;
  onOpenLesson: (lesson: Lesson) => void;
  onOpenAgenda: () => void;
  onCheckIn: (lessonId: string, userId: string) => void;
  onGeoCheckIn: (lessonId: string, userId: string, isAtCourt: boolean) => void;
  ctaClass?: string;
}

function checkInGate(lesson: Lesson, localNow: Date | null) {
  if (!localNow) {
    return { locked: true, reason: "Sincronizando horário local...", unlockLabel: "" };
  }
  const lessonStart = lessonLocalDateTime(lesson.date, lesson.startTime);
  const unlockAt = new Date(lessonStart.getTime() - 60 * 60 * 1000);
  const sameDay = lesson.date === localDateISO(localNow);
  const unlocked = sameDay && localNow.getTime() >= unlockAt.getTime();
  const unlockLabel = unlockAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return {
    locked: !unlocked,
    reason: sameDay ? `Check-in libera às ${unlockLabel}` : "Check-in disponível apenas no dia da aula",
    unlockLabel,
  };
}

function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return "Agora!";
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export default function NextLessonCard({
  lessons,
  studentId,
  userId,
  localNow,
  courtLocation,
  getCategory,
  onOpenLesson,
  onOpenAgenda,
  onCheckIn,
  onGeoCheckIn,
  ctaClass = "",
}: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const nextLesson = useMemo(() => {
    void tick;
    return lessons
      .filter((l) => l.status === "scheduled" || l.status === "in-progress")
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0];
  }, [lessons, tick]);

  const countdown = useMemo(() => {
    if (!nextLesson) return "";
    const target = lessonLocalDateTime(nextLesson.date, nextLesson.startTime);
    return formatCountdown(target.getTime() - Date.now());
  }, [nextLesson, tick]);

  if (!studentId) return null;

  if (!nextLesson) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-5 text-center"
      >
        <CalendarIcon className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
        <p className="text-sm text-zinc-500">Nenhum treino agendado no momento.</p>
        <button
          type="button"
          onClick={onOpenAgenda}
          className={`mt-2 text-[11px] font-bold text-[#EAB308] ${ctaClass}`}
        >
          Ver agenda completa
        </button>
      </motion.div>
    );
  }

  const gate = checkInGate(nextLesson, localNow);
  const cat = getCategory(nextLesson.categoryId);
  const title = nextLesson.title || cat?.name || "Próxima aula";

  const renderCheckIn = () => {
    if (nextLesson.presentStudents.includes(userId)) {
      return (
        <div className="flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl border border-[#22C55E]/35 bg-[#22C55E]/10 px-3 py-2 text-[#22C55E]">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-[10px] font-bold">Confirmado</span>
        </div>
      );
    }
    if (nextLesson.checkInRequests?.find((r) => r.studentId === userId)?.status === "pending") {
      return (
        <div className="flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10 px-3 py-2">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <Clock className="h-5 w-5 text-[#EAB308]" />
          </motion.div>
          <span className="text-[10px] font-bold text-[#EAB308]">Aguardando</span>
        </div>
      );
    }
    if (gate.locked) {
      return (
        <div className="flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-center">
          <Lock className="h-5 w-5 text-zinc-500" />
          <span className="text-[10px] font-bold text-zinc-500">Bloqueado</span>
          <span className="max-w-[64px] text-[9px] text-zinc-600">{gate.unlockLabel}</span>
        </div>
      );
    }
    if (courtLocation?.lat) {
      return (
        <GeoCheckInButton
          courtLocation={courtLocation}
          onCheckIn={(isAtCourt) => {
            if (!userId) return;
            onGeoCheckIn(nextLesson.id, userId, isAtCourt);
          }}
          className={`flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl bg-[#EAB308] px-3 py-2 font-bold text-black shadow-[0_0_16px_rgba(234,179,8,0.3)] ${ctaClass}`}
        >
          <MapPin className="h-5 w-5" />
          <span className="text-[10px]">Check-in</span>
        </GeoCheckInButton>
      );
    }
    return (
      <motion.button
        whileTap={{ scale: 0.92 }}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!userId) return;
          onCheckIn(nextLesson.id, userId);
        }}
        className={`flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl bg-[#EAB308] px-3 py-2 font-bold text-black shadow-[0_0_16px_rgba(234,179,8,0.3)] ${ctaClass}`}
      >
        <MapPin className="h-5 w-5" />
        <span className="text-[10px]">Check-in</span>
      </motion.button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      role="button"
      tabIndex={0}
      onClick={() => onOpenLesson(nextLesson)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenLesson(nextLesson);
        }
      }}
      className="cursor-pointer rounded-2xl border border-[#EAB308]/30 bg-zinc-950/60 p-4 backdrop-blur-xl transition-all hover:border-[#EAB308]/50"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#EAB308]">
              Próxima aula
            </span>
            {countdown && (
              <span className="flex items-center gap-1 rounded-full border border-[#EAB308]/25 bg-[#EAB308]/10 px-2 py-0.5 text-[10px] font-bold text-[#EAB308]">
                <Clock className="h-3 w-3" />
                {countdown}
              </span>
            )}
            {nextLesson.status === "in-progress" && (
              <span className="flex animate-pulse items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-black text-red-400">
                <Radio className="h-2.5 w-2.5" />
                Ao vivo
              </span>
            )}
          </div>
          <p className="truncate text-base font-bold text-white">{title}</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {nextLesson.startTime}
            {nextLesson.endTime ? `–${nextLesson.endTime}` : ""} · {nextLesson.enrolledStudents.length} alunos
          </p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>{renderCheckIn()}</div>
      </div>
    </motion.div>
  );
}
