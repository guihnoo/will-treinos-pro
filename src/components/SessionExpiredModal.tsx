"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, RefreshCw, LogOut } from "lucide-react";

interface SessionExpiredModalProps {
  isOpen: boolean;
  onReconnect: () => void;
  onLogout: () => void;
  recovering?: boolean;
}

export default function SessionExpiredModal({
  isOpen,
  onReconnect,
  onLogout,
  recovering = false,
}: SessionExpiredModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="session-expired-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          data-testid="session-expired-overlay"
        >
          <motion.div
            key="session-expired-card"
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800/60 shadow-2xl p-7 flex flex-col items-center gap-5"
            data-testid="session-expired-card"
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <ShieldAlert className="w-8 h-8 text-amber-400" />
              </motion.div>
            </div>

            {/* Text */}
            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-white">Sessão encerrada</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Sua sessão expirou por inatividade. Reconecte para continuar de onde parou.
              </p>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-3 mt-1">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onReconnect}
                disabled={recovering}
                data-testid="session-reconnect-btn"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#EAB308] hover:bg-yellow-400 text-black font-bold py-3 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {recovering ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {recovering ? "Reconectando..." : "Reconectar"}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onLogout}
                disabled={recovering}
                data-testid="session-logout-btn"
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-900/60 hover:bg-zinc-800/60 text-zinc-300 font-semibold py-3 text-sm transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                Fazer login novamente
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
