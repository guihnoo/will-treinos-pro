"use client";

import React from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import WeatherWidget from "@/components/WeatherWidget";
import { GoldVolleyballBadge } from "@/components/ui/WillPremiumAssets";
import UserAvatar from "@/components/ui/UserAvatar";
import { PRESS_SCALE } from "@/components/ui/motionTokens";
import type { User } from "@/context/types";

const INTERACTIVE_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

export type CockpitHeroProps = {
  variants: Variants;
  user: Pick<User, "name" | "avatar" | "role">;
  timeGreeting: string;
  showPixWarning: boolean;
  onConfigurePix: () => void;
  awaitingApproval: number;
  pendingPaymentsCount: number;
  todayLessonCount: number;
  athletesToday: number;
  resolverLabel: string;
  resolverHint: string;
  onResolver: () => void;
};

export default function CockpitHero({
  variants,
  user,
  timeGreeting,
  showPixWarning,
  onConfigurePix,
  awaitingApproval,
  pendingPaymentsCount,
  todayLessonCount,
  athletesToday,
  resolverLabel,
  resolverHint,
  onResolver,
}: CockpitHeroProps) {
  return (
    <motion.section
      variants={variants}
      className="relative min-h-[240px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#050505]/80 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.75)] ring-1 ring-[#EAB308]/20 backdrop-blur-3xl sm:p-6"
    >
      <Image
        src="/assets/premium_dashboard_header.png"
        alt=""
        fill
        className="absolute inset-0 -z-10 object-cover opacity-50 pointer-events-none"
        priority
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(5,5,5,0.95))",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#EAB308]/50 to-transparent" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 backdrop-blur-xl shadow-inner">
              <WeatherWidget compact />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/40 bg-[#EAB308]/10 px-3 py-1.5 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#EAB308]">WILL Cockpit</p>
            </div>
          </div>
          <h1 className="break-words text-3xl font-black tracking-tight text-white sm:text-5xl drop-shadow-lg">Centro de Comando</h1>
          <p className="mt-2 text-sm text-zinc-400 font-medium">
            Resumo do que importa hoje — aprofunde nos modais ou na agenda completa.
          </p>
        </div>

        <div className="flex min-w-0 items-center gap-4">
          <div className="hidden sm:block">
            <GoldVolleyballBadge />
          </div>
          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.12] bg-[#050505]/60 px-4 py-3 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
            <UserAvatar name={user.name} photo={user.avatar} size="md" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#EAB308]">Comando Ativo</p>
              <p className="truncate text-sm font-black text-white">
                {timeGreeting}, {user.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-6 space-y-3 border-t border-white/[0.08] pt-5">
        {showPixWarning ? (
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/[0.07] px-3 py-2.5 text-[11px] leading-snug text-amber-100">
            <span className="font-black text-amber-400">PIX </span>
            Chave ainda não cadastrada — alunos não veem dados para pagar.{" "}
            <button
              type="button"
              onClick={onConfigurePix}
              className={`font-black text-[#EAB308] underline underline-offset-2 decoration-[#EAB308]/50 ${INTERACTIVE_FOCUS_RING}`}
            >
              Configurar recebimentos
            </button>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
          <motion.div whileHover={{ y: -1.5 }} className="rounded-xl border border-white/[0.08] bg-black/40 px-2.5 py-2 text-center min-h-11">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Cadastros</p>
            <p className="text-xl font-black tabular-nums text-[#EAB308]">{awaitingApproval}</p>
          </motion.div>
          <motion.div whileHover={{ y: -1.5 }} className="rounded-xl border border-white/[0.08] bg-black/40 px-2.5 py-2 text-center min-h-11">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Pagamentos</p>
            <p className="text-xl font-black tabular-nums text-amber-300">{pendingPaymentsCount}</p>
          </motion.div>
          <motion.div whileHover={{ y: -1.5 }} className="rounded-xl border border-white/[0.08] bg-black/40 px-2.5 py-2 text-center min-h-11">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Quadra hoje</p>
            <p className="text-xl font-black tabular-nums text-white">{todayLessonCount}</p>
            <p className="text-[9px] font-bold text-zinc-500">{athletesToday} atletas</p>
          </motion.div>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={PRESS_SCALE}
          onClick={onResolver}
          className={`flex min-h-12 w-full items-center justify-center rounded-xl border border-[#EAB308]/45 bg-[#EAB308]/12 px-4 text-sm font-black text-[#EAB308] transition hover:bg-[#EAB308]/18 ${INTERACTIVE_FOCUS_RING}`}
          aria-label="Resolver primeiro gargalo: aprovações ou financeiro"
        >
          <span className="inline-flex items-center gap-2">
            {awaitingApproval > 0 || pendingPaymentsCount > 0 ? <ShieldAlert className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {resolverLabel}
          </span>
        </motion.button>
        <p className="text-center text-[10px] font-medium text-zinc-500">{resolverHint}</p>
      </div>
    </motion.section>
  );
}
