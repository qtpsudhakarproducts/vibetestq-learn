# Chapter 510 — AI Agents & Standard-Driven Test Generation (L9)

This chapter covers Playwright Agents — the planner, generator, and healer
cycle that accelerates test authoring without abandoning framework standards.
Interviewers ask about AI-assisted testing to gauge whether candidates
understand where automation agents add value and where they need human
oversight. Candidates who can explain why `STANDARDS.md` is the critical
integration point, articulate the seed test's role, and be honest about
agent limitations will stand out. This topic is increasingly common at
senior level as AI tooling enters production testing workflows.

---

## Q510.1 — What problem does Level 9 solve?

After eight levels the framework is production-grade: independent tests,
typed data, tagged runs, CI pipelines, Allure history. Every test was
written by a human engineer who understood eight levels of deliberate design.

When OrangeHRM adds a new module — Performance Management, Training,
Recruitment — that same engineer needs to write page objects, fixtures,
API setup, test files, and apply the tagging conventions. At one or two
features per sprint, test authoring becomes the bottleneck.

Level 9 introduces Playwright Agents to address this:
- The **planner** explores the live application and produces a human-readable
  test plan from a requirement
- The **generator** converts the plan into executable Playwright code
- The **healer** runs the tests and fixes failures automatically

The human reviews, approves, and commits. The time from requirement to
committed tests drops from hours to minutes.

---

## Q510.2 — What are the three Playwright Agents and what does each one do?

**Planner** — navigates the live application, reads the DOM, understands
available interactions. Given a requirement, produces a Markdown test plan
in `specs/`. Human-readable and editable before generation begins.

**Generator** — reads the `specs/` Markdown plan and produces executable
TypeScript test files. Verifies selectors against the live application as
it generates rather than guessing. Mirrors the seed test's import patterns
and fixture usage.

**Healer** — runs generated tests, pauses on failures, inspects the DOM,
identifies root causes (changed locator, timing issue, wrong assertion),
patches the test, and re-runs until it passes. If the application itself
is broken (not the test), marks the test `test.skip()` with an explanatory
comment rather than permanently failing.

The workflow:
```
Requirement
    ↓
Planner → specs/feature.md       (human reviews + edits)
    ↓
Generator → tests/feature.spec.ts (human reviews against STANDARDS.md)
    ↓
Healer → passing tests or skipped with defect comments
    ↓
Human review → commit
```

---

## Q510.3 — How are Playwright Agents initialised?

```bash
# Requires Playwright 1.56+
npm install --save-dev @playwright/test@latest
npx playwright install chromium

# Initialise agents for VS Code Copilot
npx playwright init-agents --loop=vscode
```

This generates three agent definition files in `.github/`:

```
.github/
  playwright-test-planner.md    ← planner agent instructions + MCP tools
  playwright-test-generator.md  ← generator agent instructions + MCP tools
  playwright-test-healer.md     ← healer agent instructions + MCP tools
```

These files contain natural language instructions and MCP tool definitions
that connect the AI (GitHub Copilot in VS Code) to Playwright's browser
automation tools. The AI can navigate pages, inspect DOM elements, click
elements, fill forms, take screenshots, and run tests.

Regenerate when Playwright is updated:
```bash
npx playwright init-agents --loop=vscode
```

Agent definitions are versioned with Playwright. Running an old definition
against a new Playwright version may miss new tools and capabilities.

---

## Q510.4 — Why does generated code violate framework conventions without a standards file?

Without `STANDARDS.md`, an agent generates code that runs but violates
every convention the framework has established:

```typescript
// Generated without STANDARDS.md
test('add employee', async ({ page }) => {
  await page.goto('https://opensource-demo.orangehrmlive.com');
  await page.click('.oxd-input');
  await page.fill('.oxd-input', 'John');
  await page.locator('button[type="submit"]').click();
  expect(await page.locator('.success-message').textContent())
    .toBe('Successfully Saved');
});
```

Violations: CSS selectors, raw `page` interactions (no page objects),
no fixture injection, hardcoded data, no tags, no annotations, no cleanup.

With `STANDARDS.md`, the same agent generates:

```typescript
// Generated with STANDARDS.md
import { test }           from '../../fixtures';
import { generateEmployee } from '../../data/generate';

test.describe('PIM — Employee Management', () => {

  test('admin can add a new employee via UI',
    { tag: ['@pim', '@smoke', '@critical'] },
    async ({ addEmployeePage, employeeListPage }, testInfo) => {
      const employee = generateEmployee();
      testInfo.annotations.push({ type: 'employeeId', description: employee.employeeId });

      await addEmployeePage.addEmployee(employee);
      await addEmployeePage.assertEmployeeSavedSuccessfully();
    }
  );

});
```

The standards file is the difference between generated code that gets
merged and generated code that gets rejected.

---

## Q510.5 — What does STANDARDS.md cover?

`STANDARDS.md` lives at the project root and encodes every framework
convention the agents must follow. Seven sections:

**1. Project structure** — which files go where, what directories exist
and what each contains, where new modules are placed.

**2. Naming conventions** — file names (`PascalCase.ts` for page objects,
`kebab-case.spec.ts` for tests), class names, method prefixes (`assert*`
for assertions, `goto` for navigation).

**3. Locator strategy** — semantic locators only (`getByRole`, `getByLabel`,
`getByPlaceholder`), never CSS selectors or XPath, `.describe()` on every
locator defined in a page object, locators as private class properties never
inline in methods.

**4. Page object structure** — exact template with sections in order:
helpers, locators, constructor, navigation, actions, composite methods,
assertions. What belongs in a page object and what never belongs there.

**5. Data conventions** — always use generators, never hardcode, composite
methods accept typed objects not individual parameters, overrides only when
the test specifically cares about the value.

**6. Test structure** — complete test file template with `beforeAll`/`afterAll`
pattern, three-tag rule, annotation pattern, when to use `beforeAll` vs
per-test generation.

**7. What the agent must never do** — explicit prohibition list: CSS selectors,
hardcoded data, selectors in test files, page objects without `.describe()`,
tests without three tags, individual parameters in composite methods, importing
from `@playwright/test` directly instead of `../../fixtures`.

---

## Q510.6 — What is seed.spec.ts and why is it the critical integration point?

The seed test connects the agents to the eight-level framework:

```typescript
// seed.spec.ts
import { test, expect }                      from './fixtures';
import { generateEmployee, generateUser,
         generateLeave }                     from './data/generate';
import { readEnv }                           from './data/readers';
import { EmployeeData, UserData, LeaveData } from './data/types';
import { EmployeeApi, UserApi, LeaveApi }    from './api';

test('seed', async ({
  page,
  addEmployeePage,
  employeeListPage,
  userManagementPage,
  addUserPage,
  applyLeavePage,
  leaveListPage,
  employeeApi,
  userApi,
  leaveApi,
}) => {
  // Confirms auth state is loaded, app is reachable
  await page.goto('/web/index.php/dashboard/index');
  await expect(page).toHaveURL(/dashboard/);
});
```

**Why it is critical:**

The planner runs this test before exploring the application. The auth state
is loaded (`storageState` from `global-setup.ts`), all fixtures are activated,
and the API clients are available. The planner sees the application post-setup,
not the login page.

The generator reads the seed as a pattern reference. By importing every
fixture and data utility, the seed communicates to the generator:

- "These are the fixtures available — use them, do not instantiate page objects
  manually in tests"
- "This is the correct import path for generators — `./data/generate`, not inline"
- "These are the API fixtures — use `employeeApi.create()` for preconditions"
- "Import from `./fixtures`, never from `@playwright/test` directly"

The richer the seed's imports, the more conventions the generator picks up
automatically without needing to be told explicitly.

---

## Q510.7 — What does a planner prompt look like and what does it produce?

Planner prompt in VS Code Copilot (Agent mode):

```
Use the playwright test planner agent.

Context:
- seed test: seed.spec.ts
- standards: STANDARDS.md
- application URL: https://opensource-demo.orangehrmlive.com

Requirement:
As an Admin, I want to search for system users by username so that
I can quickly find and manage specific user accounts.

Generate a test plan for user search in the Admin module.
Include smoke, regression, and edge case scenarios.
```

Example planner output in `specs/user-search.md`:

```markdown
# OrangeHRM — User Search Test Plan

## Test Scenarios

### Scenario 1 — Search Returns Matching User [smoke, critical]
Precondition: A system user exists with a known username.
Steps: Navigate to Admin → User Management, enter username, click Search.
Expected: Table shows exactly one row with the correct username.

### Scenario 2 — Non-Existent Username Shows No Results [regression, medium]
Precondition: None.
Steps: Enter a username that does not exist, click Search.
Expected: "No Records Found" message, no rows.

### Scenario 3 — Empty Search Returns All Users [regression, medium]
Steps: Leave Username field empty, click Search.
Expected: Table shows all users, row count greater than zero.

### Scenario 4 — Partial Username Match [regression, high]
Precondition: User exists whose username contains 'admin'.
Steps: Enter partial username, click Search.
Expected: All matching users shown; others not shown.
```

The plan is reviewed and edited before the generator runs. Editing the
plan is cheaper than correcting generated code.

---

## Q510.8 — What does the generator produce from the plan?

Generator prompt in VS Code Copilot (Agent mode):

```
Use the playwright test generator agent.

Context:
- spec: specs/user-search.md
- seed test: seed.spec.ts
- standards: STANDARDS.md

Generate tests for all scenarios. Follow STANDARDS.md exactly.
Save to tests/admin/user-search.spec.ts.
```

Example generator output (abridged):

```typescript
// tests/admin/user-search.spec.ts
import { test, expect }                from '../../fixtures';
import { generateEmployee, generateUser } from '../../data/generate';

test.describe('Admin — User Search', () => {

  let empNumber: string;
  let employee:  ReturnType<typeof generateEmployee>;
  let user:      ReturnType<typeof generateUser>;

  test.beforeAll(async ({ employeeApi, userApi }) => {
    employee  = generateEmployee();
    empNumber = await employeeApi.create(employee);
    user      = generateUser(employee);
    await userApi.create(user, empNumber);
  });

  test.afterAll(async ({ employeeApi }) => {
    if (empNumber) await employeeApi.delete(empNumber);
  });

  test('search returns matching user',
    { tag: ['@admin', '@smoke', '@critical'] },
    async ({ userManagementPage }, testInfo) => {
      testInfo.annotations.push({ type: 'username', description: user.username });

      await userManagementPage.searchByUsername(user.username);
      await userManagementPage.assertUserExistsInList(user.username);
      await userManagementPage.assertTableRowCount(1);
    }
  );

  test('search returns no results for unknown username',
    { tag: ['@admin', '@regression', '@medium'] },
    async ({ userManagementPage }) => {
      const phantom = generateUser(generateEmployee());
      await userManagementPage.searchByUsername(phantom.username + 'NOTEXIST');
      await userManagementPage.assertNoRecordsFound();
    }
  );

});
```

---

## Q510.9 — How do you review generated code against STANDARDS.md?

Before running the healer, verify the generated file against this checklist:

- ✅ Imports from `../../fixtures` — not `@playwright/test` directly
- ✅ Uses `generateEmployee()` and `generateUser()` — no hardcoded data
- ✅ `beforeAll` API setup and `afterAll` cleanup when shared preconditions exist
- ✅ Typed data objects — `generateEmployee()` returns `EmployeeData`
- ✅ Three tags on every test — module, type, severity
- ✅ `testInfo.annotations` for generated IDs
- ✅ Page object methods used — no raw `page.click()` or `page.fill()` in tests
- ✅ Assertion methods with `assert` prefix
- ✅ No hardcoded strings for expected values that should come from generators
- ✅ `.describe()` on all locators if new page objects were generated

If anything violates standards, correct it manually before running the healer.
The healer fixes test failures — it does not fix standards violations.

---

## Q510.10 — What does the healer do when a test fails?

Healer prompt:

```
Use the playwright test healer agent.

Run tests in tests/admin/user-search.spec.ts.
Fix any failing tests.
Do not change passing tests.
If a test failure indicates the functionality is broken rather than
the test being wrong, mark the test as skipped with a comment explaining why.
```

**When it finds a failing test:**

1. Replays the failing steps up to the point of failure
2. Pauses and inspects the current DOM
3. Identifies the root cause: changed locator, missing wait, incorrect assertion
4. Patches the test — updates the failing line
5. Re-runs — repeats until the test passes

**When it cannot fix the test:**

If the healer determines the application is not behaving as expected (a
genuine defect, not a test error), it marks the test `test.skip()`:

```typescript
test.skip('admin can approve leave request',
  // HEALER: Skipped — approval button is not rendered on the leave list page.
  // This appears to be a genuine defect in the demo environment.
  // Re-enable when the button is confirmed present.
  { tag: ['@leave', '@smoke', '@critical'] },
  async ({ leaveListPage }) => { ... }
);
```

This surfaces the defect without hiding it in a permanently failing test.
The skip comment is a tracked record of the known issue.

---

## Q510.11 — What is the full cycle demonstrated on the Job Title Management feature?

```
New requirement: Job Title Management
  - Admin can add a job title with name and description
  - Admin can edit an existing job title
  - Admin can delete a job title
  - Duplicate names are rejected with a validation error
```

**Step 1 — Run the planner** with the requirement:
→ `specs/job-title-management.md` is created with 4–6 scenarios.
Review and adjust: confirm scenarios match acceptance criteria, add edge
cases for duplicate validation, remove out-of-scope scenarios.

**Step 2 — Run the generator** with the plan:
→ `tests/admin/job-title-management.spec.ts` is created.
Generator may also create `pages/admin/JobTitlePage.ts` if that page object
does not exist. Review against `STANDARDS.md` checklist.

**Step 3 — Run the healer** on the new spec file:
→ Locators that are slightly off are corrected. Timing issues resolved.
Any tests exposing genuine defects are skipped with comments.

**Step 4 — Human review:**
- Review all generated and healed code against `STANDARDS.md`
- Run `npm run test:smoke` to confirm no regressions
- Commit spec, tests, and any new page objects

**Total time from requirement to committed tests: minutes, not hours.**

---

## Q510.12 — What are the honest boundaries of what agents can and cannot do?

**What agents do well:**
- Exploring unfamiliar application areas and producing structured test plans
- Generating test code that follows the seed test's patterns
- Fixing broken locators when UI changes cause test failures
- Covering happy-path and common edge case scenarios

**What agents cannot do:**

**Decide what to test.** The planner proposes scenarios — but which scenarios
matter, which risks are highest, and which edge cases are business-critical
requires domain knowledge and risk assessment. The planner produces coverage;
the human decides what coverage means.

**Understand test independence.** The generator follows the seed's patterns
but does not reason about whether a test creates a dependency that another
test relies on. API setup, `beforeAll`/`afterAll` patterns, and cleanup logic
require human judgment about state management.

**Keep STANDARDS.md current.** When the framework evolves — a new helper, a
new fixture pattern, a new naming rule — `STANDARDS.md` must be updated
manually. An outdated standards file produces outdated generated code.

**Handle complex business flows.** Multi-step workflows with conditional
branching and non-obvious data relationships require human-authored specs.

**Replace engineering judgment.** Agents accelerate test authoring. They do
not replace the test engineer who understands the application, knows the risks,
designs the test strategy, and maintains the framework.

---

## Q510.13 — What is the STANDARDS.md section on what the agent must never do?

The explicit prohibition list in `STANDARDS.md` — the most important section
for keeping generated code reviewable:

```markdown
## 8. What the Agent Must Never Do

- Use CSS selectors or XPath — semantic locators only
- Hardcode test data — always use generators
- Put selectors in test files — selectors belong in page objects
- Create page objects without .describe() on locators
- Write tests without all three tags
- Accept individual parameters in composite methods — always typed objects
- Skip beforeAll/afterAll when API-created data needs cleanup
- Import directly from @playwright/test in test files — always use ../../fixtures
- Call locator.click() or locator.fill() directly in page objects — all interactions
  route through this.actions.* or this.controls.*
- Use this.actions.* for OrangeHRM-specific components — selectDropdown,
  fillAutocomplete, fillDateInput belong on this.controls.*
- Use this.controls.* for generic interactions — click, fill, check, hover
  belong on this.actions.*
```

This list makes prohibitions explicit rather than relying on the agent
to infer them from positive examples. Agents respond better to explicit
"never" rules than to inferring exclusions from patterns.

---

## Q510.14 — How do agents connect to the running application?

Playwright Agents use MCP (Model Context Protocol) tools that connect
the AI's reasoning to a live browser instance. The agent definition files
in `.github/` contain MCP tool definitions that allow the AI to:

- Navigate to URLs
- Read the current DOM
- Click elements identified by locator
- Fill input fields
- Take screenshots
- Run `npx playwright test` and read the results

The seed test is run before the planner begins exploration. This ensures
the agent starts from a known state — authenticated admin session, all
fixtures registered, global setup complete. The planner then navigates
through the live application and reads real DOM elements to verify selectors,
not simulated or cached content.

---

## Q510.15 — How does the generator handle new page objects?

If the spec calls for testing a page that has no page object in the
`pages/` directory, the generator creates one:

1. Navigates to the page in the live application
2. Reads the DOM to find relevant form fields, buttons, dropdowns, tables
3. Creates semantic locators for each element using `getByRole`,
   `getByLabel`, `getByPlaceholder`
4. Writes the page object following the `STANDARDS.md` structure template —
   helpers, locators, constructor, navigation, actions, composite methods,
   assertions

The generated page object is reviewed against the same checklist:
every locator has `.describe()`, composite methods accept typed objects,
all interactions route through `this.actions.*` or `this.controls.*`.

If the new feature needs new type definitions (for example, `JobTitleData`),
the generator adds them to `data/types.ts` and creates a corresponding
generator function in `data/generate.ts`.

---

## Q510.16 — What changed and what did not change at Level 9?

**Changed:**
- `STANDARDS.md` — created, encodes all framework conventions
- `seed.spec.ts` — agent entry point
- `.github/playwright-test-planner.md` — created by `init-agents`
- `.github/playwright-test-generator.md` — created by `init-agents`
- `.github/playwright-test-healer.md` — created by `init-agents`
- `specs/` — new folder for planner output
- `tests/` — agents generate new test files here
- `pages/` — agents may generate new page objects here

**Unchanged:**
- All existing page objects
- All helpers
- All fixtures
- The data layer
- The API layer
- All three CI workflows
- `playwright.config.ts`

The framework infrastructure built across Levels 1 through 8 is not touched.
Agents generate code that fits into it. This is the critical design constraint —
agents extend the framework, they do not alter it.

---

## Q510.17 — Why must STANDARDS.md be updated when the framework evolves?

`STANDARDS.md` is the agent's ground truth. It is not derived automatically
from the codebase — it is manually maintained.

When Level 6 added `OrangeHRMControls`, the rule "use `this.controls.*` for
OrangeHRM-specific components" was added to `STANDARDS.md`. If an engineer
adds a new helper (for example, `TableHelpers` at a future Level 10) without
updating `STANDARDS.md`, the generator will not use it. Generated page objects
will implement table interactions inline instead of delegating to `TableHelpers`.

The maintenance contract: every framework decision that changes — new helpers,
new naming conventions, new import rules, new fixture patterns — is reflected
in `STANDARDS.md` before agents run again. Outdated standards produce outdated
generated code.

A practical approach: treat `STANDARDS.md` updates as part of the same commit
that adds a new framework convention, not as a separate cleanup task.

---

## Q510.18 — How does Level 9 complete the nine-level journey?

| Level | Problem Solved |
|-------|----------------|
| 0 | POM theory — understanding design patterns before writing code |
| 1 | Selectors scattered in test files |
| 2 | Boilerplate repeated in every page object |
| 3 | Login repeated before every test |
| 4 | Tests dependent on each other for state |
| 5 | Hardcoded data causing conflicts and maintenance burden |
| 6 | UI patterns reimplemented in every page object |
| 7 | Test results meaningless at scale |
| 8 | Tests running locally only, no team visibility |
| 9 | Test authoring as the productivity bottleneck |

Each level solves one specific problem while introducing the next.
Level 9 completes the loop: the framework is good enough to be used
as training data for an AI agent. The agent can only generate code that
matches the framework's standards because the framework's standards are
good enough to be written down precisely in `STANDARDS.md`.

A framework that cannot be described clearly enough to guide an AI agent
is a framework that cannot be understood clearly enough to be maintained
consistently by a human team either. `STANDARDS.md` is valuable
independent of agents — it is the framework's architectural documentation.

---

## Chapter Summary

- Level 9 addresses test authoring as the bottleneck — agents generate tests from requirements, cutting hours to minutes.
- Three agents: planner (requirement → Markdown plan), generator (plan → TypeScript tests), healer (failing tests → passing or skipped).
- Agents are Playwright-native (v1.56+), initialised with `npx playwright init-agents --loop=vscode`, integrated through VS Code + GitHub Copilot.
- `STANDARDS.md` is the critical integration point — without it, agents generate running code that violates every convention; with it, agents generate mergeable code.
- Seven STANDARDS.md sections: project structure, naming conventions, locator strategy, page object structure, data conventions, test structure, explicit prohibition list.
- `seed.spec.ts` connects agents to the framework: runs before the planner, loads auth state, declares all fixtures and data imports so the generator mirrors them.
- The planner navigates the live application DOM; the generator verifies selectors live; the healer replays failures and patches line by line.
- Pre-healer review checklist: correct imports, generators not hardcode, three tags, annotations, `beforeAll`/`afterAll` pattern, page objects not raw `page.*`.
- The healer marks unfixable tests `test.skip()` with a comment — surfaces real defects without permanently failing tests.
- What agents cannot do: decide what matters to test, reason about state independence, maintain their own standards documentation, handle complex conditional flows, replace engineering judgment.
- STANDARDS.md must be updated with every framework evolution — it is not auto-derived from the codebase; outdated standards produce outdated generated code.
- The full cycle for a new feature: planner → review → generator → review → healer → human review → commit → PR check fires.
- `STANDARDS.md` has value beyond agents — it is the framework's architectural documentation, written precisely enough to guide both AI agents and new team members.
- The nine-level journey ends with a framework good enough to teach itself: each level solves one problem, introduces the next, and Level 9 closes the loop by using the framework as its own training data.
