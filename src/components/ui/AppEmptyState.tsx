"use client";

import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

type AppEmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export default function AppEmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  className = "",
}: AppEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-zinc-800 bg-[#0A0A0A] p-6 text-center ${className}`}
    >
      {Icon ? (
        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAB308]/30 bg-[#EAB308]/10">
          <Icon className="h-5 w-5 text-[#EAB308]" />
        </div>
      ) : null}
      <p className="text-sm font-bold text-zinc-200">{title}</p>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 min-h-11 rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10 px-4 py-2 text-xs font-bold text-[#EAB308] hover:bg-[#EAB308]/15"
        >
          {actionLabel}
        </button>
      ) : null}
    </motion.div>
  );
}
