"use client";

import React, { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Download, Copy } from "lucide-react";
import { useToast } from "@/components/Toast";
import { MODAL_FIXED_OVERLAY_SCROLL, MODAL_OVERLAY_CENTER_WRAP } from "@/components/ui/modalScrollClasses";
import { MODAL_OVERLAY_FADE, PRESS_SCALE, SPRING_PREMIUM } from "@/components/ui/motionTokens";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ShareProgressCardProps {
  student: {
    id: string;
    name: string;
    totalXP: number;
    tier: string;
    tierColor: string;
    streak: number;
    xpByFundamental: Record<string, number>;
  };
  onClose: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const ALL_FUNDAMENTALS = [
  { key: "ataque", label: "Ataque", color: "#ef4444" },
  { key: "levantamento", label: "Levant.", color: "#a855f7" },
  { key: "bloqueio", label: "Bloqueio", color: "#3b82f6" },
  { key: "saque", label: "Saque", color: "#EAB308" },
  { key: "defesa", label: "Defesa", color: "#10b981" },
  { key: "recepcao", label: "Recepção", color: "#06b6d4" },
  { key: "posicionamento", label: "Posic.", color: "#6b7280" },
] as const;

// ─── Heptagon Radar (pure SVG, no library) ────────────────────────────────────

function HeptagonRadar({ data }: { data: Record<string, number> }) {
  const N = ALL_FUNDAMENTALS.length;
  const cx = 100;
  const cy = 100;
  const R = 72;

  const point = (r: number, i: number) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const maxXP = Math.max(...Object.values(data), 1);

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPolygon = (ratio: number) =>
    ALL_FUNDAMENTALS.map((_, i) => {
      const p = point(R * ratio, i);
      return `${p.x},${p.y}`;
    }).join(" ");

  const dataPolygon = ALL_FUNDAMENTALS.map((f, i) => {
    const ratio = Math.min((data[f.key] ?? 0) / maxXP, 1);
    const p = point(R * ratio, i);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 200 200" width={200} height={200} aria-label="Radar de fundamentos">
      {/* Grid polygons */}
      {gridLevels.map((ratio, gi) => (
        <polygon
          key={gi}
          points={gridPolygon(ratio)}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="0.8"
        />
      ))}
      {/* Axis lines */}
      {ALL_FUNDAMENTALS.map((_, i) => {
        const outer = point(R, i);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={outer.x} y2={outer.y}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="0.8"
          />
        );
      })}
      {/* Data fill */}
      <polygon
        points={dataPolygon}
        fill="rgba(234,179,8,0.22)"
        stroke="#EAB308"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Data dots */}
      {ALL_FUNDAMENTALS.map((f, i) => {
        const ratio = Math.min((data[f.key] ?? 0) / maxXP, 1);
        const p = point(R * ratio, i);
        return (
          <circle key={f.key} cx={p.x} cy={p.y} r="3" fill="#EAB308" opacity={0.9} />
        );
      })}
      {/* Labels */}
      {ALL_FUNDAMENTALS.map((f, i) => {
        const outer = point(R + 13, i);
        return (
          <text
            key={f.key}
            x={outer.x}
            y={outer.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="7.5"
            fill="rgba(255,255,255,0.55)"
            fontWeight="bold"
          >
            {f.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Card Visual (375×667) ────────────────────────────────────────────────────

function ProgressCardContent({ student }: { student: ShareProgressCardProps["student"] }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

  const initials = student.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  // Top 3 fundamentals by XP
  const top3 = [...ALL_FUNDAMENTALS]
    .map((f) => ({ ...f, xp: student.xpByFundamental[f.key] ?? 0 }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 3);

  const maxTop3XP = Math.max(...top3.map((f) => f.xp), 1);

  return (
    <div
      style={{
        width: 375,
        height: 667,
        background: "#000000",
        border: "2px solid rgba(234,179,8,0.40)",
        borderRadius: 28,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 20px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(234,179,8,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: -60,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(234,179,8,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ color: "#EAB308", fontSize: 11, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>
            WILL TREINOS PRO
          </p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: "2px 0 0" }}>{dateLabel}</p>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#EAB308",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 18,
            color: "#000",
          }}
        >
          W
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: "100%", height: 1, background: "linear-gradient(to right, transparent, rgba(234,179,8,0.4), transparent)", marginBottom: 20 }} />

      {/* Avatar + Name + Tier */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 18 }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 900,
            color: "#000",
            boxShadow: "0 0 32px rgba(234,179,8,0.45)",
            marginBottom: 10,
            border: "3px solid rgba(234,179,8,0.6)",
          }}
        >
          {initials}
        </div>
        <p style={{ color: "#fff", fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: "-0.01em" }}>
          {student.name}
        </p>
        <div
          style={{
            marginTop: 6,
            padding: "3px 12px",
            borderRadius: 20,
            background: `${student.tierColor}22`,
            border: `1px solid ${student.tierColor}60`,
          }}
        >
          <p style={{ color: student.tierColor, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>
            {student.tier}
          </p>
        </div>
      </div>

      {/* XP total */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
        <span style={{ color: "#EAB308", fontSize: 48, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em" }}>
          {student.totalXP.toLocaleString("pt-BR")}
        </span>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, fontWeight: 700 }}>XP</span>
      </div>

      {/* Streak */}
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "0 0 18px", fontWeight: 600 }}>
        🔥 {student.streak} {student.streak === 1 ? "dia" : "dias"} seguidos
      </p>

      {/* Radar */}
      <div style={{ marginBottom: 16 }}>
        <HeptagonRadar data={student.xpByFundamental} />
      </div>

      {/* Top 3 fundamentals */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {top3.map((f) => (
          <div key={f.key} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 700, width: 62, margin: 0, textAlign: "right", flexShrink: 0 }}>
              {f.label}
            </p>
            <div style={{ flex: 1, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.round((f.xp / maxTop3XP) * 100)}%`,
                  background: f.color,
                  borderRadius: 4,
                }}
              />
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: 600, width: 36, margin: 0, flexShrink: 0 }}>
              {f.xp.toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", paddingTop: 10 }}>
        <p style={{ color: "rgba(161,161,170,0.55)", fontSize: 10, fontWeight: 500, margin: 0, textAlign: "center" }}>
          @willtreinospro
        </p>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ShareProgressCard({ student, onClose }: ShareProgressCardProps) {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const shareText = `Olha meu progresso no Will Treinos PRO! 🏐\n${student.totalXP.toLocaleString("pt-BR")} XP conquistados | ${student.tier} | 🔥 ${student.streak} dias seguidos\n\nVeja meu perfil:`;
  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/atleta/${student.id}`;

  const handleShare = useCallback(async () => {
    const fullText = `${shareText} ${profileUrl}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Meu Progresso — Will Treinos PRO", text: fullText });
        return;
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    }
    // Fallback: copy profile link
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast("Link copiado! Cole no Instagram Stories.", "success");
    } catch {
      toast("Não foi possível copiar. Acesse: " + profileUrl, "info");
    }
  }, [shareText, profileUrl, toast]);

  const handleDownload = useCallback(() => {
    // html2canvas not available — show print instruction
    toast("Dica: tire um print desta tela e compartilhe no Stories!", "info");
  }, [toast]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Card de progresso compartilhável"
      className={`fixed inset-0 z-[280] ${MODAL_FIXED_OVERLAY_SCROLL} bg-black/85`}
      {...MODAL_OVERLAY_FADE}
      onClick={onClose}
    >
      <div className={`${MODAL_OVERLAY_CENTER_WRAP} px-3`}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={SPRING_PREMIUM}
          onClick={(e) => e.stopPropagation()}
          className="my-auto flex flex-col items-center gap-4 w-full max-w-[420px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EAB308]">Card de Progresso</p>
              <p className="text-xs text-zinc-400 mt-0.5">Compartilhe no Instagram Stories</p>
            </div>
            <motion.button
              type="button"
              whileTap={PRESS_SCALE}
              onClick={onClose}
              data-testid="btn-close-share-card"
              className="min-h-10 min-w-10 flex items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-zinc-300" />
            </motion.button>
          </div>

          {/* Card preview */}
          <div
            ref={cardRef}
            className="overflow-auto rounded-3xl shadow-[0_0_60px_rgba(234,179,8,0.25)]"
            style={{ maxHeight: "calc(100dvh - 180px)" }}
          >
            <ProgressCardContent student={student} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <motion.button
              type="button"
              whileTap={PRESS_SCALE}
              onClick={handleShare}
              data-testid="btn-share-progress"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#EAB308]/40 bg-[#EAB308]/15 py-3 text-sm font-black text-amber-300 hover:bg-[#EAB308]/25 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Compartilhar
            </motion.button>
            <motion.button
              type="button"
              whileTap={PRESS_SCALE}
              onClick={handleDownload}
              data-testid="btn-download-card"
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-4 py-3 text-sm font-bold text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              <Download className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Print fallback hint */}
          <p className="text-[10px] italic text-zinc-600 text-center">
            Tire um print desta tela para salvar o card diretamente no Stories
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
