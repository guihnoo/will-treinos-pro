"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { useModalStore, modalManager } from "@/lib/modalManager";
import { useStudents } from "@/context/StudentsContext";
import { useLessons } from "@/context/LessonsContext";
import { usePayments } from "@/context/PaymentsContext";
import { useCatalog } from "@/context/CatalogContext";
import { useSessionRecovery } from "@/hooks/useSessionRecovery";
import type { Student, Lesson } from "@/context/types";

// ==========================================
// LOTE 1: MODAIS AUTOSSUFICIENTES (18 MODAIS)
// ==========================================
const XPModerationPanel = dynamic(() => import("./XPModerationPanel"), {
  ssr: false,
  loading: () => null,
});

const XPAnalyticsPanel = dynamic(
  () => import("@/components/will/XPAnalyticsPanel").then((m) => ({ default: m.XPAnalyticsPanel })),
  { ssr: false, loading: () => null }
);

const CoachCopilotPanel = dynamic(() => import("./CoachCopilotPanel"), {
  ssr: false,
  loading: () => null,
});

const FinancialForecastPanel = dynamic(() => import("./FinancialForecastPanel"), {
  ssr: false,
  loading: () => null,
});

const MonthlyReportPanel = dynamic(() => import("./MonthlyReportPanel"), {
  ssr: false,
  loading: () => null,
});

const AbsenceTrackerPanel = dynamic(() => import("./AbsenceTrackerPanel"), {
  ssr: false,
  loading: () => null,
});

const TurmaAnalyticsPanel = dynamic(() => import("./TurmaAnalyticsPanel"), {
  ssr: false,
  loading: () => null,
});

const AttentionPanel = dynamic(() => import("./AttentionPanel"), {
  ssr: false,
  loading: () => null,
});

const CoachOnboarding = dynamic(() => import("./CoachOnboarding"), {
  ssr: false,
  loading: () => null,
});

const AttendanceHeatmapPanel = dynamic(() => import("./AttendanceHeatmapPanel"), {
  ssr: false,
  loading: () => null,
});

const BusinessAnalyticsPanel = dynamic(() => import("./BusinessAnalyticsPanel"), {
  ssr: false,
  loading: () => null,
});

const WeeklyChallengeEditor = dynamic(() => import("./WeeklyChallengeEditor"), {
  ssr: false,
  loading: () => null,
});

const ChurnPreventionPanel = dynamic(() => import("./ChurnPreventionPanel"), {
  ssr: false,
  loading: () => null,
});

const EvaluationTemplateManager = dynamic(() => import("./EvaluationTemplateManager"), {
  ssr: false,
  loading: () => null,
});

const CategoryManagerPanel = dynamic(() => import("./CategoryManagerPanel"), {
  ssr: false,
  loading: () => null,
});

const ExportDataPanel = dynamic(() => import("./ExportDataPanel"), {
  ssr: false,
  loading: () => null,
});

const AppHealthPanel = dynamic(() => import("./AppHealthPanel"), {
  ssr: false,
  loading: () => null,
});

const AdminSettingsPanel = dynamic(() => import("./AdminSettingsPanel"), {
  ssr: false,
  loading: () => null,
});

// ==========================================
// LOTE 2: MODAIS DE ALUNO & FLUXO (10 MODAIS)
// ==========================================
const AthleteTwinPanel = dynamic(() => import("./AthleteTwinPanel"), {
  ssr: false,
  loading: () => null,
});

const EvaluationHistoryPanel = dynamic(() => import("./EvaluationHistoryPanel"), {
  ssr: false,
  loading: () => null,
});

const StudentFinanceSheet = dynamic(() => import("./StudentFinanceSheet"), {
  ssr: false,
  loading: () => null,
});

const TemporalComparisonPanel = dynamic(() => import("./TemporalComparisonPanel"), {
  ssr: false,
  loading: () => null,
});

const StudentReportSheet = dynamic(() => import("./StudentReportSheet"), {
  ssr: false,
  loading: () => null,
});

const ScoutModePanel = dynamic(() => import("./ScoutModePanel"), {
  ssr: false,
  loading: () => null,
});

const ImportStudentsModal = dynamic(() => import("./ImportStudentsModal"), {
  ssr: false,
  loading: () => null,
});

const BroadcastMessagePanel = dynamic(() => import("./BroadcastMessagePanel"), {
  ssr: false,
  loading: () => null,
});

const GlobalSearchModal = dynamic(() => import("./GlobalSearchModal"), {
  ssr: false,
  loading: () => null,
});

const SessionExpiredModal = dynamic(() => import("@/components/SessionExpiredModal"), {
  ssr: false,
  loading: () => null,
});

// ==========================================
// LOTE 3: MODAIS DE QUADRA & AULA (5 MODAIS)
// ==========================================
const QRCheckInModal = dynamic(() => import("./QRCheckInModal"), {
  ssr: false,
  loading: () => null,
});

const LessonRecapPanel = dynamic(() => import("./LessonRecapPanel"), {
  ssr: false,
  loading: () => null,
});

const QuickAttendancePanel = dynamic(() => import("./QuickAttendancePanel"), {
  ssr: false,
  loading: () => null,
});

const BulkEvaluationModal = dynamic(() => import("./BulkEvaluationModal"), {
  ssr: false,
  loading: () => null,
});

const LiveLessonCoachPanel = dynamic(() => import("./LiveLessonCoachPanel"), {
  ssr: false,
  loading: () => null,
});

export interface CockpitModalHostProps {
  onSelectStudent?: (studentId: string) => void;
  onSelectLesson?: (lessonId: string) => void;
  onGoToApproval?: () => void;
  selectedLesson?: Lesson | null;
}

/**
 * Orquestrador Central de Modais Desacoplados do WillCockpit (Lotes 1, 2 e 3).
 * Consome useModalStore(), useStudents(), useLessons(), usePayments() e useCatalog() sem re-renderizar o corpo do Cockpit.
 */
export function CockpitModalHost({
  onSelectStudent,
  onSelectLesson,
  onGoToApproval,
  selectedLesson: defaultLesson,
}: CockpitModalHostProps = {}) {
  const { activeModal, modalPayload, closeModal } = useModalStore();
  const { students } = useStudents();
  const { lessons } = useLessons();
  const { payments } = usePayments();
  const { getCategory } = useCatalog();

  // Monitoramento global de sessão expirada
  const {
    isExpired: sessionExpired,
    recovering: sessionRecovering,
    recover: recoverSession,
    forceLogout: sessionForceLogout,
  } = useSessionRecovery();

  // Resolver aluno com memoização segura
  const resolvedStudent = useMemo<Student | null>(() => {
    if (!modalPayload) return null;
    if (modalPayload.student && typeof modalPayload.student === "object") {
      return modalPayload.student as Student;
    }
    const id = modalPayload.studentId as string | undefined;
    if (!id) return null;
    return students.find((s) => s.id === id) ?? null;
  }, [modalPayload, students]);

  // Resolver aula com memoização segura
  const resolvedLesson = useMemo<Lesson | null>(() => {
    if (modalPayload?.lesson && typeof modalPayload.lesson === "object") {
      return modalPayload.lesson as Lesson;
    }
    const id = modalPayload?.lessonId as string | undefined;
    if (id) {
      return lessons.find((l) => l.id === id) ?? null;
    }
    return defaultLesson ?? null;
  }, [modalPayload, lessons, defaultLesson]);

  return (
    <>
      {/* ── LOTE 1: MODAIS AUTOSSUFICIENTES ── */}
      <AnimatePresence>
        {activeModal === "xpModeration" ? <XPModerationPanel onClose={closeModal} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "xpAnalytics" ? (
          <XPAnalyticsPanel isOpen={true} onClose={closeModal} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "coachCopilot" ? <CoachCopilotPanel onClose={closeModal} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "financialForecast" ? (
          <FinancialForecastPanel onClose={closeModal} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "monthlyReport" ? <MonthlyReportPanel onClose={closeModal} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "absenceTracker" ? <AbsenceTrackerPanel onClose={closeModal} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "turmaAnalytics" ? <TurmaAnalyticsPanel onClose={closeModal} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "attention" ? <AttentionPanel onClose={closeModal} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "coachOnboarding" ? <CoachOnboarding onClose={closeModal} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "attendanceHeatmap" ? (
          <AttendanceHeatmapPanel onClose={closeModal} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "businessAnalytics" ? (
          <BusinessAnalyticsPanel onClose={closeModal} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "weeklyChallenge" ? (
          <WeeklyChallengeEditor onClose={closeModal} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "churnPrevention" ? (
          <ChurnPreventionPanel onClose={closeModal} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "evaluationTemplates" ? (
          <EvaluationTemplateManager onClose={closeModal} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "categoryManager" ? <CategoryManagerPanel onClose={closeModal} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "exportData" ? <ExportDataPanel onClose={closeModal} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "appHealth" ? <AppHealthPanel onClose={closeModal} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "adminSettings" ? <AdminSettingsPanel onClose={closeModal} /> : null}
      </AnimatePresence>

      {/* ── LOTE 2: MODAIS DE ALUNO & FLUXO ── */}
      <AnimatePresence>
        {activeModal === "athleteTwin" && resolvedStudent ? (
          <AthleteTwinPanel student={resolvedStudent} onClose={closeModal} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "evaluationHistory" && (resolvedStudent || modalPayload?.studentId) ? (
          <EvaluationHistoryPanel
            studentId={resolvedStudent?.id ?? (modalPayload?.studentId as string)}
            studentName={resolvedStudent?.name ?? ((modalPayload?.studentName as string) || "Aluno")}
            onClose={closeModal}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "studentFinance" && resolvedStudent ? (
          <StudentFinanceSheet student={resolvedStudent} onClose={closeModal} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "temporalComparison" && resolvedStudent ? (
          <TemporalComparisonPanel student={resolvedStudent} onClose={closeModal} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "studentReport" && resolvedStudent ? (
          <StudentReportSheet student={resolvedStudent} onClose={closeModal} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "scoutMode" ? (
          <ScoutModePanel
            students={(modalPayload?.students as Student[]) ?? students}
            onClose={closeModal}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "importStudents" ? (
          <ImportStudentsModal
            onClose={closeModal}
            onGoToApproval={() => {
              closeModal();
              if (typeof modalPayload?.onGoToApproval === "function") {
                modalPayload.onGoToApproval();
              } else if (onGoToApproval) {
                onGoToApproval();
              }
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "broadcast" ? (
          <BroadcastMessagePanel onClose={closeModal} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "globalSearch" ? (
          <GlobalSearchModal
            students={students}
            lessons={lessons}
            payments={payments}
            getCategory={getCategory}
            onClose={closeModal}
            onSelectStudent={(id) => {
              closeModal();
              const callback = (modalPayload?.onSelectStudent as ((id: string) => void) | undefined) ?? onSelectStudent;
              callback?.(id);
            }}
            onSelectLesson={(id) => {
              closeModal();
              const callback = (modalPayload?.onSelectLesson as ((id: string) => void) | undefined) ?? onSelectLesson;
              callback?.(id);
            }}
          />
        ) : null}
      </AnimatePresence>

      {/* ── LOTE 3: MODAIS DE QUADRA & AULA ── */}
      <AnimatePresence>
        {activeModal === "qrCheckin" && resolvedLesson ? (
          <QRCheckInModal
            lesson={resolvedLesson}
            lessonTitle={resolvedLesson.title || "Aula"}
            onClose={closeModal}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "lessonRecap" && resolvedLesson ? (
          <LessonRecapPanel
            lesson={resolvedLesson}
            students={students}
            onClose={closeModal}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "quickAttendance" && resolvedLesson ? (
          <QuickAttendancePanel
            lesson={resolvedLesson}
            students={students}
            onClose={closeModal}
            onSave={(presentIds) => {
              if (typeof modalPayload?.onSave === "function") {
                (modalPayload.onSave as (ids: string[]) => void)(presentIds);
              }
            }}
            onOpenQR={() => {
              modalManager.openModal("qrCheckin", { lesson: resolvedLesson });
            }}
            onOpenBulkEval={() => {
              modalManager.openModal("bulkEvaluation", { lesson: resolvedLesson });
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "bulkEvaluation" && resolvedLesson ? (
          <BulkEvaluationModal
            lesson={resolvedLesson}
            students={students}
            onClose={closeModal}
            onSaved={() => {
              if (typeof modalPayload?.onSaved === "function") {
                (modalPayload.onSaved as () => void)();
              }
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "liveLessonCoach" && resolvedLesson ? (
          <LiveLessonCoachPanel
            lesson={resolvedLesson}
            students={students}
            onClose={closeModal}
            onEndClass={() => {
              closeModal();
              if (typeof modalPayload?.onEndClass === "function") {
                (modalPayload.onEndClass as () => void)();
              }
            }}
          />
        ) : null}
      </AnimatePresence>

      {/* Modal global de recuperação de sessão */}
      <SessionExpiredModal
        isOpen={sessionExpired}
        onReconnect={recoverSession}
        onLogout={sessionForceLogout}
        recovering={sessionRecovering}
      />
    </>
  );
}

export default CockpitModalHost;
