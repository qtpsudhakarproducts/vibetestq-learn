# Chapter 7 — Memory

---

## What You Will Learn

- Why AI models forget everything between calls
- What LangChain Memory is and how it simulates conversation history
- How to build a QA assistant that remembers context across questions
- The different memory types and when to use each
- How to limit memory size to control cost

---

## 7.1 The Problem

You are building a QA assistant. A tester types:

> "What are the main risks in the checkout module?"

The AI gives a good answer. Then the tester types:

> "Can you write test cases for those risks?"

The AI responds as if the previous question never happened. It has no idea what "those risks" refers to. Every AI call starts completely fresh. The previous conversation is invisible to it.

This is not a flaw — it is how AI APIs are designed. The API is **stateless**. Each call is independent. It knows nothing about what happened before.

For a one-shot tool (paste requirements, get test cases), statelessness is fine. For an interactive assistant where the tester builds on previous questions, it is a serious problem.

Memory solves this by collecting conversation history and including it in every new call.

---

## 7.2 How Memory Works — The Core Idea

When you talk to ChatGPT in a browser, it feels like it remembers your conversation. Under the hood, it is not remembering — it is replaying.

Every time you send a new message, ChatGPT sends the entire conversation history along with it:

```
[Your message 1, AI response 1, Your message 2, AI response 2, Your message 3]
```

The AI reads all of it and generates a response that seems aware of the full context. There is no persistent memory. It is just a growing list of messages sent with every call.

LangChain Memory automates this. It stores the conversation history and prepends it to every new call automatically.

---

## 7.3 In-Memory Chat History

The simplest memory type stores the conversation in a JavaScript array. It is lost when the process ends — no database, no persistence.

```typescript
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
const parser = new StringOutputParser();

// ── Step 1: Build a prompt that includes history ───────────────────────────
// MessagesPlaceholder is the slot where history will be inserted.
const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'You are a QA expert assistant. Help QA engineers with test planning, ' +
    'bug analysis, and test case design. Keep answers concise.',
  ],
  new MessagesPlaceholder('history'), // ← conversation history goes here
  ['human', '{question}'],
]);

const chain = prompt.pipe(model).pipe(parser);

// ── Step 2: Create the message store ──────────────────────────────────────
// This stores messages in memory for a given session ID.
const messageHistory = new ChatMessageHistory();

// ── Step 3: Wrap the chain with memory ────────────────────────────────────
const chainWithMemory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: () => messageHistory,
  inputMessagesKey: 'question',
  historyMessagesKey: 'history',
});

// ── Helper to ask a question and print the answer ─────────────────────────
async function ask(question: string): Promise<void> {
  const answer = await chainWithMemory.invoke(
    { question },
    { configurable: { sessionId: 'qa-session-1' } },
  );
  console.log(`\nQ: ${question}`);
  console.log(`A: ${answer}`);
}

// ── Conversation ──────────────────────────────────────────────────────────
await ask('What are the most important areas to test in an e-commerce checkout?');
await ask('What are the top 3 risks you just mentioned?');
await ask('Write one test case for each of those 3 risks.');
```

**Output:**
```
Q: What are the most important areas to test in an e-commerce checkout?
A: The most important areas are: (1) Payment processing — valid and declined cards...
   (2) Order summary accuracy... (3) Address validation... (4) Guest vs logged-in checkout...

Q: What are the top 3 risks you just mentioned?
A: The top 3 risks from my previous response are:
   1. Payment processing failures...
   2. Order summary showing incorrect totals...
   3. Address validation accepting invalid addresses...

Q: Write one test case for each of those 3 risks.
A: Test Case 1 — Payment Processing Failure
   Given: A user on the payment page with a valid cart...
```

The second and third questions reference the first answer. Without memory, the AI would not know what "those risks" meant. With memory, it responds with full context.

---

## 7.4 Session IDs — Supporting Multiple Users

The `sessionId` in `configurable` is a key that identifies which conversation thread to use. Different session IDs maintain separate histories.

This matters when you are building a tool that multiple testers use at the same time. Each tester gets their own session — their questions do not bleed into each other's conversation.

```typescript
const sessions = new Map<string, ChatMessageHistory>();

const chainWithMemory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: (sessionId: string) => {
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, new ChatMessageHistory());
    }
    return sessions.get(sessionId)!;
  },
  inputMessagesKey: 'question',
  historyMessagesKey: 'history',
});

// Tester Alice's session
await chainWithMemory.invoke(
  { question: 'What should I test in the login module?' },
  { configurable: { sessionId: 'alice' } },
);

// Tester Bob's session — independent from Alice's
await chainWithMemory.invoke(
  { question: 'What should I test in the payment module?' },
  { configurable: { sessionId: 'bob' } },
);
```

---

## 7.5 Memory Types

LangChain has several memory strategies. Here are the three most useful for QA tools:

**In-Memory (what you just built)**
Stores all messages in a JavaScript array. Fast, no setup. Cleared when the process ends. Good for: CLI tools, single-session scripts, development.

**Summary Memory**
Instead of storing every message, it periodically asks the AI to summarise the conversation so far. Stores the summary instead of the raw history. Good for: long conversations that would exceed the model's context window.

**Buffer Window Memory**
Only keeps the last N messages. Older messages are dropped. Good for: cost-sensitive tools where you only need recent context.

---

## 7.6 Controlling Memory Size

Every message in history costs tokens. A conversation with 50 exchanges will include all 50 pairs of messages in every subsequent call — even if the early messages are no longer relevant.

**Option 1 — Limit by message count:**

```typescript
import { BufferWindowMemory } from 'langchain/memory';

// Only keep the last 5 exchanges (10 messages: 5 human + 5 AI)
const memory = new BufferWindowMemory({
  k: 5,
  returnMessages: true,
  memoryKey: 'history',
});
```

**Option 2 — Summarise old history:**

This is a more advanced pattern covered in the LangGraph book, where a separate AI call summarises history when it exceeds a threshold. The summary replaces the raw history, keeping token cost bounded even in very long conversations.

---

## 7.7 Building a QA Session Assistant

Here is a complete interactive CLI QA assistant using readline:

```typescript
import 'dotenv/config';
import * as readline from 'readline';
import { ChatOpenAI } from '@langchain/openai';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'You are an expert QA assistant. You help with test planning, test case writing, ' +
    'bug analysis, and exploratory testing. Keep answers practical and concise.',
  ],
  new MessagesPlaceholder('history'),
  ['human', '{question}'],
]);

const chain = prompt.pipe(model).pipe(new StringOutputParser());
const history = new ChatMessageHistory();

const chainWithMemory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: () => history,
  inputMessagesKey: 'question',
  historyMessagesKey: 'history',
});

// Interactive CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('QA Assistant ready. Type your question (or "exit" to quit).\n');

const askQuestion = () => {
  rl.question('You: ', async (input) => {
    const question = input.trim();
    if (question.toLowerCase() === 'exit') {
      rl.close();
      return;
    }
    const answer = await chainWithMemory.invoke(
      { question },
      { configurable: { sessionId: 'qa-session' } },
    );
    console.log(`\nAssistant: ${answer}\n`);
    askQuestion(); // Continue the loop
  });
};

askQuestion();
```

Run this and you have a conversational QA assistant that remembers what you discussed earlier in the same session.

---

## 7.8 What This Means for Testers

Memory is what turns a one-shot AI script into a conversational tool. For manual QA engineers, a memory-enabled assistant can guide an entire testing session — you can ask follow-up questions, request deeper analysis, and reference things the AI said earlier without repeating yourself.

The key insight: you are not storing the AI's "thoughts." You are storing the conversation history as messages, and including those messages in every new call. The AI is always stateless — it just gets more context each time.

---

## Interview Questions — Chapter 7

**Q1. Why are AI API calls stateless by default?**

Because each API call is an independent HTTP request. The server processes the request, returns a response, and forgets everything. There is no session maintained between calls. This is by design — it makes APIs simple, scalable, and predictable. But it means that any context from previous calls must be explicitly included in the next call.

**Q2. How does LangChain Memory simulate a persistent conversation?**

It does not truly persist — it replays. Memory stores the conversation history as a list of messages. On every new call, the history is inserted into the prompt alongside the new question. The AI receives the full conversation history every time, which makes it appear to "remember." As conversations grow longer, more tokens are consumed, which increases cost.

**Q3. What is a session ID and why does it matter?**

A session ID identifies a specific conversation thread. When multiple users interact with the same AI tool, each user needs their own separate history. The session ID is the key that maps a user (or conversation) to their own `ChatMessageHistory` store. Without session IDs, all users share the same history and their conversations become mixed together.

**Q4. What is the trade-off between keeping full message history and using summary memory?**

Full message history preserves every detail but grows indefinitely, consuming more tokens with every call. Summary memory condenses old exchanges into a summary, capping the token cost even for long conversations. The trade-off is detail vs cost: full history is more accurate but expensive; summary memory is cheaper but may lose nuance from early in the conversation.

**Q5. In what QA scenario would memory be essential vs unnecessary?**

Memory is essential for an interactive assistant where a tester asks follow-up questions across a session — "expand on that risk", "write test cases for the third point". Memory is unnecessary for batch tools where every call is independent — "generate test cases for this feature", "analyse this bug report". For batch tools, statelessness is actually desirable: every call is predictable and self-contained.

---
