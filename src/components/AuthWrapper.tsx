"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Navigation } from "@/components/Navigation";
import PageTransition from "@/components/PageTransition";
import { AlertTriangle } from "lucide-react";
import SkeletonLoader from "@/components/ui/SkeletonLoader";

const PUBLIC_ROUTES = new Set(["/", "/login", "/cadastro"]);

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    students,
    authResolved,
    authError,
    usingSupabaseSession,
    criticalDataLoading,
    criticalDataError,
    retryCriticalDataSync,
  } = useApp();
  const [showSlowSyncHint, setShowSlowSyncHint] = useState(false);
  const isPublic = pathname ? PUBLIC_ROUTES.has(pathname) : false;

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

  if (isPublic) {
    return (
      <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full overflow-auto">
        {children}
      </div>
    );
  }

  if (!authResolved || (usingSupabaseSession && criticalDataLoading)) {
    return (
      <div className="flex min-h-[100dvh] flex-1 flex-col items-center justify-center bg-black px-4 py-10">
        <div className="w-full max-w-md space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-10 w-10 flex-shrink-0 rounded-full border-2 border-zinc-800 border-t-[#EAB308] animate-spin"
              aria-hidden
            />
            <p className="text-center text-xs font-medium text-zinc-500">
              {!authResolved ? "Validando sessão segura..." : "Sincronizando dados ao vivo…"}
            </p>
            {showSlowSyncHint && (
              <div className="mt-3 w-full space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
                <p className="text-center text-[11px] text-zinc-500">
                  A conexão está lenta ou instável. Você pode tentar sincronizar de novo sem sair da página.
                </p>
                <button
                  type="button"
                  onClick={() => void retryCriticalDataSync()}
                  disabled={criticalDataLoading}
                  className="w-full rounded-lg border border-[#EAB308]/40 bg-[#EAB308]/10 py-2 text-xs font-bold text-[#EAB308] hover:bg-[#EAB308]/20 disabled:opacity-50"
                >
                  Tentar sincronizar de novo
                </button>
              </div>
            )}
          </div>
          <div className="min-h-[120px] space-y-3">
            <SkeletonLoader lines={2} className="min-h-[52px] border-zinc-800/80" />
            <SkeletonLoader lines={3} className="min-h-[72px] border-zinc-800/80" />
          </div>
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

  if (!user) {
    return null;
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
