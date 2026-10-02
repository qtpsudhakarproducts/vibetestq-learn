# Chapter 11 — End-to-End QA Workflow

---

## The Problem

Everything you have built in this book is a piece of a larger puzzle. In the real world, QA work is not one task — it is a chain of tasks that depend on each other, branch based on results, loop when quality is not good enough, and require human sign-off before going to production.

This chapter combines everything: state, nodes, edges, conditional branching, loops, parallel execution, and human-in-the-loop — into one production-grade workflow.

---

## The Workflow

```
parse-requirements
        ↓
clarify-ambiguities (loop until clear)
        ↓
parallel: [generate-ui-tests] [generate-api-tests]
        ↓
quality-gate
   ↓ PASS         ↓ FAIL (retry up to 3x)
human-approval ←  regenerate
   ↓ APPROVED     ↓ REJECTED → revise
generate-test-data
        ↓
produce-final-report
        ↓
       END
```

---

## State Design

When designing state for a complex workflow, list every piece of data that flows through:

```typescript
import { Annotation } from '@langchain/langgraph';

export const WorkflowState = Annotation.Root({
  // Input
  rawRequirements: Annotation<string>(),

  // Phase 1: Requirements clarification
  clarifiedRequirements: Annotation<string>(),
  clarificationNeeded: Annotation<boolean>(),
  clarificationCount: Annotation<number>({
    reducer: (e, u) => e + u,
    default: () => 0,
  }),

  // Phase 2: Test generation (parallel)
  uiTestCases: Annotation<string[]>({
    reducer: (_e, u) => u,
    default: () => [],
  }),
  apiTestCases: Annotation<string[]>({
    reducer: (_e, u) => u,
    default: () => [],
  }),

  // Phase 3: Quality gate
  qualityScore: Annotation<number>(),
  qualityFeedback: Annotation<string>(),
  generationCount: Annotation<number>({
    reducer: (e, u) => e + u,
    default: () => 0,
  }),

  // Phase 4: Human approval
  humanFeedback: Annotation<string>(),
  approved: Annotation<boolean>(),

  // Phase 5: Test data
  testData: Annotation<string>(),

  // Output
  finalReport: Annotation<string>(),
  status: Annotation<string>(),
});

export type WorkflowStateType = typeof WorkflowState.State;
```

---

## Complete Implementation

```typescript
import 'dotenv/config';
import { StateGraph, END, Annotation, interrupt } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import * as readline from 'readline';

// (State defined above — import it in a real project)
const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
const fastModel = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });

type State = WorkflowStateType;

// ── Phase 1: Requirements ─────────────────────────────────────────────────

async function clarifyRequirementsNode(state: State) {
  const response = await fastModel.invoke([
    {
      role: 'system',
      content: `Analyse requirements. If they have ambiguities that would affect testing, respond:
NEEDS_CLARIFICATION: <question>
If they are clear enough, respond:
CLEAR: <restate the key testable requirements in 3 bullets>`,
    },
    { role: 'user', content: state.rawRequirements },
  ]);

  const text = response.content as string;
  const needsClarification = text.startsWith('NEEDS_CLARIFICATION');
  const clarified = needsClarification ? state.rawRequirements : text.replace('CLEAR:', '').trim();

  return {
    clarificationNeeded: needsClarification && state.clarificationCount < 2,
    clarifiedRequirements: clarified,
    clarificationCount: 1,
  };
}

function clarificationRouter(state: State): string {
  if (state.clarificationNeeded) return 'clarifyRequirements';
  return 'generateUITests';
}

// ── Phase 2: Parallel test generation ────────────────────────────────────

async function generateUITestsNode(state: State) {
  const feedback = state.qualityFeedback ? `\nPrevious quality feedback: ${state.qualityFeedback}` : '';
  const response = await model.invoke([
    { role: 'system', content: 'Generate 4 UI test cases as a numbered list with precondition, steps, expected result.' },
    { role: 'user', content: state.clarifiedRequirements + feedback },
  ]);
  const cases = (response.content as string).split('\n').filter((l) => /^\d+\./.test(l)).map((l) => l.trim());
  return { uiTestCases: cases, generationCount: 1 };
}

async function generateAPITestsNode(state: State) {
  const feedback = state.qualityFeedback ? `\nPrevious quality feedback: ${state.qualityFeedback}` : '';
  const response = await model.invoke([
    { role: 'system', content: 'Generate 4 API test cases with endpoint, method, body, expected status, expected response.' },
    { role: 'user', content: state.clarifiedRequirements + feedback },
  ]);
  const cases = (response.content as string).split('\n').filter((l) => /^\d+\./.test(l)).map((l) => l.trim());
  return { apiTestCases: cases };
}

// ── Phase 3: Quality gate ─────────────────────────────────────────────────

async function qualityGateNode(state: State) {
  const allTests = [...state.uiTestCases, ...state.apiTestCases];
  const response = await fastModel.invoke([
    {
      role: 'system',
      content: `Score these test cases from 1-10.
SCORE: <number>
FEEDBACK: <one sentence on the most important improvement>`,
    },
    { role: 'user', content: allTests.join('\n') },
  ]);
  const text = response.content as string;
  const scoreMatch = text.match(/SCORE:\s*([1-9]|10)/i);
  const feedbackMatch = text.match(/FEEDBACK:\s*(.+)/i);
  return {
    qualityScore: scoreMatch ? parseInt(scoreMatch[1]) : 5,
    qualityFeedback: feedbackMatch ? feedbackMatch[1].trim() : '',
  };
}

function qualityRouter(state: State): string {
  if (state.qualityScore >= 7) return 'humanApproval';
  if (state.generationCount >= 3) return 'humanApproval'; // max retries, let human decide
  return 'generateUITests'; // regenerate with feedback
}

// ── Phase 4: Human approval ───────────────────────────────────────────────

async function humanApprovalNode(state: State) {
  console.log('\n═══════════════════════════════');
  console.log('QUALITY SCORE:', state.qualityScore + '/10');
  console.log('\nUI Tests:', state.uiTestCases.length);
  state.uiTestCases.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  console.log('\nAPI Tests:', state.apiTestCases.length);
  state.apiTestCases.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  console.log('═══════════════════════════════\n');

  const response = interrupt({
    uiTests: state.uiTestCases,
    apiTests: state.apiTestCases,
    qualityScore: state.qualityScore,
    prompt: 'Type APPROVE or provide revision feedback:',
  });

  const feedback = response as string;
  const isApproved = feedback.trim().toUpperCase() === 'APPROVE';
  return {
    approved: isApproved,
    humanFeedback: isApproved ? '' : feedback,
    qualityFeedback: isApproved ? '' : feedback, // use human feedback for next generation
  };
}

function approvalRouter(state: State): string {
  return state.approved ? 'generateTestData' : 'generateUITests';
}

// ── Phase 5: Test data ────────────────────────────────────────────────────

async function generateTestDataNode(state: State) {
  const response = await fastModel.invoke([
    { role: 'system', content: 'Generate 3 realistic test data records as JSON array based on these requirements.' },
    { role: 'user', content: state.clarifiedRequirements },
  ]);
  return { testData: response.content as string };
}

// ── Phase 6: Final report ─────────────────────────────────────────────────

async function finalReportNode(state: State) {
  const lines = [
    '# QA Workflow Output',
    '',
    '## Requirements',
    state.clarifiedRequirements,
    '',
    `## Test Cases (Quality: ${state.qualityScore}/10)`,
    '',
    `### UI Tests (${state.uiTestCases.length})`,
    ...state.uiTestCases.map((t) => `- ${t}`),
    '',
    `### API Tests (${state.apiTestCases.length})`,
    ...state.apiTestCases.map((t) => `- ${t}`),
    '',
    '## Test Data',
    state.testData,
    '',
    `---`,
    `Generated with ${state.generationCount} AI generation attempt(s).`,
    `Human approved: ${state.approved ? 'Yes' : 'No'}`,
  ];
  return {
    finalReport: lines.join('\n'),
    status: 'complete',
  };
}

// Build the graph
const graph = new StateGraph(WorkflowState)
  .addNode('clarifyRequirements', clarifyRequirementsNode)
  .addNode('generateUITests', generateUITestsNode)
  .addNode('generateAPITests', generateAPITestsNode)
  .addNode('qualityGate', qualityGateNode)
  .addNode('humanApproval', humanApprovalNode)
  .addNode('generateTestData', generateTestDataNode)
  .addNode('finalReport', finalReportNode)
  .addEdge('__start__', 'clarifyRequirements')
  .addConditionalEdges('clarifyRequirements', clarificationRouter, {
    clarifyRequirements: 'clarifyRequirements',
    generateUITests: 'generateUITests',
  })
  // Fan-out: both test generators run in parallel
  .addEdge('generateUITests', 'generateAPITests') // sequential for simplicity here
  .addEdge('generateAPITests', 'qualityGate')
  .addConditionalEdges('qualityGate', qualityRouter, {
    humanApproval: 'humanApproval',
    generateUITests: 'generateUITests',
  })
  .addConditionalEdges('humanApproval', approvalRouter, {
    generateTestData: 'generateTestData',
    generateUITests: 'generateUITests',
  })
  .addEdge('generateTestData', 'finalReport')
  .addEdge('finalReport', END);

const checkpointer = new MemorySaver();
const app = graph.compile({ checkpointer });

// Runner with human-in-the-loop support
async function run(requirements: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (p: string): Promise<string> => new Promise((res) => rl.question(p, res));
  const config = { configurable: { thread_id: `workflow-${Date.now()}` } };

  await app.invoke({ rawRequirements: requirements }, config);

  while (true) {
    const state = await app.getState(config);
    if (state.next.length === 0) break;

    const hasInterrupt = state.tasks.some((t) => (t.interrupts ?? []).length > 0);
    if (!hasInterrupt) break;

    const humanInput = await ask('Your decision: ');
    const { Command } = await import('@langchain/langgraph');
    await app.invoke(new Command({ resume: humanInput }), config);
  }

  const finalState = await app.getState(config);
  console.log('\n' + finalState.values.finalReport);
  rl.close();
}

await run('Users can create a recurring calendar event with custom recurrence rules, reminders, and guest invitations.');
```

---

## Interview Questions

**Beginner**
1. How many distinct "phases" does this workflow have?
2. What triggers the loop from `qualityGate` back to `generateUITests`?

**Intermediate**
3. The state uses `generationCount` with a sum reducer. Why does `qualityRouter` use `>= 3` instead of `=== 3`?
4. When the human rejects and provides feedback, how does that feedback reach the next generation attempt?

**Advanced**
5. You want to add an automated regression: after human approval, run the Playwright tests (from Chapter 10) and only proceed if pass rate is ≥ 95%. If not, loop back. Design the additional nodes, edges, and state fields needed.

---
