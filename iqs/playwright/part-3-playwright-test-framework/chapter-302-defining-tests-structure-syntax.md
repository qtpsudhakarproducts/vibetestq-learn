# Chapter 302 — Defining Tests — Structure & Syntax

This chapter opens Part 3 — the Playwright Test Framework. It covers the
`test()` function: how to write a test, how to name it well, how to structure
it with Arrange/Act/Assert, and how to control test execution with `test.only`,
`test.skip`, `test.fixme`, `test.fail`, and `test.slow`. Interviewers test
this chapter early — these are the building blocks every other answer builds on.

---

## Q302.1 — What is the test() function in Playwright?

`test()` is the function you use to define a single test case in Playwright.
It registers the test with the Playwright test runner and gives it a title,
an async function body, and optionally a details object.

```typescript
import { test, expect } from '@playwright/test';

test('user sees dashboard after login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL('/dashboard');
});
```

The function passed to `test()` always receives a fixtures object as its
first argument. The most commonly used fixture is `page` — a fresh browser
page for each test. Fixtures are covered fully in Chapter 32.

---

## Q302.2 — What are the two signatures of the test() function?

`test()` accepts two signatures:

**Short form** — title and body only:
```typescript
test('test title', async ({ page }) => {
  // test body
});
```

**Long form** — title, details object, and body:
```typescript
test(
  'test title',
  { tag: '@smoke', annotation: { type: 'issue', description: 'TICKET-42' } },
  async ({ page }) => {
    // test body
  }
);
```

The details object supports: `tag`, `annotation`, `timeout`, and `retries`.
Use the long form when a test needs metadata — tags for filtering, annotations
for linking to issue trackers, or a per-test timeout override.

---

## Q302.3 — How do you write test titles in your project?

In our project, we write test titles as sentences that describe the expected
behaviour — written for the failure report, not for the reader of the code.

Good titles answer the question: "If this test fails, what broke?"

```typescript
// ✅ Good — specific, self-explanatory in a failure report
test('user sees error message when password is incorrect', ...)
test('cart total updates when item quantity changes', ...)
test('admin can delete an employee with no leave records', ...)

// ❌ Bad — vague, requires opening the test to understand what failed
test('login test', ...)
test('check cart', ...)
test('employee deletion', ...)
```

We also include a tag at the end of titles to support suite-level filtering:
`@smoke` for critical path tests and `@regression` for the full suite.

---

## Q302.4 — What is the Arrange / Act / Assert pattern?

Arrange / Act / Assert (AAA) is a three-phase structure for test bodies.

**Arrange** — set up the starting state. Navigate to the right page,
pre-populate data, put the application in the state the test needs.

**Act** — perform the action being tested. Click the button, submit the
form, trigger the event.

**Assert** — verify the outcome. Check that the UI shows the right result.

```typescript
test('form shows success message on valid submission', async ({ page }) => {
  // ARRANGE — navigate to starting state
  await page.goto('/contact');

  // ACT — perform the action under test
  await page.getByLabel('Name').fill('Alice Johnson');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByRole('button', { name: 'Send' }).click();

  // ASSERT — verify the outcome
  await expect(page.getByRole('alert')).toHaveText('Message sent successfully');
});
```

AAA is valuable because a failing test tells you exactly which phase broke.
If ACT fails, the interaction itself is broken. If ASSERT fails, the action
completed but produced the wrong result — that is a real application bug.

---

## Q302.5 — What is the one-behaviour-per-test rule?

Each test should verify exactly one behaviour. A test that checks multiple
independent outcomes at once hides failures and makes debugging harder.

```typescript
// ❌ One test, multiple outcomes — hides failures
test('employee form works', async ({ page }) => {
  await page.goto('/employees/add');
  await page.getByLabel('First Name').fill('Alice');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Saved successfully')).toBeVisible(); // outcome 1
  await expect(page).toHaveURL(/\/employees\/\d+/);                 // outcome 2
  await expect(page.getByLabel('First Name')).toHaveValue('Alice'); // outcome 3
});
// If outcome 1 fails, outcomes 2 and 3 never run.
// You learn about one failure per run.

// ✅ Three tests, one behaviour each — all three run independently
test('save shows success message', async ({ page }) => { ... });
test('save redirects to employee profile', async ({ page }) => { ... });
test('profile shows the submitted name', async ({ page }) => { ... });
```

The exception is a genuine multi-step workflow. In that case, use `test.step()`
to name the phases inside a single test. That is covered in Chapter 26.

---

## Q302.6 — What does test.only do and why should it never be committed?

`test.only()` tells Playwright to run only that test — all other tests in
the file (and the project) are skipped. It is a local debugging tool.

```typescript
test.only('add employee with duplicate ID shows error', async ({ page }) => {
  // Only this test runs when you run the suite
});
```

The danger: if `test.only` is committed and pushed to the repository, CI
runs only that one test. The pipeline reports green while all other tests
are silently skipped. Bugs ship.

Protect against this with one config line:

```typescript
// playwright.config.ts
export default defineConfig({
  forbidOnly: !!process.env.CI,
});
```

With this setting, if `test.only` reaches CI, the entire run fails immediately:
```
Error: focused item found in the --forbid-only mode
```

That is the correct outcome — a clear failure rather than silent coverage loss.

---

## Q302.7 — What is test.skip and when do you use it?

`test.skip()` prevents a test from running. The test still appears in the
HTML report as "skipped" — it is not hidden. The team can see it exists
and knows it is not running.

```typescript
// Unconditional skip — test is not ready yet
test.skip('export to PDF @regression', async ({ page }) => {
  // Feature not deployed in test environment
});

// Conditional skip — skip only on specific browser or environment
test('invoice download works', async ({ page }) => {
  test.skip(
    test.info().project.name === 'firefox',
    'Download API not supported in Firefox test environment'
  );
  // Runs on Chromium and WebKit, skipped on Firefox
});
```

Always include the reason string. Without it, the report shows "skipped"
with no explanation — the team cannot tell if it is a deliberate choice
or a forgotten test.

**Use `test.skip` when:** a feature is not yet deployed, a dependency is
unavailable, or a test is environment-specific and does not apply here.

---

## Q302.8 — What is test.fixme and how is it different from test.skip?

Both `test.fixme` and `test.skip` prevent a test from running. The difference
is what they communicate:

- `test.skip` says: this is deliberately disabled
- `test.fixme` says: this is broken and someone needs to fix it

In the HTML report, fixme tests appear under a separate "Fixme" section —
distinct from "Skipped". At a glance, the team can see how many tests are
intentionally disabled vs how many are broken and awaiting repair.

```typescript
// Broken after a v2.0 regression — ticket #PW-99
test.fixme('apply leave shows confirmation — ticket #PW-99', async ({ page }) => {
  // Body still skipped, but the intent is "this is broken"
});

// Conditional fixme — only broken on one browser
test('date range picker selects correct dates', async ({ page }) => {
  test.fixme(
    test.info().project.name === 'webkit',
    'Date picker broken on Safari after v2.0 upgrade — ticket #PW-102'
  );
});
```

**Use `test.fixme`** when a test is broken due to a known bug or regression,
and the intent is to return and fix it. Use it with a ticket reference.

---

## Q302.9 — What is test.fail and when is it the right tool?

`test.fail()` marks a test as expected to fail. The test still runs. Playwright
inverts its pass/fail logic:

- If the test fails as expected → reported as **healthy** (expected failure)
- If the test passes unexpectedly → reported as **"unexpected pass"** (alerts the team)

```typescript
// Known product bug — ticket #BUG-123
test.fail('bulk delete crashes with employees having leave records — bug #123',
  async ({ page }) => {
    await page.goto('/employees');
    await page.getByLabel('Select All').check();
    await page.getByRole('button', { name: 'Delete Selected' }).click();
    await expect(page.getByRole('alert')).toHaveText('Deleted successfully');
    // Currently crashes before reaching the assertion — expected failure
  }
);
```

**Why this matters:** without `test.fail`, your only options are to delete
the test (losing coverage) or leave it failing (breaking CI). `test.fail`
keeps the test running, keeps CI green, and alerts you automatically when
the bug is fixed — you see "unexpected pass" in the report.

**Use `test.fail`** for known product bugs with an open ticket.
**Use `test.fixme`** for broken test scripts (the test code needs repair).

---

## Q302.10 — What is test.slow?

`test.slow()` multiplies all timeouts for that test by 3 — test timeout,
action timeout, and assertion timeout. It is a relative modifier, not
a hardcoded number.

```typescript
test('bulk report generation completes', async ({ page }) => {
  test.slow(); // 3× global timeouts for this test only
  await page.goto('/reports');
  await page.getByRole('button', { name: 'Generate Annual Report' }).click();
  await expect(page.getByTestId('download-link')).toBeVisible();
});
```

If the global test timeout is 30 seconds, `test.slow()` gives this test
90 seconds. If you later change the global timeout to 60 seconds, `test.slow()`
automatically becomes 180 seconds — no code change needed.

**Use `test.slow`** for tests that are inherently slow — large file uploads,
report generation, email flows. Do not use it as a substitute for fixing
flakiness caused by missing waits.

---

## Q302.11 — What is the difference between test.skip, test.fixme, and test.fail?

| | Runs? | Report category | Use when |
|---|---|---|---|
| `test.skip` | No | Skipped | Intentionally disabled |
| `test.fixme` | No | Fixme | Broken, needs repair |
| `test.fail` | Yes | Expected failure | Known product bug |

The key distinction is between intent and behaviour:

- Skip and fixme both prevent execution — the difference is intent. Skip is
  a deliberate choice; fixme is a broken test awaiting repair.
- Fail runs the test — it keeps the code path covered and alerts you when
  the bug is resolved.

**Use skip** for missing features or environment conditions.
**Use fixme** for broken test scripts with a ticket reference.
**Use fail** for known application bugs — keeps CI green and coverage intact.

---

## Q302.12 — How do you add a tag to a test?

Tags are strings prefixed with `@` that you include in the test title or
in the details object. They enable CLI-based filtering of test runs.

```typescript
// Tag in the title (simple, widely used)
test('user can log in @smoke', async ({ page }) => { ... });
test('password reset sends email @regression', async ({ page }) => { ... });

// Tag in the details object (structured, supports multiple tags)
test(
  'checkout completes with valid card',
  { tag: ['@smoke', '@checkout'] },
  async ({ page }) => { ... }
);
```

Run tests by tag:
```bash
npx playwright test --grep @smoke        # run all smoke tests
npx playwright test --grep "@smoke|@api" # smoke OR api
npx playwright test --grep-invert @slow  # everything except slow
```

In our project, every test has at least one tag. We use `@smoke` for the
critical path (about 20 tests) and `@regression` for the full suite.
PRs run `@smoke` only. Nightly runs execute the full suite.

---

## Q302.13 — How do you attach custom annotations to a test?

Custom annotations add metadata visible in HTML reports and JSON output.
They link tests to external systems like Jira or Confluence.

```typescript
// Via the details object (declared at test definition)
test(
  'order confirmation email is sent',
  {
    annotation: [
      { type: 'issue', description: 'https://jira.example.com/browse/QA-42' },
      { type: 'owner', description: 'checkout-team' },
    ]
  },
  async ({ page }) => { ... }
);

// Via testInfo at runtime (conditional — available inside the test body)
test('payment flow completes', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://jira.example.com/browse/PAY-77'
  });
  // ...
});
```

Custom annotations appear in the HTML report alongside the test result.
They also appear in JSON and JUnit XML output — which means CI dashboards
and issue-tracker integrations can consume them programmatically.

---

## Q302.14 — How do you set a custom timeout for one test?

Pass a `timeout` in the details object or use `test.setTimeout()` inside
the test body:

```typescript
// Via details object (declared at definition)
test(
  'large CSV import completes',
  { timeout: 120_000 }, // 2 minutes for this test only
  async ({ page }) => { ... }
);

// Via test.setTimeout() inside the body
test('bulk report generation', async ({ page }) => {
  test.setTimeout(90_000); // 90 seconds
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByTestId('report-link')).toBeVisible();
});
```

Per-test timeouts override the global `timeout` in `playwright.config.ts`
for that test only. All other tests keep the global value.

---

## Q302.15 — Write a complete, well-structured test with tags, AAA pattern, and a conditional skip.

```typescript
import { test, expect } from '@playwright/test';

test(
  'admin can delete an employee with no leave records @smoke',
  { tag: '@admin' },
  async ({ page }) => {
    // ARRANGE — navigate and confirm employee exists
    await page.goto('/employees');
    await expect(page.getByText('Alice Johnson')).toBeVisible();

    // Skip on Firefox — delete confirmation dialog behaves differently
    test.skip(
      test.info().project.name === 'firefox',
      'Delete dialog not rendering correctly on Firefox — ticket #ENV-55'
    );

    // ACT — click delete and confirm the dialog
    await page.getByRole('row', { name: /Alice Johnson/ })
               .getByRole('button', { name: 'Delete' })
               .click();

    page.once('dialog', dialog => dialog.accept());

    // ASSERT — employee is removed
    await expect(page.getByText('Alice Johnson')).not.toBeVisible();
    await expect(page.getByRole('alert')).toHaveText('Employee deleted successfully');
  }
);
```

---

## Q302.16 — How do you set retries for a specific test?

Pass a `retries` value in the details object or call `test.info().retry`
inside the body to check the current attempt:

```typescript
// Retry this specific test up to 2 times on failure
test(
  'payment gateway responds within 5 seconds',
  { retries: 2 },
  async ({ page }) => { ... }
);

// Conditional logic based on retry number
test('flaky third-party widget loads', async ({ page }) => {
  if (test.info().retry > 0) {
    // Second attempt — reload before proceeding
    await page.reload();
  }
  await expect(page.getByTestId('widget-container')).toBeVisible();
});
```

Global retries are set in `playwright.config.ts`. Per-test retries override
the global value for that test only. Retries are covered fully in Chapter 43.

---

## Q302.17 — In your project, how do you use test.fail for known bugs?

In our project, we treat CI green as a strict signal — a red build means
something unexpected broke. `test.fail` is how we keep CI green for known
product bugs without losing test coverage.

Our convention: every `test.fail` must include the bug ticket in the title
and cannot be merged without a linked ticket in our issue tracker.

```typescript
test.fail(
  'checkout summary shows incorrect tax for EU customers — bug #SHOP-412',
  async ({ page }) => {
    await page.goto('/checkout');
    await page.getByTestId('country-select').selectOption('DE');
    await page.getByRole('button', { name: 'Proceed' }).click();

    // Expected: 19% VAT applied
    // Actual: 0% applied — bug confirmed
    await expect(page.getByTestId('tax-line')).toHaveText('VAT: 19%');
  }
);
```

When the engineering team fixes the bug, the test starts passing — Playwright
reports it as "unexpected pass" in the HTML report. That is our trigger to
remove `test.fail` and let the test pass normally. It is a clean feedback loop.

---

## Q302.18 — What is the testInfo object and what information does it expose?

`testInfo` is the second argument passed to every test function. It gives
access to metadata about the currently running test.

```typescript
test('reads testInfo metadata', async ({ page }, testInfo) => {
  console.log(testInfo.title);        // "reads testInfo metadata"
  console.log(testInfo.file);         // "/tests/example.spec.ts"
  console.log(testInfo.retry);        // 0 (first run), 1 (first retry)
  console.log(testInfo.project.name); // "chromium"
  console.log(testInfo.status);       // "passed", "failed", "skipped"

  // Attach a screenshot to the test report
  await testInfo.attach('screenshot', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });

  // Attach a JSON file
  await testInfo.attach('api-response', {
    body: JSON.stringify({ orderId: '123' }),
    contentType: 'application/json',
  });
});
```

`testInfo` is most useful in:
- Custom fixtures (checking retry count to clean up before a retry)
- `afterEach` hooks (attaching screenshots only on failure)
- Custom reporters (reading annotations and metadata)

`testInfo` is covered more deeply in Chapter 27.

---

## Chapter Summary

- `test(title, body)` is the basic form. `test(title, details, body)` adds tags, annotations, timeout, and retries.
- Write test titles for the failure report — specific sentences that explain what broke without opening the file.
- Arrange / Act / Assert: one test, one behaviour. Failing phase tells you exactly what broke.
- `test.only` — local debugging only. Protect CI with `forbidOnly: !!process.env.CI`.
- `test.skip` — disabled, visible in report. Always include a reason string.
- `test.fixme` — broken, needs repair. Separate report category from skipped. Use with a ticket reference.
- `test.fail` — runs but expected to fail. Keeps CI green for known bugs. Reports "unexpected pass" when bug is fixed.
- `test.slow` — triples all timeouts. Relative, not hardcoded — adjusts automatically when global timeout changes.
