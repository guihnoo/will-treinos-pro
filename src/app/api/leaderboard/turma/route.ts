import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/leaderboard/turma
 * Returns weekly XP ranking for students sharing the same primary category.
 * Auth: student JWT (own data only) or staff JWT (any student).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type TurmaEntry = {
  studentId: string;
  name: string;
  avatar: string | null;
  weeklyXP: number;
  rank: number;
  isCurrentStudent: boolean;
};

export type TurmaLeaderboardResult = {
  entries: TurmaEntry[];
  currentRank: number;
  categoryName: string;
  totalInTurma: number;
  weekLabel: string;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function resolveStudentContext(jwt: string, requestedStudentId: string): Promise<{
  studentId: string;
} | null> {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await anonClient.auth.getUser(jwt);
  if (error || !user) return null;

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Staff: any student
  const { data: staffRow } = await sb.from("staff_access").select("role")
    .eq("email", user.email).eq("is_active", true).maybeSingle();
  if (staffRow) return { studentId: requestedStudentId };

  // Student: only their own
  const { data: studentRow } = await sb.from("students").select("id")
    .eq("auth_user_id", user.id).maybeSingle();
  if (studentRow && (studentRow as { id: string }).id === requestedStudentId) {
    return { studentId: requestedStudentId };
  }

  return null;
}

// ─── Week helpers ─────────────────────────────────────────────────────────────

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function weekLabel(): string {
  const start = getWeekStart();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<TurmaLeaderboardResult | { error: string }>> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { studentId: string } = { studentId: "" };
  try { body = await req.json(); } catch { /* no body */ }
  if (!body.studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const ctx = await resolveStudentContext(authHeader.slice(7), body.studentId);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Get this student's primary category
  const { data: me } = await sb.from("students")
    .select("categories, name")
    .eq("id", body.studentId)
    .maybeSingle();

  const myCategories: string[] = (me as { categories: string[] } | null)?.categories ?? [];
  const primaryCategory = myCategories[0] ?? null;

  if (!primaryCategory) {
    // No category — return empty leaderboard
    return NextResponse.json({
      entries: [],
      currentRank: 0,
      categoryName: "Sem turma",
      totalInTurma: 0,
      weekLabel: weekLabel(),
    });
  }

  // 2. Find all active students in the same primary category
  const { data: turmaStudents } = await sb.from("students")
    .select("id, name, avatar, categories")
    .eq("status", "active")
    .contains("categories", [primaryCategory]);

  if (!turmaStudents || turmaStudents.length === 0) {
    return NextResponse.json({
      entries: [],
      currentRank: 1,
      categoryName: primaryCategory,
      totalInTurma: 1,
      weekLabel: weekLabel(),
    });
  }

  const turmaIds = (turmaStudents as { id: string; name: string; avatar: string | null; categories: string[] }[])
    .map((s) => s.id);

  // 3. Fetch weekly XP for all turma students
  const weekStart = getWeekStart().toISOString();
  const { data: xpLogs } = await sb.from("xp_log")
    .select("student_id, points")
    .in("student_id", turmaIds)
    .eq("validation_passed", true)
    .gte("created_at", weekStart);

  // 4. Aggregate XP per student
  const xpMap = new Map<string, number>();
  for (const id of turmaIds) xpMap.set(id, 0);
  for (const log of (xpLogs ?? []) as { student_id: string; points: number }[]) {
    xpMap.set(log.student_id, (xpMap.get(log.student_id) ?? 0) + log.points);
  }

  // 5. Build sorted ranked entries
  const studentMap = new Map(
    (turmaStudents as { id: string; name: string; avatar: string | null }[]).map((s) => [s.id, s])
  );

  const sorted = turmaIds
    .map((id) => ({ id, xp: xpMap.get(id) ?? 0 }))
    .sort((a, b) => b.xp - a.xp);

  let currentRank = 1;
  const entries: TurmaEntry[] = sorted.map((item, i) => {
    const s = studentMap.get(item.id)!;
    const rank = i + 1;
    if (item.id === body.studentId) currentRank = rank;
    return {
      studentId: item.id,
      name: s.name,
      avatar: s.avatar ?? null,
      weeklyXP: item.xp,
      rank,
      isCurrentStudent: item.id === body.studentId,
    };
  });

  // Return top 8 + always include current student if not in top 8
  const top8 = entries.slice(0, 8);
  const currentInTop8 = top8.some((e) => e.isCurrentStudent);
  const currentEntry = entries.find((e) => e.isCurrentStudent);

  const finalEntries = currentInTop8
    ? top8
    : currentEntry
    ? [...top8, currentEntry]
    : top8;

  return NextResponse.json({
    entries: finalEntries,
    currentRank,
    categoryName: primaryCategory,
    totalInTurma: turmaIds.length,
    weekLabel: weekLabel(),
  });
}
