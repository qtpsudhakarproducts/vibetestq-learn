---
# Part 01: What is Playwright Test Framework & Test Structure
> 📂 Playwright Test Framework Notes — Part 01 of 11

## 1. What is the Playwright Test Framework?

When people say "Playwright," they often mean two different things:

| Thing | What it is | Example |
|---|---|---|
| **Playwright Library** | The browser automation engine — controls browsers, clicks, fills, navigates | `page.click()`, `page.goto()` |
| **Playwright Test Framework** | The test runner built on top — organizes, runs, and reports tests | `test()`, `expect()`, `fixtures` |

These notes are entirely about the **test framework** — the scaffolding that turns browser commands into organized, reportable, maintainable tests.

Think of it this way:
```
Playwright Library  =  The tools in your toolbox (hammer, screwdriver)
Playwright Test     =  The workshop that organizes how you use those tools
                       (workbench, blueprint, quality control)
```

You install both with:
```bash
npm init playwright@latest
# or
npm install -D @playwright/test
npx playwright install  # installs browser binaries
```

---

## 2. Test Structure

### 2.1 The test() Function

The `test()` function is the most basic building block. It defines a single test case.

```typescript
// The simplest possible test
import { test, expect } from "@playwright/test";

test("page title is correct", async ({ page }) => {
  await page.goto("https://example.com");
  await expect(page).toHaveTitle(/Example Domain/);
});
```

**Anatomy of a test:**
```typescript
test(
  "descriptive name of what is being tested", // ← Name: what does this test verify?
  async ({ page }) => {                        // ← Test function: always async
    // Test steps go here                      // ← Body: the actual actions & assertions
  }
);
```

**Naming conventions — write names as sentences describing behavior:**
```typescript
// ✅ Good names — describe the behavior being tested
test("login button is disabled when email is empty");
test("user is redirected to dashboard after successful login");
test("error message appears when password is incorrect");
test("cart count increments when item is added");

// ❌ Bad names — vague, doesn't say what's being verified
test("test login");
test("check page");
test("button test");
test("test1");
```

**The test info object — access test metadata:**
```typescript
test("test with metadata access", async ({ page }, testInfo) => {
  console.log("Test name:", testInfo.title);        // "test with metadata access"
  console.log("Test file:", testInfo.file);         // "/tests/example.test.ts"
  console.log("Retry number:", testInfo.retry);     // 0 (first run), 1 (first retry)
  console.log("Project name:", testInfo.project.name); // "chromium"

  // Attach extra files to the test report
  await testInfo.attach("screenshot", {
    body: await page.screenshot(),
    contentType: "image/png"
  });
});
```

---

### 2.2 test.describe() — Grouping Tests

`test.describe()` groups related tests together under a shared name. It helps organize tests logically and allows shared hooks to apply to only that group.

```typescript
import { test, expect } from "@playwright/test";

// Without describe — flat structure (fine for small files)
test("login works");
test("logout works");
test("signup works");

// With describe — organized structure (better for larger files)
test.describe("Authentication", () => {

  test("user can log in with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "user@test.com");
    await page.fill("#password", "password123");
    await page.click("#login-button");
    await expect(page).toHaveURL("/dashboard");
  });

  test("user can log out", async ({ page }) => {
    // ... logout test
  });

  test("user can sign up", async ({ page }) => {
    // ... signup test
  });
});

test.describe("Product Catalog", () => {

  test("products are displayed on the home page", async ({ page }) => {
    // ... product test
  });

  test("search filters products correctly", async ({ page }) => {
    // ... search test
  });
});
```

**Benefits of describe:**
- Groups tests in reports — easier to read results
- Scopes `beforeEach`/`afterEach` hooks to just that group
- Lets you run one group at a time: `npx playwright test --grep "Authentication"`

---

### 2.3 Hooks — beforeEach, afterEach, beforeAll, afterAll

Hooks are functions that run automatically at specific times — before or after tests. They eliminate repetitive setup code.

```typescript
import { test, expect } from "@playwright/test";

test.describe("Shopping Cart", () => {

  // ── beforeAll ────────────────────────────────────────────────────────────
  // Runs ONCE before the first test in this describe block
  // Best for: expensive setup done once (seeding DB, creating test accounts)
  test.beforeAll(async ({ request }) => {
    // Create a test product in the database via API
    await request.post("/api/test/products", {
      data: { name: "Test Laptop", price: 999, stock: 10 }
    });
    console.log("✓ Test product created");
  });

  // ── beforeEach ───────────────────────────────────────────────────────────
  // Runs before EVERY test in this describe block
  // Best for: resetting state each test needs (navigate to page, login)
  test.beforeEach(async ({ page }) => {
    // Every cart test starts on the products page, logged in
    await page.goto("/login");
    await page.fill("#email", "testuser@example.com");
    await page.fill("#password", "password");
    await page.click("#submit");
    await page.waitForURL("**/dashboard");
    await page.goto("/products");
    console.log("✓ Logged in and on products page");
  });

  // ── afterEach ────────────────────────────────────────────────────────────
  // Runs after EVERY test in this describe block
  // Best for: cleanup after each test (empty cart, reset form, logout)
  test.afterEach(async ({ page }, testInfo) => {
    // If this test failed, take a screenshot for debugging
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach("failure-screenshot", {
        body: screenshot,
        contentType: "image/png"
      });
    }
    // Empty the cart so the next test starts clean
    await page.goto("/cart");
    await page.click("#clear-cart").catch(() => {
      // Button might not exist if cart is already empty — that's fine
    });
  });

  // ── afterAll ─────────────────────────────────────────────────────────────
  // Runs ONCE after the last test in this describe block
  // Best for: expensive teardown (delete test data, close connections)
  test.afterAll(async ({ request }) => {
    // Remove the test product from the database
    await request.delete("/api/test/products/test-laptop");
    console.log("✓ Test product cleaned up");
  });

  // ── Tests ─────────────────────────────────────────────────────────────────
  test("can add a product to the cart", async ({ page }) => {
    // beforeEach already ran — we're on /products, logged in
    await page.locator(".product-card").first().click();
    await page.click("#add-to-cart");
    await expect(page.locator(".cart-badge")).toHaveText("1");
    // afterEach will run — cart will be emptied
  });

  test("cart total updates correctly", async ({ page }) => {
    // beforeEach ran again — fresh logged-in session, on /products
    await page.locator(".product-card").first().click();
    await page.click("#add-to-cart");
    await page.goto("/cart");
    await expect(page.locator(".cart-total")).toBeVisible();
  });
});
```

**Execution order visualized:**
```
beforeAll ─────────────────────────────────────────────────────────┐
                                                                   │
  beforeEach → TEST 1 "can add a product" → afterEach             │
  beforeEach → TEST 2 "cart total updates" → afterEach            │
  beforeEach → TEST 3 "..." → afterEach                           │
                                                                   │
afterAll ──────────────────────────────────────────────────────────┘
```

---

### 2.4 Nested describe Blocks

You can nest `describe` blocks to create a hierarchy that mirrors your application's structure.

```typescript
test.describe("User Account", () => {

  test.describe("Profile Settings", () => {

    test.beforeEach(async ({ page }) => {
      await page.goto("/account/profile");
    });

    test("can update display name", async ({ page }) => { /* ... */ });
    test("can update email", async ({ page }) => { /* ... */ });
    test("can upload avatar", async ({ page }) => { /* ... */ });
  });

  test.describe("Security Settings", () => {

    test.beforeEach(async ({ page }) => {
      await page.goto("/account/security");
    });

    test("can change password", async ({ page }) => { /* ... */ });
    test("can enable two-factor auth", async ({ page }) => { /* ... */ });

    test.describe("Active Sessions", () => {
      test("can view active sessions", async ({ page }) => { /* ... */ });
      test("can revoke a session", async ({ page }) => { /* ... */ });
    });
  });
});
```

**How nested hooks work:**
- Outer `beforeEach` runs BEFORE inner `beforeEach`
- Inner `afterEach` runs BEFORE outer `afterEach`

```
Outer beforeEach
  Inner beforeEach
    TEST runs
  Inner afterEach
Outer afterEach
```

---

### 2.5 test.only() and test.skip()

These modifiers let you focus on or skip specific tests during development.

```typescript
// ── test.only() — Run ONLY this test (or these tests) ─────────────────────
// Use when: debugging a specific failing test and don't want others running
test.only("this is the only test that will run", async ({ page }) => {
  await page.goto("https://example.com");
  // Other tests in this file are skipped
});

// Multiple only's — all of them run, everything else is skipped
test.only("first focused test", async ({ page }) => { /* ... */ });
test.only("second focused test", async ({ page }) => { /* ... */ });

// ── test.skip() — Skip this test ──────────────────────────────────────────
// Use when: test is known broken, feature not built yet, environment issue
test.skip("payment with PayPal - not implemented yet", async ({ page }) => {
  // This test body is never executed — the test is reported as "skipped"
});

// Conditional skip — skip based on runtime condition
test("feature only available on Chrome", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "This feature only works in Chrome");
  // Only runs when browser is chromium
  await page.goto("/chrome-only-feature");
  await expect(page.locator("#feature")).toBeVisible();
});

// Skip inside describe — skips ALL tests in the group
test.describe("Premium features", () => {
  test.skip(); // Skips ALL tests in this describe block

  test("premium feature 1", async ({ page }) => { /* all skipped */ });
  test("premium feature 2", async ({ page }) => { /* all skipped */ });
});
```

> ⚠️ **Warning:** Never commit `test.only()` to your repository — it would cause CI to only run that one test. Many teams use a linting rule to prevent this.

---

### 2.6 test.fixme() and test.fail()

```typescript
// ── test.fixme() — Mark a test as needing a fix ───────────────────────────
// Behaves like skip, but communicates intent: "this is broken and needs fixing"
// The test is skipped but marked differently in reports
test.fixme("checkout page crashes on Safari", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.locator("#checkout-form")).toBeVisible();
  // This is skipped with a note that it needs attention
});

// Conditional fixme
test("payment integration", async ({ page }) => {
  test.fixme(process.env.CI === "true", "Payment tests fail on CI due to sandbox issue");
  await page.goto("/payment");
});

// ── test.fail() — Assert that a test IS expected to fail ──────────────────
// Use when: you've found a bug and want to document it in the test suite
// The test is marked as "expected failure" — it PASSES when it fails!
// (If the bug gets fixed and the test starts passing, it's reported as unexpected)
test.fail("known bug: submit button disabled incorrectly #BUG-123", async ({ page }) => {
  await page.goto("/contact");
  await page.fill("#message", "Hello");
  // This assertion currently fails due to the bug — but we expect it to fail
  await expect(page.locator("#submit")).toBeEnabled();
});
```

---

### 2.7 Tagging Tests

Tags let you categorize and selectively run tests without changing file structure.

```typescript
// Add tags using the test options object (third argument)
test("login flow", { tag: "@smoke" }, async ({ page }) => {
  await page.goto("/login");
  // ...
});

test("checkout flow", { tag: ["@smoke", "@critical"] }, async ({ page }) => {
  // This test has TWO tags
});

test("accessibility audit", { tag: "@a11y" }, async ({ page }) => {
  // ...
});

test("full regression scenario", { tag: "@regression" }, async ({ page }) => {
  // ...
});
```

**Running tests by tag from the command line:**
```bash
# Run only smoke tests
npx playwright test --grep "@smoke"

# Run smoke AND critical tests
npx playwright test --grep "@smoke|@critical"

# Exclude a tag — run everything EXCEPT regression
npx playwright test --grep-invert "@regression"
```

---

### 2.8 Parameterized Tests

Run the same test logic with multiple sets of data using a loop.

```typescript
// ── Simple parameterization with a loop ───────────────────────────────────
const loginScenarios = [
  { email: "",            password: "pass",  expectedError: "Email is required"    },
  { email: "notanemail",  password: "pass",  expectedError: "Email is invalid"     },
  { email: "a@b.com",    password: "",      expectedError: "Password is required"  },
  { email: "a@b.com",    password: "short", expectedError: "Password too short"    },
];

for (const scenario of loginScenarios) {
  test(`login validation: "${scenario.expectedError}"`, async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", scenario.email);
    await page.fill("#password", scenario.password);
    await page.click("#submit");
    await expect(page.locator(".error")).toHaveText(scenario.expectedError);
  });
}
// This generates 4 individual tests, one per scenario
// Each has its own name and can fail/pass independently

// ── Testing across multiple browsers with describe ─────────────────────────
const browsers = ["chromium", "firefox", "webkit"];
for (const browser of browsers) {
  test.describe(`on ${browser}`, () => {
    // browser-specific tests here
  });
}
```

---

### 2.9 Project Structure and File Organization

A well-organized project makes tests easy to find, maintain, and run selectively.

```
my-project/
│
├── playwright.config.ts          ← Central configuration for everything
│
├── tests/                        ← All test files
│   ├── auth/
│   │   ├── login.test.ts
│   │   ├── logout.test.ts
│   │   └── signup.test.ts
│   ├── checkout/
│   │   ├── cart.test.ts
│   │   ├── payment.test.ts
│   │   └── confirmation.test.ts
│   ├── products/
│   │   ├── listing.test.ts
│   │   └── search.test.ts
│   └── api/                      ← API-only tests
│       ├── users.api.test.ts
│       └── orders.api.test.ts
│
├── pages/                        ← Page Object Model files
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── CheckoutPage.ts
│
├── fixtures/                     ← Custom fixture definitions
│   ├── auth.fixture.ts
│   └── index.ts                  ← Re-exports all fixtures
│
├── utils/                        ← Shared helpers
│   ├── apiClient.ts
│   ├── testData.ts
│   └── helpers.ts
│
├── test-data/                    ← Static test data files
│   ├── users.json
│   └── products.json
│
└── playwright-report/            ← Generated by Playwright (don't commit)
    └── index.html
```

**File naming conventions:**
```
tests/login.test.ts       ← Standard test file
tests/login.spec.ts       ← Also valid — .spec.ts is equally common
tests/login.api.test.ts   ← Indicates an API test
pages/LoginPage.ts        ← Page object (PascalCase)
fixtures/auth.fixture.ts  ← Fixture file
```

---

### 2.10 Common Mistakes in Test Structure

#### Mistake 1: Tests that depend on other tests
```typescript
// ❌ WRONG — test 2 depends on state left by test 1
test("add item to cart", async ({ page }) => {
  await page.goto("/products");
  await page.click(".add-to-cart");
  // Cart now has 1 item
});

test("checkout cart", async ({ page }) => {
  // Assumes cart has an item from the previous test — FRAGILE!
  // If "add item" test fails or runs in a different order, this breaks
  await page.goto("/cart");
  await page.click("#checkout");
});

// ✅ CORRECT — each test sets up its own state
test("checkout cart", async ({ page }) => {
  // Set up the required state WITHIN this test
  await addItemToCart(page); // helper function
  await page.goto("/cart");
  await page.click("#checkout");
});
```

#### Mistake 2: Putting heavy setup in beforeEach when beforeAll is better
```typescript
// ❌ INEFFICIENT — creates a new test user before EVERY test (10 tests = 10 API calls)
test.beforeEach(async ({ request }) => {
  await request.post("/api/seed/users"); // Slow, repeated unnecessarily
});

// ✅ BETTER — create the user ONCE before all tests
test.beforeAll(async ({ request }) => {
  await request.post("/api/seed/users"); // Runs once, 10x faster
});

test.afterAll(async ({ request }) => {
  await request.delete("/api/seed/users"); // Clean up once
});
```

#### Mistake 3: Forgetting to clean up in afterEach/afterAll
```typescript
// ❌ BAD — test data piles up, polluting other tests
test.beforeEach(async ({ request }) => {
  await request.post("/api/users", { data: testUser });
  // Never cleaned up!
});

// ✅ GOOD — always clean up what you create
let createdUserId: string;

test.beforeEach(async ({ request }) => {
  const res = await request.post("/api/users", { data: testUser });
  createdUserId = (await res.json()).id;
});

test.afterEach(async ({ request }) => {
  await request.delete(`/api/users/${createdUserId}`);
});
```

---


---
→ **Next:** Part 02 — Assertions `playwright-02-assertions.md`
