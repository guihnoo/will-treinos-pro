"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp, type AppContextType } from "@/context/AppContext";
import type { PerformanceFeedback, QuickMessage, TrainingPlan } from "@/context/types";

type CoachingContextValue = {
  quickMessages: QuickMessage[];
  feedbacks: PerformanceFeedback[];
  addFeedback: AppContextType["addFeedback"];
  trainingPlans: TrainingPlan[];
  addTrainingPlan: AppContextType["addTrainingPlan"];
};

const CoachingContext = createContext<CoachingContextValue | undefined>(undefined);

export function CoachingProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const value = useMemo<CoachingContextValue>(
    () => ({
      quickMessages: app.quickMessages,
      feedbacks: app.feedbacks,
      addFeedback: app.addFeedback,
      trainingPlans: app.trainingPlans,
      addTrainingPlan: app.addTrainingPlan,
    }),
    [
      app.quickMessages,
      app.feedbacks,
      app.addFeedback,
      app.trainingPlans,
      app.addTrainingPlan,
    ],
  );

  return <CoachingContext.Provider value={value}>{children}</CoachingContext.Provider>;
}

export function useCoaching() {
  const ctx = useContext(CoachingContext);
  if (!ctx) throw new Error("useCoaching deve ser usado dentro de CoachingProvider");
  return ctx;
}
