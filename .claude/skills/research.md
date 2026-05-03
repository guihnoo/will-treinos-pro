---
name: rhino-deep-research
description: >
  Deep research skill implementing the RhinoInsight methodology — a structured 5-step framework for
  producing high-quality, verifiable research reports from complex multi-faceted questions.
  Use this skill whenever the user asks to conduct deep research, write a comprehensive research report,
  investigate a complex topic, or analyze a question that requires synthesizing many sources.
  Also trigger when the user says things like "research X thoroughly", "give me a deep dive on Y",
  "I need a comprehensive report on Z", or "help me research this properly". This skill is especially
  valuable when the user needs traceable, citation-backed findings — not just a quick summary.
---

# RhinoInsight Deep Research

This skill implements the **RhinoInsight** methodology for deep research — a framework designed to
produce thorough, factually grounded, and verifiable research reports. It solves two core problems
that plague unstructured research: **error accumulation** (vague or unchecked planning) and
**context rot** (noise and irrelevant information piling up over a long research session).

The framework has two control mechanisms:
- **Verifiable Checklist** — controls *what* you research (model behavior)
- **Evidence Audit** — controls *what information* you carry forward (context management)

---

## The 5-Step Process

Work through these steps in order. Don't skip steps, as each one sets up the next.

---

### Step 1: Create a Verifiable Checklist and Hierarchical Outline

Before searching anything, decompose the research question into concrete, verifiable sub-goals.
The goal is to avoid vague or non-executable plans that lead to drift later.

**Do this:**

1. **Decompose the problem** — Break the main question into researchable dimensions (e.g., technical,
   economic, historical, comparative, regional). Aim for 3–8 sub-goals depending on complexity.

2. **Draft actionable checks** — For each dimension, write a specific, acceptance-ready check:
   not "research AI trends" but "find 3+ data points comparing LLM benchmark performance in 2023 vs 2024."
   These should be verifiable — you'll know when they're satisfied.

3. **Refine as a critic** — Review your checklist as a critic. Ask:
   - Are the scope and definitions clear?
   - Are any sub-goals overlapping or missing?
   - Can each check actually be verified with evidence?
   
   Split or merge nodes as needed. Clarify ambiguous terms upfront.

4. **Anchor your outline** — Compile the refined checks into a **hierarchical, editable outline**.
   This outline is your research anchor. Every subsequent search and piece of evidence maps to a
   specific node in this outline. The outline can be updated as you learn more, but changes should
   be deliberate.

**Example outline structure:**
```
Research Question: [user's question]
├── 1. [Dimension A]
│   ├── 1.1 [Sub-goal with acceptance check]
│   └── 1.2 [Sub-goal with acceptance check]
├── 2. [Dimension B]
│   └── 2.1 [Sub-goal with acceptance check]
└── 3. [Dimension C]
    ├── 3.1 [Sub-goal with acceptance check]
    └── 3.2 [Sub-goal with acceptance check]
```

---

### Step 2: Conduct Iterative, Node-Specific Searches

Don't do one massive broad search. Instead, conduct **targeted searches per outline node**.

For each sub-goal:
- Search specifically for what that node needs — not the whole topic
- Limit each search to what's needed to satisfy that node's acceptance check
- Move to the next node only when the current one has enough evidence

This prevents information overload and keeps your context focused. Think of it as doing multiple
small, precise searches rather than one sprawling one.

---

### Step 3: Audit and Structure Your Evidence

After each search round, **audit what you've collected** before continuing. This is what prevents
context rot — the accumulation of noisy, redundant, or irrelevant information.

**For each search result or source:**

1. **Normalize the data** — Don't dump raw search outputs into your working memory. Convert findings
   into structured **evidence units**: a title, source URL, date, and a 2–3 sentence summary of
   what this evidence says and why it matters.

2. **Summarize and compress** — Condense clusters of related evidence into concise, source-cited
   abstracts. Preserve the useful signal; discard verbose or redundant content.

3. **Align to nodes** — Tag each evidence unit with the outline node(s) it belongs to. Store it
   there, not as a free-floating note.

4. **Prune irrelevant content** — If something doesn't map to any node and doesn't update your
   understanding, drop it. Don't carry it forward.

**Evidence unit format:**
```
[Node: 1.2]
Source: [URL or citation]
Date: [date of source]
Summary: [2–3 sentences of the key finding]
Relevance: [one sentence explaining why this matters to the sub-goal]
```

After auditing, **update your outline** dynamically: add new sub-nodes if evidence reveals new
dimensions, mark nodes as "satisfied" when you have enough, and note gaps where more searching
is needed.

---

### Step 4: Draft with Explicit Evidence Binding

When you're ready to write, **work from your audited evidence — not from raw search history or
memory**. This is the key to producing verifiable, hallucination-resistant reports.

**Process:**

1. **Draft node by node** — Write the content for each outline node using only the evidence units
   you've tagged to it. Don't mix evidence across nodes unless it's genuinely cross-cutting.

2. **Rank your evidence** before binding it. For each piece of evidence, assess:
   - **Relevance** — How directly does it address this specific node?
   - **Quality** — How reliable and well-sourced is it?
   - **Timeliness** — Is it recent enough to be authoritative?
   - **Consistency** — Does it align with other established findings, or contradict them?

3. **Bind citations explicitly** — For every claim you make in the draft, attach the specific
   evidence unit that supports it. Don't write "studies show..." without binding the actual source.
   Format: `[claim] [Source: citation]`

4. **Flag contradictions** — If evidence units for the same node disagree, note this in the draft
   as a point of debate or uncertainty rather than silently picking one.

---

### Step 5: Structure the Final Report

Present your findings in a rigorous, professional format. Every section should flow from your
outline and be grounded in bound evidence.

**Report structure — always use this template:**

```
# [Research Title]

## Executive Summary
[3–5 sentences: core finding, key insight, and most important implication]

## Research Scope and Methodology
[What was researched, what dimensions were covered, what was explicitly out of scope]

## Detailed Analysis
[One section per top-level outline node]

### [Node 1: Dimension A]
[Evidence-based findings, citing sources inline]

### [Node 2: Dimension B]
...

## Insights and Recommendations
[Practical implications drawn from the findings — what should the reader do or believe?]

## Confidence Assessment
- **High confidence (>80%):** [findings with strong, consistent evidence]
- **Moderate confidence (50–80%):** [findings with partial or mixed evidence]
- **Low confidence (<50%):** [findings based on limited or conflicting data]

## Knowledge Boundaries
[What questions remain unanswered? What would require more research? What was outside the scope?]

## Sources
[Full list of all cited evidence units with URLs]
```

---

## Tips for Quality Control

- **Re-read your checklist** at the end of Step 3 and before Step 4. Are all checks satisfied?
  If not, do more targeted searches before writing.
  
- **The outline is living** — update it as you learn, but document what changed and why. Don't
  silently mutate it.

- **Contradictory evidence is valuable** — Don't discard it. It often reveals the most interesting
  tensions in a topic.

- **Cite everything** — if you can't cite it, don't write it as a finding. If it's your synthesis
  or interpretation, label it clearly as such.

- **Confidence tiers matter** — Users trust research more when you're honest about uncertainty.
  Overstating confidence is worse than admitting gaps.
