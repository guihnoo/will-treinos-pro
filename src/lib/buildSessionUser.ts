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
  role: "admin" | "coach" | "aluno" | null,
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

  const users: Record<"admin" | "coach" | "aluno", User> = {
    admin: { id: "admin1", name: "Will Monteiro", role: "admin", avatar: "Will" },
    coach: { id: "coach1", name: "Rafael Coach", role: "coach", avatar: "Coach" },
    aluno: { id: "s1", name: "Ricardo Alves", role: "aluno", avatar: "Ricardo" },
  };
  const baseUser = users[role];
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
    // Conta Supabase sem matrícula: não herdar o mock s1 por acidente.
    if (!linkedStudent && authSid) {
      return {
        id: authSid,
        name: custom?.name || "Aluno",
        role: null,
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
