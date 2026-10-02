# Chapter 4 — Edges: Connecting the Flow

---

## The Problem

You have nodes that do the work. Now you need to wire them together. Which node runs first? What happens after the quality check node — does the workflow always continue, or does it depend on the score?

**Edges define the flow.** Without edges, your graph is a collection of functions with no connections. Edges are what make it a graph.

---

## What Is an Edge?

**An edge is a connection between two nodes that tells LangGraph what to run next.**

The analogy: think of a flowchart for processing a support ticket. The ticket comes in, it goes to triage, then depending on severity it goes to either the fast lane or the escalation queue. Each arrow on that flowchart is an edge.

LangGraph has two types of edges:
1. **Unconditional edge** — always go from node A to node B
2. **Conditional edge** — check a condition and route to different nodes based on the result

---

## Special Nodes: `__start__` and `END`

Every LangGraph graph has two built-in nodes you do not define yourself:

- `__start__` — the entry point. You connect this to your first node.
- `END` — the exit point. When a node connects to `END`, the workflow finishes.

```typescript
import { StateGraph, END } from '@langchain/langgraph';

graph
  .addEdge('__start__', 'firstNode') // start → first
  .addEdge('lastNode', END);          // last → done
```

---

## Unconditional Edges

Use `addEdge(from, to)` to always go from one node to the next.

```typescript
graph
  .addEdge('__start__', 'parse')
  .addEdge('parse', 'generate')
  .addEdge('generate', 'format')
  .addEdge('format', END);
```

This is the same as a linear chain. Every invocation follows the same path.

---

## Conditional Edges

Use `addConditionalEdges(from, routerFn)` when the next node depends on the current state.

The router function:
- Receives the current state
- Returns a string — the name of the next node (or `END`)

```typescript
// Router function: reads state, returns node name
function qualityRouter(state: WorkflowState): string {
  if (state.qualityScore >= 7) {
    return 'approve'; // go to approval node
  } else {
    return 'regenerate'; // go back and try again
  }
}

// Register it with the edge
graph.addConditionalEdges('checkQuality', qualityRouter);
```

**What this means for testers:** This is exactly like a decision diamond in a test flow. "Did the login succeed? Yes → verify dashboard. No → verify error message." The conditional edge is that diamond.

---

## Conditional Edges with an Explicit Map

When LangGraph needs to statically analyse which nodes are reachable (for visualization or validation), you can provide a path map:

```typescript
graph.addConditionalEdges('checkQuality', qualityRouter, {
  approve: 'approve',
  regenerate: 'regenerate',
  escalate: 'escalate',
});
```

The map says: "the router can return 'approve', 'regenerate', or 'escalate', and here is which node each maps to." This is optional but recommended for complex graphs.

---

## Complete Working Example: Quality Gate with Routing

**Problem:** After generating test cases, check quality. If score ≥ 7, save. If < 7, regenerate (up to 3 times). If max retries reached, save anyway with a warning.

```typescript
import 'dotenv/config';
import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

const QAState = Annotation.Root({
  requirements: Annotation<string>(),
  testCases: Annotation<string[]>({
    reducer: (_e, u) => u, // replace each time (not append)
    default: () => [],
  }),
  qualityScore: Annotation<number>(),
  retryCount: Annotation<number>({
    reducer: (e, u) => e + u,
    default: () => 0,
  }),
  finalStatus: Annotation<string>(),
});

type State = typeof QAState.State;
const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// Node: Generate test cases
async function generateNode(state: State) {
  const response = await model.invoke([
    { role: 'system', content: 'Generate 3 clear test cases as a numbered list.' },
    { role: 'user', content: state.requirements },
  ]);
  const cases = (response.content as string)
    .split('\n')
    .filter((l) => /^\d+\./.test(l))
    .map((l) => l.trim());
  return { testCases: cases, retryCount: state.retryCount === 0 ? 0 : 1 };
}

// Node: Check quality
async function checkQualityNode(state: State) {
  const response = await model.invoke([
    {
      role: 'user',
      content: `Rate these test cases from 1-10 (respond with just the number):\n${state.testCases.join('\n')}`,
    },
  ]);
  const match = (response.content as string).match(/\b([1-9]|10)\b/);
  return { qualityScore: match ? parseInt(match[0]) : 5 };
}

// Node: Mark as approved
async function approveNode(state: State) {
  return { finalStatus: `Approved with quality score ${state.qualityScore}/10` };
}

// Node: Mark as saved with warning
async function saveWithWarningNode(state: State) {
  return {
    finalStatus: `Saved after ${state.retryCount} retries. Final score: ${state.qualityScore}/10`,
  };
}

// Router: decide what happens after quality check
function qualityRouter(state: State): string {
  if (state.qualityScore >= 7) {
    return 'approve';
  }
  if (state.retryCount >= 3) {
    return 'saveWithWarning';
  }
  return 'generate'; // loop back
}

// Build graph
const graph = new StateGraph(QAState)
  .addNode('generate', generateNode)
  .addNode('checkQuality', checkQualityNode)
  .addNode('approve', approveNode)
  .addNode('saveWithWarning', saveWithWarningNode)
  .addEdge('__start__', 'generate')
  .addEdge('generate', 'checkQuality')
  .addConditionalEdges('checkQuality', qualityRouter, {
    approve: 'approve',
    saveWithWarning: 'saveWithWarning',
    generate: 'generate',
  })
  .addEdge('approve', END)
  .addEdge('saveWithWarning', END);

const app = graph.compile();

const result = await app.invoke({
  requirements: 'Admin can deactivate a user account from the user management panel.',
});

console.log('\nTest Cases:');
result.testCases.forEach((tc, i) => console.log(`  ${i + 1}. ${tc}`));
console.log(`\nQuality Score: ${result.qualityScore}/10`);
console.log(`Retries: ${result.retryCount}`);
console.log(`Status: ${result.finalStatus}`);
```

---

## Visualising the Graph

You can print the graph structure for debugging:

```typescript
// After compiling the graph:
const app = graph.compile();
console.log(app.getGraph().toJSON());
```

For a visual diagram in development, LangGraph supports Mermaid output:
```typescript
const diagram = app.getGraph().drawMermaid();
console.log(diagram);
// Paste the output at mermaid.live to see the flowchart
```

---

## Interview Questions

**Beginner**
1. What are the two types of edges in LangGraph?
2. What are `__start__` and `END` and why do you need them?

**Intermediate**
3. What does the router function in `addConditionalEdges` return? What types can it return?
4. In the complete example, what prevents infinite loops when quality is always low?

**Advanced**
5. Describe a test workflow where you would need three different conditional paths out of a single node. What would each path represent?

---
