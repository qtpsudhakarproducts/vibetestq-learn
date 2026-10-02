# Chapter 14: Fixtures & Hooks - Complete Guide

## The Concept of Fixtures & Hooks

Manual setup and teardown are the biggest sources of code duplication in testing. Writing `const browser = await launch()` and `await browser.close()` in every file is inefficient. Playwright solves this with **Fixtures** (a dependency injection system) and **Hooks** (traditional setup/teardown methods).

**Purpose**: This chapter explains how to use both traditional hooks (`beforeEach`, `afterAll`) and Playwright's preferred alternative—**Fixtures**—to encapsulate setup logic and ensure clean test environments.

**Why are they required?**
1. **DRY Code**: To avoid repeating the same login or setup steps across dozens of test files.
2. **Encapsulation**: To keep your test code focused on the "flow" while the "setup" happens behind the scenes.
3. **Lifecycle Management**: To ensure resources (like database connections or browser sessions) are opened and closed at the correct time during the test execution.

### What are Fixtures?

**Fixtures** are Playwright's dependency injection system. They provide:
- Reusable test setup
- Automatic cleanup
- Isolated test environment
- Composable dependencies

### The Problem Fixtures Solve

**❌ Without Fixtures (Repetitive):**
```typescript
test('test 1', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('/');
  // Test logic...
  
  await context.close();
  await browser.close();
});

test('test 2', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('/');
  // Test logic...
  
  await context.close();
  await browser.close();
});
```

**✅ With Fixtures (Clean):**
```typescript
test('test 1', async ({ page }) => {
  await page.goto('/');
  // Test logic...
  // Cleanup automatic!
});

test('test 2', async ({ page }) => {
  await page.goto('/');
  // Test logic...
  // Cleanup automatic!
});
```

### Fixture Benefits

| Benefit | Description | Impact |
|---------|-------------|--------|
| **Reusability** | Write once, use everywhere | DRY code |
| **Isolation** | Each test gets fresh fixtures | No state leakage |
| **Automatic Cleanup** | Teardown happens automatically | No resource leaks |
| **Composability** | Fixtures can depend on other fixtures | Flexible architecture |
| **Type Safety** | Full TypeScript support | Catch errors early |

---

## Built-in Fixtures

### Core Fixtures

Playwright provides these fixtures out of the box:

| Fixture | Scope | Type | Description |
|---------|-------|------|-------------|
| `page` | Test | Page | Isolated browser page |
| `context` | Test | BrowserContext | Isolated browser context |
| `browser` | Worker | Browser | Browser instance |
| `browserName` | Worker | string | 'chromium', 'firefox', 'webkit' |
| `request` | Test | APIRequestContext | API testing context |

### Using Built-in Fixtures

```typescript
// page fixture
test('use page', async ({ page }) => {
  await page.goto('/');
  await page.click('button');
});

// context fixture
test('use context', async ({ context }) => {
  const page = await context.newPage();
  await page.goto('/');
});

// browser fixture
test('use browser', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
});

// browserName fixture
test('check browser', async ({ browserName }) => {
  console.log('Running on:', browserName);
  if (browserName === 'webkit') {
    // Safari-specific logic
  }
});

// request fixture (API testing)
test('use request', async ({ request }) => {
  const response = await request.get('/api/users');
  expect(response.ok()).toBeTruthy();
});
```

### Multiple Fixtures

```typescript
test('use multiple fixtures', async ({ page, context, browserName }) => {
  console.log('Browser:', browserName);
  
  // Use page
  await page.goto('/');
  
  // Create additional page from context
  const page2 = await context.newPage();
  await page2.goto('/other');
});
```

---

## Creating Custom Fixtures

### Basic Custom Fixture

```typescript
import { test as base } from '@playwright/test';

// Define fixture type
type MyFixtures = {
  todoPage: string;
};

// Extend base test with custom fixture
const test = base.extend<MyFixtures>({
  todoPage: async ({ page }, use) => {
    // Setup
    await page.goto('/todos');
    
    // Provide fixture value to test
    await use(page.url());
    
    // Teardown (runs after test)
    console.log('Cleaning up...');
  },
});

// Use custom fixture
test('use custom fixture', async ({ todoPage }) => {
  console.log('Todo page URL:', todoPage);
});
```

### Fixture Anatomy

```typescript
const test = base.extend<MyFixtures>({
  fixtureName: async ({ dependencies }, use) => {
    // 1. Setup phase
    const value = await setupSomething();
    
    // 2. Provide value to test
    await use(value);
    
    // 3. Teardown phase (after test completes)
    await cleanupSomething(value);
  },
});
```

### Practical Example: Authenticated Page

```typescript
import { test as base } from '@playwright/test';
import { Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Setup: Login
    await page.goto('/login');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Provide logged-in page to test
    await use(page);
    
    // Teardown: Logout
    await page.click('#logout');
  },
});

// Use authenticated page
test('view profile', async ({ authenticatedPage }) => {
  // Already logged in!
  await authenticatedPage.goto('/profile');
  await expect(authenticatedPage.locator('.username')).toBeVisible();
});
```

---

## Fixture Scopes

### Test-Scoped Fixtures (Default)

**Created fresh for each test:**

```typescript
type TestFixtures = {
  userEmail: string;
};

const test = base.extend<TestFixtures>({
  userEmail: async ({}, use) => {
    // New email for each test
    const email = `user-${Date.now()}@example.com`;
    await use(email);
  },
});

test('test 1', async ({ userEmail }) => {
  console.log(userEmail); // user-1234567890@example.com
});

test('test 2', async ({ userEmail }) => {
  console.log(userEmail); // user-1234567891@example.com (different!)
});
```

**Execution:**
```
Test 1:
  ├─ Setup userEmail
  ├─ Run test 1
  └─ Teardown userEmail

Test 2:
  ├─ Setup userEmail (fresh)
  ├─ Run test 2
  └─ Teardown userEmail
```

---

## Worker-Scoped Fixtures

### What are Worker Fixtures?

**Worker-scoped fixtures** are created once per worker process and shared across all tests in that worker.

**Use for:**
- Expensive setup (database connection)
- Shared resources
- One-time initialization

### Creating Worker Fixtures

```typescript
type WorkerFixtures = {
  database: Database;
};

const test = base.extend<{}, WorkerFixtures>({
  database: [async ({}, use) => {
    // Setup ONCE per worker
    const db = await connectToDatabase();
    await db.seed();
    
    // Share with all tests in this worker
    await use(db);
    
    // Teardown ONCE per worker
    await db.close();
  }, { scope: 'worker' }], // ← Worker scope
});

test('test 1', async ({ database }) => {
  const users = await database.query('SELECT * FROM users');
  // ...
});

test('test 2', async ({ database }) => {
  // Same database instance!
  const users = await database.query('SELECT * FROM users');
  // ...
});
```

**Execution:**
```
Worker 1:
  ├─ Setup database (ONCE)
  ├─ Run test 1
  ├─ Run test 2
  ├─ Run test 3
  └─ Teardown database (ONCE)

Worker 2:
  ├─ Setup database (ONCE)
  ├─ Run test 4
  ├─ Run test 5
  └─ Teardown database (ONCE)
```

### Test vs Worker Scope Comparison

| Aspect | Test Scope | Worker Scope |
|--------|-----------|--------------|
| **Created** | Per test | Per worker |
| **Shared** | No | Yes (within worker) |
| **Use for** | Test isolation | Expensive setup |
| **Cleanup** | After each test | After all tests in worker |
| **Example** | Page, user data | Database, API client |

---

## Automatic Fixtures

### What are Automatic Fixtures?

Fixtures that run automatically for every test, even if not requested.

**Use for:**
- Logging
- Screenshots
- Monitoring
- Global setup

### Creating Automatic Fixtures

```typescript
type AutoFixtures = {
  autoLogger: void; // void = no value needed
};

const test = base.extend<AutoFixtures>({
  autoLogger: [async ({}, use, testInfo) => {
    // Runs before every test
    console.log(`Starting test: ${testInfo.title}`);
    const startTime = Date.now();
    
    await use();
    
    // Runs after every test
    const duration = Date.now() - startTime;
    console.log(`Finished test: ${testInfo.title} (${duration}ms)`);
  }, { auto: true }], // ← Automatic
});

// No need to request autoLogger - it runs automatically!
test('my test', async ({ page }) => {
  await page.goto('/');
});
```

**Output:**
```
Starting test: my test
Finished test: my test (1234ms)
```

### Automatic Screenshot on Failure

```typescript
type ScreenshotFixtures = {
  autoScreenshot: void;
};

const test = base.extend<ScreenshotFixtures>({
  autoScreenshot: [async ({ page }, use, testInfo) => {
    await use();
    
    // After test, check if failed
    if (testInfo.status !== 'passed') {
      const screenshot = await page.screenshot();
      await testInfo.attach('screenshot', {
        body: screenshot,
        contentType: 'image/png'
      });
    }
  }, { auto: true }],
});
```

---

## Overriding Fixtures

### Overriding Built-in Fixtures

```typescript
// Override page fixture to always start at home page
const test = base.extend({
  page: async ({ page }, use) => {
    // Navigate to home before every test
    await page.goto('/');
    await use(page);
  },
});

test('test 1', async ({ page }) => {
  // Already on home page!
  await expect(page).toHaveURL('/');
});
```

### Overriding with Options

```typescript
// Override context to always use dark mode
const test = base.extend({
  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      colorScheme: 'dark',
    });
    await use(context);
    await context.close();
  },
});

test('test in dark mode', async ({ page }) => {
  // Page is in dark mode
  await page.goto('/');
});
```

---

## Fixture Execution Order

### Dependency Resolution

Fixtures are set up in dependency order:

```typescript
type MyFixtures = {
  fixtureA: string;
  fixtureB: string;
  fixtureC: string;
};

const test = base.extend<MyFixtures>({
  fixtureA: async ({}, use) => {
    console.log('Setup A');
    await use('A');
    console.log('Teardown A');
  },
  
  fixtureB: async ({ fixtureA }, use) => {
    console.log('Setup B (depends on A)');
    await use(`B-${fixtureA}`);
    console.log('Teardown B');
  },
  
  fixtureC: async ({ fixtureA, fixtureB }, use) => {
    console.log('Setup C (depends on A and B)');
    await use(`C-${fixtureA}-${fixtureB}`);
    console.log('Teardown C');
  },
});

test('test', async ({ fixtureC }) => {
  console.log('Test running');
});
```

**Output:**
```
Setup A
Setup B (depends on A)
Setup C (depends on A and B)
Test running
Teardown C
Teardown B
Teardown A
```

**Execution Order:**
```
┌─────────────────────────────────┐
│ 1. Setup fixtureA               │
├─────────────────────────────────┤
│ 2. Setup fixtureB (needs A)     │
├─────────────────────────────────┤
│ 3. Setup fixtureC (needs A, B)  │
├─────────────────────────────────┤
│ 4. Run test                     │
├─────────────────────────────────┤
│ 5. Teardown fixtureC            │
├─────────────────────────────────┤
│ 6. Teardown fixtureB            │
├─────────────────────────────────┤
│ 7. Teardown fixtureA            │
└─────────────────────────────────┘
```

---

## Test Hooks (Traditional Setup/Teardown)

While Fixtures are the recommended way to manage state in Playwright, traditional **Hooks** are still supported and useful for simple file-level setup or grouping tests.

### Types of Hooks

| Hook | When it runs | Scope |
|------|--------------|-------|
| `test.beforeAll()` | Once before all tests | File or `describe` block |
| `test.beforeEach()` | Before every single test | File or `describe` block |
| `test.afterEach()` | After every single test | File or `describe` block |
| `test.afterAll()` | Once after all tests | File or `describe` block |

### Basic Usage

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature: User Dashboard', () => {
  
  // Runs once before all tests in this block
  test.beforeAll(async () => {
    console.log('Connecting to Global API...');
  });

  // Runs before EACH test
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.fill('#user', 'admin');
    await page.click('#login');
  });

  test('should display widgets', async ({ page }) => {
    await expect(page.locator('.widget')).toBeVisible();
  });

  test('should allow logout', async ({ page }) => {
    await page.click('#logout');
    await expect(page).toHaveURL('/login');
  });

  // Runs after EACH test
  test.afterEach(async ({ page }) => {
    console.log('Test completed.');
  });

  // Runs once after all tests finish
  test.afterAll(async () => {
    console.log('Closing connections...');
  });
});
```

---

## Fixtures vs. Hooks: Which to use?

In Playwright, **Fixtures are superior to Hooks** for most use cases because they are composable, reusable across files, and handle teardown automatically even if a test fails.

| Feature | Hooks (`beforeEach`) | Fixtures (`use`) |
|---------|---------------------|-----------------|
| **Reusability** | Local to a file/block | Shared across any file |
| **Cleanup** | Manual `afterEach` | Automatic `teardown` logic |
| **Dependency** | Limited ordering | Explicitly composable |
| **Data Sharing** | Shared variables (risk of leakage) | Passed as arguments (safe) |
| **Speed** | Serial execution | Parallel execution friendly |

**The Playwright Philosophy**: Use **Hooks** for quick, file-specific setup. Use **Fixtures** for everything else, especially for shared resources like Logins, Database connections, and Page Objects.

---

## Advanced Patterns

### Pattern 1: Page Object Fixture

```typescript
import { test as base } from '@playwright/test';

class LoginPage {
  constructor(private page: Page) {}
  
  async login(username: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
    await this.page.click('button[type="submit"]');
  }
}

type PageObjects = {
  loginPage: LoginPage;
};

const test = base.extend<PageObjects>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

test('login test', async ({ loginPage }) => {
  await loginPage.login('user', 'pass');
});
```

### Pattern 2: Test Data Fixture

```typescript
type TestData = {
  testUser: { username: string; password: string };
};

const test = base.extend<TestData>({
  testUser: async ({}, use) => {
    // Create test user
    const user = {
      username: `user-${Date.now()}`,
      password: 'TestPass123!',
    };
    
    // Register user via API
    await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    
    await use(user);
    
    // Cleanup: Delete user
    await fetch(`/api/users/${user.username}`, {
      method: 'DELETE',
    });
  },
});

test('test with user', async ({ page, testUser }) => {
  await page.goto('/login');
  await page.fill('#username', testUser.username);
  await page.fill('#password', testUser.password);
  await page.click('button[type="submit"]');
});
```

### Pattern 3: API Client Fixture

```typescript
class APIClient {
  constructor(private request: APIRequestContext) {}
  
  async getUsers() {
    const response = await this.request.get('/api/users');
    return response.json();
  }
  
  async createUser(data: any) {
    const response = await this.request.post('/api/users', { data });
    return response.json();
  }
}

type APIFixtures = {
  api: APIClient;
};

const test = base.extend<APIFixtures>({
  api: async ({ request }, use) => {
    await use(new APIClient(request));
  },
});

test('API test', async ({ api }) => {
  const users = await api.getUsers();
  expect(users.length).toBeGreaterThan(0);
});
```

### Pattern 4: Multiple User Roles

```typescript
type UserFixtures = {
  adminPage: Page;
  userPage: Page;
};

const test = base.extend<UserFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'admin-auth.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  
  userPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'user-auth.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

test('admin and user interaction', async ({ adminPage, userPage }) => {
  // Admin creates item
  await adminPage.goto('/admin/items');
  await adminPage.click('button:has-text("Create")');
  
  // User sees item
  await userPage.goto('/items');
  await expect(userPage.locator('.item').first()).toBeVisible();
});
```

---

## Best Practices

### DO's and DON'Ts

```typescript
// ✅ DO: Use fixtures for setup/teardown
const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
    await logout(page);
  },
});

// ❌ DON'T: Use beforeEach for everything
test.beforeEach(async ({ page }) => {
  await login(page);
});

// ✅ DO: Use worker scope for expensive setup
const test = base.extend<{}, WorkerFixtures>({
  database: [async ({}, use) => {
    const db = await connectDB();
    await use(db);
    await db.close();
  }, { scope: 'worker' }],
});

// ❌ DON'T: Connect to database in every test
test('test', async ({}) => {
  const db = await connectDB(); // Slow!
});

// ✅ DO: Make fixtures composable
const test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page, loginPage }, use) => {
    await loginPage.login('user', 'pass');
    await use(new DashboardPage(page));
  },
});

// ❌ DON'T: Duplicate setup logic
const test = base.extend({
  dashboardPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('#username', 'user');
    // ... duplicated login logic
  },
});

// ✅ DO: Use automatic fixtures for monitoring
const test = base.extend({
  logger: [async ({}, use, testInfo) => {
    console.log(`Start: ${testInfo.title}`);
    await use();
    console.log(`End: ${testInfo.title}`);
  }, { auto: true }],
});

// ❌ DON'T: Log manually in every test
test('test', async ({}) => {
  console.log('Starting test');
  // test logic
  console.log('Ending test');
});
```

### Fixture Design Guidelines

**1. Single Responsibility**
```typescript
// ✅ Good: Each fixture does one thing
const test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

// ❌ Bad: Fixture does too much
const test = base.extend({
  allPages: async ({ page }, use) => {
    await use({
      login: new LoginPage(page),
      dashboard: new DashboardPage(page),
      profile: new ProfilePage(page),
      // ...
    });
  },
});
```

**2. Clear Dependencies**
```typescript
// ✅ Good: Dependencies explicit
const test = base.extend({
  authenticatedPage: async ({ page, loginPage }, use) => {
    await loginPage.login('user', 'pass');
    await use(page);
  },
});

// ❌ Bad: Hidden dependencies
const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Where does login come from?
    await login(page);
    await use(page);
  },
});
```

**Summary**: You now understand Playwright's powerful fixture system and traditional hooks. The next chapter covers how to generate reports and integrate your tests into a CI/CD pipeline.
