---
# Part 03: Fixtures and Dependency Injection
> 📂 Playwright Test Framework Notes — Part 03 of 11

## 4. Fixtures and Dependency Injection

### 4.1 What is a Fixture?

A **fixture** is a piece of setup that a test needs — provided automatically when the test declares it wants it.

Think of fixtures like a kitchen in a restaurant. The kitchen (fixture system) prepares ingredients (page, browser, logged-in state) before the chef (test) starts cooking. The chef just says "I need vegetables" — they don't worry about how they were grown, washed, or cut.

```typescript
// The test "declares" what it needs in its parameters
test("my test", async ({ page, request }) => {
  //                      ↑     ↑
  //    Playwright sees these and automatically provides them
  //    It creates a page and a request context, injects them, and cleans up after
});
```

**Why fixtures are better than beforeEach:**
- Fixtures are **lazy** — only created when a test actually needs them
- Fixtures can **depend on other fixtures** (composition)
- Fixtures are **scoped** — test-level or worker-level
- Fixtures produce **cleaner test code** — setup logic is hidden away
- Fixtures can be **reused across files** easily

---

### 4.2 Built-in Fixtures

Playwright provides several fixtures out of the box:

```typescript
test("exploring built-in fixtures", async ({
  page,          // A fresh browser Page for this test
  browser,       // The Browser instance (Chromium, Firefox, or WebKit)
  context,       // The BrowserContext — the "session" containing pages
  request,       // An APIRequestContext for making HTTP requests
  browserName,   // String: "chromium", "firefox", or "webkit"
  isMobile,      // Boolean: true if testing a mobile viewport
  isTablet,      // Boolean: true if testing a tablet viewport
  headless,      // Boolean: true if running in headless mode
}) => {

  console.log("Browser:", browserName);    // "chromium"
  console.log("Is Mobile?", isMobile);     // false (unless configured)
  console.log("Is Headless?", headless);   // true (in CI)

  // page — the most commonly used fixture
  await page.goto("https://example.com");

  // context — use when you need multiple pages in one session
  const page2 = await context.newPage();
  await page2.goto("https://example.com/page2");

  // browser — use when you need a completely separate session
  const newContext = await browser.newContext({ locale: "fr-FR" });
  const frenchPage = await newContext.newPage();
  await frenchPage.goto("https://example.com");
  await newContext.close();

  // request — for API calls without a browser
  const response = await request.get("https://api.example.com/users");
  const users = await response.json();
});
```

**When to use each fixture:**

| Fixture    | Use when you need...                                             |
|------------|------------------------------------------------------------------|
| `page`     | A browser page to interact with — the most common fixture       |
| `context`  | Multiple pages in the same session, or custom browser settings  |
| `browser`  | Completely separate browser sessions (e.g., two different users)|
| `request`  | HTTP API calls without a browser UI                             |

---

### 4.3 Creating Custom Fixtures

Custom fixtures let you encapsulate any reusable setup logic — like logging in, creating test data, or providing page objects.

```typescript
// fixtures/auth.fixture.ts

import { test as base, Page } from "@playwright/test";

// Define the shape of your custom fixtures
type AuthFixtures = {
  loggedInPage: Page;           // A page that's already logged in
  adminPage: Page;              // A page logged in as an admin
  authToken: string;            // A JWT token for the current session
};

// Extend the base test with your custom fixtures
export const test = base.extend<AuthFixtures>({

  // ── loggedInPage fixture ───────────────────────────────────────────────
  // Any test that requests "loggedInPage" gets a page already logged in
  loggedInPage: async ({ page }, use) => {
    // SETUP: Log in before the test
    await page.goto("/login");
    await page.fill("#email", process.env.TEST_USER_EMAIL!);
    await page.fill("#password", process.env.TEST_USER_PASSWORD!);
    await page.click("#submit");
    await page.waitForURL("**/dashboard");

    // HAND OFF to the test — "use" is where the test runs
    await use(page);

    // TEARDOWN: Runs after the test, regardless of pass/fail
    await page.goto("/logout");
  },

  // ── adminPage fixture ──────────────────────────────────────────────────
  adminPage: async ({ page }, use) => {
    await page.goto("/login");
    await page.fill("#email", process.env.ADMIN_EMAIL!);
    await page.fill("#password", process.env.ADMIN_PASSWORD!);
    await page.click("#submit");
    await page.waitForURL("**/admin");
    await use(page);
    await page.goto("/logout");
  },

  // ── authToken fixture ──────────────────────────────────────────────────
  // Get a token via API (no browser needed)
  authToken: async ({ request }, use) => {
    const response = await request.post("/api/auth/login", {
      data: {
        email: process.env.TEST_USER_EMAIL,
        password: process.env.TEST_USER_PASSWORD
      }
    });
    const { token } = await response.json();
    await use(token);
    // No teardown needed for a token
  },
});

export { expect } from "@playwright/test";
```

```typescript
// tests/dashboard.test.ts — using the custom fixture
import { test, expect } from "../fixtures/auth.fixture";
//       ↑ Import from YOUR fixture file, not @playwright/test

test("dashboard shows user name", async ({ loggedInPage }) => {
  // loggedInPage is already logged in — no login steps needed here!
  await expect(loggedInPage.locator(".user-name")).toBeVisible();
});

test("admin can see all users", async ({ adminPage }) => {
  // adminPage is logged in as admin
  await adminPage.goto("/admin/users");
  await expect(adminPage.locator(".user-table")).toBeVisible();
});

test("API call with auth token", async ({ request, authToken }) => {
  const response = await request.get("/api/profile", {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  expect(response.status()).toBe(200);
});
```

---

### 4.4 Fixture Scope — test vs worker

Fixtures can have two scopes that control how often they're created:

```typescript
export const test = base.extend<{}, WorkerFixtures>({

  // ── test scope (default) ───────────────────────────────────────────────
  // Created fresh for EVERY test. Use for anything that must be isolated.
  loggedInPage: [
    async ({ page }, use) => {
      await loginUser(page);
      await use(page);
      await logoutUser(page);
    },
    { scope: "test" }  // This is the default — you can omit this
  ],

  // ── worker scope ───────────────────────────────────────────────────────
  // Created ONCE per worker process, shared across all tests in that worker.
  // Use for expensive setup that's safe to share (read-only test data, DB connection).
  testDatabase: [
    async ({}, use) => {
      console.log("Setting up database connection...");
      const db = await Database.connect(process.env.TEST_DB_URL!);
      await db.seed();           // Load test data once

      await use(db);             // All tests in this worker share this db

      await db.cleanup();        // Clean up once when the worker finishes
      await db.disconnect();
      console.log("Database connection closed.");
    },
    { scope: "worker" }  // Created once per worker, not per test
  ],
});
```

**Choosing scope:**

| Scope    | Created          | Destroyed         | Use for                                      |
|----------|------------------|-------------------|----------------------------------------------|
| `test`   | Before each test | After each test   | Page objects, login sessions, isolated state |
| `worker` | Once per worker  | When worker ends  | DB connections, API clients, read-only data  |

---

### 4.5 Composing Fixtures

Fixtures can depend on other fixtures — both built-in and custom.

```typescript
// fixtures/index.ts

import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { CartPage } from "../pages/CartPage";

type PageObjectFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  cartPage: CartPage;
  loggedInDashboard: DashboardPage; // Depends on loginPage
};

export const test = base.extend<PageObjectFixtures>({

  // Simple page object fixtures — depend on the built-in "page"
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  // Composed fixture — depends on loginPage fixture!
  loggedInDashboard: async ({ loginPage, dashboardPage }, use) => {
    // Use the loginPage fixture to perform login
    await loginPage.navigate();
    await loginPage.login("user@test.com", "password");
    // Then provide the dashboardPage, which is now showing post-login
    await use(dashboardPage);
  },
});

export { expect } from "@playwright/test";
```

```typescript
// tests/checkout.test.ts
import { test, expect } from "../fixtures";

test("logged-in user can access cart", async ({ loggedInDashboard, cartPage }) => {
  // loggedInDashboard means login already happened
  await loggedInDashboard.navigateTo("Cart");
  await expect(cartPage.emptyMessage).toBeVisible();
});
```

---

### 4.6 Fixtures vs beforeEach — When to Use Which

```typescript
// ── Use beforeEach when: ───────────────────────────────────────────────────
// - Setup is specific to one test file's tests
// - Setup is simple and doesn't need to be reused elsewhere
test.describe("Product Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products/laptop-pro");
    await page.waitForLoadState("networkidle");
  });

  test("price is displayed", async ({ page }) => { /* ... */ });
  test("add to cart button works", async ({ page }) => { /* ... */ });
});

// ── Use fixtures when: ─────────────────────────────────────────────────────
// - Setup is needed across MULTIPLE test files
// - Setup involves complex logic (logging in, creating data, page objects)
// - You want the test body to be clean and declarative

// In ANY test file — just import and use:
test("dashboard access", async ({ loggedInPage }) => { /* ... */ });
test("admin settings", async ({ adminPage }) => { /* ... */ });
```

---

### 4.7 Common Fixture Mistakes

#### Mistake 1: Forgetting the `use` call
```typescript
// ❌ WRONG — never calling use() means the test never runs
myFixture: async ({ page }, use) => {
  await setupSomething(page);
  // Forgot: await use(page);  ← Test hangs forever waiting for this
},

// ✅ CORRECT
myFixture: async ({ page }, use) => {
  await setupSomething(page);
  await use(page);       // ← Must be called so the test can run
  await teardown(page);  // Teardown runs after use()
},
```

#### Mistake 2: Importing test from @playwright/test instead of your fixture file
```typescript
// ❌ WRONG — using the base test doesn't include your custom fixtures
import { test } from "@playwright/test";

test("my test", async ({ loggedInPage }) => { // ← "loggedInPage" doesn't exist here!
  // This will throw: "loggedInPage" fixture is not defined
});

// ✅ CORRECT — import from your custom fixture file
import { test } from "../fixtures";

test("my test", async ({ loggedInPage }) => { // ← Now it works
```

---


---
← **Previous:** Part 02 — Assertions `playwright-02-assertions.md`
→ **Next:** Part 04 — Configuration `playwright-04-configuration.md`
