"use client";

import React, { useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Copy, CheckCircle2, Clock, AlertTriangle, CreditCard,
  Paperclip, Send, ChevronDown, ChevronUp, Image as ImageIcon, QrCode,
} from "lucide-react";
import QRCode from "react-qr-code";
import { generatePixPayload } from "@/lib/pixUtils";
import { usePayments } from "@/context/PaymentsContext";
import { useAppConfig } from "@/context/AppConfigContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
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
  const { payments, submitStudentPaymentProof, currentMonthReference } = usePayments();
  const { appConfig } = useAppConfig();
  const { toast } = useToast();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState<Record<string, string>>({});
  const [proofFile, setProofFile] = useState<Record<string, { file: File; previewUrl: string; fileName: string; mime: string } | null>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const myPayments = useMemo(
    () => payments
      .filter((p) => p.studentId === user?.id)
      .sort((a, b) => b.reference.localeCompare(a.reference)),
    [payments, user?.id],
  );

  const currentPayment = useMemo(
    () => myPayments.find((p) => p.reference === currentMonthReference),
    [myPayments, currentMonthReference],
  );

  const hasPixKey = Boolean(appConfig.pixKey?.trim());
  const [showQR, setShowQR] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const pixLabel = appConfig.pixKeyType === "cpf" ? "CPF" :
    appConfig.pixKeyType === "telefone" ? "Telefone" :
    appConfig.pixKeyType === "aleatoria" ? "Chave aleatória" : "E-mail";

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
    setTimeout(() => setPixCopied(false), 2000);
    toast("Código PIX copiado!");
  };

  const handleFileChange = (paymentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast("Arquivo muito grande. Máximo 8 MB.", "error"); return; }
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) { toast("Formato inválido. Use JPG, PNG, WebP ou PDF.", "error"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setProofFile((prev) => ({
        ...prev,
        [paymentId]: { file, previewUrl: reader.result as string, fileName: file.name, mime: file.type },
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = async (paymentId: string) => {
    const note = proofNote[paymentId]?.trim() ?? "";
    const attachment = proofFile[paymentId] ?? null;
    if (!note && !attachment) {
      toast("Adicione uma nota ou anexe o comprovante.", "error");
      return;
    }
    setSubmitting(paymentId);
    try {
      submitStudentPaymentProof(paymentId, { note, attachment });
      toast("Comprovante enviado! O Will foi notificado e vai revisar em breve.");
      setProofNote((p) => { const n = { ...p }; delete n[paymentId]; return n; });
      setProofFile((p) => { const n = { ...p }; delete n[paymentId]; return n; });
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
          className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto w-full max-w-2xl rounded-t-3xl border-t border-zinc-800 bg-[#0A0A0A] shadow-[0_-24px_80px_rgba(0,0,0,0.6)] max-h-[92dvh] flex flex-col"
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
                <p className="text-[11px] text-zinc-500 mt-0.5">Referência atual: {currentMonthReference}</p>
              </div>
              <button onClick={onClose} className={`p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-900 ${FOCUS_RING_GOLD}`}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* PIX Key */}
            {hasPixKey && (
              <div className="flex-shrink-0 mx-5 mt-4 rounded-2xl border border-[#EAB308]/30 bg-[#EAB308]/6 p-3.5">
                {/* Badge PIX */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-400">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
                      <path d="M17.09 11.5h-2.31l-2.77-2.77a1 1 0 0 0-1.42 0L7.82 11.5H5.5A3.5 3.5 0 0 0 2 15v.5A3.5 3.5 0 0 0 5.5 19h2.31l2.77 2.77a1 1 0 0 0 1.42 0L14.77 19h2.32A3.5 3.5 0 0 0 21 15.5V15a3.5 3.5 0 0 0-3.91-3.5z"/>
                    </svg>
                    PIX
                  </span>
                  <p className="text-[10px] font-bold text-[#EAB308]">
                    {pixLabel}
                  </p>
                  {currentPayment && (
                    <span className="ml-auto text-[10px] font-black text-white">
                      {currencyBRL(currentPayment.amount)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <p className="flex-1 min-w-0 truncate text-sm font-bold text-white">{appConfig.pixKey}</p>
                  <button
                    onClick={() => setShowQR(v => !v)}
                    data-testid="pix-toggle-qr"
                    className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-[11px] font-bold text-zinc-300 hover:text-white transition`}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    {showQR ? "Fechar" : "QR"}
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

                {/* QR Code PIX — payload EMV/BR Code real */}
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
                        {/* QR Code com fundo branco */}
                        <div className="p-4 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                          <QRCode value={pixPayload} size={200} level="M" bgColor="#FFFFFF" fgColor="#000000" />
                        </div>
                        <p className="text-[10px] text-zinc-400 text-center">
                          Escaneie com o app do seu banco para pagar
                        </p>

                        {/* Código copia-e-cola */}
                        <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 mb-1">Código PIX copia e cola</p>
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

                <p className="mt-2 text-[10px] text-zinc-500">
                  Escaneie o QR ou copie o código, faça o PIX e envie o comprovante abaixo.
                </p>
              </div>
            )}

            {/* Payment list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {myPayments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <CreditCard className="h-10 w-10 text-zinc-700" />
                  <p className="text-sm text-zinc-500">Nenhuma cobrança registrada ainda.</p>
                  <p className="text-[11px] text-zinc-600">O Will irá gerar sua primeira mensalidade após a matrícula.</p>
                </div>
              ) : (
                myPayments.map((payment) => {
                  const st = statusLabel(payment.status);
                  const isExpanded = expandedId === payment.id;
                  const proofSubmitted = Boolean(payment.studentProofSubmittedAt);
                  const isPaidOrProofed = payment.status === "paid" || proofSubmitted;
                  const note = proofNote[payment.id] ?? "";
                  const file = proofFile[payment.id];

                  return (
                    <div key={payment.id} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 overflow-hidden">
                      {/* Row */}
                      <div className="flex items-center gap-3 p-3.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${st.bg}`} style={{ color: st.color }}>
                              {st.text}
                            </span>
                            <span className="text-[10px] text-zinc-500">{payment.reference}</span>
                          </div>
                          <p className="text-base font-black text-white">{currencyBRL(payment.amount)}</p>
                          <p className="text-[10px] text-zinc-500">
                            Vence em {new Date(payment.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}
                          </p>
                        </div>

                        {/* Status icon / action */}
                        {payment.status === "paid" ? (
                          <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-400" />
                        ) : proofSubmitted ? (
                          <div className="flex flex-shrink-0 flex-col items-center gap-0.5 text-center">
                            <Clock className="h-5 w-5 text-[#EAB308]" />
                            <span className="text-[9px] text-[#EAB308] font-bold">Aguardando</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : payment.id)}
                            className={`flex-shrink-0 flex items-center gap-1 rounded-xl border border-[#EAB308]/40 bg-[#EAB308]/10 px-3 py-2 text-[11px] font-bold text-[#EAB308] hover:bg-[#EAB308]/20 transition ${FOCUS_RING_GOLD}`}
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            {isExpanded ? "Fechar" : "Pagar"}
                          </button>
                        )}
                      </div>

                      {/* Proof submitted info */}
                      {proofSubmitted && payment.status !== "paid" && (
                        <div className="mx-3.5 mb-3.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2">
                          <p className="text-[10px] font-bold text-amber-300">Comprovante enviado</p>
                          {payment.studentProofNote && (
                            <p className="text-[10px] text-zinc-400 mt-0.5">"{payment.studentProofNote}"</p>
                          )}
                          <p className="text-[9px] text-zinc-600 mt-0.5">
                            Enviado em {new Date(payment.studentProofSubmittedAt!).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      )}

                      {/* Expandable proof form */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-3.5 space-y-3 border-t border-zinc-800/60 pt-3">
                              {/* PIX reminder */}
                              {hasPixKey && (
                                <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                                  <p className="flex-1 min-w-0 truncate text-[11px] text-zinc-400">PIX: <span className="text-white font-bold">{appConfig.pixKey}</span></p>
                                  <button
                                    onClick={handleCopyPix}
                                    data-testid="pix-copy-inline-btn"
                                    className={`flex-shrink-0 ${FOCUS_RING_GOLD}`}
                                  >
                                    {pixCopied
                                      ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                      : <Copy className="h-4 w-4 text-[#EAB308]" />
                                    }
                                  </button>
                                </div>
                              )}

                              {/* Note */}
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nota / referência do pagamento</label>
                                <textarea
                                  rows={2}
                                  value={note}
                                  onChange={(e) => setProofNote((p) => ({ ...p, [payment.id]: e.target.value }))}
                                  placeholder="Ex: PIX enviado, txid: xxxxxxxx"
                                  className={`mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#EAB308]/50 focus:outline-none ${FOCUS_RING_GOLD}`}
                                />
                              </div>

                              {/* File attachment */}
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Comprovante (foto / PDF)</label>
                                <input
                                  ref={(el) => { fileInputRefs.current[payment.id] = el; }}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,application/pdf"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(payment.id, e)}
                                  onClick={() => setActiveFileId(payment.id)}
                                />
                                {file ? (
                                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-3 py-2">
                                    {file.mime.startsWith("image/") ? (
                                      <img src={file.previewUrl} alt="preview" className="h-8 w-8 rounded-lg object-cover border border-zinc-700 flex-shrink-0" />
                                    ) : (
                                      <ImageIcon className="h-6 w-6 text-zinc-500 flex-shrink-0" />
                                    )}
                                    <p className="flex-1 min-w-0 truncate text-[11px] text-zinc-300">{file.fileName}</p>
                                    <button
                                      onClick={() => setProofFile((p) => { const n = { ...p }; delete n[payment.id]; return n; })}
                                      className={`flex-shrink-0 text-zinc-500 hover:text-red-400 ${FOCUS_RING_GOLD}`}
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setActiveFileId(payment.id); fileInputRefs.current[payment.id]?.click(); }}
                                    className={`mt-1 flex w-full items-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-3 py-2.5 text-[11px] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition ${FOCUS_RING_GOLD}`}
                                  >
                                    <Paperclip className="h-4 w-4" />
                                    Anexar comprovante (JPG, PNG, PDF)
                                  </button>
                                )}
                              </div>

                              {/* Submit */}
                              <button
                                onClick={() => void handleSubmit(payment.id)}
                                disabled={submitting === payment.id || (!note.trim() && !file)}
                                className={`flex w-full items-center justify-center gap-2 rounded-xl bg-[#EAB308] py-3 text-sm font-black text-black shadow-[0_0_20px_rgba(234,179,8,0.2)] transition disabled:opacity-40 hover:bg-yellow-400 ${FOCUS_RING_GOLD}`}
                              >
                                <Send className="h-4 w-4" />
                                {submitting === payment.id ? "Enviando..." : "Enviar comprovante"}
                              </button>
                              <p className="text-center text-[10px] text-zinc-600">
                                O Will irá confirmar o recebimento e atualizar seu status.
              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
