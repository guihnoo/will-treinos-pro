import { LEGACY_BRIDGE } from "@/domain/v1/mockOrm";
import { hasSupabaseEnv } from "@/lib/supabaseClient";

const WT_LS_PREFIX = "wt_";

/**
 * Quando true, o primeiro load não injeta alunos/aulas/pagamentos mock — ideal para produção com Supabase
 * ou ambiente limpo com NEXT_PUBLIC_EMPTY_LOCAL_SEED=1.
 */
export function useEmptyTransactionalSeed(): boolean {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_EMPTY_LOCAL_SEED === "1") return true;
  return hasSupabaseEnv();
}

export function transactionalSeedDefaults() {
  const empty = useEmptyTransactionalSeed();
  return {
    students: empty ? [] : LEGACY_BRIDGE.MOCK_STUDENTS,
    lessons: empty ? [] : LEGACY_BRIDGE.MOCK_LESSONS,
    payments: empty ? [] : LEGACY_BRIDGE.MOCK_PAYMENTS,
    notifications: empty ? [] : LEGACY_BRIDGE.MOCK_NOTIFICATIONS,
    feedbacks: empty ? [] : LEGACY_BRIDGE.MOCK_FEEDBACKS,
    trainingPlans: empty ? [] : LEGACY_BRIDGE.MOCK_TRAINING_PLANS,
    posts: empty ? [] : LEGACY_BRIDGE.MOCK_POSTS,
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
