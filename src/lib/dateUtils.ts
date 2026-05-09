/** Local calendar date YYYY-MM-DD (avoids UTC drift from toISOString). */
export function localDateISO(d: Date | string = new Date()): string {
  if (typeof d === "string") return d; // Already in YYYY-MM-DD format
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MONTHS_PT = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"] as const;

/** Matches mock payment `reference` format (e.g. ABR/26). */
export function paymentReferenceForDate(d = new Date()): string {
  return `${MONTHS_PT[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
}

/** Vencimento no mês de `base` usando dia preferencial (1–28; ajusta ao último dia do mês). */
export function dueDateForBillingMonth(paymentDay: number, base = new Date()): string {
  const y = base.getFullYear();
  const m = base.getMonth();
  const wanted = Math.min(28, Math.max(1, Math.round(paymentDay) || 10));
  const lastDay = new Date(y, m + 1, 0).getDate();
  const d = Math.min(wanted, lastDay);
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Parse "HH:mm" + lesson date into local Date for countdowns. */
export function lessonLocalDateTime(dateStr: string, startTime: string): Date {
  const [y, mo, day] = dateStr.split("-").map(Number);
  const [hh, mm] = startTime.split(":").map(Number);
  return new Date(y, (mo || 1) - 1, day || 1, hh || 0, mm || 0, 0, 0);
}

/** Format date to short readable format (e.g., "4 Mai" or "04 de Maio"). */
export function formatDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const day = date.getDate();
  const monthIdx = date.getMonth();
  const monthsShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${day} ${monthsShort[monthIdx]}`;
}

/** Return the Monday of the week containing the given date. */
export function getMonday(d: Date | string): Date {
  const date = typeof d === "string" ? new Date(d) : new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

/**
 * Label for `notifications.time` — supports legacy "agora", ISO strings,
 * pt-BR clock-only ("14:35" from toLocaleTimeString), and mock values like "2h".
 */
export function formatNotificationDisplayTime(raw: string | undefined | null): string {
  const t = (raw ?? "").trim();
  if (!t || /^agora$/i.test(t)) return "Agora";
  if (/^\d+h$/i.test(t)) return t.toUpperCase();

  const parsed = new Date(t);
  if (!Number.isNaN(parsed.getTime())) {
    const today = new Date();
    const isToday = parsed.toDateString() === today.toDateString();
    return isToday
      ? parsed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  const clockOnly = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (clockOnly) {
    const hh = parseInt(clockOnly[1], 10);
    const mm = parseInt(clockOnly[2], 10);
    const now = new Date();
    const pseudo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
    return pseudo.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  return t;
}
