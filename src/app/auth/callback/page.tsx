"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { appRoleFromSupabaseUser, getSupabaseClient, hasSupabaseEnv } from "@/lib/supabaseClient";


import { isDevRootEmail, postLoginRouteFromAuthUser } from "@/lib/authPostLogin";
import { STUDENT_HOME_PATH } from "@/lib/studentRoutes";
import { fetchStaffAccessRole } from "@/lib/supabasePersistence";
import { clearStaffOAuthGate, getStoredInviteToken } from "@/lib/enrollmentSession";

import { WT_SESSION_POST_LOGIN_NEXT_KEY, wtSessionGet, wtSessionRemove } from "@/lib/willLocalStorage";

function isAllowedOAuthEmail(email: string | undefined): boolean {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  const allowedDomains = process.env.NEXT_PUBLIC_OAUTH_EMAIL_DOMAINS?.split(",").map(d => d.trim().toLowerCase()) ?? [];
  if (allowedDomains.length === 0) return true;
  return allowedDomains.some(domain => normalizedEmail.endsWith(`@${domain}`));
}

function sanitizeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/auth/")) return null;
  return raw;
}

/**
 * Quando o JWT não tem role (Google OAuth padrão), consulta a tabela students
 * para determinar a rota correta do aluno aprovado.
 */
async function resolveApprovedStudentRoute(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  user: SupabaseAuthUser,
): Promise<typeof STUDENT_HOME_PATH | "/feed" | "/dashboard" | "/cadastro"> {
  try {
    let student: { status: string; student_role: string } | null = null;

    const { data: byAuth } = await supabase
      .from("students")
      .select("status, student_role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (byAuth) {
      student = byAuth;
    } else if (user.email) {
      const { data: byEmail } = await supabase
        .from("students")
        .select("status, student_role")
        .eq("email", user.email.trim().toLowerCase())
        .maybeSingle();
      student = byEmail ?? null;
    }

    if (!student || (student.status !== "approved" && student.status !== "active")) return "/cadastro";
    if (student.student_role === "observador") return "/feed";
    if (student.student_role === "professor") return "/dashboard";
    return STUDENT_HOME_PATH;
  } catch {
    return "/cadastro";
  }
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
        typeof window !== "undefined" ? wtSessionGet(WT_SESSION_POST_LOGIN_NEXT_KEY) : null,
      );
      const preferredNext = nextFromQuery ?? nextFromStorage;

      const finish = async (user: SupabaseAuthUser) => {
        if (cancelled) return;
        if (user.user_metadata?.provider && !isAllowedOAuthEmail(user.email)) {
          router.replace(`/login?error=${encodeURIComponent("E-mail não autorizado para esta rede.")}`);
          return;
        }
        if (typeof window !== "undefined") {
          wtSessionRemove(WT_SESSION_POST_LOGIN_NEXT_KEY);
          clearStaffOAuthGate();
        }

        // Self-signup OAuth: só vai para /signup se não for staff/admin/dev e não tiver matrícula.
        const needsStudentSignup = await oauthUserNeedsStudentSignupFlow(supabase, user);
        if (needsStudentSignup) {
          const tok = typeof window !== "undefined" ? getStoredInviteToken() : null;
          router.replace(
            tok ? `/signup?invite=${encodeURIComponent(tok)}` : "/signup",
          );
          return;
        }

        // JWT não carrega role para alunos OAuth — verificar students table para roteamento correto.
        let dest = postLoginRouteFromAuthUser(user);
        if (dest === "/cadastro") {
          dest = await resolveApprovedStudentRoute(supabase, user);
        }

        router.replace(preferredNext ?? dest);
      };

      /** Contas Google sem papel staff nem linha em `students` completam cadastro em /signup. */
      async function oauthUserNeedsStudentSignupFlow(
        sb: NonNullable<ReturnType<typeof getSupabaseClient>>,
        authUser: SupabaseAuthUser,
      ): Promise<boolean> {
        if (isDevRootEmail(authUser.email)) return false;

        const jwtRole = appRoleFromSupabaseUser(
          authUser.user_metadata?.role ?? authUser.app_metadata?.role,
        );
        if (jwtRole === "admin" || jwtRole === "coach") return false;

        if (authUser.email) {
          try {
            const staffRole = await fetchStaffAccessRole(sb, authUser.email);
            if (staffRole) return false;
          } catch (e) {
            console.warn("[auth/callback] staff_access:", e);
          }
        }

        try {
          // Primeiro tenta por auth_user_id (para novos users)
          const { data: byAuth, error: errAuth } = await sb
            .from("students")
            .select("id, status")
            .eq("auth_user_id", authUser.id)
            .maybeSingle();

          if (!errAuth && byAuth) {
            // Encontrou por auth_user_id
            return byAuth.status === "pending";  // Só precisa signup se ainda pendente
          }

          // Se não encontrou por auth_user_id, tenta por email
          if (authUser.email) {
            const { data: byEmail, error: errEmail } = await sb
              .from("students")
              .select("id, status")
              .eq("email", authUser.email.trim().toLowerCase())
              .maybeSingle();

            if (!errEmail && byEmail) {
              // Encontrou por email - aluno aprovado não precisa de signup
              return byEmail.status === "pending";
            }
          }

          // Não encontrou em nenhum lugar = precisa fazer signup
          return true;
        } catch (e) {
          console.error("Erro ao verificar novo usuário:", e);
          return false;
        }
      }

      try {
        const first = await supabase.auth.getSession();
        if (cancelled) return;
        if (first.data.session?.user) {
          await finish(first.data.session.user);
          return;
        }

        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled) return;
          if (exErr) {
            const second = await supabase.auth.getSession();
            if (second.data.session?.user) {
              await finish(second.data.session.user);
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
          await finish(session.user);
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
