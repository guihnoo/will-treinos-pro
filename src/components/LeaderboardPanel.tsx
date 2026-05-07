"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Medal, TrendingUp } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { CARD_TIER_THRESHOLDS } from "@/context/types";
import type { Student } from "@/context/types";

interface LeaderboardEntry {
  studentId: string;
  name: string;
  email: string;
  totalXP: number;
  tier: "bronze" | "prata" | "ouro" | "diamante" | "elite";
  rank: number;
  weeklyXP: number;
}

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

export function LeaderboardPanel({ isOpen, onClose, timeframe = "all" }: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);

  useEffect(() => {
    if (!isOpen) return;

    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        // Calculate date cutoff based on timeframe
        const now = new Date();
        let dateFilter = null;

        if (selectedTimeframe === "week") {
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (selectedTimeframe === "month") {
          dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Query all-time totals
        const { data: allTimeData, error: allTimeError } = await supabase
          .from("xp_log")
          .select("student_id, points")
          .eq("validation_passed", true);

        if (allTimeError) {
          console.error("Failed to load leaderboard:", allTimeError);
          return;
        }

        // Query filtered by timeframe
        let weeklyQuery = supabase.from("xp_log").select("student_id, points").eq("validation_passed", true);

        if (dateFilter) {
          weeklyQuery = weeklyQuery.gte("created_at", dateFilter.toISOString());
        }

        const { data: timeframeData } = await weeklyQuery;

        // Get students list
        const { data: studentsData } = await supabase.from("students").select("auth_user_id, name, email");

        // Aggregate XP by student
        const allTimeMap = new Map<string, number>();
        const timeframeMap = new Map<string, number>();

        allTimeData?.forEach((row) => {
          const current = allTimeMap.get(row.student_id) || 0;
          allTimeMap.set(row.student_id, current + (row.points || 0));
        });

        timeframeData?.forEach((row) => {
          const current = timeframeMap.get(row.student_id) || 0;
          timeframeMap.set(row.student_id, current + (row.points || 0));
        });

        // Build leaderboard entries
        const leaderboardEntries: LeaderboardEntry[] = (studentsData || [])
          .filter((s) => {
            const xp = selectedTimeframe === "all" ? allTimeMap.get(s.auth_user_id) : timeframeMap.get(s.auth_user_id);
            return xp && xp > 0;
          })
          .map((student) => {
            const totalXP = selectedTimeframe === "all" ? allTimeMap.get(student.auth_user_id) || 0 : timeframeMap.get(student.auth_user_id) || 0;
            return {
              studentId: student.auth_user_id,
              name: student.name || "Sem nome",
              email: student.email || "",
              totalXP,
              weeklyXP: timeframeMap.get(student.auth_user_id) || 0,
              tier: calculateTier(allTimeMap.get(student.auth_user_id) || 0),
              rank: 0, // Will be set after sorting
            };
          })
          .sort((a, b) => {
            const xpA = selectedTimeframe === "all" ? a.totalXP : a.weeklyXP;
            const xpB = selectedTimeframe === "all" ? b.totalXP : b.weeklyXP;
            return xpB - xpA;
          })
          .map((entry, idx) => ({
            ...entry,
            rank: idx + 1,
          }));

        setEntries(leaderboardEntries);
      } catch (error) {
        console.error("Leaderboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [isOpen, selectedTimeframe]);

  return (
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

            {/* Timeframe selector */}
            <div className="px-6 pt-4 pb-2 flex gap-2">
              {(["all", "month", "week"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTimeframe === tf
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-400/50"
                      : "bg-slate-700/30 text-slate-300 border border-slate-600/30 hover:bg-slate-700/50"
                  }`}
                >
                  {tf === "all" ? "Histórico" : tf === "month" ? "Este mês" : "Esta semana"}
                </button>
              ))}
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
                <div className="space-y-3">
                  {entries.map((entry, idx) => (
                    <motion.div
                      key={entry.studentId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
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
                          {selectedTimeframe === "all" ? entry.totalXP : entry.weeklyXP}
                        </div>
                        <p className="text-xs text-slate-400">XP</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/50 text-xs text-slate-400">
              <p>Mostrando {entries.length} atletas • Filtrando apenas XP validado</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
