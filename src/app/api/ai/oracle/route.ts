import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type OracleInsight = {
  id: string;
  type: "churn" | "revenue" | "performance" | "attendance" | "reposition";
  severity: "ok" | "warning" | "critical";
  title: string;
  body: string;
  action?: string;
};

type OraclePayload = {
  insights: OracleInsight[];
  generatedAt: string;
  ai_powered: boolean;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json<OraclePayload>(buildFallback(), { status: 200 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jwt = authHeader.slice(7);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt);
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: staffRow } = await supabase
    .from("staff_access")
    .select("role")
    .eq("email", user.email)
    .eq("is_active", true)
    .maybeSingle();

  if (!staffRow || !["admin", "coach"].includes(staffRow.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let context: Record<string, unknown> = {};
  try {
    context = await req.json();
  } catch {
    // no body is fine
  }

  const prompt = buildPrompt(context);

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
        max_tokens: 800,
        system: `Você é o Oráculo do Will Treinos PRO — analista preditivo especializado em academias de vôlei de alta performance no Brasil.
Seu papel: identificar riscos reais e oportunidades com base nos dados da academia e gerar insights acionáveis para o gestor.

REGRAS CRÍTICAS:
1. Responda APENAS com JSON válido, sem markdown, sem texto antes ou depois
2. Use EXATAMENTE esta estrutura:
{"insights":[{"id":"string","type":"churn|revenue|performance|attendance|reposition","severity":"ok|warning|critical","title":"string (≤40 chars)","body":"string (≤130 chars)","action":"string opcional (≤50 chars)"}]}
3. Gere exatamente 4 insights
4. Se houver nomes de alunos disponíveis, mencione-os para tornar o insight acionável
5. severity "critical" = requer ação imediata, "warning" = monitorar, "ok" = positivo/informativo
6. Seja direto e específico — evite generalidades`,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      return NextResponse.json<OraclePayload>(buildFallback(), { status: 200 });
    }

    const ai = await resp.json();
    const text: string = ai?.content?.[0]?.text ?? "";

    // Extract JSON even if there's surrounding whitespace
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json<OraclePayload>(buildFallback(), { status: 200 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { insights: OracleInsight[] };

    return NextResponse.json<OraclePayload>({
      insights: parsed.insights.slice(0, 4),
      generatedAt: new Date().toISOString(),
      ai_powered: true,
    });
  } catch {
    return NextResponse.json<OraclePayload>(buildFallback(), { status: 200 });
  }
}

function buildPrompt(ctx: Record<string, unknown>): string {
  const atRisk = ctx.atRiskStudents as Array<{ name: string; daysSince: number }> | undefined;
  const overdue = ctx.overduePayments as Array<{ name: string; amount: number; daysLate: number }> | undefined;
  const revenueGrowth = ctx.revenueGrowth as number | undefined;
  const pendingRepo = ctx.pendingRepositions as number | undefined;

  let atRiskSection = "Não identificado";
  if (atRisk && atRisk.length > 0) {
    atRiskSection = atRisk.map((s) => `${s.name} (${s.daysSince} dias)`).join(", ");
  }

  let overdueSection = "Nenhum";
  if (overdue && overdue.length > 0) {
    overdueSection = overdue
      .map((p) => `${p.name}: R$${p.amount} (${p.daysLate}d atrasado)`)
      .join("; ");
  }

  const revenueNote =
    revenueGrowth !== undefined
      ? revenueGrowth > 0
        ? `+${revenueGrowth.toFixed(1)}% em relação ao mês passado`
        : `${revenueGrowth.toFixed(1)}% em relação ao mês passado`
      : "comparativo não disponível";

  return `Dados da academia de vôlei (hoje):

ALUNOS:
- Total ativo: ${ctx.totalStudents ?? "?"}
- Inativos (sem aula em 14+ dias): ${ctx.inactiveStudents ?? "?"} alunos
- Nomes dos inativos em risco: ${atRiskSection}
- Aguardando aprovação de cadastro: ${ctx.awaitingApproval ?? 0}

FINANCEIRO:
- Receita do mês atual (BRL): R$${ctx.monthRevenue ?? "?"}
- Tendência: ${revenueNote}
- Pagamentos pendentes/atrasados: ${ctx.pendingPayments ?? "?"}
- Detalhe dos atrasados: ${overdueSection}

AULAS:
- Aulas realizadas essa semana: ${ctx.weekLessons ?? "?"}
- Solicitações de reposição pendentes: ${pendingRepo ?? 0}
- Média de nota nas avaliações (0-10): ${ctx.avgRating ?? "não disponível"}

Gere 4 insights preditivos e acionáveis. Priorize alertas reais. Se os números estiverem bons, reconheça e sugira como manter.`;
}

function buildFallback(): OraclePayload {
  return {
    ai_powered: false,
    insights: [
      {
        id: "fallback-1",
        type: "attendance",
        severity: "ok",
        title: "Oráculo offline",
        body: "Dados insuficientes para gerar análise preditiva. Continue registrando presenças e avaliações.",
        action: "Ver configurações",
      },
      {
        id: "fallback-2",
        type: "revenue",
        severity: "ok",
        title: "Receita em monitoramento",
        body: "Acompanhe o painel financeiro para identificar tendências de pagamento.",
        action: "Abrir financeiro",
      },
      {
        id: "fallback-3",
        type: "churn",
        severity: "ok",
        title: "Retenção de atletas",
        body: "Alunos sem check-in por 14+ dias podem estar em risco de abandono. Contato proativo aumenta retenção.",
        action: "Ver alunos inativos",
      },
      {
        id: "fallback-4",
        type: "reposition",
        severity: "ok",
        title: "Reposições em dia",
        body: "Acompanhe solicitações de reposição no cockpit para manter a frequência dos atletas.",
        action: "Ver agenda",
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}
