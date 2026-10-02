# Chapter 6 — Custom Evaluators

---

## The Problem

The coverage evaluator in Chapter 5 uses keyword matching — not very smart. It will give a high score if the AI mentions "login" anywhere, even if the test case is nonsense.

You want evaluators that actually understand quality: Does the test case have clear steps? Does the expected result make sense? Is the test realistic?

For this, you use an **LLM-as-judge evaluator** — you ask an AI to score the output.

---

## Types of Evaluators

| Type | How it works | Best for |
|---|---|---|
| **Heuristic** | Regex, count, format check | Structural rules (has 3+ tests, is valid JSON) |
| **LLM-as-judge** | AI scores the output | Quality, relevance, clarity |
| **Reference-based** | Compare to expected output | When you have ground truth |

---

## Heuristic Evaluator Examples

### Check that output is valid JSON

```typescript
import type { Run } from 'langsmith';

function isValidJsonEvaluator(run: Run) {
  const output = run.outputs?.result ?? '';
  try {
    JSON.parse(output as string);
    return { key: 'valid-json', score: 1 };
  } catch {
    return { key: 'valid-json', score: 0 };
  }
}
```

### Check minimum field coverage

```typescript
function hasRequiredFieldsEvaluator(run: Run) {
  const output = run.outputs?.testCase ?? '';
  const text = (output as string).toLowerCase();
  const required = ['precondition', 'step', 'expected'];
  const found = required.filter((field) => text.includes(field));
  return {
    key: 'has-required-fields',
    score: found.length / required.length,
  };
}
```

---

## LLM-as-Judge Evaluator

```typescript
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import type { Run, Example } from 'langsmith';

const judgeModel = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });

async function qualityJudgeEvaluator(run: Run, example: Example) {
  const feature = (example.inputs?.feature ?? '') as string;
  const testCases = (run.outputs?.testCases ?? '') as string;

  const response = await judgeModel.invoke([
    {
      role: 'system',
      content: `You are a senior QA engineer evaluating AI-generated test cases.
Score the test cases on a scale from 1 to 10.
Criteria:
- Coverage of happy path and edge cases (3 points)
- Clarity of steps (3 points)
- Realistic expected results (2 points)
- No duplicate test cases (2 points)

Respond with:
SCORE: <1-10>
REASON: <one sentence>`,
    },
    {
      role: 'user',
      content: `Feature: ${feature}\n\nTest Cases:\n${testCases}`,
    },
  ]);

  const text = response.content as string;
  const match = text.match(/SCORE:\s*([1-9]|10)/i);
  const rawScore = match ? parseInt(match[1]) : 5;

  return {
    key: 'quality-judge',
    score: rawScore / 10,   // normalise to 0-1
    comment: text,          // optional: record the judge's full reasoning
  };
}
```

---

## Reference-Based Evaluator

When your dataset has expected outputs, compare the AI output to the reference:

```typescript
async function referenceComparisonEvaluator(run: Run, example: Example) {
  const actual = (run.outputs?.testCases ?? '') as string;
  const expectedThemes = (example.outputs?.expectedThemes ?? []) as string[];

  const response = await judgeModel.invoke([
    {
      role: 'system',
      content: `Compare the actual test cases to the expected themes.
Score from 0.0 to 1.0: what proportion of expected themes are addressed?
Respond with JSON: { "score": 0.0-1.0, "missing": ["theme1", ...] }`,
    },
    {
      role: 'user',
      content: `Expected themes: ${expectedThemes.join(', ')}\n\nActual test cases:\n${actual}`,
    },
  ]);

  let score = 0.5;
  try {
    const text = response.content as string;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      score = parsed.score ?? 0.5;
    }
  } catch {
    // Default score if parsing fails
  }

  return { key: 'reference-coverage', score };
}
```

---

## Combining Multiple Evaluators

Pass all evaluators to `evaluate()`:

```typescript
import { evaluate } from 'langsmith/evaluation';

const results = await evaluate(generateTestCases, {
  data: 'qa-test-generation-v1',
  evaluators: [
    isValidJsonEvaluator,         // heuristic
    hasRequiredFieldsEvaluator,   // heuristic
    qualityJudgeEvaluator,        // LLM-as-judge
    referenceComparisonEvaluator, // reference-based
  ],
  experimentPrefix: 'multi-evaluator-run',
});
```

Each evaluator produces a separate column in the LangSmith experiments table.

---

## Best Practices for Evaluators

| Practice | Why |
|---|---|
| Always return a score between 0 and 1 | Enables comparison across experiments |
| Use binary (0/1) for structural checks | Clear pass/fail for format requirements |
| Use continuous (0.0-1.0) for quality | Captures gradations of quality |
| Name keys clearly | `quality-judge` not `score1` |
| Add `comment` field for LLM judges | Explains the score |
| Use `gpt-4o-mini` for LLM judge | Lower cost, fast enough for evaluation |
| Keep judge prompts short | Long prompts increase cost without improving accuracy |

---

## Interview Questions

**Beginner**
1. What are the three types of evaluators covered in this chapter?
2. Why should evaluator scores be normalised to 0-1?

**Intermediate**
3. You want to check that all generated test cases use the active voice ("User clicks" not "The button is clicked"). Would you use a heuristic or LLM-as-judge evaluator? Why?
4. An LLM judge gives a score of 8/10 for a bad test case. How would you improve the judge prompt to be more strict?

**Advanced**
5. Your LLM-as-judge evaluator costs $0.002 per example. You have a dataset of 1,000 examples. Evaluation costs $2 per run. You run it 10 times per day across the team. Design a cost-reduction strategy without sacrificing evaluation quality.

---
