# Glossary

> Terms used throughout this guide. Alphabetical. Practical definitions, not dictionary definitions.

---

## ADR (Architecture Decision Record)

A short markdown file documenting a significant technical decision: what was decided, why, what alternatives were considered. Lives in `docs/decisions/`. Why it matters: AI can regenerate *what* was built. It cannot regenerate *why*. ADRs preserve the why.

## Agent

An AI system that executes multi-step tasks with minimal human input. Distinct from a *chatbot* (single-turn) or *assistant* (suggestions). In this guide, agents include:
- **Planner agent** — proposes test scenarios
- **Generator agent** — writes executable test code
- **Healer agent** — fixes broken locators at runtime
- **Custom agents** — your team's purpose-built agents on MCP

## `.ai/` folder

A convention in the Project Repository holding AI-specific context: prompts, rules, conventions, `graph.json`. The folder AI reads to understand your project. Typical contents: `project-context.md`, `conventions.md`, `graph.json`, `prompts/`, `templates/`.

## Agentic SDLC (Type 4)

SDLC model where AI agents execute large parts of the lifecycle — plan, code, test, heal — and humans govern rather than author. Contrasted with AI-Assisted (Type 1), where humans still drive each step.

## AI IDE

An IDE with native AI integration beyond simple autocomplete — can read full projects, execute tools via MCP, maintain context across sessions. Examples: Cursor, GitHub Copilot in Agent mode, Google Antigravity. In this guide: the *command center* of the Project Repository.

## Ambiguity detection

A WF1 capability where AI reads a requirement and flags vague, missing, or contradictory elements *before* generating scenarios. Often more valuable than the scenarios themselves — catches incomplete requirements before they waste dev cycles.

## Anti-pattern

A common failure mode that looks like success. Silent heals, weak assertions, stale `graph.json`. See `03-governance/anti-patterns.md`.

## Assertion strength

Ratio of specific assertions (`toBe`, `toEqual`, `toHaveText`) to weak assertions (`toBeTruthy`, `toBeDefined`). Falling strength = tests quietly weakening. A key metric for WF5 (automation generation) health.

## BDD (Behavior-Driven Development) — reborn

The idea that tests should derive from behavior specifications (Given/When/Then). Historically failed because maintaining specs by hand was expensive. In Type 2 Spec-Driven SDLC, AI writes and maintains specs — making BDD practical at scale for the first time.

## Browser Assistant Agent

Tool category 1 in the 7-category landscape. AI embedded in a browser that can navigate, click, fill forms like a real user. Examples: Perplexity Comet, Claude Chrome Extension. Best for exploratory testing (WF2); not for deterministic regression.

## Cloud-Scale AI Testing

Tool category 6. Cloud services that run AI-authored tests across device/browser matrices at scale. Example: BrowserStack AI Testing Agents. Use when validation needs to cover 40+ browser-device combinations.

## Composition

The skill of stacking tools from different categories to complete a workflow end-to-end. No single vendor sells all 7 categories; QA engineers compose. See `00-foundations/04-tool-landscape.md`.

## Compounding intelligence

The property that WF11 creates: each production incident makes the test suite smarter, so the same failure rarely recurs. The loop that separates Type 3+ teams from Type 1 teams.

## Conventions file

A markdown file in `.ai/` describing your team's conventions for testing, naming, structure. Referenced by every AI prompt so outputs stay consistent. Example: `.ai/conventions/test-conventions.md`.

## Coverage audit (WF8)

Workflow that asks not *"what percentage of code was executed"* but *"which scenarios are validated"* and *"are high-risk areas tested disproportionately more."* The difference between line coverage and real coverage.

## CI Quality Gate (WF10)

A CI step that enforces rules on every PR: linkage, tests present, coverage maintained, no silent heals. Distinct from a traditional CI (which only runs tests).

## Custom MCP Agent

An MCP server your team builds for your internal systems. Covered in tool category 4 (Platform AI). The way to extend AI capability to proprietary tools without vendor lock-in.

## Dry-run

Running a generated test against the app to verify it works — before committing. WF5 requires dry-run. Uncaught failures at dry-run save hours of broken-test debugging downstream.

## Evidence, not opinion

The central thesis of Act 8 in the talk: release decisions should be derivable from artifacts the system produces (test results, coverage audits, readiness reports) — not from a QA engineer's gut feel in a meeting.

## Exploration file

A structured markdown file capturing an exploratory testing session: risk areas probed, findings, decisions, things NOT explored. The format is non-negotiable — free-text notes kill WF2 within 5 sprints.

## Feature Readiness Gate (WF9)

An automated check that aggregates outputs from WF1-8 to produce a feature-level READY / NOT READY verdict with evidence. Turns release decisions into auditable artifacts.

## Fixture

A test data file (JSON, SQL, YAML) that seeds the test environment before a test runs and gets cleaned up after. In WF3, fixtures are AI-generated with PII safety rules applied.

## Fixture safety check

A validation script that ensures test data doesn't contain real PII patterns and follows the TEST_ prefix convention. A non-negotiable pre-commit hook. Never disable.

## Gap ticket

A Jira ticket filed automatically by WF8 when a coverage gap is detected. Includes: which code changed, which scenarios are uncovered, severity, suggested action.

## `graph.json`

The living traceability file in `.ai/` that connects requirements, code, tests, decisions, and coverage. AI writes it. AI reads it. Humans verify on PR. The backbone of every workflow downstream.

## Heal log

A JSONL file (`reports/heal-log.jsonl`) recording every runtime self-heal by WF7. One line per heal, grep-able, auditable. Silent heals (unlogged) are forbidden.

## Human-over-the-loop

Governance posture where humans review AI output *after* the AI has acted (as opposed to human-in-the-loop, where humans approve before AI acts). Common in Type 4 Agentic SDLC.

## Intelligence workflows

The third group of workflows (WF9–WF11). What the system learns: readiness, quality gates, production feedback. The compounding layer.

## Linkage coverage

The question: does every code file in `graph.json` have ≥1 linked test? A stricter measure than line coverage — catches files with zero tests, regardless of coverage percentage.

## Machine Context Layer

The layer of your SDLC that AI reads to reason about your project: the Project Repository, `graph.json`, `.ai/*`. Contrasted with the Human Process Layer (Jira, Confluence, ceremonies) — both coexist.

## MCP (Model Context Protocol)

A standardized protocol for AI models to talk to external tools. Often called "USB-C for AI." Examples: Playwright MCP, Chrome CDP MCP, Jira MCP. Lets any AI (Claude, Copilot, Cursor) use the same tools. Tool category 2 in the 7-category landscape.

## Override (WF10)

A mechanism to bypass the CI Quality Gate for legitimate exceptions (hotfix, prototype, urgent). Controlled by label permissions, requires written reason, logged permanently. Healthy rate: <2% of PRs.

## Page object

A class or module that encapsulates selectors and actions for a specific page. A Playwright test convention that prevents selector sprawl. Required by WF5 conventions.

## Platform AI

Tool category 4. AI that ties together SDLC platforms (Jira, Confluence, Bitbucket, GitHub, Slack). Examples: Atlassian Rovo, Claude plugins, custom agents. Operationalizes the Project Repository across tool boundaries.

## Playwright Agents

Tool category 5. Playwright's own agentic capabilities: Planner, Generator, Healer. Used in WF5, WF6, WF7.

## Project Repository

A posture, not a tool. Your existing Git repo becomes the source of truth for everything about the project — requirements, code, tests, decisions, documentation, AI context. Not a replacement for Jira/Confluence; an added machine-context layer.

## Project-context.md

A 1-page markdown file in `.ai/` that AI reads to understand your product at a glance: what it does, who uses it, what's critical. The most important file you'll write. Under 500 lines. Sets the tone for all AI output.

## Prompt rot

Anti-pattern where `.ai/prompts/*.md` become stale over 3–6 months, producing degraded AI outputs. Detected by quarterly prompt audit. Reversed by treating prompts as code (versioned, reviewed).

## READY (WF9 verdict)

A feature's readiness status when every criterion in `readiness-criteria.md` is met with evidence. Distinct from "tests pass" or "QA says so" — it's an audited state based on artifacts.

## REQ-ID

A stable identifier for a requirement: `REQ-142`, `REQ-143`, etc. Referenced in branch names, commit messages, test comments, `graph.json`. The connective tissue of traceability.

## Runtime self-healing

Tool category 7. Your framework + an AI API key + glue code that heals test failures at runtime. Distinct from design-time maintenance (WF6). See WF7.

## Scenario

A structured Given/When/Then description of expected behavior, approved by QA before development starts. Output of WF1. Used by WF5 to generate automated tests.

## Silent heal

An anti-pattern: AI fixes a test at runtime without logging what it did. The test stays green, but the UI may have genuinely regressed. **Forbidden.** Every heal must be logged for review.

## Spec-Driven SDLC (Type 2)

SDLC model where development is controlled by testable specifications. Nothing starts until the spec is approved (WF1). Think BDD, but with AI maintaining specs and deriving tests.

## Stack (composition)

The specific ordered sequence of tools that complete a workflow end-to-end. Example: WF1 stack = Rovo → Claude plugin → Cursor → Playwright MCP → `graph.json`. Documented in Act 7 of the talk.

## Testability gate

A check (often in WF1) that a requirement is testable before development starts. AI runs the check; if the requirement is vague, it's sent back to the BA rather than moving to dev. Central to Type 2 SDLC.

## Test data rules

A file at `.ai/conventions/test-data-rules.md` defining what test data can and cannot contain (no real PII, always TEST_ prefix, compliance boundaries). Referenced by WF3. Non-negotiable.

## Traceability debt

The accumulation of untracked links between requirements, code, and tests. Paid historically by human memory and tribal knowledge. Paid in the AI era by `graph.json`.

## Type 1 / Type 2 / Type 3 / Type 4 / Type 5

The five types of AI SDLC. See the talk or `02-matching/workflow-to-sdlc-type.md`. The center of control shifts through each type: humans → tools → specs → workflows → AI → governance.

## Workflow

An end-to-end loop across the SDLC: continuous, repeats every sprint, learns from production. Distinct from a test case (fires once). The 11 workflows in this guide are design (WF1–4), execution (WF5–8), and intelligence (WF9–11).

## Workflow Composer

QA's new job title. Not tester. Not automator. The person who decides which tools from which categories stack together to close a workflow loop. Composition is the skill.

---

## Next

- `04-appendix/tools-reference.md` — tool comparison matrix and recommendations
- Back to `README.md` — reading path if you got lost
