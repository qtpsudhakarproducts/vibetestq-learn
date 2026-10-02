# WF2 — Exploratory Planning

> Exploratory testing used to depend on your best tester's instinct. Now AI amplifies that instinct — and remembers it for next sprint.

---

## 1. What it is

Before a QA engineer starts exploratory testing, AI reads the code diff and the history of past exploration findings, then proposes the highest-risk areas to probe first. The engineer explores those areas, AI watches and suggests next steps live, and findings are captured as structured data in the repo.

The result: exploration becomes **cumulative**. Each sprint starts with the prior sprint's insights already in context.

---

## 2. Who owns it

**QA engineers own the exploration itself.** AI is an assistant — it never replaces the human sensing the product.

QA leads own the **capture standard** — the structure of how findings get logged.

---

## 3. Tools needed

- **Category 1 — Browser Assistant Agents:** Claude Chrome Extension or Perplexity Comet (optional but strong)
- **Category 3 — AI IDE:** for risk analysis and finding capture
- **Category 4 — Platform AI:** Rovo or Confluence connector to store findings

---

## 4. Step-by-step setup

### Step 1: Set up the exploration log folder

```
scenarios/
└── exploration/
    ├── 2026-04-sprint-23/
    │   ├── REQ-142-exploration.md
    │   └── REQ-143-exploration.md
    └── 2026-04-sprint-22/
        └── ...
```

One markdown file per exploration session. Grouped by sprint.

### Step 2: Define the capture structure

Save as `.ai/templates/exploration-template.md`:

```markdown
# Exploration: REQ-{id} — {title}

**Date:** {yyyy-mm-dd}
**Explorer:** {name}
**Duration:** {minutes}
**Build tested:** {commit_sha}

## Risk areas proposed by AI
1. ...
2. ...
3. ...

## Areas actually explored
- ...

## Findings
### Finding 1
- **What happened:** ...
- **Severity:** (low / medium / high)
- **Reproducible:** yes / sometimes / once
- **Linked bug:** (Jira ID, if filed)
- **Why it happened (hypothesis):** ...

## Decisions made during exploration
- ...

## Things NOT explored (and why)
- ...

## Recommendations for next sprint
- Run WF8 on X
- Add regression scenario for Y
```

The structure is non-negotiable. Free-text notes kill this workflow inside 5 sprints.

### Step 3: Create the risk-analysis prompt

Save as `.ai/prompts/wf2-risk-analysis.md`:

```markdown
# Task: Propose risk areas for exploration

## Context files
1. .ai/project-context.md
2. .ai/known-pitfalls.md
3. requirements/REQ-{id}.md
4. scenarios/REQ-{id}-scenarios.md
5. scenarios/exploration/* (all past explorations, especially for this REQ-ID)
6. git diff main...HEAD (code changes for this feature)

## Your job
Propose 3–5 risk areas where this feature is most likely to break, ranked by likelihood.

For each risk area:
- **Why it's risky** (tie to code change or past finding)
- **Suggested exploration angle** (what should the tester try?)
- **Estimated exploration time** (minutes)

## Rules
- Don't repeat risks from past exploration logs — suggest NEW angles
- Reference specific code changes or past findings, not general principles
- Keep suggestions concrete and testable

## Output
Write to: scenarios/exploration/{sprint}/REQ-{id}-exploration.md (risk areas section only)
Leave "Areas actually explored" and "Findings" empty for the human to fill.
```

### Step 4: Run the risk analysis before exploration

In the AI IDE:

```
@prompt wf2-risk-analysis.md for REQ-142 sprint 23
```

Open the generated file. Read the risk areas. This is your starting point.

### Step 5: Explore with AI assistance (optional but powerful)

Open Claude Chrome Extension or Perplexity Comet on the staging environment.

Tell the AI: *"I'm testing REQ-142 password reset. Watch me explore and suggest next steps."*

As you click through the UI, the AI narrates observations and proposes edges to try. You decide what to do — AI is co-pilot, not pilot.

### Step 6: Capture findings in real time

Don't wait until the end of the session. As you find things, update the exploration markdown file immediately.

Structure each finding using the template — what happened, severity, reproducible, linked bug.

### Step 7: Close the session

Fill in:
- **Decisions made during exploration** (this is the WHY that AI can't regenerate)
- **Things NOT explored (and why)** (so next sprint knows what's still dark)
- **Recommendations for next sprint** (feeds WF8 and WF11)

Commit the file. That's it.

### Step 8: Append to graph.json

```json
{
  "id": "REQ-142",
  "explorations": [
    {
      "sprint": "2026-04-sprint-23",
      "file": "scenarios/exploration/2026-04-sprint-23/REQ-142-exploration.md",
      "date": "2026-04-17",
      "explorer": "sudhakar",
      "findings_count": 3,
      "highest_severity": "medium"
    }
  ]
}
```

Now WF8, WF11, and future WF2 runs can read this.

---

## 5. Prompts & templates

### For live co-pilot exploration (in Claude Chrome or Comet)

```
You are my exploration co-pilot for this feature: {link to REQ-142}

Context I want you to load:
- {paste or link to requirements/REQ-142.md}
- {paste or link to past exploration findings}

As I explore:
- Tell me what you observe on screen
- Suggest edge cases to try next
- Warn if I miss something from the risk areas
- DO NOT click or type for me — I'm the explorer

When I find something, help me write it up in the template structure.
```

### For risk analysis only (not live)

Use the prompt in Step 3.

---

## 6. Success criteria

- [ ] Every feature in the sprint has an exploration file in `scenarios/exploration/`
- [ ] Each file is >70% filled (no skeletons with empty sections)
- [ ] Findings reference specific code, data, or reproduction steps — not vague reports
- [ ] Past sprint explorations are visibly influencing current sprint risk proposals
- [ ] `graph.json` shows exploration linkage per REQ-ID
- [ ] Weekly: QA lead reviews capture quality (not just volume)

---

## 7. Common pitfalls

### 🚫 Capture quality degrades over sprints
Sprint 1: beautiful structured findings. Sprint 5: "tested, looks ok." By sprint 10, the whole workflow is dead.

**Fix:** weekly audit. QA lead checks that every exploration file has substance. Files with "looks ok" go back for rework. This is harsh but necessary.

### 🚫 AI proposes the same risks every time
If you see the same risk areas in Sprint 22 and Sprint 23, your prompt isn't reading past explorations.

**Fix:** check the context loading. The prompt must include past exploration files in context.

### 🚫 "AI told me the feature is fine, so I skipped exploration"
AI analyzing code is not exploration. Code analysis misses everything UX, timing, and session-related. The human explore step is non-negotiable.

### 🚫 Not capturing "Things NOT explored"
This section matters more than "Findings." It tells next sprint's tester where the dark corners still are. Without it, the same areas stay untested forever.

### 🚫 Filing bugs without linking to exploration
If a bug is filed from exploration, the exploration file must link to it. Otherwise the causal chain is lost, and WF4 (bug triage) can't use it.

---

## 8. Which SDLC type it fits

| Type | Fit | How it looks |
|------|-----|--------------|
| 1 — AI-Assisted | Partial | QA does exploration manually, maybe uses AI Chrome extension ad-hoc |
| 2 — Spec-Driven | Yes | Exploration happens after code is ready, findings feed future specs |
| 3 — Parallel Stream | **Core** | Exploration runs alongside dev, findings loop back into scenarios in-sprint |
| 4 — Agentic | Enhanced | AI proposes risks, monitors exploration, auto-files structured findings |
| 5 — Regulated | **Core + audit** | Every finding must link to a decision with timestamp, reviewer, and reasoning |

---

## 9. What to try next

- **WF4 (Bug Triage)** — findings from WF2 become bugs; WF4 triages them consistently.
- **WF8 (Coverage Audit)** — exploration gaps ("things NOT explored") become coverage gaps to fill with automation.
- **WF11 (Production Feedback)** — past exploration findings + production incidents = compounding intelligence.
