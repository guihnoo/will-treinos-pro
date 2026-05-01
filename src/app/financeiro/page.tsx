"use client";
import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, DollarSign, QrCode, Copy, Check, X, PhoneCall, CalendarRange, ChevronRight, Send, Upload, FileText, Eye, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCriticalData } from "@/context/CriticalDataContext";
import { useLessons } from "@/context/LessonsContext";
import { useStudents } from "@/context/StudentsContext";
import { usePayments } from "@/context/PaymentsContext";
import { useAppConfig } from "@/context/AppConfigContext";
import { useToast } from "@/components/Toast";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import AppPageHeader from "@/components/ui/AppPageHeader";
import StatCard from "@/components/ui/StatCard";
import { avatarSrc } from "@/lib/avatarSrc";
import AppEmptyState from "@/components/ui/AppEmptyState";
import AppSectionCard from "@/components/ui/AppSectionCard";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { FOCUS_RING_GOLD, TOUCH_TARGET_MIN } from "@/components/ui/interactionTokens";

const MAX_PROOF_BYTES = 380 * 1024;
const MAX_DATA_URL_CHARS = 700_000;

function readStudentProofFile(
  file: File,
  onOk: (a: { file: File; previewUrl: string; fileName: string; mime: string }) => void,
  onErr: (msg: string) => void,
) {
  if (file.size > MAX_PROOF_BYTES) {
    onErr("Arquivo grande demais (máx. 380 KB). Use foto mais leve ou PDF menor.");
    return;
  }
  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    onErr("Apenas imagem (print) ou PDF.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result || "");
    if (dataUrl.length > MAX_DATA_URL_CHARS) {
      onErr("Arquivo gerou dados demais. Reduza a resolução da foto.");
      return;
    }
    onOk({ file, previewUrl: dataUrl, fileName: file.name, mime: file.type || "application/octet-stream" });
  };
  reader.onerror = () => onErr("Não foi possível ler o arquivo.");
  reader.readAsDataURL(file);
}

const statusCfg: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  paid:    { label: "Pago",     color: "#22C55E", icon: CheckCircle2 },
  pending: { label: "Pendente", color: "#F97316", icon: Clock },
  late:    { label: "Atrasado", color: "#EF4444", icon: AlertTriangle },
};

/* ─── Payment Detail Modal ─── */
type Pay = {
  id: string;
  reference: string;
  dueDate: string;
  paidDate: string | null;
  amount: number;
  status: string;
  method: string | null;
  studentProofNote?: string;
  studentProofSubmittedAt?: string | null;
  studentProofDataUrl?: string;
  studentProofFileName?: string;
  studentProofMime?: string;
};
type ProofAttachment = { file?: File; previewUrl?: string; fileName: string; mime: string };
function waDigits(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length < 10) return "";
  return d.startsWith("55") ? d : `55${d}`;
}
function PaymentModal({
  pay,
  pixKey,
  pixOwner,
  whatsapp,
  studentName,
  onClose,
  onSubmitProof,
}: {
  pay: Pay;
  pixKey: string;
  pixOwner: string;
  whatsapp: string;
  studentName: string;
  onClose: () => void;
  onSubmitProof: (note: string, attachment: ProofAttachment | null | undefined) => void;
}) {
  const { toast } = useToast();
  const ctaClass = `${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD}`;
  useBodyScrollLock(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [proofNote, setProofNote] = useState(pay.studentProofNote ?? "");
  /** undefined = não alterar anexo salvo; null = remover; objeto = novo/trocar */
  const [localAttachment, setLocalAttachment] = useState<ProofAttachment | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const cfg = statusCfg[pay.status]; const Icon = cfg.icon;
  const isPaid = pay.status === "paid";
  const hasProof = Boolean(pay.studentProofSubmittedAt);
  const copy = () => { navigator.clipboard.writeText(pixKey||""); setCopied(true); setTimeout(()=>setCopied(false),2000); if(navigator.vibrate) navigator.vibrate(40); };
  const fmt = (d: string) => new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long"});
  const fmtProof = (iso: string) => new Date(iso).toLocaleString("pt-BR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
  const displayAttachment: ProofAttachment | null =
    localAttachment !== undefined
      ? localAttachment
      : pay.studentProofDataUrl
        ? {
            previewUrl: pay.studentProofDataUrl,
            fileName: pay.studentProofFileName || "comprovante",
            mime: pay.studentProofMime || "image/jpeg",
          }
        : null;
  const isPdf = (a: ProofAttachment | null) =>
    Boolean(a && (a.mime === "application/pdf" || a.fileName.toLowerCase().endsWith(".pdf")));
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} data-modal-overlay aria-modal="true" role="dialog" className="fixed inset-0 z-[200] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:py-6" onClick={onClose}>
      <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:26,stiffness:280}}
        onClick={e=>e.stopPropagation()} className="w-full max-w-lg mx-auto bg-[#0A0A0A] border-t border-zinc-800 rounded-t-3xl max-h-[92dvh] overflow-y-auto shadow-[0_-24px_80px_rgba(0,0,0,0.55)]">
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-2"/>
        <div className="sticky top-0 z-20 px-6 py-4 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-zinc-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Mensalidade</p>
              <h2 className="text-2xl font-bold text-white">{pay.reference}</h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{background:`${cfg.color}15`,border:`1px solid ${cfg.color}30`}}>
                <Icon className="w-3.5 h-3.5" style={{color:cfg.color}}/><span className="text-xs font-bold" style={{color:cfg.color}}>{cfg.label}</span>
              </div>
              <p className="text-3xl font-bold text-white">R$ {pay.amount}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pt-5 pb-3">
          <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Vencimento</p>
            <p className="text-sm font-bold text-white">{fmt(pay.dueDate)}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">{isPaid?"Pago em":"Método"}</p>
            <p className="text-sm font-bold text-white">{isPaid&&pay.paidDate?fmt(pay.paidDate):pay.method||"—"}</p>
          </div>
        </div>
          {!isPaid && (
            <div className="mb-4 p-4 bg-[#EAB308]/5 border border-[#EAB308]/20 rounded-2xl space-y-3">
            <div className="flex items-center gap-2"><QrCode className="w-4 h-4 text-[#EAB308]"/><p className="text-sm font-bold text-[#EAB308]">Pagar via PIX</p></div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Pague com a chave abaixo. Envie <strong className="text-zinc-300">foto do print ou arquivo PDF</strong> do comprovante (sem link). Opcional: observação curta. O professor confirma no painel.
            </p>
            <div className="flex items-center gap-2 bg-zinc-900 rounded-xl px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-zinc-500 uppercase font-bold">{pixOwner||"Recebedor"}</p>
                <p className="text-sm text-white font-mono truncate">{pixKey ? pixKey : "Chave PIX ainda não cadastrada — avise o professor."}</p>
              </div>
              <button type="button" onClick={copy} disabled={!pixKey} className={`p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-40 ${ctaClass}`}>
                {copied?<Check className="w-4 h-4 text-[#22C55E]"/>:<Copy className="w-4 h-4 text-zinc-400"/>}
              </button>
            </div>
            {hasProof ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
                Último envio em {pay.studentProofSubmittedAt ? fmtProof(pay.studentProofSubmittedAt) : ""}.
                {pay.studentProofNote ? ` Observação: ${pay.studentProofNote}` : ""}
                {displayAttachment ? ` · Arquivo: ${displayAttachment.fileName}` : ""}
              </div>
            ) : null}
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  readStudentProofFile(
                    f,
                    (a) => setLocalAttachment(a),
                    (msg) => toast(msg, "error"),
                  );
                }}
              />
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                Foto do comprovante ou PDF
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#EAB308]/40 bg-[#EAB308]/10 px-3 text-xs font-bold text-[#EAB308] hover:bg-[#EAB308]/18 ${ctaClass}`}
                >
                  <Upload className="h-4 w-4 shrink-0" /> Anexar print ou PDF
                </button>
                {displayAttachment ? (
                  <button
                    type="button"
                    onClick={() => setLocalAttachment(null)}
                    className={`min-h-11 rounded-xl border border-red-500/35 bg-red-500/10 px-3 text-xs font-bold text-red-300 hover:bg-red-500/15 ${ctaClass}`}
                  >
                    Remover anexo
                  </button>
                ) : null}
              </div>
              {displayAttachment ? (
                <div className="mt-2 overflow-hidden rounded-xl border border-zinc-800 bg-black/50">
                  {isPdf(displayAttachment) ? (
                    <div className="flex items-center gap-2 px-3 py-3 text-sm text-zinc-300">
                      <FileText className="h-8 w-8 shrink-0 text-[#EAB308]" />
                      <span className="min-w-0 truncate font-mono text-xs">{displayAttachment.fileName}</span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayAttachment.previewUrl} alt="Prévia do comprovante" className="max-h-40 w-full object-contain" />
                  )}
                </div>
              ) : null}
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Observação (opcional)</label>
              <textarea
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
                rows={2}
                placeholder="Ex.: ID do PIX, banco usado…"
                className="w-full resize-none rounded-xl border border-zinc-800 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#EAB308]/45 placeholder:text-zinc-600"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => {
                if (!displayAttachment) {
                  toast("Anexe a foto do comprovante ou um arquivo PDF (sem link).", "error");
                  return;
                }
                onSubmitProof(proofNote, localAttachment);
              }}
              className={`w-full py-3.5 rounded-xl bg-[#EAB308] text-black font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.2)] ${ctaClass}`}
            >
              <Send className="w-4 h-4" /> Registrar comprovante e avisar pelo WhatsApp
            </motion.button>
            </div>
          )}
          {isPaid && (
            <div className="flex items-center gap-3 p-4 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-2xl mb-4">
            <CheckCircle2 className="w-6 h-6 text-[#22C55E]"/>
            <div><p className="text-sm font-bold text-[#22C55E]">Pagamento confirmado</p><p className="text-xs text-zinc-500">Obrigado! Continue treinando 🏐</p></div>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 z-20 px-6 py-4 border-t border-zinc-900 bg-[#0A0A0A]/95 backdrop-blur-sm pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
          {!isPaid && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                const phone = waDigits(whatsapp);
                if (!phone) return;
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent("Olá! Quero regularizar meu pagamento.")}`, "_blank", "noopener,noreferrer");
              }}
              disabled={!waDigits(whatsapp)}
              className={`flex-1 py-3 rounded-xl border border-zinc-800 text-zinc-400 text-sm flex items-center justify-center gap-1.5 hover:border-zinc-700 disabled:opacity-40 ${ctaClass}`}
            >
              <PhoneCall className="w-4 h-4" /> WhatsApp
            </motion.button>
          )}
          <button onClick={onClose} className={`${isPaid?"w-full":"flex-1"} py-3 rounded-xl border border-zinc-800 text-zinc-500 text-sm hover:border-zinc-700 transition-colors ${ctaClass}`}>Fechar</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── ALUNO VIEW ─── */
function AlunoFinanceiro() {
  const { user, usingSupabaseSession } = useAuth();
  const { lessons } = useLessons();
  const { payments, pendingOrLatePaymentsCount, submitStudentPaymentProof } = usePayments();
  const { appConfig } = useAppConfig();
  const { criticalDataLoading, criticalDataError } = useCriticalData();
  const { toast } = useToast();
  const [selectedPay, setSelectedPay] = useState<string|null>(null);
  const myPayments = useMemo(()=>payments.filter(p=>p.studentId===user?.id).sort((a,b)=>new Date(b.dueDate).getTime()-new Date(a.dueDate).getTime()),[payments,user]);
  const myLessons  = lessons.filter(l=>l.enrolledStudents.includes(user?.id||"")&&l.status==="completed");
  const paid=myPayments.filter(p=>p.status==="paid"), pending=myPayments.filter(p=>p.status==="pending"), late=myPayments.filter(p=>p.status==="late");
  const firstPendingOrLate = myPayments.find((payment) => payment.status === "late" || payment.status === "pending");
  const selObj = myPayments.find(p=>p.id===selectedPay)||null;
  if (usingSupabaseSession && criticalDataLoading) {
    return <div className="p-4 md:p-8 max-w-2xl mx-auto pb-28"><div className="rounded-2xl border border-zinc-800 bg-[#0A0A0A] p-5 text-sm text-zinc-300">Sincronizando financeiro...</div></div>;
  }
  if (usingSupabaseSession && criticalDataError) {
    return <div className="p-4 md:p-8 max-w-2xl mx-auto pb-28"><div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-5 text-sm text-zinc-200">{criticalDataError}</div></div>;
  }
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto pb-28">
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Wallet className="w-8 h-8 text-[#EAB308]"/>Meu Financeiro</h1>
        <p className="text-zinc-500 mt-1">Toque em um pagamento para ver detalhes.</p>
      </motion.div>
      {pendingOrLatePaymentsCount>0&&(
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mb-5 p-4 rounded-2xl border border-[#EF4444]/40 bg-[#EF4444]/5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5"/>
          <div className="flex-1">
            <p className="font-bold text-[#EF4444] text-sm">Pagamento em atraso</p>
            <p className="text-xs text-zinc-400 mt-0.5">Você tem {pendingOrLatePaymentsCount} mensalidade{pendingOrLatePaymentsCount>1?"s":""} pendente(s) ou em atraso.</p>
          </div>
          <motion.button whileTap={{scale:0.9}} onClick={()=> firstPendingOrLate ? setSelectedPay(firstPendingOrLate.id) : null} className={`px-3 py-1.5 rounded-lg bg-[#EF4444] text-white text-xs font-bold ${FOCUS_RING_GOLD}`}>Ver</motion.button>
        </motion.div>
      )}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[{label:"Aulas feitas",value:myLessons.length,color:"#EAB308",icon:CalendarRange},{label:"Em dia",value:paid.length,color:"#22C55E",icon:CheckCircle2},{label:"Pendentes",value:pending.length+late.length,color:late.length>0?"#EF4444":"#F97316",icon:AlertTriangle}].map((s,i)=>(
          <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}} className="bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl p-4 text-center relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full blur-xl opacity-20" style={{background:s.color}}/>
            <s.icon className="w-5 h-5 mx-auto mb-1" style={{color:s.color}}/><p className="text-2xl font-bold text-white">{s.value}</p><p className="text-[10px] text-zinc-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="space-y-2">
        {myPayments.length===0&&<div className="text-center py-16 text-zinc-600"><Wallet className="w-10 h-10 mx-auto mb-3 opacity-30"/><p>Nenhum histórico ainda.</p></div>}
        {myPayments.map((pay,i)=>{const cfg=statusCfg[pay.status];const Icon=cfg.icon;return(
          <motion.div key={pay.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} whileTap={{scale:0.98}}
            onClick={()=>{setSelectedPay(pay.id);if(navigator.vibrate)navigator.vibrate(30);}}
            className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-zinc-800/50 rounded-2xl cursor-pointer hover:border-zinc-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{background:`${cfg.color}15`}}><Icon className="w-4 h-4" style={{color:cfg.color}}/></div>
              <div><p className="text-sm font-bold text-white">{pay.reference}</p><p className="text-xs text-zinc-500">Venc: {new Date(pay.dueDate+"T12:00:00").toLocaleDateString("pt-BR")}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right"><p className="text-lg font-bold text-white">R$ {pay.amount}</p><p className="text-[10px] font-bold" style={{color:cfg.color}}>{cfg.label}</p></div>
              <ChevronRight className="w-4 h-4 text-zinc-700"/>
            </div>
          </motion.div>
        );})}
      </div>
      <AnimatePresence>
        {selObj && user ? (
          <PaymentModal
            key={selObj.id}
            pay={selObj}
            pixKey={appConfig.pixKey}
            pixOwner={appConfig.pixOwnerName}
            whatsapp={appConfig.whatsappNumber}
            studentName={user.name}
            onClose={() => setSelectedPay(null)}
            onSubmitProof={(note, attachment) => {
              submitStudentPaymentProof(selObj.id, { note, attachment });
              const phone = waDigits(appConfig.whatsappNumber || "");
              const removedFile = attachment === null;
              const hasAnexo =
                !removedFile &&
                (Boolean(attachment?.previewUrl) ||
                  (attachment === undefined && Boolean(selObj.studentProofDataUrl)));
              const body = `Ola! Sou ${user.name}. Registrei no app o comprovante PIX da mensalidade ${selObj.reference} (R$ ${selObj.amount}).${hasAnexo ? " Arquivo anexado no app (professor pode abrir em Financeiro)." : ""}${note.trim() ? ` Obs: ${note.trim()}.` : ""}`;
              if (phone) {
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
                toast("Comprovante salvo no app. Professor pode abrir o anexo em Financeiro.");
              } else {
                toast("Comprovante salvo. Configure o WhatsApp do professor para aviso automático.");
              }
              if (navigator.vibrate) navigator.vibrate([40, 25, 60]);
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ─── COACH VIEW ─── */
function CoachFinanceiro() {
  const { lessons } = useLessons();
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const monthLessons = lessons.filter(l=>l.date.startsWith(thisMonth)&&l.status==="completed");
  const totalStudentsMonth = monthLessons.reduce((a,l)=>a+l.presentStudents.length,0);
  const estimatedCache = monthLessons.length*80;
  const allCompleted = lessons.filter(l=>l.status==="completed");
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto pb-28">
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Wallet className="w-8 h-8 text-[#EAB308]"/>Meu Cache</h1>
        <p className="text-zinc-500 mt-1">Suas aulas dadas e ganhos estimados.</p>
      </motion.div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[{label:"Aulas este mês",value:monthLessons.length,color:"#EAB308",icon:CalendarRange},{label:"Alunos atendidos",value:totalStudentsMonth,color:"#06B6D4",icon:CheckCircle2},{label:"Cache estimado",value:`R$ ${estimatedCache}`,color:"#22C55E",icon:DollarSign},{label:"Total de aulas",value:allCompleted.length,color:"#8B5CF6",icon:TrendingUp}].map((s,i)=>(
          <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}} className="bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full blur-xl opacity-20" style={{background:s.color}}/>
            <div className="p-2 rounded-xl w-fit mb-2" style={{background:`${s.color}18`}}><s.icon className="w-4 h-4" style={{color:s.color}}/></div>
            <p className="text-xl font-bold text-white">{s.value}</p><p className="text-[10px] text-zinc-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><CalendarRange className="w-4 h-4 text-[#EAB308]"/>Aulas — {now.toLocaleDateString("pt-BR",{month:"long"})}</h2>
        {monthLessons.length===0?<p className="text-zinc-600 text-sm text-center py-8">Nenhuma aula concluída este mês.</p>:(
          <div className="space-y-2">
            {monthLessons.map((l,i)=>(
              <motion.div key={l.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40">
                <div><p className="text-sm font-bold text-white">{l.title}</p><p className="text-xs text-zinc-500">{new Date(l.date).toLocaleDateString("pt-BR")} • {l.startTime}–{l.endTime} • {l.presentStudents.length} presentes</p></div>
                <div className="text-right"><p className="text-sm font-bold text-[#22C55E]">R$ 80</p><p className="text-[10px] text-zinc-600">estimado</p></div>
              </motion.div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-zinc-800 mt-2">
              <span className="text-sm text-zinc-400 font-bold">Total estimado</span>
              <span className="text-lg font-bold text-[#22C55E]">R$ {estimatedCache}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminProofLightbox({
  dataUrl,
  fileName,
  onClose,
}: {
  dataUrl: string;
  fileName: string;
  onClose: () => void;
}) {
  useBodyScrollLock(true);
  const isPdf =
    dataUrl.startsWith("data:application/pdf") || fileName.toLowerCase().endsWith(".pdf");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-modal-overlay
      className="fixed inset-0 z-[240] overflow-y-auto overscroll-y-contain flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90dvh] w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-[#0A0A0A] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <p className="min-w-0 truncate text-sm font-bold text-white">{fileName}</p>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg border border-zinc-700 p-2 text-zinc-400 transition hover:text-white ${FOCUS_RING_GOLD}`}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(90dvh-4rem)] overflow-auto p-2">
          {isPdf ? (
            <iframe title="Comprovante PDF" src={dataUrl} className="h-[70dvh] w-full rounded-lg border border-zinc-800 bg-black" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="Comprovante" className="mx-auto max-h-[75dvh] w-auto max-w-full object-contain" />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AdminPaymentDetailModal({
  pay,
  studentName,
  onClose,
  onMarkPaid,
}: {
  pay: Pay;
  studentName: string;
  onClose: () => void;
  onMarkPaid: () => void;
}) {
  const ctaClass = `${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD}`;
  useBodyScrollLock(true);
  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
  const status = statusCfg[pay.status] ?? statusCfg.pending;
  const StatusIcon = status.icon;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-modal-overlay
      className="fixed inset-0 z-[250] overflow-y-auto overscroll-y-contain flex flex-col justify-end bg-black/80 p-2 sm:flex-col sm:justify-center sm:p-4"
      onClick={onClose}
    >
      <motion.section
        initial={{ y: 24, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.98 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[92dvh] overflow-y-auto overscroll-contain rounded-2xl border border-zinc-800 bg-[#0A0A0A] p-4 shadow-2xl"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Validação de comprovante</p>
            <h3 className="text-lg font-black text-white">{studentName}</h3>
            <p className="text-xs text-zinc-500">{pay.reference} · R$ {pay.amount}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-zinc-700 bg-black/60 text-zinc-300 hover:text-white ${ctaClass}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          <div className="rounded-xl border border-zinc-800 bg-black/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Status</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: status.color }}>
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-black/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Comprovante enviado em</p>
            <p className="mt-1 text-sm font-bold text-zinc-100">{fmtDate(pay.studentProofSubmittedAt)}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-black/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Observação do aluno</p>
            <p className="mt-1 text-sm text-zinc-300">{pay.studentProofNote?.trim() || "Sem observação."}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-11 rounded-xl border border-zinc-700 bg-black/60 text-sm font-bold text-zinc-300 hover:text-white ${ctaClass}`}
          >
            Fechar
          </button>
          {pay.status !== "paid" ? (
            <button
              type="button"
              onClick={onMarkPaid}
              className={`min-h-11 rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-sm font-black text-emerald-300 hover:bg-emerald-500/20 ${ctaClass}`}
            >
              Confirmar como Pago ✓
            </button>
          ) : (
            <div className="flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/60 text-sm font-bold text-zinc-500">
              Já confirmado
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}

/* ─── ADMIN VIEW ─── */
function AdminFinanceiro() {
  const { students } = useStudents();
  const { payments, totalsByStatus, proofPendingCount, markPayment } = usePayments();
  const { usingSupabaseSession } = useAuth();
  const { criticalDataLoading, criticalDataError, retryCriticalDataSync } = useCriticalData();
  const { toast } = useToast();
  const ctaClass = `${TOUCH_TARGET_MIN} ${FOCUS_RING_GOLD}`;
  const [filter, setFilter] = useState<"all"|"paid"|"pending"|"late"|"proof_pending">("all");
  const [proofViewer, setProofViewer] = useState<{ dataUrl: string; fileName: string } | null>(null);
  const [selectedPayId, setSelectedPayId] = useState<string | null>(null);
  const [busyPayId, setBusyPayId] = useState<string | null>(null);
  const getStudent = (id: string) => students.find(s=>s.id===id);
  const total = totalsByStatus.paid+totalsByStatus.pending+totalsByStatus.late;
  const filtered = payments
    .filter((p) => {
      if (filter === "all") return true;
      if (filter === "proof_pending") return p.status !== "paid" && Boolean(p.studentProofSubmittedAt);
      return p.status === filter;
    })
    .sort((a,b)=>new Date(b.dueDate).getTime()-new Date(a.dueDate).getTime());
  const selectedPay = payments.find((pay) => pay.id === selectedPayId) ?? null;
  const handleMarkPaid = (payId: string, studentName?: string) => {
    if (busyPayId === payId) return;
    setBusyPayId(payId);
    markPayment(payId);
    if (studentName) toast(`✅ ${studentName.split(" ")[0]} confirmado!`);
    window.setTimeout(() => setBusyPayId((current) => (current === payId ? null : current)), 700);
  };
  if (usingSupabaseSession && criticalDataLoading) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto pb-28">
        <AppPageHeader title="Financeiro" subtitle="Sincronizando financeiro em tempo real..." icon={Wallet} className="mb-6" />
        <div className="space-y-3">
          <SkeletonLoader className="h-20" lines={2} />
          <SkeletonLoader className="h-24" lines={3} />
          <SkeletonLoader className="h-56" lines={6} />
        </div>
      </div>
    );
  }
  if (usingSupabaseSession && criticalDataError) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto pb-28">
        <AppPageHeader title="Financeiro" subtitle="Falha de sincronização. Tente novamente sem recarregar." icon={Wallet} className="mb-6" />
        <AppSectionCard title="Erro de sincronização" subtitle="O painel não recebeu os dados ao vivo do Supabase.">
          <p className="text-sm text-zinc-300">{criticalDataError}</p>
          <button
            type="button"
            onClick={() => void retryCriticalDataSync()}
            className={`mt-4 rounded-xl border border-red-300/35 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200 hover:bg-red-500/15 ${ctaClass}`}
          >
            Tentar sincronizar novamente
          </button>
        </AppSectionCard>
      </div>
    );
  }
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-28">
      <AppPageHeader
        title="Financeiro"
        subtitle="Controle de pagamentos e inadimplência."
        icon={Wallet}
        className="mb-6"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Recebido", value: totalsByStatus.paid, color: "#22C55E", icon: TrendingUp },
          { label: "Pendente", value: totalsByStatus.pending, color: "#F97316", icon: Clock },
          { label: "Em Atraso", value: totalsByStatus.late, color: "#EF4444", icon: TrendingDown },
        ].map((kpi, i) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={`R$ ${kpi.value.toLocaleString("pt-BR")}`}
            icon={kpi.icon}
            color={kpi.color}
            delay={i * 0.1}
          />
        ))}
      </div>
      <div className="mb-6 rounded-2xl border border-sky-500/25 bg-sky-500/[0.06] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sky-300">Validação de comprovantes</p>
        <p className="mt-1 text-sm text-zinc-300">
          {proofPendingCount > 0
            ? `${proofPendingCount} comprovante${proofPendingCount > 1 ? "s" : ""} aguardando validação do Will.`
            : "Nenhum comprovante aguardando validação no momento."}
        </p>
      </div>
      {total>0&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}} className="bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl p-5 mb-6">
          <div className="flex justify-between text-sm mb-3"><span className="text-zinc-500">Composição</span><span className="text-zinc-400 font-mono">R$ {total.toLocaleString("pt-BR")}</span></div>
          <div className="flex h-4 rounded-full overflow-hidden bg-zinc-900">
            {[{v:totalsByStatus.paid,c:"#22C55E"},{v:totalsByStatus.pending,c:"#F97316"},{v:totalsByStatus.late,c:"#EF4444"}].map((b,i)=>(
              <motion.div key={i} initial={{width:0}} animate={{width:`${(b.v/total)*100}%`}} transition={{duration:1,delay:0.5+i*0.2}} style={{background:b.c}} className={i===0?"rounded-l-full":i===2?"rounded-r-full":""}/>
            ))}
          </div>
        </motion.div>
      )}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {(["all","proof_pending","paid","pending","late"] as const).map(f=>(
          <motion.button key={f} whileTap={{scale:0.95}} onClick={()=>setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border whitespace-nowrap ${filter===f?"bg-[#EAB308] text-black border-[#EAB308]":"bg-[#0A0A0A] text-zinc-400 border-zinc-800 hover:border-zinc-600"} ${ctaClass}`}>
            {{all:"Todos",proof_pending:"Com comprovante",paid:"Pagos",pending:"Pendentes",late:"Atrasados"}[f]}
          </motion.button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <AppEmptyState
            icon={Wallet}
            title="Nenhum pagamento neste filtro"
            description="Altere o status selecionado para ampliar a visão financeira."
            actionLabel="Ver todos os pagamentos"
            onAction={() => setFilter("all")}
          />
        ) : null}
        {filtered.map((pay,i)=>{const st=getStudent(pay.studentId);const cfg=statusCfg[pay.status];const Icon=cfg.icon;if(!st)return null;return(
          <motion.div key={pay.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}} className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-all">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img src={avatarSrc(st.avatar)} className="w-9 h-9 rounded-full border-2 border-zinc-800 flex-shrink-0 object-cover"/>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><span className="font-bold text-white text-sm truncate">{st.name}</span><span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{color:cfg.color,background:`${cfg.color}15`}}><Icon className="w-3 h-3"/>{cfg.label}</span>{pay.studentProofSubmittedAt && pay.status !== "paid" ? <span className="text-[9px] font-bold uppercase tracking-wide rounded-full border border-sky-500/40 bg-sky-500/15 px-2 py-0.5 text-sky-300">Comprovante do aluno</span> : null}</div>
                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                  <span>Venc: {new Date(pay.dueDate).toLocaleDateString("pt-BR")}</span>
                  <span>{pay.reference}</span>
                  {pay.studentProofSubmittedAt ? (
                    <span className="text-sky-300">Envio: {new Date(pay.studentProofSubmittedAt).toLocaleDateString("pt-BR")}</span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-lg font-bold text-white">R$ {pay.amount}</span>
              {pay.studentProofDataUrl ? (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() =>
                    setProofViewer({
                      dataUrl: pay.studentProofDataUrl!,
                      fileName: pay.studentProofFileName || "comprovante",
                    })
                  }
                  className={`inline-flex items-center gap-1 rounded-lg border border-sky-500/35 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/15 ${ctaClass}`}
                >
                  <Eye className="h-3.5 w-3.5" /> Ver anexo
                </motion.button>
              ) : null}
              {pay.studentProofSubmittedAt ? (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setSelectedPayId(pay.id)}
                  className={`inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:border-zinc-500 ${ctaClass}`}
                >
                  Detalhes
                </motion.button>
              ) : null}
              {pay.status !== "paid" ? (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => {
                    handleMarkPaid(pay.id, st.name);
                  }}
                  disabled={busyPayId === pay.id}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] text-xs font-bold hover:bg-[#22C55E]/20 border border-[#22C55E]/20 disabled:cursor-not-allowed disabled:opacity-60 ${ctaClass}`}
                >
                  {busyPayId === pay.id ? <RotateCcw className="h-3.5 w-3.5 animate-spin" /> : null}
                  Pago ✓
                </motion.button>
              ) : null}
            </div>
          </motion.div>
        );})}
      </div>
      <AnimatePresence>
        {selectedPay ? (
          <AdminPaymentDetailModal
            pay={selectedPay}
            studentName={getStudent(selectedPay.studentId)?.name ?? "Aluno"}
            onClose={() => setSelectedPayId(null)}
            onMarkPaid={() => {
              handleMarkPaid(selectedPay.id);
              toast("Pagamento confirmado com sucesso.");
              setSelectedPayId(null);
            }}
          />
        ) : null}
        {proofViewer ? (
          <AdminProofLightbox
            dataUrl={proofViewer.dataUrl}
            fileName={proofViewer.fileName}
            onClose={() => setProofViewer(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ─── ROUTER ─── */
export default function FinanceiroPage() {
  const { user } = useAuth();
  if (user?.role === "aluno") return <AlunoFinanceiro/>;
  if (user?.role === "coach") return <CoachFinanceiro/>;
  return <AdminFinanceiro/>;
}
