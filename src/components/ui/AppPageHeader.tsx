"use client";

import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CARD_SURFACE_PREMIUM } from "@/components/ui/interactionTokens";

type AppPageHeaderProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  rightSlot?: React.ReactNode;
  className?: string;
};

export default function AppPageHeader({ title, subtitle, icon: Icon, rightSlot, className = "" }: AppPageHeaderProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mb-4 ${className}`}>
      <div className={`${CARD_SURFACE_PREMIUM} flex items-start justify-between gap-3 px-4 py-4 sm:px-5`}>
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 text-2xl font-black text-white sm:text-3xl">
            <Icon className="h-7 w-7 text-[#EAB308] sm:h-8 sm:w-8" />
            {title}
          </h1>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">{subtitle}</p>
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </motion.div>
  );
}
