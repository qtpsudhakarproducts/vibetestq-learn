---
# Part 10: CI/CD Integration
> 📂 Playwright Test Framework Notes — Part 10 of 11

## 11. CI/CD Integration

### 11.1 Why CI/CD for Tests?

Running tests only on a developer's machine isn't enough. CI/CD runs tests:
- On **every pull request** — catches regressions before they merge
- On **every merge to main** — ensures main branch is always passing
- Across **all browsers** — not just the developer's local Chrome
- With **fresh environment** — no "works on my machine" issues

---

### 11.2 GitHub Actions — Full Setup

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main, develop]      # Run on push to these branches
  pull_request:
    branches: [main]               # Run on PRs targeting main

jobs:
  test:
    name: "Playwright Tests"
    runs-on: ubuntu-latest         # Linux runner (fastest and cheapest)
    timeout-minutes: 60            # Fail the job if it takes more than 60 min

    strategy:
      fail-fast: false             # Don't cancel other shards if one fails
      matrix:
        shard: [1, 2, 3]           # Run 3 parallel shards

    steps:
      # ── 1. Check out the code ────────────────────────────────────────────
      - name: Checkout repository
        uses: actions/checkout@v4

      # ── 2. Set up Node.js ────────────────────────────────────────────────
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"             # Cache node_modules for faster runs

      # ── 3. Install dependencies ──────────────────────────────────────────
      - name: Install dependencies
        run: npm ci                # Faster than npm install, uses package-lock.json

      # ── 4. Install Playwright browsers ──────────────────────────────────
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        # --with-deps also installs OS-level dependencies (fonts, libs)

      # ── 5. Run tests ─────────────────────────────────────────────────────
      - name: Run Playwright tests
        run: npx playwright test --shard=${{ matrix.shard }}/3
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
          CI: "true"

      # ── 6. Upload test results ───────────────────────────────────────────
      - name: Upload blob report
        if: always()               # Run even if tests failed
        uses: actions/upload-artifact@v4
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report/
          retention-days: 7

  # ── Merge reports from all shards ────────────────────────────────────────
  merge-reports:
    name: "Merge Reports"
    if: always()
    needs: [test]                  # Runs after all test jobs finish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npx playwright install chromium

      - name: Download all blob reports
        uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true

      - name: Merge reports
        run: npx playwright merge-reports --reporter=html ./all-blob-reports

      - name: Upload HTML report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-html-report
          path: playwright-report/
          retention-days: 30
```

---

### 11.3 Environment Variables in CI

```typescript
// playwright.config.ts — using environment variables safely
import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL,  // Set in CI secrets

    httpCredentials: process.env.BASIC_AUTH_USER ? {
      username: process.env.BASIC_AUTH_USER,
      password: process.env.BASIC_AUTH_PASSWORD!,
    } : undefined,
  }
});
```

```yaml
# In GitHub Actions — set secrets via GitHub repo Settings → Secrets
env:
  BASE_URL: ${{ secrets.STAGING_BASE_URL }}
  TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
  TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
  ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
  ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
```

**Never hardcode credentials in test files or config.** Always use environment variables.

---

### 11.4 Artifacts — Screenshots, Videos, Traces

```yaml
# In GitHub Actions — upload artifacts on failure
- name: Upload test artifacts
  if: always()   # ← "always()" ensures this runs even when tests fail
  uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: |
      test-results/           # Screenshots and videos
      playwright-report/      # HTML report
    retention-days: 14        # Keep artifacts for 14 days
```

**How to access artifacts:**
1. Go to the GitHub Actions run that failed
2. Scroll to the bottom — find "Artifacts" section
3. Download `test-results` and open the HTML report
4. Or download individual traces and open with `npx playwright show-trace trace.zip`

---

### 11.5 Headed vs Headless in CI

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // Headless in CI (no display available), headed locally for visibility
    headless: !!process.env.CI,

    // If you need to run headed in CI (e.g., for specific visual tests):
    // Use Xvfb (virtual framebuffer) on Linux
  }
});
```

```yaml
# GitHub Actions — running headed tests on Linux using Xvfb
- name: Run headed Playwright tests
  run: xvfb-run npx playwright test
  # xvfb-run creates a virtual display so headed browsers can run on headless CI
```

---


---
← **Previous:** Part 09 — Parallelism, Retries and Sharding `playwright-09-parallelism-retries-sharding.md`
→ **Next:** Part 11 — Quick Reference `playwright-11-quick-reference.md`
