# Chapter 312 — Projects — Multi-browser & Multi-env

This chapter covers Playwright's project system — the mechanism that lets you
run the same suite under multiple browsers, environments, and roles from a
single config file. Interviewers use project questions to test cross-browser
strategy, environment management thinking, and dependency sequencing. A
candidate who can design a project matrix for a real product is ready for
senior test engineering roles.

---

## Q312.1 — What is a Playwright project?

A project is a named configuration entry in the `projects` array in
`playwright.config.ts`. Each project runs your test suite — or a filtered
subset — under a specific set of settings.

```typescript
projects: [
  {
    name: 'chromium',                        // appears in reports and CLI
    use: { ...devices['Desktop Chrome'] },   // settings for this project
    dependencies: ['auth-setup'],            // must complete before this starts
    grep: /@smoke|@regression/,              // tag filter for this project
    testMatch: '**/ui/**/*.spec.ts',         // file filter for this project
  },
]
```

A project can define:
- **`name`** — identifies it in reports and `--project=` flag
- **`use`** — settings that override the global `use` block
- **`dependencies`** — other projects that must finish before this one starts
- **`grep` / `grepInvert`** — tag filters applied to this project's tests
- **`testMatch` / `testIgnore`** — file filters for this project

Running `npx playwright test` runs every project. Running
`npx playwright test --project=chromium` runs only that project.

---

## Q312.2 — How do you set up multi-browser testing with projects?

Spread device presets into each project's `use` block. The suite runs once
per project — results are grouped by project in the HTML report:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'https://demo.orangehrmlive.com',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome']  } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari']  } },
  ],
});
```

With 200 tests and three projects, Playwright runs 600 test executions.
The report groups them:

```
Chromium (200) — 199 passed, 1 failed
Firefox  (200) — 198 passed, 2 failed
Webkit   (200) — 200 passed
```

Browser-specific failures — a Firefox date picker bug, a Safari CSS
regression — would be invisible without projects.

---

## Q312.3 — What are device presets and how do they work?

`devices` from `@playwright/test` contains pre-configured settings for
hundreds of real browsers and devices. Each preset defines the viewport,
user agent, browser engine, scale factor, and touch support:

```typescript
// devices['Desktop Chrome'] expands to approximately:
{
  browserName:       'chromium',
  viewport:          { width: 1280, height: 720 },
  userAgent:         'Mozilla/5.0 ... Chrome/...',
  deviceScaleFactor: 1,
  isMobile:          false,
  hasTouch:          false,
}
```

Spread it into a project's `use` block, then add any overrides you need:

```typescript
{
  name: 'chrome-1440',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 }, // override the preset viewport only
  },
},
```

Commonly used presets:
- `'Desktop Chrome'`, `'Desktop Firefox'`, `'Desktop Safari'`
- `'iPhone 14'`, `'iPhone 14 Pro'`, `'Pixel 7'`, `'Galaxy S9+'`
- `'iPad Pro 11'`, `'iPad (gen 7)'`

---

## Q312.4 — How does project-level use override the global use block?

Each project's `use` block merges with the global `use`. Settings in the
project override the global; settings not in the project inherit from global:

```typescript
export default defineConfig({
  use: {
    baseURL:    'https://demo.orangehrmlive.com', // global default
    headless:   true,
    screenshot: 'only-on-failure',
    trace:      'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // inherits baseURL, headless, screenshot, trace from global
      },
    },
    {
      name: 'headed-debug',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,  // override headless for this project only
      },
    },
    {
      name: 'staging',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://staging.example.com', // override environment
        storageState: '.auth/staging-admin.json',
      },
    },
  ],
});
```

The `staging` project overrides only `baseURL` and `storageState` — it still
inherits `screenshot`, `trace`, and `headless` from the global block.

---

## Q312.5 — How do you use projects for multi-environment testing?

Projects represent environments as well as browsers. The same tests run
against staging and production with a single config:

```typescript
projects: [
  {
    name: 'staging',
    use: {
      ...devices['Desktop Chrome'],
      baseURL:      'https://staging.orangehrm.example.com',
      storageState: '.auth/staging-admin.json',
    },
  },
  {
    name: 'production',
    use: {
      ...devices['Desktop Chrome'],
      baseURL:      'https://demo.orangehrmlive.com',
      storageState: '.auth/prod-admin.json',
    },
  },
],
```

```bash
npx playwright test --project=staging     # staging only
npx playwright test --project=production  # production only
npx playwright test                        # both
```

Switching environments is a CLI flag — not a config edit, not a test edit.

---

## Q312.6 — How do you add mobile and tablet projects?

Mobile projects use phone and tablet device presets. They run the same
test files but with mobile viewports, user agents, and touch support:

```typescript
projects: [
  // Desktop
  { name: 'chromium',      use: { ...devices['Desktop Chrome']  } },
  { name: 'firefox',       use: { ...devices['Desktop Firefox'] } },

  // Mobile
  { name: 'mobile-chrome', use: { ...devices['Pixel 7']    } },
  { name: 'mobile-safari', use: { ...devices['iPhone 14']  } },

  // Tablet
  { name: 'tablet',        use: { ...devices['iPad Pro 11'] } },
],
```

A test that fails on `mobile-safari` but passes everywhere else immediately
pinpoints a responsive design issue — without any manual browser switching.

---

## Q312.7 — How do project-level grep filters reduce cross-browser run time?

Not every project needs to run every test. Applying `grep` per project
gives you meaningful cross-browser coverage without tripling run time:

```typescript
projects: [
  {
    name: 'chromium',
    use:  { ...devices['Desktop Chrome'] },
    grep: /@smoke|@regression/,  // full suite on Chrome
  },
  {
    name: 'firefox',
    use:  { ...devices['Desktop Firefox'] },
    grep: /@smoke/,  // smoke tests only on Firefox
  },
  {
    name: 'webkit',
    use:  { ...devices['Desktop Safari'] },
    grep: /@smoke/,  // smoke tests only on Safari
  },
],
```

```
chromium: 200 tests (smoke + regression)
firefox:   20 tests (smoke only)
webkit:    20 tests (smoke only)
Total:    240 — not 600
```

Chrome gets thorough coverage. Firefox and Safari validate that critical
paths work cross-browser. Run time stays reasonable.

---

## Q312.8 — How do project dependencies sequence execution?

`dependencies` makes a project wait for other projects to finish
successfully before it starts. If a dependency fails, the dependent project
is skipped with a clear reason shown in the report:

```typescript
projects: [
  // Runs first — saves auth state
  {
    name: 'auth-setup',
    testMatch: '**/auth.setup.ts',
  },

  // Waits for auth-setup before starting
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
    dependencies: ['auth-setup'],
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'], storageState: '.auth/admin.json' },
    dependencies: ['auth-setup'],
  },
],
```

When the auth setup file fails, the HTML report shows:

```
auth-setup
  ❌ save admin auth state — Error: Login button not found

chromium — SKIPPED (dependency 'auth-setup' failed)
firefox  — SKIPPED (dependency 'auth-setup' failed)
```

This is far more diagnostic than 200 tests failing with "storageState file
not found." One failure, one root cause, clear skip reason.

---

## Q312.9 — How do you chain project dependencies?

Projects can depend on multiple projects, and those can depend on others.
Playwright resolves the dependency graph and starts each project as soon
as all its dependencies are satisfied:

```typescript
projects: [
  { name: 'db-seed',       testMatch: '**/db.setup.ts' },

  // Both auth setups depend on db-seed — can run in parallel after it
  { name: 'admin-auth',    testMatch: '**/admin.setup.ts',    dependencies: ['db-seed'] },
  { name: 'employee-auth', testMatch: '**/employee.setup.ts', dependencies: ['db-seed'] },

  // Test projects depend on their respective auth
  {
    name: 'admin-tests',
    dependencies: ['admin-auth'],
    use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
  },
  {
    name: 'employee-tests',
    dependencies: ['employee-auth'],
    use: { ...devices['Desktop Chrome'], storageState: '.auth/employee.json' },
  },
],
```

Execution order:
```
1. db-seed                           (sequential — no deps)
2. admin-auth + employee-auth        (parallel — both depend on db-seed only)
3. admin-tests + employee-tests      (parallel — each depends on its own auth)
```

Playwright maximises parallelism while respecting the dependency order.

---

## Q312.10 — How do you configure role-based projects for multiple user types?

Each role gets a setup file that saves its own auth state, and a test
project that loads it:

```typescript
projects: [
  // Auth setup — one per role
  { name: 'admin-auth',    testMatch: '**/setup/admin.setup.ts'    },
  { name: 'employee-auth', testMatch: '**/setup/employee.setup.ts' },
  { name: 'manager-auth',  testMatch: '**/setup/manager.setup.ts'  },

  // Test projects — one per role
  {
    name: 'as-admin',
    testMatch:    '**/admin/**/*.spec.ts',
    dependencies: ['admin-auth'],
    use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
  },
  {
    name: 'as-employee',
    testMatch:    '**/employee/**/*.spec.ts',
    dependencies: ['employee-auth'],
    use: { ...devices['Desktop Chrome'], storageState: '.auth/employee.json' },
  },
  {
    name: 'as-manager',
    testMatch:    '**/manager/**/*.spec.ts',
    dependencies: ['manager-auth'],
    use: { ...devices['Desktop Chrome'], storageState: '.auth/manager.json' },
  },
],
```

```bash
npx playwright test --project=as-admin     # admin role only
npx playwright test --project=as-employee  # employee role only
npx playwright test                         # all roles
```

Each role's tests run against the server with that role's authenticated session.
No login code in any test file.

---

## Q312.11 — What is the setup project pattern and how does it differ from globalSetup?

A setup project is a regular Playwright project whose `testMatch` points to
a setup file rather than spec files. Its tests run using Playwright's full
test runner — with fixture access, tracing, and report visibility.

```typescript
// tests/setup/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('save admin auth state', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);
  await page.context().storageState({ path: '.auth/admin.json' });
});
```

Differences from `globalSetup`:

| | Setup project | `globalSetup` |
|---|---|---|
| Fixture access | ✅ Full — `page`, custom fixtures | ❌ Manual browser only |
| Visible in HTML report | ✅ Yes — passes/fails explicitly | ❌ No |
| Failure behaviour | Dependent projects skipped, shown in report | Suite aborted, terminal only |
| Written as | Regular `test()` / `setup()` | Plain TypeScript function |
| Best for | Browser-based auth state setup | DB seeding, server start, no browser |

Use setup projects when you need browser interaction and want failures visible
in the report. Use `globalSetup` for non-browser infrastructure setup.

---

## Q312.12 — How do you run specific projects from the CLI?

```bash
# Run one project
npx playwright test --project=chromium

# Run multiple projects
npx playwright test --project=chromium --project=firefox

# Run projects matching a name pattern
npx playwright test --project="*-smoke"

# Combine project selection with tag filtering
npx playwright test --project=chromium --grep @smoke

# List all tests across all projects without running
npx playwright test --list

# List tests for a specific project
npx playwright test --list --project=firefox
```

CLI `--project` names must match exactly the `name` field in the config.
Shell glob patterns like `"*-smoke"` work when the shell expands them.

---

## Q312.13 — How do you use testMatch on a project to separate API and UI tests?

Project-level `testMatch` lets different projects run different file subsets,
even with different settings:

```typescript
projects: [
  // API tests — no browser, just request fixture
  {
    name: 'api',
    testMatch: '**/api/**/*.spec.ts',
    use: { baseURL: 'https://demo.orangehrmlive.com' },
  },

  // UI tests — full browser
  {
    name: 'ui-chrome',
    testMatch: '**/ui/**/*.spec.ts',
    use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
    dependencies: ['auth-setup'],
  },

  // Auth setup — only for UI project
  {
    name: 'auth-setup',
    testMatch: '**/auth.setup.ts',
  },
],
```

```bash
npx playwright test --project=api       # API tests only — fast, no browser
npx playwright test --project=ui-chrome # UI tests only
npx playwright test                      # both, with auth running first
```

API tests have no `storageState` dependency — they call the login endpoint
directly or use an API auth fixture. UI tests load the saved session.

---

## Q312.14 — What does the HTML report look like with multiple projects?

The HTML report groups results by project. Each project appears as a
collapsible section with its own pass/fail counts:

```
RESULTS SUMMARY
  chromium        198/200 passed  (2 failed)
  firefox          200/200 passed
  webkit           200/200 passed
  mobile-chrome   199/200 passed  (1 failed)

FAILED TESTS
  chromium › Leave Module › apply leave with past date
  chromium › PIM › date picker handles year navigation
  mobile-chrome › Login › form is usable on small viewport
```

A failure in `chromium` but not `firefox` or `webkit` points to a
Chromium-specific bug. A failure in `mobile-chrome` only points to a
responsive design issue. The project grouping makes cross-browser
triage immediate.

---

## Q312.15 — How do you handle different storageState files per project?

Each project that needs an authenticated session specifies its own
`storageState` path. The setup project for that auth state writes to
the matching path:

```typescript
// playwright.config.ts
projects: [
  { name: 'admin-auth',    testMatch: '**/admin.setup.ts'    },
  { name: 'employee-auth', testMatch: '**/employee.setup.ts' },

  {
    name: 'admin-tests',
    dependencies: ['admin-auth'],
    use: { storageState: '.auth/admin.json' },  // ← loads this
  },
  {
    name: 'employee-tests',
    dependencies: ['employee-auth'],
    use: { storageState: '.auth/employee.json' }, // ← loads this
  },
],
```

```typescript
// tests/setup/admin.setup.ts
setup('save admin auth', async ({ page }) => {
  // ... login as admin ...
  await page.context().storageState({ path: '.auth/admin.json' }); // ← writes this
});

// tests/setup/employee.setup.ts
setup('save employee auth', async ({ page }) => {
  // ... login as employee ...
  await page.context().storageState({ path: '.auth/employee.json' }); // ← writes this
});
```

Each setup file writes a different path. Each test project reads a different
path. Both are in `.gitignore`.

---

## Q312.16 — Write a complete OrangeHRM project configuration covering all scenarios.

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries:     process.env.CI ? 2 : 0,
  workers:     process.env.CI ? 2 : 4,
  timeout:     30_000,

  use: {
    baseURL:           process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    trace:             'on-first-retry',
    actionTimeout:     10_000,
    navigationTimeout: 30_000,
  },

  reporter: process.env.CI
    ? [['github'], ['junit', { outputFile: 'results/junit.xml' }], ['html', { open: 'never' }]]
    : [['html', { open: 'on-failure' }], ['list']],

  projects: [

    // ── Auth setup ───────────────────────────────────────────────────────
    { name: 'admin-auth',    testMatch: '**/setup/admin.setup.ts'    },
    { name: 'employee-auth', testMatch: '**/setup/employee.setup.ts' },

    // ── Desktop browsers — full suite ────────────────────────────────────
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      dependencies: ['admin-auth'],
      grep: /@smoke|@regression/,
    },

    // ── Cross-browser — smoke only ────────────────────────────────────────
    {
      name: 'firefox',
      use:  { ...devices['Desktop Firefox'], storageState: '.auth/admin.json' },
      dependencies: ['admin-auth'],
      grep: /@smoke/,
    },
    {
      name: 'webkit',
      use:  { ...devices['Desktop Safari'], storageState: '.auth/admin.json' },
      dependencies: ['admin-auth'],
      grep: /@smoke/,
    },

    // ── Mobile — smoke only ───────────────────────────────────────────────
    {
      name: 'mobile-chrome',
      use:  { ...devices['Pixel 7'], storageState: '.auth/admin.json' },
      dependencies: ['admin-auth'],
      grep: /@smoke/,
    },

    // ── Employee role tests ───────────────────────────────────────────────
    {
      name:         'as-employee',
      testMatch:    '**/employee-role/**/*.spec.ts',
      dependencies: ['employee-auth'],
      use:          { ...devices['Desktop Chrome'], storageState: '.auth/employee.json' },
    },

  ],
});
```

---

## Q312.17 — How do project dependencies improve failure diagnosis over globalSetup?

With `globalSetup`, a login failure looks like this:

```
Error: globalSetup failed:
  Error: net::ERR_CONNECTION_REFUSED — https://demo.orangehrmlive.com
```

No report. No trace. Terminal only. You have to dig through logs to understand
what failed. And since globalSetup runs before the test runner, there is no
context for what was happening when it failed.

With a setup project, the same failure looks like this in the HTML report:

```
auth-setup
  ❌ save admin auth state (8.2s)
     Error: Timeout 30000ms exceeded on selector '.oxd-button'
     → Screenshot: [attachment — shows what the page looked like]
     → Trace:      [attachment — full replay of all actions taken]

chromium — SKIPPED
  Reason: dependency 'auth-setup' failed

firefox — SKIPPED
  Reason: dependency 'auth-setup' failed
```

You can open the trace, see the full browser interaction, and pinpoint
exactly what went wrong — the login button changed selector, the environment
is down, the credentials are wrong. The dependent projects show clearly why
they were skipped rather than producing hundreds of misleading failures.

---

## Q312.18 — What is the most impactful project configuration change you've made?

The most impactful change was switching from a flat single-browser config to
a tiered multi-browser config with project-level `grep` filters.

Before:
```typescript
// One project — Chromium only, all tests
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
]
```

After:
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] }, grep: /@smoke|@regression/ },
  { name: 'firefox',  use: { ...devices['Desktop Firefox'] }, grep: /@smoke/ },
  { name: 'webkit',   use: { ...devices['Desktop Safari']  }, grep: /@smoke/ },
  { name: 'mobile',   use: { ...devices['Pixel 7']          }, grep: /@smoke/ },
]
```

The result: we caught three cross-browser bugs in the first week — a Firefox
date picker issue, a Safari input autofill conflict, and a mobile viewport
layout break. None would have been found before they reached production
with the single-browser config.

Run time increased from 11 minutes to 14 minutes (not 44 minutes, because
non-Chrome projects only run smoke tests). The team accepted the extra 3
minutes as a worthwhile trade for 4-browser coverage on the critical paths.

We also added the auth setup project as a dependency, replacing inline login
in `beforeEach` hooks. That alone removed 400 seconds of login time from a
200-test suite run.

---

## Chapter Summary

- A project is a named entry in the `projects` array — defines name, use overrides, dependencies, grep, and testMatch.
- `devices['Desktop Chrome']` etc. provide pre-configured viewport, userAgent, and browser engine — spread into `use`.
- Project `use` overrides the global `use`; settings not overridden are inherited from global.
- Multi-browser: same tests, different device presets — results grouped by project in the HTML report.
- Multi-environment: same tests, different `baseURL` and `storageState` per project — switch with `--project` flag.
- Project-level `grep` filters which tests that project runs — run only smoke tests on Firefox/Safari to save time.
- Project-level `testMatch` filters which files that project runs — separate API and UI test projects.
- `dependencies` sequences projects — a project waits until all its dependencies finish successfully.
- Dependency failure: dependent projects are skipped with a visible reason in the report (not hundreds of fake failures).
- Chained dependencies: Playwright resolves the graph and parallelises where possible.
- Role-based projects: one setup file per role writes one auth state file; test projects load the matching file.
- Setup project vs `globalSetup`: setup projects have full fixture access and are visible in the report.
- `--project=name` runs a single project; `--project=a --project=b` runs multiple.
- Always add `.auth/` to `.gitignore` — auth state files contain active session tokens.
