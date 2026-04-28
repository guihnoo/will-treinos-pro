"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";

type OfflineStatusBannerProps = {
  position?: "top" | "bottom";
};

export default function OfflineStatusBanner({ position = "bottom" }: OfflineStatusBannerProps) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const positionClass = position === "top" ? "top-3" : "bottom-20 sm:bottom-4";

  return (
    <AnimatePresence>
      {!online ? (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -14 : 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === "top" ? -10 : 10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`pointer-events-none fixed left-1/2 z-[120] w-[min(92vw,480px)] -translate-x-1/2 ${positionClass}`}
        >
          <div className="rounded-2xl border border-[#EAB308]/35 bg-black/80 px-4 py-2.5 backdrop-blur-2xl shadow-[0_0_24px_rgba(234,179,8,0.16)]">
            <p className="flex items-center gap-2 text-[11px] font-semibold text-[#F5D77A]">
              <WifiOff className="h-4 w-4 text-[#EAB308]" />
              Modo Offline Ativo - Sincronizacao pendente
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

