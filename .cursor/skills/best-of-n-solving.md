# Skill: Best of N Solving — Will Treinos PRO

## When to use
For hard problems where the first solution may not be the best.
Explore multiple approaches in parallel before committing to one.

## Protocol

### Step 1 — Define the problem clearly
```
What is the exact requirement?
What are the constraints? (mobile, offline, performance, security)
What is the success criterion?
```

### Step 2 — Propose N approaches (minimum 2, maximum 4)

For each approach:
```
Approach [A/B/C]: [Descriptive name]

Core idea: [How it works in 1 sentence]

Pros:
- [advantage 1]
- [advantage 2]

Cons:
- [disadvantage 1]
- [disadvantage 2]

Implementation complexity: [low/medium/high]
Bug risk: [low/medium/high]
Alignment with current architecture: [good/neutral/conflict]
```

### Step 3 — Grounded recommendation

```
I recommend Approach [X] because:
[Concrete technical argument]

Trade-offs I accept with this choice:
[What is left out or harder]
```

### Step 4 — Wait for decision, then execute with excellence

## Problems worth Best-of-N in Will Treinos PRO

| Problem | Why it needs N approaches |
|---|---|
| Offline-first check-in | Sync vs UX vs complexity tradeoff |
| Athlete XP history | SQL view vs client calc vs Redis cache |
| Late class notification | Web Push vs polling vs WebSocket |
| Predictive financial | Moving avg vs regression vs heuristic |
| Class ranking | Real-time vs daily snapshot |

## How to trigger
```
@best-of-n-solving How can I implement [feature]?
Give me 3 different approaches before any code.
```
