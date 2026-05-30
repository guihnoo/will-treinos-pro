import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const REASON_LABELS: Record<string, string> = {
  doenca: "doença",
  trabalho: "trabalho",
  viagem: "viagem",
  emergencia: "emergência",
  pessoal: "motivo pessoal",
  outro: "outro motivo",
};

function initWebPush() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
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

  // Resolve student
  const { data: student } = await sb
    .from("students")
    .select("id, name")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as {
    lessonId?: string;
    lessonDate?: string;
    lessonTitle?: string;
    lessonTime?: string;
    reason?: string;
    notes?: string;
  };

  if (!body.lessonId || !body.lessonDate || !body.lessonTitle || !body.reason) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const validReasons = Object.keys(REASON_LABELS);
  if (!validReasons.includes(body.reason)) {
    return NextResponse.json({ error: "Motivo inválido" }, { status: 400 });
  }

  // Check for duplicate
  const { data: existing } = await sb
    .from("absence_requests")
    .select("id")
    .eq("student_id", student.id)
    .eq("lesson_id", body.lessonId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Falta já comunicada para esta aula" }, { status: 409 });
  }

  // Insert
  const { data: inserted, error: insertErr } = await sb
    .from("absence_requests")
    .insert({
      student_id: student.id,
      lesson_id: body.lessonId,
      lesson_date: body.lessonDate,
      lesson_title: body.lessonTitle,
      lesson_time: body.lessonTime ?? null,
      reason: body.reason,
      notes: body.notes?.trim() ?? null,
    })
    .select("id")
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Notify staff via push
  const wp = initWebPush();
  if (wp) {
    const { data: staffSubs } = await sb
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .in("role", ["admin", "professor"]);

    if (staffSubs?.length) {
      const firstName = student.name.split(" ")[0];
      const dateStr = new Date(`${body.lessonDate}T00:00:00`).toLocaleDateString("pt-BR", {
        weekday: "short", day: "numeric", month: "short",
      });
      const timeStr = body.lessonTime ? ` às ${body.lessonTime}` : "";
      const payload = JSON.stringify({
        title: `⚠️ Falta comunicada — ${firstName}`,
        body: `${student.name} não comparecerá a ${body.lessonTitle}${timeStr} em ${dateStr}. Motivo: ${REASON_LABELS[body.reason]}.`,
        url: "/will",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.svg",
      });
      await Promise.allSettled(
        staffSubs.map((s: { endpoint: string; p256dh: string; auth: string }) =>
          wp.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        )
      );
    }
  }

  return NextResponse.json({ id: inserted.id, ok: true });
}

// GET — staff fetches upcoming absence requests
export async function GET(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await sb
    .from("absence_requests")
    .select("id, student_id, lesson_id, lesson_date, lesson_title, lesson_time, reason, notes, status, created_at, students(name)")
    .gte("lesson_date", today)
    .order("lesson_date", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}
