# 09 — Fixtures

## The Scenario

Your OrangeHRM test suite has grown to 8 spec files. Every file needs a `LoginPage` object, most need an `EmployeeListPage`, and several need an `AddEmployeePage`. Here is what the top of each spec file looks like:

```typescript
// tests/pim/employee-list.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { EmployeeListPage } from '../../pages/EmployeeListPage';

test('search by name @smoke', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('Admin', 'admin123');

  const employeeListPage = new EmployeeListPage(page);
  await employeeListPage.goto();
  await employeeListPage.searchByName('Linda');
  // ...
});
```

Three problems are building up:

**Problem 1 — Duplication.** The login logic is repeated at the top of every test in every file. 200 tests means 200 login sequences.

**Problem 2 — Maintenance cost.** `LoginPage` constructor signature changes. You update it in 8 files, 200 places. The `login` method gets renamed. Same thing.

**Problem 3 — No isolation.** You are creating page objects manually inside each test. If you forget to create one, the test fails with a confusing null reference error. There is no central place that says "every test in this describe gets these objects."

Fixtures solve all three problems. They are Playwright's dependency injection system — a way to declare what a test needs and have Playwright create, provide, and clean up those things automatically.

---

## What Fixtures Are

A fixture is a named value that Playwright creates and injects into tests as a parameter. When a test declares `{ page }` in its parameter list, Playwright does not pass a plain variable — it creates a fresh browser page, injects it into the test, and closes it when the test finishes.

`page`, `browser`, `context`, and `request` are all built-in fixtures. The power of fixtures is that you can create your own — for page objects, authenticated sessions, test data, API clients, or any reusable resource.

The key principles of fixtures:

**Created on demand.** A fixture is only created if a test declares it in its parameter list. If a test does not need it, it is never created.

**Automatically cleaned up.** Whatever setup a fixture does, its teardown runs automatically after the test — whether the test passed, failed, or timed out.

**Scoped.** A fixture can be test-scoped (fresh instance per test) or worker-scoped (shared across all tests in a worker). The scope is declared when the fixture is defined.

**Composable.** Fixtures can depend on other fixtures. Playwright resolves the dependency tree automatically.

---

## Built-in Fixtures

Playwright provides a set of built-in fixtures that cover the most common needs:

| Fixture | Scope | What It Provides |
|---|---|---|
| `page` | test | A fresh browser tab for each test — automatically closed after |
| `context` | test | A fresh `BrowserContext` — isolated cookies, storage, auth |
| `browser` | worker | A `Browser` instance shared across tests in the same worker |
| `browserName` | worker | `'chromium'`, `'firefox'`, or `'webkit'` — which browser is running |
| `request` | test | An `APIRequestContext` for making HTTP requests without a browser |
| `baseURL` | worker | The `baseURL` from your config — used when you call `page.goto('/')` |

```typescript
test('uses built-in fixtures', async ({ page, request, browserName }) => {
  console.log(browserName); // 'chromium'

  // page — a fresh browser tab
  await page.goto('/login');

  // request — HTTP client, no browser involved
  const response = await request.get('/api/employees');
  expect(response.status()).toBe(200);
});
```

These are enough for simple projects. But as soon as your project has page objects, authentication, and shared setup, you need custom fixtures.

---

## Creating Custom Fixtures with test.extend()

`test.extend()` creates a new `test` object that has additional fixtures on top of the built-ins. You define what the fixture creates, how it sets up, and how it tears down.

The pattern:

```typescript
// fixtures/baseFixture.ts

import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { AddEmployeePage } from '../pages/AddEmployeePage';

// Define the type of your custom fixtures
type PageFixtures = {
  loginPage: LoginPage;
  employeeListPage: EmployeeListPage;
  addEmployeePage: AddEmployeePage;
};

// Extend base test with your fixtures
export const test = base.extend<PageFixtures>({

  loginPage: async ({ page }, use) => {
    // SETUP: create the page object
    const loginPage = new LoginPage(page);

    // HAND TO TEST: pause here while the test runs
    await use(loginPage);

    // TEARDOWN: anything after use() runs after the test finishes
    // For a simple page object, no teardown is needed
  },

  employeeListPage: async ({ page }, use) => {
    await use(new EmployeeListPage(page));
  },

  addEmployeePage: async ({ page }, use) => {
    await use(new AddEmployeePage(page));
  },

});

// Re-export expect so tests only need one import
export { expect } from '@playwright/test';
```

Now your spec files change dramatically:

```typescript
// tests/pim/employee-list.spec.ts

// ✅ Import from your fixtures file — not from @playwright/test
import { test, expect } from '../../fixtures/baseFixture';

test('search by name returns results @smoke', async ({ employeeListPage }) => {
  // employeeListPage is injected — no manual creation
  await employeeListPage.goto();
  await employeeListPage.searchByName('Linda');
  await expect(employeeListPage.getResultRow('Linda Anderson')).toBeVisible();
});

test('reset clears search filters @regression', async ({ employeeListPage }) => {
  await employeeListPage.goto();
  await employeeListPage.searchByName('Nobody');
  await employeeListPage.clickReset();
  await expect(employeeListPage.getResultCount()).toBeGreaterThan(0);
});
```

No imports of page classes. No manual instantiation. No login logic. The test body is pure test logic.

---

## The use() Function — Setup, Hand Off, Teardown

The `use()` function is the heart of every fixture. It is an async function that Playwright provides. You call it with the value you want to inject into the test. Everything before `use()` is setup. Everything after `use()` is teardown.

```typescript
myFixture: async ({ page }, use) => {
  // ── SETUP ─────────────────────────────────────
  // Create whatever the fixture provides
  const resource = await createExpensiveResource();
  await resource.initialise();

  // ── HAND TO TEST ──────────────────────────────
  await use(resource);
  // Execution pauses here while the test runs
  // The test body can use `resource` freely

  // ── TEARDOWN ──────────────────────────────────
  // This runs after the test finishes — pass or fail
  await resource.cleanup();
  await resource.close();
},
```

The teardown after `use()` **always runs** — whether the test passed, failed, or timed out. This is the fixture's equivalent of `afterEach`. The difference is that teardown is colocated with setup — you can see what gets cleaned up right next to what gets created.

---

## A Fixture with Authentication

The most common real-world fixture — creating an authenticated session so every test starts already logged in:

```typescript
type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({

  authenticatedPage: async ({ page }, use) => {
    // SETUP: log in before the test
    await page.goto('/web/index.php/auth/login');
    await page.getByPlaceholder('Username').fill('Admin');
    await page.getByPlaceholder('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(/dashboard/);

    // HAND TO TEST: page is now logged in
    await use(page);

    // TEARDOWN: log out after the test
    // Use .catch() so teardown failure does not mask test result
    await page.getByRole('button', { name: 'Logout' }).click().catch(() => {});
  },

});
```

```typescript
test('employee list loads after login @smoke', async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in — no login code in the test
  await authenticatedPage.goto('/web/index.php/pim/viewEmployeeList');
  await expect(authenticatedPage.getByRole('heading', { name: 'Employee List' })).toBeVisible();
});
```

In real projects you would use `storageState` for faster auth (covered in Global Setup notes). But this pattern illustrates how the fixture completely encapsulates the auth concern — the test has no idea how login works.

---

## Fixture Dependency — Fixtures That Use Other Fixtures

Fixtures can depend on other fixtures. Playwright resolves the dependency tree automatically. You declare the dependency by listing it in the fixture's parameter list — exactly the same way a test declares its fixtures.

```typescript
type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  employeeListPage: EmployeeListPage;
};

export const test = base.extend<Fixtures>({

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // dashboardPage depends on loginPage — it uses it to log in
  dashboardPage: async ({ loginPage, page }, use) => {
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');
    // page is now on the dashboard — hand that to the test
    await use(new DashboardPage(page));
  },

  // employeeListPage depends on dashboardPage — user must be logged in first
  employeeListPage: async ({ dashboardPage, page }, use) => {
    await dashboardPage.navigateTo('PIM');
    await use(new EmployeeListPage(page));
  },

});
```

```typescript
test('search employee @smoke', async ({ employeeListPage }) => {
  // employeeListPage was created by its fixture
  // which depended on dashboardPage
  // which depended on loginPage
  // Playwright resolved the entire chain automatically
  // The test just asks for employeeListPage — everything else is handled
  await employeeListPage.searchByName('Linda');
  await expect(employeeListPage.getResultRow('Linda Anderson')).toBeVisible();
});
```

This is what makes fixtures powerful for large projects. A test asks for what it needs. Playwright figures out what is required to provide it.

---

## Worker-Scoped Fixtures

By default, every fixture is test-scoped — a fresh instance is created for each test. Worker-scoped fixtures are created once when a worker starts and shared across all tests that worker runs.

Use worker scope for:
- Resources that are expensive to create and safe to share (auth tokens, database connections)
- Setup that does not have test-specific state (server port, configuration values)

```typescript
type WorkerFixtures = {
  authToken: string;
  workerDbConnection: DatabaseConnection;
};

// Worker-scoped fixtures go in the second type parameter of extend
export const test = base.extend<{}, WorkerFixtures>({

  authToken: [async ({ request }, use) => {
    // Runs once when the worker starts
    const response = await request.post('/api/auth/login', {
      data: { username: 'Admin', password: 'admin123' },
    });
    const { token } = await response.json();

    await use(token);
    // Teardown runs once when the worker finishes all its tests
  }, { scope: 'worker' }],

  workerDbConnection: [async ({}, use) => {
    const conn = await DatabaseConnection.create({
      host: process.env.DB_HOST,
      database: `test_worker_${test.info().workerIndex}`,
    });
    await use(conn);
    await conn.close();
  }, { scope: 'worker' }],

});
```

```typescript
test('fetch leave balance @smoke', async ({ authToken, request }) => {
  // authToken was created once for this worker — not re-fetched per test
  const response = await request.get('/api/leave/balance', {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  expect(response.status()).toBe(200);
});
```

**The critical difference:**

```
Test-scoped fixture:   created → TEST 1 → destroyed → created → TEST 2 → destroyed
Worker-scoped fixture: created → TEST 1 → TEST 2 → TEST 3 → ... → destroyed
```

Worker-scoped fixtures survive across tests. Their state is shared. This means they must not be mutated by individual tests — if one test changes the shared state, it affects all subsequent tests in that worker.

---

## Auto Fixtures — Run Without Being Declared

An auto fixture runs for every test automatically, without the test needing to declare it as a parameter. Use this for things that should always happen — logging, performance monitoring, global cleanup.

```typescript
type AutoFixtures = {
  screenshotOnFailure: void;
  testLogger: void;
};

export const test = base.extend<AutoFixtures>({

  // Takes a screenshot on failure — applies to every test automatically
  screenshotOnFailure: [async ({ page }, use) => {
    await use();

    // This runs after every test — auto fixtures still get teardown
    if (test.info().status !== test.info().expectedStatus) {
      await test.info().attach('failure-screenshot', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    }
  }, { auto: true }],

  // Logs test start and end for every test
  testLogger: [async ({}, use) => {
    const info = test.info();
    console.log(`\n▶ [${info.project.name}] ${info.title}`);
    const start = Date.now();

    await use();

    const duration = Date.now() - start;
    const icon = info.status === info.expectedStatus ? '✅' : '❌';
    console.log(`${icon} ${info.title} — ${duration}ms`);
  }, { auto: true }],

});
```

Every test in your suite now automatically gets:
- A screenshot attached to the report if it fails
- A log line when it starts and ends

No test needs to declare `{ screenshotOnFailure }` or `{ testLogger }`. It just happens. And critically, this replaces the pattern of putting this logic in a `beforeEach`/`afterEach` in every spec file.

---

## Overriding Built-in Fixtures

You can replace built-in fixtures with custom versions. This lets you change the default behaviour for all tests that use a particular fixture.

**Override `page` to always set a viewport:**
```typescript
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    // Every test's page starts with this viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await use(page);
  },
});
```

**Override `context` to always inject auth cookies:**
```typescript
export const test = base.extend<{ context: BrowserContext }>({
  context: async ({ context }, use) => {
    // Inject auth cookies so every test starts pre-authenticated
    await context.addCookies([{
      name: 'session_token',
      value: process.env.SESSION_TOKEN!,
      domain: 'demo.orangehrmlive.com',
      path: '/',
    }]);
    await use(context);
  },
});
```

**Override `page` to add route mocking:**
```typescript
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    // Mock all analytics calls so they do not interfere with tests
    await page.route('**/analytics/**', route => route.abort());
    await use(page);
  },
});
```

Overriding built-ins is powerful but should be used deliberately — it changes the behaviour for all tests that use the fixture. Document clearly why the override exists.

---

## test.use() — Scoped Configuration Overrides

`test.use()` is a lighter-weight mechanism for overriding fixture values within a specific describe block or test file — without creating a new fixture.

```typescript
test.describe('Mobile Layout Tests', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  // All tests in this describe use a mobile viewport
  // Tests outside this describe use the default viewport

  test('login form is usable on mobile @regression', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('Username')).toBeVisible();
  });
});

test.describe('Staging Environment Tests', () => {
  test.use({ baseURL: 'https://staging.orangehrm.example.com' });

  test('login works on staging @smoke', async ({ page }) => {
    await page.goto('/login'); // goes to staging
  });
});
```

`test.use()` is the right tool when you want to override a built-in option for a subset of tests without creating a custom fixture. Use custom fixtures when you need setup logic, teardown, or dependencies.

---

## Parameterisation Through Fixtures

Since fixtures appeared before parameterisation in the learning order, it is worth showing how parameterisation and fixtures work together — and how fixtures themselves are a form of parameterisation.

### Passing parameters to fixtures via test.use()

You can make a fixture configurable by treating its options as another fixture:

```typescript
// Define a fixture option type
type FixtureOptions = {
  userRole: 'admin' | 'employee' | 'manager';
};

type PageFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<PageFixtures & FixtureOptions>({

  // Option fixture — provides the default value, overridable per test
  userRole: ['admin', { option: true }],

  authenticatedPage: async ({ page, userRole }, use) => {
    // Credentials come from the userRole option
    const credentials = {
      admin:    { username: 'Admin',    password: 'admin123' },
      employee: { username: 'John',     password: 'Employee@123' },
      manager:  { username: 'Manager1', password: 'Manager@123' },
    }[userRole];

    await page.goto('/web/index.php/auth/login');
    await page.getByPlaceholder('Username').fill(credentials.username);
    await page.getByPlaceholder('Password').fill(credentials.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(/dashboard/);

    await use(page);
  },
});
```

Different tests or describes can now request different user roles:

```typescript
// Default: logs in as admin
test('admin sees all employees @smoke', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/employee-list');
  await expect(authenticatedPage.getByRole('table')).toBeVisible();
});

// Override: logs in as employee
test.describe('Employee Role Tests', () => {
  test.use({ userRole: 'employee' });

  test('employee cannot see admin settings @regression', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin');
    await expect(authenticatedPage.getByText('Access Denied')).toBeVisible();
  });
});

// Override: logs in as manager
test.describe('Manager Role Tests', () => {
  test.use({ userRole: 'manager' });

  test('manager can approve leave @regression', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/leave/requests');
    await expect(authenticatedPage.getByRole('button', { name: 'Approve' })).toBeVisible();
  });
});
```

This is fixture-based parameterisation — the same test infrastructure runs under different configurations depending on what is declared with `test.use()`.

---

## Building a Complete Fixture File for OrangeHRM

A realistic fixture file that a full OrangeHRM test suite would use:

```typescript
// fixtures/baseFixture.ts

import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { LoginPage }        from '../pages/LoginPage';
import { DashboardPage }    from '../pages/DashboardPage';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { AddEmployeePage }  from '../pages/AddEmployeePage';
import { LeavePage }        from '../pages/LeavePage';
import { AdminPage }        from '../pages/AdminPage';

// ── Fixture types ──────────────────────────────────────────────────────────

type PageFixtures = {
  loginPage:        LoginPage;
  dashboardPage:    DashboardPage;
  employeeListPage: EmployeeListPage;
  addEmployeePage:  AddEmployeePage;
  leavePage:        LeavePage;
  adminPage:        AdminPage;
};

type WorkerFixtures = {
  workerStorageState: string;
};

type AutoFixtures = {
  screenshotOnFailure: void;
};

// ── Fixture implementation ─────────────────────────────────────────────────

export const test = base.extend<PageFixtures & AutoFixtures, WorkerFixtures>({

  // ── Page object fixtures ─────────────────────────────────────────────────

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  employeeListPage: async ({ page }, use) => {
    await use(new EmployeeListPage(page));
  },

  addEmployeePage: async ({ page }, use) => {
    await use(new AddEmployeePage(page));
  },

  leavePage: async ({ page }, use) => {
    await use(new LeavePage(page));
  },

  adminPage: async ({ page }, use) => {
    await use(new AdminPage(page));
  },

  // ── Auto fixture — screenshot on failure for every test ──────────────────

  screenshotOnFailure: [async ({ page }, use) => {
    await use();
    if (test.info().status !== test.info().expectedStatus) {
      await test.info().attach('failure-screenshot', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    }
  }, { auto: true }],

  // ── Worker-scoped fixture — auth token shared across tests in worker ──────

  workerStorageState: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/web/index.php/auth/login');
    await page.getByPlaceholder('Username').fill('Admin');
    await page.getByPlaceholder('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(/dashboard/);

    const storageStatePath = `./temp/worker-${test.info().workerIndex}-state.json`;
    await context.storageState({ path: storageStatePath });
    await context.close();

    await use(storageStatePath);
  }, { scope: 'worker' }],

});

export { expect } from '@playwright/test';
```

---

## The Import Rule

This is one of the most common mistakes with fixtures: importing `test` from `@playwright/test` instead of from your fixtures file.

```typescript
// ❌ Imports base test — your custom fixtures are NOT available
import { test, expect } from '@playwright/test';

test('employee list @smoke', async ({ employeeListPage }) => {
  // Error: employeeListPage is not a fixture on the base test object
});
```

```typescript
// ✅ Imports your extended test — all custom fixtures available
import { test, expect } from '../../fixtures/baseFixture';

test('employee list @smoke', async ({ employeeListPage }) => {
  // employeeListPage is injected by your fixture
});
```

Every spec file should import `test` and `expect` from your fixtures file, not from `@playwright/test`. Set up a lint rule or PR checklist item to enforce this.

---

## Using Fixtures Inside Hooks

Hooks and fixtures work together. You can declare fixtures in the parameter list of `beforeEach`, `afterEach`, `beforeAll`, and `afterAll` — exactly the same way you declare them in a test. But each hook type has different rules about which fixtures are available.

---

### beforeEach and afterEach — Full Fixture Access

`beforeEach` and `afterEach` run in a test context — a specific test is about to run or just finished. This means all fixtures are available, both test-scoped and worker-scoped. Declare them in the parameter list and Playwright injects them.

```typescript
import { test, expect } from '../../fixtures/baseFixture';

test.describe('Employee List', () => {

  test.beforeEach(async ({ page, employeeListPage }) => {
    // Both built-in fixtures (page) and custom fixtures (employeeListPage)
    // are available in beforeEach

    // Navigate using the page object
    await employeeListPage.goto();

    // Or use page directly for navigation
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page, employeeListPage }) => {
    // Fixtures are available in afterEach too
    const info = test.info();

    if (info.status !== info.expectedStatus) {
      // Use page to capture the failure state
      await info.attach('failure-screenshot', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });

      // Use the page object to get contextual information
      await info.attach('current-url', {
        body: Buffer.from(page.url()),
        contentType: 'text/plain',
      });
    }
  });

  test('search by name @smoke', async ({ employeeListPage }) => {
    await employeeListPage.searchByName('Linda');
    await expect(employeeListPage.getResultRow('Linda Anderson')).toBeVisible();
  });

});
```

This is a clean pattern — `beforeEach` uses `employeeListPage` to navigate, the test uses it to interact, `afterEach` uses `page` to capture evidence. The page object is created once by its fixture and shared across all three.

---

### beforeAll and afterAll — Worker-Scoped Fixtures Only

`beforeAll` and `afterAll` run at the worker level — before or after the group of tests, not before or after any individual test. Because no individual test exists at this point, **test-scoped fixtures are not available**.

This is the most important limitation to understand. `page` is test-scoped — there is no test when `beforeAll` runs, so there is no `page`.

```typescript
test.beforeAll(async ({ page }) => {
  // ⚠️ page is test-scoped — not available in beforeAll
  // Playwright will warn: "beforeAll hook with page fixture is not recommended"
  // The page that gets created here belongs to no specific test
  // Its lifecycle is undefined — avoid this
});
```

**What IS available in `beforeAll`:**

Worker-scoped fixtures are available because they exist at the worker level — the same level `beforeAll` runs at:

```typescript
test.beforeAll(async ({ browser, request, browserName }) => {
  // ✅ browser — worker-scoped, available
  // ✅ request — worker-scoped, available
  // ✅ browserName — worker-scoped, available

  console.log(`Setting up on ${browserName}`);

  // Use request for API calls that set up test data
  const response = await request.post('/api/test/seed', {
    data: { dataset: 'employee-module' },
  });
  expect(response.status()).toBe(200);
});
```

Your own **worker-scoped custom fixtures** are also available:

```typescript
// Worker-scoped fixture defined in baseFixture.ts
export const test = base.extend<{}, { authToken: string }>({
  authToken: [async ({ request }, use) => {
    const response = await request.post('/api/auth/login', {
      data: { username: 'Admin', password: 'admin123' },
    });
    const { token } = await response.json();
    await use(token);
  }, { scope: 'worker' }],
});
```

```typescript
test.beforeAll(async ({ authToken }) => {
  // ✅ authToken is worker-scoped — available in beforeAll
  console.log(`Worker auth token obtained: ${authToken.slice(0, 10)}...`);
  // Use the token to seed data, configure state, etc.
});
```

---

### The Workaround — Using browser to Get a Page in beforeAll

If you need browser interaction in `beforeAll` — navigating to a page, clicking something, reading data from the UI — you cannot use the `page` fixture. Instead, create a page manually from the `browser` fixture and manage its lifecycle yourself:

```typescript
test.describe('Employee Module Tests', () => {

  test.beforeAll(async ({ browser }) => {
    // Create a context and page manually — you own the lifecycle
    const context = await browser.newContext({
      storageState: '.auth/admin.json', // start pre-authenticated
    });
    const page = await context.newPage();

    // Seed test data via the UI
    await page.goto('/web/index.php/pim/addEmployee');
    await page.getByPlaceholder('First Name').fill('Setup');
    await page.getByPlaceholder('Last Name').fill('Employee');
    await page.getByLabel('Employee Id').fill('SETUP001');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForSelector('text=Successfully Saved');

    // Clean up manually — close context closes the page too
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    // Clean up the seeded data via the UI
    const context = await browser.newContext({
      storageState: '.auth/admin.json',
    });
    const page = await context.newPage();

    await page.goto('/web/index.php/pim/viewEmployeeList');
    await page.getByLabel('Employee Id').fill('SETUP001');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'Delete Selected' }).click();
    await page.getByRole('button', { name: 'Yes, Delete' }).click();

    await context.close();
  });

  test('setup employee appears in list @smoke', async ({ employeeListPage }) => {
    await employeeListPage.searchById('SETUP001');
    await expect(employeeListPage.getResultRow('Setup Employee')).toBeVisible();
  });

});
```

The key rule: when you create a page manually in `beforeAll`, you are responsible for closing it. Playwright will not close it for you because it was not created by a fixture.

---

### Fixture Execution Order Relative to Hooks

Understanding when fixtures are set up and torn down relative to hooks is important when both are used in the same describe block:

```
1. Worker-scoped fixture setup (once per worker)
2. beforeAll
3.   Test-scoped fixture setup (once per test)
4.   beforeEach
5.   TEST RUNS
6.   afterEach
7.   Test-scoped fixture teardown
8. afterAll
9. Worker-scoped fixture teardown (once per worker)
```

Practically, this means:

```typescript
export const test = base.extend<{ employeeListPage: EmployeeListPage }>({
  employeeListPage: async ({ page }, use) => {
    console.log('  FIXTURE SETUP: employeeListPage created');  // step 3
    await use(new EmployeeListPage(page));
    console.log('  FIXTURE TEARDOWN: employeeListPage destroyed'); // step 7
  },
});

test.describe('Employee List', () => {

  test.beforeAll(async ({ browser }) => {
    console.log('HOOK: beforeAll');  // step 2
  });

  test.beforeEach(async ({ employeeListPage }) => {
    // employeeListPage already exists here — fixture setup ran first (step 3)
    console.log('HOOK: beforeEach');  // step 4
    await employeeListPage.goto();
  });

  test.afterEach(async ({ page }) => {
    console.log('HOOK: afterEach');  // step 6
    // fixture teardown has NOT run yet — page is still open here
  });

  test.afterAll(async () => {
    console.log('HOOK: afterAll');  // step 8
    // all test-scoped fixtures for the last test are already torn down
  });

  test('my test', async ({ employeeListPage }) => {
    console.log('  TEST RUNS');  // step 5
  });

});
```

Output for one test:
```
HOOK: beforeAll
  FIXTURE SETUP: employeeListPage created
  HOOK: beforeEach
  TEST RUNS
  HOOK: afterEach
  FIXTURE TEARDOWN: employeeListPage destroyed
HOOK: afterAll
```

**The practical implication:** In `afterEach`, the test-scoped fixtures (`page`, `employeeListPage`) are still alive — you can use them. In `afterAll`, the test-scoped fixtures for the last test have already been torn down — you cannot use `page` in `afterAll`.

---

### Custom Fixtures in beforeEach — The Clean Pattern

Using your custom fixtures in `beforeEach` instead of using `page` directly makes the hook code consistent with the test code — both use the same page object interface:

```typescript
test.describe('Leave Application', () => {

  // ✅ Using custom fixture in beforeEach
  test.beforeEach(async ({ leavePage }) => {
    await leavePage.goto();
    await leavePage.waitForPageReady();
  });

  test.afterEach(async ({ leavePage, page }) => {
    if (test.info().status !== test.info().expectedStatus) {
      // Mix of page object and raw page — both available
      const currentSection = await leavePage.getCurrentSection();
      await test.info().attach('failure-context', {
        body: Buffer.from(`Failed on section: ${currentSection}\nURL: ${page.url()}`),
        contentType: 'text/plain',
      });
      await test.info().attach('screenshot', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    }
  });

  test('annual leave application submits @smoke', async ({ leavePage }) => {
    await leavePage.selectLeaveType('Annual');
    await leavePage.setFromDate('2026-06-01');
    await leavePage.setToDate('2026-06-05');
    await leavePage.clickApply();
    await leavePage.expectSuccessMessage();
  });

});
```

---

## Fixtures vs Hooks — The Final Word

After seeing both fixtures and hooks, here is the clear rule for choosing between them:

**Use fixtures when:**
- The setup is needed by multiple spec files
- The setup involves creating objects (page objects, API clients, data factories)
- The teardown needs to run reliably after every test
- You want the setup to be declarative — tests state what they need

**Use hooks when:**
- The setup is local to one file or describe block
- The setup is navigation or page-specific (go to this URL before each test)
- You need to share mutable state across tests within a group (e.g., a `let` variable holding a created ID)

In practice you always use both:

```typescript
// baseFixture.ts — reusable across all files
export const test = base.extend<{ employeeListPage: EmployeeListPage }>({
  employeeListPage: async ({ page }, use) => {
    await use(new EmployeeListPage(page));
  },
});

// employee-list.spec.ts — local to this file
test.describe('Employee List', () => {

  test.beforeEach(async ({ page }) => {
    // Local navigation — only needed in this file
    await page.goto('/web/index.php/pim/viewEmployeeList');
  });

  test('search by name @smoke', async ({ employeeListPage }) => {
    // employeeListPage from fixture, navigation from hook — clean separation
    await employeeListPage.searchByName('Linda');
  });
});
```

---

## Key Points

- Fixtures are Playwright's dependency injection — declare what a test needs, Playwright creates and cleans it up
- `test.extend<TestFixtures, WorkerFixtures>()` creates a new `test` object with your custom fixtures
- The `use()` function separates setup (before) from teardown (after) — teardown always runs
- Always import `test` and `expect` from your fixtures file, not from `@playwright/test`
- Built-in fixtures: `page` (test-scoped), `browser` (worker-scoped), `context` (test-scoped), `request` (test-scoped), `browserName` (worker-scoped)
- Test-scoped fixtures: fresh instance per test — safe for mutable state
- Worker-scoped fixtures: shared across all tests in a worker — must not be mutated per test
- Auto fixtures (`{ auto: true }`) run for every test without being declared — use for logging and screenshot capture
- Fixtures can depend on other fixtures — declare the dependency in the parameter list, Playwright resolves the chain
- Overriding built-in fixtures changes default behaviour for all tests using that fixture
- `test.use()` overrides fixture values within a describe scope — for lightweight config overrides without a new fixture
- Fixture options (`{ option: true }`) make fixtures configurable via `test.use()` — the fixture parameterisation pattern
- Fixtures inside `beforeEach`/`afterEach` — fully supported; declare in parameter list just like in tests; all fixtures available
- Fixtures inside `beforeAll`/`afterAll` — only worker-scoped fixtures available; test-scoped fixtures like `page` are not available because no test exists yet
- Need browser interaction in `beforeAll`? Create a page from `browser` manually and close it yourself
- Fixture execution order relative to hooks: fixture setup → beforeEach → test → afterEach → fixture teardown; in `afterEach` fixtures are still alive; in `afterAll` test-scoped fixtures are already torn down
- Use custom fixtures in `beforeEach` instead of raw `page` — keeps hook code consistent with test code
- Use fixtures for reusable shared setup; use hooks for local file-specific setup
