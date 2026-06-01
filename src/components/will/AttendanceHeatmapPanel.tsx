"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, X, Flame, Clock, Calendar, TrendingUp } from "lucide-react";
import { useLessons } from "@/context/LessonsContext";
import { useStudents } from "@/context/StudentsContext";
import type { Lesson } from "@/context/types";
import {
  MODAL_BODY_SCROLL,
  MODAL_FIXED_OVERLAY_SCROLL,
  MODAL_OVERLAY_CENTER_WRAP,
  MODAL_PANEL_COLUMN,
} from "@/components/ui/modalScrollClasses";
import { MODAL_OVERLAY_FADE, SPRING_PREMIUM } from "@/components/ui/motionTokens";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;
const SLOTS = [
  { id: "madrugada", label: "Madrugada", range: "00–06h", hours: [0, 1, 2, 3, 4, 5] },
  { id: "manha",     label: "Manhã",     range: "06–12h", hours: [6, 7, 8, 9, 10, 11] },
  { id: "tarde",     label: "Tarde",     range: "12–18h", hours: [12, 13, 14, 15, 16, 17] },
  { id: "noite",     label: "Noite",     range: "18–23h", hours: [18, 19, 20, 21, 22] },
] as const;

type SlotId = (typeof SLOTS)[number]["id"];

function dayIndexFromISO(dateStr: string): number {
  // Returns 0=Mon … 6=Sun  (matching DAYS array)
  const d = new Date(`${dateStr}T00:00:00`);
  const jsDay = d.getDay(); // 0=Sun … 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1;
}

function slotFromHour(hour: number): SlotId {
  if (hour < 6) return "madrugada";
  if (hour < 12) return "manha";
  if (hour < 18) return "tarde";
  return "noite";
}

function heatColor(count: number): string {
  if (count === 0) return "bg-zinc-900 border-zinc-800/40";
  if (count <= 3) return "bg-zinc-700 border-zinc-600/40";
  if (count <= 7) return "bg-amber-800/80 border-amber-700/50";
  if (count <= 14) return "bg-amber-600/80 border-amber-500/60";
  return "bg-amber-400/90 border-amber-300/70";
}

function textColor(count: number): string {
  if (count === 0) return "text-zinc-600";
  if (count <= 3) return "text-zinc-300";
  if (count <= 7) return "text-amber-200";
  if (count <= 14) return "text-amber-100";
  return "text-black font-black";
}

interface CellData {
  count: number;
  topStudents: { name: string; times: number }[];
}

interface Props {
  onClose: () => void;
}

export default function AttendanceHeatmapPanel({ onClose }: Props) {
  const { lessons } = useLessons();
  const { students } = useStudents();
  const [tooltip, setTooltip] = useState<{
    dayIndex: number;
    slotId: SlotId;
    data: CellData;
  } | null>(null);

  const { grid, bestDay, bestSlot, bestCell } = useMemo(() => {
    // grid[dayIndex][slotId] = CellData
    const raw: Record<number, Record<SlotId, { count: number; studentCounts: Map<string, number> }>> = {};
    for (let d = 0; d < 7; d++) {
      raw[d] = {
        madrugada: { count: 0, studentCounts: new Map() },
        manha:     { count: 0, studentCounts: new Map() },
        tarde:     { count: 0, studentCounts: new Map() },
        noite:     { count: 0, studentCounts: new Map() },
      };
    }

    const completedLessons = lessons.filter((l: Lesson) => l.status === "completed");

    for (const lesson of completedLessons) {
      const dayIdx = dayIndexFromISO(lesson.date);
      const startHour = parseInt(lesson.startTime.split(":")[0] ?? "0", 10);
      const slot = slotFromHour(startHour);
      const cell = raw[dayIdx][slot];
      const present = lesson.presentStudents ?? [];

      cell.count += present.length;
      for (const sid of present) {
        cell.studentCounts.set(sid, (cell.studentCounts.get(sid) ?? 0) + 1);
      }
    }

    // Build final grid
    const finalGrid: Record<number, Record<SlotId, CellData>> = {};
    for (let d = 0; d < 7; d++) {
      finalGrid[d] = {} as Record<SlotId, CellData>;
      for (const slot of SLOTS) {
        const cell = raw[d][slot.id];
        const sorted = Array.from(cell.studentCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([sid, times]) => {
            const student = students.find((s) => s.id === sid);
            return { name: student?.name ?? "Aluno", times };
          });
        finalGrid[d][slot.id] = { count: cell.count, topStudents: sorted };
      }
    }

    // Best day: sum across all slots
    let bestDayIdx = 0;
    let bestDayCount = 0;
    for (let d = 0; d < 7; d++) {
      const total = SLOTS.reduce((s, sl) => s + finalGrid[d][sl.id].count, 0);
      if (total > bestDayCount) {
        bestDayCount = total;
        bestDayIdx = d;
      }
    }

    // Best slot: sum across all days
    let bestSlotId: SlotId = "noite";
    let bestSlotCount = 0;
    for (const sl of SLOTS) {
      const total = Object.values(finalGrid).reduce((s, day) => s + day[sl.id].count, 0);
      if (total > bestSlotCount) {
        bestSlotCount = total;
        bestSlotId = sl.id;
      }
    }

    // Best cell
    let bestCellCount = 0;
    let bestCellDay = 0;
    let bestCellSlot: SlotId = "noite";
    for (let d = 0; d < 7; d++) {
      for (const sl of SLOTS) {
        const c = finalGrid[d][sl.id].count;
        if (c > bestCellCount) {
          bestCellCount = c;
          bestCellDay = d;
          bestCellSlot = sl.id;
        }
      }
    }

    return {
      grid: finalGrid,
      bestDay: { name: DAYS[bestDayIdx], count: bestDayCount },
      bestSlot: { label: SLOTS.find((s) => s.id === bestSlotId)?.label ?? "Noite", count: bestSlotCount },
      bestCell: {
        label: `${DAYS[bestCellDay]} · ${SLOTS.find((s) => s.id === bestCellSlot)?.label}`,
        count: bestCellCount,
      },
    };
  }, [lessons, students]);

  return (
    <AnimatePresence>
      <motion.div
        key="heatmap-overlay"
        {...MODAL_OVERLAY_FADE}
        className={MODAL_FIXED_OVERLAY_SCROLL}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className={MODAL_OVERLAY_CENTER_WRAP}>
          <motion.div
            key="heatmap-panel"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={SPRING_PREMIUM}
            className={`${MODAL_PANEL_COLUMN} max-w-lg w-full rounded-3xl border border-amber-500/30 bg-[#0a0a0a] shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/10">
                  <LayoutGrid className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Mapa de Calor</h2>
                  <p className="text-[11px] text-zinc-500">Intensidade de presença por dia × horário</p>
                </div>
              </div>
              <button
                data-testid="heatmap-close"
                onClick={onClose}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className={`${MODAL_BODY_SCROLL} px-5 py-4 space-y-5`}>
              {/* Summary chips */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Calendar, label: "Melhor dia",     value: bestDay.name,      sub: `${bestDay.count} presenças`,   color: "amber" },
                  { icon: Clock,    label: "Melhor horário", value: bestSlot.label,    sub: `${bestSlot.count} presenças`,  color: "amber" },
                  { icon: Flame,    label: "Slot campeão",   value: bestCell.label,    sub: `${bestCell.count} presenças`,  color: "orange" },
                ].map(({ icon: Icon, label, value, sub, color }) => (
                  <div
                    key={label}
                    className={`rounded-xl border border-${color}-500/25 bg-${color}-500/8 px-3 py-2.5`}
                  >
                    <Icon size={12} className={`text-${color}-400 mb-1`} />
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p>
                    <p className={`text-xs font-black text-${color}-300 leading-tight mt-0.5`}>{value}</p>
                    <p className="text-[9px] text-zinc-500">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Scale legend */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Escala:</span>
                {[
                  { label: "0", cls: "bg-zinc-900 border-zinc-800/40" },
                  { label: "1–3", cls: "bg-zinc-700 border-zinc-600/40" },
                  { label: "4–7", cls: "bg-amber-800/80 border-amber-700/50" },
                  { label: "8–14", cls: "bg-amber-600/80 border-amber-500/60" },
                  { label: "15+", cls: "bg-amber-400/90 border-amber-300/70" },
                ].map(({ label, cls }) => (
                  <span key={label} className="flex items-center gap-1">
                    <span className={`inline-block h-3 w-3 rounded border ${cls}`} />
                    <span className="text-[9px] text-zinc-500">{label}</span>
                  </span>
                ))}
              </div>

              {/* Grid */}
              <div className="overflow-x-auto">
                <div className="min-w-[320px]">
                  {/* Column headers (days) */}
                  <div className="grid grid-cols-8 gap-1 mb-1">
                    <div /> {/* empty corner */}
                    {DAYS.map((day) => (
                      <div key={day} className="text-center text-[9px] font-black uppercase tracking-wide text-zinc-500">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Rows (slots) */}
                  {SLOTS.map((slot) => (
                    <div key={slot.id} className="grid grid-cols-8 gap-1 mb-1">
                      {/* Row label */}
                      <div className="flex flex-col justify-center pr-1">
                        <p className="text-[8px] font-black text-zinc-400 leading-tight">{slot.label}</p>
                        <p className="text-[7px] text-zinc-600">{slot.range}</p>
                      </div>

                      {/* Cells */}
                      {DAYS.map((day, dayIdx) => {
                        const cellData = grid[dayIdx][slot.id];
                        const isActive = tooltip?.dayIndex === dayIdx && tooltip?.slotId === slot.id;
                        return (
                          <motion.button
                            key={day}
                            data-testid={`heatmap-cell-${dayIdx}-${slot.id}`}
                            whileHover={{ scale: 1.12 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setTooltip(isActive ? null : { dayIndex: dayIdx, slotId: slot.id, data: cellData })}
                            className={`relative h-9 rounded-lg border transition-all ${heatColor(cellData.count)} ${
                              isActive ? "ring-2 ring-amber-400/70 ring-offset-1 ring-offset-black" : ""
                            }`}
                          >
                            <span className={`text-[9px] ${textColor(cellData.count)}`}>
                              {cellData.count > 0 ? cellData.count : ""}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tooltip detail */}
              <AnimatePresence>
                {tooltip && (
                  <motion.div
                    key="tooltip-detail"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ type: "spring", stiffness: 420, damping: 26 }}
                    className="rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={13} className="text-amber-400" />
                        <p className="text-xs font-black text-white">
                          {DAYS[tooltip.dayIndex]} · {SLOTS.find((s) => s.id === tooltip.slotId)?.label}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black text-amber-300">
                        {tooltip.data.count} presenças
                      </span>
                    </div>

                    {tooltip.data.topStudents.length > 0 ? (
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Top alunos neste slot</p>
                        <div className="space-y-1">
                          {tooltip.data.topStudents.map((s, i) => (
                            <div key={`${s.name}-${i}`} className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-zinc-300">{s.name}</span>
                              <span className="text-[9px] text-amber-400">{s.times}× presente</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-500">Nenhuma presença registrada neste slot.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
