# Chapter 14 — Quick Reference
### Every Template, Checklist, and Pattern — Organised by Role

---

> No explanations. Everything here is ready to use.  
> For the reasoning behind any item, see the relevant chapter.

---

## Contents

- [Section 1 — For Manual Testers](#section-1--for-manual-testers)
- [Section 2 — For Automation Engineers](#section-2--for-automation-engineers)
- [Section 3 — For QA Leads](#section-3--for-qa-leads)
- [Section 4 — Skill Deployment](#section-4--skill-deployment)
- [Section 5 — Troubleshooting](#section-5--troubleshooting)
- [Section 6 — The Priority Order](#section-6--the-priority-order)

---

## Section 1 — For Manual Testers

### Session Start Template (Non-Technical)

```
PROJECT CONTEXT — [Project Name]

Application: [name and one-sentence description]
My role: QA Engineer
Team testing format: [Gherkin / table / numbered steps]

Conventions:
- Scenario titles: [outcome] when [condition]
- Then steps: exact observable result — no vague language
- Coverage: happy path, negative, boundary, edge case
- Placeholders: use [valid username] not real credentials

Today I am working on: [describe today's task]

Reference: [paste one example test case in your team's format]
```

---

### Prompt Pattern 1 — Write Test Cases

```
You are a senior QA engineer.
Application: [name and one-sentence description]
Feature: [feature name and what it does]

Write test cases covering:
- Happy path (valid inputs, flow completes)
- Negative (invalid inputs, error states, validation)
- Boundary (empty fields, min/max values, character limits)
- Edge case (unusual but valid scenarios)

Format: Gherkin (Given/When/Then)
Scenario titles: [outcome] when [condition]
Then steps: exact observable result only
Rules: no real credentials — use placeholders. Flag missing info with ⚠
```

### Prompt Pattern 2 — Write a Bug Report

```
You are a senior QA engineer.
Application: [name]
Environment: [browser, OS, build version]

Write a bug report for this defect:
[describe what happened]

Format:
- Title: [action] causes [result] on [page/feature]
- Severity: Critical / High / Medium / Low
- Steps to reproduce: numbered, one action per step
- Expected result: one sentence
- Actual result: one sentence
- Notes: [anything helpful for the developer]
```

### Prompt Pattern 3 — Review a Story for Testability

```
You are a senior QA engineer.
Review this user story for testability issues:
[paste story]

Check for:
1. Missing acceptance criteria
2. Ambiguous requirements
3. Untestable statements
4. Missing edge cases

Format: numbered list. Quote → problem → suggestion. Issues only.
```

### Prompt Pattern 4 — Write Exploratory Charters

```
You are a senior QA engineer.
Application: [name]
Feature: [feature name and description]
Session duration: [60-90 minutes]
Risk areas: [what is most likely to break]

Write 3 exploratory charters.
Format per charter:
  Explore: [area]
  With: [data, tools, conditions]
  To discover: [risk or question]
  Time box: [minutes]
```

### Prompt Pattern 5 — Estimate Sprint Testing Effort

```
You are a senior QA engineer.
Team: [number of QA], [manual/automated], [web/mobile/API]

Estimate testing effort for each story:
1. [story title — one sentence]
2. [story title — one sentence]
3. [story title — one sentence]

Format: table — Story | Testing scope | Hours | Assumptions
```

---

### Skill Template for Manual Testers

```yaml
---
name: [task-name]
description: >
  [What it does]. Use when: [list every trigger phrase].
  Always use this skill when [task type].
---

# [Skill Title]

## The Critical Rule
[Single most important constraint — one sentence]

## Coverage / Format Requirements
[What complete output looks like]

## Title / Naming Rules
[How to name things — good and bad example]

## Output Format
[Exact structure the output should follow]

## Do Not
- Do not [most common violation]
- Do not [second most common violation]
- Do not [third most common violation]
```

### Manual Tester Daily Checklist

```
□ Session start template pasted (or skill loaded automatically)
□ One reference example pasted (test case, bug report, or charter)
□ Task stated specifically — not "work on testing" but the exact task
□ Output reviewed before use — not accepted blindly
□ Violations corrected before moving to next request
□ 10-turn reminder added if session is long
```

---

## Section 2 — For Automation Engineers

### Session Start Template (Technical)

```
PROJECT CONTEXT — [Project Name]

Framework: Playwright + TypeScript

Project structure:
- src/pages/    — page objects
- src/helpers/  — BasePage, WebHelpers, AssertHelpers
- src/tests/    — spec files
- src/fixtures/ — fixture definitions
- src/data/     — test data

Core conventions:
- All page objects extend BasePage
- Locators: getByRole, getByLabel, getByPlaceholder only
- No CSS selectors. No XPath.
- No assertions inside page objects
- Custom fixtures inject page objects into tests
- Tags: @smoke (happy path), @regression (all others)

Today's task: [describe exactly what you are building]

Reference files:
[paste BasePage.ts]
[paste nearest existing page object]
[paste one existing spec]
```

---

### Prompt Pattern 1 — Generate a Page Object

```
You are a senior QA automation engineer.
Project: [name], Playwright + TypeScript.

Conventions:
- Page objects extend BasePage from [path]
- Locators: getByRole, getByLabel, getByPlaceholder only
- No CSS selectors. No assertions in page objects.
- Fixtures inject page objects into tests.

Task: Write a page object for [page name].
Elements:
- [element]: [type] — [label/role/placeholder text]
Methods: [list each method and what it does]

Format: TypeScript class only. No explanation. No markdown fence.
Rules: No CSS selectors. No assertions. No raw @playwright/test imports.
```

### Prompt Pattern 2 — Generate a Test Spec

```
You are a senior QA automation engineer.
Project: [name], Playwright + TypeScript.

Reference spec (follow this structure exactly):
[paste one existing spec]

Task: Write a spec for [feature name].
Test cases:
1. [happy path]
2. [negative case]
3. [edge case]

Rules:
- Import test from project fixture — not from @playwright/test
- Tag happy path @smoke, all others @regression
- No raw page imports — fixtures only
```

### Prompt Pattern 3 — Debug a Failing Test

```
You are a senior QA automation engineer.

This test is failing.
Error: [paste exact error]
Test: [paste test]
Page object: [paste page object]

Diagnose:
1. What is causing this error
2. What the fix is and why

Then show corrected code only.
```

### Prompt Pattern 4 — Generate Test Data

```
You are a senior QA automation engineer.
Feature: [form or feature name]

Fields:
- [field]: [type, constraints]

Generate:
- 3 valid data sets (happy path)
- 2 invalid data sets (boundary, type violation)
- 1 edge case (null, empty, max-length)

Format: TypeScript object array named testData. No explanation.
```

### Prompt Pattern 5 — Code Review for Standards

```
You are a senior QA automation engineer.

Review for violations of our standards:
1. Locators: getByRole/getByLabel/getByPlaceholder only
2. No assertions in page objects
3. All page objects extend BasePage
4. Methods return Promise<void>
5. No page.locator() in test files

Code: [paste code]

Violations only. For each: line → rule → correction.
```

---

### Five-Skill System File Structure

```
project-root/
  skills/
    playwright-pom/
      SKILL.md
      references/
        base-page.md
        example-page-object.md
    playwright-helpers/
      SKILL.md
    playwright-fixtures/
      SKILL.md
      references/
        fixtures.md
    playwright-test-patterns/
      SKILL.md
      references/
        example-spec.md
    playwright-api-testing/
      SKILL.md
  .github/
    copilot-instructions.md
  .cursor/
    rules/
      playwright-pom.mdc
      playwright-helpers.mdc
      playwright-fixtures.mdc
      playwright-test-patterns.mdc
      playwright-api-testing.mdc
```

### Automation Engineer Daily Checklist

```
□ Skill loaded (or session start template pasted)
□ BasePage and example POM in context for page object work
□ Fixture definition in context for spec work
□ Exact error + test + page object in context for debugging
□ Output compiled and run before accepting
□ All locators use getByRole/getByLabel — no CSS selectors
□ Fixture import from project basetest — not @playwright/test
□ 10-turn reminder added for sessions over 20 turns
```

---

## Section 3 — For QA Leads

### Team Rollout Checklist

```
Phase 1 — Proof of Concept
  □ Most violated convention identified (from PR review analysis)
  □ One skill written for that convention
  □ One volunteer engineer using it for one sprint
  □ PR comments tracked: before vs after

Phase 2 — Repository
  □ Skill committed to repository
  □ Second engineer (less experienced) using it
  □ Output reviewed without explaining conventions first
  □ Gaps identified and skill updated

Phase 3 — Full System
  □ One skill added per sprint for remaining task types
  □ Each skill has named owner before committing
  □ All skills tested with fresh session test

Phase 4 — Maintenance
  □ Quarterly review on team calendar
  □ Convention change process agreed (change → update skill → test)
  □ New engineer onboarding updated: "skills handle conventions"
```

### Skill Ownership Template

| Skill | Owner | Last Reviewed | Next Review |
|-------|-------|--------------|-------------|
| playwright-pom | [name] | [date] | [date] |
| playwright-helpers | [name] | [date] | [date] |
| playwright-fixtures | [name] | [date] | [date] |
| playwright-test-patterns | [name] | [date] | [date] |
| playwright-api-testing | [name] | [date] | [date] |
| test-case-writing | [name] | [date] | [date] |

### Metrics to Track

| Metric | How to Measure | Target After 1 Quarter |
|--------|---------------|----------------------|
| Convention PR comments | Count per week | Down 50% |
| Time to first test draft | Measure per story in sprint | Down 30% |
| New engineer first-PR quality | Count convention violations | Down 70% |
| Skill-triggered sessions | Ask engineers | Up — team using skills consistently |

---

## Section 4 — Skill Deployment

### Scope Decision Guide

| Convention Type | Scope |
|----------------|-------|
| Personal style preference | Global |
| Cross-project testing standard | Global or Shared |
| One project's framework conventions | Repository |
| Company-wide bug report format | Shared / Organisation |
| Temporary experiment | IDE / Workspace only |

### IDE Setup Checklist

**Claude (claude.ai):**
```
□ Skills folder structure created: /mnt/skills/user/[skill-name]/SKILL.md
□ Description includes all trigger phrases
□ Fresh session test passed
```

**Cursor:**
```
□ .cursor/rules/ folder created in project root
□ Skill content saved as .mdc files
□ .cursor folder committed to repository (for team skills)
□ Workspace rules tested with new Cursor window
```

**GitHub Copilot:**
```
□ .github/copilot-instructions.md created
□ Top 10 project conventions documented in the file
□ File committed to repository
□ Copilot Chat tested with @workspace reference
```

**VS Code + Copilot:**
```
□ .vscode/settings.json points to copilot-instructions.md
□ Workspace settings committed to repository
```

### Repository Skill Folder Structure

```
project-root/
  .github/
    copilot-instructions.md         ← Copilot instructions
  .cursor/
    rules/
      [skill-name].mdc              ← Cursor rules
  skills/                           ← Claude skills
    [skill-name]/
      SKILL.md
      references/
        [reference files]
```

---

## Section 5 — Troubleshooting

### Skill Not Triggering

```
1. Read your request and your description side by side
2. Find the phrase in your request not in the description
3. Add it to "Triggers include:" in the description
4. Test with a fresh session using the exact phrase that failed
```

### Output Ignoring Conventions

```
1. Identify the specific violated convention
2. Check: is the rule in the skill?
   No  → add it
   Yes → check: is it in the Critical Rule section?
         No  → move it there
         Yes → check: does it have a ✅/❌ example?
               No  → add concrete example
               Yes → start fresh session, test again
```

### Session Drift (Output Degrades Over Time)

```
1. Add 10-turn reminder immediately:
   "Reminder: [project], [framework], [key conventions in one line]"
2. If drift continues after reminder: start a new session
3. Prevention: add reminder every 10 turns without waiting for drift
```

### Skill Conflicts (Random Output Between Two Patterns)

```
1. List all skills currently loaded (global + project)
2. Find the rule that appears in more than one skill
3. Remove it from the less specific level (usually global)
4. Keep it only in the most specific level (usually project)
5. Test with a fresh session
```

---

## Section 6 — The Priority Order

### Before Every AI Session

```
□ Do I have a skill for this task?
    Yes → type the task, skill loads automatically
    No  → paste the session start template for my role first

□ Is the context correct?
    Only relevant files pasted
    Today's specific task stated
    Not the entire project — just what is needed today

□ Is my prompt clear?
    Role + Context + Task + Format + Rules

□ Am I ready to correct?
    First violation → correct immediately before asking for next thing
```

### Before Publishing a Skill

```
□ Description covers every trigger phrase
□ Critical rule is at the top and stated clearly
□ All conventions have ✅/❌ examples where ambiguous
□ Output format is specified exactly
□ Do Not section covers the most common violations
□ Fresh session test passed with no violations
□ Edge case test passed
□ Named owner assigned
```

### Before Updating a Skill

```
□ Identified the specific gap causing the problem
□ Checked: is this a targeted fix or does the skill need a rethink?
□ Updated the rule with a concrete example if needed
□ Tested with fresh session after update
□ Updated changelog in skill file
□ Committed with meaningful git message
```

---

*← [Chapter 13](13-what-goes-wrong.md) | [Index](00-index.md)*

---

*Version 1.0 — March 2026*
