"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, CheckCheck, Loader2, Bell } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";
import { MODAL_OVERLAY_FADE, SPRING_PREMIUM } from "@/components/ui/motionTokens";

interface CoachMessage {
  id: string;
  from_name: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

interface Props {
  studentCrmId: string;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function StudentMessagesPanel({ studentCrmId, onClose, onUnreadCountChange }: Props) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    try {
      const sb = getSupabaseClient();
      const { data, error } = await sb
        .from("coach_messages")
        .select("id, from_name, message, created_at, read_at")
        .eq("to_student_id", studentCrmId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        const msgs = data as CoachMessage[];
        setMessages(msgs);
        const unread = msgs.filter((m) => !m.read_at).length;
        onUnreadCountChange?.(unread);
      }
    } finally {
      setLoading(false);
    }
  }, [studentCrmId, onUnreadCountChange]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  async function markAllRead() {
    const sb = getSupabaseClient();
    await sb
      .from("coach_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("to_student_id", studentCrmId)
      .is("read_at", null);
    setMessages((prev) => prev.map((m) => ({ ...m, read_at: m.read_at ?? new Date().toISOString() })));
    onUnreadCountChange?.(0);
  }

  const unreadCount = messages.filter((m) => !m.read_at).length;

  return (
    <AnimatePresence>
      <motion.div
        key="messages-overlay"
        {...MODAL_OVERLAY_FADE}
        className={MODAL_FIXED_OVERLAY_SCROLL}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className={MODAL_OVERLAY_CENTER_WRAP}>
          <motion.div
            key="messages-panel"
            {...SPRING_PREMIUM}
            className={`${MODAL_PANEL_COLUMN} max-w-md w-full rounded-3xl border border-[#EAB308]/30 bg-[#09090a] shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAB308]/40 bg-[#EAB308]/10">
                  <MessageCircle className="h-5 w-5 text-[#EAB308]" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EAB308] text-[9px] font-black text-black">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Recados do Coach</h2>
                  <p className="text-[11px] text-zinc-500">
                    {unreadCount > 0 ? `${unreadCount} não lido${unreadCount > 1 ? "s" : ""}` : "Tudo lido"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors"
                  >
                    <CheckCheck size={12} />
                    Marcar lidos
                  </motion.button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className={`${MODAL_BODY_SCROLL} px-5 py-4 space-y-3`}>
              {loading && (
                <div className="flex items-center justify-center py-14">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#EAB308]/20 bg-[#EAB308]/5">
                    <Bell className="h-7 w-7 text-[#EAB308]/40" />
                  </div>
                  <p className="text-sm font-bold text-zinc-400">Nenhum recado ainda.</p>
                  <p className="text-xs text-zinc-600 max-w-[220px]">
                    Quando o coach enviar um recado pessoal para você, aparecerá aqui.
                  </p>
                </div>
              )}

              {!loading && messages.map((msg) => (
                <MessageCard key={msg.id} msg={msg} />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function MessageCard({ msg }: { msg: CoachMessage }) {
  const dateStr = new Date(msg.created_at).toLocaleDateString("pt-BR", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
  const isUnread = !msg.read_at;

  return (
    <div className={`relative rounded-2xl border p-4 transition-all ${
      isUnread
        ? "border-[#EAB308]/35 bg-[#EAB308]/5 shadow-[0_0_12px_rgba(234,179,8,0.06)]"
        : "border-zinc-800/60 bg-zinc-950/50"
    }`}>
      {isUnread && (
        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#EAB308] animate-pulse" />
      )}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EAB308]/30 bg-[#EAB308]/10 flex-shrink-0">
          <MessageCircle size={13} className="text-[#EAB308]" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black text-[#EAB308] truncate">{msg.from_name}</p>
          <p className="text-[9px] text-zinc-600">{dateStr}</p>
        </div>
      </div>
      <p className="text-sm text-zinc-200 leading-relaxed">{msg.message}</p>
    </div>
  );
}

// Re-export hook from its own file so lazy consumers don't need to import this module
export { useCoachMessagesUnread } from "@/hooks/useCoachMessagesUnread";
