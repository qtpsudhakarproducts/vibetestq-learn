# Chapter 9 — Orchestrating with LangGraph

---

## The Problem

You now have six AI tools: data factory, selector healer, POM generator, test generator, failure analyser, and visual checker. Each one works independently. But real QA workflows involve multiple tools in sequence:

1. Test run completes
2. Failures are extracted
3. Each failure is categorised
4. Selector failures trigger healing
5. Application bugs are escalated
6. A summary report is generated

Building this as a linear script is fragile. LangGraph gives you a workflow graph that handles branching, parallel steps, and human approval naturally.

---

## The QA Workflow Graph

```
START
  ↓
extract-failures        ← read Playwright JSON report
  ↓
categorise-failures     ← AI classifies each failure
  ↓            ↓
heal-selectors    escalate-bugs   ← parallel branches by category
  ↓            ↓
generate-report         ← combine results
  ↓
[human approval]        ← engineer reviews before actions taken
  ↓
END
```

---

## Step 1 — Define State

```typescript
// ai/orchestrator.ts
import 'dotenv/config';
import { Annotation, StateGraph, END, interrupt } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import type { TestFailure, AnalysedFailure } from './failure-analyser.js';

type HealingSuggestion = {
  testName: string;
  originalSelector: string;
  suggestedSelector: string;
  confidence: string;
};

const WorkflowState = Annotation.Root({
  reportPath: Annotation<string>(),
  failures: Annotation<TestFailure[]>({
    default: () => [],
    reducer: (_e, u) => u,
  }),
  analysed: Annotation<AnalysedFailure[]>({
    default: () => [],
    reducer: (_e, u) => u,
  }),
  healingSuggestions: Annotation<HealingSuggestion[]>({
    default: () => [],
    reducer: (e, u) => [...e, ...u],
  }),
  escalations: Annotation<string[]>({
    default: () => [],
    reducer: (e, u) => [...e, ...u],
  }),
  report: Annotation<string>({
    default: () => '',
    reducer: (_e, u) => u,
  }),
  approved: Annotation<boolean>({
    default: () => false,
    reducer: (_e, u) => u,
  }),
});

type State = typeof WorkflowState.State;
```

---

## Step 2 — Define Nodes

```typescript
import { loadFailuresFromReport, analyseAllFailures } from './failure-analyser.js';
import { healSelector } from './selector-healer.js';

async function extractFailuresNode(state: State): Promise<Partial<State>> {
  const failures = await loadFailuresFromReport(state.reportPath);
  console.log(`Extracted ${failures.length} failures`);
  return { failures };
}

async function categoriseFailuresNode(state: State): Promise<Partial<State>> {
  const analysed = await analyseAllFailures(state.failures, 5);
  console.log('Failures categorised');
  return { analysed };
}

async function healSelectorsNode(state: State): Promise<Partial<State>> {
  const selectorFailures = state.analysed.filter(
    (f) => f.analysis.category === 'selector-broken'
  );

  const suggestions: HealingSuggestion[] = [];
  for (const failure of selectorFailures) {
    // Extract selector from error message (simplified)
    const selectorMatch = failure.errorMessage.match(/'([^']+)'/);
    if (!selectorMatch) continue;

    const originalSelector = selectorMatch[1];
    const healed = await healSelector(originalSelector, '<!-- HTML not available in batch mode -->');
    suggestions.push({
      testName: failure.testName,
      originalSelector,
      suggestedSelector: healed.selector,
      confidence: healed.confidence,
    });
  }

  return { healingSuggestions: suggestions };
}

async function escalateBugsNode(state: State): Promise<Partial<State>> {
  const bugs = state.analysed
    .filter((f) => f.analysis.category === 'application-bug' && f.analysis.priority === 'immediate')
    .map((f) => `${f.testName}: ${f.analysis.likelyCause}`);

  if (bugs.length > 0) {
    console.log(`ESCALATION: ${bugs.length} immediate bug(s) detected`);
  }

  return { escalations: bugs };
}

function generateReportNode(state: State): Partial<State> {
  const lines = [
    '# QA Failure Analysis Report',
    `Total failures: ${state.failures.length}`,
    '',
    '## By Category',
  ];

  const categoryCounts: Record<string, number> = {};
  for (const f of state.analysed) {
    categoryCounts[f.analysis.category] = (categoryCounts[f.analysis.category] ?? 0) + 1;
  }
  for (const [cat, count] of Object.entries(categoryCounts)) {
    lines.push(`- ${cat}: ${count}`);
  }

  if (state.healingSuggestions.length > 0) {
    lines.push('', '## Selector Healing Suggestions');
    for (const s of state.healingSuggestions) {
      lines.push(`- ${s.testName}: ${s.originalSelector} → ${s.suggestedSelector} (${s.confidence})`);
    }
  }

  if (state.escalations.length > 0) {
    lines.push('', '## Immediate Escalations');
    for (const e of state.escalations) {
      lines.push(`- ${e}`);
    }
  }

  return { report: lines.join('\n') };
}

function humanApprovalNode(state: State): Partial<State> {
  console.log('\n=== Report Generated ===\n');
  console.log(state.report);
  console.log('\n=== Awaiting engineer approval ===');

  const decision = interrupt({
    report: state.report,
    healingSuggestions: state.healingSuggestions,
    escalations: state.escalations,
  });

  return { approved: decision === 'approve' };
}
```

---

## Step 3 — Build the Graph

```typescript
function routeAfterCategorise(state: State): string[] {
  const hasSelectors = state.analysed.some((f) => f.analysis.category === 'selector-broken');
  const hasBugs = state.analysed.some(
    (f) => f.analysis.category === 'application-bug' && f.analysis.priority === 'immediate'
  );
  const branches: string[] = [];
  if (hasSelectors) branches.push('heal-selectors');
  if (hasBugs) branches.push('escalate-bugs');
  if (branches.length === 0) branches.push('generate-report');
  return branches;
}

const checkpointer = new MemorySaver();

const graph = new StateGraph(WorkflowState)
  .addNode('extract-failures', extractFailuresNode)
  .addNode('categorise-failures', categoriseFailuresNode)
  .addNode('heal-selectors', healSelectorsNode)
  .addNode('escalate-bugs', escalateBugsNode)
  .addNode('generate-report', generateReportNode)
  .addNode('human-approval', humanApprovalNode)
  .addEdge('__start__', 'extract-failures')
  .addEdge('extract-failures', 'categorise-failures')
  .addConditionalEdges('categorise-failures', routeAfterCategorise)
  .addEdge('heal-selectors', 'generate-report')
  .addEdge('escalate-bugs', 'generate-report')
  .addEdge('generate-report', 'human-approval')
  .addEdge('human-approval', '__end__')
  .compile({ checkpointer });

export { graph };
```

---

## Step 4 — Run the Workflow

```typescript
// scripts/run-qa-workflow.ts
import 'dotenv/config';
import { graph } from '../ai/orchestrator.js';

const threadId = `qa-run-${Date.now()}`;
const config = { configurable: { thread_id: threadId } };

// Start workflow
let result = await graph.invoke(
  { reportPath: './test-results/results.json' },
  config
);

// Handle human approval interrupt
if (result.__interrupt__) {
  console.log('\nReview complete? Enter "approve" or "reject":');
  const decision = 'approve'; // In real use: read from stdin or a UI
  result = await graph.invoke(
    { approved: true },
    { ...config, input: decision }
  );
}

console.log('Workflow complete. Approved:', result.approved);
```

---

## Interview Questions

**Beginner**
1. Why are `heal-selectors` and `escalate-bugs` run in parallel instead of sequentially?
2. What is the purpose of the `interrupt()` call in the human approval node?

**Intermediate**
3. The routing function returns an array of branch names. What happens if the array is empty? How does the code handle this?
4. The `MemorySaver` checkpointer is required for `interrupt()`. What would happen if you removed it?

**Advanced**
5. You want to add a fourth parallel branch: `generate-ai-fix-prs` that automatically creates GitHub PRs for high-confidence selector fixes. Design the node and explain how to prevent it from creating duplicate PRs if the workflow is re-run with the same report.

---
