# Chapter 705 — Authentication — Advanced

This chapter covers advanced authentication patterns: OAuth2 and SSO flows,
MFA handling, token refresh, multi-tenant testing, and concurrent role
scenarios. Interviewers ask these questions for senior SDET roles where the
candidate is expected to own the auth strategy for a whole team. Questions
focus on architectural decisions — when to bypass OAuth in tests, how to
handle flows that Playwright cannot automate directly, and how to keep a
large multi-role suite stable over time.

---

## Q705.1 — What makes OAuth2 and SSO flows difficult to automate?

OAuth2 and SSO flows involve third-party identity providers — Google, Okta,
Auth0, Azure AD. Three specific difficulties:

**Third-party pages.** The login page belongs to the identity provider, not
your application. Google's login page has CAPTCHAs and bot detection that
actively blocks automation. Okta and Auth0 have rate limits on automated
login attempts.

**Anti-automation protections.** Identity providers detect headless browsers
from User-Agent strings, fingerprinting, and behaviour patterns. Tests that
automate the real OAuth provider are fragile and may be blocked.

**Terms of service.** Google's ToS explicitly prohibits automating Google
account login for testing purposes. Automating against production identity
providers risks account lockout.

The correct strategy for most tests: bypass the OAuth flow entirely and test
what your application does after authentication succeeds. Reserve a single
test (or none at all) for the actual OAuth redirect.

---

## Q705.2 — What are the four strategies for testing OAuth-protected applications?

**Strategy 1 — Backend test endpoint (recommended).** Add a `POST /api/test/auth/session`
endpoint to the application that is only enabled in test environments. It
accepts a user identifier and returns a valid session directly, bypassing
the OAuth provider:

```typescript
setup('authenticate via test endpoint', async ({ request, context }) => {
  const res = await request.post('/api/test/auth/session', {
    data:    { userId: 'test-admin-001', role: 'admin' },
    headers: { 'X-Test-Secret': process.env.TEST_AUTH_SECRET! },
  });
  expect(res.ok()).toBeTruthy();

  // Set the returned cookies on the browser context
  const cookies = (await res.json()).cookies;
  await context.addCookies(cookies);
  await context.storageState({ path: 'playwright/.auth/admin.json' });
});
```

**Strategy 2 — Mock the OAuth callback.** Intercept the OAuth redirect and
simulate the callback your backend would receive from the identity provider:

```typescript
await page.route('**/auth/google/callback*', route =>
  route.fulfill({
    status:  302,
    headers: { 'Location': '/dashboard?session=test_session_token' },
  })
);
```

**Strategy 3 — Fake OAuth server.** Deploy a fake OAuth2 server (Keycloak,
`node-oauth2-server`) in the test environment. The application's
`OAUTH_PROVIDER_URL` env var points to the fake server. It accepts any
credentials and returns valid tokens.

**Strategy 4 — Real OAuth, one test only.** Store real test account
credentials in CI secrets. Automate the full OAuth flow once in `auth.setup.ts`
and reuse the `storageState`. Never automate OAuth in individual tests.

---

## Q705.3 — How do you handle Google OAuth login in Playwright?

If you must automate real Google OAuth (Strategy 4 — rarely needed), the
approach is:

```typescript
setup('google oauth', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign in with Google' }).click();

  // Google's login page — handle in a new page/popup
  const googlePage = await page.waitForEvent('popup');

  await googlePage.getByLabel('Email').fill(process.env.GOOGLE_TEST_EMAIL!);
  await googlePage.getByRole('button', { name: 'Next' }).click();
  await googlePage.getByLabel('Password').fill(process.env.GOOGLE_TEST_PASS!);
  await googlePage.getByRole('button', { name: 'Next' }).click();

  // Wait for redirect back to your app
  await page.waitForURL('**/dashboard');
  await page.context().storageState({ path: 'playwright/.auth/google-user.json' });
});
```

Important caveats:
- Use a dedicated test Google account, never a personal or production account
- Google may add 2FA prompts or phone verification — these break automation
- This test may fail periodically due to bot detection; build in retries
- The saved `storageState` typically lasts 1–2 hours before the token expires

For 99% of tests, use Strategy 1 or Strategy 2 instead.

---

## Q705.4 — How do you handle Multi-Factor Authentication (MFA) in tests?

MFA is designed to resist automation. Three approaches:

**Bypass MFA for test accounts.** In most enterprise identity providers
(Okta, Auth0, Azure AD), you can configure specific test accounts or groups
to have MFA disabled in the test environment. This is the cleanest solution
— the application and auth flow are tested, but the MFA step is skipped.

**Use TOTP seeds for automated MFA.** Time-based One-Time Password (TOTP)
can be automated if you have the seed (the secret that generates the codes).
Store the seed in CI secrets and generate the code in the test:

```typescript
import * as OTPAuth from 'otpauth';

setup('authenticate with MFA', async ({ page }) => {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(process.env.MFA_SEED!),
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.USER_PASS!);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // MFA step
  const code = totp.generate(); // generates current 6-digit code
  await page.getByLabel('Authentication code').fill(code);
  await page.getByRole('button', { name: 'Verify' }).click();

  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: 'playwright/.auth/mfa-user.json' });
});
```

**Mock the MFA step.** If MFA is validated by your own backend (not a
third-party provider), intercept the MFA endpoint and return a success response:

```typescript
await page.route('**/api/auth/mfa/verify', route =>
  route.fulfill({ status: 200, body: JSON.stringify({ verified: true }) })
);
```

---

## Q705.5 — How do you test token refresh behaviour?

Token refresh tests verify that the application correctly requests a new
access token when the current one expires, without requiring the user to
log in again:

```typescript
test('expired access token triggers silent refresh', async ({ page }) => {

  // Start with a valid session
  await page.goto('/dashboard');
  await expect(page.getByTestId('main-content')).toBeVisible();

  // Simulate token expiry by intercepting the next API call
  // and returning 401 once, then allowing subsequent calls through
  let tokenRefreshed = false;

  await page.route('**/api/**', async route => {
    if (!tokenRefreshed && route.request().url().includes('/api/data')) {
      // First call — simulate expired token
      tokenRefreshed = true;
      await route.fulfill({ status: 401, body: '{"error":"token_expired"}' });
    } else {
      await route.continue();
    }
  });

  // Trigger an action that requires an API call
  await page.getByRole('button', { name: 'Refresh Data' }).click();

  // The app should silently refresh and retry — user sees no error
  await expect(page.getByTestId('main-content')).toBeVisible();
  await expect(page.getByRole('alert')).not.toBeVisible();
});
```

Also test the refresh endpoint directly via API:

```typescript
test('refresh token returns new access token', async ({ request }) => {
  // Get initial tokens
  const loginRes = await request.post('/api/auth/login', {
    data: { email: process.env.USER_EMAIL!, password: process.env.USER_PASS! },
  });
  const { accessToken, refreshToken } = await loginRes.json();

  // Use the refresh token to get a new access token
  const refreshRes = await request.post('/api/auth/refresh', {
    data: { refreshToken },
  });
  expect(refreshRes.status()).toBe(200);

  const { accessToken: newToken } = await refreshRes.json();
  expect(newToken).toBeDefined();
  expect(newToken).not.toBe(accessToken); // Should be a new token
});
```

---

## Q705.6 — How do you test that an expired refresh token forces re-login?

When the refresh token itself expires, the application should redirect the
user to the login page rather than silently failing:

```typescript
test('expired refresh token redirects to login', async ({ page }) => {

  await page.goto('/dashboard');

  // Simulate both access token and refresh token being expired
  await page.route('**/api/auth/refresh', route =>
    route.fulfill({
      status: 401,
      body:   JSON.stringify({ error: 'refresh_token_expired' }),
    })
  );

  await page.route('**/api/data', route =>
    route.fulfill({
      status: 401,
      body:   JSON.stringify({ error: 'access_token_expired' }),
    })
  );

  // Trigger an API call — both token refresh and the retry should fail
  await page.getByRole('button', { name: 'Load Data' }).click();

  // App should redirect to login
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('Your session has expired')).toBeVisible();
});
```

---

## Q705.7 — How do you test multi-tenant applications where users belong to different organisations?

Multi-tenant applications have auth state that includes both the user identity
and the tenant context. Each tenant gets its own auth file:

```typescript
// tests/auth.setup.ts
const tenants = [
  { name: 'acme',    email: process.env.ACME_EMAIL!,    pass: process.env.ACME_PASS!    },
  { name: 'globex',  email: process.env.GLOBEX_EMAIL!,  pass: process.env.GLOBEX_PASS!  },
  { name: 'initech', email: process.env.INITECH_EMAIL!, pass: process.env.INITECH_PASS! },
];

for (const tenant of tenants) {
  setup(`authenticate ${tenant.name}`, async ({ page }) => {
    await page.goto(`/login?tenant=${tenant.name}`);
    await page.getByLabel('Email').fill(tenant.email);
    await page.getByLabel('Password').fill(tenant.pass);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/dashboard');
    await page.context().storageState({
      path: `playwright/.auth/${tenant.name}.json`,
    });
  });
}
```

Tests that verify tenant isolation run as two different tenants in the same
test using a dual-context fixture (as shown in Ch57):

```typescript
test('acme data is not visible to globex', async ({ browser }) => {
  const acmeCtx  = await browser.newContext({ storageState: 'playwright/.auth/acme.json' });
  const globexCtx = await browser.newContext({ storageState: 'playwright/.auth/globex.json' });

  const acmePage  = await acmeCtx.newPage();
  const globexPage = await globexCtx.newPage();

  await acmePage.goto('/customers');
  const acmeCustomer = await acmePage.getByRole('row').first().textContent();

  await globexPage.goto('/customers');
  await expect(globexPage.getByText(acmeCustomer!)).not.toBeVisible();

  await acmeCtx.close();
  await globexCtx.close();
});
```

---

## Q705.8 — How do you test role-based access control (RBAC)?

RBAC tests verify that users can access what they should and cannot access
what they should not. Organise by role + resource:

```typescript
// tests/rbac/admin.spec.ts
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Admin RBAC', () => {
  test('can access user management', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  });

  test('can delete any record', async ({ request }) => {
    const res = await request.delete('/api/records/any-id');
    expect(res.status()).not.toBe(403);
  });
});

// tests/rbac/viewer.spec.ts
test.use({ storageState: 'playwright/.auth/viewer.json' });

test.describe('Viewer RBAC', () => {
  test('cannot access user management', async ({ page }) => {
    await page.goto('/admin/users');
    // Should redirect or show access denied — not show the page
    await expect(page).not.toHaveURL('/admin/users');
  });

  test('receives 403 on delete attempt', async ({ request }) => {
    const res = await request.delete('/api/records/any-id');
    expect(res.status()).toBe(403);
  });

  test('can view records', async ({ page }) => {
    await page.goto('/records');
    await expect(page.getByRole('table')).toBeVisible();
  });
});
```

Both the UI-level access and the API-level access should be tested. A UI
that hides the delete button but whose API accepts delete requests from
viewers is a security vulnerability.

---

## Q705.9 — How do you test concurrent sessions across multiple roles?

Use separate browser contexts — each context is an independent session:

```typescript
test('admin changes propagate to user view', async ({ browser }) => {
  // Admin context
  const adminCtx = await browser.newContext({
    storageState: 'playwright/.auth/admin.json',
  });
  const adminPage = await adminCtx.newPage();

  // User context
  const userCtx = await browser.newContext({
    storageState: 'playwright/.auth/user.json',
  });
  const userPage = await userCtx.newPage();

  // Admin makes a change
  await adminPage.goto('/products');
  await adminPage.getByRole('button', { name: 'Add Product' }).click();
  await adminPage.getByLabel('Name').fill('New Widget');
  await adminPage.getByRole('button', { name: 'Save' }).click();
  await expect(adminPage.getByText('New Widget')).toBeVisible();

  // User should see the new product
  await userPage.goto('/products');
  await expect(userPage.getByText('New Widget')).toBeVisible();

  await adminCtx.close();
  await userCtx.close();
});
```

---

## Q705.10 — What is the difference between cookies, localStorage, and sessionStorage for auth?

| Storage | Scope | Persists | Captured by storageState |
|---------|-------|----------|--------------------------|
| Cookies | Domain + path | Until expiry or manual clear | ✅ Yes |
| localStorage | Origin | Until manual clear | ✅ Yes |
| sessionStorage | Tab | Until tab closes | ❌ No |

**Cookies** are the traditional auth mechanism. Set by the server via
`Set-Cookie`. Sent automatically on every request to the domain. Can be
`HttpOnly` (no JS access) and `Secure` (HTTPS only). `storageState` captures
all cookies.

**localStorage** is used by SPAs that store JWT tokens client-side. Not sent
automatically — JavaScript reads it and adds it to request headers.
`storageState` captures all `localStorage` values.

**sessionStorage** is tab-scoped. Cleared when the tab closes. `storageState`
cannot capture it — inject it manually via `page.evaluate()` before each test.

---

## Q705.11 — How do you test that security headers are set on auth responses?

Security headers on auth responses (Set-Cookie, Content-Security-Policy,
HSTS) are a security requirement:

```typescript
test('login sets secure cookie attributes', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    data: { email: 'user@test.com', password: 'pass123' },
  });

  expect(response.ok()).toBe(true);
  const setCookie = response.headers()['set-cookie'];
  expect(setCookie).toBeDefined();

  // Security attributes
  expect(setCookie).toContain('HttpOnly');     // JS cannot read the cookie
  expect(setCookie).toContain('Secure');       // HTTPS only
  expect(setCookie).toMatch(/SameSite=Lax|SameSite=Strict/); // CSRF protection

  // No long-lived session without explicit "remember me"
  expect(setCookie).not.toContain('Max-Age=');
});

test('auth endpoints include security headers', async ({ request }) => {
  const response = await request.get('/api/user/me', {
    headers: { 'Authorization': `Bearer ${validToken}` },
  });

  const headers = response.headers();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBeDefined();
});
```

---

## Q705.12 — How do you test logout?

Logout tests verify two things: the UI reflects the logged-out state, and
the session is actually invalidated server-side:

```typescript
test('logout clears session and redirects', async ({ page, request }) => {

  // Start authenticated
  await page.goto('/dashboard');
  await expect(page.getByTestId('user-menu')).toBeVisible();

  // Get session token before logout (for API check)
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'session_id');

  // Logout
  await page.getByTestId('user-menu').click();
  await page.getByRole('menuitem', { name: 'Sign Out' }).click();

  // UI should redirect to login
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByTestId('user-menu')).not.toBeVisible();

  // Session cookie should be cleared in browser
  const postLogoutCookies = await page.context().cookies();
  expect(postLogoutCookies.find(c => c.name === 'session_id')).toBeUndefined();

  // API should reject the old session token
  const apiResponse = await request.get('/api/user/me', {
    headers: { 'Cookie': `session_id=${sessionCookie?.value}` },
  });
  expect(apiResponse.status()).toBe(401);
});
```

The API-level check is critical — a logout that only clears the browser
cookie but keeps the server-side session alive is a security vulnerability.

---

## Q705.13 — How do you handle "Remember Me" functionality in tests?

```typescript
test.describe('Remember Me', () => {

  test('without remember me — session cookie has no Max-Age', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: 'user@test.com', password: 'pass', rememberMe: false },
    });
    const setCookie = response.headers()['set-cookie'];
    // Session cookie — no Max-Age or Expires means browser-session scope
    expect(setCookie).not.toMatch(/Max-Age|Expires/);
  });

  test('with remember me — cookie has long Max-Age', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: 'user@test.com', password: 'pass', rememberMe: true },
    });
    const setCookie = response.headers()['set-cookie'];
    // Persistent cookie — should last days or weeks
    expect(setCookie).toMatch(/Max-Age=\d+/);
    const maxAge = parseInt(setCookie.match(/Max-Age=(\d+)/)![1]);
    expect(maxAge).toBeGreaterThan(86400); // At least 1 day
  });

});
```

---

## Q705.14 — How do you test CSRF protection on state-changing endpoints?

CSRF (Cross-Site Request Forgery) protection requires state-changing requests
to include a valid CSRF token. Tests verify the protection is active:

```typescript
test('state change without CSRF token is rejected', async ({ request }) => {
  // First, authenticate
  const loginRes = await request.post('/api/auth/login', {
    data: { email: 'user@test.com', password: 'pass123' },
  });
  expect(loginRes.ok()).toBe(true);

  // Attempt a state-changing request WITHOUT the CSRF token
  const response = await request.post('/api/users/profile', {
    data: { name: 'Hacker' },
    // Deliberately omitting the X-CSRF-Token header
  });

  // Should be rejected
  expect(response.status()).toBe(403);
});

test('state change with valid CSRF token succeeds', async ({ page, request }) => {
  await page.goto('/profile');

  // Get the CSRF token from the page (meta tag or cookie)
  const csrfToken = await page.evaluate(
    () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  );

  const response = await request.post('/api/users/profile', {
    data:    { name: 'Valid Update' },
    headers: { 'X-CSRF-Token': csrfToken! },
  });

  expect(response.ok()).toBe(true);
});
```

---

## Q705.15 — How do you test auth state when tests run in parallel?

Parallel tests share a worker but each gets an independent browser context.
Auth files are read-only during the test run — they are written once by the
setup project and then only read.

Problems arise when tests modify the auth state:

```typescript
// ❌ Problem — test modifies the shared auth state
test('change password', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('New password').fill('newpass456');
  await page.getByRole('button', { name: 'Save' }).click();
  // This invalidates the storageState for all parallel workers!
});
```

Solutions:

**Use separate test accounts for destructive tests.** Any test that changes
passwords, revokes tokens, or alters auth state should use a dedicated
account that is not shared with the suite.

**Run destructive auth tests serially.** Add `test.describe.configure({ mode: 'serial' })` to tests that modify auth state.

**Reset via API in `afterEach`.** If a test must modify auth state, restore
it via API before the test ends.

---

## Q705.16 — Write a complete setup for an application with OAuth2 bypass using a test endpoint.

```typescript
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const roles = ['admin', 'manager', 'viewer'] as const;
type Role = typeof roles[number];

const authFile = (role: Role) =>
  path.join(__dirname, `../playwright/.auth/${role}.json`);

for (const role of roles) {
  setup(`authenticate ${role}`, async ({ request, context }) => {
    // Use backend test endpoint to bypass OAuth
    const res = await request.post('/api/test/auth/create-session', {
      data: {
        role,
        email: process.env[`${role.toUpperCase()}_EMAIL`],
      },
      headers: {
        'X-Test-Secret': process.env.TEST_AUTH_SECRET!,
      },
    });

    expect(res.status()).toBe(200);
    const { cookies } = await res.json();

    // Set session cookies on the browser context
    await context.addCookies(cookies.map((c: any) => ({
      name:   c.name,
      value:  c.value,
      domain: new URL(process.env.BASE_URL!).hostname,
      path:   '/',
    })));

    // Verify the session is valid before saving
    const verifyPage = await context.newPage();
    await verifyPage.goto('/dashboard');
    await expect(verifyPage.getByTestId('user-menu')).toBeVisible();
    await verifyPage.close();

    // Save the auth state
    await context.storageState({ path: authFile(role) });
  });
}
```

---

## Q705.17 — How do you detect and handle session expiry mid-suite?

When a long-running suite outlasts the session lifetime, tests start failing
with redirects to the login page rather than actual feature failures. Detect
this pattern and handle it:

```typescript
// fixtures/index.ts — add a session guard to the page fixture
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    // Before each test, verify the session is still valid
    const res = await page.request.get('/api/auth/verify');
    if (res.status() === 401) {
      // Re-run auth setup for this worker
      await refreshAuth(page);
    }
    await use(page);
  },
});

async function refreshAuth(page: Page) {
  // Re-authenticate via the fastest available method
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.USER_PASS!);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('/dashboard');
}
```

The better solution is to ensure test-environment sessions last longer than
any CI run. A 24-hour session TTL handles even overnight test runs.

---

## Q705.18 — In your project, how did you handle authentication for a multi-role OrangeHRM suite?

In our OrangeHRM framework, authentication was implemented as part of Level 3
(Fixtures and Shared State) and extended through Levels 4–8.

We have two roles: Admin and ESS (Employee Self-Service). The setup project
(`tests/auth.setup.ts`) runs two `setup()` calls — one per role. Each call
performs a full UI login, waits for the dashboard navigation to confirm the
session is fully established, and writes to `playwright/.auth/admin.json`
and `playwright/.auth/ess.json`.

The Admin role is used for all PIM, Admin, and configuration tests. The ESS
role is used for Leave module tests where an employee must apply for leave
themselves — admin cannot submit leave on behalf of an employee in OrangeHRM.

For the multi-role isolation challenge: the Leave module tests need to verify
that a leave request submitted by an ESS user is visible in the Admin view.
We handle this with a dual-context fixture: the ESS context submits the
request, then the Admin context navigates to the leave management page and
verifies it appears. Both contexts run within the same test without logging
in or out.

The main lesson from implementing this: the order of operations in the setup
test matters. We initially saved `storageState` immediately after `waitForURL`.
On slow CI machines, this saved incomplete state. Moving the save call to
after asserting a navigation element (`await expect(nav).toBeVisible()`)
made the auth setup reliable across all CI environments.

---

## Chapter Summary

- OAuth2 and SSO flows should be bypassed in most tests using a backend test endpoint, mocked OAuth callback, or fake OAuth server — not automated against real identity providers.
- MFA can be handled by disabling it for test accounts in the identity provider config, automating TOTP using a seed, or mocking the MFA verification endpoint.
- Token refresh tests use `page.route()` to simulate a 401 on the first API call, then verify the app silently retries after refreshing the token.
- Multi-tenant tests use one auth file per tenant; tenant isolation tests use two separate browser contexts (one per tenant) in a single test.
- RBAC tests must cover both UI access (does the page load?) and API access (does the endpoint return 403?) — UI-only RBAC testing misses backend security gaps.
- Security header tests run against the API using the `request` fixture: verify `HttpOnly`, `Secure`, `SameSite` on session cookies.
- Logout tests must verify both browser-side cookie clearing and server-side session invalidation.
- Destructive auth tests (password changes, token revocation) must use dedicated accounts or be isolated from the shared auth state used by the suite.
- Session expiry mid-suite is prevented by configuring test-environment session TTL to exceed the longest CI run (typically 24 hours).
- The most common advanced auth pattern: two browser contexts in one test, each loaded with a different role's `storageState`, verifying cross-role interactions.
