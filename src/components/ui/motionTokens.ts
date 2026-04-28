"use client";

export const SPRING_PREMIUM = { type: "spring", stiffness: 300, damping: 30 } as const;

export const PRESS_SCALE = { scale: 0.95 } as const;

export const CARD_HOVER_LIFT = {
  y: -4,
  borderColor: "rgba(234,179,8,0.35)",
  boxShadow: "0 16px 40px rgba(0,0,0,0.45), 0 0 24px rgba(234,179,8,0.12)",
} as const;

export const GOLD_GLOW_PULSE = {
  boxShadow: [
    "0 0 0 rgba(234,179,8,0)",
    "0 0 18px rgba(234,179,8,0.26)",
    "0 0 0 rgba(234,179,8,0)",
  ],
};

export const MODAL_OVERLAY_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

export const MODAL_SHEET_POP = {
  initial: { opacity: 0, y: 40, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 30, scale: 0.98 },
} as const;

export const MODAL_SHEET_SOFT = {
  initial: { opacity: 0, y: 30, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.98 },
} as const;

export const MODAL_DRAWER_RIGHT = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
} as const;

export const MODAL_HEADER_ENTER = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
} as const;

export const MODAL_BADGE_ENTER = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
} as const;

