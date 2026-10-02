# 05 — TestInfo

## The Scenario

Your test suite has been running in CI for two weeks. You start noticing a pattern: one specific test — "employee search returns results" — fails about once every 10 runs. Not always. Not consistently. Just occasionally. And it only fails on Firefox. And only on the second CI run of the day. And the error message just says "Timeout exceeded" — no screenshot, no URL, no indication of where in the test it got stuck.

You need answers to questions like:
- Which browser was running when this failed?
- Was this the first run or a retry?
- Which worker was handling this test?
- What was the page URL at the moment of failure?
- How long did the test take?

None of this information is in the test body itself. It lives in the test runner — in the runtime context that Playwright maintains for every test as it runs. You access that context through `test.info()`.

---

## What TestInfo Is

`TestInfo` is an object that Playwright creates for every test as it runs. It holds all the runtime metadata about that test — its title, its file, its project, its retry number, its status, its output directory, its attached files, its annotations, and more.

You access it by calling `test.info()` from anywhere inside a test body, a hook, or a step:

```typescript
test('example', async ({ page }) => {
  const info = test.info();
  console.log(info.title);         // 'example'
  console.log(info.project.name);  // 'chromium'
  console.log(info.retry);         // 0 on first run, 1 on first retry
});
```

`test.info()` is not a fixture — you do not declare it as a parameter. It is a function you call, and it returns the live `TestInfo` object for the currently running test.

---

## The Most Useful Properties

### title and titlePath

`title` is the test's own title — just the string you passed to `test()`.

`titlePath` is the full hierarchy from the outermost describe down to the test title — an array of strings.

```typescript
test.describe('Employee Module', () => {
  test.describe('Add Employee', () => {
    test('saves with required fields @smoke', async ({ page }) => {
      const info = test.info();

      console.log(info.title);
      // 'saves with required fields @smoke'

      console.log(info.titlePath);
      // ['Employee Module', 'Add Employee', 'saves with required fields @smoke']

      console.log(info.titlePath.join(' > '));
      // 'Employee Module > Add Employee > saves with required fields @smoke'
    });
  });
});
```

`titlePath` is useful when you want to build a unique file name for a screenshot or log file that reflects the full test hierarchy.

---

### file, line, column

Where the test is defined in the codebase:

```typescript
test('saves with required fields', async ({ page }) => {
  const info = test.info();

  console.log(info.file);    // '/home/user/project/tests/pim/add-employee.spec.ts'
  console.log(info.line);    // 14  (line number of the test() call)
  console.log(info.column);  // 0
});
```

Useful when you are building a custom reporter or logging system and you want to link each log entry back to its source location.

---

### status and expectedStatus

`status` is what actually happened. `expectedStatus` is what Playwright expected to happen.

```typescript
type TestStatus = 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted'
type ExpectedStatus = 'passed' | 'failed' | 'skipped'
```

```typescript
test.afterEach(async () => {
  const info = test.info();
  console.log(`Status: ${info.status}`);           // what happened
  console.log(`Expected: ${info.expectedStatus}`); // what was expected
});
```

The relationship between them is the core of how `test.fail()` works:

| Scenario | `expectedStatus` | `status` | Healthy? |
|---|---|---|---|
| Normal test passes | `'passed'` | `'passed'` | ✅ Yes |
| Normal test fails | `'passed'` | `'failed'` | ❌ No |
| `test.fail()` test fails | `'failed'` | `'failed'` | ✅ Yes |
| `test.fail()` test passes | `'failed'` | `'passed'` | ⚠️ Unexpected pass |
| `test.skip()` test | `'skipped'` | `'skipped'` | ✅ Yes |

**The most useful pattern** — take action when something unexpected happened:

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();

  if (info.status !== info.expectedStatus) {
    // Unexpected outcome — capture evidence
    const screenshot = await page.screenshot({ fullPage: true });
    await info.attach('failure-screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });
    await info.attach('failure-url', {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });
  }
});
```

---

### retry

`retry` tells you how many times this test has already failed and been retried. On the first run it is `0`. On the first retry it is `1`. On the second retry it is `2`.

```typescript
test('employee search returns results @smoke', async ({ page }) => {
  const retry = test.info().retry;

  if (retry > 0) {
    console.log(`This is retry attempt ${retry} — clearing state before trying again`);
    // On a retry, you might want to clear cookies, reload, or take a different approach
    await page.context().clearCookies();
    await page.reload();
  }

  await page.goto('/web/index.php/pim/viewEmployeeList');
  await page.getByPlaceholder('Type for hints...').fill('Linda');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText('Linda Anderson')).toBeVisible();
});
```

**In afterEach — logging retry information:**

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();
  const retry = info.retry;
  const status = info.status;

  if (retry > 0 && status === 'passed') {
    // The test was flaky — it failed at least once but eventually passed
    console.warn(`⚠️ FLAKY TEST: "${info.title}" passed on retry ${retry}`);
    // You might want to log this to a flakiness dashboard
  }

  if (retry > 0 && status === 'failed') {
    // Still failing after retries — definitely a real problem
    console.error(`❌ PERSISTENT FAILURE: "${info.title}" still failing on retry ${retry}`);
  }
});
```

This is how you distinguish a genuinely broken test from a flaky one in your logging.

---

### workerIndex and parallelIndex

`workerIndex` identifies which parallel worker process is running this test. Workers are numbered starting from 0.

`parallelIndex` is similar but scoped to the current parallel test group.

```typescript
test('check which worker', async ({ page }) => {
  const info = test.info();
  console.log(`Worker: ${info.workerIndex}`);     // 0, 1, 2, 3...
  console.log(`Parallel index: ${info.parallelIndex}`);
});
```

**The practical use case — worker-isolated resources:**

When tests run in parallel, each worker needs its own isolated resources. If your tests write to files or databases, you need each worker to write to its own location. `workerIndex` gives you a unique number per worker.

```typescript
test.beforeAll(async () => {
  const workerIndex = test.info().workerIndex;

  // Each worker gets its own temporary directory — no collision
  const workerTempDir = `./temp/worker-${workerIndex}`;
  await fs.mkdir(workerTempDir, { recursive: true });

  // Each worker gets its own database user — no shared state
  const dbUser = `test_user_${workerIndex}`;
  await setupDatabaseUser(dbUser);
});
```

Without `workerIndex`, parallel workers writing to the same file or same database table would overwrite each other's data, causing intermittent failures that are very hard to diagnose.

---

### project

`project` gives you the full project configuration that this test is running under — including the project name, the `use` options, and everything else defined in your `playwright.config.ts` projects array.

```typescript
test('check project config', async ({ page }) => {
  const info = test.info();

  console.log(info.project.name);         // 'chromium', 'firefox', 'webkit', 'staging'
  console.log(info.project.use.baseURL);  // 'https://staging.example.com'
  console.log(info.project.retries);      // retry count for this project
});
```

**The most common use — conditional behaviour based on browser or environment:**

```typescript
test('date picker works correctly @regression', async ({ page }) => {
  // Skip on Safari — known issue with the date picker component
  test.skip(
    test.info().project.name === 'webkit',
    'Date picker broken on Safari — ticket #PW-102'
  );

  await page.getByLabel('From Date').click();
  await page.getByRole('button', { name: '15' }).click();
  await expect(page.getByLabel('From Date')).toHaveValue('2026-03-15');
});
```

```typescript
test('uses correct base URL', async ({ page }) => {
  const projectName = test.info().project.name;

  if (projectName === 'staging') {
    await expect(page).toHaveURL(/staging\.orangehrm/);
  } else {
    await expect(page).toHaveURL(/demo\.orangehrmlive/);
  }
});
```

---

### duration

The time in milliseconds that the test took to complete. Only meaningful after the test has finished — read it in `afterEach` or `afterAll`.

```typescript
test.afterEach(async () => {
  const info = test.info();
  const duration = info.duration;

  if (duration > 30_000) {
    console.warn(`⚠️ SLOW TEST: "${info.title}" took ${duration}ms`);
    // Alert about tests approaching the timeout threshold
  }

  console.log(`[${info.status.toUpperCase()}] ${info.title} — ${duration}ms`);
});
```

Use `duration` to build performance baselines for your test suite. If a test suddenly takes twice as long as usual, it might indicate a performance regression in the application.

---

### outputDir and outputPath()

Every test gets its own dedicated output directory inside the configured `outputDir` (default: `test-results/`). Playwright names this directory based on the test title and project.

`outputDir` gives you the full path to this directory. `outputPath()` builds a file path inside that directory.

```typescript
test('generate and verify report', async ({ page }) => {
  const info = test.info();

  // Save a debug log to this test's output directory
  const logPath = info.outputPath('debug.log');
  // → 'test-results/login-valid-credentials-chromium/debug.log'

  await fs.writeFile(logPath, `Test started at: ${new Date().toISOString()}\n`);

  // ... test logic ...

  await fs.appendFile(logPath, `Test ended at: ${new Date().toISOString()}\n`);
});
```

`outputPath()` is safer than constructing paths manually because it guarantees:
- The directory exists (Playwright creates it)
- The path is unique per test (no collisions between parallel tests)
- The path is cleaned up between runs

---

### snapshotDir and snapshotSuffix

Used for visual snapshot testing (screenshot comparisons). `snapshotDir` is where Playwright stores the baseline screenshots. `snapshotSuffix` is a suffix added to snapshot names based on the OS or platform — ensuring Mac snapshots and Linux snapshots are stored separately (they look different due to font rendering).

```typescript
test('dashboard matches visual snapshot @regression', async ({ page }) => {
  await page.goto('/dashboard');
  const info = test.info();
  console.log(`Snapshot directory: ${info.snapshotDir}`);
  console.log(`Snapshot suffix: ${info.snapshotSuffix}`); // e.g., '-linux'

  await expect(page).toHaveScreenshot('dashboard.png');
  // Playwright uses snapshotDir and snapshotSuffix automatically
});
```

---

### annotations

`annotations` is an array of `{ type: string, description: string }` objects attached to the test. You can read existing annotations and push new ones at runtime.

Annotations declared in the test details object:
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
    console.log(info.annotations);
    // [
    //   { type: 'issue', description: 'https://jira.example.com/PAY-42' },
    //   { type: 'owner', description: 'payroll-team' }
    // ]
  }
);
```

Adding annotations dynamically during the test:

```typescript
test('employee export generates file @regression', async ({ page }) => {
  const info = test.info();

  // Add a runtime annotation based on what happens in the test
  const exportedFile = await page.waitForEvent('download');
  info.annotations.push({
    type: 'exported-file',
    description: exportedFile.suggestedFilename(),
  });

  // The annotation now appears in the HTML report
  // Useful for attaching evidence or context to the test result
});
```

Annotations appear in the HTML report next to the test. They also appear in JSON and JUnit XML output — useful for integration with issue trackers or dashboards that parse test results.

---

### attach() — Attaching Files to the Report

`attach()` adds files or data directly to the test's entry in the HTML report. Attachments are visible when you click on a test in the report — screenshots, logs, downloaded files, API responses.

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();

  if (info.status !== info.expectedStatus) {

    // Attach a screenshot
    await info.attach('page-screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    // Attach the current URL as text
    await info.attach('page-url', {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });

    // Attach a log file that was written during the test
    await info.attach('test-log', {
      path: info.outputPath('test.log'),
      contentType: 'text/plain',
    });
  }
});
```

`attach()` signature:
```typescript
// Attach raw data (Buffer or string)
info.attach(name: string, options: { body: Buffer | string, contentType: string }): Promise<void>

// Attach a file from disk
info.attach(name: string, options: { path: string, contentType?: string }): Promise<void>
```

The `contentType` matters:
- `'image/png'` — shows as an inline image in the report
- `'text/plain'` — shows as text
- `'application/json'` — shows as text (JSON content)
- `'video/webm'` — shows as an embedded video player

---

### setTimeout() — Overriding Timeout at Runtime

You can change the test timeout from inside the test body using `test.info().setTimeout()` — or more commonly the shorthand `test.setTimeout()`:

```typescript
test('slow report generation @regression', async ({ page }) => {
  // Discovered mid-test that this environment is slow — extend the timeout
  test.info().setTimeout(90_000);
  // or equivalently:
  test.setTimeout(90_000);

  await page.getByRole('button', { name: 'Generate Annual Report' }).click();
  await expect(page.getByText('Report Ready')).toBeVisible({ timeout: 60_000 });
});
```

When to use this: when you cannot know at declaration time how long the test will take, but you can determine it mid-test based on runtime conditions (e.g., the environment is under load, a feature flag changed the processing path).

---

## Reading TestInfo in Hooks

`test.info()` is available in all four hooks — `beforeEach`, `afterEach`, `beforeAll`, `afterAll`. In `beforeEach` and `afterEach`, it reflects the current test. In `beforeAll` and `afterAll`, it reflects the suite context.

```typescript
test.beforeEach(async ({ page }) => {
  const info = test.info();
  console.log(`\n▶ Starting: "${info.title}"`);
  console.log(`  Browser: ${info.project.name}`);
  console.log(`  Retry:   ${info.retry}`);
});

test.afterEach(async ({ page }) => {
  const info = test.info();
  const icon = info.status === info.expectedStatus ? '✅' : '❌';
  console.log(`${icon} Finished: "${info.title}" — ${info.duration}ms`);
});
```

Terminal output:
```
▶ Starting: "valid credentials redirect to dashboard"
  Browser: chromium
  Retry:   0
✅ Finished: "valid credentials redirect to dashboard" — 1340ms

▶ Starting: "employee search returns results"
  Browser: firefox
  Retry:   0
❌ Finished: "employee search returns results" — 30002ms

▶ Starting: "employee search returns results"
  Browser: firefox
  Retry:   1
✅ Finished: "employee search returns results" — 2100ms
```

Now you know: the search test timed out on Firefox on the first run but passed on the retry. That is a flaky test — likely a timing issue specific to Firefox, worth investigating with `test.slow()` or an explicit wait.

---

## A Practical afterEach Using Multiple TestInfo Properties

Bringing it all together — a comprehensive `afterEach` that uses `TestInfo` to produce useful diagnostic output for every test:

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();
  const failed = info.status !== info.expectedStatus;
  const flaky = info.retry > 0 && info.status === 'passed';

  // Always log the result
  const icon = failed ? '❌' : flaky ? '⚠️' : '✅';
  const retryLabel = info.retry > 0 ? ` [retry ${info.retry}]` : '';
  console.log(`${icon} [${info.project.name}] ${info.title} — ${info.duration}ms${retryLabel}`);

  if (failed) {
    // Capture the page state at the moment of failure
    await info.attach('screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    await info.attach('url', {
      body: Buffer.from(page.url()),
      contentType: 'text/plain',
    });

    // Add a runtime annotation with the failure URL — visible in report
    info.annotations.push({
      type: 'failure-url',
      description: page.url(),
    });
  }

  if (flaky) {
    // Log flaky test for the team to investigate
    info.annotations.push({
      type: 'flaky',
      description: `Passed on retry ${info.retry} — investigate intermittent failure`,
    });
  }
});
```

---

## TestInfo Properties — Full Reference

| Property | Type | When Useful |
|---|---|---|
| `title` | `string` | Test's own title |
| `titlePath` | `string[]` | Full hierarchy: describe + test title |
| `file` | `string` | Absolute path to the spec file |
| `line` | `number` | Line number of `test()` call |
| `column` | `number` | Column number of `test()` call |
| `status` | `string` | What actually happened |
| `expectedStatus` | `string` | What was expected to happen |
| `duration` | `number` | Test duration in ms (after test ends) |
| `retry` | `number` | Retry attempt: 0 = first run |
| `workerIndex` | `number` | Which worker is running this |
| `parallelIndex` | `number` | Position in parallel execution |
| `project` | `object` | Full project config: `.name`, `.use`, `.retries` |
| `config` | `object` | Full Playwright config |
| `annotations` | `array` | `{ type, description }` metadata |
| `attachments` | `array` | Files attached via `attach()` |
| `errors` | `array` | Errors that caused failure |
| `outputDir` | `string` | This test's dedicated output directory |
| `snapshotDir` | `string` | Snapshot baseline directory |
| `snapshotSuffix` | `string` | Platform suffix for snapshot names |

---

## Key Points

- `test.info()` is a function call, not a fixture — call it from anywhere inside a test, hook, or step
- `status` vs `expectedStatus` — a test is healthy when they match; the foundation of `test.fail()`
- `retry` — 0 on first run, increments on each retry; use to adjust behaviour on retries or detect flaky tests
- `workerIndex` — unique per worker process; use for worker-isolated resources in parallel execution
- `project.name` — which project (browser/environment) is running; use for conditional skips and assertions
- `duration` — only meaningful after the test ends; read in `afterEach`; useful for performance baselines
- `outputPath()` — builds a unique, collision-safe file path inside the test's output directory
- `annotations` — read them or push new ones at runtime; appear in HTML report, JSON, and JUnit XML
- `attach()` — adds screenshots, logs, and files directly to the test's HTML report entry
- `setTimeout()` — change timeout at runtime when you cannot know duration at declaration time
- Available in all hooks — `beforeEach`, `afterEach`, `beforeAll`, `afterAll`
