import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type EvalScores = {
  fisico: number;
  tecnico: number;
  tatico: number;
  atitude: number;
  evolucao: number;
};

export type EvalFeedbackResult = {
  message: string;
  tone: "motivacional" | "técnico" | "encorajador" | "reconhecimento";
  highlights: string[];
  focusArea: string;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function verifyStaff(jwt: string): Promise<boolean> {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error } = await sb.auth.getUser(jwt);
  if (error || !user) return false;
  const { data: row } = await sb.from("staff_access").select("role")
    .eq("email", user.email).eq("is_active", true).maybeSingle();
  return !!(row && ["admin", "coach"].includes((row as { role: string }).role));
}

// ─── Score helpers ────────────────────────────────────────────────────────────

const PILLAR_LABELS: Record<string, string> = {
  fisico: "Físico",
  tecnico: "Técnico",
  tatico: "Tático",
  atitude: "Atitude",
  evolucao: "Evolução",
};

function scoreLabel(s: number): string {
  if (s >= 9) return "excepcional";
  if (s >= 8) return "muito bom";
  if (s >= 6) return "bom";
  if (s >= 4) return "regular";
  return "precisa evoluir";
}

function buildTone(scores: EvalScores): "motivacional" | "técnico" | "encorajador" | "reconhecimento" {
  const avg = (scores.fisico + scores.tecnico + scores.tatico + scores.atitude + scores.evolucao) / 5;
  if (avg >= 8) return "reconhecimento";
  if (scores.evolucao >= 8) return "motivacional";
  if (avg < 5.5) return "encorajador";
  return "técnico";
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function buildFallback(studentName: string, scores: EvalScores): EvalFeedbackResult {
  const avg = (scores.fisico + scores.tecnico + scores.tatico + scores.atitude + scores.evolucao) / 5;
  const firstName = studentName.split(" ")[0];
  const highs = Object.entries(scores).filter(([, v]) => v >= 8).map(([k]) => PILLAR_LABELS[k]);
  const lows = Object.entries(scores).filter(([, v]) => v < 6).map(([k]) => PILLAR_LABELS[k]);

  let message = `${firstName}, você fez uma aula ${scoreLabel(avg)} hoje! `;
  if (highs.length > 0) message += `Seu ponto forte foi ${highs[0]}. `;
  if (lows.length > 0) message += `Vamos focar mais em ${lows[0]} nas próximas sessões. `;
  message += "Continue evoluindo! 🏐";

  return {
    message,
    tone: buildTone(scores),
    highlights: highs.slice(0, 2),
    focusArea: lows[0] ?? "consistência",
  };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<EvalFeedbackResult | { error: string }>> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isStaff = await verifyStaff(authHeader.slice(7));
  if (!isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    studentName: string;
    scores: EvalScores;
    generalNote?: string;
    lessonTitle?: string;
  } = { studentName: "Atleta", scores: { fisico: 7, tecnico: 7, tatico: 7, atitude: 7, evolucao: 7 } };

  try { body = await req.json(); } catch { /* no body */ }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(buildFallback(body.studentName, body.scores));
  }

  const { scores, studentName, generalNote, lessonTitle } = body;
  const firstName = studentName.split(" ")[0];
  const avg = ((scores.fisico + scores.tecnico + scores.tatico + scores.atitude + scores.evolucao) / 5).toFixed(1);

  const pillars = Object.entries(scores)
    .map(([k, v]) => `${PILLAR_LABELS[k]}: ${v}/10 (${scoreLabel(v)})`)
    .join(", ");

  const highs = Object.entries(scores).filter(([, v]) => v >= 8).map(([k]) => PILLAR_LABELS[k]);
  const lows = Object.entries(scores).filter(([, v]) => v < 6).map(([k]) => PILLAR_LABELS[k]);

  const prompt = `Você é o coach do Will Treinos PRO escrevendo um feedback pessoal para o atleta "${firstName}" após uma avaliação de vôlei.

AVALIAÇÃO DA SESSÃO ${lessonTitle ? `"${lessonTitle}"` : "de hoje"}:
- Nota média: ${avg}/10
- Detalhamento: ${pillars}
- Pontos fortes (nota ≥ 8): ${highs.join(", ") || "nenhum destacado"}
- Pontos de melhoria (nota < 6): ${lows.join(", ") || "nenhum crítico"}
${generalNote ? `- Observação do coach: ${generalNote}` : ""}

Escreva um feedback direto e personalizado para ${firstName}. Responda APENAS com JSON válido:
{
  "message": "mensagem de feedback completa para o atleta (2-3 frases, tom pessoal, menciona nome, específica aos pontos da avaliação, termina com emoji motivacional) ≤200 chars",
  "tone": "motivacional|técnico|encorajador|reconhecimento",
  "highlights": ["ponto forte 1", "ponto forte 2"],
  "focusArea": "principal área para desenvolver"
}

REGRAS:
- Use o nome "${firstName}" no início
- Seja específico ao que foi avaliado (não genérico)
- Tom positivo mas honesto — se nota baixa, encoraje sem mentir
- tone: reconhecimento se média ≥ 8, motivacional se evolucao ≥ 8, encorajador se média < 6, técnico nos outros casos
- message deve ser curta, impactante, no espírito de um coach parceiro
- Termine com emoji de vôlei ou de fogo (🏐🔥⚡🎯)`;

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
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) return NextResponse.json(buildFallback(studentName, scores));
    const ai = await resp.json();
    const text: string = ai?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json(buildFallback(studentName, scores));
    return NextResponse.json(JSON.parse(match[0]) as EvalFeedbackResult);
  } catch {
    return NextResponse.json(buildFallback(studentName, scores));
  }
}
