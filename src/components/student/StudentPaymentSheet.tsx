"use client";

import React, { useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Paperclip,
  Send,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  QrCode,
  Calendar,
  Banknote,
  Sparkles,
  ShieldCheck,
  Zap,
  Info,
} from "lucide-react";
import QRCode from "react-qr-code";
import { generatePixPayload } from "@/lib/pixUtils";
import { usePayments } from "@/context/PaymentsContext";
import { useAppConfig } from "@/context/AppConfigContext";
import { useAuth } from "@/context/AuthContext";
import { useStudents } from "@/context/StudentsContext";
import { useToast } from "@/components/Toast";
import { resolveStudentCrmId } from "@/lib/resolveStudentCrmId";
import { triggerHapticCelebration, triggerHapticImpact } from "@/lib/hapticFeedback";
import { FOCUS_RING_GOLD } from "@/components/ui/interactionTokens";

function currencyBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusLabel(status: string) {
  if (status === "paid") return { text: "Pago", color: "#22C55E", bg: "bg-emerald-500/10 border-emerald-500/30" };
  if (status === "late") return { text: "Em atraso", color: "#EF4444", bg: "bg-red-500/10 border-red-500/30" };
  return { text: "Pendente", color: "#EAB308", bg: "bg-amber-500/10 border-amber-500/30" };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function StudentPaymentSheet({ open, onClose }: Props) {
  const { user } = useAuth();
  const { students } = useStudents();
  const { payments, submitStudentPaymentProof, currentMonthReference } = usePayments();
  const { appConfig } = useAppConfig();
  const { toast } = useToast();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [methodTab, setMethodTab] = useState<Record<string, "pix" | "dinheiro">>({});
  const [proofNote, setProofNote] = useState<Record<string, string>>({});
  const [proofFile, setProofFile] = useState<
    Record<string, { file: File; previewUrl: string; fileName: string; mime: string } | null>
  >({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Mapeia o aluno logado para o registro no CRM
  const studentCrmId = useMemo(() => resolveStudentCrmId(user, students), [user, students]);

  const currentStudent = useMemo(
    () => students.find((s) => s.id === studentCrmId),
    [students, studentCrmId],
  );

  const myPayments = useMemo(
    () =>
      payments
        .filter((p) => p.studentId === studentCrmId || p.studentId === user?.id)
        .sort((a, b) => b.reference.localeCompare(a.reference)),
    [payments, studentCrmId, user?.id],
  );

  const currentPayment = useMemo(
    () => myPayments.find((p) => p.reference === currentMonthReference),
    [myPayments, currentMonthReference],
  );

  // Diagnóstico do Hero Card
  const heroStatus = useMemo(() => {
    const hasLate = myPayments.some((p) => p.status === "late");
    if (hasLate) {
      return {
        label: "Mensalidade Vencida",
        tone: "red" as const,
        icon: AlertTriangle,
        badgeClass: "bg-red-500/15 border-red-500/40 text-red-400",
        cardBorder: "border-red-500/30 bg-gradient-to-br from-red-950/20 via-zinc-950 to-zinc-950",
        message: "Há uma mensalidade em aberto após o vencimento. Regularize para manter seu acesso sem interrupções.",
      };
    }

    const pending = myPayments.find((p) => p.status === "pending");
    if (pending) {
      const now = new Date();
      const due = new Date(pending.dueDate + "T23:59:59");
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 3) {
        return {
          label: "Vence em Breve",
          tone: "amber" as const,
          icon: Clock,
          badgeClass: "bg-amber-500/15 border-amber-500/40 text-amber-400",
          cardBorder: "border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-zinc-950 to-zinc-950",
          message: `Sua mensalidade vence em ${diffDays <= 0 ? "hoje" : `${diffDays} dia(s)`}. Efetue o pagamento abaixo.`,
        };
      }

      return {
        label: "Mensalidade Pendente",
        tone: "amber" as const,
        icon: Clock,
        badgeClass: "bg-amber-500/15 border-amber-500/40 text-amber-400",
        cardBorder: "border-zinc-800 bg-zinc-950/80",
        message: `Vencimento programado para ${new Date(pending.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}.`,
      };
    }

    return {
      label: "Mensalidade em Dia",
      tone: "emerald" as const,
      icon: ShieldCheck,
      badgeClass: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
      cardBorder: "border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-zinc-950 to-zinc-950",
      message: "Todas as suas mensalidades estão quitadas. Parabéns pela dedicação aos treinos!",
    };
  }, [myPayments]);

  const hasPixKey = Boolean(appConfig.pixKey?.trim());
  const [showQR, setShowQR] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const pixLabel =
    appConfig.pixKeyType === "cpf"
      ? "CPF"
      : appConfig.pixKeyType === "telefone"
      ? "Telefone"
      : appConfig.pixKeyType === "aleatoria"
      ? "Chave aleatória"
      : "E-mail";

  // Gera payload EMV/BR Code para QR Code real — usa valor da mensalidade pendente se disponível
  const pixPayload = useMemo(() => {
    if (!appConfig.pixKey?.trim()) return "";
    return generatePixPayload({
      pixKey: appConfig.pixKey.trim(),
      merchantName: appConfig.pixOwnerName || "WILL TREINOS PRO",
      merchantCity: "SAO PAULO",
      amount: currentPayment?.amount,
      txId: currentPayment ? `WT${currentPayment.reference.replace("-", "")}` : "***",
    });
  }, [appConfig.pixKey, appConfig.pixOwnerName, currentPayment]);

  const handleCopyPix = () => {
    const value = pixPayload || appConfig.pixKey;
    if (!value) return;
    void navigator.clipboard.writeText(value);
    setPixCopied(true);
    triggerHapticImpact();
    setTimeout(() => setPixCopied(false), 2000);
    toast("Código PIX copiado com sucesso!");
  };

  const handleFileChange = (paymentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast("Arquivo muito grande. Máximo 8 MB.", "error");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast("Formato inválido. Use JPG, PNG, WebP ou PDF.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProofFile((prev) => ({
        ...prev,
        [paymentId]: { file, previewUrl: reader.result as string, fileName: file.name, mime: file.type },
      }));
      triggerHapticImpact();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmitPixProof = async (paymentId: string) => {
    const note = proofNote[paymentId]?.trim() ?? "";
    const attachment = proofFile[paymentId] ?? null;
    if (!note && !attachment) {
      toast("Adicione uma nota ou anexe o comprovante.", "error");
      return;
    }
    setSubmitting(paymentId);
    try {
      submitStudentPaymentProof(paymentId, { note, attachment });
      triggerHapticCelebration();
      toast("Comprovante enviado! O Will foi notificado e vai revisar em breve.");
      setProofNote((p) => {
        const n = { ...p };
        delete n[paymentId];
        return n;
      });
      setProofFile((p) => {
        const n = { ...p };
        delete n[paymentId];
        return n;
      });
      setExpandedId(null);
    } finally {
      setSubmitting(null);
    }
  };

  const handleDeclareCashPayment = async (paymentId: string) => {
    setSubmitting(paymentId);
    try {
      submitStudentPaymentProof(paymentId, {
        note: "💵 Aviso do Aluno: Pagamento será realizado em dinheiro no próximo treino na quadra.",
        attachment: null,
      });
      triggerHapticCelebration();
      toast("Aviso enviado ao Will! O pagamento será registrado na quadra.");
      setExpandedId(null);
    } finally {
      setSubmitting(null);
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
          aria-label="Meus Pagamentos"
          className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/85 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto w-full max-w-2xl rounded-t-3xl border-t border-zinc-800 bg-[#0A0A0A] shadow-[0_-24px_80px_rgba(0,0,0,0.8)] max-h-[92dvh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex-shrink-0 pt-3 pb-1 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-zinc-900">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#EAB308]" />
                  Meus Pagamentos
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Referência: <span className="font-semibold text-zinc-300">{currentMonthReference}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-900 transition ${FOCUS_RING_GOLD}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {/* CARD HERO — Situação Financeira do Aluno */}
              <div className={`rounded-2xl border p-4.5 ${heroStatus.cardBorder} shadow-lg transition-all`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${heroStatus.badgeClass}`}
                  >
                    <heroStatus.icon className="h-3.5 w-3.5" />
                    {heroStatus.label}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-400">
                    Plano: <span className="text-white font-bold">{currentStudent?.plan?.toUpperCase() || "MENSAL"}</span>
                  </span>
                </div>

                {/* Métricas do Aluno acordadas com o treinador */}
                <div className="grid grid-cols-2 gap-3 pt-1 pb-2">
                  <div className="rounded-xl border border-zinc-800/80 bg-black/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Banknote className="h-3.5 w-3.5 text-[#EAB308]" />
                      Valor da Mensalidade
                    </p>
                    <p className="text-lg font-black text-white mt-0.5">
                      {currentStudent?.monthlyValue
                        ? currencyBRL(currentStudent.monthlyValue)
                        : currentPayment
                        ? currencyBRL(currentPayment.amount)
                        : "A combinar"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-black/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#EAB308]" />
                      Dia de Pagamento
                    </p>
                    <p className="text-lg font-black text-white mt-0.5">
                      {currentStudent?.paymentDay ? `Dia ${currentStudent.paymentDay}` : "Definir com Coach"}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 flex items-start gap-1.5 mt-1 border-t border-zinc-800/60 pt-2.5">
                  <Info className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500 mt-0.5" />
                  <span>{heroStatus.message}</span>
                </p>
              </div>

              {/* PIX Master Banner */}
              {hasPixKey && (
                <div className="rounded-2xl border border-[#EAB308]/30 bg-[#EAB308]/6 p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-400">
                      <Zap className="h-3 w-3 fill-current" />
                      PIX WILL TREINOS
                    </span>
                    <p className="text-[10px] font-bold text-[#EAB308]">{pixLabel}</p>
                    {currentPayment && (
                      <span className="ml-auto text-[10px] font-black text-white">
                        {currencyBRL(currentPayment.amount)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="flex-1 min-w-0 truncate text-sm font-bold text-white font-mono">{appConfig.pixKey}</p>
                    <button
                      onClick={() => {
                        setShowQR((v) => !v);
                        triggerHapticImpact();
                      }}
                      data-testid="pix-toggle-qr"
                      className="flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-[11px] font-bold text-zinc-300 hover:text-white transition"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      {showQR ? "Fechar" : "QR Code"}
                    </button>
                    <button
                      onClick={handleCopyPix}
                      data-testid="pix-copy-btn"
                      className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-[#EAB308]/40 bg-[#EAB308]/15 px-3 py-2 text-[11px] font-bold text-[#EAB308] hover:bg-[#EAB308]/25 transition ${FOCUS_RING_GOLD}`}
                    >
                      {pixCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {pixCopied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>

                  {/* QR Code PIX */}
                  <AnimatePresence>
                    {showQR && pixPayload && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col items-center gap-3 pt-4">
                          <div className="p-4 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                            <QRCode value={pixPayload} size={200} level="M" bgColor="#FFFFFF" fgColor="#000000" />
                          </div>
                          <p className="text-[11px] text-zinc-400 text-center font-medium">
                            Escaneie com o app do seu banco para pagar instantaneamente
                          </p>

                          <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                              Código PIX Copia e Cola
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono break-all line-clamp-2">
                              {pixPayload.slice(0, 60)}…
                            </p>
                            <button
                              onClick={handleCopyPix}
                              data-testid="pix-copy-code-btn"
                              className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#EAB308]/30 bg-[#EAB308]/10 py-1.5 text-[10px] font-bold text-[#EAB308] hover:bg-[#EAB308]/20 transition ${FOCUS_RING_GOLD}`}
                            >
                              {pixCopied ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              {pixCopied ? "Código copiado!" : "Copiar código completo"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Lista de Faturas / Mensalidades */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 px-1">
                  Histórico de Cobranças
                </h3>

                {myPayments.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center rounded-2xl border border-zinc-900 bg-zinc-950/40">
                    <CreditCard className="h-10 w-10 text-zinc-700" />
                    <p className="text-sm font-semibold text-zinc-400">Nenhuma cobrança registrada ainda.</p>
                    <p className="text-[11px] text-zinc-600 max-w-xs">
                      O treinador irá lançar sua mensalidade conforme os dias e valores acordados.
                    </p>
                  </div>
                ) : (
                  myPayments.map((payment) => {
                    const st = statusLabel(payment.status);
                    const isExpanded = expandedId === payment.id;
                    const proofSubmitted = Boolean(payment.studentProofSubmittedAt);
                    const isCashNotice =
                      payment.studentProofNote?.toLowerCase().includes("dinheiro") || false;
                    const note = proofNote[payment.id] ?? "";
                    const file = proofFile[payment.id];
                    const activeTab = methodTab[payment.id] || "pix";

                    return (
                      <div
                        key={payment.id}
                        className={`rounded-2xl border transition-all ${
                          isExpanded
                            ? "border-[#EAB308]/50 bg-zinc-950 shadow-[0_4px_24px_rgba(234,179,8,0.08)]"
                            : "border-zinc-800/80 bg-zinc-950/60"
                        } overflow-hidden`}
                      >
                        {/* Linha Principal da Fatura */}
                        <div className="flex items-center gap-3 p-3.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${st.bg}`}
                                style={{ color: st.color }}
                              >
                                {st.text}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-400 font-semibold">
                                {payment.reference}
                              </span>
                            </div>
                            <p className="text-base font-black text-white">{currencyBRL(payment.amount)}</p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              Vencimento:{" "}
                              <span className="text-zinc-300 font-semibold">
                                {new Date(payment.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}
                              </span>
                            </p>
                          </div>

                          {/* Ação ou Status */}
                          {payment.status === "paid" ? (
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-black text-xs">
                                <CheckCircle2 className="h-4 w-4" />
                                Quitado
                              </span>
                              <span className="text-[10px] text-zinc-600 font-medium">
                                {payment.paidDate
                                  ? new Date(payment.paidDate + "T12:00:00").toLocaleDateString("pt-BR")
                                  : "Confirmado"}
                              </span>
                            </div>
                          ) : proofSubmitted ? (
                            <div className="flex flex-shrink-0 flex-col items-end gap-0.5 text-right">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                                <Clock className="h-3.5 w-3.5" />
                                Aguardando
                              </span>
                              <button
                                onClick={() => {
                                  setExpandedId(isExpanded ? null : payment.id);
                                  triggerHapticImpact();
                                }}
                                className="text-[10px] text-zinc-500 underline hover:text-zinc-300 transition"
                              >
                                {isExpanded ? "Ocultar" : "Ver aviso"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setExpandedId(isExpanded ? null : payment.id);
                                triggerHapticImpact();
                              }}
                              className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-[#EAB308]/60 bg-gradient-to-r from-[#EAB308]/20 to-[#EAB308]/10 px-3.5 py-2.5 text-xs font-black text-[#EAB308] hover:bg-[#EAB308]/30 transition shadow-[0_0_15px_rgba(234,179,8,0.15)] ${FOCUS_RING_GOLD}`}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              {isExpanded ? "Fechar" : "Pagar Agora"}
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Banner de Aviso/Comprovante Pendente */}
                        {proofSubmitted && payment.status !== "paid" && (
                          <div className="mx-3.5 mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                            <div className="flex items-center gap-2">
                              {isCashNotice ? (
                                <Banknote className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <Clock className="h-4 w-4 text-amber-400" />
                              )}
                              <p className="text-xs font-bold text-amber-300">
                                {isCashNotice
                                  ? "Aviso de pagamento em dinheiro registrado"
                                  : "Comprovante enviado para conferência"}
                              </p>
                            </div>
                            {payment.studentProofNote && (
                              <p className="text-[11px] text-zinc-300 mt-1 pl-6">
                                "{payment.studentProofNote}"
                              </p>
                            )}
                            <p className="text-[10px] text-zinc-500 mt-1 pl-6">
                              Registrado em{" "}
                              {new Date(payment.studentProofSubmittedAt!).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        )}

                        {/* Formulário Expansível de Autodeclaração de Pagamento */}
                        <AnimatePresence>
                          {isExpanded && payment.status !== "paid" && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3.5 pb-4 space-y-3.5 border-t border-zinc-800/80 pt-3.5">
                                {/* Seletor de Modo: PIX vs Dinheiro */}
                                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMethodTab((prev) => ({ ...prev, [payment.id]: "pix" }));
                                      triggerHapticImpact();
                                    }}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                                      activeTab === "pix"
                                        ? "bg-[#EAB308] text-black shadow-md"
                                        : "text-zinc-400 hover:text-white"
                                    }`}
                                  >
                                    <Zap className="h-3.5 w-3.5" />
                                    PIX (Recomendado)
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMethodTab((prev) => ({ ...prev, [payment.id]: "dinheiro" }));
                                      triggerHapticImpact();
                                    }}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                                      activeTab === "dinheiro"
                                        ? "bg-emerald-500 text-black shadow-md"
                                        : "text-zinc-400 hover:text-white"
                                    }`}
                                  >
                                    <Banknote className="h-3.5 w-3.5" />
                                    Dinheiro na Quadra
                                  </button>
                                </div>

                                {activeTab === "pix" ? (
                                  /* Fluxo PIX */
                                  <div className="space-y-3 pt-1">
                                    {hasPixKey && (
                                      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                                        <p className="flex-1 min-w-0 truncate text-xs text-zinc-300">
                                          Chave PIX: <span className="text-white font-mono font-bold">{appConfig.pixKey}</span>
                                        </p>
                                        <button
                                          onClick={handleCopyPix}
                                          data-testid="pix-copy-inline-btn"
                                          className={`flex-shrink-0 text-xs text-[#EAB308] font-bold flex items-center gap-1 ${FOCUS_RING_GOLD}`}
                                        >
                                          {pixCopied ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                          ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                          )}
                                          Copiar
                                        </button>
                                      </div>
                                    )}

                                    {/* Nota do Pagamento */}
                                    <div>
                                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        Nota ou TXID da transferência (Opcional)
                                      </label>
                                      <textarea
                                        rows={2}
                                        value={note}
                                        onChange={(e) =>
                                          setProofNote((p) => ({ ...p, [payment.id]: e.target.value }))
                                        }
                                        placeholder="Ex: PIX enviado via Banco Inter, titular Fulano..."
                                        className={`mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-[#EAB308]/60 focus:outline-none ${FOCUS_RING_GOLD}`}
                                      />
                                    </div>

                                    {/* Upload do Arquivo */}
                                    <div>
                                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        Foto ou PDF do Comprovante
                                      </label>
                                      <input
                                        ref={(el) => {
                                          fileInputRefs.current[payment.id] = el;
                                        }}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,application/pdf"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(payment.id, e)}
                                      />

                                      {file ? (
                                        <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-3 py-2">
                                          {file.mime.startsWith("image/") ? (
                                            <img
                                              src={file.previewUrl}
                                              alt="preview"
                                              className="h-8 w-8 rounded-lg object-cover border border-zinc-700 flex-shrink-0"
                                            />
                                          ) : (
                                            <ImageIcon className="h-6 w-6 text-zinc-500 flex-shrink-0" />
                                          )}
                                          <p className="flex-1 min-w-0 truncate text-xs text-zinc-200">
                                            {file.fileName}
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setProofFile((p) => {
                                                const n = { ...p };
                                                delete n[payment.id];
                                                return n;
                                              })
                                            }
                                            className={`p-1 text-zinc-500 hover:text-red-400 ${FOCUS_RING_GOLD}`}
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            fileInputRefs.current[payment.id]?.click();
                                            triggerHapticImpact();
                                          }}
                                          className={`mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-3 py-3 text-xs text-zinc-400 hover:border-[#EAB308]/50 hover:text-zinc-200 transition ${FOCUS_RING_GOLD}`}
                                        >
                                          <Paperclip className="h-4 w-4 text-[#EAB308]" />
                                          Anexar comprovante do banco (JPG, PNG ou PDF)
                                        </button>
                                      )}
                                    </div>

                                    {/* Botão Enviar Comprovante */}
                                    <button
                                      type="button"
                                      onClick={() => void handleSubmitPixProof(payment.id)}
                                      disabled={submitting === payment.id || (!note.trim() && !file)}
                                      className={`flex w-full items-center justify-center gap-2 rounded-xl bg-[#EAB308] py-3 text-xs font-black text-black shadow-[0_0_20px_rgba(234,179,8,0.25)] transition disabled:opacity-40 hover:bg-yellow-400 ${FOCUS_RING_GOLD}`}
                                    >
                                      <Send className="h-3.5 w-3.5" />
                                      {submitting === payment.id ? "Enviando..." : "Enviar Comprovante PIX"}
                                    </button>
                                  </div>
                                ) : (
                                  /* Fluxo Dinheiro na Quadra */
                                  <div className="space-y-3 pt-1">
                                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3 text-left">
                                      <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                        <Banknote className="h-4 w-4" />
                                        Pagamento Presencial na Quadra
                                      </p>
                                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                                        Prefere pagar em dinheiro no dia do treino? Ao avisar o Will, o status da fatura
                                        fica sinalizado e ele confirma o recebimento presencialmente na quadra.
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={submitting === payment.id}
                                      onClick={() => void handleDeclareCashPayment(payment.id)}
                                      className={`flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-4 text-sm font-black text-black shadow-[0_0_24px_rgba(16,185,129,0.25)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50 ${FOCUS_RING_GOLD}`}
                                    >
                                      <Banknote className="h-5 w-5" />
                                      {submitting === payment.id
                                        ? "Enviando aviso..."
                                        : "💵 Avisar que pagarei no próximo treino"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
