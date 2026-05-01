import { WT_LS_PREFIX } from "@/lib/willLocalStorage";

/**
 * Política padrão do app: não semear dados fictícios.
 * Apenas mantém seed demo quando explicitamente habilitado.
 */
export function useEmptyTransactionalSeed(): boolean {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ENABLE_DEMO_SEED === "1") return false;
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_EMPTY_LOCAL_SEED === "1") return true;
  return true;
}

export function transactionalSeedDefaults() {
  return {
    students: [],
    lessons: [],
    payments: [],
    notifications: [],
    feedbacks: [],
    trainingPlans: [],
    posts: [],
  };
}

/** Remove só dados operacionais do localStorage (mantém categorias, locais, jornada, appConfig). */
export function clearTransactionalLocalStorage(): void {
  if (typeof window === "undefined") return;
  const keys = [
    "students",
    "lessons",
    "payments",
    "notifications",
    "feedbacks",
    "trainingPlans",
    "posts",
    "lessonRatings",
  ];
  keys.forEach((k) => window.localStorage.removeItem(WT_LS_PREFIX + k));
}
