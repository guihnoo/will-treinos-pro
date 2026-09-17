import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyQrCheckinToken, isQrCheckinFailure } from "@/lib/qrCheckinToken";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type CheckInState =
  | "success"
  | "already_checked_in"
  | "expired"
  | "invalid_qr"
  | "not_enrolled"
  | "cancelled"
  | "needs_login"
  | "generic_error";

function respond(state: CheckInState, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ state, ...extra }, { status });
}

// POST — consome um token de check-in assinado pelo servidor e registra
// presença. O client só envia o token; studentId/points/createdBy nunca
// vêm do client — tudo é resolvido/decidido aqui.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "").trim() ?? "";
  if (!jwt) return respond("needs_login", 401);

  // auth.getUser() valida o JWT contra o Supabase Auth — nunca confiar em
  // getSession() (client-side, não verificado) como fronteira de segurança.
  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error: authErr } = await anon.auth.getUser(jwt);
  if (authErr || !user) return respond("needs_login", 401);

  const body = await req.json().catch(() => ({})) as { token?: string };
  const token = body.token;
  if (!token) return respond("invalid_qr", 400);

  const secret = process.env.QR_CHECKIN_SECRET;
  if (!secret) {
    console.error("[checkin] QR_CHECKIN_SECRET ausente — check-in via QR desabilitado até configuração.");
    return respond("generic_error", 503, {
      message: "Check-in por QR code está temporariamente indisponível. Fale com o suporte.",
    });
  }

  const verified = verifyQrCheckinToken(token, secret);
  if (isQrCheckinFailure(verified)) {
    if (verified.reason === "expired") return respond("expired", 400);
    // malformed / bad_signature / not_yet_valid / unsupported_version —
    // todos tratados como QR inválido para o usuário final, sem detalhar
    // o motivo exato (não ajuda o aluno e pode ajudar quem tenta forjar).
    return respond("invalid_qr", 400);
  }
  const lessonId = verified.lessonId;

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  // Resolve o aluno a partir do JWT verificado — o client nunca escolhe studentId.
  // Dois identificadores distintos coexistem aqui — não misturar:
  //   - student.id     (CRM, students.id)         → presença (enrolled_students/
  //                                                   present_students/RPC)
  //   - user.id         (auth.users.id)             → xp_log.student_id, que é FK
  //                                                   para students(auth_user_id),
  //                                                   não para students.id
  //                                                   (ver supabase/migrations/
  //                                                   20260505150000_xp_log.sql)
  const { data: student } = await sb
    .from("students")
    .select("id, status")
    .eq("auth_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!student) {
    return respond("generic_error", 403, { message: "Perfil de aluno ativo não encontrado." });
  }

  type RegisterCheckinResult = {
    lesson_found: boolean;
    lesson_status: string | null;
    is_enrolled: boolean;
    already_present: boolean;
  };

  // PRESENÇA usa o CRM id (student.id) — é o formato armazenado em
  // lessons.enrolled_students/present_students.
  const { data: rpcResult, error: rpcError } = await sb
    .rpc("register_lesson_checkin", { p_lesson_id: lessonId, p_student_id: student.id })
    .maybeSingle<RegisterCheckinResult>();

  if (rpcError) {
    console.error("[checkin] register_lesson_checkin falhou:", rpcError.message);
    return respond("generic_error", 500, { message: "Erro ao registrar presença. Tente novamente." });
  }
  if (!rpcResult || !rpcResult.lesson_found) {
    return respond("invalid_qr", 404);
  }
  if (rpcResult.lesson_status === "cancelled") {
    return respond("cancelled", 409);
  }
  if (!rpcResult.is_enrolled) {
    return respond("not_enrolled", 403);
  }
  if (rpcResult.already_present) {
    return respond("already_checked_in", 200);
  }

  // XP de check-in: valor fixo decidido pelo servidor (mesma regra hoje
  // usada por FIXED_XP_VALUES.checkin em src/lib/xpEventLogger.ts — 50 XP).
  //
  // XP é BEST-EFFORT nesta PR, deliberadamente — a presença (linha crítica
  // de segurança/negócio: "o aluno esteve na aula") já foi confirmada pela
  // RPC acima antes de chegarmos aqui, e não deve ser desfeita nem
  // bloqueada por causa de uma falha no log de XP:
  //   - se este insert falhar, a presença registrada continua válida e a
  //     resposta ainda é "success" (com xpEarned: 0, ver abaixo);
  //   - um retry do mesmo check-in (mesmo token, ainda dentro do TTL) cai
  //     no ramo `already_present` da RPC acima e retorna
  //     "already_checked_in" SEM tentar inserir XP de novo — ou seja, não
  //     há um mecanismo automático de "tentar de novo só o XP que falhou"
  //     nesta PR, e o aluno pode legitimamente ficar com presença
  //     registrada mas sem o XP daquela aula se o insert falhar uma vez;
  //   - uma estratégia de reconciliação (detectar/reprocessar check-ins
  //     com presença confirmada mas sem xp_log correspondente) fica para
  //     a Sprint 2A.2 — XP Integration Hardening, junto do achado mais
  //     amplo de policies conflitantes em xp_log. Não implementada aqui
  //     para não expandir o escopo desta PR de segurança.
  //
  // xp_log.student_id É FK para students(auth_user_id), NÃO para
  // students.id (ver supabase/migrations/20260505150000_xp_log.sql) — por
  // isso usa user.id (já validado por auth.getUser() acima), não
  // student.id. Usar student.id aqui violaria a FK / gravaria sob o
  // identificador errado.
  const CHECKIN_XP_POINTS = 50;
  const { error: xpError } = await sb.from("xp_log").insert({
    student_id: user.id,
    points: CHECKIN_XP_POINTS,
    base_points: CHECKIN_XP_POINTS,
    multiplier_type: "none",
    multiplier_value: 1.0,
    type: "checkin",
    source_entity: "lesson",
    related_id: lessonId,
    description: "Check-in via QR (assinado, servidor)",
    validation_passed: true,
    created_by: "qr_checkin_secure",
  });
  if (xpError) {
    console.error("[checkin] Falha ao registrar XP de check-in (presença já confirmada):", xpError.message);
  }

  return respond("success", 200, { xpEarned: xpError ? 0 : CHECKIN_XP_POINTS });
}
