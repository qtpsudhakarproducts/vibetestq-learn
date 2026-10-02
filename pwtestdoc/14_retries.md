# 14 — Retries

## The Scenario

It is Monday morning. You open the CI dashboard and see a failed test from Friday night's run — "employee search returns results." You click through, look at the screenshot, read the error: timeout waiting for the results table to be visible.

You run the test locally. It passes. You run it again. Passes. You run it 10 times. Passes every time.

You re-trigger the CI pipeline. The test passes.

This is a flaky test. It is not actually broken. The application is fine. The test logic is correct. But something — a slow server response, a network hiccup, a brief animation delay — caused the test to fail on that one run. Now your team has lost confidence in the suite. Engineers ignore red CI because "it is probably just a flaky test." Real failures get missed.

Retries are Playwright's mechanism for handling this reality.

---

## What Retries Are

When a test fails and retries are configured, Playwright runs the test again — automatically, without any manual intervention. If the test passes on the retry, Playwright marks it as a **flaky test** in the report (passed on retry N) rather than a failure. If it fails on every retry, it is marked as a **failed test**.

Retries do not fix flaky tests. They absorb them — preventing occasional environmental failures from breaking CI while giving you the data to identify and fix the underlying issue.

---

## Configuring Retries

### In playwright.config.ts

```typescript
export default defineConfig({
  retries: 2,  // retry failed tests up to 2 times before marking them failed
});
```

The most common real-world pattern:

```typescript
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
});
```

**Why 0 locally and 2 on CI:**

Locally, you want immediate feedback. If a test fails, you want to know now — not after waiting for two retries. You also know your local environment is stable, so flakiness is less likely to be environmental.

On CI, the environment is shared, network conditions vary, and containers start cold. Occasional timing failures that never happen locally are more common on CI. Two retries absorbs most genuine environmental flakiness without hiding real failures.

### From the CLI

```bash
# Override retries for a single run
npx playwright test --retries=3

# Disable retries even if config has them
npx playwright test --retries=0
```

### Per Test Override

```typescript
// This specific test gets 3 retries regardless of the global setting
test(
  'email notification is delivered',
  { retries: 3 },
  async ({ page }) => {
    // Email delivery can take variable time — deserves more retries
    await page.goto('/notifications');
    await expect(page.getByText('Welcome email sent')).toBeVisible({ timeout: 30_000 });
  }
);
```

### Per Group Override

```typescript
test.describe('Leave Module', () => {
  test.describe.configure({ retries: 1 });
  // All tests in this describe get 1 retry, regardless of global setting

  test('apply leave @smoke', ...)
  test('approve leave @regression', ...)
});
```

---

## What Happens During a Retry

When a test fails and is about to be retried, Playwright:

1. Closes the current browser context and page
2. Creates a fresh browser context (loading `storageState` again if configured)
3. Runs the entire test from the beginning — including `beforeEach` hooks
4. Reports the retry attempt with `retry: N` in the test info

The retry is a completely fresh start. The browser state from the failed run is gone. This is important — it means retries are not a continuation of the failed run. They are a clean re-run.

```typescript
test.beforeEach(async ({ page }) => {
  // This runs before every attempt — first run AND every retry
  await page.goto('/web/index.php/pim/viewEmployeeList');
});

test('employee search returns results @smoke', async ({ page }) => {
  // If this fails and is retried, beforeEach runs again first
  // The page is fresh — no leftover state from the failed attempt
  await page.getByPlaceholder('Type for hints...').fill('Linda');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText('Linda Anderson')).toBeVisible();
});
```

---

## test.info().retry — Knowing Which Attempt You Are On

`test.info().retry` tells you how many times the test has already failed and been retried. On the first run it is `0`. On the first retry it is `1`. On the second retry it is `2`.

### Adjusting Behaviour on Retry

Sometimes a test fails because of lingering state from a previous test run — cached data, a leftover cookie, a UI state that did not reset properly. On a retry you want to clear that state before trying again:

```typescript
test('employee list loads correctly @smoke', async ({ page, context }) => {
  const retry = test.info().retry;

  if (retry > 0) {
    // Previous attempt failed — clear everything and start clean
    console.log(`Retry ${retry}: clearing context state before re-attempting`);
    await context.clearCookies();
    await context.clearPermissions();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  await page.goto('/web/index.php/pim/viewEmployeeList');
  await expect(page.getByRole('heading', { name: 'Employee List' })).toBeVisible();
  await expect(page.getByRole('row')).toHaveCountGreaterThan(1);
});
```

### Taking a Screenshot Before Retrying

The most valuable diagnostic pattern — capture a screenshot on failure before the retry clears the state:

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();

  // Status is 'failed' on a failed attempt, even if a retry is about to happen
  if (info.status === 'failed') {
    const attemptLabel = info.retry === 0 ? 'first-attempt' : `retry-${info.retry}`;

    await info.attach(`failure-screenshot-${attemptLabel}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    await info.attach(`failure-url-${attemptLabel}`, {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });
  }
});
```

When a test eventually fails after all retries, the HTML report shows a screenshot from each failed attempt. You can see how the failure evolved across attempts — was it always the same error, or did different things fail each time?

---

## How Retries Appear in the Report

### HTML Report

The HTML report shows a clear breakdown per test:

**Test that passes on retry (flaky):**
```
⚠️ employee search returns results    flaky
   Attempt 1: failed (timeout 30000ms)
     [screenshot attached]
   Attempt 2: passed (1.8s)
```

**Test that fails all retries:**
```
❌ employee search returns results    failed
   Attempt 1: failed (timeout 30000ms)
     [screenshot attached]
   Attempt 2: failed (timeout 30000ms)
     [screenshot attached]
   Attempt 3: failed (network error)
     [screenshot attached]
```

**Test that passes first time:**
```
✅ valid credentials redirect to dashboard    passed (1.2s)
```

The flaky distinction is important. It tells you: the test is not reliably broken, but it is not reliably passing either. Flaky tests are a category of their own — they need investigation and fixing, but they are not the same as genuinely failing tests.

### Terminal Output

```
  ✅ Login › valid credentials redirect to dashboard (1.2s)
  ✅ Employee List › shows employees by default (0.9s)
  ⚠️ Employee List › search returns results (2.1s) — passed on retry 1
  ❌ Leave Module › apply leave with past date (30.0s) — still failing after 2 retries
```

---

## trace: 'on-first-retry' — Capturing Traces for Debugging

The `trace` config option has a special value designed specifically for retries:

```typescript
use: {
  trace: 'on-first-retry',
},
```

With this setting:
- **First run (no retry yet):** No trace recorded — no overhead for passing tests
- **First retry:** Trace is recorded — you are investigating a failure
- **Subsequent retries:** No trace (already have one from first retry)

The trace records every action, screenshot, DOM state, and network call during the test. When you open it with `npx playwright show-trace trace.zip`, you can replay the test step by step and see exactly what the browser was showing at each moment.

This is the combination you want in CI:

```typescript
use: {
  screenshot: 'only-on-failure',  // screenshot from the failed moment
  trace: 'on-first-retry',        // full trace on first retry — deep debugging
  video: 'retain-on-failure',     // video for the final failed attempt
},
retries: process.env.CI ? 2 : 0,
```

On a flaky test that passes on retry, you get a screenshot and trace from the failed attempt. On a test that fails all retries, you get screenshots and a trace from the investigation attempt plus a video of the final failure. All in the HTML report, no manual file hunting.

---

## Retries vs Flaky Tests — The Important Distinction

Retries mask flaky tests. They prevent them from breaking CI, but they do not fix them. Over time, an unaddressed flaky test library becomes a problem:

- Suite takes longer (each flaky test runs 2–3 times instead of 1)
- CI is slower and more expensive
- Team loses confidence that failures mean real bugs
- Real failures get retried past and missed

**Retries should be temporary tolerance, not permanent accommodation.** When a test starts passing on retry, that is a signal — not a solution.

### How to Identify Flaky Tests

Look for tests that passed on retry in the HTML report. Over multiple CI runs, patterns emerge:

```
Run 1:  employee search — passed on retry 1
Run 3:  employee search — passed on retry 2
Run 5:  employee search — passed on retry 1
Run 7:  employee search — failed (all retries exhausted)
```

This test is chronically flaky. It needs investigation.

### Common Causes of Flakiness

**Missing proper waits — the most common cause:**
```typescript
// ❌ Clicks before the element is interactive
await page.getByRole('button', { name: 'Search' }).click();
await expect(page.getByRole('row')).toHaveCountGreaterThan(1);

// ✅ Waits for the network to settle before asserting
await page.getByRole('button', { name: 'Search' }).click();
await page.waitForLoadState('networkidle');
await expect(page.getByRole('row')).toHaveCountGreaterThan(1);
```

**Race condition between UI state and assertion:**
```typescript
// ❌ Asserts before the success message animation completes
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByText('Successfully Saved')).toBeVisible();

// ✅ The toBeVisible assertion already retries — but increase its timeout
// if the server response is slow
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByText('Successfully Saved')).toBeVisible({ timeout: 10_000 });
```

**Shared database state from a previous test:**
```typescript
// ❌ Test assumes a clean state but a previous test created records
await expect(page.getByRole('row')).toHaveCount(1); // fails when other tests added rows

// ✅ Search for specific data rather than assuming record counts
await employeeListPage.searchByName('Linda Anderson');
await expect(page.getByText('Linda Anderson')).toBeVisible();
```

**Animation not complete before interaction:**
```typescript
// ❌ Modal is animating open when the fill runs
await page.getByRole('dialog').getByLabel('Name').fill('Test');

// ✅ Wait for the animation to complete
await expect(page.getByRole('dialog')).toBeVisible();
await page.getByRole('dialog').getByLabel('Name').fill('Test');
```

### The Fix Cycle for Flaky Tests

1. A test passes on retry — visible in the report as "flaky"
2. Add `test.info().annotations.push({ type: 'flaky', description: 'Passes on retry — investigating' })`
3. Run the test 20+ times locally with `--repeat-each=20` to reproduce the failure
4. Identify the root cause (missing wait, race condition, shared state)
5. Fix the root cause
6. Verify with `--repeat-each=20` again — should pass consistently
7. Remove the annotation, reduce retries if appropriate

```bash
# Run one test 20 times to reproduce flakiness
npx playwright test --grep "employee search" --repeat-each=20 --workers=1
```

---

## --repeat-each — Running a Test Multiple Times

`--repeat-each` is a debugging tool — it runs each test N times in a single suite run. Use it to reproduce intermittent failures and verify fixes:

```bash
# Run each test 5 times — find intermittent failures
npx playwright test --repeat-each=5

# Run a specific test 20 times to reproduce a known flaky test
npx playwright test --grep "employee search" --repeat-each=20 --workers=1

# Run the smoke suite 3 times each to stress test stability
npx playwright test --grep @smoke --repeat-each=3
```

`--repeat-each` is different from retries:
- `retries` — only re-runs tests that **failed**
- `--repeat-each` — re-runs **every** test N times regardless of outcome

Use `--repeat-each` for investigation. Use `retries` for production CI tolerance.

---

## A Complete Retry Configuration for OrangeHRM

```typescript
// playwright.config.ts
export default defineConfig({

  // Global retry setting — 0 locally, 2 on CI
  retries: process.env.CI ? 2 : 0,

  use: {
    // Capture evidence on failure — all three work together
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',        // deep trace for the first retry investigation
    video: 'retain-on-failure',     // full video for tests that fail all retries
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: '.auth/admin.json',
      },
      // Firefox tends to be slower — give it one extra retry
      // This can be set at project level too
    },
  ],
});
```

```typescript
// In baseFixture.ts — screenshot capture on every failure attempt
export const test = base.extend<{ screenshotOnFailure: void }>({
  screenshotOnFailure: [async ({ page }, use) => {
    await use();
    const info = test.info();

    if (info.status === 'failed') {
      const label = info.retry === 0
        ? 'failure-first-attempt'
        : `failure-retry-${info.retry}`;

      await info.attach(label, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });

      // Track flakiness — passed on retry means it was flaky
      if (info.retry > 0 && info.status === 'passed') {
        info.annotations.push({
          type: 'flaky',
          description: `Passed on retry ${info.retry} — investigate root cause`,
        });
      }
    }
  }, { auto: true }],
});
```

---

## Key Points

- Retries re-run a failed test from scratch — fresh browser context, `beforeEach` runs again, clean slate
- `retries: process.env.CI ? 2 : 0` — the standard pattern; 0 locally for fast feedback, 2 on CI for environmental tolerance
- Per-test override: `{ retries: 3 }` in the details object
- Per-group override: `test.describe.configure({ retries: 1 })`
- `test.info().retry` — 0 on first run, increments on each retry; use to adjust behaviour or capture per-attempt evidence
- Flaky test in the report — "passed on retry N" — means the test is unstable, not broken
- `trace: 'on-first-retry'` — records a full trace only when a test fails and is about to be retried; the best setting for CI debugging
- Screenshots, traces, and videos are collected per attempt — HTML report shows all failed attempts with evidence
- Retries mask flakiness — they do not fix it; use them as tolerance, not as a permanent solution
- `--repeat-each=N` — runs each test N times; use to reproduce and verify fixes for flaky tests; different from retries
- Common flakiness causes: missing `waitForLoadState`, insufficient assertion timeout, shared database state, animation race conditions
- Fix cycle: identify via report → reproduce with `--repeat-each` → fix root cause → verify → reduce retries if possible
