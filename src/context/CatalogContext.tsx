"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LEGACY_BRIDGE } from "@/domain/v1/mockOrm";
import { wtLs } from "@/lib/willLocalStorage";
import type { LessonCategory, Venue, WorkHours, WithoutId } from "@/context/types";

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

type CatalogContextValue = {
  categories: LessonCategory[];
  venues: Venue[];
  workHours: WorkHours;
  addCategory: (c: WithoutId<LessonCategory>) => void;
  updateCategory: (id: string, u: Partial<LessonCategory>) => void;
  deleteCategory: (id: string) => void;
  addVenue: (v: WithoutId<Venue>) => void;
  updateVenue: (id: string, u: Partial<Venue>) => void;
  deleteVenue: (id: string) => void;
  setWorkHours: (wh: WorkHours) => void;
  getCategory: (id: string) => LessonCategory | undefined;
  getVenue: (id: string) => Venue | undefined;
  getVenueMapsUrl: (venueId: string) => string;
};

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [categories, setCategories] = useState<LessonCategory[]>(LEGACY_BRIDGE.DEFAULT_CATEGORIES);
  const [venues, setVenues] = useState<Venue[]>(LEGACY_BRIDGE.DEFAULT_VENUES);
  const [workHours, setWorkHoursState] = useState<WorkHours>(LEGACY_BRIDGE.DEFAULT_WORK_HOURS);

  useEffect(() => {
    setIsMounted(true);
    const savedCategories = wtLs.get("categories", LEGACY_BRIDGE.DEFAULT_CATEGORIES);
    const savedVenues = wtLs.get("venues", LEGACY_BRIDGE.DEFAULT_VENUES);
    const savedWorkHours = wtLs.get("workHours", LEGACY_BRIDGE.DEFAULT_WORK_HOURS);

    setCategories(savedCategories);
    setVenues(savedVenues);
    setWorkHoursState(savedWorkHours);
  }, []);

  useEffect(() => { if (isMounted) wtLs.set("categories", categories); }, [categories, isMounted]);
  useEffect(() => { if (isMounted) wtLs.set("venues", venues); }, [venues, isMounted]);
  useEffect(() => { if (isMounted) wtLs.set("workHours", workHours); }, [workHours, isMounted]);

  const addCategory = useCallback(
    (c: WithoutId<LessonCategory>) => setCategories(p => [...p, { ...c, id: `cat_${uid()}` }]), []);
  const updateCategory = useCallback(
    (id: string, u: Partial<LessonCategory>) => setCategories(p => p.map(c => c.id === id ? { ...c, ...u } : c)), []);
  const deleteCategory = useCallback(
    (id: string) => setCategories(p => p.filter(c => c.id !== id)), []);

  const addVenue = useCallback(
    (v: WithoutId<Venue>) => setVenues(p => [...p, { ...v, id: `v_${uid()}` }]), []);
  const updateVenue = useCallback(
    (id: string, u: Partial<Venue>) => setVenues(p => p.map(v => v.id === id ? { ...v, ...u } : v)), []);
  const deleteVenue = useCallback(
    (id: string) => setVenues(p => p.filter(v => v.id !== id)), []);
  const setWorkHours = useCallback((wh: WorkHours) => setWorkHoursState(wh), []);

  const getCategory = useCallback((id: string) => categories.find(c => c.id === id), [categories]);
  const getVenue = useCallback((id: string) => venues.find(v => v.id === id), [venues]);
  const getVenueMapsUrl = useCallback((venueId: string) => {
    const venue = venues.find(v => v.id === venueId);
    return venue ? `https://www.google.com/maps?q=${venue.lat},${venue.lng}` : "#";
  }, [venues]);

  const value = useMemo<CatalogContextValue>(() => ({
    categories, venues, workHours,
    addCategory, updateCategory, deleteCategory,
    addVenue, updateVenue, deleteVenue, setWorkHours,
    getCategory, getVenue, getVenueMapsUrl,
  }), [
    categories, venues, workHours,
    addCategory, updateCategory, deleteCategory,
    addVenue, updateVenue, deleteVenue, setWorkHours,
    getCategory, getVenue, getVenueMapsUrl,
  ]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog deve ser usado dentro de CatalogProvider");
  return ctx;
}
