# Chapter 704 — Authentication — Basics

This chapter covers Playwright's `storageState` approach to authentication —
the pattern that eliminates login overhead across test suites. Interviewers
ask these questions to judge whether candidates understand why repeated UI
login is a test smell, how `storageState` works at the browser level, and
how to implement the setup project pattern correctly. Questions at senior
level focus on multi-role setup, session expiry, and the decision between
UI login vs API login for generating auth state.

---

## Q704.1 — What is the authentication problem in test automation?

Every test that needs to verify a protected page must establish an
authenticated session first. The naive approach is to log in at the start
of every test:

```typescript
// ❌ Naive — login in every test
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('pass123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('/dashboard');
});
```

This fails at scale. If login takes 5 seconds and you have 200 tests,
that is over 16 minutes spent on login alone — time that adds nothing
to test coverage. More critically, if the authentication provider (OAuth,
SSO, Okta, Auth0) has a brief outage, every test in the suite fails on
the login step — none of them ever reach the actual feature under test.

Playwright's answer is `storageState`: log in once, save the session to
a file, inject it into every test context.

---

## Q704.2 — What is storageState in Playwright?

`storageState` is a JSON file that captures a browser context's authentication
state — cookies and local storage. When you load a `storageState` file into
a new browser context, that context is instantly authenticated as if the login
had already happened.

The file structure:

```json
{
  "cookies": [
    {
      "name":     "session_id",
      "value":    "eyJhbGciOiJIUzI1NiJ9...",
      "domain":   "example.com",
      "path":     "/",
      "httpOnly": true,
      "secure":   true,
      "sameSite": "Lax"
    }
  ],
  "origins": [
    {
      "origin": "https://example.com",
      "localStorage": [
        { "name": "auth_token", "value": "Bearer abc123..." }
      ]
    }
  ]
}
```

When Playwright injects this state into a new context, the browser treats
it as if the user had logged in normally. The application's auth middleware
sees a valid session cookie or token on the first request.

---

## Q704.3 — How do you generate a storageState file?

Generate it in a setup test that logs in via the UI and then calls
`context.storageState({ path: '...' })`:

```typescript
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate as user', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.USER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait until login is fully complete — not just the redirect
  await page.waitForURL('/dashboard');
  await expect(page.getByRole('navigation')).toBeVisible();

  // Save the authenticated state
  await page.context().storageState({ path: authFile });
});
```

The wait after `waitForURL` is important. If you call `storageState()`
before the server has set all auth cookies, the saved state is incomplete.
Waiting for a visible element that only appears when auth is fully established
ensures the state is complete.

---

## Q704.4 — How do you use storageState in tests?

Once generated, inject the storageState via `playwright.config.ts` using
the `use` option:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

Every test in the `chromium` project starts with an authenticated context.
The login step is skipped entirely:

```typescript
// tests/profile.spec.ts — no login needed
test('user can update their profile', async ({ page }) => {
  // Goes directly to the protected page — already authenticated
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();
});
```

---

## Q704.5 — How does the setup project dependency pattern work?

The setup project runs before the main test project. The `dependencies`
array ensures the main project does not start until all setup projects pass:

```typescript
projects: [
  {
    name:      'setup',
    testMatch: /.*\.setup\.ts/,
    // No dependencies — runs first
  },
  {
    name:      'chromium',
    use: { storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],  // Waits for 'setup' to complete successfully
  },
]
```

If the setup project fails (login is broken), the main project does not run.
This is correct behaviour — there is no point running 200 tests if auth is
broken.

The setup project is a better approach than `globalSetup`. A setup project:
- Runs in the same test runner process
- Appears in the HTML report as a normal test
- Can be retried with `--retries`
- Supports fixtures (unlike `globalSetup`)

---

## Q704.6 — How do you set up multiple user roles?

Create one setup test per role, each writing to a separate file:

```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';
import path from 'path';

const adminFile  = 'playwright/.auth/admin.json';
const userFile   = 'playwright/.auth/user.json';
const viewerFile = 'playwright/.auth/viewer.json';

setup('authenticate admin',  async ({ page }) => {
  await loginAs(page, process.env.ADMIN_EMAIL!,  process.env.ADMIN_PASS!,  adminFile);
});

setup('authenticate user',   async ({ page }) => {
  await loginAs(page, process.env.USER_EMAIL!,   process.env.USER_PASS!,   userFile);
});

setup('authenticate viewer', async ({ page }) => {
  await loginAs(page, process.env.VIEWER_EMAIL!, process.env.VIEWER_PASS!, viewerFile);
});

async function loginAs(page: Page, email: string, pass: string, file: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(pass);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: file });
}
```

Configure each role as a separate project:

```typescript
projects: [
  { name: 'setup',          testMatch: /.*\.setup\.ts/ },
  { name: 'admin-tests',    use: { storageState: adminFile },  dependencies: ['setup'] },
  { name: 'user-tests',     use: { storageState: userFile },   dependencies: ['setup'] },
  { name: 'viewer-tests',   use: { storageState: viewerFile }, dependencies: ['setup'] },
]
```

Each project's tests run as their respective role without any login code
in the test files.

---

## Q704.7 — How do you override storageState for a specific test?

Some tests verify that a feature is inaccessible to certain roles, or need
to be run without authentication. Override `storageState` per test with
`test.use()`:

```typescript
// Override to use admin auth for this entire file
test.use({ storageState: 'playwright/.auth/admin.json' });

test('admin can access user management', async ({ page }) => {
  await page.goto('/admin/users');
  await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
});
```

```typescript
// Completely unauthenticated test — empty state
test('login page redirects authenticated users', async ({ page }) => {
  // Override with empty state — no cookies, no localStorage
  test.use({ storageState: { cookies: [], origins: [] } });

  await page.goto('/login');
  // When already logged in, /login should redirect to dashboard
  // Using empty state means we are definitely not logged in
});
```

---

## Q704.8 — What is the difference between UI login and API login for setup?

**UI login** — navigate to the login page, fill the form, click submit,
wait for redirect. Exactly what a real user does. Generates a realistic
auth state with all cookies and tokens the server sets.

```typescript
// UI login — slow but guaranteed to match real user session
await page.goto('/login');
await page.getByLabel('Email').fill(email);
await page.getByLabel('Password').fill(password);
await page.getByRole('button', { name: 'Sign In' }).click();
await page.waitForURL('/dashboard');
await page.context().storageState({ path: authFile });
```

**API login** — call the login endpoint directly, then manually set the
returned token or cookie on the browser context. Much faster.

```typescript
// API login — fast, bypasses UI entirely
setup('api login', async ({ request, context }) => {
  const res = await request.post('/api/auth/login', {
    data: { email, password },
  });
  const { token } = await res.json();

  // For JWT in localStorage
  await context.addInitScript(() => {
    localStorage.setItem('auth_token', token);
  });
  await context.storageState({ path: authFile });
});
```

Use UI login when: the application uses complex auth flows (CSRF tokens,
form challenges, captchas) that the API bypasses. Use API login when: the
auth endpoint is accessible and the test environment has no UI-based
protections. API login is typically 5–10× faster.

---

## Q704.9 — How does storageState handle session expiry?

`storageState` saves cookies and tokens at a point in time. If the session
expires before all tests complete, tests start failing with 401 responses.

Mitigation strategies:

**Long-lived test sessions.** Configure the test environment to issue
sessions that last 24 hours or the duration of a full CI run. Never use
production session policies for test accounts.

**Re-generate before each CI run.** The setup project runs at the start
of every CI job. As long as the job completes within the session lifetime,
there is no issue.

**Detect and handle expiry.** Add a `beforeEach` that checks whether the
current session is still valid and re-authenticates if not:

```typescript
test.beforeEach(async ({ page }) => {
  // Quick API ping — if 401, re-run auth
  const res = await page.request.get('/api/user/me');
  if (res.status() === 401) {
    await runAuthSetup(page); // re-authenticate
  }
});
```

The cleanest solution is always the first: test environment sessions should
outlast any test run.

---

## Q704.10 — Why should storageState files be gitignored?

`storageState` files contain live session tokens — the same as having the
user's cookies. Anyone with the file can authenticate as that user without
knowing the password.

```
# .gitignore
playwright/.auth/
```

Add the auth directory to `.gitignore`. In CI, the files are generated
fresh by the setup project at the start of each run. They never need to
be committed.

If `storageState` files are accidentally committed:
1. Revoke all session tokens for the affected accounts immediately
2. Rotate the account passwords
3. Remove the files from git history with `git filter-branch` or BFG
4. Add `.gitignore` entry to prevent recurrence

---

## Q704.11 — What is sessionStorage and why does storageState not capture it?

`localStorage` persists across browser tabs and sessions until explicitly
cleared. `sessionStorage` is tab-scoped and cleared when the tab closes.

`context.storageState()` captures cookies and `localStorage` but not
`sessionStorage`, because session storage is tied to the tab's lifecycle —
when the old page that generated it closes, the session storage is gone.
Saving it to a file and loading it into a new context would not work the
same way.

If your application stores auth state in `sessionStorage`, inject it
manually via a fixture before each test:

```typescript
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/');  // Navigate first — sessionStorage is origin-bound
    await page.evaluate(() => {
      sessionStorage.setItem('session_key', 'abc123');
    });
    await use(page);
  },
});
```

---

## Q704.12 — How do you test that unauthenticated users cannot access protected pages?

```typescript
test.describe('Access control', () => {

  // These tests must NOT use the project's storageState
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects to login when accessing dashboard unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('returns 401 for API calls without auth', async ({ request }) => {
    const response = await request.get('/api/users');
    expect(response.status()).toBe(401);
  });

  test('cannot access admin panel', async ({ page }) => {
    await page.goto('/admin');
    // Should redirect to login, not show 403 message to anonymous users
    await expect(page).toHaveURL(/\/login/);
  });

});
```

The `test.use({ storageState: { cookies: [], origins: [] } })` at the
describe level overrides the project's auth state for all tests in this
block. They run without any session cookies.

---

## Q704.13 — How does storageState compare to the old globalSetup approach?

**Old approach — `globalSetup`:**
```typescript
// playwright.config.ts
globalSetup: './global-setup.ts'

// global-setup.ts
export default async function globalSetup(config) {
  const browser = await chromium.launch();
  const page    = await browser.newPage();
  await page.goto('/login');
  // ... login steps ...
  await page.context().storageState({ path: './auth.json' });
  await browser.close();
}
```

**Modern approach — setup project with `dependencies`:**
```typescript
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  { name: 'chromium', dependencies: ['setup'], use: { storageState: authFile } },
]
```

**Why the setup project approach is better:**
- The setup test appears in the HTML report — you can see if it passed or failed
- It supports `--retries` if the setup test is flaky
- It uses fixtures (the old `globalSetup` runs outside the fixture system)
- It can be debugged with `--headed` and the trace viewer
- Multiple setup steps can be parallelised

---

## Q704.14 — How do you inject an API-obtained JWT into the browser for testing?

When the application stores the JWT in `localStorage` rather than a cookie:

```typescript
setup('authenticate via API', async ({ request, page }) => {
  // Get the token via API
  const res = await request.post('/api/auth/login', {
    data: { email: process.env.USER_EMAIL!, password: process.env.USER_PASS! },
  });
  expect(res.ok()).toBe(true);
  const { accessToken } = await res.json();

  // Navigate to the app domain — localStorage is origin-bound
  await page.goto('/');

  // Set the token in localStorage
  await page.evaluate(token => {
    localStorage.setItem('accessToken', token);
  }, accessToken);

  // Save the state (localStorage is now included)
  await page.context().storageState({ path: authFile });
});
```

The `page.evaluate()` call runs JavaScript in the browser context. You
must navigate to the correct origin first — localStorage is domain-scoped.
Setting `localStorage.setItem` on `example.com` while on `about:blank`
does nothing.

---

## Q704.15 — Write a complete auth setup for a two-role application.

```typescript
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const ADMIN_FILE = path.join(__dirname, '../playwright/.auth/admin.json');
const USER_FILE  = path.join(__dirname, '../playwright/.auth/user.json');

async function loginAs(
  page: typeof setup.prototype['page'],
  email: string,
  password: string,
  outputFile: string
) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for full auth completion
  await page.waitForURL('/dashboard');
  await expect(page.getByTestId('user-menu')).toBeVisible();

  // Save
  await page.context().storageState({ path: outputFile });
}

setup('admin auth', async ({ page }) => {
  await loginAs(page, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASS!, ADMIN_FILE);
});

setup('user auth', async ({ page }) => {
  await loginAs(page, process.env.USER_EMAIL!, process.env.USER_PASS!, USER_FILE);
});
```

```typescript
// playwright.config.ts (projects section)
projects: [
  { name: 'setup',         testMatch: /.*\.setup\.ts/ },
  { name: 'admin-chrome',  use: { storageState: ADMIN_FILE },  dependencies: ['setup'] },
  { name: 'user-chrome',   use: { storageState: USER_FILE },   dependencies: ['setup'] },
]
```

---

## Q704.16 — How do you handle authentication in a test that needs both roles?

When a single test needs to verify two roles (for example: admin creates a
task, user sees it), use a custom fixture that provides a second context:

```typescript
// fixtures/index.ts
export const test = base.extend<{
  adminPage: Page;
  userPage:  Page;
}>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  userPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/user.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

// Test using both roles
test('admin creates task, user sees it', async ({ adminPage, userPage }) => {
  await adminPage.goto('/tasks/new');
  await adminPage.getByLabel('Title').fill('Review document');
  await adminPage.getByRole('button', { name: 'Create' }).click();

  await userPage.goto('/tasks');
  await expect(userPage.getByText('Review document')).toBeVisible();
});
```

---

## Q704.17 — What should you do if the auth setup test is flaky?

Auth setup flakiness is high-impact because it fails the entire suite.
Steps to diagnose and fix:

**Add retries to the setup project.** The setup project can use `retries`:
```typescript
{ name: 'setup', testMatch: /.*\.setup\.ts/, retries: 2 }
```

**Wait more explicitly.** The most common cause is calling
`context.storageState()` before the server has set all auth cookies.
Add explicit element visibility waits after login:
```typescript
await page.waitForURL('/dashboard');
await expect(page.getByTestId('nav-bar')).toBeVisible();  // fully loaded
await page.context().storageState({ path: authFile });
```

**Use API login.** If the login form itself is unreliable (slow to render,
CAPTCHA, third-party auth service), switch to API login. No UI means no
UI-related flakiness.

**Separate auth from test-data setup.** If the setup test also creates
test data, an API failure during data creation can make the whole setup
appear as "auth broken." Split them into separate setup steps.

---

## Q704.18 — In your OrangeHRM project, how was authentication handled?

In our OrangeHRM framework, authentication was implemented at Level 3 using
`storageState` and the setup project pattern.

The setup step (`global-setup.ts`) logs in as Admin and as an ESS user via
the UI, waiting for the dashboard navigation to confirm each login is complete.
It writes `playwright/.auth/admin.json` and `playwright/.auth/ess.json`.
Both files are gitignored.

Three Playwright projects use these files:
- The Admin project uses `admin.json` for all PIM and Admin module tests
- The ESS project uses `ess.json` for Leave module tests where an employee
  must be the actor
- A shared utilities project uses no storageState for purely setup/API calls

The key improvement from adding `storageState` at Level 3: the suite went
from 15+ seconds of login overhead per test to zero. For a 40-test suite,
this saved approximately 10 minutes per run.

The gotcha we hit: the first version of the setup called `storageState()` 
immediately after `waitForURL('/dashboard')`. On slow CI machines, the session
cookie was not yet fully committed and some tests started with partial auth.
Adding `await expect(page.getByTestId('main-menu')).toBeVisible()` before
saving the state fixed it completely.

---

## Chapter Summary

- `storageState` saves cookies and `localStorage` to a JSON file; injecting it into a browser context instantly authenticates it — no login UI needed.
- `storageState` does NOT capture `sessionStorage` — inject it manually via `page.evaluate()` in a fixture if required.
- Use the setup project + `dependencies` pattern instead of `globalSetup` — it shows in the report, supports retries, and works with fixtures.
- Every test project loads the auth file via `use: { storageState: 'path/to/auth.json' }`.
- Multi-role testing: one setup test per role, one auth file per role, one project per role.
- Override `storageState` per test or per describe block with `test.use({ storageState: ... })`.
- For unauthenticated tests use `test.use({ storageState: { cookies: [], origins: [] } })` to reset the project default.
- UI login vs API login: use UI login for complex auth flows; use API login for speed (5–10× faster) in environments where the auth endpoint is directly accessible.
- Always `gitignore` auth files — they contain live session tokens.
- Auth flakiness is most often caused by calling `storageState()` before all cookies are set — add an element visibility assertion after login before saving.
