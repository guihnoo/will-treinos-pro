"use client";

import React from "react";
import { ACHIEVEMENT_TRACKS } from "./studentHomeShared";

/** SVG glyph for each achievement track. */
export function TrackGlyph({
  id,
  accent,
  locked,
}: {
  id: (typeof ACHIEVEMENT_TRACKS)[number]["id"];
  accent: string;
  locked: boolean;
}) {
  const baseOpacity = locked ? 0.35 : 0.95;
  if (id === "consistency") {
    return (
      <svg viewBox="0 0 64 64" className="w-11 h-11" aria-hidden>
        <circle cx="32" cy="32" r="19" fill="none" stroke={`${accent}66`} strokeWidth="4" />
        <path
          d="M20 32 L29 40 L44 23"
          fill="none"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={baseOpacity}
        />
      </svg>
    );
  }
  if (id === "technical") {
    return (
      <svg viewBox="0 0 64 64" className="w-11 h-11" aria-hidden>
        <circle cx="32" cy="32" r="18" fill="none" stroke={`${accent}66`} strokeWidth="3" />
        <path d="M14 32 H50 M32 14 V50" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity={baseOpacity} />
        <circle cx="32" cy="32" r="5.5" fill={accent} opacity={baseOpacity} />
      </svg>
    );
  }
  if (id === "fundamentals") {
    return (
      <svg viewBox="0 0 64 64" className="w-11 h-11" aria-hidden>
        <circle cx="32" cy="32" r="5.5" fill={accent} opacity={baseOpacity} />
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x = 32 + Math.cos(rad) * 16;
          const y = 32 + Math.sin(rad) * 16;
          return <circle key={angle} cx={x} cy={y} r="3.7" fill={accent} opacity={baseOpacity} />;
        })}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className="w-11 h-11" aria-hidden>
      <path d="M12 18 H52 V46 H12 Z" fill="none" stroke={`${accent}66`} strokeWidth="3" />
      <path d="M32 18 V46" stroke={`${accent}66`} strokeWidth="2" />
      <path
        d="M15 32 C21 25, 27 25, 32 32 C37 39, 43 39, 49 32"
        fill="none"
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
        opacity={baseOpacity}
      />
      <path
        d="M38 16 L46 10 M46 10 L46 18 M46 10 L38 10"
        fill="none"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default TrackGlyph;
