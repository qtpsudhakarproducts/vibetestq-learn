# Chapter 604 — Step Definitions & POM in BDD

This chapter covers step definitions — how they are written, matched, typed, and organised — and how the Page Object Model integrates into a BDD framework. Interviewers ask these questions to check that you understand the two-layer architecture of a BDD framework: Gherkin (the language) maps to step definitions (the glue), which delegate to page objects (the implementation). Questions progress from basic step definition structure through parameter expressions, the `this` typing pattern, and the full comparison of direct-locator vs POM approaches.

---

## Q604.1 — What is a step definition and how does it connect to a Gherkin step?

A step definition is a TypeScript function that Cucumber runs when it matches a step in a feature file. The connection is made by a string pattern — the text in the step definition must match the text in the feature file step.

Feature file step:
```gherkin
When the user enters username "testadmin"
```

Step definition:
```typescript
import { When } from '@cucumber/cucumber';
import { OrangeHRMWorld } from '../support/world';

When('the user enters username {string}',
  async function (this: OrangeHRMWorld, username: string) {
    await this.page.locator('input[name="username"]').fill(username);
  }
);
```

`{string}` in the pattern matches text in double quotes in the feature file — `"testadmin"` in this case. Cucumber captures it and passes it as the `username` parameter to the function.

If no step definition matches a step, Cucumber prints a snippet showing you what to write and marks the scenario as `Pending`.

---

## Q604.2 — What are Cucumber Expression parameters and how do they work?

Cucumber Expressions are the patterns inside step definition strings. They are simpler than regular expressions and easier to read.

The built-in parameter types are:

| Expression | Matches | TypeScript type |
|-----------|---------|-----------------|
| `{string}` | Text in double or single quotes | `string` |
| `{int}` | A whole number | `number` |
| `{float}` | A decimal number | `number` |
| `{word}` | A single word (no spaces) | `string` |

In the OrangeHRM project, all parameters use `{string}` because every value passed through Gherkin is quoted text:

```gherkin
When the user enters username "testadmin"
And the user selects user role "Admin"
And the user enters new username "john.doe.admin"
```

Step definitions:
```typescript
When('the user enters username {string}',
  async function (this: OrangeHRMWorld, username: string) { ... }
);

When('the user selects user role {string}',
  async function (this: OrangeHRMWorld, role: string) { ... }
);
```

You can also use raw regular expressions as the pattern:
```typescript
When(/the user enters (\w+) "([^"]+)"/, async function (field, value) { ... });
```

Cucumber Expressions are preferred — they are more readable and the parameter types enforce correct TypeScript types automatically.

---

## Q604.3 — How do you type `this` in a step definition?

In TypeScript, `this` inside a step definition function is typed by annotating it as the first parameter with the name `this`. TypeScript treats this as a type annotation, not a real parameter — Cucumber never passes a value for it.

```typescript
import { OrangeHRMWorld } from '../support/world';

When('the user clicks the login button',
  async function (this: OrangeHRMWorld) {
    // TypeScript knows this.page, this.baseUrl, this.openBrowser() exist
    await this.page.locator('button[type="submit"]').click();
    await this.page.waitForLoadState('networkidle');
  }
);
```

Without typing `this`, TypeScript gives it the type `World` (the base class) — which does not have `page`, `browser`, or any custom methods. You get type errors when trying to use `this.page`.

In the pom profile, step definitions type `this` as `POMWorld`:

```typescript
import { POMWorld } from '../support/pom-world';

When('the user clicks the login button',
  async function (this: POMWorld) {
    // TypeScript knows this.loginPage, this.dashboardPage etc. exist
    await this.loginPage.clickLogin();
  }
);
```

This is why the two profiles have separate step definition folders — the `this` type is different, and TypeScript would give errors if you mixed `OrangeHRMWorld` and `POMWorld` types in the same step definition.

---

## Q604.4 — How did you organise step definitions in your OrangeHRM project?

We split step definitions by feature — one file per feature area, mirroring the feature file structure:

```
step-definitions/
  login.steps.ts           ← steps for features/login.feature
  employee.steps.ts        ← steps for features/employee-management.feature
  user-management.steps.ts ← steps for features/user-management.feature

step-definitions-pom/
  login.steps.ts           ← same steps, POM implementation
  employee.steps.ts
  user-management.steps.ts
```

Cucumber loads all files matching `step-definitions/**/*.ts` and registers all their step definitions together. There is no explicit linking between a feature file and a step definition file — Cucumber matches step text globally.

Within each file, we grouped steps by their role using comment banners:
```typescript
// ─── NAVIGATION ─────────────────────────────────────────────
// ─── ACTIONS ────────────────────────────────────────────────
// ─── ASSERTIONS ─────────────────────────────────────────────
```

This made it easy to find any step — navigation steps (login, module nav) at the top, interaction steps (fill, click, select) in the middle, assertion steps (verifyVisible, toContainText) at the bottom.

---

## Q604.5 — What happens if a step definition pattern matches multiple steps?

Cucumber throws an error — `Ambiguous step definitions`. If two step definitions could match the same step text, Cucumber cannot decide which one to use.

Example of an ambiguous match:
```typescript
// Pattern 1 — matches "the user enters username "testadmin""
When('the user enters username {string}', ...);

// Pattern 2 — also matches "the user enters username "testadmin""
When(/the user enters (\w+) "([^"]+)"/, ...);
```

Cucumber reports both patterns and tells you which step triggered the conflict.

**How to fix it:**
- Make patterns more specific so only one can match
- Remove the regex pattern if the Cucumber Expression covers all cases
- Rename one step if the intent is different

Step definition patterns are global across all loaded files. If `step-definitions/login.steps.ts` and `step-definitions/employee.steps.ts` both define `When('the user clicks the search button', ...)`, that is a conflict too — even though they are in different files.

---

## Q604.6 — What is the difference between the direct step definition approach and the POM approach?

The direct approach puts locators inside step definition functions:

```typescript
// step-definitions/login.steps.ts — DIRECT approach
When('the user enters username {string}',
  async function (this: OrangeHRMWorld, username: string) {
    await this.page.locator('input[name="username"]').fill(username);  // ← locator here
  }
);
```

The POM approach puts locators inside page objects, and step definitions only call page object methods:

```typescript
// step-definitions-pom/login.steps.ts — POM approach
When('the user enters username {string}',
  async function (this: POMWorld, username: string) {
    await this.loginPage.enterUsername(username);  // ← no locator here
  }
);

// pages/LoginPage.ts — locator lives here
async enterUsername(username: string): Promise<void> {
  await this.page.locator('input[name="username"]').fill(username);  // ← locator here
}
```

**The maintenance difference is significant.** If `input[name="username"]` changes to `input[id="user-name"]`, in the direct approach you find and update every step definition that uses it — potentially across multiple files. In the POM approach, you update one line in `LoginPage.ts` and every step that calls `loginPage.enterUsername()` is automatically fixed.

Use the direct approach for learning. Use the POM approach for any framework you maintain.

---

## Q604.7 — How does the BasePage class work and what methods does it provide?

`BasePage` is an abstract class that all page objects inherit from. It holds the `page` instance and defines methods that are common to multiple pages, so they do not need to be duplicated in each page class.

```typescript
// pages/BasePage.ts
import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async verifySuccessToastVisible(): Promise<void> {
    const toast = this.page.locator('.oxd-toast--success');
    await expect(toast).toBeVisible({ timeout: 10000 });
  }

  async verifyNoRecordsFound(): Promise<void> {
    await expect(
      this.page.locator('.oxd-text:has-text("No Records Found")')
    ).toBeVisible({ timeout: 10000 });
  }

  async clickSearchButton(): Promise<void> {
    await this.page.locator('button[type="submit"]:has-text("Search")').click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickSaveButton(): Promise<void> {
    await this.page.locator('button[type="submit"]:has-text("Save")').click();
    await this.page.waitForLoadState('networkidle');
  }

  async selectDropdownOption(dropdownLocator: Locator, option: string): Promise<void> {
    await dropdownLocator.click();
    await this.page.locator(`.oxd-select-option:has-text("${option}")`).click();
  }
}
```

Page objects inherit from `BasePage` and get all these methods automatically:

```typescript
// pages/AddEmployeePage.ts
export class AddEmployeePage extends BasePage {
  async saveEmployee(): Promise<void> {
    await this.clickSaveButton();  // inherited from BasePage
  }

  async verifySuccessToastVisible(): Promise<void> {
    await super.verifySuccessToastVisible();  // inherited from BasePage
  }
}
```

The `selectDropdownOption` method in `BasePage` handles the custom OrangeHRM dropdown pattern (click the wrapper, click the option) so every page that needs a dropdown does not implement the same click pattern.

---

## Q604.8 — How does POMWorld instantiate page objects and give step definitions access to them?

`POMWorld` creates all page objects in a private `initPages()` method called inside `openBrowser()`:

```typescript
// support/pom-world.ts
export class POMWorld extends World {
  loginPage!: LoginPage;
  dashboardPage!: DashboardPage;
  employeeListPage!: EmployeeListPage;
  addEmployeePage!: AddEmployeePage;
  userManagementPage!: UserManagementPage;
  addUserPage!: AddUserPage;

  async openBrowser(): Promise<void> {
    this.browser = await chromium.launch({ headless: this.headless, slowMo: this.slowMo });
    this.context = await this.browser.newContext({ viewport: { width: 1280, height: 720 } });
    this.page = await this.context.newPage();
    this.initPages();  // page must exist before page objects are created
  }

  private initPages(): void {
    this.loginPage          = new LoginPage(this.page);
    this.dashboardPage      = new DashboardPage(this.page);
    this.employeeListPage   = new EmployeeListPage(this.page);
    this.addEmployeePage    = new AddEmployeePage(this.page);
    this.userManagementPage = new UserManagementPage(this.page);
    this.addUserPage        = new AddUserPage(this.page);
  }
}
```

The `!` (definite assignment assertion) on each property tells TypeScript "I know this will be set before it is used" — the properties are `undefined` at construction time but set in `openBrowser()` before any step runs.

Step definitions access them via `this`:
```typescript
// step-definitions-pom/employee.steps.ts
When('the user clicks on Add Employee button',
  async function (this: POMWorld) {
    await this.employeeListPage.clickAddEmployee();  // page object from POMWorld
  }
);
```

This is Cucumber's equivalent of Playwright Test's fixture injection. Instead of declaring `{ page, employeeListPage }` in a test function signature, you access page objects through `this` because the World holds all of them.

---

## Q604.9 — What is the barrel export pattern and why is it used in pages/index.ts?

A barrel file is a module that re-exports everything from a folder. `pages/index.ts` exports all page classes from one file:

```typescript
// pages/index.ts
export { BasePage }           from './BasePage';
export { LoginPage }          from './LoginPage';
export { DashboardPage }      from './DashboardPage';
export { EmployeeListPage }   from './EmployeeListPage';
export { AddEmployeePage }    from './AddEmployeePage';
export { UserManagementPage } from './UserManagementPage';
export { AddUserPage }        from './AddUserPage';
```

Without the barrel, `pom-world.ts` would need six separate import lines:
```typescript
// ❌ Without barrel — verbose imports
import { LoginPage }         from '../pages/LoginPage';
import { DashboardPage }     from '../pages/DashboardPage';
import { EmployeeListPage }  from '../pages/EmployeeListPage';
import { AddEmployeePage }   from '../pages/AddEmployeePage';
import { UserManagementPage } from '../pages/UserManagementPage';
import { AddUserPage }       from '../pages/AddUserPage';
```

With the barrel, one import line covers all:
```typescript
// ✅ With barrel — clean single import
import {
  LoginPage, DashboardPage, EmployeeListPage,
  AddEmployeePage, UserManagementPage, AddUserPage,
} from '../pages';
```

Adding a new page class means adding one line to `pages/index.ts`. Every file that imports from `'../pages'` automatically gets access to the new class without any import changes.

---

## Q604.10 — What is wrong with step definitions that contain assertions?

```typescript
// ❌ COMMON MISTAKE — step definition makes multiple assertions
Then('the employee search results should be correct',
  async function (this: POMWorld) {
    await expect(this.page.locator('.oxd-table-row')).toHaveCount(3);
    await expect(this.page.locator('.oxd-table-body')).toContainText('John Doe');
    await expect(this.page.locator('.oxd-table-body')).toContainText('Jane Smith');
    await expect(this.page.url()).toContain('viewEmployeeList');
  }
);
```

This puts four separate assertions in one step. When the step fails, the report says "the employee search results should be correct — FAILED" with a cryptic error. You cannot tell which assertion failed without reading the full stack trace.

```typescript
// ✅ CORRECT APPROACH — one assertion per Then step
Then('the employee list should display results',
  async function (this: POMWorld) {
    await this.employeeListPage.verifyResultsDisplayed();
    // Inside: expects rows.first() to be visible and count > 0
  }
);

Then('the employee {string} should appear in the search results',
  async function (this: POMWorld, name: string) {
    await this.employeeListPage.verifyEmployeeInResults(name);
    // Inside: expects tableBody to containText(name)
  }
);
```

Feature file:
```gherkin
Then the employee list should display results
And the employee "John" should appear in the search results
```

Now each step is one clear assertion. When one fails, the report tells you exactly which check failed — without reading code.

---

## Q604.11 — How do you reuse step definitions across multiple feature files?

Step definitions are global — once registered, they are available to all feature files Cucumber loads. There is no explicit linking. If `step-definitions/login.steps.ts` defines `Given('the user is logged in as {string} with password {string}', ...)`, any feature file can use that step.

In the OrangeHRM project, the login step is reused across all three feature files:

```gherkin
# employee-management.feature — uses the login step from login.steps.ts
Background:
  Given the user is logged in as "testadmin" with password "Vibetestq@123"
  And the user navigates to PIM module

# user-management.feature — uses the SAME login step
Background:
  Given the user is logged in as "testadmin" with password "Vibetestq@123"
  And the user navigates to Admin module
```

One step definition, two feature files. No duplication. If the login mechanism changes, you update one place.

The rule for step reuse: write steps in the level of abstraction where they belong. Login steps belong in `login.steps.ts`. Navigation steps that go to a specific module belong in that module's step file. But a step like "a success toast message should be visible" is used in both employee and user management scenarios — put it in a `common.steps.ts` file.

---

## Q604.12 — How does the POM step definition style compare to the direct approach in readability?

```typescript
// ─── DIRECT approach — step-definitions/employee.steps.ts ───────────────────
When('the user saves the new employee',
  async function (this: OrangeHRMWorld) {
    await this.page.locator('button[type="submit"]:has-text("Save")').click();
    await this.page.waitForLoadState('networkidle');
  }
);

Then('the employee profile page should be displayed',
  async function (this: OrangeHRMWorld) {
    await this.page.waitForURL('**/pim/viewPersonalDetails**', { timeout: 15000 });
    const heading = this.page.locator('.orangehrm-main-title');
    await expect(heading).toBeVisible({ timeout: 10000 });
  }
);

// ─── POM approach — step-definitions-pom/employee.steps.ts ──────────────────
When('the user saves the new employee',
  async function (this: POMWorld) {
    await this.addEmployeePage.saveEmployee();  // 1 line
  }
);

Then('the employee profile page should be displayed',
  async function (this: POMWorld) {
    await this.addEmployeePage.verifyEmployeeProfileDisplayed();  // 1 line
  }
);
```

The POM step definitions are dramatically shorter and clearer. The step function body expresses intent, not implementation. Someone reading the step definition can immediately understand what it does without knowing CSS selectors or URL patterns.

The implementation details live in `AddEmployeePage.ts`:
```typescript
async saveEmployee(): Promise<void> {
  await this.clickSaveButton();  // BasePage method
}

async verifyEmployeeProfileDisplayed(): Promise<void> {
  await this.page.waitForURL('**/pim/viewPersonalDetails**', { timeout: 15000 });
  await expect(this.page.locator('.orangehrm-main-title')).toBeVisible({ timeout: 10000 });
}
```

The locator change radius is smaller in POM — a locator change only affects the page class method, not the step definition and not the feature file.

---

## Q604.13 — Write step definitions for the user management Add User scenario

Feature file:
```gherkin
Scenario: Create a new Admin user
  When the user clicks on Add User button
  And the user selects user role "Admin"
  And the user selects employee name "John Doe"
  And the user enters new username "john.doe.admin"
  And the user selects status "Enabled"
  And the user enters user password "Admin@1234"
  And the user confirms the password "Admin@1234"
  And the user saves the new user
  Then a success toast message should be visible
  And the user list page should be displayed
```

POM step definitions:
```typescript
// step-definitions-pom/user-management.steps.ts
import { When, Then } from '@cucumber/cucumber';
import { POMWorld } from '../support/pom-world';

When('the user clicks on Add User button', async function (this: POMWorld) {
  await this.userManagementPage.clickAddUser();
  // navigates to /admin/saveSystemUser, waits for networkidle
});

When('the user selects user role {string}', async function (this: POMWorld, role: string) {
  await this.addUserPage.selectUserRole(role);
  // BasePage.selectDropdownOption: click wrapper, click option
});

When('the user selects employee name {string}', async function (this: POMWorld, employeeName: string) {
  await this.addUserPage.selectEmployeeName(employeeName);
  // types first name, waits for autocomplete, clicks suggestion
});

When('the user enters new username {string}', async function (this: POMWorld, username: string) {
  await this.addUserPage.enterUsername(username);
});

When('the user selects status {string}', async function (this: POMWorld, status: string) {
  await this.addUserPage.selectStatus(status);
});

When('the user enters user password {string}', async function (this: POMWorld, password: string) {
  await this.addUserPage.enterPassword(password);
});

When('the user confirms the password {string}', async function (this: POMWorld, password: string) {
  await this.addUserPage.enterConfirmPassword(password);
});

When('the user saves the new user', async function (this: POMWorld) {
  await this.addUserPage.saveUser();
});

Then('a success toast message should be visible', async function (this: POMWorld) {
  await this.addUserPage.verifySuccessToastVisible();  // inherited from BasePage
});

Then('the user list page should be displayed', async function (this: POMWorld) {
  await this.userManagementPage.verifyUserListPageDisplayed();
});
```

---

## Q604.14 — How do you handle a step that is shared between two feature files?

Make the step definition generic enough to match all uses, and put it in a shared file.

Example: `Then a success toast message should be visible` is used in both `employee-management.feature` and `user-management.feature`.

If you put it in `employee.steps.ts` only, it still works for user management — Cucumber loads all step definition files and the step is globally available. But it is misleading — a step used in user management tests should not live only in the employee steps file.

Better approach: create `support/common.steps.ts`:

```typescript
// step-definitions-pom/common.steps.ts
import { Then } from '@cucumber/cucumber';
import { POMWorld } from '../support/pom-world';

Then('a success toast message should be visible',
  async function (this: POMWorld) {
    // BasePage.verifySuccessToastVisible works for any page
    // We call it on addEmployeePage but it uses BasePage which any page inherits
    await this.page.locator('.oxd-toast--success').waitFor({ state: 'visible', timeout: 10000 });
  }
);

Then('the no records found message should be displayed',
  async function (this: POMWorld) {
    await this.page.locator('.oxd-text:has-text("No Records Found")').waitFor({ state: 'visible' });
  }
);
```

Load this file in `cucumber.js` via the glob: `step-definitions-pom/**/*.ts` already picks it up if it is in that folder.

---

## Q604.15 — Describe a real step definition challenge from your project

In our OrangeHRM project, the dropdown fields on the Add User page used a custom OrangeHRM component — not a native `<select>` element. The dropdown was a `div` with class `oxd-select-wrapper`. Clicking it opened a list of `div.oxd-select-option` items.

The first implementation of the user role step clicked the wrapper, waited 500ms, then clicked the option:

```typescript
// ❌ First attempt — timing issues
When('the user selects user role {string}',
  async function (this: OrangeHRMWorld, role: string) {
    await this.page.locator('.oxd-select-wrapper').first().click();
    await this.page.waitForTimeout(500);  // hard wait — fragile
    await this.page.locator(`.oxd-select-option:has-text("${role}")`).click();
  }
);
```

This failed on slow machines and in CI because the options had not rendered yet when the click happened.

We fixed it by moving the logic into a `BasePage.selectDropdownOption()` method that waits for the option to be visible before clicking:

```typescript
// ✅ BasePage method — waits for option to appear
async selectDropdownOption(dropdownLocator: Locator, option: string): Promise<void> {
  await dropdownLocator.click();
  const optionLocator = this.page.locator(`.oxd-select-option:has-text("${option}")`);
  await optionLocator.waitFor({ state: 'visible', timeout: 5000 });  // wait, no hard sleep
  await optionLocator.click();
}
```

The step definition then became one line:
```typescript
When('the user selects user role {string}',
  async function (this: POMWorld, role: string) {
    await this.addUserPage.selectUserRole(role);
  }
);
```

Every dropdown on every page — user role, status, employee name — used the same `BasePage.selectDropdownOption()` method. One fix covered all dropdowns in the framework.

---

## Chapter Summary — Key Points for Your Interview

- A step definition maps a Gherkin step to a function using a pattern with `{string}`, `{int}`, or `{float}` parameter types. The pattern must match exactly — ambiguous matches are an error.
- Type `this` as your custom World class to get TypeScript autocomplete and type safety in step definitions.
- The direct approach (locators in step definitions) is easier to start with; the POM approach (locators in page objects) is easier to maintain.
- `BasePage` holds shared locators and actions (save button, search button, dropdown selection, toast assertion) so page classes do not duplicate them.
- `POMWorld.initPages()` creates all page objects once after the browser opens — step definitions access them through `this.loginPage`, `this.employeeListPage`, etc.
- The barrel export (`pages/index.ts`) lets `POMWorld` import all page classes in one line.
- Step definitions are global — a step defined in `login.steps.ts` can be used by any feature file. Put shared steps (toast, no records) in a `common.steps.ts`.
