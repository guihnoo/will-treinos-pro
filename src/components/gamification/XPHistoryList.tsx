"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGamification } from "@/context/GamificationContext";
import { Zap, CheckCircle2, MapPin, Users, Heart } from "lucide-react";
import SkeletonLoader from "@/components/ui/SkeletonLoader";

const sourceIcons = {
  lesson_rating: CheckCircle2,
  check_in: MapPin,
  check_in_external: MapPin,
  social_action: Users,
};

const sourceLabels = {
  lesson_rating: "Avaliação de Aula",
  check_in: "Check-in",
  check_in_external: "Check-in Externo",
  social_action: "Ação Social",
};

export function XPHistoryList() {
  const { xpLogs, loading } = useGamification();

  const recentLogs = xpLogs.slice(0, 5);

  if (loading) return <SkeletonLoader className="h-64 rounded-2xl" />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-zinc-800/60 bg-[#0A0A0A] p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-[#EAB308]" />
        <h3 className="text-lg font-bold text-white">Histórico de XP</h3>
      </div>

      {recentLogs.length === 0 ? (
        <p className="text-sm text-zinc-500 py-8 text-center">
          Nenhum registro de XP ainda. Comece a treinar! 💪
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {recentLogs.map((log, i) => {
              const Icon =
                sourceIcons[log.source as keyof typeof sourceIcons] || Zap;
              const label =
                sourceLabels[log.source as keyof typeof sourceLabels] ||
                log.source;
              const date = new Date(log.created_at).toLocaleDateString("pt-BR", {
                month: "short",
                day: "numeric",
              });

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/40 hover:border-zinc-700/60 transition-colors"
                >
                  <Icon className="w-4 h-4 text-[#EAB308] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {label}
                    </p>
                    <p className="text-xs text-zinc-500">{log.note || "—"}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-sm font-bold text-[#EAB308]">
                      +{log.total_xp}
                    </span>
                    <span className="text-xs text-zinc-600">{date}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
