"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

interface DailyChallengeCTACardProps {
  onViewChallenges?: () => void;
}

export default function DailyChallengeCTACard({
  onViewChallenges,
}: DailyChallengeCTACardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      whileHover={{ scale: 1.02 }}
      onClick={onViewChallenges}
      className="rounded-2xl bg-gradient-to-br from-violet-600/40 to-fuchsia-600/40 border border-violet-500/30 p-4 cursor-pointer transition-all hover:border-violet-400/50 hover:shadow-lg hover:shadow-violet-500/20"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 text-violet-300" />
          </motion.div>
          <h3 className="text-sm font-bold text-white">Desafios Diários</h3>
        </div>
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowRight className="w-4 h-4 text-violet-300" />
        </motion.div>
      </div>

      <p className="text-xs text-violet-100 mb-4">
        Complete tarefas rápidas para ganhar bônus de XP e desbloqueios especiais!
      </p>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] text-violet-200">
          <div className="w-1 h-1 rounded-full bg-violet-300" />
          <span>Faça check-in na quadra</span>
          <span className="ml-auto font-semibold">+25 XP</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-violet-200">
          <div className="w-1 h-1 rounded-full bg-violet-300" />
          <span>Ganhe 100+ XP no dia</span>
          <span className="ml-auto font-semibold">+50 XP</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-4 w-full py-2 px-3 rounded-lg bg-violet-500/30 hover:bg-violet-500/50 text-white text-xs font-bold uppercase tracking-wider transition-colors"
      >
        Ver Desafios de Hoje
      </motion.button>
    </motion.div>
  );
}
