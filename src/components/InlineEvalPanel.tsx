"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Target, Shield, ArrowUpRight, Crosshair, Save, X } from "lucide-react";

interface InlineEvalPanelProps {
  studentId: string;
  studentName: string;
  lessonId: string;
  onSave: (evaluations: Record<string, number>) => void;
  onClose: () => void;
}

const FUNDAMENTALS = [
  { id: "saque", label: "Saque", icon: Target, color: "text-sky-400" },
  { id: "passe", label: "Passe/Defesa", icon: Shield, color: "text-emerald-400" },
  { id: "levantamento", label: "Levantamento", icon: ArrowUpRight, color: "text-purple-400" },
  { id: "ataque", label: "Ataque", icon: Activity, color: "text-red-400" },
  { id: "bloqueio", label: "Bloqueio", icon: Crosshair, color: "text-amber-400" },
] as const;

export default function InlineEvalPanel({
  studentId,
  studentName,
  lessonId,
  onSave,
  onClose,
}: InlineEvalPanelProps) {
  const [scores, setScores] = useState<Record<string, number>>({
    saque: 5,
    passe: 5,
    levantamento: 5,
    ataque: 5,
    bloqueio: 5,
  });

  const handleScoreChange = (fundamentalId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [fundamentalId]: value,
    }));
  };

  const handleSave = () => {
    onSave(scores);
    onClose();
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="bg-zinc-900/40 border-t border-zinc-800 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">Avaliar: {studentName}</h4>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-3">
          {FUNDAMENTALS.map((fund) => {
            const score = scores[fund.id];
            const Icon = fund.icon;
            return (
              <div key={fund.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${fund.color}`} />
                    <span className="text-[12px] font-semibold text-white">
                      {fund.label}
                    </span>
                  </div>
                  <span className="text-[12px] font-bold text-[#EAB308]">
                    {score.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={score}
                  onChange={(e) =>
                    handleScoreChange(fund.id, Number(e.target.value))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#EAB308]"
                />
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#EAB308] to-amber-600 text-black text-xs font-bold py-2 rounded-lg hover:shadow-[0_8px_20px_rgba(234,179,8,0.3)] transition-shadow"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-zinc-800/50 text-zinc-300 text-xs font-semibold rounded-lg hover:bg-zinc-800 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
