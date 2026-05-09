"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Zap, CheckSquare, Calendar, AlertCircle, X } from "lucide-react";
import Link from "next/link";

interface FloatingActionMenuProps {
  onCheckIn?: () => void;
  onViewLessons?: () => void;
  onReportAbsence?: () => void;
}

export function FloatingActionMenu({
  onCheckIn,
  onViewLessons,
  onReportAbsence,
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      id: "checkin",
      label: "Check-in",
      icon: CheckSquare,
      color: "from-green-500 to-emerald-600",
      action: () => {
        onCheckIn?.();
        setIsOpen(false);
      },
    },
    {
      id: "lessons",
      label: "Aulas Hoje",
      icon: Calendar,
      color: "from-blue-500 to-cyan-600",
      action: () => {
        onViewLessons?.();
        setIsOpen(false);
      },
    },
    {
      id: "absence",
      label: "Comunicar Falta",
      icon: AlertCircle,
      color: "from-orange-500 to-red-600",
      action: () => {
        onReportAbsence?.();
        setIsOpen(false);
      },
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/30 z-30"
          />
        )}
      </AnimatePresence>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-40 flex flex-col gap-3"
          >
            {actions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ delay: idx * 0.05, type: "spring", stiffness: 300 }}
                  onClick={action.action}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-3 px-5 py-3 rounded-full font-bold text-sm text-white shadow-lg hover:shadow-xl transition-all bg-gradient-to-r ${action.color}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="whitespace-nowrap">{action.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-[#EAB308] to-[#F97316] text-black shadow-lg shadow-[#EAB308]/50 flex items-center justify-center font-bold"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Zap className="w-6 h-6" />
          )}
        </motion.div>
      </motion.button>
    </>
  );
}
