"use client";

import React from "react";
import { CARD_SURFACE_BASE } from "@/components/ui/interactionTokens";

type AppSectionCardProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  highlight?: boolean;
};

export default function AppSectionCard({
  title,
  subtitle,
  rightSlot,
  children,
  className = "",
  contentClassName = "",
  highlight = false,
}: AppSectionCardProps) {
  const baseClass = highlight
    ? "rounded-2xl border border-[#EAB308]/25 bg-zinc-950/60 backdrop-blur-xl"
    : CARD_SURFACE_BASE;

  return (
    <section className={`${baseClass} ${className}`}>
      {title || subtitle || rightSlot ? (
        <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="min-w-0">
            {title ? <h3 className="text-sm font-black text-zinc-100">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-xs text-zinc-500">{subtitle}</p> : null}
          </div>
          {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
        </div>
      ) : null}
      <div className={`p-4 sm:p-5 ${contentClassName}`}>{children}</div>
    </section>
  );
}
