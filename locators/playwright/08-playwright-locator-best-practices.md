## Chapter 8: Playwright Locators Best Practices and Guidelines

### 8.1 Locator Strategy Priority

**Recommended Priority Order:**

1. **getByRole()** - Most resilient and accessible
2. **getByLabel()** - Best for form inputs
3. **getByPlaceholder()** - Good for inputs without labels
4. **getByText()** - Good for clickable elements with visible text
5. **getByTestId()** - When you control the markup
6. **CSS/XPath** - Last resort

**Decision Tree:**

```javascript
// Is it a button, link, or interactive element with a role?
await page.getByRole('button', { name: 'Submit' }).click();

// Is it a form input with a label?
await page.getByLabel('Email').fill('user@example.com');

// Is it an input with a placeholder but no label?
await page.getByPlaceholder('Search...').fill('query');

// Does it have visible text that identifies it?
await page.getByText('Welcome back!').isVisible();

// Do you control the HTML and can add test IDs?
await page.getByTestId('submit-button').click();

// Last resort: CSS or XPath
await page.locator('#complex-id').click();
```

**Why This Order?**

```javascript
// ✅ BEST: Role-based (resilient to implementation changes)
await page.getByRole('button', { name: 'Submit' }).click();
// Works even if:
// - Button class changes
// - Button ID changes
// - Button moves in DOM
// - Styling changes

// ⚠️ FRAGILE: CSS selector (breaks easily)
await page.locator('button.btn-primary.submit-btn').click();
// Breaks if:
// - Class names change
// - CSS framework updated
// - Styling refactored
```

### 8.2 Maintainability Guidelines

**Use Descriptive Locators:**

```javascript
// ❌ Bad: Not descriptive
await page.locator('button').nth(2).click();
await page.locator('div > div > span').click();

// ✅ Good: Self-documenting
await page.getByRole('button', { name: 'Save Changes' }).click();
await page.getByLabel('Email Address').fill('user@example.com');
```

**Avoid Brittle Selectors:**

```javascript
// ❌ Bad: Depends on DOM structure
await page.locator('div.container > div.row > div.col > button').click();

// ❌ Bad: Depends on position
await page.locator('button').nth(5).click();

// ✅ Good: Semantic and resilient
await page.getByRole('button', { name: 'Submit' }).click();
```

**Create Reusable Locator Patterns:**

```javascript
// Define common locators
class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByRole('alert');
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

### 8.3 Testing Locators in Browser

**Using Playwright Inspector:**

```bash
# Run test in debug mode
npx playwright test --debug

# Or set environment variable
PWDEBUG=1 npx playwright test
```

**Using Browser DevTools:**

```javascript
// In browser console, test Playwright selectors
playwright.$(page.getByRole('button', { name: 'Submit' }));
playwright.$$(page.locator('.product-card'));
```

**Codegen for Locator Generation:**

```bash
# Generate test with locators
npx playwright codegen https://example.com
```

### 8.4 Common Locator Mistakes to Avoid

**Mistake 1: Using Overly Specific Selectors**

```javascript
// ❌ Bad: Too specific
await page.locator('div.container div.row div.col-md-6 button.btn.btn-primary.submit-btn').click();

// ✅ Good: Just enough specificity
await page.getByRole('button', { name: 'Submit' }).click();
```

**Mistake 2: Relying on Dynamic IDs**

```javascript
// ❌ Bad: Dynamic ID
await page.locator('#user-123456').click();

// ✅ Good: Stable attribute
await page.getByTestId('user-card').click();
```

**Mistake 3: Not Using Strict Mode Properly**

```javascript
// ❌ Bad: May match multiple elements
await page.locator('button').click();  // Error if multiple buttons

// ✅ Good: Be specific
await page.getByRole('button', { name: 'Submit' }).click();

// ✅ Good: Or use first() intentionally
await page.locator('button').first().click();
```

**Mistake 4: Ignoring Accessibility**

```javascript
// ❌ Bad: Not accessible
await page.locator('div[onclick]').click();

// ✅ Good: Proper button with role
await page.getByRole('button', { name: 'Click me' }).click();
```

### 8.5 Page Object Model with Playwright

**Basic Page Object:**

```javascript
// pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    
    // Define locators
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.rememberMeCheckbox = page.getByRole('checkbox', { name: 'Remember me' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByRole('alert');
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username, password, rememberMe = false) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    
    await this.loginButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}

// Usage in test
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('testuser', 'password123', true);
  
  await expect(page).toHaveURL('/dashboard');
});
```

**Advanced Page Object with Components:**

```javascript
// components/NavigationComponent.js
export class NavigationComponent {
  constructor(page) {
    this.page = page;
    this.nav = page.getByRole('navigation', { name: 'Main' });
  }

  async clickLink(linkName) {
    await this.nav.getByRole('link', { name: linkName }).click();
  }

  async isLinkActive(linkName) {
    const link = this.nav.getByRole('link', { name: linkName });
    return await link.getAttribute('aria-current') === 'page';
  }
}

// pages/DashboardPage.js
import { NavigationComponent } from '../components/NavigationComponent';

export class DashboardPage {
  constructor(page) {
    this.page = page;
    this.navigation = new NavigationComponent(page);
    this.welcomeMessage = page.getByRole('heading', { name: /welcome/i });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async navigateTo(section) {
    await this.navigation.clickLink(section);
  }
}
```

### 8.6 Performance Optimization

**Reuse Locators:**

```javascript
// ❌ Bad: Creates new locator each time
for (let i = 0; i < 10; i++) {
  await page.getByRole('button', { name: 'Click' }).click();
  await page.getByRole('button', { name: 'Click' }).waitFor();
}

// ✅ Good: Reuse locator
const button = page.getByRole('button', { name: 'Click' });
for (let i = 0; i < 10; i++) {
  await button.click();
  await button.waitFor();
}
```

**Scope Locators:**

```javascript
// ❌ Bad: Searches entire page each time
await page.locator('.product-card').nth(0).locator('.price').textContent();
await page.locator('.product-card').nth(0).locator('.name').textContent();
await page.locator('.product-card').nth(0).locator('.rating').textContent();

// ✅ Good: Scope to container first
const product = page.locator('.product-card').nth(0);
const price = await product.locator('.price').textContent();
const name = await product.locator('.name').textContent();
const rating = await product.locator('.rating').textContent();
```

**Parallel Locator Queries:**

```javascript
// ❌ Bad: Sequential
const name = await page.getByTestId('product-name').textContent();
const price = await page.getByTestId('product-price').textContent();
const stock = await page.getByTestId('product-stock').textContent();

// ✅ Good: Parallel
const [name, price, stock] = await Promise.all([
  page.getByTestId('product-name').textContent(),
  page.getByTestId('product-price').textContent(),
  page.getByTestId('product-stock').textContent()
]);
```

### 8.7 Debugging Locators

**Enable Verbose Logging:**

```javascript
// playwright.config.ts
export default {
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
};
```

**Use Playwright Inspector:**

```bash
PWDEBUG=1 npx playwright test
```

**Add Debug Logs:**

```javascript
// Log locator details
const button = page.getByRole('button', { name: 'Submit' });
console.log('Button count:', await button.count());
console.log('Button visible:', await button.isVisible());
console.log('Button text:', await button.textContent());
```

**Take Screenshots:**

```javascript
// Screenshot entire page
await page.screenshot({ path: 'debug.png' });

// Screenshot specific element
await page.getByRole('dialog').screenshot({ path: 'modal.png' });
```

### 8.8 Common Errors and Solutions

**Error: "Strict mode violation"**

```javascript
// Problem
await page.getByRole('button').click();
// Error: strict mode violation: locator resolved to 3 elements

// Solution 1: Be more specific
await page.getByRole('button', { name: 'Submit' }).click();

// Solution 2: Use first()
await page.getByRole('button').first().click();

// Solution 3: Filter
await page.getByRole('button').filter({ hasText: 'Submit' }).click();
```

**Error: "Element not found"**

```javascript
// Problem
await page.getByRole('button', { name: 'Submit' }).click();
// Error: Element not found

// Solution: Wait for element
await page.getByRole('button', { name: 'Submit' }).waitFor({ state: 'visible' });
await page.getByRole('button', { name: 'Submit' }).click();

// Or increase timeout
await page.getByRole('button', { name: 'Submit' }).click({ timeout: 10000 });
```

**Error: "Element is not visible"**

```javascript
// Problem
await page.getByRole('dialog').getByRole('button').click();
// Error: Element is not visible

// Solution: Wait for parent first
await page.getByRole('dialog').waitFor({ state: 'visible' });
await page.getByRole('dialog').getByRole('button').click();
```

---