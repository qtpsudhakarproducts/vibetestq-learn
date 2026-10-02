# Chapter 8 — Human-in-the-Loop

---

## The Problem

Your AI generates a test plan. It looks good. But before the team starts executing it, the QA lead needs to review and approve it. If she rejects it, the AI should revise. If she approves, the workflow continues.

This requires the graph to **pause**, wait for a human response, then **resume** from where it stopped. This is not possible with a chain. LangGraph has native support for it: **interrupts**.

---

## What Is Human-in-the-Loop?

**Human-in-the-loop (HITL) means pausing the graph at a specific node and waiting for a human to provide input before continuing.**

The analogy: a contract approval workflow. The legal team drafts the contract (automated). The COO reviews and either signs or sends back with notes (human). The legal team makes changes if needed (automated again). The process pauses at the human step — nobody continues without the signature.

LangGraph interrupts work exactly like this. The graph pauses, exposes the current state to the human, waits for their response, then resumes.

---

## How Interrupts Work

LangGraph interrupts require:
1. A **checkpointer** — a storage mechanism that saves graph state between runs. Without it, the graph cannot resume after pausing.
2. A `interrupt()` call inside a node — pauses execution and surfaces a value to the caller.
3. A way to **resume** — pass `null` as input with the same thread ID.

```typescript
import { interrupt } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';

// Step 1: Add checkpointer when compiling
const checkpointer = new MemorySaver();
const app = graph.compile({ checkpointer });

// Step 2: Use interrupt() inside a node
async function reviewNode(state: State) {
  // This pauses the graph and surfaces the test plan to the caller
  const humanDecision = interrupt({
    testPlan: state.testPlan,
    message: 'Please review and respond with APPROVE or REVISE: <your feedback>',
  });
  // humanDecision contains whatever the human sent when resuming
  return { humanFeedback: humanDecision as string };
}
```

---

## Thread IDs: Identifying Conversations

Every graph run with HITL needs a **thread ID** — a unique identifier that lets the checkpointer find the paused state when the human resumes.

```typescript
const config = { configurable: { thread_id: 'review-session-001' } };

// First run — starts the graph, pauses at interrupt
const result = await app.invoke({ testPlan: 'TC-001...' }, config);
// result is undefined (graph paused) — the interrupt value is in the state

// Get the current state while paused
const state = await app.getState(config);
console.log('Waiting for human input:', state.values);

// Resume after human provides input
const resumed = await app.invoke(null, {
  ...config,
  // The human's input is provided via Command
});
```

---

## Complete Working Example: Test Plan Approval

```typescript
import 'dotenv/config';
import { StateGraph, END, Annotation, interrupt } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import * as readline from 'readline';

const ReviewState = Annotation.Root({
  requirements: Annotation<string>(),
  testPlan: Annotation<string>(),
  humanFeedback: Annotation<string>(),
  approved: Annotation<boolean>(),
  revisionCount: Annotation<number>({
    reducer: (e, u) => e + u,
    default: () => 0,
  }),
  finalStatus: Annotation<string>(),
});

type State = typeof ReviewState.State;
const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// Node 1: Generate test plan
async function generatePlanNode(state: State) {
  const feedbackSection = state.humanFeedback
    ? `\n\nPrevious plan was rejected. Human feedback: "${state.humanFeedback}". Please address this.`
    : '';

  const response = await model.invoke([
    {
      role: 'system',
      content: 'Generate a concise test plan with 3 sections: Scope, Test Cases (3 items), Risks.',
    },
    {
      role: 'user',
      content: `Requirements: ${state.requirements}${feedbackSection}`,
    },
  ]);
  return { testPlan: response.content as string, revisionCount: state.humanFeedback ? 1 : 0 };
}

// Node 2: Human review — PAUSES HERE
async function humanReviewNode(state: State) {
  console.log('\n=== GENERATED TEST PLAN ===');
  console.log(state.testPlan);
  console.log('\n=== AWAITING YOUR REVIEW ===');
  console.log('Type APPROVE to accept, or type your feedback to request revision.\n');

  // interrupt() pauses the graph and surfaces the test plan
  const response = interrupt({
    testPlan: state.testPlan,
    prompt: 'Type APPROVE or your revision feedback:',
  });

  const feedback = response as string;
  const isApproved = feedback.trim().toUpperCase() === 'APPROVE';

  return {
    humanFeedback: isApproved ? '' : feedback,
    approved: isApproved,
  };
}

// Node 3: Approved — save
async function saveApprovedNode(state: State) {
  return {
    finalStatus: `Approved after ${state.revisionCount} revision(s). Test plan saved.`,
  };
}

// Router after human review
function reviewRouter(state: State): string {
  if (state.approved) return 'saveApproved';
  return 'generatePlan'; // loop back for revision
}

const graph = new StateGraph(ReviewState)
  .addNode('generatePlan', generatePlanNode)
  .addNode('humanReview', humanReviewNode)
  .addNode('saveApproved', saveApprovedNode)
  .addEdge('__start__', 'generatePlan')
  .addEdge('generatePlan', 'humanReview')
  .addConditionalEdges('humanReview', reviewRouter, {
    saveApproved: 'saveApproved',
    generatePlan: 'generatePlan',
  })
  .addEdge('saveApproved', END);

// Compile with checkpointer (required for interrupts)
const checkpointer = new MemorySaver();
const app = graph.compile({ checkpointer });

// CLI runner that handles the interrupt/resume cycle
async function runWithHumanApproval(requirements: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  const config = { configurable: { thread_id: `review-${Date.now()}` } };

  // Start the graph
  let result = await app.invoke({ requirements }, config);

  // Loop until the graph finishes (no more interrupts)
  while (result === undefined || app.getState) {
    const state = await app.getState(config);
    
    // If no pending tasks, the graph is done
    if (state.next.length === 0) {
      console.log('\n✅ Workflow complete:', state.values.finalStatus);
      break;
    }

    // We are at an interrupt — ask the human
    const interrupts = state.tasks
      .flatMap((t) => t.interrupts ?? []);
    
    if (interrupts.length === 0) break;

    const humanInput = await ask('Your response: ');
    
    // Resume the graph with the human's response
    const { Command } = await import('@langchain/langgraph');
    result = await app.invoke(new Command({ resume: humanInput }), config);
  }

  rl.close();
}

// Run it
await runWithHumanApproval(
  'User can upload a CV in PDF format. System parses and extracts name, skills, and experience.'
);
```

---

## When to Use Human-in-the-Loop

| Scenario | Why HITL helps |
|---|---|
| Test plan approval | Humans catch business logic errors AI misses |
| Bug priority decisions | Business impact context only humans have |
| Release go/no-go gates | Final accountability must be human |
| Sensitive test data review | PII or security-relevant data needs human eyes |
| AI confidence is low | When AI signals uncertainty, escalate to human |

---

## Interview Questions

**Beginner**
1. What is a checkpointer and why is it required for human-in-the-loop workflows?
2. What does `interrupt()` do inside a node?

**Intermediate**
3. How does the graph know where to resume after a human provides input? What role does the thread ID play?
4. In the example, what state field determines whether the graph loops back to regenerate or proceeds to save?

**Advanced**
5. Design a HITL workflow for a multi-stage test release process: AI generates test cases → QA lead approves test cases → dev team approves the scope → final sign-off by product manager. How many interrupt nodes would you need, and what state would each one expose?

---
