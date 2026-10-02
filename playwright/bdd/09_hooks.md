# 06 — Hooks

## What Are Hooks?

Hooks are functions that Cucumber runs automatically at specific points in the test lifecycle.
You register them once and Cucumber calls them at the right time.

Cucumber has four hooks:

| Hook | When It Runs |
|---|---|
| `BeforeAll` | Once before the first scenario in the entire test run |
| `Before` | Before every scenario |
| `After` | After every scenario (even if it failed) |
| `AfterAll` | Once after the last scenario in the entire test run |

Hooks are where you set up and tear down the Playwright browser, context, and page.

---

## BeforeAll — Launch the Browser

`BeforeAll` runs once before any scenario. Launch the browser here. Creating a browser
is slow — you want to do it once, not before every scenario.

```typescript
import { BeforeAll, AfterAll } from '@cucumber/cucumber';
import { chromium, Browser } from '@playwright/test';

let browser: Browser;

BeforeAll(async function() {
  browser = await chromium.launch({ headless: true });
});
```

Store `browser` in a module-level variable so `Before` and `AfterAll` can access it.

---

## Before — Create a Fresh Context and Page

`Before` runs before every scenario. Create a new browser context and page here.
Each scenario gets its own isolated context — cookies and storage do not leak between scenarios.

```typescript
import { Before } from '@cucumber/cucumber';
import { PlaywrightWorld } from './world';

Before(async function(this: PlaywrightWorld) {
  this.context = await browser.newContext({
    baseURL: 'https://opensource-demo.orangehrmlive.com',
    viewport: { width: 1280, height: 720 }
  });
  this.page = await this.context.newPage();
});
```

After this hook runs, `this.page` is ready and every step in the scenario can use it.

---

## After — Close the Context

`After` runs after every scenario — whether it passed or failed.
Close the context here to free up resources.

```typescript
import { After, ITestCaseHookParameter } from '@cucumber/cucumber';
import { PlaywrightWorld } from './world';

After(async function(this: PlaywrightWorld, scenario: ITestCaseHookParameter) {
  // Take a screenshot if the scenario failed
  if (scenario.result?.status === 'FAILED') {
    const screenshot = await this.page.screenshot();
    await this.attach(screenshot, 'image/png');
  }

  await this.context.close();
});
```

The `scenario` parameter gives you information about the scenario that just ran — including
whether it passed or failed. `this.attach` adds attachments to the Cucumber report.

---

## AfterAll — Close the Browser

`AfterAll` runs once after all scenarios complete. Close the browser here.

```typescript
AfterAll(async function() {
  await browser.close();
});
```

---

## Complete Hooks File

```typescript
// support/hooks.ts
import { Before, After, BeforeAll, AfterAll, ITestCaseHookParameter } from '@cucumber/cucumber';
import { chromium, Browser } from '@playwright/test';
import { PlaywrightWorld } from './world';

let browser: Browser;

BeforeAll(async function() {
  browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false'
  });
});

Before(async function(this: PlaywrightWorld) {
  this.context = await browser.newContext({
    baseURL: process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  });
  this.page = await this.context.newPage();
});

After(async function(this: PlaywrightWorld, scenario: ITestCaseHookParameter) {
  if (scenario.result?.status === 'FAILED') {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, 'image/png');

    const url = this.page.url();
    await this.attach(`URL at failure: ${url}`, 'text/plain');
  }

  await this.context.close();
});

AfterAll(async function() {
  await browser.close();
});
```

---

## Tagged Hooks

You can run a hook only for scenarios with a specific tag.

```typescript
// Only runs before scenarios tagged @authenticated
Before({ tags: '@authenticated' }, async function(this: PlaywrightWorld) {
  // Log in before the scenario starts
  await this.page.goto('/auth/login');
  await this.page.getByPlaceholder('Username').fill('Admin');
  await this.page.getByPlaceholder('Password').fill('admin123');
  await this.page.getByRole('button', { name: 'Login' }).click();
});
```

Now you can tag scenarios that need authentication:

```gherkin
@authenticated
Scenario: Add a new employee
  Given I am on the employee list page
  When I add a new employee with name "John" "Smith"
  Then the employee "John Smith" should appear in the list
```

The `@authenticated` hook runs before this scenario. Scenarios without the tag skip this hook.

---

## Hook Order

When multiple hooks apply to the same scenario, Cucumber runs them in this order:

```
BeforeAll (once)
  ↓
Before (per scenario)
  ↓
Scenario runs
  ↓
After (per scenario)
  ↓
AfterAll (once)
```

If you have multiple `Before` hooks, they run in the order they were registered.

---

## Hooks vs Background

`Background` and `Before` hooks both run before every scenario, but they are different:

| | Background | Before Hook |
|---|---|---|
| Lives in | Feature file | `support/hooks.ts` |
| Written in | Gherkin | TypeScript |
| Visible to stakeholders | Yes | No |
| Can contain Playwright code | No | Yes |
| Good for | Login steps, navigation | Browser setup, database reset |

Use `Background` for steps that stakeholders should see — like logging in.
Use `Before` hooks for infrastructure setup — like launching a browser.

---

## Attaching Data to Reports

The `this.attach` method adds data to the scenario in the Cucumber HTML report.
This is useful for screenshots, logs, and debug information.

```typescript
After(async function(this: PlaywrightWorld, scenario: ITestCaseHookParameter) {
  if (scenario.result?.status === 'FAILED') {
    // Attach screenshot
    const screenshot = await this.page.screenshot();
    await this.attach(screenshot, 'image/png');

    // Attach page HTML
    const html = await this.page.content();
    await this.attach(html, 'text/html');

    // Attach current URL
    await this.attach(`Failure URL: ${this.page.url()}`, 'text/plain');
  }
});
```

The attached data appears in the HTML report next to the failed scenario.

---

## Summary

| Hook | Purpose | Runs |
|---|---|---|
| `BeforeAll` | Launch the browser | Once before all scenarios |
| `Before` | Create context and page | Before every scenario |
| `After` | Take screenshot on failure, close context | After every scenario |
| `AfterAll` | Close the browser | Once after all scenarios |

- Use tagged hooks to run setup only for specific scenarios
- `Background` is for Gherkin-visible steps; hooks are for infrastructure
- Use `this.attach` to add screenshots and logs to the Cucumber report

Next: [07 — POM Integration](./10_pom_integration.md)
