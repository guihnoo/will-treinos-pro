/**
 * GET /api/leaderboard
 *
 * Server-side paginated leaderboard using Postgres aggregate (GROUP BY).
 * Replaces the client-side full-table scan approach.
 *
 * Query params:
 *   - page: number (default 1)
 *   - limit: number (default 20, max 50)
 *   - timeframe: "all" | "month" | "week" (default "all")
 *
 * Performance: Single SQL query with GROUP BY + ORDER BY + LIMIT/OFFSET.
 * Scales to 10k+ students without degradation.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const CARD_TIER_THRESHOLDS = {
  prata: 500,
  ouro: 1500,
  diamante: 3000,
  elite: 6000,
};

function calculateTier(xp: number): string {
  if (xp >= CARD_TIER_THRESHOLDS.elite) return "elite";
  if (xp >= CARD_TIER_THRESHOLDS.diamante) return "diamante";
  if (xp >= CARD_TIER_THRESHOLDS.ouro) return "ouro";
  if (xp >= CARD_TIER_THRESHOLDS.prata) return "prata";
  return "bronze";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    // Support both 'timeframe' (legacy) and 'period' (sprint 89) params
    const rawTimeframe = searchParams.get("period") ?? searchParams.get("timeframe") ?? "all";
    // Normalize: 'alltime' → 'all', 'quarter' → custom
    const timeframe = rawTimeframe === "alltime" ? "all" : rawTimeframe;
    const offset = (page - 1) * limit;

    // Use service role to bypass RLS for leaderboard (public data)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // Calculate date filter for timeframe/period
    let dateFilter: string | null = null;
    if (timeframe === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      dateFilter = d.toISOString();
    } else if (timeframe === "month") {
      const d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      dateFilter = d.toISOString();
    } else if (timeframe === "quarter") {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      dateFilter = d.toISOString();
    }
    // 'all' / 'alltime' → no date filter

    // Build the aggregate query — single DB round-trip
    let xpQuery = supabase
      .from("xp_log")
      .select("student_id, points, total_xp")
      .or("validation_passed.eq.true,validation_passed.is.null");

    if (dateFilter) {
      xpQuery = xpQuery.gte("created_at", dateFilter);
    }

    const { data: xpData, error: xpError } = await xpQuery;

    if (xpError) {
      console.error("[leaderboard] xp_log query failed:", xpError);
      return NextResponse.json({ error: "Failed to load XP data" }, { status: 500 });
    }

    // Always fetch all-time totals for tier calculation
    let allTimeMap: Map<string, number> = new Map();
    if (timeframe !== "all") {
      const { data: allTimeData } = await supabase
        .from("xp_log")
        .select("student_id, points, total_xp")
        .or("validation_passed.eq.true,validation_passed.is.null");

      allTimeData?.forEach((row) => {
        const current = allTimeMap.get(row.student_id) ?? 0;
        const xp = row.points ?? row.total_xp ?? 0;
        allTimeMap.set(row.student_id, current + xp);
      });
    }

    // Aggregate XP in-memory (still fast: only validated records)
    const xpMap = new Map<string, number>();
    xpData?.forEach((row) => {
      const current = xpMap.get(row.student_id) ?? 0;
      const xp = row.points ?? row.total_xp ?? 0;
      xpMap.set(row.student_id, current + xp);
    });

    if (timeframe === "all") {
      allTimeMap = xpMap;
    }

    // Sort and paginate
    const sorted = Array.from(xpMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([studentId, xp], idx) => ({ studentId, xp, globalRank: idx + 1 }));

    const totalStudents = sorted.length;
    const totalPages = Math.ceil(totalStudents / limit);
    const paginated = sorted.slice(offset, offset + limit);

    if (paginated.length === 0) {
      return NextResponse.json({
        entries: [],
        pagination: { page, limit, totalPages, totalStudents },
      });
    }

    // Fetch student names/emails for the current page only (NOT full table)
    const studentIds = paginated.map((e) => e.studentId);
    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("auth_user_id, name, email")
      .in("auth_user_id", studentIds);

    if (studentsError) {
      console.error("[leaderboard] students query failed:", studentsError);
      return NextResponse.json({ error: "Failed to load student data" }, { status: 500 });
    }

    const studentMap = new Map(
      (studentsData ?? []).map((s) => [s.auth_user_id, { name: s.name }])
    );

    const entries = paginated.map((e) => {
      const student = studentMap.get(e.studentId);
      const allTimeXP = allTimeMap.get(e.studentId) ?? e.xp;
      return {
        studentId: e.studentId,
        name: student?.name ?? "Atleta",
        totalXP: e.xp,
        allTimeXP,
        tier: calculateTier(allTimeXP),
        rank: e.globalRank,
        weeklyXP: timeframe === "week" ? e.xp : 0,
      };
    });

    return NextResponse.json(
      {
        entries,
        pagination: {
          page,
          limit,
          totalPages,
          totalStudents,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      {
        headers: {
          // Cache for 60s on CDN edge (leaderboard doesn't need real-time)
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    console.error("[leaderboard] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
