# Level 1 — Practice Guide
## Hands-On Assignments for Every Chapter

> **How this guide works**
>
> Every assignment uses your **real current work** — your actual requirements,
> your actual bugs, your actual test cases. There are no toy exercises here.
> By the end of Level 1, you will have real deliverables from your real project,
> produced with AI.
>
> **Tools used:**
> - 🤖 **Claude.ai** — open claude.ai in your browser
> - 💡 **GitHub Copilot** — available inside VS Code (Chapter 5 onwards)
>
> **Before every session:** Have your current sprint open. Know what requirement
> or feature you are working on today. That is your practice material.

---

---

# Chapter 1 — Use AI Before You Learn About It

## What You Will Practice
Using Claude to generate test cases from a real requirement — before anyone
has explained how LLMs work. You will get output, use it, and notice what
is wrong with it. That experience is the lesson.

## Before You Start
- Open **claude.ai** in your browser and sign in
- Open your current sprint backlog or requirements document
- Pick **one requirement** you need to write test cases for this week
  (login, registration, search, form validation, checkout — anything real)
- Have the actual application open in another tab if possible

---

### Assignment 1.1 — Your First Test Cases with AI 🤖 Claude.ai

**What you are doing:** Asking Claude to write test cases for a real requirement.
No setup, no theory. Just ask.

**Step 1 — Open a new Claude conversation**
Go to claude.ai. Click "New chat."

**Step 2 — Type this prompt exactly as shown, replacing the bracketed parts:**

```
Write test cases for the following feature:

[Paste your requirement here — copy it exactly from your backlog or spec]

Return as a numbered list. Each test case should have:
- Test case name
- Steps
- Expected result
```

**Step 3 — Send it. Read every test case carefully.**

**Step 4 — Open your actual application (or think through it carefully).
For each test case, answer:**
- Does this field / button / behaviour actually exist in our app?
- Is this expected result correct for our application?
- Mark each test case: ✅ Correct | ⚠️ Partially right | ❌ Wrong or invented

**Step 5 — Count:**
- How many test cases did Claude generate?
- How many were correct?
- How many referenced something that does not exist in your app?

**Expected output:** A numbered list of test cases with your annotations.

**How to know it worked:** You found at least one thing Claude generated that
does not match your actual application. That thing is called hallucination.
That is the lesson.

> **If Claude generated everything correctly** — your requirement was very
> detailed and specific. Try Assignment 1.1 again with a vague requirement:
> just the feature name, no details. See what happens.

---

### Assignment 1.2 — Find the Gaps 🤖 Claude.ai

**What you are doing:** Asking Claude to review the same test cases it just
generated — and find what is missing. You will compare its answer to your
own judgement.

**Step 1 — In the same conversation (do not start a new one), type:**

```
Review the test cases you just generated.

What scenarios are missing? What edge cases did you not cover?
What negative scenarios (failure cases) are not included?

List the gaps.
```

**Step 2 — Read the gaps Claude identifies.**

**Step 3 — Now think for yourself:**
What gaps do YOU see that Claude did not mention?
Write them down.

**Step 4 — Compare your list to Claude's list.**

**Expected output:** Two gap lists — Claude's and yours. Note which ones overlap
and which ones are unique to each.

**How to know it worked:** You found at least one gap that Claude missed.
That gap came from your domain knowledge — your understanding of the specific
application you test. That is something Claude cannot replicate.

---

### Assignment 1.3 — The Collaborator vs Answer Machine Test 🤖 Claude.ai

**What you are doing:** Experiencing the difference between one-shot prompting
and iterative prompting on the same task.

**Step 1 — Open a brand new Claude conversation.**

**Step 2 — Send this minimal prompt:**
```
Write test cases for login.
```

**Step 3 — Note the output. How generic is it?**

**Step 4 — Open another brand new Claude conversation.**

**Step 5 — Send this detailed prompt:**
```
Write test cases for our login page.

Context: Our application is [describe your application in 2 sentences].
The login has email and password fields.
After 3 failed attempts the account is locked for 30 minutes.
Password reset is available by email link.

Write 8 test cases covering: successful login, wrong password,
account lockout, password reset, and empty fields.

Return as a numbered list with: test name, steps, expected result.
```

**Step 6 — Compare the two outputs side by side.**

**Expected output:** Two sets of test cases — one generic, one specific.

**How to know it worked:** The second set is noticeably more relevant to
your application than the first. The difference is context — not the AI model.

---

### Chapter 1 Reflection

Write your answers in a notepad or document. You will refer back to these.

1. What did Claude get wrong or invent about your application?
   Why did it do that?

2. What did you know about your application that Claude did not?
   Where did that knowledge come from?

3. Which mindset did Assignment 1.1 start with — collaborator or answer machine?
   What would you do differently now?

---

---

# Chapter 2 — The Disruption Is Already Here

## What You Will Practice
The collaborator mindset in action. You will take yesterday's output and
improve it through multiple rounds of prompting — the way a QA review cycle
works. By the end you will have a test suite that is ready to use.

## Before You Start
- Have the test cases from Assignment 1.1 open
- Have your requirement open
- Open **claude.ai** — you will continue in the same or a new conversation

---

### Assignment 2.1 — The Three-Round Improvement Loop 🤖 Claude.ai

**What you are doing:** Taking the raw test cases from Chapter 1 and running
them through three rounds of refinement. Each round improves a different aspect.

**Round 1 — Add the missing scenarios**

Open a new Claude conversation. Paste your requirement and the test cases
from Assignment 1.1. Then add:

```
The test cases above are missing some important scenarios.

Please add test cases for:
1. Any boundary values not covered (minimum and maximum values,
   character limits, date ranges, quantity limits — whatever applies)
2. Any error messages not tested (what exact text does the user see
   when something goes wrong?)
3. Any empty/null state not covered (what happens when required
   fields are blank?)

Add the missing test cases to the list. Keep the same format.
```

Read the additions. Mark which ones are correct for your application.

---

**Round 2 — Fix the wrong ones**

In the same conversation, identify 2–3 test cases that are incorrect
or too generic. Then type:

```
Test cases [list the numbers] are not quite right for our application.

[For each one, explain what is actually correct:]
TC-[X]: Our application actually does [correct behaviour]. Please fix this.
TC-[Y]: The error message in our app is "[exact text]" not what you wrote.
TC-[Z]: This field does not exist in our application — remove this test case.
```

---

**Round 3 — Format for your tool**

Now format the output for wherever your test cases need to go.

**If you use Jira:**
```
Reformat all test cases as a markdown table with these columns:
ID | Test Case Name | Preconditions | Steps | Expected Result | Priority
```

**If you use Excel or a spreadsheet:**
```
Reformat as a CSV with these columns:
ID, Test Case Name, Preconditions, Steps, Expected Result, Priority
```

**If you use another tool, describe its format:**
```
Reformat for [your tool]. The format should be: [describe what you need]
```

**Expected output:** A polished, formatted test suite that is ready to paste
into your actual test management tool.

**How to know it worked:** You can copy the output from Round 3 and paste it
directly into your tool without reformatting. This is what the Format component
of a prompt achieves.

---

### Assignment 2.2 — AI Reviews Your Writing 🤖 Claude.ai

**What you are doing:** Reversing the direction — instead of you reviewing AI's
output, AI reviews yours. This tests whether AI can add value to work you
already did.

**Step 1 — Find a test case or test plan you wrote recently
(last sprint, last month — anything real and yours).**

**Step 2 — Open a new Claude conversation. Type:**

```
Act as a QA lead reviewing a test engineer's work.

Below are test cases I wrote for [feature name] on [brief description
of the application].

Review them and identify:
1. Scenarios that are missing or incomplete
2. Expected results that are too vague to be useful
3. Test cases that are near-duplicates
4. Any business rules that have no test coverage

[Paste your test cases]
```

**Step 3 — Read the review. For each point Claude raises, decide:**
- Valid — I should fix this
- Wrong — Claude does not understand our application
- Interesting — I had not considered this

**Step 4 — Fix the valid ones. Add them back to your test suite.**

**Expected output:** Your original test cases plus Claude's review notes
plus your decisions on each point.

**How to know it worked:** At least one valid gap was identified that you
will now add to your test suite. That gap exists in real coverage
that would have been missed without this review.

---

### Assignment 2.3 — Map Your Old Skills to New Skills 🤖 Claude.ai

**What you are doing:** A personal skills audit — understanding what you already
have and what you want to build. This becomes the input for your personal
action plan in Level 4.

**Open a new Claude conversation. Type:**

```
I am a QA engineer with [X] years of experience.
My current skills include: [list 5–8 things you do well]
The types of applications I test: [describe them briefly]

In the AI era of software testing, help me understand:
1. Which of my current skills are MORE valuable with AI tools?
2. Which of my current tasks could AI assist with immediately?
3. What new skills should I prioritise building first?
4. What would a typical week look like for a QA engineer
   at my experience level who uses AI effectively?

Be specific — not generic advice about AI, but specific to a QA
engineer with my background.
```

**Read the response. Add your own thoughts to it:**
- What did Claude get right about your skills?
- What did it miss that you know is important?
- What surprised you about what it said?

**Expected output:** A skills map with AI's assessment plus your own notes.
Save this — you will use it in Level 4 for your personal action plan.

**How to know it worked:** You have a clearer picture of which skills you
already have that are valuable in the AI era — and a starting list of
what to build next.

---

### Chapter 2 Reflection

1. After 3 rounds of refinement on the same test suite — how does
   Round 3 compare to what you got from the very first prompt in Chapter 1?
   What accounts for the difference?

2. When Claude reviewed your test cases in Assignment 2.2 — were the gaps
   it found ones you had missed, or ones you had consciously excluded?
   What does that tell you about how to use AI review?

---

---

# Chapter 3 — How AI Works & Responsible Use

## What You Will Practice
Running deliberate experiments to see the effects of the context window,
training limits, and tokens — on your real work. Not theory. You will
watch these effects happen and understand why.

## Before You Start
- Open **claude.ai** in your browser
- Have a requirements document or test plan from your current project
  (the longer the better for the token experiment)
- Have a real bug you found recently
- Have a piece of automation code (even if you did not write it)

---

### Assignment 3.1 — The Context Window Experiment 🤖 Claude.ai

**What you are doing:** Watching the context window effect in real time
on the same question asked with and without context.

**Experiment A — No context**

Open a new Claude conversation. Send:
```
Write 5 test cases for the search feature.
```

Copy the output to a notepad.

---

**Experiment B — With application context**

Open a new Claude conversation. Send:
```
Our application is [describe your application in 3–4 sentences:
what it does, who uses it, what the main features are].

The search feature works like this: [describe how your search
actually works — what it searches, what results look like,
any filters, any known behaviour].

Write 5 test cases for this search feature.
```

Copy this output next to Experiment A.

---

**Compare the two outputs:**

| | Experiment A | Experiment B |
|---|---|---|
| How many test cases matched your app? | | |
| How many were too generic? | | |
| How many referenced things that don't exist? | | |
| Could you use this output directly? | | |

**Expected output:** A comparison table showing the concrete difference
that context makes.

**How to know it worked:** Experiment B produces noticeably more relevant
output for your specific application than Experiment A.

---

### Assignment 3.2 — Find the Training Cutoff 🤖 Claude.ai

**What you are doing:** Discovering what Claude does and does not know
about your technology stack and tools.

**Step 1 — Open a new conversation. Ask about each of these:**

```
What is the current version of Playwright?
```
```
What is the current version of [your main testing tool/framework]?
```
```
What are the latest features in [your test management tool]?
```

**Step 2 — Check the actual current versions online.**

**Step 3 — Ask Claude:**
```
What is your knowledge cutoff date? For testing tools and frameworks
that change frequently, how should I handle questions about current versions?
```

**Expected output:** A list of version answers from Claude compared to
the actual current versions. A note on where Claude is current and where
it is outdated.

**How to know it worked:** You found at least one case where Claude's
knowledge is outdated. You now know: for version-specific questions,
paste the documentation rather than relying on Claude's training.

---

### Assignment 3.3 — The Token Limit in Practice 🤖 Claude.ai

**What you are doing:** Testing what happens when you give Claude too much
text vs the right amount.

**Step 1 — Find a long document from your project.** This could be:
- A requirements document
- A test plan
- A sprint backlog export
- An API documentation page

It should be long — at least 2–3 pages.

**Experiment A — Paste the whole document**

```
[Paste the entire long document]

Write 10 test cases for the most important features in this document.
```

Note: Was the output focused? Did it cover what you considered the most
important features? Or did it pick random things from the document?

---

**Experiment B — Summarise first, then ask**

Write a 3–5 sentence summary of the same document.
Cover: what the feature is, who uses it, the 3 most important rules.

```
[Paste your 3–5 sentence summary]

Write 10 test cases covering the most important scenarios
for this feature. Include boundary values and error cases.
```

---

**Compare the outputs:**
- Which was more focused?
- Which required less editing?
- How long did summarising take vs the time you saved in editing?

**Expected output:** Two sets of test cases and a note on which approach
produced more useful output and why.

---

### Assignment 3.4 — Explain Code You Did Not Write 🤖 Claude.ai

**What you are doing:** Using Claude to understand automation code
without having written it. This is immediately useful if you review
automation written by developers or other team members.

**Step 1 — Find a piece of code from your project you do not fully understand.**
It could be:
- An existing automated test
- A test helper or utility function
- A CI pipeline step
- A Playwright or Selenium locator you have not seen before

If you do not have access to automation code, ask your developer
for one test file.

**Step 2 — Open a new Claude conversation. Type:**

```
Act as a Playwright/Selenium/[your framework] expert explaining
code to a QA engineer who tests manually.

Explain what this code does in plain English:
- What is it testing?
- What steps does it perform?
- What is it asserting (checking)?
- What scenarios does it NOT test that a QA engineer would want?

[Paste the code here]
```

**Step 3 — Read the explanation. Does it match your understanding?
What did you learn that you did not know?**

**Step 4 — Ask one follow-up:**
```
If this test starts failing, what are the most likely reasons?
How would I start investigating?
```

**Expected output:** A plain-English explanation of the code plus
a debugging starting point.

**How to know it worked:** You understand what the code tests better
after reading Claude's explanation than before.

---

### Assignment 3.5 — Responsible Use Audit 🤖 Claude.ai

**What you are doing:** Checking your own prompts from this week
against the responsible use rules. This is not a test — it is a
professional habit to build.

**Step 1 — Look back at the prompts you used in Chapters 1–3.**

**Step 2 — For each prompt, check:**

| Check | Yes / No |
|---|---|
| Did I paste any real user names, emails, or personal data? | |
| Did I paste any real user IDs or account numbers? | |
| Did I include any client credentials or API keys? | |
| Did I paste any real production data (even "just one example")? | |
| Did I include anything my organisation would consider confidential? | |

**Step 3 — If any answer is "Yes":**
- What should you have used instead? (Synthetic data, anonymised values,
  a description instead of the actual data)
- Write the safer version of that prompt

**Step 4 — Write a personal data rule for your specific project:**

```
For [your project], the following data types are sensitive and
should never be pasted into AI tools:
- [list the specific data types in your application]

Instead, I will: [describe what you will use instead]
```

Save this rule. It becomes part of your Skills.md in Chapter 5.

**Expected output:** A personal responsible use checklist specific
to your project.

---

### Chapter 3 Reflection

1. After the context window experiment — what is the minimum context
   you need to provide about your application for Claude to give useful
   output? Write it in 3–4 sentences. This is the foundation of your
   Skills.md in Chapter 5.

2. After the token experiment — what is your personal rule for
   how much to paste vs how much to summarise?

---

---

# Chapter 4 — Prompts & Context

## What You Will Practice
Writing structured prompts using all four components — Role, Context,
Instruction, Format — for real QA tasks you do every sprint.
By the end you will have a personal prompt library of 4 reusable prompts.

## Before You Start
- Open **claude.ai** in your browser
- Have your current sprint open — you need at least 3 real tasks
  you are working on this week
- Have a real requirement, a real bug, and optionally a test plan
  or release summary you need to write
- Open a new document or notepad to save your prompts as you build them

---

### Assignment 4.1 — Build Your Test Case Prompt 🤖 Claude.ai

**What you are doing:** Writing a reusable test case generation prompt
using all four components. This prompt works for any feature in your
application once you swap out the Context section.

**Step 1 — Choose a feature you need test cases for this week.**

**Step 2 — Build the prompt one component at a time:**

**Start with Role:**
```
Act as a senior QA engineer with expertise in [your application type:
e.g. "e-commerce applications", "banking software", "healthcare platforms",
"HR management systems"].
```

**Add Context (your specific application and feature):**
```
Our application is [1–2 sentences describing what it does and who uses it].

The [feature name] works as follows:
- [Rule 1]
- [Rule 2]
- [Rule 3]
[Add as many rules as are relevant]
```

**Add Instruction:**
```
Write [number] test cases covering:
- The main happy path (successful scenario)
- All validation errors
- Boundary values for [specific fields with limits]
- Empty/null states for required fields
- [Any other specific scenarios you know matter]
```

**Add Format:**
Choose the format your team uses:
```
Return as a markdown table with columns:
ID | Test Case Name | Preconditions | Steps | Expected Result | Priority
```
OR
```
Return as a Gherkin .feature file with Scenario Outline
where multiple test cases share the same structure.
```
OR
```
Return as a numbered list with: Test Name / Steps / Expected Result
```

**Step 3 — Send the complete assembled prompt.**

**Step 4 — Review the output:**
- Does every test case match your actual application?
- Are the expected results specific (exact error messages, exact values)?
- Are boundary values correct?
- Are negative scenarios included?

**Step 5 — Fix anything wrong with a follow-up prompt:**
```
TC-[number]: The expected result is wrong. Our application actually
shows "[correct message/behaviour]". Please fix this test case.
```

**Step 6 — Save the final prompt (without the specific requirement)
as a template. Replace the specific content with placeholders:**

```
Saved prompt: test-case-generation.md

Act as a senior QA engineer with expertise in [APPLICATION TYPE].

Our application is [APPLICATION DESCRIPTION].

The [FEATURE NAME] works as follows:
- [RULE 1]
- [RULE 2]

Write [NUMBER] test cases covering:
- The main happy path
- All validation errors
- Boundary values for [FIELDS]
- Empty/null states

Return as a markdown table with columns:
ID | Test Case Name | Preconditions | Steps | Expected Result | Priority
```

**Expected output:** A complete, usable test suite AND a saved reusable prompt template.

---

### Assignment 4.2 — Build Your Bug Report Prompt 🤖 Claude.ai

**What you are doing:** Writing a reusable bug report prompt that turns
your rough notes into a professional, complete Jira-ready report.

**Step 1 — Find a real bug from this sprint or this week.**
If you do not have one, use the last bug you raised.

**Step 2 — Write your rough notes about the bug
(the way you would actually capture it during testing):**
```
[Write it messily — as you would capture it in the moment:
what happened, when, on what device, what you expected]
```

**Step 3 — Build the bug report prompt:**

```
Act as an experienced QA engineer writing a professional bug report
for [your application name].

I observed the following issue:
[Paste your rough notes here]

Additional context:
- Application: [name and brief description]
- Environment: [browser, device, OS, staging/production]
- Test account used: [type of account — admin/user/guest, not real credentials]
- Date observed: [today]

Write a complete bug report with these sections:
1. Summary — one line starting with the affected feature
2. Environment — browser, OS, application environment
3. Steps to Reproduce — numbered, specific enough to reproduce from scratch
4. Expected Result — what should happen based on the product requirements
5. Actual Result — exactly what happens, including any text, messages, or values
6. Severity — Critical/High/Medium/Low with one sentence justification
7. Root Cause Hypothesis — your best guess at what is technically wrong
8. Attachments needed — list what screenshots or logs to attach
```

**Step 4 — Review the output:**
- Can you follow the Steps to Reproduce and actually reproduce the bug?
- Is the Expected Result based on the business rule, not just "it should work"?
- Is the Actual Result specific enough (mentions exact error messages, values)?
- Does the Severity justification explain business impact?

**Step 5 — Fix anything that does not match reality.**
Apply this checklist before considering it done:
- [ ] Steps are specific enough that someone who has never seen the bug can reproduce it
- [ ] Expected Result mentions the specific business rule being violated
- [ ] Actual Result mentions exact text visible on screen
- [ ] Severity is justified by business impact, not technical difficulty

**Step 6 — Save your reusable bug report prompt template.**

**Expected output:** A polished bug report for a real bug, ready for Jira.
Plus a saved prompt template.

---

### Assignment 4.3 — Build Your Requirement Review Prompt 🤖 Claude.ai

**What you are doing:** Writing a prompt that catches gaps in requirements
before development starts. This is the spec gate that separates Type 2
from Type 1 QA teams.

**Step 1 — Find a requirement from your current sprint that you think
might have gaps, ambiguities, or missing acceptance criteria.**
If everything is well-defined, use a requirement from a previous sprint
where bugs were found — because requirements with bugs usually had gaps.

**Step 2 — Build and send this prompt:**

```
Act as a senior QA engineer reviewing a requirement for testability
before development begins.

Requirement:
[Paste the requirement exactly as you received it]

Application context:
[2–3 sentences about your application and who uses it]

Identify and list:

1. AMBIGUOUS TERMS
   Words or phrases with more than one possible interpretation.
   For each: what does it mean? What else could it mean?

2. MISSING ACCEPTANCE CRITERIA
   Scenarios the requirement does not address.
   For each: what should happen in this situation?

3. EDGE CASES NOT COVERED
   Boundary conditions, error states, empty states, concurrent actions,
   or unusual but realistic user behaviours not mentioned.

4. QUESTIONS FOR THE PRODUCT MANAGER
   Things a developer would reasonably need to know before building this.

Return as a numbered list under each heading.
```

**Step 3 — Read each gap identified. For each one:**
- Can you answer it from your existing knowledge of the application?
- Does it need to go back to the product manager?
- Would a developer build it incorrectly without this being clarified?

**Step 4 — Write the answers you know. Mark the ones that need clarification.**

**Step 5 — (Optional but highly recommended)**
Bring the unanswered questions to your product manager or business analyst.
See which ones they answer easily and which ones reveal real gaps in the spec.

**Expected output:** A gap analysis for a real requirement, with your
annotations on which gaps need stakeholder input.

---

### Assignment 4.4 — Build Your Format Library 🤖 Claude.ai

**What you are doing:** Discovering which output formats save you the
most reformatting time by testing the same content in three different formats.

**Step 1 — Take any test suite or requirement you have generated
earlier in Level 1.**

**Step 2 — Ask Claude to reformat it three times, each in a different format:**

**Format A — Jira-ready table:**
```
Reformat these test cases as a markdown table with columns:
ID | Summary | Preconditions | Steps | Expected Result | Priority
```

**Format B — Gherkin feature file:**
```
Reformat these test cases as a Gherkin .feature file.
Group related scenarios under one Feature heading.
Use Scenario Outline where test cases share the same structure
but differ only in data.
```

**Format C — Plain numbered checklist:**
```
Reformat as a plain numbered checklist for manual execution.
One line per check. No tables, no code blocks.
Format: [ID]. [Action to perform] → [Expected result]
```

**Step 3 — Compare all three formats:**
- Which one can you use directly without any reformatting?
- Which one requires the most editing after generation?
- Which format matches your team's actual tool?

**Step 4 — Save the format instruction that works best for your team
as a line you add to every test case prompt:**

```
My team's format instruction:
"Return as [your best format]"
```

**Expected output:** Three formatted versions of the same test cases
plus your preferred format instruction saved for reuse.

---

### Assignment 4.5 — Your Prompt Library (Bringing It Together) 🤖 Claude.ai

**What you are doing:** Collecting the four prompts you built in this
chapter into a personal prompt library — your first professional AI asset.

**Create a document called `my-prompt-library.md` with this structure:**

```markdown
# My QA Prompt Library — [Your Name]

## 1. Test Case Generation
**When to use:** When I need to write test cases from a requirement

**Context to add:** Application description + feature rules + field constraints

**The prompt:**
[Paste your final template from Assignment 4.1]

---

## 2. Bug Report Writing
**When to use:** When I have rough notes from testing and need a
professional Jira-ready report

**Context to add:** Application name + environment + test account type

**The prompt:**
[Paste your final template from Assignment 4.2]

---

## 3. Requirement Review
**When to use:** Before development starts on a new feature —
to catch ambiguities and missing acceptance criteria

**Context to add:** The requirement text + application context

**The prompt:**
[Paste your final template from Assignment 4.3]

---

## 4. My Format Instructions
**For Jira:** [Your format instruction]
**For Gherkin:** [Your format instruction]
**For manual checklist:** [Your format instruction]
```

Save this document. It is your starting prompt library.
In Level 2, Chapter 5, this becomes the `/prompts/` folder
in your project repository.

**Expected output:** A saved `my-prompt-library.md` with four working
prompt templates specific to your application and team.

**How to know it worked:** You can pick up any of these prompts next week,
swap in a new requirement, and get useful output in under 5 minutes —
without starting from scratch.

---

### Chapter 4 Reflection

1. Which of the four prompts produced the biggest improvement over
   what you would have written without AI? Why?

2. Which format instruction saved you the most time?
   What does this tell you about where to invest in prompt building?

3. Looking at your prompt library — what context would you want
   loaded automatically so you do not have to type it every time?
   (This is what Skills.md solves in Chapter 5.)

---

---

# Chapter 5 — VS Code, GitHub Copilot & Skills.md

## What You Will Practice
Setting up your AI-powered workspace in VS Code, using GitHub Copilot
on real test files, and writing a Skills.md that loads your project
context automatically — so every future AI interaction starts with
the right foundation.

## Before You Start
- VS Code installed (code.visualstudio.com)
- GitHub Copilot extension installed and signed in
- Claude Desktop installed (claude.ai/download) — optional for Assignment 5.4
- Your current project folder accessible
- The `my-prompt-library.md` from Chapter 4

---

### Assignment 5.1 — VS Code Setup and First Look 💡 VS Code

**What you are doing:** Getting comfortable in VS Code as a QA professional —
not a developer. You are learning the environment you will use for the rest
of the program.

**Step 1 — Open VS Code. Open your project folder:**
File → Open Folder → select your project or create a new folder
called `[projectname]-qa-toolkit`

**Step 2 — Explore these four areas:**
- **Explorer panel** (left sidebar, folder icon) — your file tree
- **Terminal** (Terminal menu → New Terminal) — where you run commands
- **Command Palette** (Ctrl+Shift+P / Cmd+Shift+P) — search for any VS Code action
- **Extensions** (left sidebar, four squares icon) — where Copilot lives

**Step 3 — Create your first folder structure in VS Code:**

Right-click in the Explorer panel → New Folder. Create:
```
[projectname]-qa-toolkit/
├── prompts/
├── test-cases/
├── bugs/
└── .claude/
```

**Step 4 — Move your prompt library into VS Code:**
Drag `my-prompt-library.md` from wherever you saved it into the `prompts/` folder.
Or create a new file: right-click `prompts/` → New File → `my-prompt-library.md`
→ paste the contents.

**Expected output:** A VS Code workspace with the folder structure created
and your prompt library inside it.

---

### Assignment 5.2 — GitHub Copilot First Use 💡 VS Code + Copilot

**What you are doing:** Using Copilot to do three things you would
normally do manually — and judging where it helps and where it does not.

**Step 1 — Verify Copilot is active**
Look at the bottom status bar of VS Code. You should see a Copilot icon.
If it shows a warning, click it and sign in with your GitHub account.

---

**Task A — Copilot completes a test from a comment**

Create a new file in your `test-cases/` folder:
`feature-name-tests.md`

Type this comment at the top:
```
<!-- Test cases for login page:
     - Email and password required
     - Account locks after 3 failed attempts
     - Password reset available by email
-->
```

Now on a new line, start typing:
```
## Test Case 1:
```

**Watch what Copilot suggests.** Tab to accept. Continue pressing Tab
to accept more suggestions.

- How accurate were the suggestions for your type of application?
- What would you change?

---

**Task B — Copilot explains code you did not write**

Find any test file in your project (or ask a developer for one).
Open it in VS Code.

Select all the code in the file (Ctrl+A / Cmd+A).

Open Copilot Chat (click the chat icon in the left sidebar or
press Ctrl+Shift+I / Cmd+Shift+I).

In the chat, type:
```
/explain
```

Read the explanation. Does it correctly describe what the test does?
What assertions does it make? What scenarios does it cover?

---

**Task C — Copilot finds improvements**

With the same file open and selected, in Copilot Chat type:
```
As a QA engineer, what test scenarios are missing from this test file?
What edge cases or error conditions are not being tested?
```

Read the suggestions. Mark which ones are valid for your application.

**Expected output:** Notes from all three tasks — what Copilot got right,
what it got wrong, what you learned about its capabilities.

---

### Assignment 5.3 — Write Your Skills.md 🤖 Claude.ai + 💡 VS Code

**What you are doing:** Writing the single most important document in your
AI toolkit — the Skills.md that loads your project context automatically
for every AI interaction.

**Step 1 — Create the file:**
In VS Code, right-click on `.claude/` → New File → `skills.md`

**Step 2 — Build it section by section using Claude.ai to help draft it.**

Open Claude.ai. For each section, use Claude to draft and then edit:

---

**Section 1: Project Context**

Prompt to Claude:
```
I need to write a "project context" section for a Skills.md file.
This file is read by AI tools before they help me with QA tasks.
The context should be 3–5 sentences covering: what the application
does, who uses it, and what the main features are.

Based on this description of my application:
[Describe your application in plain language — what it does,
who the users are, what the key features are]

Write the Project Context section.
```

Edit Claude's output to match your exact application. Paste into Skills.md.

---

**Section 2: Test Conventions**

Type this directly — you know your own conventions:
```markdown
## Test Conventions
- Language: [JavaScript / TypeScript / Python / Java / other]
- Framework: [Playwright / Selenium / Cypress / manual / other]
- Test files location: [where your tests live]
- Test naming: [how you name test files and test cases]
- Bug tracking: [Jira / Azure DevOps / GitHub Issues / other]
- Test management: [TestRail / Zephyr / Excel / other]
```

---

**Section 3: AI Rules**

These are the instructions AI should always follow for your project.
Think about the mistakes AI made during Chapters 1–3:

Prompt to Claude:
```
I am writing AI rules for a QA project Skills.md file.
These rules tell AI tools what to always do, never do,
and always include when generating QA outputs for my project.

My project context: [paste your Section 1]

Based on what commonly goes wrong with AI-generated test cases
and bug reports, suggest 6–8 specific rules for my project type.
Format as a simple list starting with "Always" or "Never".
```

Edit Claude's suggestions. Remove generic ones. Add specific ones
you noticed AI getting wrong on YOUR project during Chapters 1–3.

---

**Section 4: My Format Preferences**

Paste the format instructions you saved from Assignment 4.4:
```markdown
## My Format Preferences
- Test cases: [your preferred format]
- Bug reports: [your preferred format]
- Requirements review: Numbered list under four headings
```

---

**Step 3 — Save the complete Skills.md.**

Your file should look something like this:

```markdown
# QA Skills — [Project Name]

## Project Context
[3–5 sentences about your application]

## Test Conventions
- Language: TypeScript
- Framework: Playwright
- Test files: /tests/specs/
- Bug tracking: Jira
- Test management: Zephyr

## AI Rules
- Always include both positive and negative test scenarios
- Never reference UI element IDs or selectors in test steps
- Always include the exact expected error message in test expectations
- Never assume features exist — only describe what is in the context
- Always format test cases as markdown tables unless instructed otherwise
- [Your specific rules]

## My Format Preferences
- Test cases: Markdown table — ID | Name | Preconditions | Steps | Expected Result | Priority
- Bug reports: Summary / Environment / Steps / Expected / Actual / Severity / Root Cause
```

**Expected output:** A complete `skills.md` file saved in `.claude/`
in your VS Code workspace.

---

### Assignment 5.4 — Test Your Skills.md 🤖 Claude.ai

**What you are doing:** Confirming that your Skills.md makes a measurable
difference to AI output quality.

**Experiment A — Without Skills.md**

Open a new Claude.ai conversation. Send only:
```
Write 5 test cases for the search feature.
```

Copy the output.

---

**Experiment B — With Skills.md**

Open a new Claude.ai conversation.
Type or paste: "Read this skills.md file and follow these conventions:"
Then paste the entire contents of your Skills.md.
Then add:
```
Now write 5 test cases for the search feature of this application.
```

---

**Compare the outputs:**

| | Without Skills.md | With Skills.md |
|---|---|---|
| Matches our application? | | |
| Follows our naming conventions? | | |
| Uses our preferred format? | | |
| Includes both positive and negative? | | |
| Would need reformatting before use? | | |

**Expected output:** Two sets of test cases showing the measurable
difference that Skills.md context makes.

**How to know it worked:** The Skills.md version requires significantly
less editing before it is ready to use.

---

### Assignment 5.5 — Your Level 1 Deliverables Review 💡 VS Code

**What you are doing:** A final check that you have produced real,
usable outputs from Level 1. This is not a test — it is a checklist
to confirm you have the foundation for Level 2.

Open VS Code. In your `[projectname]-qa-toolkit/` folder, confirm
you have (or can create quickly from your work this week):

**Deliverables checklist:**

```
prompts/
├── my-prompt-library.md        ← 4 prompt templates from Chapter 4
                                   (test cases, bug report, requirement review,
                                   format instructions)

test-cases/
├── [feature]-test-cases.md     ← At least 1 real test suite generated
                                   and reviewed from Chapter 1–2

bugs/
├── [bug-name]-report.md        ← At least 1 real bug report from Chapter 4

.claude/
└── skills.md                   ← Your Skills.md from Chapter 5
```

**For any missing deliverable:** Create it now using what you learned.
Use the prompts from your library. It should take 5–10 minutes each.

**Final step — save everything:**
```bash
# In the VS Code terminal:
# If you have git set up:
git init
git add .
git commit -m "Level 1 complete: prompt library, test cases, bug report, skills.md"

# If you do not have git yet, that is fine — it comes in Level 3.
# Just ensure all files are saved in VS Code.
```

**Expected output:** A structured VS Code workspace with real artifacts
from your real project — ready to build on in Level 2.

---

### Chapter 5 Reflection

1. After comparing output with and without Skills.md — what was
   the biggest single improvement it made?
   What does that tell you about what context matters most for AI?

2. Looking at your prompt library — you now have 4 reusable prompts.
   How long did the first test case generation take in Chapter 1?
   How long would it take now using your library?

3. Which Copilot capability was most immediately useful for your role:
   inline suggestions, /explain, or gap analysis?
   Why?

---

---

# Level 1 — Final Checklist

## What You Have Built

By completing all assignments, you now have:

| Artifact | Where It Lives | What It Does |
|---|---|---|
| Prompt library | `prompts/my-prompt-library.md` | 4 reusable prompt templates for your most common QA tasks |
| Test suite | `test-cases/` | At least 1 real reviewed test suite from a real requirement |
| Bug report | `bugs/` | At least 1 professional bug report from real rough notes |
| Skills.md | `.claude/skills.md` | Your project context loaded automatically into AI tools |

## What You Can Now Do

- Generate test cases from a requirement in under 5 minutes
- Improve them through 3 rounds of iterative refinement
- Write a professional bug report from rough notes in under 3 minutes
- Catch gaps in requirements before development starts
- Know when Claude is hallucinating and correct it
- Understand why generic prompts produce generic output
- Use VS Code as a QA workspace with GitHub Copilot
- Write and use a Skills.md file that makes AI context-aware

## What Is Coming in Level 2

In Level 2 you will:
- Connect Claude directly to your project files via MCP
  (no more copy-pasting file contents)
- Use Claude to browse your live application and explore it
- Generate complete Gherkin .feature files from requirements
- Generate realistic synthetic test data instead of using real data
- Organise everything into a repository-first AI testing toolkit

The Skills.md, prompt library, and test cases you built in Level 1
are the foundation Level 2 builds on.

---

> **A note on your progress**
>
> You started Level 1 as a QA professional who had read about AI
> but had not built it into your workflow. You leave Level 1 having
> used AI on real work, having built assets you will use tomorrow,
> and having developed the habit of reaching for Claude before
> starting any QA writing task.
>
> That habit is worth more than any single deliverable.
