"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";
import { v4 as uuid } from "uuid";
import type { XPFloatEvent } from "@/components/XPFloatNotification";

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
  xpFloatEvents: XPFloatEvent[];

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
  triggerXPFloat: (amount: number, x?: number, y?: number) => void;
  removeXPFloat: (id: string) => void;
}

function dbTypeToSource(type: string): XPLog["source"] {
  switch (type) {
    case "evaluation": return "lesson_rating";
    case "checkin": return "check_in";
    case "social_like":
    case "social_comment":
    case "training_completed":
    case "achievement_unlock": return "social_action";
    default: return "social_action";
  }
}

function sourceToDbType(source: XPLog["source"]): string {
  switch (source) {
    case "lesson_rating": return "evaluation";
    case "check_in": return "checkin";
    case "check_in_external": return "checkin";
    case "social_action": return "social_comment";
    default: return "social_comment";
  }
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
  const [xpFloatEvents, setXpFloatEvents] = useState<XPFloatEvent[]>([]);

  // Perf: useRef estabiliza a referência — evita re-subscribe do Realtime em cascata
  const supabaseRef = useRef(getSupabaseClient());
  const supabase = supabaseRef.current;

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

  // Tier atual (maior award desbloqueado — ordenado decrescente para pegar o mais alto)
  const currentTier = [...awards]
    .filter((a) => a.unlocked_at && a.xp_threshold <= totalXP)
    .sort((a, b) => b.xp_threshold - a.xp_threshold)[0] ?? null;

  const refreshXPData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Perf: 3 queries em paralelo (era sequencial — ~300ms → ~100ms)
      const [multRes, logRes, awardRes] = await Promise.all([
        supabase.from("xp_multipliers").select("*"),
        supabase
          .from("xp_log")
          .select("id, student_id, type, points, base_points, multiplier_value, description, related_id, created_at")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("awards").select("*").eq("student_id", user.id),
      ]);

      if (multRes.error) throw multRes.error;
      if (logRes.error) throw logRes.error;
      if (awardRes.error) throw awardRes.error;

      setMultipliers(multRes.data || []);

      const mapped = (logRes.data || []).map((row) => ({
        id: row.id,
        student_id: row.student_id,
        source: dbTypeToSource(row.type),
        fundamental: null,
        base_xp: row.base_points ?? row.points ?? 0,
        multiplier: row.multiplier_value ?? 1.0,
        total_xp: row.points ?? 0,
        lesson_id: row.related_id ?? null,
        note: row.description ?? null,
        created_at: row.created_at,
      }));
      setXpLogs(mapped);
      setAwards(awardRes.data || []);
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

  const triggerXPFloat = useCallback((amount: number, x?: number, y?: number) => {
    const floatId = uuid();
    const newEvent: XPFloatEvent = {
      id: floatId,
      amount,
      timestamp: Date.now(),
      x,
      y,
    };
    setXpFloatEvents((prev) => [...prev, newEvent]);
  }, []);

  const removeXPFloat = useCallback((id: string) => {
    setXpFloatEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

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
            type: sourceToDbType(source),
            base_points: baseXP,
            points: totalXP,
            multiplier_type: fundamental ?? "none",
            multiplier_value: multiplier,
            related_id: lessonId || null,
            description: [fundamental, note].filter(Boolean).join(" — ") || null,
            validation_passed: true,
          })
          .select("id, student_id, type, points, base_points, multiplier_value, description, related_id, created_at")
          .single();

        if (err) throw err;

        const mapped: XPLog = {
          id: data.id,
          student_id: data.student_id,
          source,
          fundamental: fundamental ?? null,
          base_xp: data.base_points ?? baseXP,
          multiplier,
          total_xp: data.points ?? totalXP,
          lesson_id: data.related_id ?? null,
          note: data.description ?? null,
          created_at: data.created_at,
        };
        setXpLogs((prev) => [mapped, ...prev]);

        // Trigger XP float animation
        triggerXPFloat(totalXP);

        // Perf: batch update de awards (era N+1 sequencial → 1 query)
        const newTotal = xpLogs.reduce((s, l) => s + l.total_xp, 0) + totalXP;
        const newUnlockedAwards = awards.filter(
          (a) => !a.unlocked_at && a.xp_threshold <= newTotal
        );

        if (newUnlockedAwards.length > 0) {
          const unlockedAt = new Date().toISOString();
          const ids = newUnlockedAwards.map((a) => a.id);
          await supabase
            .from("awards")
            .update({ unlocked_at: unlockedAt })
            .in("id", ids);
          // Atualizar estado local sem refetch completo
          setAwards((prev) =>
            prev.map((a) => (ids.includes(a.id) ? { ...a, unlocked_at: unlockedAt } : a))
          );
        }

        await refreshXPData();
        return mapped;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao registrar XP";
        setError(message);
        console.error("[GamificationContext] Error logging XP:", err);
        return null;
      }
    },
    [user?.id, supabase, awards, refreshXPData, triggerXPFloat]
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
        xpFloatEvents,
        calculateXP,
        logXP,
        refreshXPData,
        triggerXPFloat,
        removeXPFloat,
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
