import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getMonday(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  return mon.toISOString().slice(0, 10);
}

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

async function verifyStaff(jwt: string): Promise<{ ok: boolean; userId?: string; displayName?: string }> {
  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error } = await anon.auth.getUser(jwt);
  if (error || !user) return { ok: false };

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: staffRow } = await sb.from("staff_access").select("role").eq("auth_user_id", user.id).maybeSingle();
  const { data: studentRow } = await sb.from("students").select("name, student_role").eq("auth_user_id", user.id).maybeSingle();

  const isStaff = Boolean(staffRow) || studentRow?.student_role === "professor";
  return { ok: isStaff, userId: user.id, displayName: studentRow?.name ?? "Coach" };
}

// POST — set weekly highlight
export async function POST(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { ok, userId, displayName } = await verifyStaff(jwt);
  if (!ok) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { studentId, note } = (await req.json().catch(() => ({}))) as { studentId?: string; note?: string };
  if (!studentId) return NextResponse.json({ error: "studentId obrigatório" }, { status: 400 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const weekStart = getMonday(new Date());

  // Fetch student
  const { data: student } = await sb
    .from("students")
    .select("id, name, auth_user_id, avatar")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  // Upsert highlight (replace if same week)
  const { error: upsertErr } = await sb
    .from("weekly_highlights")
    .upsert(
      { student_id: studentId, week_start: weekStart, note: note?.trim() ?? null, awarded_by: userId, xp_awarded: 150 },
      { onConflict: "week_start" }
    );
  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

  // Award XP
  await sb.from("xp_log").insert({
    student_id: studentId,
    points: 150,
    base_points: 150,
    multiplier_type: "destaque_semana",
    multiplier_value: 1.0,
    type: "achievement_unlock",
    validation_passed: true,
    created_by: userId ?? "system",
  });

  // Create official feed post
  const firstName = student.name.split(" ")[0];
  const noteStr = note?.trim() ? `\n\n"${note.trim()}"` : "";
  await sb.from("feed_posts").insert({
    author_name: displayName ?? "Will Treinos PRO",
    author_avatar: "⭐",
    author_role: "admin",
    content: `🌟 ${student.name} é o Destaque da Semana!\n\nParabéns pela dedicação e evolução no treino. Continue assim!${noteStr}`,
    media_url: null,
    pinned: false,
    is_official: true,
    target_role: "all",
  });

  // Push notification to student
  const wp = initWebPush();
  if (wp && student.auth_user_id) {
    const { data: subs } = await sb
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", student.auth_user_id);

    if (subs?.length) {
      const payload = JSON.stringify({
        title: `⭐ ${firstName}, você é o Destaque da Semana!`,
        body: note?.trim() ? `"${note.trim().slice(0, 60)}"` : `Parabéns pelo seu desempenho! +150 XP desbloqueados 🏐`,
        url: "/dashboard",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.svg",
      });
      await Promise.allSettled(
        subs.map((s: { endpoint: string; p256dh: string; auth: string }) =>
          wp.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        )
      );
    }
  }

  return NextResponse.json({ ok: true, weekStart, studentName: student.name, xpAwarded: 150 });
}

// GET — current week's highlight
export async function GET(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const weekStart = getMonday(new Date());

  const { data } = await sb
    .from("weekly_highlights")
    .select("student_id, week_start, note, xp_awarded, created_at, students(name, avatar)")
    .eq("week_start", weekStart)
    .maybeSingle();

  if (!data) return NextResponse.json({ highlight: null });

  return NextResponse.json({
    highlight: {
      studentId: data.student_id,
      studentName: (Array.isArray(data.students) ? data.students[0]?.name : (data.students as { name: string } | null)?.name) ?? "Atleta",
      weekStart: data.week_start,
      note: data.note,
      xpAwarded: data.xp_awarded,
    },
  });
}
