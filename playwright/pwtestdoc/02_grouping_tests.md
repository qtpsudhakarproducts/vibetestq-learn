# 02 — Grouping Tests with describe

## The Scenario

You have been working on the OrangeHRM login spec for a week. It now has 15 tests — happy path, invalid credentials, empty fields, session timeout, SSO, password reset, and a few edge cases. The file looks like this:

```typescript
test('valid credentials redirect to dashboard @smoke', ...)
test('invalid password shows error @regression', ...)
test('empty username shows Required @regression', ...)
test('empty password shows Required @regression', ...)
test('unknown username shows error @regression', ...)
test('session expires after inactivity @regression', ...)
test('forgot password link navigates to reset page @regression', ...)
test('reset password email is sent @regression', ...)
test('reset password with valid token works @regression', ...)
test('reset password with expired token shows error @regression', ...)
test('SSO button is visible @regression', ...)
test('SSO redirects to identity provider @regression', ...)
test('logout clears session @regression', ...)
test('logout redirects to login page @regression', ...)
test('back button after logout does not restore session @regression', ...)
```

It works. All 15 tests run. But there is a problem — when 3 tests fail, you see this in the terminal:

```
✅ valid credentials redirect to dashboard
❌ reset password with expired token shows error
✅ SSO button is visible
❌ logout clears session
✅ back button after logout does not restore session
❌ forgot password link navigates to reset page
```

The failures are scattered. To understand what area is broken, you have to read each failing title and mentally group them. Is this a reset password bug? A logout bug? An unrelated set of failures? The flat list gives you no structure to reason from.

Now imagine this is not 15 tests but 200. You need structure.

---

## What describe Does

`test.describe()` groups related tests under a named heading. It does three things that matter:

**1. Creates hierarchy in reports**
Tests appear under their group name — not as a flat list. You can see at a glance which area has failures.

**2. Scopes hooks to the group**
A `beforeEach` inside a describe only runs for tests inside that describe. It does not leak into other groups. This means each group can have its own setup without interfering with others.

**3. Scopes test.use() to the group**
Configuration overrides (like viewport size or base URL) declared inside a describe apply only to tests inside it.

---

## Basic describe

```typescript
import { test, expect } from '../../fixtures/baseFixture';

test.describe('Login — Standard Authentication', () => {

  test('valid credentials redirect to dashboard @smoke', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');
    await loginPage.expectDashboard();
  });

  test('invalid password shows Invalid credentials error @regression', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('Admin', 'wrongpassword');
    await loginPage.expectInvalidCredentialsError();
  });

  test('empty username shows Required validation @regression', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('', 'admin123');
    await loginPage.expectRequiredError('Username');
  });

});

test.describe('Login — Password Reset', () => {

  test('forgot password link navigates to reset page @regression', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.clickForgotPassword();
    await loginPage.expectResetPasswordPage();
  });

  test('reset password with expired token shows error @regression', async ({ loginPage, resetPage }) => {
    await resetPage.openWithExpiredToken();
    await resetPage.expectExpiredTokenError();
  });

});

test.describe('Login — Logout', () => {

  test('logout clears session @regression', async ({ loginPage, dashboardPage }) => {
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');
    await dashboardPage.logout();
    await loginPage.expectSessionCleared();
  });

  test('back button after logout does not restore session @regression', async ({ loginPage, dashboardPage }) => {
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');
    await dashboardPage.logout();
    await loginPage.goBack();
    await loginPage.expectLoginPage();
  });

});
```

Now the terminal output looks like:

```
Login — Standard Authentication
  ✅ valid credentials redirect to dashboard
  ✅ invalid password shows Invalid credentials error
  ✅ empty username shows Required validation

Login — Password Reset
  ✅ forgot password link navigates to reset page
  ❌ reset password with expired token shows error

Login — Logout
  ❌ logout clears session
  ✅ back button after logout does not restore session
```

Two failures, two different areas. You immediately know the reset password area and the logout area need attention — without reading a single line of test code.

---

## The Full Title of a Test

When you put a test inside a describe, Playwright composes the full title as:

```
[describe title] > [test title]
```

So `'valid credentials redirect to dashboard'` inside `'Login — Standard Authentication'` becomes:

```
Login — Standard Authentication > valid credentials redirect to dashboard
```

This full title is what you use when filtering from the CLI with `--grep`, and what appears in JUnit XML reports, JSON reports, and CI tool annotations. Understanding this matters when you want to run just one group:

```bash
# Run only the Password Reset group
npx playwright test --grep "Login — Password Reset"

# Run only one specific test by its full title
npx playwright test --grep "Login — Standard Authentication > valid credentials"
```

---

## Nested describe — Sub-Groups Within a Group

As a module grows more complex, you may need sub-groups within a group. Describes can be nested to reflect the feature's own structure.

Consider the Add Employee module in OrangeHRM. The form has multiple sections: Basic Information, Custom Fields, User Credentials, and a Save action. Each section has its own validation rules.

```typescript
test.describe('Add Employee', () => {

  test.describe('Basic Information', () => {
    test('first name is required @regression', async ({ addEmployeePage }) => {});
    test('last name is required @regression', async ({ addEmployeePage }) => {});
    test('employee ID must be unique @regression', async ({ addEmployeePage }) => {});
    test('saves with first name, last name and ID @smoke', async ({ addEmployeePage }) => {});
  });

  test.describe('User Credentials', () => {
    test('username must be unique @regression', async ({ addEmployeePage }) => {});
    test('password must meet complexity rules @regression', async ({ addEmployeePage }) => {});
    test('credentials are optional @regression', async ({ addEmployeePage }) => {});
  });

  test.describe('Form Actions', () => {
    test('Save button submits the form @smoke', async ({ addEmployeePage }) => {});
    test('Cancel returns to employee list @regression', async ({ addEmployeePage }) => {});
  });

});
```

Report output:
```
Add Employee
  Basic Information
    ✅ first name is required
    ✅ last name is required
    ❌ employee ID must be unique
    ✅ saves with first name, last name and ID
  User Credentials
    ✅ username must be unique
    ✅ password must meet complexity rules
    ✅ credentials are optional
  Form Actions
    ✅ Save button submits the form
    ✅ Cancel returns to employee list
```

One failure, clearly in the Basic Information section, specifically around the employee ID.

**How deep should you nest?** Two levels is the right limit for most projects. A third level usually means the spec file is trying to cover too much and should be split into separate files. Deeply nested describes are hard to read and make the full test title very long.

---

## Hooks Scope to Their describe

This is one of the most important practical consequences of grouping. Hooks declared inside a describe apply only to tests in that describe.

Consider the employee list page. Before each test, you need to navigate to the list page. But you do not want that navigation to happen before tests in the Add Employee group — they need to start on the add employee form, not the list.

```typescript
test.describe('Employee List', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/web/index.php/pim/viewEmployeeList');
    // Only runs before tests in 'Employee List'
    // Has no effect on tests in 'Add Employee'
  });

  test('shows employees by default @smoke', async ({ page }) => {
    // Page is already on the list — beforeEach ran
  });

  test('search filters results @regression', async ({ page }) => {
    // Page is already on the list — beforeEach ran
  });

});

test.describe('Add Employee', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/web/index.php/pim/addEmployee');
    // Only runs before tests in 'Add Employee'
    // The Employee List beforeEach never runs here
  });

  test('saves with valid data @smoke', async ({ page }) => {
    // Page is on the add form — its own beforeEach ran
  });

});
```

Each describe group manages its own setup in isolation. If you added a `beforeEach` at the file level (outside any describe), it would run for all tests in the file. That is intentional and useful — covered in the Hooks notes.

---

## test.use() Scope to describe

`test.use()` overrides configuration for tests within a describe. Outside the describe, the original configuration is restored.

Scenario: You need to test how the OrangeHRM UI looks on mobile. You do not want to change the global viewport — that would affect all your tests. You only want the mobile viewport for the mobile layout tests.

```typescript
test.describe('Mobile Layout', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14

  test('navigation menu collapses to hamburger @regression', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
    // Runs with 390×844 mobile viewport
  });

  test('login form is usable on small screen @regression', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    // Also runs with 390×844 mobile viewport
  });
});

test.describe('Desktop Layout', () => {
  // No test.use() here — falls back to the global config viewport (1280×720)

  test('sidebar navigation is fully visible @smoke', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('navigation')).toBeVisible();
    // Runs with the default 1280×720 viewport
  });
});
```

This scoping makes `describe` + `test.use()` a clean way to run the same tests under different configurations without duplicating files.

---

## describe.only — Focus an Entire Group

You are working on the Password Reset feature. You want to run only those tests while you develop.

```typescript
test.describe.only('Login — Password Reset', () => {
  // Only tests inside this describe run
  // All other describes across all files are skipped

  test('forgot password link navigates to reset page @regression', ...)
  test('reset email is sent to registered address @regression', ...)
  test('reset password with valid token works @regression', ...)
});
```

**The same rule applies as `test.only`** — this is a local debugging tool only. Never commit `describe.only`. Protect with `forbidOnly: !!process.env.CI` in your config. If it reaches CI, your entire test suite silently stops running except one group.

---

## describe.skip — Disable an Entire Group

Your team just got the news that the Recruitment module environment is not ready. All recruitment tests will fail because the module is not deployed. You do not want 20 false failures cluttering the CI report.

```typescript
test.describe.skip('Recruitment Module', () => {
  // All tests in this group are skipped
  // They still appear in the report as skipped — not hidden

  test('post job vacancy @smoke', async ({ recruitmentPage }) => {});
  test('shortlist candidate @regression', async ({ recruitmentPage }) => {});
  test('schedule interview @regression', async ({ recruitmentPage }) => {});
});
```

Important distinction: `describe.skip` is always static — it skips unconditionally. If you need to skip based on a runtime condition (environment variable, browser, etc.), put the condition inside a `beforeEach` or inside each test.

---

## describe.fixme — Mark a Group as Broken

The v2.1 release was deployed to staging. The entire Leave module is broken. 12 tests are failing. The fix will come in the next sprint.

`describe.skip` could work, but `describe.fixme` is more honest. It tells anyone reading the report: this is not disabled on purpose — it is broken and being tracked.

```typescript
test.describe.fixme('Leave Module — broken in v2.1 regression — ticket #PW-201', () => {

  test('apply annual leave @smoke', async ({ leavePage }) => {});
  test('approve leave request @regression', async ({ leavePage }) => {});
  test('reject leave request @regression', async ({ leavePage }) => {});
  test('leave balance updates after approval @regression', async ({ leavePage }) => {});
  // All 12 tests — skipped, grouped under fixme in the report

});
```

In the HTML report, fixme groups are shown under a dedicated section. Your manager opens the report, sees "Fixme (12)" and immediately knows there is a tracked regression in the Leave module. They do not see 12 red failures. CI stays green.

---

## describe.parallel — Run a Group's Tests Concurrently

By default, tests within a file run sequentially — one after another. `describe.parallel` changes this for a specific group, making its tests run concurrently in separate workers.

Scenario: You have 5 smoke tests that each just load a different page and verify the heading is visible. They are completely independent — each navigates to its own URL, creates no shared data, reads no shared state. Running them sequentially wastes time.

```typescript
test.describe.parallel('Page Load Smoke Tests', () => {
  // These 5 tests run simultaneously — not one after another

  test('dashboard page loads @smoke', async ({ page }) => {
    await page.goto('/web/index.php/dashboard/index');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('employee list page loads @smoke', async ({ page }) => {
    await page.goto('/web/index.php/pim/viewEmployeeList');
    await expect(page.getByRole('heading', { name: 'Employee List' })).toBeVisible();
  });

  test('leave list page loads @smoke', async ({ page }) => {
    await page.goto('/web/index.php/leave/viewLeaveList');
    await expect(page.getByRole('heading', { name: 'Leave List' })).toBeVisible();
  });

  test('time attendance page loads @smoke', async ({ page }) => {
    await page.goto('/web/index.php/time/viewTimeModule');
    await expect(page.getByRole('heading', { name: 'Time' })).toBeVisible();
  });

  test('admin panel loads @smoke', async ({ page }) => {
    await page.goto('/web/index.php/admin/viewAdminModule');
    await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
  });

});
```

5 tests that would take 15 seconds sequentially now take 3–4 seconds — limited only by the number of workers.

**The essential prerequisite:** Tests inside `describe.parallel` must be completely independent. They cannot share state, cannot depend on each other's output, cannot rely on execution order. If they share state and run simultaneously, you get race conditions and intermittent failures that are very hard to debug.

---

## describe.serial — Force Sequential, Same Worker

The opposite of parallel. Forces tests to run in order in the same worker. And the critical behaviour: **if one test fails, all subsequent tests in the group are skipped automatically**.

Scenario: You are testing the multi-step employee creation wizard. Step 1 creates the employee. Step 2 adds their department. Step 3 assigns their work schedule. Step 4 creates their login credentials. Each step depends on the previous one having succeeded. If step 1 fails — the employee was not created — there is no point running steps 2, 3, or 4. They will all fail for the same reason, creating noise in the report.

```typescript
test.describe.serial('Employee Creation Wizard', () => {

  test('step 1: basic information saved successfully', async ({ page }) => {
    await page.goto('/web/index.php/pim/addEmployee');
    await page.getByPlaceholder('First Name').fill('Priya');
    await page.getByPlaceholder('Last Name').fill('Sharma');
    await page.getByLabel('Employee Id').fill('EMP0099');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Successfully Saved')).toBeVisible();
  });

  test('step 2: department assigned successfully', async ({ page }) => {
    // Depends on step 1 having created the employee
    await page.getByLabel('Department').selectOption('Engineering');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Successfully Saved')).toBeVisible();
  });

  test('step 3: login credentials created successfully', async ({ page }) => {
    // Depends on steps 1 and 2
    await page.getByRole('tab', { name: 'Account' }).click();
    await page.getByLabel('Username').fill('priya.sharma');
    await page.getByLabel('Password').fill('Admin@1234');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Successfully Saved')).toBeVisible();
  });

  // If step 1 fails → steps 2 and 3 are automatically skipped
  // You see one failure in the report, not three
});
```

**Use `serial` carefully.** Test dependency is a design smell — independent tests are always preferable. But for genuine multi-step workflows where the steps are inseparable, `serial` is the right tool. The auto-skip-on-failure behaviour is its key advantage over just writing tests in order without the serial modifier.

---

## describe.configure — Combining Mode and Retries

`describe.configure` is the explicit way to set parallelism mode and retries together on a group. It is more flexible than `describe.parallel` or `describe.serial` alone because it lets you combine options.

Scenario: Your payment flow tests must run in order (serial), but each step is critical enough to deserve 2 retries before giving up.

```typescript
test.describe('Payment Flow', () => {
  test.describe.configure({ mode: 'serial', retries: 2 });
  // Sequential AND each test gets 2 retries before failing

  test('initiate payment', async ({ paymentPage }) => {});
  test('confirm payment details', async ({ paymentPage }) => {});
  test('verify payment receipt', async ({ paymentPage }) => {});
});
```

Scenario: You want parallel execution for a group but the global config uses default (sequential) mode. Rather than changing the global config, you configure just this group:

```typescript
test.describe('API Health Checks', () => {
  test.describe.configure({ mode: 'parallel' });

  test('employee API responds @smoke', async ({ request }) => {});
  test('leave API responds @smoke', async ({ request }) => {});
  test('auth API responds @smoke', async ({ request }) => {});
});
```

**All options for describe.configure:**

| Option | Type | Values | Effect |
|---|---|---|---|
| `mode` | string | `'default'`, `'parallel'`, `'serial'` | Controls execution order for the group |
| `retries` | number | Any positive integer | Overrides retry count for all tests in the group |

`'default'` means the group follows whatever the global `fullyParallel` setting says.

---

## Hook Execution Order in Nested describes

When describes are nested, understanding the execution order of hooks is essential for debugging setup problems.

```typescript
test.describe('Outer', () => {
  test.beforeAll(() => console.log('1 — Outer beforeAll'));
  test.beforeEach(() => console.log('3 — Outer beforeEach'));
  test.afterEach(() => console.log('6 — Outer afterEach'));
  test.afterAll(() => console.log('8 — Outer afterAll'));

  test.describe('Inner', () => {
    test.beforeAll(() => console.log('2 — Inner beforeAll'));
    test.beforeEach(() => console.log('4 — Inner beforeEach'));
    test.afterEach(() => console.log('5 — Inner afterEach'));
    test.afterAll(() => console.log('7 — Inner afterAll'));

    test('the test', async () => {
      console.log('→ TEST RUNS');
    });
  });
});
```

Output:
```
1 — Outer beforeAll
2 — Inner beforeAll
3 — Outer beforeEach
4 — Inner beforeEach
→ TEST RUNS
5 — Inner afterEach
6 — Outer afterEach
7 — Inner afterAll
8 — Outer afterAll
```

The rule: **setup wraps from outside in, teardown unwraps from inside out.** Outer setup runs first, inner setup runs last (closest to the test). Inner teardown runs first, outer teardown runs last (furthest from the test).

Practical application: if a test fails with a setup error, this order tells you which `beforeEach` most likely caused it — the innermost one that ran just before the test.

---

## Organising a Real OrangeHRM Project

Here is how a real project folder structure maps to describe organisation:

```
tests/
  auth/
    login.spec.ts
      └── describe('Login — Standard Auth')
      └── describe('Login — Password Reset')
      └── describe('Login — SSO')

  pim/
    employee-list.spec.ts
      └── describe('Employee List — Search')
      └── describe('Employee List — Pagination')

    add-employee.spec.ts
      └── describe('Add Employee')
           └── describe('Basic Information')
           └── describe('User Credentials')
           └── describe('Form Actions')

    edit-employee.spec.ts
      └── describe('Edit Employee')

  leave/
    apply-leave.spec.ts
      └── describe('Apply Leave')

    approve-leave.spec.ts
      └── describe('Approve Leave')

  time/
    attendance.spec.ts
      └── describe('Attendance Tracking')
```

**One top-level describe per spec file.** The file name and the describe name should match. When you see the test in a report, you immediately know which file to open.

---

## When to Use a Nested describe vs a Separate File

This is a judgment call, but there are clear signals:

| Use a nested describe when | Use a separate file when |
|---|---|
| Tests share the same `beforeEach` navigation | Tests need different setup entirely |
| The sub-group is a section of the same form | The sub-group is a different page |
| The sub-group has 3–6 tests | The sub-group has 8+ tests |
| Context is a sub-section of one feature | Context is a distinct feature |

A useful test: if you find yourself writing a `beforeEach` inside a nested describe that navigates to a completely different URL than the outer describe's `beforeEach`, that nested describe probably wants to be its own file.

---

## Key Points

- `describe` creates hierarchy in reports, scopes hooks, and scopes `test.use()` — three distinct benefits
- The full test title is `[describe] > [test title]` — this is what `--grep` matches and what CI tools show
- Nest describes to reflect the feature's sub-structure — stay at 2 levels maximum
- Hooks inside a describe only run for tests inside that describe — they do not leak outward
- `test.use()` inside a describe applies only to that describe — use for viewport, baseURL, locale overrides
- `describe.only` — focus a group locally; never commit; `forbidOnly` in CI config is the safety net
- `describe.skip` — always static; test still appear as skipped in the report; not hidden
- `describe.fixme` — marks the group as broken and tracked; distinct category in report from skipped
- `describe.parallel` — tests run concurrently; only safe when tests are fully independent
- `describe.serial` — tests run in order, same worker; subsequent tests auto-skip if one fails
- `describe.configure({ mode, retries })` — explicit, combinable; use when you need both mode and retry override together
- Hook order: outer setup → inner setup → test → inner teardown → outer teardown
- One top-level describe per file; file name should match describe name
