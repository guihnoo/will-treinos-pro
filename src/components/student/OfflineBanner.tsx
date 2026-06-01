"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, Clock } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export default function OfflineBanner() {
  const { isOnline, hasPendingSync, pendingCount, syncNow } = useOfflineSync();
  const [justCameOnline, setJustCameOnline] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Track transitions: offline → online
  const prevOnlineRef = React.useRef(isOnline);
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      setJustCameOnline(true);
      setSyncing(true);
      void syncNow().finally(() => setSyncing(false));
      const timer = setTimeout(() => setJustCameOnline(false), 3000);
      return () => clearTimeout(timer);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, syncNow]);

  const show = !isOnline || justCameOnline;
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={isOnline ? "online" : "offline"}
        initial={{ opacity: 0, y: -12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="mb-3 px-1"
        data-testid="offline-banner"
        role="status"
        aria-live="polite"
      >
        {!isOnline ? (
          <div className="flex items-center gap-3 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-3">
            <div className="relative flex-shrink-0">
              <WifiOff className="h-4 w-4 text-orange-400" />
              {/* Pulsing dot */}
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-orange-300">Modo offline</p>
              <p className="text-[10px] text-orange-400/70">
                Dados podem estar desatualizados
                {hasPendingSync
                  ? ` · ${pendingCount} check-in${pendingCount > 1 ? "s" : ""} aguardando sincronização`
                  : ""}
              </p>
            </div>
          </div>
        ) : justCameOnline ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <div className="flex-shrink-0">
              {syncing ? (
                <Clock className="h-4 w-4 text-emerald-400 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-emerald-300">
                {syncing ? "Sincronizando…" : "Conectado!"}
              </p>
              {syncing && hasPendingSync && (
                <p className="text-[10px] text-emerald-400/70">
                  Enviando {pendingCount} check-in{pendingCount > 1 ? "s" : ""} pendente{pendingCount > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
