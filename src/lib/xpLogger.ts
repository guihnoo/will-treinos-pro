"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

export type XpEventType = "evaluation" | "checkin" | "feedback" | "feed_like" | "feed_comment" | "training_completed";

export async function logXpEvent(
  supabase: SupabaseClient,
  payload: {
    studentId: string;
    points: number;
    type: XpEventType;
    description?: string;
    relatedId?: string;
  }
): Promise<void> {
  const { error } = await supabase.from("xp_log").insert({
    student_id: payload.studentId,
    points: payload.points,
    type: payload.type,
    description: payload.description || null,
    related_id: payload.relatedId || null,
  });

  if (error) {
    console.error(`Falha ao registrar XP: ${error.message}`);
    // Fire-and-forget: don't throw, just log
  }
}
