"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Star, Zap, Users } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedEvent = {
  id: string;
  type: "tier_unlock" | "weekly_highlight" | "xp_milestone";
  studentName: string;
  studentId: string;
  title: string;
  description: string;
  xpAmount?: number;
  tier?: string;
  createdAt: string;
  isCurrentStudent: boolean;
};

interface Props {
  studentId: string;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]![0]}.`;
}

function relativeTime(isoStr: string): string {
  const now = Date.now();
  const then = new Date(isoStr).getTime();
  const diff = now - then;
  const min = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (min < 2) return "agora";
  if (min < 60) return `há ${min} min`;
  if (hrs < 24) return `há ${hrs}h`;
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return "esta semana";
}

const typeConfig = {
  tier_unlock: {
    Icon: Trophy,
    color: "#EAB308",
    bg: "bg-amber-500/15 border-amber-500/30",
    iconCls: "text-amber-400",
  },
  weekly_highlight: {
    Icon: Star,
    color: "#FACC15",
    bg: "bg-yellow-500/12 border-yellow-500/25",
    iconCls: "text-yellow-400",
  },
  xp_milestone: {
    Icon: Zap,
    color: "#A78BFA",
    bg: "bg-violet-500/12 border-violet-500/25",
    iconCls: "text-violet-400",
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AchievementFeedPanel({ studentId, onClose }: Props) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const sb = getSupabaseClient();

      const combined: FeedEvent[] = [];

      if (sb) {
        // 1. student_achievements — tier unlocks
        try {
          const { data: achievements } = await sb
            .from("student_achievements")
            .select("id, student_id, achievement_type, title, description, xp_reward, tier, created_at, students(name)")
            .order("created_at", { ascending: false })
            .limit(20);

          if (achievements) {
            for (const row of achievements) {
              const nameRaw =
                (row.students as unknown as { name?: string } | null)?.name ?? "Atleta";
              combined.push({
                id: `ach-${row.id}`,
                type: "tier_unlock",
                studentId: row.student_id as string,
                studentName: formatInitials(nameRaw),
                title: String(row.title ?? "Conquista desbloqueada"),
                description: String(row.description ?? ""),
                xpAmount: row.xp_reward as number | undefined,
                tier: row.tier as string | undefined,
                createdAt: row.created_at as string,
                isCurrentStudent: row.student_id === studentId,
              });
            }
          }
        } catch {
          // table may not exist yet — silently skip
        }

        // 2. weekly_highlights
        try {
          const { data: highlights } = await sb
            .from("weekly_highlights")
            .select("id, student_id, week_start, highlight_text, created_at, students(name)")
            .order("created_at", { ascending: false })
            .limit(4);

          if (highlights) {
            for (const row of highlights) {
              const nameRaw =
                (row.students as unknown as { name?: string } | null)?.name ?? "Atleta";
              combined.push({
                id: `wh-${row.id}`,
                type: "weekly_highlight",
                studentId: row.student_id as string,
                studentName: formatInitials(nameRaw),
                title: "Destaque da Semana",
                description: String(row.highlight_text ?? "Desempenho excepcional nesta semana!"),
                createdAt: row.created_at as string,
                isCurrentStudent: row.student_id === studentId,
              });
            }
          }
        } catch {
          // table may not exist yet — silently skip
        }

        // 3. xp_log — achievement_unlock type
        try {
          const { data: xpRows } = await sb
            .from("xp_log")
            .select("id, student_id, type, description, xp, created_at, students(name)")
            .eq("type", "achievement_unlock")
            .order("created_at", { ascending: false })
            .limit(15);

          if (xpRows) {
            for (const row of xpRows) {
              const nameRaw =
                (row.students as unknown as { name?: string } | null)?.name ?? "Atleta";
              const xp = row.xp as number | null;
              combined.push({
                id: `xp-${row.id}`,
                type: "xp_milestone",
                studentId: row.student_id as string,
                studentName: formatInitials(nameRaw),
                title: xp ? `${xp} XP conquistados` : "Marco de XP",
                description: String(row.description ?? ""),
                xpAmount: xp ?? undefined,
                createdAt: row.created_at as string,
                isCurrentStudent: row.student_id === studentId,
              });
            }
          }
        } catch {
          // silently skip
        }
      }

      // Sort combined by createdAt DESC
      combined.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      if (!cancelled) {
        setEvents(combined);
        setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [studentId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 380, damping: 28 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] bg-black/85 backdrop-blur-sm flex flex-col justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl mx-auto bg-[#0a0a0a] border-t border-zinc-800 rounded-t-3xl max-h-[88dvh] flex flex-col shadow-[0_-24px_80px_rgba(0,0,0,0.55)]"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-0 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
              <Users size={17} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Conquistas da Turma</h2>
              {events.length > 0 && (
                <p className="text-[10px] text-zinc-500">{events.length} evento{events.length !== 1 ? "s" : ""} recentes</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="achievement-feed-close"
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-zinc-900/60 border border-zinc-800/50" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Trophy size={44} className="text-zinc-700 mb-3" />
              <p className="text-sm font-bold text-zinc-400">Seja o primeiro a conquistar algo esta semana!</p>
              <p className="text-xs text-zinc-600 mt-1 max-w-xs">Faça check-in, receba avaliações e suba de tier para aparecer aqui.</p>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2.5">
              {events.map(event => {
                const cfg = typeConfig[event.type];
                const Icon = cfg.Icon;
                const initials = event.studentName
                  .split(" ")
                  .map(p => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <motion.div
                    key={event.id}
                    variants={itemVariants}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
                      event.isCurrentStudent
                        ? "border-amber-500/35 bg-amber-500/6 ring-1 ring-amber-500/20"
                        : "border-zinc-800/60 bg-zinc-900/30"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-black ${
                        event.isCurrentStudent
                          ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                          : "bg-zinc-800 border border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {initials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-black ${event.isCurrentStudent ? "text-amber-300" : "text-white"}`}>
                          {event.studentName}
                        </span>
                        <span className="text-[10px] text-zinc-500">{relativeTime(event.createdAt)}</span>
                        {event.isCurrentStudent && (
                          <span className="text-[9px] font-black text-amber-400 bg-amber-500/12 border border-amber-500/20 rounded-full px-1.5 py-0.5">
                            Você
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] font-bold mt-0.5 ${event.isCurrentStudent ? "text-amber-100" : "text-zinc-200"}`}>
                        {event.title}
                      </p>
                      {event.description ? (
                        <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">{event.description}</p>
                      ) : null}
                    </div>

                    {/* Type Icon */}
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border ${cfg.bg}`}>
                      <Icon size={14} className={cfg.iconCls} />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
