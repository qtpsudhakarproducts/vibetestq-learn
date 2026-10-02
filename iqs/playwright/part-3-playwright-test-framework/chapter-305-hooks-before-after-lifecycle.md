# Chapter 305 — Hooks — before/after Lifecycle

This chapter covers Playwright's four lifecycle hooks: `beforeAll`, `beforeEach`,
`afterEach`, and `afterAll`. Interviewers test hooks in every round because they
reveal how a candidate structures test setup, handles cleanup, and thinks about
test isolation. Candidates who misunderstand hook scope or fixture availability
in `beforeAll` fail on questions that appear simple.

---

## Q305.1 — What are hooks in Playwright?

Hooks are lifecycle callbacks that Playwright calls automatically at specific
points around your tests. You register them once and Playwright calls them at
the right time — you never invoke them directly.

There are four hooks:

| Hook | When it runs |
|---|---|
| `test.beforeAll` | Once, before the first test in the describe block |
| `test.beforeEach` | Before every individual test in the describe block |
| `test.afterEach` | After every individual test, whether it passed or failed |
| `test.afterAll` | Once, after the last test in the describe block |

They exist to eliminate the duplicated setup code that would otherwise appear
at the top of every test in a group. Write it once in a hook — every test
in scope gets it automatically.

---

## Q305.2 — Why do hooks exist? What problem do they solve?

Without hooks, every test in a group must repeat the same setup lines. When
that setup changes — a URL, a username, a navigation path — you update it
in every test. Miss one and a test fails in a confusing way.

```typescript
// ❌ Without hooks — setup duplicated 8 times
test('search by name @regression', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('Admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.goto('/employees');
  // actual test logic...
});

test('search by ID @regression', async ({ page }) => {
  await page.goto('/login');                         // duplicated
  await page.getByLabel('Username').fill('Admin');   // duplicated
  await page.getByLabel('Password').fill('admin123');// duplicated
  await page.getByRole('button', { name: 'Login' }).click(); // duplicated
  await page.goto('/employees');                     // duplicated
  // actual test logic...
});

// ✅ With beforeEach — setup written once
test.describe('Employee List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('Admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.goto('/employees');
  });

  test('search by name @regression', async ({ page }) => { /* test logic */ });
  test('search by ID @regression', async ({ page }) => { /* test logic */ });
});
```

When the username changes, you update it in one place. When the URL changes,
you update it in one place. New tests added to the group automatically get
the setup.

---

## Q305.3 — When do you use beforeEach and when do you use beforeAll?

**`beforeEach`** — for setup that must be fresh for every test. Anything
that could leave state from one test affecting the next must go in `beforeEach`.
Navigation, form resets, and creating isolated test data all belong here.

**`beforeAll`** — for expensive setup that is safe to share across all tests
in the group. Getting an auth token, seeding a database, or starting a test
server are good candidates — they are expensive and the result does not change
between tests.

```typescript
test.describe('Leave API Tests', () => {
  let authToken: string;

  // ✅ beforeAll — auth token is expensive and unchanged between tests
  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { username: 'Admin', password: 'admin123' },
    });
    authToken = (await response.json()).token;
  });

  // ✅ beforeEach — each test needs a clean starting URL
  test.beforeEach(async ({ page }) => {
    await page.goto('/leave');
  });

  test('GET /leave returns list @smoke', async ({ request }) => {
    const res = await request.get('/api/leave', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status()).toBe(200);
  });
});
```

**Rule:** use `beforeEach` by default. Use `beforeAll` only when the setup
is provably safe to share and the cost of repeating it per test is significant.

---

## Q305.4 — How did your project use afterEach?

In our project, `afterEach` does two things: captures failure evidence and
cleans up test data.

For failure evidence, we attach a screenshot and the current URL to every
failing test. This is set up at the file level and applies to all tests:

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();

  if (info.status !== info.expectedStatus) {
    await info.attach('failure-screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await info.attach('failure-url', {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });
  }
});
```

When a test fails in CI, the screenshot and URL appear directly in the HTML
report — no need to reproduce the failure locally.

For data cleanup, tests that create records via API clean them up in `afterEach`:

```typescript
let createdId: string;

test.beforeEach(async ({ api }) => {
  createdId = await api.createEmployee({ firstName: 'Test', lastName: 'User' });
});

test.afterEach(async ({ api }) => {
  await api.deleteEmployee(createdId).catch(() => {}); // defensive .catch()
});
```

---

## Q305.5 — What is the full hook execution order with nested describes?

Hooks execute from outer to inner on setup, and inner to outer on teardown:

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

    test('test 1', async () => console.log('→ TEST 1'));
    test('test 2', async () => console.log('→ TEST 2'));
  });
});
```

Output:
```
1 — Outer beforeAll
2 — Inner beforeAll
3 — Outer beforeEach  ← wraps each test, outer first
4 — Inner beforeEach
→ TEST 1
5 — Inner afterEach   ← unwraps each test, inner first
6 — Outer afterEach
3 — Outer beforeEach
4 — Inner beforeEach
→ TEST 2
5 — Inner afterEach
6 — Outer afterEach
7 — Inner afterAll    ← teardown is reverse of setup
8 — Outer afterAll
```

`beforeAll`/`afterAll` fire once per describe group.
`beforeEach`/`afterEach` wrap every individual test, outer-first on setup,
inner-first on teardown.

---

## Q305.6 — What fixtures can beforeAll access? Why can't it use page?

`beforeAll` runs at the worker level — before any individual test exists.
The `page` fixture is test-scoped: it is created for a specific test and
closed when that test ends. Since there is no test when `beforeAll` runs,
there is no `page`.

`beforeAll` can only use **worker-scoped fixtures** like `browser` and
`request`.

```typescript
// ✅ browser is worker-scoped — available in beforeAll
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/seed');
  await page.getByRole('button', { name: 'Seed Data' }).click();
  await context.close(); // must close manually — no automatic cleanup
});

// ✅ request is worker-scoped — available in beforeAll
test.beforeAll(async ({ request }) => {
  await request.post('/api/seed', { data: { env: 'test' } });
});

// ⚠️ page is test-scoped — Playwright will warn if used in beforeAll
test.beforeAll(async ({ page }) => {
  // Avoid this — page is not designed for this context
});
```

If you need browser interaction in `beforeAll`, create a page from `browser`
and close it yourself after use.

---

## Q305.7 — What happens when beforeEach fails?

If `beforeEach` throws or times out, the test is marked **failed**. The test
body does not run — there is no point executing the test if setup did not
complete. But `afterEach` still runs for cleanup.

```
beforeEach throws → test marked FAILED → test body skipped → afterEach runs
```

In practice, when `beforeEach` fails, all tests in the group are marked failed
with the error pointing to `beforeEach`. This is a clear signal in CI: the
failure is in setup, not in the test logic itself. A cluster of tests all
failing at `beforeEach` usually means an environment problem — the login page
is down, a URL changed, or a dependency is unavailable.

---

## Q305.8 — What happens when beforeAll fails?

If `beforeAll` throws, **all tests in the describe block are marked failed
immediately** — none of them run. `afterAll` still runs for cleanup.

```
beforeAll throws → all tests in group marked FAILED → no tests run → afterAll runs
```

This pattern is extremely useful in CI. If database seeding in `beforeAll`
fails, you see a cluster of 10 failures all pointing to `beforeAll`. You
immediately know this is an environment or infrastructure problem — not 10
separate test bugs. The signal is unmistakable.

Without `beforeAll`, all 10 tests would fail inside their own bodies with
confusing "record not found" errors — making the root cause much harder to
identify.

---

## Q305.9 — What happens when afterEach fails?

If `afterEach` throws, the test is reported as **failed even if the test body
passed**. A passing test becomes a failing test because cleanup broke.

```
test body PASSES → afterEach throws → test reported as FAILED
```

This is surprising until you understand the logic: an unclean teardown means
the test run as a whole was not successful.

The fix is defensive cleanup — use `.catch()` on operations that might fail:

```typescript
test.afterEach(async ({ page }) => {
  // ❌ If screenshot fails (page already closed), a passing test becomes failing
  await page.screenshot({ path: 'debug.png' });

  // ✅ If screenshot fails, error is swallowed — test result is preserved
  await page.screenshot({ path: 'debug.png' }).catch(() => {});

  // ✅ Also safe for cleanup actions
  await page.getByRole('button', { name: 'Logout' }).click().catch(() => {});
});
```

The rule: any cleanup action in `afterEach` that might fail in edge cases
should have a `.catch(() => {})` to prevent it masking the test result.

---

## Q305.10 — Does afterEach always run, even on test failure?

Yes. `afterEach` is guaranteed to run after every test — whether the test
passed, failed, timed out, or threw an exception. This guarantee is what
makes it the correct place for cleanup and evidence capture.

```typescript
test.afterEach(async ({ page }) => {
  // This runs regardless of what happened in the test body
  // Passed, failed, timed out, threw — afterEach always executes
  await cleanupTestData().catch(() => {});
});
```

The one exception: if the entire worker process is killed forcefully (out of
memory, `SIGKILL`), `afterEach` may not run. In all normal failure scenarios
— assertion errors, timeouts, uncaught exceptions — it always runs.

---

## Q305.11 — What is the difference between file-level hooks and describe-scoped hooks?

A hook declared at the file level (outside any describe) applies to every test
in the entire file. A hook inside a describe applies only to tests inside
that describe.

```typescript
// File-level — applies to ALL tests in this file
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('Admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
});

test.describe('Employee Module', () => {
  // Describe-level — runs only before tests in this describe
  // Runs AFTER the file-level beforeEach (login already happened)
  test.beforeEach(async ({ page }) => {
    await page.goto('/employees');
  });

  test('list loads @smoke', async ({ page }) => {
    // Two beforeEach ran: file-level login, then describe-level navigation
  });
});

test('dashboard loads @smoke', async ({ page }) => {
  // Only the file-level beforeEach ran (login)
  // The describe-level hook did NOT run here
});
```

The two levels compose naturally: file-level handles universal setup (login);
describe-level handles module-specific setup (navigate to the right page).

---

## Q305.12 — Is beforeAll global across all workers in parallel execution?

No. `beforeAll` runs **per worker** — not once globally across the entire
parallel suite.

When Playwright distributes tests across multiple workers:
```
Worker 1 picks up tests 1, 2 → runs its own beforeAll
Worker 2 picks up tests 3, 4 → runs its own beforeAll
Worker 3 picks up tests 5, 6 → runs its own beforeAll
```

Each worker runs `beforeAll` independently. If `beforeAll` seeds a database
record, three workers seed it three times.

For setup that must run exactly once for the entire suite, use `globalSetup`
in `playwright.config.ts`. That is covered in Chapter 32.

---

## Q305.13 — What is the difference between hooks and fixtures for test setup?

Both hooks and fixtures set up state before a test. The key difference:
hooks are local to a file, fixtures are shared across the entire project.

| | Hooks | Fixtures |
|---|---|---|
| Defined in | The spec file itself | A separate fixtures file |
| Reusable across files | No — copy-paste required | Yes — injected automatically |
| Teardown | `afterEach` or `afterAll` | Code after `await use(...)` |
| Best for | File-specific navigation, evidence capture | Page objects, shared auth, API clients |

In practice, use both together:

```typescript
// Fixture — reusable across all spec files
export const test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

// Spec file — local setup specific to this file
test.describe('Employee List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employees'); // local navigation — only in this file
  });

  test.afterEach(async ({ page }) => {
    if (test.info().status !== test.info().expectedStatus) {
      await test.info().attach('screenshot', {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
    }
  });

  test('list loads @smoke', async ({ loginPage }) => {
    // loginPage comes from fixture — reusable
    // navigation was done by beforeEach — local to this file
  });
});
```

Fixtures handle what would otherwise be duplicated across multiple spec files.
Hooks handle what is specific to one file or describe block.

---

## Q305.14 — Write a complete spec file using all four hooks correctly.

```typescript
import { test, expect } from '../fixtures/baseFixture';

// File-level hooks — apply to all tests in this file
test.beforeEach(async ({ page }) => {
  // Every test starts logged in — storageState handles auth
  await page.goto('/dashboard');
});

test.afterEach(async ({ page }) => {
  // Capture failure evidence on every test failure
  if (test.info().status !== test.info().expectedStatus) {
    await test.info().attach('failure-screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  }
});

test.describe('Leave Module', () => {
  let createdLeaveId: string;

  // beforeAll — get auth token once for all API calls in this group
  test.beforeAll(async ({ request }) => {
    // worker-scoped fixture — valid in beforeAll
    console.log('Leave module test group starting');
  });

  // beforeEach — create fresh leave data for each test
  test.beforeEach(async ({ api }) => {
    createdLeaveId = await api.createLeaveRequest({
      employeeId: 'EMP001',
      type: 'Annual',
      fromDate: '2026-04-01',
      toDate: '2026-04-03',
    });
    await api.page.goto('/leave'); // navigate to leave module
  });

  // afterEach — clean up the leave record after each test
  test.afterEach(async ({ api }) => {
    await api.deleteLeaveRequest(createdLeaveId).catch(() => {});
  });

  // afterAll — log group completion
  test.afterAll(async () => {
    console.log('Leave module test group complete');
  });

  test('manager can approve pending leave @smoke', async ({ page }) => {
    await page.getByTestId(`leave-${createdLeaveId}`).click();
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByTestId('leave-status')).toHaveText('Approved');
  });

  test('manager can reject with reason @regression', async ({ page }) => {
    await page.getByTestId(`leave-${createdLeaveId}`).click();
    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByLabel('Reason').fill('Insufficient notice period');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByTestId('leave-status')).toHaveText('Rejected');
  });
});
```

---

## Q305.15 — How do you capture screenshots on failure using afterEach?

The correct pattern checks whether the test's actual status matches its
expected status — this correctly handles `test.fail()` tests too:

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();

  // info.status     — what actually happened: 'passed', 'failed', 'timedOut'
  // info.expectedStatus — what was expected: 'passed' normally, 'failed' for test.fail()
  // A test is only genuinely unhealthy when these two differ

  if (info.status !== info.expectedStatus) {
    await info.attach('failure-screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    await info.attach('failure-url', {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });
  }
});
```

Using `info.status !== info.expectedStatus` rather than
`info.status === 'failed'` ensures that `test.fail()` tests (which are
expected to fail) do not generate false-positive failure screenshots.

The screenshot appears directly in the HTML report — no need to dig through
file system folders or reproduce failures locally.

---

## Q305.16 — What was the most impactful hook pattern you introduced in your project?

In our project, the most impactful change was moving from per-test `page.goto`
calls to a file-level `beforeEach` that handles all pre-navigation, combined
with `afterEach` for automatic failure screenshots.

Before:
```typescript
test('search works', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#user', 'Admin');
  await page.fill('#pass', 'admin123');
  await page.click('button');
  await page.goto('/employees');
  // actual test
});
// ×30 tests, all starting with these same 5 lines
```

After:
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/employees'); // storageState handles login
});

test.afterEach(async ({ page }) => {
  if (test.info().status !== test.info().expectedStatus) {
    await test.info().attach('screenshot', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  }
});

test('search works', async ({ page }) => {
  // Starts directly at /employees — test is just the real logic
});
```

This removed about 150 lines of duplicated setup code, and CI failure
investigation time dropped significantly because every failure now comes
with an attached screenshot.

---

## Q305.17 — How does afterEach interact with test.fail() tests?

A `test.fail()` test is expected to fail. If it fails as expected, its
`info.status` is `'failed'` and `info.expectedStatus` is `'failed'` — they
match, so the test is reported as healthy.

If you use `info.status === 'failed'` in `afterEach` to trigger screenshots,
you will capture screenshots for all `test.fail()` tests even though they
are passing in the intended sense. This pollutes the report with false alarms.

The correct guard:

```typescript
test.afterEach(async ({ page }) => {
  if (test.info().status !== test.info().expectedStatus) {
    // Only fires for genuinely unexpected outcomes
    // Does NOT fire for test.fail() tests that fail as expected
    await test.info().attach('screenshot', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  }
});
```

This distinction matters in any project that uses `test.fail()` to track
known bugs — and it is the kind of subtle detail interviewers use to
separate candidates with real project experience.

---

## Q305.18 — What is the most common hook mistake you have seen in team code reviews?

The most common mistake is cleanup code in `afterEach` without defensive
`.catch()` calls. A cleanup action that works 99% of the time will eventually
fail — the API is slow, the element is already gone, the page is closed. When
it does, every passing test in that group suddenly appears as failing in CI.
The report shows a test failure with a stack trace pointing to `afterEach`,
not to the test body. The developer opens the test, sees nothing wrong,
and spends 30 minutes confused.

The fix is mechanical:

```typescript
// ❌ Dangerous — any failure here marks the test as failed
test.afterEach(async ({ page, api }) => {
  await api.deleteRecord(createdId);
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.screenshot({ path: 'last-state.png' });
});

// ✅ Defensive — failures in cleanup do not mask test results
test.afterEach(async ({ page, api }) => {
  await api.deleteRecord(createdId).catch(() => {});
  await page.getByRole('button', { name: 'Logout' }).click().catch(() => {});
  await page.screenshot({ path: 'last-state.png' }).catch(() => {});
});
```

I now include this as a required item in our team's PR checklist: any cleanup
action in `afterEach` must have `.catch(() => {})` unless there is an explicit
reason to let the error propagate.

---

## Chapter Summary

- Four hooks: `beforeAll` (once per group), `beforeEach` (per test), `afterEach` (per test, always), `afterAll` (once per group).
- `beforeEach` eliminates duplicated setup. Use it for navigation and anything that must be fresh per test.
- `beforeAll` is for expensive shared setup — but only receives worker-scoped fixtures, not `page`.
- `afterEach` always runs, even on failure — the correct place for screenshots and cleanup. Use `.catch()` defensively.
- Hook execution order: outer setup → inner setup → test → inner teardown → outer teardown.
- `beforeAll` runs per worker, not globally. Use `globalSetup` for truly global one-time setup.
- Check `info.status !== info.expectedStatus` (not `=== 'failed'`) to correctly handle `test.fail()` tests.
- Hooks are local to a file. Fixtures are reusable across files. Use both together.
