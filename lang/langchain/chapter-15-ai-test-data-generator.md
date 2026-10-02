# Chapter 15 — AI Test Data Generator

---

## What You Will Learn

- How to generate realistic test data from TypeScript interface descriptions
- How to produce valid, varied datasets for Playwright fixtures
- How to control data distribution (edge cases, invalid data, realistic values)
- How to save generated data as JSON files ready for `test.use({ ... })`
- How to avoid common pitfalls: duplicate IDs, obviously fake data, boundary violations

---

## 15.1 The Problem

Test data is one of the most time-consuming parts of test automation. You need:

- Users with different roles, countries, and subscription types
- Products with various price ranges, stock levels, and categories
- Orders in all possible states
- Invalid data for negative testing
- Edge-case data for boundary testing

Writing fixtures by hand takes time and produces unrealistic data. Most hand-written test data looks like `user1@test.com`, `Test User`, `1234 Fake Street`. This misses real-world data patterns and edge cases.

The AI Test Data Generator produces realistic, varied datasets on demand.

---

## 15.2 What the Tool Produces

You describe your TypeScript interface, specify how many records you need and what variety you want, and the tool outputs a ready-to-use fixture file:

```typescript
// fixtures/users.ts — AI-generated output
export const testUsers = [
  {
    id: 'usr_8f3k2',
    email: 'amelia.harrison@outlook.com',
    firstName: 'Amelia',
    lastName: 'Harrison',
    role: 'admin',
    country: 'GB',
    subscriptionTier: 'enterprise',
    isVerified: true,
    createdAt: '2023-03-14T09:22:00Z',
  },
  {
    id: 'usr_9m1x7',
    email: 'carlos.vega@gmail.com',
    firstName: 'Carlos',
    lastName: 'Vega',
    role: 'viewer',
    country: 'ES',
    subscriptionTier: 'free',
    isVerified: false,
    createdAt: '2024-11-28T15:44:00Z',
  },
  // ... more records
];
```

---

## 15.3 The Schema and Chain

```typescript
// src/tools/test-data-generator.ts
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.3 });
// Note: temperature 0.3 — slightly creative for data variety,
// but still consistent. Pure 0 would produce repetitive data.

const parser = new JsonOutputParser();

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a test data specialist. Generate realistic, diverse test data.

    Rules:
    - Use realistic names from various cultures (not just Anglo-Saxon names)
    - Use real-looking email patterns (firstname.lastname@domain.tld)
    - Generate unique IDs using short alphanumeric strings
    - Include the distribution types requested (valid, invalid, edge-case)
    - Follow all constraints specified in the interface
    - Return ONLY a valid JSON array. No explanations, no markdown, no code blocks.`,
  ],
  [
    'human',
    `Generate {count} test data records for this TypeScript interface:

    {interfaceDefinition}

    Distribution requested:
    {distribution}

    Additional constraints:
    {constraints}
    
    Return a JSON array of {count} objects matching the interface exactly.`,
  ],
]);

const chain = prompt.pipe(model).pipe(parser);

// ── Types ──────────────────────────────────────────────────────────────────

type DataGenerationRequest = {
  interfaceDefinition: string;
  count: number;
  distribution?: string;
  constraints?: string;
  outputFile?: string;
};

// ── Generator ─────────────────────────────────────────────────────────────

export async function generateTestData(
  request: DataGenerationRequest,
): Promise<unknown[]> {
  const {
    interfaceDefinition,
    count,
    distribution = 'Mix of valid records. Include at least one edge case.',
    constraints = 'None',
  } = request;

  if (count < 1 || count > 100) {
    throw new Error('Count must be between 1 and 100. For larger datasets, call in batches.');
  }

  console.log(`Generating ${count} test data records...`);

  const result = await chain.invoke({
    count,
    interfaceDefinition,
    distribution,
    constraints,
  });

  const data = Array.isArray(result) ? result : [result];

  if (data.length !== count) {
    console.warn(`Warning: Requested ${count} records but received ${data.length}`);
  }

  return data;
}
```

---

## 15.4 Using the Generator

```typescript
// src/tools/generate-fixtures.ts
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { generateTestData } from './test-data-generator.js';

// ── Example 1: User fixtures ───────────────────────────────────────────────

const userInterface = `
interface User {
  id: string;             // format: usr_XXXXX (5 alphanumeric chars)
  email: string;          // valid email format
  firstName: string;
  lastName: string;
  role: 'admin' | 'editor' | 'viewer';
  country: string;        // ISO 3166-1 alpha-2 code
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  isVerified: boolean;
  createdAt: string;      // ISO 8601 datetime
}
`;

const users = await generateTestData({
  interfaceDefinition: userInterface,
  count: 10,
  distribution: `
    - 3 admin users (enterprise tier, verified)
    - 4 regular users (mixed tiers, mostly verified)
    - 2 unverified users (free tier)
    - 1 viewer with free tier from a non-English-speaking country
  `,
  constraints: 'No duplicate emails. No duplicate IDs. Use diverse nationalities.',
});

// ── Example 2: Product fixtures ────────────────────────────────────────────

const productInterface = `
interface Product {
  sku: string;            // format: SKU-XXXXX
  name: string;
  category: 'electronics' | 'clothing' | 'books' | 'home';
  price: number;          // in USD, 2 decimal places
  stockLevel: number;     // integer, 0 or more
  isActive: boolean;
  tags: string[];
  weight: number;         // in kg, for shipping calculation
}
`;

const products = await generateTestData({
  interfaceDefinition: productInterface,
  count: 8,
  distribution: `
    - 2 out-of-stock items (stockLevel: 0)
    - 1 high-value item (price > 500)
    - 1 free item (price: 0.00) — e.g. a downloadable PDF
    - 2 inactive products (isActive: false)
    - 2 normal in-stock items
  `,
  constraints: 'Prices must be realistic for the category. No negative stock.',
});

// ── Example 3: Invalid data for negative testing ───────────────────────────

const invalidUserInterface = `
interface InvalidUserInput {
  email: string;
  password: string;
  firstName: string;
  age: number;
}
`;

const invalidData = await generateTestData({
  interfaceDefinition: invalidUserInterface,
  count: 6,
  distribution: 'All records should be INVALID inputs for testing error handling',
  constraints: `
    Include:
    - Email without @ symbol
    - Email with consecutive dots
    - Password under 8 characters
    - Password with no uppercase
    - Age as a negative number
    - Age above 150
  `,
});

// ── Save all fixtures ──────────────────────────────────────────────────────

const fixturesDir = path.join(process.cwd(), 'fixtures', 'generated');
fs.mkdirSync(fixturesDir, { recursive: true });

const saveFixture = (data: unknown[], name: string) => {
  const outputPath = path.join(fixturesDir, `${name}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved ${data.length} records to: ${outputPath}`);
};

saveFixture(users, 'users');
saveFixture(products, 'products');
saveFixture(invalidData, 'invalid-user-inputs');

console.log('\nAll fixtures generated successfully.');
```

---

## 15.5 Using Generated Fixtures in Playwright Tests

```typescript
// tests/fixtures/generated-fixtures.ts
import { test as base } from '@playwright/test';
import usersJson from '../../fixtures/generated/users.json' assert { type: 'json' };
import productsJson from '../../fixtures/generated/products.json' assert { type: 'json' };

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'editor' | 'viewer';
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  isVerified: boolean;
};

type GeneratedFixtures = {
  adminUser: User;
  freeUser: User;
  unverifiedUser: User;
  allUsers: User[];
};

export const test = base.extend<GeneratedFixtures>({
  adminUser: async ({}, use) => {
    const admin = usersJson.find((u: User) => u.role === 'admin' && u.isVerified);
    if (!admin) throw new Error('No admin user in generated fixtures');
    await use(admin);
  },

  freeUser: async ({}, use) => {
    const freeUser = usersJson.find(
      (u: User) => u.subscriptionTier === 'free' && u.isVerified,
    );
    if (!freeUser) throw new Error('No verified free user in generated fixtures');
    await use(freeUser);
  },

  unverifiedUser: async ({}, use) => {
    const unverified = usersJson.find((u: User) => !u.isVerified);
    if (!unverified) throw new Error('No unverified user in generated fixtures');
    await use(unverified);
  },

  allUsers: async ({}, use) => {
    await use(usersJson as User[]);
  },
});

export { expect } from '@playwright/test';
```

```typescript
// tests/user-management.spec.ts
import { test, expect } from './fixtures/generated-fixtures.js';

test('admin can access user management panel', async ({ page, adminUser }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', adminUser.email);
  await page.fill('[data-testid="password"]', 'TestPassword1!');
  await page.click('[data-testid="login-button"]');

  await expect(page.getByRole('link', { name: 'User Management' })).toBeVisible();
});

test('unverified user sees verification prompt', async ({ page, unverifiedUser }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', unverifiedUser.email);
  await page.fill('[data-testid="password"]', 'TestPassword1!');
  await page.click('[data-testid="login-button"]');

  await expect(page.getByText('Please verify your email')).toBeVisible();
});
```

---

## 15.6 Regenerating Fixtures

Add a script to `package.json` so fixtures can be regenerated on demand:

```json
{
  "scripts": {
    "generate:fixtures": "tsx src/tools/generate-fixtures.ts"
  }
}
```

Run this when:
- Requirements change (new fields, new roles, new constraints)
- You need fresh data after a database reset
- Adding a new test module that needs its own fixture type

---

## 15.7 What This Means for Testers

Generated fixtures solve several real problems: the data is realistic (not `test@test.com`), it is varied (different roles, countries, edge cases), and it is reproducible (run the script again to get a fresh set with the same distribution). The interface-driven approach means the AI understands your domain model and produces data that matches your actual TypeScript types.

The biggest win is negative test data. Generating valid data by hand is tedious; generating invalid data in systematic ways is even harder. You need an email without `@`, an email with consecutive dots, a password that is 7 characters, a password that is 8 characters but lacks uppercase. The distribution parameter handles all of this in one AI call.

---

## Interview Questions — Chapter 15

**Q1. Why is `temperature: 0.3` used here instead of `0`?**

At temperature 0, the model always picks the most probable token. For test data, this produces repetitive records — the same names, the same countries, the same patterns. Temperature 0.3 introduces enough randomness to produce diverse, realistic-looking data while remaining mostly predictable. You want variety in the data but consistency in whether the data matches the interface constraints.

**Q2. How would you validate that the generated data actually matches your TypeScript interface?**

Use Zod to define the schema and validate each record after generation. Parse the JSON array with `z.array(yourSchema).parse(data)`. If any record fails, Zod throws with a detailed error explaining which field is wrong. This catches the AI producing a string where a number is expected, or an invalid enum value.

**Q3. What is the limitation of generating test data in batches of 100?**

The model's context window constrains how much data can be generated in one call. At 100 records, the output JSON is large and may approach the model's output token limit. For larger datasets, call the function multiple times with different distributions and concatenate the results. Also check for duplicate IDs across batches — the AI generates unique IDs within one call but may repeat values across calls.

**Q4. How would you integrate fixture regeneration into CI so the team always has fresh data?**

Add the fixture generation script as a CI step that runs before tests. Use a caching mechanism (like GitHub Actions cache) keyed on the interface definition file hash. If the interfaces have not changed, use cached fixtures. If they have changed (a developer added a new field), regenerate. This avoids regenerating on every run (API cost) while ensuring fixtures stay in sync with the actual TypeScript types.

**Q5. A junior tester asks: "Why not just use Faker.js for this?" How would you answer?**

Faker.js is excellent for simple fields — names, emails, phone numbers. But it does not understand the relationships in your data or the business logic. Faker cannot generate a distribution of "3 enterprise admins, 2 unverified free users, 1 viewer from a non-English-speaking country with a specific edge case". You have to write that logic yourself. The AI understands the distribution description in plain English and applies it across the whole dataset. For complex domain-aware test data, the AI approach is faster and produces better results.

---
