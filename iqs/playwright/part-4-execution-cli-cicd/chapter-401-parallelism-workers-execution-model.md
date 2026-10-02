# Chapter 401 — Parallelism — Workers & Execution Model

This chapter covers how Playwright runs tests in parallel — workers, the
execution model, isolation requirements, and the controls available when
parallelism needs to be tuned or restricted. Interviewers ask about
parallelism to test performance thinking and isolation discipline: a
candidate who can explain why tests pass sequentially but fail in parallel,
and fix it, is ready for any test engineering team.

---

## Q401.1 — How does Playwright run tests in parallel?

Playwright uses **worker processes**. Each worker is a separate Node.js
process with its own browser instance. Workers run truly in parallel —
they share no memory, no browser state, and no variables with each other.

**Default execution model:**

```
Worker 0: runs all tests in login.spec.ts        (sequentially)
Worker 1: runs all tests in employee-list.spec.ts (sequentially)
Worker 2: runs all tests in add-employee.spec.ts  (sequentially)
Worker 3: runs all tests in leave-apply.spec.ts   (sequentially)
```

By default, different files run on different workers simultaneously, but
tests within the same file run sequentially on the same worker.

This default exists deliberately: tests within a file often share state
through `beforeEach` hooks and `let` variables. Same-worker sequential
execution keeps that safe.

---

## Q401.2 — What is the default worker count and how do you change it?

Playwright defaults to **half the available CPU cores**. On an 8-core
machine, that is 4 workers.

Change it in the config or on the CLI:

```typescript
// playwright.config.ts
workers: 4,                         // fixed number
workers: process.env.CI ? 2 : 4,   // CI-aware
workers: '50%',                     // half of available cores
workers: 1,                         // sequential — no parallelism
```

```bash
npx playwright test --workers=8    # 8 workers for this run
npx playwright test --workers=1    # sequential — useful for debugging
npx playwright test -j 4           # shorthand for --workers=4
```

The safe default is `process.env.CI ? 2 : 4`. CI machines are shared
resources — two workers avoids starving other jobs. Locally, four workers
uses available CPU and runs the suite faster.

---

## Q401.3 — What does fullyParallel do and when should you use it?

`fullyParallel: true` extends parallelism from the file level to the test
level. Individual tests from the same file can be distributed across
different workers:

```typescript
// playwright.config.ts
fullyParallel: true,
```

```
Without fullyParallel:  login.spec.ts tests run sequentially on Worker 0
With fullyParallel:     login test 1 → Worker 0, login test 2 → Worker 1, ...
```

**Use `fullyParallel: true` when:**
- All tests are fully independent — no shared mutable state, no `let`
  variables shared between tests, no reliance on execution order

**Leave as default `false` when:**
- Tests within a file share state through `let` variables
- A file uses `describe.serial`
- Tests have intentional ordering

```typescript
// ❌ These tests share state — fullyParallel breaks them
let createdEmployeeId: string;

test('create employee', async ({ addEmployeePage }) => {
  createdEmployeeId = await addEmployeePage.createEmployee({ firstName: 'Priya' });
});

test('verify employee in list', async ({ employeeListPage }) => {
  await employeeListPage.searchById(createdEmployeeId); // undefined on another worker
});

// ✅ Self-contained — safe with fullyParallel
test('create employee', async ({ addEmployeePage }) => {
  const id = await addEmployeePage.createEmployee({ firstName: 'Priya' });
  await addEmployeePage.expectSuccessMessage();
});
```

---

## Q401.4 — What is describe.parallel and when is it useful?

`describe.parallel` enables parallel execution for a specific group without
changing the global config. Tests inside the describe can run on different
workers simultaneously:

```typescript
test.describe.parallel('Page Load Smoke Tests', () => {
  // Each test visits a different page — completely independent
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
});
```

With 4 workers and `fullyParallel: false`, these 4 tests run simultaneously.
4 seconds instead of 16.

Use `describe.parallel` when most tests need sequential execution but a
specific group of fully independent tests would benefit from parallelism —
without changing the global config for the whole suite.

---

## Q401.5 — What is describe.serial and when does it apply?

`describe.serial` forces a group to run sequentially on the same worker,
even when `fullyParallel: true` is set globally. Its key behaviour:
**if one test fails, all remaining tests in the group are automatically skipped.**

```typescript
test.describe.serial('Employee Creation Wizard', () => {
  // Multi-step workflow — step 2 needs step 1's browser state

  test('step 1: fill basic information', async ({ page }) => {
    await page.goto('/web/index.php/pim/addEmployee');
    await page.getByPlaceholder('First Name').fill('Priya');
    await page.getByPlaceholder('Last Name').fill('Sharma');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Step 2')).toBeVisible();
  });

  test('step 2: assign department', async ({ page }) => {
    // Continues from step 1's browser state — same page, same worker
    await page.getByLabel('Department').selectOption('Engineering');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Step 3')).toBeVisible();
  });

  test('step 3: save credentials', async ({ page }) => {
    await page.getByLabel('Username').fill('priya.sharma');
    await page.getByLabel('Password').fill('Admin@1234');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Successfully Saved')).toBeVisible();
  });

  // If step 1 fails → steps 2 and 3 are skipped
  // You see 1 failure instead of 3 failures for the same root cause
});
```

**Use `describe.serial` sparingly.** Test dependency is a design smell.
Independent tests with their own setup are always preferable. Use serial
only for genuinely inseparable multi-step workflows that cannot be
restructured.

---

## Q401.6 — Why do workers not share state?

Each worker is a separate Node.js process — not a thread. Separate processes
have completely isolated memory spaces. There is no shared heap, no shared
variables, no shared module cache between workers.

This is intentional:
- Tests on different workers cannot interfere with each other's in-memory state
- A crash in one worker does not affect other workers
- Worker-scoped fixtures are genuinely isolated — each worker has its own instance

What IS shared: the filesystem and the database. A file written by Worker 0
can be read by Worker 1. A database record created by Worker 0 can be read
or deleted by Worker 1. These are the sources of parallel test interference
— not JavaScript variables.

---

## Q401.7 — What makes a test parallel-safe?

A test is parallel-safe when its outcome does not depend on any other test's
execution and it does not leave behind state that could affect other tests.

**Browser state is automatically isolated.** The `page` fixture is
test-scoped — every test gets a fresh browser tab. Tests on different workers
have completely separate browser instances. No shared DOM, cookies, or
localStorage between tests:

```typescript
// These run on different workers — no interference
test('test A sets localStorage', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => localStorage.setItem('key', 'A'));
  // Exists only in Worker 0's browser
});

test('test B reads localStorage', async ({ page }) => {
  await page.goto('/login');
  const val = await page.evaluate(() => localStorage.getItem('key'));
  // null — completely separate browser on Worker 1
});
```

**Database is the shared resource.** Tests that write to the same database
can interfere. Three strategies:

1. **Unique identifiers per test:**
```typescript
test('create employee @smoke', async ({ addEmployeePage }) => {
  const id = `EMP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await addEmployeePage.createEmployee({ employeeId: id });
  // Unique ID prevents collision with concurrent tests
});
```

2. **Clean up in afterEach:**
```typescript
test.afterEach(async ({ leaveApi }) => {
  if (createdLeaveId) {
    await leaveApi.deleteLeaveRequest(createdLeaveId).catch(() => {});
  }
});
```

3. **Read-only test data for verification tests:**
```typescript
// Seeded once in globalSetup — never mutated by tests
test('Linda Anderson appears in list @smoke', async ({ employeeListPage }) => {
  await employeeListPage.searchByName('Linda Anderson');
  await expect(employeeListPage.getResultRow('Linda Anderson')).toBeVisible();
});
```

---

## Q401.8 — How do you use workerIndex for isolation in parallel tests?

`test.info().workerIndex` is a unique number per worker — 0 through N-1.
Use it to namespace test data so workers do not collide:

```typescript
test('create and verify employee @regression', async ({ addEmployeePage, employeeListPage }) => {
  const w = test.info().workerIndex;

  // Each worker creates its own uniquely named employee
  const employeeId = `TEST-W${w}-${Date.now()}`;

  await addEmployeePage.createEmployee({
    firstName: 'Worker',
    lastName:  `${w}`,
    employeeId,
  });

  await employeeListPage.searchById(employeeId);
  await expect(employeeListPage.getResultRow(`Worker ${w}`)).toBeVisible();
});
```

With 4 workers, four employees are created simultaneously:
`TEST-W0-...`, `TEST-W1-...`, `TEST-W2-...`, `TEST-W3-...`

No collision, no interference, full parallel execution.

---

## Q401.9 — What is the parallel execution model — how do workers pick up tests?

Workers pick up tests **dynamically from a queue** — they do not pre-assign
a fixed batch. When a worker finishes a test, it picks up the next available
test.

```
Playwright collects all tests → puts them in a queue
Worker 0 starts → picks test 1 → finishes → picks test 5 → finishes → ...
Worker 1 starts → picks test 2 → finishes → picks test 6 → finishes → ...
Worker 2 starts → picks test 3 → finishes → picks test 7 → finishes → ...
Worker 3 starts → picks test 4 → finishes → picks test 8 → finishes → ...
```

Fast workers do not sit idle waiting for slow workers. The queue empties
as workers finish, regardless of how long each test takes.

**Implication for worker-scoped fixtures:** These run once per worker when
the worker starts. With 4 workers, a worker-scoped fixture's setup runs
4 times total. Test-scoped fixtures run once per test regardless of
worker count.

---

## Q401.10 — Why do tests pass sequentially but fail in parallel?

This is the most common parallelism problem. The cause is always shared state.

**Common causes:**

**1. Shared `let` variables across tests:**
```typescript
// ❌ createdId is a shared variable — undefined on another worker
let createdId: string;

test('create record', async ({ page }) => {
  createdId = await createRecord();  // only runs on Worker 0
});

test('verify record', async ({ page }) => {
  await verifyRecord(createdId);  // createdId is undefined on Worker 1
});
```

**2. Tests writing to the same database row:**
```typescript
// ❌ Both tests update the same employee record — race condition
test('update name', async ({ page }) => {
  await page.goto('/employee/EMP001');
  await page.fill('[name=firstName]', 'Alice');
  await page.click('[type=submit]');
});

test('update department', async ({ page }) => {
  await page.goto('/employee/EMP001'); // same employee — conflict
  await page.selectOption('[name=dept]', 'Engineering');
  await page.click('[type=submit]');
});
```

**3. Tests deleting records other tests need:**
```typescript
// ❌ Test B deletes a record that Test C is trying to read
test('cleanup employee', async ({ page }) => {
  await deleteEmployee('EMP001'); // test B deletes it
});

test('verify employee exists', async ({ page }) => {
  await verifyEmployee('EMP001'); // test C fails — already deleted
});
```

**Fix:** Make tests independent. Use unique data per test. Clean up only
what that test created. Use read-only test data for verification tests.

---

## Q401.11 — How do you measure the impact of parallelism on suite performance?

Baseline with 1 worker, then measure increasing counts:

```bash
npx playwright test --workers=1  # sequential baseline
npx playwright test --workers=2
npx playwright test --workers=4
npx playwright test --workers=8
```

Typical speedup curve:
```
1 worker:  45 minutes (baseline)
2 workers: ~23 minutes  (~2× speedup)
4 workers: ~13 minutes  (~3.5× speedup)
8 workers: ~10 minutes  (~4.5× speedup — diminishing returns)
```

Speedup diminishes because:
- CPU contention increases beyond one worker per core
- The application server becomes a bottleneck under high concurrent load
- Startup and coordination overhead grows with worker count

Find the worker count where adding more does not meaningfully reduce total
time — that is the optimum. For most projects, 4 workers on an 8-core machine
hits the optimum.

---

## Q401.12 — What happens when the application server becomes the bottleneck?

With too many workers hitting a limited test environment, the server becomes
overwhelmed — requests time out, responses are slow, tests that would pass
with 2 workers fail with 8.

Signs:
- Tests that pass at `--workers=2` fail at `--workers=8`
- Failures are navigation timeouts, not assertion failures
- The failures are inconsistent — sometimes pass, sometimes fail

Solutions:
1. **Reduce workers:** `workers: process.env.CI ? 2 : 4`
2. **Add `waitForLoadState('networkidle')`** where tests navigate too fast
3. **Use a load-balanced test environment** that can handle N concurrent users
4. **Throttle worker startup** — space out when workers begin rather than
   launching all simultaneously (not built-in; requires custom coordination)

---

## Q401.13 — How does beforeAll interact with fullyParallel?

With `fullyParallel: true`, tests from the same describe can be distributed
to different workers. Each worker that picks up tests from that describe runs
its own `beforeAll` for that group.

```typescript
test.describe('Employee Module', () => {
  test.beforeAll(async ({ request }) => {
    // With fullyParallel: true and 4 workers, this might run up to 4 times
    // (once per worker that runs tests from this describe)
    await request.post('/api/seed/employees');
  });
});
```

If `beforeAll` must run only once globally, move it to `globalSetup` or use
a project dependency. If per-worker setup is acceptable (each worker sets up
its own independent data), the multiple-`beforeAll` behaviour is correct.

This is one reason `describe.serial` exists: wrapping the describe in serial
guarantees all its tests run on one worker, so `beforeAll` runs exactly once
for the group.

---

## Q401.14 — What is the Playwright parallelism settings summary?

| Setting | Location | Effect |
|---|---|---|
| `workers: N` | config / `--workers` | Number of parallel worker processes |
| `fullyParallel: true` | config | Tests within a file distribute across workers |
| `fullyParallel: false` | config (default) | Tests within a file run sequentially |
| `describe.parallel` | test file | This describe's tests run in parallel |
| `describe.serial` | test file | This describe's tests run sequentially; skip on failure |
| `--workers=1` | CLI | Sequential run — useful for debugging |

The hierarchy: `describe.serial` overrides `fullyParallel: true` for that
group. `describe.parallel` enables parallelism within the group even when
`fullyParallel: false`.

---

## Q401.15 — How do you debug parallelism failures — tests that fail only in parallel?

**Step 1 — Confirm the failure is parallelism-related:**
```bash
npx playwright test --workers=1  # pass?
npx playwright test --workers=4  # fail?
```
If it passes with 1 worker and fails with 4, shared state is the cause.

**Step 2 — Identify what is shared:**
- Look for `let` variables defined outside `test()` in the file
- Look for tests that create and tests that read/delete the same records
- Look for tests that depend on a specific execution order

**Step 3 — Isolate the conflicting pair:**
```bash
# Run just two specific tests in parallel
npx playwright test -g "create employee|verify employee" --workers=2
```

**Step 4 — Fix the shared state:**
- Make each test create its own data with unique identifiers
- Use `afterEach` to clean up what each test creates
- Use `describe.serial` only if restructuring is genuinely impossible

**Step 5 — Re-run at full parallelism:**
```bash
npx playwright test --workers=8  # should now pass consistently
```

---

## Q401.16 — How do you configure parallelism differently for different test types?

API tests are typically fast and stateless — they benefit from high worker
counts. UI tests are heavier and may stress the test server under high
concurrency. Project-level configuration handles this:

```typescript
projects: [
  // API tests — can handle high parallelism
  {
    name: 'api',
    testMatch: '**/api/**/*.spec.ts',
    // inherits global workers setting
  },

  // UI tests — reduce concurrency to avoid server overload
  {
    name: 'ui-chrome',
    testMatch: '**/ui/**/*.spec.ts',
    use: { ...devices['Desktop Chrome'] },
  },
],
```

In this pattern both projects use the global `workers` setting. If you
needed truly different parallelism per project, you would run them as
separate `--project` invocations with different `--workers` flags in CI:

```yaml
# CI pipeline
- name: API tests
  run: npx playwright test --project=api --workers=8

- name: UI tests
  run: npx playwright test --project=ui-chrome --workers=4
```

---

## Q401.17 — What is the relationship between workers and worker-scoped fixtures?

Worker-scoped fixtures run once per worker process — not once per test and
not once globally:

```typescript
type WorkerFixtures = { authToken: string };

export const test = base.extend<{}, WorkerFixtures>({
  authToken: [async ({ request }, use) => {
    // Runs once when THIS worker starts
    const { token } = await (await request.post('/api/login', {
      data: { username: 'Admin', password: 'admin123' },
    })).json();
    await use(token);
    // Teardown runs when THIS worker finishes all its tests
  }, { scope: 'worker' }],
});
```

With 4 workers:
```
Worker 0 starts → authToken setup runs → 50 tests use it → teardown
Worker 1 starts → authToken setup runs → 50 tests use it → teardown
Worker 2 starts → authToken setup runs → 50 tests use it → teardown
Worker 3 starts → authToken setup runs → 50 tests use it → teardown

Total login calls: 4 (down from 200)
```

This is the practical value: expensive per-worker setup (login, DB connection)
amortises across all tests that worker runs. The cost is N setups for N workers,
not 1 setup globally — but that is usually the right trade-off because each
worker needs its own isolated resource.

---

## Q401.18 — How did you apply parallelism improvements in your project?

Our 200-test suite ran sequentially for the first month — 45 minutes per
run. By the time CI finished, the developer had moved on. Nobody read the
results.

**Change 1 — Enable parallelism with the right worker count:**
```typescript
fullyParallel: true,
workers: process.env.CI ? 2 : 4,
```
First run: 12 minutes. But several tests that had hidden ordering dependencies
started failing.

**Change 2 — Fix shared state:**
- Replaced 8 tests that shared a `let createdEmployeeId` with self-contained
  tests using `Date.now()` for unique IDs
- Added `afterEach` cleanup to 3 test groups that created leave requests
- Moved 2 multi-step wizard tests to `describe.serial`

After fixes: all 200 tests pass at 4 workers.

**Change 3 — Worker-scoped auth fixture:**
Worker fixture for `authToken` reduced login calls from 200 to 4 workers' worth.
Total run time: 11 minutes. Down from 45. The team actually reads results now
because CI feedback arrives before the next stand-up.

The key insight: the tests that "failed in parallel" had always had hidden
dependencies. Parallelism revealed design problems that sequential execution
had been masking.

---

## Chapter Summary

- Workers are separate Node.js processes — no shared memory, no shared browser state.
- Default: files run in parallel across workers; tests within a file run sequentially.
- `fullyParallel: true` — individual tests distribute across workers; requires all tests to be independent.
- `workers: N` — the primary speed lever. `process.env.CI ? 2 : 4` is a safe default.
- More workers is not always faster — CPU contention, server capacity, and test independence all create ceilings.
- `describe.parallel` — parallel for a specific group without changing global config.
- `describe.serial` — sequential for a group; subsequent tests skip automatically on failure.
- Browser state is isolated per test automatically (`page` is test-scoped). Database is the shared resource.
- Use unique IDs (`Date.now()`, `workerIndex`), `afterEach` cleanup, and read-only data for parallel safety.
- `workerIndex` — unique per worker; use for namespacing database records in parallel runs.
- Workers pick up tests dynamically from a queue — faster workers do not idle.
- Tests passing sequentially but failing in parallel = shared state. Make tests independent.
- Worker-scoped fixtures run once per worker. With N workers, setup runs N times — not 1, not per test.
- Measure at 1, 2, 4, 8 workers to find the optimum — diminishing returns appear beyond the server's capacity.
