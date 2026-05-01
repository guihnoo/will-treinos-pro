"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Phone } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import { hasSupabaseEnv } from "@/lib/supabaseClient";

const POST_LOGIN_NEXT_KEY = "wt_post_login_next";

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
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
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
    if (method !== "email") {
      toast("Login por SMS entra na próxima fase. Use e-mail/senha por enquanto.", "error");
      return;
    }

    setIsSubmitting(true);
    const result = await loginWithPassword(email, password);
    setIsSubmitting(false);
    if (result.ok === false) {
      toast(result.message, "error");
      return;
    }
    toast("✅ Sessão autenticada com sucesso.");
    if (nextPath) {
      router.push(nextPath);
      return;
    }
    // Papel efetivo (incl. matrícula pendente) vem do cookie + middleware; destino padrão é a home do app.
    router.push("/dashboard");
  };

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    if (!supabaseReady) {
      toast(
        "Login social desativado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) em Vercel → Settings → Environment Variables (Production), faça redeploy e teste de novo.",
        "error",
      );
      return;
    }
    if (nextPath && typeof window !== "undefined") {
      sessionStorage.setItem(POST_LOGIN_NEXT_KEY, nextPath);
    }
    setIsSubmitting(true);
    const result = await loginWithOAuth(provider);
    setIsSubmitting(false);
    if (result.ok === false) {
      toast(
        `${result.message} No Supabase: Authentication → Providers (Google ativo) e URL Configuration → Redirect URLs deve incluir ${window.location.origin}/auth/callback`,
        "error",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#EAB308] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

      <Link href="/" className="absolute top-6 left-6 text-zinc-500 hover:text-white flex items-center gap-2 transition-colors z-10">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md bg-black/50 border border-zinc-800/60 p-8 rounded-3xl backdrop-blur-md relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#EAB308]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#EAB308]/20">
            <span className="text-3xl">🏐</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta</h1>
          <p className="text-sm text-zinc-500">Faça login para acessar sua conta</p>
          {supabaseReady ? (
            <p className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-left text-[11px] leading-relaxed text-zinc-400">
              <span className="font-bold text-[#EAB308]">Aluno:</span> use primeiro o{" "}
              <strong className="text-zinc-200">link de matrícula</strong> enviado pelo Will Treinos (mesmo site),
              preencha o cadastro e só depois entre com Google ou e-mail aqui. Assim o dono vê sua solicitação e aprova.
            </p>
          ) : null}
        </div>

        {/* Auth Methods Toggle */}
        <div className="flex p-1 bg-zinc-900 rounded-xl mb-6">
          <button onClick={() => setMethod("email")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${method === "email" ? "bg-zinc-800 text-white shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}>
            E-mail
          </button>
          <button onClick={() => setMethod("phone")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${method === "phone" ? "bg-zinc-800 text-white shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}>
            Celular (SMS)
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4 mb-6">
          {method === "email" ? (
            <>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="email" placeholder="Seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-[#EAB308]/50 transition-colors" />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="password" placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-[#EAB308]/50 transition-colors" />
              </div>
            </>
          ) : (
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="tel" placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-[#EAB308]/50 transition-colors" />
            </div>
          )}
        </div>

        <button
          onClick={handleRealLogin}
          disabled={!supabaseReady || isSubmitting}
          className="w-full bg-white text-black py-3 rounded-xl font-bold text-sm mb-2 hover:bg-zinc-200 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
        {!supabaseReady ? (
          <p className="mb-4 text-center text-[11px] text-amber-300/90">
            Configure as variáveis públicas do Supabase para ativar login real.
          </p>
        ) : (
          <div className="mb-4" />
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px bg-zinc-800 flex-1" />
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Ou entre com</span>
          <div className="h-px bg-zinc-800 flex-1" />
        </div>

        {!supabaseReady ? (
          <p className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100/95">
            Google/Facebook só funcionam após configurar as variáveis públicas do Supabase no projeto da Vercel e publicar um novo deploy. Enquanto isso, use o painel de testes abaixo.
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            type="button"
            onClick={() => void handleOAuthLogin("google")}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-sm font-medium hover:bg-zinc-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => void handleOAuthLogin("facebook")}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-sm font-medium hover:bg-zinc-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>

        {!supabaseReady ? (
          <div className="mt-8 p-4 bg-[#EAB308]/10 border border-[#EAB308]/20 rounded-xl">
            <p className="text-[10px] font-bold text-[#EAB308] uppercase tracking-wider mb-3 text-center">🔧 Painel de Testes</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleMockLogin("admin")} className="py-2 text-xs font-bold bg-black border border-zinc-800 rounded-lg hover:border-[#EAB308] transition-colors">Entrar como Admin</button>
              <button onClick={() => handleMockLogin("coach")} className="py-2 text-xs font-bold bg-black border border-zinc-800 rounded-lg hover:border-[#EAB308] transition-colors">Entrar como Prof</button>
              <button onClick={() => handleMockLogin("aluno")} className="py-2 text-xs font-bold bg-black border border-zinc-800 rounded-lg hover:border-[#EAB308] transition-colors">Entrar como Aluno</button>
            </div>
          </div>
        ) : null}

        <p className="text-center text-xs text-zinc-500 mt-8">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-[#EAB308] font-bold hover:underline">Faça sua matrícula</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-800 border-t-[#EAB308]"
            aria-hidden
          />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
