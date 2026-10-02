# Chapter 30: Visual Regression Testing 👁️

Functional tests check if a button *works*. Visual tests check if a button *looks correct*. In a world of dynamic CSS and modern UI frameworks, visual regressions are common and hard to catch with standard assertions.

## 1. Playwright Built-in Snapshots

Playwright includes basic visual comparison out of the box.

```typescript
test('homepage visual check', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png');
});
```

*   **First Run**: Playwright saves the "baseline" image.
*   **Subsequent Runs**: Playwright compares current state to the baseline.
*   **Failure**: If a difference is detected (above the `threshold`), the test fails and generates a "diff" image.

---

## 2. Advanced: Pixelmatch Implementation

If you want more control (e.g., comparing specific buffers or adding custom masking), you can use the `pixelmatch` library directly.

```typescript
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';

export function compareImages(img1Path: string, img2Path: string) {
  const img1 = PNG.sync.read(fs.readFileSync(img1Path));
  const img2 = PNG.sync.read(fs.readFileSync(img2Path));
  const { width, height } = img1;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
  
  if (numDiffPixels > 0) {
    fs.writeFileSync('diff.png', PNG.sync.write(diff));
    return false;
  }
  return true;
}
```

---

## 3. Enterprise Visual AI: Applitools

For mission-critical UIs, industry leaders use **Applitools Eyes**. Unlike pixel-by-pixel comparisons, Applitools uses **AI** to mimic the human eye (ignoring minor rendering shifts that don't affect UX).

### Installation
```bash
npm install --save-dev @applitools/eyes-playwright
```

### Usage
```typescript
import { test } from '@playwright/test';
import { Eyes, Target } from '@applitools/eyes-playwright';

test('visual AI test', async ({ page }) => {
  const eyes = new Eyes();
  await eyes.open(page, 'My App', 'Login Page VisualCheck');
  
  await page.goto('/login');
  
  // High-level "human-like" comparison
  await eyes.check('Login Window', Target.window().fully());
  
  await eyes.close();
});
```

---

## Best Practices
1.  **Mask Dynamic Data**: Always hide dates, user names, or prices before taking a screenshot using `mask: [locator]`.
2.  **OS Consistency**: Run visual tests in a **Docker** container. A font rendered on macOS looks different than the same font on Linux CI, causing false failures.
3.  **Thresholds**: Don't set `threshold: 0`. Start with `0.1` or `0.2` to allow for minor anti-aliasing differences.

**Summary**: You've added Visual Testing to your repertoire, moving from functional validation to total UI confidence. You know how to use Playwright snapshots, raw pixel comparison, and AI-powered visual clouds like Applitools. The final stage is your comprehensive Capstone Project.
