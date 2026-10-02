# 12 — Configuring and Executing Cucumber Tests

## Overview

Cucumber reads its configuration from `cucumber.json` and executes tests via the
`cucumber-js` CLI. This file covers all the ways to configure and run your tests —
from a single scenario to a full CI pipeline run.

---

## cucumber.json — Full Configuration Reference

`cucumber.json` lives at the project root. It supports multiple named profiles.
The `default` profile runs when you call `cucumber-js` with no arguments.

```json
{
  "default": {
    "paths": ["features/**/*.feature"],
    "require": [
      "support/world.ts",
      "support/hooks.ts",
      "steps/**/*.ts"
    ],
    "requireModule": ["ts-node/register"],
    "format": [
      "progress-bar",
      "html:reports/cucumber-report.html",
      "json:reports/cucumber-report.json"
    ],
    "formatOptions": {
      "snippetInterface": "async-await"
    },
    "publishQuiet": true,
    "parallel": 2
  },

  "smoke": {
    "paths": ["features/**/*.feature"],
    "require": [
      "support/world.ts",
      "support/hooks.ts",
      "steps/**/*.ts"
    ],
    "requireModule": ["ts-node/register"],
    "tags": "@smoke",
    "format": ["progress-bar"],
    "publishQuiet": true
  },

  "ci": {
    "paths": ["features/**/*.feature"],
    "require": [
      "support/world.ts",
      "support/hooks.ts",
      "steps/**/*.ts"
    ],
    "requireModule": ["ts-node/register"],
    "tags": "not @wip",
    "format": [
      "progress-bar",
      "html:reports/cucumber-report.html",
      "json:reports/cucumber-report.json",
      "junit:reports/cucumber-junit.xml"
    ],
    "formatOptions": {
      "snippetInterface": "async-await"
    },
    "publishQuiet": true,
    "parallel": 4
  }
}
```

### Key Configuration Options

| Option | Purpose | Example |
|---|---|---|
| `paths` | Where to find feature files | `"features/**/*.feature"` |
| `require` | Files to load before tests — world, hooks, steps | `"steps/**/*.ts"` |
| `requireModule` | Module loader — use `ts-node/register` for TypeScript | `"ts-node/register"` |
| `format` | Output formats | `"html:reports/report.html"` |
| `formatOptions.snippetInterface` | Format of generated step snippets | `"async-await"` |
| `tags` | Filter by tag expression | `"@smoke"`, `"not @wip"` |
| `parallel` | Number of workers for parallel execution | `2`, `4` |
| `publishQuiet` | Suppress the publish-results prompt | `true` |
| `dryRun` | Check step definitions exist without running them | `true` |
| `failFast` | Stop after the first failure | `true` |
| `retry` | Number of times to retry a failed scenario | `1`, `2` |

---

## Running Tests

### Run all tests (default profile)

```bash
npx cucumber-js
```

Or with an npm script:

```bash
npm run test:bdd
```

### Run a named profile

```bash
npx cucumber-js --profile smoke
npx cucumber-js --profile ci
```

### Run a single feature file

```bash
npx cucumber-js features/login.feature
```

### Run a specific scenario by line number

Each scenario starts at a specific line in the feature file.
Pass the line number after a colon to run only that scenario.

```bash
npx cucumber-js features/login.feature:12
```

Open the feature file, find the line where `Scenario:` starts, and use that number.

### Run by tag

```bash
npx cucumber-js --tags @smoke
npx cucumber-js --tags "@smoke or @regression"
npx cucumber-js --tags "not @wip"
npx cucumber-js --tags "@smoke and not @slow"
```

### Run a specific scenario by name

```bash
npx cucumber-js --name "Successful login with valid credentials"
```

Cucumber matches scenarios whose name contains the given string. Partial matches work.

```bash
npx cucumber-js --name "login"
# Runs all scenarios with "login" in the name
```

---

## Dry Run — Check Without Executing

A dry run checks that every step in every feature file has a matching step definition.
No browser opens and no steps execute. It is fast and useful before a full run.

```bash
npx cucumber-js --dry-run
```

Output when all steps are defined:
```
50 scenarios (50 skipped)
200 steps (200 skipped)
```

Output when steps are missing:
```
? Given I am on the time management page
    Undefined. Implement with the following snippet:

      Given('I am on the time management page', async function () {
        return 'pending';
      });
```

Use dry run:
- After writing a new feature file to check all steps are covered
- Before a release to verify nothing is broken in the Gherkin/step connection
- In CI as a fast pre-check before the full browser run

Add it as an npm script:
```json
{
  "scripts": {
    "test:bdd:dryrun": "cucumber-js --dry-run"
  }
}
```

---

## Fail Fast — Stop on First Failure

```bash
npx cucumber-js --fail-fast
```

Cucumber stops after the first failing scenario. Useful during development when you
want fast feedback on a specific failure without waiting for all scenarios to complete.

---

## Retry — Re-run Flaky Scenarios

```bash
npx cucumber-js --retry 2
```

A failing scenario is retried up to 2 times before being marked as failed.
Use this for scenarios that are occasionally flaky due to timing or network issues.

Only use retry as a last resort — flaky tests should be fixed, not hidden.

You can also retry only tagged scenarios:

```bash
npx cucumber-js --retry 2 --retry-tag-filter @flaky
```

---

## Parallel Execution

Run scenarios across multiple worker processes at the same time.

```bash
npx cucumber-js --parallel 4
```

This runs 4 scenarios simultaneously across 4 workers.

### Important rules for parallel execution

Each worker gets its own World instance and its own browser. Steps within one scenario
still run sequentially. Only separate scenarios run in parallel.

For parallel execution to work reliably:

- Each scenario must be fully independent — no shared state between scenarios
- Test data must not conflict — if two scenarios create an employee named "John Smith"
  at the same time, they may interfere with each other
- Use unique test data — generate unique names with timestamps or random IDs

```typescript
// Good — unique employee name per scenario
const employeeName = `TestUser_${Date.now()}`;
await this.employeePage.addEmployee(employeeName);
```

---

## Environment Variables

Pass environment variables to control behaviour at runtime.

```bash
BASE_URL=https://staging.orangehrmlive.com npm run test:bdd
HEADLESS=false npm run test:bdd
```

Read them in your hooks or World:

```typescript
// support/hooks.ts
Before(async function(this: PlaywrightWorld) {
  this.context = await browser.newContext({
    baseURL: process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com'
  });
  this.page = await this.context.newPage();
});
```

```typescript
// support/hooks.ts — BeforeAll
BeforeAll(async function() {
  browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false'  // headless by default
  });
});
```

Run in headed mode (browser visible):
```bash
HEADLESS=false npx cucumber-js
```

Run against staging:
```bash
BASE_URL=https://staging.example.com npx cucumber-js --profile ci
```

---

## package.json Scripts — Full Set

```json
{
  "scripts": {
    "test:bdd": "cucumber-js",
    "test:bdd:smoke": "cucumber-js --profile smoke",
    "test:bdd:ci": "cucumber-js --profile ci",
    "test:bdd:headed": "HEADLESS=false cucumber-js",
    "test:bdd:dryrun": "cucumber-js --dry-run",
    "test:bdd:tags": "cucumber-js --tags",
    "test:bdd:file": "cucumber-js features/login.feature",
    "test:bdd:parallel": "cucumber-js --parallel 4",
    "test:bdd:failfast": "cucumber-js --fail-fast"
  }
}
```

Run a specific tag using the `test:bdd:tags` script:
```bash
npm run test:bdd:tags -- @smoke
```

---

## Execution Output — Understanding the Terminal

When you run `cucumber-js`, the terminal shows a summary after the run.

```
......F..

Failures:

1) Scenario: Login with wrong password # features/login.feature:18
   ✓ Given I am on the OrangeHRM login page # steps/login.steps.ts:5
   ✓ When I enter username "Admin" and password "wrongpassword" # steps/login.steps.ts:10
   ✓ When I click the login button # steps/login.steps.ts:16
   ✗ Then I should see the error message "Invalid credentials" # steps/login.steps.ts:20
       AssertionError: expected 'Login failed. Please try again.' to contain 'Invalid credentials'

9 scenarios (1 failed, 8 passed)
36 steps (1 failed, 35 passed)
0m12.345s
```

Each `.` is a passing scenario. Each `F` is a failing one.
The failure section shows exactly which step failed and why.

---

## CI Pipeline Example — GitHub Actions

```yaml
name: BDD Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  bdd:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run smoke tests
        run: npx cucumber-js --profile smoke

      - name: Run full BDD suite
        run: npx cucumber-js --profile ci

      - name: Upload Cucumber report
        uses: actions/upload-artifact@v3
        if: always()                          # upload even if tests failed
        with:
          name: cucumber-report
          path: reports/
```

The `if: always()` on the upload step is important — it ensures the report is uploaded
even when the test run fails, so you can always see what went wrong.

---

## Summary

| Task | Command |
|---|---|
| Run all tests | `npx cucumber-js` |
| Run a named profile | `npx cucumber-js --profile smoke` |
| Run a single feature file | `npx cucumber-js features/login.feature` |
| Run a specific scenario (by line) | `npx cucumber-js features/login.feature:12` |
| Run by tag | `npx cucumber-js --tags @smoke` |
| Run by name | `npx cucumber-js --name "login"` |
| Dry run (no execution) | `npx cucumber-js --dry-run` |
| Stop on first failure | `npx cucumber-js --fail-fast` |
| Retry flaky scenarios | `npx cucumber-js --retry 2` |
| Run in parallel | `npx cucumber-js --parallel 4` |
| Run headed (visible browser) | `HEADLESS=false npx cucumber-js` |

Next: [00 — Index](./00_index.md)
