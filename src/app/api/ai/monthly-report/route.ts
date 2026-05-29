import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ─── Types ────────────────────────────────────────────────────────────────────

export type TopPerformer = {
  name: string;
  xp: number;
  tier: string;
};

export type MonthlyReportData = {
  period: string;           // "Maio 2026"
  revenue: {
    thisMonth: number;
    lastMonth: number;
    changePercent: number;
    collectionRate: number; // % of expected that was paid
  };
  students: {
    active: number;
    newThisMonth: number;
    pendingApproval: number;
  };
  attendance: {
    totalCheckins: number;
    avgPerActiveStudent: number;
  };
  performance: {
    avgScoreThisMonth: number | null;
    avgScoreLastMonth: number | null;
    evalCount: number;
  };
  topPerformers: TopPerformer[];
  aiHighlights: string[];
  aiStrategicComment: string;
  nextMonthFocus: string;
  generatedAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthRange(offset = 0): { start: string; end: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset; // offset: 0 = current, -1 = last
  const d = new Date(year, month, 1);
  const start = d.toISOString().slice(0, 7) + "-01";
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return { start, end, label: label.charAt(0).toUpperCase() + label.slice(1) };
}

const TIER_THRESHOLDS = [
  { name: "elite", min: 10000 },
  { name: "diamante", min: 6000 },
  { name: "ouro", min: 3000 },
  { name: "prata", min: 1500 },
  { name: "bronze", min: 500 },
];

function getTierName(xp: number): string {
  return TIER_THRESHOLDS.find((t) => xp >= t.min)?.name ?? "sem tier";
}

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

// ─── Data fetch ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchReportData(sb: any): Promise<MonthlyReportData> {
  const current = getMonthRange(0);
  const previous = getMonthRange(-1);
  const currentRef = current.start.slice(0, 7); // YYYY-MM
  const prevRef = previous.start.slice(0, 7);

  const [studentsRes, paymentsRes, xpRes, evalsRes] = await Promise.all([
    sb.from("students").select("id, name, status, created_at"),
    sb.from("payments").select("amount, status, reference, student_id"),
    sb.from("xp_log").select("student_id, points, type, created_at")
      .eq("validation_passed", true)
      .gte("created_at", previous.start + "T00:00:00Z"),
    sb.from("evaluations").select("avg_score, created_at")
      .gte("created_at", previous.start + "T00:00:00Z"),
  ]);

  type Student = { id: string; name: string; status: string; created_at: string };
  type Payment = { amount: number; status: string; reference: string; student_id: string };
  type XpLog = { student_id: string; points: number; type: string; created_at: string };
  type Eval = { avg_score: number; created_at: string };

  const students = (studentsRes.data ?? []) as Student[];
  const payments = (paymentsRes.data ?? []) as Payment[];
  const xpLogs = (xpRes.data ?? []) as XpLog[];
  const evals = (evalsRes.data ?? []) as Eval[];

  // Students
  const activeStudents = students.filter((s) => s.status === "active");
  const newThisMonth = students.filter((s) =>
    s.created_at >= current.start && s.status !== "pending"
  ).length;
  const pendingApproval = students.filter((s) => s.status === "pending" || s.status === "trial").length;

  // Revenue
  const thisMonthPaid = payments
    .filter((p) => p.status === "paid" && p.reference === currentRef)
    .reduce((s, p) => s + p.amount, 0);
  const lastMonthPaid = payments
    .filter((p) => p.status === "paid" && p.reference === prevRef)
    .reduce((s, p) => s + p.amount, 0);

  const expectedThisMonth = activeStudents.length * 200; // rough estimate
  const collectionRate = expectedThisMonth > 0
    ? Math.round((thisMonthPaid / expectedThisMonth) * 100)
    : 0;
  const changePercent = lastMonthPaid > 0
    ? Math.round(((thisMonthPaid - lastMonthPaid) / lastMonthPaid) * 100)
    : 0;

  // Attendance
  const thisMonthLogs = xpLogs.filter((l) => l.created_at >= current.start);
  const checkins = thisMonthLogs.filter((l) => l.type === "checkin").length;
  const avgCheckins = activeStudents.length > 0
    ? Math.round(checkins / activeStudents.length * 10) / 10
    : 0;

  // Performance
  const thisMonthEvals = evals.filter((e) => e.created_at >= current.start);
  const lastMonthEvals = evals.filter((e) => e.created_at < current.start);
  const avgThisMonth = thisMonthEvals.length > 0
    ? Math.round(thisMonthEvals.reduce((s, e) => s + e.avg_score, 0) / thisMonthEvals.length * 10) / 10
    : null;
  const avgLastMonth = lastMonthEvals.length > 0
    ? Math.round(lastMonthEvals.reduce((s, e) => s + e.avg_score, 0) / lastMonthEvals.length * 10) / 10
    : null;

  // Top performers by XP this month
  const xpByStudent = new Map<string, number>();
  for (const log of thisMonthLogs) {
    xpByStudent.set(log.student_id, (xpByStudent.get(log.student_id) ?? 0) + log.points);
  }
  const nameMap = new Map(students.map((s) => [s.id, s.name]));

  // Total XP for tier
  const totalXPByStudent = new Map<string, number>();
  for (const log of xpLogs) {
    totalXPByStudent.set(log.student_id, (totalXPByStudent.get(log.student_id) ?? 0) + log.points);
  }

  const topPerformers: TopPerformer[] = [...xpByStudent.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, xp]) => ({
      name: nameMap.get(id) ?? "Atleta",
      xp,
      tier: getTierName(totalXPByStudent.get(id) ?? 0),
    }));

  // AI section
  const aiData = {
    activeStudents: activeStudents.length,
    newStudents: newThisMonth,
    revenue: thisMonthPaid,
    lastRevenue: lastMonthPaid,
    changePercent,
    checkins,
    avgScore: avgThisMonth,
    evalCount: thisMonthEvals.length,
    topPerformers,
    pendingApproval,
  };

  const { highlights, strategicComment, nextMonthFocus } = await buildAISection(aiData, current.label);

  return {
    period: current.label,
    revenue: { thisMonth: thisMonthPaid, lastMonth: lastMonthPaid, changePercent, collectionRate },
    students: { active: activeStudents.length, newThisMonth, pendingApproval },
    attendance: { totalCheckins: checkins, avgPerActiveStudent: avgCheckins },
    performance: { avgScoreThisMonth: avgThisMonth, avgScoreLastMonth: avgLastMonth, evalCount: thisMonthEvals.length },
    topPerformers,
    aiHighlights: highlights,
    aiStrategicComment: strategicComment,
    nextMonthFocus,
    generatedAt: new Date().toISOString(),
  };
}

// ─── AI section ───────────────────────────────────────────────────────────────

async function buildAISection(data: Record<string, unknown>, period: string): Promise<{
  highlights: string[];
  strategicComment: string;
  nextMonthFocus: string;
}> {
  const fallback = {
    highlights: [
      "Acompanhe a tendência de receita para identificar oportunidades de crescimento.",
      "Mantenha o engajamento dos alunos com check-ins e avaliações regulares.",
    ],
    strategicComment: "Configure ANTHROPIC_API_KEY para análise estratégica personalizada.",
    nextMonthFocus: "Revisar retenção de alunos e pipeline de novos cadastros.",
  };

  if (!ANTHROPIC_API_KEY) return fallback;

  const topStr = (data.topPerformers as { name: string; xp: number; tier: string }[])
    .map((t, i) => `${i + 1}°: ${t.name} (${t.xp} XP, ${t.tier})`)
    .join(", ");

  const prompt = `Você é o estrategista de negócios do Will Treinos PRO, academia premium de vôlei no Brasil.

RELATÓRIO MENSAL — ${period}:
- Alunos ativos: ${data.activeStudents}
- Novos este mês: ${data.newStudents}
- Aguardando aprovação: ${data.pendingApproval}
- Receita do mês: R$${(data.revenue as number).toLocaleString("pt-BR")}
- Receita mês anterior: R$${(data.lastRevenue as number).toLocaleString("pt-BR")}
- Variação: ${data.changePercent}%
- Check-ins realizados: ${data.checkins}
- Avaliações feitas: ${data.evalCount}
- Nota média das avaliações: ${data.avgScore ?? "sem dados"}
- Top atletas do mês: ${topStr || "sem dados XP"}

Gere análise estratégica. Responda APENAS com JSON válido:
{
  "highlights": ["destaque 1 (≤100 chars)", "destaque 2 (≤100 chars)", "destaque 3 (≤100 chars)"],
  "strategicComment": "parágrafo estratégico curto sobre a saúde geral do negócio este mês (≤200 chars)",
  "nextMonthFocus": "principal prioridade estratégica para o próximo mês (≤100 chars)"
}

REGRAS:
- Seja direto, específico e acionável
- Mencione números reais do relatório
- Tom de parceiro estratégico, não de relatório genérico
- Se receita cresceu: celebre e sugira como manter
- Se receita caiu: identifique causa e ação concreta`;

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
    return JSON.parse(match[0]) as { highlights: string[]; strategicComment: string; nextMonthFocus: string };
  } catch {
    return fallback;
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<MonthlyReportData | { error: string }>> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = await verifyStaff(authHeader.slice(7));
  if (!sb) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const data = await fetchReportData(sb);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
