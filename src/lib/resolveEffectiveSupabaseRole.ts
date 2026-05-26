import type { SupabaseClient, User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { Student } from "@/context/types";
import { findLinkedStudentForAuth } from "@/lib/appSessionHelpers";
import {
  computeEffectiveRole,
  isDevRootEmail,
  type DevImpersonation,
} from "@/lib/authPostLogin";
import { fetchStaffAccessRole } from "@/lib/supabasePersistence";

/**
 * Papel efetivo após JWT (`user_metadata`) + `staff_access` + vínculo opcional com catálogo `students`.
 * Se catalogStudents for undefined mas effectiveRole for null/aluno, carrega students do DB.
 */
export async function resolveEffectiveSupabaseRole(
  authUser: SupabaseAuthUser,
  devImpersonation: DevImpersonation,
  supabase: SupabaseClient | null,
  catalogStudents: Student[] | undefined,
): Promise<"admin" | "coach" | "aluno" | "visitor" | null> {
  let effectiveRole = computeEffectiveRole(authUser, devImpersonation);

  if (!isDevRootEmail(authUser.email) && supabase && authUser.email) {
    if (effectiveRole === null || effectiveRole === "aluno") {
      try {
        const accessRole = await fetchStaffAccessRole(supabase, authUser.email);
        if (accessRole) {
          effectiveRole = accessRole;
        }
      } catch {
        // Mantém fluxo sem staff table (não bloqueia login).
      }
    }
  }

  // Se ainda é aluno/null e não temos catálogo, carrega students do DB
  if (!isDevRootEmail(authUser.email) && (effectiveRole === "aluno" || effectiveRole === null) && catalogStudents === undefined && supabase) {
    try {
      const { data: students, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && students) {
        catalogStudents = (students as any[]).map((row: any) => ({
          id: row.id,
          authUserId: row.auth_user_id || null,
          email: row.email || "",
          name: row.name || "",
          phone: row.phone || "",
          avatar: row.avatar || "",
          status: row.status || "pending",
          studentRole: row.student_role || "aluno",
          instagram: row.instagram || "",
          plan: row.plan || "",
          monthlyValue: row.monthly_value || 0,
          paymentDay: row.payment_day || 1,
          categories: row.categories || [],
          joinedAt: row.joined_at || "",
          frequency: row.frequency || 0,
          totalClasses: row.total_classes || 0,
          notes: row.notes || "",
        } as Student));
      }
    } catch {
      // Falha silenciosa - continua com o effectiveRole atual
    }
  }

  // Após montar catalogStudents, encontrar o student atual e usar seu role
  if (catalogStudents && authUser.id) {
    const myStudent = catalogStudents.find(
      (s) => s.authUserId === authUser.id || s.email === authUser.email?.toLowerCase()
    );
    if (myStudent && myStudent.status === "active") {
      if (myStudent.studentRole === "observador") effectiveRole = "visitor";
      else if (myStudent.studentRole === "professor") effectiveRole = "coach";
      else if (myStudent.studentRole === "aluno") effectiveRole = "aluno";
    }
  }

  return effectiveRole;
}
