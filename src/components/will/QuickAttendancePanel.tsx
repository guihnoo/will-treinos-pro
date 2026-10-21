"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, UserX, Users, CheckCircle2, Loader2, QrCode, BarChart3, WifiOff } from "lucide-react";
import type { Lesson, Student } from "@/context/types";
import { getSupabaseClient } from "@/lib/supabaseClient";
import UserAvatar from "@/components/ui/UserAvatar";
import { useToast } from "@/components/Toast";
import { triggerHapticImpact, triggerHapticCelebration } from "@/lib/hapticFeedback";
import { offlineCache } from "@/lib/offlineCache";
import { modalManager } from "@/lib/modalManager";

interface Props {
  lesson: Lesson;
  students: Student[];
  onClose: () => void;
  onSave?: (presentIds: string[]) => void;
  onOpenQR?: () => void;
  onOpenBulkEval?: () => void;
}

export default function QuickAttendancePanel({
  lesson,
  students,
  onClose,
  onSave,
  onOpenQR,
  onOpenBulkEval,
}: Props) {
  const { toast } = useToast();

  const enrolled = lesson.enrolledStudents
    .map((id) => students.find((s) => s.id === id))
    .filter((s): s is Student => Boolean(s));

  const [present, setPresent] = useState<Set<string>>(
    new Set(lesson.presentStudents ?? [])
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!saved) return;
    closeTimerRef.current = setTimeout(onClose, 1400);
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [saved, onClose]);

  const toggle = useCallback((id: string) => {
    triggerHapticImpact("light");
    setPresent((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const markAll = () => {
    triggerHapticImpact("medium");
    setPresent(new Set(enrolled.map((s) => s.id)));
  };

  const clearAll = () => {
    triggerHapticImpact("light");
    setPresent(new Set());
  };

  async function handleSave() {
    setSaving(true);
    const presentIds = [...present];
    const absentIds = enrolled.map((s) => s.id).filter((id) => !present.has(id));

    // Salvar sempre em cache offline primeiro (resiliência total)
    offlineCache.savePendingAttendance(lesson.id, presentIds, absentIds);

    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    if (!isOnline) {
      onSave?.(presentIds);
      setSaved(true);
      setIsOfflineSaved(true);
      triggerHapticCelebration();
      toast(`📡 Chamada salva offline (${presentIds.length} presentes). Sincronizará quando a rede voltar.`);
      setSaving(false);
      return;
    }

    try {
      const sb = getSupabaseClient();
      const { error } = await sb
        .from("lessons")
        .update({
          present_students: presentIds,
          absent_students: absentIds,
        })
        .eq("id", lesson.id);

      if (error) throw error;

      offlineCache.removePendingAttendance(lesson.id);
      onSave?.(presentIds);
      setSaved(true);
      setIsOfflineSaved(false);
      triggerHapticCelebration();
      toast(`✅ Presença salva na nuvem — ${presentIds.length}/${enrolled.length} presentes`);
    } catch {
      // Falha de rede ou timeout: fallback gracioso sem perder dados
      onSave?.(presentIds);
      setSaved(true);
      setIsOfflineSaved(true);
      triggerHapticCelebration();
      toast(`⚠️ Rede instável: presença gravada localmente. O app sincronizará automaticamente.`, "error");
    } finally {
      setSaving(false);
    }
  }

  const presentCount = present.size;
  const pct = enrolled.length > 0 ? Math.round((presentCount / enrolled.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[220] bg-black/85 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl border-t border-x border-zinc-800 bg-[#0a0a0a] pb-safe"
        style={{ maxHeight: "94dvh", display: "flex", flexDirection: "column" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-12 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/10">
              <Users size={18} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white">Chamada da Quadra</h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  Modo Quadra
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                {lesson.title || "Aula"} · {lesson.date.split("-").reverse().join("/")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAll}
              className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 px-2 py-1 transition-colors"
            >
              Todos ✓
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-[11px] font-black text-zinc-500 hover:text-zinc-300 px-2 py-1 transition-colors"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Progress strip */}
        <div className="px-5 pt-3 pb-2 flex-shrink-0">
          <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5 font-bold">
            <span className="text-emerald-400">{presentCount} presentes</span>
            <span>
              {enrolled.length - presentCount} ausentes · {pct}% presente
            </span>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
              className={`h-full rounded-full ${
                pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-[#EAB308]" : "bg-red-500"
              }`}
            />
          </div>
        </div>

        {/* Student list com áreas de toque >= 56px */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
          {enrolled.length === 0 && (
            <p className="text-center text-xs text-zinc-500 py-12 font-medium">Nenhum aluno inscrito nesta aula.</p>
          )}
          {enrolled.map((student) => {
            const isPresent = present.has(student.id);
            return (
              <motion.button
                key={student.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggle(student.id)}
                className={`w-full min-h-14 flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                  isPresent
                    ? "border-emerald-500/40 bg-emerald-500/12 shadow-sm shadow-emerald-950/20"
                    : "border-zinc-800/80 bg-zinc-950/60 opacity-65 hover:opacity-100"
                }`}
              >
                <UserAvatar name={student.name} photo={student.avatar} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{student.name}</p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {student.plan ? `Plano ${student.plan}` : "Atleta"}
                  </p>
                </div>
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                    isPresent
                      ? "border-emerald-400 bg-emerald-500 text-black shadow-md shadow-emerald-500/30"
                      : "border-zinc-700 bg-zinc-900 text-zinc-600"
                  }`}
                >
                  {isPresent ? <Check size={20} strokeWidth={3} /> : <UserX size={18} />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Action bar: Atalhos de Quadra + Salvar */}
        <div className="px-5 py-4 border-t border-zinc-800/80 flex-shrink-0 bg-zinc-950 space-y-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHapticImpact("light");
                if (onOpenQR) onOpenQR();
                else modalManager.openModal("qrCheckin", { lesson });
              }}
              className="flex-1 min-h-12 flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 text-xs font-bold text-zinc-300 hover:border-zinc-700 hover:text-white transition-all"
            >
              <QrCode size={16} className="text-emerald-400" />
              QR Check-in
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHapticImpact("light");
                if (onOpenBulkEval) onOpenBulkEval();
                else modalManager.openModal("bulkEvaluation", { lesson });
              }}
              className="flex-1 min-h-12 flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-200 hover:border-amber-400 hover:bg-amber-500/15 transition-all"
            >
              <BarChart3 size={16} className="text-[#EAB308]" />
              Avaliar Turma
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving || saved}
            className={`w-full min-h-14 flex items-center justify-center gap-2 rounded-2xl text-base font-black transition-all ${
              saved
                ? "bg-emerald-400 text-black"
                : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            }`}
          >
            {saved ? (
              <>
                <CheckCircle2 size={20} />
                {isOfflineSaved ? "Salvo em Modo Offline!" : "Chamada Confirmada!"}
              </>
            ) : saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Gravando chamada...
              </>
            ) : (
              <>
                <Check size={20} strokeWidth={3} />
                Confirmar Chamada ({presentCount}/{enrolled.length})
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
