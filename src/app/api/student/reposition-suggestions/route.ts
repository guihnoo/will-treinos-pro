import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const runtime = "edge";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!jwt) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error: authErr } = await anon.auth.getUser(jwt);
  if (authErr || !user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: student } = await sb
    .from("students")
    .select("id, name, categories")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + 21);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  // Fetch scheduled lessons in the next 21 days
  const { data: lessons, error: lessonErr } = await sb
    .from("lessons")
    .select("id, title, date, start_time, end_time, category_id, max_students, enrolled_students")
    .eq("status", "scheduled")
    .gte("date", todayStr)
    .lte("date", cutoffStr)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (lessonErr) return NextResponse.json({ error: lessonErr.message }, { status: 500 });

  const studentId = student.id as string;
  const studentCategories: string[] = Array.isArray(student.categories) ? student.categories : [];

  // Filter: student not enrolled + has vacancy
  const suggestions = (lessons ?? [])
    .filter((l) => {
      const enrolled: string[] = Array.isArray(l.enrolled_students) ? l.enrolled_students : [];
      const isFull = enrolled.length >= (l.max_students ?? 12);
      const alreadyIn = enrolled.includes(studentId);
      return !isFull && !alreadyIn;
    })
    .map((l) => ({
      id: l.id,
      title: l.title ?? "",
      date: l.date,
      startTime: l.start_time ?? "",
      endTime: l.end_time ?? "",
      categoryId: l.category_id ?? "",
      maxStudents: l.max_students ?? 12,
      spotsLeft: (l.max_students ?? 12) - ((l.enrolled_students as string[] ?? []).length),
      isMatchingCategory: studentCategories.includes(l.category_id ?? ""),
    }))
    // Sort: matching category first, then by date
    .sort((a, b) => {
      if (a.isMatchingCategory && !b.isMatchingCategory) return -1;
      if (!a.isMatchingCategory && b.isMatchingCategory) return 1;
      return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
    })
    .slice(0, 15);

  return NextResponse.json({ suggestions, studentCrmId: studentId });
}
