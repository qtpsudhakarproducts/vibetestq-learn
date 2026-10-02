# Chapter 11 — RAG Part 2: Embeddings and Vector Stores

---

## What You Will Learn

- What an embedding is and why it enables semantic search
- How to convert text chunks into vectors using OpenAI embeddings
- How to store vectors in a vector store
- How to search for similar content using a natural language query
- How to persist a vector store so you do not re-embed on every run

---

## 11.1 The Problem

You loaded and split your requirements documents into 300 chunks. Now a tester asks: "What are the rules for password validation?"

How do you find the right chunk? You cannot do a keyword search — the chunk might say "passwords must be at least 8 characters" without ever using the word "rules". A tester might ask "password strength requirements" or "what makes a valid password" and all of these should return the same chunk.

You need **semantic search** — search that understands meaning, not just exact words.

Embeddings and vector stores make this possible.

---

## 11.2 What an Embedding Is — The Coordinates Analogy

An embedding is a list of numbers (a vector) that represents the meaning of a piece of text.

Imagine each sentence lives in a multi-dimensional space. Sentences with similar meaning are positioned close together. Sentences about unrelated topics are far apart.

For example:
- "Password must be at least 8 characters" → vector A
- "Minimum password length is 8 characters" → vector B
- "The checkout button turns blue on hover" → vector C

Vectors A and B are very close in this space (same concept, different words). Vector C is far away (different topic entirely).

When you search for "what is the minimum password length", the AI converts your question into a vector and finds the chunks with the most similar vectors. This is semantic search — finding meaning, not exact words.

---

## 11.3 Creating Embeddings

The `OpenAIEmbeddings` class converts text into vectors using OpenAI's embedding model:

```typescript
import 'dotenv/config';
import { OpenAIEmbeddings } from '@langchain/openai';

const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small', // Fast and cheap embedding model
});

// Convert a single string to a vector
const vector = await embeddings.embedQuery('What are the login requirements?');

console.log(vector.length); // 1536 — a list of 1536 numbers
console.log(vector.slice(0, 5)); // [ 0.012, -0.034, 0.091, ... ]
```

You never use these numbers directly. The vector store uses them internally to compare similarity.

---

## 11.4 In-Memory Vector Store

The simplest vector store keeps everything in memory. Good for development and small document sets (a few hundred chunks):

```typescript
import 'dotenv/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';

const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });

// Your chunks from Chapter 10 — simulate with sample documents here
const docs = [
  new Document({
    pageContent: 'Passwords must be at least 8 characters long and contain one uppercase letter and one number.',
    metadata: { source: 'requirements/registration.txt', topic: 'password' },
  }),
  new Document({
    pageContent: 'Users can log in with email and password. Failed login attempts are locked after 5 tries.',
    metadata: { source: 'requirements/login.txt', topic: 'login' },
  }),
  new Document({
    pageContent: 'The checkout page requires a valid shipping address and payment card details.',
    metadata: { source: 'requirements/checkout.txt', topic: 'checkout' },
  }),
  new Document({
    pageContent: 'Email addresses must be unique across the system. Duplicate emails return a validation error.',
    metadata: { source: 'requirements/registration.txt', topic: 'email' },
  }),
]);

// Create the vector store — this calls the embedding API for each document
const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

console.log('Vector store created with', docs.length, 'documents.');
```

`fromDocuments` makes one embedding API call per document. For large document sets this can be slow and costly. In production you embed once and persist the store (covered in section 11.6).

---

## 11.5 Searching the Vector Store

Once the store is created, you can search it:

```typescript
// Similarity search — returns the top-k most relevant documents
const query = 'what is the minimum password length?';
const results = await vectorStore.similaritySearch(query, 2); // top 2 results

results.forEach((doc, i) => {
  console.log(`\n── Result ${i + 1} ──`);
  console.log('Source:', doc.metadata.source);
  console.log('Content:', doc.pageContent);
});
```

**Output:**
```
── Result 1 ──
Source: requirements/registration.txt
Content: Passwords must be at least 8 characters long and contain one uppercase letter and one number.

── Result 2 ──
Source: requirements/login.txt
Content: Users can log in with email and password. Failed login attempts are locked after 5 tries.
```

The first result is exactly right. The second result is about login — related to password but not directly about password length. In Chapter 12, you will see how to use these results in a prompt to get a focused final answer.

---

## 11.6 Similarity Search with Scores

You can ask the store to return similarity scores alongside results. Scores range from 0 to 1 — higher means more similar:

```typescript
const resultsWithScores = await vectorStore.similaritySearchWithScore(
  'what is the minimum password length?',
  3,
);

resultsWithScores.forEach(([doc, score]) => {
  console.log(`Score: ${score.toFixed(3)} | ${doc.pageContent.slice(0, 60)}...`);
});
```

**Output:**
```
Score: 0.961 | Passwords must be at least 8 characters long and contain...
Score: 0.712 | Users can log in with email and password. Failed login att...
Score: 0.583 | Email addresses must be unique across the system. Duplicate...
```

Use scores to filter out low-relevance results. For QA knowledge base queries, a threshold of 0.7+ typically returns relevant content.

---

## 11.7 Converting to a Retriever

A **Retriever** is a standardised interface for vector store search. It works with LangChain chains and agents:

```typescript
// Create a retriever from the vector store
const retriever = vectorStore.asRetriever({
  k: 3,              // Return top 3 results
  searchType: 'similarity',
});

// Use it directly
const docs = await retriever.invoke('password requirements');
```

Retrievers are used in retrieval chains (Chapter 12). They are the standard way to plug a vector store into a RAG pipeline.

---

## 11.8 Persisting with Chroma — Production Vector Store

`MemoryVectorStore` is lost when the process ends. For a real QA knowledge base, you need persistence. Chroma is an open-source vector database that runs locally:

**Install Chroma:**
```bash
npm install chromadb @langchain/community
```

**Run Chroma server (once):**
```bash
pip install chromadb
chroma run --path ./chroma-db
```

**Use it in your code:**

```typescript
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';

const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });

// First time: create and persist
const vectorStore = await Chroma.fromDocuments(docs, embeddings, {
  collectionName: 'qa-knowledge-base',
  url: 'http://localhost:8000',
});

// Subsequent runs: load existing store (no re-embedding)
const existingStore = new Chroma(embeddings, {
  collectionName: 'qa-knowledge-base',
  url: 'http://localhost:8000',
});
```

Embedding cost is a one-time expense. Once documents are embedded and stored, every search call is free (only the similarity calculation, no AI API call).

---

## 11.9 Full RAG Stage 2 — Load, Embed, Store

Here is the complete pipeline for loading your QA knowledge base and making it searchable:

```typescript
import 'dotenv/config';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

async function buildQAVectorStore(): Promise<MemoryVectorStore> {
  // Stage 1: Load (Chapter 10)
  const loader = new DirectoryLoader('requirements', {
    '.txt': (p) => new TextLoader(p),
    '.md': (p) => new TextLoader(p),
  });
  const rawDocs = await loader.load();
  console.log(`Loaded ${rawDocs.length} documents.`);

  // Stage 1b: Split
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const chunks = await splitter.splitDocuments(rawDocs);
  console.log(`Created ${chunks.length} chunks.`);

  // Stage 2: Embed and store
  const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });
  const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
  console.log('Vector store ready.');

  return vectorStore;
}

// Build the store
const store = await buildQAVectorStore();

// Test it
const results = await store.similaritySearch('password validation rules', 3);
results.forEach((doc) => {
  console.log(`\n[${doc.metadata.source}]`);
  console.log(doc.pageContent);
});
```

---

## 11.10 What This Means for Testers

Embeddings are what make your documents searchable by meaning. The vector store is the index. Once your QA knowledge base is embedded, a tester can ask any natural language question and retrieve the relevant test cases, requirements sections, or bug reports — even if their question uses different words from the document.

This is the foundation of a QA knowledge base assistant: load your team's documents once, embed them, and the AI can answer questions about them in plain English.

---

## Interview Questions — Chapter 11

**Q1. What is an embedding and what does it represent?**

An embedding is a list of numbers (a vector) that represents the semantic meaning of a piece of text. Similar texts produce vectors that are close together in the vector space; dissimilar texts produce vectors that are far apart. The numbers themselves are not human-readable — they are used by the vector store to perform similarity comparisons.

**Q2. Why does semantic search outperform keyword search for QA documentation?**

Keyword search only matches exact words. A tester asking "password strength rules" would not match a document that says "minimum password length requirements" with keyword search. Semantic search converts both to vectors and compares meaning — finding that these phrases are about the same concept even though they share no words. This is critical for QA knowledge bases where the same concept is described in many different ways across documents and test cases.

**Q3. What does `MemoryVectorStore.fromDocuments()` do?**

It takes an array of Documents and an embeddings model. For each document, it calls the embedding API to convert the text into a vector. It stores both the vector and the original document in memory. When you later call `similaritySearch`, it converts your query to a vector and finds the stored documents whose vectors are most similar.

**Q4. What is the difference between a Vector Store and a Retriever?**

A Vector Store is the storage layer — it holds document vectors and exposes search methods. A Retriever is an abstraction over the vector store with a standardised interface (`invoke(query)`) that returns documents. Retrievers are what LangChain chains and agents use — they do not depend on which specific vector store is underneath. You can swap `MemoryVectorStore` for Chroma or Pinecone without changing the chain.

**Q5. When should you embed documents and when should you use an existing embedding?**

Embed documents once — when they are first added to the knowledge base. After embedding, persist the vector store (using Chroma, Pinecone, or similar). On subsequent runs, load the existing store without re-embedding. Re-embedding on every run wastes money and time. Only re-embed when documents change or new documents are added.

---
