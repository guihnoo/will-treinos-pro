"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, ChevronDown } from "lucide-react";
import type { Student, TrainingPlan, DayName, Intensity } from "@/context/types";
import { useCoaching } from "@/context/CoachingContext";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/ui/UserAvatar";
import { SPRING_PREMIUM, PRESS_SCALE } from "@/components/ui/motionTokens";
import { localDateISO } from "@/lib/dateUtils";

interface LocalExercise {
  id?: string;
  weekNumber: number;
  dayName: DayName;
  exerciseName: string;
  sets: number;
  repsMin?: number;
  repsMax?: number;
  durationMinutes?: number;
  intensity: Intensity;
  notes?: string;
}

interface TrainingPlanEditorProps {
  student?: Student;
  existingPlan?: TrainingPlan;
  onClose?: () => void;
}

const DAY_NAMES: DayName[] = [
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
  "domingo",
];

const DAY_LABELS: Record<DayName, string> = {
  segunda: "Seg",
  terça: "Ter",
  quarta: "Qua",
  quinta: "Qui",
  sexta: "Sex",
  sábado: "Sab",
  domingo: "Dom",
};

const INTENSITY_COLORS: Record<Intensity, string> = {
  leve: "bg-blue-500/20 text-blue-400",
  moderado: "bg-green-500/20 text-green-400",
  intenso: "bg-orange-500/20 text-orange-400",
  máximo: "bg-red-500/20 text-red-400",
};

const INTENSITY_LABELS: Record<Intensity, string> = {
  leve: "Leve",
  moderado: "Moderado",
  intenso: "Intenso",
  máximo: "Máximo",
};

export default function TrainingPlanEditor({
  student,
  existingPlan,
  onClose,
}: TrainingPlanEditorProps) {
  const { user } = useAuth();
  const { addTrainingPlan, updateTrainingPlan } = useCoaching();

  const isEditMode = Boolean(existingPlan);

  // Plan metadata
  const [title, setTitle] = useState(existingPlan?.title || "");
  const [description, setDescription] = useState(
    existingPlan?.description || ""
  );
  const [startDate, setStartDate] = useState(
    existingPlan?.startDate || localDateISO()
  );
  const [endDate, setEndDate] = useState(existingPlan?.endDate || "");

  // Exercises
  const [exercises, setExercises] = useState<LocalExercise[]>(
    existingPlan?.exercises || []
  );

  // UI state
  const [addingExercise, setAddingExercise] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add exercise form state
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newWeekNumber, setNewWeekNumber] = useState(1);
  const [newDayName, setNewDayName] = useState<DayName>("segunda");
  const [newSets, setNewSets] = useState(3);
  const [newRepsMin, setNewRepsMin] = useState<number | undefined>(8);
  const [newRepsMax, setNewRepsMax] = useState<number | undefined>(12);
  const [newDurationMinutes, setNewDurationMinutes] = useState<number | undefined>();
  const [newIntensity, setNewIntensity] = useState<Intensity>("moderado");
  const [newNotes, setNewNotes] = useState("");
  const [useReps, setUseReps] = useState(true);

  const groupedExercises = useMemo(() => {
    const grouped: Record<number, LocalExercise[]> = {};
    exercises.forEach((ex) => {
      if (!grouped[ex.weekNumber]) {
        grouped[ex.weekNumber] = [];
      }
      grouped[ex.weekNumber].push(ex);
    });
    return grouped;
  }, [exercises]);

  const weekNumbers = useMemo(
    () => Object.keys(groupedExercises).map(Number).sort((a, b) => a - b),
    [groupedExercises]
  );

  const handleAddExercise = () => {
    const exercise: LocalExercise = {
      id: `temp-${Date.now()}`,
      weekNumber: newWeekNumber,
      dayName: newDayName,
      exerciseName: newExerciseName,
      sets: newSets,
      repsMin: useReps ? newRepsMin : undefined,
      repsMax: useReps ? newRepsMax : undefined,
      durationMinutes: useReps ? undefined : newDurationMinutes,
      intensity: newIntensity,
      notes: newNotes,
    };

    setExercises([...exercises, exercise]);

    // Reset form
    setNewExerciseName("");
    setNewSets(3);
    setNewRepsMin(8);
    setNewRepsMax(12);
    setNewDurationMinutes(undefined);
    setNewIntensity("moderado");
    setNewNotes("");
    setAddingExercise(false);
  };

  const handleDeleteExercise = (id: string | undefined) => {
    if (id) {
      setExercises(exercises.filter((ex) => ex.id !== id));
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !student) return;

    setSaving(true);
    try {
      // Generate temp ID for new plan (will be replaced by UUID on Supabase insert)
      const planId = existingPlan?.id || `temp-${Date.now()}`;

      // Map LocalExercise to TrainingExercise format (add planId)
      const fullExercises = exercises.map((ex) => ({
        ...ex,
        id: ex.id || `ex-${Date.now()}-${Math.random()}`,
        planId,
      }));

      const planData = {
        coachId: user?.id || "",
        studentId: student.id,
        title,
        description,
        startDate,
        endDate: endDate || undefined,
        status: "active" as const,
        exercises: fullExercises as TrainingPlan["exercises"],
        createdAt: existingPlan?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEditMode && existingPlan) {
        updateTrainingPlan(existingPlan.id, planData);
      } else {
        addTrainingPlan(planData);
      }

      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  if (!student) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={SPRING_PREMIUM}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-2xl max-h-[85vh] flex flex-col bg-gradient-to-br from-black via-zinc-950 to-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/50 shrink-0">
          <div className="flex items-center gap-3">
            <UserAvatar photo={student.avatar} name={student.name} size="sm" />
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditMode ? "Editar Plano" : "Novo Plano"}
              </h2>
              <p className="text-xs text-zinc-500">{student.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-6 p-5">
          {/* Plan Metadata */}
          <div className="space-y-4 pb-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Informações do Plano
            </h3>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Condicionamento para Estadual"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#EAB308]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: 4 semanas focadas em explosão e potência"
                rows={2}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#EAB308] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">
                  Início *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#EAB308]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">
                  Término
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#EAB308]"
                />
              </div>
            </div>
          </div>

          {/* Exercises */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Exercícios {exercises.length > 0 && `(${exercises.length})`}
            </h3>

            {weekNumbers.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs">
                Nenhum exercício — adicione abaixo
              </div>
            ) : (
              <div className="space-y-3">
                {weekNumbers.map((week) => (
                  <div key={week} className="space-y-2">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2">
                      Semana {week}
                    </div>
                    <div className="space-y-1">
                      {groupedExercises[week]?.map((ex) => (
                        <div
                          key={ex.id}
                          className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded bg-zinc-800 text-xs font-semibold text-zinc-300">
                                {DAY_LABELS[ex.dayName]}
                              </span>
                              <span className="text-sm font-semibold text-white truncate">
                                {ex.exerciseName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-zinc-500">
                                {ex.sets}x
                                {ex.repsMin && ex.repsMax
                                  ? `${ex.repsMin}-${ex.repsMax}`
                                  : ex.durationMinutes
                                  ? `${ex.durationMinutes}min`
                                  : "-"}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  INTENSITY_COLORS[ex.intensity]
                                }`}
                              >
                                {INTENSITY_LABELS[ex.intensity]}
                              </span>
                              {ex.notes && (
                                <span className="text-xs text-zinc-500 italic">
                                  "{ex.notes}"
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteExercise(ex.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition shrink-0"
                            title="Deletar exercício"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Exercise Form */}
            <AnimatePresence>
              {!addingExercise ? (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => setAddingExercise(true)}
                  whileTap={PRESS_SCALE}
                  className="w-full py-2 px-3 rounded-lg border border-dashed border-[#EAB308]/30 hover:border-[#EAB308] text-[#EAB308] text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Exercício
                </motion.button>
              ) : (
                <motion.div
                  key="add-form"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-zinc-400">
                        Exercício *
                      </label>
                      <input
                        type="text"
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                        placeholder="Ex: Agachamento Explosivo"
                        className="w-full mt-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#EAB308]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-400">
                        Semana *
                      </label>
                      <input
                        type="number"
                        value={newWeekNumber}
                        onChange={(e) =>
                          setNewWeekNumber(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        min="1"
                        max="12"
                        className="w-full mt-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#EAB308]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-400">
                        Dia *
                      </label>
                      <select
                        value={newDayName}
                        onChange={(e) => setNewDayName(e.target.value as DayName)}
                        className="w-full mt-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#EAB308]"
                      >
                        {DAY_NAMES.map((day) => (
                          <option key={day} value={day}>
                            {DAY_LABELS[day]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-400">
                        Séries *
                      </label>
                      <input
                        type="number"
                        value={newSets}
                        onChange={(e) =>
                          setNewSets(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        min="1"
                        className="w-full mt-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#EAB308]"
                      />
                    </div>

                    <div className="col-span-2">
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => setUseReps(true)}
                          className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition ${
                            useReps
                              ? "bg-[#EAB308]/20 text-[#EAB308]"
                              : "bg-white/5 text-zinc-400"
                          }`}
                        >
                          Repetições
                        </button>
                        <button
                          onClick={() => setUseReps(false)}
                          className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition ${
                            !useReps
                              ? "bg-[#EAB308]/20 text-[#EAB308]"
                              : "bg-white/5 text-zinc-400"
                          }`}
                        >
                          Duração
                        </button>
                      </div>
                      {useReps ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-zinc-500">Mín</label>
                            <input
                              type="number"
                              value={newRepsMin || ""}
                              onChange={(e) =>
                                setNewRepsMin(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              className="w-full mt-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#EAB308]"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500">Máx</label>
                            <input
                              type="number"
                              value={newRepsMax || ""}
                              onChange={(e) =>
                                setNewRepsMax(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              className="w-full mt-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#EAB308]"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs text-zinc-500">Minutos</label>
                          <input
                            type="number"
                            value={newDurationMinutes || ""}
                            onChange={(e) =>
                              setNewDurationMinutes(
                                e.target.value ? parseInt(e.target.value) : undefined
                              )
                            }
                            className="w-full mt-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-[#EAB308]"
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-zinc-400">
                        Intensidade *
                      </label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {(["leve", "moderado", "intenso", "máximo"] as const).map(
                          (int) => (
                            <button
                              key={int}
                              onClick={() => setNewIntensity(int)}
                              className={`py-1.5 px-2 rounded text-xs font-semibold transition ${
                                newIntensity === int
                                  ? INTENSITY_COLORS[int]
                                  : "bg-white/5 text-zinc-400"
                              }`}
                            >
                              {INTENSITY_LABELS[int]}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-zinc-400">
                        Notas
                      </label>
                      <textarea
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="Ex: Foco na explosão na subida"
                        rows={2}
                        className="w-full mt-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#EAB308] resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setAddingExercise(false)}
                      className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddExercise}
                      disabled={!newExerciseName.trim()}
                      className="flex-1 py-2 px-3 rounded-lg bg-[#EAB308]/20 hover:bg-[#EAB308]/30 disabled:opacity-50 text-[#EAB308] text-xs font-bold transition"
                    >
                      Adicionar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-white/5 bg-black/50 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex-1 py-2 px-4 rounded-lg bg-[#EAB308]/20 hover:bg-[#EAB308]/30 disabled:opacity-50 text-[#EAB308] text-xs font-bold transition"
          >
            {saving ? "Salvando..." : isEditMode ? "Atualizar Plano" : "Criar Plano"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
