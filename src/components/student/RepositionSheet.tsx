"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, CheckCircle2, Loader2, Zap, Clock, Users, Star } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface Suggestion {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  categoryId: string;
  maxStudents: number;
  spotsLeft: number;
  isMatchingCategory: boolean;
}

interface Props {
  getCategoryName: (id: string) => string;
  absenceRequestId?: string;
  onClose: () => void;
}

type Step = "list" | "confirm" | "done";

function dateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff < 7) return d.toLocaleDateString("pt-BR", { weekday: "long" });
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
}

export default function RepositionSheet({ getCategoryName, absenceRequestId, onClose }: Props) {
  const [step, setStep] = useState<Step>("list");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Sem sessão");

      const res = await fetch("/api/student/reposition-suggestions", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar sugestões");
      setSuggestions(data.suggestions ?? []);
    } catch (e) {
      setError(String(e).replace("Error: ", ""));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleConfirm() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Sem sessão");

      const res = await fetch("/api/student/request-reposition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          targetLessonId:    selected.id,
          targetLessonDate:  selected.date,
          targetLessonTitle: selected.title || getCategoryName(selected.categoryId) || "Aula",
          targetLessonTime:  selected.startTime,
          absenceRequestId:  absenceRequestId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao solicitar reposição");
      setStep("done");
    } catch (e) {
      setError(String(e).replace("Error: ", ""));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="reposition-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end justify-center"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="reposition-sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-t-3xl border-t border-x border-zinc-800 bg-[#0a0a0a] pb-safe"
          style={{ maxHeight: "88dvh", display: "flex", flexDirection: "column" }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="h-1 w-10 rounded-full bg-zinc-700" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-500/35 bg-teal-500/10">
                <RefreshCw size={17} className="text-teal-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Solicitar Reposição</h2>
                <p className="text-[10px] text-zinc-500">
                  {step === "list" ? "Escolha uma aula disponível" : step === "confirm" ? "Confirme a reposição" : "Reposição solicitada"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">

            {/* ── DONE ── */}
            {step === "done" && selected && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-500/40 bg-teal-500/10"
                >
                  <CheckCircle2 size={32} className="text-teal-400" />
                </motion.div>
                <div>
                  <p className="text-base font-black text-white">Reposição confirmada!</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Você foi inscrito na aula. O coach foi notificado.
                  </p>
                </div>
                <div className="w-full rounded-xl border border-teal-800/40 bg-teal-950/30 px-4 py-3 text-left">
                  <p className="text-xs font-black text-teal-300">
                    {selected.title || getCategoryName(selected.categoryId)}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {dateLabel(selected.date)} · {selected.startTime}
                    {selected.endTime ? ` – ${selected.endTime}` : ""}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="mt-2 w-full rounded-2xl border border-teal-500/30 bg-teal-500/10 py-3 text-sm font-black text-teal-200 hover:bg-teal-500/20 transition-colors"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* ── CONFIRM ── */}
            {step === "confirm" && selected && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-teal-800/40 bg-teal-950/20 p-4 space-y-3">
                  {selected.isMatchingCategory && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-teal-400 uppercase tracking-widest">
                      <Star size={10} />
                      Turma compatível com seu plano
                    </div>
                  )}
                  <div>
                    <p className="text-base font-black text-white">
                      {selected.title || getCategoryName(selected.categoryId)}
                    </p>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {getCategoryName(selected.categoryId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Clock size={13} className="text-teal-500" />
                      {dateLabel(selected.date)} · {selected.startTime}
                      {selected.endTime ? ` – ${selected.endTime}` : ""}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Users size={13} className="text-teal-500" />
                      {selected.spotsLeft} vaga{selected.spotsLeft !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500 text-center px-4">
                  Ao confirmar, você será inscrito nesta aula automaticamente. O coach receberá uma notificação.
                </p>

                {error && <p className="text-xs text-red-400 font-bold text-center">{error}</p>}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setStep("list"); setError(null); }}
                    className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-black text-zinc-400 hover:text-white transition-colors"
                  >
                    Voltar
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={submitting}
                    onClick={handleConfirm}
                    className="flex-[2] flex items-center justify-center gap-2 rounded-2xl border border-teal-500/40 bg-teal-500/15 py-3 text-sm font-black text-teal-200 hover:bg-teal-500/25 transition-colors disabled:opacity-40"
                  >
                    {submitting
                      ? <Loader2 size={16} className="animate-spin" />
                      : <CheckCircle2 size={16} />}
                    Confirmar Reposição
                  </motion.button>
                </div>
              </div>
            )}

            {/* ── LIST ── */}
            {step === "list" && (
              <>
                {loading && (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <Loader2 size={24} className="animate-spin text-teal-400" />
                    <p className="text-xs text-zinc-500">Buscando aulas disponíveis…</p>
                  </div>
                )}

                {!loading && error && (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <p className="text-sm font-bold text-zinc-400">{error}</p>
                    <button onClick={load} className="text-xs text-teal-400 font-bold underline">
                      Tentar novamente
                    </button>
                  </div>
                )}

                {!loading && !error && suggestions.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
                      <RefreshCw size={22} className="text-zinc-600" />
                    </div>
                    <p className="text-sm font-bold text-zinc-400">
                      Sem vagas disponíveis nos próximos 21 dias.
                    </p>
                    <p className="text-xs text-zinc-600">
                      Fale com o coach para verificar disponibilidade.
                    </p>
                  </div>
                )}

                {!loading && !error && suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-3">
                      {suggestions.length} aula{suggestions.length !== 1 ? "s" : ""} disponíve{suggestions.length !== 1 ? "is" : "l"}
                    </p>
                    {suggestions.map((s) => {
                      const title = s.title || getCategoryName(s.categoryId) || "Aula";
                      return (
                        <motion.button
                          key={s.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { setSelected(s); setStep("confirm"); }}
                          className="w-full flex items-center gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/60 px-4 py-3 text-left hover:border-teal-500/30 hover:bg-teal-500/5 transition-all group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {s.isMatchingCategory && (
                                <Zap size={10} className="text-teal-400 flex-shrink-0" />
                              )}
                              <p className="text-sm font-bold text-white truncate">{title}</p>
                            </div>
                            <p className="text-[11px] text-zinc-500">
                              {dateLabel(s.date)} · {s.startTime}
                              {s.endTime ? ` – ${s.endTime}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              s.spotsLeft <= 2
                                ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                                : "text-teal-400 border-teal-500/30 bg-teal-500/10"
                            }`}>
                              {s.spotsLeft} vaga{s.spotsLeft !== 1 ? "s" : ""}
                            </span>
                            <span className="text-[10px] text-zinc-600 group-hover:text-teal-500 transition-colors font-bold">
                              Escolher →
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
