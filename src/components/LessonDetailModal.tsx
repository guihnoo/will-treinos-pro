"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Clock, Users, Check, Dumbbell, Star, MessageSquare, Send, BellRing, UserPlus, ArrowUpCircle, Globe,
  Bot, CheckCircle2, ClipboardList, Copy, Loader2, Sparkles
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { LessonRecapResult } from "@/app/api/ai/lesson-recap/route";
import type { Lesson } from "@/context/types";
import { useLessons } from "@/context/LessonsContext";
import { useStudents } from "@/context/StudentsContext";
import { useCheckIn } from "@/context/CheckInContext";
import { useCatalog } from "@/context/CatalogContext";
import { useNotifications } from "@/context/NotificationsContext";
import { buildLessonBroadcastNotification } from "@/lib/notifyStudent";
import { useToast } from "@/components/Toast";
import FeedbackModal from "./FeedbackModal";
import TrainingPlanEditor from "./TrainingPlanEditor";
import { MODAL_BADGE_ENTER, MODAL_HEADER_ENTER, MODAL_OVERLAY_FADE, PRESS_SCALE, SPRING_PREMIUM } from "@/components/ui/motionTokens";
import UserAvatar from "@/components/ui/UserAvatar";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

interface Props { lesson: Lesson; onClose: () => void; layoutId?: string; }

export default function LessonDetailModal({ lesson, onClose, layoutId }: Props) {
  const { getCategory, getVenue, getVenueMapsUrl, venues } = useCatalog();
  const { getStudent, students } = useStudents();
  const { lessons, updateLesson, addToWaitlist, promoteFromWaitlist } = useLessons();
  const { checkInStudent } = useCheckIn();
  const { addNotification } = useNotifications();
  const { toast } = useToast();
  const [feedbackTarget, setFeedbackTarget] = useState<string | null>(null);
  const [trainingTarget, setTrainingTarget] = useState<string | null>(null);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [studentToAdd, setStudentToAdd] = useState("");
  const [recap, setRecap] = useState<LessonRecapResult | null>(null);
  const [generatingRecap, setGeneratingRecap] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [quickStart, setQuickStart] = useState(lesson.startTime);
  const [quickEnd, setQuickEnd] = useState(lesson.endTime);
  const [quickVenueId, setQuickVenueId] = useState(lesson.venueId);
  const [quickLocationUrl, setQuickLocationUrl] = useState(lesson.locationUrl || "");

  const generateRecap = async () => {
    setGeneratingRecap(true);
    try {
      const sb = getSupabaseClient();
      const token = sb ? (await sb.auth.getSession()).data.session?.access_token ?? "" : "";
      const presentNames = lesson.presentStudents
        .map((id) => students.find((s) => s.id === id)?.name.split(" ")[0])
        .filter(Boolean).slice(0, 8) as string[];
      const res = await fetch("/api/ai/lesson-recap", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          date: lesson.date,
          presentCount: lesson.presentStudents.length,
          enrolledCount: lesson.enrolledStudents.length,
          presentStudentNames: presentNames,
        }),
      });
      if (!res.ok) throw new Error("api_error");
      setRecap(await res.json() as LessonRecapResult);
    } catch {
      toast("Não foi possível gerar o resumo. Tente novamente.");
    } finally {
      setGeneratingRecap(false);
    }
  };

  const cat = getCategory(lesson.categoryId);
  const venue = getVenue(lesson.venueId);
  const mapsUrl = lesson.locationUrl || getVenueMapsUrl(lesson.venueId);
  useBodyScrollLock(true);

  const presentCount = lesson.presentStudents.length;
  const enrolledCount = lesson.enrolledStudents.length;
  useEffect(() => {
    setQuickStart(lesson.startTime);
    setQuickEnd(lesson.endTime);
    setQuickVenueId(lesson.venueId);
    setQuickLocationUrl(lesson.locationUrl || "");
  }, [lesson.endTime, lesson.locationUrl, lesson.startTime, lesson.venueId]);

  const toMin = (time: string) => {
    const [h, m] = time.split(":").map((n) => Number(n || 0));
    return h * 60 + m;
  };
  const quickInvalidRange = toMin(quickEnd) <= toMin(quickStart);
  const quickConflicts = useMemo(() => {
    if (quickInvalidRange) return [];
    const nextStart = toMin(quickStart);
    const nextEnd = toMin(quickEnd);
    return lessons.filter((item) => {
      if (item.id === lesson.id) return false;
      if (item.date !== lesson.date) return false;
      if (item.venueId !== quickVenueId) return false;
      if (item.status === "completed" || item.status === "cancelled") return false;
      const itemStart = toMin(item.startTime);
      const itemEnd = toMin(item.endTime);
      return nextStart < itemEnd && nextEnd > itemStart;
    });
  }, [lesson.date, lesson.id, lessons, quickEnd, quickInvalidRange, quickStart, quickVenueId]);
  const quickDirty =
    quickStart !== lesson.startTime ||
    quickEnd !== lesson.endTime ||
    quickVenueId !== lesson.venueId ||
    quickLocationUrl.trim() !== (lesson.locationUrl || "");
  const canSaveQuick = quickDirty && !quickInvalidRange && quickConflicts.length === 0;

  return (
    <>
      <motion.div {...MODAL_OVERLAY_FADE}
        data-modal-overlay
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] p-2 sm:p-4 overflow-y-auto"
        onClick={onClose}>
        <div className="min-h-full flex items-end sm:items-center justify-center py-8">
        <motion.div
          layoutId={layoutId}
          initial={layoutId ? undefined : { scale: 0.98, y: 20 }} 
          animate={{ scale: 1, y: 0 }} 
          exit={layoutId ? undefined : { scale: 0.98, y: 20 }}
          transition={SPRING_PREMIUM}
          onClick={e => e.stopPropagation()}
          className="bg-[#0A0A0A] border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg relative overflow-hidden max-h-[calc(100dvh-1rem)] flex flex-col"
        >
          {/* Header Banner */}
          <div className="relative p-5 pb-4" style={{ background: `linear-gradient(135deg, ${cat?.color}15 0%, transparent 70%)` }}>
            <motion.button whileTap={PRESS_SCALE} onClick={onClose} className="absolute top-3 right-3 text-zinc-600 hover:text-white p-1.5 rounded-lg hover:bg-zinc-900/50">
              <X className="w-5 h-5" />
            </motion.button>
            <motion.div {...MODAL_HEADER_ENTER} transition={SPRING_PREMIUM} className="flex items-center gap-2 mb-3">
              <motion.span {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className="text-[10px] font-bold px-2.5 py-0.5 rounded-md text-black uppercase tracking-wider"
                style={{ background: cat?.color }}>{cat?.emoji} {cat?.name}</motion.span>
              <motion.span {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                lesson.status === "completed" ? "bg-[#22C55E]/10 text-[#22C55E]" :
                lesson.status === "in-progress" ? "bg-[#EAB308]/10 text-[#EAB308]" :
                "bg-zinc-800 text-zinc-400"
              }`}>{lesson.status === "completed" ? "Finalizada" : lesson.status === "in-progress" ? "Em Andamento" : "Agendada"}</motion.span>
            </motion.div>
            <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-zinc-400 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 whitespace-nowrap"><Clock className="w-4 h-4 text-[#EAB308]" /> {lesson.startTime} - {lesson.endTime}</span>
              <a href={mapsUrl} target="_blank" rel="noopener"
                className="flex items-center gap-1.5 hover:text-[#EAB308] transition-colors min-w-0">
                <MapPin className="w-4 h-4" /> {venue?.name || "Local"} <Globe className="w-3 h-3" />
              </a>
              <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                {lesson.lessonType || "Grupo"} · {lesson.maxStudents} vagas
              </span>
            </div>
            {/* Share to WhatsApp Button */}
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={PRESS_SCALE}
              onClick={() => {
                const text = `*Aula de Vôlei: ${lesson.title}*\n⏰ ${lesson.startTime} às ${lesson.endTime}\n📍 ${venue?.name || 'Local'}\n\nConfirme sua presença pelo app!`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="absolute bottom-4 right-5 w-8 h-8 bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center rounded-lg hover:bg-[#22C55E]/20 transition-all border border-[#22C55E]/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
              title="Compartilhar Aula"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </motion.button>
          </div>

          {/* Progress */}
          <div className="px-5 py-3 border-t border-zinc-900/50 shrink-0">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-zinc-500">Presença</span>
              <span className="font-bold text-white">{presentCount}/{enrolledCount}</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: enrolledCount > 0 ? `${(presentCount / enrolledCount) * 100}%` : "0%" }}
                transition={{ type: "spring", stiffness: 50, damping: 15 }}
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#EAB308] to-[#22C55E] shadow-[0_0_10px_#22C55E]"
              />
            </div>
          </div>

          {/* Quick schedule editor */}
          <div className="px-5 py-3 border-t border-zinc-900/50 bg-zinc-950/35 shrink-0">
            <h3 className="text-xs font-bold text-[#EAB308] uppercase tracking-wider mb-2">
              Ajuste rápido de agenda
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Início</label>
                <input
                  type="time"
                  value={quickStart}
                  onChange={(e) => setQuickStart(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#EAB308]/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Fim</label>
                <input
                  type="time"
                  value={quickEnd}
                  onChange={(e) => setQuickEnd(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#EAB308]/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Local</label>
                <select
                  value={quickVenueId}
                  onChange={(e) => setQuickVenueId(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#EAB308]/50"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Link GPS (opcional)</label>
              <input
                value={quickLocationUrl}
                onChange={(e) => setQuickLocationUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=-22.99,-43.36"
                className="min-h-11 w-full rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#EAB308]/50 placeholder-zinc-600"
              />
            </div>
            {quickInvalidRange ? (
              <p className="mt-2 rounded-lg border border-red-500/35 bg-red-500/10 px-2.5 py-2 text-[11px] font-bold text-red-300">
                Horário inválido: término precisa ser depois do início.
              </p>
            ) : null}
            {quickConflicts.length > 0 ? (
              <p className="mt-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-200">
                Conflito de quadra com {quickConflicts[0].title} ({quickConflicts[0].startTime}-{quickConflicts[0].endTime})
                {quickConflicts.length > 1 ? ` +${quickConflicts.length - 1} aula(s)` : ""}.
              </p>
            ) : null}
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuickStart(lesson.startTime);
                  setQuickEnd(lesson.endTime);
                  setQuickVenueId(lesson.venueId);
                  setQuickLocationUrl(lesson.locationUrl || "");
                }}
                className="min-h-11 flex-1 rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-xs font-bold text-zinc-300 hover:border-zinc-700"
              >
                Reverter
              </button>
              <button
                type="button"
                disabled={!canSaveQuick}
                onClick={() => {
                  updateLesson(lesson.id, {
                    startTime: quickStart,
                    endTime: quickEnd,
                    venueId: quickVenueId,
                    locationUrl: quickLocationUrl.trim(),
                  });
                  toast("Ajuste da agenda salvo.");
                }}
                className={`min-h-11 flex-1 rounded-xl border px-3 py-2 text-xs font-black transition ${
                  canSaveQuick
                    ? "border-[#EAB308]/40 bg-[#EAB308]/15 text-[#EAB308] hover:bg-[#EAB308]/20"
                    : "cursor-not-allowed border-zinc-800 bg-zinc-900/60 text-zinc-600"
                }`}
              >
                Salvar ajuste rápido
              </button>
            </div>
          </div>

          {/* Students */}
          <div className="px-5 py-3 border-t border-zinc-900/50 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Alunos Inscritos ({enrolledCount})
              </h3>
              
              <div className="flex items-center gap-2">
                <select 
                  value={studentToAdd}
                  onChange={e => setStudentToAdd(e.target.value)}
                  className="bg-black border border-zinc-800 text-xs text-zinc-400 rounded-lg px-2 py-1 w-32 outline-none"
                >
                  <option value="">+ Adicionar</option>
                  {students.filter(s => s.status === 'active' && !lesson.enrolledStudents.includes(s.id) && !(lesson.waitlist || []).includes(s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.name.split(' ')[0]}</option>
                  ))}
                </select>
                {studentToAdd && (
                  <motion.button 
                    whileTap={PRESS_SCALE}
                    onClick={() => {
                      if (enrolledCount >= lesson.maxStudents) {
                        addToWaitlist(lesson.id, studentToAdd);
                        toast("Aula lotada! Aluno adicionado à Fila de Espera.");
                      } else {
                        updateLesson(lesson.id, { enrolledStudents: [...lesson.enrolledStudents, studentToAdd] });
                        toast("Aluno matriculado na aula.");
                      }
                      setStudentToAdd("");
                    }}
                    className="w-6 h-6 flex items-center justify-center bg-[#EAB308] text-black rounded-md hover:bg-[#D9A406]"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </div>
            </div>
            {enrolledCount === 0 && (
              <p className="text-sm text-zinc-600 text-center py-4">Nenhum aluno inscrito</p>
            )}
            <div className="space-y-1.5">
              {lesson.enrolledStudents.map(sid => {
                const st = getStudent(sid);
                const isPresent = lesson.presentStudents.includes(sid);
                const isAbsent = lesson.absentStudents.includes(sid);
                if (!st) return null;
                return (
                  <div key={sid} className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-zinc-900/50 group hover:border-zinc-800 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={st.name} photo={st.avatar} size="sm" />
                      <div>
                        <span className="text-sm font-medium text-white">{st.name}</span>
                        {isPresent && <span className="ml-2 text-[10px] text-[#22C55E] font-bold">✓ Presente</span>}
                        {isAbsent && <span className="ml-2 text-[10px] text-[#EF4444] font-bold">✗ Falta</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <motion.button whileTap={PRESS_SCALE}
                        animate={isPresent ? { scale: [1, 1.2, 1], boxShadow: ["0 0 0px #22C55E", "0 0 15px #22C55E", "0 0 0px #22C55E"] } : {}}
                        transition={{ duration: 0.4 }}
                        onClick={() => { checkInStudent(lesson.id, sid, true); toast(`✓ ${st.name.split(" ")[0]} — presente!`); }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isPresent ? "bg-[#22C55E] text-white border border-[#22C55E]" : "bg-zinc-800/60 text-zinc-500 hover:border-[#22C55E] border border-zinc-700"
                        }`}><Check className="w-3.5 h-3.5" /></motion.button>
                      <motion.button whileTap={PRESS_SCALE}
                        onClick={() => { checkInStudent(lesson.id, sid, false); toast(`✗ ${st.name.split(" ")[0]} — falta`, "error"); }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isAbsent ? "bg-[#EF4444] text-white" : "bg-zinc-800/60 text-zinc-500 hover:border-[#EF4444] border border-zinc-700"
                        }`}><X className="w-3.5 h-3.5" /></motion.button>
                      {isPresent && (
                        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={PRESS_SCALE}
                          onClick={() => setFeedbackTarget(sid)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20 hover:bg-[#EAB308]/20 transition-all">
                          <Star className="w-3.5 h-3.5" />
                        </motion.button>
                      )}
                      <motion.button whileTap={PRESS_SCALE}
                        onClick={() => setTrainingTarget(sid)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/20 transition-all opacity-0 group-hover:opacity-100">
                        <Dumbbell className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Waitlist Section */}
          {(lesson.waitlist && lesson.waitlist.length > 0) && (
            <div className="px-5 py-3 border-t border-zinc-900/50 bg-[#EAB308]/5">
              <h3 className="text-xs font-bold text-[#EAB308] uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserPlus className="w-3.5 h-3.5" /> Fila de Espera ({lesson.waitlist.length})
              </h3>
              <div className="space-y-1.5">
                {lesson.waitlist.map(sid => {
                  const st = getStudent(sid);
                  if (!st) return null;
                  return (
                    <div key={sid} className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-[#EAB308]/20">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={st.name} photo={st.avatar} size="sm" />
                        <span className="text-sm font-medium text-white">{st.name}</span>
                      </div>
                      <motion.button whileTap={PRESS_SCALE}
                        onClick={() => {
                          if (enrolledCount >= lesson.maxStudents) {
                            toast("⚠️ Aula lotada. Remova alguém antes de promover.", "error");
                            return;
                          }
                          promoteFromWaitlist(lesson.id, sid);
                          toast(`✅ ${st.name} promovido para a aula!`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAB308] text-black text-xs font-bold hover:bg-[#D9A406] transition-colors">
                        <ArrowUpCircle className="w-3.5 h-3.5" /> Promover
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {lesson.notes && (
            <div className="px-5 py-3 border-t border-zinc-900/50">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Observações</h3>
              <p className="text-sm text-zinc-400">{lesson.notes}</p>
            </div>
          )}

          {/* Broadcast Message */}
          <div className="px-5 py-4 border-t border-zinc-900/50 bg-black/40">
            <h3 className="text-xs font-bold text-[#EAB308] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" /> Enviar Aviso à Turma
            </h3>
            <div className="flex gap-2 flex-col sm:flex-row">
              <input type="text" placeholder="Ex: Galera, atraso de 10 min..."
                value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
                className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 px-3 text-white text-sm outline-none focus:border-[#EAB308]/50" />
              <motion.button whileTap={PRESS_SCALE}
                onClick={() => {
                  if (!broadcastMsg) return;
                  if (enrolledCount === 0) { toast("Nenhum aluno inscrito."); return; }
                  for (const sid of lesson.enrolledStudents) {
                    addNotification(buildLessonBroadcastNotification(sid, lesson.title, broadcastMsg));
                  }
                  toast("✅ Aviso enviado para a turma toda!");
                  setBroadcastMsg("");
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  broadcastMsg ? "bg-[#EAB308] text-black shadow-md" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}>
                Enviar
              </motion.button>
            </div>
          </div>
        </motion.div>
        </div>
      </motion.div>

      {/* Sub-modals */}
      <AnimatePresence>
        {feedbackTarget && (() => {
          const st = getStudent(feedbackTarget);
          return st ? <FeedbackModal lessonId={lesson.id} student={st} onClose={() => setFeedbackTarget(null)} /> : null;
        })()}
      </AnimatePresence>
      <AnimatePresence>
        {trainingTarget && (() => {
          const st = getStudent(trainingTarget);
          return st ? <TrainingPlanEditor student={st} onClose={() => setTrainingTarget(null)} /> : null;
        })()}
      </AnimatePresence>
    </>
  );
}
