# Chapter 210 — Windows — Multiple Pages & Tabs

This chapter covers one of the most tested topics in Playwright interviews:
how Playwright handles timing. Auto-waiting is what makes Playwright tests
reliable without explicit sleep calls. Understanding when auto-waiting works,
when it does not, and how timeouts are structured separates candidates who
have debugged real flaky tests from those who have only read documentation.

---

## Q210.1 — What is auto-waiting in Playwright?

Auto-waiting is Playwright's built-in mechanism that waits for an element
to be ready before performing any action on it. Before every action — click,
fill, hover, check — Playwright checks a set of conditions and retries until
they all pass or the timeout is reached.

This eliminates the need for explicit `await page.waitForTimeout(2000)` calls
before most interactions. The test code stays clean, and Playwright handles
the timing.

```typescript
// No explicit wait needed — Playwright waits automatically
await page.getByRole('button', { name: 'Submit' }).click();
// Before clicking, Playwright verifies: visible, enabled, stable, not obscured
```

Auto-waiting was one of the primary motivations for building Playwright.
Selenium required explicit waits before almost every interaction. Playwright
eliminated that ceremony for the common case.

---

## Q210.2 — What actionability checks does Playwright perform before clicking?

Before performing a `click()`, Playwright checks six conditions in sequence.
If any check fails, Playwright retries until all pass or the timeout is reached.

**1. Attached** — the element exists in the DOM (not detached or removed).

**2. Visible** — the element is visible. Not hidden with `display:none`,
`visibility:hidden`, or zero opacity.

**3. Stable** — the element is not animating or moving. Playwright checks
that the element's bounding box has stopped changing between two frames.

**4. Receives events** — the element is not obscured by another element.
Playwright calculates the center point of the element and checks that no
other element overlays that point.

**5. Enabled** — the element is not disabled (no `disabled` attribute on
buttons, inputs, or select elements).

**6. Editable** — for `fill()` actions, the element must not be `readonly`.

```typescript
// All 6 checks happen automatically before this click
await page.getByRole('button', { name: 'Pay Now' }).click();

// If the button is disabled, Playwright retries — it does not fail immediately
// It waits until the button becomes enabled or the timeout expires
```

Not all checks apply to every action. `fill()` requires editable. `check()`
requires the element to be a checkbox. Playwright selects the right checks
for each action type.

---

## Q210.3 — How did you use auto-waiting in your project?

In our project, we rely on auto-waiting for almost all interactions. We
do not add explicit waits before clicks, fills, or assertions unless there
is a specific reason.

The one area where we add explicit waiting is after form submissions that
trigger API calls. In that case, we wait for the API response before
asserting the UI result:

```typescript
// After clicking Submit — wait for the API response, then assert
const [response] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/orders') && r.status() === 201),
  page.getByRole('button', { name: 'Place Order' }).click(),
]);

const body = await response.json();
expect(body.orderId).toBeDefined();

// Now assert the UI — the data is guaranteed to be there
await expect(page.getByTestId('order-confirmation')).toBeVisible();
```

We found that this pattern — `Promise.all` with `waitForResponse` — is
more reliable than asserting directly, because it eliminates the race
between the API response and the UI re-render.

---

## Q210.4 — What types of timeouts exist in Playwright?

Playwright has four distinct timeout types that apply at different levels:

**Test timeout** — the maximum time a single test can run from start to
finish. Set via `timeout` in `playwright.config.ts`. Default: 30,000ms.

**Action timeout** — the maximum time Playwright waits for auto-waiting
conditions (actionability checks) to pass on a single action. Set via
`use.actionTimeout`. Default: 0 (inherits from test timeout).

**Navigation timeout** — the maximum time for navigation operations
(`goto`, `waitForURL`, `waitForNavigation`). Set via `use.navigationTimeout`.
Default: 0 (inherits from test timeout).

**Assertion timeout** — the maximum time `expect()` assertions retry before
failing. Set via `expect.timeout`. Default: 5,000ms.

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 30_000,          // test timeout
  expect: {
    timeout: 5_000,         // assertion timeout
  },
  use: {
    actionTimeout: 10_000,  // action timeout
    navigationTimeout: 30_000, // navigation timeout
  },
});
```

---

## Q210.5 — What is the difference between action timeout and test timeout?

**Test timeout** is the upper bound for the entire test. If the test runs
longer than this, it is killed regardless of what it is doing.

**Action timeout** is the per-action wait limit. It controls how long
Playwright retries actionability checks for a single action (like a click
or fill).

```
Test starts
├── action 1: click (waits up to actionTimeout)
├── action 2: fill (waits up to actionTimeout)
├── assertion 1: toBeVisible (waits up to expect.timeout)
└── ...if the sum of all these exceeds test timeout → test is killed
```

If `actionTimeout` is 0 (the default), individual actions are limited only
by the remaining test timeout. Setting a specific `actionTimeout` like
`10_000ms` means each action has its own 10-second limit — after which
that action fails without waiting for the full test timeout.

**Rule of thumb:** Set `actionTimeout` to roughly one-third of `test timeout`.
This allows a test to make progress through multiple actions before the
full test timeout is reached.

---

## Q210.6 — What is assertion timeout and why is it separate from action timeout?

**Assertion timeout** applies to `expect()` calls. Playwright assertions
are auto-retrying — if the condition is not met immediately, Playwright
retries the assertion until it passes or the assertion timeout expires.

Assertions are separate from actions because:
- Actions are about element state (visible, enabled, stable)
- Assertions are about application state (text content, URL, visibility)

A 5-second assertion timeout is often sufficient for UI updates after
user actions. A 10-second action timeout is needed for actions that may
wait for the element to appear.

```typescript
// This assertion retries for up to 5 seconds (default expect.timeout)
await expect(page.getByRole('alert')).toHaveText('Saved successfully');

// Override for a specific assertion that may take longer
await expect(page.getByTestId('report-table')).toBeVisible({ timeout: 15_000 });
```

If you find yourself increasing assertion timeouts on every test, the real
fix is usually to add a `waitForResponse()` before the assertion — so you
only assert after the data has actually arrived.

---

## Q210.7 — What is the difference between page.waitForTimeout and expect-based waiting?

`page.waitForTimeout(ms)` — a hard sleep. Execution pauses for exactly
the specified duration. The test waits this long regardless of application state.

`expect(locator).toBeVisible()` (and other assertions) — condition-based
waiting. Playwright retries until the condition is met or the timeout expires.
The test completes early if the condition passes before the timeout.

```typescript
// waitForTimeout — hard sleep, always slow, fragile
await page.waitForTimeout(3000);
await page.getByRole('alert').click(); // What if alert appeared in 500ms?

// Assertion-based — fast, reliable, explicit
await expect(page.getByRole('alert')).toBeVisible(); // Passes as soon as visible
await page.getByRole('alert').click();
```

`waitForTimeout` is officially documented as only suitable for debugging.
It should never appear in a production test suite. Each occurrence adds
fixed delay and makes tests fragile — if the application is slower one day,
`waitForTimeout(1000)` is no longer enough; if it is faster, you waited
for nothing.

**Use `waitForTimeout` for:** debugging, visual inspection during development.
**Never use it:** in committed test code.

---

## Q210.8 — What is waitForSelector and when should you use it?

`page.waitForSelector(selector, options)` waits for a DOM element matching
the selector to reach a specific state: `'visible'`, `'hidden'`,
`'attached'`, or `'detached'`.

```typescript
// Wait for an element to appear (attached + visible by default)
await page.waitForSelector('.data-table');

// Wait for an element to disappear
await page.waitForSelector('.loading-spinner', { state: 'hidden' });

// Wait for element to be in DOM but possibly hidden
await page.waitForSelector('[data-ready]', { state: 'attached' });

// Wait for element to be removed from DOM
await page.waitForSelector('.toast-message', { state: 'detached' });
```

**When to use it:** when you need to wait for an element that does not yet
exist before applying a locator to it. This is rare because locator-based
auto-waiting usually covers this.

The modern alternative is `locator.waitFor(options)`:

```typescript
// Modern locator-based approach — preferred
await page.locator('.data-table').waitFor({ state: 'visible' });
await page.locator('.loading-spinner').waitFor({ state: 'hidden' });
```

---

## Q210.9 — What is waitForResponse and when do you use it?

`page.waitForResponse(urlOrPredicate)` waits for a network response
matching the given URL pattern or predicate function. It resolves with
the matching `Response` object.

```typescript
// Wait for a specific endpoint
const response = await page.waitForResponse('**/api/users');

// Wait for a POST to /api/orders that returns 201
const response = await page.waitForResponse(
  r => r.url().includes('/api/orders') && r.method() === 'POST' && r.status() === 201
);

// Always start listening BEFORE the action that triggers the request
const [response] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/search')),
  page.getByRole('button', { name: 'Search' }).click(),
]);
const results = await response.json();
```

**Use it when:** the UI update depends on an API call completing. Without
`waitForResponse`, you may assert the UI before the data has loaded, causing
intermittent failures on slower environments.

---

## Q210.10 — What is waitForFunction and when is it appropriate?

`page.waitForFunction(pageFunction)` evaluates a function in the browser
context repeatedly until it returns a truthy value.

```typescript
// Wait for a global variable to be set by the application
await page.waitForFunction(() => window.appReady === true);

// Wait for a DOM condition more complex than a selector state
await page.waitForFunction(
  () => document.querySelectorAll('.row').length >= 10
);

// Wait for an animation to complete (checking CSS property)
await page.waitForFunction(() => {
  const el = document.querySelector('.progress-bar');
  return el && getComputedStyle(el).width === '100%';
});
```

**Use it when:** the condition you are waiting for cannot be expressed with
a locator state, URL, or network event. This is the escape hatch for complex
client-side state.

**Avoid it for:** conditions that can be expressed as assertions —
`expect(locator).toHaveText('Done')` is more readable and maintainable than
`waitForFunction(() => document.querySelector('.status').textContent === 'Done')`.

---

## Q210.11 — How do you configure timeouts at different levels?

Playwright supports timeout configuration at four levels, each overriding
the previous for its scope:

**Level 1 — Global (playwright.config.ts):**
```typescript
export default defineConfig({
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
});
```

**Level 2 — Test file (test.describe or test):**
```typescript
test('complex upload flow', async ({ page }) => {
  test.setTimeout(120_000); // 2 minutes for this test only
  // ...
});
```

**Level 3 — Individual action:**
```typescript
// Override timeout for one specific action
await page.getByRole('button', { name: 'Generate Report' }).click({ timeout: 60_000 });

// Override timeout for one assertion
await expect(page.locator('.report')).toBeVisible({ timeout: 60_000 });
```

**Level 4 — test.slow():**
```typescript
test('runs on slow network emulation', async ({ page }) => {
  test.slow(); // Triples the test timeout and all action timeouts
  // ...
});
```

Later levels override earlier ones. A per-action timeout overrides the
global `actionTimeout` for that one call only.

---

## Q210.12 — What is the difference between waitForLoadState and waitForURL?

`page.waitForLoadState(state)` waits for the page to reach a browser loading
state — `'load'`, `'domcontentloaded'`, or `'networkidle'`. It does not care
about the URL.

`page.waitForURL(urlPattern)` waits for the current URL to match a pattern.
It does not care about the page loading state — it resolves as soon as the
URL matches.

```typescript
// waitForLoadState — wait for resources to be loaded
await page.getByRole('link', { name: 'Reports' }).click();
await page.waitForLoadState('domcontentloaded');

// waitForURL — wait for navigation to complete to a specific URL
await page.getByRole('button', { name: 'Sign In' }).click();
await page.waitForURL('/dashboard');

// The modern assertion equivalent of waitForURL
await page.getByRole('button', { name: 'Sign In' }).click();
await expect(page).toHaveURL('/dashboard'); // preferred — also an assertion
```

Use `waitForLoadState` when you need to ensure the page is ready for interaction.
Use `waitForURL` (or the assertion form `expect(page).toHaveURL()`) when you
need to verify that navigation reached the correct destination.

---

## Q210.13 — What is networkidle and when should you avoid it?

`'networkidle'` is a `waitUntil` / `waitForLoadState` option that waits
until there are no more than 0 active network connections for at least 500ms.

It is the most complete way to confirm that an application has finished
loading all resources — but it is also the most fragile.

**Avoid `networkidle` when:**
- The page has a WebSocket connection (chat, real-time updates) — the
  WebSocket keeps the connection count above zero permanently
- The page has polling (background API calls every few seconds) — the
  network never fully idles
- The page loads analytics or tracking scripts that fire on a delay

**Use `networkidle` when:**
- You are generating a PDF or screenshot of a fully-rendered page
- You are testing a static or near-static page with no background activity

```typescript
// Fragile on apps with WebSocket — may time out
await page.goto('/realtime-dashboard', { waitUntil: 'networkidle' });

// Better for most apps
await page.goto('/realtime-dashboard', { waitUntil: 'domcontentloaded' });
await expect(page.getByTestId('chart')).toBeVisible(); // wait for key element
```

---

## Q210.14 — What is the waitFor method on a locator?

`locator.waitFor(options)` waits for the element matched by the locator to
reach a specific state. It is the locator-based successor to `waitForSelector`.

```typescript
const spinner = page.locator('.loading-spinner');
const table   = page.getByRole('table');

// Wait for spinner to disappear
await spinner.waitFor({ state: 'hidden' });

// Wait for table to appear
await table.waitFor({ state: 'visible' });

// With custom timeout
await table.waitFor({ state: 'visible', timeout: 15_000 });
```

Available states: `'attached'`, `'detached'`, `'visible'`, `'hidden'`.

`locator.waitFor()` is preferred over `page.waitForSelector()` because it
uses the locator you have already defined — it stays consistent with the
rest of your locator strategy.

---

## Q210.15 — Write code that waits for a loading spinner to disappear before asserting.

A spinner that disappears after data loads is a very common pattern.
The correct approach is to wait for the spinner to become hidden, then
assert the loaded content:

```typescript
test('data table loads after spinner disappears', async ({ page }) => {
  await page.goto('/reports');

  // Page shows a spinner while data loads
  const spinner = page.getByTestId('loading-spinner');
  const table   = page.getByRole('table');

  // Wait for spinner to be gone — data is loaded
  await spinner.waitFor({ state: 'hidden', timeout: 15_000 });

  // Now assert the table content
  await expect(table).toBeVisible();
  await expect(table.getByRole('row')).toHaveCount(10);
});
```

An alternative using `expect` assertions:

```typescript
// Using assertions — works because toBeHidden retries automatically
await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 15_000 });
await expect(page.getByRole('table')).toBeVisible();
```

---

## Q210.16 — How do you handle a test that occasionally needs more time?

Use `test.slow()` to triple all timeouts for a specific test, or set a
custom timeout with `test.setTimeout()`:

```typescript
test('report generation takes up to 90 seconds', async ({ page }) => {
  // Triple all timeouts (test + action + navigation + assertion × 3)
  test.slow();

  await page.goto('/reports');
  await page.getByRole('button', { name: 'Generate Full Report' }).click();
  await expect(page.getByTestId('report-download-link')).toBeVisible({
    timeout: 90_000, // this specific assertion may take 90 seconds
  });
});

// OR — set a specific test timeout
test('bulk data import', async ({ page }) => {
  test.setTimeout(180_000); // 3 minutes for this test only

  await page.goto('/import');
  await page.setInputFiles('#file-input', 'large-dataset.csv');
  await page.getByRole('button', { name: 'Import' }).click();
  await expect(page.getByRole('status')).toHaveText('Import complete');
});
```

Do not increase the global timeout in `playwright.config.ts` for one slow
test. Use per-test overrides so the global remains tight for all other tests.

---

## Q210.17 — What anti-patterns in waits have you removed from your project?

In our project, we inherited a Selenium-style suite that had been partially
migrated to Playwright. The suite was full of explicit sleep calls that we
systematically replaced.

**Pattern 1 — `waitForTimeout` before assertions:**

```typescript
// Before — hard sleep
await page.waitForTimeout(3000);
await expect(page.getByRole('alert')).toHaveText('Saved');

// After — assertion-based retry
await expect(page.getByRole('alert')).toHaveText('Saved'); // retries for 5s
```

**Pattern 2 — Sequential `waitForResponse` calls:**

```typescript
// Before — sequential, slow
await page.getByRole('button', { name: 'Load Dashboard' }).click();
await page.waitForResponse('**/api/users');
await page.waitForResponse('**/api/stats');
await page.waitForResponse('**/api/events');

// After — parallel, fast
const [,, ] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/users')),
  page.waitForResponse(r => r.url().includes('/api/stats')),
  page.waitForResponse(r => r.url().includes('/api/events')),
  page.getByRole('button', { name: 'Load Dashboard' }).click(),
]);
```

The parallel pattern cut dashboard test execution by 35%.

---

## Q210.18 — What is the most complex timeout scenario you have debugged?

In our project, we had a test for a report generation feature that was
consistently timing out in CI but passing locally. The test ran well within
the 30-second timeout locally, but CI builds were taking 60+ seconds on
the same test.

Investigation:

1. We added `page.on('request')`  and `page.on('response')` listeners to log
   all network traffic in CI. We found that the report API was being called
   twice — once by the frontend automatically on page load, and once by the
   test's click action.
2. The first API call was populating a cache. The second call was a cache miss
   in CI because the CI database was cold.
3. The test was using `waitForTimeout(5000)` (legacy code) between the click
   and the assertion. On local, the cached response came back in 400ms.
   In CI, the cold database took 8 seconds.

Fix:

```typescript
// Before — fragile timeout
await page.getByRole('button', { name: 'Generate' }).click();
await page.waitForTimeout(5000); // Not enough in CI
await expect(page.getByTestId('report-link')).toBeVisible();

// After — event-driven
const [response] = await Promise.all([
  page.waitForResponse(r =>
    r.url().includes('/api/reports/generate') && r.status() === 200
  ),
  page.getByRole('button', { name: 'Generate' }).click(),
]);
await expect(page.getByTestId('report-link')).toBeVisible();
```

The lesson: `waitForTimeout` masks real timing dependencies. Replace it
with `waitForResponse` or assertion-based waits that react to actual events.

---

## Chapter Summary

- Auto-waiting checks six actionability conditions (attached, visible, stable, receives events, enabled, editable) before every action.
- Four timeout types: `test timeout`, `actionTimeout`, `navigationTimeout`, and `expect timeout`. Each applies at a different scope.
- `waitForTimeout` is a hard sleep and should never appear in production test code. Replace it with assertion-based or event-based waits.
- `waitForResponse` + `Promise.all` is the reliable pattern for assertions that depend on API data.
- `waitForFunction` is the escape hatch for complex browser-side conditions that cannot be expressed as locator states.
- `test.slow()` triples all timeouts for one test. `test.setTimeout(ms)` sets a specific value. Use these instead of inflating the global timeout.
- `'networkidle'` is fragile on pages with WebSockets or background polling. Prefer `'domcontentloaded'` + key element assertion.
