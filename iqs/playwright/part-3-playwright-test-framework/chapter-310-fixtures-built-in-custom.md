# Chapter 310 — Fixtures — Built-in & Custom

This chapter covers Playwright's fixture system — the dependency injection
mechanism that replaces manual page object creation, per-test setup
duplication, and scattered teardown code. Fixtures are the single most
tested topic in senior Playwright interviews. Candidates who understand
fixtures deeply can articulate test architecture decisions, debug scope
problems, and explain why their suite scales cleanly. Candidates who do not
know fixtures produce suites that are expensive to maintain.

---

## Q310.1 — What is a fixture in Playwright?

A fixture is a named value that Playwright creates and injects into a test
as a parameter. When a test declares `{ page }` in its signature, Playwright
does not pass a variable — it creates a fresh browser page for that specific
test, injects it, and closes it when the test finishes.

`page`, `browser`, `context`, and `request` are all built-in fixtures. The
power is that you can create your own — for page objects, authenticated
sessions, test data factories, API clients, or any reusable resource.

```typescript
// Built-in fixtures — Playwright creates and destroys these automatically
test('uses built-in fixtures', async ({ page, request, browserName }) => {
  console.log(browserName); // 'chromium'
  await page.goto('/login');                         // fresh browser tab
  const r = await request.get('/api/employees');     // HTTP client
  expect(r.status()).toBe(200);
});
```

Key principles:
- **Created on demand** — a fixture is only created if a test declares it
- **Automatically cleaned up** — teardown runs after the test, whether it passed or failed
- **Scoped** — test-scoped (fresh per test) or worker-scoped (shared across tests in a worker)
- **Composable** — fixtures can depend on other fixtures; Playwright resolves the chain

---

## Q310.2 — What problem do fixtures solve that hooks do not?

Hooks solve duplication within a file. Fixtures solve duplication across files.

```typescript
// ❌ Before fixtures — setup repeated in every spec file
// employee-list.spec.ts
test('search by name @smoke', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('Admin', 'admin123');
  const empPage = new EmployeeListPage(page);
  await empPage.goto();
  await empPage.searchByName('Linda');
});

// leave.spec.ts — same boilerplate
test('apply leave @smoke', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('Admin', 'admin123');
  const leavePage = new LeavePage(page);
  // ...
});
```

```typescript
// ✅ After fixtures — spec files contain only test logic
// employee-list.spec.ts
import { test, expect } from '../../fixtures/baseFixture';

test('search by name @smoke', async ({ employeeListPage }) => {
  await employeeListPage.searchByName('Linda');
  await expect(employeeListPage.getResultRow('Linda Anderson')).toBeVisible();
});
```

Additionally:
- Manual `new Page()` instantiation can be forgotten — fixtures enforce creation
- Teardown in fixtures is colocated with setup — you see cleanup next to the thing being created
- A `LoginPage` constructor change requires updating one fixture, not every spec file

---

## Q310.3 — How do you create a custom fixture with test.extend()?

`test.extend<TestFixtures, WorkerFixtures>()` creates a new `test` object
with your custom fixtures layered on top of the built-ins:

```typescript
// fixtures/baseFixture.ts
import { test as base, expect } from '@playwright/test';
import { LoginPage }        from '../pages/LoginPage';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { AddEmployeePage }  from '../pages/AddEmployeePage';

type PageFixtures = {
  loginPage:        LoginPage;
  employeeListPage: EmployeeListPage;
  addEmployeePage:  AddEmployeePage;
};

export const test = base.extend<PageFixtures>({

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
    // No teardown needed — page closes automatically
  },

  employeeListPage: async ({ page }, use) => {
    await use(new EmployeeListPage(page));
  },

  addEmployeePage: async ({ page }, use) => {
    await use(new AddEmployeePage(page));
  },

});

export { expect } from '@playwright/test';
```

Every spec file then imports from this file, not from `@playwright/test`:

```typescript
import { test, expect } from '../../fixtures/baseFixture';

test('saves with required fields @smoke', async ({ addEmployeePage }) => {
  await addEmployeePage.goto();
  await addEmployeePage.fillBasicInfo('Priya', 'Sharma', 'EMP0099');
  await addEmployeePage.clickSave();
  await addEmployeePage.expectSuccessMessage();
});
```

---

## Q310.4 — What is the use() function and how does it structure setup and teardown?

`use()` is the function Playwright provides inside every fixture definition.
You call it with the value you want to inject into the test. Everything before
`use()` is setup. Everything after `use()` is teardown:

```typescript
myFixture: async ({ page }, use) => {
  // ── SETUP ──────────────────────────────────────────────
  const resource = await createExpensiveResource();
  await resource.initialise();

  // ── HAND TO TEST ────────────────────────────────────────
  await use(resource);
  // Execution pauses here. The test body runs.
  // The test body can use `resource` freely.

  // ── TEARDOWN ────────────────────────────────────────────
  // Always runs — whether the test passed, failed, or timed out
  await resource.cleanup();
  await resource.close();
},
```

This structure means:
- Setup and teardown are colocated — you see them together
- Teardown is guaranteed — no `try/finally` needed
- The fixture is self-contained — it manages the full lifecycle of what it creates

---

## Q310.5 — What is the import rule for fixtures?

**Always import `test` and `expect` from your fixtures file, not from `@playwright/test`.**

This is the most common fixture mistake in real projects:

```typescript
// ❌ Wrong — imports the base test; custom fixtures are not available
import { test, expect } from '@playwright/test';

test('search employees @smoke', async ({ employeeListPage }) => {
  // TypeError: employeeListPage is not a fixture on the base test object
});

// ✅ Correct — imports your extended test; all custom fixtures available
import { test, expect } from '../../fixtures/baseFixture';

test('search employees @smoke', async ({ employeeListPage }) => {
  // employeeListPage injected by your fixture
});
```

The `expect` re-export in the fixtures file (`export { expect } from '@playwright/test'`)
means tests only need one import — from the fixtures file — for both `test` and `expect`.
Add an ESLint rule or PR checklist item to enforce this.

---

## Q310.6 — What are the built-in fixtures and their scopes?

| Fixture | Scope | What It Provides |
|---|---|---|
| `page` | test | Fresh browser tab per test — closes when test ends |
| `context` | test | Fresh `BrowserContext` — isolated cookies, storage, auth state |
| `browser` | worker | `Browser` instance shared across all tests in a worker |
| `browserName` | worker | `'chromium'`, `'firefox'`, or `'webkit'` |
| `request` | test | `APIRequestContext` for HTTP requests without a browser |
| `baseURL` | worker | The `baseURL` from config — used by `page.goto('/')` |

`page` and `context` are test-scoped — fresh per test, ensuring isolation.
`browser` and `browserName` are worker-scoped — shared across tests in a
worker. Playwright re-uses a single browser process per worker and creates
isolated contexts per test.

---

## Q310.7 — What is the difference between test-scoped and worker-scoped fixtures?

**Test-scoped (default):** A fresh instance is created for each test and
destroyed when the test finishes. Safe for mutable state — one test's changes
cannot affect another's.

**Worker-scoped:** Created once when the worker starts. Shared across all
tests that worker runs. Destroyed when the worker finishes all its tests.
Must not be mutated by individual tests.

```
Test-scoped:   [create] → TEST 1 → [destroy] → [create] → TEST 2 → [destroy]
Worker-scoped: [create] → TEST 1 → TEST 2 → TEST 3 → ... → [destroy]
```

Define a worker-scoped fixture with the second type parameter and `{ scope: 'worker' }`:

```typescript
type WorkerFixtures = {
  authToken: string;
};

export const test = base.extend<{}, WorkerFixtures>({

  authToken: [async ({ request }, use) => {
    // Runs once per worker — not per test
    const response = await request.post('/api/auth/login', {
      data: { username: 'Admin', password: 'admin123' },
    });
    const { token } = await response.json();
    await use(token);
    // Teardown runs once when the worker finishes all tests
  }, { scope: 'worker' }],

});
```

```typescript
test('fetch leave balance @smoke', async ({ authToken, request }) => {
  // authToken was obtained once for this worker — not re-fetched per test
  const res = await request.get('/api/leave/balance', {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  expect(res.status()).toBe(200);
});
```

**Rule:** use worker scope when setup is expensive and the result is safe to
share (auth tokens, read-only DB connections). Use test scope for everything
else.

---

## Q310.8 — How do fixture dependencies work?

A fixture can depend on other fixtures by listing them in its parameter list —
exactly as a test does. Playwright resolves the dependency chain automatically:

```typescript
type Fixtures = {
  loginPage:        LoginPage;
  dashboardPage:    DashboardPage;
  employeeListPage: EmployeeListPage;
};

export const test = base.extend<Fixtures>({

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // dashboardPage depends on loginPage — uses it to log in
  dashboardPage: async ({ loginPage, page }, use) => {
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');
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
  // Playwright resolved the chain automatically:
  // loginPage created → dashboardPage used it to log in → employeeListPage navigated to PIM
  // The test just asks for employeeListPage
  await employeeListPage.searchByName('Linda');
});
```

This is dependency injection: the test declares what it needs, the framework
figures out how to provide it. The test body is pure logic.

---

## Q310.9 — What is an auto fixture and when should you use it?

An auto fixture runs for every test automatically — without any test declaring
it as a parameter. It is marked with `{ auto: true }`:

```typescript
type AutoFixtures = {
  screenshotOnFailure: void;  // void because the fixture provides nothing directly
  testLogger: void;
};

export const test = base.extend<AutoFixtures>({

  screenshotOnFailure: [async ({ page }, use) => {
    await use(); // setup is empty — the value provided is void

    // Teardown: runs after every test
    if (test.info().status !== test.info().expectedStatus) {
      await test.info().attach('failure-screenshot', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    }
  }, { auto: true }],

  testLogger: [async ({}, use) => {
    const { title, project } = test.info();
    console.log(`▶ [${project.name}] ${title}`);
    const start = Date.now();

    await use();

    const duration = Date.now() - start;
    const { status, expectedStatus } = test.info();
    const icon = status === expectedStatus ? '✅' : '❌';
    console.log(`${icon} ${title} — ${duration}ms`);
  }, { auto: true }],

});
```

Every test in your suite now automatically gets:
- A screenshot attached to the report if it fails
- A log line when it starts and ends

No test needs to declare `{ screenshotOnFailure }`. No `beforeEach`/`afterEach`
needed in every spec file. The cross-cutting concern lives in one place.

**Use auto fixtures for:** logging, screenshot capture on failure, performance
timing, global monitoring. Anything that should apply to all tests without
requiring explicit declaration.

---

## Q310.10 — How do you override a built-in fixture?

Override built-in fixtures by declaring them in `extend()` with the same name:

```typescript
// Override page to always set a consistent viewport
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await use(page);
  },
});

// Override context to always inject auth cookies
export const test = base.extend<{ context: BrowserContext }>({
  context: async ({ context }, use) => {
    await context.addCookies([{
      name: 'session_token',
      value: process.env.SESSION_TOKEN!,
      domain: 'demo.orangehrmlive.com',
      path: '/',
    }]);
    await use(context);
  },
});

// Override page to mock all analytics requests
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await page.route('**/analytics/**', route => route.abort());
    await use(page);
  },
});
```

**Use sparingly.** Overriding a built-in changes behaviour for every test
using that fixture. Document why the override exists so team members understand
the deviation from default behaviour.

---

## Q310.11 — What is test.use() and how is it different from creating a fixture?

`test.use()` overrides fixture values within a `describe` block or file —
without writing a full fixture definition:

```typescript
test.describe('Mobile Layout Tests', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  // All tests in this describe use a mobile viewport

  test('login form is usable @regression', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Username')).toBeVisible();
  });
});

test.describe('Staging Environment', () => {
  test.use({ baseURL: 'https://staging.orangehrm.example.com' });

  test('login works on staging @smoke', async ({ page }) => {
    await page.goto('/login'); // goes to staging
  });
});
```

**Use `test.use()` for:** lightweight config overrides (viewport, locale,
baseURL) that apply to a subset of tests. No setup logic, no teardown, just
a value override.

**Use custom fixtures for:** anything that requires setup logic, teardown,
dependencies on other fixtures, or reuse across multiple files.

---

## Q310.12 — How do fixture options enable fixture parameterisation?

Fixture options are fixtures with `{ option: true }` — they provide a
default value that can be overridden per test or per describe via `test.use()`:

```typescript
type FixtureOptions = {
  userRole: 'admin' | 'employee' | 'manager';
};

type PageFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<PageFixtures & FixtureOptions>({

  // Option: default 'admin', overridable
  userRole: ['admin', { option: true }],

  authenticatedPage: async ({ page, userRole }, use) => {
    const credentials = {
      admin:    { username: 'Admin',    password: 'admin123'     },
      employee: { username: 'John',     password: 'Employee@123' },
      manager:  { username: 'Manager1', password: 'Manager@123'  },
    }[userRole];

    await page.goto('/login');
    await page.getByLabel('Username').fill(credentials.username);
    await page.getByLabel('Password').fill(credentials.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await use(page);
  },

});
```

```typescript
// Default — logs in as admin
test('admin sees all employees @smoke', async ({ authenticatedPage }) => { ... });

// Override per describe
test.describe('Employee Role Tests', () => {
  test.use({ userRole: 'employee' });

  test('employee cannot see admin settings @regression', async ({ authenticatedPage }) => {
    // Logged in as employee
    await authenticatedPage.goto('/admin');
    await expect(authenticatedPage.getByText('Access Denied')).toBeVisible();
  });
});
```

This is fixture-based parameterisation — the same test infrastructure runs
under different configurations based on what `test.use()` declares.

---

## Q310.13 — What fixtures can you use in beforeAll and why is page unavailable?

`beforeAll` runs at the worker level — before any individual test exists.
The `page` fixture is test-scoped: it is created for a specific test and
closed when that test ends. Since there is no test when `beforeAll` runs,
there is no test-scoped `page`.

**Available in `beforeAll`:** worker-scoped fixtures — `browser`, `request`,
`browserName`, and any custom worker-scoped fixtures you define.

```typescript
// ✅ Worker-scoped fixtures — available in beforeAll
test.beforeAll(async ({ browser, request }) => {
  await request.post('/api/test/seed', { data: { env: 'test' } });
});

// ⚠️ page is test-scoped — Playwright warns if used in beforeAll
test.beforeAll(async ({ page }) => {
  // Avoid this — page's lifecycle is undefined outside a test
});
```

If you need browser interaction in `beforeAll`, create a page manually from
`browser` and close it yourself:

```typescript
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ storageState: '.auth/admin.json' });
  const page = await context.newPage();

  await page.goto('/seed');
  await page.getByRole('button', { name: 'Seed Data' }).click();
  await expect(page.getByText('Seeding complete')).toBeVisible();

  await context.close(); // must close manually — Playwright will not close it
});
```

The rule: when you create a resource manually in `beforeAll`, you own its
lifecycle — create it and close it yourself.

---

## Q310.14 — What is the fixture execution order relative to hooks?

```
1. Worker-scoped fixture setup      (once per worker)
2. beforeAll
3.   Test-scoped fixture setup      (once per test)
4.   beforeEach
5.   TEST RUNS
6.   afterEach
7.   Test-scoped fixture teardown
8. afterAll
9. Worker-scoped fixture teardown   (once per worker)
```

The practical implication: in `afterEach`, test-scoped fixtures are still
alive — you can use `page` and your page objects. In `afterAll`, test-scoped
fixtures for the last test have already been torn down — `page` is not
available.

```typescript
test.afterEach(async ({ page, leavePage }) => {
  // ✅ page and leavePage are alive in afterEach — use them freely
  if (test.info().status !== test.info().expectedStatus) {
    await test.info().attach('screenshot', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  }
});

test.afterAll(async () => {
  // ❌ page is NOT available here — test-scoped fixtures are already torn down
  // ✅ worker-scoped fixtures ARE still available
});
```

---

## Q310.15 — How do you use custom fixtures in beforeEach and afterEach?

Fixtures in `beforeEach` and `afterEach` work exactly like in tests — declare
them in the parameter list and Playwright injects them:

```typescript
test.describe('Leave Application', () => {

  test.beforeEach(async ({ leavePage }) => {
    // Custom fixture available in beforeEach
    await leavePage.goto();
    await leavePage.waitForPageReady();
  });

  test.afterEach(async ({ leavePage, page }) => {
    // Both custom fixture and raw page available in afterEach
    if (test.info().status !== test.info().expectedStatus) {
      const section = await leavePage.getCurrentSection();
      await test.info().attach('failure-context', {
        body: Buffer.from(`Section: ${section}\nURL: ${page.url()}`),
        contentType: 'text/plain',
      });
      await test.info().attach('screenshot', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    }
  });

  test('annual leave submits @smoke', async ({ leavePage }) => {
    await leavePage.selectLeaveType('Annual');
    await leavePage.setDates('2026-06-01', '2026-06-05');
    await leavePage.clickApply();
    await leavePage.expectSuccessMessage();
  });

});
```

The `leavePage` fixture is created once before the `beforeEach` runs and
shared across `beforeEach`, the test body, and `afterEach`. Using the page
object in `afterEach` instead of raw `page` keeps the hook consistent with
the test code.

---

## Q310.16 — Write a complete, production-ready baseFixture.ts for an OrangeHRM project.

```typescript
// fixtures/baseFixture.ts
import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { LoginPage }        from '../pages/LoginPage';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { AddEmployeePage }  from '../pages/AddEmployeePage';
import { LeavePage }        from '../pages/LeavePage';
import { AdminPage }        from '../pages/AdminPage';

type PageFixtures = {
  loginPage:        LoginPage;
  employeeListPage: EmployeeListPage;
  addEmployeePage:  AddEmployeePage;
  leavePage:        LeavePage;
  adminPage:        AdminPage;
};

type WorkerFixtures = {
  authToken: string;
};

type AutoFixtures = {
  screenshotOnFailure: void;
};

export const test = base.extend<PageFixtures & AutoFixtures, WorkerFixtures>({

  // ── Page object fixtures ──────────────────────────────────────────────────

  loginPage:        async ({ page }, use) => { await use(new LoginPage(page));        },
  employeeListPage: async ({ page }, use) => { await use(new EmployeeListPage(page)); },
  addEmployeePage:  async ({ page }, use) => { await use(new AddEmployeePage(page));  },
  leavePage:        async ({ page }, use) => { await use(new LeavePage(page));        },
  adminPage:        async ({ page }, use) => { await use(new AdminPage(page));        },

  // ── Auto fixture — screenshot on failure for every test ──────────────────

  screenshotOnFailure: [async ({ page }, use) => {
    await use();
    if (test.info().status !== test.info().expectedStatus) {
      await test.info().attach('failure-screenshot', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
      await test.info().attach('failure-url', {
        body: Buffer.from(page.url()),
        contentType: 'text/plain',
      });
    }
  }, { auto: true }],

  // ── Worker-scoped fixture — auth token shared within worker ──────────────

  authToken: [async ({ request }, use) => {
    const response = await request.post('/api/auth/login', {
      data: { username: 'Admin', password: 'admin123' },
    });
    const { token } = await response.json();
    await use(token);
    // No teardown needed — tokens expire naturally
  }, { scope: 'worker' }],

});

export { expect } from '@playwright/test';
```

---

## Q310.17 — What is the difference between fixtures and hooks?

**Use fixtures when:**
- Setup is needed across multiple spec files
- Setup involves creating objects (page objects, API clients, data factories)
- Teardown needs to be colocated with setup for clarity
- You want declarative setup — tests state what they need, Playwright provides it

**Use hooks when:**
- Setup is local to one file or describe block
- Setup is navigation-specific (go to this URL before each test in this file)
- You need to share mutable state across tests within a group (e.g., a `let createdId` variable)

In practice, use both:

```typescript
// baseFixture.ts — reusable page object, shared across files
export const test = base.extend<{ employeeListPage: EmployeeListPage }>({
  employeeListPage: async ({ page }, use) => {
    await use(new EmployeeListPage(page));
  },
});

// employee-list.spec.ts — local navigation, specific to this file
test.describe('Employee List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employees'); // local setup — only needed here
  });

  test('search by name @smoke', async ({ employeeListPage }) => {
    await employeeListPage.searchByName('Linda'); // fixture provides the object
  });
});
```

Fixtures handle shared infrastructure. Hooks handle local context.

---

## Q310.18 — What was the most impactful fixture change you introduced in your project?

The most impactful change was introducing the `screenshotOnFailure` auto
fixture. Before it, every spec file had the same `afterEach` block:

```typescript
test.afterEach(async ({ page }) => {
  if (test.info().status !== test.info().expectedStatus) {
    await test.info().attach('screenshot', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  }
});
```

This was copy-pasted across 12 spec files. When we wanted to also attach
the failure URL, we had to update 12 files. When a developer added a new
spec file, they had to remember to add the `afterEach` — and occasionally
forgot.

After moving it to an auto fixture in `baseFixture.ts`:

```typescript
screenshotOnFailure: [async ({ page }, use) => {
  await use();
  if (test.info().status !== test.info().expectedStatus) {
    await test.info().attach('failure-screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await test.info().attach('failure-url', {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });
  }
}, { auto: true }],
```

Every spec file gets it automatically. Adding a new spec file gives it
screenshots for free. Adding the URL attachment required one change in one
place. The afterEach blocks across 12 files were deleted — 36 lines of
identical code gone.

The second most impactful change was the `authToken` worker-scoped fixture
for API tests. Previously, every API test called the login endpoint to get
a token. With 40 API tests and 4 workers, that was 40 login calls. After the
worker-scoped fixture, it was 4 calls — one per worker. API test suite
startup time dropped from 18 seconds to 2 seconds.

---

## Chapter Summary

- Fixtures are Playwright's dependency injection — declare what a test needs, Playwright creates, injects, and tears it down.
- `test.extend<TestFixtures, WorkerFixtures>()` creates a new `test` object with custom fixtures on top of built-ins.
- `use()` is the fixture boundary: everything before it is setup, everything after is teardown. Teardown always runs.
- **Always import `test` and `expect` from your fixtures file, not from `@playwright/test`.** This is the most common mistake.
- Built-in scopes: `page`, `context`, `request` are test-scoped. `browser`, `browserName`, `baseURL` are worker-scoped.
- Test-scoped: fresh per test, safe for mutable state. Worker-scoped: shared across tests in a worker, must not be mutated.
- Fixtures can depend on other fixtures — declare the dependency in the parameter list, Playwright resolves the chain.
- Auto fixtures (`{ auto: true }`) run for every test without declaration — use for screenshot capture, logging, monitoring.
- Override built-in fixtures to change default behaviour for all tests. Use `test.use()` for scoped lightweight overrides.
- Fixture options (`{ option: true }`) enable fixture parameterisation — the fixture reads a configurable value via `test.use()`.
- `beforeAll`/`afterAll` can only use worker-scoped fixtures — `page` is test-scoped and unavailable. Use `browser` instead.
- Fixture execution order: fixture setup → beforeEach → test → afterEach → fixture teardown. In `afterAll`, test fixtures are gone.
- Fixtures for shared infrastructure across files; hooks for local file-specific setup.
