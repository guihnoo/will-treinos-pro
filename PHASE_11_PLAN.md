# 🚀 Phase 11 — Real-time XP + Leaderboard (Planning)

**Status:** 📋 Planning  
**Estimated:** 3-4 hours  
**Complexity:** Medium (Supabase Realtime + UI components)

---

## 🎯 Goals

```
1. Real-time XP display (no refresh needed)
2. Leaderboard ranking (top 10 + your rank)
3. Award unlock notifications (push alerts)
4. Performance optimization (Realtime subscriptions)
```

---

## 📋 Implementation Plan

### **Part 1: Real-time XP Updates (Supabase Realtime)**

#### 1.1 Add Realtime Subscription to GamificationContext

```typescript
// src/context/GamificationContext.tsx
useEffect(() => {
  if (!user?.id) return;

  // Subscribe to xp_log changes for this student
  const channel = supabase
    .channel(`xp_log_${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'xp_log',
        filter: `student_id=eq.${user.id}`
      },
      (payload) => {
        // Refresh XP data when log changes
        refreshXPData();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id, supabase]);
```

**Files to Modify:**
- `src/context/GamificationContext.tsx` — Add Realtime channel

**Build Impact:** +0 (no new dependencies)

---

### **Part 2: Leaderboard Component**

#### 2.1 Create Leaderboard Hook

```typescript
// src/hooks/useLeaderboard.ts
export function useLeaderboard(timeframe: 'week' | 'month' | 'all') {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard(timeframe).then(data => {
      setEntries(data.entries);
      setUserRank(data.userRank);
    });

    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard')
      .on('postgres_changes', {...}, (payload) => {
        // Refresh leaderboard
        refetch();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [timeframe]);

  return { entries, userRank, loading };
}
```

#### 2.2 Create Leaderboard Components

```
src/components/leaderboard/
├── LeaderboardCard.tsx       # Individual entry
├── LeaderboardPanel.tsx      # Full leaderboard view
├── LeaderboardRanking.tsx    # Your rank highlighted
├── TimeframeSelector.tsx     # Week/Month/All toggle
└── LeaderboardStats.tsx      # Top 3 with medals
```

**Components:**

1. **LeaderboardCard** — Shows rank, name, XP, tier
   - Highlight current user
   - Show medal for top 3

2. **LeaderboardPanel** — Full 10-entry list
   - Timeframe selector (week/month/all)
   - Your rank section (if not in top 10)
   - Refresh button

3. **LeaderboardStats** — Top 3 podium
   - Gold, Silver, Bronze ribbons
   - Avatar + name + XP

**Files to Create:**
- `src/hooks/useLeaderboard.ts` — Data fetching + Realtime
- `src/components/leaderboard/` — 4 components

**Supabase Query:**
```sql
SELECT 
  u.id,
  u.name,
  s.avatar,
  SUM(x.total_xp) as total_xp,
  RANK() OVER (ORDER BY SUM(x.total_xp) DESC) as rank
FROM xp_log x
JOIN students s ON s.id = x.student_id
JOIN auth.users u ON u.id = s.auth_id
WHERE x.created_at >= (
  CASE 
    WHEN $1 = 'week' THEN NOW() - INTERVAL '7 days'
    WHEN $1 = 'month' THEN NOW() - INTERVAL '30 days'
    ELSE '1970-01-01'
  END
)
GROUP BY u.id, s.avatar
ORDER BY total_xp DESC
LIMIT 10;
```

---

### **Part 3: Leaderboard Integration**

#### 3.1 Add to Dashboard

```typescript
// src/components/StudentHome.tsx
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';

// Inside render:
<motion.div variants={homeItem}>
  <LeaderboardPanel timeframe="week" compact={true} />
</motion.div>
```

#### 3.2 Create Standalone Leaderboard Page

```
src/app/(student)/ranking/page.tsx
```

Shows:
- Top 10 players
- Your rank (if outside top 10)
- Timeframe selector
- Stats

**Files to Modify:**
- `src/components/StudentHome.tsx` — Add LeaderboardPanel section
- Create `src/app/(student)/ranking/page.tsx`

---

### **Part 4: Award Unlock Notifications (Push)**

#### 4.1 Trigger on Award Unlock

```typescript
// src/context/GamificationContext.tsx
const logXP = async (...) => {
  // ... existing logic
  
  // Check if any new award unlocked
  const newUnlockedAwards = awards.filter(
    (a) => !a.unlocked_at && a.xp_threshold <= newTotal
  );

  for (const award of newUnlockedAwards) {
    await supabase
      .from('awards')
      .update({ unlocked_at: new Date().toISOString() })
      .eq('id', award.id);

    // Send push notification
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(`🏆 Card Desbloqueado!`, {
        body: `Você desbloqueou ${award.tier.toUpperCase()}!`,
        icon: '/icons/trophy.png',
        tag: 'award-unlock',
        requireInteraction: false,
      });
    }
  }
};
```

**Files to Modify:**
- `src/context/GamificationContext.tsx` — Add notification trigger

---

## 🗂️ Summary of Changes

| Part | Files | Type | Complexity |
|------|-------|------|------------|
| 1. Real-time | GamificationContext.tsx | Modify | Low |
| 2. Leaderboard | 5 new files | Create | Medium |
| 3. Integration | 2 modified files | Modify | Low |
| 4. Notifications | GamificationContext.tsx | Modify | Low |

**Total New Files:** 5  
**Total Modified Files:** 3  
**Total Estimated LOC:** ~800-1000

---

## 📊 Testing Strategy

### Unit Tests
```
□ useLeaderboard hook (data fetching)
□ Rank calculation (SQL vs JS)
□ Realtime subscription (mock Supabase)
```

### E2E Tests
```
□ Leaderboard page loads
□ Timeframe selector works (week/month/all)
□ Your rank highlighted
□ Real-time updates (complete training → leaderboard updates)
□ Notification appears on award unlock
```

### Manual QA
```
□ Leaderboard in StudentHome dashboard
□ /ranking page
□ Real-time sync (2+ browser windows)
□ Push notification on award unlock
□ Mobile responsive (375px)
```

---

## ⚡ Performance Considerations

```
Leaderboard Query:
- Add index: (created_at) on xp_log
- Add index: (student_id) on awards
- Limit to 10 + 1 for user rank

Realtime Subscriptions:
- Subscribe per student (not broadcast all)
- Unsubscribe on unmount
- Limit frequency (debounce refresh)

Bundle Impact:
- No new major dependencies
- ~5KB min gzipped for leaderboard components
```

---

## 🚀 Rollout Plan

**Phase 11a — Real-time (1 hour)**
1. Add Realtime subscription to GamificationContext
2. Test with 2+ browser windows
3. Commit

**Phase 11b — Leaderboard (2 hours)**
1. Create useLeaderboard hook
2. Create 4 leaderboard components
3. Integrate into StudentHome + create /ranking page
4. Test responsiveness
5. Commit

**Phase 11c — Notifications (1 hour)**
1. Add push on award unlock
2. Test notification appearing
3. Commit

**Phase 11d — E2E Tests (30 min)**
1. Add Playwright tests for leaderboard
2. Test real-time sync
3. Test notifications
4. Commit

**Total:** 4-5 hours

---

## ✅ Definition of Done

- [ ] Real-time XP updates work (Supabase Realtime)
- [ ] Leaderboard shows top 10 + your rank
- [ ] Timeframe selector works (week/month/all)
- [ ] Leaderboard page at /ranking
- [ ] Dashboard has compact leaderboard
- [ ] Award unlock triggers push notification
- [ ] Mobile responsive (all components)
- [ ] No performance regression (bundle, query time)
- [ ] E2E tests pass
- [ ] Docs updated (MASTER_MEMORY, QUICK_REFERENCE)
- [ ] Build green (no errors)

---

## 📝 Notes

**Dependencies Already Available:**
- ✅ Supabase Realtime (included in @supabase/supabase-js)
- ✅ Web Push API (already have VAPID keys)
- ✅ Service Worker (already set up)
- ✅ Framer Motion (for animations)

**No New Package Installs Needed**

---

**Ready to Implement?** → Start with Part 1 (Real-time)

Next: `PHASE_11_IMPLEMENTATION.md` (step-by-step code)
