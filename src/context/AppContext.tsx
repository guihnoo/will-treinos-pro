"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { User, Role, Venue, WorkHours, LessonCategory, Student, StudentRole, Lesson, Payment, Notification, PerformanceFeedback, TrainingPlan, QuickMessage, StudentStatus, PaymentStatus, Post, LessonRating, LessonRatingDraft, WithoutId, AppConfig, StudentProfileEditPolicy } from "./types";
import {
  isDevRootEmail,
  readDevImpersonationFromStorage,
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
import { resolveEffectiveSupabaseRole } from "@/lib/resolveEffectiveSupabaseRole";
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
import { useNotificationMutations } from "@/hooks/useNotificationMutations";
import { useCheckInActions } from "@/hooks/useCheckInActions";
import { syncWtRoleCookie } from "@/lib/appSessionHelpers";
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
  loginWithPassword: (email: string, password: string) => Promise<{ ok: true; role: "admin" | "coach" | "aluno" | "visitor" } | { ok: false; message: string }>;
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
  approveStudent: (id: string, role?: StudentRole) => void;
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
      // OAuth retorna na mesma SPA sem remount — ler sempre o último cartão (login) em vez do estado inicial.
      const impersonationNow = readDevImpersonationFromStorage();
      setDevImpersonationState(impersonationNow);
      const effectiveRole = await resolveEffectiveSupabaseRole(
        authUser,
        impersonationNow,
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
    [],
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

  const { addNotification, markNotificationRead, markAllNotificationsRead } = useNotificationMutations({
    usingSupabaseSession,
    setNotifications,
    setCriticalDataError,
  });

  const { checkInStudent, requestCheckIn, approveCheckIn, rejectCheckIn, endClassCheckIn } = useCheckInActions({
    usingSupabaseSession,
    students,
    setLessons,
    setCriticalDataError,
    addNotification,
  });

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
