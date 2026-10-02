# Chapter 306 — Annotations — skip, only, fail, fixme

This chapter covers Playwright's annotation system — both the built-in
behavioural annotations (`skip`, `fixme`, `fail`, `slow`) and custom metadata
annotations. Interviewers test this topic to discover whether a candidate
can make test reports self-explanatory: a report that tells you which failures
are known bugs, which tests are broken vs deliberately disabled, and who owns
each test — without needing to open a single file.

> Note: `test.skip`, `test.fixme`, `test.fail`, and `test.slow` were introduced
> in Chapter 23 as test modifiers. This chapter covers them in full depth —
> their conditional forms, describe-level usage, and how they appear in reports —
> plus the custom annotation system that Ch23 did not cover.

---

## Q306.1 — What are the two kinds of annotations in Playwright?

Playwright has two kinds of annotations:

**Built-in behavioural annotations** — these change how the test runner treats
the test:
- `test.skip()` — do not run this test
- `test.fixme()` — do not run this test; it is broken and needs repair
- `test.fail()` — run this test but expect it to fail
- `test.slow()` — run this test with 3× the configured timeout

**Custom annotations** — arbitrary key-value metadata you attach to provide
context in reports. They do not change test behaviour — they add traceability:

```typescript
test(
  'verify payroll calculation',
  {
    annotation: [
      { type: 'issue',  description: 'https://jira.example.com/PAY-42' },
      { type: 'owner',  description: 'payroll-team' },
      { type: 'priority', description: 'P1' },
    ],
  },
  async ({ page }) => { ... }
);
```

In the HTML report, custom annotations appear as labelled key-value pairs
under the test. In JSON and JUnit XML output, they flow through for CI
tooling and dashboards to consume.

---

## Q306.2 — What are the three forms of test.skip()?

**Form 1 — Static, unconditional skip:**
```typescript
test.skip('payment gateway — not in test environment', async ({ page }) => {
  // Body never executes. Appears in report as "skipped".
});
```

Use when a feature is not deployed, a dependency is unavailable, or a test
is on hold while a feature is being built.

**Form 2 — Conditional skip inside the test body:**
```typescript
test('PDF export generates file @regression', async ({ page }) => {
  test.skip(
    test.info().project.name === 'firefox',
    'PDF export uses Chrome print API — not available on Firefox'
  );
  // Runs on Chromium and WebKit; skipped on Firefox
  await page.getByRole('button', { name: 'Export PDF' }).click();
  await expect(page.getByText('PDF Generated')).toBeVisible();
});
```

Signature: `test.skip(condition: boolean, reason?: string)`

**Form 3 — Describe-level skip:**
```typescript
test.describe.skip('Recruitment Module', () => {
  // All tests inside are skipped — module not deployed in this environment
  test('post vacancy @smoke', ...)
  test('shortlist candidate @regression', ...)
});
```

**Always include the reason string.** Without it, the report shows "skipped"
with no explanation. The reason transforms a mystery into a clear statement:
"skipped — PDF export uses Chrome print API — not available on Firefox".

---

## Q306.3 — What is the difference between test.skip and test.fixme?

Both prevent a test from running. The difference is communication:

- `test.skip` says: **this is deliberately disabled**
- `test.fixme` says: **this is broken and needs to be fixed**

In the HTML report, fixme tests appear in a separate "Fixme" category —
distinct from the "Skipped" category. At a glance, the team can see how many
tests are intentionally off vs how many are broken and need attention.

```typescript
// skip — intentional, deliberate
test.skip('CSV import @regression', async ({ page }) => {
  test.skip(
    process.env.ENVIRONMENT !== 'staging',
    'CSV import requires staging database — not configured here'
  );
});

// fixme — broken, needs repair, has a ticket
test.fixme(
  'bulk delete crashes with employees having leave records — ticket #PW-99',
  async ({ page }) => {
    // Broken since v2.0 — assigned in sprint 14
  }
);
```

**Practical rule:** use `test.skip` for environment or feature conditions
where the test simply does not apply. Use `test.fixme` for test or product
code that is broken and has a tracking ticket.

---

## Q306.4 — What conditions can you pass to test.skip()?

Any boolean expression. Common patterns:

```typescript
// Based on browser project
test.skip(test.info().project.name === 'webkit', 'Not supported on Safari');

// Based on environment variable
test.skip(process.env.ENVIRONMENT !== 'staging', 'Staging only');

// Based on feature flag
test.skip(process.env.FEATURE_NEW_CHECKOUT !== 'true', 'Feature flag off');

// Based on OS (useful for download path tests)
test.skip(process.platform === 'win32', 'File paths differ on Windows');

// Based on project name (protect production from destructive tests)
test.skip(
  test.info().project.name === 'production',
  'Do not run destructive tests on production'
);
```

Each condition should have a `reason` that answers "why is this skipped here?"
for anyone reading the CI report.

---

## Q306.5 — How does test.fixme() work at the describe level?

`test.describe.fixme()` marks all tests in the group as fixme — equivalent
to marking each test individually with `test.fixme()`, but in one declaration:

```typescript
test.describe.fixme(
  'Leave Module — broken in v2.1 regression — ticket #PW-201',
  () => {
    test('apply annual leave @smoke', ...)
    test('approve leave request @regression', ...)
    test('leave balance updates after approval @regression', ...)
    // All three appear in "Fixme" report category
  }
);
```

The describe name becomes the reason visible in the report. Including the
ticket number in the describe name creates a direct link between the broken
tests and the work item tracking their repair.

---

## Q306.6 — What is test.fail() and when is it the right tool?

`test.fail()` inverts the pass/fail expectation for a test. The test still
runs. Playwright expects it to fail:

- If the test **fails** as expected → reported as **expected failure** (healthy)
- If the test **passes** unexpectedly → reported as **unexpected pass** (flagged)

```typescript
test.fail(
  'employee export completes without error — bug #PIM-88',
  async ({ page }) => {
    await page.goto('/employees');
    await page.getByRole('button', { name: 'Export All' }).click();
    await expect(page.getByText('Export complete')).toBeVisible();
    // Currently crashes before reaching this assertion — bug #PIM-88
  }
);
```

**Why this matters:** without `test.fail()`, your options are:
- Delete the test → lose coverage
- Leave it failing → break CI; alerts become noise

`test.fail()` keeps the test running, keeps CI green, and gives you an
automatic signal when the bug is fixed — the "unexpected pass" in the report
is your prompt to remove `test.fail()` and let the test pass normally.

---

## Q306.7 — What is the difference between test.fixme and test.fail?

| | `test.fixme` | `test.fail` |
|---|---|---|
| Does the test run? | No — skipped | Yes — runs |
| Report category | Fixme | Expected failure |
| Use for | Broken test scripts | Known product bugs |
| CI impact | Skipped, not counted as failure | Counted as "healthy expected failure" |

**Use `test.fixme`** when the test script itself is broken — the code needs
repair before it can run meaningfully.

**Use `test.fail`** when the test script is correct but the product has a
known bug that causes it to fail. The test is a valid assertion about product
behaviour — it just cannot pass yet.

---

## Q306.8 — What does test.slow() do and when should you use it?

`test.slow()` multiplies all timeouts for that test by 3. It is a relative
multiplier — it scales with the global timeout, not a hardcoded value.

```typescript
test('annual report generation completes @regression', async ({ page }) => {
  test.slow(); // Global: 30s → this test: 90s
  await page.getByRole('button', { name: 'Generate Annual Report' }).click();
  await expect(page.getByTestId('download-ready')).toBeVisible();
});

// Conditional slow — only slow on a specific environment
test('CSV export downloads @regression', async ({ page }) => {
  test.slow(
    test.info().project.name === 'webkit',
    'File download detection is slower on Safari'
  );
  await page.getByRole('button', { name: 'Export CSV' }).click();
  await expect(page.getByText('Download complete')).toBeVisible();
});
```

In the HTML report, `test.slow()` tests show a "slow" badge. This distinguishes
legitimately slow tests from tests that have become slow due to a performance
regression — the badge communicates intent.

**Use `test.slow`** for genuinely slow operations: report generation, bulk
imports, email flows, third-party API calls. Do not use it to compensate for
missing waits or flaky assertions — fix those instead.

---

## Q306.9 — What are custom annotations and how do you declare them?

Custom annotations are arbitrary key-value metadata attached to a test via
the details object. They appear in the HTML report and flow through JSON
and JUnit XML output.

```typescript
// Single annotation
test(
  'employee search performs within 2 seconds',
  {
    annotation: { type: 'performance-baseline', description: 'Max 2s response' },
  },
  async ({ page }) => { ... }
);

// Multiple annotations (array form)
test(
  'verify payroll calculation for monthly employees',
  {
    annotation: [
      { type: 'issue',    description: 'https://jira.example.com/PAY-42' },
      { type: 'owner',    description: 'payroll-team' },
      { type: 'priority', description: 'P1' },
      { type: 'module',   description: 'Payroll' },
    ],
  },
  async ({ page }) => { ... }
);
```

The `type` is the label — it appears as the key in the report. The
`description` is the value. You define your own taxonomy — Playwright
does not restrict what types you use.

---

## Q306.10 — How do you add annotations at runtime inside a test?

Use `test.info().annotations.push()`. This is useful when the annotation
value is not known at declaration time — it depends on what happens during
the test:

```typescript
test('employee export generates correct file @regression', async ({ page }) => {
  await page.getByRole('button', { name: 'Export CSV' }).click();

  const download = await page.waitForEvent('download');
  const filename = download.suggestedFilename();

  // Record which file was actually generated — useful for debugging failures
  test.info().annotations.push({
    type: 'exported-file',
    description: filename,
  });

  expect(filename).toMatch(/employees_.*\.csv/);
});

test('login performance @regression', async ({ page }) => {
  const start = Date.now();
  await page.goto('/login');
  await page.getByLabel('Username').fill('Admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);
  const duration = Date.now() - start;

  // Record measured performance in the report
  test.info().annotations.push({
    type: 'login-duration-ms',
    description: String(duration),
  });

  expect(duration).toBeLessThan(3000);
});
```

---

## Q306.11 — How do annotations appear in different report formats?

**HTML Report:** Each annotation appears as a labelled row under the test
entry. If the description is a URL, it renders as a clickable link.

**JSON Report:**
```json
{
  "title": "verify payroll calculation",
  "annotations": [
    { "type": "issue", "description": "https://jira.example.com/PAY-42" },
    { "type": "owner", "description": "payroll-team" }
  ]
}
```

This enables programmatic consumption — dashboards can group by `owner`,
filter by `module`, or link to issue trackers using the `issue` type.

**JUnit XML:**
```xml
<testcase name="verify payroll calculation">
  <properties>
    <property name="issue" value="https://jira.example.com/PAY-42"/>
    <property name="owner" value="payroll-team"/>
  </properties>
</testcase>
```

Azure DevOps, Jenkins, and other CI tools that consume JUnit XML display
these properties alongside the test result — connecting test outcomes to
the issue tracker and team ownership data.

---

## Q306.12 — What is the difference between annotations and tags?

Both attach metadata to tests. They serve different purposes:

| | Tags | Custom Annotations |
|---|---|---|
| Syntax | `{ tag: '@smoke' }` or `@smoke` in title | `{ annotation: { type, description } }` |
| Purpose | Filtering which tests run from CLI | Adding context visible in reports |
| CLI filtering | `--grep @smoke` runs only tagged tests | Cannot filter by annotation from CLI |
| Values | Single string labels | Structured `type` + `description` pairs |
| Best for | Suite selection: smoke, regression, slow | Traceability: issue, owner, priority |

In practice, use both:

```typescript
test(
  'add employee with required fields only @smoke',
  {
    tag: ['@smoke', '@pim'],                              // CLI: npx playwright test --grep @pim
    annotation: { type: 'issue', description: 'PIM-01' }, // report context
  },
  async ({ addEmployeePage }) => { ... }
);
```

Tags tell the runner which tests to execute. Annotations tell the report
reader what each test is about.

---

## Q306.13 — What annotation convention does your team follow?

In our project, every test in production must carry at minimum: `issue`,
`owner`, and `module` annotations. This is enforced as a PR review checklist
item.

```typescript
// Our team's standard annotation set
const standardAnnotations = (issue: string, owner: string, module: string) => [
  { type: 'issue',  description: issue  },
  { type: 'owner',  description: owner  },
  { type: 'module', description: module },
];

test(
  'add employee with duplicate ID shows error @regression',
  {
    tag: ['@regression', '@pim'],
    annotation: standardAnnotations(
      'https://jira.example.com/PIM-88',
      'pim-team',
      'PIM'
    ),
  },
  async ({ addEmployeePage }) => { ... }
);
```

The `module` annotation is particularly useful because our JSON reporter
aggregates failures by module — giving the team a module-level health
dashboard in CI without any custom tooling.

---

## Q306.14 — Write a complete spec file demonstrating all annotation types.

```typescript
import { test, expect } from '../../fixtures/baseFixture';

test.describe('Add Employee', () => {

  // Healthy test — full traceability metadata
  test(
    'saves with required fields only @smoke',
    {
      tag: ['@smoke', '@pim'],
      annotation: [
        { type: 'issue',    description: 'https://jira.example.com/PIM-01' },
        { type: 'owner',    description: 'pim-team' },
        { type: 'priority', description: 'P1' },
        { type: 'module',   description: 'PIM' },
      ],
    },
    async ({ addEmployeePage }) => {
      await addEmployeePage.goto();
      await addEmployeePage.fillBasicInfo('Priya', 'Sharma', 'EMP0099');
      await addEmployeePage.clickSave();
      await addEmployeePage.expectSuccessMessage();
    }
  );

  // Known product bug — test runs, failure is expected
  test.fail(
    'duplicate employee ID shows validation error — bug #PIM-88',
    async ({ addEmployeePage }) => {
      await addEmployeePage.goto();
      await addEmployeePage.fillEmployeeId('EMP001'); // existing ID
      await addEmployeePage.clickSave();
      await addEmployeePage.expectDuplicateIdError();
    }
  );

  // Broken on Safari — conditionally marked as fixme
  test('photo upload preview displays correctly @regression', async ({ addEmployeePage }) => {
    test.fixme(
      test.info().project.name === 'webkit',
      'File input broken on Safari since browser update — ticket #PIM-102'
    );
    await addEmployeePage.goto();
    await addEmployeePage.uploadPhoto('./fixtures/test-photo.jpg');
    await addEmployeePage.expectPhotoPreviewVisible();
  });

  // Environment-specific skip
  test('import employees from CSV @regression', async ({ addEmployeePage }) => {
    test.skip(
      process.env.ENVIRONMENT !== 'staging',
      'CSV import requires staging database configuration'
    );
    await addEmployeePage.importFromCSV('./data/employees.csv');
    await addEmployeePage.expectImportSuccess(5);
  });

  // Legitimately slow test — needs 3× timeout
  test('bulk add 50 employees completes @regression', async ({ addEmployeePage }) => {
    test.slow();
    for (let i = 1; i <= 50; i++) {
      await addEmployeePage.createEmployee({
        firstName: 'Employee',
        lastName: `${i}`,
        employeeId: `BULK${String(i).padStart(3, '0')}`,
      });
    }
    await addEmployeePage.expectTotalEmployeeCount(50);
  });

  // Runtime annotation — record dynamic context
  test('export employees generates timestamped file @regression', async ({ page }) => {
    await page.goto('/employees');
    await page.getByRole('button', { name: 'Export All' }).click();

    const download = await page.waitForEvent('download');
    const filename  = download.suggestedFilename();

    test.info().annotations.push({
      type: 'exported-file',
      description: filename,
    });

    expect(filename).toMatch(/employees_\d{8}\.csv/);
  });

});
```

---

## Q306.15 — How do you add annotations in afterEach to document test outcomes?

`afterEach` is useful for adding runtime annotations that describe what
happened during the test — particularly for flakiness and performance data:

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();

  // Always record the final URL
  info.annotations.push({
    type: 'final-url',
    description: page.url(),
  });

  // Flag flaky tests — passed on retry
  if (info.retry > 0 && info.status === 'passed') {
    info.annotations.push({
      type: 'flaky',
      description: `Passed on retry ${info.retry} — investigate intermittent failure`,
    });
  }

  // Flag unusually long tests
  if (info.duration > 20_000) {
    info.annotations.push({
      type: 'slow-run',
      description: `Took ${info.duration}ms — review for timeout risk`,
    });
  }
});
```

These annotations accumulate across the run and appear in the JSON output —
enabling a flakiness dashboard that tracks which tests needed retries over time.

---

## Q306.16 — Can you use test.fail() conditionally? When is this useful?

Yes. Conditional `test.fail()` is useful when a bug only manifests on a
specific browser or environment:

```typescript
test('report generation completes in time @regression', async ({ page }) => {
  test.fail(
    test.info().project.name === 'firefox',
    'Report generation times out on Firefox — bug #456, targeting v2.2'
  );

  await page.getByRole('button', { name: 'Generate Report' }).click();
  await expect(page.getByTestId('report-ready')).toBeVisible();
  // ↑ Passes on Chromium and WebKit; expected to fail on Firefox
});
```

The test runs on all browsers. On Firefox it is expected to fail. On other
browsers it must pass. If Firefox starts passing (bug fixed), the report shows
"unexpected pass" — your prompt to remove the condition.

---

## Q306.17 — How do annotations enable CI pipeline integrations?

Annotations in JUnit XML output (`--reporter junit`) flow into CI tools that
consume JUnit reports — Azure DevOps test plans, Jenkins test trend charts,
GitHub Actions test summaries.

With `owner` annotations, Azure DevOps can assign test failures to teams
automatically. With `issue` annotations, a custom webhook can post a Jira
comment when a linked test fails. With `module` annotations, a CI dashboard
can show which modules have the most failures.

```typescript
// playwright.config.ts — configure JUnit output
export default defineConfig({
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
});
```

The resulting XML:
```xml
<testcase name="verify payroll calculation">
  <properties>
    <property name="issue" value="https://jira.example.com/PAY-42"/>
    <property name="owner" value="payroll-team"/>
    <property name="module" value="Payroll"/>
  </properties>
</testcase>
```

This is what makes annotations more than documentation — they are machine-
readable metadata that connects test results to the wider engineering ecosystem.

---

## Q306.18 — What is the most common annotation mistake you see in team code?

The most common mistake is using `test.skip()` when `test.fail()` is the
correct tool — and vice versa.

`test.skip()` should be used when a test genuinely does not apply to the
current context (missing feature, wrong environment). It should never be
used to hide a broken test that does apply — that is what `test.fail()` is for.

The failure mode: a developer uses `test.skip()` to suppress a test that is
failing due to a known product bug. The test is not tracked. The bug is
"fixed" but nobody remembers to un-skip the test. Six months later, the
test is still skipped, the bug has regressed, but no test is catching it.

The correct pattern:

```typescript
// ❌ Wrong — suppresses coverage, no feedback when bug is fixed
test.skip('checkout completes correctly — bug #SHOP-99', async ({ page }) => {
  // ... this test will never run until someone remembers to un-skip it
});

// ✅ Correct — test runs, CI stays green, you get "unexpected pass" when bug is fixed
test.fail('checkout completes correctly — bug #SHOP-99', async ({ page }) => {
  // ... test runs every build; failure expected until bug is resolved
});
```

The rule: `test.skip` for things that don't apply here. `test.fail` for things
that should work here but don't yet. Never skip to hide a bug.

---

## Chapter Summary

- Two annotation kinds: built-in behavioural (`skip`, `fixme`, `fail`, `slow`) and custom key-value metadata.
- `test.skip(condition, reason)` — always include reason. Appears in "Skipped" report category. For non-applicable conditions.
- `test.fixme(condition, reason)` — separate "Fixme" category in report. For broken tests with a tracking ticket.
- `test.fail()` — runs the test; inverts expectation. Reports "unexpected pass" when the bug is fixed. For known product bugs.
- `test.slow()` — multiplies timeout by 3. Relative, not hardcoded. Shows "slow" badge in HTML report.
- Custom annotations via `{ annotation: { type, description } }` in the details object. Array form for multiple.
- Runtime annotations via `test.info().annotations.push({ type, description })` — for dynamic context.
- Annotations appear in HTML report, JSON output, and JUnit XML — enabling CI integrations and dashboards.
- Tags are for CLI filtering (`--grep @smoke`). Annotations are for report context. Use both together.
- Never `test.skip()` to hide a product bug — use `test.fail()` so coverage is maintained and you get notified when fixed.
