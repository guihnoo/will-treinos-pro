"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import { hasSupabaseEnv } from "@/lib/supabaseClient";
import {
  canUseSocialOAuthFromLogin,
  clearStaffOAuthGate,
} from "@/lib/enrollmentSession";
import { WT_SESSION_POST_LOGIN_NEXT_KEY, wtSessionSet } from "@/lib/willLocalStorage";

function sanitizeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/auth/")) return null;
  return raw;
}

function LoginPageContent() {
  const { login, loginWithPassword, loginWithOAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabaseReady = hasSupabaseEnv();
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const err = q.get("error");
    if (!err) return;
    toast(decodeURIComponent(err), "error");
    window.history.replaceState(null, "", "/login");
  }, [toast]);

  const handleMockLogin = (role: "admin" | "coach" | "aluno") => {
    login(role);
    toast(`✅ Login efetuado como ${role.toUpperCase()}`);
    if (role === "admin" || role === "coach") {
      router.push("/dashboard");
    } else {
      router.push("/treinos");
    }
  };

  const handleRealLogin = async () => {
    setIsSubmitting(true);
    const result = await loginWithPassword(email, password);
    setIsSubmitting(false);
    if (result.ok === false) {
      toast(result.message, "error");
      return;
    }
    toast("✅ Sessão autenticada com sucesso.");
    clearStaffOAuthGate();
    if (nextPath) {
      router.push(nextPath);
      return;
    }
    router.push("/dashboard");
  };

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    if (!supabaseReady) {
      toast(
        "Configure NEXT_PUBLIC_SUPABASE_URL e chave pública do Supabase no ambiente e faça deploy.",
        "error",
      );
      return;
    }
    if (!canUseSocialOAuthFromLogin()) {
      toast(
        "Use o link de matrícula (/cadastro) nesta aba ou abra «Acesso da equipe» abaixo para liberar Google/Facebook.",
        "error",
      );
      return;
    }
    if (nextPath && typeof window !== "undefined") {
      wtSessionSet(WT_SESSION_POST_LOGIN_NEXT_KEY, nextPath);
    }
    setIsSubmitting(true);
    const result = await loginWithOAuth(provider);
    setIsSubmitting(false);
    if (result.ok === false) {
      toast(
        `${result.message} Confira Providers e Redirect URLs (${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback).`,
        "error",
      );
    }
  };

  const cardClass = "w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-950/90 px-6 py-8";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <Link
        href="/"
        className="absolute left-4 top-4 flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Voltar
      </Link>

      <div className={cardClass}>
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-white">Entrar</h1>
          <p className="mt-1 text-xs text-zinc-500">Will Treinos PRO — conta já criada no Supabase</p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="email"
              autoComplete="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-black py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-black py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleRealLogin()}
          disabled={!supabaseReady || isSubmitting}
          className="mt-4 w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50 hover:bg-zinc-200"
        >
          {isSubmitting ? "…" : "Entrar com senha"}
        </button>

        {!supabaseReady ? (
          <p className="mt-3 text-center text-[11px] text-amber-200/90">Supabase não configurado neste build.</p>
        ) : null}

        {supabaseReady ? (
          <>
            <div className="my-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">ou</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void handleOAuthLogin("google")}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => void handleOAuthLogin("facebook")}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
              >
                <svg className="h-4 w-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </>
        ) : null}


        {!supabaseReady ? (
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Teste local (sem Supabase)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleMockLogin("admin")}
                className="rounded-md border border-zinc-800 py-2 text-[10px] font-semibold hover:border-zinc-600"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleMockLogin("coach")}
                className="rounded-md border border-zinc-800 py-2 text-[10px] font-semibold hover:border-zinc-600"
              >
                Prof
              </button>
              <button
                type="button"
                onClick={() => handleMockLogin("aluno")}
                className="rounded-md border border-zinc-800 py-2 text-[10px] font-semibold hover:border-zinc-600"
              >
                Aluno
              </button>
            </div>
          </div>
        ) : null}

        <p className="mt-6 text-center text-[11px] leading-snug text-zinc-600">
          {process.env.NEXT_PUBLIC_SHOW_PUBLIC_CADASTRO_LINK === "true" ? (
            <>
              Matrícula:{" "}
              <Link href="/cadastro" className="text-[#EAB308] hover:underline">
                /cadastro
              </Link>
            </>
          ) : (
            <>Nova conta só pelo link de convite da equipe.</>
          )}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-zinc-400"
            aria-hidden
          />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
