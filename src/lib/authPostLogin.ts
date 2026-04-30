import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { appRoleFromSupabaseUser } from "@/lib/supabaseClient";

export type DevImpersonation = "admin" | "coach" | "aluno";

export function isDevRootEmail(email: string | null | undefined): boolean {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return false;
  const list = String(process.env.NEXT_PUBLIC_DEV_ROOT_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(normalizedEmail);
}

export function readDevImpersonationFromStorage(): DevImpersonation {
  if (typeof window === "undefined") return "admin";
  const v = sessionStorage.getItem("wt_dev_impersonation");
  if (v === "coach" || v === "aluno" || v === "admin") return v;
  return "admin";
}

/** Effective app role: dev-root emails follow runtime impersonation; everyone else uses JWT metadata. */
export function computeEffectiveRole(
  authUser: SupabaseAuthUser,
  impersonation: DevImpersonation,
): "admin" | "coach" | "aluno" {
  const authentic = appRoleFromSupabaseUser(authUser.user_metadata?.role ?? authUser.app_metadata?.role);
  if (isDevRootEmail(authUser.email)) return impersonation;
  return authentic;
}

/** Used after OAuth/password redirect when we already have a Supabase session user. */
export function postLoginRouteFromAuthUser(authUser: SupabaseAuthUser): "/treinos" | "/dashboard" {
  const role = computeEffectiveRole(authUser, readDevImpersonationFromStorage());
  return role === "aluno" ? "/treinos" : "/dashboard";
}
