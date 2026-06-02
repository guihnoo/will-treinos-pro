import type { SupabaseClient } from "@supabase/supabase-js";

export interface NotificationPrefs {
  student_id: string;
  lesson_reminders: boolean;
  eval_feedback: boolean;
  coach_messages: boolean;
  weekly_challenge: boolean;
  weekly_highlight: boolean;
  fomo_reminder: boolean;
  birthday_wishes: boolean;
  monthly_summary: boolean;
  updated_at?: string;
}

export type NotificationPrefKey = Exclude<keyof NotificationPrefs, "student_id" | "updated_at">;

/** Fetch the notification preferences for a student. Returns null if row doesn't exist yet. */
export async function fetchStudentPrefs(
  supabase: SupabaseClient,
  studentId: string
): Promise<NotificationPrefs | null> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    console.error("[notificationPrefs] fetch error:", error.message);
    return null;
  }

  return (data as NotificationPrefs | null) ?? null;
}

/**
 * Save (upsert) notification preferences for a student.
 * Returns true on success, false on error.
 */
export async function saveStudentPrefs(
  supabase: SupabaseClient,
  prefs: Omit<NotificationPrefs, "updated_at">
): Promise<boolean> {
  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ ...prefs, updated_at: new Date().toISOString() }, { onConflict: "student_id" });

  if (error) {
    console.error("[notificationPrefs] upsert error:", error.message);
    return false;
  }
  return true;
}

/**
 * Determines whether a notification should be sent for a given type.
 * If prefs is null (no row yet), defaults to true (send the notification).
 */
export function shouldSendNotification(
  prefs: NotificationPrefs | null,
  type: NotificationPrefKey
): boolean {
  if (prefs === null) return true;
  return prefs[type] ?? true;
}

/** Default preferences for a brand-new student (all enabled). */
export function defaultPrefs(studentId: string): NotificationPrefs {
  return {
    student_id: studentId,
    lesson_reminders: true,
    eval_feedback: true,
    coach_messages: true,
    weekly_challenge: true,
    weekly_highlight: true,
    fomo_reminder: true,
    birthday_wishes: true,
    monthly_summary: true,
  };
}
