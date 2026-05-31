import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ─── Types ────────────────────────────────────────────────────────────────────

export type LessonRecapResult = {
  lessonTitle: string;
  date: string;
  presentCount: number;
  enrolledCount: number;
  attendanceRate: number;
  avgScore: number | null;
  evalCount: number;
  xpDistributed: number;
  highlights: string[];
  aiSummary: string;
  suggestedPost: string;
  topStudentName?: string;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function verifyStaff(jwt: string): Promise<any | null> {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error } = await sb.auth.getUser(jwt);
  if (error || !user) return null;
  const { data: row } = await sb.from("staff_access").select("role")
    .eq("email", user.email).eq("is_active", true).maybeSingle();
  if (!row || !["admin", "coach"].includes((row as { role: string }).role)) return null;
  return sb;
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function buildFallback(params: {
  lessonTitle: string; date: string; presentCount: number;
  enrolledCount: number; avgScore: number | null; xpDistributed: number;
}): LessonRecapResult {
  const rate = params.enrolledCount > 0
    ? Math.round((params.presentCount / params.enrolledCount) * 100)
    : 0;
  return {
    ...params,
    attendanceRate: rate,
    evalCount: 0,
    highlights: [
      `${params.presentCount} de ${params.enrolledCount} atletas presentes (${rate}% de presença).`,
      params.avgScore !== null ? `Nota média da aula: ${params.avgScore}/10.` : "Avaliações pendentes.",
      params.xpDistributed > 0 ? `${params.xpDistributed} XP distribuídos na sessão.` : "XP será distribuído após avaliações.",
    ],
    aiSummary: `Aula de ${params.lessonTitle} realizada com ${params.presentCount} atletas presentes. Configure ANTHROPIC_API_KEY para resumo personalizado com IA.`,
    suggestedPost: `Aula de ${params.lessonTitle} concluída! ${params.presentCount}/${params.enrolledCount} atletas presentes. 🏐`,
  };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<LessonRecapResult | { error: string }>> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = await verifyStaff(authHeader.slice(7));
  if (!sb) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    lessonId: string;
    lessonTitle: string;
    date: string;
    presentCount: number;
    enrolledCount: number;
    presentStudentNames: string[];
  } = {
    lessonId: "", lessonTitle: "Aula", date: "", presentCount: 0, enrolledCount: 0, presentStudentNames: [],
  };

  try { body = await req.json(); } catch { /* no body */ }

  // Fetch evaluations and XP from Supabase for this lesson
  const [evalsRes, xpRes] = await Promise.all([
    sb.from("evaluations").select("avg_score, student_id, scores").eq("lesson_id", body.lessonId),
    sb.from("xp_log").select("points, student_id").eq("related_id", body.lessonId).eq("validation_passed", true),
  ]);

  type EvalRow = { avg_score: number; student_id: string; scores: Record<string, number> };
  type XpRow = { points: number; student_id: string };

  const evals = (evalsRes.data ?? []) as EvalRow[];
  const xpLogs = (xpRes.data ?? []) as XpRow[];

  const avgScore = evals.length > 0
    ? Math.round(evals.reduce((s, e) => s + e.avg_score, 0) / evals.length * 10) / 10
    : null;
  const xpDistributed = xpLogs.reduce((s, l) => s + l.points, 0);
  const attendanceRate = body.enrolledCount > 0
    ? Math.round((body.presentCount / body.enrolledCount) * 100)
    : 0;

  // Best performer
  const xpByStudent = new Map<string, number>();
  for (const log of xpLogs) {
    xpByStudent.set(log.student_id, (xpByStudent.get(log.student_id) ?? 0) + log.points);
  }
  const topStudentId = [...xpByStudent.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Get top student name
  let topStudentName: string | undefined;
  if (topStudentId) {
    const { data: st } = await sb.from("students").select("name").eq("id", topStudentId).maybeSingle();
    topStudentName = (st as { name: string } | null)?.name?.split(" ")[0];
  }

  const fallbackData = {
    lessonTitle: body.lessonTitle,
    date: body.date,
    presentCount: body.presentCount,
    enrolledCount: body.enrolledCount,
    avgScore,
    xpDistributed,
  };

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ ...buildFallback(fallbackData), evalCount: evals.length, topStudentName });
  }

  // Build best/worst pillar from evals
  const PILLARS = ["fisico", "tecnico", "tatico", "atitude", "evolucao"];
  const PILLAR_LABELS: Record<string, string> = {
    fisico: "Físico", tecnico: "Técnico", tatico: "Tático", atitude: "Atitude", evolucao: "Evolução",
  };
  const pillarAvg: Record<string, number> = {};
  if (evals.length > 0) {
    for (const p of PILLARS) {
      const vals = evals.map((e) => e.scores[p] ?? 7);
      pillarAvg[p] = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10;
    }
  }
  const bestPillar = Object.entries(pillarAvg).sort((a, b) => b[1] - a[1])[0];
  const worstPillar = Object.entries(pillarAvg).sort((a, b) => a[1] - b[1])[0];

  const prompt = `Você é o coach digital do Will Treinos PRO. Gere um resumo profissional da aula de vôlei abaixo.

DADOS DA AULA:
- Título: ${body.lessonTitle}
- Data: ${body.date || "hoje"}
- Presença: ${body.presentCount}/${body.enrolledCount} atletas (${attendanceRate}%)
- Atletas presentes: ${body.presentStudentNames.join(", ") || "não informado"}
- Avaliações realizadas: ${evals.length}
- Nota média da aula: ${avgScore !== null ? `${avgScore}/10` : "sem avaliações"}
- Melhor pilar: ${bestPillar ? `${PILLAR_LABELS[bestPillar[0]]} (${bestPillar[1]})` : "sem dados"}
- Pilar mais fraco: ${worstPillar ? `${PILLAR_LABELS[worstPillar[0]]} (${worstPillar[1]})` : "sem dados"}
- XP total distribuído: ${xpDistributed}
- Destaque do dia: ${topStudentName ?? "nenhum identificado"}

Responda APENAS com JSON válido:
{
  "highlights": ["destaque 1 (≤90 chars)", "destaque 2 (≤90 chars)", "destaque 3 (≤90 chars)"],
  "aiSummary": "resumo técnico da aula (2-3 frases, menciona presença, pontos trabalhados e próximos passos) ≤200 chars",
  "suggestedPost": "texto pronto para publicar no feed (entusiasta, menciona os presentes, máx 150 chars, emoji de vôlei no final)"
}

REGRAS:
- highlights: uma linha por insight (presença, técnica, destaques)
- aiSummary: tom de coach profissional
- suggestedPost: tom motivacional, pode mencionar nomes`;

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
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) return NextResponse.json({ ...buildFallback(fallbackData), evalCount: evals.length, topStudentName });
    const ai = await resp.json();
    const text: string = ai?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ ...buildFallback(fallbackData), evalCount: evals.length, topStudentName });
    const parsed = JSON.parse(match[0]) as { highlights: string[]; aiSummary: string; suggestedPost: string };

    return NextResponse.json({
      lessonTitle: body.lessonTitle,
      date: body.date,
      presentCount: body.presentCount,
      enrolledCount: body.enrolledCount,
      attendanceRate,
      avgScore,
      evalCount: evals.length,
      xpDistributed,
      highlights: parsed.highlights ?? [],
      aiSummary: parsed.aiSummary ?? "",
      suggestedPost: parsed.suggestedPost ?? "",
      topStudentName,
    });
  } catch {
    return NextResponse.json({ ...buildFallback(fallbackData), evalCount: evals.length, topStudentName });
  }
}
