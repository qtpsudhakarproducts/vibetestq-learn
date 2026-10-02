# 10 — Global Setup and Teardown

## First — What "Global" Actually Means

Before explaining global setup, it is important to be clear about what the word "global" means in this context — because it is one of the most misused terms in Playwright.

When engineers say "global setup," they often mean different things:

> "I have a `beforeAll` that runs before all my tests in this file — that is my global setup."

> "I have a worker fixture that logs in once per worker — that is my global setup."

> "I have a `globalSetup` function in my config — that is my global setup."

Only the last one is actually global. The others are scoped — they apply to a subset of tests, not the entire suite.

Here is the full picture of setup scope in Playwright:

| Mechanism | Runs | Scope | Is it truly global? |
|---|---|---|---|
| `beforeEach` inside a describe | Before every test in that describe | One describe block | ❌ No |
| `beforeAll` inside a describe | Once before the first test in that describe | One describe block | ❌ No |
| File-level `beforeAll` | Once before all tests in one file | One spec file | ❌ No |
| Worker-scoped fixture | Once when a worker starts | All tests that one worker runs | ❌ No — each worker gets its own instance |
| Project `dependencies` | Once before a dependent project starts | All tests in the dependent project | ❌ No — scoped to project run |
| `globalSetup` in config | Once before any worker starts, any file loads | The entire suite — all workers, all files | ✅ Yes |
| `globalTeardown` in config | Once after all workers finish, all files done | The entire suite — all workers, all files | ✅ Yes |

This table is the mental model you need. Every mechanism above `globalSetup` is scoped to something — a describe, a file, a worker, a project. Only `globalSetup` and `globalTeardown` are truly global.

---

## The Scenario

Your OrangeHRM test suite has 200 tests across 15 spec files. Every test needs to be logged in before it can do anything useful. Currently every test does the login itself — navigate to login, fill credentials, click Login, wait for dashboard.

Here is what that costs:

```
200 tests × 1 login per test = 200 login operations per suite run
Each login takes ~2 seconds
Total login time: ~400 seconds = nearly 7 minutes

Your actual test logic takes 11 minutes
Total suite time: 18 minutes — 38% of CI time is just logging in
```

You need a way to log in once and share that session across all tests. But "once" needs to mean different things depending on your situation:

- **Once per worker** — each worker logs in when it starts, shares that session across all tests it runs
- **Once for the entire suite** — one login, one saved session file, every worker loads it

Both are valid approaches. They use different mechanisms. Understanding when to use which is what this note is about.

---

## Mechanism 1 — Worker-Scoped Fixture (Once Per Worker)

A worker-scoped fixture runs its setup code once when a worker process starts. Every test that worker runs gets access to the same fixture value. When the worker finishes all its tests, the fixture teardown runs.

This is **not global** — it is per-worker. If you have 4 workers, the setup runs 4 times. But it is still a significant improvement over running it once per test.

### When to Use Worker-Scoped Fixtures

Use a worker-scoped fixture when:
- The setup needs to be unique per worker (each worker needs its own database user, port, or session)
- You are comfortable with N setups for N workers
- You want the setup defined alongside the code that uses it, not in a separate config file

### Example — Auth Token Shared Across a Worker's Tests

```typescript
// fixtures/baseFixture.ts
import { test as base, expect, Browser } from '@playwright/test';

type WorkerFixtures = {
  workerAuthToken: string;
};

export const test = base.extend<{}, WorkerFixtures>({

  workerAuthToken: [async ({ request }, use) => {
    // Runs once when this worker starts
    // Every test this worker runs gets the same token
    console.log(`Worker ${test.info().workerIndex}: obtaining auth token`);

    const response = await request.post('/api/v2/auth/login', {
      data: { username: 'Admin', password: 'admin123' },
    });
    const { token } = await response.json();

    // Hand the token to all tests this worker runs
    await use(token);

    // Teardown: runs once when this worker finishes
    console.log(`Worker ${test.info().workerIndex}: revoking auth token`);
    await request.post('/api/v2/auth/logout', {
      headers: { Authorization: `Bearer ${token}` },
    });

  }, { scope: 'worker' }],  // ← this is what makes it worker-scoped

});
```

```typescript
// tests/leave/leave-api.spec.ts
import { test, expect } from '../../fixtures/baseFixture';

test('fetch leave balance @smoke', async ({ workerAuthToken, request }) => {
  // workerAuthToken was obtained once when this worker started
  // It is the same token for all tests in this worker
  const response = await request.get('/api/v2/leave/balance', {
    headers: { Authorization: `Bearer ${workerAuthToken}` },
  });
  expect(response.status()).toBe(200);
});

test('fetch leave types @regression', async ({ workerAuthToken, request }) => {
  // Same token — no second login
  const response = await request.get('/api/v2/leave/types', {
    headers: { Authorization: `Bearer ${workerAuthToken}` },
  });
  expect(response.status()).toBe(200);
});
```

With 4 workers and 200 tests:
```
Worker 0 starts → obtains token once → runs 50 tests → revokes token
Worker 1 starts → obtains token once → runs 50 tests → revokes token
Worker 2 starts → obtains token once → runs 50 tests → revokes token
Worker 3 starts → obtains token once → runs 50 tests → revokes token

Total logins: 4  (down from 200)
```

### Worker-Scoped Fixture With a Browser Session

When your tests use `page` (UI tests, not just API tests), a worker-scoped fixture can save and load browser state — so each worker's tests start pre-authenticated:

```typescript
type WorkerFixtures = {
  workerStorageState: string;
};

export const test = base.extend<{}, WorkerFixtures>({

  workerStorageState: [async ({ browser }, use) => {
    // Each worker creates its own browser context to log in
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/web/index.php/auth/login');
    await page.getByPlaceholder('Username').fill('Admin');
    await page.getByPlaceholder('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(/dashboard/);

    // Save this worker's auth state to a unique file
    const statePath = `./temp/worker-${test.info().workerIndex}-state.json`;
    await context.storageState({ path: statePath });
    await context.close();

    // Hand the path to tests — they load it when creating their context
    await use(statePath);

  }, { scope: 'worker' }],

  // Override the context fixture to load the worker's auth state
  context: async ({ browser, workerStorageState }, use) => {
    const context = await browser.newContext({
      storageState: workerStorageState,
    });
    await use(context);
    await context.close();
  },

});
```

Now every `page` in every test is backed by a pre-authenticated context — without a single login in any test file.

---

## Mechanism 2 — globalSetup and globalTeardown (Once for the Entire Suite)

`globalSetup` is the only truly global setup mechanism in Playwright. It runs **once**, before any worker starts and before any test file is loaded. It is configured in `playwright.config.ts`:

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});
```

### What Makes globalSetup Different from Everything Else

- Runs in a **separate Node.js process** — not inside the test runner
- Has **no access to Playwright fixtures** — you manage everything manually
- Is **not visible in the HTML report** — it runs silently before the report even starts
- Runs **exactly once** regardless of how many workers, files, or tests you have
- Receives the **full resolved config** as its argument

### Example — Save Auth State Once, Used by All Workers

This is the most common use of `globalSetup`. Log in once, save the session to a file. Every worker loads that file instead of logging in again.

```typescript
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export default async function globalSetup(config: FullConfig) {
  // Read baseURL from the config — not hardcoded
  const { baseURL } = config.projects[0].use;

  // Ensure the .auth directory exists
  fs.mkdirSync('.auth', { recursive: true });

  // Manually launch a browser — no fixtures available here
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log in
  await page.goto(`${baseURL}/web/index.php/auth/login`);
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);

  // Save the session — cookies, localStorage, sessionStorage
  await context.storageState({ path: '.auth/admin.json' });

  // Always close the browser manually — no automatic cleanup
  await browser.close();

  console.log('Global setup complete — auth state saved to .auth/admin.json');
}
```

```typescript
// global-teardown.ts
export default async function globalTeardown() {
  // Runs once after all tests finish
  // Clean up files, notify services, record completion
  console.log('Global teardown complete');
}
```

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  use: {
    baseURL: 'https://demo.orangehrmlive.com',
    storageState: '.auth/admin.json',  // every test loads the saved auth state
  },
});
```

Now the flow is:
```
globalSetup runs once:
  → launches browser manually
  → logs in
  → saves .auth/admin.json
  → closes browser

4 workers start simultaneously:
  → each loads .auth/admin.json
  → every test starts pre-authenticated
  → no login ever happens inside a test

globalTeardown runs once:
  → all workers finished
  → cleanup
```

Total logins: **1**. Down from 200.

### The FullConfig Argument

`globalSetup` receives the complete resolved config. Use it to avoid hardcoding values:

```typescript
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL as string;
  const storageStatePath = config.projects[0].use.storageState as string;
  const workers = config.workers;

  console.log(`Setting up for ${workers} workers against ${baseURL}`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${baseURL}/login`);
  // ... login logic ...
  await context.storageState({ path: storageStatePath });
  await browser.close();
}
```

### Sharing Data from globalSetup to Tests

`globalSetup` runs in a separate process. It cannot share JavaScript variables with tests directly. Two ways to pass data:

**Via environment variables** (strings only):

```typescript
// global-setup.ts
export default async function globalSetup() {
  const testRunId = `run-${Date.now()}`;
  process.env.TEST_RUN_ID = testRunId;
  // This environment variable is available in all tests
}
```

```typescript
// in a test
test('uses run ID @smoke', async ({ page }) => {
  console.log(process.env.TEST_RUN_ID); // 'run-1748234567890'
});
```

**Via JSON files** (any data):

```typescript
// global-setup.ts
import fs from 'fs';

export default async function globalSetup() {
  const seededData = {
    employeeIds: ['EMP001', 'EMP042', 'EMP099'],
    leaveTypeIds: [1, 2, 3, 4],
    setupTimestamp: new Date().toISOString(),
  };

  fs.mkdirSync('.test-data', { recursive: true });
  fs.writeFileSync('.test-data/setup.json', JSON.stringify(seededData, null, 2));
}
```

```typescript
// in a test
import setupData from '../../.test-data/setup.json';

test('seeded employee appears in list @smoke', async ({ employeeListPage }) => {
  await employeeListPage.searchById(setupData.employeeIds[0]);
  await expect(employeeListPage.getResultRow('Linda Anderson')).toBeVisible();
});
```

### globalSetup Failure Behaviour

When `globalSetup` throws an error, **no tests run**. Playwright aborts the entire suite immediately. The error message appears in the terminal but does not appear in the HTML report — because the report is generated by the test runner which never started.

```
Error: globalSetup failed:
  Error: net::ERR_CONNECTION_REFUSED - https://demo.orangehrmlive.com/login
```

This is the main downside of `globalSetup` — failure diagnosis is harder than with fixtures or project dependencies, because there is no report to open, no trace to inspect.

---

## Mechanism 3 — Project dependencies (Using projects in config)

When you configure projects in `playwright.config.ts`, you can make one project depend on another using the `dependencies` option. The dependent project does not start until the projects it depends on have all finished successfully.

This is not a separate global setup mechanism — it is a feature of project configuration. But it can be used to achieve a similar result to `globalSetup` for browser-based setup.

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    // This project runs an auth file first
    {
      name: 'auth',
      testMatch: '**/auth.setup.ts',
    },

    // These projects wait for auth to finish before starting
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['auth'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['auth'],
    },
  ],
});
```

```typescript
// tests/auth.setup.ts — a regular Playwright test file
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

**What makes this different from `globalSetup`:**

- The auth file is a **regular test file** — written with `test()`, using fixtures like `page`
- It appears in the **HTML report** — you can see if it passed or failed
- If it fails, the dependent projects are **clearly skipped** with a visible reason in the report
- It runs inside the **test runner** — full fixture access, tracing, screenshots

**What it is NOT:**
- It is not a special "setup project" type — it is a regular project with `testMatch` pointing to one file
- It is not truly global in the same sense as `globalSetup` — it is scoped to the projects that depend on it
- The auth file is a test that happens to save state — it is just regular test code

**The full explanation of projects and dependencies** is in the Projects notes. This section just introduces the concept of using project dependencies for setup purposes.

---

## Comparing All Three Mechanisms

| | Worker-scoped fixture | `globalSetup` | Project dependencies |
|---|---|---|---|
| **Runs how many times** | Once per worker | Once total | Once per dependency chain |
| **Has fixture access** | ✅ Full fixture access | ❌ Manual browser only | ✅ Full fixture access |
| **Visible in report** | ❌ No | ❌ No | ✅ Yes — appears as a test |
| **Failure visibility** | In the test that uses it | Terminal only — no report | Report shows skip reason |
| **Where defined** | Fixtures file | Separate file + config | Config + regular spec file |
| **Data sharing** | Via fixture return value | Via env vars or JSON files | Via files (storageState etc.) |
| **Best for** | Per-worker isolated resources | Non-browser setup, DB seeding | Browser-based setup with report visibility |
| **Complexity** | Low | Medium | Medium |

### The Decision

**Use a worker-scoped fixture when:**
Each worker needs its own isolated instance of something — its own database user, its own auth token, its own temporary directory. The setup is different per worker by design.

```
4 workers → 4 setups, each unique
Each worker's tests share that worker's resource
```

**Use `globalSetup` when:**
You need to do something once for the entire suite that does not involve a browser — start a server, seed a database, generate config files, connect to an external service.

```
1 setup → no browser → no test runner → plain Node.js
```

**Use project dependencies when:**
You need to do something once using a browser and you want it visible in the report — typically saving authentication state that all test projects will load.

```
1 setup file → regular test code → full fixtures → visible in report
```

---

## Practical Setup for OrangeHRM

### Scenario 1 — Auth Only, Simple Suite

Use project dependencies. Write a regular test file that logs in and saves state. All other tests load that state.

```
global-setup: not needed
worker fixture: not needed
project auth file: logs in once, saves .auth/admin.json
all tests: load .auth/admin.json via storageState in config
```

### Scenario 2 — Auth + Database Seeding

Combine `globalSetup` for the database work and project dependencies for the auth:

```typescript
// global-setup.ts — database seeding, no browser
export default async function globalSetup() {
  await db.connect();
  await db.truncate(['leave_requests', 'temp_employees']);
  await db.seed('./data/baseline.sql');
  await db.close();
}

// global-teardown.ts — database cleanup
export default async function globalTeardown() {
  await db.connect();
  await db.cleanup();
  await db.close();
}
```

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  projects: [
    { name: 'auth', testMatch: '**/auth.setup.ts' },
    { name: 'chromium', dependencies: ['auth'], use: { storageState: '.auth/admin.json' } },
  ],
});
```

### Scenario 3 — Multiple User Roles

Each role needs its own auth state:

```typescript
// tests/setup/admin.setup.ts
setup('save admin auth', async ({ page }) => {
  // login as admin, save .auth/admin.json
});

// tests/setup/employee.setup.ts
setup('save employee auth', async ({ page }) => {
  // login as employee, save .auth/employee.json
});

// playwright.config.ts
projects: [
  { name: 'admin-auth',    testMatch: '**/admin.setup.ts' },
  { name: 'employee-auth', testMatch: '**/employee.setup.ts' },
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

---

## What storageState Contains

When you call `context.storageState({ path: '.auth/admin.json' })`, Playwright saves:

- **Cookies** — session cookies, CSRF tokens, remember-me tokens
- **localStorage** — data stored in `window.localStorage`
- **sessionStorage** — data stored in `window.sessionStorage`

When Playwright loads this state (`storageState: '.auth/admin.json'` in config), it restores all of it into the browser context before the test starts. The server sees a valid session — as if the user had just logged in.

Always add `.auth/` to `.gitignore`. Auth state files contain session tokens and must never be committed:

```
# .gitignore
.auth/
.test-data/
test-results/
playwright-report/
```

---

## Key Points

- `beforeAll` is not global setup — it is scoped to a describe block or file
- Worker-scoped fixtures are not global — they run once per worker; N workers = N setups
- `globalSetup` in the config is the only truly global mechanism — runs once before any worker starts
- Worker-scoped fixture: once per worker, full fixture access, best for per-worker isolated resources
- `globalSetup`: once total, no fixture access, runs as plain Node.js, not visible in report, best for non-browser setup
- Project dependencies: once per dependency chain, full fixture access, visible in HTML report, best for browser-based setup like auth
- `globalSetup` failure aborts the entire suite — no report, terminal output only
- Project dependency failure — dependent projects are skipped with a visible reason in the report
- Share data from `globalSetup` to tests via environment variables (strings) or JSON files (any data)
- `storageState` saves cookies, localStorage, sessionStorage — loading it gives every test a pre-authenticated browser
- Always add `.auth/` to `.gitignore` — session tokens must never be committed
- In practice: use `globalSetup` for database/server setup, project dependencies for auth state, worker fixtures for per-worker isolated resources
