# Chapter 4 — Prompt Templates

---

## What You Will Learn

- What a Prompt Template is and why hardcoding prompts is a mistake
- How to build reusable templates with fill-in-the-blank variables
- How to compose System and Human templates together
- How to build a QA-specific prompt library
- How to version and test your prompts like code

---

## 4.1 The Problem

You have written a prompt that generates test cases from a feature description. It works well. You copy it into three different scripts — one for login testing, one for checkout, one for profile management.

Six months later, a tester points out the test cases do not include accessibility checks. You update the prompt. Now you have to find every script that has a copy of it and update all three separately. You miss one. Bugs follow.

This is the same problem that hardcoded URLs, hardcoded selectors, and hardcoded test data solve in test automation. The solution is the same too: extract the repeated thing into one place, parameterise the parts that change, and reuse it everywhere.

In LangChain, that solution is called a **Prompt Template**.

---

## 4.2 What a Prompt Template Is

**A Prompt Template is a reusable message pattern with named placeholders for the parts that change.**

In test automation, think of a test template like this:

```
Test ID: TC-{module}-{number}
Feature: {featureName}
Precondition: User is logged in as {userRole}
Steps: {steps}
Expected: {expectedResult}
```

A Prompt Template works exactly the same way. You define the structure once. You fill in the variables when you use it.

```
You are a QA expert. Generate test cases for the following feature:

Feature: {featureName}
User Role: {userRole}
Format: Given-When-Then
```

The parts in curly braces — `{featureName}`, `{userRole}` — are variables. LangChain fills them in at runtime.

---

## 4.3 Your First Prompt Template

```typescript
import { ChatPromptTemplate } from '@langchain/core/prompts';

// Define the template.
// The string uses {variableName} syntax for placeholders.
const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a QA expert. Write test cases in Given-When-Then format.'],
  ['human', 'Generate {count} test cases for the {featureName} feature.'],
]);

// Fill in the variables.
const messages = await prompt.format({
  count: '5',
  featureName: 'user login',
});

console.log(messages);
```

`fromMessages()` takes an array of `[role, content]` pairs. The role can be `'system'`, `'human'`, or `'ai'`. This is a shorthand for creating `SystemMessage` and `HumanMessage` objects manually.

`format()` fills in the placeholders and returns a formatted string (or array of messages, depending on which format method you call).

---

## 4.4 Connecting a Template to a Model

A template on its own does not call the AI. You connect it to a model using the pipe operator (`|`). This creates a **chain** — an object you can call with `invoke()`.

```typescript
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'You are a QA expert. Write test cases in Given-When-Then format. ' +
    'Number each test case. Be concise.',
  ],
  [
    'human',
    'Generate {count} test cases for the {featureName} feature. ' +
    'User role: {userRole}.',
  ],
]);

// The pipe operator connects prompt → model.
// This creates a Runnable — something you can invoke.
const chain = prompt.pipe(model);

// Call the chain with your variable values.
const response = await chain.invoke({
  count: '3',
  featureName: 'password reset',
  userRole: 'registered user',
});

console.log(response.content);
```

**Output:**
```
1. Given a registered user on the login page
   When they click "Forgot Password" and enter a valid email
   Then they should receive a password reset email within 2 minutes

2. Given a registered user who requested a password reset
   When they click the reset link after it has expired (24 hours)
   Then they should see an "expired link" error and be prompted to request again

3. Given a registered user on the reset password form
   When they submit a new password that does not meet complexity requirements
   Then they should see a specific error message listing the unmet requirements
```

Three test cases, in the format you specified, for the feature you requested. Change `featureName` to "shopping cart" and you get shopping cart test cases. Change `userRole` to "guest user" and the test cases adapt accordingly.

---

## 4.5 Building a QA Prompt Library

Once you have Prompt Templates, the natural next step is to organise them into a library. Every QA team has recurring prompt needs:

- Generate test cases from a feature description
- Analyse a bug report and extract root cause
- Review a test case for gaps
- Convert manual steps to Playwright code
- Generate test data that matches a schema

Create a file `src/prompts/qa-library.ts`:

```typescript
import { ChatPromptTemplate } from '@langchain/core/prompts';

// ─────────────────────────────────────────────────────────────────────────────
// TEST CASE GENERATION
// ─────────────────────────────────────────────────────────────────────────────

export const testCaseGeneratorPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a senior QA engineer with 10 years of experience.
Generate test cases that are:
- Written in Given-When-Then format
- Numbered sequentially
- Covering happy path, error paths, and edge cases
- Clear enough for a junior tester to execute without explanation`,
  ],
  [
    'human',
    `Feature: {featureName}
Description: {featureDescription}
User roles involved: {userRoles}
Number of test cases to generate: {count}`,
  ],
]);

// ─────────────────────────────────────────────────────────────────────────────
// BUG REPORT ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

export const bugReportPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a QA lead who triages bug reports.
When given a bug description, return a structured analysis with:
- Summary (one sentence)
- Steps to reproduce (numbered)
- Root cause hypothesis
- Severity (Critical / High / Medium / Low) with justification
- Suggested fix`,
  ],
  [
    'human',
    `Bug description:
{bugDescription}`,
  ],
]);

// ─────────────────────────────────────────────────────────────────────────────
// TEST CASE REVIEW
// ─────────────────────────────────────────────────────────────────────────────

export const testReviewPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a QA reviewer. Review test cases and identify:
- Missing edge cases
- Unclear or ambiguous steps
- Missing preconditions
- Missing assertions
Return your review as a numbered list of specific, actionable improvements.`,
  ],
  [
    'human',
    `Review the following test cases:

{testCases}`,
  ],
]);
```

Now use the library from any script:

```typescript
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { testCaseGeneratorPrompt } from './prompts/qa-library.js';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
const chain = testCaseGeneratorPrompt.pipe(model);

const response = await chain.invoke({
  featureName: 'Two-Factor Authentication',
  featureDescription: 'Users can enable TOTP-based 2FA on their accounts.',
  userRoles: 'admin, standard user',
  count: '5',
});

console.log(response.content);
```

The prompts are defined once. They are imported and reused everywhere. When you need to improve a prompt — say, add "include accessibility test cases" to the system message — you change it in one file and every script that imports it gets the improvement automatically.

---

## 4.6 Validating Your Templates

A missing variable in a prompt template fails at runtime with a cryptic error. Validate your templates during startup:

```typescript
import { ChatPromptTemplate } from '@langchain/core/prompts';

const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a QA expert.'],
  ['human', 'Generate {count} test cases for {featureName}.'],
]);

// inputVariables lists all detected {variableName} placeholders.
console.log(prompt.inputVariables);
// Output: ['count', 'featureName']
```

Write a test that verifies every template in your library has the variables you expect:

```typescript
// src/prompts/qa-library.test.ts
import { testCaseGeneratorPrompt, bugReportPrompt } from './qa-library.js';

// Verify input variables exist
const tcVars = testCaseGeneratorPrompt.inputVariables;
console.assert(tcVars.includes('featureName'), 'Missing featureName');
console.assert(tcVars.includes('count'), 'Missing count');

const bugVars = bugReportPrompt.inputVariables;
console.assert(bugVars.includes('bugDescription'), 'Missing bugDescription');

console.log('All prompt variables verified.');
```

This is prompt testing — the same way you test your POM locators to make sure they still work.

---

## 4.7 What This Means for Testers

A Prompt Template is to an AI call what a Page Object Method is to a Playwright locator. You define it once, you name it well, you keep it in a shared file, and you call it from multiple places. You never hardcode a prompt string directly inside a script the same way you never hardcode `page.locator('.btn-login')` directly inside a test.

Build the prompt library early. It becomes the most valuable asset in your AI testing toolkit — more useful than any individual script, because every script reuses it.

---

## Interview Questions — Chapter 4

**Q1. What is a Prompt Template in LangChain?**

A Prompt Template is a reusable message pattern with named placeholders for variable content. Instead of hardcoding a prompt string in each script, you define the structure once with `{variableName}` placeholders and fill them in at call time. It is the same concept as a test case template — the structure stays the same; only the specific values change per use.

**Q2. Why is hardcoding prompts directly in scripts a problem?**

Because prompts evolve over time. When a hardcoded prompt needs to be updated, you must find and update every copy manually. Missed copies cause inconsistent behaviour. Prompt Templates solve this by centralising the definition — change it once, and every script that uses it gets the update. This follows the same DRY (Don't Repeat Yourself) principle used in Page Object Models.

**Q3. What does the pipe operator (`|`) do in LangChain?**

The pipe operator connects two Runnables into a sequence. `prompt.pipe(model)` creates a chain where the output of the prompt (formatted messages) is automatically passed as the input to the model. The result is a single Runnable that you call with `invoke()`, passing the template variables. You do not need to manually pass messages from prompt to model.

**Q4. What is `ChatPromptTemplate.fromMessages()`?**

A factory method that creates a Chat Prompt Template from an array of `[role, content]` pairs. Role can be `'system'`, `'human'`, or `'ai'`. Content is the message string with optional `{variable}` placeholders. It is shorthand for manually creating `SystemMessage` and `HumanMessage` objects.

**Q5. How would you organise prompts in a large QA automation project?**

Create a dedicated `src/prompts/` folder. Export each prompt as a named constant from a typed module (e.g., `qa-library.ts`). Group prompts by purpose — test generation, bug analysis, data generation. Write a validation test that checks `prompt.inputVariables` matches the expected list of variables. This prevents runtime failures from typos in variable names and makes prompts discoverable across the team.

---
