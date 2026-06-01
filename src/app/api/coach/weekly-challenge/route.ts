import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getMonday(d: Date): string {
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  mon.setHours(0, 0, 0, 0);
  return mon.toISOString().slice(0, 10);
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function verifyStaff(req: NextRequest): Promise<{ userId: string } | NextResponse> {
  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "").trim();
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const anon = getAnonClient();
  if (!anon) return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });

  const { data: { user }, error } = await anon.auth.getUser(jwt);
  if (error || !user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  // Check staff access
  const { data: staffRow } = await anon
    .from("staff_access")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!staffRow) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  return { userId: user.id };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekParam = searchParams.get("week");
  const weekStart = weekParam ?? getMonday(new Date());

  const authResult = await verifyStaff(req);
  if (authResult instanceof NextResponse) return authResult;

  const sb = getServiceClient();
  if (!sb) return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });

  // Fetch challenge
  const { data: challenge, error: challengeError } = await sb
    .from("weekly_challenges")
    .select("*")
    .eq("week_start", weekStart)
    .maybeSingle();

  if (challengeError) return NextResponse.json({ error: challengeError.message }, { status: 500 });
  if (!challenge) return NextResponse.json({ challenge: null, progress: null });

  // Calculate progress: count active students
  const { data: activeStudents } = await sb
    .from("students")
    .select("id, auth_user_id")
    .eq("status", "active");

  const totalStudents = activeStudents?.length ?? 0;

  if (totalStudents === 0) {
    return NextResponse.json({
      challenge,
      progress: { totalStudents: 0, completedStudents: 0 },
    });
  }

  // Week end date (Sunday)
  const weekEndDate = new Date(`${weekStart}T00:00:00`);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekEnd = weekEndDate.toISOString().slice(0, 10);

  let completedStudents = 0;

  if (challenge.challenge_type === "xp") {
    // Count students with xp_log sum >= target this week
    const { data: xpRows } = await sb
      .from("xp_log")
      .select("student_id, total_xp")
      .gte("created_at", `${weekStart}T00:00:00`)
      .lte("created_at", `${weekEnd}T23:59:59`);

    const xpPerStudent = new Map<string, number>();
    for (const row of xpRows ?? []) {
      xpPerStudent.set(row.student_id as string, (xpPerStudent.get(row.student_id as string) ?? 0) + ((row.total_xp as number) ?? 0));
    }
    completedStudents = Array.from(xpPerStudent.values()).filter((v) => v >= challenge.target_value).length;

  } else if (challenge.challenge_type === "checkins" || challenge.challenge_type === "classes") {
    // Count students present in lessons this week
    const { data: lessonRows } = await sb
      .from("lessons")
      .select("present_students")
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .eq("status", "completed");

    const presenceCount = new Map<string, number>();
    for (const row of lessonRows ?? []) {
      const present: string[] = Array.isArray(row.present_students) ? (row.present_students as string[]) : [];
      for (const sid of present) {
        presenceCount.set(sid, (presenceCount.get(sid) ?? 0) + 1);
      }
    }
    completedStudents = Array.from(presenceCount.values()).filter((v) => v >= challenge.target_value).length;

  } else if (challenge.challenge_type === "streak") {
    // Simplification: count students with xp_log entries on >= target_value distinct days this week
    const { data: xpRows } = await sb
      .from("xp_log")
      .select("student_id, created_at")
      .gte("created_at", `${weekStart}T00:00:00`)
      .lte("created_at", `${weekEnd}T23:59:59`);

    const streakPerStudent = new Map<string, Set<string>>();
    for (const row of xpRows ?? []) {
      const sid = row.student_id as string;
      const day = (row.created_at as string).slice(0, 10);
      if (!streakPerStudent.has(sid)) streakPerStudent.set(sid, new Set());
      streakPerStudent.get(sid)!.add(day);
    }
    completedStudents = Array.from(streakPerStudent.values()).filter((days) => days.size >= challenge.target_value).length;
  }

  return NextResponse.json({
    challenge,
    progress: { totalStudents, completedStudents },
  });
}

export async function POST(req: NextRequest) {
  const authResult = await verifyStaff(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body: {
    title?: string;
    description?: string | null;
    challenge_type?: string;
    target_value?: number;
    xp_bonus?: number;
  } = await req.json().catch(() => ({}));

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  }

  const validTypes = ["checkins", "xp", "classes", "streak"];
  if (body.challenge_type && !validTypes.includes(body.challenge_type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  if (!body.target_value || body.target_value < 1) {
    return NextResponse.json({ error: "Meta deve ser >= 1" }, { status: 400 });
  }

  const sb = getServiceClient();
  if (!sb) return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });

  const weekStart = getMonday(new Date());

  const payload = {
    week_start: weekStart,
    title: body.title.trim(),
    description: body.description?.trim() ?? null,
    challenge_type: body.challenge_type ?? "checkins",
    target_value: body.target_value,
    xp_bonus: body.xp_bonus ?? 100,
    created_by: userId,
  };

  const { data: challenge, error } = await sb
    .from("weekly_challenges")
    .upsert(payload, { onConflict: "week_start" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ challenge });
}
