# 04 — Step Definitions

## What Are Step Definitions?

A step definition is a TypeScript function that runs when Cucumber matches a step in a
feature file. The feature file describes **what** to do in plain English. The step definition
contains the code that **does** it.

Every step in every scenario must have exactly one matching step definition. If a step has no
match, Cucumber marks it as undefined and the test fails.

---

## Basic Structure

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('I am on the OrangeHRM login page', async function() {
  await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
});

When('I enter username {string} and password {string}', async function(username: string, password: string) {
  await this.page.getByPlaceholder('Username').fill(username);
  await this.page.getByPlaceholder('Password').fill(password);
});

When('I click the login button', async function() {
  await this.page.getByRole('button', { name: 'Login' }).click();
});

Then('I should be on the dashboard', async function() {
  await expect(this.page).toHaveURL(/dashboard/);
});

Then('I should see the error message {string}', async function(message: string) {
  const error = this.page.getByText(message);
  await expect(error).toBeVisible();
});
```

---

## How Matching Works

Cucumber reads each step in a feature file and searches for a step definition whose pattern
matches the step text.

Feature step:
```gherkin
When I enter username "Admin" and password "admin123"
```

Matching step definition:
```typescript
When('I enter username {string} and password {string}', async function(username, password) {
  // username = "Admin"
  // password = "admin123"
});
```

The `{string}` placeholder captures text inside double quotes from the feature file.

---

## Parameter Types

Cucumber provides built-in parameter types for capturing values from step text.

| Type | Matches | Example |
|---|---|---|
| `{string}` | Text inside double quotes | `"Admin"` |
| `{int}` | Integer number | `5` |
| `{float}` | Decimal number | `3.14` |
| `{word}` | Single word without spaces | `active` |
| `{}` (anonymous) | Any text | `anything here` |

### String Example
```gherkin
Then I should see the message "Welcome Admin"
```
```typescript
Then('I should see the message {string}', async function(message: string) {
  await expect(this.page.getByText(message)).toBeVisible();
});
```

### Integer Example
```gherkin
Then I should see 5 results in the list
```
```typescript
Then('I should see {int} results in the list', async function(count: number) {
  const rows = this.page.getByRole('row');
  await expect(rows).toHaveCount(count + 1); // +1 for header row
});
```

---

## The `this` Keyword

Inside step definitions, `this` refers to the **World object**. The World is a shared object
that lives for the duration of one scenario. It holds your Playwright `page`, `context`,
and any page objects you create.

```typescript
Given('I am on the OrangeHRM login page', async function() {
  // this.page is the Playwright page — set up in the World
  await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
});
```

**Important:** You must use `async function()` — not arrow functions — for `this` to work.

```typescript
// CORRECT — 'this' works
Given('I am on the login page', async function() {
  await this.page.goto('/login');
});

// WRONG — arrow function breaks 'this'
Given('I am on the login page', async () => {
  await this.page.goto('/login'); // ERROR: 'this' is undefined
});
```

---

## Organising Step Definitions

Put step definitions in separate files by feature area. All files in the `steps/` folder
are loaded automatically.

```
steps/
├── login.steps.ts       ← steps for login scenarios
├── employee.steps.ts    ← steps for employee management
├── leave.steps.ts       ← steps for leave scenarios
└── common.steps.ts      ← shared steps used by multiple features
```

### common.steps.ts — Shared Steps

Some steps appear in many feature files. Put them in `common.steps.ts`.

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('I am logged in as admin', async function() {
  await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  await this.page.getByPlaceholder('Username').fill('Admin');
  await this.page.getByPlaceholder('Password').fill('admin123');
  await this.page.getByRole('button', { name: 'Login' }).click();
  await expect(this.page).toHaveURL(/dashboard/);
});

Then('I take a screenshot', async function() {
  await this.page.screenshot({ path: `reports/screenshots/${Date.now()}.png` });
});
```

---

## Step Definition for Login Feature

Here is a complete step definition file for the login feature:

```typescript
// steps/login.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

Given('I am on the OrangeHRM login page', async function() {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.navigate();
});

When('I enter username {string} and password {string}', async function(username: string, password: string) {
  await this.loginPage.enterUsername(username);
  await this.loginPage.enterPassword(password);
});

When('I click the login button', async function() {
  await this.loginPage.clickLoginButton();
});

Then('I should be on the dashboard', async function() {
  await expect(this.page).toHaveURL(/dashboard/);
});

Then('I should see the welcome message', async function() {
  await expect(this.page.getByText('Welcome')).toBeVisible();
});

Then('I should see the error message {string}', async function(message: string) {
  const error = await this.loginPage.getErrorMessage();
  expect(error).toContain(message);
});

Then('I should see the validation message {string}', async function(message: string) {
  await expect(this.page.getByText(message)).toBeVisible();
});
```

---

## Step Definition for Employee Feature

```typescript
// steps/employee.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { EmployeePage } from '../pages/EmployeePage';

Given('I am on the employee list page', async function() {
  this.employeePage = new EmployeePage(this.page);
  await this.employeePage.navigate();
});

When('I add a new employee with name {string} {string}', async function(firstName: string, lastName: string) {
  await this.employeePage.addEmployee(firstName, lastName);
});

When('I search for employee {string}', async function(name: string) {
  await this.employeePage.searchByName(name);
});

When('I click the Reset button', async function() {
  await this.employeePage.clickReset();
});

Then('the employee {string} should appear in the employee list', async function(name: string) {
  await expect(this.page.getByText(name)).toBeVisible();
});

Then('I should see {int} result', async function(count: number) {
  const rows = this.page.getByRole('row');
  await expect(rows).toHaveCount(count + 1);
});

Then('I should see more than {int} results', async function(minimum: number) {
  const rows = await this.page.getByRole('row').count();
  expect(rows).toBeGreaterThan(minimum);
});
```

---

## Auto-Generating Step Definition Skeletons

You do not have to write step definitions from scratch. Cucumber generates the skeleton
code for you automatically when you run a feature file that has no matching step definitions.

### How It Works

Write your feature file first. Run it. Cucumber reads every undefined step and prints
ready-to-use TypeScript function stubs in the terminal.

`features/employee.feature`:
```gherkin
Feature: Employee Management

  Scenario: Add a new employee
    Given I am logged in as admin
    When I add a new employee with name "John" "Smith"
    Then the employee "John Smith" should appear in the list
```

Run:
```bash
npm run test:bdd
```

Cucumber output in the terminal:
```
UUU

Failures:

1) Scenario: Add a new employee
   ? Given I am logged in as admin
       Undefined. Implement with the following snippet:

         Given('I am logged in as admin', async function () {
           // Write code here that turns the phrase above into concrete actions
           return 'pending';
         });

   ? When I add a new employee with name "John" "Smith"
       Undefined. Implement with the following snippet:

         When('I add a new employee with name {string} {string}', async function (string, string2) {
           // Write code here that turns the phrase above into concrete actions
           return 'pending';
         });

   ? Then the employee "John Smith" should appear in the list
       Undefined. Implement with the following snippet:

         Then('the employee {string} should appear in the list', async function (string) {
           // Write code here that turns the phrase above into concrete actions
           return 'pending';
         });

1 scenario (1 undefined)
3 steps (3 undefined)
```

Notice that Cucumber already converts `"John"` and `"Smith"` to `{string}` parameters.
It does the pattern matching for you.

### The Workflow

This is the recommended BDD workflow:

```
1. Write the feature file in Gherkin
      ↓
2. Run cucumber-js
      ↓
3. Copy the generated snippets from the terminal
      ↓
4. Paste into a new step definition file
      ↓
5. Replace the comments with your POM calls
      ↓
6. Run again — steps should now pass
```

This workflow means you never have to manually type `Given(`, `When(`, or `Then(` —
Cucumber writes the function signatures for you.

### Controlling the Snippet Format

The `formatOptions.snippetInterface` setting in `cucumber.json` controls the format
of generated snippets.

```json
{
  "default": {
    "formatOptions": {
      "snippetInterface": "async-await"
    }
  }
}
```

| Value | Generated format |
|---|---|
| `async-await` | `async function () { ... }` — recommended for Playwright |
| `callback` | Uses a `callback` parameter — older style, not needed with Playwright |
| `promise` | Returns a Promise — less common |

Always use `async-await` when working with Playwright.

### VS Code — Generate from Feature File

With the **Cucumber (Gherkin) Full Support** extension installed, undefined steps are
underlined in red inside your `.feature` file. You can see at a glance which steps
still need implementing without having to run the tests first.

---

## Undefined Steps

If you run a feature file before writing all step definitions, Cucumber shows you the
undefined steps and generates code snippets you can copy.

```
Undefined. Implement with the following snippet:

  Given('I am on the OrangeHRM login page', async function () {
    // Write code here that turns the phrase above into concrete actions
    return 'pending';
  });
```

Copy the snippet, paste it into a step definition file, and replace the comment with
your implementation.

---

## Ambiguous Steps

If two step definitions match the same step text, Cucumber throws an error.

```
Error: Multiple step definitions match:
  - I enter username {string}  -- steps/login.steps.ts:5
  - I enter username {string}  -- steps/common.steps.ts:12
```

Fix this by removing the duplicate or making the patterns different.

---

## Summary

- Step definitions connect Gherkin steps to TypeScript code
- Use `{string}`, `{int}`, `{float}` to capture values from step text
- Always use `async function()` — not arrow functions — so `this` works
- `this` refers to the World object, which holds `page`, `context`, and page objects
- Organise step definitions by feature area — one file per feature
- Put shared steps in `common.steps.ts`

Next: [05 — World Object](./08_world_object.md)
