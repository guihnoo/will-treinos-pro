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
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com",
    pub,
    priv
  );
  return webpush;
}

export interface CoachMessageBody {
  studentId: string;   // CRM student UUID
  message: string;
  fromName?: string;   // display name (falls back to "Coach")
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Verify staff JWT
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(jwt);
  if (authError || !user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  // Verify staff access
  const { data: staffRow } = await sb
    .from("staff_access")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const { data: adminRow } = await sb
    .from("students")
    .select("student_role")
    .eq("auth_user_id", user.id)
    .eq("student_role", "professor")
    .maybeSingle();

  const isStaff = Boolean(staffRow) || Boolean(adminRow);
  if (!isStaff) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body: CoachMessageBody = await req.json().catch(() => null);
  if (!body?.studentId || !body?.message?.trim()) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const fromName = (body.fromName?.trim() || "Coach").slice(0, 60);
  const message = body.message.trim().slice(0, 1000);

  // Fetch student to resolve authUserId + name
  const { data: student } = await sb
    .from("students")
    .select("id, name, auth_user_id")
    .eq("id", body.studentId)
    .maybeSingle();

  if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  // Insert message
  const { data: inserted, error: insertErr } = await sb
    .from("coach_messages")
    .insert({
      from_name: fromName,
      to_student_id: student.id,
      message,
    })
    .select("id, created_at")
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  const preview = message.length > 120 ? `${message.slice(0, 117)}…` : message;
  const { error: notifErr } = await sb.from("notifications").insert({
    type: "message",
    title: `Recado de ${fromName}`,
    message: preview,
    time: inserted.created_at ?? new Date().toISOString(),
    is_read: false,
    recipient_id: student.id,
    student_id: student.id,
    is_global: false,
    action_url: "/dashboard",
  });
  if (notifErr) {
    console.warn("[coach-message] notification mirror failed:", notifErr.message);
  }

  // Send push notification if student has a subscription
  const wp = initWebPush();
  let pushSent = false;
  if (wp && student.auth_user_id) {
    const { data: subs } = await sb
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", student.auth_user_id);

    if (subs && subs.length > 0) {
      const firstName = student.name.split(" ")[0];
      const payload = JSON.stringify({
        title: `💬 Recado de ${fromName}`,
        body: message.length > 80 ? message.slice(0, 77) + "…" : message,
        url: "/dashboard",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.svg",
      });

      const results = await Promise.allSettled(
        subs.map((s: { endpoint: string; p256dh: string; auth: string }) =>
          wp.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          )
        )
      );
      pushSent = results.some((r) => r.status === "fulfilled");
    }
  }

  return NextResponse.json({ id: inserted.id, createdAt: inserted.created_at, pushSent });
}

// GET — staff fetches messages sent to a specific student (for the inline preview)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(jwt);
  if (authError || !user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  // Security C2: verificar staff antes de retornar mensagens de qualquer aluno
  const { data: staffRow } = await sb
    .from("staff_access")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!staffRow) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId obrigatório" }, { status: 400 });

  const { data, error } = await sb
    .from("coach_messages")
    .select("id, from_name, message, created_at, read_at")
    .eq("to_student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}
