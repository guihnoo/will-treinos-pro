/** Local calendar date YYYY-MM-DD (avoids UTC drift from toISOString). */
export function localDateISO(d = new Date()): string {
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
