# Chapter 15: Reporters & CI Integration (Complete Guide)



## The Concept of Reporters & CI/CD

Automation provides no value if the results aren't visible or if they only run on your local machine. **Reporters** translate technical execution into actionable results, and **CI/CD Integration** ensures those results are generated automatically with every code change.

**Purpose**: This chapter covers how to generate rich HTML reports and how to integrate Playwright into a GitHub Actions pipeline.

**Why is it required?**
1. **Visibility**: To provide stakeholders (PMs, Leads) with clear evidence of test outcomes.
2. **Quality Gate**: To prevent broken code from being merged into production by running tests automatically on every PR.
3. **Historical Data**: To track test performance and reliability over time.

### Reporting Philosophy

A good report answers three questions immediately:
1. Did we pass?
2. If not, what failed?
3. Why did it fail (Logs/Screenshots/Trace)?

---

## Built-In Reporters

Playwright allows multiple reporters simultaneously.

```typescript
// playwright.config.ts
reporter: [
  ['list'], // Console output
  ['html', { open: 'never' }], // The full debugging web-app
  ['junit', { outputFile: 'results.xml' }], // For CI Parsers
  ['github'], // Annotations on Pull Requests
],
```

### The HTML Reporter

The **HTML Reporter** is the gold standard. It is a self-contained static site.
- **Filtering**: Filter by status, browser, or text.
- **Trace Viewer**: Embedded deeply. Click a failed test -> Click "Trace" -> Inspect DOM.

---

## Custom Reporters

Sometimes you need to send results to Slack, Teams, or DataDog.

```typescript
import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

class MySlackReporter implements Reporter {
  onBegin(config, suite) {
    console.log(`Starting run with ${suite.allTests().length} tests`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed') {
      console.log(`Test Failed: ${test.title}`);
      // sendToSlack(test.title);
    }
  }

  onEnd(result: FullResult) {
    console.log(`Finished with status: ${result.status}`);
  }
}
export default MySlackReporter;
```

---

## CI/CD Strategy (GitHub Actions)

A robust pipeline includes **Installation**, **Caching**, **Execution**, and **Artifact Upload**.

```yaml
name: Playwright Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: 18 }
        
      - name: Install Deps
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Tests
        run: npx playwright test

      - name: Upload Report
        if: always() # Run even if tests fail!
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Merging Sharded Reports

When using Sharding (Ch. 19), you get 4 different reports. You must merge them.

1. **Reporters**: Use the `blob` reporter in config. `reporter: [['blob']]`.
2. **Artifacts**: Each shard uploads its `blob-report` directory.
3. **Merge Job**: Download all blobs and run the merge command.

```bash
# In the merge job
npx playwright merge-reports --reporter html ./all-blob-reports
```

This generates a **Single HTML Report** containing tests from all 4 machines.

---

## Advanced CI/CD Patterns (GitHub Actions)

### 1. Matrix Strategy (Parallel Testing)
Running tests across multiple operating systems and browser engines simultaneously.

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps ${{ matrix.browser }}
      - name: Run tests
        run: npx playwright test --project=${{ matrix.browser }}
```

### 2. Playwright Sharding
Split your test suite across multiple machines for extreme speed.

```yaml
strategy:
  matrix:
    shardIndex: [1, 2, 3, 4]
    shardTotal: [4]
steps:
  - name: Run Shard
    run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

### 3. Caching for Speed
Save 2-3 minutes per run by caching dependencies and browser binaries.

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v3
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}

- name: Install Playwright browsers
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps
```

---

## Industry Standard Reporting: Allure

While Playwright's HTML report is great, **Allure** is the preferred choice for enterprise dashboards.

### Installation
```bash
npm install --save-dev allure-playwright allure-commandline
```

### Configuration (`playwright.config.ts`)
```typescript
reporter: [
  ['html'],
  ['allure-playwright', { outputFolder: 'allure-results' }]
]
```

### Allure Steps for Readability
```typescript
test('login flow', async ({ page }) => {
  await test.step('Enter credentials', async () => {
    await page.fill('#user', 'admin');
    await page.fill('#pass', '1234');
  });
});
```

---

## Best Practices
| Strategy | Implementation | Benefit |
|----------|----------------|---------|
| **Sharding** | `--shard=x/y` | Linear reduction in execution time. |
| **Caching** | `actions/cache` | Significantly faster feedback loops in CI. |
| **Artifacts** | `retention-days: 7` | Saves storage costs on GitHub/AWS. |
| **Allure** | `allure-playwright` | Stakeholder-friendly visual reports. |
**Summary**: You've moved beyond basic reporting to advanced CI/CD patterns like sharding, matrix execution, and industry-standard Allure dashboards. The next chapter covers how to make your tests data-driven and handle complex test states.
