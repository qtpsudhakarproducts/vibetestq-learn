---
# Part 08: Visual and Screenshot Testing
> 📂 Playwright Test Framework Notes — Part 08 of 11

## 9. Visual and Screenshot Testing

### 9.1 What is Visual Testing?

Visual testing compares how your app **looks** against a known-good baseline screenshot. If a CSS change accidentally shifts a button or changes a color, the visual test catches it — even if functional tests all pass.

```
First run: No baseline exists → Playwright takes a screenshot and saves it as the baseline
Later runs: New screenshot taken → compared pixel-by-pixel with the baseline
If different → Test FAILS and shows you a diff image highlighting the differences
```

---

### 9.2 toHaveScreenshot()

```typescript
import { test, expect } from "@playwright/test";

test("homepage looks correct", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle"); // Wait for all content to load

  // Captures a screenshot and compares to the saved baseline
  await expect(page).toHaveScreenshot("homepage.png");
  // Baseline saved to: __snapshots__/homepage.test.ts-snapshots/homepage-chromium-linux.png
  //                                                              ↑ browser and OS are included
});

// With options
await expect(page).toHaveScreenshot("homepage.png", {
  maxDiffPixels: 100,         // Allow up to 100 pixels to differ (for anti-aliasing)
  maxDiffPixelRatio: 0.01,    // Or allow up to 1% of pixels to differ
  threshold: 0.2,             // Pixel color difference threshold (0-1)
  animations: "disabled",     // Disable CSS animations for stable screenshots
  fullPage: true,             // Capture the entire scrollable page
});
```

---

### 9.3 Updating Snapshots

When you intentionally change the UI, the old baseline is no longer correct. Update it:

```bash
# Update ALL snapshots
npx playwright test --update-snapshots

# Update snapshots for a specific test file
npx playwright test homepage.test.ts --update-snapshots

# Update snapshots for a specific test
npx playwright test --update-snapshots -g "homepage looks correct"
```

> ⚠️ Always **review the diff** before updating snapshots. Make sure the visual change was intentional.

---

### 9.4 Masking Dynamic Content

Some parts of the page change every run (timestamps, ads, user avatars). Mask them so they don't cause false failures.

```typescript
test("product page snapshot with masked dynamic content", async ({ page }) => {
  await page.goto("/products/1");

  await expect(page).toHaveScreenshot("product-page.png", {
    mask: [
      page.locator(".timestamp"),        // Mask timestamps (change every second)
      page.locator(".user-avatar"),      // Mask user photos (may change)
      page.locator(".ad-banner"),        // Mask advertisements (change each load)
      page.locator("[data-testid='price']"), // Mask if price changes dynamically
    ],
    // Masked areas are replaced with a solid color in the comparison
  });
});
```

---

### 9.5 Element vs Full-Page Screenshots

```typescript
// ── Full page screenshot ───────────────────────────────────────────────────
await expect(page).toHaveScreenshot("full-page.png", { fullPage: true });

// ── Viewport screenshot (default — only what's visible) ───────────────────
await expect(page).toHaveScreenshot("viewport.png");

// ── Element screenshot — only a specific element ──────────────────────────
await expect(
  page.locator(".product-card").first()
).toHaveScreenshot("product-card.png");

// ── Manual screenshot (not for comparison — just to save) ─────────────────
await page.screenshot({ path: "screenshots/debug.png", fullPage: true });
const buffer = await page.screenshot(); // Returns Buffer without saving
```

---

### 9.6 Visual Testing Best Practices

```typescript
test.describe("Visual tests", () => {

  // ── Disable animations — they cause inconsistent screenshots ──────────
  test.use({
    launchOptions: {
      args: ["--force-prefers-reduced-motion"] // Disable CSS animations
    }
  });

  test("login page visual", async ({ page }) => {
    await page.goto("/login");

    // ── Wait for fonts to load ─────────────────────────────────────────
    await page.waitForFunction(() => document.fonts.ready);

    // ── Wait for all images to load ────────────────────────────────────
    await page.waitForLoadState("networkidle");

    // ── Hide dynamic content rather than masking (for cleaner diffs) ──
    await page.addStyleTag({
      content: `
        .timestamp { visibility: hidden !important; }
        .live-chat-widget { display: none !important; }
        * { animation-duration: 0s !important; }
      `
    });

    await expect(page).toHaveScreenshot("login-page.png", {
      animations: "disabled",
      threshold: 0.1,
    });
  });
});
```

---


---
← **Previous:** Part 07 — API Testing `playwright-07-api-testing.md`
→ **Next:** Part 09 — Parallelism, Retries and Sharding `playwright-09-parallelism-retries-sharding.md`
