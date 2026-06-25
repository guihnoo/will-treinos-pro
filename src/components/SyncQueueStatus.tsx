"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import SyncQueue from "@/lib/syncQueue";

/**
 * Exibe status de sincronização no app
 * - Mostra badge quando há ações pendentes
 * - Indica se está online/offline
 * - Permite retry manual
 */

export function SyncQueueStatus({ onRetry }: { onRetry?: () => void }) {
  const [status, setStatus] = useState({ total: 0, pending: 0, failed: 0 });
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Atualizar status de sync queue a cada 1s
  useEffect(() => {
    const updateStatus = () => {
      setStatus(SyncQueue.getStatus());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  // Detectar conectividade
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (status.total === 0) {
    return null; // Nada para sincronizar
  }

  const hasPending = status.pending > 0;
  const hasFailed = status.failed > 0;

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 lg:bottom-6 lg:right-6">
      <div
        role="status"
        className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-[min(100vw-2rem,20rem)] ${
          isOnline
            ? hasPending
              ? "bg-blue-500/20 border border-blue-500/50 text-blue-300"
              : hasFailed
                ? "bg-red-500/20 border border-red-500/50 text-red-300"
                : "bg-green-500/20 border border-green-500/50 text-green-300"
            : "bg-yellow-500/20 border border-yellow-500/50 text-yellow-300"
        }`}
      >
        {!isOnline ? (
          <>
            <CloudOff className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Offline · {status.total} ação(ões)</span>
          </>
        ) : hasPending ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Sincronizando {status.pending}...</span>
          </>
        ) : hasFailed ? (
          <>
            <CloudOff className="w-4 h-4" />
            <span className="text-sm font-medium">{status.failed} falhou(ram)</span>
          </>
        ) : (
          <>
            <Cloud className="w-4 h-4" />
            <span className="text-sm font-medium">Sincronizado ✓</span>
          </>
        )}
        {(hasFailed || (!isOnline && status.total > 0)) && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="ml-1 rounded-md border border-white/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide hover:bg-white/10"
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
