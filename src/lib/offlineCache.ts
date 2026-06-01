// Cache de dados essenciais no localStorage com TTL
// Usado para modo offline: aulas, XP e check-ins pendentes

const CACHE_KEYS = {
  upcomingLessons: "wt_offline_lessons",
  studentXP: "wt_offline_xp",
  pendingCheckins: "wt_offline_checkins",
} as const;

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type CachedLesson = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  categoryId: string;
  status: string;
};

type PendingCheckin = {
  lessonId: string;
  timestamp: string;
  synced: boolean;
};

type CacheEnvelope<T> = {
  data: T;
  savedAt: number;
};

function safeGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    if (Date.now() - envelope.savedAt > TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return envelope.data;
  } catch {
    return null;
  }
}

function safeSet<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: CacheEnvelope<T> = { data, savedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Storage quota exceeded — silent fail
  }
}

export const offlineCache = {
  /** Salva aulas dos próximos 7 dias (chamado quando online). */
  saveLessons(lessons: CachedLesson[]): void {
    safeSet(CACHE_KEYS.upcomingLessons, lessons);
  },

  getLessons(): CachedLesson[] {
    return safeGet<CachedLesson[]>(CACHE_KEYS.upcomingLessons) ?? [];
  },

  /** Salva XP e tier do aluno identificado por studentId. */
  saveStudentXP(studentId: string, totalXP: number, tier: string): void {
    const all = safeGet<Record<string, { totalXP: number; tier: string }>>(CACHE_KEYS.studentXP) ?? {};
    all[studentId] = { totalXP, tier };
    safeSet(CACHE_KEYS.studentXP, all);
  },

  getStudentXP(studentId: string): { totalXP: number; tier: string } | null {
    const all = safeGet<Record<string, { totalXP: number; tier: string }>>(CACHE_KEYS.studentXP);
    return all?.[studentId] ?? null;
  },

  /** Registra um check-in feito offline (sem conexão). */
  addPendingCheckin(lessonId: string): void {
    const existing = offlineCache.getPendingCheckins();
    const alreadyExists = existing.some((c) => c.lessonId === lessonId);
    if (alreadyExists) return;
    const updated: PendingCheckin[] = [
      ...existing,
      { lessonId, timestamp: new Date().toISOString(), synced: false },
    ];
    safeSet(CACHE_KEYS.pendingCheckins, updated);
  },

  getPendingCheckins(): PendingCheckin[] {
    return safeGet<PendingCheckin[]>(CACHE_KEYS.pendingCheckins) ?? [];
  },

  markCheckinSynced(lessonId: string): void {
    const existing = offlineCache.getPendingCheckins();
    const updated = existing.map((c) =>
      c.lessonId === lessonId ? { ...c, synced: true } : c
    );
    safeSet(CACHE_KEYS.pendingCheckins, updated);
  },

  clearSyncedCheckins(): void {
    const existing = offlineCache.getPendingCheckins();
    const unsync = existing.filter((c) => !c.synced);
    safeSet(CACHE_KEYS.pendingCheckins, unsync);
  },
} as const;
