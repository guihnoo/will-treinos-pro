"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseSingleton: SupabaseClient | null = null;

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!hasSupabaseEnv()) return null;
  if (supabaseSingleton) return supabaseSingleton;

  supabaseSingleton = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
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
