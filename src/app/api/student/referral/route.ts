import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SbAny = ReturnType<typeof createClient<any>>;
import webpush from "web-push";

/**
 * GET  /api/student/referral
 *   Returns all referrals for the authenticated student.
 *
 * POST /api/student/referral  { referredEmail: string }
 *   Creates a new referral record for the authenticated student.
 *
 * PATCH /api/student/referral  { referredStudentId: string }
 *   Called internally when a referred student is approved:
 *   - Finds the matching pending referral by the new student's email
 *   - Awards +200 XP to the referrer
 *   - Sends push to referrer
 *   - Marks status as 'rewarded'
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@willtreinospro.com";
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

const REFERRAL_XP = 200;

function initWebPush(): typeof webpush | null {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return null;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  return webpush;
}

async function getAuthenticatedStudent(
  req: NextRequest,
  sb: SbAny
): Promise<{ studentId: string; email: string; authUid: string } | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return null;

  const { data: student } = await sb
    .from("students")
    .select("id, email")
    .eq("auth_user_id", user.id)
    .eq("status", "active")
    .single();

  if (!student) return null;

  const row = student as { id: string; email: string | null };
  return { studentId: row.id, email: row.email ?? "", authUid: user.id };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) as SbAny;
  const auth = await getAuthenticatedStudent(req, sb);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: referrals, error } = await sb
    .from("referrals")
    .select("id, referred_email, status, xp_awarded, created_at, rewarded_at")
    .eq("referrer_id", auth.studentId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 });
  }

  const rows = (referrals ?? []) as Array<{ status: string; xp_awarded: number | null }>;
  const totalXpEarned = rows
    .filter((r) => r.status === "rewarded")
    .reduce((sum, r) => sum + (r.xp_awarded ?? 0), 0);

  return NextResponse.json({ referrals: referrals ?? [], totalXpEarned });
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

  const referredEmail =
    typeof body.referredEmail === "string" ? body.referredEmail.trim().toLowerCase() : null;

  if (!referredEmail || !referredEmail.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) as SbAny;
  const auth = await getAuthenticatedStudent(req, sb);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate: cannot refer own email
  if (auth.email && auth.email.toLowerCase() === referredEmail) {
    return NextResponse.json({ error: "Você não pode indicar a si mesmo" }, { status: 400 });
  }

  // Validate: email not already a student
  const { data: existingStudent } = await sb
    .from("students")
    .select("id")
    .eq("email", referredEmail)
    .maybeSingle();

  if (existingStudent) {
    return NextResponse.json(
      { error: "Este email já está cadastrado na plataforma" },
      { status: 409 }
    );
  }

  // Validate: referral for this email doesn't already exist
  const { data: existingReferral } = await sb
    .from("referrals")
    .select("id")
    .eq("referred_email", referredEmail)
    .maybeSingle();

  if (existingReferral) {
    return NextResponse.json(
      { error: "Já existe uma indicação para este email" },
      { status: 409 }
    );
  }

  const { data: newReferral, error } = await sb
    .from("referrals")
    .insert({
      referrer_id: auth.studentId,
      referred_email: referredEmail,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 });
  }

  return NextResponse.json({ referral: newReferral }, { status: 201 });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  if (!SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const referredStudentId =
    typeof body.referredStudentId === "string" ? body.referredStudentId.trim() : null;

  if (!referredStudentId) {
    return NextResponse.json({ error: "referredStudentId é obrigatório" }, { status: 400 });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) as SbAny;

  // Find the new student's email
  const { data: newStudentData } = await sb
    .from("students")
    .select("id, name, email, auth_user_id")
    .eq("id", referredStudentId)
    .single();

  if (!newStudentData) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  const newStudent = newStudentData as { id: string; name: string; email: string | null; auth_user_id: string | null };
  const newStudentEmail = newStudent.email ?? "";
  if (!newStudentEmail) {
    return NextResponse.json({ rewarded: false, reason: "student_has_no_email" });
  }

  // Find pending referral matching this email
  const { data: referralData } = await sb
    .from("referrals")
    .select("id, referrer_id, status")
    .eq("referred_email", newStudentEmail.toLowerCase())
    .eq("status", "pending")
    .maybeSingle();

  if (!referralData) {
    return NextResponse.json({ rewarded: false, reason: "no_pending_referral" });
  }

  const referral = referralData as { id: string; referrer_id: string; status: string };

  // Mark as approved
  await sb
    .from("referrals")
    .update({ status: "approved", referred_student_id: referredStudentId })
    .eq("id", referral.id);

  // Award XP to referrer
  const { error: xpError } = await sb.from("xp_log").insert({
    student_id: referral.referrer_id,
    xp_amount: REFERRAL_XP,
    type: "achievement_unlock",
    multiplier_type: "indicacao",
    details: {
      source: "referral",
      referred_student_id: referredStudentId,
      referred_name: newStudent.name,
    },
  });

  if (xpError) {
    console.error(
      "[referral/PATCH] xp_log insert error:",
      (xpError as { message: string }).message
    );
  }

  // Mark as rewarded
  await sb
    .from("referrals")
    .update({
      status: "rewarded",
      xp_awarded: REFERRAL_XP,
      rewarded_at: new Date().toISOString(),
    })
    .eq("id", referral.id);

  // Send push to referrer
  const wp = initWebPush();
  if (wp) {
    const { data: referrerData } = await sb
      .from("students")
      .select("auth_user_id, name")
      .eq("id", referral.referrer_id)
      .single();

    if (referrerData) {
      const referrerStudent = referrerData as { auth_user_id: string | null; name: string };
      if (referrerStudent.auth_user_id) {
        const { data: subsData } = await sb
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", referrerStudent.auth_user_id);

        const newStudentFirstName = newStudent.name.split(" ")[0] ?? "Seu amigo";

        if (subsData && Array.isArray(subsData) && subsData.length > 0) {
          const payload = JSON.stringify({
            title: `🎉 ${newStudentFirstName} entrou na equipe!`,
            body: `+${REFERRAL_XP} XP de bônus para você pela indicação!`,
            url: "/treinos",
            icon: "/icons/icon-192.png",
            badge: "/icons/badge-72.svg",
          });

          await Promise.allSettled(
            (subsData as Array<{ endpoint: string; p256dh: string; auth: string }>).map((sub) =>
              wp.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload
              )
            )
          );
        }
      }
    }
  }

  return NextResponse.json({ rewarded: true, xpAwarded: REFERRAL_XP });
}
