
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Trash2,
  SlidersHorizontal,
  Layers,
  GripVertical,
  Scale,
  Check,
  AlertCircle,
} from "lucide-react";
import type { CriterionDimension, EvaluationCriterionV1, EvaluationScope, EvaluationTemplateV1 } from "@/domain/v1/contracts";
import { OFFICIAL_TENANT_V1, EVALUATION_TEMPLATES_V1, EVALUATION_CRITERIA_V1 } from "@/domain/v1/mockOrm";
import { useAuth } from "@/context/AuthContext";
import { wtLsSet, wtLsTryParse } from "@/lib/willLocalStorage";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";

const EVAL_ENGINE_LS_KEY = "will_eval_engine_v1";

const DIMENSIONS: { value: CriterionDimension; label: string; accent: string }[] = [
  { value: "tecnica", label: "Técnica", accent: "#38BDF8" },
  { value: "tatica", label: "Tática", accent: "#A78BFA" },
  { value: "fisico", label: "Físico", accent: "#F97316" },
  { value: "mental", label: "Mental", accent: "#22D3EE" },
  { value: "disciplina", label: "Disciplina", accent: "#EAB308" },
  { value: "custom", label: "Custom", accent: "#94A3B8" },
];

const SCOPES: { value: EvaluationScope; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "collective", label: "Coletivo" },
  { value: "both", label: "Ambos" },
];

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function cloneDefaults(): { templates: EvaluationTemplateV1[]; criteria: EvaluationCriterionV1[] } {
  return {
    templates: JSON.parse(JSON.stringify(EVALUATION_TEMPLATES_V1)) as EvaluationTemplateV1[],
    criteria: JSON.parse(JSON.stringify(EVALUATION_CRITERIA_V1)) as EvaluationCriterionV1[],
  };
}

function weightSumFor(criteria: EvaluationCriterionV1[], templateId: string): number {
  return criteria.filter((c) => c.templateId === templateId).reduce((a, c) => a + c.weight, 0);
}

function normalizeWeights(criteria: EvaluationCriterionV1[], templateId: string): EvaluationCriterionV1[] {
  const list = criteria.filter((c) => c.templateId === templateId);
  const sum = list.reduce((a, c) => a + c.weight, 0);
  if (sum <= 0) return criteria;
  return criteria.map((c) =>
    c.templateId === templateId ? { ...c, weight: Number((c.weight / sum).toFixed(4)) } : c,
  );
}

async function loadEngineFromSupabase(): Promise<{ templates: EvaluationTemplateV1[]; criteria: EvaluationCriterionV1[] } | null> {
  try {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb
      .from("app_settings")
      .select("evaluation_engine")
      .eq("id", "singleton")
      .single();
    if (data?.evaluation_engine && Array.isArray((data.evaluation_engine as { templates?: unknown }).templates)) {
      return data.evaluation_engine as { templates: EvaluationTemplateV1[]; criteria: EvaluationCriterionV1[] };
    }
  } catch { /* fall through */ }
  return null;
}

async function saveEngineToSupabase(payload: { templates: EvaluationTemplateV1[]; criteria: EvaluationCriterionV1[] }) {
  try {
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb
      .from("app_settings")
      .update({ evaluation_engine: payload })
      .eq("id", "singleton");
  } catch { /* silent — localStorage is the fallback */ }
}

export default function WillEvaluationTemplatesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const ownerId = user?.id ?? "admin1";

  const [hydrated, setHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState<EvaluationTemplateV1[]>([]);
  const [criteria, setCriteria] = useState<EvaluationCriterionV1[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { templates: t, criteria: c } = cloneDefaults();

      // 1. Tenta Supabase primeiro
      const remote = await loadEngineFromSupabase();
      if (remote) {
        setTemplates(remote.templates);
        setCriteria(remote.criteria);
        setSelectedId(remote.templates[0]?.id ?? null);
        setHydrated(true);
        return;
      }

      // 2. Fallback: localStorage
      try {
        const parsed = typeof window !== "undefined"
          ? wtLsTryParse<{ templates: EvaluationTemplateV1[]; criteria: EvaluationCriterionV1[] }>(EVAL_ENGINE_LS_KEY)
          : null;
        if (parsed && Array.isArray(parsed.templates) && parsed.templates.length) {
          setTemplates(parsed.templates);
          setCriteria(parsed.criteria);
          setSelectedId(parsed.templates[0]?.id ?? null);
          setHydrated(true);
          return;
        }
      } catch { /* fall through */ }

      // 3. Defaults
      setTemplates(t);
      setCriteria(c);
      setSelectedId(t[0]?.id ?? null);
      setHydrated(true);
    })();
  }, []);

  // Salva localStorage sempre (offline fallback)
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    wtLsSet(EVAL_ENGINE_LS_KEY, { templates, criteria });
  }, [templates, criteria, hydrated]);

  const handleSaveToCloud = useCallback(async () => {
    setIsSaving(true);
    await saveEngineToSupabase({ templates, criteria });
    setIsSaving(false);
    toast("✅ Templates salvos no banco!");
  }, [templates, criteria, toast]);

  useEffect(() => {
    if (!hydrated) return;
    if (selectedId && !templates.some((t) => t.id === selectedId)) {
      setSelectedId(templates[0]?.id ?? null);
    }
  }, [templates, selectedId, hydrated]);

  const selected = useMemo(() => templates.find((t) => t.id === selectedId) ?? null, [templates, selectedId]);

  const criteriaForSelected = useMemo(() => {
    if (!selected) return [];
    return criteria
      .filter((c) => c.templateId === selected.id)
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [criteria, selected]);

  const sumWeights = selected ? weightSumFor(criteria, selected.id) : 0;
  const weightOk = Math.abs(sumWeights - 1) < 0.02;

  const updateTemplate = useCallback((id: string, patch: Partial<EvaluationTemplateV1>) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const setDefaultTemplate = useCallback((id: string) => {
    setTemplates((prev) =>
      prev.map((t) => ({
        ...t,
        isDefault: t.id === id && t.tenantId === OFFICIAL_TENANT_V1.id,
      })),
    );
  }, []);

  const addTemplate = useCallback(() => {
    const t: EvaluationTemplateV1 = {
      id: newId(),
      tenantId: OFFICIAL_TENANT_V1.id,
      name: "Novo protocolo de avaliação",
      scope: "individual",
      isDefault: templates.length === 0,
      createdByUserId: ownerId,
    };
    setTemplates((prev) => [...prev, t]);
    setCriteria((prev) => [
      ...prev,
      {
        id: newId(),
        templateId: t.id,
        name: "Critério inicial — defina o nome",
        dimension: "tecnica",
        weight: 1,
        scaleMin: 1,
        scaleMax: 10,
        orderIndex: 1,
        isRequired: true,
      },
    ]);
    setSelectedId(t.id);
  }, [templates.length, ownerId]);

  const removeTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((t) => t.id !== id);
      const removedWasDefault = prev.find((t) => t.id === id)?.isDefault;
      if (removedWasDefault && next.length) {
        return next.map((t, i) => ({ ...t, isDefault: i === 0 }));
      }
      return next;
    });
    setCriteria((prev) => prev.filter((c) => c.templateId !== id));
  }, []);

  const addCriterion = useCallback(() => {
    if (!selected) return;
    const maxOrder = criteriaForSelected.reduce((m, c) => Math.max(m, c.orderIndex), 0);
    const c: EvaluationCriterionV1 = {
      id: newId(),
      templateId: selected.id,
      name: "Novo critério de alto rendimento",
      dimension: "tecnica",
      weight: 0.1,
      scaleMin: 1,
      scaleMax: 10,
      orderIndex: maxOrder + 1,
      isRequired: true,
    };
    setCriteria((prev) => [...prev, c]);
  }, [selected, criteriaForSelected]);

  const updateCriterion = useCallback((id: string, patch: Partial<EvaluationCriterionV1>) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const removeCriterion = useCallback(
    (id: string, templateId: string) => {
      const count = criteria.filter((c) => c.templateId === templateId).length;
      if (count <= 1) return;
      setCriteria((prev) => prev.filter((c) => c.id !== id));
    },
    [criteria],
  );

  const moveCriterion = useCallback(
    (id: string, dir: -1 | 1) => {
      if (!selected) return;
      const list = criteria
        .filter((c) => c.templateId === selected.id)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      const idx = list.findIndex((c) => c.id === id);
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= list.length) return;
      const a = list[idx];
      const b = list[swap];
      setCriteria((prev) =>
        prev.map((c) => {
          if (c.id === a.id) return { ...c, orderIndex: b.orderIndex };
          if (c.id === b.id) return { ...c, orderIndex: a.orderIndex };
          return c;
        }),
      );
    },
    [criteria, selected],
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
        Carregando motor de avaliação…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/50 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-[#EAB308]/[0.12] backdrop-blur-2xl sm:p-6"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 100% 0%, rgba(234,179,8,0.14), transparent 55%), radial-gradient(ellipse 60% 40% at 0% 100%, rgba(234,179,8,0.06), transparent 50%)",
          }}
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#EAB308]/90">Sprint 6.1 — Evaluation Engine</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Templates & Critérios</h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              Rubrica clínica oficial: cada critério alimenta <span className="font-bold text-zinc-200">SessionEvaluation</span> e itens
              ponderados. Dados 100% aderentes aos contratos{" "}
              <span className="font-mono text-[11px] text-[#EAB308]">EvaluationTemplateV1</span> /{" "}
              <span className="font-mono text-[11px] text-[#EAB308]">EvaluationCriterionV1</span>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm font-black text-green-400 disabled:opacity-60"
            >
              {isSaving ? "Salvando…" : "💾 Salvar no banco"}
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={addTemplate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#EAB308] px-4 py-3 text-sm font-black text-black shadow-[0_0_24px_rgba(234,179,8,0.25)]"
            >
              <Plus className="h-4 w-4" />
              Novo template
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_1fr]">
        {/* Template rail */}
        <motion.aside
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-3 rounded-2xl border border-white/[0.07] bg-zinc-950/45 p-3 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Protocolos</p>
            <Layers className="h-4 w-4 text-[#EAB308]/80" />
          </div>
          <div className="space-y-2">
            {templates.map((t) => {
              const active = t.id === selectedId;
              const nCrit = criteria.filter((c) => c.templateId === t.id).length;
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  layout
                  onClick={() => setSelectedId(t.id)}
                  whileTap={{ scale: 0.98 }}
                  className={`relative w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                    active
                      ? "border-[#EAB308]/45 bg-[#EAB308]/[0.07]"
                      : "border-zinc-800/80 bg-black/30 hover:border-zinc-700"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="tpl-active"
                      className="absolute inset-0 rounded-xl ring-1 ring-[#EAB308]/30"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative block text-sm font-bold text-white line-clamp-2">{t.name}</span>
                  <span className="relative mt-1 flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="rounded-md border border-zinc-700 bg-zinc-900/80 px-1.5 py-0.5 font-bold uppercase tracking-wide text-zinc-400">
                      {t.scope}
                    </span>
                    <span>{nCrit} critérios</span>
                    {t.isDefault && (
                      <span className="rounded-md border border-[#EAB308]/35 bg-[#EAB308]/10 px-1.5 py-0.5 font-bold text-[#EAB308]">
                        Padrão
                      </span>
                    )}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.aside>

        {/* Editor */}
        {selected ? (
          <motion.section
            key={selected.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/40 p-4 backdrop-blur-xl sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nome do template</label>
                    <input
                      value={selected.name}
                      onChange={(e) => updateTemplate(selected.id, { name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/50 px-3 py-2.5 text-sm font-bold text-white outline-none ring-0 transition-colors focus:border-[#EAB308]/50"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Escopo</label>
                      <select
                        value={selected.scope}
                        onChange={(e) => updateTemplate(selected.id, { scope: e.target.value as EvaluationScope })}
                        className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/50 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-[#EAB308]/50"
                      >
                        {SCOPES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="mb-1 flex cursor-pointer items-center gap-2 text-sm font-bold text-zinc-300">
                        <input
                          type="checkbox"
                          checked={selected.isDefault}
                          onChange={(e) => {
                            if (e.target.checked) setDefaultTemplate(selected.id);
                          }}
                          className="h-4 w-4 rounded border-zinc-600 bg-black accent-[#EAB308]"
                        />
                        Template padrão do tenant
                      </label>
                      <p className="text-[10px] text-zinc-600">Apenas um protocolo pode ser padrão por vez.</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setCriteria((prev) => normalizeWeights(prev, selected.id))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-[11px] font-bold text-zinc-200 hover:border-[#EAB308]/35"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-[#EAB308]" />
                    Normalizar pesos
                  </motion.button>
                  {templates.length > 1 && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => removeTemplate(selected.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-300 hover:bg-red-500/15"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold ${
                    weightOk
                      ? "border-[#22C55E]/35 bg-[#22C55E]/10 text-[#22C55E]"
                      : "border-[#EAB308]/40 bg-[#EAB308]/10 text-[#EAB308]"
                  }`}
                >
                  {weightOk ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  Soma dos pesos: {(sumWeights * 100).toFixed(1)}% {weightOk ? "(ok)" : "— ajuste ou normalize"}
                </div>
                <p className="text-[10px] text-zinc-500">
                  Tenant: <span className="font-mono text-zinc-400">{selected.tenantId}</span> · criado por{" "}
                  <span className="font-mono text-zinc-400">{selected.createdByUserId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-[#EAB308]" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">Critérios clínicos</h2>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={addCriterion}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAB308]/40 bg-[#EAB308]/10 px-3 py-2 text-[11px] font-black text-[#EAB308]"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar critério
              </motion.button>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false} mode="popLayout">
                {criteriaForSelected.map((c) => {
                  const dim = DIMENSIONS.find((d) => d.value === c.dimension);
                  return (
                    <motion.div
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 14, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-zinc-950/90 via-black/80 to-zinc-950/90 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                    >
                      <div
                        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-25 blur-3xl"
                        style={{ background: dim?.accent ?? "#EAB308" }}
                      />
                      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start">
                        <div className="flex items-center gap-2 text-zinc-600 sm:flex-col sm:pt-1">
                          <GripVertical className="h-4 w-4 sm:hidden" />
                          <div className="flex flex-col gap-1">
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.9 }}
                              onClick={() => moveCriterion(c.id, -1)}
                              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-zinc-400 hover:text-white"
                            >
                              ↑
                            </motion.button>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.9 }}
                              onClick={() => moveCriterion(c.id, 1)}
                              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-zinc-400 hover:text-white"
                            >
                              ↓
                            </motion.button>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nome do critério</label>
                            <input
                              value={c.name}
                              onChange={(e) => updateCriterion(c.id, { name: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/50 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-[#EAB308]/45"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <div>
                              <label className="text-[10px] font-bold uppercase text-zinc-500">Dimensão</label>
                              <select
                                value={c.dimension}
                                onChange={(e) => updateCriterion(c.id, { dimension: e.target.value as CriterionDimension })}
                                className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 px-2 py-2 text-[11px] font-bold text-white focus:border-[#EAB308]/45"
                              >
                                {DIMENSIONS.map((d) => (
                                  <option key={d.value} value={d.value}>
                                    {d.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase text-zinc-500">Peso</label>
                              <input
                                type="number"
                                step={0.01}
                                min={0}
                                max={1}
                                value={c.weight}
                                onChange={(e) => updateCriterion(c.id, { weight: Number(e.target.value) })}
                                className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 px-2 py-2 text-[11px] font-bold text-[#EAB308] focus:border-[#EAB308]/45"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase text-zinc-500">Escala mín</label>
                              <input
                                type="number"
                                value={c.scaleMin}
                                onChange={(e) => updateCriterion(c.id, { scaleMin: Number(e.target.value) })}
                                className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 px-2 py-2 text-[11px] text-white focus:border-[#EAB308]/45"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase text-zinc-500">Escala máx</label>
                              <input
                                type="number"
                                value={c.scaleMax}
                                onChange={(e) => updateCriterion(c.id, { scaleMax: Number(e.target.value) })}
                                className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 px-2 py-2 text-[11px] text-white focus:border-[#EAB308]/45"
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="flex cursor-pointer items-center gap-2 text-[11px] font-bold text-zinc-400">
                              <input
                                type="checkbox"
                                checked={c.isRequired}
                                onChange={(e) => updateCriterion(c.id, { isRequired: e.target.checked })}
                                className="h-4 w-4 rounded border-zinc-600 bg-black accent-[#EAB308]"
                              />
                              Obrigatório na avaliação
                            </label>
                            <span className="text-[10px] font-mono text-zinc-600">orderIndex {c.orderIndex}</span>
                            {criteria.filter((x) => x.templateId === selected.id).length > 1 && (
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                onClick={() => removeCriterion(c.id, selected.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-500/25 bg-red-500/5 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3 w-3" />
                                Remover
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.section>
        ) : (
          <p className="text-sm text-zinc-500">Selecione um protocolo.</p>
        )}
      </div>
    </div>
  );
}
