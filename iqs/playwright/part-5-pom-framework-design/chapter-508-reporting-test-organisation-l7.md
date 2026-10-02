# Chapter 508 — Reporting & Test Organisation (L7)

This chapter covers test tagging, targeted runs, failure capture configuration,
runtime annotations, and custom reporter implementation. Interviewers ask about
reporting to assess whether candidates understand the difference between a test
suite that runs and one that communicates — the ability to explain a three-tag
strategy, describe the `testInfo` annotation pattern, and write a custom
`Reporter` implementation are senior-level differentiators.

---

## Q508.1 — What problem does Level 7 solve?

After six levels the suite has real depth — but its results do not communicate.
A CI run produces:

```
53 passed, 4 failed (2m 14s)
```

Four tests failed. Which module? How critical? New regression or known flakiness?
The developer stares at a wall of terminal output. The QA lead asks for a status
update and gets a screenshot of the terminal.

Level 7 fixes this in four ways: tags enable targeted runs; `screenshot`, `video`,
and `trace` capture failure context automatically; `testInfo.annotations` attach
runtime data to each test result; a custom `SummaryReporter` groups the output
by module and severity.

---

## Q508.2 — What is the three-dimension tagging strategy?

Every test carries exactly three tags — one per dimension:

**Module** — which application area:
```
@login  @pim  @admin  @leave
```

**Type** — what kind of run:
```
@smoke       core happy paths, ~2 min, gates every deploy
@regression  full coverage + edge cases, runs nightly
@sanity      quick post-release check
```

**Severity** — how critical:
```
@critical  broken application for all users
@high      primary workflow blocked
@medium    important feature degraded
@low       inconvenience, workaround exists
```

Tagging syntax on a test:
```typescript
test('admin can add a new employee',
  { tag: ['@pim', '@smoke', '@critical'] },
  async ({ addEmployeePage }, testInfo) => {
    // ...
  }
);
```

The rule: every test gets exactly one module tag, one type tag, one severity tag.
No test is untagged. No test has two module tags or two severity tags. This
discipline is what makes `--grep` filtering reliable.

---

## Q508.3 — How does --grep enable targeted runs?

`--grep` accepts a regex and runs only tests whose title or tags match:

```bash
# By module
npx playwright test --grep @pim
npx playwright test --grep @admin

# By type
npx playwright test --grep @smoke       # fast gate before deploy
npx playwright test --grep @regression  # full suite, run nightly

# By severity
npx playwright test --grep @critical
npx playwright test --grep "@critical|@high"

# Combine — smoke tests in PIM only
npx playwright test --grep "(?=.*@smoke)(?=.*@pim)"

# Combine — critical tests across admin and leave
npx playwright test --grep "(?=.*@critical)(?=.*(@admin|@leave))"

# Exclude — skip leave when leave module has a known env issue
npx playwright test --grep-invert @leave

# Everything except low severity
npx playwright test --grep-invert @low
```

The lookahead `(?=.*@smoke)(?=.*@pim)` matches tests that contain both
`@smoke` AND `@pim` — not OR. This is how you run the intersection of
two tag dimensions.

---

## Q508.4 — How do you configure screenshot, video, and trace on failure?

Three lines in the `use` block of `playwright.config.ts`:

```typescript
use: {
  screenshot: 'only-on-failure',    // PNG captured at the moment of failure
  video:      'retain-on-failure',  // full session recording, kept only on failure
  trace:      'on-first-retry',     // step-by-step replay, recorded on first retry
}
```

**`screenshot: 'only-on-failure'`** — captures the page at the exact moment
the test throws. Attached to the HTML report under the failing test. Shows
exactly what the user would have seen.

**`video: 'retain-on-failure'`** — records the full browser session from
start to failure. Retained if the test fails, discarded if it passes. Invaluable
for failures that only occur in CI where the browser is headless.

**`trace: 'on-first-retry'`** — records every action, every network request,
every DOM snapshot. Records only on the first retry so stable tests have zero
overhead. Open the trace with `npx playwright show-trace trace.zip` for a
step-by-step timeline replay.

Other trace options:
```typescript
trace: 'off'               // never — fastest, no debugging info
trace: 'on'                // always — slowest, captures everything
trace: 'retain-on-failure' // always record, delete if test passes
```

`on-first-retry` is the recommended balance: zero overhead for stable tests,
full replay when a test first becomes flaky.

---

## Q508.5 — What are test annotations and how do they help with debugging?

`testInfo.annotations` lets you attach key-value metadata to a test at
runtime — after generated data has been created:

```typescript
test('admin can approve leave request',
  { tag: ['@leave', '@smoke', '@critical'] },
  async ({ leaveListPage }, testInfo) => {

    // Attach the IDs that were created for this test run
    testInfo.annotations.push({ type: 'empNumber', description: empNumber });
    testInfo.annotations.push({ type: 'leaveId',   description: String(leaveId) });

    await leaveListPage.approveLeaveRequest(employee.fullName);
    await leaveListPage.assertLeaveApproved();
  }
);
```

Without annotations, a failure shows:
```
Error: Expected row "Alice Johnson" to be visible — element not found
```

With annotations, the same failure shows:
```
Error: Expected row "Alice Johnson" to be visible — element not found

Annotations:
  empNumber: EMP-A4KX92PL
  leaveId:   1047
```

The employee number and leave ID are right there. You can query OrangeHRM's
API or database with those exact IDs to reproduce the failure without guessing
which data was involved.

---

## Q508.6 — Why are annotations added inside tests rather than in beforeAll?

`testInfo` belongs to the currently running test — it is not available inside
`beforeAll`. When data is created in `beforeAll` (as at Level 4+), the IDs
are stored in describe-scope variables and then annotated inside each test
that needs them:

```typescript
test.describe('Admin — User Management', () => {

  let empNumber: string;
  let user: ReturnType<typeof generateUser>;

  test.beforeAll(async ({ employeeApi }) => {
    const employee = generateEmployee();
    empNumber = await employeeApi.create(employee);  // ID created here
    user      = generateUser(employee);
  });

  // testInfo is available here — annotation happens at test time
  test('admin can add user', async ({ addUserPage }, testInfo) => {
    testInfo.annotations.push({ type: 'empNumber', description: empNumber });
    testInfo.annotations.push({ type: 'username',  description: user.username });

    await addUserPage.addUser(user);
    await addUserPage.assertUserSavedSuccessfully();
  });

});
```

The pattern: create data in `beforeAll`, annotate in each individual test.
Only tests that could benefit from seeing the data (typically those that
interact with the created entity) need annotations — a negative search test
that uses its own phantom data does not need `empNumber` from `beforeAll`.

---

## Q508.7 — What does the Reporter interface look like and what methods can you implement?

The Playwright `Reporter` interface has several optional lifecycle methods:

```typescript
import { Reporter, TestCase, TestResult, FullResult, Suite } from '@playwright/test/reporter';

class MyReporter implements Reporter {
  // Called once before any tests run
  onBegin(config: FullConfig, suite: Suite): void { }

  // Called when a test starts
  onTestBegin(test: TestCase): void { }

  // Called when a test ends — test.status can be: passed | failed | skipped | timedOut | interrupted
  onTestEnd(test: TestCase, result: TestResult): void { }

  // Called once after all tests complete
  onEnd(result: FullResult): void { }

  // Called for stdout/stderr from tests
  onStdOut(chunk: string, test?: TestCase, result?: TestResult): void { }
  onStdErr(chunk: string, test?: TestCase, result?: TestResult): void { }
}
```

For a summary reporter you only need `onTestEnd` (collect results) and
`onEnd` (print the summary). The other methods are optional — omit them
if you have no use for them.

---

## Q508.8 — What is the complete SummaryReporter implementation?

```typescript
// reporters/SummaryReporter.ts
import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

interface TestRecord {
  title:    string;
  status:   string;
  tags:     string[];
  duration: number;
}

export default class SummaryReporter implements Reporter {

  private results: TestRecord[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    this.results.push({
      title:    test.title,
      status:   result.status,
      tags:     test.tags,
      duration: result.duration,
    });
  }

  onEnd(result: FullResult): void {
    const passed  = this.results.filter(r => r.status === 'passed');
    const failed  = this.results.filter(r => r.status === 'failed');
    const skipped = this.results.filter(r => r.status === 'skipped');
    const flaky   = this.results.filter(r => r.status === 'flaky');
    const totalSec = (this.results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(1);

    console.log('\n' + '─'.repeat(60));
    console.log('  TEST RUN SUMMARY');
    console.log('─'.repeat(60));
    console.log(
      `\n  ✅ Passed:  ${String(passed.length).padEnd(4)}` +
      `❌ Failed:  ${String(failed.length).padEnd(4)}` +
      `⏭  Skipped: ${String(skipped.length).padEnd(4)}` +
      (flaky.length ? `⚠️  Flaky: ${flaky.length}` : '') +
      `\n  ⏱  Duration: ${totalSec}s`
    );

    // Group by module
    console.log('\n  By Module:');
    for (const mod of ['@login', '@pim', '@admin', '@leave']) {
      const modResults = this.results.filter(r => r.tags.includes(mod));
      if (!modResults.length) continue;
      const modPassed = modResults.filter(r => r.status === 'passed').length;
      const modFailed = modResults.filter(r => r.status === 'failed').length;
      const status    = modFailed > 0
        ? `❌  ${modPassed} passed   ${modFailed} failed`
        : `✅  ${modPassed} passed`;
      console.log(`    ${mod.padEnd(10)}  ${status}`);
    }

    // Failed test list with severity
    if (failed.length > 0) {
      console.log('\n  Failed Tests:');
      for (const f of failed) {
        const severity = f.tags.find(t =>
          ['@critical', '@high', '@medium', '@low'].includes(t)
        ) ?? '@unknown';
        console.log(`    ❌ [${severity.replace('@', '')}]  ${f.title}`);
      }
    }

    // Flaky test list
    if (flaky.length > 0) {
      console.log('\n  Flaky Tests (passed on retry):');
      for (const f of flaky) console.log(`    ⚠️  ${f.title}`);
    }

    console.log('\n' + '─'.repeat(60) + '\n');
  }
}
```

Registered in `playwright.config.ts`:
```typescript
reporter: [
  ['list'],
  ['html', { open: 'never' }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['./reporters/SummaryReporter.ts'],
]
```

---

## Q508.9 — What does the SummaryReporter output look like?

```
────────────────────────────────────────────────────────────
  TEST RUN SUMMARY
────────────────────────────────────────────────────────────

  ✅ Passed:  49    ❌ Failed:  3     ⏭  Skipped: 1
  ⏱  Duration: 127.4s

  By Module:
    @login      ✅  4 passed
    @pim        ✅  18 passed
    @admin      ❌  10 passed   2 failed
    @leave      ❌  17 passed   1 failed

  Failed Tests:
    ❌ [critical]  Admin — Add User — employee name autocomplete failed
    ❌ [high]      Admin — Search User — unexpected empty results
    ❌ [high]      Leave — Approve Request — confirmation dialog not found

────────────────────────────────────────────────────────────
```

A QA lead reads this in five seconds. Two admin failures, one leave failure.
Both admin failures are in user management — likely the same root cause.
Investigate there first. The leave failure is in approval, not application —
isolated to the admin workflow.

This is the difference between a result and a communication.

---

## Q508.10 — How does the four-reporter configuration serve different audiences?

```typescript
reporter: [
  ['list'],                                              // developer: real-time terminal
  ['html', { open: 'never', outputFolder: '...' }],     // developer/QA: interactive report
  ['json', { outputFile: 'test-results/results.json' }],// CI tooling: machine-readable
  ['./reporters/SummaryReporter.ts'],                    // QA lead: grouped digest
]
```

**`list`** — developer watching the terminal during a run. Shows each test
as it completes: `✓ PIM — Add Employee [admin] (3.2s)`.

**`html`** — the fully interactive report at `playwright-report/index.html`.
Click any test to see its steps, screenshots, video, trace, and annotations.
Filter by status, tag, project. Used for post-run investigation.

**`json`** — machine-readable. Every test, every step, every attachment.
Used by CI dashboards, the custom reporter, and automated tooling that
reads results programmatically.

**`SummaryReporter`** — grouped by module and severity, printed at run end.
The digest a QA lead reads to assess the run in 10 seconds without opening
a browser.

All four run simultaneously — no configuration switch needed between environments.

---

## Q508.11 — How are tests tagged in the updated test files?

Every test receives exactly three tags and, where API-created data is involved,
annotations for the IDs:

```typescript
// tests/pim/employee.spec.ts
test('admin can add a new employee via UI',
  { tag: ['@pim', '@smoke', '@critical'] },
  async ({ addEmployeePage, employeeListPage }, testInfo) => {
    const employee = generateEmployee();

    // Attach generated IDs for failure reproduction
    testInfo.annotations.push({ type: 'employeeId', description: employee.employeeId });
    testInfo.annotations.push({ type: 'fullName',   description: employee.fullName });

    await addEmployeePage.addEmployee(employee);
    await addEmployeePage.assertEmployeeSavedSuccessfully();
    // ...
  }
);

test('search with non-existent name shows no records',
  { tag: ['@pim', '@regression', '@medium'] },
  async ({ employeeListPage }) => {
    // No annotations — this test generates a phantom; no real data to track
    const phantom = generateEmployee();
    await employeeListPage.searchByEmployeeName(phantom.firstName + phantom.employeeId);
    await employeeListPage.assertNoRecordsFound();
  }
);
```

---

## Q508.12 — What is the difference between test.tags and testInfo.annotations?

**`test.tags`** (`{ tag: [...] }` in the test options) — static metadata
defined when the test is written. Used for filtering with `--grep`. Available
before the test runs. Examples: `@pim`, `@smoke`, `@critical`.

**`testInfo.annotations`** — runtime metadata added during test execution.
Used for reporting context. Available only while the test is running.
Examples: generated employee IDs, usernames, leave request IDs.

```typescript
// Tags — static, defined at write time, used for filtering
test('admin can add user', { tag: ['@admin', '@smoke', '@critical'] }, async ...) {}

// Annotations — dynamic, added at run time, used for debugging
testInfo.annotations.push({ type: 'username', description: user.username });
```

Tags answer "which tests should I run?". Annotations answer "what was happening
when this test failed?". They serve completely different purposes and are
never interchangeable.

---

## Q508.13 — What does the full playwright.config.ts look like at Level 7?

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import { readEnv }               from './data/readers';

const env = readEnv();

export default defineConfig({
  testDir:   './tests',
  outputDir: 'test-results/',
  timeout:   60_000,
  retries:   1,
  workers:   2,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['./reporters/SummaryReporter.ts'],
  ],

  use: {
    baseURL:           env.baseURL,
    headless:          true,
    viewport:          { width: 1280, height: 720 },
    actionTimeout:     10_000,
    navigationTimeout: 30_000,
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    trace:             'on-first-retry',
  },

  projects: [
    {
      name:      'admin',
      use:       { storageState: 'playwright/.auth/admin.json' },
      testMatch: ['**/pim/**', '**/admin/**', '**/leave/leave.spec.ts'],
    },
    {
      name:      'ess',
      use:       { storageState: 'playwright/.auth/ess.json' },
      testMatch: ['**/leave/apply.spec.ts'],
    },
    {
      name:      'no-auth',
      testMatch: ['**/login.spec.ts'],
    },
  ],

  globalSetup: './global-setup.ts',
});
```

---

## Q508.14 — How do you use --grep-invert to exclude tags from a run?

`--grep-invert` runs everything that does NOT match the pattern:

```bash
# Skip low-severity tests — faster run for time-sensitive situations
npx playwright test --grep-invert @low

# Skip leave module — when the leave API is down but other tests are needed
npx playwright test --grep-invert @leave

# Skip known flaky tests by name fragment
npx playwright test --grep-invert "leave approval"
```

`--grep-invert` and `--grep` can be combined:
```bash
# Run regression tests but skip leave module
npx playwright test --grep @regression --grep-invert @leave
```

---

## Q508.15 — What does test.status === 'flaky' mean?

Playwright marks a test as `flaky` when it fails on the first attempt but
passes on a retry. This is different from `passed` (never failed) and
`failed` (failed on all attempts):

```typescript
// In SummaryReporter
const flaky = this.results.filter(r => r.status === 'flaky');
```

A `flaky` status is a signal — not a failure, but not clean either. It means
the test is not deterministic. Possible causes: timing issues, shared demo
site intermittency, missing waits, data collision.

The SummaryReporter lists flaky tests separately so they are visible without
being treated as failures. Over multiple CI runs, a test that is consistently
flaky is a candidate for investigation — either the test needs hardening or
the application has a genuine intermittent behaviour.

---

## Q508.16 — What is testInfo and what else can it do beyond annotations?

`testInfo` is Playwright's test metadata object — it has the test's current
state and context, and lets you attach artefacts:

```typescript
test('example', async ({ page }, testInfo) => {

  // Access test metadata
  console.log(testInfo.title);          // test title
  console.log(testInfo.status);         // 'passed' | 'failed' | 'timedOut' | ...
  console.log(testInfo.retry);          // 0 for first run, 1 for first retry
  console.log(testInfo.project.name);   // 'admin' | 'ess' | 'no-auth'
  console.log(testInfo.tags);           // ['@pim', '@smoke', '@critical']

  // Add runtime annotations
  testInfo.annotations.push({ type: 'userId', description: '12345' });

  // Attach a file directly to the report (PDF, JSON, logs)
  await testInfo.attach('api-response', {
    body:        Buffer.from(JSON.stringify(apiResponse)),
    contentType: 'application/json',
  });

  // Attach a screenshot manually (separate from the auto-capture on failure)
  const screenshot = await page.screenshot();
  await testInfo.attach('mid-test-screenshot', {
    body:        screenshot,
    contentType: 'image/png',
  });

});
```

`testInfo.retry > 0` is useful for conditionally running extra diagnostics
only on retries — for example, taking a full-page screenshot or dumping
the DOM only when the test is already known to be failing.

---

## Q508.17 — What changed at Level 7 and what did not change?

**Changed:**
- `playwright.config.ts` — four reporters, screenshot/video/trace, `actionTimeout`, `navigationTimeout`
- Every test file — three tags per test, `testInfo.annotations` for API-created data
- `reporters/SummaryReporter.ts` — new file implementing the `Reporter` interface

**Unchanged:**
- All page objects — zero changes
- All helpers — zero changes
- All fixtures — zero changes
- The data layer (`types.ts`, `generate.ts`, `readers.ts`) — zero changes
- The API layer — zero changes

The test layer changed (tags + annotations) and the config changed (reporters + capture).
The framework infrastructure did not change. This is the correct signal: tagging
and reporting are concerns of the test layer, not the abstraction layers below it.

---

## Q508.18 — What does Level 7 not solve?

Level 7 produces clean, meaningful reports. The remaining problem:

**Everything runs locally and manually.** A developer can merge a pull request
without running tests. A regression introduced on Tuesday may not be found
until Friday. There is no automated trigger, no quality gate blocking merges,
no history across runs, no nightly schedule.

Level 8 (CI/CD Integration) addresses all four: three GitHub Actions workflows
run the smoke suite on pull requests, the full suite nightly, and allow manual
targeted runs. Allure history accumulates across nightly runs — trends and
flakiness become visible over time. Results are published to GitHub Pages
after every nightly run.

---

## Chapter Summary

- The tagging problem: without tags, a CI failure is `53 passed, 4 failed` with no actionable context.
- Three-dimension tagging: module (`@pim`, `@admin`, `@leave`, `@login`) + type (`@smoke`, `@regression`, `@sanity`) + severity (`@critical`, `@high`, `@medium`, `@low`).
- Every test gets exactly one tag per dimension; no test is untagged; enforcement is team discipline, not a technical guard.
- `--grep @smoke` runs all smoke tests; `(?=.*@smoke)(?=.*@pim)` runs the intersection; `--grep-invert @leave` excludes a module.
- `screenshot: 'only-on-failure'` captures page state at failure; `video: 'retain-on-failure'` records the full session; `trace: 'on-first-retry'` records a replayable trace on the first retry only.
- `testInfo.annotations.push({ type, description })` attaches runtime data (generated IDs) to the test result; visible in the HTML report under that test.
- Annotations happen inside tests, not in `beforeAll` — `testInfo` belongs to the currently running test.
- Tags vs annotations: tags are static (filtering), annotations are dynamic (debugging); they answer different questions.
- `SummaryReporter` implements `onTestEnd` (collect) and `onEnd` (print grouped summary); registered as `['./reporters/SummaryReporter.ts']` in config.
- Four reporters simultaneously: `list` (developer terminal), `html` (interactive), `json` (CI tooling), `SummaryReporter` (QA digest).
- `testInfo.status === 'flaky'` means failed then passed on retry — not a failure, but a stability signal.
- `testInfo` provides: title, status, retry count, project name, tags, annotations, and file attachment via `testInfo.attach()`.
- Pages, helpers, fixtures, data, and API layers are completely unchanged at Level 7 — only the test layer and config change.
- Level 7 solves reporting; it leaves automated triggers, quality gates, and cross-run history (Level 8) for the next level.
