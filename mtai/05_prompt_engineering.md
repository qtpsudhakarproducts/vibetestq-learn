# Chapter 5: Prompt Engineering

## Intro to Prompt Engineering for Testers
Prompt Engineering is the art of talking to AI to get exactly what you want. It is the most critical skill for the modern tester.

**The Core Principle**: GenAI models are probabilistic — they predict the most likely next token given everything they can see. If your instructions are vague, the model's "best guess" will be generic. If your instructions are specific, structured, and rich with context, the output will be accurate and useful.

Think of a GenAI model as a brilliant contractor who has read millions of documents but has **no memory of your project**. Every conversation starts fresh. Your prompt is the briefing document — it tells the contractor who they are, what they know, what you need, and how to deliver it.

---

### Anatomy of a Prompt

Every prompt you write has up to four components:

| Component | What it does | Example |
|---|---|---|
| **Role / Persona** | Tells the AI who to be | "You are a senior QA engineer specialising in e-commerce systems." |
| **Context** | Provides the background information | "We are testing a checkout flow built with React and a Node.js backend." |
| **Task / Instruction** | The specific action to perform | "Generate 10 boundary value test cases for the quantity field." |
| **Format / Constraints** | How the output should look | "Return as a Markdown table with columns: ID, Description, Input, Expected Result." |

You do not need all four every time, but the more relevant components you include, the better the output.

---

### Why Prompt Engineering Matters for Testers

Testers are natural prompt engineers — they already think in terms of **precise inputs, expected outputs, and edge cases**. This exact mindset transfers directly to writing effective prompts.

**Without prompt engineering skills**, a tester might write:
> *"Give me test cases for the login page."*

This produces generic, shallow test cases that add little value.

**With prompt engineering skills**, the same tester writes:
> *"You are a senior QA engineer. The login page accepts email + password and supports SSO via Google. Write 15 test cases covering: valid/invalid credentials, account lockout after 5 attempts, SSO redirect flow, session expiry after 30 minutes idle, and OWASP authentication risks. Format as a Gherkin feature file."*

This produces targeted, professional-grade test cases immediately usable in the project.

---

### The Four Qualities of a Good Prompt

1. **Specific** — Avoid ambiguity. Say exactly what type of output you need.
2. **Contextual** — Give the AI the background it cannot infer (technology stack, business rules, constraints).
3. **Structured** — Use numbered steps or bullet points for complex multi-part instructions.
4. **Iterative** — Treat the first response as a draft. Follow up with refinements: *"Now add negative test cases"*, *"Rewrite using BDD Gherkin format"*.

---

### Prompting is a Conversation, Not a Command

Unlike a search engine query, AI prompting is **conversational and iterative**. You should:
- Start with a broad prompt to get an initial output
- Critique the output and ask for specific improvements
- Chain prompts — use the output of one prompt as input to the next
- Save effective prompts as reusable templates (covered in the Template Library section)

---

## Prompt Engineering vs. Context Engineering

Prompt Engineering and Context Engineering are related but distinct disciplines. Understanding the difference is critical for working effectively with modern AI agents.

| | Prompt Engineering | Context Engineering |
|---|---|---|
| **Focus** | Crafting a single, well-worded input message | Designing the entire information environment the AI operates in |
| **Scope** | One message at a time | System prompt + memory + tools + conversation history + RAG + agent skills |
| **Analogy** | Writing one perfect memo to a consultant | Setting up a new employee's entire work environment — their office, files, tools, access rights, and ongoing briefings |
| **Output** | Better individual responses | Reliable, consistent agent behaviour across all interactions |

**The shift**: In 2025–2026, as AI agents became capable of multi-step autonomous work, the field recognized that *what you put in the prompt* is only one layer. **Context Engineering** is the discipline of managing *everything the model can see* — including what you intentionally exclude (what the model cannot see matters just as much).

> Andrej Karpathy (former Tesla AI director): *"The hottest new job is Context Engineer — the person who curates, compresses, and structures the full context window for maximum AI performance."*

---

## Context Engineering — The Full Picture

A model's behavior is determined entirely by its context window. Context Engineering is the skill of deliberately designing and managing that window.

### The Six Layers of Context

```
┌─────────────────────────────────────────────┐
│  1. SYSTEM PROMPT                           │  ← Defines persona, rules, scope, format
├─────────────────────────────────────────────┤
│  2. LONG-TERM MEMORY (External)             │  ← Persistent facts: project docs, conventions
├─────────────────────────────────────────────┤
│  3. SHORT-TERM MEMORY (In-conversation)     │  ← What we've discussed so far this session
├─────────────────────────────────────────────┤
│  4. RETRIEVED CONTEXT (RAG)                 │  ← Relevant snippets fetched from a knowledge base
├─────────────────────────────────────────────┤
│  5. TOOL OUTPUTS                            │  ← Results from MCP tools, API calls, file reads
├─────────────────────────────────────────────┤
│  6. USER MESSAGE (The Prompt)               │  ← Your actual request
└─────────────────────────────────────────────┘
```

Prompt Engineering only touches **Layer 6**. Context Engineering designs all six.

---

### Layer 1: System Prompts — The Foundation

A system prompt is the hidden instruction set that shapes the AI's entire persona and behaviour throughout a session. It is set by the *builder* (you or your team), not the end user.

**What belongs in a QA System Prompt**:
*   **Role**: "You are a Senior QA Engineer specializing in E-Commerce applications."
*   **Scope constraints**: "Only generate test artefacts. Do not write code. Do not answer questions outside of software testing."
*   **Output standards**: "Always format test cases as Markdown tables with columns: ID | Scenario | Precondition | Steps | Expected Result | Type."
*   **Domain rules**: "This application follows GDPR. Never suggest test data containing real PII. All test data must be synthetic."
*   **Quality guardrails**: "Always include at least 3 negative scenarios for every feature tested."
*   **HITL reminders**: "After generating any artefact, append a 'Human Review Checklist' with 3–5 verification points."

**Sample QA System Prompt**:
```
You are a Senior QA Engineer working on a Healthcare Patient Portal application.

Your responsibilities:
- Analyse user stories and generate comprehensive test suites
- Always include happy path, negative, boundary, and edge case scenarios
- Apply HIPAA compliance awareness (synthetic data only — no real PII)
- Flag any requirement that is vague, ambiguous, or untestable

Output standards:
- Test cases: Markdown table (ID | Scenario | Precondition | Steps | Expected Result | Severity | Type)
- Bug reports: Title | Severity | Steps | Expected | Actual | Environment
- Always append a 3-item HITL Review Checklist to every generated artefact

Do not: write code, answer non-testing questions, or generate test data with real personal information.
```

---

### Layer 2 & 3: Memory Management

#### Long-Term Memory (Persistent)
Information that persists across sessions — stored externally and injected into context when needed.

**For QA teams, long-term memory includes**:
*   Test strategy decisions ("We always test IE11 compatibility due to client requirements")
*   Domain-specific rules ("Account type codes: 1=Basic, 2=Premium, 3=Enterprise")
*   Recurring test data sets
*   Defect patterns from past sprints ("Payment module historically has race condition bugs")

**Tools**: Files read via Filesystem MCP, Confluence/Notion pages via connectors, vector databases (Pinecone, ChromaDB) for semantic retrieval.

#### Short-Term Memory (In-Session)
The conversation history. As sessions grow long, early context gets compressed or dropped (context windows have limits).

**Techniques for managing session memory**:
*   **Summarize before continuing**: "Summarize the test strategy we've defined so far. I'll start a new context with that summary."
*   **Explicit anchoring**: Begin each new message with context: "In this session we are testing the Checkout module of an E-Commerce app using these requirements: [brief recap]."
*   **Context checkpoints**: Every 10 exchanges, ask AI to list the decisions made so far. Save this as your session log.

---

### Layer 4: RAG — Retrieval-Augmented Generation for QA

RAG connects the AI to a live knowledge base. Instead of cramming all knowledge into the prompt, you retrieve only the relevant snippets at the moment they are needed.

**QA Knowledge Bases worth building**:

| Knowledge Base | What It Contains | How AI Uses It |
|---|---|---|
| Requirements store | All user stories, acceptance criteria | Fetches relevant ACs when generating test cases |
| Test case library | Existing test cases in a vector DB | Prevents duplicate tests; suggests reuse |
| Bug history | Past defect descriptions and root causes | Suggests test cases based on historical failure patterns |
| Domain rules | Business rules, compliance requirements | Injects relevant rules when generating domain-specific tests |
| API documentation | OpenAPI/Swagger specs | Auto-fetches endpoint definitions for API test generation |

**Simple RAG workflow with Filesystem MCP**:
1.  Store all requirements as markdown files in a `/requirements/` folder.
2.  Point Claude's Filesystem MCP at that folder.
3.  Prompt: "Read the requirements for the Checkout module and generate a test suite."
4.  Claude reads only the relevant file — not the entire codebase.

---

### Layer 5: Tool Outputs — What Agents Can See

Every MCP tool call (Jira read, file read, API call) puts its output into the context window. Good context engineering means managing *what tools to call* and *when* so you don't flood the context with irrelevant data.

**Principles**:
*   Fetch only what is needed for the current step.
*   Summarize large tool outputs before passing them to the model.
*   Sequence tool calls so later steps use outputs from earlier ones.

---

### Layer 6 returns to your message — and that's where CRAFT comes in

With the other 5 layers designed well, Layer 6 (your prompt) becomes simpler and more powerful.

---

## CRAFT Framework
A specific formula for writing perfect prompts.

1.  **C**ontext: Who is the AI? (e.g., "You are a Senior QA Engineer...")
2.  **R**ole: What is the task? (e.g., "...analyzing a banking application...")
3.  **A**ction: What do you want it to do? (e.g., "...generate negative test cases...")
4.  **F**ormat: How do you want the output? (e.g., "...in a Markdown table with columns ID, Scenario, Result.")
5.  **T**one: What is the style? (e.g., "...professional and concise.")

**Example Prompt using CRAFT**:
> "You are a **Senior QA Security Expert** (Context/Role). Please **generate 5 SQL Injection test cases** for the Login field (Action). Output the results in a **CSV format** (Format). Ensure the tone is **technical and precise** (Tone)."

## Test Generation Prompt Templates

### 1. The "Persona" Prompt
> "Act as a technically illiterate elderly user. Review this login flow and point out usability issues."
*   *Why*: Uncovers UX issues you might miss.

### 2. The "Devil's Advocate" Prompt (Negative Testing)
> "Review this requirement. Identify 5 ways a malicious user could try to break this feature or bypass the security."
*   *Why*: AI is excellent at "Red Teaming" (thinking like an attacker).

### 3. The "Table" Prompt (Data formatting)
> "Take these unstructured notes and format them into a Gherkin Feature file."

## Advanced Prompt Techniques

### Chain-of-Thought (CoT)
Asking the AI to "think aloud" improves accuracy.
*   *Standard Prompt*: "How many test cases for this screen?" -> AI guesses "5".
*   *CoT Prompt*: "Analyze the screen elements one by one. List the possible states for each. Then, calculate the total combinations needed for coverage." -> AI breaks it down and gives a clearer answer, say "12".

### Few-Shot Prompting
Giving examples.
*   *Prompt*: "Convert these Requirements to Tests.
    Example 1: Req: Login -> Test: Verify Login.
    Req: Search -> Test: ... [AI fills here]"
*   *Why*: Examples steer the AI's pattern matching better than instructions alone.

### Iterative Refinement
Never accept the first answer.
1.  **Draft**: "Generate tests."
2.  **Critique**: "These are too generic. Make them more specific to a Healthcare app."
3.  **Refine**: "Add negative scenarios."

**Analogy: The Intern**
Treat the AI like a bright but inexperienced intern.
*   If you say "Do the testing," they will be confused.
*   If you say "Here is a checklist, here is an example of what I want, now do these 3 specific things," they will do a perfect job.

---

## Expanded Prompt Template Library

### For Test Planning

**Test Strategy Draft**
```
You are a Senior QA Lead with 10 years of experience in [domain, e.g., Healthcare / E-Commerce / Banking].
I am starting a new project: [brief description].
Generate a Test Strategy document covering:
1. Scope (in-scope and out-of-scope)
2. Test levels and types (which ones apply and why)
3. Risk areas and mitigation approach
4. Test environments needed
5. Entry and Exit criteria
6. Tools recommended
Output as a structured Markdown document with headings.
```

**Test Estimation**
```
You are a QA lead. I have [N] user stories for Sprint [X].
Here are the stories: [paste stories]
Estimate the testing effort in hours for each story.
Consider: test case writing, test data preparation, execution, defect retesting, regression.
Output a table: Story | Complexity | Estimated Hours | Notes.
```

---

### For Test Design

**Full Test Suite from User Story**
```
You are a QA engineer. Here is a user story and its acceptance criteria:

[paste user story]

Generate a complete test suite including:
1. Happy path scenarios (successful flows)
2. Negative scenarios (invalid inputs, missing fields, wrong data)
3. Boundary value tests
4. Edge cases (concurrency, timeouts, maximum input lengths)
5. Security-relevant scenarios (injection, unauthorized access)

Format as a table: Test ID | Scenario | Precondition | Steps | Expected Result | Type (Positive/Negative/Edge)
```

**Gherkin / BDD Feature File Generation**
```
Convert the following acceptance criteria into Gherkin syntax (Given/When/Then).
Create one Feature file with multiple Scenarios and Scenario Outlines where applicable.
Use Examples tables for data-driven tests.

Acceptance criteria:
[paste criteria]
```

**Decision Table Generation**
```
I have the following business rules for [feature name]:
[paste rules in plain text]

Generate a complete Decision Table:
- Columns: Condition 1, Condition 2 ... Condition N, Action/Expected Result
- Rows: All combinations (use T/F or Y/N for boolean conditions)
- Highlight combinations that are impossible/not applicable.
```

**State Transition Test Cases**
```
The [feature/object] has the following states: [list states]
The following transitions are valid: [list transitions with triggers]

Generate:
1. Valid path test cases (covering all transitions at least once)
2. Invalid transition test cases (attempting forbidden state changes)
3. A state transition diagram description in text

Format as a numbered test case list.
```

---

### For Exploratory Testing

**Exploratory Testing Charter Generator**
```
I need to test [feature/module] of [application type].
The feature is: [brief description]
Known risks: [list any known issues or high-risk areas]

Generate 5 Exploratory Testing Charters in this format:
Charter: Explore [target] using [technique] to discover [potential issue type]
Session Duration: [30/60/90 minutes]
Setup: [preconditions]
Areas to Focus: [3-5 bullet points]
Note-Taking Prompts: [2-3 questions to guide observation]
```

**Error Guessing Brainstorm**
```
You are an adversarial tester trying to break [feature name] in [application].
The feature works as follows: [description]

List 15 "obvious" and "non-obvious" ways this feature could fail.
For each, label the failure category:
- Input validation
- Boundary/Edge
- Concurrency/Race condition
- Integration/API failure
- State/Session
- Security/Authorization
- Performance/Timeout
- Localization/Encoding
```

---

### For API Testing

**API Test Case Set from OpenAPI/Swagger**
```
I have the following API endpoint documentation:
[paste endpoint details: method, URL, request body schema, response codes]

Generate test cases for:
1. Happy path (valid request → 200/201 response)
2. Missing required fields → expected 400 error
3. Invalid field types → expected 400 error
4. Unauthorized access (missing/invalid token) → expected 401
5. Accessing another user's resource → expected 403
6. Non-existent resource → expected 404
7. Duplicate creation → expected 409
8. Payload too large → expected 413 or 422

Format: Test ID | Method | Endpoint | Request Payload | Expected Status Code | Expected Response Body
```

---

### For Security Testing

**Security Test Checklist from Feature Description**
```
You are a security-focused QA engineer (OWASP WSTG methodology).
I am testing [feature name] in a [web/mobile] application.
Feature description: [paste description]

Generate a security test checklist covering:
1. Authentication & Authorization tests
2. Input validation / Injection risks (SQL, XSS, command injection)
3. Sensitive data exposure risks
4. Session management issues
5. Business logic bypasses
6. Horizontal and vertical privilege escalation paths

For each item, provide: Risk | Test Action | What to Observe
```

---

### For Regression & Maintenance

**Regression Suite Prioritization**
```
I have a regression suite of [N] test cases for [application].
Based on these recent changes in the codebase: [list modules/features changed]

Identify:
1. Which existing test cases have HIGH risk of being affected? (Must run)
2. Which test cases have MEDIUM risk? (Should run if time allows)
3. Which test cases have LOW risk? (Can be deferred)

Output a prioritized table: Test Case ID | Test Name | Impact Risk (H/M/L) | Reason
```

**Bug Clustering Analysis**
```
I have this list of bugs reported in Sprint [X]:
[paste bug list with titles/descriptions]

Analyze and:
1. Group bugs by root cause category (UI, API, Database, Logic, Config)
2. Identify the module/feature with highest defect density
3. Suggest which test cases should be added to prevent recurrence
4. Identify any patterns suggesting systemic issues (not just isolated bugs)
```

---

### For Documentation & Reporting

**Test Summary Report**
```
You are writing a Test Summary Report (TSR) for a QA manager audience.
Here is the execution data:
- Total test cases: [N]
- Passed: [N], Failed: [N], Blocked: [N], Not Run: [N]
- Total bugs raised: [N]; Critical: [N], High: [N], Medium: [N], Low: [N]
- Open bugs: [N]; Closed: [N]
- Sprint goal: [brief description]
- Major features tested: [list]

Generate a professional TSR with:
1. Executive Summary (3 sentences)
2. Test Coverage Summary (table)
3. Defect Summary (table)
4. Risk & Issues
5. Sign-off Recommendation (Go/No-Go with rationale)
```

**Bug Report Drafting**
```
I found a bug with the following observations:
- What I did: [steps you took]
- What I expected: [expected behavior]
- What happened: [actual behavior]
- Environment: [browser/OS/app version]

Write a professional Jira bug report with:
- Title (specific, action-oriented)
- Severity assessment with justification
- Reproducible steps (numbered)
- Expected vs Actual result
- Suggested labels/components
```

---

## Prompt Anti-Patterns (What NOT to Do)

| Anti-Pattern | Bad Prompt Example | Problem | Better Approach |
|---|---|---|---|
| **The Brain Dump** | "Here is my whole 50-page spec. Make tests." | AI loses focus, output is bloated and generic | Feed one feature/story at a time |
| **The Vague Request** | "Generate some test cases." | No context → generic, useless output | Specify feature, application type, testing goal |
| **The One-Shot Assumption** | Accepting the first AI output as complete | First output is always a draft | Always do at least one refinement pass |
| **The Role Mismatch** | "I'm a developer. Write test cases." | AI adjusts tone/depth to a developer | Explicitly say "You are a QA Engineer" |
| **Context Overload** | Pasting 3 different features into one prompt | AI blends them together | One feature per prompt session |
| **Asking for Too Much at Once** | "Write strategy, test cases, bug reports, and RTM." | AI produces shallow content for everything | One artifact per prompt |
| **No Format Specification** | "List test cases." | AI chooses any format — often prose | Always specify: table, Gherkin, JSON, CSV, Markdown |
| **Ignoring AI Hallucinations** | Copy-pasting AI output without review | AI may invent test steps for features that don't exist | Always verify against actual requirements |

---

## Context Window Management

Large test suites and long specifications can exceed the AI's context window (the amount of text it can hold in memory at once).

**Techniques**:
*   **Chunking**: Break large requirements into sections. Test one section per message.
*   **Summarization**: Ask AI to summarize a long spec first, then generate tests from the summary.
*   **Anchoring**: Start each message with key context ("This is for a banking login module with 2FA...") so the AI doesn't lose track.
*   **Reference Files**: With MCP/Cursor, store context in files the AI can read rather than pasting into chat.

---

## Hands-On: Prompt Engineering Exercise

**Scenario**: You are testing an "Appointment Booking" feature in a healthcare app.

**Exercise Steps**:
1.  Write a CRAFT prompt to generate test cases.
2.  Ask AI to critique its own output.
3.  Refine the prompt using Few-Shot technique.
4.  Ask AI to convert the test cases to Gherkin format.
5.  Ask AI to generate 10 rows of test data.

**What to Record**:
*   Your prompt for each step.
*   The AI's output.
*   What you accepted, changed, or rejected.
*   Your reasoning.

This becomes your **Prompt Library entry** — reusable for any appointment/scheduling feature in future projects.
