import { NextRequest, NextResponse } from "next/server";

// Roda às 11:00 UTC (08h BRT) — substitui 5 crons matutinos no plano Hobby.
// Despacha: birthday-reminder (sempre), daily-reminder (sempre),
// onboarding-reminder (sempre), payment-reminder (dias 5 e 20),
// monthly-report (dia 1).

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
  const day = now.getUTCDate();
  const results: string[] = [];

  // Aniversário — diário
  results.push(await dispatch(req, "/api/cron/birthday-reminder"));

  // Lembrete diário — diário
  results.push(await dispatch(req, "/api/cron/daily-reminder"));

  // Onboarding — diário
  results.push(await dispatch(req, "/api/cron/onboarding-reminder"));

  // Pagamento — dias 5 e 20
  if (day === 5 || day === 20) {
    results.push(await dispatch(req, "/api/cron/payment-reminder"));
  }

  // Relatório mensal — dia 1
  if (day === 1) {
    results.push(await dispatch(req, "/api/cron/monthly-report"));
  }

  return NextResponse.json({ ok: true, dispatched: results });
}
