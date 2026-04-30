"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseSingleton: SupabaseClient | null = null;

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
      },
    },
  );

  return supabaseSingleton;
}

export function appRoleFromSupabaseUser(rawRole: unknown): "admin" | "coach" | "aluno" {
  const role = String(rawRole || "").toLowerCase();
  if (["admin", "will_owner", "owner"].includes(role)) return "admin";
  if (["coach", "professor", "teacher"].includes(role)) return "coach";
  return "aluno";
}
