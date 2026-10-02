# Chapter 3 — LLMs and Chat Models

---

## What You Will Learn

- The difference between an LLM and a Chat Model
- What tokens are and why they matter for cost and performance
- How to configure a model for different QA use cases
- How to send System, Human, and AI messages in the right order
- How to stream responses instead of waiting for the full output
- How to check token usage after a call

---

## 3.1 The Problem

You want to build a tool that helps QA engineers write test summaries after a testing session. You call the AI with a description of what you tested. You get back a well-written summary. You move on.

But sometimes the summary comes back too casual. Sometimes it is too technical. Sometimes it costs three times more than expected because the response is enormous. Sometimes it takes ten seconds when you need it to be fast.

To control these outcomes, you need to understand how AI models actually work from a caller's perspective — not the internal mathematics, but the interface: what you send, what you get back, and how to tune the behaviour.

---

## 3.2 LLMs vs Chat Models — What Is the Difference?

There are two types of models in LangChain:

**LLM (text-in, text-out)**
You send a plain string. You get a plain string back.

```
Input:  "Write a test summary for login testing."
Output: "The login feature was tested across..."
```

**Chat Model (messages-in, message-out)**
You send a list of structured messages. You get a structured message back.

```
Input:  [SystemMessage, HumanMessage]
Output: AIMessage
```

**Which one should you use?**

Always use Chat Models. They are more powerful, more controllable, and every modern AI (GPT-4o, Claude 3.5, Gemini 1.5) is a Chat Model underneath. Plain LLMs are an older pattern that still exists in LangChain for backwards compatibility but should not be used in new code.

The reason Chat Models are better: the message structure lets you separate *instructions* (SystemMessage) from *content* (HumanMessage). This is the difference between telling the AI who it is and what to do with what you give it. You cannot do that cleanly with a plain string.

---

## 3.3 Tokens — The Unit of AI Work

AI models do not process characters or words. They process **tokens**.

A token is a chunk of text — roughly 3–4 characters, or about 0.75 words on average. The exact split depends on the model's tokenizer.

Some examples:
- "test" = 1 token
- "automated" = 2 tokens (automat + ed)
- "Given-When-Then" = 5 tokens

**Why tokens matter:**

1. **Cost** — OpenAI charges per token. A response with 500 tokens costs roughly 10× more than a response with 50 tokens.
2. **Context window** — Every model has a maximum number of tokens it can process in one call (input + output combined). GPT-4o's limit is 128,000 tokens — about 100,000 words. If you send a 200-page test document, it might not fit.
3. **Speed** — Generating more tokens takes more time. A 50-word response arrives faster than a 500-word response.

**The practical rule:** Be specific in your prompts. A vague prompt produces a long, padded response. A precise prompt produces a short, useful response. Short responses are faster and cheaper.

---

## 3.4 Model Configuration Options

When you create a `ChatOpenAI`, you can pass several configuration options.

```typescript
const model = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0,
  maxTokens: 500,
  timeout: 10000,
});
```

**Option by option:**

**`model`** — Which AI model to use.

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| `gpt-4o` | Medium | Medium | Most QA tasks — good balance |
| `gpt-4o-mini` | Fast | Low | High-volume tasks like test data gen |
| `gpt-4-turbo` | Slow | High | Complex analysis requiring depth |

**`temperature`** — How consistent the responses are.

| Value | Behaviour | Use For |
|-------|-----------|---------|
| `0` | Fully deterministic | Test tools, structured output, assertions |
| `0.3–0.7` | Slightly varied | Test case ideation, creative edge cases |
| `1.0+` | Highly varied | Brainstorming, exploratory scenarios |

**`maxTokens`** — Maximum tokens in the response. Prevents unexpectedly long (expensive) outputs.

**`timeout`** — How long to wait (in milliseconds) before giving up. Useful in CI pipelines where a hanging AI call should fail fast.

---

## 3.5 Sending Messages — The Full Pattern

Messages are sent as an array. The order matters.

**Message types:**

| Type | Class | Purpose |
|------|-------|---------|
| System | `SystemMessage` | Defines the AI's role and behaviour |
| Human | `HumanMessage` | The user's question or content |
| AI | `AIMessage` | A previous AI response (used for conversation history) |

**The standard pattern for a single call:**

```typescript
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

const response = await model.invoke([
  new SystemMessage(
    'You are a QA expert. Write concise, professional test summaries. ' +
    'Use plain English. Avoid jargon. Maximum 100 words.'
  ),
  new HumanMessage(
    'I tested the login feature. I checked valid credentials, ' +
    'invalid password, empty fields, and account lockout after 5 failures.'
  ),
]);

console.log(response.content);
```

**Output:**
```
Login functionality was tested across four scenarios: successful authentication 
with valid credentials, rejection of incorrect passwords, handling of empty 
field submissions, and account lockout enforcement after five consecutive 
failed attempts. All test objectives were addressed. Further regression testing 
is recommended after any changes to the authentication module.
```

The `SystemMessage` acts like a standing instruction to the AI. It shapes every response in this call. The `HumanMessage` is the actual content you want the AI to work with.

Think of `SystemMessage` as your `.eslintrc` — it sets the rules. `HumanMessage` is the code you are asking the linter to review.

---

## 3.6 Streaming Responses

By default, `invoke()` waits for the complete response before returning. For short responses, this is fine. For longer responses (test case generation, full bug reports), waiting 10–15 seconds with no feedback feels broken.

Streaming returns the response word by word as it is generated — exactly like watching ChatGPT type its answer.

```typescript
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// stream() returns an async iterable of chunks.
const stream = await model.stream([
  new SystemMessage('You are a QA expert who writes detailed test cases.'),
  new HumanMessage('Write test cases for a forgot password feature.'),
]);

// Print each chunk as it arrives — no waiting for the full response.
for await (const chunk of stream) {
  process.stdout.write(chunk.content as string);
}

// Print a newline at the end.
process.stdout.write('\n');
```

Use streaming whenever:
- The response will be longer than a few sentences
- You are building a CLI tool that testers interact with in real time
- You want to provide visual feedback that the AI is working

---

## 3.7 Checking Token Usage

After a call, you can inspect how many tokens were used. This is useful for cost tracking in CI pipelines.

```typescript
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

const response = await model.invoke([
  new HumanMessage('List five categories of test cases for an e-commerce checkout.'),
]);

console.log(response.content);
console.log('\n--- Token Usage ---');
console.log('Input tokens: ', response.usage_metadata?.input_tokens);
console.log('Output tokens:', response.usage_metadata?.output_tokens);
console.log('Total tokens: ', response.usage_metadata?.total_tokens);
```

**Output:**
```
1. Happy path — successful purchase with valid payment
2. Payment failure — declined card, expired card
3. Cart edge cases — empty cart, max quantity
4. Address validation — missing fields, invalid postal codes
5. Discount codes — valid, expired, already used

--- Token Usage ---
Input tokens:  18
Output tokens: 52
Total tokens:  70
```

**Cost calculation (approximate for gpt-4o as of 2025):**
- Input: $2.50 per million tokens → 18 tokens = $0.000045
- Output: $10.00 per million tokens → 52 tokens = $0.00052

A tool that runs 100 times per day on responses this size costs under $0.10 per day. Cost only becomes significant when you send large documents or generate very long responses.

---

## 3.8 What This Means for Testers

The model is the foundation of everything you build with LangChain. Every prompt template, chain, agent, and tool eventually calls a model. Understanding how to configure it — temperature, maxTokens, message order — means you can tune any LangChain tool's behaviour without changing the logic.

The most important setting to remember: `temperature: 0` for any tool that produces test artifacts (test cases, bug reports, assertions). You want the same input to always produce the same output. That is what makes AI-assisted testing trustworthy.

---

## Interview Questions — Chapter 3

**Q1. What is the difference between an LLM and a Chat Model in LangChain?**

An LLM takes a plain string as input and returns a plain string. A Chat Model takes a list of structured messages (System, Human, AI) and returns a structured message. Modern AI models like GPT-4o and Claude 3 are all Chat Models. The message structure gives you explicit control over the AI's role (SystemMessage) and the content to process (HumanMessage), which a plain string cannot do cleanly.

**Q2. What is a token and why does it matter for AI API calls?**

A token is a chunk of text processed by the AI model — roughly 0.75 words on average. Tokens matter for three reasons: cost (you are billed per token), context limits (each model has a maximum number of tokens per call), and speed (more tokens take longer to generate). Writing precise prompts reduces token usage, which lowers cost and improves response time.

**Q3. When should you set `temperature: 0` and when would you use a higher value?**

Set `temperature: 0` when you need consistent, repeatable output — test case generation, bug report formatting, selector healing. Use higher values (0.3–0.7) when you want creative variation — brainstorming edge cases, generating diverse test scenarios, exploratory testing guidance. Never use high temperature for tools that generate test artifacts that will be stored or executed, because the output must be predictable.

**Q4. What is the purpose of a `SystemMessage`?**

A SystemMessage contains standing instructions that define the AI's role, constraints, and output format for the entire call. It is processed before all other messages. Think of it as a contract you give the AI before the conversation starts. Example: "You are a QA engineer. Write test cases in Given-When-Then format. Each test case must have a unique ID. Never write test cases that cannot be automated."

**Q5. What is response streaming and when would you use it in a QA tool?**

Streaming returns the AI response as it is generated, token by token, rather than waiting for the complete response. Use it in CLI tools where a QA engineer is waiting for output — generating a full test plan, analyzing a long error log, or writing a regression test suite. Streaming provides immediate visual feedback that the tool is working, which prevents the tool from appearing to hang during long operations.

---
