"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Dumbbell, CheckCircle2, Loader2, Zap } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";

const ACTIVITIES = [
  { id: "fundamentos",  label: "Fundamentos",     emoji: "🏐" },
  { id: "condicionamento", label: "Condicionamento", emoji: "💪" },
  { id: "saque",        label: "Saque",            emoji: "🎯" },
  { id: "ataque",       label: "Ataque",           emoji: "⚡" },
  { id: "defesa",       label: "Defesa",           emoji: "🛡️" },
  { id: "levantamento", label: "Levantamento",     emoji: "🤲" },
  { id: "fisico",       label: "Físico geral",     emoji: "🏃" },
  { id: "outro",        label: "Outro",            emoji: "📝" },
] as const;

interface Props {
  studentCrmId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FreeTrainingSheet({ studentCrmId, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const [activity, setActivity] = useState<string | null>(null);
  const [note, setNote]         = useState("");
  const [intensity, setIntensity] = useState(3); // 1-5
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(false);

  const XP_BY_INTENSITY: Record<number, number> = { 1: 10, 2: 15, 3: 20, 4: 25, 5: 30 };
  const xp = XP_BY_INTENSITY[intensity] ?? 20;

  async function handleSave() {
    if (!activity) return;
    setSaving(true);
    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Sem sessão");

      const actLabel = ACTIVITIES.find(a => a.id === activity)?.label ?? activity;

      // Award XP
      const res = await fetch("/api/xp/integration", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          studentId:      studentCrmId,
          points:         xp,
          type:           "checkin",
          multiplierType: "none",
          multiplierValue: 1,
          sourceEntity:   "training",
          sourceId:       `free_${Date.now()}`,
          createdBy:      session.user.id,
          notes:          `Treino livre: ${actLabel}${note.trim() ? ` — ${note.trim()}` : ""}`,
        }),
      });

      if (!res.ok) throw new Error("Erro ao registrar treino");
      setDone(true);
      onSuccess?.();
      toast(`⚡ Treino livre registrado! +${xp} XP`);
    } catch (e) {
      toast(String(e).replace("Error: ", ""), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-end justify-center"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg rounded-t-3xl border-t border-x border-zinc-800 bg-[#0a0a0a] pb-safe"
          style={{ maxHeight: "88dvh", display: "flex", flexDirection: "column" }}
        >
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="h-1 w-10 rounded-full bg-zinc-700" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/10">
                <Dumbbell size={17} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Treino Livre</h2>
                <p className="text-[10px] text-zinc-500">Registre um treino fora das aulas</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {done ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10"
                >
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </motion.div>
                <div>
                  <p className="text-base font-black text-white">Treino registrado!</p>
                  <p className="text-sm text-zinc-400 mt-1">+{xp} XP adicionados ao seu total.</p>
                </div>
                <button onClick={onClose} className="mt-2 w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-black text-emerald-200 hover:bg-emerald-500/20 transition-colors">
                  Fechar
                </button>
              </div>
            ) : (
              <>
                {/* Activity picker */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-2">Tipo de treino</p>
                  <div className="grid grid-cols-4 gap-2">
                    {ACTIVITIES.map(a => (
                      <motion.button
                        key={a.id}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setActivity(a.id)}
                        className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition-all ${
                          activity === a.id
                            ? "border-emerald-500/50 bg-emerald-500/12 text-white"
                            : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-xl">{a.emoji}</span>
                        <span className="text-[9px] font-bold leading-tight">{a.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Intensity */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-2">
                    Intensidade · <span className="text-emerald-400">+{xp} XP</span>
                  </p>
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map(v => (
                      <motion.button
                        key={v}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIntensity(v)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-black transition-all ${
                          v <= intensity
                            ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                            : "border-zinc-800 bg-zinc-900/40 text-zinc-600"
                        }`}
                      >
                        {"🔥".repeat(v)}
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-700 mt-1 px-1">
                    <span>Leve</span><span>Moderado</span><span>Máximo</span>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-2">Observação (opcional)</p>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Ex: Trabalhei saque flutuante por 30 min…"
                    maxLength={200}
                    rows={2}
                    className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={!activity || saving}
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 py-3.5 text-sm font-black text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-40 transition-colors"
                >
                  {saving
                    ? <><Loader2 size={16} className="animate-spin" /> Registrando…</>
                    : <><Zap size={16} /> Registrar Treino (+{xp} XP)</>
                  }
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
