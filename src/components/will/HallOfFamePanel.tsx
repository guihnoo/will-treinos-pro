"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { CARD_TIER_THRESHOLDS } from "@/context/types";

interface MonthChampion {
  month: string; // "YYYY-MM"
  label: string; // "Jan 2026"
  studentId: string;
  name: string;
  xp: number;
  tier: string;
}

type TierName = "bronze" | "prata" | "ouro" | "diamante" | "elite";

function calculateTier(xp: number): TierName {
  if (xp >= CARD_TIER_THRESHOLDS.elite) return "elite";
  if (xp >= CARD_TIER_THRESHOLDS.diamante) return "diamante";
  if (xp >= CARD_TIER_THRESHOLDS.ouro) return "ouro";
  if (xp >= CARD_TIER_THRESHOLDS.prata) return "prata";
  return "bronze";
}

const TIER_BADGE: Record<TierName, string> = {
  bronze: "🥉",
  prata: "🥈",
  ouro: "🥇",
  diamante: "💎",
  elite: "👑",
};

const PT_MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function monthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const m = parseInt(month, 10) - 1;
  return `${PT_MONTHS[m] ?? month} ${year}`;
}

function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
  }
  return months;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface HallOfFamePanelProps {
  onClose: () => void;
}

export default function HallOfFamePanel({ onClose }: HallOfFamePanelProps) {
  const [champions, setChampions] = useState<(MonthChampion | null)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const months = getLast6Months();

    const load = async () => {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          setChampions(months.map(() => null));
          return;
        }

        // For each month, find the student with most XP
        const results: (MonthChampion | null)[] = await Promise.all(
          months.map(async (yearMonth) => {
            const startDate = `${yearMonth}-01T00:00:00.000Z`;
            const [year, month] = yearMonth.split("-");
            const nextMonth = parseInt(month, 10) + 1;
            const nextYear = nextMonth > 12 ? parseInt(year, 10) + 1 : parseInt(year, 10);
            const endDate = `${nextYear}-${String(nextMonth > 12 ? 1 : nextMonth).padStart(2, "0")}-01T00:00:00.000Z`;

            const { data: xpData } = await supabase
              .from("xp_log")
              .select("student_id, points")
              .eq("validation_passed", true)
              .gte("created_at", startDate)
              .lt("created_at", endDate);

            if (!xpData || xpData.length === 0) return null;

            // Aggregate
            const xpMap = new Map<string, number>();
            xpData.forEach((row: { student_id: string; points: number }) => {
              xpMap.set(row.student_id, (xpMap.get(row.student_id) ?? 0) + (row.points ?? 0));
            });

            // Find top student
            let topId = "";
            let topXP = 0;
            xpMap.forEach((xp, sid) => {
              if (xp > topXP) { topXP = xp; topId = sid; }
            });

            if (!topId || topXP === 0) return null;

            // Fetch student name
            const { data: student } = await supabase
              .from("students")
              .select("name")
              .eq("auth_user_id", topId)
              .maybeSingle();

            return {
              month: yearMonth,
              label: monthLabel(yearMonth),
              studentId: topId,
              name: student?.name ?? "Atleta",
              xp: topXP,
              tier: calculateTier(topXP),
            } satisfies MonthChampion;
          })
        );

        setChampions(results);
      } catch (err) {
        console.error("[HallOfFamePanel]", err);
        setChampions(months.map(() => null));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const months = getLast6Months();

  return (
    <motion.div
      key="hall-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="hall-of-fame-overlay"
    >
      <motion.div
        key="hall-panel"
        initial={{ opacity: 0, x: 40, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 40, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] rounded-2xl bg-zinc-950 border border-zinc-800/60 shadow-2xl overflow-hidden flex flex-col"
        data-testid="hall-of-fame-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/25">
              <Crown className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">Ultimos 6 meses</p>
              <h2 className="text-base font-black text-white">Hall of Fame</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-800/60 text-zinc-500 hover:text-white transition-colors"
            data-testid="hall-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-0">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-16 h-4 rounded bg-zinc-800/80 flex-shrink-0" />
                  <div className="w-10 h-10 rounded-full bg-zinc-800/80 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 rounded bg-zinc-800/80" />
                    <div className="h-2.5 w-20 rounded bg-zinc-800/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[4.5rem] top-0 bottom-0 w-px bg-zinc-800" />

              <div className="space-y-5">
                {months.map((month, idx) => {
                  const champion = champions[idx] ?? null;
                  return (
                    <motion.div
                      key={month}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.07, type: "spring", stiffness: 300, damping: 25 }}
                      className="flex items-center gap-4"
                    >
                      {/* Month label */}
                      <div className="w-14 flex-shrink-0 text-right">
                        <span className="text-xs font-bold text-zinc-500">{monthLabel(month)}</span>
                      </div>

                      {/* Timeline dot */}
                      <div className={`relative z-10 flex-shrink-0 w-3 h-3 rounded-full border-2 ${champion ? "border-amber-400 bg-amber-400/30" : "border-zinc-700 bg-zinc-900"}`} />

                      {/* Champion card */}
                      {champion ? (
                        <div className="flex items-center gap-3 flex-1 min-w-0 rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-3 py-2.5">
                          {/* Medal */}
                          <span className="text-xl flex-shrink-0">🥇</span>

                          {/* Avatar initials */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                            <span className="text-[11px] font-black text-amber-400">{initials(champion.name)}</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{champion.name}</p>
                            <p className="text-[11px] text-zinc-500">
                              {champion.xp.toLocaleString("pt-BR")} XP
                              <span className="ml-1">{TIER_BADGE[champion.tier as TierName] ?? ""}</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 rounded-xl border border-zinc-800/40 bg-zinc-900/20 px-3 py-2.5">
                          <p className="text-xs text-zinc-600 font-semibold">Sem dados</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
