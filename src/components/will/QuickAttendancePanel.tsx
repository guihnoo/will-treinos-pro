"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, UserX, Users, CheckCircle2, Loader2 } from "lucide-react";
import type { Lesson, Student } from "@/context/types";
import { getSupabaseClient } from "@/lib/supabaseClient";
import UserAvatar from "@/components/ui/UserAvatar";
import { useToast } from "@/components/Toast";

interface Props {
  lesson: Lesson;
  students: Student[];
  onClose: () => void;
  onSave?: (presentIds: string[]) => void;
}

export default function QuickAttendancePanel({ lesson, students, onClose, onSave }: Props) {
  const { toast } = useToast();

  const enrolled = lesson.enrolledStudents
    .map(id => students.find(s => s.id === id))
    .filter((s): s is Student => Boolean(s));

  const [present, setPresent] = useState<Set<string>>(
    new Set(lesson.presentStudents ?? [])
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!saved) return;
    closeTimerRef.current = setTimeout(onClose, 1200);
    return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); };
  }, [saved, onClose]);

  const toggle = useCallback((id: string) => {
    setPresent(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const markAll   = () => setPresent(new Set(enrolled.map(s => s.id)));
  const clearAll  = () => setPresent(new Set());

  async function handleSave() {
    setSaving(true);
    try {
      const presentIds = [...present];
      const absentIds  = enrolled.map(s => s.id).filter(id => !present.has(id));

      const sb = getSupabaseClient();
      await sb.from("lessons").update({
        present_students: presentIds,
        absent_students:  absentIds,
      }).eq("id", lesson.id);

      onSave?.(presentIds);
      setSaved(true);
      toast(`✅ Presença salva — ${presentIds.length}/${enrolled.length} presentes`);
    } catch {
      toast("Erro ao salvar presença.", "error");
    } finally {
      setSaving(false);
    }
  }

  const presentCount = present.size;
  const pct = enrolled.length > 0 ? Math.round((presentCount / enrolled.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[220] bg-black/85 backdrop-blur-sm flex items-end justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl border-t border-x border-zinc-800 bg-[#0a0a0a] pb-safe"
        style={{ maxHeight: "92dvh", display: "flex", flexDirection: "column" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/10">
              <Users size={17} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Chamada Rápida</h2>
              <p className="text-[10px] text-zinc-500 truncate max-w-[180px]">
                {lesson.title || "Aula"} · {lesson.date.split("-").reverse().join("/")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAll}  className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 transition-colors">Todos ✓</button>
            <button onClick={clearAll} className="text-[10px] font-black text-zinc-500 hover:text-zinc-300 transition-colors">Limpar</button>
            <button onClick={onClose}  className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Progress strip */}
        <div className="px-5 pt-3 pb-2 flex-shrink-0">
          <div className="flex justify-between text-[10px] text-zinc-500 mb-1.5">
            <span>{presentCount} presentes</span>
            <span>{enrolled.length - presentCount} ausentes · {pct}% de presença</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
              className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
            />
          </div>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-1.5">
          {enrolled.length === 0 && (
            <p className="text-center text-xs text-zinc-600 py-10">Nenhum aluno inscrito.</p>
          )}
          {enrolled.map(student => {
            const isPresent = present.has(student.id);
            return (
              <motion.button
                key={student.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggle(student.id)}
                className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                  isPresent
                    ? "border-emerald-500/30 bg-emerald-500/8"
                    : "border-zinc-800/60 bg-zinc-950/40 opacity-60"
                }`}
              >
                <UserAvatar name={student.name} photo={student.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{student.name}</p>
                  <p className="text-[10px] text-zinc-600 truncate">{student.plan || "Sem plano"}</p>
                </div>
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isPresent
                    ? "border-emerald-500/50 bg-emerald-500/20"
                    : "border-zinc-700/50 bg-zinc-900"
                }`}>
                  {isPresent
                    ? <Check size={16} className="text-emerald-400" />
                    : <UserX size={14} className="text-zinc-600" />
                  }
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Save button */}
        <div className="px-5 py-4 border-t border-zinc-800/60 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving || saved}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-black disabled:opacity-50 transition-colors hover:bg-emerald-400"
          >
            {saved    ? <><CheckCircle2 size={16} /> Salvo!</> :
             saving   ? <><Loader2 size={16} className="animate-spin" /> Salvando…</> :
             <><Check size={16} /> Salvar Chamada ({presentCount}/{enrolled.length})</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
