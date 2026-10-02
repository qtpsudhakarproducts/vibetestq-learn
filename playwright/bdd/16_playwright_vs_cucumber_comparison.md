# Playwright Test vs Cucumber BDD — Full Comparison

Both Playwright Test and Cucumber BDD are used to write and execute automated tests.
They overlap in many areas but serve different purposes and different audiences.
This document compares them side by side across every major concept.

---

## Purpose and Philosophy

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| Primary purpose | Technical test automation framework | Behaviour-driven collaboration tool |
| Written for | Developers and testers | Business stakeholders, testers, and developers |
| Test language | TypeScript / JavaScript | Gherkin (plain English) + TypeScript step definitions |
| Who reads the tests | Engineers | Anyone on the team including non-technical stakeholders |
| Driving philosophy | Automate fast, debug easily | Define behaviour first, automate second |
| Living documentation | No | Yes — feature files describe what the system does |

---

## Test File Structure

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| File extension | `.spec.ts` | `.feature` (Gherkin) + `.steps.ts` (TypeScript) |
| Files per feature | 1 file | Minimum 2 files — feature file + step definition file |
| Test grouping | `test.describe()` block | `Feature:` keyword |
| Single test | `test('name', async ({ page }) => {})` | `Scenario: name` |
| Test steps | Plain TypeScript code | `Given`, `When`, `Then` steps |
| Data-driven tests | `for` loop or `test.each()` (not built-in natively) | `Scenario Outline` + `Examples` table |
| Shared setup | `test.beforeEach()` | `Background:` |

### Playwright Test Example
```typescript
test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('successful login @smoke', async ({ page }) => {
    await page.getByPlaceholder('Username').fill('Admin');
    await page.getByPlaceholder('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/dashboard/);
  });
});
```

### Cucumber BDD Equivalent
```gherkin
Feature: Login

  Background:
    Given I am on the login page

  @smoke
  Scenario: Successful login
    When I enter username "Admin" and password "admin123"
    And I click the login button
    Then I should be on the dashboard
```

---

## Hooks

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| Before all tests | `test.beforeAll()` | `BeforeAll()` |
| Before each test | `test.beforeEach()` | `Before()` |
| After each test | `test.afterEach()` | `After()` |
| After all tests | `test.afterAll()` | `AfterAll()` |
| Scope | Inside `test.describe()` or global in config | Global across all scenarios |
| Tagged hooks | Not supported | `Before({ tags: '@smoke' }, ...)` |
| Access to page | Via fixture parameter `{ page }` | Via World — `this.page` |
| Hook file location | Inside `.spec.ts` or `global-setup.ts` | `support/hooks.ts` |

### Playwright Test Hook
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/auth/login');
});
```

### Cucumber Hook
```typescript
Before(async function (this: PlaywrightWorld) {
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
});
```

---

## Fixtures

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| Built-in fixtures | `page`, `context`, `browser`, `request` | None — you manage browser manually |
| Custom fixtures | `test.extend({ myFixture: ... })` | World object properties |
| Fixture scope | `test` or `worker` scope | World lives for one scenario only |
| Dependency injection | Yes — fixtures injected via function parameters | No — accessed via `this` |
| Shared state | Fixtures are independent per test | World properties shared across steps |
| Pre-authenticated session | `storageState` in fixture | Manually set in `Before` hook or tagged hook |

### Playwright Custom Fixture
```typescript
const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await use(loginPage);
  }
});
```

### Cucumber World Equivalent
```typescript
// World holds the page object
export class PlaywrightWorld extends World {
  page!: Page;
  loginPage!: LoginPage;
}

// Step creates it and stores on World
Given('I am on the login page', async function (this: PlaywrightWorld) {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.navigate();
});
```

---

## Configuration Files

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| Config file | `playwright.config.ts` | `cucumber.json` |
| Language | TypeScript | JSON |
| Base URL | `use: { baseURL: '...' }` | `baseURL` inside `newContext()` in hooks |
| Timeout | `timeout: 30000` | Set via Playwright inside hooks |
| Retries | `retries: 2` | `"retry": 2` in cucumber.json |
| Parallel workers | `workers: 4` | `"parallel": 4` in cucumber.json |
| Browser selection | `projects: [{ use: { ...devices['Desktop Chrome'] } }]` | `chromium.launch()` inside hooks |
| Multiple environments | Multiple projects or env vars | Multiple profiles in cucumber.json |
| Global setup | `globalSetup: './global-setup.ts'` | `BeforeAll` hook |
| Global teardown | `globalTeardown: './global-teardown.ts'` | `AfterAll` hook |

### Playwright Config
```typescript
// playwright.config.ts
export default defineConfig({
  baseURL: 'https://opensource-demo.orangehrmlive.com',
  timeout: 30000,
  retries: 2,
  workers: 4,
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
});
```

### Cucumber Config
```json
{
  "default": {
    "requireModule": ["ts-node/register"],
    "require": ["support/**/*.ts", "steps/**/*.ts"],
    "format": ["html:reports/report.html"],
    "retry": 2,
    "parallel": 4,
    "publishQuiet": true
  }
}
```

---

## Filtering and Running Tests

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| Run all tests | `npx playwright test` | `npx cucumber-js` |
| Run one file | `npx playwright test login.spec.ts` | `npx cucumber-js features/login.feature` |
| Run by line number | `npx playwright test login.spec.ts:12` | `npx cucumber-js features/login.feature:12` |
| Run by name | `npx playwright test --grep "login"` | `npx cucumber-js --name "login"` |
| Run by tag | `npx playwright test --grep @smoke` | `npx cucumber-js --tags @smoke` |
| Exclude tag | `npx playwright test --grep-invert @slow` | `npx cucumber-js --tags "not @slow"` |
| Named profiles | `--project=chromium` | `--profile smoke` |
| Dry run | Not available | `npx cucumber-js --dry-run` |
| Fail fast | `--max-failures=1` | `--fail-fast` |
| Headed mode | `--headed` | `HEADLESS=false npx cucumber-js` |
| Debug mode | `--debug` | No equivalent |

---

## Tagging

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| Tag syntax | `@smoke` inside test title string | `@smoke` above `Scenario:` in feature file |
| Where tags live | Inside the test name: `test('login @smoke', ...)` | In the `.feature` file above the scenario |
| Filter by tag | `--grep @smoke` | `--tags @smoke` |
| Multiple tags (and) | `--grep "(?=.*@smoke)(?=.*@auth)"` | `--tags "@smoke and @auth"` |
| Multiple tags (or) | `--grep "@smoke\|@regression"` | `--tags "@smoke or @regression"` |
| Exclude tag | `--grep-invert @wip` | `--tags "not @wip"` |
| Tag on hook | Not supported | `Before({ tags: '@auth' }, ...)` |
| Readable by stakeholders | No | Yes |

---

## Reporting

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| Built-in HTML report | Yes — `npx playwright show-report` | Yes — `html:reports/report.html` |
| Terminal output | Dot, list, line reporter | Progress, progress-bar, summary |
| JSON report | Yes | Yes |
| JUnit XML report | Yes | Yes |
| Trace viewer | Yes — step-by-step replay with screenshots | No |
| Video recording | Yes — built-in | No — not built-in |
| Screenshot on failure | Automatic with `screenshot: 'only-on-failure'` | Manual — `this.attach()` in `After` hook |
| Report language | Technical — test function names | Business — Gherkin scenario names |
| Best audience for report | Developers and testers | Business stakeholders |
| Third-party reporters | Allure, Monocart, etc. | multiple-cucumber-html-reporter, Allure |

---

## State Sharing Between Tests

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| Mechanism | Fixtures, `storageState`, shared files | World object (`this`) |
| Scope | Per test (fixture) or per worker (worker fixture) | Per scenario (World) |
| Passing data between steps | Not applicable — all code in one test function | World properties — `this.someValue` |
| Sharing login session | `storageState` saved to file, loaded in fixture | `storageState` loaded in `Before` hook or tagged hook |
| Isolation guarantee | Each test gets fresh fixture by default | Each scenario gets fresh World instance |

---

## Page Object Model Integration

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| POM usage | POM passed via custom fixture or created in test | POM created in `Given` step, stored on World |
| Where POM is created | Inside fixture or `beforeEach` | Inside step definition |
| Where POM is stored | Fixture injects it into every test | World — `this.loginPage` |
| Reuse across tests | Fixture makes POM available to all tests automatically | Must create POM in each scenario's steps |

---

## Parallel Execution

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| Config option | `workers: 4` in `playwright.config.ts` | `"parallel": 4` in `cucumber.json` |
| CLI option | `--workers=4` | `--parallel 4` |
| What runs in parallel | Test files (by default) | Scenarios |
| Isolation unit | Each worker gets its own browser context | Each worker gets its own World instance |
| Shared state risk | Worker-scoped fixtures shared within a worker | Module-level variables in hooks shared across workers |

---

## Debugging

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| Debug mode | `npx playwright test --debug` — opens Playwright Inspector | No equivalent |
| Trace viewer | `npx playwright show-report` — step-by-step replay | Not available |
| Headed mode | `--headed` flag or `headless: false` in config | `HEADLESS=false` environment variable |
| Pause execution | `await page.pause()` — opens Inspector at that point | `await this.page.pause()` inside a step |
| VS Code extension | Playwright Test for VS Code — run/debug from editor | Cucumber extension — navigate steps, see undefined steps |
| Step-through debugging | Yes — full debugger support | Standard Node.js debugger |
| Video on failure | `video: 'retain-on-failure'` | Not built-in |

---

## Assertions

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| Assertion library | `@playwright/test` — `expect()` | `@playwright/test` — `expect()` — same library |
| Where assertions live | Inside the test function | Inside `Then` step definitions |
| Auto-retry assertions | Yes — `expect(locator).toBeVisible()` retries automatically | Yes — same `expect()` behaviour |
| Soft assertions | `expect.soft()` | `expect.soft()` — same |

Assertions are identical — Cucumber uses the same `expect()` from `@playwright/test`.

---

## Learning Curve and Team Fit

| Aspect | Playwright Test | Cucumber BDD |
|---|---|---|
| Setup complexity | Low — one config file | Higher — world, hooks, steps, feature files, config |
| Files to maintain | One `.spec.ts` per feature | Two or more files per feature |
| Writing speed | Faster | Slower |
| Readability for engineers | Good | Good |
| Readability for business | Poor — TypeScript function names | Excellent — plain English |
| Debugging experience | Excellent — trace viewer, Inspector | Basic |
| Best team fit | All-technical teams | Cross-functional teams with active stakeholders |

---

## Quick Decision Guide

| Question | Playwright Test | Cucumber BDD |
|---|---|---|
| Do stakeholders read your tests? | No | Yes |
| Do you write scenarios before coding starts? | No | Yes |
| Do you need trace viewer for debugging? | Yes | No |
| Do you need video recording? | Yes | No |
| Is your team all engineers? | Yes | No |
| Do you need living documentation? | No | Yes |
| Do you want faster test setup? | Yes | No |
| Do you need business-readable reports? | No | Yes |

---

## Summary — When to Use Each

Use **Playwright Test** when:
- The team is fully technical
- Fast debugging with trace viewer and video matters
- Tests change frequently and quick setup is important
- Stakeholders will never read the test files

Use **Cucumber BDD** when:
- Business stakeholders actively participate in writing or reading scenarios
- You follow the Three Amigos practice — writing scenarios before development
- You need reports that non-technical people can understand
- Compliance or audit trails require business-language test evidence

Use **both together** when:
- End-to-end user journeys are written as BDD feature files for stakeholders
- Technical regression tests and edge cases use plain Playwright tests
- You want living documentation for the critical paths and fast tests for everything else
