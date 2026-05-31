"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, BellRing, CheckCircle2, XCircle,
  Smartphone, Send, Loader2, ChevronDown, ChevronUp, X,
} from "lucide-react";
import { subscribeToPush, unsubscribeFromPush, isPushSupported } from "@/lib/pushClient";
import { getSupabaseClient } from "@/lib/supabaseClient";

type PushStatus = "unsupported" | "checking" | "not_subscribed" | "subscribed" | "denied" | "ios_not_installed";
type Role = "admin" | "professor" | "aluno";

interface Props {
  role: Role;
  onClose?: () => void;
  embedded?: boolean; // true = sem overlay, apenas o card
}

function detectIos() {
  if (typeof navigator === "undefined") return false;
  return /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function detectIosInstalled() {
  return typeof window !== "undefined" && (window.navigator as { standalone?: boolean }).standalone === true;
}

export default function PushSettingsPanel({ role, onClose, embedded = false }: Props) {
  const [status, setStatus]       = useState<PushStatus>("checking");
  const [testing, setTesting]     = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [toggling, setToggling]   = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const isIos = typeof window !== "undefined" && detectIos();

  const checkStatus = useCallback(async () => {
    setStatus("checking");

    if (!isPushSupported()) {
      if (isIos && !detectIosInstalled()) {
        setStatus("ios_not_installed");
      } else {
        setStatus("unsupported");
      }
      return;
    }

    const perm = Notification.permission;
    if (perm === "denied") { setStatus("denied"); return; }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "subscribed" : "not_subscribed");
    } catch {
      setStatus("not_subscribed");
    }
  }, [isIos]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  async function handleToggle() {
    setToggling(true);
    try {
      if (status === "subscribed") {
        await unsubscribeFromPush();
        setStatus("not_subscribed");
      } else {
        const ok = await subscribeToPush(role);
        setStatus(ok ? "subscribed" : "denied");
      }
    } finally {
      setToggling(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Sem sessão");

      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          payload: {
            title: "🏐 Will Treinos PRO",
            body: "Notificações funcionando perfeitamente!",
            url: "/dashboard",
          },
          targetUserId: session.user.id,
        }),
      });
      const data = await res.json();
      setTestResult(data.sent > 0 ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
    }
  }

  const STATUS_META: Record<PushStatus, { icon: React.ReactNode; title: string; subtitle: string; color: string }> = {
    checking:          { icon: <Loader2 size={20} className="animate-spin text-zinc-400" />, title: "Verificando…", subtitle: "", color: "border-zinc-800" },
    unsupported:       { icon: <XCircle size={20} className="text-red-400" />, title: "Não suportado", subtitle: "Seu navegador não suporta notificações push.", color: "border-red-500/20" },
    ios_not_installed: { icon: <Smartphone size={20} className="text-amber-400" />, title: "Instale o app primeiro", subtitle: "No iOS, adicione o app à tela inicial antes de ativar.", color: "border-amber-500/20" },
    denied:            { icon: <BellOff size={20} className="text-red-400" />, title: "Permissão negada", subtitle: "Vá nas configurações do celular e permita notificações para este site.", color: "border-red-500/20" },
    not_subscribed:    { icon: <Bell size={20} className="text-zinc-400" />, title: "Notificações desativadas", subtitle: "Ative para receber alertas em tempo real.", color: "border-zinc-700" },
    subscribed:        { icon: <BellRing size={20} className="text-emerald-400" />, title: "Notificações ativas", subtitle: "Você receberá alertas diretamente no celular.", color: "border-emerald-500/20" },
  };

  const meta = STATUS_META[status];

  const content = (
    <div className="space-y-4">
      {/* Status card */}
      <div className={`rounded-2xl border ${meta.color} bg-zinc-900/40 p-4 flex items-center gap-3`}>
        {meta.icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white">{meta.title}</p>
          {meta.subtitle && <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">{meta.subtitle}</p>}
        </div>
      </div>

      {/* Toggle */}
      {(status === "subscribed" || status === "not_subscribed") && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleToggle}
          disabled={toggling}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black transition-colors ${
            status === "subscribed"
              ? "border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
              : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
          }`}
        >
          {toggling
            ? <Loader2 size={16} className="animate-spin" />
            : status === "subscribed"
              ? <><BellOff size={16} /> Desativar Notificações</>
              : <><BellRing size={16} /> Ativar Notificações</>
          }
        </motion.button>
      )}

      {/* Test push */}
      {status === "subscribed" && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleTest}
          disabled={testing}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-zinc-700/60 bg-zinc-900/40 py-3 text-sm font-bold text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-40"
        >
          {testing
            ? <><Loader2 size={14} className="animate-spin" /> Enviando…</>
            : <><Send size={14} /> Enviar notificação de teste</>
          }
        </motion.button>
      )}

      {/* Test result */}
      <AnimatePresence>
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
              testResult === "ok"
                ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-300"
                : "border-red-500/30 bg-red-500/8 text-red-300"
            }`}
          >
            {testResult === "ok"
              ? <><CheckCircle2 size={13} /> Notificação enviada! Verifique seu celular.</>
              : <><XCircle size={13} /> Falha no envio. Verifique as configurações do servidor.</>
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Guide */}
      {(status === "ios_not_installed" || isIos) && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
          <button
            onClick={() => setShowGuide(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <Smartphone size={14} className="text-amber-400" />
              <span className="text-xs font-black text-amber-300">Guia para iPhone / iPad</span>
            </div>
            {showGuide ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
          </button>

          <AnimatePresence>
            {showGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden px-4 pb-4"
              >
                <ol className="space-y-2 text-[11px] text-zinc-400">
                  {[
                    "Abra o Will Treinos PRO no Safari (não Chrome ou outro navegador).",
                    "Toque no botão Compartilhar (□↑) na barra inferior do Safari.",
                    'Selecione "Adicionar à Tela de Início".',
                    "Abra o app pelo ícone criado na tela inicial (não pelo Safari).",
                    'Volte nesta tela e toque em "Ativar Notificações".',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <p className="text-[10px] text-zinc-600 mt-3">Requer iOS 16.4 ou superior.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* What you'll receive */}
      <div className="rounded-2xl border border-zinc-800/40 bg-zinc-900/20 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2.5">Você receberá alertas de</p>
        <div className="space-y-1.5">
          {[
            { emoji: "⭐", text: "Avaliações do professor" },
            { emoji: "🔄", text: "Reposições confirmadas" },
            { emoji: "💬", text: "Recados do coach" },
            { emoji: "🏆", text: "Destaques da semana" },
            { emoji: "💳", text: "Lembretes de pagamento" },
            { emoji: "⚡", text: "Desafios diários (08h)" },
          ].map(({ emoji, text }) => (
            <div key={text} className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="text-sm">{emoji}</span>
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-end justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl border-t border-x border-zinc-800 bg-[#0a0a0a] pb-safe"
        style={{ maxHeight: "90dvh", display: "flex", flexDirection: "column" }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-zinc-700" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10">
              <Bell size={17} className="text-[#EAB308]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Notificações Push</h2>
              <p className="text-[10px] text-zinc-500">Alertas direto no seu celular</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {content}
        </div>
      </motion.div>
    </motion.div>
  );
}
