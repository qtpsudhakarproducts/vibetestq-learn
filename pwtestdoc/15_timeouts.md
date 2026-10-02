# 15 — Timeouts

## The Scenario

Your CI pipeline has been running for 40 minutes. One test is still going. It started 35 minutes ago. The entire pipeline is blocked — no other jobs can proceed until this test finishes. Eventually it times out with:

```
Error: Test timeout of 30000ms exceeded
```

But 30 seconds is the configured timeout. Why did the test run for 35 minutes?

Because there was no timeout on the action level. The test navigated to a page that never fully loaded. The navigation kept waiting. The test timeout was 30 seconds but the navigation timeout was not set — so it waited until the operating system eventually killed the connection. 35 minutes later.

This is the problem with not understanding Playwright's timeout system. There are multiple independent timeouts. Each protects a different level of the execution. If any one is missing or misconfigured, a single stuck operation can block everything.

---

## The Four Timeout Levels

Playwright has four independent timeouts. They operate at different levels and protect different things. Understanding all four and how they interact is the key to a suite that fails fast instead of hanging.

| Timeout | What It Limits | Default | Where to Set |
|---|---|---|---|
| Test timeout | The entire test including hooks | 30 seconds | Config, per test, `test.setTimeout()` |
| Action timeout | A single action (click, fill, hover) | No default — inherits test timeout | Config `use.actionTimeout`, per action |
| Navigation timeout | A single navigation (goto, waitForURL) | No default — inherits test timeout | Config `use.navigationTimeout`, per navigation |
| Expect timeout | A single assertion retrying to pass | 5 seconds | Config `expect.timeout`, per assertion |

Each is independent. Setting a short test timeout does not automatically set a short action timeout. You must configure each level deliberately.

---

## Test Timeout

The test timeout is the outer boundary. It limits the entire test — from when `beforeEach` starts to when `afterEach` finishes. If the total execution time exceeds this, the test is marked as `timedOut`.

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 30_000,  // 30 seconds — the default
});
```

### Override Per Test

```typescript
// This specific test needs more time — a slow report generation workflow
test(
  'annual leave report generates successfully',
  { timeout: 90_000 },   // 90 seconds for this test
  async ({ reportsPage }) => {
    await reportsPage.generateAnnualLeaveReport();
    await reportsPage.expectReportReady();
  }
);
```

### Override at Runtime with test.setTimeout()

When you cannot know at declaration time how long a test will take — for example, it depends on environment conditions discovered during the test:

```typescript
test('process bulk employee import @regression', async ({ adminPage }) => {
  const rowCount = await adminPage.getImportRowCount();

  // Dynamically extend timeout based on data size
  // Each row takes roughly 500ms to process
  test.setTimeout(30_000 + rowCount * 500);

  await adminPage.startBulkImport();
  await adminPage.expectImportComplete();
});
```

### test.slow() — The 3× Multiplier

`test.slow()` multiplies the current timeout by 3. It is a relative override — it adapts when the global timeout changes:

```typescript
test('full employee onboarding end-to-end @e2e', async ({ page }) => {
  test.slow();
  // Global timeout: 30s → this test gets 90s
  // If global is later raised to 60s → this test gets 180s automatically

  await test.step('Create employee record', async () => { ... });
  await test.step('Assign to department', async () => { ... });
  await test.step('Create login credentials', async () => { ... });
  await test.step('Verify employee can log in', async () => { ... });
});
```

**`test.slow()` vs hardcoded timeout:**

```typescript
// ❌ Hardcoded — does not adapt when global timeout changes
test('slow workflow', { timeout: 90_000 }, async ({ page }) => { ... });

// ✅ Relative — always 3× whatever the global timeout is
test('slow workflow', async ({ page }) => {
  test.slow();
});
```

Use `test.slow()` when the test is slow by nature of what it does — multi-step workflows, file generation, email delivery. Do not use it to hide tests that are slow because of poor design or missing waits.

---

## Action Timeout

The action timeout limits a single interaction — one `click()`, one `fill()`, one `hover()`, one `selectOption()`. If Playwright cannot find the element and interact with it within this time, the action throws.

By default, Playwright has no separate action timeout — actions inherit from the test timeout. This means if your test timeout is 30 seconds, a single failing action can consume the entire 30 seconds before the test fails.

**Setting a global action timeout:**

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    actionTimeout: 10_000,  // 10 seconds per action
  },
});
```

With this, if any action cannot complete in 10 seconds, the test fails immediately instead of waiting for the full test timeout. A test with a stuck action fails in 10 seconds, not 30.

**Override per action:**

```typescript
test('search employee @smoke', async ({ page }) => {
  // This specific click needs extra time — a slow dropdown animation
  await page.getByLabel('Department').click({ timeout: 15_000 });

  // All other actions use the global actionTimeout
  await page.getByRole('option', { name: 'Engineering' }).click();
});
```

### Why action timeout matters in practice

Consider a test where an element does not exist:

```
Global timeout: 30 seconds
Action timeout: not set (inherits test timeout)

Test fills username: 0.5s
Test fills password: 0.5s
Test clicks Login button: 0.5s
Test clicks "Add Employee" button that does not exist: waits... 28.5s... FAILS

Total time: 30 seconds
```

Now with action timeout set to 10 seconds:

```
Test fills username: 0.5s
Test fills password: 0.5s
Test clicks Login button: 0.5s
Test clicks "Add Employee" button that does not exist: waits... 10s... FAILS

Total time: 11.5 seconds
```

Same failure, 18 seconds faster. Across a suite of 200 tests, fast failures add up to significant CI time savings.

---

## Navigation Timeout

The navigation timeout limits a single navigation operation — `page.goto()`, `page.waitForURL()`, `page.reload()`, `page.goBack()`. If the navigation does not complete within this time, it throws.

Like action timeout, there is no default separate navigation timeout — it inherits the test timeout. This is the scenario from the opening: a navigation that hangs can consume the entire test timeout, or worse, consume far more if no test timeout is set either.

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    navigationTimeout: 30_000,  // 30 seconds per navigation
  },
});
```

**Override per navigation:**

```typescript
test('navigate to reports page @smoke', async ({ page }) => {
  // Reports page loads slowly — needs more time than the global navigation timeout
  await page.goto('/web/index.php/reports/viewReports', { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
});
```

### The Navigation Timeout Trap

Navigation timeout is the most dangerous timeout to leave unconfigured, especially in CI environments where network conditions vary. A page that takes 45 seconds to load will hang the test for 45 seconds — and if there is no navigation timeout, nothing stops it.

```typescript
// ❌ No navigation timeout — hangs until OS kills the connection
await page.goto('https://staging.orangehrm.example.com/dashboard');

// ✅ With navigation timeout set globally, this fails in 30 seconds
await page.goto('/dashboard'); // uses baseURL + navigationTimeout from config
```

---

## Expect Timeout

The expect timeout limits how long an assertion retries before failing. Playwright assertions are not instant checks — they retry the condition repeatedly until it passes or the timeout is reached.

```typescript
// playwright.config.ts
export default defineConfig({
  expect: {
    timeout: 5_000,  // assertions retry for up to 5 seconds
  },
});
```

This is the timeout that makes Playwright resilient to animations, loading states, and asynchronous updates. When you write:

```typescript
await expect(page.getByText('Successfully Saved')).toBeVisible();
```

Playwright does not check once and fail immediately if the text is not there. It checks repeatedly — every 100ms or so — for up to `expect.timeout` milliseconds. The text appears when the server responds with the save confirmation, and the assertion catches it.

**Override per assertion:**

```typescript
test('report generation completes @regression', async ({ reportsPage }) => {
  await reportsPage.clickGenerateReport();

  // Report generation takes up to 30 seconds on large datasets
  // Override just this assertion's timeout
  await expect(reportsPage.getDownloadButton()).toBeVisible({ timeout: 30_000 });

  // Other assertions in this test still use the global 5 second timeout
  await expect(reportsPage.getReportTitle()).toHaveText('Annual Leave Summary');
});
```

### When to Increase Expect Timeout vs Navigation/Action Timeout

The distinction:

- **Slow to load (network / server)** → increase `navigationTimeout` or action `timeout`
- **Slow to appear (animation / async update)** → increase `expect timeout` on that specific assertion
- **Slow workflow (multiple steps)** → use `test.slow()` or increase test `timeout`

Do not increase the global `expect.timeout` just because one assertion needs more time. Override it on that specific assertion instead. Keeping the global low means other assertions fail fast when something is genuinely missing.

---

## How Timeouts Nest

The test timeout is the outer container. All other timeouts operate inside it:

```
Test timeout (30s)
├── beforeEach (contributes to test timeout)
│   └── navigation inside beforeEach: uses navigationTimeout
├── Test body (contributes to test timeout)
│   ├── action (fill, click): uses actionTimeout
│   ├── navigation (goto): uses navigationTimeout
│   └── assertion (expect): uses expect timeout
└── afterEach (contributes to test timeout)
    └── screenshot: uses actionTimeout
```

If the sum of all operations exceeds the test timeout, the test is killed — even if each individual operation was within its own timeout.

**Example of how they interact:**

```
Test timeout: 30s
Action timeout: 10s
Navigation timeout: 15s

Navigation 1: 8s    ← within navigationTimeout (15s) ✅
Action 1:     3s    ← within actionTimeout (10s) ✅
Navigation 2: 16s   ← exceeds navigationTimeout (15s) ❌ throws here
```

The test fails at navigation 2 (16 seconds in), well within the test timeout (30s). The navigation timeout caught it first — which is the correct behaviour.

---

## Timeout Configuration Reference

```typescript
export default defineConfig({

  // Test timeout — the outer boundary for each test
  timeout: 30_000,

  // Expect timeout — how long assertions retry
  expect: {
    timeout: 5_000,
  },

  use: {
    // Action timeout — per click, fill, hover, etc.
    actionTimeout: 10_000,

    // Navigation timeout — per page.goto(), waitForURL()
    navigationTimeout: 30_000,
  },

});
```

**Recommended values for OrangeHRM:**

```typescript
export default defineConfig({
  timeout: 30_000,          // 30s per test (use test.slow() for longer ones)

  expect: {
    timeout: 5_000,         // 5s per assertion — fast feedback on missing elements
  },

  use: {
    actionTimeout: 10_000,  // 10s per action — sufficient for most interactions
    navigationTimeout: 30_000, // 30s per navigation — enough for slow pages
  },
});
```

---

## Timeout Errors and What They Tell You

Different timeout errors point to different problems:

### "Test timeout of 30000ms exceeded"

The entire test took longer than the test timeout. Could be:
- One action or navigation that ran very slowly
- A `while` loop or `waitFor` that did not terminate
- Too many steps for the configured timeout

**Fix:** Identify the slow step using `test.step()`, then either fix the slowness or use `test.slow()` / `{ timeout: N }`.

### "locator.click: Timeout 10000ms exceeded"

An action timed out. The element either:
- Does not exist in the DOM
- Exists but is hidden
- Exists but is not interactive (disabled, covered by another element)

**Fix:** Check the selector, check the page state before the click, add a visibility assertion before the interaction.

### "page.goto: Timeout 30000ms exceeded"

A navigation timed out. The page either:
- Never returned a response
- Returned a response but the load event never fired
- Is returning a very slow response

**Fix:** Check if the URL is correct, check if the environment is running, consider `waitUntil: 'domcontentloaded'` instead of the default `load` for pages with slow third-party resources.

```typescript
// Default: waits for 'load' event — all resources including third-party
await page.goto('/dashboard');

// Faster: waits for DOM to be ready — does not wait for images, analytics, etc.
await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

// Even faster: just waits for the response — minimal wait
await page.goto('/dashboard', { waitUntil: 'commit' });
```

### "expect(locator).toBeVisible: Timeout 5000ms exceeded"

An assertion kept checking for 5 seconds and the condition never became true. The element:
- Does not exist
- Exists but is hidden with CSS
- Appeared with a different text or role than expected

**Fix:** Check the selector, check if the element should actually appear after the action, increase the assertion timeout if the update is legitimately slow.

---

## A Practical Timeout Setup for OrangeHRM

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    baseURL: process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',
  },
});
```

```typescript
// For slow tests — use test.slow() in the test body
test('full employee onboarding workflow @e2e', async ({ page }) => {
  test.slow(); // 90s instead of 30s
  // ... multi-step workflow
});

// For specific slow assertions — override at the assertion level
test('bulk import 50 employees @regression', async ({ adminPage }) => {
  await adminPage.startBulkImport('./data/employees.csv');
  await expect(adminPage.getImportSuccessMessage())
    .toBeVisible({ timeout: 60_000 }); // import takes up to 60s
});

// For specific slow navigations — override at the navigation level
test('reports page loads @smoke', async ({ page }) => {
  await page.goto('/web/index.php/reports/viewReports', { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
});
```

---

## Key Points

- Four independent timeouts: test (outer boundary), action (per interaction), navigation (per page load), expect (per assertion)
- Test timeout: 30s default; override with `{ timeout: N }` in details, `test.setTimeout()` at runtime, or `test.slow()` for 3×
- Action timeout: no default — inherits test timeout if not set; set `use.actionTimeout` to fail fast on missing elements
- Navigation timeout: no default — inherits test timeout if not set; always set `use.navigationTimeout` to prevent hung navigations
- Expect timeout: 5s default; the retry window for assertions; override per assertion with `{ timeout: N }`
- `test.slow()` multiplies current timeout by 3 — relative to global config, adapts when global changes
- `test.setTimeout(N)` inside the test body — for dynamically calculated timeouts based on runtime data
- All timeouts nest inside the test timeout — the test is killed if the total exceeds the test limit
- Action timeout fires first on a stuck element — prevents one bad action from consuming the entire test timeout
- Navigation timeout is the most dangerous to leave unconfigured — a hung page load can block CI for minutes
- Different timeout errors point to different problems: test timeout → slow overall, action timeout → element missing/hidden, navigation timeout → server issue, expect timeout → element not appearing
- `waitUntil: 'domcontentloaded'` on `page.goto()` — faster than default `load` for pages with slow third-party resources
- Keep global `expect.timeout` low (5s) — override specific slow assertions individually rather than inflating globally
