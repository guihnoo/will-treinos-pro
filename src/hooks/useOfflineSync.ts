"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { offlineCache } from "@/lib/offlineCache";

export interface UseOfflineSyncReturn {
  isOnline: boolean;
  hasPendingSync: boolean;
  pendingCount: number;
  syncNow: () => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const syncingRef = useRef(false);

  // Refresh pending count from cache
  const refreshPending = useCallback(() => {
    const pending = offlineCache.getPendingCheckins().filter((c) => !c.synced);
    setPendingCount(pending.length);
  }, []);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    const pending = offlineCache.getPendingCheckins().filter((c) => !c.synced);
    if (pending.length === 0) return;

    syncingRef.current = true;
    try {
      for (const checkin of pending) {
        try {
          const res = await fetch("/api/student/enroll-lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonId: checkin.lessonId, action: "enroll" }),
          });
          if (res.ok) {
            offlineCache.markCheckinSynced(checkin.lessonId);
          }
        } catch {
          // Network error for this check-in — skip and try next time
        }
      }
      offlineCache.clearSyncedCheckins();
      refreshPending();
    } finally {
      syncingRef.current = false;
    }
  }, [refreshPending]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when connection is restored
      void syncNow();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncNow]);

  return {
    isOnline,
    hasPendingSync: pendingCount > 0,
    pendingCount,
    syncNow,
  };
}
