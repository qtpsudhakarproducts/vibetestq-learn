# Chapter 904 — Agent Skills & SKILL Files

SKILL files are structured markdown documents that teach AI agents how to work
within a specific system. They are the primary mechanism for making AI agents
produce framework-consistent code without pasting hundreds of lines of source
files into every prompt. This chapter covers what SKILL files are, how to write
them, how they differ from regular documentation, and how the Playwright CLI
uses them.

---

## Q904.1 — What is a SKILL file?

A SKILL file is a compact markdown document that gives an AI agent the minimum
information it needs to work correctly within a specific system. It is typically
100–400 lines and covers:

- What the system does and how it is structured
- The exact patterns the agent should follow
- One or two concrete code examples showing those patterns
- A list of anti-patterns the agent must avoid
- The expected output format

SKILL files are not documentation for humans — they are instructions for agents.
They are written in the same way you would brief a new contract developer who
is senior but has never seen your specific framework: tell them the structure,
show them one example, list the rules, and let them work.

---

## Q904.2 — Why are SKILL files better than pasting full source files?

The naive approach to giving an agent framework context is to paste source files
into the prompt. This approach has three problems:

**Token cost.** A full `BasePage.ts` is ~800 tokens. Full `playwright.config.ts`
is ~600 tokens. Full fixture file is ~1,200 tokens. Pasting all three for every
generation call costs ~2,600 tokens per call. At scale across an entire test
suite, this is expensive.

**Noise.** Full source files contain implementation details that are irrelevant
to the agent's task. A test generator does not need to see the internals of
`BasePage` — it needs to know the public API it should call. Irrelevant content
dilutes the relevant signal.

**Maintenance.** As files change, pasted content becomes stale. A SKILL file
is a curated summary that requires an update only when the patterns change —
not when implementation details change.

A SKILL file for the same three files above:
- `BasePage` public API: ~100 tokens
- `playwright.config.ts` relevant settings: ~80 tokens
- Fixture pattern: ~120 tokens
- Example test: ~250 tokens
- Anti-patterns list: ~100 tokens
Total: ~650 tokens — 75% less than pasting the full files.

---

## Q904.3 — What is the structure of an effective SKILL file?

```markdown
# [System Name] SKILL

## What This Is
One paragraph: what this system does and who uses it.

## Directory Structure
```
src/
  pages/     ← page object classes
  fixtures/  ← Playwright fixtures
  specs/     ← test files
  data/      ← test data factories
```

## Core Patterns

### Pattern 1 — [Pattern name]
Brief explanation of when and why.
```typescript
// Minimal code example showing the pattern
```

### Pattern 2 — [Pattern name]
```typescript
// Example
```

## Complete Example
A complete, working example showing everything above in context.
```typescript
// Full test file or page object
```

## Rules
- Rule 1 (what to always do)
- Rule 2 (what to never do)
- Rule 3

## Anti-Patterns (Never Do)
```typescript
// Wrong example
```
Because: [brief reason]

## Expected Output
Describe what a correct output looks like. What files should be created,
what they should contain, what naming conventions to follow.
```

---

## Q904.4 — How does the Playwright CLI use SKILL files?

Playwright CLI is a command-line tool that runs AI agents to generate and
maintain tests. It uses SKILL files as the agent's instruction set — telling
the agent how your framework works before it starts writing code.

When you run a Playwright CLI command, the agent:
1. Reads the SKILL file specified (or looks for a default SKILL.md in the project)
2. Loads the SKILL into its context as the framework instruction
3. Reads the task you gave it
4. Generates code that follows the SKILL's patterns
5. Runs the generated code to verify it passes

The SKILL file is what makes the generated code fit YOUR framework instead of
a generic Playwright setup. Without a SKILL, the agent generates code based
only on Playwright's default patterns. With a good SKILL, it generates code
that uses your page objects, fixtures, naming conventions, and locator strategy.

---

## Q904.5 — How do you write a SKILL file for a Playwright POM framework?

```markdown
# Playwright OrangeHRM Framework SKILL

## What This Is
A Playwright TypeScript test automation framework for OrangeHRM.
Uses Page Object Model (L7 level) with Faker test data, custom fixtures,
and API-first state setup.

## Directory Structure
```
tests/
  specs/         ← *.spec.ts test files
  pages/         ← Page objects (extend BasePage)
  fixtures/      ← Custom fixtures (extend Playwright test)
  data/          ← testData factory functions
  helpers/       ← Reusable action helpers (e.g., fillLeaveForm)
  utils/         ← Shared utilities
playwright.config.ts
```

## Import Pattern
```typescript
// In test files — import from fixture, not directly from playwright
import { test, expect } from '../fixtures/base.fixture';
// Page objects are injected by fixtures — never instantiate directly in tests
```

## Fixture Pattern
```typescript
// fixtures/base.fixture.ts
export const test = base.extend<Fixtures>({
  employeePage: async ({ page }, use) => {
    await use(new EmployeePage(page));
  },
});
```

## Page Object Pattern
```typescript
// pages/employee.page.ts
export class EmployeePage extends BasePage {
  readonly nameInput = this.page.getByLabel('First Name');

  constructor(page: Page) { super(page); }

  async navigate(): Promise<void> {
    await this.page.goto('/web/index.php/pim/viewEmployeeList');
  }

  async fillFirstName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }
}
```

## Test Data Pattern
```typescript
// Always use testData factory — never hardcode strings
import { testData } from '../data/test-data';
const employee = testData.employee();  // returns typed object with fake data
```

## Complete Test Example
```typescript
import { test, expect } from '../fixtures/base.fixture';
import { testData } from '../data/test-data';

test.describe('Employee Management', () => {
  test('admin can add a new employee', async ({ employeePage }) => {
    const data = testData.employee();

    await employeePage.navigate();
    await employeePage.clickAddEmployee();
    await employeePage.fillFirstName(data.firstName);
    await employeePage.fillLastName(data.lastName);
    await employeePage.clickSave();

    await expect(employeePage.successMessage).toBeVisible();
    await expect(employeePage.getEmployeeRow(data.fullName)).toBeVisible();
  });
});
```

## Rules
- Use getByRole for buttons/links, getByLabel for form fields, getByTestId as last resort
- Never use CSS selectors or XPath
- Never use page.waitForTimeout() — use expect assertions
- Tests must be independent — each creates its own data via API or testData factory
- All page object methods return Promise<void>
- Use testData factory for all test data — never hardcode

## Anti-Patterns
```typescript
// WRONG — direct page interaction in test
await page.click('#save-btn');
await page.fill('.name-input', 'John');

// WRONG — hardcoded data
await employeePage.fillFirstName('John');

// WRONG — explicit wait
await page.waitForTimeout(2000);
```
```

---

## Q904.6 — How do SKILL files differ from STANDARDS.md documentation?

Both documents encode team conventions, but for different audiences:

**STANDARDS.md** is written for human developers:
- Full explanations of why each rule exists
- Architecture decision records
- Links to external documentation
- Long-form examples with commentary
- 500–2,000 lines

**SKILL file** is written for AI agents:
- Minimal explanation — just what the agent needs to know
- One example per pattern (not multiple variations)
- Dense information — every token must earn its place
- No rationale — just the rule
- 100–400 lines

The two documents serve different purposes and should be maintained separately.
When a convention changes, update both — but do not conflate them. A SKILL that
reads like STANDARDS.md documentation is too verbose to be effective as an agent
instruction set.

---

## Q904.7 — What makes a SKILL file effective vs ineffective?

**Effective SKILL characteristics:**

**Concrete examples.** The agent learns from code, not from descriptions of code.
"Use getByRole for buttons" plus a code example is far more effective than just
the text rule.

**Single source of truth per pattern.** Show one canonical way to do each thing.
If you show two ways, the agent may pick either one inconsistently.

**Explicit anti-patterns.** Telling the agent what NOT to do is as important as
what to do. Without explicit anti-patterns, the model defaults to patterns from
its training data — which includes CSS selectors, hardcoded timeouts, and other
practices you have moved away from.

**Minimal but complete.** Every line should be necessary. If removing a line
would not affect output quality, remove it. A SKILL file that is too long is
read with less attention than a focused one.

**Tested with the agent.** The only way to know a SKILL works is to run the
agent with it and check the output. SKILL files should be versioned and
refined as you observe where the agent goes wrong.

---

## Q904.8 — How do you version and maintain SKILL files?

SKILL files are engineering assets and should be managed like code:

**Store in the repository:**
```
docs/
  skills/
    playwright-framework.skill.md   ← main framework SKILL
    api-testing.skill.md            ← API testing patterns
    visual-testing.skill.md         ← visual test patterns
```

**Version with the framework.** When a coding convention changes, update the
SKILL in the same PR. A SKILL that describes old patterns is worse than no
SKILL — it actively teaches the agent the wrong approach.

**Test the SKILL after changes.** After updating a SKILL, run a generation
task and check that the output follows the new pattern. If the output still
uses the old pattern, the SKILL update was not clear enough.

**Track agent errors back to SKILL gaps.** When the agent generates wrong code,
ask: is this wrong because the SKILL does not cover this case? If so, add the
missing case to the SKILL before the next generation run.

---

## Q904.9 — How do you write a SKILL file for an API testing agent?

```markdown
# API Testing SKILL

## What This Is
API tests for OrangeHRM REST API using Playwright's APIRequestContext.
Tests verify backend behaviour independently of the UI.

## Base URL
Set in playwright.config.ts as `baseURL`. Use relative paths in tests.

## Authentication
Use apiFixture which provides a pre-authenticated APIRequestContext.
Do not manually set Authorization headers — the fixture handles this.

## Request Pattern
```typescript
// GET request
const response = await request.get('/api/v2/employees');
expect(response.status()).toBe(200);
const body = await response.json();
expect(body.data).toHaveLength(greaterThan(0));

// POST request
const response = await request.post('/api/v2/employees', {
  data: { firstName: 'Test', lastName: 'User' }
});
expect(response.status()).toBe(200);
```

## Schema Validation
```typescript
import { employeeSchema } from '../schemas/employee.schema';
const body = await response.json();
expect(() => employeeSchema.parse(body)).not.toThrow();
```

## Complete Example
```typescript
import { test, expect } from '../fixtures/api.fixture';

test('GET /employees returns list with status 200', async ({ request }) => {
  const response = await request.get('/api/v2/employees');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('data');
  expect(Array.isArray(body.data)).toBe(true);
});
```

## Rules
- Assert both status code AND response body shape
- Use schema validation for complex response objects
- API tests do not use page — they use request fixture only
- Create test data via API in beforeEach, clean up in afterEach

## Anti-Patterns
- Do not use UI to set up state for an API test
- Do not hardcode auth tokens — use the fixture
```

---

## Q904.10 — What is the relationship between SKILL files and the agent's loop?

In an agent loop, the SKILL file functions as the agent's persistent memory of
how the framework works. Each iteration of the loop re-reads the SKILL (since
LLMs have no memory between calls):

```
Agent loop iteration N:
  Context = [SKILL file] + [current task] + [recent observations]
  
  The SKILL is in every context window. It does not decay.
  It ensures consistency from iteration 1 to iteration 50.
```

Without a SKILL file, an agent working across many iterations tends to drift —
early iterations produce clean code, but later iterations (with more context
history and less room for instructions) revert to generic patterns.

The SKILL file is the stabilising anchor. As long as it fits in context, the
agent's output quality remains consistent regardless of how many iterations
have passed.

---

## Q904.11 — How do you write a SKILL file for a POM level-specific agent?

When an agent is tasked with generating code at a specific POM level, the SKILL
should encode the constraints and patterns of that level:

```markdown
# POM L5 Test Data SKILL

## What This Is
Test data layer for OrangeHRM Playwright framework (POM Level 5).
Provides typed, Faker-generated test data for all test scenarios.

## Location
All factories in: tests/data/test-data.ts

## Factory Pattern
```typescript
import { faker } from '@faker-js/faker';

interface EmployeeData {
  firstName: string;
  lastName: string;
  employeeId: string;
  fullName: string;
}

export const testData = {
  employee(): EmployeeData {
    const firstName = faker.person.firstName();
    const lastName  = faker.person.lastName();
    return {
      firstName,
      lastName,
      employeeId: `EMP-${Date.now()}`,
      fullName:   `${firstName} ${lastName}`,
    };
  },
};
```

## Rules
- Every factory returns a typed object (not a plain string)
- Use faker for all realistic data — never hardcode
- Include derived fields (fullName = firstName + lastName)
- employeeId must be unique — use Date.now() suffix

## Adding New Factories
Follow the pattern above. Export from testData object. Add TypeScript interface.
```

---

## Q904.12 — What is a composite SKILL and when do you use it?

A composite SKILL combines instructions for multiple related systems in one file.
Use it when an agent's task spans more than one layer of the framework.

```markdown
# Full Test Generation SKILL

## 1. Page Object Layer
[page object patterns — 100 tokens]

## 2. Fixture Layer
[fixture patterns — 80 tokens]

## 3. Test Layer
[test file patterns — 120 tokens]

## 4. Complete End-to-End Example
[full example spanning all layers — 250 tokens]
```

Use a composite SKILL for end-to-end test generation tasks where the agent
must create the page object, the fixture, and the test file in one run.

Use separate SKILLs when the agent is doing one focused task (e.g., only
generating page objects) or when the composite would exceed 500 tokens.

---

## Q904.13 — How do you measure SKILL file effectiveness?

Track these metrics per SKILL:

**Generated code compliance rate:** what percentage of generated code follows
the SKILL's patterns exactly? Target: >85%.

**First-run pass rate:** what percentage of generated tests pass without edits?
Target: >70%.

**Anti-pattern appearance rate:** how often does the agent use a pattern the
SKILL explicitly forbids? Target: <5%.

**Measurement method:** save 10 generation outputs for each SKILL per week.
Review them manually or run a second AI pass that checks compliance with
the SKILL's rules. Track the rates over time.

Falling compliance after a framework change is the signal that the SKILL needs
updating.

---

## Q904.14 — In your project, how do you use SKILL files in practice?

In our OrangeHRM framework, we have three SKILL files:
- `playwright-framework.skill.md` — the main POM framework SKILL
- `api-testing.skill.md` — the API layer patterns
- `visual-testing.skill.md` — visual regression patterns

When using Cursor or GitHub Copilot for test generation, we reference the
framework SKILL at the start of every generation session by adding it to the
Cursor rules or as a system prompt in Copilot's advanced settings.

When using the Playwright CLI agent, the SKILL file is specified in the CLI
configuration. The agent reads it before every task.

The most valuable lesson from building these SKILLs: a SKILL that shows one
complete working example is worth more than five paragraphs of text rules.
When we added the complete test example to our main framework SKILL, the
generated tests that required no editing went from 41% to 73%.

---

## Q904.15 — What is the future of SKILL files as AI agents become more capable?

As of 2026, SKILL files are necessary because AI agents do not have persistent
memory of your specific framework — they need to be reminded in every context
window. As agent memory systems mature, this will change.

Future agents will index your entire codebase once, build a persistent internal
model of your framework, and retrieve patterns on demand without needing a
SKILL file in every context window.

Even then, SKILL files will remain valuable as:
- Authoritative, curated documentation of intended patterns (vs. inferring
  patterns from possibly-inconsistent code)
- Version-controlled records of when patterns changed
- Human-readable briefs that engineers use to onboard new team members

The SKILL file may evolve from "what the agent reads every time" to "what the
agent reads once to build its memory" — but the need to articulate your
framework's patterns clearly and concisely will not disappear.

---

## Chapter Summary

- A SKILL file is a compact AI instruction document — not human documentation. It tells an agent the minimum it needs to generate correct, framework-consistent code.
- SKILL files are 75–90% cheaper in tokens than pasting full source files, and produce better output because they remove irrelevant noise.
- Effective SKILL files: concrete code examples, single canonical pattern per concept, explicit anti-patterns, minimal but complete, tested with the agent.
- Structure: What This Is → Directory Structure → Core Patterns → Complete Example → Rules → Anti-Patterns → Expected Output.
- SKILL files are different from STANDARDS.md — they are written for agents, not humans. Dense, minimal, example-heavy.
- SKILL files should be version-controlled alongside the framework. Update in the same PR as the convention they describe.
- The Playwright CLI uses SKILL files as its instruction set. The SKILL is loaded before every generation task.
- The SKILL is the stabilising anchor in an agent loop — ensures consistent output across many iterations by keeping framework patterns in every context window.
- Measure SKILL effectiveness: compliance rate, first-run pass rate, anti-pattern appearance rate. Update when compliance drops.
