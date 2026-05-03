"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [staffOpen, setStaffOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);

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

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4">

      {/* ── Ambient orbs ─────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(234,179,8,0.12) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-20 h-[600px] w-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(234,179,8,0.08) 0%, transparent 70%)" }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute left-1/2 top-1/4 h-[300px] w-[300px] -translate-x-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(234,179,8,0.05) 0%, transparent 70%)" }}
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {/* Subtle gold grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(234,179,8,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(234,179,8,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Back link ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute left-4 top-4"
      >
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Voltar
        </Link>
      </motion.div>

      {/* ── Main card ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Gold border shimmer */}
        <div
          className="absolute -inset-px rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(234,179,8,0.4) 0%, transparent 50%, rgba(234,179,8,0.1) 100%)",
          }}
        />

        <div className="relative rounded-2xl border border-white/[0.06] bg-zinc-950/80 px-7 py-8 shadow-2xl backdrop-blur-xl">

          {/* Logo + heading */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mb-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-500/20 bg-yellow-500/10 shadow-lg shadow-yellow-500/10">
              <span className="text-2xl font-black tracking-tighter text-yellow-400">W</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Bem-vindo de volta</h1>
            <p className="mt-1 text-xs text-zinc-500">Will Treinos PRO · Acesso exclusivo</p>
          </motion.div>

          {/* ── Form ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            {/* Email */}
            <div className="relative">
              <Mail
                className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${
                  focusedField === "email" ? "text-yellow-400" : "text-zinc-600"
                }`}
                aria-hidden
              />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                onKeyDown={(e) => e.key === "Enter" && void handleRealLogin()}
                className="w-full rounded-xl border bg-black/40 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 transition-all duration-200"
                style={{
                  borderColor:
                    focusedField === "email"
                      ? "rgba(234,179,8,0.5)"
                      : "rgba(255,255,255,0.06)",
                  boxShadow:
                    focusedField === "email"
                      ? "0 0 0 3px rgba(234,179,8,0.08)"
                      : "none",
                }}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock
                className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${
                  focusedField === "password" ? "text-yellow-400" : "text-zinc-600"
                }`}
                aria-hidden
              />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                onKeyDown={(e) => e.key === "Enter" && void handleRealLogin()}
                className="w-full rounded-xl border bg-black/40 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 transition-all duration-200"
                style={{
                  borderColor:
                    focusedField === "password"
                      ? "rgba(234,179,8,0.5)"
                      : "rgba(255,255,255,0.06)",
                  boxShadow:
                    focusedField === "password"
                      ? "0 0 0 3px rgba(234,179,8,0.08)"
                      : "none",
                }}
              />
            </div>

            {/* Primary CTA */}
            <motion.button
              id="btn-login-password"
              type="button"
              onClick={() => void handleRealLogin()}
              disabled={!supabaseReady || isSubmitting}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              className="relative mt-1 w-full overflow-hidden rounded-xl py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)" }}
            >
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)" }}
              />
              {isSubmitting ? (
                <span className="relative flex items-center justify-center gap-2">
                  <motion.span
                    className="inline-block h-4 w-4 rounded-full border-2 border-black/30 border-t-black"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  />
                  Entrando…
                </span>
              ) : (
                <span className="relative">Entrar</span>
              )}
            </motion.button>

            {!supabaseReady && (
              <p className="text-center text-[11px] text-amber-400/80">
                Supabase não configurado neste build.
              </p>
            )}
          </motion.div>

          {/* ── OAuth ─────────────────────────────────────── */}
          {supabaseReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">ou</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  id="btn-login-google"
                  type="button"
                  onClick={() => void handleOAuthLogin("google")}
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 text-sm text-zinc-300 transition-colors hover:border-white/10 hover:bg-white/[0.06] disabled:opacity-40"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </motion.button>

                <motion.button
                  id="btn-login-facebook"
                  type="button"
                  onClick={() => void handleOAuthLogin("facebook")}
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 text-sm text-zinc-300 transition-colors hover:border-white/10 hover:bg-white/[0.06] disabled:opacity-40"
                >
                  <svg className="h-4 w-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Dev mock (local only) ──────────────────────── */}
          {!supabaseReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-5"
            >
              <button
                type="button"
                onClick={() => setStaffOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-2.5 text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Teste local (sem Supabase)
                <motion.span animate={{ rotate: staffOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                </motion.span>
              </button>
              <AnimatePresence>
                {staffOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {(["admin", "coach", "aluno"] as const).map((role) => (
                        <motion.button
                          key={role}
                          type="button"
                          onClick={() => handleMockLogin(role)}
                          whileTap={{ scale: 0.95 }}
                          className="rounded-lg border border-white/[0.06] py-2 text-[10px] font-semibold capitalize text-zinc-400 transition-colors hover:border-yellow-500/30 hover:text-yellow-400"
                        >
                          {role === "admin" ? "Dono" : role === "coach" ? "Prof" : "Aluno"}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Footer ──────────────────────────────────────── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center text-[11px] leading-relaxed text-zinc-600"
          >
            {process.env.NEXT_PUBLIC_SHOW_PUBLIC_CADASTRO_LINK === "true" ? (
              <>
                Quer entrar?{" "}
                <Link href="/cadastro" className="text-yellow-500 transition-colors hover:text-yellow-400 hover:underline">
                  Solicite sua matrícula
                </Link>
              </>
            ) : (
              <>Nova conta apenas pelo link de convite da equipe.</>
            )}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black">
          <motion.div
            className="h-8 w-8 rounded-full border-2 border-yellow-500/20 border-t-yellow-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            aria-hidden
          />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
