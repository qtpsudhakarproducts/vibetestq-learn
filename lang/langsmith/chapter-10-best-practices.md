# Chapter 10 — Best Practices

---

## What This Chapter Covers

You have learned how to trace, build datasets, run evaluations, and connect LangSmith to CI. This chapter collects the rules that make all of that sustainable as your team grows and your AI tools evolve.

---

## 1. Dataset Management

### Keep datasets small and high-quality

**Rule:** Twenty representative examples beat one hundred random ones.

Bad: dump every run into a dataset. Good: curate examples that cover failure modes, edge cases, and typical inputs.

```
✓  20 examples: 10 typical, 5 edge cases, 5 previous failures
✗  200 examples: all from one week of logs, mostly similar
```

### Name versions clearly

```typescript
// ✓ Good — version + date communicates history
const datasetName = 'test-case-gen-v2-2024-01';

// ✗ Bad — you have no idea what changed
const datasetName = 'test-cases-new';
```

### Add failures to the dataset

Every time your AI tool fails in production, add that input to the dataset. This prevents regressions:

```typescript
const client = new Client();

// After a failure in production:
await client.createExamples({
  datasetId: dataset.id,
  inputs: [{ requirement: failedInput }],
  outputs: [{ mustCover: expectedKeywords }],
});
```

---

## 2. Experiment Naming

### Always use a prefix that includes context

```typescript
// ✓ Good — includes date and what changed
experimentPrefix: `test-gen-v2-gpt4o-${new Date().toISOString().slice(0, 10)}`

// ✓ Good in CI — includes commit SHA
experimentPrefix: `ci-run-${process.env.GITHUB_SHA?.slice(0, 8) ?? 'local'}`

// ✗ Bad — you can't tell what this experiment was for later
experimentPrefix: 'test'
```

### Never delete experiments

Old experiments are your history. They let you trace exactly when quality changed and what caused it.

---

## 3. Project Organisation

**One LangSmith project per AI tool.** Do not mix traces from different tools in the same project.

```
Projects in LangSmith:
  test-case-generator     ← traces from test case tool only
  bug-classifier          ← traces from bug triage tool only
  playwright-test-gen     ← traces from Playwright codegen tool only
  ci-evaluations          ← evaluation experiment runs
  nightly-evaluations     ← nightly full evaluation runs
```

Set the project per tool at the environment level or per chain:

```typescript
// Option 1: environment variable (set per service)
process.env.LANGCHAIN_PROJECT = 'test-case-generator';

// Option 2: per client call
const client = new Client();
const run = await client.createRun({
  project_name: 'test-case-generator',
  // ...
});
```

---

## 4. Evaluator Design Rules

### Binary vs continuous scores

Use **binary (0 or 1)** when the criterion has a clear pass/fail:
- Does the output contain at least one assertion? → binary
- Is the priority an exact match? → binary

Use **continuous (0.0 to 1.0)** when partial credit makes sense:
- What fraction of required scenarios are covered? → continuous
- How many of the expected keywords are present? → continuous

### Cost of LLM judges

Every LLM judge call costs money and adds latency. Follow these rules:

| Situation | Use |
|---|---|
| Simple check (does it contain X?) | Heuristic evaluator |
| Format check (valid JSON?) | Heuristic evaluator |
| Subjective quality (is it readable?) | LLM judge |
| Semantic correctness (does it actually test the requirement?) | LLM judge |
| LLM judge model | `gpt-4o-mini` (not `gpt-4o`) |

---

## 5. Tracing Security Rules

### Never log PII in traces

```typescript
// ✗ BAD — real user data in trace
await traceable(async (input) => {
  return generateTestCases(input);
}, { name: 'generate-tests' })({ requirement: `Test for user john.doe@company.com...` });

// ✓ GOOD — anonymise before tracing
const sanitisedInput = input.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[EMAIL]');
await generateTestCasesTraceable({ requirement: sanitisedInput });
```

### Use metadata for user context (not the input)

```typescript
const chain = prompt.pipe(model);
await chain.invoke(
  { requirement: sanitisedInput },
  {
    metadata: {
      userId: hashUserId(userId),       // ✓ hashed, not real
      sessionId: sessionId,             // ✓ no PII
      environment: 'production',
    },
  }
);
```

---

## 6. Prompt Iteration Workflow

This is the process every prompt change should follow:

```
1. Identify problem  →  trace shows low scores on specific examples
2. Hypothesis       →  "Adding role context will improve priority detection"
3. New experiment   →  change prompt, run evaluate() with new experimentPrefix
4. Compare          →  open LangSmith, compare experiment scores side by side
5. Decision         →  if new experiment wins, merge the prompt change
6. Update dataset   →  add any newly found edge cases to the dataset
```

---

## 7. The LangSmith Checklist

Before deploying a new AI tool to production:

- [ ] Tracing enabled with `LANGCHAIN_TRACING_V2=true`
- [ ] Project name set (`LANGCHAIN_PROJECT`)
- [ ] All functions wrapped with `traceable` or use LangChain LCEL
- [ ] Dataset created with at least 10 representative examples
- [ ] At least one heuristic evaluator per tool
- [ ] At least one LLM judge evaluator per tool
- [ ] CI evaluation script configured
- [ ] Threshold values documented in code
- [ ] No PII in trace inputs or outputs
- [ ] Experiment naming convention documented for team

---

## Interview Questions

**Beginner**
1. Why is naming your experiment with a commit SHA useful in a CI context?
2. Why should you never log real user email addresses in LangSmith traces?

**Intermediate**
3. You have a test-case generator and a bug classifier. A colleague suggests using one LangSmith project for both. What problems could this cause?
4. Your LLM judge scores are inconsistent — the same input gets 6/10 one day and 8/10 another. What would you change to make scoring more stable?

**Advanced**
5. Six months after building your evaluation system, you realise the dataset no longer reflects the kinds of inputs your tool receives in production. Design a process to keep datasets fresh without growing them indefinitely.

---
