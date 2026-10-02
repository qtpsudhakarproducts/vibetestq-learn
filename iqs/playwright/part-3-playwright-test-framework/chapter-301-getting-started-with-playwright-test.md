# Chapter 301 — Getting Started with Playwright Test

This chapter covers the foundations of `@playwright/test` — Playwright's
built-in test runner. Interviewers ask these questions to gauge your basic setup
and understand your grasp of why Playwright is preferred over older libraries.

---

## Q301.1 — What is @playwright/test?

`@playwright/test` is a **complete test runner** designed specifically for web
application testing. It wraps the core Playwright library (which handles browser
control via CDP) and provides a test runner with features like **parallelism, fixtures,
assertions, configuration, and html reports**.

---

## Q301.2 — What is the difference between the Playwright library and the Playwright test runner?

The **Playwright library** (`playwright-core` or `playwright`) is a plain node library
that exposes APIs to control browsers. The **test runner** (`@playwright/test`) is a framework that wraps the library and manages the execution lifecycle of tests:
- The library has no concept of assertions, reporters, retries, or command-line executors.
- The test runner automates launcher processes, runs multiple workers in parallel, injects fixtures, and validates outcomes.

---

## Q301.3 — When would you use the Playwright library without @playwright/test?

You use the library directly when you are building a custom crawler, scraper, or when integrating browser automation into an existing runner like **Jest, Vitest, or Mocha** instead of migrating the whole test suite to Playwright's runner.

---

## Q301.4 — How is @playwright/test set up in your project?

You initialize a new project by running:
```bash
npm init playwright@latest
```
This creates a `playwright.config.ts`, a sample test folder, and installs necessary browser executables.

---

## Q301.5 — What does a basic Playwright test file look like?

It imports `test` and `expect` from `@playwright/test`, defines a test with a title, and executes interactions:
```typescript
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});
```

---

## Q301.6 — What does the test function provide — what is in the fixtures parameter?

The test function passes a **fixtures object** as its first parameter. These are isolated, pre-initialized components (like `page`, `context`, `browser`, `request`) managed by Playwright's lifecycle.

---

## Q301.7 — What is the difference between page, browser, and context fixtures?

- **browser**: A launch instance of Chromium, Firefox, or WebKit. Extremely heavy. Shared across workers.
- **context**: An isolated, lightweight "incognito" session inside the browser. No shared cookies, cache, or storage.
- **page**: A single tab/window within a context. This is what you interact with most.

---

## Q301.8 — What happens when a test fails — what does Playwright report?

When a test fails, Playwright stops executing the current test block, captures diagnostic outputs (like screenshots, trace logs, or video if configured), reports the exact assertion failure line, and proceeds to the next test in line.

---

## Q301.9 — What is the difference between @playwright/test and Jest or Mocha?

- **Jest/Mocha** are generic JS test runners that require extra libraries (like Selenium or Puppeteer) for browser control.
- **@playwright/test** is built specifically for browser automation with native auto-waiting and browser isolation built-in.

---

## Q301.10 — What does @playwright/test provide that a plain test runner does not?

It provides **auto-waiting locators, multi-browser configurations, visual comparison assertions, network interception, trace recording, and browser context isolation** out of the box.

---

## Q301.11 — What is wrong with importing page from playwright instead of using the page fixture?

Importing page directly from playwright requires you to manually manage browser launches, contexts, and cleanup. Using the `page` fixture lets Playwright handle launch/teardown automatically and guarantees incognito isolation.

---

## Q301.12 — How does @playwright/test compare to Cypress's test runner?

- **Cypress** runs tests *inside* the browser, which makes it fast but limits multi-tab and multi-window scenarios.
- **Playwright** runs tests *outside* the browser via WebSocket, giving full multi-page, cross-domain, and multi-browser support.

---

## Q301.13 — Write a complete first test file for a login page

```typescript
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'user1');
  await page.fill('#password', 'pass1');
  await page.click('#submit-btn');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Q301.14 — Write a test that uses the request fixture for an API call alongside a page test

```typescript
import { test, expect } from '@playwright/test';

test('hybrid API and UI test', async ({ page, request }) => {
  // Call API
  const response = await request.post('/api/users', {
    data: { name: 'Bob' }
  });
  expect(response.ok()).toBeTruthy();

  // Go to UI and verify
  await page.goto('/users');
  await expect(page.getByText('Bob')).toBeVisible();
});
```
