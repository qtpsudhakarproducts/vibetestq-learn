# Chapter 1 — What Is LangGraph and Why Chains Are Not Enough

---

## The Problem

You built a test case generator with LangChain. It works — you put requirements in, you get test cases out. Linear. Predictable.

Now your QA lead says: "Can you make it loop until the test cases are good quality? And let me approve them before they're saved? Oh, and if the requirements are ambiguous, it should ask a clarifier agent before generating?"

Suddenly your chain looks like this:

```
requirements → [should I clarify?] → if yes: clarify → if no: continue
                                  ↓
                          generate test cases
                                  ↓
                        [quality check] → if fail: regenerate
                                      ↓
                         [human approval] → if rejected: revise
                                        ↓
                                      save
```

**This is not a chain.** This is a graph. It has branches, loops, and conditional flows. A chain cannot express this.

---

## What Is LangGraph?

**LangGraph is a framework for building stateful, multi-step AI workflows as directed graphs.**

The key word is **stateful**. LangGraph maintains a shared state object that every step reads from and writes to. Steps are called **nodes**. Connections between steps are called **edges**. The whole thing is a **StateGraph**.

### Think of it this way

A **chain** is like a recipe: do step 1, then step 2, then step 3 in order. Every batch of cookies goes through the same steps.

A **graph** is like a quality control process on a factory floor:
- Start at the conveyor belt
- Check the product
- If it passes, box it and ship it
- If it fails, rework it
- After three failures, discard it and log a defect

The process loops. It branches. It makes decisions. **That is what LangGraph does.**

---

## Chains vs Graphs: A Direct Comparison

| Aspect | LangChain Chain | LangGraph |
|---|---|---|
| Structure | Linear sequence | Directed graph with branches and loops |
| Flow control | Fixed — always the same path | Dynamic — AI or logic decides the path |
| State | Passed through as return values | Shared state object all nodes read/write |
| Loops | Not supported | Native — just add a back edge |
| Human approval | Not supported | Native — `interrupt()` pauses the graph |
| Parallel steps | Not supported | Native — `Send` dispatches parallel nodes |

---

## The Three Building Blocks

Every LangGraph workflow has three parts:

### 1. State
The data that flows through the entire graph. Every node reads from state and writes updates to state. Think of it as a shared clipboard that everyone on the team can read and update.

```typescript
// This is what state looks like (we'll build this properly in Chapter 2)
type QAWorkflowState = {
  requirements: string;
  testCases: string[];
  qualityScore: number;
  approved: boolean;
};
```

### 2. Nodes
Functions that do the actual work. A node receives the current state and returns updates to it.

```typescript
// A node receives state, does work, returns what to update
async function generateTestCases(state: QAWorkflowState) {
  const testCases = await callAI(state.requirements);
  return { testCases }; // updates only this field in state
}
```

### 3. Edges
Connections that define the flow. Unconditional edges always go to the next node. Conditional edges route based on the state — the AI output decides which node runs next.

```typescript
graph.addEdge('generate', 'qualityCheck');           // always go here next
graph.addConditionalEdges('qualityCheck', router);   // AI decides where to go
```

---

## A Minimal LangGraph Example

Here is the smallest possible LangGraph to make the concepts concrete.

**Problem:** Build a graph that takes a requirement, generates a test case, then checks if the test case is good.

```typescript
import 'dotenv/config';
import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

// Step 1: Define state
const StateAnnotation = Annotation.Root({
  requirement: Annotation<string>(),
  testCase: Annotation<string>(),
  quality: Annotation<string>(),
});

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// Step 2: Define nodes
async function generateNode(state: typeof StateAnnotation.State) {
  const response = await model.invoke([
    {
      role: 'user',
      content: `Write one test case for this requirement: ${state.requirement}`,
    },
  ]);
  return { testCase: response.content as string };
}

async function checkQualityNode(state: typeof StateAnnotation.State) {
  const response = await model.invoke([
    {
      role: 'user',
      content: `Rate this test case quality as GOOD or POOR:\n\n${state.testCase}`,
    },
  ]);
  const quality = (response.content as string).includes('GOOD') ? 'good' : 'poor';
  return { quality };
}

// Step 3: Build the graph
const graph = new StateGraph(StateAnnotation)
  .addNode('generate', generateNode)
  .addNode('checkQuality', checkQualityNode)
  .addEdge('__start__', 'generate')   // start here
  .addEdge('generate', 'checkQuality') // then here
  .addEdge('checkQuality', END);       // then done

const app = graph.compile();

// Step 4: Run it
const result = await app.invoke({
  requirement: 'Users must be able to log in with a valid email and password',
  testCase: '',
  quality: '',
});

console.log('Test Case:', result.testCase);
console.log('Quality:', result.quality);
```

**What this means for testers:** Each step (generate, checkQuality) is independent and can be read separately. State shows exactly what changed at each step. This is already more inspectable than a chain.

---

## When to Use LangGraph vs a Chain

**Use a chain when:**
- The workflow is linear — A → B → C, always
- No branching decisions are needed
- No loops or retries are needed
- No human approval is needed

**Use LangGraph when:**
- The flow depends on AI or logic decisions (branching)
- You need to retry or loop until a condition is met
- A human needs to approve before the workflow continues
- Multiple agents need to collaborate
- You need parallel execution

For most QA tool prototypes, a chain is fine. For production QA workflows, LangGraph is usually the right choice.

---

## Interview Questions

**Beginner**
1. What is the main difference between a LangChain chain and a LangGraph graph?
2. What are the three building blocks of every LangGraph workflow?

**Intermediate**
3. When would you choose LangGraph over a simple chain? Give a QA example.
4. What is "state" in LangGraph and why is it important?

**Advanced**
5. How does LangGraph support human-in-the-loop workflows? What problem does this solve in QA automation?

---
