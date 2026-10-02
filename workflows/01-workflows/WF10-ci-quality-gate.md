# WF10 — CI Quality Gate

> Every merge is a decision. This gate makes it an *evidence-based* decision.

---

## 1. What it is

On every pull request, a CI step runs a custom agent that audits the PR against quality rules: tests are linked, coverage is maintained, no silent heals, traceability intact. The PR status check passes or blocks the merge — with a reason.

WF9 is feature-level. WF10 is PR-level. Both matter.

---

## 2. Who owns it

**QA leads own the rules.** Developers experience the gate. Engineering managers tune thresholds.

---

## 3. Tools needed

- **Category 2 — MCPs:** Git MCP or direct Git API
- **Category 3 — AI IDE:** optional, for interactive checks during dev
- **Category 4 — Platform AI:** Rovo / GitHub Checks / Bitbucket Pipelines
- `graph.json` is the source of truth

---

## 4. Step-by-step setup

### Step 1: Define the rules

Save as `.ai/conventions/pr-quality-rules.md`:

```markdown
# PR quality gate rules

Every PR must satisfy these before merge to main:

## Linkage rules
- Any source file change must have a linked REQ-ID in graph.json
- Any new code file must be added to graph.json within this PR
- PR title must reference the REQ-ID (e.g., "REQ-142: Add rate limit")

## Test rules
- Every changed src/ file must have at least one linked test
- New test files must follow naming conventions
- No test is skipped or disabled without a TODO comment AND linked Jira ticket
- No assertion is weakened (no toBeTruthy replacing toBe, no removed assertions)

## Coverage rules
- Net coverage cannot decrease by more than 2% per PR
- High-risk areas (auth, payments, permissions) cannot decrease at all

## Heal log rules
- Heal log from CI runs is attached to PR
- No selector was healed >3 times in the PR's test runs

## graph.json rules
- graph.json must validate against schema
- No REQ-ID listed in graph.json has been deleted from requirements/
- No orphan code files (files not linked to any REQ)
```

### Step 2: Build the gate agent

```typescript
// scripts/wf10-quality-gate.ts
import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import fs from 'fs';

interface GateResult {
  passed: boolean;
  rules: { id: string; passed: boolean; evidence: string; severity: 'block' | 'warn' }[];
  summary: string;
}

async function runGate(prNumber: string): Promise<GateResult> {
  // Gather evidence
  const diff = execSync(`git diff origin/main...HEAD`).toString();
  const graph = JSON.parse(fs.readFileSync('.ai/graph.json', 'utf-8'));
  const rules = fs.readFileSync('.ai/conventions/pr-quality-rules.md', 'utf-8');
  const prTitle = process.env.PR_TITLE || '';
  const healLog = fs.existsSync('reports/heal-log.jsonl')
    ? fs.readFileSync('reports/heal-log.jsonl', 'utf-8')
    : '';

  // Ask Claude
  const response = await new Anthropic().messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `# Task: Evaluate PR #${prNumber} against quality rules

## Rules
${rules}

## PR title
${prTitle}

## Diff
${diff}

## graph.json
${JSON.stringify(graph, null, 2)}

## Heal log (recent)
${healLog.split('\n').slice(-50).join('\n')}

## Your job
For each rule category, check the PR. Be strict. Be specific.
Output STRICT JSON matching this shape:
{
  "passed": true | false,
  "rules": [
    { "id": "linkage.req-id-in-title", "passed": true/false, "evidence": "...", "severity": "block" | "warn" }
  ],
  "summary": "..."
}
`
    }]
  });

  return JSON.parse((response.content[0] as any).text);
}
```

### Step 3: Wire as CI check

```yaml
# .github/workflows/wf10-quality-gate.yml
name: WF10 Quality Gate
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install deps
        run: npm ci

      - name: Run quality gate
        id: gate
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          PR_TITLE: ${{ github.event.pull_request.title }}
        run: |
          node scripts/wf10-quality-gate.ts ${{ github.event.pull_request.number }} > gate-result.json
          echo "result=$(cat gate-result.json)" >> $GITHUB_OUTPUT

      - name: Post comment
        uses: actions/github-script@v7
        with:
          script: |
            const result = JSON.parse(`${{ steps.gate.outputs.result }}`);
            const body = formatComment(result);
            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });

            if (!result.passed && result.rules.some(r => !r.passed && r.severity === 'block')) {
              core.setFailed('WF10: blocking rule failed');
            }
```

### Step 4: Confidence tiers

Not every rule is a blocker.

- **Block:** linkage, test presence, graph.json schema violations — merge forbidden
- **Warn:** coverage dip within tolerance, minor heal-log events — merge allowed with sign-off
- **Info:** style, convention suggestions — advisory only

Tune these over time based on what actually prevents regressions in prod.

### Step 5: Override path (controlled)

Some PRs legitimately need to bypass the gate — urgent hotfix, prototype branch, etc.

Allow override with a label: `wf10-override`. But:

- Only specific users can apply the label (enforced by a CI rule)
- Override triggers a Slack notification to QA lead
- Override reason is required in the PR description
- Override is logged permanently

### Step 6: Weekly review

Every week, a QA lead reviews:
- How many PRs were blocked? (expected: 5–15% of PRs)
- How many were overridden? (expected: <2%)
- Which rules fail most? (signals of a systemic gap)
- How many rule failures correlated with later production bugs? (rule validation)

---

## 5. Prompts & templates

### Pre-push local check

```bash
# scripts/pre-push-gate.sh
#!/bin/bash
echo "Running WF10 gate locally..."
node scripts/wf10-quality-gate.ts LOCAL > /tmp/gate-local.json
passed=$(cat /tmp/gate-local.json | jq -r .passed)
if [ "$passed" != "true" ]; then
  echo "Gate would fail on PR. Fix before pushing:"
  cat /tmp/gate-local.json | jq .rules | grep -A 3 '"passed": false'
  exit 1
fi
```

Developers run this before pushing. Saves CI time.

### Prompt for gate narrative comment

```
Given this gate result JSON, write a PR comment that:
- Tells the developer what to fix (if anything)
- Shows exactly which file/line is the issue
- Is terse — one sentence per rule
- Has no corporate tone; be direct and helpful
```

---

## 6. Success criteria

- [ ] WF10 runs on every PR
- [ ] Blocking rules genuinely block (no silent pass-through)
- [ ] Override rate stays below 2% of PRs
- [ ] Gate feedback is actionable (developer knows what to fix)
- [ ] Weekly audits show the gate catching real issues, not just bureaucracy
- [ ] False-block rate (blocks that were wrong) is below 5%

---

## 7. Common pitfalls

### 🚫 Rules that fail for every PR
Developers learn to ignore the gate. Tune thresholds so normal PRs pass cleanly and only genuine issues fail.

### 🚫 Override becomes the norm
If 20%+ of PRs bypass the gate, the gate isn't working. Either the rules are wrong, or the culture doesn't respect them. Fix the root cause.

### 🚫 Advisory that's never read
If "warn" and "info" rules are ignored, they produce noise. Move them to "block" (if they matter) or remove them (if they don't).

### 🚫 Slow gate (>2 min per PR)
Developers resent slow gates. Cache graph.json analysis, parallelize checks, use faster models for light rules and heavy models only for deep rules.

### 🚫 No correlation with production
If the gate never correlates with prod incidents, it's not measuring the right things. Quarterly: map production bugs back to PRs — did the gate catch the relevant issue?

---

## 8. Which SDLC type it fits

| Type | Fit | How it looks |
|------|-----|--------------|
| 1 — AI-Assisted | Optional | Minimal gate checks: linkage only |
| 2 — Spec-Driven | Yes | Gate enforces WF1 approval before merging related code |
| 3 — Parallel Stream | **Core** | Full gate rules active; QA & dev both use it |
| 4 — Agentic | **Core + auto-fix** | Failed-gate PRs trigger WF5/WF6 to propose fixes automatically |
| 5 — Regulated | **Core + mandatory** | No override allowed; audit trail required for every gate pass |

---

## 9. What to try next

- **WF11 (Production Feedback Loop)** — production bugs become new gate rules
- **WF8 (Coverage Audit)** — tighten gate rules based on recurring gap patterns
- **`03-governance/measurement.md`** — measure gate effectiveness over time
