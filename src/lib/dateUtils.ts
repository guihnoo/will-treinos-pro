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

/** Parse "HH:mm" + lesson date into local Date for countdowns. */
export function lessonLocalDateTime(dateStr: string, startTime: string): Date {
  const [y, mo, day] = dateStr.split("-").map(Number);
  const [hh, mm] = startTime.split(":").map(Number);
  return new Date(y, (mo || 1) - 1, day || 1, hh || 0, mm || 0, 0, 0);
}
