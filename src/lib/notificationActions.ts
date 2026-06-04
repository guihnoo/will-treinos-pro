import type { Notification } from "@/context/types";

/** Deep link — StudentHome abre StudentMessagesPanel quando `recados=1`. */
export const RECADOS_DASHBOARD_URL = "/dashboard?recados=1";

export type ActionVariant = "gold" | "zinc" | "ghost";

export interface ActionDef {
  label: string;
  variant: ActionVariant;
}

export interface ActionContext {
  notif: Notification;
  approveStudent: (id: string) => void;
  markRead: (id: string) => void;
  navigate: (url: string) => void;
  onClose: () => void;
}

export interface NotificationActionEntry {
  def: ActionDef;
  execute: (ctx: ActionContext) => void;
}

export const notificationActionMap: Record<string, NotificationActionEntry[]> = {
  new_student: [
    {
      def: { label: "Aprovar", variant: "gold" },
      execute: ({ notif, approveStudent, markRead }) => {
        if (notif.studentId) approveStudent(notif.studentId);
        markRead(notif.id);
      },
    },
    {
      def: { label: "Ver aluno", variant: "zinc" },
      execute: ({ navigate, markRead, notif, onClose }) => {
        navigate("/alunos");
        markRead(notif.id);
        onClose();
      },
    },
  ],
  payment_late: [
    {
      def: { label: "Ir ao financeiro", variant: "gold" },
      execute: ({ navigate, markRead, notif, onClose }) => {
        navigate("/financeiro");
        markRead(notif.id);
        onClose();
      },
    },
  ],
  lesson_soon: [
    {
      def: { label: "Ver agenda", variant: "gold" },
      execute: ({ navigate, notif, markRead, onClose }) => {
        navigate(notif.actionUrl ?? "/agenda");
        markRead(notif.id);
        onClose();
      },
    },
  ],
  performance: [
    {
      def: { label: "Ver evolução", variant: "zinc" },
      execute: ({ navigate, markRead, notif, onClose }) => {
        navigate(notif.actionUrl ?? "/dashboard");
        markRead(notif.id);
        onClose();
      },
    },
  ],
  message: [
    {
      def: { label: "Ver recados", variant: "gold" },
      execute: ({ navigate, markRead, notif, onClose }) => {
        navigate(RECADOS_DASHBOARD_URL);
        markRead(notif.id);
        onClose();
      },
    },
  ],
  broadcast: [
    {
      def: { label: "Marcar lido", variant: "ghost" },
      execute: ({ markRead, notif }) => {
        markRead(notif.id);
      },
    },
  ],
};

/* ─── Tab categorisation ─── */
export type TabLabel = "Ação" | "Lembretes" | "Recados" | "Avisos";

export const tabsByRole = {
  admin:   ["Ação", "Lembretes", "Recados"] as const,
  coach:   ["Ação", "Lembretes", "Recados"] as const,
  aluno:   ["Avisos", "Recados", "Lembretes"] as const,
  visitor: ["Avisos"] as const,
} as const;

export const typeToTabStaff: Record<Notification["type"], TabLabel> = {
  new_student:  "Ação",
  payment_late: "Ação",
  lesson_soon:  "Lembretes",
  performance:  "Lembretes",
  message:      "Recados",
  broadcast:    "Recados",
};

export const typeToTabAluno: Record<Notification["type"], TabLabel> = {
  broadcast:    "Avisos",
  lesson_soon:  "Lembretes",
  performance:  "Avisos",
  message:      "Recados",
  new_student:  "Avisos",
  payment_late: "Avisos",
};

/* ─── Urgency order for cockpit strip ─── */
export const URGENCY_ORDER: Record<Notification["type"], number> = {
  payment_late: 0,
  new_student:  1,
  lesson_soon:  2,
  message:      3,
  broadcast:    4,
  performance:  5,
};

export const ACTION_TYPES = new Set<Notification["type"]>([
  "new_student", "payment_late", "lesson_soon",
]);
