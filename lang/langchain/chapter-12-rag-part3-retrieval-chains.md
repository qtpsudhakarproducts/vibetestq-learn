# Chapter 12 — RAG Part 3: Retrieval Chains

---

## What You Will Learn

- How to wire a vector store retriever into a complete QA question-answering chain
- How to use `createRetrievalChain` and `createStuffDocumentsChain`
- How to include source citations in AI answers
- How to build a complete conversational QA knowledge base assistant
- How to evaluate and improve retrieval quality

---

## 12.1 The Problem

You have your vector store (Chapter 11). You can search it and get relevant chunks back. But the chunks are just text — the AI has not read them yet. Passing them to the AI and getting a coherent answer requires one more step: a retrieval chain.

Without a retrieval chain, the workflow is manual:
```
1. Search vector store → get chunks
2. Paste chunks into a prompt manually
3. Ask the AI the question
4. Read the answer
```

A retrieval chain automates this:
```
Question → retrieve relevant chunks → build prompt → model → answer with sources
```

---

## 12.2 The Two Building Blocks

LangChain provides two functions to build RAG chains:

**`createStuffDocumentsChain`** — Builds a chain that takes a question and a list of documents, stuffs all the documents into the prompt, and generates an answer. The word "stuff" means it literally stuffs all the retrieved documents into the context window.

**`createRetrievalChain`** — Wraps `createStuffDocumentsChain` with automatic retrieval. It takes a retriever and a document chain. When invoked, it automatically retrieves relevant documents and passes them to the document chain.

---

## 12.3 Building the Retrieval Chain

```typescript
import 'dotenv/config';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import {
  createRetrievalChain,
  createStuffDocumentsChain,
} from 'langchain/chains';

// ── Step 1: Build the vector store (from Chapter 11) ──────────────────────

const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });

const docs = [
  new Document({
    pageContent:
      'Password Requirements: Passwords must be at least 8 characters long. ' +
      'They must contain at least one uppercase letter and one number. ' +
      'Special characters are optional but encouraged. ' +
      'Passwords cannot be the same as the previous 3 passwords.',
    metadata: { source: 'requirements/registration.txt' },
  }),
  new Document({
    pageContent:
      'Login Rules: Users log in with email and password. ' +
      'The system locks the account after 5 consecutive failed login attempts. ' +
      'A locked account is automatically unlocked after 30 minutes ' +
      'or can be unlocked by an admin.',
    metadata: { source: 'requirements/login.txt' },
  }),
  new Document({
    pageContent:
      'Checkout Process: Users must be logged in to complete a purchase. ' +
      'Guest checkout is not supported. ' +
      'Payment methods accepted: Visa, Mastercard, American Express. ' +
      'PayPal is not supported.',
    metadata: { source: 'requirements/checkout.txt' },
  }),
  new Document({
    pageContent:
      'Email Validation: Email addresses must follow RFC 5321 format. ' +
      'Each email must be unique in the system. ' +
      'Duplicate registration attempts show a specific error message.',
    metadata: { source: 'requirements/registration.txt' },
  }),
];

const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
const retriever = vectorStore.asRetriever({ k: 3 });

// ── Step 2: Build the prompt ───────────────────────────────────────────────

// {context} — placeholder for retrieved document chunks
// {input}   — the user's question
const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a QA assistant with access to the team's requirements documentation.
    
    Answer questions accurately based on the provided context.
    If the context does not contain enough information to answer, say so clearly.
    Always cite which document your answer comes from.
    
    Context from requirements documents:
    {context}`,
  ],
  ['human', '{input}'],
]);

// ── Step 3: Create the document chain ─────────────────────────────────────

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// This chain: takes documents + question → stuffs docs into prompt → model
const documentChain = await createStuffDocumentsChain({ llm: model, prompt });

// ── Step 4: Create the retrieval chain ────────────────────────────────────

// This chain: takes question → retrieves docs → passes to documentChain
const retrievalChain = await createRetrievalChain({
  combineDocsChain: documentChain,
  retriever,
});

// ── Step 5: Ask questions ──────────────────────────────────────────────────

const result = await retrievalChain.invoke({
  input: 'What happens when a user enters the wrong password 5 times?',
});

console.log('\nAnswer:');
console.log(result.answer);

console.log('\nSource Documents:');
result.context.forEach((doc: Document) => {
  console.log('-', doc.metadata.source);
});
```

**Sample output:**
```
Answer:
According to the login requirements, after 5 consecutive failed login attempts
the account is automatically locked. The account can be unlocked automatically
after 30 minutes or by an admin. [Source: requirements/login.txt]

Source Documents:
- requirements/login.txt
- requirements/registration.txt
```

The answer comes from the actual requirements document. The source is cited. You know exactly where the information came from.

---

## 12.4 Conversational RAG with Memory

The basic retrieval chain is stateless — it does not remember previous questions. For a QA assistant that a tester uses over time, you want it to remember the conversation:

```typescript
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { MessagesPlaceholder } from '@langchain/core/prompts';

// Prompt that includes chat history
const conversationalPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a QA assistant. Answer based on the requirements context below.
    Cite document sources in your answers.
    
    Context:
    {context}`,
  ],
  new MessagesPlaceholder('chat_history'),
  ['human', '{input}'],
]);

const conversationalDocChain = await createStuffDocumentsChain({
  llm: model,
  prompt: conversationalPrompt,
});

const conversationalRetrievalChain = await createRetrievalChain({
  combineDocsChain: conversationalDocChain,
  retriever,
});

// Wrap with memory
const history = new ChatMessageHistory();
const chainWithHistory = new RunnableWithMessageHistory({
  runnable: conversationalRetrievalChain,
  getMessageHistory: () => history,
  inputMessagesKey: 'input',
  historyMessagesKey: 'chat_history',
  outputMessagesKey: 'answer',
});

// Multi-turn conversation
async function ask(question: string): Promise<void> {
  const result = await chainWithHistory.invoke(
    { input: question },
    { configurable: { sessionId: 'qa-session' } },
  );
  console.log(`\nQ: ${question}`);
  console.log(`A: ${result.answer}`);
}

await ask('What are the password requirements?');
await ask('What about account lockout — how does that relate to the password rules?');
await ask('Write 3 test cases covering both topics you just described.');
```

---

## 12.5 Improving Retrieval Quality

If your RAG answers are not accurate, the problem is usually retrieval — the wrong chunks are being returned. Check these things:

**1. Check what is being retrieved:**
```typescript
const query = 'account lockout rules';
const retrieved = await retriever.invoke(query);
retrieved.forEach((doc) => {
  console.log(doc.metadata.source, '|', doc.pageContent.slice(0, 100));
});
```

If the retrieved chunks are irrelevant, the problem is one of:
- Chunk size too small — not enough context per chunk
- Query too vague — try a more specific query
- Not enough documents loaded — missing the relevant source

**2. Increase k:**
```typescript
const retriever = vectorStore.asRetriever({ k: 5 }); // Return top 5 instead of 3
```

More results give the AI more context to work with, but also increase prompt length and cost.

**3. Use a score threshold:**
```typescript
const retriever = vectorStore.asRetriever({
  searchType: 'similarity_score_threshold',
  searchKwargs: { score_threshold: 0.7 },
});
```

Only return chunks with similarity score ≥ 0.7. This prevents low-relevance chunks from polluting the context.

---

## 12.6 Complete QA Knowledge Base Tool

Here is the complete end-to-end tool that your team can use:

```typescript
import 'dotenv/config';
import * as readline from 'readline';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { createRetrievalChain, createStuffDocumentsChain } from 'langchain/chains';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';

// ── Build knowledge base ───────────────────────────────────────────────────

console.log('Loading knowledge base...');

const loader = new DirectoryLoader('requirements', {
  '.txt': (p) => new TextLoader(p),
  '.md': (p) => new TextLoader(p),
});
const rawDocs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 });
const chunks = await splitter.splitDocuments(rawDocs);

const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });
const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
const retriever = vectorStore.asRetriever({ k: 4 });

console.log(`Knowledge base ready: ${chunks.length} chunks from ${rawDocs.length} documents.\n`);

// ── Build the chain ────────────────────────────────────────────────────────

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a QA assistant for this software project. 
    Answer questions based on the provided requirements context.
    Always mention which document/section your answer is based on.
    If the context does not answer the question, say "I don't have that information in the requirements."
    
    Context:
    {context}`,
  ],
  new MessagesPlaceholder('chat_history'),
  ['human', '{input}'],
]);

const docChain = await createStuffDocumentsChain({ llm: model, prompt });
const chain = await createRetrievalChain({ combineDocsChain: docChain, retriever });

const chainWithMemory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: () => new ChatMessageHistory(),
  inputMessagesKey: 'input',
  historyMessagesKey: 'chat_history',
  outputMessagesKey: 'answer',
});

// ── Interactive CLI ────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log('QA Knowledge Base Assistant. Ask anything about the requirements. (type "exit" to quit)\n');

const loop = () => {
  rl.question('You: ', async (input) => {
    if (input.trim().toLowerCase() === 'exit') { rl.close(); return; }
    const result = await chainWithMemory.invoke(
      { input },
      { configurable: { sessionId: 'main' } },
    );
    console.log(`\nAssistant: ${result.answer}\n`);
    loop();
  });
};

loop();
```

---

## 12.7 What This Means for Testers

A retrieval chain is the bridge between your vector store and the AI. Without it, the AI does not know your documents exist. With it, any question a tester asks is automatically matched to relevant requirements chunks and answered with citations.

Chapters 10, 11, and 12 together are the complete RAG pipeline:
- Chapter 10: Load and chunk your documents
- Chapter 11: Embed and store them in a vector store
- Chapter 12: Build the retrieval chain that connects search to answers

This is the foundation of a QA knowledge base assistant, a requirements Q&A tool, and a test gap analyser.

---

## Interview Questions — Chapter 12

**Q1. What does `createStuffDocumentsChain` do?**

It creates a chain that takes two inputs: a question (`input`) and a list of retrieved documents (`context`). It formats all the documents into the prompt's `{context}` placeholder and sends the combined prompt to the model. The word "stuff" reflects that it stuffs all documents into the context window at once. It is the simplest and most common approach when the retrieved chunks fit within the model's context limit.

**Q2. What is the relationship between `createRetrievalChain` and `createStuffDocumentsChain`?**

`createRetrievalChain` is the outer wrapper. It takes a retriever and a document chain. When invoked with a question, it automatically calls the retriever to get relevant documents, then passes those documents and the question to the document chain. `createStuffDocumentsChain` is the inner chain that actually builds the prompt and calls the model. They are separate so you can swap either component independently.

**Q3. How do source citations improve the trustworthiness of RAG answers?**

Citations let users verify the answer. A RAG assistant can confidently say "User accounts are locked after 5 failed attempts [Source: requirements/login.txt]". The tester can open that file and confirm the information is accurate. Without citations, an AI answer is a black box — you cannot tell if it came from your actual requirements or was hallucinated. Citations are especially important in QA where accuracy is non-negotiable.

**Q4. What should you check first when a RAG chain gives a wrong or incomplete answer?**

Check what documents are being retrieved. Log `retriever.invoke(query)` and inspect the chunks. The most common cause of wrong answers is not the model — it is the wrong chunks being returned. Either the relevant document was not loaded, the chunk size split the relevant information across chunk boundaries, or the query is too vague to match the right chunks. Fix the retrieval before changing the prompt.

**Q5. What is the trade-off when increasing `k` (the number of retrieved documents)?**

Higher `k` gives the model more context, reducing the chance that the relevant information was missed. But it also increases prompt length, which increases cost and latency. It can also reduce precision — if too many loosely-related chunks are included, the model may synthesise an answer that blends relevant and irrelevant information. Start with k=3, increase to k=5 only if answers are missing relevant content, and monitor prompt token counts.

---
