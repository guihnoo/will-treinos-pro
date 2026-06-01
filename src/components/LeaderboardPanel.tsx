"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Medal, TrendingUp, Crown } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { CARD_TIER_THRESHOLDS } from "@/context/types";
import type { Student } from "@/context/types";
import dynamic from "next/dynamic";

const HallOfFamePanel = dynamic(() => import("@/components/will/HallOfFamePanel"), { ssr: false, loading: () => null });

interface LeaderboardEntry {
  studentId: string;
  name: string;
  email: string;
  totalXP: number;
  tier: "bronze" | "prata" | "ouro" | "diamante" | "elite";
  rank: number;
  weeklyXP: number;
}

type Period = "week" | "month" | "quarter" | "alltime";

interface LeaderboardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  timeframe?: "all" | "month" | "week";
}

const getTierColor = (tier: string) => {
  const colors: Record<string, string> = {
    bronze: "from-amber-600 to-amber-700",
    prata: "from-gray-400 to-gray-500",
    ouro: "from-yellow-400 to-yellow-500",
    diamante: "from-cyan-400 to-blue-500",
    elite: "from-purple-500 to-pink-500",
  };
  return colors[tier] || colors.bronze;
};

const getTierBadge = (tier: string) => {
  const badges: Record<string, string> = {
    bronze: "🥉",
    prata: "🥈",
    ouro: "🥇",
    diamante: "💎",
    elite: "👑",
  };
  return badges[tier] || "⭐";
};

const calculateTier = (totalXP: number): "bronze" | "prata" | "ouro" | "diamante" | "elite" => {
  if (totalXP >= CARD_TIER_THRESHOLDS.elite) return "elite";
  if (totalXP >= CARD_TIER_THRESHOLDS.diamante) return "diamante";
  if (totalXP >= CARD_TIER_THRESHOLDS.ouro) return "ouro";
  if (totalXP >= CARD_TIER_THRESHOLDS.prata) return "prata";
  return "bronze";
};

const PERIOD_LABELS: Record<Period, string> = {
  week: "Semana",
  month: "Mes",
  quarter: "Trimestre",
  alltime: "Historico",
};

export function LeaderboardPanel({ isOpen, onClose, timeframe = "all" }: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>(timeframe === "week" ? "week" : timeframe === "month" ? "month" : "alltime");
  const [showHallOfFame, setShowHallOfFame] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?period=${period}&limit=50`);
        if (!res.ok) throw new Error("leaderboard fetch failed");
        const data = (await res.json()) as {
          entries: Array<{
            studentId: string;
            name: string;
            email: string;
            totalXP: number;
            allTimeXP: number;
            tier: string;
            rank: number;
            weeklyXP: number;
          }>;
        };

        const leaderboardEntries: LeaderboardEntry[] = (data.entries ?? []).map((e) => ({
          studentId: e.studentId,
          name: e.name || "Sem nome",
          email: e.email || "",
          totalXP: e.totalXP,
          weeklyXP: e.weeklyXP,
          tier: calculateTier(e.allTimeXP ?? e.totalXP),
          rank: e.rank,
        }));

        setEntries(leaderboardEntries);
      } catch (error) {
        console.error("Leaderboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [isOpen, period]);

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <Medal className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-bold text-white">Ranking 🏆</h2>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Period filters */}
            <div className="px-6 pt-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
              <AnimatePresence initial={false}>
                {(["week", "month", "quarter", "alltime"] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    data-testid={`leaderboard-period-${p}`}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      period === p
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-400/50"
                        : "bg-slate-700/30 text-slate-300 border border-slate-600/30 hover:bg-slate-700/50"
                    }`}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </AnimatePresence>
            </div>

            {/* Leaderboard */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-slate-400">Carregando ranking...</div>
                </div>
              ) : entries.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-slate-400">Nenhum atleta com XP ainda</div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                <motion.div
                  key={period}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-3"
                >
                  {entries.map((entry, idx) => (
                    <motion.div
                      key={entry.studentId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        entry.rank <= 3
                          ? "bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/30 shadow-lg shadow-yellow-500/10"
                          : "bg-slate-700/20 border-slate-600/30 hover:border-slate-500/30"
                      }`}
                    >
                      {/* Rank */}
                      <div className="text-center w-12 flex-shrink-0">
                        {entry.rank <= 3 ? (
                          <div className="text-2xl font-bold">
                            {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                          </div>
                        ) : (
                          <div className="text-lg font-bold text-slate-400">#{entry.rank}</div>
                        )}
                      </div>

                      {/* Student info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white truncate">{entry.name}</p>
                          <span className="text-lg">{getTierBadge(entry.tier)}</span>
                        </div>
                        <p className="text-sm text-slate-400">{entry.email}</p>
                      </div>

                      {/* XP display */}
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
                          <TrendingUp className="w-4 h-4" />
                          {entry.totalXP}
                        </div>
                        <p className="text-xs text-slate-400">XP</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/50 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {entries.length} atleta{entries.length !== 1 ? "s" : ""} • XP validado
              </p>
              <button
                onClick={() => setShowHallOfFame(true)}
                data-testid="hall-of-fame-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors"
              >
                <Crown className="w-3.5 h-3.5" />
                Hall of Fame
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Hall of Fame panel */}
    <AnimatePresence>
      {showHallOfFame && (
        <HallOfFamePanel onClose={() => setShowHallOfFame(false)} />
      )}
    </AnimatePresence>
    </>
  );
}
