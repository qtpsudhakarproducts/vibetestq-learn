# Chapter 404 — Timeouts — Global, Test & Action Level

This chapter covers Playwright's four-level timeout system — how each level
works, what it protects, how they nest, and how to configure them correctly.
Interviewers use timeout questions to test precision thinking: a candidate
who can explain why a stuck navigation can block CI for 35 minutes, and
configure all four levels to prevent it, understands the framework at depth.

---

## Q404.1 — How many timeout levels does Playwright have and what does each protect?

Playwright has four independent timeouts. Each operates at a different
level of the execution hierarchy:

| Timeout | What it limits | Default | Set in |
|---|---|---|---|
| Test timeout | The entire test including all hooks | 30 000 ms | Config `timeout`, `{ timeout: N }`, `test.setTimeout()` |
| Action timeout | One interaction — click, fill, hover | None (inherits test timeout) | Config `use.actionTimeout`, per action |
| Navigation timeout | One navigation — goto, waitForURL, reload | None (inherits test timeout) | Config `use.navigationTimeout`, per navigation |
| Expect timeout | One assertion retrying to pass | 5 000 ms | Config `expect.timeout`, per assertion |

Each is independent. A short test timeout does not set a short action
timeout. You must configure each level deliberately.

---

## Q404.2 — What is the test timeout and how do you override it?

The test timeout is the outer boundary. It limits everything from when
`beforeEach` starts to when `afterEach` finishes. The default is 30 seconds.

**In config:**
```typescript
export default defineConfig({
  timeout: 30_000, // 30 seconds — the default
});
```

**Per-test in the details object:**
```typescript
test(
  'annual leave report generates successfully',
  { timeout: 90_000 },
  async ({ reportsPage }) => {
    await reportsPage.generateAnnualLeaveReport();
    await reportsPage.expectReportReady();
  }
);
```

**At runtime with test.setTimeout():**
```typescript
test('bulk employee import @regression', async ({ adminPage }) => {
  const rowCount = await adminPage.getImportRowCount();

  // Dynamically extend based on data size discovered at runtime
  test.setTimeout(30_000 + rowCount * 500);

  await adminPage.startBulkImport();
  await adminPage.expectImportComplete();
});
```

`test.setTimeout()` is useful when the required timeout cannot be known
until the test starts running — for example, when it depends on how much
data exists in the environment.

---

## Q404.3 — What is test.slow() and when should you use it instead of a hardcoded timeout?

`test.slow()` multiplies the current test timeout by 3. It is a relative
override — it adapts automatically when the global timeout changes:

```typescript
test('full employee onboarding end-to-end @e2e', async ({ page }) => {
  test.slow();
  // Global: 30s → this test: 90s
  // If global is raised to 60s → this test automatically gets 180s

  await test.step('Create employee record', async () => { ... });
  await test.step('Assign to department',   async () => { ... });
  await test.step('Create login creds',     async () => { ... });
  await test.step('Verify employee login',  async () => { ... });
});
```

**`test.slow()` vs hardcoded `{ timeout: 90_000 }`:**

```typescript
// ❌ Hardcoded — does not adapt when global timeout changes
test('slow workflow', { timeout: 90_000 }, async () => { ... });

// ✅ Relative — always 3× the global timeout
test('slow workflow', async () => {
  test.slow();
});
```

Use `test.slow()` when the test is genuinely slow by nature — multi-step
workflows, file generation, email delivery. Do not use it to hide tests that
are slow because of poor design or missing waits.

---

## Q404.4 — What is the action timeout and why is it critical to configure it?

The action timeout limits a single interaction — one `click()`, one `fill()`,
one `hover()`, one `selectOption()`. If Playwright cannot find the element
and interact with it within this time, the action throws immediately.

**Without action timeout configured:**
```
Global timeout: 30s — action timeout inherits it

click('#add-employee')  → element not found → waits 30 seconds → fails
Total test time: 30 seconds
```

**With action timeout: 10s:**
```
Global timeout: 30s — action timeout: 10s

click('#add-employee') → element not found → waits 10 seconds → fails
Total test time: 10.5 seconds
```

Same failure, 20 seconds faster. Multiply across 200 tests where any test
might hit a missing element, and fast failures save significant CI time.

**Configure globally:**
```typescript
use: {
  actionTimeout: 10_000, // 10 seconds per action
},
```

**Override per action:**
```typescript
test('search employee @smoke', async ({ page }) => {
  // This dropdown has a slow animation — needs more time than the global
  await page.getByLabel('Department').click({ timeout: 15_000 });

  // All other actions use the global 10s
  await page.getByRole('option', { name: 'Engineering' }).click();
});
```

---

## Q404.5 — What is the navigation timeout and what happens if you leave it unconfigured?

The navigation timeout limits a single navigation — `page.goto()`,
`page.waitForURL()`, `page.reload()`, `page.goBack()`. Without it
configured, navigations inherit the test timeout.

**The danger:** If a page never fully loads — a misconfigured server,
a third-party script hanging, a network issue in CI — the navigation
waits for the test timeout. But worse: if the test timeout is also not
set, Playwright waits until the operating system kills the connection.
That can be minutes.

**Always configure navigationTimeout:**
```typescript
use: {
  navigationTimeout: 30_000, // 30 seconds per navigation
},
```

**The opening scenario from the source material:** A test ran for 35 minutes
in CI because a navigation had no timeout. The page hung, the navigation
kept waiting, nothing stopped it. With `navigationTimeout: 30_000`, that
test would have failed in 30 seconds.

**Override per navigation:**
```typescript
test('reports page loads @smoke', async ({ page }) => {
  // Reports page loads slowly — needs more than the global navigation timeout
  await page.goto('/web/index.php/reports/viewReports', { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
});
```

---

## Q404.6 — What is the expect timeout and when should you override it per-assertion?

The expect timeout controls how long Playwright retries an assertion before
marking it as failed. Playwright assertions are not instant checks — they
poll the condition repeatedly until it passes or the timeout expires.

**Default: 5 seconds.** Set globally:
```typescript
expect: {
  timeout: 5_000,
},
```

**Override per assertion when the condition takes longer to appear:**
```typescript
test('report generation completes @regression', async ({ reportsPage }) => {
  await reportsPage.clickGenerateReport();

  // Report generation takes up to 30 seconds on large datasets
  await expect(reportsPage.getDownloadButton()).toBeVisible({ timeout: 30_000 });

  // Other assertions still use the global 5s
  await expect(reportsPage.getReportTitle()).toHaveText('Annual Leave Summary');
});
```

**Key guidance:** Keep the global `expect.timeout` low (5 seconds). Override
specific assertions that legitimately need more time. Increasing the global
expect timeout means all assertions wait longer before failing — you lose
fast failure feedback for simple missing elements.

**When to override expect timeout vs navigation/action timeout:**
- Element slow to appear (animation, async update) → override expect timeout on that assertion
- Page slow to load (server response) → override `navigationTimeout` on that navigation
- Multi-step test that takes longer overall → use `test.slow()` or `{ timeout: N }` on the test

---

## Q404.7 — How do the four timeouts nest inside each other?

The test timeout is the outer container. All other operations run inside it:

```
Test timeout (30s)
├── beforeEach
│   └── navigation inside beforeEach: uses navigationTimeout
├── Test body
│   ├── action (click, fill): uses actionTimeout
│   ├── navigation (goto):    uses navigationTimeout
│   └── assertion (expect):   uses expect timeout
└── afterEach
    └── screenshot action:    uses actionTimeout
```

If the sum of all operations exceeds the test timeout, the test is killed —
even if each individual operation was within its own timeout.

**Worked example:**
```
Test timeout:      30s
Action timeout:    10s
Navigation timeout: 15s

Navigation 1:  8s  ← within 15s ✅
Action 1:      3s  ← within 10s ✅
Navigation 2: 16s  ← exceeds 15s ❌ throws here at t=27s
```

The test fails at 27 seconds (8 + 3 + 16), well within the 30s test timeout.
The navigation timeout catches it first. This is the correct behaviour —
navigation 2 failing at 16s is diagnostic information.

**Counter-example — why not having action/navigation timeouts is dangerous:**
```
Test timeout: 30s — no action timeout — no navigation timeout

Navigation 1:  8s  ✅
Action 1:      3s  ✅
Navigation 2: 30s  ← test timeout fires, not navigation timeout
```

The test times out at 30 seconds with "Test timeout exceeded" — a generic
error. With navigation timeout, it would fail with "page.goto: Timeout 15s
exceeded" — a specific, diagnostic error that tells you exactly which
navigation failed.

---

## Q404.8 — What are the recommended timeout values for a typical HRMS suite?

```typescript
export default defineConfig({
  // Test timeout — outer boundary
  timeout: 30_000,

  // Expect timeout — assertion retry window
  expect: {
    timeout: 5_000,
  },

  use: {
    // Action timeout — per click, fill, hover
    actionTimeout: 10_000,

    // Navigation timeout — per page.goto(), waitForURL()
    navigationTimeout: 30_000,
  },
});
```

**Rationale:**
- **Test: 30s** — most UI tests complete in under 10 seconds. 30s covers
  genuinely slow operations. Use `test.slow()` for exceptions.
- **Expect: 5s** — assertions for visible elements should pass quickly.
  5 seconds is generous for most UI updates. Override slow ones individually.
- **Action: 10s** — most elements are found in under 1 second. 10 seconds
  catches genuinely slow renders without consuming the whole test timeout.
- **Navigation: 30s** — full page loads in CI can be slow. 30s matches the
  test timeout so a single hanging navigation fails the test, not silently
  waits past it.

---

## Q404.9 — What does each timeout error message tell you?

**"Test timeout of 30000ms exceeded"**

The entire test took longer than 30 seconds. Possible causes:
- One action or navigation ran very slowly
- A `while` loop or polling that did not terminate
- Too many steps accumulated past the time limit

Fix: Use `test.step()` to pinpoint the slow step, then either fix the
slowness, override that step's timeout, or use `test.slow()` for the test.

**"locator.click: Timeout 10000ms exceeded"**

An action timed out at 10 seconds. The element either:
- Does not exist in the DOM
- Exists but is not visible
- Is visible but is disabled or covered by another element

Fix: Check the selector, verify the page state before the action, add a
`toBeVisible()` assertion before the interaction.

**"page.goto: Timeout 30000ms exceeded"**

A navigation timed out. The page either:
- Never returned a response (wrong URL, server down)
- Returned but the load event never fired (third-party script hanging)

Fix: Verify the URL is reachable, check the environment, consider
`{ waitUntil: 'domcontentloaded' }` for pages with slow third-party scripts.

**"expect(locator).toBeVisible: Timeout 5000ms exceeded"**

The assertion retried for 5 seconds and the condition never became true:
- The element does not exist at all
- It exists but is hidden with `display: none` or `visibility: hidden`
- It appeared with different text or attributes than the locator expects

Fix: Verify the selector, check whether the element should actually appear
after the triggering action, increase the assertion timeout if the update
is legitimately slow.

---

## Q404.10 — How does waitUntil affect navigation timeout behaviour?

`page.goto()` defaults to `waitUntil: 'load'` — it waits for the browser's
`load` event, which fires after all resources (images, scripts, stylesheets)
have loaded. This includes third-party scripts like analytics and chat widgets.

If a third-party resource hangs, the `load` event never fires, and the
navigation keeps waiting until the timeout:

```typescript
// Default: waits for 'load' — all resources including third-party
await page.goto('/dashboard');

// Faster: waits for DOM ready — skips third-party resource completion
await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

// Minimal: just needs the first response bytes
await page.goto('/dashboard', { waitUntil: 'commit' });
```

For tests in environments with unreliable third-party dependencies,
`waitUntil: 'domcontentloaded'` is a common fix for navigation timeouts
that have no other obvious cause. Set it globally in the fixture or
override per navigation for the affected pages.

---

## Q404.11 — How do you debug a test that fails with "Test timeout exceeded" but the cause is unclear?

When the error is "Test timeout of 30000ms exceeded" with no inner error,
it means the test hit the outer boundary without an individual operation
reporting which step failed.

**Use test.step() to localise the slow step:**

```typescript
test('employee onboarding @e2e', async ({ page }) => {
  await test.step('Navigate to add employee', async () => {
    await page.goto('/web/index.php/pim/addEmployee');
  });

  await test.step('Fill basic information', async () => {
    await page.getByPlaceholder('First Name').fill('Priya');
    await page.getByPlaceholder('Last Name').fill('Sharma');
  });

  await test.step('Submit form', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    // ← If this step is still running when the timeout fires,
    //   the error will name "Submit form" as the location
  });
});
```

With named steps in the report, you see which step was executing when the
timeout fired — not just "test timed out."

**Check TestInfo for elapsed time context:**
```typescript
test.afterEach(async () => {
  const info = test.info();
  if (info.status === 'timedOut') {
    console.log(`Test duration before timeout: ${info.duration}ms`);
    console.log(`Configured timeout: ${info.timeout}ms`);
  }
});
```

---

## Q404.12 — Can you disable a timeout completely? Should you?

Yes. Setting any timeout to `0` disables it:

```typescript
test('no timeout test', { timeout: 0 }, async () => { ... });
// or
test.setTimeout(0); // inside the test body
```

**Should you?** Almost never. Disabling a timeout means a stuck operation
can hang forever — blocking a CI worker indefinitely. There is almost always
a better solution: find the right timeout value rather than removing the
safety net entirely.

The one legitimate use case is a manual debugging session where you want to
pause the test in the browser's developer tools and inspect state. In that
scenario, `--timeout=0` on the CLI is acceptable:

```bash
npx playwright test --timeout=0 --debug --grep "specific test"
```

Even then, re-enable the timeout before committing any changes.

---

## Q404.13 — How do timeout settings in playwright.config.ts interact with per-project settings?

`timeout` and `expect.timeout` are top-level config properties — they apply
globally to all projects. Action and navigation timeouts live in the `use`
block, which projects can override:

```typescript
export default defineConfig({
  timeout: 30_000,          // applies to all projects
  expect: { timeout: 5_000 }, // applies to all projects

  use: {
    actionTimeout:     10_000, // global default
    navigationTimeout: 30_000, // global default
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // inherits all timeout settings from global use
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        actionTimeout:     15_000, // mobile interactions can be slower
        navigationTimeout: 45_000, // mobile networks can be slower
      },
    },
  ],
});
```

The mobile project gets longer timeouts because mobile-emulated environments
can have slower interaction and navigation times, while the desktop project
inherits the standard values.

---

## Q404.14 — What is the relationship between retries and timeouts?

When a test is retried, the timeout resets for each attempt. Each attempt
gets the full test timeout — not a fraction of the original.

```
Test timeout: 30s — retries: 2

Attempt 1: starts at t=0,  fails at t=28s (timeout fired — 28s used)
Attempt 2: starts fresh,   fails at t=28s (new 30s window — 28s used)
Attempt 3: starts fresh,   passes at t=4s (new 30s window)
```

Total wall-clock time: ~60 seconds for a test that eventually passes on
the second retry.

**Implication:** A test with `retries: 2` and `timeout: 30s` can consume
up to 90 seconds of CI time if it fails twice before passing. With
`retries: 2` on 200 tests where 10% are flaky, that is:

```
20 flaky tests × 30s (one extra retry average) = 600 extra seconds per CI run
```

This is one reason to fix flaky tests rather than simply adding retries.

---

## Q404.15 — How do you configure timeouts differently for slow CI vs fast local machines?

CI environments are often slower — shared resources, cold container start,
variable network latency. Configure timeouts to account for this:

```typescript
export default defineConfig({
  timeout: process.env.CI ? 60_000 : 30_000, // 2× on CI

  expect: {
    timeout: process.env.CI ? 10_000 : 5_000, // 2× on CI
  },

  use: {
    actionTimeout:     process.env.CI ? 15_000 : 10_000,
    navigationTimeout: process.env.CI ? 60_000 : 30_000,
  },
});
```

This pattern prevents genuine CI slowness from causing false timeout
failures while keeping local tests fast-failing so you get immediate
feedback during development.

An alternative approach: keep timeouts the same but fix the CI environment
to be faster (dedicated runners, warmed containers). If CI regularly needs
2× the local timeout, the environment is the problem — not the timeouts.

---

## Q404.16 — Write a complete timeout configuration for an OrangeHRM suite.

```typescript
// playwright.config.ts
export default defineConfig({

  // Test timeout — outer boundary for each test
  timeout: 30_000,

  // Expect timeout — assertion retry window
  expect: {
    timeout: 5_000,
  },

  use: {
    baseURL: process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',

    // Action timeout — per click, fill, hover, selectOption
    actionTimeout: 10_000,

    // Navigation timeout — per goto, waitForURL, reload
    navigationTimeout: 30_000,
  },

});
```

```typescript
// Usage examples in tests

// Slow test — use test.slow() for relative 3× multiplier
test('full employee onboarding @e2e', async ({ onboardingPage }) => {
  test.slow(); // 90s instead of 30s

  await test.step('Create record',   () => onboardingPage.createEmployee());
  await test.step('Assign dept',     () => onboardingPage.assignDepartment());
  await test.step('Set credentials', () => onboardingPage.createLogin());
  await test.step('Verify login',    () => onboardingPage.verifyEmployeeCanLogin());
});

// Slow assertion — override per assertion only
test('bulk import 50 employees @regression', async ({ adminPage }) => {
  await adminPage.startBulkImport('./data/employees.csv');

  // Only this assertion needs extra time — global 5s still used for everything else
  await expect(adminPage.getImportSuccessMessage())
    .toBeVisible({ timeout: 60_000 });
});

// Slow navigation — override per navigation only
test('reports page loads @smoke', async ({ page }) => {
  await page.goto('/web/index.php/reports/viewReports', { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
});

// Dynamic timeout based on runtime data
test('variable-length import @regression', async ({ adminPage }) => {
  const rows = await adminPage.getImportRowCount();
  test.setTimeout(30_000 + rows * 200); // 200ms per row
  await adminPage.runImport();
});
```

---

## Q404.17 — What happens to timeout when hooks run slowly?

All hooks — `beforeAll`, `beforeEach`, `afterEach`, `afterAll` — contribute
to the test timeout. If `beforeEach` takes 15 seconds, only 15 seconds
remain for the test body before the 30-second timeout fires.

```
Test timeout: 30s

beforeEach:
  goto('/login'):             3s
  fill(username):           0.1s
  fill(password):           0.1s
  click(loginButton):       0.1s
  waitForURL(/dashboard/):  2s
  Total beforeEach:           ~5.3s

Test body:
  Remaining budget: 24.7s

afterEach (screenshot):       0.5s (uses action timeout, not additional test time
                                    — afterEach contributes to the test timeout)
```

If your `beforeEach` is slow — perhaps it re-logs in every test instead of
using `storageState` — it eats into the test body's time budget. This is one
reason to use stored auth state: login in `beforeEach` can cost 3–8 seconds
per test. Over 200 tests, that is 10–27 minutes of login time that the
timeout system is silently consuming.

---

## Q404.18 — What is the most important timeout mistake to avoid?

**The most important mistake: leaving `navigationTimeout` unconfigured.**

When `navigationTimeout` is not set, page navigations inherit the test
timeout (30 seconds by default). This means:

1. A single hung navigation can consume the entire test's time budget
2. The error message is "Test timeout exceeded" — not "Navigation timeout"
3. If the test timeout is also not set, navigations can hang indefinitely

The practical consequence is the scenario from the chapter opening: a
navigation to a staging environment that is temporarily overloaded hangs
for 35 minutes, blocking an entire CI worker while engineers wonder why
the pipeline is not completing.

**The fix is three lines in the config:**
```typescript
use: {
  actionTimeout:     10_000,
  navigationTimeout: 30_000,
},
```

With these in place:
- A stuck navigation fails in 30 seconds with a specific diagnostic error
- A missing element fails in 10 seconds instead of consuming the full test timeout
- The team gets fast, specific failures instead of slow, generic "test timeout" messages

The hierarchy to remember: set the test timeout as the outer safety net,
set action and navigation timeouts as inner guards that fail fast and
specifically, keep the expect timeout low and override slow assertions
individually.

---

## Chapter Summary

- Four independent timeouts: test (outer boundary), action (per interaction), navigation (per page load), expect (per assertion retry).
- Test timeout: 30s default. Override per test with `{ timeout: N }`, at runtime with `test.setTimeout()`, or use `test.slow()` for 3×.
- `test.slow()` multiplies current timeout by 3 — adapts when the global changes; prefer over hardcoded values.
- Action timeout: no default — inherits test timeout if unset. Always configure `use.actionTimeout` for fast failure on missing elements.
- Navigation timeout: no default — inherits test timeout if unset. The most dangerous to leave unconfigured. Always set `use.navigationTimeout`.
- Expect timeout: 5s default. The assertion retry window. Keep global low; override individual slow assertions with `{ timeout: N }`.
- All timeouts nest inside the test timeout — the test is killed if the total sum exceeds the limit.
- Different error messages point to different problems: "Test timeout" → slow overall, "locator.click Timeout" → element missing, "page.goto Timeout" → server/network, "expect Timeout" → element not appearing.
- `waitUntil: 'domcontentloaded'` on `goto()` avoids hanging on slow third-party resources.
- `test.setTimeout(0)` disables the timeout — only for manual debugging sessions, never in committed code.
- Retries reset the timeout per attempt — a test with `retries: 2` and `timeout: 30s` can consume 90s of CI time.
- Always configure all four timeout levels explicitly. Never rely on the "inherits test timeout" fallback for actions and navigations.
