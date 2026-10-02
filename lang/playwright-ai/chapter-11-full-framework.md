# Chapter 11 — The Full AI Framework

---

## The Problem

You have built seven AI tools across nine chapters. They are scattered across files. How do they fit together as a single, coherent framework that a team of engineers can use every day?

This chapter assembles everything into a production-ready structure.

---

## The Complete Folder Structure

```
project-root/
├── .env
├── package.json
├── tsconfig.json
├── playwright.config.ts
│
├── ai/
│   ├── data-factory.ts         ← Chapter 3: generate test data
│   ├── selector-healer.ts      ← Chapter 4: heal broken selectors
│   ├── pom-generator.ts        ← Chapter 5: generate POM methods
│   ├── test-generator.ts       ← Chapter 6: generate test code
│   ├── failure-analyser.ts     ← Chapter 7: categorise CI failures
│   ├── visual-checker.ts       ← Chapter 8: compare screenshots
│   ├── orchestrator.ts         ← Chapter 9: LangGraph workflow
│   └── utils/
│       └── trace-context.ts    ← Chapter 10: LangSmith tagging
│
├── pages/
│   ├── base.page.ts            ← BasePage with resilientLocator
│   ├── login.page.ts
│   ├── checkout.page.ts
│   └── dashboard.page.ts
│
├── tests/
│   ├── login.spec.ts
│   ├── checkout.spec.ts
│   └── visual.spec.ts
│
├── scripts/
│   ├── analyse-failures.ts     ← Run after CI
│   ├── generate-tests.ts       ← Generate new test files
│   ├── update-baselines.ts     ← Update visual baselines
│   ├── run-qa-workflow.ts      ← Full LangGraph orchestration
│   └── evaluate-all.ts         ← LangSmith evaluation
│
└── test-results/
    ├── baselines/              ← Visual baselines (committed to git)
    ├── snapshots/              ← Current screenshots (git ignored)
    └── results.json            ← Playwright report (git ignored)
```

---

## The End-to-End Flow

Here is the full journey from requirement to report:

### Phase 1 — Before Testing

```
Engineer writes requirement:
"Checkout with saved card for premium users"
        ↓
scripts/generate-tests.ts
  → test-generator.ts uses LangChain
  → produces checkout-saved-card.spec.ts
  → engineer reviews, adjusts, commits
        ↓
scripts/generate-tests.ts (for test data)
  → data-factory.ts generates 10 premium users
  → saved to fixtures/premium-users.json
```

### Phase 2 — Test Execution

```
CI runs: playwright test
  → each test tagged with LangSmith trace context
  → AI tools called inside tests are auto-traced
  → results saved to test-results/results.json
```

### Phase 3 — Post-CI Analysis

```
scripts/analyse-failures.ts
  → failure-analyser.ts categorises each failure
  → selector failures → selector-healer.ts
  → application bugs → escalation list
  → generates summary report
  → exits code 1 if immediate failures exist
```

### Phase 4 — Weekly Review

```
scripts/evaluate-all.ts
  → runs LangSmith evaluations for each AI tool
  → checks scores against thresholds
  → team reviews LangSmith dashboard (15 min)
  → low-quality examples added to datasets
```

---

## Complete Working Example

Requirement: Test checkout with a saved card.

**Step 1 — Generate test**

```typescript
// scripts/generate-tests.ts
import 'dotenv/config';
import { generateTest } from '../ai/test-generator.js';
import { writeFile } from 'fs/promises';

const scenario = `
  User: premium customer with saved payment card
  Steps: log in, add a product to cart, proceed to checkout, 
         select saved card, complete purchase
  Expected: order confirmation page shown with order number
`;

const pageObjects = `
  LoginPage: login(email, password), verifyLoggedIn()
  CartPage: addProduct(productId), proceedToCheckout()
  CheckoutPage: selectSavedCard(), completePurchase(), getOrderNumber()
`;

const result = await generateTest(scenario, pageObjects);
await writeFile(`tests/${result.fileName}`, result.testCode);
console.log('Notes:', result.notes);
```

**Step 2 — Generated test (AI output)**

```typescript
// tests/checkout-saved-card.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page.js';
import { CartPage } from '../pages/cart.page.js';
import { CheckoutPage } from '../pages/checkout.page.js';
import { generateUser } from '../ai/data-factory.js';

test.describe('Checkout with Saved Card', () => {
  test('premium user completes purchase with saved card', async ({ page }) => {
    const user = await generateUser('premium');

    const loginPage = new LoginPage(page);
    await loginPage.login(user.email, user.password);
    await loginPage.verifyLoggedIn();

    const cartPage = new CartPage(page);
    await cartPage.addProduct('PROD-001');
    await cartPage.proceedToCheckout();

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.selectSavedCard();
    await checkoutPage.completePurchase();

    const orderNumber = await checkoutPage.getOrderNumber();
    expect(orderNumber).toMatch(/^ORD-\d{6}$/);
  });
});
```

**Step 3 — Run CI, failures appear, analyse**

```bash
npx tsx scripts/analyse-failures.ts
```

Output:
```
=== SELECTOR-BROKEN (2) ===
  [scheduled] Checkout > completePurchase
    Cause: 'Place Order' button not found — likely renamed
    Fix: Update selector to match new button text

=== APPLICATION-BUG (1) ===
  [immediate] Checkout > getOrderNumber
    Cause: Order confirmation page not shown — payment may have failed
    Fix: Check payment gateway and backend logs
```

---

## What Each Audience Takes Away

**For manual QA engineers:**
You now have AI tools that generate test scenarios, analyse what went wrong, and watch for visual changes — freeing you to focus on exploratory testing and domain knowledge.

**For Playwright automation engineers:**
You now have a framework where AI generates initial test code, heals broken selectors, categorises CI failures, and observes AI behaviour through LangSmith — reducing maintenance and increasing reliability.

---

## Interview Questions

**Beginner**
1. What is the role of the `scripts/` folder versus the `ai/` folder?
2. At what phase does LangSmith receive data?

**Intermediate**
3. An engineer joins the team and wants to add a new AI tool. Walk them through where the new file goes, how to wire it into the workflow, and how to add observability.
4. The complete flow has four phases. Which phase is best to run on every PR vs. only nightly? Justify your answer.

**Advanced**
5. The team wants to run Phase 1 (test generation) in an AI agent that automatically generates tests for any new user story added to Jira. Design the architecture: which tools are used, how the Jira trigger works, how the generated test is reviewed before merging, and what prevents the agent from generating 1000 low-quality tests.

---
