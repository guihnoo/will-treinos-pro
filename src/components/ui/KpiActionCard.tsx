"use client";

import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { PRESS_SCALE } from "@/components/ui/motionTokens";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";

const ACCENT = {
  emerald: {
    gradientClass:
      "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(34,197,94,0.19),transparent_58%)] opacity-80",
    hoverBorderColor: "rgba(34,197,94,0.45)",
    hoverShadow:
      "0 24px 60px rgba(0,0,0,0.58), 0 0 0 1px rgba(34,197,94,0.18), 0 0 32px rgba(34,197,94,0.15)",
  },
  gold: {
    gradientClass:
      "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_0%,rgba(234,179,8,0.16),transparent_56%)] opacity-80",
    hoverBorderColor: "rgba(234,179,8,0.45)",
    hoverShadow:
      "0 24px 60px rgba(0,0,0,0.58), 0 0 0 1px rgba(234,179,8,0.14), 0 0 32px rgba(234,179,8,0.14)",
  },
} as const;

export type KpiActionAccent = keyof typeof ACCENT;

type KpiActionCardProps = {
  accent: KpiActionAccent;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  onClick: () => void;
  "aria-label"?: string;
  className?: string;
};

export default function KpiActionCard({
  accent,
  title,
  icon: Icon,
  children,
  onClick,
  "aria-label": ariaLabel,
  className = "",
}: KpiActionCardProps) {
  const a = ACCENT[accent];
  return (
    <motion.article
      role="button"
      tabIndex={0}
      whileHover={{
        y: -4,
        scale: 1.01,
        borderColor: a.hoverBorderColor,
        boxShadow: a.hoverShadow,
      }}
      whileTap={PRESS_SCALE}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#050505]/80 p-4 backdrop-blur-2xl transition-colors hover:bg-[#0a0a0a] min-h-[176px] ${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD} ${className}`}
      aria-label={ariaLabel ?? title}
    >
      <div className={a.gradientClass} aria-hidden />
      <div className="relative mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{title}</p>
        <Icon className="h-4 w-4 text-[#EAB308]" aria-hidden />
      </div>
      <div className="relative">{children}</div>
    </motion.article>
  );
}
