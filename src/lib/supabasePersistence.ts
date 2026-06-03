"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Lesson,
  LessonCategory,
  LessonStatus,
  Notification,
  Payment,
  PaymentStatus,
  PlanStatus,
  Post,
  Student,
  StudentStatus,
  TrainingPlan,
  Venue,
  WithoutId,
} from "@/context/types";
import { paymentReferenceForDate } from "@/lib/dateUtils";
import { describeStudentInsertFailure } from "@/lib/studentSignupErrors";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function mapStudent(row: DbRow): Student {
  const rawAuth = row.auth_user_id ?? row.authUserId;
  return {
    id: asString(row.id),
    authUserId: rawAuth != null && String(rawAuth).length > 0 ? String(rawAuth) : undefined,
    name: asString(row.name || row.full_name, "Aluno"),
    phone: asString(row.phone),
    email: asString(row.email),
    avatar: asString(row.avatar),
    instagram: asString(row.instagram),
    status: (asString(row.status, "pending") as StudentStatus) || "pending",
    plan: asString(row.plan),
    monthlyValue: asNumber(row.monthly_value ?? row.monthlyValue),
    paymentDay: asNumber(row.payment_day ?? row.paymentDay, 5),
    categories: asStringArray(row.categories),
    joinedAt: asString(row.joined_at ?? row.joinedAt, new Date().toISOString().slice(0, 10)),
    frequency: asNumber(row.frequency),
    totalClasses: asNumber(row.total_classes ?? row.totalClasses),
    notes: asString(row.notes),
    professorNotes: asString(row.professor_notes ?? row.professorNotes),
    attendanceHistory: Array.isArray(row.attendance_history ?? row.attendanceHistory)
      ? (row.attendance_history ?? row.attendanceHistory) as Student["attendanceHistory"]
      : [],
    studentRole: ((row.student_role as string) || "aluno") as import("@/context/types").StudentRole,
    birthdate: asString(row.birthdate) || undefined,
    tags: asStringArray(row.tags),
    /** Posição na quadra (ex.: levantador) — coluna opcional no Supabase */
    position: asString(row.position) || undefined,
  };
}

function mapPayment(row: DbRow): Payment {
  return {
    id: asString(row.id),
    studentId: asString(row.student_id ?? row.studentId),
    amount: asNumber(row.amount),
    dueDate: asString(row.due_date ?? row.dueDate),
    paidDate: (row.paid_date ?? row.paidDate) as string | null,
    status: (asString(row.status, "pending") as PaymentStatus) || "pending",
    method: (row.method as string | null) ?? null,
    reference: asString(row.reference, paymentReferenceForDate()),
    studentProofNote: asString(row.student_proof_note ?? row.studentProofNote),
    studentProofSubmittedAt: (row.student_proof_submitted_at ?? row.studentProofSubmittedAt) as string | null,
    studentProofDataUrl: asString(row.student_proof_data_url ?? row.studentProofDataUrl),
    studentProofFileName: asString(row.student_proof_file_name ?? row.studentProofFileName),
    studentProofMime: asString(row.student_proof_mime ?? row.studentProofMime),
  };
}

function serializeStudentPatch(patch: Partial<Student>) {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.phone !== undefined) payload.phone = patch.phone;
  if (patch.email !== undefined) payload.email = patch.email;
  if (patch.avatar !== undefined) payload.avatar = patch.avatar;
  if (patch.instagram !== undefined) payload.instagram = patch.instagram;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.plan !== undefined) payload.plan = patch.plan;
  if (patch.monthlyValue !== undefined) payload.monthly_value = patch.monthlyValue;
  if (patch.paymentDay !== undefined) payload.payment_day = patch.paymentDay;
  if (patch.categories !== undefined) payload.categories = patch.categories;
  if (patch.joinedAt !== undefined) payload.joined_at = patch.joinedAt;
  if (patch.frequency !== undefined) payload.frequency = patch.frequency;
  if (patch.totalClasses !== undefined) payload.total_classes = patch.totalClasses;
  if (patch.notes !== undefined) payload.notes = patch.notes;
  if (patch.professorNotes !== undefined) payload.professor_notes = patch.professorNotes;
  if (patch.attendanceHistory !== undefined) payload.attendance_history = patch.attendanceHistory;
  if (patch.authUserId !== undefined) payload.auth_user_id = patch.authUserId;
  if (patch.studentRole !== undefined) payload.student_role = patch.studentRole;
  if (patch.birthdate !== undefined) payload.birthdate = patch.birthdate;
  if (patch.tags !== undefined) payload.tags = patch.tags;
  if (patch.position !== undefined) payload.position = patch.position;
  return payload;
}

function serializeLesson(lesson: Lesson) {
  return {
    id: lesson.id,
    category_id: lesson.categoryId,
    title: lesson.title,
    date: lesson.date,
    start_time: lesson.startTime,
    end_time: lesson.endTime,
    max_students: lesson.maxStudents,
    lesson_type: lesson.lessonType ?? null,
    location_url: lesson.locationUrl ?? null,
    enrolled_students: lesson.enrolledStudents ?? [],
    present_students: lesson.presentStudents ?? [],
    absent_students: lesson.absentStudents ?? [],
    waitlist: lesson.waitlist ?? [],
    status: lesson.status,
    venue_id: lesson.venueId,
    notes: lesson.notes ?? "",
    is_trial: lesson.isTrial ?? false,
    check_in_requests: lesson.checkInRequests ?? [],
    reposition_requests: lesson.repositionRequests ?? [],
  };
}

function serializeLessonPatch(patch: Partial<Lesson>) {
  const payload: Record<string, unknown> = {};
  if (patch.categoryId !== undefined) payload.category_id = patch.categoryId;
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.date !== undefined) payload.date = patch.date;
  if (patch.startTime !== undefined) payload.start_time = patch.startTime;
  if (patch.endTime !== undefined) payload.end_time = patch.endTime;
  if (patch.maxStudents !== undefined) payload.max_students = patch.maxStudents;
  if (patch.lessonType !== undefined) payload.lesson_type = patch.lessonType ?? null;
  if (patch.locationUrl !== undefined) payload.location_url = patch.locationUrl ?? null;
  if (patch.enrolledStudents !== undefined) payload.enrolled_students = patch.enrolledStudents;
  if (patch.presentStudents !== undefined) payload.present_students = patch.presentStudents;
  if (patch.absentStudents !== undefined) payload.absent_students = patch.absentStudents;
  if (patch.waitlist !== undefined) payload.waitlist = patch.waitlist;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.venueId !== undefined) payload.venue_id = patch.venueId;
  if (patch.notes !== undefined) payload.notes = patch.notes;
  if (patch.isTrial !== undefined) payload.is_trial = patch.isTrial;
  if (patch.checkInRequests !== undefined) payload.check_in_requests = patch.checkInRequests;
  if (patch.repositionRequests !== undefined) payload.reposition_requests = patch.repositionRequests;
  return payload;
}

function mapLesson(row: DbRow): Lesson {
  const rawStatus = asString(row.status, "scheduled");
  const status = (
    ["scheduled", "in-progress", "completed", "cancelled"].includes(rawStatus) ? rawStatus : "scheduled"
  ) as LessonStatus;

  return {
    id: asString(row.id),
    categoryId: asString(row.category_id ?? row.categoryId),
    title: asString(row.title),
    date:
      typeof row.date === "string"
        ? row.date.slice(0, 10)
        : row.date != null
          ? String(row.date).slice(0, 10)
          : "",
    startTime: asString(row.start_time ?? row.startTime),
    endTime: asString(row.end_time ?? row.endTime),
    maxStudents: asNumber(row.max_students ?? row.maxStudents, 12),
    lessonType: (asString(row.lesson_type ?? row.lessonType) || undefined) as Lesson["lessonType"],
    locationUrl: asString(row.location_url ?? row.locationUrl) || undefined,
    enrolledStudents: asStringArray(row.enrolled_students ?? row.enrolledStudents),
    presentStudents: asStringArray(row.present_students ?? row.presentStudents),
    absentStudents: asStringArray(row.absent_students ?? row.absentStudents),
    waitlist: Array.isArray(row.waitlist) ? asStringArray(row.waitlist) : [],
    status,
    venueId: asString(row.venue_id ?? row.venueId),
    notes: asString(row.notes),
    isTrial: Boolean(row.is_trial ?? row.isTrial),
    checkInRequests: Array.isArray(row.check_in_requests ?? row.checkInRequests)
      ? (row.check_in_requests ?? row.checkInRequests) as Lesson["checkInRequests"]
      : [],
    repositionRequests: Array.isArray(row.reposition_requests ?? row.repositionRequests)
      ? (row.reposition_requests ?? row.repositionRequests) as Lesson["repositionRequests"]
      : [],
  };
}

export async function updateNotificationReadRemote(
  supabase: SupabaseClient,
  id: string,
  read: boolean,
): Promise<void> {
  const { error } = await supabase.from("notifications").update({ is_read: read }).eq("id", id);
  if (error) {
    throw new Error(`Falha ao atualizar leitura da notificação: ${error.message}`);
  }
}

export async function insertNotificationRemote(
  supabase: SupabaseClient,
  payload: WithoutId<Notification> & { id?: string },
): Promise<Notification> {
  const id =
    payload.id ||
    (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `nf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      time: payload.time || new Date().toISOString(),
      is_read: payload.read,
      student_id: payload.studentId ?? null,
      recipient_id: payload.recipientId ?? null,
      is_global: payload.isGlobal ?? false,
      action_url: payload.actionUrl ?? null,
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(`Falha ao gravar notificação: ${error.message}`);
  }
  return mapNotification((data || {}) as DbRow);
}

function mapNotification(row: DbRow): Notification {
  const rawType = asString(row.type, "message");
  const type = (
    ["new_student", "payment_late", "lesson_soon", "performance", "message", "broadcast"].includes(rawType)
      ? rawType
      : "message"
  ) as Notification["type"];

  return {
    id: asString(row.id),
    type,
    title: asString(row.title),
    message: asString(row.message),
    time: asString(row.time ?? row.display_time, "agora"),
    read: Boolean(row.is_read ?? row.read),
    studentId: asString(row.student_id ?? row.studentId) || undefined,
    recipientId: asString(row.recipient_id ?? row.recipientId) || undefined,
    isGlobal: Boolean(row.is_global ?? row.isGlobal),
    actionUrl: asString(row.action_url ?? row.actionUrl) || undefined,
  };
}

const APP_SETTINGS_ROW_ID = "singleton";

export async function fetchEnrollmentInviteRemote(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("enrollment_invite_code")
    .eq("id", APP_SETTINGS_ROW_ID)
    .maybeSingle();
  if (error) {
    return null;
  }
  const code = asString((data as DbRow | null)?.enrollment_invite_code ?? "").trim();
  return code || null;
}

export async function upsertEnrollmentInviteRemote(supabase: SupabaseClient, code: string): Promise<void> {
  const trimmed = code.trim();
  if (!trimmed) return;
  const { error } = await supabase.from("app_settings").upsert(
    {
      id: APP_SETTINGS_ROW_ID,
      enrollment_invite_code: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) {
    throw new Error(`Falha ao salvar código de convite: ${error.message}`);
  }
}

export async function insertPaymentRemote(
  supabase: SupabaseClient,
  payload: WithoutId<Payment> & { id?: string },
): Promise<Payment> {
  const id =
    payload.id ||
    (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const reference = payload.reference || paymentReferenceForDate();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      id,
      student_id: payload.studentId,
      amount: payload.amount,
      due_date: payload.dueDate,
      paid_date: payload.paidDate,
      status: payload.status,
      method: payload.method,
      reference,
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(`Falha ao criar pagamento: ${error.message}`);
  }
  return mapPayment((data || {}) as DbRow);
}

export type LiveAppData = {
  students: Student[];
  payments: Payment[];
  lessons: Lesson[];
  notifications: Notification[];
};

export async function fetchLiveAppData(supabase: SupabaseClient): Promise<LiveAppData> {
  // Perf: campos específicos + limites reduzem payload em ~60%
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [studentsRes, paymentsRes, lessonsRes, notificationsRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, email, phone, avatar, status, role, student_role, plan, monthly_value, payment_day, categories, frequency, joined_at, auth_user_id, notes, tags, birthdate, position")
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, student_id, amount, due_date, paid_date, status, method, reference, student_proof_note, student_proof_submitted_at, student_proof_data_url, student_proof_file_name, student_proof_mime")
      .order("due_date", { ascending: false })
      .limit(300),
    supabase
      .from("lessons")
      .select("id, title, date, start_time, end_time, category_id, venue_id, status, max_students, enrolled_students, present_students, absent_students, waitlist, check_in_requests, reposition_requests, lesson_type, is_trial, notes")
      .gte("date", ninetyDaysAgo)
      .order("date", { ascending: true }),
    supabase
      .from("notifications")
      .select("id, type, title, message, time, is_read, student_id, recipient_id, is_global, action_url, created_at")
      .order("created_at", { ascending: false })
      .limit(150),
  ]);

  if (studentsRes.error) {
    throw new Error(`Falha ao carregar alunos: ${studentsRes.error.message}`);
  }
  if (paymentsRes.error) {
    throw new Error(`Falha ao carregar financeiro: ${paymentsRes.error.message}`);
  }
  if (lessonsRes.error) {
    throw new Error(`Falha ao carregar agenda: ${lessonsRes.error.message}`);
  }
  if (notificationsRes.error) {
    throw new Error(`Falha ao carregar notificações: ${notificationsRes.error.message}`);
  }

  return {
    students: (studentsRes.data || []).map((row) => mapStudent(row as DbRow)),
    payments: (paymentsRes.data || []).map((row) => mapPayment(row as DbRow)),
    lessons: (lessonsRes.data || []).map((row) => mapLesson(row as DbRow)),
    notifications: (notificationsRes.data || []).map((row) => mapNotification(row as DbRow)),
  };
}

/** @deprecated Use fetchLiveAppData */
export async function fetchCriticalData(supabase: SupabaseClient): Promise<{ students: Student[]; payments: Payment[] }> {
  const data = await fetchLiveAppData(supabase);
  return { students: data.students, payments: data.payments };
}

export async function updateStudentRemote(supabase: SupabaseClient, id: string, patch: Partial<Student>) {
  const payload = serializeStudentPatch(patch);
  const { data, error } = await supabase.from("students").update(payload).eq("id", id).select("*").single();
  if (error) {
    throw new Error(`Falha ao salvar aluno: ${error.message}`);
  }
  return mapStudent((data || {}) as DbRow);
}

export async function createStudentRemote(supabase: SupabaseClient, student: Student) {
  const { data, error } = await supabase
    .from("students")
    .insert({
      id: student.id,
      name: student.name,
      phone: student.phone,
      email: student.email,
      avatar: student.avatar,
      instagram: student.instagram,
      status: student.status,
      plan: student.plan,
      monthly_value: student.monthlyValue,
      payment_day: student.paymentDay,
      categories: student.categories,
      joined_at: student.joinedAt,
      frequency: student.frequency,
      total_classes: student.totalClasses,
      notes: student.notes,
      professor_notes: student.professorNotes || "",
      attendance_history: student.attendanceHistory || [],
      auth_user_id: student.authUserId ?? null,
      student_role: student.studentRole || "aluno",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(describeStudentInsertFailure(error.message));
  }
  return mapStudent((data || {}) as DbRow);
}

export async function createLessonRemote(supabase: SupabaseClient, lesson: Lesson): Promise<Lesson> {
  const { data, error } = await supabase.from("lessons").insert(serializeLesson(lesson)).select("*").single();
  if (error) {
    throw new Error(`Falha ao criar aula: ${error.message}`);
  }
  return mapLesson((data || {}) as DbRow);
}

export async function updateLessonRemote(
  supabase: SupabaseClient,
  lessonId: string,
  updates: Partial<Lesson>,
): Promise<void> {
  const payload = serializeLessonPatch(updates);
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase.from("lessons").update(payload).eq("id", lessonId);
  if (error) {
    throw new Error(`Falha ao atualizar aula: ${error.message}`);
  }
}

export async function deleteLessonRemote(supabase: SupabaseClient, lessonId: string): Promise<void> {
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (error) {
    throw new Error(`Falha ao remover aula: ${error.message}`);
  }
}

export async function markPaymentPaidRemote(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_date: new Date().toISOString().slice(0, 10), method: "pix" })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Falha ao marcar pagamento: ${error.message}`);
  }
  return mapPayment((data || {}) as DbRow);
}

export async function uploadAvatarToStorage(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<string> {
  const cleanUserId = userId.trim();
  if (!cleanUserId) throw new Error("ID de usuário inválido para upload de avatar.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${cleanUserId}/avatar-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (uploadError) throw new Error(`Falha ao enviar avatar: ${uploadError.message}`);
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Não foi possível obter URL pública do avatar.");
  return data.publicUrl;
}

export async function uploadPaymentProofToStorage(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<string> {
  const cleanUserId = userId.trim();
  if (!cleanUserId) throw new Error("ID do usuário inválido para comprovante.");
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${cleanUserId}/proof-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
  if (uploadError) throw new Error(`Falha ao enviar comprovante: ${uploadError.message}`);
  // Retorna o path (não a URL assinada) para que a URL seja gerada sob demanda e nunca expire.
  return path;
}

/** Gera URL assinada temporária (1h) para visualização de um comprovante. Chame no momento de exibir. */
export async function getPaymentProofSignedUrl(
  supabase: SupabaseClient,
  path: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) {
    throw new Error(`Falha ao gerar URL do comprovante: ${error?.message || "sem URL assinada"}`);
  }
  return data.signedUrl;
}

export async function submitStudentProofRemote(
  supabase: SupabaseClient,
  id: string,
  payload: {
    note: string;
    attachment?: { url: string; fileName: string; mime: string } | null;
  },
) {
  const base: Record<string, unknown> = {
    student_proof_note: payload.note.trim(),
    student_proof_submitted_at: new Date().toISOString(),
  };
  if (payload.attachment === null) {
    base.student_proof_data_url = null;
    base.student_proof_file_name = null;
    base.student_proof_mime = null;
  } else if (payload.attachment) {
    base.student_proof_data_url = payload.attachment.url;
    base.student_proof_file_name = payload.attachment.fileName;
    base.student_proof_mime = payload.attachment.mime;
  }

  const { data, error } = await supabase.from("payments").update(base).eq("id", id).select("*").single();

  if (error) {
    throw new Error(`Falha ao registrar comprovante: ${error.message}`);
  }
  return mapPayment((data || {}) as DbRow);
}

export async function fetchStaffAccessRole(
  supabase: SupabaseClient,
  email: string,
): Promise<"admin" | "coach" | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("staff_access")
    .select("role")
    .eq("email", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao validar acesso staff: ${error.message}`);
  }

  const role = String((data as DbRow | null)?.role || "").toLowerCase();
  if (role === "admin" || role === "coach") return role;
  return null;
}

function mapPostTime(iso: string): string {
  if (!iso) return "agora";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "agora";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function fetchFeedPostsRemote(supabase: SupabaseClient, currentUserId: string): Promise<Post[]> {
  const modern = await supabase
    .from("feed_posts")
    .select("id,author_name,author_avatar,author_role,content,media_url,created_at,pinned,is_official,target_role,deleted_at,feed_post_comments(id,user_name,user_avatar,text,created_at),feed_post_likes(user_id)")
    .is("deleted_at", null)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(80);
  let data = modern.data as DbRow[] | null;
  let error = modern.error;

  // Backward compatibility: if moderation columns aren't migrated yet, fallback to legacy query.
  if (error && /pinned|is_official|target_role|deleted_at|column/i.test(error.message)) {
    const legacy = await supabase
      .from("feed_posts")
      .select("id,author_name,author_avatar,author_role,content,media_url,created_at,feed_post_comments(id,user_name,user_avatar,text,created_at),feed_post_likes(user_id)")
      .order("created_at", { ascending: false })
      .limit(80);
    data = legacy.data as DbRow[] | null;
    error = legacy.error;
  }

  if (error) {
    throw new Error(`Falha ao carregar feed: ${error.message}`);
  }

  return (data || []).map((row: DbRow) => {
    const likes = Array.isArray(row.feed_post_likes) ? (row.feed_post_likes as DbRow[]) : [];
    const commentsRaw = Array.isArray(row.feed_post_comments) ? (row.feed_post_comments as DbRow[]) : [];
    const comments = commentsRaw
      .sort((a, b) => asString(a.created_at).localeCompare(asString(b.created_at)))
      .map((comment) => ({
        user: asString(comment.user_name, "Usuário"),
        avatar: asString(comment.user_avatar, "user"),
        text: asString(comment.text),
        time: mapPostTime(asString(comment.created_at)),
      }));
    const authorRole = asString(row.author_role, "aluno");
    return {
      id: asString(row.id),
      user: {
        name: asString(row.author_name, "Usuário"),
        avatar: asString(row.author_avatar, "user"),
        isPro: authorRole === "admin" || authorRole === "coach",
      },
      time: mapPostTime(asString(row.created_at)),
      content: asString(row.content),
      media: asString(row.media_url) || null,
      likes: likes.length,
      comments,
      isLiked: likes.some((like) => asString(like.user_id) === currentUserId),
      isSaved: false,
      pinned: Boolean(row.pinned),
      isOfficial: Boolean(row.is_official),
      targetRole: (asString(row.target_role, "all") as Post["targetRole"]) || "all",
      deletedAt: (row.deleted_at as string | null) ?? null,
    } satisfies Post;
  });
}

export async function createFeedPostRemote(
  supabase: SupabaseClient,
  payload: {
    authorName: string;
    authorAvatar: string;
    authorRole: string;
    content: string;
    mediaUrl: string | null;
    pinned?: boolean;
    isOfficial?: boolean;
    targetRole?: "all" | "student" | "coach";
  },
): Promise<void> {
  const { error } = await supabase.from("feed_posts").insert({
    author_name: payload.authorName,
    author_avatar: payload.authorAvatar,
    author_role: payload.authorRole,
    content: payload.content,
    media_url: payload.mediaUrl,
    pinned: payload.pinned ?? false,
    is_official: payload.isOfficial ?? false,
    target_role: payload.targetRole ?? "all",
  });
  if (error) {
    throw new Error(`Falha ao publicar post: ${error.message}`);
  }
}

export async function updateFeedPostModerationRemote(
  supabase: SupabaseClient,
  postId: string,
  patch: { pinned?: boolean; isOfficial?: boolean; targetRole?: "all" | "student" | "coach" },
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.pinned !== undefined) payload.pinned = patch.pinned;
  if (patch.isOfficial !== undefined) payload.is_official = patch.isOfficial;
  if (patch.targetRole !== undefined) payload.target_role = patch.targetRole;
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase.from("feed_posts").update(payload).eq("id", postId);
  if (error) throw new Error(`Falha ao moderar post: ${error.message}`);
}

export async function softDeleteFeedPostRemote(supabase: SupabaseClient, postId: string): Promise<void> {
  const { error } = await supabase.from("feed_posts").update({ deleted_at: new Date().toISOString() }).eq("id", postId);
  if (error) throw new Error(`Falha ao remover post: ${error.message}`);
}

export async function toggleFeedPostLikeRemote(supabase: SupabaseClient, postId: string, userId: string): Promise<void> {
  const { data: existing, error: checkError } = await supabase
    .from("feed_post_likes")
    .select("post_id,user_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  if (checkError) {
    throw new Error(`Falha ao verificar curtida: ${checkError.message}`);
  }

  if (existing) {
    const { error } = await supabase.from("feed_post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw new Error(`Falha ao remover curtida: ${error.message}`);
    return;
  }

  const { error } = await supabase.from("feed_post_likes").insert({ post_id: postId, user_id: userId });
  if (error) {
    throw new Error(`Falha ao registrar curtida: ${error.message}`);
  }
}

export async function addFeedCommentRemote(
  supabase: SupabaseClient,
  payload: { postId: string; userId: string; userName: string; userAvatar: string; text: string },
): Promise<void> {
  const { error } = await supabase.from("feed_post_comments").insert({
    post_id: payload.postId,
    user_id: payload.userId,
    user_name: payload.userName,
    user_avatar: payload.userAvatar,
    text: payload.text,
  });
  if (error) {
    throw new Error(`Falha ao comentar no post: ${error.message}`);
  }
}

export async function createPublicLeadRemote(
  supabase: SupabaseClient,
  payload: { name: string; phone: string; email: string; instagram: string; avatar: string; authUserId?: string | null },
): Promise<void> {
  const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { error } = await supabase.from("students").insert({
    id,
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    avatar: payload.avatar,
    instagram: payload.instagram,
    status: "pending",
    plan: "mensal",
    monthly_value: 0,
    payment_day: 10,
    categories: [],
    joined_at: new Date().toISOString().slice(0, 10),
    frequency: 0,
    total_classes: 0,
    notes: "Cadastro público",
    professor_notes: "",
    attendance_history: [],
    auth_user_id: payload.authUserId ?? null,
  });
  if (error) {
    throw new Error(`Falha ao registrar cadastro público: ${error.message}`);
  }

  // 🔔 Dispara notificação para admin de novo aluno cadastrado
  try {
    await insertNotificationRemote(supabase, {
      type: "new_student",
      title: "🆕 Novo Aluno Cadastrado",
      message: `${payload.name} se cadastrou e aguarda aprovação.`,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      read: false,
      studentId: id,
      isGlobal: true, // Todos os admins veem
    });
  } catch {
    // Fire-and-forget: falha na notif não interrompe o cadastro
  }
}

// ─── Training Plans ─────────────────────────────────────────────────────────

function mapTrainingPlan(row: DbRow): TrainingPlan {
  const desc = row.description ?? row.description;
  const endDate = row.end_date ?? row.endDate;
  return {
    id: asString(row.id),
    coachId: asString(row.coach_id ?? row.coachId, ""),
    studentId: asString(row.student_id ?? row.studentId),
    title: asString(row.title),
    description: desc ? String(desc) : undefined,
    startDate: asString(row.start_date ?? row.startDate, new Date().toISOString().split("T")[0]),
    endDate: endDate ? String(endDate) : undefined,
    status: (row.status ?? "active") as PlanStatus,
    exercises: Array.isArray(row.exercises) ? row.exercises : [],
    createdAt: asString(row.created_at ?? row.createdAt, new Date().toISOString()),
    updatedAt: asString(row.updated_at ?? row.updatedAt, new Date().toISOString()),
  };
}

function serializeTrainingPlan(plan: TrainingPlan) {
  return {
    id: plan.id,
    coach_id: plan.coachId,
    student_id: plan.studentId,
    title: plan.title,
    description: plan.description ?? null,
    start_date: plan.startDate,
    end_date: plan.endDate ?? null,
    status: plan.status,
    exercises: plan.exercises ?? [],
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  };
}

function serializeTrainingPlanPatch(patch: Partial<Omit<TrainingPlan, "id">>) {
  const payload: Record<string, unknown> = {};
  if (patch.coachId !== undefined) payload.coach_id = patch.coachId;
  if (patch.studentId !== undefined) payload.student_id = patch.studentId;
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.startDate !== undefined) payload.start_date = patch.startDate;
  if (patch.endDate !== undefined) payload.end_date = patch.endDate;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.exercises !== undefined) payload.exercises = patch.exercises;
  payload.updated_at = new Date().toISOString();
  return payload;
}

export async function fetchTrainingPlansRemote(supabase: SupabaseClient): Promise<TrainingPlan[]> {
  const { data, error } = await supabase
    .from("training_plans")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao carregar planos de treino: ${error.message}`);
  }

  return (data || []).map((row) => mapTrainingPlan(row as DbRow));
}

export async function upsertTrainingPlanRemote(supabase: SupabaseClient, plan: TrainingPlan): Promise<TrainingPlan> {
  const { data, error } = await supabase
    .from("training_plans")
    .upsert(serializeTrainingPlan(plan), { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Falha ao salvar plano de treino: ${error.message}`);
  }

  return mapTrainingPlan((data || {}) as DbRow);
}

export async function updateTrainingPlanRemote(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Omit<TrainingPlan, "id">>,
): Promise<void> {
  const payload = serializeTrainingPlanPatch(patch);
  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase.from("training_plans").update(payload).eq("id", id);

  if (error) {
    throw new Error(`Falha ao atualizar plano de treino: ${error.message}`);
  }
}

export async function deleteTrainingPlanRemote(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("training_plans").delete().eq("id", id);

  if (error) {
    throw new Error(`Falha ao remover plano de treino: ${error.message}`);
  }
}

// ─── Catalog (Categories + Venues) ─────────────────────────────────────────

function mapCategory(row: DbRow): LessonCategory {
  return {
    id: asString(row.id),
    name: asString(row.name),
    color: asString(row.color, "#EAB308"),
    emoji: asString(row.emoji, "🏐"),
    maxStudents: asNumber(row.max_students ?? row.maxStudents, 12),
    defaultPrice: asNumber(row.default_price ?? row.defaultPrice),
    isCustom: Boolean(row.is_custom ?? row.isCustom),
  };
}

function mapVenue(row: DbRow): Venue {
  return {
    id: asString(row.id),
    name: asString(row.name),
    photo: asString(row.photo),
    address: asString(row.address),
    lat: asNumber(row.lat),
    lng: asNumber(row.lng),
  };
}

export async function fetchCatalogRemote(
  supabase: SupabaseClient,
): Promise<{ categories: LessonCategory[]; venues: Venue[] }> {
  const [catRes, venueRes] = await Promise.all([
    supabase.from("lesson_categories").select("*").order("name", { ascending: true }),
    supabase.from("venues").select("*").order("name", { ascending: true }),
  ]);

  if (catRes.error) throw new Error(`Falha ao carregar categorias: ${catRes.error.message}`);
  if (venueRes.error) throw new Error(`Falha ao carregar locais: ${venueRes.error.message}`);

  return {
    categories: (catRes.data || []).map((r) => mapCategory(r as DbRow)),
    venues: (venueRes.data || []).map((r) => mapVenue(r as DbRow)),
  };
}

export async function upsertCategoryRemote(
  supabase: SupabaseClient,
  cat: LessonCategory,
): Promise<LessonCategory> {
  const { data, error } = await supabase
    .from("lesson_categories")
    .upsert(
      {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        emoji: cat.emoji,
        max_students: cat.maxStudents,
        default_price: cat.defaultPrice,
        is_custom: cat.isCustom,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao salvar categoria: ${error.message}`);
  return mapCategory((data || {}) as DbRow);
}

export async function deleteCategoryRemote(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("lesson_categories").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover categoria: ${error.message}`);
}

export async function upsertVenueRemote(
  supabase: SupabaseClient,
  venue: Venue,
): Promise<Venue> {
  const { data, error } = await supabase
    .from("venues")
    .upsert(
      {
        id: venue.id,
        name: venue.name,
        photo: venue.photo,
        address: venue.address,
        lat: venue.lat,
        lng: venue.lng,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao salvar local: ${error.message}`);
  return mapVenue((data || {}) as DbRow);
}

export async function deleteVenueRemote(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("venues").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover local: ${error.message}`);
}

// ─── XP Log ────────────────────────────────────────────────────────────────

export interface XpLogEntry {
  id: string;
  studentId: string;
  points: number;
  type: "evaluation" | "checkin" | "feedback" | "feed_like" | "feed_comment" | "training_completed";
  description?: string;
  relatedId?: string;
  createdAt: string;
}

function mapXpLogEntry(row: DbRow): XpLogEntry {
  return {
    id: asString(row.id),
    studentId: asString(row.student_id ?? row.studentId),
    points: asNumber(row.points),
    type: asString(row.type) as XpLogEntry["type"],
    description: asString(row.description) || undefined,
    relatedId: asString(row.related_id ?? row.relatedId) || undefined,
    createdAt: asString(row.created_at ?? row.createdAt),
  };
}

export async function fetchXpLogEntriesRemote(
  supabase: SupabaseClient,
  studentId: string,
  limit = 10
): Promise<XpLogEntry[]> {
  const { data, error } = await supabase
    .from("xp_log")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`Falha ao carregar histórico de XP: ${error.message}`);
    return [];
  }

  return (data || []).map((row) => mapXpLogEntry(row as DbRow));
}

// Phase 5: Live Lesson Panel

export type CoachMessage = {
  id: string;
  lessonId: string;
  sessionId: string;
  coachId: string;
  messageType: "message" | "alert" | "activity" | "duration_change";
  content: string;
  targetStudentId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type StudentActivity = {
  id: string;
  lessonId: string;
  studentId: string;
  status: "present" | "exercising" | "resting" | "injured" | "absent";
  updatedAt: string;
  updatedBy: string;
};

export type LessonSession = {
  id: string;
  lessonId: string;
  startedAt: string;
  endedAt?: string;
  currentActivity?: string;
  coachNotes?: string;
  createdBy: string;
};

export async function startLessonSessionRemote(
  supabase: SupabaseClient,
  lessonId: string,
  coachId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("lesson_sessions")
    .insert({
      lesson_id: lessonId,
      started_at: new Date().toISOString(),
      created_by: coachId,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao iniciar aula ao vivo: ${error.message}`);
  }

  return asString(data?.id || "");
}

export async function endLessonSessionRemote(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  const { error } = await supabase
    .from("lesson_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    throw new Error(`Falha ao encerrar aula ao vivo: ${error.message}`);
  }
}

export async function sendCoachMessageRemote(
  supabase: SupabaseClient,
  lessonId: string,
  sessionId: string,
  coachId: string,
  message: {
    messageType: CoachMessage["messageType"];
    content: string;
    targetStudentId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<string> {
  const { data, error } = await supabase
    .from("lesson_coach_messages")
    .insert({
      lesson_id: lessonId,
      session_id: sessionId,
      coach_id: coachId,
      message_type: message.messageType,
      content: message.content,
      target_student_id: message.targetStudentId || null,
      metadata: message.metadata || null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao enviar mensagem: ${error.message}`);
  }

  return asString(data?.id || "");
}

export async function updateStudentActivityRemote(
  supabase: SupabaseClient,
  lessonId: string,
  studentId: string,
  status: StudentActivity["status"],
  coachId: string
): Promise<void> {
  const { error } = await supabase
    .from("lesson_student_activity")
    .upsert(
      {
        lesson_id: lessonId,
        student_id: studentId,
        status,
        updated_at: new Date().toISOString(),
        updated_by: coachId,
      },
      { onConflict: "lesson_id, student_id" }
    );

  if (error) {
    throw new Error(`Falha ao atualizar atividade do aluno: ${error.message}`);
  }
}

export async function fetchCoachMessagesRemote(
  supabase: SupabaseClient,
  lessonId: string,
  limit = 50
): Promise<CoachMessage[]> {
  const { data, error } = await supabase
    .from("lesson_coach_messages")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error(`Falha ao carregar mensagens: ${error.message}`);
    return [];
  }

  return (data || []).map((row) => ({
    id: asString(row.id),
    lessonId: asString(row.lesson_id ?? row.lessonId),
    sessionId: asString(row.session_id ?? row.sessionId),
    coachId: asString(row.coach_id ?? row.coachId),
    messageType: (asString(row.message_type ?? row.messageType) as CoachMessage["messageType"]) || "message",
    content: asString(row.content),
    targetStudentId: asString(row.target_student_id ?? row.targetStudentId) || undefined,
    metadata: typeof row.metadata === "object" ? row.metadata : undefined,
    createdAt: asString(row.created_at ?? row.createdAt),
  }));
}

export async function fetchStudentActivityRemote(
  supabase: SupabaseClient,
  lessonId: string
): Promise<StudentActivity[]> {
  const { data, error } = await supabase
    .from("lesson_student_activity")
    .select("*")
    .eq("lesson_id", lessonId);

  if (error) {
    console.error(`Falha ao carregar atividades: ${error.message}`);
    return [];
  }

  return (data || []).map((row) => ({
    id: asString(row.id),
    lessonId: asString(row.lesson_id ?? row.lessonId),
    studentId: asString(row.student_id ?? row.studentId),
    status: (asString(row.status) as StudentActivity["status"]) || "present",
    updatedAt: asString(row.updated_at ?? row.updatedAt),
    updatedBy: asString(row.updated_by ?? row.updatedBy),
  }));
}

export async function fetchLessonSessionRemote(
  supabase: SupabaseClient,
  lessonId: string
): Promise<LessonSession | null> {
  const { data, error } = await supabase
    .from("lesson_sessions")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: asString(data.id),
    lessonId: asString(data.lesson_id ?? data.lessonId),
    startedAt: asString(data.started_at ?? data.startedAt),
    endedAt: asString(data.ended_at ?? data.endedAt) || undefined,
    currentActivity: asString(data.current_activity ?? data.currentActivity) || undefined,
    coachNotes: asString(data.coach_notes ?? data.coachNotes) || undefined,
    createdBy: asString(data.created_by ?? data.createdBy),
  };
}
