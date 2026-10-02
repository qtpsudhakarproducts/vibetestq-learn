# 06 — Annotations

## The Scenario

Your team just completed a two-week sprint. 47 tests are passing. 6 tests are failing. Your manager opens the CI report and asks three questions:

1. Which of these failures are known bugs we are already tracking?
2. Which tests are failing because of the Firefox environment issue — not actual bugs?
3. Which tests are intentionally disabled while the Recruitment module is being built?

Without annotations, the only way to answer these questions is to open each failing test, read the code, find a comment somewhere, and explain verbally. The report itself is silent — it just shows red.

With annotations, the report answers these questions directly. Each test carries metadata that tells the reader exactly what is happening and why — without opening a single file.

---

## What Annotations Are

Annotations are structured metadata attached to a test. They describe the test's intent, its current state, the reason it is behaving a certain way, or a link to an external reference like a bug tracker.

Playwright has two kinds:

**Built-in behavioural annotations** — these change how Playwright treats the test:
- `test.skip()` — do not run this test
- `test.fixme()` — do not run this test, it is broken
- `test.fail()` — run this test but expect it to fail
- `test.slow()` — run this test with 3× the timeout

These were introduced in the Defining Tests notes as modifiers. Here we look at them more deeply — specifically their conditional forms, their use on describe blocks, and how they appear in reports.

**Custom annotations** — arbitrary key-value metadata you attach to a test:
- Issue tracker links
- Owners and teams
- Priority levels
- Any context you want visible in the report

---

## Built-in Annotations — The Full Picture

### test.skip()

You have already seen the static form. The full picture includes three forms depending on when and why you are skipping.

**Form 1 — Static, unconditional skip:**

```typescript
test.skip('payment gateway — not in test environment', async ({ page }) => {
  // Body never executes
  // Appears in report as skipped with the title as explanation
});
```

Use when a feature does not exist in the current environment, a dependency is unavailable, or a test is being held while a feature is in development.

**Form 2 — Conditional skip declared at test declaration (via details object):**

```typescript
// You cannot conditionally skip via the details object directly —
// conditions require being inside the test body or using describe.skip
// The details object only supports static tag/annotation/timeout/retries
```

**Form 3 — Conditional skip inside the test body:**

```typescript
test('PDF export generates file @regression', async ({ page }) => {
  test.skip(
    test.info().project.name === 'firefox',
    'PDF export uses Chrome print API — not available on Firefox'
  );
  // Runs on chromium and webkit, skipped on firefox
  await page.getByRole('button', { name: 'Export PDF' }).click();
  await expect(page.getByText('PDF Generated')).toBeVisible();
});
```

The signature: `test.skip(condition: boolean, reason?: string)`

The `reason` is critical. Without it, the report shows "skipped" with no explanation. With it, the report shows "skipped — PDF export uses Chrome print API — not available on Firefox". Anyone reading the report immediately understands.

**Common conditions used with test.skip:**

```typescript
// Based on browser
test.skip(test.info().project.name === 'webkit', 'Not supported on Safari');

// Based on environment
test.skip(process.env.ENVIRONMENT !== 'staging', 'Staging only');

// Based on feature flag
test.skip(process.env.FEATURE_NEW_DASHBOARD !== 'true', 'Feature not enabled');

// Based on OS (useful for download tests)
test.skip(process.platform === 'win32', 'File paths differ on Windows');

// Based on project name (multi-environment setup)
test.skip(
  test.info().project.name === 'production',
  'Do not run destructive tests on production'
);
```

**At describe level:**

```typescript
test.describe.skip('Recruitment Module', () => {
  // All tests inside are skipped — module not deployed in this environment
  test('post vacancy @smoke', ...)
  test('shortlist candidate @regression', ...)
});
```

---

### test.fixme()

`test.fixme()` is `test.skip()` with intent. Both prevent the test from running. The difference is what they communicate:

- `test.skip` says: this test is deliberately not running
- `test.fixme` says: this test should be running but it is broken — someone needs to fix it

In the HTML report, fixme tests appear under a separate "Fixme" section, distinct from the "Skipped" section. This makes it easy to see at a glance how many tests are broken vs how many are intentionally disabled.

**Static fixme — the test is always broken right now:**

```typescript
test.fixme(
  'bulk delete crashes when employee has associated records — ticket #PW-99',
  async ({ employeeListPage }) => {
    // Broken since v2.0 upgrade — engineer assigned, fix in sprint 14
  }
);
```

**Conditional fixme — broken only under specific conditions:**

```typescript
test('date range picker selects correct dates @regression', async ({ page }) => {
  test.fixme(
    test.info().project.name === 'webkit',
    'Date picker broken on Safari since browser update — ticket #PW-102'
  );
  // Runs on Chrome and Firefox, marked fixme on Safari
  await page.getByLabel('From Date').click();
  await page.getByRole('gridcell', { name: '15' }).click();
  await expect(page.getByLabel('From Date')).toHaveValue('2026-03-15');
});
```

**At describe level — an entire module is broken:**

```typescript
test.describe.fixme('Leave Module — broken in v2.1 regression — ticket #PW-201', () => {
  test('apply annual leave @smoke', ...)
  test('approve leave request @regression', ...)
  test('leave balance updates after approval @regression', ...)
  // All skipped, grouped under fixme in the report
});
```

The right time to use `test.fixme` is when you have a ticket tracking the fix. The ticket reference in the test title creates a link between the failing test and the work item. When someone fixes the bug, they search for `#PW-99` in the codebase and find the test to un-fixme.

---

### test.fail()

`test.fail()` is for tests that are currently broken due to a known bug — but unlike `test.fixme`, the test still runs. It inverts the expectation: failure is the expected outcome.

The scenario that makes this valuable: you have a known bug that will be fixed in the next sprint. You do not want to delete the test — you will lose the coverage. You do not want it failing and making CI red — alerts lose meaning. `test.fail()` lets you keep the test running, keep the CI green, and automatically detect when the bug is fixed.

```typescript
test.fail(
  'employee export completes without error — bug #123',
  async ({ employeeListPage }) => {
    await employeeListPage.goto();
    await employeeListPage.selectAll();
    await employeeListPage.clickExport();
    await expect(employeeListPage.getSuccessToast()).toBeVisible();
    // Currently crashes on click — bug #123
    // When the bug is fixed, this test will pass
    // Playwright will report it as "unexpected pass" — your signal to remove test.fail()
  }
);
```

**Conditional test.fail — broken only on specific browser or environment:**

```typescript
test('report generation completes in time @regression', async ({ reportsPage }) => {
  test.fail(
    test.info().project.name === 'firefox',
    'Report generation times out on Firefox — bug #456, fix targeting v2.2'
  );
  await reportsPage.generateAnnualReport();
  await reportsPage.expectReportReady();
});
```

**What the report shows:**

| Outcome | Report Label |
|---|---|
| Test fails as expected | `expected failure` — green in report |
| Test passes unexpectedly | `unexpected pass` — flagged as requiring attention |

The "unexpected pass" is the feature that makes `test.fail()` worth using. You do not need to remember to remove it — the report tells you.

---

### test.slow()

`test.slow()` is a multiplier annotation. It signals that this test is legitimately slow and needs more time. It multiplies the configured timeout by 3.

```typescript
test('full employee onboarding workflow @e2e', async ({ page }) => {
  test.slow();
  // Global timeout: 30s → this test now has 90s
});
```

**Conditional slow — slow only under specific conditions:**

```typescript
test('CSV export downloads file @regression', async ({ page }) => {
  test.slow(
    test.info().project.name === 'webkit',
    'File download detection is slower on Safari'
  );
  await page.getByRole('button', { name: 'Export CSV' }).click();
  await expect(page.getByText('Download complete')).toBeVisible();
});
```

In the HTML report, tests marked with `test.slow()` are shown with a "slow" badge. This helps distinguish intentionally slow tests from tests that are slow due to a performance regression.

---

## Custom Annotations — Attaching Your Own Metadata

Beyond the built-in behavioural annotations, Playwright lets you attach any metadata you want to a test. This metadata appears in the HTML report and is included in JSON and JUnit XML output.

### Declaring Annotations in the Details Object

```typescript
test(
  'verify payroll calculation for monthly employees',
  {
    annotation: [
      { type: 'issue', description: 'https://jira.example.com/PAY-42' },
      { type: 'owner', description: 'payroll-team' },
      { type: 'priority', description: 'P1' },
      { type: 'module', description: 'Payroll' },
    ],
  },
  async ({ page }) => {
    // test body
  }
);
```

In the HTML report, each annotation appears as a labelled entry next to the test:
```
issue:    https://jira.example.com/PAY-42
owner:    payroll-team
priority: P1
module:   Payroll
```

The `type` is the label. The `description` is the value. Both are strings — you define your own taxonomy.

### Declaring a Single Annotation

```typescript
test(
  'employee search performs within acceptable time',
  {
    annotation: { type: 'performance-baseline', description: 'Max 2s response time' },
  },
  async ({ page }) => {
    // test body
  }
);
```

### Adding Annotations at Runtime — Inside the Test

Sometimes the annotation value is not known at declaration time — it depends on what happens during the test. Use `test.info().annotations.push()`:

```typescript
test('employee export generates correct file @regression', async ({ page }) => {
  await page.getByRole('button', { name: 'Export CSV' }).click();

  const download = await page.waitForEvent('download');
  const filename = download.suggestedFilename();

  // Attach the actual filename to the test report
  test.info().annotations.push({
    type: 'exported-file',
    description: filename,
  });

  expect(filename).toMatch(/employees_.*\.csv/);
});
```

```typescript
test('login performance @regression', async ({ page }) => {
  const start = Date.now();
  await page.goto('/web/index.php/auth/login');
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);
  const duration = Date.now() - start;

  // Record the actual performance in the test report
  test.info().annotations.push({
    type: 'login-duration-ms',
    description: String(duration),
  });

  expect(duration).toBeLessThan(3000);
});
```

### Adding Annotations in afterEach

You can push annotations in `afterEach` based on what the test did:

```typescript
test.afterEach(async ({ page }) => {
  const info = test.info();

  // Record the final URL for every test — useful for debugging
  info.annotations.push({
    type: 'final-url',
    description: page.url(),
  });

  // Record if this was a retry
  if (info.retry > 0) {
    info.annotations.push({
      type: 'retry-info',
      description: `Passed on retry ${info.retry} after initial failure`,
    });
  }
});
```

---

## Annotations in Different Report Formats

Annotations do not just appear in the HTML report — they flow through all report formats.

**HTML Report:**
Each annotation appears as a row under the test entry. Clickable if the description is a URL (e.g., a Jira link).

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

Use this to build dashboards that aggregate test results by owner, by module, or by linked issue.

**JUnit XML:**
```xml
<testcase name="verify payroll calculation">
  <properties>
    <property name="issue" value="https://jira.example.com/PAY-42"/>
    <property name="owner" value="payroll-team"/>
  </properties>
</testcase>
```

Azure DevOps, Jenkins, and other CI tools that consume JUnit XML can display these properties alongside the test result.

---

## Building an Annotation Convention for OrangeHRM

A consistent annotation convention makes your reports dramatically more useful. Here is a practical convention:

```typescript
// Annotation types used across the OrangeHRM test suite

// Links a test to a bug or story in Jira
{ type: 'issue', description: 'https://jira.example.com/TICKET-NUMBER' }

// The team or person responsible for maintaining this test
{ type: 'owner', description: 'pim-team' }  // or 'leave-team', 'qa-lead'

// Business priority of the feature being tested
{ type: 'priority', description: 'P1' }     // P1, P2, P3

// The OrangeHRM module this test covers
{ type: 'module', description: 'PIM' }      // PIM, Leave, Time, Admin, Auth

// Environment restriction — when a test only makes sense in specific environments
{ type: 'environment', description: 'staging-only' }

// Documents a known limitation or workaround in the test
{ type: 'limitation', description: 'Uses fixed test data — EMP001 must exist' }
```

Applied to a real test:

```typescript
test(
  'add employee with duplicate ID shows validation error',
  {
    tag: ['@regression', '@pim'],
    annotation: [
      { type: 'issue', description: 'https://jira.example.com/PIM-88' },
      { type: 'owner', description: 'pim-team' },
      { type: 'priority', description: 'P2' },
      { type: 'module', description: 'PIM' },
    ],
  },
  async ({ addEmployeePage }) => {
    await addEmployeePage.goto();
    await addEmployeePage.fillEmployeeId('EMP001'); // known existing ID
    await addEmployeePage.clickSave();
    await addEmployeePage.expectDuplicateIdError();
  }
);
```

---

## Annotations vs Tags — What Is the Difference

Both annotations and tags attach metadata to tests. They serve different purposes.

| | Tags | Custom Annotations |
|---|---|---|
| **Syntax** | `{ tag: '@smoke' }` or `@smoke` in title | `{ annotation: { type, description } }` |
| **Purpose** | Filtering which tests to run from CLI | Adding context visible in reports |
| **CLI use** | `--grep @smoke` runs only tagged tests | Cannot filter by annotation from CLI |
| **Report** | Appear as labels in the report | Appear as key-value pairs in the report |
| **Values** | Single string labels | Structured `type` + `description` pairs |
| **Best for** | "Run only these tests" | "Show this context about this test" |

In practice, use both:
- Tags for execution control (`@smoke`, `@regression`, `@pim`)
- Annotations for traceability (`issue`, `owner`, `priority`)

```typescript
test(
  'add employee saves with required fields',
  {
    tag: ['@smoke', '@pim'],                              // ← for CLI filtering
    annotation: { type: 'issue', description: 'PIM-01' }, // ← for report context
  },
  async ({ addEmployeePage }) => { ... }
);
```

---

## A Complete Example — All Annotation Types Together

```typescript
// tests/pim/add-employee.spec.ts
import { test, expect } from '../../fixtures/baseFixture';

test.describe('Add Employee', () => {

  // ── Healthy test with full traceability metadata ────────────────────
  test(
    'saves with required fields only',
    {
      tag: ['@smoke', '@pim'],
      annotation: [
        { type: 'issue', description: 'https://jira.example.com/PIM-01' },
        { type: 'owner', description: 'pim-team' },
        { type: 'priority', description: 'P1' },
      ],
    },
    async ({ addEmployeePage }) => {
      await addEmployeePage.goto();
      await addEmployeePage.fillBasicInfo('Priya', 'Sharma', 'EMP0099');
      await addEmployeePage.clickSave();
      await addEmployeePage.expectSuccessMessage();
    }
  );

  // ── Known bug — test runs, failure is expected ─────────────────────
  test.fail(
    'duplicate employee ID shows validation error — bug #PIM-88',
    async ({ addEmployeePage }) => {
      await addEmployeePage.goto();
      await addEmployeePage.fillEmployeeId('EMP001'); // existing ID
      await addEmployeePage.clickSave();
      await addEmployeePage.expectDuplicateIdError();
    }
  );

  // ── Broken on Safari, tracked ──────────────────────────────────────
  test('photo upload preview displays correctly @regression', async ({ addEmployeePage }) => {
    test.fixme(
      test.info().project.name === 'webkit',
      'File input broken on Safari — ticket #PIM-102'
    );
    await addEmployeePage.goto();
    await addEmployeePage.uploadPhoto('./fixtures/test-photo.jpg');
    await addEmployeePage.expectPhotoPreviewVisible();
  });

  // ── Skipped — environment constraint ──────────────────────────────
  test('import employees from CSV @regression', async ({ addEmployeePage }) => {
    test.skip(
      process.env.ENVIRONMENT !== 'staging',
      'CSV import requires staging database configuration'
    );
    await addEmployeePage.importFromCSV('./data/employees.csv');
    await addEmployeePage.expectImportSuccess(5);
  });

  // ── Slow workflow — needs extra time ──────────────────────────────
  test('bulk add 50 employees completes @regression', async ({ addEmployeePage }) => {
    test.slow();
    for (let i = 1; i <= 50; i++) {
      await addEmployeePage.createEmployee({
        firstName: `Employee`,
        lastName: `${i}`,
        employeeId: `BULK${String(i).padStart(3, '0')}`,
      });
    }
    await addEmployeePage.expectTotalEmployeeCount(50);
  });

});
```

---

## Key Points

- Annotations are metadata attached to tests — they appear in HTML reports, JSON output, and JUnit XML
- Two kinds: built-in behavioural (`skip`, `fixme`, `fail`, `slow`) and custom (`{ type, description }`)
- `test.skip(condition, reason)` — always include the reason; it appears in the report and explains the skip
- `test.fixme(condition, reason)` — separate category in report from skipped; use with a ticket reference
- `test.fail()` — test still runs; expected to fail; "unexpected pass" alerts you when the bug is fixed
- `test.slow()` — multiplies timeout by 3; shows as "slow" badge in HTML report
- Custom annotations via details object: `{ annotation: { type: 'issue', description: 'TICKET-42' } }`
- Custom annotations at runtime: `test.info().annotations.push({ type, description })`
- Annotations vs tags: tags are for CLI filtering (`--grep @smoke`); annotations are for report context
- Build a consistent annotation convention across your project — `issue`, `owner`, `priority`, `module`
- Annotations in JSON and JUnit XML enable dashboards and CI tools to filter and aggregate test results by metadata
