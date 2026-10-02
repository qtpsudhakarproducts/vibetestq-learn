# 13 — Parallelism

## The Scenario

Your OrangeHRM test suite has 200 tests. You run them and wait. And wait. 45 minutes later, CI finally reports the results. By then, the engineer who pushed the change has moved on to something else. The feedback loop is broken. Nobody looks at test results because they take too long.

You have a machine with 8 CPU cores. Right now, 7 of them are idle while tests run one after another on a single core. That is the problem parallelism solves.

---

## How Playwright Runs Tests by Default

Before changing anything, it helps to understand exactly what Playwright does by default.

Playwright runs tests using **worker processes**. Each worker is a separate Node.js process with its own browser instance. Workers run truly in parallel — they do not share memory, they do not share browser state, they do not interfere with each other.

By default, Playwright uses **half the available CPU cores** as the number of workers. On an 8-core machine, that is 4 workers.

**The default execution model — parallelism at the file level:**

```
Worker 1: runs all tests in login.spec.ts sequentially
Worker 2: runs all tests in employee-list.spec.ts sequentially
Worker 3: runs all tests in add-employee.spec.ts sequentially
Worker 4: runs all tests in leave-apply.spec.ts sequentially
```

Different files run in parallel. Tests within the same file run sequentially on the same worker.

This default exists for a reason: tests within a file often share context through `beforeEach`/`afterEach` hooks and `let` variables. Running them on the same worker in order is safe. Running them on different workers simultaneously could cause state conflicts.

---

## fullyParallel — Parallelism Within Files

`fullyParallel: true` in the config removes the file-level boundary. Individual tests from any file can be distributed across any worker and run concurrently:

```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
  workers: 4,
});
```

With `fullyParallel: true`:

```
Worker 1: login test 1, employee-list test 3, leave test 2, ...
Worker 2: login test 2, add-employee test 1, leave test 5, ...
Worker 3: login test 3, employee-list test 1, leave test 1, ...
Worker 4: login test 4, employee-list test 2, add-employee test 2, ...
```

Tests from the same file can now run on different workers simultaneously. This is the fastest possible execution.

**The prerequisite:** Every test must be completely independent. No test can rely on another test having run first. No test can read or write shared state that another test also touches.

```typescript
// ❌ These tests share mutable state through a let variable
// Running them on different workers breaks this
let createdEmployeeId: string;

test('create employee @smoke', async ({ addEmployeePage }) => {
  createdEmployeeId = await addEmployeePage.createEmployee({ firstName: 'Priya' });
});

test('verify employee in list @regression', async ({ employeeListPage }) => {
  // createdEmployeeId is undefined on a different worker
  await employeeListPage.searchById(createdEmployeeId);
});
```

```typescript
// ✅ Each test is fully self-contained — safe to run on any worker
test('create employee @smoke', async ({ addEmployeePage }) => {
  const id = await addEmployeePage.createEmployee({ firstName: 'Priya' });
  await addEmployeePage.expectSuccessMessage();
});

test('verify employee search works @regression', async ({ employeeListPage }) => {
  // Uses known test data that exists in the system — not dependent on another test
  await employeeListPage.searchByName('Linda Anderson');
  await expect(employeeListPage.getResultRow('Linda Anderson')).toBeVisible();
});
```

---

## Controlling Worker Count

The number of workers is the primary lever for controlling suite speed.

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 4,                          // fixed number
  workers: process.env.CI ? 2 : 4,    // fewer on CI, more locally
  workers: '50%',                      // percentage of available CPU cores
  workers: 1,                          // sequential — no parallelism
});
```

### From the CLI

```bash
npx playwright test --workers=8        # 8 workers for this run
npx playwright test --workers=1        # sequential — useful for debugging
npx playwright test -j 4               # shorthand for --workers=4
```

### How Many Workers Is Right?

More workers is not always faster. The relationship between workers and speed depends on three things:

**Your machine's CPU cores.** Workers use CPU. More workers than cores means workers compete for CPU time and slow each other down. A safe upper bound is one worker per core.

**Your application's capacity.** More workers means more concurrent browser sessions hitting your application. If your test environment runs on a single-node server, 8 workers hammering it simultaneously may cause timeouts that would not occur with 2 workers.

**Your tests' independence.** More workers only helps if tests are independent. If tests share state and fail when run in parallel, adding workers makes things worse not better.

**A practical starting point:**
```typescript
workers: process.env.CI ? 2 : 4,
```
Conservative on CI (shared resources, limited CPU), faster locally (dedicated machine, more cores).

---

## describe.parallel — Parallel Within a Specific Group

You can enable parallelism for a specific `describe` block without changing the global config. This is useful when most of your tests need to run sequentially but a specific group is safe to parallelise:

```typescript
test.describe.parallel('Page Load Smoke Tests', () => {
  // These tests each visit a different page — no shared state
  // Safe to run simultaneously

  test('dashboard loads @smoke', async ({ page }) => {
    await page.goto('/web/index.php/dashboard/index');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('employee list loads @smoke', async ({ page }) => {
    await page.goto('/web/index.php/pim/viewEmployeeList');
    await expect(page.getByRole('heading', { name: 'Employee List' })).toBeVisible();
  });

  test('leave list loads @smoke', async ({ page }) => {
    await page.goto('/web/index.php/leave/viewLeaveList');
    await expect(page.getByRole('heading', { name: 'Leave List' })).toBeVisible();
  });

  test('admin panel loads @smoke', async ({ page }) => {
    await page.goto('/web/index.php/admin/viewAdminModule');
    await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
  });
});
```

With 4 workers and `fullyParallel: false`, these 4 tests run simultaneously instead of sequentially. 4 seconds instead of 16.

---

## describe.serial — Force Sequential in a Group

`describe.serial` is the opposite — it forces a specific group to run sequentially on the same worker, even if `fullyParallel: true` is set globally.

The key behaviour: if one test fails, all remaining tests in the group are automatically skipped.

```typescript
test.describe.serial('Employee Creation Wizard', () => {
  // Multi-step workflow — each step depends on the previous one

  test('step 1: fill basic information', async ({ page }) => {
    await page.goto('/web/index.php/pim/addEmployee');
    await page.getByPlaceholder('First Name').fill('Priya');
    await page.getByPlaceholder('Last Name').fill('Sharma');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Step 2')).toBeVisible();
  });

  test('step 2: assign department', async ({ page }) => {
    // Depends on step 1 having completed — same browser, same worker
    await page.getByLabel('Department').selectOption('Engineering');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Step 3')).toBeVisible();
  });

  test('step 3: create login credentials', async ({ page }) => {
    await page.getByLabel('Username').fill('priya.sharma');
    await page.getByLabel('Password').fill('Admin@1234');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Successfully Saved')).toBeVisible();
  });

  // If step 1 fails → steps 2 and 3 are skipped automatically
  // You see 1 failure instead of 3 failures for the same root cause
});
```

Use `describe.serial` sparingly. Test dependency is a design smell. Independent tests with their own setup are always preferable. Use serial only for genuinely inseparable multi-step workflows.

---

## Test Isolation — What Makes Parallel Safe

Parallel execution only works safely when tests are isolated from each other. Isolation means a test's outcome does not depend on anything another test did, and a test does not leave behind state that affects other tests.

### Each test gets its own page

The `page` fixture is test-scoped — every test gets a fresh browser tab. Tests on different workers have completely separate browser instances. There is no shared DOM, no shared cookies, no shared localStorage between tests.

```typescript
// These two tests can run on different workers safely
// Each has its own fresh page — no interference

test('test A modifies localStorage', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => localStorage.setItem('key', 'value-A'));
  // This change exists only in test A's browser instance
});

test('test B reads localStorage', async ({ page }) => {
  await page.goto('/login');
  const value = await page.evaluate(() => localStorage.getItem('key'));
  // value is null — completely separate browser instance from test A
});
```

### Database state is the common shared resource

The browser is isolated per test. The database is not. If test A creates an employee and test B searches for all employees, test B might see test A's employee in the results — or test A might delete a record that test B needed.

**Use unique identifiers per test:**
```typescript
test('create and verify employee @smoke', async ({ addEmployeePage, employeeListPage }) => {
  // Unique ID prevents collision with other tests running in parallel
  const uniqueId = `EMP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  await addEmployeePage.createEmployee({
    firstName: 'Test',
    lastName: 'Employee',
    employeeId: uniqueId,
  });

  await employeeListPage.searchById(uniqueId);
  await expect(employeeListPage.getResultRow('Test Employee')).toBeVisible();
});
```

**Clean up after each test:**
```typescript
test.describe('Leave Application Tests', () => {
  let createdLeaveId: string;

  test.afterEach(async ({ leaveApi }) => {
    if (createdLeaveId) {
      await leaveApi.deleteLeaveRequest(createdLeaveId).catch(() => {});
      createdLeaveId = '';
    }
  });
});
```

**Use read-only test data for verification tests:**
```typescript
// Tests that only READ known data are safe in parallel — no state modification
test('Linda Anderson appears in employee list @smoke', async ({ employeeListPage }) => {
  await employeeListPage.searchByName('Linda Anderson');
  await expect(employeeListPage.getResultRow('Linda Anderson')).toBeVisible();
});
```

### Worker index for namespacing

When tests need to write to the database, use `test.info().workerIndex` to give each worker its own namespace:

```typescript
test('create and verify employee @regression', async ({ addEmployeePage, employeeListPage }) => {
  const workerIndex = test.info().workerIndex;

  // Each worker creates its own uniquely named employee — no collision
  const employeeId = `TEST-W${workerIndex}-${Date.now()}`;

  await addEmployeePage.createEmployee({
    firstName: 'Worker',
    lastName: `${workerIndex}`,
    employeeId,
  });

  await employeeListPage.searchById(employeeId);
  await expect(employeeListPage.getResultRow(`Worker ${workerIndex}`)).toBeVisible();
});
```

---

## The Parallel Execution Model — What Actually Happens

When Playwright runs with 4 workers, here is the execution sequence:

```
Playwright collects all tests from all files
Distributes them across 4 worker processes

Worker 0 (separate process):
  Browser 0 starts → loads storageState
  Picks up test batch 1, runs them sequentially
  Picks up more tests as they become available
  Browser 0 closes when worker finishes

Worker 1 (separate process):
  Browser 1 starts → loads storageState
  Picks up test batch 2, runs them sequentially
  Picks up more tests as they become available
  Browser 1 closes when worker finishes

Workers 2 and 3: same pattern

All workers finish → results aggregated → report generated
```

Workers pick up tests dynamically — they do not pre-assign a fixed batch. When a worker finishes a test, it picks up the next available test from the queue. This means faster tests do not sit idle waiting for slower tests on other workers.

**Worker-scoped fixtures** run once per worker process. With 4 workers, a worker-scoped fixture's setup runs 4 times total — once at the start of each worker.

**Test-scoped fixtures** run once per test regardless of worker count.

---

## Measuring Parallelism Impact

Before tuning worker count, measure your current suite performance:

```bash
# Run with 1 worker — sequential baseline
npx playwright test --workers=1

# Run with 2 workers
npx playwright test --workers=2

# Run with 4 workers
npx playwright test --workers=4

# Run with 8 workers
npx playwright test --workers=8
```

Compare the total duration. You will typically see:
- 1 → 2 workers: close to 2× speedup
- 2 → 4 workers: 1.5–2× speedup
- 4 → 8 workers: diminishing returns — maybe 1.2–1.5× speedup

The speedup diminishes because CPU contention increases and the application server becomes the bottleneck. Find the worker count where adding more does not meaningfully reduce total time — that is your optimum.

---

## Common Parallelism Problems and Solutions

### Tests pass sequentially but fail in parallel

**Cause:** Tests share state — database records, files, or in-memory variables — that one test modifies and another reads simultaneously.

**Solution:** Make tests independent. Use unique data per test (`Date.now()`, `workerIndex`). Clean up in `afterEach`. Use read-only test data where possible.

### Application times out under parallel load

**Cause:** Too many workers hitting a limited test environment simultaneously. The server cannot handle the concurrent load.

**Solution:** Reduce workers. Add `workers: process.env.CI ? 2 : 4`. Check if `waitForLoadState('networkidle')` is missing in some tests.

### Some tests must be sequential but the suite uses fullyParallel

**Cause:** A subset of tests has genuine step dependencies.

**Solution:** Wrap those tests in `describe.serial`. The rest of the suite stays parallel.

```typescript
test.describe.serial('Wizard Flow', () => {
  test('step 1', ...) // sequential within this group
  test('step 2', ...)
  test('step 3', ...)
});

// All other tests in the file still run in parallel
test('independent test A @smoke', ...)
test('independent test B @regression', ...)
```

### beforeAll runs multiple times unexpectedly

**Cause:** With `fullyParallel: true`, tests from the same describe can go to different workers. Each worker that picks up tests from that describe runs its own `beforeAll`.

**Solution:** If `beforeAll` must run only once globally, move it to `globalSetup` or use project dependencies. If per-worker setup is acceptable, the current behaviour is correct — each worker independently sets up its own state.

---

## Parallelism Settings Summary

| Setting | Location | Effect |
|---|---|---|
| `workers: N` | config or `--workers` CLI | Number of parallel worker processes |
| `fullyParallel: true` | config | Tests within a file also distribute across workers |
| `fullyParallel: false` | config (default) | Tests within a file run sequentially on same worker |
| `describe.parallel` | test file | This describe's tests run in parallel |
| `describe.serial` | test file | This describe's tests run sequentially; skip on failure |
| `describe.configure({ mode })` | test file | Explicit version of parallel or serial |

---

## Key Points

- Playwright uses worker processes — each is a separate Node.js process with its own browser; workers do not share memory or state
- Default behaviour: files run in parallel across workers; tests within a file run sequentially on the same worker
- `fullyParallel: true` — tests within a file also distribute across workers; requires all tests to be fully independent
- `workers: N` — the primary speed lever; `process.env.CI ? 2 : 4` is a safe default
- More workers is not always faster — CPU contention, server capacity, and test independence all create ceilings
- `describe.parallel` — enable parallel execution for a specific group without touching the global config
- `describe.serial` — force sequential for a group; subsequent tests skip automatically if one fails
- Each test gets its own `page` — browser state is isolated per test automatically
- Database is the common shared resource — use unique IDs, clean up in `afterEach`, or use read-only data
- `workerIndex` — unique per worker; use for namespacing database records and files in parallel runs
- Worker-scoped fixtures run once per worker — with 4 workers, setup runs 4 times total
- Workers pick up tests dynamically — faster workers do not idle while slower workers catch up
- Tests passing sequentially but failing in parallel always means shared state — make tests independent
- Measure at 1, 2, 4, 8 workers to find your optimal count — diminishing returns appear quickly
