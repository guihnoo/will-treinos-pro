"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Save, Dumbbell, Timer, Zap, RotateCcw, ChevronDown } from "lucide-react";
import type { Student } from "@/context/AppContext";
import { useCoaching } from "@/context/CoachingContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useToast } from "@/components/Toast";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

interface Props { student: Student; onClose: () => void; }

const EXERCISE_LIBRARY = [
  { category: "Fundamentos", exercises: ["Manchete", "Toque", "Saque Viagem", "Saque Flutuante", "Cortada", "Bloqueio", "Defesa"] },
  { category: "Físico", exercises: ["Salto Vertical", "Agilidade Lateral", "Sprint 10m", "Prancha", "Agachamento", "Burpee", "Polichinelo"] },
  { category: "Tático", exercises: ["Leitura de Jogo", "Posicionamento", "Cobertura de Ataque", "Transição Defesa-Ataque", "Rotação"] },
  { category: "Específico", exercises: ["Simulado 6x6", "3x3 Praia", "Jogo Reduzido 4x4", "Recepção + Ataque", "Saque + Defesa"] },
];

interface Exercise { name: string; sets: number; reps: string; rest: string; notes: string; }

export default function TrainingPlanEditor({ student, onClose }: Props) {
  const { addTrainingPlan } = useCoaching();
  const { addNotification } = useNotifications();
  const { toast } = useToast();
  useBodyScrollLock(true);
  const [planName, setPlanName] = useState(`Treino — ${student.name.split(" ")[0]}`);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const addExercise = (name: string) => {
    setExercises(prev => [...prev, { name, sets: 3, reps: "10", rest: "60s", notes: "" }]);
    setShowLibrary(false);
  };

  const updateExercise = (idx: number, field: keyof Exercise, value: string | number) => {
    setExercises(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (exercises.length === 0) return;
    addTrainingPlan({
      studentId: student.id,
      title: planName,
      exercises: exercises.map(e => ({
        name: e.name, sets: String(e.sets), reps: e.reps, rest: e.rest, notes: e.notes
      })),
      createdAt: new Date().toISOString().split("T")[0],
    });
    addNotification({
      type: "message",
      title: "Treino Personalizado",
      message: `Novo plano de treino disponível: ${planName}.`,
      time: "agora",
      read: false,
      studentId: student.id
    });
    setSaved(true);
    toast(`🏋️ Treino salvo para ${student.name.split(" ")[0]}!`);
    setTimeout(onClose, 1200);
  };

  const totalSets = exercises.reduce((a, e) => a + e.sets, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      data-modal-overlay
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] p-4 overflow-y-auto"
      onClick={onClose}>
      <div className="min-h-full flex items-center justify-center py-8">
        <motion.div
          initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#0A0A0A] border border-zinc-800 rounded-2xl w-full max-w-lg relative max-h-[calc(100dvh-1rem)] overflow-y-auto"
        >
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center p-12 text-center">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }} className="text-6xl mb-4">🏋️</motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Treino Criado!</h3>
              <p className="text-sm text-zinc-500">{exercises.length} exercícios para {student.name.split(" ")[0]}</p>
            </motion.div>
          ) : (
            <motion.div key="form" className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Treino Personalizado</h3>
                    <p className="text-xs text-zinc-500">{student.name}</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-zinc-600 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>

              {/* Plan Name */}
              <input value={planName} onChange={e => setPlanName(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#8B5CF6]/50 mb-4 placeholder-zinc-600"
                placeholder="Nome do treino..." />

              {/* Stats Bar */}
              <div className="flex gap-3 mb-5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 rounded-lg text-xs">
                  <Zap className="w-3.5 h-3.5 text-[#F97316]" />
                  <span className="text-zinc-400">{exercises.length} exercícios</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 rounded-lg text-xs">
                  <RotateCcw className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span className="text-zinc-400">{totalSets} séries total</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 rounded-lg text-xs">
                  <Timer className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span className="text-zinc-400">~{exercises.length * 5}min</span>
                </div>
              </div>

              {/* Exercise List */}
              <div className="space-y-2 mb-4">
                {exercises.map((ex, idx) => (
                  <motion.div key={idx}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-black/50 border border-zinc-900 rounded-xl group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">{ex.name}</span>
                      <button onClick={() => removeExercise(idx)}
                        className="text-zinc-700 hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-600 uppercase">Séries</label>
                        <input type="number" value={ex.sets} onChange={e => updateExercise(idx, "sets", parseInt(e.target.value) || 1)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2 text-white text-xs outline-none focus:border-[#8B5CF6]/40" />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-600 uppercase">Reps</label>
                        <input value={ex.reps} onChange={e => updateExercise(idx, "reps", e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2 text-white text-xs outline-none focus:border-[#8B5CF6]/40" />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-600 uppercase">Descanso</label>
                        <input value={ex.rest} onChange={e => updateExercise(idx, "rest", e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2 text-white text-xs outline-none focus:border-[#8B5CF6]/40" />
                      </div>
                    </div>
                    <input value={ex.notes} onChange={e => updateExercise(idx, "notes", e.target.value)}
                      placeholder="Obs: foco na explosão..."
                      className="w-full bg-transparent border-none text-xs text-zinc-500 outline-none mt-2 placeholder-zinc-700" />
                  </motion.div>
                ))}
              </div>

              {/* Add Exercise */}
              {showLibrary ? (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  className="border border-zinc-800 rounded-xl overflow-hidden mb-4">
                  <div className="p-3 bg-zinc-900/50 flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Biblioteca de Exercícios</span>
                    <button onClick={() => setShowLibrary(false)} className="text-zinc-600 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  {EXERCISE_LIBRARY.map(cat => (
                    <div key={cat.category} className="border-t border-zinc-900">
                      <button onClick={() => setExpandedCat(expandedCat === cat.category ? null : cat.category)}
                        className="w-full flex items-center justify-between p-3 text-sm text-zinc-300 hover:bg-zinc-900/30 transition-colors">
                        <span className="font-medium">{cat.category}</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform ${expandedCat === cat.category ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {expandedCat === cat.category && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                              {cat.exercises.map(ex => (
                                <motion.button key={ex} whileTap={{ scale: 0.95 }}
                                  onClick={() => addExercise(ex)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-black border border-zinc-800 text-zinc-400 hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors">
                                  + {ex}
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowLibrary(true)}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-zinc-800 text-zinc-500 text-sm font-medium hover:border-[#8B5CF6]/40 hover:text-[#8B5CF6] transition-colors flex items-center justify-center gap-2 mb-4">
                  <Plus className="w-4 h-4" /> Adicionar Exercício
                </motion.button>
              )}

              {/* Save */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  exercises.length > 0
                    ? "bg-[#8B5CF6] text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                    : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                }`}>
                <Save className="w-4 h-4" /> Salvar Treino ({exercises.length} exercícios)
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
