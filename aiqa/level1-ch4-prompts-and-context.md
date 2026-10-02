# Level 1 — Chapter 4: Prompts & Context

## What This Chapter Is About

This chapter teaches you how to talk to AI effectively. A prompt is not just a question — it is a structured communication that gives the model everything it needs to produce a useful, accurate, and correctly formatted response. The difference between a vague prompt and a well-structured prompt is the difference between spending 20 minutes reformatting AI output and using it directly. By the end of this chapter, you will consistently write prompts that produce useful QA outputs on the first or second attempt.

---

## Why It Matters for QA

The single biggest factor in how useful AI is to a QA professional is not the AI model — it is the prompt. The model is the same for everyone. What varies is the quality of the instructions given to it. A QA engineer who writes good prompts gets test cases that match their application, bug reports ready to paste into Jira, and Gherkin scenarios that need minimal editing. A QA engineer who writes vague prompts gets generic output that needs significant rework — and often concludes that AI "doesn't really work."

---

## What is a Prompt?

### Plain Explanation

A prompt is the message you send to an AI tool. It can be a question, an instruction, a request, or a combination of all three. The prompt is the entire input the model has to work with when generating its response.

Everything the model knows about your specific task comes from your prompt. There is no background briefing, no implicit context, no assumed knowledge of your application or your conventions. The prompt is everything.

### QA Analogy

A prompt is like a work ticket you raise for a contractor. You have hired a highly skilled contractor — experienced, capable, fast. But they have never worked for your company and know nothing about your project.

If your ticket says "Fix the login page," the contractor does not know what is broken, what the login page looks like, what technology it uses, or what "fixed" means. They will do something — but it may not be what you needed.

If your ticket says "The login page shows a generic error message when the password is wrong. It should show 'Incorrect password. Please try again.' Update the error message text in the login validation function, which is in `auth/login.controller.js` on line 47," the contractor knows exactly what to do.

The same principle applies to AI prompts. A vague ticket gets vague work. A precise ticket gets precise work.

---

## Anatomy of an Effective Prompt

Every well-structured prompt has four components. You do not always need all four — but the more of them you include, the more useful the response.

```
Role + Context + Instruction + Format = Great Output
```

---

## Component 1: Role

### Plain Explanation

Role tells the model who to be when responding. Setting a role changes the perspective, depth, vocabulary, and assumptions the model brings to its response. Without a role, the model responds as a general assistant. With a role, it responds as a specialist.

### Why Role Matters

Ask an AI "explain test-driven development" with no role. You get a general explanation suitable for a beginner. Ask the same question with "Act as a senior QA engineer explaining TDD to a developer who has never worked with a QA team" — and you get a much more targeted, useful explanation with the right framing and the right vocabulary.

### QA Role Examples

| Situation | Role to Use |
|---|---|
| Writing test cases | "Act as a senior QA engineer with expertise in e-commerce testing." |
| Reviewing a bug report | "Act as a QA lead reviewing a junior engineer's bug report for completeness." |
| Writing Gherkin | "Act as a BDD practitioner writing feature files for a Cucumber test suite." |
| Explaining automation code | "Act as a Playwright automation expert explaining test code to a manual QA engineer." |
| Generating test data | "Act as a QA data engineer generating realistic synthetic test data for a food ordering application." |

### What to Watch Out For

Setting a role does not guarantee the model will stay in that role. If your prompt becomes long or complex, the role framing can fade. For very long prompts, briefly restate the role mid-prompt or at the end: "Remember, you are acting as a senior QA engineer."

---

## Component 2: Context

### Plain Explanation

Context is the background information the model needs to tailor its response to your specific situation. Without context, the model uses the patterns from its training data — which represent typical applications, not your application.

Context answers the questions: What application is being tested? What does this feature do? What are the constraints and business rules? Who are the users? What technology is being used?

### QA Analogy

Think about handing a new QA joiner their first assignment. You would not simply say "test the checkout." You would brief them: "The checkout has three steps. Step one is cart review, step two is address entry, step three is payment. We accept Visa and Mastercard only — no PayPal, no debit. Guest checkout is available. Delivery is available Monday to Saturday. Minimum order is ₹200."

That briefing is context. The more specific and accurate it is, the more relevant and useful the test cases the new joiner writes.

That briefing is exactly what the Context component of your prompt should contain.

### What Good Context Looks Like

**Without context:**
```
Write test cases for the checkout page.
```

**With context:**
```
Our e-commerce checkout has 3 steps: cart review, address entry, payment.
Payment accepts Visa and Mastercard only — no PayPal or debit cards.
Guest checkout is supported without account creation.
Orders below ₹200 cannot be placed.
Delivery is available Monday to Saturday; Sunday is not available.
Coupon codes give a flat 10% discount and can only be used once per account.

Write test cases for the checkout flow.
```

The difference in output quality between these two prompts is dramatic. The second prompt produces test cases that match your actual application. The first produces a generic checkout test suite that could apply to any application.

### How Much Context Is Enough?

Provide enough context to describe the specific behaviour you want tested. You do not need to describe the entire application — only the feature being tested and its relevant rules. Three to eight sentences of context is usually sufficient for a single feature.

If you find yourself providing the same context repeatedly, that is a signal to create a Skills.md file (covered in Chapter 5) — so the context loads automatically.

---

## Component 3: Instruction

### Plain Explanation

Instruction is the actual task you want the model to perform. Be specific. Vague instructions produce vague results. The instruction should specify what you want, how many items, what scenarios to cover, and what level of detail is expected.

### The Specificity Principle

| Vague Instruction | Specific Instruction |
|---|---|
| "Write some test cases" | "Write 8 test cases covering: happy path, invalid email format, wrong password, account lockout after 3 failed attempts, empty fields, and password reset" |
| "Check this requirement" | "Identify any ambiguous terms, missing acceptance criteria, edge cases not covered, and contradictions with other requirements" |
| "Help with my bug report" | "Rewrite this bug report to be clearer, add a root cause hypothesis, and rate the severity as Critical/High/Medium/Low with justification" |
| "Generate test data" | "Generate 10 user records with: name, email, Indian mobile number, and delivery address in Bangalore. All data should be synthetic — no real people." |

### QA Instruction Patterns

**For test case generation:**
```
Write [number] test cases covering: [scenario list].
```

**For requirement review:**
```
Identify: (1) ambiguous terms, (2) missing acceptance criteria, (3) unstated edge cases, (4) contradictions.
```

**For bug report writing:**
```
Write a Jira bug report with: Summary, Environment, Steps to Reproduce, Expected Result, Actual Result, Severity, and Root Cause Hypothesis.
```

**For code explanation:**
```
Explain what this test does in plain English. What is being tested? What are the assertions? What scenarios does it miss?
```

---

## Component 4: Format

### Plain Explanation

Format tells the model how to structure the output. This is the most underused component of a prompt and the one with the most immediate impact on how much time you spend reformatting after you receive the response.

If you do not specify a format, the model will choose one — and it may not be the format you need. Specifying format means your output is often usable directly, without reformatting.

### Why Format Matters

Imagine you need test cases ready to paste into Jira. If you ask for "test cases" with no format specified, you might get a numbered list with prose descriptions. If you specify "return as a markdown table with columns: Test ID, Scenario Name, Preconditions, Steps, Expected Result" — you get exactly what you need for Jira, ready to copy.

### QA Format Examples

| Output Needed | Format Instruction |
|---|---|
| Jira test cases | "Return as a markdown table with columns: ID, Title, Preconditions, Steps, Expected Result, Priority" |
| Cucumber feature file | "Return as a Gherkin .feature file with Scenario Outlines where multiple data sets apply" |
| Manual checklist | "Return as a numbered list — one line per check" |
| Bug report | "Return in this structure: Summary / Environment / Steps to Reproduce / Expected / Actual / Severity / Root Cause Hypothesis" |
| API test scenarios | "Return as a JSON array with fields: method, endpoint, requestBody, expectedStatusCode, expectedResponseField, testDescription" |

### The Format Rule

Before writing any prompt, ask yourself: "Where does this output need to go?" If the answer is Jira → request a table. If the answer is a .feature file → request Gherkin. If the answer is a code review → request a numbered list. The format instruction makes the output immediately useful rather than useful after reformatting.

---

## Putting It Together — Full Prompt Examples

### Example 1: Test Case Generation

```
Act as a senior QA engineer specialising in e-commerce applications.

Our registration form has three fields:
- Email (must be unique in the system, must be valid format)
- Password (minimum 8 characters, must contain at least 1 uppercase letter and 1 number)
- Username (3–20 characters, letters and numbers only, must be unique)

After successful registration, the user receives a verification email.
Registration fails silently — the page stays on the form with field-level error messages.

Write 10 test cases covering: successful registration, all field validation rules,
duplicate email, duplicate username, and what happens when the verification email
is not received.

Return as a markdown table with columns: ID, Scenario, Preconditions, Steps, Expected Result.
```

### Example 2: Bug Report Writing

```
Act as a QA engineer writing a professional Jira bug report.

Issue: On the checkout page, when a user applies a discount coupon that has already
been used, the page shows a spinning loader indefinitely instead of showing an error
message. The browser console shows a 500 error from the coupon validation API.

Environment: Chrome 122, macOS Ventura, staging environment, logged-in user account.

Write a complete bug report with: Summary, Environment, Steps to Reproduce,
Expected Result, Actual Result, Severity (with justification), and Root Cause Hypothesis.
```

### Example 3: Requirement Review

```
Act as a senior QA engineer reviewing requirements for testability.

Requirement: "Users can apply discount codes at checkout. Codes should give
appropriate discounts based on the type of code used."

Identify:
1. Terms that are ambiguous or undefined
2. Acceptance criteria that are missing
3. Edge cases not mentioned
4. Questions a developer would have before building this

Return as a numbered list under each of the four headings.
```

---

## Iterative Prompting

### Plain Explanation

Iterative prompting means treating a conversation with AI the same way you treat a QA review cycle — not as a one-shot transaction but as a progressive refinement loop. The first response is a first draft. Your review adds value. Your follow-up prompt incorporates your feedback. The next response is better. You continue until the output is what you need.

### QA Analogy

You raise a bug. The developer fixes it. You retest. If it is not quite right, you add more detail to the bug. The developer fixes it again. You retest. This is not a sign of failure — it is how quality work gets done iteratively. Working with AI is the same loop.

### The Iterative Prompting Pattern

```
First prompt → Generate initial output
Your review  → What is missing? What is wrong? What needs more detail?
Second prompt → "Add negative scenarios for [specific case]."
Your review  → Closer. What still needs changing?
Third prompt → "The error message wording in TC-04 should be [exact text]. Update it."
```

### Useful Follow-Up Prompts for QA

**When scenarios are missing:**
```
Review the test cases you just generated. What negative paths are missing?
What boundary values were not tested? Add 3 more scenarios to fill these gaps.
```

**When output is too generic:**
```
The test cases are too generic. Update TC-02, TC-05, and TC-07 to include
the specific error messages and UI behaviours from the context I provided.
```

**When asking AI to critique its own output:**
```
Review the test cases you just generated. Act as a test lead reviewing
a junior engineer's work. What would you flag as incomplete or incorrect?
```

**When format needs adjustment:**
```
Reformat the test cases as a Gherkin .feature file with a Scenario Outline
for the cases that differ only in input data.
```

### The One Mistake to Avoid

The most common mistake in iterative prompting is assuming the first response is the final answer. QA professionals who dismiss AI after one poorly formatted response are the equivalent of someone who sends one email to a new contractor, receives an imperfect first draft, and concludes the contractor is incompetent.

The value of AI compounds across a conversation. The fifth exchange in a focused conversation is usually much more useful than the first.

---

## Good vs Deceptive-Looking Output

### Plain Explanation

Well-formatted AI output is not the same as correct output. This distinction is critical for QA professionals. An AI-generated test suite can be perfectly formatted, well-named, and syntactically correct Gherkin — and still miss your most critical test scenarios.

### What Deceptive Output Looks Like

You ask for test cases for a registration form. AI returns 10 scenarios:
- TC-01: Successful registration with valid data ✅
- TC-02: Invalid email format ✅
- TC-03: Password too short ✅
- TC-04: Duplicate email ✅
- TC-05: Empty email field ✅
- TC-06: Empty password field ✅
- TC-07: Username too long ✅
- TC-08: Username with special characters ✅
- TC-09: Registration when server is down ✅
- TC-10: Registration confirmation email sent ✅

**It looks comprehensive. What is missing?**
- Duplicate username — one of your most common real failures
- Password maximum length — your system has a 50-character limit nobody documented
- SQL injection in the username field — critical security scenario
- Email with a subdomain (user@test.company.com) — fails due to a known regex issue
- Case sensitivity of the email field — your system treats User@test.com and user@test.com as different

The output looks like 10/10. The coverage is actually 6/10 for what matters.

### How to Review AI-Generated Output Like a QA Engineer

Apply the same critical thinking to AI output that you would apply to a developer's code:

1. **Map each scenario to a requirement:** Does every business rule have at least one test case? What business rules have no test case?
2. **Ask: what are the top 3 ways this feature breaks?** Do you see a test case for each?
3. **Check boundary values explicitly:** Are the exact boundaries being tested — not near them, but exactly at them?
4. **Look for negative scenarios:** Is there at least one negative case for every positive case?
5. **Ask AI to critique itself:** "What scenarios did you miss? What edge cases are underrepresented?"

---

## Practice Tasks

### Task 1 — Build a complete prompt
Choose a feature from your current or most recent project. Write a prompt using all four components: Role, Context, Instruction, and Format. Use it with Claude. Review the output against the actual feature behaviour.

### Task 2 — The format difference experiment
Write the same prompt twice — identical Role, Context, and Instruction, but different Format instructions. First: "Return as a numbered list." Second: "Return as a markdown table with columns: ID, Scenario, Steps, Expected Result." Compare how much reformatting each output needs.

### Task 3 — Iterative refinement
Take the output from Task 1. Write three follow-up prompts:
1. Ask AI to identify what it missed
2. Ask AI to add the missing scenarios
3. Ask AI to reformat the output for Jira

Notice how the quality improves across three exchanges compared to the first response alone.

### Task 4 — The deceptive output exercise
Take a set of AI-generated test cases (from Task 1 or 3). Map each test case to a specific requirement or business rule. Identify which business rules have no test case. These are your coverage gaps.

---

## Key Takeaways

- A prompt is the complete specification for what you want AI to produce — the quality of the prompt determines the quality of the output
- The four components of an effective prompt are: Role, Context, Instruction, and Format — each serves a specific purpose
- Role sets the perspective and expertise the model brings to the response
- Context provides the application-specific information the model cannot guess — without it, output is generic
- Instruction specifies what to do, how many, and what scenarios to cover — vague instructions produce vague results
- Format specifies how the output should be structured — this is the most underused component and the one with the most immediate practical value
- Iterative prompting treats AI like a QA review cycle — the first response is a first draft, not a final answer
- Well-formatted output is not the same as correct output — always review AI-generated test cases against your actual application and requirements

---

## Common Questions

**Q: Do I always need all four components?**

A: No. Simple tasks with obvious format do not need explicit format instructions. Short tasks with enough context in the instruction do not need a separate context block. The rule is: include whatever is needed for the output to be useful without reformatting. For most substantive QA tasks, all four components add value.

**Q: How long should a prompt be?**

A: Long enough to give the model what it needs. Short enough that you are not padding. A typical high-quality QA prompt is 5–10 sentences. The context section is usually the longest part — two to four sentences describing the feature and its rules.

**Q: Can I reuse prompts?**

A: Yes — and you should. A prompt that generated useful output once will generate useful output again in similar situations. Saving prompts in a library (covered in Chapter 5 and Level 2 Day 5) is one of the highest-value habits you can build. A prompt library is a professional asset.

**Q: What if I do not know what format I need?**

A: Start with no format specification and see what the model produces. If the format is not useful, add a format instruction in the follow-up: "Reformat this as a markdown table with columns: [your columns]."

**Q: Is there a risk of prompts becoming too formulaic?**

A: Yes. A rigid template used without thought produces generic prompts, which produce generic output. The four-component structure is a checklist to ensure nothing is missing — not a fill-in-the-blank template. The context component especially requires genuine thought about your specific situation. That thinking is where the value lies.
