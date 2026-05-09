import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string | null;
  total_xp: number;
  rank: number;
  tier?: "bronze" | "prata" | "ouro" | "diamante" | "elite";
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank: number | null;
  userXP: number;
  loading: boolean;
  error: string | null;
}

type Timeframe = "week" | "month" | "all";

export function useLeaderboard(timeframe: Timeframe = "all"): LeaderboardData {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userXP, setUserXP] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const fetchLeaderboard = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Calculate date range based on timeframe
      const now = new Date();
      let dateFilter = "1970-01-01";

      if (timeframe === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = weekAgo.toISOString();
      } else if (timeframe === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = monthAgo.toISOString();
      }

      // Fetch all XP logs grouped by student
      const { data: logsData, error: logsErr } = await supabase
        .from("xp_log")
        .select("student_id, total_xp")
        .gte("created_at", dateFilter);

      if (logsErr) throw logsErr;

      // Calculate totals per student
      const studentTotals = new Map<string, number>();
      logsData?.forEach((log) => {
        const current = studentTotals.get(log.student_id) || 0;
        studentTotals.set(log.student_id, current + log.total_xp);
      });

      // Fetch student profiles
      const { data: studentsData, error: studentsErr } = await supabase
        .from("students")
        .select("id, auth_id, avatar, full_name");

      if (studentsErr) throw studentsErr;

      // Build leaderboard entries sorted by XP
      const leaderboardEntries = (studentsData || [])
        .map((student) => ({
          id: student.id,
          name: student.full_name || "Aluno",
          avatar: student.avatar || null,
          total_xp: studentTotals.get(student.id) || 0,
          rank: 0, // Will be set after sorting
        }))
        .filter((entry) => entry.total_xp > 0) // Only students with XP
        .sort((a, b) => b.total_xp - a.total_xp)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setEntries(leaderboardEntries);

      // Find user's rank and XP
      const userEntry = leaderboardEntries.find((e) => e.id === user.id);
      if (userEntry) {
        setUserRank(userEntry.rank);
        setUserXP(userEntry.total_xp);
      } else {
        // User has no XP yet
        setUserRank(null);
        setUserXP(0);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar ranking";
      setError(message);
      console.error("[useLeaderboard] Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, timeframe, supabase]);

  // Fetch initial data
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Real-time subscription to xp_log changes
  useEffect(() => {
    if (!user?.id) return;

    try {
      const channel = supabase
        .channel("leaderboard_updates")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "xp_log",
          },
          () => {
            // Refresh leaderboard when any new XP is logged
            fetchLeaderboard();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error("[useLeaderboard] Realtime subscription failed:", err);
    }
  }, [user?.id, supabase, fetchLeaderboard]);

  return {
    entries: entries.slice(0, 10), // Top 10 only
    userRank,
    userXP,
    loading,
    error,
  };
}
