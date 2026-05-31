import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function initWebPush() {
  const pub  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const priv = process.env.VAPID_PRIVATE_KEY ?? "";
  if (!pub || !priv) return null;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com",
    pub, priv
  );
  return webpush;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error: authErr } = await anon.auth.getUser(jwt);
  if (authErr || !user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: student } = await sb
    .from("students")
    .select("id, name")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as {
    targetLessonId?: string;
    targetLessonDate?: string;
    targetLessonTitle?: string;
    targetLessonTime?: string;
    absenceRequestId?: string;
  };

  if (!body.targetLessonId || !body.targetLessonDate || !body.targetLessonTitle) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  // Prevent duplicate request for same lesson
  const { data: existing } = await sb
    .from("reposition_requests")
    .select("id, status")
    .eq("student_id", student.id)
    .eq("target_lesson_id", body.targetLessonId)
    .maybeSingle();

  if (existing && existing.status !== "cancelled") {
    return NextResponse.json({ error: "Reposição já solicitada para esta aula" }, { status: 409 });
  }

  // Fetch the target lesson to check vacancy and current enrolled list
  const { data: lesson, error: lessonErr } = await sb
    .from("lessons")
    .select("id, enrolled_students, max_students, title, date, start_time")
    .eq("id", body.targetLessonId)
    .maybeSingle();

  if (lessonErr || !lesson) {
    return NextResponse.json({ error: "Aula não encontrada" }, { status: 404 });
  }

  const enrolled: string[] = Array.isArray(lesson.enrolled_students) ? lesson.enrolled_students : [];

  if (enrolled.length >= (lesson.max_students ?? 12)) {
    return NextResponse.json({ error: "Aula sem vagas disponíveis" }, { status: 409 });
  }

  if (enrolled.includes(student.id as string)) {
    return NextResponse.json({ error: "Você já está inscrito nesta aula" }, { status: 409 });
  }

  // Enroll the student in the target lesson
  const newEnrolled = [...enrolled, student.id];
  const { error: updateErr } = await sb
    .from("lessons")
    .update({ enrolled_students: newEnrolled })
    .eq("id", body.targetLessonId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Insert reposition request record
  const { data: inserted, error: insertErr } = await sb
    .from("reposition_requests")
    .insert({
      student_id:          student.id,
      absence_request_id:  body.absenceRequestId ?? null,
      target_lesson_id:    body.targetLessonId,
      target_lesson_date:  body.targetLessonDate,
      target_lesson_title: body.targetLessonTitle,
      target_lesson_time:  body.targetLessonTime ?? null,
      status:              "pending",
    })
    .select("id")
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Notify coach via push
  const wp = initWebPush();
  if (wp) {
    const { data: staffSubs } = await sb
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .in("role", ["admin", "professor"]);

    if (staffSubs?.length) {
      const firstName = (student.name as string).split(" ")[0];
      const dateLabel = new Date(`${body.targetLessonDate}T00:00:00`).toLocaleDateString("pt-BR", {
        weekday: "short", day: "numeric", month: "short",
      });
      const timeLabel = body.targetLessonTime ? ` às ${body.targetLessonTime}` : "";
      const payload = JSON.stringify({
        title: `🔄 Reposição — ${firstName}`,
        body: `${student.name} quer repor aula: ${body.targetLessonTitle}${timeLabel} em ${dateLabel}.`,
        url: "/will",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.svg",
      });
      await Promise.allSettled(
        staffSubs.map((s: { endpoint: string; p256dh: string; auth: string }) =>
          wp.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          )
        )
      );
    }
  }

  return NextResponse.json({ id: inserted.id, ok: true });
}

// GET — staff fetches pending reposition requests
export async function GET(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await sb
    .from("reposition_requests")
    .select("id, student_id, target_lesson_id, target_lesson_date, target_lesson_title, target_lesson_time, status, created_at, students(name)")
    .eq("status", "pending")
    .gte("target_lesson_date", today)
    .order("target_lesson_date", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}
