import type { Student, User } from "@/context/types";
import { transactionalSeedDefaults } from "@/lib/willLocalDataPolicy";
import { wtLs as ls } from "@/lib/willLocalStorage";

export type BuildSessionUserCustom = {
  id?: string;
  name?: string;
  avatar?: string;
  email?: string;
  /** Supabase auth.users.id — used to match students.auth_user_id when catalog is live DB */
  authSubjectId?: string;
};

/**
 * Monta o objeto `User` para sessão local ou Supabase (demo profiles + vínculo com `students`).
 */
export function buildSessionUser(
  role: "admin" | "coach" | "aluno" | "visitor" | null,
  custom?: BuildSessionUserCustom,
  catalogStudents?: Student[],
): User {
  if (role === null) {
    return {
      id: custom?.authSubjectId || custom?.id || "unknown",
      name: custom?.name || "Visitante",
      role: null,
      avatar: custom?.avatar || "user",
      email: custom?.email,
      authSubjectId: custom?.authSubjectId,
    };
  }

  const users: Record<"admin" | "coach" | "aluno" | "visitor", User> = {
    admin: { id: "admin1", name: "Will Monteiro", role: "admin", avatar: "Will" },
    coach: { id: "coach1", name: "Rafael Coach", role: "coach", avatar: "Coach" },
    aluno: { id: "s1", name: "Ricardo Alves", role: "aluno", avatar: "Ricardo" },
    visitor: { id: "visitor1", name: "Visitante", role: "visitor", avatar: "user" },
  };
  const baseUser = users[role] || { id: "unknown", name: "Visitante", role: null, avatar: "user" };
  const persistedProfiles = ls.get<Record<string, Partial<User>>>("userProfiles", {});
  const persistedStudents = catalogStudents ?? ls.get("students", transactionalSeedDefaults().students);
  const normalizedEmail = (custom?.email || "").trim().toLowerCase();

  let linkedStudent: Student | null = null;
  if (role === "aluno") {
    const cat = persistedStudents;
    const authSid = custom?.authSubjectId?.trim();
    if (authSid) {
      linkedStudent = cat.find((s) => s.authUserId === authSid) ?? null;
    }
    if (!linkedStudent && normalizedEmail) {
      linkedStudent = cat.find((s) => s.email.trim().toLowerCase() === normalizedEmail) ?? null;
    }
    if (!linkedStudent && custom?.id) {
      linkedStudent = cat.find((s) => s.id === custom.id) ?? null;
    }
    // Catálogo ainda não carregado (timing) — mas role já foi verificada pelo DB (resolveEffectiveSupabaseRole).
    // Retornamos role:"aluno" confiando na resolução — o perfil completo chega quando o catálogo sincronizar.
    // Conta sem matrícula real seria bloqueada antes de chegar aqui pelo oauthUserNeedsStudentSignupFlow.
    if (!linkedStudent && authSid && catalogStudents !== undefined) {
      // Catálogo carregado mas student não encontrado = sem matrícula real
      return {
        id: authSid,
        name: custom?.name || "Aluno",
        role: null,
        avatar: custom?.avatar || "user",
        email: custom?.email,
        authSubjectId: authSid,
      };
    }
    if (!linkedStudent && authSid) {
      // Catálogo não disponível — trusts role resolved from DB
      return {
        id: authSid,
        name: custom?.name || "Aluno",
        role: "aluno" as const,
        avatar: custom?.avatar || "user",
        email: custom?.email,
        authSubjectId: authSid,
      };
    }
    if (!linkedStudent) {
      linkedStudent = cat.find((s) => s.id === baseUser.id) ?? null;
    }
  }

  const profileKey = linkedStudent?.id || custom?.id || baseUser.id;

  return {
    ...baseUser,
    id: linkedStudent?.id || custom?.id || baseUser.id,
    ...persistedProfiles[profileKey],
    ...(custom?.name ? { name: custom.name } : {}),
    ...(custom?.avatar ? { avatar: custom.avatar } : {}),
    name: linkedStudent?.name || custom?.name || persistedProfiles[profileKey]?.name || baseUser.name,
    avatar: linkedStudent?.avatar || custom?.avatar || persistedProfiles[profileKey]?.avatar || baseUser.avatar,
  };
}
