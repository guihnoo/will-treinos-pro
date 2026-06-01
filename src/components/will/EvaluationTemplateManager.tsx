"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClipboardList, Plus, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useCatalog } from "@/context/CatalogContext";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";
import { MODAL_OVERLAY_FADE, SPRING_PREMIUM } from "@/components/ui/motionTokens";

export interface EvaluationTemplate {
  id: string;
  category_id: string;
  name: string;
  weights: Record<string, number>;
  is_default: boolean;
  created_at: string;
}

const PILLARS = [
  { key: "fisico",   label: "Físico" },
  { key: "tecnico",  label: "Técnico" },
  { key: "tatico",   label: "Tático" },
  { key: "atitude",  label: "Atitude" },
  { key: "evolucao", label: "Evolução" },
];

const DEFAULT_WEIGHTS: Record<string, number> = {
  fisico: 1.0,
  tecnico: 1.0,
  tatico: 1.0,
  atitude: 1.0,
  evolucao: 1.0,
};

interface Props {
  onClose: () => void;
}

export default function EvaluationTemplateManager({ onClose }: Props) {
  const { categories } = useCatalog();

  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [formCategoryId, setFormCategoryId] = useState(categories[0]?.id ?? "");
  const [formName, setFormName] = useState("");
  const [formWeights, setFormWeights] = useState<Record<string, number>>({ ...DEFAULT_WEIGHTS });
  const [formIsDefault, setFormIsDefault] = useState(false);

  const fetchTemplates = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) { setLoading(false); return; }
    const { data } = await sb
      .from("evaluation_templates")
      .select("*")
      .order("created_at", { ascending: false });
    setTemplates((data as EvaluationTemplate[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchTemplates(); }, [fetchTemplates]);

  const handleCreate = async () => {
    if (!formName.trim() || !formCategoryId) return;
    setSaving(true);
    try {
      const sb = getSupabaseClient();
      if (!sb) throw new Error("no_client");
      const { error } = await sb.from("evaluation_templates").insert({
        category_id: formCategoryId,
        name: formName.trim(),
        weights: formWeights,
        is_default: formIsDefault,
      });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setFormName("");
      setFormWeights({ ...DEFAULT_WEIGHTS });
      setFormIsDefault(false);
      setShowForm(false);
      void fetchTemplates();
    } catch {
      // silent — will show no feedback
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from("evaluation_templates").delete().eq("id", id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const getCategoryColor = (id: string) => categories.find((c) => c.id === id)?.color ?? "#EAB308";
  const getCategoryEmoji = (id: string) => categories.find((c) => c.id === id)?.emoji ?? "🏐";

  return (
    <motion.div
      {...MODAL_OVERLAY_FADE}
      className={MODAL_FIXED_OVERLAY_SCROLL}
      style={{ zIndex: 300 }}
      onClick={onClose}
      data-modal-overlay
    >
      <div className={MODAL_OVERLAY_CENTER_WRAP} onClick={(e) => e.stopPropagation()}>
        <motion.div
          initial={{ y: 48, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 48, opacity: 0, scale: 0.97 }}
          transition={SPRING_PREMIUM}
          className={MODAL_PANEL_COLUMN + " max-w-lg border border-emerald-900/50 bg-zinc-950 rounded-3xl"}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between gap-3 border-b border-emerald-900/40 px-5 py-4 bg-emerald-950/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                <ClipboardList className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Avaliação</p>
                <h3 className="text-base font-black text-white">Templates de Pesos</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid="eval-templates-close"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700/60 bg-zinc-900/60 text-zinc-400 transition hover:text-white"
              aria-label="Fechar templates"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className={MODAL_BODY_SCROLL + " px-4 py-4 space-y-4"}>
            {/* Success banner */}
            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <p className="text-[11px] font-bold text-emerald-300">Template criado com sucesso!</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add template button */}
            {!showForm && (
              <button
                type="button"
                data-testid="btn-add-eval-template"
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/8 px-4 py-3 text-sm font-black text-emerald-300 hover:bg-emerald-500/15 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Criar Template
              </button>
            )}

            {/* Form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/20 p-4 space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Novo Template</p>

                    {/* Category chips */}
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-wide">Categoria</p>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFormCategoryId(cat.id)}
                            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all ${
                              formCategoryId === cat.id
                                ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                                : "border-zinc-700/50 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600"
                            }`}
                          >
                            {cat.emoji} {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Nome do Template</p>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ex: Avançado — Foco Técnico"
                        className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/60 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500/50 focus:outline-none transition-colors"
                        maxLength={80}
                      />
                    </div>

                    {/* Sliders */}
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-wide">Multiplicadores de Peso</p>
                      <div className="space-y-3">
                        {PILLARS.map((p) => {
                          const val = formWeights[p.key] ?? 1.0;
                          return (
                            <div key={p.key} className="flex items-center gap-3">
                              <p className="text-[11px] font-bold text-zinc-300 w-20 shrink-0">{p.label}</p>
                              <input
                                type="range"
                                min={0.5}
                                max={3.0}
                                step={0.1}
                                value={val}
                                onChange={(e) =>
                                  setFormWeights((w) => ({ ...w, [p.key]: parseFloat(e.target.value) }))
                                }
                                className="flex-1 accent-emerald-500 cursor-pointer"
                              />
                              <span className="text-[12px] font-black text-emerald-400 w-10 text-right shrink-0">
                                {val.toFixed(1)}x
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Default toggle */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormIsDefault((v) => !v)}
                        className={`relative h-5 w-10 rounded-full transition-colors ${
                          formIsDefault ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                        aria-label="Toggle template padrão"
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                            formIsDefault ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <p className="text-[11px] text-zinc-300 font-bold">Template padrão desta categoria</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 rounded-xl border border-zinc-700/50 bg-zinc-800/40 py-2.5 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleCreate}
                        disabled={saving || !formName.trim() || !formCategoryId}
                        className="flex-[2] flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 py-2.5 text-[12px] font-black text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50 transition-all"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Criar Template
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Templates list */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 h-24" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="py-8 text-center">
                <ClipboardList className="mx-auto h-10 w-10 text-zinc-700 mb-2" />
                <p className="text-sm font-bold text-zinc-500">Nenhum template criado ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => {
                  const catColor = getCategoryColor(t.category_id);
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="shrink-0 text-sm font-bold"
                            style={{ color: catColor }}
                          >
                            {getCategoryEmoji(t.category_id)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-white truncate">{t.name}</p>
                            <p className="text-[10px]" style={{ color: catColor }}>
                              {getCategoryName(t.category_id)}
                              {t.is_default && (
                                <span className="ml-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black text-emerald-400">
                                  Padrão
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          data-testid={`btn-delete-template-${t.id}`}
                          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/8 text-red-500/60 hover:text-red-400 hover:border-red-500/40 transition-colors"
                          aria-label="Deletar template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Mini weight bars */}
                      <div className="space-y-1">
                        {PILLARS.map((p) => {
                          const w = (t.weights[p.key] ?? 1.0);
                          const pct = Math.min(100, ((w - 0.5) / 2.5) * 100);
                          return (
                            <div key={p.key} className="flex items-center gap-2">
                              <p className="text-[9px] text-zinc-600 w-14 shrink-0">{p.label}</p>
                              <div className="flex-1 h-1.5 rounded-full bg-zinc-800">
                                <div
                                  className="h-full rounded-full bg-emerald-500/70"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-zinc-500 w-8 text-right">{w.toFixed(1)}x</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
