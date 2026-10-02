# Chapter 505 — Test Independence & State Setup (L4)

This chapter covers the practices and patterns that make every test fully
independent — creating its own preconditions, running in any order, and
leaving no shared state for other tests to depend on. Interviewers ask about
test independence to separate engineers who understand isolation from those
who have only written sequential, order-dependent suites. The ability to
explain `beforeAll` vs `beforeEach`, the role of API state setup, and the
`ApiClient` pattern are strong differentiators at the senior level.

---

## Q505.1 — What is the test dependency problem?

Test dependency means a test requires another test to have run first in
order to pass. This creates a cascading failure pattern:

```
Morning scenario on a shared demo site:
09:00 — employee.spec.ts  PASS ✅  Alice Johnson created
09:00 — user.spec.ts      FAIL ❌  Employee "Alice Johnson" not found
09:00 — leave.spec.ts     FAIL ❌  No ESS user to apply leave with
```

The user test fails not because user creation is broken — it fails because
its precondition (an employee existing) was not met. The demo site reset
overnight; Alice Johnson no longer exists. One root cause produces three
red tests and a misleading failure report.

This pattern has three consequences:

1. **False failures** — tests fail for reasons unrelated to what they test
2. **Unreliable CI** — the suite is only reliable if tests always run in
   the exact same order, which breaks down with sharding and parallel runs
3. **Wasted debugging time** — engineers investigate three failures when
   there is only one real problem

Level 4 fixes this by making every test responsible for creating its own
preconditions.

---

## Q505.2 — What does a fully independent test look like?

A fully independent test has three characteristics:

**Creates everything it needs** — if the test needs an employee to exist,
it creates that employee before the scenario runs.

**Runs in any order** — independent of whether other tests ran before it,
after it, or at all. Safe to shuffle, parallelise, or execute in isolation.

**Cleans up after itself** — removes the data it created when it finishes,
leaving a clean state for subsequent tests.

```typescript
test.describe('Admin — User Management', () => {

  let empNumber: string;
  let employee:  ReturnType<typeof generateEmployee>;

  // Creates its own employee — no dependency on employee.spec.ts
  test.beforeAll(async ({ employeeApi }) => {
    employee  = generateEmployee();
    empNumber = await employeeApi.create(employee);
  });

  // Removes its employee when done — does not pollute shared state
  test.afterAll(async ({ employeeApi }) => {
    if (empNumber) await employeeApi.delete(empNumber);
  });

  test('admin can add a user linked to the employee', async ({ addUserPage }) => {
    // employee is guaranteed to exist — no cross-file assumption
    await addUserPage.addUser(generateUser(employee));
    await addUserPage.assertUserSavedSuccessfully();
  });

});
```

---

## Q505.3 — What is the difference between beforeEach and beforeAll for state setup?

```typescript
// beforeEach — runs before EVERY test in the block
test.beforeEach(async ({ employeeApi }) => {
  const employee = generateEmployee();
  await employeeApi.create(employee);  // creates a new employee before EACH test
  // 5 tests × 1 employee = 5 API calls = 5 employees created
});

// beforeAll — runs ONCE before ALL tests in the block
test.beforeAll(async ({ employeeApi }) => {
  const employee = generateEmployee();
  await employeeApi.create(employee);  // creates ONE employee shared by all tests
  // 5 tests × 1 employee = 1 API call = 1 employee shared
});
```

**For state setup (creating prerequisites): use `beforeAll`.**
All tests in the block that need the employee can use the same one.
Creating a new employee before every test is wasteful and slow.

**When would `beforeEach` be appropriate for state?**
When each test needs a completely fresh, isolated record — for example,
leave applications where creating two leave requests for the same employee
on the same date might conflict. Most precondition setup belongs in `beforeAll`.

The pairing is: `beforeAll` + `afterAll` for shared state; `beforeEach` +
`afterEach` for per-test state.

---

## Q505.4 — What are the two approaches to test state setup?

**Approach 1 — `beforeAll` UI setup:**
Drive the browser UI once at the start of a describe block:

```typescript
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    storageState: 'playwright/.auth/admin.json',
  });
  const page            = await context.newPage();
  const addEmployeePage = new AddEmployeePage(page);

  employee = generateEmployee();
  await addEmployeePage.goto();
  await addEmployeePage.addEmployee(employee);
  await context.close();
});
```

Use when: the application has no API, or the needed endpoints are not
exposed.

**Approach 2 — API state setup:**
Create preconditions via HTTP before the browser opens:

```typescript
test.beforeAll(async ({ employeeApi }) => {
  employee  = generateEmployee();
  empNumber = await employeeApi.create(employee);
});
```

Use when: the application exposes REST endpoints for the entities you need.

**The comparison:**

| Criterion | beforeAll UI | API setup |
|-----------|-------------|-----------|
| Speed | 3–5 seconds | 200–500ms |
| Reliability | Medium (UI flakiness) | High |
| Dependency | Requires browser | No browser needed |
| Availability | Always possible | Requires API endpoints |

---

## Q505.5 — What is the ApiClient class and what does it do?

`ApiClient` is a thin HTTP wrapper around Playwright's `APIRequestContext`.
It handles the base URL, admin authentication header, and response validation
in one place — all API modules use it and never construct HTTP requests
directly:

```typescript
// api/ApiClient.ts
import { APIRequestContext, request } from '@playwright/test';

export class ApiClient {

  private readonly context:    APIRequestContext;
  private readonly baseURL:    string;
  private readonly authHeader: string;

  private constructor(context: APIRequestContext, baseURL: string, authHeader: string) {
    this.context    = context;
    this.baseURL    = baseURL;
    this.authHeader = authHeader;
  }

  // Factory method — creates a client with admin credentials
  static async create(baseURL: string, username: string, password: string): Promise<ApiClient> {
    const context     = await request.newContext({ baseURL });
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    return new ApiClient(context, baseURL, `Basic ${credentials}`);
  }

  async get(path: string): Promise<unknown> {
    const response = await this.context.get(path, {
      headers: { Authorization: this.authHeader },
    });
    return this.handleResponse(response, `GET ${path}`);
  }

  async post(path: string, body: unknown): Promise<unknown> {
    const response = await this.context.post(path, {
      headers: { Authorization: this.authHeader, 'Content-Type': 'application/json' },
      data: body,
    });
    return this.handleResponse(response, `POST ${path}`);
  }

  async delete(path: string): Promise<void> {
    const response = await this.context.delete(path, {
      headers: { Authorization: this.authHeader },
    });
    if (!response.ok()) {
      throw new Error(`DELETE ${path} failed: ${response.status()}`);
    }
  }

  private async handleResponse(response: any, operation: string): Promise<unknown> {
    if (!response.ok()) {
      throw new Error(
        `API ${operation} failed.\nStatus: ${response.status()}\n` +
        `Response: ${await response.text()}`
      );
    }
    return response.json();
  }

  async dispose(): Promise<void> {
    await this.context.dispose();
  }
}
```

Why a static `create()` factory method rather than a regular constructor?
The factory is `async` — it calls `request.newContext()` which is async.
TypeScript constructors cannot be async. The factory pattern is the standard
workaround.

---

## Q505.6 — What does EmployeeApi look like?

```typescript
// api/EmployeeApi.ts
import { ApiClient }    from './ApiClient';
import { EmployeeData } from '../data/types';

export class EmployeeApi {

  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  // Creates an employee, returns the empNumber assigned by OrangeHRM
  async create(employee: EmployeeData): Promise<string> {
    const response = await this.client.post('/api/v2/pim/employees', {
      firstName:  employee.firstName,
      lastName:   employee.lastName,
      employeeId: employee.employeeId,
    }) as { data: { empNumber: string } };

    return response.data.empNumber;
  }

  // Deletes an employee — used in afterAll cleanup
  async delete(empNumber: string): Promise<void> {
    await this.client.delete(`/api/v2/pim/employees/${empNumber}`);
  }

  // Finds an employee by name — useful when empNumber was not captured at creation
  async getEmpNumberByName(fullName: string): Promise<string | null> {
    const response = await this.client.get(
      `/api/v2/pim/employees?nameOrId=${encodeURIComponent(fullName)}`
    ) as { data: Array<{ empNumber: string; firstName: string; lastName: string }> };

    const match = response.data.find(
      emp => `${emp.firstName} ${emp.lastName}` === fullName
    );
    return match?.empNumber ?? null;
  }
}
```

The return value from `create()` is the employee number — not the employee
data itself. The employee number is OrangeHRM's internal identifier used
to link users to employees and submit leave requests. Capturing it at
creation time and storing it in `beforeAll` scope makes it available
to all tests in the block and to `afterAll` for cleanup.

---

## Q505.7 — What does the API fixture integration look like?

API fixtures are added alongside page object fixtures in `fixtures/index.ts`.
They create and dispose their `ApiClient` around each test:

```typescript
// fixtures/index.ts — API fixture additions
import { ApiClient, EmployeeApi, UserApi, LeaveApi } from '../api';

type ApiFixtures = {
  employeeApi: EmployeeApi;
  userApi:     UserApi;
  leaveApi:    LeaveApi;
};

const test = base.extend<OrangeHRMFixtures & ApiFixtures>({

  // ...existing page object fixtures...

  employeeApi: async ({}, use) => {
    const client = await ApiClient.create(
      process.env.BASE_URL ?? 'https://opensource-demo.orangehrmlive.com',
      process.env.ADMIN_USER ?? 'Admin',
      process.env.ADMIN_PASS ?? 'admin123'
    );
    await use(new EmployeeApi(client));
    await client.dispose();  // teardown — disposes the HTTP context after the test
  },

  userApi: async ({}, use) => {
    const client = await ApiClient.create(
      process.env.BASE_URL ?? 'https://opensource-demo.orangehrmlive.com',
      process.env.ADMIN_USER ?? 'Admin',
      process.env.ADMIN_PASS ?? 'admin123'
    );
    await use(new UserApi(client));
    await client.dispose();
  },

  leaveApi: async ({}, use) => {
    const client = await ApiClient.create(
      process.env.BASE_URL ?? 'https://opensource-demo.orangehrmlive.com',
      process.env.ADMIN_USER ?? 'Admin',
      process.env.ADMIN_PASS ?? 'admin123'
    );
    await use(new LeaveApi(client));
    await client.dispose();
  },

});
```

Notice the API fixtures receive `{}` (empty destructure) — they do not
depend on `page`. API calls are completely independent of the browser.

---

## Q505.8 — How do the rewritten user tests look with API setup?

```typescript
// tests/admin/user.spec.ts
import { test, expect }                  from '../../fixtures';
import { generateEmployee, generateUser } from '../../data/generate';

test.describe('Admin — User Management', () => {

  let empNumber: string;
  let employee:  ReturnType<typeof generateEmployee>;
  let user:      ReturnType<typeof generateUser>;

  // Create employee via API once — no dependency on employee.spec.ts
  test.beforeAll(async ({ employeeApi }) => {
    employee  = generateEmployee();
    empNumber = await employeeApi.create(employee);
    user      = generateUser(employee);
  });

  // Always runs — removes test data regardless of test pass/fail
  test.afterAll(async ({ employeeApi }) => {
    if (empNumber) await employeeApi.delete(empNumber);
  });

  test('admin can add a new system user', async ({ userManagementPage, addUserPage }) => {
    await userManagementPage.clickAddUser();
    await addUserPage.assertPageLoaded();
    await addUserPage.addUser(user);
    await addUserPage.assertUserSavedSuccessfully();
  });

  test('user appears in management list', async ({ userManagementPage }) => {
    await userManagementPage.searchByUsername(user.username);
    await userManagementPage.assertUserExistsInList(user.username);
  });

  test('search with non-existent name shows no records', async ({ userManagementPage }) => {
    await userManagementPage.searchByUsername('ZZZNOTEXIST999');
    await userManagementPage.assertNoRecordsFound();
  });

});
```

This test file now passes whether or not `employee.spec.ts` ran. It creates
its own employee in `beforeAll`, verifies user creation in the test body,
and deletes the employee in `afterAll`. The dependency chain is broken.

---

## Q505.9 — Why is afterAll cleanup important and what happens without it?

Without cleanup, each test run leaves data in the application:

```
Run 1: Creates employee "Alice-20260309"
Run 2: Creates employee "Alice-20260310"
Run 3: Creates employee "Alice-20260311"
...
After 100 runs: 100 test employees in the system
```

Problems this causes:
- **Search tests break** — searching for "Alice" returns 100 results instead
  of the expected 1 — `assertEmployeeExistsInList` finds the right record
  but `toHaveCount(1)` assertions fail
- **Demo site quotas** — shared demo sites often have record limits
- **Visual noise** — the application becomes cluttered with test artefacts
  that make manual testing harder

```typescript
// Always clean up with afterAll
test.afterAll(async ({ employeeApi }) => {
  if (empNumber) await employeeApi.delete(empNumber);
  // The `if` guard prevents errors when beforeAll itself failed
  // and empNumber was never set
});
```

The `if (empNumber)` guard is essential. If `beforeAll` fails before
`empNumber` is assigned, `afterAll` runs with `empNumber` undefined.
Without the guard, `employeeApi.delete(undefined)` throws — and you have
a cleanup failure in addition to the original setup failure.

---

## Q505.10 — How do you split a describe block to make leave tests independent?

The leave workflow has two roles: ESS user applies, Admin approves.
At Level 3 they were in one describe block with an ordering dependency.
At Level 4 they are split into two independent describe blocks:

```typescript
// tests/leave/leave.spec.ts

// Apply tests — ESS user, no API preconditions needed
test.describe('Leave — Apply Workflow (ESS)', () => {

  test('ESS user can apply for leave via UI', async ({ applyLeavePage }) => {
    const leave = generateLeave();
    await applyLeavePage.applyForLeave(leave);
    await applyLeavePage.assertLeaveApplicationSubmitted();
  });

});

// Approval tests — Admin, uses API to create the leave request
test.describe('Leave — Approve Workflow (Admin)', () => {

  let empNumber: string;
  let leaveId:   number;

  test.beforeAll(async ({ employeeApi, leaveApi }) => {
    const employee = generateEmployee();
    empNumber = await employeeApi.create(employee);
    const leave = generateLeave();
    leaveId   = await leaveApi.createRequest(leave, empNumber);
  });

  test.afterAll(async ({ employeeApi }) => {
    if (empNumber) await employeeApi.delete(empNumber);
  });

  test('admin can see pending leave request', async ({ leaveListPage }) => {
    await leaveListPage.assertLeaveRequestVisible(leaveId.toString());
    await leaveListPage.assertLeaveRequestStatus(leaveId.toString(), 'Pending');
  });

  test('admin can approve leave request', async ({ leaveListPage }) => {
    await leaveListPage.approveLeaveRequest(leaveId.toString());
    await leaveListPage.assertLeaveApproved();
  });

});
```

The approval tests no longer depend on the apply test having run. They
create their own leave request via API in `beforeAll`. The apply tests
have no dependency at all — each creates its own leave application inline.

---

## Q505.11 — What is the APIRequestContext and how does it differ from page.request?

Playwright provides two ways to make HTTP requests:

**`page.request`** — bound to a browser page; shares cookies and session
state with that page. Useful when you need API calls that are authenticated
via the same session as the browser test:
```typescript
// Same session as the page — shares cookies
const response = await page.request.get('/api/v2/pim/employees');
```

**`request.newContext()`** — completely independent of any browser page.
A standalone HTTP client that can make authenticated API calls without
a browser being open:
```typescript
// Independent of any page — used in fixtures and beforeAll blocks
const context  = await request.newContext({ baseURL });
const response = await context.get('/api/v2/pim/employees', {
  headers: { Authorization: 'Basic ...' },
});
await context.dispose(); // clean up when done
```

For test state setup in `beforeAll` and fixtures, `request.newContext()`
is always the right choice — it does not depend on a browser page being
open and can be used in `worker`-scoped fixtures or global setup.

---

## Q505.12 — What is the beforeAll UI approach for teams without API access?

When the application has no API, use a separate browser context in
`beforeAll` to drive the UI for setup:

```typescript
test.describe('Admin — User Management', () => {

  let employee: ReturnType<typeof generateEmployee>;

  test.beforeAll(async ({ browser }) => {
    // Create a dedicated context for setup — separate from test browser contexts
    const context = await browser.newContext({
      storageState: 'playwright/.auth/admin.json',  // load admin session
    });
    const page = await context.newPage();
    const addEmployeePage = new AddEmployeePage(page);

    employee = generateEmployee();
    await addEmployeePage.goto();
    await addEmployeePage.addEmployee(employee);
    await addEmployeePage.assertEmployeeSavedSuccessfully();

    await context.close();  // close setup context — does not affect test contexts
  });

  test('admin can add a user linked to the employee', async ({ addUserPage }) => {
    // employee was created in beforeAll — available to all tests in this block
    await addUserPage.addUser(generateUser(employee));
    await addUserPage.assertUserSavedSuccessfully();
  });

});
```

The setup context is created and closed independently of the test contexts.
The `storageState` loaded in `beforeAll` does not affect the authentication
state of the test contexts — each test still gets its own `page` with its
own auth state from the project configuration.

---

## Q505.13 — What project structure changes at Level 4?

```
api/                     ← NEW — HTTP API client layer
  ApiClient.ts           ← HTTP wrapper, authentication, error handling
  EmployeeApi.ts         ← create, delete, getByName
  UserApi.ts             ← create, delete
  LeaveApi.ts            ← createRequest, getPendingByEmployee
  index.ts               ← barrel exports

fixtures/
  index.ts               ← UPDATED — employeeApi, userApi, leaveApi fixtures added

tests/
  pim/employee.spec.ts   ← UPDATED — self-contained, generates its own data
  admin/user.spec.ts     ← UPDATED — beforeAll API setup + afterAll cleanup
  leave/leave.spec.ts    ← UPDATED — split into two independent describe blocks

pages/**                 ← NO CHANGES
playwright.config.ts     ← NO CHANGES
```

The API layer is a new vertical slice — completely separate from page
objects and helpers. Page objects interact with the UI; API modules
interact with the HTTP layer. They never call each other.

---

## Q505.14 — What is the LeaveApi and why does it resolve leave type names to IDs?

```typescript
// api/LeaveApi.ts
async createRequest(leave: LeaveData, empNumber: string): Promise<number> {
  const response = await this.client.post('/api/v2/leave/leaveRequests', {
    type:     { id: await this.getLeaveTypeId(leave.leaveType) },  // ← name → ID
    fromDate: leave.fromDate,
    toDate:   leave.toDate,
    comment:  leave.comment,
    empNumber,
  }) as { data: { id: number } };
  return response.data.id;
}

// OrangeHRM stores leave types with numeric IDs — the API requires the ID
// Tests pass a human-readable name; LeaveApi resolves it to an ID
private async getLeaveTypeId(leaveTypeName: string): Promise<number> {
  const response = await this.client.get('/api/v2/leave/leaveTypes?limit=50') as {
    data: Array<{ id: number; name: string }>;
  };
  const match = response.data.find(lt => lt.name === leaveTypeName);
  if (!match) {
    throw new Error(
      `LeaveApi: leave type "${leaveTypeName}" not found.\n` +
      `Available types: ${response.data.map(lt => lt.name).join(', ')}`
    );
  }
  return match.id;
}
```

The test calls `leaveApi.createRequest({ leaveType: 'Annual Leave' }, empNumber)`.
The API requires the numeric ID for Annual Leave — which might be `1` on one
server and `3` on another. `getLeaveTypeId()` looks it up at runtime so the
test never hardcodes the internal ID. If the leave type does not exist,
the error message lists the available types — making misconfiguration
immediately diagnosable.

---

## Q505.15 — How do you handle test data in beforeAll scope that multiple tests need?

Declare the variables at `describe` scope so all tests and lifecycle
hooks can access them:

```typescript
test.describe('Admin — User Management', () => {

  // Declared at describe scope — accessible by beforeAll, afterAll, and all tests
  let empNumber: string;
  let employee:  ReturnType<typeof generateEmployee>;
  let user:      ReturnType<typeof generateUser>;

  test.beforeAll(async ({ employeeApi }) => {
    // ASSIGN here — not declare
    employee  = generateEmployee();
    empNumber = await employeeApi.create(employee);
    user      = generateUser(employee);
    // All tests can now read: employee, empNumber, user
  });

  test.afterAll(async ({ employeeApi }) => {
    if (empNumber) await employeeApi.delete(empNumber);
    // Uses empNumber set in beforeAll
  });

  test('user creation works', async ({ addUserPage }) => {
    await addUserPage.addUser(user);  // accesses user from beforeAll scope
  });

});
```

**TypeScript note:** The variables are declared with `let` (not `const`)
because they are assigned inside `beforeAll`, not at declaration time.
TypeScript's `strict` mode (which the framework uses) requires that
`let` variables be assigned before use — `beforeAll` guarantees the
assignment happens before any test runs.

---

## Q505.16 — When should you use API setup vs UI setup for test preconditions?

**Use API setup when:**
- The application has REST endpoints for creating the entities you need
- Setup speed matters (100+ tests, CI time sensitive)
- Setup reliability matters (unstable UI, shared demo site)
- The setup data is not what the test is testing

**Use beforeAll UI setup when:**
- The application has no API or relevant endpoints are not exposed
- Setting up via API is not possible (e.g., a file upload that must go
  through UI processing)
- The team is not yet ready to add HTTP infrastructure

**Never use beforeEach for preconditions** unless each test genuinely
needs a fresh record:
- `beforeEach` creates N records for N tests — wasteful
- `beforeAll` creates 1 record shared by all tests in the block — efficient

**The boundary:** API setup creates state. The browser test verifies the
UI for that state. They are separate concerns. Using the API for setup
does not compromise the browser test — the UI still renders the data
created by the API and the test still validates the UI.

---

## Q505.17 — What changed from Level 3 to Level 4 in the test files?

**Level 3 employee test:**
```typescript
test('employee appears in employee list', async ({ employeeListPage }) => {
  // Assumes employee.spec.ts ran and created Bob Williams in the same run
  await employeeListPage.searchByEmployeeName('Bob');
  await employeeListPage.assertEmployeeExistsInList('Bob Williams');
});
```

**Level 4 employee test:**
```typescript
test('employee appears in list after creation', async ({ addEmployeePage, employeeListPage }) => {
  const employee = generateEmployee();  // creates unique data for this test run

  await addEmployeePage.addEmployee(employee);
  await addEmployeePage.assertEmployeeSavedSuccessfully();

  // Navigate to list and verify — no cross-test assumption
  await employeeListPage.goto();
  await employeeListPage.searchByEmployeeName(employee.firstName);
  await employeeListPage.assertEmployeeExistsInList(employee.fullName);
});
```

The Level 4 test generates its own employee, creates it, and verifies
it in the list — all in one test. No other test needs to have run.
No shared state assumption. Any parallelisation is safe.

---

## Q505.18 — What does Level 4 not solve?

Level 4 makes tests independent. The remaining problems:

**Hardcoded data in test files:** employee names, leave dates, and passwords
are still string literals or simple generated values inline in each test
file. There is no centralised data layer, no Faker integration, no
file-based dataset support, and no environment-specific credential management.

Level 5 introduces the full test data layer — `generate.ts` with Faker
for realistic, unique data per run; `readers.ts` for CSV/JSON/Excel/env
file datasets; type definitions that span the entire framework.

**Duplicated UI interaction patterns:** date pickers, autocomplete, and
dropdown components still have their own implementation in each page object.
Level 6 extracts these into shared web action helpers.

---

## Chapter Summary

- Test dependency: a test that requires another test to have run first; causes cascading failures and misleading reports.
- A fully independent test creates its own preconditions, runs in any order, and cleans up its own data.
- `beforeAll` — runs once before all tests in a describe block; the right hook for creating shared preconditions.
- `afterAll` — runs once after all tests; always guard the cleanup with `if (id)` to handle beforeAll failures gracefully.
- `beforeEach` for preconditions is wasteful — creates N records for N tests; use `beforeAll` unless each test truly needs an isolated record.
- `ApiClient` — wraps Playwright's `request.newContext()` with auth, base URL, and response validation; created via static async factory method.
- `EmployeeApi`, `UserApi`, `LeaveApi` — domain-specific modules that translate between data types and OrangeHRM API endpoints.
- API fixtures in `fixtures/index.ts` use `{}` (empty destructure) — they do not depend on `page`; fully independent of the browser.
- `beforeAll` UI setup — creates a separate browser context with `storageState`; closed after setup; does not affect test contexts.
- `page.request` shares session with the browser; `request.newContext()` is fully independent — prefer the latter for fixtures and beforeAll.
- API vs UI setup tradeoff: API is 10–20× faster and more reliable; UI works when no API is available.
- Declare `let` variables at `describe` scope for values assigned in `beforeAll` and used across tests and `afterAll`.
- Level 4 solves test ordering; it deliberately leaves centralised data management (Level 5) and duplicated UI patterns (Level 6).
