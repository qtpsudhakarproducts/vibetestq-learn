# 07 — POM Integration

## BDD and POM Work Together

BDD and the Page Object Model solve different problems. They are designed to be used together.

- **POM** handles HOW to interact with the UI — locators, actions, assertions
- **BDD** handles WHAT the business scenario is — in plain English

Step definitions are the bridge. They call POM methods to carry out each Gherkin step.

```
Feature File (what)  →  Step Definition (bridge)  →  POM Class (how)
```

---

## The Rule: Never Duplicate Interaction Code

The most important rule when combining BDD with POM:

> **Step definitions call POM methods. Step definitions do not contain locators.**

If you put locators and `page.click()` calls directly in step definitions, you have two
problems:

1. If the UI changes, you must fix locators in step definitions AND in POM classes
2. Your POM classes become useless — step definitions bypass them

Keep all interaction code in POM. Step definitions are just the translation layer
between Gherkin and POM.

---

## A POM Class — LoginPage

```typescript
// pages/LoginPage.ts
import { Page, expect } from '@playwright/test';

export class LoginPage {
  private readonly usernameInput;
  private readonly passwordInput;
  private readonly loginButton;
  private readonly errorMessage;

  constructor(private page: Page) {
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByText('Invalid credentials');
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

---

## Step Definitions Calling POM

```typescript
// steps/login.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';
import { LoginPage } from '../pages/LoginPage';

Given('I am on the OrangeHRM login page', async function(this: PlaywrightWorld) {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.navigate();
});

When('I enter username {string} and password {string}', async function(
  this: PlaywrightWorld,
  username: string,
  password: string
) {
  await this.loginPage.enterUsername(username);
  await this.loginPage.enterPassword(password);
});

When('I click the login button', async function(this: PlaywrightWorld) {
  await this.loginPage.clickLoginButton();
});

Then('I should be on the dashboard', async function(this: PlaywrightWorld) {
  await this.loginPage.verifyLoginSuccess();
});

Then('I should see the error message {string}', async function(
  this: PlaywrightWorld,
  message: string
) {
  const actual = await this.loginPage.getErrorMessage();
  expect(actual).toContain(message);
});
```

Notice: no locators in the step definitions. Every interaction goes through `this.loginPage`.

---

## A POM Class — EmployeePage

```typescript
// pages/EmployeePage.ts
import { Page, expect } from '@playwright/test';

export class EmployeePage {
  constructor(private page: Page) {}

  async navigate(): Promise<void> {
    await this.page.goto('/web/index.php/pim/viewEmployeeList');
  }

  async addEmployee(firstName: string, lastName: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Add' }).click();
    await this.page.getByPlaceholder('First Name').fill(firstName);
    await this.page.getByPlaceholder('Last Name').fill(lastName);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async searchByName(name: string): Promise<void> {
    await this.page.getByPlaceholder('Type for hints...').fill(name);
    await this.page.getByRole('button', { name: 'Search' }).click();
  }

  async clickReset(): Promise<void> {
    await this.page.getByRole('button', { name: 'Reset' }).click();
  }

  async verifyEmployeeVisible(name: string): Promise<void> {
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async getResultCount(): Promise<number> {
    // returns the number of data rows, excluding the header row
    const rows = await this.page.getByRole('row').count();
    return rows - 1;
  }
}
```

---

## Step Definitions for Employee Feature

```typescript
// steps/employee.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { PlaywrightWorld } from '../support/world';
import { EmployeePage } from '../pages/EmployeePage';

Given('I am on the employee list page', async function(this: PlaywrightWorld) {
  this.employeePage = new EmployeePage(this.page);
  await this.employeePage.navigate();
});

When('I add a new employee with name {string} {string}', async function(
  this: PlaywrightWorld,
  firstName: string,
  lastName: string
) {
  await this.employeePage.addEmployee(firstName, lastName);
});

When('I search for employee {string}', async function(
  this: PlaywrightWorld,
  name: string
) {
  await this.employeePage.searchByName(name);
});

When('I click the Reset button', async function(this: PlaywrightWorld) {
  await this.employeePage.clickReset();
});

Then('the employee {string} should appear in the employee list', async function(
  this: PlaywrightWorld,
  name: string
) {
  await this.employeePage.verifyEmployeeVisible(name);
});

Then('I should see {int} result', async function(this: PlaywrightWorld, count: number) {
  const actual = await this.employeePage.getResultCount();
  expect(actual).toBe(count);
});
```

---

## The Full Picture — Feature File to Browser

Here is the complete chain from Gherkin to browser action:

```
Feature File:
  When I add a new employee with name "John" "Smith"
         ↓
Step Definition (employee.steps.ts):
  When('I add a new employee with name {string} {string}', async function(first, last) {
    await this.employeePage.addEmployee(first, last);  ← calls POM
  });
         ↓
POM Class (EmployeePage.ts):
  async addEmployee(firstName, lastName) {
    await this.page.getByRole('button', { name: 'Add' }).click();
    await this.page.getByPlaceholder('First Name').fill(firstName);
    ...  ← Playwright actions
  }
         ↓
Browser: clicks Add button, fills form fields
```

Each layer has a single responsibility. Change the UI? Update only the POM.
Change the business rule? Update only the feature file and step definition text.

---

## Creating Page Objects in Steps

Create page objects in the `Given` step that sets up the page context.
Store them on `this` so later steps can use them.

```typescript
// Given step creates and stores the page object
Given('I am on the employee list page', async function(this: PlaywrightWorld) {
  this.employeePage = new EmployeePage(this.page);  // create
  await this.employeePage.navigate();
});

// When step uses the stored page object
When('I search for employee {string}', async function(this: PlaywrightWorld, name: string) {
  await this.employeePage.searchByName(name);  // reuse
});

// Then step uses the stored page object
Then('the employee should be visible', async function(this: PlaywrightWorld) {
  await this.employeePage.verifyEmployeeVisible('John Smith');  // reuse
});
```

---

## Summary

- BDD describes WHAT to test; POM describes HOW to interact with the UI
- Step definitions are the bridge between Gherkin and POM
- Never put locators directly in step definitions
- Create POM objects in `Given` steps and store them on `this`
- Later steps (`When`, `Then`) reuse the stored POM objects
- If the UI changes, update only the POM — feature files and step definitions stay the same

Next: [08 — Tags and Filtering](./11_tags_and_filtering.md)
