"use client";

import React, { useState, useMemo, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { lessonLocalDateTime, localDateISO } from "@/lib/dateUtils";
import { useAuth } from "@/context/AuthContext";
import { useLessons } from "@/context/LessonsContext";
import { useStudents } from "@/context/StudentsContext";
import { useCriticalData } from "@/context/CriticalDataContext";
import { useCheckIn } from "@/context/CheckInContext";
import { useLessonRatings } from "@/context/LessonRatingsContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCoaching } from "@/context/CoachingContext";
import { usePayments } from "@/context/PaymentsContext";
import { useAppConfig } from "@/context/AppConfigContext";
import type { Lesson, CardTier } from "@/context/types";
import { CARD_TIER_THRESHOLDS } from "@/context/types";
import { useGamification } from "@/context/GamificationContext";
import { useFeed } from "@/context/FeedContext";
import { useApp } from "@/context/AppContext";
import { Calendar as CalendarIcon, Clock, Trophy, Bell, CheckCircle2, Play, Star, TrendingUp, TrendingDown, Users, X, Lock, MapPin, User, ChevronRight, Target, Medal, Radio, Flame, Heart, MessageCircle, Award, CreditCard, AlertTriangle as AlertIcon, Newspaper } from "lucide-react";
import dynamic from "next/dynamic";
import { fetchXpLogEntriesRemote, type XpLogEntry } from "@/lib/supabasePersistence";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";
import { richToast } from "@/hooks/useToast";
import WeatherWidget from "@/components/WeatherWidget";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import PushPermissionBanner from "@/components/PushPermissionBanner";
import NextLessonCard from "@/components/student/NextLessonCard";
import StudentDailyMissionCard from "@/components/student/StudentDailyMissionCard";

// ─── Lazy-loaded panels (code-split — zero cost at startup) ──────────────────
const StudentTwinCard = dynamic(
  () => import("@/components/gamification/StudentTwinCard"),
  { ssr: false, loading: () => null }
);
const OnboardingWidget = dynamic(
  () => import("@/components/gamification/OnboardingWidget"),
  { ssr: false, loading: () => null }
);
const WeeklyHighlightBanner = dynamic(
  () => import("@/components/student/WeeklyHighlightBanner"),
  { ssr: false, loading: () => null }
);
const WeeklySummaryBanner = dynamic(
  () => import("@/components/student/WeeklySummaryBanner"),
  { ssr: false, loading: () => null }
);
const WeeklyChallengeCard = dynamic(
  () => import("@/components/student/WeeklyChallengeCard"),
  { ssr: false, loading: () => null }
);
const StudentGoalsCard     = dynamic(() => import("@/components/student/StudentGoalsCard"),     { ssr: false, loading: () => null });
const FrequencyAlertBanner = dynamic(() => import("@/components/student/FrequencyAlertBanner"), { ssr: false, loading: () => null });
const MilestoneTracker     = dynamic(() => import("@/components/student/MilestoneTracker"),     { ssr: false, loading: () => null });
const MonthlySummaryCard   = dynamic(() => import("@/components/student/MonthlySummaryCard"),   { ssr: false, loading: () => null });
import StudentHomeModals from "@/components/student/StudentHomeModals";
import StudentHomePrimaryModals from "@/components/student/StudentHomePrimaryModals";
import { StudentAgendaPanel } from "@/components/student/StudentAgendaPanel";
// ─── Shared constants / helpers (extracted) ───────────────────────────────────
import {
  SPORTS_QUOTES,
  ACHIEVEMENT_TRACKS,
  DAY,
  scoreColor,
  FUNDAMENTALS,
  resolveAvatarSrc,
  WEEK_STYLE,
  getWeekStyle,
  TIER_META,
  homeList,
  homeItem,
} from "@/components/student/studentHomeShared";
import type { AchievementTrackWithScore } from "@/components/student/studentHomeShared";
import type { EvolutionLineChartData } from "@/components/student/EvolutionTrendPanel";
import { studentSeesNotification } from "@/lib/notificationVisibility";
import OfflineBanner from "@/components/student/OfflineBanner";
import { offlineCache } from "@/lib/offlineCache";
import { wtLsGetString, wtLsSetString } from "@/lib/willLocalStorage";
import AppSectionCard from "@/components/ui/AppSectionCard";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";
import { FloatingActionMenu } from "@/components/FloatingActionMenu";
import WelcomeModal from "@/components/student/WelcomeModal";
import { useSessionRecovery } from "@/hooks/useSessionRecovery";
import { useRealtimeXP } from "@/hooks/useRealtimeXP";
import type { XPEvent } from "@/hooks/useRealtimeXP";
import PresenceTracker from "@/components/student/PresenceTracker";
const MoodResponseCard = dynamic(
  () => import("@/components/student/MoodResponseCard"),
  { ssr: false, loading: () => null }
);
const RealtimeXPIndicator = dynamic(
  () => import("@/components/student/RealtimeXPIndicator"),
  { ssr: false, loading: () => null }
);

// Inlined from OnboardingWidget to avoid static import
function markTwinViewed(studentId: string) {
  try { localStorage.setItem(`wt_twin_viewed_${studentId}`, "1"); } catch { /* ignore */ }
}


function MedalTilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), { stiffness: 260, damping: 22 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 260, damping: 22 });

  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    x.set(px);
    y.set(py);
  };
  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div ref={ref} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} className={className}>
      <motion.div style={{ perspective: 900, transformStyle: "preserve-3d" }}>
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="will-change-transform [transform:translateZ(0)]"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}

function StudentHomeSkeleton() {
  return (
    <div className="w-full space-y-5 animate-pulse" aria-hidden>
      <div className="flex justify-between gap-4">
        <div className="flex gap-3 flex-1">
          <div className="h-14 w-14 rounded-full bg-zinc-800/80" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-6 w-48 rounded-lg bg-zinc-800/80" />
            <div className="h-3 w-32 rounded bg-zinc-800/60" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded-xl bg-zinc-800/80" />
          <div className="h-10 w-10 rounded-xl bg-zinc-800/80" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-zinc-900/60 border border-zinc-800/50" />
        ))}
      </div>
      <div className="h-24 rounded-2xl bg-zinc-900/60 border border-zinc-800/50" />
      <div className="h-40 rounded-2xl bg-zinc-900/60 border border-zinc-800/50" />
    </div>
  );
}


export default function StudentHome() {
  const { getCategory } = useCatalog();
  const { feedbacks } = useCoaching();
  const { payments, getStudentCurrentPayment, currentMonthReference } = usePayments();
  const { requestCheckIn } = useCheckIn();
  const { appConfig } = useAppConfig();
  const { lessonRatings, addLessonRating, getLessonRating } = useLessonRatings();
  const { user, usingSupabaseSession } = useAuth();
  const { totalXP, xpFloatEvents, removeXPFloat } = useGamification();
  const { addPost } = useFeed();
  const { requestReposition } = useApp();
  const { lessons } = useLessons();
  const { students } = useStudents();
  const { criticalDataError, retryCriticalDataSync } = useCriticalData();
  const { notifications, markNotificationRead, coachMessagesUnread, crmStudentId, refreshCoachMessagesUnread } = useNotifications();
  const searchParams = useSearchParams();
  const evoChartIdHome = useId().replace(/:/g, "h");
  const evoChartIdModal = useId().replace(/:/g, "m");
  const { toast } = useToast();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const { isExpired: sessionExpired, recovering: sessionRecovering, recover: recoverSession, forceLogout: sessionForceLogout } = useSessionRecovery();

  // Show welcome modal on first login (once per user)
  useEffect(() => {
    if (!hydrated || !user?.id) return;
    const key = `wt_welcomed_${user.id}`;
    try {
      if (!localStorage.getItem(key)) {
        setShowWelcome(true);
      }
    } catch { /* ignore */ }
  }, [hydrated, user?.id]);

  useEffect(() => {
    import("@/lib/supabaseClient").then(({ getSupabaseClient }) => {
      const sb = getSupabaseClient();
      if (!sb) return;
      void sb.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) setSessionToken(session.access_token);
      });
    });
  }, []);

  // Detect card tier unlock
  useEffect(() => {
    if (!hydrated || totalXP === 0) return;
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevXPRef.current = totalXP;
      return;
    }
    const prev = prevXPRef.current ?? 0;
    if (totalXP <= prev) { prevXPRef.current = totalXP; return; }
    const tiers: CardTier[] = ["bronze", "prata", "ouro", "diamante", "elite"];
    for (const tier of tiers) {
      const threshold = CARD_TIER_THRESHOLDS[tier];
      if (prev < threshold && totalXP >= threshold) {
        const meta = TIER_META[tier];
        setJustUnlockedTier(tier);
        const autoShareText = `Acabei de desbloquear o Card ${meta.label} ${meta.emoji} no Will Treinos PRO! ${totalXP} XP conquistados na quadra. Quem tá chegando no mesmo nível? 🏐🔥`;
        setShareText(autoShareText);
        // Auto-post silencioso no feed (conquista oficial)
        try {
          const currentProfile = students.find(s => s.authUserId === user?.id || s.id === user?.id);
          addPost({
            user: { name: user?.name || "Atleta", avatar: currentProfile?.avatar || user?.avatar || "user", isPro: false },
            time: "agora",
            content: autoShareText,
            media: null,
            likes: 0,
            comments: [],
            isLiked: false,
            isSaved: false,
            pinned: false,
            isOfficial: false,
            targetRole: "all",
          });
        } catch { /* silent */ }
        break;
      }
    }
    prevXPRef.current = totalXP;
  }, [totalXP, hydrated]);
  const [showNotif, setShowNotif] = useState(false);
  const [lessonModal, setLessonModal] = useState<Lesson | null>(null);
  const [evolModal, setEvolModal] = useState(false);
  const [trackModalId, setTrackModalId] = useState<(typeof ACHIEVEMENT_TRACKS)[number]["id"] | null>(null);
  const [statsModal, setStatsModal] = useState<"aulas"|"streak"|"nota"|"freq"|null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAgendaPanel, setShowAgendaPanel] = useState(false);
  const [ratingLesson, setRatingLesson] = useState<Lesson | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [equippedTierId, setEquippedTierId] = useState<string | null>(null);
  const [localNow, setLocalNow] = useState<Date | null>(null);
  const [kpiCount, setKpiCount] = useState({ aulas: 0, streak: 0, nota: 0, freq: 0 });
  const [showDailyQuote, setShowDailyQuote] = useState(false);
  const [showXpModal, setShowXpModal] = useState(false);
  const [showGamificationDashboard, setShowGamificationDashboard] = useState(false);
  const [showConquistasMore, setShowConquistasMore] = useState(false);
  const [evolutionExpanded, setEvolutionExpanded] = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [showStudentTwin, setShowStudentTwin] = useState(false);
  const [showPillarPanel, setShowPillarPanel] = useState(false);
  const [showMessagesPanel, setShowMessagesPanel] = useState(false);
  const [showAbsenceSheet, setShowAbsenceSheet] = useState(false);
  const [showRepositionSheet, setShowRepositionSheet] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showPushSettings, setShowPushSettings] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [showFreeTraining, setShowFreeTraining] = useState(false);
  const [showAchievementFeed, setShowAchievementFeed] = useState(false);
  const [showReferralPanel, setShowReferralPanel] = useState(false);
  const [showTrainingPlan, setShowTrainingPlan] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showAttendanceCalendar, setShowAttendanceCalendar] = useState(false);
  const [showLessonHistory, setShowLessonHistory] = useState(false);
  const [showStudentSchedule, setShowStudentSchedule] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [xpLogEntries, setXpLogEntries] = useState<XpLogEntry[]>([]);
  const [showPayments, setShowPayments] = useState(false);
  const [justUnlockedTier, setJustUnlockedTier] = useState<CardTier | null>(null);
  const [shareText, setShareText] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [realtimeXPEvent, setRealtimeXPEvent] = useState<XPEvent | null>(null);
  const prevXPRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);
  const ctaClass = `${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD}`;
  const hasOverlayOpen = Boolean(
    showWelcome ||
    showNotif ||
      lessonModal ||
      evolModal ||
      trackModalId ||
      statsModal ||
      showAgendaPanel ||
      ratingLesson ||
      showDailyQuote ||
      showXpModal ||
      showConquistasMore ||
      showGamificationDashboard ||
      showDailyChallenges ||
      showStudentTwin ||
      showPillarPanel ||
      showMessagesPanel ||
      showAbsenceSheet ||
      showRepositionSheet ||
      showTimeline ||
      showNotificationCenter ||
      showPushSettings ||
      showFreeTraining ||
      showAchievementFeed ||
      showReferralPanel ||
      showTrainingPlan ||
      showQRScanner ||
      showAttendanceCalendar ||
      showLessonHistory ||
      showPayments ||
      showStudentSchedule ||
      showShareCard ||
      justUnlockedTier,
  );
  useBodyScrollLock(hasOverlayOpen);
  useEffect(() => {
    setLocalNow(new Date());
    const id = setInterval(() => setLocalNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dailyQuote = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86_400_000);
    return SPORTS_QUOTES[dayOfYear % SPORTS_QUOTES.length]!;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const today = new Date().toDateString();
    const lastSeen = wtLsGetString("daily_quote_date", "");
    if (lastSeen !== today) setShowDailyQuote(true);
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const savedTier = wtLsGetString("equipped_tier_id", "");
    if (savedTier) setEquippedTierId(savedTier);
  }, [hydrated]);

  useEffect(() => {
    if (!showXpModal || !user?.id) {
      setXpLogEntries([]);
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;
    void fetchXpLogEntriesRemote(supabase, user.id, 10).then(entries => setXpLogEntries(entries));
  }, [showXpModal, user?.id]);

  const profile = crmStudentId ? students.find((s) => s.id === crmStudentId) : undefined;
  const studentIdForData = crmStudentId ?? profile?.id ?? user?.id ?? "";

  useEffect(() => {
    if (!hydrated || searchParams.get("recados") !== "1" || !crmStudentId) return;
    setShowMessagesPanel(true);
  }, [hydrated, searchParams, crmStudentId]);

  // Sprint 104: Realtime XP via Supabase subscription
  useRealtimeXP({
    studentId: studentIdForData || null,
    initialTotalXP: totalXP,
    onXPGained: (xpAmount, event) => {
      setRealtimeXPEvent(event);
      richToast.xp(xpAmount, "XP ganho em tempo real!");
    },
    onTierUnlock: (newTier, _xpGained) => {
      setJustUnlockedTier(newTier);
      setConfettiActive(true);
    },
  });

  const messagesUnread = coachMessagesUnread;
  const myLessons = lessons.filter(l => l.enrolledStudents.includes(studentIdForData));
  // Real count: completed lessons with presence + historical record from profile
  const completedFromLessons = myLessons.filter(l => l.presentStudents.includes(studentIdForData)).length;
  const completedCount = Math.max(completedFromLessons, profile?.totalClasses || 0);
  const frequency = profile?.frequency || Math.min(100, completedFromLessons > 0 ? Math.round((completedFromLessons / Math.max(profile?.totalClasses || completedFromLessons, 1)) * 100) : 0);
  const freqColor = frequency >= 80 ? "#22C55E" : frequency >= 60 ? "#EAB308" : "#EF4444";
  // Use student profile avatar (updated via perfil page)
  const avatarSeed = profile?.avatar || user?.avatar || "Ricardo";

  const myFeedbacks = useMemo(() => feedbacks.filter(f => f.studentId === studentIdForData).sort((a,b) => b.date.localeCompare(a.date)), [feedbacks, studentIdForData]);
  const myLessonRatings = useMemo(
    () => lessonRatings.filter((r) => r.studentId === studentIdForData).sort((a, b) => b.date.localeCompare(a.date)),
    [lessonRatings, studentIdForData],
  );

  // Completed lessons in last 7 days where student was present and hasn't rated yet
  const unratedLessons = useMemo(() => {
    if (!studentIdForData) return [];
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = localDateISO(since);
    const ratedIds = new Set(myLessonRatings.map(r => r.lessonId));
    return myLessons
      .filter(l =>
        l.status === "completed" &&
        l.presentStudents.includes(studentIdForData) &&
        l.date >= sinceStr &&
        !ratedIds.has(l.id)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [myLessons, myLessonRatings, studentIdForData]);
  const latest = myFeedbacks[0] ?? null;
  const avgRating = useMemo(() => {
    if (myFeedbacks.length === 0) return 0;
    const sum = myFeedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
    return sum / myFeedbacks.length;
  }, [myFeedbacks]);
  const selfSessionAvg = useMemo(() => {
    if (myLessonRatings.length === 0) return 0;
    const total = myLessonRatings.reduce((acc, item) => {
      const score = (item.intensidade + item.tecnica + item.didatica + item.evolucao) / 4;
      return acc + score;
    }, 0);
    return (total / myLessonRatings.length) * 2;
  }, [myLessonRatings]);

  const evolutionSeries = useMemo(() => {
    const sorted = [...myFeedbacks].sort((a, b) => a.date.localeCompare(b.date) || (a.id || "").localeCompare(b.id || ""));
    return sorted.slice(-18).map((f) => ({ id: f.id, date: f.date, rating: f.rating }));
  }, [myFeedbacks]);

  const evolutionLineChart = useMemo((): EvolutionLineChartData | null => {
    const pts = evolutionSeries.filter((p) => typeof p.rating === "number");
    if (pts.length < 2) return null;
    const ratings = pts.map((p) => p.rating);
    const minR = Math.min(...ratings);
    const maxR = Math.max(...ratings);
    const pad = 0.75;
    const lo = Math.max(0, minR - pad);
    const hi = Math.min(10, maxR + pad);
    const span = Math.max(0.0001, hi - lo);
    const w = 320;
    const h = 120;
    const padX = 12;
    const padY = 14;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;
    const linePts = pts.map((p, i) => {
      const x = padX + (innerW * i) / Math.max(1, pts.length - 1);
      const y = padY + innerH * (1 - (p.rating - lo) / span);
      return { x, y, ...p };
    });
    const d = linePts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const areaD = `M ${linePts[0]!.x.toFixed(1)} ${(h - padY).toFixed(1)} ${linePts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")} L ${linePts[linePts.length - 1]!.x.toFixed(1)} ${(h - padY).toFixed(1)} Z`;
    return { w, h, d, areaD, linePts, lo, hi };
  }, [evolutionSeries]);

  const streak = useMemo(() => {
    let s = 0;
    const sorted = [...myLessons].filter(l => l.status === "completed").sort((a,b) => b.date.localeCompare(a.date));
    for (const l of sorted) { if (l.presentStudents.includes(studentIdForData)) s++; else break; }
    // If no completed lessons in data but profile shows totalClasses, use a calculated streak
    return s > 0 ? s : Math.min(profile?.totalClasses || 0, 5);
  }, [myLessons, user, profile]);
  const bestStreak = useMemo(() => {
    const completed = [...myLessons]
      .filter((l) => l.status === "completed")
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    let best = 0;
    let current = 0;
    for (const l of completed) {
      if (l.presentStudents.includes(studentIdForData)) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    return Math.max(best, streak);
  }, [myLessons, user, streak]);
  const sessionsToBeatRecord = Math.max(0, bestStreak - streak + 1);
  const streakTrail = useMemo(() => {
    const completed = [...myLessons]
      .filter((l) => l.status === "completed")
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
      .slice(0, 7)
      .map((l) => l.presentStudents.includes(studentIdForData));
    while (completed.length < 7) completed.push(false);
    return completed.reverse();
  }, [myLessons, user]);

  const currentWeekPlan = useMemo(() => {
    const now = localNow ?? new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const inWeek = myLessons.filter((l) => {
      const d = lessonLocalDateTime(l.date, l.startTime);
      return d >= monday && d <= sunday;
    });
    const scheduledThisWeek = inWeek.filter((l) => l.status === "scheduled" || l.status === "in-progress" || l.status === "completed").length;
    const attendedThisWeek = inWeek.filter((l) => l.status === "completed" && l.presentStudents.includes(studentIdForData)).length;
    return { scheduledThisWeek, attendedThisWeek };
  }, [myLessons, localNow, user]);
  const weeklyConsistency = useMemo(() => {
    const expected = Math.max(1, currentWeekPlan.scheduledThisWeek);
    return Math.round(Math.min(100, (currentWeekPlan.attendedThisWeek / expected) * 100));
  }, [currentWeekPlan]);
  const meritScore = useMemo(() => {
    const attendanceScore = Math.min(100, completedCount * 3);
    const frequencyScore = frequency;
    const qualityScore = Math.min(100, avgRating * 10);
    const streakScore = Math.min(100, streak * 8);
    const consistencyScore = weeklyConsistency;
    return Math.round(
      attendanceScore * 0.2 +
      frequencyScore * 0.25 +
      qualityScore * 0.35 +
      streakScore * 0.1 +
      consistencyScore * 0.1,
    );
  }, [completedCount, frequency, avgRating, streak, weeklyConsistency]);
  const tierSystem = useMemo(() => [
    { id: "tier-bronze", min: 35, label: "Bronze", color: "#CD7F32" },
    { id: "tier-silver", min: 50, label: "Prata", color: "#C0C0C0" },
    { id: "tier-gold", min: 65, label: "Ouro", color: "#EAB308" },
    { id: "tier-platinum", min: 78, label: "Platina", color: "#67E8F9" },
    { id: "tier-diamond", min: 88, label: "Diamante", color: "#60A5FA" },
    { id: "tier-legend", min: 96, label: "Lendário", color: "#A78BFA" },
  ], []);
  const currentTier = useMemo(
    () => [...tierSystem].reverse().find((t) => meritScore >= t.min) ?? { id: "tier-base", min: 0, label: "Base", color: "#6B7280" },
    [tierSystem, meritScore],
  );
  const nextTier = useMemo(
    () => tierSystem.find((t) => meritScore < t.min) ?? null,
    [tierSystem, meritScore],
  );
  const equippedTier = useMemo(() => {
    const selected = tierSystem.find((t) => t.id === equippedTierId);
    if (selected && meritScore >= selected.min) return selected;
    return currentTier;
  }, [tierSystem, equippedTierId, meritScore, currentTier]);
  const getTierSubLevel = (tierId: string) => {
    const idx = tierSystem.findIndex((t) => t.id === tierId);
    if (idx < 0) return 1;
    const tier = tierSystem[idx]!;
    const next = tierSystem[idx + 1];
    const span = Math.max(1, (next?.min ?? 100) - tier.min);
    const localScore = Math.max(0, meritScore - tier.min);
    const ratio = Math.min(0.999, localScore / span);
    return Math.min(3, Math.max(1, Math.floor(ratio * 3) + 1));
  };
  const performanceScore = Math.round(Math.min(100, (avgRating * 10 * 0.75) + (Math.min(100, bestStreak * 3) * 0.25)));
  const disciplineScore = Math.round(Math.min(100, frequency * 0.6 + weeklyConsistency * 0.4));
  const coachTrustScore = Math.round(Math.min(100, (myFeedbacks.length * 6) + (avgRating * 6)));

  const week7 = useMemo(() => {
    const base = localNow ?? new Date();
    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return localDateISO(d);
    });
  }, [localNow]);
  const weekScheduledCount = useMemo(() => {
    const weekSet = new Set(week7);
    return myLessons.filter((l) => weekSet.has(l.date) && (l.status === "scheduled" || l.status === "in-progress" || l.status === "completed")).length;
  }, [myLessons, week7]);
  const weekCompletedCount = useMemo(() => {
    const weekSet = new Set(week7);
    return myLessons.filter((l) => weekSet.has(l.date) && l.status === "completed" && l.presentStudents.includes(studentIdForData)).length;
  }, [myLessons, week7, user]);

  const nextLesson = myLessons.filter(l => l.status==="scheduled"||l.status==="in-progress")
    .sort((a,b) => a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime))[0];
  const missionOfDay = useMemo(() => {
    if (nextLesson) {
      return {
        title: "Missão de Hoje",
        decision: "Priorizar preparação e chegada no horário",
        action: `Checklist + check-in para ${nextLesson.startTime}`,
      };
    }
    return {
      title: "Missão de Hoje",
      decision: "Consolidar evolução técnica",
      action: "Revisar feedback do professor e definir foco da próxima sessão",
    };
  }, [nextLesson]);
  const nextSessionPlan = useMemo(() => {
    if (!latest) return ["Confirmar presença da próxima aula", "Definir objetivo técnico da sessão", "Chegar com 15 min de antecedência"];
    const plan = [
      ...(latest.improvements?.length ? latest.improvements.slice(0, 2).map((i) => `Aprimorar: ${i}`) : []),
      ...(latest.strengths?.length ? [`Manter ponto forte: ${latest.strengths[0]}`] : []),
    ];
    while (plan.length < 3) plan.push("Executar plano com disciplina e constância");
    return plan.slice(0, 3);
  }, [latest]);
  const feedbackByLessonId = useMemo(() => {
    const map = new Map<string, (typeof myFeedbacks)[number]>();
    for (const fb of myFeedbacks) {
      if (!map.has(fb.lessonId)) map.set(fb.lessonId, fb);
    }
    return map;
  }, [myFeedbacks]);
  const fundamentalsTrend = useMemo(() => {
    const src = [...myFeedbacks]
      .sort((a, b) => a.date.localeCompare(b.date) || (a.id || "").localeCompare(b.id || ""))
      .slice(-10);
    return FUNDAMENTALS.map((fund) => {
      let score = 52;
      const points: Array<{ x: number; y: number; score: number }> = [];
      src.forEach((fb, idx) => {
        const strengthsText = (fb.strengths || []).join(" ").toLowerCase();
        const improvementsText = (fb.improvements || []).join(" ").toLowerCase();
        const noteText = `${fb.professorNote || ""} ${fb.trainingType || ""}`.toLowerCase();
        const hitStrength = fund.keys.some((k) => strengthsText.includes(k));
        const hitImprove = fund.keys.some((k) => improvementsText.includes(k));
        const hitNote = fund.keys.some((k) => noteText.includes(k));
        const fbBias = (fb.rating - 7) * 0.3;
        const delta = (hitStrength ? 3.8 : 0) - (hitImprove ? 3.2 : 0) + (hitNote ? fbBias : 0);
        score = Math.max(35, Math.min(96, score + delta));
        points.push({ x: idx, y: score, score });
      });
      if (points.length < 2) {
        points.push({ x: 0, y: score, score }, { x: 1, y: score, score });
      }
      const last = points[points.length - 1]?.score ?? score;
      const prev = points[points.length - 2]?.score ?? last;
      const trend = last > prev + 0.6 ? "up" : last < prev - 0.6 ? "down" : "stable";
      return { id: fund.id, label: fund.label, points, score: Math.round(last), trend };
    });
  }, [myFeedbacks]);
  // XP by fundamental derived from trend scores (0-100 range — used in share card radar)
  const xpByFundamental = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    const FUNDAMENTAL_KEY_MAP: Record<string, string> = {
      serve: "saque",
      receive: "recepcao",
      set: "levantamento",
      attack: "ataque",
      block: "bloqueio",
      defense: "defesa",
    };
    for (const f of fundamentalsTrend) {
      const key = FUNDAMENTAL_KEY_MAP[f.id] ?? f.id;
      map[key] = f.score;
    }
    return map;
  }, [fundamentalsTrend]);

  const getLessonExecutionStage = (lesson: Lesson) => {
    const userId = studentIdForData;
    const myCheckIn = lesson.checkInRequests?.find((r) => r.studentId === userId);
    const hasCheckInRequest = Boolean(myCheckIn);
    const checkedIn = lesson.presentStudents.includes(userId) || myCheckIn?.status === "approved";
    const hasFeedback = feedbackByLessonId.has(lesson.id);
    const stage = lesson.status === "completed" && hasFeedback ? 4 : checkedIn ? 3 : hasCheckInRequest ? 2 : 1;
    return {
      stage,
      label: stage === 4 ? "Concluída com feedback" : stage === 3 ? "Check-in confirmado" : stage === 2 ? "Check-in solicitado" : "Aula agendada",
      color: stage === 4 ? "#22C55E" : stage === 3 ? "#60A5FA" : stage === 2 ? "#EAB308" : "#A1A1AA",
    };
  };

  // SECURITY: same rule as financeiro CRM id (recipientId === user.id) + globals; staff sees all
  const myNotifications = (role: string | null | undefined, userId: string) => {
    if (role === "admin" || role === "coach") return notifications;
    return notifications.filter((n) => studentSeesNotification(n, userId));
  };
  const visibleNotifications = myNotifications(user?.role, studentIdForData);
  const unread = visibleNotifications.filter(n => !n.read).length;
  const fundamentalsAverage = Math.round(
    fundamentalsTrend.length ? fundamentalsTrend.reduce((acc, item) => acc + item.score, 0) / fundamentalsTrend.length : 0,
  );
  const executionRate = Math.round((weekCompletedCount / Math.max(1, weekScheduledCount)) * 100);
  const attendedLessons = useMemo(
    () => myLessons.filter((l) => l.status === "completed" && l.presentStudents.includes(studentIdForData)),
    [myLessons, user],
  );
  const attendanceDiagnostics = useMemo(() => {
    const recent = [...myLessons]
      .filter((l) => l.status === "completed")
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
      .slice(0, 8);
    const attended = recent.filter((l) => l.presentStudents.includes(studentIdForData)).length;
    const rate = recent.length ? Math.round((attended / recent.length) * 100) : 0;
    const cause = rate >= 80 ? "Boa regularidade nas últimas sessões." : rate >= 60 ? "Oscilação de presença nas últimas semanas." : "Ritmo de comparecimento abaixo do ideal.";
    const impact = rate >= 80 ? "Mantém ganho técnico contínuo e previsível." : "Evolução técnica fica menos estável entre sessões." ;
    const action = rate >= 80 ? "Manter confirmação antecipada e rotina de check-in." : "Fechar agenda semanal e confirmar presença com antecedência.";
    return { recent, rate, cause, impact, action };
  }, [myLessons, user]);
  const trackScoreMap = {
    consistency: Math.round(Math.min(100, frequency * 0.45 + weeklyConsistency * 0.35 + Math.min(100, streak * 8) * 0.2)),
    technical: Math.round(Math.min(100, avgRating * 10 * 0.55 + performanceScore * 0.25 + coachTrustScore * 0.15 + selfSessionAvg * 0.05)),
    fundamentals: Math.round(Math.min(100, fundamentalsAverage * 0.75 + avgRating * 10 * 0.25)),
    competitive: Math.round(Math.min(100, meritScore * 0.5 + executionRate * 0.3 + disciplineScore * 0.2)),
  } as const;
  const achievementTracks = ACHIEVEMENT_TRACKS.map((track) => {
    const score = trackScoreMap[track.id];
    const unlocked = score >= track.goal;
    const progress = Math.max(0, Math.min(100, (score / track.goal) * 100));
    return {
      ...track,
      score,
      unlocked,
      progress,
      missing: Math.max(0, track.goal - score),
    };
  });
  const unlockedTracksCount = achievementTracks.filter((track) => track.unlocked).length;
  const activeTrack = trackModalId ? achievementTracks.find((track) => track.id === trackModalId) ?? null : null;
  const greeting = () => {
    if (!localNow) return "Olá";
    const h = localNow.getHours();
    if (h >= 0 && h < 6) return "Boa madrugada";
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };
  const periodPill = (() => {
    if (!localNow) return "Sincronizando";
    const h = localNow.getHours();
    if (h >= 0 && h < 6) return "Madrugada";
    if (h < 12) return "Modo manhã";
    if (h < 18) return "Modo sunset";
    return "Modo noite";
  })();
  const dayTheme = (() => {
    const h = localNow?.getHours() ?? 13;
    const isDawn = h >= 0 && h < 6;
    const isMorning = h >= 6 && h < 12;
    const isAfternoon = h >= 12 && h < 18;
    if (isDawn || !localNow) return {
      chrome: "bg-[#07090f]/78",
      topAura: "from-[#0d1630]/55 via-[#090d1c]/30 to-transparent",
      headerAura: "from-[#101830]/40 via-[#0b0e19]/20 to-transparent",
    };
    if (isMorning) return {
      chrome: "bg-[#0a0d11]/70",
      topAura: "from-[#1b2430]/55 via-[#0f1822]/30 to-transparent",
      headerAura: "from-[#182434]/35 via-[#0f1822]/20 to-transparent",
    };
    if (isAfternoon) return {
      chrome: "bg-[#120e0a]/70",
      topAura: "from-[#3a2918]/45 via-[#1c1510]/25 to-transparent",
      headerAura: "from-[#2e2318]/35 via-[#1a1310]/20 to-transparent",
    };
    return {
      chrome: "bg-[#07090f]/78",
      topAura: "from-[#0d1630]/55 via-[#090d1c]/30 to-transparent",
      headerAura: "from-[#101830]/40 via-[#0b0e19]/20 to-transparent",
    };
  })();
  const haptic = React.useCallback((pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
  }, []);
  const checkInGate = (lesson: Lesson) => {
    if (!localNow) {
      return { locked: true, reason: "Sincronizando horário local...", unlockLabel: "" };
    }
    const lessonStart = lessonLocalDateTime(lesson.date, lesson.startTime);
    const unlockAt = new Date(lessonStart.getTime() - 60 * 60 * 1000);
    const sameDay = lesson.date === localDateISO(localNow);
    const unlocked = sameDay && localNow.getTime() >= unlockAt.getTime();
    const unlockLabel = unlockAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return {
      locked: !unlocked,
      reason: sameDay ? `Check-in libera às ${unlockLabel}` : "Check-in disponível apenas no dia da aula",
      unlockLabel,
    };
  };

  useEffect(() => {
    const target = {
      aulas: completedCount,
      streak,
      nota: avgRating || 0,
      freq: frequency,
    };
    const duration = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setKpiCount({
        aulas: Math.round(target.aulas * eased),
        streak: Math.round(target.streak * eased),
        nota: Number((target.nota * eased).toFixed(1)),
        freq: Math.round(target.freq * eased),
      });
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [completedCount, streak, avgRating, frequency]);

  // Ambient XP Pulse — hooks ANTES de qualquer return condicional (regra dos hooks)
  const lastXpCountRef = useRef(0);
  const [xpPulseKey, setXpPulseKey] = useState(0);
  useEffect(() => {
    if (xpFloatEvents.length > lastXpCountRef.current) {
      lastXpCountRef.current = xpFloatEvents.length;
      setXpPulseKey(k => k + 1);
    }
  }, [xpFloatEvents.length]);

  // Offline cache — antes de qualquer return (regra dos hooks)
  useEffect(() => {
    if (!hydrated || typeof window === "undefined" || !navigator.onLine) return;
    const today = localDateISO();
    const upcoming = myLessons
      .filter((l) => l.status === "scheduled" && l.date >= today)
      .slice(0, 20)
      .map((l) => ({
        id: l.id,
        title: l.title,
        date: l.date,
        startTime: l.startTime,
        categoryId: l.categoryId,
        status: l.status,
      }));
    offlineCache.saveLessons(upcoming);
  }, [myLessons, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined" || !navigator.onLine) return;
    if (!profile?.id || totalXP === 0) return;
    offlineCache.saveStudentXP(profile.id, totalXP, currentTier.label);
  }, [profile?.id, totalXP, currentTier.label, hydrated]);

  if (!hydrated) return <StudentHomeSkeleton />;

  if (usingSupabaseSession && criticalDataError) {
    return (
      <AppSectionCard
        title="Falha ao sincronizar seu painel"
        subtitle="Não foi possível carregar os dados ao vivo agora."
        className="mt-2"
      >
        <p className="text-sm text-zinc-300">{criticalDataError}</p>
        <button
          type="button"
          onClick={() => void retryCriticalDataSync()}
          className={`mt-4 rounded-xl border border-red-300/35 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200 hover:bg-red-500/15 ${ctaClass}`}
        >
          Tentar sincronizar novamente
        </button>
      </AppSectionCard>
    );
  }

  return (
    <>
    {/* Ambient XP Pulse: fundo reage ao ganho de XP */}
    <AnimatePresence>
      {xpPulseKey > 0 && (
        <motion.div
          key={xpPulseKey}
          className="pointer-events-none fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            background: "radial-gradient(ellipse at 50% 50%, rgba(234,179,8,0.07) 0%, transparent 65%)",
          }}
          aria-hidden
        />
      )}
    </AnimatePresence>
    {showWelcome && (
      <WelcomeModal
        name={(profile?.name || user?.name || "Atleta").split(" ")[0]!}
        onClose={() => {
          try { localStorage.setItem(`wt_welcomed_${user?.id ?? ""}`, "1"); } catch { /* ignore */ }
          setShowWelcome(false);
        }}
      />
    )}
    <PushPermissionBanner role="aluno" />
    <OfflineBanner />
    <AnimatePresence>
      {realtimeXPEvent && (
        <RealtimeXPIndicator
          xpAmount={realtimeXPEvent.xp}
          onDismiss={() => setRealtimeXPEvent(null)}
        />
      )}
    </AnimatePresence>
    <motion.div
      className="w-full space-y-5 pt-2 sm:pt-3 pb-4 relative"
      variants={homeList}
      initial="hidden"
      animate="show"
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 z-0 h-28 bg-gradient-to-b ${dayTheme.topAura}`} />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-[max(0.2rem,env(safe-area-inset-top))] sm:top-[max(0.35rem,env(safe-area-inset-top))] z-40 w-full px-2 mb-2"
      >
        <div className={`mx-auto w-[min(95vw,42rem)] flex items-center justify-between gap-2 rounded-2xl border border-white/[0.08] ${dayTheme.chrome} px-2 py-1 sm:px-2.5 sm:py-1.5 backdrop-blur-2xl shadow-[0_16px_42px_rgba(0,0,0,0.4)]`}>
          <WeatherWidget compact />
          <span className="rounded-full border border-[#EAB308]/20 bg-[#EAB308]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#EAB308]">
            {periodPill}
          </span>
        </div>
      </motion.div>

      {/* 0. Resumo mensal de IA — visível apenas nos dias 1-7 do mês */}
      {user?.id && new Date().getDate() <= 7 && (
        <motion.div variants={homeItem} className="px-1">
          <MonthlySummaryCard
            studentId={user.id}
            addPost={addPost}
            userName={user.name || "Atleta"}
            userAvatar={profile?.avatar || user.avatar || "user"}
          />
        </motion.div>
      )}

      {/* 1. Próxima aula — card único (countdown + check-in) */}
      {user?.id && studentIdForData && (
        <motion.div variants={homeItem} className="px-1">
          <NextLessonCard
            lessons={myLessons}
            studentId={studentIdForData}
            userId={user.id}
            localNow={localNow}
            courtLocation={appConfig.courtLocation}
            getCategory={getCategory}
            onOpenLesson={(lesson) => setLessonModal(lesson)}
            onOpenAgenda={() => {
              setSelectedDay(week7[0] ?? null);
              setShowAgendaPanel(true);
            }}
            onCheckIn={(lessonId, uid) => {
              haptic([18, 12, 20]);
              requestCheckIn(lessonId, uid);
              richToast.success("Chegada registrada!", "Aguardando confirmação do professor.");
            }}
            onGeoCheckIn={(lessonId, uid, isAtCourt) => {
              requestCheckIn(lessonId, uid);
              toast(
                isAtCourt
                  ? "📍 Check-in na quadra confirmado! +50 XP aguardando professor."
                  : "🏠 Treino externo registrado! +10 XP anti-cheat.",
                "success",
              );
            }}
            ctaClass={ctaClass}
          />
        </motion.div>
      )}

      {/* 1b. Feedback de humor pós-aula */}
      {user?.id && (
        <motion.div variants={homeItem} className="px-1">
          <MoodResponseCard
            lessons={lessons}
            studentId={user.id}
          />
        </motion.div>
      )}

      {/* 1c. Missão do dia — só após onboarding (XP ≥ 400) */}
      {crmStudentId && totalXP >= 400 && (
        <motion.div variants={homeItem} className="px-1">
          <StudentDailyMissionCard
            crmStudentId={crmStudentId}
            hasAvatar={Boolean(profile?.avatar && !profile.avatar.includes("dicebear"))}
            lessons={lessons}
          />
        </motion.div>
      )}

      {/* 2. Bloco Hero do Aluno */}
      <motion.div variants={homeItem}>
        <Link href="/perfil">
          <motion.div
            whileTap={{ scale: 0.985 }}
            className="rounded-2xl border border-[#EAB308]/15 bg-zinc-950 px-4 py-3.5 flex items-center gap-3.5 relative overflow-hidden cursor-pointer hover:border-[#EAB308]/30 transition-colors"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-[#EAB308] opacity-[0.04] blur-[40px] rounded-full pointer-events-none" />
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={resolveAvatarSrc(avatarSeed, "Ricardo")}
                className={`w-14 h-14 aspect-square rounded-full bg-zinc-900 object-cover ${
                  (avatarSeed?.startsWith("data:") || avatarSeed?.startsWith("http://") || avatarSeed?.startsWith("https://") || avatarSeed?.startsWith("/"))
                    ? "border-2 border-[#EAB308]"
                    : "border-2 border-zinc-700"
                }`}
                alt={profile?.name || user?.name || "Atleta"}
              />
              {/* Tier badge */}
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-black flex items-center justify-center text-[9px] font-black"
                style={{ background: equippedTier.color, color: "#000" }}
                title={equippedTier.label}
              >
                {equippedTier.label.slice(0, 1)}
              </div>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white leading-tight truncate">
                {greeting()}, <span style={{ color: equippedTier.color }}>{(profile?.name || user?.name || "Atleta").split(" ")[0]}!</span>
              </h2>
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">{equippedTier.label} · {profile?.plan || "Aluno"} · {profile?.categories?.[0] || "Vôlei"}</p>
            </div>
            {/* XP + Streak compact */}
            <div className="flex-shrink-0 flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black" style={{ color: equippedTier.color }}>{totalXP}</span>
                <span className="text-[10px] text-zinc-500">XP</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-bold text-zinc-300">{streak}</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); haptic([16, 12, 24]); setShowNotif(true); }}
                className="relative mt-0.5"
                aria-label="Notificações"
              >
                <Bell className="w-4 h-4 text-zinc-400" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">{unread}</span>
                )}
              </button>
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* Share progress button */}
      <motion.div variants={homeItem} className="px-1">
        <button
          type="button"
          data-testid="btn-share-progress-card"
          onClick={(e) => { e.preventDefault(); setShowShareCard(true); }}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#EAB308]/20 bg-[#EAB308]/5 py-2.5 text-[11px] font-bold text-amber-400/80 hover:bg-[#EAB308]/10 hover:border-[#EAB308]/35 transition-all"
        >
          <span>📸</span>
          Compartilhar progresso no Stories
        </button>
      </motion.div>

      {/* Alerta de Frequência */}
      {user?.id && profile?.frequency && (
        <motion.div variants={homeItem} className="px-1">
          <FrequencyAlertBanner
            lessons={lessons}
            studentId={user.id}
            targetFrequency={profile.frequency}
            onCheckIn={() => setShowAgendaPanel(true)}
          />
        </motion.div>
      )}

      {/* Metas do Coach */}
      {profile?.id && (
        <motion.div variants={homeItem} className="px-1">
          <StudentGoalsCard
            studentCrmId={profile.id}
            totalXP={totalXP}
            checkinCount={myLessons.filter(l => l.presentStudents.includes(studentIdForData)).length}
          />
        </motion.div>
      )}

      {/* Banner: aulas não avaliadas */}
      {unratedLessons.length > 0 && (
        <motion.div variants={homeItem} className="px-1">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setRatingLesson(unratedLessons[0])}
            className="w-full flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-left hover:bg-amber-500/12 transition-all"
          >
            <span className="text-2xl flex-shrink-0">⭐</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white">
                {unratedLessons.length === 1
                  ? "Avalie seu treino de hoje"
                  : `${unratedLessons.length} treinos aguardando avaliação`}
              </p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {unratedLessons[0].title || getCategory(unratedLessons[0].categoryId)?.name || "Aula"} · {new Date(`${unratedLessons[0].date}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>
            <span className="text-xs font-black text-amber-400 flex-shrink-0">Avaliar →</span>
          </motion.button>
        </motion.div>
      )}

      {/* BLOCO 2: XP + Progresso */}
      <motion.div variants={homeItem} className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { haptic([22, 16, 22]); setShowXpModal(true); }}
          className={`rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-4 text-left flex items-center gap-3 ${ctaClass}`}
        >
          <div className="relative h-14 w-14 flex-shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="2.4" />
              <motion.circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke={equippedTier.color}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeDasharray="100"
                strokeDashoffset={100 - meritScore}
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 100 - meritScore }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-sm font-black leading-none" style={{ color: equippedTier.color }}>{meritScore}</p>
              <span className="text-[8px] text-zinc-500">pts</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Score</p>
            <p className="truncate text-sm font-bold" style={{ color: equippedTier.color }}>{equippedTier.label}</p>
            {nextTier && <p className="truncate text-[10px] text-zinc-600">{Math.max(0, nextTier.min - meritScore)}pts → {nextTier.label}</p>}
          </div>
        </button>

        <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500">Sequência</p>
              <p className="text-xl font-black text-[#EAB308]">{streak}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500">Nota média</p>
              <p className="text-xl font-black" style={{ color: avgRating ? scoreColor(avgRating) : "#52525b" }}>
                {avgRating ? avgRating.toFixed(1) : "—"}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {streakTrail.slice(-5).map((active, idx) => (
              <div key={idx} className={`h-1 flex-1 rounded-full ${active ? "bg-[#EAB308]" : "bg-zinc-800"}`} />
            ))}
          </div>
          <button
            onClick={() => { haptic(16); setEvolModal(true); }}
            className={`w-full text-[10px] font-bold text-zinc-500 hover:text-[#EAB308] transition-colors ${ctaClass}`}
          >
            Ver evolução completa →
          </button>
        </div>
      </motion.div>

      {/* BLOCO 3: Agenda da Semana + Ranking */}
      <motion.div variants={homeItem} className="rounded-2xl border border-[#EAB308]/20 bg-zinc-950/50 backdrop-blur-xl p-3.5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-black uppercase tracking-[0.15em] text-[#EAB308]">Minha Semana</h2>
          <button
            onClick={() => { setSelectedDay(week7[0] ?? null); setShowAgendaPanel(true); }}
            className={`text-[10px] font-bold text-[#EAB308] border border-[#EAB308]/25 bg-[#EAB308]/10 px-2.5 py-1 rounded-lg ${ctaClass}`}
          >
            Ver agenda
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2 text-center">
            <p className="text-[9px] text-zinc-500">Planejados</p>
            <p className="text-sm font-black text-white">{weekScheduledCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2 text-center">
            <p className="text-[9px] text-zinc-500">Concluídos</p>
            <p className="text-sm font-black text-[#22C55E]">{weekCompletedCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2 text-center">
            <p className="text-[9px] text-zinc-500">Execução</p>
            <p className="text-sm font-black text-[#EAB308]">{executionRate}%</p>
          </div>
        </div>
        <Link
          href="/ranking"
          onClick={() => haptic([22, 16, 22])}
          className={`mt-3 w-full rounded-xl border border-yellow-500/20 bg-yellow-500/8 p-2.5 flex items-center justify-between ${ctaClass}`}
        >
          <div className="flex items-center gap-2">
            <Medal className="h-4 w-4 text-yellow-400" />
            <span className="text-[11px] font-bold text-yellow-400">Ranking — ver minha posição</span>
          </div>
          <ChevronRight className="h-4 w-4 text-yellow-600" />
        </Link>
      </motion.div>

      {/* A Rede — Feed social (elevado para zona social, antes de pagamentos) */}
      <motion.div variants={homeItem}>
        <Link href="/feed"
          className="flex items-center justify-between gap-4 rounded-2xl border border-[#EAB308]/25 bg-[#EAB308]/[0.06] p-4 hover:bg-[#EAB308]/[0.09] transition-colors active:scale-[0.98]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
              <Newspaper className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white">A Rede</p>
              <p className="text-[11px] text-zinc-500 truncate">Feed social · desafios · novidades da turma</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#EAB308]/60" />
        </Link>
      </motion.div>

      {/* BLOCO 4: Meus Pagamentos */}
      {(() => {
        const currentPay = getStudentCurrentPayment(user?.id ?? "");
        const hasLate = payments.some((p) => p.studentId === user?.id && p.status === "late");
        const isLate = currentPay?.status === "late";
        const isPending = currentPay?.status === "pending";
        const isPaid = currentPay?.status === "paid";
        const proofSent = Boolean(currentPay?.studentProofSubmittedAt) && !isPaid;
        return (
          <motion.div variants={homeItem}>
            <button
              onClick={() => { haptic(16); setShowPayments(true); }}
              className={`w-full rounded-2xl border p-4 flex items-center gap-3 text-left transition-all ${
                isLate || hasLate
                  ? "border-red-500/35 bg-red-500/8 hover:border-red-500/55"
                  : proofSent
                  ? "border-amber-500/30 bg-amber-500/8 hover:border-amber-500/50"
                  : isPaid
                  ? "border-emerald-500/25 bg-emerald-500/6 hover:border-emerald-500/45"
                  : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700"
              } ${ctaClass}`}
            >
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${
                isLate || hasLate ? "border-red-500/40 bg-red-500/15" :
                isPaid ? "border-emerald-500/35 bg-emerald-500/12" :
                "border-[#EAB308]/35 bg-[#EAB308]/10"
              }`}>
                {isLate || hasLate
                  ? <AlertIcon className="h-5 w-5 text-red-400" />
                  : isPaid
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  : <CreditCard className="h-5 w-5 text-[#EAB308]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${
                  isLate || hasLate ? "text-red-400" : isPaid ? "text-emerald-400" : "text-[#EAB308]"
                }`}>
                  {isLate || hasLate ? "Pagamento em atraso" : isPaid ? "Em dia" : proofSent ? "Aguardando confirmação" : "Meus Pagamentos"}
                </p>
                <p className="text-sm font-bold text-white">
                  {currentPay
                    ? `${currentPay.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · ${currentMonthReference}`
                    : "Ver histórico e pagar"}
                </p>
                {proofSent && (
                  <p className="text-[10px] text-amber-400 mt-0.5">Comprovante enviado — aguardando confirmação do Will</p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-600" />
            </button>
          </motion.div>
        );
      })()}

      {/* BLOCO 5: Reposição de Aulas */}
      {(() => {
        const studentId = user?.id ?? "";
        const today = localDateISO();
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const twoWeeksAgoStr = localDateISO(twoWeeksAgo);

        const missedLessons = lessons.filter(l =>
          l.status === "completed" &&
          l.enrolledStudents.includes(studentId) &&
          !l.presentStudents.includes(studentId) &&
          l.date >= twoWeeksAgoStr,
        );

        if (missedLessons.length === 0) return null;

        const availableSlots = lessons.filter(l =>
          l.status === "scheduled" &&
          l.date >= today &&
          !l.enrolledStudents.includes(studentId) &&
          l.enrolledStudents.length < l.maxStudents &&
          !(l.repositionRequests || []).some(
            r => r.studentId === studentId && r.status !== "declined",
          ),
        ).slice(0, 3);

        const pendingMyRequests = lessons.filter(l =>
          (l.repositionRequests || []).some(r => r.studentId === studentId && r.status === "pending"),
        );
        const approvedMyRequests = lessons.filter(l =>
          (l.repositionRequests || []).some(r => r.studentId === studentId && r.status === "approved"),
        );

        const fromLessonId = missedLessons[0]?.id ?? "";
        const cat = missedLessons[0] ? getCategory(missedLessons[0].categoryId) : undefined;

        return (
          <motion.div variants={homeItem}>
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/10 flex-shrink-0">
                  <Radio className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">Reposição</p>
                  <p className="text-sm font-bold text-white">
                    {missedLessons.length} aula{missedLessons.length > 1 ? "s" : ""} faltada{missedLessons.length > 1 ? "s" : ""} nos últimos 14 dias
                  </p>
                </div>
              </div>

              {approvedMyRequests.length > 0 && (
                <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-emerald-300 font-bold">Reposição aprovada! Você já está matriculado na aula.</p>
                </div>
              )}

              {pendingMyRequests.length > 0 && (
                <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300 font-bold">Solicitação enviada — aguardando aprovação do Will.</p>
                </div>
              )}

              {pendingMyRequests.length === 0 && approvedMyRequests.length === 0 && availableSlots.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-zinc-500 font-bold mb-1.5">Escolha uma aula para repor:</p>
                  {availableSlots.map(slot => {
                    const slotCat = getCategory(slot.categoryId);
                    const vagasLivres = slot.maxStudents - slot.enrolledStudents.length;
                    return (
                      <motion.button
                        key={slot.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          haptic(18);
                          requestReposition(slot.id, studentId, fromLessonId);
                          toast("🔄 Solicitação de reposição enviada!");
                        }}
                        className={`w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3 py-2.5 text-left hover:border-amber-500/40 hover:bg-amber-500/5 transition-all ${ctaClass}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: slotCat?.color ?? "#EAB308" }} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{slot.title || slotCat?.name || "Aula"}</p>
                            <p className="text-[10px] text-zinc-500">{slot.date} · {slot.startTime}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-zinc-500">{vagasLivres} vaga{vagasLivres !== 1 ? "s" : ""}</span>
                          <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-0.5">Repor</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {pendingMyRequests.length === 0 && approvedMyRequests.length === 0 && availableSlots.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-2">Nenhuma vaga disponível no momento. Fale com o Will pelo WhatsApp.</p>
              )}
            </div>
          </motion.div>
        );
      })()}

      <StudentAgendaPanel
        showAgendaPanel={showAgendaPanel}
        setShowAgendaPanel={setShowAgendaPanel}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        week7={week7}
        myLessons={myLessons}
        weekScheduledCount={weekScheduledCount}
        weekCompletedCount={weekCompletedCount}
        executionRate={executionRate}
        setLessonModal={setLessonModal}
        getLessonExecutionStage={getLessonExecutionStage}
        haptic={haptic}
        ctaClass={ctaClass}
      />

      {/* Minha Evolução — colapsável (P2) */}
      {myLessons.length > 0 && (
        <motion.div variants={homeItem} className="mb-5">
          <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/45 backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              onClick={() => { haptic(8); setEvolutionExpanded((v) => !v); }}
              className={`w-full p-4 text-left ${ctaClass}`}
              aria-expanded={evolutionExpanded}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#EAB308]" />
                  Minha Evolução
                </h2>
                <ChevronRight className={`w-5 h-5 flex-shrink-0 text-zinc-500 transition-transform duration-200 ${evolutionExpanded ? "rotate-90" : ""}`} />
              </div>
              {!evolutionExpanded && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2 text-center">
                    <p className="text-[9px] text-zinc-500">Disciplina</p>
                    <p className="text-sm font-black text-[#22C55E]">{disciplineScore}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2 text-center">
                    <p className="text-[9px] text-zinc-500">Nota coach</p>
                    <p className="text-sm font-black text-[#EAB308]">{avgRating ? avgRating.toFixed(1) : "—"}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2 text-center">
                    <p className="text-[9px] text-zinc-500">Fundamentos</p>
                    <p className="text-sm font-black text-white">{fundamentalsAverage}</p>
                  </div>
                </div>
              )}
            </button>

            <AnimatePresence initial={false}>
              {evolutionExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowPillarPanel(true)}
                        className={`text-[10px] font-bold text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20 hover:bg-violet-500/20 transition-colors ${ctaClass}`}>
                        Notas do Coach
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAttendanceCalendar(true)}
                        className={`text-[10px] font-bold text-zinc-300 bg-zinc-800/60 px-3 py-1.5 rounded-lg border border-zinc-700/40 hover:bg-zinc-700/60 transition-colors ${ctaClass}`}>
                        📅 Histórico
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowLessonHistory(true)}
                        data-testid="btn-lesson-history"
                        className={`text-[10px] font-bold text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/25 hover:bg-amber-500/20 transition-colors ${ctaClass}`}>
                        📋 Treinos
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEvolModal(true)}
                        className={`text-[10px] font-bold text-[#EAB308] bg-[#EAB308]/10 px-3 py-1.5 rounded-lg border border-[#EAB308]/20 hover:bg-[#EAB308]/20 transition-colors ${ctaClass}`}>
                        Relatório completo
                      </motion.button>
                    </div>

                    {myFeedbacks.length === 0 ? (
                      <div className="text-center py-6 rounded-xl border border-dashed border-zinc-800">
                        <TrendingUp className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                        <p className="text-sm font-bold text-zinc-400">Ainda sem avaliações</p>
                        <p className="text-xs text-zinc-600 mt-1">Após as aulas, o professor enviará feedbacks técnicos que aparecerão aqui.</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Disciplina", value: `${disciplineScore}`, color: "#22C55E" },
                            { label: "Técnica", value: `${performanceScore}`, color: "#EAB308" },
                            { label: "Feedback", value: `${coachTrustScore}`, color: "#60A5FA" },
                          ].map((m) => (
                            <div key={m.label} className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2 text-center">
                              <p className="text-sm font-black" style={{ color: m.color }}>{m.value}</p>
                              <p className="text-[9px] text-zinc-500">{m.label}</p>
                            </div>
                          ))}
                        </div>
                        {evolutionLineChart ? (
                          <div className="rounded-xl border border-zinc-800 bg-zinc-950/55 p-3">
                            <p className="text-[9px] text-zinc-500 mb-1">Linha de evolução técnica</p>
                            <svg viewBox={`0 0 ${evolutionLineChart.w} ${evolutionLineChart.h}`} className="w-full h-20" preserveAspectRatio="none">
                              <path d={evolutionLineChart.areaD} fill="rgba(234,179,8,0.18)" opacity="0.35" />
                              <motion.path d={evolutionLineChart.d} fill="none" stroke="#EAB308" strokeWidth="2.2" strokeLinecap="round"
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                            </svg>
                          </div>
                        ) : null}
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950/55 p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-[#EAB308]" /> Fundamentos
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2">
                              <p className="text-[9px] text-zinc-500">Média</p>
                              <p className="text-[12px] font-black text-white">{fundamentalsAverage}</p>
                            </div>
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2">
                              <p className="text-[9px] text-zinc-500">Em alta</p>
                              <p className="text-[12px] font-black text-[#22C55E]">{fundamentalsTrend.filter((f) => f.trend === "up").length}</p>
                            </div>
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/55 p-2">
                              <p className="text-[9px] text-zinc-500">Atenção</p>
                              <p className="text-[12px] font-black text-[#EF4444]">{fundamentalsTrend.filter((f) => f.trend === "down").length}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEvolModal(true)}
                          className={`w-full rounded-xl border border-[#EAB308]/25 bg-[#EAB308]/8 py-2.5 text-[11px] font-bold text-[#EAB308] hover:bg-[#EAB308]/12 transition-colors ${ctaClass}`}
                        >
                          Ver gráfico completo e histórico de notas →
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Banners suplementares: prioridade única ──
           Regra: máx 1 de cada vez.
           Hierarquia: Destaque > Resumo Semanal > Onboarding
           O countdown card e o push banner ficam fora desta prioridade. */}
      {profile?.id && user?.id && (() => {
        // WeeklyHighlightBanner controla internamente se mostra (via Supabase query).
        // Ele dispara e mostra ou não. Para os outros verificamos via props antes de renderizar.
        const isOnboardingCandidate = totalXP < 400;
        const isSummaryDay = (() => { const d = new Date().getDay(); return d === 5 || d === 6; })();

        // Slot único: Destaque tem prioridade; se não estiver visível, vai para o próximo
        // WeeklyHighlightBanner já gerencia dismiss internamente — renderizamos sempre e ele decide
        return (
          <motion.div variants={homeItem} className="mb-4">
            {/* Priority 1: Destaque da Semana */}
            <WeeklyHighlightBanner
              studentCrmId={profile.id}
              firstName={profile.name?.split(" ")[0] ?? "Atleta"}
            />
            {/* Priority 2: Resumo Semanal (só Sex/Sáb — WeeklySummaryBanner controla internamente) */}
            {isSummaryDay && (
              <WeeklySummaryBanner
                lessons={lessons}
                studentId={user.id}
                totalXP={totalXP}
                streak={streak}
                getCategoryName={(id) => getCategory(id)?.name ?? "Aula"}
              />
            )}
            {/* Priority 2b: Desafio Semanal da Turma */}
            {profile?.id && user?.id && (
              <WeeklyChallengeCard
                lessons={lessons}
                studentId={profile.id}
                authUserId={user.id}
                totalXP={totalXP}
                onConfetti={() => setConfettiActive(true)}
              />
            )}
            {/* Priority 3: Onboarding (só novos atletas, não-Sex/Sáb para evitar stack) */}
            {isOnboardingCandidate && !isSummaryDay && profile?.id && (
              <OnboardingWidget
                studentId={profile.id}
                totalXP={totalXP}
                hasAvatar={!!(profile.avatar && !profile.avatar.includes("dicebear"))}
                onOpenChallenges={() => setShowDailyChallenges(true)}
                onOpenTwin={() => { markTwinViewed(profile.id); setShowStudentTwin(true); }}
                onOpenFeed={() => { }}
                onOpenProfile={() => { }}
              />
            )}
          </motion.div>
        );
      })()}

      {/* Conquistas — CLICÁVEIS */}
      <motion.div variants={homeItem} className="mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3"><Trophy className="w-5 h-5 text-[#EAB308]"/> Conquistas</h2>
        <div className="mb-3 rounded-2xl border border-white/[0.07] bg-zinc-950/45 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Trilhas desbloqueadas</p>
              <p className="text-sm font-black" style={{ color: equippedTier.color }}>
                {unlockedTracksCount}/{achievementTracks.length} · nível {equippedTier.label}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 justify-end">
              <button
                onClick={() => { haptic([16, 12, 24]); setShowDailyChallenges(true); }}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border border-violet-500/40 bg-violet-500/12 text-violet-300 transition-colors hover:bg-violet-500/20 ${ctaClass}`}
              >
                Desafios ⚡
              </button>
              {crmStudentId && (
                <button
                  onClick={() => { haptic(18); setShowMessagesPanel(true); }}
                  className={`relative text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#EAB308]/40 bg-[#EAB308]/10 text-amber-300 transition-colors hover:bg-[#EAB308]/20 ${ctaClass}`}
                >
                  💬 Recados
                  {messagesUnread > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EAB308] text-[8px] font-black text-black">
                      {messagesUnread}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => { haptic(8); setShowConquistasMore(true); }}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border border-zinc-700/60 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors ${ctaClass}`}
              >
                Mais ···
              </button>
            </div>
          </div>
          <div className="mt-2 h-2 rounded-full bg-zinc-900 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((unlockedTracksCount / Math.max(1, achievementTracks.length)) * 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to right, ${equippedTier.color}80, ${equippedTier.color})` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-zinc-600">Conquistas por trilha: consistência, técnica, fundamentos e execução competitiva.</p>
          <button
            type="button"
            onClick={() => { haptic([16, 12, 24]); setShowGamificationDashboard(true); }}
            className={`mt-3 w-full rounded-xl border border-[#EAB308]/25 bg-[#EAB308]/8 px-3 py-2.5 text-left hover:bg-[#EAB308]/12 transition-colors ${ctaClass}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#EAB308]">XP e progresso</p>
            <p className="text-xs font-bold text-white mt-0.5">Ver detalhes · histórico · cards desbloqueados →</p>
          </button>

          {/* Student Digital Twin Card */}
          {user?.id && (
            <div className="mt-3">
              <StudentTwinCard
                studentId={user.id}
                studentName={user.name ?? "Atleta"}
                onOpenFull={() => setShowStudentTwin(true)}
              />
            </div>
          )}
        </div>
        <button
          onClick={() => setTrackModalId("competitive")}
          className={`w-full rounded-2xl border border-zinc-800 bg-zinc-950/55 p-3 text-left hover:border-zinc-700 transition-colors ${ctaClass}`}
        >
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Jornada de conquistas</p>
          <p className="text-sm font-bold text-white mt-1">Acompanhe trilhas, pontuação e próximos desbloqueios</p>
          <p className="text-[10px] text-zinc-500 mt-1">{unlockedTracksCount}/{achievementTracks.length} trilhas liberadas</p>
        </button>
      </motion.div>

      <StudentHomePrimaryModals
        showConquistasMore={showConquistasMore}
        showNotif={showNotif}
        lessonModal={lessonModal}
        ratingLesson={ratingLesson}
        confettiActive={confettiActive}
        evolModal={evolModal}
        trackModalId={trackModalId}
        statsModal={statsModal}
        showDailyQuote={showDailyQuote}
        showXpModal={showXpModal}
        showGamificationDashboard={showGamificationDashboard}
        showDailyChallenges={showDailyChallenges}
        showStudentTwin={showStudentTwin}
        showPillarPanel={showPillarPanel}
        showMessagesPanel={showMessagesPanel}
        justUnlockedTier={justUnlockedTier}
        showShareCard={showShareCard}
        setShowConquistasMore={setShowConquistasMore}
        setShowNotif={setShowNotif}
        setLessonModal={setLessonModal}
        setRatingLesson={setRatingLesson}
        setConfettiActive={setConfettiActive}
        setEvolModal={setEvolModal}
        setTrackModalId={setTrackModalId}
        setStatsModal={setStatsModal}
        setShowDailyQuote={setShowDailyQuote}
        setShowXpModal={setShowXpModal}
        setShowGamificationDashboard={setShowGamificationDashboard}
        setShowDailyChallenges={setShowDailyChallenges}
        setShowStudentTwin={setShowStudentTwin}
        setShowPillarPanel={setShowPillarPanel}
        setShowMessagesPanel={setShowMessagesPanel}
        setJustUnlockedTier={setJustUnlockedTier}
        setShowShareCard={setShowShareCard}
        setShowTimeline={setShowTimeline}
        setShowNotificationCenter={setShowNotificationCenter}
        setShowPushSettings={setShowPushSettings}
        setShowAchievementFeed={setShowAchievementFeed}
        setShowTrainingPlan={setShowTrainingPlan}
        setShowReferralPanel={setShowReferralPanel}
        user={user}
        profile={profile}
        students={students}
        myLessons={myLessons}
        myFeedbacks={myFeedbacks}
        visibleNotifications={visibleNotifications}
        xpLogEntries={xpLogEntries}
        totalXP={totalXP}
        streak={streak}
        bestStreak={bestStreak}
        frequency={frequency}
        completedCount={completedCount}
        completedFromLessons={completedFromLessons}
        avgRating={avgRating}
        freqColor={freqColor}
        disciplineScore={disciplineScore}
        performanceScore={performanceScore}
        coachTrustScore={coachTrustScore}
        meritScore={meritScore}
        currentTier={currentTier}
        nextTier={nextTier}
        weeklyConsistency={weeklyConsistency}
        evolutionLineChart={evolutionLineChart}
        evoChartIdModal={evoChartIdModal}
        sessionsToBeatRecord={sessionsToBeatRecord}
        attendedLessons={attendedLessons}
        attendanceDiagnostics={attendanceDiagnostics}
        achievementTracks={achievementTracks}
        activeTrack={activeTrack}
        equippedTier={equippedTier}
        xpByFundamental={xpByFundamental}
        dailyQuote={dailyQuote}
        crmStudentId={crmStudentId}
        shareText={shareText}
        setShareText={setShareText}
        xpFloatEvents={xpFloatEvents}
        removeXPFloat={removeXPFloat}
        haptic={haptic}
        checkInGate={checkInGate}
        getLessonRating={getLessonRating}
        addLessonRating={addLessonRating}
        requestCheckIn={requestCheckIn}
        markNotificationRead={markNotificationRead}
        refreshCoachMessagesUnread={refreshCoachMessagesUnread}
        addPost={addPost}
        toast={toast}
        markTwinViewed={markTwinViewed}
        ctaClass={ctaClass}
      />

      {/* Floating Action Menu */}
      <FloatingActionMenu
        onCheckIn={() => toast("💚 Check-in: vá até a quadra e pressione o botão de check-in da turma", "info")}
        onViewLessons={() => setShowAgendaPanel(true)}
        onViewSchedule={() => setShowStudentSchedule(true)}
        onReportAbsence={() => setShowAbsenceSheet(true)}
        onRequestReposition={() => setShowRepositionSheet(true)}
        onViewPayments={() => setShowPayments(true)}
        onFreeTraining={() => setShowFreeTraining(true)}
        onQRScan={() => setShowQRScanner(true)}
      />

      <StudentHomeModals
        showAttendanceCalendar={showAttendanceCalendar}
        showLessonHistory={showLessonHistory}
        showStudentSchedule={showStudentSchedule}
        showAbsenceSheet={showAbsenceSheet}
        showRepositionSheet={showRepositionSheet}
        showTimeline={showTimeline}
        showNotificationCenter={showNotificationCenter}
        showPushSettings={showPushSettings}
        showFreeTraining={showFreeTraining}
        showAchievementFeed={showAchievementFeed}
        showReferralPanel={showReferralPanel}
        showTrainingPlan={showTrainingPlan}
        showQRScanner={showQRScanner}
        showPayments={showPayments}
        setShowAttendanceCalendar={setShowAttendanceCalendar}
        setShowLessonHistory={setShowLessonHistory}
        setShowStudentSchedule={setShowStudentSchedule}
        setShowAbsenceSheet={setShowAbsenceSheet}
        setShowRepositionSheet={setShowRepositionSheet}
        setShowTimeline={setShowTimeline}
        setShowNotificationCenter={setShowNotificationCenter}
        setShowPushSettings={setShowPushSettings}
        setShowFreeTraining={setShowFreeTraining}
        setShowAchievementFeed={setShowAchievementFeed}
        setShowReferralPanel={setShowReferralPanel}
        setShowTrainingPlan={setShowTrainingPlan}
        setShowQRScanner={setShowQRScanner}
        setShowPayments={setShowPayments}
        lessons={lessons}
        profile={profile}
        user={user}
        streak={streak}
        bestStreak={bestStreak}
        getCategory={getCategory}
        sessionExpired={sessionExpired}
        sessionRecovering={sessionRecovering}
        recoverSession={recoverSession}
        sessionForceLogout={sessionForceLogout}
      />

      {/* Invisible presence tracker — registra o aluno no canal Realtime de presença */}
      {profile?.id && profile?.name && (
        <PresenceTracker studentId={profile.id} studentName={profile.name} />
      )}

      {/* Invisible milestone tracker — fires onUnlock toast when a new badge is earned */}
      {profile?.id && sessionToken && (
        <MilestoneTracker
          studentCrmId={profile.id}
          authToken={sessionToken}
          lessons={lessons}
          studentId={user?.id ?? ""}
          totalXP={totalXP}
          streak={streak}
          onUnlock={({ title, emoji, xp }) => {
            richToast.xp(xp, `${emoji} ${title}`);
          }}
        />
      )}

    </motion.div>
    </>
  );
}
