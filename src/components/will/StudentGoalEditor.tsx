"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Check, Loader2, Trash2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";

interface Goal {
  id: string;
  title: string;
  description?: string;
  target_type: string;
  target_value?: number;
  target_tier?: string;
  deadline?: string;
  status: string;
}

interface Props {
  studentId: string;
  studentName: string;
}

const TIER_OPTIONS = [
  { value: "bronze",   label: "🥉 Bronze"   },
  { value: "prata",    label: "🥈 Prata"    },
  { value: "ouro",     label: "🥇 Ouro"     },
  { value: "diamante", label: "💎 Diamante"  },
  { value: "elite",    label: "👑 Elite"     },
];

export default function StudentGoalEditor({ studentId, studentName }: Props) {
  const { toast } = useToast();
  const [goals, setGoals]       = useState<Goal[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [targetType, setTargetType]   = useState<"xp" | "checkins" | "tier" | "custom">("xp");
  const [targetValue, setTargetValue] = useState("");
  const [targetTier, setTargetTier]   = useState("ouro");
  const [deadline, setDeadline]       = useState("");

  const firstName = studentName.split(" ")[0];

  async function loadGoals() {
    const sb = getSupabaseClient();
    const { data } = await sb
      .from("student_goals")
      .select("id, title, description, target_type, target_value, target_tier, deadline, status")
      .eq("student_id", studentId)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    setGoals(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadGoals(); }, [studentId]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      const { error } = await sb.from("student_goals").insert({
        student_id:  studentId,
        created_by:  session?.user.id ?? null,
        title:       title.trim(),
        description: description.trim() || null,
        target_type: targetType,
        target_value: targetType !== "tier" && targetType !== "custom" && targetValue
          ? parseInt(targetValue)
          : null,
        target_tier: targetType === "tier" ? targetTier : null,
        deadline:    deadline || null,
      });
      if (error) throw new Error(error.message);
      toast(`✅ Meta definida para ${firstName}!`);
      setTitle(""); setDescription(""); setTargetValue(""); setDeadline("");
      setShowForm(false);
      loadGoals();
    } catch (e) {
      toast(`Erro: ${String(e).replace("Error: ", "")}`, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(goalId: string) {
    const sb = getSupabaseClient();
    await sb.from("student_goals").update({ status: "cancelled" }).eq("id", goalId);
    setGoals(prev => prev.filter(g => g.id !== goalId));
    toast("Meta removida.");
  }

  async function handleAchieve(goalId: string) {
    const sb = getSupabaseClient();
    await sb.from("student_goals").update({ status: "achieved", achieved_at: new Date().toISOString() }).eq("id", goalId);
    setGoals(prev => prev.filter(g => g.id !== goalId));
    toast(`🏆 Meta marcada como conquistada!`);
  }

  function targetLabel(g: Goal) {
    if (g.target_type === "xp" && g.target_value)       return `${g.target_value >= 1000 ? `${(g.target_value / 1000).toFixed(1)}k` : g.target_value} XP`;
    if (g.target_type === "checkins" && g.target_value) return `${g.target_value} check-ins`;
    if (g.target_type === "tier" && g.target_tier)      return `Tier ${g.target_tier.charAt(0).toUpperCase() + g.target_tier.slice(1)}`;
    return "Meta personalizada";
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Metas para {firstName}</p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-[10px] font-black text-[#EAB308] hover:text-amber-300 transition-colors"
        >
          {showForm ? "Cancelar" : "+ Nova meta"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2.5 overflow-hidden"
        >
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título da meta (ex: Chegar ao Ouro)"
            maxLength={80}
            className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={targetType}
              onChange={e => setTargetType(e.target.value as typeof targetType)}
              className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-2 py-2 text-xs text-white focus:outline-none"
            >
              <option value="xp">Meta de XP</option>
              <option value="checkins">Meta de check-ins</option>
              <option value="tier">Atingir tier</option>
              <option value="custom">Personalizada</option>
            </select>
            {targetType === "tier" ? (
              <select
                value={targetTier}
                onChange={e => setTargetTier(e.target.value)}
                className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-2 py-2 text-xs text-white focus:outline-none"
              >
                {TIER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : targetType !== "custom" ? (
              <input
                value={targetValue}
                onChange={e => setTargetValue(e.target.value)}
                placeholder={targetType === "xp" ? "Ex: 3000" : "Ex: 20"}
                type="number"
                className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
              />
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              type="date"
              placeholder="Prazo (opcional)"
              className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2 text-xs text-white focus:outline-none"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!title.trim() || saving}
              onClick={handleSave}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 py-2 text-xs font-black text-amber-200 hover:bg-amber-500/25 disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Target size={12} />}
              Definir Meta
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Goals list */}
      {loading && <p className="text-[10px] text-zinc-600">Carregando metas…</p>}
      {!loading && goals.length === 0 && !showForm && (
        <p className="text-[10px] text-zinc-700 italic">Nenhuma meta ativa. Clique em "+ Nova meta" para definir.</p>
      )}
      {goals.map(g => (
        <div key={g.id} className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-3 py-2.5 flex items-center gap-2">
          <Target size={13} className="text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{g.title}</p>
            <p className="text-[10px] text-zinc-500">
              {targetLabel(g)}{g.deadline ? ` · até ${new Date(g.deadline + "T00:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}` : ""}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => handleAchieve(g.id)} title="Marcar como conquistada" className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 p-1.5 text-emerald-400 hover:bg-emerald-800/30 transition-colors">
              <Check size={11} />
            </button>
            <button onClick={() => handleDelete(g.id)} title="Remover meta" className="rounded-lg border border-zinc-700/40 bg-zinc-900/40 p-1.5 text-zinc-600 hover:text-red-400 transition-colors">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
