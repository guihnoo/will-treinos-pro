"use client";

import { useEffect, useState } from "react";
import { SyncQueueStatus } from "@/components/SyncQueueStatus";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { getSupabaseClient } from "@/lib/supabaseClient";

/** Ativa fila offline + badge de sincronização para usuários autenticados. */
export function AppSyncLayer() {
  const [jwt, setJwt] = useState<string | undefined>();

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      setJwt(data.session?.access_token);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setJwt(session?.access_token);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const { processPending } = useSyncQueue({ jwt });

  return <SyncQueueStatus onRetry={() => void processPending()} />;
}
