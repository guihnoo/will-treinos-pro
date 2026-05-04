/**
 * WILL TREINOS PRO — Motion Tokens
 * Spring physics presets for each role
 * Framer Motion configuration
 */

import { Variants } from "framer-motion";

export const MotionTokens = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SPRINGS — Role-specific responsiveness
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  springs: {
    // Admin: Snappy, responsive, zero lag
    // Usage: Control room needs instant feedback
    admin: {
      type: "spring" as const,
      stiffness: 350,
      damping: 35,
      mass: 0.3,
    },

    // Coach: Smooth, technical, reliable
    // Usage: Coach interface is outdoors, needs fluid precision
    coach: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
      mass: 0.5,
    },

    // Aluno (Student): Bouncy, celebratory, playful
    // Usage: Gamification, XP unlocks, card reveals
    student: {
      type: "spring" as const,
      stiffness: 100,
      damping: 10,
      mass: 0.8,
    },

    // Premium: Deliberate, weighty, luxury feel
    // Usage: Neumorphic cards, exclusive unlock animations
    premium: {
      type: "spring" as const,
      stiffness: 120,
      damping: 40,
      mass: 1.0,
    },
  } as const,

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PRESETS — Reusable animation patterns
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  fadeUp: (theme: "admin" | "coach" | "student" | "premium" = "student") => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: MotionTokens.springs[theme],
  } as Variants),

  scaleIn: (theme: "admin" | "coach" | "student" | "premium" = "student") => ({
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: MotionTokens.springs[theme],
  } as Variants),

  slideInRight: (
    theme: "admin" | "coach" | "student" | "premium" = "student"
  ) => ({
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
    transition: MotionTokens.springs[theme],
  } as Variants),

  slideInLeft: (
    theme: "admin" | "coach" | "student" | "premium" = "student"
  ) => ({
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
    transition: MotionTokens.springs[theme],
  } as Variants),

  bounce: () => ({
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
    transition: {
      type: "spring" as const,
      stiffness: 80,
      damping: 8,
      mass: 1.2,
    },
  } as Variants),

  // Special: Card flip (student/premium)
  cardFlip: {
    initial: { rotateY: -90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: 90, opacity: 0 },
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 20,
      mass: 0.6,
    },
  } as Variants,

  // Special: XP counter pop (student only)
  xpPop: {
    initial: { scale: 0.5, y: 0, opacity: 0 },
    animate: {
      scale: 1,
      y: -40,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 10,
      },
    },
    exit: { opacity: 0, y: -80 },
  } as Variants,

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HOVER & GESTURE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  hoverScale: (theme: "admin" | "coach" | "student" | "premium") => {
    const scale = theme === "admin" ? 1.02 : theme === "student" ? 1.05 : 1.03;
    return {
      whileHover: { scale },
      whileTap: { scale: scale - 0.02 },
      transition: MotionTokens.springs[theme],
    };
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DURATIONS (in seconds, for CSS animations)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  duration: {
    fast: 0.12, // Admin snappy
    normal: 0.2, // Coach technical
    slow: 0.3, // Standard fade/slide
    celebration: 0.5, // Student playful
    luxury: 0.4, // Premium deliberate
  } as const,
} as const;

/**
 * Helper: Get spring config by theme
 * Usage: getSpring('student') → { stiffness: 100, damping: 10, ... }
 */
export const getSpring = (
  theme: "admin" | "coach" | "student" | "premium" = "student"
) => MotionTokens.springs[theme];

/**
 * Helper: Get animation preset by theme
 * Usage: getAnimation('fadeUp', 'coach') → Variants for coach theme
 */
export const getAnimation = (
  preset:
    | "fadeUp"
    | "scaleIn"
    | "slideInRight"
    | "slideInLeft"
    | "bounce"
    | "cardFlip"
    | "xpPop",
  theme: "admin" | "coach" | "student" | "premium" = "student"
) => {
  if (preset === "cardFlip" || preset === "xpPop") {
    return MotionTokens[preset];
  }
  return MotionTokens[preset](theme);
};
