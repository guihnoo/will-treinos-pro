"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCriticalData } from "@/context/CriticalDataContext";
import { useAuth } from "@/context/AuthContext";
import { useStudents } from "@/context/StudentsContext";
import { Navigation } from "@/components/Navigation";
import PageTransition from "@/components/PageTransition";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import SkeletonLoader from "@/components/ui/SkeletonLoader";

const PUBLIC_ROUTES = new Set(["/", "/login", "/cadastro", "/preview", "/signup", "/aguardando", "/esqueci-senha", "/nova-senha"]);

function isPublicRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  if (PUBLIC_ROUTES.has(pathname)) return true;
  // OAuth PKCE: evita gate de matrícula enquanto role ainda não foi resolvido
  if (pathname.startsWith("/auth/")) return true;
  return false;
}

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authResolved, authError, usingSupabaseSession, logout } = useAuth();
  const { students } = useStudents();
  const { criticalDataLoading, criticalDataError, retryCriticalDataSync } = useCriticalData();
  const [showSlowSyncHint, setShowSlowSyncHint] = useState(false);
  // Safety escape: se authResolved não virar true em 10s, libera o gate e redireciona para login
  const [authEscapeTriggered, setAuthEscapeTriggered] = useState(false);
  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    if (!isPublic && authResolved && !user) {
      router.replace("/login");
    }
  }, [authResolved, isPublic, user, router]);

  useEffect(() => {
    if (!usingSupabaseSession || !criticalDataLoading) {
      setShowSlowSyncHint(false);
      return;
    }
    const id = window.setTimeout(() => setShowSlowSyncHint(true), 12_000);
    return () => window.clearTimeout(id);
  }, [usingSupabaseSession, criticalDataLoading]);

  // Escape de emergência: se authResolved nunca virar true em 10s, redireciona para login
  useEffect(() => {
    if (isPublic || authResolved) return;
    const id = window.setTimeout(() => {
      setAuthEscapeTriggered(true);
    }, 10_000);
    return () => window.clearTimeout(id);
  }, [isPublic, authResolved]);

  useEffect(() => {
    if (authEscapeTriggered && !authResolved) {
      router.replace("/login");
    }
  }, [authEscapeTriggered, authResolved, router]);

  if (isPublic) {
    return (
      <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full overflow-auto">
        {children}
      </div>
    );
  }

  if (!authResolved || (usingSupabaseSession && criticalDataLoading)) {
    return (
      <div className="flex min-h-[100dvh] flex-1 flex-col bg-black px-4 pt-4 pb-8 overflow-hidden">
        {/* Brand header skeleton */}
        <div className="flex items-center justify-between mb-5 h-12">
          <div className="h-8 w-36 rounded-xl bg-zinc-900 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-zinc-900 animate-pulse" />
        </div>

        {/* Hero card skeleton */}
        <div className="rounded-3xl border border-zinc-800/60 bg-zinc-900/60 p-5 mb-4 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-zinc-800" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-40 rounded-lg bg-zinc-800" />
              <div className="h-3 w-24 rounded-lg bg-zinc-800" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-14 rounded-2xl bg-zinc-800/70" />
            ))}
          </div>
        </div>

        {/* Lesson card skeleton */}
        <div className="rounded-3xl border border-zinc-800/60 bg-zinc-900/40 p-4 mb-4 animate-pulse">
          <div className="h-3 w-20 rounded bg-zinc-800 mb-3" />
          <div className="space-y-2.5">
            {[1,2].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-zinc-800/50 px-3 py-2.5">
                <div className="h-2 w-2 rounded-full bg-zinc-700 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-zinc-700" />
                  <div className="h-2.5 w-20 rounded bg-zinc-800" />
                </div>
                <div className="h-5 w-12 rounded-lg bg-zinc-700" />
              </div>
            ))}
          </div>
        </div>

        {/* KPI strip skeleton */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-16 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 animate-pulse" />
          ))}
        </div>

        {/* Status + retry */}
        <div className="flex flex-col items-center gap-2 mt-auto pt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border border-zinc-800 border-t-[#EAB308] animate-spin flex-shrink-0" />
            <p className="text-[11px] text-zinc-600">
              {!authResolved ? "Verificando sessão…" : "Carregando dados…"}
            </p>
          </div>
          {showSlowSyncHint && (
            <div className="w-full max-w-xs space-y-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 mt-2">
              <p className="text-center text-[11px] text-zinc-500">
                Conexão lenta. Tente novamente.
              </p>
              <button
                type="button"
                onClick={() => void retryCriticalDataSync()}
                disabled={criticalDataLoading}
                className="w-full rounded-lg border border-[#EAB308]/40 bg-[#EAB308]/10 py-2 text-xs font-bold text-[#EAB308] hover:bg-[#EAB308]/20 disabled:opacity-50"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isPublic && usingSupabaseSession && (authError || criticalDataError)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black p-4">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/40 bg-black/50 text-red-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-red-200">Falha na sessão Supabase</h2>
          <p className="mt-2 text-sm text-zinc-300">
            {criticalDataError || authError || "Não foi possível validar seus dados agora."}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Enquanto a sincronização não concluir, o app mantém bloqueio para evitar dados híbridos. Use o botão abaixo ou atualize a página.
          </p>
          <button
            type="button"
            onClick={() => void retryCriticalDataSync()}
            className="mt-4 w-full rounded-xl border border-[#EAB308]/50 bg-[#EAB308]/15 py-2.5 text-sm font-bold text-[#EAB308] hover:bg-[#EAB308]/25"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const needsMatriculaGate =
    !isPublic &&
    usingSupabaseSession &&
    !criticalDataLoading &&
    user &&
    user.role === null &&
    pathname &&
    !pathname.startsWith("/signup") &&
    !pathname.startsWith("/cadastro");

  if (needsMatriculaGate) {
    return (
      <div className="flex min-h-[100dvh] flex-1 flex-col items-center justify-center bg-black px-4 py-10">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-[#EAB308]/35 bg-[#0A0A0A] p-6 shadow-[0_0_40px_rgba(234,179,8,0.12)]">
          <h2 className="text-lg font-black text-white">Matrícula obrigatória</h2>
          <p className="text-sm text-zinc-400">
            Você autenticou com Google ou e-mail, mas ainda <strong className="text-zinc-200">não está vinculado a uma turma</strong> do Will Treinos.
            Peça ao dono o <strong className="text-[#EAB308]">link de matrícula</strong>, abra neste navegador, preencha o cadastro e depois entre de novo.
          </p>
          <Link
            href="/signup"
            className="block w-full rounded-xl border border-[#EAB308]/50 bg-[#EAB308]/15 py-3 text-center text-sm font-black text-[#EAB308] hover:bg-[#EAB308]/25"
          >
            Ir para o cadastro oficial
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="w-full rounded-xl border border-zinc-700 py-2.5 text-xs font-bold text-zinc-400 hover:border-zinc-500 hover:text-white"
          >
            Sair desta conta
          </button>
        </div>
      </div>
    );
  }

  const pendingStudent =
    user?.role === "aluno" ? students.find((s) => s.id === user.id || s.authUserId === user.authSubjectId) : undefined;
  const isPendingStudent =
    !isPublic && usingSupabaseSession && user?.role === "aluno" && pendingStudent?.status === "pending";

  if (isPendingStudent) {
    return (
      <div className="flex min-h-[100dvh] flex-1 flex-col items-center justify-center bg-black px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#EAB308]/30 bg-[#EAB308]/10 p-5">
          <h2 className="text-base font-bold text-[#EAB308]">Cadastro em análise</h2>
          <p className="mt-2 text-sm text-zinc-200">
            Seu perfil foi enviado com sucesso. Aguarde a aprovação do administrador para liberar o acesso total.
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Assim que aprovado, seu acesso é liberado automaticamente no próximo login.
          </p>
        </div>
      </div>
    );
  }

  if (user?.role === "visitor" && pathname && !pathname.startsWith("/feed")) {
    router.replace("/feed");
    return null;
  }

  if (!user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-[#EAB308]" aria-hidden />
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main
        data-app-scroll-root
        className="flex-1 lg:pl-20 h-screen overflow-y-auto pb-24 lg:pb-0 relative min-w-0"
      >
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
}
