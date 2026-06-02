"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface Props {
  xpAmount: number;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 2500;

export default function RealtimeXPIndicator({ xpAmount, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      style={{ zIndex: 9998 }}
      className="fixed left-1/2 top-safe-or-4 -translate-x-1/2 pointer-events-none"
    >
      <div className="flex items-center gap-2 rounded-full border border-[#EAB308]/50 bg-black/90 px-4 py-2 shadow-[0_8px_32px_rgba(234,179,8,0.25)] backdrop-blur-xl">
        <Zap className="h-4 w-4 shrink-0 text-[#EAB308]" fill="#EAB308" />
        <span className="text-sm font-black text-[#EAB308]">
          +{xpAmount} XP
        </span>
      </div>
    </motion.div>
  );
}
