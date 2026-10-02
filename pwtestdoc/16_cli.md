# 16 — CLI

## The Scenario

You just fixed a bug in the leave application form. The fix touched one component. You want to verify your fix works before pushing. Running the full 200-test suite takes 18 minutes. You do not need 18 minutes — you need 30 seconds. You need to run exactly the tests that cover the leave application form, see them pass, and push.

That is what the CLI is for. Every situation in the test lifecycle — quick verification, targeted debugging, full regression, CI execution, investigation — has a specific combination of CLI flags. Knowing them means never waiting 18 minutes when you only need 30 seconds.

---

## The Base Command

```bash
npx playwright test
```

This is the entry point for everything. With no additional flags, it runs all tests in all projects as configured in `playwright.config.ts`.

Everything else is a flag that modifies this base command.

---

## Running Specific Tests

### By File or Directory

```bash
# Run all tests in one file
npx playwright test tests/leave/apply-leave.spec.ts

# Run all tests in a directory
npx playwright test tests/leave/

# Run tests in multiple files
npx playwright test tests/leave/apply-leave.spec.ts tests/leave/approve-leave.spec.ts

# Run tests matching a filename pattern — any file with 'leave' in the path
npx playwright test leave
```

### By Test Title — --grep

`--grep` filters tests by title using a regular expression. It matches against the full test title — the describe path plus the test name.

```bash
# Run tests whose title contains 'apply leave'
npx playwright test --grep "apply leave"

# Run tests tagged @smoke
npx playwright test --grep @smoke

# Run tests tagged @leave
npx playwright test --grep @leave

# Run tests with @smoke OR @regression
npx playwright test --grep "@smoke|@regression"

# Run tests with BOTH @smoke AND @leave (lookahead = AND)
npx playwright test --grep "(?=.*@smoke)(?=.*@leave)"

# Run a specific test by its full title
npx playwright test --grep "Apply Leave > valid leave request submits successfully"
```

### Excluding Tests — --grep-invert

```bash
# Run everything except @e2e tests
npx playwright test --grep-invert @e2e

# Run @regression but skip @slow tests
npx playwright test --grep @regression --grep-invert @slow

# Run everything except the payroll module
npx playwright test --grep-invert @payroll
```

---

## Running Specific Projects

```bash
# Run only the chromium project
npx playwright test --project=chromium

# Run multiple specific projects
npx playwright test --project=chromium --project=firefox

# Combine project filter with file filter
npx playwright test tests/leave/ --project=chromium

# Combine project filter with tag filter
npx playwright test --project=firefox --grep @smoke
```

---

## Controlling Execution

### Workers

```bash
# Run with a specific number of workers
npx playwright test --workers=4

# Shorthand
npx playwright test -j 4

# Run sequentially — one test at a time (essential for debugging)
npx playwright test --workers=1
```

### Retries

```bash
# Override retry count for this run
npx playwright test --retries=3

# Disable retries even if config has them
npx playwright test --retries=0
```

### Timeout

```bash
# Override test timeout for this run (milliseconds)
npx playwright test --timeout=60000

# Disable timeout — not recommended, can hang indefinitely
npx playwright test --timeout=0
```

### Repeat Each Test

```bash
# Run each test 5 times — useful for finding intermittent failures
npx playwright test --repeat-each=5

# Run a specific flaky test 20 times to reproduce it
npx playwright test --grep "employee search" --repeat-each=20 --workers=1
```

### Max Failures — Stop Early

```bash
# Stop the run after the first failure
npx playwright test --max-failures=1

# Stop after 5 failures
npx playwright test --max-failures=5
```

`--max-failures=1` is useful in CI when you want immediate feedback — as soon as anything breaks, stop the run. No point running the remaining 190 tests if the suite is clearly broken.

---

## Browser and Headed Mode

```bash
# Run in headed mode — opens a real browser window
npx playwright test --headed

# Run with a specific browser
npx playwright test --browser=firefox
npx playwright test --browser=chromium
npx playwright test --browser=webkit

# Slow down each action by 500ms — watch what is happening
npx playwright test --headed --slow-mo=500
```

`--headed` is the single most useful flag for debugging. When a test fails and the error message does not explain why, run it headed and watch the browser. You will usually see the problem immediately — the element is not there, a modal is in the way, the page is still loading.

`--slow-mo` adds a fixed delay between every action. Use it when headed mode is still too fast to follow — at 500ms you can see each step happen and understand the flow.

---

## Debug Mode

```bash
# Open Playwright Inspector — step through tests interactively
npx playwright test --debug

# Debug a specific test
npx playwright test --grep "apply leave" --debug

# Alternative — environment variable
PWDEBUG=1 npx playwright test --grep "apply leave"
```

In debug mode, Playwright Inspector opens alongside the browser. You can step through each action one at a time, pause at any point, inspect the DOM, and pick locators interactively. Debug mode automatically implies `--headed` and `--workers=1`.

---

## Listing Tests Without Running

```bash
# List all tests that would run — do not actually run them
npx playwright test --list

# List tests for a specific project
npx playwright test --list --project=chromium

# List tests matching a tag
npx playwright test --list --grep @smoke

# List tests in a specific file
npx playwright test --list tests/leave/apply-leave.spec.ts
```

`--list` output:
```
Listing tests:
  [chromium] › leave/apply-leave.spec.ts:8:5 › Apply Leave › valid request submits
  [chromium] › leave/apply-leave.spec.ts:22:5 › Apply Leave › past date is rejected
  [chromium] › leave/apply-leave.spec.ts:35:5 › Apply Leave › overlapping request is rejected
  3 tests total
```

Use `--list` before a long run to verify the filter is matching the right tests. Faster than running the suite and realising the filter was wrong.

---

## Re-running Failed Tests

```bash
# Re-run only the tests that failed in the last run
npx playwright test --last-failed
```

`--last-failed` reads results from the previous run and re-runs only what failed. This is the fastest path to verifying fixes — you do not re-run 197 passing tests to check that 3 failing ones now pass.

---

## Reporters

```bash
# Use a specific reporter
npx playwright test --reporter=html
npx playwright test --reporter=list
npx playwright test --reporter=dot
npx playwright test --reporter=line
npx playwright test --reporter=json

# Use multiple reporters simultaneously
npx playwright test --reporter=html --reporter=list

# Open the HTML report after the run
npx playwright show-report

# Open from a specific path
npx playwright show-report playwright-report
```

---

## Traces

```bash
# Enable tracing for all tests
npx playwright test --trace=on

# Enable tracing on first retry only
npx playwright test --trace=on-first-retry

# Open a trace file
npx playwright show-trace test-results/leave-apply-chromium/trace.zip
```

---

## Using a Different Config File

```bash
# Use a smoke-specific config
npx playwright test --config=playwright.smoke.config.ts

# Use a staging config
npx playwright test --config=./configs/staging.config.ts
```

---

## Common Scenarios and Their Commands

### "I just fixed a bug — verify my fix"

```bash
# Run the specific file you changed
npx playwright test tests/leave/apply-leave.spec.ts

# Or by module tag
npx playwright test --grep @leave

# Or by test title
npx playwright test --grep "apply leave with past date"
```

### "Pre-deployment quick check"

```bash
# Smoke tests, Chrome, 4 workers — under 5 minutes
npx playwright test --grep @smoke --project=chromium --workers=4
```

### "Debug a failing test"

```bash
# Headed with slow motion — watch what happens
npx playwright test --grep "apply leave with past date" --headed --slow-mo=500 --workers=1

# Or use the inspector for step-by-step control
npx playwright test --grep "apply leave with past date" --debug
```

### "Full regression before a release"

```bash
# All tests, all browsers, 4 workers, HTML report
npx playwright test --workers=4 --reporter=html
```

### "Investigate a flaky test"

```bash
# Run 20 times sequentially to reproduce
npx playwright test --grep "employee search" --repeat-each=20 --workers=1
```

### "Run tests on staging"

```bash
BASE_URL=https://staging.example.com npx playwright test
```

### "CI full run"

```bash
CI=true npx playwright test --reporter=github --reporter=junit
```

### "Check what a filter matches before running"

```bash
npx playwright test --list --grep @smoke
```

### "Re-run only what failed last time"

```bash
npx playwright test --last-failed
```

---

## Environment Variables

```bash
# Enable debug mode
PWDEBUG=1 npx playwright test

# Set base URL
BASE_URL=https://staging.example.com npx playwright test

# Trigger CI mode — retries, forbidOnly, etc.
CI=true npx playwright test

# Disable colour in output
NO_COLOR=1 npx playwright test
```

---

## Quick Reference Card

```bash
# Run everything
npx playwright test

# Run by file
npx playwright test tests/leave/apply-leave.spec.ts

# Run by directory
npx playwright test tests/leave/

# Run by tag
npx playwright test --grep @smoke

# Run by title
npx playwright test --grep "apply leave"

# Run by project
npx playwright test --project=chromium

# Run last failed only
npx playwright test --last-failed

# List without running
npx playwright test --list

# Headed mode
npx playwright test --headed

# Debug mode (step through interactively)
npx playwright test --debug

# Slow motion (500ms between actions)
npx playwright test --headed --slow-mo=500

# Sequential execution
npx playwright test --workers=1

# Repeat each test N times
npx playwright test --repeat-each=5

# Stop after N failures
npx playwright test --max-failures=1

# HTML report
npx playwright test --reporter=html

# Open HTML report
npx playwright show-report

# Open trace file
npx playwright show-trace trace.zip

# Different config
npx playwright test --config=playwright.smoke.config.ts
```

---

## Key Points

- `npx playwright test` — the base command; all flags modify this
- File/directory filtering is faster than tag filtering when you know which file changed
- `--grep` uses regex against the full test title; `|` for OR, lookahead `(?=.*@tag)` for AND
- `--grep-invert` excludes matching tests; combine with `--grep` for AND NOT logic
- `--project` runs one or more specific projects; combine freely with `--grep` and file filters
- `--workers=1` — sequential mode; the safe default whenever you are debugging
- `--headed` — opens a real browser; the first thing to try when a test fails unexpectedly
- `--slow-mo=N` — delays every action by N milliseconds; use with `--headed` to follow what happens
- `--debug` — opens Playwright Inspector for interactive step-through; implies `--headed` and `--workers=1`
- `--list` — shows matching tests without running; verify filters before committing to a long run
- `--last-failed` — re-runs only previously failed tests; fastest way to verify fixes
- `--repeat-each=N` — runs every test N times; for flakiness investigation only, not production CI
- `--max-failures=N` — stops the run after N failures; useful for fast CI feedback on a broken suite
- `--trace=on-first-retry` — captures full trace on retry; open with `npx playwright show-trace`
- `npx playwright show-report` — opens the HTML report from the last run
- `CI=true` — triggers CI-mode settings from the config
- `PWDEBUG=1` — environment variable equivalent of `--debug`
