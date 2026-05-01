import type { Notification, User } from "@/context/types";

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

/** Badge / drawer: mesma regra que o estado global de notificações na sessão atual. */
export function unreadNotificationsCount(notifications: Notification[], user: User | null): number {
  if (!user) return notifications.filter((n) => !n.read).length;
  if (user.role === null) return 0;
  if (user.role === "aluno") {
    return notifications.filter((n) => !n.read && studentSeesNotification(n, user.id)).length;
  }
  return notifications.filter((n) => !n.read).length;
}
