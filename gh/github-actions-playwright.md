# GitHub Actions for Playwright Test Suites
### Complete Reference with Examples

---

## Table of Contents

- [Part 1 — How GitHub Actions Works](#part-1--how-github-actions-works)
- [Part 2 — Workflow File Anatomy](#part-2--workflow-file-anatomy)
- [Part 3 — Triggers](#part-3--triggers)
- [Part 4 — Secrets and Environment Variables](#part-4--secrets-and-environment-variables)
- [Part 5 — Installing Playwright in CI](#part-5--installing-playwright-in-ci)
- [Part 6 — Caching Dependencies](#part-6--caching-dependencies)
- [Part 7 — Running Tests](#part-7--running-tests)
- [Part 8 — Sharding — Parallel Execution Across Machines](#part-8--sharding--parallel-execution-across-machines)
- [Part 9 — Matrix Strategy — Multiple Browsers and Environments](#part-9--matrix-strategy--multiple-browsers-and-environments)
- [Part 10 — Nightly Scheduled Execution](#part-10--nightly-scheduled-execution)
- [Part 11 — PR Check Workflow](#part-11--pr-check-workflow)
- [Part 12 — Manual Trigger with Inputs](#part-12--manual-trigger-with-inputs)
- [Part 13 — Uploading Reports and Artifacts](#part-13--uploading-reports-and-artifacts)
- [Part 14 — Publishing Reports to GitHub Pages](#part-14--publishing-reports-to-github-pages)
- [Part 15 — Retry Strategy](#part-15--retry-strategy)
- [Part 16 — Conditional Steps and Failure Handling](#part-16--conditional-steps-and-failure-handling)
- [Part 17 — Reusable Workflows](#part-17--reusable-workflows)
- [Part 18 — Environments and Deployment Gates](#part-18--environments-and-deployment-gates)
- [Part 19 — Notifications](#part-19--notifications)
- [Part 20 — Complete Workflow Examples](#part-20--complete-workflow-examples)

---

## Part 1 — How GitHub Actions Works

GitHub Actions is a CI/CD platform built into GitHub. Workflows are YAML files that live in `.github/workflows/`. Every workflow defines when it runs, what machine it runs on, and what steps it executes.

```
Repository
└── .github/
    └── workflows/
        ├── pr-check.yml          ← runs on every pull request
        ├── nightly-regression.yml ← runs on schedule
        └── manual-run.yml        ← runs on demand
```

**Key concepts:**

- **Workflow** — the YAML file. Defines the entire automation.
- **Trigger** — the event that starts the workflow: push, PR, schedule, manual.
- **Job** — a unit of work that runs on one machine. A workflow can have many jobs.
- **Step** — an individual command or action inside a job. Steps run sequentially.
- **Runner** — the machine that executes the job. GitHub provides Ubuntu, Windows, macOS.
- **Action** — a reusable step published by the community, e.g. `actions/checkout@v4`.

---

## Part 2 — Workflow File Anatomy

```yaml
name: Playwright Tests           # Displayed in GitHub Actions UI

on:                              # Trigger(s)
  push:
    branches: [main]

jobs:
  test:                          # Job ID — any name
    runs-on: ubuntu-latest       # Runner OS

    steps:
      - name: Checkout code      # Human-readable step name
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npx playwright test
```

**`run`** executes a shell command.
**`uses`** runs a published GitHub Action.
**`with`** passes parameters to an action.
**`env`** sets environment variables for a step or job.

---

## Part 3 — Triggers

### Push to a branch

```yaml
on:
  push:
    branches: [main, develop]
```

### Pull request

```yaml
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]
```

Only fires when a PR targets `main`. `synchronize` means a new commit was pushed to the PR branch.

### Schedule — cron

```yaml
on:
  schedule:
    - cron: '0 0 * * *'     # midnight UTC daily
    - cron: '0 6 * * 1-5'   # 6am UTC weekdays
```

Cron format: `minute hour day-of-month month day-of-week`

| Example | Meaning |
|---------|---------|
| `0 0 * * *` | Midnight daily |
| `0 6 * * 1-5` | 6am Monday–Friday |
| `0 */4 * * *` | Every 4 hours |
| `30 22 * * 0` | 10:30pm every Sunday |

### Manual trigger with inputs

```yaml
on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'Test tag to run (e.g. @smoke)'
        required: false
        default: '@regression'
        type: string
      environment:
        description: 'Target environment'
        required: true
        default: 'dev'
        type: choice
        options: [dev, staging, production]
```

### Multiple triggers

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:
```

### Trigger on specific file changes

```yaml
on:
  push:
    paths:
      - 'tests/**'
      - 'pages/**'
      - 'playwright.config.ts'
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

---

## Part 4 — Secrets and Environment Variables

### Storing secrets

Secrets are encrypted values stored in the repository, never visible in logs.

Navigate to: **Repository → Settings → Secrets and variables → Actions → New repository secret**

Common secrets for Playwright:

| Secret name | What it stores |
|-------------|---------------|
| `BASE_URL` | Target application URL |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `ESS_USERNAME` | Standard user login |
| `ESS_PASSWORD` | Standard user password |
| `HEAL_LLM_API_KEY` | LLM API key for self-healing |

### Using secrets in a workflow

```yaml
steps:
  - name: Run tests
    run: npx playwright test
    env:
      BASE_URL: ${{ secrets.BASE_URL }}
      ADMIN_USERNAME: ${{ secrets.ADMIN_USERNAME }}
      ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
```

### Environment-level secrets

For staging/production gating, use GitHub Environments:

Navigate to: **Repository → Settings → Environments → New environment**

```yaml
jobs:
  test:
    environment: staging        # Links to the GitHub Environment
    runs-on: ubuntu-latest
    steps:
      - name: Run tests
        env:
          BASE_URL: ${{ secrets.BASE_URL }}   # resolves from staging environment
```

Environment secrets override repository secrets when an environment is specified.

### Setting env vars at job level vs step level

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      CI: true                   # available to ALL steps in this job
      TEST_ENV: dev

    steps:
      - name: Run tests
        run: npx playwright test
        env:
          BASE_URL: ${{ secrets.BASE_URL }}   # available to THIS step only
```

### Writing to environment file

When tests read credentials from a `.env` file:

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

### GitHub-provided variables

These are always available without configuration:

| Variable | Value |
|----------|-------|
| `${{ github.actor }}` | User who triggered the run |
| `${{ github.run_number }}` | Incrementing run counter |
| `${{ github.sha }}` | Full commit SHA |
| `${{ github.ref_name }}` | Branch or tag name |
| `${{ github.event_name }}` | Trigger type: push, pull_request, schedule |

---

## Part 5 — Installing Playwright in CI

### Basic install

```yaml
steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v4
    with:
      node-version: '20'

  - name: Install dependencies
    run: npm ci

  - name: Install Playwright browsers
    run: npx playwright install --with-deps chromium
```

**`npm ci`** — faster than `npm install`, uses `package-lock.json` exactly, no network resolution. Always use in CI.

**`--with-deps chromium`** — installs only Chromium and its OS dependencies. Faster than installing all three browsers if you only need one.

### Install all browsers

```yaml
- name: Install all Playwright browsers
  run: npx playwright install --with-deps
```

### Install specific browsers

```yaml
- name: Install browsers
  run: npx playwright install --with-deps chromium firefox webkit
```

---

## Part 6 — Caching Dependencies

Without caching, `npm ci` and browser downloads happen on every run. With caching, repeat runs skip downloads when nothing changed.

### Cache node_modules

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'               # built-in npm cache — caches ~/.npm
```

### Cache Playwright browsers

Playwright browsers install to `~/.cache/ms-playwright`. Cache them separately:

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      playwright-${{ runner.os }}-

- name: Install Playwright browsers
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps chromium
```

**`hashFiles`** generates a hash of `package-lock.json`. When Playwright version changes, `package-lock.json` changes, the hash changes, the cache is invalidated and browsers are reinstalled.

**`restore-keys`** allows a partial match — if an exact cache is not found, it restores the most recent cache with the same OS prefix. Browsers may be slightly out of date but the install step catches any missing files.

---

## Part 7 — Running Tests

### Run all tests

```yaml
- name: Run Playwright tests
  run: npx playwright test
```

### Run by tag

```yaml
- name: Run smoke suite
  run: npx playwright test --grep @smoke
```

### Run a specific file

```yaml
- name: Run user tests
  run: npx playwright test tests/admin/user.spec.ts
```

### Run with a specific config

```yaml
- name: Run tests
  run: npx playwright test --config playwright.config.ci.ts
```

### Run with specific workers

```yaml
- name: Run tests
  run: npx playwright test --workers 4
```

### Pass input from manual trigger

```yaml
- name: Run tests
  run: npx playwright test --grep "${{ github.event.inputs.tag }}"
```

### Prevent workflow failure when tests fail

By default, a non-zero exit code fails the workflow. Use `continue-on-error` to allow subsequent steps (like report publishing) to still run:

```yaml
- name: Run tests
  run: npx playwright test
  continue-on-error: true       # workflow continues even if tests fail
```

---

## Part 8 — Sharding — Parallel Execution Across Machines

Sharding splits the test suite across multiple machines. Each machine runs a subset of tests in parallel. Total execution time drops proportionally.

```
Without sharding: 1 machine × 100 tests = 20 minutes
With 4 shards:    4 machines × 25 tests = 5 minutes
```

### Sharding with matrix strategy

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false          # don't cancel other shards if one fails
      matrix:
        shard: [1, 2, 3, 4]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Run shard
        run: npx playwright test --shard=${{ matrix.shard }}/4
        env:
          CI: true

      - name: Upload shard results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-results-shard-${{ matrix.shard }}
          path: playwright-report/
          retention-days: 7
```

### Merging shard reports

After all shards finish, merge their reports in a separate job:

```yaml
  merge-reports:
    needs: test                 # runs after all shards complete
    runs-on: ubuntu-latest
    if: always()

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci

      - name: Download all shard reports
        uses: actions/download-artifact@v4
        with:
          path: all-reports/
          pattern: playwright-results-shard-*
          merge-multiple: true

      - name: Merge reports
        run: npx playwright merge-reports --reporter html all-reports/

      - name: Upload merged report
        uses: actions/upload-artifact@v4
        with:
          name: merged-playwright-report
          path: playwright-report/
          retention-days: 14
```

### How many shards

Start with the number of shards where each shard runs for about 3–5 minutes. Running too many shards adds machine startup overhead that outweighs the parallelism benefit.

| Suite size | Suggested shards |
|------------|-----------------|
| < 50 tests | 1–2 |
| 50–200 tests | 3–4 |
| 200–500 tests | 5–8 |
| 500+ tests | 8–16 |

---

## Part 9 — Matrix Strategy — Multiple Browsers and Environments

### Run on multiple browsers

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run tests on ${{ matrix.browser }}
        run: npx playwright test --project=${{ matrix.browser }}
        env:
          CI: true
```

### Run on multiple environments

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev, staging]

    steps:
      - name: Create env file
        run: |
          cat > .env << EOF
          BASE_URL=${{ matrix.environment == 'dev' && secrets.DEV_BASE_URL || secrets.STAGING_BASE_URL }}
          EOF
```

### Combine browser and environment

```yaml
strategy:
  matrix:
    browser: [chromium, firefox]
    environment: [dev, staging]
  # exclude specific combinations
  exclude:
    - browser: firefox
      environment: staging
```

This generates jobs for: chromium+dev, chromium+staging, firefox+dev. Excludes firefox+staging.

### Matrix with include — different configs per combination

```yaml
strategy:
  matrix:
    include:
      - browser: chromium
        workers: 4
        tag: '@regression'
      - browser: firefox
        workers: 2
        tag: '@smoke'
```

---

## Part 10 — Nightly Scheduled Execution

Full regression suite runs every night. Results are published to GitHub Pages for the team to review.

```yaml
name: Nightly Regression

on:
  schedule:
    - cron: '0 0 * * *'        # midnight UTC
  workflow_dispatch:            # also allow manual trigger

jobs:
  regression:
    runs-on: ubuntu-latest
    timeout-minutes: 60        # kill the job if it runs over 1 hour

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

      - run: npm ci

      - name: Install Playwright browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
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

      - name: Run regression suite
        run: npx playwright test --grep @regression
        env:
          CI: true
          TEST_ENV: dev
        continue-on-error: true

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: regression-report-${{ github.run_number }}
          path: playwright-report/
          retention-days: 30
```

### Preventing duplicate scheduled runs

If a scheduled run is still in progress when the next one starts, cancel the old one:

```yaml
concurrency:
  group: nightly-${{ github.ref }}
  cancel-in-progress: true
```

---

## Part 11 — PR Check Workflow

Smoke suite runs on every pull request. Blocks merge if tests fail.

```yaml
name: PR Check

on:
  pull_request:
    branches: [main, develop]
    types: [opened, synchronize, reopened]

# Cancel in-progress PR runs when a new commit is pushed
concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  smoke:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps chromium

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
        uses: actions/upload-artifact@v4
        if: failure()                   # only upload when tests failed
        with:
          name: smoke-failure-${{ github.event.pull_request.number }}
          path: playwright-report/
          retention-days: 7
```

### Branch protection rule

To enforce that the smoke suite must pass before merging:

**Repository → Settings → Branches → Add rule → Branch name pattern: `main`**

Enable: **Require status checks to pass before merging** → search for `smoke` → select it.

---

## Part 12 — Manual Trigger with Inputs

Lets team members run a specific tag against a specific environment from the GitHub UI.

```yaml
name: Manual Run

on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'Test tag to run'
        required: false
        default: '@regression'
        type: string
      environment:
        description: 'Target environment'
        required: true
        default: 'dev'
        type: choice
        options:
          - dev
          - staging
          - production
      browser:
        description: 'Browser'
        required: false
        default: 'chromium'
        type: choice
        options:
          - chromium
          - firefox
          - webkit
      workers:
        description: 'Number of workers'
        required: false
        default: '4'
        type: string

jobs:
  run:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps ${{ github.event.inputs.browser }}

      - name: Create environment file
        run: |
          mkdir -p test-data
          ENV=${{ github.event.inputs.environment }}
          cat > test-data/.env.${ENV} << EOF
          BASE_URL=${{ github.event.inputs.environment == 'staging' && secrets.STAGING_BASE_URL || secrets.BASE_URL }}
          ADMIN_USERNAME=${{ github.event.inputs.environment == 'staging' && secrets.STAGING_ADMIN_USERNAME || secrets.ADMIN_USERNAME }}
          ADMIN_PASSWORD=${{ github.event.inputs.environment == 'staging' && secrets.STAGING_ADMIN_PASSWORD || secrets.ADMIN_PASSWORD }}
          ESS_USERNAME=${{ github.event.inputs.environment == 'staging' && secrets.STAGING_ESS_USERNAME || secrets.ESS_USERNAME }}
          ESS_PASSWORD=${{ github.event.inputs.environment == 'staging' && secrets.STAGING_ESS_PASSWORD || secrets.ESS_PASSWORD }}
          EOF

      - name: Run tests
        run: |
          npx playwright test \
            --grep "${{ github.event.inputs.tag }}" \
            --project=${{ github.event.inputs.browser }} \
            --workers=${{ github.event.inputs.workers }}
        env:
          CI: true
          TEST_ENV: ${{ github.event.inputs.environment }}
        continue-on-error: true

      - name: Upload report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: manual-run-${{ github.run_number }}
          path: playwright-report/
          retention-days: 14
```

---

## Part 13 — Uploading Reports and Artifacts

### Playwright HTML report

```yaml
- name: Upload Playwright report
  uses: actions/upload-artifact@v4
  if: always()                       # upload even when tests fail
  with:
    name: playwright-report-${{ github.run_number }}
    path: playwright-report/
    retention-days: 14
```

### Allure results

```yaml
- name: Upload Allure results
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: allure-results-${{ github.run_number }}
    path: allure-results/
    retention-days: 30
```

### Test traces on failure only

```yaml
- name: Upload traces on failure
  uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: traces-${{ github.run_number }}
    path: test-results/
    retention-days: 7
```

### Multiple artifacts at once

```yaml
- name: Upload all test artifacts
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: test-artifacts-${{ github.run_number }}
    path: |
      playwright-report/
      test-results/
      healing-log.json
    if-no-files-found: ignore         # don't fail if healing-log.json doesn't exist
    retention-days: 30
```

### Downloading artifacts in a later job

```yaml
jobs:
  test:
    # ...produces playwright-results-shard-1 etc.

  merge:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          path: downloaded-reports/
          pattern: playwright-results-shard-*
          merge-multiple: true
```

---

## Part 14 — Publishing Reports to GitHub Pages

Results are accessible at `https://<org>.github.io/<repo>/` after every nightly run.

### One-time setup

```bash
# Create an empty gh-pages branch
git checkout --orphan gh-pages
git rm -rf .
echo "Reports will appear here after the first run." > index.html
git add index.html
git commit -m "init gh-pages"
git push origin gh-pages
```

Enable GitHub Pages: **Repository → Settings → Pages → Source: Deploy from branch → Branch: gh-pages → / (root)**

Grant Actions write permission: **Repository → Settings → Actions → General → Workflow permissions → Read and write permissions**

### Publish workflow step

```yaml
      - name: Generate Allure report
        run: npx allure generate allure-results --clean -o allure-report

      - name: Publish report to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: allure-report
          keep_files: false
```

### Preserve Allure history across runs

Allure history shows trends — pass rate over time, flaky test trends. Without preserving history, every run starts from zero.

```yaml
      - name: Download previous report from gh-pages
        uses: actions/checkout@v4
        with:
          ref: gh-pages
          path: gh-pages-previous
        continue-on-error: true        # first run has no previous report

      - name: Copy history from previous report
        run: |
          if [ -d "gh-pages-previous/history" ]; then
            cp -r gh-pages-previous/history allure-results/history
            echo "History copied from previous report"
          else
            echo "No previous history found — first run"
          fi

      - name: Generate Allure report with history
        run: npx allure generate allure-results --clean -o allure-report

      - name: Publish to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: allure-report
```

---

## Part 15 — Retry Strategy

### Playwright-level retries — inside the test runner

Set in `playwright.config.ts`:

```typescript
export default defineConfig({
  retries: process.env.CI ? 2 : 0,   // 2 retries in CI, 0 locally
});
```

Or pass via CLI:

```yaml
- name: Run tests
  run: npx playwright test --retries=2
```

Playwright retries the failing test body up to N times before marking it as failed. Screenshots and traces from the final attempt are attached.

### Workflow-level retries — rerun the entire job

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
    # Retry the entire job up to 1 time if it fails
    # Useful for infrastructure-level flakiness (runner startup issues, network)
```

GitHub Actions does not have a native job retry — use the `gh` CLI in a subsequent step or the `nick-fields/retry` action:

```yaml
- name: Run tests with retry
  uses: nick-fields/retry@v3
  with:
    timeout_minutes: 30
    max_attempts: 3
    command: npx playwright test --grep @smoke
```

### Only retry on failure — not on success

```yaml
      - name: Run tests (first attempt)
        id: first-run
        run: npx playwright test
        continue-on-error: true

      - name: Retry failed tests
        if: steps.first-run.outcome == 'failure'
        run: npx playwright test --last-failed
```

`--last-failed` reruns only the tests that failed in the previous run — much faster than rerunning the full suite.

---

## Part 16 — Conditional Steps and Failure Handling

### Run a step only on failure

```yaml
- name: Upload traces
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: traces
    path: test-results/
```

### Run a step always — even on failure

```yaml
- name: Publish report
  if: always()
  run: npx allure generate allure-results --clean -o allure-report
```

### Run a step only on success

```yaml
- name: Notify success
  if: success()
  run: echo "All tests passed"
```

### Run based on trigger type

```yaml
- name: Step for scheduled runs only
  if: github.event_name == 'schedule'
  run: echo "This is the nightly run"

- name: Step for PRs only
  if: github.event_name == 'pull_request'
  run: echo "PR number ${{ github.event.pull_request.number }}"
```

### Run based on branch

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: echo "Deploying"
```

### Job dependency — run after another job

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    # ...

  report:
    needs: test                  # waits for test job to complete
    runs-on: ubuntu-latest
    if: always()                 # runs even if test job failed
    # ...
```

### Fail the workflow explicitly

```yaml
- name: Check test exit code
  run: |
    npx playwright test
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
      echo "Tests failed with exit code $EXIT_CODE"
      exit 1
    fi
```

---

## Part 17 — Reusable Workflows

Extract common steps into a reusable workflow to avoid duplication across multiple workflows.

### The reusable workflow — `.github/workflows/run-tests.yml`

```yaml
name: Run Playwright Tests (Reusable)

on:
  workflow_call:                        # makes this workflow reusable
    inputs:
      tag:
        required: true
        type: string
      environment:
        required: true
        type: string
      workers:
        required: false
        type: number
        default: 4
    secrets:
      BASE_URL:
        required: true
      ADMIN_USERNAME:
        required: true
      ADMIN_PASSWORD:
        required: true
      ESS_USERNAME:
        required: true
      ESS_PASSWORD:
        required: true

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Create environment file
        run: |
          mkdir -p test-data
          cat > test-data/.env.${{ inputs.environment }} << EOF
          BASE_URL=${{ secrets.BASE_URL }}
          ADMIN_USERNAME=${{ secrets.ADMIN_USERNAME }}
          ADMIN_PASSWORD=${{ secrets.ADMIN_PASSWORD }}
          ESS_USERNAME=${{ secrets.ESS_USERNAME }}
          ESS_PASSWORD=${{ secrets.ESS_PASSWORD }}
          EOF

      - name: Run tests
        run: npx playwright test --grep "${{ inputs.tag }}" --workers=${{ inputs.workers }}
        env:
          CI: true
          TEST_ENV: ${{ inputs.environment }}
        continue-on-error: true

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: report-${{ github.run_number }}
          path: playwright-report/
          retention-days: 14
```

### Calling the reusable workflow

```yaml
name: Nightly Regression

on:
  schedule:
    - cron: '0 0 * * *'

jobs:
  regression:
    uses: ./.github/workflows/run-tests.yml        # same repo
    with:
      tag: '@regression'
      environment: dev
      workers: 4
    secrets:
      BASE_URL: ${{ secrets.BASE_URL }}
      ADMIN_USERNAME: ${{ secrets.ADMIN_USERNAME }}
      ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
      ESS_USERNAME: ${{ secrets.ESS_USERNAME }}
      ESS_PASSWORD: ${{ secrets.ESS_PASSWORD }}
```

```yaml
name: PR Check

on:
  pull_request:
    branches: [main]

jobs:
  smoke:
    uses: ./.github/workflows/run-tests.yml
    with:
      tag: '@smoke'
      environment: dev
      workers: 2
    secrets: inherit                               # pass all secrets automatically
```

`secrets: inherit` passes all repository secrets to the called workflow — useful when all three workflows use the same secrets.

---

## Part 18 — Environments and Deployment Gates

GitHub Environments add protection rules and environment-specific secrets.

### Creating environments

**Repository → Settings → Environments → New environment**

Create: `dev`, `staging`, `production`

For `production`, enable:
- **Required reviewers** — a human must approve before the job runs
- **Wait timer** — delay before the job starts (e.g. 5 minutes)
- **Deployment branches** — restrict to `main` only

### Using environments in workflows

```yaml
jobs:
  test-dev:
    runs-on: ubuntu-latest
    environment: dev                # uses dev environment secrets
    steps:
      - name: Run smoke on dev
        run: npx playwright test --grep @smoke
        env:
          BASE_URL: ${{ secrets.BASE_URL }}    # resolves from dev environment

  test-staging:
    needs: test-dev
    runs-on: ubuntu-latest
    environment: staging            # pauses here for required reviewer approval
    steps:
      - name: Run regression on staging
        run: npx playwright test --grep @regression
        env:
          BASE_URL: ${{ secrets.BASE_URL }}    # resolves from staging environment
```

The workflow gates staging tests behind human approval and dev tests passing — a promotion pipeline with test gates at each stage.

---

## Part 19 — Notifications

### Slack notification on failure

```yaml
      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          webhook-type: incoming-webhook
          payload: |
            {
              "text": "❌ Playwright tests failed",
              "attachments": [
                {
                  "color": "danger",
                  "fields": [
                    { "title": "Workflow", "value": "${{ github.workflow }}", "short": true },
                    { "title": "Branch", "value": "${{ github.ref_name }}", "short": true },
                    { "title": "Run", "value": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}", "short": false }
                  ]
                }
              ]
            }
```

Store the webhook URL as a secret: `SLACK_WEBHOOK_URL`

### Slack notification with test summary

```yaml
      - name: Send Slack summary
        if: always()
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          webhook-type: incoming-webhook
          payload: |
            {
              "text": "${{ job.status == 'success' && '✅' || '❌' }} Nightly regression — ${{ job.status }}",
              "attachments": [
                {
                  "color": "${{ job.status == 'success' && 'good' || 'danger' }}",
                  "fields": [
                    { "title": "Report", "value": "https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}/", "short": false }
                  ]
                }
              ]
            }
```

### Email notification via SendGrid

```yaml
      - name: Send email on failure
        if: failure()
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.sendgrid.net
          server_port: 587
          username: apikey
          password: ${{ secrets.SENDGRID_API_KEY }}
          to: qa-team@company.com
          from: ci@company.com
          subject: "❌ Playwright nightly regression failed — Run #${{ github.run_number }}"
          body: |
            The nightly Playwright regression suite has failed.
            View the run: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

### GitHub PR comment with test results

```yaml
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const status = '${{ job.status }}';
            const icon = status === 'success' ? '✅' : '❌';
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `${icon} Smoke suite **${status}**\n[View report](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})`
            });
```

---

## Part 20 — Complete Workflow Examples

### 1. PR Smoke Check

```yaml
# .github/workflows/pr-check.yml
name: PR Smoke Check

on:
  pull_request:
    branches: [main, develop]

concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  smoke:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

      - run: npm ci

      - name: Install browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
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
        run: npx playwright test --grep @smoke --workers 2
        env:
          CI: true
          TEST_ENV: dev

      - name: Upload report on failure
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: smoke-failure-pr${{ github.event.pull_request.number }}
          path: playwright-report/
          retention-days: 7

      - name: Comment on PR
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const status = '${{ job.status }}';
            const icon = status === 'success' ? '✅' : '❌';
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `${icon} Smoke suite **${status}** — [View run](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})`
            });
```

---

### 2. Nightly Regression with Sharding, Allure History, and Slack Notification

```yaml
# .github/workflows/nightly-regression.yml
name: Nightly Regression

on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:

concurrency:
  group: nightly
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

      - run: npm ci

      - name: Install browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
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

      - name: Run shard ${{ matrix.shard }}/4
        run: npx playwright test --grep @regression --shard=${{ matrix.shard }}/4
        env:
          CI: true
          TEST_ENV: dev
          ENABLE_RUNTIME_HEALING: 'true'
          HEAL_LLM_PROVIDER: 'anthropic'
          HEAL_LLM_MODEL: 'claude-sonnet-4-20250514'
          HEAL_LLM_API_KEY: ${{ secrets.HEAL_LLM_API_KEY }}
        continue-on-error: true

      - name: Upload shard results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: allure-results-shard-${{ matrix.shard }}
          path: allure-results/
          retention-days: 1         # only needed until merge job runs

  report:
    needs: test
    runs-on: ubuntu-latest
    if: always()

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm install -g allure-commandline

      - name: Download all shard results
        uses: actions/download-artifact@v4
        with:
          path: allure-results/
          pattern: allure-results-shard-*
          merge-multiple: true

      - name: Download previous Allure report from gh-pages
        uses: actions/checkout@v4
        with:
          ref: gh-pages
          path: gh-pages-previous
        continue-on-error: true

      - name: Copy history from previous report
        run: |
          if [ -d "gh-pages-previous/history" ]; then
            cp -r gh-pages-previous/history allure-results/history
          fi

      - name: Generate Allure report
        run: allure generate allure-results --clean -o allure-report

      - name: Publish to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: allure-report

      - name: Upload final report as artifact
        uses: actions/upload-artifact@v4
        with:
          name: regression-report-${{ github.run_number }}
          path: allure-report/
          retention-days: 30

      - name: Upload healing log
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: healing-log-${{ github.run_number }}
          path: healing-log.json
          if-no-files-found: ignore
          retention-days: 30

      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          webhook-type: incoming-webhook
          payload: |
            {
              "text": "${{ needs.test.result == 'success' && '✅' || '❌' }} Nightly regression — ${{ needs.test.result }}",
              "attachments": [{
                "color": "${{ needs.test.result == 'success' && 'good' || 'danger' }}",
                "fields": [
                  { "title": "Report", "value": "https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}/", "short": false },
                  { "title": "Run", "value": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}", "short": false }
                ]
              }]
            }
```

---

### 3. Manual Run with Full Input Control

```yaml
# .github/workflows/manual-run.yml
name: Manual Run

on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'Test tag'
        required: false
        default: '@regression'
        type: string
      environment:
        description: 'Environment'
        required: true
        default: 'dev'
        type: choice
        options: [dev, staging]
      browser:
        description: 'Browser'
        required: false
        default: 'chromium'
        type: choice
        options: [chromium, firefox, webkit]
      workers:
        description: 'Parallel workers'
        required: false
        default: '4'
        type: string
      retries:
        description: 'Retries per test'
        required: false
        default: '1'
        type: string

jobs:
  run:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    environment: ${{ github.event.inputs.environment }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps ${{ github.event.inputs.browser }}

      - name: Create environment file
        run: |
          mkdir -p test-data
          ENV=${{ github.event.inputs.environment }}
          cat > test-data/.env.${ENV} << EOF
          BASE_URL=${{ secrets.BASE_URL }}
          ADMIN_USERNAME=${{ secrets.ADMIN_USERNAME }}
          ADMIN_PASSWORD=${{ secrets.ADMIN_PASSWORD }}
          ESS_USERNAME=${{ secrets.ESS_USERNAME }}
          ESS_PASSWORD=${{ secrets.ESS_PASSWORD }}
          EOF

      - name: Run tests
        run: |
          npx playwright test \
            --grep "${{ github.event.inputs.tag }}" \
            --project=${{ github.event.inputs.browser }} \
            --workers=${{ github.event.inputs.workers }} \
            --retries=${{ github.event.inputs.retries }}
        env:
          CI: true
          TEST_ENV: ${{ github.event.inputs.environment }}
        continue-on-error: true

      - name: Upload report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: manual-run-${{ github.run_number }}-${{ github.event.inputs.environment }}
          path: playwright-report/
          retention-days: 14
```

---

## Quick Reference — Common Patterns

| Need | Pattern |
|------|---------|
| Run on PR | `on: pull_request` |
| Run nightly | `on: schedule: cron: '0 0 * * *'` |
| Run manually | `on: workflow_dispatch` |
| Store credential | Repository secret → `${{ secrets.NAME }}` |
| Run specific tag | `npx playwright test --grep @smoke` |
| Parallel sharding | `--shard=${{ matrix.shard }}/4` |
| Always upload report | `if: always()` |
| Upload only on failure | `if: failure()` |
| Cancel duplicate runs | `concurrency: group: ... cancel-in-progress: true` |
| Retry failed tests only | `npx playwright test --last-failed` |
| Cross-browser matrix | `matrix: browser: [chromium, firefox, webkit]` |
| Pass secrets to reusable workflow | `secrets: inherit` |
| Gate on human approval | `environment:` with required reviewers |
| Job depends on another | `needs: test` |

---

*GitHub Actions for Playwright — Complete Reference*
