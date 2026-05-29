import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Runs daily at 12:00 UTC (09h BRT)
// Sends reminder to new students who haven't completed onboarding

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

  // Find students who have very little XP (< 400 = not yet onboarded)
  // and joined recently (active status, has push subscription)
  const { data: lowXPStudents } = await sb
    .from("xp_log")
    .select("student_id")
    .eq("validation_passed", true)
    .then(async ({ data: allLogs }) => {
      // Get students with < 400 total XP
      const xpByStudent = new Map<string, number>();
      for (const log of (allLogs ?? [])) {
        const l = log as { student_id: string; points: number };
        xpByStudent.set(l.student_id, (xpByStudent.get(l.student_id) ?? 0) + l.points);
      }
      const lowXP = [...xpByStudent.entries()]
        .filter(([, xp]) => xp < 400)
        .map(([id]) => id);
      return { data: lowXP.map((id) => ({ student_id: id })) };
    });

  const lowXPIds = (lowXPStudents ?? []).map((s: { student_id: string }) => s.student_id);

  if (lowXPIds.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_new_students" });
  }

  // Get their names + auth_user_ids
  const { data: students } = await sb
    .from("students")
    .select("id, name, auth_user_id")
    .in("id", lowXPIds)
    .eq("status", "active");

  if (!students || students.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_active_students" });
  }

  const authIds = (students as { id: string; name: string; auth_user_id: string | null }[])
    .filter((s) => s.auth_user_id)
    .map((s) => s.auth_user_id!);

  if (authIds.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_auth_ids" });
  }

  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .in("user_id", authIds);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_subscriptions" });
  }

  const authToName = new Map(
    (students as { id: string; name: string; auth_user_id: string | null }[])
      .filter((s) => s.auth_user_id)
      .map((s) => [s.auth_user_id!, s.name.split(" ")[0]])
  );

  const results = await Promise.allSettled(
    (subs as { endpoint: string; p256dh: string; auth: string; user_id: string }[]).map((sub) => {
      const firstName = authToName.get(sub.user_id) ?? "Atleta";
      return wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: `🎯 ${firstName}, você tem missões pendentes!`,
          body: "Complete o onboarding e ganhe até 200 XP bônus. Toque para abrir. 🏐",
          url: "/treinos",
          icon: "/icons/icon-192.png",
          badge: "/icons/badge-72.svg",
        })
      );
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ sent, failed: results.length - sent, total: subs.length });
}
