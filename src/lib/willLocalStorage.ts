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

/** Objeto compatível com o antigo `ls` inline do `AppContext`. */
export const wtLs = {
  get: wtLsGet,
  set: wtLsSet,
};
