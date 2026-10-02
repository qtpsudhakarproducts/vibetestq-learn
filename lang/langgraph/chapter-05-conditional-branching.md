# Chapter 5 — Conditional Branching

---

## The Problem

Your test case quality check says the result is "Low Quality". What happens next? Does the workflow:

a) Retry with the same requirements?
b) Retry but with a more detailed prompt?
c) Ask a human to review?
d) Flag the requirement as ambiguous and move on?

This kind of multi-path decision is conditional branching. It is the most powerful feature of LangGraph — and the most commonly needed in real QA workflows.

---

## What Is Conditional Branching?

**Conditional branching means the path through the graph changes based on the current state.**

The analogy: a defect triage process. A bug comes in. First, check the severity:
- Critical → immediate fix, block release
- High → fix this sprint
- Medium → backlog
- Low → known issues list

Each severity leads to a different downstream process. That is branching. And in a QA AI workflow, the AI is doing the triage.

---

## Three Branching Patterns

### Pattern 1 — Binary branch (pass/fail)
```
quality check → PASS → save output
              → FAIL → regenerate
```

### Pattern 2 — Multi-path branch (classification)
```
bug triage → CRITICAL → escalate
           → HIGH     → sprint backlog
           → LOW      → known issues
```

### Pattern 3 — Branch then merge
```
generate → review → APPROVED    → format → save
                  → NEEDS WORK  → revise → format → save
```

---

## Implementing a Multi-Path Branch

**Problem:** Classify a bug report as Critical, High, Medium, or Low. Route to different handlers.

```typescript
import 'dotenv/config';
import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

// State
const BugTriageState = Annotation.Root({
  bugReport: Annotation<string>(),
  severity: Annotation<string>(),
  triageAction: Annotation<string>(),
  assignedTo: Annotation<string>(),
});

type State = typeof BugTriageState.State;

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// Structured parser for severity
const severitySchema = z.object({
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']).describe('Bug severity'),
  reasoning: z.string().describe('Why this severity was chosen'),
});
type SeverityResult = z.infer<typeof severitySchema>;

const severityParser = StructuredOutputParser.fromZodSchema(severitySchema);

// Node 1: Classify severity
async function classifyNode(state: State) {
  const formatInstructions = severityParser.getFormatInstructions();
  const response = await model.invoke([
    {
      role: 'system',
      content: `Classify the severity of this bug report.\n${formatInstructions}`,
    },
    { role: 'user', content: state.bugReport },
  ]);
  const parsed: SeverityResult = await severityParser.parse(response.content as string);
  return { severity: parsed.severity };
}

// Nodes for each severity path
async function criticalHandlerNode(state: State) {
  return {
    triageAction: 'Block release. Assign to lead engineer immediately.',
    assignedTo: 'lead-engineer',
  };
}

async function highHandlerNode(state: State) {
  return {
    triageAction: 'Add to current sprint. Due end of week.',
    assignedTo: 'dev-team',
  };
}

async function mediumHandlerNode(state: State) {
  return {
    triageAction: 'Add to product backlog for next sprint.',
    assignedTo: 'product-owner',
  };
}

async function lowHandlerNode(state: State) {
  return {
    triageAction: 'Add to known issues list. Review monthly.',
    assignedTo: 'qa-team',
  };
}

// Router function: reads severity from state, returns node name
function severityRouter(state: State): string {
  switch (state.severity) {
    case 'Critical': return 'criticalHandler';
    case 'High':     return 'highHandler';
    case 'Medium':   return 'mediumHandler';
    default:         return 'lowHandler';
  }
}

// Build the graph
const graph = new StateGraph(BugTriageState)
  .addNode('classify', classifyNode)
  .addNode('criticalHandler', criticalHandlerNode)
  .addNode('highHandler', highHandlerNode)
  .addNode('mediumHandler', mediumHandlerNode)
  .addNode('lowHandler', lowHandlerNode)
  .addEdge('__start__', 'classify')
  .addConditionalEdges('classify', severityRouter, {
    criticalHandler: 'criticalHandler',
    highHandler: 'highHandler',
    mediumHandler: 'mediumHandler',
    lowHandler: 'lowHandler',
  })
  .addEdge('criticalHandler', END)
  .addEdge('highHandler', END)
  .addEdge('mediumHandler', END)
  .addEdge('lowHandler', END);

const app = graph.compile();

// Test it
const bugs = [
  'Login page returns 500 error for all users on production.',
  'Tooltip text is slightly misaligned on the Settings page.',
];

for (const bug of bugs) {
  const result = await app.invoke({ bugReport: bug });
  console.log(`\nBug: ${bug.slice(0, 60)}...`);
  console.log(`Severity: ${result.severity}`);
  console.log(`Action: ${result.triageAction}`);
  console.log(`Assigned: ${result.assignedTo}`);
}
```

---

## Branch Then Merge Pattern

When multiple paths need to converge to the same downstream node, add edges from all branch nodes to the same target:

```typescript
// All severity paths eventually need a notification node
graph
  .addEdge('criticalHandler', 'notify')
  .addEdge('highHandler', 'notify')
  .addEdge('mediumHandler', 'notify')
  .addEdge('lowHandler', 'notify')
  .addEdge('notify', END);
```

The `notify` node runs once for all paths. The state at that point contains the severity and action set by whichever handler ran.

---

## Router Functions with LLM Decisions

The router does not have to read a field from state. It can call an LLM directly:

```typescript
const routerModel = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });

async function requirementTypeRouter(state: State): Promise<string> {
  const response = await routerModel.invoke([
    {
      role: 'user',
      content: `Is this requirement for UI, API, or PERFORMANCE testing? 
Reply with exactly one word: UI, API, or PERFORMANCE.
Requirement: ${state.requirements}`,
    },
  ]);
  const answer = (response.content as string).trim().toUpperCase();
  if (answer === 'API') return 'apiTestNode';
  if (answer === 'PERFORMANCE') return 'perfTestNode';
  return 'uiTestNode';
}

graph.addConditionalEdges('classify', requirementTypeRouter);
```

**What this means for testers:** You can use a fast, cheap model (gpt-4o-mini) for routing decisions and a more powerful model for the actual work. This cuts costs significantly.

---

## Interview Questions

**Beginner**
1. What does a router function return in LangGraph?
2. How do you make multiple paths converge back to the same node?

**Intermediate**
3. In the bug triage example, what would happen if the AI returned `"critical"` (lowercase) instead of `"Critical"`? How would you guard against this?
4. When would you use an LLM inside a router function vs reading a state field?

**Advanced**
5. Design a conditional branching scheme for a test coverage analyser that: classifies requirements into UI/API/DB, routes to specialised generators for each type, then merges all generated test cases into a combined output. How many nodes and edges would you need?

---
