/**
 * GET /api/leaderboard/tv
 *
 * Endpoint público (sem auth) para o Modo TV da academia.
 * Retorna top 10 da semana com cache de 30s.
 * Rate limit implícito via cache da CDN.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 30;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TIER_THRESHOLDS = [
  { name: "elite", min: 10000 },
  { name: "diamante", min: 6000 },
  { name: "ouro", min: 3000 },
  { name: "prata", min: 1500 },
  { name: "bronze", min: 500 },
] as const;

function calculateTier(xp: number): string {
  return TIER_THRESHOLDS.find((t) => xp >= t.min)?.name ?? "bronze";
}

/** Formato: "Maria S." ou "João P." */
function formatDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const lastInitial = parts[parts.length - 1]!.charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

export interface TVLeaderboardEntry {
  position: number;
  name: string;       // "Maria S."
  totalXP: number;
  tier: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ entries: [] }, {
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // Semana atual: últimos 7 dias
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStart = weekAgo.toISOString();

    // XP acumulado na semana
    const { data: xpData, error: xpError } = await supabase
      .from("xp_log")
      .select("student_id, points")
      .eq("validation_passed", true)
      .gte("created_at", weekStart);

    if (xpError) {
      console.error("[leaderboard/tv] xp_log error:", xpError);
      return NextResponse.json({ entries: [] }, { status: 500 });
    }

    // Agrega XP por aluno
    const xpMap = new Map<string, number>();
    for (const row of xpData ?? []) {
      xpMap.set(row.student_id, (xpMap.get(row.student_id) ?? 0) + (row.points ?? 0));
    }

    if (xpMap.size === 0) {
      return NextResponse.json({ entries: [] }, {
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
      });
    }

    // Top 10 por XP da semana
    const top10 = Array.from(xpMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const studentIds = top10.map(([id]) => id);

    // Busca nomes (somente os top 10 — não full-scan)
    const { data: studentsData } = await supabase
      .from("students")
      .select("auth_user_id, name")
      .in("auth_user_id", studentIds);

    // XP all-time para tier
    const { data: allTimeData } = await supabase
      .from("xp_log")
      .select("student_id, points")
      .eq("validation_passed", true)
      .in("student_id", studentIds);

    const allTimeMap = new Map<string, number>();
    for (const row of allTimeData ?? []) {
      allTimeMap.set(row.student_id, (allTimeMap.get(row.student_id) ?? 0) + (row.points ?? 0));
    }

    const studentMap = new Map(
      (studentsData ?? []).map((s) => [s.auth_user_id, s.name ?? "Atleta"])
    );

    const entries: TVLeaderboardEntry[] = top10.map(([studentId, xp], idx) => ({
      position: idx + 1,
      name: formatDisplayName(studentMap.get(studentId) ?? "Atleta"),
      totalXP: xp,
      tier: calculateTier(allTimeMap.get(studentId) ?? 0),
    }));

    return NextResponse.json(
      { entries },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("[leaderboard/tv] Unexpected error:", err);
    return NextResponse.json({ entries: [] }, { status: 500 });
  }
}
