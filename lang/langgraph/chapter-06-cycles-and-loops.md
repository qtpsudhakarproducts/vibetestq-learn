# Chapter 6 — Cycles and Loops

---

## The Problem

You generate test cases. The quality score is 4/10. Too low to accept. So you regenerate. Score is 6/10. Better, but still not 7. You regenerate again. Score is 8/10. Done.

This is a loop. It is one of the most common patterns in AI QA workflows — repeat until quality is acceptable. LangChain chains cannot do this. LangGraph was built for it.

---

## What Is a Cycle in a Graph?

**A cycle is a path in the graph that loops back to an earlier node.**

In LangGraph, a cycle is created by adding a conditional edge that can return the name of a node that was already visited. The graph will run that node again with the updated state.

The analogy: a QA review cycle. You write a test plan, submit it for review, get feedback, revise, resubmit. This repeats until the reviewer approves. That review loop is a cycle.

**The critical difference from infinite loops:** every cycle needs an exit condition — a state check that eventually routes to `END` instead of looping back.

---

## The Loop Pattern

Every loop in LangGraph follows this pattern:

```
do-work node → check-condition node → PASS → END
                                    → FAIL + retries remaining → do-work node (loop)
                                    → FAIL + no retries left → save-anyway node → END
```

Three ingredients:
1. A **counter** in state (how many times have we looped?)
2. A **condition** (is the quality good enough, or have we exhausted retries?)
3. A **conditional edge** that either loops back or exits

---

## Implementing a Retry Loop

```typescript
import 'dotenv/config';
import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

const LoopState = Annotation.Root({
  requirements: Annotation<string>(),
  testCases: Annotation<string[]>({
    reducer: (_e, u) => u, // replace, don't append
    default: () => [],
  }),
  qualityScore: Annotation<number>(),
  qualityFeedback: Annotation<string>(),
  attempt: Annotation<number>({
    reducer: (e, u) => e + u,
    default: () => 0,
  }),
  finalStatus: Annotation<string>(),
});

type State = typeof LoopState.State;

const MAX_ATTEMPTS = 4;
const QUALITY_THRESHOLD = 7;

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// Node: Generate (or regenerate) test cases
async function generateNode(state: State) {
  const feedbackSection = state.qualityFeedback
    ? `\n\nPrevious attempt feedback (score ${state.qualityScore}/10):\n${state.qualityFeedback}\nPlease address this feedback.`
    : '';

  const response = await model.invoke([
    {
      role: 'system',
      content: 'Generate exactly 4 test cases as a numbered list. Each must include: precondition, steps, expected result.',
    },
    {
      role: 'user',
      content: `Requirements: ${state.requirements}${feedbackSection}`,
    },
  ]);

  const cases = (response.content as string)
    .split('\n')
    .filter((l) => /^\d+\./.test(l))
    .map((l) => l.trim());

  return {
    testCases: cases,
    attempt: 1, // adds 1 to counter each time (reducer sums)
  };
}

// Node: Evaluate quality and provide feedback
async function evaluateNode(state: State) {
  const response = await model.invoke([
    {
      role: 'system',
      content: `You are a senior QA reviewer. 
Score these test cases from 1-10.
Format your response as:
SCORE: <number>
FEEDBACK: <one sentence of specific improvement advice>`,
    },
    {
      role: 'user',
      content: state.testCases.join('\n'),
    },
  ]);

  const text = response.content as string;
  const scoreMatch = text.match(/SCORE:\s*([1-9]|10)/i);
  const feedbackMatch = text.match(/FEEDBACK:\s*(.+)/i);

  return {
    qualityScore: scoreMatch ? parseInt(scoreMatch[1]) : 5,
    qualityFeedback: feedbackMatch ? feedbackMatch[1].trim() : 'Improve specificity.',
  };
}

// Node: Mark as accepted
async function acceptNode(state: State) {
  return {
    finalStatus: `Accepted on attempt ${state.attempt}. Score: ${state.qualityScore}/10`,
  };
}

// Node: Save with max-retry warning
async function saveAnywayNode(state: State) {
  return {
    finalStatus: `Max retries reached (${state.attempt} attempts). Final score: ${state.qualityScore}/10`,
  };
}

// Router: should we loop, accept, or give up?
function loopRouter(state: State): string {
  if (state.qualityScore >= QUALITY_THRESHOLD) {
    return 'accept';
  }
  if (state.attempt >= MAX_ATTEMPTS) {
    return 'saveAnyway';
  }
  return 'generate'; // loop back
}

// Build graph with cycle
const graph = new StateGraph(LoopState)
  .addNode('generate', generateNode)
  .addNode('evaluate', evaluateNode)
  .addNode('accept', acceptNode)
  .addNode('saveAnyway', saveAnywayNode)
  .addEdge('__start__', 'generate')
  .addEdge('generate', 'evaluate')
  .addConditionalEdges('evaluate', loopRouter, {
    accept: 'accept',
    saveAnyway: 'saveAnyway',
    generate: 'generate', // this is the back edge that creates the cycle
  })
  .addEdge('accept', END)
  .addEdge('saveAnyway', END);

const app = graph.compile();

const result = await app.invoke({
  requirements: 'User can upload a profile picture in JPEG or PNG format under 5MB.',
});

console.log(`\nFinal Status: ${result.finalStatus}`);
console.log(`Total Attempts: ${result.attempt}`);
console.log(`\nFinal Test Cases:`);
result.testCases.forEach((tc, i) => console.log(`  ${i + 1}. ${tc}`));
```

---

## Using Feedback in the Loop

Notice in the example that the `generateNode` uses `state.qualityFeedback` when regenerating. This is the key to improving results across loop iterations:

```typescript
const feedbackSection = state.qualityFeedback
  ? `\n\nPrevious attempt feedback (score ${state.qualityScore}/10):\n${state.qualityFeedback}\nPlease address this feedback.`
  : '';
```

On the first run, there is no feedback. On the second run, the AI is told exactly what the previous attempt scored and why. This turns the loop from blind retrying into **iterative improvement** — much more useful.

---

## Loop Safety Rules

| Rule | Why |
|---|---|
| Always track attempt count | Prevents infinite loops |
| Always have a max-retry exit | Ensures the graph always terminates |
| Use feedback in regeneration | Makes each attempt better than the last |
| Use replace reducer for regenerated content | Prevents old + new content mixing |

---

## Interview Questions

**Beginner**
1. What creates a cycle in a LangGraph graph?
2. Why must every cycle have an exit condition?

**Intermediate**
3. In the example, why does the `attempt` field use `reducer: (e, u) => e + u` instead of the default replace reducer?
4. Why does `testCases` use `reducer: (_e, u) => u` (replace) instead of the append reducer from earlier chapters?

**Advanced**
5. You have a loop that regenerates test cases based on AI quality scores. The AI sometimes gives inconsistent scores (7 one run, 4 the next, for identical test cases). How would you make the exit condition more robust?

---
