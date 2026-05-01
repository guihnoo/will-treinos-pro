"use client";

import { useEffect, useState } from "react";

/** Incrementa em intervalo fixo para “hoje” / referência de fatura atualizarem com aba aberta (virada de dia/mês). */
export function useCalendarTick(intervalMs = 60_000): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
