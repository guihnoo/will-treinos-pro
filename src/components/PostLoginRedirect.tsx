"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStudentRole, usePostLoginRoute } from "@/hooks/useStudentRole";
import { useAuth } from "@/context/AuthContext";

/**
 * Componente que redireciona o usuário para a página apropriada após login
 * baseado em seu papel (role).
 *
 * Deve ser envolvido por AppProvider para ter acesso ao contexto.
 */
export default function PostLoginRedirect() {
  const router = useRouter();
  const { user, authResolved } = useAuth();
  const studentRole = useStudentRole();
  const targetRoute = usePostLoginRoute();

  useEffect(() => {
    // Aguarda autenticação + contexto carregarem
    if (!authResolved) return;

    // Se não há usuário, não redireciona (deixa AuthWrapper lidar)
    if (!user) return;

    // Se estamos em uma rota de auth, redireciona
    const currentPath = window.location.pathname;
    const isAuthRoute = currentPath.includes("/auth/") || currentPath === "/login" || currentPath === "/signup";

    if (isAuthRoute && studentRole) {
      // Log para debugging
      console.log(`[PostLoginRedirect] Redirecting to ${targetRoute} (role: ${studentRole})`);
      router.replace(targetRoute);
    }
  }, [user, authResolved, studentRole, targetRoute, router]);

  // Componente não renderiza nada
  return null;
}
