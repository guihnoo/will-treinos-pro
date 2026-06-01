import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/student/lesson-mood
 *   Body: { lessonId: string, mood: 'great' | 'heavy' | 'tired', studentId: string }
 *   Stores as xp_log type='mood_response' with details JSONB.
 *   Does NOT require auth (comes from push notification click) — validates lesson existence.
 *
 * GET /api/student/lesson-mood?lessonId=xxx
 *   Returns mood summary for a lesson (for the coach panel).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const MOOD_EMOJI: Record<string, string> = {
  great: "😊",
  heavy: "😤",
  tired: "😴",
};

type MoodValue = "great" | "heavy" | "tired";

function isMoodValue(v: unknown): v is MoodValue {
  return v === "great" || v === "heavy" || v === "tired";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { lessonId, mood, studentId } = body;

  if (typeof lessonId !== "string" || !lessonId.trim()) {
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });
  }
  if (typeof studentId !== "string" || !studentId.trim()) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }
  if (!isMoodValue(mood)) {
    return NextResponse.json({ error: "mood must be great | heavy | tired" }, { status: 400 });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Validate lesson exists
  const { data: lesson, error: lessonError } = await sb
    .from("lessons")
    .select("id")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Check if already responded (idempotent)
  const { data: existing } = await sb
    .from("xp_log")
    .select("id")
    .eq("type", "mood_response")
    .eq("student_id", studentId)
    .eq("details->>lessonId", lessonId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, message: "Feedback já registrado!", alreadySubmitted: true });
  }

  // Insert mood into xp_log
  const { error: insertError } = await sb.from("xp_log").insert({
    student_id: studentId,
    type: "mood_response",
    points: 0,
    validation_passed: true,
    details: {
      lessonId,
      mood,
      emoji: MOOD_EMOJI[mood],
    },
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error("[lesson-mood] insert error:", insertError);
    return NextResponse.json({ error: "Failed to save mood" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Obrigado pelo feedback!" });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: moods, error } = await sb
    .from("xp_log")
    .select("student_id, details")
    .eq("type", "mood_response")
    .eq("details->>lessonId", lessonId);

  if (error) {
    console.error("[lesson-mood] GET error:", error);
    return NextResponse.json({ error: "Failed to load moods" }, { status: 500 });
  }

  // Aggregate counts
  const counts: Record<MoodValue, number> = { great: 0, heavy: 0, tired: 0 };
  const entries: Array<{ studentId: string; mood: string; emoji: string }> = [];

  for (const row of moods ?? []) {
    const moodVal = row.details?.mood as string | undefined;
    const emoji = (row.details?.emoji as string | undefined) ?? "❓";
    if (moodVal && isMoodValue(moodVal)) {
      counts[moodVal]++;
    }
    entries.push({ studentId: row.student_id, mood: moodVal ?? "unknown", emoji });
  }

  // Build summary string
  const summaryParts: string[] = [];
  if (counts.great > 0) summaryParts.push(`${counts.great}x 😊 Otimo`);
  if (counts.heavy > 0) summaryParts.push(`${counts.heavy}x 😤 Pesado`);
  if (counts.tired > 0) summaryParts.push(`${counts.tired}x 😴 Cansado`);

  return NextResponse.json(
    {
      lessonId,
      counts,
      entries,
      summary: summaryParts.join(" · ") || "Sem feedback ainda",
      total: entries.length,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
