"use client";

import { motion } from "framer-motion";
import { XPBadge } from "./XPBadge";
import { AwardShowcase } from "./AwardShowcase";
import { XPHistoryList } from "./XPHistoryList";
import { XPFloatNotification } from "@/components/XPFloatNotification";
import { useGamification } from "@/context/GamificationContext";

export function GamificationPanel() {
  const { xpFloatEvents, removeXPFloat } = useGamification();

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <XPBadge />
        <AwardShowcase />
        <XPHistoryList />
      </motion.div>
      <XPFloatNotification
        events={xpFloatEvents}
        onAnimationComplete={removeXPFloat}
      />
    </>
  );
}
