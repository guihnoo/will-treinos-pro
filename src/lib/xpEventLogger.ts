import type { XPLog } from "@/context/types";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface XPEventPayload {
  studentId: string;
  type: XPLog["type"];
  sourceEntity?: "lesson" | "training_plan" | "post" | "achievement";
  relatedId?: string;
  description?: string;
  createdBy?: string;
}

/**
 * Fixed XP values for common events
 * (non-evaluation events don't use formula, just fixed amounts)
 */
const FIXED_XP_VALUES: Record<XPLog["type"], number> = {
  evaluation: 0, // Handled by formula, should not use this
  checkin: 50, // 50 XP for successful check-in
  social_like: 5, // 5 XP per post like
  social_comment: 15, // 15 XP per comment
  training_completed: 100, // 100 XP for completing training plan
  achievement_unlock: 0, // No XP for unlock, it's a reward
};

/**
 * Log XP event (check-in, social, training, etc)
 * Returns the XPLog ID or null on error
 */
export async function logXPEvent(
  payload: XPEventPayload
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn("[logXPEvent] Supabase not available, skipping XP log");
    return null;
  }

  const basePoints = FIXED_XP_VALUES[payload.type];
  if (basePoints === undefined) {
    console.error(`[logXPEvent] Unknown XP type: ${payload.type}`);
    return null;
  }

  const { data, error } = await supabase
    .from("xp_log")
    .insert({
      student_id: payload.studentId,
      points: basePoints,
      base_points: basePoints,
      multiplier_type: "none",
      multiplier_value: 1.0,
      type: payload.type,
      source_entity: payload.sourceEntity,
      related_id: payload.relatedId,
      description: payload.description,
      validation_passed: true,
      created_by: payload.createdBy,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[logXPEvent] Failed to log XP:", error);
    return null;
  }

  return data?.id || null;
}

/**
 * Batch log multiple XP events (e.g., all students earn check-in XP)
 */
export async function batchLogXPEvents(
  events: XPEventPayload[]
): Promise<string[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const rows = events.map((event) => ({
    student_id: event.studentId,
    points: FIXED_XP_VALUES[event.type],
    base_points: FIXED_XP_VALUES[event.type],
    multiplier_type: "none",
    multiplier_value: 1.0,
    type: event.type,
    source_entity: event.sourceEntity,
    related_id: event.relatedId,
    description: event.description,
    validation_passed: true,
    created_by: event.createdBy,
  }));

  const { data, error } = await supabase
    .from("xp_log")
    .insert(rows)
    .select("id");

  if (error) {
    console.error("[batchLogXPEvents] Batch insert failed:", error);
    return [];
  }

  return data?.map((row) => row.id) || [];
}

/**
 * Get XP amount for a given event type
 */
export function getXPForEventType(type: XPLog["type"]): number {
  return FIXED_XP_VALUES[type] ?? 0;
}
