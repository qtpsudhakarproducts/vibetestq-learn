# Chapter 805 — Accessibility Testing with Playwright

This chapter is the practical deep-dive: the full `@axe-core/playwright`
API, building reusable accessibility fixtures, integrating into the POM
framework, auditing keyboard navigation with Playwright assertions, and
building an accessibility gate in CI. Interviewers at senior level expect
candidates to demonstrate a complete end-to-end accessibility testing
strategy, not just knowledge that axe-core exists.

---

## Q805.1 — Walk through setting up @axe-core/playwright from scratch.

```bash
npm install --save-dev @axe-core/playwright
```

Basic usage in a test:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('login page has no accessibility violations', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});
```

`AxeBuilder` takes the Playwright `page` object. `.analyze()` injects the
axe-core script, runs the audit on the current DOM, and returns a results
object. `results.violations` is the array of failing rules — assert it is
empty to block on any violation.

The results object also contains `results.passes` (rules that passed),
`results.incomplete` (rules that need manual review), and `results.inapplicable`
(rules that did not apply to this page).

---

## Q805.2 — What does the axe-core results object look like?

```typescript
const results = await new AxeBuilder({ page }).analyze();

// Structure of results.violations[0]
{
  id:          'label',                          // rule ID
  impact:      'critical',                       // critical | serious | moderate | minor
  description: 'Ensures every form element has a label',
  help:        'Form elements must have labels',
  helpUrl:     'https://dequeuniversity.com/rules/axe/4.7/label',
  nodes: [
    {
      html:    '<input type="email" placeholder="Enter email">',
      impact:  'critical',
      target:  ['#email-input'],
      any:     [{ message: 'Element does not have an aria-label attribute' }],
      all:     [],
      none:    [],
      failureSummary: 'Fix any of the following: ...',
    }
  ]
}
```

The `nodes` array identifies every element on the page that violates the
rule. `nodes[n].html` gives you the HTML snippet — the quickest way to find
the problem. `nodes[n].target` gives you the CSS selector path.

For readable test output, log the violations before asserting:

```typescript
if (results.violations.length > 0) {
  console.table(
    results.violations.map(v => ({
      rule:    v.id,
      impact:  v.impact,
      count:   v.nodes.length,
      element: v.nodes[0]?.html?.substring(0, 80),
    }))
  );
}
expect(results.violations).toEqual([]);
```

---

## Q805.3 — How do you build a reusable accessibility fixture?

```typescript
// fixtures/a11y.fixture.ts
import { test as base, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export type A11yOptions = {
  tags?:           string[];     // default: WCAG 2.0 AA + 2.1 AA
  disabledRules?:  string[];     // rules to skip (with documented reason)
  include?:        string;       // CSS selector to scope the scan
  exclude?:        string[];     // selectors to exclude from scan
  onlyImpact?:     ('critical' | 'serious' | 'moderate' | 'minor')[];
};

export type A11yFixtures = {
  checkA11y: (options?: A11yOptions) => Promise<void>;
};

export const test = base.extend<A11yFixtures>({
  checkA11y: async ({ page }, use) => {
    const check = async (opts: A11yOptions = {}) => {
      const tags = opts.tags ?? ['wcag2a', 'wcag2aa', 'wcag21aa'];

      let builder = new AxeBuilder({ page }).withTags(tags);

      if (opts.include)         builder = builder.include(opts.include);
      if (opts.exclude)         opts.exclude.forEach(s => { builder = builder.exclude(s); });
      if (opts.disabledRules)   builder = builder.disableRules(opts.disabledRules);

      const results = await builder.analyze();

      const violations = opts.onlyImpact
        ? results.violations.filter(v => opts.onlyImpact!.includes(v.impact as any))
        : results.violations;

      if (violations.length > 0) {
        const summary = violations.map(v =>
          `[${v.impact}] ${v.id}: ${v.nodes.length} element(s) — ${v.nodes[0]?.html?.substring(0, 60)}`
        ).join('\n');
        throw new Error(`Accessibility violations found:\n${summary}`);
      }
    };

    await use(check);
  },
});

export { expect } from '@playwright/test';
```

Usage:

```typescript
// tests/a11y/login.a11y.spec.ts
import { test, expect } from '../fixtures/a11y.fixture';

test('login page @a11y', async ({ page, checkA11y }) => {
  await page.goto('/login');
  await checkA11y({ onlyImpact: ['critical', 'serious'] });
});

test('login form only @a11y', async ({ page, checkA11y }) => {
  await page.goto('/login');
  await checkA11y({ include: '#login-form' });
});
```

---

## Q805.4 — How do you integrate accessibility checks into a Page Object?

Add an optional `auditA11y()` method to the BasePage so accessibility
checks can be triggered from within the POM layer:

```typescript
// pages/BasePage.ts
import { Page, Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export abstract class BasePage {
  constructor(protected page: Page) {}

  async auditA11y(options?: {
    scope?:   string;
    tags?:    string[];
  }): Promise<void> {
    const tags = options?.tags ?? ['wcag2a', 'wcag2aa', 'wcag21aa'];
    let builder = new AxeBuilder({ page: this.page }).withTags(tags);
    if (options?.scope) builder = builder.include(options.scope);

    const results = await builder.analyze();
    const critical = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    if (critical.length > 0) {
      const msg = critical.map(v =>
        `${v.id} (${v.impact}): ${v.nodes[0]?.html?.substring(0, 60)}`
      ).join('\n');
      throw new Error(`Critical a11y violations on ${this.page.url()}:\n${msg}`);
    }
  }
}

// pages/LoginPage.ts
export class LoginPage extends BasePage {
  async goto() {
    await this.page.goto('/login');
  }

  async auditLoginForm() {
    await this.auditA11y({ scope: '#login-form' });
  }
}

// In a test
test('login form is accessible @a11y', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.auditLoginForm();
});
```

---

## Q805.5 — How do you test keyboard navigation with Playwright?

```typescript
test('entire contact form is keyboard-accessible', async ({ page }) => {
  await page.goto('/contact');

  // Start keyboard navigation from the top of the page
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('First Name')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Last Name')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Message')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Submit' })).toBeFocused();

  // Submit via keyboard
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alert')).toBeVisible();
});
```

To verify that focus is visible (focus ring is showing):

```typescript
test('focused elements have visible focus indicator', async ({ page }) => {
  await page.goto('/login');
  await page.keyboard.press('Tab');

  const focusedElement = page.locator(':focus');
  await expect(focusedElement).toBeVisible();

  // Check CSS outline is not 'none'
  const outline = await focusedElement.evaluate(
    el => window.getComputedStyle(el).outlineStyle
  );
  expect(outline).not.toBe('none');
});
```

---

## Q805.6 — How do you test that a modal traps focus correctly?

WCAG 2.4.3 requires that modal dialogs trap keyboard focus — Tab should
cycle through the modal's interactive elements and not escape to the page
behind the overlay:

```typescript
test('modal traps keyboard focus', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Delete Account' }).click();

  const modal = page.getByRole('dialog', { name: 'Confirm Delete' });
  await expect(modal).toBeVisible();

  // Tab through all focusable elements in the modal
  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => document.activeElement?.textContent);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  // After cycling through all elements, focus should wrap back to the first
  const wrappedFocus = await page.evaluate(() => document.activeElement?.textContent);
  expect(wrappedFocus).toBe(firstFocus);

  // Focus must remain within the modal — test that the page behind is not focused
  const activeElementRole = await page.evaluate(
    () => document.activeElement?.getAttribute('role') ?? document.activeElement?.tagName
  );
  const isInsideModal = await modal.locator(':focus').count();
  expect(isInsideModal).toBeGreaterThan(0);
});

test('Escape key closes the modal', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Open Settings' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
```

---

## Q805.7 — How do you test screen reader announcements?

Playwright cannot directly test what a screen reader vocalises — that
requires manual testing with VoiceOver, NVDA, or JAWS. However, you can
test the DOM properties that screen readers read from:

```typescript
test('form error messages are announced', async ({ page }) => {
  await page.goto('/registration');
  await page.getByRole('button', { name: 'Create Account' }).click();

  // Check the error message exists with role="alert" (auto-announced)
  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('Email is required');

  // Verify the errored field is linked to the error message
  const emailInput = page.getByLabel('Email');
  const describedById = await emailInput.getAttribute('aria-describedby');
  expect(describedById).toBeTruthy();

  // Verify the describing element contains the error text
  const errorEl = page.locator(`#${describedById}`);
  await expect(errorEl).toContainText('required');
});

test('success toast is announced politely', async ({ page }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  const toast = page.getByRole('status'); // role="status" implies aria-live="polite"
  await expect(toast).toBeVisible();
  await expect(toast).toContainText('Profile saved');
  await expect(toast).toHaveAttribute('aria-live', 'polite');
});
```

---

## Q805.8 — How do you test that images are accessible?

```typescript
test('page images meet accessibility requirements', async ({ page }) => {
  await page.goto('/products');

  // axe-core catches missing and empty alt text
  const axeResults = await new AxeBuilder({ page })
    .withTags(['wcag2a'])
    .analyze();

  const altViolations = axeResults.violations.filter(v => v.id === 'image-alt');
  expect(altViolations).toHaveLength(0);
});

test('informational images have meaningful alt text', async ({ page }) => {
  await page.goto('/products');

  // Manual check — axe cannot assess if alt text is meaningful
  const images = page.locator('img:not([role="presentation"]):not([alt=""])');

  for (const img of await images.all()) {
    const alt = await img.getAttribute('alt');
    expect(alt).toBeTruthy();

    // Reject file names and generic placeholders
    expect(alt).not.toMatch(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
    expect(alt).not.toMatch(/^(image|photo|picture|img|icon)\s*\d*$/i);
    // Alt text should be more than a single character
    expect(alt!.length).toBeGreaterThan(3);
  }
});

test('decorative images are hidden from screen readers', async ({ page }) => {
  await page.goto('/home');

  // Decorative images should have empty alt="" or role="presentation"
  const decorativeImages = page.locator(
    'img[alt=""], img[role="presentation"], img[aria-hidden="true"]'
  );
  // Just verifying the pattern exists (not that count > 0)
  const count = await decorativeImages.count();
  console.log(`${count} decorative images correctly marked`);
});
```

---

## Q805.9 — How do you test heading hierarchy?

Correct heading hierarchy (`h1` → `h2` → `h3`, no skipped levels) is
required by WCAG 1.3.1. axe-core's `heading-order` rule catches level
skips:

```typescript
test('heading hierarchy is correct', async ({ page }) => {
  await page.goto('/');

  const axeResults = await new AxeBuilder({ page })
    .withTags(['wcag2a'])
    .analyze();

  const headingViolations = axeResults.violations.filter(
    v => v.id === 'heading-order'
  );
  expect(headingViolations).toHaveLength(0);
});

// Manual verification — extract and log all headings for review
test('page has exactly one h1', async ({ page }) => {
  await page.goto('/');

  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBe(1);
});

test('log heading structure for manual review', async ({ page }) => {
  await page.goto('/');

  const headings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
      .map(h => ({ level: h.tagName, text: h.textContent?.trim().substring(0, 50) }));
  });

  console.table(headings);
  // Visually inspect the logged table — no automated assertion here
});
```

---

## Q805.10 — How do you test skip navigation links?

Skip navigation links allow keyboard users to jump past repetitive navigation
directly to the main content. They are WCAG 2.4.1 (Level A):

```typescript
test('skip navigation link is present and functional', async ({ page }) => {
  await page.goto('/');

  // Press Tab once — the skip link should be the first focusable element
  await page.keyboard.press('Tab');

  const skipLink = page.getByRole('link', { name: /skip to/i });
  await expect(skipLink).toBeFocused();

  // Activate the skip link
  await page.keyboard.press('Enter');

  // Focus should now be on the main content area
  const main = page.getByRole('main');
  await expect(main).toBeFocused();
});

test('skip link is visually hidden until focused', async ({ page }) => {
  await page.goto('/');

  const skipLink = page.getByRole('link', { name: /skip to main/i });

  // Before focus — visually hidden (but present in the DOM)
  // Note: we can't easily test CSS 'transform: translateY(-100%)' so we
  // test that it becomes visible on focus
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible(); // visible when focused
});
```

---

## Q805.11 — How do you test colour contrast programmatically?

axe-core's `color-contrast` rule verifies the WCAG 2.1 SC 1.4.3 contrast
ratio requirements (4.5:1 for normal text, 3:1 for large text):

```typescript
test('all text meets colour contrast requirements', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .analyze();

  const contrastViolations = results.violations.filter(
    v => v.id === 'color-contrast'
  );

  if (contrastViolations.length > 0) {
    const details = contrastViolations[0].nodes.map(n => ({
      element:  n.html.substring(0, 80),
      fix:      n.any[0]?.message,
    }));
    console.table(details);
  }

  expect(contrastViolations).toHaveLength(0);
});
```

To programmatically compute the contrast ratio of a specific element:

```typescript
test('primary button contrast ratio is sufficient', async ({ page }) => {
  await page.goto('/');

  const ratio = await page.evaluate(() => {
    const btn      = document.querySelector('.btn-primary')!;
    const style    = window.getComputedStyle(btn);
    const bg       = style.backgroundColor;
    const color    = style.color;

    // Helper: parse rgb(R, G, B) → relative luminance
    function luminance(rgb: string): number {
      const [r, g, b] = rgb.match(/\d+/g)!.map(Number).map(c => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    const l1 = luminance(color);
    const l2 = luminance(bg);
    const lighter = Math.max(l1, l2);
    const darker  = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  });

  // WCAG AA requires 4.5:1 for normal text
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
```

---

## Q805.12 — How do you test dynamic content accessibility (SPAs, route changes)?

Single-page applications do not reload on navigation — they swap DOM content.
Screen readers need the new page title and/or a focus management event to
announce the change to users:

```typescript
test('SPA route change announces new page title', async ({ page }) => {
  await page.goto('/');

  // Click a nav link
  await page.getByRole('link', { name: 'Products' }).click();

  // Verify the page title updated (screen readers announce title changes)
  await expect(page).toHaveTitle(/Products/);

  // Verify focus moved to the main content area or the new heading
  const heading = page.getByRole('heading', { level: 1, name: /Products/i });
  await expect(heading).toBeVisible();
});

test('loading state is announced', async ({ page }) => {
  await page.goto('/search');
  await page.getByRole('searchbox').fill('playwright');
  await page.keyboard.press('Enter');

  // Loading indicator should have an appropriate live region
  const loadingStatus = page.locator('[aria-live="polite"], [role="status"]');
  await expect(loadingStatus).toBeVisible();

  // After results load, the count should be announced
  await expect(
    page.locator('[aria-live="polite"]')
  ).toContainText(/result/i);
});
```

---

## Q805.13 — How do you write an accessibility test suite that covers all major WCAG criteria?

```typescript
// tests/a11y/full-audit.a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { name: 'Login',          path: '/login'      },
  { name: 'Dashboard',      path: '/dashboard'  },
  { name: 'Employee List',  path: '/employees'  },
  { name: 'Profile',        path: '/profile'    },
];

for (const { name, path } of pages) {
  test.describe(`${name} page accessibility`, () => {
    test(`${name} — WCAG 2.1 AA @a11y`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .exclude('#third-party-widget') // known exclusion
        .analyze();

      const blocking = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(blocking, `${name} has ${blocking.length} blocking violations`).toHaveLength(0);
    });

    test(`${name} — one h1 heading @a11y`, async ({ page }) => {
      await page.goto(path);
      expect(await page.locator('h1').count()).toBe(1);
    });

    test(`${name} — page has lang attribute @a11y`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang');
    });
  });
}
```

---

## Q805.14 — How do you prevent regressions from known violations that are not yet fixed?

Track known violations as documented exceptions — not silent ignores:

```typescript
// a11y/known-violations.ts
export const KNOWN_VIOLATIONS: Record<string, string[]> = {
  // Format: 'page-path': ['rule-id', ...]
  // Documented reason and ticket number required

  '/dashboard': [
    // color-contrast: Design token update in progress — ticket A11Y-47, due Sprint 28
    'color-contrast',
  ],
  '/legacy-report': [
    // label: Legacy form — migration planned Q3 — ticket A11Y-52
    'label',
    // heading-order: Legacy template — ticket A11Y-53
    'heading-order',
  ],
};

// In tests
import { KNOWN_VIOLATIONS } from '../a11y/known-violations';

test('dashboard a11y', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page })
    .disableRules(KNOWN_VIOLATIONS['/dashboard'] ?? [])
    .analyze();

  expect(results.violations).toHaveLength(0);
});
```

This pattern makes every exception explicit, searchable, and linked to a
ticket. When the ticket is resolved, the rule is re-enabled. The known
violations file is a living document of accessibility debt — reviewable
in every PR.

---

## Q805.15 — How do you attach accessibility results to the Playwright HTML report?

```typescript
test('dashboard accessibility audit @a11y', async ({ page }, testInfo) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page }).analyze();

  // Always attach the full results for review (pass or fail)
  await testInfo.attach('axe-results', {
    body:        JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });

  // Attach a human-readable summary
  if (results.violations.length > 0) {
    const summary = results.violations.map(v =>
      `${v.impact?.toUpperCase()} | ${v.id}\n` +
      `  ${v.description}\n` +
      v.nodes.map(n => `  → ${n.html.substring(0, 80)}`).join('\n')
    ).join('\n\n');

    await testInfo.attach('violations-summary', {
      body:        summary,
      contentType: 'text/plain',
    });
  }

  expect(results.violations).toHaveLength(0);
});
```

The HTML report then shows the axe results file as a downloadable attachment
and the violations summary as readable text inline.

---

## Q805.16 — How do you test accessible names on interactive elements?

All interactive elements must have an accessible name — the text a screen
reader announces when the element receives focus:

```typescript
test('all buttons have accessible names', async ({ page }) => {
  await page.goto('/');

  // axe's 'button-name' rule catches this automatically
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a'])
    .analyze();

  const buttonNameViolations = results.violations.filter(
    v => v.id === 'button-name'
  );
  expect(buttonNameViolations).toHaveLength(0);
});

test('icon buttons have aria-label', async ({ page }) => {
  await page.goto('/');

  // Manual check — find all buttons with no visible text
  const iconButtons = page.locator('button:has(svg):not(:has(*:not(svg)))');

  for (const btn of await iconButtons.all()) {
    const label      = await btn.getAttribute('aria-label');
    const labelledBy = await btn.getAttribute('aria-labelledby');
    const title      = await btn.locator('title').count();

    const hasName = label || labelledBy || title > 0;
    expect(hasName).toBeTruthy();
  }
});
```

---

## Q805.17 — How do you test form validation accessibility?

```typescript
test('form validation errors are accessible', async ({ page }) => {
  await page.goto('/registration');

  // Submit without filling in any fields
  await page.getByRole('button', { name: 'Create Account' }).click();

  // 1. Error messages are present
  const errors = page.locator('[role="alert"], .error-message');
  await expect(errors.first()).toBeVisible();

  // 2. The invalid field has aria-invalid="true"
  const emailField = page.getByLabel('Email');
  await expect(emailField).toHaveAttribute('aria-invalid', 'true');

  // 3. The field is described by its error message
  const describedBy = await emailField.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  const errorMessage = page.locator(`#${describedBy}`);
  await expect(errorMessage).toContainText(/required|invalid/i);

  // 4. Focus moves to the first invalid field or the error summary
  const focusedId = await page.evaluate(
    () => document.activeElement?.id ?? ''
  );
  expect(focusedId).toBeTruthy(); // focus should have moved
});
```

---

## Q805.18 — In your project, what was the full accessibility testing implementation?

In our OrangeHRM framework, accessibility testing was implemented at Level 7
as a dedicated `*.a11y.spec.ts` suite with three tiers of coverage.

**Tier 1 — Automated axe-core scans.** Every major page has an axe scan
tagged `@a11y`. We use the `checkA11y` fixture that gates on critical and
serious violations. The fixture also maintains the `KNOWN_VIOLATIONS` map —
four violations across two legacy pages that are tracked in the backlog.

**Tier 2 — Keyboard navigation tests.** We have a `keyboard.a11y.spec.ts`
file that specifically tests: tab order through the Login form, Escape key
closes the Leave application modal, the sidebar navigation is fully keyboard
traversable using arrow keys, and the Delete confirmation dialog traps focus.
These tests use only `page.keyboard.press()` — no mouse interactions at all.

**Tier 3 — Attribute-level assertions.** Separate tests verify that: all
form inputs have associated labels, all error messages are linked via
`aria-describedby`, the page `<html>` tag has `lang="en"`, and there is
exactly one `<h1>` on every page.

The axe scan caught two real violations we had not noticed: a pair of icon
buttons in the PIM toolbar had no `aria-label` (the buttons had tooltips
on hover but nothing in the accessibility tree), and the "Sort by" dropdown
had `<select>` without a `<label>` association — it only had a visual label
as a sibling `<div>`. Both were fixed within the same sprint they were found.

---

## Chapter Summary

- `@axe-core/playwright` is installed as a dev dependency; `new AxeBuilder({ page }).analyze()` runs the audit and returns a `violations` array.
- `results.violations[n]` contains: `id` (rule), `impact`, `description`, `helpUrl`, and `nodes` (affected elements with HTML snippets and CSS targets).
- Use `.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])` to target specific WCAG levels; `.include(selector)` to scope the scan; `.disableRules([...])` to skip known violations.
- Build a `checkA11y` fixture to centralise axe configuration and make the API consistent across all accessibility tests.
- Keyboard tests use `page.keyboard.press('Tab')` and `expect(element).toBeFocused()` to verify tab order, modal focus trapping, and Escape key behaviour.
- Test screen reader compatibility by verifying DOM attributes: `aria-live`, `role="alert"`, `aria-invalid`, `aria-describedby`, `aria-label`.
- Track known violations in an explicit `KNOWN_VIOLATIONS` map with ticket references — never use `disableRules` silently.
- Attach axe results to the Playwright HTML report with `testInfo.attach()` for reviewable accessibility audit trails.
- Test form validation accessibility: `aria-invalid="true"` on invalid fields, error messages linked via `aria-describedby`, focus movement to the first error.
- axe-core catches ~30–40% of WCAG issues; complement automated scans with keyboard navigation tests and attribute-level assertions to increase coverage.
