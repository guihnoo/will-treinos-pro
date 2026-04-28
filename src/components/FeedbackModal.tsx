"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Send, Zap, Shield, Target, TrendingUp } from "lucide-react";
import { useApp, Student } from "@/context/AppContext";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

interface Props {
  lessonId: string;
  student: Student;
  onClose: () => void;
}

const SKILLS = [
  { id: "saque", label: "Saque", icon: "🏐" },
  { id: "recepcao", label: "Recepção", icon: "🛡️" },
  { id: "levantamento", label: "Levantamento", icon: "🎯" },
  { id: "ataque", label: "Ataque", icon: "⚡" },
  { id: "bloqueio", label: "Bloqueio", icon: "🧱" },
  { id: "defesa", label: "Defesa", icon: "🤸" },
  { id: "condicionamento", label: "Condicionamento", icon: "💪" },
  { id: "tatica", label: "Tática", icon: "🧠" },
];

const TRAINING_TYPES = ["Fundamentos", "Jogo", "Simulado", "Físico", "Técnico", "Misto"];

export default function FeedbackModal({ lessonId, student, onClose }: Props) {
  const { addFeedback, addNotification } = useApp();
  useBodyScrollLock(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [trainingTime, setTrainingTime] = useState(60);
  const [trainingType, setTrainingType] = useState("Fundamentos");
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const toggleSkill = (id: string, list: "strengths" | "improvements") => {
    const setter = list === "strengths" ? setStrengths : setImprovements;
    const other = list === "strengths" ? setImprovements : setStrengths;
    setter(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    other(prev => prev.filter(s => s !== id));
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    addFeedback({
      lessonId, studentId: student.id, rating, trainingTime, trainingType,
      strengths, improvements, professorNote: note,
      date: new Date().toISOString().split("T")[0],
    });
    addNotification({
      type: "performance",
      title: "Novo Feedback de Aula",
      message: `Will Monteiro avaliou sua performance com ${rating} estrelas!`,
      time: "agora",
      read: false,
      studentId: student.id
    });
    setSubmitted(true);
    setTimeout(onClose, 1500);
  };

  const displayRating = hoverRating || rating;

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
            {submitted ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-12 text-center">
                <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6 }}
                  className="text-6xl mb-4">🏐</motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Feedback Registrado!</h3>
                <p className="text-sm text-zinc-500">Performance de {student.name.split(" ")[0]} salva com sucesso.</p>
              </motion.div>
            ) : (
              <motion.div key="form" className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.avatar}`}
                      className="w-12 h-12 rounded-full border-2 border-zinc-800" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Feedback — {student.name.split(" ")[0]}</h3>
                      <p className="text-xs text-zinc-500">Avaliação de performance pós-aula</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="text-zinc-600 hover:text-white p-1"><X className="w-5 h-5" /></button>
                </div>

                {/* Rating Stars */}
                <div className="mb-6">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block">Performance Geral</label>
                  <div className="flex items-center gap-1.5 justify-center">
                    {[1, 2, 3, 4, 5].map(n => (
                      <motion.button key={n} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(n)}
                        className="p-1"
                      >
                        <Star className={`w-8 h-8 transition-colors ${n <= displayRating ? "text-[#EAB308] fill-[#EAB308]" : "text-zinc-700"}`} />
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-center text-sm mt-2 font-medium" style={{ color: displayRating >= 4 ? "#22C55E" : displayRating >= 3 ? "#EAB308" : displayRating >= 1 ? "#F97316" : "#666" }}>
                    {displayRating === 5 && "Excelente — nível Elite"}
                    {displayRating === 4 && "Muito bom — sólido"}
                    {displayRating === 3 && "Bom — consistente"}
                    {displayRating === 2 && "Em evolução — ajuste fino"}
                    {displayRating === 1 && "Precisa melhorar — com foco"}
                    {displayRating === 0 && "Selecione a nota"}
                  </p>
                </div>

                {/* Training Info */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Tempo (min)</label>
                    <input type="number" value={trainingTime}
                      onChange={e => setTrainingTime(parseInt(e.target.value) || 0)}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm outline-none focus:border-[#EAB308]/50" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Tipo de Treino</label>
                    <select value={trainingType} onChange={e => setTrainingType(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm outline-none focus:border-[#EAB308]/50">
                      {TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Strengths */}
                <div className="mb-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                    💪 Destaques Positivos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map(s => (
                      <motion.button key={s.id} whileTap={{ scale: 0.9 }}
                        onClick={() => toggleSkill(s.id, "strengths")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          strengths.includes(s.id)
                            ? "bg-[#22C55E] text-white border-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                            : "bg-black/50 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                        }`}>{s.icon} {s.label}</motion.button>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div className="mb-5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                    🎯 Pontos a Melhorar
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map(s => (
                      <motion.button key={s.id} whileTap={{ scale: 0.9 }}
                        onClick={() => toggleSkill(s.id, "improvements")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          improvements.includes(s.id)
                            ? "bg-[#F97316] text-white border-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                            : "bg-black/50 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                        }`}>{s.icon} {s.label}</motion.button>
                    ))}
                  </div>
                </div>

                {/* Professor Note */}
                <div className="mb-5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">📝 Nota do Professor</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Observações sobre a performance do aluno..."
                    rows={3}
                    className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50 resize-none placeholder-zinc-600" />
                </div>

                {/* Submit */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    rating > 0
                      ? "bg-[#EAB308] text-black shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                      : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                  }`}>
                  <Send className="w-4 h-4" /> Registrar Feedback
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
