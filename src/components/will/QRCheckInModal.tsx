"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Clock, RefreshCw, Users, Maximize2, Minimize2 } from "lucide-react";
import QRCode from "react-qr-code";
import type { Lesson } from "@/context/types";

interface Props {
  lesson: Lesson;
  lessonTitle: string;
  onClose: () => void;
}

const QR_TTL_SECONDS = 300; // 5 minutes

function buildCheckInUrl(lessonId: string, ts: number): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/checkin/${lessonId}?t=${ts}`;
}

export default function QRCheckInModal({ lesson, lessonTitle, onClose }: Props) {
  const [ts, setTs] = useState(() => Math.floor(Date.now() / 1000));
  const [remaining, setRemaining] = useState(QR_TTL_SECONDS);
  const [liveCount, setLiveCount] = useState<number>(lesson.presentStudents?.length ?? 0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const enrolled = lesson.enrolledStudents?.length ?? 0;
  const qrUrl = buildCheckInUrl(lesson.id, ts);
  const pct = Math.round((remaining / QR_TTL_SECONDS) * 100);
  const isUrgent = remaining <= 30;

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

  // Live check-in counter polling every 5s
  const pollCount = useCallback(async () => {
    try {
      const currentTs = Math.floor(Date.now() / 1000);
      const res = await fetch(
        `/api/student/qr-checkin?lessonId=${encodeURIComponent(lesson.id)}&token=${ts}`,
      );
      if (res.ok) {
        const json = (await res.json()) as { count?: number };
        if (typeof json.count === "number") setLiveCount(json.count);
      }
    } catch { /* silently ignore */ }
  }, [lesson.id, ts]);

  useEffect(() => {
    void pollCount();
    pollingRef.current = setInterval(() => { void pollCount(); }, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [pollCount]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    const el = fullscreenRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      try {
        await el.requestFullscreen();
        setIsFullscreen(true);
      } catch { /* browser blocked */ }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleManualRefresh = useCallback(() => {
    setTs(Math.floor(Date.now() / 1000));
    setRemaining(QR_TTL_SECONDS);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        ref={fullscreenRef}
        className={`w-full rounded-3xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden ${
          isFullscreen ? "max-w-none h-full flex flex-col justify-center" : "max-w-sm"
        }`}
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
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              data-testid="qr-fullscreen-btn"
              title={isFullscreen ? "Sair de tela cheia" : "Tela cheia"}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-[#EAB308] transition-colors"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button
              onClick={onClose}
              data-testid="qr-modal-close"
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center px-8 py-6 gap-4">
          <motion.div
            key={ts}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`p-5 bg-white rounded-2xl shadow-[0_0_32px_rgba(234,179,8,0.15)] ${isFullscreen ? "p-8" : ""}`}
          >
            <QRCode value={qrUrl} size={isFullscreen ? 300 : 240} level="M" />
          </motion.div>

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
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "linear" }}
                className={`h-full rounded-full transition-colors ${isUrgent ? "bg-red-500" : "bg-[#EAB308]"}`}
              />
            </div>
          </div>

          {/* Live check-in counter */}
          <div className="w-full flex items-center justify-between rounded-2xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Users size={15} className="text-emerald-400" />
              </motion.div>
              <span>Check-ins ao vivo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={liveCount}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-black text-white tabular-nums"
                >
                  {liveCount}
                </motion.span>
              </AnimatePresence>
              <span className="text-zinc-600 text-sm font-normal">/ {enrolled}</span>
            </div>
          </div>

          {/* Manual refresh */}
          <button
            onClick={handleManualRefresh}
            data-testid="qr-refresh-btn"
            className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <RefreshCw size={12} />
            Renovar agora
          </button>
        </div>

        {/* Instructions */}
        <div className="px-5 pb-5">
          <p className="text-center text-[11px] text-zinc-600 leading-relaxed">
            Mostre este QR code para os alunos escanearem com a câmera.<br />
            O código se renova automaticamente a cada 5 minutos.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
