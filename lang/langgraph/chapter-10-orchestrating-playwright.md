# Chapter 10 — Orchestrating Playwright Test Runs

---

## The Problem

Your Playwright test suite has grown to 800 tests across 15 feature areas. When a regression run takes 40 minutes, you need to know:
- Which tests failed and why (AI failure analysis)
- Whether the failures are real bugs or environment issues (AI classification)
- Which tests are flaky vs reliably failing (AI pattern detection)
- What to rerun vs what to escalate (AI decision)

You want an AI orchestrator that takes your Playwright JSON results, analyses them, makes decisions, and produces a structured report — all automatically.

---

## The Architecture

```
parse-results → classify-failures → 
                                   → analyse-real-bugs   →
                                   → analyse-flaky-tests → generate-report → END
                                   → analyse-env-issues  →
```

The orchestrator:
1. **Parses** Playwright JSON output
2. **Classifies** each failure as: real bug / flaky / environment issue
3. **Analyses each category in parallel** (three specialist nodes)
4. **Generates a report** with recommendations

---

## Playwright JSON Reporter Setup

First, configure Playwright to output JSON results:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['json', { outputFile: 'test-results/results.json' }],
    ['html'],
  ],
});
```

Run your tests:
```bash
npx playwright test --reporter=json
```

---

## The Types

```typescript
// types/playwright-results.ts
export interface PlaywrightTestResult {
  title: string;
  fullTitle: string;
  file: string;
  duration: number;
  status: 'passed' | 'failed' | 'timedOut' | 'skipped';
  error?: {
    message: string;
    stack?: string;
  };
  retry: number;
}

export interface PlaywrightReport {
  stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
  suites: Array<{
    title: string;
    specs: Array<{
      title: string;
      file: string;
      tests: PlaywrightTestResult[];
    }>;
  }>;
}
```

---

## Complete Orchestration Graph

```typescript
import 'dotenv/config';
import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { readFileSync } from 'fs';
import type { PlaywrightReport, PlaywrightTestResult } from './types/playwright-results.js';

// State
const OrchestratorState = Annotation.Root({
  rawResults: Annotation<PlaywrightReport | null>({
    default: () => null,
  }),
  failures: Annotation<PlaywrightTestResult[]>({
    reducer: (_e, u) => u,
    default: () => [],
  }),
  realBugs: Annotation<PlaywrightTestResult[]>({
    reducer: (_e, u) => u,
    default: () => [],
  }),
  flakyTests: Annotation<PlaywrightTestResult[]>({
    reducer: (_e, u) => u,
    default: () => [],
  }),
  envIssues: Annotation<PlaywrightTestResult[]>({
    reducer: (_e, u) => u,
    default: () => [],
  }),
  bugAnalysis: Annotation<string>(),
  flakyAnalysis: Annotation<string>(),
  envAnalysis: Annotation<string>(),
  finalReport: Annotation<string>(),
});

type State = typeof OrchestratorState.State;

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
const fastModel = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });

// Node 1: Parse test results file
async function parseResultsNode(state: State) {
  const raw = state.rawResults as PlaywrightReport;
  const failures: PlaywrightTestResult[] = [];

  for (const suite of raw.suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        if (test.status === 'failed' || test.status === 'timedOut') {
          failures.push({
            ...test,
            title: spec.title,
            file: spec.file,
          });
        }
      }
    }
  }

  console.log(`\nFound ${failures.length} failures out of ${raw.stats?.total ?? 0} tests`);
  return { failures };
}

// Node 2: Classify failures
async function classifyFailuresNode(state: State) {
  if (state.failures.length === 0) {
    return { realBugs: [], flakyTests: [], envIssues: [] };
  }

  const failureSummaries = state.failures.map((f, i) =>
    `${i + 1}. "${f.title}" | File: ${f.file} | Retries: ${f.retry} | Error: ${f.error?.message?.slice(0, 150) ?? 'none'}`
  ).join('\n');

  const response = await model.invoke([
    {
      role: 'system',
      content: `You are a senior QA engineer. Classify each test failure.
Respond with JSON array only:
[
  { "index": 1, "category": "real_bug" | "flaky" | "env_issue", "reason": "brief reason" },
  ...
]

Categories:
- real_bug: consistent failure pointing to application defect
- flaky: passes on retry, timing/async issue
- env_issue: environment/config/network problem`,
    },
    { role: 'user', content: failureSummaries },
  ]);

  let classifications: Array<{ index: number; category: string }> = [];
  try {
    const text = response.content as string;
    const match = text.match(/\[[\s\S]*\]/);
    if (match) classifications = JSON.parse(match[0]);
  } catch {
    // Default to real_bug if parsing fails
    classifications = state.failures.map((_, i) => ({ index: i + 1, category: 'real_bug' }));
  }

  const realBugs: PlaywrightTestResult[] = [];
  const flakyTests: PlaywrightTestResult[] = [];
  const envIssues: PlaywrightTestResult[] = [];

  for (const c of classifications) {
    const test = state.failures[c.index - 1];
    if (!test) continue;
    if (c.category === 'real_bug') realBugs.push(test);
    else if (c.category === 'flaky') flakyTests.push(test);
    else envIssues.push(test);
  }

  return { realBugs, flakyTests, envIssues };
}

// Node 3a: Analyse real bugs (parallel)
async function analyseBugsNode(state: State) {
  if (state.realBugs.length === 0) return { bugAnalysis: 'No real bugs detected.' };

  const list = state.realBugs.map((t) => `- ${t.title}: ${t.error?.message?.slice(0, 200)}`).join('\n');
  const response = await fastModel.invoke([
    { role: 'system', content: 'Analyse these test failures. Identify likely root causes and suggest fixes. Be concise.' },
    { role: 'user', content: list },
  ]);
  return { bugAnalysis: response.content as string };
}

// Node 3b: Analyse flaky tests (parallel)
async function analyseFlakyNode(state: State) {
  if (state.flakyTests.length === 0) return { flakyAnalysis: 'No flaky tests detected.' };

  const list = state.flakyTests.map((t) => `- ${t.title} (${t.retry} retries)`).join('\n');
  const response = await fastModel.invoke([
    { role: 'system', content: 'These Playwright tests are flaky. Suggest stabilisation strategies (waits, retries, locator fixes).' },
    { role: 'user', content: list },
  ]);
  return { flakyAnalysis: response.content as string };
}

// Node 3c: Analyse environment issues (parallel)
async function analyseEnvNode(state: State) {
  if (state.envIssues.length === 0) return { envAnalysis: 'No environment issues detected.' };

  const list = state.envIssues.map((t) => `- ${t.title}: ${t.error?.message?.slice(0, 150)}`).join('\n');
  const response = await fastModel.invoke([
    { role: 'system', content: 'These failures appear to be environment or config issues. Suggest what to check.' },
    { role: 'user', content: list },
  ]);
  return { envAnalysis: response.content as string };
}

// Node 4: Generate final report
async function generateReportNode(state: State) {
  const raw = state.rawResults as PlaywrightReport;
  const lines = [
    `# Playwright Test Run Analysis`,
    ``,
    `## Summary`,
    `- **Total:** ${raw.stats?.total ?? 0}`,
    `- **Passed:** ${raw.stats?.passed ?? 0}`,
    `- **Failed:** ${state.failures.length}`,
    `- **Real Bugs:** ${state.realBugs.length}`,
    `- **Flaky Tests:** ${state.flakyTests.length}`,
    `- **Environment Issues:** ${state.envIssues.length}`,
    ``,
    `## Real Bug Analysis`,
    state.bugAnalysis,
    ``,
    `## Flaky Test Analysis`,
    state.flakyAnalysis,
    ``,
    `## Environment Issue Analysis`,
    state.envAnalysis,
    ``,
    `## Failing Tests`,
    ``,
    `### Real Bugs (${state.realBugs.length})`,
    ...state.realBugs.map((t) => `- \`${t.title}\` — ${t.file}`),
    ``,
    `### Flaky Tests (${state.flakyTests.length})`,
    ...state.flakyTests.map((t) => `- \`${t.title}\``),
    ``,
    `### Environment Issues (${state.envIssues.length})`,
    ...state.envIssues.map((t) => `- \`${t.title}\``),
  ];
  return { finalReport: lines.join('\n') };
}

// Build graph
const graph = new StateGraph(OrchestratorState)
  .addNode('parseResults', parseResultsNode)
  .addNode('classifyFailures', classifyFailuresNode)
  .addNode('analyseBugs', analyseBugsNode)
  .addNode('analyseFlaky', analyseFlakyNode)
  .addNode('analyseEnv', analyseEnvNode)
  .addNode('generateReport', generateReportNode)
  .addEdge('__start__', 'parseResults')
  .addEdge('parseResults', 'classifyFailures')
  // Fan-out: three analysis nodes run in parallel
  .addEdge('classifyFailures', 'analyseBugs')
  .addEdge('classifyFailures', 'analyseFlaky')
  .addEdge('classifyFailures', 'analyseEnv')
  // Fan-in: all analysis nodes must complete before report
  .addEdge('analyseBugs', 'generateReport')
  .addEdge('analyseFlaky', 'generateReport')
  .addEdge('analyseEnv', 'generateReport')
  .addEdge('generateReport', END);

const app = graph.compile();

// Load actual Playwright results
const resultsPath = process.argv[2] ?? 'test-results/results.json';
const rawResults: PlaywrightReport = JSON.parse(readFileSync(resultsPath, 'utf-8'));

const result = await app.invoke({ rawResults });

console.log(result.finalReport);
```

Run it:
```bash
npx tsx src/orchestrate-results.ts test-results/results.json
```

---

## Interview Questions

**Beginner**
1. What Playwright configuration enables JSON output for the orchestrator to consume?
2. What are the three categories the classifier assigns to failures?

**Intermediate**
3. Why are the three analysis nodes (bugs, flaky, env) run in parallel? What would change if they ran sequentially?
4. The classifier returns a JSON array. What fallback is implemented if parsing fails?

**Advanced**
5. Extend this orchestrator to: detect test ownership from file paths (e.g. `tests/cart/` → cart team), and group the report by team. What state fields and nodes would you add?

---
