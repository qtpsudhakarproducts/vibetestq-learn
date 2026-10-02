# Chapter 4 — Creating Datasets

---

## The Problem

You want to know if your AI test-case generator is actually good. You have a hunch it performs well on login features but poorly on payment flows. You want proof.

To measure AI quality, you need:
1. A set of inputs (requirements)
2. The expected outputs (good test cases)
3. A way to run your AI against all inputs and compare

**This is exactly what a LangSmith dataset is.**

---

## What Is a Dataset?

A **dataset** is a collection of **examples**. Each example has:
- **Inputs** — what you give to your AI (e.g., a requirement)
- **Outputs** (optional) — the expected or reference output (e.g., good test cases)

Datasets are the AI equivalent of a test data file. Instead of `test-data.json` with user records, you have `qa-dataset` with requirement → test-case pairs.

---

## Types of Examples

| Type | Inputs | Outputs | Use for |
|---|---|---|---|
| Input only | ✅ | ❌ | Spot-checking new features |
| Input + reference | ✅ | ✅ | Automated evaluation (compare AI output to reference) |

---

## Creating a Dataset Programmatically

```typescript
import 'dotenv/config';
import { Client } from 'langsmith';

const client = new Client();

// Dataset of requirements → expected test case themes
const examples = [
  {
    inputs: {
      feature: 'User can log in with email and password.',
    },
    outputs: {
      expectedThemes: ['valid credentials', 'invalid password', 'account locked', 'empty fields'],
    },
  },
  {
    inputs: {
      feature: 'User can reset their password via a link sent to their email.',
    },
    outputs: {
      expectedThemes: ['valid email', 'email not found', 'expired link', 'already reset'],
    },
  },
  {
    inputs: {
      feature: 'User can add multiple items to a shopping cart and proceed to checkout.',
    },
    outputs: {
      expectedThemes: ['add item', 'remove item', 'update quantity', 'empty cart', 'max quantity limit'],
    },
  },
  {
    inputs: {
      feature: 'Admin can assign roles to users (viewer, editor, admin).',
    },
    outputs: {
      expectedThemes: ['assign viewer', 'assign editor', 'assign admin', 'remove role', 'cannot self-demote'],
    },
  },
];

// Create dataset (errors if it already exists)
let dataset;
try {
  dataset = await client.createDataset('qa-test-generation-v1', {
    description: 'Requirements for evaluating AI test case generation quality.',
  });
  console.log('Created dataset:', dataset.id);
} catch {
  // Dataset may already exist — find it
  for await (const d of client.listDatasets()) {
    if (d.name === 'qa-test-generation-v1') {
      dataset = d;
      break;
    }
  }
  console.log('Using existing dataset:', dataset?.id);
}

// Add examples to the dataset
await client.createExamples({
  datasetId: dataset!.id,
  inputs: examples.map((e) => e.inputs),
  outputs: examples.map((e) => e.outputs),
});

console.log(`Added ${examples.length} examples to dataset.`);
```

---

## Creating a Dataset from Traces

You can turn good real-world traces into dataset examples. This is the easiest way to build a dataset:

1. Run your AI tool in production for a while
2. In LangSmith, find traces with output you are happy with
3. Click the trace → click **Add to Dataset**
4. Select the dataset, confirm inputs/outputs
5. Repeat for 20-30 good examples

This is called **few-shot dataset building** — you collect real examples and use them as the ground truth for future evaluations.

---

## Creating a Dataset in the UI

1. Go to LangSmith → **Datasets**
2. Click **+ New Dataset**
3. Name it, set type to **kv** (key-value, the default)
4. Click **+ Add Example**
5. Enter inputs as JSON: `{ "feature": "User can log in..." }`
6. Enter outputs as JSON: `{ "expectedThemes": ["valid credentials", ...] }`
7. Save

---

## Viewing and Editing Datasets

In LangSmith → **Datasets** → click your dataset:
- View all examples as a table
- Edit any example
- Add new examples
- Delete examples
- Download as JSON or CSV

---

## Dataset Versioning

LangSmith automatically versions datasets. When you add, edit, or delete examples, the version increments. You can:
- View example history
- Roll back to a previous version
- Compare versions

**What this means for testers:** This is like Git for your test data. You can track how your ground-truth examples change over time.

---

## Interview Questions

**Beginner**
1. What are the two components of every example in a LangSmith dataset?
2. What is the easiest way to build a dataset if you already have a running AI application?

**Intermediate**
3. Your dataset has 50 examples, but you only want to run evaluation against the 10 most recently added. How would you achieve this?
4. Why might you create a dataset with inputs only (no reference outputs)?

**Advanced**
5. You want to maintain one dataset per quarter (Q1-2025, Q2-2025, etc.) to track AI quality over time. Design the dataset naming strategy and the code structure to manage this systematically.

---
