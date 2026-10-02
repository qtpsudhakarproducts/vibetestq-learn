# Chapter 910 — Playwright AI Agents

AI agents in test automation are autonomous systems that perceive state, plan actions,
use tools, and iterate until a goal is achieved. This chapter covers the agent loop,
the tools agents use, multi-agent patterns (planner-generator-healer), governance
controls, and how to design agents that are reliable enough to run in production workflows.

---

## Q910.1 — What is an AI agent in test automation?

An AI agent is a system that wraps a language model in a loop, gives it tools, and lets
it work toward a goal without a human directing each step.

A model alone takes input and produces output — one round trip.
An agent takes a goal and works until it is done — many round trips.

For test automation:
```
Model: 'Write a test for login'
       → outputs code
       → you copy, paste, run, report back

Agent: 'Write a passing test for login'
       → writes code
       → runs the test
       → reads failure output
       → fixes the code
       → runs again
       → all passing: reports done
```

The agent does the run-read-fix loop that previously required human action.

---

## Q910.2 — What is the agent loop and how does it apply to test generation?

The standard agent loop has four steps:

**1. Perceive:** read the current state
   (test files, test output, page snapshot, error logs)

**2. Plan:** decide the next action
   (write test file, run tests, fix a locator, read a page object)

**3. Act:** execute the action using a tool
   (write_file, run_command, browser_click, read_file)

**4. Observe:** read the result
   (did the tests pass? what failed? what does the snapshot show?)

Then repeat from step 1 with the new state.

For test generation, one complete loop iteration might be:
```
Perceive:  Read SKILL + page object + task description
Plan:      Write the test file
Act:       write_file('tests/specs/leave.spec.ts', [generated code])
Observe:   run_command('npx playwright test tests/specs/leave.spec.ts')
           → 3 passed, 1 failed
Perceive:  Read the failure
Plan:      Fix the locator in test line 34
Act:       edit_file(...)
Observe:   run again → 4 passed
Done:      Report completion
```

---

## Q910.3 — What tools do test automation agents use?

A well-equipped test automation agent needs these categories of tools:

**File system tools:**
- `read_file(path)` — read a source file
- `write_file(path, content)` — create or overwrite a file
- `edit_file(path, old, new)` — make a targeted change
- `list_files(directory)` — discover what exists

**Command execution tools:**
- `run_command(cmd)` — run shell commands (npx playwright test, tsc --noEmit)
- Returns stdout, stderr, and exit code

**Browser tools (via Playwright MCP):**
- `browser_navigate(url)` — navigate to a page
- `browser_snapshot()` — read the accessibility tree
- `browser_click(ref)` — interact with an element

**Search tools:**
- `search_codebase(query)` — find relevant files (semantic search or grep)
- `read_docs(url)` — fetch documentation

**Reporting tools:**
- `read_test_results(path)` — parse JSON test results
- `create_ticket(title, body)` — create a Jira/GitHub issue from a failure

---

## Q910.4 — What is the planner-generator-healer multi-agent pattern?

For complex test automation tasks, three specialised agents work in sequence:

**The Planner agent:**
Input: feature description or user story
Goal: produce a structured test plan (test scenarios, data requirements, page mapping)
Output: a `test-plan.md` file listing what to test

**The Generator agent:**
Input: `test-plan.md` + SKILL file + relevant page objects
Goal: write complete, runnable test files for every scenario in the plan
Output: `*.spec.ts` test files

**The Healer agent:**
Input: test failure logs + test file + page snapshot
Goal: fix failures caused by locator issues or minor test code errors
Output: corrected test files that pass

```
User story
    ↓
[Planner] → test-plan.md
    ↓
[Generator] → *.spec.ts files
    ↓
Run tests
    ↓
Failures? → [Healer] → fixed *.spec.ts
    ↓
All passing → human review → commit
```

Each agent has a focused role and a focused SKILL file. This produces better
output than a single agent trying to plan, generate, and fix simultaneously.

---

## Q910.5 — How do you implement a simple healer agent in Playwright?

```typescript
// utils/healer-agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { Page } from '@playwright/test';

const anthropic = new Anthropic();

export async function healLocator(page: Page, failedLocator: string): Promise<string> {
  // Get the current accessibility tree
  const snapshot = await page.accessibility.snapshot();
  const snapshotText = JSON.stringify(snapshot, null, 2);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: `You are a Playwright locator expert.
             Given a broken locator and the current accessibility tree,
             suggest the correct Playwright locator.
             Reply with only the locator expression. No explanation.`,
    messages: [{
      role: 'user',
      content: `Broken locator: ${failedLocator}
               Accessibility tree: ${snapshotText}
               What is the correct locator?`
    }]
  });

  return (response.content[0] as any).text.trim();
}

// Usage in a resilient action helper:
export async function clickWithHealing(page: Page, locator: string): Promise<void> {
  try {
    await page.locator(locator).click({ timeout: 5000 });
  } catch {
    const healedLocator = await healLocator(page, locator);
    console.log(`Healed: ${locator} → ${healedLocator}`);
    await page.locator(healedLocator).click();
  }
}
```

---

## Q910.6 — What is agent self-correction and when is it useful?

Self-correction is the agent's ability to detect that its own output was wrong and
try again with a different approach.

For test generation, self-correction happens when:
1. Agent generates a test
2. Agent runs the test
3. Test fails
4. Agent reads the failure
5. Agent determines whether the failure is:
   a. A locator issue — fix the locator and retry
   b. A test logic issue — re-examine the spec and rewrite the test
   c. An application bug — do not fix the test, report the bug

Self-correction makes agents useful in automated pipelines. Without it, every
failure requires human intervention. With it, the agent handles recoverable failures
automatically and only escalates genuine issues.

The key to safe self-correction: tell the agent what it IS allowed to fix
(locator issues, test code errors) and what it is NOT allowed to change
(test assertions — these verify the expected behaviour).

---

## Q910.7 — What governance controls are needed for test automation agents?

As agents become more capable, governance prevents unintended consequences:

**Permission scoping:**
The agent should only have file permissions for the directories it needs.
A test generation agent needs `tests/` write access — not `src/` or deployment configs.

**Maximum iteration limits:**
An agent in a stuck repair loop can make hundreds of iterations, consuming
tokens and potentially making things worse. Set a hard maximum (e.g., 10 fix
attempts) after which the agent stops and reports for human intervention.

**Assertion protection:**
Test assertions define what the application is supposed to do. Agents should
never change assertions to make tests pass — they should only fix code that prevents
the assertion from running.
```
// In the agent's SKILL or system prompt:
NEVER change expect() assertions to make a failing test pass.
A failing assertion means the application may have changed — report it.
Only fix: locators, await issues, imports, test setup code.
```

**Human review before merge:**
All agent-generated and agent-fixed code should require human review before
committing to the main branch. Agents accelerate authoring — they do not
replace the engineer's judgment about what is worth testing.

**Audit log:**
Keep a log of what the agent changed, when, and why. If an agent breaks something
that later reaches production, the audit log is essential for diagnosis.

---

## Q910.8 — How do you prevent agent hallucination in code generation loops?

Hallucination in an agent loop is more dangerous than in a single generation call
because the agent can build on its own mistakes across many iterations.

Defences specific to agentic loops:

**Run TypeScript compilation after every generation:**
```bash
npx tsc --noEmit
```
Catches invented method names before the test even runs.

**Do not let the agent read its own previously generated code as context.**
If the agent generated wrong code in iteration 1 and reads it as context in
iteration 3, it may treat the wrong code as the standard.
Keep the SKILL file as the authoritative pattern source.

**Break long loops into checkpoints.**
After every 5 iterations, require the agent to summarise what it has done
and confirm the summary with the engineer before continuing.

**Test each generated file in isolation before combining.**
Running all 20 generated tests together makes it hard to isolate which
test introduced a hallucinated pattern.

---

## Q910.9 — How does a test automation agent handle state dependencies?

State dependencies — where one test's data or state affects another — are one
of the hardest problems for agents to handle correctly.

Agent-generated tests commonly fail state independence because:
- The agent writes test B to use data created by test A
- The agent assumes a database is clean at test start without explicitly cleaning it
- The agent creates a user in test A and tries to reuse that user in test B

Tell the agent explicitly in the SKILL:
```
State independence rules:
- Each test creates its own data using testData factory + API setup
- Each test cleans up its data in afterEach using the API
- No test reads data created by another test
- No test assumes the database is in any particular state

Data setup pattern:
  beforeEach: create employee via API → get ID → use in test
  afterEach:  delete employee via API → clean state
```

---

## Q910.10 — What is an orchestrator agent and what does it coordinate?

An orchestrator agent manages other agents. It does not write tests itself —
it plans the overall task and delegates to specialist agents.

For a large-scale test generation task:

```
[Orchestrator]
  Task: 'Generate complete test coverage for the Leave Management module'
  |
  ├── Sends to [Planner Agent]: 'Create a test plan for leave management'
  |   ← Receives: test-plan.md with 15 test scenarios
  |
  ├── Sends to [Generator Agent] × 15: 'Generate test for scenario N'
  |   ← Receives: 15 spec files
  |
  ├── Runs: npx playwright test tests/specs/leave-*.spec.ts
  |   ← Receives: 2 failures
  |
  ├── Sends to [Healer Agent] × 2: 'Fix these failures'
  |   ← Receives: 2 fixed spec files
  |
  └── Runs final verification → all passing → reports to engineer
```

The orchestrator pattern is the foundation of fully automated test authoring pipelines
where human involvement is limited to the initial task description and final review.

---

## Q910.11 — How do you monitor agent performance in a test automation pipeline?

Track these metrics per agent run:

**Completion rate:** percentage of generation tasks that finish without requiring
human intervention. Target: >80%.

**First-run pass rate:** percentage of generated tests that pass on the first run
without the healer agent. Target: >70%.

**Iteration count to completion:** how many fix iterations the healer needed.
Target: <3 average. High iteration counts suggest the generator is producing
unstable code that needs heavy fixing.

**Assertion integrity rate:** percentage of runs where the agent correctly identified
application bugs (failing assertions) and did not try to fix them.

**Cost per test file:** API tokens used per completed test file.
Track over time. Rising cost per file can indicate context window mismanagement
or excessive healer iterations.

---

## Q910.12 — What is the role of the human engineer in an AI agent workflow?

The agent automates mechanics. The engineer provides judgment.

**The engineer's role:**
- Define what should be tested (test strategy, risk-based decisions)
- Write and maintain SKILL files (the agent's instruction set)
- Review agent output for: assertion quality, test independence, coverage gaps
- Decide whether a failing assertion is a bug or a wrong expectation
- Approve changes before they are committed
- Improve agent performance by refining SKILL files when agents go wrong

**The agent's role:**
- Generate boilerplate test code from specs
- Run tests and report results
- Fix locator issues and minor test code errors
- Maintain consistency with the framework SKILL

The ratio shifts as agents improve: today, agents handle ~60% of test authoring
work. The engineering judgment that determines quality remains with the human.

---

## Q910.13 — How do you implement the planner agent in practice?

```typescript
// agents/planner.ts
import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync } from 'fs';

const PLANNER_SKILL = `
You are a test planning expert for OrangeHRM Playwright tests.
Given a feature description, produce a test plan with these fields per scenario:
- Test name
- Preconditions (what data/state must exist)
- Steps (brief user flow)
- Assertion (what must be true at the end)
- Priority (smoke / regression / edge case)

Output ONLY a JSON array. No text before or after.
`;

export async function runPlanner(featureDescription: string): Promise<void> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: PLANNER_SKILL,
    messages: [{ role: 'user', content: featureDescription }]
  });

  const plan = JSON.parse((response.content[0] as any).text);
  writeFileSync('agents/output/test-plan.json', JSON.stringify(plan, null, 2));
  console.log(`Plan created: ${plan.length} scenarios`);
}
```

---

## Q910.14 — In your project, how far have you implemented AI agents?

In our OrangeHRM framework, we run a simplified planner-generator pattern for new
feature coverage.

The planner is a structured prompt we run in Claude.ai chat — we paste the user story
and get a JSON test plan with 5–8 scenarios. This is not a fully autonomous agent;
it is a human-assisted planning step that takes 5 minutes instead of 30.

The generator is Claude Code running with our CLAUDE.md SKILL. We give it the test
plan JSON and the existing page objects. It generates the test file, runs it, and
fixes failures. This step runs largely autonomously.

We have not yet implemented a fully automated orchestrator. The human reviews the
test plan before generation and reviews the final tests before committing.
The automation handles the mechanics; the engineer handles the strategy.

The main benefit we have seen: test authoring time per feature is down from 4 hours
to 45 minutes. The human time is now spent on test strategy and review, not typing.

---

## Q910.15 — What is the maturity model for AI agents in test automation?

| Level | Description | What the agent does |
|-------|-------------|---------------------|
| L1 | Assisted | Suggests code; human accepts and runs |
| L2 | Co-pilot | Generates files; human runs and reviews |
| L3 | Generator | Generates, runs, and reports results; human reviews |
| L4 | Generator + Healer | Generates, runs, fixes failures, human reviews final output |
| L5 | Pipeline | Full planner-generator-healer; human reviews at start and end |
| L6 | Autonomous | Agent owns test maintenance; human receives summary reports |

Most engineering teams in 2026 are at L3–L4. L5 is being piloted at AI-forward companies.
L6 exists in limited form for specific, well-bounded test maintenance tasks.

The right level depends on: your framework's quality, your SKILL file maturity,
your team's trust in the agent output, and the risk of the tests being wrong.
Start at L2, build SKILL quality, measure first-run pass rate, advance when
that rate consistently exceeds 80%.

---

## Chapter Summary

- An AI agent wraps a model in a loop with tools. It perceives state, plans actions, executes tools, and observes results — repeatedly until the goal is achieved.
- The agent loop for test generation: Read SKILL → Generate code → Run tests → Read failures → Fix code → Repeat until passing.
- Tool categories: file system (read/write/edit), command execution (run tests, compile), browser (via MCP), search, reporting.
- Planner-generator-healer: three specialised agents with focused SKILLs. Planner creates test plan. Generator writes code. Healer fixes failures.
- Self-correction: the agent detects its own failures and retries. Key rule: agents fix locators and test code — never test assertions.
- Governance: scope file permissions, set iteration limits, protect assertions, require human review before merge, keep audit logs.
- Anti-hallucination in loops: compile after every generation, don't let agent read its own bad output as context, checkpoint every 5 iterations.
- The human engineer's role: test strategy, SKILL file maintenance, output review, assertion quality judgment. Agents handle mechanics.
- Maturity levels L1 (suggests) → L6 (autonomous). Most teams in 2026 are at L3-L4. Advance based on first-run pass rate.
