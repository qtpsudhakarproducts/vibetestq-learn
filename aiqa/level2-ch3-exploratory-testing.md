# Level 2 — Chapter 3: Exploratory Testing with MCP & AI Agents

## What This Chapter Is About

This chapter covers how exploratory testing works in the AI era — what has changed, what has not, and how to use MCP-connected Claude and AI agents to explore your application with a speed and coverage that manual exploration alone cannot match. You will write exploration charters, direct Claude via Playwright MCP to browse Veg Cart, and learn how to capture findings in a structured format that feeds Level 3 automation generation.

---

## Why It Matters for QA

Exploratory testing is where QA professionals find the bugs that nobody thought to test for. It is one of the most human skills in the entire QA toolkit — and it is one of the last to be automated, because it requires judgement, curiosity, and the ability to follow an unexpected thread.

AI does not replace that judgement. But it can execute your exploration ten times faster than you can manually, cover more paths in the same time, and capture everything it encounters in a structured format. Your job is to design the charter and review the findings. AI's job is to execute them.

The combination is significantly more powerful than either alone.

---

## Exploratory Testing in the AI Era

### What Has Not Changed

The fundamentals of exploratory testing remain exactly what they were before AI:

**Charter-based exploration:** You define the mission — what area to explore, what risks to investigate, what time to spend. The charter gives the exploration structure without scripting every step.

**Testing instinct:** Your knowledge of where applications typically break, what business rules are usually misunderstood, what user behaviours are overlooked — this guides what charters you write.

**QA judgement:** Deciding what is a bug vs what is expected behaviour. AI cannot make that call for Veg Cart. You can, because you know the business rules.

**Domain knowledge:** Understanding what matters to users of a vegetable ordering application. AI knows what vegetable ordering applications typically look like. You know what your users actually do and care about.

### What Has Changed

**Execution speed:** A human explorer manually tests 15–20 scenarios in an hour. Claude with Playwright MCP explores 50–80 scenarios in the same time, including screenshot capture.

**Coverage breadth:** An AI agent explores more paths in parallel than a human can navigate manually. It tries more combinations of inputs, more sequences of actions, more edge conditions.

**Structured capture:** Every interaction, every observation, every screenshot is captured automatically in a consistent format. Manual exploratory testing often produces unstructured notes. AI exploration produces structured data ready for analysis and traceability.

**Tirelessness:** A human explorer's attention and quality of observation degrades over time. AI does not get tired, distracted, or less careful in the last fifteen minutes of a two-hour session.

### QA Analogy

Think about the difference between conducting a site inspection yourself and sending a surveyor with a structured checklist, thermal imaging equipment, and a laser measuring tool.

You know the building better than the surveyor. You know its history, its quirks, what has been repaired recently. Your expertise is irreplaceable. But the surveyor can survey the whole building in a fraction of the time, with tools that detect things you cannot see, and produces a structured report with photos of every finding.

The ideal is both: you design what needs to be inspected, the surveyor executes it systematically, and you review the report with your expertise to decide what is actually a problem.

That is the charter + AI agent model.

---

## Writing an Effective Exploration Charter

### Plain Explanation

A charter is a short description that defines the scope, focus, and time box of an exploratory session. It gives the exploration enough structure to be purposeful without scripting every step.

A good charter answers three questions:
1. **What area or feature is being explored?**
2. **What risks or hypotheses are being investigated?**
3. **What is the output expected?**

### Charter Template

```
Charter: Explore [feature/area] of Veg Cart
Time box: [X minutes]
Focus areas:
  - [Specific scenario or risk 1]
  - [Specific scenario or risk 2]
  - [Specific scenario or risk 3]
Output: Structured findings with screenshots of any unexpected behaviour
```

### Veg Cart Charter Examples

**Charter 1 — Coupon edge cases:**
```
Charter: Explore coupon code behaviour at Veg Cart checkout
Time box: 20 minutes
Focus areas:
  - Applying a valid coupon to an eligible order
  - Applying an expired coupon
  - Applying a coupon when the order total is below ₹200
  - Behaviour when cart items are removed after a coupon is applied
  - What happens when the same coupon is applied twice
Output: Structured findings report with screenshots of each scenario result
```

**Charter 2 — Cart quantity boundaries:**
```
Charter: Explore add-to-cart quantity behaviour on Veg Cart
Time box: 15 minutes
Focus areas:
  - Adding exactly 10 items of one vegetable (the maximum)
  - Attempting to add 11 items of one vegetable
  - Adding 0 items (or negative)
  - Adding the same vegetable twice from different pages
  - Cart behaviour when stock drops while item is in cart
Output: Report noting the exact UI behaviour at each boundary, with screenshots
```

**Charter 3 — Checkout flow integrity:**
```
Charter: Explore the checkout flow for edge cases and integrity issues
Time box: 30 minutes
Focus areas:
  - Completing checkout as a guest vs registered user
  - What happens when back button is pressed during checkout
  - Selecting a Sunday delivery slot (which should not be available)
  - Proceeding to payment with an empty cart
  - Session timeout during checkout
Output: Structured report of findings organised by checkout step
```

### QA Analogy

A charter you would give a junior tester is a charter you can give an AI agent. The same precision, the same specificity, the same clear output expectation. If you would not hand an unstructured "just explore the checkout" to a junior tester, do not give it to an AI agent either.

The more specific your charter, the more specific and useful the exploration report.

---

## MCP-Connected Claude for Live App Browsing

### How It Works

With Playwright MCP configured (from Chapter 1), Claude has access to a real browser. When you give it a charter in Claude Desktop, it opens the browser, navigates to Veg Cart, and begins executing the exploration. It takes screenshots, observes what happens, and reports its findings.

This is not a test script. Claude is not following a predetermined sequence. It is making decisions about what to try next based on what it sees — the same way a human explorer would.

### What Claude Can Do with Playwright MCP

- Open any URL in a real Chromium browser
- Click elements, fill in forms, select from dropdowns
- Scroll, hover, and perform keyboard actions
- Take screenshots at any point
- Wait for specific elements or states
- Read the text content of any visible element
- Report what it observes, including unexpected behaviour

### Sample Exploration Prompt (with Veg Cart context)

```
You are a QA engineer exploring the Veg Cart application. Your charter is:

Charter: Explore coupon code behaviour at checkout
Focus areas:
  - Apply coupon SAVE10 to an eligible order (cart over ₹200)
  - Apply coupon SAVE10 when the cart total is exactly ₹200
  - Apply coupon SAVE10 when the cart total is ₹199
  - Apply an invalid coupon code: BADCODE
  - Apply an expired coupon: EXPIRED30
  - Try to apply SAVE10 twice on the same order
  - Check what happens when a coupon is applied and then an item is removed

For each scenario:
1. Note the starting state
2. Describe the action taken
3. Note exactly what the UI shows (including any messages, totals, or errors)
4. Take a screenshot if the behaviour is unexpected or interesting

Return a structured report under each scenario heading.

The application URL is: [staging URL]
Test account: email: test@vegcart.qa, password: TestPass123
```

### Reviewing the Output

Claude will return a report something like this:

```
## Coupon Exploration Report — Veg Cart Checkout

### Scenario 1: Apply SAVE10 to eligible order (₹350 cart)
- Added 3 carrots (₹150) and 2 tomatoes (₹100) and 1 spinach (₹100)
- Cart total: ₹350 + ₹40 delivery = ₹390
- Entered SAVE10, clicked Apply
- Result: Coupon applied. Subtotal reduced from ₹350 to ₹315 (10% discount).
  Delivery charge unchanged at ₹40. New total: ₹355.
- Screenshot: [attached]
- Status: ✅ As expected

### Scenario 3: Apply SAVE10 when cart total is ₹199
- Added 1 spinach (₹100) and 1 ginger (₹99) — total ₹199
- Entered SAVE10, clicked Apply
- Result: [UNEXPECTED] No error message appeared. The coupon was applied and
  the 10% discount was given despite the cart being below the ₹200 minimum.
  Screenshot attached.
- Status: ⚠️ Potential bug — coupon minimum order check not enforced
```

You review this report. You confirm the suspected bug by checking the business rule. You raise a bug report. You save the structured findings to your exploration log in the repository.

---

## AI Agents for Active Exploration

### The Three Agent Roles

In Level 3, you will work with three AI agents: Planner, Generator, and Healer. In Level 2, exploratory testing introduces the concept:

**Planner:** Receives your charter, breaks it into specific exploration tasks, decides the sequence. You write the charter; the Planner decides what to try and in what order.

**Explorer:** Executes the plan — opens Veg Cart, performs interactions, takes screenshots, captures observations. This is what Playwright MCP Claude does in Level 2.

**Reporter:** Structures the exploration output into a coherent, organised report. The output from the explorer session becomes the input for the reporter's structured summary.

In Level 2, Claude with Playwright MCP acts as all three in a single session. In Level 3, dedicated agents take on each role with more sophistication.

### Multi-Agent Direction — Where This Is Going

The industry in 2025 is moving toward multi-agent exploration pipelines that run automatically:

1. QA writes a charter
2. Planner agent analyses the charter and designs the exploration sequence
3. Explorer agent executes each scenario, capturing screenshots and observations
4. Reporter agent structures the findings into a report
5. QA reviews the report and decides what warrants a bug report

This is not fully autonomous — QA still writes the charter and reviews the findings. But the execution happens without manual intervention. Teams running Type 4 AI SDLC (covered in Level 4) are beginning to use this pattern in production.

---

## Structured Exploration Capture

### Why Structure Matters

Unstructured exploratory testing notes are valuable in the moment but lose value quickly. "Checked the coupon — seemed fine except for the minimum order thing" is not useful two weeks later when you want to know what was tested, why, what was found, and what was decided.

Structured capture means every exploration session produces a record that:
- Describes what was explored and why
- Documents exactly what was found (including screenshots)
- Records what decision was made about each finding
- Can be read by a future AI agent to generate tests for the same scenarios

### The Capture Format

Save your exploration findings as a JSON or markdown file in your project's `/exploration/` folder.

**Markdown format (human-readable):**
```markdown
# Exploration Session: Veg Cart Coupon Code Behaviour
Date: 2025-01-15
Charter: Explore coupon edge cases at checkout
Tester: Claude (Playwright MCP) + QA Review

## Summary
Explored 7 coupon scenarios. Found 1 potential bug (minimum order not enforced).
4 scenarios behaved as expected. 2 scenarios need clarification.

## Findings

### COUPON-01: Valid coupon on eligible order
- Status: ✅ Pass
- Steps: Added items > ₹200. Applied SAVE10.
- Observed: 10% discount applied to subtotal. Delivery unchanged.
- Decision: As expected. Create automation TC.

### COUPON-03: Valid coupon below minimum order
- Status: ⚠️ Bug Candidate
- Steps: Added items totalling ₹199. Applied SAVE10.
- Observed: Coupon applied despite being below the ₹200 minimum.
  No error message shown.
- Decision: Raise bug. Priority: High (financial impact).
- Bug raised: BUG-042

## Test Cases to Automate
- TC: Apply valid coupon to eligible order
- TC: Apply coupon below minimum — expect error
- TC: Apply expired coupon — expect error
- TC: Apply already-used coupon — expect error
```

### Why This Feeds Level 3

The structured exploration output is the input for Level 3 automation generation. In Level 3, the Planner agent reads your exploration logs and uses them to:

- Know which scenarios have already been manually verified and need automation
- Understand the exact UI behaviour observed (which selector was used, what text appeared)
- Generate Page Object Model classes for the pages visited during exploration
- Generate spec tests and Cucumber step definitions for the scenarios captured

If your exploration capture is vague and unstructured, the Level 3 agents cannot use it effectively. If it is structured and specific, they generate accurate, relevant automation from it.

---

## Practice Tasks

### Task 1 — Write three charters for Veg Cart
Write one charter each for:
1. The add-to-cart quantity validation
2. The user registration form
3. The delivery slot selection

Each charter should have: area, time box, 4–5 focus areas, and output expectation.

### Task 2 — Execute a charter with Playwright MCP
Choose one of your charters from Task 1. Give it to Claude Desktop with Playwright MCP configured. Review the exploration report. Identify:
- What was found as expected
- What was unexpected or potentially a bug
- What was missed

### Task 3 — Create a structured exploration log
Take the output from Task 2 and reformat it as a structured markdown file. Save it to `/exploration/session-01-[feature].md` in your project. Include: date, charter, summary, findings with status, and test cases to automate.

### Task 4 — Review AI vs human exploration
After the Playwright MCP session, spend 10 minutes exploring the same area yourself manually. What did you find that AI missed? What did AI find faster than you would have? Write down the differences — this is your assessment of where AI exploration excels and where human instinct still adds more.

---

## Key Takeaways

- Exploratory testing fundamentals have not changed: charter-based, instinct-driven, judgement-required
- What has changed: execution speed, coverage breadth, structured capture, and tirelessness — AI provides all four
- The charter + AI agent model is: QA writes the charter (the mission), AI executes it (the exploration), QA reviews the findings (the judgement)
- A good charter answers three questions: what area, what risks, what output
- The more specific your charter, the more specific and useful the exploration report
- Structured capture — saving exploration findings in a consistent, detailed format — is what allows the output to be used in Level 3 automation generation
- Independent QA exploration (blind to dev coverage) is one of the critical practices in the parallel stream model — you find what dev could not find because you have different assumptions
- AI agents in Level 2 are explorers; in Level 3 they become generators and healers as well

---

## Common Questions

**Q: If AI explores the application, am I still doing exploratory testing?**

A: Yes — you are doing the most important part of it. You are writing the charter (defining what to investigate and why), reviewing the findings (deciding what is a bug and what is expected), and applying domain knowledge (knowing which findings actually matter for Veg Cart users). The manual navigation is what AI has taken over — not the testing thinking.

**Q: What if Claude misidentifies something as a bug?**

A: This is expected. Claude reports observations — it does not know your business rules with certainty. Some "unexpected behaviours" it flags will be features you have not told it about. This is why QA review of the exploration report is essential. Apply your domain knowledge: does this behaviour match the business rule? If yes, it is not a bug. If no, it is.

**Q: How do I handle exploration of features that require complex setup state?**

A: For complex scenarios (e.g., testing a coupon that has already been used requires having used it first), you can either: set up the state manually and hand off to Claude at the starting point, ask Claude to set up the state as part of the charter execution, or use pre-seeded test data that puts the application in the required state.

**Q: Should I save every exploration session to the repository?**

A: Save sessions that found something meaningful or covered a significant feature for the first time. A session that found nothing unexpected is less valuable to archive. The sessions that found bugs, edge cases, or informed automation are the ones worth keeping — they become part of your project's quality intelligence over time.

**Q: How is this different from running an automated regression suite?**

A: Automated regression verifies that known, already-tested behaviour continues to work. Exploratory testing discovers unknown behaviour — bugs that nobody wrote a test for because nobody knew to look. AI exploration is closer to manual exploration than to regression automation. The goal is discovery, not verification.
