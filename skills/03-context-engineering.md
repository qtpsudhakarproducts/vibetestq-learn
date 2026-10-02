# Chapter 3 — Context Engineering
### Controlling What the AI Knows

---

> *"Most AI failures in real projects are not model failures.  
> They are context failures."*  
> — Philipp Schmid, Senior AI Engineer, Google DeepMind, 2025

---

## What You Will Learn

By the end of this chapter you will know:
- What context engineering is and why it matters more than prompt engineering
- What is inside a context window and what happens when it fills up
- Why the same prompt produces completely different output depending on what surrounds it
- Four strategies for controlling context deliberately
- How to maintain consistent output across a full session
- What context pollution is and how to fix each type

---

## 3.1 What Is Context Engineering

A prompt is the message you type. Context is everything the model sees when it generates a response.

That includes your message — but also everything else: the conversation history, files you pasted, system instructions, tool results, memory from past sessions. All of it is visible to the model when it answers.

**Prompt engineering** asks: how do I word this question?

**Context engineering** asks: what does the model need to know — and what should I keep out?

These are different skills. And in real testing work, context engineering produces more improvement than prompt engineering. A well-worded question in a bad context produces wrong output. A simply-worded question in rich context produces correct output.

> **Tobi Lütke, CEO of Shopify, 2025:**
> *"Context engineering is the art of filling the context window with exactly the right information at the right time."*

> **Andrej Karpathy, 2025:**
> *"The hottest new programming language is English. And the most important skill in that language is not writing prompts — it is curating context."*

Context engineering became a named discipline in 2025 when engineers building AI agents discovered that most failures had nothing to do with prompt wording. The model had the wrong information, missing information, or too much noise cluttering what it knew.

---

## 3.2 What Is Inside a Context Window

The context window is everything the model can see at once. Think of it as a whiteboard. Everything written on it is visible. Everything erased is gone.

Six types of content occupy it:

| Type | What It Is | Example in Testing |
|------|-----------|-------------------|
| **System prompt** | Persistent instructions set at session start | "You are a QA engineer. Follow these conventions." |
| **Conversation history** | All previous turns in this session | Your earlier questions, the model's earlier answers |
| **Pasted files** | Documents and code you paste manually | A user story, a page object, a spec file |
| **Tool results** | Output from tools the model used | A file it read, a Jira ticket it fetched |
| **Memory** | Summaries from past sessions (if enabled) | "This user builds OrangeHRM automation" |
| **Your current message** | What you just typed | The prompt you sent |

### The window fills up

Context windows are large but finite. In a long session, earlier content gets pushed out as new content comes in. When it fills up, the model forgets what it knew at the start of the session.

This is not a bug. It is a design constraint with a direct consequence: in a long session without context management, output quality degrades. The model reverts to generic defaults because the specific instructions you gave at Turn 1 are gone by Turn 40.

---

## 3.3 How the Same Prompt Produces Different Output

This is the single most important thing to understand about context engineering. The same prompt — word for word identical — produces completely different output depending on what surrounds it.

---

### Example 1 — Generating Test Cases

**Prompt (identical in both cases):**
```
Write test cases for the Leave Application feature.
```

**With no context:**
```
Test Case 1: Verify leave application form loads
Test Case 2: Submit leave application with valid data
Test Case 3: Submit leave application with missing data
```

Generic. No format. No application-specific detail. Three scenarios out of the dozen that should be covered.

**With context (paste the user story + team format conventions):**

```gherkin
Feature: Leave Application

  # Happy Path
  Scenario: Leave application is submitted successfully when all required fields are filled
    Given the employee is on the Apply Leave page
    When  the employee selects "Annual Leave" from the Leave Type dropdown
    And   selects a From Date of [future date]
    And   selects a To Date of [future date after From Date]
    And   clicks the Apply button
    Then  the success message "Successfully Saved" is displayed
    And   the leave request appears in the employee's leave history with status "Pending"

  # Negative
  Scenario: Error message appears when Leave Type is not selected
    Given the employee is on the Apply Leave page
    When  the employee leaves the Leave Type field unselected and clicks Apply
    Then  the validation message "Required" appears below the Leave Type field
    ...
```

Correct format. Application-specific. Complete coverage. The prompt did not change. The context did.

---

### Example 2 — Debugging a Test Failure

**Prompt (identical in both cases):**
```
This test is timing out. What is wrong?
```

**With no context:**
"I would need more information to help. Could you share the test code, the error message, and your Playwright configuration?"

One turn wasted. Nothing produced.

**With context (paste error + test code + page object):**

"The timeout is caused by a race condition. The `Save` button exists in the DOM when your locator starts polling, but it is disabled while the form validates. Playwright finds the element but cannot click it, and eventually times out. The fix is to wait for the button to become enabled before clicking:

```typescript
await expect(this.saveButton).toBeEnabled({ timeout: 10000 });
await this.webHelpers.clickElement(this.saveButton);
```"

Specific diagnosis. Specific fix. One turn.

---

### Example 3 — Session Degradation

This example shows what happens when context is not managed across a long session.

**Turn 5 — context is fresh:**
```
Write a test for the Add Employee feature.
```

Output:
```typescript
test('should add employee successfully @smoke', async ({ dashboardPage, pimPage, addEmployeePage }) => {
    await dashboardPage.navigateToEmployeeManagement();
    await pimPage.clickAddEmployee();
    await addEmployeePage.fillEmployeeDetails('John', 'Doe');
    await addEmployeePage.saveEmployee();
    await addEmployeePage.verifySuccessMessage();
});
```

Correct. Fixtures used. Tags present. Project conventions followed.

**Turn 42 — same session, early instructions erased:**
```
Write a test for the Performance Review feature.
```

Output:
```typescript
test('performance review test', async ({ page }) => {
    const performancePage = new PerformancePage(page);
    await performancePage.navigate();
    await page.getByRole('button', { name: 'Add' }).click();
});
```

No fixtures. Raw page object. No tags. Direct locator in test. Everything you said at Turn 1 is gone.

Same session. Same quality prompt. Completely degraded output because the conventions scrolled out of the context window.

---

### The Pattern

| Context Level | Output Quality | Reason |
|--------------|---------------|--------|
| No context | Generic, wrong format | Model uses training defaults |
| Conventions as text | Right style, inconsistent details | Missing concrete example |
| Conventions + example files | Correct on first try | Model has everything it needs |
| Stale context (long session) | Reverts to generic defaults | Instructions erased from window |

---

## 3.4 How Context Rescues a Poor Prompt

A poor prompt in rich context often beats a perfect prompt in no context.

**The one-word prompt test:**

Prompt: `Write a test`

With no context: a Jest test for a Calculator class. Wrong language, wrong framework, wrong project.

With rich context (project files loaded, system instructions set): a correct Playwright TypeScript spec for OrangeHRM with custom fixtures, correct tags, correct page object import.

The prompt is two words. The output is completely correct. The context did the work.

**The priority order:**

```
HIGH context + POOR prompt    → Good output
LOW context  + GREAT prompt   → Mediocre output
HIGH context + GREAT prompt   → Best output
LOW context  + POOR prompt    → Unusable output
```

Before spending time crafting the perfect prompt, ask: have I given the model enough context? That investment produces more improvement per minute than prompt refinement does.

---

## 3.5 Four Strategies to Manage Context

These four strategies control what goes into a context window. Use them deliberately every session.

### Strategy 1 — WRITE
Put the right information in proactively. Do not wait to be asked.

For a test case writing session:
- Paste the user story before asking for test cases
- State your team's format convention before asking for output
- Paste an existing example test case before asking for a new one

For an automation session:
- Paste BasePage.ts before asking for a page object
- Paste one existing page object before asking for another
- Paste one existing spec before asking for a new spec

The model cannot use what it does not have. Write it in first.

### Strategy 2 — SELECT
Choose carefully what to include. Relevance matters more than completeness.

Bad: paste your entire test suite for reference (500 lines, most of it irrelevant).

Good: paste the one existing spec that is most similar to what you are building (50 lines, entirely relevant).

The rule: if you are not sure whether to include something, leave it out. Include only what is directly relevant to today's specific task. More context is not always better. Irrelevant context is noise that buries the signal.

### Strategy 3 — COMPRESS
Summarise instead of paste. Long files consume context space fast.

A 500-line test suite as context costs thousands of tokens and floods the window. A summary costs dozens of tokens and gives the model the same understanding.

**Instead of pasting 500 lines:**
```
Our test suite has 47 tests across three modules: Login, Employee, Leave.
Tests use custom fixtures that inject page objects.
All tests are tagged @smoke (happy path) or @regression (all others).
Test files import from ../fixtures/basetest — never from @playwright/test directly.
```

That is 45 words. It gives the model the structural knowledge it needs without consuming space.

Compress everything that is background knowledge. Only paste full files when the model needs to see exact code.

### Strategy 4 — ISOLATE
Use separate sessions for separate task types.

**Bad:** in one session — debug a flaky test, write three page objects, generate test data, write a CI configuration.

The model mixes patterns from all four tasks. The page object starts looking like the CI configuration. The test data references the flaky test context.

**Good:** one session per task type.
- Session A: debugging the flaky test
- Session B: writing the page objects
- Session C: generating test data

Each session starts with clean, focused context. Output stays on topic throughout.

---

## 3.6 How to Maintain Context Across a Session

### At Session Start — Load Core Context Once

Use this template. Fill in the brackets. Paste it as your first message every session.

**For manual testing:**
```
SESSION CONTEXT — [Project Name]

Application: [name and one-sentence description]
My role: QA Engineer
Team testing format: [Gherkin / table / numbered steps]

Conventions:
- Scenario titles: [outcome] when [condition]
- Then steps: exact observable result, not vague language
- Coverage required: happy path, negative, boundary, edge case
- Placeholders: use [valid username] not real credentials

Today I am working on: [describe today's specific task]

Reference: [paste one example test case in your team's format]
```

**For automation:**
```
SESSION CONTEXT — [Project Name]

Framework: Playwright + TypeScript

Project structure:
- src/pages/    — page objects
- src/helpers/  — BasePage, WebHelpers, AssertHelpers
- src/tests/    — spec files
- src/fixtures/ — fixture definitions

Core conventions:
- Page objects extend BasePage
- Locators: getByRole, getByLabel, getByPlaceholder only
- No CSS selectors. No assertions in page objects.
- Custom fixtures inject page objects into tests
- Tags: @smoke (happy path), @regression (all others)

Today I am working on: [describe today's specific task]

Reference files:
[paste BasePage.ts]
[paste nearest existing page object]
[paste one existing spec]
```

### The 10-Turn Reminder

Every 10 turns in a long session, add this:

```
Reminder: [project name], [framework], [key conventions in one line].
```

Example:
```
Reminder: OrangeHRM project. Playwright TypeScript. BasePage inheritance.
getByRole locators. Custom fixtures. @smoke and @regression tags.
```

30 words. Keeps the model aligned without re-pasting everything.

### Correct Drift Immediately

When output violates a convention, fix it before moving forward:

```
Stop. You used a CSS selector.
Our project uses getByRole or getByLabel only.
Rewrite the locator. Keep everything else the same.
```

One uncorrected violation teaches the session the wrong pattern. Correct it immediately, every time.

### When to Start a New Session

| Signal | Action |
|--------|--------|
| Model uses wrong locator strategy after multiple corrections | New session |
| Switching to a completely different module or task type | New session |
| Session is 40+ turns old | New session |
| Corrections are not sticking | New session |
| Output quality has dropped steadily over the last 10 turns | New session |

A fresh session with a clean context block takes 2 minutes to set up and produces better output than fighting a polluted one for 30 minutes.

---

## 3.7 Context Pollution — Five Types and Fixes

Context pollution is when the context window contains information that hurts rather than helps.

### Type 1 — Stale Conventions
Your conventions were at Turn 1. They scrolled out by Turn 35. The model no longer follows them.

Fix: 10-turn reminder. Keep conventions in the window at all times.

### Type 2 — Mixed Task Patterns
You wrote a page object, then a CI workflow, then test data — all in one session. The model mixes patterns from all three.

Fix: ISOLATE. One session per task type.

### Type 3 — Instruction Drift
You corrected the model three times. The corrections filled the window. The model responds to the corrections more than to the original task.

Fix: New session with a single clean prompt incorporating everything you learned from the corrections.

### Type 4 — Irrelevant Files
You pasted five files for context. Only two were relevant. The model pulls patterns from the irrelevant ones.

Fix: SELECT. Remove files that are not directly relevant to today's task.

### Type 5 — Contradictory Instructions
"Use fixtures for page objects" at Turn 1. "Use page directly" at Turn 20 while debugging something different. The model picks one at random.

Fix: Explicit override. "Ignore the earlier instruction about using page directly. That was for debugging only. We use fixtures for all production test code."

---

## 3.8 Where AI Is Genuinely Weak in Testing

Context engineering makes AI tools significantly more useful. It does not make them good at everything.

**Visual inspection:** AI cannot look at a rendered UI and judge whether it looks right. It can generate test cases for visual elements but cannot perform visual regression testing without dedicated tooling.

**Accessibility feel:** AI can check for ARIA attributes and label text. It cannot judge whether a screen reader experience feels natural or whether a colour contrast technically passes but is unpleasant to read.

**Truly novel edge cases:** AI finds edge cases by reasoning about patterns. It misses edge cases that require deep business context that was never written down anywhere — the exception a domain expert knows from experience.

**Judgement calls:** "Is this behaviour a bug or a feature?" requires business context and stakeholder relationships. AI can flag the ambiguity but cannot resolve it.

Be honest with yourself about these limits. Use AI for what it is genuinely good at. Keep human judgement where it is irreplaceable.

---

## Chapter Summary

| Concept | Key Takeaway |
|---------|-------------|
| Context vs prompt | Context is everything the model sees. Prompts are one part of it. |
| Same prompt, different context | Output changes dramatically based on what surrounds the prompt. |
| Four strategies | Write (add proactively), Select (only relevant), Compress (summarise), Isolate (one task per session). |
| Session start ritual | 2 minutes of context loading prevents 30 minutes of corrections. |
| 10-turn reminder | 30 words every 10 turns keeps conventions in the window. |
| Five pollution types | Stale, mixed, drift, irrelevant, contradictory — all fixable. |

---

## Three Exercises to Try Today

1. Start a new session. Paste the session start template for your role. Ask for something you would normally ask without setup. Compare the output to what you usually get.

2. Find a session where output degraded over time. Identify which type of context pollution caused it.

3. Take a long prompt you use regularly and apply the COMPRESS strategy. Reduce it to a summary. Test whether output quality changes.

---

→ [Chapter 4 — SKILL.md](04-skill-md.md)

---

*← [Chapter 2](02-prompt-engineering.md) | [Chapter 4 →](04-skill-md.md)*
