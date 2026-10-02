# Chapter 6 — Chains

---

## What You Will Learn

- What a Chain is and why single AI calls are not enough
- How to connect multiple steps with the pipe operator
- How to build sequential chains that pass data from step to step
- How to build a real QA pipeline: requirements in, test cases out
- How to add non-AI steps (data transformation, validation) into a chain
- How to debug a chain by inspecting intermediate outputs

---

## 6.1 The Problem

You have three separate scripts:

1. One that reads a requirements document and extracts feature descriptions
2. One that takes a feature description and generates test cases
3. One that reviews the generated test cases and identifies gaps

Right now you run them manually, one by one, copy-pasting output between them. If step 2 fails, step 3 never runs. If you want to process 10 features, you repeat the process 10 times.

You need a way to wire these steps together so the output of each step flows automatically into the next — and the whole pipeline runs as one command.

That is what Chains are for.

---

## 6.2 What a Chain Is

**A Chain is a sequence of steps where the output of each step is automatically passed as the input to the next.**

The QA equivalent is a sequential test workflow:

```
Setup → Execute → Assert → Cleanup
```

Each step depends on the previous. If setup fails, execution does not run. If execution fails, assertion does not run. The chain enforces this flow.

In LangChain, a chain might look like:

```
Prompt → Model → Parser → Transform → Prompt → Model → Parser
```

Each arrow is a handoff. The output shape of each step must match the input shape of the next step.

---

## 6.3 The Pipe Operator

You have already seen the pipe operator (`|`) in the previous chapters. Here is a deeper look at what it does.

```typescript
const chain = prompt.pipe(model).pipe(parser);
```

This creates an object called a **Runnable Sequence**. When you call `chain.invoke(input)`:

1. `prompt.invoke(input)` → returns formatted messages
2. `model.invoke(messages)` → returns an `AIMessage`
3. `parser.invoke(aiMessage)` → returns your typed output

Each step receives the output of the previous step. You do not manage this flow manually — the pipe operator wires it up for you.

The pipe operator works on anything that implements the `Runnable` interface. That includes: prompts, models, parsers, custom functions, and chains themselves. This means you can nest chains inside other chains.

---

## 6.4 Adding a Custom Step to a Chain

Not every step in a chain needs to be an AI call. You can insert any TypeScript function by wrapping it with `RunnableLambda`:

```typescript
import { RunnableLambda } from '@langchain/core/runnables';

// A plain TypeScript function that transforms data
const addTimestamp = RunnableLambda.from((input: { content: string }) => {
  return {
    ...input,
    generatedAt: new Date().toISOString(),
    generatedBy: 'LangChain QA Tool v1.0',
  };
});
```

This lets you mix AI steps and non-AI steps in the same chain. Validation, formatting, database writes, and file saving can all be chain steps.

---

## 6.5 A Full QA Pipeline — Requirements In, Test Cases Out

This is the first real tool you will build. It takes a requirements document and produces a structured list of test cases in one pipeline.

**Step 1 — Extract features from the requirements**

```typescript
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser, StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableLambda } from '@langchain/core/runnables';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// ── Step 1: Extract features ───────────────────────────────────────────────

const extractFeaturesPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'You are a QA analyst. Extract testable features from requirements. ' +
    'Return a JSON array of strings. Each string is one feature to test. ' +
    'Return only the JSON array, no other text.',
  ],
  [
    'human',
    'Requirements:\n{requirements}',
  ],
]);

const featureParser = new JsonOutputParser<string[]>();

const extractFeaturesChain = extractFeaturesPrompt
  .pipe(model)
  .pipe(featureParser);
```

**Step 2 — Generate test cases for each feature**

```typescript
// ── Step 2: Generate test cases per feature ────────────────────────────────

const generateTestCasesPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'You are a QA expert. For each feature in the list, generate 2 test cases. ' +
    'Return a JSON array of objects with shape: ' +
    '{ feature: string, id: string, title: string, steps: string[], expected: string }. ' +
    'Return only the JSON array.',
  ],
  [
    'human',
    'Generate test cases for these features:\n{features}',
  ],
]);

type TestCase = {
  feature: string;
  id: string;
  title: string;
  steps: string[];
  expected: string;
};

const testCaseParser = new JsonOutputParser<TestCase[]>();

const generateTestCasesChain = generateTestCasesPrompt
  .pipe(model)
  .pipe(testCaseParser);
```

**Step 3 — Wire them into one pipeline**

```typescript
// ── Step 3: Full pipeline ──────────────────────────────────────────────────

// Transform step: convert the string[] to the format step 2 expects
const formatFeatures = RunnableLambda.from((features: string[]) => ({
  features: features.map((f, i) => `${i + 1}. ${f}`).join('\n'),
}));

// Full pipeline: requirements → features → test cases
const fullPipeline = extractFeaturesChain
  .pipe(formatFeatures)
  .pipe(generateTestCasesChain);

// ── Run it ─────────────────────────────────────────────────────────────────

const requirements = `
  User Registration Module:
  - Users can register with email and password
  - Password must be at least 8 characters with one uppercase and one number
  - Email must be unique in the system
  - Users receive a verification email after registration
  - Unverified accounts cannot log in
`;

const testCases = await fullPipeline.invoke({ requirements });

testCases.forEach((tc) => {
  console.log(`\n[${tc.id}] ${tc.feature} — ${tc.title}`);
  tc.steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
  console.log(`  Expected: ${tc.expected}`);
});
```

**Sample output:**
```
[TC-001] Email Uniqueness — Register with already-used email
  1. Navigate to the registration page
  2. Enter an email address that already exists in the system
  3. Fill in a valid password
  4. Click Register
  Expected: Error message 'Email already in use' is displayed

[TC-002] Email Uniqueness — Register with new unique email
  1. Navigate to the registration page
  2. Enter an email address not in the system
  3. Fill in a valid password meeting all requirements
  4. Click Register
  Expected: Success message is shown and verification email is sent

[TC-003] Password Validation — Register with a weak password
  1. Navigate to the registration page
  2. Enter a valid unique email
  3. Enter a password that is less than 8 characters
  4. Click Register
  Expected: Error message listing unmet password requirements is displayed
...
```

One function call. One set of requirements in. A structured list of typed test cases out.

---

## 6.6 Debugging a Chain

When a chain does not work as expected, you need to see what is happening at each step. Use `verbose: true` on the model:

```typescript
const model = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0,
  verbose: true, // Prints every prompt and response to the console
});
```

Or intercept a step using a debug lambda:

```typescript
const debug = RunnableLambda.from((input: unknown) => {
  console.log('\n── DEBUG ──');
  console.log(JSON.stringify(input, null, 2));
  console.log('──────────\n');
  return input; // Pass through unchanged
});

// Insert between any two steps to inspect the data
const chain = extractFeaturesChain
  .pipe(debug)           // ← inspect what extractFeatures returns
  .pipe(formatFeatures)
  .pipe(generateTestCasesChain);
```

The `debug` lambda does nothing except log the value — it receives the input, prints it, and returns it unchanged so the chain continues normally.

---

## 6.7 What This Means for Testers

A Chain is the difference between a one-off script and a real tool. Single AI calls answer one question. Chains solve multi-step problems — the kind QA engineers deal with every day.

Every meaningful AI testing tool you build will be a chain of at least two steps. The pattern is always:
1. Extract or transform the input
2. Call the AI with a focused prompt
3. Parse the output into structured data
4. (Optional) Process or store the output

Get comfortable building chains. They are the core unit of work in LangChain.

---

## Interview Questions — Chapter 6

**Q1. What is a Chain in LangChain?**

A Chain is a sequence of connected steps where the output of each step is automatically passed as the input to the next. It can include AI model calls, prompt formatting, output parsing, data transformation functions, and external tool calls. Chains are built by connecting Runnable objects with the pipe operator.

**Q2. What does the pipe operator do?**

The pipe operator (`|`) connects two Runnable objects into a sequence. `a.pipe(b)` creates a new Runnable where calling `invoke(input)` runs `a.invoke(input)` and passes the result to `b.invoke(result)`. Multiple pipes create a Runnable Sequence — a single object you invoke once that runs all steps in order.

**Q3. How do you add a non-AI step to a LangChain chain?**

Wrap a TypeScript function with `RunnableLambda.from()`. The function receives the output of the previous step and returns the input for the next step. This lets you include data transformation, validation, formatting, API calls, file reads, and database writes as first-class steps in a chain — not as code running before or after the chain.

**Q4. How do you debug a chain that is not producing the expected output?**

Two techniques: (1) Set `verbose: true` on the model — this prints every prompt and response to the console. (2) Insert a debug `RunnableLambda` between any two steps — a function that logs the intermediate value and returns it unchanged. The debug lambda lets you inspect what one step is producing without changing the chain's logic.

**Q5. What is the practical difference between calling three separate chains vs one pipeline chain?**

Three separate calls require manual data transfer between steps — you run step 1, copy the output, format it, pass it to step 2, copy that output, and so on. A pipeline chain does this automatically. It is also more robust: if the chain fails at step 2, you know exactly where it failed, and you can retry from that point. Three manual calls with no orchestration make it hard to track state, retry intelligently, or report on which step failed.

---
