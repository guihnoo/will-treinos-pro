"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { getSupabaseClient, hasSupabaseEnv } from "@/lib/supabaseClient";
import { postLoginRouteFromAuthUser } from "@/lib/authPostLogin";
import { clearStaffOAuthGate } from "@/lib/enrollmentSession";

const POST_LOGIN_NEXT_KEY = "wt_post_login_next";

function sanitizeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/auth/")) return null;
  return raw;
}

/**
 * OAuth PKCE return (?code=...). Troca o código por sessão antes de rotear.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!hasSupabaseEnv()) {
        router.replace("/login");
        return;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        router.replace("/login");
        return;
      }

      const search = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const oauthError =
        search.get("error_description") || search.get("error") || hash.get("error_description");
      if (oauthError) {
        router.replace(`/login?error=${encodeURIComponent(oauthError)}`);
        return;
      }

      const code = search.get("code") ?? hash.get("code");
      const nextFromQuery = sanitizeNextPath(search.get("next") ?? hash.get("next"));
      const nextFromStorage = sanitizeNextPath(
        typeof window !== "undefined" ? sessionStorage.getItem(POST_LOGIN_NEXT_KEY) : null,
      );
      const preferredNext = nextFromQuery ?? nextFromStorage;

      const finish = (user: SupabaseAuthUser) => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(POST_LOGIN_NEXT_KEY);
          clearStaffOAuthGate();
        }
        router.replace(preferredNext ?? postLoginRouteFromAuthUser(user));
      };

      try {
        const first = await supabase.auth.getSession();
        if (cancelled) return;
        if (first.data.session?.user) {
          finish(first.data.session.user);
          return;
        }

        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled) return;
          if (exErr) {
            const second = await supabase.auth.getSession();
            if (second.data.session?.user) {
              finish(second.data.session.user);
              return;
            }
            router.replace(`/login?error=${encodeURIComponent(exErr.message)}`);
            return;
          }
        }

        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (cancelled) return;
        if (sessionErr) {
          router.replace(`/login?error=${encodeURIComponent(sessionErr.message)}`);
          return;
        }
        if (session?.user) {
          finish(session.user);
          return;
        }

        router.replace("/login?error=oauth");
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "oauth";
        router.replace(`/login?error=${encodeURIComponent(msg)}`);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-3 p-6">
      <div className="h-8 w-8 rounded-full border-2 border-[#EAB308]/40 border-t-[#EAB308] animate-spin" aria-hidden />
      <p className="text-sm text-zinc-400">Concluindo login…</p>
    </div>
  );
}
