# Chapter 19 — CI/CD Integration

---

## What You Will Learn

- How to run Playwright API tests in GitHub Actions
- How to handle environment secrets in CI
- How to use test sharding for parallel execution
- How to configure retries and test reporting

---

## 19.1 Basic GitHub Actions Workflow

Create `.github/workflows/api-tests.yml`:

```yaml
name: API Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: employee-tests/package-lock.json

      - name: Install API server dependencies
        run: |
          cd employee-api
          npm ci

      - name: Start API server
        run: |
          cd employee-api
          node server.js &
          npx wait-on http://localhost:3000/employees --timeout 30000

      - name: Install Playwright and dependencies
        run: |
          cd employee-tests
          npm ci
          npx playwright install --with-deps chromium

      - name: Run API tests
        run: |
          cd employee-tests
          npx playwright test
        env:
          BASE_URL:       http://localhost:3000
          API_KEY:        ${{ secrets.API_KEY }}
          TEST_USERNAME:  ${{ secrets.TEST_USERNAME }}
          TEST_PASSWORD:  ${{ secrets.TEST_PASSWORD }}

      - name: Upload test results
        if: always()   # upload even when tests fail
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: employee-tests/playwright-report/
          retention-days: 7
```

---

## 19.2 Waiting for the Server to Start

```bash
npm install -D wait-on
```

`wait-on` polls the URL until the server responds. This prevents tests from starting before the server is ready.

```yaml
- name: Start API server and wait
  run: |
    cd employee-api
    node server.js &
    npx wait-on http://localhost:3000 --timeout 30000
```

---

## 19.3 Test Sharding

Sharding splits the test suite across multiple parallel CI jobs. Each job runs a subset of the tests. All subsets finish in parallel — reducing total runtime.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]   # 4 shards = 4 parallel jobs

    steps:
      # ... setup steps ...

      - name: Run API tests (shard ${{ matrix.shard }} of 4)
        run: |
          cd employee-tests
          npx playwright test --shard=${{ matrix.shard }}/4
```

Sharding is useful when the test suite takes more than 2–3 minutes to run. Each shard runs about 25% of the tests. Total runtime drops from 20 minutes to about 5 minutes.

---

## 19.4 Retries on Failure

Flaky tests — tests that sometimes pass and sometimes fail — are common in CI. Network latency, server startup timing, and test isolation issues can all cause flakiness. Retries give flaky tests a second chance.

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  retries: process.env.CI ? 2 : 0,   // 2 retries in CI, 0 locally
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
});
```

A test that passes on the second or third attempt is marked as flaky in the report — not as failed. This keeps CI green while flagging tests that need attention.

---

## 19.5 HTML Test Report

Playwright generates a detailed HTML report by default. It shows passed, failed, and flaky tests with full request/response details for each failure.

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],   // also print to console during CI runs
  ],
});
```

Access the report locally:

```bash
npx playwright show-report
```

In CI, the report is uploaded as an artifact and can be downloaded from the GitHub Actions run page.

---

## 19.6 Secrets Management

Never put secrets in workflow files. Use GitHub repository secrets.

**In GitHub:** Settings → Secrets and Variables → Actions → New repository secret

**In the workflow:**

```yaml
env:
  API_KEY:       ${{ secrets.API_KEY }}
  TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
```

**In the test:**

```typescript
const apiKey = process.env.API_KEY;
```

Secrets are injected as environment variables at runtime. They are not visible in logs.

---

## Interview Questions — Chapter 19

**Q1. How do you start the API server before Playwright runs in CI?**

Use a background process (`node server.js &`) and then use `wait-on` to poll the health check URL until the server responds. Without `wait-on`, Playwright may start before the server is ready, causing all tests to fail with connection refused errors.

**Q2. What is test sharding in Playwright and why is it useful in CI?**

Sharding splits the test suite across multiple parallel CI jobs. Each job runs `npx playwright test --shard=N/total`. A 100-test suite split across 4 shards runs 25 tests per job. All 4 jobs run simultaneously — reducing total CI time to roughly one quarter. Sharding is the most effective way to speed up large test suites.

**Q3. What is the `retries` config option and when should you use it?**

`retries: 2` tells Playwright to retry a failed test up to 2 times before marking it as failed. Set it to a non-zero value only in CI — locally, retries hide flakiness. In CI, retries let genuinely flaky tests pass without failing the build, while still flagging them as flaky in the report. Tests that consistently fail are still reported as failed.

**Q4. How do you pass secrets from GitHub Actions to your Playwright tests?**

Store the secret in GitHub repository settings under Secrets. Reference it in the workflow as `${{ secrets.SECRET_NAME }}`. Pass it to the test step as an environment variable. The test reads it from `process.env.SECRET_NAME`. The secret value is never visible in workflow logs.

**Q5. Where does Playwright store test results and how do you view them after a CI run?**

Playwright generates an HTML report in the `playwright-report/` folder. In CI, upload this folder as an artifact using `actions/upload-artifact`. After the run, download the artifact from the GitHub Actions run page and open `index.html` in a browser, or run `npx playwright show-report` pointing at the downloaded folder.

**Q6. Why use `if: always()` on the upload-artifact step?**

Without `if: always()`, the artifact upload step only runs when all previous steps succeed. If tests fail, the upload is skipped — and you lose the report that would help you understand why the tests failed. `if: always()` ensures the report is uploaded regardless of whether tests passed or failed.

---
