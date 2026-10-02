# Assignment: Advanced Playwright

**Topics Covered:** Page Object Model, Fixtures, Data-Driven Testing, Forms & Elements, Browser Contexts, Debugging & Artifacts  
**Difficulty:** Intermediate to Advanced  
**Estimated Time:** 5-7 hours  
**Reference:** `Week1-Day4-Advanced-Playwright.md`  

---

## 📋 Learning Objectives

By completing this assignment, you will:
- ✅ Master the Page Object Model (POM) pattern
- ✅ Create reusable fixtures for test setup
- ✅ Implement data-driven testing strategies
- ✅ Handle complex form interactions
- ✅ Work with browser contexts and storage states
- ✅ Use debugging tools and artifacts effectively
- ✅ Build maintainable, scalable test suites

---

## Instructions

- Use Playwright Test with TypeScript
- Organize code using Page Object Model
- Create custom fixtures for shared setup
- Implement data-driven tests with external data
- Capture and analyze artifacts (traces, screenshots, videos)
- Follow Playwright best practices
- Test on demo applications provided

---

## Part A: Page Object Model (25 points)

### Exercise 1: POM Project Structure (5 points)

Create a professional Playwright project structure with proper organization.

**Required Structure:**
```
playwright-advanced/
├── pages/
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── ProductPage.ts
├── tests/
│   ├── auth/
│   │   └── login.spec.ts
│   ├── dashboard/
│   │   └── dashboard.spec.ts
│   └── products/
│       └── products.spec.ts
├── fixtures/
│   └── testFixtures.ts
├── test-data/
│   ├── users.json
│   └── products.json
├── utils/
│   ├── helpers.ts
│   └── constants.ts
├── playwright.config.ts
├── package.json
└── README.md
```

**pages/BasePage.ts:**
```typescript
import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string) {
    await this.page.goto(url);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
```

**Requirements:**
- Create all folders and base files
- Implement BasePage with common methods
- Document the purpose of each folder
- Provide setup instructions in README

---

### Exercise 2: Login Page Object (6 points)

Create a comprehensive LoginPage with all necessary locators and actions.

**pages/LoginPage.ts:**
```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.locator('.error-message');
    this.rememberMeCheckbox = page.getByLabel('Remember me');
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.loginButton).toBeVisible();
  }

  async login(username: string, password: string, rememberMe: boolean = false) {
    // Input validation
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    
    await this.loginButton.click();
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async isLoginButtonEnabled(): Promise<boolean> {
    return await this.loginButton.isEnabled();
  }
}
```

**Requirements:**
- Implement all locators using role-based selectors
- Add input validation for login method
- Include methods for all page interactions
- Handle edge cases (empty inputs, disabled button)

---

### Exercise 3: Dashboard Page Object (6 points)

**pages/DashboardPage.ts:**
```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly heading: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly statsCards: Locator;
  readonly notificationBell: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Dashboard' });
    this.userMenu = page.getByRole('button', { name: 'User menu' });
    this.logoutButton = page.getByRole('menuitem', { name: 'Logout' });
    this.statsCards = page.locator('.stats-card');
    this.notificationBell = page.getByRole('button', { name: 'Notifications' });
  }

  async isLoaded(): Promise<boolean> {
    try {
      await expect(this.heading).toBeVisible({ timeout: 5000 });
      await expect(this.page).toHaveURL(/.*dashboard/);
      return true;
    } catch {
      return false;
    }
  }

  async getStatsCount(): Promise<number> {
    return await this.statsCards.count();
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  async getNotificationCount(): Promise<number> {
    const badge = this.page.locator('.notification-badge');
    const text = await badge.textContent();
    return parseInt(text || '0');
  }
}
```

---

### Exercise 4: POM Integration Tests (8 points)

**tests/auth/login.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';

test.describe('Login Flow with POM', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginPage.login('admin', 'password123');
    
    // Verify dashboard loaded
    const isLoaded = await dashboardPage.isLoaded();
    expect(isLoaded).toBe(true);
    
    // Verify URL
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show error with invalid credentials', async () => {
    await loginPage.login('invalid', 'wrong');
    
    // Verify error is visible
    const hasError = await loginPage.isErrorVisible();
    expect(hasError).toBe(true);
    
    // Verify error message
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Invalid credentials');
  });

  test('should handle empty username', async () => {
    await expect(async () => {
      await loginPage.login('', 'password');
    }).rejects.toThrow('Username and password are required');
  });

  test('should handle empty password', async () => {
    await expect(async () => {
      await loginPage.login('admin', '');
    }).rejects.toThrow('Username and password are required');
  });

  test('should remember user when checkbox is checked', async ({ page }) => {
    await loginPage.login('admin', 'password123', true);
    
    // Verify remember me cookie is set
    const cookies = await page.context().cookies();
    const rememberCookie = cookies.find(c => c.name === 'remember_me');
    expect(rememberCookie).toBeDefined();
  });
});
```

---

## Part B: Fixtures & Data-Driven Testing (30 points)

### Exercise 5: Custom Fixtures (10 points)

**fixtures/testFixtures.ts:**
```typescript
import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

type TestFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  loggedInPage: Page;
  adminPage: Page;
};

export const test = base.extend<TestFixtures>({
  // Login page fixture
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },

  // Dashboard page fixture
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  // Logged in user fixture
  loggedInPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('testuser', 'password123');
    
    // Wait for navigation
    await page.waitForURL('**/dashboard');
    
    await use(page);
    
    // Cleanup: logout
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.logout();
  },

  // Admin user fixture
  adminPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    
    await page.waitForURL('**/admin/dashboard');
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

**Usage Example:**
```typescript
import { test, expect } from '../fixtures/testFixtures';

test('should access dashboard as logged in user', async ({ loggedInPage, dashboardPage }) => {
  const isLoaded = await dashboardPage.isLoaded();
  expect(isLoaded).toBe(true);
});
```

---

### Exercise 6: Data-Driven Testing (10 points)

**test-data/users.json:**
```json
{
  "validUsers": [
    {
      "username": "admin",
      "password": "admin123",
      "expectedUrl": "/admin/dashboard",
      "role": "admin"
    },
    {
      "username": "user1",
      "password": "user123",
      "expectedUrl": "/dashboard",
      "role": "user"
    }
  ],
  "invalidUsers": [
    {
      "username": "invalid",
      "password": "wrong",
      "expectedError": "Invalid credentials"
    },
    {
      "username": "locked",
      "password": "password",
      "expectedError": "Account is locked"
    }
  ]
}
```

**tests/auth/data-driven-login.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import users from '../../test-data/users.json';

test.describe('Data-Driven Login Tests', () => {
  // Test valid users
  for (const user of users.validUsers) {
    test(`should login successfully as ${user.role}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      
      await loginPage.goto();
      await loginPage.login(user.username, user.password);
      
      // Verify correct dashboard
      await expect(page).toHaveURL(new RegExp(user.expectedUrl));
      expect(await dashboardPage.isLoaded()).toBe(true);
    });
  }

  // Test invalid users
  for (const user of users.invalidUsers) {
    test(`should show error for ${user.username}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.goto();
      await loginPage.login(user.username, user.password);
      
      // Verify error
      expect(await loginPage.isErrorVisible()).toBe(true);
      const errorMsg = await loginPage.getErrorMessage();
      expect(errorMsg).toContain(user.expectedError);
    });
  }
});
```

---

### Exercise 7: Parameterized Tests (10 points)

**tests/auth/parameterized-tests.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const testCases = [
  { username: '', password: 'test', expected: 'Username is required' },
  { username: 'test', password: '', expected: 'Password is required' },
  { username: 'ab', password: 'test', expected: 'Username must be at least 3 characters' },
  { username: 'test', password: '12', expected: 'Password must be at least 6 characters' },
];

test.describe('Login Validation Tests', () => {
  for (const testCase of testCases) {
    test(`should validate: ${testCase.expected}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      try {
        await loginPage.login(testCase.username, testCase.password);
      } catch (error) {
        expect((error as Error).message).toContain(testCase.expected);
      }
    });
  }
});
```

---

## Part C: Forms & Browser Contexts (25 points)

### Exercise 8: Complex Form Handling (8 points)

**pages/RegistrationPage.ts:**
```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegistrationPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly countrySelect: Locator;
  readonly termsCheckbox: Locator;
  readonly newsletterCheckbox: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByLabel('First Name');
    this.lastNameInput = page.getByLabel('Last Name');
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.confirmPasswordInput = page.getByLabel('Confirm Password');
    this.countrySelect = page.getByLabel('Country');
    this.termsCheckbox = page.getByLabel('I agree to terms');
    this.newsletterCheckbox = page.getByLabel('Subscribe to newsletter');
    this.submitButton = page.getByRole('button', { name: 'Register' });
    this.successMessage = page.locator('.success-message');
  }

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    country: string;
    agreeToTerms: boolean;
    newsletter?: boolean;
  }) {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword);
    
    // Select country
    await this.countrySelect.selectOption(data.country);
    
    // Check terms (required)
    if (data.agreeToTerms) {
      await this.termsCheckbox.check();
    }
    
    // Optional newsletter
    if (data.newsletter) {
      await this.newsletterCheckbox.check();
    }
    
    await this.submitButton.click();
  }

  async uploadProfilePicture(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
  }
}
```

---

### Exercise 9: Browser Contexts (9 points)

**tests/contexts/multi-user.spec.ts:**
```typescript
import { test, expect, chromium } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';

test('should handle multiple users in separate contexts', async () => {
  const browser = await chromium.launch();
  
  // Context 1: Admin user
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  const loginPage1 = new LoginPage(page1);
  const dashboardPage1 = new DashboardPage(page1);
  
  await loginPage1.goto();
  await loginPage1.login('admin', 'admin123');
  expect(await dashboardPage1.isLoaded()).toBe(true);
  
  // Context 2: Regular user
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  const loginPage2 = new LoginPage(page2);
  const dashboardPage2 = new DashboardPage(page2);
  
  await loginPage2.goto();
  await loginPage2.login('user1', 'user123');
  expect(await dashboardPage2.isLoaded()).toBe(true);
  
  // Verify isolation
  const cookies1 = await context1.cookies();
  const cookies2 = await context2.cookies();
  expect(cookies1).not.toEqual(cookies2);
  
  // Cleanup
  await context1.close();
  await context2.close();
  await browser.close();
});
```

---

### Exercise 10: Storage State Reuse (8 points)

**tests/storage/auth-state.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import path from 'path';

const authFile = path.join(__dirname, '../../.auth/user.json');

test.describe('Storage State Tests', () => {
  test('should save auth state', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('testuser', 'password123');
    
    // Save storage state
    await page.context().storageState({ path: authFile });
  });

  test('should reuse auth state', async ({ browser }) => {
    // Create context with saved state
    const context = await browser.newContext({
      storageState: authFile
    });
    
    const page = await context.newPage();
    await page.goto('/dashboard');
    
    // Should be logged in
    await expect(page).toHaveURL(/.*dashboard/);
    
    await context.close();
  });
});
```

---

## Part D: Debugging & Artifacts (20 points)

### Exercise 11: Comprehensive Debugging Setup (20 points)

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Slow down actions for debugging
    launchOptions: {
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    },
  },

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

**Debugging Workflow Document:**
```markdown
# Debugging Failed Tests - Step-by-Step Guide

## 1. Initial Failure Analysis
- Check the test output in terminal
- Note the failing assertion or error message
- Identify which test and which line failed

## 2. Run with Trace
```bash
npx playwright test --trace on
```
- Trace captures every action
- Includes screenshots, network, console logs

## 3. Open Trace Viewer
```bash
npx playwright show-trace trace.zip
```
- Time-travel through test execution
- See DOM snapshots at each step
- View network requests
- Check console logs

## 4. Analyze Screenshots
- Located in `test-results/`
- Shows exact state when test failed
- Compare with expected state

## 5. Check Video Recording
- Only saved on failure (if configured)
- Shows full test execution
- Helps identify timing issues

## 6. Common Issues & Solutions

### Timing Issues
- Symptom: Test passes locally, fails in CI
- Solution: Use proper waits, avoid hard-coded timeouts

### Selector Issues
- Symptom: Element not found
- Solution: Use Playwright Inspector to verify selectors

### State Issues
- Symptom: Unexpected state
- Solution: Check storage state, cookies, local storage

## 7. Debug Mode
```bash
npx playwright test --debug
```
- Pauses before each action
- Allows step-by-step execution
- Inspector shows live page state
```

---

## Bonus Challenges (30 points)

### Exercise 12: Advanced POM with Inheritance (10 points)

Create a sophisticated page object hierarchy with shared functionality.

**pages/BaseAuthPage.ts:**
```typescript
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export abstract class BaseAuthPage extends BasePage {
  abstract login(username: string, password: string): Promise<void>;
  abstract logout(): Promise<void>;
  abstract isLoggedIn(): Promise<boolean>;
}
```

---

### Exercise 13: Custom Reporter (10 points)

Create a custom reporter that sends test results to a webhook.

---

### Exercise 14: Visual Regression Testing (10 points)

Implement visual comparison tests using Playwright's screenshot comparison.

---

## Submission Guidelines

1. Create folder `assignment04_yourname/`
2. Include:
   - Complete page objects in `pages/`
   - All tests in `tests/`
   - Custom fixtures in `fixtures/`
   - Test data in `test-data/`
   - `playwright.config.ts`
   - `package.json`
   - `README.md` with:
     - Setup instructions
     - How to run tests
     - How to view reports
     - Debugging guide
3. Run all tests and include HTML report
4. Provide sample trace file for one test

---

## Grading Rubric

- **POM Implementation (30%)**: Clean, reusable page objects
  - Proper inheritance (10%)
  - Locator strategies (10%)
  - Method organization (10%)

- **Fixtures & Data (30%)**: Effective use of fixtures and data-driven tests
  - Custom fixtures (15%)
  - Data-driven tests (15%)

- **Advanced Features (25%)**: Contexts, forms, storage state
  - Browser contexts (10%)
  - Form handling (8%)
  - Storage state (7%)

- **Debugging & Artifacts (15%)**: Proper configuration and debugging
  - Configuration (8%)
  - Debugging workflow (7%)

---

## Common Mistakes to Avoid

❌ Duplicate locators across multiple page objects  
❌ No input validation in page object methods  
❌ Missing assertions in data-driven tests  
❌ Not isolating browser contexts properly  
❌ Hardcoding test data in test files  
❌ Ignoring trace and video artifacts  
❌ Not using fixtures for shared setup  
❌ Poor page object organization  

---

## Tips for Success

✅ **Keep page objects focused** - one page = one class  
✅ **Use fixtures liberally** - reduce test setup duplication  
✅ **Validate inputs** in page object methods  
✅ **Organize test data** in separate JSON files  
✅ **Use storage state** to speed up authenticated tests  
✅ **Enable artifacts** for debugging failures  
✅ **Follow naming conventions** for consistency  
✅ **Document complex workflows** in comments  
✅ **Test edge cases** in data-driven tests  
✅ **Use trace viewer** to debug flaky tests  

---

## Quick Reference

### Page Object Pattern
```typescript
export class MyPage extends BasePage {
  readonly element: Locator;
  
  constructor(page: Page) {
    super(page);
    this.element = page.getByRole('button');
  }
  
  async doAction() {
    await this.element.click();
  }
}
```

### Custom Fixture
```typescript
export const test = base.extend<{ myFixture: MyPage }>({
  myFixture: async ({ page }, use) => {
    const myPage = new MyPage(page);
    await myPage.goto();
    await use(myPage);
  },
});
```

### Data-Driven Test
```typescript
for (const data of testData) {
  test(`test with ${data.name}`, async ({ page }) => {
    // Use data
  });
}
```

---

**Total Points: 100 + 30 Bonus = 130 points**

Master advanced Playwright patterns and build professional test suites! 🎭
