import type { AppRole } from "./contracts";

export type AppPrefix = "/will" | "/prof" | "/aluno" | "/lead";

export const PREFIX_ROLE_GUARD: Record<AppPrefix, AppRole[]> = {
  "/will": ["will_owner"],
  "/prof": ["professor"],
  "/aluno": ["student"],
  "/lead": ["lead", "will_owner"],
};

export const LEGACY_ROLE_TO_APP_ROLE: Record<"admin" | "coach" | "aluno", AppRole> = {
  admin: "will_owner",
  coach: "professor",
  aluno: "student",
};

export function canAccessPrefix(role: AppRole | null | undefined, prefix: AppPrefix): boolean {
  if (!role) return false;
  return PREFIX_ROLE_GUARD[prefix].includes(role);
}

export function normalizeRole(raw: string | null | undefined): AppRole | null {
  if (!raw) return null;
  if (raw === "will_owner" || raw === "professor" || raw === "student" || raw === "lead") return raw;
  if (raw === "admin") return "will_owner";
  if (raw === "coach") return "professor";
  if (raw === "aluno") return "student";
  return null;
}
