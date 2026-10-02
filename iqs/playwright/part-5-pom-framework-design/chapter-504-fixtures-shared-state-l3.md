# Chapter 504 — Fixtures & Shared State (L3)

This chapter covers Playwright's custom fixture system — the mechanism that
eliminates repeated login setup, injects pre-authenticated page objects
directly into tests, and introduces multi-role testing via `storageState`.
Interviewers consistently ask about fixtures at senior level: a candidate
who can explain `test.extend()`, describe the `use()` boundary between setup
and teardown, and articulate why `storageState` is faster than UI login for
every test is demonstrating production-level framework knowledge.

---

## Q504.1 — What problem do custom fixtures solve at Level 3?

Every authenticated test at Level 2 starts with the same four-line setup:

```typescript
test.beforeEach(async ({ page }) => {
  loginPage     = new LoginPage(page);
  dashboardPage = new DashboardPage(page);
  await loginPage.goto();
  await loginPage.login('Admin', 'admin123');
  await dashboardPage.assertPageLoaded();
});
```

With three test files this is manageable. With twenty test files covering
PIM, Admin, Leave, and Recruitment — each with multiple describe blocks —
every single test file repeats this ceremony.

Two problems compound:

**Speed:** driving the full login UI for every test wastes 2–4 seconds per
test on the shared OrangeHRM demo site. A 50-test suite loses 2–3 minutes
to repeated authentication that adds zero testing value.

**Noise:** the login code is setup infrastructure, not test logic. It
clutters every test file and makes it harder to read what the test actually
tests.

Level 3 fixes both with `test.extend()` and `storageState`.

---

## Q504.2 — What is a Playwright fixture?

A Playwright fixture is a dependency injection mechanism. Instead of a test
creating and setting up everything it needs itself, fixtures prepare those
things and inject them as parameters.

The built-in `page` fixture illustrates the concept:

```typescript
// page is a fixture — Playwright creates it, injects it, cleans it up
test('some test', async ({ page }) => {
  await page.goto('/login');
  // You never created page, never worried about closing it
});
```

Custom fixtures work exactly the same way — but you define them:

```typescript
// employeeListPage is a custom fixture — your code creates it
test('admin can add employee', async ({ employeeListPage, addEmployeePage }) => {
  // employeeListPage is already authenticated and navigated
  // Test starts with the page object ready — no setup needed
  await employeeListPage.clickAddEmployee();
  await addEmployeePage.addEmployee('Alice', 'Johnson', 'EMP-001');
  await addEmployeePage.assertEmployeeSavedSuccessfully();
});
```

The fixture handles authentication, navigation, and page object instantiation.
The test focuses entirely on its scenario.

---

## Q504.3 — How do you define custom fixtures with test.extend()?

```typescript
// fixtures/index.ts
import { test as base, expect } from '@playwright/test';
import { EmployeeListPage }     from '../pages/pim/EmployeeListPage';
import { AddEmployeePage }      from '../pages/pim/AddEmployeePage';

// Step 1 — declare the fixture types
type OrangeHRMFixtures = {
  employeeListPage: EmployeeListPage;
  addEmployeePage:  AddEmployeePage;
};

// Step 2 — extend the base test object with your fixture implementations
const test = base.extend<OrangeHRMFixtures>({

  employeeListPage: async ({ page }, use) => {
    // SETUP — runs before the test
    const employeeList = new EmployeeListPage(page);
    await employeeList.goto();
    await employeeList.assertPageLoaded();
    // use() — injects the value into the test
    await use(employeeList);
    // TEARDOWN — runs after the test (add cleanup here if needed)
  },

  addEmployeePage: async ({ page }, use) => {
    const addEmployee = new AddEmployeePage(page);
    await addEmployee.goto();
    await addEmployee.assertPageLoaded();
    await use(addEmployee);
  },

});

// Step 3 — export as test so all test files use the same extended object
export { test, expect };
```

Test files import `test` from this file, not from `@playwright/test`:
```typescript
// tests/pim/employee.spec.ts
import { test, expect } from '../../fixtures';  // ← fixture-enriched test
```

---

## Q504.4 — What is the use() function in a fixture definition?

`use()` is the boundary between setup and teardown in a fixture:

```typescript
employeeListPage: async ({ page }, use) => {
  // ─── SETUP ─────────────────────────────────────────────
  // Everything before use() runs before the test starts
  const employeeList = new EmployeeListPage(page);
  await employeeList.goto();
  await employeeList.assertPageLoaded();

  // ─── INJECTION ─────────────────────────────────────────
  // use() hands the value to the test and waits for the test to finish
  await use(employeeList);

  // ─── TEARDOWN ──────────────────────────────────────────
  // Everything after use() runs after the test finishes
  // Add cleanup here: delete test data, reset state, etc.
  // For most page fixtures, no teardown is needed
};
```

The fixture function is suspended at `await use()` while the test runs.
When the test finishes (pass or fail), the fixture resumes after `use()`
and runs teardown. This guarantees teardown always runs — even when the
test throws an error.

---

## Q504.5 — What is storageState and how does it eliminate UI login?

`storageState` is Playwright's mechanism for saving and restoring full
browser authentication state — cookies, localStorage, sessionStorage — to
a JSON file.

**The process:**
1. A global setup script logs in via UI once and saves the browser state
2. Tests that need authentication load the saved state file
3. The browser starts already authenticated — no login form, no credentials

```
Level 2 flow per test:
Browser opens → Navigate to /login → Fill username → Fill password → Click Login
→ Assert dashboard → [Test body] ← 3-4 seconds lost per test

Level 3 flow per test:
Browser opens → Load admin.json → [Test body] ← 0 seconds lost
```

On a 50-test suite with 3-second login per test: 150 seconds (2.5 minutes)
saved. On a 200-test CI run: 10 minutes saved every run.

---

## Q504.6 — What does global-setup.ts look like?

```typescript
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig): Promise<void> {
  const { baseURL } = config.projects[0].use;
  const browser     = await chromium.launch();

  // ─── Save Admin Session ──────────────────────────────────────
  const adminContext = await browser.newContext();
  const adminPage    = await adminContext.newPage();

  await adminPage.goto(`${baseURL}/web/index.php/auth/login`);
  await adminPage.getByPlaceholder('Username').fill('Admin');
  await adminPage.getByPlaceholder('Password').fill('admin123');
  await adminPage.getByRole('button', { name: 'Login' }).click();
  await adminPage.waitForURL(/dashboard/);  // confirm login succeeded

  // Save cookies + localStorage to file
  await adminContext.storageState({ path: 'playwright/.auth/admin.json' });
  await adminContext.close();

  // ─── Save ESS User Session ───────────────────────────────────
  const essContext = await browser.newContext();
  const essPage    = await essContext.newPage();

  await essPage.goto(`${baseURL}/web/index.php/auth/login`);
  await essPage.getByPlaceholder('Username').fill('alice.johnson');
  await essPage.getByPlaceholder('Password').fill('Alice@1234');
  await essPage.getByRole('button', { name: 'Login' }).click();
  await essPage.waitForURL(/dashboard/);

  await essContext.storageState({ path: 'playwright/.auth/ess.json' });
  await essContext.close();

  await browser.close();
}

export default globalSetup;
```

Register it in `playwright.config.ts`:
```typescript
export default defineConfig({
  globalSetup: './global-setup.ts',
  // ...
});
```

`globalSetup` runs once before all tests and workers. The auth files are
created once and reused by every subsequent test.

---

## Q504.7 — How does the storageState reach individual tests?

The storage state is not loaded inside fixtures — it is loaded by the
Playwright project configuration. Projects in `playwright.config.ts` specify
which auth file to use:

```typescript
// playwright.config.ts
projects: [
  {
    name: 'admin',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/admin.json',  // ← admin session
    },
    testMatch: ['**/tests/pim/**', '**/tests/admin/**'],
  },
  {
    name: 'ess',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/ess.json',    // ← ESS session
    },
    testMatch: ['**/tests/leave/**/apply*.spec.ts'],
  },
  {
    name: 'no-auth',
    use: { ...devices['Desktop Chrome'] },          // ← no session
    testMatch: ['**/tests/login.spec.ts'],
  },
],
```

When the `admin` project runs `tests/pim/employee.spec.ts`, every `page`
fixture in that test file starts with the admin cookies loaded. The fixtures
(e.g., `employeeListPage`) receive this pre-authenticated `page` automatically
— they do not need to know anything about how authentication happened.

---

## Q504.8 — Why do login tests NOT use authenticated fixtures?

Login tests test the login flow itself — they need a fresh, unauthenticated
browser session:

```typescript
// tests/login.spec.ts
// Intentionally imports from @playwright/test, not from fixtures
import { test, expect } from '@playwright/test';
import { LoginPage }    from '../pages/LoginPage';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.assertPageLoaded();
  });

  test('invalid password shows error @smoke', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('Admin', 'wrongpassword');
    await loginPage.assertInvalidCredentialsError();
  });
});
```

If login tests used a pre-authenticated fixture, they would start already
logged in. Tests that verify the login error message would never see the
login form. The `no-auth` project in `playwright.config.ts` runs login
tests without any `storageState` — giving them the bare browser they need.

This is the boundary: tests that verify authentication use `@playwright/test`
directly. Tests that verify application features use the fixture-enriched
`test` from `fixtures/index.ts`.

---

## Q504.9 — How does multi-role testing work at Level 3?

Multi-role testing means the same test suite covers scenarios that require
different user permissions. The Leave workflow needs both an ESS user
(who applies) and an Admin (who approves):

```typescript
// tests/leave/leave.spec.ts
import { test } from '../../fixtures';

test.describe('Leave — Apply and Approve', () => {

  // This test runs under the ESS project — uses ess.json storage state
  test('ESS user can apply for leave', async ({ applyLeavePage }) => {
    await applyLeavePage.applyForLeave('Annual Leave', '2025-12-01', '2025-12-01');
    await applyLeavePage.assertLeaveApplicationSubmitted();
  });

  // This test runs under the admin project — uses admin.json storage state
  test('admin can approve pending leave request', async ({ leaveListPage }) => {
    await leaveListPage.assertLeaveRequestVisible('Alice Johnson');
    await leaveListPage.approveLeaveRequest('Alice Johnson');
    await leaveListPage.assertLeaveApproved();
  });

});
```

The `applyLeavePage` fixture navigates as an ESS user (because the `ess`
project loaded `ess.json`). The `leaveListPage` fixture navigates as an
Admin (because the `admin` project loaded `admin.json`). The fixture code
is identical — the project determines which session it runs in.

---

## Q504.10 — What is the complete fixtures/index.ts?

```typescript
// fixtures/index.ts
import { test as base, expect } from '@playwright/test';
import { DashboardPage }        from '../pages/DashboardPage';
import { EmployeeListPage }     from '../pages/pim/EmployeeListPage';
import { AddEmployeePage }      from '../pages/pim/AddEmployeePage';
import { PersonalDetailsPage }  from '../pages/pim/PersonalDetailsPage';
import { UserManagementPage }   from '../pages/admin/UserManagementPage';
import { AddUserPage }          from '../pages/admin/AddUserPage';
import { ApplyLeavePage }       from '../pages/leave/ApplyLeavePage';
import { LeaveListPage }        from '../pages/leave/LeaveListPage';

type OrangeHRMFixtures = {
  adminDashboard:      DashboardPage;
  essDashboard:        DashboardPage;
  employeeListPage:    EmployeeListPage;
  addEmployeePage:     AddEmployeePage;
  personalDetailsPage: PersonalDetailsPage;
  userManagementPage:  UserManagementPage;
  addUserPage:         AddUserPage;
  applyLeavePage:      ApplyLeavePage;
  leaveListPage:       LeaveListPage;
};

const test = base.extend<OrangeHRMFixtures>({

  adminDashboard: async ({ page }, use) => {
    const dashboard = new DashboardPage(page);
    await dashboard.assertPageLoaded();
    await use(dashboard);
  },

  essDashboard: async ({ page }, use) => {
    const dashboard = new DashboardPage(page);
    await dashboard.assertPageLoaded();
    await use(dashboard);
  },

  employeeListPage: async ({ page }, use) => {
    const employeeList = new EmployeeListPage(page);
    await employeeList.goto();
    await employeeList.assertPageLoaded();
    await use(employeeList);
  },

  addEmployeePage: async ({ page }, use) => {
    const addEmployee = new AddEmployeePage(page);
    await addEmployee.goto();
    await addEmployee.assertPageLoaded();
    await use(addEmployee);
  },

  personalDetailsPage: async ({ page }, use) => {
    // No navigation — employee ID is required; test navigates explicitly
    const personalDetails = new PersonalDetailsPage(page);
    await use(personalDetails);
  },

  userManagementPage: async ({ page }, use) => {
    const userManagement = new UserManagementPage(page);
    await userManagement.goto();
    await userManagement.assertPageLoaded();
    await use(userManagement);
  },

  addUserPage: async ({ page }, use) => {
    const addUser = new AddUserPage(page);
    await addUser.goto();
    await addUser.assertPageLoaded();
    await use(addUser);
  },

  applyLeavePage: async ({ page }, use) => {
    const applyLeave = new ApplyLeavePage(page);
    await applyLeave.goto();
    await applyLeave.assertPageLoaded();
    await use(applyLeave);
  },

  leaveListPage: async ({ page }, use) => {
    const leaveList = new LeaveListPage(page);
    await leaveList.goto();
    await leaveList.assertPageLoaded();
    await use(leaveList);
  },

});

export { test, expect };
```

---

## Q504.11 — What does the employee test file look like after fixtures?

```typescript
// tests/pim/employee.spec.ts — Level 3
import { test, expect } from '../../fixtures';  // not @playwright/test

const newEmployee = {
  firstName:  'Bob',
  lastName:   'Williams',
  employeeId: 'EMP-L3-001',
  fullName:   'Bob Williams',
};

test.describe('PIM — Employee Management', () => {

  // No beforeEach. No login steps. Page objects arrive ready.

  test('admin can add a new employee @smoke', async ({ addEmployeePage }) => {
    await addEmployeePage.addEmployee(
      newEmployee.firstName,
      newEmployee.lastName,
      newEmployee.employeeId
    );
    await addEmployeePage.assertEmployeeSavedSuccessfully();
    await addEmployeePage.assertRedirectedToPersonalDetails();
  });

  test('employee appears in employee list', async ({ employeeListPage }) => {
    await employeeListPage.searchByEmployeeName(newEmployee.firstName);
    await employeeListPage.assertEmployeeExistsInList(newEmployee.fullName);
  });

  test('search with non-existent name shows no records', async ({ employeeListPage }) => {
    await employeeListPage.searchByEmployeeName('ZZZNONEXISTENT999');
    await employeeListPage.assertNoRecordsFound();
  });

});
```

Compare with Level 2: the `beforeEach` block is gone. Each test went from
8–12 lines to 3–5 lines of pure business logic. The noise is gone — what
remains is what the test is actually testing.

---

## Q504.12 — What should be in .gitignore for auth state files?

Authentication state files contain session tokens — they are effectively
credentials. Committing them to version control is a security risk:

```gitignore
# Auth state — contains session tokens, never commit
playwright/.auth/

# Also exclude these generated files
test-results/
playwright-report/
blob-report/
node_modules/
.env
```

On CI, auth state files are regenerated by `globalSetup` before each run.
They are ephemeral — they exist for the duration of one CI run and are
discarded. This also means they are always fresh; there is no risk of
stale session tokens causing mysterious CI failures weeks after the initial
setup.

Create the directory so `globalSetup` can write to it:
```bash
mkdir -p playwright/.auth
# Add a .gitkeep so git tracks the directory but not its contents
touch playwright/.auth/.gitkeep
# Then .gitignore the contents but not the file:
# playwright/.auth/*
# !playwright/.auth/.gitkeep
```

---

## Q504.13 — What is fixture scope and when would you use a different scope?

Playwright fixtures have a `scope` property that controls their lifetime:

```typescript
// 'test' scope (default) — fixture created fresh for each test
employeeListPage: [async ({ page }, use) => {
  // ... setup
  await use(employeeListPage);
}, { scope: 'test' }],   // ← new instance for every test

// 'worker' scope — fixture created once per parallel worker
sharedSetup: [async ({}, use) => {
  // Runs once per worker, not once per test
  // Useful for expensive one-time setup like API clients
  const apiClient = new ApiClient(process.env.BASE_URL!);
  await use(apiClient);
}, { scope: 'worker' }],
```

**`test` scope (default):** fresh fixture for every test. Page objects,
navigation state — anything that should not bleed between tests.

**`worker` scope:** shared across all tests in one worker process.
Useful for API clients, database connections, or other expensive
initialisation that is safe to reuse.

The OrangeHRM project uses `test` scope for all page object fixtures —
each test gets a fresh, navigated page. A shared API client at `worker`
scope is introduced at Level 6 when API setup enters the picture.

---

## Q504.14 — How do fixtures handle teardown after a test?

Code after `await use()` in a fixture runs after the test completes —
whether the test passed or failed:

```typescript
employeeListPage: async ({ page }, use) => {
  const employeeList = new EmployeeListPage(page);
  await employeeList.goto();

  await use(employeeList);  // test runs here

  // Teardown — runs after test regardless of pass/fail
  // Example: delete test data created during this test
  // At Level 3 this is mostly empty — Level 6 adds API cleanup here
},
```

For most page object fixtures, no teardown is needed — the browser context
is discarded after each test automatically. Teardown becomes important at
Level 6 when tests use API calls to create data that must be cleaned up.

The guarantee that teardown always runs — even when the test throws — is
why fixtures are superior to `beforeEach`/`afterEach` pairs for setup/cleanup.
With `beforeEach`/`afterEach`, a failure in `beforeEach` can prevent
`afterEach` from running. Fixtures always complete their teardown.

---

## Q504.15 — What are the Leave module page objects introduced at Level 3?

**ApplyLeavePage** — used by the ESS user to submit a leave application:

```typescript
// Key methods
async applyForLeave(
  leaveType: string,
  fromDate:  string,
  toDate:    string,
  comment?:  string
): Promise<void> {
  await this.selectLeaveType(leaveType);
  await this.fillFromDate(fromDate);
  await this.fillToDate(toDate);
  if (comment) await this.fillComment(comment);
  await this.submitLeaveApplication();
}

async assertLeaveApplicationSubmitted(): Promise<void> {
  await expect(this.successToast).toBeVisible();
}
```

**LeaveListPage** — used by the Admin to review and action leave requests:

```typescript
// Approve with row-scoped button — only clicks the button in the matching row
async approveLeaveRequest(employeeName: string): Promise<void> {
  const row = this.leaveTable
    .getByRole('row', { name: new RegExp(employeeName, 'i') });
  await row.getByRole('button', { name: 'Approve' }).click();
  await this.confirmButton.click();
}

async assertLeaveRequestStatus(
  employeeName: string,
  expectedStatus: 'Pending' | 'Approved' | 'Rejected'
): Promise<void> {
  const row = this.leaveTable
    .getByRole('row', { name: new RegExp(employeeName, 'i') });
  await expect(row.getByText(expectedStatus)).toBeVisible();
}
```

The row-scoped locator pattern (`this.leaveTable.getByRole('row', ...).getByRole('button', ...)`)
is essential for tables with multiple rows — it avoids clicking the wrong
row's button when the list contains multiple leave requests.

---

## Q504.16 — When should a fixture NOT navigate, and let the test navigate instead?

When navigation requires a runtime value that the fixture cannot know:

```typescript
// personalDetailsPage fixture — cannot navigate because it needs an employee ID
personalDetailsPage: async ({ page }, use) => {
  const personalDetails = new PersonalDetailsPage(page);
  // No goto() here — the employee ID is not known until the test creates an employee
  await use(personalDetails);
},

// In the test, the ID is known and navigation happens explicitly
test('personal details update persists', async ({ addEmployeePage, personalDetailsPage }) => {
  await addEmployeePage.addEmployee('Alice', 'Johnson', 'EMP-001');
  const employeeId = await addEmployeePage.getCreatedEmployeeId();

  await personalDetailsPage.goto(employeeId);  // test navigates with the ID
  await personalDetailsPage.assertPageLoaded();
  await personalDetailsPage.assertFirstName('Alice');
});
```

The rule: a fixture navigates when it can — when the destination is known
before the test starts. It leaves navigation to the test when the destination
depends on something the test creates at runtime.

---

## Q504.17 — What changed in playwright.config.ts at Level 3?

Three changes from Level 2:

**1. Register globalSetup:**
```typescript
globalSetup: './global-setup.ts',
```

**2. Split into projects by authentication role:**
```typescript
projects: [
  {
    name: 'admin',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/admin.json',
    },
    testMatch: ['**/tests/pim/**', '**/tests/admin/**'],
  },
  {
    name: 'ess',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/ess.json',
    },
    testMatch: ['**/tests/leave/**/apply*.spec.ts'],
  },
  {
    name: 'no-auth',
    use: { ...devices['Desktop Chrome'] },
    testMatch: ['**/tests/login.spec.ts'],
  },
],
```

`testMatch` per project — controls which files each project runs. Without
`testMatch`, all projects would run all tests. An ESS user running admin
tests would fail with permission errors. The `no-auth` project runs login
tests with a clean session — exactly what login tests need.

---

## Q504.18 — What does Level 3 not solve?

Level 3 eliminates repeated login setup and introduces role-based test
execution. Three problems remain:

**Test ordering dependencies:** the leave approval test depends on the apply
test having run first. If apply fails, approval fails for the wrong reason.
Level 4 (Test Independence) ensures every test sets up its own preconditions.

**Hardcoded test data:** employee names, leave dates, and credentials remain
as string literals in test files. Level 5 (Test Data) introduces factory
functions that generate unique, timestamped data per run — eliminating
data collision between test runs.

**Duplicated UI interaction patterns:** `ApplyLeavePage` and `AddEmployeePage`
both implement date field filling logic independently. `AddUserPage` and
`ApplyLeavePage` both implement dropdown selection independently. Level 6
(Web Action Helpers) extracts these into shared helpers — one implementation
of "fill a date picker", "select from OrangeHRM dropdown", used by all
page objects.

---

## Chapter Summary

- Fixtures are Playwright's dependency injection system — they prepare state and inject it into tests as parameters.
- `test.extend<T>()` creates a custom test object with your fixture definitions; export this instead of `@playwright/test`.
- `use()` is the boundary between setup and teardown in a fixture; code after `use()` always runs, even when tests fail.
- `storageState` saves full browser auth state (cookies + localStorage) to JSON; loading it gives tests a pre-authenticated session.
- `global-setup.ts` logs in once per user role and saves auth files; registered via `globalSetup` in `playwright.config.ts`.
- Three projects in config: `admin` (loads admin.json), `ess` (loads ess.json), `no-auth` (bare browser for login tests).
- `testMatch` per project — routes test files to the correct authentication context automatically.
- Login tests import from `@playwright/test` directly — they test authentication itself and need a fresh, unauthenticated session.
- Fixtures that need a runtime value (e.g., employee ID) do not navigate; they let the test navigate after creating the data.
- `'test'` scope (default): fresh fixture per test. `'worker'` scope: shared across all tests in one worker process.
- Auth state files contain session tokens — always add `playwright/.auth/` to `.gitignore`; regenerate on CI via `globalSetup`.
- Level 3 solves login noise and speed; it deliberately leaves test ordering (Level 4), hardcoded data (Level 5), and duplicated UI patterns (Level 6) for subsequent levels.
