"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp } from "@/context/AppContext";

type CriticalDataContextValue = {
  criticalDataLoading: boolean;
  criticalDataError: string | null;
  retryCriticalDataSync: () => Promise<void>;
};

const CriticalDataContext = createContext<CriticalDataContextValue | undefined>(undefined);

export function CriticalDataProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const value = useMemo<CriticalDataContextValue>(
    () => ({
      criticalDataLoading: app.criticalDataLoading,
      criticalDataError: app.criticalDataError,
      retryCriticalDataSync: app.retryCriticalDataSync,
    }),
    [app.criticalDataLoading, app.criticalDataError, app.retryCriticalDataSync],
  );

  return <CriticalDataContext.Provider value={value}>{children}</CriticalDataContext.Provider>;
}

export function useCriticalData() {
  const ctx = useContext(CriticalDataContext);
  if (!ctx) throw new Error("useCriticalData deve ser usado dentro de CriticalDataProvider");
  return ctx;
}
