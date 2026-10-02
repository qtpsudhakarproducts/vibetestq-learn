# Chapter 802 — Playwright Visual Comparisons

This chapter covers `toHaveScreenshot()` in depth — all options, snapshot
path configuration, update workflows, element-level comparisons, and the
`page.screenshot()` API for non-comparison captures. Interviewers ask these
questions when hiring for roles that own the visual testing layer. Questions
progress from basic syntax through threshold tuning, masking patterns, and
the CI snapshot update workflow.

---

## Q802.1 — What is toHaveScreenshot and how does it work?

`toHaveScreenshot()` is a Playwright assertion that captures a screenshot
of the page (or a specific locator) and compares it pixel-by-pixel against
a stored baseline image. It is the primary API for visual regression testing:

```typescript
import { test, expect } from '@playwright/test';

test('login page looks correct', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveScreenshot('login.png');
});
```

On the first run: no `login.png` baseline exists. Playwright captures a
screenshot and saves it. The test passes with a message: "snapshot was
written."

On subsequent runs: Playwright captures a fresh screenshot and compares
it to the saved baseline. If differences exceed the tolerance, the test
fails and three files are saved: actual, expected, and diff.

The baseline file name includes the browser and OS automatically:
`login-chromium-linux.png` — ensuring each platform has its own baseline.

---

## Q802.2 — What are all the options available in toHaveScreenshot?

```typescript
await expect(page).toHaveScreenshot('name.png', {

  // Comparison tolerance
  threshold:           0.2,    // per-pixel colour difference tolerance (0–1)
  maxDiffPixels:       50,     // max absolute number of differing pixels
  maxDiffPixelRatio:   0.001,  // max ratio of differing pixels (0–1)

  // Capture options
  fullPage:   true,            // capture entire scrollable page (not just viewport)
  animations: 'disabled',      // 'disabled' | 'allow' — wait for animations to finish
  caret:      'hide',          // 'hide' | 'initial' — hide text cursor

  // Content masking
  mask: [
    page.locator('.timestamp'),
    page.locator('.ad-banner'),
  ],
  maskColor: '#FF00FF',        // colour used for masked areas (default: cyan)

  // Clip to specific area (instead of full page)
  clip: { x: 0, y: 0, width: 800, height: 400 },

  // Timeout for snapshot assertion
  timeout: 10_000,
});
```

The most commonly used options in practice: `threshold`, `mask`,
`animations: 'disabled'`, and `fullPage`.

---

## Q802.3 — How do you take element-level screenshots?

Pass a locator to `expect()` instead of `page` to capture only that element:

```typescript
test('product card visual', async ({ page }) => {
  await page.goto('/products');

  // Capture only the first product card
  await expect(
    page.getByTestId('product-card').first()
  ).toHaveScreenshot('product-card.png');
});

test('navigation component', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation')).toHaveScreenshot('nav.png');
});

test('chart component', async ({ page }) => {
  await page.goto('/analytics');
  // Wait for chart to render fully
  await expect(page.getByTestId('revenue-chart')).toBeVisible();
  await expect(page.getByTestId('revenue-chart')).toHaveScreenshot('revenue-chart.png');
});
```

Element-level screenshots capture exactly the element's bounding box.
They are stable because changes outside the component do not cause failures.
Ideal for component-level visual tests and design system validation.

---

## Q802.4 — What is the difference between toHaveScreenshot and page.screenshot?

`toHaveScreenshot()` — a visual **assertion**. Saves a baseline on first
run. Compares against baseline on subsequent runs. Fails the test if the
difference exceeds tolerance. Used for visual regression testing.

`page.screenshot()` — captures and **saves** a screenshot without any
comparison. Returns a Buffer. Used for debugging, evidence collection, or
attaching to test reports.

```typescript
// toHaveScreenshot — assertion, visual regression
await expect(page).toHaveScreenshot('homepage.png');

// page.screenshot — capture only, no comparison
await page.screenshot({ path: 'debug/current-state.png' });

// Attach screenshot to the test report on failure
const screenshot = await page.screenshot();
await testInfo.attach('screenshot', {
  body:      screenshot,
  contentType: 'image/png',
});
```

Never use `page.screenshot()` for visual regression — it captures but
never compares. Never use `toHaveScreenshot()` when you just need a
debug capture — it adds baseline management overhead.

---

## Q802.5 — How do you configure the snapshot directory?

By default, Playwright saves baselines next to the test file in a
`__snapshots__` directory. Override with `snapshotDir`:

```typescript
// playwright.config.ts
export default defineConfig({
  // All baselines stored in one central directory
  snapshotDir: './visual-baselines',

  // Or fine-grained control with snapshotPathTemplate
  snapshotPathTemplate:
    '{testDir}/__snapshots__/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}-{platform}{ext}',
});
```

Template variables: `{testDir}`, `{testFileDir}`, `{testFileName}`,
`{testName}`, `{arg}` (the name you passed to `toHaveScreenshot`),
`{projectName}`, `{platform}` (linux/darwin/win32), `{ext}` (.png).

Centralising all baselines in one directory (`./visual-baselines`) makes
it easy to find, review, and update them. It also makes gitignore patterns
simpler.

---

## Q802.6 — How do you run only visual tests in a project?

```bash
# By tag
npx playwright test --grep "@visual"

# By filename pattern
npx playwright test visual/

# By project (if you have a dedicated visual project)
npx playwright test --project=visual
```

Create a dedicated visual testing project in `playwright.config.ts`:

```typescript
projects: [
  {
    name:      'visual',
    testMatch: /.*\.visual\.spec\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      // Disable animations globally for the visual project
      launchOptions: { args: ['--force-prefers-reduced-motion'] },
    },
  },
],
```

All files named `*.visual.spec.ts` run under the visual project's settings
(consistent browser, animation-disabled) without affecting functional test projects.

---

## Q802.7 — How do you handle snapshot updates in CI?

In CI, `--update-snapshots` should never be the default — it would overwrite
baselines on every run, defeating the purpose of visual testing.

The standard CI workflow:

```yaml
# GitHub Actions
- name: Run visual tests
  run: npx playwright test --grep @visual
  # Fails if any visual diff is detected

- name: Upload diff artifacts on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: visual-diffs
    path: test-results/
    retention-days: 7
```

When a developer intentionally changes the UI:
1. Run `--update-snapshots` locally (in Docker for consistency)
2. Commit the updated baseline files alongside the code change
3. Push to PR — CI green because baseline matches the new UI

```bash
# Local update workflow
docker run --rm \
  -v $(pwd):/app \
  mcr.microsoft.com/playwright:v1.47.0-jammy \
  npx playwright test --grep @visual --update-snapshots
```

Never allow CI to auto-commit updated baselines — that removes the human
review gate that makes visual testing valuable.

---

## Q802.8 — How do you configure threshold per test vs globally?

**Global threshold** in `playwright.config.ts`:
```typescript
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      threshold:         0.2,
      maxDiffPixelRatio: 0.001,
      animations:        'disabled',
    },
  },
});
```

**Per-test override:**
```typescript
// Strict threshold for the logo (should never change)
await expect(page.getByTestId('logo')).toHaveScreenshot('logo.png', {
  threshold: 0,
  maxDiffPixels: 0,
});

// Loose threshold for a chart (rendering varies slightly)
await expect(page.getByTestId('chart')).toHaveScreenshot('chart.png', {
  threshold: 0.3,
  maxDiffPixelRatio: 0.05,
});
```

Set tight thresholds for: logos, icons, buttons, text. These should be
pixel-perfect and rarely change.

Set loose thresholds for: charts, graphs, gradient backgrounds, canvas
elements. These have inherent rendering variation that is not a regression.

---

## Q802.9 — How do you handle visual tests for responsive designs?

Use the `viewport` option or a per-project configuration to test multiple
breakpoints:

```typescript
test.describe('responsive visual tests', () => {

  test('mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/home');
    await expect(page).toHaveScreenshot('home-mobile.png', {
      animations: 'disabled',
    });
  });

  test('tablet layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/home');
    await expect(page).toHaveScreenshot('home-tablet.png', {
      animations: 'disabled',
    });
  });

  test('desktop layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/home');
    await expect(page).toHaveScreenshot('home-desktop.png', {
      animations: 'disabled',
    });
  });
});
```

Or use projects — run the same visual tests at each breakpoint with the
viewport set in the project config:

```typescript
projects: [
  { name: 'visual-desktop', use: { viewport: { width: 1440, height: 900 }  } },
  { name: 'visual-tablet',  use: { viewport: { width: 768,  height: 1024 } } },
  { name: 'visual-mobile',  use: { viewport: { width: 375,  height: 812  } } },
],
```

---

## Q802.10 — How do you deal with a page that has scroll-triggered animations?

Scroll-triggered animations (elements that fade in as you scroll) can cause
different screenshots depending on whether the browser has scrolled to reveal
them:

```typescript
test('below-fold content renders correctly', async ({ page }) => {
  await page.goto('/landing');

  // Scroll to the element before capturing
  const section = page.getByTestId('features-section');
  await section.scrollIntoViewIfNeeded();

  // Wait for scroll-triggered animation to complete
  await page.waitForTimeout(300); // or use CSS injection to disable transitions

  await expect(section).toHaveScreenshot('features-section.png', {
    animations: 'disabled',
  });
});
```

Better approach — disable scroll-triggered animations entirely via CSS:

```typescript
await page.addStyleTag({
  content: `
    [data-scroll-animation],
    .aos-animate,
    .fade-in-on-scroll {
      opacity:   1 !important;
      transform: none !important;
      transition: none !important;
    }
  `,
});
```

---

## Q802.11 — How do you take a screenshot of a specific state (hover, focus)?

```typescript
test('button hover state', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Subscribe' });

  // Hover the button to trigger hover styles
  await button.hover();

  // Capture the hover state
  await expect(button).toHaveScreenshot('button-hover.png');
});

test('input focus state', async ({ page }) => {
  await page.goto('/contact');
  const input = page.getByLabel('Email');

  // Focus the input
  await input.focus();

  await expect(input).toHaveScreenshot('input-focused.png');
});

test('dropdown open state', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('combobox', { name: 'Category' }).click();

  // Dropdown is now open
  await expect(page).toHaveScreenshot('dropdown-open.png');
});
```

---

## Q802.12 — How do you visually test a dark mode toggle?

```typescript
test.describe('dark mode visual tests', () => {

  test('light mode default', async ({ page }) => {
    test.use({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage-light.png', {
      animations: 'disabled',
    });
  });

  test('dark mode via CSS class toggle', async ({ page }) => {
    await page.goto('/');
    // Click the dark mode toggle button
    await page.getByRole('button', { name: 'Toggle dark mode' }).click();
    // Wait for the transition to complete
    await page.addStyleTag({ content: '* { transition: none !important; }' });
    await expect(page).toHaveScreenshot('homepage-dark.png');
  });
});
```

---

## Q802.13 — What causes "snapshot was written" vs "snapshot comparison failed"?

**"snapshot was written"** — the baseline file did not exist when the test
ran. Playwright created it. The test passes. This happens on first run or
when the baseline file is deleted.

**"snapshot comparison failed"** — the baseline exists but the current
screenshot differs beyond the threshold. The test fails. Three output files
are created: actual, expected, diff.

**"image size mismatch"** — the viewport or element size changed between
the baseline run and the current run. Even if the content is identical,
different dimensions force a complete regeneration. Often caused by:
- Viewport size not configured consistently
- Scrollbar appearing/disappearing between runs
- Browser zoom level differences

To fix image size mismatch: ensure the viewport is explicitly set in the
test or project config and that the environment is consistent.

---

## Q802.14 — How do you exclude a region by coordinates rather than a locator?

Use the `clip` option to capture a specific bounding box, or use `mask`
with a locator. For arbitrary regions, inject a covering element:

```typescript
// Capture only the top navigation bar area
await expect(page).toHaveScreenshot('header.png', {
  clip: { x: 0, y: 0, width: 1280, height: 80 },
});

// Mask a specific coordinate area using an overlay
await page.evaluate(() => {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 200px; left: 0;
    width: 300px; height: 100px;
    background: #00FFFF; z-index: 99999;
  `;
  document.body.appendChild(overlay);
});
await expect(page).toHaveScreenshot('page-with-masked-area.png');
```

The `clip` approach is cleaner for header/footer captures. The overlay
approach works when you need to mask an exact pixel region with no
corresponding DOM element.

---

## Q802.15 — Write a complete visual test suite for a homepage.

```typescript
// tests/visual/homepage.visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('@visual homepage', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for all resources
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => document.fonts.ready);

    // Disable animations
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration:  0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test('above the fold', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage-hero.png', {
      mask: [
        page.getByTestId('dynamic-banner'),
        page.locator('.current-promo'),
      ],
    });
  });

  test('navigation bar', async ({ page }) => {
    await expect(page.getByRole('navigation')).toHaveScreenshot('nav.png');
  });

  test('full page', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage:  true,
      threshold: 0.2,
      mask:      [page.locator('.ad-slot')],
    });
  });

  test('footer', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole('contentinfo')).toHaveScreenshot('footer.png');
  });

});
```

---

## Q802.16 — How do you attach visual diffs to the Playwright HTML report?

When `toHaveScreenshot` fails, Playwright automatically attaches the actual,
expected, and diff images to the HTML report. No extra code needed.

To also attach screenshots on success (for audit trail):

```typescript
test('homepage visual audit', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const screenshot = await page.screenshot({ fullPage: true });

  // Attach the screenshot to the report regardless of pass/fail
  await testInfo.attach('homepage-full-page', {
    body:        screenshot,
    contentType: 'image/png',
  });

  // Then do the comparison assertion
  await expect(page).toHaveScreenshot('homepage.png', { fullPage: true });
});
```

Configure `screenshot` in `playwright.config.ts` to automatically capture
on failure (for non-visual tests):

```typescript
use: {
  screenshot: 'only-on-failure', // 'off' | 'on' | 'only-on-failure'
}
```

---

## Q802.17 — How do you prevent visual tests from failing when Playwright updates its Chromium?

Playwright periodically updates its bundled Chromium. A Chromium update
can cause minor rendering changes that invalidate all visual baselines.

Prevention strategy:

**Pin the Playwright version.** Use an exact version in `package.json`
rather than `^` or `~`:
```json
"@playwright/test": "1.47.0"
```

**Use a versioned Docker image.** The Docker image tag includes the
Playwright version:
```
mcr.microsoft.com/playwright:v1.47.0-jammy
```

**Handle Playwright upgrades explicitly.** When upgrading Playwright:
1. Update the version in `package.json`
2. Update the Docker image tag
3. Regenerate all visual baselines in the new Docker container
4. Commit all new baselines in a single "chore: upgrade playwright to vX.Y.Z" commit

This makes visual baseline regeneration an explicit, documented event in
git history — not a silent failure in CI.

---

## Q802.18 — In your project, what was the hardest visual testing challenge you solved?

The hardest challenge in our OrangeHRM visual tests was achieving consistent
screenshots across local macOS development machines and Linux CI.

When we first added `toHaveScreenshot()`, the tests passed locally (Mac)
but failed in CI (Linux) every time with a font rendering diff. The
OrangeHRM sidebar uses a custom Google Font (Roboto). On macOS, it renders
with sub-pixel antialiasing and looks slightly sharper. On Linux, it uses
greyscale antialiasing. The diff images showed every text pixel as red.

Our solution had three parts. First, we created a dedicated Docker script
(`scripts/update-snapshots.sh`) that runs `--update-snapshots` inside the
same `mcr.microsoft.com/playwright:v1.47.0-jammy` container that CI uses.
This is now the only way baselines can be updated — local Mac-generated
baselines are rejected.

Second, we added a CI check that fails if a developer commits a baseline
from a non-Linux environment. We detect this by checking the file's git
commit metadata in the PR pipeline.

Third, for three specific components (the data table header, the employee
name column, the module navigation) that had residual differences even
with Docker, we use `threshold: 0.3` and `maxDiffPixelRatio: 0.005` rather
than the global `threshold: 0.2`. These components have fine typography
at small sizes where even Linux-to-Linux rendering has slight variation.

---

## Chapter Summary

- `toHaveScreenshot(name)` creates a baseline on first run and compares on subsequent runs — it is a visual assertion, not just a capture.
- Three output files on failure: actual (current), expected (baseline), diff (highlighted differences).
- Key options: `threshold` (per-pixel colour tolerance), `maxDiffPixels`/`maxDiffPixelRatio` (how many differing pixels are acceptable), `mask` (exclude dynamic content), `animations: 'disabled'`, `fullPage`.
- `page.screenshot()` captures without comparing — use it for debugging and report attachments, not visual regression.
- Element-level `expect(locator).toHaveScreenshot()` captures only that element's bounding box — stable, component-focused visual tests.
- Global threshold is set in `playwright.config.ts` under `expect.toHaveScreenshot`; per-test overrides take precedence.
- Baselines are committed to the repository; test-results (actual/diff) are not committed.
- Always run `--update-snapshots` inside Docker (same environment as CI) to avoid false positives from OS font rendering differences.
- Responsive visual testing: set explicit viewport per test or use separate visual projects per breakpoint.
- Pin the Playwright version in `package.json` and Docker image tag — Chromium updates can change rendering and invalidate all baselines.
