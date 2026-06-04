import type { Notification, User } from "@/context/types";

/** Tipos de notificação destinados exclusivamente à equipe (admin/coach). */
const STAFF_ONLY_TYPES: Notification["type"][] = ["new_student", "payment_late"];

/** Tipos que o coach pode ver (além de global broadcasts). */
const COACH_TYPES: Notification["type"][] = ["lesson_soon", "performance", "message", "broadcast"];

export function studentSeesNotification(n: Notification, crmStudentId: string): boolean {
  if (n.isGlobal === true) return true;
  const rid = n.recipientId?.trim();
  if (!rid || !crmStudentId) return false;
  return rid === crmStudentId;
}

function coachSeesNotification(n: Notification): boolean {
  if (n.isGlobal === true) return true;
  return COACH_TYPES.includes(n.type);
}

/** Filtra a lista de notificações para o usuário atual. */
export function filterNotificationsForUser(
  notifications: Notification[],
  user: User | null,
  crmStudentId?: string | null,
): Notification[] {
  if (!user || user.role === null) return [];
  switch (user.role) {
    case "admin":
      return notifications;
    case "coach":
      return notifications.filter(coachSeesNotification);
    case "aluno": {
      const sid = crmStudentId?.trim() || user.id;
      return notifications.filter((n) => studentSeesNotification(n, sid));
    }
    case "visitor":
      return notifications.filter((n) => n.isGlobal === true);
    default:
      return [];
  }
}

export function unreadNotificationsCount(
  notifications: Notification[],
  user: User | null,
  crmStudentId?: string | null,
): number {
  return filterNotificationsForUser(notifications, user, crmStudentId).filter((n) => !n.read).length;
}
