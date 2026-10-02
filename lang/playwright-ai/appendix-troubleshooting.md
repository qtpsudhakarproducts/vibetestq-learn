# Appendix — Troubleshooting

---

## Common Errors

---

### AI tool timeout in CI

**Error:**
```
TimeoutError: The operation was aborted (exceeded 30s)
```

**Cause:** Default HTTP timeout too short for LLM API calls under load.

**Fix:**
```typescript
const model = new ChatOpenAI({
  model: 'gpt-4o',
  timeout: 60000,  // 60 seconds
  maxRetries: 2,
});
```
Also set a longer job timeout in GitHub Actions:
```yaml
- name: Analyse failures
  run: npx tsx scripts/analyse-failures.ts
  timeout-minutes: 10
```

---

### Selector healer returns wrong element

**Symptom:** Healed selector points to a different element than intended.

**Cause:** The HTML context passed was too broad — the model had too many elements to choose from.

**Fix:** Narrow the HTML context:
```typescript
// Instead of full page HTML, capture only the section
const html = await captureRelevantHtml(page, 'form[data-testid="checkout-form"]');
const healed = await healSelector(brokenSelector, html);
```

---

### Test generator uses locators directly in tests

**Symptom:** Generated test contains `page.locator('.submit-btn').click()`.

**Cause:** Prompt does not forbid it clearly enough.

**Fix:** Strengthen the system prompt:
```typescript
const SYSTEM_PROMPT = `You are a Playwright test engineer.

ABSOLUTE RULE: Tests MUST NEVER call page.locator(), page.getByRole(),
page.fill(), page.click(), or any other Playwright element methods directly.
Tests ONLY call methods defined on page objects.

If you violate this rule, the code will be rejected.`;
```

---

### Traces not appearing in LangSmith

**Check:** Are environment variables set?
```bash
echo $LANGCHAIN_TRACING_V2   # must be "true"
echo $LANGCHAIN_API_KEY       # must be set
echo $LANGCHAIN_PROJECT       # must be set (optional but recommended)
```

**Check:** Is `dotenv/config` the first import in your script?
```typescript
import 'dotenv/config';   // MUST be first
import { ChatOpenAI } from '@langchain/openai';
```

---

### Visual comparison always returns "no-change"

**Cause:** Both images are identical — the current screenshot file is the same as baseline.

**Fix:** Verify that the test saves a fresh screenshot:
```typescript
// Ensure current screenshot is captured fresh, not from cache
const currentBuffer = await page.screenshot({ fullPage: false });  // not from disk
```

---

### Failure analyser always returns "unknown" category

**Cause:** Error messages from your test runner format are unexpected.

**Fix:** Log one raw error message and inspect it:
```typescript
console.log(JSON.stringify(failures[0], null, 2));
```
The error message field may be nested differently. Adjust `loadFailuresFromReport` to extract the correct field.

---

### LangGraph orchestration hangs at interrupt()

**Cause:** `MemorySaver` not provided at compile time.

**Fix:**
```typescript
import { MemorySaver } from '@langchain/langgraph';
const checkpointer = new MemorySaver();
const graph = new StateGraph(WorkflowState)
  // ... nodes and edges
  .compile({ checkpointer });  // ← required for interrupt()
```

---

## Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `LANGCHAIN_TRACING_V2` | Yes (for tracing) | Set to `"true"` |
| `LANGCHAIN_API_KEY` | Yes (for tracing) | LangSmith API key |
| `LANGCHAIN_PROJECT` | No | LangSmith project name |
| `BASE_URL` | Yes | Playwright test base URL |

---

## Cost Diagnostic

Run this to estimate current AI spend:

```typescript
// scripts/cost-check.ts
import 'dotenv/config';
import { Client } from 'langsmith';

const client = new Client();
const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const runs = client.listRuns({
  projectName: process.env.LANGCHAIN_PROJECT ?? 'default',
  startTime: since,
});

let totalTokens = 0;
let runCount = 0;

for await (const run of runs) {
  if (run.total_tokens) totalTokens += run.total_tokens;
  runCount++;
}

console.log(`Runs in last 7 days: ${runCount}`);
console.log(`Total tokens: ${totalTokens.toLocaleString()}`);
console.log(`Estimated cost (gpt-4o @ $0.005/1k): $${((totalTokens / 1000) * 0.005).toFixed(2)}`);
```

---

## Debugging Checklist

When an AI tool produces unexpected output:

1. **Check LangSmith trace** — find the run, view the exact prompt and response
2. **Check model temperature** — generation = 0.8, structured output = 0
3. **Check Zod schema** — are all fields described? Is the output type what you expect?
4. **Isolate the input** — run the tool with the exact failing input in isolation
5. **Check the HTML context** — for healer/POM tools, print the HTML being sent
6. **Check rate limits** — 429 errors mean too many parallel requests, reduce concurrency
7. **Check model version** — `gpt-4o` is multimodal, `gpt-4o-mini` is not; wrong model for visual tasks?

---
