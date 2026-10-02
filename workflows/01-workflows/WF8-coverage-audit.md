# WF8 — Coverage Audit

> Green tests ≠ covered tests. This workflow tells you what's really being tested — and what isn't.

---

## 1. What it is

After every PR merges, a custom MCP agent reads the code diff, queries `graph.json` for linked tests, and reasons about whether the change is actually covered. Gaps are raised as Jira tickets with full context. Coverage isn't a number — it's an audited state.

---

## 2. Who owns it

**QA leads own the audit rules.** The agent runs on every PR. QA engineers respond to gap tickets like any other ticket.

---

## 3. Tools needed

- **Category 2 — MCPs:** Git/PR webhook + custom MCP agent
- **Category 3 — AI IDE:** for interactive audit during dev
- **Category 4 — Platform AI:** Rovo or Jira MCP to file gap tickets
- `graph.json` — the backbone for this workflow

---

## 4. Step-by-step setup

### Step 1: Define what "coverage" means in your context

Coverage is not just line-coverage percent. In this workflow, coverage means:

1. **Linkage coverage** — does this code have ≥1 linked test in `graph.json`?
2. **Scenario coverage** — do the linked tests validate the scenarios from WF1?
3. **Change coverage** — does the diff touch a code path that the tests actually exercise?
4. **Risk coverage** — are high-risk areas (auth, payments, permissions) covered disproportionately more?

Write these down in `.ai/conventions/coverage-rules.md`. Your AI uses them.

### Step 2: Build the custom MCP audit agent

Example in Node.js (use any language):

```typescript
// scripts/wf8-audit-agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import fs from 'fs';

const client = new Anthropic();

async function audit(prNumber: string) {
  // 1. Get the diff
  const diff = execSync(`git diff origin/main...HEAD`).toString();

  // 2. Load graph.json
  const graph = JSON.parse(fs.readFileSync('.ai/graph.json', 'utf-8'));

  // 3. Load coverage rules
  const rules = fs.readFileSync('.ai/conventions/coverage-rules.md', 'utf-8');

  // 4. Ask Claude
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `# Task: Audit test coverage for PR #${prNumber}

## Coverage rules
${rules}

## PR diff
\`\`\`
${diff}
\`\`\`

## graph.json (current state)
\`\`\`json
${JSON.stringify(graph, null, 2)}
\`\`\`

## Your job
1. For each file changed in the diff, identify which REQ-IDs are affected.
2. Check graph.json — are there linked tests for those REQ-IDs?
3. Do those tests exercise the specific code paths the diff touches?
4. Are any high-risk areas (auth, payments, permissions) changed without added/updated tests?

## Output format (strict JSON)
{
  "pr": "${prNumber}",
  "audit_result": "PASS" | "GAPS_FOUND",
  "linkage_check": { "all_files_linked": true/false, "unlinked_files": [...] },
  "scenario_check": { "all_covered": true/false, "uncovered_scenarios": [...] },
  "change_check": { "all_paths_covered": true/false, "uncovered_paths": [...] },
  "risk_check": { "high_risk_covered": true/false, "risky_areas_missing_tests": [...] },
  "gaps": [
    {
      "severity": "high" | "medium" | "low",
      "req_id": "...",
      "description": "...",
      "suggested_action": "..."
    }
  ]
}
`
    }]
  });

  const result = JSON.parse((response.content[0] as any).text);

  // 5. If gaps, file tickets
  if (result.audit_result === 'GAPS_FOUND') {
    for (const gap of result.gaps) {
      await fileGapTicket(gap, prNumber);
    }
  }

  // 6. Post result to PR
  await postToPR(prNumber, result);

  return result;
}

async function fileGapTicket(gap: any, prNumber: string) {
  // Use your Jira API / Rovo / GitHub Issues API
  // to file a structured ticket with context
}
```

### Step 3: Wire it into CI

```yaml
# .github/workflows/wf8-audit.yml
name: WF8 Coverage Audit
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: node scripts/wf8-audit-agent.ts ${{ github.event.pull_request.number }}
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          JIRA_TOKEN: ${{ secrets.JIRA_TOKEN }}
```

### Step 4: PR-level feedback

When audit runs on a PR, post a status check and a comment:

```markdown
## WF8 Coverage Audit

**Result:** GAPS_FOUND

### Linkage
- ✅ All 3 changed source files are linked in graph.json

### Change coverage
- ❌ `src/auth/password_reset.ts` line 42 — new error branch added, no test exercises it
- ❌ `src/email/template.ts` line 18 — HTML rendering change, no visual regression test

### Risk
- ⚠️ `src/auth/` is high-risk; this PR adds logic without adding assertions

### Gaps filed
- PROJ-8471 (High) — Missing test for new rate-limit-exceeded branch
- PROJ-8472 (Medium) — HTML template change needs snapshot test

Please address before merge, or justify with a comment.
```

### Step 5: Interactive audit during dev

QA engineers can run the same audit locally mid-development:

```
@prompt wf8-audit for current branch
```

This catches gaps before PR is opened.

### Step 6: Aggregate coverage trends

Weekly cron aggregates audit results into a dashboard:

- Gaps filed per sprint
- Gaps closed vs open
- Repeat offenders (files that keep failing audit)
- High-risk area coverage trend

This is what leadership should see — not a raw coverage percentage.

---

## 5. Prompts & templates

### Standalone audit (not PR-triggered)

```
Audit test coverage for all code changed in the last 7 days.

Read:
- git log --since="7 days ago"
- .ai/graph.json
- .ai/conventions/coverage-rules.md

Report:
- Files changed
- Coverage status per file
- Gaps with severity
- Trend: better/worse than last week?

Do NOT file tickets. Just report to stdout.
```

### Area-focused audit

```
Audit coverage of src/auth/**.

Report specifically:
- Every function in that area
- Which test(s) exercise it
- Which scenarios from WF1 are covered
- Any function with zero linked tests → flag as gap

This audit is for the area owner's weekly review.
```

---

## 6. Success criteria

- [ ] WF8 runs on every PR
- [ ] Gap tickets are filed automatically with full context
- [ ] Repeat gap offenders (same file, same issue) surface in weekly review
- [ ] Coverage trend is tracked, not just a snapshot
- [ ] High-risk areas maintain >90% linked-coverage
- [ ] QA engineers trust the audit — false positives are < 10%

---

## 7. Common pitfalls

### 🚫 "We already have coverage percentages, we're fine"
Line coverage says code was executed. It doesn't say behavior was verified. A test that runs code without asserting is worthless. WF8 asks *what was validated*, not *what was executed*.

### 🚫 Audit noise
If WF8 flags every minor change, developers start ignoring it. Calibrate the severity rules. A CSS change should be low-severity or skipped; a new auth branch is always high.

### 🚫 Gap tickets that nobody reads
If gaps pile up without being addressed, the workflow is performative. Tie gap closure to the sprint — gaps older than 2 sprints block the next release.

### 🚫 graph.json is out of date
If graph.json lies, WF8 lies. Coverage audit depends on linkage being fresh. That's why WF5 and WF6 must commit to graph.json, and WF10 (CI gate) must verify graph.json is consistent with reality.

### 🚫 Treating WF8 as a blocker
If WF8 is a hard gate on every PR, developers game it. Make it advisory at PR level, but enforce at release level (WF9).

---

## 8. Which SDLC type it fits

| Type | Fit | How it looks |
|------|-----|--------------|
| 1 — AI-Assisted | Occasional | QA runs audit manually before release |
| 2 — Spec-Driven | Yes | Audit checks scenarios from WF1 are tested |
| 3 — Parallel Stream | **Core** | Every PR audited, gaps filed in-sprint |
| 4 — Agentic | **Automated loop** | Gaps filed → assigned to AI test generator → PR opened with tests |
| 5 — Regulated | **Core + mandatory** | Cannot release if any high-severity gap remains open |

---

## 9. What to try next

- **WF9 (Feature Readiness Gate)** — aggregate audit results into a feature-level pass/fail
- **WF10 (CI Quality Gate)** — enforce audit rules at merge time
- **WF11 (Production Feedback Loop)** — production issues map back to audit gaps that weren't closed
