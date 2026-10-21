"use client";

import React from "react";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { triggerHapticImpact } from "@/lib/hapticFeedback";

export interface CourtEvaluationSliderProps {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  weightBadge?: string;
  value: number; // 1 to 10
  onChange: (newValue: number) => void;
  disabled?: boolean;
}

export function getScoreStyle(score: number): {
  color: string;
  borderColor: string;
  bgColor: string;
  label: string;
} {
  if (score >= 8) {
    return {
      color: "text-emerald-400",
      borderColor: "border-emerald-500/50",
      bgColor: "bg-emerald-500/15",
      label: score >= 9 ? "Elite" : "Excelente",
    };
  }
  if (score >= 5) {
    return {
      color: "text-[#EAB308]",
      borderColor: "border-[#EAB308]/50",
      bgColor: "bg-[#EAB308]/15",
      label: score >= 7 ? "Muito Bom" : "Regular",
    };
  }
  return {
    color: "text-orange-400",
    borderColor: "border-orange-500/50",
    bgColor: "bg-orange-500/15",
    label: "Em Ajuste",
  };
}

/**
 * Componente de Avaliação Rápida para o Modo Quadra (Touch Target >= 56px).
 * Desenvolvido para uso sob sol, suor e velocidade na quadra de vôlei.
 */
export function CourtEvaluationSlider({
  label,
  icon: Icon,
  weightBadge,
  value,
  onChange,
  disabled = false,
}: CourtEvaluationSliderProps) {
  const style = getScoreStyle(value);

  const handleAdjust = (delta: number) => {
    const next = Math.max(1, Math.min(10, value + delta));
    if (next !== value) {
      triggerHapticImpact("medium");
      onChange(next);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    if (next !== value) {
      triggerHapticImpact("medium");
      onChange(next);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-3.5 sm:p-4 shadow-sm space-y-3">
      {/* Header do Fundamento / Pilar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${style.borderColor} ${style.bgColor}`}>
              <Icon className={`h-4 w-4 ${style.color}`} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">{label}</span>
              {weightBadge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-white/10 bg-white/5 font-semibold text-zinc-400">
                  {weightBadge}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${style.color}`}>
              {style.label}
            </span>
          </div>
        </div>

        {/* Display da Nota Gigante */}
        <div className={`flex items-baseline gap-1 px-3 py-1 rounded-xl border ${style.borderColor} ${style.bgColor}`}>
          <span className={`text-2xl font-black tabular-nums ${style.color}`}>
            {value}
          </span>
          <span className="text-[10px] font-bold text-zinc-400">/10</span>
        </div>
      </div>

      {/* Controles de Toque Rápido (Modo Quadra >= 56px) */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          disabled={disabled || value <= 1}
          onClick={() => handleAdjust(-1)}
          aria-label={`Diminuir nota de ${label}`}
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-zinc-700/70 bg-zinc-900 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/90 active:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <Minus className="h-6 w-6" />
        </motion.button>

        {/* Slider Horizontal Amplo e Deslizável */}
        <div className="flex-1 px-1 flex flex-col justify-center">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={value}
            disabled={disabled}
            onChange={handleSliderChange}
            aria-label={`Deslizador de nota de ${label}`}
            className="w-full h-4 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#EAB308] focus:outline-none"
          />
          {/* Marcadores de 1 a 10 para referência visual rápida sob sol */}
          <div className="flex justify-between px-1 mt-1.5 text-[10px] font-black text-zinc-600 select-none">
            <span>1</span>
            <span>3</span>
            <span>5</span>
            <span>7</span>
            <span>9</span>
            <span>10</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          disabled={disabled || value >= 10}
          onClick={() => handleAdjust(1)}
          aria-label={`Aumentar nota de ${label}`}
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-[#EAB308]/40 bg-[#EAB308]/15 text-[#EAB308] hover:border-[#EAB308]/70 hover:bg-[#EAB308]/25 active:bg-[#EAB308]/35 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <Plus className="h-6 w-6 font-bold" />
        </motion.button>
      </div>

      {/* Botões modulares de 1 toque (Seleção direta de notas frequentes) */}
      <div className="grid grid-cols-5 gap-1.5 pt-1">
        {[2, 4, 6, 8, 10].map((quickScore) => {
          const isSelected = value === quickScore;
          return (
            <motion.button
              key={quickScore}
              whileTap={{ scale: 0.9 }}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (value !== quickScore) {
                  triggerHapticImpact("medium");
                  onChange(quickScore);
                }
              }}
              className={`h-10 rounded-xl text-xs font-black transition-all ${
                isSelected
                  ? "bg-[#EAB308] text-black shadow-[0_0_12px_rgba(234,179,8,0.4)]"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              {quickScore}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default CourtEvaluationSlider;
