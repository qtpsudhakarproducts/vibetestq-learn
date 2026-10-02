# Chapter 16 — AI Selector Healer

---

## What You Will Learn

- Why Playwright selectors break and what the common causes are
- How to build an AI tool that diagnoses broken selectors from HTML
- How to generate multiple alternative selectors ranked by stability
- How to integrate selector healing into your test maintenance workflow
- How to auto-heal selectors in a Playwright `onLocatorError` hook

---

## 16.1 Why Selectors Break

Selectors are the most fragile part of any test automation suite. They break because:

| Root Cause | Example |
|---|---|
| CSS class rename | `.btn-primary` → `.button--primary` |
| Dynamic class (CSS-in-JS) | `.sc-x7k2p` changes on rebuild |
| DOM restructuring | Button moved from `div.actions` to `footer.toolbar` |
| Framework change | `id="react-root"` removed |
| Localisation | `[aria-label="Submit"]` → `[aria-label="Inviare"]` |

When a selector breaks, a test fails. Someone spends 10–30 minutes finding the new selector, checking it against the page, and updating the test. For a large suite with 100+ selectors, selector maintenance becomes a significant time drain.

The AI Selector Healer speeds up this process: you give it the broken selector and the current HTML of the page element, and it produces multiple replacement options ranked by stability.

---

## 16.2 Selector Stability Ranking

Not all selectors are equally stable. This is the stability hierarchy:

```
Most stable:
  data-testid="submit-button"           ← Set by developers for tests
  role="button" + name="Submit"         ← ARIA semantics
  text="Submit Order"                   ← User-visible text
  label "Email address"                 ← Associated label
  placeholder "Enter your email"        ← User-visible attribute
  id="submit-btn"                       ← If stable and meaningful
  [aria-label="Close dialog"]           ← ARIA attributes
  nth-child / nth-of-type               ← Positional — fragile
  .css-class                            ← Implementation detail
  xpath                                 ← Brittle and verbose
Least stable
```

The AI Selector Healer understands this hierarchy and produces selectors starting from the most stable approach.

---

## 16.3 The Chain

```typescript
// src/tools/selector-healer.ts
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

// ── Schema ─────────────────────────────────────────────────────────────────

const selectorOptionSchema = z.object({
  selector: z.string().describe('The Playwright locator expression'),
  method: z
    .enum([
      'getByTestId',
      'getByRole',
      'getByText',
      'getByLabel',
      'getByPlaceholder',
      'getByAltText',
      'locator-css',
      'locator-xpath',
    ])
    .describe('The Playwright method to use'),
  stabilityScore: z
    .number()
    .min(1)
    .max(10)
    .describe('1=very fragile, 10=extremely stable'),
  explanation: z.string().describe('Why this selector works and how stable it is'),
  playwrightCode: z.string().describe('Complete Playwright TypeScript code to use this selector'),
});

const healingResultSchema = z.object({
  brokenSelectorAnalysis: z
    .string()
    .describe('Why the original selector is broken based on the HTML context'),
  options: z
    .array(selectorOptionSchema)
    .describe('Alternative selectors, ordered from most stable to least stable'),
  recommended: z.string().describe('The recommended selector to use — matches the highest stability option'),
  migrationNote: z.string().describe('Brief note about what changed and what to watch for'),
});

type HealingResult = z.infer<typeof healingResultSchema>;

// ── Chain ──────────────────────────────────────────────────────────────────

const parser = StructuredOutputParser.fromZodSchema(healingResultSchema);
const formatInstructions = parser.getFormatInstructions();

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a Playwright expert specialising in robust test selector design.

    Analyse the broken selector and the current HTML context.
    Provide multiple alternative selectors using Playwright's best practices.
    
    Selector stability priority (highest to lowest):
    1. data-testid attributes (developer-set, most stable)
    2. ARIA role + name combinations (getByRole)
    3. Visible user text (getByText)
    4. Form labels (getByLabel)
    5. Placeholders (getByPlaceholder)
    6. ARIA labels
    7. Meaningful CSS classes (not generated)
    8. XPath (last resort)
    
    Always prefer semantic selectors. Never suggest auto-generated class names.
    
    {formatInstructions}`,
  ],
  [
    'human',
    `The following Playwright selector has stopped working:
    
    Broken selector: {brokenSelector}
    Page/component: {pageContext}
    
    Current HTML around the element (what the page looks like now):
    {currentHtml}
    
    Analyse why it broke and provide the best alternative selectors.`,
  ],
]);

const chain = prompt.pipe(model).pipe(parser);

// ── Healer function ────────────────────────────────────────────────────────

export async function healSelector(
  brokenSelector: string,
  currentHtml: string,
  pageContext: string = 'Unknown page',
): Promise<HealingResult> {
  return await chain.invoke({
    formatInstructions,
    brokenSelector,
    currentHtml,
    pageContext,
  });
}
```

---

## 16.4 Using the Healer

```typescript
// src/tools/heal-selectors-example.ts
import 'dotenv/config';
import { healSelector } from './selector-healer.js';

// ── Example: Submit button selector broke ─────────────────────────────────

const brokenSelector = '.btn-primary.submit-action';

// Current HTML snapshot (from browser DevTools or page.content())
const currentHtml = `
<footer class="checkout-footer">
  <div class="action-bar">
    <button 
      data-testid="complete-order-btn"
      aria-label="Complete your order"
      class="button button--cta"
      type="submit"
    >
      Complete Order
    </button>
    <button 
      class="button button--secondary"
      data-testid="save-for-later-btn"
    >
      Save for Later
    </button>
  </div>
</footer>
`;

const result = await healSelector(
  brokenSelector,
  currentHtml,
  'Checkout page — order completion step',
);

console.log('\n══════ SELECTOR HEALER RESULT ══════\n');
console.log(`Analysis: ${result.brokenSelectorAnalysis}`);
console.log(`\nRecommended: ${result.recommended}`);
console.log(`Migration note: ${result.migrationNote}`);

console.log('\n── Options (most stable first) ──');
result.options.forEach((opt, i) => {
  console.log(`\n[${i + 1}] Stability: ${opt.stabilityScore}/10 — Method: ${opt.method}`);
  console.log(`    Selector: ${opt.selector}`);
  console.log(`    Code: ${opt.playwrightCode}`);
  console.log(`    Why: ${opt.explanation}`);
});
```

**Sample output:**
```
Analysis: The original selector .btn-primary.submit-action uses CSS class names
that no longer exist. The button now uses BEM-style classes (button--cta) and
the class names have changed completely in a UI framework update.

Recommended: page.getByTestId('complete-order-btn')
Migration note: The element now has a data-testid. Prefer this in all future tests.

── Options (most stable first) ──

[1] Stability: 10/10 — Method: getByTestId
    Selector: complete-order-btn
    Code: page.getByTestId('complete-order-btn')
    Why: data-testid is explicitly set for testing. Will survive CSS changes.

[2] Stability: 8/10 — Method: getByRole
    Selector: button[name="Complete Order"]
    Code: page.getByRole('button', { name: 'Complete Order' })
    Why: Semantic role + text. Will survive CSS changes. Breaks if button text changes.

[3] Stability: 7/10 — Method: getByText
    Selector: Complete Order
    Code: page.getByText('Complete Order')
    Why: User-visible text. Stable unless text is changed or localised.
```

---

## 16.5 Batch Healing from a Failure Report

When a test run fails with multiple broken selectors, process them all at once:

```typescript
// src/tools/batch-selector-healer.ts
import 'dotenv/config';
import { healSelector } from './selector-healer.js';

type BrokenSelectorEntry = {
  selectorId: string;
  brokenSelector: string;
  currentHtml: string;
  pageContext: string;
  testFile: string;
  lineNumber: number;
};

type HealingReport = {
  timestamp: string;
  totalBroken: number;
  results: Array<{
    entry: BrokenSelectorEntry;
    recommended: string;
    playwrightCode: string;
    stabilityScore: number;
  }>;
};

async function batchHeal(entries: BrokenSelectorEntry[]): Promise<HealingReport> {
  const results = [];

  for (const entry of entries) {
    console.log(`Healing: ${entry.selectorId} in ${entry.testFile}:${entry.lineNumber}`);

    const healing = await healSelector(
      entry.brokenSelector,
      entry.currentHtml,
      entry.pageContext,
    );

    const top = healing.options[0];
    results.push({
      entry,
      recommended: healing.recommended,
      playwrightCode: top.playwrightCode,
      stabilityScore: top.stabilityScore,
    });
  }

  return {
    timestamp: new Date().toISOString(),
    totalBroken: entries.length,
    results,
  };
}

// Print a migration guide for developers
function printMigrationGuide(report: HealingReport): void {
  console.log('\n══════ SELECTOR MIGRATION GUIDE ══════\n');
  console.log(`Generated: ${report.timestamp}`);
  console.log(`Broken selectors: ${report.totalBroken}\n`);

  report.results.forEach(({ entry, recommended, playwrightCode, stabilityScore }) => {
    console.log(`📁 ${entry.testFile}:${entry.lineNumber}`);
    console.log(`   OLD: ${entry.brokenSelector}`);
    console.log(`   NEW: ${playwrightCode}`);
    console.log(`   Stability: ${stabilityScore}/10`);
    console.log('');
  });
}
```

---

## 16.6 What This Means for Testers

Selector healing does not eliminate broken selectors — it eliminates the manual detective work of finding replacements. A test engineer still needs to:
1. Run the failing test to confirm which selector broke
2. Open DevTools to get the current HTML around the element
3. Run the healer with the broken selector + HTML
4. Review the options and pick the recommended one
5. Update the test or page object

Steps 3–5 now take 30 seconds instead of 15 minutes. For a sprint with 10 broken selectors, that saves roughly 2 hours.

The bigger win is the stability score. The healer does not just find any selector that works — it finds the most stable selector available. A developer who just fixes the broken selector with another CSS class is creating tomorrow's maintenance debt. The healer steers toward `data-testid` and semantic selectors that survive CSS changes.

---

## Interview Questions — Chapter 16

**Q1. Why is `getByRole` more stable than `locator('.css-class')`?**

CSS class names are implementation details that change when developers rename classes, refactor styling, or switch CSS frameworks. The role of an element — its semantic type and accessible name — is tied to what the element *does* for the user. A submit button will still have `role="button"` and name "Submit" after a full CSS rewrite. ARIA attributes reflect the user's mental model, not the developer's implementation choice.

**Q2. What information do you need to provide the selector healer for it to work well?**

Three things: the broken selector (what your test was using), the current HTML around the element (what the page looks like after the change), and context about what the element does (page name, element purpose). The HTML is the most important input. Without it, the AI can only guess. Capture it with `await page.content()` or by copying from DevTools.

**Q3. When would you choose `getByText` over `getByTestId`?**

When the element does not have a `data-testid` and adding one would require a code change that is not warranted. `getByText` is appropriate for static, user-visible text that is unlikely to change — things like section headings, fixed labels, legal text. For interactive elements (buttons, inputs, links), `getByTestId` is always preferred because you explicitly set it for test purposes. Text can be changed by a copywriter without realising it breaks tests.

**Q4. How would you prevent selector breakage in the first place?**

Establish a team convention that every interactive element testable by automated tests must have a `data-testid` attribute. Developers add these as part of the feature ticket's definition of done. This is a process change, not a technical one. Once the convention is in place, test selectors almost never break unless the feature itself changes.

**Q5. How does the `playwrightCode` field in the output make the healer more useful than just returning a selector string?**

It eliminates ambiguity. Different Playwright methods have different APIs — `getByRole` needs `{ name: 'Submit' }`, `getByTestId` just needs the ID string, `locator` takes a CSS string. Returning the complete TypeScript expression means the developer can copy-paste it directly into the page object without knowing which method to use. It reduces errors and friction in applying the fix.

---
