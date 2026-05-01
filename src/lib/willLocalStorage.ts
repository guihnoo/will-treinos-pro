/** Prefixo único para chaves persistidas pelo Will Treinos PRO (`wt_<nome>`). */
export const WT_LS_PREFIX = "wt_";

export function wtLsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const d = localStorage.getItem(WT_LS_PREFIX + key);
    if (!d) return fallback;
    const parsed = JSON.parse(d);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function wtLsSet(key: string, val: unknown): void {
  if (typeof window !== "undefined") localStorage.setItem(WT_LS_PREFIX + key, JSON.stringify(val));
}

/** Remove a entrada `wt_<key>` do localStorage. */
export function wtLsRemove(key: string): void {
  if (typeof window !== "undefined") localStorage.removeItem(WT_LS_PREFIX + key);
}

/** Remove várias chaves com prefixo `wt_` de uma vez. */
export function wtLsRemoveMany(keys: readonly string[]): void {
  if (typeof window === "undefined") return;
  for (const k of keys) localStorage.removeItem(WT_LS_PREFIX + k);
}

/**
 * Texto curto com compatibilidade a valores legados gravados sem JSON
 * (ex.: `v14` ou `Date#toDateString()` em texto puro).
 */
export function wtLsGetString(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(WT_LS_PREFIX + key);
  if (raw == null || raw === "") return fallback;
  try {
    const v = JSON.parse(raw);
    return typeof v === "string" ? v : fallback;
  } catch {
    return raw;
  }
}

export function wtLsSetString(key: string, val: string): void {
  wtLsSet(key, val);
}

/** Lê um JSON armazenado em `wt_<key>` ou retorna `null` se ausente/inválido. */
export function wtLsTryParse<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const d = localStorage.getItem(WT_LS_PREFIX + key);
  if (!d) return null;
  try {
    return JSON.parse(d) as T;
  } catch {
    return null;
  }
}

/**
 * Cache local do papel em modo mock / fluxos sem Supabase (chave histórica sem prefixo `wt_`).
 */
export const WT_LEGACY_ROLE_KEY = "will-role";

export function wtLegacyRoleGet(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WT_LEGACY_ROLE_KEY);
}

export function wtLegacyRoleSet(role: string): void {
  if (typeof window !== "undefined") localStorage.setItem(WT_LEGACY_ROLE_KEY, role);
}

export function wtLegacyRoleRemove(): void {
  if (typeof window !== "undefined") localStorage.removeItem(WT_LEGACY_ROLE_KEY);
}

/** Chaves `sessionStorage` com nome completo (fluxo login/OAuth/dev). */
export const WT_SESSION_DEV_IMPERSONATION_KEY = "wt_dev_impersonation";
export const WT_SESSION_POST_LOGIN_NEXT_KEY = "wt_post_login_next";

export function wtSessionGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(key);
}

export function wtSessionSet(key: string, value: string): void {
  if (typeof window !== "undefined") sessionStorage.setItem(key, value);
}

export function wtSessionRemove(key: string): void {
  if (typeof window !== "undefined") sessionStorage.removeItem(key);
}

/** Objeto compatível com o antigo `ls` inline do `AppContext`. */
export const wtLs = {
  get: wtLsGet,
  set: wtLsSet,
};
