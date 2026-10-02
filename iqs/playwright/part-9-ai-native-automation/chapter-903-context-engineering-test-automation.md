# Chapter 903 — Context Engineering for Test Automation

Context engineering is the discipline of deciding what information to put in an
LLM's context window — and what to leave out. It is the difference between an
AI agent that generates framework-consistent code and one that hallucinates
generic patterns. This chapter covers the context window as an engineering
resource, how to structure context for test generation, RAG for codebases,
token budgeting, and SKILL files as a context engineering solution.

---

## Q903.1 — What is context engineering and how is it different from prompt engineering?

Prompt engineering is writing the instructions you give to the LLM.
Context engineering is deciding what information surrounds those instructions.

```
Context window = system prompt + context documents + conversation + task

Prompt engineering controls:
  - The system prompt
  - The task instruction
  - The output format specification

Context engineering controls:
  - Which files to include
  - How much of each file to include
  - In what order to present them
  - When to summarise vs paste raw content
  - What to explicitly leave out
```

The distinction matters because even a perfect prompt produces poor output if
the context is wrong. A test generation prompt that includes the wrong page
object, or the right page object but also 20 unrelated files filling the
context window, produces code that does not match the target page.

Context engineering asks: given a limited context window, what is the minimum
information the model needs to do this task well?

---

## Q903.2 — Why is context engineering critical for AI test generation?

When generating a test for a specific page, the model needs to know:

**What to test:** the page's behaviour, the user story, the acceptance criteria.
**How to test it:** your framework's page object for that page, the fixture that
provides the page object, your coding standards.
**How to write it:** a complete example of an existing test that follows your patterns.

Without this context, the model generates code based on patterns from its
training data — which means generic Playwright code, not code that fits your
framework.

With the right context:
```typescript
// AI-generated test WITH correct context — uses your actual page object methods
test('employee appears in list after creation', async ({ employeePage, apiClient }) => {
  const employee = await apiClient.createEmployee(testData.newEmployee());
  await employeePage.navigate();
  await expect(employeePage.getEmployeeRow(employee.fullName)).toBeVisible();
});
```

Without correct context:
```typescript
// AI-generated test WITHOUT correct context — invents structure
test('employee appears in list', async ({ page }) => {
  await page.goto('/employees');
  await page.fill('#firstName', 'John');  // invented selector
  await page.click('text=Save');          // invented pattern
  await expect(page.locator('.employee-list')).toContainText('John');  // CSS class
});
```

---

## Q903.3 — What belongs in the context window for a test generation task?

For a well-structured test generation context, include these layers in order:

**Layer 1 — Framework standards (always present):**
Your `STANDARDS.md` or coding conventions file. 150–300 tokens. Tells the model
your import patterns, locator strategy, naming rules, and anti-patterns.

**Layer 2 — Relevant page objects (task-specific):**
The page object for the page under test. If the test involves navigation between
two pages, include both page objects. Do not include unrelated page objects.

**Layer 3 — Relevant fixtures (task-specific):**
The fixture file that provides the page object(s) in Layer 2. Without this, the
model cannot write correct test imports.

**Layer 4 — A complete test example (quality anchor):**
One complete, passing test from a related area. This shows the exact pattern
the model should follow — test structure, assertion style, data setup approach.

**Layer 5 — The task description:**
The user story, acceptance criteria, or specific behaviour to test.

What NOT to include:
- Unrelated page objects (adds noise, reduces output quality)
- Long configuration files (playwright.config.ts rarely needs to be in context)
- Test output logs from unrelated failures
- Commented-out or deprecated code

---

## Q903.4 — What is a SKILL file and how does it solve context engineering problems?

A SKILL file is a compact, structured markdown document that teaches an AI agent
how to work within a specific system. Instead of including full source files in
every prompt, you write a SKILL that encodes the essential patterns.

A SKILL file for a Playwright test framework might contain:
- The directory structure (5 lines)
- Import patterns (3 lines)
- The locator priority rule (3 lines)
- The naming convention (2 lines)
- One complete example test (20 lines)
- A list of anti-patterns to avoid (5 lines)

Total: ~38 lines ≈ ~300 tokens.

Compare this to including the full framework files:
- `playwright.config.ts`: ~100 lines = ~800 tokens
- `BasePage.ts`: ~150 lines = ~1,200 tokens
- `base.fixture.ts`: ~200 lines = ~1,600 tokens
- `LoginPage.ts` (example): ~100 lines = ~800 tokens
- Total: ~4,400 tokens

A SKILL file achieves the same guidance at 7% of the token cost. For an agentic
loop making 20 tool calls, this difference multiplies significantly.

---

## Q903.5 — How do you write a SKILL file for a Playwright framework?

```markdown
# Playwright Test Framework SKILL

## Project Structure
```
tests/
  specs/           ← test files (*.spec.ts)
  pages/           ← page objects (extends BasePage)
  fixtures/        ← custom fixtures
  data/            ← test data factories
  helpers/         ← reusable action utilities
  utils/           ← shared utilities
```

## Import Pattern
```typescript
import { test, expect } from '../fixtures/base.fixture';
import type { EmployeePage } from '../pages/employee.page';
```

## Locator Priority
1. getByRole (buttons, links, headings)
2. getByLabel (form fields)
3. getByTestId (custom components)
4. CSS/XPath — NEVER use

## Page Object Pattern
```typescript
export class EmployeePage extends BasePage {
  readonly nameInput = this.page.getByLabel('Employee Name');

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }
}
```

## Test Pattern
```typescript
test('employee can be created', async ({ employeePage, api }) => {
  const data = testData.employee();      // factory function
  await employeePage.navigate();
  await employeePage.fillName(data.name);
  await employeePage.clickSave();
  await expect(employeePage.successMessage).toBeVisible();
});
```

## Anti-Patterns (NEVER DO)
- page.waitForTimeout() → use expect assertions
- CSS selectors → use semantic locators
- Hardcoded test data → use testData factory
- Tests that depend on each other → each test must be independent
```

---

## Q903.6 — What is the context window budget and how do you manage it?

For a typical AI test generation call with Claude Sonnet 4.6 (200,000 token
context), a practical budget allocation:

```
System instructions:           ~500 tokens (SKILL file or brief standards)
Page object (task-specific):  ~1,200 tokens
Fixture file:                  ~400 tokens
Example test (one complete):   ~600 tokens
Task description:              ~200 tokens
Reserved for response:        ~4,000 tokens

Total used:                   ~6,900 tokens
Available for additional
context if needed:           ~193,000 tokens
```

With this budget, a single generation call is extremely cheap on context.
The challenge is not fitting in context — it is choosing the RIGHT context.
Filling the window with every file in the repository does not improve quality;
it reduces it, because the model has to find the relevant signal in more noise.

For agentic loops (10–50 tool calls), track cumulative token usage. Reset the
context at natural breakpoints — after completing each page object, each test
file, each feature area.

---

## Q903.7 — What is RAG for codebases and how does it work for test generation?

RAG for codebases automatically retrieves the most relevant files before
calling the LLM. Tools like Cursor and GitHub Copilot do this automatically.
In a custom AI test generator, you implement it yourself.

The retrieval step:
```typescript
// Simplified RAG retrieval for test generation
async function retrieveContext(taskDescription: string): Promise<string> {
  // 1. Embed the task description
  const queryEmbedding = await embed(taskDescription);

  // 2. Search indexed codebase for similar files
  const relevantFiles = await vectorSearch(queryEmbedding, topK: 5);

  // 3. Return their content (or summaries if too large)
  const context = await Promise.all(
    relevantFiles.map(file => readAndSummarize(file.path, maxTokens: 500))
  );

  return context.join('\n\n---\n\n');
}
```

This makes the agent's context contain the most relevant page objects, specs,
and fixtures for the specific test being generated — without requiring the
engineer to manually select them.

---

## Q903.8 — How does context order affect LLM output quality?

LLMs process context sequentially and give more weight to:
1. The beginning of the context (primacy effect)
2. The end of the context, immediately before the task (recency effect)

The middle of a large context gets the least attention.

For test generation, optimal order:
```
1. System prompt / SKILL file (beginning — high weight)
2. Standards and anti-patterns (beginning — establishes rules early)
3. Background files (middle — page objects, fixtures)
4. Example test (near end — strong pattern anchor)
5. Task instruction (end — high weight, immediately before generation)
```

If your coding standards are buried in the middle of a long context with many
files above and below them, the model may not apply them consistently. Moving
standards to the beginning and the example to the end significantly improves
output consistency.

---

## Q903.9 — What is context compression and when do you need it?

Context compression reduces the token size of information without losing
the information needed for the task.

**Method 1 — Extract interfaces and signatures only:**
Instead of pasting a full 200-line page object, extract only the public API:
```typescript
// Compressed EmployeePage (30 tokens instead of 800):
class EmployeePage extends BasePage {
  async navigate(): Promise<void>
  async fillName(name: string): Promise<void>
  async fillEmployeeId(id: string): Promise<void>
  async selectJobTitle(title: string): Promise<void>
  async clickSave(): Promise<void>
  readonly successMessage: Locator
  getEmployeeRow(name: string): Locator
}
```

**Method 2 — Summarise test files:**
Instead of pasting 20 test files to show patterns, summarise what they test:
```
Existing tests:
- login.spec.ts: valid/invalid credentials, password reset
- employee.spec.ts: create, edit, delete, search employee
- leave.spec.ts: apply, approve, reject leave application
```

**Method 3 — Use SKILL files:**
A SKILL file IS compression — it encodes the essential patterns from many files
in a fraction of the tokens.

Use compression when the raw files would fill more than 20% of the context window
for a single generation call.

---

## Q903.10 — How do you handle context across a multi-turn agent conversation?

In a multi-turn conversation (where the agent writes, runs, reads results, and
fixes), the context grows with every exchange. Without management, it fills
the window.

**Strategy 1 — Rolling window:**
Keep only the last N exchanges. Drop the oldest when the window fills.
Risk: the agent forgets earlier decisions.

**Strategy 2 — Summarise completed work:**
After each complete sub-task (e.g., one test file written), compress the
conversation so far into a summary and replace it in context.
```
[Summary] Completed EmployeePage page object. Created tests for create,
edit, delete employee. All tests pass. Next: LeaveApplicationPage.
```

**Strategy 3 — Structured state instead of conversation history:**
Track agent progress in a structured document rather than relying on
conversation history.
```typescript
const agentState = {
  completed: ['EmployeePage', 'LeaveApplicationPage'],
  inProgress: 'OvertimePage',
  pending: ['AttendancePage', 'PerformancePage'],
  standards: SKILL_FILE_CONTENT,
  recentErrors: [],
};
```

Include the state document in every call instead of the full conversation history.
This gives the agent consistent, complete context regardless of how many turns
have passed.

---

## Q903.11 — What are context poisoning risks and how do you prevent them?

Context poisoning happens when incorrect or outdated information in the context
causes the model to generate wrong output — even when the prompt and instructions
are correct.

**Common sources of context poisoning:**

**Stale page objects:** If you include a page object from a feature branch that
has deprecated methods, the model generates code using those methods.
Fix: always include the main branch version of source files.

**Failed test output:** If a previous test failure message is still in the
context, the model may try to "fix" the previous failure instead of writing
the new test.
Fix: clear failed outputs from context before each new task.

**Conflicting examples:** If two example tests use different locator strategies
(one uses CSS, one uses getByRole), the model may apply either pattern inconsistently.
Fix: use only your best, most current test as the example. Remove examples
that do not follow current standards.

**Old documentation:** If you paste content from an older Playwright version's
documentation, the model generates code using deprecated APIs.
Fix: always retrieve documentation from official sources, not cached copies.

---

## Q903.12 — How do you measure context quality for test generation?

Track these metrics to improve your context engineering over time:

**First-run pass rate:** percentage of AI-generated tests that compile and
pass on the first run without editing. Target: >70%. Below 50% means context
is providing wrong patterns.

**Locator strategy compliance:** percentage of generated tests using getByRole
or getByLabel (not CSS). If the model uses CSS despite your standards, the
standards are not prominent enough in context.

**Hallucinated method rate:** count of invented Playwright methods per 100
generated tests. Target: 0. Any hallucinated methods mean the model lacks
grounding in real API patterns.

**Editing time per generated test:** how long a human spends editing AI output
to production quality. Improving context should reduce this over time.

---

## Q903.13 — What is the relationship between SKILL files and RAG?

SKILL files and RAG are complementary context engineering tools:

**RAG** retrieves large source files dynamically based on task relevance.
Good for: providing the actual current code of specific pages and fixtures.

**SKILL files** provide compact, hand-crafted summaries of patterns that
apply across all tasks. Good for: standards, conventions, architecture decisions.

Together in a test generation agent:
```
Context window layout:
  [SKILL file]              ← static, always present, 300 tokens
  [RAG: relevant page obj]  ← dynamic, task-specific, ~800 tokens
  [RAG: relevant fixture]   ← dynamic, task-specific, ~400 tokens
  [Task instruction]        ← user's request
```

The SKILL file ensures the model follows your conventions.
The RAG-retrieved files ensure it uses the correct API methods for the
specific page being tested.

---

## Q903.14 — In your framework, how do you manage context for the AI test generator?

In our OrangeHRM framework, we have a lightweight AI test generation utility
at `utils/ai-generator.ts` that assembles context before each generation call.

The context assembly process:
1. Load `docs/STANDARDS.md` (SKILL file equivalent) — always included
2. Detect which page the test is for from the task description
3. Load that page's page object from `pages/` directory
4. Load the relevant fixture from `fixtures/`
5. Load one complete existing test from the same feature area as the example
6. Call the Anthropic API with the assembled context and the task description

The entire context is assembled in under 200ms and uses under 3,500 tokens
for a typical single-page test generation call.

After six weeks of running this process, the first-run pass rate is 74% —
meaning 74% of generated tests compile and pass without any edits. The remaining
26% need minor adjustments — mostly test data setup and one or two assertion
tweaks. Before context engineering (when we just used RCIF prompts without
structured context retrieval), the first-run pass rate was 31%.

---

## Q903.15 — What is the difference between context window and memory for an AI agent?

**Context window** is the active space the model can see right now, in a single
API call. It is cleared after each call. Nothing persists.

**Memory** is a persistence layer outside the model that stores information
between calls and reloads it when needed.

Types of memory for test automation agents:

**Short-term memory (working context):**
The current generation task — current page, current test being written,
recent errors. Stored in the agent state object, included in every call.

**Long-term memory (knowledge base):**
SKILL files, STANDARDS.md, past test patterns, framework documentation.
Stored in files, loaded into context when relevant.

**Episodic memory (what has been done):**
The list of tests written, pages covered, tests fixed. Stored in a structured
progress file, summarised and included in context.

Designing an agent that uses all three memory types — and clearly separates
what is in the context window now from what is available to retrieve — is the
key architectural skill in AI agent design for test automation.

---

## Chapter Summary

- Context engineering is deciding what information goes into the LLM's context window. It is separate from and as important as prompt engineering.
- The right context produces framework-consistent code. Wrong or missing context produces generic, hallucinated, or outdated patterns.
- For test generation, the optimal context includes: SKILL file (always), relevant page object, relevant fixture, one complete example test, task description.
- SKILL files encode framework patterns in 200–400 tokens, replacing thousands of tokens of source files. They are the key context compression tool.
- Context order matters: put standards at the beginning, task instruction at the end. Middle content gets less weight.
- RAG retrieves relevant source files dynamically. SKILL files provide static framework standards. Use both together.
- Context poisoning: stale files, failed outputs, conflicting examples, and outdated docs in context cause wrong generation. Keep context current and clean.
- Multi-turn agents need explicit memory management: rolling windows, summaries, or structured state documents instead of full conversation history.
- Measure context quality: first-run pass rate, locator strategy compliance, hallucinated method rate, editing time per generated test.
