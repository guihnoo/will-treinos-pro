"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface SessionRecoveryState {
  isExpired: boolean;
  recovering: boolean;
}

interface UseSessionRecoveryReturn extends SessionRecoveryState {
  recover: () => Promise<void>;
  forceLogout: () => Promise<void>;
}

export function useSessionRecovery(): UseSessionRecoveryReturn {
  const [state, setState] = useState<SessionRecoveryState>({
    isExpired: false,
    recovering: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSessionExpired = () => {
      setState((prev) => {
        // Don't re-trigger if already showing or recovering
        if (prev.isExpired || prev.recovering) return prev;
        return { isExpired: true, recovering: false };
      });
    };

    window.addEventListener("wt:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("wt:session-expired", handleSessionExpired);
    };
  }, []);

  const recover = useCallback(async () => {
    setState((prev) => ({ ...prev, recovering: true }));
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        await forceLogout();
        return;
      }

      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        // Refresh failed — force logout
        await forceLogout();
        return;
      }

      // Success — reset state and notify
      setState({ isExpired: false, recovering: false });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("wt:session-recovered"));
      }
    } catch {
      await forceLogout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const forceLogout = useCallback(async () => {
    setState({ isExpired: false, recovering: false });
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore — redirect anyway
    }
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }, []);

  return {
    isExpired: state.isExpired,
    recovering: state.recovering,
    recover,
    forceLogout,
  };
}
