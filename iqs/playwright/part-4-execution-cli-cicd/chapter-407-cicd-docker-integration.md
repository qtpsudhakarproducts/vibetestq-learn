# Chapter 407 — CI/CD & Docker Integration

This chapter covers running Playwright suites in CI pipelines and Docker
containers — the two topics that separate a test suite that runs on one
developer's machine from a suite that runs reliably for the whole team,
on every push, in any environment. Interviewers ask about CI/Docker to
test production readiness: a candidate who can write a complete GitHub
Actions workflow, explain why `forbidOnly` matters, and describe Docker's
role in environment consistency is ready for a professional automation role.

---

## Q407.1 — Why do Playwright tests need CI integration?

Running tests only on a developer's machine creates three problems that CI
integration solves:

**Problem 1 — Nobody remembers to run tests.** Code merges without being
tested. Regressions reach the main branch. CI solves this by running tests
automatically on every push and pull request — no human decision required.

**Problem 2 — "Works on my machine."** Tests pass on macOS locally and
fail on the Linux CI server. Different Node versions, different font
rendering, different OS libraries. CI solves this by running every test
in a consistent, reproducible environment.

**Problem 3 — No report when it matters most.** A CI run fails and the
logs scroll off. No screenshots, no traces, no report. CI solves this by
always uploading artefacts — even when tests fail.

A properly integrated Playwright suite runs automatically on every push
and PR, uses the same environment every time, blocks merges when tests
fail, and makes the HTML report available within minutes of any failure.

---

## Q407.2 — What is the minimum viable GitHub Actions workflow for Playwright?

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci                          # reproducible install from lock file

      - name: Install Playwright browsers
        run: npx playwright install --with-deps  # browsers + OS libraries

      - name: Run tests
        run: npx playwright test
        env:
          CI: true
          BASE_URL: ${{ secrets.BASE_URL }}

      - name: Upload HTML report
        uses: actions/upload-artifact@v4
        if: always()                         # upload even when tests fail
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

Six steps. Every one matters:
1. Checkout — gets the code
2. Node setup with `cache: 'npm'` — faster `npm ci` by caching `node_modules`
3. `npm ci` — reproducible install from `package-lock.json`, not `npm install`
4. `npx playwright install --with-deps` — browsers AND OS-level libraries
5. Run tests with `CI: true` and secrets
6. Upload report with `if: always()` — critical

---

## Q407.3 — Why use npm ci instead of npm install in CI?

`npm ci` and `npm install` behave differently in ways that matter for CI:

| Behaviour | `npm install` | `npm ci` |
|-----------|--------------|---------|
| Source of truth | `package.json` (ranges) | `package-lock.json` (exact) |
| Upgrades packages | Yes — installs latest within range | No — installs exact locked versions |
| Speed | Slower | Faster (skips resolution step) |
| `node_modules` | Merges into existing | Deletes and reinstalls clean |
| Lock file | Can modify it | Fails if lock file is out of sync |

**The CI consequence:** `npm install` might silently install a newer patch
version of a dependency between two runs. Tests pass on Monday, fail on
Wednesday — same code, different library version. `npm ci` prevents this
by installing exactly the versions recorded in `package-lock.json`.

Always use `npm ci` in CI. Commit and keep `package-lock.json` in version control.

---

## Q407.4 — What does --with-deps do in npx playwright install --with-deps?

```bash
npx playwright install --with-deps
```

`--with-deps` installs two things:
1. The browser binaries (Chromium, Firefox, WebKit)
2. The OS-level libraries those browsers depend on

On a fresh Ubuntu runner, browsers need dozens of system libraries that
are not pre-installed: `libglib2.0-0`, `libnss3`, `libatk1.0-0`, fonts,
and many others. Without `--with-deps`, you get:

```
Error: browserType.launch: Executable doesn't exist at
/root/.cache/ms-playwright/chromium-1xxx/chrome-linux/chrome
```

or browser crashes with missing library errors.

**Install only specific browsers to save time:**
```bash
# Install only what your config uses
npx playwright install chromium --with-deps     # only Chromium
npx playwright install chromium firefox --with-deps  # Chromium + Firefox
```

On local development machines, `--with-deps` is usually not needed because
macOS and Windows provide the system libraries. On Linux CI runners it is
always required.

---

## Q407.5 — What is CI-aware playwright.config.ts?

The config should behave differently in CI versus local development. The
`CI` environment variable (set automatically by GitHub Actions, GitLab CI,
Azure DevOps, CircleCI, and most other platforms) is the standard detection:

```typescript
// playwright.config.ts
export default defineConfig({
  // Retries absorb environment flakiness on CI
  retries: process.env.CI ? 2 : 0,

  // Fewer workers on CI — shared runner CPUs
  workers: process.env.CI ? 2 : 4,

  // Accidental test.only commits become CI errors
  forbidOnly: !!process.env.CI,

  // Stop after 10 failures — something is clearly broken
  maxFailures: process.env.CI ? 10 : undefined,

  use: {
    baseURL: process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
    trace:      'on-first-retry',
  },

  reporter: process.env.CI
    ? [
        ['html',  { open: 'never' }],
        ['junit', { outputFile: 'results/junit.xml' }],
        process.env.GITHUB_ACTIONS ? ['github'] : ['dot'],
      ]
    : [
        ['html',  { open: 'on-failure' }],
        ['list'],
      ],
});
```

---

## Q407.6 — What is forbidOnly and why does it matter?

`forbidOnly: !!process.env.CI` causes the test run to fail immediately
if any test or describe block is marked with `.only`:

```typescript
// A developer commits this accidentally:
test.only('login works', async ({ page }) => { ... });

// Without forbidOnly: CI runs only this one test and reports "1 passed"
// With forbidOnly: CI fails immediately with:
// "Error: focused items are not allowed when running with --forbid-only"
```

Without `forbidOnly`, an accidental `test.only` commit causes CI to pass
on a single test while all other tests are silently skipped. The team sees
green CI and merges code with 599 tests not running. This has caused real
production incidents.

`forbidOnly: true` turns the accident into a visible CI error. The developer
gets immediate feedback and removes the `.only` before merging.

---

## Q407.7 — How do you handle secrets and environment variables in CI?

Never hardcode credentials or URLs in test files or config. Pass them
through the CI platform's secret store:

```typescript
// playwright.config.ts — reads from environment variables
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',
  },
});

// tests/auth/login.spec.ts — reads credentials from environment
const username = process.env.TEST_USERNAME ?? 'Admin';
const password = process.env.TEST_PASSWORD ?? 'admin123';
```

```yaml
# GitHub Actions — inject secrets at runtime
- name: Run tests
  run: npx playwright test
  env:
    CI: true
    BASE_URL: ${{ secrets.STAGING_URL }}
    TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
    TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
```

GitHub secrets are encrypted and never appear in logs — even if a step
accidentally prints `process.env`, GitHub redacts the secret values.

Configure secrets at: Settings → Secrets and variables → Actions → New
repository secret.

**For different environments:**
```yaml
# Use GitHub environments for staging vs production
environment: staging
env:
  BASE_URL: ${{ secrets.STAGING_URL }}
```

---

## Q407.8 — How do you cache Playwright browsers in CI?

Without caching, `npx playwright install --with-deps` downloads 100–300 MB
of browsers on every CI run. Cache the `~/.cache/ms-playwright` directory
keyed to `package-lock.json`:

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

- name: Install Playwright browsers
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps

- name: Install OS deps only (cache hit)
  if: steps.playwright-cache.outputs.cache-hit == 'true'
  run: npx playwright install-deps
```

When `package-lock.json` changes (Playwright version bump), the cache key
changes and browsers are reinstalled. When it has not changed, the cached
browsers are used in seconds.

**Why reinstall OS deps even on cache hit?** OS-level libraries
(`--with-deps`) come from `apt` — they are not in `~/.cache/ms-playwright`.
A fresh runner does not have them regardless of browser cache. `playwright install-deps`
reinstalls only the OS libraries, not the browser binaries.

---

## Q407.9 — How do you publish test results to Azure DevOps and GitLab CI?

**Azure DevOps:**

```yaml
- script: npx playwright test
  displayName: 'Run Playwright tests'
  env:
    CI: 'true'

- task: PublishTestResults@2
  condition: always()
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: 'results/junit.xml'
    testRunTitle: 'Playwright Tests — $(Build.SourceBranchName)'
    failTaskOnFailedTests: true

- task: PublishPipelineArtifact@1
  condition: always()
  inputs:
    targetPath: 'playwright-report'
    artifact: 'playwright-report'
```

Azure DevOps displays test results in the Tests tab of the pipeline run —
with pass/fail trends, individual test details, and the ability to link
failures to work items.

**GitLab CI:**

```yaml
playwright:
  image: mcr.microsoft.com/playwright:v1.52.0-jammy
  script:
    - npm ci
    - npx playwright test
  variables:
    CI: 'true'
  artifacts:
    when: always
    paths:
      - playwright-report/
      - results/junit.xml
    reports:
      junit: results/junit.xml
    expire_in: 30 days
```

`reports: junit:` tells GitLab to parse the XML and show results in
the pipeline's Tests tab. `when: always` uploads artefacts even on failure.

---

## Q407.10 — What is Docker and what problem does it solve for Playwright?

Docker packages the entire runtime environment — Node.js version, browser
binaries, OS libraries, fonts, timezone — into a container image. Everyone
who runs that image gets an identical environment.

**The problem it solves:**

```
Developer A (macOS): tests pass
Developer B (Windows): tests fail — different font rendering
CI server (Ubuntu 20): tests fail — missing libglib version
New team member: 2-hour environment setup before first test run
```

With Docker:
```
Everyone runs: docker run mcr.microsoft.com/playwright:v1.52.0-jammy
Result: identical environment, identical results
```

Microsoft maintains the official Playwright image
`mcr.microsoft.com/playwright:v1.52.0-jammy` — it contains Ubuntu 22.04,
Node.js 20, all three browser binaries, and all required OS libraries.

---

## Q407.11 — How do you run Playwright tests in Docker locally?

```bash
# Run all tests in the official Playwright image
docker run --rm \
  -v $(pwd):/app \
  -w /app \
  mcr.microsoft.com/playwright:v1.52.0-jammy \
  bash -c "npm ci && npx playwright test"
```

`--rm` — removes the container when it finishes. No cleanup needed.
`-v $(pwd):/app` — mounts your project directory into the container.
`-w /app` — sets the working directory inside the container.

**With environment variables:**
```bash
docker run --rm \
  -v $(pwd):/app \
  -w /app \
  -e CI=true \
  -e BASE_URL=https://demo.orangehrmlive.com \
  mcr.microsoft.com/playwright:v1.52.0-jammy \
  bash -c "npm ci && npx playwright test"
```

**Getting the report out — mount the output directory:**
```bash
docker run --rm \
  -v $(pwd):/app \
  -v $(pwd)/playwright-report:/app/playwright-report \
  -w /app \
  mcr.microsoft.com/playwright:v1.52.0-jammy \
  bash -c "npm ci && npx playwright test"
# playwright-report/ now exists on your host machine
```

Without the volume mount, files written inside the container disappear
when the container stops.

---

## Q407.12 — How do you write a Dockerfile for a Playwright project?

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app

# Copy dependency files first — better Docker layer caching
# Changes to test files won't invalidate the npm ci cache layer
COPY package*.json ./
RUN npm ci

# Copy the rest of the project
COPY . .

# Default: run all tests
CMD ["npx", "playwright", "test"]
```

Build and run:
```bash
# Build the image (only runs npm ci if package*.json changed)
docker build -t orangehrm-playwright .

# Run all tests
docker run --rm orangehrm-playwright

# Run a specific suite with env vars
docker run --rm \
  -e BASE_URL=https://staging.example.com \
  -e CI=true \
  -v $(pwd)/playwright-report:/app/playwright-report \
  orangehrm-playwright \
  npx playwright test --grep @smoke
```

**Layer caching principle:** `COPY package*.json` + `RUN npm ci` before
`COPY . .` means Docker reuses the cached `npm ci` layer on rebuilds when
only test files change. A change to `login.spec.ts` does not trigger
`npm ci` again — only a change to `package.json` or `package-lock.json` does.

---

## Q407.13 — How do you use the Playwright Docker image in GitHub Actions?

Use the `container:` key to run the entire job inside the Playwright image.
This skips browser installation — browsers are already in the image:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.52.0-jammy

    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci        # browsers already in image — no playwright install step

      - name: Run tests
        run: npx playwright test
        env:
          CI: true
          HOME: /root      # required — GitHub Actions container jobs run as root
          BASE_URL: ${{ secrets.BASE_URL }}

      - name: Upload report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

**`HOME: /root`** — when the job runs as root inside the container, the
`HOME` environment variable may not be set correctly. Playwright uses
`$HOME/.cache` for browser profiles. Without this, you get "Failed to
create a profile directory" errors.

**Tradeoff:** Pulling the image takes time on first use but the image
is cached by the GitHub Actions runner. The benefit is zero browser
installation logic — the image is the environment.

---

## Q407.14 — What is Docker Compose and when do you use it for testing?

Docker Compose coordinates multiple containers. Use it when your tests
run against a locally hosted application rather than a remote URL:

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    image: orangehrm/orangehrm:latest
    ports:
      - '80:80'
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost/web/index.php/auth/login']
      interval: 10s
      timeout:  5s
      retries:  10

  playwright:
    build: .
    depends_on:
      app:
        condition: service_healthy  # wait until app healthcheck passes
    environment:
      - BASE_URL=http://app         # use Docker Compose service name, not localhost
      - CI=true
    volumes:
      - ./playwright-report:/app/playwright-report
```

```bash
# Start app and run tests
docker compose up --abort-on-container-exit --exit-code-from playwright

# Clean up
docker compose down
```

`--abort-on-container-exit` — when the playwright container exits
(tests finish), all other containers stop.

`--exit-code-from playwright` — `docker compose up` exits with the
same code as the playwright container. Test failures (exit code 1) propagate
to CI correctly and mark the build as failed.

---

## Q407.15 — What are common CI failures and how do you diagnose them?

**"browserType.launch: Executable doesn't exist"**
Cause: `--with-deps` not used, or browser cache restored without OS deps.
Fix: use `npx playwright install --with-deps`; on cache hit run `npx playwright install-deps`.

**"Test timeout" on all tests**
Cause: `BASE_URL` not set or pointing to unreachable server.
Fix: verify the secret value in GitHub; check whether the URL is reachable from the CI runner.

**Tests pass locally, fail in CI**
Common causes: timezone difference, different screen resolution/viewport,
`localhost` unreachable from Docker container (use service name), missing
environment variable.
Fix: run locally in Docker using the same image as CI — `docker run` with
`mcr.microsoft.com/playwright:v1.52.0-jammy`. If it fails there too,
the environment is the issue, not the tests.

**"Error: focused items are not allowed"**
Cause: `test.only` or `describe.only` committed to the branch.
Fix: remove `.only`; this is `forbidOnly` doing its job correctly.

**Report artefact not available**
Cause: `if: always()` missing on upload step.
Fix: add `if: always()` to the upload step — it must be there unconditionally.

---

## Q407.16 — Write a complete CI workflow with caching, secrets, and nightly schedule.

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'   # nightly regression at 2am UTC

jobs:
  test:
    name: Playwright Tests
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

      - name: Install browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps

      - name: Install OS deps (cache hit)
        if: steps.playwright-cache.outputs.cache-hit == 'true'
        run: npx playwright install-deps

      - name: Run tests
        run: npx playwright test
        env:
          CI: true
          BASE_URL:       ${{ secrets.STAGING_URL }}
          TEST_USERNAME:  ${{ secrets.TEST_USERNAME }}
          TEST_PASSWORD:  ${{ secrets.TEST_PASSWORD }}

      - name: Upload HTML report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: test-results/
          retention-days: 7
```

---

## Q407.17 — What belongs in .gitignore for a Playwright project?

```gitignore
# Generated on every run — never commit these
test-results/
playwright-report/
blob-report/
results/

# Auth state — contains session tokens, potentially sensitive
.auth/

# OS-generated
.DS_Store
node_modules/
```

**What to commit (do NOT gitignore):**
- `playwright.config.ts` — the project configuration
- `package-lock.json` — required for `npm ci` reproducibility
- `snapshots/` — visual test baselines (these are intentional committed artefacts)

The `.auth/` directory is worth particular attention. It contains saved
session state including cookies and localStorage. Committing it means
session tokens are in version control — a security issue. Always gitignore
`.auth/` and regenerate it in CI via `globalSetup`.

---

## Q407.18 — How did you set up CI for the OrangeHRM project?

We started with tests running only on individual machines. Three things
pushed the team to set up CI: a regression was merged that broke the
leave module; tests passed locally on one engineer's macOS but failed on
another's Linux; and a CI run earlier in another project produced no report
because the upload step was missing `if: always()`.

**The setup we landed on:**

The workflow triggers on PR and push to main. We use browser caching
keyed to `package-lock.json` — saved roughly 2 minutes per run on an
active day with 15+ CI runs. `forbidOnly: true` caught its first accidental
`test.only` commit within the first week.

The CI-aware config uses `retries: 2` and `workers: 2` (the shared runner
has 2 CPUs). `maxFailures: 10` stops early when something is clearly broken —
we had a deployment go out with a wrong database config that caused every
test to fail; without `maxFailures` we waited 22 minutes to find out.

We use the `github` reporter for inline PR annotations and the HTML report
uploaded as an artefact. Reviewers see which tests failed directly in the
PR without opening the workflow run. The HTML report download has the traces
for the deeper investigation.

The most impactful single decision: using Docker locally to reproduce CI
failures. Before Docker, "works on my machine" bugs took hours to track down.
Now when a test fails in CI, the first diagnostic step is `docker run` with
the same image. It reproduces ~80% of CI-only failures in under 5 minutes.

---

## Chapter Summary

- CI runs tests automatically on every push and PR — consistent environment, no human trigger needed.
- `npm ci` not `npm install` — installs exact locked versions; never upgrades between runs.
- `npx playwright install --with-deps` — installs browsers AND OS libraries; required on fresh Linux runners.
- `if: always()` on upload steps — uploads the report even when tests fail; non-negotiable.
- `CI=true` — triggers retries, workers reduction, forbidOnly, correct reporters in config.
- `forbidOnly: !!process.env.CI` — accidental `test.only` commits become CI errors, not silent suite reducers.
- `maxFailures` — stops the run early when clearly broken; saves CI time on broken deployments.
- Browser caching on `~/.cache/ms-playwright` keyed to `package-lock.json` — saves 1–3 minutes per run.
- Secrets via CI secret store — never hardcode credentials or URLs in code or config.
- Docker packages Node, browsers, OS libraries into one image — identical environment everywhere.
- Official image: `mcr.microsoft.com/playwright:v1.52.0-jammy` — pin to your project's Playwright version.
- `HOME: /root` in GitHub Actions container jobs — prevents browser profile errors.
- Docker Compose — coordinates app + tests containers; `service_healthy` waits for the app; `--exit-code-from` propagates test failures to CI.
- `localhost` inside a container is the container, not the host — use `host.docker.internal` or service names.
- Always mount the report directory as a volume — files inside a container vanish when it stops.
