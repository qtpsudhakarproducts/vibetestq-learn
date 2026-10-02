# Appendix — Troubleshooting LangSmith

---

## Common Errors

### Traces Not Appearing in LangSmith

**Symptom:** You run your code. No traces appear in the LangSmith dashboard.

**Check 1: Are the environment variables set?**

```typescript
console.log('LANGCHAIN_TRACING_V2:', process.env.LANGCHAIN_TRACING_V2);
console.log('LANGCHAIN_API_KEY set:', !!process.env.LANGCHAIN_API_KEY);
console.log('LANGCHAIN_PROJECT:', process.env.LANGCHAIN_PROJECT);
```

**Check 2: Is `dotenv/config` imported first?**

```typescript
// ✓ CORRECT — dotenv before everything else
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';

// ✗ WRONG — model imported before dotenv loads env vars
import { ChatOpenAI } from '@langchain/openai';
import 'dotenv/config';
```

**Check 3: Is `LANGCHAIN_TRACING_V2` exactly the string `'true'`?**

```bash
# ✓ Correct
LANGCHAIN_TRACING_V2=true

# ✗ Wrong — these will not work
LANGCHAIN_TRACING_V2=True
LANGCHAIN_TRACING_V2=1
LANGCHAIN_TRACING_V2=yes
```

---

### API Key Invalid

**Symptom:** `AuthenticationError: Invalid API Key`

**Fix:**

1. Check your key at [smith.langchain.com](https://smith.langchain.com) → Settings → API Keys
2. Ensure the key is in `.env` as `LANGCHAIN_API_KEY` (not `LANGSMITH_API_KEY`)
3. Check for leading/trailing spaces in the key value

```bash
# Verify key is being read (only shows first 8 chars)
node -e "require('dotenv').config(); console.log(process.env.LANGCHAIN_API_KEY?.slice(0,8))"
```

---

### Dataset or Project Not Found

**Symptom:** `404 Not Found` when calling `client.readDataset()` or during `evaluate()`

**Fix:** The dataset or project must be created first.

```typescript
import { Client } from 'langsmith';
const client = new Client();

// Check if dataset exists before using it
const datasets = await client.listDatasets({ datasetName: 'qa-test-generation-v1' });
const found = [];
for await (const d of datasets) found.push(d);
if (found.length === 0) {
  console.error('Dataset not found. Run the dataset creation script first.');
  process.exit(1);
}
```

---

### Evaluation Timeout

**Symptom:** Evaluation starts but hangs or times out with many examples.

**Fix 1:** Reduce `maxConcurrency`

```typescript
await evaluate(myFunction, {
  data: 'my-dataset',
  evaluators: [myEvaluator],
  maxConcurrency: 2,  // ← reduce from 5 or 10
});
```

**Fix 2:** Use a smaller model for LLM judges

```typescript
// ✗ Slow and expensive
const judge = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// ✓ Faster and cheaper, almost same quality for judging
const judge = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
```

**Fix 3:** Check for infinite retries in your function under test — a stuck LLM call blocks the entire evaluation.

---

### Evaluation Scores Always 0 or 1 (No Variation)

**Symptom:** All examples score 1.0 or all score 0.0.

**Likely cause:** The evaluator has a bug or the dataset is too easy.

**Debug: log inside evaluator**

```typescript
function myEvaluator(run: Run, example: Example) {
  const output = run.outputs?.result ?? '';
  const expected = example.outputs?.expected ?? '';
  console.log('Output:', JSON.stringify(output).slice(0, 100));
  console.log('Expected:', JSON.stringify(expected).slice(0, 100));
  const score = output === expected ? 1 : 0;
  console.log('Score:', score);
  return { key: 'my-metric', score };
}
```

---

### `traceable` Not Wrapping Traces Correctly

**Symptom:** You see top-level traces but nested function calls are not grouped under a parent.

**Fix:** Ensure nested functions are also wrapped with `traceable`, and that they are called inside the parent traceable context.

```typescript
// ✓ Correct nesting
const innerFn = traceable(async (input: string) => {
  return input.toUpperCase();
}, { name: 'inner-fn' });

const outerFn = traceable(async (input: string) => {
  const result = await innerFn(input);  // ← called inside parent
  return `Processed: ${result}`;
}, { name: 'outer-fn' });
```

---

## Dataset CRUD Reference

```typescript
import { Client } from 'langsmith';

const client = new Client();

// Create
const dataset = await client.createDataset('my-dataset', {
  description: 'Test case generation examples',
});

// List all datasets
for await (const d of client.listDatasets()) {
  console.log(d.name, d.id);
}

// Read a specific dataset
const found = await client.readDataset({ datasetName: 'my-dataset' });

// Add examples
await client.createExamples({
  datasetId: found.id,
  inputs: [{ requirement: 'User can log in.' }],
  outputs: [{ mustCover: ['valid login', 'invalid password'] }],
});

// List examples
for await (const ex of client.listExamples({ datasetId: found.id })) {
  console.log(ex.inputs, ex.outputs);
}

// Delete dataset (careful — irreversible)
await client.deleteDataset({ datasetId: found.id });
```

---

## Quick Reference: Environment Variables

| Variable | Required | Value |
|---|---|---|
| `LANGCHAIN_API_KEY` | ✓ | Your LangSmith API key |
| `LANGCHAIN_TRACING_V2` | ✓ | `true` |
| `LANGCHAIN_PROJECT` | Recommended | Project name string |
| `LANGCHAIN_ENDPOINT` | Only for self-hosted | LangSmith server URL |
| `OPENAI_API_KEY` | ✓ | Your OpenAI API key |

---

## Diagnostic Checklist

When something is not working, run through this list:

- [ ] `dotenv/config` is the first import
- [ ] `.env` file exists in project root
- [ ] `LANGCHAIN_TRACING_V2=true` (lowercase, no quotes in `.env`)
- [ ] `LANGCHAIN_API_KEY` is set and valid
- [ ] Dataset was created before running `evaluate()`
- [ ] Project name matches what you see in LangSmith dashboard
- [ ] No PII in inputs being sent to LangSmith
- [ ] `maxConcurrency` is not too high (start with 3)
- [ ] LLM judge uses `gpt-4o-mini`, `temperature: 0`
- [ ] Exit code of CI script is 0 on pass, 1 on fail

---
