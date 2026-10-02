# Chapter 801 — Visual Testing Fundamentals

This chapter covers what visual testing is, why pixel-based comparison
exists alongside functional assertions, and how Playwright's snapshot
system works at the conceptual level. Interviewers ask these questions
to gauge whether candidates understand visual regression as a distinct
discipline — not just "taking screenshots." Questions progress from the
baseline concept through false positives, OS consistency, and the
strategic decision of what to cover with visual tests.

---

## Q801.1 — What is visual regression testing?

Visual regression testing captures how the application looks at a known
good state (the baseline), then automatically detects when future runs
produce a different appearance. It answers the question: "Did the UI
change in a way I did not intend?"

Functional tests verify behaviour — clicking a button causes the right
action. Visual tests verify appearance — the button is in the right place,
has the correct colour, and uses the correct font. A CSS refactor can
break visual layout while all functional tests pass.

The workflow:
1. **First run** — no baseline exists. Playwright captures a screenshot
   and saves it as the baseline. The test passes.
2. **Subsequent runs** — a new screenshot is taken and compared pixel-by-pixel
   to the baseline. If the difference is within tolerance, the test passes.
3. **Regression detected** — if pixels differ beyond the threshold, the test
   fails and generates a diff image showing exactly what changed.

Visual regression tests catch: accidental colour changes, layout shifts,
font rendering regressions, missing elements, and CSS specificity bugs.

---

## Q801.2 — What is a baseline image and how is it created?

A baseline image is the reference screenshot — the "correct" state of the
UI that all future screenshots are compared against. It is created on the
first test run when no baseline exists yet.

```typescript
test('homepage looks correct', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png');
  // First run: no 'homepage.png' exists yet.
  // Playwright takes a screenshot and saves it as the new baseline.
  // Test passes.
});
```

Baseline files are committed to the repository. They live alongside the
tests, typically in a `__snapshots__` directory that Playwright creates
automatically. The file name includes the browser and OS:

```
tests/__snapshots__/
  homepage.test.ts-snapshots/
    homepage-chromium-linux.png   ← baseline for Chromium on Linux
    homepage-firefox-linux.png    ← baseline for Firefox on Linux
    homepage-webkit-darwin.png    ← baseline for WebKit on macOS
```

The browser and OS are included because rendering differs across platforms —
a Chrome screenshot on Linux looks slightly different from Chrome on macOS.

---

## Q801.3 — What is a diff image and what does it show?

When a screenshot comparison fails, Playwright generates three files:
the actual screenshot (current run), the expected screenshot (baseline),
and the diff image (what changed).

The diff image highlights every pixel that differs between actual and
expected. Changed pixels appear in a bright colour (typically magenta or
red) on a greyscale background, making it easy to see exactly what moved,
disappeared, or changed colour.

```
tests/__snapshots__/
  homepage-chromium-linux-actual.png    ← what the test captured
  homepage-chromium-linux-expected.png  ← what the baseline expected
  homepage-chromium-linux-diff.png      ← highlighted differences
```

The diff image is the primary debugging tool for visual test failures.
A large red region in the header area means a CSS change moved the
navigation. A scattered pattern of small dots means font rendering or
anti-aliasing differences — usually a false positive.

---

## Q801.4 — What is a false positive in visual testing and what causes it?

A false positive is a visual test failure caused by something other than
an actual UI regression. The UI is correct but the test reports a failure.

Common causes:

**Font rendering differences.** The same font renders differently on macOS
(with sub-pixel antialiasing), Linux (greyscale antialiasing), and Windows.
A screenshot from a developer's Mac looks different from the same page in
Linux CI — even though the page is identical.

**CSS animations.** A screenshot taken mid-animation captures the animated
state. The next run may capture a different frame. Result: spurious diff
on every run.

**Dynamic content.** Timestamps, user avatars, ad banners, and random
elements change on every load. Their pixels will always differ from the
baseline.

**Subpixel rendering.** Anti-aliasing of curves, shadows, and rounded
corners varies slightly between renders. A threshold of `0` fails on
perfectly legitimate renders.

**Browser version upgrades.** When Playwright updates its bundled Chromium,
rendering may change slightly for certain CSS properties. This invalidates
all existing baselines.

---

## Q801.5 — How do you configure tolerance to reduce false positives?

```typescript
await expect(page).toHaveScreenshot('homepage.png', {
  // Option 1: absolute pixel count — allow up to 100 pixels to differ
  maxDiffPixels: 100,

  // Option 2: ratio — allow up to 1% of total pixels to differ
  maxDiffPixelRatio: 0.01,

  // Option 3: per-pixel colour tolerance — 0 to 1
  // 0 = exact match required, 1 = all colours accepted
  // 0.2 is a good starting point for anti-aliasing tolerance
  threshold: 0.2,
});
```

The three options are composable. A pixel is considered "different" only
if its colour difference exceeds `threshold`. Then `maxDiffPixels` or
`maxDiffPixelRatio` controls how many such pixels are acceptable.

**Recommended starting values:**
- `threshold: 0.2` — allows for minor anti-aliasing variation
- `maxDiffPixelRatio: 0.001` — allows 0.1% of pixels to differ (very tight)

Do not set `threshold: 0` — it fails on anti-aliasing that has nothing
to do with the UI change you are trying to detect.

---

## Q801.6 — How do you prevent CSS animations from causing false positives?

```typescript
// Option 1 — disable via toHaveScreenshot option
await expect(page).toHaveScreenshot('page.png', {
  animations: 'disabled',
});

// Option 2 — inject a CSS tag to force all animations to 0 duration
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration:        0s !important;
      animation-delay:           0s !important;
      transition-duration:       0s !important;
      transition-delay:          0s !important;
    }
  `,
});

// Option 3 — launch browser with reduced motion preference
test.use({
  launchOptions: {
    args: ['--force-prefers-reduced-motion'],
  },
});
```

`animations: 'disabled'` in `toHaveScreenshot` is the simplest approach.
It tells Playwright to wait for animations to finish before capturing.
The CSS injection approach is more aggressive — it prevents animations
from running at all, which gives the cleanest, most deterministic screenshots.

---

## Q801.7 — Why must visual tests run in Docker or a consistent environment?

Font rendering is the main reason. Operating systems use different algorithms
to draw text:

- **macOS** — sub-pixel antialiasing (sharper, slightly coloured edges)
- **Linux** — greyscale antialiasing (smoother, purely grey edges)
- **Windows** — ClearType (different sub-pixel approach)

The same text, same font, same size renders as different pixel values on
each OS. A baseline created on a developer's Mac will fail every time it
runs on Linux CI — not because the UI changed, but because the fonts look
slightly different.

The solution: generate all baselines in the same environment that runs CI.
Docker provides this consistency:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.47.0-jammy
WORKDIR /app
COPY . .
RUN npm ci
RUN npx playwright install --with-deps
```

All baseline screenshots are generated inside this container. CI also runs
inside this container. The rendering environment is identical — false
positives from font rendering disappear.

---

## Q801.8 — What is the difference between pixel comparison and DOM-based visual testing?

**Pixel comparison** (Playwright's `toHaveScreenshot`) renders the page
and compares the actual image pixels. It is environment-sensitive (font
rendering, OS) but requires no special integration — any page can be
screenshot-tested.

**DOM-based visual testing** (tools like Percy, Chromatic) captures the
DOM snapshot and CSS, then renders it in a controlled cloud environment.
Comparison is done in their servers. Benefits:
- Rendering is done in a controlled environment — no OS inconsistency
- Diffs are shown in a visual review UI with approve/reject workflow
- History of all visual changes is maintained

**AI-based visual testing** (Applitools) uses machine learning to classify
differences as "meaningful" or "acceptable." A 1-pixel anti-aliasing shift
is ignored; a missing button is flagged. Reduces false positives significantly.

For small teams: Playwright's built-in pixel comparison in Docker is enough.
For large teams with frequent UI changes: Percy, Chromatic, or Applitools
provide workflow tools (review queue, approval gates) that pixel comparison
lacks.

---

## Q801.9 — What should you cover with visual tests?

Visual tests are expensive to maintain — every intentional UI change
requires updating baselines. Cover selectively:

**Good candidates for visual tests:**
- Login page, homepage, and landing pages (highest user visibility)
- Data-dense components: tables, charts, dashboards (hard to assert functionally)
- Responsive layouts (verifies mobile breakpoints at a glance)
- Design system components: buttons, modals, typography (reused everywhere)
- Error states: 404, 500, empty states (often neglected in design reviews)

**Poor candidates for visual tests:**
- Pages with lots of dynamic content (timestamps, user-generated content)
- Pages that change frequently (high maintenance cost)
- Admin-only internal tools (lower visual quality bar)
- Pure functional flows (login → redirect) that do not have significant UI

The principle: visual test the things that look the same on every render
and that users will immediately notice if they break.

---

## Q801.10 — How do you update baselines after an intentional UI change?

```bash
# Update ALL baselines
npx playwright test --update-snapshots

# Update baselines for one test file
npx playwright test homepage.spec.ts --update-snapshots

# Update baselines for tests matching a grep pattern
npx playwright test --update-snapshots -g "visual"
```

Always review the diff before updating. The workflow:

1. Developer changes the UI intentionally (new button colour, layout tweak)
2. Visual tests fail — expected, because the baseline is outdated
3. Developer runs `--update-snapshots` to regenerate the baseline
4. Developer commits the new baseline files alongside the code change
5. PR reviewer sees both the code change and the visual change in the same PR

This commit-based workflow creates a visual audit trail: every change to
the UI's appearance is recorded in git history as a baseline file diff.

---

## Q801.11 — Where should baseline files be stored?

Baseline files should be committed to the repository alongside the tests.
They are not build artefacts — they are test fixtures that define the
expected state of the UI.

```
.gitignore — DO NOT add baselines here
.gitignore — DO add: playwright/.auth/  (auth state)
.gitignore — DO add: test-results/      (actual/diff from failures)
```

The `test-results/` directory contains actual and diff images from test
failures. These are temporary debugging artefacts — do not commit them.

The `tests/__snapshots__/` directory contains the baselines — committed.

```bash
# Good gitignore entry
test-results/
playwright-report/

# Bad gitignore entry (do NOT do this)
**/__snapshots__/   # ← This would prevent baselines from being committed
```

---

## Q801.12 — How do you mask dynamic content in visual tests?

```typescript
test('dashboard with masked dynamic content', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveScreenshot('dashboard.png', {
    mask: [
      page.locator('.last-login-time'),       // changes every run
      page.locator('.notification-count'),    // changes with data
      page.locator('[data-testid="avatar"]'), // user photo varies
      page.locator('.ad-unit'),               // ad content rotates
    ],
    // Masked areas are replaced with a solid grey rectangle in the comparison
  });
});
```

Alternatively, hide elements entirely using CSS injection:

```typescript
await page.addStyleTag({
  content: `.timestamp { visibility: hidden !important; }
            .live-chat { display: none !important; }`,
});
await expect(page).toHaveScreenshot('dashboard.png');
```

`mask` replaces the element with a solid colour in the screenshot —
the element is still visible in the actual render but covered in the
comparison image. `display: none` removes it entirely. Use `mask` when
you want the screenshot to show the element's position (so layout is
still tested) but not its dynamic content.

---

## Q801.13 — What is the snapshot naming convention in Playwright?

By default, Playwright names snapshot files automatically using the test
name, browser, and OS:

```
{testTitle}-{browserName}-{os}.png
```

Example: A test named `"homepage looks correct"` on Chromium running Linux:
```
homepage-looks-correct-chromium-linux.png
```

You can provide an explicit name:
```typescript
await expect(page).toHaveScreenshot('my-custom-name.png');
// Saved as: my-custom-name-chromium-linux.png
```

Configure the snapshot directory in `playwright.config.ts`:

```typescript
export default defineConfig({
  snapshotDir: './visual-baselines', // custom directory
  // or per-project:
  projects: [{
    name: 'chromium',
    snapshotPathTemplate: '{testDir}/__snapshots__/{arg}-{projectName}{ext}',
  }],
});
```

---

## Q801.14 — How do you capture a full-page screenshot vs a viewport screenshot?

```typescript
// Viewport only (default) — captures what is visible in the browser window
await expect(page).toHaveScreenshot('viewport.png');

// Full page — scrolls and stitches to capture the entire page height
await expect(page).toHaveScreenshot('full-page.png', {
  fullPage: true,
});

// Specific element — captures only that element's bounding box
await expect(page.getByTestId('product-card').first())
  .toHaveScreenshot('product-card.png');

// Manual screenshot (not a comparison — just saves to disk)
await page.screenshot({
  path:     'debug/current-state.png',
  fullPage: true,
});
```

**When to use each:**
- Viewport: for pages where the above-the-fold content is what matters
- Full page: for long content pages, landing pages, terms and conditions
- Element: for component-level visual tests, design system validation

---

## Q801.15 — How do you wait for fonts and images before taking a visual snapshot?

```typescript
test('page with web fonts loaded', async ({ page }) => {
  await page.goto('/');

  // Wait for fonts to download and render
  await page.waitForFunction(() => document.fonts.ready);

  // Wait for all images to load (including lazy-loaded ones)
  await page.waitForLoadState('networkidle');

  // Wait for any loading skeletons to be replaced with real content
  await expect(page.getByTestId('loading-skeleton')).not.toBeVisible();

  await expect(page).toHaveScreenshot('homepage.png', {
    animations: 'disabled',
  });
});
```

Web fonts are the most common cause of visual test flakiness after OS
differences. If the font has not loaded when the screenshot is taken,
the browser falls back to a system font — completely different metrics,
completely different rendering.

`document.fonts.ready` is a Promise that resolves when all fonts in the
font-face rules have finished loading. Always await it before any visual
screenshot that includes custom typography.

---

## Q801.16 — How do you structure visual tests in a large project?

```
tests/
  visual/                     ← separate visual test directory
    pages/
      homepage.visual.spec.ts
      login.visual.spec.ts
      dashboard.visual.spec.ts
    components/
      button.visual.spec.ts
      modal.visual.spec.ts
      data-table.visual.spec.ts
  __snapshots__/              ← baselines (committed)
    pages/
      homepage.visual.spec.ts-snapshots/
        homepage-chromium-linux.png
```

Tag all visual tests so they can be run independently:

```typescript
// homepage.visual.spec.ts
test.describe('@visual', () => {
  test('homepage desktop', async ({ page }) => { ... });
  test('homepage mobile', async ({ page }) => { ... });
});
```

```bash
# Run only visual tests
npx playwright test --grep @visual

# Run visual tests and update baselines
npx playwright test --grep @visual --update-snapshots
```

---

## Q801.17 — What are Percy and Applitools and when do you use them?

**Percy** (BrowserStack Visual) — a cloud visual testing platform.
Playwright sends DOM snapshots to Percy's servers, which render and compare
them. Results appear in a web dashboard with approve/reject workflow.
Baselines are stored in the cloud, not in git. Good for teams that want
a visual review process beyond CI pass/fail.

**Applitools Eyes** — AI-powered visual testing. Uses computer vision to
distinguish meaningful regressions from noise (anti-aliasing, subpixel
differences). Provides "Visual AI" comparison that only flags changes
a human would actually care about. Best for large suites where false
positive management is a significant cost.

```typescript
// Applitools integration
import { Eyes, Target } from '@applitools/eyes-playwright';

test('visual AI check', async ({ page }) => {
  const eyes = new Eyes();
  await eyes.open(page, 'MyApp', 'Login Page');
  await page.goto('/login');
  await eyes.check('Login', Target.window().fully());
  await eyes.close();
});
```

**When to use built-in vs cloud tools:**
- Built-in `toHaveScreenshot`: small team, Docker available, simple workflow
- Percy/Chromatic: team needs a visual review queue and design sign-off workflow
- Applitools: large suite (100+ visual tests), false positives are a real problem

---

## Q801.18 — In your project, how did you implement visual testing?

In our OrangeHRM framework, we added visual tests at Level 7 (Reporting
& Test Organisation) as a separate test suite tagged `@visual`.

We made three key decisions. First, all visual tests run in Docker — we
use the `mcr.microsoft.com/playwright` image for both local baseline
generation and CI. This eliminated every font-rendering false positive we
saw during initial setup.

Second, we only visual-test stable pages: the Login page, the Employee
List header, and the Leave balance summary panel. These pages change rarely
and have high user visibility. We deliberately excluded the PIM form pages
because they contain dynamic dropdowns and date fields that would require
extensive masking.

Third, we use `animations: 'disabled'` on every visual test and inject a
CSS tag that sets `transition-duration: 0s` on all elements. OrangeHRM
has CSS transitions on sidebar items that were causing consistent failures
on the first 2–3 test runs after the application deployed.

The baselines are committed to the repository in `tests/__snapshots__/`.
The PR review process includes a visual diff step — when a developer
intentionally changes a styled component, they regenerate the baseline and
the diff is visible in the PR. This made accidental style regressions
visible to reviewers for the first time.

---

## Chapter Summary

- Visual testing compares screenshots against committed baseline images to detect unintended UI changes that functional tests miss.
- Baselines are created on the first test run and committed to the repository — they define the expected visual state.
- Diff images show exactly which pixels changed between the baseline and the current run.
- False positives are caused by: OS font rendering differences, CSS animations, dynamic content, and subpixel anti-aliasing.
- Use `threshold: 0.2` to allow minor anti-aliasing variation; use `maxDiffPixelRatio` to allow a small percentage of pixels to differ.
- Always run visual tests in Docker to eliminate OS font-rendering inconsistencies — this is the single most important visual testing practice.
- Disable animations with `animations: 'disabled'` or CSS injection before taking snapshots.
- Wait for `document.fonts.ready` and `waitForLoadState('networkidle')` before snapshotting pages with custom fonts or lazy-loaded images.
- Use `mask: [locator]` to exclude dynamic content (timestamps, avatars) from comparison.
- Update baselines with `--update-snapshots` after intentional UI changes; always review the diff before committing updated baselines.
