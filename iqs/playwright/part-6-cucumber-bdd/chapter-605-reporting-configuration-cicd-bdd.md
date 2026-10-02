# Chapter 605 — Reporting, Configuration & CI/CD in BDD

This chapter covers the reporting stack (Cucumber HTML, multiple-cucumber-html-reporter, Allure), `cucumber.js` configuration in depth, `tsconfig.json` for BDD projects, the `cross-env` headless pattern, and running BDD tests in CI. Interviewers ask these questions to assess whether you have shipped a BDD framework to production — configuration, reporting, and CI integration are what separate a learning exercise from a framework a team actually uses.

---

## Q605.1 — What reporters does Cucumber support and when would you use each?

Cucumber has built-in formatters and supports third-party reporters through the `format` array in `cucumber.js`.

**Built-in formatters:**

| Formatter | Output | Best for |
|-----------|--------|---------|
| `progress-bar` | Dots and coloured pass/fail in terminal | Local development, quick feedback |
| `json:path/to/file.json` | Machine-readable JSON | Input to HTML reporters and Allure |
| `html:path/to/file.html` | Self-contained HTML report | Sharing with the business team |
| `summary` | Final count of pass/fail in terminal | CI when you only need the result |

**Third-party reporters added in OrangeHRM project:**

`multiple-cucumber-html-reporter` — reads the JSON output and generates a rich multi-page HTML report with metadata (browser, platform, device), feature-level and scenario-level results, step timing, and screenshot attachments.

`allure-cucumberjs` — writes Allure-format JSON files that `allure generate` converts into the Allure HTML report. Allure shows trends, history, retries, and has better filtering than the Cucumber HTML report.

In `cucumber.js`:
```javascript
format: [
  'progress-bar',                         // terminal feedback during run
  'json:reports/cucumber-report.json',    // feeds multiple-cucumber-html-reporter
  'html:reports/cucumber-report.html',    // basic built-in HTML
  'allure-cucumberjs/reporter',           // feeds Allure
],
formatOptions: {
  snippetInterface: 'async-await',
  resultsDir: 'allure-results',           // where Allure adapter writes its files
},
```

---

## Q605.2 — How does multiple-cucumber-html-reporter work and how do you generate it?

`multiple-cucumber-html-reporter` reads Cucumber's JSON output and generates a rich HTML report. It is not a Cucumber formatter — it is a Node.js script you run after the tests finish.

Install:
```bash
npm install --save-dev multiple-cucumber-html-reporter
```

The OrangeHRM project has a `reports/generate-report.js` script:

```javascript
// reports/generate-report.js
const reporter = require('multiple-cucumber-html-reporter');
const path = require('path');

reporter.generate({
  jsonDir:    path.join(__dirname, 'reports'),        // folder containing cucumber-report.json
  reportPath: path.join(__dirname, 'reports', 'html-report'),

  metadata: {
    browser:  { name: 'chromium', version: 'latest' },
    device:   'Local Development Machine',
    platform: { name: 'Windows', version: '10' },
  },

  customData: {
    title: 'OrangeHRM BDD Test Report',
    data: [
      { label: 'Project',   value: 'OrangeHRM Employee Management' },
      { label: 'Release',   value: '1.0.0' },
      { label: 'Cycle',     value: 'Regression' },
      { label: 'Execution Start Time', value: new Date().toLocaleString() },
    ],
  },

  displayDuration: true,
  durationInMS:    true,
});
```

Generate the report:
```bash
node reports/generate-report.js
```

Or use the npm script from `package.json`:
```bash
npm run report          # generate only
npm run test:report     # run tests + generate report (default profile)
npm run test:pom:report # run tests + generate report (pom profile)
```

The report opens as `reports/html-report/index.html` in any browser.

---

## Q605.3 — How does Allure reporting integrate with Cucumber?

Allure uses an adapter (`allure-cucumberjs`) that hooks into Cucumber's formatter system. It writes raw result files to `allure-results/` during the test run. You then run `allure generate` to turn those raw files into the HTML report.

Install:
```bash
npm install --save-dev allure-cucumberjs allure-commandline
```

Add to `format` in `cucumber.js`:
```javascript
'allure-cucumberjs/reporter',
```

Add `resultsDir` to `formatOptions`:
```javascript
formatOptions: {
  resultsDir: 'allure-results',
},
```

Generate and open the report:
```bash
# Generate HTML from raw results
npx allure generate allure-results --clean -o allure-report

# Open in browser
npx allure open allure-report

# Generate AND open in one command
npx allure serve allure-results
```

npm scripts in the OrangeHRM project:
```bash
npm run test:allure         # run all tests + generate + open Allure
npm run test:pom:allure     # pom profile + Allure
npm run test:login:allure   # login tests (pom) + Allure
```

Allure automatically shows feature names, scenario names, steps, tags, and any `this.attach()` screenshots from hooks. It also generates trend charts and failure analysis across multiple runs when you preserve the `allure-report/history` folder between runs.

---

## Q605.4 — What is the complete structure of cucumber.js and what does each key do?

```javascript
// cucumber.js — full annotated example from OrangeHRM project
module.exports = {

  // ─── Profile name ─────────────────────────────────────────
  default: {

    // Which module to use for running TypeScript without compiling
    requireModule: ['ts-node/register'],

    // Files to load before features run — order matters:
    // world.ts first (registers World constructor), then hooks, then step defs
    require: [
      'support/hooks.ts',
      'support/world.ts',
      'step-definitions/**/*.ts',
    ],

    // Which feature files to run
    features: ['features/**/*.feature'],

    // Formatters — multiple can run simultaneously
    format: [
      'progress-bar',                       // terminal output during run
      'json:reports/cucumber-report.json',  // JSON for HTML reporters
      'html:reports/cucumber-report.html',  // built-in HTML report
      'allure-cucumberjs/reporter',         // Allure adapter
    ],

    // Options passed to formatters
    formatOptions: {
      snippetInterface: 'async-await',   // generated snippets use async/await
      resultsDir: 'allure-results',      // Allure output directory
    },

    // Suppress Cucumber Cloud publish warning
    publishQuiet: true,

    // Number of scenarios to run in parallel (1 = sequential)
    parallel: 1,

    // Passed to World constructor as options.parameters
    worldParameters: {
      baseUrl: 'https://vibetestq-osondemand.orangehrm.com/auth/login',
      headless: false,
      slowMo: 100,
    },
  },

  // ─── Second profile ────────────────────────────────────────
  pom: {
    requireModule: ['ts-node/register'],
    require: [
      'support/pom-hooks.ts',
      'support/pom-world.ts',
      'step-definitions-pom/**/*.ts',
    ],
    features: ['features/**/*.feature'],
    format: [
      'progress-bar',
      'json:reports/cucumber-report-pom.json',   // separate JSON file
      'html:reports/cucumber-report-pom.html',   // separate HTML report
      'allure-cucumberjs/reporter',
    ],
    formatOptions: {
      snippetInterface: 'async-await',
      resultsDir: 'allure-results',
    },
    publishQuiet: true,
    parallel: 1,
    worldParameters: {
      baseUrl: 'https://vibetestq-osondemand.orangehrm.com/auth/login',
      headless: false,
      slowMo: 100,
    },
  },
};
```

---

## Q605.5 — What is the tsconfig.json setup for a Cucumber TypeScript project?

```json
{
  "compilerOptions": {
    "target": "ES2020",          // compile to ES2020 — Node.js 14+ supports it
    "module": "commonjs",        // Node.js uses CommonJS, not ESM
    "lib": ["ES2020", "DOM"],    // DOM types needed for Playwright (window, document etc.)
    "types": ["node"],           // only include @types/node, not Jest or Mocha types
    "strict": true,              // enable all strict type checks
    "esModuleInterop": true,     // allow default imports from CommonJS modules
    "skipLibCheck": true,        // skip type checking of node_modules
    "outDir": "./dist",          // compiled output (ts-node doesn't use this, but tsc does)
    "rootDir": "./",             // source root
    "resolveJsonModule": true,   // allow import of JSON files
    "ignoreDeprecations": "5.0"  // suppress TypeScript 5.0 breaking change warnings
  },
  "include": [
    "features/**/*.ts",
    "pages/**/*.ts",
    "step-definitions/**/*.ts",
    "step-definitions-pom/**/*.ts",
    "support/**/*.ts",
    "reports/**/*.ts"
  ],
  "exclude": ["node_modules", "dist"]
}
```

Key decisions:
- `"module": "commonjs"` — Cucumber and Node.js use CommonJS. Using ESM (`"module": "ES2020"`) with Cucumber requires extra configuration and `"type": "module"` in `package.json`. The OrangeHRM project uses `"type": "commonjs"` in `package.json` to keep it simple.
- `"types": ["node"]` — without this, TypeScript might pull in conflicting type definitions from Jest or other test libraries installed in the project.
- `ts-node/register` in `requireModule` means TypeScript is compiled on the fly — `outDir` is not used at runtime, only when running `tsc` directly.

---

## Q605.6 — How do you run tests in headless mode and why would you?

Headless mode runs the browser without showing a visible window. In CI environments (GitHub Actions, Jenkins, GitLab CI), there is no display — the browser must run headless or it crashes.

The OrangeHRM project uses `cross-env` to pass an environment variable:

```bash
npm run test:headless
# Maps to: cross-env HEADLESS=true cucumber-js --config cucumber.js
```

`cross-env` sets environment variables in a way that works on Windows, macOS, and Linux. Without it, `HEADLESS=true cucumber-js` works on macOS/Linux but fails on Windows (PowerShell uses different syntax).

In the World constructor, read the environment variable:

```typescript
constructor(options: OrangeHRMWorldOptions) {
  super(options);
  // process.env.HEADLESS overrides worldParameters.headless
  this.headless = process.env.HEADLESS === 'true' || (options.parameters?.headless ?? false);
  this.slowMo   = options.parameters?.slowMo ?? 0;
}
```

For CI, set `HEADLESS=true` as an environment variable in the CI config — no code changes needed.

In `worldParameters` in `cucumber.js`, `headless: false` is the local default. CI overrides it with the environment variable.

---

## Q605.7 — How do you run the BDD framework in a CI/CD pipeline?

The OrangeHRM project runs in GitHub Actions. A basic workflow:

```yaml
# .github/workflows/bdd-tests.yml
name: BDD Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Run BDD tests (POM profile, headless)
        run: cross-env HEADLESS=true npm run test:pom
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}

      - name: Generate Allure report
        if: always()   # run even if tests fail
        run: npm run allure:generate

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-report
          path: allure-report/

      - name: Upload Cucumber HTML report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: cucumber-html-report
          path: reports/html-report/
```

Key CI decisions:
- `npm ci` instead of `npm install` — installs exactly what is in `package-lock.json`, never upgrades packages
- `npx playwright install chromium --with-deps` — installs Chromium and system dependencies (needed on Ubuntu)
- `cross-env HEADLESS=true` — runs headless without display
- `if: always()` on the report steps — generates and uploads reports even when tests fail (that is when you need the report most)
- `BASE_URL` from secrets — never hard-code staging URLs in the repo

---

## Q605.8 — What is the difference between the two HTML reports in this project?

The project produces two separate HTML reports depending on which profile runs:

| Report | Profile | File | Tool |
|--------|---------|------|------|
| `cucumber-report.html` | default | `reports/cucumber-report.html` | Built-in Cucumber HTML formatter |
| `cucumber-report-pom.html` | pom | `reports/cucumber-report-pom.html` | Built-in Cucumber HTML formatter |
| HTML report | both | `reports/html-report/index.html` | multiple-cucumber-html-reporter |
| Allure report | both | `allure-report/index.html` | allure-commandline |

They serve different audiences:
- **Built-in Cucumber HTML** — quick report, self-contained single file, easy to email
- **multiple-cucumber-html-reporter** — richer layout with metadata (browser, device, platform), customData (project, release, cycle), and step-level timing
- **Allure** — best for development team debugging — shows trends, history, attachments, retry analysis, and links to source code

In practice, the business team gets the `multiple-cucumber-html-reporter` output. The dev team uses Allure for failure analysis.

---

## Q605.9 — What does `publishQuiet: true` do in cucumber.js?

Without it, every Cucumber run prints a message asking you to publish your results to the Cucumber Reports cloud service (`https://reports.cucumber.io`). The message looks like:

```
─────────────────────────────────────────────────────────────────────
│ Share your Cucumber Report at https://reports.cucumber.io          │
│ Run the command with CUCUMBER_PUBLISH_TOKEN environment variable   │
│ or use publishQuiet: true to stop seeing this message             │
─────────────────────────────────────────────────────────────────────
```

`publishQuiet: true` silences this message. You are not publishing to the cloud; you are just telling Cucumber to stop asking.

```javascript
module.exports = {
  default: {
    publishQuiet: true,  // suppress the Cucumber Cloud publish message
    // ...
  },
};
```

This is not about parallel execution or performance — it is purely about suppressing a terminal noise message.

---

## Q605.10 — How do you configure parallel execution in CucumberJS?

Set `parallel` to the number of scenarios to run simultaneously:

```javascript
module.exports = {
  default: {
    parallel: 4,  // run 4 scenarios at the same time
    // ...
  },
};
```

With `parallel: 1` (the OrangeHRM project default), scenarios run one at a time — sequentially. This is safe but slow.

With `parallel: 4`, Cucumber runs four scenarios simultaneously. Each scenario gets its own World instance (its own browser, context, and page). This is why per-scenario browser isolation matters — without it, parallel scenarios would interfere with each other.

**Constraints with parallelism in Cucumber BDD:**
- `BeforeAll` and `AfterAll` run once for the entire suite — they do not run per worker
- Each parallel worker runs its own World and hooks
- `parallel` applies at the scenario level — one scenario runs on one worker from start to finish
- Parallel Cucumber BDD is less sophisticated than Playwright Test's parallel execution (no sharding, no blob reporters, no built-in parallelism reporting)

For the OrangeHRM project, `parallel: 1` was chosen deliberately because the scenarios create real data (employees and users) and the application is shared — running in parallel could cause scenarios to find each other's test data in search results.

---

## Q605.11 — What is wrong with this cucumber.js configuration?

```javascript
// ❌ COMMON MISTAKE — world.ts loaded after step-definitions
module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: [
      'step-definitions/**/*.ts',  // ← loaded before world.ts
      'support/hooks.ts',
      'support/world.ts',          // ← setWorldConstructor called here, too late
    ],
    // ...
  },
};
```

Step definitions run with `this` typed as the default World because `setWorldConstructor` has not been called yet when Cucumber processes the require list. The result is that `this.page`, `this.baseUrl`, and all custom World properties are `undefined`.

```javascript
// ✅ CORRECT APPROACH — world.ts first, then hooks, then step definitions
module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: [
      'support/world.ts',              // 1. Register custom World first
      'support/hooks.ts',              // 2. Hooks use the World
      'step-definitions/**/*.ts',      // 3. Step defs use both World and hooks
    ],
    // ...
  },
};
```

The load order in `require` matters. `world.ts` must be first so that by the time Cucumber registers step definitions and hooks, the custom World constructor is already set.

---

## Q605.12 — How does the reporting setup differ between Cucumber BDD and native Playwright Test?

| | Cucumber BDD reporters | Playwright Test reporters |
|-|------------------------|--------------------------|
| Built-in HTML report | Yes (`html:file.html`) | Yes (`--reporter=html`) |
| JSON output | Yes (`json:file.json`) | Yes (`--reporter=json`) |
| JUnit XML | Via third-party | Built-in (`--reporter=junit`) |
| Allure | `allure-cucumberjs` adapter | `allure-playwright` adapter |
| Allure auto-capture | Steps, scenarios, attachments | Tests, steps, screenshots, traces |
| Trace viewer | Manual setup in hooks | Built-in (`trace: 'on-first-retry'`) |
| Multi-machine merge | Not built-in | `--reporter=blob`, then `npx playwright merge-reports` |
| Screenshot on failure | Manual — `this.attach()` in After hook | Automatic — `screenshot: 'only-on-failure'` in config |

The main difference is that Playwright Test has tighter integration between the runner and the reporting system — screenshots, traces, and attachments are configured once in `playwright.config.ts` and apply everywhere. In Cucumber, you wire all of this manually in hooks using `this.attach()`.

---

## Q605.13 — Write the complete package.json scripts section for a BDD framework

```json
{
  "scripts": {
    // ─── Default profile ─────────────────────────────────────────
    "test":               "cucumber-js --config cucumber.js",
    "test:login":         "cucumber-js --config cucumber.js --tags \"@login\"",
    "test:employee":      "cucumber-js --config cucumber.js --tags \"@employee\"",
    "test:user":          "cucumber-js --config cucumber.js --tags \"@user-management\"",
    "test:headless":      "cross-env HEADLESS=true cucumber-js --config cucumber.js",

    // ─── POM profile ─────────────────────────────────────────────
    "test:pom":           "cucumber-js --profile pom --config cucumber.js",
    "test:pom:login":     "cucumber-js --profile pom --config cucumber.js --tags \"@login\"",
    "test:pom:employee":  "cucumber-js --profile pom --config cucumber.js --tags \"@employee\"",
    "test:pom:user":      "cucumber-js --profile pom --config cucumber.js --tags \"@user-management\"",

    // ─── Reports ─────────────────────────────────────────────────
    "report":             "node reports/generate-report.js",
    "test:report":        "npm test && npm run report",
    "test:pom:report":    "npm run test:pom && npm run report",

    // ─── Allure ──────────────────────────────────────────────────
    "allure:generate":    "allure generate allure-results --clean -o allure-report",
    "allure:open":        "allure open allure-report",
    "allure:serve":       "allure serve allure-results",
    "test:allure":        "npm test && npm run allure:generate && npm run allure:open",
    "test:pom:allure":    "npm run test:pom && npm run allure:generate && npm run allure:open",
    "test:login:allure":  "npm run test:pom:login && npm run allure:generate && npm run allure:open"
  }
}
```

The pattern `npm run [profile]:[tag]:[reporter]` makes the scripts composable and easy to discover. CI pipelines call specific scripts rather than building long Cucumber commands inline.

---

## Q605.14 — How do you add a Playwright trace to CI for failed BDD scenarios?

In the `After` hook, stop the trace and save it to a file when the scenario fails. In CI, upload the traces folder as an artifact.

```typescript
// support/pom-hooks.ts
import * as fs from 'fs';
import * as path from 'path';

Before(async function (this: POMWorld) {
  await this.openBrowser();
  await this.context.tracing.start({ screenshots: true, snapshots: true });
});

After(async function (this: POMWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    const safeName = scenario.pickle.name.replace(/[^\w-]/g, '-');
    const tracePath = path.join('reports', 'traces', `${safeName}.zip`);
    fs.mkdirSync(path.dirname(tracePath), { recursive: true });

    await this.context.tracing.stop({ path: tracePath });
    const screenshot = await this.takeScreenshot();
    await this.attach(screenshot, 'image/png');
  } else {
    await this.context.tracing.stop();  // discard trace on pass
  }

  await this.closeBrowser();
});
```

GitHub Actions workflow — upload traces:
```yaml
- name: Upload Playwright traces
  if: failure()    # only upload when tests fail
  uses: actions/upload-artifact@v4
  with:
    name: playwright-traces
    path: reports/traces/
```

Download the zip artifact from GitHub Actions and open it:
```bash
npx playwright show-trace "path/to/Failed-Scenario-Name.zip"
```

---

## Q605.15 — What was a real reporting or CI challenge in your BDD project?

In our OrangeHRM BDD project, the Allure report on GitHub Actions was generated correctly, but the screenshots from `this.attach()` were not appearing in the report. The Allure HTML showed the scenario as failed and showed the steps — but no screenshot.

After investigating, we found that `allure-cucumberjs` reads the Cucumber JSON output to build its results, and the screenshots were binary data embedded in the JSON. On CI, the `allure-results/` directory was being generated correctly, but we were running `allure generate` in a separate job after uploading the results as an artifact and downloading them. The re-download changed the encoding of the binary attachment data.

The fix was to run `allure generate` in the same job, immediately after the test step, before any upload:

```yaml
- name: Run tests
  run: cross-env HEADLESS=true npm run test:pom

- name: Generate Allure report
  if: always()
  run: npm run allure:generate    # run in same job, same filesystem

- name: Upload Allure HTML report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: allure-report
    path: allure-report/          # upload the generated HTML, not raw results
```

Uploading the already-generated HTML (not the raw `allure-results/`) meant no binary encoding issues — the HTML report is static files that survive artifact upload/download intact.

The lesson: test your entire CI reporting pipeline end-to-end, not just locally. Artifact encoding and directory structure behave differently between local and CI environments.

---

## Chapter Summary — Key Points for Your Interview

- Use three reporters together: `progress-bar` for terminal, `json` for input to HTML reporters, `allure-cucumberjs/reporter` for Allure. They all run simultaneously via the `format` array.
- `multiple-cucumber-html-reporter` reads the JSON file and generates a rich HTML report — run it with `node reports/generate-report.js` after tests finish.
- Allure requires `allure generate allure-results` after the test run. Run it in the same CI job, not in a separate job, to avoid binary attachment encoding issues.
- `publishQuiet: true` silences the Cucumber Cloud publish prompt — it has nothing to do with performance.
- `parallel: N` runs N scenarios simultaneously. Each gets its own World and browser. Use `parallel: 1` when tests share application state (like creating real data).
- `cross-env HEADLESS=true` is the standard way to run headless on CI — works on Windows, macOS, and Linux without shell syntax changes.
- In CI: use `npm ci` (not `npm install`), run `playwright install chromium --with-deps`, upload reports with `if: always()` so you get reports even on failure.
- In interviews: know the difference between what each report is for, explain the `require` load order issue, and describe a real CI reporting problem you solved.
