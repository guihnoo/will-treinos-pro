"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, Users, User, Trophy, Save, Activity, Target, Shield, ArrowUpRight, Crosshair } from "lucide-react";
import { useApp } from "@/context/AppContext";
import UserAvatar from "@/components/ui/UserAvatar";

interface LessonRatingsSheetProps {
  lesson: any;
  onSave: () => void;
}

const FUNDAMENTALS = [
  { id: "saque", label: "Saque", icon: Target, weight: 1, color: "text-sky-400" },
  { id: "passe", label: "Passe/Defesa", icon: Shield, weight: 2, color: "text-emerald-400" },
  { id: "levantamento", label: "Levantamento", icon: ArrowUpRight, weight: 3, color: "text-purple-400" },
  { id: "ataque", label: "Ataque", icon: Activity, weight: 3, color: "text-red-400" },
  { id: "bloqueio", label: "Bloqueio", icon: Crosshair, weight: 2, color: "text-amber-400" },
] as const;

export default function LessonRatingsSheet({ lesson, onSave }: LessonRatingsSheetProps) {
  const { students } = useApp();
  const [tab, setTab] = useState<"squad" | "athlete">("squad");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(lesson.enrolledStudents[0] || null);

  // State for specific evaluations: { studentId: { saque: 8, saque_feedback: "...", ... } }
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});
  // State to toggle hidden feedback inputs
  const [activeFeedbackInput, setActiveFeedbackInput] = useState<string | null>(null);
  
  const [squadFeedback, setSquadFeedback] = useState("");

  const enrolledAthletes = lesson.enrolledStudents
    .map((id: string) => students.find((s) => s.id === id))
    .filter(Boolean);

  const handleScoreChange = (studentId: string, fundamentalId: string, value: number) => {
    setEvaluations((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [fundamentalId]: value,
      },
    }));
  };

  const handleFeedbackChange = (studentId: string, fundamentalId: string, text: string) => {
    setEvaluations((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [`${fundamentalId}_feedback`]: text,
      },
    }));
  };

  const currentEval = selectedStudentId ? evaluations[selectedStudentId] || {} : {};

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-4 p-1 bg-black/40 rounded-xl border border-white/5">
        <button
          onClick={() => setTab("squad")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${
            tab === "squad" ? "bg-[#EAB308]/20 text-[#EAB308] shadow-[0_0_15px_rgba(234,179,8,0.2)]" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Users className="w-4 h-4" />
          Visão do Squad
        </button>
        <button
          onClick={() => setTab("athlete")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${
            tab === "athlete" ? "bg-[#EAB308]/20 text-[#EAB308] shadow-[0_0_15px_rgba(234,179,8,0.2)]" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <User className="w-4 h-4" />
          Raio-X do Atleta
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-6 pr-2 touch-pan-y [-webkit-overflow-scrolling:touch] space-y-4">
        <AnimatePresence mode="wait">
          {tab === "squad" ? (
            <motion.div
              key="squad"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/90">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-[#EAB308]" />
                  <p className="text-[12px] font-bold uppercase tracking-wide text-zinc-300">Grito de Vestiário (Feedback da Turma)</p>
                </div>
                <p className="text-[11px] text-zinc-500 mb-3">Esta mensagem será enviada para a Dashboard de todos os alunos presentes hoje.</p>
                <textarea
                  value={squadFeedback}
                  onChange={(e) => setSquadFeedback(e.target.value)}
                  placeholder="Ex: Treino tático muito intenso hoje. A defesa do time melhorou 80%."
                  className="w-full min-h-[120px] bg-black/50 border border-white/10 rounded-xl p-3 text-[13px] text-white focus:outline-none focus:border-[#EAB308]/50 transition-colors placeholder:text-zinc-600 resize-none"
                />
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Treino Intenso", "Foco na Defesa", "Saques Precisos"].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setSquadFeedback(prev => prev ? `${prev} | ${tag}` : tag)}
                      className="px-2 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] text-zinc-400 hover:text-[#EAB308] hover:border-[#EAB308]/30 transition"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="athlete"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {/* Athlete Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {enrolledAthletes.map((athlete: any) => (
                  <button
                    key={athlete.id}
                    onClick={() => setSelectedStudentId(athlete.id)}
                    className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                      selectedStudentId === athlete.id
                        ? "bg-[#EAB308] text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                        : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    <UserAvatar
                      name={athlete.name}
                      photo={athlete.avatar}
                      size="sm"
                      className={selectedStudentId === athlete.id ? "border-black/20 shadow-none ring-0" : ""}
                    />
                    {athlete.name}
                  </button>
                ))}
              </div>

              {selectedStudentId && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-xl border border-[#EAB308]/25 bg-[#EAB308]/8 px-3 py-2">
                    <UserAvatar
                      name={enrolledAthletes.find((athlete: any) => athlete.id === selectedStudentId)?.name ?? "Atleta"}
                      photo={enrolledAthletes.find((athlete: any) => athlete.id === selectedStudentId)?.avatar}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-black text-zinc-100">
                        {enrolledAthletes.find((athlete: any) => athlete.id === selectedStudentId)?.name ?? "Atleta"}
                      </p>
                      <p className="text-[10px] text-zinc-500">Avaliação individual ativa</p>
                    </div>
                  </div>
                  <div className="bg-[#050505] border border-white/5 rounded-2xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#EAB308] font-bold mb-4">Motor de XP (5 Fundamentos)</p>
                    
                    <div className="space-y-6">
                      {FUNDAMENTALS.map((fund) => {
                        const score = currentEval[fund.id] ?? 5;
                        const hasFeedback = !!currentEval[`${fund.id}_feedback`];
                        const inputId = `${selectedStudentId}-${fund.id}`;
                        const isInputActive = activeFeedbackInput === inputId;

                        return (
                          <div key={fund.id} className="relative">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <fund.icon className={`w-4 h-4 ${fund.color}`} />
                                <span className="text-[12px] font-bold text-white">{fund.label}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-zinc-500">Peso {fund.weight}x</span>
                              </div>
                              <span className="text-[14px] font-black tabular-nums text-white">{score.toFixed(1)}</span>
                            </div>
                            
                            <input
                              type="range"
                              min={0}
                              max={10}
                              step={0.5}
                              value={score}
                              onChange={(e) => handleScoreChange(selectedStudentId, fund.id, Number(e.target.value))}
                              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#EAB308]"
                            />

                            {/* Hidden Feedback Toggle */}
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={() => setActiveFeedbackInput(isInputActive ? null : inputId)}
                                className={`inline-flex items-center gap-1.5 text-[10px] font-bold transition-colors ${
                                  hasFeedback || isInputActive ? "text-[#EAB308]" : "text-zinc-600 hover:text-zinc-400"
                                }`}
                              >
                                <MessageSquarePlus className="w-3 h-3" />
                                {hasFeedback ? "Feedback Salvo (Editar)" : "Adicionar Observação Oculta"}
                              </button>
                            </div>

                            {/* Hidden Feedback Area (Animated Drawer) */}
                            <AnimatePresence>
                              {isInputActive && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden mt-2"
                                >
                                  <textarea
                                    autoFocus
                                    value={currentEval[`${fund.id}_feedback`] || ""}
                                    onChange={(e) => handleFeedbackChange(selectedStudentId, fund.id, e.target.value)}
                                    placeholder={`Observação específica sobre o ${fund.label} do atleta...`}
                                    className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-2 text-[11px] text-zinc-200 focus:outline-none focus:border-[#EAB308]/50 resize-none"
                                    rows={2}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-4 border-t border-white/5 mt-auto shrink-0">
        <button
          onClick={onSave}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#EAB308] to-amber-600 text-black font-black text-[13px] py-3.5 rounded-xl shadow-[0_10px_25px_rgba(234,179,8,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Save className="w-4 h-4" />
          SALVAR AVALIAÇÕES NO COFRE
        </button>
      </div>
    </div>
  );
}
