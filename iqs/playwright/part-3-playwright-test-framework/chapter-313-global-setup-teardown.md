# Chapter 313 — Global Setup & Teardown

This chapter covers the full spectrum of suite-level setup in Playwright —
from worker-scoped fixtures to `globalSetup` to project dependencies. This
topic reveals architectural thinking: candidates who understand the scope
hierarchy can design efficient, maintainable suites. Candidates who conflate
`beforeAll` with "global setup" reveal a gap that matters at scale.

---

## Q313.1 — What does "global setup" actually mean in Playwright?

"Global" is the most misused word in Playwright setup discussions. Different
engineers mean different things:

- "My `beforeAll` that runs before all tests in this file" — **not global**
- "My worker fixture that runs once per worker" — **not global**
- "My `globalSetup` function in the config" — **genuinely global**

The full scope hierarchy:

| Mechanism | Runs | Truly global? |
|---|---|---|
| `beforeEach` in a describe | Before every test in that describe | ❌ |
| `beforeAll` in a describe | Once before tests in that describe | ❌ |
| File-level `beforeAll` | Once before tests in one file | ❌ |
| Worker-scoped fixture | Once when a worker starts | ❌ — N workers = N setups |
| Project `dependencies` | Once before a dependent project | ❌ — scoped to that project |
| `globalSetup` in config | Once before any worker starts | ✅ |
| `globalTeardown` in config | Once after all workers finish | ✅ |

Only `globalSetup` and `globalTeardown` run exactly once for the entire suite —
before any worker starts and after all workers finish.

---

## Q313.2 — What is a worker-scoped fixture and when should you use it?

A worker-scoped fixture runs its setup once when a worker process starts and
is shared across all tests that worker runs. Teardown runs when the worker
finishes all its tests.

```typescript
// fixtures/baseFixture.ts
type WorkerFixtures = {
  workerAuthToken: string;
};

export const test = base.extend<{}, WorkerFixtures>({

  workerAuthToken: [async ({ request }, use) => {
    // Runs once when this worker starts
    const response = await request.post('/api/v2/auth/login', {
      data: { username: 'Admin', password: 'admin123' },
    });
    const { token } = await response.json();

    await use(token); // shared across all this worker's tests

    // Teardown: runs once when this worker finishes
    await request.post('/api/v2/auth/logout', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }, { scope: 'worker' }],

});
```

With 4 workers and 200 tests:
```
Before: 200 login calls (one per test)
After:  4 login calls (one per worker)
```

**Use worker-scoped fixtures when:** each worker needs its own isolated
resource — its own auth token, its own database user, its own temporary
directory. The setup runs N times for N workers, but each instance is
worker-specific.

---

## Q313.3 — How does a worker-scoped fixture provide an authenticated browser session?

For UI tests that use `page`, save the browser auth state to a worker-specific
file and override the `context` fixture to load it:

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

    // Unique path per worker — prevents workers overwriting each other
    const statePath = `./temp/worker-${test.info().workerIndex}-state.json`;
    await context.storageState({ path: statePath });
    await context.close();

    await use(statePath);
  }, { scope: 'worker' }],

  // Override context so every test's page starts pre-authenticated
  context: async ({ browser, workerStorageState }, use) => {
    const ctx = await browser.newContext({ storageState: workerStorageState });
    await use(ctx);
    await ctx.close();
  },

});
```

Every `page` in every test is now backed by a pre-authenticated context.
No login code in any test file.

---

## Q313.4 — What is globalSetup and what makes it different from all other setup mechanisms?

`globalSetup` is a function you configure in `playwright.config.ts`. It is
the only mechanism that runs exactly once for the entire suite:

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});
```

What makes it unique:
- Runs in a **separate Node.js process** — not inside the test runner
- Has **no access to Playwright fixtures** — you manage everything manually
- Runs **before any worker starts** and **before any test file loads**
- Is **not visible in the HTML report** — failures appear in the terminal only
- Receives the **full resolved config** as its argument

```typescript
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  // Must launch browser manually — no fixtures here
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${baseURL}/web/index.php/auth/login`);
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);

  await context.storageState({ path: '.auth/admin.json' });

  // Must close manually — no automatic cleanup
  await browser.close();
}
```

```typescript
// global-teardown.ts
export default async function globalTeardown() {
  // Runs once after all tests finish
  console.log('Suite complete — cleaning up');
}
```

---

## Q313.5 — What is the most common use case for globalSetup?

The most common use is saving authentication state once, shared by all workers:

```typescript
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';

export default async function globalSetup(config: FullConfig) {
  fs.mkdirSync('.auth', { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${config.projects[0].use.baseURL}/login`);
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);

  // One session file, shared by all workers
  await context.storageState({ path: '.auth/admin.json' });
  await browser.close();
}
```

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: './global-setup.ts',
  use: {
    storageState: '.auth/admin.json', // every test loads the saved session
  },
});
```

Flow:
```
globalSetup → 1 login → saves .auth/admin.json
4 workers start → each loads .auth/admin.json → no logins in tests
Total logins: 1 (down from 200)
```

---

## Q313.6 — What happens when globalSetup throws an error?

When `globalSetup` throws, Playwright **aborts the entire suite** — no tests
run at all. The error appears in the terminal but **not in the HTML report**
because the test runner never started:

```
Error: globalSetup failed:
  Error: net::ERR_CONNECTION_REFUSED — https://demo.orangehrmlive.com/login
  at globalSetup (global-setup.ts:15:3)
```

This is the main downside of `globalSetup` — failure diagnosis is harder.
There is no report to open, no trace to inspect. You debug from terminal
output alone.

Contrast this with project dependency failures (covered in Q32.9): when a
setup project fails, the HTML report shows the failure clearly, with
screenshots and a visible reason why dependent projects were skipped.

---

## Q313.7 — How do you share data from globalSetup to tests?

`globalSetup` runs in a separate process. It cannot share JavaScript variables
directly with tests. Two approaches:

**Via environment variables** (strings only):

```typescript
// global-setup.ts
export default async function globalSetup() {
  const testRunId = `run-${Date.now()}`;
  process.env.TEST_RUN_ID = testRunId;
  // Available in all tests via process.env.TEST_RUN_ID
}
```

```typescript
// any test
test('attaches run ID @smoke', async ({ page }) => {
  console.log(process.env.TEST_RUN_ID); // 'run-1748234567890'
});
```

**Via JSON files** (structured data):

```typescript
// global-setup.ts
import fs from 'fs';

export default async function globalSetup() {
  const seededData = {
    employeeIds: ['EMP001', 'EMP042', 'EMP099'],
    adminCredentials: { username: 'Admin', password: 'admin123' },
    setupTimestamp: new Date().toISOString(),
  };

  fs.mkdirSync('.test-data', { recursive: true });
  fs.writeFileSync('.test-data/setup.json', JSON.stringify(seededData, null, 2));
}
```

```typescript
// any test
import setupData from '../../.test-data/setup.json';

test('seeded employee appears in list @smoke', async ({ employeeListPage }) => {
  await employeeListPage.searchById(setupData.employeeIds[0]);
  await expect(employeeListPage.getResultRow('Linda Anderson')).toBeVisible();
});
```

Environment variables for simple values, JSON files for structured data.

---

## Q313.8 — What does globalSetup receive as its argument and why does it matter?

`globalSetup` receives the full resolved `FullConfig` object — the complete
config after all environment variables and overrides are applied. Use it to
avoid hardcoding values that are already in the config:

```typescript
import { chromium, FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  // Read from config — not hardcoded
  const baseURL = config.projects[0].use.baseURL as string;
  const storageStatePath = config.projects[0].use.storageState as string;
  const workerCount = config.workers;

  console.log(`Running globalSetup for ${workerCount} workers against ${baseURL}`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${baseURL}/login`);
  // ... login ...
  await context.storageState({ path: storageStatePath as string });
  await browser.close();
}
```

When `BASE_URL=https://staging.example.com npx playwright test` is run,
the `globalSetup` automatically uses the staging URL — no edits required.

---

## Q313.9 — What are project dependencies and how do they differ from globalSetup?

Project dependencies let one Playwright project depend on another. The
dependent project does not start until its dependencies finish successfully.
This enables browser-based setup that is **visible in the HTML report**:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
      // No dependencies — runs first
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      dependencies: ['setup'], // waits for setup to finish
    },
  ],
});
```

```typescript
// tests/setup/auth.setup.ts — a regular Playwright test file
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

Key differences from `globalSetup`:

| | `globalSetup` | Project dependencies |
|---|---|---|
| Fixture access | ❌ Manual browser only | ✅ Full — `page`, custom fixtures |
| Visible in report | ❌ No | ✅ Yes — passes/fails visibly |
| Failure behaviour | Aborts suite, terminal only | Dependent projects skipped, shown in report |
| Written as | Plain TypeScript function | Regular `test()` / `setup()` call |
| Best for | DB seeding, server start, no browser | Browser-based auth state, config checks |

---

## Q313.10 — How do you set up multiple user roles using project dependencies?

Each role gets its own setup file and its own auth state file. Tests projects
depend on the relevant role's setup:

```typescript
// tests/setup/admin.setup.ts
import { test as setup } from '@playwright/test';

setup('save admin auth', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('Admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);
  await page.context().storageState({ path: '.auth/admin.json' });
});
```

```typescript
// tests/setup/employee.setup.ts
import { test as setup } from '@playwright/test';

setup('save employee auth', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('John.Smith');
  await page.getByLabel('Password').fill('Employee@123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);
  await page.context().storageState({ path: '.auth/employee.json' });
});
```

```typescript
// playwright.config.ts
projects: [
  { name: 'admin-auth',    testMatch: '**/admin.setup.ts'    },
  { name: 'employee-auth', testMatch: '**/employee.setup.ts' },
  {
    name: 'admin-tests',
    dependencies: ['admin-auth'],
    use: { storageState: '.auth/admin.json' },
    grep: /@admin/,
  },
  {
    name: 'employee-tests',
    dependencies: ['employee-auth'],
    use: { storageState: '.auth/employee.json' },
    grep: /@employee/,
  },
],
```

The HTML report shows both setup tests as passing before the main tests run.
If `admin-auth` fails, `admin-tests` is skipped with a clear reason in the report.

---

## Q313.11 — What does storageState save and why must it be gitignored?

`context.storageState({ path: '.auth/admin.json' })` captures the entire
browser session state:

- **Cookies** — session cookies, CSRF tokens, remember-me tokens
- **localStorage** — data stored in `window.localStorage`
- **sessionStorage** — data stored in `window.sessionStorage`

When Playwright loads this state (`storageState: '.auth/admin.json'` in
config), it restores everything into the browser context before the test
starts. The server sees a valid authenticated session.

```json
// .auth/admin.json — example structure
{
  "cookies": [
    {
      "name": "PHPSESSID",
      "value": "abc123xyz...",
      "domain": "demo.orangehrmlive.com",
      "secure": true,
      "httpOnly": true
    }
  ],
  "origins": [
    {
      "origin": "https://demo.orangehrmlive.com",
      "localStorage": [{ "name": "user", "value": "{\"id\":1,\"role\":\"Admin\"}" }]
    }
  ]
}
```

**Always add `.auth/` to `.gitignore`:**
```
# .gitignore
.auth/
.test-data/
test-results/
playwright-report/
```

Auth state files contain active session tokens. Committing them is a
security vulnerability — anyone with the file can impersonate the session.

---

## Q313.12 — How do you combine globalSetup with project dependencies in a real project?

Use `globalSetup` for non-browser work (database seeding, server health
checks) and project dependencies for browser-based auth:

```typescript
// global-setup.ts — database seeding, no browser
import { FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  // Seed test data — purely Node.js, no browser needed
  const apiBase = config.projects[0].use.baseURL as string;

  const response = await fetch(`${apiBase}/api/test/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Seed-Key': process.env.SEED_KEY! },
    body: JSON.stringify({ dataset: 'baseline' }),
  });

  if (!response.ok) {
    throw new Error(`Database seeding failed: ${response.status}`);
  }
}
```

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: './global-setup.ts',        // DB seeding — runs first
  globalTeardown: './global-teardown.ts',  // DB cleanup — runs last

  projects: [
    { name: 'auth', testMatch: '**/auth.setup.ts' },           // login, save state
    { name: 'chromium', dependencies: ['auth'],                // main tests
      use: { storageState: '.auth/admin.json' } },
  ],
});
```

Execution order:
```
1. globalSetup runs — seeds database (no browser)
2. auth project runs — logs in, saves .auth/admin.json
3. chromium project runs — all tests start pre-authenticated
4. globalTeardown runs — cleans up database
```

---

## Q313.13 — How do you decide which setup mechanism to use?

Three questions determine the right choice:

**Does the setup need to run only once for the whole suite?**
→ Yes, and it does not need a browser → `globalSetup`
→ Yes, and it needs a browser → project dependencies
→ No, each worker needs its own instance → worker-scoped fixture

**Does the setup involve browser interaction?**
→ Yes → avoid `globalSetup` (no fixtures, harder to debug); use project dependencies
→ No → `globalSetup` is fine and simpler

**Do you want setup failures visible in the HTML report?**
→ Yes → project dependencies (appears as a test, with full report visibility)
→ No (or report not needed) → `globalSetup` (terminal output only)

**Decision table:**

| Situation | Best mechanism |
|---|---|
| Start a test server or mock service | `globalSetup` |
| Seed a database via API | `globalSetup` |
| Save admin auth state (single role) | Project dependency |
| Save multiple role auth states | Multiple project dependencies |
| Per-worker isolated auth token | Worker-scoped fixture |
| Per-worker isolated DB connection | Worker-scoped fixture |

---

## Q313.14 — What is the FullConfig type and what can you read from it?

`FullConfig` is the resolved configuration object passed to `globalSetup`.
It reflects all env-var substitutions and defaults applied:

```typescript
import { chromium, FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  // Project-level settings
  const baseURL  = config.projects[0].use.baseURL as string;
  const state    = config.projects[0].use.storageState as string;

  // Top-level settings
  const workers  = config.workers;       // number of parallel workers
  const retries  = config.retries;       // retry count
  const timeout  = config.timeout;       // test timeout ms
  const outputDir = config.outputDir;    // where artefacts go

  console.log(`Setup: ${workers} workers, ${retries} retries → ${baseURL}`);
}
```

Reading from `FullConfig` instead of hardcoding means your `globalSetup`
works correctly across all environments without modification.

---

## Q313.15 — How did you implement global setup in your OrangeHRM project?

Our project uses a three-layer approach:

**Layer 1 — `globalSetup`:** Health-checks the application and seeds the
baseline employee dataset via the REST API. If the app is down or seeding
fails, the suite aborts immediately with a clear error message — avoiding
200 tests failing with "page not found."

```typescript
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL as string;

  // Health check first — fail fast if the app is not up
  try {
    const r = await fetch(`${baseURL}/web/index.php/auth/login`);
    if (!r.ok) throw new Error(`App returned ${r.status}`);
  } catch (e) {
    throw new Error(`Application not reachable at ${baseURL}: ${e}`);
  }

  // Seed baseline data via API
  await fetch(`${baseURL}/api/test/seed-baseline`, {
    method: 'POST',
    headers: { 'X-Seed-Key': process.env.SEED_KEY! },
  });
}
```

**Layer 2 — Project dependency:** An `auth.setup.ts` file logs in and saves
`.auth/admin.json`. All test projects depend on this. It is visible in the
HTML report — when it fails, we can see the screenshot and trace.

**Layer 3 — Worker-scoped fixture:** For API test workers, an `authToken`
worker fixture calls the login API once per worker and attaches the token
to all API requests in that worker's tests.

This combination meant our 200-test suite went from 18 minutes (38% wasted
on logins) to 11.5 minutes — the actual test logic. The health-check abort
also eliminated 20 minutes of confusion every few weeks when someone ran
tests against a misconfigured environment.

---

## Q313.16 — What is globalTeardown and what should go in it?

`globalTeardown` runs once after all workers finish all tests. It receives no
arguments (the config is not passed, unlike `globalSetup`):

```typescript
// global-teardown.ts
export default async function globalTeardown() {
  // Runs once — all tests done, all workers closed

  // Clean up seeded test data
  await cleanupSeedData();

  // Close external connections
  await dbConnection?.close();

  // Notify a monitoring service
  await fetch('https://monitoring.example.com/test-complete', {
    method: 'POST',
    body: JSON.stringify({ completedAt: new Date().toISOString() }),
  });

  // Remove temporary files
  fs.rmSync('.test-data', { recursive: true, force: true });
}
```

**Appropriate uses:**
- Clean up seeded database records
- Close persistent connections opened in `globalSetup`
- Send test completion notifications
- Remove temporary auth files or generated data

**What not to put here:**
- Anything that must run even if tests are interrupted (use `afterAll` in
  the setup project instead)
- Browser interactions (no browser is open at this point)
- Report generation (Playwright generates reports before `globalTeardown`)

---

## Q313.17 — How does beforeAll differ from globalSetup in scope and behaviour?

This is the most important distinction in this topic area:

**`beforeAll` in a describe block:**
```typescript
test.describe('Employee Module', () => {
  test.beforeAll(async ({ browser }) => {
    // Runs once before the first test in this describe
    // Only for tests in THIS describe — not globally
    // Runs per worker if multiple workers pick up tests from this file
    // Has worker-scoped fixture access (browser, request)
    // Is NOT page-scoped (page not available)
  });
});
```

**`globalSetup` in the config:**
```typescript
export default async function globalSetup(config: FullConfig) {
  // Runs exactly once — before any worker starts
  // Before any test file loads
  // No fixture access whatsoever — plain Node.js
  // Receives FullConfig
  // Failure aborts the entire suite
}
```

| | `beforeAll` | `globalSetup` |
|---|---|---|
| Scope | One describe / one file | Entire suite |
| Runs per worker? | Yes | No — exactly once |
| Fixture access | Worker-scoped fixtures | None |
| Visible in report | No | No |
| Config access | No | Yes — receives FullConfig |
| On failure | That describe skipped | Entire suite aborted |

The most common interview mistake is saying "I put my auth setup in
`beforeAll` — that's my global setup." `beforeAll` is not global.

---

## Q313.18 — What files should be gitignored as a result of global setup and teardown?

Setup and teardown generate files that must never be committed:

```
# .gitignore

# Auth state files — contain active session tokens
.auth/

# Test data generated by globalSetup
.test-data/

# Worker-specific temporary state files
temp/

# Playwright output — regenerated on every run
test-results/
playwright-report/

# Snapshots (visual baselines) — often committed, but check team preference
# snapshots/
```

The `.auth/` directory is critical. Session token files — the output of
`context.storageState()` — give anyone who has them the ability to
impersonate an authenticated session against the application. They must
never be committed to source control.

The `temp/` directory (used for worker-specific state files like
`worker-0-state.json`) contains the same type of data and deserves the
same treatment.

---

## Chapter Summary

- "Global setup" is commonly misused. Only `globalSetup` in the config is truly global — `beforeAll` and worker fixtures are scoped.
- Worker-scoped fixtures run once per worker. N workers = N setups. Use for per-worker isolated resources.
- `globalSetup` runs once, before any worker starts, in a separate Node.js process with no fixture access.
- The most common use of `globalSetup`: log in and save auth state, or seed a database without a browser.
- `globalSetup` failure aborts the entire suite — no report, terminal output only. Fail fast with clear error messages.
- Share data from `globalSetup` to tests via environment variables (strings) or JSON files (structured data).
- `globalSetup` receives `FullConfig` — read `baseURL`, `storageState`, and other settings from it; do not hardcode them.
- Project dependencies: browser-based setup written as regular test files — full fixture access and visible in the HTML report.
- When a project dependency fails, dependent projects are skipped with a visible reason in the report (vs `globalSetup` terminal-only).
- Multiple role auth: one setup file per role, one `.auth/*.json` per role, each test project depends on its role's setup.
- `storageState` saves cookies, localStorage, and sessionStorage. Always add `.auth/` to `.gitignore`.
- `globalTeardown` runs once after all workers finish — for cleanup, connection closing, notifications.
- Decision: no browser needed → `globalSetup`; browser needed + report visibility needed → project dependencies; per-worker isolation needed → worker-scoped fixture.
