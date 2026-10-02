# Chapter 503 — BasePage & Inheritance (L2)

This chapter covers BasePage — the parent class every page object extends
at Level 2 to eliminate constructor boilerplate, centralise navigation
logic, and provide shared utility methods. Interviewers test inheritance
patterns to assess whether candidates understand the TypeScript keywords
`extends`, `super`, and `protected` in a real framework context, not just
in theory. A candidate who can explain why `protected` is required for the
`page` property — and what breaks if `private` is used instead — is
demonstrating genuine understanding.

---

## Q503.1 — What problem does BasePage solve?

Every page object at Level 1 starts with identical boilerplate:

```typescript
// Repeated in LoginPage, EmployeeListPage, UserManagementPage — every class
private readonly page: Page;

constructor(page: Page) {
  this.page = page;
}
```

With six page objects this is manageable. With twenty pages across PIM,
Admin, Leave, and Recruitment modules, you have twenty copies of the same
code. Every new page object written adds another copy. This violates DRY —
the principle that every piece of knowledge should exist in exactly one place.

BasePage fixes this. The `page` property and the constructor that sets it
are declared once in `BasePage`. Every page object `extends BasePage` and
calls `super(page)` — one line instead of three. The framework also gains
shared navigation, wait, and assertion utilities that every page object
inherits automatically.

---

## Q503.2 — What does the complete BasePage.ts look like?

```typescript
// pages/BasePage.ts
import { Page, expect } from '@playwright/test';

export class BasePage {

  // protected — child classes can access this.page directly
  // private would make this.page inaccessible in LoginPage, EmployeeListPage, etc.
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ─── Navigation ──────────────────────────────────────────

  // protected — only page objects call this internally via their goto() methods
  // tests call loginPage.goto(), not loginPage.navigate()
  protected async navigate(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  // public — tests may need to wait explicitly after a slow action
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForURL(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern);
  }

  // ─── Common Assertions ────────────────────────────────────

  async assertURL(urlPattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(urlPattern);
  }

  async assertPageTitle(expectedTitle: string): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  // ─── Common Utilities ─────────────────────────────────────

  async getCurrentURL(): Promise<string> {
    return this.page.url();
  }

  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
  }

  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  async reloadPage(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }
}
```

---

## Q503.3 — What are extends, super, and protected — and what breaks without them?

**`extends`** — declares the inheritance relationship. `LoginPage extends BasePage`
means LoginPage inherits every property and method BasePage declares.

```typescript
export class LoginPage extends BasePage { ... }
// LoginPage now has: this.page, navigate(), waitForPageLoad(), assertURL(), etc.
```

**`super(page)`** — calls the parent constructor. It must be the first
statement in the child constructor. The parent constructor is what sets
`this.page`. Without `super()`, TypeScript emits a compile error:
`"Constructors for derived classes must contain a 'super' call."`

```typescript
constructor(page: Page) {
  super(page);  // ← first line always; sets this.page via BasePage constructor
  this.usernameInput = this.page.getByPlaceholder('Username'); // this.page is now set
}
```

**`protected`** — the access modifier on `page` in BasePage. Its meaning:
accessible by BasePage itself AND by all classes that extend it.

```typescript
// If private: only BasePage can use this.page
// LoginPage trying to use this.page → compile error
private readonly page: Page;   // ❌ breaks all child classes

// If protected: BasePage and all extending classes can use this.page
protected readonly page: Page; // ✅ correct
```

The distinction matters every time a child class locator uses `this.page`:
```typescript
// In LoginPage constructor — requires protected, not private
this.usernameInput = this.page.getByPlaceholder('Username');
//                   ↑ accessing parent's property — only works with protected
```

---

## Q503.4 — How does LoginPage look after refactoring to extend BasePage?

```typescript
// pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage }              from './BasePage';   // ← import parent class

export class LoginPage extends BasePage {             // ← extends BasePage

  // No page property declared here — inherited from BasePage as this.page

  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton:   Locator;
  private readonly errorMessage:  Locator;

  constructor(page: Page) {
    super(page);   // ← replaces this.page = page — calls BasePage constructor

    this.usernameInput = this.page.getByPlaceholder('Username')
                                  .describe('Username input field');
    this.passwordInput = this.page.getByPlaceholder('Password')
                                  .describe('Password input field');
    this.loginButton   = this.page.getByRole('button', { name: 'Login' })
                                  .describe('Login submit button');
    this.errorMessage  = this.page.locator('.oxd-alert-content-text')
                                  .describe('Login error message');
  }

  async goto(): Promise<void> {
    await this.navigate('/web/index.php/auth/login');  // ← inherited from BasePage
    // navigate() also waits for networkidle — no separate waitForLoadState needed
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async assertPageLoaded(): Promise<void> {
    await this.assertURL(/auth\/login/);   // ← inherited from BasePage
    await expect(this.usernameInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async assertInvalidCredentialsError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText('Invalid credentials');
  }
}
```

**What changed from Level 1:**
- `private readonly page: Page` removed — inherited from BasePage
- `this.page = page` replaced with `super(page)`
- `this.page.goto(path)` replaced with `this.navigate(path)`
- `expect(this.page).toHaveURL(...)` replaced with `this.assertURL(...)`

---

## Q503.5 — Why is navigate() protected instead of public?

`navigate()` is an internal implementation mechanism used by page objects
inside their `goto()` methods. It should never be called from test files
directly.

```typescript
// ❌ Test calling navigate() directly — bypasses goto() API contract
await loginPage.navigate('/web/index.php/auth/login');

// ✅ Test calling goto() — the intended public API
await loginPage.goto();
```

Making `navigate()` `protected` enforces this boundary at compile time.
Test files get a TypeScript error if they try to call `loginPage.navigate()`.
The only path to navigation is through the page object's public `goto()` method.

This is the principle of encapsulation applied to methods, not just
properties. The how is hidden; the what is exposed.

---

## Q503.6 — What is the difference between private, protected, and public in TypeScript classes?

```typescript
class BasePage {
  private readonly page: Page;      // only BasePage can access this.page
  protected readonly ctx: Page;     // BasePage AND child classes can access this.ctx
  public readonly url: string;      // everything can access this.url (not recommended for locators)
}

class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
    // this.page  → ❌ TypeScript error — private, only BasePage can access it
    // this.ctx   → ✅ works — protected, accessible in child classes
    // this.url   → ✅ works — public, accessible everywhere
  }
}
```

**For page objects in this framework:**
- `page` property → `protected readonly` — child classes need it
- All `Locator` fields → `private readonly` — internal to each class
- All action and assertion methods → `public` (default) — test files call them
- `navigate()` → `protected` — internal to page objects only

---

## Q503.7 — Why does waitForLoadState('networkidle') belong in BasePage?

Without `waitForLoadState`, `page.goto()` resolves as soon as the initial
HTML document is received — not when dynamic data (tables, charts, employee
lists) has finished loading. Tests that fire immediately after navigation
can fail with "element not found" because the data is still loading.

By putting the wait inside `navigate()` in BasePage, every `goto()` call
in every page object automatically waits for the page to fully settle:

```typescript
// BasePage — networkidle wait is automatic for all page objects
protected async navigate(path: string): Promise<void> {
  await this.page.goto(path);
  await this.page.waitForLoadState('networkidle');  // ← wait for all requests to finish
}
```

Without BasePage, each `goto()` in every page object must remember to add
the wait separately. Some will forget it. Some will add a different wait.
The inconsistency causes intermittent failures.

BasePage centralises the decision once — every page object benefits without
thinking about it.

---

## Q503.8 — What does a new page object look like at Level 2 vs Level 1?

Writing a new page object at Level 2 requires less code and has no
boilerplate:

**Level 1 — new page object:**
```typescript
export class PersonalDetailsPage {
  private readonly page: Page;          // boilerplate
  // ... locators

  constructor(page: Page) {
    this.page = page;                   // boilerplate
    // ... initialise locators
  }

  async goto(employeeId: string): Promise<void> {
    await this.page.goto(               // direct call
      `/web/index.php/pim/viewPersonalDetails/empNumber/${employeeId}`
    );
    await this.page.waitForLoadState('networkidle');  // must remember to add
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/viewPersonalDetails/);  // repeated pattern
  }
}
```

**Level 2 — same page object with BasePage:**
```typescript
export class PersonalDetailsPage extends BasePage {
  // no page property
  // no boilerplate constructor setup

  constructor(page: Page) {
    super(page);  // ← one line — done
    // ... initialise locators using this.page
  }

  async goto(employeeId: string): Promise<void> {
    await this.navigate(               // inherited — goto + wait in one call
      `/web/index.php/pim/viewPersonalDetails/empNumber/${employeeId}`
    );
  }

  async assertPageLoaded(): Promise<void> {
    await this.assertURL(/viewPersonalDetails/);  // inherited, no repetition
    await expect(this.firstNameInput).toBeVisible();
  }
}
```

The Level 2 class is shorter, contains no repeated patterns, and gains
`waitForPageLoad()`, `scrollToBottom()`, `reloadPage()` and all other
BasePage utilities without any extra code.

---

## Q503.9 — What happens to test files when you add BasePage?

**Nothing.** Test files at Level 2 are identical to Level 1.

BasePage is an internal refactoring of the page object layer. Tests only
interact with page objects through their public API — `goto()`, `login()`,
`assertPageLoaded()`. Whether `goto()` internally calls `this.page.goto()`
directly or `this.navigate()` from BasePage is invisible to the test.

```typescript
// This test is IDENTICAL at Level 1 and Level 2
test('admin can add a new employee', async ({ page }) => {
  const loginPage    = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.goto();              // calls navigate() internally at Level 2
  await loginPage.login('Admin', 'admin123');
  await dashboardPage.assertPageLoaded(); // calls assertURL() internally at Level 2
});
```

This is the principle of abstraction at the framework level. The test
describes what to test. The page objects handle how. When the how changes
(BasePage refactoring), the what is completely unaffected.

After refactoring to Level 2, run the full suite to verify:
```bash
npx playwright test --workers=1
```
Every test that passed at Level 1 should pass at Level 2. If anything
fails, the most likely cause is a broken import path — sub-folder page
objects must import `from '../BasePage'` not `from './BasePage'`.

---

## Q503.10 — What is the difference between extends and composition in POM?

**Inheritance (extends)** — the pattern used in this framework:
```typescript
export class LoginPage extends BasePage {
  // LoginPage IS-A BasePage — inherits all BasePage members
}
```

**Composition** — an alternative where BasePage is stored as a property:
```typescript
export class LoginPage {
  private readonly basePage: BasePage; // LoginPage HAS-A BasePage
  constructor(page: Page) {
    this.basePage = new BasePage(page);
  }
  async goto(): Promise<void> {
    await this.basePage.navigate('/...'); // must delegate explicitly
  }
}
```

**Why this framework uses inheritance:**
- Navigation, assertions, and utilities are genuinely shared behaviour
  that all page objects have — not optional composition
- Inheritance makes `this.navigate()` and `this.assertURL()` available
  directly, without delegation syntax
- TypeScript's access modifiers (`protected`, `private`) work cleanly
  with inheritance for enforcing the `navigate()` boundary

**When composition is preferred in general OOP:** when the relationship
is "uses" not "is a" — and when you need multiple parents (TypeScript
classes can only extend one parent). For page object frameworks, the
IS-A relationship (every page IS-A BasePage) makes inheritance the
cleaner choice.

---

## Q503.11 — How do you handle a page that needs both BasePage utilities and module-specific utilities?

Add a module-level base page that extends BasePage:

```typescript
// pages/pim/BasePIMPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage }      from '../BasePage';

export class BasePIMPage extends BasePage {
  // PIM-specific locators shared across PIM pages
  private readonly pimBreadcrumb: Locator;

  constructor(page: Page) {
    super(page);
    this.pimBreadcrumb = this.page.locator('.oxd-topbar-header-breadcrumb')
                                   .describe('PIM module breadcrumb');
  }

  // PIM-specific shared method used by all PIM pages
  async assertPIMModuleLoaded(): Promise<void> {
    await expect(this.pimBreadcrumb).toBeVisible();
  }
}

// pages/pim/EmployeeListPage.ts
export class EmployeeListPage extends BasePIMPage {
  // EmployeeListPage inherits from BasePIMPage which inherits from BasePage
  // Has access to: BasePage utilities, PIM-specific utilities, its own methods
}
```

This creates a three-level hierarchy:
`BasePage` → `BasePIMPage` → `EmployeeListPage`

Use module-level base pages only when there are genuinely shared
elements across all pages in a module — navigation breadcrumbs, module
headers, or module-level menus. If there are only one or two shared items,
adding to the main BasePage or keeping them per-page is simpler.

---

## Q503.12 — What is the refactoring checklist for converting Level 1 page objects to Level 2?

For each page object, exactly five changes:

```typescript
// Before (Level 1)                    // After (Level 2)
────────────────────────────────────────────────────────
// 1. Add import for BasePage
import { Page, Locator, expect }   →   import { Page, Locator, expect }
from '@playwright/test';               from '@playwright/test';
                                        import { BasePage } from '../BasePage';
                                        // (or '../../BasePage' for sub-folders)

// 2. Extend BasePage
export class LoginPage {           →   export class LoginPage extends BasePage {

// 3. Remove page property
private readonly page: Page;       →   (removed entirely)

// 4. Replace constructor body
constructor(page: Page) {          →   constructor(page: Page) {
  this.page = page;                →     super(page);
  // locators...                         // locators...
}                                        }

// 5a. Replace goto() body
await this.page.goto(path);        →   await this.navigate(path);

// 5b. Replace URL assertions
await expect(this.page)            →   await this.assertURL(pattern);
  .toHaveURL(pattern);
```

**Verify after each file:** run `npx playwright test --workers=1` after
refactoring each page object. Catching an import error immediately is
faster than debugging multiple broken imports at the end.

---

## Q503.13 — How does BasePage handle the baseURL from playwright.config.ts?

BasePage does NOT store or manage `baseURL`. Playwright handles this
automatically — when `page.goto('/web/index.php/auth/login')` is called,
Playwright prepends the `baseURL` from `playwright.config.ts`.

```typescript
// playwright.config.ts
use: {
  baseURL: 'https://opensource-demo.orangehrmlive.com',
}

// pages/BasePage.ts
protected async navigate(path: string): Promise<void> {
  await this.page.goto(path);  // Playwright prepends baseURL automatically
  // page.goto('/web/index.php/auth/login') becomes:
  // page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login')
}
```

This means page objects always use paths (`/web/index.php/...`), never
full URLs. Changing environments (staging, production, local) requires
changing one value in `playwright.config.ts`. No changes to page objects.

If BasePage stored baseURL itself, a second source of truth would exist.
When environments change, both `playwright.config.ts` and BasePage would
need updating — increasing the chance of inconsistency.

---

## Q503.14 — Write a PersonalDetailsPage using BasePage.

```typescript
// pages/pim/PersonalDetailsPage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage }              from '../BasePage';

export class PersonalDetailsPage extends BasePage {

  private readonly firstNameInput:  Locator;
  private readonly lastNameInput:   Locator;
  private readonly employeeIdInput: Locator;
  private readonly saveButton:      Locator;
  private readonly successToast:    Locator;

  constructor(page: Page) {
    super(page);   // single line of boilerplate — BasePage handles the rest

    this.firstNameInput  = this.page.getByPlaceholder('First Name')
                                    .describe('First name input field');
    this.lastNameInput   = this.page.getByPlaceholder('Last Name')
                                    .describe('Last name input field');
    this.employeeIdInput = this.page.locator('input.oxd-input').nth(1)
                                    .describe('Employee ID input field');
    this.saveButton      = this.page.getByRole('button', { name: 'Save' }).first()
                                    .describe('Save personal details button');
    this.successToast    = this.page.locator('.oxd-toast-content')
                                    .describe('Success toast notification');
  }

  async goto(employeeId: string): Promise<void> {
    await this.navigate(
      `/web/index.php/pim/viewPersonalDetails/empNumber/${employeeId}`
    );
  }

  async updateFirstName(firstName: string): Promise<void> {
    await this.firstNameInput.clear();
    await this.firstNameInput.fill(firstName);
  }

  async savePersonalDetails(): Promise<void> {
    await this.saveButton.click();
  }

  async assertPageLoaded(): Promise<void> {
    await this.assertURL(/viewPersonalDetails/);     // inherited from BasePage
    await expect(this.firstNameInput).toBeVisible();
  }

  async assertPersonalDetailsSaved(): Promise<void> {
    await expect(this.successToast).toBeVisible();
  }

  async assertFirstName(expectedFirstName: string): Promise<void> {
    await expect(this.firstNameInput).toHaveValue(expectedFirstName);
  }
}
```

---

## Q503.15 — How does scrollToBottom() from BasePage get used in practice?

```typescript
// BasePage provides scroll utilities
async scrollToBottom(): Promise<void> {
  await this.page.evaluate(() =>
    window.scrollTo(0, document.body.scrollHeight)
  );
}

// EmployeeListPage can call this when the table has more rows below the fold
async loadAllEmployees(): Promise<void> {
  // scroll to trigger lazy-loading of additional rows
  await this.scrollToBottom();
  await this.waitForPageLoad();
}

// In a test that checks total employee count
test('employee list shows all records', async ({ page }) => {
  const employeeListPage = new EmployeeListPage(page);
  await employeeListPage.goto();
  await employeeListPage.loadAllEmployees();  // scrolls to load all rows
  await expect(page.locator('.oxd-table-row')).toHaveCount(50);
});
```

BasePage utilities like `scrollToBottom()`, `reloadPage()`, and
`getCurrentURL()` are used less frequently than navigation and assertions —
but when they are needed, they are available to every page object without
any extra code. The value of BasePage compounds with every page object
added to the framework.

---

## Q503.16 — What is the Level 2 project structure?

One file added. Everything else stays the same:

```
pages/
  BasePage.ts                 ← NEW — parent for all page objects
  LoginPage.ts                ← refactored: extends BasePage
  DashboardPage.ts            ← refactored: extends BasePage
  pim/
    EmployeeListPage.ts       ← refactored: extends BasePage, import '../BasePage'
    AddEmployeePage.ts        ← refactored: extends BasePage, import '../BasePage'
    PersonalDetailsPage.ts    ← NEW — written from scratch using BasePage
  admin/
    UserManagementPage.ts     ← refactored: extends BasePage, import '../BasePage'
    AddUserPage.ts            ← refactored: extends BasePage, import '../BasePage'

tests/                        ← NO CHANGES at Level 2
playwright.config.ts          ← NO CHANGES at Level 2
```

The import path for sub-folder page objects is `'../BasePage'` (one level
up), not `'./BasePage'` (same folder). This is the most common mistake
when refactoring Level 1 to Level 2.

---

## Q503.17 — What does Level 2 not solve?

Level 2 eliminates boilerplate inside page objects. It does nothing about:

**Login still repeated in every test file's `beforeEach`:**
```typescript
// Still present in every test file
test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('Admin', 'admin123');
  await dashboardPage.assertPageLoaded();
});
```
Level 3 (Fixtures) gives authenticated sessions directly to tests.

**Hardcoded test data:**
Employee names and credentials are still string literals in test files.
Level 5 (Test Data) introduces factory functions.

**Cross-test ordering dependencies:**
The admin user tests still depend on the employee tests having run first.
Level 4 (Test Independence) and Level 6 (API setup) break these chains.

---

## Q503.18 — How did you introduce BasePage in the OrangeHRM project?

We introduced BasePage at Level 2 as a refactoring — no test behaviour
changed, only the internal structure of page objects.

The team was adding a new module (Leave). Writing the first Leave page
object — `ApplyLeavePage.ts` — without BasePage meant copy-pasting the
`private readonly page` declaration, the constructor body, and a
`waitForLoadState` call for the fourth time. At that point the DRY
violation was impossible to ignore.

The refactoring plan: create `BasePage.ts`, refactor one page object as
a proof of concept, verify the tests still pass, then refactor the rest.
The full refactoring took about 90 minutes across six page objects.

**The unexpected benefit beyond DRY:** BasePage's `navigate()` method
included `waitForLoadState('networkidle')`. Before BasePage, three of the
six `goto()` methods were missing the `waitForLoadState` call — we had
not noticed because those tests ran fast enough that the timing rarely
mattered. BasePage made the wait universal. Two intermittent failures
we had attributed to flakiness disappeared.

This is the pattern: structural improvements often fix bugs that were
invisible because their impact was subtle and intermittent. BasePage
did not just reduce boilerplate — it made navigation behaviour consistent
across every page object in the framework.

---

## Chapter Summary

- BasePage is a parent class every page object extends to eliminate `page` property and constructor boilerplate.
- `protected readonly page: Page` — accessible in BasePage and all child classes; `private` would prevent child classes from using `this.page`.
- `extends BasePage` — declares inheritance; child class gets all BasePage properties and methods.
- `super(page)` — must be the first line of the child constructor; calls BasePage constructor which sets `this.page`.
- `navigate()` is `protected` — child page objects use it internally; test files cannot call it directly.
- BasePage's `navigate()` combines `page.goto()` + `waitForLoadState('networkidle')` — ensures every goto() waits for the page to settle.
- `assertURL()` and `assertPageTitle()` are shared assertions; `scrollToBottom()`, `reloadPage()`, `getCurrentURL()` are shared utilities.
- Test files are identical at Level 1 and Level 2 — BasePage is an internal refactoring invisible to tests.
- Sub-folder page objects import BasePage with `'../BasePage'` (one level up), not `'./BasePage'`.
- BasePage does NOT store `baseURL` — Playwright handles that from config automatically.
- After refactoring each page object, run the suite to catch import path errors immediately.
- Level 2 solves boilerplate; it deliberately leaves repeated login (Level 3), hardcoded data (Level 5), and test ordering (Level 4+) for subsequent levels.
