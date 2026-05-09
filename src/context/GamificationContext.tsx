"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";
import { v4 as uuid } from "uuid";

export interface XPLog {
  id: string;
  student_id: string;
  source: "lesson_rating" | "check_in" | "check_in_external" | "social_action";
  fundamental: string | null;
  base_xp: number;
  multiplier: number;
  total_xp: number;
  lesson_id: string | null;
  note: string | null;
  created_at: string;
}

export interface Award {
  id: string;
  student_id: string;
  tier: "bronze" | "prata" | "ouro" | "diamante" | "elite";
  xp_threshold: number;
  unlocked_at: string | null;
  created_at: string;
}

export interface XPMultiplier {
  id: string;
  fundamental: string;
  multiplier: number;
  created_at: string;
}

interface GamificationContextType {
  xpLogs: XPLog[];
  awards: Award[];
  multipliers: XPMultiplier[];
  totalXP: number;
  currentTier: Award | null;
  loading: boolean;
  error: string | null;

  // XP calculation formula: XP = 100 × (nota/10)² × 10 × multiplicador
  calculateXP: (nota: number, fundamental?: string) => number;
  logXP: (
    source: XPLog["source"],
    baseXP: number,
    multiplier: number,
    fundamental?: string,
    lessonId?: string,
    note?: string
  ) => Promise<XPLog | null>;
  refreshXPData: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(
  undefined
);

export function GamificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [xpLogs, setXpLogs] = useState<XPLog[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [multipliers, setMultipliers] = useState<XPMultiplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  // Fórmula: XP = 100 × (nota/10)² × 10 × multiplicador
  const calculateXP = useCallback((nota: number, fundamental?: string): number => {
    const mult = multipliers.find((m) => m.fundamental === fundamental)
      ?.multiplier || 1.0;
    const safeNota = Math.max(0, Math.min(10, nota));
    const base = 100 * Math.pow(safeNota / 10, 2) * 10;
    return Math.round(base * mult);
  }, [multipliers]);

  // Total XP do aluno (soma de todos os logs)
  const totalXP = xpLogs.reduce((sum, log) => sum + log.total_xp, 0);

  // Tier atual (maior award desbloqueado)
  const currentTier = awards.find(
    (a) => a.unlocked_at && a.xp_threshold <= totalXP
  );

  const refreshXPData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch multipliers (static, cached)
      const { data: multData, error: multErr } = await supabase
        .from("xp_multipliers")
        .select("*");

      if (multErr) throw multErr;
      setMultipliers(multData || []);

      // Fetch XP logs
      const { data: logData, error: logErr } = await supabase
        .from("xp_log")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (logErr) throw logErr;
      setXpLogs(logData || []);

      // Fetch awards
      const { data: awardData, error: awardErr } = await supabase
        .from("awards")
        .select("*")
        .eq("student_id", user.id);

      if (awardErr) throw awardErr;
      setAwards(awardData || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao carregar dados de gamificação";
      setError(message);
      console.error("[GamificationContext] Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    refreshXPData();
  }, [user?.id, refreshXPData]);

  // Real-time subscription to xp_log changes
  useEffect(() => {
    if (!user?.id) return;

    try {
      const channel = supabase
        .channel(`xp_log_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "xp_log",
            filter: `student_id=eq.${user.id}`,
          },
          () => {
            // Refresh XP data when new entry is logged
            refreshXPData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error("[GamificationContext] Realtime subscription failed:", err);
    }
  }, [user?.id, supabase, refreshXPData]);

  const logXP = useCallback(
    async (
      source: XPLog["source"],
      baseXP: number,
      multiplier: number,
      fundamental?: string,
      lessonId?: string,
      note?: string
    ): Promise<XPLog | null> => {
      if (!user?.id) return null;

      const totalXP = Math.round(baseXP * multiplier);
      const logId = uuid();

      try {
        const { data, error: err } = await supabase
          .from("xp_log")
          .insert({
            id: logId,
            student_id: user.id,
            source,
            fundamental,
            base_xp: baseXP,
            multiplier,
            total_xp: totalXP,
            lesson_id: lessonId || null,
            note: note || null,
          })
          .select()
          .single();

        if (err) throw err;

        setXpLogs((prev) => [data, ...prev]);

        // Check if any award should be unlocked
        const newTotal = totalXP + totalXP;
        const newUnlockedAwards = awards.filter(
          (a) => !a.unlocked_at && a.xp_threshold <= newTotal
        );

        for (const award of newUnlockedAwards) {
          await supabase
            .from("awards")
            .update({ unlocked_at: new Date().toISOString() })
            .eq("id", award.id);
        }

        await refreshXPData();
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao registrar XP";
        setError(message);
        console.error("[GamificationContext] Error logging XP:", err);
        return null;
      }
    },
    [user?.id, supabase, awards, refreshXPData]
  );

  return (
    <GamificationContext.Provider
      value={{
        xpLogs,
        awards,
        multipliers,
        totalXP,
        currentTier,
        loading,
        error,
        calculateXP,
        logXP,
        refreshXPData,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error(
      "useGamification deve ser usado dentro de GamificationProvider"
    );
  }
  return context;
}
