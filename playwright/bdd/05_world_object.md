# 05 — The World Object

## What is the World?

In Cucumber, the **World** is a shared object that lives for the duration of one scenario.
Every step definition in that scenario shares the same World instance via `this`.

The World is how step definitions pass data to each other. One step can store a value on
`this`. The next step can read it.

Without the World, each step definition would be isolated and steps could not share state.

---

## Why You Need a Custom World

By default, Cucumber creates a plain empty object as the World. This does not include a
Playwright browser, context, or page. You need to create a custom World class that sets
up the Playwright objects and makes them available on `this`.

---

## Creating a Custom World

Create `support/world.ts`:

```typescript
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { EmployeePage } from '../pages/EmployeePage';
import { DashboardPage } from '../pages/DashboardPage';

export interface CustomWorld extends World {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  loginPage: LoginPage;
  employeePage: EmployeePage;
  dashboardPage: DashboardPage;
}

export class PlaywrightWorld extends World implements CustomWorld {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  loginPage!: LoginPage;
  employeePage!: EmployeePage;
  dashboardPage!: DashboardPage;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(PlaywrightWorld);
```

`setWorldConstructor` tells Cucumber to use your class as the World for every scenario.

---

## What to Put on the World

The World should hold everything that step definitions need to share:

| Property | Type | Purpose |
|---|---|---|
| `page` | `Page` | The Playwright page — used by every step |
| `context` | `BrowserContext` | The browser context — needed for cookies, storage state |
| `browser` | `Browser` | The browser instance — used to create new contexts |
| Page objects | `LoginPage`, etc. | POM classes — created in steps and reused across steps |

---

## How the World Connects to Hooks

The World provides the properties. Hooks fill them with real values.

In `support/hooks.ts`:

```typescript
import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { chromium, Browser } from '@playwright/test';
import { PlaywrightWorld } from './world';

let browser: Browser;

BeforeAll(async function() {
  browser = await chromium.launch({ headless: true });
});

Before(async function(this: PlaywrightWorld) {
  this.context = await browser.newContext({
    baseURL: 'https://opensource-demo.orangehrmlive.com'
  });
  this.page = await this.context.newPage();
});

After(async function(this: PlaywrightWorld) {
  await this.context.close();
});

AfterAll(async function() {
  await browser.close();
});
```

After the `Before` hook runs, `this.page` is available in every step definition.

---

## How Step Definitions Use the World

```typescript
// steps/login.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { PlaywrightWorld } from '../support/world';
import { LoginPage } from '../pages/LoginPage';
import { expect } from '@playwright/test';

Given('I am on the OrangeHRM login page', async function(this: PlaywrightWorld) {
  this.loginPage = new LoginPage(this.page);  // create POM and store it
  await this.loginPage.navigate();
});

When('I enter username {string} and password {string}', async function(
  this: PlaywrightWorld,
  username: string,
  password: string
) {
  await this.loginPage.enterUsername(username);  // reuse POM from Given step
  await this.loginPage.enterPassword(password);
});

Then('I should be on the dashboard', async function(this: PlaywrightWorld) {
  await expect(this.page).toHaveURL(/dashboard/);
});
```

The `Given` step creates `this.loginPage` and stores it on the World.
The `When` step reads `this.loginPage` and uses it.
This is how steps communicate — through shared state on `this`.

---

## TypeScript Typing for `this`

Without type annotations, TypeScript does not know what properties are on `this` inside
step definitions. Add `this: PlaywrightWorld` as the first parameter to get type safety.

```typescript
// Without typing — no autocomplete, no error checking
Given('I am on the login page', async function() {
  await this.page.goto('/login');  // TypeScript doesn't know 'page' exists
});

// With typing — full autocomplete and error checking
Given('I am on the login page', async function(this: PlaywrightWorld) {
  await this.page.goto('/login');  // TypeScript knows 'page' is a Playwright Page
});
```

---

## Storing Scenario-Specific Data

The World is also useful for storing data that one step produces and another step needs.

Example: a step creates an employee and stores the employee ID. A later step uses that ID.

```typescript
When('I add a new employee with name {string} {string}', async function(
  this: PlaywrightWorld,
  firstName: string,
  lastName: string
) {
  const employeeId = await this.employeePage.addEmployee(firstName, lastName);
  this.createdEmployeeId = employeeId;  // store for later steps
});

Then('the employee should be searchable by ID', async function(this: PlaywrightWorld) {
  await this.employeePage.searchById(this.createdEmployeeId);  // use stored value
  await expect(this.page.getByText(this.createdEmployeeId)).toBeVisible();
});
```

Add `createdEmployeeId` to your World interface:

```typescript
export interface CustomWorld extends World {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  loginPage: LoginPage;
  employeePage: EmployeePage;
  dashboardPage: DashboardPage;
  createdEmployeeId: string;  // added for scenario data
}
```

---

## World Lifetime

The World is created fresh for every scenario. When a scenario ends, the World is discarded.
This means:

- Scenarios do not share state — each gets a clean World
- Page objects you create in one scenario are not available in another
- Data stored on `this` only lives for the duration of one scenario

This is important for test isolation. If one scenario fails, it cannot corrupt the state
of the next scenario.

---

## Complete World File

```typescript
// support/world.ts
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { EmployeePage } from '../pages/EmployeePage';
import { DashboardPage } from '../pages/DashboardPage';
import { LeavePage } from '../pages/LeavePage';

export interface CustomWorld extends World {
  // Playwright objects
  browser: Browser;
  context: BrowserContext;
  page: Page;

  // Page objects
  loginPage: LoginPage;
  employeePage: EmployeePage;
  dashboardPage: DashboardPage;
  leavePage: LeavePage;

  // Scenario data
  createdEmployeeId: string;
  lastSearchTerm: string;
}

export class PlaywrightWorld extends World implements CustomWorld {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  loginPage!: LoginPage;
  employeePage!: EmployeePage;
  dashboardPage!: DashboardPage;
  leavePage!: LeavePage;

  createdEmployeeId!: string;
  lastSearchTerm!: string;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(PlaywrightWorld);
```

---

## Summary

- The World is a shared object that lives for the duration of one scenario
- Step definitions share state by reading and writing properties on `this`
- Create a custom World class that includes `page`, `context`, and page objects
- Use `setWorldConstructor` to register your World with Cucumber
- Type `this` as your World class in step definitions for TypeScript safety
- The World is created fresh for each scenario — no shared state between scenarios

Next: [06 — Step Definitions Level 2 — With World](./06_step_definitions_level2_with_world.md)
