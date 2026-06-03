"use client";

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { Student, User } from "@/context/types";
import { clearWtRoleCookie } from "@/lib/appSessionHelpers";
import { getSupabaseClient, hasSupabaseEnv } from "@/lib/supabaseClient";
import { wtLegacyRoleRemove } from "@/lib/willLocalStorage";

/**
 * Inicializa sessão Supabase (getSession + onAuthStateChange) e alinha estado local / bootstrap crítico.
 */
export function useSupabaseAuthBridge(options: {
  isMounted: boolean;
  applySupabaseSession: (
    authUser: SupabaseAuthUser,
    catalogStudents?: Student[],
  ) => void | Promise<void>;
  loadSupabaseCriticalData: () => Promise<void>;
  supabaseAuthUserRef: MutableRefObject<SupabaseAuthUser | null>;
  criticalBootstrapDoneRef: MutableRefObject<boolean>;
  setAuthResolved: Dispatch<SetStateAction<boolean>>;
  setAuthError: Dispatch<SetStateAction<string | null>>;
  setUsingSupabaseSession: Dispatch<SetStateAction<boolean>>;
  setUser: Dispatch<SetStateAction<User | null>>;
}): void {
  const {
    isMounted,
    applySupabaseSession,
    loadSupabaseCriticalData,
    supabaseAuthUserRef,
    criticalBootstrapDoneRef,
    setAuthResolved,
    setAuthError,
    setUsingSupabaseSession,
    setUser,
  } = options;

  useEffect(() => {
    if (!isMounted) return;
    if (!hasSupabaseEnv()) {
      setAuthResolved(true);
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthError("Cliente Supabase indisponível.");
      setAuthResolved(true);
      return;
    }

    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        setAuthError(error.message);
        setAuthResolved(true);
        return;
      }
      if (data.session?.user) {
        setUsingSupabaseSession(true);
        // Fix race condition: aguardar applySupabaseSession antes de setAuthResolved
        // Antes: void (fire-and-forget) + setAuthResolved logo depois
        // = AuthWrapper via !user → redirect /login antes do user ser setado
        await applySupabaseSession(data.session.user);
        void loadSupabaseCriticalData();
      }
      setAuthResolved(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (session?.user) {
          setUsingSupabaseSession(true);
          setAuthError(null);
          void (async () => {
            await applySupabaseSession(session.user);
            void loadSupabaseCriticalData();
          })();
        }
      }
      if (event === "SIGNED_OUT") {
        setUsingSupabaseSession(false);
        supabaseAuthUserRef.current = null;
        criticalBootstrapDoneRef.current = false;
        setUser(null);
        wtLegacyRoleRemove();
        clearWtRoleCookie();
      }
    });

    return () => subscription.unsubscribe();
  }, [isMounted, applySupabaseSession, loadSupabaseCriticalData]);
}
