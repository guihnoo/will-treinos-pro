import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Runs daily at 11:00 UTC = 08:00 BRT via vercel.json cron schedule

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com";
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

type PushSub = {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
};

type Student = {
  auth_user_id: string | null;
  name: string;
};

function initWebPush(): typeof webpush | null {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return null;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  return webpush;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Verify Vercel cron secret
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wp = initWebPush();
  if (!wp) {
    return NextResponse.json({ skipped: true, reason: "push_not_configured" });
  }

  if (!SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ skipped: true, reason: "supabase_not_configured" });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Fetch all push subscriptions for student role
  const { data: subs, error: subsErr } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .eq("role", "aluno");

  if (subsErr || !subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_subscriptions" });
  }

  // Fetch active students to personalize (auth_user_id → name map)
  const userIds = (subs as PushSub[]).map((s) => s.user_id);
  const { data: students } = await sb
    .from("students")
    .select("auth_user_id, name")
    .in("auth_user_id", userIds)
    .eq("status", "active");

  const nameMap = new Map(
    ((students ?? []) as Student[])
      .filter((s) => s.auth_user_id)
      .map((s) => [s.auth_user_id!, s.name.split(" ")[0]])
  );

  // Send personalized push to each subscriber
  const results = await Promise.allSettled(
    (subs as PushSub[]).map((sub) => {
      const firstName = nameMap.get(sub.user_id) ?? "Atleta";
      const payload = JSON.stringify({
        title: `⚡ ${firstName}, seus desafios de hoje estão prontos!`,
        body: "Ganhe até 225 XP hoje e evolua seus fundamentos. Toque para abrir. 🏐",
        url: "/treinos",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.svg",
      });

      return wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;

  console.log(`[cron/daily-reminder] sent=${sent} failed=${failed} total=${subs.length}`);
  return NextResponse.json({ sent, failed, total: subs.length });
}
