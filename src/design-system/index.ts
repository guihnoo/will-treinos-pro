/**
 * WILL TREINOS PRO — Design System
 * Central export point for all design tokens, components, and utilities
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOKENS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export { ColorTokens, getThemeColor } from "./tokens/colors";
export { MotionTokens, getSpring, getAnimation } from "./tokens/motionTokens";
export { TypographyTokens, getTypography, getTypographyClass } from "./tokens/typography";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export { Card, CardHeader, CardBody, CardFooter } from "./components/Card";
export { Modal } from "./components/Modal";
export { Button } from "./components/Button";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type Theme = "admin" | "coach" | "student" | "premium";
