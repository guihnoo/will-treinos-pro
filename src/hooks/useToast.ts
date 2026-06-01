"use client";

// Module-level store — no Zustand, no extra deps.
// Works across component trees as long as ToastProvider is mounted.

export type ToastType = "success" | "xp" | "achievement" | "error" | "info";

export interface ToastOptions {
  type: ToastType;
  title: string;
  subtitle?: string;
  xpAmount?: number;
  tierName?: string;
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: string;
  createdAt: number;
}

type Subscriber = (toasts: ToastItem[]) => void;

let _toasts: ToastItem[] = [];
const _subscribers = new Set<Subscriber>();
const _timers = new Map<string, ReturnType<typeof setTimeout>>();

function notify() {
  _subscribers.forEach((fn) => fn([..._toasts]));
}

function defaultDuration(type: ToastType): number {
  if (type === "error") return 8000;
  if (type === "xp" || type === "achievement") return 6000;
  return 4000;
}

function dismiss(id: string) {
  _toasts = _toasts.filter((t) => t.id !== id);
  const timer = _timers.get(id);
  if (timer) { clearTimeout(timer); _timers.delete(id); }
  notify();
}

function add(options: ToastOptions) {
  // Cap at 3 simultaneous toasts — remove oldest if needed
  if (_toasts.length >= 3) {
    const oldest = _toasts[0];
    if (oldest) dismiss(oldest.id);
  }
  const id = `wt_toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const item: ToastItem = { ...options, id, createdAt: Date.now() };
  _toasts = [..._toasts, item];
  const duration = options.duration ?? defaultDuration(options.type);
  const timer = setTimeout(() => dismiss(id), duration);
  _timers.set(id, timer);
  notify();
  return id;
}

export function subscribeToasts(fn: Subscriber) {
  _subscribers.add(fn);
  fn([..._toasts]);
  return () => _subscribers.delete(fn);
}

export function dismissToast(id: string) {
  dismiss(id);
}

export const richToast = {
  success: (title: string, subtitle?: string, duration?: number) =>
    add({ type: "success", title, subtitle, duration }),

  xp: (xpAmount: number, subtitle?: string) =>
    add({ type: "xp", title: `+${xpAmount} XP`, xpAmount, subtitle }),

  achievement: (tierName: string) =>
    add({ type: "achievement", title: `Desbloqueado: ${tierName}`, tierName }),

  error: (title: string, subtitle?: string, duration?: number) =>
    add({ type: "error", title, subtitle, duration }),

  info: (title: string, subtitle?: string, duration?: number) =>
    add({ type: "info", title, subtitle, duration }),
};
