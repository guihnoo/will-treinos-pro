"use client";

import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, CheckCircle2, Loader2, Send, Sparkles, X, Star, Zap, Brain, MessageSquare, TrendingUp, Save, ChevronDown } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { EvalFeedbackResult } from "@/app/api/ai/eval-feedback/route";
import type { Student, VolleyballFundamental } from "@/context/types";
import { calculateXPFromEvaluation } from "@/context/types";
import { useCoaching } from "@/context/CoachingContext";
import { useToast } from "@/components/Toast";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { avatarSrc } from "@/lib/avatarSrc";
import { useXPMutations } from "@/hooks/useXPMutations";

interface Props {
  student: Student;
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
}

const PILLARS = [
  { key: "fisico",    label: "Físico",    icon: Zap,          color: "#EF4444", desc: "Disposição, resistência, explosão" },
  { key: "tecnico",   label: "Técnico",   icon: Star,         color: "#EAB308", desc: "Execução dos fundamentos" },
  { key: "tatico",    label: "Tático",    icon: Brain,        color: "#8B5CF6", desc: "Leitura de jogo, posicionamento" },
  { key: "atitude",   label: "Atitude",   icon: MessageSquare,color: "#06B6D4", desc: "Engajamento, foco, comportamento" },
  { key: "evolucao",  label: "Evolução",  icon: TrendingUp,   color: "#22C55E", desc: "Progresso vs. avaliação anterior" },
];

export default function PerformanceEvalModal({ student, lessonId, lessonTitle, onClose }: Props) {
  const { addFeedback } = useCoaching();
  const { logXP, checkAchievementUnlock, getStudentTotalXP } = useXPMutations();
  const { toast } = useToast();
  useBodyScrollLock(true);

  const [scores, setScores] = useState<Record<string, number>>({
    fisico: 7, tecnico: 7, tatico: 7, atitude: 8, evolucao: 7
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [generalNote, setGeneralNote] = useState("");
  const [expanded, setExpanded] = useState<string | null>("fisico");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<EvalFeedbackResult | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [pushSent, setPushSent] = useState(false);
  const avg = Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / 5) * 10) / 10;

  const scoreColor = (s: number) => s >= 8 ? "#22C55E" : s >= 6 ? "#EAB308" : "#EF4444";
  const scoreLabel = (s: number) => s >= 9 ? "Excepcional" : s >= 8 ? "Muito Bom" : s >= 6 ? "Bom" : s >= 4 ? "Regular" : "Precisa Evoluir";

  const handleSave = async () => {
    setSaving(true);

    // Determine dominant fundamental from pillar scores
    const dominantFundamental: VolleyballFundamental = scores.tecnico > 7 ? "posicionamento" : "recepcao";

    // Calculate XP (formula: 100 × (nota/10)² × 10 × multiplier)
    const { basePoints, multiplier, totalPoints } = calculateXPFromEvaluation(avg, dominantFundamental);

    // Log XP transaction (fire and forget, will complete after modal closes)
    logXP({
      studentId: student.id,
      points: totalPoints,
      basePoints,
      multiplierType: dominantFundamental,
      multiplierValue: multiplier,
      type: "evaluation",
      sourceEntity: "lesson",
      relatedId: lessonId,
      description: `Avaliação em ${lessonTitle} (média ${avg})`,
      validationPassed: true,
    }).catch(() => {
      console.warn("[PerformanceEvalModal] XP logging failed, continuing anyway");
    });

    // Save feedback locally
    addFeedback({
      lessonId,
      studentId: student.id,
      rating: avg,
      trainingTime: 60,
      trainingType: lessonTitle,
      strengths: Object.entries(scores).filter(([, v]) => v >= 8).map(([k]) => PILLARS.find(p => p.key === k)?.label || k),
      improvements: Object.entries(scores).filter(([, v]) => v < 6).map(([k]) => PILLARS.find(p => p.key === k)?.label || k),
      professorNote: generalNote,
      date: new Date().toISOString().split("T")[0],
      pillarScores: {
        fisico:   scores.fisico,
        tecnico:  scores.tecnico,
        tatico:   scores.tatico,
        atitude:  scores.atitude,
        evolucao: scores.evolucao,
      },
    });

    // Check for achievement unlock (async, fire and forget)
    getStudentTotalXP(student.id).then((total) => {
      if (total !== null) {
        checkAchievementUnlock(student.id, total).then((tier) => {
          if (tier) {
            toast(`🏆 ${student.name.split(" ")[0]} desbloqueou Card ${tier.toUpperCase()}!`);
          }
        });
      }
    });

    setTimeout(() => {
      toast(`✅ Avaliação de ${student.name.split(" ")[0]} salva! +${totalPoints} XP`);
      setSaving(false);
      setSaved(true);
    }, 600);
  };

  const generateFeedback = useCallback(async () => {
    setGeneratingFeedback(true);
    try {
      const sb = getSupabaseClient();
      const token = sb ? (await sb.auth.getSession()).data.session?.access_token ?? "" : "";
      const res = await fetch("/api/ai/eval-feedback", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentName: student.name,
          scores: { fisico: scores.fisico, tecnico: scores.tecnico, tatico: scores.tatico, atitude: scores.atitude, evolucao: scores.evolucao },
          generalNote,
          lessonTitle,
        }),
      });
      if (!res.ok) throw new Error("api_error");
      const data = await res.json() as EvalFeedbackResult;
      setAiFeedback(data);
      setFeedbackMsg(data.message);
    } catch {
      toast("Não foi possível gerar feedback IA. Tente novamente.");
    } finally {
      setGeneratingFeedback(false);
    }
  }, [student.name, scores, generalNote, lessonTitle, toast]);

  const sendFeedbackPush = useCallback(async () => {
    if (!feedbackMsg.trim() || !student.authUserId) return;
    try {
      const sb = getSupabaseClient();
      const token = sb ? (await sb.auth.getSession()).data.session?.access_token ?? "" : "";
      await fetch("/api/push/send", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          payload: {
            title: `📋 Feedback do coach — ${lessonTitle}`,
            body: feedbackMsg.slice(0, 120),
            url: "/treinos",
          },
          targetUserId: student.authUserId,
        }),
      });
      setPushSent(true);
      toast(`✅ Feedback enviado para ${student.name.split(" ")[0]}!`);
    } catch {
      toast("Falha ao enviar push. Verifique se o aluno tem notificações ativas.");
    }
  }, [feedbackMsg, student, lessonTitle, toast]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      data-modal-overlay
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] p-4 overflow-y-auto"
      onClick={onClose}>
      <div className="min-h-full flex items-end sm:items-center justify-center py-8">
        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg bg-[#0A0A0A] border border-zinc-800 rounded-3xl overflow-hidden relative max-h-[calc(100dvh-1rem)] flex flex-col">

        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={avatarSrc(student.avatar, student.name)}
              className="w-10 h-10 rounded-full border-2 border-zinc-700" />
            <div>
              <p className="font-bold text-white text-sm">{student.name}</p>
              <p className="text-[11px] text-zinc-500 truncate max-w-[200px]">{lessonTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Score Geral */}
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: scoreColor(avg) }}>{avg}</p>
              <p className="text-[10px] font-bold" style={{ color: scoreColor(avg) }}>{scoreLabel(avg)}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score Global Bar */}
        <div className="px-5 pt-4 pb-2">
          <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${avg * 10}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to right, ${scoreColor(avg)}88, ${scoreColor(avg)})` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-zinc-600">0</span>
            <span className="text-[10px] text-zinc-600">10</span>
          </div>
        </div>

        {/* Pillars */}
        <div className="px-5 pb-4 space-y-2 overflow-y-auto">
          {PILLARS.map(p => {
            const Icon = p.icon;
            const score = scores[p.key];
            const isOpen = expanded === p.key;
            return (
              <div key={p.key} className={`rounded-2xl border transition-all ${isOpen ? "border-zinc-700 bg-zinc-900/50" : "border-zinc-800/60 bg-black/30"}`}>
                {/* Pillar Header */}
                <button onClick={() => setExpanded(isOpen ? null : p.key)}
                  className="w-full flex items-center gap-3 p-3.5">
                  <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: `${p.color}18` }}>
                    <Icon className="w-4 h-4" style={{ color: p.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-white">{p.label}</p>
                    <p className="text-[10px] text-zinc-500">{p.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold" style={{ color: scoreColor(score) }}>{score}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Slider + Note */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3">
                        {/* Score Dots */}
                        <div className="flex gap-1.5 justify-between">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                            <motion.button key={n} whileTap={{ scale: 0.85 }}
                              onClick={() => setScores(s => ({ ...s, [p.key]: n }))}
                              className="flex-1 h-8 rounded-lg text-xs font-bold transition-all"
                              style={{
                                background: score >= n ? p.color : "#1a1a1a",
                                color: score >= n ? "#000" : "#52525b",
                                opacity: score >= n ? 1 : 0.6
                              }}>
                              {n}
                            </motion.button>
                          ))}
                        </div>
                        {/* Note */}
                        <textarea
                          value={notes[p.key] || ""}
                          onChange={e => setNotes(n => ({ ...n, [p.key]: e.target.value }))}
                          placeholder={`Observação sobre ${p.label.toLowerCase()}...`}
                          className="w-full bg-black/60 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-zinc-600 transition-colors resize-none placeholder-zinc-700"
                          rows={2}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* General Note */}
          <div className="pt-2">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Nota Geral do Professor</p>
            <textarea
              value={generalNote}
              onChange={e => setGeneralNote(e.target.value)}
              placeholder="Observações gerais sobre a aula e evolução do aluno..."
              className="w-full bg-black/60 border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none focus:border-[#EAB308]/50 transition-colors resize-none placeholder-zinc-700"
              rows={3}
            />
          </div>
        </div>

        {/* Save Button / Feedback Section */}
        <div className="p-5 border-t border-zinc-800 space-y-3">
          {!saved ? (
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-[#EAB308] text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.2)] disabled:opacity-60">
              {saving ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
              ) : (
                <><Save className="w-4 h-4" /> Salvar Avaliação</>
              )}
            </motion.button>
          ) : (
            <AnimatePresence>
              <motion.div
                key="feedback-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Success banner */}
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <p className="text-[11px] font-bold text-emerald-300">Avaliação salva! Quer enviar um feedback ao aluno?</p>
                </div>

                {/* Generate button */}
                {!aiFeedback && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={generateFeedback}
                    disabled={generatingFeedback}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-violet-500/35 bg-violet-500/10 py-2.5 text-[12px] font-black text-violet-200 hover:bg-violet-500/15 disabled:opacity-50 transition-all"
                  >
                    {generatingFeedback
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando feedback IA…</>
                      : <><Sparkles className="h-4 w-4" /> Gerar Feedback com IA</>
                    }
                  </motion.button>
                )}

                {/* Editable feedback */}
                <AnimatePresence>
                  {aiFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Bot className="h-3.5 w-3.5 text-violet-400" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-violet-400">Feedback gerado — edite se quiser</p>
                      </div>
                      <textarea
                        value={feedbackMsg}
                        onChange={(e) => setFeedbackMsg(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-violet-500/25 bg-violet-500/[0.05] px-3 py-2 text-[12px] text-zinc-200 outline-none focus:border-violet-400/50 transition-colors"
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setAiFeedback(null); setFeedbackMsg(""); setPushSent(false); void generateFeedback(); }}
                          className="flex-1 py-2 text-[10px] font-bold text-zinc-500 border border-white/[0.06] rounded-xl hover:text-zinc-300 transition-colors"
                        >
                          Regenerar
                        </button>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={sendFeedbackPush}
                          disabled={pushSent || !feedbackMsg.trim() || !student.authUserId}
                          className={`flex-[2] flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-black transition-all disabled:opacity-50 ${
                            pushSent
                              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border border-[#EAB308]/35 bg-[#EAB308]/10 text-amber-200 hover:bg-[#EAB308]/15"
                          }`}
                        >
                          {pushSent
                            ? <><CheckCircle2 className="h-3.5 w-3.5" /> Enviado!</>
                            : <><Send className="h-3.5 w-3.5" /> Enviar push ao aluno</>
                          }
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Close */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  Fechar avaliação
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
      </div>
    </motion.div>
  );
}
