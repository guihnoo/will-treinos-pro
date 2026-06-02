"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, Clock3, AlertTriangle, DollarSign, Circle } from "lucide-react";
import type { Student, Payment, PaymentStatus } from "@/context/types";
import { usePayments } from "@/context/PaymentsContext";
import { MODAL_OVERLAY_FADE, PRESS_SCALE, SPRING_PREMIUM } from "@/components/ui/motionTokens";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";

interface Props {
  student: Student;
  onClose: () => void;
}

interface PaymentRow {
  id: string;
  referenceMonth: string; // "2026-05"
  status: PaymentStatus;
  amount: number;
  paidDate: string | null;
  dueDate: string;
}

function formatReferenceMonth(ref: string): string {
  // ref format can be "MAY/26" (legacy) or "2026-05" (ISO)
  if (/^\d{4}-\d{2}$/.test(ref)) {
    const [year, month] = ref.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
  }
  // Legacy format like "MAY/26"
  const monthMap: Record<string, string> = {
    JAN: "Jan", FEB: "Fev", MAR: "Mar", APR: "Abr", MAY: "Mai", JUN: "Jun",
    JUL: "Jul", AUG: "Ago", SEP: "Set", OCT: "Out", NOV: "Nov", DEC: "Dez",
  };
  const parts = ref.split("/");
  const abbr = parts[0]?.toUpperCase() ?? "";
  const yr = parts[1] ?? "";
  return `${monthMap[abbr] ?? abbr} ${yr ? `'${yr}` : ""}`.trim();
}

function currencyBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  paid: {
    label: "Pago",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  pending: {
    label: "Pendente",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  },
  late: {
    label: "Atrasado",
    className: "border-red-500/40 bg-red-500/10 text-red-300",
  },
};

export default function StudentFinanceSheet({ student, onClose }: Props) {
  const { markPayment } = usePayments();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { getSupabaseClient } = await import("@/lib/supabaseClient");
      const sb = getSupabaseClient();
      if (!sb) return;
      const { data } = await sb
        .from("payments")
        .select("id, reference_month, status, amount, paid_date, due_date")
        .eq("student_id", student.id)
        .order("reference_month", { ascending: false })
        .limit(12);

      if (data) {
        setRows(
          (data as Array<Record<string, unknown>>).map((r) => ({
            id: r.id as string,
            referenceMonth: (r.reference_month ?? r.reference ?? "") as string,
            status: r.status as PaymentStatus,
            amount: (r.amount ?? 0) as number,
            paidDate: (r.paid_date ?? null) as string | null,
            dueDate: (r.due_date ?? "") as string,
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [student.id]);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments]);

  const handleMarkPayment = async (paymentId: string) => {
    setMarkingId(paymentId);
    try {
      await markPayment(paymentId);
      // Optimistic update
      setRows((prev) =>
        prev.map((r) =>
          r.id === paymentId
            ? { ...r, status: "paid", paidDate: new Date().toISOString().slice(0, 10) }
            : r,
        ),
      );
    } finally {
      setMarkingId(null);
    }
  };

  const kpi = {
    paid: rows.filter((r) => r.status === "paid").length,
    late: rows.filter((r) => r.status === "late").length,
    totalReceived: rows
      .filter((r) => r.status === "paid")
      .reduce((s, r) => s + r.amount, 0),
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      data-modal-overlay
      aria-label={`Financeiro de ${student.name}`}
      className={`fixed inset-0 z-[230] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/85`}
      {...MODAL_OVERLAY_FADE}
      onClick={onClose}
    >
      <div className={`${MODAL_OVERLAY_CENTER_WRAP} px-3 text-left sm:px-6`}>
        <motion.section
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={SPRING_PREMIUM}
          onClick={(e) => e.stopPropagation()}
          className={`my-auto w-full max-w-xl rounded-3xl border border-white/[0.1] bg-zinc-950/95 shadow-[0_35px_120px_rgba(0,0,0,0.8)] backdrop-blur-3xl ${MODAL_PANEL_COLUMN}`}
        >
          {/* Header */}
          <div className="shrink-0 border-b border-zinc-800/70 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]">
                  Ficha Financeira
                </p>
                <h3 className="mt-0.5 text-base font-black text-white">{student.name}</h3>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Plano: <span className="text-zinc-300 font-semibold">{student.plan || "—"}</span>
                  {student.monthlyValue ? (
                    <>
                      {" · "}
                      <span className="text-[#EAB308] font-bold">
                        {currencyBRL(student.monthlyValue)}/mês
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              <motion.button
                whileTap={PRESS_SCALE}
                type="button"
                onClick={onClose}
                data-testid="btn-close-finance-sheet"
                className="min-h-10 min-w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-zinc-300" />
              </motion.button>
            </div>

            {/* KPI Strip */}
            {!loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-3 grid grid-cols-3 gap-2"
              >
                {[
                  {
                    icon: CheckCircle2,
                    label: "Em dia",
                    value: kpi.paid,
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/8 border-emerald-500/20",
                  },
                  {
                    icon: AlertTriangle,
                    label: "Atrasados",
                    value: kpi.late,
                    color: "text-red-400",
                    bg: "bg-red-500/8 border-red-500/20",
                  },
                  {
                    icon: DollarSign,
                    label: "Recebido",
                    value: currencyBRL(kpi.totalReceived),
                    color: "text-[#EAB308]",
                    bg: "bg-[#EAB308]/8 border-[#EAB308]/20",
                  },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                  <div
                    key={label}
                    className={`rounded-xl border px-2.5 py-2 text-center ${bg}`}
                  >
                    <Icon className={`mx-auto h-3.5 w-3.5 ${color}`} />
                    <p className={`mt-1 text-xs font-black ${color}`}>{value}</p>
                    <p className="text-[9px] text-zinc-500 font-medium">{label}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Body */}
          <div className={`${MODAL_BODY_SCROLL} px-5 py-4`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Circle className="h-6 w-6 animate-spin text-[#EAB308]" />
                <p className="text-xs text-zinc-500">Carregando histórico…</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <DollarSign className="h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">Nenhum registro financeiro encontrado.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {rows.map((row, i) => {
                    const cfg = STATUS_CONFIG[row.status];
                    const isPendingOrLate = row.status === "pending" || row.status === "late";
                    return (
                      <motion.div
                        key={row.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.04, type: "spring", stiffness: 280, damping: 22 }}
                        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/70 bg-black/30 px-3.5 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-white">
                            {formatReferenceMonth(row.referenceMonth)}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${cfg.className}`}
                            >
                              {row.status === "paid" && <CheckCircle2 className="h-2.5 w-2.5" />}
                              {row.status === "pending" && <Clock3 className="h-2.5 w-2.5" />}
                              {row.status === "late" && <AlertTriangle className="h-2.5 w-2.5" />}
                              {cfg.label}
                            </span>
                            {row.paidDate && (
                              <span className="text-[9px] text-zinc-600">
                                Pago em{" "}
                                {new Date(`${row.paidDate}T00:00:00`).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </span>
                            )}
                            {!row.paidDate && row.dueDate && (
                              <span className="text-[9px] text-zinc-600">
                                Vence{" "}
                                {new Date(`${row.dueDate}T00:00:00`).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <span className="text-[12px] font-black text-white">
                            {currencyBRL(row.amount)}
                          </span>
                          {isPendingOrLate && (
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              type="button"
                              disabled={markingId === row.id}
                              data-testid={`btn-mark-paid-${row.id}`}
                              onClick={() => handleMarkPayment(row.id)}
                              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-[9px] font-black text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
                            >
                              {markingId === row.id ? (
                                <Circle className="h-3 w-3 animate-spin" />
                              ) : (
                                "Pago"
                              )}
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
