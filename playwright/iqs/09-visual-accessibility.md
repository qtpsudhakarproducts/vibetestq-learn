# Visual Testing & Accessibility — Interview Questions

---

## Q: What is visual testing?

**A:** Visual testing captures screenshots of UI pages or components and compares them against approved baseline images. Any visual difference — a layout shift, a colour change, a missing element, a font change — is flagged for review. It catches UI regressions that functional tests miss entirely, because functional tests don't verify how things look — only whether they're present or interactive.

---

## Q: What problems does visual testing detect that functional tests miss?

**A:** Unintended layout shifts. CSS changes that break spacing or alignment. Incorrect colours or font sizes. Elements that are present in the DOM but visually broken or overlapping. Component regressions introduced by dependency upgrades. Responsive layout breakages at different viewports. Text truncation or overflow issues.

---

## Q: What is visual regression testing?

**A:** Visual regression testing compares screenshots from the current test run against a set of baseline screenshots captured from a known-good state. If the difference exceeds an acceptable threshold, the test fails. This ensures that visual changes are intentional — code authors must review and approve any visual differences before they're accepted as the new baseline.

---

## Q: What is a visual baseline?

**A:** The baseline is the reference set of approved screenshots. They represent the intended look of the application at a given point in time. When you first run a visual test, the screenshots are saved as the baseline. Future runs compare against them. When the UI intentionally changes, you update the baseline manually to accept the new look.

---

## Q: What is toHaveScreenshot() in Playwright?

**A:** `toHaveScreenshot()` is the built-in visual assertion. It captures a screenshot of the element or full page and compares it to a stored baseline file. On the first run, the baseline is created automatically. On subsequent runs, any pixel difference beyond the configured threshold causes the test to fail.

```typescript
await expect(page).toHaveScreenshot('homepage.png');
await expect(page.getByTestId('chart')).toHaveScreenshot('chart.png', { maxDiffPixels: 50 });
```

---

## Q: What is the maxDiffPixels option?

**A:** `maxDiffPixels` sets the maximum number of pixels that may differ between the captured screenshot and the baseline before the test fails. Use it to tolerate minor rendering differences (anti-aliasing, sub-pixel rounding) that don't represent real regressions. Keep the threshold small — too high a value means real visual bugs can slip through.

---

## Q: What is masking in visual tests?

**A:** Masking excludes specific regions of a screenshot from the comparison. You pass a list of locators as the `mask` option — those areas are blacked out in both the captured and baseline images before comparing. Use masking to hide dynamic content: timestamps, rotating banners, ads, or loading animations that change between runs and would cause false failures.

```typescript
await expect(page).toHaveScreenshot({ mask: [page.getByTestId('timestamp')] });
```

---

## Q: What are the main challenges in visual testing?

**A:** Dynamic content (dates, user names, ads) causes false positives without masking. Browser and OS rendering differences (font anti-aliasing, sub-pixel rendering) cause minor pixel variations. Animations captured mid-frame produce inconsistent screenshots. Maintaining baselines as designs evolve intentionally. Handling multiple viewports and responsive layouts requires separate baseline sets.

---

## Q: What is accessibility testing?

**A:** Accessibility testing verifies that a web application can be used by people with disabilities — those who rely on screen readers, keyboard-only navigation, magnification, or high contrast modes. It checks compliance with standards like WCAG and ensures the application is perceivable, operable, and understandable for all users.

---

## Q: What is WCAG?

**A:** WCAG (Web Content Accessibility Guidelines) is the international standard for web accessibility, published by the W3C. It is organised around four principles — **Perceivable**, **Operable**, **Understandable**, and **Robust** (POUR). It defines three conformance levels: A (minimum), AA (required by most regulations), and AAA (enhanced). Most organisations target Level AA.

---

## Q: What are ARIA roles?

**A:** ARIA (Accessible Rich Internet Applications) roles are HTML attributes that define the purpose of elements to assistive technologies like screen readers. For example, `role="button"` tells a screen reader an element behaves as a button. Using semantic HTML (`<button>`, `<nav>`, `<main>`, `<h1>`) naturally provides the correct roles without needing explicit ARIA attributes.

---

## Q: What is the accessibility tree?

**A:** The accessibility tree is a structured representation of the page that assistive technologies use — containing only elements meaningful to users of screen readers and other tools. Each node has a role, an accessible name, a state (checked, disabled, expanded), and a value. Playwright's `getByRole()` queries the accessibility tree, making tests that align with how screen readers experience the application.

---

## Q: What is axe-core and how do you use it with Playwright?

**A:** `axe-core` is an open source JavaScript accessibility engine by Deque. It analyses a page and reports WCAG violations. Use it in Playwright via the `@axe-core/playwright` package: create an `AxeBuilder` with the `page`, call `.analyze()`, then assert that `results.violations` is empty.

```typescript
import { AxeBuilder } from '@axe-core/playwright';

test('home page has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

---

## Q: What percentage of accessibility issues can automated tools detect?

**A:** Automated tools like `axe-core` detect approximately 30–40% of all accessibility issues. The remaining issues require manual testing: using a real screen reader to navigate, verifying logical focus order, testing keyboard-only navigation paths, and evaluating content that is technically correct but confusing in context. Automated accessibility testing is a valuable first pass, not a full solution.

---
