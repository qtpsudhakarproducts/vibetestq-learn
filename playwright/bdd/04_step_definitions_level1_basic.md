# Step Definitions — Level 1: No POM, No World

## Who This Is For

This is the starting point. If you are new to Cucumber and Playwright, start here.

There is no Page Object Model. There is no World object. Every step definition
is a self-contained function with its own browser, page, and Playwright code.

This approach is not suitable for real projects — you will see why by the end.
But it is the best way to understand what a step definition actually does before
adding more layers.

---

## What You Need

A feature file and a step definition file. Nothing else.

`features/login.feature`:
```gherkin
Feature: Login to OrangeHRM

  Scenario: Successful login with valid credentials
    Given I open the OrangeHRM login page
    When I enter username "Admin" and password "admin123"
    And I click the login button
    Then I should see the dashboard
```

---

## The Problem at This Level

Each step definition function runs independently. There is no shared `page` object between
steps — so where does `page` come from?

At this basic level, the only way to share `page` between steps is to store it in a
**module-level variable** — a variable declared outside all the step functions.

---

## Step Definition File

`steps/login.steps.ts`:

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { chromium, Browser, Page } from '@playwright/test';
import { expect } from '@playwright/test';

// Module-level variables — shared across all step functions in this file
let browser: Browser;
let page: Page;

Given('I open the OrangeHRM login page', async function () {
  // Launch browser and open page here
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
});

When('I enter username {string} and password {string}', async function (username: string, password: string) {
  // Use the module-level page variable
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(password);
});

When('I click the login button', async function () {
  await page.getByRole('button', { name: 'Login' }).click();
});

Then('I should see the dashboard', async function () {
  await expect(page).toHaveURL(/dashboard/);
  // Close browser after last step
  await browser.close();
});
```

---

## Running It

```bash
npx cucumber-js features/login.feature
```

Expected output:
```
1 scenario (1 passed)
4 steps (4 passed)
0m5.234s
```

---

## What Is Happening Step by Step

```
Given I open the OrangeHRM login page
  → launches chromium
  → creates a new page
  → stores browser and page in module-level variables
  → navigates to login URL

When I enter username "Admin" and password "admin123"
  → reads the module-level page variable
  → fills Username field with "Admin"
  → fills Password field with "admin123"

When I click the login button
  → reads the module-level page variable
  → clicks the Login button

Then I should see the dashboard
  → reads the module-level page variable
  → asserts URL contains "dashboard"
  → closes the browser
```

---

## What Is Good About This Approach

- Simple — no setup files, no config beyond `cucumber.json`
- Easy to read — all the code is in one place
- Good for learning — you can see exactly what each step does

---

## What Is Wrong With This Approach

### 1. Browser setup is mixed into a test step

The `Given` step is doing two things: it sets up the browser AND navigates to the login page.
Browser setup is infrastructure — it should not live inside a test step.

If you add a second scenario, the `Given` step launches a second browser. If the first
scenario fails before `Then`, the browser never closes and you have a memory leak.

### 2. Module-level variables break test isolation

`browser` and `page` are module-level. If two scenarios run at the same time, they share
the same variables. Scenario 2 could overwrite `page` while Scenario 1 is still using it.

### 3. Locators are scattered everywhere

`page.getByPlaceholder('Username')` is directly in the step function. If the placeholder
changes, you search through every step file to find it.

### 4. No cleanup on failure

If the `When` step throws an error, the code never reaches `browser.close()` in the
`Then` step. The browser process is left running.

---

## What These Problems Lead To

| Problem | Consequence |
|---|---|
| Browser setup in steps | Cannot reuse setup across scenarios |
| Module-level variables | Scenarios interfere with each other |
| Locators in steps | Hard to maintain when UI changes |
| No cleanup on failure | Memory leaks, orphaned browser processes |

These are exactly the problems that the World object (Level 2) and POM (Level 3) solve.

---

## Summary

At this level you learned:

- A step definition is a function that runs when Cucumber matches a Gherkin step
- `{string}` captures quoted text from the feature file as a parameter
- Module-level variables can share state between step functions
- `chromium.launch()`, `newContext()`, `newPage()` create the browser and page
- This approach works for a single scenario but breaks down quickly as tests grow

**Next step:** Move to Level 2 — introduce the World object to manage browser lifecycle
properly and share state cleanly between steps.

Next: [Level 2 — No POM, With World](./06_step_definitions_level2_with_world.md)
