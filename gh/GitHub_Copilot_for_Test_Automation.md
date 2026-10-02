# GitHub Copilot for Test Automation
### Practical Notes for Playwright TypeScript Engineers — February 2026

---

## 1. What Copilot Is and How It Works

GitHub Copilot is an AI coding assistant built by GitHub (owned by Microsoft) on top of models from OpenAI and Anthropic. It is the most widely used AI coding tool in the world — over 20 million developers as of February 2026.

### The Simple Mental Model

```
You write code in VS Code
     ↓
Copilot reads everything visible in the context window:
  - Your current file
  - Open tabs
  - Files you reference
  - Your project structure (in chat)
  - Your custom instructions file (if set up)
     ↓
Copilot predicts what you need next
     ↓
You accept, reject, or correct
```

Copilot does not run your code, does not know if tests pass, and does not remember previous sessions unless you paste that history back in. Everything it knows comes from what is currently in the context window.

### What Makes It Different from ChatGPT

| ChatGPT (browser) | GitHub Copilot (VS Code) |
|---|---|
| You copy-paste code in and out | Code is right there in your editor |
| No knowledge of your project | Reads your actual project files |
| Manual context management | `@workspace` searches your codebase |
| Separate window | Lives inside your development environment |
| Great for thinking through problems | Great for generating and editing code |

Both are useful. Copilot is the right tool when you are actively writing code. ChatGPT or Claude in the browser is the right tool when you are thinking through architecture, debugging a complex problem, or need a longer back-and-forth conversation.

### What Copilot Actually Does Well

```
✅ Completing methods you have started writing
✅ Generating page objects when you paste the structure and element details
✅ Writing tests when you paste the page object to follow
✅ Explaining what unfamiliar code does
✅ Fixing bugs when you paste the error and the code together
✅ Refactoring code when you select it and tell it the rule
✅ Writing repetitive boilerplate (constructors, getters, type definitions)
✅ Translating descriptions into locators ("username field with placeholder Username")
```

### What Copilot Does NOT Do Well

```
❌ Knowing the actual OrangeHRM application without being told
❌ Using your exact project conventions without being told
❌ Remembering what you discussed yesterday
❌ Running your tests to verify output
❌ Deciding what to test — that is your job
❌ Catching logic errors in tests (tests that pass but verify the wrong thing)
```

---

## 2. Plans, Setup and First Run

### Plans (February 2026)

| Plan | Monthly Cost | Completions | Premium Requests | Best For |
|---|---|---|---|---|
| **Free** | $0 | 2,000/month | 50/month | Getting started, occasional use |
| **Pro** | $10 | Unlimited | 300/month | Individual daily use |
| **Pro+** | $39 | Unlimited | 1,500/month | Power users, complex agent tasks |
| **Business** | $19/user | Unlimited | 1,000/user/month | Teams, IP indemnity |
| **Enterprise** | $39/user | Unlimited | 1,000/user/month | Custom org models |

> **Students:** GitHub Education gives you **Pro for free**. Sign up at education.github.com. Verified open source maintainers also get Pro free.

> **Premium requests** are the credits you spend on smarter models (Claude Opus, GPT-5.2) and Agent Mode. Basic completions and GPT-4.1-level chat do not cost premium requests.

### Installation

```
Step 1: Open VS Code
Step 2: Extensions panel — Ctrl+Shift+X
Step 3: Search "GitHub Copilot" → Install
Step 4: Search "GitHub Copilot Chat" → Install
Step 5: Sign in with your GitHub account when prompted
Step 6: Go to github.com/settings/copilot to verify your plan
```

### Verify It Is Working

Open any `.ts` file in your project and start typing a function. You should see grey ghost text appear after a second. If you do not see it:

```
Check 1: Bottom status bar — look for the Copilot icon (it should not have a slash through it)
Check 2: Ctrl+Shift+P → "GitHub Copilot: Enable"
Check 3: Make sure you are signed in: Ctrl+Shift+P → "GitHub Copilot: Sign In"
```

### First Run Exercise

Before using Copilot for real work, try this to understand how it behaves:

```typescript
// Open a new file: practice.ts
// Type this comment and see what Copilot suggests:

// A Playwright page object for a login page with username and password fields
class LoginPage {
  // Copilot will start suggesting — press Tab to accept each line
  // Notice it invents locators — it does not know your actual application
  // This is why context matters: without it, it guesses
}
```

The key insight from this exercise: Copilot suggested something plausible but wrong for your project. It does not know OrangeHRM, does not know your BasePage, and does not know your locator conventions — **unless you tell it**.

---

## 3. The Four Modes of Copilot

```
┌─────────────────────────────────────────────────────────────────────┐
│  MODE              HOW TO OPEN          BEST FOR                    │
│  ──────────────    ────────────         ────────                    │
│                                                                     │
│  1. Inline         Just start typing    Completing methods,         │
│     Suggestions                         boilerplate, repetitive    │
│                                         patterns                    │
│                                                                     │
│  2. Chat Panel     Ctrl+Shift+I         Generating full files,      │
│                                         asking questions,           │
│                                         debugging with context      │
│                                                                     │
│  3. Inline Chat    Select code          Fixing, refactoring, or     │
│                    then Ctrl+I          explaining specific code     │
│                                                                     │
│  4. Agent Mode     Chat panel →         Multi-file tasks: build     │
│                    mode dropdown        a POM AND its tests AND      │
│                    → "Agent"            update fixtures together     │
└─────────────────────────────────────────────────────────────────────┘
```

Each mode has a different cost and a different use case. Choosing the wrong mode wastes premium requests or produces weaker output than the task needs.

---

## 4. Mode 1 — Inline Suggestions

### How It Works

As you type, Copilot predicts what comes next and shows it in grey text. This is the lowest-cost mode — most suggestions do not use premium requests at all.

```typescript
// You type this:
async clickSave

// Copilot shows in grey:
async clickSave(): Promise<void> {
  await this.saveButton.click();
}

// Press Tab → accepted
// Press Escape → dismissed
// Press Alt+] → see the next alternative suggestion
```

### The Comment-First Technique

Write a comment describing what you want. Copilot reads it and writes the implementation. This is more reliable than waiting for it to guess from an incomplete method signature.

```typescript
// Fill the first name field
async fillFirstName(firstName: string): Promise<void> {
  await this.firstNameInput.fill(firstName);
  // ↑ Copilot generated this from the comment above
}

// Navigate to the Add Employee page and wait for the form to load
async goto(): Promise<void> {
  await this.page.goto('/web/index.php/pim/addEmployee');
  await this.firstNameInput.waitFor();
  // ↑ Copilot generated both lines from the comment
}
```

### When Inline Suggestions Are Most Useful

```
✅ Writing constructors — Copilot knows the pattern after seeing one class
✅ Defining locators — after BasePage is in scope, it follows the pattern
✅ Repetitive methods — fill(), click(), getText() on similar elements
✅ TypeScript type annotations — it sees the value, suggests the type
✅ Import statements — it sees the class you used, suggests the import
```

### When to Reject Inline Suggestions

```
❌ It uses a CSS selector — your convention is getByRole
❌ It adds an assertion inside a page object method
❌ It uses page.waitForTimeout() — that is fragile
❌ It hardcodes the base URL — config should handle that
❌ It uses .then() chaining — you use async/await
```

Reject bad suggestions with `Escape`. If the same bad pattern keeps appearing, add it to your custom instructions file (covered in Section 10).

### Accepting Suggestions Incrementally

You do not have to accept the entire suggestion at once:

```
Tab           → Accepts the entire suggestion
Ctrl+Right    → Accepts word by word
               (hold down to walk through each word)
```

Walking through word by word lets you accept the structure but correct specific values — useful when Copilot got the method right but invented a wrong element name.

---

## 5. Mode 2 — Copilot Chat Panel

### Opening the Chat Panel

```
Ctrl+Shift+I  (Windows / Linux)
Cmd+Shift+I   (macOS)
```

Or click the Copilot icon in the left sidebar.

### The Chat Interface

The Chat panel is a full conversation window inside VS Code. You can:
- Type questions and instructions
- Paste code snippets
- Attach files using `#file:` references
- Search your whole project using `@workspace`
- Attach screenshots by dragging them in (multimodal)

### Slash Commands

These are shortcuts that trigger specific behaviours:

| Command | What It Does | Example Use |
|---|---|---|
| `/explain` | Explains selected code in plain English | Select a confusing method → `/explain` |
| `/fix` | Finds and fixes a bug in selected code | Select failing test → `/fix` |
| `/tests` | Generates tests for selected code | Select LoginPage → `/tests` |
| `/doc` | Adds JSDoc comments to selected code | Select a public method → `/doc` |

### Context References

These tell Copilot exactly what to read:

```
@workspace
  Copilot indexes your entire project and answers based on it
  Example: "@workspace — do all my page objects extend BasePage?"

#file:path/to/file.ts
  Includes the full content of a specific file
  Example: "Looking at #file:pages/LoginPage.ts, write the same
            pattern for EmployeeListPage"

#selection
  Uses whatever you have currently selected in the editor
  Example: Select 3 locators → "#selection — are these the best
            locators for these elements?"
```

### Practical Chat Examples for OrangeHRM

```
"@workspace — which test files are missing @smoke tags?"

"Looking at #file:pages/LoginPage.ts and
 #file:tests/login.spec.ts, generate EmployeeListPage.ts
 and employee-list.spec.ts following the same patterns"

"@workspace — are there any tests that call page.waitForTimeout?
 List them with file names and line numbers"

"Looking at #file:helpers/BasePage.ts, what methods are available
 to all page objects that extend it?"
```

### Starting a Chat Session Properly

Do not just open the chat and type a question. Load your context first:

```
Good session start:

"I am working on the OrangeHRM Playwright TypeScript automation framework.

Conventions:
  - All page objects extend BasePage from helpers/BasePage.ts
  - Use getByRole, getByLabel, getByPlaceholder — no CSS selectors
  - No assertions inside page object methods
  - Fixtures inject page objects in tests

[paste BasePage.ts]
[paste LoginPage.ts as style reference]

Today I need to create: EmployeeListPage.ts"
```

This takes two minutes and dramatically improves output quality for the rest of the session.

---

## 6. Mode 3 — Inline Chat

### How to Open It

1. Select the code you want to change in the editor
2. Press `Ctrl+I` (Windows/Linux) or `Cmd+I` (macOS)
3. A small input box appears directly in the editor
4. Type your instruction and press Enter

### What Makes Inline Chat Different from the Chat Panel

The Chat Panel gives you a response in a sidebar. Inline Chat applies the change directly to your code as a highlighted diff — you see exactly what is being changed and can accept or reject line by line.

```
Before (you select this method):
  async login(username: string, password: string) {
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
    await this.page.click('button[type="submit"]');
  }

You press Ctrl+I and type:
  "Refactor to use getByRole and getByPlaceholder instead of CSS selectors"

After (diff shown in editor):
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

Accept button → change saved
Reject button → original restored
```

### Best Uses for Inline Chat

```
✅ Refactoring a specific method (CSS → getByRole)
✅ Adding return types to a function
✅ Adding JSDoc to a specific method
✅ Converting .then() chains to async/await
✅ Adding error handling to a specific block
✅ Renaming variables to follow your naming convention
✅ Extracting a repeated block into a method
```

### What NOT to Use Inline Chat For

```
❌ Generating an entire new file — use Chat Panel instead
❌ Tasks that need context from other files — Copilot only sees what is selected
❌ Debugging — the Chat Panel with full context is better for this
```

### Reviewing Inline Chat Changes

Always read the diff before accepting. Copilot will sometimes:
- Change more than you asked
- Rename variables in a way that breaks other files
- Add imports that already exist

Accept the change, run your tests: `npx playwright test`. If something breaks, use `Ctrl+Z` to undo or use Git to revert.

---

## 7. Mode 4 — Agent Mode

### What Agent Mode Is

Agent Mode is Copilot working autonomously across multiple steps and multiple files. You give it a goal, it reads what it needs, makes a plan, writes code, and asks for your approval before saving changes.

```
You give a goal:
  "Create AddEmployeePage.ts following the LoginPage pattern,
   then create add-employee.spec.ts with smoke and regression tests"

Agent Mode:
  Step 1: Reads helpers/BasePage.ts        ← understands the structure
  Step 2: Reads pages/LoginPage.ts         ← understands the style
  Step 3: Reads tests/login.spec.ts        ← understands the test pattern
  Step 4: Writes pages/AddEmployeePage.ts  ← shows you the file
  Step 5: Writes tests/add-employee.spec.ts ← shows you the file
  Step 6: Shows all changes as diffs       ← you approve each file
```

### How to Enable Agent Mode

```
1. Open Copilot Chat panel (Ctrl+Shift+I)
2. Find the mode dropdown at the top of the chat (shows "Ask" by default)
3. Click it and select "Agent"
4. You are now in Agent Mode
```

### Writing a Good Agent Mode Prompt

The most important difference from normal chat: **name the reference files explicitly**. If you do not, the agent reads everything and mixes patterns from across the codebase.

```
Good Agent Mode prompt:

"Create EmployeeListPage.ts and employee-list.spec.ts.

Reference files to read:
  - helpers/BasePage.ts (base class to extend)
  - pages/LoginPage.ts (style reference for the POM)
  - tests/login.spec.ts (style reference for the tests)

Do not read any other files.

Page details:
  URL: /web/index.php/pim/viewEmployeeList
  Elements:
    - Search input: getByPlaceholder('Type for hints...')
    - Search button: getByRole('button', { name: 'Search' })
    - Results table rows: getByRole('row') (excludes header)
    - No Records Found message: getByText('No Records Found')

Methods needed in POM:
  - searchByName(name: string)
  - getResultCount(): Promise<number>
  - getEmployeeNames(): Promise<string[]>

Tests to generate:
  - Valid search returns matching results @smoke
  - Search with no match shows 'No Records Found' @regression
  - Empty search returns all employees @regression

Rules:
  - No CSS selectors
  - No assertions in page object
  - Fixtures inject the page object
  - Each test must be fully independent"
```

### Reviewing Agent Mode Output

**Never approve without reading.** Agent Mode is powerful but it makes mistakes:

```
Review checklist for every Agent-generated file:

POM file:
  □ Extends BasePage
  □ No CSS selectors anywhere
  □ No expect() calls
  □ Locators match the actual OrangeHRM elements
  □ Methods have TypeScript return types
  □ Constructor calls super(page)

Test file:
  □ Uses fixtures — not new EmployeeListPage(page)
  □ Tests are independent (no test depends on another)
  □ Tags are correct (@smoke, @regression)
  □ test.describe wraps the group
  □ Assertions are meaningful — not just .toBeVisible()
```

After approving, always run the tests:

```bash
npx playwright test tests/employee-list.spec.ts --headed
```

If tests fail, do not immediately ask Agent Mode to fix them. Read the error first and understand it. Then either fix manually or paste the error back to Copilot Chat with full context.

### Agent Mode Limits

```
⚠ Agent Mode uses premium requests — more than regular chat
⚠ Context builds up across steps — long sessions drift
⚠ Break large tasks into two agent sessions: POM first, then tests
⚠ Always review every file before accepting
⚠ Run tests after every agent session before starting the next
```

---

## 8. Copilot in the Terminal

Press `Ctrl+I` inside the VS Code integrated terminal to get command suggestions.

### Playwright Commands

```
"Run only the smoke tests"
→ npx playwright test --grep @smoke

"Run only the smoke tests on Chrome"
→ npx playwright test --grep @smoke --project=chromium

"Run the tests in headed mode so I can see the browser"
→ npx playwright test --headed

"Run only the failing tests from the last run"
→ npx playwright test --last-failed

"Run the login tests only"
→ npx playwright test tests/login.spec.ts

"Run a specific test by name"
→ npx playwright test -g "valid login submits successfully"

"Show the HTML report"
→ npx playwright show-report

"Install all Playwright browsers"
→ npx playwright install

"Install browsers with system dependencies"
→ npx playwright install --with-deps

"Generate a new test file with the code generator"
→ npx playwright codegen https://opensource-demo.orangehrmlive.com
```

### Git Commands

```
"Stage all changed files"
→ git add .

"Commit with a message"
→ git commit -m "add EmployeeListPage POM and smoke tests"

"Push to the current branch"
→ git push

"Create a new branch"
→ git checkout -b feature/employee-list-tests

"See what files have changed"
→ git status

"See the changes in a file"
→ git diff pages/EmployeeListPage.ts
```

### npm Commands

```
"Install all dependencies"
→ npm install

"Add a new dev dependency"
→ npm install -D @types/node

"Check for outdated packages"
→ npm outdated

"Run the TypeScript compiler in check mode"
→ npx tsc --noEmit
```

---

## 9. Model Selection — Choosing the Right Model for the Task

In the Copilot Chat panel, you can choose which AI model handles your request. Different models have different strengths, speeds, and costs.

### The Models Available in Copilot (February 2026)

| Model | Multiplier | Speed | Best For |
|---|---|---|---|
| **Auto** | 0.9x (10% discount) | Varies | Copilot picks the best model automatically |
| **GPT-4o** | Included | Fast | Everyday coding, quick questions |
| **GPT-5 mini** | 0.25x | Very fast | Simple questions, quick autocomplete help |
| **GPT-4.1** | 1x | Fast | Standard POM generation, test writing |
| **Claude Sonnet 4.6** | 1x | Fast | Following conventions precisely, longer files |
| **Claude Opus 4.6** | 2x | Slower | Hard debugging, architecture, complex reasoning |
| **GPT-5.2** | 10x | Slowest | The hardest problems — use sparingly |
| **o1** (reasoning) | 10x | Slow | Systematic reasoning through complex failures |

### Decision Guide — Which Model to Use

```
Task: Writing a comment in a method
→ Inline suggestion, no model choice needed

Task: Generating a standard POM (e.g. EmployeeListPage)
→ GPT-4.1 or Claude Sonnet 4.6 (1x) — either works well

Task: Generating tests with complex fixture setup
→ Claude Sonnet 4.6 (1x) — better at following long convention lists

Task: Debugging a test that fails intermittently
→ Claude Opus 4.6 (2x) or o1 — needs systematic reasoning

Task: Quick question ("what does getByRole do?")
→ GPT-5 mini (0.25x) — fast and cheap for simple questions

Task: Architecture decision ("how should I structure fixtures?")
→ Claude Opus 4.6 (2x) — better reasoning on trade-offs

Task: Something broken that nothing else fixed
→ GPT-5.2 (10x) — save this for genuinely hard problems
```

### Using Auto Mode

Auto mode is the default and is recommended for most work. Copilot selects the best model for each message automatically, and you get a 10% discount on premium request consumption.

The only reason to switch away from Auto is when:
- You need a specific capability (o1 for step-by-step reasoning)
- You are on a limited plan and want to control costs
- A specific model is producing better results for a particular type of task

---

## 10. Custom Instructions — Setting Project Conventions Once

Custom Instructions is the most underused feature in Copilot for team projects. It lets you set your project conventions in a file that Copilot reads automatically in every session — so you never have to paste conventions into a chat again.

### Setting Up Custom Instructions

Create this file in your repository:

```
.github/copilot-instructions.md
```

This file is committed to Git, so every team member who opens the project gets the same Copilot behaviour automatically.

### Template for OrangeHRM Automation Project

```markdown
# GitHub Copilot Instructions — OrangeHRM Automation

## Project Overview
Playwright TypeScript end-to-end test automation framework for
OrangeHRM Human Resource Management software.
App URL: https://opensource-demo.orangehrmlive.com

## Page Object Model Conventions
- All page objects MUST extend BasePage from helpers/BasePage.ts
- Locators are private class properties defined at the top of the class
- Public methods perform actions only — they do NOT assert anything
- Constructor must call super(page) and accept Page as parameter
- All public methods must have explicit TypeScript return types

## Locator Rules (STRICTLY ENFORCED)
- ONLY use: getByRole, getByLabel, getByPlaceholder, getByText
- NEVER use: CSS selectors (.class, #id, [attribute])
- NEVER use: XPath
- NEVER use: page.$ or page.$$

## Test File Conventions
- Import test and expect from the fixtures file, not from @playwright/test directly
- Use fixtures to inject page objects — NEVER use new PageObject(page)
- Each test must be fully independent — no test depends on another
- Use test.describe() to group related tests
- Tags: @smoke for the primary happy path, @regression for edge cases, @e2e for full flows
- NEVER hardcode base URL — use the baseURL from playwright.config.ts

## What to Avoid
- page.waitForTimeout() — use explicit element waits instead
- expect() inside page object methods
- Hardcoded credentials — use environment variables or test data files
- .then() chains — use async/await throughout
- CSS selectors in any form

## File Naming
- Page objects: PascalCase + Page suffix (e.g. EmployeeListPage.ts)
- Test files: kebab-case + .spec.ts (e.g. employee-list.spec.ts)
- Fixtures: camelCase describing the injected object

## TypeScript
- Always include return types on public methods
- Use interfaces for test data objects
- Prefer const over let where the value does not change
```

### What Changes After Setting This Up

**Before custom instructions:**
```
You: "Write EmployeeListPage"
Copilot: [generates with CSS selectors, no BasePage, wrong structure]
You: "Use getByRole not CSS, extend BasePage, no assertions..."
Copilot: [regenerates]
You: [corrects 3 more things]
```

**After custom instructions:**
```
You: "Write EmployeeListPage for the employee list page at
     /web/index.php/pim/viewEmployeeList with a search input,
     search button, and results table"
Copilot: [generates with correct structure, getByRole, BasePage, no assertions]
```

The instructions file turns a 5-turn conversation into a 1-turn result.

### Keeping Instructions Current

Update the file whenever your conventions change. Do not let it go stale — outdated instructions are worse than no instructions because they actively mislead Copilot.

```bash
# Commit instructions updates with a clear message
git commit -m "update copilot instructions: add fixture naming convention"
```

---

## 11. Using Copilot for Page Object Generation

This is the highest-value use of Copilot for test automation. A well-prompted request generates a complete, correct POM in one turn.

### The POM Generation Workflow

```
Step 1: Open OrangeHRM in your browser
Step 2: Navigate to the page you need to automate
Step 3: Open DevTools (F12) → Elements tab
Step 4: Inspect each element you need:
          - Find the best role or label
          - Note the placeholder text
          - Find any unique text
Step 5: Open Copilot Chat
Step 6: Load your context (BasePage + LoginPage if not set in instructions)
Step 7: Send the POM generation prompt
Step 8: Review the output against the checklist
Step 9: Verify locators work against the live app
```

### The POM Generation Prompt Template

```
You are a senior QA automation engineer using Playwright TypeScript.

[Only include below if you do NOT have a custom instructions file]
Conventions:
  - Extend BasePage from helpers/BasePage.ts
  - getByRole, getByLabel, getByPlaceholder only — no CSS
  - No assertions in page object methods
  - All locators are private class properties
[End of conventions block]

Reference: #file:pages/LoginPage.ts

Generate [PageName]Page.ts for the [description] page.
URL: [relative URL path]

Elements on the page:
  [descriptive name]: [locator strategy]('[value]')
  [descriptive name]: [locator strategy]('[value]')
  [descriptive name]: [locator strategy]('{name/text}')

Methods needed:
  [method description] → [method name]
  [method description] → [method name]
```

### Complete Example — EmployeeListPage

```
Reference: #file:pages/LoginPage.ts

Generate EmployeeListPage.ts for the employee list search page.
URL: /web/index.php/pim/viewEmployeeList

Elements:
  Employee name search input: getByPlaceholder('Type for hints...')
  Search button: getByRole('button', { name: 'Search' })
  Reset button: getByRole('button', { name: 'Reset' })
  Results table body rows: getByRole('row') excluding the header
  No Records Found message: getByText('No Records Found')
  Edit button in a row: getByRole('button', { name: 'Edit' }) (first match)

Methods needed:
  Search by employee name → searchByName(name: string)
  Click the Reset button → clickReset()
  Get number of result rows → getResultCount(): Promise<number>
  Get all employee name cells → getEmployeeNames(): Promise<string[]>
  Check if no records message is visible → isNoRecordsVisible(): Promise<boolean>
```

### Expected Output Structure

```typescript
import { Page } from '@playwright/test';
import BasePage from '../helpers/BasePage';

export default class EmployeeListPage extends BasePage {
  private nameSearchInput   = this.page.getByPlaceholder('Type for hints...');
  private searchButton      = this.page.getByRole('button', { name: 'Search' });
  private resetButton       = this.page.getByRole('button', { name: 'Reset' });
  private resultRows        = this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
  private noRecordsMessage  = this.page.getByText('No Records Found');

  constructor(page: Page) {
    super(page);
  }

  async searchByName(name: string): Promise<void> {
    await this.nameSearchInput.fill(name);
    await this.searchButton.click();
  }

  async clickReset(): Promise<void> {
    await this.resetButton.click();
  }

  async getResultCount(): Promise<number> {
    return await this.resultRows.count();
  }

  async getEmployeeNames(): Promise<string[]> {
    const rows = await this.resultRows.all();
    const names: string[] = [];
    for (const row of rows) {
      const nameCell = row.getByRole('cell').nth(1);
      names.push(await nameCell.innerText());
    }
    return names;
  }

  async isNoRecordsVisible(): Promise<boolean> {
    return await this.noRecordsMessage.isVisible();
  }
}
```

### Common POM Review Failures (Things to Check)

```
1. CSS selectors crept in:
   ❌ this.page.locator('.oxd-table-row')
   ✅ this.page.getByRole('row')

2. Assertion inside a method:
   ❌ async searchByName(name: string) {
        await this.nameInput.fill(name);
        await expect(this.resultRows).toHaveCount(1); // WRONG
      }
   ✅ async searchByName(name: string): Promise<void> {
        await this.nameInput.fill(name);
        await this.searchButton.click();
      }

3. Not extending BasePage:
   ❌ export default class EmployeeListPage {
        constructor(private page: Page) {}
      }
   ✅ export default class EmployeeListPage extends BasePage {
        constructor(page: Page) { super(page); }
      }

4. Missing return types:
   ❌ async getResultCount() {
   ✅ async getResultCount(): Promise<number> {
```

---

## 12. Using Copilot for Test Generation

### The Test Generation Workflow

Always generate the POM before generating tests. Tests must call page object methods — you cannot write tests for a POM that does not exist yet.

```
Step 1: POM is complete and reviewed ← prerequisite
Step 2: Open Copilot Chat
Step 3: Paste or reference the POM
Step 4: Reference an existing spec file for style
Step 5: Describe the scenarios to cover
Step 6: Review output against the checklist
Step 7: Run the tests
Step 8: Fix any failures
```

### The Test Generation Prompt Template

```
You are a senior QA automation engineer using Playwright TypeScript.

Page object: #file:pages/[PageName]Page.ts
Style reference: #file:tests/login.spec.ts

Generate [page-name].spec.ts covering:

Happy path (@smoke):
  [describe what successful completion looks like]

Validation tests (@regression):
  [describe each validation rule that should be tested]
    - [field/scenario] — [what error or behaviour to expect]
    - [field/scenario] — [what error or behaviour to expect]

Edge cases (@regression):
  [describe boundary conditions or special scenarios]

Rules:
  - Import from the fixtures file, not directly from @playwright/test
  - Use the [fixtureName] fixture — not new [PageName]Page(page)
  - Each test must be fully independent
  - test.describe('[Page] Tests') wraps all tests
  - Use only page object methods — no direct locator calls in tests
```

### Complete Example — Employee Search Tests

```
Page object: #file:pages/EmployeeListPage.ts
Style reference: #file:tests/login.spec.ts

Generate employee-list.spec.ts covering:

Happy path (@smoke):
  Search for an existing employee by first name → results should update
  to show only matching employees

Validation tests (@regression):
  - Search with a name that does not exist → 'No Records Found' text visible
  - Click Reset after a search → full employee list restored

Edge cases (@regression):
  - Search with partial name → should return all matching employees
  - Search with extra whitespace in the name → should still return results

Rules:
  - Import from fixtures/baseFixture.ts
  - Use the employeeListPage fixture
  - Each test must be independent — do not rely on search state from another test
  - test.describe('Employee List Search Tests') wraps all
  - No direct locator calls — all interaction through EmployeeListPage methods
```

### What Good Generated Tests Look Like

```typescript
import { test, expect } from '../fixtures/baseFixture';

test.describe('Employee List Search Tests', () => {

  test('search by first name returns matching employees @smoke',
    async ({ employeeListPage }) => {
      await employeeListPage.searchByName('John');
      const count = await employeeListPage.getResultCount();
      expect(count).toBeGreaterThan(0);
      const names = await employeeListPage.getEmployeeNames();
      expect(names.every(name => name.toLowerCase().includes('john'))).toBeTruthy();
  });

  test('search with no match shows No Records Found @regression',
    async ({ employeeListPage }) => {
      await employeeListPage.searchByName('XYZNOTEXIST999');
      expect(await employeeListPage.isNoRecordsVisible()).toBeTruthy();
  });

  test('reset after search restores full employee list @regression',
    async ({ employeeListPage }) => {
      await employeeListPage.searchByName('John');
      await employeeListPage.clickReset();
      const count = await employeeListPage.getResultCount();
      expect(count).toBeGreaterThan(1);
  });

});
```

### Common Test Review Failures

```
1. Test depends on another test:
   ❌ test('search by name', async ({ employeeListPage }) => {
        // This test runs AFTER the "reset" test and relies on its state
      })
   ✅ Each test starts from a clean state via beforeEach or by navigating

2. Direct locator in the test:
   ❌ await page.getByPlaceholder('Type for hints...').fill('John');
   ✅ await employeeListPage.searchByName('John');

3. Instantiating page object directly:
   ❌ const listPage = new EmployeeListPage(page);
   ✅ async ({ employeeListPage }) => { ... }  ← fixtures inject it

4. Weak assertion:
   ❌ expect(await employeeListPage.getResultCount()).toBeTruthy();
      // Passes even if count is 1 or 100 — does not verify the search worked
   ✅ const names = await employeeListPage.getEmployeeNames();
      expect(names.every(name => name.toLowerCase().includes('john'))).toBeTruthy();
```

---

## 13. Using Copilot for Debugging Failing Tests

Debugging is where Copilot pays back the most time. The key is giving it everything it needs — not a paraphrase, the actual error.

### The Debugging Rule

**Never paraphrase the error.** Copy the exact terminal output and paste it. The specific error message, file path, and line number are all signal. "It doesn't work" is noise.

### The Debugging Prompt Template

```
This Playwright test is failing. Reason through the possible causes
step by step, rank them by probability, then recommend the fix.

Error (exact copy from terminal):
[paste the complete error including the stack trace]

Failing test:
[paste the test]

Page object used:
[paste the relevant page object]

Additional context (if relevant):
[any recent changes, environmental differences, or observations]
```

### Complete Debugging Example

```
This Playwright test is failing. Reason through causes step by step,
rank by probability, then recommend the fix.

Error:
  Error: locator.click: Error: strict mode violation:
  getByRole('button', { name: 'Save' }) resolved to 2 elements:
    1) <button type="submit" class="oxd-button">…</button>
    2) <button type="button" class="oxd-button">…</button>
  at AddEmployeePage.clickSave (/pages/AddEmployeePage.ts:28:5)

Failing test:
  test('add employee with valid data @smoke', async ({ addEmployeePage }) => {
    await addEmployeePage.goto();
    await addEmployeePage.fillFirstName('Priya');
    await addEmployeePage.fillLastName('Sharma');
    await addEmployeePage.fillEmployeeId('EMP0042');
    await addEmployeePage.clickSave();
  });

Page object:
  async clickSave(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save' }).click();
  }
```

Copilot will reason through the cause (strict mode violation — the locator is not unique enough) and recommend the fix (`{ name: 'Save', exact: true }` or filtering by visible state).

### Reading the Playwright HTML Report with Copilot

After a test run, open the HTML report:
```bash
npx playwright show-report
```

Take a screenshot of the failure detail — the red section showing the exact step that failed. Drag that screenshot into the Copilot Chat panel and type:

```
"Looking at this Playwright HTML report failure, what is the most
likely cause and what should I check first?"
```

Copilot can read the screenshot and identify the failing step, the error type, and suggest a diagnosis — all from the visual output.

### Flaky Test Debugging

For intermittently failing tests, add "this fails about 30% of the time" to your prompt and ask for chain-of-thought reasoning:

```
"This test passes about 70% of the time and fails 30% of the time.
 Reason through all possible causes of intermittent failures step
 by step before recommending a fix.

 Error (from a failing run):
 [paste error]

 Test code:
 [paste test]

 Page object:
 [paste POM]"
```

Copilot will systematically work through: timing issues, state pollution from other tests, network variability, selector ambiguity, race conditions — rather than jumping to the first guess.

---

## 14. Using Copilot for Code Review

Copilot can review your code against your quality standards. This is especially useful for catching problems in AI-generated code before it reaches Git.

### The Code Review Prompt

```
Review this test file and flag quality issues. For each issue:
  - Line number
  - What the problem is
  - Why it is a problem
  - The suggested fix

File to review:
[paste the file]

Check specifically for:
  □ Tests that depend on execution order (not independent)
  □ CSS selectors or XPath in tests or POMs
  □ Assertions inside page object methods
  □ Direct locator calls in test files (bypassing the POM)
  □ page.waitForTimeout() usage
  □ Hardcoded base URLs
  □ Hardcoded credentials
  □ Tests that verify too many things at once
  □ Missing or weak assertions (toBeVisible when toHaveText is appropriate)
  □ Missing cleanup in afterEach or afterAll
  □ Fixtures not used (direct instantiation instead)
```

### Using @workspace for Project-Wide Review

```
@workspace — check all spec files for tests that use CSS selectors
             directly in the test (not in a page object)

@workspace — find any page objects that do not extend BasePage

@workspace — list all tests that are missing @smoke or @regression tags

@workspace — are there any tests that use page.waitForTimeout()?
             List the file and line number for each
```

### The Review Flow

```
1. Run tests: npx playwright test
   Ensure they all pass before reviewing — reviewing failing tests wastes time

2. Select the file in VS Code

3. Use @workspace or paste the file in Chat

4. Send the review prompt

5. Work through each flagged issue:
   - Minor issues (naming, missing types): fix inline with Ctrl+I
   - Structural issues (test dependencies, POM violations): fix in Chat

6. Run tests again: npx playwright test
   Confirm all still pass after fixes

7. Commit the reviewed code
```

---

## 15. Using Copilot for Test Data Generation

### Why AI Test Data Is Useful

Manually typing test data is slow and error-prone. Copilot can generate realistic, varied, and boundary-valid test data sets in the format your TypeScript project needs.

### Test Data Prompt Template

```
Generate test data for the OrangeHRM [form name] form.

Fields required:
  [field name]: [type, constraints, format]
  [field name]: [type, constraints, format]

Generate:
  - 5 valid data sets with realistic values
  - 1 set using minimum valid values (boundary test)
  - 1 set using maximum valid values (boundary test)

Format as a TypeScript array with a named interface:

interface [DataType] {
  [field]: [TypeScript type];
}

const [dataName]: [DataType][] = [ ... ];
```

### Complete Example — Add Employee Data

```
Generate test data for the OrangeHRM Add Employee form.

Fields required:
  firstName:   string, 1-30 chars, no numbers
  lastName:    string, 1-30 chars, no numbers
  employeeId:  string, format EMP followed by 4 digits (e.g. EMP0042)
  username:    string, 5-40 chars, lowercase, no spaces
  password:    string, min 8 chars, must include: uppercase,
               lowercase, number, special character

Generate:
  - 5 valid data sets with realistic Indian names
  - 1 set using minimum valid lengths for all fields
  - 1 set using maximum valid lengths for all fields

Format as TypeScript with a named interface:
interface EmployeeData {
  firstName: string;
  lastName: string;
  employeeId: string;
  username: string;
  password: string;
}
```

### Using Test Data in Tests

```typescript
import { employeeTestData } from '../data/employeeData';

test.describe('Add Employee Tests', () => {
  employeeTestData.forEach((data) => {
    test(`add employee: ${data.firstName} ${data.lastName} @regression`,
      async ({ addEmployeePage }) => {
        await addEmployeePage.fillFirstName(data.firstName);
        await addEmployeePage.fillLastName(data.lastName);
        await addEmployeePage.fillEmployeeId(data.employeeId);
        await addEmployeePage.clickSave();
    });
  });
});
```

---

## 16. Using Copilot for Refactoring

### Common Refactoring Tasks in Test Automation

**Replacing CSS selectors with getByRole:**
```
Select the page object → Ctrl+I:
"Refactor all CSS selectors and XPath in this file to use
 getByRole, getByLabel, or getByPlaceholder. Do not change
 method signatures or return types."
```

**Converting .then() to async/await:**
```
Select the method → Ctrl+I:
"Convert all .then() chains in this method to async/await.
 Keep the same behaviour."
```

**Extracting repeated locator patterns into private properties:**
```
Select the entire class → Copilot Chat:
"This page object uses inline locators inside methods.
 Refactor to extract all locators into private class properties
 at the top of the class, following the pattern in
 #file:pages/LoginPage.ts"
```

**Adding missing TypeScript return types:**
```
Select the class → Ctrl+I:
"Add explicit return types to all public methods that are missing them.
 Do not change any logic."
```

**Standardising method naming:**
```
Chat:
"Looking at #file:pages/LoginPage.ts and
 #file:pages/EmployeeListPage.ts, review my
 #file:pages/AddEmployeePage.ts for method naming consistency.
 Suggest renames for any methods that do not follow the
 pattern established in the other two files."
```

---

## 17. Using Copilot for Understanding Unfamiliar Code

When you inherit a codebase or encounter a pattern you have not seen before, Copilot explains it clearly.

### Understanding What a File Does

```
Select the entire file → Ctrl+I → /explain

Or in Chat:
"Explain what #file:helpers/BasePage.ts does and why each part exists.
 Write the explanation as if you are explaining to someone who knows
 TypeScript but has not used Playwright before."
```

### Understanding a Specific Pattern

```
Select the fixture setup in baseFixture.ts → Ctrl+I → /explain

Or paste in Chat:
"Explain what this Playwright fixture is doing:
 [paste fixture code]
 Specifically: why does it use 'use' instead of a function call?
               what is the scope: 'test' doing?"
```

### Understanding Why a Test Fails Without an Error

Sometimes a test passes but the assertion is wrong — it verifies the wrong thing and gives false confidence:

```
Chat:
"Review this test and tell me: is it actually testing what
 the test name claims it is testing? Is the assertion strong
 enough to catch a real regression?

 Test:
 [paste test]"
```

This is one of the highest-value uses of Copilot for QA specifically — catching tests that pass but do not verify anything meaningful.

---

## 18. Multimodal — Using Screenshots with Copilot

Copilot Chat can read images. This is directly useful for test automation.

### How to Attach a Screenshot

```
Method 1: Drag and drop an image file into the Copilot Chat input
Method 2: Paste from clipboard — take a screenshot and Ctrl+V in Chat
Method 3: Click the paperclip/attachment icon in the Chat input
```

### Screenshot Shortcuts

```
Windows: Win+Shift+S → select area → image copied to clipboard → Ctrl+V in Chat
macOS:   Cmd+Shift+4 → select area → file saved to Desktop → drag to Chat
Linux:   gnome-screenshot -a → select area → file saved
```

### Use Case 1 — Get Locators from a UI Screenshot

```
[attach screenshot of the OrangeHRM Add Employee form]

"Based on this UI screenshot, what locators should I use for:
  - The First Name field
  - The Last Name field
  - The Employee ID field
  - The Save button

Use getByRole, getByLabel, or getByPlaceholder — no CSS selectors."
```

### Use Case 2 — Diagnose a Test Failure from the HTML Report

```
[take a screenshot of the Playwright HTML report failure section]

"Looking at this Playwright test failure report:
  1. What step failed?
  2. What is the most likely cause?
  3. What should I check first?"
```

### Use Case 3 — Extract Test Scenarios from a Wireframe

```
[attach a wireframe or Figma screenshot of a form]

"Based on this form wireframe, list all the test scenarios
 I should cover:
   - Happy path
   - Each validation rule
   - Edge cases
 Format as a numbered list I can use as a test plan."
```

### Use Case 4 — Understand a TypeScript Error Screenshot

```
[take a screenshot of the red underline error in VS Code]

"What does this TypeScript error mean and how do I fix it?
 My file is EmployeeListPage.ts extending BasePage."
```

---

## 19. The AI Output Review Checklist

Every time Copilot generates a file, run through this before accepting.

### POM Review Checklist

```
Structure:
  □ File exports a default class
  □ Class extends BasePage
  □ Constructor calls super(page) and accepts Page parameter
  □ All locators are defined as private class properties at the top

Locators:
  □ No CSS selectors (.class, #id, [attribute])
  □ No XPath
  □ No page.locator() with a CSS string
  □ Only: getByRole, getByLabel, getByPlaceholder, getByText, getByTestId

Methods:
  □ No expect() or assertion calls inside any method
  □ All public methods have explicit TypeScript return types
  □ No page.waitForTimeout() — uses element waits instead
  □ No hardcoded base URL — uses relative paths

Style:
  □ Naming matches convention (PascalCase class, camelCase methods/properties)
  □ Pattern matches LoginPage.ts (the style reference)
```

### Test File Review Checklist

```
Imports:
  □ Imports test and expect from fixtures file, not from @playwright/test
  □ No direct import of page object classes

Structure:
  □ test.describe wraps all tests in the file
  □ Describe label is descriptive

Fixtures:
  □ Uses fixtures for page objects — not new PageObject(page)
  □ Correct fixture name used (matches what is in baseFixture.ts)

Independence:
  □ Each test can run on its own — no shared state between tests
  □ Tests do not rely on execution order
  □ If tests create data, afterEach or afterAll cleans it up

Tags:
  □ Happy path test tagged @smoke
  □ Edge cases and validation tests tagged @regression
  □ Full user journeys tagged @e2e if applicable

Assertions:
  □ Each test has at least one assertion
  □ Assertions verify the right thing (not just .toBeVisible() for everything)
  □ No assertions that always pass (expect(true).toBe(true))

Page Object Usage:
  □ All interactions go through page object methods
  □ No direct locator calls (getByRole, getByLabel etc.) in test files
  □ No page.goto() calls in tests — use a page object goto() method
```

---

## 20. What Copilot Gets Wrong — Common Failure Patterns

Knowing what Copilot gets wrong lets you catch errors before they reach your codebase.

### Failure Pattern 1 — CSS Selector Drift

Even with custom instructions set, Copilot occasionally reverts to CSS selectors — especially when the element is complex and `getByRole` requires extra filtering.

```
Watch for:
  this.page.locator('.oxd-input')
  this.page.locator('#username')
  this.page.locator('[data-v-xxx]')
  this.page.locator('input[type="text"]')

Replace with appropriate getBy* method.
If you cannot easily replace it, ask Copilot:
"This CSS selector needs to become a getByRole or getByLabel.
 The element is: [describe the element]. What is the correct
 Playwright locator?"
```

### Failure Pattern 2 — The Invisible Assertion

Copilot sometimes adds assertions into page object methods, making the POM into a mix of actions and verification. This breaks the POM principle and makes tests harder to debug.

```
Watch for:
  async clickSave(): Promise<void> {
    await this.saveButton.click();
    await expect(this.successMessage).toBeVisible(); // ← WRONG — assertion in POM
  }

Remove the assertion from the POM. Add it to the test instead.
```

### Failure Pattern 3 — Test Dependency

Copilot generating multiple tests sometimes creates a chain where test 2 relies on test 1 having run first — searching for data that was created by the previous test.

```
Watch for:
  test 1: 'add employee John Smith @smoke'
  test 2: 'search for John Smith @regression'
  ← test 2 only passes if test 1 ran first

Fix: Each test must set up its own state.
     Either use beforeEach to create the required data,
     or use a known-existing data set in the live demo app.
```

### Failure Pattern 4 — Hardcoded Waits

Copilot knows `page.waitForTimeout` exists and sometimes uses it when a smarter wait would work.

```
Watch for:
  await page.waitForTimeout(2000); // ← fragile, slow

Replace with:
  await this.saveButton.waitFor();
  await this.successMessage.waitFor({ state: 'visible' });
  await page.waitForURL('**/pim/viewEmployeeList');
```

### Failure Pattern 5 — The Always-Passing Assertion

The most dangerous failure: Copilot writes a test that looks correct and runs without errors but does not actually verify the right thing.

```
Watch for:
  expect(await addEmployeePage.getSuccessMessage()).toBeTruthy();
  // ← passes if the string is not empty — even if it says "Error"

  expect(result).toBeDefined();
  // ← passes as long as result is not undefined — not meaningful

Better:
  expect(await addEmployeePage.getSuccessMessage())
    .toHaveText('Successfully Saved');
```

Always ask yourself: "What would this assertion look like if the feature was broken?" If the assertion would still pass when the feature is broken, it is not a useful assertion.

---

## 21. The Daily Workflow — A Complete Session from Start to Commit

This is the full workflow for adding a new feature to the OrangeHRM test suite using Copilot.

### Before Opening VS Code

```
1. Understand the feature you are testing
   Open OrangeHRM and manually walk through the workflow:
     - Where does the page live?
     - What elements does it have?
     - What happens on success?
     - What validates and what error messages appear?

2. Open DevTools and note the elements
   - Best locator strategy for each element
   - Placeholder text for inputs
   - Button names and roles
   - Table structure
```

### Opening VS Code

```
3. Pull the latest code
   git pull origin main

4. Open Copilot Chat (Ctrl+Shift+I)

5. Load your session context:
   "Working on OrangeHRM Playwright TypeScript automation.
    [paste BasePage.ts]
    [paste LoginPage.ts as style reference]
    [paste login.spec.ts as test style reference]
    Today: creating LeaveApplyPage.ts and apply-leave.spec.ts"
```

### Generating the POM

```
6. Send the POM generation prompt with element details

7. Review the generated POM against the checklist:
   □ extends BasePage
   □ no CSS selectors
   □ no assertions
   □ all locators are private properties
   □ all methods have return types

8. Save the file: pages/LeaveApplyPage.ts

9. Quick locator validation — open a test to confirm locators work:
   npx playwright test --headed tests/smoke.spec.ts
   (or write a quick throwaway test to navigate and wait for elements)
```

### Generating the Tests

```
10. Send the test generation prompt referencing the new POM

11. Review the generated tests against the checklist:
    □ imports from fixtures
    □ uses fixture injection
    □ tests are independent
    □ tags are correct
    □ assertions are meaningful

12. Save the file: tests/apply-leave.spec.ts
```

### Running and Verifying

```
13. Run the new tests in headed mode to watch them execute:
    npx playwright test tests/apply-leave.spec.ts --headed

14. If a test fails:
    - Read the error completely before asking Copilot
    - Copy the exact error from the terminal
    - Send the debugging prompt: error + test + POM

15. If all tests pass:
    - Run the full suite to check for regressions:
      npx playwright test
    - Open the HTML report to confirm:
      npx playwright show-report
```

### Committing

```
16. Code review:
    - Use Copilot Chat to review both new files
    - Fix any issues flagged

17. Stage and commit:
    git add pages/LeaveApplyPage.ts tests/apply-leave.spec.ts
    git commit -m "add LeaveApplyPage POM and smoke/regression tests"
    git push
```

Total time for a well-prepared feature: 30–60 minutes including the manual application walkthrough. Without AI: 2–4 hours.

---

## 22. Keyboard Shortcuts Quick Reference

### Copilot Shortcuts

```
Tab              → Accept inline suggestion
Escape           → Dismiss inline suggestion
Alt+]            → Next alternative suggestion
Alt+[            → Previous alternative suggestion
Ctrl+Enter       → Open Copilot suggestions panel (see all alternatives)

Ctrl+Shift+I     → Open/close Copilot Chat panel
Ctrl+I           → Inline chat on current file (or selected code)

In Chat panel:
  /explain       → Explain selected code
  /fix           → Fix bug in selected code
  /tests         → Generate tests for selected code
  /doc           → Add documentation to selected code

  @workspace     → Search and reference your entire project
  #file:path.ts  → Include a specific file in context
  #selection     → Use currently selected editor text
```

### Playwright Terminal Commands

```
npx playwright test                          → Run all tests
npx playwright test tests/login.spec.ts      → Run one file
npx playwright test --headed                 → Show browser
npx playwright test --grep @smoke            → Run by tag
npx playwright test --grep @smoke --project=chromium  → Tag + browser
npx playwright test --last-failed            → Re-run only failed
npx playwright test -g "test name"           → Run by name
npx playwright show-report                   → Open HTML report
npx playwright codegen [url]                 → Open code generator
npx playwright install                       → Install browsers
npx playwright install --with-deps           → Install + system deps
```

### Git Shortcuts (in Terminal)

```
git status                                   → See changed files
git add .                                    → Stage everything
git add pages/LoginPage.ts                   → Stage one file
git commit -m "message"                      → Commit
git push                                     → Push to remote
git pull                                     → Pull latest
git checkout -b feature/branch-name         → New branch
git diff                                     → See unstaged changes
```

---

*Last updated: February 2026. Copilot features and pricing change frequently — verify against docs.github.com/copilot for the latest.*
