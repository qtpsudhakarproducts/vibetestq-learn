# Chapter 311 — Configuration & playwright.config.ts

This chapter covers Playwright's configuration file — the single source of
truth for every setting that controls how your suite runs. Interviewers ask
about config to test environment design thinking: a candidate who knows the
config file can switch environments with one variable, enforce CI discipline,
and give tests the right evidence-collection settings. Candidates who hardcode
URLs in test files reveal they have not designed for maintainability.

---

## Q311.1 — What is playwright.config.ts and what does it control?

`playwright.config.ts` is the single source of truth for your test suite's
behaviour. It is the first file Playwright reads before running any test.
It controls:

- Where test files are found and which files count as tests
- How many workers run in parallel
- How many times to retry failed tests
- Which browsers and devices to test against
- The base URL and all browser settings shared across tests
- Timeouts at every level
- What evidence to capture (screenshots, video, traces)
- Which reporters generate output
- What global setup and teardown runs
- What projects exist and how they differ from each other

Every setting in the config applies to all tests by default. Projects can
override for a subset. Individual tests can override for themselves.

```typescript
// playwright.config.ts — minimal complete example
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

---

## Q311.2 — What are testDir, testMatch, and testIgnore?

**`testDir`** — the root directory Playwright searches for test files.
All paths in the config are resolved relative to the config file, and
tests are found within `testDir`:

```typescript
testDir: './tests',
```

**`testMatch`** — glob pattern(s) identifying which files are tests.
Default: `**/*.{spec,test}.{ts,js}`:

```typescript
testMatch: '**/*.spec.ts',                       // only .spec.ts files
testMatch: ['**/*.spec.ts', '**/*.test.ts'],     // both spec and test
testMatch: '**/auth.setup.ts',                   // project-level: one file only
```

**`testIgnore`** — files or patterns to exclude from discovery:

```typescript
testIgnore: [
  '**/*.helper.ts',    // helpers that live alongside spec files
  '**/fixtures/**',    // fixture definitions, not test files
  '**/utils/**',       // utility code
  '**/pages/**',       // page objects
],
```

The naming convention matters: using `.spec.ts` for tests and `.setup.ts`
for setup files means a simple `testMatch: '**/*.spec.ts'` picks up tests
but ignores setup files — which are matched only by the setup project's
own `testMatch`.

---

## Q311.3 — What is fullyParallel and what is the default parallelism model?

By default, Playwright parallelises at the **file level**: different files
run on different workers simultaneously, but tests within a single file run
sequentially on the same worker.

`fullyParallel: true` extends parallelism to the **test level**: individual
tests from the same file can be distributed across different workers:

```typescript
fullyParallel: false,  // default — sequential within a file
fullyParallel: true,   // tests within a file can run in parallel
```

**Use `fullyParallel: true` when:**
- All tests are fully independent (no shared mutable state, no `let` variables
  shared across tests)
- Tests do not rely on execution order

**Leave as `false` when:**
- Tests within a file share state via `let` variables
- A file uses `describe.serial`
- Tests within a file have a deliberate order dependency

For most well-designed suites where each test is isolated, `fullyParallel: true`
gives the fastest execution.

---

## Q311.4 — How do workers, retries, and forbidOnly work together for CI?

These three settings are typically configured differently for CI vs local:

```typescript
// The classic CI pattern
workers:     process.env.CI ? 2 : 4,
retries:     process.env.CI ? 2 : 0,
forbidOnly:  !!process.env.CI,
```

**`workers`:** CI machines are shared resources with limited CPU. Two workers
prevents the suite from starving other CI jobs. Locally, four workers uses
available CPU and runs the suite faster.

**`retries`:** Locally, zero retries means you see every failure immediately
and fix it. On CI, network variability and shared resources make occasional
flakiness more likely — two retries absorb that noise without hiding real
bugs. A test that fails three times in a row is a real failure.

**`forbidOnly`:** During debugging, engineers often add `test.only` to
isolate one test. If that gets committed and CI runs, the entire suite
is disabled — only the `.only` test runs. `forbidOnly: !!process.env.CI`
causes Playwright to abort immediately with:
```
Error: focused item found in the --forbid-only mode
```

Together, these three settings mean: CI runs fewer workers, tolerates
occasional flakiness, and blocks accidental `.only` commits. Local runs
are faster, stricter, and give immediate feedback.

---

## Q311.5 — What are the four timeout types and how do they relate?

Playwright has four independent timeouts that form a hierarchy:

```typescript
// playwright.config.ts
timeout: 30_000,            // test timeout
expect: { timeout: 5_000 }, // assertion timeout

use: {
  actionTimeout:     10_000, // per-action timeout
  navigationTimeout: 30_000, // per-navigation timeout
},
```

**Test timeout** (`timeout`): Maximum time for a single test — from the
moment it starts (including `beforeEach`) to when it ends (including
`afterEach`). If exceeded, the test is marked `timedOut`.

**Assertion timeout** (`expect.timeout`): How long a retrying assertion
waits for its condition to become true. Playwright's `expect()` calls
retry automatically — `toBeVisible()` keeps polling until the element
appears or this timeout expires.

**Action timeout** (`actionTimeout`): Maximum time for a single interaction
— `click()`, `fill()`, `hover()`. If the target element is not found and
interactable within this time, the action throws.

**Navigation timeout** (`navigationTimeout`): Maximum time for page
navigation — `page.goto()`, `page.waitForURL()`.

The hierarchy:
```
Test timeout (outer boundary — 30s)
  └── beforeEach + test body + afterEach
        ├── Each action: actionTimeout (10s)
        ├── Each navigation: navigationTimeout (30s)
        └── Each assertion: expect.timeout (5s)
```

A timed-out action throws an error. If uncaught, it fails the test. If the
test body keeps running, it eventually hits the test-level `timeout`.

**Override per test:**
```typescript
test('slow workflow', { timeout: 60_000 }, async ({ page }) => { ... });
// or:
test('slow workflow', async ({ page }) => {
  test.slow(); // multiplies timeout by 3
});
```

---

## Q311.6 — What is the use block and what are its most important settings?

The `use` block defines browser and context settings applied to every test.
Projects can add to or override these:

```typescript
use: {
  // Environment
  baseURL:  process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',

  // Browser behaviour
  headless:   true,
  viewport:   { width: 1280, height: 720 },
  locale:     'en-US',
  timezoneId: 'Asia/Kolkata',

  // Evidence collection
  screenshot: 'only-on-failure',
  video:      'retain-on-failure',
  trace:      'on-first-retry',

  // Timeouts
  actionTimeout:     10_000,
  navigationTimeout: 30_000,

  // Auth state — load saved session for every test
  storageState: '.auth/admin.json',

  // Network
  extraHTTPHeaders:  { 'X-Test-Run-Id': process.env.CI_RUN_ID ?? 'local' },
  ignoreHTTPSErrors: true,
},
```

The most important setting is `baseURL`. With it set, tests use relative
paths and switching environments needs one variable change — not a search
and replace across every test file:

```typescript
// ✅ Relative path — works with any baseURL
await page.goto('/web/index.php/auth/login');

// ❌ Hardcoded — breaks on every other environment
await page.goto('https://demo.orangehrmlive.com/web/index.php/auth/login');
```

---

## Q311.7 — How do screenshot, video, and trace settings work?

These three settings control what evidence Playwright captures alongside
test results. Each has four options:

```typescript
screenshot: 'off' | 'on' | 'only-on-failure'
video:      'off' | 'on' | 'retain-on-failure' | 'on-first-retry'
trace:      'off' | 'on' | 'retain-on-failure' | 'on-first-retry'
```

**Recommended for CI:**
```typescript
screenshot: 'only-on-failure',  // captures the failure state
video:      'retain-on-failure', // records all, deletes passing-test recordings
trace:      'on-first-retry',    // records trace only when a test is retried
```

The trace is the most valuable debugging tool. It records every action,
network call, console log, and browser screenshot — all replayable with
`npx playwright show-trace trace.zip`. The `on-first-retry` setting means
traces are captured exactly when you need them: when a test fails on the
first run and Playwright attempts a retry.

`retain-on-failure` for video records everything but discards video for
tests that pass — conserving storage while ensuring you have evidence for
every failure.

**For local development (faster runs, less disk):**
```typescript
screenshot: 'only-on-failure',
video:      'off',
trace:      'off',
```

---

## Q311.8 — How do you configure multiple reporters?

Multiple reporters run simultaneously — each generates its own output
independently:

```typescript
reporter: [
  ['html',  { outputFolder: 'playwright-report', open: 'on-failure' }],
  ['junit', { outputFile: 'results/junit.xml' }],
  ['list'],
],
```

Common reporters:

| Reporter | Output | Use for |
|---|---|---|
| `html` | `playwright-report/index.html` | Always — richest debugging tool |
| `list` | Terminal — test names as they run | Local development |
| `dot` | Terminal — one dot per test | CI — compact output |
| `junit` | JUnit XML | Jenkins, Azure DevOps, GitLab |
| `json` | JSON file | Custom dashboards |
| `github` | GitHub Actions annotations | GitHub Actions CI |

**Different reporters for CI vs local:**
```typescript
reporter: process.env.CI
  ? [['github'], ['junit', { outputFile: 'results/junit.xml' }], ['html', { open: 'never' }]]
  : [['html', { open: 'on-failure' }], ['list']],
```

Locally: HTML report opens automatically on failure and `list` gives live
feedback. On CI: `github` annotates PRs, `junit` feeds CI dashboards, HTML
is generated but never auto-opened.

---

## Q311.9 — How do projects work in playwright.config.ts?

Projects are named configurations within a single config file. Each project
runs all matching tests with its own settings:

```typescript
projects: [
  {
    name: 'setup',
    testMatch: '**/auth.setup.ts',
    // no use — runs with global defaults
  },
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
    dependencies: ['setup'],
    grep: /@smoke|@regression/,
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
    dependencies: ['setup'],
    grep: /@smoke/, // smoke only on Firefox
  },
  {
    name: 'mobile-chrome',
    use: { ...devices['Pixel 5'] },
    dependencies: ['setup'],
    grep: /@smoke/,
  },
],
```

Projects can differ in:
- Browser and device (`use: { ...devices['Desktop Chrome'] }`)
- Auth state (`use: { storageState: '.auth/admin.json' }`)
- Tag filters (`grep: /@smoke/`)
- Test file matching (`testMatch`)
- Dependencies on other projects

Running a specific project:
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test   # runs all projects
```

---

## Q311.10 — How do you switch environments without editing any files?

Use environment variables with defaults:

```typescript
// playwright.config.ts
use: {
  baseURL: process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',
},
workers:    process.env.CI ? 2 : 4,
retries:    process.env.CI ? 2 : 0,
forbidOnly: !!process.env.CI,
reporter: process.env.CI
  ? [['github'], ['junit', { outputFile: 'results/junit.xml' }]]
  : [['html', { open: 'on-failure' }], ['list']],
```

```bash
# Default environment
npx playwright test

# Staging
BASE_URL=https://staging.example.com npx playwright test

# Local dev server
BASE_URL=http://localhost:4200 npx playwright test

# CI (CI env var is set automatically by most CI platforms)
CI=true BASE_URL=https://prod.example.com npx playwright test
```

No config file edits. No test file edits. One variable, one command per environment.

---

## Q311.11 — What is outputDir and what goes into it?

`outputDir` (default: `test-results`) is where Playwright stores all test
artefacts — screenshots, videos, traces, and any files tests write via
`test.info().outputPath()`.

Each test gets its own subdirectory named after the test:

```
test-results/
  auth-login-valid-credentials-chromium/
    test-failed-1.png         ← failure screenshot
    video.webm                ← recording
    trace.zip                 ← trace file
  pim-add-employee-saves-chromium/
    ...
```

The subdirectory naming is deterministic — the same test always maps to the
same path — so artefacts from previous runs are cleanly overwritten.

Add to `.gitignore`:
```
test-results/
playwright-report/
.auth/
```

These directories are regenerated on every run. Committing them creates
noise and bloats repository history.

---

## Q311.12 — How do you use multiple config files?

For significantly different execution profiles, maintain separate config files
and select them with `--config`:

```bash
# Standard test run
npx playwright test --config=playwright.config.ts

# Smoke tests only, no retries, fast feedback
npx playwright test --config=playwright.smoke.config.ts

# API tests only, no browser
npx playwright test --config=playwright.api.config.ts
```

```typescript
// playwright.smoke.config.ts
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  retries: 0,
  workers: 8,
  grep: /@smoke/,
  reporter: [['list']],
});
```

Extend the base config with overrides rather than duplicating the full
file. This keeps config DRY — smoke config only overrides what differs.

**Keep the number of config files small.** Most scenarios that seem to
require a separate config file can be handled by projects within a single
config, combined with `--grep` and `--project` flags. Multiple config files
add maintenance burden.

---

## Q311.13 — How does the devices object simplify cross-browser and device configuration?

`devices` from `@playwright/test` provides pre-configured settings for
hundreds of real browsers and devices — viewport, user agent, device scale,
and more:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'chrome',       use: { ...devices['Desktop Chrome']  } },
    { name: 'firefox',      use: { ...devices['Desktop Firefox'] } },
    { name: 'safari',       use: { ...devices['Desktop Safari']  } },
    { name: 'iphone-15',    use: { ...devices['iPhone 15']       } },
    { name: 'pixel-7',      use: { ...devices['Pixel 7']         } },
    { name: 'ipad-pro',     use: { ...devices['iPad Pro 11']     } },
  ],
});
```

Each `devices` entry expands to a `use` object:
```typescript
// What devices['Desktop Chrome'] expands to:
{
  browserName: 'chromium',
  viewport:    { width: 1280, height: 720 },
  userAgent:   'Mozilla/5.0 ... Chrome/...',
  deviceScaleFactor: 1,
  isMobile:    false,
  hasTouch:    false,
}
```

The `...devices['Desktop Chrome']` spread merges these defaults with any
project-specific overrides you add after it:

```typescript
{
  name: 'chrome-staging',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'https://staging.example.com',    // override only this
    storageState: '.auth/staging-admin.json',  // and this
  },
},
```

---

## Q311.14 — How does storageState in the config differ from storageState in a project?

`storageState` can be set at two levels:

**Global `use` block** — applies to every test in every project:
```typescript
use: {
  storageState: '.auth/admin.json', // all tests start as admin
},
```

**Project-level `use` block** — applies only to tests in that project,
overriding the global setting:
```typescript
projects: [
  {
    name: 'admin-tests',
    use: { storageState: '.auth/admin.json' },   // admin session
  },
  {
    name: 'employee-tests',
    use: { storageState: '.auth/employee.json' }, // employee session
  },
  {
    name: 'auth',
    testMatch: '**/auth.setup.ts',
    // no storageState — runs unauthenticated to perform the login
  },
],
```

The setup project must NOT have `storageState` — it needs to log in from
scratch. The test projects load the saved state produced by the setup project.

---

## Q311.15 — What is the difference between timeout and expect.timeout?

Both are timeouts — but they govern very different things:

**`timeout`** — the maximum duration of an entire test, measured from when
it starts to when it finishes (including `beforeEach` and `afterEach`):

```typescript
timeout: 30_000, // the whole test must finish in 30 seconds
```

If a test exceeds this, Playwright marks it `timedOut` and stops it.

**`expect.timeout`** — the maximum time a **single assertion** will retry
waiting for its condition to become true:

```typescript
expect: { timeout: 5_000 }, // each assertion retries for up to 5 seconds
```

Playwright's `expect()` assertions are asynchronous and retrying. When you
write `await expect(locator).toBeVisible()`, Playwright polls the DOM
repeatedly until the element is visible or the `expect.timeout` expires.
This is what makes Playwright assertions resilient to timing without
explicit waits.

**Override per assertion:**
```typescript
await expect(page.getByText('Loading...')).toBeHidden({ timeout: 15_000 });
// waits up to 15s for the loading spinner to disappear
```

A common mistake: setting `expect.timeout` too low causes flaky assertion
failures on slow renders. Setting it too high masks performance regressions.
Five seconds is a sensible default for most web applications.

---

## Q311.16 — How do you configure grep and grepInvert at the config level?

`grep` and `grepInvert` at the config level set default tag filters for the
entire suite. Individual projects can have their own filters:

```typescript
// Global default — run smoke and regression, never wip
grep:       /@smoke|@regression/,
grepInvert: /@wip/,
```

```typescript
// Project-level — different filters per project
projects: [
  {
    name: 'smoke-check',
    grep:  /@smoke/,
    use:   { ...devices['Desktop Chrome'] },
  },
  {
    name: 'nightly',
    grep:  /@smoke|@regression|@e2e/,
    use:   { ...devices['Desktop Chrome'] },
  },
  {
    name: 'cross-browser',
    grep:  /@smoke/,   // smoke only on non-Chrome browsers
    use:   { ...devices['Desktop Firefox'] },
  },
],
```

CLI `--grep` overrides the config `grep`:
```bash
npx playwright test --grep @e2e  # runs @e2e regardless of config grep
```

This lets you define sensible defaults in the config (avoid running slow
`@e2e` tests on every run) while still allowing explicit overrides.

---

## Q311.17 — What is a complete, production-ready config for an OrangeHRM project?

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({

  // ── Test discovery ─────────────────────────────────────────────────────
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/fixtures/**', '**/pages/**', '**/utils/**'],

  // ── Execution ──────────────────────────────────────────────────────────
  fullyParallel: true,
  workers:    process.env.CI ? 2 : 4,
  retries:    process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,

  // ── Timeouts ───────────────────────────────────────────────────────────
  timeout: 30_000,
  expect:  { timeout: 5_000 },

  // ── Global setup ───────────────────────────────────────────────────────
  globalSetup:    './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  // ── Reporters ──────────────────────────────────────────────────────────
  reporter: process.env.CI
    ? [['github'], ['junit', { outputFile: 'results/junit.xml' }], ['html', { open: 'never' }]]
    : [['html', { open: 'on-failure' }], ['list']],

  // ── Output ─────────────────────────────────────────────────────────────
  outputDir: 'test-results',

  // ── Shared browser settings ────────────────────────────────────────────
  use: {
    baseURL:           process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',
    headless:          true,
    viewport:          { width: 1280, height: 720 },
    locale:            'en-US',
    timezoneId:        'Asia/Kolkata',
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    trace:             'on-first-retry',
    actionTimeout:     10_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: true,
  },

  // ── Projects ───────────────────────────────────────────────────────────
  projects: [
    // Auth setup — runs first, not a browser test project
    { name: 'auth', testMatch: '**/auth.setup.ts' },

    // Main test projects — depend on auth
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      dependencies: ['auth'],
      grep: /@smoke|@regression/,
    },
    {
      name: 'firefox',
      use:  { ...devices['Desktop Firefox'], storageState: '.auth/admin.json' },
      dependencies: ['auth'],
      grep: /@smoke/, // smoke only on Firefox
    },
    {
      name: 'mobile-chrome',
      use:  { ...devices['Pixel 5'], storageState: '.auth/admin.json' },
      dependencies: ['auth'],
      grep: /@smoke/,
    },
  ],

});
```

---

## Q311.18 — What config mistakes do you see most often in real projects?

**Mistake 1 — Hardcoded URLs in test files:**
```typescript
// ❌ Every engineer hardcodes their environment
await page.goto('http://localhost:4200/login');
```
Fix: set `baseURL` in the config and use relative paths everywhere.

**Mistake 2 — No retries on CI, or retries everywhere:**
```typescript
// ❌ No retries on CI — every flaky test fails the build
retries: 0

// ❌ Retries everywhere — hides real failures
retries: 3
```
Fix: `retries: process.env.CI ? 2 : 0`. Absorb CI flakiness, fail fast locally.

**Mistake 3 — Missing forbidOnly:**
Someone commits `test.only` during debugging. CI runs only that one test.
Everyone thinks the suite passed. A regression ships.
Fix: `forbidOnly: !!process.env.CI`.

**Mistake 4 — Same timeout for every scenario:**
```typescript
timeout: 120_000 // 2 minutes for every test — masks slow tests permanently
```
Fix: set a reasonable default (30s), use `test.slow()` for known slow tests,
and treat test timeout violations as performance feedback.

**Mistake 5 — Trace and video always on:**
```typescript
trace: 'on',   // every test records a trace — slows the suite, fills disk
video: 'on',   // every test records video — same problem
```
Fix: `trace: 'on-first-retry'` and `video: 'retain-on-failure'`.

**Mistake 6 — No baseURL, causing environment lock-in:**
Engineers run tests against one hardcoded environment. Staging tests are
manual. No single command can target a different environment.
Fix: `baseURL: process.env.BASE_URL ?? 'https://default.example.com'`.

---

## Chapter Summary

- `playwright.config.ts` is the single source of truth for all suite behaviour — one place, all settings.
- `testDir`, `testMatch`, `testIgnore` control which files are tests and which are helpers.
- `fullyParallel: true` enables test-level parallelism within files — use when tests are fully independent.
- `workers: process.env.CI ? 2 : 4` — fewer workers on shared CI, more locally.
- `retries: process.env.CI ? 2 : 0` — tolerate CI flakiness; fail fast locally.
- `forbidOnly: !!process.env.CI` — blocks committed `test.only` from silently disabling the suite.
- Four timeouts: test (`timeout`), assertion (`expect.timeout`), action (`actionTimeout`), navigation (`navigationTimeout`).
- `baseURL` in `use` — the most important setting. Relative paths in tests; switch environments with one variable.
- `screenshot`, `video`, `trace` — evidence collection. CI best practice: `only-on-failure`, `retain-on-failure`, `on-first-retry`.
- Multiple reporters run simultaneously — `html` for debugging, `junit` for CI tools, `github` for PR annotations.
- Projects define named subsets with their own `use` settings, `grep` filters, `dependencies`, and `testMatch`.
- `grep` / `grepInvert` at config and project level set default tag filters — overridable from CLI.
- Switch environments with `BASE_URL=https://staging.example.com npx playwright test` — no file edits.
- `--config` flag selects a different config file for significantly different profiles.
- Common mistakes: hardcoded URLs, no `forbidOnly`, wrong retries, trace always on, no `baseURL`.
