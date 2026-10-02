# Chapter 12: Configuration & Projects (Complete Guide)



## The Concept of Configuration

As your test suite grows, you need a centralized way to manage how tests are executed across different environments, browsers, and devices. This is the role of the **Configuration File**.

**Purpose**: This chapter explains how to use `playwright.config.ts` to control every aspect of your test execution—from timeouts and retries to project-level overrides.

**Why is it required?**
1. **Cross-Browser Verification**: To easily run the same tests on Chrome, Firefox, and Safari without changing the code.
2. **Environment Management**: To switch between Local, Staging, and Production URLs using a single flag.
3. **Optimized Execution**: To configure parallelism (workers) and retries to balance speed and reliability.

### What is playwright.config.ts?

The configuration file is the **control center** for your test suite. It defines:
- Which browsers to test
- How tests run (parallel, retries)
- Where to find tests
- Timeouts and waits
- Reporters and output
- Global settings

### Configuration Hierarchy

```
playwright.config.ts (Global)
├── Test-level settings (test.use())
├── Project-level settings
└── Default values
```

**Priority (highest to lowest):**
1. Test-level: `test.use({ ... })`
2. Project-level: `projects: [{ use: { ... } }]`
3. Global use: `use: { ... }`
4. Defaults

---

## Configuration File Structure

### Complete Example

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // ==========================================
  // TEST RUNNER OPTIONS (Top-level)
  // ==========================================
  
  // Test directory
  testDir: './tests',
  
  // Test file pattern
  testMatch: '**/*.spec.ts',
  
  // Files to ignore
  testIgnore: '**/node_modules/**',
  
  // Parallel execution
  fullyParallel: true,
  
  // Fail build if test.only is used
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 0,
  
  // Number of parallel workers
  workers: process.env.CI ? 1 : undefined,
  
  // Test timeout
  timeout: 30_000,
  
  // Reporter
  reporter: [
    ['html'],
    ['json', { outputFile: 'results.json' }]
  ],
  
  // Output directory
  outputDir: 'test-results',
  
  // Global setup/teardown
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
  
  // ==========================================
  // EXPECT OPTIONS
  // ==========================================
  
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
  
  // ==========================================
  // USE OPTIONS (Shared settings)
  // ==========================================
  
  use: {
    // Base URL
    baseURL: 'http://localhost:3000',
    
    // Browser options
    headless: true,
    viewport: { width: 1280, height: 720 },
    
    // Capture options
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    
    // Timeouts
    actionTimeout: 0,
    navigationTimeout: 30_000,
    
    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    // Permissions
    permissions: ['geolocation'],
    
    // Geolocation
    geolocation: { longitude: -122.4194, latitude: 37.7749 },
    
    // Color scheme
    colorScheme: 'light',
  },
  
  // ==========================================
  // PROJECTS (Multi-browser testing)
  // ==========================================
  
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
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  
  // ==========================================
  // WEB SERVER (Auto-start dev server)
  // ==========================================
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

---

## Basic Configuration Options

### Test Runner Options

**testDir**
```typescript
testDir: './tests', // Where test files are located
testDir: './e2e', // Alternative location
```

**testMatch / testIgnore**
```typescript
// Match specific patterns
testMatch: '**/*.spec.ts',
testMatch: ['**/login/*.spec.ts', '**/signup/*.spec.ts'],

// Ignore patterns
testIgnore: '**/node_modules/**',
testIgnore: ['**/temp/**', '**/*.skip.ts'],
```

**fullyParallel**
```typescript
// Run all tests in parallel (even within same file)
fullyParallel: true, // Faster

// Run tests in same file sequentially
fullyParallel: false, // Default
```

**Comparison:**
| Setting | Behavior | Speed | Use Case |
|---------|----------|-------|----------|
| `fullyParallel: true` | All tests parallel | ⚡ Fastest | Independent tests |
| `fullyParallel: false` | File-level parallel | 🏃 Medium | Tests with shared state |

**workers**
```typescript
// Auto-detect (50% of CPU cores)
workers: undefined,

// Specific number
workers: 4,

// Percentage of CPU cores
workers: '75%',

// Sequential (no parallelism)
workers: 1,

// CI vs local
workers: process.env.CI ? 1 : undefined,
```

**retries**
```typescript
// No retries
retries: 0,

// Retry twice on failure
retries: 2,

// CI vs local
retries: process.env.CI ? 2 : 0,
```

**forbidOnly**
```typescript
// Fail if test.only is used (prevents accidental commits)
forbidOnly: !!process.env.CI,
```

**timeout**
```typescript
// Test timeout (default: 30 seconds)
timeout: 30_000,

// Longer timeout
timeout: 60_000,

// Per environment
timeout: process.env.CI ? 60_000 : 30_000,
```

---

## Test Discovery and Filtering

### Test File Patterns

```typescript
export default defineConfig({
  // Match all .spec.ts files
  testMatch: '**/*.spec.ts',
  
  // Match multiple patterns
  testMatch: [
    '**/*.test.ts',
    '**/*.spec.ts',
  ],
  
  // Ignore specific files
  testIgnore: [
    '**/node_modules/**',
    '**/build/**',
    '**/*.skip.ts',
  ],
});
```

### Directory Structure

```
project/
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts      ✅ Found
│   │   └── signup.spec.ts     ✅ Found
│   ├── dashboard/
│   │   └── widgets.spec.ts    ✅ Found
│   └── utils/
│       └── helpers.ts          ❌ Not a test
├── e2e/
│   └── smoke.spec.ts           ❌ Not in testDir
└── playwright.config.ts
```

---

## Projects for Multi-Browser Testing

### What are Projects?

Projects allow you to run the same tests in different configurations:
- Different browsers
- Different devices
- Different user states
- Different environments

### Basic Multi-Browser Setup

```typescript
export default defineConfig({
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

**Result:**
```
Running 30 tests using 3 workers
  10 passed (chromium)
  10 passed (firefox)
  10 passed (webkit)
```

### Running Specific Projects

```bash
# Run all projects
npx playwright test

# Run specific project
npx playwright test --project=chromium

# Run multiple projects
npx playwright test --project=chromium --project=firefox
```

### Project Dependencies

```typescript
export default defineConfig({
  projects: [
    // Setup project
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // Tests depend on setup
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
```

### Project-Specific Configuration

```typescript
export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Project-specific settings
        viewport: { width: 1920, height: 1080 },
        screenshot: 'on',
      },
      // Project-specific timeout
      timeout: 60_000,
      // Project-specific retries
      retries: 3,
    },
  ],
});
```

---

## Device Emulation

### Available Devices

Playwright includes presets for popular devices:

```typescript
import { devices } from '@playwright/test';

// Desktop
devices['Desktop Chrome']
devices['Desktop Firefox']
devices['Desktop Safari']
devices['Desktop Edge']

// Mobile - iPhone
devices['iPhone 13']
devices['iPhone 13 Pro']
devices['iPhone 13 Pro Max']
devices['iPhone 13 Mini']
devices['iPhone 12']
devices['iPhone 11']

// Mobile - Android
devices['Pixel 5']
devices['Pixel 4']
devices['Galaxy S9+']
devices['Galaxy S8']

// Tablets
devices['iPad Pro']
devices['iPad Mini']
devices['iPad (gen 7)']
```

### Using Device Presets

```typescript
export default defineConfig({
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],
});
```

### Custom Device Configuration

```typescript
export default defineConfig({
  projects: [
    {
      name: 'Custom Mobile',
      use: {
        // Viewport
        viewport: { width: 375, height: 667 },
        
        // User agent
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        
        // Device scale factor
        deviceScaleFactor: 2,
        
        // Touch support
        hasTouch: true,
        
        // Mobile flag
        isMobile: true,
      },
    },
  ],
});
```

---

## Use Options

### Complete Use Options Reference

```typescript
use: {
  // ==========================================
  // NAVIGATION
  // ==========================================
  
  baseURL: 'http://localhost:3000',
  
  // ==========================================
  // BROWSER OPTIONS
  // ==========================================
  
  headless: true,
  channel: 'chrome', // 'chrome', 'msedge', 'chrome-beta'
  
  // ==========================================
  // VIEWPORT
  // ==========================================
  
  viewport: { width: 1280, height: 720 },
  // OR
  viewport: null, // No viewport (uses browser default)
  
  // ==========================================
  // DEVICE
  // ==========================================
  
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
  
  // ==========================================
  // LOCALE & TIMEZONE
  // ==========================================
  
  locale: 'en-US',
  timezoneId: 'America/New_York',
  
  // ==========================================
  // PERMISSIONS
  // ==========================================
  
  permissions: ['geolocation', 'notifications'],
  geolocation: { longitude: -122.4194, latitude: 37.7749 },
  
  // ==========================================
  // COLOR SCHEME
  // ==========================================
  
  colorScheme: 'light', // 'light', 'dark', 'no-preference'
  
  // ==========================================
  // CAPTURE
  // ==========================================
  
  screenshot: 'off', // 'off', 'on', 'only-on-failure'
  video: 'off', // 'off', 'on', 'retain-on-failure', 'on-first-retry'
  trace: 'off', // 'off', 'on', 'retain-on-failure', 'on-first-retry'
  
  // ==========================================
  // TIMEOUTS
  // ==========================================
  
  actionTimeout: 0, // 0 = no timeout
  navigationTimeout: 30_000,
  
  // ==========================================
  // NETWORK
  // ==========================================
  
  offline: false,
  httpCredentials: {
    username: 'user',
    password: 'pass',
  },
  extraHTTPHeaders: {
    'X-Custom-Header': 'value',
  },
  
  // ==========================================
  // STORAGE STATE
  // ==========================================
  
  storageState: 'auth.json',
  
  // ==========================================
  // IGNORE HTTPS ERRORS
  // ==========================================
  
  ignoreHTTPSErrors: true,
  
  // ==========================================
  // PROXY
  // ==========================================
  
  proxy: {
    server: 'http://proxy.example.com:8080',
    username: 'user',
    password: 'pass',
  },
}
```

---

## Web Server Configuration

### Auto-Starting Dev Server

```typescript
export default defineConfig({
  webServer: {
    // Command to start server
    command: 'npm run dev',
    
    // URL to wait for
    url: 'http://localhost:3000',
    
    // Reuse existing server (don't start new one)
    reuseExistingServer: !process.env.CI,
    
    // Timeout for server to start
    timeout: 120_000,
    
    // Environment variables
    env: {
      NODE_ENV: 'test',
    },
    
    // Working directory
    cwd: './app',
    
    // Standard output
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
```

### Multiple Web Servers

```typescript
export default defineConfig({
  webServer: [
    {
      command: 'npm run api',
      url: 'http://localhost:4000',
      reuseExistingServer: true,
    },
    {
      command: 'npm run frontend',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
    },
  ],
});
```

---

## Environment-Based Configuration

### CI vs Local

```typescript
export default defineConfig({
  // More retries on CI
  retries: process.env.CI ? 2 : 0,
  
  // Less parallelism on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Different timeouts
  timeout: process.env.CI ? 60_000 : 30_000,
  
  // Different reporters
  reporter: process.env.CI 
    ? [['junit', { outputFile: 'results.xml' }]]
    : [['html']],
  
  use: {
    // Different base URL
    baseURL: process.env.CI 
      ? 'https://staging.example.com'
      : 'http://localhost:3000',
    
    // More traces on CI
    trace: process.env.CI ? 'on-first-retry' : 'off',
  },
});
```

### Environment Variables

```typescript
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
  
  projects: [
    {
      name: 'staging',
      use: {
        baseURL: process.env.STAGING_URL,
      },
    },
    {
      name: 'production',
      use: {
        baseURL: process.env.PROD_URL,
      },
    },
  ],
});
```

**Usage:**
```bash
# Set environment variable
export BASE_URL=https://staging.example.com
npx playwright test

# Or inline
BASE_URL=https://staging.example.com npx playwright test
```

---

## Best Practices

### DO's and DON'Ts

```typescript
// ✅ DO: Use baseURL
use: {
  baseURL: 'http://localhost:3000'
}
// Tests: await page.goto('/dashboard')

// ❌ DON'T: Hardcode URLs
// Tests: await page.goto('http://localhost:3000/dashboard')

// ✅ DO: Configure for CI
retries: process.env.CI ? 2 : 0,
workers: process.env.CI ? 1 : undefined,

// ❌ DON'T: Use same settings everywhere
retries: 2, // Always retry, even locally

// ✅ DO: Use projects for multi-browser
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
]

// ❌ DON'T: Run same test file multiple times manually

// ✅ DO: Use webServer for local dev
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
}

// ❌ DON'T: Start server manually before tests

// ✅ DO: Use trace on first retry
trace: 'on-first-retry',

// ❌ DON'T: Always record traces
trace: 'on', // Slow!
```

### Configuration Checklist

```typescript
export default defineConfig({
  // ✅ Test discovery
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  
  // ✅ Execution
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  
  // ✅ Timeouts
  timeout: 30_000,
  expect: { timeout: 5_000 },
  
  // ✅ Reporting
  reporter: [['html'], ['json', { outputFile: 'results.json' }]],
  
  // ✅ Shared settings
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  
  // ✅ Multi-browser
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  
  // ✅ Dev server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Summary**: You now understand Playwright configuration, projects for multi-browser testing, device emulation, and environment-based settings. The next chapter introduces the suite of visual tools available for debugging and diagnosing test failures.
