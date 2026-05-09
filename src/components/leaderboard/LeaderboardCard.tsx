"use client";

import { motion } from "framer-motion";
import { Medal, Zap } from "lucide-react";
import type { LeaderboardEntry } from "@/hooks/useLeaderboard";
import { avatarSrc } from "@/lib/avatarSrc";

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  index: number;
}

const medalColors = {
  1: "#FFD700", // Gold
  2: "#C0C0C0", // Silver
  3: "#CD7F32", // Bronze
};

export function LeaderboardCard({
  entry,
  isCurrentUser = false,
  index,
}: LeaderboardCardProps) {
  const medalColor =
    medalColors[entry.rank as keyof typeof medalColors] || undefined;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${
        isCurrentUser
          ? "border-[#EAB308] bg-[#EAB308]/10 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
          : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700"
      }`}
    >
      {/* Rank Badge */}
      <div className="flex-shrink-0">
        {entry.rank <= 3 ? (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${medalColor}20`, borderColor: medalColor, borderWidth: 2 }}
          >
            <Medal className="w-5 h-5" style={{ color: medalColor }} />
            <span className="absolute -top-1 -right-1 text-xs font-black text-white bg-black rounded-full w-5 h-5 flex items-center justify-center">
              {entry.rank}
            </span>
          </motion.div>
        ) : (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">
            {entry.rank}
          </div>
        )}
      </div>

      {/* Avatar + Name */}
      <div className="flex-1 min-w-0">
        <img
          src={avatarSrc(entry.avatar, entry.name)}
          alt={entry.name}
          className="w-10 h-10 rounded-full object-cover float-left mr-3"
        />
        <div className="overflow-hidden">
          <p
            className={`font-bold truncate ${
              isCurrentUser ? "text-[#EAB308]" : "text-white"
            }`}
          >
            {entry.name}
            {isCurrentUser && " (você)"}
          </p>
          <p className="text-xs text-zinc-500"># Rank {entry.rank}</p>
        </div>
      </div>

      {/* XP Display */}
      <div className="flex-shrink-0 text-right">
        <div className="flex items-center gap-1 mb-1">
          <Zap className="w-4 h-4 text-[#EAB308]" />
          <span className="font-bold text-white tabular-nums">
            {entry.total_xp.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-zinc-500">XP</p>
      </div>
    </motion.div>
  );
}
