"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { Provider, User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { Student, User } from "@/context/types";
import { clearWtRoleCookie } from "@/lib/appSessionHelpers";
import { computeEffectiveRole, type DevImpersonation } from "@/lib/authPostLogin";
import { getSupabaseClient, hasSupabaseEnv } from "@/lib/supabaseClient";
import { wtLegacyRoleRemove } from "@/lib/willLocalStorage";

const MISSING_SUPABASE_MSG =
  "Supabase não configurado no ambiente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).";

export function useSupabaseLoginActions(options: {
  applySupabaseSession: (
    authUser: SupabaseAuthUser,
    catalogStudents?: Student[],
  ) => void | Promise<void>;
  devImpersonation: DevImpersonation;
  supabaseAuthUserRef: MutableRefObject<SupabaseAuthUser | null>;
  setUser: Dispatch<SetStateAction<User | null>>;
}): {
  loginWithPassword: (
    email: string,
    password: string,
  ) => Promise<
    { ok: true; role: "admin" | "coach" | "aluno" | "visitor" } | { ok: false; message: string }
  >;
  loginWithOAuth: (provider: Provider) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
} {
  const { applySupabaseSession, devImpersonation, supabaseAuthUserRef, setUser } = options;

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password.trim()) {
        return { ok: false as const, message: "Informe e-mail e senha." };
      }

      if (!hasSupabaseEnv()) {
        return { ok: false as const, message: MISSING_SUPABASE_MSG };
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        return { ok: false as const, message: "Cliente Supabase indisponível." };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error || !data.user) {
        return { ok: false as const, message: error?.message || "Não foi possível autenticar." };
      }

      await applySupabaseSession(data.user);
      return { ok: true as const, role: computeEffectiveRole(data.user, devImpersonation) };
    },
    [applySupabaseSession, devImpersonation],
  );

  const loginWithOAuth = useCallback(async (provider: Provider) => {
    if (!hasSupabaseEnv()) {
      return { ok: false as const, message: MISSING_SUPABASE_MSG };
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false as const, message: "Cliente Supabase indisponível." };
    }
    const redirectTo =
      typeof window !== "undefined"
        ? new URL("/auth/callback", window.location.origin).href
        : undefined;
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams:
            provider === "google"
              ? { access_type: "offline", prompt: "select_account" }
              : undefined,
        },
      });
      if (error) {
        return { ok: false as const, message: error.message };
      }
      const url = data?.url;
      if (typeof window !== "undefined" && url) {
        window.location.replace(url);
        return { ok: true as const };
      }
      return {
        ok: false as const,
        message:
          "OAuth não devolveu URL. No Supabase: Providers (Google) e Redirect URLs com este domínio + /auth/callback.",
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false as const, message: `Falha de rede ao iniciar OAuth: ${msg}` };
    }
  }, []);

  const logout = useCallback(() => {
    const supabase = getSupabaseClient();
    if (supabase) {
      void supabase.auth.signOut();
    }
    supabaseAuthUserRef.current = null;
    setUser(null);
    wtLegacyRoleRemove();
    clearWtRoleCookie();
  }, [supabaseAuthUserRef, setUser]);

  return { loginWithPassword, loginWithOAuth, logout };
}
