# Chapter 316 — Reporters — HTML, JSON, Allure & Custom

This chapter covers Playwright's reporter system — built-in reporters,
how to configure multiple reporters simultaneously, custom reporter
development, and CI integration patterns. Interviewers ask about reporters
to assess operational thinking: a candidate who knows how test results
flow from the runner into CI dashboards, PR annotations, and team
notifications shows production-readiness thinking beyond just writing tests.

---

## Q316.1 — What is a Playwright reporter and what does it do?

A reporter is a plugin that subscribes to events from the Playwright test
runner and produces output from them. Every time a test starts, passes,
fails, retries, or finishes, the runner fires an event. Reporters receive
those events and decide what to do with them — write an HTML file, print
to the terminal, send an XML file, post to Slack.

The key property: **multiple reporters can run simultaneously.** A single
test run can generate an HTML report for debugging, a JUnit XML file for
CI tools, a JSON file for dashboards, and live terminal output — all at once.

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html',  { open: 'on-failure' }],
    ['junit', { outputFile: 'results/junit.xml' }],
    ['json',  { outputFile: 'results/report.json' }],
    ['list'],
  ],
});
```

Each entry is `[reporter-name, options?]`. Options are optional — most
reporters work with defaults.

---

## Q316.2 — What is the HTML reporter and what does it show?

The HTML reporter generates an interactive web-based report — the richest,
most diagnostic output Playwright produces. It should be configured for
every project.

```typescript
reporter: [
  ['html', {
    outputFolder: 'playwright-report', // where the report files are saved
    open: 'on-failure',                // when to open automatically
  }],
],
```

**What it shows per test:**
- Pass / fail / flaky / skipped status with duration
- All retry attempts with individual results
- Full error message and stack trace
- Screenshot at the moment of failure
- Video recording of the test run
- Embedded trace viewer link
- Tags and annotations
- Named test steps with timing
- `beforeEach` and `afterEach` execution times

**Filtering in the report UI:** by status (passed, failed, flaky, skipped),
by project (chromium, firefox, webkit), by tag, by duration.

**`open` options:**
- `'on-failure'` — opens after the run only when tests fail (recommended locally)
- `'never'` — never opens automatically (required for CI — no GUI available)
- `'always'` — opens after every run

```bash
npx playwright show-report              # open the report from last run
npx playwright show-report playwright-report  # open from a specific folder
```

---

## Q316.3 — What is the trace viewer and how does it integrate with the HTML report?

The trace viewer is an interactive timeline embedded in the HTML report.
When a trace was recorded for a test, clicking "Trace" on that test opens
a full replay of the test execution.

The trace contains:
- A timeline of every action (click, fill, goto, etc.) with timestamps
- A DOM snapshot of the page at each action — shows exactly what the browser
  was displaying at every moment
- Network requests and responses with timing
- Console logs from the page
- Screenshots at each step

```bash
npx playwright show-trace test-results/apply-leave-chromium/trace.zip
```

You can scrub through the timeline, click any action, and see the DOM at
that exact moment. When a test fails with "element not found," opening the
trace shows whether the element was never there, appeared too late, or was
obscured by another element.

The standard CI configuration:
```typescript
use: {
  trace: 'on-first-retry',  // recorded on the first retry — investigation mode
}
```

No trace overhead for passing tests. When a test fails and retries,
a full trace is captured so you can understand the failure.

---

## Q316.4 — What are the list, dot, and line reporters and when do you use each?

**List reporter:** Prints each test result to the terminal as it completes,
with project name, file, title, duration, and status:

```typescript
reporter: [['list']],
```

```
✅ [chromium] › leave/apply-leave.spec.ts:8 › Apply Leave › valid request (1.2s)
❌ [firefox]  › pim/add-employee.spec.ts:15 › Add Employee › duplicate ID (30.0s)
⚠️ [chromium] › pim/employee-list.spec.ts:8 › Employee List › search (2.1s) — passed on retry 1
```

Use list locally. You see results as they come in and can spot failures
before the full suite finishes.

**Dot reporter:** Prints one character per test — `.` for pass, `F` for
fail. Minimal noise until the summary:

```typescript
reporter: [['dot']],
```

```
..........F.....F...F..........
3 failed, 27 passed (45.2s)
```

Use dot on CI where terminal log volume matters. The HTML report has the
details — the terminal just needs a pass/fail signal.

**Line reporter:** Similar to list but updates in place instead of
scrolling. Useful when you want live progress without a wall of output.

```typescript
reporter: [['line']],
```

---

## Q316.5 — What is the JUnit XML reporter and which CI tools consume it?

The JUnit reporter generates a `junit.xml` file in the standard JUnit format.
Every major CI tool can parse this format and display test results natively:

```typescript
reporter: [
  ['junit', { outputFile: 'results/junit.xml' }],
],
```

CI tools that consume JUnit XML: Jenkins, Azure DevOps (Tests tab),
GitLab CI (test reports), CircleCI, Bamboo, TeamCity.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Apply Leave" tests="3" failures="1" time="4.2">
    <testcase name="valid request submits" time="1.2"
              classname="leave/apply-leave.spec.ts" />
    <testcase name="past date is rejected"  time="0.9"
              classname="leave/apply-leave.spec.ts" />
    <testcase name="overlapping request rejected" time="2.1"
              classname="leave/apply-leave.spec.ts">
      <failure message="Timeout 30000ms exceeded">
        Error: locator.click: Timeout 30000ms exceeded at apply-leave.spec.ts:38
      </failure>
    </testcase>
  </testsuite>
</testsuites>
```

Annotations added with `test.info().annotations.push({ type, description })`
appear as `<properties>` elements inside the `<testcase>` — visible in
Azure DevOps and Jenkins alongside the test result status.

---

## Q316.6 — What is the JSON reporter and when do you use it?

The JSON reporter writes the complete test run data to a JSON file:

```typescript
reporter: [
  ['json', { outputFile: 'results/report.json' }],
],
```

The output includes every test with its title, status, duration, retry count,
tags, annotations, error details, and attachment metadata:

```json
{
  "stats": {
    "startTime": "2026-03-05T08:00:00.000Z",
    "duration":  45200,
    "expected":  197,
    "unexpected": 3,
    "flaky":      1,
    "skipped":    2
  },
  "suites": [ ... ]
}
```

**When to use it:** When you need to process results programmatically. A
Node.js script can read `report.json` and post failures to Slack, create
Jira tickets for new failures, feed a metrics database, or track flakiness
trends over time. The JSON reporter is the integration layer between
Playwright and external tooling.

---

## Q316.7 — What is the GitHub reporter and how does it create PR annotations?

The GitHub reporter formats output specifically for GitHub Actions. When a
test fails, it emits `::error` annotations that GitHub Actions processes
into inline comments on the pull request diff:

```typescript
reporter: [['github']],
```

In the GitHub PR, reviewers see a failure annotation directly on the relevant
line of code — without opening workflow logs. The annotation includes the
error message and a link to the failing test.

**Use only when running in GitHub Actions.** The reporter detects the
`GITHUB_ACTIONS` environment variable — in other environments it produces
no output. A common pattern:

```typescript
reporter: process.env.GITHUB_ACTIONS
  ? [['github'], ['html', { open: 'never' }]]
  : [['list'],   ['html', { open: 'on-failure' }]],
```

---

## Q316.8 — What is the blob reporter and when is it used?

The blob reporter outputs a binary file containing the full test run data.
It is designed for large suites that run on multiple CI machines (shards)
simultaneously — each shard produces a blob, and all blobs are merged
into a single HTML report at the end:

```typescript
// playwright.config.ts — used on each shard
reporter: [['blob', { outputDir: 'blob-report' }]],
```

```bash
# After all shards complete — merge into one unified HTML report
npx playwright merge-reports --reporter html ./blob-reports
```

The blob reporter is an advanced pattern for suites too large to run on
a single machine in acceptable time. For suites finishing in under 30
minutes on one machine, sharding and blob merging add complexity without
enough benefit.

---

## Q316.9 — How do you configure reporters differently for local vs CI?

Use `process.env.CI` — automatically set by most CI platforms (GitHub
Actions, GitLab CI, CircleCI, Azure DevOps):

```typescript
reporter: process.env.CI
  ? [
      ['html',  { outputFolder: 'playwright-report', open: 'never'  }],
      ['junit', { outputFile: 'results/junit.xml' }],
      ['json',  { outputFile: 'results/report.json' }],
      process.env.GITHUB_ACTIONS ? ['github'] : ['dot'],
    ]
  : [
      ['html', { outputFolder: 'playwright-report', open: 'on-failure' }],
      ['list'],
    ],
```

**Locally:** HTML opens when something fails (immediate debugging feedback),
list shows live progress during the run. No JUnit/JSON needed — no CI
tool is waiting for them.

**On CI:** HTML builds but never auto-opens (no GUI). JUnit for the CI
tool's native test reporting. JSON for downstream integrations. GitHub or
dot reporter for terminal output. The HTML report is uploaded as an
artefact to be downloaded and viewed.

---

## Q316.10 — How do you upload the HTML report as a CI artefact?

**GitHub Actions:**

```yaml
- name: Run Playwright tests
  run: npx playwright test
  env:
    CI: true

- name: Upload HTML report
  uses: actions/upload-artifact@v4
  if: always()   # ← critical: upload even when tests fail
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

**The `if: always()` is non-negotiable.** Without it, GitHub Actions
skips the upload step when the test step fails — you have no report at
exactly the moment you need it most.

**Azure DevOps:**

```yaml
- task: PublishTestResults@2
  condition: always()
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: 'results/junit.xml'

- task: PublishPipelineArtifact@1
  condition: always()
  inputs:
    targetPath: 'playwright-report'
    artifact:   'playwright-report'
```

**GitLab CI:**

```yaml
playwright:
  script:
    - npx playwright test
  artifacts:
    when: always   # ← critical: preserve even on failure
    paths:
      - playwright-report/
      - results/junit.xml
    reports:
      junit: results/junit.xml
    expire_in: 30 days
```

The pattern is the same across all three: always upload artefacts,
regardless of test outcome.

---

## Q316.11 — How do you write a custom reporter?

A custom reporter is a TypeScript class implementing the `Reporter` interface.
You only implement the methods you need — everything else has an empty default:

```typescript
// reporters/slack-reporter.ts
import type {
  Reporter, FullConfig, Suite,
  TestCase, TestResult, FullResult,
} from '@playwright/test/reporter';

class SlackReporter implements Reporter {
  private failures: string[] = [];

  onBegin(config: FullConfig, suite: Suite): void {
    const total = suite.allTests().length;
    console.log(`▶ Starting ${total} tests across ${config.projects.length} projects`);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'failed') {
      this.failures.push(
        `❌ ${test.titlePath().join(' › ')} — ${result.error?.message ?? 'unknown error'}`
      );
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    const message = this.failures.length === 0
      ? '✅ All Playwright tests passed'
      : [`❌ ${this.failures.length} test(s) failed:`, '', ...this.failures].join('\n');

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
reporter: [
  ['html'],
  ['./reporters/slack-reporter.ts'],  // path to custom reporter
],
```

The reporter runs alongside the built-in reporters. On CI, the Slack message
posts after the run whether it passes or fails.

---

## Q316.12 — What are the key Reporter interface methods and when does each fire?

```typescript
interface Reporter {
  onBegin(config: FullConfig, suite: Suite): void
  // Fires once at the very start — before any test runs
  // Use for: logging suite size, sending "run started" notifications

  onTestBegin(test: TestCase, result: TestResult): void
  // Fires when each individual test starts
  // Use for: per-test logging, timing starts

  onStepBegin(test: TestCase, result: TestResult, step: TestStep): void
  // Fires when each named test step starts (test.step())
  // Use for: granular step-level logging

  onStepEnd(test: TestCase, result: TestResult, step: TestStep): void
  // Fires when each step ends with its result
  // Use for: step duration tracking

  onTestEnd(test: TestCase, result: TestResult): void
  // Fires when each test finishes — has access to final status, duration, attachments
  // Use for: per-test result logging, collecting failures, sending per-test notifications

  onEnd(result: FullResult): Promise<void> | void
  // Fires once at the end of the entire run
  // Use for: summary reporting, Slack messages, writing custom output files

  onError(error: TestError): void
  // Fires when an error occurs outside a test (globalSetup failure, etc.)
  // Use for: alerting on infrastructure failures
}
```

For most custom reporters, only `onTestEnd` and `onEnd` are needed:
`onTestEnd` collects data per test, `onEnd` acts on the aggregate.

---

## Q316.13 — How do annotations appear in different reporters?

Annotations added with `test.info().annotations.push()` surface differently
in each reporter:

```typescript
test('apply leave @smoke', async ({ page, leavePage }) => {
  test.info().annotations.push({
    type: 'jira',
    description: 'https://jira.example.com/OHR-1234',
  });

  // ... test body
});
```

**HTML report:** Shows annotations as labelled badges on the test result
entry. The `type` becomes the badge label; `description` is the detail.
Links in the description are clickable.

**JUnit XML:** Annotations appear as `<properties>` elements inside the
`<testcase>`:
```xml
<testcase name="apply leave">
  <properties>
    <property name="jira" value="https://jira.example.com/OHR-1234"/>
  </properties>
</testcase>
```
Azure DevOps and Jenkins display these in the test result detail view.

**JSON report:** Annotations appear in the `annotations` array of each
test entry — directly parseable for automation.

**Custom reporters:** Access annotations via `test.annotations` in
`onTestEnd`. Use them to build Jira ticket links, filter notifications,
or tag dashboard entries.

---

## Q316.14 — How do screenshots, videos, and traces appear in the HTML report?

They appear as attachments on each test entry, collected from `use` settings:

```typescript
use: {
  screenshot: 'only-on-failure',   // ← attached when a test fails
  video:      'retain-on-failure', // ← attached when a test fails all retries
  trace:      'on-first-retry',    // ← attached when a test fails and is retried
},
```

In the HTML report, a failed test shows:
- **Screenshot** — image thumbnail; click to view full size
- **Video** — inline video player showing the full test run
- **Trace** — "View trace" button that opens the trace viewer timeline

For tests that fail and are retried, the report shows attachments per
attempt — screenshot from attempt 1, screenshot from attempt 2, etc. —
labelled by attempt number. Comparing screenshots across attempts shows
whether the failure was consistent or changed between retries.

Custom attachments added with `test.info().attach()` also appear in the
HTML report under the test's "Attachments" section.

---

## Q316.15 — How do you track flakiness trends using the JSON reporter?

The JSON reporter captures `"flaky"` status for any test that passed on
retry. Read `report.json` after each CI run to extract and store the
flakiness data:

```typescript
// scripts/track-flakiness.ts
import * as fs from 'fs';

interface TestStat {
  title: string[];
  status: 'passed' | 'failed' | 'flaky' | 'skipped';
  retry?: number;
}

function extractFlaky(reportPath: string): TestStat[] {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  const flaky: TestStat[] = [];

  function walk(suite: any) {
    for (const test of suite.tests ?? []) {
      if (test.status === 'flaky') {
        flaky.push({ title: test.titlePath, status: 'flaky' });
      }
    }
    for (const child of suite.suites ?? []) walk(child);
  }

  for (const suite of report.suites) walk(suite);
  return flaky;
}

const flaky = extractFlaky('results/report.json');
console.log(`Flaky tests this run: ${flaky.length}`);
flaky.forEach(t => console.log(`  ⚠️  ${t.title.join(' › ')}`));
```

Run this script after each CI run and store the results. Over time you
build a flakiness leaderboard: tests that appear most frequently in the
flaky list are the highest-priority candidates for investigation and fixing.

---

## Q316.16 — What is the complete reporter setup for a production OrangeHRM suite?

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({

  reporter: process.env.CI
    ? [
        // CI: generate all artefacts, never auto-open
        ['html',  { outputFolder: 'playwright-report', open: 'never' }],
        ['junit', { outputFile: 'results/junit.xml' }],
        ['json',  { outputFile: 'results/report.json' }],
        // GitHub-specific annotations; dot for other CI platforms
        process.env.GITHUB_ACTIONS ? ['github'] : ['dot'],
        // Custom Slack notification (see Q39.11)
        ['./reporters/slack-reporter.ts'],
      ]
    : [
        // Local: live feedback + HTML report on failure only
        ['html',  { outputFolder: 'playwright-report', open: 'on-failure' }],
        ['list'],
      ],

  use: {
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
    trace:      'on-first-retry',
  },

  // ... projects, workers, retries, etc.
});
```

And in GitHub Actions:

```yaml
- name: Run Playwright Tests
  run: npx playwright test
  env:
    CI: true
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

- name: Upload HTML report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

---

## Q316.17 — How does the GitHub Actions reporter differ from JUnit for PR integration?

**JUnit reporter:** Generates an XML file. GitHub Actions can parse JUnit
XML natively with third-party actions (e.g., `mikepenz/action-junit-report`)
or the newer built-in test reporting features. The test results appear in
the "Summary" tab of the workflow run, not inline on the PR diff.

**GitHub reporter:** Uses GitHub Actions' annotation API directly, emitting
`::error file=...,line=...,col=...,title=...::message` commands that
GitHub Actions interprets as PR inline comments. The failure annotation
appears directly on the line of code in the PR diff view.

In practice, use both:
```typescript
reporter: process.env.CI
  ? [
      ['github'],  // inline PR annotations
      ['junit', { outputFile: 'results/junit.xml' }],  // workflow summary
      ['html',  { open: 'never' }],  // downloadable artefact
    ]
  : [['list'], ['html', { open: 'on-failure' }]],
```

Reviewers get inline annotations without opening the workflow run.
The team gets a full report as a downloadable artefact. The JUnit
summary provides the test count overview in the workflow summary tab.

---

## Q316.18 — What is the most impactful reporter change you have made in a project?

The most impactful was adding the JSON reporter and a flakiness tracking
script to a project that had been running with only the HTML reporter.

Before: the team knew the suite had flaky tests — they could see "passed
on retry" in the HTML report — but nobody knew which tests were flaky
most often. The HTML report is human-readable but not machine-parseable
for trends.

After: the JSON reporter output `report.json` on every CI run. A 30-line
Node.js script read the file, extracted every test with `status: 'flaky'`,
and appended the data to a local `flakiness-log.json`. After four weeks,
the log showed:

```
employee search › returns results:    flaky on 23 of 80 runs (29%)
leave › apply leave › date picker:    flaky on 11 of 80 runs (14%)
admin › user management › bulk edit:  flaky on  8 of 80 runs (10%)
```

These three tests accounted for 80% of all retry overhead. Fixing them —
the employee search needed `waitForLoadState('networkidle')` before the
assertion, the date picker had an animation race, the bulk edit had a
parallel isolation issue — reduced CI run time by 6 minutes per run and
eliminated almost all false-positive failures.

The JSON reporter transformed an invisible problem (distributed flakiness
across 80 CI runs) into a visible priority list. That is what good
reporting does: it turns events into information that drives decisions.

---

## Chapter Summary

- A reporter receives test runner events and produces output. Multiple reporters run simultaneously.
- Configure with `reporter: [[name, options?], ...]` in `playwright.config.ts`.
- HTML reporter — the richest debugging tool. Shows status, errors, screenshots, videos, traces, steps, annotations. Always configure it.
- `open: 'on-failure'` locally; `open: 'never'` on CI. Use `npx playwright show-report` to open manually.
- Trace viewer — embedded in HTML report. Interactive timeline of every action, DOM state, and network call. Open with `npx playwright show-trace`.
- List reporter — live terminal output as tests complete. Use locally.
- Dot reporter — one character per test. Minimal noise for CI terminal logs.
- JUnit reporter — standard XML format. Consumed by Jenkins, Azure DevOps, GitLab, CircleCI. Use on CI.
- JSON reporter — complete run data as JSON. Use for custom dashboards, flakiness tracking, integrations.
- GitHub reporter — inline PR annotations via GitHub Actions annotation API. Use only in GitHub Actions.
- Blob reporter — for sharded runs on multiple CI machines. Merge with `npx playwright merge-reports`.
- `process.env.CI` pattern — switch reporter configuration between local and CI.
- Always use `if: always()` / `condition: always()` when uploading report artefacts. Without it, failures suppress the report.
- Custom reporters implement the `Reporter` interface. `onTestEnd` and `onEnd` are the most commonly used methods.
- Annotations appear in HTML report (badges), JUnit XML (`<properties>`), JSON (array), and custom reporters (`test.annotations`).
- Screenshots, videos, and traces appear as attachments in the HTML report — per attempt for retried tests.
- JSON reporter is the integration layer between Playwright and external tooling — dashboards, Slack, Jira, flakiness tracking.
