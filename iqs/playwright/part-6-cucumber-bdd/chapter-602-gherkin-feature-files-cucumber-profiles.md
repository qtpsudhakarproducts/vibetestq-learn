# Chapter 602 — Gherkin Feature Files & Cucumber Profiles

This chapter covers writing Gherkin feature files and organising Cucumber runs with profiles. Interviewers ask these questions because feature files are the public face of a BDD framework — they judge whether you can write Gherkin that is genuinely readable to the business, not just test code dressed in Given/When/Then. Questions progress from Gherkin syntax through feature file structure, tag strategy, and the multi-profile pattern from the OrangeHRM BDD project.

---

## Q602.1 — What is a feature file and what does it contain?

A feature file is a plain-text file with a `.feature` extension that describes the behaviour of one part of your application. It is written in Gherkin — a structured language that uses keywords to give format to plain English sentences.

Every feature file contains:
- One `Feature` keyword at the top with a name and optional description
- One or more `Scenario` or `Scenario Outline` blocks
- Optionally, a `Background` block that runs before each scenario
- Optionally, tags (`@tagName`) above `Feature` or `Scenario`

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

Feature files live in the `features/` folder. They are the contract between the business and the automation team — if the behaviour changes, the feature file changes too.

---

## Q602.2 — What are the Gherkin step keywords and what is each for?

Gherkin has five step keywords. Each represents a different role in the scenario.

**Given** sets up the starting state before anything happens. It describes what is already true when the scenario begins. Example: `Given the user is logged in as "testadmin"`.

**When** describes the action the user takes — the trigger for the behaviour being tested. Example: `When the user clicks the login button`.

**Then** describes the expected result after the action. This is where assertions happen. Example: `Then the user should be redirected to the dashboard`.

**And** and **But** are continuation keywords. They replace repeating the same keyword on consecutive steps. `And` continues in the same direction; `But` introduces a contrast.

```gherkin
Scenario: Failed login with invalid credentials
  When the user enters username "invalid_user"     # action
  And the user enters password "wrong_password"    # And = another When
  And the user clicks the login button             # And = another When
  Then an error message should be displayed        # assertion
```

The keyword itself does not affect what Cucumber runs — `Given`, `When`, `Then`, `And`, `But` all map to step definitions the same way. The keywords exist for human readability only.

---

## Q602.3 — What is a Background block and when should you use it?

`Background` is a set of steps that run before every `Scenario` in the same feature file. It is Gherkin's equivalent of `beforeEach`, but written in plain English and visible in the feature file.

In the OrangeHRM employee management feature, every scenario requires the user to be logged in and on the PIM module:

```gherkin
Feature: OrangeHRM Employee Management

  Background:
    Given the user is logged in as "testadmin" with password "Vibetestq@123"
    And the user navigates to PIM module

  Scenario: Add a new employee with mandatory fields
    When the user clicks on Add Employee button
    And the user enters first name "John"
    And the user enters last name "Doe"
    And the user saves the new employee
    Then the employee profile page should be displayed

  Scenario: Search for an existing employee by name
    When the user is on the Employee List page
    And the user enters search name "John"
    ...
```

Without `Background`, the login steps would be repeated at the start of every scenario — six scenarios means six copies of the same two setup steps.

**When to use Background:**
- Setup steps are the same for every scenario in the file
- The setup is part of the business context (visible in the report)
- The file has three or more scenarios that all need the same starting state

**When NOT to use Background:**
- Only one or two scenarios need the setup
- Different scenarios need different starting states
- The setup is purely technical (opening a browser — use a `Before` hook instead)

---

## Q602.4 — How did you structure feature files in your OrangeHRM project?

In our project we created one feature file per module: `login.feature`, `employee-management.feature`, and `user-management.feature`. This keeps each file focused on one area of the application and matches how the team organised their work.

The `login.feature` used `Background` because every login scenario starts on the same page — the login page. The background step navigates there so each scenario can immediately start the action.

The `employee-management.feature` used `Background` for the login and PIM navigation steps, because every employee scenario assumes the user is already logged in and on the employee list. This saved repeating those two steps across six scenarios.

We placed a `@login`, `@employee`, or `@user-management` tag on each `Feature`. This let us run a single module with `npm run test:login` or `npm run test:employee` from `package.json`, without needing to comment out files or change any code.

The feature files were the first thing we showed business stakeholders. They could read the scenarios and confirm whether they matched the requirements — before we wrote a single line of step definition code.

---

## Q602.5 — What is a Scenario Outline and how does it differ from a regular Scenario?

A `Scenario` runs once with fixed values written directly in the steps. A `Scenario Outline` is a template — it uses placeholders in angle brackets and runs once for each row in its `Examples` table.

```gherkin
# Regular Scenario — runs once, fixed data
Scenario: Add a new employee with mandatory fields
  When the user clicks on Add Employee button
  And the user enters first name "John"
  And the user enters last name "Doe"
  And the user saves the new employee
  Then the employee profile page should be displayed

# Scenario Outline — runs three times, one per Examples row
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

Cucumber replaces `<firstName>` with `Alice`, `Bob`, `Carol` in successive runs. The step definition receives the actual value as a string — it never sees the placeholder name.

**Use Scenario Outline when:**
- The same workflow needs testing with multiple data combinations
- You want to test boundary values (valid input, invalid input, empty input)
- You need to create multiple test records with different field values

**Use regular Scenario when:**
- The test is unique — the specific data is part of what makes the test meaningful
- The scenario is testing a one-off edge case

---

## Q602.6 — How does the Examples table work with step definitions?

The `Examples` table maps column headers to `{string}` parameters in step definitions. Cucumber reads each row, substitutes the placeholders, then finds and runs the matching step definition.

Feature file:
```gherkin
Scenario Outline: Add multiple employees
  And the user enters first name "<firstName>"
  And the user enters last name "<lastName>"

  Examples:
    | firstName | lastName |
    | Alice     | Johnson  |
    | Bob       | Williams |
```

Step definition:
```typescript
When('the user enters first name {string}',
  async function (this: OrangeHRMWorld, firstName: string) {
    // firstName = "Alice" on first run, "Bob" on second run
    await this.page.locator('input[name="firstName"]').fill(firstName);
  }
);
```

The `{string}` expression in the step definition matches text in double quotes in the feature file. When Cucumber runs the `Scenario Outline`, it runs the full scenario twice — first with `firstName="Alice"` and `lastName="Johnson"`, then with `firstName="Bob"` and `lastName="Williams"`.

Each run is a separate test in the report. If Alice's run passes and Bob's fails, the report shows one pass and one failure.

---

## Q602.7 — What are tags in Cucumber and how do you use them for selective execution?

Tags are labels you add to a `Feature`, `Scenario`, or `Scenario Outline` using `@` prefix. They do not change how the test runs — they add metadata that Cucumber uses for filtering.

From the OrangeHRM project:

```gherkin
@login
Feature: OrangeHRM Login
  ...

@employee
Feature: OrangeHRM Employee Management
  ...

@user-management
Feature: OrangeHRM User Management
  ...
```

You run tests by tag with `--tags`:

```bash
# Run only login tests
npx cucumber-js --tags "@login"

# Run login OR employee tests
npx cucumber-js --tags "@login or @employee"

# Run employee tests but exclude slow ones
npx cucumber-js --tags "@employee and not @slow"
```

In `package.json`, each tag maps to a named script:

```json
{
  "scripts": {
    "test":         "cucumber-js --config cucumber.js",
    "test:login":   "cucumber-js --config cucumber.js --tags \"@login\"",
    "test:employee":"cucumber-js --config cucumber.js --tags \"@employee\"",
    "test:user":    "cucumber-js --config cucumber.js --tags \"@user-management\""
  }
}
```

Tags can also control hooks — you can make a `Before` hook run only for `@employee` scenarios:

```typescript
Before({ tags: '@employee' }, async function (this: POMWorld) {
  // Only runs before @employee scenarios
});
```

---

## Q602.8 — What is wrong with this feature file step design?

```gherkin
# ❌ COMMON MISTAKE — implementation details in Gherkin
Scenario: Create a new Admin user
  When the user clicks the button with class "oxd-button--secondary"
  And the user fills input[name="username"] with "john.admin"
  And the user selects .oxd-select-wrapper option "Admin"
  Then the .oxd-toast--success element should be visible
```

This breaks the purpose of BDD. The steps expose CSS selectors and technical details — a business stakeholder reading this learns nothing about what the system should do. It is also fragile: if a class name changes, the Gherkin breaks.

```gherkin
# ✅ CORRECT APPROACH — business behaviour, no technical details
Scenario: Create a new Admin user
  When the user clicks on Add User button
  And the user selects user role "Admin"
  And the user enters new username "john.doe.admin"
  And the user selects status "Enabled"
  And the user enters user password "Admin@1234"
  And the user confirms the password "Admin@1234"
  And the user saves the new user
  Then a success toast message should be visible
  And the user list page should be displayed
```

The technical details (CSS selectors, element types) belong in step definitions and page objects — not in feature files. Gherkin describes *what* the user does and *what* should happen, never *how* the code finds an element.

---

## Q602.9 — What is a Cucumber profile and why would you have more than one?

A Cucumber profile is a named configuration block in `cucumber.js`. Each profile tells Cucumber which support files, step definitions, and formatters to use for that run. You select a profile at runtime with `--profile`.

The OrangeHRM project defines two profiles in `cucumber.js`:

```javascript
module.exports = {
  default: {
    require: ['support/hooks.ts', 'support/world.ts', 'step-definitions/**/*.ts'],
    features: ['features/**/*.feature'],
    // ...
  },
  pom: {
    require: ['support/pom-hooks.ts', 'support/pom-world.ts', 'step-definitions-pom/**/*.ts'],
    features: ['features/**/*.feature'],
    // ...
  },
};
```

Both profiles run the same feature files — the Gherkin never changes. What changes is the implementation: `default` uses direct Playwright locators in step definitions; `pom` delegates everything to page objects.

You run them with:
```bash
npm test               # default profile
npm run test:pom       # pom profile
```

You would have multiple profiles when:
- Teaching — one profile shows the simple approach, one shows the production approach
- Environments — a `local` profile runs headed, a `ci` profile runs headless with more retries
- Scope — a `smoke` profile runs `@smoke` tagged tests; a `regression` profile runs everything

---

## Q602.10 — What is the difference between `default` and `pom` profiles in this project?

Both profiles share the same feature files. The difference is in what handles each step.

| | `default` profile | `pom` profile |
|-|-------------------|---------------|
| World | `OrangeHRMWorld` | `POMWorld` |
| Hooks | `support/hooks.ts` | `support/pom-hooks.ts` |
| Step definitions | `step-definitions/` | `step-definitions-pom/` |
| Locators live in | Step definition functions | Page object classes |
| Page objects used | No | Yes |

In `default`, a step definition interacts directly with the page:
```typescript
// step-definitions/login.steps.ts
When('the user enters username {string}', async function (this: OrangeHRMWorld, username: string) {
  await this.page.locator('input[name="username"]').fill(username);  // locator here
});
```

In `pom`, the step definition delegates to a page object:
```typescript
// step-definitions-pom/login.steps.ts
When('the user enters username {string}', async function (this: POMWorld, username: string) {
  await this.loginPage.enterUsername(username);  // no locator here
});
```

The `pom` profile is the production pattern. The `default` profile exists as a learning baseline — it is easier to read when you are new to BDD because everything is in one place.

---

## Q602.11 — How does `worldParameters` in cucumber.js centralise configuration?

`worldParameters` is a key in the Cucumber profile config. Whatever you put there is passed to every World instance as `options.parameters`. This is how you avoid hard-coding URLs, credentials, and settings inside step definitions.

```javascript
// cucumber.js
module.exports = {
  default: {
    // ...
    worldParameters: {
      baseUrl: 'https://vibetestq-osondemand.orangehrm.com/auth/login',
      headless: false,
      slowMo: 100,
    },
  },
};
```

In the World class, you read these parameters in the constructor:
```typescript
export class OrangeHRMWorld extends World {
  readonly baseUrl: string;
  readonly headless: boolean;
  readonly slowMo: number;

  constructor(options: OrangeHRMWorldOptions) {
    super(options);
    this.baseUrl  = options.parameters?.baseUrl  ?? '';
    this.headless = options.parameters?.headless ?? false;
    this.slowMo   = options.parameters?.slowMo   ?? 0;
  }
}
```

Step definitions never reference a URL. They call `this.navigateTo('/')`, which uses `this.baseUrl` internally. To switch from local to staging, you change one line in `cucumber.js` — nothing else changes.

You can also override `worldParameters` at runtime with environment variables for CI:

```bash
# Headless CI run
cross-env HEADLESS=true cucumber-js --config cucumber.js
```

In the World constructor, check the environment variable as a fallback:
```typescript
this.headless = process.env.HEADLESS === 'true' || (options.parameters?.headless ?? false);
```

---

## Q602.12 — How does this Gherkin setup compare to Playwright Test's native approach?

In Playwright Test (`@playwright/test`), test parameters live in `playwright.config.ts`:

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL ?? 'https://localhost:3000',
  },
});
```

In Cucumber, they live in `cucumber.js` as `worldParameters`. Both achieve the same thing — centralised, environment-aware configuration — but the mechanism is different.

| | Cucumber + `worldParameters` | Playwright Test config |
|-|-------------------------------|----------------------|
| Config file | `cucumber.js` | `playwright.config.ts` |
| Access in tests | `this.baseUrl` (via World) | `baseURL` (via `use` config or fixture) |
| Multi-profile support | Named profiles in `module.exports` | Named projects in `projects` array |
| Runtime override | `cross-env` + `process.env` | `process.env` in config |
| Feature files | Gherkin `.feature` files | TypeScript `test()` functions |

The key difference is that Playwright Test's config is injected automatically through the fixture system — you just use `{ page }` and `baseURL` is already applied. In Cucumber, you wire everything yourself through the World class.

---

## Q602.13 — Write a feature file for a search scenario with reset functionality

```gherkin
@user-management
Feature: OrangeHRM User Management

  Background:
    Given the user is logged in as "testadmin" with password "Vibetestq@123"
    And the user navigates to Admin module

  Scenario: Search user by username
    When the user is on the User Management page
    And the user enters username to search "john.doe.admin"
    And the user clicks the search button
    Then the user list should display results
    And the username "john.doe.admin" should appear in the results

  Scenario: Search user by user role
    When the user is on the User Management page
    And the user selects user role filter "Admin"
    And the user clicks the search button
    Then the user list should display results
    And all displayed users should have role "Admin"

  Scenario: Search user returns no results
    When the user is on the User Management page
    And the user enters username to search "zzz_nonexistent_user_999"
    And the user clicks the search button
    Then the no records found message should be displayed

  Scenario: Reset user search filters
    When the user is on the User Management page
    And the user enters username to search "someuser"
    And the user clicks the reset button
    Then the search filters should be cleared
```

Key design decisions: the `Background` handles login and navigation — every user management scenario starts from the same place. Each `Scenario` covers one specific behaviour. The reset scenario verifies the Reset button clears the filter — this is tested separately because it is a distinct user action with a distinct expected outcome.

---

## Q602.14 — How do you run a specific feature file or scenario by name?

Three ways to target specific tests:

**By tag** (most common):
```bash
npx cucumber-js --tags "@login"
npx cucumber-js --profile pom --tags "@employee"
```

**By feature file path**:
```bash
npx cucumber-js features/login.feature
npx cucumber-js features/employee-management.feature
```

**By scenario name** (using `--name` with a regex):
```bash
# Run scenarios whose name contains "Add a new employee"
npx cucumber-js --name "Add a new employee"

# Run scenarios matching a pattern
npx cucumber-js --name ".*invalid.*"
```

**By line number** (run one specific scenario):
```bash
# Run only the scenario that starts at line 12
npx cucumber-js features/login.feature:12
```

In `package.json`, the OrangeHRM project uses tag-based scripts as the standard approach:
```json
{
  "test:login":    "cucumber-js --config cucumber.js --tags \"@login\"",
  "test:employee": "cucumber-js --config cucumber.js --tags \"@employee\"",
  "test:user":     "cucumber-js --config cucumber.js --tags \"@user-management\""
}
```

---

## Q602.15 — How do you write a Scenario Outline step definition for multiple employees?

Feature file:
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

POM step definitions (from `step-definitions-pom/employee.steps.ts`):
```typescript
import { When, Then } from '@cucumber/cucumber';
import { POMWorld } from '../support/pom-world';

When('the user clicks on Add Employee button',
  async function (this: POMWorld) {
    await this.employeeListPage.clickAddEmployee();
    // navigates to /pim/addEmployee and waits for networkidle
  }
);

When('the user enters first name {string}',
  async function (this: POMWorld, firstName: string) {
    // firstName receives "Alice", "Bob", "Carol" in successive runs
    await this.addEmployeePage.enterFirstName(firstName);
  }
);

When('the user enters last name {string}',
  async function (this: POMWorld, lastName: string) {
    await this.addEmployeePage.enterLastName(lastName);
  }
);

When('the user saves the new employee',
  async function (this: POMWorld) {
    await this.addEmployeePage.saveEmployee();
  }
);

Then('the employee profile page should be displayed',
  async function (this: POMWorld) {
    await this.addEmployeePage.verifyEmployeeProfileDisplayed();
    // waits for URL to match **/pim/viewPersonalDetails**
  }
);
```

Cucumber runs this block three times. Each run gets a fresh World — a fresh browser context — because `Before` opens the browser and `After` closes it per scenario. There is no state leak between Alice's run and Bob's run.

---

## Chapter Summary — Key Points for Your Interview

- A feature file has one Feature, an optional Background, and multiple Scenarios. Tags at Feature or Scenario level enable selective execution.
- `Background` runs before every Scenario in the same file — use it when setup steps are part of the business context, not for browser launch (that is a `Before` hook).
- `Scenario Outline` + `Examples` runs a template scenario once per data row — use it for data-driven tests. Each run is a separate test in the report.
- Tags (`@login`, `@employee`, `@smoke`) let you run subsets with `--tags`. Boolean operators (`and`, `or`, `not`) compose tag expressions.
- Cucumber profiles in `cucumber.js` let you switch between implementation approaches (direct vs POM) or environments (local vs CI) without changing feature files.
- `worldParameters` in `cucumber.js` centralises `baseUrl`, `headless`, and `slowMo` — step definitions never hard-code URLs or settings.
- Keep Gherkin at business language level — no CSS selectors, no class names, no element types in feature files.
