# Chapter 3 — Understanding Runs and Traces

---

## The Problem

You run your AI test-case generator and go to LangSmith. You see a list of traces. You click one. There is a tree of items — some are green, some are yellow, some have numbers next to them. What are you looking at?

This chapter teaches you how to read LangSmith traces like a QA engineer reads a test report.

---

## The Trace Tree

A **trace** is a tree. The root is the outermost operation. The leaves are individual LLM calls.

For a chain that parses requirements, then generates tests, then scores them:

```
trace: generate-test-plan (2.4s, 1,840 tokens)
├── parse-requirements (0.3s, 210 tokens)
│   └── ChatOpenAI (0.3s, 210 tokens)
├── generate-tests (1.6s, 1,200 tokens)
│   └── ChatOpenAI (1.6s, 1,200 tokens)
└── score-tests (0.5s, 430 tokens)
    └── ChatOpenAI (0.5s, 430 tokens)
```

**What this means for testers:** This is your test execution tree. The root is the test suite. Each child is a test. The leaves are assertions.

---

## Reading a Run

Every run has:

| Field | Meaning |
|---|---|
| **Name** | The function or chain name |
| **Status** | Success (green) / Error (red) |
| **Latency** | How long this run took |
| **Tokens** | How many tokens were used (input + output) |
| **Inputs** | What was passed in (the prompt) |
| **Outputs** | What was returned (the response) |
| **Tags** | Custom labels you attached |
| **Metadata** | Custom key-value pairs you attached |

---

## What to Look For

### Checking the prompt

Click any LLM run → click **Inputs** → you see the exact messages array sent to the model. This is the most useful debugging tool in LangSmith.

**Common finding:** "The system prompt is missing the output format instructions" — which explains why the response was not valid JSON.

### Checking the output

Click **Outputs** → you see the raw model response. Compare it to what your parser expected.

### Checking latency

High latency usually means a large prompt or large output. LangSmith shows latency per run, so you can see which LLM call is the bottleneck.

### Spotting errors

Error runs appear in red. Click the run → check the **Error** tab for the full exception message and stack trace.

---

## Adding Custom Metadata

You can attach metadata to runs for better searchability:

```typescript
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableConfig } from '@langchain/core/runnables';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'Generate test cases for: {feature}'],
  ['human', '{feature}'],
]);
const chain = prompt.pipe(model);

// Add metadata and tags to this specific invocation
const config: RunnableConfig = {
  tags: ['qa', 'test-generation', 'sprint-42'],
  metadata: {
    feature: 'password-reset',
    engineer: 'alice',
    jiraTicket: 'QA-1234',
  },
};

const response = await chain.invoke({ feature: 'User can reset their password.' }, config);
console.log(response.content);
```

In LangSmith you can now **filter traces by tag** (`qa`, `test-generation`) or **search by metadata** (`jiraTicket: QA-1234`).

---

## Filtering Traces

In the LangSmith UI, use the filter panel to find traces by:
- **Status** — show only error runs
- **Tags** — show only runs tagged `sprint-42`
- **Date range** — show only today's runs
- **Run name** — search for a specific function
- **Latency** — find slow runs (e.g., > 5 seconds)

**What this means for testers:** This is your test filter panel. Use it to isolate failures, find slow tests, or review a specific sprint's AI activity.

---

## Sharing Traces

Every trace has a shareable URL. In LangSmith:
1. Click a trace
2. Click **Share** (top right)
3. Copy the public URL

Share with team members so they can see exactly what the AI was asked and what it responded — without needing access to your codebase.

---

## Comparing Runs

LangSmith lets you compare two runs side-by-side:
1. Select two traces using the checkboxes
2. Click **Compare**
3. See: differences in inputs, outputs, latency, and tokens

Use this to compare the output of prompt version A vs prompt version B.

---

## Interview Questions

**Beginner**
1. What information is shown for every run in a LangSmith trace?
2. How would you find all error runs from last week in your project?

**Intermediate**
3. You want to find all AI calls related to Jira ticket QA-567. What LangSmith feature allows this, and what code change is required?
4. A run is red (error). Where in LangSmith do you see the full error message?

**Advanced**
5. You notice that one node in a LangGraph workflow consistently takes 3× longer than the others. How would you use LangSmith to pinpoint the bottleneck, and what changes might you make?

---
