---
# Part 09: Parallelism, Retries and Sharding
> 📂 Playwright Test Framework Notes — Part 09 of 11

## 10. Parallelism, Retries and Sharding

### 10.1 How Playwright Runs Tests in Parallel

By default, Playwright runs tests in **parallel** using multiple worker processes. Each worker has its own browser instance.

```
Worker 1 (Chromium): test1 → test2 → test3
Worker 2 (Chromium): test4 → test5 → test6
Worker 3 (Chromium): test7 → test8 → test9
                     ↑ All three run simultaneously, speeding up the suite
```

**Important rule:** Tests within a single file run **sequentially** (in order) inside one worker, by default. Tests across different files run in parallel.

```typescript
// playwright.config.ts
export default defineConfig({
  // ── fullyParallel: true ─────────────────────────────────────────────────
  // Tests WITHIN the same file also run in parallel (requires test isolation)
  fullyParallel: true,

  // ── workers ─────────────────────────────────────────────────────────────
  workers: 4,            // Exactly 4 parallel workers
  workers: "50%",        // Half of available CPU cores
  workers: undefined,    // Auto-detect (default)
});
```

---

### 10.2 Controlling Parallelism

```typescript
// ── Run a test file's tests sequentially ──────────────────────────────────
// Add this at the top of a test file to disable parallelism for that file:
test.describe.configure({ mode: "serial" });

// Or globally for a describe block:
test.describe.serial("sequential group", () => {
  // All tests here run one after another, in order
  test("step 1", async ({ page }) => { /* ... */ });
  test("step 2", async ({ page }) => { /* ... */ });
  test("step 3", async ({ page }) => { /* ... */ });
});

// ── Disable parallelism entirely (not recommended unless necessary) ────────
// playwright.config.ts
export default defineConfig({
  workers: 1,  // One worker = fully sequential
});
```

---

### 10.3 test.describe.serial()

Use `serial` when tests MUST run in a specific order (e.g., a multi-step wizard):

```typescript
test.describe.serial("multi-step checkout wizard", () => {
  // These tests run in order: 1 → 2 → 3 → 4
  // If test 1 fails, tests 2-4 are SKIPPED (no point running them)

  test("step 1: fill shipping address", async ({ page }) => {
    await page.goto("/checkout");
    await page.fill("#address", "123 Main St");
    await page.click("#next");
    await expect(page).toHaveURL("**/checkout/payment");
  });

  test("step 2: fill payment details", async ({ page }) => {
    // Assumes we're on the payment step from test 1
    await page.fill("#card-number", "4111111111111111");
    await page.click("#next");
    await expect(page).toHaveURL("**/checkout/review");
  });

  test("step 3: review and place order", async ({ page }) => {
    await page.click("#place-order");
    await expect(page).toHaveURL("**/confirmation");
  });
});
```

> ⚠️ **Prefer independent tests** when possible — `serial` tests are fragile. A failure in step 1 blocks all later steps, and the tests can't be run individually.

---

### 10.4 Retries — Handling Flaky Tests

A **flaky test** is one that sometimes passes and sometimes fails — not because of a real bug, but due to timing, network variance, or environment issues. Retries give flaky tests multiple chances to pass.

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  // CI: retry failing tests up to 2 times before marking as failed
  // Local: no retries — see failures immediately
});

// ── Per-test retry ─────────────────────────────────────────────────────────
test("this test gets 3 total attempts", { retries: 2 }, async ({ page }) => {
  await page.goto("/flaky-page");
  await expect(page.locator(".data")).toBeVisible();
});
```

**How retries work:**
```
Test fails (attempt 1/3)
  → trace, video, screenshot collected for this attempt
Test retried (attempt 2/3)
  → fresh browser page, fresh state
Test retried (attempt 3/3)
  → if fails again → test marked as FAILED
```

**Using retry count in tests:**
```typescript
test("behavior changes on retry", async ({ page }, testInfo) => {
  if (testInfo.retry > 0) {
    // On a retry — log extra info for debugging
    console.log(`Retry #${testInfo.retry} — clearing local storage`);
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  }
  // ... rest of test
});
```

---

### 10.5 Sharding — Splitting Tests Across Machines

Sharding splits your test suite across multiple machines for faster CI execution.

```bash
# Machine 1 — runs the first 1/3 of all tests
npx playwright test --shard=1/3

# Machine 2 — runs the second 1/3
npx playwright test --shard=2/3

# Machine 3 — runs the last 1/3
npx playwright test --shard=3/3
```

**In GitHub Actions (parallel jobs):**
```yaml
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]  # 4 parallel machines
    steps:
      - run: npx playwright test --shard=${{ matrix.shard }}/4
```

**Merging shard reports:**
```bash
# Each shard produces a blob report
npx playwright test --shard=1/3 --reporter=blob

# After all shards finish, merge reports into one HTML report
npx playwright merge-reports ./blob-reports --reporter=html
```

---


---
← **Previous:** Part 08 — Visual Testing `playwright-08-visual-testing.md`
→ **Next:** Part 10 — CI/CD Integration `playwright-10-cicd-integration.md`
