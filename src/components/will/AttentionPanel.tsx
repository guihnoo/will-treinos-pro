"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, AlertTriangle, RefreshCw, Loader2,
  CreditCard, CalendarX, TrendingDown, UserX, MessageSquare,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import UserAvatar from "@/components/ui/UserAvatar";
import { useToast } from "@/components/Toast";

interface StudentAlert {
  id: string;
  name: string;
  avatar: string;
  reason: string;
  detail: string;
  type: "payment" | "absent" | "declining" | "inactive";
  severity: "high" | "medium";
}

interface Props { onClose: () => void }

const TYPE_META = {
  payment:   { icon: CreditCard,    color: "text-red-400",    bg: "bg-red-500/8",    border: "border-red-500/20",    label: "Pagamento"  },
  absent:    { icon: CalendarX,     color: "text-orange-400", bg: "bg-orange-500/8", border: "border-orange-500/20", label: "Faltas"     },
  declining: { icon: TrendingDown,  color: "text-amber-400",  bg: "bg-amber-500/8",  border: "border-amber-500/20",  label: "Desempenho" },
  inactive:  { icon: UserX,         color: "text-zinc-400",   bg: "bg-zinc-500/8",   border: "border-zinc-700/40",   label: "Inativo"    },
};

export default function AttentionPanel({ onClose }: Props) {
  const { toast } = useToast();
  const [alerts, setAlerts]   = useState<StudentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabaseClient();
      const found: StudentAlert[] = [];

      // 1. Late payments
      const { data: latePayments } = await sb
        .from("payments")
        .select("student_id, students(name, avatar)")
        .eq("status", "late")
        .limit(20);

      for (const p of latePayments ?? []) {
        const st = Array.isArray(p.students) ? p.students[0] : p.students;
        if (!st) continue;
        found.push({
          id:       `pay_${p.student_id}`,
          name:     st.name as string,
          avatar:   st.avatar as string ?? "",
          reason:   "Mensalidade em atraso",
          detail:   "Pagamento não realizado no prazo.",
          type:     "payment",
          severity: "high",
        });
      }

      // 2. Students absent 14+ days
      const since14 = new Date();
      since14.setDate(since14.getDate() - 14);
      const { data: xpRecent } = await sb
        .from("xp_log")
        .select("student_id, created_at")
        .gte("created_at", since14.toISOString())
        .eq("type", "checkin");

      const recentIds = new Set((xpRecent ?? []).map(r => r.student_id as string));

      const { data: activeStudents } = await sb
        .from("students")
        .select("id, name, avatar")
        .eq("status", "active")
        .limit(100);

      for (const s of activeStudents ?? []) {
        if (!recentIds.has(s.id as string)) {
          // Skip if already flagged as late payment
          if (found.some(f => f.id.includes(s.id as string))) continue;
          found.push({
            id:       `absent_${s.id}`,
            name:     s.name as string,
            avatar:   s.avatar as string ?? "",
            reason:   "Sem presença há 14+ dias",
            detail:   "Último check-in há mais de 2 semanas.",
            type:     "inactive",
            severity: "medium",
          });
        }
      }

      // 3. Declining performance — avg_score dropping
      const { data: evalData } = await sb
        .from("evaluations")
        .select("student_id, avg_score, created_at, students(name, avatar)")
        .order("created_at", { ascending: false })
        .limit(200);

      const byStudent: Record<string, number[]> = {};
      for (const row of evalData ?? []) {
        const sid = row.student_id as string;
        if (!byStudent[sid]) byStudent[sid] = [];
        byStudent[sid].push(row.avg_score as number);
      }

      for (const [sid, scores] of Object.entries(byStudent)) {
        if (scores.length < 3) continue;
        const recent3 = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const prev3   = scores.slice(3, 6).length
          ? scores.slice(3, 6).reduce((a, b) => a + b, 0) / scores.slice(3, 6).length
          : null;
        if (prev3 !== null && recent3 < prev3 - 1.0) {
          const row = (evalData ?? []).find(r => r.student_id === sid);
          if (!row) continue;
          const st = Array.isArray(row.students) ? row.students[0] : row.students;
          if (!st) continue;
          if (found.some(f => f.name === (st as { name: string }).name)) continue;
          found.push({
            id:       `decline_${sid}`,
            name:     (st as { name: string }).name,
            avatar:   (st as { avatar: string }).avatar ?? "",
            reason:   "Queda de desempenho",
            detail:   `Média recente ${recent3.toFixed(1)} vs anterior ${prev3.toFixed(1)} (–${(prev3-recent3).toFixed(1)} pts).`,
            type:     "declining",
            severity: "medium",
          });
        }
      }

      // Sort: high severity first
      found.sort((a, b) => (a.severity === "high" ? -1 : 1) - (b.severity === "high" ? -1 : 1));
      setAlerts(found.slice(0, 20));
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function sendAlert(alert: StudentAlert) {
    setNotifying(alert.id);
    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) return;

      const studentId = alert.id.split("_")[1];
      const messages: Record<StudentAlert["type"], string> = {
        payment:   "💳 Olá! Sua mensalidade está em aberto. Qualquer dúvida, fale com a gente!",
        absent:    "🏐 Sentimos sua falta! Quando puder, venha treinar — estamos esperando por você.",
        declining: "💪 Vamos trabalhar juntos para recuperar o seu desempenho? Fale com o coach!",
        inactive:  "⚡ Você tem feito falta na quadra! Volte logo.",
      };

      await fetch("/api/messages/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          studentId,
          message: messages[alert.type],
        }),
      });
      toast(`✅ Mensagem enviada para ${alert.name.split(" ")[0]}`);
    } catch {
      toast("Erro ao enviar mensagem.", "error");
    } finally {
      setNotifying(null);
    }
  }

  const grouped = {
    high:   alerts.filter(a => a.severity === "high"),
    medium: alerts.filter(a => a.severity === "medium"),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[180] bg-black/80 backdrop-blur-sm flex items-end justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl border-t border-x border-zinc-800 bg-[#0a0a0a] pb-safe"
        style={{ maxHeight: "92dvh", display: "flex", flexDirection: "column" }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-zinc-700" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/35 bg-red-500/10">
              <AlertTriangle size={17} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Requer Atenção</h2>
              <p className="text-[10px] text-zinc-500">
                {loading ? "Analisando…" : `${alerts.length} aluno${alerts.length !== 1 ? "s" : ""} precisam de contato`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={onClose} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-14">
              <Loader2 size={26} className="animate-spin text-red-400" />
              <p className="text-xs text-zinc-500">Verificando alunos…</p>
            </div>
          )}

          {!loading && alerts.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/8">
                <AlertTriangle size={22} className="text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-white">Tudo certo!</p>
              <p className="text-xs text-zinc-500">Nenhum aluno requer atenção imediata.</p>
            </div>
          )}

          {!loading && grouped.high.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">🚨 Urgente</p>
              <div className="space-y-2">
                {grouped.high.map(alert => <AlertCard key={alert.id} alert={alert} onSend={() => sendAlert(alert)} sending={notifying === alert.id} />)}
              </div>
            </div>
          )}

          {!loading && grouped.medium.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">⚠️ Atenção</p>
              <div className="space-y-2">
                {grouped.medium.map(alert => <AlertCard key={alert.id} alert={alert} onSend={() => sendAlert(alert)} sending={notifying === alert.id} />)}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AlertCard({ alert, onSend, sending }: { alert: StudentAlert; onSend: () => void; sending: boolean }) {
  const meta = TYPE_META[alert.type];
  const Icon = meta.icon;
  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${meta.border} ${meta.bg}`}>
      <UserAvatar name={alert.name} photo={alert.avatar} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Icon size={11} className={meta.color} />
          <p className="text-xs font-bold text-white truncate">{alert.name.split(" ")[0]}</p>
        </div>
        <p className="text-[10px] text-zinc-500 truncate">{alert.reason}</p>
        {alert.detail && <p className="text-[10px] text-zinc-700 italic truncate">{alert.detail}</p>}
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onSend}
        disabled={sending}
        className={`flex-shrink-0 flex items-center gap-1 rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-2.5 py-1.5 text-[10px] font-black text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-40`}
      >
        {sending ? <Loader2 size={10} className="animate-spin" /> : <MessageSquare size={10} />}
        Msg
      </motion.button>
    </div>
  );
}
