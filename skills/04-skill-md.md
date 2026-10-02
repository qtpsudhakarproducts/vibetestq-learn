# Chapter 4 — SKILL.md
### What Is a Skill and How to Build One

---

> *"A skill is a standing brief. You write it once.  
> Every session that needs it gets it automatically."*

---

## What You Will Learn

By the end of this chapter you will know:
- What a SKILL.md is and the problem it solves
- How a skill connects to context engineering
- What every section of a skill does — by watching one be built
- How to write a description that triggers reliably
- How to read and write any skill you encounter

---

## 4.1 The Problem Skills Solve

In Chapter 3 you learned about the session start template — pasting your conventions and reference files at the start of every session so the model has the context it needs.

That works. But it requires you to do something manual every time.

You have to remember the template. You have to paste it. You have to update it when your conventions change. If you are on a team, every engineer has to do this separately. Some will forget. Some will have slightly different versions. Output will vary.

A SKILL.md solves this. It is a file that encodes your standards. When you ask for something that matches the skill's description, the skill loads automatically. Your conventions are in context before you type your first word. You do nothing per session.

**Without a skill:** you are the storage mechanism for your own standards. Your AI output quality depends on how well you remember to explain everything, every time.

**With a skill:** your standards live in a file. They load when needed. Output quality is consistent — for you, for your team, for every session.

---

## 4.2 SKILL.md Is Context Engineering Made Permanent

This is the key connection to Chapter 3.

Context engineering says: put the right information in the context window before the model responds.

A SKILL.md does exactly that — automatically. You write the standard once. Every time a matching request is detected, that standard loads into context. You do nothing per session.

```
LEVEL 1 — No context engineering
  Every session: re-explain conventions from scratch
  Quality: depends on memory, inconsistent

LEVEL 2 — Manual context engineering (Chapter 3)
  Every session: paste your context block
  Quality: consistent within a session, manual effort every time

LEVEL 3 — SKILL.md
  Once: write the standard
  Every session: loads automatically
  Quality: consistent with zero effort per session
```

A skill is the final destination of context engineering. You stop managing context manually and start managing it by design.

---

## 4.3 Building a Skill Step by Step

The best way to understand what each part of a skill does is to watch one being built.

We will use **test case writing** as the example throughout this chapter. Every tester writes test cases. The skill will be universally understood regardless of whether you are a manual tester, an automation engineer, or a QA lead.

We will start with no skill and add one section at a time. After each addition, we will look at what changed in the output.

**The task throughout:** write test cases for a Login feature.

---

### Step 0 — No Skill

No skill. Just a prompt.

**Prompt:**
```
Write test cases for the Login feature.
```

**Output:**
```
Test Case 1: Test login with valid credentials
Test Case 2: Test login with invalid credentials
Test Case 3: Test login with empty fields
```

Generic. No format. No expected results. No steps. Three scenarios where there should be eight. Unusable without significant rewriting.

This is what the model produces when it has nothing to work with. It uses its training defaults — which are generic by design, not specific to any team.

---

### Step 1 — Add the Frontmatter (Name and Description)

The frontmatter is the YAML block at the top of every skill file. It has two fields: `name` and `description`.

The `name` is an identifier. The `description` is the trigger — it is what the AI reads to decide whether this skill is relevant to a request.

```yaml
---
name: test-case-writing
description: >
  Write test cases for any feature, user story, or requirement.
  Use when: the user asks to write, generate, or review test cases,
  test scenarios, or test coverage for any feature.
---
```

**What adding the frontmatter changes about output:**

Nothing yet. The frontmatter tells the AI when to load the skill. It does not tell the AI what to do. We have not put any instructions in the skill body yet.

But something important has happened. Next time you type "write test cases for the Login feature," the AI will detect that this matches the description and load the skill. Without the frontmatter, the skill is just a file. With the frontmatter, it is a tool that knows when to activate.

**What makes a description strong:**

A weak description triggers inconsistently:
```yaml
description: For writing test cases.
```

A strong description triggers on every variation of the request:
```yaml
description: >
  Write test cases for any feature, user story, or requirement.
  Use when: the user asks to write, generate, create, or review test cases,
  test scenarios, or test coverage for any feature or story.
  Triggers include: "write test cases for", "generate test cases",
  "what should I test", "create test scenarios", "test coverage for this story",
  "write Gherkin scenarios", "what are the test cases".
  Always use this skill before writing any test cases.
  Never write test cases without this skill loaded.
```

The strong description uses "Use when:" to list every specific trigger. It ends with "Always" and "Never" to make loading mandatory. It catches every natural way someone might ask for test cases.

---

### Step 2 — Add the Critical Rule

The critical rule is the single most important constraint in the skill. It goes at the top of the skill body, before everything else. It is the rule that makes everything else work.

```yaml
---
name: test-case-writing
description: >
  Write test cases for any feature, user story, or requirement.
  Use when: writing, generating, or reviewing test cases or test scenarios.
  Always use this skill before writing test cases.
---

# Test Case Writing

## The Critical Rule

Every test case must have exactly one unambiguous pass/fail condition.

A test case without a clear expected result is not a test case. It is a script.
If a tester cannot tell whether the test passed or failed without guessing,
the test case has failed before it was run.
```

**Output now:**

```gherkin
Scenario: Login succeeds with valid credentials
  Given the user is on the Login page
  When the user enters valid credentials and clicks Login
  Then the user is redirected to the Dashboard page

Scenario: Login fails with incorrect password
  Given the user is on the Login page
  When the user enters an incorrect password and clicks Login
  Then an error message is displayed
  And the user remains on the Login page
```

Progress. The Then steps are now specific outcomes rather than vague descriptions. "Redirected to the Dashboard page" is verifiable. "An error message is displayed" is still too vague — which message? where? — but it is moving in the right direction.

Coverage is still incomplete. Format is still inconsistent. But the critical rule has already improved output quality in one step.

**Why the critical rule comes first:** it is the highest-priority constraint. If only one thing from the skill is applied, it should be this. Placing it first ensures it is the first thing read and the last thing forgotten.

---

### Step 3 — Add Coverage Requirements

The model currently writes as many test cases as it feels are sufficient. That is not good enough. Coverage requirements define exactly what "complete" means.

```yaml
---
name: test-case-writing
description: >
  Write test cases for any feature, user story, or requirement.
  Use when: writing, generating, or reviewing test cases or test scenarios.
  Always use this skill before writing test cases.
---

# Test Case Writing

## The Critical Rule

Every test case must have exactly one unambiguous pass/fail condition.

## Coverage Requirements

Every feature must be covered across four dimensions.
Do not skip any dimension unless the user explicitly says it is out of scope.

| Dimension | What It Covers | Minimum |
|-----------|---------------|---------|
| Happy path | Valid inputs, expected flow completes | 1–2 |
| Negative | Invalid inputs, error states, validation messages | 2–3 |
| Boundary | Min/max values, empty fields, character limits | 1–2 per boundary |
| Edge case | Unusual but valid scenarios, role-based access | 1–2 |
```

**Output now:**

```gherkin
Feature: Login

  # Happy Path
  Scenario: User is redirected to Dashboard after successful login
    Given the user is on the Login page
    When the user enters valid credentials and clicks Login
    Then the user is redirected to the Dashboard page

  # Negative
  Scenario: Error message appears when password is incorrect
    Given the user is on the Login page
    When the user enters a valid username and incorrect password and clicks Login
    Then an error message appears
    And the user remains on the Login page

  Scenario: Error message appears when username does not exist
    Given the user is on the Login page
    When the user enters a non-existent username and clicks Login
    Then an error message appears

  # Boundary
  Scenario: Validation appears when username is empty
    Given the user is on the Login page
    When the user submits the form with an empty username
    Then a validation message appears

  Scenario: Validation appears when password is empty
    Given the user is on the Login page
    When the user submits the form with an empty password
    Then a validation message appears

  # Edge Case
  Scenario: Authenticated user visiting Login page is redirected
    Given the user has an active session
    When the user navigates to the Login page
    Then the user is redirected to the Dashboard
```

All four dimensions are covered. Eight scenarios instead of three. Coverage is now complete.

But titles are still inconsistent ("Validation appears when" vs "Authenticated user visiting"). Then steps are still vague ("an error message appears" — which one?). Format still varies.

---

### Step 4 — Add Title Rules and Step Rules

This section is where the output stops being adequate and starts being production-ready.

```yaml
## Title Rules

A good title completes this sentence: "This test verifies that..."

Format: [outcome] when [condition]

Good: "Error message appears when password field is empty"
Bad:  "Test login" — no outcome stated
Bad:  "Negative test 1" — meaningless without reading the steps

## Step Rules

**Given** — the starting state. Never an action.
  ✅ Given the user is on the Login page
  ❌ Given the user navigates to the Login page  ← action, not state

**When** — one action only. Split if there are two.
  ✅ When the user submits the form with an empty password field
  ❌ When the user fills the username, leaves the password empty, and clicks Submit

**Then** — the specific verifiable result. Observable. No interpretation required.
  ✅ Then the validation message "Password is required" appears below the password field
  ❌ Then an error is shown  ← which error? where? what text?
  ❌ Then it works correctly  ← "correctly" means nothing
```

**Output now:**

```gherkin
Feature: Login

  # Happy Path
  Scenario: User is redirected to Dashboard when valid credentials are entered
    Given the user is on the Login page
    When  the user enters [valid username] and [valid password] and clicks Login
    Then  the Dashboard page is displayed

  # Negative
  Scenario: Error message appears when an incorrect password is entered
    Given the user is on the Login page
    When  the user enters [valid username] and [incorrect password] and clicks Login
    Then  the error message "Invalid credentials" appears below the password field
    And   the Login page remains displayed

  Scenario: Error message appears when a non-existent username is entered
    Given the user is on the Login page
    When  the user enters [non-existent username] and [any password] and clicks Login
    Then  the error message "Invalid credentials" appears below the password field

  # Boundary
  Scenario: Validation message appears when username field is submitted empty
    Given the user is on the Login page
    When  the user submits the form with an empty username field
    Then  the validation message "Username is required" appears below the username field

  Scenario: Validation message appears when password field is submitted empty
    Given the user is on the Login page
    When  the user submits the form with an empty password field
    Then  the validation message "Password is required" appears below the password field

  # Edge Case
  Scenario: Authenticated user is redirected to Dashboard when visiting Login page
    Given the user has an active authenticated session
    When  the user navigates directly to the Login page URL
    Then  the user is redirected to the Dashboard page without seeing the Login form
```

Titles now follow the exact pattern. Given steps are states not actions. When steps have one action. Then steps state specific, observable results with exact message text. Placeholders replace real credentials.

---

### Step 5 — Add Output Format and Do Not Rules

The last two sections lock in the structure and prevent specific violations.

```yaml
## Output Format

Produce test cases in this order:
1. Happy path scenarios first
2. Negative scenarios second
3. Boundary scenarios third
4. Edge case scenarios last

Use a Feature block at the top.
Use comment headers: # Happy Path, # Negative, # Boundary, # Edge Case

## Do Not

- Do not write a vague Then step — rewrite until it is specific and observable
- Do not combine multiple actions in one When step — split them
- Do not use real credentials or PII — use descriptive placeholders
- Do not skip boundary tests because the story did not define limits —
  write the test and flag the gap with ⚠
- Do not number scenarios as "Test 1", "Test 2" — every scenario needs a title
- Do not add explanation text outside the Gherkin block
```

**Output now — the final version:**

```gherkin
Feature: Login

  # Happy Path
  Scenario: User is redirected to Dashboard when valid credentials are entered
    Given the user is on the Login page
    When  the user enters [valid username] and [valid password] and clicks Login
    Then  the Dashboard page is displayed with the user's name in the top navigation

  # Negative
  Scenario: Error message appears when an incorrect password is entered
    Given the user is on the Login page
    When  the user enters [valid username] and [incorrect password] and clicks Login
    Then  the error message "Invalid credentials" appears below the password field
    And   the Login page remains displayed

  Scenario: Error message appears when a non-existent username is entered
    Given the user is on the Login page
    When  the user enters [non-existent username] and [any password] and clicks Login
    Then  the error message "Invalid credentials" appears below the password field

  # Boundary
  Scenario: Validation message appears when username field is submitted empty
    Given the user is on the Login page
    When  the user submits the form with an empty username field
    Then  the validation message "Username is required" appears below the username field
    And   focus returns to the username field

  Scenario: Login fails when username exceeds maximum character limit
    Given the user is on the Login page
    When  the user enters a username of [maximum + 1 characters] and clicks Login
    Then  the username field does not accept the additional character
    ⚠ Maximum character limit for username not specified — confirm with the team

  # Edge Case
  Scenario: Authenticated user is redirected to Dashboard when visiting Login page
    Given the user has an active authenticated session
    When  the user navigates directly to the Login page URL
    Then  the user is redirected to the Dashboard page without seeing the Login form

  Scenario: Login page is accessible to unauthenticated users
    Given the user has no active session
    When  the user navigates directly to the Login page URL
    Then  the Login page is displayed
```

The Do Not rules added two things: the boundary test correctly flags the missing character limit, and the output contains no explanation text — just the Gherkin block.

---

### The Full Transformation

**Step 0 — No skill:**
```
Test Case 1: Test login with valid credentials
Test Case 2: Test login with invalid credentials
Test Case 3: Test login with empty fields
```
3 lines. No format. No expected results. No steps. Unusable.

**Step 5 — Full skill:**
```gherkin
Feature: Login
  # Happy Path (2 scenarios)
  # Negative (2 scenarios)
  # Boundary (2 scenarios with gap flagged)
  # Edge Case (2 scenarios)
```
Complete Gherkin. Consistent titles. Specific Then steps. All four coverage dimensions. Gaps flagged. Ready to use.

Same prompt. Five sections added to the skill. Completely different output.

---

### What Each Section Did

| Section Added | What It Fixed |
|--------------|---------------|
| Frontmatter | Nothing in output — but skill now triggers automatically |
| Critical rule | Then steps became specific outcomes |
| Coverage requirements | All four dimensions covered, correct minimums |
| Title + step rules | Consistent titles, single When actions, exact Then text |
| Output format + Do Not | Correct ordering, no vague steps, gaps flagged |

---

## 4.4 The Complete Anatomy

Now that you have seen every section built, here is the complete picture.

```
your-skill-name/
├── SKILL.md                    ← Required. The main instruction file.
├── references/                 ← Optional. Detailed files loaded on demand.
│   ├── example-test-cases.md   ← Full example output
│   └── format-guide.md         ← Detailed format reference
└── scripts/                    ← Optional. Executable code.
```

### Every Section and Its Purpose

| Section | Purpose | Required |
|---------|---------|---------|
| Frontmatter (name + description) | Tells the AI when to load the skill | Yes |
| What this skill does | One paragraph overview | Recommended |
| The critical rule | The single most important constraint | Yes |
| Content sections | Conventions, patterns, workflows | Yes |
| Output format | Exactly how output should be structured | Yes |
| Do Not | What to prevent — as important as what to do | Yes |
| References | Points to detailed files in references/ folder | When needed |

---

## 4.5 The Three-Layer Loading System

Skills use three layers. Not everything loads every time. This keeps sessions fast while keeping everything available.

```
┌──────────────────────────────────────────────────────┐
│  LAYER 1 — Metadata (always in context)              │
│  The name and description only                       │
│  Always visible. Always checked against requests.    │
│  Cost: minimal                                       │
└──────────────────────────────────────────────────────┘
              ↓ skill triggers when description matches

┌──────────────────────────────────────────────────────┐
│  LAYER 2 — SKILL.md body (loads when triggered)      │
│  Everything you wrote in the skill file              │
│  Target: under 500 lines                             │
│  Cost: moderate — loaded once per session            │
└──────────────────────────────────────────────────────┘
              ↓ references loaded when task needs them

┌──────────────────────────────────────────────────────┐
│  LAYER 3 — References (loaded on demand)             │
│  Detailed files in the references/ folder            │
│  Loaded only when the specific task needs them       │
│  Cost: only when needed                              │
└──────────────────────────────────────────────────────┘
```

**Example — test-case-writing skill:**

Layer 1: the description — always visible, triggers when someone asks for test cases.

Layer 2: the skill body — coverage requirements, title rules, step rules, output format, Do Not rules. Loaded for every test case writing session.

Layer 3: `references/example-test-cases.md` — a full example with 12 scenarios showing every pattern. Only loaded when the model needs a concrete example for a complex feature.

This means simple requests load only Layers 1 and 2. Complex requests that need a detailed reference example load all three. The context window is never flooded with content that is not needed.

---

## 4.6 Signs Your Skill Needs Improvement

Once you have a skill, you will notice when it is not working. These signs and fixes apply to any skill.

| Sign | Problem | Fix |
|------|---------|-----|
| Skill does not trigger | Description too narrow | Add more trigger phrases. Add "Always use when". |
| Skill triggers on wrong requests | Description too broad | Narrow with specific task names and contexts |
| Critical rule is ignored | Buried in the skill body | Move it to the top. Use all caps for the heading. |
| Same violation keeps appearing | Rule is too abstract | Add a ✅/❌ example showing the right and wrong version |
| Output is correct for 5 turns then drifts | Skill body too long | Shorten. Move detail to references/. Keep body under 500 lines. |
| Different output quality across sessions | Rule depends on context not always present | Add the missing context to the skill body directly |

---

## Chapter Summary

| Concept | Key Takeaway |
|---------|-------------|
| What a skill is | A file that encodes your standards and loads them automatically |
| Connection to context engineering | SKILL.md is context engineering made permanent and automatic |
| The frontmatter | The trigger — description determines when the skill loads |
| The critical rule | The most important constraint — goes first, stated clearly |
| Coverage + rules sections | Define what complete means and what to prevent |
| Three-layer loading | Metadata always, body on trigger, references on demand |
| Signs it needs improvement | Six specific signs with specific fixes |

---

## Three Exercises to Try Today

1. Read the test-case-writing skill at the end of this chapter. Identify every section and what it does. You should be able to name the purpose of each section without looking at this chapter.

2. Write a minimal skill for one task you repeat most often. Start with just the frontmatter and critical rule. Test it. Then add one section at a time.

3. Take a skill you wrote and run the fresh-session test: open a completely new session, type a matching request without any other context, and check whether the output follows your standards.

---

## The Complete test-case-writing Skill

```yaml
---
name: test-case-writing
description: >
  Write test cases for any feature, user story, or requirement.
  Use when: the user asks to write, generate, create, or review test cases,
  test scenarios, or test coverage for any feature.
  Triggers include: "write test cases for", "generate test cases",
  "what should I test", "create test scenarios", "test coverage for this story",
  "write Gherkin scenarios", "what are the test cases".
  Always use this skill before writing any test cases.
  Never write test cases without this skill loaded.
---

# Test Case Writing

## The Critical Rule

Every test case must have exactly one unambiguous pass/fail condition.
If a tester cannot tell whether the test passed or failed without guessing,
the test case has failed before it was run.

## Coverage Requirements

Every feature must be covered across four dimensions:

| Dimension | What It Covers | Minimum |
|-----------|---------------|---------|
| Happy path | Valid inputs, expected flow completes | 1–2 |
| Negative | Invalid inputs, error states, validation | 2–3 |
| Boundary | Min/max values, empty fields, character limits | 1–2 per boundary |
| Edge case | Unusual but valid scenarios, role-based access | 1–2 |

## Title Rules

Format: [outcome] when [condition]
Test: "This test verifies that..." — title must complete this sentence.

Good: "Error message appears when password field is empty"
Bad:  "Test login" / "Negative test 1"

## Step Rules

Given — starting state only. Never an action.
When  — one action only. Split if there are two.
Then  — specific, observable result. No vague language.

✅ Then the validation message "Password is required" appears below the field
❌ Then an error is shown

## Output Format

Order: Happy Path → Negative → Boundary → Edge Case
Use Feature block at top.
Use comment headers: # Happy Path / # Negative / # Boundary / # Edge Case

## Do Not

- Do not write vague Then steps — specific and observable only
- Do not combine multiple actions in one When step
- Do not use real credentials or PII — use [descriptive placeholders]
- Do not skip boundary tests for undefined limits — write and flag with ⚠
- Do not number scenarios — every scenario needs a descriptive title
- Do not add explanation text outside the Gherkin block
```

---

→ [Chapter 5 — Skill Deployment](05-skill-deployment.md)

---

*← [Chapter 3](03-context-engineering.md) | [Chapter 5 →](05-skill-deployment.md)*
