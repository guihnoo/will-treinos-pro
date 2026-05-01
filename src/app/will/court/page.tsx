"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ClipboardList, Users, X } from "lucide-react";
import { useLessons } from "@/context/LessonsContext";
import { useStudents } from "@/context/StudentsContext";
import { useCatalog } from "@/context/CatalogContext";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import type { EvaluationCriterionV1, EvaluationTemplateV1 } from "@/domain/v1/contracts";
import { EVALUATION_CRITERIA_V1, EVALUATION_TEMPLATES_V1 } from "@/domain/v1/mockOrm";

const bottomSheetVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { type: "spring", damping: 25, stiffness: 200 },
  },
  exit: { y: "100%", opacity: 0 },
} as const;

type EvalDraft = {
  criterionScores: Record<string, number>;
  notes: string;
};

export default function WillCourtPage() {
  const { todayLessons } = useLessons();
  const { getStudent } = useStudents();
  const { getCategory, getVenue } = useCatalog();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(todayLessons[0]?.id ?? null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    EVALUATION_TEMPLATES_V1.find((t) => t.isDefault)?.id ?? EVALUATION_TEMPLATES_V1[0]?.id ?? "",
  );
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, EvalDraft>>({});
  const [clipboardImgError, setClipboardImgError] = useState(false);
  useBodyScrollLock(Boolean(activeStudentId));

  const selectedTemplate = useMemo<EvaluationTemplateV1 | null>(
    () => EVALUATION_TEMPLATES_V1.find((t) => t.id === selectedTemplateId) ?? null,
    [selectedTemplateId],
  );

  const selectedCriteria = useMemo<EvaluationCriterionV1[]>(
    () =>
      EVALUATION_CRITERIA_V1.filter((c) => c.templateId === selectedTemplateId)
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex),
    [selectedTemplateId],
  );

  const selectedLesson = useMemo(
    () => todayLessons.find((l) => l.id === selectedLessonId) ?? todayLessons[0] ?? null,
    [todayLessons, selectedLessonId],
  );

  const roster = useMemo(() => {
    if (!selectedLesson) return [];
    return selectedLesson.enrolledStudents.map((id) => getStudent(id)).filter(Boolean);
  }, [selectedLesson, getStudent]);

  const sheetKey = activeStudentId && selectedLesson ? `${selectedLesson.id}:${activeStudentId}` : null;
  const activeDraft = sheetKey ? drafts[sheetKey] : undefined;

  const updateDraftScore = (criterionId: string, value: number) => {
    if (!sheetKey) return;
    setDrafts((prev) => ({
      ...prev,
      [sheetKey]: {
        notes: prev[sheetKey]?.notes ?? "",
        criterionScores: {
          ...(prev[sheetKey]?.criterionScores ?? {}),
          [criterionId]: value,
        },
      },
    }));
  };

  const updateDraftNotes = (value: string) => {
    if (!sheetKey) return;
    setDrafts((prev) => ({
      ...prev,
      [sheetKey]: {
        notes: value,
        criterionScores: prev[sheetKey]?.criterionScores ?? {},
      },
    }));
  };

  return (
    <div className="space-y-5 pb-10">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/55 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.55)] ring-1 ring-[#EAB308]/[0.12] backdrop-blur-2xl"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(234,179,8,0.14), transparent 55%), radial-gradient(ellipse at bottom left, rgba(234,179,8,0.06), transparent 50%)",
          }}
        />
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#EAB308]/90">Sprint 6.3</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Prancheta da Quadra</h1>
            <p className="mt-1 text-sm text-zinc-400">Class Session / Roster com abertura imediata da CEM por atleta.</p>
          </div>
          <div className="relative h-20 w-20 flex-shrink-0">
            {!clipboardImgError ? (
              <Image
                src="/assets/clipboard.png"
                alt="Prancheta tática"
                fill
                className="object-contain opacity-80 drop-shadow-[0_0_24px_rgba(234,179,8,0.45)]"
                onError={() => setClipboardImgError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-2xl border border-[#EAB308]/25 bg-[#EAB308]/10">
                <ClipboardList className="h-9 w-9 text-[#EAB308]" />
              </div>
            )}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
        <motion.aside
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-3 backdrop-blur-xl"
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Aulas de hoje</p>
          <div className="space-y-2">
            {todayLessons.map((lesson) => {
              const selected = lesson.id === selectedLesson?.id;
              const category = getCategory(lesson.categoryId);
              return (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLessonId(lesson.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                    selected ? "border-[#EAB308]/40 bg-[#EAB308]/10" : "border-zinc-800 bg-black/30 hover:border-zinc-700"
                  }`}
                >
                  <p className="text-xs font-bold text-white">{lesson.title}</p>
                  <p className="mt-0.5 text-[10px] text-zinc-500">
                    {lesson.startTime} - {lesson.endTime} · {category?.name ?? "Sessão"}
                  </p>
                </button>
              );
            })}
          </div>
        </motion.aside>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 backdrop-blur-xl"
        >
          {selectedLesson ? (
            <>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sessão ativa para avaliação</p>
                  <h2 className="truncate text-xl font-black text-white">{selectedLesson.title}</h2>
                  <p className="text-[11px] text-zinc-500">
                    {selectedLesson.startTime} - {selectedLesson.endTime} · {getVenue(selectedLesson.venueId)?.name ?? "Quadra"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="rounded-xl border border-zinc-800 bg-black/45 px-2.5 py-2 text-[11px] font-bold text-white focus:border-[#EAB308]/40"
                  >
                    {EVALUATION_TEMPLATES_V1.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <Link
                    href="/will/evaluations/templates"
                    className="inline-flex items-center gap-1 rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10 px-2.5 py-2 text-[11px] font-bold text-[#EAB308]"
                  >
                    Ajustar template
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {roster.map((student) =>
                  student ? (
                    <button
                      key={student.id}
                      onClick={() => setActiveStudentId(student.id)}
                      className="rounded-xl border border-zinc-800 bg-black/30 p-3 text-left transition-colors hover:border-[#EAB308]/35 hover:bg-[#EAB308]/5"
                    >
                      <p className="text-sm font-bold text-white">{student.name}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">{student.plan}</p>
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/60 px-2 py-0.5 text-[10px] text-zinc-400">
                        <Users className="h-3 w-3" />
                        Abrir CEM
                      </div>
                    </button>
                  ) : null,
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Nenhuma aula disponível para hoje.</p>
          )}
        </motion.section>
      </div>

      <AnimatePresence>
        {activeStudentId && selectedLesson && selectedTemplate ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            data-modal-overlay
            aria-label="Matriz de avaliação clínica"
            className="fixed inset-0 z-[80] overflow-y-auto overscroll-y-contain bg-black/75 backdrop-blur-sm flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveStudentId(null)}
          >
            <motion.div
              className="mx-auto mt-auto w-full max-w-3xl rounded-t-3xl border border-zinc-800 bg-[#0A0A0A] p-4 sm:p-6"
              variants={bottomSheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Clinical Evaluation Matrix</p>
                  <h3 className="truncate text-lg font-black text-white">
                    {getStudent(activeStudentId)?.name} — {selectedTemplate.name}
                  </h3>
                  <p className="text-[11px] text-zinc-500">{selectedLesson.title}</p>
                </div>
                <button
                  onClick={() => setActiveStudentId(null)}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[58dvh] space-y-3 overflow-y-auto pr-1">
                {selectedCriteria.map((criterion) => {
                  const value = activeDraft?.criterionScores?.[criterion.id] ?? criterion.scaleMin;
                  return (
                    <div key={criterion.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-[12px] font-bold text-white">{criterion.name}</p>
                        <span className="text-[10px] text-[#EAB308]">peso {(criterion.weight * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min={criterion.scaleMin}
                        max={criterion.scaleMax}
                        step={1}
                        value={value}
                        onChange={(e) => updateDraftScore(criterion.id, Number(e.target.value))}
                        className="w-full accent-[#EAB308]"
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
                        <span>{criterion.scaleMin}</span>
                        <span className="font-bold text-zinc-300">score {value}</span>
                        <span>{criterion.scaleMax}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nota clínica do treinador</p>
                  <textarea
                    rows={3}
                    value={activeDraft?.notes ?? ""}
                    onChange={(e) => updateDraftNotes(e.target.value)}
                    placeholder="Descreva causa, impacto e ação para próxima sessão."
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/40 px-2.5 py-2 text-[12px] text-white focus:border-[#EAB308]/40"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

