# Chapter 109 — Async JS — Promises & async/await

This is the most important chapter in Part 1. Every Playwright action
is asynchronous. Interviewers test this topic heavily because async bugs
are the single biggest source of flaky, non-deterministic test behaviour.
Questions cover the event loop, promise states, async/await mechanics,
and parallel execution patterns — all with automation-specific examples.

---

## Q109.1 — What is asynchronous programming in JavaScript?

Synchronous code runs line by line. Each line waits for the previous
one to finish before starting. Asynchronous code starts a long-running
operation — like a network request or browser action — and instead of
waiting, registers a callback and continues with other work. When the
operation completes, the callback runs.

```javascript
// Synchronous — blocks until each line finishes
const data = readFileSync("data.json"); // pauses everything
process(data);

// Asynchronous — does not block
readFile("data.json", (error, data) => {
  process(data); // runs when ready
});
// code here runs immediately, before readFile completes
```

In test automation, every browser interaction takes time — navigations,
network requests, DOM updates. JavaScript's async model lets Playwright
send a command, wait for the browser's response, and only then move to
the next step. Without async, tests would either miss events or require
explicit delays everywhere.

---

## Q109.2 — What is a Promise and what are its three states?

A Promise is an object that represents an async operation that will
complete (or fail) in the future. It has exactly three states:

**Pending** — the operation has started but not finished yet.

**Fulfilled** — the operation completed successfully. The promise holds
the resolved value.

**Rejected** — the operation failed. The promise holds the error reason.

```javascript
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("data loaded"); // moves to fulfilled
    // OR: reject(new Error("failed")); // moves to rejected
  }, 1000);
});

promise
  .then(value => console.log(value))   // "data loaded"
  .catch(error => console.error(error)); // runs if rejected
```

Once a promise moves from pending to fulfilled or rejected, it stays
in that state forever. A fulfilled promise always returns the same value.

In Playwright, every `page.goto()`, `locator.click()`, and `expect()`
call returns a Promise. `await` unwraps the resolved value and pauses
until the promise settles.

---

## Q109.3 — When do you need async/await in Playwright tests?

Every time you interact with the browser. All Playwright methods that
perform browser operations return Promises — they cannot complete
instantaneously.

```typescript
test("user can log in", async ({ page }) => {
  // Every line below returns a Promise — await pauses until it settles
  await page.goto("/login");
  await page.getByLabel("Email").fill("user@test.com");
  await page.getByLabel("Password").fill("pass123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL("/dashboard");
});
```

If you omit `await`, the next line runs before the browser action
completes. The test becomes a race condition — sometimes it passes,
sometimes it fails depending on timing.

The rule is simple: `await` every Playwright method call. The only
exception is when you deliberately want parallel execution with
`Promise.all`.

---

## Q109.4 — How do you handle async operations in your automation project?

In our project, we follow three rules consistently:

**1. Always `await` Playwright method calls.** ESLint's
`@typescript-eslint/no-floating-promises` rule catches any unawaited
promise in code review automatically.

**2. Use `for...of` for sequential async loops.** Never `forEach` with
`async`. We added `no-restricted-syntax` ESLint rules to flag
`forEach(async`.

**3. Use `Promise.all` for independent parallel operations.** API setup
calls that create multiple test records run in parallel. Page actions
that depend on each other run sequentially.

We also use `try/catch` around API setup steps so test failures in setup
produce clear error messages rather than cryptic "page closed" errors.

---

## Q109.5 — What is the event loop and how does it handle async operations?

JavaScript runs on a single thread. The event loop is the mechanism that
lets it handle async operations without blocking.

Here is the sequence:

1. Your test calls `await page.goto("/login")`.
2. Playwright sends the navigation command to the browser and creates
   a Promise.
3. The `await` keyword suspends the test function at that line. Control
   returns to the event loop.
4. The event loop checks the **task queue** for callbacks that are ready.
5. When the browser finishes loading the page, it resolves the Promise.
   The resolved callback is placed on the **microtask queue**.
6. The event loop picks up the microtask and resumes the test function
   from after the `await` line.

The key insight: `await` does not block the thread. It suspends the
current function and gives the event loop a chance to do other work.
This is why multiple Playwright tests can run in parallel in the same
process — each test is just an async function that suspends and resumes.

---

## Q109.6 — What happens if you forget to await a Playwright action?

The action starts but the next line runs immediately — before the
browser has done anything.

```typescript
// ❌ Missing await — race condition
test("login test", async ({ page }) => {
  page.goto("/login");           // starts navigation — does NOT wait
  page.getByLabel("Email").fill("user@test.com"); // runs before page loads
  // Result: "fill" fails because the login form is not yet visible
});
```

The failure mode depends on timing. On a fast machine the page might
load before `fill` runs — the test passes. On a slow CI machine it fails.
This is the definition of a flaky test.

```typescript
// ✅ Correct — await every action
await page.goto("/login");
await page.getByLabel("Email").fill("user@test.com");
```

The ESLint rule `@typescript-eslint/no-floating-promises` catches missing
`await` at build time. Any expression that returns a Promise and is not
awaited, assigned, or returned is flagged as an error.

---

## Q109.7 — What is Promise.all and when do you use it?

`Promise.all` takes an array of Promises and returns a new Promise that
resolves when all of them resolve — or rejects immediately if any one
rejects.

```typescript
// Sequential — takes sum of individual durations
await createUser("alice@test.com"); // waits
await createUser("bob@test.com");   // then waits
await createUser("carol@test.com"); // then waits

// Parallel with Promise.all — takes duration of the slowest
await Promise.all([
  createUser("alice@test.com"),
  createUser("bob@test.com"),
  createUser("carol@test.com"),
]); // all three run at the same time
```

In test automation, `Promise.all` is used for:

**Parallel API setup** — creating multiple independent test records
before a test runs.

**Listening for a response before clicking** — the most important pattern:

```typescript
const [response] = await Promise.all([
  page.waitForResponse(r => r.url().includes("/api/orders")),
  page.getByRole("button", { name: "Place Order" }).click(),
]);
// response is captured — the click and the listener started simultaneously
```

---

## Q109.8 — What is the difference between Promise.all and Promise.allSettled?

**`Promise.all`** — rejects as soon as any single Promise rejects. You
get the first error, but you do not know the outcome of the others.

**`Promise.allSettled`** — waits for every Promise to settle (resolve
or reject). Returns an array where each entry has a `status` of
`"fulfilled"` or `"rejected"` and either a `value` or `reason`.

```typescript
const results = await Promise.allSettled([
  createUser("alice@test.com"),
  createUser("duplicate@test.com"), // this one fails
  createUser("carol@test.com"),
]);

for (const result of results) {
  if (result.status === "fulfilled") {
    console.log("Created:", result.value.id);
  } else {
    console.error("Failed:", result.reason.message);
  }
}
// All three results available — even if one failed
```

**Use `Promise.all`** when you need all operations to succeed and want
to fail fast.

**Use `Promise.allSettled`** when you want to process results for all
operations regardless of individual failures — for example, bulk cleanup
in `afterAll` where you want to attempt deleting all created records even
if some deletions fail.

---

## Q109.9 — What is the difference between async/await and .then() chains?

Both handle Promises. `async/await` is the modern syntax. `.then()` chains
are the older approach.

```typescript
// .then() chain — nested callbacks, error handling is separate
page.goto("/login")
  .then(() => page.getByLabel("Email").fill("user@test.com"))
  .then(() => page.getByRole("button", { name: "Sign In" }).click())
  .then(() => expect(page).toHaveURL("/dashboard"))
  .catch(error => console.error(error));

// async/await — reads like synchronous code, errors via try/catch
await page.goto("/login");
await page.getByLabel("Email").fill("user@test.com");
await page.getByRole("button", { name: "Sign In" }).click();
await expect(page).toHaveURL("/dashboard");
```

`async/await` is easier to read, easier to debug, and handles errors with
standard `try/catch`. The execution model is identical — both compile to
the same Promise chain. Always use `async/await` in Playwright test code.
`.then()` chains appear in legacy code and in the rare cases where chaining
is genuinely cleaner than sequential awaits.

---

## Q109.10 — When should you use Promise.all vs sequential await calls?

**Sequential `await`** — each operation waits for the previous one:
- When operations depend on each other's results
- When they share a browser context or page (page actions)
- When the system has rate limits or cannot handle concurrent calls
- When the order of side effects matters

**`Promise.all`** — all operations start at the same time:
- When operations are fully independent
- When they use separate API contexts or browser contexts
- When speed matters and the system can handle concurrency

```typescript
// Sequential — each API call creates a user, next step needs the previous ID
const user1 = await createUser("alice@test.com");
const team  = await createTeam(user1.id); // needs user1
const user2 = await addToTeam(team.id, "bob@test.com"); // needs team

// Parallel — all three users are independent
const [alice, bob, carol] = await Promise.all([
  createUser("alice@test.com"),
  createUser("bob@test.com"),
  createUser("carol@test.com"),
]);
```

---

## Q109.11 — What is wrong with this async code — find the missing await?

```typescript
// ❌ Find the bugs
test("checkout flow", async ({ page }) => {
  page.goto("/cart");                                    // Bug 1
  await page.getByRole("button", { name: "Checkout" }).click();

  const response = page.waitForResponse("/api/order");   // Bug 2
  await page.getByRole("button", { name: "Confirm" }).click();

  const body = await response.json();                    // Bug 3
  expect(body.orderId).toBeDefined();
});
```

**Bug 1** — `page.goto` is not awaited. The click happens before the
cart page loads.

**Bug 2** — `waitForResponse` is not awaited when creating the listener.
The `response` variable holds a Promise, not the resolved Response object.
But the click happens after, so the listener was registered — the timing
is accidentally "safe" here but the code is still wrong.

**Bug 3** — `response` is still a Promise (because Bug 2). Calling
`.json()` on a Promise throws a TypeError.

```typescript
// ✅ Fixed
await page.goto("/cart");

const [response] = await Promise.all([                   // start listening AND clicking together
  page.waitForResponse(r => r.url().includes("/api/order")),
  page.getByRole("button", { name: "Confirm" }).click(),
]);

const body = await response.json();
expect(body.orderId).toBeDefined();
```

---

## Q109.12 — What is a floating promise and why is it dangerous in tests?

A floating promise is a Promise that is neither awaited, returned, nor
assigned to a variable. It runs but nothing waits for it. Errors it
throws are unhandled.

```typescript
// ❌ Floating promise — danger
test("check dashboard", async ({ page }) => {
  await page.goto("/dashboard");

  // This assertion runs but nobody awaits it
  expect(page.getByRole("heading")).toBeVisible(); // floating!

  // Test ends here — the assertion may not have started or may throw after the test ends
});
```

Floating promises in tests produce one of two outcomes:
- The test passes because the promise resolved before the test ended (flaky)
- The test passes because the rejection is unhandled and lost (silent miss)

The fix is always to `await` every assertion and every action.

ESLint rule `@typescript-eslint/no-floating-promises` flags these
automatically. The rule is standard in Playwright TypeScript projects.

---

## Q109.13 — Write code using Promise.all to wait for multiple API responses simultaneously

```typescript
import { test, expect } from '@playwright/test';

test("dashboard loads all three data sections", async ({ page }) => {
  // Register listeners BEFORE navigating — responses might arrive fast
  const [productsResponse, ordersResponse, statsResponse] = await Promise.all([
    page.waitForResponse(r =>
      r.url().includes("/api/products") && r.status() === 200
    ),
    page.waitForResponse(r =>
      r.url().includes("/api/orders") && r.status() === 200
    ),
    page.waitForResponse(r =>
      r.url().includes("/api/stats") && r.status() === 200
    ),
    page.goto("/dashboard"), // navigation is the fourth "promise" — triggers all three API calls
  ]);

  // All three APIs have responded — now assert the UI
  await expect(page.getByTestId("products-section")).toBeVisible();
  await expect(page.getByTestId("orders-section")).toBeVisible();
  await expect(page.getByTestId("stats-section")).toBeVisible();

  // Optionally verify response payloads
  const stats = await statsResponse.json();
  expect(stats.totalOrders).toBeGreaterThan(0);
});
```

---

## Q109.14 — Write an async retry utility that retries a flaky operation with backoff

```typescript
// File: tests/helpers/async-retry.ts

interface BackoffOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  factor?: number; // multiply delay by this each attempt (exponential backoff)
  onAttempt?: (attempt: number, error: Error) => void;
}

async function withBackoff<T>(
  fn: () => Promise<T>,
  options: BackoffOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 500,
    factor = 2,
    onAttempt,
  } = options;

  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error; // last attempt — re-throw

      onAttempt?.(attempt, error as Error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= factor; // exponential: 500ms, 1000ms, 2000ms...
    }
  }

  throw new Error("unreachable"); // TypeScript requires this
}

// Usage — retry an API call that occasionally returns 503
const user = await withBackoff(
  () => apiContext.get("/api/users/me").then(r => r.json()),
  {
    maxAttempts: 3,
    initialDelayMs: 500,
    onAttempt: (n, err) => console.warn(`Attempt ${n} failed: ${err.message}`),
  }
);
```

---

## Q109.15 — Describe a race condition or async bug you diagnosed in a Playwright test

In our project we had a test that submitted a form and then asserted the
confirmation email appeared in a test inbox. The test was flaky — it
passed about 70% of the time.

The original code:

```typescript
// ❌ Race condition — email check starts too soon
await page.getByRole("button", { name: "Submit" }).click();
await page.waitForURL("/confirmation");
const emails = await mailbox.getAll(); // checked immediately
expect(emails[0].subject).toContain("Order Confirmed");
```

The form submission triggered an async email send on the backend. The
page redirect happened immediately, but the email was sent by a background
job that could take up to two seconds. `mailbox.getAll()` ran before
the email arrived.

We fixed it with a polling assertion:

```typescript
// ✅ Fixed — poll until email arrives
await page.getByRole("button", { name: "Submit" }).click();
await page.waitForURL("/confirmation");

// Poll the mailbox with retries — Playwright's expect retries automatically
await expect.poll(
  async () => {
    const emails = await mailbox.getAll();
    return emails.some(e => e.subject.includes("Order Confirmed"));
  },
  { timeout: 10_000, intervals: [1000, 2000, 3000] }
).toBe(true);
```

`expect.poll` retried the mailbox check every 1–3 seconds for up to
10 seconds. The flakiness disappeared completely.

---

## Q109.16 — What is Promise.race and when would you use it in automation?

`Promise.race` returns a Promise that resolves (or rejects) with the
outcome of whichever input Promise settles first.

```typescript
const result = await Promise.race([
  page.waitForResponse("/api/fast-endpoint"),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout after 5s")), 5000)
  ),
]);
```

In test automation, `Promise.race` is useful for:

**Implementing custom timeouts** for operations that Playwright does not
time out natively.

**Detecting which of two events occurs first** — for example, whether a
success redirect or an error modal appears after a form submission.

```typescript
// Which happens first — success or error?
const outcome = await Promise.race([
  page.waitForURL("/dashboard").then(() => "success"),
  page.getByRole("alert").waitFor().then(() => "error"),
]);
expect(outcome).toBe("success");
```

Use `Promise.race` sparingly. `Promise.all` and sequential awaits cover
most automation scenarios. `Promise.race` is for genuinely competing
async events.

---

## Q109.17 — How do you handle errors in async code — try/catch vs .catch()?

Both catch rejected Promises. The choice is about readability and scope.

**`try/catch`** — wraps a block of code, any rejection inside the block
is caught.

```typescript
try {
  await page.goto("/slow-page", { timeout: 5000 });
  await expect(page.getByRole("heading")).toBeVisible();
} catch (error) {
  console.error("Navigation failed:", error.message);
  throw error; // re-throw so the test still fails
}
```

**`.catch()`** — chained onto a single Promise expression.

```typescript
const body = await apiContext.get("/api/data")
  .then(r => r.json())
  .catch(() => null); // return null instead of throwing
```

**Use `try/catch`** when you need to handle errors from multiple `await`
calls in one block, or when the error handling code is more than one line.

**Use `.catch()`** when you want to transform a rejection into a
fallback value for a single expression.

In test code, most errors should propagate — you want tests to fail when
something goes wrong. Use `try/catch` for retry logic and for cleanup
in `afterEach` where you want to attempt cleanup even after a test failure.

---

## Q109.18 — What is an unhandled promise rejection and how do you prevent it?

An unhandled promise rejection is a Promise that was rejected but had no
`.catch()` or `try/catch` to handle the error. The Node.js process emits
an `unhandledRejection` event and (in newer Node.js versions) exits with
a non-zero code.

In tests, unhandled rejections appear as confusing errors because they
may come from a different async context than the test that is currently
running.

```typescript
// ❌ Creates an unhandled rejection
async function setup() {
  fetchUserData(); // returns a Promise — not awaited, error is lost
}
```

Prevention rules:

1. **`await` every Promise.** The ESLint rule
   `@typescript-eslint/no-floating-promises` enforces this.

2. **Wrap `Promise.all` setups in `try/catch`** so that if one API call
   fails during test setup, the error is clearly reported.

3. **Use `.catch(noop)` deliberately** when you intentionally want to
   ignore a rejection — but always add a comment explaining why.

```typescript
// Deliberately ignore rejection — cleanup best-effort only
await deleteTestUser(userId).catch(() => {/* user may not exist */});
```

---

## Q109.19 — Write code that runs setup tasks in parallel and teardown tasks sequentially

```typescript
import { test as base, APIRequestContext } from '@playwright/test';

interface TestFixtures {
  testData: { adminId: string; teamId: string; projectId: string };
}

const test = base.extend<TestFixtures>({
  testData: async ({ request }, use) => {
    // SETUP — parallel: all three resources are independent
    const [admin, team, project] = await Promise.all([
      request.post("/api/users",    { data: { role: "admin" } }).then(r => r.json()),
      request.post("/api/teams",    { data: { name: "Test Team" } }).then(r => r.json()),
      request.post("/api/projects", { data: { name: "Test Project" } }).then(r => r.json()),
    ]);

    // Provide the IDs to the test
    await use({
      adminId:   admin.id,
      teamId:    team.id,
      projectId: project.id,
    });

    // TEARDOWN — sequential: delete in dependency order (project → team → admin)
    // Parallel deletion would risk FK constraint errors
    await request.delete(`/api/projects/${project.id}`);
    await request.delete(`/api/teams/${team.id}`);
    await request.delete(`/api/users/${admin.id}`);
  },
});

test("admin can assign project to team", async ({ page, testData }) => {
  const { adminId, teamId, projectId } = testData;
  await page.goto(`/admin/projects/${projectId}`);
  await page.getByRole("button", { name: "Assign Team" }).click();
  // ... rest of test
});
```

---

## Q109.20 — How does your team track and prevent async anti-patterns in the test codebase?

In our project we prevent async bugs at three levels.

**Level 1 — ESLint rules.** Three rules run on every pull request:
- `@typescript-eslint/no-floating-promises` — flags unawaited Promises
- `@typescript-eslint/await-thenable` — flags `await` on non-Promise values
- `no-restricted-syntax` — flags `forEach(async` patterns

Any violation fails the CI lint check before tests even run.

**Level 2 — TypeScript strict null checks.** `"strict": true` in
`tsconfig.json` means that return types of async functions are explicit.
A function that accidentally returns `void` instead of `Promise<void>`
gets flagged immediately.

**Level 3 — Code review checklist.** Our PR template includes a section:
"Async check: are all Playwright actions awaited? Are any loops using
`forEach` with async?" Reviewers check this explicitly for test files.

We also have a team rule: any new async utility function must have a
code comment that either marks it `// must be awaited` or explains why
it should not be awaited. This came from a bug where a logging helper
returned a Promise that nobody realised needed awaiting.

---

## Chapter Summary — Key Points for Your Interview

- Every Playwright browser action returns a Promise. Always `await` it.
  Forgetting `await` creates a race condition that looks like flakiness.
- A Promise has three states: pending, fulfilled, rejected. Once settled,
  it never changes. `await` unwraps the fulfilled value and throws on rejection.
- `forEach` with `async/await` does not work — `forEach` ignores the
  returned Promise. Use `for...of` for sequential async loops.
  Use `Promise.all` with `map` for parallel async loops.
- `Promise.all` rejects on first failure. `Promise.allSettled` waits
  for everything to settle and reports each outcome.
- The critical Playwright pattern: start `waitForResponse` AND click
  inside the same `Promise.all` — this guarantees the listener is
  registered before the click fires.
- `@typescript-eslint/no-floating-promises` is the most important ESLint
  rule for async test code. Enable it in every Playwright TypeScript project.

---

