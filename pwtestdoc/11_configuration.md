# 11 — Configuration

## The Scenario

Your team has three engineers working on the OrangeHRM test suite. One runs tests against `http://localhost:4200` — the local dev server. Another runs against `https://staging.orangehrm.example.com`. The third runs against `https://demo.orangehrmlive.com`.

Each has hardcoded the base URL differently in their test files:

```typescript
// Engineer 1
await page.goto('http://localhost:4200/web/index.php/auth/login');

// Engineer 2
await page.goto('https://staging.orangehrm.example.com/web/index.php/auth/login');

// Engineer 3
await page.goto('https://demo.orangehrmlive.com/web/index.php/auth/login');
```

Tests pass on each person's machine and fail on everyone else's. "Works on my machine" is now a daily conversation. There is no single command to run the suite against staging. There is no way to switch environments without editing test files.

This is what `playwright.config.ts` exists to solve. Every environment-specific setting lives in one file. Tests use relative paths and configuration values. Switching environments means changing one line in the config — or passing one environment variable on the CLI.

---

## What playwright.config.ts Is

`playwright.config.ts` is the single source of truth for your entire test suite's behaviour. It controls:

- Where tests are located and how they are matched
- Which browsers run and with what settings
- Base URL, viewport, locale, timeouts
- How many workers run in parallel
- How many times to retry failed tests
- Which reporters generate output
- What setup and teardown runs globally
- What projects exist and how they differ

Every setting in the config applies to all tests by default. Projects can override settings for specific subsets of tests. Individual tests can override settings for themselves (via `test.use()` or the details object).

---

## The Config File Structure

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({

  // ── Test discovery ───────────────────────────────────────────────────
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  testIgnore: '**/*.helper.ts',

  // ── Execution ────────────────────────────────────────────────────────
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,

  // ── Timeouts ─────────────────────────────────────────────────────────
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },

  // ── Shared browser settings ───────────────────────────────────────────
  use: {
    baseURL: process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    locale: 'en-US',
    timezoneId: 'Asia/Kolkata',
  },

  // ── Global setup ─────────────────────────────────────────────────────
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  // ── Reporters ────────────────────────────────────────────────────────
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'on-failure' }],
    ['junit', { outputFile: 'results/junit.xml' }],
    ['list'],
  ],

  // ── Output ───────────────────────────────────────────────────────────
  outputDir: 'test-results',
  snapshotDir: 'snapshots',

  // ── Projects ─────────────────────────────────────────────────────────
  projects: [
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
  ],

});
```

This is a complete, production-ready config. Each section is explained in detail below.

---

## Test Discovery

### testDir

The root directory where Playwright looks for test files. All test paths are resolved relative to this directory.

```typescript
testDir: './tests',
```

With this setting, Playwright searches `./tests` and all subdirectories for files matching `testMatch`.

### testMatch

A glob pattern (or array of patterns) that determines which files are test files. Default is `**/*.{spec,test}.{ts,js}`.

```typescript
testMatch: '**/*.spec.ts',        // only TypeScript spec files
testMatch: ['**/*.spec.ts', '**/*.test.ts'],  // both spec and test files
```

### testIgnore

Files or patterns to exclude from test discovery. Useful for helper files that live alongside spec files but are not tests themselves.

```typescript
testIgnore: [
  '**/*.helper.ts',
  '**/utils/**',
  '**/fixtures/**',
],
```

### Filename Convention

The default Playwright convention is `*.spec.ts`. Some teams use `*.test.ts`. Pick one and be consistent. Mixing both is valid but requires a `testMatch` array and adds confusion.

For OrangeHRM:
```
tests/
  auth/
    login.spec.ts
    logout.spec.ts
  pim/
    add-employee.spec.ts
    employee-list.spec.ts
  leave/
    apply-leave.spec.ts
  setup/
    auth.setup.ts        ← not matched by *.spec.ts
```

The setup file uses `.setup.ts` intentionally so it is only picked up by the setup project's `testMatch: '**/auth.setup.ts'` and not by the main test projects.

---

## Execution Settings

### fullyParallel

Controls whether tests within a file run in parallel (not just across files).

```typescript
fullyParallel: false,  // Default — tests within a file run sequentially
fullyParallel: true,   // Tests within a file also run in parallel
```

By default, Playwright parallelises at the file level — different files run on different workers simultaneously, but tests within a single file run one after another on the same worker.

`fullyParallel: true` goes further — individual tests from the same file can be distributed across different workers and run concurrently.

**When to use `fullyParallel: true`:** When your tests are fully independent (no shared state, no shared files, no reliance on execution order). This is the fastest mode. Most well-designed suites should use it.

**When to leave it `false`:** When tests within a file share mutable state through `let` variables, or when some files use `describe.serial`.

### workers

How many parallel worker processes to use. More workers = faster suite execution, but also more CPU and memory.

```typescript
workers: 4,                         // always use 4 workers
workers: process.env.CI ? 2 : 4,   // 2 on CI (limited resources), 4 locally
workers: '50%',                     // use 50% of available CPU cores
```

The right number depends on:
- Your machine's CPU count (more CPUs → more workers)
- Your application's capacity (more workers → more concurrent browser sessions hitting the server)
- Your test suite's independence (all tests independent → more workers helps; shared state → more workers hurts)

A safe default: `workers: process.env.CI ? 2 : 4`. This is conservative on CI (where machines are shared) and faster locally.

### retries

How many times to retry a failed test before marking it as failed in the report.

```typescript
retries: 0,                         // no retries — fast feedback, no tolerance for flakiness
retries: process.env.CI ? 2 : 0,   // retries only on CI — not locally
```

Retries exist for dealing with flaky tests — tests that occasionally fail due to timing issues, network variability, or environmental instability. They are a safety net, not a solution. If a test consistently needs retries, the underlying cause needs fixing.

**The CI pattern `retries: process.env.CI ? 2 : 0`:**
- Locally: 0 retries. You see failures immediately and fix them.
- On CI: 2 retries. Network conditions and shared resources make occasional flakiness more likely. 2 retries absorb that without hiding real failures.

### forbidOnly

Prevents tests marked with `test.only` or `describe.only` from accidentally being committed and running in CI.

```typescript
forbidOnly: !!process.env.CI,
```

When `forbidOnly` is `true`, if any test has `.only`, Playwright fails the entire run immediately with:
```
Error: focused item found in the --forbid-only mode
```

This protects against the scenario where someone commits `test.only` during debugging and inadvertently disables the entire test suite in CI.

---

## Timeouts

Timeouts are one of the most common sources of confusion in Playwright because there are multiple independent timeouts that interact. Understanding each one and where to set it is important.

### Test Timeout

The maximum time a single test can take — from the moment it starts (including `beforeEach`) to when it ends (including `afterEach`). If the test exceeds this, it is marked as `timedOut`.

```typescript
timeout: 30_000,  // 30 seconds per test
```

```typescript
// Override per test
test('slow workflow', { timeout: 60_000 }, async ({ page }) => { ... });

// Or using test.slow() — multiplies by 3
test('slow workflow', async ({ page }) => {
  test.slow();
  // timeout is now 90s if global is 30s
});
```

### Expect Timeout

The maximum time an `expect()` assertion will wait for the condition to become true. Playwright assertions are retrying by default — they keep checking until the condition is met or the timeout is reached.

```typescript
expect: {
  timeout: 5_000,  // wait up to 5 seconds for assertions to pass
},
```

```typescript
// Override per assertion
await expect(page.getByText('Success')).toBeVisible({ timeout: 10_000 });
```

### Action Timeout

The maximum time a single action (click, fill, hover, etc.) can take. If Playwright cannot find and interact with the element within this time, the action fails.

```typescript
use: {
  actionTimeout: 10_000,  // 10 seconds per action
},
```

### Navigation Timeout

The maximum time a navigation (`page.goto()`, `page.waitForURL()`) can take.

```typescript
use: {
  navigationTimeout: 30_000,  // 30 seconds for page navigations
},
```

### The Timeout Hierarchy

```
Test timeout (30s)
  └── contains all of:
      ├── beforeEach hook
      ├── beforeAll hook (for the first test in a group)
      ├── Test body
      │     ├── Action timeout (10s per action)
      │     └── Expect timeout (5s per assertion)
      └── afterEach hook
```

If an action takes longer than `actionTimeout`, it throws. That error propagates to the test, which may then hit `timeout` if it cannot recover. The test-level `timeout` is the outer boundary.

A common mistake is setting a very high test `timeout` and ignoring `actionTimeout`. The result is tests that hang for 30 seconds before failing when they could fail in 10. Set `actionTimeout` to the shortest reasonable value for your application.

---

## Shared Use Settings

The `use` block defines settings that apply to all tests across all projects. Individual projects can override these settings for their subset of tests.

```typescript
use: {
  // ── Environment ─────────────────────────────────────────────────
  baseURL: process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',

  // ── Browser behaviour ────────────────────────────────────────────
  headless: true,
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  timezoneId: 'Asia/Kolkata',
  geolocation: { longitude: 78.4867, latitude: 17.3850 }, // Hyderabad
  permissions: ['geolocation', 'notifications'],

  // ── Evidence collection ──────────────────────────────────────────
  screenshot: 'only-on-failure',   // 'on', 'off', 'only-on-failure'
  video: 'retain-on-failure',      // 'on', 'off', 'retain-on-failure', 'on-first-retry'
  trace: 'on-first-retry',         // 'on', 'off', 'retain-on-failure', 'on-first-retry'

  // ── Timeouts ─────────────────────────────────────────────────────
  actionTimeout: 10_000,
  navigationTimeout: 30_000,

  // ── Auth state ───────────────────────────────────────────────────
  storageState: '.auth/admin.json',

  // ── Network ──────────────────────────────────────────────────────
  extraHTTPHeaders: {
    'X-Test-Run-Id': process.env.CI_RUN_ID ?? 'local',
  },
  ignoreHTTPSErrors: true,  // useful for staging with self-signed certs
},
```

### baseURL — The Most Important Setting

`baseURL` is the URL prefix that `page.goto('/')` resolves against. With it set, your tests use relative paths:

```typescript
// ✅ With baseURL set to 'https://demo.orangehrmlive.com'
await page.goto('/web/index.php/auth/login');
await page.goto('/web/index.php/pim/viewEmployeeList');

// ❌ Without baseURL — hardcoded, environment-specific
await page.goto('https://demo.orangehrmlive.com/web/index.php/auth/login');
```

Switch environments by changing `baseURL` in the config — or setting `BASE_URL` environment variable:

```bash
BASE_URL=https://staging.example.com npx playwright test
BASE_URL=http://localhost:4200 npx playwright test
```

No test file changes needed.

### screenshot, video, trace — Evidence Collection

These three settings control what Playwright captures and saves alongside test results.

**screenshot:**
```typescript
screenshot: 'off',              // never take screenshots
screenshot: 'on',               // take screenshot after every test
screenshot: 'only-on-failure',  // take screenshot only when test fails
```

**video:**
```typescript
video: 'off',                   // no video recording
video: 'on',                    // record video for every test
video: 'retain-on-failure',     // record all, delete recordings for passing tests
video: 'on-first-retry',        // record only on the first retry attempt
```

**trace:**
```typescript
trace: 'off',                   // no trace
trace: 'on',                    // record trace for every test
trace: 'retain-on-failure',     // record all, delete traces for passing tests
trace: 'on-first-retry',        // record trace only on the first retry
```

**Recommended settings for most projects:**

```typescript
// Local development — fast, minimal storage
screenshot: 'only-on-failure',
video: 'off',
trace: 'off',

// CI — capture evidence for failures and flaky tests
screenshot: 'only-on-failure',
video: 'retain-on-failure',
trace: 'on-first-retry',
```

The trace is the most valuable debugging tool. It records every action, screenshot, network call, and console log — and you can replay it with `npx playwright show-trace`. The `on-first-retry` setting means traces are only recorded when a test fails on first run and is being retried — exactly when you need them most.

---

## Reporters

Reporters determine what output Playwright generates after the test run.

```typescript
reporter: [
  ['html', { outputFolder: 'playwright-report', open: 'on-failure' }],
  ['junit', { outputFile: 'results/junit.xml' }],
  ['list'],
],
```

Multiple reporters can run simultaneously. Each generates its own output independently.

| Reporter | Output | When to Use |
|---|---|---|
| `html` | `playwright-report/index.html` — interactive report | Always — the richest debugging tool |
| `list` | Terminal — test name and status as tests run | Local development — live feedback |
| `dot` | Terminal — one dot per test | CI — compact, minimal output |
| `junit` | JUnit XML file | CI tools (Jenkins, Azure DevOps, GitLab) |
| `json` | JSON file | Custom dashboards, external integrations |
| `github` | GitHub Actions annotations | GitHub Actions CI |
| `line` | Terminal — one line per test | Slightly more verbose than `dot` |

The `open` option on `html` controls when the report opens automatically:
```typescript
open: 'always'      // open after every run
open: 'on-failure'  // open only when tests fail
open: 'never'       // never open automatically (CI)
```

---

## Output Directories

```typescript
outputDir: 'test-results',   // screenshots, videos, traces go here
snapshotDir: 'snapshots',    // visual snapshot baselines go here
```

`outputDir` is where Playwright stores all the artefacts it captures — screenshots, videos, traces, and any files you write with `test.info().outputPath()`. Each test gets its own subdirectory:

```
test-results/
  login-valid-credentials-chromium/
    test-failed-1.png
    video.webm
    trace.zip
  employee-list-search-by-name-chromium/
    ...
```

Add both to `.gitignore`:
```
test-results/
playwright-report/
snapshots/
.auth/
```

---

## Environment-Specific Configuration

The most common pattern for managing multiple environments is environment variables combined with defaults:

```typescript
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',
  },

  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,

  reporter: process.env.CI
    ? [['github'], ['junit', { outputFile: 'results/junit.xml' }]]
    : [['html', { open: 'on-failure' }], ['list']],
});
```

Run against different environments:
```bash
# Default (demo environment)
npx playwright test

# Staging
BASE_URL=https://staging.example.com npx playwright test

# Local dev
BASE_URL=http://localhost:4200 npx playwright test

# CI (CI variable set automatically by most CI platforms)
CI=true npx playwright test
```

No config file changes needed between environments. No test file changes needed. A single command, one variable.

---

## Multiple Config Files

For very different execution scenarios, you can maintain multiple config files and pass the right one with `--config`:

```typescript
// playwright.config.ts        — standard test run
// playwright.smoke.config.ts  — smoke tests only, Chrome only, no retries
// playwright.api.config.ts    — API tests only, no browser
```

```bash
npx playwright test                                   # standard config
npx playwright test --config=playwright.smoke.config.ts  # smoke config
npx playwright test --config=playwright.api.config.ts    # API config
```

Keep the number of config files small. More config files means more maintenance. Projects within a single config file can achieve most of the same goals with less overhead.

---

## Key Points

- `playwright.config.ts` is the single source of truth for all test suite behaviour — one place to change settings
- `testDir` — where test files live; `testMatch` — which files are tests; `testIgnore` — which to exclude
- `fullyParallel: true` — tests within a file also run in parallel; use when all tests are independent
- `workers` — number of parallel processes; `process.env.CI ? 2 : 4` is a safe default
- `retries` — retry failed tests; `process.env.CI ? 2 : 0` tolerates CI flakiness without hiding local failures
- `forbidOnly: !!process.env.CI` — blocks commits of `test.only` from silently disabling the suite
- Four timeout types: test (`timeout`), assertion (`expect.timeout`), action (`actionTimeout`), navigation (`navigationTimeout`)
- `baseURL` — set once in config, use relative paths in all tests; switch environments with one env variable
- `screenshot`, `video`, `trace` — evidence collection; `only-on-failure` / `retain-on-failure` / `on-first-retry` are the right CI settings
- Multiple reporters run simultaneously — `html` for debugging, `junit` for CI tools, `list` for live terminal feedback
- `outputDir` — where all test artefacts are stored; add to `.gitignore`
- Environment-specific config via `process.env.CI` and `process.env.BASE_URL` — no file edits needed between environments
- Multiple config files via `--config` flag for significantly different execution profiles
