# Chapter 18: Page Object Model (POM) - Complete Guide

## The Concept of Page Object Model

As an application grows, its UI changes. If your tests are filled with raw CSS or XPath selectors, a single button change can break hundreds of tests. The **Page Object Model (POM)** is a design pattern that separates the *what* (test logic) from the *how* (locators and interactions).

**Purpose**: This chapter teaches you how to structure your automation code into reusable classes, making your tests easier to read and maintain.

**Why is it required?**
1. **Reduced Maintenance**: To ensure that a UI change only requires an update in one place (the Page Object) rather than in every test file.
2. **Business Readability**: To transform technical code (`page.click('#login-btn')`) into understandable actions (`loginPage.login()`).
3. **Reusability**: To share common components (like Headers, Footers, and Modals) across different test suites.

### What is Page Object Model?

**Page Object Model (POM)** is a design pattern that creates an object-oriented representation of web pages. Each page becomes a class with:
- **Locators** as properties
- **Actions** as methods
- **Assertions** as helper methods

### The Problem POM Solves

**❌ Without POM (Repetitive and Brittle):**
```typescript
test('login test 1', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'user1');
  await page.fill('#password', 'pass1');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});

test('login test 2', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'user2');
  await page.fill('#password', 'pass2');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});

// If login form changes, update ALL tests! 😱
```

**✅ With POM (Maintainable and Reusable):**
```typescript
test('login test 1', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user1', 'pass1');
  await loginPage.expectDashboard();
});

test('login test 2', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user2', 'pass2');
  await loginPage.expectDashboard();
});

// If login form changes, update ONE place! ✅
```

---

## Why Use POM?

### Benefits Comparison

| Aspect | Without POM | With POM |
|--------|------------|----------|
| **Maintainability** | Update every test | Update one class |
| **Readability** | Technical selectors | Business language |
| **Reusability** | Copy-paste code | Reuse methods |
| **Testing** | Hard to test | Easy to test |
| **Collaboration** | Developers only | QA + Developers |
| **Refactoring** | Risky | Safe |

### When to Use POM

**✅ Use POM when:**
- Multiple tests interact with same page
- Page has complex interactions
- Team needs maintainable tests
- Page structure changes frequently
- You want business-readable tests

**❌ Don't use POM when:**
- Single simple test
- Prototype/throwaway tests
- Page is trivial (1-2 elements)
- Over-engineering simple scenarios

---

## Creating Page Objects

### Basic Page Object Structure

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  // Page reference
  readonly page: Page;
  
  // Locators
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  
  // Constructor
  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.locator('.error-message');
  }
  
  // Actions
  async goto() {
    await this.page.goto('/login');
  }
  
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
  
  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toHaveText(message);
  }
}
```

### Using the Page Object

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('successful login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.goto();
  await loginPage.login('validuser', 'validpass');
  
  await expect(page).toHaveURL('/dashboard');
});

test('failed login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.goto();
  await loginPage.login('invaliduser', 'wrongpass');
  
  await loginPage.expectErrorMessage('Invalid credentials');
});
```

---

## Page Object Best Practices

### 1. Use Descriptive Method Names

```typescript
// ✅ GOOD: Business language
async login(username: string, password: string) { }
async selectProduct(productName: string) { }
async addToCart() { }

// ❌ BAD: Technical language
async fillForm(user: string, pass: string) { }
async clickElement(selector: string) { }
async doAction() { }
```

### 2. Return Page Objects for Chaining

```typescript
export class LoginPage {
  async login(username: string, password: string): Promise<DashboardPage> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    
    // Return next page object
    return new DashboardPage(this.page);
  }
}

// Usage with chaining
test('navigate through pages', async ({ page }) => {
  const dashboardPage = await new LoginPage(page)
    .goto()
    .login('user', 'pass');
  
  const profilePage = await dashboardPage.goToProfile();
  await profilePage.updateName('John Doe');
});
```

### 3. Keep Locators in Constructor

```typescript
export class ProductPage {
  // ✅ GOOD: Locators as properties
  readonly productTitle: Locator;
  readonly addToCartButton: Locator;
  readonly price: Locator;
  
  constructor(page: Page) {
    this.productTitle = page.locator('.product-title');
    this.addToCartButton = page.getByRole('button', { name: 'Add to Cart' });
    this.price = page.locator('.price');
  }
  
  // ❌ BAD: Locators in methods
  async getTitle() {
    return await this.page.locator('.product-title').textContent();
  }
}
```

### 4. Separate Actions from Assertions

```typescript
export class LoginPage {
  // ✅ Actions (do something)
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
  
  // ✅ Assertions (verify something)
  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toHaveText(message);
  }
  
  async expectLoginButtonDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }
}
```

### 5. Use Getters for Dynamic Locators

```typescript
export class ProductListPage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  // Dynamic locator based on product name
  product(name: string): Locator {
    return this.page.locator('.product', { hasText: name });
  }
  
  productPrice(name: string): Locator {
    return this.product(name).locator('.price');
  }
  
  async selectProduct(name: string) {
    await this.product(name).click();
  }
}

// Usage
const productList = new ProductListPage(page);
await productList.selectProduct('Laptop');
await expect(productList.productPrice('Laptop')).toHaveText('$999');
```

---

## Combining POM with Fixtures

### Creating Page Object Fixtures

```typescript
// fixtures/pageFixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProductPage } from '../pages/ProductPage';

type PageFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  productPage: ProductPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
});

export { expect } from '@playwright/test';
```

### Using Page Object Fixtures

```typescript
import { test, expect } from './fixtures/pageFixtures';

test('login and view dashboard', async ({ loginPage, dashboardPage }) => {
  await loginPage.goto();
  await loginPage.login('user', 'pass');
  
  await dashboardPage.expectWelcomeMessage('Welcome, user!');
  await dashboardPage.expectWidgetCount(5);
});
```

### Authenticated Page Fixture

```typescript
type AuthFixtures = {
  authenticatedDashboard: DashboardPage;
};

export const test = base.extend<AuthFixtures>({
  authenticatedDashboard: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('testuser', 'testpass');
    
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
});

// Usage
test('view profile', async ({ authenticatedDashboard }) => {
  // Already logged in!
  await authenticatedDashboard.goToProfile();
});
```

---

## Advanced POM Patterns
 
 ### Pattern 1: Base Page Class (Inheritance)
In enterprise frameworks, all Page Objects should inherit from a **BasePage**. This centralizes common utilities like snapshots, navigation, and wait logic.

```typescript
// pages/BasePage.ts
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async goto(path: string) {
    await this.page.goto(path);
  }
  
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }
}

// pages/DashboardPage.ts
export class DashboardPage extends BasePage {
    readonly welcomeMsg: Locator;
    
    constructor(page: Page) {
        super(page); // Always call super for inheritance
        this.welcomeMsg = page.locator('#welcome');
    }
}
```

 ### Pattern 2: Component Objects (Composition)
Instead of putting everything in a Page Object, break the UI into reusable **Components** (like Header, Sidebar, Footer).

```typescript
// components/Navigation.ts
export class Navigation {
    readonly cartBtn: Locator;
    readonly searchInput: Locator;

    constructor(page: Page) {
        this.cartBtn = page.locator('#cart');
        this.searchInput = page.locator('#search');
    }

    async search(query: string) {
        await this.searchInput.fill(query);
    }
}

// pages/ProductPage.ts
export class ProductPage extends BasePage {
    readonly nav: Navigation; // Page "has-a" Navigation component

    constructor(page: Page) {
        super(page);
        this.nav = new Navigation(page);
    }
}
```

 ### Pattern 3: Page Factory
 
```typescript
// pages/PageFactory.ts
export class PageFactory {
  constructor(private page: Page) {}
  
  login(): LoginPage {
    return new LoginPage(this.page);
  }
  
  dashboard(): DashboardPage {
    return new DashboardPage(this.page);
  }
}

// Usage in test
test('login', async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
});
```

### Pattern 3: Fluent Interface

```typescript
export class SearchPage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async goto(): Promise<this> {
    await this.page.goto('/search');
    return this;
  }
  
  async search(query: string): Promise<this> {
    await this.page.fill('#search', query);
    await this.page.press('#search', 'Enter');
    return this;
  }
  
  async filterByCategory(category: string): Promise<this> {
    await this.page.click(`text=${category}`);
    return this;
  }
  
  async sortBy(option: string): Promise<this> {
    await this.page.selectOption('#sort', option);
    return this;
  }
  
  async expectResults(count: number): Promise<this> {
    await expect(this.page.locator('.result')).toHaveCount(count);
    return this;
  }
}

// Usage with method chaining
test('fluent search', async ({ page }) => {
  await new SearchPage(page)
    .goto()
    .search('laptop')
    .filterByCategory('Electronics')
    .sortBy('price-low-high')
    .expectResults(10);
});
```

---

## Component Objects

### Creating Reusable Components

```typescript
// components/Header.ts
export class Header {
  readonly page: Page;
  readonly logo: Locator;
  readonly searchBox: Locator;
  readonly cartIcon: Locator;
  readonly userMenu: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('.logo');
    this.searchBox = page.locator('#search');
    this.cartIcon = page.locator('.cart-icon');
    this.userMenu = page.locator('.user-menu');
  }
  
  async search(query: string) {
    await this.searchBox.fill(query);
    await this.searchBox.press('Enter');
  }
  
  async openCart() {
    await this.cartIcon.click();
  }
  
  async logout() {
    await this.userMenu.click();
    await this.page.click('text=Logout');
  }
}

// Using component in page object
export class DashboardPage {
  readonly page: Page;
  readonly header: Header;
  
  constructor(page: Page) {
    this.page = page;
    this.header = new Header(page);
  }
  
  async searchFromDashboard(query: string) {
    await this.header.search(query);
  }
}
```

### Modal Component

```typescript
// components/Modal.ts
export class Modal {
  readonly page: Page;
  readonly container: Locator;
  readonly closeButton: Locator;
  
  constructor(page: Page, selector: string) {
    this.page = page;
    this.container = page.locator(selector);
    this.closeButton = this.container.locator('.close');
  }
  
  async waitForOpen() {
    await expect(this.container).toBeVisible();
  }
  
  async close() {
    await this.closeButton.click();
    await expect(this.container).toBeHidden();
  }
  
  async expectTitle(title: string) {
    await expect(this.container.locator('.title')).toHaveText(title);
  }
}

// Usage
export class ProductPage {
  readonly page: Page;
  readonly deleteModal: Modal;
  
  constructor(page: Page) {
    this.page = page;
    this.deleteModal = new Modal(page, '#delete-modal');
  }
  
  async deleteProduct() {
    await this.page.click('#delete-button');
    await this.deleteModal.waitForOpen();
    await this.deleteModal.expectTitle('Confirm Delete');
    await this.page.click('#confirm-delete');
  }
}
```

---

## Real-World Examples

### E-Commerce Application

```typescript
// pages/ProductListPage.ts
export class ProductListPage {
  readonly page: Page;
  readonly searchBox: Locator;
  readonly categoryFilter: Locator;
  readonly sortDropdown: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.getByPlaceholder('Search products');
    this.categoryFilter = page.locator('.category-filter');
    this.sortDropdown = page.locator('#sort');
  }
  
  async goto() {
    await this.page.goto('/products');
  }
  
  async searchProduct(name: string) {
    await this.searchBox.fill(name);
    await this.searchBox.press('Enter');
  }
  
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
  }
  
  async sortBy(option: 'price-asc' | 'price-desc' | 'name') {
    await this.sortDropdown.selectOption(option);
  }
  
  async selectProduct(name: string): Promise<ProductDetailPage> {
    await this.page.click(`text=${name}`);
    return new ProductDetailPage(this.page);
  }
  
  async expectProductCount(count: number) {
    await expect(this.page.locator('.product-card')).toHaveCount(count);
  }
}

// pages/ProductDetailPage.ts
export class ProductDetailPage {
  readonly page: Page;
  readonly productTitle: Locator;
  readonly price: Locator;
  readonly addToCartButton: Locator;
  readonly quantityInput: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.productTitle = page.locator('h1.product-title');
    this.price = page.locator('.price');
    this.addToCartButton = page.getByRole('button', { name: 'Add to Cart' });
    this.quantityInput = page.locator('#quantity');
  }
  
  async setQuantity(quantity: number) {
    await this.quantityInput.fill(quantity.toString());
  }
  
  async addToCart(): Promise<CartPage> {
    await this.addToCartButton.click();
    await this.page.waitForURL('**/cart');
    return new CartPage(this.page);
  }
  
  async expectPrice(price: string) {
    await expect(this.price).toHaveText(price);
  }
}

// pages/CartPage.ts
export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly totalPrice: Locator;
  readonly checkoutButton: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('.cart-item');
    this.totalPrice = page.locator('.total-price');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }
  
  async removeItem(productName: string) {
    await this.page.locator('.cart-item', { hasText: productName })
      .locator('.remove-button')
      .click();
  }
  
  async updateQuantity(productName: string, quantity: number) {
    const item = this.page.locator('.cart-item', { hasText: productName });
    await item.locator('.quantity-input').fill(quantity.toString());
  }
  
  async checkout(): Promise<CheckoutPage> {
    await this.checkoutButton.click();
    return new CheckoutPage(this.page);
  }
  
  async expectItemCount(count: number) {
    await expect(this.cartItems).toHaveCount(count);
  }
  
  async expectTotal(total: string) {
    await expect(this.totalPrice).toHaveText(total);
  }
}

// Complete test using all page objects
test('complete purchase flow', async ({ page }) => {
  const productList = new ProductListPage(page);
  await productList.goto();
  await productList.searchProduct('Laptop');
  await productList.filterByCategory('Electronics');
  
  const productDetail = await productList.selectProduct('Gaming Laptop');
  await productDetail.expectPrice('$999');
  await productDetail.setQuantity(2);
  
  const cart = await productDetail.addToCart();
  await cart.expectItemCount(1);
  await cart.expectTotal('$1,998');
  
  const checkout = await cart.checkout();
  await checkout.fillShippingInfo({
    name: 'John Doe',
    address: '123 Main St',
    city: 'New York',
    zip: '10001'
  });
  await checkout.completeOrder();
});
```

---

## Testing the Page Objects

### Unit Testing Page Objects

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('LoginPage', () => {
  test('has correct locators', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Verify locators exist
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });
  
  test('login method fills form correctly', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('testuser', 'testpass');
    
    // Verify form was filled
    await expect(loginPage.usernameInput).toHaveValue('testuser');
    await expect(loginPage.passwordInput).toHaveValue('testpass');
  });
});
```

---

## Best Practices

### DO's and DON'Ts

```typescript
// ✅ DO: Use business language
class LoginPage {
  async login(username: string, password: string) { }
}

// ❌ DON'T: Use technical language
class LoginPage {
  async fillCredentials(u: string, p: string) { }
}

// ✅ DO: Return page objects
async login(): Promise<DashboardPage> {
  // ...
  return new DashboardPage(this.page);
}

// ❌ DON'T: Return void
async login() {
  // ...
}

// ✅ DO: Keep locators as properties
readonly submitButton: Locator;

// ❌ DON'T: Create locators in methods
async clickSubmit() {
  await this.page.click('button[type="submit"]');
}

// ✅ DO: Separate concerns
async login() { } // Action
async expectError() { } // Assertion

// ❌ DON'T: Mix actions and assertions
async loginAndVerify() {
  await this.login();
  await expect(this.page).toHaveURL('/dashboard');
}

// ✅ DO: Use descriptive names
async selectProductByName(name: string) { }

// ❌ DON'T: Use generic names
async select(item: string) { }
```

**Summary**: You now understand the Page Object Model pattern, how to create maintainable page objects, combine them with fixtures, and build reusable components. The next chapter explores how to use Playwright's same engine to perform high-speed API testing.
