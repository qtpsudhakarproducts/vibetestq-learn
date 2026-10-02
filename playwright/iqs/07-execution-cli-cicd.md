# Execution, CLI & CI/CD — Interview Questions

---

## Q: What is the Playwright CLI?

**A:** The Playwright CLI is the command-line interface for managing and running Playwright. The main commands are: `npx playwright test` (run tests), `npx playwright install` (download browsers), `npx playwright show-report` (open the HTML report), `npx playwright codegen` (record interactions as test code), and `npx playwright show-trace` (open a trace file in the viewer).

---

## Q: How do you run all Playwright tests?

**A:** `npx playwright test` from the project root runs all test files matching the configured `testDir` and `testMatch` patterns. It uses all configured projects and the worker count specified in `playwright.config.ts`.

---

## Q: How do you run a specific test file?

**A:** Pass the file path as an argument: `npx playwright test tests/login.spec.ts`. You can also pass a partial path or pattern: `npx playwright test login` runs all files whose path contains "login".

---

## Q: What does the --headed flag do?

**A:** `--headed` runs tests with a visible browser window instead of the default headless mode. Use it during development to watch tests run and debug behaviour visually. In CI there is usually no display, so tests always run headless in automated pipelines.

---

## Q: What does the --debug flag do?

**A:** `--debug` opens the Playwright Inspector before the test starts. It pauses execution, shows the browser, and provides a step-through interface — you click Next to execute one action at a time. You can inspect the current DOM, evaluate locators, and see the result of each action.

---

## Q: What is --grep and how do you use it?

**A:** `--grep` filters which tests to run by matching a regex pattern against test titles. `npx playwright test --grep "checkout"` runs only tests whose title contains "checkout". Use `--grep-invert` to run all tests except those matching the pattern.

---

## Q: What is parallel execution in Playwright?

**A:** Parallel execution means running multiple tests simultaneously in separate worker processes instead of one at a time. Playwright spawns multiple workers by default, dramatically reducing total suite duration. Each worker runs tests from one file at a time, in sequence within that file.

---

## Q: What is a worker process in Playwright?

**A:** A worker is a separate Node.js process that runs a subset of tests. Multiple workers run in parallel, each handling different test files. The default number of workers is half the number of CPU cores, balancing speed and resource usage. Workers share the browser binary but each manages its own browser, context, and page instances.

---

## Q: How does Playwright decide which tests go to which worker?

**A:** By default, Playwright distributes test files across workers — each file is assigned to a worker. Tests within a single file run sequentially in that worker. You can enable parallel mode within a file using `test.describe.configure({ mode: 'parallel' })`, which allows tests inside that describe block to run across multiple workers.

---

## Q: What is test sharding?

**A:** Sharding splits the total test suite into slices that run on different machines simultaneously. Run one slice per machine with `--shard=1/4`, `--shard=2/4`, etc. Each machine executes only its assigned tests. All shards complete in parallel, reducing total time by a factor of the shard count.

---

## Q: What is the difference between workers (parallelism) and sharding?

**A:** Workers parallelise on a single machine — multiple CPU cores run multiple tests at once. Sharding parallelises across multiple machines — each machine runs a fraction of the total suite. In a well-configured CI pipeline, you use both: sharding across several machines, with each machine using multiple workers.

---

## Q: What are test retries and when should you use them?

**A:** Retries automatically re-run a failing test up to a configured number of times. If it passes on retry, it's counted as a flaky test in the report. Use retries in CI (set `retries: 1` or `retries: 2`) to tolerate genuine environmental flakiness — network hiccups, slow build agents. Do not use high retry counts to mask broken tests that need to be fixed.

---

## Q: What are the different timeout levels in Playwright?

**A:** **Test timeout** — total time allowed for one test to run (default 30 seconds). **Action timeout** — time allowed for a single action (click, fill) before it fails. **Navigation timeout** — time for a page navigation to complete. **Assertion timeout** — time for a web-first assertion to succeed. **Global timeout** — total time allowed for the entire test run.

---

## Q: What is the difference between test timeout and action timeout?

**A:** Test timeout limits the entire test. If the test takes longer than the limit (due to a hang, infinite loop, or extremely slow network), it fails. Action timeout limits a single interaction — if Playwright waits for an element to be actionable longer than the action timeout, that specific action fails. Both apply simultaneously.

---

## Q: How do you open and use the HTML report?

**A:** Run `npx playwright show-report` after tests complete — it starts a local web server and opens the report in a browser. To generate the report, set `reporter: 'html'` in `playwright.config.ts`. In CI, upload the `playwright-report` folder as a build artifact, then download it to view locally.

---

## Q: What artifacts should you upload in CI?

**A:** The `playwright-report` directory (contains the HTML report, screenshots, trace zips, and videos). The report is the main diagnostic tool for any failure. Configure `trace: 'on-first-retry'` and `screenshot: 'only-on-failure'` so CI artifacts are informative without being enormous.

---

## Q: What is CI/CD?

**A:** **CI (Continuous Integration)** means every code change is automatically built and tested. **CD (Continuous Delivery/Deployment)** means validated changes are automatically deployed to environments. Together they ensure issues are caught immediately after being introduced, rather than discovered days later or in production.

---

## Q: What is GitHub Actions?

**A:** GitHub Actions is a CI/CD platform built into GitHub. Workflows are YAML files in `.github/workflows/`. A workflow runs a sequence of steps whenever a trigger fires (push, pull request, schedule). For Playwright, a workflow typically: checks out code → installs Node.js → runs `npm install` → runs `npx playwright install` → runs `npx playwright test` → uploads `playwright-report` as an artifact.

---

## Q: What does a typical Playwright CI workflow look like?

**A:**

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Q: Why run smoke tests on every pull request?

**A:** Smoke tests cover the most critical user flows in a short amount of time (ideally under 5 minutes). Running them on every PR means a breaking change is caught before the code is merged, not after it reaches the main branch. They provide fast, high-confidence feedback without waiting for the full regression suite.

---

## Q: Why run the full regression suite nightly?

**A:** Full regression suites take too long for every PR. Running them overnight ensures the entire application is tested regularly. If nightly tests fail, the team investigates before the next release cycle. Combine nightly regression with PR smoke tests for comprehensive coverage without blocking developers.

---

## Q: What is a quality gate?

**A:** A quality gate is a policy that blocks code from proceeding (being merged, deployed) unless defined criteria are met. For test automation, this typically means: all CI tests must pass, no new test failures introduced, and code coverage must remain above a threshold. Quality gates enforce standards automatically without relying on manual review.

---

## Q: What is Docker and why is it used for running Playwright tests?

**A:** Docker packages an application and all its dependencies into a container image. For Playwright, a Docker container provides a consistent, reproducible environment with all browsers pre-installed and the correct OS libraries. Tests run identically on any machine — from a developer's laptop to any CI provider — eliminating "works on my machine" failures.

---

## Q: What is the official Playwright Docker image?

**A:** Microsoft publishes `mcr.microsoft.com/playwright` — an official image with Node.js and all three Playwright browser engines plus their OS dependencies pre-installed. Using this image in CI means zero browser installation time and a guaranteed compatible environment.

---

## Q: Why do tests pass locally but fail in CI?

**A:** Common causes: different viewport or screen resolution. Missing environment variables (base URL, credentials). Slower CI machines causing timeouts. Different system timezone or locale. Headless rendering differences (fonts, animations). Stricter environment restrictions (network access, file permissions). Race conditions that local machines mask due to higher performance.

---

## Q: How do you debug CI-only failures?

**A:** Download the `playwright-report` artifact from CI and open the trace viewer. Review screenshots and videos attached to the failure. Check CI logs for timeout or environment errors. Reproduce locally by matching the CI environment: headless mode, same environment variables, same Node.js version. Add verbose logging. Run the same Docker image locally if CI uses one.

---

## Q: What is a CI matrix strategy for Playwright?

**A:** A matrix strategy runs the same job multiple times with different parameters. For Playwright tests, you use it to run shards in parallel: `shard: [1, 2, 3, 4]` runs four parallel jobs, each receiving `--shard=N/4`. Results from all shards are merged in a final reporting step using `npx playwright merge-reports` to produce a unified HTML report.

---
