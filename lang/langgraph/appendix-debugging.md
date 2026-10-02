# Appendix — Debugging LangGraph Workflows

---

## A. Common Errors and Fixes

### Error: "Cannot read properties of undefined (reading 'length')"

**Cause:** A state field was not initialised with a `default()` factory, so it is `undefined` on first invocation.

```typescript
// ❌ Missing default
uiTestCases: Annotation<string[]>({
  reducer: (_e, u) => u,
  // no default!
}),

// ✅ Always provide default for arrays
uiTestCases: Annotation<string[]>({
  reducer: (_e, u) => u,
  default: () => [],
}),
```

---

### Error: "interrupt() requires a checkpointer"

**Cause:** You used `interrupt()` in a node but compiled the graph without `MemorySaver`.

```typescript
// ❌ No checkpointer
const app = graph.compile();

// ✅ With checkpointer
import { MemorySaver } from '@langchain/langgraph';
const app = graph.compile({ checkpointer: new MemorySaver() });
```

---

### Error: Graph runs forever (infinite loop)

**Cause:** The conditional edge that breaks the loop is never satisfied. Usually the AI returns a value in an unexpected format.

**Fix:** Always add a hard counter check before the AI-evaluated condition:

```typescript
function loopRouter(state: State): string {
  // Hard limit FIRST — before AI evaluation
  if (state.retryCount >= 3) return 'output';

  // AI-evaluated condition second
  if (state.qualityScore >= 7) return 'output';

  return 'retry';
}
```

---

### Error: State fields have unexpected accumulated values

**Cause:** Using the append reducer `(e, u) => [...e, ...u]` for a field that should be replaced on each loop iteration.

**Diagnosis:** Log the state at each node:

```typescript
async function debugNode(state: State) {
  console.log('State at debugNode:', JSON.stringify({
    uiTestCases: state.uiTestCases.length,
    retryCount: state.retryCount,
  }, null, 2));
  return {};
}

// Add to graph temporarily
graph.addNode('debug', debugNode).addEdge('previousNode', 'debug').addEdge('debug', 'nextNode');
```

---

### Error: "Thread ID is required for checkpointer"

**Cause:** You called `app.invoke()` without a `configurable.thread_id`.

```typescript
// ❌ Missing thread ID
await app.invoke(input);

// ✅ With thread ID
await app.invoke(input, { configurable: { thread_id: 'unique-id-per-session' } });
```

---

### Error: Parallel fan-in node runs before all parallel nodes complete

**Cause:** This should not happen with LangGraph — fan-in is implicit. If you see this, check that all parallel nodes have edges pointing to the same fan-in node.

```typescript
// ✅ All three must have edges to 'merge'
graph
  .addEdge('nodeA', 'merge')
  .addEdge('nodeB', 'merge')
  .addEdge('nodeC', 'merge');
```

---

## B. Visualising Your Graph

Visualise before running — it is much faster than debugging.

```typescript
const app = graph.compile();
const diagram = app.getGraph().drawMermaid();
console.log(diagram);
```

Paste output into [https://mermaid.live](https://mermaid.live).

**What to verify:**
- `__start__` connects to the correct first node
- All conditional edges have path maps covering all possible return values
- Fan-in nodes have exactly the right number of incoming edges
- Every path eventually reaches `END`

---

## C. Inspecting State Between Nodes

When you need to see what state looks like at a specific point, use a debug node:

```typescript
function makeDebugNode(label: string) {
  return async (state: State) => {
    console.log(`\n[DEBUG ${label}]`);
    console.log(JSON.stringify(state, null, 2));
    return {};  // empty return — no state changes
  };
}

// Temporarily add between any two nodes
graph.addNode('debugAfterClassify', makeDebugNode('after-classify'));
graph.addEdge('classify', 'debugAfterClassify');
graph.addEdge('debugAfterClassify', 'analyse');
```

Remove debug nodes before committing.

---

## D. LangSmith Tracing for Graphs

Set in `.env`:

```
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__your_key
LANGCHAIN_PROJECT=my-langgraph-app
```

In LangSmith you will see:
- The full graph as a trace tree
- Input and output state for every node
- Latency per node
- Which nodes ran in parallel (they show the same start time)
- Token usage per LLM call

---

## E. State Inspection via `app.getState()`

When using a checkpointer (required for HITL), inspect state at any point:

```typescript
const config = { configurable: { thread_id: 'my-session' } };

// After invoke or between invocations
const snapshot = await app.getState(config);

console.log('Current values:', snapshot.values);
console.log('Next nodes:', snapshot.next);
console.log('Tasks (including interrupts):', snapshot.tasks);
```

`snapshot.next` is empty when the graph has finished. When interrupted, it contains the interrupted node name.

---

## F. Debugging Checklist

When a LangGraph workflow behaves unexpectedly, work through this list:

1. **Visualise** — run `drawMermaid()` and verify the graph structure
2. **Check reducers** — log the field length across multiple invocations to verify accumulate vs replace
3. **Add debug nodes** — insert debug nodes around the problem area
4. **Check counter limits** — ensure every loop has a hard exit condition
5. **Enable LangSmith** — check node-by-node input/output in the UI
6. **Check thread IDs** — ensure each session uses a unique thread ID
7. **Check checkpointer** — verify `MemorySaver` is passed to `compile()` if using `interrupt()`
8. **Isolate the node** — call the problematic node function directly with a known state and verify its output

---
