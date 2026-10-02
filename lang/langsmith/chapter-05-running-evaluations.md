# Chapter 5 — Running Evaluations

---

## The Problem

You have a dataset of 20 requirements with expected test case themes. You want to run your AI generator against all 20 and get a score. You want this score to update every time you change the prompt.

LangSmith's `evaluate()` function does exactly this: it runs your AI against every example in a dataset, applies one or more evaluators, and produces a summary with scores.

---

## How `evaluate()` Works

```
Dataset (20 examples)
      ↓
Your AI function runs on each example
      ↓
Evaluator scores each output
      ↓
LangSmith records all results + average score
```

---

## The Core Pattern

```typescript
import { evaluate } from 'langsmith/evaluation';

const results = await evaluate(
  yourAIFunction,    // function to evaluate
  {
    data: 'your-dataset-name',   // or dataset ID
    evaluators: [yourEvaluator], // one or more evaluators
    experimentPrefix: 'prompt-v2', // names this experiment in LangSmith
  }
);
```

---

## Complete Evaluation Example

```typescript
import 'dotenv/config';
import { evaluate } from 'langsmith/evaluation';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { Run, Example } from 'langsmith';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// ── The function to evaluate ─────────────────────────────────────────────

// LangSmith calls this with { inputs: { feature: "..." } }
async function generateTestCases(input: { feature: string }): Promise<{ testCases: string }> {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `Generate 4 test cases for the given feature. 
Format each as: <number>. [Test Case Title]: [Steps] | Expected: [result]`,
    ],
    ['human', input.feature],
  ]);
  const chain = prompt.pipe(model);
  const response = await chain.invoke({ feature: input.feature });
  return { testCases: response.content as string };
}

// ── Evaluator 1: Coverage check (heuristic) ──────────────────────────────

// An evaluator receives the run (AI output) and the example (inputs + expected outputs)
function coverageEvaluator(run: Run, example: Example): { key: string; score: number } {
  const output = (run.outputs?.testCases ?? '') as string;
  const expectedThemes = (example.outputs?.expectedThemes ?? []) as string[];

  const outputLower = output.toLowerCase();
  let covered = 0;

  for (const theme of expectedThemes) {
    // Check if any word from the expected theme appears in the output
    const words = theme.toLowerCase().split(' ');
    if (words.some((w) => w.length > 3 && outputLower.includes(w))) {
      covered++;
    }
  }

  const score = expectedThemes.length > 0 ? covered / expectedThemes.length : 1;

  return {
    key: 'theme-coverage',    // Name of this metric in LangSmith
    score,                    // 0.0 to 1.0
  };
}

// ── Evaluator 2: Minimum test count ──────────────────────────────────────

function countEvaluator(run: Run): { key: string; score: number } {
  const output = (run.outputs?.testCases ?? '') as string;
  const testCount = (output.match(/^\d+\./gm) ?? []).length;

  return {
    key: 'test-count-ok',
    score: testCount >= 3 ? 1 : 0,  // 1 = pass, 0 = fail
  };
}

// ── Run the evaluation ────────────────────────────────────────────────────

const results = await evaluate(generateTestCases, {
  data: 'qa-test-generation-v1',
  evaluators: [coverageEvaluator, countEvaluator],
  experimentPrefix: 'gpt4o-prompt-v1',
  maxConcurrency: 4,  // run 4 examples in parallel
});

console.log('\nEvaluation complete.');
console.log('Results URL:', results.experimentName);

// Summarise scores
const summary: Record<string, number[]> = {};
for await (const result of results) {
  for (const evalResult of result.evaluationResults?.results ?? []) {
    const key = evalResult.key;
    if (!summary[key]) summary[key] = [];
    if (evalResult.score !== undefined) summary[key].push(evalResult.score);
  }
}

for (const [key, scores] of Object.entries(summary)) {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  console.log(`${key}: ${(avg * 100).toFixed(1)}%`);
}
```

---

## Reading Evaluation Results in LangSmith

After the evaluation runs:
1. Go to LangSmith → your project → **Experiments** tab
2. Click your experiment (`gpt4o-prompt-v1`)
3. See a table: each row is one example, each column is one evaluator metric
4. Green cells = high score, red cells = low score
5. The summary row at the top shows the average for each metric

---

## Comparing Experiments

After you change your prompt and run evaluation again with a different `experimentPrefix`:

1. In the **Experiments** tab, select both experiments
2. Click **Compare**
3. See side-by-side: which metric improved, which got worse

**What this means for testers:** This is A/B testing for your prompt. You now have data to back up "prompt version 2 is 15% better at covering edge cases."

---

## Interview Questions

**Beginner**
1. What three arguments does `evaluate()` always require?
2. What does the `score` returned by an evaluator represent?

**Intermediate**
3. Your evaluator returns a score of `1` or `0` only. Is this valid? What are the trade-offs compared to a continuous score from 0 to 1?
4. You run the same evaluation twice. Are the results guaranteed to be the same? Why or why not?

**Advanced**
5. You have 500 examples in your dataset. Running all 500 in sequence takes 45 minutes. How would you reduce evaluation time, and what are the risks of doing so?

---
