# Chapter 5 — AI-Assisted POM Methods

---

## The Problem

You have a new feature to test: a complex multi-step checkout flow with 6 pages. Your team needs Page Object Model methods for each step. Writing them manually takes two days. An AI can draft them in minutes — and you review, fix, and merge.

This chapter shows you how to generate POM method drafts from page HTML and test requirements.

---

## Theory: Page Object Methods from HTML

A POM method does two things:
1. Finds an element (locator)
2. Takes an action on it (click, fill, select)

The HTML tells you what elements exist. The test requirement tells you what the method should do. Combined, they give an AI enough context to draft methods that follow your team's conventions.

---

## Step 1 — POM Method Generator

```typescript
// ai/pom-assistant.ts
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

const PomMethodSchema = z.object({
  methods: z.array(
    z.object({
      name: z.string().describe('camelCase method name, starts with a verb (click, fill, select, verify)'),
      signature: z.string().describe('Full TypeScript method signature with return type'),
      body: z.string().describe('Method body — uses getByRole/getByLabel/getByText, awaits actions, includes one assertion'),
    })
  ),
});

type PomMethods = z.infer<typeof PomMethodSchema>;

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
const structuredModel = model.withStructuredOutput(PomMethodSchema);

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a Playwright expert generating Page Object Model methods.

Rules:
- Each method does exactly ONE thing (single responsibility)
- Use getByRole, getByLabel, getByText, getByPlaceholder — not CSS or XPath
- Action methods return Promise<void>
- Verification methods use expect() and return Promise<void>
- Every action method ends with one assertion to verify success
- Method names start with: click, fill, select, verify, navigate
- The page object has access to: this.page (Playwright Page)`,
  ],
  [
    'human',
    `Page: {pageName}
Requirements: {requirements}

HTML:
{html}

Generate POM methods for the requirements listed.`,
  ],
]);

const chain = prompt.pipe(structuredModel);

export async function generatePomMethods(
  pageName: string,
  requirements: string[],
  html: string
): Promise<PomMethods> {
  return await chain.invoke({
    pageName,
    requirements: requirements.join('\n'),
    html: html.slice(0, 5000),
  });
}
```

---

## Step 2 — Generate Methods from Real HTML

```typescript
// scripts/generate-pom.ts
import 'dotenv/config';
import { chromium } from '@playwright/test';
import { generatePomMethods } from '../ai/pom-assistant.js';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://your-app.com/checkout');

// Get HTML from the specific form area
const html = await page.locator('form').innerHTML();
await browser.close();

const requirements = [
  'Fill in shipping address',
  'Select shipping method (standard or express)',
  'Click continue to payment',
  'Verify checkout step heading is visible',
];

const result = await generatePomMethods('CheckoutPage', requirements, html);

for (const method of result.methods) {
  console.log(method.signature);
  console.log(method.body);
  console.log('---');
}
```

---

## Step 3 — Review and Apply the Generated Methods

The AI output is a draft. Before merging:

**Engineer checklist for each generated method:**
- [ ] Locator strategy is semantic (getByRole/getByLabel/getByText)
- [ ] Method does exactly one thing
- [ ] Assertion at the end is correct and meaningful
- [ ] Method name matches your team's naming convention
- [ ] No hardcoded wait times

**Example AI output — review it:**

```typescript
// AI generated this:
async fillShippingAddress(address: string): Promise<void> {
  await this.page.getByLabel('Street Address').fill(address);
  await expect(this.page.getByLabel('Street Address')).toHaveValue(address);
}

// Engineer: this is good, but our convention is separate fields for street/city/state
// Engineer updated version:
async fillShippingStreet(street: string): Promise<void> {
  await this.page.getByLabel('Street Address').fill(street);
  await expect(this.page.getByLabel('Street Address')).toHaveValue(street);
}

async fillShippingCity(city: string): Promise<void> {
  await this.page.getByLabel('City').fill(city);
  await expect(this.page.getByLabel('City')).toHaveValue(city);
}
```

---

## Step 4 — Full Generated Page Object

After review, the methods slot into your class:

```typescript
// pages/checkout.page.ts
import { expect, type Page } from '@playwright/test';

export class CheckoutPage {
  constructor(private page: Page) {}

  // AI-generated and reviewed methods:

  async fillShippingStreet(street: string): Promise<void> {
    await this.page.getByLabel('Street Address').fill(street);
    await expect(this.page.getByLabel('Street Address')).toHaveValue(street);
  }

  async selectShippingMethod(method: 'standard' | 'express'): Promise<void> {
    await this.page.getByLabel(method === 'standard' ? 'Standard Shipping' : 'Express Shipping').check();
    await expect(this.page.getByLabel(method === 'standard' ? 'Standard Shipping' : 'Express Shipping')).toBeChecked();
  }

  async clickContinueToPayment(): Promise<void> {
    await this.page.getByRole('button', { name: 'Continue to Payment' }).click();
    await expect(this.page.getByRole('heading', { name: 'Payment Details' })).toBeVisible();
  }

  async verifyCheckoutStep(stepName: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: stepName })).toBeVisible();
  }
}
```

---

## What This Means for Manual QA

You are the source of the requirements list. The automation engineer feeds your requirements to the AI. The AI drafts the methods. The engineer reviews and fixes. You review the final test to confirm it tests what you specified.

**Your requirements list directly drives what methods get built.** Clear, specific requirements → better AI output.

---

## Interview Questions

**Beginner**
1. Why does each POM method do exactly one thing? What problem does this solve during maintenance?
2. The AI generates method drafts. Why do they still need engineering review before merging?

**Intermediate**
3. The AI generates `fillShippingAddress(address: string)` but your form has separate fields for street, city, state, and ZIP. What does this tell you about the HTML you provided to the AI?
4. How would you modify the `generatePomMethods` prompt to enforce your team's naming conventions (e.g., verification methods must start with `verify`)?

**Advanced**
5. You want to measure the quality of AI-generated POM methods systematically. Design a LangSmith evaluator that checks whether generated methods follow the single-responsibility principle.

---
