# Chapter 315 — Screenshots, Video & Tracing

This chapter covers visual debugging capabilities in Playwright. Interviewers
ask about these tools to test your ability to diagnose test failures quickly
in headless CI pipelines.

---

## Q315.1 — What screenshot capabilities does Playwright provide?

Playwright can capture three types of screenshots:
- **Page Screenshot**: Captures the visible viewport.
- **Full Page Screenshot**: Scrolls down and captures the entire page layout.
- **Element Screenshot**: Captures only the boundaries of a single selector locator.

---

## Q315.2 — What is the Playwright trace viewer?

The **Trace Viewer** is a graphical debugging tool that lets you step back and
forth through your test execution. It shows a timeline, visual screenshots of
every action, action logs, console messages, network requests, and source code.

---

## Q315.3 — When do you enable screenshots and video in CI?

You configure them to capture **only on failure** in CI. Capturing screenshots
and videos for every passing test wastes storage, slows execution, and adds unnecessary CI pipeline noise.

---

## Q315.4 — How does your project use screenshots, video, and traces for debugging?

Our project uses the `only-on-failure` config strategy. When a pipeline fails,
we download the ZIP file artifact, open it with `npx playwright show-trace`,
and inspect the steps, network traffic, and visual state exactly at the moment of failure.

---

## Q315.5 — How do you configure screenshot capture in playwright.config.ts?

Set the `use.screenshot` option:
```typescript
import { defineConfig } from '@playwright/test';
export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
  },
});
```

---

## Q315.6 — What is the difference between screenshot: 'on', 'off', and 'only-on-failure'?

- **on**: Captures a screenshot at the end of every single test.
- **off**: Never captures screenshots.
- **only-on-failure**: Captures a screenshot only when a test fails.

---

## Q315.7 — How do you record a trace and how do you open it?

Record trace in configuration:
```typescript
use: { trace: 'on-first-retry' }
```
Open a recorded zip file using:
```bash
npx playwright show-trace path/to/trace.zip
```

---

## Q315.8 — What information does a trace contain?

A trace file (`.zip`) contains recorded action timings, mouse positions, visual states, full network logs (HAR), console stdout, source code maps, and step execution status.

---

## Q315.9 — What is the difference between page.screenshot() and toHaveScreenshot()?

- `page.screenshot()` is an **imperative action** that returns a buffer or writes a file.
- `toHaveScreenshot()` is a **declarative assertion** that compares the actual page snapshot with a baseline visual reference image.

---

## Q315.10 — What is the difference between video: 'on' and video: 'retain-on-failure'?

- **on**: Saves a video file for every single test executed.
- **retain-on-failure**: Captures video for all tests but deletes the file for passing runs, keeping only failing ones.

---

## Q315.11 — What is wrong with enabling trace: 'on' for all tests in CI?

Tracing records full network payloads and DOM snapshots at every action, resulting in huge zip files. Enabling it globally on thousands of tests can cause **out of memory exceptions, slow down execution, and exhaust disk space**.

---

## Q315.12 — How does Playwright tracing compare to Selenium's test recording tools?

- **Selenium** recorders just log commands.
- **Playwright Tracing** captures the exact state of the browser, network traffic, and console messages at each millisecond, making it a complete black-box recorder.

---

## Q315.13 — Write configuration for on-failure screenshots and trace capture

```typescript
import { defineConfig } from '@playwright/test';
export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
```

---

## Q315.14 — Write code to manually capture a screenshot and attach it to the test report

```typescript
import { test } from '@playwright/test';

test('custom screenshot attach', async ({ page }, testInfo) => {
  await page.goto('/dashboard');
  const buffer = await page.screenshot();
  await testInfo.attach('dashboard-state', {
    body: buffer,
    contentType: 'image/png'
  });
});
```

---

## Q315.15 — Describe a time when the trace viewer helped you diagnose a test failure

A test failed on a dynamic button click. The screenshot showed the button, but the trace viewer network panel revealed that the API returning authentication permissions had responded with 401 Unauthorized right before the click action — explaining why the locator clicked but did not navigate.
