# Skill: Visual QA Testing — Will Treinos PRO

## When to use
After any UI/component change. Verify that visuals, console, and network are healthy.

## Protocol

### 1. Start the dev server
```bash
pnpm run dev
```
Confirm running at `http://localhost:3000`

### 2. Open in Cursor's browser
Navigate to the changed page/component.

### 3. Screenshot each state
Capture:
- Normal state (data loaded)
- Loading state (skeleton)
- Empty state (no data)
- Error state (if applicable)
- Mobile version (390px viewport)

### 4. Check console
Flags to report:
- 🔴 JavaScript errors (breaks functionality)
- 🟠 React warnings (hydration, duplicate keys, refs)
- 🟡 Performance warnings (excessive re-renders)

### 5. Check network
Flags to report:
- Requests with 4xx or 5xx status
- Duplicate requests to same endpoint
- Very large payloads (>500KB)
- Unauthenticated Supabase requests

### 6. Check mobile
- Touch targets ≥ 44px (inspect clickable elements)
- Scroll works without freezing
- No horizontal overflow
- Modals don't cover notch area (safe-area-inset)

## Report format
```
📸 VISUAL QA — [component] [date]

Screenshots: [list]
Console: [errors/warnings found or "clean"]
Network: [issues or "healthy"]
Mobile: [issues or "ok"]

Status: ✅ APPROVED / ⚠️ ADJUSTMENTS / ❌ BLOCKED
```
