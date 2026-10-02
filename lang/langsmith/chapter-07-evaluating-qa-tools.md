# Chapter 7 — Evaluating AI QA Tools

---

## The Problem

Your team has built three AI tools: a test-case generator, a bug-triage classifier, and a test-data factory. Each has been running for a month. You want answers to:

- Is the test-case generator actually producing good test cases?
- Is the bug classifier getting the priority right?
- Is the test-data factory generating realistic data?

This chapter shows you how to build evaluation pipelines for each type of QA AI tool.

---

## Evaluating a Test-Case Generator

### Dataset design

Each example: one requirement as input, key quality indicators as expected output.

```typescript
const testCaseDataset = [
  {
    inputs: { requirement: 'User can add items to a wishlist.' },
    outputs: {
      mustCover: ['add item', 'remove item', 'view wishlist', 'empty wishlist'],
      minCount: 4,
    },
  },
  // more examples...
];
```

### Evaluators

```typescript
import type { Run, Example } from 'langsmith';
import { ChatOpenAI } from '@langchain/openai';

const judge = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });

// Evaluator 1: Does it cover expected scenarios?
function scenarioCoverageEvaluator(run: Run, example: Example) {
  const output = (run.outputs?.result ?? '').toString().toLowerCase();
  const mustCover = (example.outputs?.mustCover ?? []) as string[];
  const covered = mustCover.filter((s) => output.includes(s.toLowerCase()));
  return {
    key: 'scenario-coverage',
    score: mustCover.length > 0 ? covered.length / mustCover.length : 1,
  };
}

// Evaluator 2: Minimum test case count
function testCountEvaluator(run: Run, example: Example) {
  const output = (run.outputs?.result ?? '').toString();
  const count = (output.match(/^\d+\./gm) ?? []).length;
  const minCount = (example.outputs?.minCount ?? 3) as number;
  return {
    key: 'test-count',
    score: count >= minCount ? 1 : count / minCount,
  };
}

// Evaluator 3: LLM quality judge
async function qualityEvaluator(run: Run, example: Example) {
  const requirement = (example.inputs?.requirement ?? '') as string;
  const testCases = (run.outputs?.result ?? '') as string;
  const response = await judge.invoke([
    {
      role: 'system',
      content: 'Score these test cases from 1-10. Only respond: SCORE: <number>',
    },
    { role: 'user', content: `Requirement: ${requirement}\n\nTest Cases:\n${testCases}` },
  ]);
  const match = (response.content as string).match(/SCORE:\s*([1-9]|10)/i);
  return { key: 'llm-quality', score: (match ? parseInt(match[1]) : 5) / 10 };
}
```

---

## Evaluating a Bug Priority Classifier

### What makes a classifier evaluator different?

With classification, you have a **correct answer**. This is a reference-based evaluator. You know the expected category (Critical / High / Medium / Low) for each bug.

```typescript
const bugClassifierDataset = [
  {
    inputs: {
      bug: 'Payment page throws 500 error for all users during checkout.',
    },
    outputs: { correctPriority: 'Critical' },
  },
  {
    inputs: {
      bug: 'Tooltip on profile page has a typo.',
    },
    outputs: { correctPriority: 'Low' },
  },
  // more examples...
];

// Evaluator: exact match
function priorityMatchEvaluator(run: Run, example: Example) {
  const predicted = (run.outputs?.priority ?? '').toString().trim();
  const expected = (example.outputs?.correctPriority ?? '') as string;
  return {
    key: 'priority-exact-match',
    score: predicted.toLowerCase() === expected.toLowerCase() ? 1 : 0,
  };
}

// Evaluator: directional accuracy (Critical should never be classified as Low)
function priorityDirectionEvaluator(run: Run, example: Example) {
  const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const predicted = priorityOrder[(run.outputs?.priority ?? '').toString().toLowerCase()] ?? 0;
  const expected = priorityOrder[(example.outputs?.correctPriority ?? '').toString().toLowerCase()] ?? 0;

  if (expected === 0 || predicted === 0) return { key: 'priority-direction', score: 0.5 };

  const diff = Math.abs(predicted - expected);
  return {
    key: 'priority-direction',
    score: diff === 0 ? 1 : diff === 1 ? 0.7 : diff === 2 ? 0.3 : 0,
  };
}
```

---

## Evaluating a Test-Data Factory

Test data should be:
- **Realistic** — looks like real user data
- **Valid** — passes any format/type constraints
- **Diverse** — not just one pattern repeated

```typescript
async function testDataRealisticEvaluator(run: Run, example: Example) {
  const data = (run.outputs?.testData ?? '').toString();
  const dataType = (example.inputs?.dataType ?? 'user') as string;

  const response = await judge.invoke([
    {
      role: 'system',
      content: `Rate this test data realism from 1-10. Is it realistic ${dataType} data?
Penalise: fake names like "Test User", sequential IDs like 1/2/3, missing required fields.
Respond: SCORE: <number>`,
    },
    { role: 'user', content: data },
  ]);
  const match = (response.content as string).match(/SCORE:\s*([1-9]|10)/i);
  return { key: 'data-realism', score: (match ? parseInt(match[1]) : 5) / 10 };
}

function testDataFormatEvaluator(run: Run) {
  const data = (run.outputs?.testData ?? '').toString();
  try {
    const parsed = JSON.parse(data);
    const isArray = Array.isArray(parsed);
    const hasItems = isArray && parsed.length > 0;
    return { key: 'data-valid-json-array', score: hasItems ? 1 : 0.5 };
  } catch {
    return { key: 'data-valid-json-array', score: 0 };
  }
}
```

---

## Running All Three Evaluations

```typescript
import { evaluate } from 'langsmith/evaluation';
import { Client } from 'langsmith';

const client = new Client();

// Create datasets (once)
// ... (see Chapter 4 for dataset creation)

// Evaluate test case generator
await evaluate(testCaseGenerator, {
  data: 'qa-test-generation-v1',
  evaluators: [scenarioCoverageEvaluator, testCountEvaluator, qualityEvaluator],
  experimentPrefix: 'test-gen-eval',
});

// Evaluate bug classifier
await evaluate(bugClassifier, {
  data: 'bug-priority-classifier-v1',
  evaluators: [priorityMatchEvaluator, priorityDirectionEvaluator],
  experimentPrefix: 'bug-classifier-eval',
});

// Evaluate test data factory
await evaluate(testDataFactory, {
  data: 'test-data-factory-v1',
  evaluators: [testDataFormatEvaluator, testDataRealisticEvaluator],
  experimentPrefix: 'test-data-eval',
});

console.log('All evaluations complete. View results in LangSmith.');
```

---

## Interview Questions

**Beginner**
1. Why does the bug classifier evaluator use a reference-based approach instead of an LLM judge?
2. What would a `priority-exact-match` score of 0.6 mean across a dataset of 10 examples?

**Intermediate**
3. The directional accuracy evaluator (`priority-direction`) gives partial credit instead of 0/1. When is this preferable to exact match?
4. How would you evaluate a tool that generates Playwright selectors? What evaluators would you design?

**Advanced**
5. You want to evaluate whether the test data factory generates truly diverse data — not just realistic. Design an evaluator that checks for diversity across 10 generated records.

---
