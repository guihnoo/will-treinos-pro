import { NextRequest, NextResponse } from "next/server";

// Roda às 21:00 UTC (18h BRT) — substitui 4 crons noturnos no plano Hobby.
// Despacha: absence-reminder (sempre), fomo-reminder (sempre),
// post-lesson-feedback (sempre), weekly-report (somente sextas).

const CRON_SECRET = process.env.CRON_SECRET ?? "";

async function dispatch(req: NextRequest, path: string): Promise<string> {
  const base = new URL(req.url).origin;
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const text = await res.text().catch(() => "");
    return `${path} → ${res.status} ${text.slice(0, 120)}`;
  } catch (err) {
    return `${path} → ERROR ${String(err).slice(0, 80)}`;
  }
}

export async function GET(req: NextRequest) {
  if (req.headers.get("Authorization") !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dow = now.getUTCDay(); // 0=Dom, 5=Sex
  const results: string[] = [];

  // Lembrete de ausência — diário
  results.push(await dispatch(req, "/api/cron/absence-reminder"));

  // FOMO — diário
  results.push(await dispatch(req, "/api/cron/fomo-reminder"));

  // Feedback pós-aula — diário
  results.push(await dispatch(req, "/api/cron/post-lesson-feedback"));

  // Resumo semanal — somente sexta
  if (dow === 5) {
    results.push(await dispatch(req, "/api/cron/weekly-report"));
  }

  return NextResponse.json({ ok: true, dispatched: results });
}
