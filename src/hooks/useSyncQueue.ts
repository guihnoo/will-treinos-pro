/**
 * Hook para integrar Sync Queue no app
 *
 * Detecta:
 * - Quando app vai offline → ações entram na fila
 * - Quando app volta online → sincroniza automaticamente
 */

import { useEffect, useRef, useCallback } from "react";
import SyncQueue, { SyncQueueProcessor } from "@/lib/syncQueue";

export function useSyncQueue(options: {
  /** JWT do usuário (necessário para processar fila) */
  jwt?: string;
  /** Callback quando sync termina */
  onSyncComplete?: () => void;
  /** Callback para erro durante sync */
  onSyncError?: (error: string) => void;
}) {
  const processorRef = useRef<SyncQueueProcessor | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Processar fila quando volta online
  const processPending = useCallback(async () => {
    if (!options.jwt) return;

    processor.processAll(options.jwt).catch((error) => {
      options.onSyncError?.(error instanceof Error ? error.message : String(error));
    });
  }, [options.jwt, options.onSyncError]);

  // Configurar listener de conectividade
  useEffect(() => {
    const handleOnline = () => {
      console.log("[SyncQueue] Voltou online — processando fila");

      // Pequeno delay para garantir que a rede está estável
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        void processPending();
      }, 1000);
    };

    const handleOffline = () => {
      console.log("[SyncQueue] Ficou offline — ações entram na fila");
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [processPending]);

  // Criar processor instance
  const processor = processorRef.current ?? new SyncQueueProcessor();
  processorRef.current = processor;

  return {
    queue: SyncQueue,
    processor,
    processPending,
  };
}
