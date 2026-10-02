# Chapter 8 — Visual Regression with AI

---

## The Problem

A CSS change moves a button 4 pixels to the right and makes it slightly darker. Traditional visual regression tools flag it as a change and fail the test. Was this intentional? Was it a bug? A pixel-diff tool does not know. You get 200 false-positive visual failures after every UI update.

AI can look at two screenshots — before and after — and decide: is this a meaningful visual regression, or just a style update?

---

## Theory: AI as a Visual Reviewer

Think of an AI visual reviewer like a senior designer on call. You show them two screenshots and ask: "Is anything broken here?" They look at layout, content, overlapping elements, missing components — not individual pixels. They answer: "The login button moved off-screen on mobile. That's a bug." Or: "The background colour changed from grey to white. Looks intentional."

This is semantic visual comparison, not pixel comparison.

---

## Step 1 — Capture Screenshots in Playwright

```typescript
// ai/visual-checker.ts
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Page } from '@playwright/test';

export async function captureScreenshot(page: Page, name: string): Promise<Buffer> {
  const buffer = await page.screenshot({ fullPage: false });
  return buffer;
}

export async function loadScreenshot(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return buffer.toString('base64');
}
```

---

## Step 2 — The Visual Comparison Chain

GPT-4o is a multimodal model — it can read images. You send both screenshots as base64 and ask for a comparison:

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';

const VisualComparisonSchema = z.object({
  verdict: z.enum(['regression', 'acceptable-change', 'no-change']),
  confidence: z.enum(['high', 'medium', 'low']),
  issues: z.array(z.string()).describe('List of visual regressions found. Empty if no regression.'),
  description: z.string().describe('One paragraph describing what changed'),
});

type VisualComparison = z.infer<typeof VisualComparisonSchema>;

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
const structuredModel = model.withStructuredOutput(VisualComparisonSchema);

export async function compareScreenshots(
  baselineBase64: string,
  currentBase64: string,
  pageName: string
): Promise<VisualComparison> {
  const message = new HumanMessage({
    content: [
      {
        type: 'text',
        text: `Compare these two screenshots of the ${pageName} page.
The first is the baseline (expected). The second is the current version.

Look for:
- Missing elements (buttons, text, images)
- Elements that moved significantly
- Text that changed
- Layout breaking on one version
- Overlapping elements

Ignore:
- Minor colour shade differences (less than 10%)
- 1-2 pixel position differences
- Font rendering differences between browsers`,
      },
      {
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${baselineBase64}`, detail: 'high' },
      },
      {
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${currentBase64}`, detail: 'high' },
      },
    ],
  });

  return await structuredModel.invoke([message]);
}
```

---

## Step 3 — Integrate with Playwright Tests

```typescript
// tests/visual.spec.ts
import { test, expect } from '@playwright/test';
import { captureScreenshot, loadScreenshot, compareScreenshots } from '../ai/visual-checker.js';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const BASELINE_DIR = 'test-results/baselines';
const SNAPSHOTS_DIR = 'test-results/snapshots';

test.describe('Visual Regression', () => {
  test('login page visual check', async ({ page }) => {
    await page.goto('/login');
    const currentBuffer = await captureScreenshot(page, 'login-page');

    const baselinePath = `${BASELINE_DIR}/login-page.png`;

    // First run: save baseline
    if (!existsSync(baselinePath)) {
      await mkdir(BASELINE_DIR, { recursive: true });
      await writeFile(baselinePath, currentBuffer);
      console.log('Baseline saved. Run again to compare.');
      return;
    }

    // Subsequent runs: compare
    const baselineBase64 = await loadScreenshot(baselinePath);
    const currentBase64 = currentBuffer.toString('base64');

    const comparison = await compareScreenshots(baselineBase64, currentBase64, 'Login Page');

    console.log(`Verdict: ${comparison.verdict} (${comparison.confidence} confidence)`);
    console.log(`Description: ${comparison.description}`);
    if (comparison.issues.length > 0) {
      console.log('Issues:', comparison.issues);
    }

    // Fail only on high-confidence regressions
    if (comparison.verdict === 'regression' && comparison.confidence === 'high') {
      const issueList = comparison.issues.join('\n - ');
      throw new Error(`Visual regression detected:\n - ${issueList}`);
    }
  });
});
```

---

## Step 4 — Baseline Update Workflow

When a UI change is intentional, update the baseline:

```typescript
// scripts/update-baselines.ts
import 'dotenv/config';
import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'fs/promises';

const PAGES = [
  { name: 'login-page', url: '/login' },
  { name: 'dashboard', url: '/dashboard' },
  { name: 'checkout', url: '/checkout' },
];

const browser = await chromium.launch();
const page = await browser.newPage();
await mkdir('test-results/baselines', { recursive: true });

for (const { name, url } of PAGES) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const screenshot = await page.screenshot({ fullPage: false });
  await writeFile(`test-results/baselines/${name}.png`, screenshot);
  console.log(`Updated baseline: ${name}`);
}

await browser.close();
console.log('All baselines updated.');
```

```json
// package.json scripts
{
  "scripts": {
    "visual:update": "tsx scripts/update-baselines.ts",
    "visual:test": "playwright test tests/visual.spec.ts"
  }
}
```

---

## Limitations and Guardrails

| Limitation | Mitigation |
|---|---|
| GPT-4o has a context limit — very long pages may be cropped | Use `fullPage: false` and viewport screenshots |
| AI may disagree with your verdict on borderline changes | Only fail CI on `high` confidence regressions |
| Cost: each comparison sends 2 images | Run visual checks only in nightly CI, not every PR |
| AI cannot compare scrolled content | Take multiple viewport screenshots for long pages |

---

## What This Means for Manual QA

Before AI visual testing, you reviewed screenshots manually after each release. With AI:
- AI flags potential regressions before you see them
- You review only the cases AI flagged (not hundreds of screenshots)
- You update baselines when design changes are intentional
- You investigate only when AI says `regression` with `high` confidence

---

## Interview Questions

**Beginner**
1. Why does the AI comparison ignore 1-2 pixel differences?
2. What happens on the first run when there is no baseline? Why?

**Intermediate**
3. The comparison model is `gpt-4o` with `temperature: 0`. Why `temperature: 0` for visual comparison?
4. Your visual tests run on every PR and cost $0.50 per page. With 20 pages and 50 PRs per month, that is $500/month. How would you reduce costs while maintaining visual coverage?

**Advanced**
5. The AI says `acceptable-change` for a button that moved 50 pixels to the right, making it partially hidden on mobile. The AI did not detect it because the test ran on desktop viewport. Design a cross-viewport visual strategy that catches mobile regressions.

---
