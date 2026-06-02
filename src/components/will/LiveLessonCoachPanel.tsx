"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Radio,
  Users,
  Play,
  Pause,
  X,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  BarChart3,
} from "lucide-react";
import type { Lesson, Student } from "@/context/types";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import UserAvatar from "@/components/ui/UserAvatar";
import { SPRING_PREMIUM } from "@/components/ui/motionTokens";

interface LiveLessonCoachPanelProps {
  lesson: Lesson;
  students: Student[];
  onClose: () => void;
  onEndClass?: () => void;
}

const FADE_IN = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export default function LiveLessonCoachPanel({
  lesson,
  students,
  onClose,
  onEndClass,
}: LiveLessonCoachPanelProps) {
  const { presence, isLive } = useRealtimePresence(lesson.id);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(60); // Default 60 min
  const [showSummary, setShowSummary] = useState(false);

  // Auto-increment elapsed time when running
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const handleEndClass = () => {
    setShowSummary(true);
  };

  const handleConfirmEnd = () => {
    setShowSummary(false);
    onEndClass?.();
  };

  const enrolledStudents = useMemo(
    () =>
      lesson.enrolledStudents
        .map((id) => students.find((s) => s.id === id))
        .filter(Boolean) as Student[],
    [lesson.enrolledStudents, students],
  );

  const presentStudents = enrolledStudents.filter((s) =>
    (lesson.presentStudents ?? []).includes(s.id),
  );
  const absentStudents = enrolledStudents.filter((s) =>
    (lesson.absentStudents ?? []).includes(s.id),
  );
  const onlineStudents = enrolledStudents.filter((s) =>
    presence.has(s.id),
  );

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const progressPercent = (elapsedSeconds / (totalMinutes * 60)) * 100;
  const isOvertime = elapsedSeconds > totalMinutes * 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={SPRING_PREMIUM}
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-xl mx-4 bg-gradient-to-br from-black via-zinc-950 to-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/50">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Ao Vivo
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-5 space-y-4">
          {/* Lesson Title */}
          <div>
            <h3 className="text-sm font-bold text-white mb-1">{lesson.title}</h3>
            <p className="text-xs text-zinc-500">
              {new Date(`${lesson.date}T12:00:00`).toLocaleDateString("pt-BR")} •{" "}
              {lesson.startTime} {lesson.lessonType ? `• ${lesson.lessonType}` : ""}
            </p>
          </div>

          {/* Timer Section */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase">
                Duração
              </span>
              <span className="text-xs text-zinc-500">
                {totalMinutes} min total
              </span>
            </div>

            {/* Time Display */}
            <div className="text-center py-2">
              <div
                className={`text-4xl font-bold tabular-nums transition ${
                  isOvertime ? "text-red-400" : "text-[#EAB308]"
                }`}
              >
                {formatTime(elapsedSeconds)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  isOvertime ? "bg-red-500" : "bg-[#EAB308]"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 justify-between">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  isRunning
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-[#EAB308]/20 text-[#EAB308] hover:bg-[#EAB308]/30"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3 h-3" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    Iniciar
                  </>
                )}
              </button>
              <select
                value={totalMinutes}
                onChange={(e) => setTotalMinutes(Number(e.target.value))}
                className="px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white hover:border-white/20 transition"
              >
                {[30, 45, 60, 75, 90].map((m) => (
                  <option key={m} value={m}>
                    {m}m
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Presence Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase">
                Conectados
              </span>
              <div className="flex items-center gap-1">
                {isLive ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-400 font-semibold">
                      {onlineStudents.length}/{enrolledStudents.length}
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-zinc-600" />
                    <span className="text-xs text-zinc-600">—</span>
                  </>
                )}
              </div>
            </div>

            {/* Student Grid */}
            {enrolledStudents.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                <AnimatePresence>
                  {enrolledStudents.map((student) => {
                    const isOnline = presence.has(student.id);
                    const isPresent = presentStudents.includes(student);
                    const isAbsent = absentStudents.includes(student);

                    return (
                      <motion.div
                        key={student.id}
                        {...FADE_IN}
                        className="flex flex-col items-center gap-2 p-2 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition"
                      >
                        <div className="relative">
                          <UserAvatar
                            photo={student.avatar}
                            name={student.name}
                            size="sm"
                          />
                          {/* Status indicator */}
                          <div
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                              isOnline
                                ? "bg-green-500"
                                : isAbsent
                                  ? "bg-red-500"
                                  : "bg-zinc-600"
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-white text-center line-clamp-2">
                          {student.name}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-zinc-600">
                Nenhum aluno inscrito
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="bg-black/40 border border-white/5 rounded-lg p-3 text-center">
              <div className="text-[11px] text-zinc-500 mb-1">Presentes</div>
              <div className="text-lg font-bold text-emerald-400">
                {presentStudents.length}
              </div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-lg p-3 text-center">
              <div className="text-[11px] text-zinc-500 mb-1">Ausentes</div>
              <div className="text-lg font-bold text-red-400">
                {absentStudents.length}
              </div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-lg p-3 text-center">
              <div className="text-[11px] text-zinc-500 mb-1">Não conf.</div>
              <div className="text-lg font-bold text-zinc-400">
                {enrolledStudents.length -
                  presentStudents.length -
                  absentStudents.length}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {onEndClass && (
            <button
              onClick={handleEndClass}
              className="w-full py-2 px-4 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500/30 transition border border-red-500/30"
            >
              Encerrar Aula
            </button>
          )}
        </div>

        {/* Summary Overlay */}
        <AnimatePresence>
          {showSummary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border border-[#EAB308]/25 rounded-2xl p-6 w-[90%] max-w-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-5 h-5 text-[#EAB308]" />
                  <h3 className="text-base font-black text-white">Resumo da Aula</h3>
                </div>

                <div className="space-y-3 mb-5">
                  {/* Duration */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[12px] font-bold text-zinc-400 uppercase">Duração</span>
                    <span className="text-base font-black text-[#EAB308]">
                      {formatTime(elapsedSeconds)}
                    </span>
                  </div>

                  {/* Attendance */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[12px] font-bold text-zinc-400 uppercase">Presença</span>
                    <span className="text-base font-black text-emerald-400">
                      {presentStudents.length}/{enrolledStudents.length} alunos
                      {enrolledStudents.length > 0 && (
                        <span className="text-xs text-zinc-500 ml-2">
                          ({Math.round((presentStudents.length / enrolledStudents.length) * 100)}%)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Absent Students */}
                  {absentStudents.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-[11px] font-bold text-red-400 uppercase mb-2">Ausentes</p>
                      <div className="flex flex-wrap gap-2">
                        {absentStudents.map((student) => (
                          <span
                            key={student.id}
                            className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-300 font-semibold"
                          >
                            {student.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={handleConfirmEnd}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#EAB308] to-amber-600 text-black text-sm font-black uppercase tracking-wide hover:shadow-[0_10px_25px_rgba(234,179,8,0.3)] transition-shadow"
                >
                  Finalizar Aula →
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
