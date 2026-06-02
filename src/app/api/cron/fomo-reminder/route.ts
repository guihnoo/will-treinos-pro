import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Runs daily at 22:00 UTC = 19:00 BRT via vercel.json cron schedule
// Detects inactive students and sends personalised FOMO push notifications.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com";
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

type PushSub = { endpoint: string; p256dh: string; auth: string; user_id: string };
type StudentRow = { id: string; auth_user_id: string | null; name: string; status: string };
type XpLogRow = { student_id: string; created_at: string };
type XpSumRow = { student_id: string; total_xp: number };

function initWebPush(): typeof webpush | null {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return null;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  return webpush;
}

function cardTierLabel(totalXp: number): string {
  if (totalXp >= 10000) return "Elite";
  if (totalXp >= 6000) return "Diamante";
  if (totalXp >= 3000) return "Ouro";
  if (totalXp >= 1500) return "Prata";
  if (totalXp >= 500) return "Bronze";
  return "Iniciante";
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

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Fetch all active students with auth accounts
  const { data: students } = await sb
    .from("students")
    .select("id, auth_user_id, name, status")
    .eq("status", "active")
    .not("auth_user_id", "is", null);

  if (!students || students.length === 0) {
    return NextResponse.json({ processed: 0, sent3d: 0, sent7d: 0, skipped: 0, reason: "no_active_students" });
  }

  const studentIds = (students as StudentRow[]).map((s) => s.id);

  // 2. Get most recent xp_log entry per student
  const { data: latestLogs } = await sb
    .from("xp_log")
    .select("student_id, created_at")
    .in("student_id", studentIds)
    .order("created_at", { ascending: false });

  // Build map: student_id → latest activity timestamp
  const latestActivityMap = new Map<string, string>();
  if (latestLogs) {
    for (const row of latestLogs as XpLogRow[]) {
      if (!latestActivityMap.has(row.student_id)) {
        latestActivityMap.set(row.student_id, row.created_at);
      }
    }
  }

  // 3. Find the top XP earner in the last 7 days (for FOMO message)
  const { data: recentXpRows } = await sb
    .from("xp_log")
    .select("student_id, points")
    .gte("created_at", sevenDaysAgo);

  // Aggregate XP per student in last 7 days
  const xpByStudent = new Map<string, number>();
  if (recentXpRows) {
    for (const row of recentXpRows as Array<{ student_id: string; points: number }>) {
      xpByStudent.set(row.student_id, (xpByStudent.get(row.student_id) ?? 0) + (row.points ?? 0));
    }
  }

  // Find top student name among active students
  let topStudentName = "um colega";
  let topStudentXp = 0;
  for (const [sid, xp] of xpByStudent.entries()) {
    if (xp > topStudentXp) {
      topStudentXp = xp;
      const s = (students as StudentRow[]).find((st) => st.id === sid);
      if (s) topStudentName = s.name.split(" ")[0]!;
    }
  }

  // 4. Categorise students by inactivity level
  const inactiveLight: StudentRow[] = []; // 3–6 days inactive
  const inactiveStrong: StudentRow[] = []; // 7+ days inactive
  let skipped = 0;

  for (const student of students as StudentRow[]) {
    const last = latestActivityMap.get(student.id);
    if (!last) {
      // Never had any XP entry — treat as 7d+ inactive
      inactiveStrong.push(student);
      continue;
    }
    if (last >= twoDaysAgo) {
      // Active in last 2 days — skip
      skipped++;
      continue;
    }
    if (last < sevenDaysAgoDate) {
      inactiveStrong.push(student);
    } else if (last < threeDaysAgo) {
      inactiveLight.push(student);
    } else {
      skipped++;
    }
  }

  // 5. Get push subscriptions for inactive students
  const inactiveAll = [...inactiveLight, ...inactiveStrong];
  if (inactiveAll.length === 0) {
    return NextResponse.json({ processed: students.length, sent3d: 0, sent7d: 0, skipped });
  }

  const inactiveAuthIds = inactiveAll
    .map((s) => s.auth_user_id)
    .filter((id): id is string => Boolean(id));

  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .in("user_id", inactiveAuthIds);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ processed: students.length, sent3d: 0, sent7d: 0, skipped, reason: "no_push_subscriptions" });
  }

  // Build auth_user_id → student map
  const authToStudent = new Map<string, StudentRow>(
    (students as StudentRow[])
      .filter((s) => s.auth_user_id)
      .map((s) => [s.auth_user_id as string, s])
  );

  // Fetch notification preferences for inactive students
  const inactiveStudentIds = inactiveAll.map((s) => s.id);
  const { data: prefsRows } = await sb
    .from("notification_preferences")
    .select("student_id, fomo_reminder")
    .in("student_id", inactiveStudentIds);

  const prefsMap = new Map<string, boolean>();
  if (prefsRows) {
    for (const row of prefsRows as Array<{ student_id: string; fomo_reminder: boolean }>) {
      prefsMap.set(row.student_id, row.fomo_reminder);
    }
  }

  let sent3d = 0;
  let sent7d = 0;

  const sendResults = await Promise.allSettled(
    (subs as PushSub[]).map((sub) => {
      const student = authToStudent.get(sub.user_id);
      if (!student) return Promise.resolve();

      // Check fomo_reminder preference (default true if no row)
      const wantsFomo = prefsMap.has(student.id) ? prefsMap.get(student.id)! : true;
      if (!wantsFomo) return Promise.resolve();

      const firstName = student.name.split(" ")[0]!;
      const isStrong = inactiveStrong.some((s) => s.id === student.id);
      const lastActivity = latestActivityMap.get(student.id);
      const daysSince = lastActivity
        ? Math.floor((now.getTime() - new Date(lastActivity).getTime()) / (24 * 60 * 60 * 1000))
        : 14;
      const totalXp = xpByStudent.get(student.id) ?? 0;
      const tier = cardTierLabel(totalXp);

      let title: string;
      let body: string;

      if (isStrong) {
        title = `🔥 ${firstName}, você sumiu da quadra!`;
        body = `Já são ${daysSince} dias sem treinar. Volte antes de perder seu tier ${tier}!`;
      } else {
        title = `👀 ${firstName}, alguém está te ultrapassando!`;
        body = `${topStudentName} ganhou ${topStudentXp} XP enquanto você estava fora.`;
      }

      const payload = JSON.stringify({
        title,
        body,
        url: "/treinos",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.svg",
      });

      return wp
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        .then(() => {
          if (isStrong) sent7d++;
          else sent3d++;
        });
    })
  );

  const failed = sendResults.filter((r) => r.status === "rejected").length;

  console.log(
    `[cron/fomo-reminder] processed=${students.length} light=${inactiveLight.length} strong=${inactiveStrong.length} sent3d=${sent3d} sent7d=${sent7d} skipped=${skipped} failed=${failed}`
  );

  return NextResponse.json({ processed: students.length, sent3d, sent7d, skipped, failed });
}
