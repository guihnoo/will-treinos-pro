import type { Notification } from "@/context/types";

/**
 * Student-facing visibility: same CRM id as payments (`user.id` after auth link).
 * Staff-only rows must omit `recipientId` and set `isGlobal` false.
 */
export function studentSeesNotification(n: Notification, crmStudentId: string): boolean {
  if (n.isGlobal === true) return true;
  const rid = n.recipientId?.trim();
  if (!rid || !crmStudentId) return false;
  return rid === crmStudentId;
}
