# Chapter 9 — Agents

---

## What You Will Learn

- What an Agent is and how it differs from a Chain
- How the ReAct reasoning loop works
- How to build a QA agent that decides which tools to call and in what order
- How to add memory to an agent so it maintains conversation context
- When to use an Agent vs a Chain

---

## 9.1 The Problem

In Chapter 8, you built tools. In Chapter 6, you built chains. Chains are great when you know the exact sequence of steps in advance:

```
prompt → model → parser → save
```

But what if the task requires different steps depending on the input?

A tester asks: "Review our checkout requirements and identify the top 5 risks."

To answer this well, the AI might need to:
1. List what files are in the requirements folder
2. Read the checkout requirements file
3. Check if there are any related bug reports to reference
4. Analyse everything and produce a risk list

You do not know in advance which files exist or what they contain. A fixed chain cannot adapt. You need something that can look at the situation, decide what to do next, act, observe the result, and decide again.

That is an Agent.

---

## 9.2 How an Agent Thinks — The ReAct Loop

The most common agent pattern is called **ReAct** — short for **Reason + Act**.

The loop looks like this:

```
1. Thought:  "I need to see what files are available"
2. Action:   call list_files(folder: "requirements")
3. Observation: "checkout.txt, registration.txt, payment.txt"
4. Thought:  "I should read the checkout file"
5. Action:   call read_file(filename: "checkout.txt")
6. Observation: "[file contents]"
7. Thought:  "I have enough information to analyse risks"
8. Final Answer: "The top 5 risks are..."
```

The agent repeats the Thought → Action → Observation cycle until it decides it has enough information to give a final answer. You set a maximum number of iterations to prevent infinite loops.

This is similar to how a senior QA engineer approaches an exploratory testing session — they observe, form a hypothesis, test it, observe the result, and continue until they are confident in their findings.

---

## 9.3 Building a QA Agent

```typescript
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// ── Define the tools ───────────────────────────────────────────────────────

const readFile = tool(
  async ({ filename }: { filename: string }) => {
    try {
      return fs.readFileSync(path.join(process.cwd(), filename), 'utf-8');
    } catch {
      return `Error: Cannot read '${filename}'.`;
    }
  },
  {
    name: 'read_file',
    description: 'Reads a file. Use when you need to see the contents of a specific file.',
    schema: z.object({ filename: z.string() }),
  },
);

const listFiles = tool(
  async ({ folder }: { folder: string }) => {
    try {
      const files = fs.readdirSync(path.join(process.cwd(), folder));
      return files.length > 0
        ? `Files: ${files.join(', ')}`
        : `No files found in '${folder}'.`;
    } catch {
      return `Error: Cannot list '${folder}'.`;
    }
  },
  {
    name: 'list_files',
    description: 'Lists files in a folder. Use before reading to know what files exist.',
    schema: z.object({ folder: z.string() }),
  },
);

const saveFile = tool(
  async ({ filename, content }: { filename: string; content: string }) => {
    const filePath = path.join(process.cwd(), 'output', filename);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    return `Saved to output/${filename}`;
  },
  {
    name: 'save_file',
    description: 'Saves content to a file in the output folder.',
    schema: z.object({
      filename: z.string(),
      content: z.string(),
    }),
  },
);

const tools = [readFile, listFiles, saveFile];

// ── Define the agent ───────────────────────────────────────────────────────

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// The agent prompt MUST include these two placeholders:
// {agent_scratchpad} — where the agent's reasoning steps are stored
// {chat_history}     — for memory (empty array if no memory used)
const agentPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a senior QA analyst. Your job is to help QA engineers by:
    - Analysing requirements and identifying testable scenarios
    - Assessing risks in features
    - Writing structured test cases
    
    Use the available tools to read files when asked.
    Always save your output to a file when you produce test cases or a risk report.
    Think step by step before acting.`,
  ],
  new MessagesPlaceholder('chat_history'),
  ['human', '{input}'],
  new MessagesPlaceholder('agent_scratchpad'),
]);

// Create the agent — combines model + tools + prompt
const agent = await createOpenAIFunctionsAgent({
  llm: model,
  tools,
  prompt: agentPrompt,
});

// Wrap in an executor that runs the ReAct loop
const agentExecutor = new AgentExecutor({
  agent,
  tools,
  maxIterations: 10,    // Stop after 10 cycles to prevent runaway loops
  verbose: true,        // Print each thought/action/observation step
});

// ── Run the agent ──────────────────────────────────────────────────────────

const result = await agentExecutor.invoke({
  input: 'List what requirement files we have, then analyse checkout requirements and save a risk report to checkout-risks.md',
  chat_history: [],
});

console.log('\nFinal Answer:');
console.log(result.output);
```

---

## 9.4 What the verbose Output Looks Like

With `verbose: true`, you see every step:

```
[chain/start] [AgentExecutor] Entering...
[llm/start] Calling model...
[llm/end] Model response: tool_call list_files(folder: "requirements")
[tool/start] Calling list_files with: { folder: "requirements" }
[tool/end] Result: "Files: checkout.txt, registration.txt, payment.txt"
[llm/start] Calling model...
[llm/end] Model response: tool_call read_file(filename: "checkout.txt")
[tool/start] Calling read_file with: { filename: "checkout.txt" }
[tool/end] Result: "[file contents...]"
[llm/start] Calling model...
[llm/end] Model response: tool_call save_file(filename: "checkout-risks.md", content: "...")
[tool/start] Calling save_file with: { filename: "checkout-risks.md", content: "..." }
[tool/end] Result: "Saved to output/checkout-risks.md"
[llm/start] Calling model...
[llm/end] Final Answer: "I have analysed the checkout requirements..."
```

This is the full ReAct loop made visible. In production, set `verbose: false`.

---

## 9.5 Adding Memory to an Agent

An agent with memory maintains context across multiple invocations in the same session:

```typescript
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';

const history = new ChatMessageHistory();

const agentWithMemory = new RunnableWithMessageHistory({
  runnable: agentExecutor,
  getMessageHistory: () => history,
  inputMessagesKey: 'input',
  historyMessagesKey: 'chat_history',
});

// First turn
await agentWithMemory.invoke(
  { input: 'Read the checkout requirements and identify the top 3 risks.' },
  { configurable: { sessionId: 'qa-session' } },
);

// Second turn — agent remembers the first conversation
await agentWithMemory.invoke(
  { input: 'Now write one test case for each of those 3 risks.' },
  { configurable: { sessionId: 'qa-session' } },
);
```

---

## 9.6 Agent vs Chain — When to Use Each

| Situation | Use |
|-----------|-----|
| Steps are fixed and known in advance | Chain |
| Steps depend on what was discovered earlier | Agent |
| Output is deterministic and repeatable | Chain |
| Flexible problem-solving with varied inputs | Agent |
| Speed and low cost matter most | Chain |
| Correctness with varying context matters most | Agent |

**The rule of thumb:** If you can draw the flowchart of your process before running it, use a Chain. If the flowchart depends on what the AI finds along the way, use an Agent.

---

## 9.7 What This Means for Testers

An Agent is what turns an AI into an autonomous QA assistant. It can explore your project, find relevant files, read them, analyse them, and save its output — without you managing each step.

However, agents are also more expensive and slower than chains. Each iteration of the ReAct loop is a model call. A 5-step agent uses 5 model calls. Use agents when the flexibility is worth the cost. Use chains for predictable workflows.

---

## Interview Questions — Chapter 9

**Q1. What is the difference between a Chain and an Agent?**

A Chain executes a fixed, pre-defined sequence of steps. An Agent decides what steps to take dynamically based on its observations. Chains are deterministic — the same input always runs the same steps. Agents are flexible — they reason about what to do next, take an action, observe the result, and decide the next step. Chains are faster and cheaper; agents are more capable but use more model calls.

**Q2. Explain the ReAct loop.**

ReAct stands for Reason + Act. The agent alternates between two phases: (1) Reasoning — the model produces a "Thought" about what to do next, then an "Action" — a tool call with specific arguments. (2) Observing — the tool runs and returns an observation. The agent uses the observation to produce the next Thought. The loop continues until the agent produces a "Final Answer" or hits the maximum iteration limit.

**Q3. What does `maxIterations` do and why is it important?**

`maxIterations` limits how many Thought → Action → Observation cycles the agent can run. Without it, a confused agent could loop indefinitely, calling tools repeatedly without reaching a conclusion. Each iteration costs money (one model call per step). Setting a reasonable limit (typically 5–15 depending on task complexity) protects against runaway costs and infinite loops.

**Q4. What is `agent_scratchpad` in the agent prompt?**

`agent_scratchpad` is a placeholder in the agent prompt where the agent's reasoning history is stored during execution. It holds the sequence of thoughts, tool calls, and observations from the current ReAct loop. The model reads the scratchpad to understand what it has already tried and what it has discovered, allowing it to make informed decisions for the next step.

**Q5. When would you prefer a Chain over an Agent for a QA tool?**

When the process is fixed and predictable — for example, "read this requirements file, generate test cases, save to disk." All three steps are known in advance, the order never changes, and no decision-making based on intermediate results is needed. Chains for this are faster (one model call per step), cheaper, and easier to test and debug. Use an agent only when the tool genuinely needs to adapt its approach based on what it discovers.

---
