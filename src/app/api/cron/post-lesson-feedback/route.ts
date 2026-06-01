import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Runs every hour: "0 * * * *"
// Finds completed lessons from 3h–2h ago and sends mood-feedback push to each present student.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com";
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

type LessonRow = {
  id: string;
  title: string | null;
  status: string;
  present_students: string[] | null;
  updated_at: string | null;
  date: string;
  start_time: string | null;
};

type PushSub = {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
};

type XpLogRow = {
  student_id: string;
  details: Record<string, unknown> | null;
};

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

  const now = new Date();
  const windowEnd = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2h ago
  const windowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3h ago

  // Fetch lessons completed in the 2h–3h window
  const { data: lessons, error: lessonsError } = await sb
    .from("lessons")
    .select("id, title, status, present_students, updated_at, date, start_time")
    .eq("status", "completed")
    .gte("updated_at", windowStart.toISOString())
    .lte("updated_at", windowEnd.toISOString());

  if (lessonsError) {
    console.error("[post-lesson-feedback] lessons query failed:", lessonsError);
    return NextResponse.json({ error: "Failed to load lessons" }, { status: 500 });
  }

  if (!lessons || lessons.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, reason: "no_lessons_in_window" });
  }

  // Collect lesson IDs to check for already-sent feedback flags
  const lessonIds = (lessons as LessonRow[]).map((l) => l.id);

  // Check xp_log for already-sent mood feedback flags
  const { data: existingMoods } = await sb
    .from("xp_log")
    .select("student_id, details")
    .eq("type", "mood_response")
    .in("details->>lessonId", lessonIds);

  // Build set of "lessonId:studentId" pairs that already responded
  const respondedSet = new Set<string>();
  (existingMoods as XpLogRow[] | null)?.forEach((row) => {
    if (row.details?.lessonId && row.student_id) {
      respondedSet.add(`${row.details.lessonId as string}:${row.student_id}`);
    }
  });

  // Collect all unique student IDs that need a push
  const targets: Array<{ lessonId: string; lessonTitle: string; studentId: string }> = [];

  for (const lesson of lessons as LessonRow[]) {
    const presentStudents = lesson.present_students ?? [];
    for (const studentId of presentStudents) {
      const key = `${lesson.id}:${studentId}`;
      if (!respondedSet.has(key)) {
        targets.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title ?? "Aula",
          studentId,
        });
      }
    }
  }

  if (targets.length === 0) {
    return NextResponse.json({ processed: lessons.length, sent: 0, reason: "all_already_responded" });
  }

  // Get push subscriptions for all relevant student IDs
  const uniqueStudentIds = [...new Set(targets.map((t) => t.studentId))];
  const { data: pushSubs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .in("user_id", uniqueStudentIds);

  const subByUserId = new Map<string, PushSub>();
  (pushSubs as PushSub[] | null)?.forEach((sub) => {
    subByUserId.set(sub.user_id, sub);
  });

  let sent = 0;

  for (const target of targets) {
    const sub = subByUserId.get(target.studentId);
    if (!sub) continue;

    const payload = JSON.stringify({
      title: "Como foi o treino? 💪",
      body: `${target.lessonTitle} — diga como você se sentiu`,
      url: `/api/student/lesson-mood?lessonId=${target.lessonId}&studentId=${target.studentId}`,
      data: {
        lessonId: target.lessonId,
        studentId: target.studentId,
        type: "mood_request",
      },
    });

    try {
      await wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (err) {
      console.warn("[post-lesson-feedback] push failed for", target.studentId, err);
    }
  }

  return NextResponse.json({ processed: (lessons as LessonRow[]).length, sent });
}
