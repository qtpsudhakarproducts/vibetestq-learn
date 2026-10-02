# Chapter 501 — POM Theory & Design Principles (L0)

This chapter covers the Page Object Model design pattern — what it is, why
it was created, the four software principles it applies, and how it solves
the maintenance problem at enterprise scale. Interviewers test POM theory
to assess design thinking: a candidate who can explain DRY, separation of
concerns, and the single responsibility principle — and connect each to a
real POM decision — is showing senior-level reasoning, not just pattern
memorisation.

---

## Q501.1 — What is Page Object Model?

Page Object Model (POM) is a design pattern for test automation where each
page of the application is represented as a class. That class is the single
source of truth for everything about that page: its locators, its actions,
and its assertions.

Tests do not interact with the browser directly — they call methods on page
objects. The page object handles the browser details internally.

```typescript
// Without POM — test knows selectors, mixes concerns
test('login works', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/dashboard/);
});

// With POM — test knows only the business intent
test('login works', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('Admin', 'admin123');
  await expect(page).toHaveURL(/dashboard/);
});
```

When the login button selector changes, the POM version needs one fix in
`LoginPage.ts`. The non-POM version needs fixing in every test file that
logs in.

---

## Q501.2 — Who introduced POM and why?

Page Object Model was introduced and popularised by Simon Stewart, one of
the creators of Selenium WebDriver. He observed a fundamental structural
problem in early test automation: the same UI elements and interactions
were being written directly into test cases, scattered across many files
and duplicated constantly.

When the application changed — a button moved, a form field was renamed,
a URL changed — all those scattered references broke. Maintaining tests
took more effort than writing them.

The solution: model each page as a class. That class becomes the single
point of truth for all interaction with that page. Tests become orchestrators
that describe business scenarios. The mechanics of interacting with the
browser become encapsulated in page objects.

The pattern applies to Playwright exactly as it did to Selenium. The
tool changes; the structural problem and its solution do not.

---

## Q501.3 — What are the three responsibilities of a page object?

Every page object in a well-structured POM framework has exactly three
responsibilities:

**1. Locators** — every UI element the tests need, defined once. The test
files never see selectors. If a selector changes, one edit in the page
object updates every test that uses it.

**2. Actions** — methods representing what a user can do on the page.
`login()`, `addEmployee()`, `selectLeaveType()`. Each action is one method.
Tests call the method without knowing how it works internally.

**3. Assertions** — methods verifying expected page state. `assertPageLoaded()`,
`assertEmployeeSavedSuccessfully()`, `assertInvalidCredentialsError()`.
Assertions in page objects are reusable across multiple tests.

```typescript
export class LoginPage {
  // Locators — defined once, never in test files
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton:   Locator;
  private readonly errorMessage:  Locator;

  // Actions — what the user can do
  async login(username: string, password: string): Promise<void> { ... }

  // Assertions — verifying page state
  async assertInvalidCredentialsError(): Promise<void> { ... }
  async assertPageLoaded(): Promise<void> { ... }
}
```

What a page object is NOT responsible for: test scenarios, test data,
business logic, and knowledge of other pages.

---

## Q501.4 — How did you apply POM in your OrangeHRM project?

In our OrangeHRM project, each module had its own folder under `pages/`:

```
pages/
  LoginPage.ts
  DashboardPage.ts
  pim/
    EmployeeListPage.ts
    AddEmployeePage.ts
  admin/
    UserManagementPage.ts
    AddUserPage.ts
  leave/
    ApplyLeavePage.ts
    LeaveListPage.ts
```

Each page class declared its locators as `private readonly` fields,
defined action methods for every user interaction, and included
`assertPageLoaded()` plus specific assertion methods.

The test files only imported page classes and called their methods.
No selector ever appeared in a test file. This meant when OrangeHRM
updated their UI — they changed the Employee ID input position in the
form — one fix in `AddEmployeePage.ts` corrected all affected tests instantly.
Without POM, the same fix would have required searching for and updating
the selector in every test that added an employee.

---

## Q501.5 — What is separation of concerns in POM?

Separation of concerns means each piece of code has one clearly defined job.

In POM:
- **Page objects** — concern: how to interact with the browser
- **Test files** — concern: what scenarios to test and in what order
- **Fixtures** — concern: preparing the state tests need to start
- **Data factories** — concern: generating test data
- **Helpers** — concern: common UI interaction patterns

When concerns are separated, changing one does not break another.
Changing how you fill a form (page object concern) does not change what
you are testing (test file concern). Changing a test scenario does not
change browser interactions.

```typescript
// Page object concern — HOW
async fillEmployeeForm(firstName: string, lastName: string): Promise<void> {
  await this.firstNameInput.fill(firstName);
  await this.lastNameInput.fill(lastName);
  await this.saveButton.click();
}

// Test file concern — WHAT
test('PIM admin can create an employee record @smoke', async ({ pimPage }) => {
  await pimPage.goto();
  await pimPage.fillEmployeeForm('Alice', 'Johnson');
  await pimPage.assertEmployeeSavedSuccessfully();
});
```

The test describes the scenario. The page object handles the implementation.
Either can change independently without breaking the other.

---

## Q501.6 — What is the Single Responsibility Principle and how does POM apply it?

The Single Responsibility Principle (SRP) states that every class should have
one reason to change.

Applied to POM:
- `LoginPage.ts` changes only when the login page UI changes
- `AddEmployeePage.ts` changes only when the Add Employee form changes
- `LoginPage.ts` does NOT change when the dashboard is redesigned
- `LoginPage.ts` does NOT change when a test scenario is updated

```typescript
// Violation — LoginPage knows about dashboard navigation (two reasons to change)
async loginAndGoToDashboard(username: string, password: string): Promise<void> {
  await this.login(username, password);
  await this.dashboardPage.navigateToPIM(); // ← LoginPage should NOT know this
}

// Correct — LoginPage has one responsibility
async login(username: string, password: string): Promise<void> {
  await this.fillUsername(username);
  await this.fillPassword(password);
  await this.clickLogin();
}
// Navigation to PIM is the test's responsibility, not LoginPage's
```

When every class has one reason to change, the impact of any change is
contained and predictable. A developer changing the login form knows
exactly one file needs updating.

---

## Q501.7 — What is the DRY principle and where does it apply in POM?

DRY — Don't Repeat Yourself — means every piece of knowledge should
exist in exactly one place in the codebase.

POM enforces DRY at multiple levels:

**Selectors:** defined once in a page class, used by all methods that
need them. A selector change requires one edit.

```typescript
// DRY — selector exists in one place
private readonly submitButton = page.getByRole('button', { name: 'Save' })
                                    .describe('Save employee button');

async saveEmployee(): Promise<void>  { await this.submitButton.click(); }
async assertSaveEnabled(): Promise<void> { await expect(this.submitButton).toBeEnabled(); }
// Both methods use the same Locator — one definition serves both
```

**Actions:** an `addEmployee()` method wraps the individual field fills
and the save click. Tests call the method, not the individual steps.
If the form adds a required field, one fix in `addEmployee()` updates
all tests.

**Higher levels extend DRY further:** BasePage (Level 2) eliminates
repeated constructor boilerplate. Fixtures (Level 3) eliminate repeated
login setup. Data factories (Level 5) eliminate repeated test data.
Web action helpers (Level 6) eliminate repeated interaction patterns.

---

## Q501.8 — What is abstraction in POM and why does it matter for readability?

Abstraction hides implementation details behind a meaningful interface.
The test knows what it wants — not how to achieve it.

```typescript
// Without abstraction — test is a sequence of browser instructions
test('employee can apply for annual leave', async ({ page }) => {
  await page.goto('/web/index.php/leave/applyLeave');
  await page.locator('.oxd-select-text').first().click();
  await page.getByRole('option', { name: 'Annual Leave' }).click();
  await page.locator('input.oxd-date-input').first().fill('2026-06-15');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.locator('.oxd-toast-content')).toBeVisible();
});

// With abstraction — test reads like a user story
test('employee can apply for annual leave', async ({ leavePage }) => {
  await leavePage.applyLeave({ type: 'Annual Leave', date: '2026-06-15' });
  await leavePage.assertApplicationSubmitted();
});
```

A non-technical stakeholder can read the abstracted test and understand
what it tests without knowing anything about Playwright or the application's
HTML. This matters for code review, documentation, and onboarding.

Good abstraction also means the test survives UI changes. The OrangeHRM
leave dropdown might change its implementation, but "select a leave type"
remains a valid user action. The page object absorbs the change; the test
is unaffected.

---

## Q501.9 — What is the difference between good and bad POM?

Bad POM: a class named `LoginPage` that also navigates to the dashboard,
fills employee forms, and contains test assertions mixed with actions.
It exists but defeats the purpose.

Good POM: each class has one clearly scoped responsibility, methods are
named after user intent (not browser actions), and test files read as
business scenarios.

```typescript
// ❌ Bad POM — page object has too much knowledge
export class LoginPage {
  async loginAndCreateEmployee(username: string, empName: string) {
    await this.login(username, 'admin123');
    await this.page.goto('/pim/addEmployee');   // knows another page's URL
    await this.page.fill('#firstName', empName); // exposes raw selector in method
    await this.page.click('#save');
  }
}

// ✅ Good POM — each class owns one page, no leakage
export class LoginPage {
  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.loginButton.click();
  }
}

export class AddEmployeePage {
  async addEmployee(firstName: string, lastName: string): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.saveButton.click();
  }
}
```

**Signs of bad POM in an interview answer:** "Our page object logs in
and then navigates through several pages." That is a test scenario, not
a page object. A page object should never know how many other pages
precede or follow it.

---

## Q501.10 — Why does POM matter more as a test suite grows?

At 10 tests, POM feels like extra work. At 500 tests, POM is the only
reason the suite is still maintainable.

**The maintenance multiplication problem:**
- Without POM: a selector change affects every test that uses it directly
- With 10 tests using the selector: 10 manual fixes
- With 100 tests using the selector: a half-day of work
- With 500 tests: a full day, with high risk of missing some

POM collapses the multiplication: one selector change in one page class
fixes all 500 tests instantly. The cost of change is proportional to the
actual scope of the change, not to how many tests happen to use it.

**The collaboration problem:**
Multiple engineers contributing to one codebase without POM means
duplicated selectors, inconsistent interaction patterns, and page logic
scattered everywhere. With POM, the page object is the authoritative
location. Two engineers editing the same page both go to the same class.

**The onboarding problem:**
A new engineer joins an OrangeHRM project. Without POM, they need to
understand hundreds of test files to know how login works. With POM,
they read `LoginPage.ts` — one file — and understand every login
interaction in the entire suite.

---

## Q501.11 — What is the anti-pattern of putting assertions in test files vs page objects?

Both are valid, but there is a structural distinction worth knowing:

**Assertions in page objects (recommended for reusable checks):**
```typescript
// assertPageLoaded() used by many tests across multiple test files
async assertPageLoaded(): Promise<void> {
  await expect(this.page).toHaveURL(/viewEmployeeList/);
  await expect(this.pageHeading).toBeVisible();
}
```

**Assertions in test files (recommended for scenario-specific checks):**
```typescript
// This specific assertion only makes sense in this one test
test('search returns matching employee', async ({ page, employeeListPage }) => {
  await employeeListPage.searchByName('Alice Johnson');
  // Scenario-specific assertion — belongs here, not in the page object
  await expect(page.locator('.employee-row')).toHaveCount(1);
});
```

**The rule:** if the same assertion appears — or will appear — in more
than one test, put it in the page object. If it is specific to one test
scenario, put it in the test file.

The anti-pattern to avoid: making test files into assertion dumps where
every single `expect()` is in the test rather than in reusable page object
methods. This means when an assertion needs updating, you find every test
that checks that UI state and update them individually.

---

## Q501.12 — What is the difference between POM in Selenium vs Playwright?

The pattern is the same — the implementation differs:

**Selenium POM (Java/Python):**
```python
# Driver passed to constructor, locators found by By
class LoginPage:
    def __init__(self, driver):
        self.driver = driver
        self.username_input = By.ID, "username"
    def login(self, username, password):
        self.driver.find_element(*self.username_input).send_keys(username)
```

**Playwright POM (TypeScript):**
```typescript
// Page passed to constructor, locators are Locator objects (lazy, chainable)
export class LoginPage {
  private readonly usernameInput: Locator;
  constructor(private readonly page: Page) {
    this.usernameInput = page.getByPlaceholder('Username');
  }
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
  }
}
```

**Key differences:**

Playwright locators are lazy objects — they do not query the DOM when
created. They query when an action or assertion is made. This means
locators can be defined in the constructor safely, even if the page
is not loaded yet.

Playwright's Locator API is richer — `getByRole()`, `getByLabel()`,
`getByTestId()`, filtering, chaining — compared to Selenium's `By` strategies.
And Playwright has a fixture system for dependency injection (Level 3)
that Selenium does not have natively — replacing the `PageFactory` pattern
entirely with a cleaner mechanism.

---

## Q501.13 — How do you structure a Playwright POM project?

```
orangehrm-automation/
├── pages/                    ← all page object classes
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── pim/
│   │   ├── EmployeeListPage.ts
│   │   └── AddEmployeePage.ts
│   ├── admin/
│   │   ├── UserManagementPage.ts
│   │   └── AddUserPage.ts
│   └── leave/
│       └── ApplyLeavePage.ts
├── tests/                    ← all test files
│   ├── login.spec.ts
│   ├── pim/
│   │   └── employee.spec.ts
│   └── admin/
│       └── user.spec.ts
├── fixtures/                 ← custom Playwright fixtures (Level 3+)
├── data/                     ← test data factories (Level 5+)
├── helpers/                  ← web action helpers (Level 6+)
├── playwright.config.ts
├── tsconfig.json
└── .gitignore
```

**One folder per module** under `pages/` — mirrors the application structure.
Adding new pages in a module means adding files to the module folder, not
restructuring the project.

**The one rule:** if it touches the browser — it belongs in `pages/`. If
it describes a test scenario — it belongs in `tests/`. This rule resolves
every "where does this code go?" question at Level 1.

---

## Q501.14 — Write a basic LoginPage page object for OrangeHRM.

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

  // Navigation
  async goto(): Promise<void> {
    await this.page.goto('/web/index.php/auth/login');
  }

  // Actions
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  // Assertions
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

**Key decisions in this code:**

`private readonly` on all locators — prevents accidental mutation and
signals that these are internal to the class. Tests cannot access locators
directly.

`.describe()` on each locator — the description appears in failure messages,
making reports readable without decoding selectors.

Constructor defines all locators upfront — Playwright locators are lazy
so this is safe. All selectors are in one place — easy to find and update.

`async goto()` separate from `login()` — the test decides when to navigate.
Some tests may need to navigate and then check the empty form. Others
navigate and immediately login. Separating them gives tests control.

---

## Q501.15 — Write a test that uses the LoginPage page object.

```typescript
// tests/login.spec.ts
import { test } from '@playwright/test';
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

  test('invalid username shows error', async () => {
    await loginPage.login('nonexistent', 'admin123');
    await loginPage.assertInvalidCredentialsError();
  });

});
```

**What the test file does NOT contain:**
- No selectors (no `page.getByPlaceholder('Username')` in tests)
- No browser navigation URLs directly
- No low-level click/fill calls
- No knowledge of how login works internally

**What the test file DOES contain:**
- Business scenarios expressed in plain language
- Calls to page object methods that read like user actions
- Assertions delegated to the page object

This is the hallmark of well-applied POM: a non-technical stakeholder
can read the test file and understand what is being tested.

---

## Q501.16 — What problems does Level 1 POM NOT solve?

Level 1 POM solves the selector duplication problem. It introduces three
problems that the higher levels address:

**Problem 1 — Constructor boilerplate repeated in every class:**
```typescript
// Every page object starts with this — 20 pages = 20 copies
private readonly page: Page;
constructor(page: Page) {
  this.page = page;
}
```
Level 2 (BasePage & Inheritance) eliminates this with a shared base class.

**Problem 2 — Login repeated in every test file's beforeEach:**
```typescript
// Every test file that needs authentication repeats this
test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('Admin', 'admin123');
});
```
Level 3 (Fixtures) injects pre-authenticated page objects directly into
tests so login is never repeated.

**Problem 3 — Tests depend on other tests:**
```typescript
// User test assumes employee test ran first and created the employee
// If employee test fails, user test fails for the wrong reason
```
Level 4 (Test Independence) and Level 6 (Web Action Helpers + API setup)
give each test its own data setup, removing all cross-test dependencies.

Understanding what Level 1 does not solve is as important as knowing what
it does. In interviews, describing the full progression shows architectural
thinking, not just pattern knowledge.

---

## Q501.17 — How do you use .describe() on Playwright locators and why?

`.describe()` attaches a human-readable label to a locator. It appears
in failure messages, making reports immediately understandable:

```typescript
// Without .describe() — failure message is cryptic
// "Error: locator.fill: Timeout 30000ms exceeded
//  Call log: locator resolved to <input nth=4 class='oxd-input'>"
this.employeeIdInput = page.locator('input.oxd-input').nth(4);

// With .describe() — failure message is diagnostic
// "Error: locator.fill: Timeout 30000ms exceeded
//  locator: Employee ID input field"
this.employeeIdInput = page.locator('input.oxd-input').nth(4)
                           .describe('Employee ID input field');
```

`.describe()` is most valuable on positional locators — `.nth(4)`,
`.first()`, `.last()` — where the raw selector gives no hint about
what the element is. A failure on `input.oxd-input >> nth=4` tells
you nothing. A failure on `Employee ID input field` tells you exactly
what broke.

Apply `.describe()` consistently across all locators from the start.
When an AI self-healing agent (Level 9) encounters a broken locator, it
uses the description as semantic intent to find the correct element in
the updated page — the description survives DOM changes in a way that
raw selectors do not.

---

## Q501.18 — What does a good POM framework look like in a senior interview?

In a senior interview on POM, the question is not "do you know what POM is?"
Every candidate knows the definition. The question is "can you design it
well and can you recognise when it has gone wrong?"

**Signs of strong POM design thinking:**

1. Can explain WHY each pattern exists — not just WHAT it is.
   "We use private readonly locators because tests should never access
   selectors directly — the page object is the API contract."

2. Can identify bad POM on sight.
   "If a page object navigates through multiple pages, it has too many
   responsibilities. If a test file contains selectors, POM is broken."

3. Understands the full progression.
   "Level 1 POM solves selector duplication. Level 2 solves constructor
   duplication. Level 3 replaces beforeEach login with fixtures. Each
   level solves the problem the previous level reveals."

4. Has real examples of POM saving maintenance time.
   "When OrangeHRM updated the leave type dropdown from a select to a
   custom component, one change in `ApplyLeavePage.ts` fixed all 23 tests
   that applied for leave. Without POM, we would have updated 23 tests."

A strong answer connects the theory (separation of concerns, DRY, SRP)
to a concrete decision made in a real project. That connection is what
separates a candidate who has read about POM from one who has built and
maintained a framework with it.

---

## Chapter Summary

- POM represents each application page as a class with three responsibilities: locators, actions, assertions.
- Introduced by Simon Stewart (Selenium co-creator) to solve selector duplication and maintenance cost.
- Separation of concerns: page objects handle HOW; test files handle WHAT; neither knows the other's internals.
- Single Responsibility Principle: each page class has one reason to change — when its page's UI changes.
- DRY: selectors defined once in page classes; action methods defined once, called many times.
- Abstraction: tests read as business scenarios, not browser instructions.
- `private readonly` locators — encapsulate selectors, expose only the method API to tests.
- `.describe()` on locators — human-readable labels in failure messages; essential for positional selectors.
- Level 1 POM solves selector duplication; it deliberately leaves constructor boilerplate (Level 2), repeated login (Level 3), and test dependencies (Level 4+) for subsequent levels.
- Bad POM: page objects that navigate through multiple pages, test files that contain selectors, methods named after browser actions not user intent.
- Good POM: tests readable by non-technical stakeholders, changes isolated to one file, progression toward full independence at each level.
