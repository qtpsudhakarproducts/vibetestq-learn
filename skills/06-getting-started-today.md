# Chapter 6 — Getting Started Today
### Your First 30 Minutes

---

> *"The engineers who get value from AI tools in the first week  
> are the ones who act on Day 1, not the ones who plan perfectly."*

---

This chapter has no theory. It is a step-by-step action guide for your role.

Pick your path. Follow the steps. By the end you will have something working.

---

## For the Manual Tester — 30 Minutes

### Step 1 — Write Your First Prompt (5 minutes)

Open Claude. Pick one user story from your current sprint. Use this prompt exactly, filling in the brackets:

```
You are a senior QA engineer.
Application: [your application name and one sentence about what it does]
Feature: [feature name from the story]

Write test cases covering:
- Happy path (valid inputs, flow completes)
- Negative (invalid inputs, error states)
- Boundary (empty fields, min/max values)
- Edge case (unusual but valid scenarios)

Format: Gherkin (Given/When/Then)
Scenario titles: [outcome] when [condition]
Then steps: exact observable result only
Rules: no real credentials, flag missing info with ⚠
```

Look at the output. Note what is right. Note what does not match your team's format.

### Step 2 — Add Context and Compare (5 minutes)

Start a new session. This time, paste one example test case from your team before the prompt:

```
Here is one test case in our team's format:
[paste one real test case your team has written]

Now write test cases for this feature using the same format:
[paste the same story as Step 1]
```

Compare the output to Step 1. It should be closer to your team's format. This is context engineering in action — one example changed the output without changing the prompt.

### Step 3 — Write Your First Skill (15 minutes)

Create a file called `test-case-writing-SKILL.md`. Start with this minimal version:

```yaml
---
name: test-case-writing
description: >
  Write test cases for any feature or user story.
  Use when: writing, generating, or reviewing test cases or scenarios.
  Always use this skill before writing test cases.
---

# Test Case Writing

## The Critical Rule
Every test case must have exactly one unambiguous pass/fail condition.

## Our Format
[paste the format section from your team's example test case]

## Coverage Required
- Happy path (1-2 scenarios)
- Negative (2-3 scenarios)
- Boundary (1-2 per boundary condition)
- Edge case (1-2 scenarios)

## Do Not
- Do not use real credentials — use [descriptive placeholders]
- Do not write vague Then steps
- Do not skip boundary tests for undefined limits — write and flag with ⚠
```

### Step 4 — Test It in a Fresh Session (5 minutes)

Open a completely new session. Do not paste anything. Type only:

```
Write test cases for [feature name from your story].
```

Check the output against your standards. If something is wrong, identify which rule was missing from the skill and add it. Test again.

### What Success Looks Like After 30 Minutes

You have a working skill that produces test cases in your team's format without you explaining it every session. It may not be perfect yet — that is normal. By the end of the week it will be.

---

## For the Automation Engineer — 30 Minutes

### Step 1 — Run the Session Start Template (5 minutes)

Open Claude. Paste this at the start of a new session, filled in for your project:

```
PROJECT CONTEXT — [Project Name]

Framework: Playwright + TypeScript

Project structure:
- src/pages/    — page objects
- src/helpers/  — BasePage, helpers
- src/tests/    — spec files
- src/fixtures/ — fixture definitions

Core conventions:
- All page objects extend BasePage
- Locators: getByRole, getByLabel, getByPlaceholder only
- No CSS selectors. No assertions in page objects.
- Custom fixtures inject page objects into tests
- Tags: @smoke (happy path), @regression (all others)

Today's task: write a page object for [pick a page in your project]

Reference files:
[paste your BasePage.ts]
[paste one existing page object]
```

Ask: `Write the page object for [page name]. Elements: [list the elements].`

Look at the output. It should follow your project's conventions exactly.

### Step 2 — Compare With vs Without Context (5 minutes)

Open a new session with no context. Ask the identical request:

`Write a page object for [same page name]. Elements: [same elements].`

Compare the two outputs side by side. The difference shows you exactly what the session start template adds. That difference is what a skill will deliver automatically, without the manual paste.

### Step 3 — Write Your First Project Skill (15 minutes)

Create `playwright-pom-SKILL.md` with your project's conventions:

```yaml
---
name: [project-name]-pom
description: >
  Create or extend Page Object Model classes in the [project name] project.
  Use when: adding a new page object, creating locators, adding page actions,
  extending BasePage, writing page methods.
  Always use this skill before writing any page object for this project.
---

# [Project Name] Page Object Model

## The Critical Rule
Tests must NEVER contain locators. All locator interactions belong in page objects.

## Conventions
- All page objects extend BasePage from [path]
- Locators: getByRole, getByLabel, getByPlaceholder only
- Locators are private readonly class properties
- All locators call .describe('label') after the locator
- No assertions inside page objects
- One public method per user action
- Methods return Promise<void>

## Page Class Template
[paste your BasePage class and one example page object]

## Do Not
- No CSS selectors
- No XPath
- No assertions in page objects
- No locators created in test files
```

### Step 4 — Test It in a Fresh Session (5 minutes)

New session. No context. Type:

`Write a page object for [page name] in the [project name] project. Elements: [list].`

Verify the output matches your standards. Fix any gaps in the skill.

### What Success Looks Like After 30 Minutes

You have a working POM skill that produces correct page objects without the session start ritual. One skill down. The rest of the system (helpers, fixtures, specs, API tests) follows the same pattern — one skill per concern.

---

## For the QA Lead — 30 Minutes

### Step 1 — Identify the Most Violated Convention (5 minutes)

Look at your last 10 PR reviews. What is the most common comment you leave?

Common answers:
- "CSS selectors should be getByRole"
- "Test cases don't have expected results"
- "Missing negative scenarios"
- "Fixture not used — imported page directly"

Pick the single most common one. That is the one you are encoding today.

### Step 2 — Write a Skill That Enforces It (15 minutes)

Write a minimal skill that enforces exactly that one convention. Nothing else. Keep it small.

**Example — most common comment is "tests import page directly instead of using fixture":**

```yaml
---
name: [project]-test-imports
description: >
  Write test files for the [project name] project.
  Use when: creating a new spec file or adding tests to an existing one.
  Always use this skill before writing any test code for this project.
---

# [Project Name] Test Import Rules

## The Critical Rule
Tests must import `test` from the project fixture file, never from @playwright/test.

## Correct Import
```typescript
import { test } from '../fixtures/basetest';     // ✅ correct
```

## Forbidden Import
```typescript
import { test } from '@playwright/test';          // ❌ never
```

If test imports from @playwright/test, no page objects are injected.
The test will fail immediately with "fixture not found" errors.
```

### Step 3 — Place It at Repository Level (5 minutes)

Commit the skill file to the repository:

```
your-project/
  └── .github/
      └── copilot-instructions.md   ← add the rule here for Copilot
  └── .cursor/
      └── rules/
          └── [project]-test-imports.mdc   ← add here for Cursor
```

Add the same rule to whichever tools your team uses.

### Step 4 — Test With a Simulated New-Engineer Session (5 minutes)

Open a new session. Do not add any context — simulate what a new engineer would experience.

Type: `Write a test for the Login feature in the [project name] project.`

Check whether the import comes from the project fixture or from @playwright/test.

If it comes from the fixture: the skill is working. Commit it.
If it comes from @playwright/test: the skill description needs improving. Make it more specific.

### What Success Looks Like After 30 Minutes

You have one convention encoded in the repository. Every engineer working in that project will have it enforced automatically. The most common PR comment disappears. Next week you add another.

---

## Common First-Session Mistakes

| Mistake | What It Looks Like | Fix |
|---------|-------------------|-----|
| Skill does not trigger | Output ignores conventions on first try | Check the description — add more trigger phrases |
| Output is still wrong after skill loads | Conventions not explicit enough | Add ✅/❌ examples to the rules |
| Skill is too long | Output quality inconsistent | Keep body under 500 lines, move detail to references/ |
| Skill applies to everything | Wrong conventions appear on unrelated requests | Narrow the description with specific project name and task types |
| Giving up after one session | First session has 2-3 violations | Normal — fix the violations, test again |

---

## The 7-Day Plan

**Day 1:** Follow the 30-minute guide for your role. Get one skill working.

**Day 2:** Use the skill for real work. Note every output that violates a convention. At end of day: add one rule per violation.

**Day 3:** Test the updated skill in a fresh session. Fix any remaining gaps.

**Day 4:** Expand the skill with one new section (coverage requirements, output format, or a Do Not rule you identified from Day 2 work).

**Day 5:** Commit the skill to the repository if it is project-level.

**Day 6:** Ask one colleague to use it without explanation. Watch where they struggle. Those are your skill's gaps.

**Day 7:** Fix the gaps your colleague found. The skill is now good enough for the whole team.

---

→ [Chapter 7 — Skills for Manual Testers](07-skills-manual-testing.md)

---

*← [Chapter 5](05-skill-deployment.md) | [Chapter 7 →](07-skills-manual-testing.md)*
