"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Users, Calendar, CreditCard } from "lucide-react";
import type { Student, Lesson, Payment, LessonCategory } from "@/context/types";
import UserAvatar from "@/components/ui/UserAvatar";

const MAX_PER_GROUP = 5;

type StudentResult = {
  kind: "student";
  id: string;
  name: string;
  email: string;
  status: string;
  avatar: string;
  category?: LessonCategory;
};

type LessonResult = {
  kind: "lesson";
  id: string;
  title: string;
  date: string;
  category?: LessonCategory;
  spotsLeft: number;
};

type PaymentResult = {
  kind: "payment";
  id: string;
  studentId: string;
  studentName: string;
  reference: string;
  status: string;
  amount: number;
};

type SearchResult = StudentResult | LessonResult | PaymentResult;

function score(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.startsWith(q)) return 2;
  if (t.includes(q)) return 1;
  return 0;
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function currencyBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:    { label: "Ativo",     color: "text-green-400 bg-green-500/10 border-green-500/30" },
  pending:   { label: "Pendente",  color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  suspended: { label: "Suspenso",  color: "text-red-400 bg-red-500/10 border-red-500/30" },
  trial:     { label: "Trial",     color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  paid:      { label: "Pago",      color: "text-green-400 bg-green-500/10 border-green-500/30" },
  late:      { label: "Atrasado",  color: "text-red-400 bg-red-500/10 border-red-500/30" },
};

export interface GlobalSearchModalProps {
  onClose: () => void;
  students: Student[];
  lessons: Lesson[];
  payments: Payment[];
  getCategory: (id: string) => LessonCategory | undefined;
  onSelectStudent: (studentId: string) => void;
  onSelectLesson: (lessonId: string) => void;
}

export default function GlobalSearchModal({
  onClose,
  students,
  lessons,
  payments,
  getCategory,
  onSelectStudent,
  onSelectLesson,
}: GlobalSearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const results = useMemo<{
    students: StudentResult[];
    lessons: LessonResult[];
    payments: PaymentResult[];
  }>(() => {
    const q = query.trim();
    if (!q) return { students: [], lessons: [], payments: [] };

    // Students
    const studentResults: StudentResult[] = students
      .flatMap((s) => {
        const s1 = score(s.name, q);
        const s2 = score(s.email ?? "", q);
        const s3 = score(s.phone ?? "", q);
        const best = Math.max(s1, s2, s3);
        if (best === 0) return [];
        return [{ s: best, student: s }];
      })
      .sort((a, b) => b.s - a.s)
      .slice(0, MAX_PER_GROUP)
      .map(({ student }) => ({
        kind: "student" as const,
        id: student.id,
        name: student.name,
        email: student.email,
        status: student.status,
        avatar: student.avatar,
        category: student.categories?.[0] ? getCategory(student.categories[0]) : undefined,
      }));

    // Lessons
    const lessonResults: LessonResult[] = lessons
      .flatMap((l) => {
        const cat = getCategory(l.categoryId);
        const s1 = score(l.title, q);
        const s2 = score(l.date, q);
        const s3 = cat ? score(cat.name, q) : 0;
        const best = Math.max(s1, s2, s3);
        if (best === 0) return [];
        return [{ s: best, lesson: l, cat }];
      })
      .sort((a, b) => b.s - a.s)
      .slice(0, MAX_PER_GROUP)
      .map(({ lesson, cat }) => ({
        kind: "lesson" as const,
        id: lesson.id,
        title: lesson.title,
        date: lesson.date,
        category: cat,
        spotsLeft: lesson.maxStudents - lesson.enrolledStudents.length,
      }));

    // Payments — join student name
    const paymentResults: PaymentResult[] = payments
      .flatMap((p) => {
        const student = students.find((s) => s.id === p.studentId);
        const studentName = student?.name ?? "";
        const s1 = score(studentName, q);
        const s2 = score(p.reference, q);
        const best = Math.max(s1, s2);
        if (best === 0) return [];
        return [{ s: best, payment: p, studentName }];
      })
      .sort((a, b) => b.s - a.s)
      .slice(0, MAX_PER_GROUP)
      .map(({ payment, studentName }) => ({
        kind: "payment" as const,
        id: payment.id,
        studentId: payment.studentId,
        studentName,
        reference: payment.reference,
        status: payment.status,
        amount: payment.amount,
      }));

    return { students: studentResults, lessons: lessonResults, payments: paymentResults };
  }, [query, students, lessons, payments, getCategory]);

  const hasResults =
    results.students.length > 0 || results.lessons.length > 0 || results.payments.length > 0;

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onClose();
      if (result.kind === "student") {
        onSelectStudent(result.id);
      } else if (result.kind === "lesson") {
        onSelectLesson(result.id);
      } else {
        // payment → open student profile
        onSelectStudent(result.studentId);
      }
    },
    [onClose, onSelectStudent, onSelectLesson],
  );

  return (
    <motion.div
      key="global-search-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm px-3 pt-16 pb-8"
      onClick={onClose}
      data-testid="global-search-overlay"
    >
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 340, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_32px_80px_rgba(0,0,0,0.9)] overflow-hidden"
        data-testid="global-search-modal"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-zinc-800/80 px-4 py-3.5">
          <Search className="h-4 w-4 flex-shrink-0 text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alunos, aulas ou pagamentos..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
            data-testid="global-search-input"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-md p-0.5 text-zinc-500 hover:text-white transition"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query.trim() && (
            <div className="flex flex-col items-center gap-2 py-12 px-4 text-center">
              <Search className="h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-600">
                Digite para buscar alunos, aulas ou pagamentos
              </p>
            </div>
          )}

          {query.trim() && !hasResults && (
            <div className="flex flex-col items-center gap-2 py-12 px-4 text-center">
              <Search className="h-8 w-8 text-zinc-700" />
              <p className="text-sm font-bold text-zinc-400">
                Nenhum resultado para &quot;{query}&quot;
              </p>
              <p className="text-xs text-zinc-600">Verifique a ortografia e tente novamente.</p>
            </div>
          )}

          {hasResults && (
            <div className="divide-y divide-zinc-800/60">
              {/* Students group */}
              {results.students.length > 0 && (
                <div className="px-2 py-2">
                  <p className="mb-1 flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                    <Users className="h-3 w-3" />
                    Alunos
                  </p>
                  {results.students.map((r) => {
                    const statusInfo = STATUS_LABEL[r.status] ?? { label: r.status, color: "text-zinc-400 bg-zinc-800 border-zinc-700" };
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelect(r)}
                        data-testid={`search-student-${r.id}`}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-zinc-900"
                      >
                        <UserAvatar name={r.name} photo={r.avatar} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-white">{r.name}</p>
                          {r.email && (
                            <p className="truncate text-xs text-zinc-500">{r.email}</p>
                          )}
                        </div>
                        <span
                          className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Lessons group */}
              {results.lessons.length > 0 && (
                <div className="px-2 py-2">
                  <p className="mb-1 flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                    <Calendar className="h-3 w-3" />
                    Aulas
                  </p>
                  {results.lessons.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelect(r)}
                      data-testid={`search-lesson-${r.id}`}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-zinc-900"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-base leading-none">
                        {r.category?.emoji ?? "📅"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{r.title}</p>
                        <p className="text-xs text-zinc-500">
                          {formatDate(r.date)}
                          {r.category ? ` · ${r.category.name}` : ""}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-zinc-500">
                        {r.spotsLeft > 0 ? `${r.spotsLeft} vaga${r.spotsLeft > 1 ? "s" : ""}` : "Lotada"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Payments group */}
              {results.payments.length > 0 && (
                <div className="px-2 py-2">
                  <p className="mb-1 flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                    <CreditCard className="h-3 w-3" />
                    Pagamentos
                  </p>
                  {results.payments.map((r) => {
                    const statusInfo = STATUS_LABEL[r.status] ?? { label: r.status, color: "text-zinc-400 bg-zinc-800 border-zinc-700" };
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelect(r)}
                        data-testid={`search-payment-${r.id}`}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-zinc-900"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                          <CreditCard className="h-3.5 w-3.5 text-zinc-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-white">{r.studentName}</p>
                          <p className="text-xs text-zinc-500">{r.reference} · {currencyBRL(r.amount)}</p>
                        </div>
                        <span
                          className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
