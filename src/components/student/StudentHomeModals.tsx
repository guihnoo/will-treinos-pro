"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import type { Lesson, LessonCategory, Student, User } from "@/context/types";
import SessionExpiredModal from "@/components/SessionExpiredModal";

// Lazy-loaded panels (same split strategy as StudentHome)
const AttendanceCalendarPanel = dynamic(
  () => import("@/components/student/AttendanceCalendarPanel"),
  { ssr: false, loading: () => null },
);
const LessonHistoryPanel = dynamic(
  () => import("@/components/student/LessonHistoryPanel"),
  { ssr: false, loading: () => null },
);
const StudentSchedulePanel = dynamic(
  () => import("@/components/student/StudentSchedulePanel"),
  { ssr: false, loading: () => null },
);
const AbsenceRequestSheet = dynamic(
  () => import("@/components/student/AbsenceRequestSheet"),
  { ssr: false, loading: () => null },
);
const RepositionSheet = dynamic(
  () => import("@/components/student/RepositionSheet"),
  { ssr: false, loading: () => null },
);
const AthleteTimelinePanel = dynamic(
  () => import("@/components/student/AthleteTimelinePanel"),
  { ssr: false, loading: () => null },
);
const NotificationCenterPanel = dynamic(
  () => import("@/components/student/NotificationCenterPanel"),
  { ssr: false, loading: () => null },
);
const PushSettingsPanel = dynamic(
  () => import("@/components/PushSettingsPanel"),
  { ssr: false, loading: () => null },
);
const FreeTrainingSheet = dynamic(
  () => import("@/components/student/FreeTrainingSheet"),
  { ssr: false, loading: () => null },
);
const AchievementFeedPanel = dynamic(
  () => import("@/components/student/AchievementFeedPanel"),
  { ssr: false, loading: () => null },
);
const ReferralPanel = dynamic(
  () => import("@/components/student/ReferralPanel"),
  { ssr: false, loading: () => null },
);
const StudentTrainingPlanPanel = dynamic(
  () => import("@/components/student/StudentTrainingPlanPanel"),
  { ssr: false, loading: () => null },
);
const QRScannerSheet = dynamic(
  () => import("@/components/student/QRScannerSheet"),
  { ssr: false, loading: () => null },
);
const StudentPaymentSheet = dynamic(
  () =>
    import("@/components/student/StudentPaymentSheet").then((m) => ({
      default: m.StudentPaymentSheet,
    })),
  { ssr: false, loading: () => null },
);

export interface StudentHomeModalsProps {
  // ── open states ────────────────────────────────────────────────────────────
  showAttendanceCalendar: boolean;
  showLessonHistory: boolean;
  showStudentSchedule: boolean;
  showAbsenceSheet: boolean;
  showRepositionSheet: boolean;
  showTimeline: boolean;
  showNotificationCenter: boolean;
  showPushSettings: boolean;
  showFreeTraining: boolean;
  showAchievementFeed: boolean;
  showReferralPanel: boolean;
  showTrainingPlan: boolean;
  showQRScanner: boolean;
  showPayments: boolean;

  // ── setters ─────────────────────────────────────────────────────────────────
  setShowAttendanceCalendar: (v: boolean) => void;
  setShowLessonHistory: (v: boolean) => void;
  setShowStudentSchedule: (v: boolean) => void;
  setShowAbsenceSheet: (v: boolean) => void;
  setShowRepositionSheet: (v: boolean) => void;
  setShowTimeline: (v: boolean) => void;
  setShowNotificationCenter: (v: boolean) => void;
  setShowPushSettings: (v: boolean) => void;
  setShowFreeTraining: (v: boolean) => void;
  setShowAchievementFeed: (v: boolean) => void;
  setShowReferralPanel: (v: boolean) => void;
  setShowTrainingPlan: (v: boolean) => void;
  setShowQRScanner: (v: boolean) => void;
  setShowPayments: (v: boolean) => void;

  // ── data props ──────────────────────────────────────────────────────────────
  lessons: Lesson[];
  profile: Student | undefined;
  user: User | null;
  streak: number;
  bestStreak: number;
  getCategory: (id: string) => LessonCategory | undefined;

  // ── session ─────────────────────────────────────────────────────────────────
  sessionExpired: boolean;
  sessionRecovering: boolean;
  recoverSession: () => void;
  sessionForceLogout: () => void;
}

export default function StudentHomeModals({
  showAttendanceCalendar,
  showLessonHistory,
  showStudentSchedule,
  showAbsenceSheet,
  showRepositionSheet,
  showTimeline,
  showNotificationCenter,
  showPushSettings,
  showFreeTraining,
  showAchievementFeed,
  showReferralPanel,
  showTrainingPlan,
  showQRScanner,
  showPayments,
  setShowAttendanceCalendar,
  setShowLessonHistory,
  setShowStudentSchedule,
  setShowAbsenceSheet,
  setShowRepositionSheet,
  setShowTimeline,
  setShowNotificationCenter,
  setShowPushSettings,
  setShowFreeTraining,
  setShowAchievementFeed,
  setShowReferralPanel,
  setShowTrainingPlan,
  setShowQRScanner,
  setShowPayments,
  lessons,
  profile,
  user,
  streak,
  bestStreak,
  getCategory,
  sessionExpired,
  sessionRecovering,
  recoverSession,
  sessionForceLogout,
}: StudentHomeModalsProps) {
  return (
    <>
      <AnimatePresence>
        {showAttendanceCalendar && user?.id && (
          <AttendanceCalendarPanel
            lessons={lessons}
            studentId={user.id}
            getCategoryName={(id) => getCategory(id)?.name ?? "Aula"}
            streak={streak}
            bestStreak={bestStreak}
            onClose={() => setShowAttendanceCalendar(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLessonHistory && profile?.id && (
          <LessonHistoryPanel
            studentId={profile.id}
            getCategory={getCategory}
            onClose={() => setShowLessonHistory(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStudentSchedule && user?.id && (
          <StudentSchedulePanel
            studentId={user.id}
            lessons={lessons}
            getCategory={getCategory}
            onClose={() => setShowStudentSchedule(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAbsenceSheet && user?.id && (
          <AbsenceRequestSheet
            lessons={lessons}
            studentId={user.id}
            getCategoryName={(id) => getCategory(id)?.name ?? "Aula"}
            onClose={() => setShowAbsenceSheet(false)}
            onRequestReposition={() => setShowRepositionSheet(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRepositionSheet && (
          <RepositionSheet
            getCategoryName={(id) => getCategory(id)?.name ?? "Aula"}
            onClose={() => setShowRepositionSheet(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTimeline && profile?.id && (
          <AthleteTimelinePanel
            studentCrmId={profile.id}
            studentName={profile.name ?? user?.name ?? "Atleta"}
            onClose={() => setShowTimeline(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotificationCenter && user?.id && (
          <NotificationCenterPanel
            studentId={user.id}
            onClose={() => setShowNotificationCenter(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPushSettings && (
          <PushSettingsPanel
            role="aluno"
            onClose={() => setShowPushSettings(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFreeTraining && profile?.id && (
          <FreeTrainingSheet
            studentCrmId={profile.id}
            onClose={() => setShowFreeTraining(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAchievementFeed && user?.id && (
          <AchievementFeedPanel
            studentId={user.id}
            onClose={() => setShowAchievementFeed(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReferralPanel && profile?.id && (
          <ReferralPanel
            studentId={profile.id}
            onClose={() => setShowReferralPanel(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTrainingPlan && user?.id && (
          <StudentTrainingPlanPanel
            studentId={user.id}
            onClose={() => setShowTrainingPlan(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQRScanner && (
          <QRScannerSheet onClose={() => setShowQRScanner(false)} />
        )}
      </AnimatePresence>

      {/* StudentPaymentSheet uses open/onClose pattern (not AnimatePresence) */}
      <StudentPaymentSheet
        open={showPayments}
        onClose={() => setShowPayments(false)}
      />

      {/* Session expired modal — outside motion.div (global) */}
      <SessionExpiredModal
        isOpen={sessionExpired}
        onReconnect={recoverSession}
        onLogout={sessionForceLogout}
        recovering={sessionRecovering}
      />
    </>
  );
}
