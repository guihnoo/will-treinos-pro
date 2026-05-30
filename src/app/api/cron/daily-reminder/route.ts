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

type PushSub = { endpoint: string; p256dh: string; auth: string; user_id: string };
type Student = { id: string; auth_user_id: string | null; name: string };
type LessonRow = { enrolled_students: string[]; title: string | null; start_time: string; category_id: string | null };
type CategoryRow = { id: string; name: string };

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
    return NextResponse.json({ skipped: true, reason: "push_not_configured" });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  // Fetch student push subscriptions
  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .eq("role", "aluno");

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no_subscriptions" });
  }

  // Fetch active students
  const userIds = (subs as PushSub[]).map((s) => s.user_id);
  const { data: studentsData } = await sb
    .from("students")
    .select("id, auth_user_id, name")
    .in("auth_user_id", userIds)
    .eq("status", "active");

  const students = (studentsData ?? []) as Student[];
  const authToStudent = new Map(
    students.filter((s) => s.auth_user_id).map((s) => [s.auth_user_id!, s])
  );

  // Fetch today's scheduled lessons (all)
  const { data: lessonsData } = await sb
    .from("lessons")
    .select("enrolled_students, title, start_time, category_id")
    .eq("date", today)
    .eq("status", "scheduled");

  const todayLessons = (lessonsData ?? []) as LessonRow[];

  // Fetch category names for lesson titles
  const catIds = [...new Set(todayLessons.map((l) => l.category_id).filter(Boolean))] as string[];
  const { data: catsData } = catIds.length
    ? await sb.from("lesson_categories").select("id, name").in("id", catIds)
    : { data: [] };
  const catMap = new Map(((catsData ?? []) as CategoryRow[]).map((c) => [c.id, c.name]));

  // Build map: student CRM id → their first lesson today
  const studentToLesson = new Map<string, { title: string; startTime: string }>();
  for (const lesson of todayLessons.sort((a, b) => a.start_time.localeCompare(b.start_time))) {
    for (const crmId of (lesson.enrolled_students ?? [])) {
      if (!studentToLesson.has(crmId)) {
        const title = lesson.title || catMap.get(lesson.category_id ?? "") || "Treino";
        studentToLesson.set(crmId, { title, startTime: lesson.start_time });
      }
    }
  }

  // Send personalized push
  const results = await Promise.allSettled(
    (subs as PushSub[]).map((sub) => {
      const student = authToStudent.get(sub.user_id);
      const firstName = student?.name.split(" ")[0] ?? "Atleta";
      const lessonInfo = student ? studentToLesson.get(student.id) : undefined;

      const payload = lessonInfo
        ? JSON.stringify({
            title: `🏐 ${firstName}, você tem treino hoje!`,
            body: `${lessonInfo.title} às ${lessonInfo.startTime}. Prepare-se e chegue no horário! 💪`,
            url: "/dashboard",
            icon: "/icons/icon-192.png",
            badge: "/icons/badge-72.svg",
          })
        : JSON.stringify({
            title: `⚡ ${firstName}, seus desafios de hoje estão prontos!`,
            body: "Ganhe até 225 XP hoje e evolua seus fundamentos. Toque para abrir. 🏐",
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
  const withLesson = [...authToStudent.values()].filter((s) => studentToLesson.has(s.id)).length;

  console.log(`[cron/daily-reminder] sent=${sent} failed=${failed} withLesson=${withLesson}`);
  return NextResponse.json({ sent, failed, total: subs.length, withLesson });
}
