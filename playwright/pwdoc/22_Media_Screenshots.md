# Chapter 22: Screenshots & Videos (Complete Guide)

## The Concept of Visual Evidence

Automation runs at a speed that is impossible for humans to watch in real-time. When a test fails in a CI/CD pipeline, you need a way to "reconstruct the crime scene." **Screenshots and Videos** provide the visual context necessary to understand what happened at the exact moment of failure.

**Purpose**: This chapter covers how to capture visual artifacts manually and automatically, and introduces Visual Regression Testing (Snapshot Testing).

**Why is it required?**
1. **Root Cause Analysis**: To distinguish between a logic error (wrong URL) and a visual error (button hidden under an overlay).
2. **Visual Consistency**: To ensure that UI elements look correct across different browsers and screen sizes using pixel-matching.
3. **Collaboration**: To share clear, visual evidence with developers or designers, making bug reports more actionable.

## The Importance of Visual Evidence

In automated testing, knowing *that* a test failed is helpful. Seeing *what the user saw* when it failed is invaluable.

Playwright offers three levels of visual evidence:
1. **Screenshots**: Instant snapshots of state.
2. **Videos**: Full replays of the user session.
3. **Trace Viewer** (Covered in Ch. 9): The ultimate debugging record.

This chapter focuses on Screenshots and Videos.

---

## Mastering Screenshots

### 1. Manual Screenshots (On-Demand)

Take screenshots at any point in your test.

```typescript
test('capture evidence', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Basic: Visible viewport only
  await page.screenshot({ path: 'evidence/viewport.png' });
  
  // Advanced: Full Scrollable Page
  // Note: This can be slow and huge for infinite-scroll pages!
  await page.screenshot({ 
    path: 'evidence/full.png', 
    fullPage: true 
  });
});
```

### 2. Element Screenshots

Capture just a specific component. This is cleaner for documentation or focused debugging.

```typescript
// Capture just the chart container
await page.locator('.chart-container').screenshot({ 
  path: 'evidence/chart.png' 
});
```

### 3. Hiding Sensitive Data (Masking)

When taking screenshots for reports, you might want to hide PII (Personally Identifiable Information) or dynamic elements (timers, dates) that ruin consistency.

```typescript
await page.screenshot({
  path: 'evidence/censored.png',
  mask: [
    page.locator('.user-email'),
    page.locator('.transaction-id')
  ],
  maskColor: '#FF00FF' // Bright pink box over masked elements
});
```

### 4. Automatic Failure Screenshots

**The Golden Rule:** Don't litter your tests with `page.screenshot()`. Configure it globally.

**In `playwright.config.ts`:**
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    // 'off' | 'on' | 'only-on-failure'
    // Recommended: 'only-on-failure' saves space but captures bugs.
    screenshot: 'only-on-failure',
  },
});
```

---

## Visual Regression Testing (Snapshot Testing)

Playwright has a built-in "pixel-match" engine. It compares a screenshot taken *now* against a "Golden Master" (baseline) stored in the repo.

### Basic Comparison

```typescript
test('visual check', async ({ page }) => {
  await page.goto('/landing-page');
  
  // 1st Run: Fails, creates 'landing-page-chromium.png'
  // 2nd Run: Compares against saved image
  await expect(page).toHaveScreenshot('landing-page.png');
});
```

### Handling Flakiness (Thresholds)

Rendering pixels varies slightly between OS versions, GPU drivers, and browser versions. Strict pixel matching often fails incorrectly.

**Configuration:**

```typescript
await expect(page).toHaveScreenshot({
  // 1. Max Diff Pixels: Allow 100 bad pixels (noise)
  maxDiffPixels: 100,
  
  // 2. Max Diff Ratio: Allow 2% of the image to differ
  maxDiffPixelRatio: 0.02,
  
  // 3. Threshold: How different a single pixel must be to count as "different" (0-1)
  // 0.2 is essentially "ignore subtle anti-aliasing"
  threshold: 0.2,
});
```

### Dealing with Dynamic Content

If your page has a blinking cursor, a "Welcome, [User]" message, or a clock, visuals will fail every time.

**Solution: Masking**
```typescript
await expect(page).toHaveScreenshot({
  mask: [
    page.locator('.clock'),
    page.locator('.welcome-banner')
  ]
});
```

**Solution: CSS Hiding via styles**
```typescript
await expect(page).toHaveScreenshot({
  stylePath: 'visual-test-overrides.css' // CSS file that sets dynamic items to opacity: 0
});
```

### Updating Baselines

When you *intended* to change the UI (e.g., new logo), tests will fail. You must update the baselines.

```bash
# Update all snapshots
npx playwright test --update-snapshots

# Update only specific project
npx playwright test --project=mobile-safari --update-snapshots
```

*Note: Always commit the new PNG files to Git after verifying them!*

---

## Video Recording Strategies

Videos are "heavy" artifacts but tell the story of *motion*.

### Configuration (Global)

**In `playwright.config.ts`:**
```typescript
export default defineConfig({
  use: {
    // 'off' | 'on' | 'retain-on-failure' | 'on-first-retry'
    
    // 'retain-on-failure': Only save if test fails. Best for CI.
    video: 'retain-on-failure',
    
    // Size: defaults to viewport. Smaller = less storage.
    videoSize: { width: 640, height: 480 } 
  },
});
```

### Accessing Video Files Programmatically

Sometimes you want to rename the video file to match the test name (by default, it's a random hash).

```typescript
test('video manipulation', async ({ page }, testInfo) => {
  await page.goto('/');
  
  // ... test runs ...
  
  // At the end of the test:
  const video = page.video();
  if (video) {
    // Rename it using the test title
    const newPath = `videos/${testInfo.title.replace(/\s/g, '_')}.webm`;
    await video.saveAs(newPath);
    
    // Delete the original temp file
    await video.delete();
    
    // Attach new video to report
    testInfo.attachments.push({
      name: 'video',
      path: newPath,
      contentType: 'video/webm'
    });
  }
});
```

---

## Managing Artifacts in CI/CD

Artifacts fill up disk space. GitHub Actions has limits.

### 1. Retention Policy
Set output directory and cleanup.

```typescript
// playwright.config.ts
export default defineConfig({
  outputDir: 'test-results/', // this folder is wiped on every run
});
```

### 2. CI Configuration (GitHub Actions)
Ensure you upload the folder *only if* tests fail (or always, if debugging).

```yaml
- name: Upload Playwright Artifacts
  uses: actions/upload-artifact@v3
  if: failure()  # Only upload if step failed
  with:
    name: test-results
    path: test-results/
    retention-days: 7
```

---

## Best Practices

| Strategy | Recommendation | Why? |
|----------|----------------|------|
| **For Debugging** | Use **Trace Viewer** | It's interactable (DOM snapshot) vs Video (passive pixel data). Video is a fallback. |
| **For CI** | `screenshot: only-on-failure` | Saves disk space. You only need evidence when things break. |
| **For Visual Tests** | **Docker** | Run visual regression tests in Docker. Rendering differs between Mac, Windows, and Linux. Docker ensures consistency. |
| **Full Page Screenshots** | **Avoid** if possible | They are slow, flaky (if infinite scroll exists), and huge. Test specific components instead. |
| **Naming** | **Descriptive** | `page.screenshot({ path: 'checkout-error.png' })` is better than default random names. |

**Summary**: You now know how to capture visual evidence using screenshots and videos, and how to perform visual regression testing using snapshots. The next chapter covers advanced browser emulation, including GeoLocation, Timezones, and manipulating the system clock.
