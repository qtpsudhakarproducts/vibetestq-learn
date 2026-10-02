# LangSmith for QA and Test Automation
## Using TypeScript

---

### About This Book

LangSmith is the observability, evaluation, and dataset management platform for AI applications. Think of it as the combination of your test reporting tool (like Allure or ReportPortal) and your test management system — but for AI.

When your AI generates test cases, analyses failures, or writes Playwright code, you need to know:
- Did the AI understand the prompt correctly?
- Did it produce good output, or did it hallucinate?
- Is it getting better or worse over time?
- Which prompts work best?

LangSmith answers all of these questions.

---

### Who This Book Is For

**Manual QA engineers** — You will learn how to see exactly what your AI tools are doing, evaluate their output quality, and build datasets of good and bad examples for improvement.

**Playwright automation engineers** — You will learn how to trace your AI-augmented Playwright frameworks, run automated evaluations in CI, and measure whether AI-generated tests are actually good.

---

### Prerequisites

- Completed Book 1 (LangChain) or equivalent experience
- TypeScript and Node.js knowledge
- A LangSmith account (free at [smith.langchain.com](https://smith.langchain.com))
- An OpenAI API key

---

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "./dist"
  }
}
```

Install dependencies:
```bash
npm install langsmith @langchain/core @langchain/openai langchain dotenv zod
npm install -D typescript @types/node tsx
```

---

### Table of Contents

| Chapter | Title |
|---|---|
| 1 | What Is LangSmith? |
| 2 | Setting Up Tracing |
| 3 | Understanding Runs and Traces |
| 4 | Creating Datasets |
| 5 | Running Evaluations |
| 6 | Custom Evaluators |
| 7 | Evaluating AI QA Tools |
| 8 | Evaluating Playwright Test Generation |
| 9 | Automated Evaluation in CI |
| 10 | Best Practices |
| Appendix | Troubleshooting LangSmith |

---
