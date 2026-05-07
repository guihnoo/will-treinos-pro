"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface XPStats {
  totalValidated: number;
  totalFlagged: number;
  validationRate: number;
  topXPTypes: Array<{ type: string; count: number; points: number }>;
  studentCount: number;
  averageXPPerStudent: number;
  totalXPDistributed: number;
}

interface XPAnalyticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    evaluation: "Avaliação",
    checkin: "Check-in",
    social_like: "Curtida",
    social_comment: "Comentário",
    training_completed: "Treino Completo",
    achievement_unlock: "Desbloqueio",
  };
  return labels[type] || type;
};

const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    evaluation: "from-blue-500 to-cyan-500",
    checkin: "from-green-500 to-emerald-500",
    social_like: "from-red-500 to-pink-500",
    social_comment: "from-purple-500 to-indigo-500",
    training_completed: "from-orange-500 to-yellow-500",
    achievement_unlock: "from-violet-500 to-fuchsia-500",
  };
  return colors[type] || colors.evaluation;
};

export function XPAnalyticsPanel({ isOpen, onClose }: XPAnalyticsPanelProps) {
  const [stats, setStats] = useState<XPStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadStats = async () => {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        // Get all XP log entries
        const { data: xpData } = await supabase
          .from("xp_log")
          .select("points, type, validation_passed, student_id");

        if (!xpData) return;

        // Calculate stats
        const validated = xpData.filter((x) => x.validation_passed);
        const flagged = xpData.filter((x) => !x.validation_passed);

        const totalValidated = validated.reduce((sum, x) => sum + (x.points || 0), 0);
        const totalFlagged = flagged.length;
        const validationRate = xpData.length > 0 ? (validated.length / xpData.length) * 100 : 0;

        // Group by type
        const typeMap = new Map<string, { count: number; points: number }>();
        validated.forEach((x) => {
          const current = typeMap.get(x.type) || { count: 0, points: 0 };
          typeMap.set(x.type, {
            count: current.count + 1,
            points: current.points + (x.points || 0),
          });
        });

        const topXPTypes = Array.from(typeMap.entries())
          .map(([type, data]) => ({ type, ...data }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 6);

        // Count unique students
        const studentSet = new Set(xpData.map((x) => x.student_id));
        const studentCount = studentSet.size;
        const averageXPPerStudent = studentCount > 0 ? totalValidated / studentCount : 0;

        setStats({
          totalValidated,
          totalFlagged,
          validationRate,
          topXPTypes,
          studentCount,
          averageXPPerStudent,
          totalXPDistributed: totalValidated,
        });
      } catch (error) {
        console.error("XP Analytics error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [isOpen]);

  const maxPoints = useMemo(() => {
    if (!stats || stats.topXPTypes.length === 0) return 1;
    return Math.max(...stats.topXPTypes.map((t) => t.points));
  }, [stats]);

  return (
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
            className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">Análise de XP 📊</h2>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-slate-400">Carregando estatísticas...</div>
                </div>
              ) : stats ? (
                <div className="p-6 space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total XP */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-300">XP Distribuído</p>
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-3xl font-bold text-emerald-400">{stats.totalXPDistributed.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">{stats.studentCount} atletas</p>
                    </motion.div>

                    {/* Validation Rate */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-300">Taxa de Validação</p>
                        <CheckCircle className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-3xl font-bold text-blue-400">{stats.validationRate.toFixed(1)}%</p>
                      <p className="text-xs text-slate-500 mt-1">{Math.round(stats.totalFlagged)} sinalizados</p>
                    </motion.div>

                    {/* Average per Student */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/30 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-300">Média por Atleta</p>
                        <BarChart3 className="w-4 h-4 text-yellow-400" />
                      </div>
                      <p className="text-3xl font-bold text-yellow-400">{Math.round(stats.averageXPPerStudent)}</p>
                      <p className="text-xs text-slate-500 mt-1">XP por pessoa</p>
                    </motion.div>
                  </div>

                  {/* Top XP Sources */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Principais Fontes de XP</h3>
                    <div className="space-y-4">
                      {stats.topXPTypes.map((item, idx) => {
                        const percentage = (item.points / maxPoints) * 100;
                        return (
                          <motion.div
                            key={item.type}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{getTypeLabel(item.type)}</span>
                                <span className="text-xs text-slate-400">({item.count} eventos)</span>
                              </div>
                              <span className="text-sm font-semibold text-slate-200">{item.points} XP</span>
                            </div>
                            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ delay: 0.2 + idx * 0.05, duration: 0.8 }}
                                className={`h-full bg-gradient-to-r ${getTypeColor(item.type)} rounded-full`}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Validation Warnings */}
                  {stats.totalFlagged > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-orange-300">
                          {stats.totalFlagged} transação{stats.totalFlagged > 1 ? "s" : ""} sinalizada{stats.totalFlagged > 1 ? "s" : ""}
                        </p>
                        <p className="text-sm text-orange-200/70">
                          Revise na dashboard de Moderação de XP para aprovação ou rejeição
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
