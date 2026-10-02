# Chapter 908 — Playwright CLI & SKILLs

Playwright CLI is a command-line agent tool that generates, runs, and maintains Playwright
tests with minimal human intervention. It uses SKILL files as its instruction set.
This chapter covers what the CLI is, how it uses SKILLs, the key commands, the token
efficiency argument vs MCP, and when to choose CLI over MCP.

---

## Q908.1 — What is the Playwright CLI in the context of AI agents?

The Playwright CLI (also called `playwright-cli` or accessed via `npx playwright`) includes
an AI agent mode that writes, runs, and fixes tests autonomously. Unlike the Playwright MCP
server (which gives an agent live browser control), the CLI agent operates on your codebase
— reading files, writing code, running tests, and iterating on failures.

The two tools have different roles:

| | Playwright MCP Server | Playwright CLI (agent mode) |
|---|---|---|
| Primary role | Live browser control | Codebase-level code generation |
| Context | Page accessibility tree | Source files + SKILL file |
| Token cost | High (30+ tool schemas) | Low (SKILL = 200-400 tokens) |
| Output | Locators + interaction results | Written test files |
| Best for | Exploration, debugging | Bulk test generation, maintenance |

---

## Q908.2 — How do SKILL files integrate with the Playwright CLI?

When you run the CLI agent, it reads the SKILL file first. The SKILL file is the agent's
instruction set — it tells the agent how your framework works before it writes any code.

```bash
# Run agent with a specific SKILL file
npx playwright codegen --skill docs/skills/playwright-framework.skill.md

# The agent reads the SKILL, then reads your task, then generates code
```

Without a SKILL file, the CLI agent generates generic Playwright code that uses its
training patterns. With a SKILL file, it generates code that matches your framework's
import paths, locator strategy, fixture structure, and naming conventions.

The CLI + SKILL combination achieves the same framework consistency as MCP + full source
files, at a fraction of the context cost.

---

## Q908.3 — Why are CLI SKILLs more token-efficient than MCP tool schemas?

When an AI agent connects to the Playwright MCP server, it reads all tool schemas
at session start. With 30+ tools at ~250 tokens each:

```
MCP tool schemas:   30 tools × 250 tokens = 7,500 tokens
                    Used before any code generation begins

CLI SKILL file:     200-400 tokens total
                    Covers framework standards, patterns, one example
```

For a coding agent that generates 50 test files in one session, this difference multiplies:

```
MCP (each turn has tool schemas in context):
  50 generations × 7,500 tokens = 375,000 tokens for tool schemas alone

CLI SKILL (read once, cached):
  1 × 400 tokens = 400 tokens for the SKILL
```

For coding tasks — writing, running, fixing tests — the CLI with a SKILL file is
dramatically more efficient than MCP. MCP wins only when live browser interaction
is genuinely needed.

---

## Q908.4 — What are the main CLI commands for AI-assisted test automation?

Record mode — generate code by demonstrating in a browser:
```bash
npx playwright codegen https://yourapp.com
```
Opens a browser and records your clicks/fills as Playwright code. Not AI — rule-based
recording. Good for initial test scaffolding.

Test generation with AI (where supported):
```bash
# Using Claude Code CLI (Anthropic's agent CLI tool)
claude 'Write a Playwright test for the leave application feature.
        Use the existing LeaveApplicationPage page object.
        Follow the patterns in tests/specs/employee.spec.ts'

# The agent reads the SKILL (via .cursorrules or copilot-instructions.md),
# writes the file, runs the tests, and fixes failures autonomously
```

Run and fix loop:
```bash
# Manual loop version
npx playwright test tests/specs/leave.spec.ts
# Read failure, fix code, run again

# Agent loop version (using Claude Code or similar)
claude 'Run the leave tests, identify failures, and fix them.
        Do not change the test assertions — only fix locator issues.'
```

---

## Q908.5 — What is the SKILL file format for Playwright CLI agents?

The SKILL file is a plain markdown document. Its content follows the structure
covered in Chapter 72 — but with one critical addition for CLI agents:
the expected output section must describe the exact files to create and
where to put them.

```markdown
# Playwright OrangeHRM Framework SKILL

## Directory Structure
tests/
  specs/     <- test files named *.spec.ts
  pages/     <- page objects named *.page.ts
  fixtures/  <- fixtures in base.fixture.ts
  data/      <- testData factory in test-data.ts

## Import Pattern
import { test, expect } from '../fixtures/base.fixture';
import { testData } from '../data/test-data';

## Locator Priority
1. getByRole (buttons, links, headings)
2. getByLabel (form fields)
3. getByTestId (custom components)
4. NEVER: CSS selectors, XPath

## Test Example
[complete working test]

## Rules
- No page.waitForTimeout() — use expect assertions
- No hardcoded test data — use testData factory
- Tests must be independent — create own data

## Anti-Patterns
- await page.click('#save') // WRONG — use getByRole
- await page.waitForTimeout(2000) // WRONG — use expect

## Expected Output
- Test file: tests/specs/[feature].spec.ts
- Page object (if missing): tests/pages/[feature].page.ts
- Run: npx playwright test tests/specs/[feature].spec.ts
- All tests must pass before reporting done.
```

---

## Q908.6 — How do you configure the CLI agent to use a SKILL file automatically?

Different agents read instructions from different locations:

**Claude Code:** reads `CLAUDE.md` in the project root automatically.
Put your framework SKILL content in `CLAUDE.md` and Claude Code uses it
without needing an explicit `--skill` flag.

**Cursor:** reads `.cursorrules` in the project root.
Add your SKILL content to `.cursorrules` for automatic inclusion.

**GitHub Copilot:** reads `.github/copilot-instructions.md`.

**Pattern:** one SKILL file, multiple entrypoints:
```bash
# The authoritative SKILL lives here:
docs/skills/playwright-framework.skill.md

# Symlinks or copies for each tool:
CLAUDE.md -> docs/skills/playwright-framework.skill.md
.cursorrules -> docs/skills/playwright-framework.skill.md
.github/copilot-instructions.md -> docs/skills/playwright-framework.skill.md
```

Keeping one authoritative SKILL and linking from each tool's config location
ensures all agents get the same instructions without maintaining duplicates.

---

## Q908.7 — How does the CLI agent loop work for test generation?

A CLI agent running a test generation task follows this loop:

```
1. READ SKILL    — load framework instructions
2. READ TASK     — understand what to generate
3. READ CONTEXT  — load relevant page objects, fixtures, example tests (RAG or manual)
4. GENERATE      — write the test file
5. RUN           — execute: npx playwright test [file]
6. READ RESULTS  — parse the test output
7. PASS? → DONE  — report completion
   FAIL? → DIAGNOSE → FIX CODE → go to step 5
```

The loop continues until all tests pass or a maximum iteration count is reached.
The SKILL file is in context at every step — it ensures the agent does not drift
to different patterns between the generation step and the fix step.

---

## Q908.8 — What is the difference between Playwright codegen and CLI agent mode?

`npx playwright codegen` is a recording tool, not an AI agent. It:
- Opens a headed browser
- Records your manual interactions
- Converts them to Playwright code in real time
- Outputs static code based on rules (not LLM inference)

CLI agent mode (Claude Code, Cursor Composer, GitHub Copilot agent) is an LLM-powered
loop that:
- Reads your instructions and framework context
- Generates code using a language model
- Runs the code and iterates on failures
- Can handle complex conditional logic and test structure

```
codegen: You click Save → agent writes await page.click('button:has-text("Save")')
         (CSS selector, no understanding of accessibility)

CLI agent: 'Generate a test for saving an employee' →
            await page.getByRole('button', { name: 'Save' }).click()
            (uses getByRole because SKILL specifies accessibility-first locators)
```

---

## Q908.9 — How do you run the CLI agent for maintenance tasks (fixing broken tests)?

```bash
# Using Claude Code for maintenance:
claude 'Some tests in tests/specs/ are failing after the UI redesign.
        Run all tests, identify failures caused by changed locators,
        and fix the locators. Do not change test assertions or test logic.
        Only fix selectors that no longer work.'

# Agent will:
# 1. Run: npx playwright test
# 2. Read failures
# 3. For each failure: identify the broken locator
# 4. Check if it is a locator issue vs application bug
# 5. Fix locator issues in the page objects or test files
# 6. Re-run to verify
# 7. Report what was fixed and what still fails
```

This maintenance workflow is one of the highest-ROI uses of CLI agents — it turns
a half-day of manual locator hunting into a 15-minute automated task.

---

## Q908.10 — How do you combine CLI and MCP in a single workflow?

Some tasks benefit from both. Use MCP for the parts that require live browser
observation, then CLI for the parts that require code generation.

**Example workflow: Generate tests for a new feature:**

**Step 1 — MCP phase (live browser observation):**
```
Connect Playwright MCP to Cursor.
Navigate to the new feature pages.
Read snapshots to discover locators.
Walk through the feature flow.
Ask agent to output: locator reference table and flow description.
```

**Step 2 — CLI phase (code generation):**
```
Disconnect MCP (save context window tokens).
Provide the locator table and flow description as context.
Add SKILL file.
Ask agent to generate the page object and test file.
Agent runs tests and fixes failures.
```

This two-phase approach uses each tool for what it is best at.

---

## Q908.11 — What are the CLI options most useful for test automation agents?

```bash
# Run specific test file
npx playwright test tests/specs/leave.spec.ts

# Run with a specific project
npx playwright test --project=chromium

# Run in headed mode (useful for agent debugging)
npx playwright test --headed

# Run with verbose reporter (agent reads output easily)
npx playwright test --reporter=list

# Run with JSON reporter (agent can parse results programmatically)
npx playwright test --reporter=json > results.json

# Run only failed tests from last run (efficient repair loop)
npx playwright test --last-failed

# Debug a specific test interactively
npx playwright test --debug tests/specs/leave.spec.ts

# Update snapshots (visual regression baseline)
npx playwright test --update-snapshots

# TypeScript check without running tests
npx tsc --noEmit
```

Agents use `--reporter=list` most often because it produces clean,
easy-to-parse output. `--last-failed` is valuable in repair loops to
focus only on tests that need fixing.

---

## Q908.12 — How do you handle agent-generated code quality in the CLI workflow?

AI-generated code can compile and pass while still having quality issues:
- Tests that assert the wrong thing (assert what is convenient, not what matters)
- Tests that are not actually independent (depend on test order)
- Locators that work but are fragile (text matching instead of role matching)

Quality gates for CLI-generated tests:

**Gate 1 — TypeScript compilation:**
```bash
npx tsc --noEmit
```
Catches invented methods, wrong types, import errors.

**Gate 2 — Run in isolation:**
```bash
npx playwright test [file] --workers=1
```
Each test must pass alone before it can pass in parallel.

**Gate 3 — Run in random order:**
```bash
npx playwright test [file] --workers=4
```
Tests that pass alone but fail in parallel have state dependencies.

**Gate 4 — Human review checklist:**
- Does each test have at least one meaningful assertion (not just toBeVisible)?
- Does each test use the testData factory?
- Are locators using getByRole/getByLabel (not CSS)?

---

## Q908.13 — What is the SKILL file maintenance cycle?

A SKILL file is only effective if it stays current. The maintenance cycle:

```
Framework change detected
      ↓
Update SKILL file (same PR as the framework change)
      ↓
Run a generation task using the updated SKILL
      ↓
Review generated code — does it follow the new pattern?
      ↓
Yes → merge PR          No → refine the SKILL, repeat
```

Common SKILL updates that trigger the cycle:
- New import path (fixtures moved, renamed)
- New locator rule (switched from getByTestId to getByRole)
- New test data factory pattern
- New page object base class or method signature
- New CI command or test runner flag

A SKILL that lags behind the framework by one sprint will cause the agent to
generate code that uses the old patterns — which then fails or requires manual editing.

---

## Q908.14 — In your project, how do you use the CLI agent workflow?

In our OrangeHRM framework, we use Claude Code as our primary CLI agent for test
generation and maintenance.

Our `CLAUDE.md` (the Claude Code instruction file) contains our full framework SKILL.
When we start a generation session, Claude Code reads `CLAUDE.md` automatically
and has the full framework context without any additional setup.

The standard generation workflow:
1. Product team delivers a user story with acceptance criteria
2. QA engineer pastes the story into Claude Code:
   'Generate tests for this user story. Use existing page objects.
    Run the tests and fix any failures.'
3. Claude Code reads CLAUDE.md (SKILL), reads existing page objects, writes tests,
   runs them, fixes locator issues, and reports completion
4. QA engineer reviews the generated tests for correctness and commits

Average time from user story to committed, passing tests: 25 minutes.
Same task done manually: 90–120 minutes.
The time savings allow the team to cover more edge cases and spend more time on
test design decisions rather than typing boilerplate.

---

## Chapter Summary

- Playwright CLI agent mode uses an LLM to generate, run, and fix tests autonomously. Different from `playwright codegen` (recording tool) — this is a full AI agent loop.
- SKILL files integrate with CLI agents as the framework instruction set. Read once per session, keep the agent generating consistent, framework-correct code.
- Token efficiency: SKILL file = 200-400 tokens. MCP tool schemas = 7,500+ tokens. For code generation tasks, CLI + SKILL is dramatically cheaper than MCP.
- CLI agent loop: Read SKILL → Read task → Generate code → Run tests → Read results → Fix failures → Repeat until passing.
- Configure SKILL for each agent tool: `CLAUDE.md` for Claude Code, `.cursorrules` for Cursor, `.github/copilot-instructions.md` for GitHub Copilot.
- Key CLI flags for agents: `--reporter=list` (clean output), `--last-failed` (repair loops), `--workers=1` (isolation test), `tsc --noEmit` (type check).
- CLI + MCP combined workflow: use MCP for live browser locator discovery, then CLI for code generation. Each phase uses the tool it is best at.
- Quality gates for generated code: TypeScript compile, run in isolation, run in parallel, human review checklist.
- SKILL maintenance: update in same PR as framework change, test with a generation run, merge only when output matches new patterns.
