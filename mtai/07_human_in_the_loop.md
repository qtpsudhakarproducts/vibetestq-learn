# Chapter 7: Human-in-the-Loop (HITL)

## Introduction to HITL
Human-in-the-Loop (HITL) means that while AI does the work, a human constantly oversees, verifies, and corrects the output.
*   **The Trap**: It is tempting to "Set and Forget" AI. This is dangerous.
*   **The Rule**: AI is the *Co-pilot*. You are the *Pilot*. You don't take a nap while the autopilot is on.

## Why HITL is Mandatory
1.  **Hallucinations**: AI can confidently state false facts. It might invent an incredibly convincing test case for a feature that doesn't exist.
2.  **Context Blindness**: AI knows the code, but it doesn't know the *business context*. It doesn't know that "User ID 1" is the CEO and deleting it will crash the company audit.
3.  **Bias**: AI might inadvertently skip testing for minority demographics if its training data was biased.

## Four HITL Decisions
When to intervene?
1.  **Validation**: "Is this test case actually testing the requirement?"
2.  **Correction**: "The step says 'Click Blue Button', but the button is actually Green. I need to fix this."
3.  **Augmentation**: "The AI missed the 'Timeout' scenario. I'll add it manually."
4.  **Rejection**: "This code is garbage. I'll throw it away and write it myself."

## Evaluation Methods
*   **Code Review**: Do not just copy-paste AI code. Read it line by line.
*   **Logic Check**: Does the test flow make sense?
*   **Safety Check**: Is the test destructively deleting data it shouldn't?

## AI Output Quality Assurance
We need to "QA the QA."
*   *Correctness*: Is it true?
*   *Consistency*: If I ask twice, do I get similar quality?
*   *Tone*: Is the generated documentation professional?

**Analogy: The Editor-in-Chief**
*   **The GenAI**: Is a tireless journalist who writes 100 articles an hour.
*   **The HITL (You)**: Is the Editor. You check facts, fix grammar, ensure the tone matches the branding, and decide what gets published. If you publish fake news (bugs/hallucinations), the blame falls on the Editor, not the journalist.

---

## HITL Decision Framework

When AI produces output, you must make one of four decisions for *every* piece:

| Decision | When to Use | Example |
|----------|-------------|---------|
| **Accept** | AI output is correct, complete, and context-appropriate. | AI generates a valid test case for a login form with all right steps. |
| **Modify** | AI output is mostly correct but missing context, wrong priority, or slightly off. | AI writes a test case but misses that your app uses SSO, not password login. |
| **Augment** | AI output is good but incomplete — you need to add missing scenarios. | AI generates 8 test cases; you add 3 more based on your domain knowledge. |
| **Reject** | AI output is wrong, hallucinated, irrelevant, or unsafe. | AI generates test cases for a "shopping cart" feature that doesn't exist in scope. |

**Rule of thumb**: Accept = AI was right. Modify = AI was close. Augment = AI was insufficient. Reject = AI was wrong. Track your decision ratios over time — if you're rejecting > 30%, your prompts need improvement.

---

## HITL Review Checklist

Use this checklist when reviewing *any* AI-generated test artifact:

### For Test Cases
- [ ] Does this test case trace back to a real requirement? (Not hallucinated)
- [ ] Is the precondition realistic and achievable in our test environment?
- [ ] Are the steps specific enough to be reproducible?
- [ ] Is the expected result measurable and unambiguous?
- [ ] Does the test case use real test data (not placeholder like "test123")?
- [ ] Are there any security-sensitive steps that should NOT be automated? (e.g., testing with real payment credentials)
- [ ] Does this test case duplicate an existing one?
- [ ] Does this cover the negative/edge scenario, not just the happy path?

### For Bug Reports
- [ ] Is the title specific (not generic like "Login broken")?
- [ ] Are the reproduction steps written from a clean starting state?
- [ ] Is the severity correct based on actual business impact?
- [ ] Is the environment (browser, OS, build version) specified?
- [ ] Is PII or sensitive data masked in any attached screenshots/data?
- [ ] Is this actually a bug, or is it working as designed? (Check the requirement first)

### For Test Data
- [ ] Does the data cover all equivalence partitions (valid, invalid, boundary)?
- [ ] Is any personally identifiable information (PII) synthetic (not real)? (GDPR/HIPAA compliance)
- [ ] Are the formats correct (email format, phone format, date format)?
- [ ] Does the data include special characters, unicode, and internationalization cases?
- [ ] Is there data for error conditions (negative balances, future birthdates, etc.)?

### For Gherkin / BDD Feature Files
- [ ] Is the feature title meaningful and business-oriented (not technical)?
- [ ] Does each `Given` describe a clear, achievable precondition?
- [ ] Does each `When` describe a single user action (not multiple actions)?
- [ ] Does each `Then` contain a specific, verifiable assertion?
- [ ] Are data tables in `Scenario Outlines` covering all equivalence classes?

### For Test Summary Reports
- [ ] Do the numbers match your actual execution tool (Jira/TestRail count)?
- [ ] Is the Go/No-Go recommendation aligned with the exit criteria agreed at planning?
- [ ] Are all open critical bugs explicitly listed (not buried in aggregates)?
- [ ] Is the "Lessons Learned" section honest and action-oriented?

---

## Common AI Hallucination Patterns in Testing

Knowing where AI goes wrong helps you spot errors faster.

| Hallucination Type | Example | How to Catch |
|-------------------|---------|-------------|
| **Feature invention** | AI generates test cases for "Social Login with Google" when your app only supports email login. | Always cross-reference with the actual requirements document. |
| **Wrong field names** | AI writes "Click the 'Submit Payment' button" but the button is labeled "Confirm Order." | Compare steps against a screenshot or the actual UI specification. |
| **Incorrect error messages** | AI expects "Password must be 8-16 characters" but the real app says "6-20 characters." | Always verify expected results against the real requirement or spec. |
| **Invented APIs** | AI generates test cases referencing endpoints that don't exist in your Swagger. | Cross-reference every API endpoint with actual API documentation. |
| **Wrong tooling syntax** | AI generates Jira steps that reference a field name that Jira calls differently in your configured project. | Know your tool configuration; test AI-generated tool instructions manually once. |
| **Over-generalization** | AI applies generic e-commerce test cases to a healthcare app, missing domain-specific rules. | Always include the domain context in your prompt AND review with domain knowledge. |

---

## HITL Log Template

Keep a HITL log — this is evidence of your quality process and demonstrates value.

| Date | Artifact Type | AI Tool Used | Decision (A/M/Au/R) | Issue Found | Correction Made |
|------|--------------|-------------|---------------------|-------------|-----------------|
| 2026-03-01 | Test Suite | Claude | Modify | AI assumed SSO; we use email login | Rewrote login steps |
| 2026-03-01 | Test Data | ChatGPT | Augment | Missing boundary value (max length) | Added TC with 256-char email |
| 2026-03-02 | Bug Report | Claude | Accept | None needed | Approved as-is |
| 2026-03-02 | Feature File | Claude | Reject | AI generated tests for feature not in scope | Discarded; rewrote manually |

---

## Hands-On HITL Practice
**Exercise**:
1.  Ask AI to generate test cases for a "Login" screen.
2.  **Deliberate Error**: The AI might assume there is a "Forgot Password" link.
3.  **Your Job**: Check the actual screen. If there is no "Forgot Password" link, you must catch this hallucination and remove that test case.
*This process of Verification is the core daily task of the AI Manual Tester.*

**Extended Exercise**:
1.  Take the test cases generated in the exercise above.
2.  Complete the HITL Review Checklist for each one.
3.  Record your Accept/Modify/Augment/Reject decisions in the HITL Log template.
4.  Measure: What percentage did you accept unchanged? What percentage needed modification?
