import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import UserAvatar from "@/components/ui/UserAvatar";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export default function CreateLessonModal({ isOpen, onClose, defaultDate }: Props) {
  const { categories, venues, students, lessons, addLesson } = useApp();
  const { toast } = useToast();
  useBodyScrollLock(isOpen);
  
  const today = new Date().toISOString().split('T')[0];
  const dateToUse = defaultDate || `2026-04-${new Date().getDate()}`;
  const [newLesson, setNewLesson] = useState<{
    categoryId: string; title: string; startTime: string; endTime: string;
    maxStudents: number; venueId: string; notes: string; enrolledStudents: string[];
    isTrial: boolean; lessonType: "Individual" | "Dupla" | "Trio" | "Grupo"; locationUrl: string;
  }>({
    categoryId: "grupo", title: "", startTime: "08:00", endTime: "09:00",
    maxStudents: 10, venueId: "v1", notes: "", enrolledStudents: [], isTrial: false, lessonType: "Grupo", locationUrl: ""
  });

  const applyLessonType = (lessonType: "Individual" | "Dupla" | "Trio" | "Grupo") => {
    const capacityByType: Record<"Individual" | "Dupla" | "Trio" | "Grupo", number> = {
      Individual: 1,
      Dupla: 2,
      Trio: 3,
      Grupo: 12,
    };
    setNewLesson((prev) => ({ ...prev, lessonType, maxStudents: capacityByType[lessonType] }));
  };

  const toMin = (time: string) => {
    const [h, m] = time.split(":").map((n) => Number(n || 0));
    return h * 60 + m;
  };
  const formatTime = (minutes: number) => {
    const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes));
    const hh = String(Math.floor(clamped / 60)).padStart(2, "0");
    const mm = String(clamped % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  };
  const setDuration = (minutes: number) => {
    const start = toMin(newLesson.startTime);
    setNewLesson((prev) => ({ ...prev, endTime: formatTime(start + minutes) }));
  };

  const hasInvalidTime = toMin(newLesson.endTime) <= toMin(newLesson.startTime);
  const overbooked = newLesson.enrolledStudents.length > newLesson.maxStudents;
  const conflictingLessons = lessons.filter((lesson) => {
    if (lesson.date !== dateToUse) return false;
    if (lesson.venueId !== newLesson.venueId) return false;
    if (lesson.status === "completed" || lesson.status === "cancelled") return false;
    const candidateStart = toMin(newLesson.startTime);
    const candidateEnd = toMin(newLesson.endTime);
    const lessonStart = toMin(lesson.startTime);
    const lessonEnd = toMin(lesson.endTime);
    return candidateStart < lessonEnd && candidateEnd > lessonStart;
  });

  const handleCreate = () => {
    if (!newLesson.title) {
      toast("Preencha o título da aula", "error");
      return;
    }
    if (hasInvalidTime) {
      toast("Horário inválido: o fim precisa ser após o início.", "error");
      return;
    }
    if (overbooked) {
      toast("Ajuste vagas ou reduz alunos matriculados antes de criar.", "error");
      return;
    }
    if (conflictingLessons.length > 0) {
      toast("Conflito de quadra detectado nesse horário/local.", "error");
      return;
    }
    addLesson({
      ...newLesson,
      date: dateToUse,
      enrolledStudents: newLesson.enrolledStudents,
      presentStudents: [],
      absentStudents: [],
      status: "scheduled",
      isTrial: newLesson.isTrial,
      lessonType: newLesson.lessonType,
      locationUrl: newLesson.locationUrl,
      waitlist: []
    });
    toast("Aula criada com sucesso!");
    onClose();
    setNewLesson({ categoryId: "grupo", title: "", startTime: "08:00", endTime: "09:00", maxStudents: 10, venueId: "v1", notes: "", enrolledStudents: [], isTrial: false, lessonType: "Grupo", locationUrl: "" });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        data-modal-overlay
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] p-2 sm:p-4 overflow-y-auto"
        onClick={onClose}>
        <div className="min-h-full flex items-end sm:items-center justify-center py-8">
        <motion.div initial={{ scale: 0.98, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#0A0A0A] border border-zinc-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full relative flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 sm:p-6 pb-4 shrink-0">
            <h3 className="text-lg font-bold text-white">Nova Aula</h3>
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
            {/* Category */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Categoria</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map(cat => (
                  <motion.button key={cat.id} whileTap={{ scale: 0.95 }}
                    onClick={() => setNewLesson(p => ({ ...p, categoryId: cat.id, maxStudents: cat.maxStudents }))}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      newLesson.categoryId === cat.id
                        ? "border-transparent text-black font-bold shadow-lg"
                        : "border-zinc-800 bg-black/50 text-zinc-400 hover:border-zinc-600"
                    }`}
                    style={newLesson.categoryId === cat.id ? { background: cat.color } : {}}>
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="block text-[10px] font-bold mt-1">{cat.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Título</label>
              <input value={newLesson.title} onChange={e => setNewLesson(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Treino VIP — Potência"
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50 placeholder-zinc-600" />
            </div>

            {/* Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Início</label>
                <input type="time" value={newLesson.startTime}
                  onChange={e => setNewLesson(p => ({ ...p, startTime: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Fim</label>
                <input type="time" value={newLesson.endTime}
                  onChange={e => setNewLesson(p => ({ ...p, endTime: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className="min-h-11 rounded-full border border-zinc-700 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:border-[#EAB308]/40 hover:text-[#EAB308]"
                >
                  {mins} min
                </button>
              ))}
            </div>

            {/* Max Students */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Vagas</label>
              <input type="number" value={newLesson.maxStudents}
                onChange={e => setNewLesson(p => ({ ...p, maxStudents: parseInt(e.target.value) || 1 }))}
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50" />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Formato da aula</label>
              <div className="grid grid-cols-2 gap-2">
                {(["Individual", "Dupla", "Trio", "Grupo"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => applyLessonType(type)}
                    className={`min-h-11 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      newLesson.lessonType === type
                        ? "border-[#EAB308]/45 bg-[#EAB308]/15 text-[#EAB308]"
                        : "border-zinc-800 bg-black/40 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Venue */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Local</label>
              <select value={newLesson.venueId} onChange={e => setNewLesson(p => ({ ...p, venueId: e.target.value }))}
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50">
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Link GPS (Google Maps)</label>
              <input
                value={newLesson.locationUrl}
                onChange={(e) => setNewLesson((prev) => ({ ...prev, locationUrl: e.target.value }))}
                placeholder="https://maps.google.com/?q=-22.99,-43.36"
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50 placeholder-zinc-600"
              />
            </div>

            {/* Trial Toggle */}
            <div className="flex items-center justify-between bg-black border border-zinc-800 rounded-xl p-4">
              <div>
                <span className="text-sm font-bold text-white block">Aula Experimental</span>
                <span className="text-[10px] text-zinc-500">Marque se essa aula vai receber visitantes (leads).</span>
              </div>
              <button onClick={() => setNewLesson(p => ({ ...p, isTrial: !p.isTrial }))}
                className={`w-12 h-6 rounded-full relative transition-colors ${newLesson.isTrial ? "bg-[#22C55E]" : "bg-zinc-800"}`}>
                <motion.div layout className="w-4 h-4 bg-white rounded-full absolute top-1"
                  animate={{ left: newLesson.isTrial ? 28 : 4 }} />
              </button>
            </div>

            {/* Enrolled Students */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Matricular Alunos (Opcional)</label>
              <div className="bg-black border border-zinc-800 rounded-xl p-3 max-h-32 overflow-y-auto space-y-2">
                {students.filter(s => s.status === "active").map(s => {
                  const isSelected = newLesson.enrolledStudents.includes(s.id);
                  return (
                    <div key={s.id} onClick={() => {
                      setNewLesson(p => ({
                        ...p,
                        enrolledStudents: isSelected 
                          ? p.enrolledStudents.filter(id => id !== s.id)
                          : [...p.enrolledStudents, s.id]
                      }));
                    }} className="flex items-center gap-3 p-1.5 hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#22C55E] bg-[#22C55E]' : 'border-zinc-600'}`}>
                        {isSelected && <Check className="w-3 h-3 text-black" />}
                      </div>
                      <UserAvatar name={s.name} photo={s.avatar} size="sm" />
                      <span className="text-sm text-zinc-300 flex-1">{s.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {hasInvalidTime ? (
              <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-300">
                Horário inválido: o término deve ser maior que o início.
              </div>
            ) : null}
            {overbooked ? (
              <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-300">
                Lotação acima do limite: {newLesson.enrolledStudents.length} alunos para {newLesson.maxStudents} vagas.
              </div>
            ) : null}
            {conflictingLessons.length > 0 ? (
              <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                <p className="font-bold">Conflito de quadra no mesmo horário:</p>
                <p className="mt-1 truncate">
                  {conflictingLessons[0]?.title} ({conflictingLessons[0]?.startTime}-{conflictingLessons[0]?.endTime})
                  {conflictingLessons.length > 1 ? ` +${conflictingLessons.length - 1}` : ""}
                </p>
              </div>
            ) : null}

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate}
              className={`w-full py-3 rounded-xl text-black font-bold text-sm mt-2 shadow-[0_0_20px_rgba(234,179,8,0.2)] ${
                hasInvalidTime || overbooked || conflictingLessons.length > 0 ? "cursor-not-allowed bg-[#EAB308]/50" : "bg-[#EAB308]"
              }`}
              disabled={hasInvalidTime || overbooked || conflictingLessons.length > 0}
            >
              Criar Aula
            </motion.button>
          </div>
        </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
