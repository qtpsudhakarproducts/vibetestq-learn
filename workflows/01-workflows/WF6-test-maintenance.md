# WF6 — Test Maintenance

> The hidden sprint killer. When code changes, AI updates linked tests — QA reviews. The suite stays green because it's correct, not because it's gutted.

---

## 1. What it is

When code merges to main, AI reads the diff, identifies which tests are linked to the changed code (via `graph.json`), and proposes targeted updates to those tests. A human reviews the proposal before merge. The suite stays current without the usual sprint tax.

---

## 2. Who owns it

**QA engineers own the review gate.** The AI proposes, the human approves. No silent auto-merge of test changes — ever.

---

## 3. Tools needed

- **Category 2 — MCPs:** GitHub/Bitbucket merge webhooks
- **Category 3 — AI IDE:** to run the maintenance prompt
- **Category 5 — Playwright Agents:** to dry-run updated tests
- `graph.json` is the linchpin — without it, maintenance can't find what to update

---

## 4. Step-by-step setup

### Step 1: Define the maintenance trigger

Use a webhook on merge-to-main (GitHub Actions example):

```yaml
# .github/workflows/wf6-maintenance.yml
name: WF6 Test Maintenance
on:
  push:
    branches: [main]

jobs:
  maintain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Detect impacted tests
        run: |
          # Get files changed in this merge
          git diff --name-only HEAD~1 HEAD > /tmp/changed_files.txt

          # Call AI via API with:
          # - changed_files.txt
          # - .ai/graph.json
          # - Ask: which tests are linked to these files?
          node scripts/wf6-detect-impacted-tests.js > /tmp/impacted_tests.txt

      - name: Propose test updates
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # Run the WF6 prompt against each impacted test
          node scripts/wf6-propose-updates.js

      - name: Open PR with proposals
        run: |
          git checkout -b wf6/maintenance-$(date +%Y%m%d-%H%M)
          git add tests/
          git commit -m "WF6: proposed test updates from merge $GITHUB_SHA"
          git push -u origin HEAD
          gh pr create --title "WF6 maintenance proposals" --body "Review and merge or reject"
```

### Step 2: Create the maintenance prompt

Save as `.ai/prompts/wf6-maintenance.md`:

```markdown
# Task: Propose updates to tests affected by a code change

## Context files
1. .ai/conventions/test-conventions.md
2. .ai/graph.json — to find linked tests
3. The git diff of the merge commit
4. The current test file(s) for each affected REQ-ID

## Your job
For each affected test file:

1. **Understand the code change.** Does it change behavior, signature, or just internals?
2. **Decide if the test needs update:**
   - Behavior change → test must update
   - Signature change (method renamed, arg added) → test must update
   - Internal refactor only → test likely unchanged
3. **Propose a minimal update.** Don't rewrite — patch.
4. **Dry-run the updated test** via Playwright MCP.
5. **Report** for each file: proposed change + dry-run result.

## Rules
- NEVER disable tests to make them pass.
- NEVER remove assertions.
- NEVER weaken assertions (e.g., changing toBe to toBeTruthy).
- If a test is unsalvageable, mark it for human attention — don't delete.
- Preserve the // REQ-ID comment.
- Preserve the test's original intent.

## Output format
For each test file, a change summary:

```
## tests/auth/password_reset.spec.ts

**Code change detected:** src/auth/password_reset.ts — `resetPassword()` signature changed from (email) to (email, options)

**Proposed test updates:**
- Line 23: update `resetPassword(user.email)` → `resetPassword(user.email, {})`
- No assertion changes needed
- Dry-run: PASSED

**Confidence:** HIGH — mechanical signature update
**Requires human review:** No (auto-mergeable if reviewer approves)
```

Or:

```
## tests/checkout/payment.spec.ts

**Code change detected:** src/checkout/payment.ts — removed `legacyProcessor` branch

**Proposed test updates:**
- Scenario 4 ("legacy processor fallback") is no longer valid
- Cannot auto-fix — the test's premise is gone

**Confidence:** LOW
**Requires human review:** YES — human must decide: delete scenario, update requirement, or restore code
```
```

### Step 3: Confidence-based routing

Not all maintenance is equal.

- **High confidence (mechanical)** — signature changes, import paths, rename-refactors. Reviewer can approve fast.
- **Medium confidence (behavioral)** — assertion adjustments, flow tweaks. Reviewer reads carefully.
- **Low confidence (architectural)** — the test's premise is gone or changed. Requires human judgment; AI flags for attention.

Your reviewer rule: medium and low confidence always need a QA engineer's approval. Never auto-merge below HIGH.

### Step 4: Update `graph.json` after merge

When the maintenance PR merges:

```json
{
  "id": "REQ-142",
  "test_files": ["tests/auth/password_reset.spec.ts"],
  "maintenance_log": [
    {
      "date": "2026-04-17T14:22:00Z",
      "trigger": "merge abc123",
      "changes_proposed": 2,
      "changes_accepted": 2,
      "reviewer": "@sudhakar"
    }
  ]
}
```

This history feeds measurement (governance/measurement.md) and anti-pattern detection.

---

## 5. Prompts & templates

### Narrow prompt (single file, manual trigger)

```
Code in src/auth/password_reset.ts changed in commit abc123.
Read graph.json — the test at tests/auth/password_reset.spec.ts is linked.

Tell me:
1. Does the test need updating?
2. If yes, propose the minimal diff.
3. Dry-run the updated test via Playwright MCP.
4. Report: PASS / FAIL / NEEDS-HUMAN.

Do NOT commit. Just propose.
```

### Sweep prompt (all impacted tests)

```
Read the git diff for the last merge to main.

For every test file linked via graph.json to the changed source files:
- Apply WF6 prompt
- Aggregate the results into a single report

Output: reports/wf6-{merge_sha}.md
```

---

## 6. Success criteria

- [ ] Every merge to main triggers the maintenance pipeline
- [ ] Maintenance PRs are opened within 30 minutes of merge
- [ ] >80% of HIGH-confidence proposals are accepted without change
- [ ] Every accepted update preserves assertion strength (measure this)
- [ ] LOW-confidence flags are triaged within one sprint
- [ ] `graph.json` maintenance log shows the pattern over time

---

## 7. Common pitfalls

### 🚫 Silent auto-merge
The worst failure mode. AI updates tests, CI stays green — because tests have been gutted. Every assertion softened, every edge case removed. **Always require human review above HIGH confidence.**

### 🚫 Maintenance proposals pile up
If the proposal PR sits open for 2 weeks, the next merge creates another one. Soon you have 8 stale maintenance PRs. **Rule:** a maintenance PR must be reviewed within the same sprint or closed.

### 🚫 Reviewing maintenance PRs like any other PR
They look mechanical, so reviewers speed through. But this is exactly where regression coverage leaks. Maintenance PRs deserve more scrutiny, not less.

### 🚫 graph.json is stale
If `graph.json` says test X covers code Y, but it doesn't anymore, WF6 proposes updates to irrelevant tests. **Fix:** keep `graph.json` fresh (WF5 commits to it, WF8 validates it).

### 🚫 Ignoring LOW-confidence flags
"We'll come back to those." You won't. LOW flags mean the test's premise is gone — that's a requirements question, not a test question. Route them to WF1 for scenario re-review.

---

## 8. Which SDLC type it fits

| Type | Fit | How it looks |
|------|-----|--------------|
| 1 — AI-Assisted | Ad-hoc | QA asks AI to update a test when it breaks in CI |
| 2 — Spec-Driven | Yes | Maintenance runs when specs change; tests follow spec |
| 3 — Parallel Stream | **Core** | Every merge triggers WF6; QA reviews within sprint |
| 4 — Agentic | **Fully auto** | Agent proposes; reviewer approves via bot command |
| 5 — Regulated | **Auto + audit** | Every proposal + review logged with timestamps, reviewer identity |

---

## 9. What to try next

- **WF7 (Self-Healing Tests)** — catch runtime failures between maintenance cycles
- **WF8 (Coverage Audit)** — ensure maintenance didn't shrink coverage
- **WF10 (CI Quality Gate)** — enforce "no merge without linked maintenance proposal if tests exist"
