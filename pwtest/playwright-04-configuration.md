---
# Part 04: Configuration — playwright.config.ts
> 📂 Playwright Test Framework Notes — Part 04 of 11

## 5. Configuration — playwright.config.ts

### 5.1 Why Configuration Matters

The config file is the **brain of your test suite**. Without proper configuration:
- Tests run on only one browser instead of all three
- Timeouts are wrong for your application's speed
- Tests don't retry on CI, causing false failures
- Screenshots and traces aren't collected when tests fail
- Your team has to type long `npx playwright test` commands with many flags

A well-configured project lets you just run `npx playwright test` and everything works correctly for your specific application.

---

### 5.2 Top-Level Settings

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({

  // ── Where to find test files ─────────────────────────────────────────────
  testDir: "./tests",

  // Pattern to match test files (default includes .spec.ts and .test.ts)
  testMatch: "**/*.{test,spec}.ts",

  // Pattern to EXCLUDE from test discovery
  testIgnore: "**/node_modules/**",

  // ── Timing ───────────────────────────────────────────────────────────────
  // Maximum time a single test can take (ms) — test.setTimeout() overrides this per test
  timeout: 30_000,           // 30 seconds per test

  // Maximum time expect() assertions will retry before failing
  expect: {
    timeout: 5_000           // 5 seconds per assertion (default)
  },

  // ── Reliability ──────────────────────────────────────────────────────────
  // How many times to retry a failing test before marking it as failed
  retries: process.env.CI ? 2 : 0,
  // On CI: retry up to 2 times (catches flaky tests)
  // Locally: don't retry (see failures immediately for faster feedback)

  // ── Performance ──────────────────────────────────────────────────────────
  // Number of parallel worker processes
  workers: process.env.CI ? 1 : "50%",
  // On CI: 1 worker (avoid resource contention on shared runners)
  // Locally: use 50% of CPU cores

  // ── Output ───────────────────────────────────────────────────────────────
  // Where to put test artifacts (screenshots, videos, traces)
  outputDir: "test-results/",

  // Which reporters to use
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"]  // Shows results line by line in terminal
  ],

  // ── Test isolation ────────────────────────────────────────────────────────
  // Prevent tests from accidentally sharing state via global variables
  fullyParallel: true, // Each test runs in its own worker when possible
});
```

---

### 5.3 The use Object — Browser Defaults

The `use` object sets default options applied to ALL tests unless overridden:

```typescript
export default defineConfig({
  use: {

    // ── Navigation ──────────────────────────────────────────────────────────
    // Base URL — write page.goto("/login") instead of full URLs
    baseURL: process.env.BASE_URL || "https://staging.example.com",

    // ── Timeouts ────────────────────────────────────────────────────────────
    // Max time for each action: click, fill, press, etc.
    actionTimeout: 10_000,      // 10 seconds

    // Max time for page navigation (goto, waitForURL, etc.)
    navigationTimeout: 30_000,  // 30 seconds

    // ── Browser Settings ────────────────────────────────────────────────────
    // Run without a visible browser window (required for CI)
    headless: true,

    // Browser viewport size
    viewport: { width: 1280, height: 720 },

    // Emulate a specific locale and timezone
    locale: "en-US",
    timezoneId: "America/New_York",

    // Ignore HTTPS certificate errors (useful for local dev with self-signed certs)
    ignoreHTTPSErrors: false,

    // ── Evidence Collection on Failure ──────────────────────────────────────
    // Screenshot options: "off" | "on" | "only-on-failure" | "on-first-failure"
    screenshot: "only-on-failure",

    // Video options: "off" | "on" | "retain-on-failure" | "on-first-retry"
    video: "retain-on-failure",

    // Trace options: "off" | "on" | "retain-on-failure" | "on-first-retry"
    // Traces include screenshots, DOM snapshots, network, console — very detailed
    trace: "on-first-retry",

    // ── Authentication ───────────────────────────────────────────────────────
    // Reuse saved auth state (logged-in cookies) across tests
    storageState: "playwright/.auth/user.json",
    // Only include this if you've saved auth state — see section on auth reuse

    // ── HTTP Credentials ─────────────────────────────────────────────────────
    // For sites protected by HTTP Basic Auth
    httpCredentials: {
      username: "admin",
      password: process.env.BASIC_AUTH_PASSWORD!
    },

    // ── Extra HTTP Headers ───────────────────────────────────────────────────
    // Sent with every request (useful for bypassing feature flags in test env)
    extraHTTPHeaders: {
      "X-Test-Run": "playwright",
      "X-Environment": "staging"
    },
  }
});
```

---

### 5.4 Projects — Multiple Browsers and Environments

Projects let you run the same tests across multiple browsers, viewports, or environments.

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  projects: [

    // ── Setup project — runs first to create auth state ──────────────────
    {
      name: "setup",
      testMatch: "**/auth.setup.ts",  // Only this specific file runs
    },

    // ── Desktop browsers ─────────────────────────────────────────────────
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],  // Spreads Chrome's default settings
        // Override anything you want for this browser:
        // viewport: { width: 1920, height: 1080 }
      },
      dependencies: ["setup"], // Runs after setup project
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["setup"],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      dependencies: ["setup"],
    },

    // ── Mobile devices ────────────────────────────────────────────────────
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },   // Android phone viewport + touch events
      dependencies: ["setup"],
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] }, // iOS viewport + touch events
      dependencies: ["setup"],
    },
    {
      name: "tablet",
      use: { ...devices["iPad Pro 11"] },
      dependencies: ["setup"],
    },

    // ── API tests — no browser needed ─────────────────────────────────────
    {
      name: "api",
      testDir: "./tests/api",            // Only runs files in tests/api/
      use: { baseURL: "https://api.example.com" },
    },

    // ── Accessibility tests ───────────────────────────────────────────────
    {
      name: "accessibility",
      use: { ...devices["Desktop Chrome"] },
      testMatch: "**/*.a11y.test.ts",    // Only .a11y.test.ts files
    },
  ]
});
```

**Running specific projects:**
```bash
# Run only chromium tests
npx playwright test --project=chromium

# Run only mobile tests
npx playwright test --project=mobile-chrome --project=mobile-safari

# Run all tests on all browsers
npx playwright test
```

---

### 5.5 Environment Variables in Config

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

// Load .env file for local development
// (dotenv is not installed by default — install with: npm install -D dotenv)
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
  },

  projects: [
    {
      name: "staging",
      use: {
        baseURL: process.env.STAGING_URL || "https://staging.example.com",
      }
    },
    {
      name: "production",
      use: {
        baseURL: process.env.PROD_URL || "https://example.com",
      }
    }
  ]
});
```

```bash
# .env.test (for local development — DO NOT commit this file)
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=TestPass123
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPass456

# Running with a specific environment
BASE_URL=https://staging.example.com npx playwright test
```

---

### 5.6 Full Production-Ready Config Example

```typescript
// playwright.config.ts — a complete real-world configuration
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : "50%",
  fullyParallel: true,
  outputDir: "test-results/",
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["json", { outputFile: "results.json" }]]
    : [["html", { open: "on-failure" }], ["list"]],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
    headless: !!process.env.CI,
  },

  projects: [
    { name: "setup", testMatch: "**/global.setup.ts" },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["setup"],
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 14"] },
      dependencies: ["setup"],
    },
  ],
});
```

---


---
← **Previous:** Part 03 — Fixtures `playwright-03-fixtures.md`
→ **Next:** Part 05 — Page Object Model `playwright-05-page-object-model.md`
