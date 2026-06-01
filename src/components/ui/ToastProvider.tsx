"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { subscribeToasts } from "@/hooks/useToast";
import type { ToastItem } from "@/hooks/useToast";
import { ToastNotification } from "./ToastNotification";

export function RichToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = subscribeToasts(setToasts);
    return () => { unsub(); };
  }, []);

  return (
    <>
      {children}
      {/* Mobile: above bottom nav. Desktop: bottom-right */}
      <div
        className="fixed bottom-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none lg:bottom-4"
        aria-live="polite"
        aria-label="Notificações"
      >
        <AnimatePresence mode="sync">
          {toasts.map((t) => (
            <ToastNotification key={t.id} toast={t} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
