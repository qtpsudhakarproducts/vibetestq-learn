# Chapter 2 — Prompt Engineering
### Writing Instructions That Work

---

> *"A bad prompt is like telling a contractor: build something.  
> A good prompt is like handing them a blueprint, a materials list,  
> a deadline, and a photo of what you want."*

---

## What You Will Learn

By the end of this chapter you will know:
- Why most AI prompts fail and exactly what to do about it
- The five elements every strong prompt needs
- How to read bad output and know which element was missing
- Five techniques for different types of tasks
- Ready-to-use prompt patterns for your daily testing work

---

## 2.1 Why Most Prompts Fail

A prompt is the instruction you give to an AI model. Most prompts fail for one reason: they are too vague.

Not because the person writing them is careless. Because when we ask another person to do something, we rely on shared knowledge — they know our team, our standards, our context. We do not explain everything every time.

An AI model has none of that shared knowledge unless you give it. Every session starts blank. If you do not tell it your framework, it guesses. If you do not tell it your format, it invents one. If you do not tell it what not to do, it does whatever feels natural based on patterns from its training.

The fix is not to use a smarter model. The fix is to give the model what it needs to produce what you want.

**The core rule:** the more specific and structured your instruction, the more specific and useful the output.

---

## 2.2 The Five Elements — Built One at a Time

Every strong prompt has five elements. The best way to understand what each one does is to watch what happens to the output when you add it.

We will build a single prompt from nothing, adding one element at a time. The task: write test cases for a login feature.

---

### Starting Point — No Elements

**Prompt:**
```
Write test cases for login.
```

**Output:**
```
Test Case 1: Verify login with valid credentials
Test Case 2: Verify login with invalid credentials
Test Case 3: Verify login with empty fields
```

Three test cases. No format. No expected results. No steps. Unusable without significant rewriting.

---

### Add Element 1 — Role

Tell the AI who it is for this conversation. This sets the vocabulary, the depth, and the assumptions it makes.

**Prompt:**
```
You are a senior QA engineer with 8 years of experience in manual testing.

Write test cases for login.
```

**Output:**
```
TC-001: Valid Login
Steps: Enter valid username and password. Click Login.
Expected: User is redirected to Dashboard.

TC-002: Invalid Password
Steps: Enter valid username and wrong password. Click Login.
Expected: Error message displayed.
```

Better. It now has steps and an expected result. But it still does not know your application, your format, or your coverage requirements.

**What Role does:** sets the expertise level and vocabulary. Without it the model writes for an unknown audience. With it the model writes for a professional tester.

---

### Add Element 2 — Context

Tell the AI what environment it is working in. What application, what team conventions, what constraints.

**Prompt:**
```
You are a senior QA engineer with 8 years of experience in manual testing.

Context:
- Application: OrangeHRM — a web-based HR management system
- Login page has: username field, password field, Login button
- On success: user is redirected to the Dashboard
- On failure: error message "Invalid credentials" is shown below the form
- Team format: Gherkin (Given/When/Then)

Write test cases for login.
```

**Output:**
```gherkin
Scenario: Successful login with valid credentials
  Given the user is on the Login page
  When  the user enters a valid username and valid password and clicks Login
  Then  the user is redirected to the Dashboard page

Scenario: Login fails with incorrect password
  Given the user is on the Login page
  When  the user enters a valid username and an incorrect password and clicks Login
  Then  the error message "Invalid credentials" is displayed below the form
```

Now the output matches your application and your team's format. But it still only covers two scenarios. Coverage is incomplete.

**What Context does:** eliminates guessing about the environment. Without it the model invents an application. With it the model writes for your specific system.

---

### Add Element 3 — Task

Tell the AI exactly what to produce. Not just "write test cases" but specifically what scenarios to cover.

**Prompt:**
```
You are a senior QA engineer with 8 years of experience in manual testing.

Context:
- Application: OrangeHRM — a web-based HR management system
- Login page has: username field, password field, Login button
- On success: user is redirected to the Dashboard
- On failure: error message "Invalid credentials" is shown below the form
- Team format: Gherkin (Given/When/Then)

Task: Write test cases covering all four dimensions:
1. Happy path — valid credentials, successful login
2. Negative — invalid credentials, wrong password, wrong username
3. Boundary — empty fields, fields at maximum character length
4. Edge case — already logged in user navigates to login page
```

**Output:**
```gherkin
Feature: Login

  # Happy Path
  Scenario: User is redirected to Dashboard after successful login
    Given the user is on the Login page
    When  the user enters a valid username and valid password and clicks Login
    Then  the user is redirected to the Dashboard page

  # Negative
  Scenario: Error message shown when password is incorrect
    Given the user is on the Login page
    When  the user enters a valid username and an incorrect password and clicks Login
    Then  the error message "Invalid credentials" is displayed below the form
    And   the user remains on the Login page

  Scenario: Error message shown when username does not exist
    Given the user is on the Login page
    When  the user enters a username that does not exist and any password and clicks Login
    Then  the error message "Invalid credentials" is displayed

  # Boundary
  Scenario: Login fails when username field is empty
    Given the user is on the Login page
    When  the user leaves the username field empty and clicks Login
    Then  a validation message "Username is required" is displayed

  Scenario: Login fails when password field is empty
    Given the user is on the Login page
    When  the user leaves the password field empty and clicks Login
    Then  a validation message "Password is required" is displayed

  # Edge Case
  Scenario: Authenticated user is redirected away from Login page
    Given the user has an active session
    When  the user navigates directly to the Login page URL
    Then  the user is redirected to the Dashboard page
```

Now the output covers all four dimensions. But the title format is still inconsistent and some Then steps could be more specific.

**What Task does:** removes ambiguity about what to produce. Without it the model guesses at scope. With it the model produces exactly what you asked for.

---

### Add Element 4 — Format

Tell the AI exactly how to structure the output. Not just the file format but the internal conventions — how titles should read, how many scenarios per section, what to include and exclude.

**Prompt:**
```
You are a senior QA engineer with 8 years of experience in manual testing.

Context:
- Application: OrangeHRM — a web-based HR management system
- Login page has: username field, password field, Login button
- On success: user is redirected to the Dashboard
- On failure: error message "Invalid credentials" is shown below the form
- Team format: Gherkin (Given/When/Then)

Task: Write test cases covering all four dimensions:
1. Happy path — valid credentials, successful login
2. Negative — invalid credentials, wrong password, wrong username
3. Boundary — empty fields, fields at maximum character length
4. Edge case — already logged in user navigates to login page

Format:
- Feature block at the top
- Comment header before each group: # Happy Path, # Negative, # Boundary, # Edge Case
- Scenario title format: [outcome] when [condition]
  Example: "Login succeeds when valid credentials are entered"
- Then steps must state the exact observable result
  Example: "Then the error message 'Invalid credentials' appears below the password field"
  Not: "Then an error is shown"
- No scenario numbers or IDs — titles only
```

**Output:**
```gherkin
Feature: Login

  # Happy Path
  Scenario: User reaches Dashboard when valid credentials are entered
    Given the user is on the Login page
    When  the user enters a valid username and valid password and clicks Login
    Then  the Dashboard page is displayed with the user's name in the top navigation

  # Negative
  Scenario: Error message appears when an incorrect password is entered
    Given the user is on the Login page
    When  the user enters a valid username and an incorrect password and clicks Login
    Then  the error message "Invalid credentials" appears below the password field
    And   the Login page remains displayed

  Scenario: Error message appears when a non-existent username is entered
    Given the user is on the Login page
    When  the user enters a username that does not exist in the system and clicks Login
    Then  the error message "Invalid credentials" appears below the password field

  # Boundary
  Scenario: Validation message appears when username field is submitted empty
    Given the user is on the Login page
    When  the user leaves the username field empty and clicks Login
    Then  the validation message "Username is required" appears below the username field
    And   focus returns to the username field

  Scenario: Validation message appears when password field is submitted empty
    Given the user is on the Login page
    When  the user leaves the password field empty and clicks Login
    Then  the validation message "Password is required" appears below the password field

  # Edge Case
  Scenario: Authenticated user is redirected to Dashboard when visiting Login page
    Given the user has an active authenticated session
    When  the user navigates directly to the Login page URL
    Then  the user is redirected to the Dashboard page without seeing the Login form
```

Titles now follow the exact pattern. Then steps state specific observable results. Output is immediately usable.

**What Format does:** eliminates inconsistency in output structure. Without it the model makes style choices. With it the model produces output that matches your team's standard exactly.

---

### Add Element 5 — Rules

Tell the AI what NOT to do. Constraints are as important as instructions. Most bad output happens because the model did something you did not want — not because it failed to do what you asked.

**Prompt:**
```
You are a senior QA engineer with 8 years of experience in manual testing.

Context:
- Application: OrangeHRM — a web-based HR management system
- Login page has: username field, password field, Login button
- On success: user is redirected to the Dashboard
- On failure: error message "Invalid credentials" is shown below the form
- Team format: Gherkin (Given/When/Then)

Task: Write test cases covering all four dimensions:
1. Happy path — valid credentials, successful login
2. Negative — invalid credentials, wrong password, wrong username
3. Boundary — empty fields, fields at maximum character length
4. Edge case — already logged in user navigates to login page

Format:
- Feature block at the top
- Comment header before each group: # Happy Path, # Negative, # Boundary, # Edge Case
- Scenario title format: [outcome] when [condition]
- Then steps must state the exact observable result
- No scenario numbers or IDs — titles only

Rules:
- Do not use real usernames or passwords — use descriptive placeholders
- Do not write more than one When action per step — split if needed
- Do not write vague Then steps — every Then must be verifiable by observation
- Do not add explanations or comments outside the Gherkin block
- Do not skip boundary tests because the story did not define maximum lengths —
  write the test and flag the missing information with ⚠
```

**Output:**
```gherkin
Feature: Login

  # Happy Path
  Scenario: User reaches Dashboard when valid credentials are entered
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
```

Placeholders replace real credentials. The boundary test flags the missing information rather than skipping it. Every Then is verifiable. No explanations outside the Gherkin block.

**What Rules does:** prevents specific violations. Without constraints the model makes choices. With constraints the model follows your rules.

---

### The Complete Prompt

Here is the full prompt with all five elements:

```
You are a senior QA engineer with 8 years of experience in manual testing.

Context:
- Application: OrangeHRM — a web-based HR management system
- Login page has: username field, password field, Login button
- On success: user is redirected to the Dashboard
- On failure: error message "Invalid credentials" is shown below the form
- Team format: Gherkin (Given/When/Then)

Task: Write test cases covering all four dimensions:
1. Happy path — valid credentials, successful login
2. Negative — invalid credentials, wrong password, wrong username
3. Boundary — empty fields, fields at maximum character length
4. Edge case — already logged in user navigates to login page

Format:
- Feature block at the top
- Comment header before each group: # Happy Path, # Negative, # Boundary, # Edge Case
- Scenario title format: [outcome] when [condition]
- Then steps must state the exact observable result
- No scenario numbers or IDs — titles only

Rules:
- Do not use real usernames or passwords — use descriptive placeholders
- Do not write more than one When action per step — split if needed
- Do not write vague Then steps — every Then must be verifiable by observation
- Do not add explanations or comments outside the Gherkin block
- Do not skip boundary tests because the story did not define maximum lengths —
  write the test and flag the missing information with ⚠
```

### What Each Element Fixed

| Element Added | What It Fixed |
|--------------|---------------|
| Nothing | Generic, unformatted, incomplete |
| Role | Expertise level — steps and expected results appear |
| Context | Application-specific — correct format, correct error messages |
| Task | Coverage — all four dimensions covered |
| Format | Consistency — titles follow pattern, Then steps are specific |
| Rules | Violations prevented — no real credentials, gaps flagged |

---

## 2.3 The Five Techniques

Different tasks need different approaches. Here are the five techniques and when to use each.

### Technique 1 — Zero-Shot
Ask directly with no examples. Works for simple, well-defined tasks.
```
Write a one-sentence summary of what this test case is testing: [paste test case]
```
Use when: the task is simple and the expected output is universal.

### Technique 2 — One-Shot
Give one example, then ask for the next. The model learns the exact pattern from the example.
```
Here is one test case in our format:
[paste example]

Write the same format for: [new scenario]
```
Use when: you want output that matches an existing file exactly.

### Technique 3 — Few-Shot
Give two or three examples. The model identifies the pattern across examples.
```
Here are three bug reports from our project:
[paste three examples]

Write a bug report for this defect: [describe defect]
```
Use when: one example is not enough to capture all the conventions.

### Technique 4 — Chain-of-Thought
Ask the model to reason step by step before answering. Dramatically improves output for debugging, root cause analysis, and architecture decisions.
```
Before writing the fix, reason through:
1. What the current code does
2. Where it fails and why
3. What the correct approach is

Then write the fix.
```
Use when: the problem requires analysis before solution.

### Technique 5 — Correction Over Restart
When output is mostly right with one specific violation, correct the violation rather than starting over. Restarting loses context you built up.
```
Good. One problem: the Then step is vague — "error is shown" could mean anything.
Rewrite only the Then step to state the exact visible error message and its location.
Keep everything else the same.
```
Use when: output is mostly correct and only needs a targeted fix.

---

## 2.4 Prompt Patterns — Manual Testing

Copy these. Fill in the brackets. Send.

### Pattern 1 — Write Test Cases
```
You are a senior QA engineer.
Application: [name and one-sentence description]
Feature: [feature name and what it does]

Write test cases covering:
- Happy path (valid inputs, flow completes successfully)
- Negative (invalid inputs, error states, validation messages)
- Boundary (min/max values, empty fields, character limits)
- Edge case (unusual but valid scenarios)

Format: Gherkin (Given/When/Then)
Scenario titles: [outcome] when [condition]
Then steps: exact observable result only — no vague language

Rules:
- No real credentials or PII — use placeholders
- One When action per step
- Flag missing information with ⚠ rather than skipping the test
```

### Pattern 2 — Write a Bug Report
```
You are a senior QA engineer.
Application: [name]
Environment: [browser, OS, build version]

Write a bug report for this defect:
[describe what happened in plain language]

Format:
- Title: [action] causes [result] on [page/feature]
- Severity: [your assessment: Critical/High/Medium/Low]
- Steps to reproduce: numbered list, one action per step
- Expected result: one sentence
- Actual result: one sentence
- Notes: [anything that helps the developer]

Rules:
- Title must state the action and the result
- Steps must be reproducible by someone who has never seen the bug
- No vague language in expected/actual result
```

### Pattern 3 — Review a User Story for Testability
```
You are a senior QA engineer.
Review this user story for testability issues:
[paste story]

Identify:
1. Missing acceptance criteria (conditions with no defined outcome)
2. Ambiguous requirements (terms that could mean more than one thing)
3. Untestable statements (no observable pass/fail condition)
4. Missing edge cases (boundary conditions not mentioned)

Format: numbered list. One issue per item.
For each issue: quote the problematic text, explain the problem, suggest a fix.
No praise. No general observations. Issues only.
```

### Pattern 4 — Write an Exploratory Test Charter
```
You are a senior QA engineer.
Application: [name]
Feature to explore: [feature name and description]
Session duration: [e.g., 60 minutes]
Risk areas: [what is most likely to break or cause problems]

Write an exploratory test charter.

Format:
- Explore: [what area to explore]
- With: [what data, tools, or conditions to use]
- To discover: [what risks or questions to investigate]
- Debrief notes section: [blank — for tester to fill in]

Write 3 charters for this feature. Focus on the risk areas listed.
```

### Pattern 5 — Estimate Sprint Testing Effort
```
You are a senior QA engineer.
Team context: [number of QA engineers], [manual/automated/both], [application type]

Estimate testing effort for each story below.
Include: test case writing, test execution, regression on affected areas.

Stories:
1. [story title — one sentence description]
2. [story title — one sentence description]
3. [story title — one sentence description]

Format: table
Columns: Story | What needs testing | Hours estimate | Key assumptions
No explanation outside the table.
```

---

## 2.5 Prompt Patterns — Test Automation

### Pattern 1 — Generate a Page Object
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

### Pattern 2 — Generate a Test Spec
```
You are a senior QA automation engineer.
Project: [name], Playwright + TypeScript.

Reference spec — follow this structure exactly:
[paste one existing spec]

Task: Write a spec for [feature name].
Test cases:
1. [happy path]
2. [negative case]
3. [edge case]

Rules:
- Use the custom fixture from the reference spec
- Tag happy path @smoke, all others @regression
- No raw page imports — fixtures only
```

### Pattern 3 — Debug a Failing Test
```
You are a senior QA automation engineer.

This test is failing:
Error: [paste exact error]
Test: [paste test code]
Page object: [paste page object]

Reason through:
1. What is causing this exact error
2. What the fix is and why it works

Then show the corrected code only. No explanation after the code.
```

### Pattern 4 — Generate Test Data
```
You are a senior QA automation engineer.
Feature: [form or feature name]

Fields:
- [field]: [type, constraints]

Generate:
- 3 valid data sets (happy path)
- 2 invalid data sets (one boundary, one type violation)
- 1 edge case (null, empty, or max-length)

Format: TypeScript object array named testData. No explanation.
```

### Pattern 5 — Code Review for Standards
```
You are a senior QA automation engineer.

Review this code for violations of our standards:
Rules:
1. [your rule 1]
2. [your rule 2]
3. [your rule 3]

Code: [paste code]

List violations only.
For each: the violating line → the rule broken → the corrected version.
No praise. No general suggestions.
```

---

## 2.6 Where Prompts Alone Hit a Ceiling

Prompt engineering is powerful for single, one-off tasks. But it has a ceiling.

If you are working on a project with specific conventions, prompts alone will not give you consistent output across sessions. The model does not remember yesterday's session. On Monday you added all five elements to your prompt and got correct output. On Tuesday you start fresh and must add them again. If you forget one element, the output is wrong.

The ceiling: prompts require you to remember and re-type your standards every session.

That is where context engineering begins — and eventually, where skills make context automatic.

---

## Chapter Summary

| Element | What It Does | What Breaks Without It |
|---------|-------------|----------------------|
| Role | Sets expertise level | Model writes for wrong audience |
| Context | Sets the environment | Model invents the application |
| Task | Specifies scope | Model guesses what to cover |
| Format | Specifies structure | Model makes style choices |
| Rules | Prevents violations | Model does technically correct but wrong things |

---

## Three Exercises to Try Today

1. Take a prompt you have used recently. Identify which of the five elements it was missing. Add the missing elements and compare the output.

2. Use Pattern 1 (Write Test Cases) on a real story from your current sprint. Compare the output to what you would have written manually.

3. Find a piece of output that was wrong or inconsistent. Identify which element, if added, would have prevented the problem.

---

→ [Chapter 3 — Context Engineering](03-context-engineering.md)

---

*← [Chapter 1](01-why-this-matters.md) | [Chapter 3 →](03-context-engineering.md)*
