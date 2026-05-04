/**
 * WILL TREINOS PRO — Color System
 * Gold (#EAB308) é INVARIÁVEL em todas as themes
 * Cada role tem accent secundário único
 */

export const ColorTokens = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FOUNDATION — Nunca muda
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  background: {
    primary: "#000000",
    secondary: "#0a0a0a",
    tertiary: "#1a1a1a",
  },

  text: {
    primary: "#ffffff",
    secondary: "#d4d4d8",
    muted: "#71717a",
  },

  gold: {
    DEFAULT: "#EAB308",
    light: "#facc15",
    dark: "#ca8a04",
    glow: "rgba(234, 179, 8, 0.3)",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // THEME: ADMIN — Control Room (Red + Gold + Brutalist)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  admin: {
    accent: "#EF4444",
    accentLight: "#F87171",
    accentDark: "#DC2626",
    glowColor: "rgba(239, 68, 68, 0.3)",
    border: "#4b5563",
    hoverBg: "rgba(239, 68, 68, 0.05)",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // THEME: COACH — Technical Precision (Cyan + Gold + Glassmorphism)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  coach: {
    accent: "#06B6D4",
    accentLight: "#22D3EE",
    accentDark: "#0891B2",
    glowColor: "rgba(6, 182, 212, 0.3)",
    border: "#1e3a4c",
    hoverBg: "rgba(6, 182, 212, 0.05)",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // THEME: ALUNO — Gamification Celebration (Emerald + Gold + Playful)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  student: {
    accent: "#10B981",
    accentLight: "#6EE7B7",
    accentDark: "#059669",
    glowColor: "rgba(16, 185, 129, 0.3)",
    border: "#1a4d3b",
    hoverBg: "rgba(16, 185, 129, 0.05)",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // THEME: PREMIUM — Luxury Neumorphism (Purple + Gold + Solid)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  premium: {
    accent: "#A78BFA",
    accentLight: "#C4B5FD",
    accentDark: "#9333EA",
    glowColor: "rgba(167, 139, 250, 0.3)",
    border: "#3b2d6b",
    hoverBg: "rgba(167, 139, 250, 0.08)",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Semantic colors (usados em contextos gerais)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  semantic: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#06B6D4",
    disabled: "#52525b",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Utilities
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  transparent: "transparent",
  white: "#ffffff",
  black: "#000000",
} as const;

/**
 * Theme-aware color resolver
 * Usage: getThemeColor('admin', 'accent') → #EF4444
 */
export const getThemeColor = (
  theme: "admin" | "coach" | "student" | "premium",
  colorKey: string
) => {
  const colors = ColorTokens[theme as keyof typeof ColorTokens] as Record<
    string,
    string
  >;
  return colors[colorKey] || ColorTokens.gold.DEFAULT;
};
