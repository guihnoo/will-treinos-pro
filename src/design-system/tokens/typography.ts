/**
 * WILL TREINOS PRO — Typography Tokens
 * Lexend (humanist, body) + Space Grotesk (geometric, display)
 * Scale: 12px → 56px
 */

export const TypographyTokens = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DISPLAY — Titles, CTAs, emphasis
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  display: {
    lg: {
      fontSize: "3.5rem", // 56px
      lineHeight: "1.1",
      fontWeight: 700,
      fontFamily: "'Space Grotesk', sans-serif",
      letterSpacing: "-0.02em",
    },
    md: {
      fontSize: "2.25rem", // 36px
      lineHeight: "1.2",
      fontWeight: 700,
      fontFamily: "'Space Grotesk', sans-serif",
      letterSpacing: "-0.01em",
    },
    sm: {
      fontSize: "1.875rem", // 30px
      lineHeight: "1.3",
      fontWeight: 600,
      fontFamily: "'Space Grotesk', sans-serif",
      letterSpacing: "0",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HEADING — Sections, cards titles
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  heading: {
    xl: {
      fontSize: "1.5rem", // 24px
      lineHeight: "1.4",
      fontWeight: 700,
      fontFamily: "'Space Grotesk', sans-serif",
    },
    lg: {
      fontSize: "1.25rem", // 20px
      lineHeight: "1.4",
      fontWeight: 600,
      fontFamily: "'Space Grotesk', sans-serif",
    },
    md: {
      fontSize: "1.125rem", // 18px
      lineHeight: "1.5",
      fontWeight: 600,
      fontFamily: "'Space Grotesk', sans-serif",
    },
    sm: {
      fontSize: "1rem", // 16px
      lineHeight: "1.5",
      fontWeight: 600,
      fontFamily: "'Space Grotesk', sans-serif",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BODY — Main content, descriptions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  body: {
    lg: {
      fontSize: "1.125rem", // 18px
      lineHeight: "1.6",
      fontWeight: 400,
      fontFamily: "'Lexend', sans-serif",
    },
    md: {
      fontSize: "1rem", // 16px
      lineHeight: "1.6",
      fontWeight: 400,
      fontFamily: "'Lexend', sans-serif",
    },
    sm: {
      fontSize: "0.875rem", // 14px
      lineHeight: "1.5",
      fontWeight: 400,
      fontFamily: "'Lexend', sans-serif",
    },
    xs: {
      fontSize: "0.75rem", // 12px
      lineHeight: "1.5",
      fontWeight: 400,
      fontFamily: "'Lexend', sans-serif",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LABEL — Form labels, badges, tags
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  label: {
    lg: {
      fontSize: "0.875rem", // 14px
      lineHeight: "1.4",
      fontWeight: 600,
      fontFamily: "'Space Grotesk', sans-serif",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
    },
    md: {
      fontSize: "0.75rem", // 12px
      lineHeight: "1.4",
      fontWeight: 600,
      fontFamily: "'Space Grotesk', sans-serif",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
    },
    sm: {
      fontSize: "0.625rem", // 10px
      lineHeight: "1.4",
      fontWeight: 700,
      fontFamily: "'Space Grotesk', sans-serif",
      textTransform: "uppercase" as const,
      letterSpacing: "0.1em",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MONO — Code, metrics, numbers
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  mono: {
    lg: {
      fontSize: "1rem", // 16px
      lineHeight: "1.5",
      fontWeight: 500,
      fontFamily: "'Courier New', monospace",
    },
    md: {
      fontSize: "0.875rem", // 14px
      lineHeight: "1.5",
      fontWeight: 500,
      fontFamily: "'Courier New', monospace",
    },
    sm: {
      fontSize: "0.75rem", // 12px
      lineHeight: "1.5",
      fontWeight: 500,
      fontFamily: "'Courier New', monospace",
    },
  },
} as const;

/**
 * Helper: Get typography style by variant
 * Usage: getTypography('heading', 'md') → { fontSize: '20px', ... }
 */
export const getTypography = (
  category: "display" | "heading" | "body" | "label" | "mono",
  size: "lg" | "md" | "sm" | "xs" | "xl"
): Record<string, string | number> => {
  const typeCategory = TypographyTokens[category] as Record<
    string,
    Record<string, string | number>
  >;
  return typeCategory[size] || typeCategory.md;
};

/**
 * CSS class generator (for Tailwind integration)
 * Usage: className={getTypographyClass('heading', 'lg')}
 */
export const getTypographyClass = (
  category: "display" | "heading" | "body" | "label" | "mono",
  size: "lg" | "md" | "sm" | "xs" | "xl"
): string => {
  return `font-${category}-${size}`;
};
