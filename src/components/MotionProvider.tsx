"use client";

import { LazyMotion, domAnimation } from "framer-motion";

/** Carrega subset de animações (~40% menor que framer-motion completo). */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict={false}>
      {children}
    </LazyMotion>
  );
}
