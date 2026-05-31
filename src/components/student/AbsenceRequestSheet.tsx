"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
import type { Lesson } from "@/context/types";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { localDateISO } from "@/lib/dateUtils";

const REASONS = [
  { id: "doenca",     label: "Doença",          emoji: "🤒" },
  { id: "trabalho",   label: "Trabalho",         emoji: "💼" },
  { id: "viagem",     label: "Viagem",           emoji: "✈️" },
  { id: "emergencia", label: "Emergência",       emoji: "🚨" },
  { id: "pessoal",    label: "Motivo pessoal",   emoji: "🙏" },
  { id: "outro",      label: "Outro",            emoji: "💬" },
] as const;

type ReasonId = typeof REASONS[number]["id"];

interface Props {
  lessons: Lesson[];
  studentId: string;
  getCategoryName: (id: string) => string;
  onClose: () => void;
  onRequestReposition?: () => void;
}

type Step = "lesson" | "reason" | "done";

export default function AbsenceRequestSheet({ lessons, studentId, getCategoryName, onClose, onRequestReposition }: Props) {
  const [step, setStep] = useState<Step>("lesson");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedReason, setSelectedReason] = useState<ReasonId | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = localDateISO();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 14);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const upcoming = useMemo(() =>
    lessons
      .filter(
        (l) =>
          l.enrolledStudents.includes(studentId) &&
          l.status === "scheduled" &&
          l.date >= today &&
          l.date <= cutoffStr
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
  , [lessons, studentId, today, cutoffStr]);

  async function handleSubmit() {
    if (!selectedLesson || !selectedReason) return;
    setSubmitting(true);
    setError(null);
    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Sem sessão");

      const res = await fetch("/api/student/report-absence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          lessonDate: selectedLesson.date,
          lessonTitle: selectedLesson.title || getCategoryName(selectedLesson.categoryId) || "Aula",
          lessonTime: selectedLesson.startTime,
          reason: selectedReason,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao comunicar falta");
      setStep("done");
    } catch (e) {
      setError(String(e).replace("Error: ", ""));
    } finally {
      setSubmitting(false);
    }
  }

  const dateLabel = (date: string) => {
    const d = new Date(`${date}T00:00:00`);
    const todayD = new Date(`${today}T00:00:00`);
    const diffDays = Math.round((d.getTime() - todayD.getTime()) / 86400000);
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <AnimatePresence>
      <motion.div
        key="absence-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end justify-center"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="absence-sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-t-3xl border-t border-x border-zinc-800 bg-[#0a0a0a] pb-safe"
          style={{ maxHeight: "85dvh", display: "flex", flexDirection: "column" }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="h-1 w-10 rounded-full bg-zinc-700" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/35 bg-orange-500/10">
                <AlertCircle size={18} className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Comunicar Falta</h2>
                <p className="text-[10px] text-zinc-500">
                  {step === "lesson" ? "Selecione a aula" : step === "reason" ? "Informe o motivo" : "Falta registrada"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* Step: done */}
            {step === "done" && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10"
                >
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </motion.div>
                <div>
                  <p className="text-base font-black text-white">Falta comunicada!</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    O coach foi notificado. Não esqueça de solicitar reposição quando puder.
                  </p>
                </div>
                {selectedLesson && (
                  <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-left">
                    <p className="text-xs font-bold text-zinc-300">
                      {selectedLesson.title || getCategoryName(selectedLesson.categoryId)}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {dateLabel(selectedLesson.date)} · {selectedLesson.startTime}
                    </p>
                  </div>
                )}
                {onRequestReposition && (
                  <button
                    onClick={() => { onClose(); setTimeout(onRequestReposition, 120); }}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-teal-500/35 bg-teal-500/10 py-3 text-sm font-black text-teal-200 hover:bg-teal-500/20 transition-colors"
                  >
                    <span>🔄</span> Solicitar Reposição agora
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 py-3 text-sm font-black text-zinc-400 hover:text-white transition-colors"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Step: select lesson */}
            {step === "lesson" && (
              <div className="space-y-2">
                {upcoming.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <p className="text-sm font-bold text-zinc-400">Sem aulas agendadas nos próximos 14 dias.</p>
                  </div>
                ) : (
                  upcoming.map((lesson) => {
                    const title = lesson.title || getCategoryName(lesson.categoryId) || "Aula";
                    return (
                      <motion.button
                        key={lesson.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setSelectedLesson(lesson); setStep("reason"); }}
                        className="w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/60 px-4 py-3 text-left hover:border-orange-500/30 hover:bg-orange-500/5 transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{title}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {dateLabel(lesson.date)} · {lesson.startTime}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-zinc-600 flex-shrink-0" />
                      </motion.button>
                    );
                  })
                )}
              </div>
            )}

            {/* Step: select reason */}
            {step === "reason" && selectedLesson && (
              <div className="space-y-4">
                {/* Selected lesson recap */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 flex items-center gap-2">
                  <AlertCircle size={13} className="text-orange-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {selectedLesson.title || getCategoryName(selectedLesson.categoryId)}
                    </p>
                    <p className="text-[10px] text-zinc-500">{dateLabel(selectedLesson.date)} · {selectedLesson.startTime}</p>
                  </div>
                </div>

                {/* Reason chips */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-2">Motivo</p>
                  <div className="grid grid-cols-3 gap-2">
                    {REASONS.map((r) => (
                      <motion.button
                        key={r.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedReason(r.id)}
                        className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition-all ${
                          selectedReason === r.id
                            ? "border-orange-500/60 bg-orange-500/15 text-white"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-xl">{r.emoji}</span>
                        <span className="text-[10px] font-bold leading-tight">{r.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Optional notes */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-2">Observação (opcional)</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Terei alta médica para amanhã…"
                    maxLength={300}
                    rows={2}
                    className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-orange-500/40 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 font-bold">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("lesson")}
                    className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-black text-zinc-400 hover:text-white transition-colors"
                  >
                    Voltar
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={!selectedReason || submitting}
                    onClick={handleSubmit}
                    className="flex-[2] flex items-center justify-center gap-2 rounded-2xl border border-orange-500/40 bg-orange-500/15 py-3 text-sm font-black text-orange-200 hover:bg-orange-500/25 transition-colors disabled:opacity-40"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                    Comunicar Falta
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
