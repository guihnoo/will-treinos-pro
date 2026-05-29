"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Zap, TrendingUp } from "lucide-react";
import { useXPMutations } from "@/hooks/useXPMutations";
import { useAuth } from "@/context/AuthContext";
import { CARD_TIER_THRESHOLDS } from "@/context/types";
import type { CardTier, VolleyballFundamental } from "@/context/types";
import TierProgressCard from "./gamification/TierProgressCard";
import AchievementPathGrid from "./gamification/AchievementPathGrid";
import FundamentalBreakdown from "./gamification/FundamentalBreakdown";
import XPMomentumIndicator from "./gamification/XPMomentumIndicator";
import DailyChallengeCTACard from "./gamification/DailyChallengeCTACard";
import DailyChallengesPanel from "./gamification/DailyChallengesPanel";

interface StudentGamificationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudentGamificationDashboard({
  isOpen,
  onClose,
}: StudentGamificationDashboardProps) {
  const { user } = useAuth();
  const { getTierProgressData, getXPByFundamental, getXPVelocity } = useXPMutations();

  type TierProgressData = {
    totalXP: number;
    currentTier: CardTier | null;
    nextTier: CardTier | null;
    xpToNextTier: number;
    achievements: any[];
    unlockedTiers: CardTier[];
    unlockDates: Record<string, string>;
  };

  const [loading, setLoading] = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [tierData, setTierData] = useState<TierProgressData | null>(null);
  const [xpByFundamental, setXPByFundamental] = useState<Record<VolleyballFundamental, number> | null>(null);
  const [xpVelocity7d, setXPVelocity7d] = useState(0);
  const [xpVelocity30d, setXPVelocity30d] = useState(0);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [tier, fundamental, vel7, vel30] = await Promise.all([
          getTierProgressData(user.id),
          getXPByFundamental(user.id),
          getXPVelocity(user.id, 7),
          getXPVelocity(user.id, 30),
        ]);

        setTierData(tier);
        setXPByFundamental(fundamental);
        setXPVelocity7d(vel7 || 0);
        setXPVelocity30d(vel30 || 0);
      } catch (error) {
        console.error("Failed to load gamification data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, user?.id, getTierProgressData, getXPByFundamental, getXPVelocity]);

  const allTiers: CardTier[] = useMemo(() => ["bronze", "prata", "ouro", "diamante", "elite"], []);

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-bold text-white">Meu Progresso 🎯</h2>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-slate-400">Carregando sua jornada...</div>
                </div>
              ) : tierData ? (
                <>
                  {/* Current Tier Progress */}
                  <TierProgressCard
                    tier={tierData.currentTier}
                    totalXP={tierData.totalXP}
                    nextTierXP={tierData.nextTier ? CARD_TIER_THRESHOLDS[tierData.nextTier] : null}
                    xpToNextTier={tierData.xpToNextTier}
                    unlockedAt={tierData.currentTier ? tierData.unlockDates[tierData.currentTier] : undefined}
                  />

                  {/* Achievement Path */}
                  <AchievementPathGrid
                    allTiers={allTiers}
                    achievedTiers={tierData.unlockedTiers as CardTier[]}
                    xpThresholds={CARD_TIER_THRESHOLDS}
                  />

                  {/* Fundamental Breakdown */}
                  {xpByFundamental && (
                    <FundamentalBreakdown
                      xpByFundamental={xpByFundamental}
                    />
                  )}

                  {/* XP Momentum */}
                  <XPMomentumIndicator
                    xpVelocity7d={xpVelocity7d}
                    xpVelocity30d={xpVelocity30d}
                    currentTier={tierData.currentTier}
                    xpToNextTier={tierData.xpToNextTier}
                  />

                  {/* Daily Challenges CTA */}
                  <DailyChallengeCTACard
                    onViewChallenges={() => setShowDailyChallenges(true)}
                  />
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/50 text-xs text-slate-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <p>Seu progresso é atualizado em tempo real conforme você ganha XP</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showDailyChallenges && user?.id && (
        <DailyChallengesPanel
          studentId={user.id}
          onClose={() => setShowDailyChallenges(false)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
