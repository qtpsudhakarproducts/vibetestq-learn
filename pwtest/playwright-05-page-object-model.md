---
# Part 05: Page Object Model
> 📂 Playwright Test Framework Notes — Part 05 of 11

## 6. Page Object Model

### 6.1 Why POM Exists

Without POM, every test file has raw Playwright selectors scattered everywhere:

```typescript
// ❌ Without POM — selectors are everywhere, tests are fragile
test("login test 1", async ({ page }) => {
  await page.fill('input[name="email"]', "user@test.com");
  await page.fill('input[name="password"]', "pass");
  await page.click('button[type="submit"]');
});

test("login test 2", async ({ page }) => {
  // Same selectors duplicated! If the HTML changes, fix it in every test.
  await page.fill('input[name="email"]', "admin@test.com");
  await page.fill('input[name="password"]', "adminpass");
  await page.click('button[type="submit"]');
});
```

**The problem:** When `input[name="email"]` changes to `#email-input` in the HTML, you must find and update it in **every test file**. This is a maintenance nightmare.

With POM, you change it in **one place**:

```typescript
// ✅ With POM — selectors live in one place
class LoginPage {
  private emailInput = this.page.locator('input[name="email"]');
  // Change selector here → all tests are fixed automatically
}
```

**Benefits of POM:**
- **Single source of truth** for selectors — change once, fixes everywhere
- **Readable tests** — `loginPage.login("user", "pass")` is clearer than 3 raw commands
- **Reusable actions** — `login()` method used in hundreds of tests
- **Maintainable** — page changes only require updating the page object

---

### 6.2 Building Your First Page Object

```typescript
// pages/LoginPage.ts
import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  // ── The page reference ───────────────────────────────────────────────────
  readonly page: Page;

  // ── Locators — elements on the page ─────────────────────────────────────
  // Define these as properties so they're reusable and centralized
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize all locators in the constructor
    // Using role/label locators is more resilient than CSS selectors
    this.emailInput    = page.getByRole("textbox", { name: /email/i });
    this.passwordInput = page.getByRole("textbox", { name: /password/i });
    this.loginButton   = page.getByRole("button", { name: /log in/i });
    this.errorMessage  = page.locator("[data-testid='login-error']");
    this.forgotPasswordLink = page.getByRole("link", { name: /forgot password/i });
    this.signUpLink    = page.getByRole("link", { name: /sign up/i });
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  async navigate(): Promise<void> {
    await this.page.goto("/login");
    await this.page.waitForLoadState("domcontentloaded");
  }

  // ── Actions — compound operations that tests will call ────────────────────
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  // A compound action that combines multiple steps
  async login(email: string, password: string): Promise<void> {
    await this.navigate();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  // Login and wait for navigation to complete
  async loginAndWaitForDashboard(email: string, password: string): Promise<void> {
    await this.login(email, password);
    await this.page.waitForURL("**/dashboard", { timeout: 15_000 });
  }

  // ── Assertions — expected states of this page ─────────────────────────────
  async expectErrorMessage(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(message);
  }

  async expectLoginFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async expectPageTitle(): Promise<void> {
    await expect(this.page).toHaveTitle(/Log In/i);
  }
}
```

```typescript
// tests/auth/login.test.ts — clean, readable tests using the POM
import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";
import { DashboardPage } from "../../pages/DashboardPage";

test.describe("Login", () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await loginPage.loginAndWaitForDashboard("user@test.com", "password123");
    await dashboardPage.expectIsLoaded();
  });

  test("wrong password shows error", async () => {
    await loginPage.login("user@test.com", "wrongpassword");
    await loginPage.expectErrorMessage("Invalid email or password");
  });

  test("empty email shows validation error", async () => {
    await loginPage.navigate();
    await loginPage.clickLogin();
    await loginPage.expectErrorMessage("Email is required");
  });

  test("forgot password link is visible", async () => {
    await loginPage.navigate();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });
});
```

---

### 6.3 A Base Page Class

A base class avoids repeating common functionality across all page objects.

```typescript
// pages/BasePage.ts
import { Page, Locator, expect } from "@playwright/test";

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  // ── Common navigation helpers ─────────────────────────────────────────────
  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState("networkidle");
  }

  async waitForPageReady(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
  }

  // ── Common UI interactions ────────────────────────────────────────────────
  async clickAndWaitForNavigation(locator: Locator): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation(),
      locator.click()
    ]);
  }

  // ── Common assertions ────────────────────────────────────────────────────
  async expectToBeOnPage(urlPattern: RegExp | string): Promise<void> {
    await expect(this.page).toHaveURL(urlPattern);
  }

  async expectPageTitle(title: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  // ── Toast / notification helpers ─────────────────────────────────────────
  async expectSuccessToast(message?: string): Promise<void> {
    const toast = this.page.locator("[data-testid='toast-success']");
    await expect(toast).toBeVisible();
    if (message) await expect(toast).toContainText(message);
  }

  async expectErrorToast(message?: string): Promise<void> {
    const toast = this.page.locator("[data-testid='toast-error']");
    await expect(toast).toBeVisible();
    if (message) await expect(toast).toContainText(message);
  }

  // ── Screenshot helper ─────────────────────────────────────────────────────
  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({
      path: `screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }
}
```

```typescript
// pages/DashboardPage.ts — extends BasePage
import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class DashboardPage extends BasePage {
  readonly welcomeHeading: Locator;
  readonly navigationMenu: Locator;
  readonly userAvatar: Locator;
  readonly notificationBell: Locator;

  constructor(page: Page) {
    super(page); // Call BasePage constructor
    this.welcomeHeading   = page.getByRole("heading", { name: /welcome/i });
    this.navigationMenu   = page.locator("nav[aria-label='main-nav']");
    this.userAvatar       = page.locator("[data-testid='user-avatar']");
    this.notificationBell = page.locator("[data-testid='notification-bell']");
  }

  async navigate(): Promise<void> {
    await super.navigate("/dashboard"); // Use BasePage's navigate method
  }

  async expectIsLoaded(): Promise<void> {
    await this.expectToBeOnPage(/dashboard/); // BasePage method
    await expect(this.welcomeHeading).toBeVisible();
    await expect(this.navigationMenu).toBeVisible();
  }

  async clickNotifications(): Promise<void> {
    await this.notificationBell.click();
    await expect(
      this.page.locator("[data-testid='notifications-panel']")
    ).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.userAvatar.click();
    await this.page.getByRole("menuitem", { name: /logout/i }).click();
    await this.expectToBeOnPage(/login/); // BasePage method
  }
}
```

---

### 6.4 Composing Page Objects

For complex pages, compose smaller components instead of one giant class.

```typescript
// pages/components/Header.ts — the site header component
export class HeaderComponent {
  constructor(private page: Page) {}

  readonly cartIcon = this.page.locator("[data-testid='cart-icon']");
  readonly cartCount = this.page.locator("[data-testid='cart-count']");
  readonly searchBar = this.page.locator("[data-testid='search-bar']");

  async getCartCount(): Promise<number> {
    const text = await this.cartCount.textContent();
    return parseInt(text || "0");
  }

  async search(query: string): Promise<void> {
    await this.searchBar.fill(query);
    await this.searchBar.press("Enter");
  }
}

// pages/ProductPage.ts — composes the Header component
export class ProductPage extends BasePage {
  readonly header: HeaderComponent;  // ← Composition
  readonly addToCartButton: Locator;
  readonly productTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page); // ← Injected component
    this.addToCartButton = page.locator("[data-testid='add-to-cart']");
    this.productTitle    = page.locator("h1.product-title");
  }

  async addToCart(): Promise<void> {
    const countBefore = await this.header.getCartCount();
    await this.addToCartButton.click();
    // Wait for cart count to increment
    await expect(this.header.cartCount).toHaveText(String(countBefore + 1));
  }
}
```

---

### 6.5 Integrating POM with Fixtures

The cleanest approach combines POM with fixtures — page objects are injected automatically:

```typescript
// fixtures/index.ts
import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ProductPage } from "../pages/ProductPage";

type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  productPage: ProductPage;
  loggedInDashboard: DashboardPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),

  loggedInDashboard: async ({ loginPage, dashboardPage }, use) => {
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL!,
      process.env.TEST_PASSWORD!
    );
    await use(dashboardPage);
  },
});

export { expect } from "@playwright/test";
```

```typescript
// tests/dashboard.test.ts — extremely clean test code
import { test, expect } from "../fixtures";

test("dashboard is accessible after login", async ({ loggedInDashboard }) => {
  await loggedInDashboard.expectIsLoaded();
});

test("user can search from dashboard", async ({ loggedInDashboard }) => {
  await loggedInDashboard.header.search("laptop");
  await expect(loggedInDashboard.page).toHaveURL(/search\?q=laptop/);
});
```

---

### 6.6 POM Project Structure

```
pages/
├── BasePage.ts               ← Abstract base — common methods
├── LoginPage.ts
├── SignupPage.ts
├── DashboardPage.ts
├── checkout/
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   └── ConfirmationPage.ts
├── products/
│   ├── ProductListPage.ts
│   └── ProductDetailPage.ts
└── components/
    ├── HeaderComponent.ts    ← Reusable header across pages
    ├── FooterComponent.ts
    ├── ModalComponent.ts
    └── ToastComponent.ts
```

---

### 6.7 Common POM Mistakes

#### Mistake 1: Making page objects too big
```typescript
// ❌ BAD — one giant class that does everything
class TheEntireAppPage {
  async login() {}
  async addToCart() {}
  async checkout() {}
  async searchProduct() {}
  async updateProfile() {}
  // 50 more methods...
}

// ✅ GOOD — separate classes for separate pages
class LoginPage { async login() {} }
class ProductPage { async addToCart() {} }
class CheckoutPage { async checkout() {} }
```

#### Mistake 2: Adding test assertions inside page objects
```typescript
// ❌ BAD — page object asserts things, couples it to test expectations
class CartPage {
  async addItem(productName: string) {
    await this.page.click(`...`);
    // Don't do this — assertion belongs in the test
    await expect(this.page.locator(".cart-count")).toHaveText("1");
  }
}

// ✅ GOOD — page objects perform actions, tests make assertions
class CartPage {
  async addItem(productName: string): Promise<void> {
    await this.addItemButton.click();
    await this.page.waitForResponse("**/api/cart"); // Wait for API, not assertion
  }
}

// Test file makes the assertion
test("item is added to cart", async ({ cartPage }) => {
  await cartPage.addItem("Laptop");
  await expect(cartPage.cartCount).toHaveText("1"); // Assertion in the test
});
```

---


---
← **Previous:** Part 04 — Configuration `playwright-04-configuration.md`
→ **Next:** Part 06 — Reporters and Debugging `playwright-06-reporters-and-debugging.md`
