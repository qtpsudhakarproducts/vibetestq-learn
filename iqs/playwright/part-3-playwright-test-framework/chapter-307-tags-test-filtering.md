# Chapter 307 — Tags & Test Filtering

This chapter covers Playwright's tag system — how to define tags, how to
filter tests by tag from the CLI and config, and how to design a tag taxonomy
that gives your team granular control over every execution scenario. Interviewers
ask about tags to test pipeline design thinking: a candidate who knows tags
well can answer "how do you run only critical tests before a deployment?" with
a precise, confident answer.

---

## Q307.1 — What are tags in Playwright?

Tags are labels you attach to tests for filtering purposes. A test can have
one tag, multiple tags, or no tags. Tags have no effect on how a test runs —
they are purely for selecting which tests to include or exclude.

```typescript
// Tag in the details object (recommended)
test(
  'valid credentials redirect to dashboard',
  { tag: ['@smoke', '@auth'] },
  async ({ loginPage }) => { ... }
);

// Tag in the test title (simpler, but can clutter titles)
test('valid credentials redirect to dashboard @smoke @auth', async ({ loginPage }) => { ... });
```

Both syntaxes are equivalent for filtering. The CLI flag `--grep @smoke` matches
against the full test title — which includes tags whether they are in the title
or the details object.

---

## Q307.2 — What is the @ convention and why does it matter?

The `@` prefix is a convention, not a requirement. Playwright does not enforce
it. It matters in practice for three reasons:

1. **Visual clarity** — tags are instantly distinct from the rest of the title
   when you scan a list of test names
2. **Grep safety** — `--grep @smoke` is far less likely to accidentally match
   test titles than `--grep smoke` (which would match "employee smoke detection
   test" as a false positive)
3. **Team consistency** — `@smoke` is immediately recognisable to anyone
   familiar with Playwright

Always use `@` as a prefix. Never use raw words like `smoke` as tag values.

---

## Q307.3 — How do you attach tags to a describe block?

Tags on a `describe` block apply to all tests inside it. Individual tests
inside the describe can add their own tags on top.

```typescript
test.describe('Login Module', () => {
  // Tests in this describe also get @auth — declared per-test

  test(
    'valid credentials redirect to dashboard',
    { tag: ['@smoke', '@auth'] },
    async ({ loginPage }) => { ... }
  );

  test(
    'invalid password shows error message',
    { tag: ['@regression', '@auth'] },
    async ({ loginPage }) => { ... }
  );
});
```

In this pattern, the module tag (`@auth`) is repeated on each test. An
alternative: use a file-level describe name and let engineers know the tag
belongs to all tests in the file — some teams document this in a README rather
than repeating the tag on every test.

---

## Q307.4 — What is the two-layer tag system and how do you design one?

A well-designed tag system has two independent dimensions:

**Layer 1 — Execution tier (when should this test run?):**
- `@smoke` — the single most critical test per feature. Verifies the primary
  happy path. Should pass before every deployment. Target: full `@smoke` suite
  runs in under 5 minutes.
- `@regression` — the full coverage set: validations, edge cases, error paths,
  boundary conditions. Runs before releases and nightly.
- `@e2e` — full end-to-end user journeys spanning multiple pages or roles.
  These are slow and expensive. Runs nightly or before major releases.

**Layer 2 — Module (which part of the system?):**
- `@auth` — login, logout, session, SSO, password reset
- `@pim` — employee management: add, edit, delete, search
- `@leave` — leave application, approval, balances
- `@time` — attendance, timesheets, overtime
- `@payroll` — salary, deductions, payslips
- `@admin` — system configuration, user management

Every test should have exactly one tier tag and at least one module tag:

```typescript
// @smoke + @auth
test('valid credentials redirect to dashboard', { tag: ['@smoke', '@auth'] }, ...)

// @regression + @leave
test('past date is rejected for leave application', { tag: ['@regression', '@leave'] }, ...)

// @e2e + @pim + @leave (spans two modules)
test('new employee applies for leave on first day', { tag: ['@e2e', '@pim', '@leave'] }, ...)
```

Two dimensions give you independent filtering on two axes: run all smoke tests
regardless of module, or run all PIM tests regardless of tier, or run only
PIM smoke tests.

---

## Q307.5 — How do you run tests by tag from the CLI?

`--grep` matches against the full test title using a regex pattern:

```bash
# Run all tests tagged @smoke
npx playwright test --grep @smoke

# Run all tests tagged @regression
npx playwright test --grep @regression

# Run all tests for the PIM module
npx playwright test --grep @pim

# Run smoke tests on Chromium only
npx playwright test --grep @smoke --project=chromium
```

`--grep-invert` excludes tests matching the pattern:

```bash
# Run everything except @e2e tests (too slow for this run)
npx playwright test --grep-invert @e2e

# Run @regression but skip @slow tests
npx playwright test --grep @regression --grep-invert @slow
```

---

## Q307.6 — How do you filter for OR logic, AND logic, and NOT logic?

`--grep` is a regex, so regex operators apply:

**OR logic** — use the pipe `|`:
```bash
# Run tests tagged @smoke OR @regression
npx playwright test --grep "@smoke|@regression"

# Run tests from @pim OR @leave modules
npx playwright test --grep "@pim|@leave"
```

**AND logic** — use lookahead regex:
```bash
# Run tests that have BOTH @smoke AND @pim
npx playwright test --grep "(?=.*@smoke)(?=.*@pim)"

# Run @regression tests from the @auth module
npx playwright test --grep "(?=.*@regression)(?=.*@auth)"
```

**NOT logic** — use `--grep-invert`:
```bash
# Run all tests except @e2e
npx playwright test --grep-invert @e2e
```

**Combined OR + NOT:**
```bash
# Run smoke or regression tests, excluding slow ones
npx playwright test --grep "@smoke|@regression" --grep-invert @slow
```

---

## Q307.7 — How do you set default tag filters in playwright.config.ts?

Set `grep` and `grepInvert` at the config level to avoid typing `--grep` on
every command:

```typescript
// playwright.config.ts
export default defineConfig({
  // By default, only run smoke and regression tests
  // E2E tests require an explicit --grep @e2e to include
  grep: /@smoke|@regression/,

  // Never run @wip (work in progress) tests by default
  grepInvert: /@wip/,
});
```

With this config, `npx playwright test` runs `@smoke` and `@regression`.
To include `@e2e`, override explicitly: `npx playwright test --grep @e2e`.

---

## Q307.8 — How do you configure project-level tag filters?

Different Playwright projects can have different default tag filters. This
creates named execution profiles in a single config file:

```typescript
export default defineConfig({
  projects: [
    {
      name: 'smoke-check',
      grep: /@smoke/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'full-regression',
      grep: /@regression|@smoke/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'cross-browser-smoke',
      grep: /@smoke/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'nightly',
      grep: /@smoke|@regression|@e2e/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

```bash
npx playwright test --project=smoke-check       # 5-minute pre-deploy check
npx playwright test --project=full-regression   # pre-release regression
npx playwright test --project=nightly           # full nightly suite
```

One config, multiple execution profiles. Engineers pick the profile for their
context rather than constructing `--grep` patterns manually.

---

## Q307.9 — How do you list tests matching a tag without running them?

Use `--list` combined with `--grep`. This lets you verify tag coverage before
committing to a run:

```bash
# List all smoke tests
npx playwright test --list --grep @smoke
```

Output:
```
Listing tests:
  [chromium] › auth/login.spec.ts:8 › Login › valid credentials redirect to dashboard
  [chromium] › pim/employee-list.spec.ts:12 › Employee List › shows employees by default
  [chromium] › leave/apply-leave.spec.ts:11 › Apply Leave › application submits successfully
  3 tests total
```

Use `--list` to:
- Verify a new test was tagged correctly before running it
- Estimate how many tests a `--grep` run will execute
- Audit which tests are missing tier or module tags

```bash
# Find tests that have no tier tag (missing @smoke, @regression, or @e2e)
npx playwright test --list | grep -v "@smoke\|@regression\|@e2e"
```

---

## Q307.10 — How do tags appear in report output?

**HTML Report:** Tags appear as clickable labels next to each test title.
Clicking a tag in the report filters the view to show only tests with that
tag — useful when sharing reports with managers who want to see only `@smoke`
or only `@pim` results.

**JSON Report:**
```json
{
  "title": "valid credentials redirect to dashboard",
  "tags": ["@smoke", "@auth"],
  "status": "passed",
  "duration": 1340
}
```

This enables programmatic dashboards that aggregate by tag — "smoke test
pass rate over the last 30 days" or "PIM regression failures this week."

**JUnit XML:** Tags flow through as test suite or test case properties,
consumable by Azure DevOps, Jenkins, and other CI tools that parse JUnit.

---

## Q307.11 — What is the difference between tags and annotations?

Both attach metadata to tests. They serve different purposes:

| | Tags | Annotations |
|---|---|---|
| Syntax | `{ tag: '@smoke' }` | `{ annotation: { type, description } }` |
| Purpose | Control which tests run | Add context visible in reports |
| CLI use | `--grep @smoke` — filters execution | Cannot filter by annotation from CLI |
| Values | Single `@label` strings | Structured `type` + `description` pairs |
| Best for | Tier and module selection | Issue links, owner, priority |

**Use tags for execution control:**
```typescript
{ tag: ['@smoke', '@pim'] }  // CLI: npx playwright test --grep @pim
```

**Use annotations for traceability:**
```typescript
{ annotation: [
  { type: 'issue', description: 'https://jira.example.com/PIM-01' },
  { type: 'owner', description: 'pim-team' },
]}
```

In practice, use both together:
```typescript
test(
  'add employee saves with required fields',
  {
    tag: ['@smoke', '@pim'],                                    // execution control
    annotation: { type: 'owner', description: 'pim-team' },    // report context
  },
  async ({ addEmployeePage }) => { ... }
);
```

---

## Q307.12 — How do tags work in parameterised tests?

Tags work inside parameterised loops. You can include the tag in the data
row when different cases in the same loop need different tags:

```typescript
const cases = [
  {
    description: 'valid login redirects to dashboard',
    tag: '@smoke',
    username: 'Admin',
    password: 'admin123',
    expectSuccess: true,
  },
  {
    description: 'invalid password shows error message',
    tag: '@regression',
    username: 'Admin',
    password: 'wrongpassword',
    expectSuccess: false,
  },
  {
    description: 'empty username shows Required',
    tag: '@regression',
    username: '',
    password: 'admin123',
    expectSuccess: false,
  },
];

for (const tc of cases) {
  test(
    tc.description,
    { tag: [tc.tag, '@auth'] }, // per-row tier tag + fixed module tag
    async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(tc.username, tc.password);
      if (tc.expectSuccess) {
        await loginPage.expectDashboard();
      } else {
        await loginPage.expectError();
      }
    }
  );
}
```

`npx playwright test --grep @smoke` runs only the first case.
`npx playwright test --grep @auth` runs all three.
`npx playwright test --grep @regression` runs the last two.

---

## Q307.13 — What are the most common tag system mistakes?

**Mistake 1 — Ad hoc tags, no taxonomy:**
Different engineers use `@critical`, `@important`, `@key`, and `@smoke`
interchangeably. None of them can be relied on. Define the taxonomy once,
document it, enforce it in PR review.

**Mistake 2 — Too many tier levels:**
`@smoke`, `@sanity`, `@critical`, `@priority1` — if you cannot explain the
difference instantly, you have too many tiers. Three tiers (`@smoke`,
`@regression`, `@e2e`) cover almost every scenario.

**Mistake 3 — Overusing @smoke:**
If 80 tests are tagged `@smoke`, the pre-deploy check takes 40 minutes and
the tag means nothing. `@smoke` should be the single most critical test per
feature — the one that tells you the feature works at all.

**Mistake 4 — No module tags:**
Without module tags, you cannot run "all PIM tests" or "all auth tests" — you
can only run all smoke tests or all regression tests. Module tags give you
the second filtering dimension.

**Mistake 5 — Forgetting to tag new tests:**
Add tag verification to your PR checklist. Use `--list` to audit:
```bash
npx playwright test --list | grep -v "@smoke\|@regression\|@e2e"
# Any line that prints has a missing tier tag
```

---

## Q307.14 — How did your project structure the tag system for a pre-deployment gate?

In our project, we have a hard rule: the pre-deployment CI gate runs only
`@smoke` tests. If any `@smoke` test fails, the deployment is blocked.

The gate command:
```bash
npx playwright test --grep @smoke --project=chromium --workers=4
```

With 200+ tests in the suite, we have exactly 18 tests tagged `@smoke` —
one per major feature area. The full `@smoke` run completes in under 4 minutes.

We enforce the tagging rule in code review. Every `test()` call must have
a tier tag. New smoke tests require a team lead to approve — `@smoke` is
deliberately guarded to prevent scope creep.

The `@regression` suite runs in a nightly CI job with 8 workers. Both tier
and module tags are required on every test, verified in CI with a lint step
that parses the `--list` output.

---

## Q307.15 — How do you map tag-based runs to a CI pipeline?

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Nightly at 2am

jobs:
  smoke:
    name: Smoke Tests (PR gate)
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --grep @smoke --project=chromium

  regression:
    name: Regression Tests (merge gate)
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --grep "@smoke|@regression" --workers=4

  nightly:
    name: Full Suite (nightly)
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --grep "@smoke|@regression|@e2e" --workers=8
```

PRs trigger only `@smoke`. Merges to `main` run smoke + regression. Nightly
runs the full suite including `@e2e`. The tag system drives the entire
pipeline strategy — one taxonomy, three execution profiles.

---

## Q307.16 — Can you configure grep at the project level for cross-browser runs?

Yes. Project-level `grep` restricts which tests run for each project. This
is useful for running only smoke tests on non-Chromium browsers — keeping
cross-browser runs fast while still getting Chromium-wide regression coverage:

```typescript
export default defineConfig({
  projects: [
    // Chromium: full smoke + regression
    {
      name: 'chromium',
      grep: /@smoke|@regression/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox: smoke only — cross-browser validation of critical paths
    {
      name: 'firefox',
      grep: /@smoke/,
      use: { ...devices['Desktop Firefox'] },
    },
    // WebKit: smoke only — same reason
    {
      name: 'webkit',
      grep: /@smoke/,
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

Running `npx playwright test` executes the full regression on Chromium and
smoke-only on Firefox and WebKit. This balances thorough coverage with
reasonable cross-browser run time.

---

## Q307.17 — How do you include data in tags dynamically for parameterised tests?

When parameterised tests cover data-specific scenarios, embedding the data
identifier in the tag itself is not recommended — it makes `--grep` patterns
unpredictable. Instead, use the test title to carry data-specific context,
and keep tags for tier and module:

```typescript
const leaveTypes = ['Annual', 'Sick', 'Casual', 'Maternity'];

for (const type of leaveTypes) {
  test(
    `${type} leave type displays correct configuration @regression`,
    { tag: ['@regression', '@leave'] }, // tags: tier + module only
    async ({ adminPage }) => {
      await adminPage.openLeaveTypes();
      const row = adminPage.getLeaveTypeRow(type);
      await expect(row).toBeVisible();
    }
  );
}
```

The data (`Annual`, `Sick`) lives in the test title — visible in reports.
The tags (`@regression`, `@leave`) are stable and filterable. This keeps
`--grep @leave` reliably matching all leave tests regardless of which data
variant they cover.

---

## Q307.18 — What was the biggest tag-related problem your team solved?

The biggest problem we solved was tag drift — over six months, engineers had
added tests with inconsistent tags. We had `@smoke`, `@critical`, `@important`,
and `@sanity` all meaning roughly the same thing. The pre-deploy check that
was supposed to run 15 smoke tests was running 67.

The fix had two parts:

First, we ran an audit:
```bash
npx playwright test --list | sort | uniq
```
We identified every unique tag in use and mapped each to the canonical tag
it should be.

Second, we added a CI lint step — a Node.js script that parses `--list`
output and fails the build if any test uses an undeclared tag:

```typescript
// scripts/lint-tags.ts
const ALLOWED_TAGS = new Set(['@smoke', '@regression', '@e2e',
  '@auth', '@pim', '@leave', '@time', '@payroll', '@admin', '@reports']);

// Parse playwright test --list output and check each tag
```

After the migration, the `@smoke` suite was back to 18 tests and ran in
3.5 minutes. The `--grep` patterns in CI became reliable and the team
trusted the pre-deploy gate again.

---

## Chapter Summary

- Tags are `@`-prefixed labels for filtering — they do not change how tests run.
- Two syntax options: `{ tag: ['@smoke', '@pim'] }` in details object (recommended), or in the title string.
- Design a two-layer system: tier tags (`@smoke`, `@regression`, `@e2e`) + module tags (`@auth`, `@pim`, `@leave`).
- `--grep @smoke` — simple match. `--grep "@a|@b"` — OR. `--grep "(?=.*@a)(?=.*@b)"` — AND. `--grep-invert @e2e` — NOT.
- Set `grep` / `grepInvert` in `playwright.config.ts` for project-level defaults. Different projects can have different filters.
- `--list --grep @smoke` previews which tests match before running. Use for auditing tag coverage.
- Tags flow through HTML report (filterable), JSON output (parseable), and JUnit XML.
- Tags vs annotations: tags control execution; annotations add context to reports. Use both.
- Common mistakes: no taxonomy, overusing `@smoke`, no module tags, forgetting to tag new tests.
