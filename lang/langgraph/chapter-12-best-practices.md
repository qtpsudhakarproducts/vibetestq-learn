# Chapter 12 — Best Practices

---

## The Problem

After building your first LangGraph workflows, you will encounter the same problems every team runs into: graphs that are hard to debug, state fields that clash, loops that never end, and nodes that silently fail. This chapter gives you the patterns to avoid them.

---

## 1. State Design Rules

**Keep state minimal.** Every field you add to state must be maintained, serialised, and deserialised across the entire workflow lifetime. Ask: "Is this field needed by more than one node?" If no, consider passing it directly.

**Choose reducers deliberately.**

| Use case | Reducer |
|---|---|
| List that grows across nodes | `(e, u) => [...e, ...u]` |
| Value that gets replaced each cycle | `(_e, u) => u` |
| Counter that increments | `(e, u) => e + u` |
| Simple value | none (default replace) |

**Common mistake: accumulate when you meant replace.**

```typescript
// ❌ WRONG — test cases accumulate across retries
uiTestCases: Annotation<string[]>({
  reducer: (e, u) => [...e, ...u],  // After 3 retries: 12 test cases, most duplicates
  default: () => [],
}),

// ✅ CORRECT — each generation replaces the previous
uiTestCases: Annotation<string[]>({
  reducer: (_e, u) => u,            // Always contains only the latest generation
  default: () => [],
}),
```

---

## 2. Node Design Rules

**Every node must return a partial state object.** Never mutate the state argument.

```typescript
// ❌ WRONG — mutates state, may cause issues
async function badNode(state: State) {
  state.results.push('new item');  // mutation!
  return state;
}

// ✅ CORRECT — returns new partial state
async function goodNode(state: State) {
  return { results: [...state.results, 'new item'] };
}
```

**Every node must handle errors gracefully.** A node that throws an unhandled error will crash the entire graph.

```typescript
async function safeNode(state: State) {
  try {
    const response = await model.invoke([...]);
    return { result: response.content as string };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('safeNode failed:', message);
    return { result: '', error: message };  // error field in state
  }
}
```

**Add an error field to your state for recoverable errors:**

```typescript
const MyState = Annotation.Root({
  // ... other fields
  lastError: Annotation<string>(),  // empty string = no error
});
```

---

## 3. Loop Safety Rules

Every loop needs an exit condition that does not depend solely on AI output. AI can be wrong. AI can be inconsistent. Build in a hard counter limit.

```typescript
// ❌ DANGEROUS — loop only exits when AI says quality is good
function qualityRouter(state: State): string {
  return state.qualityScore >= 7 ? 'output' : 'generate';
}

// ✅ SAFE — exits after max retries regardless of AI score
const MAX_RETRIES = 3;
function qualityRouter(state: State): string {
  if (state.qualityScore >= 7) return 'output';
  if (state.retryCount >= MAX_RETRIES) return 'output';  // bail out
  return 'generate';
}
```

---

## 4. Graph Naming Conventions

Consistent names make graphs readable:

| Element | Convention | Example |
|---|---|---|
| State annotation | PascalCase + `State` | `ReviewWorkflowState` |
| State type alias | same + `Type` | `ReviewWorkflowStateType` |
| Node functions | camelCase + `Node` | `classifyFailuresNode` |
| Router functions | camelCase + `Router` | `qualityRouter` |
| Edge keys in path map | camelCase | `{ 'highPriority': 'criticalPath' }` |
| Graph variable | `graph` | `const graph = new StateGraph(...)` |
| Compiled app | `app` | `const app = graph.compile(...)` |

---

## 5. Testing LangGraph Workflows

### Test individual nodes in isolation

Nodes are just async functions. Test them directly without running the graph.

```typescript
import { describe, it, expect } from 'vitest';
import { classifyFailuresNode } from '../src/nodes.js';
import type { WorkflowStateType } from '../src/state.js';

describe('classifyFailuresNode', () => {
  it('returns empty categories when no failures', async () => {
    const state = {
      failures: [],
      // ... other required state fields with defaults
    } as Partial<WorkflowStateType>;

    const result = await classifyFailuresNode(state as WorkflowStateType);

    expect(result.realBugs).toHaveLength(0);
    expect(result.flakyTests).toHaveLength(0);
  });
});
```

### Test state transitions through the graph

For integration tests, use `app.invoke()` with mock data:

```typescript
it('routes to humanApproval when quality >= 7', async () => {
  const result = await app.invoke({
    qualityScore: 8,
    generationCount: 1,
    // ... required fields
  });

  // Inspect state after graph completes
  expect(result.status).toBe('awaiting-approval');
});
```

### Test loops with a low counter limit

For tests, override `MAX_RETRIES = 1` so loops terminate quickly:

```typescript
it('exits loop after max retries', async () => {
  process.env.MAX_RETRIES = '1';
  const result = await app.invoke({ qualityScore: 4, generationCount: 0 });
  expect(result.generationCount).toBeLessThanOrEqual(2);
});
```

---

## 6. Visualising Your Graph

LangGraph can output a Mermaid diagram to help you verify your graph structure:

```typescript
const graph = new StateGraph(MyState)
  .addNode('a', nodeA)
  .addNode('b', nodeB)
  .addEdge('__start__', 'a')
  .addEdge('a', 'b')
  .addEdge('b', END);

const app = graph.compile();
const mermaid = app.getGraph().drawMermaid();
console.log(mermaid);
```

Paste the output into [mermaid.live](https://mermaid.live) to see the visual graph.

---

## 7. LangSmith Tracing

Add tracing to see every node input/output:

```typescript
// .env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__...
LANGCHAIN_PROJECT=my-qa-workflow
```

No code changes needed. Every graph invocation will appear in the LangSmith UI with full state at each node. LangSmith is covered in detail in Book 3.

---

## 8. Checklist Before Deploying a Graph

Use this checklist for every new LangGraph workflow:

- [ ] Every loop has a hard counter limit (not just an AI-evaluated condition)
- [ ] Every node returns a partial state object (no mutations)
- [ ] Every node has try/catch with a meaningful fallback
- [ ] State has an `error` field or equivalent for recoverable failures
- [ ] All array fields have explicit reducers (not default replace)
- [ ] Thread IDs are unique per user/session when using checkpointer
- [ ] `interrupt()` nodes only compiled with `MemorySaver` or persistent checkpointer
- [ ] Graph structure verified with Mermaid before review
- [ ] Individual nodes tested in isolation
- [ ] LangSmith tracing enabled for debugging

---

## Interview Questions

**Beginner**
1. What reducer should you use for a list that should always contain only the latest generation?
2. Why is it important for every node to have error handling?

**Intermediate**
3. Explain why `(e, u) => [...e, ...u]` can cause problems in a retry loop.
4. Why should `MAX_RETRIES` be configurable via environment variable in tests?

**Advanced**
5. You have a production graph where a node sometimes produces empty output without throwing. The graph continues with empty state and the user sees a blank report. What practices from this chapter would prevent this, and how would you implement them?

---
