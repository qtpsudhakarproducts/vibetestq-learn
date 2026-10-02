# Chapter 2 — Project Setup

---

## What You Will Learn

- How to create a TypeScript project from scratch for LangChain
- What packages to install and why each one exists
- How to configure TypeScript for LangChain compatibility
- How to store your API key securely
- How to run your first AI call and see the result
- How to swap from OpenAI to another provider in one line

---

## 2.1 The Problem

You have decided to build a test case generator. You open a new terminal and type `npm install langchain`. You get a working `node_modules` folder. You write five lines of code. Nothing works.

This is the reality of getting started with LangChain in TypeScript. The package structure is non-obvious. The TypeScript configuration needs specific settings. The API key needs to be loaded the right way.

This chapter walks through every step. By the end you will have a project that runs successfully and a base you can build on for every chapter that follows.

---

## 2.2 Folder Structure

Your finished project will look like this:

```
langchain-qa/
  src/
    index.ts          ← entry point
  .env                ← API keys (never committed to git)
  .gitignore
  package.json
  tsconfig.json
```

Create this folder and open it in VS Code:

```bash
mkdir langchain-qa
cd langchain-qa
code .
```

---

## 2.3 Initialise the Node.js Project

```bash
npm init -y
```

This creates `package.json`. Open it and set the `type` field to `module`. This tells Node.js you are using ES Modules — the modern import/export syntax that LangChain expects.

```json
{
  "name": "langchain-qa",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts"
  }
}
```

---

## 2.4 Install the Packages

LangChain is split into separate packages. You install only what you need. This keeps your project lean.

```bash
npm install @langchain/core @langchain/openai dotenv
npm install --save-dev typescript tsx @types/node
```

**What each package does:**

| Package | Why You Need It |
|---------|----------------|
| `@langchain/core` | The foundation — base classes for models, prompts, chains, parsers |
| `@langchain/openai` | The OpenAI adapter — connects LangChain to GPT-4o |
| `dotenv` | Loads your API key from a `.env` file into `process.env` |
| `typescript` | The TypeScript compiler |
| `tsx` | Runs TypeScript files directly without compiling first — great for development |
| `@types/node` | TypeScript type definitions for Node.js built-ins |

**Why is LangChain split into packages?**

LangChain used to be one large package called `langchain`. It included adapters for every AI provider (OpenAI, Anthropic, Google, etc.) even if you only used one. The package was enormous. It was slow to install and slow to load.

The new architecture separates the core logic from the provider adapters. `@langchain/core` is the shared foundation. `@langchain/openai` is the OpenAI-specific code. If you switch to Anthropic, you install `@langchain/anthropic` instead and change one line.

---

## 2.5 Configure TypeScript

Create `tsconfig.json` in the project root:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

**The critical settings:**

`"module": "NodeNext"` — This tells TypeScript to use Node.js ES Module resolution. Without this, imports from `@langchain/core` will fail with cryptic errors.

`"moduleResolution": "NodeNext"` — Must match the `module` setting. Without it, TypeScript cannot find the types for LangChain packages.

`"strict": true` — Enables all strict type checks. LangChain's TypeScript types are rich and precise. Strict mode catches mistakes before you run your code.

---

## 2.6 Store Your API Key Safely

Create a file called `.env` in the project root:

```
OPENAI_API_KEY=sk-your-actual-key-here
```

**Never commit this file to Git.** Create a `.gitignore` file:

```
node_modules/
dist/
.env
```

The `.env` file contains a secret. If it reaches a public repository, anyone can use your API key and you will be billed for it.

**Why use a `.env` file instead of hardcoding the key?**

Think of it like a test configuration file. You would never hardcode `https://staging.company.com` directly inside 50 test files — you put it in a config file and read it from there. API keys work the same way. The `.env` file is the config. Your code reads from it.

---

## 2.7 Your First AI Call

Create `src/index.ts`:

```typescript
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

// Step 1: Create the model.
// This object represents your connection to OpenAI.
// It does not make any API call yet.
const model = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0,
});

// Step 2: Send a message and wait for the response.
// invoke() is the standard method to call any LangChain model.
const response = await model.invoke([
  new HumanMessage('List three types of software testing in one sentence each.'),
]);

// Step 3: Print the response.
// response.content is the text the AI returned.
console.log(response.content);
```

Run it:

```bash
npm start
```

You will see something like:

```
1. Unit testing verifies individual functions or components in isolation.
2. Integration testing checks that multiple components work correctly together.
3. End-to-end testing validates entire user workflows from the browser to the database.
```

That is your first LangChain call.

---

## 2.8 Understanding What Just Happened

Let us look at each line in detail.

**`import 'dotenv/config'`**

This loads the `.env` file and puts every key into `process.env`. After this line runs, `process.env.OPENAI_API_KEY` contains your key. LangChain's OpenAI adapter reads it automatically — you do not need to pass it explicitly.

**`new ChatOpenAI({ model: 'gpt-4o', temperature: 0 })`**

This creates a model object. It does not call the API yet. It is like creating a `new APIRequestContext` in Playwright — you are setting up the connection, not making a request.

`temperature: 0` means the AI will give consistent, deterministic answers. Higher values (up to 2) make the AI more creative and varied. For testing tools, you almost always want `0` — you want repeatable results.

**`new HumanMessage(...)`**

LangChain uses a message-based format. `HumanMessage` is a message from the user. There is also `SystemMessage` (instructions that define the AI's role) and `AIMessage` (the AI's previous responses). You will use all three in later chapters.

**`model.invoke([...])`**

`invoke()` sends the messages to the AI and returns the response. It is asynchronous — it returns a Promise. The `await` keyword waits for it to complete before moving to the next line.

**`response.content`**

The response object has many fields. `content` is the actual text the AI generated. In later chapters you will use output parsers to extract structured data from this text instead of reading it as a raw string.

---

## 2.9 Swapping to a Different AI Provider

This is a one-line change. Here is how it works for three common alternatives:

**Anthropic Claude:**

```bash
npm install @langchain/anthropic
```

```typescript
import { ChatAnthropic } from '@langchain/anthropic';

const model = new ChatAnthropic({
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0,
});
```

**Google Gemini:**

```bash
npm install @langchain/google-genai
```

```typescript
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-pro',
  temperature: 0,
});
```

**Local Ollama (no API key required):**

```bash
npm install @langchain/ollama
```

```typescript
import { ChatOllama } from '@langchain/ollama';

const model = new ChatOllama({
  model: 'llama3.2',
  temperature: 0,
});
```

The rest of your code stays identical. The model object has the same `invoke()` method regardless of which provider you use. This is the power of LangChain's abstraction layer — you program against the interface, not the implementation.

---

## 2.10 What This Means for Testers

You now have a working TypeScript project connected to an AI model. Think of this the same way you think about a fresh Playwright project after running `npm init playwright@latest`. The scaffold is in place. Every chapter from here adds one more capability on top of this foundation.

The four files you created (`package.json`, `tsconfig.json`, `.env`, `src/index.ts`) are the same four files every LangChain TypeScript project starts with. Learn this structure once and it applies everywhere.

---

## Interview Questions — Chapter 2

**Q1. Why is LangChain split into multiple packages like `@langchain/core` and `@langchain/openai`?**

To keep projects lean. The old `langchain` package bundled every provider adapter. Even if you only used OpenAI, you downloaded Anthropic, Google, and dozens of other adapters. The new split architecture installs only what you need. `@langchain/core` has the shared logic. Each provider is a separate package. Switching providers is a one-line change.

**Q2. What does `temperature: 0` do on a language model?**

Temperature controls how much randomness the AI adds to its responses. At `0`, the AI always picks the most statistically likely next word — responses are consistent and repeatable. Higher values (up to 2) make responses more varied and creative. For test tools, `0` is almost always the right choice because you want the same input to produce the same output every time.

**Q3. Why should an API key never be hardcoded in source code?**

Because source code is usually committed to version control. If the repository is public — or if a developer accidentally pushes to a public mirror — the key is exposed to anyone on the internet. They can use your key to make API calls that are billed to your account. Storing keys in `.env` files (which are excluded via `.gitignore`) keeps them out of version control.

**Q4. What TypeScript compiler settings are critical for LangChain projects?**

`"module": "NodeNext"` and `"moduleResolution": "NodeNext"` are both required. LangChain packages are published as ES Modules with explicit file extensions in imports. Without `NodeNext` resolution, TypeScript cannot resolve these paths and the project fails to compile or run.

**Q5. What is the difference between `HumanMessage` and `SystemMessage`?**

`HumanMessage` represents a message from the user — the question or instruction you are sending to the AI in a given call. `SystemMessage` represents standing instructions that define the AI's role and behaviour — for example "You are a QA expert who writes test cases in the Given-When-Then format." System messages are processed before human messages and shape how the AI interprets and responds to everything that follows.

---
