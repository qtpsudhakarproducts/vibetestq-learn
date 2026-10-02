# Step Definitions — Level 2: No POM, With World

## What Changes at This Level

At Level 1, browser and page were module-level variables. That caused two problems:
- Browser lifecycle was tangled into test steps
- Multiple scenarios could interfere with each other via shared variables

At Level 2 we introduce the **World object**. The World is a fresh object created for
every scenario. It holds `browser`, `context`, and `page`. Hooks manage the browser
lifecycle — not the steps.

Playwright code (locators, actions) still lives directly in step definitions.
POM classes come at Level 3.

---

## Files You Need

```
features/
  login.feature
steps/
  login.steps.ts
support/
  world.ts
  hooks.ts
cucumber.json
```

---

## Step 1 — Create the World

`support/world.ts`:

```typescript
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';

export class PlaywrightWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(PlaywrightWorld);
```

The World is a class. Every scenario gets a new instance. Properties declared here
(`browser`, `context`, `page`) are available in every step via `this`.

---

## Step 2 — Create Hooks

`support/hooks.ts`:

```typescript
import { BeforeAll, Before, After, AfterAll } from '@cucumber/cucumber';
import { chromium, Browser } from '@playwright/test';
import { PlaywrightWorld } from './world';

let browser: Browser;

// Runs once — launch the browser before any scenario
BeforeAll(async function () {
  browser = await chromium.launch({ headless: true });
});

// Runs before every scenario — create a fresh context and page
Before(async function (this: PlaywrightWorld) {
  this.context = await browser.newContext({
    baseURL: 'https://opensource-demo.orangehrmlive.com'
  });
  this.page = await this.context.newPage();
});

// Runs after every scenario — close the context (even if scenario failed)
After(async function (this: PlaywrightWorld) {
  await this.context.close();
});

// Runs once — close the browser after all scenarios complete
AfterAll(async function () {
  await browser.close();
});
```

Now the browser launches once. Each scenario gets its own fresh context and page.
Cleanup always runs — even if the scenario fails.

---

## Step 3 — Write Step Definitions

`steps/login.steps.ts`:

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';

Given('I am on the OrangeHRM login page', async function (this: PlaywrightWorld) {
  await this.page.goto('/web/index.php/auth/login');
});

When('I enter username {string} and password {string}', async function (
  this: PlaywrightWorld,
  username: string,
  password: string
) {
  await this.page.getByPlaceholder('Username').fill(username);
  await this.page.getByPlaceholder('Password').fill(password);
});

When('I click the login button', async function (this: PlaywrightWorld) {
  await this.page.getByRole('button', { name: 'Login' }).click();
});

Then('I should be on the dashboard', async function (this: PlaywrightWorld) {
  await expect(this.page).toHaveURL(/dashboard/);
});

Then('I should see the error message {string}', async function (
  this: PlaywrightWorld,
  message: string
) {
  await expect(this.page.getByText(message)).toBeVisible();
});
```

Notice:
- No `browser` or `page` variables declared here
- Every step accesses `this.page` — the page that was created in the `Before` hook
- `this: PlaywrightWorld` gives TypeScript full type safety on `this`
- Arrow functions are NOT used — arrow functions break `this`

---

## Step 4 — Feature File

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

---

## Step 5 — cucumber.json

```json
{
  "default": {
    "paths": ["features/**/*.feature"],
    "require": [
      "support/world.ts",
      "support/hooks.ts",
      "steps/**/*.ts"
    ],
    "requireModule": ["ts-node/register"],
    "format": ["progress-bar", "html:reports/cucumber-report.html"],
    "formatOptions": { "snippetInterface": "async-await" },
    "publishQuiet": true
  }
}
```

---

## Run It

```bash
npx cucumber-js
```

Expected output:
```
2 scenarios (2 passed)
7 steps (7 passed)
0m8.456s
```

---

## What Improved Over Level 1

### Browser lifecycle is now clean

```
Level 1:                          Level 2:
Given step → launch browser       BeforeAll hook → launch browser (once)
Then step  → close browser        Before hook   → create fresh page per scenario
                                  After hook    → close context (always)
                                  AfterAll hook → close browser (once)
```

The browser is no longer tangled into test steps. If a scenario fails in the middle,
the `After` hook still runs and cleans up.

### Each scenario is isolated

At Level 1, `browser` and `page` were module-level variables — shared across scenarios.
At Level 2, each scenario gets its own World instance with its own `this.context` and
`this.page`. Scenarios cannot interfere with each other.

### Sharing data between steps is clean

Steps communicate through `this` — the World. One step stores something on `this`.
The next step reads it. No module-level variables needed.

```typescript
// Step stores scenario data on the World
When('I submit the login form', async function (this: PlaywrightWorld) {
  await this.page.getByRole('button', { name: 'Login' }).click();
  this.currentURL = this.page.url();  // store for later
});

// Next step reads it
Then('the URL should contain dashboard', async function (this: PlaywrightWorld) {
  expect(this.currentURL).toContain('dashboard');
});
```

To store extra properties, add them to the World class:

```typescript
export class PlaywrightWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  currentURL!: string;       // added for scenario data
  lastSearchTerm!: string;   // added for scenario data
}
```

---

## What Is Still Not Ideal at This Level

### Locators are still scattered in step definitions

```typescript
// This locator lives in the step file
await this.page.getByPlaceholder('Username').fill(username);
```

If the placeholder text changes from `'Username'` to `'Enter username'`, you must
search through every step file to find and fix every occurrence.

### Actions are not reusable

The login sequence — fill username, fill password, click login — is three separate steps.
If another feature file also needs to log in as a setup step, you either repeat all three
steps in that feature's `Background`, or you write a helper. This is where POM comes in.

### Step definitions are getting long

As you add more features, step files grow large. A step file for the employee module
might have 40 or 50 functions, all containing raw Playwright code. The file becomes hard
to navigate and maintain.

---

## Level 1 vs Level 2 — Side by Side

| | Level 1 | Level 2 |
|---|---|---|
| Browser management | Inside steps | In hooks |
| State sharing | Module-level variables | World (`this`) |
| Scenario isolation | No — shared variables | Yes — fresh World per scenario |
| Cleanup on failure | No | Yes — After hook always runs |
| Locators | In steps | In steps |
| Actions | In steps | In steps |

---

## Summary

At this level you learned:

- The World is a class. Each scenario gets its own fresh instance.
- `setWorldConstructor` registers your World class with Cucumber
- Hooks (`BeforeAll`, `Before`, `After`, `AfterAll`) manage the browser lifecycle
- Steps access `page` via `this.page` — no module-level variables
- Use `async function()` not arrow functions — `this` must work
- Type `this` as `PlaywrightWorld` for TypeScript safety
- Extra scenario data can be stored as properties on the World class

**Next step:** Move to Level 3 — introduce Page Object Model classes so that locators
and actions move out of step definitions and into dedicated page classes.

Next: [Level 3 — With POM and With World](./07_step_definitions_level3_with_pom_and_world.md)
