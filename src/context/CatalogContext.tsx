"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import type { LessonCategory, Venue, WorkHours } from "@/context/types";

type CatalogContextValue = {
  categories: LessonCategory[];
  venues: Venue[];
  workHours: WorkHours;
  addCategory: (cat: Omit<LessonCategory, "id">) => void;
  updateCategory: (id: string, u: Partial<LessonCategory>) => void;
  deleteCategory: (id: string) => void;
  addVenue: (v: Omit<Venue, "id">) => void;
  updateVenue: (id: string, u: Partial<Venue>) => void;
  deleteVenue: (id: string) => void;
  setWorkHours: (wh: WorkHours) => void;
  getCategory: (id: string) => LessonCategory | undefined;
  getVenue: (id: string) => Venue | undefined;
  getVenueMapsUrl: (venueId: string) => string;
};

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const value = useMemo<CatalogContextValue>(
    () => ({
      categories: app.categories,
      venues: app.venues,
      workHours: app.workHours,
      addCategory: app.addCategory,
      updateCategory: app.updateCategory,
      deleteCategory: app.deleteCategory,
      addVenue: app.addVenue,
      updateVenue: app.updateVenue,
      deleteVenue: app.deleteVenue,
      setWorkHours: app.setWorkHours,
      getCategory: app.getCategory,
      getVenue: app.getVenue,
      getVenueMapsUrl: app.getVenueMapsUrl,
    }),
    [
      app.categories,
      app.venues,
      app.workHours,
      app.addCategory,
      app.updateCategory,
      app.deleteCategory,
      app.addVenue,
      app.updateVenue,
      app.deleteVenue,
      app.setWorkHours,
      app.getCategory,
      app.getVenue,
      app.getVenueMapsUrl,
    ],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog deve ser usado dentro de CatalogProvider");
  return ctx;
}
