# Skill: Responsive Testing — Will Treinos PRO

## When to use
After any layout, modal, card or navigation component change.

## Viewports to test

| Device | Width | Usage context |
|---|---|---|
| iPhone SE | 375px | Athlete using on the court |
| iPhone 15 Pro | 393px | Primary mobile standard |
| Pixel 7 | 412px | Common Android |
| iPad Mini | 768px | Coach using in locker room |
| Desktop | 1280px | Admin at office |

## What to verify at each viewport

### Mobile (375–412px)
- [ ] No horizontal overflow (unwanted side scroll)
- [ ] Touch targets ≥ 44px (buttons, links, cards)
- [ ] Modals use `calc(100dvh - Xrem)` with `overflow-y-auto`
- [ ] Safe-area-inset respected (iPhone notch)
- [ ] Keyboard doesn't cover input fields
- [ ] Navigation bar doesn't cover content

### Tablet (768px)
- [ ] Layout doesn't look too "stretched"
- [ ] Cards don't get too wide
- [ ] Sidebar (if any) behaves correctly

### Desktop (1280px)
- [ ] Layout has adequate max-width (doesn't fill 100% on ultra-wide)
- [ ] Hover states work correctly
- [ ] No mobile-only elements leaking

## Will Treinos PRO specific checklist

### WillCockpit (admin)
- KPI grid collapses correctly on mobile
- Modals cover full screen on mobile (not cut off)
- Today's Priorities readable at 375px

### CoachHome (coach)
- Check-in buttons ≥ 44px (court usage)
- Student list scrollable on mobile

### StudentHome (athlete)
- XP bar visible and animated at any size
- Premium cards readable
- Feed scrollable without freezing

## Report
```
📱 RESPONSIVE TEST — [component] [date]

375px: [issues / "ok"]
393px: [issues / "ok"]  
768px: [issues / "ok"]
1280px: [issues / "ok"]

Issues found: [list or "none"]
Status: ✅ APPROVED / ⚠️ ADJUSTMENTS NEEDED
```
