# Chapter 4: GenAI + MCP for Testing

## Claude Desktop & MCP Introduction
This covers the cutting edge of AI utility. Most people use AI via a chat window (ChatGPT). But what if the AI could *touch* your files, *read* your Jira tickets, and *create* Excel sheets directly?

**What is MCP (Model Context Protocol)?**
MCP is a standard that allows AI models (like Claude) to connect to external tools and data safely.
*   **Without MCP**: You copy a Jira ticket, paste it into ChatGPT, ask for test cases, copy the result, and paste it back into Jira.
*   **With MCP**: You tell Claude, "Read Jira ticket-123 and create test cases for it." Claude connects to Jira, reads the ticket, generates the tests, and waits for your confirmation.

**Analogy: The Smart Assistant**
*   **Chatbot (No MCP)**: A genius consultant locked in a glass room. You have to shout information to them and write down their answers. They can't touch anything on your desk.
*   **MCP Agent**: A genius assistant sitting at your computer. They can open files, type emails, and update spreadsheets directly, but they always ask for permission first.

## Setting Up Claude Desktop
Claude Desktop is the environment where we run these "Local MCP" tools.
*   **The Config File**: A simple JSON file (`config.json`) tells Claude which tools it is allowed to use.
*   **Security**: You control the keys. The AI only accesses what you explicitly allow.

## Local MCP Integrations
1.  **Filesystem MCP**:
    *   *Capability*: Allows Claude to read and create files on your hard drive.
    *   *Use Case*: "Read the Requirement.pdf in my documents folder and create a Test_Plan.md file in the same folder."
2.  **Excel MCP**:
    *   *Capability*: Read/Write Excel files.
    *   *Use Case*: "Add these 10 generated test cases to the 'Regression' sheet in `Tests.xlsx`."

## Jira MCP Integration
This is the game-changer for enterprise testers.
*   **Functionality**:
    *   **Get Issue**: "Summarize Ticket PROJ-101."
    *   **Create Issue**: "Create a bug report for the crash I just described."
    *   **Update Issue**: "Add a comment to PROJ-101 with these test steps."
*   **Benefit**: Eliminates the "Context Switching" fatigue of jumping between tabs.

## AI IDEs with MCP (Cursor/Windsurf)
Modern code editors (IDEs) like Cursor come with builtin AI that functions similarly to MCP.
*   **For Manual Testers**: You don't need to code to use an IDE. You can use it as a powerful text editor where you can "Chat with your Codebase" (or documentation).

---

## Agent Customization Files — Teaching AI Your Rules

As AI agents become persistent team members rather than one-off chat tools, we need a way to teach them *how we work* — our conventions, quality standards, domain knowledge, and tool constraints. This is done through **agent customization files**.

These are plain-text Markdown files that live in your project repository. AI tools like **GitHub Copilot**, **Cursor**, **Windsurf**, and **Claude Projects** read these files automatically and follow them without you needing to repeat instructions in every prompt.

**The analogy**: Rather than briefing a new contractor every morning ("our format is XYZ, our rules are ABC..."), you hand them an onboarding document once. They read it and follow it from that point on.

---

### Types of Customization Files

| File | Where It Lives | What It Does |
|------|---------------|-------------|
| `copilot-instructions.md` | `.github/` folder | Global instructions for GitHub Copilot across the entire repo |
| `.instructions.md` | Any folder or `.github/instructions/` | Scoped instructions that apply to specific file types or folders (using `applyTo`) |
| `.prompt.md` | `.github/prompts/` | A reusable, shareable prompt invoked by name in Copilot Chat |
| `SKILL.md` | Project root or skills folder | Defines a specialized agent skill — a focused domain + workflow package |
| `AGENTS.md` | Project root | Instructions for fully autonomous AI agents (Codex, Devin, etc.) |

---

### `copilot-instructions.md` — Your Team's Quality Standard

This is the most immediately useful file for QA teams. Every instruction here applies to every Copilot interaction in the repository — automatically.

**Example: QA Team `copilot-instructions.md`**
```markdown
# QA Team — GitHub Copilot Instructions

## Role
You are a Senior QA Engineer working on the VibeShop E-Commerce platform.

## Test Case Standards
- Always generate test cases in Markdown tables:
  ID | Scenario | Precondition | Steps | Expected Result | Type
- Every feature must have: at least 1 happy path, 3 negative scenarios, 2 boundary value tests
- Test IDs follow the format: TC_[MODULE]_[NNN] (e.g., TC_LOGIN_001)

## Domain Rules
- This application handles payment data. Never use real card numbers in test data.
- The application supports 5 locales: en-US, en-GB, fr-FR, de-DE, ja-JP.
  Flag locale-specific edge cases.
- User roles: Guest, Registered, Premium, Admin.
  Always consider all 4 roles for permission-sensitive features.

## Bug Report Standards
- Title format: [Module] [Action] [Symptom]
  e.g., "Cart: Add item fails when user is not logged in"
- Always include: Environment (browser + OS + version), Severity, Steps, Expected, Actual

## HITL Reminder
After every generated artefact, add:
"⚠️ Human Review: Check these 3 items before using this output."
```

**Impact**: Every time any team member opens Copilot in this repo and asks for test cases, it follows these rules *automatically* — no repeated setup needed.

---

### `.instructions.md` — Scoped Instructions with `applyTo`

Instructions can be scoped to specific file types or folders using the `applyTo` front-matter. Different modules or artifact types get different rules.

**Example — applies only when editing Gherkin files**:
```yaml
---
applyTo: "**/*.feature"
---
Always use Scenario Outlines with Examples tables for data-driven scenarios.
Never use 'And' as the first step keyword — always start with Given/When/Then.
Feature names must be business-language, not technical jargon.
Tag all security-sensitive scenarios with @security.
```

**Example — applies to this documentation folder**:
```yaml
---
applyTo: "docs/mtai/**"
---
You are the author of the AI-Native Manual Testing Masterclass.
All content must be practical, example-driven, and include analogies.
End each major section with either an analogy, a hands-on exercise, or an AI prompt template.
```

---

### `.prompt.md` — Reusable Shared Prompts

Instead of every team member crafting the same prompt from memory, define it once. Any team member can invoke it by name in Copilot Chat with `/prompt-name`.

**Example: `.github/prompts/generate-test-suite.prompt.md`**
```markdown
---
mode: agent
tools: [filesystem, jira]
description: Generate a complete test suite for a user story
---

# Generate Test Suite

Read the user story from: $STORY_FILE

Generate a complete test suite including:
- Happy path scenarios
- Negative scenarios (invalid inputs, missing fields, wrong data types)
- Boundary value tests
- Edge cases (concurrency, timeouts, maximum input lengths)
- Security-relevant scenarios (injection, unauthorized access)

Format as Markdown table:
ID | Scenario | Precondition | Steps | Expected Result | Type

After generating, append a HITL Review Checklist with 5 items specific to this feature.
```

**Usage**: Type `/generate-test-suite` in Copilot Chat. Copilot executes the full prompt. No copy-paste needed ever again.

---

### `SKILL.md` — Packaging Domain Expertise as a Reusable Agent Skill

A `SKILL.md` file packages an entire domain of expertise and workflow into a single, invocable agent skill. It is the difference between a general-purpose AI and an AI that knows *your* domain, *your* standards, and *your* process.

**What makes a good `SKILL.md`**:
*   **Domain**: What is this skill for? What tasks does it handle?
*   **Workflow**: The exact steps the agent follows, in order.
*   **Tool permissions**: Which MCP tools this skill may use.
*   **Output standards**: Exact format for every output type.
*   **Guardrails**: What this skill must NOT do (as important as what it should do).

**Example: `skills/qa-test-design.skill.md`**
```markdown
# Skill: QA Test Design

## Domain
Generating complete, standards-compliant test suites from user stories and
acceptance criteria for the VibeShop E-Commerce platform.

## When to Invoke
Use this skill when asked to:
- Generate test cases, test scenarios, or test suites
- Convert acceptance criteria to Gherkin feature files
- Create a test plan or test strategy document
- Build a requirements traceability matrix (RTM)

## Workflow
1. Read the user story / acceptance criteria (from file or user input)
2. Identify: entities, user roles, actions, conditions, data, edge cases
3. Classify scenarios: Happy Path | Negative | Boundary | Security | Performance
4. Generate test suite in standard table format
5. Generate Gherkin feature file from the test suite
6. Append HITL Review Checklist (5 items specific to this feature)

## Tools Allowed
- filesystem: read requirement files, write output files
- jira: read story details, create test-related sub-tasks

## Output Standards
### Test Case Table
| TC_ID | Scenario | Precondition | Steps | Expected Result | Type | Severity |

### Gherkin
Feature → Background → Scenario / Scenario Outline with Examples tables

## Guardrails
- Do NOT write code or automation scripts
- Do NOT use real PII in any generated test data
- Do NOT generate test cases for features not mentioned in the provided requirement
- Always flag ambiguous requirements rather than making assumptions about them
- Always note when a scenario requires human judgment to validate (UX, domain logic)
```

---

### `AGENTS.md` — Rules for Autonomous Agents

For teams using fully autonomous AI agents (GitHub Copilot Agent mode, OpenAI Codex, Devin), `AGENTS.md` defines the rules of engagement — particularly around safety and human approval gates.

**A QA-focused `AGENTS.md` section might include**:
*   Which test files the agent may create or modify autonomously.
*   Required quality gates before marking a task complete (e.g., "Must generate at least 3 negative scenarios per story").
*   Commands the agent must NOT run (e.g., do not delete test data files, do not push directly to `main`).
*   HITL approval gates: which actions require explicit human approval before execution.

---

### Customization Files — Quick Reference for QA Teams

| File | Scope | Best Used For |
|------|-------|---------------|
| `copilot-instructions.md` | Entire repo | Team-wide QA standards, domain rules, output formats |
| `.instructions.md` | Specific files/folders | Module-specific conventions (different rules for API tests vs UI tests) |
| `.prompt.md` | On-demand, reusable | Standardising common tasks: test generation, bug reporting, RTM creation |
| `SKILL.md` | Agent-invocable skill | Packaging a complete QA workflow as a self-contained, reusable agent capability |
| `AGENTS.md` | Autonomous agent scope | Safety rules and guardrails for fully autonomous AI agents |

**The Compound Effect**: When `copilot-instructions.md` sets your standards, `.instructions.md` scopes them to modules, `.prompt.md` automates your most common tasks, and `SKILL.md` packages your domain expertise — you have built an **AI QA team member** that follows your rules from day one, in every session, without being told twice.

---

## E2E AI-SDLC Workflow: The "Magic" Loop
Imagine this workflow, which is now possible:
1.  **Input**: You drop a screenshot of a mockup and a PDF requirement into Claude.
2.  **Process**:
    *   Claude reads the files (Filesystem MCP).
    *   Generates a Test Strategy (Processing).
    *   Creates a generic Test Plan file (Filesystem MCP).
    *   Logs the Test Cases directly into Jira (Jira MCP).
    *   Creates a traceability matrix in Excel (Excel MCP).
3.  **Human Role**: You oversee this orchestration, approving each step. "Yes, create the file. Yes, log those tickets."

**The Transformation**: You stop being a *data entry clerk* and start being a *manager of intelligent agents*.
