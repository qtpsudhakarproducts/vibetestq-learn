# Chapter 806 — Best Practices — Visual & Accessibility

This chapter synthesises the two disciplines — visual regression testing
and accessibility testing — into a unified quality strategy. It covers
how they complement each other, common pitfalls, maintenance patterns,
and how to present a joined strategy in an interview at senior/architect
level. This is the final chapter of Part 7.

---

## Q806.1 — How do visual testing and accessibility testing complement each other?

Visual and accessibility testing answer different questions about the same
UI. A mature quality strategy needs both.

**Visual testing** answers: "Does the page look correct?" It catches
layout regressions, CSS breakage, missing elements, and unintended style
changes. It does not tell you whether the page is usable — a visually
perfect page can be completely inaccessible.

**Accessibility testing** answers: "Can all users use this page?" It
verifies semantic structure, keyboard operability, screen reader
compatibility, and WCAG compliance. It does not tell you whether the
page looks correct — a fully accessible page can have a broken layout
that passes every axe-core rule.

They are complementary, not substitutable:
- A button with wrong colours → caught by visual test (colour changed)
  and possibly by axe (colour contrast violation)
- A button with no accessible name → missed by visual test (looks fine),
  caught by accessibility test
- A broken layout that collapses a menu → caught by visual test,
  missed by axe (the element is still in the DOM)
- A skip-navigation link that is missing → missed by visual test,
  caught by accessibility test

Run both in CI. Gate both. Treat them as different quality dimensions.

---

## Q806.2 — What are the ten most important rules for visual testing?

**1. Always use Docker for baselines.** Font rendering differs across
OS. Baselines created on macOS will fail on Linux CI. Docker is not optional.

**2. Disable animations before every snapshot.** `animations: 'disabled'`
or CSS injection. Animations produce non-deterministic screenshots.

**3. Wait for fonts and network before capturing.**
`document.fonts.ready` + `waitForLoadState('networkidle')`. A snapshot
taken before fonts load shows system fonts — a guaranteed false positive.

**4. Mask dynamic content, do not delete it.** Use `mask: [locator]`
for timestamps, avatars, and live data. Deletion removes elements from
the layout, masking covers them while preserving their space.

**5. Commit baselines to the repository.** They are test fixtures. Not
committing them means the team cannot see visual changes in PRs.

**6. Only `--update-snapshots` inside Docker.** Enforced via a script.
Mac-generated baselines are a contamination vector.

**7. Do not gate PRs on visual tests until the suite is stable.** Run
visual tests as advisory for the first month. Promote to blocking gate
only after false positive rate drops below 5%.

**8. Component-level beats page-level.** Test components in isolation.
Page-level tests catch composition failures; component-level tests catch
the specific breakage. Run both.

**9. Use loose thresholds for canvas and charts, tight for logos.**
Logo pixels should never change. Chart rendering variation is acceptable.
Tune per element type.

**10. Block third-party scripts in visual tests.** Ad networks, chat
widgets, and analytics scripts load non-deterministic content. Block them
with `page.route()` before navigation.

---

## Q806.3 — What are the ten most important rules for accessibility testing?

**1. Gate CI on critical violations only at first.** Starting with all
four impact levels blocks builds on minor issues. Earn team trust by
fixing critical issues first.

**2. Document every disabled rule with a ticket reference.** A
`disableRules` call without a comment is technical debt with no expiry date.

**3. Use `getByRole` as your primary locator.** Not just for accessibility
tests — everywhere. If `getByRole` cannot find the element, neither can
a screen reader.

**4. Test keyboard navigation explicitly.** axe-core cannot verify that
tab order is logical or that modals trap focus. Write dedicated keyboard
tests with `page.keyboard.press('Tab')`.

**5. Scope scans to the component under test.** `include(selector)` gives
faster, more targeted scans. Full-page scans are for page-level audit
tests only.

**6. Exclude third-party components you cannot fix.** Chat widgets, ad
units, and embedded content from vendors often have violations you have
no power to fix. Exclude them explicitly with a comment.

**7. Test both the DOM and the visual.** `aria-label` exists in the DOM
but `getByRole` verifies it is exposed correctly through the accessibility
tree. Both layers matter.

**8. Verify that error messages are linked to their fields.** `aria-describedby`
is the mechanism. axe tests for label presence; manual tests verify the
connection to specific error messages.

**9. Treat accessibility violations like security vulnerabilities.** Critical
violations are blocking defects — not "nice to have" improvements. They
prevent users from accessing your product.

**10. Run axe scans after interaction, not just on page load.** Dynamic
content — modals, accordions, validation errors — can introduce violations
only visible after user actions.

---

## Q806.4 — How do you structure a combined visual + accessibility test suite?

```
tests/
  functional/                  ← Standard functional tests
    login.spec.ts
    employee.spec.ts

  visual/                      ← Visual regression tests
    pages/
      homepage.visual.spec.ts
      login.visual.spec.ts
    components/
      table.visual.spec.ts
      button.visual.spec.ts

  a11y/                        ← Accessibility tests
    audit/
      pages.a11y.spec.ts       ← axe-core page scans
    keyboard/
      navigation.a11y.spec.ts  ← keyboard navigation tests
    attributes/
      forms.a11y.spec.ts       ← aria attribute assertions

  fixtures/
    a11y.fixture.ts
    visual.fixture.ts
```

In `playwright.config.ts`:

```typescript
projects: [
  // Functional — all tests, every PR
  {
    name:      'chromium',
    testMatch: /functional\/.*\.spec\.ts/,
    use:       { ...devices['Desktop Chrome'] },
  },

  // Visual — only when UI files change + nightly
  {
    name:      'visual',
    testMatch: /visual\/.*\.visual\.spec\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: { args: ['--force-prefers-reduced-motion'] },
    },
  },

  // Accessibility — only when HTML/component files change + nightly
  {
    name:      'accessibility',
    testMatch: /a11y\/.*\.a11y\.spec\.ts/,
    use:       { ...devices['Desktop Chrome'] },
  },
],
```

Each suite has a separate project, separate CI trigger, and separate
reporting section. Functional tests run on every PR. Visual and accessibility
tests run on path-based triggers and nightly.

---

## Q806.5 — What is the false positive problem and how do you solve it for each discipline?

**Visual testing false positives** are caused by: OS rendering differences,
CSS animations, dynamic content, sub-pixel anti-aliasing, and Playwright
version upgrades.

Solutions:
- Docker for consistent rendering
- `animations: 'disabled'` globally in the visual project
- `mask` for all dynamic content
- `threshold: 0.2` as the global default (not `0`)
- Pin Playwright version exactly in `package.json` and Docker image

**Accessibility testing false positives** are caused by: third-party
components, legacy pages under active remediation, and axe rules that
fire on valid patterns (rare but possible).

Solutions:
- `exclude()` for third-party components
- `disableRules()` with a ticket reference for known legacy issues
- `onlyImpact: ['critical', 'serious']` to ignore noise during initial rollout
- Review `results.incomplete` — these are "needs manual check" items that
  axe cannot automatically classify

The shared principle: track every suppression explicitly and tie it to
a resolution plan. Suppressions without expiry become permanent blind spots.

---

## Q806.6 — How do you make both suites maintainable over time?

**For visual tests:**

- Centralise threshold configuration in `playwright.config.ts` under
  `expect.toHaveScreenshot` — one change updates all tests
- Use a single `update-snapshots.sh` script that runs Docker and commits
  baselines — no ad-hoc developer baseline updates
- Schedule a quarterly visual audit — review all baselines, delete tests
  for pages that no longer exist, add tests for new critical pages

**For accessibility tests:**

- Review the `KNOWN_VIOLATIONS` map in every sprint — remove resolved
  violations, add context to new ones
- Track the violation count as a metric in the team dashboard — it should
  trend down, never up
- Include accessibility sign-off in your definition of done for new UI features

**For both:**

- Tag all tests with `@visual` or `@a11y` — makes targeted runs easy
- Co-locate the fixture files — `fixtures/visual.fixture.ts` and
  `fixtures/a11y.fixture.ts` are the single source of truth for options
- Review failures weekly as a team — visual and accessibility failures
  often signal design or engineering decisions that need discussion

---

## Q806.7 — How do you handle responsive design in both visual and accessibility testing?

**Visual — responsive testing:**

```typescript
// playwright.config.ts
projects: [
  { name: 'visual-desktop', use: { viewport: { width: 1440, height: 900  } } },
  { name: 'visual-tablet',  use: { viewport: { width: 768,  height: 1024 } } },
  { name: 'visual-mobile',  use: { viewport: { width: 375,  height: 812  } } },
],
```

Each project generates its own baseline set. A layout that breaks on
mobile but is fine on desktop shows up as a failure in the mobile visual
project only.

**Accessibility — responsive testing:**

```typescript
test.describe('mobile navigation accessibility', () => {
  test.use({ ...devices['iPhone 14'] });

  test('hamburger menu is accessible on mobile @a11y', async ({ page }) => {
    await page.goto('/');

    // Mobile-specific: hamburger button should be properly labelled
    const menuBtn = page.getByRole('button', { name: /menu|navigation/i });
    await expect(menuBtn).toBeVisible();

    await menuBtn.tap();
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute('aria-expanded');
  });
});
```

Accessibility requirements do not change with viewport — an element needs
a label whether it is on desktop or mobile. But the elements that appear
change with responsive layout, so run accessibility scans on both
desktop and mobile viewports.

---

## Q806.8 — What is the cost vs value trade-off for visual and accessibility tests?

**Visual testing costs:**
- Baseline maintenance: developers must update baselines after every
  intentional UI change — estimated 10–20 minutes per sprint for a
  medium-sized suite
- Infrastructure: Docker overhead; Percy/Applitools subscription if cloud
- False positive investigation: 30–60 minutes per occurrence if not
  properly suppressed

**Visual testing value:**
- Catches CSS regressions that functional tests never detect
- Provides a visual change log in git history
- Prevents "silent" UI degradation over time

**Accessibility testing costs:**
- Initial setup: ~4 hours for the fixture and CI integration
- Ongoing maintenance: ~30 minutes per sprint for the known violations map
- Remediation: fixing critical violations requires developer + designer time

**Accessibility testing value:**
- Legal compliance risk mitigation
- Real user impact: improves the experience for ~15% of users
- Forces better HTML semantics (which also benefits SEO and maintainability)
- axe-core is free; the cost is entirely in remediation and maintenance

**Return on investment comparison:**

Visual testing ROI is highest for: design-heavy applications, component
libraries, and design system maintenance.

Accessibility testing ROI is highest for: public-facing applications,
government or regulated-industry products, and companies with diverse user bases.

Both have high ROI when established early — retroactively fixing visual
regressions or accessibility violations is 5–10× more expensive than
catching them at the PR stage.

---

## Q806.9 — What WCAG success criteria map to which testing approaches?

Not every WCAG criterion can be automated. Understanding which can be
tested with Playwright tells you the realistic coverage boundary:

**Testable with axe-core + Playwright:**
- 1.1.1 Non-text Content (alt text) — `image-alt` rule
- 1.3.1 Info and Relationships (labels, headings) — `label`, `heading-order`
- 1.4.3 Contrast Minimum — `color-contrast` rule
- 2.4.1 Bypass Blocks (skip nav) — keyboard test
- 2.4.2 Page Titled — `document-title` rule
- 4.1.2 Name, Role, Value (ARIA) — `button-name`, `aria-required-attr`

**Testable only with Playwright custom tests (not axe):**
- 2.1.1 Keyboard — requires explicit `page.keyboard` tests
- 2.1.2 No Keyboard Trap — modal focus trap tests
- 2.4.3 Focus Order — sequential `Tab` tests

**Requires manual testing:**
- 1.1.1 Alt text meaningfulness (axe checks presence, not quality)
- 1.4.4 Resize Text (zoom behaviour)
- 2.4.6 Headings and Labels (labels are descriptive)
- 3.1.1 Language of Page (can be auto-detected but meaning requires review)
- 3.3.1 Error Identification (description quality)

---

## Q806.10 — How do you present a visual + accessibility strategy in an interview?

An interviewer asking for your strategy expects a framework, not a list
of tool names. Use the three-layer structure:

**Layer 1 — Automated gates (preventive):**
- axe-core scans in CI blocking on critical violations
- `toHaveScreenshot()` in Docker blocking on pixel diffs
- These run automatically on every PR — no human judgment required

**Layer 2 — Automated advisory (detective):**
- Moderate/minor accessibility violations — reported but not blocking
- Visual changes flagged to a review dashboard (Percy/Applitools) — human approval
- These run automatically but require human decision

**Layer 3 — Manual verification (validation):**
- Manual screen reader testing (VoiceOver, NVDA) quarterly
- Design review against WCAG checklist for new features
- User testing with disabled users annually

Present the layers as investment levels: Layer 1 is cheap and high-ROI,
always do it. Layer 2 costs more but handles scale. Layer 3 is the deepest
validation — proportionate to compliance requirements and user impact.

---

## Q806.11 — What CI pipeline design supports both visual and accessibility testing?

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on:
  push:
    branches: [main]
  pull_request:
    paths:
      - 'src/**'
      - 'tests/**'
  schedule:
    - cron: '0 3 * * *'  # nightly at 3 AM UTC

jobs:
  functional:
    name: Functional Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npx playwright install --with-deps chromium
      - run: npx playwright test --project=chromium

  accessibility:
    name: Accessibility Gate
    runs-on: ubuntu-latest
    needs: functional          # only if functional passes
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npx playwright install --with-deps chromium
      - run: npx playwright test --project=accessibility
      - name: Upload a11y violations
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: a11y-violations
          path: playwright-report/

  visual:
    name: Visual Regression
    runs-on: ubuntu-latest
    # Visual runs in parallel with accessibility — both need functional to pass
    needs: functional
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npx playwright install --with-deps chromium
      - run: npx playwright test --project=visual
      - name: Upload visual diffs
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-diffs
          path: test-results/
```

The pipeline: functional tests first (fast feedback), then accessibility
and visual run in parallel (both depend on functional passing). This
separates failure domains — a functional failure does not trigger visual
and accessibility runs.

---

## Q806.12 — What are the most common visual testing mistakes?

**Mistake 1: Running `--update-snapshots` on a Mac then committing.**
Result: CI always fails because Mac and Linux render fonts differently.
Fix: script-enforced Docker-only baseline updates.

**Mistake 2: Setting `threshold: 0`.**
Result: anti-aliasing differences cause failures on every run.
Fix: `threshold: 0.2` as the global default, `threshold: 0` only for
pixel-perfect elements like logos.

**Mistake 3: Visual testing SPAs without waiting for the full render.**
Result: screenshots capture loading spinners or skeleton screens.
Fix: `waitForLoadState('networkidle')` + component-specific visibility waits.

**Mistake 4: Committing `test-results/` directory.**
Result: actual and diff screenshots bloat the repository.
Fix: add `test-results/` to `.gitignore`.

**Mistake 5: Visual tests in the same CI job as functional tests.**
Result: a slow visual test run delays functional test feedback.
Fix: separate CI jobs with path-based triggers for visual tests.

---

## Q806.13 — What are the most common accessibility testing mistakes?

**Mistake 1: Using `disableRules` without documentation.**
Result: permanent blind spots with no recovery path.
Fix: every `disableRules` call requires a comment with ticket number and ETA.

**Mistake 2: Only running axe on page load.**
Result: accessibility violations introduced by user interactions are missed.
Fix: run axe after opening modals, submitting forms, and navigating tabs.

**Mistake 3: Failing on all four impact levels from day one.**
Result: hundreds of violations block all builds; team abandons the gate.
Fix: start with critical only, introduce serious after the first wave is
fixed, then moderate.

**Mistake 4: Not testing keyboard navigation.**
Result: axe passes but the site is unusable for keyboard-only users.
Fix: dedicated keyboard navigation test file with `page.keyboard.press('Tab')`.

**Mistake 5: Treating accessibility as a QA-only concern.**
Result: developers ship new inaccessible code faster than QA can flag it.
Fix: include accessibility review in the definition of done; use `getByRole`
as the standard locator (which forces accessible markup from the start).

---

## Q806.14 — How do you calculate the coverage and ROI of your visual and accessibility suites?

**Visual coverage metrics:**
- Pages covered / total pages (page-level coverage)
- Components covered / total components (component-level coverage)
- Target: 100% of high-risk pages, 80% of shared components

**Visual ROI measurement:**
- Track the number of visual regressions caught per quarter
- Estimate the cost of each regression if it had reached production
  (user impact × hours to detect and fix × brand risk)
- Compare against maintenance hours spent on the visual suite

**Accessibility coverage metrics:**
- Pages scanned / total pages (automated axe coverage)
- WCAG criteria covered manually vs total applicable criteria
- Current violation count by impact level (trend over time)

**Accessibility ROI measurement:**
- Legal risk reduction (ADA compliance, EN 301 549 compliance)
- Support ticket reduction for users reporting usability issues
- Developer time per violation caught in CI vs production (typically 10:1 ratio)

Report both suites to stakeholders monthly: number of tests, number of
violations caught, violation trend over time, and time saved vs estimated
manual audit cost.

---

## Q806.15 — Write a visual + accessibility fixture that both disciplines share.

```typescript
// fixtures/quality.fixture.ts
import { test as base, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type QualityFixtures = {
  a11y:    (scope?: string) => Promise<void>;
  stable:  () => Promise<void>;  // prepares page for visual snapshot
};

export const test = base.extend<QualityFixtures>({

  a11y: async ({ page }, use) => {
    await use(async (scope?: string) => {
      let builder = new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .exclude('#third-party-chat')
        .exclude('#analytics-widget');

      if (scope) builder = builder.include(scope);

      const results = await builder.analyze();
      const blocking = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      if (blocking.length > 0) {
        throw new Error(
          `A11y: ${blocking.length} blocking violations\n` +
          blocking.map(v => `  [${v.impact}] ${v.id}: ${v.nodes[0]?.html?.substring(0, 60)}`).join('\n')
        );
      }
    });
  },

  stable: async ({ page }, use) => {
    await use(async () => {
      // Standard pre-snapshot stabilisation
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => document.fonts.ready);
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration:  0s !important;
            transition-duration: 0s !important;
          }
        `,
      });
    });
  },
});

export { expect } from '@playwright/test';
```

Usage:

```typescript
import { test, expect } from '../fixtures/quality.fixture';

test('login page quality gate @visual @a11y', async ({ page, a11y, stable }) => {
  await page.goto('/login');
  await stable();  // stabilise for visual

  await a11y();                                       // accessibility gate
  await expect(page).toHaveScreenshot('login.png');   // visual gate
});
```

---

## Q806.16 — How do you handle visual and accessibility testing for dark mode?

```typescript
test.describe('dark mode quality', () => {
  test.use({ colorScheme: 'dark' });

  test('dark mode layout @visual', async ({ page, stable }) => {
    await page.goto('/dashboard');
    await stable();
    await expect(page).toHaveScreenshot('dashboard-dark.png', {
      animations: 'disabled',
    });
  });

  test('dark mode colour contrast @a11y', async ({ page }) => {
    await page.goto('/dashboard');
    // Contrast check is especially important in dark mode —
    // many themes have insufficient contrast for light text on dark backgrounds
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    const contrastViolations = results.violations.filter(
      v => v.id === 'color-contrast'
    );
    expect(contrastViolations).toHaveLength(0);
  });
});
```

Dark mode testing is a good example of where visual and accessibility
tests are run together: the visual test verifies the theme looks correct
and the accessibility test verifies the contrast ratios meet WCAG 1.4.3
in the dark palette (many dark themes fail contrast despite looking
fine to sighted users).

---

## Q806.17 — What does a mature visual and accessibility programme look like in a large team?

A mature programme has five characteristics:

**1. Ownership is defined.** The QA/automation team owns the test
infrastructure. The design team owns baseline approval for visual changes.
The development team owns accessibility remediation. Responsibilities do
not overlap.

**2. Both gates run in CI.** Critical accessibility violations block merges.
Visual regressions require approval before merge (via Percy/Applitools
workflow or a designated reviewer). No bypass is available for either gate.

**3. Metrics are tracked.** Monthly dashboard: accessibility violation
count by impact (trending down), visual test failure rate (trending toward
zero), and baseline update frequency (tracked to detect high-churn areas).

**4. The suite is curated.** Not every page has visual and accessibility
tests. Coverage decisions are documented and reviewed quarterly. High-risk,
stable pages are covered; low-risk, high-churn pages are excluded.

**5. Manual testing complements automation.** Quarterly screen reader
testing sessions. Annual WCAG audit by a specialist. User testing with
disabled users for the most critical flows. Automation handles breadth;
humans handle depth.

---

## Q806.18 — In your project, how did you combine visual and accessibility testing?

In our OrangeHRM framework, visual and accessibility tests share a fixture
file (`quality.fixture.ts`) and are co-located by page in the `tests/quality/`
directory. This was a deliberate structural decision: when a developer
changes a page, they look in one place and see both the visual and the
accessibility test for that page — not two separate files in two different
directories.

For most pages, we run accessibility first and visual second within the
same test. If the axe scan fails, the visual test does not run — no point
capturing a screenshot of a page with critical accessibility violations,
because the accessibility issue is the blocking problem.

The two disciplines found different classes of bugs in our OrangeHRM suite.
Visual tests found: a missing table border after a CSS reset was updated, a
left-aligned heading that should be centred on the Leave Calendar, and a
truncated employee name column at 1024px width. Accessibility tests found:
the icon-only delete button with no `aria-label`, the date picker without
an associated `<label>`, and a form section using `<div>` for its legend
instead of `<fieldset>/<legend>` (causing axe's `group-label` rule to fire).

The most important lesson: start both suites earlier than feels necessary.
We added them at Level 7 of our POM progression. In retrospect, the
accessibility fixture and a page-level axe scan should be in Level 1 —
the cost is near-zero and the violations it catches from the start would
never accumulate into a backlog.

---

## Chapter Summary

- Visual testing catches appearance regressions; accessibility testing catches usability barriers — they are complementary, not substitutable.
- The ten visual rules centre on: Docker for rendering, animation disabling, font waiting, dynamic content masking, and Docker-only baseline updates.
- The ten accessibility rules centre on: gating on critical first, documenting suppressions, keyboard testing, scoping scans, and treating violations as blocking defects.
- Structure visual and accessibility tests in separate directories and CI jobs — separate failure domains, separate triggers, separate report sections.
- Both suites benefit from shared fixtures: `stable()` for pre-snapshot stabilisation, `a11y()` for accessibility scanning.
- Dark mode requires both visual tests (does it look correct?) and accessibility tests (do contrast ratios still meet WCAG 1.4.3?).
- CI pipeline: functional → (accessibility + visual) in parallel, all as separate jobs; visual and accessibility run on path-based triggers and nightly.
- Track violation counts and visual failure rates as monthly quality metrics — both should trend downward.
- A mature programme has defined ownership (QA for infrastructure, design for visual approval, dev for remediation), CI gates for both disciplines, and quarterly manual audits to complement automation.
- The most valuable recommendation: add basic axe scans and visual snapshots at the earliest possible stage of framework development — retroactive remediation costs 5–10× more than prevention.
