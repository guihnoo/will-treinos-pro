import { useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export type EvaluationScores = {
  fisico: number;
  tecnico: number;
  tatico: number;
  atitude: number;
  evolucao: number;
};

export type EvaluationRecord = {
  id: string;
  studentId: string;
  lessonId?: string;
  lessonTitle?: string;
  scores: EvaluationScores;
  avgScore: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
};

const PILLAR_KEYS: (keyof EvaluationScores)[] = ["fisico", "tecnico", "tatico", "atitude", "evolucao"];

function rowToRecord(row: Record<string, unknown>): EvaluationRecord {
  const scores = (row.scores ?? {}) as Partial<EvaluationScores>;
  const safeScores: EvaluationScores = {
    fisico:   typeof scores.fisico   === "number" ? scores.fisico   : 7,
    tecnico:  typeof scores.tecnico  === "number" ? scores.tecnico  : 7,
    tatico:   typeof scores.tatico   === "number" ? scores.tatico   : 7,
    atitude:  typeof scores.atitude  === "number" ? scores.atitude  : 7,
    evolucao: typeof scores.evolucao === "number" ? scores.evolucao : 7,
  };
  return {
    id:          row.id as string,
    studentId:   row.student_id as string,
    lessonId:    (row.lesson_id as string | undefined) ?? undefined,
    lessonTitle: (row.lesson_title as string | undefined) ?? undefined,
    scores:      safeScores,
    avgScore:    typeof row.avg_score === "number" ? row.avg_score : 7,
    notes:       (row.notes as string | undefined) ?? undefined,
    createdBy:   (row.created_by as string | undefined) ?? undefined,
    createdAt:   row.created_at as string,
  };
}

export function useEvaluations() {
  const saveEvaluation = useCallback(async (params: {
    studentId: string;
    lessonId?: string;
    lessonTitle?: string;
    scores: EvaluationScores;
    notes?: string;
    createdBy?: string;
  }): Promise<string | null> => {
    const sb = getSupabaseClient();
    if (!sb) return null;

    const avg = Math.round(
      (PILLAR_KEYS.reduce((s, k) => s + params.scores[k], 0) / PILLAR_KEYS.length) * 10
    ) / 10;

    const { data, error } = await sb
      .from("evaluations")
      .insert({
        student_id:   params.studentId,
        lesson_id:    params.lessonId ?? null,
        lesson_title: params.lessonTitle ?? null,
        scores:       params.scores,
        avg_score:    avg,
        notes:        params.notes ?? null,
        created_by:   params.createdBy ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.warn("[useEvaluations] save error:", error.message);
      return null;
    }
    return (data as { id: string }).id;
  }, []);

  const getEvaluationHistory = useCallback(async (
    studentId: string,
    limit = 12
  ): Promise<EvaluationRecord[]> => {
    const sb = getSupabaseClient();
    if (!sb) return [];

    const { data, error } = await sb
      .from("evaluations")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(rowToRecord);
  }, []);

  const getEvaluationTrend = useCallback(async (studentId: string) => {
    const history = await getEvaluationHistory(studentId, 6);
    if (history.length < 2) return null;

    const first = history[history.length - 1];
    const last = history[0];
    const avgDelta = last.avgScore - first.avgScore;

    const pillarDeltas: Partial<Record<keyof EvaluationScores, number>> = {};
    for (const k of PILLAR_KEYS) {
      pillarDeltas[k] = last.scores[k] - first.scores[k];
    }

    return {
      evaluations: history.reverse(), // chronological
      avgDelta,
      pillarDeltas,
      improving: avgDelta > 0.3,
      declining: avgDelta < -0.3,
    };
  }, [getEvaluationHistory]);

  return { saveEvaluation, getEvaluationHistory, getEvaluationTrend };
}
