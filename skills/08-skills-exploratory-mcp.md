# Chapter 8 — Skills for Exploratory Testing with MCP
### AI That Knows Your Live Data and Your Live Browser

---

## What You Will Learn

- What MCP is and why it changes exploratory testing
- The difference between static context and live connected context
- How to build skills that reference live Jira, Confluence, and other tools
- How Playwright MCP lets Claude drive a real browser during exploration
- How Playwright MCP works across Claude, Cursor, and VS Code
- The session workflow for MCP-assisted exploratory testing
- What MCP cannot do and what to watch for

---

## 8.1 What MCP Is

MCP stands for Model Context Protocol. It is a way of connecting AI tools to live external systems — Jira, Confluence, Gmail, Google Calendar, and others.

Without MCP: you paste information into the context window manually. You copy a Jira ticket, paste it, ask a question about it.

With MCP: the AI tool connects directly to Jira (or another system) and pulls the information automatically when it needs it. You do not copy and paste. The data is live.

**The practical difference for testing:**

Without MCP, a skill for exploratory charters writes charters based on whatever feature description you type. It has no idea what bugs have already been found, what the acceptance criteria say, or what the sprint deadline is.

With MCP connected to Jira, the same skill can read the actual open bugs for the feature, the actual acceptance criteria from the story, and the actual sprint timeline — before it writes a single charter. The charters it produces are focused on real, known risks, not generic patterns.

---

## 8.2 Connected Tools and What They Add

| Tool | What It Adds to Testing Work |
|------|------------------------------|
| **Jira / Atlassian** | Open bugs, story acceptance criteria, sprint timeline, recent defect history |
| **Confluence** | Test standards documentation, existing test plans, architectural decisions |
| **Gmail** | Stakeholder feedback, recent discussions about requirements |
| **Google Calendar** | Sprint dates, release dates, deadline context |
| **Playwright MCP** | Live browser — navigate, click, inspect DOM, read elements, take screenshots |

Each connected tool adds a layer of live context that a prompt-only approach cannot match. Playwright MCP is different from the others — it does not pull data. It drives a real browser in real time.

---

## 8.3 Building an MCP-Assisted Exploratory Charter Skill

### Step 0 — Without MCP

Prompt: "Write exploratory charters for the Leave Application feature."

Output:
```
Charter 1: Explore form validation
Charter 2: Explore submission workflow
Charter 3: Explore error handling
```

Generic. No knowledge of what has already been found. No knowledge of what the acceptance criteria actually say. These charters could have been written for any leave application feature in any system.

### Step 1 — Add the MCP workflow to the skill

```yaml
---
name: exploratory-charter-mcp
description: >
  Write exploratory test charters informed by live Jira data.
  Use when: writing exploratory charters, planning exploratory sessions,
  risk-based test planning for a feature or story.
  Requires Jira MCP connection.
  Always use this skill when writing exploratory charters.
---

# Exploratory Charter with Live Jira Data

## The Critical Rule

Charters must be informed by real data — not generic patterns.
Before writing any charter, read the actual Jira data for this feature.
Generic charters based on guessed risks are not acceptable.

## Workflow — Run in This Order

Step 1: Use the Jira MCP tool to fetch the story for this feature
Step 2: Use the Jira MCP tool to fetch open bugs linked to this feature or component
Step 3: Use the Jira MCP tool to fetch bugs closed in the last two sprints for this component
Step 4: Identify the top 3 risk areas based on what you found
Step 5: Write charters focused on those risk areas
Step 6: Add one charter for areas with no bug history (unknown risk — important to explore)
```

**Output now — with real Jira data pulled:**

```
Data retrieved from Jira:
- Story LEA-234: Leave Application — acceptance criteria include same-day
  leave restriction and half-day application
- Open bugs: 3 open — 2 related to date picker, 1 related to balance calculation
- Recent closed bugs: 5 in last 2 sprints — 3 related to overlap detection,
  2 related to notification emails

Risk areas identified:
1. Date picker behaviour (2 open bugs)
2. Balance calculation (1 open bug)
3. Leave overlap detection (3 recently fixed — risk of regression)

Charter 1
Explore:     Date picker edge cases on the Leave Application form
With:        Dates near public holidays, same-day selections, date ranges
             spanning month boundaries
To discover: Whether the two open date picker bugs are isolated or symptomatic
             of broader date handling issues
Time box:    60 minutes
Related:     LEA-089 (open), LEA-094 (open)

Charter 2
Explore:     Leave balance calculation after partial-day and split applications
With:        Employee with 5 days remaining balance, half-day leave types
To discover: Whether the open balance calculation bug (LEA-101) affects all
             leave types or only specific combinations
Time box:    45 minutes
Related:     LEA-101 (open)

Charter 3
Explore:     Leave overlap detection after recent fixes
With:        Multiple employees, overlapping date ranges, team view
To discover: Whether the three recently fixed overlap bugs have regressed
             after the latest deployment
Time box:    45 minutes
Related:     LEA-078, LEA-082, LEA-091 (closed — regression risk)

Charter 4
Explore:     Same-day leave restriction enforcement (new acceptance criterion)
With:        Current date, business hours, various leave types
To discover: Whether the new same-day restriction (LEA-234 AC) is correctly
             enforced across all leave types and user roles
Time box:    45 minutes
Note:        No prior bug history — new requirement, unknown risk
```

This is the difference. The charters reference real Jira tickets. They focus on known risk areas from real bug history. They flag regression risk on recently fixed issues. They include a charter for the new acceptance criterion.

Without MCP, none of this was possible. The skill had to guess what was risky.

---

## 8.4 Building a Risk-Based Test Planning Skill with MCP

```yaml
---
name: risk-test-planning-mcp
description: >
  Create a risk-based test plan using live Jira data.
  Use when: planning test coverage for a release, sprint, or feature,
  prioritising testing effort based on defect history,
  writing a risk-based test strategy.
  Requires Jira MCP connection.
---

# Risk-Based Test Planning with Live Data

## The Critical Rule

Test effort must be prioritised by actual risk — not assumed risk.
Always pull real defect history before making prioritisation decisions.

## Workflow

Step 1: Fetch all stories in scope from Jira (sprint or release)
Step 2: For each story, fetch linked defect history (last 3 sprints)
Step 3: Calculate defect density per component
Step 4: Identify components with highest defect density → highest test effort
Step 5: Identify components with no defect history → exploratory focus
Step 6: Produce a prioritised test plan with rationale

## Output Format

Risk Matrix:
| Component | Defects (last 3 sprints) | Risk Level | Recommended Effort |
|-----------|------------------------|------------|-------------------|
| [component] | [count] | High/Med/Low | [hours] |

Test Priority Order:
1. [highest risk component] — [rationale]
2. [second highest] — [rationale]
...

Total estimated effort: [hours]
Confidence: [High/Medium/Low] based on data completeness
```

---

## 8.5 Building a Test Coverage Analysis Skill with MCP

This skill identifies gaps between what Jira says is done and what actually has test coverage.

```yaml
---
name: coverage-analysis-mcp
description: >
  Analyse test coverage gaps using live Jira data.
  Use when: checking test coverage for a release, identifying untested stories,
  finding gaps between development completion and test coverage,
  pre-release coverage analysis.
  Requires Jira and test management MCP connections.
---

# Test Coverage Analysis

## The Critical Rule

A story marked "Done" in Jira is not necessarily tested.
Always verify test coverage exists before declaring a feature ready for release.

## Workflow

Step 1: Fetch all stories marked "Done" in the release or sprint from Jira
Step 2: For each story, check whether test cases exist in the test management tool
Step 3: For stories with test cases, check whether they have been executed
Step 4: For stories with no test cases: flag as "No Coverage"
Step 5: For stories with test cases not executed: flag as "Not Executed"
Step 6: Produce a coverage report

## Output Format

Coverage Summary:
- Total stories: [n]
- Fully covered and executed: [n] ([%])
- Test cases exist but not executed: [n] ([%])
- No test coverage: [n] ([%])

Stories Requiring Attention:
| Story | Status | Issue |
|-------|--------|-------|
| [story ID + title] | No coverage | No test cases found |
| [story ID + title] | Not executed | Test cases exist, 0 runs |

Recommendation: [ready for release / not ready / conditional]
```

---

## 8.6 Playwright MCP — Claude Drives a Real Browser

Everything in sections 8.3–8.5 is about pulling data from external tools to plan better exploration. Playwright MCP is different. It does not help you plan exploration. It *is* exploration.

When Playwright MCP is connected, Claude has access to a real browser. It can navigate to a URL, click elements, fill forms, read the DOM, inspect element states, take screenshots, and report what it finds — all in response to plain English instructions from you.

No test code is written. No locators are authored. You describe what you want explored. Claude explores it.

---

### 8.6.1 What Playwright MCP Can Do in an Exploratory Session

| Capability | What It Means in Practice |
|------------|--------------------------|
| Navigate to URLs | Go to the application, navigate between pages |
| Click elements | Click buttons, links, tabs, menu items |
| Fill forms | Enter text, select dropdowns, check boxes |
| Read DOM state | Check element visibility, enabled/disabled state, text content |
| Take screenshots | Capture the current state of the page at any moment |
| Read console errors | Detect JavaScript errors thrown during interaction |
| Observe network activity | See what API calls fire during user actions |

This is the charter execution loop: Jira MCP tells you what to explore (risk areas from real bug data). Playwright MCP lets you explore it directly without leaving Claude.

---

### 8.6.2 The Three Contexts — Claude, Cursor, VS Code

Playwright MCP behaves differently depending on which tool you are working in. The capabilities are similar. The use cases differ.

```
┌─────────────────────────────────────────────────────────────┐
│  CLAUDE (claude.ai)                                         │
│  Pure exploratory execution                                 │
│  No code involved. Describe the charter. Claude explores.   │
│  Best for: session-based exploratory testing,               │
│            charter execution, rapid risk investigation,     │
│            reproducing reported bugs against current build  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CURSOR                                                     │
│  Explore while writing automation                           │
│  Drive the browser from inside your IDE.                    │
│  Best for: verifying locators live, checking element        │
│            states while writing page objects, debugging     │
│            selectors without a full test run                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  VS CODE + COPILOT                                          │
│  Integrated debugging                                       │
│  Inspect live browser state alongside your test code.       │
│  Best for: understanding failures in context,               │
│            comparing expected vs actual DOM state           │
└─────────────────────────────────────────────────────────────┘
```

---

### 8.6.3 Playwright MCP in Claude — Pure Exploratory Execution

This is the most powerful use case for exploratory testing. You connect Playwright MCP to Claude, give it a charter, and let it explore.

**Setting up Playwright MCP in Claude:**

1. Install the Playwright MCP server:
```bash
npx @playwright/mcp@latest
```
2. Connect it in Claude's MCP settings with the server command
3. A browser instance becomes available to Claude in your sessions

**Running a charter with Claude + Playwright MCP:**

```
I am running an exploratory session on the Leave Application feature.
Application URL: [your app URL]
Test credentials: username [test-admin], password [test-password]

Charter:
Explore:     Date picker edge cases on the Leave Application form
With:        Dates near public holidays, same-day selections,
             dates spanning month boundaries
To discover: Whether date validation handles edge cases correctly

Please:
1. Navigate to the application and log in
2. Find the Leave Application form
3. Explore each date scenario from the charter
4. Report what you find — including unexpected behaviour, errors,
   or console warnings
5. Take a screenshot for any finding worth documenting
```

**What Claude does:**

Claude navigates to the URL, logs in, locates the Leave Application form, and explores systematically. It reports findings in real time:

```
Navigated to the application and logged in as test-admin.
Located the Apply Leave form under Time Off > Apply Leave.

Testing same-day selection:
- Selected today's date in both From Date and To Date
- Clicked Apply
- Result: Application submitted successfully — no restriction enforced
⚠ FINDING: Same-day leave restriction from LEA-234 AC is NOT enforced.
  Screenshot taken.

Testing date spanning month boundary (Jan 30 – Feb 2):
- Days calculated: 4 working days
- Result: Correct — month boundary handled without error

Testing date near public holiday (Jan 25–27, Republic Day on Jan 26):
- Days calculated: 2 days (Jan 26 excluded)
- Result: Public holiday correctly excluded from count

Console errors observed during session:
- Uncaught TypeError during date picker calendar render when Dec 31
  selected as From Date and Jan 1 of next year as To Date
  Error: "Cannot read properties of undefined (month)"
⚠ FINDING: Date picker throws console error on year-boundary selection.
  Screenshot taken.
```

Two findings surfaced — one a missing acceptance criterion enforcement, one a JavaScript error on year boundaries. This would take a manual tester 40 minutes to reproduce. The charter ran in minutes.

**The combined loop — Jira MCP + Playwright MCP:**

```
"Use Jira MCP to pull open bugs for the Leave Application feature.
Then use Playwright MCP to verify whether each open bug is still
reproducible in the current build."
```

Claude reads the Jira tickets, navigates to the feature, attempts to reproduce each bug, and produces a report showing which are still open and which appear resolved. Risk intelligence from Jira, executed in the browser — one session.

---

### 8.6.4 Building a Playwright MCP Exploratory Skill

```yaml
---
name: playwright-mcp-exploration
description: >
  Execute exploratory testing sessions using Playwright MCP to drive a live browser.
  Use when: running an exploratory charter, verifying a bug is reproducible,
  checking a feature behaves correctly, investigating a risk area by interacting
  with a live application, executing session-based exploratory testing.
  Requires Playwright MCP connection and application access.
  Always use this skill when exploring a live application with Playwright MCP.
---

# Playwright MCP Exploratory Testing

## The Critical Rule

Exploration must be systematic, not random.
Before touching the browser, state:
1. What area is being explored
2. What conditions will be tested
3. What a finding looks like — what to watch for

Random clicking is not exploration. Systematic charter execution is.

## Session Setup

Before starting any exploration:
- Confirm the application URL and environment (dev / staging — never production)
- Confirm test credentials are available
- Confirm what build or version is being tested
- State the charter explicitly so findings are traceable

## Exploration Workflow

Step 1: Navigate to the feature under test
Step 2: For each scenario in the charter:
  a. Set up the starting state
  b. Perform the described action
  c. Observe and record the result
  d. Check console for JavaScript errors
  e. Take a screenshot if the finding is worth documenting
Step 3: Produce a findings report after all scenarios are complete

## Findings Report Format

For each finding:
- Type: Bug / Gap / Question / Observation
- Description: what happened
- Steps to reproduce: numbered, one action per step
- Screenshot: [attached if taken]
- Suggested Jira action: new bug / comment on existing ticket / no action

## Do Not

- Do not use production credentials — test environment only
- Do not modify production data — test accounts and test data only
- Do not stop when one finding is found — complete the full charter
- Do not report findings without reproduction steps
- Do not skip console error checks — JavaScript errors are often invisible to manual testers
```

---

### 8.6.5 Playwright MCP in Cursor — Explore While Writing Automation

In Cursor, Playwright MCP serves a different purpose. You are writing automation code. The browser is available alongside your editor. You can interrogate the live application without switching context.

**Verifying locators before writing them:**

```
In Cursor Composer:
"Use Playwright MCP to navigate to the Add Employee page and tell me
the exact role and accessible name of the Save button."
```

Claude reports: `button, name: "Save"`. You write `getByRole('button', { name: 'Save' })` with confidence. No guessing. No running a test to see if the locator works.

**Checking element state during page object development:**

```
"Navigate to the Leave Application form and tell me whether the
Apply button is enabled when no Leave Type is selected."
```

Claude reports: "The Apply button is enabled with no Leave Type selected — clicking it shows a validation error but the button is never disabled." You now know your page object method handles validation state, not button state.

**Debugging a failing locator:**

```
"The locator getByRole('combobox', { name: 'Leave Type' }) is timing out.
Navigate to the Leave Application form and tell me the actual role
and accessible name of the leave type dropdown."
```

Claude inspects the live element and reports the real values. You update the locator immediately. The write → run → fail → inspect → fix → run loop collapses to seconds.

**Setup in Cursor — `.cursor/mcp.json`:**

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Restart Cursor. The Playwright tool is available in Composer.

---

### 8.6.6 Playwright MCP in VS Code — Integrated Debugging

In VS Code with Copilot, Playwright MCP supports investigation when a test is failing and you need to understand what the application actually looks like at the point of failure — without running the full suite.

**The primary use case:**

A test fails at `clickSave`. You do not know whether the Save button is disabled, hidden, or has changed its label in the current build. Use Playwright MCP to inspect the page in the exact state just before the failure:

```
In VS Code Copilot Chat:
"Navigate to the Leave Application form at [URL], log in as [test user],
select Annual Leave and a valid date range, then tell me the exact state
of the Apply button — is it enabled or disabled, what is its accessible
name, and is it visible?"
```

Copilot navigates, sets up the state, and reports the element's actual condition. You have your diagnosis without a debug session.

**Setup in VS Code:**

1. Install: `npx @playwright/mcp@latest`
2. Add the MCP server via the Copilot Chat settings panel in VS Code
3. The Playwright tool becomes available in Copilot Chat

---

### 8.6.7 Which Tool for Which Situation

| Situation | Best Tool |
|-----------|-----------|
| Running a full exploratory session end-to-end | Claude + Playwright MCP |
| Jira risk data → execution in one session | Claude + Jira MCP + Playwright MCP |
| Reproducing a reported bug against current build | Claude + Playwright MCP |
| Verifying a locator while writing a page object | Cursor + Playwright MCP |
| Understanding live element state while debugging | Cursor or VS Code + Playwright MCP |
| Checking whether all open Jira bugs are still reproducible | Claude + Jira MCP + Playwright MCP |

---

### 8.6.8 Limitations of Playwright MCP in Exploratory Testing

**What it handles well:**
- Navigating to known URLs and interacting with rendered elements
- Reading text content, element states, and console output
- Reproducing documented bugs from clear reproduction steps
- Checking acceptance criteria that have defined observable outcomes

**What it handles poorly:**
- Visual aesthetics — it can see that elements are present, not that they look right
- Accessibility feel — it can check ARIA attributes, not whether the experience is usable
- Complex multi-tab or multi-window flows — context can be lost across window boundaries
- Applications with heavy async rendering — timing can cause missed states
- Captchas and bot-detection mechanisms — these block automated browser interaction

The honest use case: Playwright MCP accelerates the repeatable, structured parts of exploratory testing. The parts that require tester instinct — "this feels wrong even though it technically passed" — remain human work.

---

## 8.7 The Session Workflow for MCP-Assisted Testing

### Before the session

1. Verify MCP connections are active — Jira, Playwright, and any other tools you plan to use
2. Identify the scope — what feature, sprint, or release you are working on
3. Have the application URL, test credentials, and Jira project key ready

### Starting the combined session

```
I am running an exploratory session for the [feature name] feature.
Application: [URL]
Test credentials: username [test-admin], password [test-password]
Jira project: [project key]

Step 1: Use Jira MCP to identify the top 3 risk areas for this feature
Step 2: Use Playwright MCP to execute one charter per risk area
Step 3: Produce a findings report with suggested Jira actions for each finding
```

Data MCP identifies risk. Browser MCP executes. Findings go back to Jira. One session, end to end.

### During the session

- Request deeper exploration: "That year-boundary bug — also check leap years"
- Redirect focus: "Skip the date picker — focus on the balance calculation next"
- Ask for screenshots: "Take a screenshot before clicking Apply"

### After the session

Create Jira tickets for new findings through the Atlassian MCP connection. Update existing tickets with updated reproduction notes. The session becomes project documentation without manual copy-paste.

---

## 8.8 Limitations of MCP in Testing

**Data MCP (Jira, Confluence, etc.) can:**
- Read from and write to connected tools
- Produce better outputs than prompt-only approaches
- Save significant manual copy-paste time

**Playwright MCP can:**
- Navigate, click, fill, read DOM, take screenshots
- Reproduce documented bugs
- Execute exploratory charters against a live application

**Neither can:**
- Replace tester judgement about what is actually risky
- Identify visual or aesthetic problems
- Understand business context that was never written down
- Guarantee data is current at the moment of use

MCP gives you better inputs and faster execution. You still make the decisions about what matters.

---

## 8.9 Privacy Considerations for MCP in Testing

When MCP pulls Jira data, that data goes into the model's context window. When Playwright MCP navigates your application, page content is also in context.

Before connecting live tools:
- Check that Jira tickets do not contain customer PII or real credentials
- Apply project filters to limit what Jira data is pulled
- Never point Playwright MCP at production with real user data on screen
- Use test environments and test accounts for all Playwright MCP sessions
- Review your organisation's AI data handling policy before connecting internal systems

The principle: MCP is safe for project management data and test environments. It is not safe for production data, customer records, or anything governed by privacy regulations.

---

## Chapter Summary

| Concept | Key Takeaway |
|---------|-------------|
| Data MCP (Jira, Confluence) | Live project data — no manual copying |
| Playwright MCP | Live browser — Claude navigates and interacts with the real application |
| Claude + Playwright MCP | Pure exploratory execution — describe the charter, Claude explores |
| Cursor + Playwright MCP | Locator verification and element state inspection while coding |
| VS Code + Playwright MCP | Browser state inspection during test debugging |
| The complete loop | Jira MCP identifies risk → Playwright MCP executes → findings back to Jira |
| Limitations | Visual, feel, and business context remain human work |

---

## Three Exercises to Try Today

1. Install Playwright MCP and connect it to Claude. Give it one exploratory charter from a feature you are currently testing. Compare the findings to what you found manually.

2. In Cursor with Playwright MCP, navigate to a page you are writing a page object for. Ask Claude to report the role and accessible name of each interactive element. Use those exact values in your locators.

3. Run the combined session: Jira MCP to identify the top risk areas, Playwright MCP to execute against each one. Time how long it takes versus running the same charter manually.

---

→ [Chapter 9 — Skills for Test Automation](09-skills-automation.md)

---

*← [Chapter 7](07-skills-manual-testing.md) | [Chapter 9 →](09-skills-automation.md)*
