"use client";

import { useCallback, useEffect, useState } from "react";
import { hasSupabaseEnv } from "@/lib/supabaseClient";
import {
  cadastroInviteRequired,
  clearStoredInviteToken,
  persistInviteTokenFromSearch,
  setMatriculaChannelActive,
} from "@/lib/enrollmentSession";
import { verifyEnrollmentInviteWithServer } from "@/lib/verifyEnrollmentInvite";

export type EnrollmentInviteGateState = {
  ready: boolean;
  blocked: boolean;
  reason?: "missing" | "invalid";
};

/**
 * Gate único para `/cadastro` e `/signup`: persiste `?invite=`, valida via RPC quando exigido por env.
 */
export function useEnrollmentInviteGate(): EnrollmentInviteGateState & {
  markInviteInvalid: () => void;
} {
  const [gate, setGate] = useState<EnrollmentInviteGateState>({ ready: false, blocked: false });

  const markInviteInvalid = useCallback(() => {
    clearStoredInviteToken();
    setGate({ ready: true, blocked: true, reason: "invalid" });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    (async () => {
      const token = persistInviteTokenFromSearch(window.location.search);
      const required = cadastroInviteRequired();

      if (!required) {
        setMatriculaChannelActive();
        if (!cancelled) setGate({ ready: true, blocked: false });
        return;
      }

      if (!token) {
        if (!cancelled) setGate({ ready: true, blocked: true, reason: "missing" });
        return;
      }

      if (!hasSupabaseEnv()) {
        setMatriculaChannelActive();
        if (!cancelled) setGate({ ready: true, blocked: false });
        return;
      }

      const valid = await verifyEnrollmentInviteWithServer(token);
      if (cancelled) return;

      if (!valid) {
        clearStoredInviteToken();
        if (!cancelled) setGate({ ready: true, blocked: true, reason: "invalid" });
        return;
      }

      setMatriculaChannelActive();
      if (!cancelled) setGate({ ready: true, blocked: false });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...gate, markInviteInvalid };
}
