"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import type { AppConfig } from "@/context/types";

type AppConfigContextValue = {
  appConfig: AppConfig;
  updateAppConfig: (patch: Partial<AppConfig>) => void;
};

const AppConfigContext = createContext<AppConfigContextValue | undefined>(undefined);

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const value = useMemo<AppConfigContextValue>(
    () => ({
      appConfig: app.appConfig,
      updateAppConfig: app.updateAppConfig,
    }),
    [app.appConfig, app.updateAppConfig],
  );

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error("useAppConfig deve ser usado dentro de AppConfigProvider");
  return ctx;
}
