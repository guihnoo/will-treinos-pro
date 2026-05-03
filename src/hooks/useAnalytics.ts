/**
 * Hook para usar Analytics no app
 * Inicializa PostHog e fornece funções de rastreamento
 */

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { initPostHog, identifyUser, analytics } from "@/lib/analytics";

export function useAnalytics() {
  const { user } = useAuth();

  // Inicializar PostHog e identificar usuário
  useEffect(() => {
    if (typeof window === "undefined") return;

    initPostHog();

    if (user) {
      identifyUser(user.id, {
        email: user.email,
        role: user.role,
        name: user.name,
        avatar: user.avatar,
      });
    }
  }, [user]);

  return analytics;
}
