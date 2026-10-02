# Chapter 406 — Reporters & Output — Deep Dive

This chapter covers reporters in Playwright. Interviewers ask these questions to
evaluate your ability to set up custom output structures, merge test results, and publish pipeline statuses.

---

## Q406.1 — What is the Playwright HTML report and what does it contain?

The **HTML Report** is a standalone web page showing all test suites. For each test, it lists execution steps, duration, browser types, and attaches screenshots, traces, or videos if errors occurred.

---

## Q406.2 — How do you open the HTML report after a test run?

Use the command line:
```bash
npx playwright show-report
```
This launches a local web server displaying the report at `http://localhost:9323`.

---

## Q406.3 — When do you use JSON reporter vs HTML reporter vs blob reporter?

- **HTML**: For humans reading test failures locally or in build artifacts.
- **JSON**: For machine parsing (e.g. updating dashboard databases).
- **Blob**: For parallelized builds where reports from multiple shards must be merged into one.

---

## Q406.4 — How does your team consume test reports in CI?

Our CI runs the tests, uploads the HTML report folder as a build artifact, and merges shard outputs. If tests fail, a Slack notification sends a direct link to the published HTML report.

---

## Q406.5 — What is the difference between list, dot, and line reporters for terminal output?

- **list**: Prints every test name as it starts and finishes. Very verbose.
- **dot**: Prints a dot for each test (green for pass, red for fail). Best for large suites.
- **line**: Prints a single line showing live execution progress.

---

## Q406.6 — What is the blob reporter and how does it work with sharding?

The **Blob reporter** produces a zip file containing raw test results and attachments. In sharded builds, each worker container outputs one blob file, which can then be combined using the merge CLI tool.

---

## Q406.7 — How do you merge blob reports from multiple shards?

Run:
```bash
npx playwright merge-reports ./blob-report-directory
```
This merges all zip blobs into a single unified HTML report.

---

## Q406.8 — What information does the HTML report show for a failed test?

It shows the **assertion error message, source code callstack highlighting the broken line, console warnings, network logs, screenshots, and visual trace steps**.

---

## Q406.9 — What is the difference between the HTML report and Allure for enterprise reporting?

- **HTML**: Native, lightweight, single-page, ideal for quick developer checks.
- **Allure**: A full dashboard supporting history tracking, categorization, trend lines, and graphs.

---

## Q406.10 — When should you build a custom reporter?

Build a custom reporter when you need to send execution payloads directly to internal APIs, format console logs in specific corporate patterns, or pipe live results into Slack/Teams channels.

---

## Q406.11 — What is wrong with using only the dot reporter in CI?

The dot reporter gives no terminal stacktraces or failures in the standard output logs. Developers have to download the artifact zip to see *why* the build broke instead of viewing the logs instantly.

---

## Q406.12 — How does the Playwright HTML report compare to Cypress's dashboard?

- **Cypress Dashboard** is a cloud service that handles orchestration and historical storage.
- **Playwright HTML Report** is a local-first static folder, requiring self-hosting in CI.

---

## Q406.13 — Write a playwright.config.ts that uses multiple reporters simultaneously

```typescript
import { defineConfig } from '@playwright/test';
export default defineConfig({
  reporter: [
    ['list'],
    ['json', { outputFile: 'results.json' }],
    ['html', { open: 'never' }]
  ],
});
```

---

## Q406.14 — Write a custom reporter that outputs test results as a Slack message payload

```typescript
import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class SlackReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status !== 'passed') {
      console.log(`Slack alert payload: Test ${test.title} failed in ${result.duration}ms.`);
    }
  }
}
export default SlackReporter;
```

---

## Q406.15 — Describe how your team shares test results with stakeholders

We host the unified HTML report on an internal web server (e.g. AWS S3 or GitHub Pages) and update a Slack channel with high-level stats (pass rate, runtime, links to failure traces).
