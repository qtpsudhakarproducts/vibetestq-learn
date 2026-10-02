# Chapter 403 — Retries — Flakiness & Recovery

This chapter covers Playwright's retry mechanism — how tests re-run on
failure, what happens during a retry, and how to use retry data for
debugging. Interviewers ask about retries to gauge reliability thinking:
a candidate who can distinguish between absorbing environmental flakiness
and masking real bugs, and who knows how to find and fix flaky tests, brings
long-term value to any test team.

---

## Q403.1 — What are retries in Playwright and what problem do they solve?

When a test fails, Playwright can automatically re-run it. If it passes on
a subsequent attempt, Playwright marks it **flaky** (not failed) in the
report. If it fails on every attempt, it is marked **failed**.

Retries solve the environmental flakiness problem. CI machines share
resources, network conditions vary, containers start cold. A test that
passes perfectly locally may occasionally fail on CI due to a slow server
response, a brief animation delay, or a network timeout — not because the
application is broken or the test is wrong.

Without retries, every such fluke breaks the CI gate. Engineers learn to
re-trigger pipelines without investigating, and the team loses confidence
that a red CI means a real bug. Real failures get ignored.

With retries configured correctly, occasional environmental failures are
absorbed. The test is marked flaky — a signal that something needs
investigation — but the CI gate is not broken by a single bad run.

**The critical distinction:** retries do not fix flaky tests. They absorb
them temporarily. A test that reliably passes on retry is a maintenance
debt that compounds over time.

---

## Q403.2 — How do you configure retries?

**In `playwright.config.ts`:**

```typescript
export default defineConfig({
  retries: 2,  // retry failed tests up to 2 times
});
```

**The standard CI pattern:**

```typescript
retries: process.env.CI ? 2 : 0,
```

Locally: 0 retries — see failures immediately, fix them immediately.
On CI: 2 retries — absorb genuine environmental noise without hiding real bugs.
A test that fails three times in a row is not an environmental blip.

**From the CLI:**

```bash
npx playwright test --retries=3   # override for this run
npx playwright test --retries=0   # disable retries even if config has them
```

**Per-test override:**

```typescript
test(
  'email notification is delivered',
  { retries: 3 },
  async ({ page }) => {
    // Email delivery has variable timing — deserves extra retries
    await expect(page.getByText('Welcome email sent')).toBeVisible({ timeout: 30_000 });
  }
);
```

**Per-group override:**

```typescript
test.describe('Leave Module', () => {
  test.describe.configure({ retries: 1 });
  // All tests in this describe get 1 retry regardless of global setting
});
```

---

## Q403.3 — What exactly happens when a test is retried?

A retry is a complete fresh start — not a continuation of the failed run:

1. The current browser context and page are closed
2. A fresh browser context is created (loading `storageState` again if configured)
3. All `beforeEach` hooks run again from the beginning
4. The entire test body runs from the start
5. `test.info().retry` increments to reflect the attempt number

```typescript
test.beforeEach(async ({ page }) => {
  // Runs before EVERY attempt — first run AND every retry
  await page.goto('/web/index.php/pim/viewEmployeeList');
});

test('employee search returns results @smoke', async ({ page }) => {
  // If this fails and retries:
  // beforeEach runs again → fresh page → navigate again → test body re-runs
  await page.getByPlaceholder('Type for hints...').fill('Linda');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText('Linda Anderson')).toBeVisible();
});
```

The clean restart means any UI state from the failed run is gone. This is
why retries work for environmental failures — the second attempt starts from
a clean slate.

---

## Q403.4 — What is test.info().retry and how do you use it?

`test.info().retry` tells you which attempt the test is currently on:
- `0` — first run (not a retry)
- `1` — first retry
- `2` — second retry

**Use it to adapt behaviour on retry:**

```typescript
test('employee list loads correctly @smoke', async ({ page, context }) => {
  if (test.info().retry > 0) {
    // Previous attempt failed — clear any lingering state before trying again
    console.log(`Retry ${test.info().retry}: clearing context state`);
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  await page.goto('/web/index.php/pim/viewEmployeeList');
  await expect(page.getByRole('heading', { name: 'Employee List' })).toBeVisible();
});
```

**Use it to label per-attempt evidence:**

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();

  if (info.status === 'failed') {
    const label = info.retry === 0
      ? 'failure-first-attempt'
      : `failure-retry-${info.retry}`;

    await info.attach(label, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  }
});
```

The HTML report then shows a labelled screenshot for each failed attempt.
When a test fails after all retries, you can compare screenshots across
attempts to see whether the failure was consistent or changed between runs.

---

## Q403.5 — How do retries appear in the HTML report and terminal?

**HTML Report — test that passes on retry (flaky):**

```
⚠️  employee search returns results    flaky
    Attempt 1: failed (timeout 30000ms)
      [screenshot attached]
    Attempt 2: passed (1.8s)
```

**HTML Report — test that fails all retries:**

```
❌  employee search returns results    failed
    Attempt 1: failed (timeout 30000ms)
      [screenshot attached]
    Attempt 2: failed (timeout 30000ms)
      [screenshot attached]
    Attempt 3: failed (network error)
      [screenshot attached]
```

**Terminal:**

```
✅  Login › valid credentials redirect to dashboard (1.2s)
⚠️  Employee List › search returns results (2.1s) — passed on retry 1
❌  Leave Module › apply leave with past date (30.0s) — failed after 2 retries
```

The flaky distinction matters. A test marked "passed on retry" is a warning,
not a pass. It tells you: this test is unstable. Track it. Fix it.

---

## Q403.6 — How does trace: 'on-first-retry' work with retries?

`trace: 'on-first-retry'` is the optimal CI setting for trace capture. It
records a full Playwright trace only when a test fails on the first run and
is about to be retried:

```typescript
use: {
  screenshot: 'only-on-failure',  // screenshot from each failed moment
  trace:      'on-first-retry',   // full trace recorded on the first retry
  video:      'retain-on-failure', // full video for tests that fail all retries
},
retries: process.env.CI ? 2 : 0,
```

The logic:
- **First run (no retry yet):** No trace recorded — zero overhead for passing tests
- **First retry (failure confirmed):** Trace IS recorded — you are now investigating
- **Second retry:** No trace (already have one from the first retry)

The trace records every action, screenshot, DOM snapshot, network call, and
console log during the test. Replay it with:

```bash
npx playwright show-trace test-results/some-test-chromium/trace.zip
```

You can scrub through the test timeline, see exactly what the browser was
displaying at each moment, and identify exactly where things went wrong.

**Why not `trace: 'on'`?** Recording a trace for every test — including
the 99% that pass — adds significant overhead: larger files, slower runs,
more disk. `on-first-retry` gives you the trace exactly when you need it:
when something is failing and you want to understand why.

---

## Q403.7 — What is the difference between retries and --repeat-each?

Both cause a test to run multiple times. They serve completely different purposes:

| | `retries` | `--repeat-each` |
|---|---|---|
| When it runs again | Only when the test **failed** | Every test **always** |
| Purpose | Absorb environmental failures in CI | Reproduce intermittent failures / verify fixes |
| Typical use | Production CI config | Local debugging |
| Count | Re-runs failed test up to N more times | Runs every test exactly N times |

```bash
# retries: absorb CI flakiness
# Configured in playwright.config.ts

# --repeat-each: reproduce a known flaky test locally
npx playwright test --grep "employee search" --repeat-each=20 --workers=1

# --repeat-each: verify a fix is stable
npx playwright test --grep "employee search" --repeat-each=50 --workers=1
```

If `--repeat-each=20` shows the test fails on 3 out of 20 runs, the test is
genuinely flaky with about 15% failure rate. With `retries=2`, it would
still eventually pass on most CI runs — but it is producing noise that
needs fixing.

---

## Q403.8 — What are the most common causes of flaky tests?

**1. Missing proper waits — the most common cause:**

```typescript
// ❌ Asserts before the search results load
await page.getByRole('button', { name: 'Search' }).click();
await expect(page.getByRole('row')).toHaveCountGreaterThan(1);

// ✅ Wait for network to settle before asserting
await page.getByRole('button', { name: 'Search' }).click();
await page.waitForLoadState('networkidle');
await expect(page.getByRole('row')).toHaveCountGreaterThan(1);
```

**2. Assertion timeout too low for the application's actual response time:**

```typescript
// ❌ 5s might not be enough for a slow server
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByText('Successfully Saved')).toBeVisible();

// ✅ Increase the timeout for this specific assertion
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByText('Successfully Saved')).toBeVisible({ timeout: 10_000 });
```

**3. Shared database state — tests interfering with each other in parallel:**

```typescript
// ❌ Asserts an exact count — breaks when other tests add records concurrently
await expect(page.getByRole('row')).toHaveCount(5);

// ✅ Assert specific known data instead of counts
await employeeListPage.searchByName('Linda Anderson');
await expect(page.getByText('Linda Anderson')).toBeVisible();
```

**4. Animation not complete before interaction:**

```typescript
// ❌ Modal is still animating open when fill runs
await page.getByRole('dialog').getByLabel('Name').fill('Test');

// ✅ Wait for animation to complete first
await expect(page.getByRole('dialog')).toBeVisible();
await page.getByRole('dialog').getByLabel('Name').fill('Test');
```

**5. Hard waits masking underlying timing issues:**

```typescript
// ❌ Arbitrary sleep — works sometimes, fails sometimes
await page.waitForTimeout(2000);

// ✅ Wait for the specific condition you need
await expect(page.getByText('Data loaded')).toBeVisible();
```

---

## Q403.9 — What is the fix cycle for a flaky test?

A systematic approach prevents flaky tests from accumulating:

**Step 1 — Identify the flaky test:**
Look for "passed on retry" results in the HTML report across multiple CI runs.
A test that shows this pattern repeatedly is chronically flaky.

**Step 2 — Annotate it:**
```typescript
test(
  'employee search returns results',
  { annotation: { type: 'flaky', description: 'Passes on retry — investigating timing issue' } },
  async ({ page }) => { ... }
);
```

**Step 3 — Reproduce locally with --repeat-each:**
```bash
npx playwright test --grep "employee search" --repeat-each=20 --workers=1
```
If it fails once in 20 runs, it is flaky with ~5% failure rate. If it passes
all 20, the environment itself (CI's slow network) is the cause.

**Step 4 — Identify the root cause:**
Open the trace from the failed attempt. Look at what the browser was showing
at the moment of failure. Is the element present? Hidden? Different text?
Was there a network request that was still in flight?

**Step 5 — Apply the fix:**
Missing wait → add `waitForLoadState` or increase assertion timeout.
Shared state → use unique IDs or clean up in `afterEach`.
Animation race → wait for element to be visible before interacting.

**Step 6 — Verify the fix:**
```bash
npx playwright test --grep "employee search" --repeat-each=50 --workers=1
# Should pass all 50 runs
```

**Step 7 — Remove the annotation, update retries if needed.**

---

## Q403.10 — How do retries interact with beforeAll and afterAll hooks?

`beforeAll` and `afterAll` are not retried — only the test itself retries.

When a test in a describe group is retried:
1. `beforeAll` already ran (once, when the first test in the group started) — it does not re-run
2. The fresh browser context is created
3. `beforeEach` runs again
4. The test body runs again
5. `afterEach` runs again
6. `afterAll` has not run yet (it waits until all tests in the group finish)

This means: if your `beforeAll` set up shared state (a database seed, a variable),
that state persists across retries of tests within the group. Only the
test-scoped browser context resets.

**Implication:** Do not rely on `beforeAll` having run freshly before each retry.
If a retry needs clean test data, set it up in `beforeEach` instead — which
does re-run with each retry.

---

## Q403.11 — How do you configure an auto fixture to track flakiness?

An auto fixture that runs after every test can detect when a test passed
on retry and add an annotation automatically:

```typescript
export const test = base.extend<{ trackFlakiness: void }>({
  trackFlakiness: [async ({}, use) => {
    await use();

    const info = test.info();

    // A test that passed after retrying is flaky
    if (info.retry > 0 && info.status === info.expectedStatus) {
      info.annotations.push({
        type:        'flaky',
        description: `Passed on retry ${info.retry} — investigate root cause`,
      });
      console.warn(`⚠️  FLAKY: ${info.title} — passed on retry ${info.retry}`);
    }
  }, { auto: true }],
});
```

Every test in the suite now automatically gets a `flaky` annotation added
to the HTML report when it passes on retry. The annotation is visible in
the report, exportable from JSON, and parseable by CI dashboards that track
flakiness trends over time.

---

## Q403.12 — What is the right number of retries and how do you decide?

**0 retries** — locally. You want immediate, honest feedback. If a test fails
locally, it should show as failed so you fix it.

**1 retry** — for relatively stable suites running against a reliable test
environment. Absorbs single-occurrence glitches without over-tolerating.

**2 retries** — the standard CI setting. Most genuine environmental failures
resolve within two retries. A test that fails three consecutive times is
almost certainly a real failure.

**3+ retries** — a warning sign. If 3 retries are needed to make CI green,
the test suite has significant flakiness that is being suppressed rather
than fixed. This adds time (each retry costs time) and erodes confidence.

**Per-test overrides for legitimately variable tests:**
```typescript
// Email delivery has external service timing variability
test('welcome email is received', { retries: 4 }, async ({ mailPage }) => {
  await expect(mailPage.getInbox()).toContainText('Welcome to OrangeHRM', { timeout: 60_000 });
});
```

Use per-test overrides for tests that interact with external services or
genuinely variable processes — not as a blanket suppression for all tests.

---

## Q403.13 — How do retries affect test run time?

Retries add time to any CI run where tests fail. With `retries: 2`:
- A passing test: runs once
- A flaky test that passes on retry: runs twice (wasted ~1× the test's duration)
- A genuinely failing test: runs three times (wasted ~2× the test's duration)

With 200 tests and 5% flakiness (10 flaky tests averaging 5 seconds each):
```
Extra time per run: 10 tests × 1 extra run × 5s = 50 seconds per CI run
Over 100 CI runs: ~83 minutes of wasted compute
```

This is another reason to fix flaky tests rather than just adding retries:
the cost accumulates. An aggressively flaky suite with `retries: 2` can add
5–10 minutes to every CI run — budget that disappears silently.

---

## Q403.14 — What evidence should you capture per retry attempt?

Capture evidence on every failed attempt — not just the final failure.
Comparing screenshots across attempts reveals whether the failure is consistent
(always the same error) or variable (different failures on different attempts,
suggesting a race condition):

```typescript
// In baseFixture.ts — auto fixture
screenshotOnFailure: [async ({ page }, use) => {
  await use();

  const info = test.info();
  if (info.status === 'failed') {
    // Label includes the attempt number
    const attempt = info.retry === 0 ? 'attempt-1' : `attempt-${info.retry + 1}`;

    await info.attach(`screenshot-${attempt}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    await info.attach(`url-${attempt}`, {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });
  }
}, { auto: true }],
```

When a test fails after all retries and has multiple screenshots attached,
the HTML report shows a timeline of the failure across attempts.

---

## Q403.15 — How do you prevent retries from hiding real failures?

Retries should absorb rare environmental noise, not paper over persistent
bugs. Several practices keep this discipline:

**1. Keep retries low (2 maximum on CI):**
A test that needs 3+ retries to pass is not an environmental issue — it is
a broken test being suppressed.

**2. Monitor the flakiness rate:**
Track how often tests pass on retry across CI runs. If a test passes on
retry more than 10% of the time, it is chronically flaky and needs fixing,
not more retries.

**3. Never add retries to newly failing tests:**
When a new test starts failing on CI, resist the impulse to add `{ retries: 3 }`.
Investigate why it is failing. Retries are for pre-existing environmental
variability, not for tests that just started failing.

**4. Use `--retries=0` to verify:**
Before merging a fix, run with `--retries=0` to confirm the test genuinely
passes without the safety net:
```bash
npx playwright test --grep "employee search" --retries=0 --repeat-each=5
```

---

## Q403.16 — How do you interpret "flaky" vs "failed" in CI?

**Failed:** The test failed on every attempt. The application or the test
code has a real problem. Do not merge. Investigate immediately.

**Flaky:** The test failed at least once but eventually passed on a retry.
The test is unstable. This is not a pass — it is a warning. The test should
be investigated before the flakiness worsens or causes a real failure to
be missed.

A flaky test that is ignored eventually becomes one of two things:
- A test that consistently fails (the underlying issue gets worse)
- A test that is permanently skipped or removed because "it never reliably passes"

Neither outcome is acceptable. Treat a flaky status in the CI report as a
bug to be filed and scheduled, not a condition to be tolerated.

---

## Q403.17 — How do per-test and per-describe retries interact with the global setting?

The most specific retry configuration wins:

1. Per-test `{ retries: N }` in the details object — overrides everything
2. `test.describe.configure({ retries: N })` — overrides global for that group
3. Global `retries` in `playwright.config.ts` — applies when nothing more specific is set

```typescript
// Global: retries: 2 (in config)

test.describe('Stable Module', () => {
  test.describe.configure({ retries: 0 }); // this group: 0 retries

  test('predictable test @smoke', async () => { ... }); // 0 retries
});

test.describe('Leave Module', () => {
  test.describe.configure({ retries: 1 }); // this group: 1 retry

  test(
    'email notification',
    { retries: 4 },  // this test: 4 retries (overrides describe-level)
    async () => { ... }
  );

  test('apply leave @regression', async () => { ... }); // 1 retry (describe-level)
});

test('standard test @smoke', async () => { ... }); // 2 retries (global)
```

---

## Q403.18 — What was your most impactful intervention on a flaky test suite?

When I joined the project, the test suite had `retries: 3` and a 35%
flakiness rate — one in three tests was passing only on retry. CI runs were
unpredictable. The team had stopped trusting results.

The intervention was systematic:

**Phase 1 — Stop the growth:** Changed `retries: 3` to `retries: 2` and
added the flakiness-tracking auto fixture that annotated every "passed on
retry" result. This gave us a flakiness leaderboard from the JSON report.

**Phase 2 — Fix the top 10:** Used `--repeat-each=20` on each chronically
flaky test. Seven of the ten had the same root cause: `expect.count` assertions
counting all rows in a shared database, broken by concurrent parallel tests.
Fixed by replacing count assertions with `searchByName` + `toBeVisible` patterns.

**Phase 3 — Fix the infrastructure:** Three tests were flaky because they
navigated to pages with third-party analytics scripts that caused timeouts.
Fixed by adding `page.route('**/analytics/**', r => r.abort())` in the global
context override.

After four weeks of targeted fixes:
- Flakiness rate: 35% → 3%
- `retries: 2` → `retries: 1` (enough for the remaining 3%)
- CI run time reduced by 8 minutes (fewer retries × shorter tests)
- Team confidence restored — a red CI now means a real bug

The key insight: every flaky test is hiding information. When you fix it,
you learn something about the application, the infrastructure, or the test
design. That knowledge compounds.

---

## Chapter Summary

- Retries re-run a failed test from scratch — fresh browser context, `beforeEach` runs again, clean start.
- `retries: process.env.CI ? 2 : 0` — the standard pattern; fail fast locally, absorb CI noise on CI.
- Per-test: `{ retries: N }` in the details object. Per-group: `test.describe.configure({ retries: N })`.
- `test.info().retry` — 0 on first run, increments on each retry. Use to adapt behaviour and label evidence.
- Flaky in report = "passed on retry N" — a warning, not a pass. Needs investigation.
- `trace: 'on-first-retry'` — records a full trace only when a test fails and is retried; zero overhead for passing tests.
- `--repeat-each=N` runs every test N times regardless of outcome. Use for reproducing flakiness and verifying fixes.
- Common flakiness causes: missing waits, low assertion timeout, shared database state, animation races.
- Fix cycle: identify via report → annotate → reproduce with `--repeat-each` → trace to root cause → fix → verify → clean up.
- Retries do not fix flaky tests — they absorb them temporarily. A flaky test is a debt that compounds.
- `beforeAll` does not re-run on retry — only `beforeEach` and the test body do.
- Never use retries to suppress a newly failing test. Investigate first.
- Monitor flakiness rate over time — tests passing on retry more than 10% need fixing, not more retries.
