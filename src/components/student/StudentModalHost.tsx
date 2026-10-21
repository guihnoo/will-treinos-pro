"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { useStudentModalStore, studentModalManager } from "@/lib/studentModalManager";
import { useAuth } from "@/context/AuthContext";
import { useLessons } from "@/context/LessonsContext";
import { useStudents } from "@/context/StudentsContext";
import { usePayments } from "@/context/PaymentsContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCoaching } from "@/context/CoachingContext";
import { useGamification } from "@/context/GamificationContext";
import { useLessonRatings } from "@/context/LessonRatingsContext";
import { useCheckIn } from "@/context/CheckInContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useFeed } from "@/context/FeedContext";
import { useSessionRecovery } from "@/hooks/useSessionRecovery";
import { fetchXpLogEntriesRemote, type XpLogEntry } from "@/lib/supabasePersistence";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Lesson, CardTier, Student, Notification, PerformanceFeedback } from "@/context/types";
import type { AchievementTrackWithScore } from "@/components/student/studentHomeShared";
import type { EvolutionLineChartData } from "@/components/student/EvolutionTrendPanel";

// ─── Lazy-loaded panels (Split sob demanda — zero bundle no start) ───────────
const WelcomeModal = dynamic(() => import("./WelcomeModal"), {
  ssr: false,
  loading: () => null,
});

const StudentAgendaPanel = dynamic(
  () => import("./StudentAgendaPanel").then((m) => ({ default: m.StudentAgendaPanel })),
  { ssr: false, loading: () => null }
);

const StudentHomeModals = dynamic(() => import("./StudentHomeModals"), {
  ssr: false,
  loading: () => null,
});

const StudentHomePrimaryModals = dynamic(() => import("./StudentHomePrimaryModals"), {
  ssr: false,
  loading: () => null,
});

export interface StudentModalHostProps {
  profile?: Student;
  crmStudentId?: string | null;
  myLessons?: Lesson[];
  myFeedbacks?: PerformanceFeedback[];
  visibleNotifications?: Notification[];
  streak?: number;
  bestStreak?: number;
  frequency?: number;
  completedCount?: number;
  completedFromLessons?: number;
  avgRating?: number;
  freqColor?: string;
  disciplineScore?: number;
  performanceScore?: number;
  coachTrustScore?: number;
  meritScore?: number;
  currentTier?: { id: string; min: number; label: string; color: string };
  nextTier?: { id: string; min: number; label: string; color: string } | null;
  weeklyConsistency?: number;
  evolutionLineChart?: EvolutionLineChartData | null;
  evoChartIdModal?: string;
  sessionsToBeatRecord?: number;
  attendedLessons?: Lesson[];
  attendanceDiagnostics?: { recent: Lesson[]; rate: number; cause: string; impact: string; action: string };
  achievementTracks?: AchievementTrackWithScore[];
  activeTrack?: AchievementTrackWithScore | null;
  equippedTier?: { id: string; min: number; label: string; color: string };
  xpByFundamental?: Record<string, number>;
  dailyQuote?: { text: string; author: string; role: string };
  checkInGate?: (lesson: Lesson) => { locked: boolean; reason: string; unlockLabel: string };
  haptic?: (pattern: number | number[]) => void;
  toast?: (msg: string, type?: string) => void;
  markTwinViewed?: (studentId: string) => void;
  ctaClass?: string;
  // StudentAgendaPanel props
  selectedDay?: string | null;
  setSelectedDay?: (v: string | null) => void;
  week7?: string[];
  weekScheduledCount?: number;
  weekCompletedCount?: number;
  executionRate?: number;
  getLessonExecutionStage?: (lesson: Lesson) => { stage: number; label: string; color: string };
}

/**
 * Orquestrador Central Desacoplado de Modais do Aluno.
 * Consome o useStudentModalStore() e carrega apenas os chunks necessários via next/dynamic.
 * Elimina 35+ useStates e renders desnecessários do StudentHome.tsx.
 */
export function StudentModalHost({
  profile,
  crmStudentId,
  myLessons = [],
  myFeedbacks = [],
  visibleNotifications = [],
  streak = 0,
  bestStreak = 0,
  frequency = 0,
  completedCount = 0,
  completedFromLessons = 0,
  avgRating = 0,
  freqColor = "#22C55E",
  disciplineScore = 0,
  performanceScore = 0,
  coachTrustScore = 0,
  meritScore = 0,
  currentTier = { id: "bronze", min: 0, label: "Bronze", color: "#CD7F32" },
  nextTier = null,
  weeklyConsistency = 0,
  evolutionLineChart = null,
  evoChartIdModal = "evo-m",
  sessionsToBeatRecord = 0,
  attendedLessons = [],
  attendanceDiagnostics = { recent: [], rate: 0, cause: "", impact: "", action: "" },
  achievementTracks = [],
  activeTrack = null,
  equippedTier = { id: "bronze", min: 0, label: "Bronze", color: "#CD7F32" },
  xpByFundamental = {},
  dailyQuote = { text: "O sucesso é a soma de pequenos esforços.", author: "Will Coach", role: "Head Coach" },
  checkInGate = () => ({ locked: false, reason: "", unlockLabel: "" }),
  haptic = () => {},
  toast = () => {},
  markTwinViewed = () => {},
  ctaClass = "",
  selectedDay = null,
  setSelectedDay = () => {},
  week7 = [],
  weekScheduledCount = 0,
  weekCompletedCount = 0,
  executionRate = 0,
  getLessonExecutionStage = () => ({ stage: 1, label: "Agendada", color: "#94A3B8" }),
}: StudentModalHostProps) {
  const { activeModal, modalPayload, closeModal } = useStudentModalStore();
  const { user } = useAuth();
  const { lessons } = useLessons();
  const { students } = useStudents();
  const { getCategory } = useCatalog();
  const { totalXP, xpFloatEvents, removeXPFloat } = useGamification();
  const { lessonRatings, getLessonRating, addLessonRating } = useLessonRatings();
  const { requestCheckIn } = useCheckIn();
  const { markNotificationRead, refreshCoachMessagesUnread } = useNotifications();
  const { addPost } = useFeed();
  const {
    isExpired: sessionExpired,
    recovering: sessionRecovering,
    recover: recoverSession,
    forceLogout: sessionForceLogout,
  } = useSessionRecovery();

  const [xpLogEntries, setXpLogEntries] = useState<XpLogEntry[]>([]);
  const [shareText, setShareText] = useState("");
  const [confettiActive, setConfettiActive] = useState(false);

  // Carrega log de XP quando o modal de histórico de XP é aberto
  useEffect(() => {
    if (activeModal !== "xpHistory" || !user?.id) {
      setXpLogEntries([]);
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;
    void fetchXpLogEntriesRemote(supabase, user.id, 10).then((entries) => setXpLogEntries(entries));
  }, [activeModal, user?.id]);

  const studentIdForData = crmStudentId ?? profile?.id ?? user?.id ?? "";

  const resolvedActiveTrack =
    activeTrack ??
    (activeModal === "track" && modalPayload?.trackId
      ? achievementTracks.find((t) => t.id === modalPayload.trackId) ?? null
      : null);

  // Helper para fechar ou alternar modal
  const handleToggle = (key: string, v: boolean) => {
    if (v) {
      studentModalManager.openModal(key);
    } else {
      studentModalManager.closeModal();
    }
  };

  return (
    <>
      {/* ─── 1. Welcome Modal (Boas-vindas primeiro login) ─────────────────── */}
      {activeModal === "welcome" && (
        <WelcomeModal
          name={(profile?.name || user?.name || "Atleta").split(" ")[0]!}
          onClose={() => {
            try {
              localStorage.setItem(`wt_welcomed_${user?.id ?? ""}`, "1");
            } catch {
              /* ignore */
            }
            closeModal();
          }}
        />
      )}

      {/* ─── 2. Student Agenda Panel (Agenda Completa de Aulas) ─────────────── */}
      <StudentAgendaPanel
        showAgendaPanel={activeModal === "agenda"}
        setShowAgendaPanel={(v) => (v ? studentModalManager.openModal("agenda") : closeModal())}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        week7={week7}
        myLessons={myLessons}
        weekScheduledCount={weekScheduledCount}
        weekCompletedCount={weekCompletedCount}
        executionRate={executionRate}
        setLessonModal={(l) => (l ? studentModalManager.openModal("lesson", { lesson: l }) : closeModal())}
        getLessonExecutionStage={getLessonExecutionStage}
        haptic={haptic}
        ctaClass={ctaClass}
      />

      {/* ─── 3. Primary Modals (Gamificação, Treino, Evolução, Conquistas) ─── */}
      <StudentHomePrimaryModals
        showConquistasMore={activeModal === "conquistasMore"}
        showNotif={activeModal === "notif"}
        lessonModal={activeModal === "lesson" ? ((modalPayload?.lesson as Lesson) ?? null) : null}
        ratingLesson={activeModal === "rating" ? ((modalPayload?.lesson as Lesson) ?? null) : null}
        confettiActive={confettiActive || activeModal === "tierUnlocked"}
        evolModal={activeModal === "evol"}
        trackModalId={activeModal === "track" ? ((modalPayload?.trackId as any) ?? null) : null}
        statsModal={activeModal === "stats" ? ((modalPayload?.statKey as any) ?? null) : null}
        showDailyQuote={activeModal === "dailyQuote"}
        showXpModal={activeModal === "xpHistory"}
        showGamificationDashboard={activeModal === "gamificationDashboard"}
        showDailyChallenges={activeModal === "dailyChallenges"}
        showStudentTwin={activeModal === "studentTwin"}
        showPillarPanel={activeModal === "pillar"}
        showMessagesPanel={activeModal === "messages"}
        justUnlockedTier={activeModal === "tierUnlocked" ? ((modalPayload?.tier as CardTier) ?? null) : null}
        showShareCard={activeModal === "shareCard"}
        setShowConquistasMore={(v) => handleToggle("conquistasMore", v)}
        setShowNotif={(v) => handleToggle("notif", v)}
        setLessonModal={(l) => (l ? studentModalManager.openModal("lesson", { lesson: l }) : closeModal())}
        setRatingLesson={(l) => (l ? studentModalManager.openModal("rating", { lesson: l }) : closeModal())}
        setConfettiActive={setConfettiActive}
        setEvolModal={(v) => handleToggle("evol", v)}
        setTrackModalId={(id) => (id ? studentModalManager.openModal("track", { trackId: id }) : closeModal())}
        setStatsModal={(s) => (s ? studentModalManager.openModal("stats", { statKey: s }) : closeModal())}
        setShowDailyQuote={(v) => handleToggle("dailyQuote", v)}
        setShowXpModal={(v) => handleToggle("xpHistory", v)}
        setShowGamificationDashboard={(v) => handleToggle("gamificationDashboard", v)}
        setShowDailyChallenges={(v) => handleToggle("dailyChallenges", v)}
        setShowStudentTwin={(v) => handleToggle("studentTwin", v)}
        setShowPillarPanel={(v) => handleToggle("pillar", v)}
        setShowMessagesPanel={(v) => handleToggle("messages", v)}
        setJustUnlockedTier={(t) => (t ? studentModalManager.openModal("tierUnlocked", { tier: t }) : closeModal())}
        setShowShareCard={(v) => handleToggle("shareCard", v)}
        setShowTimeline={(v) => handleToggle("timeline", v)}
        setShowNotificationCenter={(v) => handleToggle("notificationCenter", v)}
        setShowPushSettings={(v) => handleToggle("pushSettings", v)}
        setShowAchievementFeed={(v) => handleToggle("achievementFeed", v)}
        setShowTrainingPlan={(v) => handleToggle("trainingPlan", v)}
        setShowReferralPanel={(v) => handleToggle("referral", v)}
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
        activeTrack={resolvedActiveTrack}
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

      {/* ─── 4. Secondary Modals (Presenças, Finanças, Reposição, Scanner, etc.) ─── */}
      <StudentHomeModals
        showAttendanceCalendar={activeModal === "attendanceCalendar"}
        showLessonHistory={activeModal === "lessonHistory"}
        showStudentSchedule={activeModal === "studentSchedule"}
        showAbsenceSheet={activeModal === "absenceSheet"}
        showRepositionSheet={activeModal === "repositionSheet"}
        showTimeline={activeModal === "timeline"}
        showNotificationCenter={activeModal === "notificationCenter"}
        showPushSettings={activeModal === "pushSettings"}
        showFreeTraining={activeModal === "freeTraining"}
        showAchievementFeed={activeModal === "achievementFeed"}
        showReferralPanel={activeModal === "referral"}
        showTrainingPlan={activeModal === "trainingPlan"}
        showQRScanner={activeModal === "qrScanner"}
        showPayments={activeModal === "payments"}
        setShowAttendanceCalendar={(v) => handleToggle("attendanceCalendar", v)}
        setShowLessonHistory={(v) => handleToggle("lessonHistory", v)}
        setShowStudentSchedule={(v) => handleToggle("studentSchedule", v)}
        setShowAbsenceSheet={(v) => handleToggle("absenceSheet", v)}
        setShowRepositionSheet={(v) => handleToggle("repositionSheet", v)}
        setShowTimeline={(v) => handleToggle("timeline", v)}
        setShowNotificationCenter={(v) => handleToggle("notificationCenter", v)}
        setShowPushSettings={(v) => handleToggle("pushSettings", v)}
        setShowFreeTraining={(v) => handleToggle("freeTraining", v)}
        setShowAchievementFeed={(v) => handleToggle("achievementFeed", v)}
        setShowReferralPanel={(v) => handleToggle("referral", v)}
        setShowTrainingPlan={(v) => handleToggle("trainingPlan", v)}
        setShowQRScanner={(v) => handleToggle("qrScanner", v)}
        setShowPayments={(v) => handleToggle("payments", v)}
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
    </>
  );
}
export default StudentModalHost;
