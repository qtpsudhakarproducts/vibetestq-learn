# Chapter 7 — AI Failure Analysis

---

## The Problem

A CI pipeline run finishes with 12 failed tests. The engineer opens the report and reads 12 different error messages. Some are genuine bugs. Some are infrastructure flakiness. Some are selector changes. Sorting them takes 45 minutes.

AI can read the error messages, categorise the failures, and suggest the most likely cause — in seconds.

---

## Theory: Failure Analysis as Classification

Every test failure falls into a category:
- **Selector broken** — element not found, locator timed out
- **Application bug** — wrong content, missing element, wrong URL
- **Test data problem** — data setup failed, unexpected state
- **Infrastructure** — network timeout, resource unavailable
- **Test logic error** — assertion wrong, test assumption invalid
- **Flaky test** — passes sometimes, fails sometimes

Classifying failures is pattern-matching over text. LLMs are good at this.

---

## Step 1 — The Failure Analyser

```typescript
// ai/failure-analyser.ts
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

const FailureAnalysisSchema = z.object({
  category: z.enum([
    'selector-broken',
    'application-bug',
    'test-data-problem',
    'infrastructure',
    'test-logic-error',
    'flaky-test',
    'unknown',
  ]),
  confidence: z.enum(['high', 'medium', 'low']),
  likelyCause: z.string().describe('One sentence: what most likely caused this failure'),
  suggestedFix: z.string().describe('One sentence: what the engineer should try first'),
  priority: z.enum(['immediate', 'scheduled', 'monitor']).describe(
    'immediate = blocks release, scheduled = fix in next sprint, monitor = may resolve itself'
  ),
});

type FailureAnalysis = z.infer<typeof FailureAnalysisSchema>;

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
const structuredModel = model.withStructuredOutput(FailureAnalysisSchema);

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a QA engineer analysing Playwright test failures.
Categorise each failure and suggest the most likely cause.
Base your analysis only on the provided error message and test name.`,
  ],
  [
    'human',
    `Test name: {testName}
Error message:
{errorMessage}

Analyse this failure.`,
  ],
]);

const chain = prompt.pipe(structuredModel);

export async function analyseFailure(
  testName: string,
  errorMessage: string
): Promise<FailureAnalysis> {
  return await chain.invoke({ testName, errorMessage });
}
```

---

## Step 2 — Analyse Multiple Failures in Parallel

```typescript
export interface TestFailure {
  testName: string;
  errorMessage: string;
}

export interface AnalysedFailure extends TestFailure {
  analysis: FailureAnalysis;
}

export async function analyseAllFailures(
  failures: TestFailure[],
  concurrency: number = 5
): Promise<AnalysedFailure[]> {
  const results: AnalysedFailure[] = [];

  // Process in batches to respect rate limits
  for (let i = 0; i < failures.length; i += concurrency) {
    const batch = failures.slice(i, i + concurrency);
    const analyses = await Promise.all(
      batch.map(async (f) => ({
        ...f,
        analysis: await analyseFailure(f.testName, f.errorMessage),
      }))
    );
    results.push(...analyses);
  }

  return results;
}
```

---

## Step 3 — Parse Playwright JSON Results

Playwright can output results as JSON. Parse them to extract failures:

```typescript
// ai/failure-analyser.ts
import { readFile } from 'fs/promises';

interface PlaywrightResult {
  suites: Suite[];
}

interface Suite {
  title: string;
  suites?: Suite[];
  specs?: Spec[];
}

interface Spec {
  title: string;
  tests?: TestResult[];
}

interface TestResult {
  status: string;
  results: { error?: { message?: string } }[];
}

export async function loadFailuresFromReport(reportPath: string): Promise<TestFailure[]> {
  const raw = await readFile(reportPath, 'utf-8');
  const report = JSON.parse(raw) as PlaywrightResult;
  const failures: TestFailure[] = [];

  function walkSuites(suites: Suite[], prefix: string): void {
    for (const suite of suites) {
      const fullTitle = prefix ? `${prefix} > ${suite.title}` : suite.title;
      if (suite.suites) walkSuites(suite.suites, fullTitle);
      for (const spec of suite.specs ?? []) {
        for (const test of spec.tests ?? []) {
          if (test.status === 'failed') {
            const error = test.results[0]?.error?.message ?? 'No error message';
            failures.push({ testName: `${fullTitle} > ${spec.title}`, errorMessage: error });
          }
        }
      }
    }
  }

  walkSuites(report.suites, '');
  return failures;
}
```

---

## Step 4 — Generate a Failure Report

```typescript
// scripts/analyse-failures.ts
import 'dotenv/config';
import { loadFailuresFromReport, analyseAllFailures } from '../ai/failure-analyser.js';

const failures = await loadFailuresFromReport('./test-results/results.json');

if (failures.length === 0) {
  console.log('No failures to analyse.');
  process.exit(0);
}

console.log(`Analysing ${failures.length} failures...\n`);
const analysed = await analyseAllFailures(failures);

// Group by category
const grouped = analysed.reduce<Record<string, typeof analysed>>((acc, f) => {
  const cat = f.analysis.category;
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(f);
  return acc;
}, {});

// Print summary
for (const [category, items] of Object.entries(grouped)) {
  console.log(`\n=== ${category.toUpperCase()} (${items.length}) ===`);
  for (const item of items) {
    console.log(`  [${item.analysis.priority}] ${item.testName}`);
    console.log(`    Cause: ${item.analysis.likelyCause}`);
    console.log(`    Fix: ${item.analysis.suggestedFix}`);
  }
}

// Check if any are immediate priority
const immediate = analysed.filter((f) => f.analysis.priority === 'immediate');
if (immediate.length > 0) {
  console.error(`\n${immediate.length} failure(s) require IMMEDIATE attention.`);
  process.exit(1);
}
```

---

## Sample Output

```
=== APPLICATION-BUG (3) ===
  [immediate] Checkout > should complete payment with saved card
    Cause: The payment confirmation page shows a 500 error — likely a backend issue
    Fix: Check payment service logs and verify backend is running

  [immediate] Checkout > should show order confirmation
    Cause: Expected URL /order-confirmation but got /payment-error
    Fix: Investigate payment flow regression in recent deployment

=== SELECTOR-BROKEN (5) ===
  [scheduled] Login > should display error for wrong password
    Cause: Element 'Sign In' button not found — likely renamed to 'Log In'
    Fix: Update selector to match new button text

=== FLAKY-TEST (2) ===
  [monitor] API > should load dashboard data
    Cause: Timeout waiting for network request — intermittent API latency
    Fix: Increase timeout or add retry logic; monitor for pattern
```

---

## Interview Questions

**Beginner**
1. Name four categories of test failure that AI can distinguish between.
2. Why is the failure analysis done with `temperature: 0`?

**Intermediate**
3. The analyser uses `priority: 'immediate' | 'scheduled' | 'monitor'`. How would you use these values in a CI pipeline to decide whether to block a deployment?
4. If the same test fails with different error messages on different days, what category should it be, and why is categorisation alone insufficient?

**Advanced**
5. Design a system that tracks failure categories over time (using LangSmith or a database) and alerts the team when a new category of failures appears that was not seen in the previous 30 days.

---
