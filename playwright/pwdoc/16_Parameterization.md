# Chapter 16: Parameterization & Annotations (Complete Guide)

## The Concept of Parameterization

Efficiency in automation means writing code once and running it with multiple sets of data. Instead of creating ten separate tests for ten different login scenarios, **Parameterization** allows you to create a single test template that iterates over a dataset.

**Purpose**: This chapter teaches you how to generate tests dynamically from arrays, JSON, or CSV files, and how to use Annotations to manage test metadata.

**Why is it required?**
1. **Maintenance**: To avoid "Copy-Paste" syndrome where a single bug requires updating dozens of identical test blocks.
2. **Data-Driven Testing**: To verify various edge cases (special characters, long strings, boundary values) using a centralized data source.
3. **Readability**: To keep the test suite clean by focusing on the logic rather than the repetition of boilerplate code.

## The Case for Parameterization

Don't copy-paste tests. If you have a Login form, and you want to test 10 invalid inputs (empty email, bad password, sql injection, etc.), writing 10 `test('...')` blocks is tedious and unmaintainable.

**Parameterization** generates tests dynamically.

---

## Basic Iteration

The simplest form is iterating over an array.

**Important**: The `test()` call must be *inside* the loop.

```typescript
import { test, expect } from '@playwright/test';

const inputs = ['user', 'admin', 'guest'];

for (const role of inputs) {
  // Use template literals to make titles unique
  test(`login logic for ${role}`, async ({ page }) => {
    // ... test logic
  });
}
```

*Note: If titles are not unique, Playwright will error.*

---

## External Data Sources (CSV/JSON)

For large datasets, keep data out of your code files.

### Using CSV

```typescript
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// synchronized read is fine at top-level scope (happens at collection time)
const records = parse(fs.readFileSync(path.join(__dirname, 'data/users.csv')), {
  columns: true,
  skip_empty_lines: true
});

for (const record of records) {
  test(`verify user ${record.id}`, async ({ page }) => {
    console.log(record.email, record.password);
    // ...
  });
}
```

---

## Understanding Test Annotations

Annotations signal intent to the runner.

### `test.skip()` vs `test.fixme()` vs `test.fail()`

| Annotation | Behavior | Use Case |
|------------|----------|----------|
| `test.skip()` | Does not run. Report shows "Skipped". | Feature not implemented yet, or irrelevant context. |
| `test.fixme()` | Same as skip. | Signal that the test is *broken* and needs repair. |
| `test.fail()` | Runs. **Passes only if the code fails.** | Known bug in product. You want the test to be Green (because the bug exists) but Red if the bug gets fixed silently. |

### Dynamic Annotation

Skipping based on conditions inside the test.

```typescript
test('mobile only feature', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'This test is only for mobile viewports');
  // ...
});
```

---

## Mastering Tags (`@tags`)

Tags allow granular filtering of test runs.

**Syntax**: Add `@string` to the test title.

```typescript
test('checkout fast @smoke', async ({ page }) => { ... });
test('checkout complete @regression @slow', async ({ page }) => { ... });
```

**Running them:**

```bash
# Run only smoke
npx playwright test --grep @smoke

# Run smoke OR sanity
npx playwright test --grep "@smoke|@sanity"

# Run everything EXCEPT slow
npx playwright test --grep-invert @slow
```

---

## Conditional Execution

Sometimes you want to skip an entire *group* of tests based on project config.

```typescript
test.describe('Chromium Specific', () => {
  // Conditional describe
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only!');

  test('feature A', async () => {});
  test('feature B', async () => {});
});
```

### Custom Annotations (Metadata)

You can attach data for your reporters (e.g., Jira Ticket IDs).

```typescript
test('bug fix verification', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://jira.company.com/browse/QA-123'
  });
  // ...
});
```

---

## Best Practices

| Tip | Explanation |
|-----|-------------|
| **Unique Titles** | When parameterized, ensure `${variable}` is in the title. Otherwise, you get "Duplicate test title" errors. |
| **Fail vs Fixme** | Use `fail` for *product* bugs (bug report exists). Use `fixme` for *test* bugs (script is broken). |
| **Avoid Logic** | Don't put complex `if` logic inside the test body. Use `test.skip` to early exit. |
| **Tags Strategy** | Define a standard list (`@smoke`, `@e2e`, `@api`) so team members know what to use. |

**Summary**: You've learned how to make your tests data-driven and how to control test execution using annotations and tags. The next chapter covers how to scale these tests by running them in parallel and sharding them across machines.
