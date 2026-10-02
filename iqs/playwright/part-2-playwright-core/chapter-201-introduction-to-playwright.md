# Chapter 201 — Introduction to Playwright & Architecture


This chapter covers what Playwright is, why it exists, and how it compares to
other tools. Interviewers ask these questions as a warmup to judge whether the
candidate has worked with Playwright deeply or just followed tutorials. Questions
progress from definition through feature comparison to a concrete code example
and a real project story.

---

## Q201.1 — What is Playwright?

Playwright is an open-source browser automation library created by Microsoft.
It lets you write code that controls a real browser — Chromium, Firefox, or
WebKit — to navigate pages, fill forms, click buttons, and assert that the
application behaves correctly.

Playwright is both a library (playwright-core) and a full test runner
(@playwright/test). Most teams use @playwright/test, which provides test
structure, fixtures, assertions, reporters, and parallelism out of the box.

It was released publicly in 2020 and is actively maintained by Microsoft.
As of 2025, it is the most widely adopted new browser automation framework
for enterprise TypeScript projects.

---

## Q201.2 — Why was Playwright created and what problem does it solve?

Playwright was created to solve the reliability problems that plagued earlier
browser automation tools — primarily Selenium.

Selenium uses the W3C WebDriver protocol: every command makes an HTTP round
trip to a WebDriver server, which then communicates with the browser. This
overhead causes timing problems and requires explicit waits everywhere.

Playwright communicates with browser engines directly over a persistent
WebSocket connection using the Chrome DevTools Protocol (CDP) for Chromium
and equivalent protocols for Firefox and WebKit. This gives it real-time
bidirectional communication with the browser, which enables built-in
auto-waiting, network interception, and reliable event handling.

The problem Playwright solves: flaky tests caused by timing issues in
dynamic web applications. In practice, Playwright tests need far fewer
explicit waits than equivalent Selenium tests.

---

## Q201.3 — When would you choose Playwright for a new automation project?

Choose Playwright when:

- The application uses modern JavaScript (React, Vue, Angular, Next.js) with
  dynamic content loaded via API calls
- The team uses TypeScript — Playwright's TypeScript support is first-class
- You need cross-browser testing including Safari/WebKit
- You need network interception, request mocking, or API + UI hybrid testing
- You need reliable parallel test execution built into the runner
- You are starting a new project with no existing Selenium investment

Consider other tools when:
- The team has a large, mature Selenium suite — migration cost may not
  justify the benefit
- The application is a pure mobile native app — Playwright does not automate
  native mobile (use Appium/WebDriverIO instead)
- The team exclusively tests in IE11 or legacy browsers — Playwright does not
  support IE

---

## Q201.4 — How is Playwright used in your current project?

In our project, Playwright is used as the primary end-to-end testing tool for
a TypeScript web application. We use @playwright/test as the test runner.

Our suite has three test categories: smoke tests that run on every PR, regression
tests that run on merge to main, and nightly tests that cover the full critical
path. All three use the same Playwright framework — configuration in
playwright.config.ts selects which tests run via tag-based filtering.

We run tests in parallel across Chromium and Firefox. WebKit is run nightly
only. Tests use fixtures for page objects and authentication setup. API calls
for test data creation use Playwright's `request` fixture so all test resources
go through a single setup/teardown lifecycle.

---

## Q201.5 — What browsers does Playwright support?

Playwright supports three browser engines:

**Chromium** — used by Google Chrome, Microsoft Edge, Opera, and Brave.
Playwright ships its own Chromium build.

**Firefox** — Mozilla's browser engine. Playwright ships a patched Firefox.

**WebKit** — the engine behind Safari on macOS and iOS. Playwright ships a
WebKit build for Linux/Windows, enabling Safari-like testing on non-Apple
platforms.

For each engine, Playwright downloads and manages its own browser builds via
`npx playwright install`. You can also run against installed system browsers
with `channel: 'chrome'` or `channel: 'msedge'` in the config.

Mobile browser emulation is available for all three engines without requiring
a real device — Playwright emulates mobile viewports, touch events, and device
pixel ratios through browser API flags.

---

## Q201.6 — What are the key features of Playwright?

The features that matter most for test automation:

**Auto-waiting** — every action waits for the element to be ready before
proceeding. No manual waits in 95% of tests.

**Web-first assertions** — `expect(locator).toBeVisible()` retries until the
condition is true or times out. No `isVisible()` + `toBe(true)` patterns.

**Network interception** — intercept, mock, or modify any HTTP request or
response from within a test. This enables UI+API hybrid testing.

**BrowserContext isolation** — each test gets its own isolated browser session
with separate cookies, local storage, and auth state.

**Fixtures** — dependency injection for tests. Page objects, auth sessions, and
shared resources are injected into tests without global state.

**Trace Viewer** — a full timeline recorder that captures every action,
network call, DOM snapshot, and screenshot for post-failure debugging.

**Multiple workers** — tests run in parallel across multiple processes, reducing
suite execution time proportionally to the number of available workers.

---

## Q201.7 — What is the difference between Playwright and Selenium?

| | Playwright | Selenium |
|---|---|---|
| Browser protocol | CDP / WebSocket (direct) | HTTP / WebDriver |
| Auto-waiting | Built-in | Manual (`WebDriverWait`) |
| Test runner | Included (`@playwright/test`) | Separate (JUnit, TestNG, pytest) |
| Network interception | First-class API | Third-party (BrowserMob) |
| Multi-tab / multi-window | Native, clean API | Complex, window handle switching |
| Assertion retries | Built-in (web-first) | Manual retry logic |
| Speed | Faster (no HTTP overhead per command) | Slower |
| Browser support | Chromium, Firefox, WebKit | Chrome, Firefox, Edge, Safari, IE |
| Language support | JS/TS, Python, Java, C# | Most languages |
| Community age | Since 2020 | Since 2004 |

The practical difference: a Playwright test that reliably passes on the first
run typically needs about 70% fewer explicit wait statements than the equivalent
Selenium test.

---

## Q201.8 — What is the difference between Playwright and Cypress?

| | Playwright | Cypress |
|---|---|---|
| Execution model | Out-of-process (Node.js controls browser) | In-process (runs inside browser) |
| Multi-browser | Chrome, Firefox, WebKit | Chrome, Firefox, Edge (limited WebKit) |
| Multi-tab | Yes, native | No (Cypress cannot control new tabs) |
| Cross-origin | Yes | Restricted (same-origin policy in older versions) |
| Network interception | Request and response bodies | Requests only (no response body streaming) |
| Language | JS, TS, Python, Java, C# | JavaScript / TypeScript only |
| Parallel execution | Built-in, multi-process | Requires Cypress Cloud (paid) for full parallelism |
| API testing | Full request/response API | `cy.request()` (HTTP only, no WebSocket) |
| iframe support | Native `frameLocator()` | Limited, complex |

**When to choose Playwright over Cypress:**
- You need multi-tab or cross-origin testing
- You need WebKit / Safari coverage
- You need full network interception (response body mocking)
- You need free parallel execution at scale
- Your team uses TypeScript seriously

Cypress has better interactive debugging in its Test Runner for junior teams
who prefer a visual-first workflow. Playwright's Trace Viewer closes this gap.

---

## Q201.9 — What is the difference between @playwright/test and playwright-core?

**playwright-core** is the core library. It provides the browser automation
API — `chromium.launch()`, `page.goto()`, `locator.click()` — with no test
runner, no assertions, no fixtures, and no reporters.

**@playwright/test** is the complete testing package. It includes everything
in playwright-core plus: the `test` and `expect` API, fixtures, configuration
via `playwright.config.ts`, built-in reporters, parallel execution, trace
viewer integration, and the `npx playwright test` CLI.

```typescript
// playwright-core only — manual browser management
import { chromium } from 'playwright-core';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
await browser.close();

// @playwright/test — test runner manages everything
import { test, expect } from '@playwright/test';
test('page title', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);
});
```

Almost all test projects should use @playwright/test. playwright-core is for
embedding Playwright in non-test contexts — scraping, monitoring, PDF generation.

---

## Q201.10 — When would you choose Playwright over Cypress?

Choose Playwright over Cypress when:

**Multi-tab or popup testing is required.** Cypress cannot control new browser
tabs. Playwright handles them natively with `context.waitForEvent('page')`.

**WebKit / Safari coverage is required.** Cypress support for WebKit is
experimental. Playwright's WebKit engine is production-ready.

**Cross-origin flows are required.** OAuth redirects, payment provider iframes,
and third-party login pages often cross origin boundaries. Playwright handles
this transparently. Cypress requires workarounds.

**Free parallel execution at scale is required.** Playwright's parallel workers
are built-in and free. Cypress parallelism requires Cypress Cloud, which is paid.

**The team works primarily in TypeScript.** Playwright's TypeScript support
is first-class — types for every API, full IDE autocomplete. Cypress's
TypeScript support exists but has more gaps.

Choose Cypress over Playwright when the team values interactive debugging
in a visual runner and works primarily on a single-browser, single-domain
application.

---

## Q201.11 — What are the limitations of Playwright?

Playwright has a few genuine limitations:

**No native mobile app testing.** Playwright only automates browsers. For
native iOS or Android apps, use Appium or similar tools.

**No IE11 support.** Playwright does not and will not support Internet Explorer.

**Browser binary downloads are large.** `npx playwright install` downloads
~200–500MB of browser binaries. First-time CI setup requires caching to avoid
slow downloads on every run.

**WebKit on Linux is a patched build, not real Safari.** Playwright's WebKit
closely approximates Safari but is not identical. Very Safari-specific bugs
(font rendering, specific WebKit APIs) may not reproduce.

**No real-time interactive test runner like Cypress.** Playwright's UI Mode
(`--ui` flag) provides interactive debugging but does not match Cypress's
real-time watch experience.

---

## Q201.12 — How does Playwright compare to Selenium for cross-browser testing?

Playwright supports Chromium, Firefox, and WebKit. Selenium supports
Chrome, Firefox, Edge, Safari, and IE (via WebDriver implementations).

**Practical advantage for Playwright:**

Playwright downloads and manages its own browser builds. Cross-browser tests
just work out of the box — no need to install ChromeDriver, GeckoDriver, or
Safari WebDriver separately, or keep driver versions in sync with browser
versions. The most common Selenium setup pain — driver version mismatch — does
not exist in Playwright.

Playwright's WebKit engine enables Safari-like testing on Linux CI machines,
where actual Safari is not available. This is a significant advantage for
teams without macOS CI runners.

**Where Selenium still wins:**

Selenium supports a wider range of programming languages (all major ones).
For very large organisations with existing Selenium investment and dedicated
cross-browser QA infrastructure, the switching cost may not justify the
reliability gains.

---

## Q201.13 — What Playwright version is your project using and how do you keep it updated?

In our project we pin the Playwright version in `package.json` using an exact
version (no `^` or `~`). This prevents automatic upgrades that could introduce
breaking changes during a test run.

```json
{
  "devDependencies": {
    "@playwright/test": "1.47.2"
  }
}
```

We update quarterly or when a specific feature or bugfix we need lands in a
newer release. The update process:

1. Update the version in `package.json`
2. Run `npm install` to update `package-lock.json`
3. Run `npx playwright install` to download the new browser binaries
4. Run the full test suite and review any failures
5. Update snapshot baselines if visual tests need regeneration
6. Commit the `package.json`, `package-lock.json`, and any updated snapshots

We track Playwright's release notes to understand what changed. Breaking
changes are rare but do occur on major version bumps.

---

## Q201.14 — Write a minimal Playwright test that opens a page and asserts its title

```typescript
import { test, expect } from '@playwright/test';

test('homepage has correct title', async ({ page }) => {
  // Navigate to the application
  await page.goto('/');

  // Assert the page title — toHaveTitle retries until it matches or times out
  await expect(page).toHaveTitle(/My Application/);

  // Assert the main heading is visible
  await expect(
    page.getByRole('heading', { level: 1 })
  ).toBeVisible();
});
```

Key points:
- `async ({ page })` — `page` is injected by Playwright's fixture system
- `page.goto('/')` — relative URL resolved against `baseURL` in `playwright.config.ts`
- `expect(page).toHaveTitle(/My Application/)` — regex match, retries automatically
- No `await browser.close()` — Playwright handles cleanup via fixtures

---

## Q201.15 — Describe why your team migrated to or chose Playwright over another tool

Our team previously used Cypress. The decision to move to Playwright came from
two recurring problems.

First, we had a multi-step checkout flow that triggered a payment provider in
an iframe from a different origin. Cypress blocked cross-origin iframe interaction.
We were maintaining a separate WebDriverIO suite just for payment tests. That
duplication had a real maintenance cost.

Second, we needed WebKit coverage because a significant portion of our users
were on Safari. Cypress could not give us that on our Linux CI machines.

We migrated over three months: new tests in Playwright, parallel Cypress tests
kept running to catch regressions. After 1,000 Playwright tests, we retired
the Cypress suite.

The outcome: the cross-origin payment tests now run in Playwright without
workarounds. Safari coverage runs on Linux CI via Playwright's WebKit. And
overall test execution time dropped by 40% because Playwright's parallel workers
are more efficient than Cypress's default single-process execution.

---

## Chapter Summary — Key Points for Your Interview

- Playwright is Microsoft's browser automation library and test runner for
  Chromium, Firefox, and WebKit.
- It communicates directly over CDP/WebSocket — no HTTP-per-command overhead
  like Selenium. This enables auto-waiting and real-time event handling.
- `@playwright/test` is the full testing package. `playwright-core` is the raw
  library without a runner or fixtures.
- Playwright wins over Cypress for multi-tab, cross-origin, WebKit, and free
  parallel execution. Cypress wins for visual interactive debugging.
- Playwright wins over Selenium for auto-waiting, TypeScript, and zero driver
  management. Selenium wins for legacy browser support and broader language ecosystem.

---
