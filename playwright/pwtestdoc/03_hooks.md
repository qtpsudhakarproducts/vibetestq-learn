# 03 — Hooks

## The Scenario

You are writing tests for the Employee List page in OrangeHRM. You have written 8 tests — search by name, search by ID, search by department, reset filter, pagination, export, sort by name, sort by ID. Every single one of them starts with the same three lines:

```typescript
test('search by name filters results @regression', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.goto('/web/index.php/pim/viewEmployeeList');
  // actual test logic...
});

test('search by ID filters results @regression', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.goto('/web/index.php/pim/viewEmployeeList');
  // actual test logic...
});

// ...6 more tests, all starting the same way
```

Now your team changes the test username from `Admin` to `AutomationUser`. You update it in 8 places. One week later the employee list URL changes. You update it in 8 places again. A new team member adds a 9th test and forgets to add the login lines — that test fails mysteriously with a "not logged in" error.

This is the problem hooks solve.

---

## What Hooks Are

Hooks are lifecycle callbacks that Playwright calls automatically at specific points around your tests. You register them once and Playwright calls them at the right time — you never call them manually.

There are four hooks:

| Hook | When Playwright calls it |
|---|---|
| `test.beforeAll` | Once, before the first test in the describe block starts |
| `test.beforeEach` | Before every individual test in the describe block |
| `test.afterEach` | After every individual test, whether it passed or failed |
| `test.afterAll` | Once, after the last test in the describe block finishes |

They eliminate the duplication in the scenario above. The setup code lives in one place. Every test in the group gets it automatically.

---

## beforeEach — Run Setup Before Every Test

`beforeEach` is the most commonly used hook. Whatever you put inside it runs before every test in its describe scope — automatically, without any action from the test.

Rewriting the scenario with `beforeEach`:

```typescript
import { test, expect } from '../../fixtures/baseFixture';

test.describe('Employee List', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/web/index.php/auth/login');
    await page.getByPlaceholder('Username').fill('Admin');
    await page.getByPlaceholder('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.goto('/web/index.php/pim/viewEmployeeList');
  });

  test('search by name filters results @regression', async ({ page }) => {
    // Page is already on the employee list, logged in
    // Test goes straight to the actual test logic
    await page.getByPlaceholder('Type for hints...').fill('Linda');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('Linda Anderson')).toBeVisible();
  });

  test('search by ID filters results @regression', async ({ page }) => {
    // Same starting state — no duplication
    await page.getByLabel('Employee Id').fill('EMP001');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('EMP001')).toBeVisible();
  });

  test('reset button clears search filters @regression', async ({ page }) => {
    await page.getByPlaceholder('Type for hints...').fill('Linda');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('button', { name: 'Reset' }).click();
    const rows = page.getByRole('row');
    await expect(rows).toHaveCountGreaterThan(5);
  });

});
```

Now when the username changes, you change it in one place. When the URL changes, you change it in one place. When a new test is added to the group, it automatically gets the setup — the new developer cannot forget it.

### What beforeEach Receives

`beforeEach` receives the same fixtures as tests. If you are using page objects from your fixtures file, you can use them in `beforeEach` too:

```typescript
test.describe('Add Employee', () => {

  test.beforeEach(async ({ addEmployeePage }) => {
    await addEmployeePage.goto();
    // Navigates to the Add Employee form before every test
    // addEmployeePage is injected from your fixtures, just like in tests
  });

  test('saves with required fields @smoke', async ({ addEmployeePage }) => {
    await addEmployeePage.fillFirstName('Priya');
    await addEmployeePage.fillLastName('Sharma');
    await addEmployeePage.clickSave();
    await addEmployeePage.expectSuccessMessage();
  });

  test('first name is required @regression', async ({ addEmployeePage }) => {
    await addEmployeePage.fillLastName('Sharma');
    await addEmployeePage.clickSave();
    await addEmployeePage.expectRequiredError('First Name');
  });

});
```

### Accessing Test Information in beforeEach

You can read `test.info()` inside `beforeEach` to know which test is about to run and adjust setup accordingly:

```typescript
test.beforeEach(async ({ page }) => {
  const info = test.info();
  console.log(`Setting up: "${info.title}" on ${info.project.name}`);

  // Different setup based on which project (browser) is running
  if (info.project.name === 'webkit') {
    await page.goto('/web/index.php/auth/login');
    await page.waitForTimeout(500); // Safari needs extra settle time
  } else {
    await page.goto('/web/index.php/auth/login');
  }
});
```

---

## afterEach — Run Cleanup After Every Test

`afterEach` runs after every test in the group — whether the test passed, failed, timed out, or was skipped. This guarantee is important: no matter what happens in the test, your cleanup code runs.

### The Primary Use Case — Capturing Evidence on Failure

In CI, when a test fails, you need to know what the page looked like at the moment of failure. Without a screenshot, you are debugging blind. `afterEach` is where you capture that evidence:

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();

  // info.status — what actually happened: 'passed', 'failed', 'timedOut', 'skipped'
  // info.expectedStatus — what was expected: 'passed' normally, 'failed' for test.fail()
  // A test is only truly unhealthy when these two do not match

  if (info.status !== info.expectedStatus) {
    // Something went wrong — capture the page state at the moment of failure
    const screenshot = await page.screenshot({ fullPage: true });

    // Attaching to the report means the screenshot is visible directly
    // in the HTML report — no need to dig through file system folders
    await info.attach('failure-screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });

    // Also attach the current URL — useful for knowing where the test got stuck
    await info.attach('failure-url', {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });
  }
});
```

When you open the HTML report after a CI failure, each failing test will have the screenshot and URL attached directly to it. You see exactly what the page looked like when the test failed — without having to reproduce it locally.

### afterEach for Logging Test Results

```typescript
test.afterEach(async () => {
  const info = test.info();

  const status = info.status.toUpperCase();
  const title = info.title;
  const duration = info.duration;
  const retry = info.retry > 0 ? ` (retry ${info.retry})` : '';
  const project = info.project.name;

  console.log(`[${status}] [${project}] ${title} — ${duration}ms${retry}`);
});
```

Output in the terminal:
```
[PASSED] [chromium] valid credentials redirect to dashboard — 1340ms
[FAILED] [chromium] reset password with expired token — 5200ms (retry 1)
[PASSED] [firefox] valid credentials redirect to dashboard — 1890ms
```

This gives you a clear picture of what ran, how long it took, and which retries happened.

### afterEach Runs Even When the Test Fails

This is the most important characteristic of `afterEach`. In many frameworks, teardown might be skipped if the test body throws. In Playwright, `afterEach` **always** runs. You can rely on it unconditionally for cleanup.

```typescript
test.afterEach(async ({ page }) => {
  // This runs whether the test above passed, failed, timed out, or threw an exception
  // You can safely do cleanup here knowing it will always execute
  await logTestCompletion(test.info().title, test.info().status);
});
```

### afterEach for Data Cleanup

If tests create data in the application, clean it up in `afterEach`. This keeps tests independent — the next test starts from a clean slate, not from the leftovers of the previous one.

```typescript
test.describe('Leave Application Tests', () => {
  let createdLeaveId: string;

  test.beforeEach(async ({ leaveApi }) => {
    // Create a leave request via API before each test — gives each test
    // its own isolated piece of data to work with
    createdLeaveId = await leaveApi.createLeaveRequest({
      employeeId: 'EMP001',
      type: 'Annual',
      fromDate: '2026-03-10',
      toDate: '2026-03-12',
    });
  });

  test.afterEach(async ({ leaveApi }) => {
    // Clean up after each test — whether it passed or failed
    // The .catch() prevents the cleanup failure from masking the test result
    if (createdLeaveId) {
      await leaveApi.deleteLeaveRequest(createdLeaveId).catch(() => {});
      createdLeaveId = '';
    }
  });

  test('manager can approve leave request @smoke', async ({ leavePage }) => {
    await leavePage.openRequest(createdLeaveId);
    await leavePage.approve();
    await leavePage.expectStatus('Approved');
  });

  test('manager can reject leave request @regression', async ({ leavePage }) => {
    await leavePage.openRequest(createdLeaveId);
    await leavePage.reject('Insufficient notice period');
    await leavePage.expectStatus('Rejected');
  });

});
```

Without the `afterEach` cleanup, every test run leaves a leave request in the system. After 50 runs you have 50 leave requests. Tests start failing because the system state is polluted. `afterEach` keeps the system clean.

### Defensive afterEach — Preventing Cleanup Failures from Masking Results

Here is a subtle but important point: if `afterEach` throws an error, the test is reported as **failed** — even if the test body itself passed. A test that passed suddenly shows as failed because the cleanup broke.

To prevent this, use `.catch()` on cleanup actions that might fail:

```typescript
test.afterEach(async ({ page }) => {
  // ❌ If this screenshot fails (page already closed), it marks the test as failed
  await page.screenshot({ path: 'last-state.png' });

  // ✅ If this fails, the error is silently swallowed — test result is preserved
  await page.screenshot({ path: 'last-state.png' }).catch(() => {});

  // ✅ Or use a try/catch for more control
  try {
    await page.screenshot({ path: 'last-state.png' });
  } catch {
    console.log('Could not take screenshot — page may have already closed');
  }
});
```

---

## beforeAll — Run Setup Once for the Entire Group

`beforeEach` runs before every test. But some setup is expensive to repeat for every test — creating an auth token, seeding a database, starting an external service. You only want to do it once for the entire group. That is `beforeAll`.

### Scenario — Auth Token That All Tests Share

You have 10 tests for the Leave module. All of them need to make API calls using an auth token. Getting the token requires a network call. Doing it 10 times wastes 10 seconds.

```typescript
test.describe('Leave Module API Tests', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // This runs once before any test in the group starts
    const response = await request.post('/api/v2/auth/login', {
      data: { username: 'Admin', password: 'admin123' },
    });
    const body = await response.json();
    authToken = body.token;

    console.log('Auth token obtained — shared across all Leave Module tests');
  });

  test('fetch leave types returns list @smoke', async ({ request }) => {
    // authToken is already available — beforeAll ran before this
    const response = await request.get('/api/v2/leave/leaveTypes', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status()).toBe(200);
  });

  test('fetch leave balance returns correct data @regression', async ({ request }) => {
    // Same token — beforeAll ran once for the whole group
    const response = await request.get('/api/v2/leave/leaveBalances', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status()).toBe(200);
  });

  // 8 more tests — all use authToken, none needs to re-fetch it
});
```

### What Fixtures beforeAll Can Use

This is one of the most important technical details about `beforeAll` — it runs at the worker level, before any individual test exists. This means it can only use **worker-scoped fixtures**, not test-scoped fixtures.

The `page` fixture is test-scoped — it is created fresh for each test and closed when the test ends. There is no test when `beforeAll` runs, so there is no `page`.

```typescript
test.beforeAll(async ({ browser }) => {
  // ✅ browser is worker-scoped — available in beforeAll
  const page = await browser.newPage();
  await page.goto('/admin/seed-test-data');
  await page.getByRole('button', { name: 'Seed' }).click();
  await page.close(); // close manually — no automatic cleanup
});

test.beforeAll(async ({ page }) => {
  // ⚠️ page is test-scoped — Playwright will warn you
  // Avoid using test-scoped fixtures in beforeAll
});
```

If you need browser interaction in `beforeAll`, create a page from the `browser` fixture and close it yourself:

```typescript
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    storageState: '.auth/admin.json', // use saved auth state
  });
  const page = await context.newPage();

  await page.goto('/web/index.php/admin/seedData');
  await page.getByRole('button', { name: 'Seed Database' }).click();
  await expect(page.getByText('Seeding complete')).toBeVisible();

  await context.close(); // close context — also closes the page
});
```

### beforeAll Runs Per Worker, Not Globally

When Playwright distributes tests across multiple parallel workers, `beforeAll` runs once per worker — not once globally across all workers.

```
Your describe has 6 tests, 3 workers are available:

Worker 1 picks up tests 1, 2    → runs its own beforeAll
Worker 2 picks up tests 3, 4    → runs its own beforeAll
Worker 3 picks up tests 5, 6    → runs its own beforeAll
```

This means `beforeAll` is not a substitute for global setup. If you need setup that runs exactly once for the entire test suite, use `globalSetup` in `playwright.config.ts` — covered in the Global Setup notes.

---

## afterAll — Run Cleanup Once for the Entire Group

`afterAll` pairs with `beforeAll`. Whatever `beforeAll` sets up, `afterAll` tears down — once, after all tests in the group have finished.

### Scenario — Starting and Stopping a Test Server

```typescript
test.describe('Report Generation Tests', () => {
  let reportServer: TestServer;

  test.beforeAll(async () => {
    // Start a local report generation server once
    reportServer = await TestServer.start({ port: 9000 });
    console.log(`Report server running on port ${reportServer.port}`);
  });

  test.afterAll(async () => {
    // Stop the server after all tests in this group finish
    await reportServer.stop();
    console.log('Report server stopped');
  });

  test('PDF report generates successfully @smoke', async ({ page }) => {
    await page.goto(`http://localhost:9000/report/pdf`);
    await expect(page.getByText('PDF Generated')).toBeVisible();
  });

  test('CSV report generates successfully @regression', async ({ page }) => {
    await page.goto(`http://localhost:9000/report/csv`);
    await expect(page.getByText('CSV Generated')).toBeVisible();
  });

});
```

### afterAll Runs Even When Tests Fail

If some tests fail, `afterAll` still runs. The server gets stopped regardless of whether the tests passed. This is important for resource cleanup — you do not want test servers left running because a test failed.

The exception: if a worker is killed externally (out of memory, forceful termination), `afterAll` may not run. In normal test failure scenarios — assertion errors, timeouts, thrown exceptions — it always runs.

---

## The Full Hook Execution Order

With all four hooks and nested describes, the execution order follows one rule: **setup wraps from outside in, teardown unwraps from inside out**.

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

    test('test 1', async () => { console.log('→ TEST 1'); });
    test('test 2', async () => { console.log('→ TEST 2'); });
  });
});
```

Output:
```
1 — Outer beforeAll
2 — Inner beforeAll

3 — Outer beforeEach
4 — Inner beforeEach
→ TEST 1
5 — Inner afterEach
6 — Outer afterEach

3 — Outer beforeEach
4 — Inner beforeEach
→ TEST 2
5 — Inner afterEach
6 — Outer afterEach

7 — Inner afterAll
8 — Outer afterAll
```

Notice:
- `beforeAll` for each describe runs once, at the start of its group
- `beforeEach` and `afterEach` wrap every individual test, outer before inner
- `afterAll` for each describe runs once, at the end of its group
- The order of `afterAll` is inner first, then outer — teardown is the reverse of setup

---

## What Happens When a Hook Fails

### When beforeEach Fails

If `beforeEach` throws an error or times out, the test is marked as **failed**. The test body does not run — there is no point running the test if setup did not complete. But `afterEach` still runs for cleanup.

```
beforeEach throws → test marked FAILED → test body skipped → afterEach runs
```

In practice, this means if your navigation in `beforeEach` fails (page not loading, element not found), all tests in the group are marked as failed with the error pointing to `beforeEach`. This is a clear signal in the report: the failure is in setup, not in the test logic. This is much better than a cryptic failure inside each test body.

### When beforeAll Fails

If `beforeAll` throws, all tests in the describe block are marked as **failed** immediately. None of them run. `afterAll` still runs.

```
beforeAll throws → all tests in group marked FAILED → no tests run → afterAll runs
```

In CI, this pattern is very useful. If your database seed fails in `beforeAll`, you see a cluster of 10 failures all pointing to `beforeAll`. You immediately know this is an environment problem, not 10 separate test bugs. Without `beforeAll`, all 10 tests would fail inside their own bodies with confusing errors about missing data.

### When afterEach Fails

If `afterEach` throws, the test is marked as **failed** even if the test body passed. This is surprising at first but logical — the overall test run for that test was not clean.

```
test body PASSES → afterEach throws → test reported as FAILED
```

This is why defensive cleanup matters:

```typescript
test.afterEach(async ({ page }) => {
  // Without .catch(): if screenshot fails, a passing test becomes a failing test
  await page.screenshot({ path: 'debug.png' }).catch(() => {});

  // Without .catch(): if logout fails, a passing test becomes a failing test
  await page.getByRole('button', { name: 'Logout' }).click().catch(() => {});
});
```

---

## File-Level Hooks — Outside Any describe

Hooks do not have to live inside a describe. When declared at the file level — outside any describe — they apply to every test in the entire file, across all describe blocks.

```typescript
import { test, expect } from '../../fixtures/baseFixture';

// File-level hooks — apply to ALL tests in this file
test.beforeEach(async ({ page }) => {
  // Every test in this file starts logged in
  await page.goto('/web/index.php/auth/login');
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);
});

test.afterEach(async ({ page }) => {
  // Every test in this file gets a screenshot on failure
  if (test.info().status !== test.info().expectedStatus) {
    await test.info().attach('screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  }
});

// All these describe groups get the file-level hooks
test.describe('Employee List', () => {
  test.beforeEach(async ({ page }) => {
    // This runs AFTER the file-level beforeEach — user is already logged in
    // This just navigates to the specific page needed
    await page.goto('/web/index.php/pim/viewEmployeeList');
  });

  test('search by name @regression', async ({ page }) => { /* ... */ });
});

test.describe('Leave Module', () => {
  test.beforeEach(async ({ page }) => {
    // Same — file-level login already happened
    await page.goto('/web/index.php/leave/viewLeaveList');
  });

  test('view leave list @smoke', async ({ page }) => { /* ... */ });
});
```

The file-level `beforeEach` handles login. Each describe's own `beforeEach` handles page-specific navigation. This layering keeps each hook focused on one responsibility.

---

## Hooks vs Fixtures — Choosing the Right Tool

Both hooks and fixtures can set up state before a test. The question is which to use.

The key difference: hooks are local to a file, fixtures are shared across the entire project.

| | Hooks | Fixtures |
|---|---|---|
| Defined in | The spec file itself | A separate fixtures file |
| Reusable across files | No — copy-paste required | Yes — injected automatically |
| Teardown | `afterEach` or `afterAll` | Code after `await use(...)` |
| Granularity | Runs for all tests in scope | Injected only into tests that declare it |
| Best for | Navigation, page-specific setup | Page objects, shared auth, test data factories |

**In practice, use both together:**

```typescript
// fixtures/baseFixture.ts — shared across all spec files
export const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
    // Teardown here if needed
  },
});
```

```typescript
// tests/pim/employee-list.spec.ts — local to this file
import { test } from '../../fixtures/baseFixture';

test.describe('Employee List', () => {

  test.beforeEach(async ({ page }) => {
    // Local navigation — only relevant to this file
    await page.goto('/web/index.php/pim/viewEmployeeList');
  });

  test.afterEach(async ({ page }) => {
    // Local evidence capture — screenshot on failure
    if (test.info().status !== test.info().expectedStatus) {
      await test.info().attach('screenshot', {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
    }
  });

  test('search by name @regression', async ({ loginPage, page }) => {
    // loginPage comes from fixtures — reusable
    // page navigation was done by beforeEach — local
  });

});
```

Fixtures handle the things that would otherwise be duplicated across multiple spec files. Hooks handle the things that are specific to this one file or describe block.

---

## Key Points

- Hooks are registered lifecycle callbacks — Playwright calls them, you do not
- `beforeEach` — runs before every test; most used hook; eliminates setup duplication within a group
- `afterEach` — always runs even if the test fails; primary use is capturing screenshots and logs on failure; be defensive with `.catch()` to prevent cleanup failures masking test results
- `beforeAll` — runs once before the group's first test; for expensive shared setup; receives worker-scoped fixtures only, not `page`
- `afterAll` — runs once after the group's last test; always runs even when some tests fail; pairs with `beforeAll` for teardown
- Hooks scope to their containing describe — they do not apply outside it
- File-level hooks (outside any describe) apply to all tests in the file
- Hook execution order: outer setup → inner setup → test → inner teardown → outer teardown; `beforeAll`/`afterAll` run once per group, `beforeEach`/`afterEach` run once per test
- `beforeEach` failure: test marked failed, body skipped, `afterEach` still runs
- `beforeAll` failure: all tests in group marked failed, none run, `afterAll` still runs
- `afterEach` failure: test marked failed even if body passed — use `.catch()` defensively
- `beforeAll` runs per worker in parallel execution — not once globally; use `globalSetup` for truly global setup
- Use hooks for local setup; use fixtures for reusable shared setup across files
