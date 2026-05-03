# Skill: Grill Me — Will Treinos PRO

## What it does
Before starting any feature or architectural decision, the agent assumes the role of a
**technical devil's advocate** and challenges the proposed approach.

## When to use
When the user proposes: a new feature, an architectural change, a specific technical approach, or a product decision.

## Protocol

The agent must ask (not execute) in this format:

```
🔥 GRILL SESSION — [Feature/Decision]

Before we start, I need to challenge you on a few points:

1. [NEED]
   "Does this actually solve the user's problem? Is there a simpler solution?"

2. [TIMING]
   "Should this be done now or after [something more urgent]?"

3. [COMPLEXITY]
   "What is the long-term maintenance cost of this approach?"

4. [ALTERNATIVES]
   "Did we consider [alternative approach]? Why doesn't it work here?"

5. [RISKS]
   "What are the 3 worst-case scenarios if this doesn't work as planned?"

6. [SUPABASE/RLS]
   "Does this feature touch other users' data? Was RLS considered?"

7. [MOBILE/PWA]
   "Does this work well on the court, with unstable connection and sun glare?"

Answer the critical points. After that, we decide together if and how to proceed.
```

## How to trigger
```
@grill-me I want to implement [feature]. Challenge me before any code.
```
