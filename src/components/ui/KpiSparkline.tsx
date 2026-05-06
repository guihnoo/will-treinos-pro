"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { computeSparkline } from "@/lib/sparklineUtils";
import { MotionTokens } from "@/design-system";

interface KpiSparklineProps {
  points: number[];
  accent: "gold" | "emerald" | "red";
  label?: string;
  height?: number;
  animated?: boolean;
}

const accentMap = {
  gold: { stroke: "rgba(234,179,8,0.9)", fill: "rgba(234,179,8,0.25)" },
  emerald: { stroke: "rgba(16,185,129,0.9)", fill: "rgba(16,185,129,0.25)" },
  red: { stroke: "rgba(239,68,68,0.9)", fill: "rgba(239,68,68,0.25)" },
};

const getTrendIcon = (trend: "up" | "down" | "flat") => {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
};

const getTrendColor = (trend: "up" | "down" | "flat") => {
  if (trend === "up") return "#10B981";
  if (trend === "down") return "#EF4444";
  return "#71717A";
};

/**
 * Mini sparkline for KPI cards — SVG line chart with animated pathLength.
 * No dots or labels (minimalista). Accepts array of chronological numbers.
 */
export const KpiSparkline: React.FC<KpiSparklineProps> = ({
  points,
  accent,
  label,
  height = 48,
  animated = true,
}) => {
  const sparkline = useMemo(() => computeSparkline(points, 240, height), [points, height]);

  if (!sparkline || points.length < 2) {
    return (
      <div className="text-[10px] text-zinc-500 mt-2 italic">
        Dados insuficientes
      </div>
    );
  }

  const fillId = `sparkline-fill-${accent}-${Math.random().toString(36).slice(2, 9)}`;
  const glowId = `sparkline-glow-${accent}-${Math.random().toString(36).slice(2, 9)}`;
  const colors = accentMap[accent];

  return (
    <div className="relative w-full mt-2">
      <svg
        viewBox={`0 0 ${sparkline.w} ${sparkline.h}`}
        className="w-full"
        style={{ height: `${height / 2}px` }}
        role="img"
        aria-label={label || "Sparkline trend"}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.fill} />
            <stop offset="100%" stopColor={colors.fill.replace("0.25", "0")} />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Area fill */}
        <path d={sparkline.areaD} fill={`url(#${fillId})`} opacity="0.8" />

        {/* Stroke with animation */}
        <motion.path
          d={sparkline.d}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
          initial={animated ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={animated ? MotionTokens.springs.admin : undefined}
        />
      </svg>

      {/* Trend indicator + label */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[9px] text-zinc-500 tracking-tight">
          {label}
        </span>
        <span
          className="text-[12px] font-bold"
          style={{ color: getTrendColor(sparkline.trend) }}
        >
          {getTrendIcon(sparkline.trend)}
        </span>
      </div>
    </div>
  );
};

export default KpiSparkline;
