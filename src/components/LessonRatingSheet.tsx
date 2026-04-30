"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Star, Zap, Brain, TrendingUp, MessageSquare, CheckCircle2 } from "lucide-react";
import type { LessonRating, TrainingMood } from "@/context/types";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

// ─── Mood options ─────────────────────────────────────────────────────────────
const MOODS: { id: TrainingMood; emoji: string; label: string; color: string }[] = [
  { id: "excelente", emoji: "⭐", label: "Excelente",  color: "#EAB308" },
  { id: "bom",       emoji: "💪", label: "Bom",        color: "#22C55E" },
  { id: "cansativo", emoji: "😮‍💨", label: "Cansativo",  color: "#F97316" },
  { id: "dificil",   emoji: "😤", label: "Difícil",    color: "#8B5CF6" },
];

// ─── Aspects to rate ─────────────────────────────────────────────────────────
const ASPECTS = [
  { key: "intensidade", label: "Intensidade", icon: Zap,         color: "#EF4444", tip: "Como foi o nível de esforço?" },
  { key: "tecnica",     label: "Técnica",     icon: Star,        color: "#EAB308", tip: "Evoluiu na parte técnica?" },
  { key: "didatica",    label: "Didática",    icon: Brain,       color: "#8B5CF6", tip: "O professor foi claro e objetivo?" },
  { key: "evolucao",    label: "Evolução",    icon: TrendingUp,  color: "#22C55E", tip: "Sentiu que cresceu hoje?" },
] as const;

// ─── Star rating component ────────────────────────────────────────────────────
function StarRating({
  value, onChange, color
}: { value: number; onChange: (v: number) => void; color: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <motion.button
          key={i}
          whileTap={{ scale: 0.8 }}
          whileHover={{ scale: 1.2 }}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="p-0.5"
        >
          <Star
            className="w-7 h-7 transition-all duration-150"
            style={{
              color: i <= (hover || value) ? color : "#27272a",
              fill: i <= (hover || value) ? color : "transparent",
            }}
          />
        </motion.button>
      ))}
    </div>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────
interface Props {
  lessonId: string;
  lessonTitle: string;
  lessonDate: string;
  studentId: string;
  existingRating?: LessonRating;
  onSubmit: (rating: Omit<LessonRating, "id" | "createdAt">) => void;
  onClose: () => void;
}

export default function LessonRatingSheet({
  lessonId, lessonTitle, lessonDate, studentId, existingRating, onSubmit, onClose
}: Props) {
  const [ratings, setRatings] = useState<Record<string, number>>({
    intensidade: existingRating?.intensidade || 0,
    tecnica:     existingRating?.tecnica     || 0,
    didatica:    existingRating?.didatica    || 0,
    evolucao:    existingRating?.evolucao    || 0,
  });
  const [mood, setMood]       = useState<TrainingMood>(existingRating?.mood || "bom");
  const [comment, setComment] = useState(existingRating?.comment || "");
  const [submitted, setSubmitted] = useState(false);
  const [activeAspect, setActiveAspect] = useState<string | null>(null);
  useBodyScrollLock(true);

  const allRated = Object.values(ratings).every(v => v > 0);
  const avg = allRated ? (Object.values(ratings).reduce((s, v) => s + v, 0) / 4).toFixed(1) : "—";

  const handleSubmit = () => {
    if (!allRated) return;
    setSubmitted(true);
    setTimeout(() => {
      onSubmit({
        lessonId,
        studentId,
        date: lessonDate,
        intensidade: ratings.intensidade,
        tecnica:     ratings.tecnica,
        didatica:    ratings.didatica,
        evolucao:    ratings.evolucao,
        mood,
        comment: comment.trim() || undefined,
      });
      onClose();
    }, 1400);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      data-modal-overlay
      className="fixed inset-0 z-[200] overflow-y-auto overscroll-y-contain bg-black/90 backdrop-blur-md flex flex-col justify-end"
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl mx-auto bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl flex flex-col min-h-0 max-h-[92dvh] overflow-hidden shadow-[0_-24px_80px_rgba(0,0,0,0.55)]">

        {/* Handle */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />

        {/* Celebration overlay when submitted */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0A] rounded-t-3xl z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                <CheckCircle2 className="w-20 h-20 text-[#22C55E]" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mt-4">Feedback enviado!</motion.p>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="text-zinc-500 text-sm mt-1">Obrigado pela avaliação 🏐</motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 border-b border-zinc-900 bg-[#0A0A0A]/95 backdrop-blur-sm flex-shrink-0">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Avaliar Treino</p>
            <h2 className="text-base font-bold text-white leading-tight">{lessonTitle}</h2>
            <p className="text-[11px] text-zinc-600">
              {new Date(lessonDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-6">

          {/* Mood selector */}
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-3">Como foi o treino hoje?</p>
            <div className="grid grid-cols-4 gap-2">
              {MOODS.map(m => (
                <motion.button
                  key={m.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMood(m.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                    mood === m.id
                      ? "border-[#EAB308] bg-[#EAB308]/10"
                      : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                  }`}>
                  <span className="text-2xl">{m.emoji}</span>
                  <span className={`text-[10px] font-bold ${mood === m.id ? "text-[#EAB308]" : "text-zinc-500"}`}>
                    {m.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Aspect ratings */}
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-3">Avalie cada aspecto</p>
            <div className="space-y-4">
              {ASPECTS.map(({ key, label, icon: Icon, color, tip }) => (
                <motion.div
                  key={key}
                  layout
                  onClick={() => setActiveAspect(activeAspect === key ? null : key)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    ratings[key] > 0 ? "border-zinc-700 bg-zinc-900/30" : "border-zinc-800/50 bg-zinc-900/10"
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <span className="font-bold text-sm text-white">{label}</span>
                      {ratings[key] > 0 && (
                        <span className="text-xs font-bold ml-1" style={{ color }}>
                          {["", "★", "★★", "★★★", "★★★★", "★★★★★"][ratings[key]]}
                        </span>
                      )}
                    </div>
                    <StarRating
                      value={ratings[key]}
                      onChange={v => setRatings(prev => ({ ...prev, [key]: v }))}
                      color={color}
                    />
                  </div>
                  <AnimatePresence>
                    {activeAspect === key && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-[11px] text-zinc-500 overflow-hidden">
                        {tip}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Average score preview */}
          {allRated && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-4 p-4 bg-[#EAB308]/5 border border-[#EAB308]/20 rounded-2xl">
              <div className="w-14 h-14 rounded-full border-2 border-[#EAB308] flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-[#EAB308]">{avg}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Média do treino</p>
                <p className="text-xs text-zinc-500">Seu professor receberá este feedback</p>
              </div>
            </motion.div>
          )}

          {/* Optional comment */}
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">
              <MessageSquare className="w-3 h-3 inline mr-1" />
              Comentário (opcional)
            </p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Alguma dúvida, sugestão ou ponto de destaque?"
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-700 resize-none transition-colors"
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="sticky bottom-0 z-20 px-5 py-4 border-t border-zinc-900 bg-[#0A0A0A]/95 backdrop-blur-sm flex-shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!allRated || submitted}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
              allRated && !submitted
                ? "bg-[#EAB308] text-black shadow-[0_0_25px_rgba(234,179,8,0.2)]"
                : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
            }`}>
            <Send className="w-5 h-5" />
            {allRated ? "Enviar Feedback" : `Avalie todos os ${4 - Object.values(ratings).filter(v => v > 0).length} aspecto(s) restante(s)`}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
