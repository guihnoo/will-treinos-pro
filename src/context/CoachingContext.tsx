"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LEGACY_BRIDGE } from "@/domain/v1/mockOrm";
import { wtLs } from "@/lib/willLocalStorage";
import type { PerformanceFeedback, TrainingPlan, QuickMessage, WithoutId } from "@/context/types";

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

type CoachingContextValue = {
  quickMessages: QuickMessage[];
  feedbacks: PerformanceFeedback[];
  addFeedback: (fb: WithoutId<PerformanceFeedback>) => void;
  trainingPlans: TrainingPlan[];
  addTrainingPlan: (plan: WithoutId<TrainingPlan>) => void;
};

const CoachingContext = createContext<CoachingContextValue | undefined>(undefined);

export function CoachingProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [feedbacks, setFeedbacks] = useState<PerformanceFeedback[]>([]);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);

  useEffect(() => {
    setIsMounted(true);
    setFeedbacks(wtLs.get("feedbacks", []));
    setTrainingPlans(wtLs.get("trainingPlans", []));
  }, []);

  useEffect(() => { if (isMounted) wtLs.set("feedbacks", feedbacks); }, [feedbacks, isMounted]);
  useEffect(() => { if (isMounted) wtLs.set("trainingPlans", trainingPlans); }, [trainingPlans, isMounted]);

  const addFeedback = useCallback(
    (fb: WithoutId<PerformanceFeedback>) =>
      setFeedbacks(p => [...p, { ...fb, id: `fb_${uid()}` }]), []);
  const addTrainingPlan = useCallback(
    (plan: WithoutId<TrainingPlan>) =>
      setTrainingPlans(p => [...p, { ...plan, id: `tp_${uid()}` }]), []);

  const value = useMemo<CoachingContextValue>(() => ({
    quickMessages: LEGACY_BRIDGE.MOCK_QUICK_MESSAGES,
    feedbacks,
    addFeedback,
    trainingPlans,
    addTrainingPlan,
  }), [feedbacks, addFeedback, trainingPlans, addTrainingPlan]);

  return <CoachingContext.Provider value={value}>{children}</CoachingContext.Provider>;
}

export function useCoaching() {
  const ctx = useContext(CoachingContext);
  if (!ctx) throw new Error("useCoaching deve ser usado dentro de CoachingProvider");
  return ctx;
}
