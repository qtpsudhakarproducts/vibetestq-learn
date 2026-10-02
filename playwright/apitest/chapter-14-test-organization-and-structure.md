# Chapter 14 — Test Organization and Structure

---

## What You Will Learn

- How to use `describe` blocks to group related tests
- When to use `beforeEach`, `afterEach`, `beforeAll`, `afterAll`
- How to structure test files for large API suites
- Naming conventions that make test output readable

---

## 14.1 describe Blocks

`test.describe()` groups related tests under a shared label. Test runners show the group name before each test name, making output much easier to read.

```typescript
import { test, expect } from '@playwright/test';

test.describe('POST /employees', () => {
  test('creates a new employee with valid data', async ({ request }) => { ... });
  test('returns 400 when email is missing', async ({ request }) => { ... });
  test('returns 400 for invalid department', async ({ request }) => { ... });
  test('returns 400 for duplicate email', async ({ request }) => { ... });
});

test.describe('GET /employees', () => {
  test('returns an array', async ({ request }) => { ... });
  test('filters by department', async ({ request }) => { ... });
  test('returns empty array when no employees exist', async ({ request }) => { ... });
});

test.describe('DELETE /employees/:id', () => {
  test('removes the employee', async ({ request }) => { ... });
  test('returns 404 for non-existent ID', async ({ request }) => { ... });
  test('returns 404 on second delete', async ({ request }) => { ... });
});
```

**Output with describe blocks:**

```
POST /employees
  ✓ creates a new employee with valid data
  ✓ returns 400 when email is missing
  ✓ returns 400 for invalid department

GET /employees
  ✓ returns an array
  ✓ filters by department
```

---

## 14.2 Lifecycle Hooks

| Hook | When It Runs | Use It For |
|------|-------------|-----------|
| `beforeAll` | Once before all tests in a file | Seeding shared data, opening a connection |
| `afterAll` | Once after all tests in a file | Cleanup, closing a connection |
| `beforeEach` | Before every test | Creating test-specific data |
| `afterEach` | After every test | Deleting test-specific data |

**`beforeAll` and `afterAll` — shared setup:**

```typescript
test.describe('employee list tests', () => {
  let seedIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    // Create shared employees once — all tests in this describe block use them
    const [r1, r2, r3] = await Promise.all([
      request.post('/employees', { data: { firstName: 'A', lastName: 'A', email: 'a@test.com', department: 'Engineering', role: 'Dev' } }),
      request.post('/employees', { data: { firstName: 'B', lastName: 'B', email: 'b@test.com', department: 'HR', role: 'Mgr' } }),
      request.post('/employees', { data: { firstName: 'C', lastName: 'C', email: 'c@test.com', department: 'Engineering', role: 'Lead' } }),
    ]);
    const bodies = await Promise.all([r1.json(), r2.json(), r3.json()]);
    seedIds = bodies.map(b => b.id);
  });

  test.afterAll(async ({ request }) => {
    await Promise.all(seedIds.map(id => request.delete(`/employees/${id}`)));
  });

  test('list contains seeded employees', async ({ request }) => {
    const response = await request.get('/employees');
    const body = await response.json();
    expect(body.length).toBeGreaterThanOrEqual(3);
  });

  test('filter returns only Engineering employees', async ({ request }) => {
    const response = await request.get('/employees', { params: { department: 'Engineering' } });
    const body = await response.json();
    for (const emp of body) {
      expect(emp.department).toBe('Engineering');
    }
  });
});
```

**`beforeEach` and `afterEach` — per-test setup:**

```typescript
test.describe('single employee operations', () => {
  let employeeId = '';

  test.beforeEach(async ({ request }) => {
    const response = await request.post('/employees', {
      data: {
        firstName:  'Test',
        lastName:   'Employee',
        email:      `test.${Date.now()}@company.com`,  // unique email per test
        department: 'HR',
        role:       'Tester',
      },
    });
    const body = await response.json();
    employeeId = body.id;
  });

  test.afterEach(async ({ request }) => {
    if (employeeId) {
      await request.delete(`/employees/${employeeId}`);
      employeeId = '';
    }
  });

  test('get the employee by ID', async ({ request }) => {
    const response = await request.get(`/employees/${employeeId}`);
    expect(response.status()).toBe(200);
  });

  test('update the employee role', async ({ request }) => {
    const response = await request.patch(`/employees/${employeeId}`, {
      data: { role: 'Senior Tester' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.role).toBe('Senior Tester');
  });
});
```

---

## 14.3 File Structure for Large Test Suites

```
employee-tests/
  tests/
    employees/
      create.spec.ts      ← POST /employees tests
      list.spec.ts        ← GET /employees tests
      single.spec.ts      ← GET /employees/:id tests
      update.spec.ts      ← PUT and PATCH tests
      delete.spec.ts      ← DELETE tests
    auth/
      api-key.spec.ts
      jwt.spec.ts
      basic-auth.spec.ts
      session.spec.ts
      oauth.spec.ts
    advanced/
      schema.spec.ts
      performance.spec.ts
      contract.spec.ts
  fixtures/
    auth-fixtures.ts      ← shared auth fixture
    data-fixtures.ts      ← shared data factory fixture
  helpers/
    employee-helper.ts    ← create/cleanup helpers
```

---

## 14.4 Test Naming Conventions

Good test names complete the sentence: "When I call this endpoint, it should..."

**Pattern:** `[method] [endpoint] — [condition] returns [expected outcome]`

```typescript
// ✅ Clear names
test('POST /employees — valid data returns 201 with id')
test('POST /employees — missing email returns 400 with error message')
test('GET /employees/:id — non-existent ID returns 404')
test('DELETE /employees/:id — second delete returns 404')
test('PATCH /employees/:id — only role field changes')

// ❌ Vague names
test('create employee')
test('test update')
test('error case')
```

---

## Interview Questions — Chapter 14

**Q1. What is the purpose of `test.describe()` in Playwright?**

It groups related tests under a shared label. The group name appears before each test name in the output — making it easy to see which area of the API a failing test belongs to. It also lets you apply shared setup hooks (`beforeEach`, `afterAll`) to only the tests in that group.

**Q2. What is the difference between `beforeAll` and `beforeEach`?**

`beforeAll` runs once before all tests in a file or describe block. Use it for expensive setup shared by all tests — like seeding a dataset. `beforeEach` runs before every individual test. Use it for test-specific setup that each test needs fresh — like creating an employee for that specific test.

**Q3. Why use `Date.now()` in a test email address like `test.${Date.now()}@company.com`?**

It ensures the email address is unique for each test run. The API rejects duplicate emails. If two tests create an employee with the same email, the second creation returns 400. Using `Date.now()` generates a different timestamp-based email for every test, preventing conflicts.

**Q4. Should cleanup code go in `afterEach` or in the test itself?**

In `afterEach`. If cleanup is inside the test and the test fails halfway through, cleanup code after the failure never runs. `afterEach` always runs — even when the test fails. This guarantees that created resources are always cleaned up regardless of test outcome.

**Q5. How would you organise a large API test suite with 100+ tests?**

Separate files by endpoint — one file per endpoint group. Group tests within a file by operation using `describe` blocks. Keep shared fixtures and helpers in separate folders. Use consistent naming conventions across all files. This makes it easy to find tests for a specific endpoint, add new tests, and identify what failed in CI output.

---

