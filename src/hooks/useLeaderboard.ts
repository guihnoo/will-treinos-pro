import { useEffect, useState, useCallback } from "react";
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

const TIER_THRESHOLDS = {
  elite: 6000,
  diamante: 3000,
  ouro: 1500,
  prata: 500,
} as const;

function calcTier(xp: number): LeaderboardEntry["tier"] {
  if (xp >= TIER_THRESHOLDS.elite) return "elite";
  if (xp >= TIER_THRESHOLDS.diamante) return "diamante";
  if (xp >= TIER_THRESHOLDS.ouro) return "ouro";
  if (xp >= TIER_THRESHOLDS.prata) return "prata";
  return "bronze";
}

function mapPeriod(timeframe: Timeframe): string {
  if (timeframe === "week") return "week";
  if (timeframe === "month") return "month";
  return "alltime";
}

export function useLeaderboard(timeframe: Timeframe = "all"): LeaderboardData {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userXP, setUserXP] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const period = mapPeriod(timeframe);
      const res = await fetch(
        `/api/leaderboard?period=${period}&limit=10`,
        { cache: "no-store" },
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as {
        entries?: Array<{
          studentId: string;
          name: string;
          totalXP: number;
          allTimeXP?: number;
          tier?: string;
          rank: number;
        }>;
      };

      const mapped: LeaderboardEntry[] = (data.entries ?? []).map((e) => ({
        id: e.studentId,
        name: e.name || "Atleta",
        avatar: null,
        total_xp: e.totalXP ?? 0,
        rank: e.rank,
        tier: (e.tier as LeaderboardEntry["tier"]) ?? calcTier(e.allTimeXP ?? e.totalXP ?? 0),
      }));

      setEntries(mapped);

      const self = mapped.find((e) => e.id === user.id);
      if (self) {
        setUserRank(self.rank);
        setUserXP(self.total_xp);
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
  }, [user?.id, timeframe]);

  useEffect(() => {
    void fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { entries, userRank, userXP, loading, error };
}
