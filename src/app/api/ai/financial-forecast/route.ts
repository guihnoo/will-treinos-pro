import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ─── Types ─────────────────────────────────────────────────────────────────

export type MonthData = {
  label: string;      // "Jan", "Fev", …
  revenue: number;    // actual (past) or projected (future)
  projected: boolean;
};

export type AtRiskStudent = {
  name: string;
  amount: number;
  daysLate: number;
  studentId: string;
};

export type FinancialInsight = {
  trend: "crescimento" | "estável" | "queda";
  riskLevel: "baixo" | "médio" | "alto";
  projectedRevenue3m: number;
  summary: string;
  topAction: string;
  secondaryActions: string[];
};

export type FinancialForecastResult = {
  months: MonthData[];
  atRisk: AtRiskStudent[];
  insight: FinancialInsight;
  maxPotential: number;
  currentMonthRef: string;
  generatedAt: string;
};

// ─── Auth ───────────────────────────────────────────────────────────────────

async function verifyStaff(jwt: string) {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error } = await sb.auth.getUser(jwt);
  if (error || !user) return null;
  const { data: row } = await sb.from("staff_access").select("role")
    .eq("email", user.email).eq("is_active", true).maybeSingle();
  if (!row || !["admin", "coach"].includes((row as { role: string }).role)) return null;
  return sb;
}

// ─── Data fetch ─────────────────────────────────────────────────────────────

type PaymentRow = {
  amount: number;
  status: "paid" | "pending" | "late";
  reference: string;       // "YYYY-MM"
  due_date: string;
  student_id: string;
};

type StudentRow = {
  id: string;
  name: string;
  monthly_value: number | null;
  status: string;
};

function ptMonth(isoMonth: string): string {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const m = parseInt(isoMonth.split("-")[1], 10) - 1;
  return months[m] ?? isoMonth;
}

function addMonths(ref: string, n: number): string {
  const [y, m] = ref.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchData(sb: any) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sixMonthsAgoISO = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}`;

  const [paymentsRes, studentsRes] = await Promise.all([
    sb.from("payments")
      .select("amount, status, reference, due_date, student_id")
      .gte("reference", sixMonthsAgoISO),
    sb.from("students")
      .select("id, name, monthly_value, status")
      .in("status", ["active", "trial"]),
  ]);

  const payments: PaymentRow[] = paymentsRes.data ?? [];
  const students: StudentRow[] = studentsRes.data ?? [];

  // Build 6-month actual revenue map
  const revenueByMonth: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const ref = addMonths(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, -i);
    revenueByMonth[ref] = 0;
  }
  for (const p of payments) {
    if (p.status === "paid" && revenueByMonth[p.reference] !== undefined) {
      revenueByMonth[p.reference] = (revenueByMonth[p.reference] ?? 0) + p.amount;
    }
  }

  // Current month ref
  const currentRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Max potential (all active students paying)
  const maxPotential = students.reduce((s, st) => s + (st.monthly_value ?? 0), 0);

  // At-risk: pending or late payments
  const studentMap = new Map(students.map((s) => [s.id, s.name]));
  const atRisk: AtRiskStudent[] = payments
    .filter((p) => ["pending", "late"].includes(p.status) && p.reference >= currentRef.slice(0, 7))
    .map((p) => {
      const daysLate = p.status === "late" && p.due_date
        ? Math.max(0, Math.floor((now.getTime() - new Date(p.due_date).getTime()) / 86400000))
        : 0;
      return {
        name: studentMap.get(p.student_id) ?? "Aluno",
        amount: p.amount,
        daysLate,
        studentId: p.student_id,
      };
    })
    .sort((a, b) => b.daysLate - a.daysLate)
    .slice(0, 8);

  return { revenueByMonth, currentRef, maxPotential, atRisk, payments, students };
}

// ─── AI forecast ────────────────────────────────────────────────────────────

async function buildForecast(
  revenueByMonth: Record<string, number>,
  currentRef: string,
  maxPotential: number,
  atRiskCount: number,
  atRiskAmount: number,
): Promise<FinancialInsight> {
  const fallback: FinancialInsight = {
    trend: "estável",
    riskLevel: atRiskCount > 3 ? "alto" : atRiskCount > 0 ? "médio" : "baixo",
    projectedRevenue3m: maxPotential * 0.85 * 3,
    summary: "Mantenha o acompanhamento de pagamentos em dia para uma visão financeira precisa.",
    topAction: "Revisar pagamentos pendentes e contatar alunos inadimplentes.",
    secondaryActions: ["Confirmar mensalidades no início do mês", "Monitorar taxa de retenção"],
  };

  if (!ANTHROPIC_API_KEY) return fallback;

  const months = Object.entries(revenueByMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ref, rev]) => `${ptMonth(ref)} (${ref}): R$${rev.toFixed(0)}`).join(", ");

  // Simple linear projection
  const values = Object.values(revenueByMonth);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const trend = values.length >= 2
    ? (values[values.length - 1] - values[0]) / Math.max(values[0], 1)
    : 0;
  const projected3m = Math.round(avg * (1 + trend * 0.5) * 3);

  const prompt = `Você é o analista financeiro do Will Treinos PRO, academia de vôlei de alta performance.

HISTÓRICO DE RECEITA (últimos 6 meses):
${months}

SITUAÇÃO ATUAL:
- Potencial máximo (todos os ativos pagando): R$${maxPotential}/mês
- Alunos com pagamento pendente/atrasado este mês: ${atRiskCount}
- Valor em risco total: R$${atRiskAmount.toFixed(0)}
- Projeção linear simples para próximos 3 meses: R$${projected3m}

Analise a saúde financeira e gere previsão. Responda APENAS com JSON válido:
{
  "trend": "crescimento|estável|queda",
  "riskLevel": "baixo|médio|alto",
  "projectedRevenue3m": 0,
  "summary": "análise em 1-2 frases do momento financeiro da academia (≤160 chars)",
  "topAction": "ação mais importante a fazer agora (≤100 chars)",
  "secondaryActions": ["ação 2 (≤80 chars)", "ação 3 (≤80 chars)"]
}

REGRAS:
- projectedRevenue3m: sua estimativa realista para os próximos 3 meses somados
- trend é baseado na curva dos últimos 6 meses
- Seja direto e acionável — evite genéricos`;

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
    if (!resp.ok) return { ...fallback, projectedRevenue3m: projected3m };
    const ai = await resp.json();
    const text: string = ai?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { ...fallback, projectedRevenue3m: projected3m };
    return JSON.parse(match[0]) as FinancialInsight;
  } catch {
    return { ...fallback, projectedRevenue3m: projected3m };
  }
}

// ─── Route ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<FinancialForecastResult | { error: string }>> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = await verifyStaff(authHeader.slice(7));
  if (!sb) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { revenueByMonth, currentRef, maxPotential, atRisk } = await fetchData(sb);

    const atRiskAmount = atRisk.reduce((s, r) => s + r.amount, 0);
    const insight = await buildForecast(revenueByMonth, currentRef, maxPotential, atRisk.length, atRiskAmount);

    // Build months array: 6 actual + 3 projected
    const now = new Date();
    const currentMonthRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const avgMonthly = Object.values(revenueByMonth).reduce((s, v) => s + v, 0) / 6;

    const months: MonthData[] = [
      ...Object.entries(revenueByMonth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([ref, rev]) => ({ label: ptMonth(ref), revenue: rev, projected: false })),
      ...([1, 2, 3].map((i) => ({
        label: ptMonth(addMonths(currentMonthRef, i)),
        revenue: Math.round(insight.projectedRevenue3m / 3),
        projected: true,
      }))),
    ];

    return NextResponse.json({
      months,
      atRisk,
      insight,
      maxPotential,
      currentMonthRef,
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
