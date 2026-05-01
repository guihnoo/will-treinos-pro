"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const CalendarTickContext = createContext<number | undefined>(undefined);

/** Um único intervalo para Lessons/Payments recalcularem “hoje” e referência de fatura com aba aberta. */
export function CalendarTickProvider({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  return <CalendarTickContext.Provider value={tick}>{children}</CalendarTickContext.Provider>;
}

export function useCalendarTick(): number {
  const tick = useContext(CalendarTickContext);
  if (tick === undefined) throw new Error("useCalendarTick deve ser usado dentro de CalendarTickProvider");
  return tick;
}
