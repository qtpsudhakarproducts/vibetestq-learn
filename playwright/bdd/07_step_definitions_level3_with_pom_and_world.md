# Step Definitions — Level 3: With POM and With World

## What Changes at This Level

At Level 2, the World managed browser lifecycle cleanly. But Playwright locators and
actions were still written directly inside step definitions. That meant:

- Locators were scattered across many step files
- If the UI changed, you had to hunt through step files to fix locators
- Login logic was repeated in every feature that needed a logged-in user

At Level 3 we move all locators and actions into **Page Object Model classes**.
Step definitions become thin — they just call POM methods. The World holds both
the Playwright objects and the POM instances.

This is the production-ready pattern.

---

## The Complete File Structure

```
features/
  login.feature
  employee.feature

pages/
  LoginPage.ts           ← locators + actions for the login page
  EmployeePage.ts        ← locators + actions for the employee page
  DashboardPage.ts       ← locators + actions for the dashboard

steps/
  login.steps.ts         ← thin steps that call LoginPage methods
  employee.steps.ts      ← thin steps that call EmployeePage methods
  common.steps.ts        ← shared steps used across features

support/
  world.ts               ← holds page, context, and all POM instances
  hooks.ts               ← browser lifecycle management

cucumber.json
```

---

## Step 1 — Create POM Classes

### pages/LoginPage.ts

```typescript
import { Page, expect } from '@playwright/test';

export class LoginPage {
  // All locators defined once, in one place
  private usernameInput;
  private passwordInput;
  private loginButton;
  private errorMessage;

  constructor(private page: Page) {
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton   = page.getByRole('button', { name: 'Login' });
    this.errorMessage  = page.locator('.oxd-alert-content-text');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/web/index.php/auth/login');
  }

  async enterUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async clickLoginButton(): Promise<void> {
    await this.loginButton.click();
  }

  async login(username: string, password: string): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() ?? '';
  }

  async verifyLoginSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/dashboard/);
  }
}
```

### pages/EmployeePage.ts

```typescript
import { Page, expect } from '@playwright/test';

export class EmployeePage {
  private addButton;
  private firstNameInput;
  private lastNameInput;
  private saveButton;
  private searchInput;
  private searchButton;
  private resetButton;

  constructor(private page: Page) {
    this.addButton     = page.getByRole('button', { name: 'Add' });
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput  = page.getByPlaceholder('Last Name');
    this.saveButton    = page.getByRole('button', { name: 'Save' });
    this.searchInput   = page.getByPlaceholder('Type for hints...');
    this.searchButton  = page.getByRole('button', { name: 'Search' });
    this.resetButton   = page.getByRole('button', { name: 'Reset' });
  }

  async navigate(): Promise<void> {
    await this.page.goto('/web/index.php/pim/viewEmployeeList');
  }

  async addEmployee(firstName: string, lastName: string): Promise<void> {
    await this.addButton.click();
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.saveButton.click();
  }

  async searchByName(name: string): Promise<void> {
    await this.searchInput.fill(name);
    await this.searchButton.click();
  }

  async clickReset(): Promise<void> {
    await this.resetButton.click();
  }

  async verifyEmployeeVisible(name: string): Promise<void> {
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async getResultCount(): Promise<number> {
    const rows = await this.page.getByRole('row').count();
    return rows - 1; // subtract header row
  }
}
```

---

## Step 2 — Update the World to Include POM Instances

`support/world.ts`:

```typescript
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { EmployeePage } from '../pages/EmployeePage';

export class PlaywrightWorld extends World {
  // Playwright objects
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  // POM instances — created in steps and shared across steps in the same scenario
  loginPage!: LoginPage;
  employeePage!: EmployeePage;

  // Scenario data — stored by one step, read by another
  createdEmployeeName!: string;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(PlaywrightWorld);
```

The POM instances (`loginPage`, `employeePage`) are declared here but not created yet.
They are created inside step definitions and stored on `this`.

---

## Step 3 — Hooks Stay the Same

`support/hooks.ts` does not change from Level 2. Hooks manage the browser — not the POM.

```typescript
import { BeforeAll, Before, After, AfterAll } from '@cucumber/cucumber';
import { chromium, Browser } from '@playwright/test';
import { PlaywrightWorld } from './world';

let browser: Browser;

BeforeAll(async function () {
  browser = await chromium.launch({ headless: true });
});

Before(async function (this: PlaywrightWorld) {
  this.context = await browser.newContext({
    baseURL: 'https://opensource-demo.orangehrmlive.com'
  });
  this.page = await this.context.newPage();
});

After(async function (this: PlaywrightWorld) {
  await this.context.close();
});

AfterAll(async function () {
  await browser.close();
});
```

---

## Step 4 — Write Thin Step Definitions

`steps/login.steps.ts`:

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { PlaywrightWorld } from '../support/world';
import { LoginPage } from '../pages/LoginPage';
import { expect } from '@playwright/test';

// Given — create POM and navigate
Given('I am on the OrangeHRM login page', async function (this: PlaywrightWorld) {
  this.loginPage = new LoginPage(this.page);   // create and store on World
  await this.loginPage.navigate();
});

// When — call POM methods, no locators here
When('I enter username {string} and password {string}', async function (
  this: PlaywrightWorld,
  username: string,
  password: string
) {
  await this.loginPage.enterUsername(username);
  await this.loginPage.enterPassword(password);
});

When('I click the login button', async function (this: PlaywrightWorld) {
  await this.loginPage.clickLoginButton();
});

// Then — call POM assertion methods
Then('I should be on the dashboard', async function (this: PlaywrightWorld) {
  await this.loginPage.verifyLoginSuccess();
});

Then('I should see the error message {string}', async function (
  this: PlaywrightWorld,
  message: string
) {
  const actual = await this.loginPage.getErrorMessage();
  expect(actual).toContain(message);
});
```

`steps/employee.steps.ts`:

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { PlaywrightWorld } from '../support/world';
import { EmployeePage } from '../pages/EmployeePage';
import { expect } from '@playwright/test';

Given('I am on the employee list page', async function (this: PlaywrightWorld) {
  this.employeePage = new EmployeePage(this.page);
  await this.employeePage.navigate();
});

When('I add a new employee with name {string} {string}', async function (
  this: PlaywrightWorld,
  firstName: string,
  lastName: string
) {
  await this.employeePage.addEmployee(firstName, lastName);
  this.createdEmployeeName = `${firstName} ${lastName}`;  // store for Then step
});

When('I search for employee {string}', async function (
  this: PlaywrightWorld,
  name: string
) {
  await this.employeePage.searchByName(name);
});

When('I click the Reset button', async function (this: PlaywrightWorld) {
  await this.employeePage.clickReset();
});

Then('the employee {string} should appear in the list', async function (
  this: PlaywrightWorld,
  name: string
) {
  await this.employeePage.verifyEmployeeVisible(name);
});

Then('the newly created employee should appear in the list', async function (
  this: PlaywrightWorld
) {
  // Uses the name stored by the When step — no need to repeat it in Gherkin
  await this.employeePage.verifyEmployeeVisible(this.createdEmployeeName);
});

Then('I should see {int} result', async function (
  this: PlaywrightWorld,
  count: number
) {
  const actual = await this.employeePage.getResultCount();
  expect(actual).toBe(count);
});
```

`steps/common.steps.ts`:

```typescript
import { Given } from '@cucumber/cucumber';
import { PlaywrightWorld } from '../support/world';
import { LoginPage } from '../pages/LoginPage';

// Shared step used by many feature files
Given('I am logged in as admin', async function (this: PlaywrightWorld) {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.navigate();
  await this.loginPage.login('Admin', 'admin123');
});
```

---

## Step 5 — Feature Files

`features/login.feature`:

```gherkin
Feature: Login to OrangeHRM

  Background:
    Given I am on the OrangeHRM login page

  @smoke
  Scenario: Successful login with valid credentials
    When I enter username "Admin" and password "admin123"
    And I click the login button
    Then I should be on the dashboard

  @regression
  Scenario: Login with wrong password
    When I enter username "Admin" and password "wrongpassword"
    And I click the login button
    Then I should see the error message "Invalid credentials"
```

`features/employee.feature`:

```gherkin
Feature: Employee Management

  Background:
    Given I am logged in as admin
    And I am on the employee list page

  @smoke
  Scenario: Add a new employee
    When I add a new employee with name "John" "Smith"
    Then the employee "John Smith" should appear in the list

  @regression
  Scenario: Search for an employee by name
    When I search for employee "Linda Anderson"
    Then I should see 1 result

  @regression
  Scenario: Reset clears the search
    When I search for employee "Linda Anderson"
    And I click the Reset button
    Then I should see 1 result
```

---

## Run It

```bash
npx cucumber-js
```

---

## The Full Call Chain

Trace a single step from Gherkin to browser action:

```
Feature file:
  When I add a new employee with name "John" "Smith"
         ↓
steps/employee.steps.ts:
  When('I add a new employee with name {string} {string}', async function(first, last) {
    await this.employeePage.addEmployee(first, last);   ← calls POM
  });
         ↓
pages/EmployeePage.ts:
  async addEmployee(firstName, lastName) {
    await this.addButton.click();                       ← Playwright action
    await this.firstNameInput.fill(firstName);          ← Playwright action
    await this.lastNameInput.fill(lastName);            ← Playwright action
    await this.saveButton.click();                      ← Playwright action
  }
         ↓
Browser: clicks Add, fills fields, clicks Save
```

Each layer has one job. The step definition does not know about locators.
The POM class does not know about Gherkin.

---

## Comparing All Three Levels

| | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| Browser management | Inside steps | Hooks | Hooks |
| State sharing | Module variables | World (`this`) | World (`this`) |
| Locators | In steps | In steps | In POM classes |
| Actions | In steps | In steps | In POM classes |
| Scenario isolation | No | Yes | Yes |
| Cleanup on failure | No | Yes | Yes |
| Reusable login | No | No | Yes — `login()` in LoginPage |
| UI change impact | Change many step files | Change many step files | Change one POM file |
| Step definition length | Long | Long | Short |
| Suitable for real projects | No | Partial | Yes |

---

## When the UI Changes — Maintenance Comparison

Imagine the Username placeholder changes from `'Username'` to `'Enter your username'`.

**Level 1 and Level 2:** Search through every step file for the old text. Fix each one.

**Level 3:** Open `LoginPage.ts`. Change one line.
```typescript
// Before
this.usernameInput = page.getByPlaceholder('Username');

// After
this.usernameInput = page.getByPlaceholder('Enter your username');
```

Every step definition that calls `loginPage.enterUsername()` is automatically fixed.
No step files need to change.

---

## Summary

At this level you learned:

- POM classes hold all locators and actions — step definitions hold none
- Step definitions are thin — they create POM instances and call their methods
- POM instances are stored on the World so later steps can reuse them
- `common.steps.ts` holds shared steps like login that are used by many features
- Scenario data produced by one step (`createdEmployeeName`) is stored on the World
  and read by a later step
- When the UI changes, you fix one POM file — not many step files

This is the production-ready pattern for Cucumber + Playwright projects.

Previous: [Level 2 — No POM, With World](./06_step_definitions_level2_with_world.md)
