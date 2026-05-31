import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const runtime = "edge";

const TIER_THRESHOLDS = [
  { id: "elite",    min: 10000, emoji: "👑", label: "Elite"    },
  { id: "diamante", min: 6000,  emoji: "💎", label: "Diamante" },
  { id: "ouro",     min: 3000,  emoji: "🥇", label: "Ouro"     },
  { id: "prata",    min: 1500,  emoji: "🥈", label: "Prata"    },
  { id: "bronze",   min: 500,   emoji: "🥉", label: "Bronze"   },
];

const FUNDAMENTALS = [
  "ataque", "levantamento", "bloqueio", "saque", "defesa", "recepcao", "posicionamento",
] as const;

function getTier(xp: number) {
  return TIER_THRESHOLDS.find(t => xp >= t.min) ?? { id: "iniciante", emoji: "🏐", label: "Iniciante" };
}

function nextTier(xp: number) {
  const idx = TIER_THRESHOLDS.findIndex(t => xp >= t.min);
  if (idx === 0) return null; // already elite
  const next = idx === -1 ? TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1] : TIER_THRESHOLDS[idx - 1];
  return { label: next.label, emoji: next.emoji, xpNeeded: next.min - xp };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  // Fetch student — only public-safe fields
  const { data: student, error: studentErr } = await sb
    .from("students")
    .select("id, name, avatar, categories, joined_at, total_classes, frequency, status")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (studentErr || !student) {
    return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
  }

  // Aggregate XP
  const { data: xpRows } = await sb
    .from("xp_log")
    .select("points, multiplier_type")
    .eq("student_id", id)
    .eq("validation_passed", true);

  const totalXP = (xpRows ?? []).reduce((s, r) => s + (r.points as number), 0);

  // XP by fundamental
  const byFundamental: Record<string, number> = {};
  for (const fund of FUNDAMENTALS) byFundamental[fund] = 0;
  for (const row of xpRows ?? []) {
    const f = row.multiplier_type as string;
    if (f && f in byFundamental) byFundamental[f] += row.points as number;
  }
  const maxFundXP = Math.max(...Object.values(byFundamental), 1);
  const fundamentals = FUNDAMENTALS.map(f => ({
    id: f,
    label: f.charAt(0).toUpperCase() + f.slice(1),
    xp: byFundamental[f],
    pct: Math.round((byFundamental[f] / maxFundXP) * 100),
  }));

  // Check-in count
  const { count: checkinCount } = await sb
    .from("xp_log")
    .select("id", { count: "exact", head: true })
    .eq("student_id", id)
    .eq("type", "checkin");

  const tier   = getTier(totalXP);
  const next   = nextTier(totalXP);
  const name   = student.name as string;
  const parts  = name.trim().split(" ");
  const displayName = parts.length > 1
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : parts[0];

  return NextResponse.json(
    {
      id:           student.id,
      displayName,
      avatar:       student.avatar ?? "",
      categories:   student.categories ?? [],
      joinedAt:     student.joined_at ?? null,
      totalClasses: student.total_classes ?? 0,
      checkinCount: checkinCount ?? 0,
      totalXP,
      tier,
      nextTier:     next,
      fundamentals,
    },
    {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    }
  );
}
