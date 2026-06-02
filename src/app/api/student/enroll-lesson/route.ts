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

  // Authenticate via JWT
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

  // Chamada atômica via RPC — evita race condition de vagas
  const { data: rpcResult, error: rpcErr } = await sb.rpc("enroll_student_in_lesson", {
    p_lesson_id: lessonId,
    p_student_id: studentId,
    p_action: action,
  });

  if (rpcErr) {
    console.error("[enroll-lesson] RPC error:", rpcErr);
    return NextResponse.json(
      { success: false, error: "Erro ao processar inscrição" },
      { status: 500 }
    );
  }

  const result = rpcResult as { success: boolean; error?: string; spotsLeft?: number };

  if (!result.success) {
    const errorMap: Record<string, { message: string; status: number }> = {
      lesson_not_found:     { message: "Aula não encontrada",                status: 404 },
      lesson_not_scheduled: { message: "Inscrições encerradas para esta aula", status: 409 },
      already_enrolled:     { message: "Já inscrito nesta aula",              status: 409 },
      lesson_full:          { message: "Aula lotada",                         status: 409 },
      invalid_action:       { message: "Ação inválida",                       status: 400 },
    };

    const mapped = result.error ? errorMap[result.error] : undefined;
    return NextResponse.json(
      { success: false, error: mapped?.message ?? result.error ?? "Erro desconhecido" },
      { status: mapped?.status ?? 500 }
    );
  }

  return NextResponse.json({
    success: true,
    spotsLeft: result.spotsLeft ?? 0,
  });
}
