"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Lesson,
  LessonStatus,
  Notification,
  Payment,
  PaymentStatus,
  Student,
  StudentStatus,
} from "@/context/types";
import { paymentReferenceForDate } from "@/lib/dateUtils";

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
  };
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
  };
}

export type LiveAppData = {
  students: Student[];
  payments: Payment[];
  lessons: Lesson[];
  notifications: Notification[];
};

export async function fetchLiveAppData(supabase: SupabaseClient): Promise<LiveAppData> {
  const [studentsRes, paymentsRes, lessonsRes, notificationsRes] = await Promise.all([
    supabase.from("students").select("*").order("created_at", { ascending: false }),
    supabase.from("payments").select("*").order("due_date", { ascending: false }),
    supabase.from("lessons").select("*").order("date", { ascending: true }),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }),
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
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Falha ao criar aluno: ${error.message}`);
  }
  return mapStudent((data || {}) as DbRow);
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

export async function submitStudentProofRemote(
  supabase: SupabaseClient,
  id: string,
  payload: {
    note: string;
    attachment?: { dataUrl: string; fileName: string; mime: string } | null;
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
    base.student_proof_data_url = payload.attachment.dataUrl;
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
