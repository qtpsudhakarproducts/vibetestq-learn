# Appendix B — Glossary

---

## Core LangChain Concepts

**Agent**
A chain that uses an LLM to decide which tools to call and in what order. Unlike a chain (which follows a fixed sequence), an agent reasons about the goal and dynamically selects actions. Powered by the ReAct loop: Thought → Action → Observation.

**AIMessage**
A message from the AI model. One of three message types in a chat conversation. The model's responses are `AIMessage` objects. See also: `HumanMessage`, `SystemMessage`.

**Chain**
A sequence of steps connected with the pipe operator (`|`). Each step takes input and passes its output to the next step. Steps can be prompts, models, parsers, or custom functions wrapped in `RunnableLambda`.

**ChatMessageHistory**
An in-memory store for a conversation's message history. Used with `RunnableWithMessageHistory` to give a chain memory across multiple invocations.

**ChatOpenAI**
The LangChain class that wraps OpenAI's chat models (gpt-4o, gpt-4o-mini, etc.). Swappable with `ChatAnthropic`, `ChatGoogleGenerativeAI`, or `Ollama` by changing the import.

**ChatPromptTemplate**
A reusable prompt with named variables (`{variableName}`) that are filled in at run time. Created with `ChatPromptTemplate.fromMessages([...])`.

**Document**
LangChain's representation of a text chunk. Has two fields: `pageContent` (the text) and `metadata` (source file, page number, etc.).

**Embedding**
A list of numbers (a vector) that represents a piece of text in high-dimensional space. Similar texts have embeddings that are numerically close together. Used by vector stores for semantic search.

**HumanMessage**
A message from the user in a conversation. One of three message types. See also: `AIMessage`, `SystemMessage`.

**LangSmith**
LangChain's observability platform. Records every chain run with prompts, responses, token counts, and timing. Used for debugging, evaluation, and cost monitoring. Enabled via `LANGSMITH_TRACING=true`.

**MessagesPlaceholder**
A placeholder in a prompt template that is replaced with a list of messages at runtime. Used to inject conversation history into prompts.

**OutputParserException**
The error thrown when a structured output parser cannot parse the model's response. Usually means the model returned malformed JSON or ignored format instructions. Fix with `OutputFixingParser` or by improving the prompt.

**Prompt Template**
A reusable prompt with variables. Separates the structure of the prompt from the specific values used in a given run.

**RAG (Retrieval-Augmented Generation)**
A pattern where the AI retrieves relevant documents from a knowledge base before generating an answer. Prevents hallucination by grounding answers in actual documents.

**ReAct**
The reasoning pattern used by agents: **Re**asoning + **Act**ing. The agent thinks about what to do (Thought), takes an action (calls a tool), observes the result, then repeats until the goal is reached.

**Retriever**
An object that searches a vector store and returns relevant documents. Created by calling `.asRetriever()` on a vector store. Configured with `k` (number of results) and optional score thresholds.

**Runnable**
The base interface for all LangChain components. Anything that implements `.invoke()`, `.stream()`, and `.batch()` is a Runnable. Chains are built by connecting Runnables with the pipe operator.

**RunnableLambda**
A wrapper that turns any JavaScript/TypeScript function into a Runnable that can be used in a chain.

**RunnableWithMessageHistory**
A wrapper that adds conversation memory to any chain. Stores messages per session ID using a `ChatMessageHistory`.

**StructuredOutputParser**
A parser that validates AI output against a Zod schema. Use this when you need strongly-typed output with validation. More reliable than `JsonOutputParser` for complex schemas.

**SystemMessage**
The opening instruction to the AI model — sets its role, behaviour, and constraints. One of three message types. Usually the first message in a `ChatPromptTemplate`.

**Tool**
A function the AI can call. Created with the `tool()` helper from `@langchain/core/tools`. Has a name, description, Zod schema for parameters, and an implementation function. Registered with the model using `.bindTools([...])`.

**Vector Store**
A database optimised for similarity search on embeddings. Stores document embeddings and returns the `k` most similar documents to a query embedding. `MemoryVectorStore` is in-memory; Chroma is persistent.

---

## LangGraph Concepts

**StateGraph**
The core LangGraph class. A directed graph where each node processes the current state and returns updates to it. Used to build multi-step workflows and multi-agent systems.

**Node**
A function in a StateGraph that receives the current state and returns a partial state update. Can call LLMs, tools, or run any logic.

**Edge**
A connection between nodes in a StateGraph. Can be unconditional (always go to node B after node A) or conditional (use an AI decision to choose which node to go to next).

**State**
The shared object that flows through a LangGraph. Each node reads from it and returns updates. Defined using `Annotation` with a reducer function that merges updates.

---

## LangSmith Concepts

**Run**
A single execution of a LangChain component (chain, agent, tool call, etc.). LangSmith records every run with inputs, outputs, timing, and token counts.

**Trace**
A tree of runs for one top-level invocation. If a chain calls a model which calls a tool, the trace shows all three runs nested in a hierarchy.

**Dataset**
A collection of input/output pairs used for evaluation. Similar to a test suite — you run your chain against the dataset and measure how well it performs.

**Evaluator**
A function (or LLM call) that scores a chain's output against expected output. Examples: exact match, relevance score, faithfulness check.

---

## General AI/ML Terms

**Context Window**
The maximum amount of text a model can consider at once. If the combined prompt + response exceeds this limit, the model cannot see the beginning of the conversation.

**Hallucination**
When an AI model produces confident-sounding output that is factually wrong or invented. RAG and structured output parsers help reduce hallucination.

**Temperature**
A parameter (0–2) controlling how random the model's output is. Temperature 0 = deterministic (always picks the most likely token). Temperature 1 = normal creativity. For test tools, use temperature 0.

**Token**
The basic unit of text for language models. Roughly 0.75 words per token in English. API costs are measured in tokens. "4 tokens" ≈ "3 words" ≈ "one" to "three syllable" words.

**Vector**
A list of numbers representing something (in this case, a piece of text) in high-dimensional space. Similar things have numerically similar vectors.

**Zero-Shot**
Asking the model to perform a task without giving examples. Most LangChain use cases are zero-shot — you describe the task in the prompt and the model performs it without needing examples.

**Few-Shot**
Providing a few examples of input/output pairs in the prompt so the model learns the pattern from the examples. Useful when zero-shot results are inconsistent.

---
