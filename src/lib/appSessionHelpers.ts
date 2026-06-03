import type { Notification, Student, User } from "@/context/types";

/** Timeout padrão para fetch crítico ao vivo (evita shell eterno em rede ruim). */
export const CRITICAL_DATA_FETCH_TIMEOUT_MS = 28_000;

const secureCookieAttr = () =>
  typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";

/** Remove cookie de papel (logout / sessão encerrada). */
export function clearWtRoleCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `wt_role=; path=/; max-age=0; samesite=lax${secureCookieAttr()}`;
}

/**
 * Mantém `wt_role` alinhado ao middleware.
 * `user.role === null` = autenticado no Supabase sem linha de aluno → `pending_student` (só matrícula).
 */
export function syncWtRoleCookie(role: User["role"] | null | undefined): void {
  if (typeof document === "undefined") return;
  if (role === null) {
    document.cookie = `wt_role=pending_student; path=/; max-age=2592000; samesite=lax${secureCookieAttr()}`;
    return;
  }
  if (!role) {
    clearWtRoleCookie();
    return;
  }
  const cookieRole =
    role === "admin"
      ? "will_owner"
      : role === "coach"
        ? "professor"
        : role === "aluno"
          ? "student"
          : role === "visitor"
            ? "visitor"
            : "";
  if (!cookieRole) {
    clearWtRoleCookie();
    return;
  }
  document.cookie = `wt_role=${cookieRole}; path=/; max-age=2592000; samesite=lax${secureCookieAttr()}`;
}

export function filterDemoNotifications(rows: Notification[]): Notification[] {
  return rows.filter((n) => !String(n.id).startsWith("demo_"));
}

export function findLinkedStudentForAuth(
  authUserId: string | undefined,
  email: string,
  catalog: Student[],
): Student | null {
  const authSid = authUserId?.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (authSid) {
    const byAuth = catalog.find((s) => s.authUserId === authSid);
    if (byAuth) return byAuth;
  }
  if (normalizedEmail) {
    return catalog.find((s) => s.email.trim().toLowerCase() === normalizedEmail) ?? null;
  }
  return null;
}

export function withNetworkTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });
}
