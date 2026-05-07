"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle, Trash2, Eye } from "lucide-react";
import type { XPLog } from "@/context/types";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";

interface XPModerationRecord extends XPLog {
  studentName?: string;
  studentEmail?: string;
  flagReason?: string;
}

interface XPModerationPanelProps {
  onClose: () => void;
}

export default function XPModerationPanel({ onClose }: XPModerationPanelProps) {
  const supabase = getSupabaseClient();
  const { toast } = useToast();

  const [records, setRecords] = useState<XPModerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<XPModerationRecord | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Load flagged transactions
  useEffect(() => {
    const loadFlaggedRecords = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Fetch invalid transactions (validation_passed = false)
      const { data: xpLogs, error: xpError } = await supabase
        .from("xp_log")
        .select("*")
        .eq("validation_passed", false)
        .order("created_at", { ascending: false })
        .limit(100);

      if (xpError) {
        console.error("[XPModerationPanel] Failed to load records:", xpError);
        toast("Erro ao carregar transações");
        setLoading(false);
        return;
      }

      // Enrich with student info
      if (xpLogs) {
        const enriched = await Promise.all(
          xpLogs.map(async (log) => {
            let student = null;
            try {
              const { data } = await supabase
                .from("students")
                .select("name, email")
                .eq("auth_user_id", log.student_id)
                .single();
              student = data;
            } catch (err) {
              // Student not found, use null
            }

            return {
              ...log,
              studentName: student?.name || log.student_id,
              studentEmail: student?.email,
              flagReason: log.validation_notes,
            };
          })
        );

        setRecords(enriched);
      }

      setLoading(false);
    };

    loadFlaggedRecords();
  }, [supabase, toast]);

  // Approve transaction (override validation)
  const handleApprove = async (record: XPModerationRecord) => {
    if (!supabase || !actionReason.trim()) {
      toast("Digite um motivo para aprovação");
      return;
    }

    setProcessing(true);

    try {
      // Update xp_log to mark as valid + store coach's reason
      const { error } = await supabase
        .from("xp_log")
        .update({
          validation_passed: true,
          validation_notes: `APROVADO: ${actionReason}`,
        })
        .eq("id", record.id);

      if (error) throw error;

      // Remove from displayed list
      setRecords(records.filter((r) => r.id !== record.id));
      setSelectedRecord(null);
      setActionReason("");

      toast(`✅ ${record.studentName} - ${record.points} XP aprovado`);
    } catch (err) {
      console.error("[XPModerationPanel] Approval failed:", err);
      toast("Erro ao aprovar transação");
    } finally {
      setProcessing(false);
    }
  };

  // Reject transaction (delete from log)
  const handleReject = async (record: XPModerationRecord) => {
    if (!supabase || !actionReason.trim()) {
      toast("Digite um motivo para rejeição");
      return;
    }

    setProcessing(true);

    try {
      // Delete xp_log entry
      const { error } = await supabase
        .from("xp_log")
        .delete()
        .eq("id", record.id);

      if (error) throw error;

      // Remove from displayed list
      setRecords(records.filter((r) => r.id !== record.id));
      setSelectedRecord(null);
      setActionReason("");

      toast(`❌ ${record.studentName} - Transação rejeitada`);
    } catch (err) {
      console.error("[XPModerationPanel] Rejection failed:", err);
      toast("Erro ao rejeitar transação");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 pointer-events-auto"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full sm:w-[700px] max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-700">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-400" />
            Moderação de XP
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="close"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-gray-400 text-center py-8">Carregando...</p>
          ) : records.length === 0 ? (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-300 font-semibold">Sem transações bloqueadas</p>
              <p className="text-sm text-gray-500">Todas as transações estão validadas!</p>
            </motion.div>
          ) : selectedRecord ? (
            // Detail view
            <motion.div
              key={selectedRecord.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1"
              >
                ← Voltar
              </button>

              {/* Record Details */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-400">Aluno</p>
                    <p className="text-lg font-semibold text-white">
                      {selectedRecord.studentName}
                    </p>
                    {selectedRecord.studentEmail && (
                      <p className="text-xs text-gray-500">{selectedRecord.studentEmail}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">XP Questionável</p>
                    <p className="text-2xl font-black text-red-400">
                      {selectedRecord.points} XP
                    </p>
                  </div>
                </div>

                <hr className="border-zinc-700" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Tipo</p>
                    <p className="text-sm font-semibold text-white capitalize">
                      {selectedRecord.type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Multiplicador</p>
                    <p className="text-sm font-semibold text-white">
                      {selectedRecord.multiplierType} ×{selectedRecord.multiplierValue}
                    </p>
                  </div>
                </div>

                {selectedRecord.description && (
                  <div>
                    <p className="text-xs text-gray-400">Descrição</p>
                    <p className="text-sm text-gray-300">{selectedRecord.description}</p>
                  </div>
                )}

                {selectedRecord.flagReason && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                    <p className="text-xs text-red-300 font-semibold mb-1">Motivo da Rejeição:</p>
                    <p className="text-sm text-red-200">{selectedRecord.flagReason}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-400">Data</p>
                  <p className="text-sm text-gray-300">
                    {new Date(selectedRecord.createdAt || "").toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>

              {/* Action Section */}
              <div className="space-y-3">
                <textarea
                  placeholder="Motivo da sua decisão (obrigatório)..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none h-20 focus:outline-none focus:border-blue-500"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(selectedRecord)}
                    disabled={!actionReason.trim() || processing}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleReject(selectedRecord)}
                    disabled={!actionReason.trim() || processing}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Rejeitar
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            // List view
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-sm text-gray-400 mb-4">
                {records.length} transação{records.length !== 1 ? "s" : ""} bloqueada{records.length !== 1 ? "s" : ""}
              </p>

              <AnimatePresence>
                {records.map((record, idx) => (
                  <motion.button
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.05 }}
                    className="w-full bg-zinc-800/50 hover:bg-zinc-800 border border-red-500/30 hover:border-red-500/60 rounded-lg p-4 text-left transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                          <p className="font-semibold text-white truncate">
                            {record.studentName}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          {record.type.replace(/_/g, " ")} · +{record.points} XP
                        </p>
                        <p className="text-xs text-red-300 line-clamp-2">
                          {record.flagReason || "Sem motivo"}
                        </p>
                      </div>
                      <Eye className="h-4 w-4 text-gray-500 group-hover:text-gray-300 flex-shrink-0 ml-2 transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        {records.length > 0 && !selectedRecord && (
          <div className="border-t border-zinc-700 bg-zinc-800/50 p-3 text-xs text-gray-400 text-center">
            Clique em uma transação para revisar e aprovar/rejeitar
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
