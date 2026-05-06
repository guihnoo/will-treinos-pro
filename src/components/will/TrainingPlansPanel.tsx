"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import type { TrainingPlan, Student } from "@/context/types";
import { useTrainingPlanMutations } from "@/hooks/useTrainingPlanMutations";
import UserAvatar from "@/components/ui/UserAvatar";
import { SPRING_PREMIUM, PRESS_SCALE } from "@/components/ui/motionTokens";

interface TrainingPlansPanelProps {
  plans: TrainingPlan[];
  students: Student[];
  onClose: () => void;
  onSelectPlan?: (plan: TrainingPlan) => void;
}

const STATUS_COLORS = {
  active: "text-emerald-400 bg-emerald-400/10",
  paused: "text-amber-400 bg-amber-400/10",
  completed: "text-sky-400 bg-sky-400/10",
  archived: "text-zinc-500 bg-zinc-500/10",
};

const STATUS_LABELS = {
  active: "Ativo",
  paused: "Pausado",
  completed: "Completo",
  archived: "Arquivado",
};

export default function TrainingPlansPanel({
  plans,
  students,
  onClose,
  onSelectPlan,
}: TrainingPlansPanelProps) {
  const { updatePlan, deletePlan } = useTrainingPlanMutations();
  const [filter, setFilter] = useState<"all" | "active" | "paused">("active");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const filteredPlans = useMemo(() => {
    if (filter === "all") return plans;
    return plans.filter((p) => p.status === filter);
  }, [plans, filter]);

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.name || "—";
  };

  const getStudentAvatar = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.avatar || "";
  };

  const handleToggleStatus = async (plan: TrainingPlan) => {
    const newStatus = plan.status === "active" ? "paused" : "active";
    await updatePlan(plan.id, { status: newStatus });
  };

  const handleDelete = async (planId: string) => {
    if (confirm("Deseja deletar este plano de treino?")) {
      await deletePlan(planId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={SPRING_PREMIUM}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-2xl max-h-[80vh] flex flex-col bg-gradient-to-br from-black via-zinc-950 to-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Planos de Treino</h2>
            <p className="text-xs text-zinc-500 mt-1">
              {filteredPlans.length} plano{filteredPlans.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-black/30 shrink-0">
          {(["all", "active", "paused"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                filter === f
                  ? "bg-[#EAB308]/20 text-[#EAB308]"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Pausados"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {filteredPlans.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Nenhum plano de treino</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              <AnimatePresence>
                {filteredPlans.map((plan) => {
                  const student = students.find((s) => s.id === plan.studentId);
                  const startDate = new Date(plan.startDate);
                  const daysActive = Math.floor(
                    (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
                  );

                  return (
                    <motion.button
                      key={plan.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      whileHover={{ y: -2 }}
                      whileTap={PRESS_SCALE}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        onSelectPlan?.(plan);
                      }}
                      className="w-full text-left p-3 rounded-xl border border-white/5 hover:border-white/10 bg-black/40 hover:bg-black/60 transition"
                    >
                      <div className="flex items-start gap-3">
                        <UserAvatar
                          photo={getStudentAvatar(plan.studentId)}
                          name={getStudentName(plan.studentId)}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-white truncate">
                              {plan.title}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                STATUS_COLORS[plan.status]
                              }`}
                            >
                              {STATUS_LABELS[plan.status]}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 mb-2">
                            {getStudentName(plan.studentId)} •{" "}
                            {startDate.toLocaleDateString("pt-BR")} •{" "}
                            <span className="text-zinc-400">{daysActive}d</span>
                          </p>
                          {plan.description && (
                            <p className="text-xs text-zinc-400 line-clamp-1">
                              {plan.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(plan);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition"
                            title={
                              plan.status === "active"
                                ? "Pausar plano"
                                : "Retomar plano"
                            }
                          >
                            {plan.status === "active" ? (
                              <Pause className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(plan.id);
                            }}
                            className="p-1.5 hover:bg-red-500/20 rounded-lg transition"
                            title="Deletar plano"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-white/5 bg-black/50 shrink-0">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#EAB308]/20 text-[#EAB308] hover:bg-[#EAB308]/30 text-xs font-bold uppercase tracking-wider transition">
            <Plus className="w-3.5 h-3.5" />
            Novo Plano
          </button>
        </div>
      </div>
    </motion.div>
  );
}
