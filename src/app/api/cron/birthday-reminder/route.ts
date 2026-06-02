import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Runs daily at 10:00 UTC = 07:00 BRT via vercel.json cron schedule

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com";
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

const XP_BIRTHDAY = 50;

type StudentRow = {
  id: string;
  name: string;
  auth_user_id: string | null;
  birthdate: string | null;
  status: string;
};

type PushSubRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
};

function initWebPush(): typeof webpush | null {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return null;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  return webpush;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ skipped: true, reason: "service_key_missing" });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Fetch all active students with birthdate
  const { data: studentsData } = await sb
    .from("students")
    .select("id, name, auth_user_id, birthdate, status")
    .eq("status", "active")
    .not("birthdate", "is", null);

  const students = (studentsData ?? []) as StudentRow[];

  // 2. Filter students whose birthdate month+day matches today (ignoring year)
  const today = new Date();
  const todayMonth = today.getMonth() + 1; // 1-12
  const todayDay = today.getDate();

  const birthdayStudents = students.filter((s) => {
    if (!s.birthdate) return false;
    const parts = s.birthdate.split("-");
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    return month === todayMonth && day === todayDay;
  });

  if (birthdayStudents.length === 0) {
    return NextResponse.json({ checked: students.length, birthdays: [] });
  }

  const wp = initWebPush();
  const results: { name: string; studentId: string; xpInserted: boolean; pushSent: boolean }[] = [];

  for (const student of birthdayStudents) {
    let xpInserted = false;
    let pushSent = false;
    const firstName = student.name.split(" ")[0];

    // 3a. Insert XP for birthday
    const xpResult = await sb.from("xp_log").insert({
      student_id: student.id,
      points: XP_BIRTHDAY,
      base_points: XP_BIRTHDAY,
      multiplier_type: "aniversario",
      multiplier_value: 1,
      type: "achievement_unlock",
      source_entity: "achievement",
      description: `🎂 Aniversário de ${student.name} — +${XP_BIRTHDAY} XP`,
      validation_passed: true,
      created_by: "cron",
    });
    xpInserted = !xpResult.error;

    // 3b. Check birthday_wishes preference before sending push
    const { data: prefRow } = await sb
      .from("notification_preferences")
      .select("birthday_wishes")
      .eq("student_id", student.id)
      .maybeSingle();
    const wantsBirthday = prefRow ? (prefRow as { birthday_wishes: boolean }).birthday_wishes : true;

    // 3c. Fetch push subscriptions for this student
    if (wp && student.auth_user_id && wantsBirthday) {
      const { data: subsData } = await sb
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth, user_id")
        .eq("user_id", student.auth_user_id);

      const subs = (subsData ?? []) as PushSubRow[];

      const payload = JSON.stringify({
        title: `🎂 Feliz aniversário, ${firstName}!`,
        body: `O Will te deseja um dia incrível 🏐 Você ganhou +${XP_BIRTHDAY} XP de presente!`,
        url: "/dashboard",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.svg",
      });

      const pushResults = await Promise.allSettled(
        subs.map((sub) =>
          wp.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          ),
        ),
      );
      pushSent = pushResults.some((r) => r.status === "fulfilled");
    }

    results.push({ name: student.name, studentId: student.id, xpInserted, pushSent });
  }

  console.log(`[cron/birthday-reminder] checked=${students.length} birthdays=${birthdayStudents.length}`, results);

  return NextResponse.json({
    checked: students.length,
    birthdays: results,
  });
}
