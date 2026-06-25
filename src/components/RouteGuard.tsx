"use client";

import { ReactNode } from "react";
import { useCanAccess } from "@/hooks/useStudentRole";
import { AlertTriangle } from "lucide-react";

interface RouteGuardProps {
  area: "dashboard" | "gamification" | "admin" | "feed";
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Guard de rota que bloqueia acesso a áreas restritas baseado no papel do usuário.
 *
 * Uso:
 * ```tsx
 * <RouteGuard area="dashboard">
 *   <DashboardContent />
 * </RouteGuard>
 * ```
 */
export default function RouteGuard({ area, children, fallback }: RouteGuardProps) {
  const canAccess = useCanAccess(area);

  if (!canAccess) {
    return (
      fallback || (
        <div className="min-h-[100dvh] bg-black flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
            <h1 className="text-lg font-bold text-white mb-2">Acesso Restrito</h1>
            <p className="text-sm text-zinc-400 mb-6">
              Você não tem permissão para acessar essa área.
            </p>
            <a
              href="/feed"
              className="inline-block px-4 py-2 rounded-lg bg-[#EAB308] text-black font-bold text-sm hover:bg-[#D9A406] transition-colors"
            >
              Voltar para o Feed
            </a>
          </div>
        </div>
      )
    );
  }

  return children;
}
