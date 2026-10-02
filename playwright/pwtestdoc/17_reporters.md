# 17 — Reporters

## The Scenario

Your suite runs overnight. 200 tests. 3 browsers. 600 total executions. You arrive in the morning to find 12 failures.

Without a reporter, you have a terminal log that has scrolled off the screen. You know 12 tests failed. You do not know which ones, which browsers they failed on, how long they took, whether they were retried, or what the page looked like when they failed.

With the right reporters configured, you open the HTML report, see exactly which 12 tests failed, click on each one, see the screenshot from the moment of failure, see the trace showing every action leading up to it, and see the full error message with stack trace — all in a single browser tab. The investigation that would have taken 45 minutes takes 5.

Reporters are not just output formatting. They are how your test results become useful information.

---

## What Reporters Are

A reporter is a plugin that receives events from the Playwright test runner and produces output — a file, a terminal display, or both. Every time a test starts, passes, fails, or retries, the reporter receives that event and records it.

Multiple reporters can run simultaneously. You can have an HTML report being built while the terminal shows live test progress while a JUnit XML file is being written for your CI tool.

Reporters are configured in `playwright.config.ts`:

```typescript
export default defineConfig({
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'on-failure' }],
    ['junit', { outputFile: 'results/junit.xml' }],
    ['list'],
  ],
});
```

Each reporter entry is an array: `[reporter-name, options]`. Options are optional.

---

## Built-in Reporters

### HTML Reporter — The Primary Debugging Tool

The HTML reporter generates an interactive web-based report. It is the richest, most useful report Playwright produces and should be configured for every project.

```typescript
reporter: [
  ['html', {
    outputFolder: 'playwright-report',  // where to save the report
    open: 'on-failure',                 // when to open it automatically
  }],
],
```

**`open` options:**
- `'always'` — opens after every run
- `'on-failure'` — opens only when tests fail (recommended for local development)
- `'never'` — never opens automatically (recommended for CI)

**What the HTML report shows:**

For each test:
- Pass / fail / flaky / skipped status
- Duration
- Retry attempts with individual results
- Error message and stack trace
- Screenshot (if configured)
- Video (if configured)
- Trace viewer link (if trace was recorded)
- Tags and annotations
- Steps (if test steps were used)
- `beforeEach` and `afterEach` durations

Filtering options in the report UI:
- By status (passed, failed, flaky, skipped)
- By project (chromium, firefox, webkit)
- By tag
- By duration

```bash
# Open the report manually after a run
npx playwright show-report

# Open from a specific folder
npx playwright show-report playwright-report
```

**The trace viewer** is embedded in the HTML report. When a trace was captured, you click "Trace" on a failed test and an interactive timeline opens — showing every action, DOM snapshot, network request, and console log from the test run. You can click on any action and see exactly what the browser looked like at that moment.

---

### List Reporter — Live Terminal Feedback

The list reporter prints each test result to the terminal as tests complete. It shows the project name, file path, test title, duration, and status.

```typescript
reporter: [['list']],
```

Terminal output:
```
  ✅ [chromium] › leave/apply-leave.spec.ts:8 › Apply Leave › valid request (1.2s)
  ✅ [chromium] › leave/apply-leave.spec.ts:22 › Apply Leave › past date rejected (0.9s)
  ❌ [firefox] › pim/add-employee.spec.ts:15 › Add Employee › duplicate ID error (30.0s)
  ⚠️ [chromium] › pim/employee-list.spec.ts:8 › Employee List › search results (2.1s) — passed on retry 1
```

Use list for local development. You see results as they come in — no waiting for the entire suite to finish.

---

### Dot Reporter — Compact CI Output

The dot reporter prints one character per test — `.` for pass, `F` for fail, `×` for interrupted. Nothing else until the summary at the end.

```typescript
reporter: [['dot']],
```

Terminal output:
```
..........F.....F...F..........
3 failed, 27 passed (45.2s)
```

Use dot for CI where you want minimal output. The full output is in the HTML report — the terminal just needs to show whether the run passed or failed.

---

### Line Reporter

Like list but more compact — one line per test, updates in place rather than scrolling. Useful when you want live feedback but the list reporter's scrolling output is too noisy.

```typescript
reporter: [['line']],
```

---

### JUnit XML Reporter — CI Tool Integration

The JUnit XML reporter generates an XML file in the standard JUnit format. Every CI tool that understands test results — Jenkins, Azure DevOps, GitLab CI, CircleCI, GitHub Actions — can parse this format and display test results natively.

```typescript
reporter: [
  ['junit', { outputFile: 'results/junit.xml' }],
],
```

```xml
<!-- Example JUnit XML output -->
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Apply Leave" tests="3" failures="1" time="4.2">
    <testcase name="valid request submits successfully" time="1.2" classname="leave/apply-leave.spec.ts">
    </testcase>
    <testcase name="past date is rejected" time="0.9" classname="leave/apply-leave.spec.ts">
    </testcase>
    <testcase name="overlapping request is rejected" time="2.1" classname="leave/apply-leave.spec.ts">
      <failure message="Timeout 30000ms exceeded">
        Error: locator.click: Timeout 30000ms exceeded
          at apply-leave.spec.ts:38
      </failure>
    </testcase>
  </testsuite>
</testsuites>
```

Annotations you add with `test.info().annotations.push()` appear as `<properties>` in the JUnit output — visible in Azure DevOps and Jenkins alongside the test result.

---

### JSON Reporter — Custom Dashboards and Integrations

The JSON reporter outputs the complete test run data as a JSON file. Use it when you need to build a custom dashboard, send results to an external service, or process results programmatically.

```typescript
reporter: [
  ['json', { outputFile: 'results/report.json' }],
],
```

The JSON structure:
```json
{
  "suites": [...],
  "stats": {
    "startTime": "2026-03-05T08:00:00.000Z",
    "duration": 45200,
    "expected": 197,
    "unexpected": 3,
    "flaky": 1,
    "skipped": 2
  },
  "errors": []
}
```

Each test entry includes title, status, duration, retry count, tags, annotations, and error details. Parse this in a Node.js script to feed results into Slack, Jira, or a custom metrics database.

---

### GitHub Actions Reporter

The GitHub reporter formats output specifically for GitHub Actions — producing annotations that appear inline on the pull request diff when tests fail.

```typescript
reporter: [['github']],
```

When a test fails, GitHub Actions shows the failure annotation directly on the relevant line of code in the PR review. Reviewers see test failures without opening the workflow logs.

Use this only when running in GitHub Actions. For other CI platforms, use the appropriate reporter or JUnit XML.

---

### Blob Reporter — Merging Results from Multiple Shards

The blob reporter outputs a binary file containing the full test run data. It is designed for large suites that run on multiple CI machines (shards) — each shard produces a blob file, and they are merged into a single HTML report afterwards.

```typescript
// On each CI shard
reporter: [['blob', { outputDir: 'blob-report' }]],
```

```bash
# After all shards complete — merge all blobs into one HTML report
npx playwright merge-reports --reporter html ./blob-reports
```

This is an advanced pattern for very large suites. If your suite runs in under 30 minutes on a single machine, you do not need sharding or blob reports.

---

## Configuring Multiple Reporters

All reporters run simultaneously. Configure the combination appropriate for your context:

### Local Development

```typescript
reporter: [
  ['html', { open: 'on-failure' }],  // rich report, opens if something fails
  ['list'],                           // live terminal feedback during the run
],
```

### CI

```typescript
reporter: process.env.CI
  ? [
      ['html', { open: 'never' }],          // build the report, do not open it
      ['junit', { outputFile: 'results/junit.xml' }],  // for CI tool integration
      ['github'],                            // inline PR annotations on GitHub
    ]
  : [
      ['html', { open: 'on-failure' }],
      ['list'],
    ],
```

This pattern uses `process.env.CI` (automatically set by most CI platforms) to switch reporter sets. Locally you get live feedback. On CI you get the artefacts the CI tool needs.

### Full Combination

```typescript
reporter: [
  ['html', { outputFolder: 'playwright-report', open: 'on-failure' }],
  ['json', { outputFile: 'results/report.json' }],
  ['junit', { outputFile: 'results/junit.xml' }],
  ['list'],
],
```

All four simultaneously — HTML for debugging, JSON for dashboards, JUnit for CI integration, list for live terminal output.

---

## Custom Reporters

When built-in reporters do not meet your needs, you can write a custom reporter. A reporter is a TypeScript class that implements the `Reporter` interface — a set of methods Playwright calls at each point in the test lifecycle.

```typescript
// reporters/slack-reporter.ts
import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';

class SlackReporter implements Reporter {
  private failures: string[] = [];

  onBegin(config: FullConfig, suite: Suite) {
    const total = suite.allTests().length;
    console.log(`Starting ${total} tests across ${config.projects.length} projects`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed') {
      // Collect failure details for the summary message
      this.failures.push(
        `❌ ${test.titlePath().join(' > ')} (${result.duration}ms)\n   ${result.error?.message ?? 'Unknown error'}`
      );
    }
  }

  async onEnd(result: FullResult) {
    if (this.failures.length === 0) {
      await this.postToSlack('✅ All tests passed');
      return;
    }

    const message = [
      `❌ ${this.failures.length} test(s) failed`,
      '',
      ...this.failures,
    ].join('\n');

    await this.postToSlack(message);
  }

  private async postToSlack(message: string) {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
  }
}

export default SlackReporter;
```

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html'],
    ['./reporters/slack-reporter.ts'],  // path to your custom reporter
  ],
});
```

### Reporter Interface Methods

```typescript
interface Reporter {
  onBegin(config: FullConfig, suite: Suite): void
  // Called once at the start of the run

  onTestBegin(test: TestCase, result: TestResult): void
  // Called when each test starts

  onStepBegin(test: TestCase, result: TestResult, step: TestStep): void
  // Called when each test step starts

  onStepEnd(test: TestCase, result: TestResult, step: TestStep): void
  // Called when each test step ends

  onTestEnd(test: TestCase, result: TestResult): void
  // Called when each test finishes — use this to react to pass/fail

  onEnd(result: FullResult): Promise<void> | void
  // Called once at the end of the run — use for summary reporting

  onError(error: TestError): void
  // Called when an error occurs outside a test (e.g. in globalSetup)
}
```

You only need to implement the methods you care about. Everything else has an empty default implementation.

---

## Accessing Reporters in CI

### GitHub Actions

```yaml
# .github/workflows/playwright.yml
- name: Run Playwright tests
  run: npx playwright test
  env:
    CI: true

- name: Upload HTML report
  uses: actions/upload-artifact@v4
  if: always()  # upload even if tests failed
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

The `if: always()` ensures the report is uploaded even when the test step fails — otherwise you would have no report when you need it most.

To view the report: download the artefact from the GitHub Actions run page, extract it, and open `index.html` in a browser.

### Azure DevOps

```yaml
- task: PowerShell@2
  displayName: 'Run Playwright tests'
  inputs:
    script: 'npx playwright test'

- task: PublishTestResults@2
  displayName: 'Publish JUnit results'
  condition: always()
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: 'results/junit.xml'

- task: PublishPipelineArtifact@1
  displayName: 'Upload HTML report'
  condition: always()
  inputs:
    targetPath: 'playwright-report'
    artifact: 'playwright-report'
```

Azure DevOps parses the JUnit XML and shows test results in the Tests tab of the pipeline run. Failed tests link to the error message and annotations appear alongside.

### GitLab CI

```yaml
playwright:
  script:
    - npx playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
      - results/junit.xml
    reports:
      junit: results/junit.xml
    expire_in: 30 days
```

---

## A Complete Reporter Setup for OrangeHRM

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({

  reporter: process.env.CI
    ? [
        // CI: generate all artefacts, do not open anything
        ['html', {
          outputFolder: 'playwright-report',
          open: 'never',
        }],
        ['junit', {
          outputFile: 'results/junit.xml',
        }],
        ['json', {
          outputFile: 'results/report.json',
        }],
        // Use 'github' on GitHub Actions, 'dot' on other CI
        process.env.GITHUB_ACTIONS ? ['github'] : ['dot'],
      ]
    : [
        // Local: live feedback + HTML report on failure
        ['html', {
          outputFolder: 'playwright-report',
          open: 'on-failure',
        }],
        ['list'],
      ],

  use: {
    // Evidence collection — feeds into the HTML report
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

});
```

---

## Key Points

- Reporters receive events from the test runner and produce output — multiple reporters run simultaneously
- Configure reporters in `playwright.config.ts` under `reporter` as an array of `[name, options]` pairs
- HTML reporter — the richest debugging tool; shows screenshots, videos, traces, steps, annotations per test; always configure it
- `open: 'on-failure'` locally, `open: 'never'` on CI — the standard pattern
- `npx playwright show-report` — opens the HTML report; `npx playwright show-trace` — opens a specific trace
- List reporter — live terminal feedback as tests run; use locally
- Dot reporter — compact terminal output; use on CI where terminal noise is unwanted
- JUnit reporter — standard XML format consumed by Jenkins, Azure DevOps, GitLab, CircleCI; use on CI
- JSON reporter — complete run data as a JSON file; use for custom dashboards or integrations
- GitHub reporter — inline PR annotations on GitHub Actions; use only in GitHub Actions
- Blob reporter — for sharded runs across multiple CI machines; merge blobs with `npx playwright merge-reports`
- Custom reporters implement the `Reporter` interface — `onBegin`, `onTestEnd`, `onEnd` are the most commonly used methods
- Always use `if: always()` / `condition: always()` when uploading report artefacts in CI — otherwise failures suppress the report
- `process.env.CI` pattern — switch reporter configuration between local and CI without separate config files
- Annotations pushed with `test.info().annotations.push()` appear in HTML report, JSON output, and JUnit XML `<properties>`
