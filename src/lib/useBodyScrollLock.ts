"use client";

import { useLayoutEffect } from "react";

let lockCount = 0;
let savedScrollY = 0;
let prevBodyStyles: Partial<CSSStyleDeclaration> | null = null;
let prevHtmlStyles: Partial<CSSStyleDeclaration> | null = null;

/** App scroll lives in <main data-app-scroll-root> (AuthWrapper), not on window — locking body alone does not stop background scroll. */
let lockedAppScrollRoot: HTMLElement | null = null;
let savedAppScrollRootTop = 0;
let prevAppScrollRootOverflow = "";
let prevAppScrollRootOverscrollY = "";
let prevAppScrollRootTouchAction = "";

function modalRootFromTarget(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  return (
    target.closest("[aria-modal=\"true\"]") ??
    (target.closest("[data-modal-overlay]") as Element | null)
  );
}

/** Allow pan/scroll only inside a real overflow container within an open modal (iOS scroll-through). */
function allowScrollWithinOpenModal(target: EventTarget | null): boolean {
  const root = modalRootFromTarget(target);
  if (!root) return false;

  let el: Element | null = target as Element;
  while (el && root.contains(el)) {
    const st = window.getComputedStyle(el);
    const oy = st.overflowY;
    if ((oy === "auto" || oy === "scroll" || oy === "overlay") && el.scrollHeight > el.clientHeight + 2) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

function onTouchMoveCapture(e: TouchEvent) {
  if (lockCount === 0) return;
  if (allowScrollWithinOpenModal(e.target)) return;
  e.preventDefault();
}

function onWheelCapture(e: WheelEvent) {
  if (lockCount === 0) return;
  if (allowScrollWithinOpenModal(e.target)) return;
  e.preventDefault();
}

let gestureTrapAttached = false;

function attachGestureTrap() {
  if (gestureTrapAttached) return;
  document.addEventListener("touchmove", onTouchMoveCapture, { capture: true, passive: false });
  document.addEventListener("wheel", onWheelCapture, { capture: true, passive: false });
  gestureTrapAttached = true;
}

function detachGestureTrap() {
  if (!gestureTrapAttached) return;
  document.removeEventListener("touchmove", onTouchMoveCapture, { capture: true });
  document.removeEventListener("wheel", onWheelCapture, { capture: true });
  gestureTrapAttached = false;
}

function applyLock() {
  if (typeof document === "undefined") return;
  const body = document.body;
  const html = document.documentElement;

  if (lockCount === 0) {
    savedScrollY = window.scrollY;

    lockedAppScrollRoot = document.querySelector("[data-app-scroll-root]") as HTMLElement | null;
    if (lockedAppScrollRoot) {
      savedAppScrollRootTop = lockedAppScrollRoot.scrollTop;
      prevAppScrollRootOverflow = lockedAppScrollRoot.style.overflow;
      prevAppScrollRootOverscrollY = lockedAppScrollRoot.style.overscrollBehaviorY;
      prevAppScrollRootTouchAction = lockedAppScrollRoot.style.touchAction;
      lockedAppScrollRoot.style.overflow = "hidden";
      lockedAppScrollRoot.style.overscrollBehaviorY = "none";
      lockedAppScrollRoot.style.touchAction = "none";
    }

    prevBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overscrollBehaviorY: body.style.overscrollBehaviorY,
    };
    prevHtmlStyles = {
      overflow: html.style.overflow,
      overscrollBehaviorY: html.style.overscrollBehaviorY,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${savedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overscrollBehaviorY = "none";
    html.style.overflow = "hidden";
    html.style.overscrollBehaviorY = "none";
  }

  lockCount += 1;
  if (lockCount === 1) attachGestureTrap();
}

function releaseLock() {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;

  detachGestureTrap();

  const body = document.body;
  const html = document.documentElement;
  body.style.overflow = prevBodyStyles?.overflow ?? "";
  body.style.position = prevBodyStyles?.position ?? "";
  body.style.top = prevBodyStyles?.top ?? "";
  body.style.left = prevBodyStyles?.left ?? "";
  body.style.right = prevBodyStyles?.right ?? "";
  body.style.width = prevBodyStyles?.width ?? "";
  body.style.overscrollBehaviorY = prevBodyStyles?.overscrollBehaviorY ?? "";
  html.style.overflow = prevHtmlStyles?.overflow ?? "";
  html.style.overscrollBehaviorY = prevHtmlStyles?.overscrollBehaviorY ?? "";
  prevBodyStyles = null;
  prevHtmlStyles = null;
  window.scrollTo(0, savedScrollY);

  if (lockedAppScrollRoot) {
    lockedAppScrollRoot.style.overflow = prevAppScrollRootOverflow;
    lockedAppScrollRoot.style.overscrollBehaviorY = prevAppScrollRootOverscrollY;
    lockedAppScrollRoot.style.touchAction = prevAppScrollRootTouchAction;
    lockedAppScrollRoot.scrollTop = savedAppScrollRootTop;
    lockedAppScrollRoot = null;
  }
}

export function useBodyScrollLock(locked = true) {
  useLayoutEffect(() => {
    if (!locked) return;
    applyLock();
    return () => releaseLock();
  }, [locked]);
}
