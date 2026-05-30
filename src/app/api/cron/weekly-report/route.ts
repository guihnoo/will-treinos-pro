import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Runs every Friday at 21:00 UTC = 18:00 BRT
// Sends each student a personalized weekly performance summary.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET  = process.env.CRON_SECRET;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com";
const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

function initWebPush(): typeof webpush | null {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return null;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  return webpush;
}

function getWeekBounds(): { start: string; end: string; lastStart: string; lastEnd: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now); mon.setDate(now.getDate() + diffToMon); mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999);
  const lastMon = new Date(mon); lastMon.setDate(mon.getDate() - 7);
  const lastSun = new Date(sun); lastSun.setDate(sun.getDate() - 7);
  return {
    start:     mon.toISOString().slice(0, 10),
    end:       sun.toISOString().slice(0, 10),
    lastStart: lastMon.toISOString().slice(0, 10),
    lastEnd:   lastSun.toISOString().slice(0, 10),
  };
}

type PushSub = { endpoint: string; p256dh: string; auth: string; user_id: string };

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wp = initWebPush();
  if (!wp || !SERVICE_KEY) {
    return NextResponse.json({ skipped: true, reason: "not_configured" });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const week = getWeekBounds();

  // Get student push subscriptions
  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .eq("role", "aluno");

  if (!subs?.length) return NextResponse.json({ sent: 0, reason: "no_subscriptions" });

  const userIds = (subs as PushSub[]).map((s) => s.user_id);

  // Fetch students
  const { data: students } = await sb
    .from("students")
    .select("id, auth_user_id, name")
    .in("auth_user_id", userIds)
    .eq("status", "active");

  const studentMap = new Map(
    ((students ?? []) as { id: string; auth_user_id: string; name: string }[])
      .filter((s) => s.auth_user_id)
      .map((s) => [s.auth_user_id!, s])
  );

  // XP this week vs last week per student
  const { data: xpThisWeek } = await sb
    .from("xp_log")
    .select("student_id, points")
    .gte("created_at", `${week.start}T00:00:00`)
    .lte("created_at", `${week.end}T23:59:59`)
    .eq("validation_passed", true);

  const { data: xpLastWeek } = await sb
    .from("xp_log")
    .select("student_id, points")
    .gte("created_at", `${week.lastStart}T00:00:00`)
    .lte("created_at", `${week.lastEnd}T23:59:59`)
    .eq("validation_passed", true);

  const thisWeekXP = new Map<string, number>();
  const lastWeekXP = new Map<string, number>();
  for (const row of xpThisWeek ?? []) {
    thisWeekXP.set(row.student_id, (thisWeekXP.get(row.student_id) ?? 0) + row.points);
  }
  for (const row of xpLastWeek ?? []) {
    lastWeekXP.set(row.student_id, (lastWeekXP.get(row.student_id) ?? 0) + row.points);
  }

  // Lessons attended this week per student
  const { data: lessonsThisWeek } = await sb
    .from("lessons")
    .select("present_students")
    .gte("date", week.start)
    .lte("date", week.end)
    .eq("status", "completed");

  const classesThisWeek = new Map<string, number>();
  for (const lesson of lessonsThisWeek ?? []) {
    for (const sid of (lesson.present_students as string[] ?? [])) {
      classesThisWeek.set(sid, (classesThisWeek.get(sid) ?? 0) + 1);
    }
  }

  // Send personalized push
  const results = await Promise.allSettled(
    (subs as PushSub[]).map((sub) => {
      const student = studentMap.get(sub.user_id);
      if (!student) return Promise.resolve();

      const xpW  = thisWeekXP.get(student.id) ?? 0;
      const xpL  = lastWeekXP.get(student.id) ?? 0;
      const delta = xpW - xpL;
      const classes = classesThisWeek.get(student.id) ?? 0;
      const firstName = student.name.split(" ")[0];

      const xpStr = xpW > 0 ? `+${xpW} XP` : "0 XP";
      const deltaStr = delta > 0 ? ` ⬆️${delta}` : delta < 0 ? ` ⬇️${Math.abs(delta)}` : "";
      const classesStr = classes > 0 ? ` · ${classes} treino${classes > 1 ? "s" : ""}` : "";

      const body = xpW > 0 || classes > 0
        ? `${xpStr}${deltaStr} esta semana${classesStr}. Confira seu resumo! 🏐`
        : `Semana sem treinos registrados. Volte mais forte na próxima! 💪`;

      const payload = JSON.stringify({
        title: `📊 ${firstName}, seu resumo da semana`,
        body,
        url: "/dashboard",
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
  console.log(`[cron/weekly-report] sent=${sent} total=${subs.length} week=${week.start}`);
  return NextResponse.json({ sent, total: subs.length, week: week.start });
}
