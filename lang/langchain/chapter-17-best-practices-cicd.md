# Chapter 17 — Best Practices and CI/CD Integration

---

## What You Will Learn

- How to manage API costs and stay within budget
- How to handle rate limits and retry safely
- How to integrate LangChain tools into GitHub Actions
- How to store API keys securely in CI
- How to structure a LangChain QA project for long-term maintainability

---

## 17.1 Cost Management

Every API call costs money. Ungated use of `gpt-4o` in a CI pipeline can produce unexpected bills. These practices keep costs predictable.

### Track token usage

Every ChatOpenAI response includes token usage:

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

const model = new ChatOpenAI({
  model: 'gpt-4o',
  callbacks: [
    {
      handleLLMEnd: (output) => {
        const usage = output.llmOutput?.tokenUsage;
        if (usage) {
          // gpt-4o pricing (as of early 2025): $5/1M input, $15/1M output
          const inputCost = (usage.promptTokens / 1_000_000) * 5;
          const outputCost = (usage.completionTokens / 1_000_000) * 15;
          console.log(
            `Tokens: ${usage.promptTokens} in / ${usage.completionTokens} out — ` +
            `Cost: $${(inputCost + outputCost).toFixed(6)}`,
          );
        }
      },
    },
  ],
});
```

### Use cheaper models for simple tasks

Not every task needs `gpt-4o`. Match the model to the complexity:

| Task | Recommended Model | Why |
|---|---|---|
| Test case generation from detailed requirements | `gpt-4o` | Complex reasoning needed |
| Bug report structuring | `gpt-4o-mini` | Simple extraction |
| Generating variable names / titles | `gpt-4o-mini` | Low complexity |
| Embeddings for RAG | `text-embedding-3-small` | Fast and cheap |
| Batch processing 100+ items | `gpt-4o-mini` | 15x cheaper than gpt-4o |

### Set maximum token limits

```typescript
const model = new ChatOpenAI({
  model: 'gpt-4o',
  maxTokens: 2000, // Cap output tokens — prevents runaway generation
});
```

### Cache results for repeated inputs

If you run the test case generator on the same requirements file twice, you should not pay twice:

```typescript
import * as fs from 'fs';
import * as crypto from 'crypto';

function getCacheKey(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}

function readCache(key: string, cacheDir: string): unknown | null {
  const cachePath = `${cacheDir}/${key}.json`;
  if (fs.existsSync(cachePath)) {
    const age = Date.now() - fs.statSync(cachePath).mtimeMs;
    const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
    if (age < maxAgeMs) {
      return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }
  }
  return null;
}

function writeCache(key: string, data: unknown, cacheDir: string): void {
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(`${cacheDir}/${key}.json`, JSON.stringify(data, null, 2));
}

// Usage:
const cacheDir = '.cache/ai-results';
const cacheKey = getCacheKey(requirementsContent);
const cached = readCache(cacheKey, cacheDir);

if (cached) {
  console.log('Using cached result');
  return cached;
}

const result = await chain.invoke({ ... });
writeCache(cacheKey, result, cacheDir);
return result;
```

---

## 17.2 Rate Limiting and Retry

OpenAI rate limits requests per minute. In a CI pipeline that runs many tests, you can hit the limit. Handle it gracefully:

```typescript
import { ChatOpenAI } from '@langchain/openai';

// LangChain has built-in retry support
const model = new ChatOpenAI({
  model: 'gpt-4o',
  maxRetries: 3, // Retry up to 3 times on failure
  // LangChain automatically uses exponential backoff between retries
});
```

For batch processing with multiple items, add a delay between calls:

```typescript
async function processWithRateLimit<T>(
  items: string[],
  processFn: (item: string) => Promise<T>,
  delayMs: number = 500,
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < items.length; i++) {
    results.push(await processFn(items[i]));

    // Wait between calls to avoid rate limit errors
    if (i < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
```

---

## 17.3 Secure API Key Management

**Never hardcode API keys.** Never commit `.env` files. Never log API keys.

**Local development:**
```bash
# .env — listed in .gitignore
OPENAI_API_KEY=sk-proj-...
LANGSMITH_API_KEY=ls__...
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=qa-tools
```

**GitHub Actions CI:**
```yaml
# .github/workflows/ai-qa-tools.yml
name: AI QA Tools

on:
  push:
    paths:
      - 'requirements/**'    # Run when requirements files change

jobs:
  generate-test-cases:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - run: npm ci

      - name: Generate test cases
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          LANGSMITH_API_KEY: ${{ secrets.LANGSMITH_API_KEY }}
          LANGSMITH_TRACING: 'true'
          LANGSMITH_PROJECT: 'ci-qa-tools'
        run: |
          npx tsx src/tools/test-case-generator.ts \
            --input requirements/checkout.txt \
            --format markdown

      - name: Upload generated test cases
        uses: actions/upload-artifact@v4
        with:
          name: generated-test-cases
          path: output/
          retention-days: 30
```

Store secrets in GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

---

## 17.4 Project Structure for Maintainability

A LangChain QA project grows quickly. Use this structure from the start:

```
qa-ai-tools/
  src/
    tools/                   ← Individual tools (test-case-generator, bug-analyser, etc.)
      formats/               ← Output formatters (markdown, csv, json)
    prompts/                 ← Shared prompt templates
      qa-library.ts
    types/                   ← Shared TypeScript types
      test-case.ts
      bug-report.ts
    utils/
      cache.ts               ← Cache utilities
      rate-limiter.ts        ← Rate limiting helpers
      cost-tracker.ts        ← Token cost tracking
  fixtures/
    generated/               ← AI-generated fixture files (gitignored)
  requirements/              ← Requirements documents (committed)
  output/                    ← Generated outputs (gitignored)
  .cache/                    ← AI result cache (gitignored)
  .github/
    workflows/
      ai-qa-tools.yml
  .env                       ← GITIGNORED — never commit
  .env.example               ← Committed — shows required keys without values
  .gitignore
  package.json
  tsconfig.json
```

**.env.example** — commit this so new team members know what keys they need:
```bash
# Copy this file to .env and fill in your values
OPENAI_API_KEY=           # Required: get from platform.openai.com
LANGSMITH_API_KEY=        # Optional: enable for tracing in LangSmith
LANGSMITH_TRACING=false   # Set to 'true' to enable LangSmith tracing
LANGSMITH_PROJECT=qa-tools
```

---

## 17.5 Error Handling Patterns

Wrap every AI tool call with consistent error handling:

```typescript
import { OutputParserException } from '@langchain/core/output_parsers';

type ToolResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorType: 'parse' | 'api' | 'input' | 'unknown' };

async function runTool<T>(fn: () => Promise<T>): Promise<ToolResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    if (error instanceof OutputParserException) {
      return {
        success: false,
        error: `AI returned invalid format: ${error.message}`,
        errorType: 'parse',
      };
    }

    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('api key')) {
        return { success: false, error: 'Invalid or missing API key', errorType: 'api' };
      }
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return { success: false, error: 'Rate limit exceeded. Wait and retry.', errorType: 'api' };
      }
      return { success: false, error: error.message, errorType: 'unknown' };
    }

    return { success: false, error: 'Unknown error', errorType: 'unknown' };
  }
}

// Usage
const result = await runTool(() => generateTestCases('./requirements/login.txt'));

if (!result.success) {
  console.error(`Tool failed [${result.errorType}]: ${result.error}`);
  process.exit(1);
}

console.log(`Generated ${result.data.totalCount} test cases`);
```

---

## 17.6 Testing Your AI Tools

AI tools should have tests too. Test the non-AI parts — input validation, formatters, cache logic — with standard unit tests. For the AI-calling parts, use integration tests that run against the real API in CI:

```typescript
// src/tools/test-case-generator.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { generateTestCases } from './test-case-generator.js';

describe('generateTestCases — input validation', () => {
  it('throws if file does not exist', async () => {
    await expect(generateTestCases('nonexistent.txt')).rejects.toThrow(
      'Requirements file not found',
    );
  });

  it('throws if file is empty', async () => {
    const tmpFile = path.join(process.cwd(), 'tmp-empty.txt');
    fs.writeFileSync(tmpFile, '');
    await expect(generateTestCases(tmpFile)).rejects.toThrow('empty');
    fs.unlinkSync(tmpFile);
  });
});

// Run integration tests only when OPENAI_API_KEY is set
const hasKey = !!process.env.OPENAI_API_KEY;
describe.skipIf(!hasKey)('generateTestCases — integration', () => {
  it('generates test cases from a valid requirements file', async () => {
    const tmpFile = path.join(process.cwd(), 'tmp-requirements.txt');
    fs.writeFileSync(
      tmpFile,
      'Login feature: Users log in with email and password. Account locks after 5 failed attempts.',
    );

    const result = await generateTestCases(tmpFile);
    fs.unlinkSync(tmpFile);

    expect(result.testCases.length).toBeGreaterThan(0);
    expect(result.testCases[0]).toHaveProperty('title');
    expect(result.testCases[0]).toHaveProperty('steps');
    expect(result.testCases[0]).toHaveProperty('severity');
  }, 30_000); // 30 second timeout for AI call
});
```

---

## 17.7 What This Means for Testers

The tools in chapters 13–16 are powerful individually. But they become a genuine competitive advantage when they are wired into your team's workflow:

- Requirements change → CI generates new test cases automatically
- A test run fails → batch selector healer generates a migration guide
- A Slack message describes a bug → bug analyser creates the Jira ticket
- A sprint starts → test data generator produces fresh fixtures

None of this replaces the QA engineer. It eliminates the mechanical parts of the job, leaving more time for the things only humans can do: exploratory testing, risk analysis, edge case intuition, stakeholder communication.

---

## Interview Questions — Chapter 17

**Q1. How would you justify the cost of OpenAI API calls to a manager who is concerned about expenses?**

Calculate the value per call. If a senior QA engineer costs £60/hour and test case generation takes 2 hours, that is £120 of engineering time. An AI call that generates the same starting point costs £0.05–£0.50. Even if the AI output needs 30 minutes of review and editing, the net saving per feature is significant. Present it as cost per test case, not as API cost per month.

**Q2. What is exponential backoff and why is it the correct way to handle rate limit errors?**

Exponential backoff means waiting progressively longer between retries: first retry after 1 second, second after 2 seconds, third after 4 seconds. This is correct because rate limits are time-windowed — the limit resets over time. Retrying immediately (linear retry) just fills the retry budget before the window resets. LangChain's `maxRetries` option implements this automatically.

**Q3. Why should generated fixture files and AI output files be in `.gitignore`?**

Two reasons. First, they are generated artefacts, not source code — committing them would create noise in pull requests and source history. Second, they change every time the generator runs (different realistic data), which would show as spurious changes in every PR. The `.gitignore` keeps the repository clean and ensures fixtures are always freshly generated from the interface definitions, which *are* committed.

**Q4. How would you set up a cost alert so you know if API spending is unexpectedly high?**

Use the OpenAI dashboard usage alerts (Settings → Billing → Usage limits). Set a monthly budget and a notification threshold (e.g. email when spending reaches 80% of budget). In your code, track tokens per tool call and log to your monitoring system. If a single CI run costs more than a threshold, flag it — it may indicate a prompt that is generating unexpectedly large outputs, or a loop that is calling the API more times than expected.

**Q5. A new team member asks: "Should every team use LangChain for QA?" What is your answer?**

Not every team. The value depends on team size, test volume, and how much manual QA work is involved. For a small team with 50 stable tests and simple requirements, the setup cost outweighs the benefit. For a team with hundreds of tests, frequent requirement changes, large test data needs, and flaky selectors, the tools in this book pay off quickly. Start with the highest-pain problem — if selector maintenance costs 2 hours per sprint, start with the selector healer. Measure the time saved before expanding to other tools.

---
