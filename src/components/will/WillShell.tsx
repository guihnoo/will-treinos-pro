"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ClipboardList, LayoutGrid, ChevronLeft, Sparkles, Newspaper } from "lucide-react";
import OfflineStatusBanner from "@/components/ui/OfflineStatusBanner";

const NAV = [
  { href: "/feed", label: "A Rede (moderação)", icon: Newspaper },
  { href: "/will/court", label: "Prancheta da Quadra", icon: ClipboardList },
  { href: "/will/evaluations/templates", label: "Motor de Avaliação", icon: LayoutGrid },
];

export default function WillShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-full bg-gradient-to-b from-black via-[#040406] to-black text-zinc-100">
      <OfflineStatusBanner position="top" />
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/55 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/80 text-zinc-400 transition-colors hover:border-[#EAB308]/35 hover:text-[#EAB308]"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#EAB308]/90">WILL Area</p>
              <p className="truncate text-xs font-bold text-white">Engine Room — Controle clínico</p>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-xl border border-white/[0.07] bg-zinc-950/50 p-1 sm:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="relative">
                  {active && (
                    <motion.span
                      layoutId="will-nav-pill"
                      className="absolute inset-0 rounded-lg bg-[#EAB308]/15 ring-1 ring-[#EAB308]/35"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <span
                    className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold ${
                      active ? "text-[#EAB308]" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#EAB308] text-black shadow-[0_0_20px_rgba(234,179,8,0.35)]">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-white/[0.04] px-3 py-2 sm:hidden">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-bold ${
                  active ? "bg-[#EAB308]/15 text-[#EAB308]" : "text-zinc-500"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-5 sm:py-8">{children}</main>
    </div>
  );
}
