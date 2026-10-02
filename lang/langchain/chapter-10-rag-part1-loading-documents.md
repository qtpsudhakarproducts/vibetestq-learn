# Chapter 10 — RAG Part 1: Loading Documents

---

## What You Will Learn

- What RAG is and why it matters for QA teams
- How to load documents from files and URLs
- How to split documents into chunks that AI can process
- Why chunking strategy matters for answer quality
- How to prepare your QA knowledge base for embedding

---

## 10.1 The Problem

Your team has 200 test cases in a Google Doc, 50 bug reports in Markdown files, three requirements PDFs, and six API contracts in JSON. A new tester joins and asks: "What test cases do we have for the payment module?"

The AI cannot answer this. It was trained on public data — it has no knowledge of your team's documents. You cannot paste 200 test cases into a chat prompt (it would exceed the context window and cost a fortune).

You need a way to make the AI aware of your team's documents without retraining it and without pasting everything into every prompt.

That is what RAG does.

---

## 10.2 What RAG Is — The Library Analogy

**RAG stands for Retrieval-Augmented Generation.**

Imagine you are the AI. Someone asks you a question about a topic you are unfamiliar with. Without RAG, you either make something up or admit you do not know. With RAG, you have a library card. Before answering, you go to the library, search for relevant pages, bring those pages back, and use them to form your answer.

The AI never reads the whole library. It just retrieves the relevant pages for each question.

RAG has three stages:
1. **Load** — read your documents from their source (file, URL, database)
2. **Embed** — convert each chunk of text into a vector (a list of numbers that represents meaning)
3. **Retrieve** — when a question comes in, find the chunks most similar to the question and include them in the prompt

This chapter covers Stage 1 — Loading. Chapters 11 and 12 cover Embedding and Retrieval.

---

## 10.3 Document Loaders

LangChain has a `Document` type with two fields:

```typescript
type Document = {
  pageContent: string; // The actual text content
  metadata: Record<string, unknown>; // Source info: filename, page number, URL, etc.
};
```

Document Loaders read from a source and return an array of `Document` objects.

**Text File Loader:**

```typescript
import { TextLoader } from 'langchain/document_loaders/fs/text';

const loader = new TextLoader('requirements/checkout.txt');
const docs = await loader.load();

console.log(docs.length);           // Usually 1 document per file
console.log(docs[0].pageContent);   // The full file text
console.log(docs[0].metadata);      // { source: 'requirements/checkout.txt' }
```

**Directory Loader — Load All Files in a Folder:**

```typescript
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';

const loader = new DirectoryLoader('requirements', {
  '.txt': (path) => new TextLoader(path),
  '.md': (path) => new TextLoader(path),
});

const docs = await loader.load();

console.log(docs.length); // One Document per file
docs.forEach((doc) => {
  console.log(doc.metadata.source); // File path of each document
});
```

**Web Page Loader:**

```typescript
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';

const loader = new CheerioWebBaseLoader(
  'https://playwright.dev/docs/intro',
);

const docs = await loader.load();
console.log(docs[0].pageContent.slice(0, 500)); // First 500 chars of the page
```

---

## 10.4 Text Splitters

A requirements document might be 20,000 words. An AI context window holds 4,000–128,000 tokens. Even if the document fits, you do not want to include the entire thing for every question — it is slow and expensive.

The solution is splitting. You break each document into smaller **chunks** and later retrieve only the chunks relevant to the specific question.

**The challenge:** You cannot split at random positions. A test case split across two chunks — with the steps in chunk 1 and the expected result in chunk 2 — becomes useless. Splits need to happen at natural boundaries (paragraph ends, section headers) and each chunk needs enough context to stand alone.

---

## 10.5 RecursiveCharacterTextSplitter

This is the recommended splitter for most use cases. It tries to split at the largest natural boundary first (double newline = paragraph), then falls back to single newline, then space, then character. This preserves semantic meaning as much as possible.

```typescript
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,     // Target: 500 characters per chunk
  chunkOverlap: 50,   // Each chunk shares 50 chars with the next
});

const text = `
## Checkout — Feature Requirements

Payment Processing
Users can pay with Visa, Mastercard, and American Express.
Cards are validated on submission. Declined cards show a specific error message.
CVV is required for all transactions.

Order Summary
The order summary must show item names, quantities, unit prices, and total.
Shipping cost is shown separately. Tax is itemised.
The total must reflect all discounts applied.

Address Validation
The billing address must match the card on file.
Shipping address can differ from billing address.
Post codes are validated against a real address database.
`;

const chunks = await splitter.splitText(text);
chunks.forEach((chunk, i) => {
  console.log(`\n── Chunk ${i + 1} (${chunk.length} chars) ──`);
  console.log(chunk);
});
```

**Sample Output:**

```
── Chunk 1 (487 chars) ──
## Checkout — Feature Requirements

Payment Processing
Users can pay with Visa, Mastercard, and American Express.
Cards are validated on submission. Declined cards show a specific error message.
CVV is required for all transactions.

Order Summary
The order summary must show item names, quantities, unit prices, and total.

── Chunk 2 (498 chars) ──
The order summary must show item names, quantities, unit prices, and total.
Shipping cost is shown separately. Tax is itemised.
The total must reflect all discounts applied.

Address Validation
The billing address must match the card on file.
...
```

Notice that the last sentence of chunk 1 appears again at the start of chunk 2. That is the overlap. It ensures that if a concept spans a chunk boundary, neither chunk loses the full context.

---

## 10.6 Splitting Documents (Not Just Text)

Most of the time you will load documents and then split them:

```typescript
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const loader = new TextLoader('requirements/checkout.txt');
const rawDocs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

// splitDocuments preserves metadata (source filename) on each chunk
const chunks = await splitter.splitDocuments(rawDocs);

console.log(chunks.length); // Number of chunks produced
chunks.forEach((chunk) => {
  // Each chunk has the original file's metadata
  console.log(chunk.metadata.source); // 'requirements/checkout.txt'
  console.log(chunk.pageContent.length); // ≤ 500 chars
});
```

`splitDocuments` (not `splitText`) is the right method when you have `Document` objects. It preserves the metadata from the original document on every chunk, so when you retrieve a chunk later, you know which file it came from.

---

## 10.7 Loading a Full QA Knowledge Base

Here is a complete loader that reads all requirements and test documents:

```typescript
import 'dotenv/config';
import * as path from 'path';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { Document } from '@langchain/core/documents';

async function loadQAKnowledgeBase(): Promise<Document[]> {
  // Load from multiple folders
  const requirementsLoader = new DirectoryLoader(
    path.join(process.cwd(), 'requirements'),
    { '.txt': (p) => new TextLoader(p), '.md': (p) => new TextLoader(p) },
  );

  const testCasesLoader = new DirectoryLoader(
    path.join(process.cwd(), 'test-cases'),
    { '.txt': (p) => new TextLoader(p), '.md': (p) => new TextLoader(p) },
  );

  // Load all documents
  const [requirementsDocs, testCaseDocs] = await Promise.all([
    requirementsLoader.load(),
    testCasesLoader.load(),
  ]);

  const allDocs = [...requirementsDocs, ...testCaseDocs];
  console.log(`Loaded ${allDocs.length} documents.`);

  // Split into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const chunks = await splitter.splitDocuments(allDocs);
  console.log(`Created ${chunks.length} chunks.`);

  return chunks;
}

const chunks = await loadQAKnowledgeBase();
// These chunks are ready to be embedded and stored — covered in Chapter 11
```

---

## 10.8 Chunking Strategy Tips

| Goal | Setting |
|------|---------|
| Short precise answers | Smaller chunks: 200–300 chars |
| Longer contextual answers | Larger chunks: 800–1500 chars |
| Technical documents with long sentences | More overlap: 100–150 chars |
| Lists or bullet points | Smaller overlap: 20–30 chars |
| Mixed documents | Start at 500 chars / 50 overlap and tune from there |

There is no universally correct chunk size. Test it: ask questions against your retrieval system and see if the answers contain the right information. If answers are too narrow, increase chunk size. If they pull in irrelevant context, decrease it.

---

## 10.9 What This Means for Testers

Document loading is the ingestion stage of your QA knowledge base. Every requirements document, test case file, bug report template, and API contract your team produces can be loaded, split, and made searchable by AI.

The result: an AI assistant that knows your team's specific test coverage, your product's requirements, and your historical bug patterns — not just general knowledge about software testing.

---

## Interview Questions — Chapter 10

**Q1. What does RAG stand for and what problem does it solve?**

RAG stands for Retrieval-Augmented Generation. It solves the problem of the AI not knowing about your team's specific documents. Instead of retraining the model or pasting entire documents into prompts, RAG retrieves only the relevant portions of your documents for each question and includes them in the prompt. The AI answers using your actual content without needing to store it in its weights.

**Q2. What is a Document in LangChain?**

A Document is an object with two fields: `pageContent` (the actual text content) and `metadata` (information about the source — file path, page number, URL, etc.). Document Loaders produce arrays of Documents. Metadata is preserved through splitting and retrieval, so when you get a chunk back, you always know where it came from.

**Q3. Why do documents need to be split into chunks?**

For two reasons: (1) Context window limits — models have a maximum input length, and large documents may exceed it. (2) Relevance — you do not want to include an entire 20,000-word requirements document in every prompt. Splitting lets you retrieve only the 2–3 chunks most relevant to the specific question, keeping prompts focused and cost controlled.

**Q4. What is chunk overlap and why is it used?**

Chunk overlap means each chunk shares some characters with the adjacent chunk. For example, with a 50-character overlap, the last 50 characters of chunk 1 are repeated at the start of chunk 2. This prevents information from being "split away" — if an important sentence falls at a chunk boundary, neither chunk loses it entirely. Overlap ensures retrieval can find the full context even when the exact boundary lands in the middle of a key passage.

**Q5. What is the `RecursiveCharacterTextSplitter` and why is it the recommended choice?**

It tries to split at the most natural boundary first — double newline (paragraph), then single newline, then space, then character — only using a smaller boundary if the larger one would produce a chunk that exceeds `chunkSize`. This preserves semantic units (paragraphs, sentences) much better than splitting at a fixed character count, which could cut in the middle of a word or sentence.

---
