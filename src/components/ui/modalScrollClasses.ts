/**
 * Body scroll lock (useBodyScrollLock) blocks wheel/touch unless the event target sits inside
 * an ancestor with overflow-y auto|scroll and scrollable overflow. Modals whose backdrop uses
 * overflow:hidden trap all gestures — use overflow-y-auto on the fixed overlay instead.
 */
export const MODAL_FIXED_OVERLAY_SCROLL =
  "fixed inset-0 overflow-y-auto overscroll-y-contain";

/**
 * Centers modal; extra bottom padding clears mobile tab bar + dev role pill + safe area.
 * Modals should use z-index ≥ 200 so they sit above `Navigation` (z-50).
 */
export const MODAL_OVERLAY_CENTER_WRAP =
  "flex min-h-[100dvh] w-full items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(6.75rem,calc(env(safe-area-inset-bottom)+5.25rem))] sm:p-6 sm:pb-8";

/** Column panel with capped height so inner regions can use flex-1 + overflow-y-auto */
export const MODAL_PANEL_COLUMN =
  "flex w-full flex-col overflow-hidden min-h-0 max-h-[min(82dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-6.75rem))]";

export const MODAL_BODY_SCROLL =
  "min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 touch-pan-y [-webkit-overflow-scrolling:touch]";
