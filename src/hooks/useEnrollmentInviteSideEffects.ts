"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { AppConfig } from "@/context/types";
import { generateNewEnrollmentInviteCode } from "@/lib/enrollmentInviteCode";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { upsertEnrollmentInviteRemote } from "@/lib/supabasePersistence";

const UPSERT_DEBOUNCE_MS = 800;

/**
 * Offline: garante `enrollmentInviteCode` em LS.
 * Com Supabase: debounce para `upsertEnrollmentInviteRemote` ao mudar o código (ex.: «Gerar novo código»).
 */
export function useEnrollmentInviteSideEffects(options: {
  isMounted: boolean;
  usingSupabaseSession: boolean;
  appConfig: AppConfig;
  setAppConfig: Dispatch<SetStateAction<AppConfig>>;
}): void {
  const { isMounted, usingSupabaseSession, appConfig, setAppConfig } = options;

  useEffect(() => {
    if (!isMounted || usingSupabaseSession) return;
    setAppConfig((prev) => {
      if (prev.enrollmentInviteCode?.trim()) return prev;
      return { ...prev, enrollmentInviteCode: generateNewEnrollmentInviteCode() };
    });
  }, [isMounted, usingSupabaseSession, setAppConfig]);

  useEffect(() => {
    if (!isMounted || !usingSupabaseSession) return;
    const code = appConfig.enrollmentInviteCode?.trim();
    if (!code) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const handle = window.setTimeout(() => {
      void upsertEnrollmentInviteRemote(supabase, code).catch(() => {
        /* migração app_settings pode não estar aplicada ainda */
      });
    }, UPSERT_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [appConfig.enrollmentInviteCode, isMounted, usingSupabaseSession]);
}
