"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { User, Role, Venue, WorkHours, LessonCategory, Student, Lesson, Payment, Notification, PerformanceFeedback, TrainingPlan, QuickMessage, StudentStatus, PaymentStatus, Post, LessonRating, LessonRatingDraft, AppConfig, StudentProfileEditPolicy } from "./types";
import { LEGACY_BRIDGE } from "@/domain/v1/mockOrm";
import { dueDateForBillingMonth, localDateISO, paymentReferenceForDate } from "@/lib/dateUtils";
import {
  computeEffectiveRole,
  isDevRootEmail,
  type DevImpersonation,
} from "@/lib/authPostLogin";

export type { DevImpersonation } from "@/lib/authPostLogin";
import { getSupabaseClient, hasSupabaseEnv } from "@/lib/supabaseClient";
import { transactionalSeedDefaults } from "@/lib/willLocalDataPolicy";
import {
  WT_SESSION_DEV_IMPERSONATION_KEY,
  wtLegacyRoleGet,
  wtLegacyRoleRemove,
  wtLegacyRoleSet,
  wtLs as ls,
  wtLsGetString,
  wtLsSetString,
  wtSessionGet,
  wtSessionSet,
} from "@/lib/willLocalStorage";
import {

  addFeedCommentRemote,
  createLessonRemote,
  createFeedPostRemote,
  createStudentRemote,
  insertNotificationRemote,
  updateNotificationReadRemote,
  deleteLessonRemote,
  fetchFeedPostsRemote,
  fetchStaffAccessRole,
  fetchEnrollmentInviteRemote,
  fetchLiveAppData,
  insertPaymentRemote,
  markPaymentPaidRemote,
  upsertEnrollmentInviteRemote,
  softDeleteFeedPostRemote,
  submitStudentProofRemote,
  toggleFeedPostLikeRemote,
  updateFeedPostModerationRemote,
  uploadPaymentProofToStorage,
  updateLessonRemote,
  updateStudentRemote,
} from "@/lib/supabasePersistence";
import type { Provider, User as SupabaseAuthUser } from "@supabase/supabase-js";

const secureCookieAttr = () =>
  typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";

/** Remove cookie de papel (logout / sessão encerrada). */
function clearWtRoleCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `wt_role=; path=/; max-age=0; samesite=lax${secureCookieAttr()}`;
}

/**
 * Mantém `wt_role` alinhado ao middleware.
 * `user.role === null` = autenticado no Supabase sem linha de aluno → `pending_student` (só matrícula).
 */
function syncWtRoleCookie(role: User["role"] | null | undefined) {
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
    role === "admin" ? "will_owner" : role === "coach" ? "professor" : role === "aluno" ? "student" : "";
  if (!cookieRole) {
    clearWtRoleCookie();
    return;
  }
  document.cookie = `wt_role=${cookieRole}; path=/; max-age=2592000; samesite=lax${secureCookieAttr()}`;
}

function filterDemoNotifications(rows: Notification[]): Notification[] {
  return rows.filter((n) => !String(n.id).startsWith("demo_"));
}

function findLinkedStudentForAuth(authUserId: string | undefined, email: string, catalog: Student[]): Student | null {
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

const CRITICAL_DATA_FETCH_TIMEOUT_MS = 28_000;

function withNetworkTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
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

// Re-export types for convenience
export type { User, Role, Venue, WorkHours, LessonCategory, Student, Lesson, Payment, Notification, PerformanceFeedback, TrainingPlan, QuickMessage, StudentStatus, PaymentStatus, Post, LessonRating, LessonRatingDraft, AppConfig, StudentProfileEditPolicy };
const LS_VERSION = "v14"; // bump: force clean reset without mock transactional data

/** Contrato público do `AppProvider` — usar nos wrappers (`StudentsProvider`, etc.) para evitar drift de assinaturas. */
export interface AppContextType {
  user: User | null;
  authResolved: boolean;
  authError: string | null;
  usingSupabaseSession: boolean;
  criticalDataLoading: boolean;
  criticalDataError: string | null;
  /** Reexecuta fetch ao vivo (Supabase) após falha ou timeout; não altera sessão. */
  retryCriticalDataSync: () => Promise<void>;
  adminMode: "dashboard" | "coach";
  setAdminMode: (m: "dashboard" | "coach") => void;
  login: (role: Role) => void;
  loginWithPassword: (email: string, password: string) => Promise<{ ok: true; role: "admin" | "coach" | "aluno" } | { ok: false; message: string }>;
  loginWithOAuth: (provider: Provider) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
  // Data
  venues: Venue[];
  workHours: WorkHours;
  students: Student[];
  lessons: Lesson[];
  payments: Payment[];
  notifications: Notification[];
  categories: LessonCategory[];
  quickMessages: QuickMessage[];
  feedbacks: PerformanceFeedback[];
  trainingPlans: TrainingPlan[];
  // CRUD — Categories
  addCategory: (cat: Omit<LessonCategory, "id">) => void;
  updateCategory: (id: string, u: Partial<LessonCategory>) => void;
  deleteCategory: (id: string) => void;
  // CRUD — Venues
  addVenue: (v: Omit<Venue, "id">) => void;
  updateVenue: (id: string, u: Partial<Venue>) => void;
  deleteVenue: (id: string) => void;
  setWorkHours: (wh: WorkHours) => void;
  // CRUD — Lessons
  addLesson: (l: Omit<Lesson, "id">) => void;
  updateLesson: (id: string, u: Partial<Lesson>) => void;
  deleteLesson: (id: string) => void;
  addToWaitlist: (lessonId: string, studentId: string) => void;
  promoteFromWaitlist: (lessonId: string, studentId: string) => void;
  // CRUD — Students
  addStudent: (s: Omit<Student, "id">) => Promise<Student>;
  approveStudent: (id: string) => void;
  suspendStudent: (id: string) => void;
  updateStudent: (id: string, u: Partial<Student>) => void;
  /** Após aprovar com mensalidade: cria cobrança `pending` do mês corrente se ainda não existir. */
  seedPendingTuitionForStudent: (studentId: string, monthlyValue: number, paymentDay: number) => Promise<void>;
  // Payments
  markPayment: (id: string) => void;
  /** Aluno: registra comprovante (texto e/ou arquivo imagem/PDF; não altera status até o staff confirmar). */
  submitStudentPaymentProof: (
    id: string,
    payload: {
      note: string;
      attachment?: { file?: File; previewUrl?: string; fileName: string; mime: string } | null;
    },
  ) => void;
  // Notifications
  addNotification: (n: Omit<Notification, "id">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Feedback & Training
  addFeedback: (fb: Omit<PerformanceFeedback, "id">) => void;
  addTrainingPlan: (plan: Omit<TrainingPlan, "id">) => void;
  // Feed
  posts: Post[];
  addPost: (p: Omit<Post, "id">) => void;
  togglePostLike: (id: string) => void;
  addPostComment: (id: string, text: string, user: string, avatar: string) => void;
  moderatePost: (
    id: string,
    patch: { pinned?: boolean; isOfficial?: boolean; targetRole?: "all" | "student" | "coach" },
  ) => void;
  softDeletePost: (id: string) => void;
  // Check-in (legacy direct)
  checkInStudent: (lessonId: string, studentId: string, present: boolean) => void;
  // Professional check-in system
  requestCheckIn: (lessonId: string, studentId: string) => void;
  approveCheckIn: (lessonId: string, studentId: string, approvedBy: string) => void;
  rejectCheckIn: (lessonId: string, studentId: string) => void;
  endClassCheckIn: (lessonId: string, studentId: string) => void;
  // App config (admin editable — PIX, WhatsApp, etc.)
  appConfig: AppConfig;
  updateAppConfig: (patch: Partial<AppConfig>) => void;
  // Helpers
  updateUser: (id: string, updates: Partial<User>) => void;
  /** Dev root (NEXT_PUBLIC_DEV_ROOT_EMAILS): runtime role switch without re-login */
  isDevRoot: boolean;
  devImpersonation: DevImpersonation;
  setDevImpersonation: (role: DevImpersonation) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [usingSupabaseSession, setUsingSupabaseSession] = useState(false);
  const [criticalDataLoading, setCriticalDataLoading] = useState(false);
  const [criticalDataError, setCriticalDataError] = useState<string | null>(null);
  const [devImpersonation, setDevImpersonationState] = useState<DevImpersonation>(() => {
    if (typeof window === "undefined") return "admin";
    const v = wtSessionGet(WT_SESSION_DEV_IMPERSONATION_KEY);
    if (v === "coach" || v === "aluno" || v === "admin") return v;
    return "admin";
  });
  const supabaseAuthUserRef = useRef<SupabaseAuthUser | null>(null);
  /** Evita tela global de loading a cada TOKEN_REFRESHED — só o 1º bootstrap (ou retry explícito) bloqueia o shell. */
  const criticalBootstrapDoneRef = useRef(false);
  const criticalLoadInflightRef = useRef<Promise<void> | null>(null);
  const [adminMode, setAdminMode] = useState<"dashboard" | "coach">("dashboard");
  const [isMounted, setIsMounted] = useState(false);
  // Persisted state
  const [venues, setVenues] = useState<Venue[]>([]);
  const [workHours, setWorkHoursState] = useState<WorkHours>(LEGACY_BRIDGE.DEFAULT_WORK_HOURS);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<LessonCategory[]>([]);
  const [feedbacks, setFeedbacks] = useState<PerformanceFeedback[]>([]);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({
    pixKey: "",
    pixKeyType: "email",
    pixOwnerName: "Will Treinos",
    whatsappNumber: "5521999999999",
    enrollmentInviteCode: "",
  });

  // Init from LocalStorage or defaults
  useEffect(() => {
    setIsMounted(true);
    // Version check — clear stale cache on version bump
    const storedVersion = wtLsGetString("version", "");
    if (storedVersion !== LS_VERSION) {
      const keys = [
        "venues",
        "workHours",
        "students",
        "lessons",
        "payments",
        "notifications",
        "categories",
        "feedbacks",
        "trainingPlans",
        "posts",
        "lessonRatings",
      ];
      ls.removeMany(keys);
      wtLsSetString("version", LS_VERSION);
    }
    const tx = transactionalSeedDefaults();
    setVenues(ls.get("venues", LEGACY_BRIDGE.DEFAULT_VENUES));
    setWorkHoursState(ls.get("workHours", LEGACY_BRIDGE.DEFAULT_WORK_HOURS));
    setStudents(ls.get("students", tx.students));
    setLessons(ls.get("lessons", tx.lessons));
    setPayments(ls.get("payments", tx.payments));
    setNotifications(ls.get("notifications", tx.notifications));
    setCategories(ls.get("categories", LEGACY_BRIDGE.DEFAULT_CATEGORIES));
    setFeedbacks(ls.get("feedbacks", tx.feedbacks));
    setTrainingPlans(ls.get("trainingPlans", tx.trainingPlans));
    setPosts(ls.get("posts", tx.posts));
    setAppConfig(
      ls.get("appConfig", {
        pixKey: "",
        pixKeyType: "email",
        pixOwnerName: "Will Treinos",
        whatsappNumber: "5521999999999",
        enrollmentInviteCode: "",
      }),
    );
    const savedRole = wtLegacyRoleGet() as Role | null;
    if (savedRole && !hasSupabaseEnv()) loginUser(savedRole);
  }, []);

  /** Re-sync cookie when session user is known (do not clear on null here — first paint is still null after loginUser schedules state). */
  useEffect(() => {
    if (!isMounted || !user) return;
    syncWtRoleCookie(user.role);
  }, [user, isMounted]);

  // Persist on change
  useEffect(() => { if (isMounted) ls.set("venues", venues); }, [venues, isMounted]);
  useEffect(() => { if (isMounted) ls.set("workHours", workHours); }, [workHours, isMounted]);
  useEffect(() => {
    if (isMounted && !usingSupabaseSession) ls.set("students", students);
  }, [students, isMounted, usingSupabaseSession]);
  useEffect(() => {
    if (isMounted && !usingSupabaseSession) ls.set("lessons", lessons);
  }, [lessons, isMounted, usingSupabaseSession]);
  useEffect(() => {
    if (isMounted && !usingSupabaseSession) ls.set("payments", payments);
  }, [payments, isMounted, usingSupabaseSession]);
  useEffect(() => {
    if (isMounted && !usingSupabaseSession) ls.set("notifications", notifications);
  }, [notifications, isMounted, usingSupabaseSession]);
  useEffect(() => { if (isMounted) ls.set("categories", categories); }, [categories, isMounted]);
  useEffect(() => { if (isMounted) ls.set("feedbacks", feedbacks); }, [feedbacks, isMounted]);
  useEffect(() => { if (isMounted) ls.set("trainingPlans", trainingPlans); }, [trainingPlans, isMounted]);
  useEffect(() => {
    if (isMounted && !usingSupabaseSession) ls.set("posts", posts);
  }, [posts, isMounted, usingSupabaseSession]);
  useEffect(() => { if (isMounted) ls.set("appConfig", appConfig); }, [appConfig, isMounted]);

  /** Modo offline / sem sessão Supabase: gera código de convite só em localStorage. */
  useEffect(() => {
    if (!isMounted || usingSupabaseSession) return;
    setAppConfig((prev) => {
      if (prev.enrollmentInviteCode?.trim()) return prev;
      const code =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID().replace(/-/g, "").slice(0, 14)
          : `wt_${Date.now().toString(36)}`;
      return { ...prev, enrollmentInviteCode: code };
    });
  }, [isMounted, usingSupabaseSession]);

  /** Propaga alterações do código de convite para o Supabase (ex.: «Gerar novo código»). */
  useEffect(() => {
    if (!isMounted || !usingSupabaseSession) return;
    const code = appConfig.enrollmentInviteCode?.trim();
    if (!code) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const handle = window.setTimeout(() => {
      void upsertEnrollmentInviteRemote(supabase, code).catch(() => {
        /* migração opcional */
      });
    }, 800);
    return () => window.clearTimeout(handle);
  }, [appConfig.enrollmentInviteCode, isMounted, usingSupabaseSession]);

  const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const buildSessionUser = useCallback(
    (
      role: "admin" | "coach" | "aluno" | null,
      custom?: {
        id?: string;
        name?: string;
        avatar?: string;
        email?: string;
        /** Supabase auth.users.id — used to match students.auth_user_id when catalog is live DB */
        authSubjectId?: string;
      },
      catalogStudents?: Student[],
    ): User => {
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
    },
    [],
  );

  const loginUser = useCallback((role: Role) => {
    const safeRole: "admin" | "coach" | "aluno" = role === "admin" || role === "coach" || role === "aluno" ? role : "aluno";
    const mergedUser = buildSessionUser(safeRole);
    setUser(mergedUser);
    wtLegacyRoleSet(safeRole);
    syncWtRoleCookie(mergedUser.role);
  }, [buildSessionUser]);

  const applySupabaseSession = useCallback(
    async (authUser: SupabaseAuthUser, catalogStudents?: Student[]) => {
      supabaseAuthUserRef.current = authUser;
      let effectiveRole = computeEffectiveRole(authUser, devImpersonation);
      const supabase = getSupabaseClient();

      if (!isDevRootEmail(authUser.email) && supabase && authUser.email) {
        if (effectiveRole === null || effectiveRole === "aluno") {
          try {
            const accessRole = await fetchStaffAccessRole(supabase, authUser.email);
            if (accessRole) {
              effectiveRole = accessRole;
            }
          } catch {
            // Mantém fluxo sem staff table (não bloqueia login).
          }
        }
      }

      if (!isDevRootEmail(authUser.email) && effectiveRole === "aluno" && catalogStudents !== undefined) {
        const linked = findLinkedStudentForAuth(authUser.id, authUser.email || "", catalogStudents);
        if (!linked) {
          effectiveRole = null;
        }
      }

      const safeName =
        String(authUser.user_metadata?.full_name || "").trim() ||
        authUser.email?.split("@")[0] ||
        (effectiveRole === "admin" ? "Will Owner" : effectiveRole === "coach" ? "Coach" : "Visitante");
      const safeAvatar =
        String(authUser.user_metadata?.avatar_url || authUser.user_metadata?.avatar || "").trim() || safeName;
      const mergedUser = buildSessionUser(
        effectiveRole,
        {
          id: authUser.id,
          authSubjectId: authUser.id,
          name: safeName,
          avatar: safeAvatar,
          email: authUser.email || "",
        },
        catalogStudents,
      );
      setUser({
        ...mergedUser,
        email: authUser.email || undefined,
        authSubjectId: authUser.id,
      });
      if (mergedUser.role) {
        wtLegacyRoleSet(mergedUser.role);
      } else {
        wtLegacyRoleRemove();
      }
      syncWtRoleCookie(mergedUser.role);
    },
    [buildSessionUser, devImpersonation],
  );

  const setDevImpersonation = useCallback((role: DevImpersonation) => {
    setDevImpersonationState(role);
    if (typeof window !== "undefined") wtSessionSet(WT_SESSION_DEV_IMPERSONATION_KEY, role);
  }, []);

  const isDevRoot = useMemo(() => isDevRootEmail(user?.email), [user?.email]);

  const loadSupabaseCriticalData = useCallback(
    async (options?: { forceBlocking?: boolean }) => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível.");
        criticalBootstrapDoneRef.current = true;
        return;
      }

      if (criticalLoadInflightRef.current) {
        await criticalLoadInflightRef.current;
        return;
      }

      const forceBlocking = options?.forceBlocking === true;
      const blockingSpinner = forceBlocking || !criticalBootstrapDoneRef.current;

      const promise = (async () => {
        if (blockingSpinner) setCriticalDataLoading(true);
        setCriticalDataError(null);
        // Só zera listas no primeiro sync bloqueante; refresh em background (ex.: TOKEN_REFRESHED) não deve esvaziar o cockpit.
        if (blockingSpinner) {
          setStudents([]);
          setPayments([]);
          setLessons([]);
          setNotifications([]);
          setPosts([]);
        }
        try {
          const currentUserId = supabaseAuthUserRef.current?.id || "";
          const data = await withNetworkTimeout(
            fetchLiveAppData(supabase),
            CRITICAL_DATA_FETCH_TIMEOUT_MS,
            "A sincronização demorou demais. Verifique sua conexão e use Tentar novamente.",
          );
          let livePosts: Post[] = [];
          try {
            livePosts = await withNetworkTimeout(
              fetchFeedPostsRemote(supabase, currentUserId),
              CRITICAL_DATA_FETCH_TIMEOUT_MS,
              "Feed indisponível no momento.",
            );
          } catch {
            // Feed is non-critical for session bootstrap; keep login unlocked and show empty feed.
            livePosts = [];
          }
          setStudents(data.students);
          setPayments(data.payments);
          setLessons(data.lessons);
          setNotifications(filterDemoNotifications(data.notifications));
          setPosts(livePosts);
          if (supabaseAuthUserRef.current) {
            applySupabaseSession(supabaseAuthUserRef.current, data.students);
          }
          try {
            const inviteRemote = await fetchEnrollmentInviteRemote(supabase);
            setAppConfig((prev) => {
              let code = inviteRemote?.trim() || "";
              if (!code) {
                code = prev.enrollmentInviteCode?.trim() || "";
                if (!code) {
                  code =
                    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                      ? crypto.randomUUID().replace(/-/g, "").slice(0, 14)
                      : `wt_${Date.now().toString(36)}`;
                }
                void upsertEnrollmentInviteRemote(supabase, code).catch(() => {
                  /* migração app_settings pode não estar aplicada ainda */
                });
              }
              if (code === prev.enrollmentInviteCode) return prev;
              return { ...prev, enrollmentInviteCode: code };
            });
          } catch {
            /* não bloqueia bootstrap */
          }
        } catch (error) {
          setCriticalDataError(
            error instanceof Error ? error.message : "Falha ao sincronizar dados ao vivo com Supabase.",
          );
        } finally {
          if (blockingSpinner) setCriticalDataLoading(false);
          criticalBootstrapDoneRef.current = true;
        }
      })();

      criticalLoadInflightRef.current = promise;
      try {
        await promise;
      } finally {
        criticalLoadInflightRef.current = null;
      }
    },
    [applySupabaseSession],
  );

  const retryCriticalDataSync = useCallback(async () => {
    await loadSupabaseCriticalData({ forceBlocking: true });
  }, [loadSupabaseCriticalData]);

  // Bridge local-first state with real Supabase auth session.
  useEffect(() => {
    if (!isMounted) return;
    if (!hasSupabaseEnv()) {
      setAuthResolved(true);
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthError("Cliente Supabase indisponível.");
      setAuthResolved(true);
      return;
    }

    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        setAuthError(error.message);
        setAuthResolved(true);
        return;
      }
      if (data.session?.user) {
        setUsingSupabaseSession(true);
        applySupabaseSession(data.session.user);
        await loadSupabaseCriticalData();
      }
      setAuthResolved(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (session?.user) {
          setUsingSupabaseSession(true);
          setAuthError(null);
          applySupabaseSession(session.user);
          void loadSupabaseCriticalData();
        }
      }
      if (event === "SIGNED_OUT") {
        setUsingSupabaseSession(false);
        supabaseAuthUserRef.current = null;
        criticalBootstrapDoneRef.current = false;
        setUser(null);
        wtLegacyRoleRemove();
        clearWtRoleCookie();
      }
    });

    return () => subscription.unsubscribe();
  }, [isMounted, loadSupabaseCriticalData, applySupabaseSession]);

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password.trim()) {
        return { ok: false as const, message: "Informe e-mail e senha." };
      }

      if (!hasSupabaseEnv()) {
        return {
          ok: false as const,
          message:
            "Supabase não configurado no ambiente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
        };
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        return { ok: false as const, message: "Cliente Supabase indisponível." };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error || !data.user) {
        return { ok: false as const, message: error?.message || "Não foi possível autenticar." };
      }

      await applySupabaseSession(data.user);
      return { ok: true as const, role: computeEffectiveRole(data.user, devImpersonation) };
    },
    [applySupabaseSession, devImpersonation],
  );

  const loginWithOAuth = useCallback(
    async (provider: Provider) => {
      if (!hasSupabaseEnv()) {
        return {
          ok: false as const,
          message:
            "Supabase não configurado no ambiente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
        };
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { ok: false as const, message: "Cliente Supabase indisponível." };
      }
      const redirectTo =
        typeof window !== "undefined"
          ? new URL("/auth/callback", window.location.origin).href
          : undefined;
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            skipBrowserRedirect: true,
            queryParams:
              provider === "google"
                ? { access_type: "offline", prompt: "select_account" }
                : undefined,
          },
        });
        if (error) {
          return { ok: false as const, message: error.message };
        }
        const url = data?.url;
        if (typeof window !== "undefined" && url) {
          window.location.replace(url);
          return { ok: true as const };
        }
        return {
          ok: false as const,
          message:
            "OAuth não devolveu URL. No Supabase: Providers (Google) e Redirect URLs com este domínio + /auth/callback.",
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false as const, message: `Falha de rede ao iniciar OAuth: ${msg}` };
      }
    },
    [],
  );

  const logout = () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      void supabase.auth.signOut();
    }
    supabaseAuthUserRef.current = null;
    setUser(null);
    wtLegacyRoleRemove();
    clearWtRoleCookie();
  };

  useEffect(() => {
    if (!supabaseAuthUserRef.current) return;
    if (!isDevRootEmail(supabaseAuthUserRef.current.email)) return;
    applySupabaseSession(
      supabaseAuthUserRef.current,
      usingSupabaseSession && students.length > 0 ? students : undefined,
    );
  }, [devImpersonation, applySupabaseSession, students, usingSupabaseSession]);

  // ─── CATEGORIES CRUD ───
  const addCategory = useCallback((c: Omit<LessonCategory, "id">) => setCategories(p => [...p, { ...c, id: `cat_${uid()}` }]), []);
  const updateCategory = useCallback((id: string, u: Partial<LessonCategory>) => setCategories(p => p.map(c => c.id === id ? { ...c, ...u } : c)), []);
  const deleteCategory = useCallback((id: string) => setCategories(p => p.filter(c => c.id !== id)), []);

  // ─── VENUES CRUD ───
  const addVenue = useCallback((v: Omit<Venue, "id">) => setVenues(p => [...p, { ...v, id: `v_${uid()}` }]), []);
  const updateVenue = useCallback((id: string, u: Partial<Venue>) => setVenues(p => p.map(v => v.id === id ? { ...v, ...u } : v)), []);
  const deleteVenue = useCallback((id: string) => setVenues(p => p.filter(v => v.id !== id)), []);
  const setWorkHours = useCallback((wh: WorkHours) => setWorkHoursState(wh), []);

  // ─── LESSONS CRUD ───
  const addLesson = useCallback((l: Omit<Lesson, "id">) => {
    const next: Lesson = { ...l, id: `l_${uid()}` };
    if (!usingSupabaseSession) {
      setLessons((p) => [...p, next]);
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setCriticalDataError("Cliente Supabase indisponível para criar aula.");
      return;
    }
    void createLessonRemote(supabase, next)
      .then((created) => setLessons((p) => [...p, created]))
      .catch((error) =>
        setCriticalDataError(error instanceof Error ? error.message : "Falha ao criar aula no Supabase."),
      );
  }, [usingSupabaseSession]);
  const updateLesson = useCallback((id: string, u: Partial<Lesson>) => {
    if (!usingSupabaseSession) {
      setLessons((p) => p.map((l) => (l.id === id ? { ...l, ...u } : l)));
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setCriticalDataError("Cliente Supabase indisponível para atualizar aula.");
      return;
    }
    void updateLessonRemote(supabase, id, u)
      .then(() => setLessons((p) => p.map((l) => (l.id === id ? { ...l, ...u } : l))))
      .catch((error) =>
        setCriticalDataError(error instanceof Error ? error.message : "Falha ao atualizar aula no Supabase."),
      );
  }, [usingSupabaseSession]);
  const deleteLesson = useCallback((id: string) => {
    if (!usingSupabaseSession) {
      setLessons((p) => p.filter((l) => l.id !== id));
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setCriticalDataError("Cliente Supabase indisponível para remover aula.");
      return;
    }
    void deleteLessonRemote(supabase, id)
      .then(() => setLessons((p) => p.filter((l) => l.id !== id)))
      .catch((error) =>
        setCriticalDataError(error instanceof Error ? error.message : "Falha ao remover aula no Supabase."),
      );
  }, [usingSupabaseSession]);
  
  const addToWaitlist = useCallback((lessonId: string, studentId: string) => {
    setLessons(p => p.map(l => l.id === lessonId ? { ...l, waitlist: [...new Set([...(l.waitlist || []), studentId])] } : l));
  }, []);

  const promoteFromWaitlist = useCallback((lessonId: string, studentId: string) => {
    setLessons(p => p.map(l => {
      if (l.id !== lessonId) return l;
      return { 
        ...l, 
        waitlist: (l.waitlist || []).filter(id => id !== studentId),
        enrolledStudents: [...new Set([...l.enrolledStudents, studentId])]
      };
    }));
  }, []);

  // ─── STUDENTS ───
  const addStudent = useCallback(
    async (s: Omit<Student, "id">): Promise<Student> => {
      const sessionAuthId = supabaseAuthUserRef.current?.id ?? undefined;
      const next: Student = {
        ...s,
        id: `st_${uid()}`,
        authUserId: s.authUserId ?? sessionAuthId,
      };
      if (!usingSupabaseSession) {
        setStudents((p) => [...p, next]);
        return next;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        const message = "Cliente Supabase indisponível.";
        setCriticalDataError(message);
        throw new Error(message);
      }
      try {
        const created = await createStudentRemote(supabase, next);
        setStudents((p) => [created, ...p]);
        if (sessionAuthId && created.authUserId === sessionAuthId) {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  id: created.id,
                  role: "aluno",
                  name: created.name,
                  avatar: created.avatar,
                  email: created.email || prev.email,
                  authSubjectId: sessionAuthId,
                }
              : prev,
          );
          wtLegacyRoleSet("aluno");
          syncWtRoleCookie("aluno");
        }
        /* Notificação «nova inscrição»: criada no Postgres (trigger wt_notify_staff_new_pending_student);
           INSERT pelo cliente falha para não-staff por RLS. Recarregar lista em seguida puxa a linha. */
        void loadSupabaseCriticalData().catch(() => {
          /* sincroniza notificação criada por trigger no Postgres */
        });
        return created;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao criar aluno no Supabase.";
        setCriticalDataError(message);
        throw new Error(message);
      }
    },
    [usingSupabaseSession, loadSupabaseCriticalData],
  );
  const approveStudent = useCallback((id: string) => {
    if (!usingSupabaseSession) {
      setStudents((p) => p.map((s) => (s.id === id ? { ...s, status: "active" as StudentStatus } : s)));
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setCriticalDataError("Cliente Supabase indisponível.");
      return;
    }
    void updateStudentRemote(supabase, id, { status: "active" })
      .then((updated) => setStudents((p) => p.map((s) => (s.id === id ? updated : s))))
      .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao aprovar aluno."));
  }, [usingSupabaseSession]);
  const suspendStudent = useCallback((id: string) => {
    if (!usingSupabaseSession) {
      setStudents((p) => p.map((s) => (s.id === id ? { ...s, status: "suspended" as StudentStatus } : s)));
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setCriticalDataError("Cliente Supabase indisponível.");
      return;
    }
    void updateStudentRemote(supabase, id, { status: "suspended" })
      .then((updated) => setStudents((p) => p.map((s) => (s.id === id ? updated : s))))
      .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao suspender aluno."));
  }, [usingSupabaseSession]);

  // CRITICAL: updateStudent must also update the user state when the current user edits their own profile
  // This fixes the avatar not syncing between /perfil and the dashboard header
  const updateStudent = useCallback((id: string, u: Partial<Student>) => {
    if (!usingSupabaseSession) {
      setStudents(p => p.map(s => s.id === id ? { ...s, ...u } : s));
    } else {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível.");
      } else {
        void updateStudentRemote(supabase, id, u)
          .then((updated) => setStudents((p) => p.map((s) => (s.id === id ? updated : s))))
          .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao atualizar aluno."));
      }
    }
    if (u.name !== undefined || u.avatar !== undefined) {
      const persistedProfiles = ls.get<Record<string, Partial<User>>>("userProfiles", {});
      ls.set("userProfiles", {
        ...persistedProfiles,
        [id]: {
          ...persistedProfiles[id],
          ...(u.name !== undefined ? { name: u.name } : {}),
          ...(u.avatar !== undefined ? { avatar: u.avatar } : {}),
        },
      });
    }
    // If the updated student IS the currently logged-in user, sync user state too
    setUser(prev => {
      if (!prev || prev.id !== id) return prev;
      return {
        ...prev,
        // Sync name and avatar — the two fields visible in the user header
        ...(u.name !== undefined && { name: u.name }),
        ...(u.avatar !== undefined && { avatar: u.avatar }),
      };
    });
  }, [usingSupabaseSession]);

  const seedPendingTuitionForStudent = useCallback(
    async (studentId: string, monthlyValue: number, paymentDay: number) => {
      if (!String(studentId || "").trim() || monthlyValue <= 0) return;
      const ref = paymentReferenceForDate();
      const dueDate = dueDateForBillingMonth(paymentDay);
      if (!usingSupabaseSession) {
        setPayments((prev) => {
          if (prev.some((p) => p.studentId === studentId && p.reference === ref)) return prev;
          return [
            {
              id: `pay_${uid()}`,
              studentId,
              amount: monthlyValue,
              dueDate,
              paidDate: null,
              status: "pending" as PaymentStatus,
              method: null,
              reference: ref,
            },
            ...prev,
          ];
        });
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) return;
      try {
        const { data: existing } = await supabase
          .from("payments")
          .select("id")
          .eq("student_id", studentId)
          .eq("reference", ref)
          .maybeSingle();
        if (existing) return;
        const created = await insertPaymentRemote(supabase, {
          studentId,
          amount: monthlyValue,
          dueDate,
          paidDate: null,
          status: "pending",
          method: null,
          reference: ref,
        });
        setPayments((prev) => (prev.some((p) => p.id === created.id) ? prev : [created, ...prev]));
      } catch (error) {
        setCriticalDataError(error instanceof Error ? error.message : "Falha ao registrar mensalidade pendente.");
      }
    },
    [usingSupabaseSession, uid],
  );

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    const persistedProfiles = ls.get<Record<string, Partial<User>>>("userProfiles", {});
    ls.set("userProfiles", {
      ...persistedProfiles,
      [id]: {
        ...persistedProfiles[id],
        ...updates,
      },
    });
    setUser(prev => {
      if (!prev || prev.id !== id) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  // ─── PAYMENTS ───
  const markPayment = useCallback((id: string) => {
    if (!usingSupabaseSession) {
      setPayments((p) => p.map((py) => (py.id === id ? { ...py, status: "paid" as PaymentStatus, paidDate: localDateISO(), method: "pix" } : py)));
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setCriticalDataError("Cliente Supabase indisponível.");
      return;
    }
    void markPaymentPaidRemote(supabase, id)
      .then((updated) => setPayments((p) => p.map((py) => (py.id === id ? updated : py))))
      .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao confirmar pagamento."));
  }, [usingSupabaseSession]);
  const submitStudentPaymentProof = useCallback(
    (
      id: string,
      payload: {
        note: string;
        attachment?: { file?: File; previewUrl?: string; fileName: string; mime: string } | null;
      },
    ) => {
      if (!usingSupabaseSession) {
        const trimmed = payload.note.trim();
        const at = new Date().toISOString();
        setPayments((p) =>
          p.map((py) => {
            if (py.id !== id) return py;
            let next: Payment = {
              ...py,
              studentProofNote: trimmed || py.studentProofNote,
              studentProofSubmittedAt: at,
            };
            if (payload.attachment === null) {
              next = {
                ...next,
                studentProofDataUrl: undefined,
                studentProofFileName: undefined,
                studentProofMime: undefined,
              };
            } else if (payload.attachment) {
              next = {
                ...next,
                studentProofDataUrl: payload.attachment.previewUrl,
                studentProofFileName: payload.attachment.fileName,
                studentProofMime: payload.attachment.mime,
              };
            }
            return next;
          }),
        );
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCriticalDataError("Cliente Supabase indisponível.");
        return;
      }
      const currentAuthId = supabaseAuthUserRef.current?.id;
      if (!currentAuthId) {
        setCriticalDataError("Sessão Supabase indisponível.");
        return;
      }
      const submitRemote = async () => {
        if (payload.attachment === null) {
          return submitStudentProofRemote(supabase, id, { note: payload.note, attachment: null });
        }
        if (payload.attachment?.file) {
          const signedUrl = await uploadPaymentProofToStorage(supabase, currentAuthId, payload.attachment.file);
          return submitStudentProofRemote(supabase, id, {
            note: payload.note,
            attachment: {
              url: signedUrl,
              fileName: payload.attachment.fileName,
              mime: payload.attachment.mime,
            },
          });
        }
        if (payload.attachment?.previewUrl) {
          return submitStudentProofRemote(supabase, id, {
            note: payload.note,
            attachment: {
              url: payload.attachment.previewUrl,
              fileName: payload.attachment.fileName,
              mime: payload.attachment.mime,
            },
          });
        }
        return submitStudentProofRemote(supabase, id, { note: payload.note, attachment: undefined });
      };
      void submitRemote()
        .then((updated) => setPayments((p) => p.map((pay) => (pay.id === id ? updated : pay))))
        .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao registrar comprovante no Supabase."));
    },
    [usingSupabaseSession],
  );

  // ─── NOTIFICATIONS ───
  const addNotification = useCallback(
    (n: Omit<Notification, "id">) => {
      if (!usingSupabaseSession) {
        setNotifications((p) => [{ ...n, id: `n_${uid()}` }, ...p]);
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setNotifications((p) => [{ ...n, id: `n_${uid()}` }, ...p]);
        return;
      }
      void insertNotificationRemote(supabase, n)
        .then((created) => setNotifications((p) => [created, ...p]))
        .catch((error) =>
          setCriticalDataError(error instanceof Error ? error.message : "Falha ao gravar notificação no Supabase."),
        );
    },
    [usingSupabaseSession],
  );
  const markNotificationRead = useCallback(
    (id: string) => {
      setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
      if (!usingSupabaseSession) return;
      const supabase = getSupabaseClient();
      if (!supabase) return;
      void updateNotificationReadRemote(supabase, id, true).catch((error) =>
        setCriticalDataError(error instanceof Error ? error.message : "Falha ao marcar notificação como lida."),
      );
    },
    [usingSupabaseSession],
  );
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((p) => {
      const unreadIds = p.filter((n) => !n.read).map((n) => n.id);
      if (usingSupabaseSession && unreadIds.length > 0) {
        const supabase = getSupabaseClient();
        if (supabase) {
          void supabase
            .from("notifications")
            .update({ is_read: true })
            .in("id", unreadIds)
            .then(({ error }) => {
              if (error) {
                setCriticalDataError(`Falha ao marcar todas como lidas: ${error.message}`);
              }
            });
        }
      }
      return p.map((n) => ({ ...n, read: true }));
    });
  }, [usingSupabaseSession]);

  // ─── FEEDBACK & TRAINING ───
  const addFeedback = useCallback((fb: Omit<PerformanceFeedback, "id">) => setFeedbacks(p => [...p, { ...fb, id: `fb_${uid()}` }]), []);
  const addTrainingPlan = useCallback((plan: Omit<TrainingPlan, "id">) => setTrainingPlans(p => [...p, { ...plan, id: `tp_${uid()}` }]), []);

  // ─── FEED POSTS ───
  const addPost = useCallback((p: Omit<Post, "id">) => {
    if (!usingSupabaseSession) {
      setPosts((prev) => [{ ...p, id: `p_${uid()}` }, ...prev]);
      return;
    }
    const supabase = getSupabaseClient();
    const currentUserId = supabaseAuthUserRef.current?.id;
    if (!supabase || !currentUserId) {
      setCriticalDataError("Sessão Supabase indisponível para publicar no feed.");
      return;
    }
    void createFeedPostRemote(supabase, {
      authorName: p.user.name,
      authorAvatar: p.user.avatar,
      authorRole: p.user.isPro ? (user?.role || "coach") : "aluno",
      content: p.content,
      mediaUrl: p.media,
      pinned: p.pinned ?? false,
      isOfficial: p.isOfficial ?? false,
      targetRole: p.targetRole ?? "all",
    })
      .then(() => fetchFeedPostsRemote(supabase, currentUserId))
      .then((livePosts) => setPosts(livePosts))
      .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao publicar no feed."));
  }, [usingSupabaseSession, user?.role]);
  const togglePostLike = useCallback((id: string) => {
    if (!usingSupabaseSession) {
      setPosts((p) =>
        p.map((post) =>
          post.id === id ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 } : post,
        ),
      );
      return;
    }
    const supabase = getSupabaseClient();
    const currentUserId = supabaseAuthUserRef.current?.id;
    if (!supabase || !currentUserId) {
      setCriticalDataError("Sessão Supabase indisponível para curtir.");
      return;
    }
    void toggleFeedPostLikeRemote(supabase, id, currentUserId)
      .then(() => fetchFeedPostsRemote(supabase, currentUserId))
      .then((livePosts) => setPosts(livePosts))
      .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao curtir post."));
  }, [usingSupabaseSession]);
  const addPostComment = useCallback((id: string, text: string, userName: string, avatar: string) => {
    if (!usingSupabaseSession) {
      setPosts((p) => p.map((post) => (post.id === id ? { ...post, comments: [...post.comments, { user: userName, avatar, text, time: "agora" }] } : post)));
      return;
    }
    const supabase = getSupabaseClient();
    const currentUserId = supabaseAuthUserRef.current?.id;
    if (!supabase || !currentUserId) {
      setCriticalDataError("Sessão Supabase indisponível para comentar.");
      return;
    }
    void addFeedCommentRemote(supabase, { postId: id, userId: currentUserId, userName, userAvatar: avatar, text })
      .then(() => fetchFeedPostsRemote(supabase, currentUserId))
      .then((livePosts) => setPosts(livePosts))
      .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao comentar no post."));
  }, [usingSupabaseSession]);
  const moderatePost = useCallback(
    (id: string, patch: { pinned?: boolean; isOfficial?: boolean; targetRole?: "all" | "student" | "coach" }) => {
      if (!usingSupabaseSession) {
        setPosts((prev) =>
          prev
            .map((post) => (post.id === id ? { ...post, ...patch } : post))
            .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))),
        );
        return;
      }
      const supabase = getSupabaseClient();
      const currentUserId = supabaseAuthUserRef.current?.id;
      if (!supabase || !currentUserId) {
        setCriticalDataError("Sessão Supabase indisponível para moderação.");
        return;
      }
      void updateFeedPostModerationRemote(supabase, id, patch)
        .then(() => fetchFeedPostsRemote(supabase, currentUserId))
        .then((livePosts) => setPosts(livePosts))
        .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao moderar post."));
    },
    [usingSupabaseSession],
  );
  const softDeletePost = useCallback(
    (id: string) => {
      if (!usingSupabaseSession) {
        setPosts((prev) => prev.filter((post) => post.id !== id));
        return;
      }
      const supabase = getSupabaseClient();
      const currentUserId = supabaseAuthUserRef.current?.id;
      if (!supabase || !currentUserId) {
        setCriticalDataError("Sessão Supabase indisponível para remover post.");
        return;
      }
      void softDeleteFeedPostRemote(supabase, id)
        .then(() => fetchFeedPostsRemote(supabase, currentUserId))
        .then((livePosts) => setPosts(livePosts))
        .catch((error) => setCriticalDataError(error instanceof Error ? error.message : "Falha ao remover post."));
    },
    [usingSupabaseSession],
  );

  // ─── CHECK-IN (legacy) ───
  const checkInStudent = useCallback((lessonId: string, studentId: string, present: boolean) => {
    setLessons(p => p.map(l => {
      if (l.id !== lessonId) return l;
      const ps = present ? [...new Set([...l.presentStudents, studentId])] : l.presentStudents.filter(id => id !== studentId);
      const as_ = !present ? [...new Set([...l.absentStudents, studentId])] : l.absentStudents.filter(id => id !== studentId);
      return { ...l, presentStudents: ps, absentStudents: as_ };
    }));
  }, []);

  // ─── CHECK-IN PROFISSIONAL ───
  const requestCheckIn = useCallback((lessonId: string, studentId: string) => {
    const arrivedAt = new Date().toISOString();
    const arrivedTime = new Date(arrivedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setLessons(p => p.map(l => {
      if (l.id !== lessonId) return l;
      const existing = (l.checkInRequests || []).find(r => r.studentId === studentId);
      if (existing) return l;
      const req = { studentId, arrivedAt, status: "pending" as const };
      return { ...l, checkInRequests: [...(l.checkInRequests || []), req] };
    }));
    // Grab student name from students array for the notification
    setStudents(prev => {
      const studentName = prev.find(s => s.id === studentId)?.name || "Aluno";
      setNotifications(notifs => [{
        id: `n_${Date.now()}`,
        type: "message" as const,
        title: `✅ Check-in: ${studentName}`,
        message: `${studentName} registrou chegada às ${arrivedTime}. Confirme a presença no app.`,
        time: "agora",
        read: false,
        studentId,
        // No recipientId and no isGlobal = visible ONLY to admin/coach
      }, ...notifs]);
      return prev; // don't change students array
    });
  }, []);

  const approveCheckIn = useCallback((lessonId: string, studentId: string, approvedBy: string) => {
    const approvedAt = new Date().toISOString();
    setLessons(p => p.map(l => {
      if (l.id !== lessonId) return l;
      const reqs = (l.checkInRequests || []).map(r =>
        r.studentId === studentId ? { ...r, status: "approved" as const, approvedAt, approvedBy } : r
      );
      // Also add to presentStudents when approved
      const ps = [...new Set([...l.presentStudents, studentId])];
      return { ...l, checkInRequests: reqs, presentStudents: ps };
    }));
  }, []);

  const rejectCheckIn = useCallback((lessonId: string, studentId: string) => {
    setLessons(p => p.map(l => {
      if (l.id !== lessonId) return l;
      const reqs = (l.checkInRequests || []).map(r =>
        r.studentId === studentId ? { ...r, status: "rejected" as const } : r
      );
      return { ...l, checkInRequests: reqs };
    }));
  }, []);

  const endClassCheckIn = useCallback((lessonId: string, studentId: string) => {
    const finishedAt = new Date().toISOString();
    setLessons(p => p.map(l => {
      if (l.id !== lessonId) return l;
      const reqs = (l.checkInRequests || []).map(r => {
        if (r.studentId !== studentId || r.status !== "approved") return r;
        const start = new Date(r.arrivedAt).getTime();
        const end = new Date(finishedAt).getTime();
        const duration = Math.round((end - start) / 60000); // minutes
        return { ...r, finishedAt, duration };
      });
      return { ...l, checkInRequests: reqs };
    }));
  }, []);

  // ─── APP CONFIG (PIX) ───
  const updateAppConfig = useCallback((patch: Partial<AppConfig>) => {
    setAppConfig(prev => ({ ...prev, ...patch }));
  }, []);

  return (
    <AppContext.Provider value={{
      user, authResolved, authError, usingSupabaseSession, criticalDataLoading, criticalDataError, retryCriticalDataSync,
      isDevRoot, devImpersonation, setDevImpersonation,
      adminMode, setAdminMode, login: loginUser, loginWithPassword, loginWithOAuth, logout,
      venues, workHours, students, lessons, payments, notifications, categories,
      quickMessages: LEGACY_BRIDGE.MOCK_QUICK_MESSAGES, feedbacks, trainingPlans,
      addCategory, updateCategory, deleteCategory,
      addVenue, updateVenue, deleteVenue, setWorkHours,
      addLesson, updateLesson, deleteLesson, addToWaitlist, promoteFromWaitlist,
      addStudent, approveStudent, suspendStudent, updateStudent, seedPendingTuitionForStudent,
      markPayment, submitStudentPaymentProof, addNotification, markNotificationRead, markAllNotificationsRead,
      addFeedback, addTrainingPlan, checkInStudent,
      requestCheckIn, approveCheckIn, rejectCheckIn, endClassCheckIn,
      appConfig, updateAppConfig,
      posts, addPost, togglePostLike, addPostComment, moderatePost, softDeletePost,
      updateUser,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
};
