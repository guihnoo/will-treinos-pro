import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function initWebPush() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const priv = process.env.VAPID_PRIVATE_KEY ?? "";
  if (!pub || !priv) return null;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com", pub, priv);
  return webpush;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const {
    data: { user },
    error: authErr,
  } = await anon.auth.getUser(jwt);
  if (authErr || !user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  const body = (await req.json().catch(() => ({}))) as {
    lessonId?: string;
    lessonTitle?: string;
    lessonDate?: string;
    lessonTime?: string;
    enrolledStudentIds?: string[];
  };

  if (!body.lessonId || !body.enrolledStudentIds?.length) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const { data: studentRows } = await sb
    .from("students")
    .select("id, auth_user_id, name")
    .in("id", body.enrolledStudentIds);

  if (!studentRows?.length) return NextResponse.json({ sent: 0, notifications: 0 });

  const dateStr = body.lessonDate
    ? new Date(`${body.lessonDate}T00:00:00`).toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "hoje";
  const title = body.lessonTitle ?? "Aula";
  const timeSuffix = body.lessonTime ? ` às ${body.lessonTime}` : "";
  const notifMessage = `"${title}" ${dateStr}${timeSuffix}. Confirme sua presença na agenda.`;

  await Promise.all(
    studentRows.map((row) =>
      sb.from("notifications").insert({
        type: "lesson_soon",
        title: "Confirme sua presença",
        message: notifMessage,
        time: new Date().toISOString(),
        is_read: false,
        recipient_id: row.id,
        student_id: row.id,
        is_global: false,
        action_url: "/agenda",
      }),
    ),
  );

  const wp = initWebPush();
  const authIds = studentRows.map((s) => s.auth_user_id).filter(Boolean) as string[];

  if (!wp || authIds.length === 0) {
    return NextResponse.json({ sent: 0, notifications: studentRows.length, reason: "push_not_configured" });
  }

  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .in("user_id", authIds);

  if (!subs?.length) {
    return NextResponse.json({ sent: 0, notifications: studentRows.length });
  }

  const payload = JSON.stringify({
    title: "🏐 Confirme sua presença",
    body: `"${title}" ${dateStr}${timeSuffix}. Você vem? Tap para confirmar!`,
    url: "/agenda",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.svg",
  });

  const results = await Promise.allSettled(
    subs.map((s: { endpoint: string; p256dh: string; auth: string }) =>
      wp.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ sent, total: subs.length, notifications: studentRows.length });
}
