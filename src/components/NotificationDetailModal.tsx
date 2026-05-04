"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, AlertTriangle, Clock, TrendingUp, MessageSquare, CheckCircle2, Megaphone, Star, Check, Archive } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStudents } from "@/context/StudentsContext";
import { useNotifications } from "@/context/NotificationsContext";
import type { Notification } from "@/context/types";
import { localDateISO } from "@/lib/dateUtils";

interface Props {
  notification: Notification | null;
  open: boolean;
  onClose: () => void;
}

interface ApprovalStep {
  studentId: string;
  stage: "confirm" | "notes" | "done";
  notes?: string;
}

const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  new_student: { icon: UserPlus, color: "#06B6D4", bg: "rgba(6,182,212,0.1)" },
  payment_late: { icon: AlertTriangle, color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  lesson_soon: { icon: Clock, color: "#EAB308", bg: "rgba(234,179,8,0.1)" },
  performance: { icon: TrendingUp, color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  message: { icon: MessageSquare, color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  broadcast: { icon: Megaphone, color: "#F97316", bg: "rgba(249,115,22,0.1)" },
};

export default function NotificationDetailModal({ notification, open, onClose }: Props) {
  const { user } = useAuth();
  const { students, approveStudent } = useStudents();
  const { markNotificationRead, markAllNotificationsRead } = useNotifications();
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalStep, setApprovalStep] = useState<ApprovalStep | null>(null);
  const [notesText, setNotesText] = useState("");

  // Mark as read when opened
  React.useEffect(() => {
    if (notification && open && !notification.read) {
      markNotificationRead(notification.id);
    }
  }, [open, notification?.id, notification?.read, markNotificationRead]);

  if (!notification) return null;

  const cfg = iconMap[notification.type] || iconMap.message;
  const Icon = cfg.icon;

  // Parse timestamp
  const notifDate = new Date(notification.time);
  const today = new Date();
  const isToday = notifDate.toDateString() === today.toDateString();
  const timeStr = isToday
    ? notifDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : notifDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  // Find related student if any
  const student = notification.studentId ? students.find(s => s.id === notification.studentId) : null;

  const handleStartApproval = () => {
    if (!student) return;
    setApprovalStep({ studentId: student.id, stage: "confirm" });
    setNotesText("");
  };

  const handleApproveStudent = async () => {
    if (!student || !approvalStep) return;

    if (approvalStep.stage === "confirm") {
      setApprovalStep({ ...approvalStep, stage: "notes" });
      return;
    }

    if (approvalStep.stage === "notes") {
      setActionLoading(true);
      try {
        approveStudent(student.id);
        setApprovalStep({ ...approvalStep, stage: "done" });
        setTimeout(() => {
          setApprovalStep(null);
          onClose();
        }, 1500);
      } catch (error) {
        console.error("Erro ao aprovar aluno:", error);
        setActionLoading(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          data-modal-overlay
          aria-label={notification.title}
          className="fixed inset-0 z-[200] overflow-y-auto overscroll-y-contain bg-black/60 backdrop-blur-sm flex items-end sm:items-center sm:justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-gradient-to-b from-[#0A0A0A] to-[#050505] border border-zinc-800 sm:rounded-2xl flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-zinc-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cfg.bg }}
                >
                  <Icon className="w-6 h-6" style={{ color: cfg.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-white text-sm truncate">{notification.title}</h2>
                  <p className="text-xs text-zinc-500">{timeStr}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Message */}
              <p className="text-sm text-zinc-300 leading-relaxed">{notification.message}</p>

              {/* Student Info (if new_student notification) */}
              {notification.type === "new_student" && student && (
                <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-4 space-y-3">
                  <h3 className="text-xs font-bold text-[#EAB308] uppercase tracking-wide">Novo Aluno</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Nome:</span>
                      <span className="text-white font-medium">{student.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Email:</span>
                      <span className="text-white font-mono text-xs">{student.email}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Telefone:</span>
                        <span className="text-white font-mono">{student.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Status:</span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300">
                        <Clock className="w-3 h-3" />
                        Aguardando aprovação
                      </span>
                    </div>
                    {student.joinedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Inscrição:</span>
                        <span className="text-white text-xs">{new Date(student.joinedAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Late Payment Info */}
              {notification.type === "payment_late" && student && (
                <div className="rounded-xl border border-zinc-700 bg-red-900/20 p-4 space-y-2">
                  <h3 className="text-xs font-bold text-red-400 uppercase tracking-wide">Pagamento Atrasado</h3>
                  <p className="text-sm text-zinc-300">
                    <strong>{student.name}</strong> tem cobrança pendente há mais de 3 dias.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-red-400 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    Ação recomendada: Cobrar ou paralisar acesso
                  </div>
                </div>
              )}

              {/* Performance Feedback */}
              {notification.type === "performance" && student && (
                <div className="rounded-xl border border-zinc-700 bg-green-900/20 p-4 space-y-2">
                  <h3 className="text-xs font-bold text-green-400 uppercase tracking-wide">Feedback de Desempenho</h3>
                  <p className="text-sm text-zinc-300">
                    Você tem novo feedback técnico. {student.name} aguarda sua avaliação.
                  </p>
                </div>
              )}

              {/* Global Broadcast */}
              {notification.isGlobal && (
                <div className="rounded-xl border border-zinc-700 bg-orange-900/20 p-3">
                  <div className="flex items-center gap-2 text-xs text-orange-400 font-semibold">
                    <Megaphone className="w-4 h-4" />
                    Comunicado geral da equipe
                  </div>
                </div>
              )}
            </div>

            {/* Approval Flow */}
            {approvalStep && student && (
              <div className="border-t border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                {approvalStep.stage === "confirm" && (
                  <>
                    <p className="text-sm text-zinc-300">
                      Deseja aprovar <strong>{student.name}</strong> como novo aluno?
                    </p>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleApproveStudent}
                        disabled={actionLoading}
                        className="flex-1 bg-emerald-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition text-sm"
                      >
                        Continuar
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setApprovalStep(null)}
                        className="flex-1 border border-zinc-700 text-white font-semibold py-2 px-3 rounded-lg hover:bg-zinc-900/50 transition text-sm"
                      >
                        Cancelar
                      </motion.button>
                    </div>
                  </>
                )}

                {approvalStep.stage === "notes" && (
                  <>
                    <label className="block text-xs font-bold text-zinc-400 mb-2">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Ex: Grande potencial, trabalhar condicionamento..."
                      maxLength={500}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#EAB308] resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleApproveStudent}
                        disabled={actionLoading}
                        className="flex-1 bg-gradient-to-r from-[#EAB308] to-[#F97316] text-black font-bold py-2 px-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition text-sm"
                      >
                        {actionLoading ? "Aprovando..." : "Confirmar Aprovação"}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setApprovalStep(null)}
                        disabled={actionLoading}
                        className="flex-1 border border-zinc-700 text-white font-semibold py-2 px-3 rounded-lg hover:bg-zinc-900/50 transition text-sm disabled:opacity-50"
                      >
                        Voltar
                      </motion.button>
                    </div>
                  </>
                )}

                {approvalStep.stage === "done" && (
                  <div className="text-center py-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex w-12 h-12 rounded-full bg-emerald-500/20 items-center justify-center mb-2"
                    >
                      <Check className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                    <p className="text-sm font-semibold text-emerald-300">
                      {student.name} aprovado com sucesso!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions Footer */}
            {!approvalStep && (
              <div className="border-t border-zinc-800 bg-[#0A0A0A] p-4 flex gap-3 flex-shrink-0">
                {notification.type === "new_student" && student && user?.role === "admin" && (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStartApproval}
                      disabled={actionLoading}
                      className="flex-1 bg-gradient-to-r from-[#EAB308] to-[#F97316] text-black font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Revisar Aluno
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={onClose}
                      className="flex-1 border border-zinc-700 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-zinc-900/50 transition-colors text-sm"
                    >
                      Depois
                    </motion.button>
                  </>
                )}

                {notification.type !== "new_student" && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="w-full border border-zinc-700 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-zinc-900/50 transition-colors text-sm"
                  >
                    Fechar
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
