"use client";

import React from "react";
import { m, MotionProps } from "@/lib/motion";
import { ColorTokens } from "../tokens/colors";
import { MotionTokens } from "../tokens/motionTokens";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Style variants
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const cardVariants = cva(
  "relative rounded-2xl border transition-all duration-200",
  {
    variants: {
      theme: {
        admin: `
          bg-gradient-to-br from-[${ColorTokens.background.secondary}] to-[${ColorTokens.background.tertiary}]
          border-[${ColorTokens.admin.border}]
          hover:border-[${ColorTokens.admin.accent}]
          hover:bg-gradient-to-br hover:from-[${ColorTokens.background.secondary}] hover:to-[${ColorTokens.background.tertiary}]
          shadow-lg hover:shadow-xl hover:shadow-red-500/20
        `,
        coach: `
          bg-gradient-to-br from-[${ColorTokens.background.secondary}]/80 to-[${ColorTokens.background.tertiary}]/80
          backdrop-blur-xl border-white/20
          hover:border-[${ColorTokens.coach.accentLight}]
          hover:bg-gradient-to-br hover:from-[${ColorTokens.background.secondary}]/90 hover:to-[${ColorTokens.background.tertiary}]/90
          hover:shadow-xl hover:shadow-cyan-500/20
        `,
        student: `
          bg-gradient-to-br from-[${ColorTokens.background.secondary}] to-[${ColorTokens.background.tertiary}]
          border-[${ColorTokens.student.border}]
          hover:border-[${ColorTokens.student.accent}]
          hover:shadow-xl hover:shadow-emerald-500/30
        `,
        premium: `
          bg-gradient-to-br from-[${ColorTokens.background.secondary}] to-[${ColorTokens.background.tertiary}]
          border-[${ColorTokens.premium.accentLight}]/40
          hover:border-[${ColorTokens.premium.accentLight}]/80
          shadow-xl shadow-purple-500/20
          hover:shadow-2xl hover:shadow-purple-500/40
        `,
      },
      padding: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      theme: "student",
      padding: "md",
      interactive: false,
    },
  }
);

type CardVariants = VariantProps<typeof cardVariants>;

interface CardProps extends CardVariants {
  children: React.ReactNode;
  hover?: boolean;
  animated?: boolean;
  animationTheme?: "admin" | "coach" | "student" | "premium";
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

/**
 * Card Component — Theme-aware with Glassmorphism/Brutalist/Neumorphism
 * Usage:
 *   <Card theme="student" interactive>Content</Card>
 *   <Card theme="premium" animated>Premium card</Card>
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      theme = "student",
      padding = "md",
      interactive = false,
      hover = interactive,
      animated = interactive,
      animationTheme = theme,
      children,
      onClick,
    },
    ref
  ) => {
    const baseClass = cardVariants({
      theme,
      padding,
      interactive,
    });

    const variants = animated
      ? {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -12 },
          transition: MotionTokens.springs[animationTheme],
        }
      : {};

    return (
      <m.div
        ref={ref}
        className={cn(baseClass, className)}
        whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
        whileTap={hover ? { scale: 0.98 } : undefined}
        onClick={onClick}
        {...variants}
      >
        {/* Gradient overlay for interactive feedback */}
        {interactive && theme !== "admin" && (
          <m.div
            className={cn(
              "absolute inset-0 rounded-2xl opacity-0 transition-opacity",
              {
                "group-hover:opacity-10 bg-gradient-to-br from-white to-transparent":
                  true,
              }
            )}
          />
        )}

        {/* Children wrapper */}
        <div className="relative z-10">{children}</div>
      </m.div>
    );
  }
);

Card.displayName = "Card";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Card.Header, Card.Body, Card.Footer helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CardHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("mb-4 border-b border-white/10 pb-4", className)}>{children}</div>;

export const CardBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("space-y-3", className)}>{children}</div>;

export const CardFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("mt-4 border-t border-white/10 pt-4", className)}>{children}</div>;
