"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * Shared premium chrome for student-facing routes (Deep Black + Gold glass).
 */
export default function StudentShell({ children }: { children: React.ReactNode }) {
  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  return (
    <div className="w-full min-h-full flex flex-col bg-gradient-to-b from-black via-[#050508] to-black">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mb-3 pt-[max(0.5rem,env(safe-area-inset-top))] px-1"
      >
        <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/55 backdrop-blur-2xl px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.55)] ring-1 ring-[#EAB308]/[0.12]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#EAB308]/90">
                Will Treinos PRO
              </p>
              <p className="text-xs text-zinc-400 capitalize truncate">{dateLabel}</p>
            </div>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#EAB308] text-sm font-black text-black shadow-[0_0_20px_rgba(234,179,8,0.35)]">
              W
            </div>
          </div>
        </div>
      </motion.header>
      <div className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6 pb-[calc(7rem+env(safe-area-inset-bottom))]">{children}</div>
    </div>
  );
}
