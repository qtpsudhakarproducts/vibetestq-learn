# Chapter 901 — GenAI Fundamentals for Testers

This chapter teaches test automation engineers what they need to know about
Large Language Models — not as end users, but as engineers who will integrate
AI into their frameworks. Topics include how LLMs work, tokens and context
windows, hallucination, temperature, RAG, and the key mental models that make
every subsequent AI chapter make sense.

---

## Q901.1 — What is a Large Language Model (LLM)?

A Large Language Model is a neural network trained on massive amounts of text.
It learns to predict the next word (or token) in a sequence. By doing this at
enormous scale, it develops capabilities that look like reasoning, coding,
summarising, and question answering.

The key insight: an LLM does not "know" facts the way a database does. It has
learned statistical patterns from text. When it writes a Playwright test, it
is combining patterns it saw in training — TypeScript code, Playwright docs,
test examples — not retrieving a stored answer.

This has two consequences:
1. LLMs are extremely capable across diverse topics
2. LLMs can be confidently wrong — they generate plausible-sounding text even
   when the underlying claim is false (called hallucination)

---

## Q901.2 — What is a token and why does it matter for test automation?

A token is the unit an LLM reads and writes. It is roughly 3–4 characters or
about 0.75 words. LLMs do not process characters or words — they process tokens.

```
"playwright"           → "play" + "wright"        = 2 tokens
"the"                  → "the"                    = 1 token
"authentication"       → "authen" + "tication"    = 2 tokens
"getByRole"            → "get" + "By" + "Role"    = 3 tokens
```

Why tokens matter for automation engineers:

**Cost.** API calls to LLMs are priced per token. Sending a 500-line page object
to an LLM for every test generation call gets expensive fast. Knowing token
counts helps you budget AI features in your framework.

**Context window.** Every LLM has a context window — the maximum number of tokens
it can read and write in one conversation. Claude Sonnet 4.6 has 200,000 tokens.
GPT-4o has 128,000 tokens. When your conversation exceeds the limit, the model
can no longer see earlier messages. For agentic test generation this is critical:
a context window filled with irrelevant files will degrade output quality.

**Output limits.** Most models generate up to 4,000–8,000 output tokens per call.
If you ask for a full test file covering 50 scenarios, you will hit this limit
before the file is complete. Break large generation tasks into smaller calls.

---

## Q901.3 — What is the context window and how do you manage it?

The context window is everything the LLM can see at once — your system prompt,
the conversation history, any files you have pasted, and the response it is
generating.

```
Context window = system prompt + conversation history + files + response

Claude Sonnet 4.6:    200,000 tokens  (~150,000 words)
GPT-4o:               128,000 tokens  (~96,000 words)
Gemini 1.5 Pro:     1,000,000 tokens  (~750,000 words)
```

For test automation agents, context management is a first-class engineering
concern:

**Include only what matters.** If you are generating a test for the Employee
page, include only the Employee page object, the Employee API spec, and the
relevant fixture — not the entire test suite.

**Use SKILL files instead of full files.** A SKILL file with 200 tokens of
instructions about coding standards replaces pasting 3,000-token source files.
This is the key architectural idea behind Playwright CLI SKILLs.

**Summarise long files.** When a source file is too long to fit, extract the
relevant types, method signatures, and constants rather than the full
implementation.

**Monitor token usage in agentic loops.** An AI agent making many tool calls
in a loop will fill the context window quickly. Budget the window: system
instructions + standards file + current file + recent conversation.

---

## Q901.4 — What is hallucination and how do you defend against it in test code?

Hallucination is when an LLM generates content that is plausible but wrong.
In test automation, hallucination most often appears as:

- Invented Playwright methods that do not exist: `page.waitForResponse2()`, `locator.assertText()`
- Wrong method signatures: `getByRole('button', 'Submit')` instead of `getByRole('button', { name: 'Submit' })`
- Invented configuration options in `playwright.config.ts`
- Plausible but incorrect explanations of how Playwright works internally

**Defences:**

1. **Run generated tests immediately.** Hallucinated code fails when executed.
   Do not review code then run later — run first, then review what passes.

2. **Provide correct examples in your prompt.** Few-shot examples showing your
   real code patterns dramatically reduce hallucination by anchoring the model
   to patterns that already work.

3. **Use TypeScript strict mode.** TypeScript type errors catch hallucinated
   method names before the test runs.

4. **Keep a STANDARDS.md file.** An accurate standards file in context keeps
   the model generating real patterns from your framework rather than inventing
   ones it has seen elsewhere.

5. **Never trust generated assertions blindly.** An LLM can write
   `expect(response.status()).toBe(200)` for a call that returns 201. Run
   the test against a real backend and verify it fails when expected.

---

## Q901.5 — What is temperature and how does it affect code generation?

Temperature is a parameter that controls how much randomness an LLM uses when
choosing the next token. It ranges from 0 to 1 (or higher on some models).

**Temperature 0 (deterministic):**
The model always picks the highest-probability next token. Output is consistent
and predictable. The same prompt gives the same output every time.
Use for: generating test code, writing structured output, tasks with one right answer.

**Temperature 0.7 (default, balanced):**
Some randomness is introduced. The model may pick lower-probability tokens,
producing more varied and creative output.
Use for: brainstorming test scenarios, generating test data with variety.

**Temperature 1+ (highly random):**
Output becomes unpredictable and often incoherent for technical tasks.
Rarely useful for automation.

For test generation in production frameworks, use temperature 0 or close to 0.
Consistent, deterministic output is what you want when generating code that must
compile and run correctly.

---

## Q901.6 — What is RAG and how does it apply to test automation?

RAG stands for Retrieval-Augmented Generation. It is the technique of retrieving
relevant documents from a knowledge base and including them in the LLM's context
before asking it to generate output.

Without RAG, an LLM generates code based only on what it learned during training.
It does not know your application's specific page objects, your team's coding
conventions, or your API contracts.

With RAG, you retrieve the relevant page object, the relevant API spec, and the
coding standards file — then include them in the prompt. The LLM generates code
that matches your actual framework.

```
Without RAG:
  Prompt: "Write a test for employee creation"
  → LLM invents a generic test using patterns from training data
  → Code does not match your POM structure

With RAG:
  Retrieval: fetch EmployeePage.ts, employee-api.spec.ts, STANDARDS.md
  Prompt: "Given these files, write a test for employee creation"
  → LLM generates code that uses your actual page object methods
  → Code fits your framework immediately
```

In practice, RAG for test generation means: before calling the LLM API, search
your codebase for the files most relevant to the test you want to generate, and
include their content (or summaries) in the context. Tools like Cursor and
GitHub Copilot do this automatically using vector search over your indexed codebase.

---

## Q901.7 — What is the difference between a model and an agent?

A **model** is the LLM itself — it takes input text and generates output text.
It has no memory between calls and takes no actions in the world on its own.

An **agent** is software that wraps a model in a loop, gives it tools, and lets
it take actions until a goal is achieved.

```
Model alone:
  You: "Write a test for login"
  Model: "Here is the code: ..."
  You: (copy, paste, save, run — all manual)

Agent:
  You: "Write and run a passing test for login"
  Agent: calls model → gets code → writes file → runs test → reads failure
       → calls model again with failure → gets fix → writes file → runs test
       → all passing → reports done
```

The agent loop has four parts:
1. **Perceive** — read current state (file contents, test output, page HTML)
2. **Plan** — decide what action to take next
3. **Act** — call a tool (write file, run command, navigate browser)
4. **Observe** — read the result, update plan

For test automation engineers, agents change what AI can do: from suggesting code
(model) to actually generating, running, and fixing tests (agent).

---

## Q901.8 — What is the difference between standard and reasoning models?

**Standard models** (Claude Sonnet 4.6, GPT-4o, Gemini Flash) generate the next
token immediately using learned patterns. They are fast and cheap. They are
excellent at code generation, explanation, and transformation tasks.

**Reasoning models** (Claude Opus 4.6 with extended thinking, o1, o3) spend
compute time "thinking" before producing output. They generate internal reasoning
steps that are not shown to you, then produce a final answer. They are slower
and more expensive but significantly better at tasks requiring multi-step logic.

When to use each for test automation:

| Task | Recommended model |
|------|------------------|
| Generate a test from a spec | Standard model (fast, accurate enough) |
| Debug a complex flaky test | Reasoning model (deeper analysis) |
| Autocomplete a line of code | Standard model |
| Design a complete framework architecture | Reasoning model |
| Fix a locator that changed | Standard model |
| Diagnose a test that fails only in parallel | Reasoning model |

For CI-integrated test generation where speed and cost matter, use standard
models. For complex debugging or architecture decisions, use reasoning models.

---

## Q901.9 — What are the main model providers and how do they differ for test automation?

| Provider | Model | Strengths for test automation |
|----------|-------|-------------------------------|
| Anthropic | Claude Sonnet 4.6 | Long context (200k), excellent TypeScript, follows instructions precisely |
| OpenAI | GPT-4o | Strong code generation, widely supported in tools |
| Google | Gemini 1.5 Pro | 1M token context, handles very large codebases |
| Meta | Llama 4 | Open source, can run locally (data privacy) |
| DeepSeek | R1 | Strong reasoning, open weights |

For most test automation tasks, Claude Sonnet 4.6 and GPT-4o perform similarly.
The practical differentiation comes from the tooling layer — which model your
IDE integration (Copilot, Cursor) uses by default, and which model offers the
API pricing that fits your automation budget.

---

## Q901.10 — What is a system prompt and why does it matter?

A system prompt is the instruction given to an LLM before the user's message.
It defines the model's role, constraints, and behaviour for the entire conversation.
In automation frameworks that call the LLM API directly, the system prompt is
where you encode your framework standards.

```typescript
// In a self-healing fixture or AI test generator
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  system: `You are a Playwright TypeScript expert working on the OrangeHRM
  test automation framework.

  Framework rules:
  - All page objects extend BasePage
  - Use getByRole first, getByLabel for forms, getByTestId as last resort
  - All async methods return Promise<void>
  - Use TypeScript strict mode
  - Never use page.waitForTimeout() — use expect assertions instead

  When generating tests, always follow these conventions exactly.`,
  messages: [
    { role: 'user', content: prompt }
  ]
});
```

A strong system prompt reduces hallucination by constraining the model to your
specific patterns. Without it, the model generates generic code that may not
match your framework's conventions.

---

## Q901.11 — What is fine-tuning and is it relevant for test automation?

Fine-tuning is the process of continuing to train a pre-trained model on your
own dataset, so it learns your specific patterns, conventions, and domain.

For test automation, fine-tuning would mean training a model on your existing
tests, page objects, and fixture files so it generates code that matches your
framework perfectly without needing a system prompt or examples.

**Is it worth it?** For most teams, no. Fine-tuning requires:
- A large dataset of high-quality examples (hundreds of test files)
- Significant compute cost to run the training
- Re-training whenever your framework conventions change

RAG + strong system prompts + few-shot examples achieve 80–90% of fine-tuning's
benefit at a fraction of the cost and effort. Fine-tuning makes sense only for
very large teams with stable, well-documented frameworks that generate tests at scale.

---

## Q901.12 — What is an embedding and how does it enable semantic code search?

An embedding is a numerical vector — a list of hundreds of numbers — that
represents the meaning of a piece of text. Texts with similar meaning have
similar embeddings (the vectors point in the same direction in high-dimensional
space).

For test automation, embeddings enable semantic search over your codebase:

```
Query: "test that verifies employee leave application"
Embedding of query → [0.23, -0.41, 0.87, ...]

Compare against embeddings of all files in the codebase:
  leave-application.spec.ts     → similarity: 0.94  ← return this
  employee-pom.ts               → similarity: 0.89  ← return this
  login.spec.ts                 → similarity: 0.12  ← skip
  playwright.config.ts          → similarity: 0.08  ← skip
```

This is how Cursor and GitHub Copilot know which files to include when you ask
about a specific test — they embed your query, embed all files, and retrieve
the most similar ones to include in context. The same technique is used in
RAG-based test generation: retrieve the most relevant page objects and specs
before calling the LLM.

---

## Q901.13 — What are the most common ways AI is used in test automation today?

Based on adoption in 2025–2026:

**1. Code generation inside the IDE** — the most common use. GitHub Copilot
or Cursor generates test code as you type. The AI sees your open files and
suggests completions based on your patterns. Saves roughly 30–40% of
typing time on repetitive test code.

**2. Chat-based debugging** — paste a failing test and error message into
Claude or ChatGPT, ask for diagnosis. Particularly useful for decoding
complex Playwright timeout errors, async race conditions, and CI-only failures.

**3. Test generation from specs** — paste a user story or requirements document,
ask the AI to generate test scenarios and then test code. Useful for building
initial coverage on a new feature.

**4. Locator recovery** — when a selector breaks after a UI change, paste the
new HTML and the old locator and ask the AI to suggest the new locator.

**5. Test data generation** — use the AI to generate realistic, varied test data
that matches domain rules, replacing brittle hardcoded strings.

**6. Autonomous agents (emerging)** — agents that write, run, and fix tests in
a loop with minimal human intervention. Still early in 2026 but growing rapidly.

---

## Q901.14 — What data privacy risks exist when using AI tools with test code?

**Risk 1 — Sending production data to public LLMs.**
If your test fixtures contain real customer data — actual emails, real names,
production API keys — and you paste them into ChatGPT or Claude.ai, that data
is sent to the provider's servers. Most consumer AI services retain this data.
Fix: use synthetic test data. Never use real PII in tests.

**Risk 2 — Sending proprietary code to public LLMs.**
Pasting your entire framework codebase into an AI tool sends your IP to an
external server. Some organisations ban this.
Fix: use enterprise agreements with zero data retention (Anthropic, OpenAI both
offer these), or use locally-hosted open-source models (Llama 4) for sensitive code.

**Risk 3 — API keys in prompts.**
If your prompt includes an API key or secret token for context, that secret is
now in the LLM provider's logs.
Fix: replace secrets with placeholders before sending to any AI tool.

**Risk 4 — AI-generated tests leaking data in CI.**
If AI-generated tests log sensitive data they retrieve from the application,
and those logs are sent back to an AI tool for debugging, real data can leak.
Fix: review AI-generated test code before committing. Ensure logging is sanitised.

---

## Q901.15 — In your framework, how do you use GenAI practically?

In our OrangeHRM framework, we use AI at three levels.

**Level 1 — Daily coding.** GitHub Copilot is active in VS Code. It generates
fixture methods, page object actions, and assertion patterns based on our open
files. It saves roughly 30% of typing time on standard test patterns.

**Level 2 — Test generation from specs.** When a new feature ships, we use a
structured prompt with the RCIF framework (Role, Context, Instruction, Format)
to generate the initial test scenarios and the first draft of the test file.
A human reviews and adjusts before committing.

**Level 3 — Debugging.** When a test fails in CI and the error is not obvious,
we paste the test, the error message, and the trace output into Claude and ask
for a diagnosis. This typically cuts debugging time from 30 minutes to 5 minutes.

We do not send production data or API keys to any AI tool. All test data is
synthetic (Faker-generated). Framework code is sent to Claude under an enterprise
agreement with zero data retention.

---

## Chapter Summary

- An LLM predicts the next token based on patterns learned from training data. It generates plausible text — which can be correct or hallucinated.
- A token is ~0.75 words. Context windows have token limits. Manage context by including only relevant files, using SKILL files instead of full codebases, and monitoring usage in agentic loops.
- Hallucination in test code appears as invented methods, wrong signatures, and incorrect configs. Defend with: run code immediately, provide examples, use TypeScript, use STANDARDS.md.
- Temperature 0 gives deterministic output — use it for code generation. Higher temperature gives more variety — use it for brainstorming.
- RAG retrieves relevant files before prompting. This makes AI-generated code match your actual framework instead of generic patterns.
- An agent wraps a model in a perceive-plan-act-observe loop. It can write files, run tests, and fix failures autonomously.
- Standard models: fast, cheap, great for code generation. Reasoning models: slower, better for complex debugging and architecture.
- Data privacy rules: no production data in prompts, no API keys in prompts, use enterprise agreements or local models for sensitive code.
