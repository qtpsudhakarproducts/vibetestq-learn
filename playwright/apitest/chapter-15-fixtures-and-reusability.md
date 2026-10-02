# Chapter 15 — Fixtures and Reusability

---

## What You Will Learn

- How to build custom fixtures with `test.extend()`
- Fixture scopes: test vs worker
- Data factory fixtures
- When fixtures are better than beforeEach

---

## 15.1 What Fixtures Are

A fixture is a piece of setup code that Playwright runs before a test and cleanup code it runs after. The test receives the result as a parameter.

The built-in `request` fixture is an example. Playwright creates an `APIRequestContext`, gives it to your test function, and disposes it when the test finishes. You never call `new APIRequestContext()` yourself.

You can create your own fixtures with `test.extend()`.

---

## 15.2 Auth Fixture (Revisited with Full Scope Options)

```typescript
// fixtures/auth-fixtures.ts
import { test as base, APIRequestContext } from '@playwright/test';

type AuthFixtures = {
  authedRequest: APIRequestContext;
  adminToken:    string;
};

export const test = base.extend<AuthFixtures>({
  // authedRequest — creates a new authenticated context per test
  authedRequest: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
    });
    const loginResponse = await context.post('/login', {
      data: { username: 'admin', password: 'password123' },
    });
    const { token } = await loginResponse.json();
    await context.dispose();

    const authContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });

    await use(authContext);
    await authContext.dispose();
  },

  // adminToken — just the token string, for tests that build headers manually
  adminToken: async ({ request }, use) => {
    const loginResponse = await request.post('/login', {
      data: { username: 'admin', password: 'password123' },
    });
    const { token } = await loginResponse.json();
    await use(token);
    // no cleanup needed — tokens expire naturally
  },
});
```

---

## 15.3 Data Factory Fixture

A data factory creates and tears down test data. Tests receive ready-made resources without writing setup code in every test.

```typescript
// fixtures/employee-fixture.ts
import { test as base } from '@playwright/test';

type Employee = {
  id:        string;
  firstName: string;
  lastName:  string;
  email:     string;
  department: string;
  role:      string;
  createdAt: string;
};

type EmployeeFixtures = {
  testEmployee: Employee;
};

export const test = base.extend<EmployeeFixtures>({
  testEmployee: async ({ request }, use) => {
    // Create a fresh employee before the test
    const response = await request.post('/employees', {
      data: {
        firstName:  'Fixture',
        lastName:   'Employee',
        email:      `fixture.${Date.now()}@company.com`,
        department: 'Engineering',
        role:       'Engineer',
      },
    });
    const employee: Employee = await response.json();

    // Hand the employee to the test
    await use(employee);

    // Delete the employee after the test — always runs, even on failure
    await request.delete(`/employees/${employee.id}`);
  },
});
```

**Using the fixture:**

```typescript
import { test, expect } from '../fixtures/employee-fixture';

test('get employee — fixture provides the ID', async ({ request, testEmployee }) => {
  const response = await request.get(`/employees/${testEmployee.id}`);

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.id).toBe(testEmployee.id);
  expect(body.firstName).toBe('Fixture');
});

test('patch employee role — fixture handles cleanup', async ({ request, testEmployee }) => {
  const response = await request.patch(`/employees/${testEmployee.id}`, {
    data: { role: 'Senior Engineer' },
  });

  expect(response.status()).toBe(200);
  expect((await response.json()).role).toBe('Senior Engineer');
});
```

The fixture handles creation and deletion. The test only handles what it is testing.

---

## 15.4 Fixture Scope

By default, fixtures run once per test (`'test'` scope). You can change scope to `'worker'` to share a fixture across all tests in the same parallel worker.

```typescript
export const test = base.extend<{}, { sharedToken: string }>({
  // Worker scope — login once per worker, not once per test
  sharedToken: [async ({ playwright }, use) => {
    const context = await playwright.request.newContext({ baseURL: 'http://localhost:3000' });
    const loginResponse = await context.post('/login', {
      data: { username: 'admin', password: 'password123' },
    });
    const { token } = await loginResponse.json();
    await context.dispose();

    await use(token);
  }, { scope: 'worker' }],
});
```

Use worker scope when:
- The setup is expensive (slow login, complex data seed)
- The shared resource is read-only — tests do not modify it
- You are running tests in parallel and want to avoid redundant setup

---

## Interview Questions — Chapter 15

**Q1. What is a Playwright fixture and how does it differ from beforeEach?**

A fixture is a named, reusable setup function that Playwright injects into tests as a parameter. `beforeEach` is a hook that runs before every test in a describe block and sets module-level variables. Fixtures are more composable — a test can use multiple fixtures without them conflicting. Fixtures also clean up automatically after the test using the `await use()` pattern. Multiple tests in different files can share the same fixture without duplicating setup.

**Q2. What is the `await use()` pattern in a fixture and why is it important?**

`await use(value)` hands the fixture's value to the test and pauses. When the test finishes — success or failure — control returns to the line after `await use()`. Any code after `await use()` is cleanup code. This guarantees cleanup always runs, even when the test fails, without the test needing to call any cleanup function itself.

**Q3. What is the difference between test scope and worker scope for fixtures?**

Test scope (default) creates a new fixture instance for every test. Worker scope creates the fixture once per parallel worker and shares it across all tests running on that worker. Test scope gives full isolation. Worker scope gives performance — useful for expensive setup like authentication that does not change between tests.

**Q4. When should you use a data factory fixture instead of creating data inside the test?**

When multiple tests need the same type of resource with the same structure. A data factory fixture eliminates the repeated create/cleanup code from every test. It also guarantees cleanup happens even when a test fails. Use it when the creation logic is more than 3–4 lines and when the same pattern repeats across more than 2–3 tests.

**Q5. How would you share an auth token across all tests in a file without logging in for every test?**

Use a worker-scoped fixture that logs in once and returns the token. Or use `test.beforeAll()` to log in once, store the token in a variable, and use it in every test within the describe block. Worker-scoped fixtures are cleaner — they work across multiple files without any extra code.

---

