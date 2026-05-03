"use client";

import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useApp, type AppContextType } from "@/context/AppContext";
import type { AppConfig } from "@/context/types";
import { generateNewEnrollmentInviteCode } from "@/lib/enrollmentInviteCode";

type AppConfigContextValue = {
  appConfig: AppConfig;
  cadastroPath: string;
  cadastroInviteUrl: string;
  generateEnrollmentInviteCode: () => string;
  updateAppConfig: AppContextType["updateAppConfig"];
};

const AppConfigContext = createContext<AppConfigContextValue | undefined>(undefined);

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const enrollmentInviteCode = (app.appConfig.enrollmentInviteCode ?? "").trim();
  const cadastroPath = enrollmentInviteCode
    ? `/cadastro?invite=${encodeURIComponent(enrollmentInviteCode)}`
    : "/cadastro";
  const cadastroInviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${cadastroPath}`;
  }, [cadastroPath]);
  const generateEnrollmentInviteCode = useCallback(() => {
    const code = generateNewEnrollmentInviteCode();
    app.updateAppConfig({ enrollmentInviteCode: code });
    return code;
  }, [app.updateAppConfig]);

  const value = useMemo<AppConfigContextValue>(
    () => ({
      appConfig: app.appConfig,
      cadastroPath,
      cadastroInviteUrl,
      generateEnrollmentInviteCode,
      updateAppConfig: app.updateAppConfig,
    }),
    [app.appConfig, app.updateAppConfig, cadastroPath, cadastroInviteUrl, generateEnrollmentInviteCode],
  );

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error("useAppConfig deve ser usado dentro de AppConfigProvider");
  return ctx;
}
