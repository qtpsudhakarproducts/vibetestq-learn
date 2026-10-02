# Chapter 509 — CI/CD Integration & Execution Strategy (L8)

This chapter covers the three GitHub Actions workflows that automate the
framework — a PR quality gate, a nightly regression with Allure history,
and a manual targeted run. Interviewers ask about CI integration to separate
engineers who can set up a working pipeline from those who understand execution
strategy: why 2 workers, why 2 retries, why `continue-on-error` on the test
step, and how Allure history accumulates across runs. These details distinguish
a candidate who has shipped a real CI pipeline from one who has only read about it.

---

## Q509.1 — What problem does Level 8 solve?

After Level 7 the framework produces clean, structured reports with tagged
tests and grouped summaries. All of this happens locally, triggered manually,
visible only to the person who ran the suite.

The team does not automatically know if the suite is passing. A developer can
merge a pull request without running any tests. A regression introduced on
Tuesday is not discovered until someone runs the suite manually on Friday.
There is no cross-run history — no way to know whether last week's pass rate
was better or worse than this week's.

Level 8 makes test results a team resource by wiring three workflows into
GitHub Actions:

1. **PR check** — smoke suite on every pull request; failed smoke = blocked merge
2. **Nightly regression** — full suite at midnight; results published to GitHub Pages
3. **Manual run** — any team member triggers a targeted run from the Actions tab

---

## Q509.2 — What are the three workflows and when does each run?

**PR check (`pr-check.yml`):**
- Trigger: every pull request targeting `main`
- Runs: `@smoke` tests only (~2 minutes)
- Result: GitHub check status — green = merge allowed; red = merge blocked
- Artefacts: HTML report uploaded only on failure (7-day retention)

**Nightly regression (`nightly-regression.yml`):**
- Trigger: `cron: '0 0 * * *'` (midnight UTC) + `workflow_dispatch` for manual trigger
- Runs: `@regression` tests (full suite)
- Result: Allure report generated and published to GitHub Pages
- Artefacts: allure-results (30-day), playwright-report (14-day)

**Manual run (`manual-run.yml`):**
- Trigger: `workflow_dispatch` with user inputs
- Inputs: tag choice (`@smoke`, `@regression`, `@pim`, `@admin`, `@leave`, `@critical`)
          and environment choice (`dev`, `staging`)
- Runs: whichever tag and environment the user selects
- Artefacts: HTML report (7-day)

---

## Q509.3 — What does the PR check workflow look like?

```yaml
# .github/workflows/pr-check.yml
name: PR Check — Smoke Suite

on:
  pull_request:
    branches:
      - main

jobs:
  smoke:
    name: Smoke Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Create environment file
        run: |
          mkdir -p test-data
          cat > test-data/.env.dev << EOF
          BASE_URL=${{ secrets.BASE_URL }}
          ADMIN_USERNAME=${{ secrets.ADMIN_USERNAME }}
          ADMIN_PASSWORD=${{ secrets.ADMIN_PASSWORD }}
          ESS_USERNAME=${{ secrets.ESS_USERNAME }}
          ESS_PASSWORD=${{ secrets.ESS_PASSWORD }}
          EOF

      - name: Run smoke suite
        run: npx playwright test --grep @smoke
        env:
          CI: true
          TEST_ENV: dev

      - name: Upload report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-pr-${{ github.run_number }}
          path: playwright-report/
          retention-days: 7
```

The report upload step uses `if: failure()` — not `if: always()`. On a
PR check, you only need the report when something went wrong. Uploading
on every green run wastes storage and CI minutes.

---

## Q509.4 — Why use npm ci instead of npm install in CI?

```yaml
- name: Install dependencies
  run: npm ci  # not npm install
```

`npm ci` (Clean Install):
- Reads exact versions from `package-lock.json` — no version resolution
- Deletes `node_modules` entirely before installing — reproducible clean state
- Fails if `package-lock.json` and `package.json` are out of sync
- Faster than `npm install` on CI because it skips dependency resolution

`npm install`:
- Resolves version ranges — may install a newer patch version than last run
- Does not always delete existing `node_modules`
- Silent upgrades can cause flaky CI failures when a new version has a bug

In CI, reproducibility is more important than convenience. `npm ci` guarantees
every run uses exactly the same packages.

---

## Q509.5 — Why install only Chromium in CI workflows?

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium
```

`--with-deps` installs OS-level system libraries required by the browser
(fonts, libglib, libnss, libX11). These are not bundled with Playwright.
Fresh CI runners have none of them. Without `--with-deps`, the browser
binary is present but fails to launch.

`chromium` only (not `firefox` or `webkit`):
- The OrangeHRM test suite uses only Chrome (as configured in `playwright.config.ts`)
- Installing three browsers takes ~3× longer and uses ~3× storage
- CI runners are time-limited — install only what you need

If cross-browser testing is required, add a separate job for each browser:
```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
steps:
  - run: npx playwright install --with-deps ${{ matrix.browser }}
```

---

## Q509.6 — How are secrets handled in the environment file step?

`.env.dev` contains credentials — never committed to the repository.
In CI, the file is written at runtime from GitHub Secrets:

```yaml
- name: Create environment file
  run: |
    mkdir -p test-data
    cat > test-data/.env.dev << EOF
    BASE_URL=${{ secrets.BASE_URL }}
    ADMIN_USERNAME=${{ secrets.ADMIN_USERNAME }}
    ADMIN_PASSWORD=${{ secrets.ADMIN_PASSWORD }}
    ESS_USERNAME=${{ secrets.ESS_USERNAME }}
    ESS_PASSWORD=${{ secrets.ESS_PASSWORD }}
    EOF
```

Secrets are configured in the repository: **Settings → Secrets and variables
→ Actions → New repository secret**. They are injected into the workflow at
runtime. GitHub masks them in logs — they never appear in plaintext in any
output, even if a step fails.

The `readEnv()` function reads this file exactly as it would locally —
the test code does not know or care whether the file was committed or
written by a CI step. The secret injection is transparent to the framework.

---

## Q509.7 — What does the nightly regression workflow do and why does the test step have continue-on-error?

```yaml
- name: Run full regression suite
  run: npx playwright test --grep @regression
  env:
    CI: true
    TEST_ENV: dev
  continue-on-error: true  # ← critical
```

`continue-on-error: true` on the test step prevents a test failure from
stopping the workflow. Without it, GitHub Actions marks the job as failed
when any `run` step exits with a non-zero code — and Playwright exits
non-zero when tests fail.

If the test step exits the job, the Allure report generation and GitHub
Pages publish steps never run. The run fails silently with no report.

With `continue-on-error: true`, the workflow continues through all steps
regardless of whether tests passed. The Allure report is generated, history
is preserved, and the report is published — even when failures occurred.
The final job status reflects the overall outcome.

The subsequent Allure and publish steps use `if: always()` for the same reason:
```yaml
- name: Generate Allure report
  run: npx allure generate allure-results --clean -o allure-report
  if: always()

- name: Publish Allure report to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  if: always()
```

---

## Q509.8 — How does Allure history accumulate across nightly runs?

Allure history (trend graphs, flakiness tracking, pass rate over time)
requires copying the previous report's `history/` folder into the current
`allure-results/` before generating the new report:

```yaml
# Step 1 — checkout the previous report from gh-pages
- name: Download previous Allure report
  uses: actions/checkout@v4
  with:
    ref: gh-pages
    path: gh-pages-previous
  continue-on-error: true  # first run has no history — don't fail

# Step 2 — copy history folder into current allure-results
- name: Copy Allure history
  run: |
    if [ -d "gh-pages-previous/history" ]; then
      cp -r gh-pages-previous/history allure-results/history
      echo "✅ History copied"
    else
      echo "ℹ️  No history — first run"
    fi
  continue-on-error: true

# Step 3 — generate report (now includes history)
- name: Generate Allure report
  run: npx allure generate allure-results --clean -o allure-report
  if: always()

# Step 4 — publish to gh-pages (overwrites previous)
- name: Publish to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  if: always()
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir:  ./allure-report
```

Without this pattern, each run starts fresh — no trend lines, no flakiness
tracking, no pass rate history. The `history/` folder is what Allure uses
to draw its trend graphs. Copy it forward on every run.

---

## Q509.9 — How does the manual workflow use workflow_dispatch inputs?

```yaml
# .github/workflows/manual-run.yml
on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'Test tag to run'
        required: true
        default: '@smoke'
        type: choice
        options: ['@smoke', '@regression', '@sanity', '@pim', '@admin', '@leave', '@critical']
      environment:
        description: 'Target environment'
        required: true
        default: 'dev'
        type: choice
        options: [dev, staging]

jobs:
  manual:
    name: Manual — ${{ github.event.inputs.tag }} on ${{ github.event.inputs.environment }}
    runs-on: ubuntu-latest
    steps:
      # ... setup steps ...
      - name: Run selected tests
        run: npx playwright test --grep "${{ github.event.inputs.tag }}"
        env:
          CI: true
          TEST_ENV: ${{ github.event.inputs.environment }}
```

`workflow_dispatch` with `type: choice` produces a dropdown in the GitHub
Actions UI. Any team member can go to Actions → Manual Run → Run workflow,
pick a tag and environment from dropdowns, and trigger a targeted run
without any local setup or CLI knowledge.

The staging environment step conditionally writes `test-data/.env.staging`
from staging-specific secrets (`STAGING_BASE_URL`, `STAGING_ADMIN_USERNAME`,
etc.) and passes `TEST_ENV: staging` to `readEnv()`.

---

## Q509.10 — Why is workers: 2 the right number for the shared OrangeHRM demo site?

```typescript
// playwright.config.ts
workers: isCI ? 2 : 1,
```

The OrangeHRM demo site is shared — it serves many concurrent users and
has no guaranteed capacity.

**Too many workers (4+) on the shared site:**
- Two tests creating employees simultaneously may trigger rate limiting
- Concurrent requests to the same OrangeHRM session can cause data conflicts
- The demo site may throttle or time out under heavy concurrent load

**2 workers:**
- Safe for the shared site — two tests run concurrently
- Meaningful speed improvement over sequential (1 worker)
- Tested and stable at this level

**1 worker locally:**
- Sequential — easier to debug, no interference between tests
- A failing test is clearly visible without parallel noise

If you move to a dedicated OrangeHRM instance you can raise workers to 4+.
The bottleneck then becomes CPU and network, not server capacity.

**Why test independence (Level 4) is a prerequisite:**
Tests generate unique data via API in `beforeAll` — no two tests create the
same employee name or username. 2 workers running 2 tests simultaneously
have no shared state to conflict over. Without test independence, parallel
execution would cause data conflicts.

---

## Q509.11 — What is the CI environment detection pattern and what does it affect?

```typescript
// playwright.config.ts
const isCI = !!process.env.CI;

export default defineConfig({
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : 1,
  use: {
    trace: isCI ? 'on-first-retry' : 'off',
    // ...allure reporter also only active in CI
  },
  reporter: [
    // ...
    ...(isCI ? [['allure-playwright', { outputFolder: 'allure-results' }] as const] : []),
  ],
});
```

GitHub Actions sets `CI=true` automatically. The workflows also set it
explicitly: `env: CI: true`.

**`retries: isCI ? 2 : 0`** — transient network issues on the demo site
are retried in CI. Locally, failures should be investigated immediately,
not silently retried.

**`workers: isCI ? 2 : 1`** — parallel in CI, sequential locally for easier
debugging.

**`trace: isCI ? 'on-first-retry' : 'off'`** — trace recording has overhead.
In CI it is worth it because you cannot re-run a CI test interactively.
Locally you can re-run and observe directly.

**Allure reporter** — only in CI. No overhead during local development.
Local runs use HTML and list reporters which are faster.

---

## Q509.12 — What are the package.json scripts at Level 8?

```json
{
  "scripts": {
    "test":            "playwright test",
    "test:smoke":      "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "test:sanity":     "playwright test --grep @sanity",

    "test:pim":        "playwright test --grep @pim",
    "test:admin":      "playwright test --grep @admin",
    "test:leave":      "playwright test --grep @leave",
    "test:login":      "playwright test --grep @login",

    "test:critical":   "playwright test --grep @critical",
    "test:ci":         "CI=true playwright test --grep @regression",

    "report":          "playwright show-report",
    "report:allure":   "allure generate allure-results --clean -o allure-report && allure open allure-report",
    "report:clean":    "rm -rf allure-results allure-report playwright-report test-results"
  }
}
```

Developers run `npm run test:smoke` before pushing. No `--grep` syntax to
remember. `report:clean` removes all generated artefacts before a clean run.
`test:ci` simulates the CI environment locally with `CI=true`.

---

## Q509.13 — What does Allure provide beyond the built-in HTML reporter?

The built-in `html` reporter is excellent for single-run investigation.
Allure adds cross-run value:

**Trend graphs** — pass rate over time. Immediately visible whether the
suite is getting more or less stable across weeks.

**Flakiness tracking** — Allure distinguishes `passed`, `failed`, and `flaky`
(passed on retry) across runs. A test that is flaky 3 times per week shows
as a known problem in the trends view.

**Failure categorisation** — Allure can categorise failures as "product defects"
(test failure), "test defects" (assertion error in test code), or "broken tests"
(infrastructure failure). This helps QA leads quickly separate genuine regressions
from framework issues.

**History per test** — click any test to see its pass/fail history across the
last N runs. Instantly identifies when a test started failing.

**Timeline** — shows when each test ran and how long it took across workers.
Useful for identifying which tests consistently take the longest.

The built-in reporter is for today's run. Allure is for the last 30 days of runs.

---

## Q509.14 — How is GitHub Pages set up for Allure report publishing?

One-time setup before the first nightly run:

**Step 1 — Enable Pages in repository settings:**
Settings → Pages → Source → Deploy from a branch
Branch: `gh-pages`, Folder: `/ (root)`. Save.

**Step 2 — Create an empty gh-pages branch:**
```bash
git checkout --orphan gh-pages  # new branch with no history
git rm -rf .
echo "Allure reports will appear here after the first run." > index.html
git add index.html
git commit -m "initialise gh-pages branch"
git push origin gh-pages
git checkout main
```

**Step 3 — Grant workflow write permission:**
Settings → Actions → General → Workflow permissions → Read and write permissions.

**What the nightly workflow does:**
```yaml
- name: Publish Allure report to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}  # automatic — no manual secret
    publish_dir:  ./allure-report
```

After the first run, the report is live at
`https://<org>.github.io/<repo>/`. The workflow overwrites the previous
report on each run but preserves the `history/` folder inside the report.

---

## Q509.15 — Why does the nightly workflow use permissions: contents: write?

```yaml
jobs:
  regression:
    permissions:
      contents: write  # required for peaceiris/actions-gh-pages
```

By default GitHub Actions workflows have read-only permissions on the repository.
The `peaceiris/actions-gh-pages` action needs to push commits to the `gh-pages`
branch — which requires write permission on repository contents.

Without this, the publish step fails with a 403 authentication error.

`GITHUB_TOKEN` is provided automatically to every workflow — no manual secret
is needed. The `permissions` block tells GitHub what level of access to
grant the token for this specific job.

---

## Q509.16 — What is the retry strategy and how does it distinguish flakiness from failure?

```typescript
retries: isCI ? 2 : 0,
```

With 2 retries, a test must fail 3 consecutive times to be marked `failed`.

```
Attempt 1: FAIL
Attempt 2: FAIL (retry 1)
Attempt 3: PASS → status = 'flaky'

Attempt 1: FAIL
Attempt 2: FAIL (retry 1)
Attempt 3: FAIL (retry 2) → status = 'failed'
```

A network timeout on the shared demo site is not a genuine test failure.
2 retries absorbs transient infrastructure issues without masking real
application regressions — a genuine regression fails consistently.

The SummaryReporter (Level 7) lists `flaky` tests separately. Over multiple
nightly runs, Allure's trend view shows which tests are consistently flaky.
These are candidates for stabilisation — either the test needs better waits,
or the feature has genuine intermittent behaviour worth investigating.

---

## Q509.17 — What are the artefact retention policies and why do they differ?

```yaml
# PR check — short retention, infrequent event
- name: Upload report on failure
  with:
    retention-days: 7

# Nightly — longer retention, valuable for trend analysis
- name: Upload Allure results
  with:
    retention-days: 30

- name: Upload Playwright report
  with:
    retention-days: 14
```

**7 days for PR reports** — you only need the report until the PR is
resolved. After a week, the PR is either merged, closed, or the issue
is fixed. Storage is reclaimed quickly.

**30 days for allure-results** — raw Allure results are small JSON files.
Keeping 30 days allows manual regeneration of historical reports if needed.

**14 days for nightly playwright reports** — the interactive HTML report.
Useful for investigating failures in the past two weeks. Beyond that,
Allure history (published to GitHub Pages) provides the trend view.

---

## Q509.18 — What does Level 8 not solve?

Level 8 automates the framework. The remaining problem:

**Test creation still requires manual effort.** Every test in the suite was
written manually by an engineer who understood the page objects, fixtures,
helpers, and conventions established across Levels 1 through 8. When a new
feature is added to OrangeHRM, someone must write the page objects, fixtures,
and test cases — applying the same patterns, following the same conventions,
matching the same quality standards.

Level 9 addresses this with an AI agent that reads the codebase, derives the
team's standards from the existing test files, and generates new tests that
are indistinguishable from what the team would write manually. The agent reads
`AddEmployeePage.ts`, `employee.spec.ts`, `fixtures/index.ts`, and `generate.ts`
— then writes the equivalent for a new feature without being told how.

---

## Chapter Summary

- Level 8 makes test results a team resource: PR gate blocks merges on failure; nightly runs publish to GitHub Pages; manual runs require no local setup.
- Three workflows: `pr-check.yml` (smoke on PRs), `nightly-regression.yml` (full suite nightly + Allure history), `manual-run.yml` (team-triggered targeted run).
- `npm ci` not `npm install` in CI: reproducible exact-version installs, fails if lock file is out of sync.
- `npx playwright install --with-deps chromium`: installs OS-level system libraries; install only the browsers the config uses.
- Credentials injected via `cat > .env.dev << EOF ... EOF` using GitHub Secrets — transparent to `readEnv()`.
- `continue-on-error: true` on the test step: prevents Playwright's non-zero exit from stopping the workflow before Allure generates and publishes the report.
- `if: always()` on Allure generate and publish steps: runs even when earlier steps failed.
- Allure history: copy `gh-pages-previous/history` into `allure-results/history` before generating; without this, each run starts fresh with no trend data.
- `workers: isCI ? 2 : 1`: 2 in CI for speed without overloading the shared demo site; 1 locally for easy debugging. Safe because tests are fully independent (Level 4).
- `retries: isCI ? 2 : 0`: absorbs transient demo site issues in CI; locally, failures are investigated immediately.
- `trace: isCI ? 'on-first-retry' : 'off'`: trace overhead only in CI where you cannot re-run interactively.
- `isCI = !!process.env.CI`: GitHub Actions sets `CI=true` automatically; workflows also set it explicitly.
- Allure provides cross-run value: trend graphs, flakiness tracking, failure categorisation, per-test history — things the single-run HTML reporter cannot.
- `permissions: contents: write` required for the `peaceiris/actions-gh-pages` action to push to the `gh-pages` branch.
- `workflow_dispatch` with `type: choice` inputs creates dropdown menus in the Actions UI — team members trigger targeted runs without CLI knowledge.
- Level 8 solves automation; it leaves test authoring speed (Level 9: AI-assisted test generation) for the next level.
