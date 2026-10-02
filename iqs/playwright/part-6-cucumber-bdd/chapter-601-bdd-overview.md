# Chapter 601 — BDD with Cucumber & Playwright — Overview

> **Part 1 of 5 BDD chapters (81–85)**

This chapter covers Behaviour-Driven Development using CucumberJS and Playwright together. BDD is asked in interviews because it sits at the boundary of technical automation and business collaboration — interviewers want to know if you understand both the *why* (making tests readable to business) and the *how* (wiring Gherkin to Playwright). Questions progress from core Gherkin syntax and the Cucumber-Playwright setup, through the Custom World and POM integration, to hooks, profiles, reporting, and real project challenges.

---

## Q601.1 — What is BDD and why do teams use it?

BDD stands for Behaviour-Driven Development. It is a way of writing tests in plain English so that both technical and non-technical team members can read and understand them.

In BDD, you describe the expected behaviour of the system before you write the code to automate it. The description is written in a structured format called Gherkin, using keywords like `Feature`, `Scenario`, `Given`, `When`, and `Then`.

Teams use BDD for three reasons. First, it closes the gap between business requirements and test cases — a Gherkin scenario can be reviewed and approved by a product owner before any code is written. Second, it creates living documentation — the feature files describe what the system does, and they stay up to date because they are run as tests. Third, it forces testers to think about behaviour (what the system should do) rather than implementation (how to click a button).

---

## Q601.2 — What is Gherkin? What are its keywords?

Gherkin is the plain-English syntax used to write BDD scenarios. It gives structure to what would otherwise be free-form text.

The core keywords are:

- **Feature** — names the feature being tested. One feature file, one Feature.
- **Scenario** — a single test case. It has a name and a list of steps.
- **Background** — steps that run before every Scenario in the file (like `beforeEach`).
- **Given** — sets up the initial state before the action happens.
- **When** — describes the action the user takes.
- **Then** — describes the expected outcome after the action.
- **And / But** — continuation keywords. They replace repeating `Given`, `When`, or `Then`.
- **Scenario Outline** — a template Scenario with placeholders. Runs once per row in `Examples`.
- **Examples** — a table of data used with `Scenario Outline`.
- **@tagName** — a tag placed above a Feature or Scenario to allow filtering during execution.

```gherkin
@login
Feature: OrangeHRM Login

  Background:
    Given the user navigates to OrangeHRM login page

  Scenario: Successful login with valid credentials
    When the user enters username "testadmin"
    And the user enters password "Vibetestq@123"
    And the user clicks the login button
    Then the user should be redirected to the dashboard
    And the dashboard header should be visible
```

---

## Q601.3 — How do you set up Cucumber with Playwright in a TypeScript project?

You install `@cucumber/cucumber` as your test runner alongside `playwright` (the browser library, not `@playwright/test`). You use `ts-node` to run TypeScript without a compile step.

```bash
npm install --save-dev @cucumber/cucumber playwright ts-node typescript @types/node
npx playwright install chromium
```

Your `cucumber.js` config file tells Cucumber where to find feature files, step definitions, and support files:

```javascript
// cucumber.js
module.exports = {
  default: {
    requireModule: ['ts-node/register'],     // run TypeScript directly
    require: [
      'support/hooks.ts',
      'support/world.ts',
      'step-definitions/**/*.ts',
    ],
    features: ['features/**/*.feature'],
    format: [
      'progress-bar',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html',
    ],
    formatOptions: { snippetInterface: 'async-await' },
    publishQuiet: true,
    parallel: 1,
    worldParameters: {
      baseUrl: 'https://your-app.com',
      headless: false,
      slowMo: 100,
    },
  },
};
```

The key difference from `@playwright/test` is that Cucumber is the test runner, not Playwright. Playwright is used only as a browser automation library here.

---

## Q601.4 — How did you use Cucumber BDD in your project?

In our OrangeHRM project, we built a CucumberJS + Playwright + TypeScript BDD framework with two profiles — `default` (direct locators in step definitions) and `pom` (step definitions delegate to page objects).

Feature files covered login, employee management, and user management. Non-technical team members could read the `login.feature` file and immediately understand what each test does. The Background block handled navigation to the login page so every scenario started from a consistent state.

We used `worldParameters` in `cucumber.js` to centralise configuration — `baseUrl`, `headless`, and `slowMo` were all passed through `worldParameters`, which meant we never hard-coded URLs in step definitions. Switching from local to staging was one line change in `cucumber.js`.

For reporting, we integrated both `multiple-cucumber-html-reporter` and Allure. The Cucumber HTML report was shared with the business team; Allure was used by the development team for deeper failure analysis.

---

## Q601.5 — What is the Custom World in CucumberJS?

The World is a class that CucumberJS creates fresh for every Scenario. It is the shared context for all steps in a scenario — the browser, page, and any test state live on the World.

Without a custom World, step definitions cannot share browser state. With a custom World, every step in a scenario can access `this.page`, `this.browser`, and any other property you put on the class.

```typescript
// support/world.ts
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { IWorldOptions, World, setWorldConstructor } from '@cucumber/cucumber';

export class OrangeHRMWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  readonly baseUrl: string;
  readonly headless: boolean;

  constructor(options: IWorldOptions) {
    super(options);
    this.baseUrl = (options.parameters as any)?.baseUrl ?? '';
    this.headless = (options.parameters as any)?.headless ?? false;
  }

  async openBrowser(): Promise<void> {
    this.browser = await chromium.launch({ headless: this.headless });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async closeBrowser(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
  }
}

setWorldConstructor(OrangeHRMWorld);  // register with Cucumber
```

Step definitions access the World via `this`:

```typescript
Given('the user navigates to login page', async function (this: OrangeHRMWorld) {
  await this.page.goto(this.baseUrl);
});
```

The `setWorldConstructor` call at the bottom tells Cucumber to use your class instead of the default World.

---

## Q601.6 — What are Cucumber hooks and how do they differ from Playwright hooks?

Cucumber hooks run lifecycle code before or after scenarios and steps. They are different from Playwright's `beforeEach` / `afterEach` which are tied to the `@playwright/test` runner.

Cucumber has four hook levels:

| Hook | When it runs |
|------|-------------|
| `BeforeAll` | Once before the entire test suite |
| `AfterAll` | Once after the entire test suite |
| `Before` | Before every Scenario |
| `After` | After every Scenario |
| `BeforeStep` | Before every step |
| `AfterStep` | After every step |

In a Playwright BDD project, you open the browser in `Before` and close it in `After`:

```typescript
import { Before, After, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { OrangeHRMWorld } from './world';

setDefaultTimeout(60_000);  // step timeout — must be set here, not in cucumber.js

Before(async function (this: OrangeHRMWorld) {
  await this.openBrowser();
});

After(async function (this: OrangeHRMWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, 'image/png');  // attach to Cucumber report
  }
  await this.closeBrowser();
});
```

`this.attach()` is a method from the Cucumber World — it adds the screenshot to the Cucumber HTML report and Allure report for the failed scenario.

> 💡 **Interview Tip:** A common interview question is "Where do you set the timeout in Cucumber?" The answer is `setDefaultTimeout()` in a hooks file — not in `cucumber.js`. If you set it in `cucumber.js`, it is ignored for hooks and step definitions.

---

## Q601.7 — What is the difference between step-definitions and step-definitions-pom? Why have two folders?

This is a teaching pattern — two profiles that show the evolution from a direct locator approach to a Page Object Model approach.

**`step-definitions/`** — the direct approach. Locators live inside the step definition functions. The step definition talks directly to `this.page`:

```typescript
// step-definitions/login.steps.ts
When('the user enters username {string}', async function (this: OrangeHRMWorld, username: string) {
  await this.page.locator('input[name="username"]').fill(username);
});
```

**`step-definitions-pom/`** — the POM approach. Step definitions only call page object methods. Locators are in the page classes:

```typescript
// step-definitions-pom/login.steps.ts
When('the user enters username {string}', async function (this: POMWorld, username: string) {
  await this.loginPage.enterUsername(username);  // delegate to page object
});
```

The direct approach is easier to start with but harder to maintain. When a locator changes, you update it in every step definition that uses it. The POM approach is harder to set up but easier to maintain — a locator change happens in one page class, and all step definitions that call that method are automatically fixed.

---

## Q601.8 — What is POMWorld and how does it give step definitions access to page objects?

`POMWorld` extends the basic World and adds page object instances as properties. After the browser opens, it instantiates all page objects and stores them on `this`:

```typescript
// support/pom-world.ts
export class POMWorld extends World {
  loginPage!: LoginPage;
  dashboardPage!: DashboardPage;
  employeeListPage!: EmployeeListPage;
  addEmployeePage!: AddEmployeePage;

  async openBrowser(): Promise<void> {
    // ... launch browser, create context and page ...
    this.initPages();  // create page objects after page exists
  }

  private initPages(): void {
    this.loginPage = new LoginPage(this.page);
    this.dashboardPage = new DashboardPage(this.page);
    this.employeeListPage = new EmployeeListPage(this.page);
    this.addEmployeePage = new AddEmployeePage(this.page);
  }
}
```

Step definitions type `this` as `POMWorld` to get TypeScript autocomplete:

```typescript
When('the user clicks the login button', async function (this: POMWorld) {
  await this.loginPage.clickLogin();  // TypeScript knows loginPage exists
});
```

This is Cucumber's equivalent of Playwright's custom fixtures. Instead of injecting page objects via fixture parameters, you put them on the World and access via `this`.

---

## Q601.9 — What is a Scenario Outline and when do you use it?

A `Scenario Outline` is a template scenario that runs once for each row in its `Examples` table. Placeholders in angle brackets (`<firstName>`) are replaced by column values at runtime.

```gherkin
Scenario Outline: Add multiple employees
  When the user clicks on Add Employee button
  And the user enters first name "<firstName>"
  And the user enters last name "<lastName>"
  And the user saves the new employee
  Then the employee profile page should be displayed

  Examples:
    | firstName | lastName  |
    | Alice     | Johnson   |
    | Bob       | Williams  |
    | Carol     | Brown     |
```

This creates three separate test runs — one for Alice Johnson, one for Bob Williams, one for Carol Brown. The step definition receives the actual value as a string parameter.

Use `Scenario Outline` when the same workflow needs to be tested with different data. Common examples: login with multiple usernames, form validation with different invalid inputs, creating records with different field combinations.

---

## Q601.10 — What is a Background in Gherkin? How is it different from a hook?

A `Background` is a set of Given steps that run before every Scenario in the same feature file. It is part of the feature file, not code.

```gherkin
Feature: OrangeHRM Employee Management

  Background:
    Given the user is logged in as "testadmin" with password "Vibetestq@123"
    And the user navigates to PIM module
```

Every Scenario in this file starts already logged in and on the PIM page.

**Background vs Before hook:**

| | Background | Before hook |
|--|------------|-------------|
| Where defined | Feature file (Gherkin) | TypeScript hooks file |
| Visible to business team | Yes | No |
| Scope | One feature file | All scenarios (unless tagged) |
| Can use step definitions | Yes | Direct code |
| Reported as steps | Yes — visible in report | No |

Use `Background` for setup that is part of the business scenario (it belongs in the feature file because it describes context). Use `Before` hooks for technical setup that is not part of the business scenario (opening the browser, setting timeouts).

---

## Q601.11 — What is wrong with this step definition?

```typescript
// ❌ COMMON MISTAKE — hard-coded credentials in step definition
Given('the user is logged in', async function (this: OrangeHRMWorld) {
  await this.page.goto('https://vibetestq-osondemand.orangehrm.com/auth/login');
  await this.page.locator('input[name="username"]').fill('testadmin');
  await this.page.locator('input[name="password"]').fill('Vibetestq@123');
  await this.page.locator('button[type="submit"]').click();
});
```

Three problems. First, the URL is hard-coded — if the environment changes, this step breaks. Second, the credentials are hard-coded in code. Third, this step can only log in as one user — it cannot be reused for different roles.

```typescript
// ✅ CORRECT APPROACH — parameterised step with World config
Given(
  'the user is logged in as {string} with password {string}',
  async function (this: OrangeHRMWorld, username: string, password: string) {
    await this.navigateTo('/');                              // baseUrl from World
    await this.page.locator('input[name="username"]').fill(username);
    await this.page.locator('input[name="password"]').fill(password);
    await this.page.locator('button[type="submit"]').click();
    await this.page.waitForURL('**/dashboard/index', { timeout: 15000 });
  }
);
```

The URL comes from `this.baseUrl` via `navigateTo()`. Credentials come from the feature file as parameters. The same step works for admin users and ESS users.

---

## Q601.12 — How does the Cucumber BDD approach compare to native Playwright Test?

| | CucumberJS + Playwright | @playwright/test (native) |
|-|------------------------|--------------------------|
| Test runner | CucumberJS | Playwright Test |
| Test format | Gherkin feature files | TypeScript test files |
| Business readability | High — non-technical team can read | Low — TypeScript only |
| Parallel execution | `parallel: N` in cucumber.js | `workers: N`, `fullyParallel: true` |
| Fixtures | Custom World + hooks | Built-in fixture DI system |
| Reporters | Cucumber HTML, Allure, JSON | HTML, JSON, JUnit, Allure |
| Trace Viewer | Not built-in | Built-in |
| Auto-waiting | Manual (Playwright API) | Same — Playwright API |
| Setup cost | Higher (World, hooks wiring) | Lower |
| Maintenance | Higher (two layers: Gherkin + code) | Lower |

**Use CucumberJS when:** the team includes non-technical stakeholders who will read or approve feature files, or the project follows a BDD process where acceptance criteria are written in Gherkin.

**Use native Playwright Test when:** the team is entirely technical, and the priority is speed, simplicity, and full access to Playwright Test's features (sharding, trace viewer, built-in fixtures).

---

## Q601.13 — Write the step definition for a Scenario Outline with Examples

Feature file:
```gherkin
Scenario Outline: Add multiple employees
  When the user clicks on Add Employee button
  And the user enters first name "<firstName>"
  And the user enters last name "<lastName>"
  And the user saves the new employee
  Then the employee profile page should be displayed

  Examples:
    | firstName | lastName |
    | Alice     | Johnson  |
    | Bob       | Williams |
```

Step definition:
```typescript
import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { OrangeHRMWorld } from '../support/world';

When('the user enters first name {string}',
  async function (this: OrangeHRMWorld, firstName: string) {
    await this.page.locator('input[name="firstName"]').fill(firstName);
  }
);

When('the user enters last name {string}',
  async function (this: OrangeHRMWorld, lastName: string) {
    await this.page.locator('input[name="lastName"]').fill(lastName);
  }
);

When('the user saves the new employee',
  async function (this: OrangeHRMWorld) {
    await this.page.locator('button[type="submit"]:has-text("Save")').click();
    await this.page.waitForLoadState('networkidle');
  }
);

Then('the employee profile page should be displayed',
  async function (this: OrangeHRMWorld) {
    await this.page.waitForURL('**/pim/viewPersonalDetails**', { timeout: 15000 });
    await expect(this.page.locator('.orangehrm-main-title')).toBeVisible();
  }
);
```

Cucumber runs these step definitions three times — once for Alice Johnson, once for Bob Williams. The `{string}` parameter in the step definition receives the value from the `Examples` table for each run.

---

## Q601.14 — How do you use tags to run a subset of tests?

Tags in Gherkin start with `@`. You place them above a `Feature`, `Scenario`, or `Scenario Outline`.

```gherkin
@login
Feature: OrangeHRM Login

  Scenario: Successful login
    ...

@employee @smoke
  Scenario: Add a new employee
    ...
```

You run tagged tests using `--tags` in the CLI or in `package.json` scripts:

```bash
# Run only @login tests
npx cucumber-js --tags "@login"

# Run tests tagged @smoke
npx cucumber-js --tags "@smoke"

# Run @employee tests but exclude @slow
npx cucumber-js --tags "@employee and not @slow"

# Run @smoke or @regression
npx cucumber-js --tags "@smoke or @regression"
```

In `package.json`:
```json
{
  "scripts": {
    "test:login":    "cucumber-js --config cucumber.js --tags \"@login\"",
    "test:employee": "cucumber-js --config cucumber.js --tags \"@employee\"",
    "test:smoke":    "cucumber-js --config cucumber.js --tags \"@smoke\""
  }
}
```

Tags are also used in `Before`/`After` hooks to apply setup only to certain scenarios:

```typescript
Before({ tags: '@employee' }, async function (this: OrangeHRMWorld) {
  // Only runs before scenarios tagged @employee
  await this.loginAsAdmin();
});
```

---

## Q601.15 — How do you integrate Allure reporting with CucumberJS?

Install the Allure Cucumber adapter:
```bash
npm install --save-dev allure-cucumberjs allure-commandline
```

Add the Allure reporter to the `format` array in `cucumber.js`:

```javascript
format: [
  'progress-bar',
  'json:reports/cucumber-report.json',
  'allure-cucumberjs/reporter',        // writes to allure-results/
],
formatOptions: {
  snippetInterface: 'async-await',
  resultsDir: 'allure-results',        // where Allure writes its raw results
},
```

Generate and open the report:

```bash
# Generate the HTML report from raw results
npx allure generate allure-results --clean -o allure-report

# Open in browser
npx allure open allure-report

# Or serve live (combines generate + open)
npx allure serve allure-results
```

Allure picks up feature names, scenario names, steps, tags, and attachments (screenshots, logs) automatically from the Cucumber adapter.

---

## Q601.16 — How do you debug a failing Cucumber + Playwright test?

Four approaches, in order of usefulness.

**Step 1 — Read the Cucumber HTML report.** The report shows exactly which step failed, what the error message was, and the screenshot attached in the `After` hook. Start here before opening any other tool.

**Step 2 — Run with slowMo.** Set `slowMo: 500` in `worldParameters` in `cucumber.js`. The browser slows down and you can see what is happening before the failure.

**Step 3 — Run headed.** Set `headless: false` in `worldParameters` (or use `cross-env HEADLESS=false`). Watch the browser during the failing scenario.

**Step 4 — Add Playwright trace.** In your `Before` hook, start a trace. In your `After` hook, save it on failure:

```typescript
Before(async function (this: OrangeHRMWorld) {
  await this.openBrowser();
  await this.context.tracing.start({ screenshots: true, snapshots: true });
});

After(async function (this: OrangeHRMWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    await this.context.tracing.stop({
      path: `reports/traces/${scenario.pickle.name}.zip`
    });
    const screenshot = await this.takeScreenshot();
    await this.attach(screenshot, 'image/png');
  }
  await this.closeBrowser();
});
```

Open the trace:
```bash
npx playwright show-trace "reports/traces/Successful login.zip"
```

---

## Q601.17 — Describe a real challenge you faced in your Cucumber BDD project

In our OrangeHRM BDD project, we hit a problem with the autocomplete employee name field on the Add User form. The Gherkin step was `And the user selects employee name "John Doe"`, but the field was a dynamic autocomplete widget — it showed suggestions as you typed, and you had to click one to set the value.

The first attempt just filled the input directly. The autocomplete dropdown appeared but `fill()` moved to the next step before we clicked the suggestion, so the employee name was never properly set. The form saved but the employee field was blank.

We fixed it with a wait-and-fallback pattern in the step definition:

```typescript
When('the user selects employee name {string}',
  async function (this: OrangeHRMWorld, employeeName: string) {
    const input = this.page.locator('.oxd-form-row:has(.oxd-label:text("Employee Name")) input');
    await input.fill(employeeName.split(' ')[0]);   // type first name only to trigger suggestions
    await this.page.waitForTimeout(1500);            // wait for suggestions to load

    const exactMatch = this.page.locator(`.oxd-autocomplete-option:has-text("${employeeName}")`).first();
    const exactVisible = await exactMatch.isVisible().catch(() => false);
    if (exactVisible) {
      await exactMatch.click();
    } else {
      // Fallback: click first suggestion if exact match not found
      const first = this.page.locator('.oxd-autocomplete-option').first();
      if (await first.isVisible().catch(() => false)) await first.click();
    }
  }
);
```

The lesson: dynamic UI components in step definitions need more defensive code than static inputs. The fallback pattern prevented the test from failing silently on environments where the test data name differed slightly.

> 💡 **Interview Tip:** This type of question is testing whether you have actually built a BDD framework, not just read about one. If you describe a real, specific problem — autocomplete dropdowns, timing issues, multi-profile setups — the interviewer knows you have done this work.

---

## Q601.18 — How does your team manage the two Cucumber profiles (default vs pom)?

In our project, the `default` profile uses direct locators in step definitions and the `pom` profile delegates to page objects. Both profiles share the same feature files — the Gherkin never changes, only the implementation layer below it changes.

We use the `default` profile to onboard new team members. It is easier to follow because each step definition is self-contained — you see the locator and the action in the same function. New team members can trace what a test does without jumping between files.

The `pom` profile is what we use in CI and for production runs. It is more maintainable — locator changes happen in one page class rather than across multiple step definition files.

The two profiles are defined in `cucumber.js` using the `module.exports` object:

```javascript
module.exports = {
  default: { require: ['support/world.ts', 'step-definitions/**/*.ts'], ... },
  pom:     { require: ['support/pom-world.ts', 'step-definitions-pom/**/*.ts'], ... },
};
```

Running the POM profile: `npm run test:pom` which maps to `cucumber-js --profile pom`.

For new frameworks, we skip the `default` profile entirely and start with POM. The two-profile approach was a teaching tool — in a production project, you pick one approach and commit to it.

---

## Chapter Summary — Key Points for Your Interview

- BDD uses Gherkin (Given/When/Then) to write test scenarios in plain English so business and tech teams can read them together.
- CucumberJS is the test runner; Playwright is the browser library — they are separate. You wire them together through the Custom World and hooks.
- The Custom World (`setWorldConstructor`) gives every scenario its own browser, page, and config. Step definitions access these via `this`.
- `Before` / `After` hooks open and close the browser per scenario. `setDefaultTimeout()` must be called in the hooks file — not in `cucumber.js`.
- Use `Background` for setup steps that are part of the business scenario (visible in the feature file). Use `Before` hooks for technical setup (browser launch).
- `Scenario Outline` + `Examples` runs one scenario with multiple data sets — use it for data-driven tests.
- Tags (`@login`, `@smoke`) filter which scenarios run. Combine with `--tags` CLI or `package.json` scripts.
- Use POM approach in `step-definitions-pom/` — step definitions call page object methods; locators never appear in step definitions.
- For debugging: Cucumber HTML report first → slowMo → headed → Playwright trace in `After` hook.
- In interviews: mention `worldParameters` for centralised config, the two-profile approach for teaching vs production, and the autocomplete / dynamic field challenge as a real project story.
