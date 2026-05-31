"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Trophy, Zap, CalendarCheck } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface Goal {
  id: string;
  title: string;
  target_type: string;
  target_value?: number;
  target_tier?: string;
  deadline?: string;
}

const TIER_XP: Record<string, number> = {
  bronze: 500, prata: 1500, ouro: 3000, diamante: 6000, elite: 10000,
};

interface Props {
  studentCrmId: string;
  totalXP: number;
  checkinCount: number;
}

export default function StudentGoalsCard({ studentCrmId, totalXP, checkinCount }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (!studentCrmId) return;
    const sb = getSupabaseClient();
    sb.from("student_goals")
      .select("id, title, target_type, target_value, target_tier, deadline")
      .eq("student_id", studentCrmId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setGoals(data); });
  }, [studentCrmId]);

  if (goals.length === 0) return null;

  function progress(g: Goal): { pct: number; current: number; target: number; label: string } {
    if (g.target_type === "xp" && g.target_value) {
      return { pct: Math.min(100, Math.round((totalXP / g.target_value) * 100)), current: totalXP, target: g.target_value, label: "XP" };
    }
    if (g.target_type === "checkins" && g.target_value) {
      return { pct: Math.min(100, Math.round((checkinCount / g.target_value) * 100)), current: checkinCount, target: g.target_value, label: "check-ins" };
    }
    if (g.target_type === "tier" && g.target_tier) {
      const tierXP = TIER_XP[g.target_tier] ?? 500;
      return { pct: Math.min(100, Math.round((totalXP / tierXP) * 100)), current: totalXP, target: tierXP, label: "XP" };
    }
    return { pct: 0, current: 0, target: 1, label: "" };
  }

  function icon(type: string) {
    if (type === "checkins") return <CalendarCheck size={13} className="text-emerald-400" />;
    if (type === "tier") return <Trophy size={13} className="text-amber-400" />;
    return <Zap size={13} className="text-[#EAB308]" />;
  }

  const fmtN = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">Metas do Coach</p>
      {goals.map(g => {
        const { pct, current, target, label } = progress(g);
        const done = pct >= 100;
        return (
          <div key={g.id} className={`rounded-2xl border px-4 py-3 ${done ? "border-emerald-500/30 bg-emerald-500/8" : "border-zinc-800/60 bg-zinc-900/30"}`}>
            <div className="flex items-center gap-2 mb-2">
              {icon(g.target_type)}
              <p className="text-xs font-bold text-white flex-1 truncate">{g.title}</p>
              {done && <Trophy size={12} className="text-emerald-400 flex-shrink-0" />}
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-gradient-to-r from-[#EAB308] to-[#F97316]"}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>{fmtN(current)} / {fmtN(target)} {label}</span>
              <span className={done ? "text-emerald-400 font-black" : "text-zinc-600"}>
                {done ? "✓ Conquistada!" : `${pct}%`}
                {g.deadline && !done ? ` · até ${new Date(g.deadline + "T00:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}` : ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
