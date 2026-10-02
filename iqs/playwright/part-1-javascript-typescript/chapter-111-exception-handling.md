# Chapter 111 — Exception Handling

This chapter covers how JavaScript handles errors and how to apply that
to test automation. Interviewers test exception handling because poor
error handling produces cryptic test failures that are hard to diagnose
and tests that silently pass when they should fail. Questions build from
what an exception is through try/catch mechanics to custom error classes
used in real frameworks.

---

## Q111.1 — What is an exception in JavaScript?

An exception is an error that occurs during execution. When JavaScript
encounters a problem it cannot handle — accessing a null property, calling
a non-existent function, dividing by zero in certain contexts — it throws
an exception. If nothing catches it, the script stops.

```javascript
let obj = null;
obj.name; // TypeError: Cannot read properties of null (reading 'name')

let x = undeclaredVariable; // ReferenceError: undeclaredVariable is not defined

JSON.parse("not valid json"); // SyntaxError: Unexpected token
```

In test automation, exceptions come from: Playwright actions on elements
that don't exist, network timeouts, assertion failures (Playwright
throws when `expect` fails), TypeErrors from null API responses, and
custom errors thrown by your own helpers.

---

## Q111.2 — What is try/catch/finally and how does each block work?

`try/catch/finally` is JavaScript's structured way to handle errors.

**`try`** — wraps code that might throw. If an exception is thrown
anywhere in the `try` block, execution jumps immediately to `catch`.

**`catch(error)`** — receives the thrown value. Code here handles
the error. After `catch` completes, execution continues after the
whole `try/catch` block (unless you re-throw).

**`finally`** — runs regardless of whether an exception occurred. Even
if `catch` re-throws or the function returns early, `finally` runs.

```typescript
async function setupTest(request: APIRequestContext) {
  let userId: string | null = null;

  try {
    const user = await createUser(request, { email: "test@example.com" });
    userId = user.id;
    return userId;
  } catch (error) {
    console.error("Setup failed:", (error as Error).message);
    throw error; // re-throw so the test framework knows setup failed
  } finally {
    // Always runs — log the outcome for debugging
    console.log(`Setup completed. User ID: ${userId ?? "not created"}`);
  }
}
```

---

## Q111.3 — When do you use try/catch in test automation?

Try/catch appears in three situations in a Playwright project:

**Retry logic** — wrap a flaky operation, catch the failure, wait, and
retry. Chapter 6 showed the `withBackoff` pattern. `try/catch` is the
mechanism.

**API setup with cleanup** — when test setup creates resources, any
failure should still attempt cleanup. `try/catch/finally` lets setup
fail loudly while ensuring cleanup runs.

**Soft assertions or conditional paths** — when you want to check
something that might not be present but should not fail the whole test:

```typescript
// Check for optional promotional banner — present only on some builds
try {
  await expect(page.getByTestId("promo-banner")).toBeVisible({ timeout: 2000 });
  await page.getByTestId("promo-banner").getByRole("button", { name: "Dismiss" }).click();
} catch {
  // Banner not present — that is fine, continue the test
}
```

Do NOT use `try/catch` to swallow all errors silently. If you catch an
error, either handle it meaningfully or re-throw it.

---

## Q111.4 — How does your project handle errors in test code?

In our project, error handling follows three rules.

**Rule 1 — Let test failures propagate.** We do not wrap entire test
bodies in `try/catch`. If a Playwright action or assertion fails, the
test should fail. Playwright's error message tells the engineer exactly
what went wrong.

**Rule 2 — Wrap setup and teardown.** API calls in `beforeEach` and
`afterEach` use `try/catch` so that a setup failure produces a clear
message ("failed to create test user") rather than a cryptic Playwright
error from the middle of the test.

**Rule 3 — Custom error classes for framework errors.** When our
framework detects a condition that is not a Playwright error (missing
config, invalid test data, environment mismatch), it throws a typed
custom error. The message and properties make the root cause immediately
visible in the report.

---

## Q111.5 — What is the Error object? What properties does it have?

Every exception thrown in JavaScript is (or should be) an instance of
`Error` or a subclass of it. The `Error` object has three standard
properties:

**`message`** — the human-readable error description.

**`name`** — the error type. For the base class it is `"Error"`. For
`TypeError` it is `"TypeError"`. For custom subclasses it is whatever
you set.

**`stack`** — the stack trace as a string. Shows the call chain from the
throw point back to the entry point. This is what you read when
debugging.

```javascript
try {
  null.property; // TypeError
} catch (error) {
  console.log(error.name);    // "TypeError"
  console.log(error.message); // "Cannot read properties of null..."
  console.log(error.stack);   // full stack trace
}
```

In TypeScript, thrown values are typed as `unknown` in `catch` blocks.
Always cast: `(error as Error).message` — or use a type guard:

```typescript
catch (error) {
  const message = error instanceof Error ? error.message : String(error);
}
```

---

## Q111.6 — What happens to a test if an unhandled exception is thrown?

The test fails immediately. Playwright's test runner catches all
unhandled exceptions inside a test function and marks the test as
failed with the error message and stack trace.

```typescript
test("product page loads", async ({ page }) => {
  await page.goto("/products");
  await page.getByTestId("nonexistent").click(); // throws TimeoutError
  // Everything after here does NOT run
  await expect(page.getByRole("heading")).toBeVisible();
});
// Test result: FAILED — TimeoutError: locator.click: Timeout...
```

In `beforeEach` and `afterEach`, an unhandled exception also fails the
test and prevents the rest of the hook from running. If `afterEach`
throws, subsequent `afterEach` blocks in the same test still run.

For Playwright assertions specifically, `expect()` throws a specific
`AssertionError` when the condition is not met. This is also caught
by the test runner and reported as a failure.

---

## Q111.7 — What is the difference between throwing an error and returning an error?

**Throwing** an error interrupts execution. Control jumps to the nearest
`catch` block. The caller is forced to handle it or the exception
propagates up.

**Returning** an error passes it as a value. The caller receives it and
decides what to do. This is common in functional patterns but rare in
test code.

```typescript
// Throwing — forces the caller to handle or propagate
async function getUser(id: string) {
  const response = await request.get(`/api/users/${id}`);
  if (!response.ok()) {
    throw new Error(`User ${id} not found: ${response.status()}`);
  }
  return response.json();
}

// Returning an error as a value — caller must check explicitly
async function tryGetUser(id: string): Promise<{ data?: User; error?: string }> {
  const response = await request.get(`/api/users/${id}`);
  if (!response.ok()) return { error: `User ${id} not found` };
  return { data: await response.json() };
}
```

**In test automation, throw errors.** Tests should fail loudly when
something goes wrong. Returning errors as values makes it easy to
accidentally ignore failures — which defeats the purpose of the test.

---

## Q111.8 — What is the finally block and when does it run?

`finally` runs after `try` (and `catch` if it was entered) — always,
regardless of outcome. Even if the function returns inside `try`, or
`catch` re-throws, `finally` executes.

```typescript
let browser: Browser | null = null;

try {
  browser = await chromium.launch();
  // ... do work
  return "success";
} catch (error) {
  console.error("Error:", error.message);
  return "failed"; // finally still runs even though we're returning here
} finally {
  // Cleanup — always runs
  await browser?.close(); // ?. handles the case where launch failed
  console.log("Browser closed");
}
```

In test automation, `finally` is used for cleanup that must happen
regardless of test outcome — closing connections, deleting temporary
files, releasing locks. Playwright fixtures handle most cleanup via the
`use` pattern, which is cleaner than explicit `finally` blocks in tests.

---

## Q111.9 — What is the difference between a custom error class and the base Error class?

The base `Error` class gives you `message`, `name`, and `stack`. A custom
error class extends `Error` to add more context — typed properties that
describe exactly what went wrong.

```typescript
// Base Error — generic, no typed context
throw new Error("Navigation failed after 3 attempts");
// Caller only has a message string — no structured data

// Custom error class — structured, typed context
class NavigationError extends Error {
  constructor(
    public readonly url: string,
    public readonly attempts: number,
    message: string
  ) {
    super(message);
    this.name = "NavigationError";
  }
}

throw new NavigationError("/checkout", 3, "Navigation failed after 3 attempts");
// Caller can catch and inspect error.url and error.attempts specifically
```

```typescript
// Usage — specific handling for NavigationError
try {
  await navigateWithRetry(page, "/checkout");
} catch (error) {
  if (error instanceof NavigationError) {
    console.error(`Failed to reach ${error.url} after ${error.attempts} attempts`);
  } else {
    throw error; // unexpected error — propagate
  }
}
```

---

## Q111.10 — When should you catch an error vs let it propagate?

**Let it propagate when:**
- The calling code is a test body — tests should fail, not silently recover
- You have no meaningful action to take at the current level
- The error is unexpected and indicates a bug

**Catch it when:**
- You are writing retry logic and want to retry on certain errors
- Cleanup must happen regardless of success (use `finally` for this)
- The error is expected for a specific code path and you have a recovery
- You want to add context to the error before re-throwing

```typescript
// ✅ Add context and re-throw — caller gets better information
async function loginAs(role: string) {
  try {
    await page.goto("/login");
    await loginPage.login(credentials[role]);
  } catch (error) {
    throw new Error(`Failed to log in as ${role}: ${(error as Error).message}`);
  }
}

// ✅ Retry on specific errors, propagate others
try {
  return await operation();
} catch (error) {
  if (error instanceof TimeoutError) {
    return retry(); // handle timeout specifically
  }
  throw error; // anything else propagates
}
```

---

## Q111.11 — What is wrong with catching all errors silently — show the anti-pattern?

```typescript
// ❌ Silent catch — swallows all errors
async function clickSubmit() {
  try {
    await page.getByRole("button", { name: "Submit" }).click();
  } catch {
    // do nothing
  }
}

// The test now continues even if Submit button doesn't exist
// or the click fails — assertions may pass for the wrong reasons
```

Problems with swallowing errors:
- The test may "pass" while the action it was testing never happened
- Debugging is impossible — no error, no stack trace, no clue
- Tests lose their value as a safety net — they pass whether the feature
  works or not

```typescript
// ✅ Always at minimum log and re-throw
try {
  await page.getByRole("button", { name: "Submit" }).click();
} catch (error) {
  // Add context to the error before propagating
  throw new Error(
    `Submit button click failed: ${(error as Error).message}`
  );
}
```

Or more simply — if there is no recovery logic, just do not use
`try/catch` at all. Let Playwright's own error handling report the failure.

---

## Q111.12 — What is error propagation in async code?

Error propagation in async code works through the Promise chain. When
an `async` function throws (or awaits a rejected Promise), the function
returns a rejected Promise. The caller's `await` re-throws that rejection.

```typescript
async function level3() {
  throw new Error("Something broke at level 3");
}

async function level2() {
  await level3(); // level3 rejects → level2 rejects
}

async function level1() {
  try {
    await level2(); // level2 rejects → caught here
  } catch (error) {
    console.error("Caught:", error.message); // "Something broke at level 3"
  }
}
```

Errors propagate up the async call chain automatically. You do not need
to manually pass errors up — `await` handles that. You only need to
`catch` at the level where you have a meaningful recovery action.

The risk: if no level catches a rejected Promise and it is not `await`ed,
you get an unhandled promise rejection. Always await async calls or
attach `.catch()`.

---

## Q111.13 — Write a custom error class for an automation framework

```typescript
// File: tests/errors/index.ts

// Base class for all framework errors
export class AutomationError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AutomationError";
  }
}

// Thrown when test setup (API calls) fails
export class TestSetupError extends AutomationError {
  constructor(
    public readonly step: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(`[Setup/${step}] ${message}`, context);
    this.name = "TestSetupError";
  }
}

// Thrown when a required environment variable is missing
export class ConfigurationError extends AutomationError {
  constructor(public readonly variable: string) {
    super(`Required environment variable "${variable}" is not set`);
    this.name = "ConfigurationError";
  }
}

// Thrown when element state does not match expectation after retries
export class ElementStateError extends AutomationError {
  constructor(
    public readonly locatorDescription: string,
    public readonly expectedState: string,
    public readonly actualState: string
  ) {
    super(
      `Element "${locatorDescription}" expected to be ${expectedState} but was ${actualState}`
    );
    this.name = "ElementStateError";
  }
}
```

---

## Q111.14 — Write a safe wrapper that catches errors and attaches them to a Playwright test report

```typescript
// File: tests/helpers/safe-action.ts
import { TestInfo } from '@playwright/test';

/**
 * Wraps an async action, attaches failure details to the test report,
 * and re-throws so the test still fails.
 */
async function safeAction<T>(
  testInfo: TestInfo,
  actionName: string,
  action: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await action();
    testInfo.annotations.push({
      type: "action",
      description: `✅ ${actionName} (${Date.now() - start}ms)`,
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    testInfo.annotations.push({
      type: "error",
      description: `❌ ${actionName} failed: ${message}`,
    });
    // Re-throw — test must still fail
    throw error;
  }
}

// Usage
test("checkout flow", async ({ page }, testInfo) => {
  await safeAction(testInfo, "Navigate to cart", () => page.goto("/cart"));
  await safeAction(testInfo, "Click checkout", () =>
    page.getByRole("button", { name: "Checkout" }).click()
  );
  // Failures appear in the report with the action name — easy to diagnose
});
```

---

## Q111.15 — Describe how error handling in your project helped diagnose a hard-to-find failure

In our project we had intermittent failures in our checkout tests. The
error message was always `"locator.click: Timeout 30000ms"` on the
payment form submit button — not helpful for diagnosing root cause.

We added a `safeAction` wrapper (similar to Q11.14) around every major
test step. The wrapper attached step names and durations to the report.
When the next failure occurred, the report showed:

```
✅ Navigate to checkout (1,243ms)
✅ Fill shipping address (2,108ms)
✅ Select payment method (891ms)
❌ Load Stripe iframe (timeout after 30,000ms)
```

The Stripe payment iframe was timing out during load — a network issue
that had nothing to do with the submit button. The submit button timeout
was a symptom. The root cause was the iframe not appearing.

Once we had that context, we added a specific wait for the Stripe iframe
to load before attempting to fill the card fields:

```typescript
await page.waitForSelector("iframe[name^='__privateStripeFrame']");
```

The error handling did not fix the bug — but it made the root cause
immediately visible, cutting diagnosis time from hours to minutes.

---

## Chapter Summary — Key Points for Your Interview

- `try` wraps risky code. `catch` handles the error. `finally` always
  runs — use it for cleanup.
- In test code, let errors propagate by default. Only catch when you have
  a specific recovery action or need to add context before re-throwing.
- Never swallow errors silently. An empty `catch` block turns a failing
  test into a passing lie.
- Custom error classes add typed context. A `TestSetupError` with a
  `step` property tells you exactly where setup broke — a plain `Error`
  just gives you a string.
- In async code, errors propagate through the `await` chain automatically.
  No need to manually pass errors up — just let them bubble until caught.
- The Playwright test runner catches all unhandled exceptions inside a
  test and marks the test as failed. You do not need to wrap test bodies
  in `try/catch`.

---

