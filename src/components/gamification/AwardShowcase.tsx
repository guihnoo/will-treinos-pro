"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { AwardTierCard } from "./AwardTierCard";

const TIERS = ["bronze", "prata", "ouro", "diamante", "elite"] as const;

export function AwardShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-zinc-800/60 bg-[#0A0A0A] p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-[#EAB308]" />
        <h3 className="text-lg font-bold text-white">Cards de Conquista</h3>
      </div>

      <p className="text-sm text-zinc-400 mb-5">
        Desbloqueie cards ao ganhar XP em partidas, treinos e check-ins.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {TIERS.map((tier, i) => (
          <AwardTierCard key={tier} tier={tier} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
