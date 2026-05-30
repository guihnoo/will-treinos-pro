"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Zap, X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { wtLsGetString, wtLsSetString } from "@/lib/willLocalStorage";

interface HighlightData {
  studentId: string;
  studentName: string;
  weekStart: string;
  note: string | null;
  xpAwarded: number;
}

interface Props {
  studentCrmId: string;
  firstName: string;
}

const CACHE_KEY = (id: string) => `wt_highlight_${id}`;
const DISMISSED_KEY = (id: string, week: string) => `wt_highlight_dismissed_${id}_${week}`;

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  return mon.toISOString().slice(0, 10);
}

export default function WeeklyHighlightBanner({ studentCrmId, firstName }: Props) {
  const [highlight, setHighlight] = useState<HighlightData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const week = getMonday();
    const dismissedKey = DISMISSED_KEY(studentCrmId, week);
    if (wtLsGetString(dismissedKey, "") === "1") {
      setDismissed(true);
      return;
    }

    // Check cache first
    const cached = wtLsGetString(CACHE_KEY(studentCrmId), "");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as HighlightData;
        if (parsed.weekStart === week) {
          setHighlight(parsed);
          setVisible(true);
          return;
        }
      } catch { /* bad cache */ }
    }

    // Query Supabase directly (RLS allows student to read own)
    const sb = getSupabaseClient();
    sb.from("weekly_highlights")
      .select("student_id, week_start, note, xp_awarded")
      .eq("student_id", studentCrmId)
      .eq("week_start", week)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const h: HighlightData = {
          studentId: data.student_id,
          studentName: firstName,
          weekStart: data.week_start,
          note: data.note ?? null,
          xpAwarded: data.xp_awarded,
        };
        wtLsSetString(CACHE_KEY(studentCrmId), JSON.stringify(h));
        setHighlight(h);
        setVisible(true);
      });
  }, [studentCrmId, firstName]);

  function dismiss() {
    const week = getMonday();
    wtLsSetString(DISMISSED_KEY(studentCrmId, week), "1");
    setDismissed(true);
  }

  if (dismissed || !visible || !highlight) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="relative rounded-3xl border border-[#EAB308]/50 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(234,179,8,0.12) 0%, rgba(234,179,8,0.04) 60%, transparent 100%)",
          boxShadow: "0 0 40px rgba(234,179,8,0.12), inset 0 1px 0 rgba(234,179,8,0.2)",
        }}
      >
        {/* Glow overlay */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(234,179,8,0.5) 0%, transparent 70%)" }}
        />

        {/* Dismiss button */}
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors z-10"
          aria-label="Fechar banner"
        >
          <X size={14} />
        </button>

        <div className="px-4 py-4 pr-10">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-3">
            <motion.div
              animate={{ rotate: [0, 8, -8, 8, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#EAB308]/50 bg-[#EAB308]/15 flex-shrink-0 text-xl"
            >
              ⭐
            </motion.div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#EAB308]/70">Esta semana</p>
              <p className="text-base font-black text-white leading-tight">
                {firstName}, você é o Destaque! 🏐
              </p>
            </div>
          </div>

          {/* Note from coach */}
          {highlight.note && (
            <div className="mb-3 rounded-2xl border border-[#EAB308]/20 bg-[#EAB308]/5 px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#EAB308]/60 mb-1">Recado do coach</p>
              <p className="text-sm text-zinc-200 leading-relaxed italic">"{highlight.note}"</p>
            </div>
          )}

          {/* XP badge */}
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 400, damping: 20 }}
              className="flex items-center gap-1.5 rounded-full border border-[#EAB308]/40 bg-[#EAB308]/15 px-3 py-1"
            >
              <Zap size={12} className="text-[#EAB308]" />
              <span className="text-[11px] font-black text-[#EAB308]">+{highlight.xpAwarded} XP desbloqueados</span>
            </motion.div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              <Star size={10} />
              <span>Conquista da semana</span>
            </div>
          </div>
        </div>

        {/* Shimmer line */}
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 h-0.5 w-1/3 bg-gradient-to-r from-transparent via-[#EAB308]/60 to-transparent"
        />
      </motion.div>
    </AnimatePresence>
  );
}
