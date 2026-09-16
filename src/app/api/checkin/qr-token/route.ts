import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { signQrCheckinToken } from "@/lib/qrCheckinToken";
import { publicAppPath } from "@/lib/appUrl";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mesmo critério de wt_is_staff() — ver src/app/api/student/submit-rating/route.ts
// (Sprint 0A). Duplicado aqui por convenção já estabelecida no projeto de
// checagem de staff inline por rota (ver docs/WILL_CURRENT_SYSTEM_MAP_2026_09.md,
// Seção 16, item de dívida técnica sobre ausência de helper compartilhado —
// fora do escopo desta sprint).
const STAFF_APP_METADATA_ROLES = ["admin", "will_owner", "owner", "coach", "professor", "teacher"];

type StaffCheck = { authenticated: boolean; staff: boolean };

async function verifyStaff(jwt: string): Promise<StaffCheck> {
  if (!jwt) return { authenticated: false, staff: false };

  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error } = await anon.auth.getUser(jwt);
  if (error || !user) return { authenticated: false, staff: false };

  const appMetadataRole = (user.app_metadata?.role ?? "").toString().toLowerCase().trim();
  if (STAFF_APP_METADATA_ROLES.includes(appMetadataRole)) {
    return { authenticated: true, staff: true };
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const normalizedEmail = (user.email ?? "").toLowerCase().trim();

  const { data: staffRow } = await sb
    .from("staff_access")
    .select("role, is_active")
    .eq("email", normalizedEmail)
    .maybeSingle();

  const staffRoleOk =
    staffRow?.is_active !== false &&
    ["admin", "coach"].includes((staffRow?.role ?? "").toLowerCase().trim());

  return { authenticated: true, staff: Boolean(staffRoleOk) };
}

// POST — staff gera um token assinado de check-in para uma aula.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "").trim() ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { authenticated, staff } = await verifyStaff(jwt);
  if (!authenticated) return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  if (!staff) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const secret = process.env.QR_CHECKIN_SECRET;
  if (!secret) {
    console.error("[checkin/qr-token] QR_CHECKIN_SECRET ausente — check-in via QR desabilitado até configuração.");
    return NextResponse.json(
      { error: "Check-in por QR code está temporariamente indisponível. Fale com o suporte." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({})) as { lessonId?: string };
  const lessonId = body.lessonId;
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId é obrigatório" }, { status: 400 });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: lesson, error: lessonError } = await sb
    .from("lessons")
    .select("id, status")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Aula não encontrada" }, { status: 404 });
  }
  if (lesson.status === "cancelled") {
    return NextResponse.json({ error: "Não é possível gerar QR para uma aula cancelada" }, { status: 409 });
  }

  const token = signQrCheckinToken(lessonId, secret);
  const checkInUrl = publicAppPath(`/checkin/${encodeURIComponent(lessonId)}?token=${encodeURIComponent(token)}`);

  return NextResponse.json({ token, checkInUrl, ttlSeconds: 300 });
}

// GET — staff consulta a contagem atual de presentes de uma aula (para o
// contador ao vivo do modal de QR). Fonte de verdade: lessons.present_students
// (não depende de nenhuma tabela auxiliar).
export async function GET(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "").trim() ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { authenticated, staff } = await verifyStaff(jwt);
  if (!authenticated) return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  if (!staff) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const url = new URL(req.url);
  const lessonId = url.searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "lessonId é obrigatório" }, { status: 400 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: lesson } = await sb
    .from("lessons")
    .select("present_students, enrolled_students")
    .eq("id", lessonId)
    .maybeSingle();

  const present = Array.isArray(lesson?.present_students) ? lesson.present_students.length : 0;
  const enrolled = Array.isArray(lesson?.enrolled_students) ? lesson.enrolled_students.length : 0;

  return NextResponse.json({ count: present, enrolled });
}
