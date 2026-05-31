import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function initWebPush() {
  const pub  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const priv = process.env.VAPID_PRIVATE_KEY ?? "";
  if (!pub || !priv) return null;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com",
    pub, priv
  );
  return webpush;
}

const MOOD_LABEL: Record<string, string> = {
  excelente: "Excelente ⭐",
  bom:       "Bom 💪",
  cansativo: "Cansativo 😮‍💨",
  dificil:   "Difícil 😤",
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error: authErr } = await anon.auth.getUser(jwt);
  if (authErr || !user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: student } = await sb
    .from("students")
    .select("id, name")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as {
    lessonId?: string;
    lessonDate?: string;
    lessonTitle?: string;
    mood?: string;
    intensidade?: number;
    tecnica?: number;
    didatica?: number;
    evolucao?: number;
    comment?: string;
  };

  const { lessonId, lessonDate, lessonTitle, mood, intensidade, tecnica, didatica, evolucao } = body;
  if (!lessonId || !lessonDate || !mood || !intensidade || !tecnica || !didatica || !evolucao) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const validMoods = ["excelente", "bom", "cansativo", "dificil"];
  if (!validMoods.includes(mood)) return NextResponse.json({ error: "Mood inválido" }, { status: 400 });

  const avg = ((intensidade + tecnica + didatica + evolucao) / 4).toFixed(2);

  // Upsert (student may re-submit to update their rating)
  const { error: upsertErr } = await sb
    .from("lesson_ratings")
    .upsert({
      lesson_id:    lessonId,
      student_id:   student.id,
      lesson_date:  lessonDate,
      lesson_title: lessonTitle ?? "Aula",
      mood,
      intensidade,
      tecnica,
      didatica,
      evolucao,
      comment:      body.comment?.trim() || null,
    }, { onConflict: "lesson_id,student_id" });

  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

  // Fetch how many ratings this lesson now has + overall avg
  const { data: stats } = await sb
    .from("lesson_ratings")
    .select("avg_score")
    .eq("lesson_id", lessonId);

  const ratingCount = stats?.length ?? 1;
  const lessonAvg = stats && stats.length > 0
    ? (stats.reduce((s, r) => s + parseFloat(r.avg_score), 0) / stats.length).toFixed(1)
    : avg;

  // Notify coach via push (fire-and-forget)
  const wp = initWebPush();
  if (wp) {
    const { data: staffSubs } = await sb
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .in("role", ["admin", "professor"]);

    if (staffSubs?.length) {
      const firstName = (student.name as string).split(" ")[0];
      const payload = JSON.stringify({
        title: `⭐ Avaliação de treino — ${firstName}`,
        body: `${firstName} avaliou "${lessonTitle ?? "Aula"}": ${avg}/5 · Humor: ${MOOD_LABEL[mood] ?? mood}. ${ratingCount} avaliação(ões) no total, média ${lessonAvg}/5.`,
        url: "/will",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.svg",
      });
      await Promise.allSettled(
        staffSubs.map((s: { endpoint: string; p256dh: string; auth: string }) =>
          wp.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          )
        )
      );
    }
  }

  return NextResponse.json({ ok: true, avg, lessonAvg, ratingCount });
}

// GET — staff fetches ratings for a specific lesson or recent ratings
export async function GET(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const url = new URL(req.url);
  const lessonId = url.searchParams.get("lessonId");
  const recent   = url.searchParams.get("recent"); // "7" = last 7 days

  let query = sb
    .from("lesson_ratings")
    .select("id, lesson_id, lesson_date, lesson_title, mood, avg_score, comment, created_at, students(name)")
    .order("created_at", { ascending: false });

  if (lessonId) {
    query = query.eq("lesson_id", lessonId);
  } else if (recent) {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(recent));
    query = query.gte("lesson_date", since.toISOString().slice(0, 10)).limit(50);
  } else {
    query = query.limit(30);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate per lesson
  const byLesson: Record<string, { lessonId: string; lessonTitle: string; lessonDate: string; count: number; avg: number; moods: string[] }> = {};
  for (const r of (data ?? [])) {
    const lid = r.lesson_id as string;
    if (!byLesson[lid]) {
      byLesson[lid] = {
        lessonId: lid,
        lessonTitle: r.lesson_title as string,
        lessonDate: r.lesson_date as string,
        count: 0,
        avg: 0,
        moods: [],
      };
    }
    byLesson[lid].count++;
    byLesson[lid].avg += parseFloat(r.avg_score as string);
    byLesson[lid].moods.push(r.mood as string);
  }
  for (const entry of Object.values(byLesson)) {
    entry.avg = parseFloat((entry.avg / entry.count).toFixed(1));
  }

  return NextResponse.json({ ratings: data ?? [], byLesson: Object.values(byLesson) });
}
