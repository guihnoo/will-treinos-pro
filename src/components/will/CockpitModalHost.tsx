"use client";

import React from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { useModalStore } from "@/lib/modalManager";

// Carregamento sob demanda (lazy loading) dos modais autossuficientes do Cockpit
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

/**
 * Orquestrador Central de Modais Autossuficientes do WillCockpit (Lote 1).
 * Consome useModalStore() sem re-renderizar o Cockpit inteiro.
 */
export function CockpitModalHost() {
  const { activeModal, closeModal } = useModalStore();

  return (
    <>
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
    </>
  );
}

export default CockpitModalHost;
