# Chapter 902 — Prompt Engineering for Test Automation

Prompt engineering is the skill of writing instructions that get reliable,
useful output from an LLM. For test automation engineers, it is the difference
between AI-generated code that works on the first try and code that needs heavy
rework. This chapter covers the RCIF framework, prompting techniques, prompt
patterns specific to Playwright, and how to standardise prompts across a team.

---

## Q902.1 — What is prompt engineering and why does it matter for testers?

Prompt engineering is writing instructions to an LLM in a way that produces
reliable, high-quality output. The quality of the output is determined almost
entirely by the quality of the input.

For test automation engineers, prompt engineering matters because:

**Bad prompt → unusable code.** A vague prompt like "write a test for login"
produces generic code that uses invented selectors, does not match your page
object structure, and may use deprecated Playwright APIs.

**Good prompt → production-ready code.** A structured prompt that includes
your role, the application context, your coding standards, and the exact format
you want produces code that compiles, follows your conventions, and tests the
right thing.

The skill is not about memorising magic phrases — it is about learning what
information an LLM needs to do its job well, and providing that information
clearly.

---

## Q902.2 — What is the RCIF framework for writing prompts?

RCIF stands for Role, Context, Instruction, Format. It is a four-part structure
for writing prompts that produce consistent, high-quality results.

**R — Role:** Tell the model who it is.
```
Act as a Senior SDET with 5 years of Playwright and TypeScript experience.
```

**C — Context:** Give the background the model needs.
```
We are testing OrangeHRM. The Employee page has a data table with columns:
Employee Name, Job Title, Employment Status, Sub Unit, Action.
The page object is EmployeePage with method getEmployeeRow(name: string).
```

**I — Instruction:** Tell the model exactly what to do.
```
Write a Playwright test that verifies a newly created employee appears in the
employee list with the correct job title.
```

**F — Format:** Tell the model exactly how to format the output.
```
Output only the TypeScript test file. No explanation. Use imports from
'@playwright/test'. Follow the project's pattern: fixtures import from
'../fixtures', page objects from '../pages'.
```

Combined:
```
Act as a Senior SDET with 5 years of Playwright and TypeScript experience.

We are testing OrangeHRM. The Employee page has a data table. The page
object EmployeePage has a method getEmployeeRow(name: string) that returns
a Locator for the table row matching that employee name.

Write a Playwright test that verifies a newly created employee appears in
the employee list with the correct job title.

Output only the TypeScript test file. No explanation.
```

---

## Q902.3 — What is zero-shot prompting and when do you use it?

Zero-shot prompting asks the LLM to do a task without providing any examples.
The model relies entirely on its training knowledge.

```
Zero-shot prompt:
"Explain what page.waitForLoadState('networkidle') does in Playwright."
```

Use zero-shot when:
- The task is simple and well-defined
- The topic is well-covered in the model's training data (Playwright, TypeScript)
- You want a quick answer and do not need custom formatting

Zero-shot works well for: explaining concepts, converting small code snippets,
answering factual questions about Playwright APIs.

Zero-shot fails when:
- You need output that follows your specific framework patterns
- The model has not seen enough examples of your particular task
- You need consistent, reproducible output across multiple calls

---

## Q902.4 — What is few-shot prompting and when is it better than zero-shot?

Few-shot prompting provides the model with examples of the input-output pattern
you want before giving it the actual task. The examples show the model your
format, style, and conventions.

```typescript
// Few-shot prompt for generating page object methods
/*
Here are examples of how we write page object methods in our project:

EXAMPLE 1:
// Input: "click the Save button"
async clickSave(): Promise<void> {
  await this.page.getByRole('button', { name: 'Save' }).click();
}

EXAMPLE 2:
// Input: "fill the Employee ID field with a value"
async fillEmployeeId(id: string): Promise<void> {
  await this.page.getByLabel('Employee ID').fill(id);
}

Now generate a method for: "select a value from the Job Title dropdown"
*/
```

Few-shot is better than zero-shot when:
- You need code that matches your team's specific patterns
- The default model output is close but needs style adjustment
- You are generating a series of similar items and want consistency

For test generation, few-shot examples from your actual test files produce
output that needs less editing than zero-shot prompts.

---

## Q902.5 — What is chain-of-thought prompting and when do you use it?

Chain-of-thought (CoT) prompting asks the model to reason through a problem
step by step before giving the final answer. Adding "think step by step" or
"let's reason through this" to a prompt triggers this behaviour.

```
Zero-shot prompt:
"This Playwright test is flaky. Fix it."
[paste test code]

Chain-of-thought prompt:
"This Playwright test is flaky. Before suggesting a fix:
1. Identify all async operations in the test
2. Find any assertions that might race with network activity
3. Check if any waitFor* calls could time out on slow CI
4. Then suggest specific fixes for each issue you found.

[paste test code]"
```

CoT is most useful for:
- Debugging complex failures (flaky tests, race conditions)
- Designing test architecture decisions
- Analysing trade-offs between approaches
- Tasks where the reasoning matters, not just the answer

For simple code generation, CoT adds unnecessary overhead. Use it when the
task needs real analysis, not just pattern completion.

---

## Q902.6 — What is role prompting and why does it improve code generation?

Role prompting sets the model's persona, expertise level, and constraints before
the task. It works because training data contains different quality levels of
content from different "types" of authors.

```
Without role: "Write a Playwright test for the login page."
→ Generic output, may use outdated patterns

With role: "Act as a Senior SDET who has built enterprise-scale Playwright
frameworks for 5 years. You write TypeScript with strict mode and always use
the accessibility-first locator strategy. Write a Playwright test for login."
→ More idiomatic, uses getByRole, includes proper typing
```

The role should match the output quality you want:
- **"Senior SDET"** → structured, idiomatic code
- **"Principal test architect"** → architectural thinking, discusses trade-offs
- **"QA lead documenting for the team"** → clear explanations, readable code

Role prompting is most effective when combined with context and examples.
Alone, it improves quality slightly. Combined with RCIF, it significantly
reduces the editing needed after generation.

---

## Q902.7 — What prompt patterns are specific to Playwright test generation?

**Pattern 1 — Generating a test from a spec:**
```
Act as a Senior SDET using Playwright TypeScript.

Feature: Leave Application
- User navigates to Leave > Apply
- Selects leave type "Annual Leave"
- Selects From Date and To Date
- Fills Comment field
- Clicks Apply
- Verifies success message "Successfully Saved"

Framework conventions:
- Import test from '../fixtures/base.fixture'
- Page objects are in '../pages/' and passed via fixtures
- Use getByRole and getByLabel — no CSS selectors
- Each test should have a descriptive name

Write the complete test file.
```

**Pattern 2 — Fixing a broken test:**
```
This Playwright test fails with:
  Error: Timeout 30000ms exceeded waiting for expect(locator).toBeVisible()
  Call log: waiting for getByRole('dialog', { name: 'Success' })

The test:
[paste test code]

The current HTML after the button click:
[paste HTML snippet]

Diagnose why the dialog locator fails and suggest a fix.
Explain your reasoning before giving the corrected code.
```

**Pattern 3 — Generating a page object:**
```
Act as a Senior SDET using Playwright TypeScript.

Here is the HTML for the Employee Add form: [paste HTML]
Here is our BasePage class: [paste BasePage]
Here is an example page object (LoginPage): [paste LoginPage.ts]

Generate an EmployeeAddPage class that:
- Extends BasePage
- Has typed locators for all form fields
- Has action methods: fillFirstName, fillLastName, selectJobTitle, clickSave
- Returns Promise<void> from all action methods

Output only the TypeScript class.
```

---

## Q902.8 — How do you prevent AI from generating code with invented Playwright methods?

Invented methods are the most common hallucination in Playwright generation.
Three techniques prevent them:

**1. Ground the model with your imports:**
```
The only Playwright imports available are:
import { test, expect } from '@playwright/test';
import { Locator, Page } from '@playwright/test';

Do not use any methods not available on the standard Page and Locator classes.
```

**2. Provide the method list explicitly for complex assertions:**
```
Available expect methods for locators:
toBeVisible(), toBeHidden(), toBeEnabled(), toBeDisabled(),
toHaveText(), toContainText(), toHaveValue(), toHaveAttribute(),
toHaveClass(), toHaveCount(), toBeFocused(), toBeChecked()

Use only these. Do not invent methods like toBePresent() or assertText().
```

**3. Run generated code immediately:**
TypeScript compilation catches most invented methods. A CI lint step that runs
`tsc --noEmit` before tests will catch hallucinated method names before they
reach the test runner.

---

## Q902.9 — How do you write prompts that generate self-contained, independent tests?

Poor AI-generated tests often depend on each other — test B assumes test A
already created some data. To prevent this:

```
Critical requirements for every test:
1. Each test must create its own test data via API before the test runs
2. Each test must clean up after itself or use unique data that does not conflict
3. Never use data created by another test
4. Do not use hardcoded IDs or data that might already exist in the environment

Test data creation pattern:
const employee = await createEmployeeViaApi(request, {
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  employeeId: `EMP-${Date.now()}`
});

// Use employee data in the test
// Clean up in afterEach
```

---

## Q902.10 — How do you build a team prompt library?

Individual prompt quality varies widely. A team prompt library standardises
the prompts that work well, so every engineer gets consistent AI output.

```markdown
# docs/prompt-templates.md

## Template 1 — Generate test from user story
Role: Senior SDET using Playwright TypeScript on OrangeHRM
Context: [insert feature context]
Standards: See STANDARDS.md
Instruction: Write a test file for this user story: [insert story]
Format: TypeScript file, imports from '../fixtures/base.fixture', no explanations

---

## Template 2 — Fix a failing test
Role: Senior SDET debugging a Playwright test
Context: Framework uses Playwright 1.50, TypeScript strict mode
Error: [paste error message]
Test code: [paste test]
Instruction: Diagnose the failure and provide a fixed test with explanation
Format: Explanation first, then corrected code

---

## Template 3 — Generate page object from HTML
Role: Senior SDET building a Playwright POM framework
Context: Base class is BasePage. See example page object below: [paste example]
HTML: [paste HTML]
Instruction: Generate a page object for this page
Format: TypeScript class only, no tests

---

## Template 4 — Review a test for quality
Role: Senior SDET reviewing a test for quality
Review for: flakiness risks, missing assertions, locator quality, test independence
Test: [paste test]
Instruction: Rate each criterion 1-5 and suggest improvements
Format: Score table then list of specific code improvements
```

---

## Q902.11 — What is negative prompting and when do you use it?

Negative prompting explicitly tells the model what NOT to do. It is most useful
when the model has a strong default behaviour that conflicts with your requirements.

```
Do NOT:
- Use page.waitForTimeout() — use expect assertions with auto-waiting instead
- Use CSS class selectors — use getByRole, getByLabel, or getByTestId
- Use XPath — it is banned in our framework
- Add try/catch blocks — let Playwright's error reporting handle failures
- Add console.log statements — use testInfo.attach for debugging info
- Use implicit any types — TypeScript strict mode is required
```

Negative prompting is especially effective when you have tried a normal prompt
multiple times and the model keeps reverting to a pattern you do not want.
Explicitly forbidding it in the prompt is more reliable than describing the
correct pattern repeatedly.

---

## Q902.12 — How do you use prompt chaining for complex test generation?

Prompt chaining breaks a complex task into a sequence of focused calls, where
the output of one call becomes the input of the next.

**Example — Generate a full test file in three chained calls:**

**Call 1 — Generate test scenarios:**
```
Given this user story: [story]
Generate 5–8 test scenario titles (no code). 
One positive path, the rest negative/edge cases.
```

**Call 2 — Generate test structure from scenarios:**
```
Here are the test scenarios: [output from Call 1]
Here is the page object: [paste page object]
Generate the test file structure — test.describe block, test cases with
empty bodies, imports — but no test body code yet.
```

**Call 3 — Fill in each test body:**
```
Here is the test structure: [output from Call 2]
Here is the page object: [paste page object]
Here is an example test for reference: [paste one complete test]
Fill in the body for test case: "[specific test name]"
```

Chaining produces higher-quality output than a single large prompt because
each call is focused on a smaller, well-defined task. It also avoids hitting
output token limits when generating large test files.

---

## Q902.13 — What is a meta-prompt and how is it used for test generation?

A meta-prompt is a prompt that asks the LLM to generate or improve a prompt —
rather than directly generating the output you want.

```
I want to generate Playwright tests from user stories.
My current prompt produces code that uses CSS selectors instead of getByRole.
Here is my current prompt: [paste prompt]

Improve this prompt so the model consistently uses accessibility-first
locators. The model should never use CSS class selectors.
Output only the improved prompt.
```

Meta-prompting is useful when:
- You have a prompt that almost works but keeps failing in one specific way
- You want the model to reason about why a prompt is not working
- You are building a prompt library and want AI to help write the templates

---

## Q902.14 — In your project, how do you standardise prompt usage across the team?

In our OrangeHRM framework, we manage prompts as engineering assets — not
informal conversations each engineer has with AI.

We have a `docs/prompt-templates.md` file in the repository with four
standard templates: test generation, test fixing, page object generation,
and test review. Each template has a structure section (RCIF components),
the prompt text with placeholders, an example, and notes on what the
output should look like.

New engineers learn the templates in the first week. Code reviews check
whether AI-generated code matches framework standards — if it does not,
the reviewer asks which prompt was used and whether the team template
was followed.

The templates are version-controlled. When a framework convention changes,
the corresponding template is updated so the whole team gets consistent
output from the new pattern. This was particularly useful when we migrated
from CSS selectors to getByRole — updating the template meant all subsequent
AI-generated tests used the new pattern automatically.

---

## Q902.15 — What are the signs of a poorly written prompt and how do you fix them?

**Sign 1 — Generic output that does not match your framework:**
Model used CSS selectors, imported from wrong paths, used methods you do not use.
Fix: add the RCIF framework structure. Include your imports and one complete example.

**Sign 2 — Output cuts off before completion:**
Large files exceed the model's output token limit.
Fix: break the request into smaller pieces. Generate one test at a time.

**Sign 3 — Model argues with you or adds warnings:**
"Note: this approach may not be ideal for..."
Fix: add to the prompt: "Do not add any explanations or caveats. Output only code."

**Sign 4 — Inconsistent output across multiple calls:**
Same prompt gives different results each time.
Fix: set temperature to 0. Add few-shot examples to anchor the pattern.

**Sign 5 — Model hallucinates Playwright methods:**
Output uses methods that do not exist in the Playwright API.
Fix: add the negative list ("Do NOT use methods not in the standard Playwright
API"). Immediately run `tsc --noEmit` to catch invented method names.

---

## Chapter Summary

- Prompt engineering is providing the information an LLM needs to do its job well. Output quality is determined by prompt quality.
- RCIF framework: Role (who the model is) + Context (background) + Instruction (what to do) + Format (how to output it). Use this structure for all test generation prompts.
- Zero-shot: no examples, for simple tasks. Few-shot: provide examples, for framework-specific code generation. Chain-of-thought: ask model to reason first, for debugging.
- Role prompting sets quality level. "Senior SDET" produces more idiomatic code than no role.
- Negative prompting explicitly forbids patterns the model defaults to — useful when standard prompting keeps reverting to unwanted behaviour.
- Prompt chaining: break large generation tasks into smaller focused calls. Produces better output and avoids token limits.
- A team prompt library in version control ensures consistent AI output. Templates include RCIF components, examples, and format instructions.
- Signs of a bad prompt: generic output, cut-off files, model argues, inconsistent results, hallucinated methods. Each has a specific fix.
