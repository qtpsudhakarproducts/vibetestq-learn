# Chapter 10 — Observing with LangSmith

---

## The Problem

Your AI tools are running in CI and production. But you cannot see inside them. When the test generator produces a bad test, you do not know if the prompt failed, the model chose poorly, or the input was ambiguous. When the failure analyser gives the wrong category, you have no history to learn from.

LangSmith makes every AI tool in your framework observable — and measurable.

---

## Step 1 — Trace All AI Tools

All LangChain chains are traced automatically when `LANGCHAIN_TRACING_V2=true`. For plain functions, wrap with `traceable`:

```typescript
// ai/data-factory.ts
import { traceable } from 'langsmith/traceable';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.8 });
const chain = prompt.pipe(model.withStructuredOutput(UserSchema));

// Wrap the public function
export const generateUser = traceable(
  async (profileType: string = 'standard') => {
    return await chain.invoke({ profileType });
  },
  { name: 'generate-user', project_name: 'ai-playwright-framework' }
);
```

---

## Step 2 — Tag Traces with Test Context

When AI runs as part of a Playwright test, tag the trace with the test name:

```typescript
// ai/utils/trace-context.ts
import { traceable } from 'langsmith/traceable';

export function withTestContext<T>(
  fn: () => Promise<T>,
  testName: string,
  suiteId: string
): Promise<T> {
  return traceable(fn, {
    name: 'test-ai-call',
    metadata: {
      testName,
      suiteId,
      environment: process.env.CI ? 'ci' : 'local',
    },
  })();
}
```

```typescript
// tests/login.spec.ts
import { test } from '@playwright/test';
import { generateUser } from '../ai/data-factory.js';
import { withTestContext } from '../ai/utils/trace-context.js';

test('login with generated user', async ({ page }) => {
  const user = await withTestContext(
    () => generateUser('standard'),
    'login with generated user',
    'login-suite'
  );
  // ... rest of test
});
```

---

## Step 3 — Build a Dataset from CI Runs

After running tests in CI for two weeks, you have traces. Curate the bad ones into a dataset:

```typescript
// scripts/curate-dataset.ts
import 'dotenv/config';
import { Client } from 'langsmith';

const client = new Client();

// Find recent runs from the test generator project
const runs = client.listRuns({
  projectName: 'ai-playwright-framework',
  filter: 'has(metadata, \'{"testName": "test-generator"}\')',
  limit: 50,
});

const dataset = await client.createDataset('playwright-gen-from-ci-v1', {
  description: 'Test generation inputs from CI runs',
});

const toAdd = [];
for await (const run of runs) {
  // Only add inputs that produced interesting (challenging) outputs
  if (run.outputs?.notes?.length > 0) {  // Has review notes = harder case
    toAdd.push({
      inputs: run.inputs ?? {},
      outputs: run.outputs ?? {},
    });
  }
}

if (toAdd.length > 0) {
  await client.createExamples({
    datasetId: dataset.id,
    inputs: toAdd.map((e) => e.inputs),
    outputs: toAdd.map((e) => e.outputs),
  });
  console.log(`Added ${toAdd.length} examples to dataset`);
}
```

---

## Step 4 — Evaluate Each AI Tool

```typescript
// scripts/evaluate-all.ts
import 'dotenv/config';
import { evaluate } from 'langsmith/evaluation';
import type { Run, Example } from 'langsmith';
import { generateUser } from '../ai/data-factory.js';
import { analyseFailure } from '../ai/failure-analyser.js';

// Evaluate data factory
await evaluate(
  async (input: { profileType: string }) => generateUser(input.profileType),
  {
    data: 'test-data-factory-v1',
    evaluators: [
      // realism and format evaluators from Chapter 7 of LangSmith book
    ],
    experimentPrefix: `data-factory-${new Date().toISOString().slice(0, 10)}`,
    maxConcurrency: 3,
  }
);

// Evaluate failure analyser
await evaluate(
  async (input: { testName: string; errorMessage: string }) =>
    analyseFailure(input.testName, input.errorMessage),
  {
    data: 'failure-analyser-v1',
    evaluators: [
      // category exact match evaluator
      (run: Run, example: Example) => ({
        key: 'category-match',
        score:
          (run.outputs?.category ?? '') === (example.outputs?.correctCategory ?? '') ? 1 : 0,
      }),
    ],
    experimentPrefix: `failure-analyser-${new Date().toISOString().slice(0, 10)}`,
    maxConcurrency: 5,
  }
);

console.log('All evaluations complete.');
```

---

## Step 5 — Dashboard Review Process

After each weekly CI run, your team reviews LangSmith in 15 minutes:

```
Weekly AI Review Agenda (15 min)

1. Open LangSmith → Projects → ai-playwright-framework
2. Check: any new error types in the last 7 days? (filter: status=error)
3. Open Experiments → compare last 3 data-factory runs — scores stable?
4. Open Experiments → compare last 3 failure-analyser runs — category accuracy?
5. If any score dropped >10%: find the failing examples, add to dataset
6. Update baseline experiment prefix for next week
```

---

## Step 6 — Alert on Score Regression in CI

```typescript
// In scripts/evaluate-all.ts — after evaluation runs
const THRESHOLDS = {
  'data-realism': 0.7,
  'data-valid-json-array': 1.0,
  'category-match': 0.8,
  'playwright-quality': 0.65,
};

// Collect and check scores (pattern from LangSmith Chapter 9)
// ... (same pattern as chapter-09-ci-evaluation.ts)
// Exit 1 if any metric below threshold
```

---

## Interview Questions

**Beginner**
1. Why is tracing valuable even when all tests pass?
2. What is the difference between a trace and an experiment in LangSmith?

**Intermediate**
3. You have 500 CI runs traced in LangSmith. Describe how you would find the 10 most interesting runs to add to your evaluation dataset.
4. Your `generate-user` traces show that 20% of runs produce a user with `firstName: "Test"` despite the prompt prohibiting it. What would you change first — the prompt, the evaluator, or the model?

**Advanced**
5. Design a LangSmith monitoring strategy for a framework that runs 1000 AI calls per day across 5 tools. Include: which metrics to track, how often to evaluate, what triggers a human review, and how to prevent alert fatigue.

---
