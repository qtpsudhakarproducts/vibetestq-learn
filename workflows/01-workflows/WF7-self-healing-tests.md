# WF7 — Self-Healing Tests

> Your existing framework. One API key. Thirty lines of glue. Self-healing tests that never lie about what they did.

---

## 1. What it is

When a test fails at runtime due to a locator change, timing issue, or benign UI drift, your framework sends the failure context to an AI API, gets a proposed fix, applies it, and retries the test. Every heal is **logged** — silent fixes are forbidden.

Unlike WF6 (which is design-time), WF7 is runtime. The test heals itself mid-execution.

---

## 2. Who owns it

**QA engineers own the implementation.** QA leads own the **heal log review** — weekly, without exception.

Framework owner (whoever maintains your test base) owns the glue code.

---

## 3. Tools needed

- **Category 7 — Runtime Self-Healing:** this is the category
- Your existing framework (Playwright / Selenium / Cypress)
- An AI API key (Claude via Anthropic, or GPT via OpenAI)
- A heal log destination (file, dashboard, or `graph.json`)

---

## 4. Step-by-step setup

### Step 1: Identify the failure hooks in your framework

**Playwright example:**

```typescript
// tests/helpers/selfHealing.ts
import { Page, Locator } from '@playwright/test';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function healingLocator(page: Page, originalSelector: string, intent: string): Promise<Locator> {
  try {
    const locator = page.locator(originalSelector);
    await locator.waitFor({ timeout: 5000 });
    return locator;
  } catch (err) {
    // Original locator failed — ask AI for a fix
    return await proposeHeal(page, originalSelector, intent);
  }
}

async function proposeHeal(page: Page, originalSelector: string, intent: string): Promise<Locator> {
  const dom = await page.content();
  const screenshot = await page.screenshot({ fullPage: false });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `A test locator failed.

Original selector: ${originalSelector}
Test intent: ${intent}

Current page HTML (trimmed to visible area):
${dom.substring(0, 8000)}

Propose a working Playwright selector that matches the same element.
Output ONLY the selector string. No explanation. No code fencing.

If no reasonable match exists, output: NO_HEAL
`
        },
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: screenshot.toString('base64') }
        }
      ]
    }]
  });

  const proposedSelector = (message.content[0] as any).text.trim();

  if (proposedSelector === 'NO_HEAL') {
    throw new Error(`WF7: No heal possible for ${originalSelector}`);
  }

  // LOG THE HEAL — non-negotiable
  await logHeal({
    timestamp: new Date().toISOString(),
    originalSelector,
    proposedSelector,
    intent,
    test: expect.getState().currentTestName,
  });

  return page.locator(proposedSelector);
}
```

### Step 2: Wire the heal log

```typescript
// tests/helpers/healLog.ts
import fs from 'fs';
import path from 'path';

const LOG_PATH = path.resolve('reports/heal-log.jsonl');

export async function logHeal(entry: {
  timestamp: string;
  originalSelector: string;
  proposedSelector: string;
  intent: string;
  test: string;
}) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
}
```

One line per heal. JSONL format — easy to grep, easy to aggregate.

### Step 3: Use it in tests

```typescript
// tests/auth/password_reset.spec.ts
import { test } from '@playwright/test';
import { healingLocator } from '../helpers/selfHealing';

test('password reset happy path', async ({ page }) => {
  await page.goto('/reset-password');

  const emailInput = await healingLocator(
    page,
    '[data-testid="email-input"]',
    'Email input field on the password reset form'
  );

  await emailInput.fill('TEST_user@example.com');
  // ...
});
```

Only wrap selectors that are **prone to drift**. Button labels, form fields, navigation. Don't wrap every locator — that defeats data-testid culture.

### Step 4: Weekly heal log review

Every week, a QA lead reviews `reports/heal-log.jsonl`:

```bash
# How many heals this week?
wc -l reports/heal-log.jsonl

# Which tests needed the most healing?
cat reports/heal-log.jsonl | jq -r .test | sort | uniq -c | sort -rn | head

# Which selectors are failing most?
cat reports/heal-log.jsonl | jq -r .originalSelector | sort | uniq -c | sort -rn | head
```

**Signals to watch:**
- A test that heals every run → the locator is wrong, fix it properly
- A specific selector heals across many tests → the element changed, update the page object
- Heal count climbing week over week → UI drift accelerating, have a conversation with dev

### Step 5: Escalate repeated heals

Add a rule: if a specific selector has healed more than 5 times in a week, WF7 refuses to heal and fails the test loudly. That forces the proper fix via WF6.

```typescript
// In proposeHeal, before calling AI:
const recentHeals = await countRecentHeals(originalSelector, 7);
if (recentHeals >= 5) {
  throw new Error(`WF7: refusing to heal ${originalSelector} — healed ${recentHeals} times this week. Fix properly via WF6.`);
}
```

---

## 5. Prompts & templates

### Minimal heal prompt

```
A test locator failed.
Original: [data-testid="email-input"]
Intent: Email input on the password reset form.

Here is the current page HTML: [...]

Propose one Playwright selector that matches the same element.
Output ONLY the selector. No explanation.
```

### Enhanced heal prompt (with page object awareness)

```
A test locator failed inside the ResetPasswordPage page object.

Original: [data-testid="email-input"]
Intent: Email input field
Page object: tests/pages/ResetPasswordPage.ts (attached)

Current page HTML: [...]

Propose:
1. A working selector
2. A diff to update the page object (so future tests don't re-heal)

Output format:
SELECTOR: ...
PAGE_OBJECT_PATCH:
```

---

## 6. Success criteria

- [ ] Framework catches locator failures and calls the heal API
- [ ] Every heal is logged (no silent heals)
- [ ] Heal log is reviewed weekly
- [ ] Repeated-heal escalation rule is in place (5+ heals = fail loudly)
- [ ] Heal count trend is visible in `graph.json` or dashboard
- [ ] Proper fixes happen via WF6 within one sprint of heal-log alerts

---

## 7. Common pitfalls

### 🚫 Silent heals
The single most dangerous pattern. AI fixes the locator, test passes, nobody notices the UI changed. Regression gets masked for weeks. **Non-negotiable: every heal is logged and reviewed.**

### 🚫 Healing everything
Wrapping every `.click()` in a healingLocator makes the framework slow and the logs noisy. Heal only drift-prone elements. If your team used data-testid from day one, you'll heal rarely.

### 🚫 No escalation rule
Without the 5-heal-limit rule, the same locator heals forever. Fix it properly or WF7 becomes a crutch.

### 🚫 Trusting AI's proposed selector blindly
The selector AI proposes might match a *different* element that happens to be clickable. Have the test assert the *outcome* strongly — not just that the click succeeded.

### 🚫 Heal log in ephemeral storage
If the log lives in a CI container that gets destroyed, you lose the audit trail. Ship it to S3, a dashboard, or commit summaries into the repo.

### 🚫 No budget for heal API calls
Under load, heals can rack up API costs. Have a daily budget. When exceeded, WF7 disables and alerts a human.

---

## 8. Which SDLC type it fits

| Type | Fit | How it looks |
|------|-----|--------------|
| 1 — AI-Assisted | Optional | QA adds healing to a few brittle tests as a patch |
| 2 — Spec-Driven | Optional | Same — WF7 is tactical, not strategic |
| 3 — Parallel Stream | Yes | Healing reduces flakiness so CI runs trust-worthy |
| 4 — Agentic | **Core** | Healing + maintenance + coverage audits form the loop |
| 5 — Regulated | **Core + strict audit** | Every heal + justification archived; escalation thresholds tighter |

---

## 9. What to try next

- **WF6 (Test Maintenance)** — fix heal-log signals at the source
- **WF8 (Coverage Audit)** — make sure healing didn't silently erase coverage
- **WF11 (Production Feedback)** — cross-reference heal spikes with production incidents

---

## Example heal log entry

```json
{
  "timestamp": "2026-04-17T14:22:15Z",
  "originalSelector": "[data-testid=\"email-input\"]",
  "proposedSelector": "input[name=\"email\"]",
  "intent": "Email input field on password reset form",
  "test": "password reset happy path",
  "outcome": "passed_after_heal",
  "page_url": "https://staging.app.com/reset-password"
}
```

One line. One heal. Grep-able. Review-able. Audit-trailed. That's the whole point.
