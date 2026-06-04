import type { Student, User } from "@/context/types";

/** Resolve o id CRM (`students.id`) do aluno logado — não confundir com `auth.users.id`. */
export function resolveStudentCrmId(user: User | null, students: Student[]): string | null {
  if (!user || user.role !== "aluno") return null;

  const authSid = user.authSubjectId?.trim() || "";
  if (authSid) {
    const byAuth = students.find((s) => s.authUserId === authSid);
    if (byAuth) return byAuth.id;
  }

  const email = user.email?.trim().toLowerCase();
  if (email) {
    const byEmail = students.find((s) => s.email.trim().toLowerCase() === email);
    if (byEmail) return byEmail.id;
  }

  const byId = students.find((s) => s.id === user.id);
  if (byId) return byId.id;

  return null;
}
