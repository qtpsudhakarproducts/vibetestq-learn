# WF4 — Bug Triage Design

> Bugs reach the right person first time, with full context. Duplicates get merged automatically. Priorities stop being guesses.

---

## 1. What it is

When a bug is filed (from exploration, production, CI, or user report), AI reads the bug, correlates to `graph.json`, finds similar past bugs, suggests the right owner, and proposes priority — all before a human triager sees it.

The human still decides. But the prep work that used to take 30 minutes is done in 30 seconds.

---

## 2. Who owns it

**QA leads own the triage rules.** AI applies them. QA engineers and dev leads review the suggestions.

---

## 3. Tools needed

- **Category 3 — AI IDE:** for running the triage prompt
- **Category 4 — Platform AI:** Rovo (if Atlassian) or Jira MCP + Slack MCP for notifications

---

## 4. Step-by-step setup

### Step 1: Define triage rules

Save as `.ai/conventions/triage-rules.md`:

```markdown
# Bug triage rules

## Severity matrix

| Severity | Criteria |
|----------|----------|
| Critical (P0) | Production down, data loss, security breach, revenue impact > $10k/hr |
| High (P1) | Core workflow broken, no workaround, affects >10% users |
| Medium (P2) | Workflow broken with workaround, affects <10% users |
| Low (P3) | Cosmetic, edge case, nice-to-have |

## Ownership rules

| Area (code path) | Owner team | Slack channel |
|------------------|------------|---------------|
| src/auth/** | @team-identity | #team-identity-bugs |
| src/checkout/** | @team-payments | #team-payments-bugs |
| src/email/** | @team-comms | #team-comms-bugs |
| tests/** | @qa-team | #qa-bugs |

## Dedup rules
- A bug is a likely duplicate if:
  - Same error message (fuzzy-matched)
  - Same stack trace top 3 frames
  - Same REQ-ID and severity
- If likely duplicate, LINK, don't close — let the human decide
```

### Step 2: Create the triage prompt

Save as `.ai/prompts/wf4-triage.md`:

```markdown
# Task: Triage a new bug

## Context files
1. .ai/conventions/triage-rules.md
2. .ai/graph.json — to find linked REQs and past bugs
3. The new bug details (passed in via prompt variables)

## Your job
1. Parse the bug report (title, description, stack trace, screenshots).
2. Find linked REQ-ID(s) if the bug references one or can be matched to one.
3. Search graph.json and recent Jira issues for similar bugs in the last 90 days.
4. Apply severity matrix. Propose a priority.
5. Apply ownership rules. Propose an owner team.
6. Output a triage report.

## Output format

```json
{
  "bug_id": "...",
  "title": "...",
  "linked_req": "REQ-142 or null",
  "proposed_severity": "P0 | P1 | P2 | P3",
  "severity_reasoning": "...",
  "proposed_owner": "@team-identity",
  "ownership_reasoning": "matched src/auth/** path from stack trace",
  "likely_duplicates": [
    { "id": "BUG-823", "similarity": 0.87, "reason": "same stack trace top 3 frames" }
  ],
  "context_for_owner": "Additional context the owner will need (past exploration finding? recent code change? known pitfall?)",
  "recommended_next_step": "..."
}
```

## Rules
- Never close or modify the bug — only propose.
- If confidence is low (no clear owner, unclear severity), flag for human triager.
- Always cite the rule you applied (matrix row, path match, etc.)
```

### Step 3: Wire the trigger

Use a Jira webhook (or equivalent) that fires on bug creation. The webhook calls your triage script, which:

1. Fetches the bug details
2. Runs the WF4 prompt via Claude/OpenAI API
3. Receives the triage JSON
4. Posts the result as a comment on the bug
5. Applies labels if confidence is high
6. Posts to the owner team's Slack channel

### Step 4: Configure the review cadence

- **High confidence triage (score > 0.8):** auto-label, auto-assign, notify owner.
- **Medium confidence (0.5–0.8):** post as suggestion, human reviews before assignment.
- **Low confidence (<0.5):** flag for QA lead manual triage.

Tune these thresholds over time based on how often AI is right.

### Step 5: Update graph.json on every bug

```json
{
  "id": "REQ-142",
  "linked_bugs": [
    {
      "id": "BUG-847",
      "severity": "P2",
      "filed": "2026-04-17",
      "source": "exploration | production | CI | user-report",
      "status": "open",
      "owner": "@team-identity"
    }
  ]
}
```

---

## 5. Prompts & templates

### Simpler version (for learning)

```
A new bug was filed:

Title: Password reset email sometimes takes >60s
Description: [user report]
Stack trace: [paste if available]
Environment: production
User agent: [...]

Read .ai/conventions/triage-rules.md and .ai/graph.json.

Tell me:
1. Which REQ-ID does this match?
2. What's the severity and why?
3. Who should own this?
4. Any likely duplicates in graph.json?
5. What context should I add before passing to the owner?
```

### Post-mortem enhancement

After a bug is closed, run:

```
Bug BUG-847 was closed with resolution "fixed".

Read the final fix (git log --grep=BUG-847).

Tell me:
1. Was the original triage correct? (severity, owner)
2. What should the triage rules learn from this?
3. Should this become a regression test scenario? (feed WF11)
```

The output updates `.ai/conventions/triage-rules.md` over time.

---

## 6. Success criteria

- [ ] Every bug filed gets an AI triage comment within 2 minutes
- [ ] >70% of triage suggestions are accepted without modification
- [ ] Duplicates are linked (not closed) automatically
- [ ] Owner team gets Slack notification with full context, not just a Jira link
- [ ] `graph.json` shows every open bug linked to its REQ-ID
- [ ] Time-to-owner-acknowledgement drops noticeably

---

## 7. Common pitfalls

### 🚫 Auto-closing likely duplicates
Don't. Even 95% similar bugs can be distinct. **Always link, never close** automatically.

### 🚫 Severity drift toward too-low
AI tends to underrate severity because it doesn't feel user pain. Audit weekly — if AI says "P2" but the incident became a P0, update the rules.

### 🚫 Wrong owner due to stack-trace-only matching
Stack traces lie. A bug in `src/auth/` might actually be a bug in the shared library `src/lib/`. Have the triage prompt also check recent code changes in related areas.

### 🚫 Triage report that nobody reads
If the triage comment is a wall of JSON, reviewers ignore it. Format it for humans — a 3-line summary at the top, details below.

### 🚫 No feedback loop
If you never update triage-rules.md based on wrong triages, AI stays wrong forever. The post-mortem enhancement above is how you close the loop.

---

## 8. Which SDLC type it fits

| Type | Fit | How it looks |
|------|-----|--------------|
| 1 — AI-Assisted | Partial | QA runs the prompt manually on a fresh bug before triage meeting |
| 2 — Spec-Driven | Yes | AI triages, QA approves, owner assigned |
| 3 — Parallel Stream | **Core** | Automatic triage on every bug — meetings only for ambiguous cases |
| 4 — Agentic | **Fully auto** | Agent triages, assigns, and notifies owner; QA audits weekly |
| 5 — Regulated | **Auto + audit** | Every triage decision logged with reasoning for compliance |

---

## 9. What to try next

- **WF11 (Production Feedback Loop)** — closed production bugs become regression scenarios automatically.
- **WF8 (Coverage Audit)** — the triage history shows which areas keep having bugs; those are coverage gaps.
- **WF2 (Exploratory)** — triaged bugs feed next sprint's exploration risk areas.
