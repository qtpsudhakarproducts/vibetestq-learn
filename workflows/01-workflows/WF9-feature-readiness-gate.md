# WF9 — Feature Readiness Gate

> "Can we ship this feature?" becomes a *checked artifact* the system produces — not an opinion QA renders in a meeting.

---

## 1. What it is

When a feature branch is ready to merge to release, a feature-readiness agent reads `graph.json`, walks through every workflow output (WF1-8), and posts a pass/fail with evidence. Release decisions become auditable and cross-functional.

---

## 2. Who owns it

**QA leads own the readiness criteria.** The agent runs. Product owners and release managers consume the output.

---

## 3. Tools needed

- **Category 3 — AI IDE / Agent runtime:** to run the readiness check
- **Category 4 — Platform AI:** Rovo or Jira MCP to post the readiness report on the feature ticket
- `graph.json` provides the evidence trail

---

## 4. Step-by-step setup

### Step 1: Define the readiness criteria

Save as `.ai/conventions/readiness-criteria.md`:

```markdown
# Feature readiness criteria

A feature is READY when ALL of these are true:

## WF1 — Requirements & Scenarios
- [ ] Every linked REQ-ID has an approved scenarios file
- [ ] No scenarios in "draft" or "pending" status
- [ ] Ambiguities flagged by AI were answered by the BA

## WF3 — Test data
- [ ] Every scenario requiring data has a fixture file
- [ ] All fixtures pass the safety check

## WF5 — Automated tests
- [ ] Every scenario has at least one automated test OR documented exploratory coverage
- [ ] Test dry-runs passed on latest build
- [ ] Cross-browser matrix passed (if matrix is in scope)

## WF6 — Maintenance
- [ ] No open maintenance PRs referencing this feature older than 5 days

## WF7 — Self-healing
- [ ] No escalated heal-log alerts (5+ heals/week) against this feature's tests

## WF8 — Coverage
- [ ] All HIGH-severity gap tickets filed by WF8 are closed or explicitly accepted

## Exploratory (WF2)
- [ ] Exploration file exists and is filled >70%
- [ ] "Things NOT explored" section is non-empty and reviewed

## Bug status (WF4)
- [ ] No open P0 or P1 bugs linked to this feature
- [ ] All P2 bugs have workarounds documented

## Non-functional
- [ ] Performance acceptance (if defined) met on staging
- [ ] Security review signed off (if area is high-risk)
- [ ] Accessibility checks passed (if in scope)
```

This is your team's contract. AI checks each box; you decide which are mandatory vs advisory.

### Step 2: Build the readiness agent

```typescript
// scripts/wf9-readiness-agent.ts
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

async function checkReadiness(featureId: string) {
  const graph = JSON.parse(fs.readFileSync('.ai/graph.json', 'utf-8'));
  const criteria = fs.readFileSync('.ai/conventions/readiness-criteria.md', 'utf-8');

  // Collect all REQs in this feature
  const feature = graph.features.find((f: any) => f.id === featureId);
  const reqs = feature.req_ids.map((id: string) =>
    graph.requirements.find((r: any) => r.id === id)
  );

  // Ask Claude to evaluate each criterion
  const response = await new Anthropic().messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `# Task: Check feature readiness

## Criteria
${criteria}

## Feature: ${featureId}
Linked requirements:
${JSON.stringify(reqs, null, 2)}

## Your job
For every checklist item in the criteria, evaluate with evidence from graph.json:
- ✅ PASS with specific evidence (file path, count, timestamp)
- ⚠️ WARNING with reason
- ❌ FAIL with what's missing

Output strict JSON:
{
  "feature": "${featureId}",
  "overall": "READY" | "NOT_READY" | "CONDITIONALLY_READY",
  "checks": [
    {
      "criterion": "Every linked REQ-ID has an approved scenarios file",
      "status": "PASS" | "WARN" | "FAIL",
      "evidence": "...",
      "action_required": "..."
    }
  ],
  "summary": "One paragraph for the release manager",
  "blockers": ["..."],
  "conditional_accepts": ["..."]
}
`
    }]
  });

  return JSON.parse((response.content[0] as any).text);
}
```

### Step 3: Post the report to Jira / wherever feature tickets live

```typescript
async function postReport(featureId: string, report: any) {
  // Use your platform API (Rovo / Jira / Linear / Shortcut)
  // Post as a comment or attached field on the feature epic

  const formattedComment = formatReport(report);
  await jira.addComment(featureId, formattedComment);

  // Set a status field
  if (report.overall === 'READY') {
    await jira.transition(featureId, 'Ready for Release');
  } else if (report.overall === 'NOT_READY') {
    await jira.transition(featureId, 'Not Ready');
  }
}

function formatReport(report: any): string {
  let output = `# Feature Readiness: ${report.overall}\n\n`;
  output += `**Summary:** ${report.summary}\n\n`;

  if (report.blockers.length) {
    output += `## ❌ Blockers\n`;
    output += report.blockers.map((b: string) => `- ${b}`).join('\n');
    output += '\n\n';
  }

  output += `## Checks\n`;
  for (const check of report.checks) {
    const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
    output += `- ${icon} **${check.criterion}**\n  ${check.evidence}\n`;
  }

  return output;
}
```

### Step 4: Wire the trigger

Two ways to trigger:

**A. Manual (start simple)** — release manager runs `npm run readiness-check FEAT-42`

**B. Automated (preferred)** — When a feature ticket moves to "In Review" status in Jira, the webhook fires the readiness check automatically.

### Step 5: Define "conditional" vs "blocking"

Not every FAIL should block release. Some are "accept with risk."

- **Blocking:** P0/P1 bugs open, scenarios unapproved, tests not running
- **Conditional:** a P2 without workaround, a11y check pending, perf not measured

Code the distinction into your criteria. Release managers decide on conditional items; they can't override blockers.

### Step 6: Archive reports

Every readiness report is committed to the repo (or stored in an audit database):

```
reports/readiness/
└── FEAT-42/
    ├── 2026-04-15.json
    ├── 2026-04-16.json
    └── 2026-04-17.json   (the final one)
```

For regulated environments, this is your audit trail.

---

## 5. Prompts & templates

### Dry-run readiness on current sprint

```
Run readiness check against every feature in the current sprint.

Output:
- Which features are READY
- Which have blockers (and what they are)
- Which have only conditional items

Format as a single summary table.
```

### Readiness diff vs last run

```
The last readiness run for FEAT-42 was on 2026-04-15.

Run readiness again now. Report:
- What changed since last run
- What's newly passing
- What's newly failing
- Is the feature closer to or further from READY?
```

---

## 6. Success criteria

- [ ] Every feature ticket has at least one WF9 report attached before release
- [ ] Blockers are surfaced at least 3 days before planned release
- [ ] Release managers read the report, not just the overall status
- [ ] Conditional accepts are logged with reviewer identity
- [ ] Reports are archived for 1+ year (audit trail)
- [ ] Features that fail readiness get re-checked within 48 hours

---

## 7. Common pitfalls

### 🚫 "Conditional accept" becomes the default
If >40% of features ship "conditionally," your criteria are too strict OR your process is broken. Tighten or relax, don't normalize.

### 🚫 Running readiness only at release time
Too late. Run it every few days during the feature's development. The criteria become a living checklist the team uses, not a gate that surprises everyone.

### 🚫 Ignoring the audit trail
If nobody saves the reports, you lose the ability to answer *"why did we ship this with known gaps?"* Archive everything.

### 🚫 "Overall: READY" without reading the details
Each check matters. Release managers who rubber-stamp the top-line status miss nuances. Train them to read the full report.

### 🚫 AI lenience over time
AI may drift toward optimism if prompts aren't strict. Audit AI's PASS verdicts quarterly — sample 10, verify 10. Recalibrate.

---

## 8. Which SDLC type it fits

| Type | Fit | How it looks |
|------|-----|--------------|
| 1 — AI-Assisted | Not really | Release decisions are still manual sign-offs |
| 2 — Spec-Driven | Yes | Readiness check verifies WF1 outputs exist |
| 3 — Parallel Stream | **Core** | Every feature has a readiness report before release |
| 4 — Agentic | **Automated gate** | Agent triggers readiness on status change; blockers auto-notify owner |
| 5 — Regulated | **Core + strict audit** | Readiness reports are formal release evidence; preserved by policy |

---

## 9. What to try next

- **WF10 (CI Quality Gate)** — enforce readiness criteria at merge, not just release
- **WF11 (Production Feedback Loop)** — if a "READY" feature breaks in prod, feed that back to tighten criteria
- **`03-governance/measurement.md`** — track readiness-vs-reality: were "READY" features actually stable?
