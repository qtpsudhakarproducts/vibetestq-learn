---
# Part 06: Reporters and Debugging
> 📂 Playwright Test Framework Notes — Part 06 of 11

## 7. Reporters and Test Results

### 7.1 What is a Reporter?

A reporter formats and outputs the results of your test run. Different reporters serve different purposes:

- **Development:** See failures quickly in the terminal
- **CI/CD:** Generate machine-readable JSON or JUnit XML for pipelines
- **Sharing results:** Generate an HTML report to share with your team
- **Debugging:** Open a visual trace to see exactly what happened

---

### 7.2 Built-in Reporters

```typescript
// playwright.config.ts — configuring reporters
export default defineConfig({
  reporter: [

    // ── list — simple line-by-line output in terminal (default for local) ──
    ["list"],
    // Output: ✓ login › successful login (2.3s)
    //         ✕ login › wrong password (1.1s)

    // ── dot — one dot per test (compact, good for CI) ─────────────────────
    ["dot"],
    // Output: ....F....F.. (dots for pass, F for fail)

    // ── line — single progress line (minimal) ─────────────────────────────
    ["line"],

    // ── html — generates a full interactive HTML report ────────────────────
    ["html", {
      outputFolder: "playwright-report",   // Where to save the report
      open: "on-failure"   // Auto-open: "always" | "never" | "on-failure"
    }],

    // ── json — machine-readable results (good for custom tooling) ──────────
    ["json", {
      outputFile: "test-results/results.json"
    }],

    // ── junit — XML format (good for Jenkins, GitLab CI, Azure DevOps) ──────
    ["junit", {
      outputFile: "test-results/junit.xml"
    }],

    // ── github — GitHub Actions annotations (highlights failures in PR diff) ─
    ["github"],  // Only use this in CI with GitHub Actions
  ]
});
```

**Opening the HTML report:**
```bash
npx playwright show-report          # Opens from default location
npx playwright show-report playwright-report   # From specific folder
```

---

### 7.3 Screenshots, Videos and Traces on Failure

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // Screenshots
    screenshot: "only-on-failure",
    // "off"              — never take screenshots
    // "on"               — always take screenshots (after every test)
    // "only-on-failure"  — only when the test fails ← recommended
    // "on-first-failure" — only on first failure (not retries)

    // Videos
    video: "retain-on-failure",
    // "off"              — never record
    // "on"               — always record (large disk usage)
    // "retain-on-failure"— record all, delete if test passes ← recommended
    // "on-first-retry"   — only when test is being retried

    // Traces
    trace: "on-first-retry",
    // "off"              — never collect
    // "on"               — always collect (significant overhead)
    // "retain-on-failure"— collect all, delete if test passes
    // "on-first-retry"   — only when test is being retried ← recommended
  }
});
```

**Opening a trace file for debugging:**
```bash
npx playwright show-trace test-results/my-test/trace.zip
# Opens the Playwright Trace Viewer — a timeline of everything that happened:
# - Every action and assertion
# - Screenshots before and after each step
# - Network requests and responses
# - Console output
# - DOM snapshots (explore the HTML at any point)
```

---

### 7.4 Playwright UI Mode

Playwright UI Mode is an interactive browser-based test runner — the best tool for developing and debugging tests.

```bash
npx playwright test --ui
```

**What UI Mode gives you:**
- See all your tests in a sidebar
- Run individual tests or groups by clicking
- Watch tests execute in real time in an embedded browser
- Timeline view of actions, assertions, network requests
- Locator picker — hover to find the right selector
- Re-run tests without restarting the process

**Workflow for writing tests:**
1. Start UI mode: `npx playwright test --ui`
2. Write a test in your editor
3. Click "Run" in UI mode — see it execute visually
4. If it fails, inspect the timeline to see what went wrong
5. Fix and re-run — no terminal restarts needed

---

### 7.5 Debugging with --debug Flag

```bash
# Run a specific test in debug mode — opens a headed browser with Playwright Inspector
npx playwright test login.test.ts --debug

# Debug only a specific test by name
npx playwright test --debug -g "successful login"
```

**Playwright Inspector gives you:**
- Step through test actions one by one with "Step Over"
- See which line is executing
- Use the "Explore" tab to find selectors interactively
- Pause at any point to inspect the page
- Console to run Playwright commands manually

```typescript
// Pause in code — useful for debugging specific points in a test
test("debug this test", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "user@test.com");

  await page.pause(); // ← Test pauses here, Playwright Inspector opens
  // You can now manually inspect the page or step through the rest

  await page.click("#submit");
});
```

---


---
← **Previous:** Part 05 — Page Object Model `playwright-05-page-object-model.md`
→ **Next:** Part 07 — API Testing `playwright-07-api-testing.md`
