"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseSingleton: SupabaseClient | null = null;

/**
 * Dispatch the wt:session-expired event (browser-only).
 * Called by API layers that detect a 401 / JWT error.
 */
export function dispatchSessionExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("wt:session-expired"));
  }
}

/**
 * Wrap an async function with auth-retry logic.
 * If the function throws or returns a 401-like error, fires wt:session-expired.
 */
export async function withAuthRetry<T>(
  fn: () => Promise<{ data: T | null; error: { status?: number; message?: string } | null }>
): Promise<{ data: T | null; error: { status?: number; message?: string } | null }> {
  const result = await fn();
  if (result.error) {
    const { status, message } = result.error;
    if (
      status === 401 ||
      (message && (message.includes("JWT") || message.includes("token") || message.toLowerCase().includes("unauthorized")))
    ) {
      dispatchSessionExpired();
    }
  }
  return result;
}

function readSupabasePublicKey(): string {
  return String(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "",
  ).trim();
}

export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && readSupabasePublicKey());
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!hasSupabaseEnv()) return null;
  if (supabaseSingleton) return supabaseSingleton;

  supabaseSingleton = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    readSupabasePublicKey(),
    {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "wt-auth-session",
      },
    },
  );

  return supabaseSingleton;
}

/**
 * Papel vindo do JWT (user_metadata / app_metadata).
 * Sem role explícito → `null` (não assumir aluno: evita OAuth “fantasma” sem matrícula).
 */
export function appRoleFromSupabaseUser(rawRole: unknown): "admin" | "coach" | "aluno" | null {
  const role = String(rawRole || "").trim().toLowerCase();
  if (!role) return null;
  if (["admin", "will_owner", "owner"].includes(role)) return "admin";
  if (["coach", "professor", "teacher"].includes(role)) return "coach";
  if (["aluno", "student", "athlete"].includes(role)) return "aluno";
  return null;
}
