# Chapter 12 — Best Practices and CI/CD

---

## When to Use AI vs When Not To

| Situation | Use AI? | Reason |
|---|---|---|
| Generating diverse test data sets | Yes | AI creates realistic variation quickly |
| Generating edge-case usernames | Yes | AI thinks of cases humans miss |
| Choosing what to test | No | Domain knowledge required |
| Asserting business logic | No | Human must define expected behaviour |
| Healing a known broken selector | Yes | Pattern matching on HTML |
| Deciding if a UX change is acceptable | No | Human product judgement |
| Categorising 50 CI failures | Yes | Pattern matching over text |
| Writing the first test for a new feature | Yes + review | Start fast, engineer reviews |
| Complex multi-system integration tests | Partial | AI generates skeleton, engineer completes |
| Security or compliance testing | No | Requires specialist knowledge |

---

## Security: Never Put Credentials in AI Inputs

```typescript
// BAD — credentials in prompt
const test = await generateTest(`
  Login with username admin@company.com and password SuperSecret123!
`);

// GOOD — placeholder only
const test = await generateTest(`
  Login with a valid admin user.
  Use the adminUser fixture for credentials.
`);
```

**Rule:** AI prompts and LangSmith traces are stored. Treat them like logs — no secrets.

Hash user identifiers before tracing:

```typescript
import { createHash } from 'crypto';

function hashUserId(userId: string): string {
  return createHash('sha256').update(userId).digest('hex').slice(0, 8);
}

// In trace metadata
metadata: { userId: hashUserId(user.id) }
```

---

## Cost Management

### Cache AI outputs

```typescript
// Simple file cache for generated test data
import { createHash } from 'crypto';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

async function cachedGenerate<T>(
  key: string,
  generate: () => Promise<T>
): Promise<T> {
  const hash = createHash('sha256').update(key).digest('hex').slice(0, 16);
  const cacheFile = `.cache/ai/${hash}.json`;

  if (existsSync(cacheFile)) {
    const cached = await readFile(cacheFile, 'utf-8');
    return JSON.parse(cached) as T;
  }

  const result = await generate();
  await mkdir('.cache/ai', { recursive: true });
  await writeFile(cacheFile, JSON.stringify(result));
  return result;
}

// Usage
const user = await cachedGenerate(
  `user-${profileType}`,
  () => generateUser(profileType)
);
```

### Use cheaper models for classification

```typescript
// Use gpt-4o for generation (creative, complex)
const generator = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.8 });

// Use gpt-4o-mini for classification (simple pattern matching)
const classifier = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
```

### Cost decision table

| AI Task | Recommended Model | Why |
|---|---|---|
| Test data generation | gpt-4o | Quality matters, run once |
| Failure categorisation | gpt-4o-mini | Simple classification, many runs |
| Test code generation | gpt-4o | Complex output, run once |
| Visual comparison | gpt-4o | Requires vision capability |
| LLM judge evaluator | gpt-4o-mini | Many evaluations, cost adds up |
| Selector healing | gpt-4o-mini | Simple HTML pattern matching |

---

## GitHub Actions CI/CD Workflow

```yaml
# .github/workflows/ai-qa.yml
name: AI QA Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-and-analyse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright tests
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          LANGCHAIN_TRACING_V2: 'true'
          LANGCHAIN_API_KEY: ${{ secrets.LANGCHAIN_API_KEY }}
          LANGCHAIN_PROJECT: 'ai-playwright-ci'
        run: npx playwright test --reporter=json
        continue-on-error: true  # Analyse failures even if tests fail

      - name: Analyse failures with AI
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          LANGCHAIN_API_KEY: ${{ secrets.LANGCHAIN_API_KEY }}
        run: npx tsx scripts/analyse-failures.ts
        # Exits code 1 if immediate priority failures found

      - name: Upload test report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  weekly-evaluation:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Run AI evaluations
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          LANGCHAIN_API_KEY: ${{ secrets.LANGCHAIN_API_KEY }}
        run: npx tsx scripts/evaluate-all.ts
```

---

## Team Adoption: Start Small

Do not introduce all AI tools at once. Introduce one at a time:

**Week 1–2: Data Factory**
- Replace hand-crafted test fixtures with `generateUser()`
- Team sees immediate value — no more maintaining fixture files

**Week 3–4: Failure Analyser**
- Add to existing CI pipeline as a post-test step
- Team gets categorised failure summaries in Slack/Teams

**Week 5–6: Visual Checker**
- Add to the pages that change most often
- Gradually build baseline library

**Month 2: Test Generator**
- Use for new feature tests only
- Engineer always reviews and adjusts generated code

**Month 3+: LangGraph Orchestration + LangSmith**
- Add orchestration after individual tools are proven
- Add evaluation once dataset has 30+ examples

---

## Final Checklist

Before going to production with any AI tool:

- [ ] AI outputs are always reviewed by a human before merging
- [ ] No credentials or PII in prompts or traces
- [ ] Output cached to avoid unnecessary API calls
- [ ] Model choice is cost-appropriate for the task
- [ ] LangSmith tracing enabled for all AI calls
- [ ] At least one evaluator per AI tool
- [ ] CI pipeline exits on immediate failures
- [ ] Team trained: they know what each tool does and does not do
- [ ] Failure mode documented: what happens if the AI tool is down?

---

## Interview Questions

**Beginner**
1. Name two security rules when using AI in a QA framework.
2. Why should `gpt-4o-mini` be used for failure categorisation instead of `gpt-4o`?

**Intermediate**
3. A new engineer generates 200 tests using the AI test generator and merges them all without review. What problems might arise, and how would you prevent this?
4. Your AI failure analyser starts returning wrong categories. You need to investigate. Walk through the LangSmith dashboard steps to find the root cause.

**Advanced**
5. Your team runs 5000 Playwright tests per day, 30% of which use AI-generated test data. Each data generation call costs $0.002. Calculate the daily AI cost for test data alone. Then propose a caching and model strategy to reduce cost by 80% without reducing test quality.

---
