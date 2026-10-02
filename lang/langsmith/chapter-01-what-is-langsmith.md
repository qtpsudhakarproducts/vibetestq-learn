# Chapter 1 — What Is LangSmith?

---

## The Problem

You build an AI tool that generates test cases from requirements. You run it in a demo — the output is great. You run it the next day — the output is vague and misses key scenarios. You run it the day after — it is great again.

**You have no idea why it changes. You have no visibility into what the AI is actually doing.**

Without observability, AI tools are black boxes. You cannot debug them. You cannot improve them. You cannot trust them in production.

LangSmith gives you visibility.

---

## What Is LangSmith?

**LangSmith is an observability and evaluation platform for AI applications.**

It records every AI call your application makes — the prompt sent, the response received, the latency, the token usage — and organises them into traces you can inspect, share, and evaluate.

**What this means for testers:** LangSmith is the Allure Report or ReportPortal for your AI tools. Every AI invocation is logged. Every output can be reviewed. Every run can be compared to previous runs.

---

## Four Core Concepts

### 1. Runs
A **run** is one recorded AI operation — one call to an LLM, one chain execution, one tool invocation. Like one test result in your test report.

### 2. Traces
A **trace** is the full tree of runs for one end-to-end invocation of your application. If your app makes 3 LLM calls to process one requirement, those 3 runs are grouped into one trace. Like one test suite in your report.

### 3. Datasets
A **dataset** is a collection of input-output pairs. You use datasets to run evaluations. Like a test data file — but for AI. You give LangSmith: "here are 20 requirements, here are the test cases that should be generated for each."

### 4. Evaluators
An **evaluator** is a function (or another AI) that scores an output. Like a test assertion — but for AI output quality. You can check: "did the AI mention the happy path?", "is the output valid JSON?", "does the test case have preconditions?"

---

## LangSmith vs Your Test Tools

| QA Tool | LangSmith Equivalent |
|---|---|
| Allure Report | Trace viewer |
| ReportPortal | Projects with history |
| Test data files | Datasets |
| Test assertions | Evaluators |
| CI/CD pipeline report | Evaluation runs |
| Defect tracker | Annotation queue |

---

## When Do You Need LangSmith?

- When you want to debug why an AI tool is giving bad output
- When you want to compare two prompts to see which gives better results
- When you want to run automated quality checks on AI output in CI
- When you want to build a history of how AI quality changes over time
- When you want to share AI output with team members for review

---

## What LangSmith Does NOT Do

- It does not run your tests (that is Playwright or Cypress)
- It does not modify your AI code (it only records it)
- It is not a security scanner or data validator
- It does not replace LangChain or LangGraph — it works alongside them

---

## Interview Questions

**Beginner**
1. What is the difference between a Run and a Trace in LangSmith?
2. What QA tool is most similar to LangSmith's trace viewer?

**Intermediate**
3. You have a chain that calls an LLM three times. How would these three calls appear in LangSmith?
4. What is an evaluator, and what does it replace in traditional QA testing?

**Advanced**
5. You want to run A/B testing on two prompt templates to see which produces better test cases. How would you use LangSmith's datasets and evaluators for this?

---
