"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import { hasSupabaseEnv } from "@/lib/supabaseClient";
import { setStaffOAuthGateOk, clearStaffOAuthGate } from "@/lib/enrollmentSession";
import {
  WT_SESSION_POST_LOGIN_NEXT_KEY,
  wtSessionSet,
} from "@/lib/willLocalStorage";

function sanitizeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/auth/")) return null;
  return raw;
}

const GoogleIcon = () => (
  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Spinner = () => (
  <motion.span
    className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current"
    animate={{ rotate: 360 }}
    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
  />
);

function LoginContent() {
  const { login, loginWithPassword, loginWithOAuth, user, authResolved } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState<"google" | "password" | null>(null);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [awaitingRedirect, setAwaitingRedirect] = useState(false);

  const supabaseReady = hasSupabaseEnv();
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  // Show error from URL (e.g. OAuth failure)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const err = q.get("error");
    if (!err) return;
    toast(decodeURIComponent(err), "error");
    window.history.replaceState(null, "", "/login");
  }, [toast]);

  // Redirect after login resolves
  useEffect(() => {
    if (!awaitingRedirect || !authResolved || !user) return;
    const dest =
      user.role === "visitor" ? "/feed" :
      user.role === "aluno"   ? "/treinos" :
      "/dashboard";
    router.replace(nextPath ?? dest);
  }, [awaitingRedirect, authResolved, user, router, nextPath]);

  const handleGoogleLogin = async () => {
    if (!supabaseReady) {
      toast("Configure as variáveis Supabase no ambiente.", "error");
      return;
    }
    if (nextPath && typeof window !== "undefined") {
      wtSessionSet(WT_SESSION_POST_LOGIN_NEXT_KEY, nextPath);
    }
    setStaffOAuthGateOk();
    setSubmitting("google");
    setIsSubmitting(true);
    const result = await loginWithOAuth("google");
    setIsSubmitting(false);
    setSubmitting(null);
    if (result.ok === false) {
      toast(`${result.message} Confira as Redirect URLs no Supabase.`, "error");
    }
  };

  const handlePasswordLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast("Informe e-mail e senha.", "error");
      return;
    }
    setSubmitting("password");
    setIsSubmitting(true);
    const result = await loginWithPassword(email.trim(), password);
    setIsSubmitting(false);
    setSubmitting(null);
    if (result.ok === false) {
      toast(result.message, "error");
      return;
    }
    clearStaffOAuthGate();
    setAwaitingRedirect(true);
  };

  // Dev mock login (only when Supabase is not configured)
  const handleMockLogin = (role: "admin" | "coach" | "aluno") => {
    login(role);
    toast(`Login mock: ${role.toUpperCase()}`);
    router.push(role === "aluno" ? "/treinos" : "/dashboard");
  };

  if (awaitingRedirect && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#EAB308]/30 border-t-[#EAB308]" />
          <p className="text-xs text-zinc-500">Entrando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-black px-4 py-12">

      {/* Background glows */}
      <div className="pointer-events-none fixed -left-32 -top-32 h-[500px] w-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(234,179,8,0.18) 0%, transparent 70%)", filter: "blur(100px)" }} />
      <div className="pointer-events-none fixed -bottom-32 -right-32 h-[500px] w-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(234,179,8,0.10) 0%, transparent 70%)", filter: "blur(100px)" }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 28 }}
        className="relative w-full max-w-sm"
      >
        {/* Gold top line */}
        <div className="h-px w-full rounded-t-2xl"
          style={{ background: "linear-gradient(to right, transparent, #EAB308, transparent)" }} />

        <div className="rounded-b-2xl rounded-t-none border border-t-0 border-zinc-800/80 bg-zinc-950/90 p-8 shadow-2xl"
          style={{ backdropFilter: "blur(24px)" }}>

          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: "radial-gradient(circle at 40% 40%, rgba(234,179,8,0.25), transparent 70%)",
                border: "1px solid rgba(234,179,8,0.3)",
              }}
            >
              <span className="text-4xl">⚡</span>
            </motion.div>
            <div className="text-center">
              <h1 className="text-2xl font-black uppercase italic tracking-tight text-white">
                Will Treinos{" "}
                <span style={{ color: "#EAB308" }}>PRO</span>
              </h1>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">
                Arena Digital de Elite
              </p>
            </div>
          </div>

          {/* Google OAuth — hero button */}
          {supabaseReady && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => void handleGoogleLogin()}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-3 rounded-xl py-3.5 text-sm font-bold text-black transition-opacity disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)" }}
            >
              {submitting === "google" ? <Spinner /> : <GoogleIcon />}
              <span>{submitting === "google" ? "Conectando…" : "Entrar com Google"}</span>
            </motion.button>
          )}

          {/* Separator */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">ou</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* Email + Password */}
          <div className="space-y-2.5">
            <input
              type="email"
              autoComplete="email"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              onKeyDown={e => e.key === "Enter" && void handlePasswordLogin()}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 disabled:opacity-50"
              style={{
                border: `1px solid ${focusedField === "email" ? "rgba(234,179,8,0.5)" : "rgba(255,255,255,0.07)"}`,
                boxShadow: focusedField === "email" ? "0 0 0 3px rgba(234,179,8,0.1)" : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
            />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              onKeyDown={e => e.key === "Enter" && void handlePasswordLogin()}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 disabled:opacity-50"
              style={{
                border: `1px solid ${focusedField === "password" ? "rgba(234,179,8,0.5)" : "rgba(255,255,255,0.07)"}`,
                boxShadow: focusedField === "password" ? "0 0 0 3px rgba(234,179,8,0.1)" : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => void handlePasswordLogin()}
              disabled={!supabaseReady || isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-bold text-zinc-200 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-40"
            >
              {submitting === "password" ? <Spinner /> : null}
              {submitting === "password" ? "Entrando…" : "Entrar com e-mail"}
            </motion.button>
          </div>

          {/* Dev mock buttons (only when Supabase not configured) */}
          {!supabaseReady && (
            <div className="mt-4 grid grid-cols-3 gap-1.5">
              {(["admin", "coach", "aluno"] as const).map(role => (
                <button key={role} type="button" onClick={() => handleMockLogin(role)}
                  className="rounded-lg border border-zinc-800 py-2 text-[10px] font-bold capitalize text-zinc-500 hover:border-yellow-500/40 hover:text-yellow-400 transition-colors">
                  {role === "admin" ? "Dono" : role === "coach" ? "Prof" : "Aluno"}
                </button>
              ))}
            </div>
          )}

          {/* First-time hint */}
          <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-600">
            Primeiro acesso?{" "}
            <span className="text-zinc-500">Peça o link de convite ao seu treinador.</span>
          </p>
        </div>
      </motion.div>

      {/* Footer */}
      <p className="mt-8 text-[10px] font-bold uppercase tracking-widest text-zinc-800">
        Will Treinos PRO · v2.0
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-[#EAB308]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
