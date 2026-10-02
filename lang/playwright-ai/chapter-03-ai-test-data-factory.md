# Chapter 3 — AI Test Data Factory

---

## The Problem

Every Playwright test needs data: usernames, emails, product names, addresses, order IDs. Writing this data manually has two problems:

1. **Too uniform** — tests with `test@example.com` and `John Doe` do not catch edge cases
2. **Too slow** — a new feature needs 50 test data records and someone has to type them

An AI test data factory generates realistic, varied data on demand — for any schema you describe.

---

## Theory: Structured Output for Test Data

You want the AI to return data in a predictable shape, not a paragraph of text. You achieve this with:
- **Zod schema** — defines the exact shape of the output
- **`withStructuredOutput()`** — forces the model to match the schema

Think of it like a form vs a blank page. A form (Zod schema) gets you organised, usable data. A blank page gets you anything.

---

## Step 1 — Define Your Data Schema

```typescript
// ai/data-factory.ts
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

const UserSchema = z.object({
  firstName: z.string().describe('Realistic first name, not "Test" or "User"'),
  lastName: z.string().describe('Realistic last name'),
  email: z.string().email().describe('Valid email address matching the name'),
  password: z.string().min(8).describe('Password with letters and numbers, 8-16 chars'),
  phone: z.string().describe('US phone number format: (555) 123-4567'),
  dateOfBirth: z.string().describe('Date in YYYY-MM-DD format, age 18-70'),
  address: z.object({
    street: z.string().describe('Realistic street address'),
    city: z.string().describe('US city name'),
    state: z.string().length(2).describe('US state abbreviation'),
    zip: z.string().describe('5-digit US ZIP code'),
  }),
});

type User = z.infer<typeof UserSchema>;
```

---

## Step 2 — Build the Generator

```typescript
const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.8 });
// Higher temperature = more variation in generated data

const structuredModel = model.withStructuredOutput(UserSchema);

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `Generate realistic test data for a QA test user.
Rules:
- Use diverse names (different ethnicities, genders)
- Email must match the name (e.g., john.smith → john.smith@...)
- Never use "Test", "Sample", "Fake", or "Example" in names
- Generate a different user every time`,
  ],
  ['human', 'Generate a new test user. Profile type: {profileType}'],
]);

const chain = prompt.pipe(structuredModel);

export async function generateUser(profileType: string = 'standard'): Promise<User> {
  return await chain.invoke({ profileType });
}
```

---

## Step 3 — Generate Multiple Users

```typescript
export async function generateUsers(count: number, profileType: string = 'standard'): Promise<User[]> {
  const promises = Array.from({ length: count }, () => generateUser(profileType));
  return await Promise.all(promises);
}
```

---

## Step 4 — Domain-Specific Data

Different features need different data shapes:

```typescript
const ProductSchema = z.object({
  name: z.string().describe('Realistic product name for an e-commerce store'),
  sku: z.string().describe('SKU format: ABC-12345'),
  price: z.number().positive().describe('Price in USD, 5.00 to 999.99'),
  category: z.enum(['Electronics', 'Clothing', 'Home', 'Books', 'Sports']),
  tags: z.array(z.string()).min(2).max(5).describe('Relevant product tags'),
  inStock: z.boolean(),
});

const OrderSchema = z.object({
  orderId: z.string().describe('Format: ORD-2024-XXXXX'),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  items: z.array(z.object({
    productName: z.string(),
    quantity: z.number().int().min(1).max(10),
    unitPrice: z.number().positive(),
  })).min(1).max(5),
  shippingAddress: z.string().describe('Full address on one line'),
  estimatedDelivery: z.string().describe('Date in YYYY-MM-DD format, 2-7 days from today'),
});
```

---

## Step 5 — Use in Playwright Tests

```typescript
// tests/user-registration.spec.ts
import { test, expect } from '@playwright/test';
import { generateUser } from '../ai/data-factory.js';

test.describe('User Registration', () => {
  test('should register a new user successfully', async ({ page }) => {
    const user = await generateUser('standard');

    await page.goto('/register');
    await page.getByLabel('First Name').fill(user.firstName);
    await page.getByLabel('Last Name').fill(user.lastName);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(`Welcome, ${user.firstName}`)).toBeVisible();
  });

  test('should reject registration with existing email', async ({ page }) => {
    const user = await generateUser('existing-account');
    // ... test with a known-existing email
  });
});
```

---

## Profile Types for Test Scenarios

Profile types guide the AI to generate targeted data:

```typescript
// Different profile types produce different edge case data
const profiles = {
  'standard': 'Regular customer with normal details',
  'edge-case-name': 'User with hyphenated or multi-part name (e.g., Mary-Jane van der Berg)',
  'international': 'User from outside the US with international address',
  'admin': 'Internal admin user with elevated permissions',
  'premium': 'Premium tier user with subscription active',
};
```

---

## Interview Questions

**Beginner**
1. Why is `temperature: 0.8` used for test data generation when most other AI tasks use `temperature: 0`?
2. What does the `.describe()` method on a Zod field do, and why is it important for test data quality?

**Intermediate**
3. Your test data factory generates emails like `john.smith@gmail.com`. The test environment blocks outgoing email. How would you modify the schema to generate only internal test domain emails?
4. `Promise.all()` is used to generate multiple users in parallel. What risk does this introduce, and how would you mitigate it?

**Advanced**
5. You want to ensure generated test data is never identical between test runs. Design an evaluator (using LangSmith) that measures diversity across 10 generated users.

---
