# Chapter 502 — Basic Page Objects (L1)

This chapter covers the first working level of a Page Object Model framework —
creating page classes, defining locators as private fields, writing action
methods, and using page objects from test files. Interviewers test Level 1
POM to see whether candidates can implement the pattern correctly from
scratch: proper encapsulation, clean separation of locators from test code,
and the three-section structure (locators, actions, assertions) every page
class must follow.

---

## Q502.1 — What does a Level 1 POM project structure look like?

```
orangehrm-automation/
├── pages/                     ← all page object classes
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── pim/
│   │   ├── EmployeeListPage.ts
│   │   └── AddEmployeePage.ts
│   └── admin/
│       ├── UserManagementPage.ts
│       └── AddUserPage.ts
├── tests/                     ← all test files
│   ├── login.spec.ts
│   ├── pim/
│   │   └── employee.spec.ts
│   └── admin/
│       └── user.spec.ts
├── playwright.config.ts
├── tsconfig.json
└── .gitignore
```

**The one structural rule at Level 1:** if it touches the browser, it
belongs in `pages/`. If it describes a test scenario, it belongs in `tests/`.

Sub-folders inside `pages/` mirror the application's module structure —
`pim/`, `admin/`, `leave/`. This means adding new pages in a module is
an additive operation — no restructuring required as the suite grows.

---

## Q502.2 — What is the internal structure of a page object class?

Every page object in this framework follows a three-section structure:

```typescript
export class LoginPage {

  // ─── Section 1: Locators ─────────────────────────────────
  // All selectors defined here — private readonly
  // Never accessible from test files
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton:   Locator;
  private readonly errorMessage:  Locator;

  // ─── Constructor ─────────────────────────────────────────
  // Initialise all locators once when the page object is created
  constructor(page: Page) {
    this.page          = page;
    this.usernameInput = page.getByPlaceholder('Username')
                             .describe('Username input field');
    // ...
  }

  // ─── Section 2: Actions ──────────────────────────────────
  // Methods representing user actions — named after user intent
  async login(username: string, password: string): Promise<void> { ... }
  async goto(): Promise<void> { ... }

  // ─── Section 3: Assertions ───────────────────────────────
  // Methods verifying page state — reusable across tests
  async assertPageLoaded(): Promise<void> { ... }
  async assertInvalidCredentialsError(): Promise<void> { ... }
}
```

This structure is consistent across every page object in the suite. Any
developer opening any page class immediately knows where to find each kind
of code. Consistency is itself a form of documentation.

---

## Q502.3 — Why are locators declared as private readonly Locator fields?

**`private`** — the selector is an internal implementation detail of the
page class. Test files should never know what selector identifies the
username input. If the selector changes, only `LoginPage.ts` needs updating.
If locators were public, test files could bypass the action methods and
interact with selectors directly — defeating POM entirely.

**`readonly`** — a locator should never be reassigned after construction.
`readonly` is a compile-time guarantee that nobody accidentally writes
`this.loginButton = page.something()` in an action method. It also
communicates intent: this is a stable reference.

**`Locator` type** — typing each field explicitly enables TypeScript
auto-complete and catches type errors at compile time rather than at
runtime.

```typescript
// ✅ Correct — encapsulated, typed, immutable
private readonly loginButton: Locator;

// ❌ Exposes selectors — tests could bypass action methods
public loginButton: Locator;

// ❌ No type — no compile-time checking, no auto-complete
private loginButton: any;
```

---

## Q502.4 — How do you use a page object in a test file?

```typescript
// tests/login.spec.ts
import { test }          from '@playwright/test';
import { LoginPage }     from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Login', () => {

  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.assertPageLoaded();
  });

  test('valid credentials redirect to dashboard @smoke', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await loginPage.login('Admin', 'admin123');
    await dashboardPage.assertPageLoaded();
  });

  test('invalid password shows error @smoke', async () => {
    await loginPage.login('Admin', 'wrongpassword');
    await loginPage.assertInvalidCredentialsError();
  });

});
```

**What this test file does NOT contain:** selectors, `page.fill()`,
`page.click()`, browser navigation URLs, or any knowledge of how login
works internally.

**What it DOES contain:** business scenarios expressed in plain language,
calls to page object methods that read like user actions, and assertions
delegated to the page object.

---

## Q502.5 — Write a complete LoginPage implementation.

```typescript
// pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {

  private readonly page:          Page;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton:   Locator;
  private readonly errorMessage:  Locator;

  constructor(page: Page) {
    this.page          = page;
    this.usernameInput = page.getByPlaceholder('Username')
                             .describe('Username input field');
    this.passwordInput = page.getByPlaceholder('Password')
                             .describe('Password input field');
    this.loginButton   = page.getByRole('button', { name: 'Login' })
                             .describe('Login submit button');
    this.errorMessage  = page.locator('.oxd-alert-content-text')
                             .describe('Login error message');
  }

  // ─── Navigation ──────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/web/index.php/auth/login');
  }

  // ─── Actions ─────────────────────────────────────────────

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  // ─── Assertions ───────────────────────────────────────────

  async assertPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/auth\/login/);
    await expect(this.usernameInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async assertInvalidCredentialsError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText('Invalid credentials');
  }
}
```

---

## Q502.6 — Write a complete AddEmployeePage for OrangeHRM.

```typescript
// pages/pim/AddEmployeePage.ts
import { Page, Locator, expect } from '@playwright/test';

export class AddEmployeePage {

  private readonly page:            Page;
  private readonly pageHeading:     Locator;
  private readonly firstNameInput:  Locator;
  private readonly lastNameInput:   Locator;
  private readonly employeeIdInput: Locator;
  private readonly saveButton:      Locator;
  private readonly successToast:    Locator;

  constructor(page: Page) {
    this.page            = page;
    this.pageHeading     = page.getByRole('heading', { name: 'Add Employee' })
                               .describe('Add employee page heading');
    this.firstNameInput  = page.getByPlaceholder('First Name')
                               .describe('Employee first name input');
    this.lastNameInput   = page.getByPlaceholder('Last Name')
                               .describe('Employee last name input');
    // No unique placeholder — located by position in the form
    this.employeeIdInput = page.locator('input.oxd-input').nth(4)
                               .describe('Employee ID input field');
    this.saveButton      = page.getByRole('button', { name: 'Save' })
                               .describe('Save new employee button');
    this.successToast    = page.locator('.oxd-toast-content')
                               .describe('Success toast notification');
  }

  async goto(): Promise<void> {
    await this.page.goto('/web/index.php/pim/addEmployee');
  }

  async addEmployee(
    firstName: string,
    lastName:  string,
    employeeId: string
  ): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    // OrangeHRM pre-fills a random ID — clear it first
    await this.employeeIdInput.clear();
    await this.employeeIdInput.fill(employeeId);
    await this.saveButton.click();
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/addEmployee/);
    await expect(this.pageHeading).toBeVisible();
    await expect(this.firstNameInput).toBeVisible();
  }

  async assertEmployeeSavedSuccessfully(): Promise<void> {
    await expect(this.successToast).toBeVisible();
  }

  async assertRedirectedToPersonalDetails(): Promise<void> {
    // After saving, OrangeHRM redirects to the employee's personal details tab
    await expect(this.page).toHaveURL(/viewPersonalDetails/);
  }
}
```

---

## Q502.7 — What is the correct way to handle autocomplete dropdowns in a page object?

OrangeHRM uses autocomplete inputs for fields like Employee Name on the
Add User page — the user types a partial name and selects from a dropdown:

```typescript
// pages/admin/AddUserPage.ts
async fillEmployeeName(employeeName: string): Promise<void> {
  // Step 1: type in the autocomplete input to trigger the dropdown
  await this.employeeNameInput.fill(employeeName);

  // Step 2: wait for the autocomplete options to appear, then click the first
  await this.page.locator('.oxd-autocomplete-option').first().click();
}
```

The autocomplete option selector (`.oxd-autocomplete-option`) is not
a locator field on the page object — it is only used in this one method.
When a selector is used in exactly one place, defining it inline in
the method is acceptable. When a selector is used in multiple places,
it must become a named `private readonly` field.

The `await ... .first().click()` pattern handles cases where multiple
options appear — clicking the first match. For production suites,
passing the expected text and matching explicitly is safer:

```typescript
// More precise — clicks only if the option text matches
await this.page.locator('.oxd-autocomplete-option')
  .filter({ hasText: employeeName })
  .click();
```

---

## Q502.8 — What is the business flow the Level 1 OrangeHRM test suite automates?

The Level 1 suite automates a complete HR onboarding workflow:

```
Step 1 — Login as Admin
         ↓
Step 2 — PIM → Add Employee
         Creates Alice Johnson with Employee ID EMP-L1-001
         ↓
Step 3 — Verify employee appears in Employee List
         ↓
Step 4 — Admin → Add User
         Creates login credentials linked to Alice Johnson
         ↓
Step 5 — Verify user appears in User Management list
         ↓
Step 6 — Login as the new ESS user (Alice Johnson)
         Validates the full end-to-end flow
```

This is a real business workflow — not isolated UI interactions. A System
User in OrangeHRM must be linked to an existing Employee. The employee
must be created before the user. The tests must run in order: employee
tests before user tests before login validation.

This ordering dependency is a deliberate limitation at Level 1 — it
represents the pain point that Level 4 (test independence) and Level 6
(API state setup) fix. Understanding what the current level does not solve
is as important as knowing what it does.

---

## Q502.9 — What is the difference between an action method and an assertion method?

**Action methods** — perform an operation, change page state, navigate.
Named with verbs that describe user intent:
`login()`, `addEmployee()`, `clickSaveButton()`, `searchByName()`.

**Assertion methods** — verify expected state without changing it.
Named with `assert` prefix, always return `Promise<void>`:
`assertPageLoaded()`, `assertEmployeeSavedSuccessfully()`, `assertInvalidCredentialsError()`.

```typescript
// Action — changes page state
async login(username: string, password: string): Promise<void> {
  await this.usernameInput.fill(username);
  await this.passwordInput.fill(password);
  await this.loginButton.click();
  // After this call, the page state has changed
}

// Assertion — verifies without changing
async assertInvalidCredentialsError(): Promise<void> {
  await expect(this.errorMessage).toBeVisible();
  await expect(this.errorMessage).toHaveText('Invalid credentials');
  // Page state is unchanged after this call
}
```

**Why separate them:** a test should read as "do X, then verify Y".
If actions and assertions are mixed into the same methods, the test
cannot distinguish what it is doing from what it is checking. Separation
also makes reuse cleaner — the same assertion can follow different
sequences of actions without coupling.

---

## Q502.10 — What is the difference between goto() and navigate() patterns?

At Level 1, `goto()` is a public method that directly calls `this.page.goto()`:

```typescript
// Level 1 pattern
async goto(): Promise<void> {
  await this.page.goto('/web/index.php/pim/viewEmployeeList');
}
```

At Level 2 (BasePage), page objects use `this.navigate()` from BasePage:

```typescript
// Level 2 pattern — inherited from BasePage
async goto(): Promise<void> {
  await this.navigate('/web/index.php/pim/viewEmployeeList');
  // navigate() also calls waitForLoadState('networkidle') automatically
}
```

The Level 1 pattern is simpler but has a subtle issue: `page.goto()` alone
does not guarantee the page has fully rendered. Without `waitForLoadState`,
the next action might fire before the page is ready. The Level 2 pattern
wraps both in `navigate()` so every `goto()` call across all page objects
waits consistently.

---

## Q502.11 — When should a page object have multiple goto() overloads?

When a page can be reached at different URLs depending on context:

```typescript
// PersonalDetailsPage can navigate to any employee's details
async goto(employeeId: string): Promise<void> {
  await this.page.goto(
    `/web/index.php/pim/viewPersonalDetails/empNumber/${employeeId}`
  );
}

// Usage in test
const personalDetailsPage = new PersonalDetailsPage(page);
await personalDetailsPage.goto('12345');  // navigate to employee 12345
```

Contrast with `LoginPage.goto()` which takes no arguments — there is only
one login page URL.

The parameter-taking `goto()` pattern is the right approach when:
- The page represents a resource that has an ID in the URL
- Tests need to navigate directly to a specific record
- The ID is known from a previous step (e.g., the employee ID returned
  after creating an employee)

---

## Q502.12 — How do you handle OrangeHRM's custom select dropdowns?

OrangeHRM uses custom dropdown components — not native HTML `<select>` —
which require a click to open, then a click to select an option:

```typescript
// pages/admin/AddUserPage.ts
private readonly userRoleDropdown: Locator;

// In constructor
this.userRoleDropdown = page.locator('.oxd-select-text').first()
                            .describe('User role dropdown');

// Action method
async selectUserRole(role: 'Admin' | 'ESS'): Promise<void> {
  await this.userRoleDropdown.click();                          // open the dropdown
  await this.page.getByRole('option', { name: role }).click();  // select the option
}
```

Using a TypeScript union type (`'Admin' | 'ESS'`) on the parameter has
two benefits:
1. TypeScript prevents passing an invalid role value at compile time
2. IDEs show auto-complete with the valid options when calling the method

```typescript
await addUserPage.selectUserRole('Admin');   // ✅ valid
await addUserPage.selectUserRole('Manager'); // ❌ TypeScript error at compile time
```

This pattern — typed string union parameters for dropdown methods — is
standard throughout this framework for any dropdown with a known, fixed
set of options.

---

## Q502.13 — What is the test data strategy at Level 1?

At Level 1, test data is hardcoded in test files as typed object literals:

```typescript
// tests/pim/employee.spec.ts
const newEmployee = {
  firstName:  'Alice',
  lastName:   'Johnson',
  employeeId: 'EMP-L1-001',
  fullName:   'Alice Johnson',
};

// Tests reference the object properties
await addEmployeePage.addEmployee(
  newEmployee.firstName,
  newEmployee.lastName,
  newEmployee.employeeId
);
```

This is a known limitation — not an oversight. Level 1 is intentionally
simple. The hardcoded data has two problems that Level 5 fixes:

**Problem 1 — Not unique per run.** If the test creates employee
`EMP-L1-001` and the cleanup fails, the next run fails because the ID
already exists. Level 5 generates unique IDs with a timestamp or Faker.

**Problem 2 — Spread across files.** When the same employee is referenced
in multiple test files (employee tests AND user tests), the name is
duplicated. Level 5 centralises data in factory functions shared across
all test files.

At Level 1, using a typed object literal (rather than inline strings) is
the best available approach — it keeps the data in one place per file
and enables TypeScript checking on property names.

---

## Q502.14 — Write a test for the Add Employee flow using page objects.

```typescript
// tests/pim/employee.spec.ts
import { test }              from '@playwright/test';
import { LoginPage }         from '../../pages/LoginPage';
import { DashboardPage }     from '../../pages/DashboardPage';
import { EmployeeListPage }  from '../../pages/pim/EmployeeListPage';
import { AddEmployeePage }   from '../../pages/pim/AddEmployeePage';

const admin = { username: 'Admin', password: 'admin123' };

const newEmployee = {
  firstName:  'Alice',
  lastName:   'Johnson',
  employeeId: 'EMP-L1-001',
};

test.describe('PIM — Employee Management', () => {

  let loginPage:        LoginPage;
  let dashboardPage:    DashboardPage;
  let employeeListPage: EmployeeListPage;

  test.beforeEach(async ({ page }) => {
    loginPage        = new LoginPage(page);
    dashboardPage    = new DashboardPage(page);
    employeeListPage = new EmployeeListPage(page);

    await loginPage.goto();
    await loginPage.login(admin.username, admin.password);
    await dashboardPage.assertPageLoaded();
    await dashboardPage.navigateToPIM();
    await employeeListPage.assertPageLoaded();
  });

  test('admin can add a new employee @smoke', async ({ page }) => {
    const addEmployeePage = new AddEmployeePage(page);

    await employeeListPage.clickAddEmployee();
    await addEmployeePage.assertPageLoaded();

    await addEmployeePage.addEmployee(
      newEmployee.firstName,
      newEmployee.lastName,
      newEmployee.employeeId
    );

    await addEmployeePage.assertEmployeeSavedSuccessfully();
    await addEmployeePage.assertRedirectedToPersonalDetails();
  });

  test('new employee appears in the employee list @smoke', async () => {
    await employeeListPage.searchByEmployeeName(`${newEmployee.firstName} ${newEmployee.lastName}`);
    await employeeListPage.assertEmployeeExistsInList(`${newEmployee.firstName} ${newEmployee.lastName}`);
  });

  test('search with non-existent name shows no records', async () => {
    await employeeListPage.searchByEmployeeName('ZZZNONEXISTENT');
    await employeeListPage.assertNoRecordsFound();
  });

});
```

---

## Q502.15 — What does the Level 1 playwright.config.ts look like?

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,        // OrangeHRM demo is shared — sequential to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html'], ['list']],
  use: {
    baseURL:    'https://opensource-demo.orangehrmlive.com',
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
    video:      'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

**`fullyParallel: false`** — the OrangeHRM demo is a shared public server.
Parallel tests create and delete data simultaneously, causing race conditions.
Sequential runs at Level 1 prevent this. Level 4 (test independence) and
Level 6 (unique data per run) eventually make parallel execution safe.

**`baseURL`** — set once here. Every `page.goto('/web/index.php/auth/login')`
in a page object resolves to the full URL automatically. No hardcoded base
URLs in page objects or tests.

---

## Q502.16 — How do you handle the tsconfig.json for path aliases?

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": {
      "@pages/*": ["pages/*"],
      "@tests/*": ["tests/*"]
    }
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

Path aliases (`@pages/*`, `@tests/*`) replace relative import paths:

```typescript
// Without aliases — fragile relative paths
import { LoginPage } from '../../../pages/LoginPage';

// With aliases — clear, refactoring-safe
import { LoginPage } from '@pages/LoginPage';
```

`strict: true` is non-negotiable for a professional framework. It enables:
- Null checks — catches unhandled undefined at compile time
- Strict function types — prevents type mismatches in callbacks
- Property initialisation checks — ensures all class fields are set

These catch the same class of bugs that cause cryptic runtime failures in
test suites.

---

## Q502.17 — What are the limitations the developer notices at Level 1?

By the end of Level 1, three patterns repeat visibly:

**Pattern 1 — Constructor boilerplate in every page class:**
```typescript
// Repeated in every single page object
private readonly page: Page;
constructor(page: Page) {
  this.page = page;
}
```
Six page objects means six copies. Level 2 (BasePage) fixes this.

**Pattern 2 — Login repeated in every test file's beforeEach:**
```typescript
// Every authenticated test file starts with this
await loginPage.goto();
await loginPage.login('Admin', 'admin123');
await dashboardPage.assertPageLoaded();
```
Level 3 (Fixtures) injects pre-authenticated sessions directly into tests.

**Pattern 3 — Tests ordered by dependency:**
```bash
# Must run in this order — user test depends on employee existing
npx playwright test tests/pim/employee.spec.ts
npx playwright test tests/admin/user.spec.ts
npx playwright test tests/login.spec.ts
```
Level 4 (Test Independence) and Level 6 (API state setup) eliminate
cross-test dependencies so every test can run in isolation and in any order.

These are not design flaws to apologise for — they are the motivating
problems that each subsequent level deliberately addresses. Recognising them
is the sign that the developer is ready for Level 2.

---

## Q502.18 — How does Level 1 POM compare to testing without POM?

Concretely, for the OrangeHRM login test:

**Without POM — selectors scattered in test file:**
```typescript
test('valid login', async ({ page }) => {
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/dashboard/);
});
```

When OrangeHRM changes the button from `role=button` with name `Login`
to a custom component — or adds a CAPTCHA — every test file that logs
in needs updating. That is a search-and-replace across the entire suite.

**With POM — selectors in LoginPage.ts:**
```typescript
test('valid login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('Admin', 'admin123');
  await expect(page).toHaveURL(/dashboard/);
});
```

When the login button changes — one fix in `LoginPage.ts`. Every test
that calls `loginPage.login()` is instantly correct. The test file itself
is unchanged.

In the OrangeHRM project, the demo application updated its dropdown
components across multiple forms over the course of the project. Each
update required exactly one change per page object — never touching a
test file. Without POM, the same changes would have required hunting
down every affected test.

---

## Chapter Summary

- Level 1 POM: one TypeScript class per page, with three sections — locators (private readonly), actions, assertions.
- Locators as `private readonly Locator` fields — enforces encapsulation; test files never see selectors.
- `.describe()` on every locator — labels appear in failure messages; most valuable on positional locators.
- Constructor initialises all locators once; Playwright locators are lazy so this is safe.
- `goto()` as a separate method — tests control navigation timing independently from the action that follows.
- Action methods named after user intent, not browser operations: `login()` not `fillAndClickLogin()`.
- Assertion methods prefixed with `assert`, always return `Promise<void>`, never change page state.
- TypeScript union types for dropdown parameters (`'Admin' | 'ESS'`) — compile-time validation of valid values.
- Test data as typed object literals at Level 1; centralised to factories at Level 5.
- `fullyParallel: false` for shared demo environment; `baseURL` in config so page objects use relative paths.
- Level 1 deliberately leaves boilerplate (Level 2), repeated login (Level 3), and test ordering (Level 4+) for later.
