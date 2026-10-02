# 01 — Defining Tests

## The Scenario

You have just joined a team automating OrangeHRM. Your first task is to write a test for the login page. The login page has a username field, a password field, and a Login button. When valid credentials are entered, the user is redirected to the dashboard. When invalid credentials are entered, an error message appears.

You need to write a test that verifies this behaviour. Where do you start?

---

## What Is a Test in Playwright

In Playwright, a test is a **titled async function** that you hand to `test()`. That is all it is structurally. But what makes it powerful is what Playwright does around it.

When you run `npx playwright test`, Playwright:
1. Discovers all spec files matching your `testMatch` pattern
2. Collects every `test()` call across all those files
3. Distributes them across parallel worker processes
4. Injects the fixtures each test needs (like `page`, your page objects)
5. Runs each test body, tracks the outcome
6. Enforces timeouts, handles retries
7. Collects everything into a report

You write the test body. Playwright manages everything else around it. This separation is what makes test code clean — you focus on what to test, not on infrastructure.

---

## Importing test and expect

Before writing any test, you need to import two things:

```typescript
import { test, expect } from '@playwright/test';
```

- `test` — the function you use to define tests, describe blocks, hooks, and fixtures
- `expect` — the assertion library used to verify outcomes

In a real project with custom page object fixtures, you will import from your own fixtures file instead of directly from `@playwright/test`. This is covered fully in the Fixtures notes. The important thing to know now is that `test` and `expect` always ultimately come from Playwright — your fixtures file just extends them.

```typescript
// Real project — import from your fixtures file
import { test, expect } from '../fixtures/baseFixture';
```

---

## Your First Test

Here is the login test written in its simplest form:

```typescript
import { test, expect } from '@playwright/test';

test('valid credentials redirect to dashboard', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/dashboard/);
});
```

Three parts to understand:

**The title** — `'valid credentials redirect to dashboard'`
This is the name of the test. It appears in the terminal, the HTML report, the JUnit XML, everywhere results are shown. Write it so that reading the title alone tells you what the test verifies.

**The fixtures parameter** — `{ page }`
`page` is a browser tab injected by Playwright. You did not create it, you did not set it up — Playwright created a fresh browser tab for this test and handed it to you. When the test finishes, Playwright closes it. Each test gets its own isolated `page`.

**The body** — `async ({ page }) => { ... }`
The async function that does the actual work. Every action — navigation, filling fields, clicking, asserting — is asynchronous and must be awaited.

---

## The Two Signatures of test()

`test()` has two forms. Understanding both lets you choose the right one for the situation.

### Signature 1 — Title and Body

```typescript
test(title: string, body: (fixtures) => Promise<void>): void
```

The simple form. Use this when the test needs no special configuration — no custom timeout, no tags, no annotations.

```typescript
test('valid credentials redirect to dashboard', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/dashboard/);
});
```

### Signature 2 — Title, Details, and Body

```typescript
test(title: string, details: TestDetails, body: (fixtures) => Promise<void>): void
```

The extended form. Use this when the test needs configuration — tags for filtering, annotations for traceability, a custom timeout, or custom retry count.

```typescript
test(
  'valid credentials redirect to dashboard',
  {
    tag: ['@smoke', '@auth'],
    annotation: { type: 'issue', description: 'https://jira.example.com/AUTH-01' },
    timeout: 60_000,
    retries: 2,
  },
  async ({ page }) => {
    await page.goto('/web/index.php/auth/login');
    await page.getByPlaceholder('Username').fill('Admin');
    await page.getByPlaceholder('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/dashboard/);
  }
);
```

The details object keeps all the configuration outside the body. The body stays focused purely on what the test does — navigate, interact, assert. This separation becomes important when you have 200 tests and you are reading through them quickly.

### Details Object — All Options

| Option | Type | Purpose |
|---|---|---|
| `tag` | `string \| string[]` | Labels for CLI filtering. `@smoke` to run critical tests only, `@regression` for the full suite |
| `annotation` | `object \| object[]` | Metadata attached to the test — issue tracker links, owner, priority. Appears in HTML report |
| `timeout` | `number` | Override the global test timeout for this specific test only, in milliseconds |
| `retries` | `number` | Override the global retry count for this specific test only |

---

## Writing Good Test Titles

Imagine your suite has 200 tests. They all just ran in CI and 3 failed. You open the report. The first thing you see is the test titles. If those titles are vague, you open each failing test, read the code, and figure out what it was testing. If those titles are specific, you know what broke just by reading them.

**The pattern: `[what was being tested] [what the condition was] [what should have happened]`**

```typescript
// ❌ Vague — useless when this fails at 2am
test('login', ...)
test('test 1', ...)
test('check form', ...)

// ✅ Specific — you know exactly what broke without opening the file
test('valid credentials redirect to dashboard', ...)
test('invalid password shows Invalid credentials error', ...)
test('empty username field shows Required validation message', ...)
test('login page shows username and password fields', ...)
test('forgot password link navigates to reset page', ...)
```

In the second set, each title tells you the scenario being tested and the expected outcome. When one fails, you already know what the bug is before you even open the test.

In a real project, test titles also appear in:
- **JUnit XML** consumed by CI tools like Jenkins or Azure DevOps
- **JSON reports** processed by dashboards
- **Slack notifications** when CI fails
- **Git blame** comments referencing test names in tickets

Good titles make all of these more useful.

---

## Why Everything Is async/await

Every interaction with the browser — navigation, clicking, filling, waiting, asserting — happens over a protocol between Node.js and the browser. It is inherently asynchronous.

`async/await` is the mechanism that lets you write this asynchronous code as if it were synchronous — each line waits for the previous one to finish before continuing.

```typescript
test('login flow', async ({ page }) => {
  await page.goto('/login');                              // wait: page fully loaded
  await page.getByPlaceholder('Username').fill('Admin'); // wait: field filled
  await page.getByPlaceholder('Password').fill('admin123'); // wait: field filled
  await page.getByRole('button', { name: 'Login' }).click(); // wait: click done
  await expect(page).toHaveURL(/dashboard/);             // wait: URL matches
});
```

Each `await` tells JavaScript: pause here until this Promise resolves, then continue to the next line.

**What happens if you forget `await`:**

```typescript
test('broken login', async ({ page }) => {
  page.goto('/login');           // starts navigation but does NOT wait
  page.getByPlaceholder('Username').fill('Admin'); // runs before page loaded
  // → field does not exist yet → error or wrong element
});
```

Without `await`, all three lines fire simultaneously. The fill tries to run before the page has loaded. The test either fails immediately with an element-not-found error or behaves unpredictably. This is one of the most common mistakes when starting with Playwright.

---

## The Arrange / Act / Assert Structure

Every test you write, regardless of what it is testing, should follow this three-part structure. This is not a Playwright rule — it is a fundamental principle of test design.

```
ARRANGE — establish the starting state
ACT     — perform the action you are testing
ASSERT  — verify the outcome
```

Applied to the login test:

```typescript
test('valid credentials redirect to dashboard', async ({ page }) => {

  // ARRANGE — get to the starting state
  await page.goto('/web/index.php/auth/login');

  // ACT — perform the action under test
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();

  // ASSERT — verify what should have happened
  await expect(page).toHaveURL(/dashboard/);
});
```

This structure matters because when a test fails, you immediately know which phase failed:
- If ARRANGE fails — the test could not even set up. Environment problem.
- If ACT fails — the interaction itself broke. UI changed, element missing.
- If ASSERT fails — the action completed but produced the wrong outcome. A real bug.

In a real project with page objects, the structure becomes even cleaner:

```typescript
test('valid credentials redirect to dashboard @smoke', async ({ loginPage }) => {

  // ARRANGE
  await loginPage.goto();

  // ACT
  await loginPage.login('Admin', 'admin123');

  // ASSERT
  await loginPage.expectDashboard();
});
```

Three lines. Each one is a different phase. If the test fails, the line number tells you exactly which phase broke.

---

## One Test, One Behaviour

Consider this scenario: you are writing tests for the Add Employee form. You want to verify that after a successful save, the success message appears, the employee appears in the employee list, and the form resets. Should that be one test or three?

It should be three tests.

```typescript
// ❌ One test checking multiple unrelated outcomes
test('add employee works', async ({ addEmployeePage, employeeListPage }) => {
  await addEmployeePage.goto();
  await addEmployeePage.fillFirstName('Priya');
  await addEmployeePage.fillLastName('Sharma');
  await addEmployeePage.clickSave();

  // Three different things being verified:
  await expect(page.getByText('Successfully Saved')).toBeVisible();      // thing 1
  await employeeListPage.goto();
  await expect(page.getByText('Priya Sharma')).toBeVisible();            // thing 2
  await addEmployeePage.goto();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('');     // thing 3
});
```

If assertion 1 passes but assertion 2 fails, assertion 3 never runs. You only learn about one failure per test run. To find all three failures, you have to run the test three times, fixing one assertion each time.

```typescript
// ✅ Three tests, each verifying one specific outcome
test('save shows success message @smoke', async ({ addEmployeePage }) => {
  await addEmployeePage.goto();
  await addEmployeePage.fillFirstName('Priya');
  await addEmployeePage.fillLastName('Sharma');
  await addEmployeePage.clickSave();
  await expect(page.getByText('Successfully Saved')).toBeVisible();
});

test('saved employee appears in employee list @regression', async ({ addEmployeePage, employeeListPage }) => {
  await addEmployeePage.createEmployee({ firstName: 'Priya', lastName: 'Sharma' });
  await employeeListPage.goto();
  await expect(page.getByText('Priya Sharma')).toBeVisible();
});

test('form resets after save @regression', async ({ addEmployeePage }) => {
  await addEmployeePage.createEmployee({ firstName: 'Priya', lastName: 'Sharma' });
  await addEmployeePage.goto();
  await expect(page.getByPlaceholder('First Name')).toHaveValue('');
});
```

Now all three run independently. If all three fail, you see all three failures at once. Each test title tells you exactly what is broken.

The exception is a genuine multi-step workflow — like a wizard form that spans multiple pages and cannot be meaningfully split. In that case, use `test.step()` to break it into named phases within a single test. That is covered in the Test Steps notes.

---

## Controlling Test Execution — test.only, test.skip, test.fixme, test.fail, test.slow

Back to the OrangeHRM scenario. You now have 30 tests written across the login, employee, and leave modules. One test is failing — the "add employee with duplicate ID" test. You want to work on it without running all 30 tests every time.

### test.only — Focus on One Test

```typescript
test.only('add employee with duplicate ID shows error', async ({ addEmployeePage }) => {
  // Only this test runs — all 29 others are skipped
});
```

`test.only` tells Playwright: run only this test. Everything else is skipped. This is purely a local debugging tool.

**The critical rule:** Never commit `test.only` to your repository. If it reaches CI, only that one test runs. The pipeline shows green while 29 tests are silently not running. Nobody notices. Bugs ship.

Protect against this by adding one line to your config:

```typescript
// playwright.config.ts
export default defineConfig({
  forbidOnly: !!process.env.CI,
});
```

With `forbidOnly: true` in CI, if anyone commits `test.only`, the entire pipeline immediately fails with a clear error message:

```
Error: focused item found in the --forbid-only mode
```

That is a much better outcome than silently losing test coverage.

---

Now a different scenario. Your team is building the Recruitment module. The tests for it are written but the module is not deployed in the test environment yet. Running those tests would fail — not because of a bug, but because the feature does not exist yet. What do you do?

### test.skip — Disable a Test

```typescript
test.skip('job vacancy appears in list @smoke', async ({ recruitmentPage }) => {
  // This test will not run
  // It still appears in the report as "skipped" — it is not hidden
});
```

`test.skip` prevents the test from running. Critically, the test still appears in the HTML report as skipped — it is visible, not invisible. Your team knows it exists and knows it is not running.

**Conditional skip** — skip only under specific conditions:

```typescript
test('PDF export generates file', async ({ page }) => {
  test.skip(
    test.info().project.name === 'firefox',
    'PDF export uses Chrome print API — not supported on Firefox'
  );
  // Runs on Chrome and Safari, skipped on Firefox
  // The reason string appears in the report next to the skipped test
});
```

```typescript
test('admin panel is accessible', async ({ page }) => {
  test.skip(
    process.env.USER_ROLE !== 'admin',
    'Requires admin credentials — set USER_ROLE=admin in environment'
  );
});
```

Always include the reason. Future-you and your teammates will read that reason in the report and immediately understand why the test was skipped. Without it, skipped tests become a mystery.

---

Different scenario. The v2.0 release was deployed and it broke the Leave module. Three tests are now failing. It is Friday afternoon. The bug is logged as ticket #PW-99 for next sprint. You cannot fix it now. What do you do with the failing tests?

### test.fixme — Mark as Broken, Needs Fixing

```typescript
test.fixme('apply leave shows confirmation message — ticket #PW-99', async ({ leavePage }) => {
  // Test is broken due to the v2.0 regression
  // Skipped for now, but clearly marked as needing attention
});
```

`test.fixme` is semantically different from `test.skip`. Both prevent the test from running, but:
- `test.skip` says: this is deliberately disabled
- `test.fixme` says: this is broken and needs to be fixed

In the HTML report, fixme tests appear as their own category — separate from skipped tests. At a glance, the team can see how many tests are broken and need attention, versus how many are intentionally disabled.

**Conditional fixme:**
```typescript
test('date range picker selects correct dates', async ({ page }) => {
  test.fixme(
    test.info().project.name === 'webkit',
    'Date picker broken on Safari after v2.0 upgrade — ticket #PW-102'
  );
  // Runs on Chrome and Firefox, marked as fixme on Safari
});
```

---

Different scenario again. The "bulk delete" feature has a known bug — it crashes when you try to delete an employee that has associated leave records. Bug #123 is logged. It will be fixed in the next sprint. You do not want to delete the test (you lose coverage), but you also cannot leave it as a failing test (CI is always red and alerts lose meaning). What do you do?

### test.fail — Document a Known Bug Without Breaking CI

```typescript
test.fail('bulk delete crashes when employee has leave records — bug #123', async ({ employeeListPage }) => {
  await employeeListPage.goto();
  await employeeListPage.selectEmployeeWithLeaveRecords();
  await employeeListPage.clickDelete();
  await expect(employeeListPage.getSuccessMessage()).toBeVisible();
  // Currently: crashes before reaching the assertion
});
```

`test.fail` inverts the pass/fail logic:
- If the test **fails** as expected → reported as healthy (expected failure)
- If the test **passes** unexpectedly → reported as a problem (unexpected pass)

This is the most important tool for managing known bugs in a live test suite. The test keeps running. You keep the coverage. CI stays green. And when the bug is fixed and the test starts passing, Playwright reports it as an "unexpected pass" — your signal to remove `test.fail` and let the test pass normally.

Without `test.fail`, your only options are to delete the test (losing coverage) or leave it failing (breaking CI). Neither is good. `test.fail` is the right tool.

**Conditional test.fail:**
```typescript
test('report generation completes successfully', async ({ reportsPage }) => {
  test.fail(
    test.info().project.name === 'firefox',
    'Report generation times out on Firefox — bug #456, fix in v2.1'
  );
  await reportsPage.generateReport('Annual Leave Summary');
  await expect(reportsPage.getDownloadLink()).toBeVisible();
});
```

---

Last scenario in this section. Your "full employee onboarding" test covers a complete workflow — add employee, set up user credentials, assign to a department, set work schedule. It takes 45 seconds. The default test timeout is 30 seconds. The test times out every time, even though it is working correctly.

### test.slow — Extend Timeout for Legitimately Slow Tests

```typescript
test('full employee onboarding workflow @e2e', async ({ page }) => {
  test.slow();
  // Default timeout: 30s
  // After test.slow(): 90s (3× multiplier)
  // The test now has enough time to complete
});
```

`test.slow()` multiplies the configured timeout by 3. The reason to use a multiplier rather than a hardcoded number:

```typescript
// ❌ Hardcoded — if the team later raises the global timeout to 60s,
//    this stays at 90s and does not adapt
test('slow workflow', { timeout: 90_000 }, async ({ page }) => {});

// ✅ Relative — if global timeout is raised to 60s,
//    this automatically becomes 180s
test('slow workflow', async ({ page }) => {
  test.slow();
});
```

**Conditional slow:**
```typescript
test('CSV export downloads file', async ({ page }) => {
  test.slow(
    test.info().project.name === 'webkit',
    'File download takes longer on Safari'
  );
  await page.getByRole('button', { name: 'Export CSV' }).click();
  await expect(page.getByText('Download complete')).toBeVisible();
});
```

Use `test.slow()` for tests that are slow by nature — file generation, email delivery, multi-step workflows. If a test is slow because of poor test design (unnecessary `waitForTimeout` calls, missing proper waits), fix the test design instead of masking it with `test.slow()`.

---

## The Expected Status System

Every test in Playwright has two status values:

| Property | What It Means |
|---|---|
| `expectedStatus` | What Playwright expects: `'passed'` normally, `'failed'` for `test.fail()`, `'skipped'` for `test.skip()` |
| `status` | What actually happened: `'passed'`, `'failed'`, `'timedOut'`, `'skipped'` |

A test is considered healthy when `status === expectedStatus`.

This is the engine behind `test.fail()`. When you mark a test with `test.fail()`, Playwright sets `expectedStatus` to `'failed'`. When the test actually fails, `status === expectedStatus` — the test is healthy. When the bug gets fixed and the test passes, `status` is `'passed'` but `expectedStatus` is still `'failed'` — mismatch, reported as unexpected pass.

You can use both properties in `afterEach` to act on unexpected outcomes:

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();

  if (info.status !== info.expectedStatus) {
    // Something unexpected happened — capture the page state
    await info.attach('unexpected-outcome-screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    console.log(`Unexpected: expected ${info.expectedStatus}, got ${info.status}`);
  }
});
```

---

## A Complete, Well-Structured Test File

Putting it all together — here is what a real login spec file looks like with all these concepts applied:

```typescript
// tests/auth/login.spec.ts

import { test, expect } from '../../fixtures/baseFixture';

test.describe('Login', () => {

  // ── Happy path ─────────────────────────────────────────────────────
  test(
    'valid credentials redirect to dashboard',
    { tag: '@smoke' },
    async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
      await loginPage.expectDashboard();
    }
  );

  // ── Validation ─────────────────────────────────────────────────────
  test(
    'invalid password shows Invalid credentials error',
    { tag: '@regression' },
    async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login('Admin', 'wrongpassword');
      await loginPage.expectInvalidCredentialsError();
    }
  );

  test(
    'empty username shows Required validation',
    { tag: '@regression' },
    async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login('', 'admin123');
      await loginPage.expectRequiredError('Username');
    }
  );

  test(
    'empty password shows Required validation',
    { tag: '@regression' },
    async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login('Admin', '');
      await loginPage.expectRequiredError('Password');
    }
  );

  // ── Browser-specific skip ──────────────────────────────────────────
  test('SSO login button is visible', async ({ loginPage }) => {
    test.skip(
      test.info().project.name === 'firefox',
      'SSO not configured in Firefox test environment — ticket #ENV-12'
    );
    await loginPage.goto();
    await loginPage.expectSSOButtonVisible();
  });

  // ── Known bug — does not break CI ──────────────────────────────────
  test.fail(
    'remember me keeps session after browser restart — bug #88',
    async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.loginWithRememberMe('Admin', 'admin123');
      await loginPage.simulateBrowserRestart();
      await loginPage.expectStillLoggedIn();
    }
  );

  // ── Feature in development ─────────────────────────────────────────
  test.fixme(
    'biometric login via fingerprint — feature in sprint 15',
    async ({ loginPage }) => {}
  );

});
```

---

## Key Points

- A test is a titled async function registered with `test()` — Playwright manages everything around it
- Two signatures: `test(title, body)` for simple tests, `test(title, details, body)` for tests needing tags, annotations, timeout, or retries
- Write test titles for the failure report — specific, self-explanatory, no reader should need to open the test to understand what broke
- Every action is `async/await` — missing `await` causes race conditions and flaky failures
- Arrange / Act / Assert — one test, one behaviour; failing assertion tells you exactly which phase broke
- `test.only` — local debugging only; never commit; protect with `forbidOnly: !!process.env.CI`
- `test.skip` — intentionally disabled; always include a reason; test stays visible in report
- `test.fixme` — broken and needs fixing; separate category in report from skipped; use with ticket reference
- `test.fail` — expected to fail; keeps CI green for known bugs; alerts you when bug is fixed via "unexpected pass"
- `test.slow` — multiplies timeout by 3; relative to global config, not hardcoded
- `expectedStatus` vs `status` — the engine behind `test.fail()`; read both in `afterEach` to detect unexpected outcomes
