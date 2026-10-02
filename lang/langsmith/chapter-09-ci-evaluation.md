# Chapter 9 — Automated Evaluation in CI

---

## The Problem

Evaluations are only useful if they run automatically. Running them manually means they get skipped when the team is busy. And that is exactly when prompt quality degrades — when everyone is rushing.

You want evaluations to run in CI every time someone changes a prompt, and to fail the pipeline if quality drops below a threshold.

---

## The Goal

```
PR opened → CI runs → AI evaluation runs → score checked
                                              ↓
                                        score >= threshold → merge allowed
                                        score < threshold  → PR blocked
```

---

## The Evaluation Script

This script is designed to run in CI. It exits with code 1 if any metric falls below threshold (which fails the CI step):

```typescript
// scripts/evaluate.ts
import 'dotenv/config';
import { evaluate } from 'langsmith/evaluation';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { Run, Example } from 'langsmith';

const THRESHOLDS: Record<string, number> = {
  'scenario-coverage': 0.75,
  'test-count': 1.0,
  'llm-quality': 0.65,
};

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
const judge = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });

// The function under test
async function generateTestCases(input: { requirement: string }) {
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'Generate 4 test cases for the feature. Number each one.'],
    ['human', input.requirement],
  ]);
  const chain = prompt.pipe(model);
  const response = await chain.invoke({ requirement: input.requirement });
  return { result: response.content as string };
}

// Evaluators
function scenarioCoverageEvaluator(run: Run, example: Example) {
  const output = (run.outputs?.result ?? '').toString().toLowerCase();
  const mustCover = (example.outputs?.mustCover ?? []) as string[];
  const covered = mustCover.filter((s) => output.includes(s.toLowerCase()));
  return {
    key: 'scenario-coverage',
    score: mustCover.length > 0 ? covered.length / mustCover.length : 1,
  };
}

function testCountEvaluator(run: Run) {
  const output = (run.outputs?.result ?? '').toString();
  const count = (output.match(/^\d+\./gm) ?? []).length;
  return { key: 'test-count', score: count >= 4 ? 1 : count / 4 };
}

async function qualityJudgeEvaluator(run: Run, example: Example) {
  const requirement = (example.inputs?.requirement ?? '') as string;
  const testCases = (run.outputs?.result ?? '') as string;
  const response = await judge.invoke([
    { role: 'system', content: 'Score these test cases 1-10. Respond: SCORE: <number>' },
    { role: 'user', content: `Requirement: ${requirement}\n\nTest Cases:\n${testCases}` },
  ]);
  const match = (response.content as string).match(/SCORE:\s*([1-9]|10)/i);
  return { key: 'llm-quality', score: (match ? parseInt(match[1]) : 5) / 10 };
}

// Run evaluation and check thresholds
const results = await evaluate(generateTestCases, {
  data: 'qa-test-generation-v1',
  evaluators: [scenarioCoverageEvaluator, testCountEvaluator, qualityJudgeEvaluator],
  experimentPrefix: `ci-run-${process.env.GITHUB_SHA?.slice(0, 8) ?? 'local'}`,
  maxConcurrency: 3,
});

// Collect scores
const scores: Record<string, number[]> = {};
for await (const result of results) {
  for (const evalResult of result.evaluationResults?.results ?? []) {
    if (!scores[evalResult.key]) scores[evalResult.key] = [];
    if (evalResult.score !== undefined) scores[evalResult.key].push(evalResult.score);
  }
}

// Check thresholds
let failed = false;
console.log('\n=== Evaluation Results ===');
for (const [metric, values] of Object.entries(scores)) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const threshold = THRESHOLDS[metric] ?? 0;
  const pass = avg >= threshold;
  console.log(`${pass ? '✓' : '✗'} ${metric}: ${(avg * 100).toFixed(1)}% (threshold: ${threshold * 100}%)`);
  if (!pass) failed = true;
}

if (failed) {
  console.error('\nEvaluation FAILED. Quality below threshold.');
  process.exit(1);  // Fail the CI step
} else {
  console.log('\nEvaluation PASSED.');
  process.exit(0);
}
```

---

## GitHub Actions Workflow

```yaml
# .github/workflows/ai-evaluation.yml
name: AI Quality Evaluation

on:
  pull_request:
    paths:
      - 'src/prompts/**'
      - 'src/chains/**'
      - 'scripts/evaluate.ts'

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run AI evaluation
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          LANGCHAIN_API_KEY: ${{ secrets.LANGCHAIN_API_KEY }}
          LANGCHAIN_TRACING_V2: 'true'
          LANGCHAIN_PROJECT: 'ci-evaluations'
          GITHUB_SHA: ${{ github.sha }}
        run: npx tsx scripts/evaluate.ts
```

---

## Nightly Full Evaluation

For comprehensive evaluation (larger dataset, slower evaluators), run nightly:

```yaml
# .github/workflows/nightly-evaluation.yml
name: Nightly AI Evaluation

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC every night

jobs:
  nightly-eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - name: Run full evaluation suite
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          LANGCHAIN_API_KEY: ${{ secrets.LANGCHAIN_API_KEY }}
          LANGCHAIN_TRACING_V2: 'true'
          LANGCHAIN_PROJECT: 'nightly-evaluations'
        run: npx tsx scripts/evaluate-full.ts
```

---

## Cost Control in CI

| Strategy | How |
|---|---|
| Smaller dataset in PR CI | Use a 10-example "smoke" dataset; full 100-example dataset only nightly |
| Use `gpt-4o-mini` for judge in CI | Cheaper, still directionally correct |
| Cache unchanged evaluations | Skip re-evaluation if prompts haven't changed |
| `maxConcurrency: 5` | Reduce API calls per minute, lower rate-limit risk |
| Set spend limits in OpenAI | Prevent runaway costs from bugs in evaluation scripts |

---

## Interview Questions

**Beginner**
1. What does `process.exit(1)` do in the CI evaluation script, and why is it important?
2. Why does the CI workflow only trigger when files in `src/prompts/**` change?

**Intermediate**
3. You want to run a smoke evaluation (10 examples) on every PR but a full evaluation (100 examples) only nightly. How would you structure the dataset and scripts to support this?
4. The CI evaluation costs $5 per run. After merging 20 PRs, the monthly bill is $100 just for evaluation. What would you change?

**Advanced**
5. A developer changes a prompt and the CI evaluation passes at 78%. Two weeks later, production shows degraded output quality. The evaluation dataset is too easy. Design a strategy to keep evaluation datasets challenging and representative over time.

---
