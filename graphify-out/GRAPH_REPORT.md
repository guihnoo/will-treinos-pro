# Graph Report - .  (2026-05-03)

## Corpus Check
- Large corpus: 353 files · ~270,478 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 835 nodes · 1137 edges · 45 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 73 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 52 edges
2. `getSupabaseClient()` - 29 edges
3. `useBodyScrollLock()` - 24 edges
4. `a` - 18 edges
5. `useToast()` - 17 edges
6. `v` - 15 edges
7. `z()` - 14 edges
8. `AppProvider()` - 14 edges
9. `hasSupabaseEnv()` - 14 edges
10. `localDateISO()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `s()` --calls--> `T()`  [INFERRED]
  public\fallback-ce627215c0e4a9af.js → public\workbox-3c9d0171.js
- `handlePhotoFile()` --calls--> `compressImageFileToDataUrl()`  [INFERRED]
  src\app\cadastro\page.tsx → src\lib\imageCompress.ts
- `handleSubmit()` --calls--> `getSupabaseClient()`  [INFERRED]
  src\app\cadastro\page.tsx → src\lib\supabaseClient.ts
- `loadEvents()` --calls--> `getSupabaseClient()`  [INFERRED]
  src\app\dev\monitor\page.tsx → src\lib\supabaseClient.ts
- `handleFile()` --calls--> `compressImageFileToDataUrl()`  [INFERRED]
  src\app\feed\page.tsx → src\lib\imageCompress.ts

## Communities (127 total, 28 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (4): cn(), Input(), Label(), Separator()

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (30): $(), a, b(), c(), d(), deleteCacheAndMetadata(), e(), et (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (25): KPICard(), toKpiLayoutId(), setDuration(), toMin(), FeedbackModal(), PerformanceEvalModal(), useToast(), TrainingPlanEditor() (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (40): handleSubmit(), PaymentsProvider(), withNetworkTimeout(), dueDateForBillingMonth(), paymentReferenceForDate(), generateNewEnrollmentInviteCode(), reduceAppConfigAfterInviteRemote(), resolveEnrollmentInviteCode() (+32 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (32): DevRoleImpersonationToggle(), AppProvider(), useCheckInActions(), useEnrollmentInviteSideEffects(), useFeedMutations(), useLessonMutations(), useLoadSupabaseCriticalData(), useLocalTransactionalPersistence() (+24 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (28): handlePhotoFile(), handleFile(), findLinkedStudentForAuth(), computeEffectiveRole(), isDevRootEmail(), postLoginRouteFromAuthUser(), readDevImpersonationFromStorage(), cadastroInviteRequired() (+20 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (15): RootLayout(), ToastProvider(), AppConfigProvider(), AuthProvider(), CalendarTickProvider(), CatalogProvider(), CheckInProvider(), CoachingProvider() (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (11): checkInGate(), checkInGate(), tick(), LessonsProvider(), lessonLocalDateTime(), localDateISO(), wtLegacyRoleGet(), wtLsGetString() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (9): useIsMobile(), Sheet(), SheetDescription(), SheetHeader(), SheetTitle(), SidebarMenuButton(), useSidebar(), Skeleton() (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.27
Nodes (4): d(), l(), r(), s()

### Community 15 - "Community 15"
Cohesion: 0.36
Nodes (6): handleEnable(), getJwt(), isPushSupported(), subscribeToPush(), unsubscribeFromPush(), urlBase64ToUint8Array()

### Community 16 - "Community 16"
Cohesion: 0.36
Nodes (8): allowScrollWithinOpenModal(), applyLock(), attachGestureTrap(), detachGestureTrap(), modalRootFromTarget(), onTouchMoveCapture(), onWheelCapture(), releaseLock()

### Community 17 - "Community 17"
Cohesion: 0.39
Nodes (6): addToRemoveQueue(), dispatch(), genId(), reducer(), toast(), useToast()

### Community 18 - "Community 18"
Cohesion: 0.52
Nodes (5): canAccessPrefix(), normalizeRole(), getGuardPrefix(), isPrivatePath(), middleware()

### Community 20 - "Community 20"
Cohesion: 0.48
Nodes (5): addToRemoveQueue(), dispatch(), genId(), reducer(), toast()

### Community 21 - "Community 21"
Cohesion: 0.52
Nodes (6): handleAddPaymentProof(), handleAddPost(), handleApproveCheckIn(), handleRequestCheckIn(), handleTogglePostLike(), POST()

### Community 25 - "Community 25"
Cohesion: 0.83
Nodes (3): buildFallback(), buildPrompt(), POST()

## Knowledge Gaps
- **15 isolated node(s):** `Sync Queue (Offline-First)`, `Students Context Provider`, `Lessons Context Provider`, `Payments Context Provider`, `Check-in Context Provider` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getSupabaseClient()` connect `Community 4` to `Community 2`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `sendPushToRole()` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `useBodyScrollLock()` connect `Community 2` to `Community 16`, `Community 5`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `getSupabaseClient()` (e.g. with `handleSubmit()` and `loadEvents()`) actually correct?**
  _`getSupabaseClient()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `useBodyScrollLock()` (e.g. with `PaymentModal()` and `FeedbackModal()`) actually correct?**
  _`useBodyScrollLock()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Sync Queue (Offline-First)`, `Students Context Provider`, `Lessons Context Provider` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._