import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ─── Types ────────────────────────────────────────────────────────────────────

type AthleteProfile = {
  type: "Guerreiro" | "Em Ascensão" | "Em Platô" | "Em Risco" | "Promessa";
  burnoutRisk: "baixo" | "médio" | "alto";
  motivationalNote: string;
  focusPriorities: string[];
  insight: string;
  nextTierETA: string | null;
};

export type AthleteTwinResult = {
  totalXP: number;
  fundamentals: Record<string, number>;
  recentXP7d: number;
  recentXP30d: number;
  tierUnlocks: { tier: string; unlockedAt: string }[];
  lastActivityDaysAgo: number | null;
  evaluationCount: number;
  checkinCount: number;
  profile: AthleteProfile;
};

const TIER_ORDER = ["bronze", "prata", "ouro", "diamante", "elite"];
const TIER_THRESHOLDS: Record<string, number> = {
  bronze: 500, prata: 1500, ouro: 3000, diamante: 6000, elite: 10000,
};
const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze 🥉", prata: "Prata 🥈", ouro: "Ouro 🥇", diamante: "Diamante 💎", elite: "Elite 👑",
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

// Returns { sb, studentId, forStudent } or null if unauthorized
async function verifyAndResolve(jwt: string, requestedStudentId: string): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any;
  studentId: string;
  forStudent: boolean;
} | null> {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error } = await sb.auth.getUser(jwt);
  if (error || !user) return null;

  // Staff: access any student
  const { data: staffRow } = await sb.from("staff_access").select("role")
    .eq("email", user.email).eq("is_active", true).maybeSingle();
  if (staffRow && ["admin", "coach"].includes((staffRow as { role: string }).role)) {
    return { sb, studentId: requestedStudentId, forStudent: false };
  }

  // Student: can only view their own twin
  const { data: studentRow } = await sb.from("students").select("id")
    .eq("auth_user_id", user.id).maybeSingle();
  if (studentRow && (studentRow as { id: string }).id === requestedStudentId) {
    return { sb, studentId: requestedStudentId, forStudent: true };
  }

  return null;
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function fetchAthleteData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
  studentId: string,
  studentName: string,
  forStudent = false
) {
  const now = Date.now();
  const d7 = new Date(now - 7 * 86400000).toISOString();
  const d30 = new Date(now - 30 * 86400000).toISOString();

  const { data: logs } = await sb
    .from("xp_log")
    .select("points, multiplier_type, type, created_at, validation_passed")
    .eq("student_id", studentId)
    .eq("validation_passed", true)
    .order("created_at", { ascending: false });

  const allLogs: { points: number; multiplier_type: string; type: string; created_at: string }[] =
    logs ?? [];

  // Fundamentals breakdown
  const fundamentals: Record<string, number> = {};
  for (const log of allLogs) {
    const f = log.multiplier_type;
    if (f && f !== "none") fundamentals[f] = (fundamentals[f] ?? 0) + log.points;
  }

  const totalXP = allLogs.reduce((s, l) => s + l.points, 0);
  const recentXP7d = allLogs.filter((l) => l.created_at >= d7).reduce((s, l) => s + l.points, 0);
  const recentXP30d = allLogs.filter((l) => l.created_at >= d30).reduce((s, l) => s + l.points, 0);

  const evaluationCount = allLogs.filter((l) => l.type === "evaluation").length;
  const checkinCount = allLogs.filter((l) => l.type === "checkin").length;

  // Last activity
  const lastActivityDaysAgo = allLogs.length > 0
    ? Math.floor((now - new Date(allLogs[0].created_at).getTime()) / 86400000)
    : null;

  // Tier unlock simulation: walk through cumulative XP chronologically
  const chronological = [...allLogs].reverse();
  let cumXP = 0;
  const tierUnlocks: { tier: string; unlockedAt: string }[] = [];
  const unlockedSet = new Set<string>();

  for (const log of chronological) {
    cumXP += log.points;
    for (const tier of TIER_ORDER) {
      if (!unlockedSet.has(tier) && cumXP >= TIER_THRESHOLDS[tier]) {
        unlockedSet.add(tier);
        tierUnlocks.push({ tier: TIER_LABELS[tier], unlockedAt: log.created_at });
      }
    }
  }

  // Next tier ETA
  let nextTierETA: string | null = null;
  for (const tier of TIER_ORDER) {
    if (!unlockedSet.has(tier)) {
      const xpNeeded = TIER_THRESHOLDS[tier] - totalXP;
      if (xpNeeded > 0 && recentXP30d > 0) {
        const daysPerXP = 30 / recentXP30d;
        const daysNeeded = Math.round(xpNeeded * daysPerXP);
        nextTierETA = daysNeeded <= 0 ? "quase lá" : `~${daysNeeded} dias`;
      }
      break;
    }
  }

  // AI profile
  const profile = await buildAIProfile(
    studentName, totalXP, fundamentals, recentXP7d, recentXP30d,
    lastActivityDaysAgo, evaluationCount, checkinCount, tierUnlocks.length, nextTierETA,
    forStudent
  );

  return {
    totalXP,
    fundamentals,
    recentXP7d,
    recentXP30d,
    tierUnlocks,
    lastActivityDaysAgo,
    evaluationCount,
    checkinCount,
    profile,
  };
}

// ─── AI profile builder ───────────────────────────────────────────────────────

async function buildAIProfile(
  name: string,
  totalXP: number,
  fundamentals: Record<string, number>,
  xp7d: number,
  xp30d: number,
  lastActivity: number | null,
  evalCount: number,
  checkinCount: number,
  tiersUnlocked: number,
  nextETA: string | null,
  forStudent = false
): Promise<AthleteProfile> {
  const fallback = buildFallbackProfile(totalXP, lastActivity, xp7d);

  if (!ANTHROPIC_API_KEY) return fallback;

  const sortedFunds = Object.entries(fundamentals)
    .sort((a, b) => b[1] - a[1])
    .map(([f, xp]) => `${f}: ${xp} XP`).join(", ");

  const audience = forStudent
    ? `Você é o coach digital pessoal do atleta "${name}" no Will Treinos PRO.
O atleta está lendo isso diretamente — escreva na segunda pessoa, de forma motivacional e direta.
O campo "motivationalNote" deve ser uma mensagem PARA o atleta (ex: "Você é um Guerreiro..."), não para o coach.
O campo "insight" deve ser uma dica de evolução para o próprio atleta, não uma instrução ao coach.`
    : `Você é o psicólogo esportivo do Will Treinos PRO, especialista em perfis de atletas de vôlei.
O campo "motivationalNote" deve ser uma nota para o coach sobre como trabalhar com este atleta.
O campo "insight" é a coisa mais importante que o coach precisa saber ou fazer agora.`;

  const prompt = `${audience}

DADOS DO ATLETA "${name}":
- XP total acumulado: ${totalXP}
- XP últimos 7 dias: ${xp7d}
- XP últimos 30 dias: ${xp30d}
- Último treino: ${lastActivity !== null ? `${lastActivity} dias atrás` : "sem histórico"}
- Avaliações recebidas: ${evalCount}
- Check-ins realizados: ${checkinCount}
- Fundamentos (XP por área): ${sortedFunds || "sem dados ainda"}
- Tiers desbloqueados: ${tiersUnlocked}/5
- Previsão próximo tier: ${nextETA ?? "não calculável"}

Analise o perfil completo e classifique este atleta. Responda APENAS com JSON válido:
{
  "type": "Guerreiro|Em Ascensão|Em Platô|Em Risco|Promessa",
  "burnoutRisk": "baixo|médio|alto",
  "motivationalNote": "nota personalizada para o coach sobre como trabalhar com este atleta (≤140 chars, tom de parceiro estratégico)",
  "focusPriorities": ["fundamental1", "fundamental2"],
  "insight": "a coisa mais importante que o coach precisa saber ou fazer agora (≤120 chars)",
  "nextTierETA": "${nextETA ?? null}"
}

TIPOS:
- Guerreiro: alta consistência, XP crescente, poucos dias de ausência
- Em Ascensão: evolução recente clara, curva ascendente
- Em Platô: XP estável mas sem crescimento, pode precisar de desafio
- Em Risco: inatividade, queda de XP ou abandono iminente
- Promessa: pouco XP total mas com padrão de crescimento promissor`;

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
    if (!resp.ok) return fallback;
    const ai = await resp.json();
    const text: string = ai?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallback;
    return JSON.parse(match[0]) as AthleteProfile;
  } catch {
    return fallback;
  }
}

function buildFallbackProfile(totalXP: number, lastActivity: number | null, xp7d: number): AthleteProfile {
  const isInactive = lastActivity !== null && lastActivity > 14;
  const isActive = xp7d > 200;

  return {
    type: isInactive ? "Em Risco" : isActive ? "Em Ascensão" : totalXP > 3000 ? "Guerreiro" : "Promessa",
    burnoutRisk: "baixo",
    motivationalNote: "Continue treinando com consistência — cada aula é um passo a mais na sua evolução.",
    focusPriorities: ["saque", "defesa"],
    insight: "Acompanhe a frequência e as avaliações para ter insights detalhados.",
    nextTierETA: null,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { studentId: string; studentName?: string } = { studentId: "" };
  try { body = await req.json(); } catch { /* no body */ }

  if (!body.studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }

  const resolved = await verifyAndResolve(authHeader.slice(7), body.studentId);
  if (!resolved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const data = await fetchAthleteData(
      resolved.sb, resolved.studentId, body.studentName ?? "Atleta", resolved.forStudent
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
