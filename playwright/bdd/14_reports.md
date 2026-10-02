# 10 — Reports

## Why Reports Matter in BDD

BDD reports are not just for developers. They are for the whole team — including business
stakeholders. A good Cucumber report shows which scenarios passed and failed, in plain
English, without requiring any technical knowledge to read.

This is one of the core benefits of BDD. The report is essentially a snapshot of what the
system can and cannot do, written in business language.

---

## Built-In Report Formats

Cucumber supports several built-in output formats:

| Format | Output | Best For |
|---|---|---|
| `progress` | Dots and F in terminal | Quick feedback during development |
| `progress-bar` | Progress bar in terminal | CI pipelines |
| `summary` | Pass/fail count at the end | Quick summary |
| `html` | HTML file | Sharing with stakeholders |
| `json` | JSON file | Feeding into custom dashboards |
| `junit` | XML file | CI tools like Jenkins |
| `message` | Binary format | Processing by other tools |

---

## Configuring Reports in cucumber.json

```json
{
  "default": {
    "format": [
      "progress-bar",
      "html:reports/cucumber-report.html",
      "json:reports/cucumber-report.json"
    ]
  }
}
```

This outputs:
- A progress bar in the terminal while tests run
- An HTML report at `reports/cucumber-report.html`
- A JSON report at `reports/cucumber-report.json`

The paths after the `:` are relative to your project root.

---

## The HTML Report

The HTML report is the most useful for sharing with stakeholders. Open it in a browser.

It shows:
- Each Feature as a collapsible section
- Each Scenario with pass/fail status and duration
- Each Step with pass/fail status and timing
- `Scenario Outline` examples expanded into individual rows
- Tags next to each scenario
- Screenshots attached in `After` hooks appear inline
- Error messages and stack traces for failed steps

---

## Adding Screenshots to Reports

When a scenario fails, attach a screenshot in the `After` hook. It will appear in the
HTML report next to the failed scenario.

```typescript
// support/hooks.ts
import { After, ITestCaseHookParameter } from '@cucumber/cucumber';
import { PlaywrightWorld } from './world';

After(async function(this: PlaywrightWorld, scenario: ITestCaseHookParameter) {
  if (scenario.result?.status === 'FAILED') {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, 'image/png');
  }
  await this.context.close();
});
```

You can also attach screenshots to passing scenarios — useful when debugging flaky tests.

```typescript
After(async function(this: PlaywrightWorld, scenario: ITestCaseHookParameter) {
  // Always attach screenshot
  const screenshot = await this.page.screenshot({ fullPage: true });
  await this.attach(screenshot, 'image/png');

  // Attach page URL
  await this.attach(`URL: ${this.page.url()}`, 'text/plain');

  await this.context.close();
});
```

---

## Adding Text Attachments

Use `this.attach` to add any text to the report.

```typescript
After(async function(this: PlaywrightWorld, scenario: ITestCaseHookParameter) {
  if (scenario.result?.status === 'FAILED') {
    // Attach current URL
    await this.attach(`Failure URL: ${this.page.url()}`, 'text/plain');

    // Attach browser console errors
    const logs = await this.page.evaluate(() => (window as any).__consoleLogs || []);
    await this.attach(JSON.stringify(logs, null, 2), 'application/json');

    // Attach screenshot
    const screenshot = await this.page.screenshot();
    await this.attach(screenshot, 'image/png');
  }
  await this.context.close();
});
```

---

## Using multiple-cucumber-html-reporter

For a more polished report with charts and statistics, install `multiple-cucumber-html-reporter`.

```bash
npm install --save-dev multiple-cucumber-html-reporter
```

Create a script `generate-report.js` at the project root:

```javascript
const report = require('multiple-cucumber-html-reporter');

report.generate({
  jsonDir: 'reports/',
  reportPath: 'reports/html/',
  metadata: {
    browser: { name: 'Chrome', version: '120' },
    device: 'Local',
    platform: { name: 'Windows', version: '11' }
  },
  customData: {
    title: 'Test Execution Info',
    data: [
      { label: 'Project', value: 'OrangeHRM' },
      { label: 'Release', value: '1.0.0' },
      { label: 'Executed by', value: 'CI Pipeline' }
    ]
  }
});
```

Add a script to `package.json`:

```json
{
  "scripts": {
    "test:bdd": "cucumber-js",
    "report": "node generate-report.js",
    "test:bdd:report": "cucumber-js && node generate-report.js"
  }
}
```

Run:
```bash
npm run test:bdd:report
```

---

## Cucumber HTML Report vs Playwright HTML Report

Both tools generate HTML reports. They serve different audiences.

| | Cucumber HTML Report | Playwright HTML Report |
|---|---|---|
| Primary audience | Business stakeholders | Engineers and testers |
| Language | Plain English (Gherkin) | Technical (test names, code paths) |
| Scenario description | Business-readable | Code-style test names |
| Screenshots | Embedded via attach | Embedded automatically on failure |
| Video | Not built-in | Supported natively |
| Trace viewer | Not available | Available — step-by-step replay |
| Good for | Showing stakeholders what was tested | Debugging failures |

**Use the Cucumber HTML report** when sharing results with product managers, clients, or
business teams who need to understand what was tested.

**Use the Playwright HTML report** when a developer or tester needs to debug a failure — the
trace viewer and step-by-step replay are far more powerful for debugging.

---

## Keeping Reports Clean

Reports are output files. Add them to `.gitignore` so they are not committed.

```
# .gitignore
reports/
```

In CI, upload reports as build artifacts so they are available after the pipeline runs.

```yaml
# Example GitHub Actions step
- name: Upload Cucumber report
  uses: actions/upload-artifact@v3
  with:
    name: cucumber-report
    path: reports/
```

---

## Summary

- Configure reports in `cucumber.json` using the `format` array
- HTML reports are the most useful for sharing with stakeholders
- Attach screenshots in the `After` hook to show failure context in the report
- Use `multiple-cucumber-html-reporter` for a polished multi-feature dashboard
- Cucumber reports are for business stakeholders; Playwright reports are for debugging
- Add `reports/` to `.gitignore` and upload as CI artifacts

Next: [11 — BDD vs Plain Playwright Tests](./11_bdd_vs_playwright.md)
