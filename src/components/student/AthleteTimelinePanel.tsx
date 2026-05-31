"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Trophy, Zap, Star, CheckCircle2, CalendarCheck, MessageSquare, TrendingUp, Heart } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface TimelineEvent {
  id: string;
  type: "tier_unlock" | "checkin_milestone" | "weekly_highlight" | "first_rating" | "evaluation" | "checkin";
  date: string;
  title: string;
  subtitle?: string;
  xp?: number;
  emoji?: string;
}

const TYPE_META: Record<TimelineEvent["type"], { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string; border: string }> = {
  tier_unlock:        { icon: Trophy,        color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30"  },
  checkin_milestone:  { icon: Zap,           color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30"},
  weekly_highlight:   { icon: Star,          color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/30" },
  first_rating:       { icon: MessageSquare, color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/30" },
  evaluation:         { icon: TrendingUp,    color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30"   },
  checkin:            { icon: CalendarCheck, color: "text-teal-400",    bg: "bg-teal-500/10",    border: "border-teal-500/30"   },
};

const TIER_THRESHOLDS = [
  { min: 10000, label: "Elite",    emoji: "👑" },
  { min: 6000,  label: "Diamante", emoji: "💎" },
  { min: 3000,  label: "Ouro",     emoji: "🥇" },
  { min: 1500,  label: "Prata",    emoji: "🥈" },
  { min: 500,   label: "Bronze",   emoji: "🥉" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

interface Props {
  studentCrmId: string;
  studentName: string;
  onClose: () => void;
}

export default function AthleteTimelinePanel({ studentCrmId, studentName, onClose }: Props) {
  const [events, setEvents]   = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Sem sessão");

      const all: TimelineEvent[] = [];

      // 1. XP log — tier unlocks + checkin milestones
      const { data: xpRows } = await sb
        .from("xp_log")
        .select("points, type, created_at")
        .eq("student_id", studentCrmId)
        .eq("validation_passed", true)
        .order("created_at", { ascending: true });

      let cumXP = 0;
      let checkinCount = 0;
      const unlockedTiers = new Set<string>();

      for (const row of xpRows ?? []) {
        const pts = row.points as number;
        const at  = row.created_at as string;
        cumXP += pts;

        if (row.type === "checkin") {
          checkinCount++;
          // Milestone every 10 check-ins
          if (checkinCount === 1 || checkinCount % 10 === 0) {
            all.push({
              id: `checkin-${checkinCount}-${at}`,
              type: checkinCount === 1 ? "checkin" : "checkin_milestone",
              date: at,
              title: checkinCount === 1 ? "Primeiro check-in!" : `${checkinCount}° check-in`,
              subtitle: checkinCount === 1 ? "A jornada começou aqui." : `Consistência é tudo.`,
              emoji: checkinCount === 1 ? "🎉" : "⚡",
            });
          }
        }

        // Tier unlock
        for (const tier of TIER_THRESHOLDS) {
          if (cumXP >= tier.min && !unlockedTiers.has(tier.label)) {
            unlockedTiers.add(tier.label);
            all.push({
              id: `tier-${tier.label}-${at}`,
              type: "tier_unlock",
              date: at,
              title: `${tier.emoji} ${tier.label} desbloqueado!`,
              subtitle: `${(cumXP / 1000).toFixed(1)}k XP acumulados`,
              xp: tier.min,
              emoji: tier.emoji,
            });
          }
        }
      }

      // 2. Weekly highlights received
      const { data: highlights } = await sb
        .from("weekly_highlights")
        .select("week_start, note, created_at")
        .eq("student_id", studentCrmId)
        .order("week_start", { ascending: true });

      for (const h of highlights ?? []) {
        all.push({
          id: `highlight-${h.week_start}`,
          type: "weekly_highlight",
          date: h.created_at as string,
          title: "⭐ Destaque da Semana",
          subtitle: (h.note as string) || "Coach reconheceu sua dedicação.",
          emoji: "⭐",
        });
      }

      // 3. First lesson rating
      const { data: ratings } = await sb
        .from("lesson_ratings")
        .select("lesson_title, created_at, avg_score")
        .eq("student_id", studentCrmId)
        .order("created_at", { ascending: true })
        .limit(3);

      if (ratings?.length) {
        all.push({
          id: `first-rating-${ratings[0].created_at}`,
          type: "first_rating",
          date: ratings[0].created_at as string,
          title: "Primeira avaliação de treino",
          subtitle: `${ratings[0].lesson_title} · Nota ${parseFloat(ratings[0].avg_score as string).toFixed(1)}/5`,
          emoji: "💬",
        });
      }

      // Sort all events chronologically
      all.sort((a, b) => a.date.localeCompare(b.date));

      setEvents(all);
    } catch (e) {
      setError(String(e).replace("Error: ", ""));
    } finally {
      setLoading(false);
    }
  }, [studentCrmId]);

  useEffect(() => { load(); }, [load]);

  const firstName = studentName.split(" ")[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-end justify-center"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg rounded-t-3xl border-t border-x border-zinc-800 bg-[#0a0a0a] pb-safe"
          style={{ maxHeight: "90dvh", display: "flex", flexDirection: "column" }}
        >
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="h-1 w-10 rounded-full bg-zinc-700" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/10">
                <Heart size={17} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Linha do Tempo</h2>
                <p className="text-[10px] text-zinc-500">A jornada de {firstName} no Will Treinos</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loading && (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 size={28} className="animate-spin text-amber-400" />
                <p className="text-xs text-zinc-500">Montando a jornada…</p>
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm font-bold text-zinc-400">{error}</p>
                <button onClick={load} className="text-xs text-amber-400 font-bold underline">Tentar novamente</button>
              </div>
            )}

            {!loading && !error && events.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="text-4xl">🏐</span>
                <p className="text-sm font-bold text-zinc-400">A jornada de {firstName} está começando.</p>
                <p className="text-xs text-zinc-600">Os marcos aparecerão aqui conforme ele evolui.</p>
              </div>
            )}

            {!loading && !error && events.length > 0 && (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-2 bottom-2 w-px bg-zinc-800" />

                <div className="space-y-4">
                  {events.map((ev, idx) => {
                    const meta   = TYPE_META[ev.type];
                    const Icon   = meta.icon;
                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-start gap-3 pl-1"
                      >
                        {/* Icon dot */}
                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl border ${meta.border} ${meta.bg} flex items-center justify-center z-10`}>
                          <Icon size={15} className={meta.color} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-xs font-black text-white leading-tight">{ev.title}</p>
                          {ev.subtitle && (
                            <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">{ev.subtitle}</p>
                          )}
                          <p className="text-[10px] text-zinc-700 mt-1">{fmtDate(ev.date)}</p>
                        </div>

                        {ev.xp && (
                          <div className="flex-shrink-0 text-right pt-0.5">
                            <span className="text-[10px] font-black text-amber-400">{ev.xp >= 1000 ? `${(ev.xp / 1000).toFixed(1)}k` : ev.xp} XP</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Future dot */}
                  <div className="flex items-center gap-3 pl-1 opacity-30">
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl border border-zinc-700 bg-zinc-900 flex items-center justify-center">
                      <CheckCircle2 size={15} className="text-zinc-600" />
                    </div>
                    <p className="text-xs text-zinc-600 font-bold italic">A próxima conquista está por vir…</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
