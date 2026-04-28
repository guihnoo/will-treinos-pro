"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface Toast { id: string; message: string; type: ToastType; }

const ToastContext = createContext<{ toast: (msg: string, type?: ToastType) => void }>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = `t_${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const icons = { success: CheckCircle2, error: AlertTriangle, info: Info };
  const colors = { success: "#22C55E", error: "#EF4444", info: "#06B6D4" };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-28 lg:bottom-6 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => {
            const Icon = icons[t.type];
            return (
              <motion.div key={t.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                className="flex items-center gap-3 bg-[#0A0A0A] border border-zinc-800 rounded-xl px-4 py-3 shadow-2xl pointer-events-auto min-w-[280px]"
              >
                <Icon className="w-5 h-5 flex-shrink-0" style={{ color: colors[t.type] }} />
                <span className="text-sm text-white font-medium flex-1">{t.message}</span>
                <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                  className="text-zinc-600 hover:text-white p-0.5"><X className="w-3.5 h-3.5" /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
