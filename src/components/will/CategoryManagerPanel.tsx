"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Pencil, Trash2, Layers, Check, AlertTriangle } from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useStudents } from "@/context/StudentsContext";
import type { LessonCategory, WithoutId } from "@/context/types";
import {
  MODAL_BADGE_ENTER,
  MODAL_HEADER_ENTER,
  MODAL_OVERLAY_FADE,
  PRESS_SCALE,
  SPRING_PREMIUM,
} from "@/components/ui/motionTokens";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";

const INTERACTIVE_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

const EMOJI_SUGGESTIONS = ["🏐", "⚡", "🥇", "🎯", "💎", "🔥", "🌟", "🏆", "⚔️", "🌊"];

const COLOR_OPTIONS: { value: string; label: string; bg: string; border: string; text: string }[] = [
  { value: "amber",   label: "Âmbar",   bg: "bg-amber-500/20",   border: "border-amber-500/60",   text: "text-amber-300" },
  { value: "emerald", label: "Esmeralda", bg: "bg-emerald-500/20", border: "border-emerald-500/60", text: "text-emerald-300" },
  { value: "blue",    label: "Azul",    bg: "bg-blue-500/20",    border: "border-blue-500/60",    text: "text-blue-300" },
  { value: "violet",  label: "Violeta", bg: "bg-violet-500/20",  border: "border-violet-500/60",  text: "text-violet-300" },
  { value: "red",     label: "Vermelho", bg: "bg-red-500/20",     border: "border-red-500/60",     text: "text-red-300" },
  { value: "zinc",    label: "Cinza",   bg: "bg-zinc-600/30",    border: "border-zinc-500/60",    text: "text-zinc-300" },
];

interface FormState {
  name: string;
  emoji: string;
  color: string;
  maxStudents: number;
  schedule: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  emoji: "🏐",
  color: "amber",
  maxStudents: 12,
  schedule: "",
  description: "",
};

interface Props {
  onClose: () => void;
}

export default function CategoryManagerPanel({ onClose }: Props) {
  const { categories, addCategory, updateCategory, deleteCategory } = useCatalog();
  const { students } = useStudents();

  const [formMode, setFormMode] = useState<"idle" | "create" | "edit">("idle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Count students per category
  const studentCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) {
      if (s.status !== "active" && s.status !== "approved") continue;
      for (const catId of s.categories ?? []) {
        map.set(catId, (map.get(catId) ?? 0) + 1);
      }
    }
    return map;
  }, [students]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormMode("create");
    setDeleteConfirmId(null);
  }

  function openEdit(cat: LessonCategory) {
    setForm({
      name: cat.name,
      emoji: cat.emoji || "🏐",
      color: cat.color || "amber",
      maxStudents: cat.maxStudents ?? 12,
      schedule: "",
      description: "",
    });
    setEditingId(cat.id);
    setFormMode("edit");
    setDeleteConfirmId(null);
  }

  function cancelForm() {
    setFormMode("idle");
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload: WithoutId<LessonCategory> = {
        name: form.name.trim(),
        emoji: form.emoji.trim() || "🏐",
        color: form.color,
        maxStudents: Math.max(1, form.maxStudents),
        defaultPrice: 0,
        isCustom: true,
      };
      if (formMode === "create") {
        addCategory(payload);
      } else if (formMode === "edit" && editingId) {
        updateCategory(editingId, payload);
      }
      cancelForm();
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string) {
    deleteCategory(id);
    setDeleteConfirmId(null);
  }

  const colorOpt = (val: string) => COLOR_OPTIONS.find((c) => c.value === val) ?? COLOR_OPTIONS[0];

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Gerenciador de Turmas"
      className={`fixed inset-0 z-[230] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/75`}
      {...MODAL_OVERLAY_FADE}
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      tabIndex={-1}
    >
      <div className={`${MODAL_OVERLAY_CENTER_WRAP} px-3 sm:px-6`}>
        <motion.section
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={SPRING_PREMIUM}
          onClick={(e) => e.stopPropagation()}
          className={`pointer-events-auto my-auto w-full max-w-2xl rounded-3xl border border-white/[0.1] bg-zinc-950 shadow-[0_35px_120px_rgba(0,0,0,0.75)] backdrop-blur-3xl ${MODAL_PANEL_COLUMN}`}
        >
          {/* Header */}
          <motion.div
            {...MODAL_HEADER_ENTER}
            transition={SPRING_PREMIUM}
            className="shrink-0 flex items-center justify-between gap-3 border-b border-violet-500/20 bg-violet-500/10 px-5 py-4 rounded-t-3xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/30">
                <Layers className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <motion.p {...MODAL_BADGE_ENTER} transition={SPRING_PREMIUM} className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">
                  Gestão de Turmas
                </motion.p>
                <h3 className="text-lg font-black text-white">Categorias e Turmas</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {formMode === "idle" && (
                <motion.button
                  whileTap={PRESS_SCALE}
                  type="button"
                  data-testid="btn-new-category"
                  onClick={openCreate}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-2 text-xs font-bold text-violet-200 transition hover:border-violet-400/60 hover:bg-violet-500/25 ${INTERACTIVE_FOCUS_RING}`}
                >
                  <Plus className="h-4 w-4" />
                  Nova Turma
                </motion.button>
              )}
              <motion.button
                whileTap={PRESS_SCALE}
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-zinc-200 transition hover:border-white/30"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>

          {/* Body */}
          <div className={`${MODAL_BODY_SCROLL} p-5 space-y-4`}>

            {/* Inline Form */}
            <AnimatePresence>
              {formMode !== "idle" && (
                <motion.div
                  key="category-form"
                  initial={{ opacity: 0, y: -12, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -12, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-violet-500/25 bg-violet-500/8 p-4 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-400">
                      {formMode === "create" ? "Nova Turma" : "Editar Turma"}
                    </p>

                    {/* Name */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold text-zinc-400">
                        Nome da turma <span className="text-red-400">*</span>
                      </label>
                      <input
                        data-testid="input-category-name"
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Ex: Avançado Noite, Iniciante Manhã..."
                        className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
                        maxLength={60}
                      />
                    </div>

                    {/* Emoji + Color row */}
                    <div className="flex gap-3">
                      {/* Emoji */}
                      <div className="flex-1">
                        <label className="mb-1.5 block text-[11px] font-semibold text-zinc-400">Emoji</label>
                        <div className="flex items-center gap-2">
                          <input
                            data-testid="input-category-emoji"
                            type="text"
                            value={form.emoji}
                            onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value.slice(0, 2) }))}
                            className="w-16 rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2.5 text-center text-lg outline-none transition focus:border-violet-500/60"
                            maxLength={2}
                          />
                          <div className="flex flex-wrap gap-1">
                            {EMOJI_SUGGESTIONS.map((em) => (
                              <button
                                key={em}
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, emoji: em }))}
                                className={`h-8 w-8 rounded-lg text-base transition hover:bg-zinc-700/60 ${form.emoji === em ? "bg-violet-500/25 ring-1 ring-violet-500/50" : "bg-zinc-800/60"}`}
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Color chips */}
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold text-zinc-400">Cor da turma</label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_OPTIONS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            data-testid={`color-chip-${c.value}`}
                            onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${c.bg} ${c.border} ${c.text} ${
                              form.color === c.value ? "ring-2 ring-violet-400/50 ring-offset-1 ring-offset-zinc-950" : "opacity-60 hover:opacity-100"
                            }`}
                          >
                            {form.color === c.value && <Check className="h-3 w-3" />}
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Capacity + Schedule */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold text-zinc-400">Capacidade máxima</label>
                        <input
                          data-testid="input-category-capacity"
                          type="number"
                          min={1}
                          max={100}
                          value={form.maxStudents}
                          onChange={(e) => setForm((f) => ({ ...f, maxStudents: Math.max(1, parseInt(e.target.value) || 1) }))}
                          className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-violet-500/60"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold text-zinc-400">Dias e horários</label>
                        <input
                          data-testid="input-category-schedule"
                          type="text"
                          value={form.schedule}
                          onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                          placeholder="Seg/Qua/Sex às 18h30"
                          className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-violet-500/60"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold text-zinc-400">Descrição (opcional)</label>
                      <textarea
                        data-testid="input-category-description"
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Descreva o foco desta turma..."
                        rows={2}
                        className="w-full resize-none rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-violet-500/60"
                        maxLength={200}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={PRESS_SCALE}
                        type="button"
                        data-testid="btn-save-category"
                        onClick={handleSave}
                        disabled={!form.name.trim() || saving}
                        className={`flex-1 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/20 px-4 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-500/30 disabled:opacity-40 ${INTERACTIVE_FOCUS_RING}`}
                      >
                        <Check className="h-4 w-4" />
                        {saving ? "Salvando..." : formMode === "create" ? "Criar Turma" : "Salvar Alterações"}
                      </motion.button>
                      <button
                        type="button"
                        data-testid="btn-cancel-category"
                        onClick={cancelForm}
                        className={`inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500/60 ${INTERACTIVE_FOCUS_RING}`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category list */}
            {categories.length === 0 ? (
              <div className="py-12 text-center">
                <Layers className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
                <p className="text-sm font-semibold text-zinc-500">Nenhuma turma cadastrada ainda.</p>
                <p className="mt-1 text-xs text-zinc-600">Clique em &quot;+ Nova Turma&quot; para começar.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => {
                  const count = studentCountByCategory.get(cat.id) ?? 0;
                  const col = colorOpt(cat.color);
                  const isDeleteConfirm = deleteConfirmId === cat.id;

                  return (
                    <motion.div
                      key={cat.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xl ${col.bg} ${col.border}`}>
                          {cat.emoji || "🏐"}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-black text-zinc-100 truncate">{cat.name}</p>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${col.bg} ${col.border} ${col.text}`}>
                              {col.label}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                            <span>{count} aluno{count !== 1 ? "s" : ""} ativo{count !== 1 ? "s" : ""}</span>
                            <span>Cap. {cat.maxStudents ?? 12}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            data-testid={`btn-edit-category-${cat.id}`}
                            onClick={() => openEdit(cat)}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/60 text-zinc-400 transition hover:border-violet-500/50 hover:text-violet-300 ${INTERACTIVE_FOCUS_RING}`}
                            aria-label={`Editar turma ${cat.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            data-testid={`btn-delete-category-${cat.id}`}
                            onClick={() => setDeleteConfirmId(isDeleteConfirm ? null : cat.id)}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/60 text-zinc-400 transition hover:border-red-500/50 hover:text-red-400 ${INTERACTIVE_FOCUS_RING}`}
                            aria-label={`Excluir turma ${cat.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Delete confirm inline */}
                      <AnimatePresence>
                        {isDeleteConfirm && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 p-3">
                              {count > 0 && (
                                <div className="mb-2 flex items-start gap-2">
                                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                                  <p className="text-xs text-amber-300 font-semibold">
                                    {count} aluno{count !== 1 ? "s" : ""} nesta turma ser{count !== 1 ? "ão" : "á"} afetado{count !== 1 ? "s" : ""}.
                                  </p>
                                </div>
                              )}
                              <p className="text-xs text-zinc-300 mb-3">
                                Tem certeza que deseja excluir a turma <strong className="text-zinc-100">{cat.name}</strong>? Esta ação não pode ser desfeita.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  data-testid={`btn-confirm-delete-${cat.id}`}
                                  onClick={() => handleDelete(cat.id)}
                                  className={`flex-1 inline-flex min-h-9 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/20 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/30 ${INTERACTIVE_FOCUS_RING}`}
                                >
                                  Excluir turma
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className={`inline-flex min-h-9 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-3 py-2 text-xs font-semibold text-zinc-300 transition ${INTERACTIVE_FOCUS_RING}`}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
