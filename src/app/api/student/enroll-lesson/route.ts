import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";

  // Parse body
  let lessonId: string | undefined;
  let action: "enroll" | "unenroll" | undefined;
  try {
    const body = (await req.json()) as { lessonId?: string; action?: string };
    lessonId = body.lessonId;
    action = body.action === "enroll" || body.action === "unenroll" ? body.action : undefined;
  } catch {
    return NextResponse.json({ success: false, error: "Payload inválido" }, { status: 400 });
  }

  if (!lessonId || !action) {
    return NextResponse.json(
      { success: false, error: "lessonId e action são obrigatórios" },
      { status: 400 }
    );
  }

  // Authenticate via JWT (may be absent in dev impersonation — fallback to anon)
  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  let studentId: string | null = null;

  if (jwt) {
    const { data: { user }, error: authErr } = await anon.auth.getUser(jwt);
    if (authErr || !user) {
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 401 });
    }

    const { data: student } = await sb
      .from("students")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    studentId = student?.id ?? null;

    // Fallback: use auth user id directly as student id
    if (!studentId) studentId = user.id;
  } else {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  // Fetch current lesson
  const { data: lesson, error: lessonErr } = await sb
    .from("lessons")
    .select("id, enrolled_students, max_students, status")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonErr || !lesson) {
    return NextResponse.json({ success: false, error: "Aula não encontrada" }, { status: 404 });
  }

  if (lesson.status !== "scheduled") {
    return NextResponse.json(
      { success: false, error: "Inscrições encerradas para esta aula" },
      { status: 409 }
    );
  }

  const enrolled: string[] = Array.isArray(lesson.enrolled_students)
    ? (lesson.enrolled_students as string[])
    : [];

  let updated: string[];

  if (action === "enroll") {
    if (enrolled.includes(studentId)) {
      return NextResponse.json({ success: true, spotsLeft: lesson.max_students - enrolled.length });
    }
    if (enrolled.length >= lesson.max_students) {
      return NextResponse.json(
        { success: false, error: "Aula lotada" },
        { status: 409 }
      );
    }
    updated = [...enrolled, studentId];
  } else {
    updated = enrolled.filter((id) => id !== studentId);
  }

  const { error: updateErr } = await sb
    .from("lessons")
    .update({ enrolled_students: updated })
    .eq("id", lessonId);

  if (updateErr) {
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar inscrição" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    spotsLeft: lesson.max_students - updated.length,
  });
}
