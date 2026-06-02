import { useEffect, useState, useCallback, useRef } from "react";
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

function calcTier(xp: number): LeaderboardEntry["tier"] {
  if (xp >= 6000) return "elite";
  if (xp >= 3000) return "diamante";
  if (xp >= 1500) return "ouro";
  if (xp >= 500) return "prata";
  return "bronze";
}

export function useLeaderboard(timeframe: Timeframe = "all"): LeaderboardData {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userXP, setUserXP] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Perf: useRef para estabilizar a referência do client
  const supabaseRef = useRef(getSupabaseClient());
  const supabase = supabaseRef.current;

  const fetchLeaderboard = useCallback(async () => {
    if (!user?.id || !supabase) return;

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      let dateFilter: string | null = null;

      if (timeframe === "week") {
        const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = d.toISOString();
      } else if (timeframe === "month") {
        const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = d.toISOString();
      }

      // xp_log usa 'points' (não 'total_xp') e 'student_id'
      let xpQuery = supabase
        .from("xp_log")
        .select("student_id, points")
        .limit(2000);

      if (dateFilter) {
        xpQuery = xpQuery.gte("created_at", dateFilter);
      }

      const { data: logsData, error: logsErr } = await xpQuery;
      if (logsErr) throw logsErr;

      // Agregar XP por student_id
      const studentTotals = new Map<string, number>();
      logsData?.forEach((log) => {
        const current = studentTotals.get(log.student_id) || 0;
        studentTotals.set(log.student_id, current + (log.points ?? 0));
      });

      if (studentTotals.size === 0) {
        setEntries([]);
        setUserRank(null);
        setUserXP(0);
        return;
      }

      // Buscar perfis dos alunos — colunas corretas: 'name', 'auth_user_id', 'avatar'
      const studentIds = [...studentTotals.keys()];
      const { data: studentsData, error: studentsErr } = await supabase
        .from("students")
        .select("id, auth_user_id, name, avatar")
        .in("auth_user_id", studentIds);

      if (studentsErr) throw studentsErr;

      // Mapear auth_user_id → student
      const studentMap = new Map(
        (studentsData ?? []).map((s) => [s.auth_user_id, s])
      );

      // Montar ranking
      const ranked: LeaderboardEntry[] = studentIds
        .map((authId) => {
          const student = studentMap.get(authId);
          const xp = studentTotals.get(authId) ?? 0;
          return {
            id: student?.id ?? authId,
            name: student?.name ?? "Atleta",
            avatar: student?.avatar ?? null,
            total_xp: xp,
            rank: 0,
            tier: calcTier(xp),
          };
        })
        .filter((e) => e.total_xp > 0)
        .sort((a, b) => b.total_xp - a.total_xp)
        .map((e, i) => ({ ...e, rank: i + 1 }));

      setEntries(ranked.slice(0, 10));

      // Posição do usuário logado
      const userEntry = ranked.find((e) => e.id === user.id);
      if (userEntry) {
        setUserRank(userEntry.rank);
        setUserXP(userEntry.total_xp);
      } else {
        setUserRank(null);
        setUserXP(0);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar ranking";
      setError(message);
      console.error("[useLeaderboard]", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, timeframe, supabase]);

  useEffect(() => {
    void fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!user?.id || !supabase) return;
    try {
      const channel = supabase
        .channel("leaderboard_updates")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "xp_log" }, () => {
          void fetchLeaderboard();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    } catch (err) {
      console.error("[useLeaderboard] Realtime:", err);
    }
  }, [user?.id, supabase, fetchLeaderboard]);

  return { entries, userRank, userXP, loading, error };
}
