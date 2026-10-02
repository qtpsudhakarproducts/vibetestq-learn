# Chapter 4 — Smart Selector Healing

---

## The Problem

A developer renames a button from "Sign In" to "Log In". Overnight, 15 tests fail. The automation engineer spends the morning fixing selector after selector.

**This is the most common cause of automation maintenance cost.** And it is almost entirely mechanical — pattern matching between what the test expects and what the page now has.

AI can do this automatically.

---

## Theory: How Selector Healing Works

When a selector fails, you have:
1. The broken selector (what the test was looking for)
2. The page's current HTML (what is actually there now)

You give both to an AI. It reasons: "The test wanted a submit button. The page still has a submit button but the text changed. The new selector is `getByRole('button', { name: 'Log In' })`."

This is pattern matching, which is exactly what LLMs are good at.

---

## Step 1 — The Healer Chain

```typescript
// ai/selector-healer.ts
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

const HealedSelectorSchema = z.object({
  selector: z.string().describe('The Playwright selector expression. Example: page.getByRole("button", { name: "Log In" })'),
  confidence: z.enum(['high', 'medium', 'low']).describe('How confident the healer is about this fix'),
  reasoning: z.string().describe('One sentence explaining why this selector was chosen'),
});

type HealedSelector = z.infer<typeof HealedSelectorSchema>;

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
const structuredModel = model.withStructuredOutput(HealedSelectorSchema);

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a Playwright selector expert. A test selector has broken.
Find the best replacement selector using Playwright best practices:
- Prefer getByRole > getByLabel > getByText > getByTestId
- Avoid CSS selectors, XPath, and IDs
- The replacement must match the same element the original was targeting`,
  ],
  [
    'human',
    `Broken selector: {brokenSelector}

Page HTML (relevant section):
{pageHtml}

What is the best Playwright selector to replace the broken one?`,
  ],
]);

const chain = prompt.pipe(structuredModel);

export async function healSelector(
  brokenSelector: string,
  pageHtml: string
): Promise<HealedSelector> {
  return await chain.invoke({ brokenSelector, pageHtml });
}
```

---

## Step 2 — Capture Page HTML in Playwright

```typescript
// Helper to extract relevant HTML around a failing element
import type { Page } from '@playwright/test';

export async function captureRelevantHtml(page: Page, areaSelector?: string): Promise<string> {
  if (areaSelector) {
    // Try to get HTML from a specific area
    try {
      const element = page.locator(areaSelector);
      return await element.innerHTML();
    } catch {
      // Fall back to body
    }
  }
  // Get body HTML, truncated to avoid token limits
  const bodyHtml = await page.locator('body').innerHTML();
  return bodyHtml.slice(0, 4000);  // ~4000 chars = safe for GPT-4o context
}
```

---

## Step 3 — Self-Healing Page Object Base

```typescript
// pages/base.page.ts
import type { Page, Locator } from '@playwright/test';
import { healSelector } from '../ai/selector-healer.js';
import { captureRelevantHtml } from '../ai/selector-healer.js';

export abstract class BasePage {
  constructor(protected page: Page) {}

  /**
   * Try a locator. If it fails, ask AI for a healing suggestion.
   * Note: The AI suggestion is logged — a human must decide to apply it.
   */
  async resilientLocator(selector: string, description: string): Promise<Locator> {
    const locator = this.page.locator(selector);

    try {
      await locator.waitFor({ timeout: 5000 });
      return locator;
    } catch {
      console.warn(`Selector failed: ${selector} (${description})`);

      const html = await captureRelevantHtml(this.page);
      const healed = await healSelector(selector, html);

      console.log(`AI suggested: ${healed.selector}`);
      console.log(`Confidence: ${healed.confidence}`);
      console.log(`Reason: ${healed.reasoning}`);

      // Still throw — AI suggestion is for the engineer, not auto-applied
      throw new Error(
        `Selector '${selector}' failed. AI suggests: ${healed.selector} (${healed.confidence} confidence)`
      );
    }
  }
}
```

---

## Step 4 — Automatic Healing (Higher Risk)

For teams that want full automation (use carefully — always review AI fixes):

```typescript
// pages/base.page.ts — auto-healing variant
async resilientLocatorAuto(selector: string, description: string): Promise<Locator> {
  const locator = this.page.locator(selector);

  try {
    await locator.waitFor({ timeout: 5000 });
    return locator;
  } catch {
    const html = await captureRelevantHtml(this.page);
    const healed = await healSelector(selector, html);

    if (healed.confidence === 'high') {
      console.warn(`Auto-healed: ${selector} → ${healed.selector}`);
      // Log to a file for later review
      await logHealingEvent(selector, healed, this.page.url());
      return this.page.locator(healed.selector);
    }

    throw new Error(`Selector '${selector}' failed. AI confidence too low to auto-heal: ${healed.confidence}`);
  }
}
```

---

## Step 5 — Log Healing Events for Review

```typescript
// ai/healing-log.ts
import { appendFile } from 'fs/promises';
import type { HealedSelector } from './selector-healer.js';

export async function logHealingEvent(
  original: string,
  healed: { selector: string; confidence: string; reasoning: string },
  url: string
): Promise<void> {
  const event = {
    timestamp: new Date().toISOString(),
    url,
    original,
    healed: healed.selector,
    confidence: healed.confidence,
    reasoning: healed.reasoning,
  };
  await appendFile('healing-log.json', JSON.stringify(event) + '\n');
}
```

Review the healing log weekly. Every logged event is a selector in your code that needs updating.

---

## What This Means for Manual QA

When a selector heals automatically, you see it in the test report as a warning (not a failure). You then review the healing log and file a task for the automation engineer to update the hardcoded selector permanently.

Without healing, you see 15 red test failures and a slow investigation. With healing, you see 15 warnings and a clear list of what changed.

---

## Interview Questions

**Beginner**
1. What are two reasons the healer uses `temperature: 0`?
2. Why does the resilient locator log the AI suggestion but still throw an error (in the non-auto version)?

**Intermediate**
3. The healer receives 4000 characters of HTML. Why is the HTML truncated, and what risk does truncation introduce?
4. Auto-healing only applies when confidence is `high`. What should happen when confidence is `medium`?

**Advanced**
5. A selector heals correctly for 3 weeks. Then a new developer adds a second button with the same role and name on the same page. The healer now fixes to the wrong button. Design a safeguard against this type of false healing.

---
