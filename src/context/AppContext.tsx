"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { User, Role, Venue, WorkHours, LessonCategory, Student, Lesson, Payment, Notification, PerformanceFeedback, TrainingPlan, QuickMessage, StudentStatus, PaymentStatus, Post, LessonRating, AppConfig } from "./types";
import { LEGACY_BRIDGE } from "@/domain/v1/mockOrm";
import { localDateISO, paymentReferenceForDate } from "@/lib/dateUtils";
import { appRoleFromSupabaseUser, getSupabaseClient, hasSupabaseEnv } from "@/lib/supabaseClient";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

/** Keeps RBAC middleware (`wt_role`) aligned with the legacy `User.role` mock session. */
function syncWtRoleCookie(role: User["role"] | null | undefined) {
  if (typeof document === "undefined") return;
  if (!role) {
    document.cookie = "wt_role=; path=/; max-age=0; samesite=lax";
    return;
  }
  const cookieRole =
    role === "admin" ? "will_owner" : role === "coach" ? "professor" : role === "aluno" ? "student" : "";
  if (!cookieRole) {
    document.cookie = "wt_role=; path=/; max-age=0; samesite=lax";
    return;
  }
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `wt_role=${cookieRole}; path=/; max-age=2592000; samesite=lax${secure}`;
}

// Re-export types for convenience
export type { User, Role, Venue, WorkHours, LessonCategory, Student, Lesson, Payment, Notification, PerformanceFeedback, TrainingPlan, QuickMessage, StudentStatus, PaymentStatus, Post, LessonRating, AppConfig };
const LS_VERSION = "v12"; // bump: payment proof file attachment (image/pdf data URL)
const LS_PREFIX = "wt_";
const ls = {
  get: <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    try { 
      const d = localStorage.getItem(LS_PREFIX + key); 
      if (!d) return fallback;
      const parsed = JSON.parse(d);
      if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
      return parsed as T; 
    } catch { 
      return fallback; 
    }
  },
  set: (key: string, val: unknown) => { if (typeof window !== "undefined") localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)); },
};

interface AppContextType {
  user: User | null;
  adminMode: "dashboard" | "coach";
  setAdminMode: (m: "dashboard" | "coach") => void;
  login: (role: Role) => void;
  loginWithPassword: (email: string, password: string) => Promise<{ ok: true; role: "admin" | "coach" | "aluno" } | { ok: false; message: string }>;
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
  addStudent: (s: Omit<Student, "id">) => void;
  approveStudent: (id: string) => void;
  suspendStudent: (id: string) => void;
  updateStudent: (id: string, u: Partial<Student>) => void;
  // Payments
  markPayment: (id: string) => void;
  /** Aluno: registra comprovante (texto e/ou arquivo imagem/PDF; não altera status até o staff confirmar). */
  submitStudentPaymentProof: (
    id: string,
    payload: {
      note: string;
      attachment?: { dataUrl: string; fileName: string; mime: string } | null;
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
  // Check-in (legacy direct)
  checkInStudent: (lessonId: string, studentId: string, present: boolean) => void;
  // Professional check-in system
  requestCheckIn: (lessonId: string, studentId: string) => void;
  approveCheckIn: (lessonId: string, studentId: string, approvedBy: string) => void;
  rejectCheckIn: (lessonId: string, studentId: string) => void;
  endClassCheckIn: (lessonId: string, studentId: string) => void;
  // Lesson ratings (student rates their own session)
  lessonRatings: LessonRating[];
  addLessonRating: (r: Omit<LessonRating, "id" | "createdAt">) => void;
  getLessonRating: (lessonId: string, studentId: string) => LessonRating | undefined;
  // App config (admin editable — PIX, WhatsApp, etc.)
  appConfig: AppConfig;
  updateAppConfig: (patch: Partial<AppConfig>) => void;
  // Helpers
  getVenueMapsUrl: (venueId: string) => string;
  getStudent: (id: string) => Student | undefined;
  getCategory: (id: string) => LessonCategory | undefined;
  getVenue: (id: string) => Venue | undefined;
  updateUser: (id: string, updates: Partial<User>) => void;
  // Computed
  unreadNotifications: number;
  pendingStudents: number;
  latePayments: number;
  todayLessons: Lesson[];
  monthlyRevenue: number;
  activeStudents: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminMode, setAdminMode] = useState<"dashboard" | "coach">("dashboard");
  const [isMounted, setIsMounted] = useState(false);
  /** Bumps on local calendar day change so todayLessons / revenue stay correct overnight. */
  const [calendarTick, setCalendarTick] = useState(0);

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
  const [lessonRatings, setLessonRatings] = useState<LessonRating[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({
    pixKey: "",
    pixKeyType: "email",
    pixOwnerName: "Will Treinos",
    whatsappNumber: "5521999999999",
  });

  // Init from LocalStorage or defaults
  useEffect(() => {
    setIsMounted(true);
    // Version check — clear stale cache on version bump
    const storedVersion = localStorage.getItem("wt_version");
    if (storedVersion !== LS_VERSION) {
      const keys = ["venues","workHours","students","lessons","payments",
                    "notifications","categories","feedbacks","trainingPlans","posts"];
      keys.forEach(k => localStorage.removeItem(LS_PREFIX + k));
      localStorage.setItem("wt_version", LS_VERSION);
    }
    setVenues(ls.get("venues", LEGACY_BRIDGE.DEFAULT_VENUES));
    setWorkHoursState(ls.get("workHours", LEGACY_BRIDGE.DEFAULT_WORK_HOURS));
    setStudents(ls.get("students", LEGACY_BRIDGE.MOCK_STUDENTS));
    setLessons(ls.get("lessons", LEGACY_BRIDGE.MOCK_LESSONS));
    setPayments(ls.get("payments", LEGACY_BRIDGE.MOCK_PAYMENTS));
    setNotifications(ls.get("notifications", LEGACY_BRIDGE.MOCK_NOTIFICATIONS));
    setCategories(ls.get("categories", LEGACY_BRIDGE.DEFAULT_CATEGORIES));
    setFeedbacks(ls.get("feedbacks", LEGACY_BRIDGE.MOCK_FEEDBACKS));
    setTrainingPlans(ls.get("trainingPlans", LEGACY_BRIDGE.MOCK_TRAINING_PLANS));
    setPosts(ls.get("posts", LEGACY_BRIDGE.MOCK_POSTS));
    setLessonRatings(ls.get("lessonRatings", []));
    setAppConfig(ls.get("appConfig", { pixKey: "", pixKeyType: "email", pixOwnerName: "Will Treinos", whatsappNumber: "5521999999999" }));
    const savedRole = localStorage.getItem("will-role") as Role;
    if (savedRole) loginUser(savedRole);
  }, []);

  /** Re-sync cookie when session user is known (do not clear on null here — first paint is still null after loginUser schedules state). */
  useEffect(() => {
    if (!isMounted || !user) return;
    syncWtRoleCookie(user.role);
  }, [user, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    const id = window.setInterval(() => setCalendarTick((x) => x + 1), 60_000);
    return () => clearInterval(id);
  }, [isMounted]);

  // Persist on change
  useEffect(() => { if (isMounted) ls.set("venues", venues); }, [venues, isMounted]);
  useEffect(() => { if (isMounted) ls.set("workHours", workHours); }, [workHours, isMounted]);
  useEffect(() => { if (isMounted) ls.set("students", students); }, [students, isMounted]);
  useEffect(() => { if (isMounted) ls.set("lessons", lessons); }, [lessons, isMounted]);
  useEffect(() => { if (isMounted) ls.set("payments", payments); }, [payments, isMounted]);
  useEffect(() => { if (isMounted) ls.set("notifications", notifications); }, [notifications, isMounted]);
  useEffect(() => { if (isMounted) ls.set("categories", categories); }, [categories, isMounted]);
  useEffect(() => { if (isMounted) ls.set("feedbacks", feedbacks); }, [feedbacks, isMounted]);
  useEffect(() => { if (isMounted) ls.set("trainingPlans", trainingPlans); }, [trainingPlans, isMounted]);
  useEffect(() => { if (isMounted) ls.set("posts", posts); }, [posts, isMounted]);
  useEffect(() => { if (isMounted) ls.set("lessonRatings", lessonRatings); }, [lessonRatings, isMounted]);
  useEffect(() => { if (isMounted) ls.set("appConfig", appConfig); }, [appConfig, isMounted]);

  const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const buildSessionUser = useCallback(
    (
      role: "admin" | "coach" | "aluno",
      custom?: { id?: string; name?: string; avatar?: string; email?: string },
    ): User => {
      const users: Record<"admin" | "coach" | "aluno", User> = {
        admin: { id: "admin1", name: "Will Monteiro", role: "admin", avatar: "Will" },
        coach: { id: "coach1", name: "Rafael Coach", role: "coach", avatar: "Coach" },
        aluno: { id: "s1", name: "Ricardo Alves", role: "aluno", avatar: "Ricardo" },
      };
      const baseUser = users[role];
      const persistedProfiles = ls.get<Record<string, Partial<User>>>("userProfiles", {});
      const persistedStudents = ls.get("students", LEGACY_BRIDGE.MOCK_STUDENTS);
      const normalizedEmail = (custom?.email || "").trim().toLowerCase();
      const linkedByEmail = normalizedEmail
        ? persistedStudents.find((s) => s.email?.trim().toLowerCase() === normalizedEmail)
        : null;
      const linkedById = custom?.id ? persistedStudents.find((s) => s.id === custom.id) : null;
      const linkedStudent =
        role === "aluno" ? linkedByEmail || linkedById || persistedStudents.find((s) => s.id === baseUser.id) || null : null;
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
    localStorage.setItem("will-role", safeRole);
    syncWtRoleCookie(mergedUser.role);
  }, [buildSessionUser]);

  const loginSupabaseUser = useCallback((authUser: SupabaseAuthUser) => {
    const appRole = appRoleFromSupabaseUser(authUser.user_metadata?.role);
    const safeName =
      String(authUser.user_metadata?.full_name || "").trim() ||
      authUser.email?.split("@")[0] ||
      (appRole === "admin" ? "Will Owner" : appRole === "coach" ? "Coach" : "Aluno");
    const safeAvatar = String(authUser.user_metadata?.avatar || "").trim() || safeName;
    const mergedUser = buildSessionUser(appRole, {
      id: authUser.id,
      name: safeName,
      avatar: safeAvatar,
      email: authUser.email || "",
    });
    setUser(mergedUser);
    localStorage.setItem("will-role", appRole);
    syncWtRoleCookie(mergedUser.role);
  }, [buildSessionUser]);

  // Bridge local-first state with real Supabase auth session.
  useEffect(() => {
    if (!isMounted || !hasSupabaseEnv()) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) loginSupabaseUser(data.session.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (session?.user) loginSupabaseUser(session.user);
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.removeItem("will-role");
        syncWtRoleCookie(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [isMounted, loginSupabaseUser]);

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password.trim()) {
        return { ok: false as const, message: "Informe e-mail e senha." };
      }

      if (!hasSupabaseEnv()) {
        return {
          ok: false as const,
          message: "Supabase não configurado no ambiente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
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

      const appRole = appRoleFromSupabaseUser(data.user.user_metadata?.role);
      loginSupabaseUser(data.user);
      return { ok: true as const, role: appRole };
    },
    [loginSupabaseUser],
  );

  const logout = () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      void supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem("will-role");
    syncWtRoleCookie(null);
  };

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
  const addLesson = useCallback((l: Omit<Lesson, "id">) => setLessons(p => [...p, { ...l, id: `l_${uid()}` }]), []);
  const updateLesson = useCallback((id: string, u: Partial<Lesson>) => setLessons(p => p.map(l => l.id === id ? { ...l, ...u } : l)), []);
  const deleteLesson = useCallback((id: string) => setLessons(p => p.filter(l => l.id !== id)), []);
  
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
  const addStudent = useCallback((s: Omit<Student, "id">) => setStudents(p => [...p, { ...s, id: `st_${uid()}` }]), []);
  const approveStudent = useCallback((id: string) => setStudents(p => p.map(s => s.id === id ? { ...s, status: "active" as StudentStatus } : s)), []);
  const suspendStudent = useCallback((id: string) => setStudents(p => p.map(s => s.id === id ? { ...s, status: "suspended" as StudentStatus } : s)), []);

  // CRITICAL: updateStudent must also update the user state when the current user edits their own profile
  // This fixes the avatar not syncing between /perfil and the dashboard header
  const updateStudent = useCallback((id: string, u: Partial<Student>) => {
    setStudents(p => p.map(s => s.id === id ? { ...s, ...u } : s));
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
  }, []);

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
  const markPayment = useCallback((id: string) => setPayments(p => p.map(py => py.id === id ? { ...py, status: "paid" as PaymentStatus, paidDate: localDateISO(), method: "pix" } : py)), []);
  const submitStudentPaymentProof = useCallback(
    (
      id: string,
      payload: {
        note: string;
        attachment?: { dataUrl: string; fileName: string; mime: string } | null;
      },
    ) => {
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
              studentProofDataUrl: payload.attachment.dataUrl,
              studentProofFileName: payload.attachment.fileName,
              studentProofMime: payload.attachment.mime,
            };
          }
          return next;
        }),
      );
    },
    [],
  );

  // ─── NOTIFICATIONS ───
  const addNotification = useCallback((n: Omit<Notification, "id">) => setNotifications(p => [{ ...n, id: `n_${uid()}` }, ...p]), []);
  const markNotificationRead = useCallback((id: string) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n)), []);
  const markAllNotificationsRead = useCallback(() => setNotifications(p => p.map(n => ({ ...n, read: true }))), []);

  // ─── FEEDBACK & TRAINING ───
  const addFeedback = useCallback((fb: Omit<PerformanceFeedback, "id">) => setFeedbacks(p => [...p, { ...fb, id: `fb_${uid()}` }]), []);
  const addTrainingPlan = useCallback((plan: Omit<TrainingPlan, "id">) => setTrainingPlans(p => [...p, { ...plan, id: `tp_${uid()}` }]), []);

  // ─── FEED POSTS ───
  const addPost = useCallback((p: Omit<Post, "id">) => setPosts(prev => [{ ...p, id: `p_${uid()}` }, ...prev]), []);
  const togglePostLike = useCallback((id: string) => setPosts(p => p.map(post => post.id === id ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 } : post)), []);
  const addPostComment = useCallback((id: string, text: string, user: string, avatar: string) => {
    setPosts(p => p.map(post => post.id === id ? { ...post, comments: [...post.comments, { user, avatar, text, time: "agora" }] } : post));
  }, []);

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

  // ─── LESSON RATINGS ───
  const addLessonRating = useCallback((r: Omit<LessonRating, "id" | "createdAt">) => {
    const newRating: LessonRating = { ...r, id: `lr_${Date.now()}`, createdAt: new Date().toISOString() };
    setLessonRatings(prev => {
      // Replace existing rating for same lesson+student, or append
      const filtered = prev.filter(x => !(x.lessonId === r.lessonId && x.studentId === r.studentId));
      return [...filtered, newRating];
    });
    // Notify admin/prof of new feedback (no recipientId = visible only to admin/coach)
    setNotifications(prev => [{
      id: `n_${Date.now()}`,
      type: "performance" as const,
      title: "Feedback de Treino",
      message: `Aluno avaliou o treino. Média: ${((r.intensidade + r.tecnica + r.didatica + r.evolucao) / 4).toFixed(1)}/5.`,
      time: "agora",
      read: false,
      studentId: r.studentId,
    }, ...prev]);
  }, []);

  const getLessonRating = useCallback((lessonId: string, studentId: string) =>
    lessonRatings.find(r => r.lessonId === lessonId && r.studentId === studentId)
  , [lessonRatings]);

  // ─── APP CONFIG (PIX) ───
  const updateAppConfig = useCallback((patch: Partial<AppConfig>) => {
    setAppConfig(prev => ({ ...prev, ...patch }));
  }, []);

  // ─── HELPERS ───
  const getVenueMapsUrl = useCallback((venueId: string) => {
    const v = venues.find(x => x.id === venueId);
    return v ? `https://www.google.com/maps?q=${v.lat},${v.lng}` : "#";
  }, [venues]);

  const getStudent = useCallback((id: string) => students.find(s => s.id === id), [students]);
  const getCategory = useCallback((id: string) => categories.find(c => c.id === id), [categories]);
  const getVenue = useCallback((id: string) => venues.find(v => v.id === id), [venues]);

  // ─── COMPUTED ───
  const unreadNotifications = useMemo(() => {
    if (!user) return notifications.filter(n => !n.read).length;
    if (user.role === "aluno") {
      return notifications.filter(n => !n.read && (n.isGlobal === true || n.recipientId === user.id)).length;
    }
    return notifications.filter(n => !n.read).length;
  }, [notifications, user]);
  const pendingStudents = students.filter(s => s.status === "pending").length;
  const latePayments = payments.filter(p => p.status === "late").length;
  const todayStr = useMemo(() => localDateISO(), [lessons, payments, calendarTick]);
  const todayLessons = useMemo(
    () => lessons.filter(l => l.date === todayStr),
    [lessons, todayStr]
  );
  const currentPaymentRef = useMemo(() => paymentReferenceForDate(), [calendarTick, payments]);
  const monthlyRevenue = useMemo(
    () => payments.filter(p => p.status === "paid" && p.reference === currentPaymentRef).reduce((s, p) => s + p.amount, 0),
    [payments, currentPaymentRef]
  );
  const activeStudents = students.filter(s => s.status === "active").length;

  if (!isMounted) return null;

  return (
    <AppContext.Provider value={{
      user, adminMode, setAdminMode, login: loginUser, loginWithPassword, logout,
      venues, workHours, students, lessons, payments, notifications, categories,
      quickMessages: LEGACY_BRIDGE.MOCK_QUICK_MESSAGES, feedbacks, trainingPlans,
      addCategory, updateCategory, deleteCategory,
      addVenue, updateVenue, deleteVenue, setWorkHours,
      addLesson, updateLesson, deleteLesson, addToWaitlist, promoteFromWaitlist,
      addStudent, approveStudent, suspendStudent, updateStudent,
      markPayment, submitStudentPaymentProof, addNotification, markNotificationRead, markAllNotificationsRead,
      addFeedback, addTrainingPlan, checkInStudent,
      requestCheckIn, approveCheckIn, rejectCheckIn, endClassCheckIn,
      lessonRatings, addLessonRating, getLessonRating,
      appConfig, updateAppConfig,
      posts, addPost, togglePostLike, addPostComment,
      getVenueMapsUrl, getStudent, getCategory, getVenue, updateUser,
      unreadNotifications, pendingStudents, latePayments, todayLessons, monthlyRevenue, activeStudents,
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
