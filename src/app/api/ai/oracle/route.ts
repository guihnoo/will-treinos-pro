import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type OracleInsight = {
  id: string;
  type: "churn" | "revenue" | "performance" | "attendance";
  severity: "ok" | "warning" | "critical";
  title: string;
  body: string;
  action?: string;
};

type OraclePayload = {
  insights: OracleInsight[];
  generatedAt: string;
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
        max_tokens: 600,
        system: `Você é o Oráculo do Will Treinos PRO — IA de análise preditiva para academias de vôlei.
Responda APENAS com JSON válido, sem markdown, sem texto extra.
O JSON deve ter exatamente a estrutura: {"insights":[{"id":"string","type":"churn|revenue|performance|attendance","severity":"ok|warning|critical","title":"string curto (≤40 chars)","body":"string explicativa (≤120 chars)","action":"string opcional (≤50 chars)"}]}
Gere 3 insights relevantes e acionáveis baseados nos dados fornecidos. Seja direto e específico.`,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      return NextResponse.json<OraclePayload>(buildFallback(), { status: 200 });
    }

    const ai = await resp.json();
    const text: string = ai?.content?.[0]?.text ?? "";
    const parsed = JSON.parse(text) as { insights: OracleInsight[] };

    return NextResponse.json<OraclePayload>({
      insights: parsed.insights.slice(0, 4),
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json<OraclePayload>(buildFallback(), { status: 200 });
  }
}

function buildPrompt(ctx: Record<string, unknown>): string {
  return `Dados do cockpit da academia (hoje):
- Total de alunos ativos: ${ctx.totalStudents ?? "desconhecido"}
- Alunos sem aula nos últimos 14 dias: ${ctx.inactiveStudents ?? "desconhecido"}
- Pagamentos pendentes/atrasados: ${ctx.pendingPayments ?? "desconhecido"}
- Receita do mês atual (BRL): ${ctx.monthRevenue ?? "desconhecido"}
- Receita do mês anterior (BRL): ${ctx.lastMonthRevenue ?? "desconhecido"}
- Aulas realizadas essa semana: ${ctx.weekLessons ?? "desconhecido"}
- Alunos aguardando aprovação: ${ctx.awaitingApproval ?? 0}
- Média de nota nas avaliações (0-10): ${ctx.avgRating ?? "desconhecido"}

Com base nesses dados, gere 3 insights preditivos e acionáveis para o gestor da academia. Priorize alertas reais se os números indicarem risco.`;
}

function buildFallback(): OraclePayload {
  return {
    insights: [
      {
        id: "fallback-1",
        type: "attendance",
        severity: "ok",
        title: "Oráculo offline",
        body: "Configure ANTHROPIC_API_KEY para ativar análise preditiva em tempo real.",
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
        body: "Alunos sem check-in por 14+ dias podem estar em risco de abandono.",
        action: "Ver alunos inativos",
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}
