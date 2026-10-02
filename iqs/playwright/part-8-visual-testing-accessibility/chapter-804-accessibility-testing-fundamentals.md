# Chapter 804 — Accessibility Testing Fundamentals

This chapter covers what accessibility testing is, WCAG standards, the
ARIA model, and the concepts that underpin automated accessibility checks.
Interviewers ask these questions increasingly often as accessibility
compliance becomes a legal requirement in many jurisdictions. Questions
at junior level focus on WCAG basics; at senior level they focus on how
to integrate accessibility gates into a CI pipeline and what automated
tools can and cannot catch.

---

## Q804.1 — What is web accessibility and why does it matter for testers?

Web accessibility means building websites that people with disabilities
can use effectively. Disabilities include visual (blindness, low vision,
colour blindness), motor (limited hand/arm mobility, tremors), auditory
(deafness, hearing loss), and cognitive (dyslexia, attention disorders).

Accessibility matters to testers for three reasons:

**Legal compliance.** In the USA, the ADA (Americans with Disabilities Act)
requires accessible digital services. In Europe, EN 301 549 and the European
Accessibility Act apply. In the UK, the Equality Act 2010. Non-compliance
has resulted in significant lawsuits and regulatory fines — including against
Domino's, Netflix, and Target.

**User reach.** Approximately 15% of the global population lives with some
form of disability. An inaccessible application excludes a significant user base.

**Quality signal.** Inaccessible code is often poorly structured HTML.
Accessibility violations frequently correlate with other quality problems:
missing labels that also affect form usability, missing alt text that also
breaks SEO, missing focus management that also affects keyboard power users.

---

## Q804.2 — What is WCAG and what do its levels mean?

WCAG (Web Content Accessibility Guidelines) is the international standard
for web accessibility, published by the W3C. Current version is WCAG 2.2.

WCAG is organised around four principles — content must be:

**Perceivable** — information must be presentable to users in ways they
can perceive (alt text for images, captions for video).

**Operable** — all functionality must be accessible via keyboard, no
content that could cause seizures, sufficient navigation aids.

**Understandable** — text must be readable, pages must behave predictably,
error messages must be helpful.

**Robust** — content must be parseable by assistive technologies, including
screen readers and braille displays.

Three conformance levels:

**Level A** — minimum requirements. If not met, the site is practically
inaccessible for some users.

**Level AA** — the standard target for most legal compliance requirements.
WCAG 2.1 AA is required by most accessibility laws.

**Level AAA** — enhanced accessibility. Aspirational for most sites — not
required and difficult to achieve on all content types.

---

## Q804.3 — What is the accessibility tree?

The accessibility tree is a parallel representation of the DOM that the
browser exposes to assistive technologies (screen readers, braille displays,
switch devices). It contains semantic information that the visual DOM does not
always make explicit.

A `<button>` element in the DOM becomes a node in the accessibility tree with:
- **Role:** `button`
- **Accessible name:** the text inside the button (or `aria-label`)
- **State:** enabled, disabled, pressed
- **Description:** `aria-describedby` content

A visually styled `<div>` that acts as a button but has no role, name, or
keyboard handler does NOT appear as a button in the accessibility tree. A
screen reader user cannot interact with it.

Playwright's `getByRole()` locator queries the accessibility tree — this
is why it is the preferred locator strategy. If `getByRole('button', { name: 'Submit' })`
cannot find the element, the element is not accessible as a button to screen
readers either. The test failure reveals an accessibility problem.

---

## Q804.4 — What are ARIA roles and why do they matter in testing?

ARIA (Accessible Rich Internet Applications) is a set of HTML attributes
that add semantic meaning to elements that lack it natively.

```html
<!-- Div acting as a button — no accessibility without ARIA -->
<div class="btn" onclick="submit()">Submit</div>

<!-- With ARIA — now exposed as a button in the accessibility tree -->
<div class="btn" role="button" tabindex="0" onclick="submit()"
     onkeypress="submit()">Submit</div>
```

Common ARIA roles relevant to testing:
- `role="button"` — interactive button
- `role="alert"` — important message that should be announced immediately
- `role="dialog"` — modal dialog
- `role="navigation"` — navigation landmark
- `role="tab"` / `role="tabpanel"` — tab interface
- `role="combobox"` — dropdown or autocomplete

ARIA states convey dynamic information:
- `aria-expanded="true/false"` — dropdown or accordion state
- `aria-selected="true/false"` — selection state in listboxes and tabs
- `aria-disabled="true"` — disabled state for custom elements
- `aria-invalid="true"` — invalid form field
- `aria-live="polite"` — region that announces dynamic updates

Testing with `getByRole('tab', { name: 'Settings', selected: true })`
implicitly validates that the tab's ARIA state is correct.

---

## Q804.5 — What is axe-core and how does it relate to Playwright?

axe-core is an open-source accessibility testing engine developed by Deque
Systems. It analyses a rendered page and reports WCAG violations — elements
that are missing labels, colour contrast failures, missing landmarks, keyboard
traps, and hundreds of other issues.

`@axe-core/playwright` is the official integration that runs axe-core
analysis within a Playwright test:

```bash
npm install --save-dev @axe-core/playwright
```

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage has no accessibility violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).analyze();

  // Fail the test if any violations are found
  expect(results.violations).toEqual([]);
});
```

When `results.violations` is non-empty, each entry contains:
- `id` — the rule that fired (e.g., `"color-contrast"`)
- `description` — what the rule checks
- `impact` — `"critical"`, `"serious"`, `"moderate"`, or `"minor"`
- `nodes` — the specific elements that violated the rule, with HTML context

---

## Q804.6 — What violation impact levels exist and what do they mean?

axe-core classifies every violation by impact:

**Critical** — prevents users with disabilities from accessing content.
Must be fixed immediately. Examples: images with no alt attribute on an
informational image, form inputs with no associated label.

**Serious** — significantly impairs access but does not completely block it.
Examples: buttons with no accessible name, links with no discernible text.

**Moderate** — creates difficulty but the user can work around it with effort.
Examples: incorrect heading hierarchy, missing landmark regions.

**Minor** — small issues that have a limited impact on accessibility.
Examples: redundant ARIA roles on elements that already have native semantics.

For CI gates, start by failing only on `critical` violations — this prevents
blocking builds for minor issues that need design input:

```typescript
const results = await new AxeBuilder({ page }).analyze();
const criticalViolations = results.violations.filter(v => v.impact === 'critical');
expect(criticalViolations).toEqual([]);
```

Introduce `serious` violations after the team has a process for reviewing
and addressing accessibility issues.

---

## Q804.7 — What can automated accessibility testing NOT catch?

Automated tools like axe-core catch approximately 30–40% of WCAG issues.
The rest require human review or user testing.

**Cannot be caught automatically:**
- Whether alt text is meaningful (axe knows if it is missing, not if it is
  appropriate — "image.png" passes automation but fails human review)
- Whether reading order makes logical sense
- Whether error messages are helpful and clear
- Whether complex workflows are understandable for cognitive disabilities
- Whether videos have accurate captions (only presence can be verified)
- Whether colour choices are aesthetically distinguishable (contrast ratio
  can be calculated but visual clarity cannot)
- Keyboard navigation flow — whether tab order is logical requires manual
  traversal

**Can be caught automatically:**
- Missing alt text on images
- Form inputs without labels
- Colour contrast ratios below WCAG thresholds
- Missing page language declaration (`<html lang="en">`)
- Duplicate IDs
- Missing skip-navigation links
- Invalid ARIA attribute usage

Automated accessibility testing is a floor, not a ceiling. It catches the
most common technical violations but cannot replace manual review and user
testing with disabled users.

---

## Q804.8 — How do you target a specific page component for an accessibility scan?

Run axe-core on a specific region of the page rather than the whole page:

```typescript
test('navigation accessibility', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .include('nav')           // CSS selector for the component to scan
    .analyze();

  expect(results.violations).toEqual([]);
});

test('login form accessibility', async ({ page }) => {
  await page.goto('/login');

  const results = await new AxeBuilder({ page })
    .include('[data-testid="login-form"]')
    .analyze();

  expect(results.violations).toEqual([]);
});
```

`include()` focuses the scan on a subtree. `exclude()` omits elements:

```typescript
// Exclude third-party widget that you cannot control
const results = await new AxeBuilder({ page })
  .exclude('#intercom-widget')
  .exclude('#google-recaptcha')
  .analyze();
```

---

## Q804.9 — How do you filter by WCAG tags to run only specific rule sets?

axe-core tags let you run only rules relevant to a specific WCAG level:

```typescript
// Only WCAG 2.1 Level AA rules
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
  .analyze();

// Only Level A rules (minimum compliance)
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a'])
  .analyze();

// Best practices (not formal WCAG — extra recommendations)
const results = await new AxeBuilder({ page })
  .withTags(['best-practice'])
  .analyze();
```

Common tag values: `wcag2a`, `wcag2aa`, `wcag2aaa`, `wcag21a`, `wcag21aa`,
`wcag22aa`, `best-practice`, `section508`.

For a legal compliance gate, use `['wcag2a', 'wcag2aa', 'wcag21aa']` — this
covers the rules required by most accessibility laws.

---

## Q804.10 — How do you disable specific axe rules that produce known false positives?

```typescript
// Disable specific rules
const results = await new AxeBuilder({ page })
  .disableRules(['color-contrast'])  // Disabled while design team reviews
  .analyze();

// Disable rules for a known third-party element
const results = await new AxeBuilder({ page })
  .exclude('#legacy-widget')          // Excludes from all rules
  .analyze();
```

Document every disabled rule in a comment explaining why it is disabled
and when it will be re-enabled:

```typescript
const results = await new AxeBuilder({ page })
  // color-contrast: design team is updating the theme in Sprint 24 (ticket A11Y-42)
  .disableRules(['color-contrast'])
  .analyze();
```

Never use `disableRules` as a permanent solution. Treat it like `test.fixme`
— a tracked technical debt item with an owner and a deadline.

---

## Q804.11 — How do you log violations for debugging?

```typescript
test('check for accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');

  const results = await new AxeBuilder({ page }).analyze();

  if (results.violations.length > 0) {
    // Log a readable summary for the failing test output
    const violationSummary = results.violations.map(v => ({
      rule:    v.id,
      impact:  v.impact,
      summary: v.description,
      nodes:   v.nodes.map(n => n.html).slice(0, 2), // first 2 affected elements
    }));
    console.log('Accessibility violations:', JSON.stringify(violationSummary, null, 2));
  }

  expect(results.violations).toEqual([]);
});
```

Attach violations to the Playwright test report:

```typescript
test('accessibility scan', async ({ page }, testInfo) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();

  await testInfo.attach('accessibility-results', {
    body:        JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });

  expect(results.violations).toEqual([]);
});
```

---

## Q804.12 — What is keyboard accessibility and how do you test it?

Keyboard accessibility means all functionality is operable using only the
keyboard — no mouse required. Users with motor disabilities, power users,
and screen reader users all depend on keyboard navigation.

Key requirements:
- All interactive elements must be focusable (reachable with Tab)
- Focus order must be logical (follows visual/reading order)
- Focused element must be visually indicated (focus ring)
- No keyboard traps (Tab cannot reach an element and then be unable to leave)

```typescript
test('modal can be closed with keyboard', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Modal' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // Close with Escape key
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('form is fully navigable by Tab', async ({ page }) => {
  await page.goto('/contact');

  // Start at the first field
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('First Name')).toBeFocused();

  // Tab to the next field
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Last Name')).toBeFocused();

  // Tab to submit
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Submit' })).toBeFocused();
});
```

---

## Q804.13 — How do you test colour contrast?

Colour contrast testing is best done with automated tools — axe-core's
`color-contrast` rule checks WCAG 2.1 SC 1.4.3 (minimum contrast ratio
of 4.5:1 for normal text, 3:1 for large text):

```typescript
test('page passes colour contrast requirements', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .analyze();

  const contrastViolations = results.violations.filter(
    v => v.id === 'color-contrast'
  );

  if (contrastViolations.length > 0) {
    contrastViolations.forEach(v => {
      v.nodes.forEach(n => {
        console.log(`Low contrast: ${n.html}`);
        console.log(`Fix: ${n.any[0]?.message}`);
      });
    });
  }

  expect(contrastViolations).toHaveLength(0);
});
```

Note: `color-contrast` is one of the few axe rules that may produce false
positives or false negatives on dynamically themed pages. Verify flagged
elements manually with a contrast checker tool.

---

## Q804.14 — How do you test that images have appropriate alt text?

```typescript
test('informational images have alt text', async ({ page }) => {
  await page.goto('/');

  // axe-core catches missing alt text automatically
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a'])
    .analyze();

  const altViolations = results.violations.filter(
    v => v.id === 'image-alt'
  );
  expect(altViolations).toHaveLength(0);
});

// Manual check — verify alt text content is meaningful (axe cannot do this)
test('product images have descriptive alt text', async ({ page }) => {
  await page.goto('/products');

  const images = page.locator('img[alt]');
  const count  = await images.count();

  for (let i = 0; i < count; i++) {
    const alt = await images.nth(i).getAttribute('alt');

    // Reject empty alt, file names, and generic placeholders
    expect(alt).not.toBe('');
    expect(alt).not.toMatch(/^(image|img|photo|picture)\d*$/i);
    expect(alt).not.toMatch(/\.(jpg|png|gif|webp)$/i);
  }
});
```

---

## Q804.15 — How do you write an accessibility fixture for reuse across tests?

```typescript
// fixtures/accessibility.ts
import AxeBuilder from '@axe-core/playwright';
import { test as base, Page } from '@playwright/test';

type A11yFixture = {
  checkA11y: (options?: {
    tags?:  string[];
    rules?: string[];
    scope?: string;
  }) => Promise<void>;
};

export const test = base.extend<A11yFixture>({
  checkA11y: async ({ page }, use) => {
    const check = async (options: {
      tags?:  string[];
      rules?: string[];
      scope?: string;
    } = {}) => {
      let builder = new AxeBuilder({ page })
        .withTags(options.tags ?? ['wcag2a', 'wcag2aa', 'wcag21aa']);

      if (options.scope) builder = builder.include(options.scope);
      if (options.rules) builder = builder.disableRules(options.rules);

      const results = await builder.analyze();
      const critical = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(critical).toEqual([]);
    };

    await use(check);
  },
});

// In tests
test('login page accessibility', async ({ page, checkA11y }) => {
  await page.goto('/login');
  await checkA11y({ scope: '#login-form' });
});
```

---

## Q804.16 — What are ARIA live regions and how do you test them?

ARIA live regions announce dynamic content changes to screen readers without
the user having to navigate to the updated element. They are essential for:
toast notifications, form validation errors, loading state changes, and
real-time data updates.

```html
<div role="alert" aria-live="assertive">Error: Email is required</div>
<div aria-live="polite">Loading complete — 42 results found</div>
```

- `aria-live="polite"` — announces when the user is idle (non-intrusive)
- `aria-live="assertive"` — announces immediately (for critical errors)
- `role="alert"` — implies `aria-live="assertive"`

Testing live regions:

```typescript
test('form validation error is announced', async ({ page }) => {
  await page.goto('/contact');
  await page.getByRole('button', { name: 'Submit' }).click();

  // The alert role should appear with the error message
  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('Email is required');

  // Verify it has the correct ARIA attributes
  await expect(alert).toHaveAttribute('aria-live');
});
```

---

## Q804.17 — How do you add accessibility checks to CI as a quality gate?

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Gate

on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Run accessibility tests
        run: npx playwright test --grep @a11y

      - name: Upload violations report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: accessibility-violations
          path: playwright-report/
```

In `playwright.config.ts`, create a dedicated accessibility project:

```typescript
{
  name:      'accessibility',
  testMatch: /.*\.a11y\.spec\.ts/,
  use:       { ...devices['Desktop Chrome'] },
  // Run after main tests pass
}
```

Tag tests with `@a11y` and run them as a blocking gate on PR. Start with
critical violations only — do not block the build on moderate/minor until
the team has a remediation process established.

---

## Q804.18 — In your project, how did you integrate accessibility testing?

In our OrangeHRM framework, we added accessibility tests as a separate
`*.a11y.spec.ts` suite at Level 7 (Reporting & Test Organisation), tagged
`@a11y` and run as a separate CI job.

We made three deliberate decisions about scope. First, we only scan the
pages our team maintains — we excluded known third-party widgets (a live
chat component and a date picker library) using `.exclude()`. Third-party
violations that we cannot fix should not block our builds.

Second, we gate on critical and serious violations only, using impact
filtering. OrangeHRM has a number of moderate contrast issues in its
existing design that predate our project — failing the build on those would
have blocked all work for weeks. The moderate violations are tracked in
a separate backlog ticket tagged for the design team.

Third, we use the accessibility fixture pattern — a `checkA11y()` helper
that all a11y tests share. This means changing the default WCAG tag set
(from `wcag2aa` to `wcag21aa` when WCAG 2.1 support became relevant) was
a one-line change in the fixture, not a change in every test file.

The most valuable violation we caught: the Employee Search form's date
range inputs had no associated labels — only placeholder text. axe-core
flagged them as `label` rule violations. This was a real accessibility
failure that functional tests had been passing through for months.

---

## Chapter Summary

- WCAG (Web Content Accessibility Guidelines) defines three conformance levels: A (minimum), AA (legal compliance target), AAA (enhanced).
- The accessibility tree is a semantic representation of the DOM exposed to assistive technologies — Playwright's `getByRole()` queries it.
- axe-core (`@axe-core/playwright`) is the primary automated accessibility testing tool — it catches ~30–40% of WCAG issues.
- Four impact levels: critical (blocks access), serious (significantly impairs), moderate (creates difficulty), minor (limited impact).
- Gate CI on critical violations first; add serious violations once a remediation process is established.
- `AxeBuilder.include(selector)` scans a specific component; `.exclude(selector)` skips elements you cannot control; `.withTags(['wcag2aa'])` runs only specific WCAG rules.
- Automated tools cannot check: alt text meaningfulness, reading order logic, caption accuracy, or cognitive clarity — these require human review.
- ARIA roles provide semantic meaning to custom elements; ARIA states (`aria-expanded`, `aria-invalid`) convey dynamic state; ARIA live regions announce dynamic content to screen readers.
- Use a shared `checkA11y()` fixture to centralise accessibility scan logic and make rule changes a single-point update.
- Colour contrast (`color-contrast` rule) and missing labels (`label`, `image-alt` rules) are the most common critical violations caught by automated scanning.
