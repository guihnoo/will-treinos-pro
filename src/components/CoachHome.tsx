"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarRange, Check, X, ShieldAlert, UserCheck,
  Clock, MapPin, Star, ChevronRight
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import FeedbackModal from "@/components/FeedbackModal";
import LessonDetailModal from "@/components/LessonDetailModal";
import PerformanceEvalModal from "@/components/PerformanceEvalModal";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import WeatherWidget from "@/components/WeatherWidget";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

export default function CoachHome() {
  const {
    todayLessons, getStudent, getCategory, getVenue,
    checkInStudent, user
  } = useApp();
  const { toast } = useToast();
  const [lessonModal, setLessonModal] = useState<string | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<{ lessonId: string; studentId: string } | null>(null);
  const [evalTarget, setEvalTarget] = useState<{ lessonId: string; lessonTitle: string; studentId: string } | null>(null);
  const hasModalOpen = Boolean(lessonModal || feedbackTarget || evalTarget);
  useBodyScrollLock(hasModalOpen);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const totalStudentsToday = todayLessons.reduce((a, l) => a + l.enrolledStudents.length, 0);
  const totalPresent = todayLessons.reduce((a, l) => a + l.presentStudents.length, 0);
  const totalAbsent = todayLessons.reduce((a, l) => a + l.absentStudents.length, 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-28">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {greeting()}, <span className="text-[#EAB308]">Coach {user?.name.split(" ")[0]}</span> 🏐
          </h1>
          <p className="text-zinc-500 mt-1">
            {todayLessons.length} aula{todayLessons.length !== 1 ? "s" : ""} hoje &bull; {totalStudentsToday} alunos esperados
          </p>
        </div>
        <WeatherWidget />
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#0A0A0A] border border-zinc-800/60 rounded-xl p-4 text-center">
          <CalendarRange className="w-5 h-5 text-[#EAB308] mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{todayLessons.length}</p>
          <p className="text-[11px] text-zinc-500 font-medium">Aulas</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-[#0A0A0A] border border-zinc-800/60 rounded-xl p-4 text-center">
          <UserCheck className="w-5 h-5 text-[#22C55E] mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{totalPresent}</p>
          <p className="text-[11px] text-zinc-500 font-medium">Presentes</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#0A0A0A] border border-zinc-800/60 rounded-xl p-4 text-center">
          <ShieldAlert className="w-5 h-5 text-[#EF4444] mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{totalAbsent}</p>
          <p className="text-[11px] text-zinc-500 font-medium">Faltas</p>
        </motion.div>
      </div>

      {/* Lesson Cards */}
      <div className="space-y-4">
        {todayLessons.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl">
            <CalendarRange className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
            <p className="text-zinc-600 font-medium">Nenhuma aula agendada para hoje.</p>
            <Link href="/agenda" className="text-sm text-[#EAB308] font-bold hover:underline mt-2 inline-block">
              Ver Agenda Completa →
            </Link>
          </motion.div>
        )}

        {todayLessons.map((lesson, i) => {
          const cat = getCategory(lesson.categoryId);
          const venue = getVenue(lesson.venueId);
          const presentCount = lesson.presentStudents.length;
          const enrolledCount = lesson.enrolledStudents.length;
          const isOngoing = lesson.status === "in-progress";
          const isDone = lesson.status === "completed";

          return (
            <motion.div key={lesson.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className={`bg-[#0A0A0A] border rounded-2xl overflow-hidden ${
                isOngoing ? "border-[#EF4444]/40" : isDone ? "border-[#22C55E]/30" : "border-zinc-800/60"
              }`}
            >
              {/* Lesson Header */}
              <div onClick={() => setLessonModal(lesson.id)}
                className="p-4 cursor-pointer hover:bg-zinc-900/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: `${cat?.color}20` }}>
                      {cat?.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{lesson.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-black"
                          style={{ background: cat?.color }}>{cat?.name}</span>
                        {isOngoing && (
                          <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                            className="text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-full border border-[#EF4444]/30">
                            🔴 AO VIVO
                          </motion.span>
                        )}
                        {isDone && (
                          <span className="text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full">
                            ✓ Concluída
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.startTime} - {lesson.endTime}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {venue?.name || "Local"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-bold text-white">{presentCount}</span>
                      <span className="text-xs text-zinc-600">/{enrolledCount}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-zinc-900 rounded-full mt-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: enrolledCount > 0 ? `${(presentCount / enrolledCount) * 100}%` : "0%" }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#EAB308] to-[#22C55E]"
                  />
                </div>
              </div>

              {/* Student checkin list */}
              <div className="divide-y divide-zinc-900/80 border-t border-zinc-900">
                {lesson.enrolledStudents.map(sid => {
                  const st = getStudent(sid);
                  if (!st) return null;
                  const isPresent = lesson.presentStudents.includes(sid);
                  const isAbsent = lesson.absentStudents.includes(sid);
                  return (
                    <div key={sid} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img src={st.avatar?.startsWith("data:") ? st.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${st.avatar}`}
                          className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
                        <span className="text-sm text-zinc-300 truncate">{st.name}</span>
                        {isPresent && <span className="text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full flex-shrink-0">✓</span>}
                        {isAbsent && <span className="text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-full flex-shrink-0">✗</span>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <motion.button whileTap={{ scale: 0.85 }}
                          onClick={() => checkInStudent(lesson.id, sid, true)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isPresent ? "bg-[#22C55E] text-white" : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-[#22C55E]"}`}>
                          <Check className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.85 }}
                          onClick={() => checkInStudent(lesson.id, sid, false)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isAbsent ? "bg-[#EF4444] text-white" : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-[#EF4444]"}`}>
                          <X className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.85 }}
                          onClick={() => setEvalTarget({ lessonId: lesson.id, lessonTitle: lesson.title, studentId: sid })}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/20 transition-all">
                          <Star className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lesson Detail Modal */}
      <AnimatePresence>
        {lessonModal && (() => {
          const lesson = todayLessons.find(l => l.id === lessonModal);
          return lesson ? <LessonDetailModal lesson={lesson} onClose={() => setLessonModal(null)} /> : null;
        })()}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackTarget && (() => {
          const st = getStudent(feedbackTarget.studentId);
          return st ? <FeedbackModal lessonId={feedbackTarget.lessonId} student={st} onClose={() => setFeedbackTarget(null)} /> : null;
        })()}
      </AnimatePresence>

      {/* Performance Eval Modal */}
      <AnimatePresence>
        {evalTarget && (() => {
          const st = getStudent(evalTarget.studentId);
          return st ? (
            <PerformanceEvalModal
              student={st}
              lessonId={evalTarget.lessonId}
              lessonTitle={evalTarget.lessonTitle}
              onClose={() => setEvalTarget(null)}
            />
          ) : null;
        })()}
      </AnimatePresence>
    </div>
  );
}
