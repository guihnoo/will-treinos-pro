import { useCallback } from "react";
import type { XPLog, CardTier, XPLogType, VolleyballFundamental, WithoutId } from "@/context/types";
import { CARD_TIER_THRESHOLDS } from "@/context/types";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  validateXPTransaction,
  getValidationNotes,
} from "@/lib/xpAntiCheat";

export function useXPMutations() {
  // Log XP transaction with anti-cheat validation
  const logXP = useCallback(
    async (xpLog: WithoutId<XPLog>): Promise<XPLog | null> => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;

      // Run anti-cheat validation
      const validation = await validateXPTransaction(
        xpLog.studentId,
        xpLog.points,
        xpLog.type,
        xpLog.relatedId
      );

      // Get detailed validation notes (for outlier detection)
      const validationNotes =
        xpLog.validationNotes ||
        (await getValidationNotes(
          xpLog.studentId,
          xpLog.points,
          xpLog.type,
          xpLog.relatedId
        ));

      const { data, error } = await supabase
        .from("xp_log")
        .insert({
          student_id: xpLog.studentId,
          points: xpLog.points,
          base_points: xpLog.basePoints,
          multiplier_type: xpLog.multiplierType || "none",
          multiplier_value: xpLog.multiplierValue || 1.0,
          type: xpLog.type,
          source_entity: xpLog.sourceEntity,
          related_id: xpLog.relatedId,
          description: xpLog.description,
          validation_passed: validation.isValid,
          validation_notes: validation.isValid ? validationNotes : validation.validationNotes,
          created_by: xpLog.createdBy,
        })
        .select()
        .single();

      if (error) {
        console.error("[useXPMutations] logXP error:", error);
        return null;
      }

      // Log if validation failed (for admin audit)
      if (!validation.isValid) {
        console.warn(
          `[useXPMutations] XP transaction blocked: ${validation.validationNotes}`,
          { studentId: xpLog.studentId, points: xpLog.points }
        );
      }

      return {
        id: data.id,
        studentId: data.student_id,
        points: data.points,
        basePoints: data.base_points,
        multiplierType: data.multiplier_type,
        multiplierValue: data.multiplier_value,
        type: data.type,
        sourceEntity: data.source_entity,
        relatedId: data.related_id,
        description: data.description,
        validationPassed: data.validation_passed,
        validationNotes: data.validation_notes,
        createdAt: data.created_at,
        createdBy: data.created_by,
      };
    },
    []
  );

  // Get student's total XP
  const getStudentTotalXP = useCallback(
    async (studentId: string): Promise<number | null> => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from("xp_log")
        .select("points")
        .eq("student_id", studentId)
        .eq("validation_passed", true);

      if (error) {
        console.error("[useXPMutations] getStudentTotalXP error:", error);
        return null;
      }

      return data?.reduce((sum, row) => sum + (row.points || 0), 0) || 0;
    },
    []
  );

  // Get XP history (paginated)
  const getXPHistory = useCallback(
    async (
      studentId: string,
      limit: number = 20,
      offset: number = 0
    ): Promise<XPLog[] | null> => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from("xp_log")
        .select()
        .eq("student_id", studentId)
        .eq("validation_passed", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("[useXPMutations] getXPHistory error:", error);
        return null;
      }

      return data?.map((row) => ({
        id: row.id,
        studentId: row.student_id,
        points: row.points,
        basePoints: row.base_points,
        multiplierType: row.multiplier_type,
        multiplierValue: row.multiplier_value,
        type: row.type,
        sourceEntity: row.source_entity,
        relatedId: row.related_id,
        description: row.description,
        validationPassed: row.validation_passed,
        validationNotes: row.validation_notes,
        createdAt: row.created_at,
        createdBy: row.created_by,
      })) || [];
    },
    []
  );

  // Check if student should unlock a card tier
  const checkAchievementUnlock = useCallback(
    async (studentId: string, currentTotalXP: number): Promise<CardTier | null> => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;

      // Find highest tier the student has earned
      let nextTier: CardTier | null = null;
      for (const tier of ["elite", "diamante", "ouro", "prata", "bronze"] as CardTier[]) {
        if (currentTotalXP >= CARD_TIER_THRESHOLDS[tier]) {
          // Check if already unlocked
          const { data: existing } = await supabase
            .from("student_achievements")
            .select("id")
            .eq("student_id", studentId)
            .eq("tier_id", tier)
            .single();

          if (!existing) {
            nextTier = tier;
            break; // Found the next tier to unlock
          }
        }
      }

      if (!nextTier) return null;

      // Insert achievement
      const { error } = await supabase
        .from("student_achievements")
        .insert({
          student_id: studentId,
          tier_id: nextTier,
          xp_threshold: CARD_TIER_THRESHOLDS[nextTier],
        });

      if (error) {
        console.error("[useXPMutations] checkAchievementUnlock error:", error);
        return null;
      }

      return nextTier;
    },
    []
  );

  // Get student's achievements
  const getStudentAchievements = useCallback(
    async (studentId: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from("student_achievements")
        .select()
        .eq("student_id", studentId)
        .order("xp_threshold", { ascending: false });

      if (error) {
        console.error("[useXPMutations] getStudentAchievements error:", error);
        return null;
      }

      return data || [];
    },
    []
  );

  return {
    logXP,
    getStudentTotalXP,
    getXPHistory,
    checkAchievementUnlock,
    getStudentAchievements,
  };
}
