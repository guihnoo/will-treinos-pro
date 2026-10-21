/**
 * Utilitário de feedback háptico (vibração tátil nativa) para PWA mobile.
 * Otimizado para feedback na quadra de vôlei (check-in, marcação de presença, ganho de XP).
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isHapticSupported(): boolean {
  return typeof window !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function";
}

export type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning";

/**
 * Dispara um pulso tátil rápido de acordo com o estilo desejado.
 */
export function triggerHapticImpact(style: HapticStyle = "light"): void {
  if (prefersReducedMotion() || !isHapticSupported()) return;

  try {
    switch (style) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(25);
        break;
      case "heavy":
        navigator.vibrate(50);
        break;
      case "success":
        navigator.vibrate([15, 30, 25]);
        break;
      case "warning":
        navigator.vibrate([30, 40, 30, 40, 30]);
        break;
    }
  } catch {
    // Silencia caso o navegador bloqueie por falta de interação prévia do usuário
  }
}

/**
 * Padrão festivo de celebração para conquista de novo Tier, Level Up ou Desafio Concluído.
 */
export function triggerHapticCelebration(tierUpgrade = false): void {
  if (prefersReducedMotion() || !isHapticSupported()) return;

  try {
    if (tierUpgrade) {
      // Padrão especial para evolução de nível / tier (Bronze -> Prata -> Ouro -> etc.)
      navigator.vibrate([35, 50, 60, 50, 100]);
    } else {
      // Padrão curto para check-in ou ganho expressivo de XP
      navigator.vibrate([20, 40, 20]);
    }
  } catch {
    // Silencia graciosamente
  }
}
