# Chapter 9 — Parallel Execution

---

## The Problem

Your multi-agent pipeline generates UI tests, then API tests, then DB tests — one after the other. The UI test agent takes 8 seconds. The API test agent takes 6 seconds. The DB test agent takes 5 seconds. Total: 19 seconds per run.

But these agents do not depend on each other. They all need the same input (the requirements and analysis), and they produce independent outputs. There is no reason to wait for UI tests before starting API tests.

**Run them in parallel. Total time: ~8 seconds.**

---

## What Is Parallel Execution in LangGraph?

**Parallel execution means multiple nodes run at the same time within the same graph invocation.**

LangGraph supports this natively through two mechanisms:
1. **Fan-out edges** — one node connects to multiple next nodes, which all run in parallel
2. **`Send` API** — dynamically dispatch multiple copies of the same node with different inputs

---

## Pattern 1: Fan-Out / Fan-In

This is the most common pattern. After one node finishes, multiple nodes start simultaneously. After all parallel nodes finish, a final node collects all their results.

```
analysis-node ──→ ui-test-node ──→ 
               ──→ api-test-node ──→ review-node → END
               ──→ db-test-node ──→
```

In LangGraph, fan-out is automatic: if you add multiple edges from one node, LangGraph runs all the target nodes in parallel.

```typescript
graph
  .addEdge('analysis', 'uiTests')   // these three run in parallel
  .addEdge('analysis', 'apiTests')
  .addEdge('analysis', 'dbTests')
  .addEdge('uiTests', 'review')     // all three must complete before review runs
  .addEdge('apiTests', 'review')
  .addEdge('dbTests', 'review');
```

LangGraph waits for all incoming edges to a node before running it. So `review` automatically waits for all three parallel nodes to finish — the fan-in is implicit.

---

## Complete Fan-Out / Fan-In Example

```typescript
import 'dotenv/config';
import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

const ParallelState = Annotation.Root({
  requirements: Annotation<string>(),
  analysis: Annotation<string>(),
  uiTestCases: Annotation<string[]>({
    reducer: (_e, u) => u,
    default: () => [],
  }),
  apiTestCases: Annotation<string[]>({
    reducer: (_e, u) => u,
    default: () => [],
  }),
  dbTestCases: Annotation<string[]>({
    reducer: (_e, u) => u,
    default: () => [],
  }),
  reviewSummary: Annotation<string>(),
});

type State = typeof ParallelState.State;
const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

async function analysisNode(state: State) {
  const response = await model.invoke([
    { role: 'system', content: 'List the UI, API, and DB aspects of this feature in bullet points.' },
    { role: 'user', content: state.requirements },
  ]);
  return { analysis: response.content as string };
}

async function uiTestsNode(state: State) {
  const response = await model.invoke([
    { role: 'system', content: 'Generate 3 UI test cases as a numbered list.' },
    { role: 'user', content: `Feature: ${state.requirements}\nAnalysis: ${state.analysis}` },
  ]);
  const cases = (response.content as string).split('\n').filter((l) => /^\d+\./.test(l)).map((l) => l.trim());
  return { uiTestCases: cases };
}

async function apiTestsNode(state: State) {
  const response = await model.invoke([
    { role: 'system', content: 'Generate 3 API test cases as a numbered list.' },
    { role: 'user', content: `Feature: ${state.requirements}\nAnalysis: ${state.analysis}` },
  ]);
  const cases = (response.content as string).split('\n').filter((l) => /^\d+\./.test(l)).map((l) => l.trim());
  return { apiTestCases: cases };
}

async function dbTestsNode(state: State) {
  const response = await model.invoke([
    { role: 'system', content: 'Generate 3 DB/data integrity test cases as a numbered list.' },
    { role: 'user', content: `Feature: ${state.requirements}\nAnalysis: ${state.analysis}` },
  ]);
  const cases = (response.content as string).split('\n').filter((l) => /^\d+\./.test(l)).map((l) => l.trim());
  return { dbTestCases: cases };
}

async function reviewNode(state: State) {
  const total = state.uiTestCases.length + state.apiTestCases.length + state.dbTestCases.length;
  return {
    reviewSummary: `Generated ${total} test cases total: ${state.uiTestCases.length} UI, ${state.apiTestCases.length} API, ${state.dbTestCases.length} DB.`,
  };
}

const graph = new StateGraph(ParallelState)
  .addNode('analysis', analysisNode)
  .addNode('uiTests', uiTestsNode)
  .addNode('apiTests', apiTestsNode)
  .addNode('dbTests', dbTestsNode)
  .addNode('review', reviewNode)
  .addEdge('__start__', 'analysis')
  // Fan-out: analysis → three parallel nodes
  .addEdge('analysis', 'uiTests')
  .addEdge('analysis', 'apiTests')
  .addEdge('analysis', 'dbTests')
  // Fan-in: all three → review
  .addEdge('uiTests', 'review')
  .addEdge('apiTests', 'review')
  .addEdge('dbTests', 'review')
  .addEdge('review', END);

const app = graph.compile();

const start = Date.now();
const result = await app.invoke({
  requirements: 'User can submit a support ticket with a title, description, priority, and file attachment.',
});
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log(`\nCompleted in ${elapsed}s`);
console.log(`\nReview: ${result.reviewSummary}`);
console.log(`\nUI Tests (${result.uiTestCases.length}):`);
result.uiTestCases.forEach((tc) => console.log(`  - ${tc}`));
console.log(`\nAPI Tests (${result.apiTestCases.length}):`);
result.apiTestCases.forEach((tc) => console.log(`  - ${tc}`));
console.log(`\nDB Tests (${result.dbTestCases.length}):`);
result.dbTestCases.forEach((tc) => console.log(`  - ${tc}`));
```

---

## Pattern 2: Dynamic Parallelism with `Send`

Fan-out runs a fixed set of nodes. Sometimes you need to run the same node multiple times with different inputs — for example, generate test cases for each of 10 requirements in parallel.

`Send` dispatches multiple copies of a node, each with its own state:

```typescript
import { Send } from '@langchain/langgraph';

// Router that fans out dynamically
function dispatchRequirements(state: State): Send[] {
  return state.requirementsList.map(
    (req) => new Send('generateTestCases', { singleRequirement: req })
  );
}

graph.addConditionalEdges('parseRequirements', dispatchRequirements);
```

Each `Send` creates an independent invocation of `generateTestCases` with its own input. All run in parallel. Results are merged back using the state reducer.

---

## Interview Questions

**Beginner**
1. How does LangGraph know that multiple nodes should run in parallel?
2. When does a fan-in node (like `review`) start executing?

**Intermediate**
3. In the fan-out example, what would happen if `uiTests` and `apiTests` both try to update the same state field with the default (replace) reducer?
4. What is the difference between fan-out edges and the `Send` API?

**Advanced**
5. You have 50 requirements to process in parallel using `Send`. Each generates 5 test cases. How would you design the state to collect all 250 test cases correctly using reducers?

---
