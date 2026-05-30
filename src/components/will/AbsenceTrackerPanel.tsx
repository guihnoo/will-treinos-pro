"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserX,
  X,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  CalendarX,
} from "lucide-react";
import { useLessons } from "@/context/LessonsContext";
import { useStudents } from "@/context/StudentsContext";
import { useCatalog } from "@/context/CatalogContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { localDateISO } from "@/lib/dateUtils";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";
import { MODAL_OVERLAY_FADE, SPRING_PREMIUM } from "@/components/ui/motionTokens";

const NOTIFIED_KEY = "wt_absence_notified";

function getNotifiedMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function markNotified(studentId: string, lessonId: string) {
  const map = getNotifiedMap();
  map[`${studentId}_${lessonId}`] = Date.now();
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
}
function wasNotified(studentId: string, lessonId: string): boolean {
  const map = getNotifiedMap();
  const ts = map[`${studentId}_${lessonId}`];
  if (!ts) return false;
  // Expires after 72h
  return Date.now() - ts < 72 * 60 * 60 * 1000;
}

interface AbsenceEntry {
  studentId: string;
  studentName: string;
  authUserId: string | null | undefined;
  lessonId: string;
  lessonTitle: string;
  lessonDate: string;
  lessonStartTime: string;
  categoryColor: string;
}

interface Props {
  onClose: () => void;
}

export default function AbsenceTrackerPanel({ onClose }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { lessons } = useLessons();
  const { students } = useStudents();
  const { getCategory } = useCatalog();

  const [sending, setSending] = useState<string | null>(null);
  const [sentSet, setSentSet] = useState<Set<string>>(() => {
    const map = getNotifiedMap();
    return new Set(Object.keys(map).filter((k) => {
      const ts = map[k];
      return Date.now() - ts < 72 * 60 * 60 * 1000;
    }));
  });

  const absences = useMemo((): AbsenceEntry[] => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().slice(0, 10);
    const today = localDateISO();

    const entries: AbsenceEntry[] = [];

    for (const lesson of lessons) {
      if (lesson.status !== "completed") continue;
      if (lesson.date < cutoff || lesson.date >= today) continue;

      const enrolled = lesson.enrolledStudents ?? [];
      const present = lesson.presentStudents ?? [];
      const absent = enrolled.filter((sid) => !present.includes(sid));

      for (const studentId of absent) {
        const student = students.find((s) => s.id === studentId);
        if (!student) continue;
        const cat = getCategory(lesson.categoryId);
        entries.push({
          studentId,
          studentName: student.name,
          authUserId: student.authUserId,
          lessonId: lesson.id,
          lessonTitle: lesson.title || cat?.name || "Aula",
          lessonDate: lesson.date,
          lessonStartTime: lesson.startTime,
          categoryColor: cat?.color ?? "#EAB308",
        });
      }
    }

    return entries.sort((a, b) => b.lessonDate.localeCompare(a.lessonDate));
  }, [lessons, students, getCategory]);

  const pending = absences.filter((e) => !sentSet.has(`${e.studentId}_${e.lessonId}`));
  const notified = absences.filter((e) => sentSet.has(`${e.studentId}_${e.lessonId}`));

  async function handleNotify(entry: AbsenceEntry) {
    if (!entry.authUserId) {
      toast("Aluno sem conta vinculada — sem push disponível.");
      return;
    }

    const key = `${entry.studentId}_${entry.lessonId}`;
    setSending(key);

    try {
      const sb = getSupabaseClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Sem sessão");

      const firstName = entry.studentName.split(" ")[0];
      const dateFormatted = new Date(`${entry.lessonDate}T00:00:00`).toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          payload: {
            title: `🔄 ${firstName}, solicite sua reposição!`,
            body: `Você faltou ${entry.lessonTitle} em ${dateFormatted}. Abra o app e escolha um horário para repor.`,
            url: "/dashboard",
            icon: "/icons/icon-192.png",
            badge: "/icons/badge-72.svg",
          },
          targetUserId: entry.authUserId,
        }),
      });

      const result = await res.json();
      if (result.sent > 0) {
        markNotified(entry.studentId, entry.lessonId);
        setSentSet((prev) => new Set([...prev, key]));
        toast(`✅ Push enviado para ${firstName}`);
      } else {
        toast(`${firstName} não tem push ativo no dispositivo.`);
      }
    } catch {
      toast("Erro ao enviar notificação.");
    } finally {
      setSending(null);
    }
  }

  async function handleNotifyAll() {
    for (const entry of pending) {
      if (!entry.authUserId) continue;
      await handleNotify(entry);
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="absence-overlay"
        {...MODAL_OVERLAY_FADE}
        className={MODAL_FIXED_OVERLAY_SCROLL}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className={MODAL_OVERLAY_CENTER_WRAP}>
          <motion.div
            key="absence-panel"
            {...SPRING_PREMIUM}
            className={`${MODAL_PANEL_COLUMN} max-w-md w-full rounded-3xl border border-orange-500/30 bg-[#0a0a0a] shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/35 bg-orange-500/10">
                  <CalendarX className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Ausências Recentes</h2>
                  <p className="text-[11px] text-zinc-500">Últimos 7 dias · {absences.length} falta{absences.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className={`${MODAL_BODY_SCROLL} px-5 py-4 space-y-4`}>
              {absences.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500/50" />
                  <p className="text-sm font-bold text-zinc-400">Nenhuma falta nos últimos 7 dias.</p>
                  <p className="text-xs text-zinc-600">Turma com presença exemplar!</p>
                </div>
              ) : (
                <>
                  {/* Bulk notify */}
                  {pending.length > 0 && (
                    <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-orange-300">{pending.length} aluno{pending.length !== 1 ? "s" : ""} ainda não notificado{pending.length !== 1 ? "s" : ""}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Envie push para todos de uma vez</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleNotifyAll}
                        disabled={sending !== null}
                        className="flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-500/15 px-3 py-2 text-[11px] font-black text-orange-200 hover:bg-orange-500/25 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={12} />
                        Notificar todos
                      </motion.button>
                    </div>
                  )}

                  {/* Pending list */}
                  {pending.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-2">Aguardando notificação</p>
                      <div className="space-y-2">
                        {pending.map((entry) => (
                          <AbsenceCard
                            key={`${entry.studentId}_${entry.lessonId}`}
                            entry={entry}
                            isSending={sending === `${entry.studentId}_${entry.lessonId}`}
                            status="pending"
                            onNotify={() => handleNotify(entry)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notified list */}
                  {notified.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 mb-2">Já notificados</p>
                      <div className="space-y-2">
                        {notified.map((entry) => (
                          <AbsenceCard
                            key={`${entry.studentId}_${entry.lessonId}`}
                            entry={entry}
                            isSending={false}
                            status="notified"
                            onNotify={() => handleNotify(entry)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function AbsenceCard({
  entry,
  isSending,
  status,
  onNotify,
}: {
  entry: AbsenceEntry;
  isSending: boolean;
  status: "pending" | "notified";
  onNotify: () => void;
}) {
  const dateFormatted = new Date(`${entry.lessonDate}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-all ${
      status === "notified"
        ? "border-zinc-800/50 bg-zinc-950/50 opacity-70"
        : "border-zinc-800/80 bg-zinc-950/70"
    }`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.categoryColor }} />
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{entry.studentName}</p>
          <p className="text-[10px] text-zinc-500 truncate">
            {entry.lessonTitle} · {dateFormatted} {entry.lessonStartTime}
          </p>
        </div>
      </div>
      <div className="flex-shrink-0">
        {status === "notified" ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
            <CheckCircle2 size={11} />
            Notificado
          </span>
        ) : !entry.authUserId ? (
          <span className="flex items-center gap-1 text-[10px] text-zinc-600">
            <BellOff size={11} />
            Sem conta
          </span>
        ) : (
          <motion.button
            whileTap={{ scale: 0.93 }}
            disabled={isSending}
            onClick={onNotify}
            className="flex items-center gap-1.5 rounded-lg border border-orange-500/35 bg-orange-500/10 px-2.5 py-1.5 text-[10px] font-black text-orange-200 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
          >
            {isSending ? <Loader2 size={10} className="animate-spin" /> : <Bell size={10} />}
            Notificar
          </motion.button>
        )}
      </div>
    </div>
  );
}
