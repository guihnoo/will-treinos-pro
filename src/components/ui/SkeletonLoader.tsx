"use client";

import React from "react";
import { motion } from "framer-motion";

type SkeletonLoaderProps = {
  className?: string;
  lines?: number;
  lineClassName?: string;
};

export default function SkeletonLoader({ className = "", lines = 3, lineClassName = "" }: SkeletonLoaderProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/80 ${className}`}>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#EAB308]/15 to-transparent"
        animate={{ x: ["0%", "220%"] }}
        transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.35 }}
      />
      <div className="space-y-2 p-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={`skeleton-line-${index}`}
            className={`h-3 rounded-md bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 ${lineClassName}`}
            style={{ width: `${92 - index * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}

