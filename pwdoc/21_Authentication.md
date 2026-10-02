# Chapter 21: Authentication & Storage State (Complete Guide)

## The Concept of Authentication & State

Testing protected areas of an application traditionally requires logging in at the start of every test. This adds significant overhead and increases the risk of "Auth-related flakiness." Playwright's **Storage State** approach allows you to login once and reuse the authentication tokens across your entire suite.

**Purpose**: This chapter demonstrates how to capture cookies and local storage to "hydrate" browser contexts, allowing tests to skip the login UI and start directly on protected pages.

**Why is it required?**
1. **Performance**: To save minutes of execution time by avoiding the overhead of the login UI for every single test.
2. **Stability**: To reduce the point-of-failure; if the login page is temporarily down, you only have one failing setup step instead of a completely Red dashboard.
3. **Complexity**: To easily test different user roles (Admin, Editor, Viewer) by swapping pre-authenticated session files.

## The Authentication Conundrum

In traditional Selenium frameworks, every test starts with:
1. Open Browser
2. Navigate to Login
3. Type Username
4. Type Password
5. Click Submit
6. Wait for Dashboard

**Why this fails:**
- **Time Sink**: If you have 500 tests, and login takes 5s, that's **40 minutes** of just logging in.
- **Flakiness**: If the Auth Provider (Auth0/Okta) blips, *every single test* fails.

**Playwright's Answer**: Login **once** (global setup), save the browser state (Cookies + LocalStorage), and inject it into every test.

---

## Fundamentals of Storage State

A `storageState` is essentially a JSON file that acts as a "passport".

**Structure of `auth.json`:**
```json
{
  "cookies": [
    { "name": "session_id", "value": "xyz...", "domain": "example.com" }
  ],
  "origins": [
    {
      "origin": "https://example.com",
      "localStorage": [{ "name": "token", "value": "abc..." }]
    }
  ]
}
```

Playwright can generate this file using `page.context().storageState({ path: 'auth.json' })`.

---

## Strategy 1: Project Dependencies (Recommended)

This is the modern, robust way to handle setup. You define a "Setup Project" that runs *before* your testing project.

### Step 1: Create the Setup Test
`tests/auth.setup.ts`

```typescript
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('https://login.example.com');
  await page.fill('#username', process.env.USER_NAME!);
  await page.fill('#password', process.env.USER_PASS!);
  await page.click('button[type="submit"]');
  
  // Vital: Wait for login to complete fully!
  await page.waitForURL('https://example.com/dashboard');
  
  // Save state
  await page.context().storageState({ path: authFile });
});
```

### Step 2: Configure Dependencies
`playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    // 1. The Setup Project
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // 2. The Main Project (depends on setup)
    {
      name: 'chromium',
      use: {
        // Hydrate context with saved state
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'], // Wait for 'setup' to pass
    },
  ],
});
```

---

## Strategy 2: API Login Injection

Logging in via UI is slow. Logging in via API is instant.

If your app uses Cookies-only auth:

```typescript
// auth.setup.ts
setup('api login', async ({ request, context }) => {
  // Post credentials
  const res = await request.post('/api/login', {
    data: { user: 'admin', pass: '123' }
  });
  
  // Need to manually set cookies if the API doesn't set them on the browser context directly
  // (Usually request context handles cookies, but we need to save them for *Browser* context)
  
  // TRICK: BrowserContext.storageState() captures cookies from the request context 
  // IF they share the same storage stack. 
  // Better approach:
  
  await context.addCookies([
    { name: 'session', value: 'token_from_api', domain: 'example.com', path: '/' }
  ]);
  
  await context.storageState({ path: 'auth.json' });
});
```

If your app uses **Local Storage** (JWTs):

```typescript
setup('inject jwt', async ({ page }) => {
  // 1. Get Token via API
  const token = await getTokenFromAPI(); // Custom helper
  
  // 2. Go to domain (Local Storage is domain-bound)
  await page.goto('https://example.com');
  
  // 3. Inject
  await page.evaluate(t => localStorage.setItem('jwt', t), token);
  
  // 4. Save
  await page.context().storageState({ path: 'auth.json' });
});
```

---

## Handling Multiple Roles

Sometimes you need to test `Admin` vs `User` vs `Guest`.

```typescript
// playwright.config.ts
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  { 
    name: 'chromium', 
    use: { storageState: 'auth/user.json' }, 
    dependencies: ['setup'] 
  }
]
```

**Override in specific test file:**

If a specific spec file needs `Admin` permissions, override the `use` config block.

```typescript
import { test } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('admin dashboard', async ({ page }) => {
  await page.goto('/admin');
  // ...
});
```

---

## Advanced Session Storage Handling

Session Storage is tricky because it clears when the tab closes. `storageState` *does not* capture Session Storage.

**Solution: A "Hydration" Fixture**

If your app relies on Session Storage, create a custom fixture that injects it *before each test*.

```typescript
// fixtures.ts
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/'); // Navigate first
    await page.evaluate(() => {
      sessionStorage.setItem('key', 'value');
    });
    await use(page);
  }
});
```

---

## Best Practices

| Rule | Reason |
|------|--------|
| **Gitignore Auth Files** | Never commit `auth.json`. It contains live session tokens! |
| **Use Project Dependencies** | It's much cleaner than the old `globalSetup` script approach. |
| **Wait for State** | In setup, ensure the cookie is *actually set* before saving. `waitForURL` usually ensures this. |
| **Token Expiry** | If your tokens last 15 mins but tests run for 30 mins, tests will fail. Configure test-environment tokens to last 24h. |
| **Guest Tests** | For tests requiring *no* login (`test.use({ storageState: { cookies: [], origins: [] } })`), explicit empty state resets overrides. |

**Summary**: You've learned how to eliminate login overhead using Storage State, managing both cookies and local storage for multiple roles. The next chapter covers how to capture visual evidence—screenshots and videos—for every test run.
