"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

export interface XPFloatEvent {
  id: string;
  amount: number;
  timestamp: number;
  x?: number;
  y?: number;
}

interface XPFloatNotificationProps {
  events: XPFloatEvent[];
  onAnimationComplete: (id: string) => void;
}

export function XPFloatNotification({
  events,
  onAnimationComplete,
}: XPFloatNotificationProps) {
  const [dailyTotal, setDailyTotal] = useState(0);

  useEffect(() => {
    const total = events.reduce((sum, e) => sum + e.amount, 0);
    setDailyTotal(total);
  }, [events]);

  return (
    <>
      {/* Individual Float Animations */}
      <AnimatePresence>
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{
              opacity: 1,
              y: 0,
              x: event.x || window.innerWidth / 2,
              scale: 1,
            }}
            animate={{
              opacity: 0,
              y: -80,
              scale: 1.2,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
              delay: 0.05,
            }}
            onAnimationComplete={() => onAnimationComplete(event.id)}
            className="fixed pointer-events-none z-50 font-bold text-lg"
            style={{
              top: event.y || "50%",
              left: event.x || "50%",
              translateX: "-50%",
              translateY: "-50%",
            }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-gradient-to-r from-[#EAB308] to-[#F97316] text-black px-4 py-2 rounded-full shadow-lg shadow-[#EAB308]/50 backdrop-blur-sm"
            >
              <Zap className="w-4 h-4" />
              <span>+{event.amount} XP</span>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Daily Total Counter (bottom-left) */}
      {dailyTotal > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-8 left-8 z-40 pointer-events-none"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-[#131313] border-2 border-[#EAB308] rounded-full px-6 py-3 flex items-center gap-2 shadow-lg shadow-[#EAB308]/30"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-5 h-5 text-[#EAB308]" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xs text-white/60 font-bold uppercase tracking-widest">
                Hoje
              </span>
              <span className="text-lg font-black text-[#EAB308] tabular-nums">
                {dailyTotal.toLocaleString()} XP
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
