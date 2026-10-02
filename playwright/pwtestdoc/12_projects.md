# 12 — Projects

## The Scenario

Your OrangeHRM test suite has been running on Chrome only. Everything passes. Your manager asks: "Do our tests pass on Firefox and Safari too?"

You do not know. You have never run them on anything other than Chrome.

You could duplicate every spec file and change the browser setting. But that means 15 files become 45. Every test update happens in three places. That is not a solution — that is a maintenance disaster.

Projects solve this. A project is a named configuration that runs your test suite — or a subset of it — under a specific set of settings. You define projects in `playwright.config.ts`. Playwright runs each project and reports results per project. Your tests do not change at all.

---

## What a Project Is

A project is an entry in the `projects` array in `playwright.config.ts`. Each project has:

- A **name** — how it appears in reports and CLI output
- A **`use` block** — settings that override the global `use` block for this project's tests
- An optional **`testMatch`** — which test files this project runs (defaults to all tests)
- An optional **`testIgnore`** — which files to exclude for this project
- An optional **`dependencies`** — other projects that must complete before this one starts
- An optional **`grep`** — tag filter applied to this project's tests

When you run `npx playwright test`, Playwright runs every project defined in the config. When you run `npx playwright test --project=chromium`, it runs only that one project.

---

## Basic Multi-Browser Setup

The most common use of projects — running the same tests on multiple browsers:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'https://demo.orangehrmlive.com',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

`devices['Desktop Chrome']` is a preset from Playwright that sets the correct `userAgent`, `viewport`, and browser engine for that device. Spreading it with `...devices['Desktop Chrome']` applies all those settings into the project's `use` block.

When you run `npx playwright test`, all 200 tests run on all three browsers — 600 test executions total. The HTML report groups results by project:

```
Chromium (200 tests)
  ✅ Login › valid credentials redirect to dashboard
  ✅ Employee List › shows employees by default
  ❌ Leave Module › apply leave with past date    ← only fails on Chrome

Firefox (200 tests)
  ✅ Login › valid credentials redirect to dashboard
  ❌ Employee List › date picker selects correctly ← only fails on Firefox
  ✅ Leave Module › apply leave with past date

Webkit (200 tests)
  ✅ Login › valid credentials redirect to dashboard
  ✅ Employee List › date picker selects correctly
  ✅ Leave Module › apply leave with past date
```

Without projects, you would never have found those browser-specific failures.

---

## The devices Preset

`devices` from `@playwright/test` contains presets for hundreds of real device configurations. Each preset defines the viewport size, user agent string, and default browser engine for that device.

```typescript
import { defineConfig, devices } from '@playwright/test';

// Some commonly used presets:
devices['Desktop Chrome']        // 1280×720, Chrome engine
devices['Desktop Firefox']       // 1280×720, Firefox engine
devices['Desktop Safari']        // 1280×720, Safari engine (webkit)
devices['iPhone 14']             // 390×844, Safari mobile engine
devices['iPhone 14 Pro']         // 393×852, Safari mobile engine
devices['Pixel 7']               // 412×915, Chrome mobile engine
devices['iPad Pro 11']           // 834×1194, Safari tablet engine
devices['Galaxy S9+']            // 320×658, Chrome mobile engine
```

You can override any setting from the preset in the project's `use` block:

```typescript
{
  name: 'chromium-1440',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 }, // override the preset viewport
  },
},
```

---

## Project-Level use Overrides

Each project's `use` block overrides the global `use` settings for that project's tests only. Everything not overridden falls back to the global `use`.

```typescript
export default defineConfig({
  use: {
    baseURL: 'https://demo.orangehrmlive.com',  // global default
    screenshot: 'only-on-failure',
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Inherits baseURL, screenshot, headless from global use
      },
    },
    {
      name: 'chromium-headed',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,  // override headless for this project only
      },
    },
    {
      name: 'staging',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://staging.orangehrm.example.com',  // override baseURL
      },
    },
  ],
});
```

The global `use` is the base. Projects add or override on top of it.

---

## Multi-Environment Projects

Projects are not limited to multi-browser — they can also represent different environments. The same tests run against staging and production with one config:

```typescript
export default defineConfig({
  projects: [
    {
      name: 'staging',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://staging.orangehrm.example.com',
        storageState: '.auth/staging-admin.json',
      },
    },
    {
      name: 'production',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://demo.orangehrmlive.com',
        storageState: '.auth/prod-admin.json',
      },
    },
  ],
});
```

```bash
# Run against staging only
npx playwright test --project=staging

# Run against production only
npx playwright test --project=production

# Run against both
npx playwright test
```

Switching environments is a CLI flag — not a config file edit, not a test file edit.

---

## Mobile Projects

Add mobile projects to verify your application works on phone and tablet viewports:

```typescript
export default defineConfig({
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },

    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad Pro 11'] },
    },
  ],
});
```

Each project runs all tests with that device's settings. If a test fails on mobile but passes on desktop, it stands out immediately in the report.

---

## Project-Level grep — Running Different Tests Per Project

Not every project needs to run every test. The `grep` option on a project filters which tests that project runs — exactly like `--grep` on the CLI, but configured per project.

Scenario: You want Chrome to run everything, but Firefox and Safari to run only smoke tests — to save time while still getting cross-browser coverage on critical paths:

```typescript
export default defineConfig({
  projects: [
    {
      name: 'chromium-full',
      use: { ...devices['Desktop Chrome'] },
      grep: /@smoke|@regression/,  // runs everything
    },
    {
      name: 'firefox-smoke',
      use: { ...devices['Desktop Firefox'] },
      grep: /@smoke/,  // only smoke tests on Firefox
    },
    {
      name: 'webkit-smoke',
      use: { ...devices['Desktop Safari'] },
      grep: /@smoke/,  // only smoke tests on Safari
    },
  ],
});
```

```
chromium-full (200 tests — smoke + regression)
firefox-smoke (20 tests — smoke only)
webkit-smoke  (20 tests — smoke only)

Total: 240 tests — not 600
```

You get meaningful cross-browser coverage without tripling your suite run time.

---

## Project-Level testMatch — Running Different Files Per Project

Each project can have its own `testMatch` to run a specific subset of files:

```typescript
export default defineConfig({
  projects: [
    // Only runs API tests — no browser
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
      use: {
        baseURL: 'https://demo.orangehrmlive.com',
      },
    },

    // Only runs UI tests
    {
      name: 'ui-chromium',
      testMatch: '**/ui/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // Runs everything
    {
      name: 'full-chromium',
      use: { ...devices['Desktop Chrome'] },
      // No testMatch — defaults to all tests
    },
  ],
});
```

This lets you run API tests and UI tests as separate projects with different settings, even though they live in the same repository.

---

## Project dependencies — Sequencing Projects

The `dependencies` option makes a project wait for other projects to complete before it starts. If any dependency fails, the dependent project is skipped.

This is the mechanism used to run a login file before test projects — as covered in the Global Setup notes:

```typescript
export default defineConfig({
  projects: [
    // Runs first — saves auth state
    {
      name: 'auth-setup',
      testMatch: '**/auth.setup.ts',
    },

    // Runs after auth-setup completes
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['auth-setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['auth-setup'],
    },
  ],
});
```

**Dependency failure in the report:**

```
auth-setup
  ❌ save admin auth state   (5.0s)
     Error: Login button not found — selector timeout

chromium — SKIPPED (dependency 'auth-setup' failed)
firefox  — SKIPPED (dependency 'auth-setup' failed)
```

You immediately know: auth setup failed, all test projects skipped because of it. This is far more diagnostic than every test failing with "storageState file not found."

### Chaining Dependencies

Projects can depend on multiple projects, and dependencies can be chained:

```typescript
projects: [
  { name: 'db-seed',       testMatch: '**/db.setup.ts' },
  { name: 'admin-auth',    testMatch: '**/admin.setup.ts',    dependencies: ['db-seed'] },
  { name: 'employee-auth', testMatch: '**/employee.setup.ts', dependencies: ['db-seed'] },
  {
    name: 'admin-tests',
    dependencies: ['admin-auth'],
    use: { storageState: '.auth/admin.json' },
  },
  {
    name: 'employee-tests',
    dependencies: ['employee-auth'],
    use: { storageState: '.auth/employee.json' },
  },
]
```

Execution order:
```
1. db-seed runs first
2. admin-auth and employee-auth run in parallel (both depend on db-seed)
3. admin-tests and employee-tests run in parallel (each depends on its own auth)
```

Playwright resolves the dependency graph and runs projects as soon as their dependencies are satisfied.

---

## Role-Based Projects

Different user roles need different auth states and sometimes different test subsets:

```typescript
export default defineConfig({
  projects: [
    // Auth setup for each role
    {
      name: 'admin-auth',
      testMatch: '**/setup/admin.setup.ts',
    },
    {
      name: 'employee-auth',
      testMatch: '**/setup/employee.setup.ts',
    },
    {
      name: 'manager-auth',
      testMatch: '**/setup/manager.setup.ts',
    },

    // Tests for each role
    {
      name: 'as-admin',
      testMatch: '**/admin/**/*.spec.ts',
      dependencies: ['admin-auth'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
      },
    },
    {
      name: 'as-employee',
      testMatch: '**/employee/**/*.spec.ts',
      dependencies: ['employee-auth'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/employee.json',
      },
    },
    {
      name: 'as-manager',
      testMatch: '**/manager/**/*.spec.ts',
      dependencies: ['manager-auth'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/manager.json',
      },
    },
  ],
});
```

```bash
# Run only admin role tests
npx playwright test --project=as-admin

# Run only employee role tests
npx playwright test --project=as-employee

# Run all roles
npx playwright test
```

---

## Running Specific Projects from the CLI

```bash
# Run one project
npx playwright test --project=chromium

# Run multiple projects
npx playwright test --project=chromium --project=firefox

# Run all projects matching a pattern
npx playwright test --project="*-smoke"

# List all tests across all projects without running
npx playwright test --list

# List tests for a specific project
npx playwright test --list --project=chromium
```

---

## A Complete OrangeHRM Project Configuration

Putting it all together — a realistic config for a full OrangeHRM test suite:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,

  use: {
    baseURL: process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  reporter: [
    ['html', { open: 'on-failure' }],
    ['junit', { outputFile: 'results/junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  projects: [

    // ── Auth setup ─────────────────────────────────────────────────────
    {
      name: 'admin-auth',
      testMatch: '**/setup/admin.setup.ts',
    },
    {
      name: 'employee-auth',
      testMatch: '**/setup/employee.setup.ts',
    },

    // ── Desktop browsers ──────────────────────────────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['admin-auth'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['admin-auth'],
      grep: /@smoke/,  // smoke tests only on Firefox
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['admin-auth'],
      grep: /@smoke/,  // smoke tests only on Safari
    },

    // ── Mobile ────────────────────────────────────────────────────────
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['admin-auth'],
      grep: /@smoke/,
    },

    // ── Employee role tests ────────────────────────────────────────────
    {
      name: 'as-employee',
      testMatch: '**/employee-role/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/employee.json',
      },
      dependencies: ['employee-auth'],
    },

  ],
});
```

---

## Key Points

- A project is a named configuration in the `projects` array — defines how a subset of tests runs
- Each project has `name`, `use` overrides, optional `testMatch`, `testIgnore`, `dependencies`, and `grep`
- `devices['Desktop Chrome']` — preset with correct viewport, userAgent, and browser engine; spread with `...` into the project's `use`
- Project `use` overrides the global `use` for that project's tests — everything not overridden falls back to global
- Multi-browser: same tests run on Chrome, Firefox, Safari — results grouped by project in the report
- Multi-environment: same tests against staging and production — switch with `--project` flag, no file edits
- `grep` on a project — filter which tests this project runs — use to run only smoke tests on non-primary browsers
- `testMatch` on a project — filter which files this project runs — use for role-based or type-based separation
- `dependencies` — makes a project wait for another to complete first; if dependency fails, dependent project is skipped with a clear reason in the report
- Dependency chains — Playwright resolves the graph and runs projects as soon as their dependencies are met
- `--project=chromium` on CLI — run one project; `--project=chromium --project=firefox` — run multiple
- Role-based projects: different `storageState` per project gives each role its own authenticated session
- In practice: Chrome runs everything, Firefox and Safari run smoke tests only — good cross-browser coverage without tripling run time
