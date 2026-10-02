# Chapter 9 — Skills for Test Automation Development and Debugging
### Two Parts. One Chapter.

---

## What You Will Learn

**Part A — Development:** How to build skills for every automation task — page objects, spec files, fixtures, helpers, API tests, and CI. How the five real production skills work and why each design decision matters.

**Part B — Debugging:** How to build skills specifically for diagnosing failures — test failures, flaky tests, CI failures, selector issues, and timeouts.

---

# PART A — SKILLS FOR AUTOMATION DEVELOPMENT

---

## 9.1 The Automation Engineer's Repeated Tasks

Automation engineers repeat the same task types every sprint:

- Writing page objects for new features
- Writing spec files for new test scenarios
- Adding or extending fixtures
- Adding helper methods
- Writing API tests
- Configuring CI pipelines

Each task has conventions. Without skills, those conventions are re-explained every session. With skills, they load automatically. The difference is significant at the level of a single engineer. At team level, it is the difference between consistent code and code that looks different every time someone new writes a file.

---

## 9.2 The Five-Skill System — A Real Project Example

The five skills shown in this section come from a real Playwright TypeScript test automation project. They cover the OrangeHRM HR system — a commonly used training application.

Each skill owns one layer of the project:

```
playwright-pom           → controls what goes inside page objects
playwright-helpers       → controls what goes inside helper methods
playwright-fixtures      → controls how pages are wired into tests
playwright-test-patterns → controls how spec files are written
playwright-api-testing   → controls how API tests are written
```

---

## 9.3 Skill 1 — playwright-pom (Page Object Model)

**Description:**
```
Create or extend Playwright Page Object Model classes in this project.
Use when: adding a new page object, creating page locators, adding page actions,
extending BasePage, writing page methods that wrap locator interactions.
Covers BasePage inheritance, locator .describe() pattern,
WebHelpers/AssertHelpers composition, TypeScript path aliases.
```

### Step 0 — Without this skill

Prompt: "Write a page object for the Add Employee page."

Output:
```typescript
class AddEmployeePage {
    async addEmployee(page, firstName, lastName) {
        await page.locator('#firstName').fill(firstName);
        await page.locator('#lastName').fill(lastName);
        await page.locator('.save-btn').click();
    }
}
```

No inheritance. CSS selectors. Raw page parameter. No TypeScript types. Does not match the project at all.

### Why the Critical Rule comes first

The skill opens with this before any other content:

```
CRITICAL: Tests must ONLY call page object methods.
Never access underlying page or locator objects from tests.
If tests need new interactions, add methods to page objects first.
```

This is the most violated convention in POM projects. A test that does `pimPage.page.locator('button').click()` bypasses the entire abstraction layer. Once this appears in one test, it spreads. The skill puts this rule first because if only one thing is remembered, it must be this.

### The five-step page class template

The skill provides a complete template showing all five steps:

```typescript
export class ExamplePage extends BasePage {
    // Step 1: declare locators as private readonly
    private readonly saveButton: Locator;
    private readonly nameInput: Locator;

    constructor(page: Page) {
        super(page); // Step 2: initialises page, webHelpers, assertHelpers

        // Step 3: prefer getByRole, always call .describe()
        this.saveButton = this.page
            .getByRole('button', { name: 'Save' })
            .describe('Save button');

        this.nameInput = this.page
            .getByRole('textbox', { name: 'Name' })
            .describe('Name input field');
    }

    // Step 4: one public method per user action
    async clickSave(): Promise<void> {
        await this.webHelpers.clickElement(this.saveButton);
    }

    // Step 5: verification methods using assertHelpers
    async verifySaveSuccess(message: string): Promise<void> {
        await this.assertHelpers.assertTextVisible(message);
    }
}
```

### The Action + Verification principle

The skill documents bad and good patterns side by side:

```typescript
// ❌ BAD — action without verification
async selectLeaveType(value: string): Promise<void> {
    await this.webHelpers.selectOptionByText(this.leaveType, value);
    // Nothing verifies the selection happened
}

// ✅ GOOD — action + verification
async selectLeaveType(value: string): Promise<void> {
    await this.webHelpers.selectOptionByText(this.leaveType, value);
    await this.assertHelpers.assertFieldValue(this.leaveType, value);
}
```

"Action without verification" is a subtle bug. The code runs. The test passes. But if the dropdown silently failed to select, no assertion catches it. The skill makes this pattern explicit so the model never produces the bad version.

### After the skill — same prompt:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class AddEmployeePage extends BasePage {
    private readonly firstNameInput: Locator;
    private readonly lastNameInput: Locator;
    private readonly saveButton: Locator;
    private readonly successMessage: Locator;

    constructor(page: Page) {
        super(page);
        this.firstNameInput = this.page
            .getByRole('textbox', { name: 'First Name' })
            .describe('First Name input');
        this.lastNameInput = this.page
            .getByRole('textbox', { name: 'Last Name' })
            .describe('Last Name input');
        this.saveButton = this.page
            .getByRole('button', { name: 'Save' })
            .describe('Save button');
        this.successMessage = this.page
            .getByText('Successfully Saved')
            .describe('Success message');
    }

    async fillFirstName(name: string): Promise<void> {
        await this.webHelpers.enterText(this.firstNameInput, name);
    }

    async fillLastName(name: string): Promise<void> {
        await this.webHelpers.enterText(this.lastNameInput, name);
    }

    async clickSave(): Promise<void> {
        await this.webHelpers.clickElement(this.saveButton);
    }

    async verifySaveSuccess(): Promise<void> {
        await this.assertHelpers.assertVisible(this.successMessage);
    }

    async addEmployee(firstName: string, lastName: string): Promise<void> {
        await this.fillFirstName(firstName);
        await this.fillLastName(lastName);
        await this.clickSave();
        await this.verifySaveSuccess();
    }
}
```

Correct inheritance. getByRole locators with .describe(). WebHelpers and AssertHelpers used correctly. Action+verification in the composite method.

---

## 9.4 Skill 2 — playwright-helpers

**Description:**
```
Add or use helper methods from WebHelpers and AssertHelpers in this project.
Use when: adding a new web interaction wrapper, adding a new assertion helper,
using helpers inside page methods, handling locator errors with logging.
CRITICAL: Helpers are ONLY for use inside page object methods, never in tests.
```

### The try-catch-rethrow pattern

Every WebHelpers method follows exactly this structure:

```typescript
async clickElement(locator: Locator): Promise<void> {
    try {
        await locator.click();
        console.log(`Clicked: ${locator.description()}`);
    } catch (error: any) {
        console.error(`Click failed on ${locator.description()}: ${error.message}`);
        throw error;  // always rethrow
    }
}
```

Three rules baked into one template:
1. Use `locator.description()` — never hardcode element names in logs
2. Always `throw error` — never swallow failures silently
3. Log success after the action — if it fails, Playwright throws before the log

The skill shows this pattern as the template to copy for every new method. An engineer adding `waitForElement` copies the pattern, fills in the action, and produces a method that matches every existing helper.

### AssertHelpers — deliberately different

The skill explicitly documents why AssertHelpers does NOT use try-catch:

```typescript
async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
    console.log(`Visible: ${locator.description()}`);
    // No try-catch — let Playwright's built-in error messages surface
}
```

Without this explicit documentation, an engineer extending AssertHelpers might apply the WebHelpers try-catch pattern. That would obscure Playwright's built-in assertion failure messages. The skill prevents the mistake by explaining why the patterns differ.

---

## 9.5 Skill 3 — playwright-fixtures

**Description:**
```
Create or extend Playwright test fixtures in this project.
Use when: adding a new page object fixture, creating worker-scoped API auth fixtures,
wiring up new pages into basetest.ts, setting up auto-running beforeEach navigation.
CRITICAL: Tests must only use page object methods, never access underlying page directly.
```

### The two-file structure

The skill opens with this table because it is the most important structural decision:

| File | Purpose | Scope |
|------|---------|-------|
| `fixtures/basetest.ts` | UI test fixtures — page objects | `test` (per test) |
| `fixtures/apitest.ts` | API test fixtures — auth token | `worker` (shared) |

New engineers who do not know the project often put everything in one file or import from the wrong file. This table is the first thing they see.

### The three-step fixture addition process

The skill documents this exact sequence:

```
Step 1: Import the page class
Step 2: Declare the fixture type in the extend<> generic
Step 3: Add the fixture implementation
```

The most common mistake is Step 2. Engineers add the implementation but forget to declare the type in the generic:

```typescript
// ❌ Missing the type declaration — TypeScript error
export const test = baseTest.extend<{
    loginPage: LoginPage;
    // addEmployeePage missing here!
}>({
    addEmployeePage: async ({ page }, use) => {
        await use(new AddEmployeePage(page));  // TypeScript error: not in type
    },
});
```

The three-step process makes the sequence explicit. The TypeScript error disappears.

### The worker-scoped auth pattern

```typescript
export const test = baseTest.extend<{}, { authToken: string }>({
    authToken: [
        async ({ playwright }, use) => {
            const request = await playwright.request.newContext({
                baseURL: process.env.BASE_URL || 'http://localhost:3000/',
            });
            const response = await request.post('/auth/login', {
                data: { username: 'admin_user', password: 'admin_pass' },
            });
            const { token } = await response.json();
            await request.dispose();  // clean up
            await use(token);         // shared with all tests in worker
        },
        { scope: 'worker' },
    ],
});
```

The auth token is fetched once per worker, not once per test. Without this pattern in the skill, new engineers write per-test auth fixtures. Every API test hits the login endpoint before running. With the skill, one login per worker — significant performance difference at scale.

---

## 9.6 Skill 4 — playwright-test-patterns

**Description:**
```
Write Playwright UI spec files in this project.
Use when: creating a new spec file, adding test.describe blocks,
writing beforeEach/afterEach hooks, adding tags and annotations,
writing data-driven tests from JSON, using test.info() for retry detection.
```

### The import rule — most important single rule

```typescript
// ✅ Correct — project fixture, page objects injected
import { test } from '../fixtures/basetest';

// ❌ Wrong — no page objects available
import { test } from '@playwright/test';
```

If a test imports from `@playwright/test`, no page objects are injected. The test fails immediately. This is the most common mistake in a fixture-based project and the skill prevents it with a side-by-side example.

### The flakiness detection pattern

The skill includes this `afterEach` hook that most engineers would not know exists:

```typescript
test.afterEach(async () => {
    const { retry, status, title } = test.info();
    if (retry > 0 && status === 'passed') {
        console.warn(`⚠️ FLAKY: "${title}" passed on retry ${retry}`);
    }
    if (retry > 0 && status === 'failed') {
        console.error(`❌ FAILING: "${title}" still failing on retry ${retry}`);
    }
});
```

This is a non-obvious Playwright feature. Without the skill, most engineers write afterEach hooks without flakiness detection. With the skill, every spec file in the project gets it automatically.

### Data-driven tests — both pieces

The skill provides both the test file pattern and the matching JSON shape:

```typescript
// Test file
data.employees.forEach(employee => {
    test(`Add Employee: ${employee.firstName} ${employee.lastName}`,
        { tag: ['@smoke', '@employee'] },
        async ({ addEmployeePage }) => { ... }
    );
});
```

```json
// test-data/employeeData.json
{
  "employees": [
    { "firstName": "Alice", "lastName": "Smith" },
    { "firstName": "Bob",   "lastName": "Jones" }
  ]
}
```

Without both pieces, the model generates the test but not the data file — or the data file but not the forEach pattern.

---

## 9.7 Skill 5 — playwright-api-testing

**Description:**
```
Write or extend Playwright API tests in this project.
Use when: creating REST API tests, testing POST/GET/PUT/PATCH/DELETE endpoints,
validating response status and body, using Bearer token auth,
testing error responses (400/401/404), generating unique test data.
All API tests live in tests/apitests/ and use fixtures/apitest.ts.
```

### The assertion order rule

```typescript
// ✅ Correct — status first
expect(response.status()).toBe(201);
const body = await response.json();
expect(body.id).toBeTruthy();

// ❌ Wrong — parsing body before status check
const body = await response.json();  // could be error response shape
expect(body.id).toBeTruthy();        // confusing failure: "id is undefined"
```

If you parse the body before checking the status, a 400 response body is treated as a success body. The `id` field does not exist in an error response. You get "id is undefined" instead of "expected status 201, got 400." The real failure is hidden. The skill prevents this with a before/after example.

### Unique test data

```typescript
const email    = `user+${Date.now()}@company.com`;
const username = `testuser_${Date.now()}`;
```

Without this in the skill, engineers write POST tests with hardcoded emails. The test passes on the first run. It fails on every subsequent run with a duplicate key error. `Date.now()` is the simplest fix. The skill makes it the default.

---

## 9.8 What the Five Skills Achieve Together

Each skill owns one boundary. Together they form a complete system:

```
playwright-pom:           No locators in tests. Action+verification in methods.
playwright-helpers:       Try-catch-rethrow in actions. No try-catch in assertions.
playwright-fixtures:      Two files, three steps, worker scope for auth.
playwright-test-patterns: Correct import, flakiness detection, data-driven pattern.
playwright-api-testing:   Status first, unique data, correct auth per endpoint.
```

Three skills protect the same boundary: "no locators in tests." The POM skill, the fixtures skill, and the test-patterns skill all state this rule. Three angles of enforcement mean it is harder to miss.

A new engineer working on any task gets the right skill loaded. They do not need to read a conventions document. They do not need to ask a senior engineer. The standards are in context before they type.

---

# PART B — SKILLS FOR AUTOMATION DEBUGGING

---

## 9.9 Why Debugging Needs Its Own Skill

Debugging is fundamentally different from development.

When developing: you know what you want to produce. The skill gives the model the conventions to produce it correctly.

When debugging: you do not know what is wrong. The skill needs to guide the model through a diagnosis process — and it needs more context than development, not less.

The debugging skill encodes:
- What information to always ask for (error, test, page object, fixture)
- How to reason through a failure (chain-of-thought workflow)
- Common failure patterns specific to this project
- What the fix looks like for each pattern

---

## 9.10 Skill 6 — Test Failure Diagnosis

```yaml
---
name: playwright-debugging
description: >
  Diagnose and fix failing Playwright tests in this project.
  Use when: a test is failing, a test is timing out, a test throws an error,
  debugging a Playwright test, fixing a broken test, investigating test failures.
  Always use this skill when debugging any test in this project.
---

# Playwright Test Failure Diagnosis

## The Critical Rule

Always diagnose before fixing.
A fix applied without understanding the root cause will break again.
Reason through the failure step by step before writing any code.

## What to Always Include

Before diagnosing, confirm these are available:
1. Exact error message (copy the full stack trace)
2. The failing test code
3. The page object used in the test
4. The fixture definition (if the error involves fixture injection)

Without all four, diagnosis is guesswork.

## Diagnosis Workflow

Step 1: Read the error message literally — what exactly failed?
Step 2: Identify the failure type (see table below)
Step 3: Apply the matching diagnosis pattern
Step 4: State the root cause in one sentence
Step 5: Show the corrected code

## Common Failure Types

| Error Pattern | Likely Cause | First Check |
|--------------|-------------|-------------|
| TimeoutError: locator | Element not visible / not interactive | Is the element in the DOM? Is it disabled? |
| TimeoutError: waitForURL | Navigation did not complete | Is the URL pattern correct? Did redirect happen? |
| strict mode violation | Multiple elements match the locator | Add more specific role/name to locator |
| locator.nth(0) not visible | Dynamic list not loaded | Add waitFor before accessing list items |
| Cannot read undefined | Page object method returns undefined | Check method return type and fixture injection |
| fixture not found | Imported from @playwright/test not basetest | Fix import to use project fixture |

## Output Format

Diagnosis:
- Error type: [category from table]
- Root cause: [one sentence]
- Why this fails locally or on CI: [if relevant]

Fix:
[corrected code only — no explanation after the code]
```

### Before vs after — debugging a timeout

**Without skill:**

Prompt: "My test is timing out. What's wrong?"

Output: "Could you share the error message and test code?"

Turn wasted.

**With skill:**

Prompt: "My test is timing out. Error: [paste]. Test: [paste]. Page object: [paste]."

Output:
```
Diagnosis:
- Error type: TimeoutError — element not interactive
- Root cause: The Save button exists in the DOM when the locator starts
  polling, but it is disabled while form validation runs. Playwright
  finds the element but cannot click it until enabled.
- Why CI fails but local passes: locally the form renders faster due to
  browser caching. On CI the cold browser triggers the timeout.

Fix:
```typescript
async clickSave(): Promise<void> {
    await expect(this.saveButton).toBeEnabled({ timeout: 10000 });
    await this.webHelpers.clickElement(this.saveButton);
}
```

---

## 9.11 Skill 7 — Flaky Test Investigation

```yaml
---
name: playwright-flaky-investigation
description: >
  Investigate and fix flaky tests in this project.
  Use when: a test passes sometimes and fails sometimes, a test fails only on CI,
  a test requires retries, investigating intermittent failures.
  Always use this skill when investigating flaky tests.
---

# Flaky Test Investigation

## The Critical Rule

A flaky test is not an acceptable test.
"It usually passes" is not a passing test.
Fix the flakiness or delete the test.

## The Four Flakiness Patterns

### Pattern 1 — Timing
The test passes when the application is fast, fails when it is slow.
Signs: timeout errors on CI but not locally, passes on retry.
Fix: Remove hardcoded waits. Replace with Playwright's built-in waiting:
  - waitForURL after navigation
  - expect(locator).toBeVisible() before interaction
  - expect(locator).toBeEnabled() before click

### Pattern 2 — Test Data
The test depends on data state from another test.
Signs: passes when run alone, fails when run in suite.
Fix: Each test must create its own data. Never rely on data from another test.

### Pattern 3 — Selector
The locator matches different elements in different states.
Signs: strict mode violations, wrong element clicked.
Fix: Make the locator more specific. Use .describe() to log which element matched.

### Pattern 4 — Environment
The test behaves differently on CI than locally.
Signs: passes locally every time, fails on CI consistently.
Check: BASE_URL set correctly? Network timeouts different? Browser cold start?

## Investigation Workflow

Step 1: Check test.info().retry — is the test being retried?
Step 2: Check the CI logs for the last 5 runs — is the failure consistent or random?
Step 3: Identify the flakiness pattern from the table above
Step 4: Apply the fix for that pattern
Step 5: Run the test 10 times locally to verify the fix
```

---

## 9.12 Skill 8 — CI Failure Analysis

```yaml
---
name: ci-failure-analysis
description: >
  Diagnose test failures that occur on CI but not locally.
  Use when: tests pass locally but fail on CI, CI pipeline is failing,
  investigating GitHub Actions failures, debugging environment-specific failures.
---

# CI Failure Analysis

## The Critical Rule

"It passes locally" is not a diagnosis. It is the beginning of one.
Local pass + CI fail means an environment difference is the cause.

## Common CI-Specific Failures

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| TimeoutError on CI only | Cold browser + no caching | Increase timeouts in CI config |
| BASE_URL not found | Environment variable not set in CI | Add to GitHub Actions env block |
| Authentication fails | Test credentials not in CI secrets | Add credentials to repository secrets |
| Screenshot mismatch | Different OS font rendering | Run visual tests in Docker |
| Port already in use | Previous CI run not cleaned up | Add cleanup step before tests |
| Module not found | npm install not run before tests | Add `npm ci` step to workflow |

## CI Diagnosis Workflow

Step 1: Get the exact CI error — copy the full log, not just the test failure line
Step 2: Check whether the test has ever passed on CI — first run or regression?
Step 3: Check the GitHub Actions workflow file — is the environment set up correctly?
Step 4: Match the symptom to the table above
Step 5: Apply the fix to the workflow file or the test configuration

## Output Format

Diagnosis: [which row from the table]
Root cause: [specific reason for this project]
Fix: [corrected workflow YAML or test configuration]
```

---

## 9.13 The Debugging Session Workflow

When debugging any test failure, follow this sequence:

```
1. Start a new session (never debug in a long polluted session)

2. Load the debugging skill context:
   "I am debugging a failing Playwright test in the [project name] project."

3. Provide all four required inputs:
   - Exact error (full stack trace)
   - The failing test
   - The page object
   - The fixture (if relevant)

4. Ask for diagnosis first:
   "Diagnose the root cause. Do not write any code yet."

5. Review the diagnosis. If correct, ask for the fix:
   "Show me the corrected code."

6. Test the fix. If it does not work, add the new error to the session:
   "The fix did not work. New error: [paste]"
```

---

## Chapter Summary

| Skill | Critical Rule | Primary Pattern |
|-------|--------------|----------------|
| playwright-pom | No locators in tests | Five-step class template, action+verification |
| playwright-helpers | Try-catch-rethrow in actions, never in assertions | Pattern template for all new methods |
| playwright-fixtures | Two files, three steps, worker scope for auth | Step sequence prevents TypeScript errors |
| playwright-test-patterns | Import from basetest not @playwright/test | Complete template with flakiness detection |
| playwright-api-testing | Status code before body | Unique data with Date.now() |
| playwright-debugging | Diagnose before fixing | Four failure types, step-by-step workflow |
| playwright-flaky | Flaky = broken, not acceptable | Four flakiness patterns with specific fixes |
| ci-failure-analysis | Local pass ≠ diagnosis | Environment difference table |

---

## Three Exercises to Try Today

1. Take the playwright-pom skill and add one rule that is specific to your project — something that keeps getting violated in your PRs. Test whether it stops the violation.

2. Use the debugging skill on a real failing test. Compare the diagnosis quality to what you would have gotten without the skill.

3. Write the CI failure analysis skill for your project. Replace the generic table with the specific failures your team has actually encountered.

---

→ [Chapter 10 — Skills for Team Standards](10-skills-team-standards.md)

---

*← [Chapter 8](08-skills-exploratory-mcp.md) | [Chapter 10 →](10-skills-team-standards.md)*
