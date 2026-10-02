# Chapter 7 — Multi-Agent QA Systems

---

## The Problem

Your QA AI tool has grown. You now need it to:
- Parse and clarify requirements (specialist skill)
- Generate test cases for UI testing (different skill)
- Generate test cases for API testing (different skill)
- Review all test cases for quality (another specialist)
- Write the final report (yet another specialist)

One LLM with one prompt cannot do all this well. Each task needs different instructions, different context, and ideally a different prompt optimised for that task.

**The solution: multiple agents, each specialised, coordinated by a supervisor.**

---

## What Is a Multi-Agent System?

**A multi-agent system is a LangGraph where different nodes use different AI agents (or tools) specialised for different tasks.**

The analogy: a QA testing team. You have:
- A business analyst who reads requirements
- A UI tester who writes UI test cases
- An API tester who writes API test cases
- A senior QA lead who reviews everything
- A tech writer who writes the final report

No one person does everything. The manager assigns tasks, collects results, and decides what happens next. That manager is the **supervisor node** in LangGraph.

---

## Two Architectural Patterns

### Pattern 1: Supervisor Architecture
A central supervisor node routes tasks to specialist worker nodes.

```
supervisor → [based on task type] → ui-agent
                                 → api-agent
                                 → db-agent
           ← [collects result] ←
supervisor → [all done?] → YES → review-agent → report
                         → NO  → next specialist
```

### Pattern 2: Pipeline Architecture
Specialist agents run in a fixed sequence, each one building on the previous.

```
requirements-parser → ui-test-generator → api-test-generator → reviewer → reporter
```

Pipeline is simpler. Supervisor is more flexible. In this chapter we build the pipeline, and introduce supervisor patterns in Chapter 11.

---

## Building a Multi-Specialist QA Pipeline

**Problem:** Take a feature description. Route it through four specialist agents: requirements analyst, UI test generator, API test generator, and final reviewer.

```typescript
import 'dotenv/config';
import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

// Each specialist can have different model settings
const fastModel = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
const strongModel = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// State
const MultiAgentState = Annotation.Root({
  featureDescription: Annotation<string>(),
  analysedRequirements: Annotation<string>(),
  uiTestCases: Annotation<string[]>({
    reducer: (_e, u) => u,
    default: () => [],
  }),
  apiTestCases: Annotation<string[]>({
    reducer: (_e, u) => u,
    default: () => [],
  }),
  reviewFeedback: Annotation<string>(),
  overallScore: Annotation<number>(),
  finalReport: Annotation<string>(),
});

type State = typeof MultiAgentState.State;

// ── AGENT 1: Requirements Analyst ──────────────────────────────────────────

async function requirementsAnalystNode(state: State) {
  // Uses fast model — structured analysis is straightforward
  const response = await fastModel.invoke([
    {
      role: 'system',
      content: `You are a requirements analyst. 
Analyse the feature description and output:
1. User goals (what the user wants to achieve)
2. System behaviours (what the system must do)
3. Edge cases (unusual or error scenarios to test)
Keep each section to 2-3 bullet points.`,
    },
    { role: 'user', content: state.featureDescription },
  ]);
  return { analysedRequirements: response.content as string };
}

// ── AGENT 2: UI Test Specialist ─────────────────────────────────────────────

async function uiTestSpecialistNode(state: State) {
  const response = await fastModel.invoke([
    {
      role: 'system',
      content: `You are a UI test specialist. Generate 4 UI test cases as a numbered list.
Each test case must have:
- Title
- Precondition
- Steps (numbered)
- Expected result`,
    },
    {
      role: 'user',
      content: `Feature: ${state.featureDescription}\n\nAnalysis:\n${state.analysedRequirements}`,
    },
  ]);
  const cases = (response.content as string)
    .split('\n')
    .filter((l) => /^\d+\./.test(l))
    .map((l) => l.trim());
  return { uiTestCases: cases };
}

// ── AGENT 3: API Test Specialist ────────────────────────────────────────────

async function apiTestSpecialistNode(state: State) {
  const response = await fastModel.invoke([
    {
      role: 'system',
      content: `You are an API test specialist. Generate 4 API test cases as a numbered list.
Each test case must include: endpoint, method, request body/params, expected status code, expected response.`,
    },
    {
      role: 'user',
      content: `Feature: ${state.featureDescription}\n\nAnalysis:\n${state.analysedRequirements}`,
    },
  ]);
  const cases = (response.content as string)
    .split('\n')
    .filter((l) => /^\d+\./.test(l))
    .map((l) => l.trim());
  return { apiTestCases: cases };
}

// ── AGENT 4: Senior QA Reviewer ─────────────────────────────────────────────

async function reviewerNode(state: State) {
  // Uses strong model — review requires nuanced judgement
  const response = await strongModel.invoke([
    {
      role: 'system',
      content: `You are a senior QA lead reviewing test coverage.
Provide:
SCORE: <1-10>
FEEDBACK: <2-3 sentences on coverage gaps, quality, and suggestions>`,
    },
    {
      role: 'user',
      content: `UI Tests:\n${state.uiTestCases.join('\n')}\n\nAPI Tests:\n${state.apiTestCases.join('\n')}`,
    },
  ]);
  const text = response.content as string;
  const scoreMatch = text.match(/SCORE:\s*([1-9]|10)/i);
  const feedbackMatch = text.match(/FEEDBACK:\s*([\s\S]+)/i);
  return {
    overallScore: scoreMatch ? parseInt(scoreMatch[1]) : 5,
    reviewFeedback: feedbackMatch ? feedbackMatch[1].trim() : text,
  };
}

// ── AGENT 5: Report Writer ───────────────────────────────────────────────────

async function reportWriterNode(state: State) {
  const lines = [
    `# QA Test Report`,
    ``,
    `## Feature`,
    state.featureDescription,
    ``,
    `## Requirements Analysis`,
    state.analysedRequirements,
    ``,
    `## UI Test Cases (${state.uiTestCases.length})`,
    ...state.uiTestCases.map((tc) => `- ${tc}`),
    ``,
    `## API Test Cases (${state.apiTestCases.length})`,
    ...state.apiTestCases.map((tc) => `- ${tc}`),
    ``,
    `## Review Feedback`,
    `**Overall Score:** ${state.overallScore}/10`,
    ``,
    state.reviewFeedback,
    ``,
    `---`,
    `*Generated by Multi-Agent QA Pipeline*`,
  ];
  return { finalReport: lines.join('\n') };
}

// Build the multi-agent graph
const graph = new StateGraph(MultiAgentState)
  .addNode('requirementsAnalyst', requirementsAnalystNode)
  .addNode('uiTestSpecialist', uiTestSpecialistNode)
  .addNode('apiTestSpecialist', apiTestSpecialistNode)
  .addNode('reviewer', reviewerNode)
  .addNode('reportWriter', reportWriterNode)
  .addEdge('__start__', 'requirementsAnalyst')
  .addEdge('requirementsAnalyst', 'uiTestSpecialist')
  .addEdge('uiTestSpecialist', 'apiTestSpecialist')
  .addEdge('apiTestSpecialist', 'reviewer')
  .addEdge('reviewer', 'reportWriter')
  .addEdge('reportWriter', END);

const app = graph.compile();

const result = await app.invoke({
  featureDescription: `Shopping cart checkout: Users can add items to cart, 
apply discount codes, choose shipping method, enter payment details, 
and place an order. Order confirmation is sent by email.`,
});

console.log(result.finalReport);
console.log(`\nOverall Score: ${result.overallScore}/10`);
```

---

## Why Specialists Beat Generalists

| Approach | Problem |
|---|---|
| One agent with one big prompt | Prompt becomes unfocused. Quality drops for each task. |
| Separate specialist agents | Each agent has a tight, focused prompt. Quality is consistently higher. |
| Different models per agent | Use cheap model for simple tasks, powerful model for complex ones. |

---

## What This Means for Manual QA

The five-specialist pipeline above mirrors a real QA team. Each specialist node is a digital team member doing what they are best at. You can:
- Add a new specialist by adding one node
- Swap a specialist's model without touching the others
- Inspect each specialist's output independently in LangSmith traces
- Adjust one specialist's prompt without affecting the others

---

## Interview Questions

**Beginner**
1. What is the difference between a single-agent and a multi-agent LangGraph?
2. In the example, why does the reviewer use `gpt-4o` instead of `gpt-4o-mini`?

**Intermediate**
3. You add a new "Security Test Specialist" node. Where would you place it in the pipeline and what changes to the graph are needed?
4. How does using separate agents improve prompt quality compared to a single agent with a long prompt?

**Advanced**
5. The pipeline above is sequential. Describe how you would restructure it so UI tests and API tests are generated in parallel (hint: Chapter 9 covers this). What state changes would be needed?

---
