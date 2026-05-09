"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarRange, CalendarPlus, Check, Copy, X, ShieldAlert, UserCheck,
  Clock, MapPin, Star, ChevronRight, UserPlus, Dumbbell, Edit2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLessons } from "@/context/LessonsContext";
import { useStudents } from "@/context/StudentsContext";
import { useCheckIn } from "@/context/CheckInContext";
import { useAppConfig } from "@/context/AppConfigContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCoaching } from "@/context/CoachingContext";
import { useGamification } from "@/context/GamificationContext";
import FeedbackModal from "@/components/FeedbackModal";
import LessonDetailModal from "@/components/LessonDetailModal";
import PerformanceEvalModal from "@/components/PerformanceEvalModal";
import TrainingPlanEditor from "@/components/TrainingPlanEditor";
import InlineEvalPanel from "@/components/InlineEvalPanel";
import PushPermissionBanner from "@/components/PushPermissionBanner";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import WeatherWidget from "@/components/WeatherWidget";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import CreateLessonModal from "@/components/CreateLessonModal";
import { localDateISO } from "@/lib/dateUtils";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";
import { avatarSrc } from "@/lib/avatarSrc";

export default function CoachHome() {
  const { cadastroInviteUrl } = useAppConfig();
  const { getCategory, getVenue } = useCatalog();
  const { user } = useAuth();
  const { todayLessons, todayEnrolledCount, todayPresentCount, todayAbsentCount } = useLessons();
  const { getStudent, students } = useStudents();
  const { checkInStudent } = useCheckIn();
  const { trainingPlans, addFeedback } = useCoaching();
  const { logXP, calculateXP } = useGamification();
  const { toast } = useToast();
  const [lessonModal, setLessonModal] = useState<string | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<{ lessonId: string; studentId: string } | null>(null);
  const [evalTarget, setEvalTarget] = useState<{ lessonId: string; lessonTitle: string; studentId: string } | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<{ lessonId: string; studentId: string } | null>(null);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [trainingEditorStudent, setTrainingEditorStudent] = useState<string | null>(null);
  const [editingTrainingPlanId, setEditingTrainingPlanId] = useState<string | null>(null);
  const hasModalOpen = Boolean(lessonModal || feedbackTarget || evalTarget || showCreateLesson || trainingEditorStudent || expandedPanel);
  useBodyScrollLock(hasModalOpen);
  const ctaClass = `${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD}`;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

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
            {todayLessons.length} aula{todayLessons.length !== 1 ? "s" : ""} hoje &bull; {todayEnrolledCount} alunos esperados
          </p>
        </div>
        <WeatherWidget />
      </motion.div>

      <PushPermissionBanner role="professor" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#EAB308]/25 bg-[#EAB308]/8 p-4">
          <div className="flex items-center gap-2 text-[#EAB308]">
            <UserPlus className="h-5 w-5" />
            <p className="text-xs font-black uppercase tracking-wider">Novo aluno</p>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">Mesmo convite do cockpit (?invite). Aprovações em Alunos.</p>
          <div className="mt-3 flex flex-col gap-2">
            {cadastroInviteUrl ? (
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(cadastroInviteUrl);
                  toast("Link de matrícula copiado.");
                }}
                className={`w-full rounded-xl border border-[#EAB308]/40 bg-black/30 py-2.5 text-xs font-bold text-[#EAB308] hover:bg-[#EAB308]/10 ${ctaClass}`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Copy className="h-3.5 w-3.5" />
                  Copiar link
                </span>
              </button>
            ) : null}
            <Link
              href="/alunos"
              className={`flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-zinc-200 hover:border-[#EAB308]/35 hover:text-[#EAB308] ${ctaClass}`}
            >
              Gestão
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#0A0A0A] p-4">
          <div className="flex items-center gap-2 text-[#EAB308]">
            <CalendarPlus className="h-5 w-5" />
            <p className="text-xs font-black uppercase tracking-wider">Nova aula</p>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">Categoria, horário, local e alunos.</p>
          <button
            type="button"
            onClick={() => setShowCreateLesson(true)}
            className={`mt-3 w-full rounded-xl border border-[#EAB308]/45 bg-gradient-to-r from-[#EAB308]/18 to-transparent py-3 text-sm font-black text-[#EAB308] hover:border-[#EAB308] ${ctaClass}`}
          >
            Montar aula
          </button>
          <Link href="/agenda" className={`mt-2 block text-center text-[10px] font-bold uppercase tracking-wide text-zinc-600 hover:text-zinc-400 ${FOCUS_RING_GOLD}`}>
            Calendário
          </Link>
        </div>
        <div className="rounded-2xl border border-purple-900/30 bg-purple-950/10 p-4">
          <div className="flex items-center gap-2 text-purple-400">
            <Dumbbell className="h-5 w-5" />
            <p className="text-xs font-black uppercase tracking-wider">Treino</p>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">Prescrever treino personalizado.</p>
          <button
            type="button"
            onClick={() => setTrainingEditorStudent("select")}
            className={`mt-3 w-full rounded-xl border border-purple-700/40 bg-purple-700/15 py-2.5 text-xs font-bold text-purple-300 hover:bg-purple-700/25 ${ctaClass}`}
          >
            Prescrever
          </button>
        </div>
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
          <p className="text-xl font-bold text-white">{todayPresentCount}</p>
          <p className="text-[11px] text-zinc-500 font-medium">Presentes</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#0A0A0A] border border-zinc-800/60 rounded-xl p-4 text-center">
          <ShieldAlert className="w-5 h-5 text-[#EF4444] mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{todayAbsentCount}</p>
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
            <button
              type="button"
              onClick={() => setShowCreateLesson(true)}
              className={`mt-3 w-full max-w-xs rounded-xl border border-[#EAB308]/45 bg-[#EAB308]/15 px-4 py-2.5 text-sm font-black text-[#EAB308] hover:bg-[#EAB308]/25 ${ctaClass}`}
            >
              Criar primeira aula do dia
            </button>
            <Link href="/agenda" className={`text-sm text-[#EAB308] font-bold hover:underline mt-3 inline-block ${FOCUS_RING_GOLD}`}>
              Ver agenda no calendário →
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
                    <>
                      <div key={sid} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <img src={avatarSrc(st.avatar, st.name)}
                            className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
                          <span className="text-sm text-zinc-300 truncate">{st.name}</span>
                          {isPresent && <span className="text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full flex-shrink-0">✓</span>}
                          {isAbsent && <span className="text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-full flex-shrink-0">✗</span>}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <motion.button whileTap={{ scale: 0.85 }}
                            onClick={() => checkInStudent(lesson.id, sid, true)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isPresent ? "bg-[#22C55E] text-white" : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-[#22C55E]"} ${FOCUS_RING_GOLD}`}>
                            <Check className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.85 }}
                            onClick={() => checkInStudent(lesson.id, sid, false)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isAbsent ? "bg-[#EF4444] text-white" : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-[#EF4444]"} ${FOCUS_RING_GOLD}`}>
                            <X className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.85 }}
                            onClick={() => setExpandedPanel(expandedPanel?.studentId === sid ? null : { lessonId: lesson.id, studentId: sid })}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              expandedPanel?.studentId === sid
                                ? "bg-[#8B5CF6] text-white"
                                : "bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/20"
                            } ${FOCUS_RING_GOLD}`}>
                            <Star className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Inline Eval Panel */}
                      <AnimatePresence>
                        {expandedPanel?.studentId === sid && expandedPanel?.lessonId === lesson.id && (
                          <InlineEvalPanel
                            studentId={sid}
                            studentName={st.name}
                            lessonId={lesson.id}
                            onSave={async (evaluations) => {
                              // Log XP for each fundamental
                              const fundamentals = ["saque", "passe", "levantamento", "ataque", "bloqueio"] as const;
                              for (const fund of fundamentals) {
                                const score = evaluations[fund];
                                if (score !== undefined) {
                                  const baseXP = calculateXP(score, fund);
                                  await logXP("lesson_rating", 100, 1.0, fund, lesson.id, `Avaliação: ${fund}`);
                                }
                              }
                              // Add feedback to coaching context
                              addFeedback({
                                lessonId: lesson.id,
                                studentId: sid,
                                rating: Math.max(...Object.values(evaluations)),
                                trainingTime: 60,
                                trainingType: "group",
                                strengths: [],
                                improvements: [],
                                professorNote: "",
                                date: new Date().toISOString(),
                              });
                              toast("✓ Avaliação salva com sucesso!", "success");
                              setExpandedPanel(null);
                            }}
                            onClose={() => setExpandedPanel(null)}
                          />
                        )}
                      </AnimatePresence>
                    </>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Active Training Plans */}
      {trainingPlans.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-purple-400" />
            Planos Ativos ({trainingPlans.length})
          </h3>
          <div className="space-y-2">
            {trainingPlans.map((plan) => {
              const student = students.find(s => s.id === plan.studentId);
              if (!student) return null;
              return (
                <motion.div key={plan.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-[#0A0A0A] border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Dumbbell className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm">{plan.title}</p>
                      <p className="text-xs text-zinc-500">{student.name} • {plan.exercises.length} exercícios</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setTrainingEditorStudent(student.id);
                      setEditingTrainingPlanId(plan.id);
                    }}
                    className={`p-2 rounded-lg hover:bg-purple-500/20 text-purple-400 transition-colors ${FOCUS_RING_GOLD}`}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

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

      <CreateLessonModal isOpen={showCreateLesson} onClose={() => setShowCreateLesson(false)} defaultDate={localDateISO()} />

      {/* Training Plan Editor Modal */}
      <AnimatePresence>
        {trainingEditorStudent === "select" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] p-4 flex items-center justify-center"
            onClick={() => {
              setTrainingEditorStudent(null);
              setEditingTrainingPlanId(null);
            }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0A0A0A] border border-zinc-800 rounded-2xl p-6 w-full max-w-sm max-h-[80dvh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">Selecione um aluno</h3>
              <div className="space-y-2">
                {students.filter(s => s.status === "active").map(student => (
                  <button key={student.id}
                    onClick={() => {
                      setTrainingEditorStudent(student.id);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-colors text-left border border-zinc-800 hover:border-purple-700/50">
                    <img src={avatarSrc(student.avatar, student.name)}
                      className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{student.name}</p>
                      <p className="text-xs text-zinc-500">{student.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => {
                setTrainingEditorStudent(null);
                setEditingTrainingPlanId(null);
              }}
                className={`mt-4 w-full py-2 rounded-xl border border-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-900 transition-colors ${FOCUS_RING_GOLD}`}>
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {trainingEditorStudent && trainingEditorStudent !== "select" && (() => {
          const student = students.find(s => s.id === trainingEditorStudent);
          if (!student) return null;
          const existingPlan = editingTrainingPlanId ? trainingPlans.find(p => p.id === editingTrainingPlanId) : undefined;
          return (
            <TrainingPlanEditor
              key="training-editor"
              student={student}
              existingPlan={existingPlan}
              onClose={() => {
                setTrainingEditorStudent(null);
                setEditingTrainingPlanId(null);
              }}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
