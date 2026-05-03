"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { User, Role, Venue, WorkHours, LessonCategory, Student, Lesson, Payment, Notification, PerformanceFeedback, TrainingPlan, QuickMessage, StudentStatus, PaymentStatus, Post, LessonRating, LessonRatingDraft, WithoutId, AppConfig, StudentProfileEditPolicy } from "./types";
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
import { logDevEvent } from "@/lib/devEventsLogger";
import {
  CRITICAL_DATA_FETCH_TIMEOUT_MS,
  clearWtRoleCookie,
  filterDemoNotifications,
  findLinkedStudentForAuth,
  syncWtRoleCookie,
  withNetworkTimeout,
} from "@/lib/appSessionHelpers";
import { sendPushToRole } from "@/lib/pushRoleBroadcast";
import { buildSessionUser } from "@/lib/buildSessionUser";
import type { Provider, User as SupabaseAuthUser } from "@supabase/supabase-js";

// Re-export types for convenience
export type { User, Role, Venue, WorkHours, LessonCategory, Student, Lesson, Payment, Notification, PerformanceFeedback, TrainingPlan, QuickMessage, StudentStatus, PaymentStatus, Post, LessonRating, LessonRatingDraft, WithoutId, AppConfig, StudentProfileEditPolicy };
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
  isLive: boolean;
  adminMode: "dashboard" | "coach";
  setAdminMode: (m: "dashboard" | "coach") => void;
  login: (role: Role) => void;
  loginWithPassword: (email: string, password: string) => Promise<{ ok: true; role: "admin" | "coach" | "aluno" } | { ok: false; message: string }>;
  loginWithOAuth: (provider: Provider) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
  // Data
  students: Student[];
  lessons: Lesson[];
  payments: Payment[];
  notifications: Notification[];
  // CRUD — Lessons
  addLesson: (l: WithoutId<Lesson>) => void;
  updateLesson: (id: string, u: Partial<Lesson>) => void;
  deleteLesson: (id: string) => void;
  addToWaitlist: (lessonId: string, studentId: string) => void;
  promoteFromWaitlist: (lessonId: string, studentId: string) => void;
  // CRUD — Students
  addStudent: (s: WithoutId<Student>) => Promise<Student>;
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
  addNotification: (n: WithoutId<Notification>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Feed
  posts: Post[];
  addPost: (p: WithoutId<Post>) => void;
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
  const [isLive, setIsLive] = useState(false);
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
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
    setStudents(ls.get("students", tx.students));
    setLessons(ls.get("lessons", tx.lessons));
    setPayments(ls.get("payments", tx.payments));
    setNotifications(ls.get("notifications", tx.notifications));
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

  const loginUser = useCallback((role: Role) => {
    const safeRole: "admin" | "coach" | "aluno" = role === "admin" || role === "coach" || role === "aluno" ? role : "aluno";
    const mergedUser = buildSessionUser(safeRole);
    setUser(mergedUser);
    wtLegacyRoleSet(safeRole);
    syncWtRoleCookie(mergedUser.role);
  }, []);

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
    [devImpersonation],
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

  // ─── SUPABASE REALTIME ───
  useEffect(() => {
    if (!usingSupabaseSession) { setIsLive(false); return; }
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let debounce: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => void loadSupabaseCriticalData(), 400);
    };

    const channel = supabase
      .channel("willpro-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "lessons" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, refresh)
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      clearTimeout(debounce);
      void supabase.removeChannel(channel);
    };
  }, [usingSupabaseSession, loadSupabaseCriticalData]);

  // ─── LESSONS CRUD ───
  const addLesson = useCallback((l: WithoutId<Lesson>) => {
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
      .then((created) => {
        setLessons((p) => [...p, created]);
        void logDevEvent("lesson_created", "lesson", created.id, {
          venueId: created.venueId,
          lessonType: created.lessonType,
          maxStudents: created.maxStudents,
        });
      })
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
    async (s: WithoutId<Student>): Promise<Student> => {
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

        // Push para admin sobre novo aluno pendente
        void sendPushToRole("admin", {
          title: "Novo aluno aguardando aprovação",
          body: `${created.name} se cadastrou e aguarda aprovação.`,
          url: "/alunos",
        });

        // Log evento para monitoramento
        void logDevEvent("student_created", "student", created.id, {
          name: created.name,
          email: created.email,
          status: created.status,
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
      .then((updated) => {
        setStudents((p) => p.map((s) => (s.id === id ? updated : s)));
        void logDevEvent("student_approved", "student", id, { name: updated.name });
      })
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
      .then((updated) => {
        setStudents((p) => p.map((s) => (s.id === id ? updated : s)));
        void logDevEvent("student_suspended", "student", id, { name: updated.name });
      })
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
      .then((updated) => {
        setPayments((p) => p.map((py) => (py.id === id ? updated : py)));
        void logDevEvent("payment_marked", "payment", id, {
          studentId: updated.studentId,
          amount: updated.amount,
          method: updated.method,
        });
      })
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
          const storagePath = await uploadPaymentProofToStorage(supabase, currentAuthId, payload.attachment.file);
          return submitStudentProofRemote(supabase, id, {
            note: payload.note,
            attachment: {
              url: storagePath,
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
    (n: WithoutId<Notification>) => {
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

  // ─── FEED POSTS ───
  const addPost = useCallback((p: WithoutId<Post>) => {
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
    let remotePatch: Partial<Lesson> | null = null;
    setLessons((p) =>
      p.map((l) => {
        if (l.id !== lessonId) return l;
        const ps = present ? [...new Set([...l.presentStudents, studentId])] : l.presentStudents.filter((id) => id !== studentId);
        const as_ = !present ? [...new Set([...l.absentStudents, studentId])] : l.absentStudents.filter((id) => id !== studentId);
        remotePatch = { presentStudents: ps, absentStudents: as_ };
        return { ...l, presentStudents: ps, absentStudents: as_ };
      }),
    );
    if (!usingSupabaseSession || !remotePatch) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setCriticalDataError("Cliente Supabase indisponível para registrar presença.");
      return;
    }
    void updateLessonRemote(supabase, lessonId, remotePatch).catch((error) =>
      setCriticalDataError(error instanceof Error ? error.message : "Falha ao sincronizar presença na aula."),
    );
  }, [usingSupabaseSession]);

  // ─── CHECK-IN PROFISSIONAL ───
  const requestCheckIn = useCallback(
    (lessonId: string, studentId: string) => {
      const arrivedAt = new Date().toISOString();
      const arrivedTime = new Date(arrivedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const studentName = students.find((s) => s.id === studentId)?.name || "Aluno";

      let added: { checkInRequests: NonNullable<Lesson["checkInRequests"]> } | null = null;
      setLessons((p) =>
        p.map((l) => {
          if (l.id !== lessonId) return l;
          const existing = (l.checkInRequests || []).find((r) => r.studentId === studentId);
          if (existing) return l;
          const req = { studentId, arrivedAt, status: "pending" as const };
          const checkInRequests = [...(l.checkInRequests || []), req];
          added = { checkInRequests };
          return { ...l, checkInRequests };
        }),
      );

      if (!added) return;

      if (usingSupabaseSession) {
        const supabase = getSupabaseClient();
        if (supabase) {
          void updateLessonRemote(supabase, lessonId, { checkInRequests: added.checkInRequests })
            .then(() => {
              void logDevEvent("check_in_requested", "check_in", studentId, {
                lessonId,
                studentName,
              });
            })
            .catch((error) =>
              setCriticalDataError(error instanceof Error ? error.message : "Falha ao registrar check-in no Supabase."),
            );
        } else {
          setCriticalDataError("Cliente Supabase indisponível para registrar check-in.");
        }
      }

      addNotification({
        type: "message",
        title: `✅ Check-in: ${studentName}`,
        message: `${studentName} registrou chegada às ${arrivedTime}. Confirme a presença no app.`,
        time: "agora",
        read: false,
        studentId,
      });

      // Push notification para admin/professor (fire-and-forget, não bloqueia UX)
      void sendPushToRole("admin", {
        title: `✅ Check-in: ${studentName}`,
        body: `Chegou às ${arrivedTime}. Confirme no app.`,
        url: "/will/court",
      });
    },
    [usingSupabaseSession, students, addNotification],
  );

  const approveCheckIn = useCallback((lessonId: string, studentId: string, approvedBy: string) => {
    const approvedAt = new Date().toISOString();
    let patch: Partial<Lesson> | null = null;
    setLessons((p) =>
      p.map((l) => {
        if (l.id !== lessonId) return l;
        const reqs = (l.checkInRequests || []).map((r) =>
          r.studentId === studentId ? { ...r, status: "approved" as const, approvedAt, approvedBy } : r,
        );
        const ps = [...new Set([...l.presentStudents, studentId])];
        patch = { checkInRequests: reqs, presentStudents: ps };
        return { ...l, checkInRequests: reqs, presentStudents: ps };
      }),
    );
    if (!patch || !usingSupabaseSession) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setCriticalDataError("Cliente Supabase indisponível para aprovar check-in.");
      return;
    }
    void updateLessonRemote(supabase, lessonId, patch).catch((error) =>
      setCriticalDataError(error instanceof Error ? error.message : "Falha ao sincronizar aprovação de check-in."),
    );
  }, [usingSupabaseSession]);

  const rejectCheckIn = useCallback((lessonId: string, studentId: string) => {
    let patch: Partial<Lesson> | null = null;
    setLessons((p) =>
      p.map((l) => {
        if (l.id !== lessonId) return l;
        const reqs = (l.checkInRequests || []).map((r) =>
          r.studentId === studentId ? { ...r, status: "rejected" as const } : r,
        );
        patch = { checkInRequests: reqs };
        return { ...l, checkInRequests: reqs };
      }),
    );
    if (!patch || !usingSupabaseSession) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setCriticalDataError("Cliente Supabase indisponível para rejeitar check-in.");
      return;
    }
    void updateLessonRemote(supabase, lessonId, patch).catch((error) =>
      setCriticalDataError(error instanceof Error ? error.message : "Falha ao sincronizar rejeição de check-in."),
    );
  }, [usingSupabaseSession]);

  const endClassCheckIn = useCallback((lessonId: string, studentId: string) => {
    const finishedAt = new Date().toISOString();
    let patch: Partial<Lesson> | null = null;
    setLessons((p) =>
      p.map((l) => {
        if (l.id !== lessonId) return l;
        const reqs = (l.checkInRequests || []).map((r) => {
          if (r.studentId !== studentId || r.status !== "approved") return r;
          const start = new Date(r.arrivedAt).getTime();
          const end = new Date(finishedAt).getTime();
          const duration = Math.round((end - start) / 60000); // minutes
          return { ...r, finishedAt, duration };
        });
        patch = { checkInRequests: reqs };
        return { ...l, checkInRequests: reqs };
      }),
    );
    if (!patch || !usingSupabaseSession) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setCriticalDataError("Cliente Supabase indisponível para encerrar check-in.");
      return;
    }
    void updateLessonRemote(supabase, lessonId, patch).catch((error) =>
      setCriticalDataError(error instanceof Error ? error.message : "Falha ao sincronizar término de check-in."),
    );
  }, [usingSupabaseSession]);

  // ─── APP CONFIG (PIX) ───
  const updateAppConfig = useCallback((patch: Partial<AppConfig>) => {
    setAppConfig(prev => ({ ...prev, ...patch }));
  }, []);

  return (
    <AppContext.Provider value={{
      user, authResolved, authError, usingSupabaseSession, criticalDataLoading, criticalDataError, retryCriticalDataSync, isLive,
      isDevRoot, devImpersonation, setDevImpersonation,
      adminMode, setAdminMode, login: loginUser, loginWithPassword, loginWithOAuth, logout,
      students, lessons, payments, notifications,
      addLesson, updateLesson, deleteLesson, addToWaitlist, promoteFromWaitlist,
      addStudent, approveStudent, suspendStudent, updateStudent, seedPendingTuitionForStudent,
      markPayment, submitStudentPaymentProof, addNotification, markNotificationRead, markAllNotificationsRead,
      checkInStudent,
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
