"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { Provider } from "@supabase/supabase-js";
import { useApp } from "@/context/AppContext";
import type { Role } from "@/context/types";

type LoginResult =
  | { ok: true; role: "admin" | "coach" | "aluno" }
  | { ok: false; message: string };

type OAuthResult = { ok: true } | { ok: false; message: string };

type AuthContextValue = {
  user: ReturnType<typeof useApp>["user"];
  authResolved: boolean;
  usingSupabaseSession: boolean;
  authError: string | null;
  login: (role: Role) => void;
  loginWithPassword: (email: string, password: string) => Promise<LoginResult>;
  loginWithOAuth: (provider: Provider) => Promise<OAuthResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const value = useMemo<AuthContextValue>(
    () => ({
      user: app.user,
      authResolved: app.authResolved,
      usingSupabaseSession: app.usingSupabaseSession,
      authError: app.authError,
      login: app.login,
      loginWithPassword: app.loginWithPassword,
      loginWithOAuth: app.loginWithOAuth,
      logout: app.logout,
    }),
    [
      app.user,
      app.authResolved,
      app.usingSupabaseSession,
      app.authError,
      app.login,
      app.loginWithPassword,
      app.loginWithOAuth,
      app.logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
