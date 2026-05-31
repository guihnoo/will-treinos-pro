"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Clock, RefreshCw, Users } from "lucide-react";
import QRCode from "react-qr-code";
import type { Lesson } from "@/context/types";

interface Props {
  lesson: Lesson;
  lessonTitle: string;
  onClose: () => void;
}

const QR_TTL_SECONDS = 120; // 2 minutes, then refreshes

function buildCheckInUrl(lessonId: string, ts: number): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/checkin/${lessonId}?t=${ts}`;
}

export default function QRCheckInModal({ lesson, lessonTitle, onClose }: Props) {
  const [ts, setTs]           = useState(() => Math.floor(Date.now() / 1000));
  const [remaining, setRemaining] = useState(QR_TTL_SECONDS);

  // Countdown + auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setTs(Math.floor(Date.now() / 1000));
          return QR_TTL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const qrUrl     = buildCheckInUrl(lesson.id, ts);
  const pct       = Math.round((remaining / QR_TTL_SECONDS) * 100);
  const isUrgent  = remaining <= 20;
  const present   = lesson.presentStudents?.length ?? 0;
  const enrolled  = lesson.enrolledStudents?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10">
              <QrCode size={17} className="text-[#EAB308]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Check-in QR Code</h2>
              <p className="text-[10px] text-zinc-500 truncate max-w-[160px]">{lessonTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center px-8 py-6 gap-4">
          <div className="p-4 bg-white rounded-2xl shadow-lg">
            <QRCode value={qrUrl} size={200} level="M" />
          </div>

          {/* Timer bar */}
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <div className={`flex items-center gap-1 font-bold ${isUrgent ? "text-red-400" : "text-zinc-500"}`}>
                <Clock size={11} />
                {isUrgent ? "Renovando em breve…" : "QR válido por"}
              </div>
              <span className={`font-black tabular-nums ${isUrgent ? "text-red-400" : "text-zinc-400"}`}>
                {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "linear" }}
                className={`h-full rounded-full ${isUrgent ? "bg-red-500" : "bg-[#EAB308]"}`}
              />
            </div>
          </div>

          {/* Presence counter */}
          <div className="w-full flex items-center justify-between rounded-2xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Users size={14} className="text-emerald-400" />
              Presentes
            </div>
            <span className="text-sm font-black text-white">
              {present} <span className="text-zinc-600 font-normal">/ {enrolled}</span>
            </span>
          </div>

          {/* Manual refresh */}
          <button
            onClick={() => { setTs(Math.floor(Date.now() / 1000)); setRemaining(QR_TTL_SECONDS); }}
            className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <RefreshCw size={12} />
            Renovar agora
          </button>
        </div>

        {/* Instructions */}
        <div className="px-5 pb-5">
          <p className="text-center text-[11px] text-zinc-600 leading-relaxed">
            Mostre este QR code para os alunos.<br />
            Eles escaneiam com a câmera do celular para fazer check-in automaticamente.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
