# Chapter 909 — MCP vs CLI — Choosing the Right Approach

Playwright MCP server and Playwright CLI agents are both AI-powered tools for test
automation — but they solve different problems. This chapter gives you the decision
framework, the trade-off table, the hybrid strategy, and the contexts where each
tool clearly wins.

---

## Q909.1 — What is the core difference between Playwright MCP and Playwright CLI?

**Playwright MCP:** An AI agent with a live browser. The agent navigates, observes,
and interacts with real pages. It sees the accessibility tree, can click buttons,
fill forms, and take screenshots — in real time.

**Playwright CLI agent:** An AI agent with a codebase. The agent reads files, writes
code, runs tests, and reads results — in a code-generation loop.

The simplest mental model:
- MCP = AI that does things in a browser
- CLI = AI that writes Playwright code

They are complementary. The best workflows use both.

---

## Q909.2 — When does MCP clearly win over CLI?

**Scenario 1 — Locator discovery on a live page.**
You need the correct locator for a complex widget — a date picker, a rich text editor,
a custom dropdown. You cannot easily infer the locator from reading HTML source.

MCP: Agent navigates to the page, reads the accessibility tree, and identifies the
correct `getByRole` or `getByLabel` locator from the live element.

CLI: Would require you to paste the HTML into context — less reliable because
the HTML may not accurately represent the rendered accessibility tree.

**MCP wins.**

**Scenario 2 — Debugging a UI flow that fails intermittently.**
A test fails 20% of the time. You need to observe the page state when it fails.

MCP: Agent can navigate the flow, observe each step, read console messages and
network requests, and identify the timing or state issue.

CLI: Can read test output and error logs, but cannot observe the live page state.

**MCP wins.**

**Scenario 3 — Exploring a feature you have never tested before.**
You need to understand how a new feature works before writing tests for it.

MCP: Agent navigates the feature, describes what it finds, and generates a
flow description and list of test scenarios.

CLI: Requires you to describe the feature first — it cannot discover it.

**MCP wins.**

---

## Q909.3 — When does CLI clearly win over MCP?

**Scenario 1 — Bulk test generation for known features.**
You need to generate 20 test files for a well-documented set of features with
existing page objects.

CLI: Agent reads your SKILL, existing page objects, and user stories. Generates
all 20 files, runs them, and fixes failures. Total context cost: SKILL (400 tokens)
+ page objects (~800 tokens each) + task description.

MCP: Would navigate to each page for every test generation — 20× browser sessions,
20× snapshot reads, 30+ tool schemas in context every call. Far more expensive
and slower for this task.

**CLI wins.**

**Scenario 2 — Locator repair after a UI redesign.**
50 tests have broken locators after a redesign. You know the pattern of what changed.

CLI: Agent reads failing tests, understands the pattern (e.g., all CSS ID selectors
are now getByTestId), applies the fix across all files in one pass.

MCP: Would need to navigate to each affected page to verify each locator — tedious
and slow for a known pattern change.

**CLI wins.**

**Scenario 3 — Framework maintenance and refactoring.**
Renaming a base class method, updating import paths across all test files, converting
all hardcoded strings to use the test data factory.

CLI: Agent reads all affected files, applies transformations, runs tests to verify.
This is a codebase task, not a browser task.

MCP: Has no role here — this task never requires a browser.

**CLI wins.**

---

## Q909.4 — How do token costs compare between MCP and CLI?

Token cost drives both speed and API expense. For a single test generation call:

```
MCP session context:
  30 tool schemas × 250 tokens    = 7,500  tokens (just for schemas)
  Conversation + snapshots         = 2,000+ tokens
  Total per generation call        = 9,500+ tokens

CLI session context:
  SKILL file                       = 400    tokens
  Page object (task-specific)      = 800    tokens
  Fixture                          = 300    tokens
  Example test                     = 600    tokens
  Task description                 = 200    tokens
  Total per generation call        = 2,300  tokens
```

For 50 test generation calls in one session:
```
MCP:  50 × 9,500  = 475,000 tokens
CLI:  50 × 2,300  =  115,000 tokens
      (SKILL read once, page objects vary per task)
```

CLI is approximately 4× cheaper for bulk generation tasks.

---

## Q909.5 — What is the hybrid workflow that uses both tools?

The highest-quality test authoring workflow uses each tool in its strength zone:

**Phase 1 — Discovery (MCP):**
For each new feature area:
- Connect Playwright MCP in Cursor
- Navigate to the feature pages
- Read accessibility trees with `browser_snapshot`
- Walk through all feature flows
- Output: locator reference table + flow description document

**Phase 2 — Generation (CLI):**
- Disconnect MCP (release context window tokens)
- Provide locator table + flow description as context
- Add SKILL file
- Ask agent to generate page object + test file
- Agent runs tests, fixes failures, reports completion

**Phase 3 — Maintenance (CLI):**
- When tests break, CLI agent reads failures and applies fixes
- Use MCP only when the failure requires live page observation

---

## Q909.6 — How do you choose between MCP and CLI for a given task?

Decision flowchart:

```
Does the task require observing a live browser?
  Yes → Use MCP
  No  →
    Does the task require writing or editing code files?
      Yes → Use CLI
      No  →
        Does the task require both browser and code?
          Yes → Use MCP first, then CLI
```

Quick reference:

| Task | Use |
|------|-----|
| Discover locators on a live page | MCP |
| Debug a failing test on the live app | MCP |
| Explore a feature you haven't seen | MCP |
| Generate tests from a spec | CLI |
| Fix broken locators (known pattern) | CLI |
| Refactor framework code | CLI |
| Generate 20+ test files | CLI |
| New feature: first-time test authoring | MCP → CLI |
| Post-redesign repair | CLI (+ MCP if needed) |

---

## Q909.7 — How does context window impact affect the MCP vs CLI decision?

The context window is a shared resource. Every token used by MCP tool schemas
is a token not available for source files, conversation history, and generated code.

For agents working on large codebases:
```
Claude Sonnet 4.6 context: 200,000 tokens

MCP session reserves:
  30 tool schemas:      7,500  tokens
  Available for code:  192,500 tokens

CLI session reserves:
  SKILL file:            400  tokens
  Available for code:  199,600 tokens
```

For most codebases the difference is negligible in absolute terms —
7,100 tokens is small relative to 200,000.

However, for agents that hold many source files in context simultaneously
(large framework refactoring, generating tests for 20 pages at once), the
7,500 overhead from MCP tool schemas can displace meaningful source file content.
CLI is the better choice when you need maximum context for source files.

---

## Q909.8 — What are the latency differences between MCP and CLI?

**MCP latency sources:**
- Browser launch: 500ms–2s for Chromium to start
- Each tool call: 100–500ms for browser to execute and return
- For a 10-step flow: 1–5 seconds of browser execution time
- Plus LLM inference time for each step

**CLI latency sources:**
- File reads: ~10ms (nearly instant)
- LLM inference: 1–5s per generation call
- Test run: 5–60s depending on suite size

For interactive sessions (a developer exploring), MCP latency is acceptable.
For automated pipelines generating many tests, CLI is faster.

---

## Q909.9 — Can MCP and CLI run simultaneously in the same agent session?

Yes. Cursor and some other AI IDEs allow multiple MCP servers to be connected
simultaneously. An agent can use the Playwright MCP server for browser interaction
AND file system operations for code writing in the same session.

The agent decides which tool to call at each step based on the task:
```
Step 1: browser_navigate('/employees')  [MCP browser tool]
Step 2: browser_snapshot()              [MCP browser tool]
Step 3: [reads snapshot] → generates locator
Step 4: write_file('tests/pages/employee.page.ts')  [file tool]
Step 5: run_command('npx playwright test')  [CLI tool]
Step 6: read_file('playwright-report/results.json')  [file tool]
```

The combined session uses more context window but enables seamless
browser-to-code workflows in a single agent conversation.

---

## Q909.10 — What are the security trade-offs between MCP and CLI?

**MCP security considerations:**
- Agent has live browser control: can submit forms, click buttons, read data
- If pointed at a production environment, agent can take destructive actions
- Accessibility tree can contain sensitive data the agent reads
- Prompt injection: malicious page content could influence agent actions

**CLI security considerations:**
- Agent reads and writes code files: can modify tests, configs, even framework code
- If given broad file permissions, agent can change anything in the repository
- Less environmental risk (no live browser actions)
- Risk is in what gets committed and deployed

**Mitigation for both:**
- Scope MCP to test environments only — never production
- Scope CLI agent file permissions to `tests/` directory only
- Review all agent-generated changes before committing
- Set maximum tool call budgets to prevent runaway agent loops

---

## Q909.11 — How do you pitch MCP vs CLI to a team new to AI testing tools?

The clearest explanation for a team new to both tools:

**Use MCP when you are exploring.**
You do not know what the page looks like, what the locators are, or how the
feature works. MCP is your exploration partner — it navigates, describes, and discovers.

**Use CLI when you are building.**
You know what the tests should do and you have the page objects ready.
CLI is your code generation partner — it writes, runs, and fixes.

**Most real projects need both.**
Explore with MCP, then build with CLI. Use MCP again only when something breaks
and you need to observe the live page to understand why.

---

## Q909.12 — In your project, how do you balance MCP and CLI usage?

In our OrangeHRM framework, we split usage roughly 20% MCP, 80% CLI.

MCP is used at the start of each sprint when new features are delivered.
One engineer runs a 30-minute MCP exploration session per new feature area:
navigate all pages, read snapshots, capture locator references in a markdown file.
This locator file becomes the input for the CLI generation phase.

CLI is used for all ongoing test generation, maintenance, and refactoring.
Claude Code with our CLAUDE.md SKILL handles most test writing automatically.

The MCP investment at sprint start pays off in better CLI output quality.
When the CLI agent has accurate locator references as context, the first-run
pass rate on generated tests goes from 74% to 88%.

---

## Chapter Summary

- MCP = AI agent with a live browser. CLI = AI agent with a codebase. They are complementary.
- MCP wins for: locator discovery, debugging live failures, feature exploration, new pages.
- CLI wins for: bulk test generation, locator repair from known patterns, framework refactoring.
- Token cost: MCP ~9,500 tokens per generation call. CLI ~2,300 tokens. CLI is ~4x cheaper for code generation.
- Hybrid workflow: MCP for exploration (locator discovery, flow description), CLI for generation (write, run, fix).
- Decision rule: does the task need a live browser? Yes → MCP. No → CLI. Both? → MCP then CLI.
- Context window: MCP uses 7,500 tokens on tool schemas. For large-codebase agents needing maximum source file context, CLI is better.
- Security: MCP risk is live browser actions on wrong environments. CLI risk is code changes to the repository. Both need scoped permissions and human review.
- Practical split: most teams use ~20% MCP (exploration) and ~80% CLI (generation/maintenance).
