"use client";

import { motion } from "framer-motion";
import { XPBadge } from "./XPBadge";
import { AwardShowcase } from "./AwardShowcase";
import { XPHistoryList } from "./XPHistoryList";

export function GamificationPanel() {
  return (
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
  );
}
