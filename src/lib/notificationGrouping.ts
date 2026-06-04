import type { Notification } from "@/context/types";
import { URGENCY_ORDER } from "@/lib/notificationActions";

export interface NotifGroup {
  id: string;
  type: Notification["type"];
  items: Notification[];
  unreadCount: number;
  latestTime: string;
  isSingle: boolean;
}

/**
 * Agrupa notificações não-lidas por tipo (mesma janela de 24h).
 * Itens lidos são retornados individualmente para exibição compacta.
 */
export function buildGroups(notifs: Notification[]): {
  groups: NotifGroup[];
  readItems: Notification[];
} {
  const unread = notifs.filter(n => !n.read);
  const read   = notifs.filter(n => n.read)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 20); // cap para não poluir a lista

  const map = new Map<string, Notification[]>();
  for (const n of unread) {
    map.set(n.type, [...(map.get(n.type) ?? []), n]);
  }

  const groups: NotifGroup[] = Array.from(map.entries())
    .map(([type, items]) => {
      const sorted = [...items].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
      );
      return {
        id: `group-${type}`,
        type: type as Notification["type"],
        items: sorted,
        unreadCount: items.length,
        latestTime: sorted[0]?.time ?? "",
        isSingle: items.length === 1,
      };
    })
    .sort(
      (a, b) =>
        (URGENCY_ORDER[a.type] ?? 99) - (URGENCY_ORDER[b.type] ?? 99),
    );

  return { groups, readItems: read };
}

export function groupLabelFor(type: Notification["type"], count: number): string {
  const s = count > 1;
  switch (type) {
    case "new_student":  return `${count} novo${s ? "s" : ""} cadastro${s ? "s" : ""}`;
    case "payment_late": return `${count} pagamento${s ? "s" : ""} atrasado${s ? "s" : ""}`;
    case "lesson_soon":  return `${count} lembrete${s ? "s" : ""} de aula`;
    case "performance":  return `${count} atualização${s ? "ões" : ""} de desempenho`;
    case "message":      return `${count} recado${s ? "s" : ""} novo${s ? "s" : ""}`;
    case "broadcast":    return `${count} aviso${s ? "s" : ""} geral${s ? "is" : ""}`;
    default:             return `${count} notificação${s ? "ões" : ""}`;
  }
}

/** Retorna as N notificações mais urgentes (não lidas) para o Peek. */
export function peekItems(notifs: Notification[], limit = 3): Notification[] {
  return notifs
    .filter(n => !n.read)
    .sort(
      (a, b) =>
        (URGENCY_ORDER[a.type] ?? 99) - (URGENCY_ORDER[b.type] ?? 99) ||
        new Date(b.time).getTime() - new Date(a.time).getTime(),
    )
    .slice(0, limit);
}
