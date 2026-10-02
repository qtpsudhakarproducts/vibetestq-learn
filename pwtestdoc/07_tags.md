# 07 — Tags

## The Scenario

Your OrangeHRM test suite has grown to 200 tests across 15 spec files. It covers login, employee management, leave, time tracking, payroll, and admin configuration. Running the full suite takes 18 minutes.

A deployment is happening in 45 minutes. Your team lead asks: "Can you run a quick check to make sure the critical paths still work before we deploy?"

You do not have 18 minutes. You need to run only the most important tests — the ones that verify the system's core functionality. If any of those fail, the deployment is blocked. If they all pass, deployment proceeds.

How do you identify and run only those tests? Tags.

---

## What Tags Are

Tags are labels you attach to tests. A test can have one tag, multiple tags, or no tags. Tags have no effect on how the test runs — they are purely for filtering.

When you run `npx playwright test --grep @smoke`, Playwright runs only the tests that have `@smoke` in their title or in their tag list. Everything else is skipped. That is the entire mechanism.

The power is in the convention you build around tags. A well-thought-out tag system means anyone on the team can run exactly the right subset of tests for any situation — deployment checks, regression runs, module-specific investigations, performance checks — with a single CLI command.

---

## Defining Tags

There are two ways to attach a tag to a test.

### Method 1 — In the details object (recommended)

```typescript
test(
  'valid credentials redirect to dashboard',
  { tag: ['@smoke', '@auth'] },
  async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');
    await loginPage.expectDashboard();
  }
);
```

### Method 2 — In the test title

```typescript
test('valid credentials redirect to dashboard @smoke @auth', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('Admin', 'admin123');
  await loginPage.expectDashboard();
});
```

Both methods work identically for filtering. The details object is the cleaner approach — it keeps the title readable and makes tags easy to parse programmatically. The title approach is simpler to type quickly but can make titles long and cluttered when multiple tags are applied.

**Single tag shorthand:**
```typescript
{ tag: '@smoke' }        // single tag as a string
{ tag: ['@smoke'] }      // single tag as an array — same result
{ tag: ['@smoke', '@pim'] }  // multiple tags — always use an array
```

### Tags on describe blocks

Tags applied to a `describe` block apply to all tests inside it:

```typescript
test.describe('Employee List', () => {
  // All tests in this describe inherit @pim
  // Individual tests can add more tags on top

  test(
    'shows all employees by default',
    { tag: ['@smoke', '@pim'] },
    async ({ employeeListPage }) => { ... }
  );

  test(
    'search filters results',
    { tag: ['@regression', '@pim'] },
    async ({ employeeListPage }) => { ... }
  );
});
```

---

## The @ Convention

The `@` prefix is a convention, not a requirement. Playwright does not enforce it. But it has become the standard because:

1. It makes tags visually distinct from the rest of the title when you use the title method
2. It makes grep patterns unambiguous — `--grep @smoke` is far less likely to accidentally match test titles than `--grep smoke`
3. It is immediately recognisable to anyone familiar with Playwright

Always use `@` as a prefix for tags.

---

## Building a Tag System for OrangeHRM

A tag system that is not planned becomes inconsistent. Different engineers add different tags with no shared meaning. The value evaporates. Define your tag taxonomy upfront and document it.

Here is a practical two-layer system:

### Layer 1 — Execution Tier Tags

These answer the question: **when should this test run?**

```
@smoke
  The single most critical test for a feature. Verifies the primary
  happy path works. Should pass on every deployment. If a @smoke test
  fails, the deployment is blocked.

  How many per feature: 1–3 maximum.
  When to run: before every deployment, after every merge to main.
  Run time target: the full @smoke suite should complete in under 5 minutes.

@regression
  The full set of test cases — validations, edge cases, error paths,
  boundary conditions. These are the tests that find bugs before release.

  How many per feature: as many as needed to cover all scenarios.
  When to run: before a release, after significant code changes,
              nightly on the main branch.
  Run time: no specific target — thorough coverage is the goal.

@e2e
  Full end-to-end user journeys spanning multiple pages, multiple
  modules, or multiple user roles. These simulate real user workflows.

  How many: few — these are expensive and slow.
  When to run: nightly, before major releases.
  These tests are often marked test.slow() as well.
```

### Layer 2 — Module Tags

These answer the question: **which part of the system does this test cover?**

```
@auth        Login, logout, session, password reset, SSO
@pim         Employee Information Module — add, edit, delete, search
@leave       Leave application, approval, rejection, balances
@time        Attendance, timesheets, overtime
@payroll     Salary, deductions, payslips
@admin       System configuration, user management, modules
@reports     Report generation, export, scheduling
```

### Applying Both Layers Together

Every test should have exactly one tier tag and at least one module tag:

```typescript
// @smoke (tier) + @auth (module)
test(
  'valid credentials redirect to dashboard',
  { tag: ['@smoke', '@auth'] },
  async ({ loginPage }) => { ... }
);

// @regression (tier) + @auth (module)
test(
  'invalid password shows error message',
  { tag: ['@regression', '@auth'] },
  async ({ loginPage }) => { ... }
);

// @smoke (tier) + @pim (module)
test(
  'add employee saves with required fields',
  { tag: ['@smoke', '@pim'] },
  async ({ addEmployeePage }) => { ... }
);

// @e2e (tier) + @pim + @leave (spans multiple modules)
test(
  'new employee can apply for leave on first day',
  { tag: ['@e2e', '@pim', '@leave'] },
  async ({ page }) => { ... }
);
```

---

## Running Tests by Tag — CLI

This is where the tag system pays off. Every scenario has a single command.

### Run a single tag

```bash
# Run all smoke tests — pre-deployment check
npx playwright test --grep @smoke

# Run all regression tests — pre-release check
npx playwright test --grep @regression

# Run all PIM module tests — after a PIM change
npx playwright test --grep @pim

# Run all auth tests — after a login system change
npx playwright test --grep @auth
```

### Run tests matching multiple tags (OR logic)

`--grep` uses regex. The pipe `|` means OR:

```bash
# Run tests tagged @smoke OR @regression
npx playwright test --grep "@smoke|@regression"

# Run tests from the PIM or Leave module
npx playwright test --grep "@pim|@leave"
```

### Run tests matching multiple tags (AND logic)

For AND logic, use a lookahead regex — both tags must be present:

```bash
# Run tests that have BOTH @smoke AND @pim
npx playwright test --grep "(?=.*@smoke)(?=.*@pim)"

# Run @regression tests from the @auth module
npx playwright test --grep "(?=.*@regression)(?=.*@auth)"
```

In practice, AND filtering is less common. You usually want "all smoke tests" or "all PIM tests" rather than "smoke tests from PIM specifically". When you do need it, the lookahead syntax works reliably.

### Exclude a tag (NOT logic)

`--grep-invert` excludes tests matching the pattern:

```bash
# Run everything except @e2e tests (they are too slow for this run)
npx playwright test --grep-invert @e2e

# Run all tests except @skip tagged tests
npx playwright test --grep-invert @skip

# Run @regression but skip the @slow ones
npx playwright test --grep @regression --grep-invert @slow
```

### Combine tag filtering with project and file filtering

```bash
# Run smoke tests on Chrome only
npx playwright test --grep @smoke --project=chromium

# Run PIM tests from a specific file
npx playwright test tests/pim/ --grep @pim

# Run auth smoke tests on all browsers
npx playwright test --grep "(?=.*@smoke)(?=.*@auth)"

# Run regression tests, 4 workers, HTML report
npx playwright test --grep @regression --workers=4 --reporter=html
```

---

## Configuring Default Tag Filters in playwright.config.ts

If your team almost always runs a specific subset, you can set it as the default in the config so you do not have to type `--grep` every time:

```typescript
// playwright.config.ts
export default defineConfig({

  // By default, only run smoke and regression tests
  // E2E tests require an explicit --grep @e2e to run
  grep: /@smoke|@regression/,

  // Never run tests tagged @wip (work in progress) by default
  grepInvert: /@wip/,

});
```

With this config, `npx playwright test` runs `@smoke` and `@regression` tests. To run `@e2e` tests, you explicitly override with `--grep @e2e`.

**Project-level tag filters** — different projects can have different default filters:

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
      name: 'cross-browser',
      grep: /@smoke/,  // Only smoke tests on non-Chrome browsers
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
```

Now `--project=smoke-check` runs only smoke tests. `--project=full-regression` runs the full suite. `--project=cross-browser` runs smoke tests on Firefox. One config file, multiple execution profiles.

---

## Listing Tests Without Running Them

Before a major run, you may want to verify which tests will actually execute with a given tag filter. Use `--list`:

```bash
# List all smoke tests without running them
npx playwright test --list --grep @smoke
```

Output:
```
Listing tests:
  [chromium] › auth/login.spec.ts:8:5 › Login › valid credentials redirect to dashboard
  [chromium] › pim/employee-list.spec.ts:12:5 › Employee List › shows employees by default
  [chromium] › pim/add-employee.spec.ts:9:5 › Add Employee › saves with required fields
  [chromium] › leave/apply-leave.spec.ts:11:5 › Apply Leave › leave application submits successfully
  [chromium] › time/attendance.spec.ts:8:5 › Attendance › check-in records successfully
  5 tests total
```

Use `--list` to:
- Verify your tag convention is applied correctly (no missing tags)
- Check that a new test was tagged correctly
- Estimate how many tests a tag run will execute before committing to it

---

## Tags in the HTML Report

Tags appear in the HTML report next to the test title. You can filter the report by tag to focus on specific areas. When you share the report with your manager, they can click on `@smoke` and see only the critical path results — or click on `@pim` and see only the PIM module results.

Tags also appear in JSON report output:

```json
{
  "title": "valid credentials redirect to dashboard",
  "tags": ["@smoke", "@auth"],
  "status": "passed"
}
```

This enables external dashboards to group results by tag — for example, a dashboard that shows "smoke test pass rate over time" or "PIM regression failures this week."

---

## A Practical Tag Workflow for Deployments

Here is how the tag system maps to real deployment scenarios:

**Pre-deployment quick check (5 minutes):**
```bash
npx playwright test --grep @smoke --project=chromium --workers=4
```
Run only smoke tests on Chrome. If anything fails, block deployment. If all pass, proceed.

**Pre-release full regression (30 minutes):**
```bash
npx playwright test --grep "@smoke|@regression" --workers=8
```
Full coverage on all browsers. Run before a release goes to production.

**After a PIM code change (targeted):**
```bash
npx playwright test --grep @pim
```
Run only PIM tests. Faster feedback loop — no need to run the entire suite for a module-specific change.

**After an auth system change:**
```bash
npx playwright test --grep @auth
```
Run only auth tests immediately. Run the full suite overnight.

**Nightly E2E run:**
```bash
npx playwright test --grep "@smoke|@regression|@e2e" --workers=4
```
Everything — smoke, regression, and the slow end-to-end journeys.

**Debug a specific module on a specific browser:**
```bash
npx playwright test --grep "(?=.*@pim)(?=.*@smoke)" --project=firefox --headed
```

---

## Tags vs Annotations — The Practical Distinction

This comes up often: when do you use a tag, when do you use an annotation?

**Use a tag when you want to control execution:**
- You want to be able to run or skip this test from the CLI
- The label is about when or whether to run the test
- Examples: `@smoke`, `@regression`, `@e2e`, `@pim`, `@slow`, `@wip`

**Use an annotation when you want to add context to the report:**
- The information is for a human reading the report, not for the CLI
- The label describes what the test is about, who owns it, or what issue it relates to
- Examples: `{ type: 'issue', description: 'JIRA-42' }`, `{ type: 'owner', description: 'pim-team' }`

In practice they complement each other:

```typescript
test(
  'add employee saves with required fields',
  {
    tag: ['@smoke', '@pim'],                               // for CLI: npx playwright test --grep @smoke
    annotation: [
      { type: 'owner', description: 'pim-team' },         // for report: who owns this
      { type: 'issue', description: 'PIM-01' },           // for report: which story this covers
    ],
  },
  async ({ addEmployeePage }) => { ... }
);
```

---

## Common Mistakes with Tags

**Mistake 1 — No tag system, ad hoc tags**
```typescript
// ❌ Different engineers use different names for the same concept
test('login works @critical', ...)
test('add employee @important', ...)
test('leave apply @smoke', ...)     // smoke is the right one, but it is mixed with others
test('report @key', ...)
```
Define and document your tag taxonomy. Enforce it in code review.

**Mistake 2 — Too many tiers**
```typescript
// ❌ Too many tiers — what is the difference between @smoke, @critical, @sanity, @quick?
{ tag: ['@smoke', '@critical', '@sanity'] }
```
Pick two or three tier levels and stick to them. `@smoke`, `@regression`, `@e2e` covers almost everything.

**Mistake 3 — No module tags**
```typescript
// ❌ You can run smoke tests but cannot run "only PIM smoke tests"
{ tag: '@smoke' }

// ✅ Both dimensions give you flexibility
{ tag: ['@smoke', '@pim'] }
```
Always tag with both a tier and a module. This gives you independent filtering on two axes.

**Mistake 4 — Tagging everything as @smoke**
```typescript
// ❌ If everything is @smoke, @smoke means nothing
// The pre-deployment check now takes 45 minutes instead of 5
test('validates missing middle name @smoke', ...)
test('checks tooltip text on hover @smoke', ...)
test('verifies column sort order @smoke', ...)
```
`@smoke` should be reserved for the single most critical test per feature — the one that tells you the feature works at all. Validation details, edge cases, and UI polish belong in `@regression`.

**Mistake 5 — Forgetting to tag new tests**
Add tag verification to your PR review checklist: every new test must have at least one tier tag and one module tag. Use `--list` to audit:
```bash
# List all tests — grep for ones without @smoke or @regression or @e2e
npx playwright test --list | grep -v "@smoke\|@regression\|@e2e"
```

---

## Key Points

- Tags are labels for filtering — they have no effect on how the test runs
- Two syntax options: `{ tag: ['@smoke', '@pim'] }` in details object (recommended) or `@smoke @pim` in the title
- The `@` prefix is a convention — use it consistently; it makes grep patterns unambiguous
- Build a two-layer system: tier tags (`@smoke`, `@regression`, `@e2e`) + module tags (`@pim`, `@auth`, `@leave`)
- `--grep @smoke` — OR logic; runs all smoke tests
- `--grep "@smoke|@regression"` — pipe for OR; runs smoke or regression
- `--grep "(?=.*@smoke)(?=.*@pim)"` — lookahead for AND; runs tests with both tags
- `--grep-invert @e2e` — excludes matching tests
- `grep` and `grepInvert` can be set in `playwright.config.ts` as defaults
- Project-level `grep` — different projects can have different default tag filters
- `--list --grep @smoke` — verify which tests match before running
- Tags appear in HTML report (filterable), JSON output (parseable), and JUnit XML
- Tags vs annotations: tags control execution, annotations add context to reports
- Common mistakes: no taxonomy, too many tier levels, no module tags, overusing @smoke, forgetting to tag new tests
