# Chapter 2 — Project Setup

---

## The Problem

Before building anything, you need a project structure that keeps AI code separate from Playwright test code. Mixing them leads to a framework no one can maintain six months later.

This chapter gives you the exact setup: folder structure, configuration files, and environment variables.

---

## Step 1 — Initialise the Project

```bash
mkdir ai-playwright-framework
cd ai-playwright-framework
npm init -y
```

---

## Step 2 — Install Dependencies

```bash
# Playwright
npm install --save-dev @playwright/test
npx playwright install chromium

# LangChain + AI
npm install @langchain/core @langchain/openai langchain langsmith @langchain/langgraph

# Utilities
npm install dotenv zod
npm install --save-dev typescript tsx @types/node
```

---

## Step 3 — TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

Save as `tsconfig.json`.

---

## Step 4 — Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-...
LANGCHAIN_API_KEY=ls__...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=ai-playwright-framework
```

Add `.env` to `.gitignore`:

```
.env
node_modules/
dist/
```

---

## Step 5 — Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL ?? 'https://the-internet.herokuapp.com',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

---

## Step 6 — Folder Structure

```
ai-playwright-framework/
├── .env                        ← environment variables (never commit)
├── .gitignore
├── package.json
├── playwright.config.ts
├── tsconfig.json
│
├── ai/                         ← all AI logic lives here
│   ├── data-factory.ts         ← Chapter 3
│   ├── selector-healer.ts      ← Chapter 4
│   ├── pom-assistant.ts        ← Chapter 5
│   ├── test-generator.ts       ← Chapter 6
│   ├── failure-analyser.ts     ← Chapter 7
│   ├── visual-checker.ts       ← Chapter 8
│   └── orchestrator.ts         ← Chapter 9
│
├── pages/                      ← Page Object Models
│   ├── base.page.ts
│   └── login.page.ts
│
├── tests/                      ← Playwright test specs
│   └── login.spec.ts
│
└── scripts/                    ← standalone scripts (not tests)
    └── evaluate.ts             ← Chapter 10
```

**Key principle:** `ai/` and `tests/` never import from each other directly. The `pages/` layer connects them.

---

## Step 7 — Verify the Setup

```typescript
// scripts/verify-setup.ts
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({ model: 'gpt-4o-mini' });
const response = await model.invoke('Say: Setup OK');
console.log(response.content);
```

```bash
npx tsx scripts/verify-setup.ts
# Expected output: Setup OK
```

---

## Step 8 — package.json Scripts

```json
{
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "ai:verify": "tsx scripts/verify-setup.ts",
    "ai:evaluate": "tsx scripts/evaluate.ts",
    "ai:generate-data": "tsx scripts/generate-test-data.ts"
  }
}
```

---

## Interview Questions

**Beginner**
1. Why is the `ai/` folder kept separate from `tests/`?
2. What happens if you commit your `.env` file to GitHub?

**Intermediate**
3. The `playwright.config.ts` reads `BASE_URL` from environment variables. What is the benefit of this over hardcoding the URL?
4. Why is `dotenv/config` imported in `playwright.config.ts` rather than in each individual test file?

**Advanced**
5. Your team wants to run AI-augmented tests in both local development (with tracing disabled) and CI (with tracing enabled). How would you configure the project to support both environments without changing code?

---
