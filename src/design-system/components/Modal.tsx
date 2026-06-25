"use client";

import React, { useEffect } from "react";
import { m, AnimatePresence } from "@/lib/motion";
import { ColorTokens } from "../tokens/colors";
import { MotionTokens } from "../tokens/motionTokens";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  theme?: "admin" | "coach" | "student" | "premium";
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  dismissible?: boolean;
}

/**
 * Modal Component — Theme-aware with animations
 * Admin: Fast/snappy
 * Coach: Smooth glassmorphism
 * Student: Bouncy with celebration
 * Premium: Weighty neumorphism
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  theme = "student",
  className,
  size = "md",
  dismissible = true,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  const backdropClass = cn(
    "fixed inset-0 flex items-center justify-center",
    theme === "admin" && "backdrop-blur-sm bg-black/30",
    theme === "coach" && "backdrop-blur-md bg-black/40",
    theme === "student" && "backdrop-blur-md bg-black/40",
    theme === "premium" && "backdrop-blur-lg bg-black/50"
  );

  const modalContentClass = cn(
    "rounded-3xl border w-full mx-4 relative",
    {
      // Admin: Brutalist, solid, no blur
      "bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#4b5563] shadow-2xl":
        theme === "admin",
      // Coach: Glassmorphism with cyan glow
      "bg-gradient-to-br from-[#000000]/80 to-[#0a0a0a]/80 border-white/20 backdrop-blur-2xl shadow-2xl shadow-cyan-500/20":
        theme === "coach",
      // Student: Glass with emerald glow
      "bg-gradient-to-br from-[#000000]/80 to-[#0a0a0a]/80 border-white/20 backdrop-blur-2xl shadow-2xl shadow-emerald-500/30":
        theme === "student",
      // Premium: Neumorphism solid, no glass
      "bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#A78BFA]/40 shadow-2xl shadow-purple-500/30":
        theme === "premium",
    },
    sizeClasses[size],
    className
  );

  const animationVariants = {
    hidden: {
      opacity: 0,
      ...(theme === "admin" ? { scale: 0.95 } : { scale: 0.9 }),
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: MotionTokens.springs[theme],
    },
    exit: {
      opacity: 0,
      ...(theme === "admin" ? { scale: 0.95 } : { scale: 0.9 }),
      transition: MotionTokens.springs[theme],
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          className={backdropClass}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismissible ? onClose : undefined}
          transition={{ duration: 0.2 }}
        >
          <m.div
            className={modalContentClass}
            variants={animationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || dismissible) && (
              <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
                {title && (
                  <h2
                    className={cn("text-lg font-semibold", {
                      "text-white": true,
                      "text-[#EF4444]": theme === "admin",
                      "text-[#06B6D4]": theme === "coach",
                      "text-[#10B981]": theme === "student",
                      "text-[#A78BFA]": theme === "premium",
                    })}
                  >
                    {title}
                  </h2>
                )}
                {dismissible && (
                  <m.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-white/60" />
                  </m.button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="px-6 py-6">{children}</div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
