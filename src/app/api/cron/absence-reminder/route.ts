import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Runs daily at 21:00 UTC = 18:00 BRT via vercel.json cron schedule
// Detects students who missed today's class and sends a push suggesting rescheduling.

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
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wp = initWebPush();
  if (!wp || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ skipped: true, reason: "not_configured" });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Today's date in YYYY-MM-DD format (UTC is fine — lessons are date-only)
  const today = new Date().toISOString().slice(0, 10);

  // Fetch completed lessons from today
  const { data: todayLessons } = await sb
    .from("lessons")
    .select("id, enrolled_students, present_students, title, category_id, start_time")
    .eq("date", today)
    .eq("status", "completed");

  if (!todayLessons || todayLessons.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_completed_lessons_today" });
  }

  // Collect absent student IDs across all today's lessons
  const absentMap = new Map<string, { lessonTitle: string; lessonTime: string }>();
  for (const lesson of todayLessons) {
    const enrolled: string[] = lesson.enrolled_students ?? [];
    const present: string[] = lesson.present_students ?? [];
    const title: string = lesson.title ?? "Treino";
    const time: string = lesson.start_time ?? "";
    enrolled
      .filter((sid: string) => !present.includes(sid))
      .forEach((sid: string) => {
        if (!absentMap.has(sid)) absentMap.set(sid, { lessonTitle: title, lessonTime: time });
      });
  }

  if (absentMap.size === 0) {
    return NextResponse.json({ sent: 0, reason: "no_absences_today" });
  }

  // Fetch students with push subscriptions for absent IDs
  // students table uses "id" as the CRM id — push_subscriptions uses auth user_id
  const absentIds = [...absentMap.keys()];
  const { data: students } = await sb
    .from("students")
    .select("id, auth_user_id, name")
    .in("id", absentIds)
    .not("auth_user_id", "is", null);

  if (!students || students.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_students_with_auth" });
  }

  const authIds = students.map((s: { auth_user_id: string }) => s.auth_user_id).filter(Boolean);
  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .in("user_id", authIds);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_push_subscriptions" });
  }

  const authToStudent = new Map(
    students.map((s: { id: string; auth_user_id: string; name: string }) => [
      s.auth_user_id,
      { crmId: s.id, name: s.name },
    ])
  );

  const results = await Promise.allSettled(
    subs.map((sub: { endpoint: string; p256dh: string; auth: string; user_id: string }) => {
      const student = authToStudent.get(sub.user_id);
      if (!student) return Promise.resolve();
      const lessonInfo = absentMap.get(student.crmId);
      const firstName = student.name.split(" ")[0];
      const timeStr = lessonInfo?.lessonTime ? ` às ${lessonInfo.lessonTime}` : "";

      const payload = JSON.stringify({
        title: `🔄 ${firstName}, você perdeu o treino de hoje${timeStr}`,
        body: "Solicite uma reposição agora e não perca seu ritmo! 🏐",
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
  const failed = results.length - sent;

  console.log(`[cron/absence-reminder] absent=${absentMap.size} sent=${sent} failed=${failed}`);
  return NextResponse.json({ sent, failed, absentCount: absentMap.size });
}
