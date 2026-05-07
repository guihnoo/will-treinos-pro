"use client";

import { useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { logXpEvent } from "@/lib/xpLogger";
import { logTrainingCompletionXP } from "@/lib/xpIntegration";
import type { TrainingPlan, TrainingExercise, WithoutId } from "@/context/types";

export function useTrainingPlanMutations() {
  const createPlan = useCallback(
    async (plan: WithoutId<TrainingPlan>): Promise<TrainingPlan | null> => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from("training_plans")
        .insert({
          coach_id: plan.coachId,
          student_id: plan.studentId,
          title: plan.title,
          description: plan.description,
          start_date: plan.startDate,
          end_date: plan.endDate,
          status: plan.status || "active",
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to create training plan:", error);
        return null;
      }

      return {
        id: data.id,
        coachId: data.coach_id,
        studentId: data.student_id,
        title: data.title,
        description: data.description,
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    [],
  );

  const updatePlan = useCallback(
    async (planId: string, updates: Partial<TrainingPlan>): Promise<boolean> => {
      const supabase = getSupabaseClient();
      if (!supabase) return false;

      const { error } = await supabase
        .from("training_plans")
        .update({
          title: updates.title,
          description: updates.description,
          start_date: updates.startDate,
          end_date: updates.endDate,
          status: updates.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", planId);

      if (error) {
        console.error("Failed to update training plan:", error);
        return false;
      }

      return true;
    },
    [],
  );

  const markPlanComplete = useCallback(
    async (
      planId: string,
      studentId: string,
      planTitle?: string,
      createdBy?: string,
    ): Promise<boolean> => {
      const success = await updatePlan(planId, { status: "completed" });
      if (success) {
        void logTrainingCompletionXP(studentId, planId, planTitle, createdBy);
      }
      return success;
    },
    [updatePlan],
  );

  const deletePlan = useCallback(async (planId: string): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase
      .from("training_plans")
      .delete()
      .eq("id", planId);

    if (error) {
      console.error("Failed to delete training plan:", error);
      return false;
    }

    return true;
  }, []);

  const addExercise = useCallback(
    async (exercise: WithoutId<TrainingExercise>): Promise<TrainingExercise | null> => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from("training_exercises")
        .insert({
          plan_id: exercise.planId,
          week_number: exercise.weekNumber,
          day_name: exercise.dayName,
          exercise_name: exercise.exerciseName,
          sets: exercise.sets,
          reps_min: exercise.repsMin,
          reps_max: exercise.repsMax,
          duration_minutes: exercise.durationMinutes,
          intensity: exercise.intensity,
          notes: exercise.notes,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to add exercise:", error);
        return null;
      }

      return {
        id: data.id,
        planId: data.plan_id,
        weekNumber: data.week_number,
        dayName: data.day_name,
        exerciseName: data.exercise_name,
        sets: data.sets,
        repsMin: data.reps_min,
        repsMax: data.reps_max,
        durationMinutes: data.duration_minutes,
        intensity: data.intensity,
        notes: data.notes,
        completedAt: data.completed_at,
        completedReps: data.completed_reps,
        completedWeight: data.completed_weight,
      };
    },
    [],
  );

  const markExerciseComplete = useCallback(
    async (
      exerciseId: string,
      completedReps?: number,
      completedWeight?: number,
    ): Promise<boolean> => {
      const supabase = getSupabaseClient();
      if (!supabase) return false;

      const { error } = await supabase
        .from("training_exercises")
        .update({
          completed_at: new Date().toISOString(),
          completed_reps: completedReps,
          completed_weight: completedWeight,
        })
        .eq("id", exerciseId);

      if (error) {
        console.error("Failed to mark exercise complete:", error);
        return false;
      }

      return true;
    },
    [],
  );

  const deleteExercise = useCallback(
    async (exerciseId: string): Promise<boolean> => {
      const supabase = getSupabaseClient();
      if (!supabase) return false;

      const { error } = await supabase
        .from("training_exercises")
        .delete()
        .eq("id", exerciseId);

      if (error) {
        console.error("Failed to delete exercise:", error);
        return false;
      }

      return true;
    },
    [],
  );

  return {
    createPlan,
    updatePlan,
    markPlanComplete,
    deletePlan,
    addExercise,
    markExerciseComplete,
    deleteExercise,
  };
}
