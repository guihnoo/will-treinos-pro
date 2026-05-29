import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ─── Types (exported for client use) ─────────────────────────────────────────

export type DailyChallenge = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  fundamental: string;
  icon: string; // emoji
  type: "training" | "social" | "checkin" | "consistency";
};

export type DailyChallengesResult = {
  coachMessage: string;
  challenges: DailyChallenge[];
  generatedAt: string;
  dateKey: string; // YYYY-MM-DD for client-side cache keying
};

// ─── Fallbacks ────────────────────────────────────────────────────────────────

function buildFallback(dateKey: string): DailyChallengesResult {
  return {
    coachMessage: "Cada treino é um passo. Hoje é o dia de dar o próximo. 🏐",
    challenges: [
      {
        id: "default-checkin",
        title: "Check-in na quadra",
        description: "Confirme sua presença na aula de hoje. Atletas consistentes evoluem mais rápido.",
        xpReward: 50,
        fundamental: "posicionamento",
        icon: "📍",
        type: "checkin",
      },
      {
        id: "default-social",
        title: "Apoiar um colega",
        description: "Curta ou comente no post de algum colega no feed. O grupo cresce junto.",
        xpReward: 25,
        fundamental: "posicionamento",
        icon: "🤝",
        type: "social",
      },
      {
        id: "default-training",
        title: "30 min de fundamentos",
        description: "Dedique ao menos 30 minutos a um fundamento que precise de atenção hoje.",
        xpReward: 75,
        fundamental: "posicionamento",
        icon: "💪",
        type: "training",
      },
    ],
    generatedAt: new Date().toISOString(),
    dateKey,
  };
}

// ─── Auth: accepts both student and staff JWT ─────────────────────────────────

async function resolveStudentId(jwt: string, requestedId: string): Promise<string | null> {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error } = await sb.auth.getUser(jwt);
  if (error || !user) return null;

  // Staff can request any student
  const { data: staffRow } = await sb.from("staff_access").select("role")
    .eq("email", user.email).eq("is_active", true).maybeSingle();
  if (staffRow) return requestedId;

  // Student can only request their own
  const { data: studentRow } = await sb.from("students").select("id")
    .eq("auth_user_id", user.id).maybeSingle();
  if (!studentRow) return null;
  if (studentRow.id !== requestedId) return null;
  return requestedId;
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function fetchWeakFundamentals(studentId: string): Promise<{
  name: string;
  weakest: string[];
  xpByFundamental: Record<string, number>;
  recentXP: number;
}> {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const [studentsRes, logsRes] = await Promise.all([
    sb.from("students").select("name").eq("id", studentId).maybeSingle(),
    sb.from("xp_log")
      .select("points, multiplier_type, type, created_at")
      .eq("student_id", studentId)
      .eq("validation_passed", true)
      .gte("created_at", new Date(Date.now() - 45 * 86400000).toISOString()),
  ]);

  const name: string = (studentsRes.data as { name: string } | null)?.name ?? "Atleta";
  const logs: { points: number; multiplier_type: string; type: string; created_at: string }[] =
    (logsRes.data as { points: number; multiplier_type: string; type: string; created_at: string }[] | null) ?? [];

  const xpByFundamental: Record<string, number> = {};
  const ALL = ["ataque", "levantamento", "bloqueio", "saque", "defesa", "recepcao", "posicionamento"];
  for (const f of ALL) xpByFundamental[f] = 0;

  for (const log of logs) {
    const f = log.multiplier_type;
    if (f && f !== "none" && ALL.includes(f)) {
      xpByFundamental[f] = (xpByFundamental[f] ?? 0) + log.points;
    }
  }

  const sorted = Object.entries(xpByFundamental).sort((a, b) => a[1] - b[1]);
  const weakest = sorted.slice(0, 3).map((x) => x[0]);

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const recentXP = logs.filter((l) => l.created_at >= sevenDaysAgo).reduce((s, l) => s + l.points, 0);

  return { name, weakest, xpByFundamental, recentXP };
}

// ─── AI generation ────────────────────────────────────────────────────────────

const FUNDAMENTAL_ICONS: Record<string, string> = {
  ataque: "⚡", levantamento: "🎯", bloqueio: "🛡️",
  saque: "🌀", defesa: "🔥", recepcao: "💎", posicionamento: "🧭",
};

async function generateChallenges(
  athleteName: string,
  weakest: string[],
  recentXP: number,
  dateKey: string
): Promise<{ coachMessage: string; challenges: DailyChallenge[] }> {
  if (!ANTHROPIC_API_KEY) {
    return {
      coachMessage: "Cada treino conta. Hoje é o dia de ser melhor do que ontem. 🏐",
      challenges: [],
    };
  }

  const dayOfWeek = new Date(dateKey).toLocaleDateString("pt-BR", { weekday: "long" });

  const prompt = `Você é o coach pessoal de IA do Will Treinos PRO para o atleta "${athleteName}".

Dados do atleta (últimos 45 dias):
- Fundamentos mais fracos (do mais fraco para o menos fraco): ${weakest.join(", ")}
- XP ganho nos últimos 7 dias: ${recentXP}
- Dia da semana: ${dayOfWeek} (${dateKey})

Gere 3 desafios diários personalizados e uma mensagem motivacional curta. Responda APENAS com JSON válido:
{
  "coachMessage": "mensagem motivacional do coach para o atleta (≤120 chars, pessoal, específico, energético)",
  "challenges": [
    {
      "id": "unique-slug",
      "title": "título curto do desafio (≤45 chars)",
      "description": "descrição clara do que fazer (≤110 chars)",
      "xpReward": 25,
      "fundamental": "nome do fundamento trabalhado",
      "icon": "emoji único",
      "type": "training|social|checkin|consistency"
    }
  ]
}

REGRAS:
1. Desafio 1: treino do fundamento mais fraco (type: training, xpReward: 75-100)
2. Desafio 2: segundo fundamento fraco ou consistência (type: training ou consistency, xpReward: 50-75)
3. Desafio 3: social ou check-in (type: social ou checkin, xpReward: 25-50)
4. Total de XP dos 3 desafios: entre 150 e 225 XP
5. Desafios devem ser concretos, realizáveis no dia e específicos para vôlei
6. A mensagem do coach deve mencionar o nome "${athleteName}" e ser motivacional mas direta
7. Para cada desafio use o icon do fundamento: ataque=⚡, levantamento=🎯, bloqueio=🛡️, saque=🌀, defesa=🔥, recepcao=💎, posicionamento=🧭, social=🤝, checkin=📍, consistência=🔗`;

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
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) return { coachMessage: "Hoje é o dia. Vamos nessa! 🏐", challenges: [] };

    const ai = await resp.json();
    const text: string = ai?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { coachMessage: "Hoje é o dia. Vamos nessa! 🏐", challenges: [] };

    const parsed = JSON.parse(match[0]) as { coachMessage: string; challenges: DailyChallenge[] };

    // Ensure icons are set
    const challenges = (parsed.challenges ?? []).map((c, i) => ({
      ...c,
      icon: c.icon || FUNDAMENTAL_ICONS[c.fundamental] || ["⚡", "🎯", "🤝"][i] || "🏐",
    }));

    return { coachMessage: parsed.coachMessage, challenges };
  } catch {
    return { coachMessage: "Hoje é o dia. Vamos nessa! 🏐", challenges: [] };
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<DailyChallengesResult | { error: string }>> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { studentId: string } = { studentId: "" };
  try { body = await req.json(); } catch { /* no body */ }

  if (!body.studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const resolvedId = await resolveStudentId(authHeader.slice(7), body.studentId);
  if (!resolvedId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dateKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    const { name, weakest, recentXP } = await fetchWeakFundamentals(resolvedId);
    const { coachMessage, challenges } = await generateChallenges(name, weakest, recentXP, dateKey);

    if (challenges.length === 0) {
      return NextResponse.json(buildFallback(dateKey));
    }

    return NextResponse.json({
      coachMessage,
      challenges: challenges.slice(0, 3),
      generatedAt: new Date().toISOString(),
      dateKey,
    });
  } catch {
    return NextResponse.json(buildFallback(dateKey));
  }
}
