import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ─── Types ────────────────────────────────────────────────────────────────────

type CopilotMode = "training" | "alerts" | "lineup";

type TrainingExercise = {
  name: string;
  focus: string;
  description: string;
  sets: string;
  reps: string;
  tip?: string;
};

type TrainingPlanResult = {
  theme: string;
  duration: string;
  intensity: "baixa" | "média" | "alta";
  exercises: TrainingExercise[];
  notes?: string;
};

type AlertItem = {
  studentName: string;
  risk: "overtraining" | "plateau" | "dropout" | "queda_rendimento";
  severity: "warning" | "critical";
  reason: string;
  action: string;
};

type LineupGroup = {
  label: string;
  focus: string;
  studentNames: string[];
  rationale: string;
};

type CopilotResult =
  | { mode: "training"; plan: TrainingPlanResult }
  | { mode: "alerts"; alerts: AlertItem[] }
  | { mode: "lineup"; groups: LineupGroup[]; tip?: string };

type FundamentalBreakdown = {
  name: string;
  fundamentals: Record<string, number>; // fundamental → total XP
};

type StudentXpSummary = {
  name: string;
  recentXP: number;
  prevXP: number;
  lastActivity: string | null;
};

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function verifyStaffJwt(jwt: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(jwt);
  if (error || !user) return null;

  const { data: staffRow } = await supabase
    .from("staff_access")
    .select("role")
    .eq("email", user.email)
    .eq("is_active", true)
    .maybeSingle();

  if (!staffRow || !["admin", "coach"].includes(staffRow.role)) return null;
  return { user, supabase };
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchFundamentalsForStudents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  studentIds: string[]
): Promise<FundamentalBreakdown[]> {
  const { data: students } = await supabase
    .from("students")
    .select("id, name")
    .in("id", studentIds);

  const { data: xpLogs } = await supabase
    .from("xp_log")
    .select("student_id, multiplier_type, points")
    .in("student_id", studentIds)
    .eq("type", "evaluation")
    .eq("validation_passed", true)
    .gte("created_at", new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString());

  const nameMap = new Map((students ?? []).map((s: { id: string; name: string }) => [s.id, s.name]));

  const result: FundamentalBreakdown[] = studentIds.map((id) => {
    const logs = (xpLogs ?? []).filter((l: { student_id: string }) => l.student_id === id);
    const fundamentals: Record<string, number> = {};
    for (const log of logs) {
      const f = (log as { multiplier_type: string; points: number }).multiplier_type;
      if (f && f !== "none") {
        fundamentals[f] = (fundamentals[f] ?? 0) + (log as { multiplier_type: string; points: number }).points;
      }
    }
    return { name: (nameMap.get(id) ?? "Aluno") as string, fundamentals };
  });

  return result;
}

async function fetchAlertsData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<StudentXpSummary[]> {
  const { data: students } = await supabase
    .from("students")
    .select("id, name")
    .eq("status", "active");

  if (!students || students.length === 0) return [];

  const ids = (students as { id: string; name: string }[]).map((s) => s.id);
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentLogs } = await supabase
    .from("xp_log")
    .select("student_id, points, created_at")
    .in("student_id", ids)
    .eq("type", "evaluation")
    .eq("validation_passed", true)
    .gte("created_at", fourteenDaysAgo);

  const nameMap = new Map((students as { id: string; name: string }[]).map((s) => [s.id, s.name]));

  return ids.map((id) => {
    const logs = ((recentLogs ?? []) as { student_id: string; points: number; created_at: string }[]).filter((l) => l.student_id === id);
    const recent = logs.filter((l) => l.created_at >= sevenDaysAgo);
    const prev = logs.filter((l) => l.created_at < sevenDaysAgo);
    const lastActivity = logs.length > 0
      ? logs.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.created_at ?? null
      : null;

    return {
      name: nameMap.get(id) ?? "Aluno",
      recentXP: recent.reduce((s, l) => s + l.points, 0),
      prevXP: prev.reduce((s, l) => s + l.points, 0),
      lastActivity,
    };
  });
}

async function fetchLineupData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  studentIds: string[]
): Promise<{ name: string; totalXP: number }[]> {
  const { data: students } = await supabase
    .from("students")
    .select("id, name")
    .in("id", studentIds);

  const { data: xpLogs } = await supabase
    .from("xp_log")
    .select("student_id, points")
    .in("student_id", studentIds)
    .eq("validation_passed", true);

  const nameMap = new Map((students ?? []).map((s: { id: string; name: string }) => [s.id, s.name]));

  return studentIds.map((id) => {
    const total = ((xpLogs ?? []) as { student_id: string; points: number }[])
      .filter((l) => l.student_id === id)
      .reduce((s, l) => s + l.points, 0);
    return { name: (nameMap.get(id) ?? "Aluno") as string, totalXP: total };
  });
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildTrainingPrompt(fundamentals: FundamentalBreakdown[], context: string): string {
  const ALL_FUNDAMENTALS = ["ataque", "levantamento", "bloqueio", "saque", "defesa", "recepcao", "posicionamento"];

  const studentSummaries = fundamentals.map((s) => {
    const sorted = ALL_FUNDAMENTALS.map((f) => ({ f, xp: s.fundamentals[f] ?? 0 }))
      .sort((a, b) => a.xp - b.xp);
    const weak = sorted.slice(0, 2).map((x) => x.f).join(", ");
    const strong = sorted.slice(-2).map((x) => x.f).join(", ");
    return `- ${s.name}: fraco em [${weak}], forte em [${strong}]`;
  }).join("\n");

  return `Você é o Copiloto do Coach do Will Treinos PRO — gerador de planos de treino para vôlei de alta performance.

PERFIL DOS ATLETAS (últimos 60 dias de avaliações):
${studentSummaries}

CONTEXTO ADICIONAL DO COACH: ${context || "Treino geral do grupo"}

Gere um plano de treino focado nas deficiências identificadas. Responda APENAS com JSON válido:
{
  "theme": "nome do tema do treino (ex: Potência de Ataque)",
  "duration": "duração estimada (ex: 75 min)",
  "intensity": "baixa|média|alta",
  "exercises": [
    {
      "name": "nome do exercício",
      "focus": "fundamental trabalhado",
      "description": "descrição concisa do exercício (≤100 chars)",
      "sets": "ex: 3 séries",
      "reps": "ex: 8-10 repetições",
      "tip": "dica técnica opcional (≤80 chars)"
    }
  ],
  "notes": "observação geral para o coach (opcional, ≤150 chars)"
}

REGRAS:
- 4 a 6 exercícios
- Progrida do aquecimento para o pico de intensidade
- Foque nos fundamentos mais fracos do grupo
- Exercícios práticos e aplicáveis na quadra`;
}

function buildAlertsPrompt(students: StudentXpSummary[]): string {
  const now = Date.now();

  const summaries = students.map((s) => {
    const daysSince = s.lastActivity
      ? Math.floor((now - new Date(s.lastActivity).getTime()) / (24 * 60 * 60 * 1000))
      : 99;
    const trend = s.prevXP > 0
      ? ((s.recentXP - s.prevXP) / s.prevXP * 100).toFixed(0)
      : s.recentXP > 0 ? "+100" : "sem histórico";
    return `- ${s.name}: XP recente (7d)=${s.recentXP}, XP anterior (7d)=${s.prevXP}, tendência=${trend}%, último treino=${daysSince}d atrás`;
  }).join("\n");

  return `Você é o Copiloto do Coach do Will Treinos PRO — analista de saúde e performance de atletas de vôlei.

DADOS DE ATIVIDADE DOS ATLETAS (últimas 2 semanas):
${summaries}

Identifique apenas atletas com risco real. Ignore quem está dentro do normal.
Responda APENAS com JSON válido:
{
  "alerts": [
    {
      "studentName": "nome do atleta",
      "risk": "overtraining|plateau|dropout|queda_rendimento",
      "severity": "warning|critical",
      "reason": "explicação concisa do risco detectado (≤120 chars)",
      "action": "ação recomendada para o coach (≤80 chars)"
    }
  ]
}

CRITÉRIOS:
- dropout: sem atividade há 14+ dias → severity critical
- dropout: sem atividade há 7-13 dias → severity warning
- overtraining: XP recente > 3x XP anterior → severity warning
- queda_rendimento: XP recente < 40% do XP anterior (e prevXP > 0) → severity warning/critical
- plateau: XP estável mas baixo (ambos < 200 XP em 7 dias) → severity warning
- Retorne array vazio se todos estiverem bem`;
}

function buildLineupPrompt(students: { name: string; totalXP: number }[], context: string): string {
  const sorted = [...students].sort((a, b) => b.totalXP - a.totalXP);
  const list = sorted.map((s) => `- ${s.name}: ${s.totalXP} XP total`).join("\n");

  return `Você é o Copiloto do Coach do Will Treinos PRO — especialista em escalação tática de vôlei.

ATLETAS DISPONÍVEIS (ordenados por XP acumulado — proxy de nível técnico):
${list}

CONTEXTO DA AULA/TREINO: ${context || "Treino geral"}

Sugira agrupamentos táticos ideais. Responda APENAS com JSON válido:
{
  "groups": [
    {
      "label": "nome do grupo (ex: Grupo Avançado A)",
      "focus": "fundamento ou objetivo do grupo neste treino",
      "studentNames": ["Nome1", "Nome2"],
      "rationale": "justificativa da escalação (≤120 chars)"
    }
  ],
  "tip": "dica geral de dinâmica da aula (opcional, ≤150 chars)"
}

REGRAS:
- 2 a 3 grupos dependendo do número de atletas
- Equilibre nível técnico dentro de cada grupo para potencializar o desenvolvimento
- Misture níveis quando o objetivo for mentoria; separe quando for competição interna
- Máximo 5 atletas por grupo`;
}

// ─── AI caller ────────────────────────────────────────────────────────────────

async function callClaude(prompt: string): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) return null;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) return null;
  const ai = await resp.json();
  return (ai?.content?.[0]?.text as string) ?? null;
}

// ─── Fallbacks ────────────────────────────────────────────────────────────────

function trainingFallback(): TrainingPlanResult {
  return {
    theme: "Treino Básico de Fundamentos",
    duration: "60 min",
    intensity: "média",
    exercises: [
      { name: "Aquecimento com passe", focus: "recepcao", description: "Pares em passe frontal, foco em posicionamento dos braços", sets: "2 séries", reps: "5 min cada" },
      { name: "Saque flutuante", focus: "saque", description: "Saque float da linha dos 9m com variação de trajetória", sets: "3 séries", reps: "8 tentativas", tip: "Contato firme no centro da bola" },
      { name: "Ataque por zona 4", focus: "ataque", description: "Tossed ball + armada por zona 4, variando ângulo", sets: "3 séries", reps: "6 ataques", tip: "Olhar bloqueio antes de bater" },
    ],
    notes: "Configure ANTHROPIC_API_KEY para planos personalizados baseados no perfil de cada atleta.",
  };
}

function alertsFallback(): AlertItem[] {
  return [];
}

function lineupFallback(): LineupGroup[] {
  return [];
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<CopilotResult | { error: string }>> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jwt = authHeader.slice(7);
  const auth = await verifyStaffJwt(jwt);
  if (!auth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { mode: CopilotMode; studentIds?: string[]; context?: string } = { mode: "training" };
  try { body = await req.json(); } catch { /* no body */ }

  const { supabase } = auth;
  const mode = body.mode ?? "training";
  const studentIds = body.studentIds ?? [];
  const context = body.context ?? "";

  try {
    if (mode === "training") {
      if (studentIds.length === 0) {
        return NextResponse.json({ mode: "training", plan: trainingFallback() });
      }
      const fundamentals = await fetchFundamentalsForStudents(supabase, studentIds);
      const prompt = buildTrainingPrompt(fundamentals, context);
      const text = await callClaude(prompt);
      if (!text) return NextResponse.json({ mode: "training", plan: trainingFallback() });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return NextResponse.json({ mode: "training", plan: trainingFallback() });
      const plan = JSON.parse(jsonMatch[0]) as TrainingPlanResult;
      return NextResponse.json({ mode: "training", plan });
    }

    if (mode === "alerts") {
      const students = await fetchAlertsData(supabase);
      if (students.length === 0) return NextResponse.json({ mode: "alerts", alerts: [] });
      const prompt = buildAlertsPrompt(students);
      const text = await callClaude(prompt);
      if (!text) return NextResponse.json({ mode: "alerts", alerts: alertsFallback() });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return NextResponse.json({ mode: "alerts", alerts: alertsFallback() });
      const parsed = JSON.parse(jsonMatch[0]) as { alerts: AlertItem[] };
      return NextResponse.json({ mode: "alerts", alerts: parsed.alerts ?? [] });
    }

    if (mode === "lineup") {
      if (studentIds.length === 0) {
        return NextResponse.json({ mode: "lineup", groups: lineupFallback() });
      }
      const students = await fetchLineupData(supabase, studentIds);
      const prompt = buildLineupPrompt(students, context);
      const text = await callClaude(prompt);
      if (!text) return NextResponse.json({ mode: "lineup", groups: lineupFallback() });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return NextResponse.json({ mode: "lineup", groups: lineupFallback() });
      const parsed = JSON.parse(jsonMatch[0]) as { groups: LineupGroup[]; tip?: string };
      return NextResponse.json({ mode: "lineup", groups: parsed.groups ?? [], tip: parsed.tip });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch {
    if (mode === "training") return NextResponse.json({ mode: "training", plan: trainingFallback() });
    if (mode === "alerts") return NextResponse.json({ mode: "alerts", alerts: [] });
    return NextResponse.json({ mode: "lineup", groups: [] });
  }
}
