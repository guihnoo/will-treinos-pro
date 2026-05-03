---
type: community
members: 6
---

# Core Architecture

**Members:** 6 nodes

## Members
- [[Auth Flow (OAuth + Consolidation)]] - code - src/context
- [[CoachHome Component]] - code - src/components/CoachHome.tsx
- [[Lessons Context Provider]] - code - src/context/LessonsContext.tsx
- [[Modal-First Architecture]] - code - src/components
- [[StudentHome Component]] - code - src/components/StudentHome.tsx
- [[Students Context Provider]] - code - src/context/StudentsContext.tsx

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Core_Architecture
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Hooks & Mutations]]

## Top bridge nodes
- [[Students Context Provider]] - degree 4, connects to 1 community