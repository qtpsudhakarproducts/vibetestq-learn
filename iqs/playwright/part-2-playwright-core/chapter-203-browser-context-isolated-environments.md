# Chapter 203 — BrowserContext — Isolated Environments


This chapter covers Playwright's internal architecture — how it communicates
with browsers, what the Browser/BrowserContext/Page hierarchy means, and why
context isolation matters. Interviewers at mid-level and above ask these
questions because understanding the architecture predicts how well a candidate
will design their framework and debug complex failures.

---

## Q203.1 — How does Playwright communicate with the browser?

Playwright communicates via a persistent WebSocket connection. When you launch
a browser, Playwright opens a WebSocket to the browser process. Every command
— click, fill, navigate — is sent as a JSON message over this connection. The
browser executes the command and sends back a response.

For Chromium, this protocol is the Chrome DevTools Protocol (CDP). For Firefox
and WebKit, Playwright uses similar custom protocols.

The WebSocket is bidirectional and persistent. This is fundamentally different
from Selenium, which makes a new HTTP request for every command. The persistent
connection eliminates network round-trip overhead per command and allows
Playwright to receive real-time events from the browser — network responses,
console messages, dialog appearances — without polling.

---

## Q203.2 — What is the Chrome DevTools Protocol (CDP)?

CDP is the protocol that Chrome's DevTools UI uses internally to control the
browser. It exposes the full power of Chrome — not just navigation and element
interaction, but network events, performance metrics, JavaScript evaluation,
DOM inspection, and more.

Playwright uses CDP for Chromium-based browsers. This gives Playwright
capabilities that WebDriver does not expose:

- Intercepting and modifying network requests and responses (including bodies)
- Capturing full network HAR logs
- Injecting code at browser startup before any page loads
- Accessing service workers
- Real-time console output capture

CDP is a public protocol documented by Chrome. Other tools — Puppeteer,
Chrome DevTools, various debugging tools — also use it.

---

## Q203.3 — What is the Browser, BrowserContext, Page hierarchy in Playwright?

```
Playwright (Node.js process)
└── Browser (one browser process)
    ├── BrowserContext 1 (isolated session A)
    │   ├── Page (tab 1)
    │   └── Page (tab 2)
    └── BrowserContext 2 (isolated session B)
        └── Page (tab 3)
```

**Browser** — one running browser process (Chromium, Firefox, or WebKit).
Launching a browser is expensive. Tests share a browser but not contexts.

**BrowserContext** — an isolated browser session. Like an incognito window.
Has its own: cookies, local storage, session storage, IndexedDB, permissions,
and network state. By default, Playwright creates one context per test.

**Page** — one browser tab within a context. You interact with elements through
a page. A context can have multiple pages (tabs), but most tests use one.

---

## Q203.4 — How does your project use BrowserContexts?

In our project, BrowserContexts are managed entirely by Playwright's fixture
system. We never call `browser.newContext()` manually in tests.

The default `context` fixture creates one fresh BrowserContext per test. Tests
that need a pre-authenticated session use a custom `authenticatedContext` fixture
that creates a context with `storageState` pre-loaded:

```typescript
export const test = base.extend({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/user.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});
```

Each test gets its own isolated context. Cookies from one test never leak into
another. This is what makes our tests run safely in parallel.

---

## Q203.5 — What is a BrowserContext and why is it important for test isolation?

A BrowserContext is a fully isolated browser session. It has its own:
- Cookies and session storage
- Authentication state (login sessions)
- Permissions (geolocation, notifications)
- Network request history
- Downloaded files

When Playwright creates a new context for each test, that test starts with
a completely clean browser state. It is as if the user opened a fresh incognito
window for every test. No cookie from a previous test persists. No login
session leaks.

This is the mechanism that enables parallel test execution. Two tests running
at the same time use separate contexts on the same browser process. They cannot
interfere with each other's state.

If you share a context between tests — or use a global `page` variable across
tests — tests become order-dependent and intermittently fail when run in
parallel. The fix is always: one context per test, managed by a fixture.

---

## Q203.6 — What happens inside Playwright when you call page.click()?

Six things happen in sequence:

1. **Playwright resolves the locator** — the selector is evaluated against
   the live DOM to find the matching element.

2. **Actionability checks** — Playwright verifies the element is: attached
   to the DOM, visible, stable (not animating), not obscured by another
   element, and enabled (not disabled).

3. **If any check fails** — Playwright waits and retries until the check
   passes or the action timeout is reached.

4. **Playwright scrolls the element into view** if it is not in the viewport.

5. **Playwright sends the click command** over the WebSocket/CDP connection
   to the browser.

6. **The browser performs the click** on the element and sends confirmation
   back to Playwright.

If any actionability check never passes within the timeout, Playwright throws
a `TimeoutError` with a description of which check failed.

---

## Q203.7 — What is the difference between a Page and a BrowserContext?

A **BrowserContext** holds the session state — cookies, storage, auth.
A **Page** is a single tab within that context — it has its own URL and DOM.

A context can have multiple pages (tabs). Pages within the same context share
the context's cookies and storage. Pages in different contexts are completely
isolated.

```typescript
const context = await browser.newContext();

const page1 = await context.newPage(); // tab 1
const page2 = await context.newPage(); // tab 2 — shares cookies with page1

const context2 = await browser.newContext();
const page3 = await context2.newPage(); // tab 3 — isolated from page1 and page2
```

In most tests, one context has one page. Multiple pages per context appear
when testing multi-tab workflows (links that open new tabs, popups).

---

## Q203.8 — What is auto-waiting and how does Playwright implement it?

Auto-waiting is Playwright's mechanism of retrying actionability checks before
executing a browser action. Instead of executing immediately, every action
runs a check loop:

1. Resolve the locator
2. Check actionability conditions
3. If all pass — execute the action
4. If any fails — wait 100ms and retry from step 1
5. If the action timeout is reached — throw TimeoutError

This loop runs inside the browser, not in Node.js. Playwright evaluates the
conditions directly in the browser process using the protocol connection.

For assertions, `expect(locator).toBeVisible()` runs a similar retry loop —
re-evaluating the condition every 100ms until it passes or the assertion
timeout is reached.

This design eliminates virtually all `waitForTimeout` calls. Instead of
"wait 2 seconds then click", Playwright's "click" already waits for the element
to be ready — however long that takes.

---

## Q203.9 — What is the difference between playwright-core and @playwright/test?

`playwright-core` is the raw automation library. No test runner. No `test()`
function. No fixtures. No reporters. Just the browser control API.

`@playwright/test` includes playwright-core plus the full testing infrastructure:
- `test()` and `describe()` — test structure
- `expect()` with web-first assertions
- Fixtures — `page`, `context`, `browser`, `request` (and custom ones)
- `playwright.config.ts` — centralised config
- Parallel workers — run tests across multiple processes
- Reporters — html, list, junit, json
- CLI — `npx playwright test` with all flags

For test automation projects: always use `@playwright/test`.

`playwright-core` is for non-test use cases — building a monitoring tool,
a PDF generator, a web scraper — where you want browser control without
a test runner wrapper.

---

## Q203.10 — What is the difference between Playwright's architecture and Selenium WebDriver?

| | Playwright | Selenium WebDriver |
|---|---|---|
| Connection | Persistent WebSocket | HTTP per command |
| Protocol | CDP / WebKit / Firefox protocols | W3C WebDriver HTTP |
| Overhead | Low — one connection reused | High — HTTP round-trip per action |
| Auto-waiting | Built-in via protocol events | Must implement manually |
| Event listening | Real-time via WebSocket | Polling required |
| Browser management | Downloads own builds | Requires separate driver |
| Driver versioning | Not needed | Must keep driver synced with browser |

The architectural difference explains most of Playwright's reliability advantages.
Selenium's HTTP model means there is latency and potential for stale state
between every command. Playwright's WebSocket model gives it a live view of
the browser and enables reliable event-driven waiting.

---

## Q203.11 — Why does sharing a BrowserContext between tests cause problems?

A BrowserContext maintains state: cookies, session storage, local storage,
auth tokens. If two tests share one context:

**Test A** logs in as `admin@test.com` — the auth cookie is set in the context.

**Test B** expects to be unauthenticated — but the context still has the auth
cookie from Test A.

**Test C** logs in as `user@test.com` — but Test B (which ran between A and C)
may have partially modified the session.

Result: tests pass or fail depending on their execution order, and parallel
execution makes everything unpredictable.

```typescript
// ❌ Anti-pattern — shared context between tests
let page: Page;
beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  page = await context.newPage(); // shared across all tests in this suite
});

// ✅ Correct — Playwright creates one context per test automatically
test('test A', async ({ page }) => { /* fresh context */ });
test('test B', async ({ page }) => { /* fresh context */ });
```

The `page` fixture in `@playwright/test` creates a fresh context for every
test automatically. This is its most important property.

---

## Q203.12 — What are the six actionability checks Playwright performs before clicking?

Before any click (and most other actions), Playwright verifies:

1. **Attached** — the element exists in the DOM and has not been removed

2. **Visible** — the element is not hidden by `display: none`,
   `visibility: hidden`, or `opacity: 0`

3. **Stable** — the element's position is not changing (not mid-animation)

4. **Receives events** — the element is not covered by another element that
   would intercept the click (no overlay, no modal in the way)

5. **Enabled** — the element does not have the `disabled` attribute

6. **Editable** — (for `fill` and related actions only) the element is
   not `readonly`

All six checks run inside a retry loop. If any check fails, Playwright waits
and retries. If all six pass, the action executes.

---

## Q203.13 — Write code that manually creates a BrowserContext with custom options

```typescript
import { test, expect, Browser } from '@playwright/test';

// Custom context — override specific options for a single test or group
test('logged-in user with mobile viewport', async ({ browser }: { browser: Browser }) => {
  // Create a context with custom viewport, locale, and pre-loaded auth state
  const context = await browser.newContext({
    viewport:     { width: 390, height: 844 },   // iPhone 14
    locale:       'en-GB',
    timezoneId:   'Europe/London',
    storageState: 'playwright/.auth/admin.json',  // pre-authenticated session
    extraHTTPHeaders: {
      'x-test-run': 'playwright',               // custom header on every request
    },
  });

  const page = await context.newPage();

  await page.goto('/dashboard');
  await expect(page.getByRole('heading')).toBeVisible();

  // Always close custom contexts — Playwright does not manage these automatically
  await context.close();
});
```

In most tests, you do not create contexts manually — fixtures handle this.
Manual context creation is for edge cases that need settings different from
the global config — specific locales, device emulation, or special HTTP headers.

---

## Q203.14 — Write code that demonstrates context isolation between two tests

```typescript
import { test, expect, chromium } from '@playwright/test';

// This demonstrates isolation at the low level — normally fixtures handle this
test.describe('Context isolation demonstration', () => {

  test('test A sets a cookie', async ({ context, page }) => {
    await page.goto('/');

    // Set a cookie in context A
    await context.addCookies([{
      name:   'test-session',
      value:  'session-from-test-A',
      url:    'https://example.com',
    }]);

    // Verify the cookie is set in this test's context
    const cookies = await context.cookies();
    expect(cookies.some(c => c.name === 'test-session')).toBe(true);
  });

  test('test B has no cookie from test A', async ({ context, page }) => {
    await page.goto('/');

    // This context is completely separate — test A's cookie does not exist here
    const cookies = await context.cookies();
    const testCookie = cookies.find(c => c.name === 'test-session');

    expect(testCookie).toBeUndefined(); // clean context, nothing from test A
  });
});
```

Each `test()` block gets a fresh `context` fixture. Any state from a previous
test — cookies, storage, auth — does not exist in the next test's context.

---

## Q203.15 — Describe a time when understanding Playwright's architecture helped you debug a problem

In our project, a test that verified the shopping cart was intermittently
failing in CI but always passing locally. The error was `ElementNotFound` on
the cart icon — an element that should always be visible after login.

I opened the trace file (`trace.zip`) in the Playwright Trace Viewer. The
trace showed the full network timeline: the login API call completed, the page
navigated to the dashboard, and then — the cart data loaded from a separate
`/api/cart` endpoint that the test was not waiting for. The cart icon was
rendered by React only after this API call resolved. On a fast local machine,
the API responded in 200ms. On CI, it took 1,200ms.

Understanding that Playwright's auto-waiting only handles DOM-level element
state — not whether async data has loaded and caused React to render the element
— explained the failure. The fix was:

```typescript
// Wait for the cart API response before asserting the icon
const [cartResponse] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/cart')),
  page.goto('/dashboard'),
]);
await expect(page.getByTestId('cart-icon')).toBeVisible();
```

The Trace Viewer's network timeline made a 20-minute debug session instant.
Without understanding that Playwright sees the DOM but the API call happens
outside that view, I would have added a `waitForTimeout` and moved on — creating
a slow, fragile test instead of a correct one.

---

## Chapter Summary — Key Points for Your Interview

- Playwright uses a persistent WebSocket to communicate with browsers.
  Chromium uses CDP. Firefox and WebKit use equivalent protocols.
- `Browser` > `BrowserContext` > `Page` is the hierarchy. One context per test
  is the rule. Context holds session state; Page is one tab.
- Auto-waiting: before every action, Playwright checks 6 actionability conditions
  and retries until they pass or the timeout is reached.
- `@playwright/test` includes the runner, fixtures, assertions. `playwright-core`
  is the raw library without any of that.
- Never share a BrowserContext between tests. Shared state causes order-dependent
  failures and breaks parallelism.

---
