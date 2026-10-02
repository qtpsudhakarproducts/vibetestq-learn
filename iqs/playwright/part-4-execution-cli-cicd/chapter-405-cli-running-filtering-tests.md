# Chapter 405 — CLI — Running & Filtering Tests

This chapter covers the Playwright CLI — the command-line interface used
to run, filter, debug, and inspect tests. Interviewers ask about the CLI
to gauge workflow efficiency: a candidate who reaches for `--headed --debug`
the moment a test fails, and can chain `--grep`, `--project`, and `--workers`
without hesitation, demonstrates the professional fluency that separates
daily practitioners from occasional users.

---

## Q405.1 — What is the base Playwright command and what does it do with no flags?

```bash
npx playwright test
```

With no flags, this runs every test in every project as defined in
`playwright.config.ts`. It uses the configured `workers`, `retries`,
`reporter`, `timeout`, and all other config settings.

Everything else in the CLI is a flag that modifies this base command. You
can think of the CLI as the runtime override layer — it lets you change
any config setting for a single run without editing the config file.

---

## Q405.2 — How do you run a specific file, directory, or pattern from the CLI?

```bash
# Run all tests in one file
npx playwright test tests/leave/apply-leave.spec.ts

# Run all tests in a directory
npx playwright test tests/leave/

# Run multiple specific files
npx playwright test tests/leave/apply-leave.spec.ts tests/leave/approve-leave.spec.ts

# Run any file whose path contains 'leave'
npx playwright test leave
```

The path argument is matched against test file paths — it does not need to
be an exact path. `npx playwright test leave` matches any file with "leave"
in its path: `tests/leave/apply.spec.ts`, `tests/admin/leave-config.spec.ts`,
and so on.

File-based filtering is the fastest targeting method when you know which
file you changed. Faster to type than `--grep` and unambiguous.

---

## Q405.3 — How does --grep work and what regex patterns does it support?

`--grep` filters tests by their full title — the describe block path joined
to the test name. It accepts a regular expression:

```bash
# Title contains 'apply leave'
npx playwright test --grep "apply leave"

# Exact tag match
npx playwright test --grep @smoke
npx playwright test --grep @leave

# OR — tests with @smoke OR @regression
npx playwright test --grep "@smoke|@regression"

# AND — tests with both @smoke AND @leave (lookahead)
npx playwright test --grep "(?=.*@smoke)(?=.*@leave)"

# Full title match — test inside a specific describe
npx playwright test --grep "Apply Leave > valid request submits successfully"
```

The full title Playwright matches against is: `describe title > test title`.
So for a test `test('valid request submits successfully')` inside
`describe('Apply Leave')`, the full title is:
`Apply Leave > valid request submits successfully`.

---

## Q405.4 — What is --grep-invert and how do you combine it with --grep?

`--grep-invert` excludes tests whose title matches the pattern. It is the
complement of `--grep`:

```bash
# Everything except @e2e tests
npx playwright test --grep-invert @e2e

# @regression tests but not @slow ones
npx playwright test --grep @regression --grep-invert @slow

# All tests except the payroll module
npx playwright test --grep-invert @payroll
```

When `--grep` and `--grep-invert` are combined, Playwright first applies
`--grep` (keep matching) then applies `--grep-invert` (remove matching from
the result). The effect is AND NOT logic: run tests that match the grep
pattern AND do not match the invert pattern.

---

## Q405.5 — How do you target specific projects from the CLI?

```bash
# Run one project
npx playwright test --project=chromium

# Run multiple projects
npx playwright test --project=chromium --project=firefox

# Combine with file filter
npx playwright test tests/leave/ --project=chromium

# Combine with tag filter
npx playwright test --project=firefox --grep @smoke
```

The `--project` value must match the `name` field in the `projects` array
exactly. You can stack multiple `--project` flags — each adds another project
to run. Without `--project`, all projects run.

---

## Q405.6 — What is --headed and when should you use it?

`--headed` opens a visible browser window during the test run. By default,
Playwright runs headless — no visible UI.

```bash
npx playwright test --headed
npx playwright test --grep "apply leave" --headed --workers=1
```

**When to use it:** The moment a test fails and the error message does not
explain why. Watch the browser — you will usually see the problem immediately:
the element is not there, a modal is covering the button, the page is still
loading, a validation message appeared. Headed mode provides the visual
context that log messages cannot.

**Combine with `--workers=1`** when debugging a specific test — multiple
headed browser windows opening simultaneously is disorienting.

---

## Q405.7 — What is --slow-mo and when does it help?

`--slow-mo=N` adds a fixed delay of N milliseconds between every action:

```bash
npx playwright test --headed --slow-mo=500  # 500ms between each action
npx playwright test --headed --slow-mo=200  # 200ms — slightly faster
```

Use `--slow-mo` when `--headed` is still too fast to follow. At default
speed, Playwright can complete dozens of actions per second — difficult to
watch. At 500ms per action you can follow each click, fill, and navigation,
understand the flow, and see exactly where the failure occurs.

`--slow-mo` is a debugging tool only. Never use it in a committed config —
it multiplies suite run time by the number of actions.

---

## Q405.8 — What is --debug and what does it open?

`--debug` opens the Playwright Inspector — a graphical tool that lets you
step through test execution one action at a time:

```bash
npx playwright test --debug
npx playwright test --grep "apply leave" --debug
PWDEBUG=1 npx playwright test --grep "apply leave"  # environment variable equivalent
```

The Inspector shows:
- The current action being executed and its code location
- The list of upcoming actions
- The browser in a headed window
- A DOM inspection panel with locator highlighting
- A console for running Playwright commands interactively

`--debug` automatically implies `--headed` and `--workers=1` — you do not
need to add those flags separately.

Use `--debug` when `--headed --slow-mo=500` is not enough to understand the
failure. It gives you complete control: pause at any point, inspect the DOM,
try alternative locators, resume.

---

## Q405.9 — What does --list do and when should you use it?

`--list` shows the tests that would run without actually running them:

```bash
npx playwright test --list
npx playwright test --list --grep @smoke
npx playwright test --list --project=chromium
npx playwright test --list tests/leave/apply-leave.spec.ts
```

Output:
```
Listing tests:
  [chromium] › leave/apply-leave.spec.ts:8:5 › Apply Leave › valid request submits
  [chromium] › leave/apply-leave.spec.ts:22:5 › Apply Leave › past date is rejected
  [chromium] › leave/apply-leave.spec.ts:35:5 › Apply Leave › overlapping request rejected
  3 tests total
```

**Use it before a long run to verify the filter is correct.** If you meant
to run 20 smoke tests but `--list` shows 200, the filter has an error.
Better to discover this in a second with `--list` than after 18 minutes
of running the wrong tests.

---

## Q405.10 — What is --last-failed and when does it save the most time?

`--last-failed` re-runs only the tests that failed in the previous run. It
reads the results from the last run's output and targets only the failures:

```bash
# Initial run — finds 5 failures
npx playwright test

# Re-run only those 5 failures (not all 200 tests)
npx playwright test --last-failed
```

**When it saves the most time:** After a partial CI failure where most tests
pass. Instead of re-running the full suite to confirm your fix, run only
the failed tests. With a 200-test suite taking 18 minutes, if 5 tests fail
and those 5 take 30 seconds total, `--last-failed` gives you verification
in 30 seconds instead of 18 minutes.

It is also the fastest iteration loop when fixing multiple failures: fix,
`--last-failed`, see which ones now pass, fix the next, repeat.

---

## Q405.11 — What is --max-failures and when do you use it in CI?

`--max-failures=N` stops the run after N tests have failed:

```bash
npx playwright test --max-failures=1   # stop on first failure
npx playwright test --max-failures=5   # stop after 5 failures
```

**Use case in CI:** When a fundamental failure (broken login, wrong
environment URL, server is down) will cause every test to fail, there
is no value in running all 200 tests. `--max-failures=1` stops the
run immediately, provides a fast signal that something fundamental is
broken, and saves the CI worker resources.

**Trade-off:** With `--max-failures=1`, you only see one failure per run.
If multiple independent features are broken, you will need multiple runs
to discover all of them. For targeted fault discovery, use
`--max-failures=5` or `--max-failures=10` to get a broader picture while
still stopping before wasting full suite time.

---

## Q405.12 — How do you override execution settings from the CLI?

```bash
# Workers
npx playwright test --workers=4
npx playwright test -j 4          # shorthand for --workers=4
npx playwright test --workers=1   # sequential

# Retries
npx playwright test --retries=3
npx playwright test --retries=0   # disable retries for this run

# Timeout (milliseconds)
npx playwright test --timeout=60000
npx playwright test --timeout=0   # disable timeout (debugging only)

# Repeat each test N times (flakiness investigation)
npx playwright test --repeat-each=20 --workers=1 --grep "employee search"
```

CLI overrides take precedence over `playwright.config.ts`. Running
`--retries=0` on the CLI disables retries even if the config has
`retries: 2`. This lets you debug failures without the safety net of
retries — if a test fails once with `--retries=0`, it is genuinely failing
right now, not intermittently.

---

## Q405.13 — How do you open the HTML report and view a trace from the CLI?

```bash
# Open the HTML report from the most recent run
npx playwright show-report

# Open from a specific path
npx playwright show-report playwright-report

# Open a specific trace file
npx playwright show-trace test-results/leave-apply-chromium/trace.zip

# Enable tracing for a specific run
npx playwright test --trace=on
npx playwright test --trace=on-first-retry  # only on retry (CI default)
```

The HTML report opens in a local web server in your default browser.
The trace viewer is a separate full-featured tool — it lets you scrub
through a test timeline, see the browser state at each step, inspect
network requests and console output, and identify exactly where a failure
occurred.

---

## Q405.14 — How do you use a different config file from the CLI?

```bash
# Smoke tests with a dedicated config
npx playwright test --config=playwright.smoke.config.ts

# Staging environment config
npx playwright test --config=./configs/staging.config.ts

# API tests only
npx playwright test --config=playwright.api.config.ts
```

Multiple config files are useful for significantly different test profiles
that would be awkward to manage with projects and `--project` flags alone.
For example: a smoke config with one project and 5 tests for pre-deploy
gates, and a full regression config with 5 projects and 200 tests for
nightly runs.

---

## Q405.15 — What environment variables does Playwright use from the CLI?

```bash
# Enable debug mode (equivalent to --debug)
PWDEBUG=1 npx playwright test --grep "apply leave"

# Switch base URL without changing the config
BASE_URL=https://staging.example.com npx playwright test

# Trigger CI mode — enables retries, forbidOnly, CI-conditional settings
CI=true npx playwright test

# Disable colour in terminal output (useful for log files)
NO_COLOR=1 npx playwright test
```

`BASE_URL` and `CI` are not Playwright-specific — they are environment
variables that the config reads with `process.env.BASE_URL` and
`process.env.CI`. The convention is established in the config:

```typescript
use: {
  baseURL: process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',
},
retries: process.env.CI ? 2 : 0,
forbidOnly: !!process.env.CI,
```

Setting `BASE_URL` on the command line changes the environment for that
run. Setting `CI=true` activates all the CI-conditional config values
without being in a real CI environment — useful for testing what CI will
do before pushing.

---

## Q405.16 — What is the CLI command for each common scenario?

**"I just fixed a bug — verify my fix quickly"**
```bash
npx playwright test tests/leave/apply-leave.spec.ts
# or by module tag
npx playwright test --grep @leave --project=chromium
```

**"Pre-deployment smoke check"**
```bash
npx playwright test --grep @smoke --project=chromium --workers=4
```

**"Debug a failing test — step through it"**
```bash
npx playwright test --grep "apply leave with past date" --debug
```

**"Debug a failing test — watch it run"**
```bash
npx playwright test --grep "apply leave with past date" --headed --slow-mo=500 --workers=1
```

**"Full regression before a release"**
```bash
npx playwright test --workers=4 --reporter=html
```

**"Investigate a flaky test"**
```bash
npx playwright test --grep "employee search" --repeat-each=20 --workers=1
```

**"Run against staging"**
```bash
BASE_URL=https://staging.example.com npx playwright test --grep @smoke
```

**"Verify filters before a long run"**
```bash
npx playwright test --list --grep @smoke --project=chromium
```

**"Re-run only what just failed"**
```bash
npx playwright test --last-failed
```

**"CI full run"**
```bash
CI=true npx playwright test --reporter=github --reporter=junit
```

---

## Q405.17 — How do you combine multiple CLI flags effectively?

Flags compose. There is no limit to how many you combine — each flag
narrows or modifies the run independently:

```bash
# Run smoke tests in the leave module on Firefox,
# headed for debugging, sequentially, stopping after the first failure
npx playwright test \
  tests/leave/ \
  --grep @smoke \
  --project=firefox \
  --headed \
  --workers=1 \
  --max-failures=1

# Run the full regression suite on CI with evidence capture
CI=true npx playwright test \
  --project=chromium \
  --project=firefox \
  --workers=2 \
  --retries=2 \
  --reporter=github \
  --reporter=junit \
  --reporter=html

# Flakiness investigation
npx playwright test \
  --grep "employee search" \
  --project=chromium \
  --workers=1 \
  --repeat-each=20 \
  --retries=0
```

When composing flags, the general pattern is:
1. What to run (file/directory, `--grep`, `--project`)
2. How to run it (`--workers`, `--retries`, `--timeout`)
3. How to observe it (`--headed`, `--slow-mo`, `--debug`, `--reporter`)

---

## Q405.18 — What is the most useful CLI flag you use in daily work and why?

**For daily development: `--last-failed`.**

The workflow that makes the biggest difference:

1. Run the full suite to find failures: `npx playwright test`
2. Start fixing the first failure
3. Verify the fix: `npx playwright test --last-failed`
4. If it passes, move to the next failure and repeat

Without `--last-failed`, you either re-run the full suite (slow) or
manually filter by file or grep (fragile — easy to accidentally run the
wrong tests). `--last-failed` is precise and requires no thought — it
always runs exactly the tests that were failing last time.

**For debugging: `--debug`.**

When a test fails in CI and the screenshot does not explain why, the
path is: `npx playwright test --grep "test title" --debug`. The Playwright
Inspector makes the failure visible in seconds. Without it, the debugging
cycle is: read logs, guess, add console.log, re-run, repeat. With it:
step through, see the DOM state at each action, find the problem in one run.

Together, these two flags define the core of an efficient test debugging
workflow: `--last-failed` to target what is broken, `--debug` to understand
why it is broken.

---

## Chapter Summary

- `npx playwright test` — runs everything as configured. All flags modify this base command.
- File/directory argument — fastest targeting when you know which file changed.
- `--grep` — regex filter on full test title. `|` for OR, `(?=.*@a)(?=.*@b)` for AND.
- `--grep-invert` — excludes matching tests. Combine with `--grep` for AND NOT logic.
- `--project` — run one or more specific projects. Stacks: `--project=a --project=b`.
- `--headed` — opens a real browser window. First thing to try when a test fails unexpectedly.
- `--slow-mo=N` — adds N milliseconds between every action. Use with `--headed` to follow what happens.
- `--debug` — opens Playwright Inspector for step-through debugging. Implies `--headed` and `--workers=1`.
- `--list` — shows matching tests without running. Verify filters before committing to a long run.
- `--last-failed` — re-runs only previously failed tests. Fastest way to verify fixes.
- `--max-failures=N` — stops after N failures. Use in CI to fail fast on a broken suite.
- `--workers=1` — sequential mode. Always use when debugging a specific test.
- `--repeat-each=N` — runs every test N times. For flakiness investigation, not production CI.
- `--retries=0` — disables retries for this run. Useful to confirm a test is genuinely passing.
- `npx playwright show-report` — opens the HTML report in a browser.
- `npx playwright show-trace trace.zip` — opens the trace viewer for a specific trace file.
- `--config=file.ts` — use a different config file for this run.
- `BASE_URL=...` and `CI=true` — environment variables read by the config, not built-in Playwright flags.
