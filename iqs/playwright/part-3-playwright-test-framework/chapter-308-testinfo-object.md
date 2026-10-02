# Chapter 308 — TestInfo Object

This chapter covers `TestInfo` — the runtime metadata object Playwright creates
for every test. Interviewers ask about TestInfo when they want to know if a
candidate can build production-quality test infrastructure: screenshots on
failure, flakiness detection, worker-safe parallel resources, and CI diagnostics.
Candidates who know TestInfo write `afterEach` hooks that tell you exactly what
broke, when, on which browser, and after how many retries.

---

## Q308.1 — What is TestInfo and how do you access it?

`TestInfo` is an object Playwright creates for every running test. It holds
all runtime metadata about that test — its title, file, project, retry count,
status, output directory, annotations, and attached files.

You access it by calling `test.info()` from anywhere inside a test body,
hook, or step:

```typescript
test('reads runtime metadata', async ({ page }) => {
  const info = test.info();

  console.log(info.title);        // 'reads runtime metadata'
  console.log(info.project.name); // 'chromium'
  console.log(info.retry);        // 0 (first run), 1 (first retry)
  console.log(info.status);       // 'passed', 'failed', 'timedOut', 'skipped'
});
```

`test.info()` is a function call, not a fixture — you do not declare it as a
parameter. It returns the live `TestInfo` for the currently running test.

---

## Q308.2 — What is the difference between status and expectedStatus?

`status` is what actually happened. `expectedStatus` is what Playwright expected
to happen. Both are string values.

```typescript
type TestStatus   = 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted'
type ExpectedStatus = 'passed' | 'failed' | 'skipped'
```

| Scenario | `expectedStatus` | `status` | Healthy? |
|---|---|---|---|
| Normal test passes | `'passed'` | `'passed'` | ✅ Yes |
| Normal test fails | `'passed'` | `'failed'` | ❌ No |
| `test.fail()` test fails | `'failed'` | `'failed'` | ✅ Yes |
| `test.fail()` test passes | `'failed'` | `'passed'` | ⚠️ Unexpected pass |
| `test.skip()` test | `'skipped'` | `'skipped'` | ✅ Yes |

A test is genuinely unhealthy when these two values differ. This distinction
is the foundation of how `test.fail()` works and the correct way to write
`afterEach` failure detection:

```typescript
test.afterEach(async ({ page }) => {
  if (test.info().status !== test.info().expectedStatus) {
    // Genuinely unexpected — capture evidence
    await test.info().attach('screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  }
});
```

Using `=== 'failed'` instead would trigger on `test.fail()` tests that fail
as expected — producing false-positive screenshots.

---

## Q308.3 — What does the retry property tell you and when is it useful?

`retry` is the retry attempt count. It is `0` on the first run, `1` on the
first retry, `2` on the second retry, and so on.

```typescript
test('employee search returns results @smoke', async ({ page }) => {
  if (test.info().retry > 0) {
    // On a retry — clear state before attempting again
    await page.context().clearCookies();
    await page.reload();
  }

  await page.goto('/employees');
  await page.getByLabel('Search').fill('Linda');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText('Linda Anderson')).toBeVisible();
});
```

In `afterEach`, `retry` lets you distinguish flaky from broken:

```typescript
test.afterEach(async () => {
  const { retry, status, title } = test.info();

  if (retry > 0 && status === 'passed') {
    console.warn(`⚠️ FLAKY: "${title}" passed on retry ${retry}`);
    // Log to flakiness dashboard — not a hard failure but worth investigating
  }

  if (retry > 0 && status === 'failed') {
    console.error(`❌ PERSISTENT: "${title}" still failing on retry ${retry}`);
    // This is a real problem — not flakiness
  }
});
```

A test that passes on `retry 1` is flaky. A test that fails on `retry 2` is
genuinely broken. `retry` lets your tooling tell the difference.

---

## Q308.4 — What is workerIndex and why does it matter for parallel execution?

`workerIndex` identifies which parallel worker process is running the current
test. Workers are numbered from 0. When Playwright runs tests in parallel,
each test runs in exactly one worker.

The critical use case: when tests write to files or databases, each worker
needs its own isolated resources. Without `workerIndex`, parallel workers
write to the same location and overwrite each other's data — causing
intermittent failures that are very hard to diagnose.

```typescript
test.beforeAll(async () => {
  const idx = test.info().workerIndex;

  // Worker-isolated temp directory — no collision between workers
  const dir = `./temp/worker-${idx}`;
  await fs.mkdir(dir, { recursive: true });

  // Worker-isolated database user
  const dbUser = `test_user_${idx}`;
  await setupDatabaseUser(dbUser);

  console.log(`Worker ${idx} initialised`);
});
```

```typescript
test('writes download file', async ({ page }) => {
  const idx = test.info().workerIndex;
  const downloadPath = `./downloads/worker-${idx}/export.csv`;

  await page.getByRole('button', { name: 'Export CSV' }).click();
  // Each worker saves to its own file — no overlap
});
```

Without `workerIndex`, three workers writing `export.csv` to the same path
produce non-deterministic results — one worker's file overwrites another's.

---

## Q308.5 — How do you use project.name from TestInfo?

`test.info().project.name` returns the name of the Playwright project running
the current test — typically the browser name (`'chromium'`, `'firefox'`,
`'webkit'`) or a custom name like `'staging'` or `'mobile'`.

```typescript
// Conditional skip — skip only on a specific browser
test('PDF export generates file @regression', async ({ page }) => {
  test.skip(
    test.info().project.name === 'webkit',
    'PDF export uses Chrome print API — not supported on Safari'
  );

  await page.getByRole('button', { name: 'Export PDF' }).click();
  await expect(page.getByText('PDF Generated')).toBeVisible();
});

// Conditional assertion — different expected URLs per environment
test('redirects to correct environment', async ({ page }) => {
  await page.getByRole('link', { name: 'Home' }).click();

  const projectName = test.info().project.name;
  if (projectName === 'staging') {
    await expect(page).toHaveURL(/staging\.example\.com/);
  } else {
    await expect(page).toHaveURL(/demo\.example\.com/);
  }
});
```

In `beforeEach`, `project.name` lets you apply browser-specific setup without
duplicating tests:

```typescript
test.beforeEach(async ({ page }) => {
  if (test.info().project.name === 'webkit') {
    await page.waitForTimeout(300); // Safari needs extra render time
  }
  await page.goto('/dashboard');
});
```

---

## Q308.6 — What is outputPath() and when should you use it?

`test.info().outputPath(filename)` builds a file path inside the test's
dedicated output directory. Playwright creates this directory automatically
and names it based on the test title and project — guaranteeing uniqueness
across parallel runs.

```typescript
test('generate and verify CSV export', async ({ page }) => {
  const info = test.info();

  // Safe, unique path — no collision with other tests running in parallel
  const logPath = info.outputPath('export-debug.log');
  // → 'test-results/employees-csv-export-chromium/export-debug.log'

  await fs.writeFile(logPath, `Export started: ${new Date().toISOString()}\n`);

  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await page.waitForEvent('download');
  await download.saveAs(info.outputPath('employees.csv'));

  await fs.appendFile(logPath, `Export complete: ${download.suggestedFilename()}\n`);
});
```

**Why use `outputPath()` instead of a hardcoded path:**
- The directory already exists — Playwright creates it before the test runs
- The path is unique per test and per project — no collision in parallel runs
- The directory is cleaned between runs — no stale files from previous runs

---

## Q308.7 — How does attach() work and what content types does it support?

`test.info().attach(name, options)` adds files or data directly to the test's
entry in the HTML report. Attachments are visible when you click on a test
result in the report.

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();

  if (info.status !== info.expectedStatus) {
    // Attach a screenshot — renders as inline image in the report
    await info.attach('page-screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    // Attach the current URL as plain text
    await info.attach('page-url', {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });

    // Attach an API response body
    await info.attach('api-response', {
      body: JSON.stringify({ status: 'error', code: 500 }),
      contentType: 'application/json',
    });

    // Attach a file already saved to disk
    await info.attach('test-log', {
      path: info.outputPath('test.log'),
      contentType: 'text/plain',
    });
  }
});
```

Content types that render specially in the HTML report:
- `'image/png'` / `'image/jpeg'` — inline image preview
- `'video/webm'` — embedded video player (for recorded videos)
- `'text/plain'` / `'application/json'` — displayed as text

---

## Q308.8 — How do you read and write annotations at runtime via TestInfo?

`test.info().annotations` is a mutable array. You can read existing
annotations declared in the test details object, and push new ones at runtime:

```typescript
test(
  'verify payroll calculation',
  {
    annotation: [
      { type: 'issue', description: 'https://jira.example.com/PAY-42' },
      { type: 'owner', description: 'payroll-team' },
    ],
  },
  async ({ page }) => {
    const info = test.info();

    // Read annotations declared at definition time
    console.log(info.annotations);
    // [{ type: 'issue', description: '...' }, { type: 'owner', description: '...' }]

    // Push a runtime annotation based on what happens in the test
    const jobId = await page.getByTestId('job-id').textContent();
    info.annotations.push({
      type: 'processed-job',
      description: `Job ID: ${jobId}`,
    });
    // Now appears in HTML report, JSON output, and JUnit XML
  }
);
```

Runtime annotations are useful for recording dynamic context — which record
was processed, which environment variable was active, which feature flag was
set — making the report self-explanatory without opening the test file.

---

## Q308.9 — How do you change the test timeout at runtime using TestInfo?

`test.info().setTimeout(ms)` or the shorthand `test.setTimeout(ms)` overrides
the timeout from inside the running test:

```typescript
test('slow batch report generation @regression', async ({ page }) => {
  // Extend timeout mid-test based on runtime conditions
  test.setTimeout(120_000); // 2 minutes for this test only

  await page.getByRole('button', { name: 'Generate Annual Report' }).click();
  await expect(page.getByTestId('download-ready')).toBeVisible({ timeout: 90_000 });
});
```

**When to use runtime `setTimeout`:** when you cannot know how long a test
will take at declaration time — for example, when a feature flag changes the
processing path, or when the test environment is under unexpected load.

**Prefer the details object when you know upfront:**
```typescript
test('bulk import', { timeout: 120_000 }, async ({ page }) => { ... });
```

`test.setTimeout(0)` removes the timeout entirely — useful for debugging
a specific test interactively, never for production test runs.

---

## Q308.10 — What is the titlePath property and when is it useful?

`titlePath` is an array of strings containing the full describe hierarchy
plus the test title. It is the array form of the full test title.

```typescript
test.describe('Checkout', () => {
  test.describe('Payment', () => {
    test('credit card completes purchase @smoke', async () => {
      const info = test.info();

      console.log(info.title);
      // 'credit card completes purchase @smoke'

      console.log(info.titlePath);
      // ['Checkout', 'Payment', 'credit card completes purchase @smoke']

      console.log(info.titlePath.join(' > '));
      // 'Checkout > Payment > credit card completes purchase @smoke'
    });
  });
});
```

`titlePath` is useful when building file names for screenshots or logs that
reflect the full test hierarchy — making it easy to find which spec file and
describe group a file belongs to:

```typescript
test.afterEach(async ({ page }) => {
  if (test.info().status !== test.info().expectedStatus) {
    // Slug the titlePath into a safe file name
    const safeTitle = test.info().titlePath
      .join('__')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .toLowerCase();

    await page.screenshot({
      path: `screenshots/${safeTitle}.png`
    });
  }
});
```

---

## Q308.11 — How do you use TestInfo to build a custom console logger in beforeEach and afterEach?

```typescript
test.beforeEach(async () => {
  const { title, project, retry } = test.info();
  const retryLabel = retry > 0 ? ` [retry ${retry}]` : '';
  console.log(`\n▶  [${project.name}] ${title}${retryLabel}`);
});

test.afterEach(async ({ page }) => {
  const { title, project, status, expectedStatus, duration, retry } = test.info();

  const healthy = status === expectedStatus;
  const flaky   = retry > 0 && status === 'passed';

  const icon = healthy ? (flaky ? '⚠️' : '✅') : '❌';
  const label = flaky ? ' (FLAKY)' : '';
  console.log(`${icon}  [${project.name}] ${title} — ${duration}ms${label}`);

  if (!healthy) {
    await test.info().attach('screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  }
});
```

Terminal output:
```
▶  [chromium] valid credentials redirect to dashboard
✅  [chromium] valid credentials redirect to dashboard — 1340ms

▶  [firefox] employee search returns results
❌  [firefox] employee search returns results — 30002ms

▶  [firefox] employee search returns results [retry 1]
✅  [firefox] employee search returns results — 2100ms (FLAKY)
```

This log tells you at a glance: the search test timed out on Firefox on the
first run but passed on retry — a flaky test worth investigating.

---

## Q308.12 — What is the difference between test.info() and the testInfo parameter?

Both give access to the same `TestInfo` object. The difference is how you
access it:

**`test.info()` function call** — available from anywhere inside a test
body, hook, or step. No declaration needed. Works inside page objects and
helper functions too.

**`testInfo` parameter** — the second argument to the test function. Only
accessible in the test body itself. Must be declared explicitly.

```typescript
// Via parameter — only works directly in test()
test('uses testInfo param', async ({ page }, testInfo) => {
  console.log(testInfo.title);        // same object
  console.log(testInfo.project.name); // same object
});

// Via test.info() — works anywhere, including page objects and helpers
test('uses test.info()', async ({ page }) => {
  const info = test.info();
  console.log(info.title); // same object
  await someHelperFunction(); // helper can call test.info() internally
});

// Page object can call test.info() — parameter form cannot reach here
class LoginPage {
  async login(username: string, password: string) {
    const retry = test.info().retry;
    if (retry > 0) {
      await this.page.reload(); // clear state on retry
    }
    // ...
  }
}
```

**In practice:** use `test.info()` — it is more flexible and works in any
context. The `testInfo` parameter is an older pattern that predates the
function form.

---

## Q308.13 — What properties of TestInfo are most commonly asked about in interviews?

The five properties that appear most in interview questions are:

**1. `status` vs `expectedStatus`** — understanding this pair correctly is
the mark of a candidate who has used `test.fail()` in a real project.

**2. `retry`** — distinguishing flaky from broken tests, and adapting
behaviour on retries.

**3. `project.name`** — conditional skips and assertions per browser or
environment.

**4. `attach()`** — the mechanism for putting screenshots and logs into the
HTML report for CI debugging.

**5. `workerIndex`** — worker-safe resource isolation for parallel execution.

```typescript
// A single afterEach that demonstrates all five:
test.afterEach(async ({ page }) => {
  const info = test.info();

  // 1. status vs expectedStatus
  const failed = info.status !== info.expectedStatus;

  // 2. retry — detect flakiness
  const flaky = info.retry > 0 && info.status === 'passed';

  // 3. project.name — log which browser
  console.log(`[${info.project.name}] ${info.title}: ${info.status}`);

  // 4. attach() — screenshot on failure
  if (failed) {
    await info.attach('screenshot', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  }

  // 5. workerIndex — visible in logs for parallel debugging
  if (failed || flaky) {
    console.log(`Worker ${info.workerIndex}, retry ${info.retry}`);
  }
});
```

---

## Q308.14 — How do you use TestInfo to make tests adaptive on retry?

Reading `test.info().retry` inside a test lets you change strategy on repeated
attempts — clearing cached state, using a slower approach, or logging
diagnostic information:

```typescript
test('checkout completes successfully @smoke', async ({ page }) => {
  const retry = test.info().retry;

  if (retry > 0) {
    // On retry — add a fresh session to avoid any stale state from first run
    console.log(`Retry ${retry}: clearing cookies before attempt`);
    await page.context().clearCookies();
    await page.context().clearPermissions();
    await page.reload();
  }

  await page.goto('/cart');
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByLabel('Card Number').fill('4242424242424242');
  await page.getByLabel('Expiry').fill('12/28');
  await page.getByLabel('CVC').fill('123');
  await page.getByRole('button', { name: 'Pay' }).click();
  await expect(page.getByTestId('order-confirmation')).toBeVisible();
});
```

This pattern is useful for tests that occasionally fail due to session
timeout, network blips, or third-party widget load failures — conditions
where a clean retry has a good chance of success.

---

## Q308.15 — How do you use the duration property for performance monitoring?

`test.info().duration` (in milliseconds) is available after a test completes.
Read it in `afterEach` to detect tests that are approaching their timeout
or degrading over time:

```typescript
test.afterEach(async () => {
  const { title, duration, project } = test.info();

  // Log every test duration for baseline tracking
  console.log(`PERF [${project.name}] ${title}: ${duration}ms`);

  // Alert on tests that are approaching the default 30s timeout
  if (duration > 25_000) {
    console.warn(`⚠️ SLOW TEST (${duration}ms): "${title}" — consider test.slow()`);
    test.info().annotations.push({
      type: 'performance-warning',
      description: `Test took ${duration}ms — review for timeout risk`,
    });
  }
});
```

In CI pipelines, this log output can be parsed to build a performance
dashboard — tracking test duration trends over time and catching regressions
before they become timeouts.

---

## Q308.16 — Describe a real debugging scenario where TestInfo directly helped you.

In our project, we had a test — "employee search returns results" — that
failed intermittently in CI, always on Firefox, and only on the second daily
run. The error was "Timeout exceeded" with no additional context.

Without TestInfo, our diagnostic information was: a timeout on Firefox. That
was it.

After adding a comprehensive `afterEach`:

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();
  const failed = info.status !== info.expectedStatus;

  console.log([
    `[${info.project.name}]`,
    `retry=${info.retry}`,
    `worker=${info.workerIndex}`,
    `duration=${info.duration}ms`,
    info.title,
  ].join(' | '));

  if (failed) {
    await info.attach('screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await info.attach('url', {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });
    info.annotations.push({ type: 'failure-url', description: page.url() });
  }
});
```

The next failure showed: `worker=2 | retry=0 | duration=30002ms | url=/employees`.
The screenshot showed the search results loading spinner still visible. The
URL showed the test was on the right page. Duration was exactly the timeout
limit — a true timeout, not an error.

Combined with `retry` data showing the test passed on worker 0 and 1 but
timed out on worker 2, we identified that worker 2 was loading a heavier
dataset in its `beforeAll`. We fixed it by reducing the seed data, and the
flakiness disappeared.

Without the `duration`, `workerIndex`, `retry`, and `attach()` capabilities
of TestInfo, we would have spent days debugging what took us two hours.

---

## Q308.17 — What is the TestInfo errors property?

`test.info().errors` is an array of errors that caused the test to fail.
Normally it has zero or one entries, but it can have multiple if both the
test body and `afterEach` threw errors.

```typescript
test.afterEach(async () => {
  const errors = test.info().errors;

  if (errors.length > 1) {
    // Both the test and afterEach failed — rare but important to catch
    console.error(`Multiple errors in "${test.info().title}":`);
    errors.forEach((err, i) => {
      console.error(`  Error ${i + 1}: ${err.message}`);
    });
  }
});
```

More commonly used in custom reporters, which iterate over `errors` to
extract failure messages, stack traces, and locations for reporting to
external systems.

---

## Q308.18 — Write a complete afterEach that uses six TestInfo properties together.

```typescript
import { test } from '@playwright/test';
import fs from 'fs/promises';

test.afterEach(async ({ page }) => {
  const info = test.info();

  const failed  = info.status !== info.expectedStatus;  // 1. status/expectedStatus
  const flaky   = info.retry > 0 && !failed;            // 2. retry
  const browser = info.project.name;                    // 3. project.name
  const worker  = info.workerIndex;                     // 4. workerIndex

  // Always log
  const icon = failed ? '❌' : flaky ? '⚠️' : '✅';
  console.log(
    `${icon} [${browser}] [w${worker}] ${info.title} — ${info.duration}ms` // 5. duration
    + (info.retry > 0 ? ` [retry ${info.retry}]` : '')
  );

  if (failed) {
    // 6. attach() — screenshot and URL in the report
    await info.attach('failure-screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await info.attach('failure-url', {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });

    // Runtime annotation for the report
    info.annotations.push({
      type: 'failure-url',
      description: page.url(),
    });
  }

  if (flaky) {
    info.annotations.push({
      type: 'flaky',
      description: `Passed on retry ${info.retry} — browser: ${browser}, worker: ${worker}`,
    });
  }
});
```

This `afterEach` is production-ready. It logs every result, captures failure
evidence with both a screenshot and URL, annotates flaky tests for the report,
and includes browser and worker context for parallel debugging.

---

## Chapter Summary

- `test.info()` is a function call available anywhere in tests, hooks, and steps. It returns the live `TestInfo` for the current test.
- `status !== expectedStatus` is the correct failure check — handles `test.fail()` tests correctly. Never use `status === 'failed'` alone.
- `retry` is 0 on first run. Use it to detect flaky tests in `afterEach` and to adapt behaviour on retries.
- `workerIndex` is unique per worker — essential for worker-isolated file paths and database resources in parallel execution.
- `project.name` gives the browser or environment name — use for conditional skips and environment-specific assertions.
- `duration` is the test duration in ms — available after the test ends. Use in `afterEach` for performance monitoring.
- `outputPath(filename)` returns a collision-safe, unique path inside the test's dedicated output directory.
- `attach()` adds screenshots, logs, and files directly to the test's HTML report entry.
- `annotations` is a mutable array — push new entries at runtime; they appear in HTML reports, JSON, and JUnit XML.
- `setTimeout(ms)` overrides the timeout from inside the test — use when you cannot know duration at declaration time.
