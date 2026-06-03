"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Zap, Target } from "lucide-react";
import Link from "next/link";
import { STUDENT_HOME_PATH } from "@/lib/studentRoutes";
import { useAuth } from "@/context/AuthContext";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { LeaderboardCard } from "./LeaderboardCard";
import SkeletonLoader from "@/components/ui/SkeletonLoader";

type Timeframe = "week" | "month" | "all";

interface LeaderboardPanelProps {
  compact?: boolean;
}

export function LeaderboardRankingPanel({ compact = false }: LeaderboardPanelProps) {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const { entries, userRank, userXP, loading, error } = useLeaderboard(timeframe);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-red-800/60 bg-red-950/40 p-5"
      >
        <p className="text-sm text-red-200">Erro ao carregar ranking: {error}</p>
      </motion.div>
    );
  }

  if (loading) {
    return <SkeletonLoader className="h-96 rounded-2xl" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-zinc-800/60 bg-[#0A0A0A] p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#EAB308]" />
          <h3 className="text-lg font-bold text-white">Ranking</h3>
        </div>

        {/* Timeframe Selector */}
        {!compact && (
          <div className="flex gap-2">
            {(["week", "month", "all"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                  timeframe === tf
                    ? "bg-[#EAB308] text-black"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {tf === "week" ? "Semana" : tf === "month" ? "Mês" : "Tudo"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 py-10 px-6 text-center backdrop-blur-md"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAB308]/15">
            <Trophy className="h-7 w-7 text-[#EAB308]" />
          </div>
          <p className="text-base font-bold text-white">Quadra ainda sem placar</p>
          <p className="mt-2 text-sm text-zinc-400 max-w-xs mx-auto">
            {timeframe === "week"
              ? "Nesta semana ninguém pontuou ainda. Check-in ou avaliação do coach colocam você no ranking."
              : timeframe === "month"
                ? "Neste mês ainda não há XP. Sua próxima aula pode abrir o placar."
                : "O histórico começa quando a turma ganha XP."}
          </p>
          <Link
            href={STUDENT_HOME_PATH}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-yellow-400 transition-colors"
          >
            <Zap className="h-4 w-4" />
            Ir para Início
          </Link>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <Target className="h-3.5 w-3.5 text-[#EAB308]" />
            Atualização em tempo real
          </p>
        </motion.div>
      ) : (
        <div className={compact ? "space-y-2" : "space-y-3"}>
          {entries.map((entry, i) => (
            <LeaderboardCard
              key={entry.id}
              entry={entry}
              isCurrentUser={entry.id === user?.id}
              index={i}
            />
          ))}
        </div>
      )}

      {/* User's Rank (if not in top 10) */}
      {userRank && userRank > 10 && !compact && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 pt-6 border-t border-zinc-800/60"
        >
          <p className="text-xs text-zinc-500 mb-2">Seu Ranking</p>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#EAB308]/10 border border-[#EAB308]/30">
            <TrendingUp className="w-4 h-4 text-[#EAB308]" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{user?.name || "Você"}</p>
              <p className="text-xs text-zinc-400"># Rank {userRank}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#EAB308]">
                {userXP.toLocaleString()} XP
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer Note */}
      {!compact && (
        <p className="text-[10px] text-zinc-600 text-center mt-4">
          Atualizado em tempo real
        </p>
      )}
    </motion.div>
  );
}
