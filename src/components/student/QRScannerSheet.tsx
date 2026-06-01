"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, CheckCircle2, AlertCircle, Zap } from "lucide-react";

type ScanState = "scanning" | "success" | "error";

interface Props {
  onClose: () => void;
}

// jsQR is a CommonJS module — we import it dynamically to avoid SSR issues
type JsQrModule = {
  default: (
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ) => { data: string } | null;
};

export default function QRScannerSheet({ onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const jsqrRef = useRef<JsQrModule["default"] | null>(null);
  const hasProcessedRef = useRef(false);

  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [resultMessage, setResultMessage] = useState("");
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Parse token + lessonId from QR url
  function parseQRUrl(url: string): { token: string; lessonId: string } | null {
    try {
      const parsed = new URL(url);
      // Expected: /checkin/<lessonId>?t=<token>
      const parts = parsed.pathname.split("/").filter(Boolean);
      const lessonIdx = parts.indexOf("checkin");
      const lessonId = lessonIdx >= 0 ? (parts[lessonIdx + 1] ?? "") : "";
      const token = parsed.searchParams.get("t") ?? "";
      if (!lessonId || !token) return null;
      return { lessonId, token };
    } catch {
      return null;
    }
  }

  const handleQRDetected = useCallback(async (raw: string) => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    // Stop scanning
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

    const parsed = parseQRUrl(raw);
    if (!parsed) {
      setScanState("error");
      setResultMessage("QR code inválido. Peça ao professor para exibir o código correto.");
      return;
    }

    try {
      const res = await fetch("/api/student/qr-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const json = (await res.json()) as {
        success?: boolean;
        xpEarned?: number;
        studentName?: string;
        error?: string;
      };
      if (json.success) {
        setScanState("success");
        setXpEarned(json.xpEarned ?? 50);
        setResultMessage(`Check-in confirmado${json.studentName ? `, ${json.studentName.split(" ")[0]}` : ""}!`);
      } else {
        setScanState("error");
        setResultMessage(json.error ?? "Erro ao registrar check-in. Tente novamente.");
      }
    } catch {
      setScanState("error");
      setResultMessage("Falha de rede. Verifique sua conexão e tente novamente.");
    }
  }, []);

  // Frame scanning loop
  const scanFrame = useCallback(() => {
    if (hasProcessedRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const jsqr = jsqrRef.current;
    if (!video || !canvas || !jsqr || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) { rafRef.current = requestAnimationFrame(scanFrame); return; }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsqr(imageData.data, imageData.width, imageData.height);
    if (code?.data) {
      void handleQRDetected(code.data);
      return;
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [handleQRDetected]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Load jsQR dynamically
      try {
        const mod = (await import("jsqr")) as JsQrModule;
        jsqrRef.current = mod.default;
      } catch {
        if (!cancelled) setCameraError("Biblioteca de leitura QR não disponível.");
        return;
      }

      // Request camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        rafRef.current = requestAnimationFrame(scanFrame);
      } catch {
        if (!cancelled) setCameraError("Permissão de câmera negada. Habilite o acesso à câmera nas configurações.");
      }
    }

    void init();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [scanFrame]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[220] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm mx-4 rounded-3xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10">
              <Camera size={17} className="text-[#EAB308]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Check-in QR</h2>
              <p className="text-[10px] text-zinc-500">Aponte para o código do professor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="qr-scanner-close"
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Camera / Result */}
        <div className="relative bg-zinc-950 aspect-square overflow-hidden">
          {/* Video stream */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            aria-label="Camera feed para leitura de QR Code"
          />
          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" aria-hidden />

          {/* Camera error overlay */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
              <Camera size={36} className="text-zinc-600 mb-3" />
              <p className="text-sm font-bold text-zinc-300">{cameraError}</p>
            </div>
          )}

          {/* Scanning overlay — golden frame */}
          {scanState === "scanning" && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Dim corners */}
              <div className="absolute inset-0 bg-black/30" />
              {/* Scan frame */}
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7], scale: [0.98, 1.02, 0.98] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-52 h-52"
              >
                {/* Corner borders */}
                {["top-left", "top-right", "bottom-left", "bottom-right"].map(pos => {
                  const isTop = pos.startsWith("top");
                  const isLeft = pos.endsWith("left");
                  return (
                    <div
                      key={pos}
                      className="absolute w-8 h-8"
                      style={{
                        top: isTop ? 0 : "auto",
                        bottom: isTop ? "auto" : 0,
                        left: isLeft ? 0 : "auto",
                        right: isLeft ? "auto" : 0,
                        borderTopWidth: isTop ? 3 : 0,
                        borderBottomWidth: isTop ? 0 : 3,
                        borderLeftWidth: isLeft ? 3 : 0,
                        borderRightWidth: isLeft ? 0 : 3,
                        borderColor: "#EAB308",
                        borderRadius: 2,
                      }}
                    />
                  );
                })}
                {/* Scan line */}
                <motion.div
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 bg-[#EAB308]/70"
                  style={{ position: "absolute" }}
                />
              </motion.div>
            </div>
          )}

          {/* Success overlay */}
          <AnimatePresence>
            {scanState === "success" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/90 gap-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 360, damping: 20 }}
                >
                  <CheckCircle2 size={64} className="text-emerald-400" />
                </motion.div>
                <p className="text-base font-black text-white">{resultMessage}</p>
                {xpEarned && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex items-center gap-1.5 rounded-full border border-[#EAB308]/35 bg-[#EAB308]/15 px-4 py-1.5"
                  >
                    <Zap size={14} className="text-[#EAB308]" />
                    <span className="text-sm font-black text-[#EAB308]">+{xpEarned} XP</span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error overlay */}
          <AnimatePresence>
            {scanState === "error" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 gap-3 p-6 text-center"
              >
                <AlertCircle size={52} className="text-red-400" />
                <p className="text-sm font-bold text-white">{resultMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 py-4">
          {scanState === "scanning" && (
            <p className="text-center text-[11px] text-zinc-500">
              Posicione o código QR dentro do quadro dourado
            </p>
          )}
          {scanState !== "scanning" && (
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Fechar
              </button>
              {scanState === "error" && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    hasProcessedRef.current = false;
                    setScanState("scanning");
                    setResultMessage("");
                    // Restart camera
                    navigator.mediaDevices
                      .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
                      .then(stream => {
                        streamRef.current = stream;
                        if (videoRef.current) {
                          videoRef.current.srcObject = stream;
                          void videoRef.current.play();
                        }
                        rafRef.current = requestAnimationFrame(scanFrame);
                      })
                      .catch(() => setCameraError("Não foi possível reiniciar a câmera."));
                  }}
                  className="flex-1 rounded-xl bg-[#EAB308] py-3 text-sm font-black text-black"
                >
                  Tentar novamente
                </motion.button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
