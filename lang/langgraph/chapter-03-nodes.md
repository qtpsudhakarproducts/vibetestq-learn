# Chapter 3 — Nodes: Where the Work Happens

---

## The Problem

You have a state object and a graph. Now you need to actually do something — call the AI, run a validation, format output. Everything useful in a LangGraph workflow happens inside **nodes**.

Understanding how to write nodes well is the most important skill in LangGraph. Every bug, every unexpected behaviour, and every performance problem usually traces back to how a node reads or updates state.

---

## What Is a Node?

**A node is a function that receives the current state and returns a partial state update.**

That is the complete definition. A node can do anything inside — call an LLM, run a Playwright test, read a file, call an API, or just format a string. What makes it a LangGraph node is the signature: takes state, returns updates.

### The analogy

Think of a QA workflow as a baton relay race. The state is the baton. Each runner (node) receives the baton, does their leg of the race (their job), and passes the baton — now with their contribution added — to the next runner. No runner needs to carry everything from the start. They only add what they know.

---

## The Node Signature

```typescript
// A node function always looks like this:
async function myNode(state: MyState): Promise<Partial<MyState>> {
  // Do work using state
  // Return ONLY what you changed
  return { fieldYouChanged: newValue };
}
```

**Rules for nodes:**
1. Always `async` — even if you do not use await, LangGraph expects a Promise
2. Takes the full state, but reads only what it needs
3. Returns only the fields it wants to update
4. Never mutates the state object directly — always return a new value

---

## Types of Nodes

### 1. LLM Node — calls an AI model
```typescript
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

async function analyseRequirementsNode(state: WorkflowState) {
  const response = await model.invoke([
    {
      role: 'system',
      content: 'You are a senior QA analyst. Identify ambiguities in requirements.',
    },
    {
      role: 'user',
      content: state.requirements,
    },
  ]);

  return {
    analysis: response.content as string,
  };
}
```

### 2. Transform Node — processes data, no AI call
```typescript
async function formatOutputNode(state: WorkflowState) {
  const formatted = state.testCases
    .map((tc, i) => `**TC-${String(i + 1).padStart(3, '0')}**\n${tc}`)
    .join('\n\n---\n\n');

  return { formattedOutput: formatted };
}
```

### 3. Decision Node — reads state, returns a routing signal
Decision nodes are used with conditional edges. We cover this in Chapter 5. For now, know that a node can simply check state and return a flag:

```typescript
async function qualityGateNode(state: WorkflowState) {
  const passed = state.qualityScore >= 7;
  return { qualityGatePassed: passed };
}
```

### 4. Side-Effect Node — saves to file, calls external API
```typescript
import { writeFileSync } from 'fs';

async function saveOutputNode(state: WorkflowState) {
  const content = state.formattedOutput;
  const filename = `output/test-cases-${Date.now()}.md`;
  writeFileSync(filename, content, 'utf-8');
  
  return { savedPath: filename };
}
```

---

## Registering Nodes in the Graph

Nodes are registered with `.addNode(name, function)`:

```typescript
const graph = new StateGraph(StateSchema)
  .addNode('analyse', analyseRequirementsNode)
  .addNode('generate', generateTestCasesNode)
  .addNode('evaluate', qualityGateNode)
  .addNode('format', formatOutputNode)
  .addNode('save', saveOutputNode);
```

The name is a string identifier used when defining edges. It also appears in LangSmith traces, so name nodes clearly.

---

## Complete Working Example: A 4-Node QA Pipeline

**Problem:** Build a graph that analyses requirements, generates test cases, adds metadata, and saves output.

```typescript
import 'dotenv/config';
import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { writeFileSync, mkdirSync } from 'fs';

// State definition
const PipelineState = Annotation.Root({
  requirements: Annotation<string>(),
  analysis: Annotation<string>(),
  testCases: Annotation<string[]>({
    reducer: (e, u) => [...e, ...u],
    default: () => [],
  }),
  metadata: Annotation<Record<string, string>>(),
  savedPath: Annotation<string>(),
});

type State = typeof PipelineState.State;
const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// Node 1: Analyse requirements
async function analyseNode(state: State) {
  const response = await model.invoke([
    { role: 'system', content: 'Identify test scenarios in this requirement in 2-3 sentences.' },
    { role: 'user', content: state.requirements },
  ]);
  return { analysis: response.content as string };
}

// Node 2: Generate test cases
async function generateNode(state: State) {
  const response = await model.invoke([
    {
      role: 'system',
      content: 'Generate 4 test cases as a numbered list based on the analysis.',
    },
    {
      role: 'user',
      content: `Requirements: ${state.requirements}\n\nAnalysis: ${state.analysis}`,
    },
  ]);
  const cases = (response.content as string)
    .split('\n')
    .filter((l) => /^\d+\./.test(l))
    .map((l) => l.trim());
  return { testCases: cases };
}

// Node 3: Add metadata (no AI needed)
async function metadataNode(state: State) {
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      count: String(state.testCases.length),
      source: 'LangGraph QA Pipeline',
    },
  };
}

// Node 4: Save to file
async function saveNode(state: State) {
  mkdirSync('output', { recursive: true });
  const lines = [
    '# Generated Test Cases',
    '',
    `**Requirements:** ${state.requirements}`,
    '',
    `**Analysis:** ${state.analysis}`,
    '',
    '## Test Cases',
    '',
    ...state.testCases.map((tc) => `- ${tc}`),
    '',
    '## Metadata',
    '',
    ...Object.entries(state.metadata).map(([k, v]) => `- **${k}:** ${v}`),
  ];
  const path = `output/test-cases-${Date.now()}.md`;
  writeFileSync(path, lines.join('\n'), 'utf-8');
  return { savedPath: path };
}

// Build and run graph
const graph = new StateGraph(PipelineState)
  .addNode('analyse', analyseNode)
  .addNode('generate', generateNode)
  .addNode('metadata', metadataNode)
  .addNode('save', saveNode)
  .addEdge('__start__', 'analyse')
  .addEdge('analyse', 'generate')
  .addEdge('generate', 'metadata')
  .addEdge('metadata', 'save')
  .addEdge('save', END);

const app = graph.compile();

const result = await app.invoke({
  requirements: 'Users can filter the product list by category and price range.',
});

console.log(`\nGenerated ${result.testCases.length} test cases`);
console.log(`Saved to: ${result.savedPath}`);
```

---

## Common Node Mistakes

### ❌ Mutating state directly
```typescript
// WRONG — never mutate state in place
async function badNode(state: State) {
  state.testCases.push('new test case'); // mutates state!
  return {}; // returns nothing — changes are lost!
}
```

### ✅ Return a new value
```typescript
async function goodNode(state: State) {
  return { testCases: [...state.testCases, 'new test case'] };
}
```

### ❌ Returning undefined fields
```typescript
async function badNode(state: State) {
  return { testCases: undefined }; // wipes out testCases!
}
```

### ✅ Omit fields you don't change
```typescript
async function goodNode(state: State) {
  return { analysis: 'done' }; // testCases untouched
}
```

---

## Interview Questions

**Beginner**
1. What are the two things every node function must do (input and output)?
2. Can a node call an external API? What about write to a file?

**Intermediate**
3. What happens if a node returns `{ testCases: undefined }`?
4. Why should nodes return `Partial<State>` rather than the full `State`?

**Advanced**
5. You have a node that takes 15 seconds (calls a slow external API). How would you handle timeouts and retries within the node without blocking the entire graph?

---
