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

export interface TrainingExercise {
  id: string;
  training_session_id: string;
  name: string;
  target_sets: number;
  target_reps: number;
  target_weight_kg: number | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingSession {
  id: string;
  training_plan_id: string;
  student_id: string;
  session_date: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  notes: string | null;
  exercises?: TrainingExercise[];
  created_at: string;
  updated_at: string;
}

export interface TrainingLog {
  id: string;
  training_exercise_id: string;
  student_id: string;
  completed_at: string;
  sets_completed: number | null;
  reps_completed: number | null;
  weight_kg_actual: number | null;
  effort_rating: number | null;
  notes: string | null;
}

interface TrainingContextType {
  sessions: TrainingSession[];
  logs: TrainingLog[];
  loading: boolean;
  error: string | null;
  createSession: (planId: string, date: string) => Promise<TrainingSession | null>;
  startSession: (sessionId: string) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;
  addExercise: (sessionId: string, exercise: Omit<TrainingExercise, "id" | "training_session_id" | "created_at" | "updated_at">) => Promise<TrainingExercise | null>;
  logExercise: (exerciseId: string, log: Omit<TrainingLog, "id" | "completed_at">) => Promise<TrainingLog | null>;
  refreshSessions: () => Promise<void>;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const refreshSessions = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("student_id", user.id)
        .order("session_date", { ascending: false });

      if (err) throw err;

      setSessions(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar sessões de treino";
      setError(message);
      console.error("[TrainingContext] Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    refreshSessions();
  }, [user?.id, refreshSessions]);

  const createSession = useCallback(
    async (planId: string, date: string): Promise<TrainingSession | null> => {
      if (!user?.id) return null;

      const sessionId = uuid();

      try {
        const { data, error: err } = await supabase
          .from("training_sessions")
          .insert({
            id: sessionId,
            training_plan_id: planId,
            student_id: user.id,
            session_date: date,
            status: "pending",
          })
          .select()
          .single();

        if (err) throw err;

        setSessions((prev) => [data, ...prev]);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao criar sessão";
        setError(message);
        console.error("[TrainingContext] Error creating session:", err);
        return null;
      }
    },
    [user?.id, supabase]
  );

  const startSession = useCallback(
    async (sessionId: string) => {
      try {
        const { error: err } = await supabase
          .from("training_sessions")
          .update({ status: "in_progress" })
          .eq("id", sessionId);

        if (err) throw err;

        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId ? { ...s, status: "in_progress" as const } : s
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao iniciar sessão";
        setError(message);
        console.error("[TrainingContext] Error starting session:", err);
      }
    },
    [supabase]
  );

  const completeSession = useCallback(
    async (sessionId: string) => {
      try {
        const { error: err } = await supabase
          .from("training_sessions")
          .update({ status: "completed" })
          .eq("id", sessionId);

        if (err) throw err;

        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId ? { ...s, status: "completed" as const } : s
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao completar sessão";
        setError(message);
        console.error("[TrainingContext] Error completing session:", err);
      }
    },
    [supabase]
  );

  const addExercise = useCallback(
    async (
      sessionId: string,
      exercise: Omit<
        TrainingExercise,
        "id" | "training_session_id" | "created_at" | "updated_at"
      >
    ): Promise<TrainingExercise | null> => {
      const exerciseId = uuid();

      try {
        const { data, error: err } = await supabase
          .from("training_exercises")
          .insert({
            id: exerciseId,
            training_session_id: sessionId,
            ...exercise,
          })
          .select()
          .single();

        if (err) throw err;

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao adicionar exercício";
        setError(message);
        console.error("[TrainingContext] Error adding exercise:", err);
        return null;
      }
    },
    [supabase]
  );

  const logExercise = useCallback(
    async (
      exerciseId: string,
      log: Omit<TrainingLog, "id" | "completed_at">
    ): Promise<TrainingLog | null> => {
      const logId = uuid();

      try {
        const { data, error: err } = await supabase
          .from("training_logs")
          .insert({
            id: logId,
            training_exercise_id: exerciseId,
            ...log,
          })
          .select()
          .single();

        if (err) throw err;

        setLogs((prev) => [data, ...prev]);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao registrar exercício";
        setError(message);
        console.error("[TrainingContext] Error logging exercise:", err);
        return null;
      }
    },
    [supabase]
  );

  return (
    <TrainingContext.Provider
      value={{
        sessions,
        logs,
        loading,
        error,
        createSession,
        startSession,
        completeSession,
        addExercise,
        logExercise,
        refreshSessions,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const context = useContext(TrainingContext);
  if (!context) {
    throw new Error("useTraining deve ser usado dentro de TrainingProvider");
  }
  return context;
}
