import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Runs on the 1st of each month at 08:00 BRT (11:00 UTC)
// Schedule: "0 11 1 * *"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com";
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

function initWebPush(): typeof webpush | null {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return null;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  return webpush;
}

function prevMonthLabel(): string {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return prev.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wp = initWebPush();
  if (!wp || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ skipped: true, reason: "not_configured" });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Send push notification to all admin/coach users
  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, role")
    .in("role", ["admin", "coach"]);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_staff_subscriptions" });
  }

  const month = prevMonthLabel();
  const payload = JSON.stringify({
    title: `📊 Relatório de ${month} está pronto!`,
    body: "Veja receita, retenção, top atletas e insights estratégicos do mês.",
    url: "/dashboard",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.svg",
  });

  const results = await Promise.allSettled(
    (subs as { endpoint: string; p256dh: string; auth: string }[]).map((sub) =>
      wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  console.log(`[cron/monthly-report] month=${month} sent=${sent}/${subs.length}`);
  return NextResponse.json({ sent, failed: results.length - sent, month });
}
