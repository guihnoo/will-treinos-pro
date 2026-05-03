import { getSupabaseClient } from "@/lib/supabaseClient";

export type DevEventType =
  | "student_created"
  | "student_approved"
  | "student_suspended"
  | "lesson_created"
  | "lesson_updated"
  | "lesson_deleted"
  | "check_in_requested"
  | "check_in_approved"
  | "check_in_rejected"
  | "payment_created"
  | "payment_marked"
  | "notification_sent"
  | "feed_post_created"
  | "app_started";

export async function logDevEvent(
  eventType: DevEventType,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>,
  createdBy?: string,
): Promise<void> {
  if (typeof window === "undefined") return;
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.rpc("log_dev_event", {
      p_event_type: eventType,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_details: details ? JSON.stringify(details) : null,
      p_created_by: createdBy,
    });
  } catch (e) {
    console.error(`[DevEvents] Failed to log ${eventType}:`, e);
  }
}
