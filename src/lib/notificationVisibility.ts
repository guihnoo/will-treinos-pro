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
export function filterNotificationsForUser(notifications: Notification[], user: User | null): Notification[] {
  if (!user || user.role === null) return [];
  switch (user.role) {
    case "admin":
      return notifications;
    case "coach":
      return notifications.filter(coachSeesNotification);
    case "aluno":
      return notifications.filter((n) => studentSeesNotification(n, user.id));
    case "visitor":
      return notifications.filter((n) => n.isGlobal === true);
    default:
      return [];
  }
}

export function unreadNotificationsCount(notifications: Notification[], user: User | null): number {
  return filterNotificationsForUser(notifications, user).filter((n) => !n.read).length;
}
