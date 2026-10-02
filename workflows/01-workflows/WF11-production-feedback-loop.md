# WF11 — Production Feedback Loop

> Production bugs stop being the end of the pipeline. They become the start of the next sprint.

---

## 1. What it is

When an incident, error, or anomaly surfaces in production (via Datadog, Sentry, New Relic, etc.), an MCP agent correlates it to `graph.json`, proposes a regression test that would have caught it, files the test as a scoped scenario for the next sprint backlog, and optionally triggers WF5 to auto-generate the automation. A human approves. A human does not write.

This is the compounding workflow — every production bug makes the test suite smarter.

---

## 2. Who owns it

**SRE/Observability owns the production signals.** QA leads own the feedback rules — what triggers a scenario, what severity, what escalates.

**The agent does the correlation.** QA engineers review and approve scenarios.

---

## 3. Tools needed

- **Category 3 — AI IDE:** for the interactive workflow
- **Category 4 — Platform AI:** Rovo / Jira MCP for ticket creation
- **Category 5 — Playwright Agents:** to generate the regression test once the scenario is approved
- **Observability integration:** Datadog, Sentry, New Relic, PagerDuty, or equivalent (not one of the 7 categories, but essential here)

---

## 4. Step-by-step setup

### Step 1: Define the feedback triggers

Save as `.ai/conventions/production-feedback-rules.md`:

```markdown
# Production feedback triggers

Not every prod event becomes a regression test. Only events that meet one of these:

## Always trigger a scenario
- P0 or P1 incident, any duration
- A bug that recurs 3+ times in 30 days
- An anomaly affecting >1% of users
- Any security or compliance-related issue

## Sometimes trigger (human decides)
- P2 bug with reliable reproduction
- Performance regression >20% on critical path
- Novel error class not seen before

## Never trigger
- Transient network / third-party outages
- Expected alert noise (already documented)
- User-error or configuration issues

## Required metadata for a triggered scenario
- Linked REQ-ID (if known)
- Minimal reproduction steps
- Expected vs actual behavior
- Stack trace or error signature
- User cohort affected
- Severity
```

### Step 2: Build the correlation agent

```typescript
// scripts/wf11-correlation-agent.ts
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

interface ProductionEvent {
  id: string;
  source: 'datadog' | 'sentry' | 'newrelic' | 'pagerduty';
  timestamp: string;
  severity: string;
  stackTrace?: string;
  errorMessage?: string;
  userCohort?: string;
  affectedCount?: number;
  recurrence?: { count: number; windowDays: number };
}

async function correlate(event: ProductionEvent) {
  const graph = JSON.parse(fs.readFileSync('.ai/graph.json', 'utf-8'));
  const rules = fs.readFileSync('.ai/conventions/production-feedback-rules.md', 'utf-8');

  const response = await new Anthropic().messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `# Task: Correlate a production event to the Project Repository

## Feedback rules
${rules}

## Production event
${JSON.stringify(event, null, 2)}

## graph.json (current state)
${JSON.stringify(graph, null, 2)}

## Your job
1. Check rules: should this trigger a regression scenario? (YES / NO / HUMAN_DECIDES)
2. If YES or HUMAN_DECIDES:
   - Correlate to a REQ-ID if possible (via stack trace file paths, error messages, affected code)
   - Propose a regression scenario in Given/When/Then format
   - Identify the specific test that SHOULD have caught this (or flag as "no test covered this")
   - Suggest the target sprint/backlog placement

## Output format (strict JSON)
{
  "decision": "TRIGGER" | "SKIP" | "HUMAN_DECIDES",
  "decision_reasoning": "which rule matched",
  "correlated_req": "REQ-142" | null,
  "proposed_scenario": {
    "title": "...",
    "given": "...",
    "when": "...",
    "then": "...",
    "severity": "high" | "medium" | "low"
  },
  "gap_analysis": {
    "should_have_been_caught_by": "tests/auth/password_reset.spec.ts, scenario 4",
    "why_it_wasn't_caught": "test asserted success on 200 response but didn't check timing > 60s"
  },
  "backlog_placement": {
    "target_sprint": "next" | "current" | "backlog",
    "priority": "P0" | "P1" | "P2" | "P3"
  }
}
`
    }]
  });

  return JSON.parse((response.content[0] as any).text);
}
```

### Step 3: Wire to your observability stack

Example with Datadog webhook:

```yaml
# Datadog monitor config
monitors:
  - name: Critical error spike
    query: "...Datadog query..."
    notify:
      - webhook:wf11-handler
```

The `wf11-handler` webhook posts to your service, which:

1. Reads the Datadog payload
2. Builds a `ProductionEvent` object
3. Calls the correlation agent
4. If decision is TRIGGER or HUMAN_DECIDES, creates a Jira ticket with full context
5. Tags the ticket with the proposed scenario

### Step 4: Ticket creation template

When the agent triggers, the Jira ticket looks like this:

```markdown
# [WF11-Gen] Production-triggered regression: Password reset email timeout

**Source:** Datadog alert `critical-error-spike` at 2026-04-17T14:22:00Z
**Correlated to:** REQ-142 (Password Reset via Email)
**Severity:** P1
**Affected users:** ~3% of reset requests

## Proposed regression scenario

**Given** a user requests a password reset
**When** the email service takes longer than 60 seconds to respond
**Then** the system must show a "something went wrong" message within 65 seconds
**And** the failure must be logged to ops

## Gap analysis
- This should have been caught by: `tests/auth/password_reset.spec.ts` (Scenario 5)
- Why it wasn't caught: Scenario 5 exists but only checks that *an error is shown* — doesn't check the timeout boundary

## Recommended next steps
1. Approve this scenario for automation
2. WF5 will generate the test
3. WF8 will audit coverage of the boundary case
```

### Step 5: Approval + auto-generation

QA engineer reads the ticket, approves the scenario (or rejects / refines). On approval:

- Scenario is appended to `scenarios/REQ-142-scenarios.md`
- A trigger sends it to WF5 to generate the automated test
- `graph.json` is updated

A human approves. A human does not write.

### Step 6: Track the loop

Dashboard / weekly report:

```
This week:
- 12 production events
- 8 triggered WF11 scenarios
- 6 scenarios approved
- 6 new regression tests generated via WF5
- 2 production events matched existing tests (tests were wrong)
- 0 production events had no WF11 analysis
```

That last number — **"0 events with no WF11 analysis"** — is the target. Every incident gets examined.

---

## 5. Prompts & templates

### Manual correlation (ad-hoc)

```
A production incident just happened:
- Time: 2026-04-17 14:22 UTC
- Symptom: password reset emails delayed 90+ seconds
- Affected: ~200 users over 10 minutes
- Stack trace: [paste]

Read .ai/graph.json and .ai/conventions/production-feedback-rules.md.

Tell me:
1. Which REQ-ID does this relate to?
2. Should this become a regression scenario? (apply the rules)
3. If yes, propose the scenario
4. Identify which existing test SHOULD have caught this (and why it didn't)
```

### Retrospective correlation (after a week)

```
Read the 20 closed production tickets from last week.
For each, evaluate:
- Was WF11 triggered? If not, should it have been?
- Was a regression scenario added?
- Did the gap analysis hold up (was it really a test gap)?

Output a weekly retrospective.
```

---

## 6. Success criteria

- [ ] Every P0/P1 production event triggers a WF11 analysis within 1 hour
- [ ] >80% of triggered scenarios are approved and converted to tests
- [ ] Gap analysis correctly identifies the missing test case (measure accuracy over time)
- [ ] Same production event does NOT recur after scenario is added (this is the ultimate success signal)
- [ ] Weekly report shows the loop is closing — fewer repeat bugs over time

---

## 7. Common pitfalls

### 🚫 Overtriggering
Every minor anomaly becomes a ticket. QA drowns. Tune the rules — transient issues, flaky third parties, and user error should never trigger.

### 🚫 Undertriggering
Rules too strict → production issues stay invisible to QA. Weekly retrospective catches this.

### 🚫 Scenarios approved without gap analysis
The gap analysis is the valuable part — it tells you *why* the test didn't catch it. Without it, you might just duplicate an existing test.

### 🚫 AI invents REQ-IDs
If AI can't correlate a production event to an existing REQ-ID, it should say "unknown" — not hallucinate. Enforce in the prompt.

### 🚫 No verification that the new test catches the event
After WF5 generates the test, run it against a reproduction of the production condition. If it passes without triggering the bug, the test is wrong — iterate.

### 🚫 Backlog graveyard
Triggered scenarios pile up in the backlog, never get done. Release planning must allocate capacity for WF11-generated items. Otherwise the loop breaks.

---

## 8. Which SDLC type it fits

| Type | Fit | How it looks |
|------|-----|--------------|
| 1 — AI-Assisted | Partial | QA manually reviews production tickets, adds scenarios ad-hoc |
| 2 — Spec-Driven | Yes | Production events refine specs for next iteration |
| 3 — Parallel Stream | **Core** | Automatic correlation and scenario proposals |
| 4 — Agentic | **Core + closed loop** | Agent correlates → agent proposes → human approves → agent generates test |
| 5 — Regulated | **Core + strict audit** | Every production incident must have a recorded analysis, whether or not it triggered a scenario |

---

## 9. What to try next

You've now reached the compounding workflow. Production bugs, exploration findings, coverage gaps, and heal-log signals all feed back into the system.

Next steps:
- Read `03-governance/measurement.md` — how to know the loop is working
- Read `03-governance/anti-patterns.md` — which failure modes to watch for now that the system is running
- Read `02-matching/workflow-to-sdlc-type.md` — revisit which workflows are right for your team's actual maturity
