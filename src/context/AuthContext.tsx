"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { Provider } from "@supabase/supabase-js";
import { useApp, type AppContextType } from "@/context/AppContext";
import type { Role, User } from "@/context/types";
import type { DevImpersonation } from "@/lib/authPostLogin";

type LoginResult =
  | { ok: true; role: "admin" | "coach" | "aluno" | "visitor" | null }
  | { ok: false; message: string };

type OAuthResult = { ok: true } | { ok: false; message: string };

type AuthContextValue = {
  user: AppContextType["user"];
  authResolved: boolean;
  usingSupabaseSession: boolean;
  authError: string | null;
  login: (role: Role) => void;
  loginWithPassword: (email: string, password: string) => Promise<LoginResult>;
  loginWithOAuth: (provider: Provider) => Promise<OAuthResult>;
  logout: () => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  isLive: boolean;
  adminMode: "dashboard" | "coach";
  setAdminMode: (m: "dashboard" | "coach") => void;
  isDevRoot: boolean;
  devImpersonation: DevImpersonation;
  setDevImpersonation: (role: DevImpersonation) => void;
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
      updateUser: app.updateUser,
      isLive: app.isLive,
      adminMode: app.adminMode,
      setAdminMode: app.setAdminMode,
      isDevRoot: app.isDevRoot,
      devImpersonation: app.devImpersonation,
      setDevImpersonation: app.setDevImpersonation,
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
      app.updateUser,
      app.isLive,
      app.adminMode,
      app.setAdminMode,
      app.isDevRoot,
      app.devImpersonation,
      app.setDevImpersonation,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
