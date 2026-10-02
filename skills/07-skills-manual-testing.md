# Chapter 7 — Skills for Manual Testers
### No Code. No Framework. Just Better Testing Work.

---

## What You Will Learn

By the end of this chapter you will have five working skills — one for each task manual testers repeat most. Each skill is built the same way as Chapter 4: starting from no skill, adding sections, watching what changes.

No TypeScript. No Playwright. No framework knowledge required.

---

## 7.1 What Manual Testers Gain From Skills

Manual testers repeat the same five tasks every sprint:
- Writing test cases for new stories
- Writing bug reports for defects found
- Reviewing user stories for testability
- Writing exploratory test charters
- Planning and estimating sprint testing effort

Each task has a format. Each format has rules. Each set of rules lives in someone's head — usually a senior tester or QA lead — and is inconsistently applied across the team.

A skill encodes those rules once. After that, every test case follows the format. Every bug report has the required fields. Every story review flags the same categories of issue. Consistency stops being a person and becomes a file.

---

## 7.2 Skill 1 — Test Case Writing

*(The complete skill was built in Chapter 4. Here we focus on adapting it for your team.)*

The test-case-writing skill from Chapter 4 is a strong starting point. The part you need to customise is the format section — your team's specific format replaces the generic Gherkin template.

**How to adapt it:**

1. Take one test case your team has written that everyone agrees is good
2. Paste it into the Format section of the skill as the canonical example
3. Write three title examples from your team's actual test cases
4. Write three Then step examples — good and bad — from real cases

**Before the skill:**
```
Test Case: Login test
Steps: Open browser, go to app, enter username, enter password, click login
Expected: Works
```
Vague title. Combined steps. No expected result. This gets written every sprint.

**After the skill:**
```gherkin
Scenario: User is redirected to Dashboard when valid credentials are entered
  Given the user is on the Login page
  When  the user enters [valid username] and [valid password] and clicks Login
  Then  the Dashboard page is displayed with the user's name in the navigation bar
```
Specific title. Single action per step. Observable expected result.

**The key rules that produce this change:**
- Title rule: [outcome] when [condition]
- When rule: one action only — split if two
- Then rule: exact observable result — no vague language

---

## 7.3 Skill 2 — Bug Reporting

**Step 0 — No skill:**

```
Bug: Login broken
Steps: Login doesn't work
Expected: Should work
```

One developer gets this and has no idea what to do with it.

**Step 1 — Add frontmatter:**

```yaml
---
name: bug-reporting
description: >
  Write bug reports for defects found during testing.
  Use when: reporting a bug, writing a defect, logging an issue,
  creating a bug report, documenting a defect found during testing.
  Always use this skill when writing bug reports.
---
```

**Step 2 — Add the critical rule:**

```markdown
## The Critical Rule

A bug report must be reproducible by a developer who has never seen the bug.

If a developer reads the report and cannot reproduce the defect in under 5 minutes,
the report has failed its purpose.
```

Output now includes steps. But they are still vague and the title is still unclear.

**Step 3 — Add the title rule:**

```markdown
## Title Rule

Format: [Action] causes [result] on [page/feature]

Good: "Clicking Save with empty Name field causes page to freeze on Add Employee form"
Bad:  "Save button broken"
Bad:  "Bug in employee form"

The title must tell a developer what to click and what goes wrong.
A developer reading only the title should know where to look.
```

Output now has a specific title. But steps are still combined and severity is missing.

**Step 4 — Add steps and severity rules:**

```markdown
## Steps to Reproduce

Rules:
- Number each step
- One action per step — never combine
- Start each step with a verb: "Click", "Enter", "Select", "Navigate"
- Include exact data used: not "enter a name" but "enter 'John Doe'"
- Include environment if relevant: browser, OS, build number

Good:
1. Navigate to Admin > Employee Management > Add Employee
2. Leave the First Name field empty
3. Enter "Doe" in the Last Name field
4. Click the Save button

Bad:
1. Go to add employee page and try to save without a name

## Severity Guide

| Severity | Definition | Example |
|----------|-----------|---------|
| Critical | System unusable, data loss, security issue | Cannot log in at all |
| High | Major feature broken, no workaround | Cannot save any employee |
| Medium | Feature partially broken, workaround exists | Save fails for empty name only |
| Low | Minor issue, cosmetic, workaround easy | Button label has typo |
```

**Step 5 — Add output format and Do Not:**

```markdown
## Output Format

Title: [Action] causes [result] on [page/feature]
Severity: [Critical / High / Medium / Low]
Environment: [browser, OS, build/version]

Steps to reproduce:
1.
2.
3.

Expected result: [one sentence — what should have happened]
Actual result: [one sentence — what actually happened]
Notes: [screenshots, frequency, related tickets — optional]

## Do Not

- Do not write "it doesn't work" in expected/actual — be specific
- Do not combine multiple actions in one step
- Do not skip the environment — "works on my machine" is not a bug report
- Do not write "should work correctly" in expected — state the specific behaviour
```

**Final output — before vs after:**

Before:
```
Bug: Login broken
Steps: Login doesn't work
Expected: Should work
```

After:
```
Title: Clicking Login with empty Password field causes no validation message on Login page
Severity: Medium
Environment: Chrome 122, Windows 11, Build 2.4.1

Steps to reproduce:
1. Navigate to the Login page at [URL]
2. Enter "testadmin" in the Username field
3. Leave the Password field empty
4. Click the Login button

Expected result: A validation message "Password is required" appears below the Password field
Actual result: No validation message appears and the page reloads without logging in

Notes: Reproducible consistently. Username validation (empty username) shows the message correctly.
```

---

## 7.4 Skill 3 — User Story Review

**The problem this skill solves:**

Testers receive stories in planning that are missing information needed to test them. Without a skill, the review quality depends on how senior the tester is and how much time they have. With a skill, every story gets reviewed against the same checklist.

**The complete skill:**

```yaml
---
name: story-review
description: >
  Review user stories for testability and completeness.
  Use when: reviewing a story before sprint, checking acceptance criteria,
  identifying missing requirements, reviewing a ticket for testability,
  finding gaps in a story, preparing for sprint planning.
  Always use this skill when reviewing stories for testing.
---

# User Story Review

## The Critical Rule

Every user story must have at least one acceptance criterion that can be
verified with a clear pass or fail. If there is no verifiable criterion,
the story cannot be tested and cannot be declared done.

## Four Categories to Check

### 1. Missing Acceptance Criteria
Conditions that must be true for the story to be complete but are not stated.
Example: "User can log in" — no criteria for what happens on failure.

### 2. Ambiguous Requirements
Words that could mean more than one thing to different people.
Flag words: "appropriate", "reasonable", "fast", "easy", "correct", "valid"
Example: "The form should load quickly" — what is quickly? 1 second? 5 seconds?

### 3. Untestable Statements
Statements with no observable pass/fail condition.
Example: "The system should be user-friendly" — how do you test this?

### 4. Missing Edge Cases
Boundary conditions and unusual scenarios not mentioned.
Always check: empty inputs, maximum values, concurrent access, role permissions,
error states, session expiry, network failure.

## Output Format

For each issue found:
- Category: [Missing AC / Ambiguous / Untestable / Missing Edge Case]
- Quote: [the exact text from the story]
- Problem: [why this is an issue for testing]
- Suggestion: [how to make it testable]

If no issues found in a category: state "None found" — do not skip the category.

## Do Not

- Do not rewrite the story — flag issues and suggest, do not replace
- Do not praise the story — issues only
- Do not flag formatting or writing style — testability only
- Do not suggest tests — this is a story review, not test case writing
```

**Before the skill:**
"Looks good, a few edge cases missing."

**After the skill:**
```
Category: Ambiguous
Quote: "The search should return results quickly"
Problem: "Quickly" has no defined threshold. A 3-second response may be
         acceptable to one stakeholder and unacceptable to another.
         There is no condition to test against.
Suggestion: Define a specific threshold: "Search results must appear within 2 seconds
            for queries returning fewer than 1000 records."

Category: Missing Edge Case
Quote: [no text — this is an omission]
Problem: The story does not address what happens when the search term matches
         zero records. There is no defined empty state behaviour.
Suggestion: Add acceptance criterion: "When no results match the search term,
            the message 'No results found for [search term]' is displayed."
```

---

## 7.5 Skill 4 — Exploratory Test Charters

**What a charter is:** a short document that defines the focus of one exploratory test session. It tells the tester what to explore, what tools or data to use, and what questions to try to answer.

**The complete skill:**

```yaml
---
name: exploratory-charter
description: >
  Write exploratory test charters for a feature or session.
  Use when: planning an exploratory test session, writing charters,
  preparing for session-based testing, writing a test mission,
  planning risk-based exploratory testing.
  Always use this skill when writing exploratory charters.
---

# Exploratory Test Charter

## The Critical Rule

A charter must be focused enough that a tester knows what to do,
but open enough that unexpected findings are welcome.

A charter that is too specific becomes a script.
A charter that is too vague produces unfocused sessions.

## Charter Format

Explore:    [the area, feature, or function to explore]
With:       [the data, tools, conditions, or user roles to use]
To discover: [the risks, questions, or concerns to investigate]

Time box: [session length — typically 60-90 minutes]

Debrief notes: [blank — tester fills in after session]

## Risk Focus Areas — Always Consider

- Data validation (what happens with unexpected input)
- State transitions (what happens when the user changes state mid-flow)
- Role permissions (what a lower-privileged role can and cannot do)
- Error recovery (what happens when something fails mid-task)
- Performance under realistic data volumes
- Integration points (where this feature touches other features)

## Coverage — Write One Charter Per Focus Area

Do not write one charter that tries to cover everything.
Write 3-5 focused charters for one feature, each with a specific risk focus.

## Do Not

- Do not write charters that are just test cases with different formatting
- Do not specify every step — that defeats the purpose of exploration
- Do not skip the "To discover" section — it must state a question or risk
- Do not write charters longer than 5 lines — if it is longer, split it
```

**Before the skill:**
```
Charter: Test the Leave Application feature
```

**After the skill:**
```
Charter 1
Explore:     Leave application form submission under varied data conditions
With:        Admin user, all available leave types, past dates, future dates,
             dates spanning weekends and public holidays
To discover: Whether date validation handles edge cases correctly —
             specifically same-day applications, retroactive leave,
             and leave spanning a public holiday
Time box:    60 minutes

Charter 2
Explore:     Leave approval workflow from manager perspective
With:        Manager-role user, multiple pending leave requests
To discover: Whether the approval flow handles concurrent requests correctly
             and whether the notification reaches the employee after approval
Time box:    45 minutes

Charter 3
Explore:     Leave balance calculation after application submission
With:        Employee with limited remaining balance, partial-day leave options
To discover: Whether balance updates correctly in real time and whether
             the system prevents over-application of leave
Time box:    45 minutes
```

---

## 7.6 Skill 5 — Sprint Test Planning and Effort Estimation

**The complete skill:**

```yaml
---
name: sprint-test-planning
description: >
  Plan and estimate testing effort for a sprint or release.
  Use when: estimating testing hours, planning test coverage for a sprint,
  creating a test plan, prioritising test effort, estimating QA effort
  for stories, preparing for sprint planning, writing a test strategy.
  Always use this skill when planning testing effort.
---

# Sprint Test Planning

## The Critical Rule

Every estimate must state its assumptions explicitly.
An estimate without stated assumptions is not an estimate — it is a guess.

## Effort Components — Include All That Apply

For each story, estimate:

| Component | When to Include |
|-----------|----------------|
| Test case writing | Always |
| Test execution (happy path) | Always |
| Test execution (negative + boundary) | Always |
| Regression on affected areas | When story changes existing behaviour |
| Cross-browser / device testing | When story affects UI |
| API testing | When story has API changes |
| Performance check | When story affects data volumes |
| UAT support | When business stakeholders are involved |

## Effort Scale (adjust to your team's velocity)

| Story Complexity | Typical QA Hours |
|-----------------|-----------------|
| Simple (1 field, 1 flow) | 2–4 hours |
| Medium (form, CRUD, workflow) | 4–8 hours |
| Complex (integration, permissions, async) | 8–16 hours |
| Epic/release | Sum of stories + 10% regression buffer |

## Output Format

For each story: one row in a table.
Columns: Story | Testing scope | Estimated hours | Key assumptions

Final row: Total hours | Risk flags | Recommendation

## Do Not

- Do not estimate without stating assumptions
- Do not forget regression when a story changes existing behaviour
- Do not give a single number without a range for complex stories
- Do not include development tasks in QA estimates
- Do not commit to an estimate without knowing the story's acceptance criteria
```

---

## 7.7 How a Manual Tester's Day Changes

**Before skills:**

Monday morning. Six stories. You write test cases for Story 1 — 45 minutes, inconsistent format. You ask Claude for help with Story 2 — output is generic, 20 minutes fixing it. You review Story 3 manually — miss two missing acceptance criteria. By lunch you have covered three stories.

**After skills:**

Monday morning. Six stories. You type each story into Claude. The test-case-writing skill loads. Output is in your team's format, covers all four dimensions, flags two missing acceptance criteria automatically. By 10am you have first drafts for all six stories. You spend the morning reviewing and refining rather than generating from scratch.

The shift is not that Claude does your job. The shift is that the repetitive, format-dependent part of your job takes minutes instead of hours. You spend your time on the part that requires human judgement — does this test case actually cover the business risk? is this charter focused on the right area? — rather than on formatting and coverage checklists.

---

## Chapter Summary

| Skill | Critical Rule | Key Sections |
|-------|--------------|-------------|
| Test case writing | One unambiguous pass/fail per case | Coverage requirements, title rules, step rules |
| Bug reporting | Reproducible by someone who never saw it | Title rule, step rules, severity guide |
| Story review | Every story needs one verifiable criterion | Four categories checklist |
| Exploratory charters | Focused enough to act, open enough to explore | Charter format, risk areas, one per focus |
| Sprint planning | Every estimate states its assumptions | Components table, scale, output format |

---

## Three Exercises to Try Today

1. Take your team's last five bug reports. How many had vague "expected result" fields? Write the bug-reporting skill Do Not section based on the specific problems you find.

2. Review one story from the current sprint using the story-review skill. How many issues does it find? Bring those issues to the next refinement session.

3. Write charters for a feature you are about to test using the exploratory-charter skill. Compare them to what you would have written without the skill.

---

→ [Chapter 8 — Skills for Exploratory Testing with MCP](08-skills-exploratory-mcp.md)

---

*← [Chapter 6](06-getting-started-today.md) | [Chapter 8 →](08-skills-exploratory-mcp.md)*
