# Appendix A — Debugging LangChain

---

## A.1 Common Errors and Fixes

### OutputParserException

**Error:**
```
OutputParserException: Failed to parse. Text: ```json
{"module": "Login"
```

**Cause:** The AI returned incomplete or malformed JSON. This happens when:
- The output exceeded `maxTokens` and was cut off
- The model used a code block (` ```json `) when you expected raw JSON
- The model added extra text before or after the JSON

**Fix 1 — Increase maxTokens:**
```typescript
const model = new ChatOpenAI({ model: 'gpt-4o', maxTokens: 4000 });
```

**Fix 2 — Tell the model not to use markdown:**
```
Return ONLY the JSON object. No markdown code blocks. No explanations. Just the raw JSON.
```

**Fix 3 — Use a retry with auto-fix:**
```typescript
import { OutputFixingParser } from 'langchain/output_parsers';

const fixingParser = OutputFixingParser.fromLLM(model, originalParser);
// If the original parser fails, this calls the model again with the bad output
// and asks it to fix the formatting
```

---

### RateLimitError

**Error:**
```
RateLimitError: 429 You exceeded your current quota
```

**Fix 1 — Add maxRetries:**
```typescript
const model = new ChatOpenAI({ model: 'gpt-4o', maxRetries: 3 });
```

**Fix 2 — Add delays between batch calls:**
```typescript
await new Promise((resolve) => setTimeout(resolve, 1000));
```

**Fix 3 — Check your OpenAI account tier and limits** at platform.openai.com/account/limits

---

### AuthenticationError

**Error:**
```
AuthenticationError: 401 Incorrect API key provided
```

**Check:**
```typescript
// Add this debug log before your first model call
console.log('Key prefix:', process.env.OPENAI_API_KEY?.slice(0, 8));
// Should print: sk-proj- or sk-
```

**Common causes:**
- `.env` file not in the project root
- `import 'dotenv/config'` missing from the entry file
- Whitespace around the key in `.env`
- Key deleted or rotated in the OpenAI dashboard

---

### Type errors with Zod schemas

**Error:**
```
Type 'string' is not assignable to type '"Critical" | "High" | "Medium" | "Low"'
```

**Cause:** You are using the raw JSON output without inferring the TypeScript type from Zod.

**Fix — Use `z.infer`:**
```typescript
const schema = z.object({
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
});

type Report = z.infer<typeof schema>; // TypeScript type is inferred from Zod
// severity is now typed as 'Critical' | 'High' | 'Medium' | 'Low'
```

---

## A.2 Verbose Logging

Turn on verbose mode to see every step:

```typescript
const chain = prompt.pipe(model).pipe(parser);
chain.verbose = true; // Logs prompt, raw response, parsed output
```

Or set environment variable:
```bash
LANGCHAIN_VERBOSE=true npx tsx src/my-tool.ts
```

---

## A.3 Tracing with LangSmith

LangSmith is LangChain's observability platform. It records every chain run with the full prompt, response, token counts, and timing. Enable it with two environment variables:

```bash
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=ls__your-key-here
LANGSMITH_PROJECT=qa-tools
```

After running your tool, go to smith.langchain.com to see the trace. You can inspect:
- What prompt was sent to the model
- What the model responded with (before parsing)
- How long each step took
- How many tokens were used

This is the fastest way to diagnose why a chain is behaving unexpectedly.

---

## A.4 Inspecting the Prompt Before Sending

If you are not sure what prompt is being sent to the model, format it and log it:

```typescript
const formattedMessages = await prompt.formatMessages({
  formatInstructions,
  requirements: requirementsContent,
});

console.log('Prompt that will be sent to the model:');
formattedMessages.forEach((msg) => {
  console.log(`[${msg._getType()}]:`);
  console.log(typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content));
  console.log('---');
});
```

This is useful when the AI is not following your instructions — the problem is usually in what the prompt actually says, not in LangChain itself.

---

## A.5 Debugging RAG Retrieval

When RAG answers are wrong, check retrieval first:

```typescript
// Test retrieval independently from the chain
const retrieved = await retriever.invoke('your test query');

console.log(`Retrieved ${retrieved.length} chunks:`);
retrieved.forEach((doc, i) => {
  console.log(`\n[${i + 1}] Source: ${doc.metadata.source}`);
  console.log(`Content: ${doc.pageContent.slice(0, 200)}...`);
});
```

If the retrieved chunks are irrelevant, the problem is:
- Wrong `k` value (too few results)
- Chunk size too small (context split across chunks)
- Missing source document (not loaded)
- Query phrasing too different from document language

---
