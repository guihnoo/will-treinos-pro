"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CheckCircle2, Loader2, ChevronUp, ChevronDown,
  Zap, Users,
} from "lucide-react";
import type { Lesson, Student } from "@/context/types";
import { useEvaluations, type EvaluationScores } from "@/hooks/useEvaluations";
import UserAvatar from "@/components/ui/UserAvatar";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";

const PILLARS: { key: keyof EvaluationScores; label: string; short: string }[] = [
  { key: "fisico",   label: "Físico",   short: "FIS" },
  { key: "tecnico",  label: "Técnico",  short: "TEC" },
  { key: "tatico",   label: "Tático",   short: "TAT" },
  { key: "atitude",  label: "Atitude",  short: "ATI" },
  { key: "evolucao", label: "Evolução", short: "EVO" },
];

const DEFAULT_SCORE = 7;

type StudentScores = Record<string, EvaluationScores & { note: string }>;

function scoreColor(v: number) {
  if (v >= 9) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
  if (v >= 7) return "text-[#EAB308] border-amber-500/40 bg-amber-500/10";
  if (v >= 5) return "text-orange-400 border-orange-500/40 bg-orange-500/10";
  return "text-red-400 border-red-500/40 bg-red-500/10";
}

function ScoreCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => onChange(Math.min(10, value + 1))}
        className="w-6 h-5 flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors"
      >
        <ChevronUp size={12} />
      </button>
      <div className={`w-9 h-9 rounded-xl border text-sm font-black flex items-center justify-center transition-all ${scoreColor(value)}`}>
        {value}
      </div>
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-6 h-5 flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors"
      >
        <ChevronDown size={12} />
      </button>
    </div>
  );
}

interface Props {
  lesson: Lesson;
  students: Student[];
  onClose: () => void;
  onSaved?: () => void;
}

export default function BulkEvaluationModal({ lesson, students, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const { saveEvaluation } = useEvaluations();

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

  const [scores, setScores]   = useState<StudentScores>(initScores);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [globalPillar, setGlobalPillar] = useState<keyof EvaluationScores | null>(null);
  const [globalValue, setGlobalValue]   = useState(DEFAULT_SCORE);

  const lessonTitle = lesson.title || "Aula";

  function setScore(studentId: string, pillar: keyof EvaluationScores, value: number) {
    setScores(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [pillar]: value },
    }));
  }

  function setNote(studentId: string, note: string) {
    setScores(prev => ({ ...prev, [studentId]: { ...prev[studentId], note } }));
  }

  function applyGlobalPillar() {
    if (!globalPillar) return;
    setScores(prev => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = { ...next[id], [globalPillar]: globalValue };
      }
      return next;
    });
  }

  function applyAllDefault() {
    setScores(prev => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = { ...next[id], fisico: DEFAULT_SCORE, tecnico: DEFAULT_SCORE, tatico: DEFAULT_SCORE, atitude: DEFAULT_SCORE, evolucao: DEFAULT_SCORE };
      }
      return next;
    });
  }

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      const createdBy = session?.user.id;

      let saved = 0;
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

        // Award XP fire-and-forget
        const avg = (Object.values(evalScores).reduce((a, b) => a + b, 0) / 5);
        const xp  = Math.round(100 * Math.pow(avg / 10, 2) * 10 * 1.2); // posicionamento multiplier
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
        saved++;
      }

      toast(`✅ ${saved} avaliações salvas!`);
      setSaved(true);
      onSaved?.();
      setTimeout(onClose, 1500);
    } catch (e) {
      toast(`Erro: ${String(e).replace("Error: ", "")}`, "error");
    } finally {
      setSaving(false);
    }
  }, [scores, enrolledStudents, lesson.id, lessonTitle, saveEvaluation, onClose, onSaved, toast]);

  const avgAll = enrolledStudents.length > 0
    ? (enrolledStudents.reduce((sum, s) => {
        const sc = scores[s.id];
        return sum + (sc.fisico + sc.tecnico + sc.tatico + sc.atitude + sc.evolucao) / 5;
      }, 0) / enrolledStudents.length).toFixed(1)
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[230] bg-black/85 backdrop-blur-sm flex items-end justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-t-3xl border-t border-x border-zinc-800 bg-[#0a0a0a] pb-safe"
        style={{ maxHeight: "94dvh", display: "flex", flexDirection: "column" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10">
              <Users size={17} className="text-[#EAB308]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Avaliar Turma</h2>
              <p className="text-[10px] text-zinc-500">{enrolledStudents.length} alunos · média atual {avgAll}/10</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Quick fill toolbar */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-zinc-800/40 flex-shrink-0 overflow-x-auto">
          <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest flex-shrink-0">Preencher:</span>
          <select
            value={globalPillar ?? ""}
            onChange={e => setGlobalPillar((e.target.value || null) as keyof EvaluationScores | null)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-white focus:outline-none flex-shrink-0"
          >
            <option value="">Pilar…</option>
            {PILLARS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select
            value={globalValue}
            onChange={e => setGlobalValue(Number(e.target.value))}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-white focus:outline-none flex-shrink-0"
          >
            {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
          </select>
          <button
            onClick={applyGlobalPillar}
            disabled={!globalPillar}
            className="flex-shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-black text-zinc-300 hover:text-white disabled:opacity-30 transition-colors"
          >
            Aplicar a todos
          </button>
          <button
            onClick={applyAllDefault}
            className="flex-shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Reset ({DEFAULT_SCORE})
          </button>
        </div>

        {/* Pillar headers */}
        <div className="flex items-center px-5 py-2 border-b border-zinc-800/30 flex-shrink-0">
          <div className="w-40 flex-shrink-0" />
          {PILLARS.map(p => (
            <div key={p.key} className="flex-1 text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{p.short}</span>
            </div>
          ))}
          <div className="w-20 flex-shrink-0" />
        </div>

        {/* Student rows */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3">
          {enrolledStudents.length === 0 ? (
            <p className="text-center text-xs text-zinc-600 py-10">Nenhum aluno presente.</p>
          ) : (
            enrolledStudents.map(student => {
              const sc = scores[student.id];
              const avg = ((sc.fisico + sc.tecnico + sc.tatico + sc.atitude + sc.evolucao) / 5).toFixed(1);
              return (
                <div key={student.id} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-3 space-y-2">
                  <div className="flex items-center gap-1">
                    {/* Student identity */}
                    <div className="w-40 flex-shrink-0 flex items-center gap-2 min-w-0">
                      <UserAvatar name={student.name} photo={student.avatar} size="sm" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">{student.name.split(" ")[0]}</p>
                        <p className={`text-[10px] font-black ${scoreColor(parseFloat(avg)).split(" ")[0]}`}>{avg}/10</p>
                      </div>
                    </div>
                    {/* Score cells */}
                    {PILLARS.map(p => (
                      <div key={p.key} className="flex-1 flex justify-center">
                        <ScoreCell
                          value={sc[p.key]}
                          onChange={v => setScore(student.id, p.key, v)}
                        />
                      </div>
                    ))}
                    {/* Avg */}
                    <div className="w-20 flex-shrink-0 flex justify-end">
                      <div className={`rounded-xl border px-2.5 py-1.5 text-sm font-black ${scoreColor(parseFloat(avg))}`}>
                        {avg}
                      </div>
                    </div>
                  </div>
                  {/* Note */}
                  <input
                    value={sc.note}
                    onChange={e => setNote(student.id, e.target.value)}
                    placeholder="Observação (opcional)…"
                    maxLength={200}
                    className="w-full rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-3 py-1.5 text-[11px] text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Save */}
        <div className="px-5 py-4 border-t border-zinc-800/60 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving || saved || enrolledStudents.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#EAB308] py-3.5 text-sm font-black text-black disabled:opacity-50 transition-colors hover:bg-amber-400"
          >
            {saved    ? <><CheckCircle2 size={16} /> {enrolledStudents.length} avaliações salvas!</>
           : saving   ? <><Loader2 size={16} className="animate-spin" /> Salvando…</>
           : <><Zap size={16} /> Salvar {enrolledStudents.length} avaliações</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
