import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const runtime = "edge";

const TIER_THRESHOLDS = [
  { id: "elite",     label: "Elite",     emoji: "👑", min: 10000, color: "#A855F7" },
  { id: "diamante",  label: "Diamante",  emoji: "💎", min: 6000,  color: "#06B6D4" },
  { id: "ouro",      label: "Ouro",      emoji: "🥇", min: 3000,  color: "#EAB308" },
  { id: "prata",     label: "Prata",     emoji: "🥈", min: 1500,  color: "#A1A1AA" },
  { id: "bronze",    label: "Bronze",    emoji: "🥉", min: 500,   color: "#F97316" },
  { id: "iniciante", label: "Iniciante", emoji: "🏐", min: 0,     color: "#52525B" },
];

const FUNDAMENTALS = [
  { id: "ataque",         label: "Ataque"         },
  { id: "levantamento",   label: "Levantamento"   },
  { id: "bloqueio",       label: "Bloqueio"       },
  { id: "saque",          label: "Saque"          },
  { id: "defesa",         label: "Defesa"         },
  { id: "recepcao",       label: "Recepção"       },
  { id: "posicionamento", label: "Posicionamento" },
];

function getTier(xp: number) {
  return TIER_THRESHOLDS.find(t => xp >= t.min) ?? TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
}

function weekKey(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1); // Monday
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error: authErr } = await anon.auth.getUser(jwt);
  if (authErr || !user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  // Fetch active students
  const { data: students } = await sb
    .from("students")
    .select("id, name, categories")
    .eq("status", "active");

  if (!students?.length) {
    return NextResponse.json({ error: "Sem alunos ativos" }, { status: 404 });
  }

  const studentIds = students.map(s => s.id as string);

  // Fetch all XP logs for active students
  const since12w = new Date();
  since12w.setDate(since12w.getDate() - 84); // 12 weeks back
  const { data: xpRows } = await sb
    .from("xp_log")
    .select("student_id, points, multiplier_type, type, created_at")
    .in("student_id", studentIds)
    .eq("validation_passed", true)
    .gte("created_at", since12w.toISOString())
    .order("created_at", { ascending: true });

  // ── 1. XP total per student → tier distribution ──────────────────────────
  // Also fetch all-time for tier (not just 12w)
  const { data: allTimeXp } = await sb
    .from("xp_log")
    .select("student_id, points")
    .in("student_id", studentIds)
    .eq("validation_passed", true);

  const totalXpByStudent: Record<string, number> = {};
  for (const row of allTimeXp ?? []) {
    const sid = row.student_id as string;
    totalXpByStudent[sid] = (totalXpByStudent[sid] ?? 0) + (row.points as number);
  }

  const tierDist: Record<string, { label: string; emoji: string; color: string; count: number }> = {};
  for (const t of TIER_THRESHOLDS) tierDist[t.id] = { label: t.label, emoji: t.emoji, color: t.color, count: 0 };
  for (const sid of studentIds) {
    const xp  = totalXpByStudent[sid] ?? 0;
    const tier = getTier(xp);
    tierDist[tier.id].count++;
  }

  // ── 2. Weakest fundamental across whole turma (12w) ──────────────────────
  const fundXp: Record<string, number> = {};
  const fundStudents: Record<string, Set<string>> = {};
  for (const f of FUNDAMENTALS) { fundXp[f.id] = 0; fundStudents[f.id] = new Set(); }
  for (const row of xpRows ?? []) {
    const f = row.multiplier_type as string;
    if (f && f in fundXp) {
      fundXp[f] += row.points as number;
      fundStudents[f].add(row.student_id as string);
    }
  }
  const fundamentalStats = FUNDAMENTALS.map(f => ({
    id: f.id,
    label: f.label,
    totalXp: fundXp[f.id],
    studentsActive: fundStudents[f.id].size,
    avgXpPerStudent: studentIds.length > 0 ? Math.round(fundXp[f.id] / studentIds.length) : 0,
  })).sort((a, b) => a.avgXpPerStudent - b.avgXpPerStudent);

  const weakestFundamental = fundamentalStats[0];
  const strongestFundamental = fundamentalStats[fundamentalStats.length - 1];

  // ── 3. Churn risk: no XP activity in last 14 days ────────────────────────
  const since14 = new Date();
  since14.setDate(since14.getDate() - 14);
  const since14Str = since14.toISOString();

  const lastActivityByStudent: Record<string, string> = {};
  for (const row of xpRows ?? []) {
    const sid = row.student_id as string;
    const at  = row.created_at as string;
    if (!lastActivityByStudent[sid] || at > lastActivityByStudent[sid]) {
      lastActivityByStudent[sid] = at;
    }
  }

  const churnRisk = students
    .filter(s => {
      const last = lastActivityByStudent[s.id as string];
      return !last || last < since14Str;
    })
    .map(s => {
      const last = lastActivityByStudent[s.id as string];
      const daysAgo = last
        ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000)
        : 999;
      return { id: s.id as string, name: s.name as string, daysAgo };
    })
    .sort((a, b) => b.daysAgo - a.daysAgo)
    .slice(0, 8);

  // ── 4. XP trend — last 6 weeks ───────────────────────────────────────────
  const since6w = new Date();
  since6w.setDate(since6w.getDate() - 42);

  const weeklyXp: Record<string, number> = {};
  for (const row of xpRows ?? []) {
    const at = row.created_at as string;
    if (at < since6w.toISOString()) continue;
    const wk = weekKey(at);
    weeklyXp[wk] = (weeklyXp[wk] ?? 0) + (row.points as number);
  }
  // Fill last 6 weeks (ascending)
  const weeks: { week: string; label: string; xp: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const wk = weekKey(d.toISOString());
    weeks.push({
      week: wk,
      label: new Date(wk).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
      xp: weeklyXp[wk] ?? 0,
    });
  }

  // ── 5. Top performers this month ─────────────────────────────────────────
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since30Str = since30.toISOString();

  const monthXpByStudent: Record<string, number> = {};
  for (const row of xpRows ?? []) {
    if ((row.created_at as string) < since30Str) continue;
    const sid = row.student_id as string;
    monthXpByStudent[sid] = (monthXpByStudent[sid] ?? 0) + (row.points as number);
  }

  const topPerformers = students
    .map(s => ({
      id: s.id as string,
      name: s.name as string,
      monthXP: monthXpByStudent[s.id as string] ?? 0,
      totalXP: totalXpByStudent[s.id as string] ?? 0,
      tier: getTier(totalXpByStudent[s.id as string] ?? 0),
    }))
    .sort((a, b) => b.monthXP - a.monthXP)
    .slice(0, 5);

  // ── 6. KPIs ──────────────────────────────────────────────────────────────
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const since7Str = since7.toISOString();

  const weekCheckins = (xpRows ?? []).filter(
    r => r.type === "checkin" && (r.created_at as string) >= since7Str
  ).length;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthXpAll = (xpRows ?? [])
    .filter(r => (r.created_at as string) >= monthStart.toISOString())
    .reduce((s, r) => s + (r.points as number), 0);
  const avgMonthXP = studentIds.length > 0 ? Math.round(monthXpAll / studentIds.length) : 0;

  return NextResponse.json({
    activeCount:         studentIds.length,
    avgMonthXP,
    weekCheckins,
    tierDist:            Object.values(tierDist).filter(t => t.count > 0),
    weakestFundamental,
    strongestFundamental,
    fundamentalStats,
    churnRisk,
    weeklyTrend:         weeks,
    topPerformers,
  });
}
