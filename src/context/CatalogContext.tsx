"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LEGACY_BRIDGE } from "@/domain/v1/mockOrm";
import { wtLs } from "@/lib/willLocalStorage";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  fetchCatalogRemote,
  upsertCategoryRemote,
  deleteCategoryRemote,
  upsertVenueRemote,
  deleteVenueRemote,
} from "@/lib/supabasePersistence";
import { useAuth } from "@/context/AuthContext";
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
  const { usingSupabaseSession } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [categories, setCategories] = useState<LessonCategory[]>(LEGACY_BRIDGE.DEFAULT_CATEGORIES);
  const [venues, setVenues] = useState<Venue[]>(LEGACY_BRIDGE.DEFAULT_VENUES);
  const [workHours, setWorkHoursState] = useState<WorkHours>(LEGACY_BRIDGE.DEFAULT_WORK_HOURS);

  // On mount: load from Supabase if session exists, else fall back to localStorage
  useEffect(() => {
    setIsMounted(true);

    if (usingSupabaseSession) {
      const supabase = getSupabaseClient();
      fetchCatalogRemote(supabase)
        .then(({ categories: remoteCats, venues: remoteVenues }) => {
          if (remoteCats.length > 0) {
            setCategories(remoteCats);
          } else {
            // Seed Supabase with defaults on first run
            const defaults = LEGACY_BRIDGE.DEFAULT_CATEGORIES;
            setCategories(defaults);
            Promise.all(defaults.map((c) => upsertCategoryRemote(supabase, c))).catch(console.error);
          }
          if (remoteVenues.length > 0) {
            setVenues(remoteVenues);
          } else {
            const defaults = LEGACY_BRIDGE.DEFAULT_VENUES;
            setVenues(defaults);
            Promise.all(defaults.map((v) => upsertVenueRemote(supabase, v))).catch(console.error);
          }
        })
        .catch(console.error);
    } else {
      setCategories(wtLs.get("categories", LEGACY_BRIDGE.DEFAULT_CATEGORIES));
      setVenues(wtLs.get("venues", LEGACY_BRIDGE.DEFAULT_VENUES));
      setWorkHoursState(wtLs.get("workHours", LEGACY_BRIDGE.DEFAULT_WORK_HOURS));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingSupabaseSession]);

  // Persist to localStorage only in offline/demo mode
  useEffect(() => { if (isMounted && !usingSupabaseSession) wtLs.set("categories", categories); }, [categories, isMounted, usingSupabaseSession]);
  useEffect(() => { if (isMounted && !usingSupabaseSession) wtLs.set("venues", venues); }, [venues, isMounted, usingSupabaseSession]);
  useEffect(() => { if (isMounted) wtLs.set("workHours", workHours); }, [workHours, isMounted]);

  const addCategory = useCallback((c: WithoutId<LessonCategory>) => {
    const newCat: LessonCategory = { ...c, id: `cat_${uid()}` };
    setCategories(p => [...p, newCat]);
    if (usingSupabaseSession) {
      upsertCategoryRemote(getSupabaseClient(), newCat).catch(console.error);
    }
  }, [usingSupabaseSession]);

  const updateCategory = useCallback((id: string, u: Partial<LessonCategory>) => {
    setCategories(p => p.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, ...u };
      if (usingSupabaseSession) upsertCategoryRemote(getSupabaseClient(), updated).catch(console.error);
      return updated;
    }));
  }, [usingSupabaseSession]);

  const deleteCategory = useCallback((id: string) => {
    setCategories(p => p.filter(c => c.id !== id));
    if (usingSupabaseSession) {
      deleteCategoryRemote(getSupabaseClient(), id).catch(console.error);
    }
  }, [usingSupabaseSession]);

  const addVenue = useCallback((v: WithoutId<Venue>) => {
    const newVenue: Venue = { ...v, id: `v_${uid()}` };
    setVenues(p => [...p, newVenue]);
    if (usingSupabaseSession) {
      upsertVenueRemote(getSupabaseClient(), newVenue).catch(console.error);
    }
  }, [usingSupabaseSession]);

  const updateVenue = useCallback((id: string, u: Partial<Venue>) => {
    setVenues(p => p.map(v => {
      if (v.id !== id) return v;
      const updated = { ...v, ...u };
      if (usingSupabaseSession) upsertVenueRemote(getSupabaseClient(), updated).catch(console.error);
      return updated;
    }));
  }, [usingSupabaseSession]);

  const deleteVenue = useCallback((id: string) => {
    setVenues(p => p.filter(v => v.id !== id));
    if (usingSupabaseSession) {
      deleteVenueRemote(getSupabaseClient(), id).catch(console.error);
    }
  }, [usingSupabaseSession]);

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
