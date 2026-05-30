import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type PillarKey = "fisico" | "tecnico" | "tatico" | "atitude" | "evolucao";
const PILLARS: PillarKey[] = ["fisico", "tecnico", "tatico", "atitude", "evolucao"];
const PILLAR_LABELS: Record<PillarKey, string> = {
  fisico: "Físico", tecnico: "Técnico", tatico: "Tático", atitude: "Atitude", evolucao: "Evolução",
};

interface EvalRow {
  id: string;
  student_id: string;
  lesson_title: string | null;
  scores: Record<PillarKey, number>;
  avg_score: number;
  notes: string | null;
  created_at: string;
}

export interface PillarStats {
  key: PillarKey;
  label: string;
  latest: number;
  best: number;
  avg: number;
  delta: number;     // latest - first
  trend: "up" | "down" | "stable";
  sparkline: number[]; // last 6 scores chronological
}

export interface MyEvaluationsResult {
  evaluations: EvalRow[];
  pillarStats: PillarStats[];
  overallLatest: number;
  overallBest: number;
  overallDelta: number;
  totalEvals: number;
  insight: string | null;
  insightTone: "conquista" | "progresso" | "foco" | "inicio";
  strongestPillar: PillarKey | null;
  weakestPillar: PillarKey | null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Verify student JWT and get auth.users.id
  const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(jwt);
  if (authError || !user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  // Resolve student CRM id from auth_user_id
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: student } = await serviceClient
    .from("students")
    .select("id, name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  // Fetch evaluations — RLS allows student to read own rows
  const { data: rows, error: evalError } = await serviceClient
    .from("evaluations")
    .select("id, student_id, lesson_title, scores, avg_score, notes, created_at")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (evalError) return NextResponse.json({ error: evalError.message }, { status: 500 });

  const evaluations: EvalRow[] = (rows ?? []) as EvalRow[];

  if (evaluations.length === 0) {
    return NextResponse.json({
      evaluations: [],
      pillarStats: [],
      overallLatest: 0,
      overallBest: 0,
      overallDelta: 0,
      totalEvals: 0,
      insight: null,
      insightTone: "inicio",
      strongestPillar: null,
      weakestPillar: null,
    } satisfies MyEvaluationsResult);
  }

  // Compute stats per pillar
  const chronological = [...evaluations].reverse(); // oldest → newest
  const latest = evaluations[0];
  const first = chronological[0];

  const pillarStats: PillarStats[] = PILLARS.map((key) => {
    const values = chronological.map((e) => e.scores[key] ?? 7);
    const latestVal = latest.scores[key] ?? 7;
    const firstVal = first.scores[key] ?? 7;
    const delta = latestVal - firstVal;
    const best = Math.max(...values);
    const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    const sparkline = values.slice(-6);
    const trend: "up" | "down" | "stable" = delta > 0.3 ? "up" : delta < -0.3 ? "down" : "stable";
    return { key, label: PILLAR_LABELS[key], latest: latestVal, best, avg, delta, trend, sparkline };
  });

  const overallLatest = latest.avg_score;
  const overallBest = Math.max(...evaluations.map((e) => e.avg_score));
  const overallDelta = latest.avg_score - first.avg_score;
  const sortedByLatest = [...pillarStats].sort((a, b) => b.latest - a.latest);
  const strongestPillar = sortedByLatest[0]?.key ?? null;
  const weakestPillar = sortedByLatest[sortedByLatest.length - 1]?.key ?? null;

  const insightTone: MyEvaluationsResult["insightTone"] =
    evaluations.length < 2 ? "inicio" :
    overallDelta > 0.5 ? "conquista" :
    overallDelta > 0 ? "progresso" : "foco";

  // AI insight
  let insight: string | null = null;
  if (ANTHROPIC_API_KEY && evaluations.length >= 2) {
    try {
      const pillarSummary = pillarStats
        .map((p) => `${p.label}: ${p.latest}/10 (${p.delta >= 0 ? "+" : ""}${p.delta.toFixed(1)} desde a 1ª aval.)`)
        .join(", ");

      const prompt = `Você é o coach de vôlei de ${student.name.split(" ")[0]}. Eles fizeram ${evaluations.length} avaliações. Nota geral atual: ${overallLatest.toFixed(1)}/10. Pilar mais forte: ${PILLAR_LABELS[strongestPillar!]}. Pilar mais fraco: ${PILLAR_LABELS[weakestPillar!]}. Evolução por pilar: ${pillarSummary}.

Escreva uma mensagem motivacional curta (máximo 3 frases) diretamente para o atleta usando "você". Tom: ${insightTone === "conquista" ? "celebração e reconhecimento" : insightTone === "progresso" ? "encorajamento e progresso" : "foco e motivação para melhorar"}. Seja específico com os números. NÃO use bullet points ou listas. Responda APENAS o texto da mensagem.`;

      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json() as { content: Array<{ text: string }> };
        insight = aiData.content[0]?.text?.trim() ?? null;
      }
    } catch {
      // fallback — no insight
    }
  }

  return NextResponse.json({
    evaluations,
    pillarStats,
    overallLatest,
    overallBest,
    overallDelta,
    totalEvals: evaluations.length,
    insight,
    insightTone,
    strongestPillar,
    weakestPillar,
  } satisfies MyEvaluationsResult);
}
