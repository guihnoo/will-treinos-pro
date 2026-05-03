"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { User, Role, Venue, WorkHours, LessonCategory, Student, Lesson, Payment, Notification, PerformanceFeedback, TrainingPlan, QuickMessage, StudentStatus, PaymentStatus, Post, LessonRating, LessonRatingDraft, WithoutId, AppConfig, StudentProfileEditPolicy } from "./types";
import {
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

  insertNotificationRemote,
  updateNotificationReadRemote,
  updateLessonRemote,
} from "@/lib/supabasePersistence";
import { resolveEffectiveSupabaseRole } from "@/lib/resolveEffectiveSupabaseRole";
import { willUid } from "@/lib/willUid";
import { useSupabaseRealtimeRefresh } from "@/hooks/useSupabaseRealtimeRefresh";
import { useSupabaseAuthBridge } from "@/hooks/useSupabaseAuthBridge";
import { useLocalTransactionalPersistence } from "@/hooks/useLocalTransactionalPersistence";
import { useEnrollmentInviteSideEffects } from "@/hooks/useEnrollmentInviteSideEffects";
import { useLoadSupabaseCriticalData } from "@/hooks/useLoadSupabaseCriticalData";
import { useSupabaseLoginActions } from "@/hooks/useSupabaseLoginActions";
import { useLessonMutations } from "@/hooks/useLessonMutations";
import { useFeedMutations } from "@/hooks/useFeedMutations";
import { useStudentMutations } from "@/hooks/useStudentMutations";
import { usePaymentMutations } from "@/hooks/usePaymentMutations";
import { logDevEvent } from "@/lib/devEventsLogger";
import { syncWtRoleCookie } from "@/lib/appSessionHelpers";
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

  useLocalTransactionalPersistence({
    isMounted,
    usingSupabaseSession,
    students,
    lessons,
    payments,
    notifications,
    posts,
    appConfig,
  });

  useEnrollmentInviteSideEffects({
    isMounted,
    usingSupabaseSession,
    appConfig,
    setAppConfig,
  });

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
      const supabase = getSupabaseClient();
      const effectiveRole = await resolveEffectiveSupabaseRole(
        authUser,
        devImpersonation,
        supabase,
        catalogStudents,
      );

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

  const { loadSupabaseCriticalData, retryCriticalDataSync } = useLoadSupabaseCriticalData({
    applySupabaseSession,
    supabaseAuthUserRef,
    criticalBootstrapDoneRef,
    criticalLoadInflightRef,
    setCriticalDataLoading,
    setCriticalDataError,
    setStudents,
    setPayments,
    setLessons,
    setNotifications,
    setPosts,
    setAppConfig,
  });

  useSupabaseAuthBridge({
    isMounted,
    applySupabaseSession,
    loadSupabaseCriticalData,
    supabaseAuthUserRef,
    criticalBootstrapDoneRef,
    setAuthResolved,
    setAuthError,
    setUsingSupabaseSession,
    setUser,
  });

  const { loginWithPassword, loginWithOAuth, logout } = useSupabaseLoginActions({
    applySupabaseSession,
    devImpersonation,
    supabaseAuthUserRef,
    setUser,
  });

  useEffect(() => {
    if (!supabaseAuthUserRef.current) return;
    if (!isDevRootEmail(supabaseAuthUserRef.current.email)) return;
    applySupabaseSession(
      supabaseAuthUserRef.current,
      usingSupabaseSession && students.length > 0 ? students : undefined,
    );
  }, [devImpersonation, applySupabaseSession, students, usingSupabaseSession]);

  useSupabaseRealtimeRefresh({
    enabled: usingSupabaseSession,
    onRefresh: loadSupabaseCriticalData,
    onLiveStatus: setIsLive,
  });

  const { addLesson, updateLesson, deleteLesson, addToWaitlist, promoteFromWaitlist } = useLessonMutations({
    usingSupabaseSession,
    setLessons,
    setCriticalDataError,
  });

  const { addPost, togglePostLike, addPostComment, moderatePost, softDeletePost } = useFeedMutations({
    usingSupabaseSession,
    sessionRole: user?.role,
    supabaseAuthUserRef,
    setPosts,
    setCriticalDataError,
  });

  const { addStudent, approveStudent, suspendStudent, updateStudent, updateUser } = useStudentMutations({
    usingSupabaseSession,
    supabaseAuthUserRef,
    setStudents,
    setCriticalDataError,
    setUser,
    loadSupabaseCriticalData,
  });

  const { seedPendingTuitionForStudent, markPayment, submitStudentPaymentProof } = usePaymentMutations({
    usingSupabaseSession,
    supabaseAuthUserRef,
    setPayments,
    setCriticalDataError,
  });

  // ─── NOTIFICATIONS ───
  const addNotification = useCallback(
    (n: WithoutId<Notification>) => {
      if (!usingSupabaseSession) {
        setNotifications((p) => [{ ...n, id: `n_${willUid()}` }, ...p]);
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        setNotifications((p) => [{ ...n, id: `n_${willUid()}` }, ...p]);
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
