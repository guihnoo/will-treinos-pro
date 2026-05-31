import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const PILLAR_LABELS: Record<string, string> = {
  fisico: "Físico", tecnico: "Técnico", tatico: "Tático", atitude: "Atitude", evolucao: "Evolução",
};

type Intensity = "leve" | "moderado" | "intenso" | "máximo";
type DayName   = "segunda" | "terça" | "quarta" | "quinta" | "sexta" | "sábado";

interface AIExercise {
  dayName: DayName;
  exerciseName: string;
  sets: number;
  repsMin?: number;
  repsMax?: number;
  durationMinutes?: number;
  intensity: Intensity;
  notes?: string;
}
interface AIPlan {
  title: string;
  description: string;
  exercises: AIExercise[];
}

async function verifyStaff(jwt: string): Promise<{ ok: boolean; userId?: string; displayName?: string }> {
  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error } = await anon.auth.getUser(jwt);
  if (error || !user) return { ok: false };
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: staffRow } = await sb.from("staff_access").select("role").eq("auth_user_id", user.id).maybeSingle();
  const { data: studentRow } = await sb.from("students").select("name, student_role").eq("auth_user_id", user.id).maybeSingle();
  const isStaff = Boolean(staffRow) || studentRow?.student_role === "professor";
  return { ok: isStaff, userId: user.id, displayName: studentRow?.name ?? "Coach" };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { ok, userId, displayName } = await verifyStaff(jwt);
  if (!ok) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { studentId } = await req.json().catch(() => ({})) as { studentId?: string };
  if (!studentId) return NextResponse.json({ error: "studentId obrigatório" }, { status: 400 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  // Fetch student
  const { data: student } = await sb
    .from("students")
    .select("id, name, frequency")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  // Fetch last 3 evaluations for weak pillar analysis
  const { data: evals } = await sb
    .from("evaluations")
    .select("scores, avg_score")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch total XP for tier context
  const { data: xpData } = await sb
    .from("xp_log")
    .select("points")
    .eq("student_id", studentId)
    .eq("validation_passed", true);

  const totalXP = (xpData ?? []).reduce((s: number, r: { points: number }) => s + r.points, 0);
  const tier =
    totalXP >= 10000 ? "Elite" :
    totalXP >= 6000  ? "Diamante" :
    totalXP >= 3000  ? "Ouro" :
    totalXP >= 1500  ? "Prata" :
    totalXP >= 500   ? "Bronze" : "Iniciante";

  // Compute average per pillar across last 3 evals
  const pillarAvg: Record<string, number> = {};
  if (evals && evals.length > 0) {
    const pillars = ["fisico", "tecnico", "tatico", "atitude", "evolucao"];
    for (const p of pillars) {
      const vals = evals
        .map((e: { scores: Record<string, number> }) => e.scores?.[p])
        .filter((v): v is number => typeof v === "number");
      pillarAvg[p] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 7;
    }
  }

  const sortedPillars = Object.entries(pillarAvg).sort((a, b) => a[1] - b[1]);
  const weakest = sortedPillars.slice(0, 2).map(([k, v]) => `${PILLAR_LABELS[k]} (${v.toFixed(1)}/10)`);
  const frequency = student.frequency ?? 3;
  const trainDays = frequency <= 2 ? "segunda e quarta"
    : frequency <= 3 ? "segunda, quarta e sexta"
    : "segunda, terça, quinta e sábado";

  // Fallback plan if no AI key
  const fallbackPlan: AIPlan = {
    title: `Plano Técnico — ${student.name.split(" ")[0]}`,
    description: `Foco em ${weakest.length > 0 ? weakest.join(", ") : "fundamentos gerais"}.`,
    exercises: [
      { dayName: "segunda", exerciseName: "Aquecimento geral",       sets: 1, durationMinutes: 10, intensity: "leve",     notes: "Alongamento e ativação" },
      { dayName: "segunda", exerciseName: "Saque flutuante",          sets: 3, repsMin: 15, repsMax: 20, intensity: "moderado", notes: "Foco na altura do contato" },
      { dayName: "segunda", exerciseName: "Recepção em W",            sets: 3, repsMin: 20, repsMax: 25, intensity: "moderado", notes: "Posição baixa, antebraços paralelos" },
      { dayName: "quarta",  exerciseName: "Ataque diagonal",          sets: 4, repsMin: 10, repsMax: 15, intensity: "intenso",  notes: "Impulso e extensão do braço" },
      { dayName: "quarta",  exerciseName: "Bloqueio duplo",           sets: 3, repsMin: 12, repsMax: 15, intensity: "moderado", notes: "Timing com o levantador adversário" },
      { dayName: "sexta",   exerciseName: "Exercício situacional 6x6", sets: 2, durationMinutes: 15, intensity: "intenso", notes: "Aplicar fundamentos treinados na semana" },
    ],
  };

  let plan: AIPlan = fallbackPlan;

  if (ANTHROPIC_API_KEY && evals && evals.length >= 1) {
    try {
      const prompt = `Você é um treinador de vôlei criando um plano semanal personalizado.

Atleta: ${student.name}
Nível/Tier: ${tier} (${totalXP} XP total)
Frequência de treino: ${frequency}x/semana — dias: ${trainDays}
Pilares mais fracos: ${weakest.length > 0 ? weakest.join(", ") : "Em análise"}

Crie um plano de treino semanal (7 exercícios, distribuídos nos dias de treino) focado em melhorar os fundamentos mais fracos.

Responda APENAS com JSON válido neste formato exato (sem markdown, sem explicações):
{
  "title": "Título do plano (max 50 chars)",
  "description": "Descrição breve (max 120 chars)",
  "exercises": [
    {
      "dayName": "segunda",
      "exerciseName": "Nome do exercício",
      "sets": 3,
      "repsMin": 15,
      "repsMax": 20,
      "intensity": "moderado",
      "notes": "Instrução técnica"
    }
  ]
}

Valores válidos para dayName: segunda, terça, quarta, quinta, sexta, sábado
Valores válidos para intensity: leve, moderado, intenso, máximo
Use repsMin/repsMax para exercícios com repetições ou durationMinutes para exercícios por tempo.`;

      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json() as { content: Array<{ text: string }> };
        const raw = aiData.content[0]?.text?.trim() ?? "";
        // Strip any markdown code fences
        const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        const parsed = JSON.parse(jsonStr) as AIPlan;
        if (parsed.title && Array.isArray(parsed.exercises)) plan = parsed;
      }
    } catch {
      // use fallback
    }
  }

  // Insert training plan
  const startDate = new Date().toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const { data: newPlan, error: planErr } = await sb
    .from("training_plans")
    .insert({
      coach_id: userId ?? "system",
      student_id: studentId,
      title: plan.title,
      description: plan.description ?? null,
      start_date: startDate,
      end_date: endDate,
      status: "active",
    })
    .select("id")
    .single();

  if (planErr || !newPlan) return NextResponse.json({ error: planErr?.message ?? "Erro ao criar plano" }, { status: 500 });

  // Insert exercises (batch)
  const exerciseRows = plan.exercises.map((ex, i) => ({
    plan_id: newPlan.id,
    week_number: 1,
    day_name: ex.dayName,
    exercise_name: ex.exerciseName,
    sets: ex.sets ?? 3,
    reps_min: ex.repsMin ?? null,
    reps_max: ex.repsMax ?? null,
    duration_minutes: ex.durationMinutes ?? null,
    intensity: ex.intensity ?? "moderado",
    notes: ex.notes ?? null,
  }));

  await sb.from("training_exercises").insert(exerciseRows);

  // Push notification to student
  if (student.id) {
    const { data: studentAuth } = await sb
      .from("students")
      .select("auth_user_id")
      .eq("id", studentId)
      .maybeSingle();
    if (studentAuth?.auth_user_id) {
      const { data: subs } = await sb
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", studentAuth.auth_user_id)
        .limit(3);
      // We don't have webpush in edge — skip push here, coach sees toast
      void subs;
    }
  }

  return NextResponse.json({
    planId: newPlan.id,
    title: plan.title,
    exerciseCount: exerciseRows.length,
    tier,
    usedAI: Boolean(ANTHROPIC_API_KEY && evals && evals.length >= 1),
  });
}
