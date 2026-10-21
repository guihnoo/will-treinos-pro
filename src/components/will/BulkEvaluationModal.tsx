"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CheckCircle2, Loader2, ChevronLeft, ChevronRight,
  Zap, Users, SlidersHorizontal, LayoutList, WifiOff,
  Star, Target, Shield, TrendingUp, Save
} from "lucide-react";
import type { Lesson, Student } from "@/context/types";
import { useEvaluations, type EvaluationScores } from "@/hooks/useEvaluations";
import UserAvatar from "@/components/ui/UserAvatar";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";
import { useNotifications } from "@/context/NotificationsContext";
import { buildStudentNotification } from "@/lib/notifyStudent";
import { sendPushToUser } from "@/lib/pushRoleBroadcast";
import { triggerHapticImpact, triggerHapticCelebration } from "@/lib/hapticFeedback";
import { offlineCache, type PendingEvaluation } from "@/lib/offlineCache";
import { CourtEvaluationSlider, getScoreStyle } from "./CourtEvaluationSlider";

const PILLARS: { key: keyof EvaluationScores; label: string; short: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { key: "fisico",   label: "Físico",   short: "FIS", icon: Zap,        desc: "Explosão, velocidade e resistência" },
  { key: "tecnico",  label: "Técnico",  short: "TEC", icon: Star,       desc: "Execução mecânica e fundamentos" },
  { key: "tatico",   label: "Tático",   short: "TAT", icon: Target,     desc: "Leitura de jogo e posicionamento" },
  { key: "atitude",  label: "Atitude",  short: "ATI", icon: Shield,     desc: "Foco, garra e comunicação" },
  { key: "evolucao", label: "Evolução", short: "EVO", icon: TrendingUp, desc: "Progresso em relação ao último treino" },
];

const DEFAULT_SCORE = 7;

type StudentScores = Record<string, EvaluationScores & { note: string }>;

interface Props {
  lesson: Lesson;
  students: Student[];
  onClose: () => void;
  onSaved?: () => void;
}

export default function BulkEvaluationModal({ lesson, students, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const { saveEvaluation } = useEvaluations();
  const { addNotification } = useNotifications();

  const enrolled = lesson.presentStudents.length > 0
    ? lesson.presentStudents
    : lesson.enrolledStudents;

  const enrolledStudents = enrolled
    .map(id => students.find(s => s.id === id))
    .filter((s): s is Student => Boolean(s));

  const initScores = (): StudentScores => {
    const s: StudentScores = {};
    for (const st of enrolledStudents) {
      s[st.id] = { fisico: DEFAULT_SCORE, tecnico: DEFAULT_SCORE, tatico: DEFAULT_SCORE, atitude: DEFAULT_SCORE, evolucao: DEFAULT_SCORE, note: "" };
    }
    return s;
  };

  const [scores, setScores] = useState<StudentScores>(initScores);
  const [currentStudentIdx, setCurrentStudentIdx] = useState(0);
  const [viewMode, setViewMode] = useState<"focus" | "table">("focus");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
  const [globalPillar, setGlobalPillar] = useState<keyof EvaluationScores | null>(null);
  const [globalValue, setGlobalValue] = useState(DEFAULT_SCORE);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!saved) return;
    closeTimerRef.current = setTimeout(onClose, 1600);
    return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); };
  }, [saved, onClose]);

  const lessonTitle = lesson.title || "Aula";
  const currentStudent = enrolledStudents[currentStudentIdx];

  const handleScoreChange = (pillar: keyof EvaluationScores, value: number) => {
    if (!currentStudent) return;
    setScores(prev => ({
      ...prev,
      [currentStudent.id]: {
        ...prev[currentStudent.id],
        [pillar]: value,
      },
    }));
  };

  const setStudentNote = (note: string) => {
    if (!currentStudent) return;
    setScores(prev => ({
      ...prev,
      [currentStudent.id]: {
        ...prev[currentStudent.id],
        note,
      },
    }));
  };

  const handlePrevStudent = () => {
    if (currentStudentIdx > 0) {
      triggerHapticImpact("light");
      setCurrentStudentIdx(i => i - 1);
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIdx < enrolledStudents.length - 1) {
      triggerHapticImpact("light");
      setCurrentStudentIdx(i => i + 1);
    }
  };

  function applyGlobalPillar() {
    if (!globalPillar) return;
    triggerHapticImpact("medium");
    setScores(prev => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = { ...next[id], [globalPillar]: globalValue };
      }
      return next;
    });
    toast(`Pilar ${globalPillar.toUpperCase()} definido como ${globalValue} para todos!`);
  }

  function applyAllDefault() {
    triggerHapticImpact("medium");
    setScores(prev => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = { ...next[id], fisico: DEFAULT_SCORE, tecnico: DEFAULT_SCORE, tatico: DEFAULT_SCORE, atitude: DEFAULT_SCORE, evolucao: DEFAULT_SCORE };
      }
      return next;
    });
    toast(`Todas as notas resetadas para ${DEFAULT_SCORE}.`);
  }

  const handleSave = useCallback(async () => {
    setSaving(true);

    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    // Se estiver offline, salva direto no offlineCache
    if (isOffline) {
      const pendingEvals: PendingEvaluation[] = enrolledStudents.map(student => {
        const s = scores[student.id];
        const { note, ...evalScores } = s;
        return {
          id: `offline_eval_${student.id}_${Date.now()}`,
          studentId: student.id,
          studentName: student.name,
          lessonId: lesson.id,
          lessonTitle,
          scores: evalScores,
          notes: note.trim() || undefined,
          savedAt: new Date().toISOString(),
          synced: false,
        };
      });

      offlineCache.savePendingEvaluations(lesson.id, pendingEvals);
      triggerHapticCelebration();
      setIsOfflineSaved(true);
      setSaved(true);
      toast("📡 Gravado localmente no Modo Quadra (Offline). Sincronizará quando a rede voltar!");
      setSaving(false);
      onSaved?.();
      return;
    }

    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      const createdBy = session?.user.id;

      let count = 0;
      for (const student of enrolledStudents) {
        const s = scores[student.id];
        const { note, ...evalScores } = s;
        await saveEvaluation({
          studentId:   student.id,
          lessonId:    lesson.id,
          lessonTitle,
          scores:      evalScores,
          notes:       note.trim() || undefined,
          createdBy,
        });

        // XP Calculation
        const avg = (Object.values(evalScores).reduce((a, b) => a + b, 0) / 5);
        const xp  = Math.round(100 * Math.pow(avg / 10, 2) * 10 * 1.2);
        if (session?.access_token && xp > 0) {
          fetch("/api/xp/integration", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({
              studentId: student.id, points: xp, type: "evaluation",
              multiplierType: "posicionamento", multiplierValue: 1.2,
              sourceEntity: "lesson", sourceId: lesson.id, createdBy,
            }),
          }).catch(() => {});
        }

        addNotification(
          buildStudentNotification(student.id, {
            type: "performance",
            title: "📋 Nova avaliação recebida",
            message: `Nota ${avg.toFixed(1)}/10 em ${lessonTitle}. +${xp} XP creditados.`,
            time: "agora",
            read: false,
            actionUrl: "/dashboard",
          }),
        );

        if (student.authUserId) {
          void sendPushToUser(student.authUserId, {
            title: "📋 Nova avaliação",
            body: `Nota ${avg.toFixed(1)}/10 em ${lessonTitle}.`,
            url: "/dashboard",
          });
        }

        count++;
      }

      triggerHapticCelebration();
      toast(`✅ ${count} avaliações salvas com sucesso!`);
      setSaved(true);
      onSaved?.();
    } catch {
      // Fallback offline caso a conexão caia no meio
      const pendingEvals: PendingEvaluation[] = enrolledStudents.map(student => {
        const s = scores[student.id];
        const { note, ...evalScores } = s;
        return {
          id: `offline_eval_${student.id}_${Date.now()}`,
          studentId: student.id,
          studentName: student.name,
          lessonId: lesson.id,
          lessonTitle,
          scores: evalScores,
          notes: note.trim() || undefined,
          savedAt: new Date().toISOString(),
          synced: false,
        };
      });

      offlineCache.savePendingEvaluations(lesson.id, pendingEvals);
      triggerHapticCelebration();
      setIsOfflineSaved(true);
      setSaved(true);
      toast("⚠️ Rede instável: avaliações armazenadas localmente no Modo Quadra!");
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }, [scores, enrolledStudents, lesson.id, lessonTitle, saveEvaluation, onSaved, toast, addNotification]);

  const currentScores = currentStudent ? scores[currentStudent.id] : null;
  const currentAvg = currentScores
    ? ((currentScores.fisico + currentScores.tecnico + currentScores.tatico + currentScores.atitude + currentScores.evolucao) / 5).toFixed(1)
    : "—";

  const currentAvgStyle = getScoreStyle(parseFloat(currentAvg) || 7);

  const avgAll = enrolledStudents.length > 0
    ? (enrolledStudents.reduce((sum, s) => {
        const sc = scores[s.id];
        return sum + (sc.fisico + sc.tecnico + sc.tatico + sc.atitude + sc.evolucao) / 5;
      }, 0) / enrolledStudents.length).toFixed(1)
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[230] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-[#070707] pb-safe flex flex-col max-h-[95dvh] shadow-2xl overflow-hidden"
      >
        {/* Handle mobile */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-zinc-700" />
        </div>

        {/* Header do Modo Quadra */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-950/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#EAB308]/40 bg-[#EAB308]/15 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <Users size={20} className="text-[#EAB308]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">Avaliar Turma</h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  Modo Quadra
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {enrolledStudents.length} atletas presentes · Média geral: <span className="font-bold text-[#EAB308]">{avgAll}/10</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor de Modo (Foco vs Tabela) */}
            <div className="flex rounded-xl border border-zinc-800 bg-zinc-900/90 p-1">
              <button
                type="button"
                onClick={() => { triggerHapticImpact("light"); setViewMode("focus"); }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "focus"
                    ? "bg-[#EAB308] text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Modo Foco em Quadra (1 Aluno por vez)"
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Foco</span>
              </button>
              <button
                type="button"
                onClick={() => { triggerHapticImpact("light"); setViewMode("table"); }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-[#EAB308] text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Modo Tabela Geral"
              >
                <LayoutList size={14} />
                <span className="hidden sm:inline">Tabela</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="min-h-10 min-w-10 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Banner de Sincronia / Offline */}
        {isOfflineSaved && (
          <div className="flex items-center gap-2 px-5 py-2 border-b border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold">
            <WifiOff size={15} />
            <span>Avaliações salvas no armazenamento local. Sincronização automática ativa.</span>
          </div>
        )}

        {/* ─── CORPO: MODO FOCO EM QUADRA (1 Aluno por vez com Sliders >= 56px) ─── */}
        {viewMode === "focus" && currentStudent && currentScores && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Faixa de Alunos (Carrossel Horizontal com Touch Targets) */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/60 bg-zinc-950/60 overflow-x-auto scrollbar-none flex-shrink-0">
              {enrolledStudents.map((st, idx) => {
                const isSelected = idx === currentStudentIdx;
                const stAvg = ((scores[st.id].fisico + scores[st.id].tecnico + scores[st.id].tatico + scores[st.id].atitude + scores[st.id].evolucao) / 5).toFixed(1);
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      triggerHapticImpact("light");
                      setCurrentStudentIdx(idx);
                    }}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-[#EAB308] text-black shadow-[0_0_15px_rgba(234,179,8,0.35)] scale-105"
                        : "bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    <UserAvatar name={st.name} photo={st.avatar} size="sm" />
                    <span className="truncate max-w-[90px]">{st.name.split(" ")[0]}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isSelected ? "bg-black/20 text-black" : "bg-black/40 text-amber-400"}`}>
                      {stAvg}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Foco do Aluno Ativo */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              {/* Card de Identidade do Atleta */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar name={currentStudent.name} photo={currentStudent.avatar} size="md" />
                  <div className="min-w-0">
                    <p className="text-base font-black text-white truncate">{currentStudent.name}</p>
                    <p className="text-xs text-zinc-500 truncate">
                      Atleta {currentStudentIdx + 1} de {enrolledStudents.length} · {currentStudent.position || "Quadra"}
                    </p>
                  </div>
                </div>

                <div className={`flex flex-col items-end px-3.5 py-1.5 rounded-xl border ${currentAvgStyle.borderColor} ${currentAvgStyle.bgColor}`}>
                  <span className={`text-2xl font-black tabular-nums ${currentAvgStyle.color}`}>
                    {currentAvg}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-wider ${currentAvgStyle.color}`}>
                    Média {currentAvgStyle.label}
                  </span>
                </div>
              </div>

              {/* Sliders dos 5 Pilares no Padrão Modo Quadra */}
              <div className="space-y-3">
                {PILLARS.map(p => (
                  <CourtEvaluationSlider
                    key={p.key}
                    label={p.label}
                    icon={p.icon}
                    weightBadge={p.desc}
                    value={currentScores[p.key]}
                    onChange={(v) => handleScoreChange(p.key, v)}
                  />
                ))}
              </div>

              {/* Observação Individual Rápida */}
              <div className="pt-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Observação do Coach (Opcional)
                </label>
                <input
                  value={currentScores.note}
                  onChange={(e) => setStudentNote(e.target.value)}
                  placeholder={`Ex: Excelente salto no ataque, atenção à recepção...`}
                  maxLength={200}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#EAB308]/60 transition-colors"
                />
              </div>
            </div>

            {/* Barra de Navegação Flutuante Inferior (Touch Target >= 56px) */}
            <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/90 flex-shrink-0 flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                disabled={currentStudentIdx === 0}
                onClick={handlePrevStudent}
                className="flex-1 flex h-14 items-center justify-center gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-900 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={20} />
                <span>Anterior</span>
              </motion.button>

              {currentStudentIdx < enrolledStudents.length - 1 ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleNextStudent}
                  className="flex-[2] flex h-14 items-center justify-center gap-2 rounded-2xl border border-[#EAB308]/40 bg-[#EAB308]/20 text-[#EAB308] hover:bg-[#EAB308]/30 text-sm font-black transition-colors"
                >
                  <span>Próximo Aluno</span>
                  <ChevronRight size={20} />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  disabled={saving || saved}
                  onClick={handleSave}
                  className="flex-[2] flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#EAB308] hover:bg-amber-400 text-black text-sm font-black shadow-[0_0_25px_rgba(234,179,8,0.4)] disabled:opacity-50 transition-all"
                >
                  {saved ? (
                    <>
                      <CheckCircle2 size={20} />
                      <span>{enrolledStudents.length} Avaliações Salvas!</span>
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Gravando no Cofre…</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Finalizar & Salvar Turma</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        )}

        {/* ─── CORPO: MODO TABELA SQUAD COMPLETO (Visão Geral) ─── */}
        {viewMode === "table" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Quick Fill Toolbar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/60 bg-zinc-950/40 flex-shrink-0 overflow-x-auto">
              <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider flex-shrink-0">Preenchimento:</span>
              <select
                value={globalPillar ?? ""}
                onChange={e => setGlobalPillar((e.target.value || null) as keyof EvaluationScores | null)}
                className="h-9 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs text-white focus:outline-none flex-shrink-0"
              >
                <option value="">Pilar…</option>
                {PILLARS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <select
                value={globalValue}
                onChange={e => setGlobalValue(Number(e.target.value))}
                className="h-9 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs text-white focus:outline-none flex-shrink-0"
              >
                {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
              </select>
              <button
                type="button"
                onClick={applyGlobalPillar}
                disabled={!globalPillar}
                className="h-9 flex-shrink-0 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs font-bold text-zinc-200 hover:text-white disabled:opacity-30 transition-colors"
              >
                Aplicar a todos
              </button>
              <button
                type="button"
                onClick={applyAllDefault}
                className="h-9 flex-shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Reset ({DEFAULT_SCORE})
              </button>
            </div>

            {/* Lista dos Alunos */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-3">
              {enrolledStudents.map((student, idx) => {
                const sc = scores[student.id];
                const avg = ((sc.fisico + sc.tecnico + sc.tatico + sc.atitude + sc.evolucao) / 5).toFixed(1);
                const avgStyle = getScoreStyle(parseFloat(avg));
                return (
                  <div key={student.id} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={student.name} photo={student.avatar} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-white">{student.name}</p>
                          <p className="text-[10px] text-zinc-500">Atleta #{idx + 1}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentStudentIdx(idx);
                            setViewMode("focus");
                          }}
                          className="px-2.5 py-1 rounded-lg border border-[#EAB308]/30 bg-[#EAB308]/10 text-[11px] font-bold text-[#EAB308] hover:bg-[#EAB308]/20 transition-colors"
                        >
                          Foco →
                        </button>
                        <div className={`rounded-xl border px-2.5 py-1 text-sm font-black ${avgStyle.borderColor} ${avgStyle.bgColor} ${avgStyle.color}`}>
                          {avg}
                        </div>
                      </div>
                    </div>

                    {/* Mini Sliders dos Pilares */}
                    <div className="grid grid-cols-5 gap-2">
                      {PILLARS.map(p => (
                        <div key={p.key} className="flex flex-col items-center bg-black/40 rounded-xl p-2 border border-white/5">
                          <span className="text-[9px] font-black uppercase text-zinc-500 mb-1">{p.short}</span>
                          <span className={`text-base font-black ${getScoreStyle(sc[p.key]).color}`}>
                            {sc[p.key]}
                          </span>
                          <div className="flex gap-1 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                triggerHapticImpact("light");
                                setScores(prev => ({
                                  ...prev,
                                  [student.id]: { ...prev[student.id], [p.key]: Math.max(1, sc[p.key] - 1) },
                                }));
                              }}
                              className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-300 font-black text-xs hover:bg-zinc-700 flex items-center justify-center"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                triggerHapticImpact("light");
                                setScores(prev => ({
                                  ...prev,
                                  [student.id]: { ...prev[student.id], [p.key]: Math.min(10, sc[p.key] + 1) },
                                }));
                              }}
                              className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-300 font-black text-xs hover:bg-zinc-700 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Salvar na visão tabela */}
            <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/90 flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                disabled={saving || saved || enrolledStudents.length === 0}
                onClick={handleSave}
                className="w-full flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#EAB308] hover:bg-amber-400 text-black text-sm font-black shadow-[0_0_25px_rgba(234,179,8,0.3)] disabled:opacity-50 transition-all"
              >
                {saved ? (
                  <>
                    <CheckCircle2 size={20} />
                    <span>{enrolledStudents.length} Avaliações Salvas!</span>
                  </>
                ) : saving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Gravando no Cofre…</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Salvar Todas ({enrolledStudents.length} Alunos)</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
