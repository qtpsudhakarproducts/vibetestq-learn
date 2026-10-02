# Level 2 — Practice Guide
## Hands-On Assignments for Every Chapter

> **How this guide works**
>
> Every assignment uses your **real current work** — your actual application,
> your actual requirements, your actual test data needs. Where you need a
> sample application for exploration, use **Veg Cart** (the trainer's demo)
> or your own staging environment.
>
> Level 2 assignments build on each other. MCP must be working before
> Chapters 2–5. Do not skip Chapter 1 setup.
>
> **Tools used:**
> - 🤖 **Claude Desktop** — Claude with MCP access (not the browser)
> - 🌐 **Claude.ai** — browser Claude for tasks that do not need MCP
> - 💡 **GitHub Copilot** — inside VS Code
> - 🗂️ **VS Code** — your workspace and file manager
>
> **Before every session:** Have your current sprint open.
> Know what feature you are working on today.

---

---

# Chapter 1 — MCP in VS Code

## What You Will Practice
Installing, configuring, and verifying Local MCP — Filesystem MCP
and Playwright MCP — so Claude can read your project files and browse
a live application. This is the foundation every other Level 2 chapter
depends on.

## Before You Start
- VS Code open with your project folder
- Node.js installed — verify: open VS Code terminal → type `node --version`
  → should show a version number
- Claude Desktop installed (claude.ai/download)
- 20 minutes without interruption — this is a setup session

---

### Assignment 1.1 — Verify Your Node.js Environment 🗂️ VS Code Terminal

**What you are doing:** Confirming Node.js and npm are installed correctly
before attempting any MCP configuration.

**Step 1 — Open the VS Code terminal:**
Terminal menu → New Terminal (or Ctrl+` / Cmd+`)

**Step 2 — Run each command and note the output:**

```bash
node --version
```
Expected: `v18.x.x` or higher

```bash
npm --version
```
Expected: `9.x.x` or higher

```bash
npx --version
```
Expected: A version number

**Step 3 — If any command shows "not found" or an error:**
- Download Node.js LTS from nodejs.org
- Install it with all default settings
- Close and reopen VS Code terminal
- Run the checks again

**Expected output:** Three version numbers — all showing successfully.

**How to know it worked:** All three commands return version numbers
with no errors.

---

### Assignment 1.2 — Configure Filesystem MCP 🗂️ VS Code + Claude Desktop

**What you are doing:** Connecting Claude to your project folder so it
can read your files without you pasting their contents.

**Step 1 — Find your project path**

In the VS Code terminal, type:
```bash
pwd
```
This prints your current folder path. Copy it.
Example: `/Users/yourname/vegcart-qa` or `C:\Users\yourname\vegcart-qa`

**Step 2 — Find Claude Desktop's config file**

Open VS Code. Use File → Open File to navigate to:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

If the file does not exist, create it at that path with empty content `{}`.

**Step 3 — Add the Filesystem MCP configuration**

Replace the file contents with:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/YOUR/PROJECT/PATH/HERE"
      ]
    }
  }
}
```

Replace `/YOUR/PROJECT/PATH/HERE` with the path from Step 1.

**Step 4 — Restart Claude Desktop**
Close Claude Desktop completely. Reopen it.

**Step 5 — Verify it works**
Open a new conversation in Claude Desktop. Ask:

```
What files are in my project folder?
List them with their paths.
```

If the tools icon (🔨) appears and Claude lists your files — it works.

**Expected output:** Claude lists the files in your project folder.

**Troubleshooting:**
- No tools icon → JSON syntax error in config. Validate at jsonlint.com
- "Command not found" → Node.js not in PATH. Restart VS Code after installing Node
- Files not listed → Check the path in the config is exactly correct

---

### Assignment 1.3 — Configure Playwright MCP 🗂️ VS Code + Claude Desktop

**What you are doing:** Adding Playwright MCP so Claude can open a browser
and explore a live application.

**Step 1 — Open your config file again**
File: `claude_desktop_config.json` from Assignment 1.2

**Step 2 — Add the Playwright MCP server alongside Filesystem:**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/YOUR/PROJECT/PATH/HERE"
      ]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"]
    }
  }
}
```

**Step 3 — Restart Claude Desktop**

**Step 4 — Verify Playwright MCP works**
Open a new conversation in Claude Desktop. Send:

```
Open google.com in a browser.
Search for "what is software testing".
Tell me the title of the first search result.
```

Claude should open a browser, perform the search, and report the result.

**Expected output:** Claude reports a search result title from Google.

**How to know it worked:** Claude opens an actual browser window
(you will see it appear) and reports what it found.

> **Note:** The first time Playwright MCP runs, it may take 1–2 minutes
> to download browser binaries. This is normal.

---

### Assignment 1.4 — Filesystem MCP in Action 🤖 Claude Desktop

**What you are doing:** Using Filesystem MCP to have Claude read your
actual project files — replacing the copy-paste workflow from Level 1.

**Step 1 — Make sure you have at least one file in your project folder.**
If your project folder is empty, create a simple text file:
`test-notes.md` with a few lines about your current feature.

**Step 2 — Open Claude Desktop. Send:**

```
Read the file [filename] in my project folder.
Summarise what it contains.
```

Use an actual filename from your project — a test case file, a requirements
note, or the skills.md from Level 1.

**Step 3 — Now send this:**

```
Based on what you read, what are 3 things a QA engineer would want
to verify about this feature?
```

Note: Claude is answering based on what it read from your file —
not from what you typed in the chat.

**Step 4 — The full power test**

If you have your Skills.md from Level 1 in `.claude/skills.md`, send:

```
Read the .claude/skills.md file.
Confirm you understand the project conventions.
Then write 3 test cases for the most recently discussed feature,
following those conventions exactly.
```

**Expected output:** Claude reads your file and produces output that
reflects what is in that file — without you pasting the content.

---

### Assignment 1.5 — Understand the Three MCP Types 🌐 Claude.ai

**What you are doing:** Mapping the three MCP types to your actual
toolchain so you know which type applies to each tool you use.

**Open Claude.ai (browser). Send:**

```
I am a QA engineer. My team uses the following tools:
- [List your team's tools: e.g. Jira, Confluence, GitHub, TestRail,
  Slack, Azure DevOps, etc.]

For each tool, tell me:
1. Which MCP type applies (Local MCP, Remote MCP, or Web Connector)?
2. Whether a public MCP server exists for it
3. How I would connect it to Claude

Also tell me which of these I can connect to Claude.ai directly in
my browser without Claude Desktop.
```

Review the response. For each tool your team uses, mark:
- ✅ I can connect this now
- 🔜 I could connect this with more setup
- ❌ Not possible / not relevant

**Expected output:** A personal MCP connection map for your toolchain.

---

### Chapter 1 Reflection

1. Before MCP: how long did it take to give Claude context about a file?
   After MCP: how long does the same task take?
   What does this mean for your daily workflow?

2. Which Web Connectors from Assignment 1.5 would give you the most value
   if you connected them today?

---

---

# Chapter 2 — Requirements Analysis & Test Case Design with Gherkin

## What You Will Practice
Using Claude to detect gaps in real requirements, generate complete
Gherkin feature files, and review AI-generated scenarios against your
application's actual behaviour. You will produce real `.feature` files
for your current sprint.

## Before You Start
- Filesystem MCP working (from Chapter 1)
- Claude Desktop open
- Your current sprint requirements open — pick 1–2 features
- Your skills.md loaded or ready to paste

---

### Assignment 2.1 — Ambiguity Detection on a Real Requirement 🤖 Claude Desktop

**What you are doing:** Running a real requirement through the ambiguity
detection process — finding gaps before development starts.

**Step 1 — Choose a requirement from your current sprint**
Pick one that you think might have gaps. If your requirements are very
detailed, pick one from a previous sprint where bugs were found —
those almost always had ambiguous requirements.

**Step 2 — Open Claude Desktop. Send:**

```
Act as a senior QA engineer reviewing a requirement for testability
before development begins.

Application context:
[Paste your skills.md project context, or describe your app in 3 sentences]

Requirement:
[Paste the requirement exactly as written]

Identify and list:

1. AMBIGUOUS TERMS
   Words with more than one possible interpretation.
   What does it mean? What else could it mean?

2. MISSING ACCEPTANCE CRITERIA
   Scenarios the requirement does not address.

3. EDGE CASES NOT COVERED
   Boundary conditions, error states, empty states, concurrent
   user actions, or unusual but realistic behaviours.

4. QUESTIONS FOR THE PRODUCT MANAGER
   Things a developer would need to know before building this.

Return as a numbered list under each heading.
```

**Step 3 — Work through the output:**

For each gap identified, mark it as:
- **Answer known** — you know the answer from your application knowledge. Write it.
- **Needs clarification** — take it to your PM or BA
- **Wrong** — Claude misunderstood the requirement. Note why.

**Step 4 — For every "Needs clarification" item:**
Write it as a formal question you will send to your PM:
```
Q: [The question]
Context: [Why this matters for testing]
Impact if unclear: [What goes wrong if this is not defined]
```

**Expected output:** A gap analysis for a real requirement, with your
answers and the questions that need stakeholder input.

**How to know it worked:** You found at least one gap that you will now
take to a stakeholder — or at least one you can answer yourself but had
not explicitly thought about.

---

### Assignment 2.2 — Generate a Gherkin Feature File 🤖 Claude Desktop

**What you are doing:** Taking a requirements document (from your project
or a clarified version from Assignment 2.1) and generating a complete
Gherkin `.feature` file ready for Cucumber in Level 3.

**Step 1 — Use the requirement from Assignment 2.1, now with the gaps filled**

**Step 2 — Open Claude Desktop. Send:**

```
Act as a BDD practitioner writing Gherkin feature files for
[your application type].

Application context:
[Paste your skills.md project context]

Feature: [Feature name]

Business rules:
[List all the rules — from the original requirement plus any
clarifications from Assignment 2.1]

Write a complete Gherkin .feature file that covers:
- The main happy path
- All validation error scenarios
- Boundary value scenarios for any numeric or length-limited fields
- Empty field handling for required fields
- Any edge cases identified in the ambiguity review

Rules for the Gherkin:
- Use a Background section for preconditions shared by all scenarios
- Use Scenario Outline with Examples table where the same scenario
  structure applies to multiple data values
- Then steps must include the specific expected message or value —
  not just "an error should appear"
- Steps should describe user behaviour, not UI implementation
  (say "I submit the form", not "I click the blue Submit button")
```

**Step 3 — Review the output using this checklist:**

```
For each Scenario:
[ ] Name describes what is being tested (not just "Test X")
[ ] Given sets up a specific, realistic precondition
[ ] When describes one clear user action
[ ] Then includes a specific, assertable expected outcome
[ ] Negative scenarios are included alongside positive ones

For the whole file:
[ ] Background is correct — ALL scenarios need those preconditions
[ ] Scenario Outline is used where multiple data rows apply
[ ] Examples table covers boundaries (not just happy-path values)
[ ] No UI selectors or element IDs mentioned in steps
```

**Step 4 — Fix the issues you found using follow-up prompts:**

For vague Then steps:
```
Scenario [number]: The Then step says "an error should appear."
In our application, the exact error message is "[actual message]".
Update this Then step to be specific.
```

For missing scenarios:
```
This feature also needs a scenario for [specific case you identified].
The business rule is [rule]. Add this scenario to the feature file.
```

**Step 5 — Save the file**
In VS Code, create a new file in your `features/` folder:
`[feature-name].feature`
Paste the final, reviewed Gherkin into it.

**Expected output:** A `.feature` file saved in your project, reviewed
against your actual application, ready for Cucumber in Level 3.

---

### Assignment 2.3 — Tabular Test Cases for Jira 🤖 Claude Desktop

**What you are doing:** Generating tabular test cases from the same
requirement — so you have both formats: Gherkin for automation (Level 3)
and tabular for Jira manual execution.

**Step 1 — Open Claude Desktop. In a new conversation, send:**

```
Act as a senior QA engineer for [your application].

[Paste your skills.md context]

Feature: [Feature name]
Rules: [Paste the business rules]

Write [number] test cases covering:
- All happy path scenarios
- All validation failures
- All boundary values
- Empty/null required fields
- Any edge cases from the ambiguity review

Return as a markdown table with columns:
ID | Test Case Name | Preconditions | Steps | Expected Result | Priority (High/Medium/Low)
```

**Step 2 — For each test case, check:**
- Does this scenario exist in our actual application?
- Is the expected result specific enough to be pass/fail?
- Is Priority correctly assigned (High = business-critical, Medium = important, Low = edge case)?

**Step 3 — Save the file**
`test-cases/[feature]-test-cases.md`

**Expected output:** A Jira-ready test suite in markdown table format.

---

### Assignment 2.4 — Compare Your Feature File to Your Test Cases 🤖 Claude Desktop

**What you are doing:** Using Claude to check whether your Gherkin file
and your tabular test cases cover the same ground — finding gaps between
the two formats.

**Open Claude Desktop. Send:**

```
I have two representations of the same feature's test coverage.

Gherkin feature file:
[Paste your .feature file from Assignment 2.2]

Tabular test cases:
[Paste your table from Assignment 2.3]

Identify:
1. Scenarios covered in the Gherkin but missing from the table
2. Scenarios covered in the table but missing from the Gherkin
3. Any scenario where the expected result differs between the two
4. Any test cases in the table that would be difficult to automate
   from the Gherkin (because the steps are too vague)
```

Review the gaps. Update both files so they are consistent.

**Expected output:** Both files updated and aligned. A note on any
scenarios you decided to keep only in one format and why.

---

### Chapter 2 Reflection

1. Which gap from Assignment 2.1 surprised you the most?
   Would you have caught it without AI analysis?

2. After reviewing the Gherkin output — which mistake did AI make
   most consistently? Vague Then steps? Missing negative scenarios?
   Over-specific UI references?
   Add a rule to your Skills.md to prevent that mistake in future.

---

---

# Chapter 3 — Exploratory Testing with MCP & AI Agents

## What You Will Practice
Writing exploration charters, directing Claude via Playwright MCP to
explore a live application, capturing findings in a structured format,
and saving exploration logs to your repository.

## Before You Start
- Playwright MCP working (from Chapter 1)
- Claude Desktop open
- Access to at least one application you can browse:
  - Your own staging or test environment, OR
  - A publicly accessible demo application (ask your trainer for Veg Cart URL)
- Your skills.md loaded

---

### Assignment 3.1 — Write Three Exploration Charters 🗂️ VS Code

**What you are doing:** Practising charter writing before sending anything
to AI — because the quality of the charter determines the quality
of the exploration output.

**Step 1 — Choose three areas of your application to explore:**
- One user-facing workflow (checkout, booking, registration, order placement)
- One validation-heavy feature (form with multiple rules)
- One area where bugs have occurred before

**Step 2 — For each area, write a charter using this template in VS Code.**
Create `exploration/charter-template.md`:

```markdown
## Charter: [Area name]
**Application area:** [Specific page or workflow]
**Time box:** [15 / 20 / 30 minutes]
**What we are investigating:**
- [Specific scenario or risk 1]
- [Specific scenario or risk 2]
- [Specific scenario or risk 3]
- [Specific scenario or risk 4]
**What counts as unexpected:**
[Describe what would make you raise a bug — wrong message,
wrong value, missing validation, incorrect calculation, etc.]
**Output expected:**
Structured findings report with screenshot references for
any unexpected behaviour.
```

**Step 3 — Review each charter against this quality checklist:**
- [ ] Is the focus area specific enough? ("The cart" is too broad. "Adding items at the quantity boundary" is specific.)
- [ ] Are the investigation items testable? (Can Claude actually try each one?)
- [ ] Is "what counts as unexpected" clearly defined?
- [ ] Is the time box realistic for the number of scenarios?

**Step 4 — Save all three charters as separate files:**
- `exploration/charter-01-[workflow-name].md`
- `exploration/charter-02-[validation-feature].md`
- `exploration/charter-03-[bug-prone-area].md`

**Expected output:** Three well-structured exploration charters
saved in your project.

---

### Assignment 3.2 — Run Your First Playwright MCP Exploration 🤖 Claude Desktop

**What you are doing:** Giving your first charter to Claude with
Playwright MCP and reviewing the structured findings it produces.

**Step 1 — Choose your simplest charter from Assignment 3.1**
Start with the validation-heavy feature — it is the most predictable
and easiest to verify.

**Step 2 — Open Claude Desktop. Send this prompt:**

```
You are a QA engineer conducting exploratory testing.

Application: [Name and brief description — 2 sentences]
URL: [Your staging or test URL]
[If login required: Test account: email: [test email] password: [test password]]

Your charter:
[Paste your charter from Assignment 3.1]

For each scenario in the charter:
1. Navigate to the relevant page
2. Perform the action
3. Note exactly what you observe — including any text, error messages,
   values shown, or UI behaviour
4. Take note if the behaviour seems unexpected or inconsistent with
   the stated business rules
5. Mark the status: ✅ As expected | ⚠️ Needs review | ❌ Potential bug

At the end, provide a structured report with:
- Summary (total scenarios explored, issues found)
- Findings (one section per scenario)
- Suggested test cases to automate
```

**Step 3 — Watch Claude work**
A browser window will open. Claude will navigate and interact.
Do not close it. Let the exploration complete.

**Step 4 — Read the report carefully.**

For each finding, apply your QA judgement:
- ✅ Claude marked as expected — do you agree?
- ⚠️ Claude flagged for review — is this actually a bug or expected behaviour?
- ❌ Claude found a potential bug — reproduce it yourself to confirm

**Expected output:** A structured exploration report from Claude
with your judgement annotations added.

---

### Assignment 3.3 — Human vs AI Exploration Comparison 🤖 Claude Desktop + Manual

**What you are doing:** Running the same charter both manually and with
Claude — then comparing what each found. This is the most important
assignment in Chapter 3.

**Step 1 — Choose a different charter from Assignment 3.1**
Use the user-facing workflow (checkout / booking / registration).

**Step 2 — Explore it manually for 15 minutes**
Use your application directly. Take notes as you go:
- What you tried
- What you observed
- What seemed unexpected
- What edge cases you noticed

**Step 3 — Run the same charter with Claude Playwright MCP**
Use the same prompt structure from Assignment 3.2.

**Step 4 — Compare the two sessions:**

| | Your manual exploration | Claude's exploration |
|---|---|---|
| Time taken | | |
| Scenarios covered | | |
| Bugs / issues found | | |
| Edge cases tried | | |
| What was missed | | |

**Step 5 — Answer these questions:**

- What did you find that Claude missed?
  (This is where your domain knowledge matters)
- What did Claude find that you would have eventually found?
  (This is where AI speed matters)
- What did Claude try that you would not have thought of?
  (This is where breadth matters)
- What did Claude get wrong about expected behaviour?
  (This is where your application knowledge is irreplaceable)

**Expected output:** A comparison table plus written answers to the
four questions above.

**How to know it worked:** You identified at least one thing you caught
that Claude missed. That thing exists because of your domain knowledge —
the understanding of your application that AI does not have.

---

### Assignment 3.4 — Create a Structured Exploration Log 🗂️ VS Code

**What you are doing:** Taking the raw findings from Assignment 3.2
and turning them into a structured exploration log that will feed
Level 3 automation generation.

**Step 1 — Create a new file:**
`exploration/session-01-[feature-name]-[date].md`

**Step 2 — Use this structure:**

```markdown
# Exploration Session: [Feature Name]
**Date:** [today]
**Charter:** [Paste charter title and focus areas]
**Conducted by:** Claude (Playwright MCP) + [Your Name] (review)
**Duration:** [approx minutes]

## Summary
Explored [N] scenarios. Found [N] potential bugs, [N] as expected,
[N] needing clarification.

## Findings

### [SCENARIO-ID]: [Scenario Name]
**Status:** ✅ As expected / ⚠️ Needs review / ❌ Potential bug
**Steps taken:** [What was done]
**Observed:** [Exactly what happened — include any messages, values, behaviour]
**Expected:** [What should have happened]
**Decision:** [What you decided — raise bug / add test / no action / clarify]
**Bug raised:** [Bug ID if raised, or N/A]

[Repeat for each scenario]

## Test Cases to Automate
Based on this session, the following scenarios should be automated:
- [Scenario 1 — why it is a good automation candidate]
- [Scenario 2]

## Open Questions
- [Anything that needs clarification before testing is complete]
```

**Step 3 — Fill it in from your Claude exploration report
and your manual notes from Assignment 3.3.**

**Step 4 — Save it. Commit it if you have git set up.**

**Expected output:** A structured exploration log saved in your repository,
ready to be read by the Planner agent in Level 3.

---

### Assignment 3.5 — Update Your Skills.md with Exploration Rules 🗂️ VS Code

**What you are doing:** Adding exploration conventions to your Skills.md
so Claude knows how you want exploration conducted every time.

**Step 1 — Open `.claude/skills.md`**

**Step 2 — Add a new section:**

```markdown
## Exploration Conventions
- Exploration logs are saved in /exploration/ as markdown files
- Each log file is named: session-[N]-[feature]-[date].md
- Status codes: ✅ As expected | ⚠️ Needs review | ❌ Potential bug
- Every Then step must include the exact UI text observed
- Screenshots are referenced as [screenshot-N.png] in findings
- Exploration sessions end with a "Test Cases to Automate" section

## Application Under Test
- Staging URL: [your staging URL]
- Test account (standard user): [email] / [password]
- Test account (admin): [email if different] / [password if different]
- Known stable areas (skip in exploration): [any areas that are stable/tested]
- Known unstable areas (focus exploration here): [any areas with recent bugs]
```

**Expected output:** An updated Skills.md with exploration conventions
and application access details.

---

### Chapter 3 Reflection

1. From Assignment 3.3 — what category of finding was Claude better at?
   What category were you better at?
   What does this mean for how you should design charters going forward?

2. After writing three charters — what made the better ones better?
   What would you change about the weaker ones now that you have
   seen the exploration output?

---

---

# Chapter 4 — Test Data Generation & Bug Reporting

## What You Will Practice
Generating synthetic test data for your application's field types,
writing professional bug reports from rough notes, and using AI for
root cause analysis and defect pattern detection.

## Before You Start
- Claude Desktop open (with Filesystem MCP)
- Claude.ai browser open (for some tasks)
- A real bug from your current sprint (or a recent one)
- Knowledge of your database field types and constraints
  (ask a developer if needed — field names, lengths, nullable or not)

---

### Assignment 4.1 — Generate JSON Test Data for Your Application 🌐 Claude.ai

**What you are doing:** Creating synthetic test data that matches your
application's field structure — so you never need to use real user data.

**Step 1 — Identify the main data entity you need test data for.**
Common examples:
- User / Customer records
- Order / Booking records
- Product / Item records
- Transaction records

**Step 2 — List the fields for that entity:**
Ask a developer or check your database schema. Note:
- Field name
- Data type (string, integer, date, boolean)
- Constraints (NOT NULL, max length, format requirements, valid range)
- Examples of realistic values

**Step 3 — Open Claude.ai. Send:**

```
Act as a QA data engineer for [your application name] —
[brief description of what it does].

Generate a JSON array of 10 [entity name] records with these fields:
[For each field list:]
- [field_name]: [type] — [constraints and format]
  Example realistic value: [give one example]

Requirements:
- All data must be entirely synthetic — no real people or organisations
- Names should be realistic [Indian / relevant region] names
- Include edge cases:
  - 1 record with maximum length values for string fields
  - 1 record with minimum valid values for numeric fields
  - 1 record with a Unicode character in a name field (e.g. accented letter)
- Email addresses must use test domains only (@testmail.qa or @qatest.in)
- Phone numbers must follow [your country] mobile format
```

**Step 4 — Review the generated data:**

For each field, check:
- Does the value match the field's format constraints?
- Is the value realistic (would a real user enter this)?
- Are the edge case records actually edge cases?

Fix any records that violate your field constraints with a follow-up:
```
Record [N]: The [field_name] value "[value]" violates our constraint
of [constraint]. Please fix it to [correct format].
```

**Step 5 — Save the file:**
`test-data/[entity-name]-test-data.json`

**Expected output:** A 10-record JSON file with realistic synthetic data
matching your application's field structure and constraints.

---

### Assignment 4.2 — Generate CSV Data for Data-Driven Testing 🌐 Claude.ai

**What you are doing:** Creating CSV test data for scenarios that need
multiple input variations — boundary values, valid/invalid inputs,
different user types.

**Step 1 — Choose a form in your application with validation rules.**
Good candidates: registration, login, search, booking form,
payment form, profile update.

**Step 2 — List the validation rules for each field.**
Example structure:
```
Field: Email
- Required: Yes
- Format: valid email format
- Uniqueness: must be unique in the system
- Max length: 100 characters

Field: Password
- Required: Yes
- Min length: 8 characters
- Must contain: 1 uppercase, 1 number
- Max length: 50 characters
```

**Step 3 — Open Claude.ai. Send:**

```
Act as a QA engineer creating data-driven test inputs for form validation.

Application: [name and description]

Form: [form name]

Field rules:
[Paste your field rules]

Generate a CSV file where each row represents one test input set.

Columns:
- test_id
- [one column per field]
- expected_result (valid_submission / error_[field_name])
- expected_error_message (exact message if error, empty if valid)
- test_scenario (brief description of what this row tests)

Include:
- 2 completely valid submissions (happy path)
- For each field: at least 1 row testing the minimum valid value
- For each field: at least 1 row testing the maximum valid value
- For each field: at least 1 row testing one step below minimum (invalid)
- For each field: at least 1 row testing one step above maximum (invalid)
- For each required field: 1 row with that field empty
- 1 row with all fields empty
- 2 rows with SQL injection attempts in text fields
- 1 row with a very long string in each text field
```

**Step 4 — Review the CSV:**
- Are the boundary values exactly right for your constraints?
- Are the expected error messages the exact text your application shows?
  (If not, update them — only you know the actual messages)
- Are the SQL injection test values realistic?

**Step 5 — Save the file:**
`test-data/[form-name]-validation-data.csv`

**Expected output:** A CSV file with boundary-covering, edge-case-including
test data ready for data-driven test execution.

---

### Assignment 4.3 — Generate SQL Seed Data 🌐 Claude.ai

**What you are doing:** Creating SQL INSERT statements to put your
test database into specific states that are needed before testing.

**Step 1 — Identify the states you need for testing.**
Common needs:
- A user who has never placed an order (to test first-order flow)
- A user whose account is locked (to test lockout)
- A coupon that has been used (to test reuse prevention)
- An item that is out of stock (to test out-of-stock behaviour)
- A booking that was cancelled (to test cancellation flow)

**Step 2 — Get the table structure from a developer or your schema.**
You need: table name, column names, data types.

**Step 3 — Open Claude.ai. Send:**

```
Act as a QA data engineer.

Table structure:
[Paste the CREATE TABLE statement or describe the columns]

I need SQL INSERT statements to create these specific test states:

1. [State 1 — describe what record is needed and why]
2. [State 2]
3. [State 3]
4. [Add as many as you need]

Rules:
- All test data must be synthetic
- Use clear test identifiers (e.g. test account emails ending in @testmail.qa)
- Add a comment above each INSERT explaining what test state it creates
- Use realistic values for all other fields
```

**Step 4 — Review each INSERT:**
- Would this record put the application in exactly the state you need?
- Are there foreign key constraints — does the record reference other
  tables that also need seed data?

**Step 5 — Save:**
`test-data/[feature]-seed-data.sql`

**Expected output:** SQL INSERT statements with comments explaining
each test state they create.

---

### Assignment 4.4 — Bug Report from Rough Notes 🤖 Claude Desktop

**What you are doing:** Taking your roughest, most unstructured bug
notes and generating a professional, Jira-ready bug report.

**Step 1 — Choose a real bug from this sprint or last sprint.**
If you do not have a current bug, recall the last significant bug you found.

**Step 2 — Write your rough notes exactly as you captured them:**
Do not clean them up. The messier the better — this tests the prompt.
Example: "search doesn't work when you type a number, tried 3 different
numbers all just said no results but they exist, only on mobile, desktop fine"

**Step 3 — Open Claude Desktop. Send:**

```
Act as an experienced QA engineer writing a professional Jira bug report.

Read my skills.md for application context.

I observed this issue while testing:
[Paste your rough notes exactly as written]

Additional context I can provide:
- This was on: [device/browser/OS]
- I was logged in as: [user type — admin/standard/guest]
- The environment was: [staging/production/dev]
- This happened: [consistently/intermittently/once]

Write a complete professional bug report with these sections:
1. Summary — one line starting with the affected component
2. Environment — all technical details
3. Steps to Reproduce — numbered steps anyone can follow
4. Expected Result — what should happen (reference the business rule)
5. Actual Result — exactly what happens including any text or values shown
6. Severity — Critical/High/Medium/Low with business impact justification
7. Root Cause Hypothesis — what you think is technically wrong
8. Notes — frequency, related issues, screenshots to attach
```

**Step 4 — Apply the bug report review checklist:**

```
[ ] Can you follow Steps to Reproduce from zero and reproduce the bug?
[ ] Does Expected Result reference the business rule being violated?
[ ] Does Actual Result mention the exact error text or value shown?
[ ] Is Severity justified by business impact (not technical complexity)?
[ ] Does Root Cause Hypothesis give a developer a starting point?
[ ] Are all screenshots or logs referenced in Notes?
```

Fix any gap with a follow-up prompt.

**Step 5 — Save:**
`bugs/BUG-[date]-[feature]-[short-description].md`

**Expected output:** A polished, complete bug report ready for Jira —
generated from rough notes in under 5 minutes.

---

### Assignment 4.5 — Root Cause Analysis 🤖 Claude Desktop

**What you are doing:** Using Claude to generate root cause hypotheses
for a real bug — giving your developer a starting point for investigation.

**Step 1 — Use the bug from Assignment 4.4.**

**Step 2 — Gather everything you have about the bug:**
- What you observed (from the bug report)
- Any error messages from the browser console
- Any network request errors (from the browser's Network tab)
- Any log entries you have access to

**Step 3 — Open Claude Desktop. Send:**

```
Act as a senior QA engineer doing root cause analysis.

Bug summary: [one line description]

What I observed:
[Describe the bug behaviour in detail]

Error information (if available):
Browser console: [paste any console errors]
Network tab: [paste any failed API calls — method, endpoint, status code]
Application logs: [paste if accessible]

For this type of bug in a [describe your application type] application,
what are the most likely root causes?

List them in order of probability. For each one:
- What the cause is
- Why it would produce the observed behaviour
- Where a developer would look to confirm it
```

**Step 4 — Add the root cause hypothesis to your bug report:**
Update `bugs/BUG-[date]-[feature]-[description].md`
with the most likely root cause from Claude's analysis.

**Expected output:** A root cause hypothesis added to your bug report,
with at least 2–3 possible causes ranked by probability.

---

### Assignment 4.6 — Responsible Use Check for Your Test Data 🌐 Claude.ai

**What you are doing:** Verifying that all test data you generated this
week is truly synthetic — no real personal data accidentally included.

**Step 1 — Open all test data files you created this week.**

**Step 2 — For each file, open Claude.ai and send:**

```
I am checking this test data file for accidentally included real
personal information. This is a DPDP Act compliance check.

Scan this data and flag:
1. Any email addresses that appear to be real (not test domains)
2. Any phone numbers that match real patterns suspiciously precisely
3. Any names that appear to be real people rather than synthetic
4. Any addresses that appear to be real rather than fictional
5. Any IDs or account numbers that might be real system values

[Paste the test data]
```

**Step 3 — Fix any flagged items.**
Replace real-looking values with clearly synthetic ones:
- Emails: use `@testmail.qa` or `@qatest.in`
- Names: verify they are not real people (simple Google check)
- Addresses: ensure they are fictional (non-existent building numbers)

**Step 4 — Add a data compliance note to your Skills.md:**

```markdown
## Data Privacy Rules
- All test data uses synthetic values only
- Email domains: @testmail.qa or @qatest.in
- Phone numbers: use +91 99999 XXXXX format with sequential last digits
- Names: verified as non-real using [your chosen method]
- No production data is ever used in test environments
- DPDP Act applies to this project — no real Indian resident PII in test data
```

**Expected output:** Clean test data files with no real personal
information, plus a privacy rule added to Skills.md.

---

### Chapter 4 Reflection

1. Compare the bug report you got from rough notes to what you would
   have written in the same time. What specific sections improved most?

2. After the root cause analysis — did Claude identify any causes
   you had not considered? Were any of them plausible?

3. Looking at your test data — what constraints did you include
   that you would have forgotten to specify without being prompted?

---

---

# Chapter 5 — AI Testing Toolkit Organisation

## What You Will Practice
Organising everything you have built in Level 2 into a structured,
repository-first AI testing toolkit. Updating your Skills.md to its
final Level 2 state. Understanding how every artifact you built connects
to Level 3 automation.

## Before You Start
- All Level 2 artifacts created (feature files, test data, exploration
  logs, bug reports, prompts from each chapter)
- VS Code open with your project folder
- Claude Desktop open with Filesystem MCP active

---

### Assignment 5.1 — Create the Full Folder Structure 🗂️ VS Code

**What you are doing:** Establishing the complete folder structure that
will scale through Level 3 and Level 4.

**Step 1 — In VS Code Explorer, create this structure.**
Right-click in the Explorer panel → New Folder for each:

```
[projectname]-qa-toolkit/
├── .claude/
├── requirements/
├── features/
├── test-cases/
├── test-data/
├── exploration/
├── bugs/
├── prompts/
└── quality-docs/
```

**Step 2 — Create a `.gitkeep` file in each empty folder.**
In VS Code terminal:

```bash
find . -type d -empty -not -path "./.git/*" -exec touch {}/.gitkeep \;
```

This ensures empty folders are tracked by git.

**Step 3 — Create a `README.md` in the root of your project.**

Open Claude Desktop. Send:

```
Read my skills.md file.

Based on the project context and conventions you find there,
write a README.md for this QA project repository.

The README should explain:
1. What this project is (one paragraph)
2. The folder structure and what belongs in each folder
3. How to use the Skills.md with Claude Desktop
4. How to run prompts from the prompts/ folder
5. The naming conventions for each file type

Keep it practical and concise — this is for team members joining
the project, not a marketing document.
```

Save the output as `README.md` in your project root.

**Expected output:** A complete folder structure with README.md
describing how everything works.

---

### Assignment 5.2 — Organise All Level 2 Artifacts 🗂️ VS Code

**What you are doing:** Moving every artifact you created in Level 2
into the correct folder, with consistent naming.

**Step 1 — Use this checklist to move or create each artifact:**

```
.claude/
└── skills.md ✓ (from Level 1 + updates across Level 2)

requirements/
└── REQ-[feature-name].md (create for each requirement you worked with)
   Content: the original requirement + clarifications from Chapter 2

features/
└── [feature-name].feature (from Chapter 2 Assignment 2.2)

test-cases/
└── [feature-name]-test-cases.md (from Chapter 2 Assignment 2.3)

test-data/
├── [entity]-test-data.json (from Chapter 4 Assignment 4.1)
├── [form]-validation-data.csv (from Chapter 4 Assignment 4.2)
└── [feature]-seed-data.sql (from Chapter 4 Assignment 4.3)

exploration/
└── session-01-[feature]-[date].md (from Chapter 3 Assignment 3.4)

bugs/
└── BUG-[date]-[feature]-[description].md (from Chapter 4 Assignment 4.4)

prompts/
├── requirements-ambiguity-review.md
├── gherkin-feature-file-generation.md
├── test-data-json-generation.md
├── test-data-csv-generation.md
├── bug-report-from-notes.md
└── root-cause-analysis.md

quality-docs/
└── coverage-notes-[sprint].md (create now — see Assignment 5.3)
```

**Step 2 — For any missing prompt files:**
Open your chat history from this week. Find the prompts that produced
the best output. Save each one as a `.md` file in `prompts/`
using the format from the Level 1 prompt library.

**Step 3 — Rename any files that do not follow the naming convention.**
Rules:
- All lowercase
- Words separated by hyphens
- Feature name matches across related files
  (e.g. `coupon.feature`, `coupon-test-cases.md`, `coupon-seed-data.sql`)

**Expected output:** A fully populated project folder with every
artifact named consistently and in the correct location.

---

### Assignment 5.3 — Write Your Sprint Coverage Notes 🤖 Claude Desktop

**What you are doing:** Creating your first coverage document — a record
of what was tested this sprint, what was not, and why.

**Step 1 — Think about what you tested this week.**

**Step 2 — Open Claude Desktop. Send:**

```
Act as a senior QA engineer writing a sprint coverage summary.

Read my skills.md for application context.

This sprint we worked on the following features:
[List the features you tested]

Test coverage achieved:
[Describe what you tested — which scenarios, which formats]

Known gaps (not tested this sprint):
[List what was not tested and why — time constraints, blocked by dev,
outside sprint scope, etc.]

Risk assessment:
[Any untested areas that concern you from a quality perspective]

Write a sprint coverage summary in this structure:
1. Features tested (with brief coverage description)
2. Test artifacts produced (feature files, test cases, test data)
3. Known gaps and why they exist
4. Risk assessment — what could go wrong in what we did not test
5. Recommended carry-forward to next sprint
```

**Step 3 — Save:**
`quality-docs/coverage-sprint-[date].md`

**Expected output:** A sprint coverage document that creates a traceable
record of what was tested and what risk remains.

---

### Assignment 5.4 — Finalise Your Level 2 Skills.md 🤖 Claude Desktop + 🗂️ VS Code

**What you are doing:** Bringing your Skills.md to its final Level 2 state —
incorporating everything you learned across the five chapters.

**Step 1 — Open `.claude/skills.md` in VS Code.**

**Step 2 — Review it against this checklist:**

```
Project Context section:
[ ] Describes what the application does
[ ] Mentions the main features relevant to testing
[ ] Identifies the primary users
[ ] Notes the technology stack (even if high-level)

Test Conventions section:
[ ] Language and framework specified
[ ] Folder structure documented
[ ] File naming conventions documented
[ ] Bug tracking tool noted
[ ] Test management tool noted

MCP section (NEW in Level 2):
[ ] Staging URL included
[ ] Test account credentials (test accounts only — never production)
[ ] Filesystem MCP path confirmed
[ ] Known stable areas noted (to skip in exploration)
[ ] Known unstable areas noted (to focus exploration)

Gherkin Conventions section (NEW in Level 2):
[ ] Background usage rule
[ ] Scenario Outline rule
[ ] Then step specificity rule
[ ] Step behaviour-not-UI rule

AI Rules section:
[ ] At least 6 rules
[ ] Rules are specific to YOUR application, not generic
[ ] Rules fix mistakes you actually observed in Chapters 1–4

Data Privacy section (NEW in Level 2):
[ ] Synthetic data rule
[ ] Test email domain specified
[ ] DPDP compliance note

Exploration Conventions section (NEW in Level 2):
[ ] Exploration log format and location
[ ] Status codes used
[ ] Application access details
```

**Step 3 — For each missing item, add it.**
Use Claude to help draft sections you are unsure about:

```
I need to add a [section name] to my skills.md.

[Describe what you want it to say]

Write this section in the same style as my existing skills.md
which currently says: [paste current skills.md]
```

**Step 4 — Save the final Skills.md.**

**Expected output:** A complete, comprehensive Skills.md that a new
team member or AI agent could read and immediately understand your
project, conventions, and how to work on it.

---

### Assignment 5.5 — Version Your Prompts 🗂️ VS Code

**What you are doing:** Properly versioning the prompts from Level 2
so they are findable, reusable, and improvable over time.

**Step 1 — Open each file in `prompts/`.**

**Step 2 — For each prompt file, add this header:**

```markdown
# Prompt: [Descriptive name]

## When to Use
[One sentence describing the situation]

## Prerequisites
[What you need to have ready before using this prompt:
e.g. "The requirement must have been ambiguity-checked first"]

## Context to Add at the Top
[What application-specific content to add before the prompt:
e.g. "Paste skills.md project context + the specific feature rules"]

## The Prompt
[The actual prompt — ready to copy]

## Expected Output
[What a good output looks like]

## Common Issues
[What goes wrong and how to fix it with follow-up prompts]

## Version History
- v1.0 [date]: Initial version
```

**Step 3 — Fill in the Common Issues section from your experience.**
What went wrong when you used this prompt this week?
What follow-up prompts fixed it?

**Expected output:** 6 prompt files with full documentation headers.

---

### Assignment 5.6 — The Level 3 Bridge Test 🤖 Claude Desktop

**What you are doing:** Verifying that your Level 2 artifacts are in the
right shape to feed Level 3 automation generation. This is the most
important quality check of the entire Level 2 toolkit.

**Step 1 — Open Claude Desktop. Send:**

```
Read all the files in my project folder.

I am about to start Level 3 of a QA training program where
AI agents will generate Playwright automation from my existing artifacts.

Review what I have built and tell me:

1. For each .feature file: are the scenarios specific enough
   to become Playwright assertions? Flag any Then steps that
   are too vague to automate.

2. For each test-data file: is the data structured correctly
   for use as Playwright test fixtures? Any format issues?

3. For the exploration logs: is there enough information about
   observed UI behaviour for an agent to generate locators?
   What additional detail would help?

4. Does my skills.md have enough information for an automation
   agent to follow my conventions?

5. What is the single most important thing I should fix or add
   before starting Level 3 automation generation?
```

**Step 2 — Work through Claude's feedback:**

For each issue raised:
- Fix vague Then steps in feature files (add exact messages and values)
- Fix test data format issues
- Add UI detail to exploration logs where needed
- Update skills.md with any missing automation conventions

**Step 3 — Re-run the check after fixing:**
```
I have made the following fixes: [list what you changed].
Please re-review and confirm the project is ready for Level 3.
```

**Expected output:** A confirmed-ready Level 2 toolkit with all
Then steps assertable, test data correctly formatted, and skills.md
covering automation conventions.

---

### Chapter 5 Reflection

1. Looking at your complete toolkit — which artifact took the most
   effort to get right? Which one produced the most value?

2. After the Level 3 Bridge Test — what was the most common issue
   Claude flagged? What does that tell you about your prompting
   style across Level 2?

3. If a new team member joined tomorrow and opened your repository —
   what would they be able to understand without asking you anything?
   What would they still need to ask?

---

---

# Level 2 — Final Checklist

## What You Have Built

By completing all assignments, you now have:

| Artifact | Location | Ready for |
|---|---|---|
| Filesystem MCP | Claude Desktop config | Reading project files automatically |
| Playwright MCP | Claude Desktop config | AI-assisted exploratory testing |
| Feature files | `features/*.feature` | Cucumber BDD in Level 3 |
| Tabular test cases | `test-cases/*.md` | Jira test management |
| JSON test data | `test-data/*.json` | Playwright fixtures in Level 3 |
| CSV test data | `test-data/*.csv` | Data-driven test execution |
| SQL seed data | `test-data/*.sql` | Database setup before API tests |
| Exploration logs | `exploration/*.md` | Planner agent input in Level 3 |
| Bug reports | `bugs/*.md` | Regression test cases in Level 3 |
| Prompt library | `prompts/*.md` | Extended and reused in Level 3 |
| Coverage notes | `quality-docs/*.md` | Sprint quality record |
| Skills.md (Level 2) | `.claude/skills.md` | All AI agent context |

## What You Can Now Do

- Connect Claude to your project files via Filesystem MCP
- Connect Claude to a live application via Playwright MCP
- Detect requirement ambiguities before development starts
- Generate complete Gherkin feature files from business rules
- Run AI-assisted exploratory testing with structured capture
- Generate realistic synthetic test data (JSON, CSV, SQL)
- Write professional bug reports from rough notes in minutes
- Perform root cause analysis from error symptoms and logs
- Maintain a repository-first AI testing toolkit

## What Is Coming in Level 3

In Level 3 you will:
- Use the Planner agent to build test strategies from your exploration logs
- Use the Generator agent to write Playwright POM classes from your feature files
- Use the Healer agent to maintain automation when the UI changes
- Connect your Gherkin feature files to Cucumber BDD step definitions
- Run API tests against your application's endpoints
- Build a GitHub Actions CI pipeline that runs everything automatically

Every artifact you built in Level 2 is a direct input to Level 3.
Your feature files become Cucumber tests. Your test data becomes
Playwright fixtures. Your exploration logs become the Planner's input.
Your Skills.md guides every agent.

---

> **The system you built**
>
> You started Level 2 with a prompt library and a Skills.md.
> You leave Level 2 with a repository that AI agents can navigate,
> understand, and build on.
>
> That repository is not a collection of files. It is the beginning
> of a quality intelligence system that gets smarter every sprint
> as exploration findings, test decisions, and coverage notes
> accumulate in it.
>
> Level 3 puts that intelligence to work.
