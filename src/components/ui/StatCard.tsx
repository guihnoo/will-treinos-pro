"use client";

import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CARD_SURFACE_BASE } from "@/components/ui/interactionTokens";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
  delay?: number;
};

export default function StatCard({ label, value, icon: Icon, color, subtitle, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={`${CARD_SURFACE_BASE} relative flex items-center gap-3 overflow-hidden p-4`}
    >
      <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full blur-xl opacity-20" style={{ background: color }} />
      <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-white leading-none">{value}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">{label}</p>
        {subtitle ? <p className="text-[10px] text-zinc-600">{subtitle}</p> : null}
      </div>
    </motion.div>
  );
}
