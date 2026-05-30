"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X, Users, Send, CheckCircle2, Loader2, Tag } from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";
import { MODAL_OVERLAY_FADE, SPRING_PREMIUM } from "@/components/ui/motionTokens";

type TargetType = "all" | "category";

interface Props {
  onClose: () => void;
}

export default function BroadcastMessagePanel({ onClose }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { categories } = useCatalog();

  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ inserted: number; pushSent: number } | null>(null);

  // Fetch recipient preview
  useEffect(() => {
    if (targetType === "category" && !selectedCategoryId) {
      setRecipientCount(null);
      return;
    }
    const params = new URLSearchParams({ targetType });
    if (targetType === "category" && selectedCategoryId) params.set("categoryId", selectedCategoryId);

    const controller = new AbortController();
    (async () => {
      try {
        const sb = getSupabaseClient();
        const { data: { session } } = await sb.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch(`/api/messages/broadcast?${params}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setRecipientCount(data.count ?? 0);
        }
      } catch { /* aborted */ }
    })();
    return () => controller.abort();
  }, [targetType, selectedCategoryId]);

  async function handleSend() {
    if (!message.trim() || !user) return;
    if (targetType === "category" && !selectedCategoryId) {
      toast("Selecione uma categoria.");
      return;
    }
    setSending(true);
    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Sem sessão");

      const res = await fetch("/api/messages/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: message.trim(),
          targetType,
          categoryId: targetType === "category" ? selectedCategoryId : undefined,
          fromName: user.name ?? "Coach",
        }),
      });

      if (!res.ok) throw new Error("Erro ao enviar anúncio");
      const data = await res.json();
      setDone({ inserted: data.inserted, pushSent: data.pushSent });
      toast(`📢 Anúncio enviado para ${data.inserted} aluno${data.inserted !== 1 ? "s" : ""}!`);
    } catch (e) {
      toast(String(e).replace("Error: ", ""));
    } finally {
      setSending(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <AnimatePresence>
      <motion.div
        key="broadcast-overlay"
        {...MODAL_OVERLAY_FADE}
        className={MODAL_FIXED_OVERLAY_SCROLL}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className={MODAL_OVERLAY_CENTER_WRAP}>
          <motion.div
            key="broadcast-panel"
            {...SPRING_PREMIUM}
            className={`${MODAL_PANEL_COLUMN} max-w-md w-full rounded-3xl border border-violet-500/30 bg-[#09090b] shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800/60 px-5 py-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/40 bg-violet-500/10">
                  <Megaphone size={20} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Enviar Anúncio</h2>
                  <p className="text-[11px] text-zinc-500">Mensagem direta para grupo de alunos</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className={`${MODAL_BODY_SCROLL} px-5 py-4 space-y-4`}>
              {done ? (
                /* Success state */
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/40 bg-violet-500/10"
                  >
                    <CheckCircle2 size={32} className="text-violet-400" />
                  </motion.div>
                  <div>
                    <p className="text-base font-black text-white">Anúncio enviado!</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Entregue para <span className="font-bold text-white">{done.inserted}</span> aluno{done.inserted !== 1 ? "s" : ""}.
                      {done.pushSent > 0 && (
                        <> <span className="text-violet-300">{done.pushSent} push</span> enviado{done.pushSent !== 1 ? "s" : ""}.</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => { setDone(null); setMessage(""); }}
                      className="flex-1 rounded-2xl border border-violet-500/30 bg-violet-500/10 py-3 text-sm font-black text-violet-200 hover:bg-violet-500/20 transition-colors"
                    >
                      Novo anúncio
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-black text-zinc-400 hover:text-white transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Target selector */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-2">Destinatários</p>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTargetType("all")}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                          targetType === "all"
                            ? "border-violet-500/60 bg-violet-500/15 text-white"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <Users size={13} />
                        Todos os alunos
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTargetType("category")}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                          targetType === "category"
                            ? "border-violet-500/60 bg-violet-500/15 text-white"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <Tag size={13} />
                        Por categoria
                      </motion.button>
                    </div>
                  </div>

                  {/* Category picker */}
                  <AnimatePresence>
                    {targetType === "category" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-2">Categoria</p>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((cat) => (
                            <motion.button
                              key={cat.id}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedCategoryId(cat.id)}
                              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all ${
                                selectedCategoryId === cat.id
                                  ? "border-opacity-60 text-white"
                                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                              }`}
                              style={selectedCategoryId === cat.id ? {
                                borderColor: `${cat.color}60`,
                                background: `${cat.color}18`,
                                color: "white",
                              } : {}}
                            >
                              <span>{cat.emoji}</span>
                              {cat.name}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Recipient count preview */}
                  {recipientCount !== null && (
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-3 py-2">
                      <Users size={13} className="text-zinc-500" />
                      <p className="text-xs text-zinc-400">
                        Será enviado para{" "}
                        <span className="font-black text-white">{recipientCount}</span>{" "}
                        aluno{recipientCount !== 1 ? "s" : ""}
                        {selectedCategory ? ` de ${selectedCategory.name}` : ""}
                      </p>
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">Mensagem</p>
                      <span className="text-[10px] text-zinc-600">{message.length}/500</span>
                    </div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ex: Quadra ocupada terça-feira, aula transferida para quarta às 19h."
                      maxLength={500}
                      rows={4}
                      className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2.5 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-violet-500/40 transition-colors leading-relaxed"
                    />
                  </div>

                  {/* Send */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={!message.trim() || sending || (targetType === "category" && !selectedCategoryId)}
                    onClick={handleSend}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-violet-500/40 bg-violet-500/15 py-3.5 text-sm font-black text-violet-200 hover:bg-violet-500/25 transition-colors disabled:opacity-40"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {sending ? "Enviando…" : `Enviar Anúncio${recipientCount !== null ? ` (${recipientCount})` : ""}`}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
