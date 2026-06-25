"use client";

import React from "react";
import { m, MotionProps } from "@/lib/motion";
import { ColorTokens } from "../tokens/colors";
import { MotionTokens } from "../tokens/motionTokens";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Button variants
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        // Filled buttons (CTA primary)
        solid: "font-semibold",
        // Outlined buttons (secondary)
        outline: "border-2",
        // Ghost buttons (tertiary)
        ghost: "",
        // Danger buttons (destructive)
        danger: "",
      },
      theme: {
        admin: "",
        coach: "",
        student: "",
        premium: "",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2.5 text-base",
        lg: "px-6 py-3.5 text-lg",
        xl: "px-8 py-4 text-lg",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      // Admin: Red, solid/outline/ghost
      {
        theme: "admin",
        variant: "solid",
        className:
          "bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40",
      },
      {
        theme: "admin",
        variant: "outline",
        className:
          "border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 hover:border-[#EF4444]",
      },
      {
        theme: "admin",
        variant: "ghost",
        className:
          "text-[#EF4444] hover:bg-[#EF4444]/10 active:bg-[#EF4444]/20",
      },
      {
        theme: "admin",
        variant: "danger",
        className:
          "bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-lg shadow-red-500/30",
      },

      // Coach: Cyan, glassmorphic
      {
        theme: "coach",
        variant: "solid",
        className:
          "bg-[#06B6D4] hover:bg-[#0891B2] text-black font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40",
      },
      {
        theme: "coach",
        variant: "outline",
        className:
          "border-[#06B6D4] text-[#06B6D4] hover:bg-[#06B6D4]/10 hover:backdrop-blur-sm",
      },
      {
        theme: "coach",
        variant: "ghost",
        className:
          "text-[#06B6D4] hover:bg-[#06B6D4]/10 active:bg-[#06B6D4]/20",
      },
      {
        theme: "coach",
        variant: "danger",
        className:
          "bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-lg shadow-red-500/30",
      },

      // Student: Emerald, playful/bouncy
      {
        theme: "student",
        variant: "solid",
        className:
          "bg-[#10B981] hover:bg-[#059669] text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-95",
      },
      {
        theme: "student",
        variant: "outline",
        className:
          "border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10 active:bg-[#10B981]/20",
      },
      {
        theme: "student",
        variant: "ghost",
        className:
          "text-[#10B981] hover:bg-[#10B981]/15 active:bg-[#10B981]/30",
      },
      {
        theme: "student",
        variant: "danger",
        className:
          "bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-lg shadow-red-500/30",
      },

      // Premium: Purple, luxury/neumorphic
      {
        theme: "premium",
        variant: "solid",
        className:
          "bg-gradient-to-br from-[#A78BFA] to-[#9333EA] hover:from-[#9333EA] hover:to-[#7E22CE] text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50",
      },
      {
        theme: "premium",
        variant: "outline",
        className:
          "border-[#A78BFA] text-[#A78BFA] hover:bg-[#A78BFA]/10 hover:border-[#A78BFA]",
      },
      {
        theme: "premium",
        variant: "ghost",
        className:
          "text-[#A78BFA] hover:bg-[#A78BFA]/10 active:bg-[#A78BFA]/20",
      },
      {
        theme: "premium",
        variant: "danger",
        className:
          "bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-lg shadow-red-500/30",
      },

      // Gold CTA (universal, overrides theme)
      {
        variant: "solid",
        theme: ["admin", "coach", "student", "premium"],
        className: "",
      },
    ],
    defaultVariants: {
      variant: "solid",
      theme: "student",
      size: "md",
      fullWidth: false,
    },
  }
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

interface ButtonProps extends ButtonVariants {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

/**
 * Button Component — Theme-aware with spring animations
 * Usage:
 *   <Button theme="student" size="lg">Click me</Button>
 *   <Button theme="admin" variant="outline">Admin action</Button>
 *   <Button theme="premium" isLoading>Processing...</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "solid",
      theme = "student",
      size = "md",
      fullWidth = false,
      isLoading = false,
      loadingText = "Loading...",
      children,
      disabled,
      type = "button",
      onClick,
    },
    ref
  ) => {
    const baseClass = buttonVariants({
      variant,
      theme,
      size,
      fullWidth,
    });

    // Animation presets
    const getHoverScale = (): { scale: number; y: number } => {
      switch (theme) {
        case "admin":
          return { scale: 1.02, y: -1 };
        case "coach":
          return { scale: 1.03, y: -2 };
        case "student":
          return { scale: 1.05, y: -3 };
        case "premium":
          return { scale: 1.03, y: -2 };
        default:
          return { scale: 1.02, y: 0 };
      }
    };

    const isInteractive = !disabled && !isLoading;

    return (
      <m.button
        ref={ref}
        className={cn(baseClass, className)}
        whileHover={isInteractive ? getHoverScale() : undefined}
        whileTap={isInteractive ? { scale: 0.98 } : undefined}
        transition={MotionTokens.springs[theme]}
        disabled={disabled || isLoading}
        type={type}
        onClick={onClick}
      >
        {isLoading ? (
          <>
            <m.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
              className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
            />
            {loadingText}
          </>
        ) : (
          children
        )}
      </m.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
