# Chapter 6 — Natural Language to Playwright Test

---

## The Problem

A product manager writes: "When a user who forgot their password clicks 'Forgot Password', enters their email, and clicks Submit, they should see a confirmation message."

An automation engineer reads this and writes a Playwright test. This translation step takes time and introduces interpretation gaps. What if the AI translated the description directly into a Playwright test draft?

---

## Theory: What the AI Needs

To generate a complete, useful test, the AI needs:
1. **What to test** — the scenario in plain English
2. **What page objects exist** — so it uses methods, not locators
3. **Your conventions** — test structure, import style, naming

The output is always a draft. You review it before it goes into the codebase.

---

## Step 1 — The Test Generator Chain

```typescript
// ai/test-generator.ts
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

const TestSchema = z.object({
  fileName: z.string().describe('Filename for the test, e.g., forgot-password.spec.ts'),
  imports: z.array(z.string()).describe('Import statements needed'),
  testCode: z.string().describe('Complete Playwright test code including test.describe and test blocks'),
  notes: z.array(z.string()).describe('Review notes for the engineer — things to verify or fix'),
});

type GeneratedTest = z.infer<typeof TestSchema>;

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
const structuredModel = model.withStructuredOutput(TestSchema);

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a Playwright test engineer. Generate a Playwright TypeScript test from a scenario description.

Rules:
- Import from '@playwright/test' and from page object files
- NEVER use page.locator(), page.getByRole() etc. in tests — only call page object methods
- All assertions (expect) must be inside page object methods, not in the test itself
- Follow this structure:
  test.describe('[Feature]', () => {{
    test.beforeEach(async ({{ page }}) => {{ /* setup */ }});
    test('[scenario]', async ({{ page }}) => {{ /* page object calls only */ }});
  }});
- Add a note for the engineer for any assumption you made`,
  ],
  [
    'human',
    `Scenario: {scenario}

Available Page Objects:
{pageObjects}

Generate a complete Playwright test.`,
  ],
]);

const chain = prompt.pipe(structuredModel);

export async function generateTest(
  scenario: string,
  pageObjects: string
): Promise<GeneratedTest> {
  return await chain.invoke({ scenario, pageObjects });
}
```

---

## Step 2 — Describe Your Page Objects

Give the AI a plain-English description of your page objects:

```typescript
// scripts/generate-test.ts
import 'dotenv/config';
import { generateTest } from '../ai/test-generator.js';

const pageObjects = `
LoginPage (pages/login.page.ts):
  - navigateTo(): navigates to the login page
  - fillEmail(email: string): fills the email field
  - fillPassword(password: string): fills the password field
  - clickSignIn(): clicks the sign in button and verifies redirect to dashboard
  - clickForgotPassword(): clicks the forgot password link
  - verifyErrorMessage(message: string): verifies error message is visible

ForgotPasswordPage (pages/forgot-password.page.ts):
  - fillEmail(email: string): fills the email address field
  - clickSubmit(): submits the form
  - verifyConfirmationMessage(): verifies the success message is displayed
`;

const scenario = `
When a user clicks "Forgot Password" on the login page, 
enters their email address, and clicks Submit, 
they should see a confirmation message saying their reset email has been sent.
Also test that entering an invalid email format shows a validation error.
`;

const result = await generateTest(scenario, pageObjects);

console.log('File:', result.fileName);
console.log('\nImports:');
result.imports.forEach((i) => console.log(i));
console.log('\nTest Code:\n', result.testCode);
console.log('\nNotes for review:');
result.notes.forEach((n) => console.log('-', n));
```

---

## Step 3 — Example AI Output

```typescript
// File: forgot-password.spec.ts

import { test } from '@playwright/test';
import { LoginPage } from '../pages/login.page.js';
import { ForgotPasswordPage } from '../pages/forgot-password.page.js';

test.describe('Forgot Password', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigateTo();
  });

  test('should show confirmation when valid email is submitted', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const forgotPage = new ForgotPasswordPage(page);

    await loginPage.clickForgotPassword();
    await forgotPage.fillEmail('user@example.com');
    await forgotPage.clickSubmit();
    await forgotPage.verifyConfirmationMessage();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const forgotPage = new ForgotPasswordPage(page);

    await loginPage.clickForgotPassword();
    await forgotPage.fillEmail('not-an-email');
    await forgotPage.clickSubmit();
    // NOTE: No validation error method on ForgotPasswordPage — add verifyEmailError() method
  });
});
```

**AI notes for engineer:**
- `user@example.com` was used as a placeholder — replace with a test account email
- `ForgotPasswordPage` does not have a `verifyEmailError()` method — you need to create it
- The test assumes clicking `clickForgotPassword()` navigates directly to the forgot password page — verify this behaviour

---

## Step 4 — Review Checklist

Before merging AI-generated tests:

- [ ] No locators in the test file (only page object method calls)
- [ ] All page object methods referenced actually exist
- [ ] Placeholder data replaced with real or factory-generated data
- [ ] Test names are descriptive and complete sentences
- [ ] `beforeEach` sets up only what is shared across all tests in the describe block
- [ ] Assertions are inside page object methods (not naked `expect()` in test body)

---

## What This Means for Manual QA

This chapter is where manual QA engineers have the most influence. The quality of the generated test depends directly on the clarity of the scenario you write.

**Vague scenario → vague test:**
> "Test the login page" → AI generates something but misses most edge cases

**Clear scenario → useful test draft:**
> "When a user enters a valid email and a password shorter than 8 characters, clicking Sign In should display an error message below the password field. The user should remain on the login page." → AI generates a focused, specific test

---

## Interview Questions

**Beginner**
1. Why does the prompt say "NEVER use page.locator() in tests"? What should tests use instead?
2. What is the purpose of the `notes` field in the generated test schema?

**Intermediate**
3. The AI generates a test that calls `forgotPage.verifyEmailError()` but this method does not exist yet. What are two ways to handle this situation?
4. How would you modify this system to generate tests for multiple scenarios from a requirements document in one call?

**Advanced**
5. Design a pipeline that: (1) reads a Jira ticket description, (2) generates a Playwright test, (3) evaluates the test quality with LangSmith, and (4) creates a GitHub PR if quality is above 0.75. Describe each component and how they connect.

---
