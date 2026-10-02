# Chapter 2 — Setting Up Tracing

---

## The Problem

You have a LangChain application that calls an LLM. You want to see every prompt and response in LangSmith without changing your application code.

LangSmith tracing is designed to be zero-code for LangChain applications. You set three environment variables, and every LLM call is automatically recorded.

---

## Step 1: Create a LangSmith Account

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Sign up (free tier available)
3. Go to **Settings → API Keys**
4. Click **Create API Key**
5. Copy the key — it starts with `ls__`

---

## Step 2: Create a Project

**Projects** in LangSmith organise your traces. Create one per application or feature area.

1. In the LangSmith sidebar, click **Projects**
2. Click **+ New Project**
3. Name it (e.g., `qa-test-generator`)
4. Save

---

## Step 3: Set Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__your_key_here
LANGCHAIN_PROJECT=qa-test-generator
```

**What each variable does:**
- `LANGCHAIN_TRACING_V2=true` — activates tracing
- `LANGCHAIN_API_KEY` — authenticates with LangSmith
- `LANGCHAIN_PROJECT` — the project name in LangSmith UI (created automatically if it does not exist)

---

## Step 4: Run Your Application

No code changes needed for LangChain or LangGraph. Just run:

```typescript
import 'dotenv/config';  // loads .env variables
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

const response = await model.invoke([
  { role: 'system', content: 'Generate 3 test cases for this feature.' },
  { role: 'user', content: 'User can reset their password via email link.' },
]);

console.log(response.content);
```

Go to LangSmith → your project → you will see the trace appear within seconds.

---

## Step 5: Verify Tracing Works

After running your code:

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Click your project
3. You should see one trace entry
4. Click it to see: the prompt sent, the response received, latency, token usage

---

## Programmatic Tracing with `traceable`

For code that does not use LangChain (e.g., plain OpenAI SDK calls or your own functions), use the `traceable` wrapper:

```typescript
import 'dotenv/config';
import { traceable } from 'langsmith/traceable';
import OpenAI from 'openai';

const openai = new OpenAI();

// Wrap any async function with traceable
const generateTestCases = traceable(
  async (feature: string): Promise<string> => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Generate 3 test cases.' },
        { role: 'user', content: feature },
      ],
    });
    return response.choices[0].message.content ?? '';
  },
  { name: 'generate-test-cases', tags: ['qa', 'generation'] }
);

const result = await generateTestCases('User can reset their password via email link.');
console.log(result);
```

The `traceable` wrapper:
- Accepts any async function
- Records input arguments, return value, errors, and latency
- Appears in LangSmith as a named run with optional tags

---

## Nesting Traces

When one traceable function calls another, LangSmith automatically nests them as parent/child runs:

```typescript
const parseRequirements = traceable(
  async (raw: string) => {
    // ... parse
    return { features: ['login', 'logout'] };
  },
  { name: 'parse-requirements' }
);

const generateAllTests = traceable(
  async (raw: string) => {
    const parsed = await parseRequirements(raw);  // child run
    // ... use parsed
    return 'test cases';
  },
  { name: 'generate-all-tests' }  // parent run
);
```

In LangSmith, `generate-all-tests` will show as the parent with `parse-requirements` as a child inside it.

---

## Disabling Tracing

To temporarily disable tracing (e.g., in unit tests):

```bash
LANGCHAIN_TRACING_V2=false
```

Or conditionally:

```typescript
process.env.LANGCHAIN_TRACING_V2 = process.env.CI === 'true' ? 'false' : 'true';
```

---

## Interview Questions

**Beginner**
1. How many environment variables are needed to enable LangSmith tracing in a LangChain app?
2. What is the purpose of `LANGCHAIN_PROJECT`?

**Intermediate**
3. You have a custom function that calls the OpenAI SDK directly (not through LangChain). How do you add it to LangSmith tracing?
4. What is a parent/child run relationship in LangSmith, and when does it occur?

**Advanced**
5. You want to trace only production traffic, not test runs. Where and how would you conditionally enable/disable `LANGCHAIN_TRACING_V2`?

---
