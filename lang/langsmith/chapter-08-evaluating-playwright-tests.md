# Chapter 8 — Evaluating AI-Generated Playwright Tests

---

## The Problem

Your AI generates Playwright tests from natural language descriptions. The tests look reasonable. But are they actually good Playwright tests?

- Do they follow the Page Object Model pattern?
- Do they have proper assertions (not just navigation)?
- Are they maintainable and readable?
- Would a senior automation engineer approve them?

You want automated scores for all of these — before the tests go into the repo.

---

## What Makes a Good Playwright Test?

From a senior automation engineer's perspective:

| Criterion | Bad | Good |
|---|---|---|
| Locator strategy | `page.locator('#submit')` | `page.getByRole('button', { name: 'Submit' })` |
| Assertions | None after action | `await expect(page).toHaveURL('/success')` |
| Page Object Model | Locators in test | Methods via page objects |
| Test isolation | Depends on previous test state | `beforeEach` with fresh state |
| Descriptive name | `test('test1')` | `test('checkout with valid card succeeds')` |

---

## Dataset Design for Playwright Evaluation

Each example: a description of what the test should do. Expected output: quality indicators.

```typescript
const playwrightTestDataset = [
  {
    inputs: {
      description: 'Test that a logged-in user can add an item to the cart and see it in the cart page.',
    },
    outputs: {
      mustInclude: ['expect', 'getByRole', 'toHaveURL', 'toBeVisible'],
      mustNotInclude: ['#', 'document.querySelector'],
      minAssertions: 2,
    },
  },
  {
    inputs: {
      description: 'Test that the login form shows a validation error when the password is less than 8 characters.',
    },
    outputs: {
      mustInclude: ['expect', 'toBeVisible', 'fill', 'click'],
      mustNotInclude: ['sleep', 'waitForTimeout'],
      minAssertions: 1,
    },
  },
];
```

---

## Heuristic Evaluators for Playwright Code

```typescript
import type { Run, Example } from 'langsmith';

// Evaluator 1: Uses semantic locators
function semanticLocatorEvaluator(run: Run) {
  const code = (run.outputs?.test ?? '').toString();
  const semanticMethods = ['getByRole', 'getByText', 'getByLabel', 'getByPlaceholder', 'getByTestId'];
  const found = semanticMethods.filter((m) => code.includes(m));

  // Penalise CSS id/class locators
  const badLocators = (code.match(/#[a-z]/gi) ?? []).length + (code.match(/\.[a-z]/gi) ?? []).length;
  const penalty = Math.min(badLocators * 0.1, 0.5);

  return {
    key: 'semantic-locators',
    score: Math.max(0, found.length > 0 ? 1 - penalty : 0 - penalty),
  };
}

// Evaluator 2: Has assertions
function hasAssertionsEvaluator(run: Run, example: Example) {
  const code = (run.outputs?.test ?? '').toString();
  const assertions = (code.match(/await expect\(/g) ?? []).length;
  const minRequired = (example.outputs?.minAssertions ?? 1) as number;
  return {
    key: 'has-assertions',
    score: assertions >= minRequired ? 1 : assertions / minRequired,
  };
}

// Evaluator 3: No hardcoded waits
function noHardcodedWaitsEvaluator(run: Run) {
  const code = (run.outputs?.test ?? '').toString();
  const badPatterns = ['waitForTimeout', 'sleep', 'setTimeout'];
  const found = badPatterns.filter((p) => code.includes(p));
  return {
    key: 'no-hardcoded-waits',
    score: found.length === 0 ? 1 : 0,
  };
}

// Evaluator 4: Required keywords present
function requiredKeywordsEvaluator(run: Run, example: Example) {
  const code = (run.outputs?.test ?? '').toString();
  const mustInclude = (example.outputs?.mustInclude ?? []) as string[];
  const mustNotInclude = (example.outputs?.mustNotInclude ?? []) as string[];

  const includeScore = mustInclude.length === 0
    ? 1
    : mustInclude.filter((k) => code.includes(k)).length / mustInclude.length;

  const excludePenalty = mustNotInclude.filter((k) => code.includes(k)).length * 0.2;

  return {
    key: 'keyword-compliance',
    score: Math.max(0, includeScore - excludePenalty),
  };
}
```

---

## LLM Judge for Playwright Code Quality

```typescript
import { ChatOpenAI } from '@langchain/openai';

const judge = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });

async function playwrightQualityJudge(run: Run, example: Example) {
  const description = (example.inputs?.description ?? '') as string;
  const code = (run.outputs?.test ?? '') as string;

  const response = await judge.invoke([
    {
      role: 'system',
      content: `You are a Playwright expert reviewing AI-generated test code.
Score from 1-10:
- 3 pts: Uses getByRole/getByLabel/getByText (not CSS selectors)
- 3 pts: Has at least 2 expect() assertions
- 2 pts: No waitForTimeout or hardcoded sleeps
- 2 pts: Test description is specific and clear

Respond:
SCORE: <1-10>
ISSUES: <comma-separated list of problems, or "none">`,
    },
    {
      role: 'user',
      content: `Description: ${description}\n\nCode:\n\`\`\`typescript\n${code}\n\`\`\``,
    },
  ]);

  const text = response.content as string;
  const scoreMatch = text.match(/SCORE:\s*([1-9]|10)/i);
  const issuesMatch = text.match(/ISSUES:\s*(.+)/i);

  return {
    key: 'playwright-quality',
    score: (scoreMatch ? parseInt(scoreMatch[1]) : 5) / 10,
    comment: issuesMatch ? issuesMatch[1].trim() : '',
  };
}
```

---

## Full Evaluation Run

```typescript
import 'dotenv/config';
import { evaluate } from 'langsmith/evaluation';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

async function generatePlaywrightTest(input: { description: string }) {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `Generate a Playwright TypeScript test for the given description.
Requirements:
- Use getByRole, getByLabel, getByText for locators (not CSS selectors)
- Add at least 2 expect() assertions
- No waitForTimeout or hardcoded sleeps
- Use descriptive test name
- Import { test, expect } from '@playwright/test'`,
    ],
    ['human', input.description],
  ]);
  const chain = prompt.pipe(model);
  const response = await chain.invoke({ description: input.description });
  return { test: response.content as string };
}

const results = await evaluate(generatePlaywrightTest, {
  data: 'playwright-test-generation-v1',
  evaluators: [
    semanticLocatorEvaluator,
    hasAssertionsEvaluator,
    noHardcodedWaitsEvaluator,
    requiredKeywordsEvaluator,
    playwrightQualityJudge,
  ],
  experimentPrefix: 'playwright-gen-eval',
  maxConcurrency: 3,
});

console.log('Playwright test evaluation complete. View in LangSmith.');
```

---

## Interview Questions

**Beginner**
1. Name three criteria for a good Playwright test that can be checked with a heuristic evaluator.
2. Why is `waitForTimeout` penalised in Playwright tests?

**Intermediate**
3. The `semanticLocatorEvaluator` applies a penalty for CSS selectors found in the code. What edge case might cause false positives with this approach?
4. You want to evaluate whether the generated test actually follows the Page Object Model. Can a heuristic evaluator do this reliably? Explain.

**Advanced**
5. Design an evaluator that checks if a generated Playwright test is syntactically valid TypeScript (without running it). What tool or approach would you use, and what are its limitations?

---
