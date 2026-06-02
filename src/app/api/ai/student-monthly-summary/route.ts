/**
 * POST /api/ai/student-monthly-summary — staff JWT obrigatório
 * GET  /api/ai/student-monthly-summary?studentId=...&month=...&year=...
 *
 * Gera/retorna resumo mensal personalizado com IA para um aluno específico.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentMonthlySummaryResult {
  summary: string;
  xpGained: number;
  classesAttended: number;
  presenceRate: number;
  bestPilar: string;
  monthName: string;
  nextMonthGoal?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMonthRange(month: number, year: number): { start: string; end: string; label: string } {
  const d = new Date(year, month - 1, 1);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = endDate.toISOString().slice(0, 10);
  const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return {
    start,
    end,
    label: label.charAt(0).toUpperCase() + label.slice(1),
  };
}

function prevMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

const PILAR_NAMES: Record<string, string> = {
  fisico: "Físico",
  tecnico: "Técnico",
  tatico: "Tático",
  atitude: "Atitude",
  evolucao: "Evolução",
};

// ─── Supabase client ──────────────────────────────────────────────────────────

function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

// ─── Verify staff JWT ─────────────────────────────────────────────────────────

async function isStaff(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const sb = getServiceClient();
  const { data: { user }, error } = await sb.auth.getUser(authHeader.slice(7));
  if (error || !user) return false;
  const { data: row } = await sb
    .from("staff_access")
    .select("role")
    .eq("email", user.email)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(row && ["admin", "coach"].includes((row as { role: string }).role));
}

// ─── Core data fetch ─────────────────────────────────────────────────────────

async function buildSummary(
  studentId: string,
  month: number,
  year: number
): Promise<StudentMonthlySummaryResult> {
  const sb = getServiceClient();
  const range = getMonthRange(month, year);
  const prev = prevMonth(month, year);
  const prevRange = getMonthRange(prev.month, prev.year);

  // Fetch student name
  const { data: studentRow } = await sb
    .from("students")
    .select("name")
    .eq("auth_user_id", studentId)
    .maybeSingle();
  const studentName = (studentRow as { name?: string } | null)?.name ?? "Atleta";
  const firstName = studentName.split(" ")[0] ?? "Atleta";

  // XP this month (por tipo)
  const { data: xpLogs } = await sb
    .from("xp_log")
    .select("points, type")
    .eq("student_id", studentId)
    .gte("created_at", range.start + "T00:00:00Z")
    .lte("created_at", range.end + "T23:59:59Z");

  type XpLogRow = { points: number; type: string };
  const logs = (xpLogs ?? []) as XpLogRow[];
  const xpGained = logs.reduce((acc, l) => acc + (l.points ?? 0), 0);
  const xpBreakdown = {
    checkin: logs.filter((l) => l.type === "checkin").reduce((a, l) => a + l.points, 0),
    evaluation: logs.filter((l) => l.type === "evaluation").reduce((a, l) => a + l.points, 0),
    achievement: logs.filter((l) => l.type === "achievement_unlock").reduce((a, l) => a + l.points, 0),
  };

  // XP mês anterior (delta)
  const { data: prevXpLogs } = await sb
    .from("xp_log")
    .select("points")
    .eq("student_id", studentId)
    .gte("created_at", prevRange.start + "T00:00:00Z")
    .lte("created_at", prevRange.end + "T23:59:59Z");
  const prevXP = ((prevXpLogs ?? []) as { points: number }[]).reduce((a, l) => a + l.points, 0);
  const xpDelta = xpGained - prevXP;

  // Aulas frequentadas (check-ins aprovados)
  const { data: checkInsData } = await sb
    .from("xp_log")
    .select("id")
    .eq("student_id", studentId)
    .eq("type", "checkin")
    .gte("created_at", range.start + "T00:00:00Z")
    .lte("created_at", range.end + "T23:59:59Z");
  const classesAttended = (checkInsData ?? []).length;

  // Total aulas agendadas no mês (via lessons)
  const { data: lessonsData } = await sb
    .from("lessons")
    .select("id, enrolled_students")
    .gte("date", range.start)
    .lte("date", range.end);

  type LessonRow = { id: string; enrolled_students: string[] | null };
  const totalScheduled = ((lessonsData ?? []) as LessonRow[]).filter((l) =>
    (l.enrolled_students ?? []).includes(studentId)
  ).length;
  const presenceRate = totalScheduled > 0
    ? Math.round((classesAttended / totalScheduled) * 100)
    : classesAttended > 0 ? 100 : 0;

  // Avaliações do mês — melhor pilar
  const { data: evalsData } = await sb
    .from("evaluations")
    .select("fisico, tecnico, tatico, atitude, evolucao")
    .eq("student_id", studentId)
    .gte("created_at", range.start + "T00:00:00Z")
    .lte("created_at", range.end + "T23:59:59Z");

  type EvalRow = { fisico: number; tecnico: number; tatico: number; atitude: number; evolucao: number };
  const evals = (evalsData ?? []) as EvalRow[];
  let bestPilar = "Técnico";

  if (evals.length > 0) {
    const avg = (key: keyof EvalRow) =>
      evals.reduce((a, e) => a + (e[key] ?? 0), 0) / evals.length;
    const pillarScores: Record<string, number> = {
      fisico: avg("fisico"),
      tecnico: avg("tecnico"),
      tatico: avg("tatico"),
      atitude: avg("atitude"),
      evolucao: avg("evolucao"),
    };
    const best = Object.entries(pillarScores).sort((a, b) => b[1] - a[1])[0];
    if (best) bestPilar = PILAR_NAMES[best[0]] ?? best[0];
  }

  // ─── Gera resumo com IA ou fallback ──────────────────────────────────────
  const deltaStr = xpDelta >= 0 ? `+${xpDelta}` : `${xpDelta}`;
  let summary: string;
  let nextMonthGoal: string | undefined;

  if (ANTHROPIC_API_KEY) {
    const prompt = `Você é o assistente de alta performance do Will Treinos PRO, academia premium de vôlei.

Gere um resumo MOTIVACIONAL e PERSONALIZADO de ${range.label} para o atleta ${firstName}.

Dados do mês:
- XP ganho: ${xpGained} (${deltaStr} vs mês anterior)
- Aulas frequentadas: ${classesAttended}
- Taxa de presença: ${presenceRate}%
- Melhor pilar: ${bestPilar}
- XP por checkin: ${xpBreakdown.checkin} | por avaliação: ${xpBreakdown.evaluation} | por conquista: ${xpBreakdown.achievement}

REGRAS:
1. Máximo 120 tokens de resposta
2. Tom motivacional e pessoal (use o nome ${firstName})
3. Mencione conquista específica do mês (XP, presença ou pilar)
4. Inclua uma meta concreta para o próximo mês
5. Seja direto — NÃO use cumprimentos longos ou introduções genéricas
6. Responda APENAS com JSON: {"summary": "...", "nextMonthGoal": "..."}`;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 150,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (resp.ok) {
        const ai = await resp.json() as { content?: { text?: string }[] };
        const text = ai?.content?.[0]?.text ?? "";
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]) as { summary?: string; nextMonthGoal?: string };
          summary = parsed.summary ?? buildFallbackSummary(firstName, xpGained, classesAttended, presenceRate, bestPilar, deltaStr);
          nextMonthGoal = parsed.nextMonthGoal;
        } else {
          summary = buildFallbackSummary(firstName, xpGained, classesAttended, presenceRate, bestPilar, deltaStr);
        }
      } else {
        summary = buildFallbackSummary(firstName, xpGained, classesAttended, presenceRate, bestPilar, deltaStr);
      }
    } catch {
      summary = buildFallbackSummary(firstName, xpGained, classesAttended, presenceRate, bestPilar, deltaStr);
    }
  } else {
    summary = buildFallbackSummary(firstName, xpGained, classesAttended, presenceRate, bestPilar, deltaStr);
  }

  return {
    summary,
    xpGained,
    classesAttended,
    presenceRate,
    bestPilar,
    monthName: range.label,
    nextMonthGoal,
  };
}

function buildFallbackSummary(
  name: string,
  xp: number,
  classes: number,
  presence: number,
  bestPilar: string,
  delta: string
): string {
  const xpStr = xp.toLocaleString("pt-BR");
  const trend = delta.startsWith("+") ? "superando o mês anterior" : "mantendo o ritmo";
  return `${name}, você conquistou ${xpStr} XP em ${classes} aula${classes !== 1 ? "s" : ""} este mês — ${trend}! Presença de ${presence}% e destaque no pilar ${bestPilar}. Continue firme na quadra!`;
}

// ─── GET — retorna resumo on-demand (sem auth — aluno acessa) ────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  if (!studentId || !monthParam || !yearParam) {
    return NextResponse.json({ error: "Missing params: studentId, month, year" }, { status: 400 });
  }

  const month = parseInt(monthParam, 10);
  const year = parseInt(yearParam, 10);

  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid month/year" }, { status: 400 });
  }

  try {
    const result = await buildSummary(studentId, month, year);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch (err) {
    console.error("[student-monthly-summary GET] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// ─── POST — geração explícita (staff JWT) ────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const staffOk = await isStaff(authHeader);
  if (!staffOk) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { studentId?: string; month?: number; year?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { studentId, month, year } = body;
  if (!studentId || !month || !year) {
    return NextResponse.json({ error: "Missing fields: studentId, month, year" }, { status: 400 });
  }

  try {
    const result = await buildSummary(studentId, month, year);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[student-monthly-summary POST] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
