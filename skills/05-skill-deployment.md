# Chapter 5 — Skill Deployment
### Where Skills Live and How They Are Found

---

## What You Will Learn

- Why skill location matters — wrong place means nothing works or everything breaks
- The four levels of skill scope
- How each major AI tool finds and loads skills
- How to set up skills in Claude, Cursor, Copilot, and VS Code
- How to put skills in a repository so the whole team gets them automatically
- How to handle skill conflicts
- MCP-connected skills — skills that reference live data

---

## 5.1 Why Location Matters

A skill in the wrong place either does nothing or interferes with everything.

A skill that enforces OrangeHRM-specific page object conventions placed at global level will try to apply those conventions to every project you work on — including projects that have nothing to do with OrangeHRM.

A skill that encodes your team's test case format placed only on your machine will not help the rest of the team. New engineers will not get it automatically on clone.

Understanding where to put a skill is as important as knowing how to write one.

---

## 5.2 The Four Levels of Skill Scope

```
┌─────────────────────────────────────────────────────────────┐
│  GLOBAL SKILLS                                              │
│  Apply to all sessions, all projects, all tools             │
│  Who sets them: you personally                              │
│  Use for: your working style, cross-project preferences     │
│  Examples:                                                  │
│    - "I prefer Gherkin format for all test cases"           │
│    - "Always flag missing acceptance criteria"              │
│    - "My seniority level is senior QA — calibrate depth"    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  IDE / WORKSPACE SKILLS                                     │
│  Apply within one editor workspace on your machine          │
│  Who sets them: you personally                              │
│  Use for: personal project conventions, local overrides     │
│  Examples:                                                  │
│    - Your personal Playwright settings for one project      │
│    - Temporary overrides during a branch experiment         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  REPOSITORY SKILLS                                          │
│  Apply to one codebase, for everyone who works in it        │
│  Who sets them: team lead, checked into version control     │
│  Use for: project standards, framework conventions          │
│  Examples:                                                  │
│    - playwright-pom skill for the OrangeHRM project         │
│    - test-case-writing skill for the team's format          │
│    - API testing conventions for the project                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SHARED / ORGANISATION SKILLS                               │
│  Apply across multiple projects for the whole team          │
│  Who sets them: QA lead or engineering manager              │
│  Use for: company-wide testing standards                    │
│  Examples:                                                  │
│    - Bug severity definitions used across all projects      │
│    - Company test case format standard                      │
│    - Security testing checklist for all features            │
└─────────────────────────────────────────────────────────────┘
```

### The Scope Decision Guide

| Convention Type | Right Scope |
|----------------|-------------|
| Personal style preference | Global |
| Cross-project testing standard | Global or Shared |
| One project's framework conventions | Repository |
| One project's test data patterns | Repository |
| Company-wide bug report format | Shared |
| Company-wide security checklist | Shared |
| Temporary experiment on a branch | IDE / Workspace |

---

## 5.3 How Claude Finds and Loads Skills

Claude checks the skill descriptions against your request before generating a response.

The process in plain language:
1. You type a request
2. Claude scans all available skill descriptions
3. If a description matches your request, the skill body loads into context
4. Claude responds using the skill's instructions

This happens automatically. You do not trigger it manually. The quality of the description determines whether the skill loads on the right requests.

**Where skills live in Claude:**

For personal/global skills: uploaded through Claude.ai settings or project configuration.

For project-level skills in the computer environment: `/mnt/skills/user/[skill-name]/SKILL.md`

The `/mnt/skills/user/` path is where your project-specific skills live. Claude checks this path automatically.

---

## 5.4 How Cursor Finds and Applies Rules

Cursor uses `.mdc` rule files and `.cursor/rules` configuration.

**Global rules (apply to all projects):**
```
~/.cursor/rules/
  └── your-global-rule.mdc
```

**Workspace rules (apply to one project):**
```
your-project/
  └── .cursor/
      └── rules/
          ├── playwright-pom.mdc
          ├── playwright-helpers.mdc
          └── test-patterns.mdc
```

Cursor rule files use the same YAML frontmatter and Markdown body as SKILL.md files. The `description` field works the same way — it is the trigger.

**Setting up a workspace rule in Cursor:**
1. Create `.cursor/rules/` folder in your project root
2. Create a `.mdc` file with the skill content
3. Cursor loads it automatically for that workspace

**Setting up a global rule in Cursor:**
1. Open Cursor Settings → Rules
2. Add global rules that apply to all projects
3. Or create files in `~/.cursor/rules/`

---

## 5.5 How Copilot Uses Instruction Files

GitHub Copilot uses a project instructions file, not individual skill files.

**Project-level instructions:**
```
your-project/
  └── .github/
      └── copilot-instructions.md
```

This file is loaded by Copilot for all requests within the project. It is a single file rather than multiple skill files — you put all your project conventions in one place.

**Example content for a test automation project:**
```markdown
# Copilot Instructions — OrangeHRM Test Automation

This is a Playwright TypeScript test automation project.

## Core Conventions
- Page objects extend BasePage from src/helpers/BasePage.ts
- Locators: getByRole, getByLabel, getByPlaceholder only — no CSS selectors
- No assertions inside page objects
- Custom fixtures inject page objects into tests
- Test tags: @smoke (happy path), @regression (all others)

## File Structure
- src/pages/    — page objects
- src/helpers/  — BasePage, helpers
- src/tests/    — spec files
- src/fixtures/ — fixture definitions

## Output Rules
- No comments unless asked
- No markdown fences around TypeScript
- TypeScript only — no JavaScript
```

**User-level Copilot settings:**
Copilot also supports user-level custom instructions through GitHub settings. These apply across all repositories for your account — the equivalent of global skills.

---

## 5.6 How VS Code Uses Workspace Instructions

VS Code with Copilot supports workspace-level instructions through `.vscode/settings.json` or through the Copilot instructions file.

**Setting up workspace instructions:**
```json
// .vscode/settings.json
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "file": ".github/copilot-instructions.md"
    }
  ]
}
```

This tells VS Code Copilot to load your instructions file for all code generation in this workspace.

---

## 5.7 Repository-Level Skills — The Team Standard

Repository-level skills are the most important category for teams. They are the mechanism that turns personal standards into team standards.

### What to commit

```
your-project/
  └── .cursor/
      └── rules/
          ├── playwright-pom.mdc          ← commit
          ├── playwright-helpers.mdc      ← commit
          ├── playwright-fixtures.mdc     ← commit
          ├── playwright-test-patterns.mdc ← commit
          └── playwright-api-testing.mdc  ← commit
  └── .github/
      └── copilot-instructions.md         ← commit
  └── mnt/skills/user/                    ← commit (for Claude)
      └── [skill folders]
```

**What not to commit:**
- Skills containing real credentials or API keys
- Skills with internal URLs that should not be public
- Personal style preferences that only apply to one engineer

### How a new team member gets the skills automatically

When a new engineer clones the repository:

1. The `.cursor/rules/` files are already there — Cursor loads them immediately
2. The `.github/copilot-instructions.md` is already there — Copilot uses it immediately
3. The `/mnt/skills/user/` folder is already there — Claude loads the skills

Zero setup. Zero onboarding. The engineer starts their first session with all standards already loaded.

### Recommended folder structure for a team project

```
your-project/
  ├── src/
  ├── tests/
  ├── .github/
  │   └── copilot-instructions.md
  ├── .cursor/
  │   └── rules/
  │       ├── [skill-name].mdc
  │       └── [skill-name].mdc
  └── skills/                         ← for Claude
      └── [skill-name]/
          ├── SKILL.md
          └── references/
              └── [reference files]
```

---

## 5.8 Skill Conflicts

A conflict happens when two skills give contradictory instructions — or when a global skill and a project skill disagree.

**Example conflict:**
- Global skill says: "Use table format for all test cases"
- Project skill says: "Use Gherkin format for all test cases"

When both load, the model picks one at random. Output becomes unpredictable.

### Which level wins

In general: more specific wins over less specific.

Project-level instructions override global instructions for that project. A project skill that says "use Gherkin" takes precedence over a global skill that says "use tables" when you are working in that project.

But this depends on the tool. Cursor explicitly states that workspace rules take precedence over global rules. Copilot project instructions override user-level instructions.

### How to avoid conflicts by design

1. Put truly universal preferences at global level (seniority, language preference)
2. Put project-specific conventions at project level only
3. Do not duplicate rules across levels — if a rule is at project level, remove it from global
4. When in doubt: put it at project level, not global

### How to resolve an existing conflict

When you notice the model picking randomly between two behaviours:

1. Identify which two skills are in conflict
2. Decide which is correct for this context
3. Remove or update the incorrect rule
4. Add an explicit override if needed: "For this project, [rule] overrides any global setting"

---

## 5.9 MCP-Connected Skills

MCP (Model Context Protocol) allows skills to reference live data from connected tools rather than relying only on what is written in the skill file.

Without MCP: a skill for exploratory testing writes generic charters based on the feature description you type.

With MCP + Jira connected: a skill for exploratory testing reads the actual open bugs for this feature from Jira and writes charters that focus on the real risk areas already known to your team.

**What this looks like in practice:**

```yaml
---
name: exploratory-charter-with-jira
description: >
  Write exploratory test charters for a feature.
  Use when: the user asks for exploratory charters, session-based testing plans,
  or risk-based test focus areas for any feature.
  Requires Jira connection for live bug data.
---

# Exploratory Test Charter

## What This Skill Does
This skill generates exploratory test charters informed by live Jira data.
Before writing charters, it reads open bugs and recent failures for the feature
from Jira to focus charters on real risk areas.

## Workflow
1. Use the Jira MCP tool to fetch open bugs for the feature being tested
2. Use the Jira MCP tool to fetch recently closed bugs for context
3. Identify the top 3 risk areas based on bug history
4. Write charters that focus on those risk areas
5. Add one charter for areas with no bug history (unknown risk)
```

**Privacy considerations for MCP-connected skills:**

When a skill pulls data from Jira, Confluence, or Gmail through MCP, that data goes into the context window and is processed by the AI model. Before connecting live tools to skills:

- Check what data the MCP tool can access
- Ensure no PII or confidential client data is in the Jira tickets being pulled
- Use project-level filters in the skill to limit what data is fetched
- Never connect production data sources to skills that will be used in team environments without reviewing what data is accessible

Chapter 8 covers MCP-connected skills for exploratory testing in full detail.

---

## 5.10 The Scope Decision — A Summary

Before placing any skill, ask three questions:

**1. Who should this apply to?**
- Just me → global or IDE level
- Everyone on this project → repository level
- Everyone across all projects → shared/organisation level

**2. When should this NOT apply?**
- Project-specific rules should not apply outside the project → repository level, not global
- Experimental rules should not apply to main work → IDE level, not repository

**3. What happens when a new engineer joins?**
- If they should get this automatically → repository level
- If it is a personal preference → global or IDE level only

---

## Chapter Summary

| Level | Scope | Location | Who Benefits |
|-------|-------|----------|-------------|
| Global | All sessions, all projects | Claude settings, ~/.cursor/rules | You personally |
| IDE/Workspace | One workspace on your machine | .cursor/rules (local) | You in that workspace |
| Repository | One codebase | Committed to the repo | Whole team automatically |
| Shared/Org | Multiple projects | Shared repo, linked in | Whole organisation |

---

## Three Exercises to Try Today

1. Identify one skill you have written or plan to write. Decide which scope it belongs at using the three questions in Section 5.10.

2. Open your current project repository. Check whether a `.github/copilot-instructions.md` or `.cursor/rules/` exists. If not, create a minimal one with your top three conventions.

3. Think of the most common convention violation in your team's codebase. Would a repository-level skill have prevented it? Write a one-paragraph rule that would.

---

→ [Chapter 6 — Getting Started Today](06-getting-started-today.md)

---

*← [Chapter 4](04-skill-md.md) | [Chapter 6 →](06-getting-started-today.md)*
