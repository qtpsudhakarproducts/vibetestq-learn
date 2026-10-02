# Browser, Context & Pages – Detailed Notes
### Test Automation with Playwright + TypeScript

---

## Table of Contents
1. [The Three-Layer Model](#1-the-three-layer-model)
2. [What Is a Browser?](#2-what-is-a-browser)
3. [What Is a Browser Context?](#3-what-is-a-browser-context)
4. [What Is a Page?](#4-what-is-a-page)
5. [How Browser, Context and Page Relate to Each Other](#5-how-browser-context-and-page-relate-to-each-other)
6. [Why Contexts Exist — Isolation and Real-World Use Cases](#6-why-contexts-exist--isolation-and-real-world-use-cases)
7. [Working With Multiple Pages in a Context](#7-working-with-multiple-pages-in-a-context)
8. [Working With Multiple Contexts in a Browser](#8-working-with-multiple-contexts-in-a-browser)
9. [Inspecting Pages and Contexts in DevTools](#9-inspecting-pages-and-contexts-in-devtools)
10. [Common Automation Failures & Root Causes](#10-common-automation-failures--root-causes)
11. [Quick Reference Cheat Sheet](#11-quick-reference-cheat-sheet)

---

## 1. The Three-Layer Model

Before diving into each concept individually, it is important to understand how they stack. Playwright organises all browser activity in three distinct, nested layers:

```
Browser
  └── BrowserContext  (isolated session)
       └── Page       (a single tab / window)
            └── Frame (main frame + iframes)
```

Each layer has a specific responsibility:

| Layer | Real-world equivalent | Controls |
|---|---|---|
| **Browser** | The Chrome / Firefox / Safari application | Process, binary, launch flags |
| **BrowserContext** | An incognito window (completely separate session) | Cookies, localStorage, auth state, permissions, network |
| **Page** | A single browser tab | URL, DOM, JavaScript, screenshots, dialog handling |
| **Frame** | Main document or an iframe | Individual documents within a page |

Every test you write operates inside this hierarchy whether you think about it or not. When you call `page.goto()` you are working at the Page layer. When you call `page.context()` you step up to the Context layer. Understanding the boundaries between layers is what separates confident test automation from debugging in the dark.

---

## 2. What Is a Browser?

In Playwright, a **Browser** is the top-level object that represents a running browser process. It is the actual binary — Chromium, Firefox, or WebKit — launched and controlled by Playwright.

### Key Characteristics

- There is typically **one Browser instance per test run** (or per worker in parallel execution)
- The Browser itself holds no session state — it does not have cookies, local storage, or logged-in users
- All session state lives in **BrowserContexts**, which the Browser creates
- Launching a browser is an expensive operation — it starts a real OS process

### How a Browser Is Launched

```ts
import { chromium, firefox, webkit } from '@playwright/test';

// Manual launch (for library use or custom setups)
const browser = await chromium.launch();
const browser = await chromium.launch({ headless: false });  // visible window
const browser = await firefox.launch({ slowMo: 100 });       // slowed down for debugging
const browser = await webkit.launch();
```

When using `@playwright/test` (the test runner), Playwright launches and manages the browser for you automatically. You rarely interact with the `browser` object directly in tests — you work with `context` and `page`.

### Browser Launch Options

```ts
const browser = await chromium.launch({
  headless: true,          // run without a visible window (default in CI)
  slowMo: 0,               // milliseconds to slow down each action (debugging)
  devtools: false,         // automatically open DevTools panel
  args: [                  // pass Chrome flags directly
    '--disable-web-security',
    '--start-maximized'
  ],
  executablePath: '/path/to/chrome',  // use a specific browser binary
  timeout: 30000           // max time to launch before failing
});
```

### Browser Types in Playwright

| Browser | Engine | Covers |
|---|---|---|
| `chromium` | Blink | Chrome, Edge, Opera, most enterprise apps |
| `firefox` | Gecko | Firefox |
| `webkit` | WebKit | Safari on macOS and iOS |

> 💡 **Mental Model:** The Browser is the factory. It does not produce products itself — it creates Contexts, and Contexts create Pages. The Browser just keeps the factory running.

### Closing the Browser

```ts
await browser.close();
```

Closing the browser closes all contexts and pages inside it. In the Playwright test runner, this is handled automatically at the end of each test worker's lifecycle.

---

## 3. What Is a Browser Context?

A **BrowserContext** is the most important concept to understand in Playwright. It is a **completely isolated browser session** — equivalent to opening a brand new incognito window that shares nothing with any other window.

### What a Context Isolates

Each context has its own independent:

- **Cookies** — logging in within one context does not affect another context
- **localStorage and sessionStorage** — data written in one context is invisible to another
- **IndexedDB** — browser-side database storage
- **Authentication state** — session tokens, JWTs, auth cookies
- **Service workers** — registered workers are per-context
- **Permissions** — geolocation, camera, notifications granted or denied
- **HTTP credentials** — Basic/Digest auth settings
- **Network interception** — route rules applied per context
- **Cache** — HTTP cache is not shared between contexts
- **Browser history** — back/forward navigation state

Two contexts running inside the same browser process behave as if they are in completely different browsers, from the perspective of authentication and state.

### Creating a Context

```ts
// Manual creation (library use)
const context = await browser.newContext();

// With options
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  userAgent: 'Mozilla/5.0 ...',
  locale: 'en-US',
  timezoneId: 'America/New_York',
  geolocation: { latitude: 40.7128, longitude: -74.0060 },
  permissions: ['geolocation'],
  httpCredentials: { username: 'admin', password: 'secret' },
  ignoreHTTPSErrors: true,
  recordVideo: { dir: 'videos/' }
});
```

In `@playwright/test`, the test runner creates a context automatically for each test. You access it via the `context` fixture.

### Context Fixture in Tests

```ts
import { test, expect } from '@playwright/test';

test('example', async ({ context, page }) => {
  // context — the BrowserContext for this test (auto-created, auto-closed)
  // page    — the first page inside this context (also auto-created)
});
```

By default in `@playwright/test`, **each test gets its own fresh context** — which means each test starts with no cookies, no logged-in state, and no leftover data from other tests. This is the foundation of test isolation.

### Closing a Context

```ts
await context.close();
```

Closing a context closes all pages inside it and discards all associated state (cookies, storage, etc.). In the test runner, this is automatic at the end of each test.

> 💡 **Mental Model:** A BrowserContext is like a fresh incognito window. It shares the same browser engine underneath, but has zero shared state with any other context. Opening a new context is cheap and fast — you can create dozens of them in a single test run without significant overhead.

---

## 4. What Is a Page?

A **Page** in Playwright represents a **single browser tab or popup window**. It is the object you interact with most directly in your tests — navigating to URLs, clicking elements, filling forms, and making assertions all happen on a `Page`.

### What a Page Contains

- A **main frame** — the primary document loaded at the current URL
- Zero or more **child frames** — iframes embedded in the page
- Its own **JavaScript execution context** — tied to the page's `window` object
- Its own **dialog handling** — alert, confirm, prompt
- Its own **network requests** — you can intercept per-page
- Its own **console messages and errors**
- Its own **screenshot and PDF rendering**

### Creating a Page

```ts
// Create a new page inside a context
const page = await context.newPage();

// Navigate to a URL
await page.goto('https://myapp.com');

// In @playwright/test — the page fixture is created automatically
test('example', async ({ page }) => {
  await page.goto('https://myapp.com');
});
```

### Key Page Actions

```ts
// Navigation
await page.goto('https://myapp.com/login');
await page.reload();
await page.goBack();
await page.goForward();

// Waiting
await page.waitForLoadState('networkidle');
await page.waitForURL('**/dashboard');
await page.waitForSelector('#main-content');

// Information
console.log(await page.title());
console.log(page.url());

// Screenshots
await page.screenshot({ path: 'screenshot.png', fullPage: true });

// JavaScript execution
const result = await page.evaluate(() => window.innerWidth);

// Dialog handling
page.on('dialog', dialog => dialog.accept());

// Console monitoring
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
```

### Page Load States

Playwright provides three load state options for waiting. Understanding which to use prevents flaky tests:

| State | Fires when | Use when |
|---|---|---|
| `domcontentloaded` | HTML is parsed, DOM is ready | Page is fast, testing DOM structure |
| `load` | All resources (images, scripts) are loaded | Default — good for most pages |
| `networkidle` | No network requests for 500ms | Pages with heavy async data loading |

```ts
await page.goto('https://myapp.com', { waitUntil: 'networkidle' });
// or after navigation
await page.waitForLoadState('networkidle');
```

> 💡 **Mental Model:** A Page is a browser tab. Just like you can have many tabs open in one incognito window, you can have many Pages inside one BrowserContext. All tabs in the same incognito window share cookies — and so do all Pages inside the same BrowserContext.

---

## 5. How Browser, Context and Page Relate to Each Other

This section explains the critical rules that govern how the three layers interact. Understanding these rules eliminates most context and page-related bugs.

### Rule 1 — Contexts Share Nothing

Two contexts in the same browser share absolutely no state:

```
Browser (Chromium)
  ├── Context A  → cookies: { user: "alice" }
  │    └── Page  → url: https://myapp.com/dashboard
  │
  └── Context B  → cookies: {}  (empty — knows nothing about alice)
       └── Page  → url: https://myapp.com/login  (not logged in)
```

Alice's session in Context A is completely invisible to Context B, even though they are running in the same Chromium process.

### Rule 2 — Pages in the Same Context Share State

Multiple pages inside one context behave like multiple tabs in the same regular browser window:

```
Context A  (cookies: { sessionToken: "abc123" })
  ├── Page 1  → url: https://myapp.com/dashboard  (logged in as admin)
  └── Page 2  → url: https://myapp.com/settings   (also logged in as admin)
```

If Page 1 logs out (deleting the session cookie), Page 2 is now also logged out — because they share the same cookie jar.

### Rule 3 — Closing a Context Destroys All Its Pages

```ts
await context.close();
// All pages inside context are now closed and unusable
// All cookies, storage, auth state — gone
```

### Rule 4 — A Page Cannot Move Between Contexts

A page created inside Context A cannot be reassigned to Context B. Pages are permanently bound to the context they were created in.

### Rule 5 — Each Test Gets Its Own Context (in @playwright/test)

By default, every test gets a fresh context. Tests cannot accidentally contaminate each other's cookies or storage:

```ts
// Test 1 — runs in Context A
test('login as admin', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'admin');
  // ...
});

// Test 2 — runs in Context B (completely fresh)
test('login as user', async ({ page }) => {
  await page.goto('/login');
  // No admin session here — Context B is empty
});
```

### Visual Summary

```
chromium.launch()
  └── browser.newContext()       ← isolated session
       ├── context.newPage()     ← tab 1 (shares context cookies)
       ├── context.newPage()     ← tab 2 (shares context cookies)
       └── context.newPage()     ← tab 3 (shares context cookies)

browser.newContext()             ← second isolated session
  ├── context.newPage()          ← tab 1 (knows nothing about first context)
  └── context.newPage()          ← tab 2
```

---

## 6. Why Contexts Exist — Isolation and Real-World Use Cases

BrowserContexts are not just a technical abstraction — they map directly to real testing problems.

### Use Case 1 — Test Isolation (Default Behaviour)

The most fundamental use of contexts is test isolation. Each test gets its own context so it cannot be affected by what previous tests did. Without context isolation, a test that leaves a cookie behind could cause every subsequent test to run in an unexpected logged-in state.

```ts
// playwright.config.ts — context is automatically fresh per test
export default defineConfig({
  use: {
    baseURL: 'https://myapp.com',
    // Each test automatically gets a new context
  }
});
```

### Use Case 2 — Pre-Authenticated State (storageState)

Running the full login flow in every test is slow. Instead, you run login once, save the authenticated state to a file, and then load that state into new contexts instantly:

```ts
// global-setup.ts — run login once and save state
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('https://myapp.com/login');
await page.fill('#username', 'admin');
await page.fill('#password', 'secret');
await page.click('[type="submit"]');
await page.waitForURL('**/dashboard');

// Save cookies + localStorage to a file
await context.storageState({ path: 'auth/admin.json' });
await browser.close();
```

```ts
// In tests — load the saved state instead of logging in
test.use({ storageState: 'auth/admin.json' });

test('admin can see settings', async ({ page }) => {
  await page.goto('/settings');
  // Already logged in — no login flow needed
});
```

### Use Case 3 — Multi-User / Multi-Role Testing

Testing scenarios where two users interact (user sends a message, admin receives it) requires two independent sessions simultaneously. Contexts make this natural:

```ts
test('admin can see user submission', async ({ browser }) => {
  // User session
  const userContext = await browser.newContext({ storageState: 'auth/user.json' });
  const userPage = await userContext.newPage();

  // Admin session
  const adminContext = await browser.newContext({ storageState: 'auth/admin.json' });
  const adminPage = await adminContext.newPage();

  // User submits a form
  await userPage.goto('/submit');
  await userPage.fill('#message', 'Hello admin');
  await userPage.click('[type="submit"]');

  // Admin verifies it appears
  await adminPage.goto('/admin/inbox');
  await adminPage.reload();
  await expect(adminPage.getByText('Hello admin')).toBeVisible();

  await userContext.close();
  await adminContext.close();
});
```

### Use Case 4 — Device and Viewport Emulation

Each context can emulate a different device. You can test mobile and desktop simultaneously in the same test run:

```ts
// playwright.config.ts
projects: [
  { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
  { name: 'Mobile Safari',  use: { ...devices['iPhone 13'] } },
  { name: 'Tablet',         use: { ...devices['iPad Pro'] } }
]
```

Or manually per test:

```ts
const mobileContext = await browser.newContext({
  ...devices['iPhone 13'],
  locale: 'en-GB'
});
```

### Use Case 5 — Network Interception and Mocking

Network routes and request interception are configured per context. Different contexts can intercept the same API differently:

```ts
// Context A — uses real API
const realContext = await browser.newContext();

// Context B — intercepts and mocks the API
const mockedContext = await browser.newContext();
await mockedContext.route('**/api/products', route =>
  route.fulfill({ json: [{ id: 1, name: 'Mocked Product' }] })
);
```

### Use Case 6 — Permission Testing

Grant or deny browser permissions per context to test permission-dependent features:

```ts
// Context with geolocation granted
const geoContext = await browser.newContext({
  geolocation: { latitude: 51.5074, longitude: -0.1278 },
  permissions: ['geolocation']
});

// Context with geolocation denied
const deniedContext = await browser.newContext();
await deniedContext.grantPermissions([]);
```

---

## 7. Working With Multiple Pages in a Context

Multiple pages inside one context is the equivalent of having multiple tabs open in the same browser window. They share cookies and storage, and this shared state is both a feature and a source of subtle bugs.

### Creating Multiple Pages

```ts
const context = await browser.newContext();

const page1 = await context.newPage();
const page2 = await context.newPage();
const page3 = await context.newPage();

await page1.goto('https://myapp.com/dashboard');
await page2.goto('https://myapp.com/settings');
await page3.goto('https://myapp.com/reports');
```

### Listing All Pages in a Context

```ts
const pages = context.pages();
console.log(pages.length);    // number of open pages
console.log(pages[0].url());  // URL of first page
```

### Handling Pages Opened by the Application

Many real-world applications open new tabs programmatically — clicking "Open in new tab", clicking an external link, or triggering a popup from a button. Playwright provides a way to capture these:

```ts
// Capture a page that the application opens
const [newPage] = await Promise.all([
  context.waitForEvent('page'),          // wait for new page to open
  page.click('[target="_blank"]')        // action that triggers it
]);

await newPage.waitForLoadState();
console.log(newPage.url());
await expect(newPage.getByRole('heading')).toBeVisible();
```

The `Promise.all()` pattern is critical here. If you click first and then wait, you may miss the `page` event because the new tab opens faster than your `waitForEvent` listener registers.

### Handling Popups

Popups are pages too — they are just opened with `window.open()` instead of a navigation:

```ts
// Capture a popup window
const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  page.getByRole('button', { name: 'Open preview' }).click()
]);

await popup.waitForLoadState();
await expect(popup).toHaveTitle('Preview');
await popup.close();
```

### Switching Between Pages

Playwright does not have a global "active page" concept. You always reference whichever `page` object you want to act on:

```ts
const page1 = await context.newPage();
const page2 = await context.newPage();

await page1.goto('/cart');
await page2.goto('/wishlist');

// Add to cart on page1
await page1.getByRole('button', { name: 'Add to cart' }).click();

// Verify cart count updated on page2 (same session — shared cookies)
await page2.reload();
await expect(page2.getByTestId('cart-count')).toHaveText('1');
```

### Closing a Specific Page

```ts
await page2.close();
// page1 and page3 are still open
// context is still alive
```

### Listening to Page Events

```ts
// Detect when any new page is opened in the context
context.on('page', newPage => {
  console.log('New page opened:', newPage.url());
});

// Detect when a page is closed
page.on('close', () => {
  console.log('Page was closed');
});
```

### Important Shared-State Behaviours to Know

Because all pages in a context share cookies and storage, certain actions on one page affect all others:

| Action on Page 1 | Effect on Page 2 |
|---|---|
| Login (sets session cookie) | Page 2 is now also logged in |
| Logout (clears session cookie) | Page 2 is now logged out too |
| Write to localStorage | Page 2 can read that value |
| Clear localStorage | Page 2 loses that data |
| Change language preference (cookie) | Page 2 switches language on next load |
| Modify a resource via API | Page 2 sees the change on reload |

> ⚠️ **Common Bug:** A test opens two pages, performs an action on page1, then expects page2 to be unaffected. But because they share a session, the action has side effects on page2. If you need completely independent sessions, use separate contexts — not separate pages.

---

## 8. Working With Multiple Contexts in a Browser

Multiple contexts in the same browser gives you independent sessions running in parallel inside a single browser process. This is the pattern for multi-user testing, parallel test execution, and role-based scenarios.

### Creating Multiple Contexts

```ts
const browser = await chromium.launch();

const context1 = await browser.newContext();
const context2 = await browser.newContext();

const page1 = await context1.newPage();
const page2 = await context2.newPage();
```

`context1` and `context2` share zero state. They are as isolated from each other as two completely separate browser instances — but they run inside the same process, making them fast and memory-efficient.

### Loading Auth State Into Contexts

The most common pattern for multi-context tests is loading pre-saved auth states:

```ts
test('two users interact', async ({ browser }) => {
  const adminContext = await browser.newContext({
    storageState: 'auth/admin.json'
  });
  const userContext = await browser.newContext({
    storageState: 'auth/user.json'
  });

  const adminPage = await adminContext.newPage();
  const userPage  = await userContext.newPage();

  // Run both users simultaneously
  await Promise.all([
    adminPage.goto('/admin/dashboard'),
    userPage.goto('/user/home')
  ]);

  // Test interaction between them...

  await adminContext.close();
  await userContext.close();
});
```

### Context-Level Network Interception

Each context has its own routing rules. This lets you test different API response scenarios in parallel:

```ts
// Context 1 — happy path (real API or 200 responses)
const happyContext = await browser.newContext();

// Context 2 — error state (500 response)
const errorContext = await browser.newContext();
await errorContext.route('**/api/data', route =>
  route.fulfill({ status: 500, body: 'Internal Server Error' })
);

// Context 3 — slow network
const slowContext = await browser.newContext();
await slowContext.route('**/api/**', async route => {
  await new Promise(r => setTimeout(r, 3000)); // 3 second delay
  await route.continue();
});
```

### Contexts in Parallel Test Execution

When Playwright runs tests in parallel (multiple workers), each worker typically owns one browser and creates one context per test. The structure looks like:

```
Worker 1
  └── Browser (Chromium)
       ├── Context (Test A) → Page → runs test A
       └── Context (Test B) → Page → runs test B

Worker 2
  └── Browser (Chromium)
       ├── Context (Test C) → Page → runs test C
       └── Context (Test D) → Page → runs test D
```

Tests in different workers run in completely separate browser processes. Tests in the same worker run in separate contexts within the same process — isolated but sharing the same Chromium binary.

### Context Reuse Across Tests (Advanced)

By default, each test creates and destroys its own context. For performance-sensitive scenarios where login is slow and running it per-test is impractical, you can share a context across tests using fixtures:

```ts
// fixture that creates one context for multiple tests
import { test as base } from '@playwright/test';

const test = base.extend<{}, { sharedContext: BrowserContext }>({
  sharedContext: [async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'auth/admin.json' });
    await use(context);
    await context.close();
  }, { scope: 'worker' }]
});
```

> ⚠️ **Warning:** Sharing a context across tests means tests are no longer isolated from each other. A cookie or localStorage change in test A will affect test B. Only use this pattern when you are certain tests do not mutate shared state, or when performance requirements demand it.

### Configuring Context Defaults in playwright.config.ts

Instead of setting context options in every test, define defaults at the project level:

```ts
// playwright.config.ts
export default defineConfig({
  use: {
    // These apply to every context created by the test runner
    baseURL: 'https://myapp.com',
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezoneId: 'America/Chicago',
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  }
});
```

---

## 9. Inspecting Pages and Contexts in DevTools

The browser DevTools available to test automation engineers primarily targets what is happening at the **Page** level. There is no built-in DevTools panel that shows you Playwright's context or browser objects — those are Playwright abstractions above the browser's own concepts.

### What DevTools Shows at the Page Level

When you run a test in headed mode (`headless: false`) or open DevTools manually, what you see corresponds to a single page's state:

- **Elements tab** — the DOM of the current page (the main frame)
- **Console tab** — JavaScript errors and logs from the current page
- **Network tab** — HTTP requests made by the current page
- **Application tab** — cookies, localStorage, sessionStorage for the current origin
- **Sources tab** — JavaScript files loaded by the current page

### Inspecting Cookies and Storage (Seeing Context State)

Because cookies and localStorage live at the context level (shared across pages in the same context), the Application tab in DevTools is where you can verify context-level state:

**How to inspect:**
1. Open DevTools → Application tab
2. Expand **Storage → Cookies → your domain** to see all cookies set in this context
3. Expand **Storage → Local Storage → your domain** to see localStorage values
4. Expand **Storage → Session Storage** for sessionStorage

This is the practical way to verify that a login flow worked (session cookie is present), that a context is using the expected auth state (loaded from `storageState`), or that a logout correctly cleared all tokens.

### Identifying Which Page You Are Looking At

In headed mode, Playwright may have multiple pages open. DevTools attaches to whichever page is currently in focus. If you need to inspect a specific page:

- Click on that page's tab in the browser window to bring it to focus
- DevTools will now reflect that page's DOM, console, and network activity

Alternatively, use Playwright's `--debug` mode or the Playwright Inspector, which shows all pages and lets you step through test actions:

```bash
PWDEBUG=1 npx playwright test my-test.spec.ts
```

### Playwright Inspector — Better Than DevTools for Automation Debugging

The Playwright Inspector is purpose-built for test debugging. It shows:

- All pages currently open in the test
- The current test action being executed
- Live locator highlighting — hover over a locator in the inspector to see it highlighted on the page
- Full action log with timing
- The ability to pause, step forward, and resume test execution

```bash
# Run with inspector
PWDEBUG=1 npx playwright test

# Or add pause in test code
await page.pause();  # opens the inspector at this point
```

### Playwright Trace Viewer — Post-Run Inspection

For failures that only happen in CI or are hard to reproduce, the Trace Viewer records the full test execution and lets you inspect it after the fact:

```ts
// playwright.config.ts
use: { trace: 'retain-on-failure' }
```

```bash
npx playwright show-trace trace.zip
```

The Trace Viewer shows:
- A timeline of every action taken during the test
- DOM snapshots at each step — you can inspect the Elements tab at any point in time
- Network requests with request/response bodies
- Console errors
- Screenshots at each action

> 💡 **Key Insight:** DevTools shows you the current state of one page. The Playwright Inspector shows you the current state of all pages in a test. The Trace Viewer shows you the historical state of all pages across the entire test run. Use the right tool for the right debugging task.

### Debugging Context State Programmatically

When you cannot easily use DevTools (CI environment, headless mode), inspect context state in code:

```ts
// Get all cookies in a context
const cookies = await context.cookies();
console.log(cookies);

// Get cookies for a specific URL
const cookies = await context.cookies('https://myapp.com');

// Get localStorage values
const storageState = await context.storageState();
console.log(storageState.origins);

// Check all pages open in a context
const pages = context.pages();
pages.forEach(p => console.log(p.url()));
```

---

## 10. Common Automation Failures & Root Causes

| Symptom | Likely Root Cause | Solution |
|---|---|---|
| Test is already logged in unexpectedly | Context reused across tests (shared state leak) | Ensure each test uses a fresh context; check `storageState` config |
| Logout on one page affects another page's session | Two pages in same context share cookies | Expected behaviour — use separate contexts for independent sessions |
| New tab opened by app is not captured | `waitForEvent('page')` registered after the click | Use `Promise.all()` wrapping both the wait and the click simultaneously |
| Popup not captured | Same as above — event fired before listener registered | `Promise.all([context.waitForEvent('page'), page.click(...)])` |
| `storageState` auth not working | State file is stale or login session expired | Regenerate `storageState` file in `global-setup` |
| Test intermittently starts at wrong URL | Page not fully loaded before `goto` returned | Use `waitUntil: 'networkidle'` or `waitForLoadState` |
| Context cookies not persisting between pages | Pages on different subdomains — cookie domain mismatch | Check cookie `domain` attribute; ensure it covers all subdomains |
| `evaluate()` returns unexpected value | Evaluating on wrong page object | Confirm which page object you are calling evaluate on |
| Parallel tests interfere with each other | Tests sharing a context across workers | Give each test its own context; never share context across test boundaries |
| Context route not intercepting requests | Route registered after navigation started | Register routes on context before calling `page.goto()` |
| Device emulation not working | Viewport set after page load | Set `viewport` in `newContext()` options, not on the page after load |
| Browser launch timeout in CI | Chromium binary not found or system resources exhausted | Check `executablePath`, ensure sufficient CI resources, use `--no-sandbox` flag if needed |

---

## 11. Quick Reference Cheat Sheet

### Browser

```ts
// Launch
const browser = await chromium.launch({ headless: true });
const browser = await chromium.launch({ headless: false, slowMo: 100 });

// Close
await browser.close();

// Browser info
console.log(browser.browserType().name()); // 'chromium', 'firefox', 'webkit'
console.log(browser.version());
console.log(browser.isConnected());        // true if browser process is alive
```

### Context

```ts
// Create
const context = await browser.newContext();
const context = await browser.newContext({
  storageState: 'auth/user.json',        // load saved auth state
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  timezoneId: 'Europe/London',
  permissions: ['geolocation'],
  geolocation: { latitude: 51.5, longitude: -0.1 },
  ignoreHTTPSErrors: true,
  recordVideo: { dir: 'videos/' }
});

// Save state
await context.storageState({ path: 'auth/state.json' });

// Cookies
const cookies = await context.cookies();
await context.addCookies([{ name: 'token', value: 'abc', domain: 'myapp.com', path: '/' }]);
await context.clearCookies();

// Network interception
await context.route('**/api/**', route => route.fulfill({ json: { mocked: true } }));
await context.unroute('**/api/**');

// All pages in context
const pages = context.pages();

// Listen for new pages
context.on('page', page => console.log('New page:', page.url()));

// Close
await context.close();
```

### Page

```ts
// Create
const page = await context.newPage();

// Navigation
await page.goto('https://myapp.com', { waitUntil: 'networkidle' });
await page.reload();
await page.goBack();
await page.goForward();

// Wait
await page.waitForURL('**/dashboard');
await page.waitForLoadState('networkidle');
await page.waitForSelector('#content');
await page.waitForTimeout(1000);      // avoid in tests — use proper waits

// Info
console.log(page.url());
console.log(await page.title());

// JavaScript
const result = await page.evaluate(() => document.title);
await page.evaluate(value => localStorage.setItem('key', value), 'my-value');

// Screenshot
await page.screenshot({ path: 'shot.png', fullPage: true });

// Close
await page.close();
```

### Multiple Pages — Common Patterns

```ts
// Capture a new tab opened by the app
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.click('[target="_blank"]')
]);
await newPage.waitForLoadState();

// Capture a popup
const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  page.click('#open-popup')
]);

// List all open pages
context.pages().forEach(p => console.log(p.url()));

// Close a specific page
await newPage.close();
```

### Multiple Contexts — Common Patterns

```ts
// Two-user test
const adminCtx = await browser.newContext({ storageState: 'auth/admin.json' });
const userCtx  = await browser.newContext({ storageState: 'auth/user.json' });

const adminPage = await adminCtx.newPage();
const userPage  = await userCtx.newPage();

// ... test multi-user interaction ...

await adminCtx.close();
await userCtx.close();

// Mock API in one context, real API in another
const mockCtx = await browser.newContext();
await mockCtx.route('**/api/orders', route =>
  route.fulfill({ json: [] })   // empty orders
);
```

### Summary

| Scenario | Recommended Approach |
|---|---|
| Standard single-user test | Default — one context, one page per test |
| Skip login in every test | Save `storageState` in global setup, load per test |
| Test two users simultaneously | Two contexts, each with its own `storageState` |
| Test new tab / popup | `Promise.all([context.waitForEvent('page'), page.click(...)])` |
| Test mobile and desktop | Two Playwright projects with different `devices` config |
| Mock an API for specific test | `context.route()` before `page.goto()` |
| Test permission denied state | `newContext()` without granting permissions |
| Debug a failing test | `PWDEBUG=1` for inspector, `trace: 'retain-on-failure'` for post-run |
| Inspect context cookies in CI | `context.cookies()` and `console.log` in test code |

> 📌 **Final Note:** The Browser → Context → Page hierarchy is Playwright's most powerful architectural feature. Mastering it — especially knowing when to use multiple pages (same session, different views) versus multiple contexts (different sessions, different users) — is what separates reliable, fast test suites from fragile, slow ones.

---

*Reference: [Playwright Docs – Browser](https://playwright.dev/docs/api/class-browser) • [Playwright Docs – BrowserContext](https://playwright.dev/docs/api/class-browsercontext) • [Playwright Docs – Page](https://playwright.dev/docs/api/class-page) • [Playwright Docs – Parallelism](https://playwright.dev/docs/test-parallel)*
